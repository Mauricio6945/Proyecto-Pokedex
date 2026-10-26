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
        <div>
            <span className="card-type">Tipo: {card.type}</span>
        </div>
        <div>
            <span className="card-rarity">Rareza: {card.rarity}</span>
        </div>
        <div>
            <span className="card-variant">Variante: {card.variant}</span>
        </div>
        <div>
            <span className="card-precio">Precio: {card.price_usd}</span>
        </div>
      </div>
    </article>
  );
}

export default CardLayout