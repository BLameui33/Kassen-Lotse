document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchZahnersatzForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchZE');
    const loadBtn = document.getElementById('loadBtnWiderspruchZE');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchZE');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchZE');
    const storageKey = 'widerspruchZahnersatzFormData';

    // --- Steuerung der dynamischen Widerspruchsführer-Felder ---
    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischZE');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsZE');
    const anlageVollmachtCheckbox = document.getElementById('anlageVollmachtZEWiderspruch'); //Korrekte Checkbox ID

    function updateWiderspruchfuehrerDetailsVisibility() {
        if (widerspruchfuehrerIdentischSelect.value === 'nein') {
            widerspruchfuehrerDetailsDiv.style.display = 'block';
            document.getElementById('wfNameZE').required = true;
            document.getElementById('wfAdresseZE').required = true;
            document.getElementById('wfVerhaeltnisZE').required = true;
            if (anlageVollmachtCheckbox) anlageVollmachtCheckbox.required = true;
        } else {
            widerspruchfuehrerDetailsDiv.style.display = 'none';
            document.getElementById('wfNameZE').required = false;
            document.getElementById('wfAdresseZE').required = false;
            document.getElementById('wfVerhaeltnisZE').required = false;
            if (anlageVollmachtCheckbox) anlageVollmachtCheckbox.required = false;
        }
    }
    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); 
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "vpName", "vpGeburt", "vpAdresse", "vpNummer",
      "widerspruchfuehrerIdentischZE", "wfNameZE", "wfAdresseZE", "wfVerhaeltnisZE",
      "kasseName", "kasseAdresse",
      "datumHkpEinreichung", "datumBescheidZahnersatz", "aktenzeichenZahnersatz", "gegenstandBescheidZahnersatz",
      "argumentFestzuschussHoehe", "argumentHaertefall", "argumentMedizinischeNotwendigkeitSpezifischeVersorgung",
      "ergaenzendeArgumenteZahnersatz", "forderungWiderspruchZahnersatz",
      "anlageSonstigesZahnersatzWiderspruch"
    ];
    const anlagenCheckboxName = "anlagenZahnersatzWiderspruch";

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
      });
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtZE');
      if (wfVollmachtCheckbox) data.wfVollmachtZE = wfVollmachtCheckbox.checked;
      
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
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtZE');
      if (wfVollmachtCheckbox && data.wfVollmachtZE !== undefined) wfVollmachtCheckbox.checked = data.wfVollmachtZE;

      const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
      anlagenCheckboxes.forEach(checkbox => {
        if (data.anlagen && data.anlagen.includes(checkbox.value)) {
            checkbox.checked = true;
        } else if (checkbox) {
            checkbox.checked = false;
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
          // Validierung, ob zumindest eines der spezifischen Argumentationsfelder oder die ergänzende Begründung ausgefüllt ist
          if (document.getElementById("argumentFestzuschussHoehe").value.trim() === "" &&
              document.getElementById("argumentHaertefall").value.trim() === "" &&
              document.getElementById("argumentMedizinischeNotwendigkeitSpezifischeVersorgung").value.trim() === "" &&
              document.getElementById("ergaenzendeArgumenteZahnersatz").value.trim() === "") {
              alert("Bitte geben Sie zumindest in einem der Begründungsfelder Ihre Argumente an.");
              return;
          }
          generateWiderspruchZahnersatzPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWiderspruchZahnersatzPDF() {
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
    const vpName = document.getElementById("vpName").value;
    const vpGeburtInput = document.getElementById("vpGeburt").value;
    const vpGeburtFormatiert = vpGeburtInput ? new Date(vpGeburtInput).toLocaleDateString("de-DE") : 'N/A';
    const vpAdresse = document.getElementById("vpAdresse").value;
    const vpNummer = document.getElementById("vpNummer").value;

    const widerspruchfuehrerIdentischZE = document.getElementById("widerspruchfuehrerIdentischZE").value;
    const wfNameZE = document.getElementById("wfNameZE").value;
    const wfAdresseZE = document.getElementById("wfAdresseZE").value;
    const wfVerhaeltnisZE = document.getElementById("wfVerhaeltnisZE").value;
    const wfVollmachtZE = document.getElementById("wfVollmachtZE") ? document.getElementById("wfVollmachtZE").checked : false;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;
    
    const datumHkpEinreichungInput = document.getElementById("datumHkpEinreichung").value;
    const datumHkpEinreichung = datumHkpEinreichungInput ? new Date(datumHkpEinreichungInput).toLocaleDateString("de-DE") : '(nicht im Detail angegeben)';
    const datumBescheidZahnersatzInput = document.getElementById("datumBescheidZahnersatz").value;
    const datumBescheidZahnersatz = datumBescheidZahnersatzInput ? new Date(datumBescheidZahnersatzInput).toLocaleDateString("de-DE") : 'UNBEKANNT';
    const aktenzeichenZahnersatz = document.getElementById("aktenzeichenZahnersatz").value;
    const gegenstandBescheidZahnersatz = document.getElementById("gegenstandBescheidZahnersatz").value;
    
    const argumentFestzuschussHoehe = document.getElementById("argumentFestzuschussHoehe").value;
    const argumentHaertefall = document.getElementById("argumentHaertefall").value;
    const argumentMedizinischeNotwendigkeitSpezifischeVersorgung = document.getElementById("argumentMedizinischeNotwendigkeitSpezifischeVersorgung").value;
    const ergaenzendeArgumenteZahnersatz = document.getElementById("ergaenzendeArgumenteZahnersatz").value;
    const forderungWiderspruchZahnersatz = document.getElementById("forderungWiderspruchZahnersatz").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenZahnersatzWiderspruch"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtZEWiderspruch" && widerspruchfuehrerIdentischZE === "ja") {
            // Nicht hinzufügen
        } else {
             anlagen.push(checkbox.value);
        }
    });
    const anlageSonstigesZahnersatzWiderspruch = document.getElementById("anlageSonstigesZahnersatzWiderspruch").value;
    if (anlageSonstigesZahnersatzWiderspruch.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesZahnersatzWiderspruch); }

    // --- PDF-Inhalt erstellen ---
   doc.setFontSize(11);

    // Absender-Logik (Widerspruchsführer ZE oder Versicherter) & Info-Text ermitteln
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    let infoText = "";

    if (widerspruchfuehrerIdentischZE === 'nein' && wfNameZE.trim() !== "") {
        absenderName = wfNameZE;
        absenderAdresse = wfAdresseZE;
        infoText = `(handelnd für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`;
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
    doc.setFontSize(11);
    doc.text(absenderName, rightColumnX, rightY);
    rightY += defaultLineHeight;
    
    absenderAdresse.split("\n").forEach(line => {
        doc.text(line.trim(), rightColumnX, rightY);
        rightY += defaultLineHeight;
    });

    // Zusatz-Info rechts drunter setzen, falls ein abweichender Widerspruchsführer aktiv ist
    if (infoText !== "") {
        rightY += 2; // Kleiner Abstand nach der Adresse
        doc.setFont(undefined, "italic");
        doc.setFontSize(9);
        
        // Bricht den Text automatisch um, falls er für die rechte Spalte (60mm) zu lang wird
        let infoLines = doc.splitTextToSize(infoText, 60);
        infoLines.forEach(line => {
            doc.text(line, rightColumnX, rightY);
            rightY += 4; // Kompakter Zeilenabstand für den Info-Text
        });
    }

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
    
    // Kollisionsschutz (gleicht asymmetrische Spaltenhöhen perfekt aus)
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Inhalt
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

    // Betreff
    let betreffText = `Widerspruch gegen Ihren Bescheid vom ${datumBescheidZahnersatz} zum Heil- und Kostenplan für Zahnersatz`;
    if (aktenzeichenZahnersatz.trim() !== "") betreffText += `, Az.: ${aktenzeichenZahnersatz}`;
    betreffText += `\nVersicherte Person: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer}`;
    if (datumHkpEinreichungInput.trim() !== "") betreffText += `\nUrsprünglicher HKP eingereicht am/vom: ${datumHkpEinreichung}`;
    betreffText += `\n- ANTRAG AUF NEUBEWERTUNG UND KORREKTE FESTSETZUNG DES ZUSCHUSSES -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich fristgerecht Widerspruch gegen Ihren oben genannten Bescheid vom ${datumBescheidZahnersatz} ein, mit dem Sie über den Festzuschuss zu dem von ${document.getElementById("zahnarztNameHkp") ? document.getElementById("zahnarztNameHkp").value || 'meinem Zahnarzt/meiner Zahnärztin' : 'meinem Zahnarzt/meiner Zahnärztin'} erstellten Heil- und Kostenplan entschieden haben.`);
    if (widerspruchfuehrerIdentischZE === 'nein' && wfNameZE.trim() !== "") {
        writeParagraph(`Ich, ${wfNameZE}, lege diesen Widerspruch als ${wfVerhaeltnisZE || 'bevollmächtigte Person'} für ${vpName} ein.`);
        if (wfVollmachtZE) writeParagraph("Eine entsprechende Vollmacht liegt bei bzw. wird kurzfristig nachgereicht.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    writeParagraph(`Die von Ihnen getroffene Festsetzung bezüglich "${gegenstandBescheidZahnersatz || 'des Zuschusses / der Härtefallregelung'}" ist aus meiner Sicht nicht korrekt und bedarf einer dringenden Überprüfung.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    if (argumentFestzuschussHoehe.trim() !== "") {
        writeLine("Zur Höhe des Festzuschusses:", defaultLineHeight, true, 10);
        writeParagraph(argumentFestzuschussHoehe, defaultLineHeight, 11);
    }

    if (argumentHaertefall.trim() !== "") {
        writeLine("Zur Anwendung der Härtefallregelung:", defaultLineHeight, true, 10);
        writeParagraph(argumentHaertefall, defaultLineHeight, 11);
    }
    
    if (argumentMedizinischeNotwendigkeitSpezifischeVersorgung.trim() !== "") {
        writeLine("Zur medizinischen Notwendigkeit der gewählten Versorgung:", defaultLineHeight, true, 10);
        writeParagraph(argumentMedizinischeNotwendigkeitSpezifischeVersorgung, defaultLineHeight, 11);
    }

    if (ergaenzendeArgumenteZahnersatz.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen:", defaultLineHeight, true, 10);
        writeParagraph(ergaenzendeArgumenteZahnersatz, defaultLineHeight, 11);
    }
    
    writeParagraph("Ich bitte Sie, die Berechnungsgrundlagen und die von mir eingereichten Unterlagen (insbesondere Bonusheft, ggf. Einkommensnachweise und zahnärztliche Stellungnahmen) erneut sorgfältig zu prüfen. Es ist für mich von großer Bedeutung, die notwendige zahnmedizinische Versorgung zu erhalten und dabei die zustehenden Zuschüsse in korrekter Höhe zu bekommen.", defaultLineHeight, 11);
    
    // Forderung
    writeLine("Meine Forderung im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchZahnersatz.trim() !== "") {
        writeParagraph(forderungWiderspruchZahnersatz);
    } else {
        writeParagraph(`Ich beantrage daher nachdrücklich, Ihren Bescheid vom ${datumBescheidZahnersatz} zu korrigieren und den Festzuschuss entsprechend meiner Begründung neu und korrekt festzusetzen bzw. die Härtefallregelung anzuerkennen.`, defaultLineHeight, 11, {fontStyle:"bold"});
    }
    
    // Anlagen
    if (anlagen.length > 0) {
        writeLine("Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }

    // Abschluss mit Fristsetzung
    const fristsetzungDatumText = new Date(Date.now() + 3 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE"); 
    writeParagraph(`Bitte bestätigen Sie mir den Eingang dieses Widerspruchs umgehend schriftlich. Ich erwarte Ihre rechtsmittelfähige Entscheidung über diesen Widerspruch bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, 11);
    writeParagraph("Sollten Sie meinem Widerspruch nicht vollumfänglich abhelfen, behalte ich mir ausdrücklich vor, Klage vor dem Sozialgericht zu erheben.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("widerspruch_zahnersatz.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchZE");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}