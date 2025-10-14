document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('kinderkrankengeldForm');
    const storageKey = 'kinderkrankengeldFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "versicherungsnummer", "kasseName", "kasseAdresse", "kindName", "kindGeburtsdatum", "zeitraumKrankheit"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "versicherungsnummer", "kasseName", "kasseAdresse", "kindName", "kindGeburtsdatum", "zeitraumKrankheit"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnKinder').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnKinder').addEventListener('click', () => {
        const data = localStorage.getItem(storageKey);
        if(data) populateForm(JSON.parse(data));
    });
    document.getElementById('closePopupBtn').addEventListener('click', () => spendenPopup.style.display = 'none');

    // --- PDF-Erstellung ---
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!form.checkValidity()) {
            alert("Bitte füllen Sie alle erforderlichen Felder aus.");
            form.reportValidity();
            return;
        }
        generateKinderkrankengeldPDF(getFormData());
    });

    function generateKinderkrankengeldPDF(data) {
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
        
        const { personName, personAdresse, versicherungsnummer, kasseName, kasseAdresse, kindName, kindGeburtsdatum, zeitraumKrankheit } = data;

        // KORREKTER Absender- und Empfängerblock
        doc.setFontSize(9);
        doc.text(`${personName} · ${personAdresse.replace(/\n/g, ', ')}`, margin, margin - 10);
        doc.setFontSize(textFontSize);
        y = margin + 15;
        writeParagraph(kasseName);
        kasseAdresse.split("\n").forEach(line => writeParagraph(line.trim(), { extraSpacingAfter: 0 }));
        y += defaultLineHeight * 2;
        
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.text(datumHeute, pageWidth - margin - doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor, y);
        y += defaultLineHeight * 2;

        writeParagraph(`Antrag auf Krankengeld bei Erkrankung eines Kindes (Kinderkrankengeld)`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Versicherte/r: ${personName}`);
        writeParagraph(`Versicherungsnummer: ${versicherungsnummer}`);

        writeParagraph("Sehr geehrte Damen und Herren,");
        writeParagraph(`hiermit beantrage ich die Zahlung von Kinderkrankengeld für die Betreuung meines erkrankten Kindes:`);
        
        const kindDetails = `- Name: ${kindName}\n- Geburtsdatum: ${new Date(kindGeburtsdatum).toLocaleDateString('de-DE')}`;
        writeParagraph(kindDetails);

        writeParagraph(`Aufgrund der Erkrankung war ich im Zeitraum vom ${zeitraumKrankheit} von der Arbeit freigestellt, um mein Kind zu betreuen und zu pflegen.`);
        writeParagraph("Die erforderliche 'Ärztliche Bescheinigung für den Bezug von Krankengeld bei Erkrankung eines Kindes' liegt diesem Schreiben im Original bei.");
        writeParagraph("Ich bitte um eine zeitnahe Bearbeitung und Überweisung der Leistung auf mein Ihnen bekanntes Konto.");
        
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);
        
        y += defaultLineHeight * 2;
        writeParagraph("Anlage:\n- Ärztliche Bescheinigung (Original)", {fontSize: 10, fontStyle: 'italic'});

        doc.save("Antrag_Kinderkrankengeld.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});