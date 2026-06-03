document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('zuzahlungsbefreiungForm');
    const storageKey = 'zuzahlungsbefreiungFormData_v1';
    const spendenPopup = document.getElementById('spendenPopup');

    // --- Rechner für Belastungsgrenze ---
    const einkommenInput = document.getElementById('bruttoeinkommen');
    const chronischCheckbox = document.getElementById('chronischKrank');
    const ergebnisContainer = document.getElementById('ergebnis-container');
    const grenzeSpan = document.getElementById('belastungsgrenze');

    function calculateGrenze() {
        const einkommen = parseFloat(einkommenInput.value) || 0;
        if (einkommen === 0) {
            ergebnisContainer.style.display = 'none';
            return;
        }
        const prozentsatz = chronischCheckbox.checked ? 0.01 : 0.02;
        const grenze = einkommen * prozentsatz;
        grenzeSpan.textContent = grenze.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
        ergebnisContainer.style.display = 'block';
    }
    [einkommenInput, chronischCheckbox].forEach(el => el.addEventListener('input', calculateGrenze));

    // --- Speichern & Laden ---
    function getFormData() {
        const data = {};
        const ids = ["personName", "personAdresse", "versicherungsnummer", "geburtsdatum", "kasseName", "kasseAdresse", "bruttoeinkommen", "bereitsGezahlt"];
        ids.forEach(id => data[id] = document.getElementById(id).value);
        data.chronischKrank = chronischCheckbox.checked;
        data.antragArt = document.querySelector('input[name="antragArt"]:checked')?.value;
        return data;
    }

    function populateForm(data) {
        const ids = ["personName", "personAdresse", "versicherungsnummer", "geburtsdatum", "kasseName", "kasseAdresse", "bruttoeinkommen", "bereitsGezahlt"];
        ids.forEach(id => { if(document.getElementById(id) && data[id]) document.getElementById(id).value = data[id]; });
        if (data.chronischKrank) chronischCheckbox.checked = data.chronischKrank;
        if (data.antragArt) document.querySelector(`input[name="antragArt"][value="${data.antragArt}"]`).checked = true;
        calculateGrenze();
    }

    document.getElementById('saveBtnZuzahlung').addEventListener('click', () => localStorage.setItem(storageKey, JSON.stringify(getFormData())));
    document.getElementById('loadBtnZuzahlung').addEventListener('click', () => {
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
        generateZuzahlungsbefreiungPDF(getFormData());
    });

    function generateZuzahlungsbefreiungPDF(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const margin = 25;
        const textFontSize = 11;
        const defaultLineHeight = 7;
        let y = margin;
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- VOLLSTÄNDIGE HILFSFUNKTION ---
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
        
        const { personName, personAdresse, versicherungsnummer, geburtsdatum, kasseName, kasseAdresse, antragArt, bereitsGezahlt } = data;

        // Absender- und Empfängerblock (Variante mit personName)
    let absenderName = personName;
    let absenderAdresse = personAdresse;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF START ---
    // ==========================================
    
    // 1. RECHTER BLOCK: Haupt-Absenderblock (Oben rechts)
    const rightColumnX = pageWidth - margin - 60; // Startpunkt rechts (ca. 130mm)
    let rightY = margin;
    
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.text("Absender:", rightColumnX, rightY);
    rightY += 5;
    
    doc.setFont(undefined, "normal");
    doc.setFontSize(textFontSize);
    doc.text(absenderName, rightColumnX, rightY);
    rightY += defaultLineHeight;
    
    absenderAdresse.split("\n").forEach(line => {
        doc.text(line.trim(), rightColumnX, rightY);
        rightY += defaultLineHeight;
    });

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (Kasse)
    let leftY = margin + 15; 
    
    // Inline-Rücksendezeile generieren
    const cleanAddressInline = absenderAdresse.replace(/\r?\n/g, " · ");
    const ruecksendeZeile = `${absenderName} · ${cleanAddressInline}`;
    
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120); // Dezentes Grau
    doc.text(ruecksendeZeile, margin, leftY);
    
    // Die feine Trennlinie unter dem Mini-Absender
    doc.setDrawColor(180, 180, 180); 
    doc.setLineWidth(0.2);
    doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); 
    
    // Empfänger (Kranken-/Pflegekasse) platzieren
    leftY += 6; 
    doc.setFontSize(textFontSize);
    doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
    doc.text(kasseName, margin, leftY);
    leftY += defaultLineHeight;
    
    kasseAdresse.split("\n").forEach(line => {
        doc.text(line.trim(), margin, leftY);
        leftY += defaultLineHeight;
    });

    // 3. DATUM: Rechtsbündig unterhalb der Blöcke
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    
    // Kollisionsschutz (gleicht asymmetrische Spaltenhöhen perfekt aus)
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Inhalt
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

        let betreff = "Antrag auf ";
        if(antragArt === 'befreiung') betreff += "Befreiung von den gesetzlichen Zuzahlungen";
        if(antragArt === 'vorauszahlung') betreff += "Befreiung von den Zuzahlungen durch Vorauszahlung";
        if(antragArt === 'rueckerstattung') betreff += `Rückerstattung zu viel geleisteter Zuzahlungen für das Jahr ${new Date().getFullYear() - 1}`;
        writeParagraph(betreff, { fontSize: 13, fontStyle: "bold", extraSpacingAfter: 2 });
        writeParagraph(`Versicherte/r: ${personName}, geb. am ${new Date(geburtsdatum).toLocaleDateString('de-DE')}`);
        writeParagraph(`Versicherungsnummer: ${versicherungsnummer}`);

        writeParagraph("Sehr geehrte Damen und Herren,");

        if(antragArt === 'befreiung') {
            writeParagraph("hiermit beantrage ich die Ausstellung eines Befreiungsausweises für den Rest des laufenden Kalenderjahres.");
            writeParagraph(`Meine persönliche Belastungsgrenze gemäß § 62 SGB V habe ich mit den in diesem Jahr bereits geleisteten Zuzahlungen in Höhe von ${(parseFloat(bereitsGezahlt) || 0).toLocaleString('de-DE', {style:'currency', currency:'EUR'})} erreicht.`);
            writeParagraph("Als Nachweis lege ich diesem Schreiben die entsprechenden Zuzahlungsbelege sowie meine aktuellen Einkommensnachweise bei.");
        }
        if(antragArt === 'vorauszahlung') {
            writeParagraph("hiermit beantrage ich die Befreiung von den gesetzlichen Zuzahlungen für das laufende Kalenderjahr durch eine Vorauszahlung meiner persönlichen Belastungsgrenze gemäß § 62 SGB V.");
            writeParagraph("Bitte teilen Sie mir die exakte Höhe meiner Belastungsgrenze sowie Ihre Bankverbindung für die Überweisung mit. Als Grundlage für die Berechnung finden Sie meine aktuellen Einkommensnachweise in der Anlage.");
            writeParagraph("Ich bitte um Zusendung des Befreiungsausweises nach Zahlungseingang.");
        }
        if(antragArt === 'rueckerstattung') {
            const vergangenesJahr = new Date().getFullYear() - 1;
            writeParagraph(`hiermit beantrage ich die Rückerstattung der von mir im Kalenderjahr ${vergangenesJahr} zu viel geleisteten Zuzahlungen.`);
            writeParagraph(`Meine persönliche Belastungsgrenze wurde im vergangenen Jahr überschritten. Ich habe Zuzahlungen in Höhe von ${(parseFloat(bereitsGezahlt) || 0).toLocaleString('de-DE', {style:'currency', currency:'EUR'})} geleistet.`);
            writeParagraph("Ich bitte Sie, den zu viel gezahlten Betrag zu ermitteln und auf mein Ihnen bekanntes Konto zu erstatten. Die erforderlichen Zuzahlungsbelege und Einkommensnachweise für das Jahr " + vergangenesJahr + " liegen diesem Schreiben bei.");
        }
        
        writeParagraph("Für die Bearbeitung meines Antrags bedanke ich mich im Voraus.");
        
        y += defaultLineHeight;
        writeParagraph("Mit freundlichen Grüßen");
        y += defaultLineHeight * 4;
        writeParagraph(`(${personName})`);
        
        y += defaultLineHeight * 2;
        writeParagraph("Anlagen:\n- Kopien der Einkommensnachweise\n- Kopien der Zuzahlungsbelege", {fontSize: 10, fontStyle: 'italic'});

        doc.save("Antrag_Zuzahlungsbefreiung.pdf");

        if(spendenPopup) {
            spendenPopup.style.display = 'flex';
        }
    }
});