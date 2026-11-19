import { useState } from "react";
import CardLayout from "./CardLayout";
import { useI18n } from "../i18n";

// Permite crear mazos y muestra las cartas que contiene cada uno.
function DeckHandler({ decks, cards, onCreateDeck, onRenameDeck, onDeleteDeck, onRemoveCard }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState(null);
  const [editedName, setEditedName] = useState("");

  // Valida el formulario, crea el mazo y limpia el campo tras una operación exitosa.
  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    const created = await onCreateDeck(name.trim());
    if (created) setName("");
    setCreating(false);
  }

  async function handleRename(event, deckId) {
    event.preventDefault();
    if (!editedName.trim()) return;
    const renamed = await onRenameDeck(deckId, editedName.trim());
    if (renamed) {
      setEditingDeckId(null);
      setEditedName("");
    }
  }

  function beginRename(deck) {
    setEditingDeckId(deck.id);
    setEditedName(deck.name);
  }

  return (
    <section className="decks-page">
      <h2>{t("decksTitle")}</h2>
      <form className="deck-create-form" onSubmit={handleSubmit}>
        <label htmlFor="deck-name">{t("deckName")}</label>
        <div className="deck-create-controls">
          <input id="deck-name" type="text" maxLength={60} value={name}
            onChange={(event) => setName(event.target.value)} placeholder={t("deckNamePlaceholder")} />
          <button type="submit" className="card-action" disabled={!name.trim() || creating}>
            {creating ? t("creatingDeck") : t("createDeck")}
          </button>
        </div>
      </form>

      {decks.length === 0 ? <p>{t("noDecks")}</p> : (
        <div className="decks-list">
          {decks.map((deck) => {
            // Convierte los identificadores del mazo en objetos completos de carta.
            const deckCards = deck.cards.map((item) => {
              const card = cards.find((candidate) => candidate.id === item.cardId);
              return card ? { ...card, quantity: item.quantity } : null;
            }).filter(Boolean);

            return (
              <section className="deck-panel" key={deck.id}>
                <div className="deck-heading">
                  {editingDeckId === deck.id ? (
                    <form className="deck-rename-form" onSubmit={(event) => handleRename(event, deck.id)}>
                      <label className="visually-hidden" htmlFor={`rename-deck-${deck.id}`}>{t("deckName")}</label>
                      <input id={`rename-deck-${deck.id}`} type="text" maxLength={60} value={editedName}
                        onChange={(event) => setEditedName(event.target.value)} />
                      <button type="submit" className="deck-manage-button" disabled={!editedName.trim()}>
                        {t("saveName")}
                      </button>
                      <button type="button" className="deck-cancel-button"
                        onClick={() => setEditingDeckId(null)}>{t("cancel")}</button>
                    </form>
                  ) : (
                    <>
                      <h3>{deck.name}</h3>
                      <div className="deck-management-actions">
                        <button type="button" className="deck-manage-button" onClick={() => beginRename(deck)}>
                          {t("renameDeck")}
                        </button>
                        <button type="button" className="deck-delete-button"
                          onClick={() => {
                            if (window.confirm(t("confirmDeleteDeck", { name: deck.name }))) {
                              onDeleteDeck(deck.id);
                            }
                          }}>
                          {t("deleteDeck")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {deckCards.length === 0 ? <p>{t("emptyDeck")}</p> : (
                  <>
                    <p>{t("cardCount", { count: deckCards.reduce((total, card) => total + card.quantity, 0) })}</p>
                    <section className="card-grid">
                      {deckCards.map((card) => (
                        <CardLayout key={card.id} card={card} quantity={card.quantity}
                          actionLabel={t("removeFromDeck")}
                          onAction={() => onRemoveCard(deck.id, card.id)} />
                      ))}
                    </section>
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default DeckHandler;
