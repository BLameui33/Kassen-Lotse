document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('entschuldigungForm');
    const storageKey = 'entschuldigungSchuleFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    const grundRadios = document.querySelectorAll('input[name="grund"]');
    const detailsSonstiges = document.getElementById('detailsSonstiges');
    const grundTextInput = document.getElementById('grundText');

    function toggleGrundDetails() {
        const selected = document.querySelector('input[name="grund"]:checked').value;
        detailsSonstiges.style.display = selected === 'sonstiges' ? 'block' : 'none';
        grundTextInput.required = selected === 'sonstiges';
    }
    grundRadios.forEach(radio => radio.addEventListener('change', toggleGrundDetails));
    toggleGrundDetails();

    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "einrichtungName", "einrichtungAdresse", "kindName", "klasseGruppe", "fehlzeitVon", "fehlzeitBis", "grundText"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        data.grund = document.querySelector('input[name="grund"]:checked').value;
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "einrichtungName", "einrichtungAdresse", "kindName", "klasseGruppe", "fehlzeitVon", "fehlzeitBis", "grundText"];
        ids.forEach(id => { if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id]; });
        if (data.grund) document.querySelector(`input[name="grund"][value="${data.grund}"]`).checked = true;
        toggleGrundDetails();
    }

    document.getElementById('saveBtnEntschuldigung').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnEntschuldigung').addEventListener('click', () => {
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
        generateEntschuldigungPDF(getFormData());
    });

    function generateEntschuldigungPDF(data) {
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
        
        const { personName, personAdresse, einrichtungName, einrichtungAdresse, kindName, klasseGruppe, fehlzeitVon, fehlzeitBis, grund, grundText } = data;

        // KORREKTER Absender- und Empfängerblock
        doc.setFontSize(9);
        doc.text(`${personName} · ${personAdresse.replace(/\n/g, ', ')}`, margin, margin - 10);
        doc.setFontSize(textFontSize);
        y = margin + 15;
        writeParagraph(einrichtungName);
        einrichtungAdresse.split("\n").forEach(line => writeParagraph(line.trim(), { extraSpacingAfter: 0 }));
        y += defaultLineHeight * 2;
        
        const datumHeute = new Date().toLocaleDateString("de-DE");
        doc.text(datumHeute, pageWidth - margin - doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor, y);
        y += defaultLineHeight * 2;

        writeParagraph(`Entschuldigung für das Fehlen meines Kindes ${kindName}`, { fontSize: 13, fontStyle: "bold" });

        writeParagraph("Sehr geehrte Damen und Herren,");
        
        let zeitraumText = `am ${new Date(fehlzeitVon).toLocaleDateString('de-DE')}`;
        if (fehlzeitBis && fehlzeitBis !== fehlzeitVon) {
            zeitraumText = `im Zeitraum vom ${new Date(fehlzeitVon).toLocaleDateString('de-DE')} bis einschließlich ${new Date(fehlzeitBis).toLocaleDateString('de-DE')}`;
        }

        let grundString = "aufgrund einer Erkrankung";
        if (grund === 'sonstiges') {
            grundString = `aus folgendem Grund: ${grundText}`;
        }

        writeParagraph(`hiermit entschuldige ich das Fehlen meines Kindes, ${kindName}, aus der Klasse/Gruppe ${klasseGruppe}, ${zeitraumText}.`);
        writeParagraph(`Grund für das Fehlen ist ${grundString}.`);
        writeParagraph("Ich bitte Sie, das Fehlen zu entschuldigen.");
        
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);

        doc.save("Entschuldigung_Schule_Kita.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});