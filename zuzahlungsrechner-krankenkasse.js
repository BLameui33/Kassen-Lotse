// zuzahlungsrechner-krankenkasse.js

// Hilfsfunktionen
function parseEuroInput(el) {
  if (!el) return 0;
  const raw = (el.value || "").toString().replace(",", ".");
  const num = Number(raw);
  if (Number.isNaN(num) || num < 0) return 0;
  return num;
}

function formatEuro(value) {
  const v = Number.isFinite(value) ? value : 0;
  return v.toFixed(2).replace(".", ",") + " €";
}

/**
 * Berechnet eine vereinfachte Zuzahlungs-Belastungsgrenze:
 * - 2 % der jährlichen Bruttoeinnahmen
 * - 1 % bei schwerwiegend chronisch Kranken
 *
 * WICHTIG: Freibeträge für Angehörige usw. werden hier NICHT berücksichtigt.
 */
function berechneBelastungsgrenze(bruttoJahresEinkommen, istChronisch) {
  const faktor = istChronisch ? 0.01 : 0.02;
  return bruttoJahresEinkommen * faktor;
}

function zeigeZuzErgebnis(container, daten) {
  const {
    versicherungsart,
    brutto,
    istChronisch,
    belastungsgrenze,
    bisherGezahlt,
    restBisGrenze,
    geplant,
    gesamtMitGeplant,
    ueberGrenzeMitGeplant
  } = daten;

  const artText =
    versicherungsart === "gkv"
      ? "Gesetzliche Krankenversicherung (GKV)"
      : "Private Krankenversicherung / Beihilfe (Regeln abweichend)";

  const prozentText = istChronisch ? "1&nbsp;%" : "2&nbsp;%";

  let statusJetzt;
  if (bisherGezahlt >= belastungsgrenze && belastungsgrenze > 0) {
    statusJetzt =
      "Nach dieser vereinfachten Berechnung hast du deine Belastungsgrenze im laufenden Jahr bereits erreicht oder überschritten. Du kannst bei deiner Krankenkasse eine Zuzahlungsbefreiung und ggf. Erstattung prüfen lassen.";
  } else if (belastungsgrenze === 0) {
    statusJetzt =
      "Für die Berechnung wurde ein jährliches Bruttoeinkommen von 0 Euro eingegeben. Bitte prüfe deine Angaben.";
  } else {
    statusJetzt =
      "Du hast deine Belastungsgrenze nach dieser vereinfachten Berechnung noch nicht erreicht.";
  }

  let statusGeplant = "";
  if (geplant > 0 && belastungsgrenze > 0) {
    if (gesamtMitGeplant >= belastungsgrenze) {
      statusGeplant =
        "Mit den zusätzlich geplanten Zuzahlungen würdest du deine Belastungsgrenze voraussichtlich überschreiten. Alles, was darüber hinausgeht, kannst du dir unter Umständen erstatten lassen.";
    } else {
      statusGeplant =
        "Selbst mit den geplanten Zuzahlungen würdest du deine Belastungsgrenze nach dieser Berechnung noch nicht erreichen.";
    }
  }

  let hinweisVersicherung = "";
  if (versicherungsart !== "gkv") {
    hinweisVersicherung = `
      <p class="hinweis">
        Du hast <strong>Private Krankenversicherung / Beihilfe</strong> ausgewählt.
        Die hier dargestellte 1&nbsp;% / 2&nbsp;%-Regel gilt aber für die
        gesetzliche Krankenversicherung. Nutze das Ergebnis daher nur als
        grobe Orientierung und lass dich unbedingt von deiner Versicherung beraten.
      </p>
    `;
  }

  container.innerHTML = `
    <h2>Ergebnis: Zuzahlungs-Belastungsgrenze</h2>

    <div class="pflegegrad-result-card">
      <p>
        <strong>Versicherung:</strong> ${artText}<br>
        <strong>Jährliches Bruttoeinkommen (vereinfachte Angabe):</strong>
        ${formatEuro(brutto)}<br>
        <strong>Regel:</strong> ${prozentText} des jährlichen Bruttoeinkommens
        (${istChronisch ? "schwerwiegend chronisch krank" : "nicht chronisch / keine Bescheinigung hinterlegt"})
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
            <td><strong>Jährliche Belastungsgrenze (vereinfachte Berechnung)</strong></td>
            <td><strong>${formatEuro(belastungsgrenze)}</strong></td>
          </tr>
          <tr>
            <td>Bisher gezahlte Zuzahlungen (dieses Jahr)</td>
            <td>${formatEuro(bisherGezahlt)}</td>
          </tr>
          <tr>
            <td><strong>Noch verbleibender Betrag bis zur Belastungsgrenze</strong></td>
            <td><strong>${formatEuro(restBisGrenze)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>Optionale Vorschau mit geplanten Zuzahlungen</h3>
      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Position</th>
            <th>Betrag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Voraussichtlich noch anfallende Zuzahlungen</td>
            <td>${formatEuro(geplant)}</td>
          </tr>
          <tr>
            <td><strong>Bisher + geplant insgesamt</strong></td>
            <td><strong>${formatEuro(gesamtMitGeplant)}</strong></td>
          </tr>
          <tr>
            <td><strong>Betrag über der Belastungsgrenze (mit geplant)</strong></td>
            <td><strong>${formatEuro(ueberGrenzeMitGeplant)}</strong></td>
          </tr>
        </tbody>
      </table>

      <p>${statusJetzt}</p>
      ${statusGeplant ? `<p>${statusGeplant}</p>` : ""}
    </div>

    ${hinweisVersicherung}

    <p class="hinweis">
      In der Realität ziehen die Krankenkassen von deinem Bruttoeinkommen noch
      <strong>Freibeträge für Ehepartner und Kinder</strong> ab und berücksichtigen
      ggf. weitere Besonderheiten (z.&nbsp;B. bei Bürgergeld, Grundsicherung).
      Frage bei deiner Krankenkasse nach, welche Unterlagen du für eine
      <strong>Zuzahlungsbefreiung</strong> einreichen musst.
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
    const brutto = parseEuroInput(einkommenInput);
    const versArt = versArtSelect ? versArtSelect.value : "gkv";
    const istChronisch = chronischCheck ? chronischCheck.checked : false;
    const bisherGezahlt = parseEuroInput(bisherInput);
    const geplant = parseEuroInput(geplantInput);

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
      setTimeout(() => {
        ergebnisContainer.innerHTML = "";
      }, 0);
    });
  }
});
