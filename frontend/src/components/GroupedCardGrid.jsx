import CardLayout from "./CardLayout";

//Organiza las cartas por número de Pokédex y mantiene juntas sus variantes.
function GroupedCardGrid({ cards, renderCard }) {
  const groups = new Map();

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
        // El nombre de la Pokédex identifica la categoría común a todas las variantes.
        const categoryName = firstCard.pokemonName ?? firstCard.name;
        const heading = number === "unknown"
          ? categoryName
          : `#${String(number).padStart(3, "0")} · ${categoryName}`;

        return (
          <section className="pokedex-group" key={number}>
            <h3 className="pokedex-group-title">{heading}</h3>
            <div className="card-grid">
              {groupCards.map((card) => renderCard
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
