import { useState } from "react";
import { createWorker } from "tesseract.js";
import CardLayout from "./CardLayout";
import GroupedCardGrid from "./GroupedCardGrid";
import { useI18n } from "../i18n";

//Este escaner se basa en OCR (Optical Character Recognition) 
//para reconocer el nombre de la carta en una imagen y buscarla en el catálogo.

//Utiliza la librería tesseract.js para procesar la imagen y extraer el texto,
//y luego compara el texto reconocido con los nombres de las cartas en el catálogo,
//permitiendo al usuario elegir la carta correcta y agregarla a su inventario.

//Normaliza texto y nombres para que la comparación no dependa de acentos o mayusculas.
const normalize = (value) => value

  .normalize("NFD")//Descompone caracteres Unicode en sus componentes base y diacriticos 
  //(signo gráfico añadido a una letra para modificar su valor fonético).

  .replace(/[\u0300-\u036f]/g, "") //Elimina acentos y diacriticos 
  //para que la comparacion no dependa de ellos.

  .toLowerCase() //Pasa a minusculas para que la comparacion no dependa de mayusculas.

  .replace(/[^a-z0-9]+/g, " ") //Reemplaza caracteres no alfanumericos 
  //por espacios para que la comparacion no dependa de signos de puntuacion.

  .trim(); //Elimina espacios al inicio y al final para que la comparacion no dependa de ellos.

//Calcula la distancia de edicion entre dos palabras para tolerar pequeños errores de OCR.

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

//Ordena las cartas segun la coincidencia entre el texto reconocido y sus nombres.
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

//Componente que permite al usuario escanear una carta con la camara o subir una imagen para reconocer su nombre.
function CardScanner({ cards, onAdd }) {
  const { t } = useI18n();

  //Estado del archivo, progreso de OCR y criterios de búsqueda manual.
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const [search, setSearch] = useState("");

  //Extrae texto de la imagen seleccionada y comunica el resultado al usuario.
  async function handleScan(event){

    //Submite el formulario, evita que se recargue la pagina 
    //y no hace nada si no hay archivo o ya se esta escaneando.
    event.preventDefault();
    if (!file || scanning) return;

    setScanning(true);
    setStatus({ key: "readingCard" });
    let worker; //Crea un trabajador de Tesseract.js para procesar la imagen y reconocer el texto.
    try {
      worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      setRecognizedText(text.trim());
      setSearch("");
      setStatus({ key: text.trim() ? "reviewMatches" : "noTextRead" });
    } catch {
      setStatus({ key: "scannerError" });
    } finally {
      await worker?.terminate(); //Libera los recursos del trabajador para evitar fugas de memoria.
      setScanning(false);
    }
  }

  //Elige sugerencias por OCR o resultados manuales según el texto de búsqueda activo.
  const suggestions = rankCards(cards, recognizedText);
  const visibleCards = search.trim()
    ? cards.filter((card) => normalize(card.name).includes(normalize(search)))
    : suggestions;

  //Añade la carta elegida y limpia el escaneo si la operación tiene exito.
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
      <form onSubmit={handleScan} className="scanner-form">
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
          <GroupedCardGrid cards={visibleCards} collapsible={false} renderCard={(card) => (
              <CardLayout key={card.id} card={card}
                actionLabel={card.trade_available > 0 ? t("addThisCard") : t("outOfStock")}
                actionDisabled={!(card.trade_available > 0)}
                onAction={card.trade_available > 0 ? () => chooseCard(card) : undefined} />
          )} />
        </>
      )}
    </section>
  );
}

export default CardScanner;
