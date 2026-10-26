import { useEffect, useState } from "react";
import { getCards } from "./api/Cardapi";
import CardLayout from "./components/CardLayout";

function App() {
  const [cards, setCards] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getCards()
      .then(setCards)
      .catch((fetchError) => {
        console.error("Failed to load cards:", fetchError);
        setError("No se pudieron cargar las cartas. Comprueba que la API esté ejecutándose.");
      });
  }, []);

  return (
    <main className="container">
    <header className="header">
     <div>
      <h1>Cartas</h1>
      <p className="subtitle">Visualización general de las cartas</p>
     </div>
     <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Pok%C3%A9_Ball_icon.svg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original" alt="Poké Ball" id="pokeball" />
    </header>

    <input type="text" placeholder="¿Qué carta buscas?" id= "searchbar"/>


    <section className="card-grid">
      {cards.map((card) => (<CardLayout key={card.id} card={card} />))}
    </section>
    </main>
  );
}

export default App;
