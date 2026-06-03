document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('untaetigkeitsklageForm');
    const storageKey = 'untaetigkeitsklageFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "geburtsdatum", "behoerdeName", "behoerdeAdresse", "sozialgerichtName", "sozialgerichtAdresse", "datumVorgang", "aktenzeichen", "gegenstand"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        data.vorgangArt = document.querySelector('input[name="vorgangArt"]:checked')?.value;
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "geburtsdatum", "behoerdeName", "behoerdeAdresse", "sozialgerichtName", "sozialgerichtAdresse", "datumVorgang", "aktenzeichen", "gegenstand"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
        if (data.vorgangArt) document.querySelector(`input[name="vorgangArt"][value="${data.vorgangArt}"]`).checked = true;
    }

    document.getElementById('saveBtnUntaetig').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnUntaetig').addEventListener('click', () => {
        const data = localStorage.getItem(storageKey);
        if(data) populateForm(JSON.parse(data));
    });
    document.getElementById('closePopupBtn').addEventListener('click', () => spendenPopup.style.display = 'none');

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!form.checkValidity()) {
            alert("Bitte füllen Sie alle erforderlichen Felder aus.");
            form.reportValidity();
            return;
        }
        generateUntaetigkeitsklagePDF(getFormData());
    });

    function generateUntaetigkeitsklagePDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const margin = 25;
        const textFontSize = 11;
        const defaultLineHeight = 7;
        let y = margin;
        const pageWidth = doc.internal.pageSize.getWidth();

        function writeParagraph(text, options = {}) {
            const paragraphLineHeight = options.lineHeight || defaultLineHeight;
            const paragraphFontSize = options.fontSize || textFontSize;
            const fontStyle = options.fontStyle || "normal";
            const extraSpacing = options.extraSpacingAfter === undefined ? 4 : options.extraSpacingAfter;
            doc.setFontSize(paragraphFontSize);
            doc.setFont("times", fontStyle);
            const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
            lines.forEach(line => {
                if (y + paragraphLineHeight > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
                doc.text(line, margin, y);
                y += paragraphLineHeight;
            });
            if (lines.length > 0) y += extraSpacing;
        }
        
        const { personName, personAdresse, geburtsdatum, behoerdeName, behoerdeAdresse, sozialgerichtName, sozialgerichtAdresse, vorgangArt, datumVorgang, aktenzeichen, gegenstand } = data;

        // ==========================================
        // --- UNIFORMER BRIEFKOPF START ---
        // ==========================================
        
        // 1. RECHTER BLOCK: Haupt-Absenderblock (Oben rechts)
        const rightColumnX = pageWidth - margin - 60; // Startpunkt rechts (ca. 130mm)
        let rightY = margin;
        
        doc.setFont(undefined, "bold");
        doc.setFontSize(10);
        doc.text("Absender:", rightColumnX, rightY);
        rightY += 5;
        
        doc.setFont(undefined, "normal");
        doc.setFontSize(textFontSize);
        doc.text(personName, rightColumnX, rightY);
        rightY += defaultLineHeight;
        
        personAdresse.split("\n").forEach(line => {
            doc.text(line.trim(), rightColumnX, rightY);
            rightY += defaultLineHeight;
        });

        // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (Sozialgericht)
        let leftY = margin + 15; 
        
        // Inline-Rücksendezeile generieren
        const cleanAddressInline = personAdresse.replace(/\r?\n/g, " · ");
        const ruecksendeZeile = `${personName} · ${cleanAddressInline}`;
        
        doc.setFont(undefined, "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120); // Dezentes Grau
        doc.text(ruecksendeZeile, margin, leftY);
        
        // Die feine Trennlinie unter dem Mini-Absender
        doc.setDrawColor(180, 180, 180); 
        doc.setLineWidth(0.2);
        doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); 
        
        // Sozialgericht-Empfängeradresse platzieren
        leftY += 6; 
        doc.setFontSize(textFontSize);
        doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
        doc.text(sozialgerichtName, margin, leftY);
        leftY += defaultLineHeight;
        
        sozialgerichtAdresse.split("\n").forEach(line => {
            doc.text(line.trim(), margin, leftY);
            leftY += defaultLineHeight;
        });

        // 3. DATUM: Rechtsbündig unterhalb der Blöcke platziert
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.setFontSize(textFontSize);
        const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
        
        let datumY = Math.max(leftY, rightY) + 5; 
        doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

        // Dynamischer Startwert für den nachfolgenden Haupttext
        y = datumY + 12;

        // ==========================================
        // --- UNIFORMER BRIEFKOPF ENDE ---
        // ==========================================

        writeParagraph(`Untätigkeitsklage gemäß § 88 SGG`, { fontSize: 14, fontStyle: "bold" });

        writeParagraph(`des/der ${personName}, geb. am ${new Date(geburtsdatum).toLocaleDateString('de-DE')}, wohnhaft ${personAdresse.replace(/\n/g, ', ')}`, { extraSpacingAfter: 2 });
        writeParagraph("- Kläger/in -", { fontStyle: "bold" });
        writeParagraph(`gegen`, { extraSpacingAfter: 2 });
        writeParagraph(`${behoerdeName}\n${behoerdeAdresse}`, { extraSpacingAfter: 2 });
        writeParagraph("- Beklagte -", { fontStyle: "bold" });

        const vorgangBezeichnung = vorgangArt === 'antrag' ? "meinen Antrag" : "meinen Widerspruch";
        writeParagraph(`wegen Untätigkeit bezüglich ${vorgangBezeichnung} auf ${gegenstand}.`);
        
        y += defaultLineHeight;
        writeParagraph("Hiermit erhebe ich Untätigkeitsklage gemäß § 88 Sozialgerichtsgesetz (SGG).");
        
        writeParagraph("Begründung:", { fontStyle: "bold", extraSpacingAfter: 2 });
        
        const fristMonate = vorgangArt === 'antrag' ? "sechs" : "drei";
        writeParagraph(`Ich habe am ${new Date(datumVorgang).toLocaleDateString('de-DE')} bei der Beklagten ${vorgangBezeichnung} (Aktenzeichen: ${aktenzeichen}) eingereicht. Über diesen wurde bis heute, und damit nach Ablauf der gesetzlichen Bearbeitungsfrist von ${fristMonate} Monaten, ohne zureichenden Grund sachlich nicht entschieden.`);
        writeParagraph("Ich beantrage daher, die Beklagte zu verurteilen, über meinen oben genannten Vorgang unter Beachtung der Rechtsauffassung des Gerichts zu entscheiden.");

        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);

        doc.save("Untaetigkeitsklage.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});