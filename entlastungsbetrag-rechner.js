/**
 * Entlastungsbetrag-Rechner (131 €) & PDF-Generator (Native jsPDF Version)
 * Berechnet das Restbudget unter Berücksichtigung des 30. Juni Verfallsdatums.
 * Generiert ein Erstattungsformular für die Pflegekasse.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Buttons und Container
    const btnBerechnen = document.getElementById('eb_berechnen');
    const btnReset = document.getElementById('eb_reset');
    const ergebnisContainer = document.getElementById('eb_ergebnis');
    // pdfTemplate im DOM wird nicht mehr benötigt, wir bauen es nativ

    // Event Listener
    btnBerechnen.addEventListener('click', berechneUndGeneriere);
    
    btnReset.addEventListener('click', () => {
        ergebnisContainer.innerHTML = '';
    });

    function berechneUndGeneriere() {
        // --- 1. DATEN AUSLESEN UND BERECHNEN ---
        const pgMonatInput = document.getElementById('eb_pg_monat').value;
        let restVorjahr = parseFloat(document.getElementById('eb_rest_vorjahr').value) || 0;
        const ausgegebenJahr = parseFloat(document.getElementById('eb_ausgegeben_jahr').value) || 0;

        if (!pgMonatInput) {
            zeigeFehler('Bitte geben Sie an, seit wann der Pflegegrad besteht (Monat/Jahr).');
            return;
        }

        const heute = new Date();
        const aktuellesJahr = heute.getFullYear(); 
        const aktuellerMonat = heute.getMonth() + 1; 

        const [pgJahrStr, pgMonatStr] = pgMonatInput.split('-');
        const pgJahr = parseInt(pgJahrStr, 10);
        const pgMonat = parseInt(pgMonatStr, 10);

        if (pgJahr > aktuellesJahr || (pgJahr === aktuellesJahr && pgMonat > aktuellerMonat)) {
            zeigeFehler('Das angegebene Datum liegt in der Zukunft. Bitte korrigieren.');
            return;
        }

        // Berechnen, wie viele Monate im AKTUELLEN Jahr Anspruch besteht
        let monateDiesesJahr = 0;
        if (pgJahr < aktuellesJahr) {
            monateDiesesJahr = aktuellerMonat;
        } else {
            monateDiesesJahr = aktuellerMonat - pgMonat + 1;
        }

        // Budget für dieses Jahr berechnen (131 € ab 2025, wir nehmen pauschal 131)
        const budgetDiesesJahr = monateDiesesJahr * 131.00;

        // Verfalls-Logik (30. Juni)
        let verfallsWarnung = '';
        if (restVorjahr > 0) {
            if (aktuellerMonat <= 6) {
                verfallsWarnung = `
                    <div class="info-box ergebnis-animation" style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-top: 15px;">
                        <h2 style="margin-top: 0; color: #c62828; font-size: 1.3rem;">⚠️ Alarm: Ihr Geld verfällt bald!</h2>
                        <p style="margin-bottom: 0;">Sie haben noch <strong>${restVorjahr.toFixed(2).replace('.', ',')} €</strong> aus dem Vorjahr. Dieses Geld verfällt unwiderruflich am <strong>30. Juni ${aktuellesJahr}</strong>! Reichen Sie schnellstens Rechnungen ein, um dieses Guthaben nicht zu verschenken.</p>
                    </div>
                `;
            } else {
                verfallsWarnung = `
                    <div class="info-box ergebnis-animation" style="background-color: #fff3f3; border-left: 4px solid #e53935; padding: 15px; margin-top: 15px;">
                        <h2 style="margin-top: 0; color: #c62828; font-size: 1.3rem;">❌ Vorjahres-Budget verfallen</h2>
                        <p style="margin-bottom: 0;">Ihr angegebenes Restbudget von ${restVorjahr.toFixed(2).replace('.', ',')} € aus dem Vorjahr ist am <strong>30. Juni ${aktuellesJahr} verfallen</strong> und wurde in der Berechnung auf 0 € gesetzt.</p>
                    </div>
                `;
                restVorjahr = 0; 
            }
        }

        // Gesamtes verfügbares Restbudget
        const gesamtVerfuegbar = budgetDiesesJahr + restVorjahr - ausgegebenJahr;

        // --- 2. ERGEBNIS-AUSGABE (HTML) ---
        let htmlErgebnis = '';

        if (gesamtVerfuegbar > 0) {
            htmlErgebnis += `
                <div class="info-box ergebnis-animation" style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-top: 15px;">
                    <h2 style="margin-top: 0; color: #2e7d32; font-size: 1.3rem;">✅ Ihr aktuelles Restbudget: ${gesamtVerfuegbar.toFixed(2).replace('.', ',')} €</h2>
                    <ul style="margin-bottom: 0; padding-left: 20px;">
                        <li>Angespartes Budget in ${aktuellesJahr} (bisher ${monateDiesesJahr} Monate): <strong>${budgetDiesesJahr.toFixed(2).replace('.', ',')} €</strong></li>
                        <li>Gültiges Restbudget aus dem Vorjahr: <strong>${restVorjahr.toFixed(2).replace('.', ',')} €</strong></li>
                        <li>Bereits erstattet in diesem Jahr: <strong>- ${ausgegebenJahr.toFixed(2).replace('.', ',')} €</strong></li>
                    </ul>
                </div>
            `;
        } else {
            htmlErgebnis += `
                <div class="info-box ergebnis-animation" style="background-color: #fff8e1; border-left: 4px solid #ffb300; padding: 15px; margin-top: 15px;">
                    <h2 style="margin-top: 0; color: #f57c00; font-size: 1.3rem;">💡 Budget aufgebraucht</h2>
                    <p style="margin-bottom: 0;">Nach unseren Berechnungen haben Sie Ihr aktuell verfügbares Entlastungsbudget von ${budgetDiesesJahr.toFixed(2).replace('.', ',')} € für dieses Jahr bereits vollständig ausgeschöpft oder überschritten. Im nächsten Monat kommen wieder 131 € hinzu.</p>
                </div>
            `;
        }

        htmlErgebnis += verfallsWarnung;

        // --- 3. NATIVE PDF GENERIERUNG ---
        const rechnungssumme = document.getElementById('eb_rechnungssumme').value;

        if (rechnungssumme && parseFloat(rechnungssumme) > 0) {
            htmlErgebnis += `
                <div class="info-box ergebnis-animation" style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-top: 15px;">
                    <h2 style="margin-top: 0; color: #1565c0; font-size: 1.3rem;">📄 PDF wird erstellt...</h2>
                    <p style="margin-bottom: 0;">Ihr Erstattungsantrag für die Pflegekasse über <strong>${parseFloat(rechnungssumme).toFixed(2).replace('.', ',')} €</strong> wird generiert und heruntergeladen. Bitte unterschreiben Sie das Dokument und legen Sie die Originalrechnungen bei.</p>
                </div>
            `;
            
            ergebnisContainer.innerHTML = htmlErgebnis;
            ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

            generierePDF();
        } else {
            htmlErgebnis += `
                <div class="info-box ergebnis-animation" style="background-color: #f5f5f5; border-left: 4px solid #9e9e9e; padding: 15px; margin-top: 15px;">
                    <p style="margin-bottom: 0;"><em>Tipp: Wenn Sie im Formular eine Rechnungssumme eingeben, können Sie hier direkt ein fertiges Erstattungsformular für die Pflegekasse als PDF herunterladen.</em></p>
                </div>
            `;
            ergebnisContainer.innerHTML = htmlErgebnis;
            ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function generierePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const vorname = document.getElementById('eb_vorname').value.trim() || '___________________';
        const nachname = document.getElementById('eb_nachname').value.trim() || '___________________';
        const kasse = document.getElementById('eb_kasse').value.trim() || '___________________';
        const versicherungsnummer = document.getElementById('eb_versicherungsnummer').value.trim() || '___________________';
        const rechnungssumme = parseFloat(document.getElementById('eb_rechnungssumme').value).toFixed(2).replace('.', ',');
        const iban = document.getElementById('eb_iban').value.trim() || '__________________________________';
        
        const heute = new Date();
        const datumStr = formatiereDatum(heute);

        const margin = 20;
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const usableHeight = pageHeight - margin;
        let y = margin;
        const defaultLineHeight = 6;
        const spaceAfterParagraph = 4;

        // --- Hilfswerkzeuge für das PDF ---
        function writeLine(text, currentLineHeight = defaultLineHeight, isBold = false, fontSize = 11, align = "left", color = [0,0,0]) {
            if (y + currentLineHeight > usableHeight) { doc.addPage(); y = margin; }
            doc.setFontSize(fontSize);
            doc.setFont(undefined, isBold ? "bold" : "normal");
            doc.setTextColor(color[0], color[1], color[2]);
            
            let x = margin;
            if (align === "center") {
                x = (pageWidth - doc.getTextWidth(text)) / 2;
            }
            doc.text(text, x, y);
            y += currentLineHeight;
            doc.setTextColor(0, 0, 0); 
        }

        function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = 11, options = {}) {
            const fontStyle = options.fontStyle || "normal";
            doc.setFontSize(paragraphFontSize);
            doc.setFont(undefined, fontStyle);

            const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
            for (let i = 0; i < lines.length; i++) {
                if (y + paragraphLineHeight > usableHeight) { doc.addPage(); y = margin; }
                doc.text(lines[i], margin, y);
                y += paragraphLineHeight;
            }
            if (y + (options.extraSpacingAfter || spaceAfterParagraph) > usableHeight && lines.length > 0) {
                 doc.addPage(); y = margin;
            } else if (lines.length > 0) { 
                y += (options.extraSpacingAfter || spaceAfterParagraph);
            }
        }

        // --- 1. Absender ---
        writeLine("Absender / Pflegebedürftige Person:", defaultLineHeight, true);
        writeLine(`${vorname !== '___________________' ? vorname : 'Vorname:'} ${nachname !== '___________________' ? nachname : 'Nachname:'}`);
        writeLine(`Versicherungsnummer: ${versicherungsnummer}`);
        y += 10;

        // --- 2. Empfänger ---
        writeLine("Empfänger:", defaultLineHeight, true);
        writeLine("An die Pflegekasse der");
        writeParagraph(kasse, defaultLineHeight, 11, {extraSpacingAfter: 15});

        // --- 3. Datum (Rechtsbündig) ---
        const datumText = `Datum: ${datumStr}`;
        const datumBreite = doc.getTextWidth(datumText);
        doc.text(datumText, pageWidth - margin - datumBreite, y);
        y += 15;

        // --- 4. Betreff ---
        writeParagraph("Betreff: Erstattung von Entlastungsleistungen nach § 45b SGB XI", defaultLineHeight, 14, {fontStyle: "bold", extraSpacingAfter: 8});

        // --- 5. Anrede & Text ---
        writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: 6});
        writeParagraph("hiermit beantrage ich die Erstattung meiner angefallenen Kosten für anerkannte Angebote zur Unterstützung im Alltag (Entlastungsbetrag nach § 45b SGB XI).", defaultLineHeight, 11, {extraSpacingAfter: 4});
        writeParagraph("Als Anlage übersende ich Ihnen die entsprechenden Rechnungen des zertifizierten Dienstleisters in Höhe von insgesamt:", defaultLineHeight, 11, {extraSpacingAfter: 8});

        // --- 6. Rechnungssummen-Box ---
        y += 5;
        doc.setLineWidth(0.5);
        doc.rect(margin, y, pageWidth - (2 * margin), 15); // Zeichnet einen Kasten
        y += 10; // Gehe zur vertikalen Mitte des Kastens
        writeLine(`Rechnungssumme: ${rechnungssumme} EUR`, 0, true, 14, "center");
        y += 15; // Abstand unter dem Kasten

        // --- 7. Kontoverbindung ---
        writeParagraph("Bitte erstatten Sie mir diesen Betrag aus meinem verfügbaren Entlastungsbudget (inklusive eventueller Restbudgets aus dem Vorjahr) auf folgendes Konto:", defaultLineHeight, 11, {extraSpacingAfter: 6});
        
        // Leicht eingerückt für bessere Lesbarkeit
        const originalMargin = margin;
        const indentMargin = margin + 10;
        doc.text(`Kontoinhaber: ${vorname !== '___________________' ? vorname + ' ' + nachname : '___________________'}`, indentMargin, y);
        y += defaultLineHeight;
        doc.text(`IBAN: ${iban}`, indentMargin, y);
        y += 12;

        writeParagraph("Sollte mein Budget nicht für die vollständige Erstattung ausreichen, bitte ich um Überweisung des noch verfügbaren Restbetrags.", defaultLineHeight, 11, {extraSpacingAfter: 15});

        // --- 8. Grußformel & Unterschrift ---
        writeLine("Mit freundlichen Grüßen", defaultLineHeight);
        y += 25; // Platz für handschriftliche Unterschrift
        writeLine("__________________________________");
        writeLine("(Unterschrift der pflegebedürftigen Person");
        writeLine("oder des gesetzlichen Vertreters)");
        y += 15;

        // --- 9. Anlagen ---
        writeLine("Anlagen: Originalrechnung(en)", defaultLineHeight, true, 10, "left", [100, 100, 100]); // Grau und kleiner

        // --- 10. SPEICHERN ---
        doc.save("Antrag_Entlastungsbetrag_Erstattung.pdf");
    }

    // Hilfsfunktion: Fehler anzeigen
    function zeigeFehler(msg) {
        ergebnisContainer.innerHTML = `
            <div class="info-box ergebnis-animation" style="background-color: #fff3f3; border-left: 4px solid #e53935; padding: 15px; margin-top: 15px;">
                <strong>Fehler:</strong> ${msg}
            </div>`;
    }

    // Hilfsfunktion: Datum formatiert ausgeben (DD.MM.YYYY)
    function formatiereDatum(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    }
});