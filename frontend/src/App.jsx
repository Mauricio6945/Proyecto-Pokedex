import { useEffect, useState } from "react";
import {
  addCardToDeck,
  createDeck,
  deleteDeck,
  getCards,
  getDecks,
  getHistory,
  getInventory,
  getMe,
  removeCardFromDeck,
  renameDeck,
} from "./api/Cardapi";
import FilterCards from "./components/FilterCards";
import InventoryHandler, { useInventoryHandler } from "./components/InventoryHandler";
import SessionHandler from "./components/SessionHandler";
import CardScanner from "./components/CardScanner";
import DeckHandler from "./components/DeckHandler";
import PurchaseHistory from "./components/PurchaseHistory";
import { useI18n } from "./i18n";
import pokedexImage from "./img/pokedex.png";
import footerImage from "./img/pokemon_footer_background.png";
function App() {
  // Estados principales que controlan los datos y la vista actual de la aplicación.
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [decks, setDecks] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("catalog");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Accede a las traducciones y al idioma seleccionado por el usuario.
  const { language, setLanguage, t, translateError } = useI18n();

  // Agrupa las operaciones compartidas para agregar y quitar cartas del inventario.
  const inventoryActions = useInventoryHandler({ setInventory, setCards, setHistory, setMessage, t, translateError });

  // Al montar la aplicación carga el catálogo y, si existe sesión, los datos privados.
  useEffect(() => {
    Promise.all([getCards(), getMe()])
      .then(async ([loadedCards, loadedUser]) => {
        setCards(loadedCards);
        setUser(loadedUser);
        if (loadedUser) {
          const [loadedInventory, loadedDecks, loadedHistory] = await Promise.all([
            getInventory(), getDecks(), getHistory(),
          ]);
          setInventory(loadedInventory);
          setDecks(loadedDecks);
          setHistory(loadedHistory);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Crea un mazo y actualiza la interfaz cuando la operación termina correctamente.
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

  // Añade una carta a un mazo y refresca el mazo seleccionado desde el backend.
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

  async function handleRenameDeck(deckId, name) {
    // Renombra el mazo en el backend y refleja el nuevo nombre en el estado local.
    try {
      const updatedDeck = await renameDeck(deckId, name);
      setDecks((current) => current.map((deck) =>
        deck.id === deckId ? { ...deck, name: updatedDeck.name } : deck));
      setMessage(t("deckRenamed", { name: updatedDeck.name }));
      return true;
    } catch (err) {
      setMessage(translateError(err.message));
      return false;
    }
  }

  async function handleDeleteDeck(deckId) {
    // Elimina el mazo seleccionado y actualiza la lista y el mensaje mostrado.
    try {
      await deleteDeck(deckId);
      const deckName = decks.find((deck) => deck.id === deckId)?.name ?? "";
      setDecks((current) => current.filter((deck) => deck.id !== deckId));
      setMessage(t("deckDeleted", { name: deckName }));
      return true;
    } catch (err) {
      setMessage(translateError(err.message));
      return false;
    }
  }

  async function handleRemoveCardFromDeck(deckId, cardId) {
    // Quita la carta del mazo y vuelve a cargar los mazos para mantener las cantidades sincronizadas.
    try {
      await removeCardFromDeck(deckId, cardId);
      setDecks(await getDecks());
      setMessage(t("deckCardRemoved"));
      return true;
    } catch (err) {
      setMessage(translateError(err.message));
      return false;
    }
  }

  return (
    <main className="container">
      {/* Encabezado con identidad, cuenta del usuario y selector de idioma. */}
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
                  setHistory([]);
                  setView("catalog");
                  setMessage(t("logoutDone"));
                }}
                onError={setMessage}
              />
            </>
          ) : (
            <a className="login-button" href="/auth/google">{t("login")}</a>
          )}
          {/* Control de idioma disponible para todos los visitantes de la aplicación. */}
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

      {/* Navegación entre el catálogo público y las vistas disponibles para usuarios autenticados. */}
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
        {user && (
          <button type="button" onClick={() => setView("history")}>{t("historyNav")}</button>
        )}
      </nav>

      {/* Mensajes globales de carga, error y resultado de la última operación. */}
      {loading && <p>{t("loading")}</p>}
      {error && <p className="error-message">{translateError(error)}</p>}
      {message && <p role="status">{message}</p>}

      {/* Contenido activo según la vista seleccionada. */}
      {!loading && !error && view === "catalog" && (
        <FilterCards cards={cards} user={user} onAdd={inventoryActions.handleAdd} />
      )}
      {!loading && !error && view === "inventory" && user && (
        <InventoryHandler cards={cards} inventory={inventory} decks={decks}
          onRemove={inventoryActions.handleRemove} onAddToDeck={handleAddToDeck}
          onSetTradeAvailable={inventoryActions.handleSetTradeAvailable} />
      )}
      {!loading && !error && view === "scanner" && user && (
        <CardScanner cards={cards} onAdd={inventoryActions.handleAdd} />
      )}
      {!loading && !error && view === "decks" && user && (
        <DeckHandler decks={decks} cards={cards} onCreateDeck={handleCreateDeck}
          onRenameDeck={handleRenameDeck} onDeleteDeck={handleDeleteDeck}
          onRemoveCard={handleRemoveCardFromDeck} />
      )}
      {!loading && !error && view === "history" && user && (
        <PurchaseHistory entries={history} />
      )}
      {/* Imagen decorativa fija al final de la interfaz. */}
      <footer>
        <img src={footerImage} alt="Multiple Pokemon Stickers Footer" id="footer-pokemons" />
      </footer>
    </main>
  );
}

export default App;
