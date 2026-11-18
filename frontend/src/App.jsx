import { useEffect, useState } from "react";
import { addCardToDeck, createDeck, getCards, getDecks, getInventory, getMe } from "./api/Cardapi";
import FilterCards from "./components/FilterCards";
import InventoryHandler, { useInventoryHandler } from "./components/InventoryHandler";
import SessionHandler from "./components/SessionHandler";
import CardScanner from "./components/CardScanner";
import DeckHandler from "./components/DeckHandler";

function App() {
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [decks, setDecks] = useState([]);
  const [view, setView] = useState("catalog");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const inventoryActions = useInventoryHandler({ setInventory, setMessage });

  useEffect(() => {
    Promise.all([getCards(), getMe()])
      .then(async ([loadedCards, loadedUser]) => {
        setCards(loadedCards);
        setUser(loadedUser);
        if (loadedUser) {
          const [loadedInventory, loadedDecks] = await Promise.all([getInventory(), getDecks()]);
          setInventory(loadedInventory);
          setDecks(loadedDecks);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateDeck(name) {
    try {
      const deck = await createDeck(name);
      setDecks((current) => [...current, deck]);
      setMessage(`Mazo “${deck.name}” creado.`);
      return true;
    } catch (err) {
      setMessage(err.message);
      return false;
    }
  }

  async function handleAddToDeck(deckId, cardId) {
    try {
      await addCardToDeck(deckId, cardId);
      setDecks(await getDecks());
      const deckName = decks.find((deck) => deck.id === deckId)?.name;
      setMessage(deckName ? `Carta añadida a “${deckName}”.` : "Carta añadida al mazo.");
      return true;
    } catch (err) {
      setMessage(err.message);
      return false;
    }
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>Pokedex de Cartas</h1>
          <p className="subtitle">Catalogo publico, e inventario personal</p>
        </div>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg"
          alt="Poké Ball"
          id="pokeball"
        />
        <div className="user-actions">
          {user ? (
            <>
              <span>Hola, {user.name}</span>
              <SessionHandler
                onLoggedOut={() => {
                  setUser(null);
                  setInventory([]);
                  setDecks([]);
                  setView("catalog");
                  setMessage("Sesión cerrada.");
                }}
                onError={setMessage}
              />
            </>
          ) : (
            <a className="login-button" href="/auth/google">Iniciar sesión con Google</a>
          )}
        </div>
      </header>

      <nav className="navigation">
        <button type="button" onClick={() => setView("catalog")}>Catálogo</button>
        {user && (
          <button type="button" onClick={() => setView("inventory")}>
            Mi inventario ({inventory.reduce((total, item) => total + item.quantity, 0)})
          </button>
        )}
        {user && (
          <button type="button" onClick={() => setView("scanner")}>Escaneo de cartas</button>
        )}
        {user && (
          <button type="button" onClick={() => setView("decks")}>Mazos</button>
        )}
      </nav>

      {loading && <p>Cargando...</p>}
      {error && <p className="error-message">{error}</p>}
      {message && <p role="status">{message}</p>}

      {!loading && !error && view === "catalog" && (
        <FilterCards cards={cards} user={user} onAdd={inventoryActions.handleAdd} />
      )}
      {!loading && !error && view === "inventory" && user && (
        <InventoryHandler cards={cards} inventory={inventory} decks={decks}
          onRemove={inventoryActions.handleRemove} onAddToDeck={handleAddToDeck} />
      )}
      {!loading && !error && view === "scanner" && user && (
        <CardScanner cards={cards} onAdd={inventoryActions.handleAdd} />
      )}
      {!loading && !error && view === "decks" && user && (
        <DeckHandler decks={decks} cards={cards} onCreateDeck={handleCreateDeck} />
      )}
    </main>
  );
}

export default App;
