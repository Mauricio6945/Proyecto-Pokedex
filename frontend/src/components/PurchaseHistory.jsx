import { useI18n } from "../i18n";

//Presenta las operaciones de compra y venta registradas por el usuario.
function PurchaseHistory({ entries }) {
  const { language, t } = useI18n();

  //Convierte la marca temporal almacenada a una fecha y hora legibles.
  function formatDateTime(value) {
    const date = new Date(value);
    const parts = new Intl.DateTimeFormat(language === "es" ? "es-CL" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(date);
    const dateParts = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
    const time = new Intl.DateTimeFormat(language === "es" ? "es-CL" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date);

    return {
      date: `${dateParts.day}/${dateParts.month}/${dateParts.year}`,
      time,
    };
  }

  return (
    <section className="purchase-history">
      <h2>{t("historyTitle")}</h2>
      {entries.length === 0 ? <p>{t("historyEmpty")}</p> : (
        <ol className="purchase-history-list">
          {entries.map((entry) => {
            const { date, time } = formatDateTime(entry.occurredAt);
            const key = entry.action === "buy" ? "historyBought" : "historySold";
            return (
              <li key={entry.id}>
                {t(key, {
                  name: entry.cardName,
                  set: entry.setName || t("unknownSet"),
                  date,
                  time,
                })}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export default PurchaseHistory;
