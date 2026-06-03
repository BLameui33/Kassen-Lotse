document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('arbeitsunfallForm');
    const storageKey = 'arbeitsunfallFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "geburtsdatum", "versicherungsnummer", "arbeitgeberName", "arbeitgeberAdresse", "bgName", "bgAdresse", "unfallDatum", "unfallZeit", "unfallOrt", "unfallhergang", "verletzungArt", "zeugen", "erstarzt"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "geburtsdatum", "versicherungsnummer", "arbeitgeberName", "arbeitgeberAdresse", "bgName", "bgAdresse", "unfallDatum", "unfallZeit", "unfallOrt", "unfallhergang", "verletzungArt", "zeugen", "erstarzt"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnUnfall').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnUnfall').addEventListener('click', () => {
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
        generateArbeitsunfallPDF(getFormData());
    });

    function generateArbeitsunfallPDF(data) {
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
        
        const { personName, personAdresse, geburtsdatum, versicherungsnummer, arbeitgeberName, bgName, bgAdresse, unfallDatum, unfallZeit, unfallOrt, unfallhergang, verletzungArt, zeugen, erstarzt } = data;

        // KORREKTER Absender- und Empfängerblock
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

        // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (BG)
        let leftY = margin + 15; 
        
        // Inline-Rücksendezeile generieren
        const cleanAddressInline = personAdresse.replace(/\r?\n/g, " · ");
        const ruecksendeZeile = `${personName} · ${cleanAddressInline}`;
        
        doc.setFont(undefined, "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120); // Schickes Grau
        doc.text(ruecksendeZeile, margin, leftY);
        
        // Die feine Trennlinie
        doc.setDrawColor(180, 180, 180); 
        doc.setLineWidth(0.2);
        doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); 
        
        // BG-Empfängeradresse platzieren
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

        writeParagraph(`Meldung eines Arbeitsunfalls / Wegeunfalls gemäß § 193 SGB VII`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Versicherte/r: ${personName}, geb. am ${new Date(geburtsdatum).toLocaleDateString('de-DE')}`);
        writeParagraph(`Rentenversicherungsnummer: ${versicherungsnummer}`);
        writeParagraph(`Arbeitgeber: ${arbeitgeberName}`);

        writeParagraph("Sehr geehrte Damen und Herren,");
        writeParagraph("hiermit melde ich Ihnen den nachfolgend geschilderten Unfall und beantrage die Anerkennung als Arbeitsunfall / Wegeunfall sowie die Gewährung der gesetzlichen Leistungen.");

        writeParagraph("Unfalldaten:", { fontStyle: "bold", extraSpacingAfter: 2 });
        const unfallDetails = `Datum: ${new Date(unfallDatum).toLocaleDateString('de-DE')}\nUhrzeit: ${unfallZeit} Uhr\nUnfallort: ${unfallOrt}`;
        writeParagraph(unfallDetails);

        writeParagraph("Unfallhergang:", { fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(unfallhergang, { fontStyle: "italic" });

        writeParagraph("Verletzung:", { fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(verletzungArt, { fontStyle: "italic" });

        if (zeugen && zeugen.trim() !== "") {
            writeParagraph("Zeugen:", { fontStyle: "bold", extraSpacingAfter: 2 });
            writeParagraph(zeugen, { fontStyle: "italic" });
        }

        writeParagraph("Erstbehandlung:", { fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Die ärztliche Erstversorgung erfolgte durch:\n${erstarzt}`);
        
        writeParagraph("Ich bitte um eine Bestätigung über den Eingang dieser Meldung und um Zusendung der weiterführenden Unterlagen.");
        
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);

        doc.save("Meldung_Arbeitsunfall.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});