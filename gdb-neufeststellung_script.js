document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('gdbNeufeststellungForm');
    const storageKey = 'gdbNeufeststellungFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "geburtsdatum", "aktenzeichenGdB", "amtName", "amtAdresse", "begruendungText", "aerzteListe"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "geburtsdatum", "aktenzeichenGdB", "amtName", "amtAdresse", "begruendungText", "aerzteListe"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnGdB').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnGdB').addEventListener('click', () => {
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
        generateGdbNeufeststellungPDF(getFormData());
    });

    function generateGdbNeufeststellungPDF(data) {
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
        
        const { personName, personAdresse, geburtsdatum, aktenzeichenGdB, amtName, amtAdresse, begruendungText, aerzteListe } = data;

        // KORREKTER Absender- und Empfängerblock
        doc.setFontSize(9);
        doc.text(`${personName} · ${personAdresse.replace(/\n/g, ', ')}`, margin, margin - 10);
        doc.setFontSize(textFontSize);
        y = margin + 15;
        writeParagraph(amtName);
        amtAdresse.split("\n").forEach(line => writeParagraph(line.trim(), { extraSpacingAfter: 0 }));
        y += defaultLineHeight * 2;
        
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.text(datumHeute, pageWidth - margin - doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor, y);
        y += defaultLineHeight * 2;

        writeParagraph(`Antrag auf Neufeststellung des Grades der Behinderung (GdB) und ggf. von Merkzeichen`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Antragsteller/in: ${personName}, geb. am ${new Date(geburtsdatum).toLocaleDateString('de-DE')}`);
        writeParagraph(`Aktenzeichen: ${aktenzeichenGdB}`);

        writeParagraph("Sehr geehrte Damen und Herren,");
        writeParagraph("hiermit beantrage ich die Neufeststellung meines Grades der Behinderung (GdB) sowie die Zuerkennung von Merkzeichen gemäß § 152 SGB IX.");
        
        writeParagraph("Begründung:", { fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph("Seit der letzten Feststellung durch Ihr Haus hat sich mein Gesundheitszustand wesentlich und dauerhaft verschlechtert. Dies begründe ich wie folgt:");
        writeParagraph(begruendungText, { fontStyle: "italic", extraSpacingAfter: defaultLineHeight });
        
        writeParagraph("Zur ärztlichen Beurteilung können Sie Befundberichte bei den folgenden, von mir behandelnden Ärzten und Kliniken anfordern:", { fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(aerzteListe);

        writeParagraph("Ich entbinde die genannten Ärzte und medizinischen Einrichtungen hiermit vollumfänglich von ihrer Schweigepflicht, damit Sie die notwendigen medizinischen Unterlagen anfordern können.");
        writeParagraph("Bitte senden Sie mir die offiziellen Antragsformulare zu, falls dieses formlose Schreiben für die weitere Bearbeitung nicht ausreicht.");
        
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);

        doc.save("Antrag_Neufeststellung_GdB.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});