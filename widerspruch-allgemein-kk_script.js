document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchAllgemeinKKForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchAllgemein');
    const loadBtn = document.getElementById('loadBtnWiderspruchAllgemein');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchAllgemein');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchAllgemein');
    const storageKey = 'widerspruchAllgemeinKKFormData';

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "name", "adresse", "nummer", "kasseName", "kasseAdresse",
      "entscheidungDatum", "aktenzeichenEntscheidung", "gegenstandEntscheidung",
      "begruendungWiderspruchAllgemein", "forderungWiderspruch",
      "anlageSonstigesAllgemein"
    ];
    const anlagenCheckboxName = "anlagenAllgemein";

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
          generateWiderspruchAllgemeinKKPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWiderspruchAllgemeinKKPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 2; // Standardabstand nach einem Absatz

    // Hilfsfunktionen für PDF (writeLine, writeParagraph) bleiben wie gehabt
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
    
    // Formulardaten sammeln (wie gehabt)
    const name = document.getElementById("name").value;
    const adresse = document.getElementById("adresse").value;
    const nummer = document.getElementById("nummer").value;
    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;
    
    const entscheidungDatumInput = document.getElementById("entscheidungDatum").value;
    const entscheidungDatum = entscheidungDatumInput ? new Date(entscheidungDatumInput).toLocaleDateString("de-DE") : 'UNBEKANNT (BITTE NACHTRAGEN!)';
    const aktenzeichenEntscheidung = document.getElementById("aktenzeichenEntscheidung").value;
    const gegenstandEntscheidung = document.getElementById("gegenstandEntscheidung").value;
    const begruendungWiderspruchAllgemein = document.getElementById("begruendungWiderspruchAllgemein").value;
    const forderungWiderspruch = document.getElementById("forderungWiderspruch").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenAllgemein"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        anlagen.push(checkbox.value);
    });
    const anlageSonstigesAllgemein = document.getElementById("anlageSonstigesAllgemein").value;
    if (anlageSonstigesAllgemein.trim() !== "") {
        anlagen.push("Sonstige Anlagen: " + anlageSonstigesAllgemein);
    }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender, Empfänger, Datum (Standard)
    writeLine(name);
    adresse.split("\n").forEach(line => writeLine(line));
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}
    writeLine(kasseName);
    kasseAdresse.split("\n").forEach(line => writeLine(line));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    // Betreff (leicht angepasst für mehr Direktheit)
    let betreffText = `Widerspruch gegen Ihren Bescheid vom ${entscheidungDatum}`;
    if (aktenzeichenEntscheidung.trim() !== "") betreffText += `, Aktenzeichen: ${aktenzeichenEntscheidung}`;
    betreffText += `\nBetreffend: ${gegenstandEntscheidung || 'die von Ihnen getroffene Entscheidung (Details siehe unten)'}`;
    betreffText += `\nVersichertennummer: ${nummer}`;
    betreffText += `\n- Dringende Bitte um erneute Prüfung und Abhilfe -`; // Verstärkung
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch (bestimmter)
    writeParagraph(`hiermit lege ich form- und fristgerecht Widerspruch gegen Ihren oben genannten Bescheid vom ${entscheidungDatum} ein, durch den Sie bezüglich "${gegenstandEntscheidung || 'des genannten Sachverhalts'}" eine für mich nachteilige Entscheidung getroffen haben.`);
    writeParagraph(`Diese Entscheidung ist aus meiner Sicht weder sachlich noch rechtlich haltbar und entspricht nicht den Grundsätzen einer fairen und gesetzeskonformen Behandlung meiner Angelegenheiten.`);
    
    // Begründung des Widerspruchs
    writeLine("Begründung meines Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    if (begruendungWiderspruchAllgemein.trim() !== "") {
        writeParagraph(`Die Gründe für meinen Widerspruch stellen sich im Einzelnen wie folgt dar:\n${begruendungWiderspruchAllgemein}`);
    } else {
        writeParagraph("Die detaillierten Gründe für meinen Widerspruch entnehmen Sie bitte den beigefügten Unterlagen und meiner nachfolgenden Forderung. [Hinweis: Es ist dringend empfohlen, hier eine ausführliche Begründung einzufügen!]", defaultLineHeight, 11, {fontStyle: "italic"});
    }
    writeParagraph("Ich verweise auf meine Rechte als Versicherter und die Pflicht der Krankenkasse zur umfassenden Sachverhaltsaufklärung (Amtsermittlungsgrundsatz) sowie zur Beratung und Unterstützung (§§ 13-15 SGB I). Die angefochtene Entscheidung scheint diesen Grundsätzen nicht in vollem Umfang gerecht zu werden.", defaultLineHeight, 10, {fontStyle:"italic"});
    
    // Forderung (präziser)
    writeLine("Mein Antrag im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruch.trim() !== "") {
        writeParagraph(forderungWiderspruch);
    } else {
        writeParagraph("Ich beantrage hiermit nachdrücklich, den angefochtenen Bescheid vom " + `${entscheidungDatum}` + " vollumfänglich aufzuheben und meinem ursprünglichen Anliegen entsprechend der beigefügten Unterlagen und meiner Begründung stattzugeben.", defaultLineHeight, 11, {fontStyle:"bold"});
    }
    writeParagraph("Sollten Sie meinem Widerspruch nicht vollumfänglich abhelfen, erwarte ich eine detaillierte und nachvollziehbare schriftliche Begründung für jeden einzelnen Punkt, dem nicht entsprochen wurde, sowie eine formelle Rechtsbehelfsbelehrung für mögliche weitere Schritte.", defaultLineHeight, 11);
    
    // Anlagen
    if (anlagen.length > 0) {
        writeLine("Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }

    // Abschluss (mit Fristsetzung und klarer Erwartung)
    const fristsetzungDatumText = new Date(Date.now() + 3 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE"); // Ca. 3 Wochen
    writeParagraph(`Ich bitte um eine schriftliche Eingangsbestätigung dieses Widerspruchs. Ferner erwarte ich Ihre rechtsmittelfähige Entscheidung über meinen Widerspruch bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, 11);
    writeParagraph("Ich weise darauf hin, dass ich mir bei weiterhin ablehnender Haltung oder fruchtlosem Fristablauf die Einleitung weiterer rechtlicher Schritte, insbesondere die Klageerhebung vor dem zuständigen Sozialgericht, ausdrücklich vorbehalte.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(name);

    doc.save("widerspruch_allgemein_krankenkasse.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchAllgemein");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}