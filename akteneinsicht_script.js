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

        // KORREKTER Absender- und Empfängerblock
        doc.setFontSize(9);
        doc.text(`${personName} · ${personAdresse.replace(/\n/g, ', ')}`, margin, margin - 10);
        doc.setFontSize(textFontSize);
        y = margin + 15;
        writeParagraph(behoerdeName);
        behoerdeAdresse.split("\n").forEach(line => writeParagraph(line.trim(), { extraSpacingAfter: 0 }));
        y += defaultLineHeight * 2;
        
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.text(datumHeute, pageWidth - margin - doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor, y);
        y += defaultLineHeight * 2;

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