import { useEffect, useState } from "react";
import { addToInventory, getCards, getHistory, getInventory, removeFromInventory, updateTradeAvailable } from "../api/Cardapi";
import CardLayout from "./CardLayout";
import GroupedCardGrid from "./GroupedCardGrid";
import { useI18n } from "../i18n";

// Centraliza las operaciones de modificacion y recarga del inventario.
export function useInventoryHandler({ setInventory, setCards, setHistory, setMessage, t, translateError }) {
  // Consulta el inventario actualizado y reemplaza el estado compartido.
  async function refreshInventory() {
    const [updatedInventory, updatedCards, updatedHistory] = await Promise.all([
      getInventory(), getCards(), getHistory(),
    ]);
    setInventory(updatedInventory);
    setCards(updatedCards);
    setHistory(updatedHistory);
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
      if (operation === addToInventory) {
        try {
          setCards(await getCards());
        } catch {
          // Conserva el error original si tampoco se puede actualizar el catálogo.
        }
      }
      setMessage(translateError(err.message));
      return false;
    }
  }

  async function handleSetTradeAvailable(cardId, tradeAvailable) {
    try {
      setMessage("");
      await updateTradeAvailable(cardId, tradeAvailable);
      await refreshInventory();
      setMessage(t("tradeAvailabilityUpdated"));
      return true;
    } catch (err) {
      setMessage(translateError(err.message));
      return false;
    }
  }

  return {
    handleAdd: (cardId) => handleChange(addToInventory, cardId, t("cardAdded")),
    handleRemove: (cardId) => handleChange(removeFromInventory, cardId, t("cardRemoved")),
    handleSetTradeAvailable,
  };
}

function TradeAvailabilityControl({ card, onSave }) {
  const { t } = useI18n();
  // Mantiene el valor editable separado del dato original hasta guardar.
  const [value, setValue] = useState(String(card.tradeAvailable));
  const [saving, setSaving] = useState(false);
  const numericValue = Number(value);
  const valid = value !== "" && Number.isInteger(numericValue) &&
    numericValue >= 0 && numericValue <= card.amount;

  useEffect(() => {
    setValue(String(card.tradeAvailable));
  }, [card.id, card.tradeAvailable]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!valid || saving || numericValue === card.tradeAvailable) return;
    setSaving(true);
    await onSave(card.id, numericValue);
    setSaving(false);
  }

  return (
    <form className="trade-availability-control" onSubmit={handleSubmit}>
      <label htmlFor={`trade-available-${card.id}`}>{t("tradeCopies")}</label>
      <div className="trade-availability-input-row">
        <input id={`trade-available-${card.id}`} type="number" min="0" max={card.amount} step="1"
          value={value} onChange={(event) => setValue(event.target.value)} />
        <span>{t("ofTotal", { count: card.amount })}</span>
      </div>
      <button type="submit" className="trade-save-button" disabled={!valid || saving || numericValue === card.tradeAvailable}>
        {saving ? t("saving") : t("saveTradeAvailability")}
      </button>
    </form>
  );
}

// Presenta las cartas existentes en el inventario junto con sus cantidades.
function InventoryHandler({ cards, inventory, decks, onRemove, onAddToDeck, onSetTradeAvailable }) {
  const { t } = useI18n();
  const [showSetProgress, setShowSetProgress] = useState(false);
  const [expandedMissingSets, setExpandedMissingSets] = useState(() => new Set());
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedDeckId, setSelectedDeckId] = useState("");

  // Une cada registro del inventario con los datos completos de su carta.
  const inventoryCards = inventory
    .map((item) => {
      const card = cards.find((candidate) => candidate.id === item.cardId);
      const amount = item.amount ?? item.quantity;
      return card ? {
        ...card,
        quantity: amount,
        amount,
        tradeAvailable: item.tradeAvailable ?? item.trade_available ?? 0,
        circulationAmount: card.amount,
        circulationAvailable: card.trade_available,
      } : null;
    })
    .filter(Boolean);

  // Cuenta cartas distintas por expansión para medir el progreso de colección.
  const ownedCardIds = new Set(inventory.map((item) => item.cardId));
  const setProgress = cards.reduce((sets, card) => {
    const setName = card.expansion || card.set_id || t("unknownSet");
    if (!sets[setName]) sets[setName] = { total: 0, owned: 0, missing: [] };
    sets[setName].total += 1;
    if (ownedCardIds.has(card.id)) sets[setName].owned += 1;
    else sets[setName].missing.push(card);
    return sets;
  }, {});

  return (
    <>
      <h2>{t("inventoryTitle")}</h2>
      <button
        type="button"
        className="clear-button set-progress-toggle"
        aria-expanded={showSetProgress}
        onClick={() => setShowSetProgress((visible) => !visible)}
      >
        {t("cardsBySet")}
      </button>
      {showSetProgress && (
        <ul className="set-progress-list">
          {Object.entries(setProgress)
            .sort(([setA], [setB]) => setA.localeCompare(setB))
            .map(([setName, progress]) => (
              <li className="set-progress-item" key={setName}>
                <div className="set-progress-heading">
                  <span>{setName}: {progress.owned}/{progress.total}</span>
                  <button
                    type="button"
                    className="set-missing-toggle"
                    aria-expanded={expandedMissingSets.has(setName)}
                    onClick={() => setExpandedMissingSets((current) => {
                      const next = new Set(current);
                      if (next.has(setName)) next.delete(setName);
                      else next.add(setName);
                      return next;
                    })}
                  >
                    {t(expandedMissingSets.has(setName) ? "hideMissingCards" : "showMissingCards", { count: progress.missing.length })}
                  </button>
                </div>
                {expandedMissingSets.has(setName) && (
                  progress.missing.length > 0 ? (
                    <ul className="set-missing-list">
                      {progress.missing
                        .sort((cardA, cardB) => (cardA.name || "").localeCompare(cardB.name || ""))
                        .map((card) => <li key={card.id}>{card.name}</li>)}
                    </ul>
                  ) : <p className="set-all-collected">{t("allSetCardsOwned")}</p>
                )}
              </li>
            ))}
        </ul>
      )}
      {inventoryCards.length === 0 && <p>{t("noInventory")}</p>}
      <GroupedCardGrid cards={inventoryCards} renderCard={(card) => (
          <div className="inventory-card-entry" key={card.id}>
            <CardLayout card={card} quantity={card.amount}
              actionLabel={t("removeCopy")} onAction={() => onRemove(card.id)}
              secondaryActionLabel={t("addToDeck")}
              onSecondaryAction={() => {
                setSelectedCard(card);
                setSelectedDeckId(decks[0] ? String(decks[0].id) : "");
              }} />
            <TradeAvailabilityControl card={card} onSave={onSetTradeAvailable} />
          </div>
      )} />
      {selectedCard && (
        <div className="deck-dialog-backdrop" role="presentation" onClick={() => setSelectedCard(null)}>
          <section className="deck-dialog" role="dialog" aria-modal="true" aria-labelledby="add-card-title"
            onClick={(event) => event.stopPropagation()}>
            <h3 id="add-card-title">{t("addCardToDeckTitle", { name: selectedCard.name })}</h3>
            {decks.length > 0 ? (
              <>
                <label htmlFor="target-deck">{t("chooseDeck")}</label>
                <select id="target-deck" value={selectedDeckId} onChange={(event) => setSelectedDeckId(event.target.value)}>
                  {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
                </select>
                <div className="deck-dialog-actions">
                  <button type="button" className="card-action"
                    onClick={async () => {
                      const added = await onAddToDeck(Number(selectedDeckId), selectedCard.id);
                      if (added) setSelectedCard(null);
                    }}>
                    {t("addToDeck")}
                  </button>
                  <button type="button" className="deck-cancel-button" onClick={() => setSelectedCard(null)}>{t("cancel")}</button>
                </div>
              </>
            ) : (
              <>
                <p>{t("noDecksForCard")}</p>
                <button type="button" className="deck-cancel-button" onClick={() => setSelectedCard(null)}>{t("close")}</button>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default InventoryHandler;
