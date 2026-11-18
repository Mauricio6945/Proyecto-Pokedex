import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@^6";

//Configuración principal del servidor y credenciales de autenticación con Google.
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const FRONTEND_ORIGIN = (Deno.env.get("FRONTEND_ORIGIN") ?? "http://localhost:5173").replace(/\/$/, "");
const REDIRECT_URI = `${FRONTEND_ORIGIN}/auth/google/callback`;
const SECURE_COOKIE = FRONTEND_ORIGIN.startsWith("https://");
const SESSION_SECONDS = 7 * 24 * 60 * 60;

//Se valida que las variables de entorno necesarias existan antes de iniciar la API.
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en backend/.env");
}

//Rutas de archivos de datos y base de SQLite.
const dataPath = new URL("./pokemon.json", import.meta.url);
const dbPath = Deno.env.get("POKEDEX_DB_PATH") ?? fileURLToPath(new URL("./pokedex.db", import.meta.url));
const db = new DatabaseSync(dbPath);

//Inicialización del esquema de base de datos con las tablas de usuarios, sesiones y inventario.
//Usando un formato SQL
db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    google_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    picture TEXT
  );
  CREATE TABLE IF NOT EXISTS sessions (
    session_hash TEXT PRIMARY KEY,
    google_id TEXT NOT NULL REFERENCES users(google_id),
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS inventory (
    google_id TEXT NOT NULL REFERENCES users(google_id),
    card_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    PRIMARY KEY (google_id, card_id)
  );
  CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT NOT NULL REFERENCES users(google_id),
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE (google_id, name)
  );
  CREATE TABLE IF NOT EXISTS deck_cards (
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    PRIMARY KEY (deck_id, card_id)
  );
`);

// Tipos auxiliares para trabajar con información del usuario y del inventario.
type User = { id: string; name: string; email: string; picture: string | null };
type InventoryRow = { cardId: string; quantity: number };

// Conjunto de claves públicas de Google para verificar los JWT emitidos durante el login OAuth.
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

//Genera un token aleatorio para el estado OAuth y la sesión del usuario.
function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

//Genera un hash seguro del token para almacenarlo en la base de datos sin guardar el valor original.
function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

//Obtiene el valor de una cookie a partir del encabezado HTTP de la solicitud.
function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const entry = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}

//Crea un cookie HTTP con los parámetros de seguridad necesarios para la sesión y OAuth.
function makeCookie(name: string, value: string, maxAge: number, path = "/"): string {
  return `${name}=${value}; Max-Age=${maxAge}; Path=${path}; HttpOnly; SameSite=Lax${SECURE_COOKIE ? "; Secure" : ""}`;
}

//Recupera el usuario autenticado a partir de la sesión guardada en la cookie.
function getUser(request: Request): User | null {
  const sessionId = getCookie(request, "pokedex_session");

  if (!sessionId) return null;

  const row = db.prepare(`
    SELECT u.google_id AS id, u.name, u.email, u.picture
    FROM sessions AS s
    JOIN users AS u ON u.google_id = s.google_id
    WHERE s.session_hash = ? AND s.expires_at > ?
  `).get(hashToken(sessionId), Date.now());

  return (row as User | undefined) ?? null;
}

//Lee el archivo JSON con la información de las cartas disponibles en la aplicación.
async function readCards(): Promise<Array<{ id: string }>> {
  return JSON.parse(await Deno.readTextFile(dataPath));
}

//Respuesta reutilizable para endpoints protegidos cuando el usuario no autenticado intenta acceder.
function unauthenticated(): Response {
  return Response.json({ error: "Debes iniciar sesión" }, { status: 401 });
}

//Verifica que la solicitud provenga del origen permitido del frontend.
function checkOrigin(request: Request): boolean {
  return request.headers.get("origin") === FRONTEND_ORIGIN;
}

//Handler auxiliar para servir la colección de cartas del archivo JSON.
async function cardsHandler(_request: Request): Promise<Response> {
  const fileContents = await Deno.readTextFile(dataPath);
  const cards = JSON.parse(fileContents);

  return Response.json(cards, {
    headers: {
      "access-control-allow-origin": "*",
    },
  });
}

//Punto de entrada principal: recibe cada solicitud HTTP y despacha a la ruta apropiada.
const port = Number(Deno.env.get("PORT") ?? "8000");
Deno.serve({ hostname: "0.0.0.0", port }, async (request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    //Endpoint de estado: útil para verificar que el backend desplegado responde.
    if (request.method === "GET" && path === "/api/health") {
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }

    //Endpoint público para devolver el catálogo de cartas disponible.
    if (request.method === "GET" && path === "/api/cards") {
      return Response.json(await readCards());
    }

    //Paso 1 del flujo OAuth con Google: redirigir al usuario a la pantalla de consentimento.
    if (request.method === "GET" && path === "/auth/google") {
      const state = randomToken();
      const nonce = randomToken();
      const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      googleUrl.search = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "openid email profile",
        state,
        nonce,
      }).toString();

      //Se guardan state y nonce como cookies para verificar el callback y evitar ataques CSRF.
      const headers = new Headers({ location: googleUrl.toString() });
      headers.append("set-cookie", makeCookie("oauth_state", state, 600, "/auth/google/callback"));
      headers.append("set-cookie", makeCookie("oauth_nonce", nonce, 600, "/auth/google/callback"));
      return new Response(null, { status: 302, headers });
    }

    //Paso 2 del flujo OAuth: Google responde con el código de autorización y el backend lo intercambia por un token.
    if (request.method === "GET" && path === "/auth/google/callback") {
      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const expectedState = getCookie(request, "oauth_state");
      const expectedNonce = getCookie(request, "oauth_nonce");

      //Validacion basica del callback para asegurar que la respuesta corresponde a esta sesion.
      if (!state || !code || !expectedState || !expectedNonce || state !== expectedState) {
        return Response.json({ error: "Login cancelado o verificación de estado fallida" }, { status: 400 });
      }

      //Se solicita el token de acceso a Google con el codigo recibido.
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenResponse.ok) {
        return Response.json({ error: "Google rechazó el código de autorización" }, { status: 401 });
      }

      const tokens = await tokenResponse.json();
      if (typeof tokens.id_token !== "string") {
        return Response.json({ error: "Falta el token de identidad" }, { status: 401 });
      }

      //Verificacion del JWT con la clave publica de Google para confirmar identidad y audiencia.
      const { payload } = await jwtVerify(tokens.id_token, googleKeys, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: GOOGLE_CLIENT_ID,
        algorithms: ["RS256"],
      });
      if (
        payload.nonce !== expectedNonce ||
        typeof payload.sub !== "string" ||
        typeof payload.email !== "string" ||
        payload.email_verified !== true
      ) {
        return Response.json({ error: "La identidad de Google no es válida" }, { status: 401 });
      }

      //Se guarda o actualiza el usuario en la base de datos con la informacion recibida de Google.
      const name = typeof payload.name === "string" ? payload.name : payload.email;
      const picture = typeof payload.picture === "string" ? payload.picture : null;
      db.prepare(`
        INSERT INTO users (google_id, name, email, picture) VALUES (?, ?, ?, ?)
        ON CONFLICT(google_id) DO UPDATE SET
          name = excluded.name, email = excluded.email, picture = excluded.picture
      `).run(payload.sub, name, payload.email, picture);

      //Se crea una sesion local para mantener la autenticacion del usuario en el navegador.
      const sessionId = randomToken();
      db.prepare("INSERT INTO sessions (session_hash, google_id, expires_at) VALUES (?, ?, ?)")
        .run(hashToken(sessionId), payload.sub, Date.now() + SESSION_SECONDS * 1000);

      //Limpia los cookies temporales de OAuth y deja solo la sesion valida del usuario.
      const headers = new Headers({ location: "/" });
      headers.append("set-cookie", makeCookie("oauth_state", "", 0, "/auth/google/callback"));
      headers.append("set-cookie", makeCookie("oauth_nonce", "", 0, "/auth/google/callback"));
      headers.append("set-cookie", makeCookie("pokedex_session", sessionId, SESSION_SECONDS));
      return new Response(null, { status: 302, headers });
    }

    //Devuelve el usuario actual si existe una sesion valida en las cookies.
    if (request.method === "GET" && path === "/api/me") {
      return Response.json({ user: getUser(request) }, { headers: { "Cache-Control": "no-store" } });
    }

    //Protege los metodos de escritura para que no sean enviados desde un origen no autorizado.
    if (["POST", "DELETE", "PUT", "PATCH"].includes(request.method) && !checkOrigin(request)) {
      return Response.json({ error: "Origen de solicitud no autorizado" }, { status: 403 });
    }

    //Cierra la sesion actual eliminando su registro en la base de datos y la cookie del navegador.
    if (request.method === "POST" && path === "/auth/logout") {
      const sessionId = getCookie(request, "pokedex_session");
      if (sessionId) {
        db.prepare("DELETE FROM sessions WHERE session_hash = ?").run(hashToken(sessionId));
      }
      const headers = new Headers();
      headers.append("set-cookie", makeCookie("pokedex_session", "", 0));
      return new Response(null, { status: 204, headers });
    }

    // Rutas protegidas para consultar y administrar los mazos del usuario.
    if (path === "/api/decks" || path.startsWith("/api/decks/")) {
      const user = getUser(request);
      if (!user) return unauthenticated();

      if (request.method === "GET" && path === "/api/decks") {
        const decks = db.prepare(
          "SELECT id, name FROM decks WHERE google_id = ? ORDER BY created_at, id",
        ).all(user.id) as Array<{ id: number; name: string }>;
        const deckCards = db.prepare(`
          SELECT dc.deck_id AS deckId, dc.card_id AS cardId, dc.quantity
          FROM deck_cards AS dc
          JOIN decks AS d ON d.id = dc.deck_id
          WHERE d.google_id = ? ORDER BY dc.deck_id, dc.card_id
        `).all(user.id) as Array<{ deckId: number; cardId: string; quantity: number }>;
        return Response.json(decks.map((deck) => ({
          ...deck,
          cards: deckCards.filter((card) => card.deckId === deck.id)
            .map(({ cardId, quantity }) => ({ cardId, quantity })),
        })), { headers: { "Cache-Control": "no-store" } });
      }

      if (request.method === "POST" && path === "/api/decks") {
        const body = await request.json().catch(() => null);
        const name = body && typeof body === "object" && "name" in body &&
            typeof body.name === "string" ? body.name.trim() : "";
        if (!name || name.length > 60) {
          return Response.json({ error: "El nombre debe tener entre 1 y 60 caracteres" }, { status: 400 });
        }
        try {
          const result = db.prepare(
            "INSERT INTO decks (google_id, name) VALUES (?, ?)",
          ).run(user.id, name);
          return Response.json({ id: Number(result.lastInsertRowid), name, cards: [] }, { status: 201 });
        } catch (error) {
          if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
            return Response.json({ error: "Ya tienes un mazo con ese nombre" }, { status: 409 });
          }
          throw error;
        }
      }

      const deckCardsPath = path.match(/^\/api\/decks\/(\d+)\/cards$/);
      if (request.method === "POST" && deckCardsPath) {
        const deckId = Number(deckCardsPath[1]);
        const deck = db.prepare(
          "SELECT id FROM decks WHERE id = ? AND google_id = ?",
        ).get(deckId, user.id);
        if (!deck) return Response.json({ error: "Mazo no encontrado" }, { status: 404 });

        const body = await request.json().catch(() => null);
        const cardId = body && typeof body === "object" && "cardId" in body &&
            typeof body.cardId === "string" ? body.cardId : null;
        if (!cardId || !(await readCards()).some((card) => card.id === cardId)) {
          return Response.json({ error: "Carta no válida" }, { status: 400 });
        }
        const owned = db.prepare(
          "SELECT quantity FROM inventory WHERE google_id = ? AND card_id = ?",
        ).get(user.id, cardId) as { quantity: number } | undefined;
        if (!owned) return Response.json({ error: "La carta no está en tu inventario" }, { status: 400 });

        const inDeck = db.prepare(
          "SELECT quantity FROM deck_cards WHERE deck_id = ? AND card_id = ?",
        ).get(deckId, cardId) as { quantity: number } | undefined;
        if ((inDeck?.quantity ?? 0) >= owned.quantity) {
          return Response.json({ error: "Este mazo ya contiene todas las copias que tienes de esta carta" }, { status: 400 });
        }

        db.prepare(`
          INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (?, ?, 1)
          ON CONFLICT(deck_id, card_id) DO UPDATE SET quantity = quantity + 1
        `).run(deckId, cardId);
        return Response.json({ message: "Carta añadida al mazo" }, { status: 201 });
      }
    }

    //Coleccion de rutas protegidas para consultar y modificar el inventario del usuario autenticado.
    if (path === "/api/inventory" || path.startsWith("/api/inventory/")) {
      const user = getUser(request);
      if (!user) return unauthenticated();

      // Obtiene la colección completa del usuario, ordenada por ID de carta.
      // Usando un operaciones SQL
      if (request.method === "GET" && path === "/api/inventory") {
        const items = db.prepare(`
          SELECT card_id AS cardId, quantity
          FROM inventory WHERE google_id = ? ORDER BY card_id 
        `).all(user.id) as InventoryRow[];
        return Response.json(items, { headers: { "Cache-Control": "no-store" } });
      }

      // Agrega una nueva carta al inventario del usuario o aumenta su cantidad si ya existe.
      if (request.method === "POST" && path === "/api/inventory") {
        const body = await request.json().catch(() => null);
        const cardId = body && typeof body === "object" && "cardId" in body &&
            typeof body.cardId === "string" ? body.cardId : null;
        if (!cardId || !(await readCards()).some((card) => card.id === cardId)) {
          return Response.json({ error: "Carta no válida" }, { status: 400 });
        }
        db.prepare(`
          INSERT INTO inventory (google_id, card_id, quantity) VALUES (?, ?, 1)
          ON CONFLICT(google_id, card_id) DO UPDATE SET quantity = quantity + 1
        `).run(user.id, cardId);
        return Response.json({ message: "Carta agregada" }, { status: 201 });
      }

      //Elimina una unidad de la carta indicada; si llega a cero, se borra del inventario.
      if (request.method === "DELETE" && path.startsWith("/api/inventory/")) {
        const cardId = decodeURIComponent(path.slice("/api/inventory/".length));
        const row = db.prepare(
          "SELECT quantity FROM inventory WHERE google_id = ? AND card_id = ?",
        ).get(user.id, cardId) as { quantity: number } | undefined;
        if (!row) return Response.json({ error: "Carta no encontrada" }, { status: 404 });

        if (row.quantity > 1) {
          db.prepare("UPDATE inventory SET quantity = quantity - 1 WHERE google_id = ? AND card_id = ?")
            .run(user.id, cardId);
        } else {
          db.prepare("DELETE FROM inventory WHERE google_id = ? AND card_id = ?")
            .run(user.id, cardId);
        }
        return new Response(null, { status: 204 });
      }
    }

    //Ruta por defecto para errores de URL no implementada.
    return Response.json({ error: "Endpoint no encontrado" }, { status: 404 });
  } catch (error) {
    //Captura errores inesperados y responde con un 500 para no filtrar detalles internos.
    console.error("Error del servidor:", error);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
});

//Mensaje de arranque del servidor (API escucha)
console.log(`API escuchando en 0.0.0.0:${port}`);
