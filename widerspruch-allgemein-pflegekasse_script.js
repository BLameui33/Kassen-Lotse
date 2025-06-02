document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchAllgPkForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchAllgPk');
    const loadBtn = document.getElementById('loadBtnWiderspruchAllgPk');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchAllgPk');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchAllgPk');
    const storageKey = 'widerspruchAllgPkFormData';

    // --- Steuerung der dynamischen Widerspruchsführer-Felder ---
    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischAllgPk');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsAllgPk');
    const wfVollmachtCheckbox = document.getElementById('wfVollmachtAllgPk'); 

    function updateWiderspruchfuehrerDetailsVisibility() {
        if (!widerspruchfuehrerIdentischSelect || !widerspruchfuehrerDetailsDiv) return;
        const isNotIdentical = widerspruchfuehrerIdentischSelect.value === 'nein';
        widerspruchfuehrerDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        
        const wfNameEl = document.getElementById('wfNameAllgPk');
        const wfAdresseEl = document.getElementById('wfAdresseAllgPk');
        const wfVerhaeltnisEl = document.getElementById('wfVerhaeltnisAllgPk');

        if(wfNameEl) wfNameEl.required = isNotIdentical;
        if(wfAdresseEl) wfAdresseEl.required = isNotIdentical;
        if(wfVerhaeltnisEl) wfVerhaeltnisEl.required = isNotIdentical;
        if (wfVollmachtCheckbox) wfVollmachtCheckbox.required = isNotIdentical;
    }
    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); 
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "vpName", "vpGeburt", "vpAdresse", "vpNummer",
      "widerspruchfuehrerIdentischAllgPk", "wfNameAllgPk", "wfAdresseAllgPk", "wfVerhaeltnisAllgPk",
      "pflegekasseNameW", "pflegekasseAdresseW", // Eigene IDs für Pflegekasse hier
      "entscheidungDatumPk", "aktenzeichenEntscheidungPk", "gegenstandEntscheidungPk",
      "begruendungWiderspruchAllgPK", "forderungWiderspruchAllgPK", // PK statt AllgPk
      "anlageSonstigesAllgPk_W"
    ];
    const widerspruchfuehrerVollmachtCheckboxId = "wfVollmachtAllgPk";
    const anlagenCheckboxName = "anlagenAllgPk_W"; // Eigener Name für Anlagen-Checkboxes

    // Korrigierte IDs für Speichern/Laden, basierend auf dem HTML oben:
     const korrekteFormElementIdsAllgPk = [
      "vpName", "vpGeburt", "vpAdresse", "vpNummer",
      "widerspruchfuehrerIdentischAllgPk", "wfNameAllgPk", "wfAdresseAllgPk", "wfVerhaeltnisAllgPk",
      "pflegekasseNameW", "pflegekasseAdresseW",
      "entscheidungDatumPk", "aktenzeichenEntscheidungPk", "gegenstandEntscheidungPk",
      "begruendungWiderspruchAllgPK", // Behalte die ID aus dem HTML
      "forderungWiderspruchAllgPK",  // Behalte die ID aus dem HTML
      "anlageSonstigesAllgPk_W"
    ];


    function getElementValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        if (element && typeof element.value !== 'undefined' && element.value !== null) {
            return String(element.value);
        }
        return defaultValue;
    }
    function getElementChecked(id, defaultValue = false) {
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
    }

    function getFormData() {
      const data = {};
      korrekteFormElementIdsAllgPk.forEach(id => { // Korrigierten Array verwenden
        data[id] = getElementValue(id);
      });
      data[widerspruchfuehrerVollmachtCheckboxId] = getElementChecked(widerspruchfuehrerVollmachtCheckboxId);
      
      data.anlagen = [];
      const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]:checked`);
      anlagenCheckboxes.forEach(checkbox => {
        data.anlagen.push(checkbox.value);
      });
      return data;
    }

    function populateForm(data) {
      korrekteFormElementIdsAllgPk.forEach(id => { // Korrigierten Array verwenden
        const element = document.getElementById(id);
        if (element && data[id] !== undefined) {
          element.value = data[id];
        }
      });
      const wfVollmachtEl = document.getElementById(widerspruchfuehrerVollmachtCheckboxId);
      if (wfVollmachtEl && data[widerspruchfuehrerVollmachtCheckboxId] !== undefined) {
          wfVollmachtEl.checked = data[widerspruchfuehrerVollmachtCheckboxId];
      }

      const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
      anlagenCheckboxes.forEach(checkbox => {
        if (checkbox) {
            checkbox.checked = !!(data.anlagen && data.anlagen.includes(checkbox.value));
        }
      });
      if (widerspruchfuehrerIdentischSelect) updateWiderspruchfuehrerDetailsVisibility();
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
        console.error("Fehler beim Laden der Daten für Allg. Widerspruch PK:", e);
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
          if (getElementValue("begruendungWiderspruchAllgPK").trim() === "" || getElementValue("forderungWiderspruchAllgPK").trim() === "") {
              alert("Bitte geben Sie eine Begründung für Ihren Widerspruch und Ihre Forderung an.");
              return;
          }
          generateWiderspruchAllgPkPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWiderspruchAllgPkPDF() {
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
     function getChecked(id, defaultValue = false) { // Hinzugefügt für Checkboxen
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
    }
    
    // Formulardaten sammeln
    const vpName = getValue("vpName");
    const vpGeburtFormatiert = getFormattedDate("vpGeburt");
    const vpAdresse = getValue("vpAdresse");
    const vpNummer = getValue("vpNummer");

    const widerspruchfuehrerIdentischAllgPk = getValue("widerspruchfuehrerIdentischAllgPk");
    const wfNameAllgPk = getValue("wfNameAllgPk");
    const wfAdresseAllgPk = getValue("wfAdresseAllgPk");
    const wfVerhaeltnisAllgPk = getValue("wfVerhaeltnisAllgPk");
    const wfVollmachtAllgPk = getChecked("wfVollmachtAllgPk"); // Korrigiert, um getChecked zu verwenden

    const pflegekasseNameW = getValue("pflegekasseNameW");
    const pflegekasseAdresseW = getValue("pflegekasseAdresseW");
    
    const entscheidungDatumPk = getFormattedDate("entscheidungDatumPk", "UNBEKANNT");
    const aktenzeichenEntscheidungPk = getValue("aktenzeichenEntscheidungPk");
    const gegenstandEntscheidungPk = getValue("gegenstandEntscheidungPk");
    const begruendungWiderspruchAllgPK = getValue("begruendungWiderspruchAllgPK");
    const forderungWiderspruchAllgPK = getValue("forderungWiderspruchAllgPK");

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenAllgPk_W"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtAllgPk_W" && widerspruchfuehrerIdentischAllgPk === "ja") {}
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesAllgPk_W = getValue("anlageSonstigesAllgPk_W");
    if (anlageSonstigesAllgPk_W.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesAllgPk_W); }

    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal");

    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    if (widerspruchfuehrerIdentischAllgPk === 'nein' && wfNameAllgPk.trim() !== "") {
        absenderName = wfNameAllgPk;
        absenderAdresse = wfAdresseAllgPk;
    }
    writeLine(absenderName, defaultLineHeight, "normal", textFontSize);
    absenderAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (widerspruchfuehrerIdentischAllgPk === 'nein' && wfNameAllgPk.trim() !== ""){
         writeParagraph(`(handelnd für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`, defaultLineHeight, smallTextFontSize, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    } else {
         writeParagraph(`(Versicherte Person: ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`, defaultLineHeight, smallTextFontSize, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    }
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    writeLine(pflegekasseNameW, defaultLineHeight, "normal", textFontSize);
    pflegekasseAdresseW.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    let betreffText = `Widerspruch gegen Ihren Bescheid vom ${entscheidungDatumPk}`;
    if (aktenzeichenEntscheidungPk.trim() !== "") betreffText += `, Aktenzeichen/Geschäftszeichen: ${aktenzeichenEntscheidungPk}`;
    betreffText += `\nBetreffend: ${gegenstandEntscheidungPk || 'Ihre Entscheidung (Details siehe unten)'}`;
    betreffText += `\nVersicherte/r: ${vpName}, Vers.-Nr.: ${vpNummer}`;
    betreffText += `\n- Aufforderung zur erneuten Prüfung und Abhilfe -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});

    writeParagraph(`hiermit lege ich/legen wir fristgerecht Widerspruch gegen Ihren oben genannten Bescheid vom ${entscheidungDatumPk} ein, durch den Sie bezüglich "${gegenstandEntscheidungPk || 'des genannten Sachverhalts'}" eine für mich/uns nachteilige Entscheidung getroffen haben.`);
    if (widerspruchfuehrerIdentischAllgPk === 'nein' && wfNameAllgPk.trim() !== "") {
        writeParagraph(`Ich, ${wfNameAllgPk}, lege diesen Widerspruch als ${wfVerhaeltnisAllgPk || 'bevollmächtigte Person'} für Herrn/Frau ${vpName} ein.`);
        if (wfVollmachtAllgPk) writeParagraph("Eine entsprechende Vollmacht ist beigefügt.", defaultLineHeight, smallTextFontSize, {fontStyle: "italic"});
    }
    writeParagraph(`Diese Entscheidung ist aus meiner/unserer Sicht sachlich und/oder rechtlich nicht zutreffend und bedarf einer dringenden Neubewertung.`);
    
    writeLine("Begründung meines/unseres Widerspruchs:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2; 
    if (begruendungWiderspruchAllgPK.trim() !== "") {
        writeParagraph(begruendungWiderspruchAllgPK);
    } else {
        writeParagraph("[Hier wurde keine spezifische Begründung im Formular eingegeben. Es ist entscheidend, dass Sie Ihre Gründe detailliert darlegen und ggf. mit Belegen untermauern!]", defaultLineHeight, textFontSize, {fontStyle: "bold"});
    }
    writeParagraph("Ich/Wir bitten Sie, die Sachlage unter Berücksichtigung meiner/unserer Ausführungen und der beigefügten Unterlagen erneut zu prüfen.", defaultLineHeight, textFontSize, {extraSpacingAfter:defaultLineHeight*0.5});
    
    writeLine("Meine/Unsere Forderung im Widerspruchsverfahren:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchAllgPK.trim() !== "") {
        writeParagraph(forderungWiderspruchAllgPK, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    } else {
        writeParagraph(`Ich/Wir beantragen hiermit nachdrücklich, den angefochtenen Bescheid vom ${entscheidungDatumPk} aufzuheben und unserem ursprünglichen Anliegen bzw. den in diesem Widerspruch dargelegten Punkten vollumfänglich stattzugeben.`, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    }
    
    if (anlagen.length > 0) {
        writeLine("Anlagen:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }

    const fristsetzungDatumText = new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE"); 
    writeParagraph(`Wir bitten um eine schriftliche Eingangsbestätigung dieses Widerspruchs und erwarten Ihre rechtsmittelfähige Entscheidung bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, textFontSize);
    writeParagraph("Sollte unserem Widerspruch nicht oder nicht vollumfänglich abgeholfen werden, behalten wir uns die Einleitung weiterer rechtlicher Schritte vor.", defaultLineHeight, textFontSize);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("widerspruch_allgemein_pflegekasse.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchAllgPk");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}