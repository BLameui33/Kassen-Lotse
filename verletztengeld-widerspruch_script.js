document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('verletztengeldForm');
    const storageKey = 'verletztengeldFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "geburtsdatum", "bgName", "bgAdresse", "datumBescheid", "aktenzeichen", "unfallDatum", "begruendungText"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "geburtsdatum", "bgName", "bgAdresse", "datumBescheid", "aktenzeichen", "unfallDatum", "begruendungText"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnVerletzt').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnVerletzt').addEventListener('click', () => {
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
        generateVerletztengeldPDF(getFormData());
    });

    function generateVerletztengeldPDF(data) {
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
        
        const { personName, personAdresse, geburtsdatum, bgName, bgAdresse, datumBescheid, aktenzeichen, unfallDatum, begruendungText } = data;

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

        // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (Berufsgenossenschaft)
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
        doc.line(margin, leftY + 1.5, margin + 85, Point + 1.5); 
        
        // Empfänger (Berufsgenossenschaft) platzieren
        leftY += 6; 
        doc.setFontSize(textFontSize);
        doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
        doc.text(bgName, margin, leftY);
        leftY += defaultLineHeight;
        
        bgAdresse.split("\n").forEach(line => {
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

        writeParagraph(`Widerspruch gegen Ihren Bescheid vom ${new Date(datumBescheid).toLocaleDateString('de-DE')}`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Ihr Aktenzeichen: ${aktenzeichen}`);
        writeParagraph(`Versicherte/r: ${personName}, geb. am ${new Date(geburtsdatum).toLocaleDateString('de-DE')}`);
        writeParagraph(`Arbeitsunfall vom: ${new Date(unfallDatum).toLocaleDateString('de-DE')}`);

        writeParagraph("Sehr geehrte Damen und Herren,");
        writeParagraph(`hiermit lege ich gegen Ihren oben genannten Bescheid, mit dem Sie die Zahlung des Verletztengeldes ablehnen / einstellen, fristgerecht Widerspruch ein.`);

        writeParagraph("Begründung:", { fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(begruendungText, { fontStyle: "italic" });
        
        writeParagraph("Ich beantrage daher, den angefochtenen Bescheid aufzuheben und das Verletztengeld über das von Ihnen genannte Datum hinaus bis zur Wiederherstellung meiner Arbeitsfähigkeit weiter zu gewähren.");
        writeParagraph("Eine ausführlichere Begründung behalte ich mir nach erfolgter Akteneinsicht vor.");

        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);
        
        y += defaultLineHeight * 2;
        writeParagraph("Anlage:\n- Kopien aktueller ärztlicher Berichte", {fontSize: 10, fontStyle: 'italic'});

        doc.save("Widerspruch_Verletztengeld.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});