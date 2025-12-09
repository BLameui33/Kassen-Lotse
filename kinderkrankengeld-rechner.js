// kinderkrankengeld-rechner.js
// Berechnet das Netto-Kinderkrankengeld nach § 45 SGB V
// Stand: 2025 (BBG Werte geschätzt auf ~5175€/Monat bzw. 172,50€/Tag Brutto-Grenze, 70% Regel)

/* --- Hilfsfunktionen (identisch zum anderen Rechner) --- */
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
        tage: document.getElementById("kk_tage"),
        status: document.getElementById("kk_elternstatus"),
        netto: document.getElementById("kk_netto"),
        einmal: document.getElementById("kk_einmalzahlung")
    };

    const btn = document.getElementById("kk_berechnen");
    const reset = document.getElementById("kk_reset");
    const out = document.getElementById("kk_ergebnis");

    // --- BERECHNUNG ---
    btn.addEventListener("click", () => {
        out.innerHTML = ""; 

        // 1. Eingaben holen
        const days = n(inputs.tage);
        const netMonth = n(inputs.netto);
        const hasBonus = inputs.einmal.checked; // true/false

        if (days <= 0 || netMonth <= 0) {
            out.innerHTML = `<div class="warning-box" style="background:#fff3cd; color:#856404; border:1px solid #ffeeba;">Bitte gib Anzahl der Tage und dein Netto-Einkommen ein.</div>`;
            return;
        }

        // 2. Berechnungsgrundlagen
        // Kassen rechnen meist mit 30 Tagen pro Monat
        const dailyNetto = netMonth / 30;

        // Faktor: 90% ohne Einmalzahlung, 100% mit Einmalzahlung
        const factor = hasBonus ? 1.0 : 0.90;
        
        // Brutto-Kinderkrankengeld pro Tag (vor SV-Abzug)
        let grossBenefitDaily = dailyNetto * factor;

        // 3. Deckelung prüfen (Beitragsbemessungsgrenze 2025)
        // Max. 70% der BBG (BBG ca. 5100€ -> 170€/Tag -> 70% = 119€)
        // Wir setzen sicherheitshalber 120,75 € (Wert 2024, 2025 leicht höher)
        const MAX_DAILY = 120.75; 
        let isCapped = false;

        if (grossBenefitDaily > MAX_DAILY) {
            grossBenefitDaily = MAX_DAILY;
            isCapped = true;
        }

        // 4. Sozialversicherungsabzüge
        // Vom Krankengeld gehen Beiträge zur RV, ALV und PV ab. 
        // Arbeitnehmeranteil ist ca. 12,5% (variiert leicht je nach PV-Zuschlag)
        const svDeductionPercent = 0.125; // 12.5%
        const deductionDaily = grossBenefitDaily * svDeductionPercent;
        
        // Netto-Auszahlung pro Tag
        const netPayoutDaily = grossBenefitDaily - deductionDaily;

        // Gesamtsummen
        const totalPayout = netPayoutDaily * days;

        // 5. HTML Generierung
        const resultHtml = `
            <h2>Ergebnis: Kinderkrankengeld</h2>
            <div id="kk_result_card" class="pflegegrad-result-card">
                <h3>Berechnung pro Tag</h3>
                <table class="pflegegrad-tabelle">
                    <tr>
                        <td>Dein Netto (kalendertäglich)</td>
                        <td>${euro(dailyNetto)}</td>
                    </tr>
                    <tr>
                        <td>Anspruchsfaktor</td>
                        <td>${hasBonus ? "100% (wegen Einmalzahlung)" : "90% (Standard)"}</td>
                    </tr>
                    <tr>
                        <td>Brutto-Krankengeld (vor Abzügen)</td>
                        <td>${euro(grossBenefitDaily)} ${isCapped ? '<span style="font-size:0.8em; color:#d9534f;">(gedeckelt*)</span>' : ''}</td>
                    </tr>
                    <tr>
                        <td>Abzüge Sozialversicherung (ca. 12,5%)<br><span style="font-size:0.8em; color:#666;">Rente, Arbeitslose, Pflege</span></td>
                        <td>- ${euro(deductionDaily)}</td>
                    </tr>
                    <tr style="background-color:#f0f8ff;">
                        <td><strong>Netto-Auszahlung pro Tag</strong></td>
                        <td><strong>${euro(netPayoutDaily)}</strong></td>
                    </tr>
                </table>

                <h3>Gesamtsumme für ${days} Tage</h3>
                <div style="font-size: 2rem; font-weight: bold; color: #2c3e50; text-align: center; margin: 1rem 0;">
                    ${euro(totalPayout)}
                </div>
                <p style="text-align:center; margin-bottom:1.5rem;">Voraussichtliche Überweisung auf dein Konto.</p>

                <div class="warning-box">
                   <p><strong>Hinweis:</strong> Dies ist der Betrag, den die Krankenkasse zahlt. Dein Arbeitgeber zahlt für diese Tage kein Gehalt (unbezahlte Freistellung).</p>
                   ${isCapped ? '<p style="margin-top:5px; font-size:0.9em;">* Dein Einkommen ist höher als die Beitragsbemessungsgrenze, daher wurde der Höchstsatz (ca. 120 €) angesetzt.</p>' : ''}
                </div>

                <div class="button-container" style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">
                    <button id="kk_pdf_btn" class="button">📄 Als PDF speichern</button>
                </div>
                 <p class="hinweis" style="margin-top:10px;">Berechnung orientiert am § 45 SGB V. Individuelle Abzüge (z.B. Zusatzbeitrag Pflege) können variieren.</p>
            </div>
        `;

        out.innerHTML = resultHtml;
        out.scrollIntoView({ behavior: "smooth" });

        // --- PDF EXPORT (Exakt wie beim MG Rechner) ---
        setTimeout(() => {
            const pdfBtn = document.getElementById("kk_pdf_btn");
            const elementToPrint = document.getElementById("kk_result_card");

            if(pdfBtn && elementToPrint) {
                pdfBtn.addEventListener("click", () => {
                    const originalText = pdfBtn.innerText;
                    pdfBtn.innerText = "⏳ Wird erstellt...";
                    
                    const opt = {
                        margin:       [0.5, 0.5],
                        filename:     'kinderkrankengeld-berechnung.pdf',
                        image:        { type: 'jpeg', quality: 0.98 },
                        html2canvas:  { scale: 2, useCORS: false },
                        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
                    };

                    const btnContainer = elementToPrint.querySelector('.button-container');
                    if(btnContainer) btnContainer.style.display = 'none';

                    html2pdf().from(elementToPrint).set(opt).save().then(() => {
                        pdfBtn.innerText = originalText;
                        if(btnContainer) btnContainer.style.display = 'flex';
                    }).catch(err => {
                        console.error(err);
                        pdfBtn.innerText = "Fehler!";
                        if(btnContainer) btnContainer.style.display = 'flex';
                    });
                });
            }
        }, 100);
    });

    if (reset) {
        reset.addEventListener("click", () => {
            setTimeout(() => { out.innerHTML = ""; }, 50);
        });
    }
});