function CardLayout({ card, quantity, actionLabel, onAction }) {
  return (
    <article className="card">
      <div className="card-middle">
        <div className="name-row">
          <h2>{card.name}</h2>
          <span className="card-code">{card.pokedex_number}</span>
        </div>
        <p>{card.type}</p>
      </div>

      <img src={card.image} alt={`Imagen de ${card.name}`} />

      <div className="card-row">
        <div>Tipo: {card.type}</div>
        <div>Rareza: {card.rarity}</div>
        <div>Variante: {card.variant}</div>
        <div>Expansión: {card.expansion}</div>
        <div>Precio estimado: US${card.price_usd}</div>
        {quantity !== undefined && <strong>Cantidad: {quantity}</strong>}
      </div>
      {onAction && (
        <button type="button" className="card-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </article>
  );
}

export default CardLayout;