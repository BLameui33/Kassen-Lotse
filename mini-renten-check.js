// mrc-rechner.js: Mini-Renten-Check (Gesamtrente und Rentenlücke, in heutiger Kaufkraft)
// Benötigt hc-rechner.css (gemeinsame Styles) und optional html2pdf.js für den PDF-Export.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mrc-form");
  const out = document.getElementById("mrc_ergebnis");
  const btn = document.getElementById("mrc_berechnen");
  if (!form || !out || !btn) return;

  const CONFIG = {
    aufbrauchenBisAlter: 90,
    szenarioSpanne: 2,                  // Rendite -/+ 2 Prozentpunkte
    abschlagRechnerUrl: "https://kassen-lotse.de/rentenabschlag-rechner.html"              // optional: Link zum Rentenabschlag-Rechner
  };

  const euro0 = (v) => Math.round(Number.isFinite(v) ? v : 0).toLocaleString("de-DE") + " €";
  const pct1 = (v) => v.toFixed(1).replace(".", ",") + " %";
  const el = (id) => document.getElementById(id);
  const raw = (id) => (el(id) ? el(id).value.trim() : "");
  const num = (id) => {
    const v = parseFloat(raw(id).replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  };

  /* Regelaltersgrenze nach Geburtsjahrgang: [Jahre, Monate] */
  const regelalter = (gj) => {
    if (gj <= 1946) return [65, 0];
    if (gj <= 1957) return [65, gj - 1946];
    if (gj === 1958) return [66, 0];
    if (gj <= 1963) return [66, (gj - 1958) * 2];
    return [67, 0];
  };
  const alterText = ([j, m]) => `${j} Jahre${m ? " und " + m + " Monat" + (m > 1 ? "e" : "") : ""}`;

  const live = el("mrc_regelalter_live");
  const aktualisiereLive = () => {
    const gj = Math.round(num("mrc_geburtsjahr"));
    if (gj >= 1950 && gj <= 2008) {
      live.hidden = false;
      live.innerHTML = `Ihre Regelaltersgrenze: <strong>${alterText(regelalter(gj))}</strong>.`;
    } else {
      live.hidden = true;
      live.innerHTML = "";
    }
  };
  el("mrc_geburtsjahr").addEventListener("input", aktualisiereLive);
  aktualisiereLive();

  /* ---------- Finanzmathe (real, monatliche Verzinsung) ---------- */
  const realRate = (nominalPct, inflPct) => (1 + Math.max(0, nominalPct) / 100) / (1 + Math.max(0, inflPct) / 100) - 1;
  const faktoren = (rReal, monate) => {
    const r = rReal / 12;
    const wachstum = Math.pow(1 + r, monate);
    const rente = Math.abs(r) < 1e-9 ? monate : (wachstum - 1) / r;
    return { wachstum, rente };
  };
  const endvermoegen = (pmt, start, rReal, monate) => {
    if (monate <= 0) return start;
    const f = faktoren(rReal, monate);
    return start * f.wachstum + pmt * f.rente;
  };

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
    const gj = Math.round(num("mrc_geburtsjahr"));
    if (num("mrc_regelrente_monat") <= 0) f.push(["mrc_regelrente_monat", "Bitte tragen Sie Ihre Regelaltersrente aus der Renteninformation ein."]);
    if (!(gj >= 1950 && gj <= 2008)) f.push(["mrc_geburtsjahr", "Bitte geben Sie ein Geburtsjahr zwischen 1950 und 2008 an."]);
    if (num("mrc_netto_heute") <= 0) f.push(["mrc_netto_heute", "Bitte tragen Sie Ihr heutiges Netto ein, damit wir die Lücke berechnen können."]);
    if (raw("mrc_rentenalter") !== "" && (num("mrc_rentenalter") < 60 || num("mrc_rentenalter") > 70)) {
      f.push(["mrc_rentenalter", "Bitte wählen Sie ein Rentenalter zwischen 60 und 70 Jahren."]);
    }
    form.querySelectorAll('input[type="number"]').forEach((i) => {
      if (i.value === "") return;
      const v = parseFloat(i.value);
      if (v < 0) f.push([i.id, "Bitte geben Sie keinen negativen Wert ein."]);
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
    const regelrente = num("mrc_regelrente_monat");
    const gj = Math.round(num("mrc_geburtsjahr"));
    const abweichend = raw("mrc_rentenalter") !== "" ? Math.round(num("mrc_rentenalter")) : null;
    const nettoHeute = num("mrc_netto_heute");
    const zielAnteil = parseFloat(el("mrc_ziel").value);
    const weitere = num("mrc_weitere_rente");
    const abzug = num("mrc_abzug_prozent") / 100;
    const pmt = num("mrc_sparrate");
    const start = num("mrc_startkapital");
    const rNom = num("mrc_rendite_nominal");
    const infl = num("mrc_inflation");
    const modus = el("mrc_auszahlung").value;

    const jetzt = new Date();
    const alterMonate = (jetzt.getFullYear() - gj) * 12 + (jetzt.getMonth() + 1) - 6;   // Geburtstag grob in Jahresmitte
    const [rj, rm] = regelalter(gj);
    const renteMonate = abweichend !== null ? abweichend * 12 : rj * 12 + rm;
    const sparMonate = Math.max(0, renteMonate - alterMonate);
    const renteAlterText = abweichend !== null ? `${abweichend} Jahre` : alterText([rj, rm]);

    const rReal = realRate(rNom, infl);
    const zahlMonate = Math.max(12, CONFIG.aufbrauchenBisAlter * 12 - renteMonate);

    const monatlichAus = (pot) => (modus === "aufbrauchen" ? pot / zahlMonate : (pot * (parseFloat(modus) / 100)) / 12);
    const potNoetig = (monatlich) => (modus === "aufbrauchen" ? monatlich * zahlMonate : (monatlich * 12) / (parseFloat(modus) / 100));

    const pot = endvermoegen(pmt, start, rReal, sparMonate);
    const privat = monatlichAus(pot);

    const nettoRente = regelrente * (1 - abzug);
    const gesamt = nettoRente + weitere + privat;
    const ziel = nettoHeute * zielAnteil;
    const luecke = ziel - gesamt;
    const deckung = ziel > 0 ? gesamt / ziel : 0;

    /* Nötige Sparrate zum Schließen der Lücke */
    let noetigeRate = null, zusaetzlich = null;
    if (luecke > 0 && sparMonate > 0) {
      const potZiel = potNoetig(privat + luecke);
      const f = faktoren(rReal, sparMonate);
      noetigeRate = Math.max(0, (potZiel - start * f.wachstum) / f.rente);
      zusaetzlich = Math.max(0, noetigeRate - pmt);
    }

    /* Szenarien */
    const szenarien = [-CONFIG.szenarioSpanne, 0, CONFIG.szenarioSpanne].map((d) => {
      const r = Math.max(0, rNom + d);
      const p = endvermoegen(pmt, start, realRate(r, infl), sparMonate);
      const m = monatlichAus(p);
      return { rendite: r, privat: m, gesamt: nettoRente + weitere + m, luecke: ziel - (nettoRente + weitere + m), basis: d === 0 };
    });

    const eingezahlt = start + pmt * sparMonate;

    return { regelrente, nettoHeute, zielAnteil, ziel, weitere, abzug, nettoRente, pmt, start, rNom, infl, rReal, modus,
             sparMonate, renteAlterText, pot, privat, gesamt, luecke, deckung, noetigeRate, zusaetzlich, szenarien,
             eingezahlt, zinsen: Math.max(0, pot - eingezahlt), bereitsImRentenalter: sparMonate === 0 };
  };

  /* ---------- Darstellung ---------- */
  const zeile = (l, w, summe) =>
    `<div class="hc-tabelle__zeile${summe ? " is-summe" : ""}"><dt>${l}</dt><dd>${w}</dd></div>`;

  const skalaHTML = (r) => {
    const skala = Math.max(r.ziel * 1.25, r.gesamt * 1.05, 1);
    const marke = (r.ziel / skala) * 100;
    const fuell = (Math.min(r.gesamt, r.ziel) / skala) * 100;
    const ueber = r.gesamt > r.ziel ? ((r.gesamt - r.ziel) / skala) * 100 : 0;
    return `
      <div class="hc-gauge" role="img" aria-label="Gesamtrente ${euro0(r.gesamt)} im Vergleich zum Wunsch-Netto von ${euro0(r.ziel)}">
        <div class="hc-gauge__spur">
          <div class="hc-gauge__fuell" data-breite="${fuell.toFixed(2)}"></div>
          <div class="hc-gauge__ueber" style="left:${marke.toFixed(2)}%" data-breite="${ueber.toFixed(2)}"></div>
          <div class="hc-gauge__marke" style="left:${marke.toFixed(2)}%"></div>
        </div>
        <div class="hc-gauge__skala">
          <span>0 €</span>
          <span class="hc-gauge__grenze" style="left:${marke.toFixed(2)}%">Wunsch-Netto ${euro0(r.ziel)}</span>
        </div>
      </div>`;
  };

  const kopiertext = (r) => {
    let t = `Mini-Renten-Check (in heutiger Kaufkraft)\nGesamtrente: ${euro0(r.gesamt)} netto pro Monat\nWunsch-Netto: ${euro0(r.ziel)}\n`;
    t += r.luecke > 0 ? `Rentenlücke: ${euro0(r.luecke)} pro Monat` : `Überschuss: ${euro0(-r.luecke)} pro Monat`;
    if (r.noetigeRate !== null) t += `\nSparrate zum Schließen der Lücke: ${euro0(r.noetigeRate)} pro Monat`;
    return t + "\n\nOrientierung, keine Anlageberatung.";
  };

  const bindAktionen = (r) => {
    const btnKopieren = el("mrc_kopieren");
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

    const pdfBtn = el("mrc_pdf_btn");
    if (typeof html2pdf === "undefined") { pdfBtn.hidden = true; return; }
    pdfBtn.addEventListener("click", () => {
      const karte = el("mrc_res");
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
          filename: "renten-check.pdf",
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
    const hatLuecke = r.luecke > 0;
    const titel = hatLuecke
      ? `Ihre Rentenlücke beträgt etwa ${euro0(r.luecke)} pro Monat`
      : `Ihre Vorsorge deckt Ihr Wunsch-Netto, mit ${euro0(-r.luecke)} Puffer`;
    const text = `Ihre voraussichtliche Gesamtrente liegt bei ${euro0(r.gesamt)} netto pro Monat. Das sind ${Math.round(r.deckung * 100)} % Ihres Wunsch-Nettos von ${euro0(r.ziel)}. Alle Beträge sind in heutiger Kaufkraft angegeben.`;

    const sparplan = (() => {
      if (!hatLuecke) return "";
      if (r.bereitsImRentenalter) {
        return `
          <h3>Was Sie tun können</h3>
          <p class="hc-res__intro">Sie sind nach Ihren Angaben bereits im Rentenalter, deshalb lässt sich die Lücke nicht mehr über eine Sparrate schließen. Prüfen Sie stattdessen, ob Zuverdienst, späterer Rentenbeginn mit Zuschlag oder Einnahmen aus Vermögen helfen.</p>`;
      }
      return `
        <h3>Wie Sie die Lücke schließen können</h3>
        <p class="hc-res__intro">Um die Lücke bis zum Rentenbeginn zu schließen, müssten Sie ${euro0(r.noetigeRate)} pro Monat sparen. Das sind ${r.zusaetzlich > 0 ? euro0(r.zusaetzlich) + " mehr als bisher" : "nicht mehr als bisher"}. Je früher Sie beginnen, desto weniger ist es, denn die Zinsen arbeiten länger für Sie.</p>
        <dl class="hc-tabelle">
          ${zeile("Aktuelle Sparrate", euro0(r.pmt))}
          ${zeile("Nötige Sparrate", euro0(r.noetigeRate))}
          ${zeile("Zusätzlich nötig", euro0(r.zusaetzlich), true)}
        </dl>`;
    })();

    out.innerHTML = `
      <article class="hc-res" id="mrc_res" tabindex="-1">
        <h2 class="hc-res__aussage">${titel}</h2>
        <p class="hc-res__text">${text}</p>
        ${skalaHTML(r)}

        <h3>So setzt sich Ihre Gesamtrente zusammen</h3>
        <dl class="hc-tabelle">
          ${zeile("Gesetzliche Rente, brutto", euro0(r.regelrente))}
          ${zeile("Abzüge Kranken- und Pflegeversicherung, Steuern (" + pct1(r.abzug * 100) + ")", "– " + euro0(r.regelrente * r.abzug))}
          ${zeile("Gesetzliche Rente, netto", euro0(r.nettoRente))}
          ${r.weitere > 0 ? zeile("Weitere Altersbezüge, netto", "+ " + euro0(r.weitere)) : ""}
          ${zeile("Private Zusatzrente aus Ihrem Sparplan", "+ " + euro0(r.privat))}
          ${zeile("Gesamtrente, netto", euro0(r.gesamt), true)}
          ${zeile("Wunsch-Netto (" + Math.round(r.zielAnteil * 100) + " % von " + euro0(r.nettoHeute) + ")", euro0(r.ziel))}
          ${zeile(hatLuecke ? "Rentenlücke" : "Überschuss", euro0(Math.abs(r.luecke)), true)}
        </dl>

        <h3>Ihr Sparplan im Überblick</h3>
        <p class="hc-res__intro">${r.bereitsImRentenalter
          ? "Es bleibt keine Sparzeit mehr. Berechnet wird nur Ihr vorhandenes Vermögen."
          : `Sie sparen noch ${Math.floor(r.sparMonate / 12)} Jahre${r.sparMonate % 12 ? " und " + (r.sparMonate % 12) + " Monate" : ""} bis zum Rentenbeginn mit ${r.renteAlterText}. Der reale Zins beträgt ${(r.rReal * 100).toFixed(2).replace(".", ",")} % pro Jahr (${pct1(r.rNom)} Rendite minus ${pct1(r.infl)} Inflation).`}</p>
        <dl class="hc-tabelle">
          ${zeile("Eingezahlt (inklusive vorhandenem Vermögen)", euro0(r.eingezahlt))}
          ${zeile("Wertzuwachs durch Zinsen", "+ " + euro0(r.zinsen))}
          ${zeile("Vermögen bei Rentenbeginn (heutige Kaufkraft)", euro0(r.pot), true)}
        </dl>

        ${sparplan}

        <h3>Was, wenn die Rendite abweicht?</h3>
        <p class="hc-res__intro">Niemand kennt die künftige Rendite. So verändert sich Ihre Lücke, wenn sie um ${CONFIG.szenarioSpanne} Prozentpunkte niedriger oder höher ausfällt.</p>
        <dl class="hc-tabelle">
          ${r.szenarien.map((s) => zeile(
            pct1(s.rendite) + " Rendite" + (s.basis ? " (Ihre Annahme)" : ""),
            (s.luecke > 0 ? "Lücke " + euro0(s.luecke) : "Überschuss " + euro0(-s.luecke)),
            s.basis
          )).join("")}
        </dl>

        <h3>Ihre nächsten Schritte</h3>
        <ol class="hc-schritte">
          <li>Fordern Sie jedes Jahr Ihre Renteninformation an oder rufen Sie sie online ab, damit die Zahl aktuell bleibt.</li>
          <li>Prüfen Sie die Betriebsrente. Ihr Arbeitgeber muss sich mit mindestens 15 % an einer Entgeltumwandlung beteiligen, das ist oft das beste Angebot.</li>
          <li>Nutzen Sie bei langem Anlagehorizont breit gestreute, kostengünstige Fonds. Beachten Sie, dass auf Erträge Steuern anfallen.</li>
          <li>${CONFIG.abschlagRechnerUrl
            ? `Wollen Sie früher in Rente gehen, berechnen Sie die Kürzung im <a href="${CONFIG.abschlagRechnerUrl}">Rentenabschlag-Rechner</a>.`
            : "Wollen Sie früher in Rente gehen, berechnen Sie zuerst die Kürzung Ihrer gesetzlichen Rente im Rentenabschlag-Rechner."}</li>
        </ol>

        <div class="hc-res__aktionen" data-kein-pdf>
          <button type="button" class="button" id="mrc_pdf_btn">Als PDF speichern</button>
          <button type="button" class="button button-secondary" id="mrc_kopieren">Ergebnis kopieren</button>
        </div>

        <p class="hc-res__hinweis">Vereinfachte Modellrechnung in heutiger Kaufkraft. Steuern auf Kapitalerträge und Produktkosten sind nicht enthalten, die Abzüge auf die gesetzliche Rente sind pauschal. Rendite und Inflation sind Annahmen. Dies ist keine Anlage- oder Rentenberatung. Wenden Sie sich für eine verbindliche Auskunft an die Deutsche Rentenversicherung oder eine unabhängige Beratung.</p>
      </article>`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      out.querySelectorAll("[data-breite]").forEach((n) => { n.style.width = n.dataset.breite + "%"; });
    }));
    bindAktionen(r);

    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = el("mrc_res");
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