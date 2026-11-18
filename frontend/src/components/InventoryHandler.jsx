import { addToInventory, getInventory, removeFromInventory } from "../api/Cardapi";
import CardLayout from "./CardLayout";

// Centraliza las operaciones de modificacion y recarga del inventario.
export function useInventoryHandler({ setInventory, setMessage }) {
  // Consulta el inventario actualizado y reemplaza el estado compartido.
  async function refreshInventory() {
    setInventory(await getInventory());
  }

  // Ejecuta una operacion y muestra su resultado o el error producido.
  async function handleChange(operation, cardId, successMessage) {
    try {
      setMessage("");
      await operation(cardId);
      await refreshInventory();
      setMessage(successMessage);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return {
    handleAdd: (cardId) => handleChange(addToInventory, cardId, "Carta agregada al inventario."),
    handleRemove: (cardId) => handleChange(removeFromInventory, cardId, "Se quitó una copia de la carta."),
  };
}

// Presenta las cartas existentes en el inventario junto con sus cantidades.
function InventoryHandler({ cards, inventory, onRemove }) {
  // Une cada registro del inventario con los datos completos de su carta.
  const inventoryCards = inventory
    .map((item) => {
      const card = cards.find((candidate) => candidate.id === item.cardId);
      return card ? { ...card, quantity: item.quantity } : null;
    })
    .filter(Boolean);

  return (
    <>
      <h2>Mi inventario</h2>
      {inventoryCards.length === 0 && <p>Aún no tienes cartas en tu inventario.</p>}
      <section className="card-grid">
        {inventoryCards.map((card) => (
          <CardLayout key={card.id} card={card} quantity={card.quantity}
            actionLabel="Quitar una copia" onAction={() => onRemove(card.id)} />
        ))}
      </section>
    </>
  );
}

export default InventoryHandler;
