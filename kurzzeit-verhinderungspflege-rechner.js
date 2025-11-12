// kurzzeit-verhinderungspflege-rechner.js

// Gemeinsamer Jahresbetrag Kurzzeitpflege + Verhinderungspflege 2025
// (ab Pflegegrad 2): 3.539 Euro
const KVP_JAHRESBUDGET_2025 = 3539;

// Pflegegrad 1: kein eigener Anspruch auf dieses Budget
// (nur Entlastungsbetrag, hier nicht mitgerechnet)

function parseEuroInput(inputElement) {
  if (!inputElement) return 0;
  const value = Number(inputElement.value.toString().replace(",", "."));
  if (Number.isNaN(value) || value < 0) return 0;
  return value;
}

function formatEuro(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toFixed(2).replace(".", ",") + " €";
}

function berechneKVPBudget(pflegegrad, jahr, bereitsKurz, bereitsVerh, geplantKurz, geplantVerh) {
  const grad = Number(pflegegrad);
  const year = String(jahr);

  // Aktuell nur 2025 hinterlegt
  const jahresBudget =
    year === "2025" && grad >= 2 ? KVP_JAHRESBUDGET_2025 : 0;

  const bereitsInanspruchgenommen = Math.max(0, bereitsKurz + bereitsVerh);
  const bereitsBegrenzt = Math.min(bereitsInanspruchgenommen, jahresBudget);

  const restBudget = Math.max(0, jahresBudget - bereitsBegrenzt);

  const geplantGesamt = Math.max(0, geplantKurz + geplantVerh);

  let vonKasseUebernommen = 0;
  let eigenanteil = 0;

  if (geplantGesamt <= restBudget) {
    vonKasseUebernommen = geplantGesamt;
    eigenanteil = 0;
  } else {
    vonKasseUebernommen = restBudget;
    eigenanteil = geplantGesamt - restBudget;
  }

  return {
    pflegegrad: grad,
    jahr: year,
    jahresBudget,
    bereitsKurz,
    bereitsVerh,
    bereitsInanspruchgenommen,
    restBudget,
    geplantKurz,
    geplantVerh,
    geplantGesamt,
    vonKasseUebernommen,
    eigenanteil
  };
}

function baueHinweisText(daten) {
  const { pflegegrad, jahresBudget } = daten;

  if (pflegegrad === 1) {
    return `
      <p class="hinweis">
        Bei <strong>Pflegegrad 1</strong> besteht in der Regel kein eigener Anspruch
        auf Kurzzeit- oder Verhinderungspflege aus diesem Budget.
        Allerdings kann der <strong>Entlastungsbetrag (131&nbsp;Euro/Monat)</strong>
        teilweise für vergleichbare Leistungen eingesetzt werden.
        Dies berücksichtigt dieser Rechner nicht – lass dich im Zweifel beraten.
      </p>
    `;
  }

  if (jahresBudget <= 0) {
    return `
      <p class="hinweis">
        Für das ausgewählte Jahr ist in diesem Rechner kein gemeinsamer Jahresbetrag
        hinterlegt. Prüfe bitte die aktuellen Werte bei deiner Pflegekasse
        oder nutze eine aktuelle Informationsquelle.
      </p>
    `;
  }

  return `
    <p class="hinweis">
      Der gemeinsame Jahresbetrag von <strong>${formatEuro(jahresBudget)}</strong>
      kann flexibel für <strong>Kurzzeitpflege</strong> und
      <strong>Verhinderungspflege</strong> genutzt werden.
      Zusätzlich kann in vielen Fällen auch der
      <strong>Entlastungsbetrag</strong> eingesetzt werden
      (nicht in dieser Berechnung enthalten).
    </p>
  `;
}

function zeigeKVPResult(container, daten) {
  const {
    pflegegrad,
    jahr,
    jahresBudget,
    bereitsKurz,
    bereitsVerh,
    bereitsInanspruchgenommen,
    restBudget,
    geplantKurz,
    geplantVerh,
    geplantGesamt,
    vonKasseUebernommen,
    eigenanteil
  } = daten;

  const hinweis = baueHinweisText(daten);

  let deckungText = "";
  if (geplantGesamt === 0) {
    deckungText =
      "Du hast keine geplanten weiteren Kosten eingetragen. Das Ergebnis zeigt nur dein voraussichtliches Restbudget.";
  } else if (eigenanteil <= 0) {
    deckungText =
      "Nach dieser vereinfachten Berechnung können die geplanten Kosten vollständig durch das noch verfügbare Budget gedeckt werden.";
  } else {
    deckungText =
      "Die geplanten Kosten übersteigen das verfügbare Budget. Es bleibt voraussichtlich ein Eigenanteil, den ihr selbst tragen müsst.";
  }

  container.innerHTML = `
    <h2>Ergebnis: Kurzzeitpflege- &amp; Verhinderungspflege-Budget</h2>

    <div class="pflegegrad-result-card">
      <p>
        <strong>Pflegegrad:</strong> ${pflegegrad}<br>
        <strong>Kalenderjahr:</strong> ${jahr}<br>
        <strong>Gemeinsamer Jahresbetrag (vereinfachte Annahme):</strong>
        ${formatEuro(jahresBudget)}
      </p>

      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Position</th>
            <th>Betrag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bereits übernommene Kurzzeitpflege</td>
            <td>${formatEuro(bereitsKurz)}</td>
          </tr>
          <tr>
            <td>Bereits übernommene Verhinderungspflege</td>
            <td>${formatEuro(bereitsVerh)}</td>
          </tr>
          <tr>
            <td><strong>Bisher insgesamt ausgeschöpft</strong></td>
            <td><strong>${formatEuro(bereitsInanspruchgenommen)}</strong></td>
          </tr>
          <tr>
            <td><strong>Voraussichtlich verbleibendes Budget im Jahr</strong></td>
            <td><strong>${formatEuro(restBudget)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>Geplante weitere Einsätze in diesem Kalenderjahr</h3>

      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Art</th>
            <th>Geplante Kosten</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kurzzeitpflege</td>
            <td>${formatEuro(geplantKurz)}</td>
          </tr>
          <tr>
            <td>Verhinderungspflege</td>
            <td>${formatEuro(geplantVerh)}</td>
          </tr>
          <tr>
            <td><strong>Geplante Gesamtkosten</strong></td>
            <td><strong>${formatEuro(geplantGesamt)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>Deckung durch die Pflegekasse (vereinfachte Berechnung)</h3>
      <p>
        <strong>Voraussichtlich von der Pflegekasse übernehmbar:</strong>
        ${formatEuro(vonKasseUebernommen)}<br>
        <strong>Voraussichtlicher Eigenanteil:</strong>
        ${formatEuro(eigenanteil)}
      </p>

      <p>${deckungText}</p>
    </div>

    ${hinweis}

    <p class="hinweis">
      Diese Berechnung berücksichtigt keine Besonderheiten wie z. B. die Weiterzahlung
      des hälftigen Pflegegeldes während Kurzzeitpflege/Verhinderungspflege,
      abweichende Vergütungen von Einrichtungen oder besondere Regelungen bei nahen
      Angehörigen. Im Zweifel immer die <strong>Pflegekasse</strong> oder eine
      <strong>Pflegeberatung</strong> kontaktieren.
    </p>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const gradSelect = document.getElementById("kvp_pflegegrad");
  const jahrSelect = document.getElementById("kvp_jahr");

  const bereitsKurzInput = document.getElementById("kvp_bereits_kurz");
  const bereitsVerhInput = document.getElementById("kvp_bereits_verh");
  const geplantKurzInput = document.getElementById("kvp_geplant_kurz");
  const geplantVerhInput = document.getElementById("kvp_geplant_verh");

  const berechnenBtn = document.getElementById("kvp_berechnen");
  const resetBtn = document.getElementById("kvp_reset");
  const ergebnisContainer = document.getElementById("kvp_ergebnis");

  if (!berechnenBtn || !ergebnisContainer) return;

  berechnenBtn.addEventListener("click", () => {
    const grad = gradSelect ? gradSelect.value : "2";
    const jahr = jahrSelect ? jahrSelect.value : "2025";

    const bereitsKurz = parseEuroInput(bereitsKurzInput);
    const bereitsVerh = parseEuroInput(bereitsVerhInput);
    const geplantKurz = parseEuroInput(geplantKurzInput);
    const geplantVerh = parseEuroInput(geplantVerhInput);

    const daten = berechneKVPBudget(
      grad,
      jahr,
      bereitsKurz,
      bereitsVerh,
      geplantKurz,
      geplantVerh
    );

    zeigeKVPResult(ergebnisContainer, daten);
    ergebnisContainer.scrollIntoView({ behavior: "smooth" });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      setTimeout(() => {
        ergebnisContainer.innerHTML = "";
      }, 0);
    });
  }
});
