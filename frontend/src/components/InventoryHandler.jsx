import { useState } from "react";
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
      return true;
    } catch (err) {
      setMessage(err.message);
      return false;
    }
  }

  return {
    handleAdd: (cardId) => handleChange(addToInventory, cardId, "Carta agregada al inventario."),
    handleRemove: (cardId) => handleChange(removeFromInventory, cardId, "Se quitó una copia de la carta."),
  };
}

// Presenta las cartas existentes en el inventario junto con sus cantidades.
function InventoryHandler({ cards, inventory, decks, onRemove, onAddToDeck }) {
  const [showSetProgress, setShowSetProgress] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedDeckId, setSelectedDeckId] = useState("");

  // Une cada registro del inventario con los datos completos de su carta.
  const inventoryCards = inventory
    .map((item) => {
      const card = cards.find((candidate) => candidate.id === item.cardId);
      return card ? { ...card, quantity: item.quantity } : null;
    })
    .filter(Boolean);

  // Cuenta cartas distintas por expansión para medir el progreso de colección.
  const ownedCardIds = new Set(inventory.map((item) => item.cardId));
  const setProgress = cards.reduce((sets, card) => {
    const setName = card.expansion || card.set_id || "Set desconocido";
    if (!sets[setName]) sets[setName] = { total: 0, owned: 0 };
    sets[setName].total += 1;
    if (ownedCardIds.has(card.id)) sets[setName].owned += 1;
    return sets;
  }, {});

  return (
    <>
      <h2>Mi inventario</h2>
      <button
        type="button"
        className="clear-button set-progress-toggle"
        aria-expanded={showSetProgress}
        onClick={() => setShowSetProgress((visible) => !visible)}
      >
        Cartas por set
      </button>
      {showSetProgress && (
        <ul className="set-progress-list">
          {Object.entries(setProgress)
            .sort(([setA], [setB]) => setA.localeCompare(setB))
            .map(([setName, progress]) => (
              <li key={setName}>
                {setName}: {progress.owned}/{progress.total}
              </li>
            ))}
        </ul>
      )}
      {inventoryCards.length === 0 && <p>Aún no tienes cartas en tu inventario.</p>}
      <section className="card-grid">
        {inventoryCards.map((card) => (
          <CardLayout key={card.id} card={card} quantity={card.quantity}
            actionLabel="Quitar una copia" onAction={() => onRemove(card.id)}
            secondaryActionLabel="Añadir a mazo"
            onSecondaryAction={() => {
              setSelectedCard(card);
              setSelectedDeckId(decks[0] ? String(decks[0].id) : "");
            }} />
        ))}
      </section>
      {selectedCard && (
        <div className="deck-dialog-backdrop" role="presentation" onClick={() => setSelectedCard(null)}>
          <section className="deck-dialog" role="dialog" aria-modal="true" aria-labelledby="add-card-title"
            onClick={(event) => event.stopPropagation()}>
            <h3 id="add-card-title">Añadir {selectedCard.name} a un mazo</h3>
            {decks.length > 0 ? (
              <>
                <label htmlFor="target-deck">Elige un mazo</label>
                <select id="target-deck" value={selectedDeckId} onChange={(event) => setSelectedDeckId(event.target.value)}>
                  {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
                </select>
                <div className="deck-dialog-actions">
                  <button type="button" className="card-action"
                    onClick={async () => {
                      const added = await onAddToDeck(Number(selectedDeckId), selectedCard.id);
                      if (added) setSelectedCard(null);
                    }}>
                    Añadir a mazo
                  </button>
                  <button type="button" className="deck-cancel-button" onClick={() => setSelectedCard(null)}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <p>Aún no tienes mazos. Crea uno desde la sección “Mazos” y vuelve aquí.</p>
                <button type="button" className="deck-cancel-button" onClick={() => setSelectedCard(null)}>Cerrar</button>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default InventoryHandler;
