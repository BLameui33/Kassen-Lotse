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

        // KORREKTER Absender- und Empfängerblock
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