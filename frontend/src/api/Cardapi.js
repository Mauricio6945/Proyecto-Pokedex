// Cliente HTTP compartido: normaliza respuestas vacias y errores de la API.
async function apiRequest(url, options = {}) {
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

// Finaliza la sesion del usuario en el backend.
export function logout() {
  return apiRequest("/auth/logout", { method: "POST" });
}