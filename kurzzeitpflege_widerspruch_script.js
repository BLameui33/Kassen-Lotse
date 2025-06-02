document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchKurzzeitpflegeForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchKZP');
    const loadBtn = document.getElementById('loadBtnWiderspruchKZP');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchKZP');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchKZP');
    const storageKey = 'widerspruchKurzzeitpflegeFormData';

    // --- Steuerung der dynamischen Widerspruchsführer-Felder ---
    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischKZP');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsKZP');
    const anlageVollmachtCheckbox = document.getElementById('anlageVollmachtKZPWiderspruch');

    function updateWiderspruchfuehrerDetailsVisibility() {
        const isNotIdentical = widerspruchfuehrerIdentischSelect.value === 'nein';
        widerspruchfuehrerDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        document.getElementById('wfNameKZP').required = isNotIdentical;
        document.getElementById('wfAdresseKZP').required = isNotIdentical;
        document.getElementById('wfVerhaeltnisKZP').required = isNotIdentical;
        if (anlageVollmachtCheckbox) anlageVollmachtCheckbox.required = isNotIdentical;
    }
    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); 
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpPflegegrad",
      "widerspruchfuehrerIdentischKZP", "wfNameKZP", "wfAdresseKZP", "wfVerhaeltnisKZP",
      "pflegekasseName", "pflegekasseAdresse",
      "datumUrsprAntragKZP", "zeitraumAbgelehnteKZP", "einrichtungAbgelehnteKZP",
      "datumAblehnungsbescheidKZP", "aktenzeichenKZP", "hauptablehnungsgrundKZP",
      "argumentNotwendigkeitKZP", "argumentKeineAlternativenKZP", "argumentKostenKombinationKZP",
      "ergaenzendeArgumenteKZP", "forderungWiderspruchKZP", "anlageSonstigesKZPWiderspruch"
    ];
    const anlagenCheckboxName = "anlagenKurzzeitpflegeWiderspruch";

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
      });
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtKZP');
      if (wfVollmachtCheckbox) data.wfVollmachtKZP = wfVollmachtCheckbox.checked;
      
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
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtKZP');
      if (wfVollmachtCheckbox && data.wfVollmachtKZP !== undefined) wfVollmachtCheckbox.checked = data.wfVollmachtKZP;

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
          if (document.getElementById("argumentNotwendigkeitKZP").value.trim() === "" &&
              document.getElementById("ergaenzendeArgumenteKZP").value.trim() === "") {
              alert("Bitte geben Sie zumindest eine Begründung für Ihren Widerspruch an (zur Notwendigkeit oder als ergänzende Argumente).");
              return;
          }
          generateKZPWiderspruchPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateKZPWiderspruchPDF() {
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

    const widerspruchfuehrerIdentischKZP = document.getElementById("widerspruchfuehrerIdentischKZP").value;
    const wfNameKZP = document.getElementById("wfNameKZP").value;
    const wfAdresseKZP = document.getElementById("wfAdresseKZP").value;
    const wfVerhaeltnisKZP = document.getElementById("wfVerhaeltnisKZP").value;
    const wfVollmachtKZP = document.getElementById("wfVollmachtKZP") ? document.getElementById("wfVollmachtKZP").checked : false;

    const pflegekasseName = document.getElementById("pflegekasseName").value;
    const pflegekasseAdresse = document.getElementById("pflegekasseAdresse").value;
    
    const datumUrsprAntragKZPInput = document.getElementById("datumUrsprAntragKZP").value;
    const datumUrsprAntragKZP = datumUrsprAntragKZPInput ? new Date(datumUrsprAntragKZPInput).toLocaleDateString("de-DE") : 'N/A';
    const zeitraumAbgelehnteKZP = document.getElementById("zeitraumAbgelehnteKZP").value;
    const einrichtungAbgelehnteKZP = document.getElementById("einrichtungAbgelehnteKZP").value;
    const datumAblehnungsbescheidKZPInput = document.getElementById("datumAblehnungsbescheidKZP").value;
    const datumAblehnungsbescheidKZP = datumAblehnungsbescheidKZPInput ? new Date(datumAblehnungsbescheidKZPInput).toLocaleDateString("de-DE") : 'UNBEKANNT';
    const aktenzeichenKZP = document.getElementById("aktenzeichenKZP").value;
    const hauptablehnungsgrundKZP = document.getElementById("hauptablehnungsgrundKZP").value;
    
    const argumentNotwendigkeitKZP = document.getElementById("argumentNotwendigkeitKZP").value;
    const argumentKeineAlternativenKZP = document.getElementById("argumentKeineAlternativenKZP").value;
    const argumentKostenKombinationKZP = document.getElementById("argumentKostenKombinationKZP").value;
    const ergaenzendeArgumenteKZP = document.getElementById("ergaenzendeArgumenteKZP").value;
    const forderungWiderspruchKZP = document.getElementById("forderungWiderspruchKZP").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenKurzzeitpflegeWiderspruch"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtKZPWiderspruch" && widerspruchfuehrerIdentischKZP === "ja") { /* nicht hinzufügen */ }
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesKZPWiderspruch = document.getElementById("anlageSonstigesKZPWiderspruch").value;
    if (anlageSonstigesKZPWiderspruch.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesKZPWiderspruch); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    if (widerspruchfuehrerIdentischKZP === 'nein' && wfNameKZP.trim() !== "") {
        absenderName = wfNameKZP;
        absenderAdresse = wfAdresseKZP;
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line));
    if (widerspruchfuehrerIdentischKZP === 'nein' && wfNameKZP.trim() !== ""){
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
    let betreffText = `Widerspruch gegen Ihren Bescheid vom ${datumAblehnungsbescheidKZP} betreffend Leistungen der Kurzzeitpflege`;
    if (aktenzeichenKZP.trim() !== "") betreffText += `, Az.: ${aktenzeichenKZP}`;
    betreffText += `\nFür: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer} (${vpPflegegrad})`;
    betreffText += `\nUrsprünglicher Antrag vom: ${datumUrsprAntragKZP} für den Zeitraum: ${zeitraumAbgelehnteKZP || 'N/A'}`;
    if (einrichtungAbgelehnteKZP.trim() !== "") betreffText += ` (Einrichtung: ${einrichtungAbgelehnteKZP})`;
    betreffText += `\n- DRINGENDE AUFFORDERUNG ZUR ÜBERPRÜFUNG UND GENEHMIGUNG DER LEISTUNGEN -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich/legen wir fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Bescheid vom ${datumAblehnungsbescheidKZP} ein. Mit diesem Bescheid haben Sie den Antrag vom ${datumUrsprAntragKZP} auf Leistungen der Kurzzeitpflege für Herrn/Frau ${vpName} im Zeitraum ${zeitraumAbgelehnteKZP || '(Zeitraum bitte eintragen)'} ${einrichtungAbgelehnteKZP.trim() !== "" ? ' in der Einrichtung ' + einrichtungAbgelehnteKZP : ''} abgelehnt oder nur unzureichend bewilligt.`);
    if (widerspruchfuehrerIdentischKZP === 'nein' && wfNameKZP.trim() !== "") {
        writeParagraph(`Ich, ${wfNameKZP}, lege diesen Widerspruch als ${wfVerhaeltnisKZP || 'bevollmächtigte Person'} ein.`);
        if (wfVollmachtKZP) writeParagraph("Eine entsprechende Vollmacht ist beigefügt.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    writeParagraph(`Ihre Entscheidung ist für uns nicht nachvollziehbar und verkennt die dringende Notwendigkeit der Kurzzeitpflege zur Sicherstellung der Versorgung und/oder Entlastung der Pflegesituation von Herrn/Frau ${vpName}.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines/unseres Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    if (hauptablehnungsgrundKZP.trim() !== "") {
        writeParagraph(`Sie führen in Ihrem Bescheid als Hauptgrund für die Ablehnung/Kürzung an: "${hauptablehnungsgrundKZP}". Diese Begründung ist aus folgenden Gründen nicht haltbar bzw. unzutreffend:`, defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight*0.5});
    }

    if (argumentNotwendigkeitKZP.trim() !== "") {
        writeLine("Zur zwingenden Notwendigkeit der Kurzzeitpflege:", defaultLineHeight, true, 10);
        writeParagraph(argumentNotwendigkeitKZP, defaultLineHeight, 11);
    }

    if (argumentKeineAlternativenKZP.trim() !== "") {
        writeLine("Zur fehlenden alternativen Versorgungsmöglichkeit:", defaultLineHeight, true, 10);
        writeParagraph(argumentKeineAlternativenKZP, defaultLineHeight, 11);
    }
    
    if (argumentKostenKombinationKZP.trim() !== "") {
        writeLine("Zu den Kosten und der ggf. beantragten Kombination mit Mitteln der Verhinderungspflege:", defaultLineHeight, true, 10);
        writeParagraph(argumentKostenKombinationKZP, defaultLineHeight, 11);
    }

    if (ergaenzendeArgumenteKZP.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen:", defaultLineHeight, true, 10);
        writeParagraph(ergaenzendeArgumenteKZP, defaultLineHeight, 11);
    }
    
    writeParagraph(`Die Inanspruchnahme von Kurzzeitpflege gemäß § 42 SGB XI ist in der vorliegenden Situation unerlässlich. Eine Verweigerung oder unzureichende Bewilligung dieser Leistung würde die Pflegesituation von Herrn/Frau ${vpName} erheblich gefährden und ist nicht akzeptabel.`, defaultLineHeight, 11);
    
    // Forderung
    writeLine("Meine/Unsere Forderung im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchKZP.trim() !== "") {
        writeParagraph(forderungWiderspruchKZP);
    } else {
        writeParagraph(`Ich/Wir fordern Sie daher nachdrücklich auf, Ihren Ablehnungsbescheid vom ${datumAblehnungsbescheidKZP} zu revidieren und die Kosten für die beantragte Kurzzeitpflege im gesetzlich vorgesehenen Umfang (ggf. unter Anrechnung von Mitteln der Verhinderungspflege) zu übernehmen.`, defaultLineHeight, 11, {fontStyle:"bold"});
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

    doc.save("widerspruch_kurzzeitpflege.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchKZP");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}