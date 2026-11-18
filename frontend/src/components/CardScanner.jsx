import { useState } from "react";
import { createWorker } from "tesseract.js";
import CardLayout from "./CardLayout";
import { useI18n } from "../i18n";

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
  const { t } = useI18n();
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const [search, setSearch] = useState("");

  async function handleScan(event) {
    event.preventDefault();
    if (!file || scanning) return;

    setScanning(true);
    setStatus({ key: "readingCard" });
    let worker;
    try {
      worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      setRecognizedText(text.trim());
      setSearch("");
      setStatus({ key: text.trim() ? "reviewMatches" : "noTextRead" });
    } catch {
      setStatus({ key: "scannerError" });
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
    setStatus({ key: added ? "cardAddedNamed" : "cardAddFailed", variables: { name: card.name } });
    if (added) {
      setFile(null);
      setRecognizedText("");
      setSearch("");
    }
  }

  return (
    <section className="scanner-section">
      <h2>{t("scannerTitle")}</h2>
      <p>{t("scannerDescription")}</p>
      <form onSubmit={handleScan}>
        <label htmlFor="card-image">{t("cardImage")}</label>
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
          {scanning ? t("scanning") : t("scanCard")}
        </button>
      </form>
      {status && <p role="status" aria-live="polite">{t(status.key, status.variables)}</p>}
      {(recognizedText || status?.key === "noTextRead") && (
        <>
          <div className="filter-group scanner-search">
            <label htmlFor="scanner-search">{t("searchingCard")}</label>
            <input id="scanner-search" type="search" placeholder={t("scannerSearchPlaceholder")}
              value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <p className="results-count">
            {search.trim() ? t("catalogResults") : t("ocrSuggestions")}: {visibleCards.length}
          </p>
          {visibleCards.length === 0 && <p>{t("noMatches")}</p>}
          <section className="card-grid">
            {visibleCards.map((card) => (
              <CardLayout key={card.id} card={card} actionLabel={t("addThisCard")}
                onAction={() => chooseCard(card)} />
            ))}
          </section>
        </>
      )}
    </section>
  );
}

export default CardScanner;
