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

    doc.setFontSize(11);

    // Absender-Logik (Widerspruchsführer oder Versicherter) & Info-Text ermitteln
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    let infoText = "";

    if (widerspruchfuehrerIdentisch === 'nein' && wfName.trim() !== "") {
        absenderName = wfName;
        absenderAdresse = wfAdresse;
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

    // Zusatz-Info (Verhältnis) rechts drunter setzen, falls ein abweichender Widerspruchsführer aktiv ist
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

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (Pflegekasse)
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
    
    // Empfänger (Pflegekasse) platzieren
    leftY += 6; 
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
    doc.text(pflegekasseName, margin, leftY);
    leftY += defaultLineHeight;
    
    pflegekasseAdresse.split("\n").forEach(line => {
        doc.text(line.trim(), margin, leftY);
        leftY += defaultLineHeight;
    });

    // 3. DATUM: Rechtsbündig unterhalb der Blöcke
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    
    // Kollisionsschutz: Berücksichtigt das eventuell längere Info-Feld rechts
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Text
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

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
    writeParagraph(`hiermit lege ich fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Bescheid vom ${datumPflegegradbescheid} ein. Mit diesem Bescheid wurde für ${vpName} der ${festgestellterPflegegrad} festgestellt.`);
    if (widerspruchfuehrerIdentisch === 'nein' && wfName.trim() !== "") {
        writeParagraph(`Ich, ${wfName}, lege diesen Widerspruch als ${wfVerhaeltnis || 'bevollmächtigte Person'} ein.`);
        if (wfVollmacht) writeParagraph("Eine entsprechende Vollmacht/Bestallungsurkunde liegt bei bzw. wird kurzfristig nachgereicht.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    writeParagraph(`Die getroffene Einstufung ist aus meiner Sicht fehlerhaft und wird dem tatsächlichen, erheblichen Pflege- und Betreuungsbedarf von ${vpName} in keiner Weise gerecht.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    if (begruendungWiderspruchPflegegrad.trim() !== "") {
        writeParagraph(begruendungWiderspruchPflegegrad);
    } else {
        writeParagraph("[FEHLT: Hier bitte Ihre ausführliche Begründung einfügen, warum der festgestellte Pflegegrad nicht dem tatsächlichen Hilfebedarf entspricht. Gehen Sie detailliert auf die einzelnen Module der Begutachtung ein und legen Sie dar, wo der Gutachter den Hilfebedarf ggf. unterschätzt hat. Verweisen Sie auf Ihr Pflegetagebuch und ärztliche Unterlagen.]", defaultLineHeight, 11, {fontStyle: "bold"}); // Deutlicher Hinweis
    }
    writeParagraph("Ich erwarte, dass Sie im Rahmen Ihrer Amtsermittlungspflicht alle von mir dargelegten Aspekte und die beigefügten/bereits vorliegenden Unterlagen sorgfältig und unvoreingenommen prüfen. Eine nur schematische oder oberflächliche Neubewertung wird dem komplexen Sachverhalt und der individuellen Situation von " + vpName + " nicht gerecht.", defaultLineHeight, 11);
    
    // Forderung
    writeLine("Mein Antrag im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchPflegegrad.trim() !== "") {
        writeParagraph(forderungWiderspruchPflegegrad);
    } else {
        let zielPflegegradText = "eines angemessenen, höheren Pflegegrades";
        if (beantragterErwarteterPflegegrad.trim() !== "" && beantragterErwarteterPflegegrad.trim() !== "Kein Pflegegrad" && beantragterErwarteterPflegegrad.trim() !== festgestellterPflegegrad ) {
            zielPflegegradText = `des Pflegegrades ${beantragterErwarteterPflegegrad}`;
        }
        writeParagraph(`Ich fordere Sie daher nachdrücklich auf, den Bescheid vom ${datumPflegegradbescheid} aufzuheben und für ${vpName} den meiner Begründung entsprechenden ${zielPflegegradText} festzustellen. Mindestens erwarte ich die umgehende Anberaumung einer erneuten, sorgfältigen und umfassenden Begutachtung unter Berücksichtigung aller von mir vorgebrachten Punkte und der aktuellen Pflegesituation.`, defaultLineHeight, 11, {fontStyle:"bold"});
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
    writeParagraph(`Bitte bestätigen Sie den Eingang dieses Widerspruchs umgehend schriftlich. Ich erwarte Ihre detaillierte, rechtsmittelfähige Entscheidung über diesen Widerspruch bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, 11);
    writeParagraph("Sollte ich bis zu diesem Datum keine zufriedenstellende Antwort erhalten oder dieser Widerspruch erneut unzureichend beschieden werden, behalte ich mir ausdrücklich die Einleitung weiterer rechtlicher Schritte, insbesondere die Klageerhebung vor dem zuständigen Sozialgericht, vor.", defaultLineHeight, 11);
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