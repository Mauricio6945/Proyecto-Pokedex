function CardLayout( { card } ){
      return (
    <article className="card">
      <div className="card-top">
      </div>

      <div className="card-middle">
        <div className="name-row">
            <h2>{card.name}</h2>
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