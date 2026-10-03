// kk-rechner.js: Netto-Kinderkrankengeld nach § 45 SGB V (Stand 2026)
// Benötigt hc-rechner.css (gemeinsame Styles) und optional html2pdf.js für den PDF-Export.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("kk-form");
  const out = document.getElementById("kk_ergebnis");
  const btn = document.getElementById("kk_berechnen");
  if (!form || !out || !btn) return;

  /* Jährlich prüfen und anpassen */
  const CONFIG = {
    jahr: 2026,
    tageProKind: { paare: 15, allein: 30 },   // befristet bis 31.12.2026
    maxGesamt: { paare: 35, allein: 70 },
    hoechstTag: 135.63,                        // 70 % der BBG-KV: 5.812,50 € / 30 = 193,75 € -> 135,63 €
    bbgMonat: 5812.5,
    faktorNetto: 0.9,
    faktorNettoEinmal: 1.0,
    grenzeBrutto: 0.7,
    svBasisAnteil: 0.8,                        // Beiträge werden auf 80 % des Regelentgelts berechnet
    rv: 0.093,                                 // Arbeitnehmeranteil Rentenversicherung (18,6 % / 2)
    alv: 0.013,                                // Arbeitnehmeranteil Arbeitslosenversicherung (2,6 % / 2)
    pv: 0.018,                                 // Arbeitnehmeranteil Pflegeversicherung (3,6 % / 2)
    pvAbschlagProKind: 0.0025                  // ab dem 2. Kind, bis max. 4 Abschläge
  };

  const euro = (v) => (Number.isFinite(v) ? v : 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const el = (id) => document.getElementById(id);
  const raw = (id) => (el(id) ? el(id).value.trim() : "");
  const num = (id) => {
    const v = parseFloat(raw(id).replace(",", "."));
    return Number.isFinite(v) ? v : 0;
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
    if (num("kk_tage") < 1) f.push(["kk_tage", "Bitte geben Sie mindestens einen Tag an."]);
    if (num("kk_netto") <= 0) f.push(["kk_netto", "Bitte tragen Sie Ihr monatliches Netto-Einkommen ein."]);
    if (num("kk_kinder") < 1) f.push(["kk_kinder", "Bitte geben Sie mindestens ein Kind an."]);
    ["kk_bereits", "kk_brutto"].forEach((id) => {
      if (raw(id) !== "" && num(id) < 0) f.push([id, "Bitte geben Sie keinen negativen Betrag ein."]);
    });
    form.querySelectorAll('input[type="number"][max]').forEach((i) => {
      if (i.value !== "" && parseFloat(i.value) > parseFloat(i.max)) f.push([i.id, "Der Wert darf höchstens " + i.max + " betragen."]);
    });
    // doppelte Einträge je Feld vermeiden
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
    const allein = el("kk_elternstatus").value === "allein";
    const kinder = Math.max(1, Math.round(num("kk_kinder")));
    const tage = Math.round(num("kk_tage"));
    const bereits = Math.round(num("kk_bereits"));
    const einmal = el("kk_einmalzahlung").checked;
    const netto = num("kk_netto");
    const brutto = num("kk_brutto");

    /* Anspruchstage */
    const proKind = allein ? CONFIG.tageProKind.allein : CONFIG.tageProKind.paare;
    const obergrenze = allein ? CONFIG.maxGesamt.allein : CONFIG.maxGesamt.paare;
    const anspruch = Math.min(proKind * kinder, obergrenze);
    const verbleibend = Math.max(0, anspruch - bereits);
    const bezahlteTage = Math.min(tage, verbleibend);
    const ohneAnspruch = tage - bezahlteTage;

    /* Höhe pro Kalendertag */
    const nettoTag = netto / 30;
    const faktor = einmal ? CONFIG.faktorNettoEinmal : CONFIG.faktorNetto;
    const kandidaten = [{ wert: nettoTag * faktor, grund: einmal ? "100 % des Nettos" : "90 % des Nettos" }];
    let bruttoGrenzeTag = null;
    if (brutto > 0) {
      bruttoGrenzeTag = (CONFIG.grenzeBrutto * Math.min(brutto, CONFIG.bbgMonat)) / 30;
      kandidaten.push({ wert: bruttoGrenzeTag, grund: "70 % des Bruttos" });
    }
    kandidaten.push({ wert: CONFIG.hoechstTag, grund: "Höchstsatz" });
    const begrenzt = kandidaten.reduce((a, b) => (b.wert < a.wert ? b : a));
    const bruttoKkg = begrenzt.wert;

    /* Sozialversicherungsbeiträge (RV, ALV, PV) */
    const abschlaege = Math.min(Math.max(kinder - 1, 0), 4);
    const svSatz = CONFIG.rv + CONFIG.alv + (CONFIG.pv - CONFIG.pvAbschlagProKind * abschlaege);
    const svBasis = brutto > 0
      ? Math.min((CONFIG.svBasisAnteil * Math.min(brutto, CONFIG.bbgMonat)) / 30, nettoTag)
      : bruttoKkg;
    const svTag = svBasis * svSatz;
    const auszahlungTag = bruttoKkg - svTag;

    const gesamt = auszahlungTag * bezahlteTage;
    const luecke = Math.max(0, (nettoTag - auszahlungTag) * bezahlteTage);

    return { allein, kinder, tage, bereits, einmal, netto, brutto, proKind, obergrenze, anspruch, verbleibend,
             bezahlteTage, ohneAnspruch, nettoTag, faktor, bruttoGrenzeTag, begrenzt, bruttoKkg, svSatz, svTag,
             auszahlungTag, gesamt, luecke };
  };

  /* ---------- Darstellung ---------- */
  const zeile = (l, w, summe) =>
    `<div class="hc-tabelle__zeile${summe ? " is-summe" : ""}"><dt>${l}</dt><dd>${w}</dd></div>`;

  const kopiertext = (r) => {
    let t = `Kinderkrankengeld ${CONFIG.jahr}\nAuszahlung: ${euro(r.gesamt)} für ${r.bezahlteTage} Tag(e)\nPro Tag: ${euro(r.auszahlungTag)} netto\n`;
    t += `Brutto-Kinderkrankengeld pro Tag: ${euro(r.bruttoKkg)} (${r.begrenzt.grund})\n`;
    t += `Verbleibende Kinderkrankentage nach diesem Fall: ${Math.max(0, r.verbleibend - r.bezahlteTage)} von ${r.anspruch}\n`;
    return t + "\nOrientierung, keine Rechtsberatung.";
  };

  const rendere = (r) => {
    const rest = Math.max(0, r.verbleibend - r.bezahlteTage);
    const kein = r.bezahlteTage === 0;

    const titel = kein
      ? "Für diese Tage besteht kein Anspruch mehr"
      : `Sie erhalten etwa ${euro(r.gesamt)} Kinderkrankengeld`;

    let text = kein
      ? `Ihr Kontingent von ${r.anspruch} Tagen ist nach Ihren Angaben bereits ausgeschöpft. Fragen Sie bei Ihrem Arbeitgeber nach, ob er die Tage bezahlt freistellt, oder ob Urlaub oder unbezahlte Freistellung möglich ist.`
      : `Das sind rund ${euro(r.auszahlungTag)} netto pro Tag für ${r.bezahlteTage} Tag${r.bezahlteTage > 1 ? "e" : ""}. Ihr Arbeitgeber zahlt für diese Tage in der Regel kein Gehalt, die Krankenkasse überweist das Geld direkt an Sie.`;
    if (r.ohneAnspruch > 0 && !kein) {
      text += ` Für ${r.ohneAnspruch} der ${r.tage} Tage reicht Ihr Kontingent nicht mehr. Diese sind in der Summe nicht enthalten.`;
    }

    const begrenzungsZeile = r.bruttoGrenzeTag !== null
      ? zeile("Grenze 70 % des Bruttos", euro(r.bruttoGrenzeTag))
      : "";

    out.innerHTML = `
      <article class="hc-res" id="kk_res" tabindex="-1">
        <h2 class="hc-res__aussage">${titel}</h2>
        <p class="hc-res__text">${text}</p>

        ${kein ? "" : `
        <h3>So wird Ihr Tagessatz berechnet</h3>
        <dl class="hc-tabelle">
          ${zeile("Ihr Netto pro Kalendertag (Monatsnetto geteilt durch 30)", euro(r.nettoTag))}
          ${zeile("Ansatz " + Math.round(r.faktor * 100) + " % des Nettos" + (r.einmal ? " (wegen Einmalzahlung)" : ""), euro(r.nettoTag * r.faktor))}
          ${begrenzungsZeile}
          ${zeile("Höchstsatz " + CONFIG.jahr, euro(CONFIG.hoechstTag))}
          ${zeile("Brutto-Kinderkrankengeld pro Tag (" + r.begrenzt.grund + ")", euro(r.bruttoKkg))}
          ${zeile("Abzüge für Renten-, Arbeitslosen- und Pflegeversicherung (ca. " + (r.svSatz * 100).toFixed(1).replace(".", ",") + " %)", "– " + euro(r.svTag))}
          ${zeile("Netto-Auszahlung pro Tag", euro(r.auszahlungTag), true)}
        </dl>

        <h3>Was Ihnen im Vergleich zum normalen Netto fehlt</h3>
        <p class="hc-res__intro">Kinderkrankengeld ersetzt nicht das volle Gehalt. Für ${r.bezahlteTage} Tag${r.bezahlteTage > 1 ? "e" : ""} fehlen Ihnen gegenüber Ihrem üblichen Netto rund ${euro(r.luecke)}.</p>
        `}

        <h3>Ihre Kinderkrankentage ${CONFIG.jahr}</h3>
        <dl class="hc-tabelle">
          ${zeile("Anspruch (" + r.proKind + " Tage × " + r.kinder + " Kind" + (r.kinder > 1 ? "er" : "") + ", höchstens " + r.obergrenze + ")", r.anspruch + " Tage")}
          ${zeile("Bereits genommen", r.bereits + " Tage")}
          ${zeile("Dieser Krankheitsfall", r.bezahlteTage + " Tage")}
          ${zeile("Danach noch verfügbar", rest + " Tage", true)}
        </dl>
        <p class="hc-res__intro" style="margin-top:14px;">Die Tage gelten je Kind. Für ein einzelnes Kind können Sie höchstens ${r.proKind} Tage nutzen, auch wenn das Gesamtkontingent höher ist.</p>

        <h3>Ihre nächsten Schritte</h3>
        <ol class="hc-schritte">
          <li>Lassen Sie sich vom Kinderarzt die Bescheinigung für das Kinderkrankengeld ausstellen und reichen Sie diese bei Ihrer Krankenkasse ein, in der Regel auch online möglich.</li>
          <li>Informieren Sie Ihren Arbeitgeber sofort und legen Sie ihm die Bescheinigung vor. Prüfen Sie, ob Arbeitsvertrag oder Tarifvertrag eine bezahlte Freistellung vorsehen. Dann entfällt das Kinderkrankengeld für diese Tage.</li>
          <li>Kinderkrankengeld ist steuerfrei, erhöht aber über den Progressionsvorbehalt Ihren Steuersatz. Tragen Sie es in der Steuererklärung ein.</li>
          ${CONFIG.jahr === 2026 ? "<li>Planen Sie mit Blick auf 2027: Ohne neues Gesetz sinkt der Anspruch auf 10 bzw. 20 Tage pro Kind. Nicht genutzte Tage aus 2026 verfallen.</li>" : ""}
        </ol>

        <div class="hc-res__aktionen" data-kein-pdf>
          <button type="button" class="button" id="kk_pdf_btn">Als PDF speichern</button>
          <button type="button" class="button button-secondary" id="kk_kopieren">Ergebnis kopieren</button>
        </div>

        <p class="hc-res__hinweis">Berechnung nach § 45 SGB V, Stand ${CONFIG.jahr}. Orientierungswert: Die tatsächlichen Abzüge hängen von Ihrer Krankenkasse und Ihrer individuellen Beitragssituation ab (zum Beispiel Zuschlag für Kinderlose in der Pflegeversicherung). Dieses Ergebnis ersetzt keine Auskunft Ihrer Krankenkasse.</p>
      </article>`;

    /* Kopieren */
    const btnKopieren = el("kk_kopieren");
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

    /* PDF (benötigt html2pdf.js auf der Seite) */
    const pdfBtn = el("kk_pdf_btn");
    if (typeof html2pdf === "undefined") {
      pdfBtn.hidden = true;
    } else {
      pdfBtn.addEventListener("click", () => {
        const karte = el("kk_res");
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
            filename: "kinderkrankengeld-berechnung.pdf",
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
    const box = el("kk_res");
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
  });
});