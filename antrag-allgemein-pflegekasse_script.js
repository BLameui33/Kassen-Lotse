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
    doc.setFont("times", "normal");

    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    let absenderTelefon = vpTelefon;
    if (antragstellerIdentischAllgPk === 'nein' && asNameAllgPk.trim() !== "") {
        absenderName = asNameAllgPk;
        absenderAdresse = asAdresseAllgPk;
    }
    writeLine(absenderName, defaultLineHeight, "normal", textFontSize);
    absenderAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (absenderTelefon && absenderTelefon.trim() !== "") writeLine("Tel.: " + absenderTelefon, defaultLineHeight, "normal", textFontSize);
    if (antragstellerIdentischAllgPk === 'nein' && asNameAllgPk.trim() !== ""){
         writeParagraph(`(handelnd für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`, defaultLineHeight, smallTextFontSize, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    } else {
         writeParagraph(`(Versicherte Person: ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`, defaultLineHeight, smallTextFontSize, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    }
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    writeLine(pflegekasseName, defaultLineHeight, "normal", textFontSize);
    pflegekasseAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    let betreffTextPDF = antragBetreff; // antragBetreff hat schon Defaultwert
    betreffTextPDF += `\nVersicherte Person: ${vpName}, Vers.-Nr.: ${vpNummer}`;
    const betreffFontSize = 12;
    writeParagraph(betreffTextPDF, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});
    writeParagraph(`hiermit wende ich mich/wenden wir uns mit folgendem Anliegen an Sie:`, defaultLineHeight, textFontSize);
    
    writeLine("Mein/Unser Anliegen / Antrag:", defaultLineHeight, "bold", subHeadingFontSize);
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
        writeLine("Meine/Unsere konkrete Bitte/Forderung:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph/2;
        writeParagraph(antragForderung, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    } else {
         writeParagraph("Ich/Wir bitten um Prüfung meines/unseres Anliegens und um eine entsprechende Rückmeldung bzw. Bearbeitung.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
    
    if (anlagen.length > 0) {
        writeLine("Anlagen:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    writeParagraph("Für Ihre Bemühungen und eine zeitnahe Rückmeldung bedanke ich/bedanken wir uns im Voraus.", defaultLineHeight, textFontSize);
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