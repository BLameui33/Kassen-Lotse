// mini-renten-check.js

// --- Helpers ---
function n(el) {
  if (!el) return 0;
  const raw = (el.value || "").toString().replace(",", ".");
  const v = Number(raw);
  return Number.isFinite(v) ? v : 0;
}
function euro(v) {
  const x = Number.isFinite(v) ? v : 0;
  return x.toFixed(2).replace(".", ",") + " €";
}
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
function monthsFromAge(toYears, toMonths, nowYears) {
  const targetM = (Math.max(0, Math.floor(toYears || 0)) * 12) + clamp(Math.floor(toMonths || 0), 0, 11);
  const nowM = Math.max(0, Math.floor(nowYears || 0)) * 12;
  return Math.max(0, targetM - nowM);
}
function ageToMonths(years, months) {
  return Math.max(0, Math.floor(years || 0)) * 12 + clamp(Math.floor(months || 0), 0, 11);
}

// --- Gesetzliche Rente: Zu-/Abschlag ---
function gesetzlicheRenteMitAbschlag(regelMonat, regJ, regM, wJ, wM, abschlagPM, zuschlagPM, maxAbschlag) {
  const reg = ageToMonths(regJ, regM);
  const wns = ageToMonths(wJ, wM);
  const diff = reg - wns; // >0 vorgezogen, <0 später

  const aPM = Math.max(0, abschlagPM) / 100;
  const zPM = Math.max(0, zuschlagPM) / 100;
  const aMax = Math.max(0, maxAbschlag) / 100;

  let faktor = 1.0;
  let abschlagGes = 0;
  let zuschlagGes = 0;

  if (diff > 0) {
    abschlagGes = Math.min(diff * aPM, aMax);
    faktor = 1 - abschlagGes;
  } else if (diff < 0) {
    zuschlagGes = Math.abs(diff) * zPM;
    faktor = 1 + zuschlagGes;
  }

  return {
    diffMonate: diff,
    faktor,
    abschlagGes, // dezimal
    zuschlagGes, // dezimal
    renteMonat: Math.max(0, regelMonat * faktor)
  };
}

// --- Private Sparrate ---
function realRate(nominalPct, inflPct) {
  const i = Math.max(0, nominalPct) / 100;
  const inf = Math.max(0, inflPct) / 100;
  return (1 + i) / (1 + inf) - 1; // jährlicher realer Satz
}
function futureValueMonthly(pmt, annualRealRate, months) {
  const r = annualRealRate / 12;
  const n = Math.max(0, Math.floor(months || 0));
  if (n === 0 || pmt <= 0) return 0;
  if (Math.abs(r) < 1e-9) return pmt * n; // ~0 % Realzins
  return pmt * ((Math.pow(1 + r, n) - 1) / r);
}
function monthlyFromWithdrawal(pot, withdrawalPctYear) {
  const y = Math.max(0, withdrawalPctYear) / 100;
  if (y <= 0) return 0;
  return (pot * y) / 12;
}

// --- UI: Ergebnis/Fehler ---
function renderError(container, messages) {
  const list = messages.map(m => `<li>${m}</li>`).join("");
  container.innerHTML = `
    <div class="pflegegrad-result-card">
      <h2>Bitte Eingaben prüfen</h2>
      <ul>${list}</ul>
    </div>
  `;
}

function buildResultHTML(input, out) {
  const diffText = out.diffMonate > 0
    ? `Vorgezogen: ${out.diffMonate} Monat(e) vor Regelalter`
    : out.diffMonate < 0
      ? `Später: ${Math.abs(out.diffMonate)} Monat(e) nach Regelalter`
      : `Genau zum Regelalter`;

  return `
    <h2>Ergebnis: Mini-Renten-Check</h2>

    <div class="pflegegrad-result-card">
      <h3>Gesetzliche Rente</h3>
      <p>
        <strong>Abweichung vom Regelalter:</strong> ${diffText}<br>
        <strong>Zu-/Abschlag gesamt:</strong> ${
          out.abschlagGes > 0
            ? "− " + (out.abschlagGes * 100).toFixed(1).replace(".", ",") + " %"
            : out.zuschlagGes > 0
              ? "+ " + (out.zuschlagGes * 100).toFixed(1).replace(".", ",") + " %"
              : "0,0 %"
        }
      </p>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Variante</th><th>Monatsbetrag</th></tr></thead>
        <tbody>
          <tr><td>Zum Regelalter (Angabe)</td><td>${euro(input.regelrente)}</td></tr>
          <tr><td>Zum gewünschten Beginn</td><td><strong>${euro(out.renteGesetzlich)}</strong></td></tr>
        </tbody>
      </table>

      <h3>Private Vorsorge</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Größe</th><th>Wert</th></tr></thead>
        <tbody>
          <tr><td>Sparzeit bis Rentenbeginn</td><td>${out.sparkMonths} Monate</td></tr>
          <tr><td>Realer Jahreszins (Nominal ${input.rNom.toFixed(1).replace(".", ",")} % − Inflation ${input.infl.toFixed(1).replace(".", ",")} %)</td><td>${(out.rReal * 100).toFixed(2).replace(".", ",")} % p. a.</td></tr>
          <tr><td>Endvermögen (real)</td><td><strong>${euro(out.pot)}</strong></td></tr>
          <tr><td>Entnahmequote</td><td>${input.withdraw.toFixed(1).replace(".", ",")} % p. a.</td></tr>
          <tr><td>Monatliche Zusatzrente (aus Entnahme)</td><td><strong>${euro(out.privateMonthly)}</strong></td></tr>
        </tbody>
      </table>

      <h3>Gesamtrente & Vergleich</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Position</th><th>Betrag</th></tr></thead>
        <tbody>
          <tr><td>Gesetzliche Rente (gewünschter Beginn)</td><td>${euro(out.renteGesetzlich)}</td></tr>
          <tr><td>Private Zusatzrente (geschätzt)</td><td>${euro(out.privateMonthly)}</td></tr>
          <tr><td><strong>Gesamtrente (monatlich)</strong></td><td><strong>${euro(out.totalMonthly)}</strong></td></tr>
          <tr><td>Heutiges Netto (zum Vergleich)</td><td>${input.nettoHeute > 0 ? euro(input.nettoHeute) : "—"}</td></tr>
          <tr><td><strong>Diff. zu heutigem Netto</strong></td><td><strong>${
            input.nettoHeute > 0 ? euro(out.totalMonthly - input.nettoHeute) : "—"
          }</strong></td></tr>
        </tbody>
      </table>

      <p class="hinweis">
        Vereinfachung: Keine Steuern, keine Kranken-/Pflegeversicherungsbeiträge, keine Produkt-/Kostenannahmen.
        Zinssätze und Inflation sind Annahmen, die sich ändern können. Entnahmequote = Daumenregel.
      </p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  // Inputs
  const regelrente = document.getElementById("mrc_regelrente_monat");
  const regJ = document.getElementById("mrc_reg_jahre");
  const regM = document.getElementById("mrc_reg_monate");
  const wJ = document.getElementById("mrc_wunsch_jahre");
  const wM = document.getElementById("mrc_wunsch_monate");

  const alterHeute = document.getElementById("mrc_alter_heute");
  const sparrate = document.getElementById("mrc_sparrate");
  const renditeNom = document.getElementById("mrc_rendite_nominal");
  const inflation = document.getElementById("mrc_inflation");
  const entnahme = document.getElementById("mrc_entnahmequote");

  const nettoHeute = document.getElementById("mrc_netto_heute");

  const aPM = document.getElementById("mrc_abschlag_pm");
  const zPM = document.getElementById("mrc_zuschlag_pm");
  const aMax = document.getElementById("mrc_abschlag_max");

  const btn = document.getElementById("mrc_berechnen");
  const reset = document.getElementById("mrc_reset");
  const outEl = document.getElementById("mrc_ergebnis");

  if (!btn || !outEl) return;

  btn.addEventListener("click", () => {
    const errors = [];

    // Eingaben
    const input = {
      regelrente: n(regelrente),
      regJ: n(regJ) || 67,
      regM: n(regM),
      wJ: n(wJ),
      wM: n(wM),

      alter: n(alterHeute),
      pmt: n(sparrate),
      rNom: n(renditeNom),
      infl: n(inflation),
      withdraw: n(entnahme) || 3.5,

      nettoHeute: n(nettoHeute),

      abschlagPM: n(aPM) || 0.3,
      zuschlagPM: n(zPM) || 0.5,
      maxAbschlag: n(aMax) || 14.4
    };

    // Grundchecks
    if (input.regelrente <= 0) errors.push("Bitte die monatliche Regelalters-Rente (Brutto) eintragen.");
    if (input.wJ <= 0 && input.wM <= 0) errors.push("Bitte den gewünschten Rentenbeginn (Alter in Jahren/Monaten) angeben.");
    if (input.regJ < 60 || input.regJ > 68) errors.push("Regelalter: Bitte einen Wert zwischen 60 und 68 Jahren wählen.");
    if (input.wJ < 60 || input.wJ > 70) errors.push("Wunschalter: Bitte einen Wert zwischen 60 und 70 Jahren wählen.");
    if (input.alter > 0 && input.wJ > 0 && monthsFromAge(input.wJ, input.wM, input.alter) === 0 && input.pmt > 0) {
      // ok, aber Hinweis: keine Sparzeit
    }
    if (input.withdraw <= 0) errors.push("Entnahmequote muss größer als 0 % sein.");

    if (errors.length) {
      renderError(outEl, errors);
      outEl.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // Gesetzliche Rente – Zu-/Abschlag
    const gesetz = gesetzlicheRenteMitAbschlag(
      input.regelrente, input.regJ, input.regM, input.wJ, input.wM,
      input.abschlagPM, input.zuschlagPM, input.maxAbschlag
    );

    // Monate bis gewünschter Rentenstart (für Sparphase)
    const monthsToRetire = monthsFromAge(input.wJ, input.wM, input.alter);

    // Private Sparrate – realer Zins und FV
    const rReal = realRate(input.rNom, input.infl); // p. a.
    const pot = futureValueMonthly(input.pmt, rReal, monthsToRetire);
    const privateMonthly = monthlyFromWithdrawal(pot, input.withdraw);

    const result = {
      diffMonate: gesetz.diffMonate,
      abschlagGes: gesetz.abschlagGes,
      zuschlagGes: gesetz.zuschlagGes,
      renteGesetzlich: gesetz.renteMonat,

      sparkMonths: monthsToRetire,
      rReal,
      pot,
      privateMonthly,

      totalMonthly: gesetz.renteMonat + privateMonthly
    };

    outEl.innerHTML = buildResultHTML(input, result);
    outEl.scrollIntoView({ behavior: "smooth" });
  });

  if (reset) {
    reset.addEventListener("click", () => {
      setTimeout(() => { outEl.innerHTML = ""; }, 0);
    });
  }
});
