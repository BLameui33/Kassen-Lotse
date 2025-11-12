// pflegegeld-rechner.js

// Pflegegeld ab 2025 (häusliche Pflege durch Angehörige)
// PG1: kein Pflegegeld
const PFLEGEGELD_2025 = {
  1: 0,
  2: 347,
  3: 599,
  4: 800,
  5: 990
};

// Pflegesachleistungen ab 2025 (ambulante Pflegedienste)
const SACHLEISTUNGEN_2025 = {
  1: 0,
  2: 796,
  3: 1497,
  4: 1859,
  5: 2299
};

// Entlastungsbetrag ab 2025 (monatlich)
const ENTLASTUNGSBETRAG_2025 = 131;

// Zahl hübsch als Euro ausgeben (deutsches Format)
function formatEuro(value) {
  return value.toFixed(2).replace(".", ",") + " €";
}

/**
 * Hauptroutine: Pflegegeld / Sachleistungen berechnen.
 * - versorgungsart = "pflegegeld" oder "kombination"
 * - kombiProzent = 0–100 (% ausgeschöpfte Sachleistungen)
 */
function berechnePflegegeld(pflegegrad, versorgungsart, kombiProzent) {
  const grad = Number(pflegegrad);
  const art = versorgungsart;

  const maxPflegegeld = PFLEGEGELD_2025[grad] ?? 0;
  const maxSach = SACHLEISTUNGEN_2025[grad] ?? 0;

  let prozentSach = 0;
  let betragPflegegeld = 0;
  let betragSach = 0;

  if (art === "pflegegeld") {
    prozentSach = 0;
    betragPflegegeld = maxPflegegeld;
    betragSach = 0;
  } else if (art === "kombination") {
    // Prozent sauber begrenzen
    prozentSach = Math.min(100, Math.max(0, Number(kombiProzent) || 0));
    const anteilSach = prozentSach / 100;
    const anteilPflegegeld = 1 - anteilSach;

    betragSach = maxSach * anteilSach;
    betragPflegegeld = maxPflegegeld * anteilPflegegeld;
  }

  const gesamtOhneEntlastung = betragPflegegeld + betragSach;
  const gesamtMitEntlastung = gesamtOhneEntlastung + ENTLASTUNGSBETRAG_2025;

  return {
    pflegegrad: grad,
    versorgungsart: art,
    prozentSach,
    maxPflegegeld,
    maxSach,
    betragPflegegeld,
    betragSach,
    entlastung: ENTLASTUNGSBETRAG_2025,
    gesamtOhneEntlastung,
    gesamtMitEntlastung
  };
}

/**
 * Ergebnis in den DOM schreiben
 */
function zeigePflegegeldErgebnis(container, daten) {
  const {
    pflegegrad,
    versorgungsart,
    prozentSach,
    maxPflegegeld,
    maxSach,
    betragPflegegeld,
    betragSach,
    entlastung,
    gesamtOhneEntlastung,
    gesamtMitEntlastung
  } = daten;

  const artText =
    versorgungsart === "pflegegeld"
      ? "Nur Pflegegeld (keine ambulanten Sachleistungen)"
      : `Kombination Pflegegeld + Pflegesachleistungen (Pflegedienst nutzt ca. ${prozentSach.toFixed(
          0
        )} % des Sachleistungsbudgets)`;

  container.innerHTML = `
    <h2>Ergebnis Pflegegeld</h2>

    <div class="pflegegrad-result-card">
      <p>
        <strong>Pflegegrad:</strong> ${pflegegrad} <br />
        <strong>Versorgungsart:</strong> ${artText}
      </p>

      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Leistung</th>
            <th>Maximalbetrag ab 2025</th>
            <th>Voraussichtlicher Betrag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pflegegeld (häusliche Pflege)</td>
            <td>${formatEuro(maxPflegegeld)}</td>
            <td>${formatEuro(betragPflegegeld)}</td>
          </tr>
          <tr>
            <td>Pflegesachleistungen (ambulante Dienste)</td>
            <td>${formatEuro(maxSach)}</td>
            <td>${formatEuro(betragSach)}</td>
          </tr>
          <tr>
            <td>Entlastungsbetrag</td>
            <td>${formatEuro(entlastung)}</td>
            <td>${formatEuro(entlastung)}</td>
          </tr>
        </tbody>
      </table>

      <p>
        <strong>Summe ohne Entlastungsbetrag:</strong>
        ${formatEuro(gesamtOhneEntlastung)} pro Monat
      </p>
      <p>
        <strong>Summe inkl. Entlastungsbetrag:</strong>
        ${formatEuro(gesamtMitEntlastung)} pro Monat
      </p>
    </div>

    <p class="hinweis">
      Hinweis: Das Pflegegeld wird bei Inanspruchnahme von Pflegesachleistungen
      anteilig gekürzt. In diesem Rechner wird davon ausgegangen, dass die Kürzung
      im gleichen Verhältnis erfolgt wie der Anteil der genutzten Sachleistungen.
      Die tatsächliche Abrechnung erfolgt immer über deine Pflegekasse.
    </p>
  `;
}

// DOM-Logik
document.addEventListener("DOMContentLoaded", () => {
  const gradSelect = document.getElementById("pg_pflegegrad");
  const artSelect = document.getElementById("pg_versorgungsart");
  const prozentRow = document.getElementById("pg_sach_prozent_row");
  const prozentRange = document.getElementById("pg_sach_prozent");
  const prozentInput = document.getElementById("pg_sach_prozent_input");

  const berechnenBtn = document.getElementById("pg_berechnen");
  const resetBtn = document.getElementById("pg_reset");
  const ergebnisContainer = document.getElementById("pflegegeld-ergebnis");

  if (!gradSelect || !artSelect || !berechnenBtn || !ergebnisContainer) return;

  function updateVersorgungsartUI() {
    const art = artSelect.value;
    if (art === "kombination") {
      prozentRow.style.display = "block";
    } else {
      prozentRow.style.display = "none";
    }
    ergebnisContainer.innerHTML = "";
  }

  // Versorgungsart umschalten
  artSelect.addEventListener("change", updateVersorgungsartUI);
  updateVersorgungsartUI();

  // Slider/Number synchronisieren
  if (prozentRange && prozentInput) {
    prozentRange.addEventListener("input", () => {
      prozentInput.value = prozentRange.value;
    });

    prozentInput.addEventListener("input", () => {
      let val = Number(prozentInput.value) || 0;
      if (val < 0) val = 0;
      if (val > 100) val = 100;
      prozentInput.value = val;
      prozentRange.value = val;
    });
  }

  // Berechnen
  berechnenBtn.addEventListener("click", () => {
    const grad = gradSelect.value;
    const art = artSelect.value;
    const kombiProzent =
      art === "kombination" && prozentInput ? Number(prozentInput.value) : 0;

    const daten = berechnePflegegeld(grad, art, kombiProzent);
    zeigePflegegeldErgebnis(ergebnisContainer, daten);
    ergebnisContainer.scrollIntoView({ behavior: "smooth" });
  });

  // Reset
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      setTimeout(() => {
        if (prozentRange && prozentInput) {
          prozentRange.value = "50";
          prozentInput.value = "50";
        }
        artSelect.value = "pflegegeld";
        updateVersorgungsartUI();
        ergebnisContainer.innerHTML = "";
      }, 0);
    });
  }
});
