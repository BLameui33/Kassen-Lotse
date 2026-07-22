document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchKrankengeldForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchKG');
    const loadBtn = document.getElementById('loadBtnWiderspruchKG');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchKG');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchKG');
    const storageKey = 'widerspruchKrankengeldFormData';

    // --- Steuerung der dynamischen Felder ---
    const gegenstandEntscheidungSelect = document.getElementById('gegenstandEntscheidungKG');
    const gegenstandSonstigesDetailsDiv = document.getElementById('gegenstandSonstigesKGDetails');
    const gegenstandSonstigesTextTextarea = document.getElementById('gegenstandSonstigesKGText');


    function updateGegenstandSonstigesVisibility() {
        if (gegenstandEntscheidungSelect.value === 'Sonstiges (bitte unten erläutern)') {
            gegenstandSonstigesDetailsDiv.style.display = 'block';
            gegenstandSonstigesTextTextarea.required = true;
        } else {
            gegenstandSonstigesDetailsDiv.style.display = 'none';
            gegenstandSonstigesTextTextarea.required = false;
        }
    }
    if (gegenstandEntscheidungSelect) {
        gegenstandEntscheidungSelect.addEventListener('change', updateGegenstandSonstigesVisibility);
        updateGegenstandSonstigesVisibility(); // Initial prüfen
    }


    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "name", "adresse", "geburt", "nummer", 
      "kasseName", "kasseAdresse",
      "datumEntscheidungKG", "aktenzeichenKG", "gegenstandEntscheidungKG", "gegenstandSonstigesKGText",
      "beginnArbeitsunfaehigkeitKG", "diagnoseHauptKG", "zeitraumKrankengeldStreitig",
      "argumentFortbestehendeAUKG", "argumentFehlerImBescheidKG", "ergaenzendeBegruendungKG",
      "forderungWiderspruchKG", "anlageSonstigesKrankengeld"
    ];
    const anlagenCheckboxName = "anlagenKrankengeld";

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
      });
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
      const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
      anlagenCheckboxes.forEach(checkbox => {
        if (data.anlagen && data.anlagen.includes(checkbox.value)) {
            checkbox.checked = true;
        } else if (checkbox) {
            checkbox.checked = false;
        }
      });
      if (gegenstandEntscheidungSelect) updateGegenstandSonstigesVisibility(); 
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
          if (document.getElementById("argumentFortbestehendeAUKG").value.trim() === "" &&
              document.getElementById("argumentFehlerImBescheidKG").value.trim() === "" &&
              document.getElementById("ergaenzendeBegruendungKG").value.trim() === "") {
              alert("Bitte geben Sie eine ausführliche Begründung für Ihren Widerspruch in einem der dafür vorgesehenen Felder an.");
              return;
          }
          generateWiderspruchKrankengeldPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWiderspruchKrankengeldPDF() {
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
    const name = document.getElementById("name").value;
    const adresse = document.getElementById("adresse").value;
    const geburtInput = document.getElementById("geburt").value;
    const geburtFormatiert = geburtInput ? new Date(geburtInput).toLocaleDateString("de-DE") : 'N/A';
    const nummer = document.getElementById("nummer").value;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;
    
    const datumEntscheidungKGInput = document.getElementById("datumEntscheidungKG").value;
    const datumEntscheidungKG = datumEntscheidungKGInput ? new Date(datumEntscheidungKGInput).toLocaleDateString("de-DE") : 'UNBEKANNT';
    const aktenzeichenKG = document.getElementById("aktenzeichenKG").value;
    let gegenstandEntscheidungKG = document.getElementById("gegenstandEntscheidungKG").value;
    if (gegenstandEntscheidungKG === "Sonstiges (bitte unten erläutern)") {
        gegenstandEntscheidungKG = document.getElementById("gegenstandSonstigesKGText").value || "Sonstige Entscheidung (nicht näher spezifiziert)";
    }
    const beginnArbeitsunfaehigkeitKGInput = document.getElementById("beginnArbeitsunfaehigkeitKG").value;
    const beginnArbeitsunfaehigkeitKG = beginnArbeitsunfaehigkeitKGInput ? new Date(beginnArbeitsunfaehigkeitKGInput).toLocaleDateString("de-DE") : '(Datum bitte im Formular eintragen)';
    const diagnoseHauptKG = document.getElementById("diagnoseHauptKG").value;
    const zeitraumKrankengeldStreitig = document.getElementById("zeitraumKrankengeldStreitig").value;
    
    const argumentFortbestehendeAUKG = document.getElementById("argumentFortbestehendeAUKG").value;
    const argumentFehlerImBescheidKG = document.getElementById("argumentFehlerImBescheidKG").value;
    const ergaenzendeBegruendungKG = document.getElementById("ergaenzendeBegruendungKG").value;
    const forderungWiderspruchKG = document.getElementById("forderungWiderspruchKG").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenKrankengeld"]:checked');
    anlagenCheckboxes.forEach(checkbox => { anlagen.push(checkbox.value); });
    const anlageSonstigesKrankengeld = document.getElementById("anlageSonstigesKrankengeld").value;
    if (anlageSonstigesKrankengeld.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesKrankengeld); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender (Standard-Variante)
    let absenderName = name;
    let absenderAdresse = adresse;

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
    let betreffText = `Widerspruch gegen Ihren Bescheid vom ${datumEntscheidungKG} betreffend Krankengeld`;
    if (aktenzeichenKG.trim() !== "") betreffText += `, Az.: ${aktenzeichenKG}`;
    betreffText += `\nVersicherte Person: ${name}, geb. am ${geburtFormatiert}, Vers.-Nr.: ${nummer}`;
    betreffText += `\n- ERNEUTE DRINGENDE AUFFORDERUNG ZUR ÜBERPRÜFUNG UND KORREKTUR IHRER ENTSCHEIDUNG -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich fristgerecht und mit allem Nachdruck Widerspruch gegen Ihre oben genannte Entscheidung vom ${datumEntscheidungKG} ein. Mit dieser Entscheidung haben Sie "${gegenstandEntscheidungKG}" für den Zeitraum ${zeitraumKrankengeldStreitig || 'ab dem (Datum eintragen)'} bzw. basierend auf der Diagnose "${diagnoseHauptKG || '(Diagnose bitte eintragen)'}" getroffen.`);
    writeParagraph(`Diese Entscheidung ist für mich nicht akzeptabel und basiert auf einer unzureichenden bzw. fehlerhaften Würdigung meiner medizinischen Situation und der rechtlichen Grundlagen.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    if (argumentFortbestehendeAUKG.trim() !== "") {
        writeLine("Zur Fortdauer meiner Arbeitsunfähigkeit:", defaultLineHeight, true, 10);
        writeParagraph(argumentFortbestehendeAUKG, defaultLineHeight, 11);
    }

    if (argumentFehlerImBescheidKG.trim() !== "") {
        writeLine("Zu Fehlern in Ihrem Bescheid / der MDK-Begutachtung:", defaultLineHeight, true, 10);
        writeParagraph(argumentFehlerImBescheidKG, defaultLineHeight, 11);
    }
    
    if (ergaenzendeBegruendungKG.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen:", defaultLineHeight, true, 10);
        writeParagraph(ergaenzendeBegruendungKG, defaultLineHeight, 11);
    }
    
    
    writeParagraph(`Ich weise darauf hin, dass meine Arbeitsunfähigkeit seit dem ${beginnArbeitsunfaehigkeitKG} aufgrund der Diagnose(n) "${diagnoseHauptKG || '(Diagnose bitte im Formular eintragen)'}" lückenlos ärztlich attestiert ist. Die entsprechenden Nachweise liegen Ihnen vor bzw. werden mit diesem Schreiben (erneut) eingereicht.`, defaultLineHeight, 11);
    
    writeParagraph("Das Krankengeld stellt für mich eine unverzichtbare Lohnersatzleistung dar, auf die ich zur Sicherung meines Lebensunterhalts dringend angewiesen bin. Ihre Entscheidung hat daher erhebliche finanzielle und persönliche Konsequenzen für mich.", defaultLineHeight, 11);
    
    // Forderung
    writeLine("Meine Forderung im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchKG.trim() !== "") {
        writeParagraph(forderungWiderspruchKG);
    } else {
        writeParagraph(`Ich fordere Sie daher nachdrücklich auf, Ihren Bescheid vom ${datumEntscheidungKG} aufzuheben und das Krankengeld entsprechend der gesetzlichen Bestimmungen und meiner fortbestehenden Arbeitsunfähigkeit (weiter) zu gewähren / korrekt zu berechnen und auszuzahlen.`, defaultLineHeight, 11, {fontStyle:"bold"});
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
    const fristsetzungDatumText = new Date(Date.now() + 3 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE"); // Ca. 3 Wochen
    writeParagraph(`Bitte bestätigen Sie mir den Eingang dieses Widerspruchs umgehend schriftlich. Ich erwarte Ihre rechtsmittelfähige Entscheidung über meinen Widerspruch bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, 11);
    writeParagraph("Sollte ich bis zu diesem Datum keine zufriedenstellende Antwort erhalten oder mein Widerspruch erneut abgelehnt werden, behalte ich mir ausdrücklich die Einleitung weiterer rechtlicher Schritte vor dem zuständigen Sozialgericht vor.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(name);


    doc.save("widerspruch_krankengeld.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchKG");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}