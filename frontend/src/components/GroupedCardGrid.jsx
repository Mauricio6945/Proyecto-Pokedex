import { useEffect, useId, useState } from "react";
import CardLayout from "./CardLayout";
import { useI18n } from "../i18n";

//Organiza las cartas por número de Pokédex y mantiene juntas sus variantes.
function GroupedCardGrid({ cards, renderCard, collapsible = true, resetKey }) {
  const { t } = useI18n();
  const idPrefix = useId().replaceAll(":", "");
  const [accordionState, setAccordionState] = useState(() => ({
    expanded: new Set(),
    mounted: new Set(),
    closing: new Set(),
  }));
  const groups = new Map();

  //Cierra los grupos abiertos cuando cambian los filtros del catálogo.
  useEffect(() => {
    if (!collapsible) return;
    setAccordionState((current) => current.expanded.size === 0 ? current : ({
      ...current,
      expanded: new Set(),
      closing: new Set([...current.closing, ...current.expanded]),
    }));
  }, [collapsible, resetKey]);


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
        const expanded = !collapsible || accordionState.expanded.has(groupKey);
        const mounted = !collapsible || accordionState.mounted.has(groupKey) || expanded;
        const closing = collapsible && accordionState.closing.has(groupKey);
        const cardsId = `pokedex-group-cards-${idPrefix}-${groupKey}`;

        return (
          <section className="pokedex-group" key={number}>
            <h3 className="pokedex-group-title">
              {collapsible ? (
                <button
                  type="button"
                  className="pokedex-group-toggle"
                  aria-expanded={expanded}
                  aria-controls={cardsId}
                  aria-label={t(expanded ? "hidePokemonCards" : "showPokemonCards", { name: categoryName })}
                  onClick={() => setAccordionState((current) => {
                    const next = {
                      expanded: new Set(current.expanded),
                      mounted: new Set(current.mounted),
                      closing: new Set(current.closing),
                    };
                    if (next.expanded.has(groupKey)) {
                      next.expanded.delete(groupKey);
                      next.closing.add(groupKey);
                    } else {
                      next.expanded.add(groupKey);
                      next.mounted.add(groupKey);
                      next.closing.delete(groupKey);
                    }
                    return next;
                  })}
                >
                  <span>{heading}</span>
                  <span className="pokedex-group-chevron" aria-hidden="true">{expanded ? "▾" : "▸"}</span>
                </button>
              ) : heading}
            </h3>
            <div
              className={`card-grid${collapsible ? " card-grid--accordion" : ""}${closing ? " card-grid--closing" : ""}`}
              id={collapsible ? cardsId : undefined}
              hidden={!mounted}
              aria-hidden={!expanded && collapsible ? true : undefined}
              inert={!expanded && collapsible ? true : undefined}
              onAnimationEnd={(event) => {
                if (event.target !== event.currentTarget || event.animationName !== "pokedex-group-close") return;
                setAccordionState((current) => {
                  if (current.expanded.has(groupKey)) return current;
                  const mountedGroups = new Set(current.mounted);
                  const closingGroups = new Set(current.closing);
                  mountedGroups.delete(groupKey);
                  closingGroups.delete(groupKey);
                  return { ...current, mounted: mountedGroups, closing: closingGroups };
                });
              }}
            >
              {mounted && groupCards.map((card) => renderCard
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
