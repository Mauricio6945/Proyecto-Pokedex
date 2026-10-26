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
      <h1>Cartas</h1>
      <p className="subtitle">Visualización general de las cartas</p>

      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <section className="card-grid">
          {cards.map((card) => (<CardLayout key={card.id} card={card} />))}
        </section>
      )}
    </main>
  );
}

export default App;
