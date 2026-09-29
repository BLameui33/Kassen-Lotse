// verletztengeld-rechner.js
// Berechnungsgrundlage: § 47 SGB VII
// 80% des Regelentgelts, Regelentgelt begrenzt auf 1/360 des Höchstjahresarbeitsverdienstes (HJAV),
// Verletztengeld begrenzt auf das Nettoarbeitsentgelt.
// Abzüge: Beitragsanteil zur Renten- und Arbeitslosenversicherung.

/* --- Konstanten --- */
// Gesetzlicher Mindest-HJAV = 2 x Bezugsgröße (2026: 2 x 47.460 = 94.920 €).
// Die Satzung der jeweiligen BG kann höher sein (z. B. VBG: 120.000 €).
const HJAV_DEFAULT = 94920;

// RV 18,6 % -> Hälfte 9,3 %; ALV 2,6 % -> Hälfte 1,3 %  (Werte bitte jährlich prüfen)
const SV_SHARE = 0.106;

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

function warnBox(msg) {
    return `<div class="warning-box" style="background:#fff3cd; color:#856404; border:1px solid #ffeeba;">${msg}</div>`;
}

document.addEventListener("DOMContentLoaded", () => {
    const inputs = {
        brutto: document.getElementById("vg_brutto"),
        netto: document.getElementById("vg_netto"),
        tage: document.getElementById("vg_tage"),
        hjav: document.getElementById("vg_hjav") // optional
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
        const hjav = n(inputs.hjav) > 0 ? n(inputs.hjav) : HJAV_DEFAULT;

        if (bruttoMonat <= 0 || nettoMonat <= 0) {
            out.innerHTML = warnBox("Bitte gib dein Brutto- und Netto-Einkommen an.");
            return;
        }
        if (nettoMonat > bruttoMonat) {
            out.innerHTML = warnBox("Dein Netto kann nicht höher als dein Brutto sein. Bitte prüfe deine Eingaben.");
            return;
        }
        if (days <= 0) {
            out.innerHTML = warnBox("Bitte gib die Anzahl der Tage an, für die du Verletztengeld erhältst.");
            return;
        }

        // 2. Tagessätze (Kalendermonat = 30 Tage, § 47 Abs. 1 SGB VII i.V.m. § 47 SGB V)
        const dailyBrutto = bruttoMonat / 30;
        const dailyNetto = nettoMonat / 30;

        // 3. Deckelung: Regelentgelt maximal 1/360 des Höchstjahresarbeitsverdienstes
        const maxRegelentgelt = hjav / 360;
        let regelentgelt = dailyBrutto;
        let nettoBasis = dailyNetto;
        let isCappedAtHjav = false;

        if (dailyBrutto > maxRegelentgelt) {
            isCappedAtHjav = true;
            regelentgelt = maxRegelentgelt;
            // Nettoarbeitsentgelt bezieht sich auf das gedeckelte Regelentgelt -> proportional anpassen
            nettoBasis = dailyNetto * (maxRegelentgelt / dailyBrutto);
        }

        // 4. Verletztengeld (Brutto-Betrag): 80 % vom Regelentgelt, höchstens Nettoarbeitsentgelt
        let calcVal = regelentgelt * 0.80;
        let isCappedAtNetto = false;
        if (calcVal > nettoBasis) {
            calcVal = nettoBasis;
            isCappedAtNetto = true;
        }

        // 5. Abzüge (Sozialversicherung)
        // Der Versicherte trägt den halben Beitrag zur RV und ALV.
        // Kranken- und Pflegeversicherung: kein Abzug beim Versicherten.
        const deductionDaily = calcVal * SV_SHARE;
        const netPayoutDaily = calcVal - deductionDaily;
        const totalPayout = netPayoutDaily * days;

        // 6. HTML Generierung
        const resultHtml = `
            <h2>Ergebnis: Verletztengeld</h2>
            <div id="vg_result_card" class="pflegegrad-result-card">
                <h3>Berechnung pro Tag</h3>
                <table class="pflegegrad-tabelle">
                    <tr>
                        <td>Regelentgelt (Brutto pro Tag)
                            ${isCappedAtHjav ? `<br><span style="font-size:0.8em; color:#666;">Gedeckelt auf 1/360 des Höchstjahresarbeitsverdienstes (${euro(hjav)})</span>` : ''}
                        </td>
                        <td>${euro(regelentgelt)} ${isCappedAtHjav ? '(gedeckelt)' : ''}</td>
                    </tr>
                    <tr>
                        <td>80% vom Regelentgelt</td>
                        <td>${euro(regelentgelt * 0.80)}</td>
                    </tr>
                    <tr>
                        <td>Zum Vergleich: Dein Netto pro Tag</td>
                        <td>${euro(nettoBasis)}</td>
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

                ${isCappedAtHjav ? `
                <div class="warning-box">
                    <p><strong>Hinweis zur Deckelung:</strong> Dein Einkommen liegt über dem Höchstjahresarbeitsverdienst (${euro(hjav)}). Darüber hinausgehendes Einkommen wird nicht berücksichtigt. Den genauen Wert findest du in der Satzung deiner Berufsgenossenschaft. Er kann höher sein als der hier verwendete.</p>
                </div>` : ''}

                <div class="warning-box">
                   <p>
                     <strong>Gut zu wissen:</strong> Das Verletztengeld ist in der Regel höher als das Krankengeld (dort nur 70% vom Brutto und Abzug für Pflegeversicherung).
                     Die Auszahlung erfolgt durch deine Krankenkasse im Auftrag der BG.
                   </p>
                </div>

                <div class="button-container" style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">
                    <button id="vg_pdf_btn" class="button">📄 Als PDF speichern</button>
                </div>
                <p class="hinweis" style="margin-top:10px;">Berechnung gemäß § 47 SGB VII. Unverbindliche Schätzung, Rundungsdifferenzen möglich. Maßgeblich ist der Bescheid der BG.</p>
            </div>
        `;

        out.innerHTML = resultHtml;
        out.scrollIntoView({ behavior: "smooth" });

        // --- PDF EXPORT ---
        const pdfBtn = document.getElementById("vg_pdf_btn");
        const elementToPrint = document.getElementById("vg_result_card");

        if (pdfBtn && elementToPrint) {
            pdfBtn.addEventListener("click", () => {
                const originalText = pdfBtn.innerText;
                pdfBtn.innerText = "⏳ Wird erstellt...";

                const opt = {
                    margin: [10, 10, 10, 10], // Oben, Rechts, Unten, Links
                    filename: "verletztengeld-berechnung.pdf",
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        scrollY: 0,
                        windowWidth: document.documentElement.offsetWidth
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                // Buttons für den Druck ausblenden
                const btnContainer = elementToPrint.querySelector('.button-container');
                if (btnContainer) btnContainer.style.display = 'none';

                html2pdf().from(elementToPrint).set(opt).save().then(() => {
                    pdfBtn.innerText = originalText;
                    if (btnContainer) btnContainer.style.display = 'flex';
                }).catch(err => {
                    console.error("PDF Export Fehler:", err);
                    alert("PDF-Export fehlgeschlagen. Prüfe die Browser-Konsole für Details.");
                    pdfBtn.innerText = "Fehler!";
                    if (btnContainer) btnContainer.style.display = 'flex';
                });
            });
        }
    });

    if (reset) {
        reset.addEventListener("click", () => {
            setTimeout(() => { out.innerHTML = ""; }, 50);
        });
    }
});