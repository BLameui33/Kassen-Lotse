// ra-rechner.js: Rentenabschlag und Rentenzuschlag bei der Altersrente (Stand 2026)
// Benötigt hc-rechner.css (gemeinsame Styles) und optional html2pdf.js für den PDF-Export.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ra-form");
  const out = document.getElementById("ra_ergebnis");
  const btn = document.getElementById("ra_berechnen");
  if (!form || !out || !btn) return;

  /* Jährlich prüfen und anpassen */
  const CONFIG = {
    jahr: 2026,
    abschlagProMonat: 0.003,
    zuschlagProMonat: 0.005,
    rentenwert: 42.52,              // aktueller Rentenwert ab 1.7.2026
    durchschnittsentgelt: 51944,    // vorläufig 2026
    bbgJahr: 101400,                // Beitragsbemessungsgrenze allgemeine Rentenversicherung 2026
    vergleichAlter: 85
  };

  const euro2 = (v) => (Number.isFinite(v) ? v : 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const euro0 = (v) => Math.round(Number.isFinite(v) ? v : 0).toLocaleString("de-DE") + " €";
  const pct = (v) => (v * 100).toFixed(1).replace(".", ",") + " %";
  const el = (id) => document.getElementById(id);
  const raw = (id) => (el(id) ? el(id).value.trim() : "");
  const num = (id) => {
    const v = parseFloat(raw(id).replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  };
  const mText = (m) => `${Math.floor(m / 12)} Jahre${m % 12 ? " und " + (m % 12) + " Monat" + (m % 12 > 1 ? "e" : "") : ""}`;

  /* ---------- Altersgrenzen (in Monaten), gültig für Jahrgänge ab 1958 ---------- */
  const regelalter = (gj) => (gj <= 1958 ? 66 * 12 : gj <= 1963 ? 66 * 12 + (gj - 1958) * 2 : 67 * 12);
  const grenzen = (gj, art) => {
    const reg = regelalter(gj);
    if (art === "langjaehrig") return { reg, frei: reg, frueh: 63 * 12 };
    if (art === "schwer") return { reg, frei: reg - 24, frueh: reg - 24 - 36 };
    return { reg, frei: reg - 24, frueh: reg - 24 };            // besonders langjährig: kein früherer Beginn
  };

  const wunschMonate = () => Math.round(num("ra_wunsch_jahre")) * 12 + Math.min(11, Math.max(0, Math.round(num("ra_wunsch_monate"))));
  const gjGueltig = () => {
    const gj = Math.round(num("ra_geburtsjahr"));
    return gj >= 1958 && gj <= 2008 ? gj : null;
  };

  /* ---------- Live-Hinweise ---------- */
  const liveGrenzen = el("ra_grenzen_live");
  const liveWunsch = el("ra_wunsch_live");

  const aktualisiereLive = () => {
    const gj = gjGueltig();
    if (!gj) {
      liveGrenzen.hidden = true;
      liveWunsch.hidden = true;
      return;
    }
    const art = el("ra_rentenart").value;
    const g = grenzen(gj, art);
    liveGrenzen.hidden = false;
    liveGrenzen.innerHTML = `Regelaltersgrenze: <strong>${mText(g.reg)}</strong>. ` +
      (art === "besonders"
        ? `Abschlagsfrei ab <strong>${mText(g.frei)}</strong>. Ein früherer Beginn ist bei dieser Rentenart nicht möglich.`
        : `Frühester Beginn: <strong>${mText(g.frueh)}</strong>${art === "schwer" ? ` (mit Abschlag), abschlagsfrei ab <strong>${mText(g.frei)}</strong>` : ", abschlagsfrei erst zur Regelaltersgrenze"}.`);

    const b = wunschMonate();
    if (b < g.frueh) {
      liveWunsch.hidden = false;
      liveWunsch.innerHTML = `Mit dieser Rentenart ist ein Beginn frühestens mit <strong>${mText(g.frueh)}</strong> möglich.`;
      return;
    }
    const abschlag = Math.max(0, g.frei - b) * CONFIG.abschlagProMonat;
    const zuschlag = Math.max(0, b - g.reg) * CONFIG.zuschlagProMonat;
    liveWunsch.hidden = false;
    liveWunsch.innerHTML = abschlag > 0
      ? `Ihr Wunschtermin liegt ${g.frei - b} Monate vor der abschlagsfreien Altersgrenze: <strong>Abschlag ${pct(abschlag)}</strong>, lebenslang.`
      : zuschlag > 0
        ? `Ihr Wunschtermin liegt ${b - g.reg} Monate nach der Regelaltersgrenze: <strong>Zuschlag ${pct(zuschlag)}</strong>.`
        : "Bei diesem Wunschtermin gibt es <strong>keinen Abschlag</strong>.";
  };
  ["ra_geburtsjahr", "ra_rentenart", "ra_wunsch_jahre", "ra_wunsch_monate"].forEach((id) => {
    el(id).addEventListener("input", aktualisiereLive);
    el(id).addEventListener("change", aktualisiereLive);
  });
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
    const ziel = input.closest("div[style]") || input;
    ziel.insertAdjacentElement("afterend", p);
  };
  const validiere = () => {
    loescheFehler();
    const f = [];
    const gj = gjGueltig();
    if (!gj) f.push(["ra_geburtsjahr", "Bitte geben Sie ein Geburtsjahr zwischen 1958 und 2008 an."]);
    if (num("ra_regelrente") <= 0) f.push(["ra_regelrente", "Bitte tragen Sie die Regelaltersrente aus Ihrer Renteninformation ein."]);
    if (num("ra_wunsch_jahre") < 60 || num("ra_wunsch_jahre") > 70) f.push(["ra_wunsch_jahre", "Bitte wählen Sie ein Alter zwischen 60 und 70 Jahren."]);
    if (gj && !f.some(([id]) => id === "ra_wunsch_jahre")) {
      const g = grenzen(gj, el("ra_rentenart").value);
      if (wunschMonate() < g.frueh) f.push(["ra_wunsch_jahre", `Mit dieser Rentenart ist ein Beginn frühestens mit ${mText(g.frueh)} möglich.`]);
    }
    form.querySelectorAll('input[type="number"]').forEach((i) => {
      if (i.value === "") return;
      const v = parseFloat(i.value);
      if (v < 0) f.push([i.id, "Bitte geben Sie keinen negativen Wert ein."]);
      if (i.max && v > parseFloat(i.max) && !f.some(([id]) => id === i.id)) f.push([i.id, "Der Wert darf höchstens " + i.max + " betragen."]);
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
    const gj = gjGueltig();
    const art = el("ra_rentenart").value;
    const g = grenzen(gj, art);
    const regelrente = num("ra_regelrente");
    const gehalt = num("ra_gehalt");
    const b = wunschMonate();
    const spaeter = Math.min(60, Math.max(0, Math.round(num("ra_spaeter_monate"))));
    const epJahr = gehalt > 0 ? Math.min(gehalt, CONFIG.bbgJahr) / CONFIG.durchschnittsentgelt : 0;

    const rente = (start) => {
      const abschlag = Math.max(0, g.frei - start) * CONFIG.abschlagProMonat;
      const zuschlag = Math.max(0, start - g.reg) * CONFIG.zuschlagProMonat;
      const epDelta = epJahr * ((start - g.reg) / 12);                 // negativ bei früherem, positiv bei späterem Beginn
      const beitragsEffekt = epDelta * CONFIG.rentenwert;
      const basis = Math.max(0, regelrente + beitragsEffekt);
      const betrag = Math.max(0, basis * (1 - abschlag + zuschlag));
      return { start, abschlag, zuschlag, beitragsEffekt, basis, betrag };
    };

    const wunsch = rente(b);
    const regel = rente(g.reg);
    const spaeterR = spaeter > 0 ? rente(b + spaeter) : null;

    /* Überblick aller Varianten */
    const kandidaten = new Map();
    const add = (m, label) => kandidaten.set(m, kandidaten.has(m) ? kandidaten.get(m) + ", " + label : label);
    if (art !== "besonders") add(g.frueh, "frühestmöglich");
    if (g.frei !== g.frueh || art === "besonders") add(g.frei, "abschlagsfrei");
    add(g.reg, "Regelaltersgrenze");
    add(b, "Ihr Wunsch");
    if (spaeter > 0) add(b + spaeter, spaeter + " Monate später");
    const ueberblick = [...kandidaten.entries()].sort((x, y) => x[0] - y[0]).map(([m, label]) => ({ m, label, r: rente(m), wunsch: m === b }));

    /* Break-even: gewünschter Beginn gegenüber Regelaltersgrenze */
    let breakEven = null;
    if (b !== g.reg) {
      const a = b < g.reg ? wunsch : regel;
      const c = b < g.reg ? regel : wunsch;
      if (c.betrag > a.betrag) {
        breakEven = { monate: Math.round(c.start + (a.betrag * (c.start - a.start)) / (c.betrag - a.betrag)), frueherLohnt: false };
      } else {
        breakEven = { frueherLohnt: true };
      }
    }

    const bis = CONFIG.vergleichAlter * 12;
    const summe = (r) => Math.max(0, bis - r.start) * r.betrag;

    return { gj, art, g, regelrente, gehalt, b, spaeter, wunsch, regel, spaeterR, ueberblick, breakEven,
             summeWunsch: summe(wunsch), summeRegel: summe(regel) };
  };

  /* ---------- Darstellung ---------- */
  const zeile = (l, w, summe) =>
    `<div class="hc-tabelle__zeile${summe ? " is-summe" : ""}"><dt>${l}</dt><dd>${w}</dd></div>`;

  const skalaHTML = (r) => {
    const R = r.regelrente;
    const wert = r.wunsch.betrag;
    const skala = Math.max(R * 1.15, wert * 1.05, 1);
    const marke = (R / skala) * 100;
    const fuell = (Math.min(wert, R) / skala) * 100;
    const ueber = wert > R ? ((wert - R) / skala) * 100 : 0;
    return `
      <div class="hc-gauge" role="img" aria-label="Rente bei Ihrem Wunschbeginn ${euro2(wert)} im Vergleich zur Regelaltersrente ${euro2(R)}">
        <div class="hc-gauge__spur">
          <div class="hc-gauge__fuell" data-breite="${fuell.toFixed(2)}"></div>
          <div class="hc-gauge__ueber" style="left:${marke.toFixed(2)}%" data-breite="${ueber.toFixed(2)}"></div>
          <div class="hc-gauge__marke" style="left:${marke.toFixed(2)}%"></div>
        </div>
        <div class="hc-gauge__skala">
          <span>0 €</span>
          <span class="hc-gauge__grenze" style="left:${marke.toFixed(2)}%">Regelrente ${euro0(R)}</span>
        </div>
      </div>`;
  };

  const kopiertext = (r) => {
    let t = `Rentenabschlag-Rechner (Stand ${CONFIG.jahr})\nRentenbeginn mit ${mText(r.b)}: ${euro2(r.wunsch.betrag)} brutto pro Monat\nRegelaltersrente: ${euro2(r.regelrente)}\n`;
    t += r.wunsch.abschlag > 0 ? `Abschlag: ${pct(r.wunsch.abschlag)}` : r.wunsch.zuschlag > 0 ? `Zuschlag: ${pct(r.wunsch.zuschlag)}` : "Kein Abschlag";
    return t + "\n\nOrientierung, keine Rentenauskunft.";
  };

  const bindAktionen = (r) => {
    const btnKopieren = el("ra_kopieren");
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

    const pdfBtn = el("ra_pdf_btn");
    if (typeof html2pdf === "undefined") { pdfBtn.hidden = true; return; }
    pdfBtn.addEventListener("click", () => {
      const karte = el("ra_res");
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
          filename: "rentenabschlag-berechnung.pdf",
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

  const rendere = (r) => {
    const w = r.wunsch;
    const diff = w.betrag - r.regelrente;
    const hatAbschlag = w.abschlag > 0;
    const hatZuschlag = w.zuschlag > 0;

    const titel = `Bei Rentenbeginn mit ${mText(r.b)} erhalten Sie etwa ${euro2(w.betrag)} brutto im Monat`;
    let text;
    if (hatAbschlag) {
      text = `Das sind ${euro2(Math.abs(diff))} weniger als zur Regelaltersgrenze (${euro2(r.regelrente)}). Der Abschlag von ${pct(w.abschlag)} gilt lebenslang.`;
    } else if (hatZuschlag) {
      text = `Das sind ${euro2(Math.abs(diff))} mehr als zur Regelaltersgrenze (${euro2(r.regelrente)}). Der Zuschlag von ${pct(w.zuschlag)} gilt lebenslang.`;
    } else {
      text = `Bei diesem Beginn gibt es keinen Abschlag und keinen Zuschlag.${Math.abs(diff) > 0.5 ? ` Ihre Rente weicht um ${euro2(Math.abs(diff))} von der Regelaltersrente ab, weil Beitragsjahre fehlen.` : ""}`;
    }

    const rechenzeilen = [
      zeile("Regelaltersrente laut Renteninformation", euro2(r.regelrente)),
      r.gehalt > 0 && Math.abs(w.beitragsEffekt) > 0.005
        ? zeile(w.beitragsEffekt < 0 ? "Fehlende Beitragszeit (" + (r.g.reg - r.b) + " Monate ohne Beiträge)" : "Zusätzliche Beitragszeit (" + (r.b - r.g.reg) + " Monate)",
                (w.beitragsEffekt < 0 ? "– " : "+ ") + euro2(Math.abs(w.beitragsEffekt)))
        : "",
      r.gehalt > 0 && Math.abs(w.beitragsEffekt) > 0.005 ? zeile("Rente vor Abschlag beziehungsweise Zuschlag", euro2(w.basis)) : "",
      hatAbschlag ? zeile(`Abschlag (${r.g.frei - r.b} Monate × 0,3 %)`, "– " + pct(w.abschlag) + " (– " + euro2(w.basis * w.abschlag) + ")`".replace("`", "")) : "",
      hatZuschlag ? zeile(`Zuschlag (${r.b - r.g.reg} Monate × 0,5 %)`, "+ " + pct(w.zuschlag) + " (+ " + euro2(w.basis * w.zuschlag) + ")") : "",
      zeile("Monatsrente bei Ihrem Rentenbeginn", euro2(w.betrag), true)
    ].join("");

    const ueberblickHTML = r.ueberblick.map((u) => zeile(
      `${u.label.charAt(0).toUpperCase() + u.label.slice(1)}, mit ${mText(u.m)}`,
      `${euro2(u.r.betrag)} (${u.r.betrag - r.regel.betrag >= 0 ? "+" : "–"} ${euro2(Math.abs(u.r.betrag - r.regel.betrag))})`,
      u.wunsch
    )).join("");

    const breakEvenHTML = (() => {
      if (!r.breakEven) return "";
      const gesamtText = `Bis zum Alter ${CONFIG.vergleichAlter} (ohne Rentenanpassungen, brutto) erhalten Sie bei Ihrem Wunschbeginn insgesamt ${euro0(r.summeWunsch)}, bei Beginn zur Regelaltersgrenze ${euro0(r.summeRegel)}.`;
      if (r.breakEven.frueherLohnt) {
        return `
          <h3>Lohnt sich das Warten?</h3>
          <p class="hc-res__intro">Ihre Monatsrente ist bei Ihrem Wunschbeginn nicht niedriger als zur Regelaltersgrenze. Der frühere Beginn bringt Ihnen deshalb auf jeden Fall mehr Rente insgesamt. ${gesamtText}</p>`;
      }
      const frueher = r.b < r.g.reg;
      return `
        <h3>Lohnt sich das Warten?</h3>
        <p class="hc-res__intro">${frueher
          ? `Der frühere Beginn bringt Ihnen zunächst mehr Geld, weil Sie länger Rente beziehen. Ab einem Alter von <strong>${mText(r.breakEven.monate)}</strong> hat der spätere Start zur Regelaltersgrenze dagegen insgesamt mehr gebracht.`
          : `Der spätere Beginn lohnt sich finanziell, wenn Sie älter als <strong>${mText(r.breakEven.monate)}</strong> werden. Davor war der Start zur Regelaltersgrenze insgesamt günstiger.`} ${gesamtText} Steuern, Beiträge zur Kranken- und Pflegeversicherung sowie Rentenanpassungen sind dabei nicht berücksichtigt.</p>`;
    })();

    const spaeterHTML = r.spaeterR ? (() => {
      const d = r.spaeterR.betrag - w.betrag;
      return `
        <h3>Was bringt es, ${r.spaeter} Monate länger zu warten?</h3>
        <p class="hc-res__intro">Mit Beginn im Alter von ${mText(r.spaeterR.start)} erhalten Sie ${euro2(r.spaeterR.betrag)} im Monat, also ${euro2(d)} mehr als bei Ihrem Wunschtermin. Das sind rund ${euro2(d / r.spaeter)} Mehrrente pro Monat Wartezeit, und zwar lebenslang.</p>`;
    })() : "";

    const schritte = [
      "Lassen Sie Ihr Versicherungskonto bei der Deutschen Rentenversicherung klären und prüfen, ob die Voraussetzungen für Ihre Rentenart (35 oder 45 Versicherungsjahre) erfüllt sind. Die Beratung ist kostenlos.",
      hatAbschlag ? "Abschläge lassen sich ab dem Alter von 50 durch Sonderzahlungen in die Rentenversicherung ganz oder teilweise ausgleichen. Fragen Sie die Rentenversicherung nach der Höhe der Ausgleichszahlung und lassen Sie sich beraten, ob sich das für Sie lohnt." : "",
      hatZuschlag ? "Der Zuschlag gilt nur, wenn Sie Ihre Rente nach der Regelaltersgrenze nicht in Anspruch nehmen. Arbeiten Sie weiter, kommen zusätzlich Rentenansprüche aus den weiteren Beiträgen hinzu." : "",
      "Beantragen Sie die Rente rechtzeitig, am besten drei Monate vor dem gewünschten Beginn. Seit 2023 dürfen Sie bei einer vorgezogenen Rente unbegrenzt hinzuverdienen. Ein Hinzuverdienst kann Ihre Rente aber steuerlich belasten.",
      "Die Beträge hier sind brutto. Von Ihrer Rente gehen noch Beiträge zur Kranken- und Pflegeversicherung ab, und je nach Einkommen können Steuern anfallen."
    ].filter(Boolean);

    out.innerHTML = `
      <article class="hc-res" id="ra_res" tabindex="-1">
        <h2 class="hc-res__aussage">${titel}</h2>
        <p class="hc-res__text">${text}</p>
        ${skalaHTML(r)}

        <h3>So wurde gerechnet</h3>
        <dl class="hc-tabelle">${rechenzeilen}</dl>
        ${r.gehalt > 0 ? "" : `<p class="hc-res__intro" style="margin-top:14px;">Fehlende Beitragsjahre sind nicht berücksichtigt. Tragen Sie Ihr Gehalt ein, um auch diese Wirkung zu sehen.</p>`}

        <h3>Alle Möglichkeiten im Überblick</h3>
        <p class="hc-res__intro">Ihre Rente je nach Rentenbeginn. In Klammern der Unterschied zur Rente bei Beginn zur Regelaltersgrenze.</p>
        <dl class="hc-tabelle">${ueberblickHTML}</dl>

        ${breakEvenHTML}
        ${spaeterHTML}

        <h3>Ihre nächsten Schritte</h3>
        <ol class="hc-schritte">${schritte.map((s) => `<li>${s}</li>`).join("")}</ol>

        <div class="hc-res__aktionen" data-kein-pdf>
          <button type="button" class="button" id="ra_pdf_btn">Als PDF speichern</button>
          <button type="button" class="button button-secondary" id="ra_kopieren">Ergebnis kopieren</button>
        </div>

        <p class="hc-res__hinweis">Vereinfachte Berechnung nach § 77 SGB VI, Stand ${CONFIG.jahr}: Abschlag 0,3 % und Zuschlag 0,5 % pro Monat. Fehlende oder zusätzliche Beitragsjahre sind aus Ihrem Gehalt geschätzt (Rentenwert ${euro2(CONFIG.rentenwert)}). Die tatsächliche Rente legt die Deutsche Rentenversicherung im Rentenbescheid fest. Dieses Ergebnis ersetzt keine Rentenauskunft.</p>
      </article>`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      out.querySelectorAll("[data-breite]").forEach((n) => { n.style.width = n.dataset.breite + "%"; });
    }));
    bindAktionen(r);

    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = el("ra_res");
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