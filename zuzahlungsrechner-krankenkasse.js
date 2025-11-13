// zuzahlungsrechner-krankenkasse.js

// Hilfsfunktionen
function parseEuroInput(el) {
  if (!el) return 0;
  const raw = (el.value || "").toString().replace(",", ".");
  const num = Number(raw);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}
function formatEuro(value) {
  const v = Number.isFinite(value) ? value : 0;
  return v.toFixed(2).replace(".", ",") + " €";
}

// Vereinfachte Belastungsgrenze: 2 % bzw. 1 % (chronisch)
function berechneBelastungsgrenze(bruttoJahresEinkommen, istChronisch) {
  const faktor = istChronisch ? 0.01 : 0.02;
  return Math.max(0, bruttoJahresEinkommen) * faktor;
}

function renderError(container, messages) {
  const lis = messages.map(m => `<li>${m}</li>`).join("");
  container.innerHTML = `
    <div class="pflegegrad-result-card">
      <h2>Bitte Angaben prüfen</h2>
      <ul>${lis}</ul>
    </div>
  `;
}

function zeigeZuzErgebnis(container, daten) {
  const {
    versicherungsart, brutto, istChronisch, belastungsgrenze,
    bisherGezahlt, restBisGrenze, geplant, gesamtMitGeplant, ueberGrenzeMitGeplant
  } = daten;

  const artText = versicherungsart === "gkv"
    ? "Gesetzliche Krankenversicherung (GKV)"
    : "Private Krankenversicherung / Beihilfe (Regeln abweichend)";

  const prozentText = istChronisch ? "1&nbsp;%" : "2&nbsp;%";

  let statusJetzt = "";
  if (belastungsgrenze === 0) {
    statusJetzt = "Das jährliche Bruttoeinkommen wurde mit 0 € angegeben. Bitte die Eingaben prüfen.";
  } else if (bisherGezahlt >= belastungsgrenze) {
    statusJetzt = "Nach dieser vereinfachten Berechnung ist die Belastungsgrenze bereits erreicht/überschritten. Zuzahlungsbefreiung/Erstattung bei der Krankenkasse prüfen.";
  } else {
    statusJetzt = "Die Belastungsgrenze ist nach dieser vereinfachten Berechnung noch nicht erreicht.";
  }

  const statusGeplant = geplant > 0 && belastungsgrenze > 0
    ? (gesamtMitGeplant >= belastungsgrenze
        ? "Mit den geplanten Zuzahlungen würdest du die Belastungsgrenze voraussichtlich überschreiten. Beträge darüber hinaus können ggf. erstattet werden."
        : "Selbst mit den geplanten Zuzahlungen wird die Belastungsgrenze voraussichtlich nicht erreicht.")
    : "";

  const hinweisVersicherung = versicherungsart !== "gkv" ? `
    <p class="hinweis">
      Du hast <strong>PKV/Beihilfe</strong> gewählt. Die 1&nbsp;%/2&nbsp;%-Regel gilt für die GKV.
      Bitte nutze das Ergebnis nur als grobe Orientierung und kläre Details mit deinem Versicherer.
    </p>` : "";

  container.innerHTML = `
    <h2>Ergebnis: Zuzahlungs-Belastungsgrenze</h2>

    <div class="pflegegrad-result-card">
      <p>
        <strong>Versicherung:</strong> ${artText}<br>
        <strong>Jährliches Bruttoeinkommen (vereinfacht):</strong> ${formatEuro(brutto)}<br>
        <strong>Regel:</strong> ${prozentText} des jährlichen Bruttoeinkommens
        (${istChronisch ? "schwerwiegend chronisch krank" : "ohne Chroniker-Nachweis"})
      </p>

      <h3>Aktueller Stand</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Position</th><th>Betrag</th></tr></thead>
        <tbody>
          <tr><td><strong>Jährliche Belastungsgrenze (vereinfacht)</strong></td><td><strong>${formatEuro(belastungsgrenze)}</strong></td></tr>
          <tr><td>Bisher gezahlte Zuzahlungen</td><td>${formatEuro(bisherGezahlt)}</td></tr>
          <tr><td><strong>Noch offen bis zur Grenze</strong></td><td><strong>${formatEuro(restBisGrenze)}</strong></td></tr>
        </tbody>
      </table>

      <h3>Vorschau (mit geplanten Zuzahlungen)</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Position</th><th>Betrag</th></tr></thead>
        <tbody>
          <tr><td>Voraussichtlich noch anfallende Zuzahlungen</td><td>${formatEuro(geplant)}</td></tr>
          <tr><td><strong>Bisher + geplant insgesamt</strong></td><td><strong>${formatEuro(gesamtMitGeplant)}</strong></td></tr>
          <tr><td><strong>Über der Grenze (mit geplant)</strong></td><td><strong>${formatEuro(ueberGrenzeMitGeplant)}</strong></td></tr>
        </tbody>
      </table>

      <p>${statusJetzt}</p>
      ${statusGeplant ? `<p>${statusGeplant}</p>` : ""}
    </div>

    ${hinweisVersicherung}

    <p class="hinweis">
      Krankenkassen ziehen von den Bruttoeinnahmen regelmäßig <strong>Freibeträge</strong> (z. B. für Ehepartner/Kinder) ab
      und berücksichtigen Besonderheiten (z. B. Bürgergeld/Grundsicherung). Erfrage bei deiner Krankenkasse die
      <strong>erforderlichen Nachweise</strong> für Zuzahlungsbefreiung/Erstattung.
    </p>
  `;
}

// DOM-Initialisierung
document.addEventListener("DOMContentLoaded", () => {
  const einkommenInput = document.getElementById("zuz_einkommen");
  const versArtSelect = document.getElementById("zuz_versicherungsart");
  const chronischCheck = document.getElementById("zuz_chronisch");
  const bisherInput = document.getElementById("zuz_bisher");
  const geplantInput = document.getElementById("zuz_geplant");

  const berechnenBtn = document.getElementById("zuz_berechnen");
  const resetBtn = document.getElementById("zuz_reset");
  const ergebnisContainer = document.getElementById("zuz_ergebnis");

  if (!berechnenBtn || !ergebnisContainer) return;

  berechnenBtn.addEventListener("click", () => {
    // sanfte Validierung
    const errors = [];
    const brutto = parseEuroInput(einkommenInput);
    const bisherGezahlt = parseEuroInput(bisherInput);
    const geplant = parseEuroInput(geplantInput);

    if (!(brutto > 0)) errors.push("Bitte ein jährliches Bruttoeinkommen größer 0 € eingeben.");
    if (bisherGezahlt < 0) errors.push("Bisherige Zuzahlungen dürfen nicht negativ sein.");
    if (geplant < 0) errors.push("Geplante Zuzahlungen dürfen nicht negativ sein.");

    if (errors.length) { renderError(ergebnisContainer, errors); ergebnisContainer.scrollIntoView({ behavior: "smooth" }); return; }

    const versArt = versArtSelect ? versArtSelect.value : "gkv";
    const istChronisch = chronischCheck ? chronischCheck.checked : false;

    const belastungsgrenze = berechneBelastungsgrenze(brutto, istChronisch);
    const restBisGrenze = Math.max(belastungsgrenze - bisherGezahlt, 0);
    const gesamtMitGeplant = Math.max(bisherGezahlt + geplant, 0);
    const ueberGrenzeMitGeplant = Math.max(gesamtMitGeplant - belastungsgrenze, 0);

    const daten = {
      versicherungsart: versArt,
      brutto,
      istChronisch,
      belastungsgrenze,
      bisherGezahlt,
      restBisGrenze,
      geplant,
      gesamtMitGeplant,
      ueberGrenzeMitGeplant
    };

    zeigeZuzErgebnis(ergebnisContainer, daten);
    ergebnisContainer.scrollIntoView({ behavior: "smooth" });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      setTimeout(() => { ergebnisContainer.innerHTML = ""; }, 0);
    });
  }
});
