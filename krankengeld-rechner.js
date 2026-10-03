// kg-rechner.js: Krankengeld der gesetzlichen Krankenversicherung (Stand 2026)
// Benötigt hc-rechner.css (gemeinsame Styles) und optional html2pdf.js für den PDF-Export.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("kg-form");
  const out = document.getElementById("kg_ergebnis");
  const btn = document.getElementById("kg_berechnen");
  if (!form || !out || !btn) return;

  /* Jährlich prüfen und anpassen */
  const CONFIG = {
    jahr: 2026,
    bbgMonat: 5812.5,                 // Beitragsbemessungsgrenze Krankenversicherung
    hoechstTag: 135.63,               // 70 % von 193,75 € (BBG geteilt durch 30)
    anteilBrutto: 0.7,
    anteilNetto: 0.9,
    svBasisAnteil: 0.8,               // Beiträge auf 80 % des Regelentgelts, höchstens Netto
    rv: 0.093,                        // Arbeitnehmeranteil Rentenversicherung
    alv: 0.013,                       // Arbeitnehmeranteil Arbeitslosenversicherung
    pv: 0.018,                        // Arbeitnehmeranteil Pflegeversicherung
    pvKinderlosZuschlag: 0.006,
    pvAbschlagProKind: 0.0025,        // ab dem 2. Kind, bis max. 4 Abschläge
    maxTageKrankengeld: 504,          // 78 Wochen (546 Tage) minus 6 Wochen Entgeltfortzahlung
    entgeltfortzahlungTage: 42
  };

  const euro = (v) => (Number.isFinite(v) ? v : 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const prozent = (v) => (v * 100).toFixed(1).replace(".", ",") + " %";
  const el = (id) => document.getElementById(id);
  const raw = (id) => (el(id) ? el(id).value.trim() : "");
  const num = (id) => {
    const v = parseFloat(raw(id).replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  };

  /* Sozialabgaben-Satz nach Kinderstatus */
  const svSatz = (status) => {
    let pv = CONFIG.pv;
    if (status === "ohne") pv += CONFIG.pvKinderlosZuschlag;
    const kinderAbschlag = { k2: 1, k3: 2, k4: 3, k5: 4 }[status] || 0;
    pv -= CONFIG.pvAbschlagProKind * kinderAbschlag;
    return CONFIG.rv + CONFIG.alv + pv;
  };

  const live = el("kg_abzug_live");
  const aktualisiereLive = () => {
    live.innerHTML = `Ihr Abzug vom Krankengeld: <strong>ca. ${prozent(svSatz(el("kg_kinderstatus").value))}</strong> (Rente, Arbeitslosen- und Pflegeversicherung).`;
  };
  el("kg_kinderstatus").addEventListener("change", aktualisiereLive);
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
    if (el("kg_status").value === "privat") return true;   // keine Berechnung nötig
    const f = [];
    const brutto = num("kg_brutto");
    const netto = num("kg_netto");
    const tage = num("kg_tage");
    if (brutto <= 0) f.push(["kg_brutto", "Bitte tragen Sie Ihr monatliches Bruttogehalt ein."]);
    if (netto <= 0) f.push(["kg_netto", "Bitte tragen Sie Ihr monatliches Nettogehalt ein."]);
    if (brutto > 0 && netto > brutto) f.push(["kg_netto", "Das Netto liegt über dem Brutto. Bitte prüfen Sie beide Werte."]);
    if (tage < 1) f.push(["kg_tage", "Bitte geben Sie mindestens einen Tag an."]);
    if (tage > CONFIG.maxTageKrankengeld) f.push(["kg_tage", `Länger als ${CONFIG.maxTageKrankengeld} Tage zahlt die Kasse wegen derselben Krankheit nicht.`]);
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
    const brutto = num("kg_brutto");
    const netto = num("kg_netto");
    const tage = Math.round(num("kg_tage"));
    const status = el("kg_status").value;
    const kinderStatus = el("kg_kinderstatus").value;

    const bruttoGedeckelt = Math.min(brutto, CONFIG.bbgMonat);
    const kg70 = (CONFIG.anteilBrutto * bruttoGedeckelt) / 30;
    const kg90 = (CONFIG.anteilNetto * netto) / 30;
    const kandidaten = [
      { wert: kg70, grund: "70 % des Bruttos" },
      { wert: kg90, grund: "90 % des Nettos" },
      { wert: CONFIG.hoechstTag, grund: "Höchstsatz" }
    ];
    const begrenzt = kandidaten.reduce((a, b) => (b.wert < a.wert ? b : a));

    const kgTag = begrenzt.wert;
    const kgMonat = kgTag * 30;

    const satz = svSatz(kinderStatus);
    const svBasisMonat = Math.min(CONFIG.svBasisAnteil * bruttoGedeckelt, netto);
    const abzugMonat = Math.min(svBasisMonat * satz, kgMonat);
    const nettoMonat = kgMonat - abzugMonat;
    const nettoTag = nettoMonat / 30;

    const bruttoGesamt = kgTag * tage;
    const nettoGesamt = nettoTag * tage;
    const luecke = Math.max(0, (netto - nettoMonat) * (tage / 30));

    return { brutto, netto, tage, status, kg70, kg90, begrenzt, kgTag, kgMonat, satz, abzugMonat, nettoMonat, nettoTag,
             bruttoGesamt, nettoGesamt, luecke, anteilNetto: netto > 0 ? nettoMonat / netto : 0,
             lueckeMonat: Math.max(0, netto - nettoMonat) };
  };

  /* ---------- Darstellung ---------- */
  const zeile = (l, w, summe) =>
    `<div class="hc-tabelle__zeile${summe ? " is-summe" : ""}"><dt>${l}</dt><dd>${w}</dd></div>`;

  const kopiertext = (r) =>
    `Krankengeld ${CONFIG.jahr}\nNetto pro Monat: ${euro(r.nettoMonat)} (${euro(r.nettoTag)} pro Tag)\nBrutto pro Monat: ${euro(r.kgMonat)}\nFür ${r.tage} Tage: ${euro(r.nettoGesamt)} netto\nVerdienstlücke: ${euro(r.luecke)}\n\nOrientierung, keine Rechtsberatung.`;

  const aktionenHTML = (idPrefix) => `
    <div class="hc-res__aktionen" data-kein-pdf>
      <button type="button" class="button" id="${idPrefix}_pdf_btn">Als PDF speichern</button>
      <button type="button" class="button button-secondary" id="${idPrefix}_kopieren">Ergebnis kopieren</button>
    </div>`;

  const bindAktionen = (kopierFn, dateiname) => {
    const btnKopieren = el("kg_kopieren");
    btnKopieren.addEventListener("click", async () => {
      const t = kopierFn();
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

    const pdfBtn = el("kg_pdf_btn");
    if (typeof html2pdf === "undefined") {
      pdfBtn.hidden = true;
      return;
    }
    pdfBtn.addEventListener("click", () => {
      const karte = el("kg_res");
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
          filename: dateiname,
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
  };

  const fokus = () => {
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = el("kg_res");
    box.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: reduziert ? "auto" : "smooth", block: "start" });
  };

  /* Privat Versicherte: keine Berechnung */
  const renderePrivat = () => {
    out.innerHTML = `
      <article class="hc-res" id="kg_res" tabindex="-1">
        <h2 class="hc-res__aussage">Als Privatversicherter erhalten Sie kein gesetzliches Krankengeld</h2>
        <p class="hc-res__text">Stattdessen zahlt Ihre private Versicherung ein Krankentagegeld. Dessen Höhe und der Beginn stehen in Ihrem Vertrag. Eine allgemeine Berechnung ist deshalb nicht möglich.</p>

        <h3>Das sollten Sie in Ihrem Vertrag prüfen</h3>
        <ol class="hc-schritte">
          <li>Die vereinbarte Höhe des Tagegelds. Sie liegt oft zwischen 70 und 90 % des Nettoeinkommens.</li>
          <li>Die Karenzzeit, also ab dem wievielten Krankheitstag gezahlt wird. Üblich sind 43 Tage, wenn der Arbeitgeber sechs Wochen das Gehalt zahlt.</li>
          <li>Ob das Tagegeld an Ihr Einkommen angepasst wird, wenn dieses steigt. Ist das nicht der Fall, entsteht oft eine Lücke.</li>
          <li>Ob Krankentagegeld in Ihrem Fall steuerfrei ist. Das ist es in der Regel, wenn Sie die Beiträge selbst zahlen.</li>
        </ol>

        <p class="hc-res__hinweis">Dies ist eine allgemeine Information, keine Beratung. Maßgeblich sind Ihre Versicherungsbedingungen und der Versicherer.</p>
      </article>`;
    fokus();
  };

  const rendere = (r) => {
    const selbst = r.status === "selbst";
    const titel = `Ihr Krankengeld beträgt etwa ${euro(r.nettoMonat)} netto pro Monat`;
    const text = `Das sind rund ${Math.round(r.anteilNetto * 100)} % Ihres bisherigen Nettos, pro Tag etwa ${euro(r.nettoTag)}. Brutto zahlt die Kasse ${euro(r.kgMonat)} im Monat, davon gehen noch Sozialabgaben ab.`;

    const hinweisSelbst = selbst
      ? `<p class="hc-res__intro">Hinweis für Selbstständige: Krankengeld gibt es nur mit Wahltarif. Beginn und Höhe richten sich nach Ihrem Tarif und Ihrem Arbeitseinkommen. Diese Rechnung ist daher nur eine grobe Orientierung.</p>`
      : "";

    const wochen = r.tage / 7;
    const wochenText = (Math.round(wochen * 10) / 10).toString().replace(".", ",");

    out.innerHTML = `
      <article class="hc-res" id="kg_res" tabindex="-1">
        <h2 class="hc-res__aussage">${titel}</h2>
        <p class="hc-res__text">${text}</p>
        ${hinweisSelbst}

        <h3>So wird Ihr Krankengeld berechnet</h3>
        <dl class="hc-tabelle">
          ${zeile("70 % des Bruttos pro Tag", euro(r.kg70))}
          ${zeile("90 % des Nettos pro Tag", euro(r.kg90))}
          ${zeile("Höchstsatz " + CONFIG.jahr + " pro Tag", euro(CONFIG.hoechstTag))}
          ${zeile("Krankengeld brutto pro Tag (" + r.begrenzt.grund + ")", euro(r.kgTag))}
          ${zeile("Krankengeld brutto pro Monat (30 Tage)", euro(r.kgMonat))}
          ${zeile("Abzüge für Renten-, Arbeitslosen- und Pflegeversicherung (ca. " + prozent(r.satz) + " auf die Beitragsbasis)", "– " + euro(r.abzugMonat))}
          ${zeile("Krankengeld netto pro Monat", euro(r.nettoMonat), true)}
        </dl>

        <h3>Was Ihnen im Vergleich zum Gehalt fehlt</h3>
        <dl class="hc-tabelle">
          ${zeile("Bisheriges Netto pro Monat", euro(r.netto))}
          ${zeile("Krankengeld netto pro Monat", "– " + euro(r.nettoMonat))}
          ${zeile("Fehlbetrag pro Monat", euro(r.lueckeMonat), true)}
        </dl>
        <p class="hc-res__intro" style="margin-top:14px;">Über ${r.tage} Tage (rund ${wochenText} Wochen) erhalten Sie insgesamt etwa ${euro(r.nettoGesamt)} netto (${euro(r.bruttoGesamt)} brutto). Gegenüber Ihrem normalen Netto fehlen in diesem Zeitraum rund ${euro(r.luecke)}.</p>

        <h3>So läuft ein Krankengeldbezug ab</h3>
        <ol class="hc-schritte">
          <li>In den ersten sechs Wochen der Krankheit zahlt Ihr Arbeitgeber das volle Gehalt weiter (Entgeltfortzahlung).</li>
          <li>Ab der siebten Woche zahlt die Krankenkasse Krankengeld. Voraussetzung ist eine lückenlose Krankschreibung. Lassen Sie sich Folgebescheinigungen rechtzeitig ausstellen, am besten am letzten Tag der vorherigen.</li>
          <li>Wegen derselben Krankheit zahlt die Kasse insgesamt höchstens 78 Wochen innerhalb von drei Jahren. Die Wochen mit Gehaltsfortzahlung zählen mit.</li>
          <li>Danach endet der Anspruch (Aussteuerung). Je nach Situation kommen Arbeitslosengeld, Reha-Leistungen oder eine Erwerbsminderungsrente in Betracht. Sprechen Sie frühzeitig mit Ihrer Krankenkasse.</li>
        </ol>

        <h3>Gut zu wissen</h3>
        <p class="hc-res__intro">Krankengeld ist steuerfrei, erhöht aber über den Progressionsvorbehalt Ihren Steuersatz. Tragen Sie es in der Steuererklärung ein, damit keine Nachzahlung überrascht. Mit einer Krankentagegeld-Zusatzversicherung lässt sich der Fehlbetrag teilweise ausgleichen.</p>

        ${aktionenHTML("kg")}

        <p class="hc-res__hinweis">Berechnung nach § 47 SGB V, Stand ${CONFIG.jahr}, mit 30 Tagen pro Monat. Die tatsächliche Höhe hängt vom Regelentgelt der Kasse ab, zum Beispiel bei Einmalzahlungen, schwankendem Gehalt oder Mehrfachbeschäftigung. Dieses Ergebnis ersetzt keine Auskunft Ihrer Krankenkasse oder Lohnbuchhaltung.</p>
      </article>`;

    bindAktionen(() => kopiertext(r), "krankengeld-berechnung.pdf");
    fokus();
  };

  /* ---------- Events ---------- */
  btn.addEventListener("click", () => {
    if (!validiere()) return;
    if (el("kg_status").value === "privat") {
      renderePrivat();
    } else {
      rendere(berechne());
    }
  });

  form.addEventListener("reset", () => {
    out.innerHTML = "";
    loescheFehler();
    setTimeout(aktualisiereLive, 0);
  });
});