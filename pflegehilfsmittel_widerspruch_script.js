document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchPflegeHMForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchPflegeHM');
    const loadBtn = document.getElementById('loadBtnWiderspruchPflegeHM');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchPflegeHM');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchPflegeHM');
    const storageKey = 'widerspruchPflegeHMFormData';

    // --- Steuerung der dynamischen Widerspruchsführer-Felder ---
    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischPflegeHM');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsPflegeHM');
    const anlageVollmachtCheckbox = document.getElementById('anlageVollmachtPflegeHMWiderspruch');

    function updateWiderspruchfuehrerDetailsVisibility() {
        const isNotIdentical = widerspruchfuehrerIdentischSelect.value === 'nein';
        widerspruchfuehrerDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        document.getElementById('wfNamePflegeHM').required = isNotIdentical;
        document.getElementById('wfAdressePflegeHM').required = isNotIdentical;
        document.getElementById('wfVerhaeltnisPflegeHM').required = isNotIdentical;
        if (anlageVollmachtCheckbox) anlageVollmachtCheckbox.required = isNotIdentical;
    }
    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); 
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpPflegegrad",
      "widerspruchfuehrerIdentischPflegeHM", "wfNamePflegeHM", "wfAdressePflegeHM", "wfVerhaeltnisPflegeHM",
      "pflegekasseName", "pflegekasseAdresse",
      "datumUrsprAntragPflegeHM", "beantragtesPflegeHMAbgelehnt", 
      "datumAblehnungsbescheidPflegeHM", "aktenzeichenPflegeHM", "hauptablehnungsgrundPflegeHM",
      "argumentNotwendigkeitPflegeHM", "argumentKeineAlternativenPflegeHM", "ergaenzendeArgumentePflegeHM",
      "forderungWiderspruchPflegeHM", "anlageSonstigesPflegeHMWiderspruch"
    ];
    const anlagenCheckboxName = "anlagenPflegeHMWiderspruch";

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
      });
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtPflegeHM');
      if (wfVollmachtCheckbox) data.wfVollmachtPflegeHM = wfVollmachtCheckbox.checked;
      
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
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtPflegeHM');
      if (wfVollmachtCheckbox && data.wfVollmachtPflegeHM !== undefined) wfVollmachtCheckbox.checked = data.wfVollmachtPflegeHM;

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
          if (document.getElementById("argumentNotwendigkeitPflegeHM").value.trim() === "" &&
              document.getElementById("ergaenzendeArgumentePflegeHM").value.trim() === "") {
              alert("Bitte geben Sie zumindest eine Begründung für Ihren Widerspruch an (zur Notwendigkeit oder als ergänzende Argumente).");
              return;
          }
          generatePflegeHMWiderspruchPDF();
        });
    }
}); // Ende DOMContentLoaded

function generatePflegeHMWiderspruchPDF() {
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
    const vpPflegegrad = document.getElementById("vpPflegegrad").value;

    const widerspruchfuehrerIdentischPflegeHM = document.getElementById("widerspruchfuehrerIdentischPflegeHM").value;
    const wfNamePflegeHM = document.getElementById("wfNamePflegeHM").value;
    const wfAdressePflegeHM = document.getElementById("wfAdressePflegeHM").value;
    const wfVerhaeltnisPflegeHM = document.getElementById("wfVerhaeltnisPflegeHM").value;
    const wfVollmachtPflegeHM = document.getElementById("wfVollmachtPflegeHM") ? document.getElementById("wfVollmachtPflegeHM").checked : false;

    const pflegekasseName = document.getElementById("pflegekasseName").value;
    const pflegekasseAdresse = document.getElementById("pflegekasseAdresse").value;
    
    const datumUrsprAntragPflegeHMInput = document.getElementById("datumUrsprAntragPflegeHM").value;
    const datumUrsprAntragPflegeHM = datumUrsprAntragPflegeHMInput ? new Date(datumUrsprAntragPflegeHMInput).toLocaleDateString("de-DE") : 'N/A';
    const beantragtesPflegeHMAbgelehnt = document.getElementById("beantragtesPflegeHMAbgelehnt").value;
    const datumAblehnungsbescheidPflegeHMInput = document.getElementById("datumAblehnungsbescheidPflegeHM").value;
    const datumAblehnungsbescheidPflegeHM = datumAblehnungsbescheidPflegeHMInput ? new Date(datumAblehnungsbescheidPflegeHMInput).toLocaleDateString("de-DE") : 'UNBEKANNT';
    const aktenzeichenPflegeHM = document.getElementById("aktenzeichenPflegeHM").value;
    const hauptablehnungsgrundPflegeHM = document.getElementById("hauptablehnungsgrundPflegeHM").value;
    
    const argumentNotwendigkeitPflegeHM = document.getElementById("argumentNotwendigkeitPflegeHM").value;
    const argumentKeineAlternativenPflegeHM = document.getElementById("argumentKeineAlternativenPflegeHM").value;
    const ergaenzendeArgumentePflegeHM = document.getElementById("ergaenzendeArgumentePflegeHM").value;
    const forderungWiderspruchPflegeHM = document.getElementById("forderungWiderspruchPflegeHM").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenPflegeHMWiderspruch"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtPflegeHMWiderspruch" && widerspruchfuehrerIdentischPflegeHM === "ja") {
            // Nicht hinzufügen
        } else {
             anlagen.push(checkbox.value);
        }
    });
    const anlageSonstigesPflegeHMWiderspruch = document.getElementById("anlageSonstigesPflegeHMWiderspruch").value;
    if (anlageSonstigesPflegeHMWiderspruch.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesPflegeHMWiderspruch); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    if (widerspruchfuehrerIdentischPflegeHM === 'nein' && wfNamePflegeHM.trim() !== "") {
        absenderName = wfNamePflegeHM;
        absenderAdresse = wfAdressePflegeHM;
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line));
    if (widerspruchfuehrerIdentischPflegeHM === 'nein' && wfNamePflegeHM.trim() !== ""){
         writeParagraph(`(handelnd für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`, defaultLineHeight, 9, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    }
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger, Datum (Standard)
    writeLine(pflegekasseName);
    pflegekasseAdresse.split("\n").forEach(line => writeLine(line));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    // Betreff
    let betreffText = `Widerspruch gegen Ihren Ablehnungsbescheid vom ${datumAblehnungsbescheidPflegeHM} betreffend Pflegehilfsmittel`;
    if (aktenzeichenPflegeHM.trim() !== "") betreffText += `, Az.: ${aktenzeichenPflegeHM}`;
    betreffText += `\nFür: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer}`;
    betreffText += `\nUrsprünglicher Antrag vom: ${datumUrsprAntragPflegeHM} für: "${beantragtesPflegeHMAbgelehnt || 'nicht spezifiziert'}"`;
    betreffText += `\n- DRINGENDE AUFFORDERUNG ZUR GENEHMIGUNG DER NOTWENDIGEN PFLEGEHILFSMITTEL -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich/legen wir fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Bescheid vom ${datumAblehnungsbescheidPflegeHM} ein. Mit diesem Bescheid haben Sie den Antrag vom ${datumUrsprAntragPflegeHM} auf Kostenübernahme für "${beantragtesPflegeHMAbgelehnt || 'die beantragten Pflegehilfsmittel'}" für Herrn/Frau ${vpName} abgelehnt bzw. nur teilweise genehmigt.`);
    if (widerspruchfuehrerIdentischPflegeHM === 'nein' && wfNamePflegeHM.trim() !== "") {
        writeParagraph(`Ich, ${wfNamePflegeHM}, lege diesen Widerspruch als ${wfVerhaeltnisPflegeHM || 'bevollmächtigte Person'} ein.`);
        if (wfVollmachtPflegeHM) writeParagraph("Eine entsprechende Vollmacht/Bestallungsurkunde ist beigefügt.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    writeParagraph(`Ihre Entscheidung ist für uns nicht nachvollziehbar und berücksichtigt nicht ausreichend den tatsächlichen Bedarf zur Erleichterung der Pflege und zur Sicherung einer menschenwürdigen Versorgung.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines/unseres Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    if (hauptablehnungsgrundPflegeHM.trim() !== "") {
        writeParagraph(`Sie begründen Ihre Ablehnung im Wesentlichen mit: "${hauptablehnungsgrundPflegeHM}". Diese Begründung ist aus folgenden Gründen nicht stichhaltig:`, defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight*0.5});
    }

    if (argumentNotwendigkeitPflegeHM.trim() !== "") {
        writeLine("Zur Notwendigkeit des/der beantragten Pflegehilfsmittel:", defaultLineHeight, true, 10);
        writeParagraph(argumentNotwendigkeitPflegeHM, defaultLineHeight, 11);
    }

    if (argumentKeineAlternativenPflegeHM.trim() !== "") {
        writeLine("Zur Angemessenheit und Alternativlosigkeit:", defaultLineHeight, true, 10);
        writeParagraph(argumentKeineAlternativenPflegeHM, defaultLineHeight, 11);
    }
    
    if (ergaenzendeArgumentePflegeHM.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen:", defaultLineHeight, true, 10);
        writeParagraph(ergaenzendeArgumentePflegeHM, defaultLineHeight, 11);
    }
    
    writeParagraph(`Die Versorgung mit den beantragten Pflegehilfsmitteln ist gemäß § 40 SGB XI unerlässlich, um die häusliche Pflege von Herrn/Frau ${vpName} (${vpPflegegrad || 'unbekannt'}) zu erleichtern, seine/ihre Beschwerden zu lindern und ihm/ihr eine möglichst selbstständige Lebensführung zu ermöglichen. Eine Verweigerung dieser Hilfsmittel würde die Pflegesituation erheblich erschweren und ist nicht hinnehmbar.`, defaultLineHeight, 11);
    
    // Forderung
    writeLine("Meine/Unsere Forderung im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchPflegeHM.trim() !== "") {
        writeParagraph(forderungWiderspruchPflegeHM);
    } else {
        writeParagraph(`Ich/Wir fordern Sie daher nachdrücklich auf, Ihren Ablehnungsbescheid vom ${datumAblehnungsbescheidPflegeHM} aufzuheben und die Kosten für die beantragten Pflegehilfsmittel ("${beantragtesPflegeHMAbgelehnt || 'siehe Antrag'}") vollumfänglich zu übernehmen bzw. die Pauschale zu gewähren.`, defaultLineHeight, 11, {fontStyle:"bold"});
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
    writeParagraph(`Bitte bestätigen Sie uns den Eingang dieses Widerspruchs umgehend schriftlich. Wir erwarten Ihre rechtsmittelfähige Entscheidung über unseren Widerspruch bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, 11);
    writeParagraph("Sollten Sie unserem Widerspruch nicht vollumfänglich abhelfen, behalten wir uns ausdrücklich vor, weitere rechtliche Schritte einzuleiten.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("widerspruch_pflegehilfsmittel.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchPflegeHM");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}