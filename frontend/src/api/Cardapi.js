async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? `Error HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export function getCards() {
  return apiRequest("/api/cards");
}

export async function getMe() {
  const result = await apiRequest("/api/me");
  return result.user;
}

export function getInventory() {
  return apiRequest("/api/inventory");
}

export function addToInventory(cardId) {
  return apiRequest("/api/inventory", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cardId }),
  });
}

export function removeFromInventory(cardId) {
  return apiRequest(`/api/inventory/${encodeURIComponent(cardId)}`, {
    method: "DELETE",
  });
}

export function logout() {
  return apiRequest("/auth/logout", { method: "POST" });
}