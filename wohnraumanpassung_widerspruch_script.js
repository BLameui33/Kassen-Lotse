document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchWohnraumanpassungForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchWohn');
    const loadBtn = document.getElementById('loadBtnWiderspruchWohn');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchWohn');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchWohn');
    const storageKey = 'widerspruchWohnraumanpassungFormData';

    // --- Steuerung der dynamischen Widerspruchsführer-Felder ---
    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischWohn');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsWohn');
    const anlageVollmachtCheckbox = document.getElementById('anlageVollmachtWohnWiderspruch');

    function updateWiderspruchfuehrerDetailsVisibility() {
        const isNotIdentical = widerspruchfuehrerIdentischSelect.value === 'nein';
        widerspruchfuehrerDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        document.getElementById('wfNameWohn').required = isNotIdentical;
        document.getElementById('wfAdresseWohn').required = isNotIdentical;
        document.getElementById('wfVerhaeltnisWohn').required = isNotIdentical;
        if (anlageVollmachtCheckbox) anlageVollmachtCheckbox.required = isNotIdentical;
    }
    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); 
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpPflegegrad",
      "widerspruchfuehrerIdentischWohn", "wfNameWohn", "wfAdresseWohn", "wfVerhaeltnisWohn",
      "pflegekasseName", "pflegekasseAdresse",
      "datumUrsprAntragWohn", "massnahmeAbgelehntWohn", 
      "datumAblehnungsbescheidWohn", "aktenzeichenWohn", "hauptablehnungsgrundWohn",
      "argumentNotwendigkeitWohn", "argumentKeineAlternativenWohn", "argumentVerhaeltnismaessigkeitKostenWohn",
      "ergaenzendeArgumenteWohn", "forderungWiderspruchWohn", "anlageSonstigesWohnWiderspruch"
    ];
    const anlagenCheckboxName = "anlagenWohnWiderspruch";

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
      });
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtWohn');
      if (wfVollmachtCheckbox) data.wfVollmachtWohn = wfVollmachtCheckbox.checked;
      
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
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtWohn');
      if (wfVollmachtCheckbox && data.wfVollmachtWohn !== undefined) wfVollmachtCheckbox.checked = data.wfVollmachtWohn;

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
          if (document.getElementById("argumentNotwendigkeitWohn").value.trim() === "" &&
              document.getElementById("ergaenzendeArgumenteWohn").value.trim() === "") {
              alert("Bitte geben Sie zumindest eine Begründung für Ihren Widerspruch an (zur Notwendigkeit der Maßnahme oder als ergänzende Argumente).");
              return;
          }
          generateWohnWiderspruchPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWohnWiderspruchPDF() {
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

    const widerspruchfuehrerIdentischWohn = document.getElementById("widerspruchfuehrerIdentischWohn").value;
    const wfNameWohn = document.getElementById("wfNameWohn").value;
    const wfAdresseWohn = document.getElementById("wfAdresseWohn").value;
    const wfVerhaeltnisWohn = document.getElementById("wfVerhaeltnisWohn").value;
    const wfVollmachtWohn = document.getElementById("wfVollmachtWohn") ? document.getElementById("wfVollmachtWohn").checked : false;

    const pflegekasseName = document.getElementById("pflegekasseName").value;
    const pflegekasseAdresse = document.getElementById("pflegekasseAdresse").value;
    
    const datumUrsprAntragWohnInput = document.getElementById("datumUrsprAntragWohn").value;
    const datumUrsprAntragWohn = datumUrsprAntragWohnInput ? new Date(datumUrsprAntragWohnInput).toLocaleDateString("de-DE") : 'N/A';
    const massnahmeAbgelehntWohn = document.getElementById("massnahmeAbgelehntWohn").value;
    const datumAblehnungsbescheidWohnInput = document.getElementById("datumAblehnungsbescheidWohn").value;
    const datumAblehnungsbescheidWohn = datumAblehnungsbescheidWohnInput ? new Date(datumAblehnungsbescheidWohnInput).toLocaleDateString("de-DE") : 'UNBEKANNT';
    const aktenzeichenWohn = document.getElementById("aktenzeichenWohn").value;
    const hauptablehnungsgrundWohn = document.getElementById("hauptablehnungsgrundWohn").value;
    
    const argumentNotwendigkeitWohn = document.getElementById("argumentNotwendigkeitWohn").value;
    const argumentKeineAlternativenWohn = document.getElementById("argumentKeineAlternativenWohn").value;
    const argumentVerhaeltnismaessigkeitKostenWohn = document.getElementById("argumentVerhaeltnismaessigkeitKostenWohn").value;
    const ergaenzendeArgumenteWohn = document.getElementById("ergaenzendeArgumenteWohn").value;
    const forderungWiderspruchWohn = document.getElementById("forderungWiderspruchWohn").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenWohnWiderspruch"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtWohnWiderspruch" && widerspruchfuehrerIdentischWohn === "ja") { /* nicht hinzufügen */ }
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesWohnWiderspruch = document.getElementById("anlageSonstigesWohnWiderspruch").value;
    if (anlageSonstigesWohnWiderspruch.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesWohnWiderspruch); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    if (widerspruchfuehrerIdentischWohn === 'nein' && wfNameWohn.trim() !== "") {
        absenderName = wfNameWohn;
        absenderAdresse = wfAdresseWohn;
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line));
    if (widerspruchfuehrerIdentischWohn === 'nein' && wfNameWohn.trim() !== ""){
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
    let betreffText = `Widerspruch gegen Ihren Ablehnungsbescheid vom ${datumAblehnungsbescheidWohn} betreffend Zuschuss für wohnumfeldverbessernde Maßnahmen`;
    if (aktenzeichenWohn.trim() !== "") betreffText += `, Az.: ${aktenzeichenWohn}`;
    betreffText += `\nFür: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer}`;
    betreffText += `\nUrsprünglicher Antrag vom: ${datumUrsprAntragWohn} für: "${massnahmeAbgelehntWohn || 'nicht spezifiziert'}"`;
    betreffText += `\n- DRINGENDE AUFFORDERUNG ZUR NEUBEWERTUNG UND GENEHMIGUNG DES ZUSCHUSSES -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich/legen wir fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Bescheid vom ${datumAblehnungsbescheidWohn} ein. Mit diesem Bescheid haben Sie den Antrag vom ${datumUrsprAntragWohn} auf einen Zuschuss für wohnumfeldverbessernde Maßnahmen (konkret für: "${massnahmeAbgelehntWohn || 'die beantragten Maßnahmen'}") für Herrn/Frau ${vpName} abgelehnt oder nur unzureichend bewilligt.`);
    if (widerspruchfuehrerIdentischWohn === 'nein' && wfNameWohn.trim() !== "") {
        writeParagraph(`Ich, ${wfNameWohn}, lege diesen Widerspruch als ${wfVerhaeltnisWohn || 'bevollmächtigte Person'} ein.`);
        if (wfVollmachtWohn) writeParagraph("Eine entsprechende Vollmacht ist beigefügt.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    writeParagraph(`Ihre Entscheidung ist für uns nicht nachvollziehbar und verkennt die dringende Notwendigkeit der beantragten Maßnahmen zur Ermöglichung bzw. Erleichterung der häuslichen Pflege und zur Förderung der Selbstständigkeit von Herrn/Frau ${vpName}.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines/unseres Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    if (hauptablehnungsgrundWohn.trim() !== "") {
        writeParagraph(`Sie führen in Ihrem Bescheid als Hauptgrund für die Ablehnung an: "${hauptablehnungsgrundWohn}". Diese Einschätzung teilen wir nicht und begründen dies wie folgt:`, defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight*0.5});
    }

    if (argumentNotwendigkeitWohn.trim() !== "") {
        writeLine("Zur Notwendigkeit der beantragten Maßnahme(n):", defaultLineHeight, true, 10);
        writeParagraph(argumentNotwendigkeitWohn, defaultLineHeight, 11);
    }

    if (argumentKeineAlternativenWohn.trim() !== "") {
        writeLine("Zur Geeignetheit und Alternativlosigkeit der Maßnahme(n):", defaultLineHeight, true, 10);
        writeParagraph(argumentKeineAlternativenWohn, defaultLineHeight, 11);
    }
    
    if (argumentVerhaeltnismaessigkeitKostenWohn.trim() !== "") {
        writeLine("Zur Verhältnismäßigkeit der Kosten:", defaultLineHeight, true, 10);
        writeParagraph(argumentVerhaeltnismaessigkeitKostenWohn, defaultLineHeight, 11);
    }

    if (ergaenzendeArgumenteWohn.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen:", defaultLineHeight, true, 10);
        writeParagraph(ergaenzendeArgumenteWohn, defaultLineHeight, 11);
    }
    
    writeParagraph(`Die beantragten wohnumfeldverbessernden Maßnahmen sind gemäß § 40 Abs. 4 SGB XI zwingend erforderlich, um die Pflegesituation von Herrn/Frau ${vpName} (${vpPflegegrad || 'bitte angeben'}) im häuslichen Umfeld zu stabilisieren und eine drohende Verschlechterung oder gar eine Heimunterbringung zu vermeiden. Die Maßnahmen tragen maßgeblich zur Entlastung der Pflegepersonen und zur Erhaltung der Selbstständigkeit bei.`, defaultLineHeight, 11);
    
    // Forderung
    writeLine("Meine/Unsere Forderung im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchWohn.trim() !== "") {
        writeParagraph(forderungWiderspruchWohn);
    } else {
        writeParagraph(`Ich/Wir fordern Sie daher nachdrücklich auf, Ihren Ablehnungsbescheid vom ${datumAblehnungsbescheidWohn} zu revidieren und den Zuschuss für die beantragten wohnumfeldverbessernden Maßnahmen ("${massnahmeAbgelehntWohn || 'siehe Antrag'}") in der gesetzlich vorgesehenen Höhe (bis zu 4.000 Euro bzw. bei mehreren Pflegebedürftigen im Haushalt entsprechend höher) zu gewähren.`, defaultLineHeight, 11, {fontStyle:"bold"});
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
    writeParagraph("Sollten Sie unserem Widerspruch nicht vollumfänglich abhelfen, behalten wir uns ausdrücklich vor, Klage vor dem Sozialgericht zu erheben.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("widerspruch_wohnraumanpassung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchWohn");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}