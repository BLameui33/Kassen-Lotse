// mutterschaftsgeld-rechner.js (mit Mutterschutz-Tagen & PDF-Export)

function n(el){ if(!el) return 0; const v = Number((el.value||"").toString().replace(",", ".")); return Number.isFinite(v)?v:0; }
function euro(v){ const x = Number.isFinite(v)?v:0; return x.toFixed(2).replace(".", ",") + " €"; }
function formatDate(d){
  if(!d) return "–";
  const dd = ("0"+d.getDate()).slice(-2);
  const mm = ("0"+(d.getMonth()+1)).slice(-2);
  return `${dd}.${mm}.${d.getFullYear()}`;
}
function daysBetween(a,b){ return Math.round((b - a) / (1000*60*60*24)); }

document.addEventListener("DOMContentLoaded", () => {
  const vers = document.getElementById("mg_versicherung");
  const m1 = document.getElementById("mg_m1");
  const m2 = document.getElementById("mg_m2");
  const m3 = document.getElementById("mg_m3");

  const et = document.getElementById("mg_et");
  const verl = document.getElementById("mg_verlaengerung");
  const durLabel = document.getElementById("mg_dauer_label");
  const durCustom = document.getElementById("mg_dauer_custom");

  const kkTag = document.getElementById("mg_kk_tag");
  const basMax = document.getElementById("mg_bas_max");

  const btn = document.getElementById("mg_berechnen");
  const reset = document.getElementById("mg_reset");
  const out = document.getElementById("mg_ergebnis");

  // Toggle für individuelle Tage
  if (verl){
    verl.addEventListener("change", () => {
      if (verl.value === "individuell"){
        durLabel.style.display = "block";
      } else {
        durLabel.style.display = "none";
      }
      out.innerHTML = "";
    });
    if (verl.value !== "individuell") durLabel.style.display = "none";
  }

  btn.addEventListener("click", () => {
    out.innerHTML = "";
    // Inputs
    const input = {
      versicherung: (vers && vers.value) || "gesetzlich",
      m1: n(m1), m2: n(m2), m3: n(m3),
      etStr: (et && et.value) || "",
      verlaengerung: (verl && verl.value) || "standard",
      customDays: Math.max(1, Math.floor(n(durCustom))),
      kkTag: n(kkTag) || 13,
      basMax: n(basMax) || 210
    };

    // Plausibilitätscheck Einkommen
    if (input.m1 <= 0 || input.m2 <= 0 || input.m3 <= 0){
      out.innerHTML = `<div class="warning-box">Bitte trage die Netto-Beträge der letzten 3 Monate ein (je größer 0).</div>`;
      return;
    }

    // Berechne Mutterschutz-Tage (mit ET)
    // Start = ET - 42 Tage (6 Wochen)
    // Ende = Geburt + Nachfrist: Standard 56 Tage (8 Wochen) oder 84 Tage (12 Wochen)
    let etDate = null;
    if (input.etStr){
      const tmp = new Date(input.etStr + "T12:00:00"); // avoid timezone shift
      if (!isNaN(tmp.getTime())) etDate = tmp;
    }

    // Bestimme days (gesamt) und Display-Range (wir benutzen ET als Annahme für Geburt)
    let days = 98; // default
    if (input.verlaengerung === "fruehling") days = 126; // 6w + 12w = 126
    else if (input.verlaengerung === "individuell") days = input.customDays;

    // If ET provided compute start/end assumptions
    let assumedStart = null, assumedBirth = null, assumedEnd = null;
    if (etDate){
      assumedBirth = new Date(etDate.getTime());
      assumedStart = new Date(etDate.getTime() - 42 * 24*60*60*1000);
      // choose nachfrist depending on option
      const afterDays = (input.verlaengerung === "fruehling") ? 84 : 56;
      assumedEnd = new Date(assumedBirth.getTime() + afterDays * 24*60*60*1000);
    } else {
      // If no ET, we still set a neutral start/end relative to today
      const today = new Date();
      assumedBirth = null;
      assumedStart = null;
      assumedEnd = null;
    }

    // 2) Durchschnittlicher kalendertäglicher Nettoverdienst aus 3 Monaten
    const sum3 = input.m1 + input.m2 + input.m3;
    const dailyAvg = sum3 / 90; // Praxis: Summe der 3 Monate / 90 Kalendertage
    const totalNetEntitlement = dailyAvg * days;

    // 3) Krankenkassenanteil (gesetzlich)
    // Kasse zahlt bis kkTag/Tag, aber nicht mehr als dailyAvg (kann in Einzelfällen <13)
    const kkDaily = Math.min(input.kkTag, dailyAvg);
    const kkTotal = kkDaily * days;

    // 4) Privat/Fam: Bundesamt (BAS) Einmalzahlung bis basMax, Arbeitgeber kann Differenz zahlen
    let employerTop = 0;
    let basPayment = 0;
    let note = "";

    if (input.versicherung === "gesetzlich"){
      employerTop = Math.max(0, totalNetEntitlement - kkTotal);
      note = "Gesetzlich versichert: Krankenkasse zahlt bis zum Tagessatz, Arbeitgeber zahlt den Differenzbetrag.";
    } else {
      basPayment = Math.min(input.basMax, totalNetEntitlement);
      employerTop = Math.max(0, totalNetEntitlement - basPayment);
      note = "Privat/familienversichert: Bundesamt zahlt einmalig bis zum Maximalbetrag; Arbeitgeber zahlt ggf. Differenz.";
    }

    // Runden für die Anzeige
    const dailyAvgRounded = Math.round(dailyAvg * 100) / 100;
    const kkDailyRounded = Math.round(kkDaily * 100) / 100;
    const kkTotalRounded = Math.round(kkTotal * 100) / 100;
    const employerTopRounded = Math.round(employerTop * 100) / 100;
    const totalRounded = Math.round((kkTotal + employerTop + basPayment) * 100) / 100;

    // Build result HTML
    const resultHtml = `
      <h2>Ergebnis: Mutterschaftsgeld & Zuschuss</h2>

      <div id="mg_result_card" class="pflegegrad-result-card">
        <h3>Kurzüberblick</h3>
        <table class="pflegegrad-tabelle">
          <thead><tr><th>Größe</th><th>Wert</th></tr></thead>
          <tbody>
            <tr><td>Versicherung</td><td>${input.versicherung === "gesetzlich" ? "gesetzlich" : "privat / familienversichert"}</td></tr>
            <tr><td>Mutterschutzdauer (angenommen)</td><td>${days} Kalendertage</td></tr>
            <tr><td>Durchschn. Tagessatz (letzte 3 Monate)</td><td><strong>${euro(dailyAvgRounded)}</strong></td></tr>
            <tr><td>Krankenkassen-Tagessatz (bis)</td><td>${euro(kkDailyRounded)} / Tag</td></tr>
            <tr><td>Krankenkassen-Anteil (gesamt, geschätzt)</td><td>${euro(kkTotalRounded)}</td></tr>
            ${input.versicherung === "privat" ? `<tr><td>Bundesamt (max.)</td><td>${euro(input.basMax)}</td></tr>` : ""}
            <tr><td><strong>Arbeitgeberzuschuss (geschätzt)</strong></td><td><strong>${euro(employerTopRounded)}</strong></td></tr>
            <tr><td><strong>Gesamt (Netto-Äquivalent, geschätzt)</strong></td><td><strong>${euro(totalRounded)}</strong></td></tr>
          </tbody>
        </table>

        <h3>Mutterschutz: angenommene Daten (Orientierung)</h3>
        <table class="pflegegrad-tabelle">
          <thead><tr><th>Bezeichnung</th><th>Datum</th><th>Bemerkung</th></tr></thead>
          <tbody>
            <tr><td>Erwarteter Entbindungstermin (ET)</td><td>${et.value ? formatDate(new Date(et.value+"T12:00:00")) : "nicht angegeben"}</td><td>ET als Berechnungsbasis; reale Geburt kann abweichen</td></tr>
            <tr><td>Mutterschutz-Start (ET − 6 Wochen)</td><td>${assumedStart ? formatDate(assumedStart) : "–"}</td><td>Start der Schutzfrist (angenommen)</td></tr>
            <tr><td>Angenommener Geburtstag</td><td>${assumedBirth ? formatDate(assumedBirth) : "–"}</td><td>Wir verwenden ET als angenommene Geburt</td></tr>
            <tr><td>Mutterschutz-Ende (Nachfrist)</td><td>${assumedEnd ? formatDate(assumedEnd) : "–"}</td><td>Nachfrist: ${input.verlaengerung === "fruehling" ? "12 Wochen" : "8 Wochen"} nach Geburt</td></tr>
          </tbody>
        </table>

        <h3>Erklärung & Hinweise</h3>
        <p>${note}</p>
        <ul>
          <li>Die Berechnung des Tagessatzes erfolgt aus der Summe der letzten 3 Netto-Monate geteilt durch 90 Kalendertage.</li>
          <li>Gesetzlich Versicherte erhalten von der Krankenkasse bis zu ${euro(input.kkTag)} je Kalendertag; Arbeitgeber zahlt die Differenz.</li>
          <li>Privat/familienversicherte: Bundesamt (bis ${euro(input.basMax)}) + ggf. Arbeitgeberzuschuss.</li>
        </ul>

        <h3>Was jetzt tun?</h3>
        <ol>
          <li>Mutterschaftsgeld bei deiner Krankenkasse (gesetzlich) oder beim Bundesamt (privat/familienversichert) beantragen.</li>
          <li>Personal/Lohnbuchhaltung informieren: Arbeitgeberzuschuss wird dort berechnet.</li>
          <li>Lohnabrechnungen der letzten 3 Monate bereithalten.</li>
        </ol>

        <div class="button-container" style="display:flex; gap:.6rem; margin-top:1rem;">
          <button id="mg_pdf" class="button">Als PDF speichern</button>
          <button id="mg_download_json" class="button button-secondary">Daten (JSON) herunterladen</button>
        </div>

        <p class="hinweis">Hinweis: Werte sind orientierend. Maßgeblich ist der Bescheid/die Berechnung durch Krankenkasse/Arbeitgeber/Bundesamt.</p>
      </div>
    `;

    out.innerHTML = resultHtml;
    out.scrollIntoView({ behavior: "smooth" });

    // PDF-Export: nur die Ergebniskarte als Inhalt
    const pdfBtn = document.getElementById("mg_pdf");
    const jsonBtn = document.getElementById("mg_download_json");
    const resultCard = document.getElementById("mg_result_card");

    if (pdfBtn && resultCard){
      pdfBtn.addEventListener("click", () => {
        // Optionen: margin, filename, image quality, html2canvas scale
        const opt = {
          margin:       0.6,
          filename:     'mutterschaftsgeld-ergebnis.pdf',
          image:        { type: 'jpeg', quality: 0.95 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        // Erstelle eine Kopie des Elements mit bereinigtem Styles (optional)
        html2pdf().set(opt).from(resultCard).save();
      });
    }

    // JSON-Download (nur zur Weiterverarbeitung)
    if (jsonBtn){
      jsonBtn.addEventListener("click", () => {
        const data = {
          input,
          computed: {
            days, dailyAvg: dailyAvgRounded, kkDaily: kkDailyRounded,
            kkTotal: kkTotalRounded, employerTop: employerTopRounded, total: totalRounded,
            assumedStart: assumedStart ? assumedStart.toISOString().slice(0,10) : null,
            assumedBirth: assumedBirth ? assumedBirth.toISOString().slice(0,10) : null,
            assumedEnd: assumedEnd ? assumedEnd.toISOString().slice(0,10) : null
          }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mutterschaftsgeld-daten.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }
  });

  if (reset){
    reset.addEventListener("click", () => { setTimeout(()=>{ out.innerHTML = ""; }, 0); });
  }
});
