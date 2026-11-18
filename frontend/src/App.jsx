import { useEffect, useState } from "react";
import { getCards, getInventory, getMe } from "./api/Cardapi";
import FilterCards from "./components/FilterCards";
import InventoryHandler, { useInventoryHandler } from "./components/InventoryHandler";
import SessionHandler from "./components/SessionHandler";

function App() {
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
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
        if (loadedUser) setInventory(await getInventory());
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
      </nav>

      {loading && <p>Cargando...</p>}
      {error && <p className="error-message">{error}</p>}
      {message && <p role="status">{message}</p>}

      {!loading && !error && view === "catalog" && (
        <FilterCards cards={cards} user={user} onAdd={inventoryActions.handleAdd} />
      )}
      {!loading && !error && view === "inventory" && user && (
        <InventoryHandler cards={cards} inventory={inventory} onRemove={inventoryActions.handleRemove} />
      )}
    </main>
  );
}

export default App;
