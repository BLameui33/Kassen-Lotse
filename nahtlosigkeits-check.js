/**
 * Nahtlosigkeits-Check & PDF-Generator
 * Erstellt ein rechtssicheres Anschreiben nach § 145 SGB III
 * Zeigt ein Ergebnis auf dem Bildschirm und triggert das Spenden-Popup.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Buttons und Container
    const btnBerechnen = document.getElementById('nl_berechnen');
    const btnReset = document.getElementById('nl_reset');
    const ergebnisContainer = document.getElementById('nl_ergebnis');
    
    // Popup Elemente
    const spendenPopup = document.getElementById('spendenPopupWiderspruchHH');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchHH');

    // Event Listener für Buttons
    btnBerechnen.addEventListener('click', generierePDF);
    
    btnReset.addEventListener('click', () => {
        ergebnisContainer.innerHTML = '';
    });

    // Event Listener für Popup schließen
    if (closePopupBtn && spendenPopup) {
        closePopupBtn.addEventListener('click', () => {
            spendenPopup.style.display = 'none';
        });
    }

    function generierePDF() {
        // 1. Pflichtfeld prüfen
        const aussteuerungInput = document.getElementById('nl_aussteuerung').value;
        if (!aussteuerungInput) {
            zeigeFehler('Bitte geben Sie das Datum Ihrer Aussteuerung an.');
            return;
        }

        // 2. Felder auslesen
        const vorname = document.getElementById('nl_vorname').value.trim() || '___________________';
        const nachname = document.getElementById('nl_nachname').value.trim() || '___________________';
        const strasse = document.getElementById('nl_strasse').value.trim() || '___________________';
        const plz = document.getElementById('nl_plz').value.trim() || '_______';
        const ort = document.getElementById('nl_ort').value.trim() || '___________________';
        const kundennummer = document.getElementById('nl_kundennummer').value.trim() || '___________________';
        const rehaAntragGestellt = document.getElementById('nl_reha_antrag').checked;

        // 3. Datum formatieren
        const aussteuerungDatum = formatiereDatum(new Date(aussteuerungInput));
        const heuteDatum = formatiereDatum(new Date());

        let rehaSatz = rehaAntragGestellt 
            ? 'Einen Antrag auf Leistungen zur medizinischen Rehabilitation bzw. auf Erwerbsminderungsrente habe ich bereits beim zuständigen Rentenversicherungsträger gestellt.'
            : 'Sollte ein Antrag auf medizinische Rehabilitation oder Erwerbsminderungsrente erforderlich sein, werde ich diesen selbstverständlich fristgerecht stellen, sobald ich von Ihnen im Rahmen des § 145 Abs. 2 SGB III dazu aufgefordert werde.';

        // --- 4. ERGEBNIS AUF DEM BILDSCHIRM ANZEIGEN ---
        let htmlErgebnis = `
            <div class="info-box ergebnis-animation" style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-top: 15px;">
                <h2 style="margin-top: 0; color: #2e7d32; font-size: 1.3rem;">✅ Anspruch geprüft & Anschreiben erstellt</h2>
                <ul style="margin-bottom: 15px; padding-left: 20px;">
                    <li><strong>Aussteuerungsdatum:</strong> ${aussteuerungDatum}</li>
                    <li><strong>Reha-/Rentenantrag:</strong> ${rehaAntragGestellt ? 'Bereits gestellt.' : 'Muss voraussichtlich noch gestellt werden.'}</li>
                </ul>
                <p style="margin-bottom: 0; color: #d32f2f;"><strong>📄 Ihr  PDF wird jetzt heruntergeladen!</strong></p>
            </div>
        `;
        ergebnisContainer.innerHTML = htmlErgebnis;
        ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });


        // --- 5. NEUE TAKTIK: NATIVE PURE jsPDF GENERIERUNG ---
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const margin = 20; // 2 cm Rand
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const usableHeight = pageHeight - margin;
        let y = margin;
        const defaultLineHeight = 6;
        const spaceAfterParagraph = 4;

        // Bewährte Hilfsfunktionen aus deinem anderen Script
        function writeLine(text, currentLineHeight = defaultLineHeight, isBold = false, fontSize = 11) {
            if (y + currentLineHeight > usableHeight) { doc.addPage(); y = margin; }
            doc.setFontSize(fontSize);
            doc.setFont(undefined, isBold ? "bold" : "normal");
            doc.text(text, margin, y);
            y += currentLineHeight;
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

        // --- A. Briefkopf (Absender klein) ---
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100); // Graustufe für Sichtfenster-Zeile
        const absenderZeile = `${vorname !== '___________________' ? vorname : 'Vorname'} ${nachname !== '___________________' ? nachname : 'Nachname'} · ${strasse !== '___________________' ? strasse : 'Straße'} · ${plz !== '_______' ? plz : 'PLZ'} ${ort !== '___________________' ? ort : 'Ort'}`;
        doc.text(absenderZeile, margin, y);
        y += 15;
        doc.setTextColor(0, 0, 0); // Wieder schwarz

        // --- B. Empfänger ---
        writeLine("Agentur für Arbeit", defaultLineHeight, false, 11);
        writeLine("- Leistungsabteilung -");
        writeLine("(Bitte lokale Adresse der Agentur eintragen)");
        writeLine("__________________________________");
        writeLine("__________________________________");
        y += 15;

        // --- C. Eigene Daten & Datum (Rechtsbündig) ---
        doc.setFontSize(11);
        doc.setFont(undefined, "normal");
        const kdnrText = `Kundennummer: ${kundennummer}`;
        const datumText = `${ort !== '___________________' ? ort : 'Ort'}, den ${heuteDatum}`;
        
        const kdnrBreite = doc.getStringUnitWidth(kdnrText) * 11 / doc.internal.scaleFactor;
        const datumBreite = doc.getStringUnitWidth(datumText) * 11 / doc.internal.scaleFactor;
        
        doc.text(kdnrText, pageWidth - margin - kdnrBreite, y);
        y += defaultLineHeight;
        doc.text(datumText, pageWidth - margin - datumBreite, y);
        y += 20;

        // --- D. Betreff ---
        const betreffText = "Betreff: Antrag auf Arbeitslosengeld gemäß Nahtlosigkeitsregelung (§ 145 SGB III) wegen Aussteuerung aus dem Krankengeld";
        writeParagraph(betreffText, defaultLineHeight, 12, {fontStyle: "bold", extraSpacingAfter: 12});

        // --- E. Anrede ---
        writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: 8});

        // --- F. Textkörper ---
        writeParagraph("hiermit melde ich mich arbeitslos und beantrage Arbeitslosengeld I nach der Aussteuerung aus dem Krankengeld gemäß der Nahtlosigkeitsregelung (§ 145 SGB III).", defaultLineHeight, 11, {extraSpacingAfter: 6});
        
        writeParagraph(`Mein Anspruch auf Krankengeld bei meiner zuständigen Krankenkasse endet am ${aussteuerungDatum} (Aussteuerung). Eine entsprechende Bescheinigung der Krankenkasse liegt bei bzw. wird schnellstmöglich nachgereicht.`, defaultLineHeight, 11, {extraSpacingAfter: 6});

        // WICHTIGSTER SATZ (FETT)
        writeParagraph("Ich stelle mich der Arbeitsvermittlung im Rahmen meines verbliebenen gesundheitlichen Restleistungsvermögens, welches durch Ihren Ärztlichen Dienst festzustellen ist, uneingeschränkt zur Verfügung.", defaultLineHeight, 11, {fontStyle: "bold", extraSpacingAfter: 6});

        writeParagraph(rehaSatz, defaultLineHeight, 11, {extraSpacingAfter: 6});

        writeParagraph("Bitte übersenden Sie mir die erforderlichen Antragsunterlagen sowie den Gesundheitsfragebogen und die Schweigepflichtentbindungen zur Feststellung meiner Leistungsfähigkeit durch den Ärztlichen Dienst der Bundesagentur für Arbeit.", defaultLineHeight, 11, {extraSpacingAfter: 15});

        // --- G. Grußformel & Unterschrift ---
        writeLine("Mit freundlichen Grüßen", defaultLineHeight);
        y += 25; // Viel Platz für die Unterschrift
        writeLine("__________________________________");
        writeLine("(Unterschrift)");

        // --- 6. PDF SPEICHERN & POPUP ---
        doc.save("Antrag_Nahtlosigkeit_Aussteuerung.pdf");

        if (spendenPopup) {
            setTimeout(() => {
                spendenPopup.style.display = 'flex';
            }, 1000);
        }
    }
    

    // Hilfsfunktion: Fehler anzeigen
    function zeigeFehler(msg) {
        ergebnisContainer.innerHTML = `
            <div class="info-box" style="background-color: #fff3f3; border-left: 4px solid #e53935; padding: 15px;">
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