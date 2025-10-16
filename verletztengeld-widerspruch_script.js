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

        // KORREKTER Absender- und Empfängerblock
        doc.setFontSize(9);
        doc.text(`${personName} · ${personAdresse.replace(/\n/g, ', ')}`, margin, margin - 10);
        doc.setFontSize(textFontSize);
        y = margin + 15;
        writeParagraph(bgName);
        bgAdresse.split("\n").forEach(line => writeParagraph(line.trim(), { extraSpacingAfter: 0 }));
        y += defaultLineHeight * 2;
        
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.text(datumHeute, pageWidth - margin - doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor, y);
        y += defaultLineHeight * 2;

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