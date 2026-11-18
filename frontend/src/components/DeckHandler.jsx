import { useState } from "react";
import CardLayout from "./CardLayout";

function DeckHandler({ decks, cards, onCreateDeck }) {
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
      <h2>Mazos</h2>
      <form className="deck-create-form" onSubmit={handleSubmit}>
        <label htmlFor="deck-name">Nombre del mazo</label>
        <div className="deck-create-controls">
          <input id="deck-name" type="text" maxLength={60} value={name}
            onChange={(event) => setName(event.target.value)} placeholder="Por ejemplo, Equipo favorito" />
          <button type="submit" className="card-action" disabled={!name.trim() || creating}>
            {creating ? "Creando..." : "Crear mazo"}
          </button>
        </div>
      </form>

      {decks.length === 0 ? <p>Aún no tienes mazos. Crea uno para empezar.</p> : (
        <div className="decks-list">
          {decks.map((deck) => {
            const deckCards = deck.cards.map((item) => {
              const card = cards.find((candidate) => candidate.id === item.cardId);
              return card ? { ...card, quantity: item.quantity } : null;
            }).filter(Boolean);

            return (
              <section className="deck-panel" key={deck.id}>
                <h3>{deck.name}</h3>
                {deckCards.length === 0 ? <p>Este mazo todavía no tiene cartas.</p> : (
                  <>
                    <p>{deckCards.reduce((total, card) => total + card.quantity, 0)} cartas</p>
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
