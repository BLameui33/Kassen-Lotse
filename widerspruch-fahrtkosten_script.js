document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchFahrtkostenForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchFahrtkosten');
    const loadBtn = document.getElementById('loadBtnWiderspruchFahrtkosten');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchFahrtkosten');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchFahrtkosten');
    const storageKey = 'widerspruchFahrtkostenFormData';

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "name", "adresse", "nummer", "kasseName", "kasseAdresse",
      "ursprAntragDatumFahrtkosten", "abgelehnteFahrtenBeschreibung", 
      "ablehnungsbescheidDatumFahrtkosten", "aktenzeichenFahrtkosten", 
      "medizinischeNotwendigkeitBehandlung", "durchfuehrungFahrten", // NEUE FELDER HINZUGEFÜGT
      "widerspruchBegruendungFahrtkosten"
    ];

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
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
          generateWiderspruchFahrtkostenPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWiderspruchFahrtkostenPDF() {
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
    const nummer = document.getElementById("nummer").value;
    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;
    
    const ursprAntragDatumFahrtkostenInput = document.getElementById("ursprAntragDatumFahrtkosten").value;
    const ursprAntragDatumFahrtkosten = ursprAntragDatumFahrtkostenInput ? new Date(ursprAntragDatumFahrtkostenInput).toLocaleDateString("de-DE") : '(nicht angegeben)';
    const abgelehnteFahrtenBeschreibung = document.getElementById("abgelehnteFahrtenBeschreibung").value;
    const ablehnungsbescheidDatumFahrtkostenInput = document.getElementById("ablehnungsbescheidDatumFahrtkosten").value;
    const ablehnungsbescheidDatumFahrtkosten = ablehnungsbescheidDatumFahrtkostenInput ? new Date(ablehnungsbescheidDatumFahrtkostenInput).toLocaleDateString("de-DE") : 'UNBEKANNT (BITTE UNBEDINGT NACHTRAGEN!)';
    const aktenzeichenFahrtkosten = document.getElementById("aktenzeichenFahrtkosten").value;
    
    // NEUE FELDER AUSLESEN
    const medizinischeNotwendigkeitBehandlung = document.getElementById("medizinischeNotwendigkeitBehandlung").value;
    const durchfuehrungFahrten = document.getElementById("durchfuehrungFahrten").value;
    
    const widerspruchBegruendungFahrtkosten = document.getElementById("widerspruchBegruendungFahrtkosten").value;

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    writeLine(name);
    adresse.split("\n").forEach(line => writeLine(line));
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
    let betreffText = `Widerspruch gegen Ihren Ablehnungsbescheid vom ${ablehnungsbescheidDatumFahrtkosten}`;
    if (aktenzeichenFahrtkosten.trim() !== "") betreffText += `, Az.: ${aktenzeichenFahrtkosten}`;
    betreffText += `\nBetreff: Antrag auf Fahrtkostenerstattung für: ${abgelehnteFahrtenBeschreibung || 'die beantragten Fahrten'}`;
    if (ursprAntragDatumFahrtkostenInput.trim() !== "") betreffText += ` (ursprünglicher Antrag vom ${ursprAntragDatumFahrtkosten})`;
    betreffText += `\nVersichertennummer: ${nummer}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich fristgerecht Widerspruch gegen Ihren oben genannten Ablehnungsbescheid vom ${ablehnungsbescheidDatumFahrtkosten} ein, mit dem Sie meinen Antrag auf Erstattung von Fahrtkosten für "${abgelehnteFahrtenBeschreibung || 'die beantragten Fahrten'}" abgelehnt haben.`);
    
    // Begründung des Widerspruchs
    writeLine("Begründung:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    // TEXTBLÖCKE MIT NEUEN FELDDATEN
    writeParagraph(`Die Notwendigkeit der Fahrten ergibt sich aus der medizinischen Notwendigkeit der Behandlung, zu der gefahren wurde: ${medizinischeNotwendigkeitBehandlung || '(Bitte hier die medizinische Notwendigkeit der Behandlung ergänzen.)'}. Mein Anspruch auf Erstattung der Fahrtkosten basiert auf § 60 SGB V sowie den Regelungen Ihrer Satzung.`);
    writeParagraph(`Ich habe die Fahrten wie folgt durchgeführt: ${durchfuehrungFahrten || '(Bitte hier die Durchführung der Fahrten beschreiben.)'}. Alle erforderlichen Nachweise wurden bereits eingereicht oder liegen diesem Schreiben bei.`);
    
    // Zusätzliche Begründung
    if (widerspruchBegruendungFahrtkosten.trim() !== "") {
        writeParagraph(`Ergänzend führe ich zu den Ablehnungsgründen und meiner Begründung weiter aus:\n${widerspruchBegruendungFahrtkosten}`);
    } else {
        writeParagraph("Bitte prüfen Sie die von Ihnen genannten Ablehnungsgründe erneut sorgfältig unter Berücksichtigung meiner oben gemachten Angaben und der beigefügten bzw. bereits vorliegenden Unterlagen.", defaultLineHeight, 11, {fontStyle: "italic"});
    }
    

    // Forderung
    writeParagraph("Ich bitte Sie daher dringend, Ihre Entscheidung nochmals zu überprüfen und meinem Antrag auf Fahrtkostenerstattung vollumfänglich stattzugeben bzw. die erstattungsfähigen Kosten zu übernehmen.");
    writeParagraph("Sollten Sie weitere Unterlagen benötigen oder eine erneute Begutachtung durch den MDK für erforderlich halten, stehe ich hierfür selbstverständlich zur Verfügung.");
    writeParagraph("Ich bitte um eine schriftliche Bestätigung des Eingangs dieses Widerspruchs und um eine zeitnahe, positive Neubewertung meines Antrags.");
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    
    writeParagraph(name);

    doc.save("widerspruch_fahrtkostenerstattung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchFahrtkosten");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}