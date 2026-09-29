// em-rente-schaetzer.js

// ============================================================
// PFLEGE-BEREICH: Werte, die regelmäßig aktualisiert werden müssen
// ============================================================
const RENTENWERT = 42.52;                 // € je Entgeltpunkt, gültig 01.07.2026 – 30.06.2027
const RENTENWERT_STAND = "01.07.2026";    // wird im Ergebnis angezeigt
const MAX_ABSCHLAG_PROZENT = 10.8;        // EM-Rente: 0,3 % je Monat, max. 36 Monate
const DEFAULT_REGELALTER = 67;
const MIN_ALTER = 16;
const MAX_KVPV_PROZENT = 20;
// ============================================================

function num(el) {
  if (!el) return 0;
  let raw = (el.value || "").toString().trim().replace(/\s/g, "");
  // "1.234,56" -> "1234.56" | "12,5" -> "12.5"
  if (raw.includes(",")) raw = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function euro(v) {
  const n = Number.isFinite(v) ? v : 0;
  return n.toFixed(2).replace(".", ",") + " €";
}

function yearsUntil(ageNow, targetAge) {
  return Math.max(0, (targetAge || DEFAULT_REGELALTER) - Math.max(0, ageNow || 0));
}

function estimateAgeFromBirthYear(birthYear) {
  const year = new Date().getFullYear();
  if (!birthYear || birthYear <= 0) return 0;
  return Math.max(0, year - birthYear);
}

function calcZurechnungsEP(modus, epProJahr, restJahre, manuellEP) {
  if (modus === "keine") return 0;
  if (modus === "manuell") return Math.max(0, manuellEP || 0);

  // auto: einfache Schätzung -> durchschnittliche EP/Jahr * Restjahre
  const jahre = Math.max(0, restJahre || 0);
  const epJahr = Math.max(0, epProJahr || 0);
  return epJahr * jahre;
}

function calcEmRente({
  art,               // "voll" | "teilweise"
  geburtsjahr,
  alter,
  regelalter,
  epBisher,
  epProJahr,
  zrzModus,
  zrzEPmanuell,
  rentenwert,
  abschlagProzent,
  abzugKvPvProzent
}) {
  // Alter bestimmen
  let age = Math.max(0, alter || 0);
  if (!age && geburtsjahr) {
    age = estimateAgeFromBirthYear(geburtsjahr);
  }

  const targetAge = Math.max(60, regelalter || DEFAULT_REGELALTER);

  // Im Auto-Modus wird das Alter zwingend gebraucht
  if (zrzModus === "auto" && (age < MIN_ALTER || age >= targetAge)) {
    return {
      error:
        "Bitte Alter bei Eintritt der Erwerbsminderung (oder Geburtsjahr) angeben – " +
        `es muss zwischen ${MIN_ALTER} und unter dem Regelalters-Ziel (${targetAge}) liegen. ` +
        "Alternativ Zurechnungszeit „keine“ oder „manuell“ wählen."
    };
  }

  const restJahre = yearsUntil(age, targetAge);

  // Zurechnungszeit als EP schätzen
  const epZrz = calcZurechnungsEP(zrzModus, epProJahr, restJahre, zrzEPmanuell);

  // Gesamt-Entgeltpunkte
  const epGesamt = Math.max(0, (epBisher || 0) + epZrz);

  // Rentenartfaktor: voll = 1.0, teilweise = 0.5
  const rentenartFaktor = art === "teilweise" ? 0.5 : 1.0;

  // Zugangsfaktor / Abschlag (max. 10,8 % -> Faktor 0,892)
  const abschlag = Math.min(Math.max(0, abschlagProzent || 0), MAX_ABSCHLAG_PROZENT) / 100;
  const zugangsfaktor = Math.max(0, 1 - abschlag);

  // Brutto-Rente (monatlich)
  // Formel (vereinfacht): EP * Rentenwert * Rentenartfaktor * Zugangsfaktor
  const brutto = epGesamt * (rentenwert || 0) * rentenartFaktor * zugangsfaktor;

  // Nettoschätzung (nur KV/PV pauschal)
  const kvpv = Math.min(Math.max(0, abzugKvPvProzent || 0), MAX_KVPV_PROZENT) / 100;
  const kvpvAbzug = brutto * kvpv;
  const netto = Math.max(0, brutto - kvpvAbzug);

  return {
    age,
    restJahre,
    epZrz,
    epGesamt,
    rentenartFaktor,
    zugangsfaktor,
    abschlagEffektiv: abschlag * 100,
    brutto,
    kvpvAbzug,
    netto
  };
}

function renderError(container, message) {
  container.innerHTML = `
    <div class="pflegegrad-result-card">
      <p class="hinweis"><strong>Hinweis:</strong> ${message}</p>
    </div>
  `;
}

function renderResult(container, input, out) {
  const {
    art,
    geburtsjahr,
    alter,
    regelalter,
    epBisher,
    epProJahr,
    zrzModus,
    rentenwert,
    abzugKvPvProzent
  } = input;

  const {
    age,
    restJahre,
    epZrz,
    epGesamt,
    zugangsfaktor,
    abschlagEffektiv,
    brutto,
    kvpvAbzug,
    netto
  } = out;

  const artText = art === "teilweise" ? "Rente wegen teilweiser Erwerbsminderung" : "Rente wegen voller Erwerbsminderung";
  const zrzText =
    zrzModus === "keine" ? "ohne Zurechnungszeit (konservativ)" :
    zrzModus === "manuell" ? "manuell eingegeben" :
    `automatisch (ca. ${restJahre.toFixed(1)} Restjahre × ${epProJahr.toFixed(2)} EP/Jahr)`;

  const rentenwertHinweis =
    Math.abs(rentenwert - RENTENWERT) > 0.001
      ? ` <small>(abweichend vom aktuellen Wert ${RENTENWERT.toFixed(2).replace(".", ",")} € seit ${RENTENWERT_STAND})</small>`
      : ` <small>(Stand ${RENTENWERT_STAND})</small>`;

  container.innerHTML = `
    <h2>Ergebnis: EM-Rente (vereinfachte Schätzung)</h2>

    <div class="pflegegrad-result-card">
      <p>
        <strong>Rentenart:</strong> ${artText}<br>
        <strong>Geburtsjahr/Alter:</strong> ${geburtsjahr ? geburtsjahr : (alter ? (new Date().getFullYear() - alter) : "–")} / ${age ? age + " Jahre" : "–"}<br>
        <strong>Regelalters-Ziel:</strong> ${regelalter} Jahre<br>
        <strong>Rentenwert:</strong> ${rentenwert.toFixed(2).replace(".", ",")} € je EP${rentenwertHinweis}<br>
        <strong>Abschlag:</strong> ${abschlagEffektiv.toFixed(1).replace(".", ",")} % (Zugangsfaktor ${zugangsfaktor.toFixed(3).replace(".", ",")})
      </p>

      <h3>Entgeltpunkte</h3>
      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Komponente</th>
            <th>Wert</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>EP bisher (laut Renteninformation)</td>
            <td>${epBisher.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Zurechnungszeit (${zrzText})</td>
            <td>${epZrz.toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>EP gesamt</strong></td>
            <td><strong>${epGesamt.toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>Rentenbetrag</h3>
      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Größe</th>
            <th>Betrag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Brutto-EM-Rente (monatlich)</strong><br><small>EP gesamt × Rentenwert × Rentenartfaktor × Zugangsfaktor</small></td>
            <td><strong>${euro(brutto)}</strong></td>
          </tr>
          <tr>
            <td>Abzug KV/PV (pauschal: ${abzugKvPvProzent.toFixed(1).replace(".", ",")} %)</td>
            <td>− ${euro(kvpvAbzug)}</td>
          </tr>
          <tr>
            <td><strong>Netto-EM-Rente (geschätzt)</strong></td>
            <td><strong>${euro(netto)}</strong></td>
          </tr>
        </tbody>
      </table>

      <p class="hinweis">
        Diese Schätzung ist stark vereinfacht: Die Zurechnungszeit endet tatsächlich an einer eigenen
        Altersgrenze und wird nach dem Durchschnitt der bisherigen Belegung bewertet (mit Günstigerprüfung).
        Nicht geprüft werden die versicherungsrechtlichen Voraussetzungen (Wartezeit 5 Jahre,
        3 Jahre Pflichtbeiträge in den letzten 5 Jahren) sowie Steuer, Hinzuverdienst und individuelle
        Besonderheiten. Für eine verbindliche Auskunft bitte an die
        <strong>Deutsche Rentenversicherung</strong> wenden (Renten-/Versicherungsverlauf prüfen).
      </p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const artSel = document.getElementById("em_art");
  const geburtsjahrInput = document.getElementById("em_geburtsjahr");
  const alterInput = document.getElementById("em_alter");
  const regelalterInput = document.getElementById("em_regelalter");

  const epBisherInput = document.getElementById("em_ep_bisher");
  const epProJahrInput = document.getElementById("em_ep_pro_jahr");
  const zrzModusSel = document.getElementById("em_zrz_modus");
  const zrzManuellWrap = document.getElementById("em_zrz_manuell_wrap");
  const zrzEPmanuellInput = document.getElementById("em_ep_zrz_manuell");

  const rentenwertInput = document.getElementById("em_rentenwert");
  const abschlagInput = document.getElementById("em_abschlag");

  const kvpvInput = document.getElementById("em_abzug_kv_pv");

  const btn = document.getElementById("em_berechnen");
  const btnReset = document.getElementById("em_reset");
  const out = document.getElementById("em_ergebnis");

  function updateZrzUI() {
    const modus = zrzModusSel ? zrzModusSel.value : "auto";
    if (zrzManuellWrap) {
      zrzManuellWrap.style.display = modus === "manuell" ? "block" : "none";
    }
    if (out) out.innerHTML = "";
  }

  if (zrzModusSel) {
    zrzModusSel.addEventListener("change", updateZrzUI);
  }
  updateZrzUI();

  if (btn && out) {
    btn.addEventListener("click", () => {
      const input = {
        art: artSel ? artSel.value : "voll",
        geburtsjahr: num(geburtsjahrInput),
        alter: num(alterInput),
        regelalter: num(regelalterInput) || DEFAULT_REGELALTER,
        epBisher: num(epBisherInput),
        epProJahr: num(epProJahrInput),
        zrzModus: zrzModusSel ? zrzModusSel.value : "auto",
        zrzEPmanuell: num(zrzEPmanuellInput),
        rentenwert: num(rentenwertInput) || RENTENWERT,
        abschlagProzent: num(abschlagInput),
        abzugKvPvProzent: num(kvpvInput)
      };

      const outVals = calcEmRente(input);
      if (outVals.error) {
        renderError(out, outVals.error);
      } else {
        renderResult(out, input, outVals);
      }
      out.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (btnReset && out) {
    btnReset.addEventListener("click", () => {
      setTimeout(() => {
        out.innerHTML = "";
        updateZrzUI();
      }, 0);
    });
  }
});