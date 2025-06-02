document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchVerhinderungspflegeForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchVP');
    const loadBtn = document.getElementById('loadBtnWiderspruchVP');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchVP');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchVP');
    const storageKey = 'widerspruchVerhinderungspflegeFormData';

    // --- Steuerung der dynamischen Widerspruchsführer-Felder ---
    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischVP');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsVP');
    const anlageVollmachtCheckbox = document.getElementById('anlageVollmachtVPWiderspruch');

    function updateWiderspruchfuehrerDetailsVisibility() {
        const isNotIdentical = widerspruchfuehrerIdentischSelect.value === 'nein';
        widerspruchfuehrerDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        document.getElementById('wfNameVP').required = isNotIdentical;
        document.getElementById('wfAdresseVP').required = isNotIdentical;
        document.getElementById('wfVerhaeltnisVP').required = isNotIdentical;
        if (anlageVollmachtCheckbox) anlageVollmachtCheckbox.required = isNotIdentical;
    }
    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); 
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpPflegegrad",
      "widerspruchfuehrerIdentischVP", "wfNameVP", "wfAdresseVP", "wfVerhaeltnisVP",
      "pflegekasseName", "pflegekasseAdresse",
      "datumUrsprAntragVP", "zeitraumVPGeltendGemacht", "personErsatzpflegeAbgelehnt",
      "datumAblehnungsbescheidVP", "aktenzeichenVP", "hauptablehnungsgrundVP",
      "argumentVorpflegezeitErfuelltVP", "argumentKostenberechnungVP", "argumentNotwendigkeitVerhinderungVP",
      "ergaenzendeArgumenteVP", "forderungWiderspruchVP", "anlageSonstigesVPWiderspruch"
    ];
    const anlagenCheckboxName = "anlagenVerhinderungspflegeWiderspruch";

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
      });
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtVP');
      if (wfVollmachtCheckbox) data.wfVollmachtVP = wfVollmachtCheckbox.checked;
      
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
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtVP');
      if (wfVollmachtCheckbox && data.wfVollmachtVP !== undefined) wfVollmachtCheckbox.checked = data.wfVollmachtVP;

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
          // Einfache Validierung, ob zumindest eines der Haupt-Begründungsfelder ausgefüllt ist
          if (document.getElementById("argumentVorpflegezeitErfuelltVP").value.trim() === "" &&
              document.getElementById("argumentKostenberechnungVP").value.trim() === "" &&
              document.getElementById("argumentNotwendigkeitVerhinderungVP").value.trim() === "" &&
              document.getElementById("ergaenzendeArgumenteVP").value.trim() === "" ) {
              alert("Bitte geben Sie zumindest in einem der spezifischen Felder oder im Feld für ergänzende Argumente eine Begründung für Ihren Widerspruch an.");
              return;
          }
          generateVPWiderspruchPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateVPWiderspruchPDF() {
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

    const widerspruchfuehrerIdentischVP = document.getElementById("widerspruchfuehrerIdentischVP").value;
    const wfNameVP = document.getElementById("wfNameVP").value;
    const wfAdresseVP = document.getElementById("wfAdresseVP").value;
    const wfVerhaeltnisVP = document.getElementById("wfVerhaeltnisVP").value;
    const wfVollmachtVP = document.getElementById("wfVollmachtVP") ? document.getElementById("wfVollmachtVP").checked : false;

    const pflegekasseName = document.getElementById("pflegekasseName").value;
    const pflegekasseAdresse = document.getElementById("pflegekasseAdresse").value;
    
    const datumUrsprAntragVPInput = document.getElementById("datumUrsprAntragVP").value;
    const datumUrsprAntragVP = datumUrsprAntragVPInput ? new Date(datumUrsprAntragVPInput).toLocaleDateString("de-DE") : 'N/A';
    const zeitraumVPGeltendGemacht = document.getElementById("zeitraumVPGeltendGemacht").value;
    const personErsatzpflegeAbgelehnt = document.getElementById("personErsatzpflegeAbgelehnt").value;
    const datumAblehnungsbescheidVPInput = document.getElementById("datumAblehnungsbescheidVP").value;
    const datumAblehnungsbescheidVP = datumAblehnungsbescheidVPInput ? new Date(datumAblehnungsbescheidVPInput).toLocaleDateString("de-DE") : 'UNBEKANNT';
    const aktenzeichenVP = document.getElementById("aktenzeichenVP").value;
    const hauptablehnungsgrundVP = document.getElementById("hauptablehnungsgrundVP").value;
    
    const argumentVorpflegezeitErfuelltVP = document.getElementById("argumentVorpflegezeitErfuelltVP").value;
    const argumentKostenberechnungVP = document.getElementById("argumentKostenberechnungVP").value;
    const argumentNotwendigkeitVerhinderungVP = document.getElementById("argumentNotwendigkeitVerhinderungVP").value;
    const ergaenzendeArgumenteVP = document.getElementById("ergaenzendeArgumenteVP").value;
    const forderungWiderspruchVP = document.getElementById("forderungWiderspruchVP").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenVerhinderungspflegeWiderspruch"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtVPWiderspruch" && widerspruchfuehrerIdentischVP === "ja") { /* nicht hinzufügen */ }
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesVPWiderspruch = document.getElementById("anlageSonstigesVPWiderspruch").value;
    if (anlageSonstigesVPWiderspruch.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesVPWiderspruch); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    if (widerspruchfuehrerIdentischVP === 'nein' && wfNameVP.trim() !== "") {
        absenderName = wfNameVP;
        absenderAdresse = wfAdresseVP;
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line));
    if (widerspruchfuehrerIdentischVP === 'nein' && wfNameVP.trim() !== ""){
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
    let betreffText = `Widerspruch gegen Ihren Bescheid vom ${datumAblehnungsbescheidVP} betreffend Leistungen der Verhinderungspflege`;
    if (aktenzeichenVP.trim() !== "") betreffText += `, Az.: ${aktenzeichenVP}`;
    betreffText += `\nFür: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer} (${vpPflegegrad})`;
    betreffText += `\nUrsprünglicher Antrag/Abrechnung vom: ${datumUrsprAntragVP} für den Zeitraum: ${zeitraumVPGeltendGemacht || 'N/A'}`;
    betreffText += `\n- ERNEUTE DRINGENDE AUFFORDERUNG ZUR ÜBERPRÜFUNG UND LEISTUNGSGEWÄHRUNG -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich/legen wir fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Bescheid vom ${datumAblehnungsbescheidVP} ein. Mit diesem Bescheid haben Sie den Antrag/die Abrechnung vom ${datumUrsprAntragVP} auf Leistungen der Verhinderungspflege für Herrn/Frau ${vpName} im Zeitraum ${zeitraumVPGeltendGemacht || 'N/A'} ${personErsatzpflegeAbgelehnt.trim() !== "" ? ' (durchgeführt von ' + personErsatzpflegeAbgelehnt + ')' : ''} abgelehnt oder nur unzureichend anerkannt.`);
    if (widerspruchfuehrerIdentischVP === 'nein' && wfNameVP.trim() !== "") {
        writeParagraph(`Ich, ${wfNameVP}, lege diesen Widerspruch als ${wfVerhaeltnisVP || 'bevollmächtigte Person'} ein.`);
        if (wfVollmachtVP) writeParagraph("Eine entsprechende Vollmacht ist beigefügt.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    writeParagraph(`Ihre Entscheidung ist für uns nicht nachvollziehbar und berücksichtigt nicht ausreichend die gesetzlichen Ansprüche sowie die dringende Notwendigkeit dieser Entlastungsleistung für die Hauptpflegeperson und die Sicherstellung der Pflege.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines/unseres Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    if (hauptablehnungsgrundVP.trim() !== "") {
        writeParagraph(`Sie führen in Ihrem Bescheid als Hauptgrund für die Ablehnung/Kürzung an: "${hauptablehnungsgrundVP}". Diese Begründung ist aus folgenden Gründen nicht haltbar bzw. unzutreffend:`, defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight*0.5});
    }

    if (argumentVorpflegezeitErfuelltVP.trim() !== "") {
        writeLine("Zur Erfüllung der Vorpflegezeit:", defaultLineHeight, true, 10);
        writeParagraph(argumentVorpflegezeitErfuelltVP, defaultLineHeight, 11);
    }
    if (argumentKostenberechnungVP.trim() !== "") {
        writeLine("Zur Angemessenheit/Notwendigkeit der geltend gemachten Kosten:", defaultLineHeight, true, 10);
        writeParagraph(argumentKostenberechnungVP, defaultLineHeight, 11);
    }
    if (argumentNotwendigkeitVerhinderungVP.trim() !== "") {
        writeLine("Zur Notwendigkeit der Verhinderung der Hauptpflegeperson:", defaultLineHeight, true, 10);
        writeParagraph(argumentNotwendigkeitVerhinderungVP, defaultLineHeight, 11);
    }
    if (ergaenzendeArgumenteVP.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen:", defaultLineHeight, true, 10);
        writeParagraph(ergaenzendeArgumenteVP, defaultLineHeight, 11);
    }
    
    writeParagraph(`Die Inanspruchnahme von Verhinderungspflege gemäß § 39 SGB XI ist für die Aufrechterhaltung der häuslichen Pflegesituation und zur Entlastung der Hauptpflegeperson von entscheidender Bedeutung. Die Voraussetzungen hierfür sind in unserem Fall vollumfänglich erfüllt.`, defaultLineHeight, 11);
    
    // Forderung
    writeLine("Meine/Unsere Forderung im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchVP.trim() !== "") {
        writeParagraph(forderungWiderspruchVP);
    } else {
        writeParagraph(`Ich/Wir fordern Sie daher nachdrücklich auf, Ihren Bescheid vom ${datumAblehnungsbescheidVP} zu revidieren und die Kosten für die in Anspruch genommene Verhinderungspflege im beantragten bzw. gesetzlich vorgesehenen Umfang zu übernehmen/anzuerkennen.`, defaultLineHeight, 11, {fontStyle:"bold"});
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

    doc.save("widerspruch_verhinderungspflege.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchVP");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}