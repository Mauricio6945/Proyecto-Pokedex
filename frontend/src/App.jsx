import { useEffect, useState } from "react";
import { addCardToDeck, createDeck, getCards, getDecks, getInventory, getMe } from "./api/Cardapi";
import FilterCards from "./components/FilterCards";
import InventoryHandler, { useInventoryHandler } from "./components/InventoryHandler";
import SessionHandler from "./components/SessionHandler";
import CardScanner from "./components/CardScanner";
import DeckHandler from "./components/DeckHandler";
import { useI18n } from "./i18n";
import pokedexImage from "./img/pokedex.png";

function App() {
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [decks, setDecks] = useState([]);
  const [view, setView] = useState("catalog");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { language, setLanguage, t, translateError } = useI18n();

  const inventoryActions = useInventoryHandler({ setInventory, setMessage, t, translateError });

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
      setMessage(t("deckCreated", { name: deck.name }));
      return true;
    } catch (err) {
      setMessage(translateError(err.message));
      return false;
    }
  }

  async function handleAddToDeck(deckId, cardId) {
    try {
      await addCardToDeck(deckId, cardId);
      setDecks(await getDecks());
      const deckName = decks.find((deck) => deck.id === deckId)?.name;
      setMessage(deckName ? t("cardAddedToNamedDeck", { name: deckName }) : t("cardAddedToDeck"));
      return true;
    } catch (err) {
      setMessage(translateError(err.message));
      return false;
    }
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <div className="title-row">
            <h1>{t("appTitle")}</h1>
            <img src={pokedexImage} alt="Pokedex" className="pokedex-logo"/>
          </div>
          <p className="subtitle">{t("subtitle")}</p>
        </div>
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg" alt={t("pokeballAlt")} id="pokeball"
        />
        <div className="user-actions">
          {user ? (
            <>
              <span>{t("hello", { name: user.name })}</span>
              <SessionHandler
                onLoggedOut={() => {
                  setUser(null);
                  setInventory([]);
                  setDecks([]);
                  setView("catalog");
                  setMessage(t("logoutDone"));
                }}
                onError={setMessage}
              />
            </>
          ) : (
            <a className="login-button" href="/auth/google">{t("login")}</a>
          )}
          <label className="visually-hidden" htmlFor="language-select">{t("language")}</label>
          <select id="language-select" className="language-select" aria-label={t("language")}
            value={language} onChange={(event) => {
              setLanguage(event.target.value);
              setMessage("");
            }}>
            <option value="es">{t("spanish")}</option>
            <option value="en">{t("english")}</option>
          </select>
        </div>
      </header>

      <nav className="navigation">
        <button type="button" onClick={() => setView("catalog")}>{t("catalog")}</button>
        {user && (
          <button type="button" onClick={() => setView("inventory")}>
            {t("inventoryNav", { count: inventory.reduce((total, item) => total + item.quantity, 0) })}
          </button>
        )}
        {user && (
          <button type="button" onClick={() => setView("scanner")}>{t("scannerNav")}</button>
        )}
        {user && (
          <button type="button" onClick={() => setView("decks")}>{t("decksNav")}</button>
        )}
      </nav>

      {loading && <p>{t("loading")}</p>}
      {error && <p className="error-message">{translateError(error)}</p>}
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
