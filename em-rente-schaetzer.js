// em-rente-schaetzer.js

function num(el) {
  if (!el) return 0;
  const raw = (el.value || "").toString().replace(",", ".");
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function euro(v) {
  const n = Number.isFinite(v) ? v : 0;
  return n.toFixed(2).replace(".", ",") + " €";
}

function yearsUntil(ageNow, targetAge) {
  const y = Math.max(0, (targetAge || 67) - Math.max(0, ageNow || 0));
  return y;
}

function estimateAgeFromBirthYear(birthYear) {
  const today = new Date();
  const year = today.getFullYear();
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

  const targetAge = Math.max(60, regelalter || 67);
  const restJahre = yearsUntil(age, targetAge);

  // Zurechnungszeit als EP schätzen
  const epZrz = calcZurechnungsEP(zrzModus, epProJahr, restJahre, zrzEPmanuell);

  // Gesamt-Entgeltpunkte
  const epGesamt = Math.max(0, (epBisher || 0) + epZrz);

  // Rentenartfaktor: voll = 1.0, teilweise = 0.5
  const rentenartFaktor = art === "teilweise" ? 0.5 : 1.0;

  // Zugangsfaktor / Abschlag (z. B. 10,8 % -> Faktor 0,892)
  const abschlag = Math.min(Math.max(0, abschlagProzent || 0), 15) / 100;
  const zugangsfaktor = Math.max(0, 1 - abschlag);

  // Brutto-Rente (monatlich)
  // Formel (vereinfacht): EP * Rentenwert * Rentenartfaktor * Zugangsfaktor
  const brutto = epGesamt * (rentenwert || 0) * rentenartFaktor * zugangsfaktor;

  // Nettoschätzung (nur KV/PV pauschal)
  const kvpv = Math.min(Math.max(0, abzugKvPvProzent || 0), 20) / 100;
  const kvpvAbzug = brutto * kvpv;
  const netto = Math.max(0, brutto - kvpvAbzug);

  return {
    age,
    restJahre,
    epZrz,
    epGesamt,
    rentenartFaktor,
    zugangsfaktor,
    brutto,
    kvpvAbzug,
    netto
  };
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
    zrzEPmanuell,
    rentenwert,
    abschlagProzent,
    abzugKvPvProzent
  } = input;

  const {
    age,
    restJahre,
    epZrz,
    epGesamt,
    rentenartFaktor,
    zugangsfaktor,
    brutto,
    kvpvAbzug,
    netto
  } = out;

  const artText = art === "teilweise" ? "Rente wegen teilweiser Erwerbsminderung" : "Rente wegen voller Erwerbsminderung";
  const zrzText =
    zrzModus === "keine" ? "ohne Zurechnungszeit (konservativ)" :
    zrzModus === "manuell" ? `manuell: ${epZrz.toFixed(2)} EP` :
    `automatisch: ${epZrz.toFixed(2)} EP (aus ca. ${restJahre.toFixed(1)} Restjahren × ${epProJahr.toFixed(2)} EP/Jahr)`;

  container.innerHTML = `
    <h2>Ergebnis: EM-Rente (vereinfachte Schätzung)</h2>

    <div class="pflegegrad-result-card">
      <p>
        <strong>Rentenart:</strong> ${artText}<br>
        <strong>Geburtsjahr/Alter:</strong> ${geburtsjahr ? geburtsjahr : (alter ? (new Date().getFullYear() - alter) : "–")} / ${age ? age + " Jahre" : "–"}<br>
        <strong>Regelalters-Ziel:</strong> ${regelalter} Jahre<br>
        <strong>Rentenwert:</strong> ${rentenwert.toFixed(2).replace(".", ",")} € je EP<br>
        <strong>Abschlag:</strong> ${abschlagProzent.toFixed(1)} % (Zugangsfaktor ${zugangsfaktor.toFixed(3)})
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
            <td>Zurechnungszeit (Modus: ${zrzText})</td>
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
            <td>Abzug KV/PV (pauschal: ${abzugKvPvProzent.toFixed(1)} %)</td>
            <td>− ${euro(kvpvAbzug)}</td>
          </tr>
          <tr>
            <td><strong>Netto-EM-Rente (geschätzt)</strong></td>
            <td><strong>${euro(netto)}</strong></td>
          </tr>
        </tbody>
      </table>

      <p class="hinweis">
        Diese Schätzung berücksichtigt keine Steuer, keine Zusatz-/Sonderzuschläge der Krankenkasse
        und keine individuellen Besonderheiten. Für eine verbindliche Auskunft bitte an die
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
    if (modus === "manuell") {
      zrzManuellWrap.style.display = "block";
    } else {
      zrzManuellWrap.style.display = "none";
    }
    out.innerHTML = "";
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
        regelalter: num(regelalterInput) || 67,
        epBisher: num(epBisherInput),
        epProJahr: num(epProJahrInput),
        zrzModus: zrzModusSel ? zrzModusSel.value : "auto",
        zrzEPmanuell: num(zrzEPmanuellInput),
        rentenwert: num(rentenwertInput) || 39.32,
        abschlagProzent: num(abschlagInput),
        abzugKvPvProzent: num(kvpvInput)
      };

      const outVals = calcEmRente(input);
      renderResult(out, input, outVals);
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
