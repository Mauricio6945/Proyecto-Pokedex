function CardLayout( { card } ){
      return (
    <article className="card">
      <div className="card-top">
        <span className="card-menu">...</span>
      </div>

      <div className="card-middle">
        <div className="name-row">
          <div className="name-left">
            <img className="user-icon" src="/user-icon.svg" alt="Usuario" />
            <h2>{card.name}</h2>
          </div>
          <span className="card-code">{card.pokedex_number}</span>
        </div>
        <p>{card.type}</p>
      </div>
      <img src={card.image} alt={`Imagen de ${card.name}`} />

      <div className="card-row">
        <span className="card-type">Tipo: {card.type}</span>
        <span className="card-rarity">Rareza: {card.rarity}</span>
        <span className="card-variant">Variante: {card.variant}</span>
        <span className="card-precio">Precio: {card.price_usd}</span>
      </div>
    </article>
  );
}

export default CardLayout