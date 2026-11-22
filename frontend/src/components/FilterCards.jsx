import { useMemo, useState } from "react";
import CardLayout from "./CardLayout";
import GroupedCardGrid from "./GroupedCardGrid";
import { useI18n } from "../i18n";

//Componente que permite buscar cartas y combinarlas con filtros por atributos.
function FilterCards({ cards, user, onAdd }) {
  const { t } = useI18n();
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
          <label htmlFor="searchbar">{t("name")}</label>
          <input id="searchbar" type="text" placeholder={t("searchCard")}
            value={searchName} onChange={(event) => setSearchName(event.target.value)} />
        </div>
        <div className="filter-group">
          <label htmlFor="rarity">{t("rarity")}</label>
          <select id="rarity" value={selectedRarity} onChange={(event) => setSelectedRarity(event.target.value)}>
            <option value="">{t("allRarities")}</option>
            {rarities.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="expansion">{t("expansion")}</label>
          <select id="expansion" value={selectedExpansion} onChange={(event) => setSelectedExpansion(event.target.value)}>
            <option value="">{t("allExpansions")}</option>
            {expansions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="variant">{t("variant")}</label>
          <select id="variant" value={selectedVariant} onChange={(event) => setSelectedVariant(event.target.value)}>
            <option value="">{t("allVariants")}</option>
            {variants.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
      </section>
      <button type="button" className="clear-button" onClick={clearFilters}>{t("clearFilters")}</button>
      <p className="results-count">{t("foundCards", { count: filteredCards.length })}</p>
      {!user && (
        <aside className="login-features" aria-labelledby="login-features-title">
          <h2 id="login-features-title">{t("loginFeaturesTitle")}</h2>
          <p>{t("loginFeaturesDescription")}</p>
          <ul>
            <li>{t("loginFeatureInventory")}</li>
            <li>{t("loginFeatureScanner")}</li>
            <li>{t("loginFeatureDecks")}</li>
            <li>{t("loginFeatureHistory")}</li>
            <li>{t("loginFeatureCollection")}</li>
          </ul>
        </aside>
      )}
      <GroupedCardGrid cards={filteredCards} renderCard={(card) => (
          <CardLayout key={card.id} card={card}
            actionLabel={user ? (card.trade_available > 0 ? t("addToInventory") : t("outOfStock")) : undefined}
            actionDisabled={Boolean(user) && !(card.trade_available > 0)}
            onAction={user && card.trade_available > 0 ? () => onAdd(card.id) : undefined} />
      )} />
    </>
  );
}

export default FilterCards;
