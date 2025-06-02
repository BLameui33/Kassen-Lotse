document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('medikamentenAntragForm');
    const saveBtn = document.getElementById('saveBtnMedikamente');
    const loadBtn = document.getElementById('loadBtnMedikamente');
    const closePopupBtn = document.getElementById('closePopupBtnMedikamente');
    const spendenPopup = document.getElementById('spendenPopupMedikamente');
    const storageKey = 'medikamentenAntragFormData';

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "name", "adresse", "geburt", "nummer", "telefon", 
        "kasseName", "kasseAdresse",
        "medikamentName", "pzn", "dosierung", "behandlungsdauer", "geschaetzteKosten",
        "diagnose", "schweregradErkrankung", "arztName", "arztFachrichtung", "arztAnschrift", 
        "datumAerztlicheStellungnahme", "bisherigeTherapien", "begruendeteAussicht",
        "anlage_sonstiges_medikament"
    ];
    const anlagenCheckboxName = "anlagen_medikament";

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
            } else if (element) { // Sicherstellen, dass element existiert, bevor auf .checked zugegriffen wird
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
            generateMedikamentenAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateMedikamentenAntragPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 2;

    // Hilfsfunktionen für PDF (sollten idealerweise in einer zentralen Helper-Datei sein)
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

    const medikamentName = document.getElementById("medikamentName").value;
    const pzn = document.getElementById("pzn").value;
    const dosierung = document.getElementById("dosierung").value;
    const behandlungsdauer = document.getElementById("behandlungsdauer").value;
    const geschaetzteKosten = document.getElementById("geschaetzteKosten").value;
    
    const diagnose = document.getElementById("diagnose").value;
    const schweregradErkrankung = document.getElementById("schweregradErkrankung").value;
    const arztName = document.getElementById("arztName").value;
    const arztFachrichtung = document.getElementById("arztFachrichtung").value;
    const arztAnschrift = document.getElementById("arztAnschrift").value;
    const datumAerztlicheStellungnahmeInput = document.getElementById("datumAerztlicheStellungnahme").value;
    const datumAerztlicheStellungnahme = datumAerztlicheStellungnahmeInput ? new Date(datumAerztlicheStellungnahmeInput).toLocaleDateString("de-DE") : 'liegt bei / wird nachgereicht';
    
    const bisherigeTherapien = document.getElementById("bisherigeTherapien").value;
    const begruendeteAussicht = document.getElementById("begruendeteAussicht").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagen_medikament"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        anlagen.push(checkbox.value);
    });
    const anlage_sonstiges_medikament = document.getElementById("anlage_sonstiges_medikament").value;
    if (anlage_sonstiges_medikament.trim() !== "") {
        anlagen.push("Sonstige Anlagen: " + anlage_sonstiges_medikament);
    }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    writeLine(name);
    adresse.split("\n").forEach(line => writeLine(line));
    if (telefon.trim() !== "") writeLine("Tel.: " + telefon);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger
    writeLine(kasseName);
    kasseAdresse.split("\n").forEach(line => writeLine(line));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    // Datum rechtsbündig
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    // Betreff
    let betreffText = `Antrag auf Kostenübernahme für das Medikament "${medikamentName || 'N/A'}"`;
    betreffText += `\ngemäß § 2 Abs. 1a SGB V (ggf. Off-Label-Use)`;
    betreffText += `\nVersichertennummer: ${nummer}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`hiermit beantrage ich, ${name}, geboren am ${geburtFormatiert}, Versichertennummer ${nummer}, die Kostenübernahme für das unten näher bezeichnete Medikament. Die Behandlung ist ärztlich dringend empfohlen und medizinisch notwendig.`, defaultLineHeight, 11);
    
    // 1. Angaben zum Medikament
    writeLine("1. Angaben zum beantragten Medikament:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Name: ${medikamentName}`);
    if (pzn.trim() !== "") writeParagraph(`PZN: ${pzn}`);
    writeParagraph(`Geplante Dosierung/Darreichungsform: ${dosierung}`);
    writeParagraph(`Voraussichtliche Behandlungsdauer: ${behandlungsdauer}`);
    if (geschaetzteKosten.trim() !== "") writeParagraph(`Geschätzte Kosten: ${geschaetzteKosten}`);

    // 2. Medizinische Notwendigkeit und Begründung
    writeLine("2. Medizinische Notwendigkeit und Begründung (gemäß ärztlicher Stellungnahme):", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Diagnose(n): ${diagnose}`);
    writeParagraph(`Schweregrad der Erkrankung: ${schweregradErkrankung}`);
    writeParagraph(`Behandelnde/r Arzt/Ärztin: ${arztName}, ${arztFachrichtung || '(Fachrichtung angeben)'}`);
    writeParagraph(`Anschrift der Praxis: ${arztAnschrift.replace(/\n/g, ', ')}`);
    writeParagraph(`Eine ausführliche ärztliche Stellungnahme vom ${datumAerztlicheStellungnahme}, welche die Notwendigkeit dieser spezifischen Behandlung detailliert begründet, liegt diesem Antrag bei.`);
    
    writeLine("Details zur medizinischen Begründung:", defaultLineHeight, true, 10);
    y += spaceAfterParagraph/2;
    writeParagraph(`Bisherige Therapieversuche und deren Ergebnis (warum Standardtherapien nicht (mehr) geeignet sind):\n${bisherigeTherapien}`, defaultLineHeight, 10);
    writeParagraph(`Begründete Aussicht auf einen Behandlungserfolg oder eine positive Einwirkung auf den Krankheitsverlauf durch das beantragte Medikament:\n${begruendeteAussicht}`, defaultLineHeight, 10);
    
    writeParagraph("Ich beziehe mich auf die Bedingungen des § 2 Abs. 1a SGB V (bzw. die Grundsätze des Nikolaus-Beschlusses des BSG bei Off-Label-Use), wonach ein Anspruch auf Kostenübernahme besteht, wenn bei einer schwerwiegenden Erkrankung eine allgemein anerkannte, dem medizinischen Standard entsprechende Leistung nicht zur Verfügung steht und eine nicht ganz fernliegende Aussicht auf Heilung oder auf eine spürbare positive Einwirkung auf den Krankheitsverlauf besteht.", defaultLineHeight, 10, {fontStyle: "italic"});


    // 3. Beigefügte Anlagen
    if (anlagen.length > 0) {
        writeLine("3. Beigefügte Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    } else {
        writeParagraph("Bitte beachten Sie, dass diesem Antrag insbesondere eine ausführliche ärztliche Stellungnahme beigefügt werden muss.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    
    // Abschluss
    writeParagraph("Ich bitte Sie höflich um eine zeitnahe Prüfung meines Antrags und um eine schriftliche Bestätigung der Kostenübernahme für das genannte Medikament. Bitte teilen Sie mir ebenfalls mit, falls Sie weitere Unterlagen benötigen.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }


    // Grußformel (ohne den extra großen Abstand davor)
    writeParagraph("Mit freundlichen Grüßen");
    // y += defaultLineHeight * 1.5; // Reduzierter Platz für Unterschrift oder ganz weglassen
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(name);

    doc.save("antrag_medikamentenkosten.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupMedikamente");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}