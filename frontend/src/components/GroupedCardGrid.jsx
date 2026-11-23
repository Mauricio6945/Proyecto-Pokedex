import { useId, useState } from "react";
import CardLayout from "./CardLayout";
import { useI18n } from "../i18n";

//Organiza las cartas por número de Pokédex y mantiene juntas sus variantes.
function GroupedCardGrid({ cards, renderCard }) {
  const { t } = useI18n();
  const idPrefix = useId().replaceAll(":", "");
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const groups = new Map();


  //Construye el map por número de Pokédex, usando "unknown" para cartas sin número definido.
  for (const card of cards) {
    const number = Number(card.pokedex_number);
    const key = Number.isFinite(number) ? number : "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(card);
  }

  const orderedGroups = [...groups.entries()].sort(([numberA], [numberB]) => {
    if (numberA === "unknown") return 1;
    if (numberB === "unknown") return -1;
    return numberA - numberB;
  });

  return (
    <div className="pokedex-groups">
      {orderedGroups.map(([number, groupCards]) => {
        const firstCard = groupCards[0];
        //El nombre de la Pokédex identifica la categoría común a todas las variantes.
        const categoryName = firstCard.pokemonName ?? firstCard.name;
        const heading = number === "unknown"
          ? categoryName
          : `#${String(number).padStart(3, "0")} · ${categoryName}`;
        const groupKey = String(number);
        const expanded = expandedGroups.has(groupKey);
        const cardsId = `pokedex-group-cards-${idPrefix}-${groupKey}`;

        return (
          <section className="pokedex-group" key={number}>
            <h3 className="pokedex-group-title">
              <button
                type="button"
                className="pokedex-group-toggle"
                aria-expanded={expanded}
                aria-controls={cardsId}
                aria-label={t(expanded ? "hidePokemonCards" : "showPokemonCards", { name: categoryName })}
                onClick={() => setExpandedGroups((current) => {
                  const next = new Set(current);
                  if (next.has(groupKey)) next.delete(groupKey);
                  else next.add(groupKey);
                  return next;
                })}
              >
                <span>{heading}</span>
                <span className="pokedex-group-chevron" aria-hidden="true">{expanded ? "▾" : "▸"}</span>
              </button>
            </h3>
            <div className="card-grid" id={cardsId} hidden={!expanded}>
              {expanded && groupCards.map((card) => renderCard
                ? renderCard(card)
                : <CardLayout key={card.id} card={card} quantity={card.quantity} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default GroupedCardGrid;
