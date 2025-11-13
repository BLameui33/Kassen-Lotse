// rentenabschlag-rechner.js

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

// Monate aus (Jahre, Monate)
function toMonths(years, months) {
  const y = Math.max(0, Math.floor(years || 0));
  const m = clamp(Math.floor(months || 0), 0, 11);
  return y * 12 + m;
}

function berechneAbschlag({
  regelJahre, regelMonate,
  wunschJahre, wunschMonate,
  regelRente,
  abschlagProMonat, zuschlagProMonat, maxAbschlag,
  spaeterMonate
}) {
  const regM = toMonths(regelJahre, regelMonate);
  const wnsM = toMonths(wunschJahre, wunschMonate);

  const aPM = Math.max(0, abschlagProMonat) / 100;
  const zPM = Math.max(0, zuschlagProMonat) / 100;
  const aMax = Math.max(0, maxAbschlag) / 100;

  const diff = regM - wnsM; // >0 vorgezogen; <0 später
  let abschlagPct = 0;
  let zuschlagPct = 0;

  if (diff > 0) {
    abschlagPct = Math.min(diff * aPM, aMax);
  } else if (diff < 0) {
    zuschlagPct = Math.abs(diff) * zPM;
  }

  const renteGewuenscht =
    abschlagPct > 0 ? regelRente * (1 - abschlagPct) :
    zuschlagPct > 0 ? regelRente * (1 + zuschlagPct) :
    regelRente;

  // Vergleich: X Monate später als gewünschter Beginn
  const sh = Math.max(0, Math.floor(spaeterMonate || 0));
  const verglDiffZuReg = regM - (wnsM + sh);

  let verglAbschlag = 0, verglZuschlag = 0;
  if (verglDiffZuReg > 0) {
    verglAbschlag = Math.min(verglDiffZuReg * aPM, aMax);
  } else if (verglDiffZuReg < 0) {
    verglZuschlag = Math.abs(verglDiffZuReg) * zPM;
  }
  const renteSpaeter = regelRente * (1 - verglAbschlag + verglZuschlag);

  return {
    diffMonate: diff,
    abschlagPct,           // dezimal
    zuschlagPct,           // dezimal
    renteRegel: regelRente,
    renteGewuenscht,
    verglMonateSpaeter: sh,
    verglAbschlag,         // dezimal
    verglZuschlag,         // dezimal
    renteSpaeter
  };
}

function renderError(container, msgs) {
  const list = msgs.map(m => `<li>${m}</li>`).join("");
  container.innerHTML = `
    <div class="pflegegrad-result-card">
      <h2>Bitte Eingaben prüfen</h2>
      <ul>${list}</ul>
    </div>
  `;
}

function renderErgebnis(container, input, out) {
  const {
    regelJahre, regelMonate, wunschJahre, wunschMonate,
    abschlagProMonat, zuschlagProMonat, maxAbschlag, geburtsjahr
  } = input;

  const {
    diffMonate, abschlagPct, zuschlagPct,
    renteRegel, renteGewuenscht,
    verglMonateSpaeter, verglAbschlag, verglZuschlag, renteSpaeter
  } = out;

  const pctStr = (p) => (p * 100).toFixed(1).replace(".", ",") + " %";
  const diffText = diffMonate > 0
    ? `Vorgezogen: ${diffMonate} Monat(e) vor Regelalter`
    : diffMonate < 0
      ? `Später: ${Math.abs(diffMonate)} Monat(e) nach Regelalter`
      : "Genau zum Regelalter";

  container.innerHTML = `
    <h2>Ergebnis: Rentenabschlag/Zuschlag</h2>

    <div class="pflegegrad-result-card">
      <p>
        ${geburtsjahr ? `<strong>Geburtsjahr:</strong> ${geburtsjahr}<br>` : ""}
        <strong>Regelaltersgrenze:</strong> ${regelJahre} Jahre ${regelMonate} Monate<br>
        <strong>Gewünschter Beginn:</strong> ${wunschJahre} Jahre ${wunschMonate} Monate<br>
        <strong>Abweichung:</strong> ${diffText}
      </p>

      <h3>Zu-/Abschläge</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Größe</th><th>Wert</th></tr></thead>
        <tbody>
          <tr><td>Abschlag je Monat (vorziehen)</td><td>${Number(abschlagProMonat).toFixed(2).replace(".", ",")} %</td></tr>
          <tr><td>Zuschlag je Monat (später)</td><td>${Number(zuschlagProMonat).toFixed(2).replace(".", ",")} %</td></tr>
          <tr><td>Maximaler Abschlag</td><td>${Number(maxAbschlag).toFixed(1).replace(".", ",")} %</td></tr>
          <tr><td><strong>Abschlag/Zuschlag gesamt</strong></td>
              <td><strong>${
                abschlagPct > 0 ? "− " + pctStr(abschlagPct) :
                zuschlagPct > 0 ? "+ " + pctStr(zuschlagPct) : "0,0 %"
              }</strong></td></tr>
        </tbody>
      </table>

      <h3>Monatsrente (vereinfacht)</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Variante</th><th>Monatsrente</th><th>Diff. zu Regelalter</th></tr></thead>
        <tbody>
          <tr><td>Zum Regelalter</td><td>${euro(renteRegel)}</td><td>–</td></tr>
          <tr><td>Gewünschter Beginn</td><td><strong>${euro(renteGewuenscht)}</strong></td><td>${euro(renteGewuenscht - renteRegel)}</td></tr>
        </tbody>
      </table>

      <h3>Vergleich: später gehen (+${verglMonateSpaeter} Monat(e))</h3>
      <table class="pflegegrad-tabelle">
        <thead><tr><th>Variante</th><th>Monatsrente</th><th>Diff. zu Regelalter</th></tr></thead>
        <tbody>
          <tr>
            <td>${
              verglAbschlag > 0
                ? `Verschoben (noch vor Regelalter, Abschlag ${pctStr(verglAbschlag)})`
                : verglZuschlag > 0
                  ? `Verschoben (nach Regelalter, Zuschlag ${pctStr(verglZuschlag)})`
                  : "Verschoben (genau Regelalter)"
            }</td>
            <td><strong>${euro(renteSpaeter)}</strong></td>
            <td><strong>${euro(renteSpaeter - renteRegel)}</strong></td>
          </tr>
        </tbody>
      </table>

      <p class="hinweis">
        Reine Orientierung: Es werden feste Zu-/Abschlagsätze auf die angegebene Regelalters-Rente angewandt.
        Steuern, KV/PV und mögliche zusätzliche Entgeltpunkte bei späterem Beginn sind nicht berücksichtigt.
      </p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const gj = document.getElementById("ra_geburtsjahr"); // optional
  const rj = document.getElementById("ra_reg_jahre");
  const rm = document.getElementById("ra_reg_monate");
  const wj = document.getElementById("ra_wunsch_jahre");
  const wm = document.getElementById("ra_wunsch_monate");
  const rr = document.getElementById("ra_regelrente");

  const a_pm = document.getElementById("ra_abschlag_pm");
  const z_pm = document.getElementById("ra_zuschlag_pm");
  const a_max = document.getElementById("ra_abschlag_max");
  const sp = document.getElementById("ra_spaeter_monate");

  const btn = document.getElementById("ra_berechnen");
  const reset = document.getElementById("ra_reset");
  const out = document.getElementById("ra_ergebnis");

  if (!btn || !out) return;

  btn.addEventListener("click", () => {
    // sanfte Validierung
    const regelRente = n(rr);
    const errors = [];
    if (!(regelRente > 0)) errors.push("Bitte die erwartete Monatsrente zum Regelalter angeben (größer 0 €).");

    const regJ = n(rj) || 67;
    const regM = n(rm);
    const wJ = n(wj);
    const wM = n(wm);

    if (toMonths(wJ, wM) === 0) errors.push("Bitte den gewünschten Rentenbeginn (Alter in Jahren/Monaten) angeben.");

    const abschlagPM = n(a_pm) || 0.3;
    const zuschlagPM = n(z_pm) || 0.5;
    const maxA = n(a_max) || 14.4;

    if (abschlagPM < 0 || abschlagPM > 1) errors.push("Abschlag pro Monat muss zwischen 0 % und 1 % liegen.");
    if (zuschlagPM < 0 || zuschlagPM > 2) errors.push("Zuschlag pro Monat muss zwischen 0 % und 2 % liegen.");
    if (maxA < 0 || maxA > 20) errors.push("Maximaler Abschlag muss zwischen 0 % und 20 % liegen.");

    if (errors.length) { renderError(out, errors); out.scrollIntoView({ behavior: "smooth" }); return; }

    const input = {
      geburtsjahr: n(gj),
      regelJahre: regJ,
      regelMonate: regM,
      wunschJahre: wJ,
      wunschMonate: wM,
      regelRente: regelRente,
      abschlagProMonat: abschlagPM,
      zuschlagProMonat: zuschlagPM,
      maxAbschlag: maxA,
      spaeterMonate: clamp(n(sp) || 0, 0, 600)
    };

    const outVals = berechneAbschlag(input);
    renderErgebnis(out, input, outVals);
    out.scrollIntoView({ behavior: "smooth" });
  });

  if (reset) {
    reset.addEventListener("click", () => {
      setTimeout(() => { out.innerHTML = ""; }, 0);
    });
  }
});
