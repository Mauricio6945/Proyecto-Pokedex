import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@^6";


const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const FRONTEND_ORIGIN = Deno.env.get("FRONTEND_ORIGIN") ?? "http://localhost:5173";
const REDIRECT_URI = `${FRONTEND_ORIGIN}/auth/google/callback`;
const SECURE_COOKIE = FRONTEND_ORIGIN.startsWith("https://");
const SESSION_SECONDS = 7 * 24 * 60 * 60;

//Error cuando no se encuentran las variables de entorno GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en backend/.env");
}

const dataPath = new URL("./pokemon.json", import.meta.url);
const dbPath = fileURLToPath(new URL("./pokedex.db", import.meta.url));
const db = new DatabaseSync(dbPath);

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
`);

type User = { id: string; name: string; email: string; picture: string | null };
type InventoryRow = { cardId: string; quantity: number };
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const entry = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : null;
}

function makeCookie(name: string, value: string, maxAge: number, path = "/"): string {
  return `${name}=${value}; Max-Age=${maxAge}; Path=${path}; HttpOnly; SameSite=Lax${SECURE_COOKIE ? "; Secure" : ""}`;
}

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

async function readCards(): Promise<Array<{ id: string }>> {
  return JSON.parse(await Deno.readTextFile(dataPath));
}

function unauthenticated(): Response {
  return Response.json({ error: "Debes iniciar sesión" }, { status: 401 });
}

function checkOrigin(request: Request): boolean {
  return request.headers.get("origin") === FRONTEND_ORIGIN;
}

async function cardsHandler(_request: Request): Promise<Response> {
  const fileContents = await Deno.readTextFile(dataPath);
  const cards = JSON.parse(fileContents);

  return Response.json(cards, {
    headers: {
      "access-control-allow-origin": "*",
    },
  });
}

Deno.serve({ port: 8000 }, async (request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (request.method === "GET" && path === "/api/cards") {
      return Response.json(await readCards());
    }
// Paso 1: enviar al usuario a Google.
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

      const headers = new Headers({ location: googleUrl.toString() });
      headers.append("set-cookie", makeCookie("oauth_state", state, 600, "/auth/google/callback"));
      headers.append("set-cookie", makeCookie("oauth_nonce", nonce, 600, "/auth/google/callback"));
      return new Response(null, { status: 302, headers });
    }

    // Paso 2: Google devuelve un código; el backend lo comprueba.
    if (request.method === "GET" && path === "/auth/google/callback") {
      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const expectedState = getCookie(request, "oauth_state");
      const expectedNonce = getCookie(request, "oauth_nonce");

      if (!state || !code || !expectedState || !expectedNonce || state !== expectedState) {
        return Response.json({ error: "Login cancelado o verificación de estado fallida" }, { status: 400 });
      }

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

      const name = typeof payload.name === "string" ? payload.name : payload.email;
      const picture = typeof payload.picture === "string" ? payload.picture : null;
      db.prepare(`
        INSERT INTO users (google_id, name, email, picture) VALUES (?, ?, ?, ?)
        ON CONFLICT(google_id) DO UPDATE SET
          name = excluded.name, email = excluded.email, picture = excluded.picture
      `).run(payload.sub, name, payload.email, picture);

      const sessionId = randomToken();
      db.prepare("INSERT INTO sessions (session_hash, google_id, expires_at) VALUES (?, ?, ?)")
        .run(hashToken(sessionId), payload.sub, Date.now() + SESSION_SECONDS * 1000);

      const headers = new Headers({ location: "/" });
      headers.append("set-cookie", makeCookie("oauth_state", "", 0, "/auth/google/callback"));
      headers.append("set-cookie", makeCookie("oauth_nonce", "", 0, "/auth/google/callback"));
      headers.append("set-cookie", makeCookie("pokedex_session", sessionId, SESSION_SECONDS));
      return new Response(null, { status: 302, headers });
    }

    // Saber si el usuario ha iniciado sesión.
    if (request.method === "GET" && path === "/api/me") {
      return Response.json({ user: getUser(request) });
    }

    // Evitar solicitudes de escritura iniciadas desde otros orígenes.
    if (["POST", "DELETE", "PUT", "PATCH"].includes(request.method) && !checkOrigin(request)) {
      return Response.json({ error: "Origen de solicitud no autorizado" }, { status: 403 });
    }

    if (request.method === "POST" && path === "/auth/logout") {
      const sessionId = getCookie(request, "pokedex_session");
      if (sessionId) {
        db.prepare("DELETE FROM sessions WHERE session_hash = ?").run(hashToken(sessionId));
      }
      const headers = new Headers();
      headers.append("set-cookie", makeCookie("pokedex_session", "", 0));
      return new Response(null, { status: 204, headers });
    }

    // Los tres endpoints de inventario son PRIVADOS.
    if (path === "/api/inventory" || path.startsWith("/api/inventory/")) {
      const user = getUser(request);
      if (!user) return unauthenticated();

      if (request.method === "GET" && path === "/api/inventory") {
        const items = db.prepare(`
          SELECT card_id AS cardId, quantity
          FROM inventory WHERE google_id = ? ORDER BY card_id
        `).all(user.id) as InventoryRow[];
        return Response.json(items);
      }

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

    return Response.json({ error: "Endpoint no encontrado" }, { status: 404 });
  } catch (error) {
    console.error("Error del servidor:", error);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
   }
});

console.log("API en http://localhost:8000");
