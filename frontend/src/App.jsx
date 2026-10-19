import { useEffect, useState } from "react";
import { getCards } from "./api/Cardapi"

function App() {
    const [cards, setCards] = useState([]);

    useEffect(() => {
        const fetchCards = async () => {
        const data = await getCards();
        setCards(data);
        };
        fetchCards();}
        , []);

    return (
        <div className="App">
            <h1>Pokedex</h1>
            <div className="card-container">
                {cards.map((card) => (
                    <div key={card.id} className="card">
                        <img src={card.image} alt={card.name} />
                        <h2>{card.name}</h2>
                        <p>{card.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App
