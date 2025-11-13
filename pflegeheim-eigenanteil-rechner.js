// pflegeheim-eigenanteil-rechner.js

function toNumber(el) {
  if (!el) return 0;
  const raw = (el.value || "").toString().replace(",", ".");
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function formatEuro(v) {
  const n = Number.isFinite(v) ? v : 0;
  return n.toFixed(2).replace(".", ",") + " €";
}

// Vereinfachte Staffel: Zuschlag % je nach Aufenthaltsmonaten
function autoZuschlagProzent(monate) {
  const m = Math.max(0, Math.floor(monate || 0));
  if (m >= 36) return 75; // ab 36. Monat
  if (m >= 24) return 50; // 24–35
  if (m >= 12) return 30; // 12–23
  return 15;              // 0–11
}

function berechneEigenanteilEinenMonat({
  eee, uv, invest, zusatz, ausbildung, sonstZuschuesse, zuschlagProzent
}) {
  const z = clamp(zuschlagProzent, 0, 100);
  const zuschlagBetrag = Math.max(0, eee) * (z / 100);
  const eeeNachZuschlag = Math.max(0, eee - zuschlagBetrag);

  const bruttoKosten = eeeNachZuschlag + Math.max(0, uv) + Math.max(0, invest) + Math.max(0, zusatz) + Math.max(0, ausbildung);
  // "sonstZuschuesse": als Abzug gedacht – negative Werte also nicht doppelt subtrahieren
  const abzug = Math.max(0, sonstZuschuesse);
  const eigenanteil = Math.max(0, bruttoKosten - abzug);

  return { zuschlagBetrag, eeeNachZuschlag, bruttoKosten, eigenanteil };
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

function baueErgebnisHTML(input, result, deckung) {
  const {
    pflegegrad, monate, zuschlagProzent, eee, uv, invest, zusatz, ausbildung, sonstZuschuesse, eigeneMittel
  } = input;

  const { zuschlagBetrag, eeeNachZuschlag, bruttoKosten, eigenanteil } = result;
  const { deckungDurchMittel, restLuecke, modus } = deckung;

  const modusText = modus === "auto"
    ? `Automatisch (geschätzt nach ${monate} Monaten Heimaufenthalt)`
    : "Manuell festgelegter Prozentsatz";

  return `
    <h2>Ergebnis: voraussichtlicher monatlicher Eigenanteil</h2>

    <div class="pflegegrad-result-card">
      <p>
        <strong>Pflegegrad:</strong> ${pflegegrad}<br>
        <strong>Zuschlagsmodus:</strong> ${modusText}<br>
        <strong>Angesetzter Leistungszuschlag:</strong> ${zuschlagProzent.toFixed(0)} %
      </p>

      <table class="pflegegrad-tabelle">
        <thead>
          <tr><th>Baustein</th><th>Betrag / Monat</th></tr>
        </thead>
        <tbody>
          <tr><td>EEE (einrichtungseinheitlicher Eigenanteil)</td><td>${formatEuro(eee)}</td></tr>
          <tr><td>– Leistungszuschlag der Pflegekasse (${zuschlagProzent.toFixed(0)} % von EEE)</td><td>– ${formatEuro(zuschlagBetrag)}</td></tr>
          <tr><td><strong>EEE nach Zuschlag</strong></td><td><strong>${formatEuro(eeeNachZuschlag)}</strong></td></tr>
          <tr><td>Unterkunft &amp; Verpflegung (U+V)</td><td>${formatEuro(uv)}</td></tr>
          <tr><td>Investitionskosten</td><td>${formatEuro(invest)}</td></tr>
          <tr><td>Zusatzleistungen (pauschal)</td><td>${formatEuro(zusatz)}</td></tr>
          <tr><td>Ausbildungsumlage</td><td>${formatEuro(ausbildung)}</td></tr>
          <tr><td>– Sonstige Zuschüsse/Entlastungen</td><td>– ${formatEuro(sonstZuschuesse)}</td></tr>
          <tr><td><strong>Heimkosten gesamt (monatlich)</strong></td><td><strong>${formatEuro(bruttoKosten)}</strong></td></tr>
          <tr><td><strong>Voraussichtlicher Eigenanteil (zu zahlen)</strong></td><td><strong>${formatEuro(eigenanteil)}</strong></td></tr>
        </tbody>
      </table>

      <h3>Deckungsprüfung (optional)</h3>
      <p>
        <strong>Eigene monatliche Mittel:</strong> ${formatEuro(eigeneMittel)}<br>
        <strong>davon deckbar:</strong> ${formatEuro(deckungDurchMittel)}<br>
        <strong>voraussichtliche Deckungslücke:</strong> ${formatEuro(restLuecke)}
      </p>
    </div>

    <p class="hinweis">
      Der Leistungszuschlag reduziert nur den <em>EEE</em>. U+V, Investitionskosten und Zusatzleistungen bleiben unberührt.
      Bundeslandspezifische Zuschüsse (z.&nbsp;B. Pflegewohngeld) sind unterschiedlich geregelt und müssen individuell geprüft werden.
    </p>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const gradSel = document.getElementById("heim_pflegegrad");
  const monateInput = document.getElementById("heim_monate");

  const modusSel = document.getElementById("heim_zuschlag_modus");
  const autoWrap = document.getElementById("heim_zuschlag_auto_wrap");
  const manuellWrap = document.getElementById("heim_zuschlag_manuell_wrap");
  const prozentInput = document.getElementById("heim_zuschlag_prozent");

  const eeeInput = document.getElementById("heim_eee");
  const uvInput = document.getElementById("heim_uv");
  const investInput = document.getElementById("heim_invest");
  const zusatzInput = document.getElementById("heim_zusatz");
  const ausbildungInput = document.getElementById("heim_ausbildung");
  const sonstZuschuesseInput = document.getElementById("heim_zuschuesse");
  const eigeneMittelInput = document.getElementById("heim_eigene_mittel");

  const btnCalc = document.getElementById("heim_berechnen");
  const btnReset = document.getElementById("heim_reset");
  const out = document.getElementById("heim_ergebnis");

  function updateZuschlagUI() {
    const modus = modusSel ? modusSel.value : "auto";
    if (modus === "manuell") {
      autoWrap.style.display = "none";
      manuellWrap.style.display = "block";
    } else {
      autoWrap.style.display = "block";
      manuellWrap.style.display = "none";
    }
    out.innerHTML = "";
  }
  if (modusSel) modusSel.addEventListener("change", updateZuschlagUI);
  updateZuschlagUI();

  function validateInputs() {
    const errors = [];
    const eee = toNumber(eeeInput);
    const uv = toNumber(uvInput);
    const invest = toNumber(investInput);
    const zuschlagMode = modusSel ? modusSel.value : "auto";
    const manuellPct = toNumber(prozentInput);

    if (eee <= 0) errors.push("Bitte den EEE (einrichtungseinheitlicher Eigenanteil) angeben.");
    if (uv < 0 || invest < 0) errors.push("Unterkunft/Verpflegung und Investitionskosten dürfen nicht negativ sein.");
    if (zuschlagMode === "manuell" && (manuellPct < 0 || manuellPct > 100)) {
      errors.push("Leistungszuschlag (manuell) muss zwischen 0 % und 100 % liegen.");
    }
    return errors;
  }

  if (btnCalc && out) {
    btnCalc.addEventListener("click", () => {
      const errors = validateInputs();
      if (errors.length) {
        renderError(out, errors);
        out.scrollIntoView({ behavior: "smooth" });
        return;
      }

      const pflegegrad = (gradSel && gradSel.value) || "2";
      const monate = clamp(Math.floor(toNumber(monateInput)), 0, 600);

      const modus = (modusSel && modusSel.value) || "auto";
      let zuschlagProzent = modus === "manuell" ? toNumber(prozentInput) : autoZuschlagProzent(monate);
      zuschlagProzent = clamp(zuschlagProzent, 0, 100);

      const eee = Math.max(0, toNumber(eeeInput));
      const uv = Math.max(0, toNumber(uvInput));
      const invest = Math.max(0, toNumber(investInput));
      const zusatz = Math.max(0, toNumber(zusatzInput));
      const ausbildung = Math.max(0, toNumber(ausbildungInput));
      const sonstZuschuesse = Math.max(0, toNumber(sonstZuschuesseInput)); // als Abzug

      const eigeneMittel = Math.max(0, toNumber(eigeneMittelInput));

      const result = berechneEigenanteilEinenMonat({
        eee, uv, invest, zusatz, ausbildung, sonstZuschuesse, zuschlagProzent
      });

      const deckungDurchMittel = Math.min(result.eigenanteil, eigeneMittel);
      const restLuecke = Math.max(0, result.eigenanteil - deckungDurchMittel);

      const html = baueErgebnisHTML(
        { pflegegrad, monate, zuschlagProzent, eee, uv, invest, zusatz, ausbildung, sonstZuschuesse, eigeneMittel },
        result,
        { deckungDurchMittel, restLuecke, modus }
      );

      out.innerHTML = html;
      out.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (btnReset && out) {
    btnReset.addEventListener("click", () => {
      setTimeout(() => {
        out.innerHTML = "";
        updateZuschlagUI();
      }, 0);
    });
  }
});
