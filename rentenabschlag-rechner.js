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

// Hilfsfunktion: Monate aus (Jahre, Monate)
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

  const diff = regM - wnsM; // >0 = vorgezogen; <0 = später
  let abschlagPct = 0;
  let zuschlagPct = 0;

  if (diff > 0) {
    // vorgezogen
    abschlagPct = Math.min(diff * (abschlagProMonat / 100), maxAbschlag / 100);
  } else if (diff < 0) {
    // später
    zuschlagPct = Math.abs(diff) * (zuschlagProMonat / 100);
  }

  // Monatsrente bei gewünschtem Beginn
  let renteGewuenscht = regelRente;
  if (abschlagPct > 0) {
    renteGewuenscht = regelRente * (1 - abschlagPct);
  } else if (zuschlagPct > 0) {
    renteGewuenscht = regelRente * (1 + zuschlagPct);
  }

  // Vergleich: später gehen (X Monate nach dem gewünschten Start)
  const verglDiffZuReg = regM - (wnsM + Math.max(0, Math.floor(spaeterMonate || 0)));
  let verglAbschlag = 0, verglZuschlag = 0;
  if (verglDiffZuReg > 0) {
    verglAbschlag = Math.min(verglDiffZuReg * (abschlagProMonat / 100), maxAbschlag / 100);
  } else if (verglDiffZuReg < 0) {
    verglZuschlag = Math.abs(verglDiffZuReg) * (zuschlagProMonat / 100);
  }
  let renteSpaeter = regelRente * (1 - verglAbschlag + verglZuschlag);

  return {
    diffMonate: diff,
    abschlagPct,
    zuschlagPct,
    renteRegel: regelRente,
    renteGewuenscht,
    verglMonateSpaeter: Math.max(0, Math.floor(spaeterMonate || 0)),
    verglAbschlag,
    verglZuschlag,
    renteSpaeter
  };
}

function renderErgebnis(container, input, out) {
  const {
    regelJahre, regelMonate, wunschJahre, wunschMonate,
    abschlagProMonat, zuschlagProMonat, maxAbschlag
  } = input;

  const {
    diffMonate, abschlagPct, zuschlagPct,
    renteRegel, renteGewuenscht,
    verglMonateSpaeter, verglAbschlag, verglZuschlag, renteSpaeter
  } = out;

  // Text für diff
  let diffText = "";
  if (diffMonate > 0) diffText = `Vorgezogen: ${diffMonate} Monat(e) vor der Regelaltersgrenze`;
  else if (diffMonate < 0) diffText = `Später: ${Math.abs(diffMonate)} Monat(e) nach der Regelaltersgrenze`;
  else diffText = "Genau zum regulären Rentenbeginn";

  const pctToStr = (p) => (p * 100).toFixed(1).replace(".", ",") + " %";

  container.innerHTML = `
    <h2>Ergebnis: Rentenabschlag/Zuschlag</h2>

    <div class="pflegegrad-result-card">
      <p>
        <strong>Regelaltersgrenze:</strong> ${regelJahre} Jahre ${regelMonate} Monate<br>
        <strong>Gewünschter Beginn:</strong> ${wunschJahre} Jahre ${wunschMonate} Monate<br>
        <strong>Abweichung:</strong> ${diffText}
      </p>

      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Größe</th>
            <th>Wert</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Abschlag pro Monat (vorziehen)</td>
            <td>${abschlagProMonat.toFixed(2).replace(".", ",")} %</td>
          </tr>
          <tr>
            <td>Zuschlag pro Monat (später)</td>
            <td>${zuschlagProMonat.toFixed(2).replace(".", ",")} %</td>
          </tr>
          <tr>
            <td>Maximaler Abschlag</td>
            <td>${maxAbschlag.toFixed(1).replace(".", ",")} %</td>
          </tr>
          <tr>
            <td><strong>Abschlag/Zuschlag gesamt</strong></td>
            <td><strong>${
              abschlagPct > 0 ? "− " + pctToStr(abschlagPct) :
              zuschlagPct > 0 ? "+ " + pctToStr(zuschlagPct) : "0,0 %"
            }</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>Monatsrente (vereinfachte Betrachtung)</h3>
      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Variante</th>
            <th>Monatsrente</th>
            <th>Diff. zu Regelalter</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Zum Regelalter</td>
            <td>${euro(renteRegel)}</td>
            <td>–</td>
          </tr>
          <tr>
            <td>Gewünschter Beginn</td>
            <td>${euro(renteGewuenscht)}</td>
            <td>${euro(renteGewuenscht - renteRegel)}</td>
          </tr>
        </tbody>
      </table>

      <h3>Vergleich: später gehen (+${verglMonateSpaeter} Monat(e))</h3>
      <table class="pflegegrad-tabelle">
        <thead>
          <tr>
            <th>Variante</th>
            <th>Monatsrente</th>
            <th>Diff. zu Regelalter</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${
              verglAbschlag > 0
                ? `Verschoben (noch vor Regelalter, Abschlag ${pctToStr(verglAbschlag)})`
                : verglZuschlag > 0
                ? `Verschoben (nach Regelalter, Zuschlag ${pctToStr(verglZuschlag)})`
                : "Verschoben (genau Regelalter)"
            }</td>
            <td><strong>${euro(renteSpaeter)}</strong></td>
            <td><strong>${euro(renteSpaeter - renteRegel)}</strong></td>
          </tr>
        </tbody>
      </table>

      <p class="hinweis">
        Diese Rechnung ist eine vereinfachte Orientierung: Es werden nur feste Zu-/Abschlagssätze
        auf deine angegebene Monatsrente zum Regelalter angewandt.
        Beiträge, Steuern, Entgeltpunkte in der Verschiebephase etc. bleiben unberücksichtigt.
      </p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const gj = document.getElementById("ra_geburtsjahr"); // optional, nur Info
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
    const input = {
      regelJahre: n(rj) || 67,
      regelMonate: n(rm),
      wunschJahre: n(wj),
      wunschMonate: n(wm),
      regelRente: n(rr),

      abschlagProMonat: n(a_pm) || 0.3,    // % pro Monat
      zuschlagProMonat: n(z_pm) || 0.5,    // % pro Monat
      maxAbschlag: n(a_max) || 14.4,       // % gesamt
      spaeterMonate: n(sp) || 0
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
