// zuz-rechner.js: Belastungsgrenze für Zuzahlungen nach § 62 SGB V (Stand 2026)
// Benötigt hc-rechner.css (gemeinsame Styles) und optional html2pdf.js für den PDF-Export.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("zuz_form");
  const out = document.getElementById("zuz_ergebnis");
  const btn = document.getElementById("zuz_berechnen");
  if (!form || !out || !btn) return;

  /* Jährlich prüfen und anpassen */
  const CONFIG = {
    jahr: 2026,
    bezugsgroesseJahr: 47460,      // jährliche Bezugsgröße 2026
    anteilErster: 0.15,            // Freibetrag erster Angehöriger (Ehepartner): 15 % -> 7.119 €
    anteilWeitere: 0.10,           // jeder weitere Angehörige: 10 % -> 4.746 €
    freibetragKind: 9756,          // Kinderfreibetrag nach § 32 Abs. 6 EStG 2026
    regelsatzMonat: 563,           // Regelbedarfsstufe 1
    satzNormal: 0.02,
    satzChroniker: 0.01
  };

  const euro = (v) => (Number.isFinite(v) ? v : 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const euro0 = (v) => Math.round(v).toLocaleString("de-DE") + " €";
  const el = (id) => document.getElementById(id);
  const raw = (id) => (el(id) ? el(id).value.trim() : "");
  const num = (id) => {
    const v = parseFloat(raw(id).replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  };

  /* ---------- Sichtbarkeit ---------- */
  const aktualisiereAnsicht = () => {
    const sozial = el("zuz_sozial").checked;
    form.querySelectorAll("[data-zuz-nur='einkommen']").forEach((n) => { n.hidden = sozial; });
  };
  el("zuz_sozial").addEventListener("change", aktualisiereAnsicht);
  aktualisiereAnsicht();

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
    if (el("zuz_versicherungsart").value === "privat") return true;
    const f = [];
    if (!el("zuz_sozial").checked && num("zuz_einkommen") <= 0) {
      f.push(["zuz_einkommen", "Bitte tragen Sie die jährlichen Bruttoeinnahmen des Haushalts ein."]);
    }
    form.querySelectorAll('input[type="number"]').forEach((i) => {
      if (i.closest("[hidden]") || i.value === "") return;
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
    const sozial = el("zuz_sozial").checked;
    const chronisch = el("zuz_chronisch").checked;
    const satz = chronisch ? CONFIG.satzChroniker : CONFIG.satzNormal;
    const bisher = num("zuz_bisher");
    const geplant = num("zuz_geplant");

    const freiErster = CONFIG.bezugsgroesseJahr * CONFIG.anteilErster;
    const freiWeitere = CONFIG.bezugsgroesseJahr * CONFIG.anteilWeitere;

    let brutto, freibetraege = [], freibetragGesamt = 0;
    if (sozial) {
      brutto = CONFIG.regelsatzMonat * 12;
    } else {
      brutto = num("zuz_einkommen");
      const partner = el("zuz_partner").value === "ja";
      const kinder = Math.max(0, Math.round(num("zuz_kinder")));
      const weitere = Math.max(0, Math.round(num("zuz_weitere")));
      let ersterVergeben = false;
      if (partner) {
        freibetraege.push(["Freibetrag Ehe- oder Lebenspartner", freiErster]);
        ersterVergeben = true;
      }
      if (weitere > 0) {
        const erster = ersterVergeben ? 0 : 1;
        const betrag = (erster ? freiErster : 0) + (weitere - erster) * freiWeitere;
        freibetraege.push([`Freibetrag weitere Angehörige (${weitere})`, betrag]);
      }
      if (kinder > 0) freibetraege.push([`Freibetrag Kinder (${kinder} × ${euro0(CONFIG.freibetragKind)})`, kinder * CONFIG.freibetragKind]);
      freibetragGesamt = freibetraege.reduce((s, [, b]) => s + b, 0);
    }

    const anrechenbar = Math.max(0, brutto - freibetragGesamt);
    const grenze = anrechenbar * satz;
    const rest = Math.max(0, grenze - bisher);
    const gesamt = bisher + geplant;
    const erstattungJetzt = Math.max(0, bisher - grenze);
    const erstattungPrognose = Math.max(0, gesamt - grenze);
    const restMitGeplant = Math.max(0, grenze - gesamt);

    return { sozial, chronisch, satz, brutto, freibetraege, freibetragGesamt, anrechenbar, grenze, bisher, geplant,
             rest, gesamt, erstattungJetzt, erstattungPrognose, restMitGeplant,
             erreicht: bisher >= grenze && grenze > 0, wirdErreicht: gesamt >= grenze && grenze > 0 };
  };

  /* ---------- Darstellung ---------- */
  const zeile = (l, w, summe) =>
    `<div class="hc-tabelle__zeile${summe ? " is-summe" : ""}"><dt>${l}</dt><dd>${w}</dd></div>`;

  const skalaHTML = (r) => {
    const skala = Math.max(r.grenze * 1.25, r.gesamt * 1.05, 1);
    const marke = (r.grenze / skala) * 100;
    const bisherPct = (r.bisher / skala) * 100;
    const geplantPct = (r.geplant / skala) * 100;
    return `
      <div class="hc-gauge" role="img" aria-label="Bisher gezahlt ${euro(r.bisher)}, geplant ${euro(r.geplant)}, Belastungsgrenze ${euro(r.grenze)}">
        <div class="hc-gauge__spur">
          <div class="hc-gauge__fuell" data-breite="${bisherPct.toFixed(2)}"></div>
          <div class="hc-gauge__ueber" style="left:${bisherPct.toFixed(2)}%" data-breite="${geplantPct.toFixed(2)}"></div>
          <div class="hc-gauge__marke" style="left:${marke.toFixed(2)}%"></div>
        </div>
        <div class="hc-gauge__skala">
          <span>0 €</span>
          <span class="hc-gauge__grenze" style="left:${marke.toFixed(2)}%">Grenze ${euro(r.grenze)}</span>
        </div>
      </div>
      <p class="hc-res__intro">Blau: bereits gezahlt${r.geplant > 0 ? ". Dunkelblau: noch erwartet" : ""}.</p>`;
  };

  const kopiertext = (r) => {
    let t = `Belastungsgrenze Zuzahlungen ${CONFIG.jahr}\nGrenze: ${euro(r.grenze)} (${r.satz * 100} % von ${euro(r.anrechenbar)})\nBisher gezahlt: ${euro(r.bisher)}\n`;
    t += r.erreicht ? `Grenze erreicht, erstattungsfähig: ${euro(r.erstattungJetzt)}` : `Noch offen bis zur Grenze: ${euro(r.rest)}`;
    return t + "\n\nOrientierung, keine Rechtsberatung.";
  };

  const bindAktionen = (r) => {
    const btnKopieren = el("zuz_kopieren");
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

    const pdfBtn = el("zuz_pdf_btn");
    if (typeof html2pdf === "undefined") { pdfBtn.hidden = true; return; }
    pdfBtn.addEventListener("click", () => {
      const karte = el("zuz_res");
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
          filename: "belastungsgrenze-zuzahlungen.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: document.documentElement.offsetWidth },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"], avoid: [".hc-tabelle__zeile", "h3"] }
        })
        .from(karte)
        .save()
        .then(() => fertig(alt))
        .catch((err) => { console.error("PDF-Export fehlgeschlagen:", err); fertig("Export fehlgeschlagen"); });
    });
  };

  const fokus = () => {
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = el("zuz_res");
    box.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: reduziert ? "auto" : "smooth", block: "start" });
  };

  const renderePrivat = () => {
    out.innerHTML = `
      <article class="hc-res" id="zuz_res" tabindex="-1">
        <h2 class="hc-res__aussage">Die Belastungsgrenze gilt nur für gesetzlich Versicherte</h2>
        <p class="hc-res__text">In der privaten Krankenversicherung gibt es keine gesetzlichen Zuzahlungen und keine 2-Prozent-Grenze. Was Sie selbst tragen, richtet sich nach Ihrem Tarif.</p>
        <h3>Das können Sie prüfen</h3>
        <ol class="hc-schritte">
          <li>Den Selbstbehalt in Ihrem Tarif und ob eine Beitragsrückerstattung bei Leistungsfreiheit vereinbart ist.</li>
          <li>Die Höchstgrenze für Eigenanteile, die in vielen Tarifen festgelegt ist.</li>
          <li>Bei Beihilfe die Regeln Ihres Dienstherrn. Viele sehen eigene Belastungsgrenzen für Eigenbehalte vor.</li>
        </ol>
        <p class="hc-res__hinweis">Dies ist eine allgemeine Information, keine Beratung. Maßgeblich sind Ihre Versicherungsbedingungen und die Beihilfeverordnung.</p>
      </article>`;
    fokus();
  };

  const rendere = (r) => {
    const titel = `Ihre Belastungsgrenze beträgt ${euro(r.grenze)} im Jahr`;
    const text = r.sozial
      ? `Bei Bürgergeld und Grundsicherung gilt pauschal der Regelsatz von ${euro0(r.brutto)} im Jahr als Einnahme. ${r.satz * 100} % davon ergeben diese Grenze. Freibeträge gibt es hier nicht.`
      : `Das sind ${r.satz * 100} % Ihrer anrechenbaren Einnahmen von ${euro0(r.anrechenbar)}${r.freibetragGesamt > 0 ? ", nachdem die Freibeträge für Ihre Angehörigen abgezogen wurden" : ""}.`;

    let status;
    if (r.erreicht) {
      status = `Sie haben die Grenze mit ${euro(r.bisher)} bereits erreicht. ${r.erstattungJetzt > 0 ? `Zu viel gezahlt haben Sie ${euro(r.erstattungJetzt)}, die Sie von der Krankenkasse erstattet bekommen.` : ""} Beantragen Sie bei Ihrer Kasse die Zuzahlungsbefreiung. Für den Rest des Jahres zahlen Sie dann nichts mehr dazu.`;
    } else if (r.wirdErreicht) {
      status = `Mit den erwarteten Zuzahlungen erreichen Sie die Grenze voraussichtlich noch in diesem Jahr. Dann entfallen ${euro(r.erstattungPrognose)} Ihrer Zuzahlungen auf den erstattungsfähigen Teil. Noch offen bis zur Grenze sind ${euro(r.rest)}.`;
    } else {
      status = `Die Grenze ist noch nicht erreicht. Es fehlen ${euro(r.rest)}.${r.geplant > 0 ? ` Auch mit den erwarteten Zuzahlungen bleiben Sie voraussichtlich ${euro(r.restMitGeplant)} darunter.` : ""} Sammeln Sie weiter Ihre Belege.`;
    }

    const rechenzeilen = r.sozial
      ? zeile("Regelsatz pro Jahr (" + euro0(CONFIG.regelsatzMonat) + " × 12)", euro0(r.brutto))
      : [
          zeile("Jährliche Bruttoeinnahmen", euro0(r.brutto)),
          ...r.freibetraege.map(([l, b]) => zeile(l, "– " + euro0(b))),
          zeile("Anrechenbare Einnahmen", euro0(r.anrechenbar))
        ].join("");

    const vorauszahlung = !r.erreicht && r.wirdErreicht
      ? `<li>Sie können den noch offenen Betrag von ${euro(r.rest)} vorab an die Krankenkasse zahlen und erhalten sofort einen Befreiungsausweis. Das lohnt sich, wenn Sie ohnehin mit Zuzahlungen über der Grenze rechnen, und erspart Ihnen das Sammeln der Belege.</li>`
      : "";

    const schritte = [
      r.erreicht
        ? "Reichen Sie Ihre Belege oder die Zuzahlungsübersicht bei der Krankenkasse ein und beantragen Sie die Befreiung beziehungsweise Erstattung. Viele Kassen bieten dafür ein Online-Formular."
        : "Sammeln Sie alle Quittungen. Viele Apotheken stellen am Jahresende eine Zuzahlungsübersicht aus, auch Ihre Krankenkasse hat oft eine Übersicht in der App.",
      vorauszahlung,
      r.chronisch
        ? "Reichen Sie die ärztliche Bescheinigung für die Chroniker-Regel (Muster 55) bei Ihrer Krankenkasse ein, damit die 1-Prozent-Grenze angewendet wird."
        : "Prüfen Sie, ob Sie oder ein Familienmitglied als schwerwiegend chronisch krank gelten. Dann halbiert sich die Grenze auf 1 %.",
      "Die Krankenkasse berechnet die Grenze verbindlich. Sie kann zum Beispiel weitere Angehörige oder besondere Einkünfte anders bewerten als dieser Rechner."
    ].filter(Boolean);

    out.innerHTML = `
      <article class="hc-res" id="zuz_res" tabindex="-1">
        <h2 class="hc-res__aussage">${titel}</h2>
        <p class="hc-res__text">${text}</p>
        ${skalaHTML(r)}

        <h3>So wurde gerechnet</h3>
        <dl class="hc-tabelle">
          ${rechenzeilen}
          ${zeile(r.satz * 100 + " % davon (" + (r.chronisch ? "Chroniker-Regel" : "Regelfall") + ")", euro(r.grenze), true)}
        </dl>

        <h3>Wo Sie stehen</h3>
        <dl class="hc-tabelle">
          ${zeile("Bisher gezahlte Zuzahlungen", euro(r.bisher))}
          ${zeile("Noch offen bis zur Grenze", euro(r.rest), true)}
          ${r.geplant > 0 ? zeile("Erwartet bis Jahresende", "+ " + euro(r.geplant)) : ""}
          ${r.geplant > 0 ? zeile("Bisher und erwartet zusammen", euro(r.gesamt)) : ""}
          ${r.geplant > 0 && r.erstattungPrognose > 0 ? zeile("Davon über der Grenze, also erstattungsfähig", euro(r.erstattungPrognose), true) : ""}
        </dl>
        <p class="hc-res__intro" style="margin-top:14px;">${status}</p>

        <h3>Ihre nächsten Schritte</h3>
        <ol class="hc-schritte">${schritte.map((s) => (s.startsWith("<li>") ? s : `<li>${s}</li>`)).join("")}</ol>

        <div class="hc-res__aktionen" data-kein-pdf>
          <button type="button" class="button" id="zuz_pdf_btn">Als PDF speichern</button>
          <button type="button" class="button button-secondary" id="zuz_kopieren">Ergebnis kopieren</button>
        </div>

        <p class="hc-res__hinweis">Berechnung nach § 62 SGB V, Stand ${CONFIG.jahr}. Bruttoeinnahmen zum Lebensunterhalt, Freibeträge und Sonderfälle bewertet die Krankenkasse im Einzelfall. Dieses Ergebnis ersetzt keine Auskunft Ihrer Kasse.</p>
      </article>`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      out.querySelectorAll("[data-breite]").forEach((n) => { n.style.width = n.dataset.breite + "%"; });
    }));
    bindAktionen(r);
    fokus();
  };

  /* ---------- Events ---------- */
  btn.addEventListener("click", () => {
    if (!validiere()) return;
    if (el("zuz_versicherungsart").value === "privat") renderePrivat();
    else rendere(berechne());
  });

  form.addEventListener("reset", () => {
    out.innerHTML = "";
    loescheFehler();
    setTimeout(aktualisiereAnsicht, 0);
  });
});