import { useEffect, useState } from "react";
import { getCards } from "./api/Cardapi";
import CardLayout from "./components/CardLayout";

function App() {
  // Cartas obtenidas desde el backend
  const [cards, setCards] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Estados de los filtros
  const [searchName, setSearchName] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");
  const [selectedExpansion, setSelectedExpansion] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");

  // Obtener las cartas desde la API
  useEffect(() => {getCards().then(setCards).catch((fetchError) => {console.error("Failed to load cards:", fetchError);
    setError("No se pudieron cargar las cartas.");}).finally(() => setLoading(false));
  }, []);

  // Obtener valores únicos para los filtros
  function getUniqueValues(field) {
    return [...new Set(cards.map((card) => card[field]))]
      .filter(Boolean)
      .sort();
  }

  const rarities = getUniqueValues("rarity");
  const expansions = getUniqueValues("expansion");
  const variants = getUniqueValues("variant");

  // Filtrar las cartas según los criterios seleccionados
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
          <h1>Cartas</h1>
          <p className="subtitle">
            Visualización general de las cartas
          </p>
        </div>

        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg"
          alt="Poké Ball"
          id="pokeball"
        />
      </header>

      {}
      <section className="filters">

        {/* Buscar por nombre */}
        <div className="filter-group">
          <label htmlFor="searchbar">Nombre</label>
          <input
            type="text"
            id="searchbar"
            placeholder="¿Qué carta buscas?"
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
          />
        </div>

        {/* Filtrar por rareza */}
        <div className="filter-group">
          <label htmlFor="rarity">Rareza</label>
          <select
            id="rarity"
            value={selectedRarity}
            onChange={(event) => setSelectedRarity(event.target.value)}
          >
            <option value="">Todas las rarezas</option>
            {rarities.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </div>

        {/* Filtrar por expansión */}
        <div className="filter-group">
          <label htmlFor="expansion">Expansión</label>
          <select
            id="expansion"
            value={selectedExpansion}
            onChange={(event) => setSelectedExpansion(event.target.value)}
          >
            <option value="">Todas las expansiones</option>
            {expansions.map((expansion) => (
              <option key={expansion} value={expansion}>
                {expansion}
              </option>
            ))}
          </select>
        </div>

        {/* Filtrar por variante */}
        <div className="filter-group">
          <label htmlFor="variant">Variante</label>
          <select
            id="variant"
            value={selectedVariant}
            onChange={(event) => setSelectedVariant(event.target.value)}
          >
            <option value="">Todas las variantes</option>
            {variants.map((variant) => (
              <option key={variant} value={variant}>
                {variant}
              </option>
            ))}
          </select>
        </div>

      </section>

      {/* Botón para limpiar filtros */}
      <button
        className="clear-button"
        onClick={clearFilters}
      >
        Limpiar filtros
      </button>

      {/* Cantidad de resultados */}
      {!loading && !error && (
        <p className="results-count">
          Se encontraron {filteredCards.length} cartas
        </p>
      )}

      {/* Mensajes de estado */}
      {loading && <p>Cargando cartas...</p>}

      {error && <p className="error-message">{error}</p>}

      {!loading && !error && filteredCards.length === 0 && (
        <p>No se encontraron cartas con estos filtros.</p>
      )}

      {/* Mostrar cartas filtradas */}
      <section className="card-grid">
        {filteredCards.map((card) => (
          <CardLayout key={card.id} card={card} />
        ))}
      </section>

    </main>
  );
}

export default App;