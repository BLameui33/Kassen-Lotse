// pflegeheim-eigenanteil-rechner.js

function toNumber(el) {
  if (!el) return 0;
  const raw = (el.value || "").toString().replace(",", ".");
  const num = Number(raw);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function formatEuro(v) {
  const n = Number.isFinite(v) ? v : 0;
  return n.toFixed(2).replace(".", ",") + " €";
}

// Vereinfachte Staffel (Beispiel): Zuschlag in % je nach Aufenthaltsmonaten
function autoZuschlagProzent(monate) {
  const m = Math.max(0, Math.floor(monate || 0));
  if (m >= 36) return 75; // ab 36. Monat
  if (m >= 24) return 50; // 24–35
  if (m >= 12) return 30; // 12–23
  return 15;              // 0–11
}

function berechneEigenanteilEinenMonat({
  eee,
  uv,
  invest,
  zusatz,
  ausbildung,
  sonstZuschuesse,
  zuschlagProzent
}) {
  // Zuschlag der Pflegekasse ist ein prozentualer Zuschuss auf den EEE
  const zuschlagBetrag = eee * (Math.max(0, Math.min(zuschlagProzent, 100)) / 100);
  const eeeNachZuschlag = Math.max(0, eee - zuschlagBetrag);

  // Monatliche Heimkosten für Bewohner: EEE (nach Zuschlag) + U+V + Invest + Zusatz + Ausbildungsumlage - sonstige Zuschüsse
  const bruttoKosten = eeeNachZuschlag + uv + invest + zusatz + ausbildung;
  const eigenanteil = Math.max(0, bruttoKosten - Math.max(0, sonstZuschuesse));

  return {
    zuschlagBetrag,
    eeeNachZuschlag,
    bruttoKosten,
    eigenanteil
  };
}

function baueErgebnisHTML(input, result, deckung) {
  const {
    pflegegrad,
    monate,
    zuschlagProzent,
    eee,
    uv,
    invest,
    zusatz,
    ausbildung,
    sonstZuschuesse,
    eigeneMittel
  } = input;

  const { zuschlagBetrag, eeeNachZuschlag, bruttoKosten, eigenanteil } = result;

  const { deckungDurchMittel, restLuecke } = deckung;

  const modusText = input.modus === "auto"
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
          <tr>
            <th>Baustein</th>
            <th>Betrag / Monat</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>EEE (einrichtungseinheitlicher Eigenanteil)</td>
            <td>${formatEuro(eee)}</td>
          </tr>
          <tr>
            <td>– Leistungszuschlag der Pflegekasse (${zuschlagProzent.toFixed(0)} % von EEE)</td>
            <td>– ${formatEuro(zuschlagBetrag)}</td>
          </tr>
          <tr>
            <td><strong>EEE nach Zuschlag</strong></td>
            <td><strong>${formatEuro(eeeNachZuschlag)}</strong></td>
          </tr>
          <tr>
            <td>Unterkunft &amp; Verpflegung (U+V)</td>
            <td>${formatEuro(uv)}</td>
          </tr>
          <tr>
            <td>Investitionskosten</td>
            <td>${formatEuro(invest)}</td>
          </tr>
          <tr>
            <td>Zusatzleistungen (pauschal)</td>
            <td>${formatEuro(zusatz)}</td>
          </tr>
          <tr>
            <td>Ausbildungsumlage</td>
            <td>${formatEuro(ausbildung)}</td>
          </tr>
          <tr>
            <td>– Sonstige Zuschüsse/Entlastungen</td>
            <td>– ${formatEuro(sonstZuschuesse)}</td>
          </tr>
          <tr>
            <td><strong>Heimkosten gesamt (monatlich)</strong></td>
            <td><strong>${formatEuro(bruttoKosten)}</strong></td>
          </tr>
          <tr>
            <td><strong>Voraussichtlicher Eigenanteil (zu zahlen)</strong></td>
            <td><strong>${formatEuro(eigenanteil)}</strong></td>
          </tr>
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
      Hinweis: Der Leistungszuschlag sowie Zuschüsse (z. B. Pflegewohngeld) unterscheiden sich je nach Bundesland/Heim und können sich ändern.
      Bitte nutze Heimvertrag, Kostenaufstellung und Kassen-/Behördenbescheide als Grundlage und passe die Eingaben an.
      Bei nicht gedeckten Kosten kann ggf. <strong>Hilfe zur Pflege</strong> (Sozialamt) in Betracht kommen.
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

  if (modusSel) {
    modusSel.addEventListener("change", updateZuschlagUI);
  }
  updateZuschlagUI();

  if (btnCalc && out) {
    btnCalc.addEventListener("click", () => {
      const pflegegrad = (gradSel && gradSel.value) || "2";
      const monate = toNumber(monateInput);

      const modus = (modusSel && modusSel.value) || "auto";
      let zuschlagProzent =
        modus === "manuell"
          ? toNumber(prozentInput)
          : autoZuschlagProzent(monate);

      const eee = toNumber(eeeInput);
      const uv = toNumber(uvInput);
      const invest = toNumber(investInput);
      const zusatz = toNumber(zusatzInput);
      const ausbildung = toNumber(ausbildungInput);
      const sonstZuschuesse = toNumber(sonstZuschuesseInput);
      const eigeneMittel = toNumber(eigeneMittelInput);

      const result = berechneEigenanteilEinenMonat({
        eee,
        uv,
        invest,
        zusatz,
        ausbildung,
        sonstZuschuesse,
        zuschlagProzent
      });

      const deckungDurchMittel = Math.min(result.eigenanteil, eigeneMittel);
      const restLuecke = Math.max(0, result.eigenanteil - deckungDurchMittel);

      const html = baueErgebnisHTML(
        {
          pflegegrad,
          monate,
          modus,
          zuschlagProzent,
          eee,
          uv,
          invest,
          zusatz,
          ausbildung,
          sonstZuschuesse,
          eigeneMittel
        },
        result,
        { deckungDurchMittel, restLuecke }
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
