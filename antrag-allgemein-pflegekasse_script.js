document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('antragAllgemeinPkForm');
    const saveBtn = document.getElementById('saveBtnAntragAllgPk');
    const loadBtn = document.getElementById('loadBtnAntragAllgPk');
    const closePopupBtn = document.getElementById('closePopupBtnAntragAllgPk');
    const spendenPopup = document.getElementById('spendenPopupAntragAllgPk');
    const storageKey = 'antragAllgemeinPkFormData';

    const antragstellerIdentischSelect = document.getElementById('antragstellerIdentischAllgPk');
    const antragstellerDetailsDiv = document.getElementById('antragstellerDetailsAllgPk');
    const anlageVollmachtCheckbox = document.getElementById('asVollmachtAllgPk'); 

    function updateAntragstellerDetailsVisibility() {
        if (!antragstellerIdentischSelect || !antragstellerDetailsDiv) return;
        const isNotIdentical = antragstellerIdentischSelect.value === 'nein';
        antragstellerDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        
        const asNameEl = document.getElementById('asNameAllgPk');
        const asAdresseEl = document.getElementById('asAdresseAllgPk');
        const asVerhaeltnisEl = document.getElementById('asVerhaeltnisAllgPk');

        if(asNameEl) asNameEl.required = isNotIdentical;
        if(asAdresseEl) asAdresseEl.required = isNotIdentical;
        if(asVerhaeltnisEl) asVerhaeltnisEl.required = isNotIdentical;
        if (anlageVollmachtCheckbox) anlageVollmachtCheckbox.required = isNotIdentical;
    }
    if (antragstellerIdentischSelect) {
        antragstellerIdentischSelect.addEventListener('change', updateAntragstellerDetailsVisibility);
        updateAntragstellerDetailsVisibility(); 
    }

    const formElementIds = [
      "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpTelefon",
      "antragstellerIdentischAllgPk", "asNameAllgPk", "asAdresseAllgPk", "asVerhaeltnisAllgPk",
      "pflegekasseName", "pflegekasseAdresse", 
      "antragBetreff", "anliegenBeschreibung", "antragBegruendung", "antragForderung",
      "anlageSonstigesAllgPk"
    ];
    const antragstellerVollmachtCheckboxId = "asVollmachtAllgPk";
    const anlagenCheckboxName = "anlagenAllgPk";

    // ANGEPASSTE getValue Funktion:
    function getElementValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        if (element && typeof element.value !== 'undefined' && element.value !== null) {
            return String(element.value); // Explizit zu String konvertieren
        }
        return defaultValue;
    }
    function getElementChecked(id, defaultValue = false) {
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
    }

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        data[id] = getElementValue(id);
      });
      data[antragstellerVollmachtCheckboxId] = getElementChecked(antragstellerVollmachtCheckboxId);
      
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
      const asVollmachtEl = document.getElementById(antragstellerVollmachtCheckboxId);
      if (asVollmachtEl && data[antragstellerVollmachtCheckboxId] !== undefined) {
          asVollmachtEl.checked = data[antragstellerVollmachtCheckboxId];
      }

      const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
      anlagenCheckboxes.forEach(checkbox => {
        if (checkbox) {
            checkbox.checked = !!(data.anlagen && data.anlagen.includes(checkbox.value));
        }
      });
      if (antragstellerIdentischSelect) updateAntragstellerDetailsVisibility();
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
        console.error("Fehler beim Laden der Daten für Allg. Antrag PK:", e);
        localStorage.removeItem(storageKey); 
      }
    }

    if (closePopupBtn && spendenPopup) {
        closePopupBtn.addEventListener('click', function() {
            spendenPopup.style.display = 'none';
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          if (getElementValue("anliegenBeschreibung").trim() === "" || getElementValue("antragForderung").trim() === "") {
              alert("Bitte beschreiben Sie Ihr Anliegen und was Sie von der Pflegekasse fordern/erwarten.");
              return;
          }
          generateAntragAllgemeinPkPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateAntragAllgemeinPkPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 2; 
    const subHeadingFontSize = 11;
    const textFontSize = 10;     
    const smallTextFontSize = 8;

    // Hilfsfunktionen für PDF
    function writeLine(text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        if (y + currentLineHeight > usableHeight - (margin/2)) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont("times", fontStyle); 
        doc.text(textToWrite, margin, y);
        y += currentLineHeight;
    }

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = textFontSize, options = {}) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        const fontStyle = options.fontStyle || "normal";
        const extraSpacing = options.extraSpacingAfter === undefined ? spaceAfterParagraph : options.extraSpacingAfter;
        doc.setFontSize(paragraphFontSize);
        doc.setFont("times", fontStyle);
        
        const lines = doc.splitTextToSize(textToWrite, pageWidth - (2 * margin));
        for (let i = 0; i < lines.length; i++) {
            if (y + paragraphLineHeight > usableHeight - (margin/2) ) { doc.addPage(); y = margin; }
            doc.text(lines[i], margin, y);
            y += paragraphLineHeight;
        }
        if (y + extraSpacing > usableHeight - (margin/2) && lines.length > 0) {
             doc.addPage(); y = margin;
        } else if (lines.length > 0) { 
            y += extraSpacing;
        }
    }

    // ANGEPASSTE getValue und getChecked Funktionen hier innerhalb der PDF-Funktion oder global im Skript
    // Ich nehme an, sie sind schon im äußeren Geltungsbereich des Skripts definiert.
    // Falls nicht, hier kopieren:
    function getValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        if (element && typeof element.value !== 'undefined' && element.value !== null) {
            return String(element.value);
        }
        return defaultValue;
    }
    function getFormattedDate(id, defaultValue = "N/A") {
        const dateInput = getValue(id);
        return dateInput ? new Date(dateInput).toLocaleDateString("de-DE") : defaultValue;
    }

    // Formulardaten sammeln
    const vpName = getValue("vpName");
    const vpGeburtFormatiert = getFormattedDate("vpGeburt");
    const vpAdresse = getValue("vpAdresse");
    const vpNummer = getValue("vpNummer");
    const vpTelefon = getValue("vpTelefon");

    const antragstellerIdentischAllgPk = getValue("antragstellerIdentischAllgPk");
    const asNameAllgPk = getValue("asNameAllgPk");
    const asAdresseAllgPk = getValue("asAdresseAllgPk");
    const asVerhaeltnisAllgPk = getValue("asVerhaeltnisAllgPk");
    const asVollmachtAllgPk = document.getElementById("asVollmachtAllgPk") ? document.getElementById("asVollmachtAllgPk").checked : false; // Sicherer Check für Checkbox

    const pflegekasseName = getValue("pflegekasseName");
    const pflegekasseAdresse = getValue("pflegekasseAdresse");
    
    const antragBetreff = getValue("antragBetreff", "Allgemeiner Antrag / Anfrage"); // Default für Betreff
    const anliegenBeschreibung = getValue("anliegenBeschreibung");
    const antragBegruendung = getValue("antragBegruendung");
    const antragForderung = getValue("antragForderung");

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenAllgPk"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtAllgPk" && antragstellerIdentischAllgPk === "ja") {}
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesAllgPk = getValue("anlageSonstigesAllgPk");
    // KORRIGIERTE ZEILE HIER:
    if (typeof anlageSonstigesAllgPk === 'string' && anlageSonstigesAllgPk.trim() !== "") { 
        anlagen.push("Sonstige Anlagen: " + anlageSonstigesAllgPk); 
    }

    // --- PDF-Inhalt erstellen ---
  // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal");

    // Absender-Logik ermitteln
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    let absenderTelefon = vpTelefon;
    if (antragstellerIdentischAllgPk === 'nein' && asNameAllgPk.trim() !== "") {
        absenderName = asNameAllgPk;
        absenderAdresse = asAdresseAllgPk;
    }

    // ==========================================
    // --- UNIFORMER BRIEFKOPF START ---
    // ==========================================
    
    // 1. RECHTER BLOCK: Haupt-Absenderblock (Oben rechts)
    const rightColumnX = pageWidth - margin - 60; // Startpunkt rechts (ca. 130mm)
    let rightY = margin;
    
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text("Absender:", rightColumnX, rightY);
    rightY += 5;
    
    doc.setFont("times", "normal");
    doc.setFontSize(textFontSize);
    doc.text(absenderName, rightColumnX, rightY);
    rightY += defaultLineHeight;
    
    absenderAdresse.split("\n").forEach(line => {
        doc.text(line.trim(), rightColumnX, rightY);
        rightY += defaultLineHeight;
    });

    if (absenderTelefon && absenderTelefon.trim() !== "") {
        doc.text("Tel.: " + absenderTelefon, rightColumnX, rightY);
        rightY += defaultLineHeight;
    }

    // ZUSATZ-INFO (Handelnd für / Versicherte Person) kompakt rechts drunter setzen
    rightY += 2; // Kleiner Abstand
    doc.setFont("times", "italic");
    doc.setFontSize(smallTextFontSize);
    
    let infoText = "";
    if (antragstellerIdentischAllgPk === 'nein' && asNameAllgPk.trim() !== ""){
        infoText = `(handelnd für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`;
    } else {
        infoText = `(Versicherte Person: ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`;
    }
    
    // Text umbrechen, falls er für die rechte Spalte (60mm) zu lang ist
    let infoLines = doc.splitTextToSize(infoText, 60);
    infoLines.forEach(line => {
        doc.text(line, rightColumnX, rightY);
        rightY += 4; // Engerer Zeilenabstand für den kleinen Info-Text
    });

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (Pflegekasse)
    let leftY = margin + 15; 
    
    // Inline-Rücksendezeile generieren
    const cleanAddressInline = absenderAdresse.replace(/\r?\n/g, " · ");
    const ruecksendeZeile = `${absenderName} · ${cleanAddressInline}`;
    
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120); // Dezentes Grau
    doc.text(ruecksendeZeile, margin, leftY);
    
    //  feine Trennlinie
    doc.setDrawColor(180, 180, 180); 
    doc.setLineWidth(0.2);
    doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); 
    
    // Empfänger platzieren
    leftY += 6; 
    doc.setFontSize(textFontSize);
    doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
    doc.text(pflegekasseName, margin, leftY);
    leftY += defaultLineHeight;
    
    pflegekasseAdresse.split("\n").forEach(line => {
        doc.text(line.trim(), margin, leftY);
        leftY += defaultLineHeight;
    });

    // 3. DATUM: Rechtsbündig platzieren
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    
    // Schaut, welcher Block weiter nach unten ragt, und setzt das Datum sauber darunter
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Text
    y = datumY + 12;

    let betreffTextPDF = antragBetreff; // antragBetreff hat schon Defaultwert
    betreffTextPDF += `\nVersicherte Person: ${vpName}, Vers.-Nr.: ${vpNummer}`;
    const betreffFontSize = 12;
    writeParagraph(betreffTextPDF, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});
    writeParagraph(`hiermit wende ich mich mit folgendem Anliegen an Sie:`, defaultLineHeight, textFontSize);
    
    writeLine("Mein Anliegen / Antrag:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    if (anliegenBeschreibung.trim() !== "") {
        writeParagraph(anliegenBeschreibung);
    } else {
        writeParagraph("[Beschreibung des Anliegens wurde nicht im Formular spezifiziert.]", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }

    if (antragBegruendung.trim() !== "") {
        writeLine("Begründung:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph/2;
        writeParagraph(antragBegruendung);
    }
    
    if (antragForderung.trim() !== "") {
        writeLine("Meine konkrete Bitte/Forderung:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph/2;
        writeParagraph(antragForderung, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    } else {
         writeParagraph("Ich bitte um Prüfung meines Anliegens und um eine entsprechende Rückmeldung bzw. Bearbeitung.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
    
    if (anlagen.length > 0) {
        writeLine("Anlagen:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    writeParagraph("Für Ihre Bemühungen und eine zeitnahe Rückmeldung bedanke ich mich im Voraus.", defaultLineHeight, textFontSize);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("antrag_allgemein_pflegekasse.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupAntragAllgPk");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}