document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("hc-form");
  const ergebnis = document.getElementById("hc_ergebnis");
  const btnBerechnen = document.getElementById("hc_berechnen");
  if (!form || !ergebnis || !btnBerechnen) return;

  /* Jährlich prüfen und anpassen */
  const CONFIG = {
    grenze: 100000,            // § 94 Abs. 1a SGB XII
    wkPauschbetrag: 1230,      // Arbeitnehmer-Pauschbetrag
    selbstbehalt: 2650,        // Elternunterhalt, Düsseldorfer Tabelle 2026
    selbstbehaltEhegatte: 2120,
    anteilBleibt: 0.7,         // 70 % des übersteigenden Einkommens bleiben beim Kind
    knappAb: 0.9,              // Hinweis "knapp unter der Grenze" ab 90 %
    stand: "Düsseldorfer Tabelle 2026"
  };

  const fmt = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const eur = (v) => fmt.format(Math.round(v));
  const el = (id) => document.getElementById(id);
  const raw = (id) => (el(id) ? el(id).value.trim() : "");
  const num = (id) => {
    const v = parseFloat(raw(id).replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  };

  /* ---------- Sichtbarkeit je nach Auswahl ---------- */
  const aktualisiereAnsicht = () => {
    const modus = el("hc_einkommensart").value;
    const verheiratet = el("hc_familienstand").value === "ja";
    form.querySelectorAll("[data-hc-gruppe]").forEach((n) => {
      n.hidden = n.dataset.hcGruppe !== modus;
    });
    form.querySelectorAll("[data-hc-nur='verheiratet']").forEach((n) => {
      n.hidden = !verheiratet;
    });
  };
  el("hc_einkommensart").addEventListener("change", aktualisiereAnsicht);
  el("hc_familienstand").addEventListener("change", aktualisiereAnsicht);
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
    const fehler = [];
    const modus = el("hc_einkommensart").value;
    const pflicht = modus === "steuerbescheid" ? "hc_summe_einkuenfte" : "hc_brutto_jahr";

    if (raw(pflicht) === "") {
      fehler.push([pflicht, "Bitte tragen Sie hier einen Betrag ein. Haben Sie kein Einkommen, geben Sie 0 ein."]);
    }
    form.querySelectorAll('input[type="number"]').forEach((i) => {
      if (i.closest("[hidden]") || i.value === "") return;
      const v = parseFloat(i.value);
      if (v < 0) fehler.push([i.id, "Bitte geben Sie keinen negativen Betrag ein."]);
      if (i.max && v > parseFloat(i.max)) fehler.push([i.id, "Der Wert darf höchstens " + i.max + " betragen."]);
    });

    fehler.forEach(([id, text]) => zeigeFehler(id, text));
    if (fehler.length) {
      el(fehler[0][0]).focus();
      ergebnis.innerHTML = "";
    }
    return fehler.length === 0;
  };

  /* ---------- Berechnung ---------- */
  const berechne = () => {
    const modus = el("hc_einkommensart").value;
    const verheiratet = el("hc_familienstand").value === "ja";
    const zeilen = [];
    let gesamt;

    if (modus === "steuerbescheid") {
      const summe = num("hc_summe_einkuenfte");
      const kapital = num("hc_kapital_zusatz");
      zeilen.push(["Summe der Einkünfte laut Steuerbescheid", eur(summe)]);
      if (kapital > 0) zeilen.push(["Zusätzliche Kapitalerträge", "+ " + eur(kapital)]);
      gesamt = summe + kapital;
    } else {
      const brutto = num("hc_brutto_jahr");
      const wkEingabe = num("hc_werbungskosten");
      const wk = brutto > 0 ? Math.min(brutto, Math.max(wkEingabe, CONFIG.wkPauschbetrag)) : 0;
      const pauschal = brutto > 0 && wkEingabe < CONFIG.wkPauschbetrag;
      const sonstigeEinnahmen = num("hc_zusatz_einkommen");
      const sonstigeKosten = num("hc_kosten_sonstige");
      const sonstigeEinkuenfte = sonstigeEinnahmen - sonstigeKosten;

      zeilen.push(["Brutto-Jahresgehalt", eur(brutto)]);
      zeilen.push([pauschal ? "Werbungskosten (Pauschale)" : "Werbungskosten", "– " + eur(wk)]);
      if (sonstigeEinnahmen > 0 || sonstigeKosten > 0) {
        zeilen.push(["Sonstige Einkünfte nach Abzug der Kosten", (sonstigeEinkuenfte < 0 ? "– " : "+ ") + eur(Math.abs(sonstigeEinkuenfte))]);
      }
      gesamt = brutto - wk + sonstigeEinkuenfte;
    }
    gesamt = Math.max(0, gesamt);

    const ueber = gesamt > CONFIG.grenze;
    const abstand = Math.abs(gesamt - CONFIG.grenze);
    const knapp = !ueber && gesamt >= CONFIG.grenze * CONFIG.knappAb;

    /* Orientierungsrechnung (nur über der Grenze, nur mit Netto-Angabe) */
    const netto = num("hc_netto_monat");
    const kindesunterhalt = num("hc_kindesunterhalt");
    const heimkosten = num("hc_heimkosten_offen");
    let orientierung = null;

    if (ueber && netto > 0) {
      const eigenes = Math.max(0, netto - kindesunterhalt);
      const partner = verheiratet ? num("hc_netto_partner") : 0;
      const familie = eigenes + partner;
      const selbstbehalt = CONFIG.selbstbehalt + (verheiratet ? CONFIG.selbstbehaltEhegatte : 0);
      const uebersteigend = Math.max(0, familie - selbstbehalt);
      const einsetzbarFamilie = uebersteigend * (1 - CONFIG.anteilBleibt);
      const anteil = verheiratet && familie > 0 ? eigenes / familie : 1;
      let betrag = einsetzbarFamilie * anteil;
      const gedeckelt = heimkosten > 0 && betrag > heimkosten;
      if (gedeckelt) betrag = heimkosten;
      orientierung = { eigenes, partner, familie, selbstbehalt, uebersteigend, einsetzbarFamilie, betrag, gedeckelt, verheiratet };
    }

    return { gesamt, zeilen, ueber, abstand, knapp, orientierung, verheiratet,
             kinder: parseInt(raw("hc_anzahl_kinder"), 10) || 0, kindesunterhalt, netto };
  };

  /* ---------- Darstellung ---------- */
  const zeileHTML = (label, wert, summe) =>
    `<div class="hc-tabelle__zeile${summe ? " is-summe" : ""}"><dt>${label}</dt><dd>${wert}</dd></div>`;

  const skalaHTML = (r) => {
    const skala = Math.max(CONFIG.grenze * 1.25, r.gesamt * 1.1);
    const marke = (CONFIG.grenze / skala) * 100;
    const fuell = (Math.min(r.gesamt, CONFIG.grenze) / skala) * 100;
    const ueber = r.ueber ? ((r.gesamt - CONFIG.grenze) / skala) * 100 : 0;
    return `
      <div class="hc-gauge" role="img" aria-label="Ihr Gesamteinkommen von ${eur(r.gesamt)} im Vergleich zur Grenze von ${eur(CONFIG.grenze)}">
        <div class="hc-gauge__spur">
          <div class="hc-gauge__fuell" data-breite="${fuell.toFixed(2)}"></div>
          <div class="hc-gauge__ueber" style="left:${marke.toFixed(2)}%" data-breite="${ueber.toFixed(2)}"></div>
          <div class="hc-gauge__marke" style="left:${marke.toFixed(2)}%"></div>
        </div>
        <div class="hc-gauge__skala">
          <span>0 €</span>
          <span class="hc-gauge__grenze" style="left:${marke.toFixed(2)}%">Grenze ${eur(CONFIG.grenze)}</span>
        </div>
      </div>`;
  };

  const orientierungHTML = (r) => {
    const o = r.orientierung;
    if (!o) {
      const sb = CONFIG.selbstbehalt + (r.verheiratet ? CONFIG.selbstbehaltEhegatte : 0);
      return `
        <h3>Was Ihnen mindestens bleibt</h3>
        <p class="hc-res__intro">Das Sozialamt darf nicht Ihr gesamtes Einkommen heranziehen. Nach der ${CONFIG.stand} bleiben Ihnen mindestens ${eur(sb)} netto im Monat${r.verheiratet ? " (für Sie und Ihren Ehepartner zusammen)" : ""}. Vom darüber liegenden Betrag bleiben Ihnen weitere ${Math.round(CONFIG.anteilBleibt * 100)} %.</p>
        <p class="hc-res__intro">Möchten Sie eine Überschlagsrechnung? Tragen Sie in Schritt 4 Ihr monatliches Nettoeinkommen ein und starten Sie die Berechnung erneut.</p>`;
    }
    const betragText = o.betrag > 0
      ? `etwa ${eur(o.betrag)} pro Monat`
      : "kein einsetzbares Einkommen";
    const zusatz = o.betrag > 0
      ? (o.gedeckelt ? "Der Betrag ist auf Ihre angegebenen ungedeckten Heimkosten begrenzt." : "Das ist der Betrag, der Ihnen nach dieser Überschlagsrechnung monatlich zugerechnet werden könnte.")
      : "Ihr Netto liegt nach dieser Überschlagsrechnung nicht über dem Selbstbehalt.";
    return `
      <h3>Orientierungsrechnung zum Unterhalt</h3>
      <p class="hc-res__intro">Auf Basis der ${CONFIG.stand}. Ein grober Richtwert, der den Einzelfall nicht abbildet.</p>
      <dl class="hc-tabelle">
        ${zeileHTML("Ihr Netto nach Kindesunterhalt", eur(o.eigenes))}
        ${o.verheiratet ? zeileHTML("Netto Ihres Ehepartners", "+ " + eur(o.partner)) : ""}
        ${o.verheiratet ? zeileHTML("Familieneinkommen", eur(o.familie)) : ""}
        ${zeileHTML("Selbstbehalt" + (o.verheiratet ? " (Familie)" : ""), "– " + eur(o.selbstbehalt))}
        ${zeileHTML("Übersteigender Betrag", eur(o.uebersteigend))}
        ${zeileHTML("Davon einsetzbar (" + Math.round((1 - CONFIG.anteilBleibt) * 100) + " %)", eur(o.einsetzbarFamilie), true)}
      </dl>
      <div class="hc-wert">
        <p class="hc-wert__zahl">${betragText.charAt(0).toUpperCase() + betragText.slice(1)}</p>
        <p class="hc-wert__text">${zusatz}</p>
      </div>`;
  };

  const schritteHTML = (r) => {
    const items = r.ueber
      ? [
          "Legen Sie Steuerbescheid, Lohnabrechnungen und Nachweise über Ihre Belastungen bereit, etwa Kredite, Altersvorsorge oder Kosten für eine selbst genutzte Immobilie.",
          "Beantworten Sie Auskunftsersuchen des Sozialamts fristgerecht. Holen Sie sich vorher Rat, zum Beispiel bei einem Fachanwalt für Familienrecht, der Verbraucherzentrale oder einem Sozialverband.",
          "Prüfen Sie mit Ihren Eltern, ob deren eigenes Vermögen und Einkommen vollständig eingesetzt wurden. Erst danach springt das Sozialamt ein.",
          "Berücksichtigen Sie, dass Sie bis zu 5 % Ihres Bruttoeinkommens für zusätzliche Altersvorsorge geltend machen können. Das senkt Ihr bereinigtes Netto."
        ]
      : [
          "Heben Sie Ihren Einkommensnachweis auf. Sie müssen nur dann Auskunft geben, wenn das Sozialamt konkrete Anhaltspunkte für ein Einkommen über der Grenze hat.",
          "Stellen Sie sicher, dass Ihre Eltern alle Leistungen beantragt haben, etwa Pflegegrad, Pflegekassenzuschüsse und Hilfe zur Pflege.",
          r.knapp
            ? "Prüfen Sie jedes Jahr neu, ob Einmalzahlungen, Boni oder Mieteinnahmen Sie über die Grenze bringen könnten."
            : "Prüfen Sie Ihre Angaben erneut, falls sich Ihr Einkommen deutlich ändert."
        ];
    return `<ol class="hc-schritte">${items.map((t) => `<li>${t}</li>`).join("")}</ol>`;
  };

  const kopiertext = (r) => {
    const kopf = r.ueber ? "Über der 100.000-Euro-Grenze" : "Unter der 100.000-Euro-Grenze";
    let t = `${kopf}\nGesamteinkommen: ${eur(r.gesamt)} (${r.ueber ? "+" : "–"} ${eur(r.abstand)} zur Grenze)\n\nRechenweg:\n`;
    t += r.zeilen.map(([l, w]) => `${l}: ${w}`).join("\n");
    if (r.orientierung) t += `\n\nOrientierungswert Unterhalt: ${eur(r.orientierung.betrag)} pro Monat`;
    return t + "\n\nOrientierung, keine Rechtsberatung.";
  };

  const rendere = (r) => {
    const titel = r.ueber ? `Sie liegen über der Grenze von ${eur(CONFIG.grenze)}` : `Sie liegen unter der Grenze von ${eur(CONFIG.grenze)}`;
    const text = r.ueber
      ? `Ihr Gesamteinkommen beträgt ${eur(r.gesamt)} und übersteigt die Grenze um ${eur(r.abstand)}. Das Sozialamt kann prüfen, ob Sie sich an den Heimkosten Ihrer Eltern beteiligen müssen. Das bedeutet nicht, dass Sie alles zahlen: Zuerst wird geprüft, wie viel Geld Ihnen für Ihre eigene Familie bleiben muss.`
      : `Ihr Gesamteinkommen beträgt ${eur(r.gesamt)} und liegt damit ${eur(r.abstand)} unter der Grenze. Das Sozialamt kann Sie dann nicht zur Zahlung für die Heimkosten Ihrer Eltern heranziehen. Die ungedeckten Kosten übernimmt der Träger der Sozialhilfe (Hilfe zur Pflege).${r.knapp ? " Sie liegen allerdings knapp unter der Grenze. Schwankungen beim Einkommen können das Ergebnis verändern." : ""}`;

    const kinderHinweis = r.ueber && r.kinder > 0 && r.kindesunterhalt === 0
      ? `<p class="hc-res__intro">Sie haben ${r.kinder} Kind${r.kinder > 1 ? "er" : ""} angegeben, aber keinen Kindesunterhalt eingetragen. Wenn Sie Unterhalt zahlen oder aufwenden, senkt das Ihren einsetzbaren Betrag.</p>`
      : "";

    ergebnis.innerHTML = `
      <article class="hc-res" id="hc_res" tabindex="-1">
        <h2 class="hc-res__aussage">${titel}</h2>
        <p class="hc-res__text">${text}</p>
        ${skalaHTML(r)}

        <h3>So wurde gerechnet</h3>
        <dl class="hc-tabelle">
          ${r.zeilen.map(([l, w]) => zeileHTML(l, w)).join("")}
          ${zeileHTML("Gesamteinkommen für die Grenze", eur(r.gesamt), true)}
        </dl>

        ${r.ueber ? orientierungHTML(r) + kinderHinweis : ""}

        <h3>Ihre nächsten Schritte</h3>
        ${schritteHTML(r)}

        <div class="hc-res__aktionen">
          <button type="button" class="button button-secondary" id="hc_kopieren">Ergebnis kopieren</button>
        </div>

        <p class="hc-res__hinweis">Diese Berechnung dient der Orientierung und ersetzt keine Rechts- oder Sozialberatung. Grundlage ist § 94 Abs. 1a SGB XII sowie die ${CONFIG.stand}. Wohnvorteile, Vermögen und weitere Belastungen können das Ergebnis im Einzelfall verändern.</p>
      </article>`;

    /* Skala animiert einblenden */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ergebnis.querySelectorAll("[data-breite]").forEach((n) => { n.style.width = n.dataset.breite + "%"; });
    }));

    const btnKopieren = el("hc_kopieren");
    btnKopieren.addEventListener("click", async () => {
      const text = kopiertext(r);
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      const alt = btnKopieren.textContent;
      btnKopieren.textContent = "Kopiert";
      setTimeout(() => { btnKopieren.textContent = alt; }, 2000);
    });

    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = el("hc_res");
    box.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: reduziert ? "auto" : "smooth", block: "start" });
  };

  /* ---------- Events ---------- */
  btnBerechnen.addEventListener("click", () => {
    if (!validiere()) return;
    rendere(berechne());
  });

  form.addEventListener("reset", () => {
    ergebnis.innerHTML = "";
    loescheFehler();
    setTimeout(aktualisiereAnsicht, 0);
  });
});