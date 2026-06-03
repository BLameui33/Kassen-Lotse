document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchEmRenteForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchEMR');
    const loadBtn = document.getElementById('loadBtnWiderspruchEMR');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchEMR');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchEMR');
    const storageKey = 'widerspruchEmRenteFormData';

    // --- Steuerung der dynamischen Widerspruchsführer-Felder ---
    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischEMR');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsEMR');
    const wfVollmachtCheckbox = document.getElementById('wfVollmachtEMR'); 

    function updateWiderspruchfuehrerDetailsVisibility() {
        if (!widerspruchfuehrerIdentischSelect || !widerspruchfuehrerDetailsDiv) return; // Element-Check
        const isNotIdentical = widerspruchfuehrerIdentischSelect.value === 'nein';
        widerspruchfuehrerDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        
        const wfNameEl = document.getElementById('wfNameEMR');
        const wfAdresseEl = document.getElementById('wfAdresseEMR');
        const wfVerhaeltnisEl = document.getElementById('wfVerhaeltnisEMR');

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
      "personName", "personGeburtsdatum", "personAdresse", "personAktenzeichenVS", "personRvNummer",
      "widerspruchfuehrerIdentischEMR", "wfNameEMR", "wfAdresseEMR", "wfVerhaeltnisEMR",
      "rvTraegerNameW", "rvTraegerAdresseW",
      "datumBescheidEMR", "aktenzeichenBescheidEMR", 
      // "festgestellterGdB", "festgestellteMerkzeichen", // Gehören eher zum SBA Widerspruch
      "inhaltAblehnungEMR", // War im HTML, hier beibehalten
      "argumentGesundheitszustandEMR", 
      "argumentAbweichungGutachtenEMR", 
      "argumentSozialeAspekteEMR", // War im HTML
      "ergaenzendeArgumenteEMRWiderspruch", "forderungWiderspruchEMR", "anlageSonstigesEMRWiderspruch"
    ];
    
    const widerspruchfuehrerVollmachtCheckboxId = "wfVollmachtEMR";
    const anlagenCheckboxName = "anlagenEMRWiderspruch";

    function getElementValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        return element ? element.value || defaultValue : defaultValue;
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
      data[widerspruchfuehrerVollmachtCheckboxId] = getElementChecked(widerspruchfuehrerVollmachtCheckboxId);
      
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
      const wfVollmachtEl = document.getElementById(widerspruchfuehrerVollmachtCheckboxId);
      if (wfVollmachtEl && data[widerspruchfuehrerVollmachtCheckboxId] !== undefined) {
          wfVollmachtEl.checked = data[widerspruchfuehrerVollmachtCheckboxId];
      }

      const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
      anlagenCheckboxes.forEach(checkbox => {
        if (checkbox) { // Zusätzlicher Check
            checkbox.checked = data.anlagen && data.anlagen.includes(checkbox.value);
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
        console.error("Fehler beim Laden der Daten aus localStorage für EM-Rente Widerspruch:", e);
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
          if (getElementValue("argumentGesundheitszustandEMR").trim() === "" &&
              getElementValue("ergaenzendeArgumenteEMRWiderspruch").trim() === "" &&
              getElementValue("argumentAbweichungGutachtenEMR").trim() === "") {
              alert("Bitte geben Sie zumindest eine Begründung für Ihren Widerspruch an.");
              return;
          }
          generateEmRenteWiderspruchPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateEmRenteWiderspruchPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 2; 
    
    // Schriftgrößen-Konstanten
    const headingFontSize = 14; 
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
    
    // Helper-Funktionen zum sicheren Auslesen der Werte
    function getValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        return element ? element.value || defaultValue : defaultValue;
    }
    function getChecked(id, defaultValue = false) {
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
    }
    function getFormattedDate(id, defaultValue = "N/A") {
        const dateInput = getValue(id);
        return dateInput ? new Date(dateInput).toLocaleDateString("de-DE") : defaultValue;
    }
    
    // Formulardaten sammeln
    const personName = getValue("personName");
    const personGeburtFormatiert = getFormattedDate("personGeburtsdatum");
    const personAdresse = getValue("personAdresse");
    const personRvNummer = getValue("personRvNummer"); 

    const widerspruchfuehrerIdentischEMR = getValue("widerspruchfuehrerIdentischEMR");
    const wfNameEMR = getValue("wfNameEMR");
    const wfAdresseEMR = getValue("wfAdresseEMR");
    const wfVerhaeltnisEMR = getValue("wfVerhaeltnisEMR");
    const wfVollmachtEMR = getChecked("wfVollmachtEMR");

    const rvTraegerNameW = getValue("rvTraegerNameW", "Deutsche Rentenversicherung");
    const rvTraegerAdresseW = getValue("rvTraegerAdresseW");
    
    const datumBescheidEMR = getFormattedDate("datumBescheidEMR", "UNBEKANNT");
    const aktenzeichenBescheidEMR = getValue("aktenzeichenBescheidEMR");
    const inhaltAblehnungEMR = getValue("inhaltAblehnungEMR");
    
    const argumentGesundheitszustandEMR = getValue("argumentGesundheitszustandEMR");
    const argumentAbweichungGutachtenEMR = getValue("argumentAbweichungGutachtenEMR");
    const argumentSozialeAspekteEMR = getValue("argumentSozialeAspekteEMR"); 
    const ergaenzendeArgumenteEMRWiderspruch = getValue("ergaenzendeArgumenteEMRWiderspruch");
    const forderungWiderspruchEMR = getValue("forderungWiderspruchEMR");

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenEMRWiderspruch"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtEMRWiderspruch" && widerspruchfuehrerIdentischEMR === "ja") {}
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesEMRWiderspruch = getValue("anlageSonstigesEMRWiderspruch");
    if (anlageSonstigesEMRWiderspruch.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesEMRWiderspruch); }

    // --- Dynamische Sprach-Steuerung (Ich vs. Wir / Eigene Person vs. Dritte) ---
    const isSelf = (widerspruchfuehrerIdentischEMR === 'ja');
    
    let absenderName = personName;
    let absenderAdresse = personAdresse;
    if (!isSelf && wfNameEMR.trim() !== "") {
        absenderName = wfNameEMR;
        absenderAdresse = wfAdresseEMR;
    }

    // --- NEUER BRIEFKOPF ---
    doc.setFont("times", "normal");

    // 1. Rechter Block: Eigentlicher Absender-Block
    const rightColumnX = pageWidth - margin - 65; // Positionierung rechts
    let rightY = margin;
    
    doc.setFontSize(textFontSize);
    doc.setFont("times", "bold");
    doc.text("Absender:", rightColumnX, rightY);
    rightY += 5;
    
    doc.setFont("times", "normal");
    doc.text(absenderName, rightColumnX, rightY);
    rightY += defaultLineHeight;
    
    absenderAdresse.split("\n").forEach(line => {
        doc.text(line.trim(), rightColumnX, rightY);
        rightY += defaultLineHeight;
    });
    
    doc.setFont("times", "italic");
    doc.setFontSize(smallTextFontSize);
    if (!isSelf) {
        doc.text(`für: ${personName}`, rightColumnX, rightY); rightY += 4;
        doc.text(`geb.: ${personGeburtFormatiert}`, rightColumnX, rightY); rightY += 4;
        doc.text(`RV-Nr.: ${personRvNummer}`, rightColumnX, rightY); rightY += 4;
    } else {
        doc.text(`RV-Nr.: ${personRvNummer}`, rightColumnX, rightY); rightY += 4;
    }

    // 2. Linker Block: Kleine Rücksendezeile + Empfänger
    let leftY = margin + 15; // Höhe passend für Sichtfenster-Umschläge
    
    // Einzeilige Rücksendeadresse generieren
    const cleanAddressInline = absenderAdresse.replace(/\r?\n/g, ", ");
    const ruecksendeZeile = `${absenderName} · ${cleanAddressInline}`;
    
    doc.setFont("times", "normal");
    doc.setFontSize(smallTextFontSize);
    doc.text(ruecksendeZeile, margin, leftY);
    leftY += 4; // Kleiner Abstand zum eigentlichen Empfänger
    
    doc.setFontSize(textFontSize);
    doc.text(rvTraegerNameW, margin, leftY);
    leftY += defaultLineHeight;
    
    rvTraegerAdresseW.split("\n").forEach(line => {
        doc.text(line.trim(), margin, leftY);
        leftY += defaultLineHeight;
    });

    // 3. Datum rechtsbündig unter dem Empfänger-Level platzieren
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    doc.setFont("times", "normal");
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    
    let datumY = leftY + 5;
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Berechne den dynamischen Startpunkt für den Textkörper, um Überlappungen zu verhindern
    y = Math.max(leftY, rightY, datumY) + 10;

    // --- Text-Inhalte (bereinigt von "Ich/wir" und "Herr/Frau") ---

    // Betreff
    let betreffText = `Widerspruch gegen Ihren Bescheid vom ${datumBescheidEMR}`;
    if (aktenzeichenBescheidEMR.trim() !== "") betreffText += `, Aktenzeichen: ${aktenzeichenBescheidEMR}`;
    betreffText += `\nBetreffend: Antrag auf Erwerbsminderungsrente für ${personName}, RV-Nr.: ${personRvNummer}`;
    betreffText += `\n- ERNEUTE DRINGENDE AUFFORDERUNG ZUR ÜBERPRÜFUNG UND ANERKENNUNG DER ERWERBSMINDERUNG -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    const einleitungText = isSelf 
        ? `hiermit lege ich fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Bescheid vom ${datumBescheidEMR} ein. Mit diesem Bescheid haben Sie meinen Antrag auf Erwerbsminderungsrente abgelehnt bzw. die Erwerbsminderung nicht im tatsächlich vorliegenden Umfang anerkannt (konkret wurde Folgendes entschieden: "${inhaltAblehnungEMR || 'siehe Ihr Bescheid'}").`
        : `hiermit lege ich fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Bescheid vom ${datumBescheidEMR} ein. Mit diesem Bescheid haben Sie den Antrag auf Erwerbsminderungsrente für ${personName} abgelehnt bzw. die Erwerbsminderung nicht im tatsächlich vorliegenden Umfang anerkannt (konkret wurde Folgendes entschieden: "${inhaltAblehnungEMR || 'siehe Ihr Bescheid'}").`;
    
    writeParagraph(einleitungText);

    if (!isSelf && wfNameEMR.trim() !== "") {
        writeParagraph(`Ich, ${wfNameEMR}, lege diesen Widerspruch als ${wfVerhaeltnisEMR || 'bevollmächtigte Person'} ein.`);
        if (wfVollmachtEMR) writeParagraph("Eine entsprechende Vollmacht ist beigefügt.", defaultLineHeight, smallTextFontSize, {fontStyle: "italic"});
    }

    const nachvollziehbarText = isSelf
        ? `Diese Entscheidung ist für mich nicht nachvollziehbar und wird den schwerwiegenden gesundheitlichen Einschränkungen und deren Auswirkungen auf meine Erwerbsfähigkeit in keiner Weise gerecht.`
        : `Diese Entscheidung ist für mich nicht nachvollziehbar und wird den schwerwiegenden gesundheitlichen Einschränkungen und deren Auswirkungen auf die Erwerbsfähigkeit von ${personName} in keiner Weise gerecht.`;
        
    writeParagraph(nachvollziehbarText);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung des Widerspruchs:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2; 
    
    const hauptablehnungsgrundEMR = getValue("hauptablehnungsgrundEMR");
    if (hauptablehnungsgrundEMR.trim() !== "") {
         writeParagraph(`Sie begründen Ihre Ablehnung im Wesentlichen mit: "${hauptablehnungsgrundEMR}". Diese Einschätzung ist aus meiner Sicht nicht zutreffend, da:`, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight*0.5});
    }

    if (argumentGesundheitszustandEMR.trim() !== "") {
        writeLine("Zum fortbestehenden bzw. nicht ausreichend gewürdigten Gesundheitszustand und der Erwerbsminderung:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(argumentGesundheitszustandEMR, defaultLineHeight, textFontSize);
    }

    if (argumentAbweichungGutachtenEMR.trim() !== "") {
        writeLine("Zu den Fehlern/Abweichungen im zugrundeliegenden Gutachten bzw. Ihrer Bewertung:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(argumentAbweichungGutachtenEMR, defaultLineHeight, textFontSize);
    }
    
    if (argumentSozialeAspekteEMR.trim() !== "") {
        writeLine("Zur Berücksichtigung der sozialen Aspekte und besonderen Umstände:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(argumentSozialeAspekteEMR, defaultLineHeight, textFontSize);
    }

    if (ergaenzendeArgumenteEMRWiderspruch.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(ergaenzendeArgumenteEMRWiderspruch, defaultLineHeight, textFontSize);
    }
    
    const belegeText = isSelf
        ? `Die beigefügten (und ggf. bereits früher eingereichten) ärztlichen Unterlagen belegen eindrücklich und detailliert, dass meine Erwerbsfähigkeit auf dem allgemeinen Arbeitsmarkt aufgrund der multiplen und schwerwiegenden Gesundheitsstörungen auf unter drei Stunden täglich gesunken ist (bzw. auf unter sechs Stunden, falls teilweise EM-Rente das Ziel ist). Eine Besserung ist auf nicht absehbare Zeit nicht zu erwarten.`
        : `Die beigefügten (und ggf. bereits früher eingereichten) ärztlichen Unterlagen belegen eindrücklich und detailliert, dass die Erwerbsfähigkeit von ${personName} auf dem allgemeinen Arbeitsmarkt aufgrund der multiplen und schwerwiegenden Gesundheitsstörungen auf unter drei Stunden täglich gesunken ist (bzw. auf unter sechs Stunden, falls teilweise EM-Rente das Ziel ist). Eine Besserung ist auf nicht absehbare Zeit nicht zu erwarten.`;

    writeParagraph(belegeText, defaultLineHeight, textFontSize);
    writeParagraph("Ich bitte Sie eindringlich, die medizinischen Fakten und die Auswirkungen auf die Leistungsfähigkeit im Alltag und Erwerbsleben vollumfänglich zu würdigen und nicht auf Grundlage einer möglicherweise unzureichenden oder nicht dem aktuellen Stand entsprechenden Begutachtung zu entscheiden.", defaultLineHeight, textFontSize);
    
    // Forderung
    writeLine("Forderung im Widerspruchsverfahren:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;
    
    if (forderungWiderspruchEMR.trim() !== "") {
        writeParagraph(forderungWiderspruchEMR, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    } else {
        const forderungTextDefault = isSelf
            ? `Ich fordere Sie daher nachdrücklich auf, Ihren Bescheid vom ${datumBescheidEMR} aufzuheben und mir die Rente wegen voller Erwerbsminderung (hilfsweise wegen teilweiser Erwerbsminderung) ab dem frühestmöglichen Zeitpunkt zu gewähren. Alternativ beantrage ich eine erneute, umfassende ärztliche Begutachtung durch einen unabhängigen Facharzt/eine unabhängige Fachärztin für [relevante Fachrichtung(en) nennen].`
            : `Ich fordere Sie daher nachdrücklich auf, Ihren Bescheid vom ${datumBescheidEMR} aufzuheben und ${personName} die Rente wegen voller Erwerbsminderung (hilfsweise wegen teilweiser Erwerbsminderung) ab dem frühestmöglichen Zeitpunkt zu gewähren. Alternativ beantrage ich eine erneute, umfassende ärztliche Begutachtung durch einen unabhängigen Facharzt/eine unabhängige Fachärztin für [relevante Fachrichtung(en) nennen].`;
        
        writeParagraph(forderungTextDefault, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    }
    
    // Anlagen
    if (anlagen.length > 0) {
        writeLine("Anlagen:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }

    // Abschluss mit Fristsetzung
    const fristsetzungDatumText = new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE"); 
    writeParagraph(`Bitte bestätigen Sie mir den Eingang dieses Widerspruchs umgehend schriftlich. Ich erwarte Ihre rechtsmittelfähige Entscheidung über meinen Widerspruch bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, textFontSize);
    writeParagraph("Sollte ich bis zu diesem Datum keine zufriedenstellende Antwort erhalten oder mein Widerspruch erneut unzureichend beschieden werden, behalte ich mir ausdrücklich die Einleitung weiterer rechtlicher Schritte, insbesondere die Klageerhebung vor dem zuständigen Sozialgericht, vor.", defaultLineHeight, textFontSize);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("widerspruch_erwerbsminderungsrente.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchEMR");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}