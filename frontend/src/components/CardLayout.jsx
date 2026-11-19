import { useState } from "react";
import { useI18n } from "../i18n";

// Relaciona los nombres de tipo del catálogo con las clases visuales de la carta.
const typeClasses = {
  grass: "grass",
  fire: "fire",
  fighting: "fighting",
  water: "water",
  colorless: "colorless",
  lightning: "lightning",
  lighting: "lightning",
  psychic: "psychic",
  dark: "dark",
  metal: "metal",
  fairy: "fairy",
  dragon: "dragon",
};

// Tarjeta reutilizable que muestra la informacion principal de una carta.
function CardLayout({ card, quantity, actionLabel, actionDisabled = false, onAction, secondaryActionLabel, onSecondaryAction }) {
  const { language, t } = useI18n();
  const typeClass = typeClasses[card.type?.trim().toLowerCase()];
  const circulationAmount = card.circulationAmount ?? card.amount;
  const circulationAvailable = card.circulationAvailable ?? card.trade_available;
  // La tarjeta conserva su nombre propio (incluidas EX, variantes y rarezas).
  const pokemonName = card.name;
  const [descriptionActive, setDescriptionActive] = useState(false);
  const description = (language === "es" ? card.pokemonDescriptionEs : card.pokemonDescriptionEn) ||
    t("descriptionUnavailable");

  return (
    <article
      className={`card${typeClass ? ` card--${typeClass}` : ""}${descriptionActive ? " card--show-description" : ""}`}
    >
      <div className="card-middle">
        <div className="name-row">
          <h2>{pokemonName}</h2>
          <span className="card-code" aria-label={t("pokemonNumber", { number: card.pokedex_number })}>{card.pokedex_number}</span>
        </div>
        <p>{card.type}</p>
      </div>

      {/* La imagen conserva el nombre de la carta como texto alternativo. */}
      <img
        src={card.image}
        alt={`Imagen de ${pokemonName}`}
        tabIndex={0}
        aria-describedby={`pokemon-description-${card.id}`}
        onPointerEnter={() => setDescriptionActive(true)}
        onPointerLeave={() => setDescriptionActive(false)}
        onFocus={() => setDescriptionActive(true)}
        onBlur={() => setDescriptionActive(false)}
      />

      {/* Datos secundarios usados tanto en catalogo como en inventario. */}
      <div className="card-row">
        <div>{t("type")}: {card.type}</div>
        <div>{t("rarity")}: {card.rarity}</div>
        <div>{t("variant")}: {card.variant}</div>
        <div>{t("expansion")}: {card.expansion}</div>
        <div>{t("price", { price: card.price_usd })}</div>
        {circulationAmount !== undefined && (
          <div>{t("cardsInCirculation", { count: circulationAmount })}</div>
        )}
        {circulationAvailable !== undefined && (
          <div>{t("cardsAvailable", { count: circulationAvailable })}</div>
        )}
        {quantity !== undefined && <strong>{t("quantity", { count: quantity })}</strong>}
      </div>

      <div id={`pokemon-description-${card.id}`} className="card-description-tooltip" role="tooltip">
        <strong>{pokemonName}</strong>
        <p>{description}</p>
      </div>

      {/* Solo se muestra una accion cuando el componente recibe su manejador. */}
      {onAction && onSecondaryAction ? (
        <div className="card-actions">
          <button type="button" className="card-action" onClick={onAction}>{actionLabel}</button>
          <button type="button" className="card-action secondary-card-action" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </button>
        </div>
      ) : actionLabel && (onAction || actionDisabled) ? (
        <button type="button" className="card-action" onClick={onAction} disabled={actionDisabled}>
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}

export default CardLayout;
