document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('klageSozialgerichtForm');
    const storageKey = 'klageSozialgerichtFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "geburtsdatum", "versicherungsnummer", "behoerdeName", "behoerdeAdresse", "sozialgerichtName", "sozialgerichtAdresse", "datumOriginalbescheid", "datumWiderspruchsbescheid", "aktenzeichen", "klageGegenstand", "klagebegruendung"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "geburtsdatum", "versicherungsnummer", "behoerdeName", "behoerdeAdresse", "sozialgerichtName", "sozialgerichtAdresse", "datumOriginalbescheid", "datumWiderspruchsbescheid", "aktenzeichen", "klageGegenstand", "klagebegruendung"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnKlage').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnKlage').addEventListener('click', () => {
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
        generateKlageSozialgerichtPDF(getFormData());
    });

    function generateKlageSozialgerichtPDF(data) {
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
        
        const { personName, personAdresse, geburtsdatum, versicherungsnummer, behoerdeName, behoerdeAdresse, sozialgerichtName, sozialgerichtAdresse, datumOriginalbescheid, datumWiderspruchsbescheid, aktenzeichen, klagebegruendung } = data;

        // KORREKTER Absender- und Empfängerblock für Fensterumschläge
        doc.setFontSize(9);
        doc.text(`${personName} · ${personAdresse.replace(/\n/g, ', ')}`, margin, margin - 10);
        doc.setFontSize(textFontSize);
        y = margin + 15;
        writeParagraph(sozialgerichtName);
        sozialgerichtAdresse.split("\n").forEach(line => writeParagraph(line.trim(), { extraSpacingAfter: 0 }));
        y += defaultLineHeight * 2;
        
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.text(datumHeute, pageWidth - margin - doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor, y);
        y += defaultLineHeight * 2;

        writeParagraph(`Klageschrift`, { fontSize: 14, fontStyle: "bold" });

        writeParagraph(`des/der ${personName}, geb. am ${new Date(geburtsdatum).toLocaleDateString('de-DE')}, wohnhaft ${personAdresse.replace(/\n/g, ', ')}`, { extraSpacingAfter: 2 });
        writeParagraph("- Kläger/in -", { fontStyle: "bold" });

        writeParagraph(`gegen`, { extraSpacingAfter: 2 });
        
        let behoerdeBlock = `${behoerdeName}\n${behoerdeAdresse}`;
        writeParagraph(behoerdeBlock, { extraSpacingAfter: 2 });
        writeParagraph("- Beklagte -", { fontStyle: "bold" });

        writeParagraph(`wegen: ${data.klageGegenstand || "Leistungen nach dem Sozialgesetzbuch"}`);
        
        y += defaultLineHeight;
        writeParagraph("Hiermit erhebe ich Klage und beantrage, den Bescheid der Beklagten vom " + new Date(datumOriginalbescheid).toLocaleDateString('de-DE') + " in der Gestalt des Widerspruchsbescheides vom " + new Date(datumWiderspruchsbescheid).toLocaleDateString('de-DE') + ", Aktenzeichen " + aktenzeichen + ", aufzuheben und die Beklagte zu verurteilen, mir die beantragte Leistung zu gewähren.", { fontStyle: "bold" });

        writeParagraph("Begründung:", { fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph("Die Klage ist begründet. Der angefochtene Bescheid ist rechtswidrig und verletzt mich in meinen Rechten. Die von der Beklagten getroffene Entscheidung basiert auf einer fehlerhaften Würdigung des Sachverhalts und der rechtlichen Grundlagen.");
        writeParagraph(klagebegruendung, { fontStyle: "italic" });
        writeParagraph("Eine ausführlichere Klagebegründung werde ich nach Akteneinsicht nachreichen. Ich beantrage, mir eine Frist hierfür zu gewähren.");
        
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);
        
        y += defaultLineHeight * 2;
        writeParagraph("Anlagen:\n- Kopie des Bescheides vom " + new Date(datumOriginalbescheid).toLocaleDateString('de-DE') + "\n- Kopie des Widerspruchsbescheides vom " + new Date(datumWiderspruchsbescheid).toLocaleDateString('de-DE'), {fontSize: 10, fontStyle: 'italic'});

        doc.save("Klage_Sozialgericht.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});