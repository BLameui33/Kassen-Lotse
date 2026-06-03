document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchRehaRvForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchRehaRv');
    const loadBtn = document.getElementById('loadBtnWiderspruchRehaRv');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchRehaRv');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchRehaRv');
    const storageKey = 'widerspruchRehaRvFormData';

    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischRehaRv');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsRehaRv');
    const wfVollmachtCheckboxRehaRv = document.getElementById('wfVollmachtRehaRv'); 

    function updateWiderspruchfuehrerDetailsVisibility() {
        if (!widerspruchfuehrerIdentischSelect || !widerspruchfuehrerDetailsDiv) return;
        const isNotIdentical = widerspruchfuehrerIdentischSelect.value === 'nein';
        widerspruchfuehrerDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        
        const wfNameEl = document.getElementById('wfNameRehaRv');
        const wfAdresseEl = document.getElementById('wfAdresseRehaRv');
        const wfVerhaeltnisEl = document.getElementById('wfVerhaeltnisRehaRv');

        if(wfNameEl) wfNameEl.required = isNotIdentical;
        if(wfAdresseEl) wfAdresseEl.required = isNotIdentical;
        if(wfVerhaeltnisEl) wfVerhaeltnisEl.required = isNotIdentical;
        if (wfVollmachtCheckboxRehaRv) wfVollmachtCheckboxRehaRv.required = isNotIdentical;
    }
    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); 
    }

    const formElementIds = [
      "personNameRehaRvW", "personGeburtsdatumRehaRvW", "personAdresseRehaRvW", "personRvNummerRehaRvW",
      "widerspruchfuehrerIdentischRehaRv", "wfNameRehaRv", "wfAdresseRehaRv", "wfVerhaeltnisRehaRv",
      "rvTraegerNameWiderspruch", "rvTraegerAdresseWiderspruch",
      "datumUrsprAntragRehaRv", "rehaArtAbgelehnt", "rehaZielortAbgelehnt",
      "datumAblehnungsbescheidRehaRv", "aktenzeichenRehaRv", "hauptablehnungsgrundRehaRv",
      "argumentGesundheitszustandRehaRv", "argumentErwerbsfaehigkeitRehaRv", "argumentZieleRehaRv",
      "ergaenzendeArgumenteRehaRvWiderspruch", "forderungWiderspruchRehaRv", "anlageSonstigesRehaRvWiderspruch"
    ];
    const widerspruchfuehrerVollmachtCheckboxId = "wfVollmachtRehaRv";
    const anlagenCheckboxName = "anlagenRehaRvWiderspruch";

    // Sicherere Hilfsfunktion, die immer einen String zurückgibt
    function getElementValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        // Stellt sicher, dass element.value existiert und ein String ist, bevor trim aufgerufen wird.
        // Gibt defaultValue zurück, wenn das Element nicht existiert oder .value nicht vorhanden/leer ist.
        return element && typeof element.value === 'string' ? element.value : defaultValue;
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
        data.anlagen.push(checkbox.value); // .value von Checkboxen ist sicher
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
        console.error("Fehler beim Laden der Daten aus localStorage für Reha-Widerspruch (RV):", e);
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
          // Überarbeitete Validierung
          const argGesundheit = getElementValue("argumentGesundheitszustandRehaRv").trim();
          const argErgaenzend = getElementValue("ergaenzendeArgumenteRehaRvWiderspruch").trim();
          // Die ID "argumentErwerbsfaehigkeitRehaRv" ist im HTML des Reha-Widerspruchs NICHT für ein Hauptbegründungsfeld vorgesehen,
          // sondern eher "argumentKeineAlternativenWohn" oder "argumentVerhaeltnismaessigkeitKostenWohn" beim Wohnraumanpassungs-Widerspruch.
          // Für den Reha-Widerspruch hatten wir: argumentGesundheitszustandRehaRv, argumentErwerbsfaehigkeitRehaRv, argumentZieleRehaRv, ergaenzendeArgumenteRehaRvWiderspruch
          // Ich nehme hier die zwei wichtigsten allgemeinen Begründungsfelder für die Basisvalidierung.
          
          // Nehmen wir an, die Kernbegründung kommt aus argumentGesundheitszustandRehaRv oder ergaenzendeArgumenteRehaRvWiderspruch
          if (argGesundheit === "" && argErgaenzend === "" ) { 
              alert("Bitte geben Sie zumindest eine Begründung für Ihren Widerspruch an.");
              return;
          }
          generateRehaRvWiderspruchPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateRehaRvWiderspruchPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 2; 
    const headingFontSize = 14; 
    const subHeadingFontSize = 11;
    const textFontSize = 10;     
    const smallTextFontSize = 8; // Sicherstellen, dass diese Variable hier definiert ist

    // Hilfsfunktionen für PDF
    function writeLine(text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) {
        const textToWrite = text === undefined || text === null ? "" : String(text); // Stellt sicher, dass Text ein String ist
        if (y + currentLineHeight > usableHeight - (margin/2)) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont("times", fontStyle); 
        doc.text(textToWrite, margin, y);
        y += currentLineHeight;
    }

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = textFontSize, options = {}) {
        const textToWrite = text === undefined || text === null ? "" : String(text); // Stellt sicher, dass Text ein String ist
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

    // Helper-Funktionen zum sicheren Auslesen der Werte (bereits im oberen Teil des Skripts definiert)
    function getValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        return element && typeof element.value === 'string' ? element.value : defaultValue;
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
    const personName = getValue("personNameRehaRvW");
    const personGeburtsFormatiert = getFormattedDate("personGeburtsdatumRehaRvW");
    const personAdresse = getValue("personAdresseRehaRvW");
    const personRvNummer = getValue("personRvNummerRehaRvW"); 

    const widerspruchfuehrerIdentischRehaRv = getValue("widerspruchfuehrerIdentischRehaRv");
    const wfNameRehaRv = getValue("wfNameRehaRv");
    const wfAdresseRehaRv = getValue("wfAdresseRehaRv");
    const wfVerhaeltnisRehaRv = getValue("wfVerhaeltnisRehaRv");
    const wfVollmachtRehaRv = getChecked("wfVollmachtRehaRv");

    const rvTraegerNameWiderspruch = getValue("rvTraegerNameWiderspruch", "Deutsche Rentenversicherung");
    const rvTraegerAdresseWiderspruch = getValue("rvTraegerAdresseWiderspruch");
    
    const datumUrsprAntragRehaRv = getFormattedDate("datumUrsprAntragRehaRv");
    const rehaArtAbgelehnt = getValue("rehaArtAbgelehnt");
    const rehaZielortAbgelehnt = getValue("rehaZielortAbgelehnt");
    const datumAblehnungsbescheidRehaRv = getFormattedDate("datumAblehnungsbescheidRehaRv", "UNBEKANNT");
    const aktenzeichenRehaRv = getValue("aktenzeichenRehaRv");
    const hauptablehnungsgrundRehaRv = getValue("hauptablehnungsgrundRehaRv");
    
    const argumentGesundheitszustandRehaRv = getValue("argumentGesundheitszustandRehaRv");
    const argumentErwerbsfaehigkeitRehaRv = getValue("argumentErwerbsfaehigkeitRehaRv");
    const argumentZieleRehaRv = getValue("argumentZieleRehaRv");
    const ergaenzendeArgumenteRehaRvWiderspruch = getValue("ergaenzendeArgumenteRehaRvWiderspruch");
    const forderungWiderspruchRehaRv = getValue("forderungWiderspruchRehaRv");

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenRehaRvWiderspruch"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtRehaRvWiderspruch" && widerspruchfuehrerIdentischRehaRv === "ja") {}
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesRehaRvWiderspruch = getValue("anlageSonstigesRehaRvWiderspruch");
    if (anlageSonstigesRehaRvWiderspruch.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesRehaRvWiderspruch); }

    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal");
    doc.setFontSize(textFontSize);

    // Absender-Logik (Widerspruchsführer oder Versicherter) & Info-Text ermitteln
    let absenderName = personName;
    let absenderAdresse = personAdresse;
    let infoText = "";

    if (widerspruchfuehrerIdentischRehaRv === 'nein' && wfNameRehaRv.trim() !== "") {
        absenderName = wfNameRehaRv;
        absenderAdresse = wfAdresseRehaRv;
        infoText = `(handelnd für ${personName}, geb. ${personGeburtsFormatiert}, RV-Nr.: ${personRvNummer})`;
    } else {
        infoText = `(RV-Nr.: ${personRvNummer})`;
    }

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

    // Info-Text (RV-Nummer / Vertretung) rechts drunter setzen
    if (infoText !== "") {
        rightY += 2; // Kleiner Abstand nach der Adresse
        doc.setFont(undefined, "italic");
        doc.setFontSize(smallTextFontSize);
        
        // Bricht den Text automatisch um, falls er für die rechte Spalte (60mm) zu lang wird
        let infoLines = doc.splitTextToSize(infoText, 60);
        infoLines.forEach(line => {
            doc.text(line, rightColumnX, rightY);
            rightY += 4; // Kompakter Zeilenabstand für den Info-Text
        });
    }

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (RV-Träger)
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
    
    // Empfänger (RV-Träger) platzieren
    leftY += 6; 
    doc.setFontSize(textFontSize);
    doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
    doc.text(rvTraegerNameWiderspruch, margin, leftY);
    leftY += defaultLineHeight;
    
    rvTraegerAdresseWiderspruch.split("\n").forEach(line => {
        doc.text(line.trim(), margin, leftY);
        leftY += defaultLineHeight;
    });

    // 3. DATUM: Rechtsbündig unterhalb der Blöcke
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    
    // Dynamischer Kollisionsschutz (berechnet aus der tiefsten Spalte)
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für das nachfolgende "Widerspruch gegen..."
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

    // Betreff
    let betreffText = `Widerspruch gegen Ihren Ablehnungsbescheid vom ${datumAblehnungsbescheidRehaRv}`;
    if (aktenzeichenRehaRv.trim() !== "") betreffText += `, Aktenzeichen: ${aktenzeichenRehaRv}`;
    betreffText += `\nBetreffend: Antrag auf ${rehaArtAbgelehnt || 'Rehabilitationsleistungen'} vom ${datumUrsprAntragRehaRv}`;
    betreffText += `\nVersicherte Person: ${personName}, RV-Nr.: ${personRvNummer}`;
    betreffText += `\n- ERNEUTE DRINGENDE AUFFORDERUNG ZUR ÜBERPRÜFUNG UND GENEHMIGUNG -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Bescheid vom ${datumAblehnungsbescheidRehaRv} ein. Mit diesem Bescheid haben Sie den Antrag auf ${rehaArtAbgelehnt || 'Rehabilitationsleistungen'} für ${personName} (Antrag vom ${datumUrsprAntragRehaRv}) ${rehaZielortAbgelehnt.trim() !== "" ? 'in der Einrichtung ' + rehaZielortAbgelehnt + ' ' : ''}abgelehnt oder nur unzureichend bewilligt.`);
    if (widerspruchfuehrerIdentischRehaRv === 'nein' && wfNameRehaRv.trim() !== "") {
        writeParagraph(`Ich, ${wfNameRehaRv}, lege diesen Widerspruch als ${wfVerhaeltnisRehaRv || 'bevollmächtigte Person'} ein.`);
        if (wfVollmachtRehaRv) writeParagraph("Eine entsprechende Vollmacht ist beigefügt.", defaultLineHeight, smallTextFontSize, {fontStyle: "italic"});
    }
    writeParagraph(`Ihre Entscheidung ist für mich nicht nachvollziehbar und wird der dringenden medizinischen Notwendigkeit sowie den Auswirkungen der Gesundheitsstörungen auf die Erwerbsfähigkeit von ${personName} nicht gerecht.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines Widerspruchs:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2; 
    
    if (hauptablehnungsgrundRehaRv.trim() !== "") {
        writeParagraph(`Sie führen in Ihrem Bescheid als Hauptgrund für die Ablehnung an: "${hauptablehnungsgrundRehaRv}". Diese Einschätzung ist aus folgenden Gründen fehlerhaft bzw. unvollständig:`, defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight*0.5});
    }

    if (argumentGesundheitszustandRehaRv.trim() !== "") {
        writeLine("Zur medizinischen Notwendigkeit der Rehabilitation:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(argumentGesundheitszustandRehaRv, defaultLineHeight, textFontSize);
    }

    if (argumentErwerbsfaehigkeitRehaRv.trim() !== "") {
        writeLine("Zu den Auswirkungen auf die Erwerbsfähigkeit und der Unzulänglichkeit anderer Maßnahmen:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(argumentErwerbsfaehigkeitRehaRv, defaultLineHeight, textFontSize);
    }
    
    if (argumentZieleRehaRv.trim() !== "") {
        writeLine("Zu den Zielen der Rehabilitation und deren Erreichbarkeit:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(argumentZieleRehaRv, defaultLineHeight, textFontSize);
    }

    if (ergaenzendeArgumenteRehaRvWiderspruch.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen:", defaultLineHeight, "bold", textFontSize);
        writeParagraph(ergaenzendeArgumenteRehaRvWiderspruch, defaultLineHeight, textFontSize);
    }
    
    writeParagraph("Die beantragte Rehabilitationsmaßnahme ist zwingend erforderlich, um die Erwerbsfähigkeit von ${personName} zu erhalten, wesentlich zu bessern oder wiederherzustellen und somit einen möglichen dauerhaften Leistungsbezug (z.B. Erwerbsminderungsrente) abzuwenden. Dies entspricht dem Grundsatz 'Reha vor Rente'. Die beigefügten ärztlichen Unterlagen stützen diese Einschätzung nachdrücklich.", defaultLineHeight, textFontSize);
    
    // Forderung
    writeLine("Meine Forderung im Widerspruchsverfahren:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchRehaRv.trim() !== "") {
        writeParagraph(forderungWiderspruchRehaRv, defaultLineHeight, textFontSize, {fontStyle:"bold"});
    } else {
        writeParagraph(`Ich fordere Sie daher nachdrücklich auf, Ihren Bescheid vom ${datumAblehnungsbescheidRehaRv} aufzuheben und die beantragte Rehabilitationsmaßnahme (${rehaArtAbgelehnt || 'siehe Antrag'}) ${rehaZielortAbgelehnt.trim() !== "" ? 'in der Einrichtung ' + rehaZielortAbgelehnt + ' ' : ''}umgehend zu genehmigen.`, defaultLineHeight, textFontSize, {fontStyle:"bold"});
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
    writeParagraph(`Bitte bestätigen Sie den Eingang dieses Widerspruchs umgehend schriftlich. Ich erwarte Ihre rechtsmittelfähige Entscheidung über unseren Widerspruch bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, textFontSize);
    writeParagraph("Sollten Sie diesem Widerspruch nicht vollumfänglich abhelfen, behalte ich mir ausdrücklich vor, Klage vor dem Sozialgericht zu erheben.", defaultLineHeight, textFontSize);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("widerspruch_reha_rentenversicherung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchRehaRv");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}