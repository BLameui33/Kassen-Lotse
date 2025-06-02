document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchMedikamenteForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchMedikamente');
    const loadBtn = document.getElementById('loadBtnWiderspruchMedikamente');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchMedikamente');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchMedikamente');
    const storageKey = 'widerspruchMedikamenteFormData';

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "name", "adresse", "nummer", "kasseName", "kasseAdresse",
      "ursprAntragDatumMedikament", "abgelehntesMedikamentName", 
      "ablehnungsbescheidDatumMedikament", "aktenzeichenMedikament", 
      "kernpunkteAerztlicheStellungnahme", // NEUES FELD HINZUGEFÜGT
      "widerspruchBegruendungMedikament"
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
          generateWiderspruchMedikamentePDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWiderspruchMedikamentePDF() {
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
    
    const ursprAntragDatumMedikamentInput = document.getElementById("ursprAntragDatumMedikament").value;
    const ursprAntragDatumMedikament = ursprAntragDatumMedikamentInput ? new Date(ursprAntragDatumMedikamentInput).toLocaleDateString("de-DE") : '(Datum nicht angegeben)';
    const abgelehntesMedikamentName = document.getElementById("abgelehntesMedikamentName").value;
    const ablehnungsbescheidDatumMedikamentInput = document.getElementById("ablehnungsbescheidDatumMedikament").value;
    const ablehnungsbescheidDatumMedikament = ablehnungsbescheidDatumMedikamentInput ? new Date(ablehnungsbescheidDatumMedikamentInput).toLocaleDateString("de-DE") : 'UNBEKANNT (BITTE UNBEDINGT NACHTRAGEN!)';
    const aktenzeichenMedikament = document.getElementById("aktenzeichenMedikament").value;
    
    // WERT DES NEUEN FELDES AUSLESEN
    const kernpunkteAerztlicheStellungnahme = document.getElementById("kernpunkteAerztlicheStellungnahme").value;
    
    const widerspruchBegruendungMedikament = document.getElementById("widerspruchBegruendungMedikament").value;

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender, Empfänger, Datum (bleibt wie gehabt)
    writeLine(name);
    adresse.split("\n").forEach(line => writeLine(line));
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}
    writeLine(kasseName);
    kasseAdresse.split("\n").forEach(line => writeLine(line));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    // Betreff (bleibt wie gehabt)
    let betreffText = `Widerspruch gegen Ihren Ablehnungsbescheid vom ${ablehnungsbescheidDatumMedikament}`;
    if (aktenzeichenMedikament.trim() !== "") betreffText += `, Az.: ${aktenzeichenMedikament}`;
    betreffText += `\nBetreff: Antrag auf Kostenübernahme für das Medikament "${abgelehntesMedikamentName || 'N/A'}"`;
    if (ursprAntragDatumMedikamentInput.trim() !== "") betreffText += ` (ursprünglicher Antrag vom ${ursprAntragDatumMedikament})`;
    betreffText += `\nVersichertennummer: ${nummer}`;
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede (bleibt wie gehabt)
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch (bleibt wie gehabt)
    writeParagraph(`hiermit lege ich fristgerecht Widerspruch gegen Ihren oben genannten Ablehnungsbescheid vom ${ablehnungsbescheidDatumMedikament} ein, mit dem Sie meinen Antrag auf Kostenübernahme für das Medikament "${abgelehntesMedikamentName || '(Name des Medikaments bitte eintragen)'}" abgelehnt haben.`);
    
    // Begründung des Widerspruchs
    writeLine("Begründung:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    // NEUER TEXTBLOCK MIT INHALT AUS NEUEM FELD
    if (kernpunkteAerztlicheStellungnahme.trim() !== "") {
        writeParagraph(`Die ärztliche Stellungnahme (liegt bei/wurde bereits eingereicht) führt zu den entscheidenden medizinischen Aspekten insbesondere aus:\n"${kernpunkteAerztlicheStellungnahme}"`);
    } else {
        writeParagraph("Eine detaillierte ärztliche Stellungnahme, welche die Notwendigkeit des Medikaments und die Erfüllung der Voraussetzungen für eine Kostenübernahme begründet, liegt bei oder wird umgehend nachgereicht. Diese ist für die Beurteilung meines Widerspruchs von zentraler Bedeutung.", defaultLineHeight, 11, {fontStyle: "italic"});
    }

    // Zusätzliche Begründung
    if (widerspruchBegruendungMedikament.trim() !== "") {
        writeParagraph(`Ergänzend zu den Ausführungen in der ärztlichen Stellungnahme und zu den Ablehnungsgründen Ihrerseits möchte ich Folgendes anführen:\n${widerspruchBegruendungMedikament}`);
    } else if (kernpunkteAerztlicheStellungnahme.trim() === "") { // Nur wenn beide Felder leer sind, einen allgemeinen Platzhalter einfügen
        writeParagraph("[Hier bitte Ihre ausführliche Begründung einfügen. Gehen Sie detailliert auf die Ablehnungsgründe Ihrer Krankenkasse ein und legen Sie dar, warum die Voraussetzungen für eine Kostenübernahme (z.B. nach § 2 Abs. 1a SGB V) aus Ihrer Sicht erfüllt sind. Verweisen Sie auf die beigefügte(n) ärztliche(n) Stellungnahme(n).]", defaultLineHeight, 11, {fontStyle: "italic"});
    }
    
    writeParagraph("Ich möchte betonen, dass die Behandlung mit dem genannten Medikament für mich von entscheidender Bedeutung ist. Die medizinische Notwendigkeit sowie die Erfüllung der gesetzlichen Voraussetzungen für eine Kostenübernahme sind meines Erachtens gegeben und durch die ärztlichen Unterlagen belegt.", defaultLineHeight, 11);

    // Forderung (bleibt wie gehabt)
    writeParagraph("Ich fordere Sie daher auf, Ihre Entscheidung zu revidieren und die Kosten für die Behandlung mit dem Medikament " + `"${abgelehntesMedikamentName || '(Name des Medikaments)'}"` + " zu übernehmen.");
    writeParagraph("Bitte bestätigen Sie mir den Eingang dieses Widerspruchs und teilen Sie mir Ihre erneute Entscheidung fristgerecht mit.");
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift (mit dem von dir gewünschten geringeren Abstand)
    writeParagraph("Mit freundlichen Grüßen");
    // Kein zusätzlicher großer Abstand mehr hier
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; // Nur kleiner Platz für Unterschrift
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(name);

    doc.save("widerspruch_medikamentenkosten.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchMedikamente");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}