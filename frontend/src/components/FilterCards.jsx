import { useMemo, useState } from "react";
import CardLayout from "./CardLayout";

//Componente que permite buscar cartas y combinarlas con filtros por atributos.
function FilterCards({ cards, user, onAdd }) {
  //Conserva por separado los criterios seleccionados en la interfaz.
  const [searchName, setSearchName] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");
  const [selectedExpansion, setSelectedExpansion] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");

  //Obtiene opciones unicas para cada selector y descarta valores vacios.
  const getUniqueValues = (field) =>
    [...new Set(cards.map((card) => card[field]))].filter(Boolean).sort();

  //Memoriza las opciones para recalcularlas solo cuando cambia el catalogo.
  const rarities = useMemo(() => getUniqueValues("rarity"), [cards]);
  const expansions = useMemo(() => getUniqueValues("expansion"), [cards]);
  const variants = useMemo(() => getUniqueValues("variant"), [cards]);

  //Aplica todos los filtros simultaneamente a las cartas recibidas.
  const filteredCards = cards.filter((card) =>
    card.name.toLowerCase().includes(searchName.trim().toLowerCase()) &&
    (!selectedRarity || card.rarity === selectedRarity) &&
    (!selectedExpansion || card.expansion === selectedExpansion) &&
    (!selectedVariant || card.variant === selectedVariant)
  );

  //Restablece los criterios de busqueda y todos los selectores.
  function clearFilters() {
    setSearchName("");
    setSelectedRarity("");
    setSelectedExpansion("");
    setSelectedVariant("");
  }

  return (
    <>
      {/* Controles que modifican los criterios usados en el filtrado. */}
      <section className="filters">
        <div className="filter-group">
          <label htmlFor="searchbar">Nombre</label>
          <input id="searchbar" type="text" placeholder="¿Qué carta buscas?"
            value={searchName} onChange={(event) => setSearchName(event.target.value)} />
        </div>
        <div className="filter-group">
          <label htmlFor="rarity">Rareza</label>
          <select id="rarity" value={selectedRarity} onChange={(event) => setSelectedRarity(event.target.value)}>
            <option value="">Todas las rarezas</option>
            {rarities.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="expansion">Expansión</label>
          <select id="expansion" value={selectedExpansion} onChange={(event) => setSelectedExpansion(event.target.value)}>
            <option value="">Todas las expansiones</option>
            {expansions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="variant">Variante</label>
          <select id="variant" value={selectedVariant} onChange={(event) => setSelectedVariant(event.target.value)}>
            <option value="">Todas las variantes</option>
            {variants.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
      </section>
      <button type="button" className="clear-button" onClick={clearFilters}>Limpiar filtros</button>
      <p className="results-count">Se encontraron {filteredCards.length} cartas.</p>
      {!user && <p>Inicia sesión para agregar cartas a tu inventario.</p>}
      <section className="card-grid">
        {filteredCards.map((card) => (
          <CardLayout key={card.id} card={card} actionLabel="Agregar a mi inventario"
            onAction={user ? () => onAdd(card.id) : undefined} />
        ))}
      </section>
    </>
  );
}

export default FilterCards;
