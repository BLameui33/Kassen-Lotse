// heim-rechner.js: Eigenanteil im Pflegeheim mit Leistungszuschlag nach § 43c SGB XI (Stand 2026)
// Benötigt hc-rechner.css (gemeinsame Styles) und optional html2pdf.js für den PDF-Export.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("heim-form");
  const out = document.getElementById("heim_ergebnis");
  const btn = document.getElementById("heim_berechnen");
  if (!form || !out || !btn) return;

  /* Bei Gesetzesänderungen oder neuen Durchschnittswerten anpassen */
  const CONFIG = {
    stand: 2026,
    stufen: [
      { ab: 0,  prozent: 15, name: "1. Aufenthaltsjahr" },
      { ab: 12, prozent: 30, name: "2. Aufenthaltsjahr" },
      { ab: 24, prozent: 50, name: "3. Aufenthaltsjahr" },
      { ab: 36, prozent: 75, name: "Ab dem 4. Aufenthaltsjahr" }
    ],
    durchschnittErstesJahr: 3364,          // vdek, 1. Juli 2026
    durchschnittQuelle: "vdek, Stand 1. Juli 2026",
    schonvermoegen: 10000,
    elternunterhaltUrl: ""                 // optional: Link zum Heimkosten-Rechner (Elternunterhalt)
  };

  const euro = (v) => (Number.isFinite(v) ? v : 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const el = (id) => document.getElementById(id);
  const raw = (id) => (el(id) ? el(id).value.trim() : "");
  const num = (id) => {
    const v = parseFloat(raw(id).replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  };
  const stufeIndex = (m) => {
    let idx = 0;
    CONFIG.stufen.forEach((s, i) => { if (m >= s.ab) idx = i; });
    return idx;
  };

  /* ---------- Live-Anzeige des Zuschlags ---------- */
  const live = el("heim_zuschlag_live");
  const aktualisiereLive = () => {
    const m = Math.max(0, Math.floor(num("heim_monate")));
    const s = CONFIG.stufen[stufeIndex(m)];
    const naechste = CONFIG.stufen[stufeIndex(m) + 1];
    let t = `Aktueller Zuschlag auf den EEE: <strong>${s.prozent} %</strong> (${s.name}).`;
    if (naechste) t += ` In ${naechste.ab - m} Monat${naechste.ab - m === 1 ? "" : "en"} steigt er auf ${naechste.prozent} %.`;
    live.innerHTML = t;
  };
  el("heim_monate").addEventListener("input", aktualisiereLive);
  aktualisiereLive();

  /* ---------- Validierung ---------- */
  const loescheFehler = () => {
    form.querySelectorAll(".hc-fehler").forEach((n) => n.remove());
    form.querySelectorAll("[aria-invalid]").forEach((i) => {
      i.removeAttribute("aria-invalid");
      i.removeAttribute("aria-describedby");
    });
  };
  const zeigeFehler = (id, text) => {
    const input = el(id);
    const p = document.createElement("span");
    p.className = "hc-fehler";
    p.id = id + "_fehler";
    p.setAttribute("role", "alert");
    p.textContent = text;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", p.id);
    input.insertAdjacentElement("afterend", p);
  };
  const validiere = () => {
    loescheFehler();
    const f = [];
    if (num("heim_eee") <= 0) f.push(["heim_eee", "Bitte tragen Sie den EEE aus dem Heimvertrag ein."]);
    if (raw("heim_uv") === "") f.push(["heim_uv", "Bitte tragen Sie die Kosten für Unterkunft und Verpflegung ein."]);
    if (raw("heim_invest") === "") f.push(["heim_invest", "Bitte tragen Sie die Investitionskosten ein. Gibt es keine, geben Sie 0 ein."]);
    form.querySelectorAll('input[type="number"]').forEach((i) => {
      if (i.value === "") return;
      const v = parseFloat(i.value);
      if (v < 0) f.push([i.id, "Bitte geben Sie keinen negativen Betrag ein."]);
      if (i.max && v > parseFloat(i.max)) f.push([i.id, "Der Wert darf höchstens " + i.max + " betragen."]);
    });
    const gesehen = new Set();
    const eindeutig = f.filter(([id]) => (gesehen.has(id) ? false : gesehen.add(id)));
    eindeutig.forEach(([id, t]) => zeigeFehler(id, t));
    if (eindeutig.length) {
      el(eindeutig[0][0]).focus();
      out.innerHTML = "";
    }
    return eindeutig.length === 0;
  };

  /* ---------- Berechnung ---------- */
  const berechne = () => {
    const monate = Math.max(0, Math.floor(num("heim_monate")));
    const eee = num("heim_eee");
    const ausbildung = num("heim_ausbildung");
    const uv = num("heim_uv");
    const invest = num("heim_invest");
    const zusatz = num("heim_zusatz");
    const abzug = num("heim_zuschuesse");
    const mittel = num("heim_eigene_mittel");

    const basis = eee + ausbildung;                       // Zuschlag gilt für EEE inkl. Ausbildungsumlage
    const fix = uv + invest + zusatz;
    const eigenanteil = (prozent) => Math.max(0, basis - basis * (prozent / 100) + fix - abzug);

    const idx = stufeIndex(monate);
    const stufe = CONFIG.stufen[idx];
    const zuschlag = basis * (stufe.prozent / 100);
    const eigen = eigenanteil(stufe.prozent);

    const verlauf = CONFIG.stufen.map((s, i) => ({ ...s, betrag: eigenanteil(s.prozent), aktuell: i === idx }));

    let zwoelfMonate = 0;
    let zwoelfLuecke = 0;
    for (let i = 0; i < 12; i++) {
      const e = eigenanteil(CONFIG.stufen[stufeIndex(monate + i)].prozent);
      zwoelfMonate += e;
      zwoelfLuecke += Math.max(0, e - mittel);
    }

    const naechste = CONFIG.stufen[idx + 1] || null;
    const bisNaechste = naechste ? naechste.ab - monate : null;
    const ersparnisNaechste = naechste ? eigen - eigenanteil(naechste.prozent) : null;

    const vergleichErstesJahr = Math.max(0, basis * 0.85 + uv + invest);   // ohne Zusatz/Zuschüsse, wie im Durchschnitt
    const hatMittel = raw("heim_eigene_mittel") !== "" && mittel > 0;

    return { monate, eee, ausbildung, uv, invest, zusatz, abzug, mittel, hatMittel, basis, stufe, zuschlag, eigen,
             verlauf, zwoelfMonate, zwoelfLuecke, naechste, bisNaechste, ersparnisNaechste, vergleichErstesJahr,
             luecke: Math.max(0, eigen - mittel), ueberschuss: Math.max(0, mittel - eigen) };
  };

  /* ---------- Darstellung ---------- */
  const zeile = (l, w, summe) =>
    `<div class="hc-tabelle__zeile${summe ? " is-summe" : ""}"><dt>${l}</dt><dd>${w}</dd></div>`;

  const kopiertext = (r) => {
    let t = `Pflegeheim-Eigenanteil (Stand ${CONFIG.stand})\nEigenanteil pro Monat: ${euro(r.eigen)}\nZuschlag auf den EEE: ${r.stufe.prozent} %\n`;
    t += "Verlauf:\n" + r.verlauf.map((v) => `- ${v.name} (${v.prozent} %): ${euro(v.betrag)}`).join("\n");
    t += `\nKosten der nächsten 12 Monate: ${euro(r.zwoelfMonate)}`;
    if (r.hatMittel) t += `\nLücke pro Monat nach eigenen Einkünften: ${euro(r.luecke)}`;
    return t + "\n\nOrientierung, keine Rechtsberatung.";
  };

  const rendere = (r) => {
    const titel = `Ihr Eigenanteil beträgt etwa ${euro(r.eigen)} pro Monat`;
    const text = `Das gilt für ${r.monate === 0 ? "den Start im Heim" : "Monat " + (r.monate + 1) + " des Aufenthalts"} mit einem Zuschlag von ${r.stufe.prozent} % auf den EEE. Das sind rund ${euro(r.eigen * 12)} im Jahr, wenn sich nichts ändert.`;

    const verlaufInfo = r.naechste
      ? `In ${r.bisNaechste} Monat${r.bisNaechste === 1 ? "" : "en"} steigt der Zuschlag auf ${r.naechste.prozent} %. Dann sinkt der Eigenanteil um ${euro(r.ersparnisNaechste)} pro Monat.`
      : "Der höchste Zuschlag von 75 % ist erreicht. Weitere Entlastung gibt es über den Zuschlag nicht mehr.";

    const diff = r.vergleichErstesJahr - CONFIG.durchschnittErstesJahr;
    const vergleichText = `Im ersten Aufenthaltsjahr läge der Eigenanteil bei Ihrem Heim bei rund ${euro(r.vergleichErstesJahr)} (ohne Zusatzleistungen und Zuschüsse). Bundesweit liegt der Durchschnitt bei ${euro(CONFIG.durchschnittErstesJahr)} (${CONFIG.durchschnittQuelle}). Ihr Heim liegt damit ${euro(Math.abs(diff))} ${diff > 0 ? "darüber" : "darunter"}.`;

    const deckungHTML = r.hatMittel
      ? `
        <h3>Reichen die eigenen Einkünfte?</h3>
        <dl class="hc-tabelle">
          ${zeile("Eigenanteil pro Monat", euro(r.eigen))}
          ${zeile("Eigene Einkünfte pro Monat", "– " + euro(r.mittel))}
          ${zeile(r.luecke > 0 ? "Offene Lücke pro Monat" : "Überschuss pro Monat", euro(r.luecke > 0 ? r.luecke : r.ueberschuss), true)}
        </dl>
        <p class="hc-res__intro" style="margin-top:14px;">${r.luecke > 0
          ? `In den nächsten 12 Monaten summiert sich die Lücke auf rund ${euro(r.zwoelfLuecke)}. Sie sinkt, sobald der Zuschlag steigt.`
          : "Die Einkünfte decken den Eigenanteil. Preiserhöhungen des Heims können das ändern."}</p>`
      : "";

    const schritte = [];
    if (r.hatMittel && r.luecke > 0) {
      schritte.push(`Bleibt eine Lücke, kann das Sozialamt über „Hilfe zur Pflege“ einspringen. Stellen Sie den Antrag frühzeitig, denn Leistungen gibt es erst ab Antragstellung. Vorher muss Vermögen oberhalb des Schonvermögens von derzeit ${euro(CONFIG.schonvermoegen).replace(",00", "")} pro Person eingesetzt werden.`);
      schritte.push(`Ob Kinder sich beteiligen müssen, hängt von deren Einkommen ab. Erst bei mehr als 100.000 € Jahreseinkommen wird das geprüft.${CONFIG.elternunterhaltUrl ? ` Prüfen Sie das mit dem <a href="${CONFIG.elternunterhaltUrl}">Heimkosten-Rechner</a>.` : ""}`);
    } else if (!r.hatMittel) {
      schritte.push("Tragen Sie in Schritt 3 die monatlichen Einkünfte ein, um zu sehen, ob eine Lücke bleibt.");
    }
    schritte.push("Fragen Sie beim Sozialamt oder Ihrem Land nach Pflegewohngeld oder Zuschüssen zu den Investitionskosten. Das gibt es nur in einigen Bundesländern.");
    schritte.push("Preiserhöhungen muss das Heim mindestens vier Wochen vorher schriftlich und begründet ankündigen. Prüfen Sie diese und fragen Sie bei Unklarheiten Ihre Pflegekasse oder die Verbraucherzentrale.");
    schritte.push("Pflege- und Heimkosten können steuerlich als außergewöhnliche Belastung geltend gemacht werden. Für Unterkunft und Verpflegung gilt das nur abzüglich einer Haushaltsersparnis.");

    out.innerHTML = `
      <article class="hc-res" id="heim_res" tabindex="-1">
        <h2 class="hc-res__aussage">${titel}</h2>
        <p class="hc-res__text">${text}</p>

        <h3>So setzt sich der Betrag zusammen</h3>
        <dl class="hc-tabelle">
          ${zeile("Einrichtungseinheitlicher Eigenanteil (EEE)", euro(r.eee))}
          ${r.ausbildung > 0 ? zeile("Ausbildungsumlage", "+ " + euro(r.ausbildung)) : ""}
          ${zeile("Leistungszuschlag der Pflegekasse (" + r.stufe.prozent + " %)", "– " + euro(r.zuschlag))}
          ${zeile("Unterkunft und Verpflegung", "+ " + euro(r.uv))}
          ${zeile("Investitionskosten", "+ " + euro(r.invest))}
          ${r.zusatz > 0 ? zeile("Zusatzleistungen", "+ " + euro(r.zusatz)) : ""}
          ${r.abzug > 0 ? zeile("Weitere Zuschüsse", "– " + euro(r.abzug)) : ""}
          ${zeile("Eigenanteil pro Monat", euro(r.eigen), true)}
        </dl>

        <h3>So entwickelt sich der Eigenanteil</h3>
        <p class="hc-res__intro">${verlaufInfo} Gerechnet ist mit unveränderten Preisen. In der Praxis erhöhen Heime ihre Entgelte regelmäßig.</p>
        <dl class="hc-tabelle">
          ${r.verlauf.map((v) => zeile(v.name + " (" + v.prozent + " % Zuschlag)" + (v.aktuell ? ", aktuell" : ""), euro(v.betrag), v.aktuell)).join("")}
        </dl>
        <p class="hc-res__intro" style="margin-top:14px;">Die nächsten 12 Monate kosten Sie bei gleichbleibenden Preisen insgesamt rund ${euro(r.zwoelfMonate)}.</p>

        ${deckungHTML}

        <h3>Im Vergleich zum Durchschnitt</h3>
        <p class="hc-res__intro">${vergleichText}</p>

        <h3>Ihre nächsten Schritte</h3>
        <ol class="hc-schritte">${schritte.map((s) => `<li>${s}</li>`).join("")}</ol>

        <div class="hc-res__aktionen" data-kein-pdf>
          <button type="button" class="button" id="heim_pdf_btn">Als PDF speichern</button>
          <button type="button" class="button button-secondary" id="heim_kopieren">Ergebnis kopieren</button>
        </div>

        <p class="hc-res__hinweis">Berechnung nach § 43c SGB XI, Stand ${CONFIG.stand}. Der Leistungszuschlag gilt für die Pflegegrade 2 bis 5, bei Pflegegrad 1 gibt es im Pflegeheim keinen Zuschlag. Maßgeblich ist immer der Heimvertrag. Dieses Ergebnis ersetzt keine Beratung durch Pflegekasse, Pflegestützpunkt oder Sozialamt.</p>
      </article>`;

    const btnKopieren = el("heim_kopieren");
    btnKopieren.addEventListener("click", async () => {
      const t = kopiertext(r);
      try {
        await navigator.clipboard.writeText(t);
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = t;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      const alt = btnKopieren.textContent;
      btnKopieren.textContent = "Kopiert";
      setTimeout(() => { btnKopieren.textContent = alt; }, 2000);
    });

    const pdfBtn = el("heim_pdf_btn");
    if (typeof html2pdf === "undefined") {
      pdfBtn.hidden = true;
    } else {
      pdfBtn.addEventListener("click", () => {
        const karte = el("heim_res");
        const aktionen = karte.querySelector("[data-kein-pdf]");
        const alt = pdfBtn.textContent;
        pdfBtn.textContent = "Wird erstellt …";
        pdfBtn.disabled = true;
        aktionen.style.display = "none";
        const fertig = (text) => {
          aktionen.style.display = "";
          pdfBtn.disabled = false;
          pdfBtn.textContent = text;
          if (text !== alt) setTimeout(() => { pdfBtn.textContent = alt; }, 2500);
        };
        html2pdf()
          .set({
            margin: [12, 12, 12, 12],
            filename: "pflegeheim-eigenanteil.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: document.documentElement.offsetWidth },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ["css", "legacy"], avoid: [".hc-tabelle__zeile", "h3"] }
          })
          .from(karte)
          .save()
          .then(() => fertig(alt))
          .catch((err) => {
            console.error("PDF-Export fehlgeschlagen:", err);
            fertig("Export fehlgeschlagen");
          });
      });
    }

    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = el("heim_res");
    box.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: reduziert ? "auto" : "smooth", block: "start" });
  };

  /* ---------- Events ---------- */
  btn.addEventListener("click", () => {
    if (!validiere()) return;
    rendere(berechne());
  });

  form.addEventListener("reset", () => {
    out.innerHTML = "";
    loescheFehler();
    setTimeout(aktualisiereLive, 0);
  });
});