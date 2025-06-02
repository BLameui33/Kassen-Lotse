document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchPflegegradForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchPG');
    const loadBtn = document.getElementById('loadBtnWiderspruchPG');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchPG');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchPG');
    const storageKey = 'widerspruchPflegegradFormData';

    // --- Steuerung der dynamischen Widerspruchsführer-Felder ---
    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentisch');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetails');
    const anlageVollmachtPGCheckbox = document.getElementById('anlageVollmachtPG');


    function updateWiderspruchfuehrerDetailsVisibility() {
        if (widerspruchfuehrerIdentischSelect.value === 'nein') {
            widerspruchfuehrerDetailsDiv.style.display = 'block';
            document.getElementById('wfName').required = true;
            document.getElementById('wfAdresse').required = true;
            document.getElementById('wfVerhaeltnis').required = true;
            if (anlageVollmachtPGCheckbox) anlageVollmachtPGCheckbox.required = true;
        } else {
            widerspruchfuehrerDetailsDiv.style.display = 'none';
            document.getElementById('wfName').required = false;
            document.getElementById('wfAdresse').required = false;
            document.getElementById('wfVerhaeltnis').required = false;
             if (anlageVollmachtPGCheckbox) anlageVollmachtPGCheckbox.required = false;
        }
    }
    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); // Initial prüfen
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "vpName", "vpGeburt", "vpAdresse", "vpNummer",
      "widerspruchfuehrerIdentisch", "wfName", "wfAdresse", "wfVerhaeltnis",
      "pflegekasseName", "pflegekasseAdresse",
      "datumPflegegradbescheid", "aktenzeichenPflegegrad", "festgestellterPflegegrad", "beantragterErwarteterPflegegrad",
      "begruendungWiderspruchPflegegrad", "forderungWiderspruchPflegegrad",
      "anlageSonstigesPflegegrad"
    ];
    const anlagenCheckboxName = "anlagenPflegegrad";

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
      });
      const wfVollmachtCheckbox = document.getElementById('wfVollmacht');
      if (wfVollmachtCheckbox) data.wfVollmacht = wfVollmachtCheckbox.checked;
      
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
      const wfVollmachtCheckbox = document.getElementById('wfVollmacht');
      if (wfVollmachtCheckbox && data.wfVollmacht !== undefined) wfVollmachtCheckbox.checked = data.wfVollmacht;

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
          if (document.getElementById("begruendungWiderspruchPflegegrad").value.trim() === "") {
              alert("Bitte geben Sie eine ausführliche Begründung für Ihren Widerspruch an.");
              return;
          }
          generateWiderspruchPflegegradPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWiderspruchPflegegradPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 2; // Standardabstand nach einem Absatz

    // Hilfsfunktionen für PDF
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

    const widerspruchfuehrerIdentisch = document.getElementById("widerspruchfuehrerIdentisch").value;
    const wfName = document.getElementById("wfName").value;
    const wfAdresse = document.getElementById("wfAdresse").value;
    const wfVerhaeltnis = document.getElementById("wfVerhaeltnis").value;
    const wfVollmacht = document.getElementById("wfVollmacht") ? document.getElementById("wfVollmacht").checked : false;

    const pflegekasseName = document.getElementById("pflegekasseName").value;
    const pflegekasseAdresse = document.getElementById("pflegekasseAdresse").value;
    
    const datumPflegegradbescheidInput = document.getElementById("datumPflegegradbescheid").value;
    const datumPflegegradbescheid = datumPflegegradbescheidInput ? new Date(datumPflegegradbescheidInput).toLocaleDateString("de-DE") : 'UNBEKANNT (BITTE NACHTRAGEN!)';
    const aktenzeichenPflegegrad = document.getElementById("aktenzeichenPflegegrad").value;
    const festgestellterPflegegrad = document.getElementById("festgestellterPflegegrad").value;
    const beantragterErwarteterPflegegrad = document.getElementById("beantragterErwarteterPflegegrad").value;
    
    const begruendungWiderspruchPflegegrad = document.getElementById("begruendungWiderspruchPflegegrad").value;
    const forderungWiderspruchPflegegrad = document.getElementById("forderungWiderspruchPflegegrad").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenPflegegrad"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtPG" && widerspruchfuehrerIdentisch === "ja") {
            // Nicht hinzufügen, wenn Widerspruchsführer identisch ist
        } else {
             anlagen.push(checkbox.value);
        }
    });
    const anlageSonstigesPflegegrad = document.getElementById("anlageSonstigesPflegegrad").value;
    if (anlageSonstigesPflegegrad.trim() !== "") {
        anlagen.push("Sonstige Anlagen: " + anlageSonstigesPflegegrad);
    }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender (Widerspruchsführer oder Versicherter)
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    if (widerspruchfuehrerIdentisch === 'nein' && wfName.trim() !== "") {
        absenderName = wfName;
        absenderAdresse = wfAdresse;
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line));
    if (widerspruchfuehrerIdentisch === 'nein' && wfName.trim() !== ""){
         writeParagraph(`(handelnd für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`, defaultLineHeight, 9, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    }
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}


    // Empfänger
    writeLine(pflegekasseName);
    pflegekasseAdresse.split("\n").forEach(line => writeLine(line));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    // Datum rechtsbündig
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    // Betreff
    let betreffText = `Widerspruch gegen Ihren Pflegegradbescheid vom ${datumPflegegradbescheid}`;
    if (aktenzeichenPflegegrad.trim() !== "") betreffText += `, Aktenzeichen: ${aktenzeichenPflegegrad}`;
    betreffText += `\nVersicherte Person: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer}`;
    betreffText += `\nFestgestellter Pflegegrad laut Bescheid: ${festgestellterPflegegrad}`;
    betreffText += `\n- ERNEUTE DRINGENDE AUFFORDERUNG ZUR ÜBERPRÜFUNG UND KORREKTUR DER EINSTUFUNG -`; // Verstärkung
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich/legen wir fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Bescheid vom ${datumPflegegradbescheid} ein. Mit diesem Bescheid wurde für Herrn/Frau ${vpName} der ${festgestellterPflegegrad} festgestellt.`);
    if (widerspruchfuehrerIdentisch === 'nein' && wfName.trim() !== "") {
        writeParagraph(`Ich, ${wfName}, lege diesen Widerspruch als ${wfVerhaeltnis || 'bevollmächtigte Person'} ein.`);
        if (wfVollmacht) writeParagraph("Eine entsprechende Vollmacht/Bestallungsurkunde liegt bei bzw. wird kurzfristig nachgereicht.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    writeParagraph(`Die getroffene Einstufung ist aus meiner/unserer Sicht fehlerhaft und wird dem tatsächlichen, erheblichen Pflege- und Betreuungsbedarf von Herrn/Frau ${vpName} in keiner Weise gerecht.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines/unseres Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    if (begruendungWiderspruchPflegegrad.trim() !== "") {
        writeParagraph(begruendungWiderspruchPflegegrad);
    } else {
        writeParagraph("[FEHLT: Hier bitte Ihre ausführliche Begründung einfügen, warum der festgestellte Pflegegrad nicht dem tatsächlichen Hilfebedarf entspricht. Gehen Sie detailliert auf die einzelnen Module der Begutachtung ein und legen Sie dar, wo der Gutachter den Hilfebedarf ggf. unterschätzt hat. Verweisen Sie auf Ihr Pflegetagebuch und ärztliche Unterlagen.]", defaultLineHeight, 11, {fontStyle: "bold"}); // Deutlicher Hinweis
    }
    writeParagraph("Wir erwarten, dass Sie im Rahmen Ihrer Amtsermittlungspflicht alle von uns dargelegten Aspekte und die beigefügten/bereits vorliegenden Unterlagen sorgfältig und unvoreingenommen prüfen. Eine nur schematische oder oberflächliche Neubewertung wird dem komplexen Sachverhalt und der individuellen Situation von Herrn/Frau " + vpName + " nicht gerecht.", defaultLineHeight, 11);
    
    // Forderung
    writeLine("Mein/Unser Antrag im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchPflegegrad.trim() !== "") {
        writeParagraph(forderungWiderspruchPflegegrad);
    } else {
        let zielPflegegradText = "eines angemessenen, höheren Pflegegrades";
        if (beantragterErwarteterPflegegrad.trim() !== "" && beantragterErwarteterPflegegrad.trim() !== "Kein Pflegegrad" && beantragterErwarteterPflegegrad.trim() !== festgestellterPflegegrad ) {
            zielPflegegradText = `des Pflegegrades ${beantragterErwarteterPflegegrad}`;
        }
        writeParagraph(`Wir fordern Sie daher nachdrücklich auf, den Bescheid vom ${datumPflegegradbescheid} aufzuheben und für Herrn/Frau ${vpName} den unserer Begründung entsprechenden ${zielPflegegradText} festzustellen. Mindestens erwarten wir die umgehende Anberaumung einer erneuten, sorgfältigen und umfassenden Begutachtung unter Berücksichtigung aller von uns vorgebrachten Punkte und der aktuellen Pflegesituation.`, defaultLineHeight, 11, {fontStyle:"bold"});
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
    const fristsetzungDatumText = new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE"); // Ca. 4 Wochen
    writeParagraph(`Bitte bestätigen Sie uns den Eingang dieses Widerspruchs umgehend schriftlich. Wir erwarten Ihre detaillierte, rechtsmittelfähige Entscheidung über diesen Widerspruch bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, 11);
    writeParagraph("Sollten wir bis zu diesem Datum keine zufriedenstellende Antwort erhalten oder unser Widerspruch erneut unzureichend beschieden werden, behalten wir uns ausdrücklich die Einleitung weiterer rechtlicher Schritte, insbesondere die Klageerhebung vor dem zuständigen Sozialgericht, vor.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);


    doc.save("widerspruch_pflegegrad.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchPG");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}