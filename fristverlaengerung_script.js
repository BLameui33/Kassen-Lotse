document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('fristverlaengerungForm');
    const storageKey = 'fristverlaengerungFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "behoerdeName", "behoerdeAdresse", "aktenzeichen", "datumSchreiben", "fristOriginal", "fristNeu"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "behoerdeName", "behoerdeAdresse", "aktenzeichen", "datumSchreiben", "fristOriginal", "fristNeu"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnFrist').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnFrist').addEventListener('click', () => {
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
        generateFristverlaengerungPDF(getFormData());
    });

    function generateFristverlaengerungPDF(data) {
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
        
        const { personName, personAdresse, behoerdeName, behoerdeAdresse, aktenzeichen, datumSchreiben, fristOriginal, fristNeu } = data;

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

        writeParagraph(`Antrag auf Fristverlängerung`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Ihr Schreiben vom: ${new Date(datumSchreiben).toLocaleDateString('de-DE')}`);
        writeParagraph(`Ihr Aktenzeichen: ${aktenzeichen}`);

        writeParagraph("Sehr geehrte Damen und Herren,");
        writeParagraph(`in Ihrem oben genannten Schreiben haben Sie mir eine Frist bis zum ${new Date(fristOriginal).toLocaleDateString('de-DE')} gesetzt.`);

        writeParagraph("Leider ist es mir nicht möglich, diese Frist einzuhalten, da ich für die sorgfältige Zusammenstellung der erforderlichen Unterlagen / für die Einholung einer fachlichen Beratung noch etwas Zeit benötige.");
        
        writeParagraph(`Ich beantrage daher höflich, die mir gesetzte Frist bis zum ${new Date(fristNeu).toLocaleDateString('de-DE')} zu verlängern.`);
        writeParagraph("Vielen Dank für Ihr Verständnis. Ich bitte um eine kurze Bestätigung.");
        
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);

        doc.save("Antrag_Fristverlaengerung.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});