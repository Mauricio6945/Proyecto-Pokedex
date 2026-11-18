import { useState } from "react";
import { createWorker } from "tesseract.js";
import CardLayout from "./CardLayout";

const normalize = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

function editDistance(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[right.length];
}

function rankCards(cards, text) {
  const words = normalize(text).split(/\s+/).filter((word) => word.length > 2);
  if (words.length === 0) return [];

  return cards
    .map((card) => {
      const name = normalize(card.name);
      const nameWords = name.split(/\s+/);
      const score = nameWords.reduce((total, nameWord) => {
        const bestMatch = words.reduce((best, word) => {
          if (word === nameWord) return Math.max(best, 1);
          if (Math.min(word.length, nameWord.length) >= 4 && editDistance(word, nameWord) <= 1) {
            return Math.max(best, 0.8);
          }
          return best;
        }, 0);
        return total + bestMatch;
      }, 0);
      return { card, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.card.name.localeCompare(b.card.name))
    .map(({ card }) => card);
}

function CardScanner({ cards, onAdd }) {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const [search, setSearch] = useState("");

  async function handleScan(event) {
    event.preventDefault();
    if (!file || scanning) return;

    setScanning(true);
    setStatus("Leyendo el nombre de la carta...");
    let worker;
    try {
      worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      setRecognizedText(text.trim());
      setSearch("");
      setStatus(text.trim() ? "Revisa las opciones y elige la carta correspondiente." : "No se pudo leer texto. Puedes buscar el nombre manualmente.");
    } catch (error) {
      setStatus(error.message || "No se pudo procesar la imagen.");
    } finally {
      await worker?.terminate();
      setScanning(false);
    }
  }

  const suggestions = rankCards(cards, recognizedText);
  const visibleCards = search.trim()
    ? cards.filter((card) => normalize(card.name).includes(normalize(search)))
    : suggestions;

  async function chooseCard(card) {
    const added = await onAdd(card.id);
    setStatus(added
      ? `${card.name} se añadió al inventario.`
      : `No se pudo añadir ${card.name} al inventario.`);
    if (added) {
      setFile(null);
      setRecognizedText("");
      setSearch("");
    }
  }

  return (
    <section className="scanner-section">
      <h2>Escaneo de cartas</h2>
      <p>Sube una imagen clara para buscar opciones en el catálogo. Revisa los resultados y elige la carta correcta.</p>
      <form onSubmit={handleScan}>
        <label htmlFor="card-image">Imagen de la carta</label>
        <input
          id="card-image"
          type="file"
          accept="image/*"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setStatus("");
          }}
        />
        <button type="submit" className="scanner-button" disabled={!file || scanning}>
          {scanning ? "Escaneando..." : "Escanear carta"}
        </button>
      </form>
      {status && <p role="status" aria-live="polite">{status}</p>}
      {(recognizedText || status.includes("No se pudo leer")) && (
        <>
          {recognizedText && <p><strong>Texto reconocido:</strong> {recognizedText}</p>}
          <div className="filter-group scanner-search">
            <label htmlFor="scanner-search">Buscar carta por nombre</label>
            <input id="scanner-search" type="search" placeholder="Escribe o corrige el nombre"
              value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <p className="results-count">
            {search.trim() ? "Resultados del catálogo" : "Opciones sugeridas por el OCR"}: {visibleCards.length}
          </p>
          {visibleCards.length === 0 && <p>No hay coincidencias. Prueba con otra parte del nombre.</p>}
          <section className="card-grid">
            {visibleCards.map((card) => (
              <CardLayout key={card.id} card={card} actionLabel="Añadir esta carta"
                onAction={() => chooseCard(card)} />
            ))}
          </section>
        </>
      )}
    </section>
  );
}

export default CardScanner;
