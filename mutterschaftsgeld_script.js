document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mutterschaftsgeldForm');
    const storageKey = 'mutterschaftsgeldFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    // Automatisches Ausfüllen von Feldern
    const personNameInput = document.getElementById('personName');
    const kontoinhaberInput = document.getElementById('kontoinhaber');
    personNameInput.addEventListener('input', () => {
        kontoinhaberInput.value = personNameInput.value;
    });
    
    const etInput = document.getElementById('et');
    const schutzfristInput = document.getElementById('schutzfristBeginn');
    etInput.addEventListener('input', () => {
        if(etInput.value) {
            const etDate = new Date(etInput.value);
            etDate.setDate(etDate.getDate() - (6 * 7)); // 6 Wochen zurück
            schutzfristInput.value = etDate.toISOString().split('T')[0];
        }
    });

    // --- Speichern & Laden ---
    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "versicherungsnummer", "geburtsdatum", "kasseName", "kasseAdresse", "et", "schutzfristBeginn", "kontoinhaber", "iban", "bic"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "versicherungsnummer", "geburtsdatum", "kasseName", "kasseAdresse", "et", "schutzfristBeginn", "kontoinhaber", "iban", "bic"];
        ids.forEach(id => {
            if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id];
        });
    }

    document.getElementById('saveBtnMutter').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnMutter').addEventListener('click', () => {
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
        generateMutterschaftsgeldPDF(getFormData());
    });

    function generateMutterschaftsgeldPDF(data) {
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
        
        const { personName, personAdresse, versicherungsnummer, geburtsdatum, kasseName, kasseAdresse, et, schutzfristBeginn, kontoinhaber, iban, bic } = data;

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

        writeParagraph(`Antrag auf Mutterschaftsgeld gemäß § 24i SGB V`, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Versicherte: ${personName}, geb. am ${new Date(geburtsdatum).toLocaleDateString('de-DE')}`);
        writeParagraph(`Versicherungsnummer: ${versicherungsnummer}`);

        writeParagraph("Sehr geehrte Damen und Herren,");
        writeParagraph(`hiermit beantrage ich die Zahlung von Mutterschaftsgeld für die Dauer der Schutzfristen.`);
        writeParagraph(`Der errechnete Entbindungstermin ist der ${new Date(et).toLocaleDateString('de-DE')}. Meine Mutterschutzfrist beginnt voraussichtlich am ${new Date(schutzfristBeginn).toLocaleDateString('de-DE')}.`);
        writeParagraph("Das erforderliche 'Zeugnis über den mutmaßlichen Tag der Entbindung' liegt diesem Schreiben im Original bei.");
        
        writeParagraph("Bitte überweisen Sie die Leistungen auf folgendes Konto:", { extraSpacingAfter: 2 });
        let bankDetails = `Kontoinhaber: ${kontoinhaber}\nIBAN: ${iban}`;
        if (bic) bankDetails += `\nBIC: ${bic}`;
        writeParagraph(bankDetails);

        writeParagraph("Ich bitte um eine schriftliche Bestätigung über den Eingang meines Antrags.");
        
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);
        
        y += defaultLineHeight * 2;
        writeParagraph("Anlage:\n- Zeugnis über den mutmaßlichen Tag der Entbindung (Original)", {fontSize: 10, fontStyle: 'italic'});

        doc.save("Antrag_Mutterschaftsgeld.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});