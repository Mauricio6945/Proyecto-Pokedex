import { useEffect, useState } from "react";
import {
  addToInventory,
  getCards,
  getInventory,
  getMe,
  logout,
  removeFromInventory,
} from "./api/Cardapi";
import CardLayout from "./components/CardLayout";

function App() {
  // Estado de datos cargados desde el backend.
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);

  // Estado de interfaz: vista activa, carga y mensajes visibles al usuario.
  const [view, setView] = useState("catalog");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Estados controlados por los campos de filtrado del catalogo.
  const [searchName, setSearchName] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");
  const [selectedExpansion, setSelectedExpansion] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");

  // Al montar la aplicacion se cargan el catalogo y la sesion actual.
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

  // Obtener valores únicos para los filtros
  function getUniqueValues(field) {
    return [...new Set(cards.map((card) => card[field]))].filter(Boolean).sort();
  }

  const rarities = getUniqueValues("rarity");
  const expansions = getUniqueValues("expansion");
  const variants = getUniqueValues("variant");

  // Combinacion de filtros: una carta debe cumplir todos los criterios activos.
  const filteredCards = cards.filter((card) => {
    const matchesName = card.name
      .toLowerCase()
      .includes(searchName.trim().toLowerCase());

    const matchesRarity =
      selectedRarity === "" || card.rarity === selectedRarity;

    const matchesExpansion =
      selectedExpansion === "" || card.expansion === selectedExpansion;

    const matchesVariant =
      selectedVariant === "" || card.variant === selectedVariant;

    return (
      matchesName &&
      matchesRarity &&
      matchesExpansion &&
      matchesVariant
    );
  });

  // Relaciona los datos de inventario con la informacion completa de cada carta.
  const inventoryCards = inventory.map((item) => {
   const card = cards.find((candidate) => candidate.id === item.cardId);
   return card ? { ...card, quantity: item.quantity } : null;
  }).filter(Boolean);

  // Vuelve a consultar el inventario despues de cualquier cambio.
  async function refreshInventory() {
    setInventory(await getInventory());
  }

  // Agrega una carta y muestra el resultado de la operacion.
  async function handleAdd(cardId) {
    try {
      setMessage("");
      await addToInventory(cardId);
      await refreshInventory();
      setMessage("Carta agregada al inventario.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Quita una copia y muestra el resultado de la operacion.
  async function handleRemove(cardId) {
    try {
      setMessage("");
      await removeFromInventory(cardId);
      await refreshInventory();
      setMessage("Se quitó una copia de la carta.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Cierra la sesion y vuelve el catalogo a su vista inicial.
  async function handleLogout() {
    try {
      await logout();
      setUser(null);
      setInventory([]);
      setView("catalog");
      setMessage("Sesión cerrada.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Restablecer todos los filtros
  function clearFilters() {
    setSearchName("");
    setSelectedRarity("");
    setSelectedExpansion("");
    setSelectedVariant("");
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>Pokedex de Cartas</h1>
          <p className="subtitle">
            Catalogo publico, e inventario personal
          </p>
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
              <button type="button" onClick={handleLogout}>Cerrar sesión</button>
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
        <>
          <section className="filters">
            <div className="filter-group">
              <label htmlFor="searchbar">Nombre</label>
              <input id="searchbar" type="text" placeholder="¿Qué carta buscas?"
                value={searchName} onChange={(e) => setSearchName(e.target.value)} />
            </div>
            <div className="filter-group">
              <label htmlFor="rarity">Rareza</label>
              <select id="rarity" value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}>
                <option value="">Todas las rarezas</option>
                {rarities.map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="expansion">Expansión</label>
              <select id="expansion" value={selectedExpansion}
                onChange={(e) => setSelectedExpansion(e.target.value)}>
                <option value="">Todas las expansiones</option>
                {expansions.map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="variant">Variante</label>
              <select id="variant" value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}>
                <option value="">Todas las variantes</option>
                {variants.map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
          </section>
          <button type="button" className="clear-button" onClick={clearFilters}>
            Limpiar filtros
          </button>
          <p className="results-count">Se encontraron {filteredCards.length} cartas.</p>
          {!user && <p>Inicia sesión para agregar cartas a tu inventario.</p>}
          <section className="card-grid">
            {filteredCards.map((card) => (
              <CardLayout key={card.id} card={card}
                actionLabel="Agregar a mi inventario"
                onAction={user ? () => handleAdd(card.id) : undefined} />
            ))}
          </section>
        </>
      )}

      {!loading && !error && view === "inventory" && user && (
        <>
          <h2>Mi inventario</h2>
          {inventoryCards.length === 0 && <p>Aún no tienes cartas en tu inventario.</p>}
          <section className="card-grid">
            {inventoryCards.map((card) => (
              <CardLayout key={card.id} card={card} quantity={card.quantity}
                actionLabel="Quitar una copia"
                onAction={() => handleRemove(card.id)} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}

export default App;