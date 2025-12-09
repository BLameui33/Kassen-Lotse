// verletztengeld-rechner.js
// Berechnungsgrundlage: § 47 SGB VII
// 80% des Regelentgelts, begrenzt auf das Nettoarbeitsentgelt.
// Abzüge: Beitragsanteil zur Renten- und Arbeitslosenversicherung.

/* --- Hilfsfunktionen --- */
function n(el) { 
    if (!el) return 0; 
    const v = Number((el.value || "").toString().replace(",", ".")); 
    return Number.isFinite(v) ? v : 0; 
}

function euro(v) { 
    const x = Number.isFinite(v) ? v : 0; 
    return x.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; 
}

document.addEventListener("DOMContentLoaded", () => {
    const inputs = {
        brutto: document.getElementById("vg_brutto"),
        netto: document.getElementById("vg_netto"),
        tage: document.getElementById("vg_tage")
    };

    const btn = document.getElementById("vg_berechnen");
    const reset = document.getElementById("vg_reset");
    const out = document.getElementById("vg_ergebnis");

    // --- BERECHNUNG ---
    btn.addEventListener("click", () => {
        out.innerHTML = ""; 

        // 1. Eingaben & Validierung
        const bruttoMonat = n(inputs.brutto);
        const nettoMonat = n(inputs.netto);
        const days = n(inputs.tage);

        if (bruttoMonat <= 0 || nettoMonat <= 0) {
            out.innerHTML = `<div class="warning-box" style="background:#fff3cd; color:#856404; border:1px solid #ffeeba;">Bitte gib dein Brutto- und Netto-Einkommen an.</div>`;
            return;
        }

        // 2. Berechnung Tagessätze (Kalendertägliche Regelung / 30)
        const dailyBrutto = bruttoMonat / 30;
        const dailyNetto = nettoMonat / 30;

        // 3. Berechnung Verletztengeld (Brutto-Betrag)
        // Regel: 80% vom Regelentgelt (Brutto)
        let calcVal = dailyBrutto * 0.80;

        // Regel: Darf nicht höher sein als das Nettoarbeitsentgelt
        let isCappedAtNetto = false;
        if (calcVal > dailyNetto) {
            calcVal = dailyNetto;
            isCappedAtNetto = true;
        }

        // 4. Abzüge (Sozialversicherung)
        // Beim Verletztengeld zahlt der Versichte den halben Beitrag zur RV und ALV.
        // Kranken- und Pflegeversicherung sind beitragsfrei (anders als beim Krankengeld!)
        // Werte 2025 (geschätzt/angenommen):
        // RV: 18,6% -> Hälfte = 9,3%
        // ALV: 2,6% -> Hälfte = 1,3%
        // Summe Abzug = 10,6%
        
        const svSharePercent = 0.106; 
        const deductionDaily = calcVal * svSharePercent;
        
        // Netto-Auszahlung
        const netPayoutDaily = calcVal - deductionDaily;
        const totalPayout = netPayoutDaily * days;

        // 5. HTML Generierung
        const resultHtml = `
            <h2>Ergebnis: Verletztengeld</h2>
            <div id="vg_result_card" class="pflegegrad-result-card">
                <h3>Berechnung pro Tag</h3>
                <table class="pflegegrad-tabelle">
                    <tr>
                        <td>80% vom Brutto</td>
                        <td>${euro(dailyBrutto * 0.80)}</td>
                    </tr>
                    <tr>
                        <td>Zum Vergleich: Dein Netto</td>
                        <td>${euro(dailyNetto)}</td>
                    </tr>
                    <tr style="border-bottom:2px solid #ddd;">
                        <td><strong>Brutto-Verletztengeld</strong><br><span style="font-size:0.8em; color:#666;">(Der niedrigere Wert zählt)</span></td>
                        <td><strong>${euro(calcVal)}</strong> ${isCappedAtNetto ? '(begrenzt auf Netto)' : ''}</td>
                    </tr>
                    <tr>
                        <td>Abzüge RV & ALV (ca. 10,6%)<br><span style="font-size:0.8em; color:#666;">Kein Abzug für KV/PV!</span></td>
                        <td>- ${euro(deductionDaily)}</td>
                    </tr>
                    <tr style="background-color:#d4edda; color:#155724;">
                        <td><strong>Netto-Auszahlung pro Tag</strong></td>
                        <td><strong>${euro(netPayoutDaily)}</strong></td>
                    </tr>
                </table>

                <h3>Gesamtsumme für ${days} Tage</h3>
                <div style="font-size: 2rem; font-weight: bold; color: #2c3e50; text-align: center; margin: 1rem 0;">
                    ${euro(totalPayout)}
                </div>

                <div class="warning-box">
                   <p>
                     <strong>Gut zu wissen:</strong> Das Verletztengeld ist in der Regel höher als das Krankengeld (dort nur 70% vom Brutto und Abzug für Pflegeversicherung).
                     Die Auszahlung erfolgt durch deine Krankenkasse im Auftrag der BG.
                   </p>
                </div>

                <div class="button-container" style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">
                    <button id="vg_pdf_btn" class="button">📄 Als PDF speichern</button>
                </div>
                 <p class="hinweis" style="margin-top:10px;">Berechnung gemäß § 47 SGB VII. Rundungsdifferenzen möglich.</p>
            </div>
        `;

        out.innerHTML = resultHtml;
        out.scrollIntoView({ behavior: "smooth" });

        // --- PDF EXPORT ---
        setTimeout(() => {
            // ID des Ergebnis-Containers (Muss für jede Datei angepasst werden!)
            const resultCardId = (document.getElementById("mg_result_card") ? "mg_result_card" :
                                  document.getElementById("kk_result_card") ? "kk_result_card" : "vg_result_card");

            const pdfBtn = document.getElementById(resultCardId.replace('_result_card', '_pdf_btn'));
            const elementToPrint = document.getElementById(resultCardId);
            const filename = resultCardId.slice(0, 2) === 'mg' ? 'mutterschaftsgeld-berechnung.pdf' : 
                             resultCardId.slice(0, 2) === 'kk' ? 'kinderkrankengeld-berechnung.pdf' : 
                             'verletztengeld-berechnung.pdf';

            if(pdfBtn && elementToPrint) {
                pdfBtn.addEventListener("click", () => {
                    const originalText = pdfBtn.innerText;
                    pdfBtn.innerText = "⏳ Wird erstellt...";
                    
                    // 1. Optionen
                    const opt = {
                margin:       [10, 10, 10, 10], // Ränder: Oben, Rechts, Unten, Links
                filename:     "kinderkrankengeld-berechnung.pdf",
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { 
                    scale: 2,           // Bessere Qualität
                    useCORS: true,      // Erlaubt externe Bilder/Fonts
                    logging: true,      // Zeigt Rendering-Prozess in Konsole
                    scrollY: 0,         // WICHTIG: Ignoriert Scroll-Position
                    windowWidth: document.documentElement.offsetWidth // Stellt sicher, dass Layout passt
                },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

                    // 2. Temporäre Anpassungen für den Druck (Buttons ausblenden)
                    const btnContainer = elementToPrint.querySelector('.button-container');
                    if(btnContainer) btnContainer.style.display = 'none';

                    // 3. Ausführung des Exports
                    html2pdf().from(elementToPrint).set(opt).save().then(() => {
                        // 4. Reset nach dem Export
                        pdfBtn.innerText = originalText;
                        if(btnContainer) btnContainer.style.display = 'flex';
                    }).catch(err => {
                        console.error("PDF Export Fehler:", err);
                        alert("PDF-Export fehlgeschlagen. Prüfe die Browser-Konsole für Details.");
                        pdfBtn.innerText = "Fehler!";
                        if(btnContainer) btnContainer.style.display = 'flex';
                    });
                });
            }
        }, 500);
    });

    if (reset) {
        reset.addEventListener("click", () => {
            setTimeout(() => { out.innerHTML = ""; }, 50);
        });
    }
});