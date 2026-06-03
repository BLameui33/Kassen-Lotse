document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('akteneinsichtForm');
    const storageKey = 'akteneinsichtFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "geburtsdatum", "behoerdeName", "behoerdeAdresse", "aktenzeichen", "gegenstand"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "geburtsdatum", "behoerdeName", "behoerdeAdresse", "aktenzeichen", "gegenstand"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnAkte').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnAkte').addEventListener('click', () => {
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
        generateAkteneinsichtPDF(getFormData());
    });

    function generateAkteneinsichtPDF(data) {
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
        
        const { personName, personAdresse, geburtsdatum, behoerdeName, behoerdeAdresse, aktenzeichen, gegenstand } = data;

       // ==========================================
        // --- UNIFORMER BRIEFKOPF START ---
        // ==========================================
        
        // 1. RECHTER BLOCK: Haupt-Absenderblock (Name & Adresse oben rechts)
        const rightColumnX = pageWidth - margin - 60; 
        let rightY = margin;
        
        doc.setFontSize(10);
        doc.setFont(undefined, "bold");
        doc.text("Absender:", rightColumnX, rightY);
        rightY += 5;
        
        doc.setFont(undefined, "normal");
        doc.text(personName, rightColumnX, rightY);
        rightY += defaultLineHeight;
        
        personAdresse.split("\n").forEach(line => {
            doc.text(line.trim(), rightColumnX, rightY);
            rightY += defaultLineHeight;
        });

        // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (Behörde)
        let leftY = margin + 15; 
        
        // Inline-Rücksendezeile aus Personendaten generieren
        const cleanAddressInline = personAdresse.replace(/\r?\n/g, " · ");
        const ruecksendeZeile = `${personName} · ${cleanAddressInline}`;
        
        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        doc.setTextColor(120, 120, 120); // Schickes Grau
        doc.text(ruecksendeZeile, margin, leftY);
        
        // Die feine Unterstreichung für den professionellen Look
        doc.setDrawColor(180, 180, 180); 
        doc.setLineWidth(0.2);
        doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); 
        
        // Behörden-Empfängeradresse platzieren
        leftY += 6; 
        doc.setFontSize(textFontSize);
        doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
        doc.text(behoerdeName, margin, leftY);
        leftY += defaultLineHeight;
        
        behoerdeAdresse.split("\n").forEach(line => {
            doc.text(line.trim(), margin, leftY);
            leftY += defaultLineHeight;
        });

        // 3. DATUM: Rechtsbündig unterhalb beider Blöcke platziert
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.setFontSize(textFontSize);
        const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
        
        // Berechnet dynamisch das Maximum, falls die Behörde oder der Absender mal länger wird
        let datumY = Math.max(leftY, rightY) + 5; 
        doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

        // Dynamischer Startwert für den nachfolgenden Betreff
        y = datumY + 12;

        // ==========================================
        // --- UNIFORMER BRIEFKOPF ENDE ---
        // ==========================================

        writeParagraph(`Antrag auf Akteneinsicht gemäß § 25 SGB X`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Ihr Zeichen / Aktenzeichen: ${aktenzeichen}`);
        writeParagraph(`Verfahren: ${gegenstand}`);
        writeParagraph(`Antragsteller/in: ${personName}, geb. am ${new Date(geburtsdatum).toLocaleDateString('de-DE')}`);

        writeParagraph("Sehr geehrte Damen und Herren,");
        writeParagraph("in dem oben genannten Verwaltungsverfahren beantrage ich als Beteiligter gemäß § 25 Abs. 1 SGB X die Einsicht in die das Verfahren betreffenden Akten.");

        writeParagraph("Ich beantrage, mir die vollständige Verwaltungsakte in Kopie an meine oben genannte Anschrift zu übersenden. Die anfallenden Kosten für die Anfertigung der Kopien in angemessener Höhe werde ich selbstverständlich übernehmen.");
        writeParagraph("Sollte eine Übersendung von Kopien nicht möglich sein, bitte ich um die Unterbreitung von Terminvorschlägen zur Einsichtnahme in Ihren Diensträumen.");
        writeParagraph("Ich bitte um eine Bestätigung über den Eingang dieses Antrags und um eine zeitnahe Bearbeitung.");
        
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);

        doc.save("Antrag_Akteneinsicht.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});