// mutterschaftsgeld-rechner.js
// Verbesserte Version: Berechnet exakte Tage der 3 Monate vor Schutzfrist
// Reparierter PDF-Export

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

function formatDate(d) {
    if (!d || isNaN(d.getTime())) return "–";
    const dd = ("0" + d.getDate()).slice(-2);
    const mm = ("0" + (d.getMonth() + 1)).slice(-2);
    return `${dd}.${mm}.${d.getFullYear()}`;
}

// Gibt die Anzahl der Tage in einem bestimmten Monat zurück (1-12)
function getDaysInMonth(year, monthIndexZeroBased) {
    // Tag 0 des nächsten Monats ist der letzte Tag des aktuellen Monats
    return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}

document.addEventListener("DOMContentLoaded", () => {
    const inputs = {
        vers: document.getElementById("mg_versicherung"),
        m1: document.getElementById("mg_m1"),
        m2: document.getElementById("mg_m2"),
        m3: document.getElementById("mg_m3"),
        et: document.getElementById("mg_et"),
        verl: document.getElementById("mg_verlaengerung"),
        durLabel: document.getElementById("mg_dauer_label"),
        durCustom: document.getElementById("mg_dauer_custom"),
        kkTag: document.getElementById("mg_kk_tag"),
        basMax: document.getElementById("mg_bas_max")
    };

    const btn = document.getElementById("mg_berechnen");
    const reset = document.getElementById("mg_reset");
    const out = document.getElementById("mg_ergebnis");

    // Toggle für individuelle Tage
    if (inputs.verl) {
        inputs.verl.addEventListener("change", () => {
            if (inputs.verl.value === "individuell") {
                inputs.durLabel.style.display = "block";
            } else {
                inputs.durLabel.style.display = "none";
            }
            out.innerHTML = "";
        });
    }

    // --- HAUPTFUNKTION BERECHNEN ---
    btn.addEventListener("click", () => {
        out.innerHTML = ""; // Reset Output

        // 1. Validierung
        const etStr = inputs.et.value;
        const net1 = n(inputs.m1);
        const net2 = n(inputs.m2);
        const net3 = n(inputs.m3);

        if (!etStr) {
            alert("Bitte gib zuerst den Entbindungstermin (ET) an, damit die Zeiträume berechnet werden können.");
            return;
        }
        if (net1 <= 0 && net2 <= 0 && net3 <= 0) {
            out.innerHTML = `<div class="warning-box" style="background:#fff3cd; color:#856404; border:1px solid #ffeeba;">Bitte trage mindestens ein Netto-Einkommen ein.</div>`;
            return;
        }

        // 2. Datums-Logik (Schutzfrist & Relevante Monate)
        const etDate = new Date(etStr + "T12:00:00"); // 12:00 um Zeitzonenprobleme zu vermeiden
        
        // Beginn Schutzfrist = ET - 6 Wochen (42 Tage)
        const schutzStart = new Date(etDate);
        schutzStart.setDate(etDate.getDate() - 42);

               // Bestimmung der 3 Kalendermonate VOR Beginn der Schutzfrist (nur für die Anzeige)
        const endOfRefPeriod = new Date(schutzStart.getFullYear(), schutzStart.getMonth(), 0); 
        const m3Date = new Date(endOfRefPeriod);
        const m2Date = new Date(m3Date.getFullYear(), m3Date.getMonth() - 1, 1);
        const m1Date = new Date(m3Date.getFullYear(), m3Date.getMonth() - 2, 1);

        const totalNetto = net1 + net2 + net3;

        // Namen der Monate für die Anzeige
        const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
        const refText = `${monthNames[m1Date.getMonth()]}, ${monthNames[m2Date.getMonth()]}, ${monthNames[m3Date.getMonth()]}`;

        // 3. Berechnung Tagessatz
        // Gesetz / Richtlinie: Bei Monatsgehältern wird mit pauschal 30 Tagen pro Monat gerechnet = 90 Tage.
        const totalRefDays = 90;
        const dailyNetto = totalNetto / totalRefDays;

        // 4. Mutterschutz-Dauer gesamt
        let durationDays = 98; // Standard 6+8 Wochen
        if (inputs.verl.value === "fruehling") durationDays = 126; // 6+12
        else if (inputs.verl.value === "individuell") durationDays = Math.max(1, n(inputs.durCustom));

        // Angenommenes Ende (Nur Orientierung)
        const schutzEnd = new Date(etDate);
        const weeksAfter = (inputs.verl.value === "fruehling") ? 12 : 8;
        // Bei Individuell ist das Datum schwer zu raten, wir rechnen es relativ zum Start
        if (inputs.verl.value === "individuell") {
            schutzEnd.setTime(schutzStart.getTime() + (durationDays * 24*60*60*1000));
        } else {
            schutzEnd.setDate(etDate.getDate() + (weeksAfter * 7));
        }

        // 5. Finanzielle Aufteilung
        const kkLimit = n(inputs.kkTag) || 13;
        const basLimit = n(inputs.basMax) || 210;
        
        let kkShareTotal = 0;
        let agShareTotal = 0;
        let basShare = 0;
        let note = "";

        const totalNeed = dailyNetto * durationDays;

        if (inputs.vers.value === "gesetzlich") {
            // Kasse zahlt max 13€, aber nie mehr als das tatsächliche Netto
            const kkDailyReal = Math.min(dailyNetto, kkLimit);
            const agDailyReal = Math.max(0, dailyNetto - kkDailyReal);
            
            kkShareTotal = kkDailyReal * durationDays;
            agShareTotal = agDailyReal * durationDays;
            note = "Als gesetzlich Versicherte erhältst du bis zu 13 € pro Kalendertag von der Kasse. Übersteigt dein durchschnittliches Netto diesen Betrag, zahlt der Arbeitgeber die Differenz als Zuschuss.";
        } else {
            // Privat
            basShare = Math.min(basLimit, totalNeed);
            agShareTotal = Math.max(0, totalNeed - basShare);
            note = "Privat Versicherte erhalten einmalig bis zu 210 € vom Bundesamt für Soziale Sicherung. Der Arbeitgeber zahlt die Differenz zu deinem bisherigen Netto als Zuschuss.";
        }

                // 6. Rendering HTML
        const resultHtml = `
            <h2>Dein Ergebnis</h2>
            <div id="mg_result_card" class="pflegegrad-result-card">
                <h3>Berechnungsgrundlage</h3>
                <table class="pflegegrad-tabelle">
                    <tr>
                        <td><strong>Relevanter Zeitraum</strong><br><span style="font-size:0.85em; color:#666;">(3 Monate vor Schutzfrist)</span></td>
                        <td>${refText}<br><strong>= Pauschal 90 Kalendertage*</strong></td>
                    </tr>
                    <tr>
                        <td>Summe Netto-Einkommen</td>
                        <td>${euro(totalNetto)}</td>
                    </tr>
                    <tr style="background-color:#f0f8ff;">
                        <td><strong>Ø Kalendertägl. Netto</strong></td>
                        <td><strong>${euro(dailyNetto)} / Tag</strong></td>
                    </tr>
                    <tr>
                        <td>Schutzfrist (angenommen)</td>
                        <td>${formatDate(schutzStart)} bis ${formatDate(schutzEnd)} (${durationDays} Tage)</td>
                    </tr>
                </table>

                <h3>Voraussichtliche Zahlung (Gesamtzeitraum)</h3>
                <table class="pflegegrad-tabelle">
                    <thead>
                        <tr><th>Wer zahlt?</th><th>Betrag (ca.)</th></tr>
                    </thead>
                    <tbody>
                        ${inputs.vers.value === "gesetzlich" 
                            ? `<tr><td>Krankenkasse (max. 13 €/Tag)</td><td>${euro(kkShareTotal)}</td></tr>`
                            : `<tr><td>Bundesamt (Einmalzahlung)</td><td>${euro(basShare)}</td></tr>`
                        }
                        <tr>
                            <td><strong>Arbeitgeberzuschuss</strong></td>
                            <td><strong>${euro(agShareTotal)}</strong></td>
                        </tr>
                        <tr style="font-weight:bold; border-top:2px solid #ccc;">
                            <td>Gesamtsumme (Netto)</td>
                            <td>${euro(kkShareTotal + agShareTotal + basShare)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top:1rem; padding:10px; background:#f9f9f9; border-left:4px solid #2c3e50;">
                    <p style="margin:0; font-size:0.9rem;">${note}</p>
                </div>

                <div class="button-container" style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">
                    <button id="mg_pdf_btn" class="button">📄 Ergebnis als PDF speichern</button>
                    <button id="mg_json_btn" class="button button-secondary">💾 Daten speichern (JSON)</button>
                </div>
                 <p class="hinweis" style="margin-top:10px;">
                    *Gemäß den offiziellen Richtlinien werden bei Monatsgehältern zur Ermittlung des Tagessatzes pauschal 30 Tage pro Monat (also 90 Tage) angesetzt. Alle Angaben ohne Gewähr.
                 </p>
            </div>
        `;

        out.innerHTML = resultHtml;
        out.scrollIntoView({ behavior: "smooth" });

        // --- PDF FUNKTIONALITÄT HINZUFÜGEN ---
        // Wir fügen den Listener direkt an das neu erstellte Element an
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
                }, 500);
            }

            // JSON Funktionalität
            const jsonBtn = document.getElementById("mg_json_btn");
            if(jsonBtn) {
                jsonBtn.addEventListener("click", () => {
                    const data = {
                        input: { et: etStr, net1, net2, net3, vers: inputs.vers.value },
                        result: { dailyNetto, totalRefDays, kkShareTotal, agShareTotal, total: kkShareTotal + agShareTotal + basShare }
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'mutterschaftsgeld.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
            }

        }, 100); // Kurzer Timeout, um sicherzustellen, dass DOM gerendert ist
    });

    // Reset Button
    reset.addEventListener("click", () => {
        setTimeout(() => { out.innerHTML = ""; }, 50);
    });
});