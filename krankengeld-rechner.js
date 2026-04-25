// krankengeld-rechner.js

// Gesetzliche Eckwerte 2026 (Beitragsbemessungsgrenze 5.812,50 €/Monat)
// Regelentgelt max = 193,75 €/Tag -> 70% davon = 135,63 €
const KRANKENGELD_TAGES_HOECHSTBETRAG_2026 = 135.63; // €/Tag (ca. 4.068,90 €/Monat)

function parseNumber(el) {
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
 * Krankengeld-Basisberechnung (brutto):
 * - 70 % des Bruttoentgelts
 * - maximal 90 % des Nettoentgelts
 * - begrenzt durch den täglichen Höchstbetrag 2026
 * Wir rechnen mit 30 Tagen/Monat (vereinfachte Sozialversicherungslogik).
 */
function berechneKrankengeldBrutto(bruttoMonat, nettoMonat) {
  const brutto = Math.max(0, bruttoMonat);
  const netto = Math.max(0, nettoMonat);

  // Monatliche Grenzen
  const kg70BruttoMonat = brutto * 0.7;
  const kg90NettoMonat = netto * 0.9;

  // Erster Schritt: 70 % Brutto, maximal 90 % Netto
  let krankengeldMonat = Math.min(kg70BruttoMonat, kg90NettoMonat);

  // Täglicher Wert (30-Tage-Monat)
  let krankengeldTag = krankengeldMonat / 30;

  // Deckelung: täglicher Höchstbetrag 2026
  if (krankengeldTag > KRANKENGELD_TAGES_HOECHSTBETRAG_2026) {
    krankengeldTag = KRANKENGELD_TAGES_HOECHSTBETRAG_2026;
    krankengeldMonat = krankengeldTag * 30;
  }

  return {
    krankengeldTag,
    krankengeldMonat
  };
}

/**
 * Netto-Krankengeld: Abzug pauschaler Sozialversicherungsbeiträge
 * (Rente, Arbeitslosenversicherung, Pflegeversicherung).
 */
function berechneKrankengeldNetto(kgMonatBrutto, abzugProzent) {
  const faktor = Math.min(Math.max(abzugProzent, 0), 30) / 100; // 0–30 %
  const abzug = kgMonatBrutto * faktor;
  const netto = Math.max(0, kgMonatBrutto - abzug);
  return {
    abzugBetrag: abzug,
    nettoMonat: netto
  };
}

function baueHinweisVersicherungsstatus(status) {
  if (status === "gkv") {
    return `
      <p class="hinweis">
        Du bist laut Auswahl <strong>gesetzlich versichert (Arbeitnehmer mit Krankengeldanspruch)</strong>.
        Der Rechner orientiert sich an den allgemeinen gesetzlichen Regeln für 2026.
      </p>
    `;
  }
  if (status === "selbst") {
    return `
      <p class="hinweis">
        Du hast <strong>gesetzlich versichert – selbstständig</strong> gewählt.
        Selbstständige haben nur dann Anspruch auf Krankengeld,
        wenn sie einen entsprechenden <strong>Wahltarif</strong> abgeschlossen haben.
        Die Berechnung hier ist eine Orientierung – prüfe deine Vertragsbedingungen.
      </p>
    `;
  }
  // privat
  return `
    <p class="hinweis">
      Du hast <strong>privat versichert / andere Regelung</strong> gewählt.
      Die hier dargestellte Krankengeldberechnung basiert auf den Regeln der
      gesetzlichen Krankenversicherung. Private Krankentagegeld-Tarife
      können ganz andere Leistungen vorsehen.
    </p>
  `;
}

function zeigeKgErgebnis(container, daten) {
  const {
    brutto,
    netto,
    status,
    tage,
    abzugProzent,
    krankengeldTagBrutto,
    krankengeldMonatBrutto,
    krankengeldGesamtBrutto,
    abzugMonat,
    krankengeldMonatNetto,
    krankengeldGesamtNetto
  } = daten;

  const statusHinweis = baueHinweisVersicherungsstatus(status);

  // Prüfen ob die Deckelung gegriffen hat (YMYL-Transparenz)
  const isCapped = krankengeldTagBrutto >= KRANKENGELD_TAGES_HOECHSTBETRAG_2026;

  let tageText = "";
  if (tage > 0) {
    tageText = `
      <p>
        Für <strong>${tage}</strong> Tage im Krankengeldbezug ergibt sich daraus
        (vereinfachte Rechnung mit 30 Tagen/Monat) folgende Summe:
      </p>
      <ul>
        <li><strong>${formatEuro(krankengeldGesamtBrutto)}</strong> Krankengeld brutto</li>
        <li><strong>${formatEuro(krankengeldGesamtNetto)}</strong> Krankengeld netto (geschätzt)</li>
      </ul>
    `;
  }

  container.innerHTML = `
    <h2>Ergebnis: dein voraussichtliches Krankengeld</h2>

    <div class="pflegegrad-result-card">
      <p>
        <strong>Eingaben:</strong><br>
        Monatliches Brutto: ${formatEuro(brutto)}<br>
        Monatliches Netto: ${formatEuro(netto)}<br>
        Geplanter Zeitraum im Krankengeld: ${tage > 0 ? tage + " Tage" : "nicht angegeben"}<br>
        Angesetzter Abzug für Sozialversicherungsbeiträge: ${abzugProzent.toFixed(1)} %
      </p>

      <h3>Krankengeld (brutto)</h3>
      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Größe</th>
            <th>Betrag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Krankengeld pro Tag (brutto)</td>
            <td>${formatEuro(krankengeldTagBrutto)} ${isCapped ? '<span style="font-size:0.8em; color:#666;">(Höchstsatz 2026)</span>' : ''}</td>
          </tr>
          <tr>
            <td>Krankengeld pro Monat (brutto, 30 Tage)</td>
            <td>${formatEuro(krankengeldMonatBrutto)}</td>
          </tr>
        </tbody>
      </table>

      <h3>Abzüge &amp; Netto-Krankengeld (vereinfachte Schätzung)</h3>
      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Größe</th>
            <th>Betrag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Monatliche Abzüge (Rente, Arbeitslosen-, Pflegeversicherung)</td>
            <td>- ${formatEuro(abzugMonat)}</td>
          </tr>
          <tr style="background-color:#f0f8ff;">
            <td><strong>Krankengeld pro Monat (netto, geschätzt)</strong></td>
            <td><strong>${formatEuro(krankengeldMonatNetto)}</strong></td>
          </tr>
        </tbody>
      </table>

      ${tageText}
    </div>

    ${statusHinweis}

    <p class="hinweis">
      Die Berechnung nutzt zur Vereinfachung einen <strong>30-Tage-Monat</strong>.
      Außerdem werden steuerliche Effekte, Einmalzahlungen und exakte Beitragsbemessungsgrenzen
      nicht vollständig abgebildet. Für eine genaue Berechnung wende dich an deine
      <strong>Krankenkasse</strong> oder deine <strong>Lohnbuchhaltung</strong>.
    </p>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const bruttoInput = document.getElementById("kg_brutto");
  const nettoInput = document.getElementById("kg_netto");
  const statusSelect = document.getElementById("kg_status");
  const tageInput = document.getElementById("kg_tage");
  const kinderstatusSelect = document.getElementById("kg_kinderstatus");
  const abzugInput = document.getElementById("kg_abzug_prozent");

  const berechnenBtn = document.getElementById("kg_berechnen");
  const resetBtn = document.getElementById("kg_reset");
  const ergebnisContainer = document.getElementById("kg_ergebnis");

  if (!berechnenBtn || !ergebnisContainer) return;

  // Kinderstatus -> Neue Vorschlagswerte 2026 für Abzüge setzen
  if (kinderstatusSelect && abzugInput) {
    kinderstatusSelect.addEventListener("change", () => {
      if (kinderstatusSelect.value === "mitkind") {
        abzugInput.value = "12.4"; // Standardabzug 2026 für Eltern
      } else {
        abzugInput.value = "13.0"; // Standardabzug 2026 für Kinderlose (+0,6% PV-Zuschlag)
      }
      ergebnisContainer.innerHTML = "";
    });
  }

  berechnenBtn.addEventListener("click", () => {
    const brutto = parseNumber(bruttoInput);
    const netto = parseNumber(nettoInput);
    const status = statusSelect ? statusSelect.value : "gkv";
    const tage = parseNumber(tageInput);
    const abzugProzent = parseNumber(abzugInput);

    const { krankengeldTag, krankengeldMonat } = berechneKrankengeldBrutto(
      brutto,
      netto
    );

    const { abzugBetrag, nettoMonat } = berechneKrankengeldNetto(
      krankengeldMonat,
      abzugProzent
    );

    const krankengeldGesamtBrutto =
      tage > 0 ? krankengeldTag * tage : 0;
    const krankengeldGesamtNetto =
      tage > 0 ? krankengeldGesamtBrutto * (1 - Math.min(Math.max(abzugProzent, 0), 30) / 100) : 0;

    const daten = {
      brutto,
      netto,
      status,
      tage,
      abzugProzent,
      krankengeldTagBrutto: krankengeldTag,
      krankengeldMonatBrutto: krankengeldMonat,
      krankengeldGesamtBrutto,
      abzugMonat: abzugBetrag,
      krankengeldMonatNetto: nettoMonat,
      krankengeldGesamtNetto
    };

    zeigeKgErgebnis(ergebnisContainer, daten);
    ergebnisContainer.scrollIntoView({ behavior: "smooth" });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      setTimeout(() => {
        // Standardwerte 2026 wiederherstellen
        if (kinderstatusSelect && abzugInput) {
          kinderstatusSelect.value = "mitkind";
          abzugInput.value = "12.4";
        }
        ergebnisContainer.innerHTML = "";
      }, 0);
    });
  }
});