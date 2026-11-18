import { useState } from "react";
import CardLayout from "./CardLayout";
import { useI18n } from "../i18n";

function DeckHandler({ decks, cards, onCreateDeck }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    const created = await onCreateDeck(name.trim());
    if (created) setName("");
    setCreating(false);
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
            const deckCards = deck.cards.map((item) => {
              const card = cards.find((candidate) => candidate.id === item.cardId);
              return card ? { ...card, quantity: item.quantity } : null;
            }).filter(Boolean);

            return (
              <section className="deck-panel" key={deck.id}>
                <h3>{deck.name}</h3>
                {deckCards.length === 0 ? <p>{t("emptyDeck")}</p> : (
                  <>
                    <p>{t("cardCount", { count: deckCards.reduce((total, card) => total + card.quantity, 0) })}</p>
                    <section className="card-grid">
                      {deckCards.map((card) => <CardLayout key={card.id} card={card} quantity={card.quantity} />)}
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
