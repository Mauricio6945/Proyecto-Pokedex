import { useI18n } from "../i18n";

// Tarjeta reutilizable que muestra la informacion principal de una carta.
function CardLayout({ card, quantity, actionLabel, onAction, secondaryActionLabel, onSecondaryAction }) {
  const { t } = useI18n();
  return (
    <article className="card">
      <div className="card-middle">
        <div className="name-row">
          <h2>{card.name}</h2>
          <span className="card-code" aria-label={t("pokemonNumber", { number: card.pokedex_number })}>{card.pokedex_number}</span>
        </div>
        <p>{card.type}</p>
      </div>

      {/* La imagen conserva el nombre de la carta como texto alternativo. */}
      <img src={card.image} alt={`Imagen de ${card.name}`} />

      {/* Datos secundarios usados tanto en catalogo como en inventario. */}
      <div className="card-row">
        <div>{t("type")}: {card.type}</div>
        <div>{t("rarity")}: {card.rarity}</div>
        <div>{t("variant")}: {card.variant}</div>
        <div>{t("expansion")}: {card.expansion}</div>
        <div>{t("price", { price: card.price_usd })}</div>
        {quantity !== undefined && <strong>{t("quantity", { count: quantity })}</strong>}
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
