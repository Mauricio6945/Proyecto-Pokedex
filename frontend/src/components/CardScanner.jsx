import { useState } from "react";
import { createWorker } from "tesseract.js";

const normalize = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

function CardScanner({ cards, onAdd }) {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("");

  async function handleScan(event) {
    event.preventDefault();
    if (!file || scanning) return;

    setScanning(true);
    setStatus("Leyendo el nombre de la carta...");
    let worker;
    try {
      worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      const recognizedText = normalize(text);
      const matches = cards
        .map((card) => ({ card, name: normalize(card.name) }))
        .filter(({ name }) => name && recognizedText.includes(name))
        .sort((a, b) => b.name.length - a.name.length);

      if (matches.length === 0) {
        setStatus(`No encontré un nombre del catálogo en la imagen. Texto leído: ${text.trim() || "(ninguno)"}`);
        return;
      }

      const match = matches[0].card;
      const added = await onAdd(match.id);
      if (!added) {
        setStatus(`Se reconoció ${match.name}, pero no se pudo añadir al inventario.`);
        return;
      }
      setStatus(`Se reconoció ${match.name} y se añadió al inventario.`);
      setFile(null);
      event.target.reset();
    } catch (error) {
      setStatus(error.message || "No se pudo procesar la imagen.");
    } finally {
      await worker?.terminate();
      setScanning(false);
    }
  }

  return (
    <section className="scanner-section">
      <h2>Escaneo de cartas</h2>
      <p>Sube una imagen clara de la carta. Buscaremos su nombre en el catálogo y la añadiremos a tu inventario.</p>
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
          {scanning ? "Escaneando..." : "Escanear y añadir"}
        </button>
      </form>
      {status && <p role="status" aria-live="polite">{status}</p>}
    </section>
  );
}

export default CardScanner;
