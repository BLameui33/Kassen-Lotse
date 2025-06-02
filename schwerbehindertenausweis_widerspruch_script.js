document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchSBAForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchSBA');
    const loadBtn = document.getElementById('loadBtnWiderspruchSBA');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchSBA');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchSBA');
    const storageKey = 'widerspruchSBAFormData';

    // --- Steuerung der dynamischen Widerspruchsführer-Felder ---
    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischSBA');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsSBA');
    const anlageVollmachtCheckbox = document.getElementById('anlageVollmachtSBAWiderspruch'); // Korrekte ID der Anlage-Checkbox

    function updateWiderspruchfuehrerDetailsVisibility() {
        const isNotIdentical = widerspruchfuehrerIdentischSelect.value === 'nein';
        widerspruchfuehrerDetailsDiv.style.display = isNotIdentical ? 'block' : 'none';
        // Setze required nur für die Felder im Div, nicht für die Checkbox im Div direkt
        document.getElementById('wfNameSBA').required = isNotIdentical;
        document.getElementById('wfAdresseSBA').required = isNotIdentical;
        document.getElementById('wfVerhaeltnisSBA').required = isNotIdentical;
        // Die Vollmacht-Checkbox im *Anlagen*-Abschnitt wird hier nicht gesteuert,
        // sondern die Checkbox wfVollmachtSBA direkt im Widerspruchsführer-Detailabschnitt
        const wfVollmachtCheckboxImDiv = document.getElementById('wfVollmachtSBA');
        if (wfVollmachtCheckboxImDiv) wfVollmachtCheckboxImDiv.required = isNotIdentical;
    }
    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); 
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "personName", "personGeburt", "personAdresse", "personAktenzeichenVS",
      "widerspruchfuehrerIdentischSBA", "wfNameSBA", "wfAdresseSBA", "wfVerhaeltnisSBA",
      "versorgungsamtName", "versorgungsamtAdresse",
      "datumBescheidSBA", "aktenzeichenBescheidSBA", "festgestellterGdB", "festgestellteMerkzeichen", "abgelehntePunkteSBA",
      "argumentGesundheitszustandSBA", "argumentAbweichungGutachtenSBA", "argumentMerkzeichenSBA",
      "ergaenzendeArgumenteSBA", "forderungWiderspruchSBA", "anlageSonstigesSBAWiderspruch"
    ];
    // Die Vollmacht-Checkbox des Widerspruchsführers und die Anlagen-Checkboxes separat behandeln
    const widerspruchfuehrerVollmachtCheckboxId = "wfVollmachtSBA";
    const anlagenCheckboxName = "anlagenSBAWiderspruch";


    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
      });
      // Checkbox für Vollmacht des Widerspruchsführers
      const wfVollmachtEl = document.getElementById(widerspruchfuehrerVollmachtCheckboxId);
      if (wfVollmachtEl) data[widerspruchfuehrerVollmachtCheckboxId] = wfVollmachtEl.checked;
      
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
      // Checkbox für Vollmacht des Widerspruchsführers
      const wfVollmachtEl = document.getElementById(widerspruchfuehrerVollmachtCheckboxId);
      if (wfVollmachtEl && data[widerspruchfuehrerVollmachtCheckboxId] !== undefined) {
          wfVollmachtEl.checked = data[widerspruchfuehrerVollmachtCheckboxId];
      }

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
          if (document.getElementById("argumentGesundheitszustandSBA").value.trim() === "" &&
              document.getElementById("ergaenzendeArgumenteSBA").value.trim() === "") {
              alert("Bitte geben Sie zumindest eine Begründung für Ihren Widerspruch an (zum Gesundheitszustand oder als ergänzende Argumente).");
              return;
          }
          generateSBWiderspruchPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateSBWiderspruchPDF() {
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
        const textToWrite = text === undefined || text === null ? "" : String(text);
        if (y + currentLineHeight > usableHeight) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont(undefined, isBold ? "bold" : "normal");
        doc.text(textToWrite, margin, y);
        y += currentLineHeight;
    }

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = 11, options = {}) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        const fontStyle = options.fontStyle || "normal";
        doc.setFontSize(paragraphFontSize);
        doc.setFont(undefined, fontStyle);
        const lines = doc.splitTextToSize(textToWrite, pageWidth - (2 * margin));
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
    const personName = document.getElementById("personName").value || "";
    const personGeburtInput = document.getElementById("personGeburt").value;
    const personGeburtFormatiert = personGeburtInput ? new Date(personGeburtInput).toLocaleDateString("de-DE") : 'N/A';
    const personAdresse = document.getElementById("personAdresse").value || "";
    const personAktenzeichenVS = document.getElementById("personAktenzeichenVS").value || ""; // Aktenzeichen der Person beim VS

    const widerspruchfuehrerIdentischSBA = document.getElementById("widerspruchfuehrerIdentischSBA").value;
    const wfNameSBA = document.getElementById("wfNameSBA").value || "";
    const wfAdresseSBA = document.getElementById("wfAdresseSBA").value || "";
    const wfVerhaeltnisSBA = document.getElementById("wfVerhaeltnisSBA").value || "";
    const wfVollmachtSBA = document.getElementById("wfVollmachtSBA") ? document.getElementById("wfVollmachtSBA").checked : false;

    const versorgungsamtName = document.getElementById("versorgungsamtName").value || "[Name des Versorgungsamtes]";
    const versorgungsamtAdresse = document.getElementById("versorgungsamtAdresse").value || "[Adresse des Versorgungsamtes]";
    
    const datumBescheidSBAInput = document.getElementById("datumBescheidSBA").value;
    const datumBescheidSBA = datumBescheidSBAInput ? new Date(datumBescheidSBAInput).toLocaleDateString("de-DE") : 'UNBEKANNT';
    const aktenzeichenBescheidSBA = document.getElementById("aktenzeichenBescheidSBA").value || "";
    const festgestellterGdB = document.getElementById("festgestellterGdB").value || "nicht festgestellt";
    const festgestellteMerkzeichen = document.getElementById("festgestellteMerkzeichen").value || "keine";
    const abgelehntePunkteSBA = document.getElementById("abgelehntePunkteSBA").value || "";
    
    const argumentGesundheitszustandSBA = document.getElementById("argumentGesundheitszustandSBA").value;
    const argumentAbweichungGutachtenSBA = document.getElementById("argumentAbweichungGutachtenSBA").value;
    const argumentMerkzeichenSBA = document.getElementById("argumentMerkzeichenSBA").value;
    const ergaenzendeArgumenteSBA = document.getElementById("ergaenzendeArgumenteSBA").value;
    const forderungWiderspruchSBA = document.getElementById("forderungWiderspruchSBA").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenSBAWiderspruch"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtSBAWiderspruch" && widerspruchfuehrerIdentischSBA === "ja") {}
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesSBAWiderspruch = document.getElementById("anlageSonstigesSBAWiderspruch").value;
    if (anlageSonstigesSBAWiderspruch.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesSBAWiderspruch); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = personName;
    let absenderAdresse = personAdresse;
    if (widerspruchfuehrerIdentischSBA === 'nein' && wfNameSBA.trim() !== "") {
        absenderName = wfNameSBA;
        absenderAdresse = wfAdresseSBA;
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line.trim()));
    if (widerspruchfuehrerIdentischSBA === 'nein' && wfNameSBA.trim() !== ""){
         writeParagraph(`(handelnd für ${personName}, geb. ${personGeburtFormatiert})`, defaultLineHeight, 9, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    }
    if (personAktenzeichenVS.trim() !== "") { // Aktenzeichen der Person beim VS, falls vorhanden
        writeLine(`Mein/Unser Aktenzeichen bei Ihnen (falls vorhanden): ${personAktenzeichenVS}`, defaultLineHeight, 10);
    }
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger
    writeLine(versorgungsamtName);
    versorgungsamtAdresse.split("\n").forEach(line => writeLine(line.trim()));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    // Datum rechtsbündig
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    // Betreff
    let betreffText = `Widerspruch gegen Ihren Bescheid vom ${datumBescheidSBA}`;
    if (aktenzeichenBescheidSBA.trim() !== "") betreffText += `, Aktenzeichen: ${aktenzeichenBescheidSBA}`;
    betreffText += `\nBetreffend: Feststellung des Grades der Behinderung (GdB) und von Merkzeichen für ${personName}, geb. ${personGeburtFormatiert}`;
    betreffText += `\n- ANTRAG AUF NEUBEWERTUNG UND KORREKTUR DER FESTSTELLUNGEN -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich/legen wir fristgerecht Widerspruch gegen Ihren oben genannten Bescheid vom ${datumBescheidSBA} ein. Mit diesem Bescheid haben Sie für Herrn/Frau ${personName} einen Grad der Behinderung (GdB) von ${festgestellterGdB} und die Merkzeichen "${festgestellteMerkzeichen}" festgestellt.`);
    if (widerspruchfuehrerIdentischSBA === 'nein' && wfNameSBA.trim() !== "") {
        writeParagraph(`Ich, ${wfNameSBA}, lege diesen Widerspruch als ${wfVerhaeltnisSBA || 'bevollmächtigte Person'} ein.`);
        if (wfVollmachtSBA) writeParagraph("Eine entsprechende Vollmacht ist beigefügt.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    writeParagraph(`Die getroffene Feststellung bezüglich "${abgelehntePunkteSBA || 'des GdB und/oder der Merkzeichen'}" wird dem tatsächlichen Ausmaß der gesundheitlichen Beeinträchtigungen und deren Auswirkungen auf meinen/unseren Alltag nicht gerecht.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines/unseres Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    if (argumentGesundheitszustandSBA.trim() !== "") {
        writeLine("Zum aktuellen Gesundheitszustand und den Auswirkungen der Behinderung(en):", defaultLineHeight, true, 10);
        writeParagraph(argumentGesundheitszustandSBA, defaultLineHeight, 11);
    }

    if (argumentAbweichungGutachtenSBA.trim() !== "") {
        writeLine("Zur Abweichung Ihrer Einschätzung von der ärztlichen Bewertung/meiner Selbsteinschätzung:", defaultLineHeight, true, 10);
        writeParagraph(argumentAbweichungGutachtenSBA, defaultLineHeight, 11);
    }
    
    if (argumentMerkzeichenSBA.trim() !== "") {
        writeLine("Zur Notwendigkeit der beantragten (aber nicht zuerkannten) Merkzeichen:", defaultLineHeight, true, 10);
        writeParagraph(argumentMerkzeichenSBA, defaultLineHeight, 11);
    }

    if (ergaenzendeArgumenteSBA.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen:", defaultLineHeight, true, 10);
        writeParagraph(ergaenzendeArgumenteSBA, defaultLineHeight, 11);
    }
    
    writeParagraph("Die beigefügten (ggf. neuen) ärztlichen Unterlagen belegen die Schwere und Vielfalt meiner/unserer gesundheitlichen Einschränkungen. Wir sind der Überzeugung, dass eine erneute, sorgfältige Prüfung unter Berücksichtigung aller Aspekte zu einer anderen, für mich/uns günstigeren Bewertung führen muss.", defaultLineHeight, 11);
    
    // Forderung
    writeLine("Meine/Unsere Forderung im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchSBA.trim() !== "") {
        writeParagraph(forderungWiderspruchSBA);
    } else {
        writeParagraph(`Ich/Wir beantragen daher nachdrücklich, Ihren Bescheid vom ${datumBescheidSBA} aufzuheben und den Grad der Behinderung (GdB) neu und höher festzustellen sowie die beantragten Merkzeichen [Hier ggf. die spezifisch gewünschten Merkzeichen nennen, falls im Formular nicht schon erfasst] anzuerkennen. Mindestens bitten wir um eine erneute ärztliche Begutachtung durch einen unabhängigen Gutachter des Amtes.`, defaultLineHeight, 11, {fontStyle:"bold"});
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
    writeParagraph(`Bitte bestätigen Sie uns den Eingang dieses Widerspruchs umgehend schriftlich. Wir erwarten Ihre rechtsmittelfähige Entscheidung über unseren Widerspruch bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, 11);
    writeParagraph("Sollten Sie unserem Widerspruch nicht vollumfänglich abhelfen, behalten wir uns ausdrücklich vor, Klage vor dem Sozialgericht zu erheben.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("widerspruch_schwerbehinderung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchSBA");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}