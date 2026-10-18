const API_URL = "http://localhost:8000";

export async function getCards() {
  const response = await fetch(`${API_URL}/api/cards`);

  if (!response.ok) {
    throw new Error("No fue posible obtener las tarjetas");
  }

  return await response.json();
}
