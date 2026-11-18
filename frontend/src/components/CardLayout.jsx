// Tarjeta reutilizable que muestra la informacion principal de una carta.
function CardLayout({ card, quantity, actionLabel, onAction, secondaryActionLabel, onSecondaryAction }) {
  return (
    <article className="card">
      <div className="card-middle">
        <div className="name-row">
          <h2>{card.name}</h2>
          <span className="card-code">{card.pokedex_number}</span>
        </div>
        <p>{card.type}</p>
      </div>

      {/* La imagen conserva el nombre de la carta como texto alternativo. */}
      <img src={card.image} alt={`Imagen de ${card.name}`} />

      {/* Datos secundarios usados tanto en catalogo como en inventario. */}
      <div className="card-row">
        <div>Tipo: {card.type}</div>
        <div>Rareza: {card.rarity}</div>
        <div>Variante: {card.variant}</div>
        <div>Expansión: {card.expansion}</div>
        <div>Precio estimado: US${card.price_usd}</div>
        {quantity !== undefined && <strong>Cantidad: {quantity}</strong>}
      </div>

      {/* Solo se muestra una accion cuando el componente recibe su manejador. */}
      {onAction && onSecondaryAction ? (
        <div className="card-actions">
          <button type="button" className="card-action" onClick={onAction}>{actionLabel}</button>
          <button type="button" className="card-action secondary-card-action" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </button>
        </div>
      ) : onAction ? (
        <button type="button" className="card-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}

export default CardLayout;
