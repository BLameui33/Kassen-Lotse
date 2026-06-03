document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('fahrtkostenAntragForm');
    const saveBtn = document.getElementById('saveBtnFahrtkosten');
    const loadBtn = document.getElementById('loadBtnFahrtkosten');
    const closePopupBtn = document.getElementById('closePopupBtnFahrtkosten');
    const spendenPopup = document.getElementById('spendenPopupFahrtkosten');
    const storageKey = 'fahrtkostenAntragFormData';

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "name", "adresse", "geburt", "nummer", "telefon", 
        "kasseName", "kasseAdresse", 
        "fahrtgrund", "behandlungsortName", "behandlungsortAdresse",
        "fahrten_auflistung", "gesamtkosten",
        "iban", "bic", "kontoinhaber",
        "anlage_sonstiges_fahrtkosten" 
    ];
    // Checkbox-Namen, nicht IDs, da wir alle mit dem gleichen Namen sammeln
    const anlagenCheckboxName = "anlagen_fahrtkosten"; 

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        data.anlagen = [];
        const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]:checked`);
        anlagenCheckboxes.forEach(checkbox => {
            data.anlagen.push(checkbox.value);
        });
        return data;
    }

    function populateForm(data) {
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.value = data[id];
            }
        });
        const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
        anlagenCheckboxes.forEach(checkbox => {
            if (data.anlagen && data.anlagen.includes(checkbox.value)) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const data = getFormData();
            localStorage.setItem(storageKey, JSON.stringify(data));
            alert('Ihre Eingaben wurden im Browser gespeichert!');
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', function() {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                populateForm(JSON.parse(savedData));
                alert('Gespeicherte Eingaben wurden geladen!');
            } else {
                alert('Keine gespeicherten Daten gefunden.');
            }
        });
    }
    
    const autoLoadData = localStorage.getItem(storageKey);
    if (autoLoadData) {
        try {
            populateForm(JSON.parse(autoLoadData));
        } catch (e) {
            localStorage.removeItem(storageKey);
        }
    }

    // --- Pop-up Steuerung ---
    if (closePopupBtn && spendenPopup) {
        closePopupBtn.addEventListener('click', function() {
            spendenPopup.style.display = 'none';
        });
    }
    
    // --- PDF Generierung bei Formular-Submit ---
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            generateFahrtkostenAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateFahrtkostenAntragPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 2;

    function writeLine(text, currentLineHeight = defaultLineHeight, isBold = false, fontSize = 11) {
        if (y + currentLineHeight > usableHeight) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont(undefined, isBold ? "bold" : "normal");
        doc.text(text, margin, y);
        y += currentLineHeight;
    }

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = 11, options = {}) {
        const fontStyle = options.fontStyle || "normal";
        doc.setFontSize(paragraphFontSize);
        doc.setFont(undefined, fontStyle);
        const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
        for (let i = 0; i < lines.length; i++) {
            if (y + paragraphLineHeight > usableHeight) { doc.addPage(); y = margin; }
            doc.text(lines[i], margin, y);
            y += paragraphLineHeight;
        }
        if (y + (options.extraSpacingAfter || spaceAfterParagraph) > usableHeight && lines.length > 0) {
             doc.addPage(); y = margin;
        } else if (lines.length > 0) { 
            y += (options.extraSpacingAfter || spaceAfterParagraph);
        }
    }
    
    // Formulardaten sammeln
    const name = document.getElementById("name").value;
    const adresse = document.getElementById("adresse").value;
    const geburtInput = document.getElementById("geburt").value;
    const geburtFormatiert = geburtInput ? new Date(geburtInput).toLocaleDateString("de-DE") : 'N/A';
    const nummer = document.getElementById("nummer").value;
    const telefon = document.getElementById("telefon").value;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    const fahrtgrund = document.getElementById("fahrtgrund").value;
    const behandlungsortName = document.getElementById("behandlungsortName").value;
    const behandlungsortAdresse = document.getElementById("behandlungsortAdresse").value;
    
    const fahrten_auflistung = document.getElementById("fahrten_auflistung").value;
    const gesamtkosten = document.getElementById("gesamtkosten").value;

    const iban = document.getElementById("iban").value;
    const bic = document.getElementById("bic").value;
    const kontoinhaber = document.getElementById("kontoinhaber").value || name; // Fallback auf Antragsteller

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagen_fahrtkosten"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        anlagen.push(checkbox.value);
    });
    const anlage_sonstiges_fahrtkosten = document.getElementById("anlage_sonstiges_fahrtkosten").value;
    if (anlage_sonstiges_fahrtkosten.trim() !== "") {
        anlagen.push("Sonstige Anlagen: " + anlage_sonstiges_fahrtkosten);
    }

   // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

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
    doc.setFontSize(11);
    doc.text(name, rightColumnX, rightY);
    rightY += defaultLineHeight;
    
    adresse.split("\n").forEach(line => {
        doc.text(line.trim(), rightColumnX, rightY);
        rightY += defaultLineHeight;
    });

    if (telefon && telefon.trim() !== "") {
        doc.text("Tel.: " + telefon, rightColumnX, rightY);
        rightY += defaultLineHeight;
    }

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger
    let leftY = margin + 15; 
    
    // Inline-Rücksendezeile generieren
    const cleanAddressInline = adresse.replace(/\r?\n/g, " · ");
    const ruecksendeZeile = `${name} · ${cleanAddressInline}`;
    
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120); // Dezentes Grau
    doc.text(ruecksendeZeile, margin, leftY);
    
    // Die feine Trennlinie unter dem Mini-Absender
    doc.setDrawColor(180, 180, 180); 
    doc.setLineWidth(0.2);
    doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); 
    
    // Empfänger platzieren
    leftY += 6; 
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
    doc.text(kasseName, margin, leftY);
    leftY += defaultLineHeight;
    
    kasseAdresse.split("\n").forEach(line => {
        doc.text(line.trim(), margin, leftY);
        leftY += defaultLineHeight;
    });

    // 3. DATUM: Rechtsbündig unterhalb der Blöcke
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    
    // Verhindert das Überschneiden, falls eine Spalte mal länger wird
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Text
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

    // Betreff
    const betreffText = `Antrag auf Erstattung von Fahrkosten gemäß § 60 SGB V – Versichertennummer: ${nummer}`;
    writeParagraph(betreffText, defaultLineHeight + 1, 12, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});


    // Anrede
    writeParagraph(`Sehr geehrte Damen und Herren,`, defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`hiermit beantrage ich, ${name}, geboren am ${geburtFormatiert}, Versichertennummer ${nummer}, die Erstattung der mir entstandenen Fahrkosten für medizinisch notwendige Fahrten.`, defaultLineHeight, 11);
    
    // Grund der Fahrten
    writeParagraph(`Grund der Fahrten: ${fahrtgrund}`, defaultLineHeight, 11);
    writeParagraph(`Behandlungsort: ${behandlungsortName}, ${behandlungsortAdresse.replace(/\n/g, ', ')}`, defaultLineHeight, 11);

    // Auflistung der Fahrten
    writeLine("Auflistung der geltend gemachten Fahrten:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (fahrten_auflistung.trim() !== "") {
        writeParagraph(fahrten_auflistung, defaultLineHeight, 10); // Kleinere Schrift für die Auflistung
    } else {
        writeParagraph("[Keine detaillierte Fahrtenauflistung im Formular angegeben. Ggf. als separate Anlage beigefügt.]", defaultLineHeight, 10, {fontStyle: "italic"});
    }

    // Gesamtkosten
    if (gesamtkosten.trim() !== "") {
        writeParagraph(`Beantragte Gesamtkosten: ${parseFloat(gesamtkosten).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`, defaultLineHeight, 11, {fontStyle: "bold"});
    }
    
    // Bankverbindung
    writeLine("Bankverbindung für die Erstattung:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    writeParagraph(`Kontoinhaber:in: ${kontoinhaber}`);
    writeParagraph(`IBAN: ${iban}`);
    if (bic.trim() !== "") writeParagraph(`BIC: ${bic}`);
    
    // Beigefügte Anlagen
    if (anlagen.length > 0) {
        writeLine("Beigefügte Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    } else {
        writeParagraph("Diesem Antrag sind keine Anlagen beigefügt. Bitte prüfen Sie, ob Unterlagen wie Fahrkarten, ärztliche Verordnungen oder Behandlungsnachweise erforderlich sind.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    
    // Abschluss
    writeParagraph("Ich bitte um Prüfung meines Antrags und Überweisung der erstattungsfähigen Kosten auf das oben genannte Konto.", defaultLineHeight, 11);
    writeParagraph("Für Rückfragen stehe ich Ihnen gerne zur Verfügung.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
   
    writeParagraph(name);

    doc.save("antrag_fahrtkostenerstattung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupFahrtkosten");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}