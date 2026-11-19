// Cliente HTTP compartido: normaliza respuestas vacias y errores de la API.
async function apiRequest(url, options = {}) {
  // Ejecuta la solicitud y convierte los errores HTTP en mensajes reutilizables.
  const response = await fetch(url, options);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? `Error HTTP ${response.status}`);
  }
  // Las respuestas 204 no contienen un cuerpo JSON que pueda leerse.
  if (response.status === 204) return null;
  return response.json();
}

// Obtiene el catalogo publico de cartas.
export function getCards() {
  return apiRequest("/api/cards");
}

// Consulta la sesion activa y devuelve solo el usuario autenticado.
export async function getMe() {
  const result = await apiRequest("/api/me");
  return result.user;
}

// Lee todas las cartas guardadas en el inventario del usuario.
export function getInventory() {
  return apiRequest("/api/inventory");
}

// Consulta el historial de compras y ventas del usuario autenticado.
export function getHistory() {
  return apiRequest("/api/history");
}

// Agrega una copia de la carta seleccionada al inventario.
export function addToInventory(cardId) {
  return apiRequest("/api/inventory", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cardId }),
  });
}

// Elimina una copia identificada por su ID, codificado de forma segura en la URL.
export function removeFromInventory(cardId) {
  return apiRequest(`/api/inventory/${encodeURIComponent(cardId)}`, {
    method: "DELETE",
  });
}

// Define cuántas copias propias de una carta están disponibles para intercambio.
export function updateTradeAvailable(cardId, tradeAvailable) {
  return apiRequest(`/api/inventory/${encodeURIComponent(cardId)}/trade-available`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tradeAvailable }),
  });
}

// Obtiene los mazos del usuario junto con las cartas que contiene cada uno.
export function getDecks() {
  return apiRequest("/api/decks");
}

// Crea un mazo personal con el nombre indicado.
export function createDeck(name) {
  return apiRequest("/api/decks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

// Añade una copia de una carta a uno de los mazos del usuario.
export function addCardToDeck(deckId, cardId) {
  return apiRequest(`/api/decks/${encodeURIComponent(deckId)}/cards`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cardId }),
  });
}

// Cambia el nombre de un mazo existente.
export function renameDeck(deckId, name) {
  return apiRequest(`/api/decks/${encodeURIComponent(deckId)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

// Elimina un mazo del usuario y las cartas asociadas.
export function deleteDeck(deckId) {
  return apiRequest(`/api/decks/${encodeURIComponent(deckId)}`, { method: "DELETE" });
}

// Quita todas las copias de una carta dentro de un mazo.
export function removeCardFromDeck(deckId, cardId) {
  return apiRequest(
    `/api/decks/${encodeURIComponent(deckId)}/cards/${encodeURIComponent(cardId)}`,
    { method: "DELETE" },
  );
}

// Finaliza la sesion del usuario en el backend.
export function logout() {
  return apiRequest("/auth/logout", { method: "POST" });
}
