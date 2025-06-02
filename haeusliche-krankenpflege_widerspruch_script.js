document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchHkpForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchHkp');
    const loadBtn = document.getElementById('loadBtnWiderspruchHkp');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchHkp');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchHkp');
    const storageKey = 'widerspruchHkpFormData';

    // --- Steuerung der dynamischen Widerspruchsführer-Felder ---
    const widerspruchfuehrerIdentischSelect = document.getElementById('widerspruchfuehrerIdentischHkp');
    const widerspruchfuehrerDetailsDiv = document.getElementById('widerspruchfuehrerDetailsHkp');
    const anlageVollmachtHkpWiderspruchCheckbox = document.getElementById('anlageVollmachtHkpWiderspruch');


    function updateWiderspruchfuehrerDetailsVisibility() {
        if (widerspruchfuehrerIdentischSelect.value === 'nein') {
            widerspruchfuehrerDetailsDiv.style.display = 'block';
            document.getElementById('wfNameHkp').required = true;
            document.getElementById('wfAdresseHkp').required = true;
            document.getElementById('wfVerhaeltnisHkp').required = true;
            if (anlageVollmachtHkpWiderspruchCheckbox) anlageVollmachtHkpWiderspruchCheckbox.required = true;
        } else {
            widerspruchfuehrerDetailsDiv.style.display = 'none';
            document.getElementById('wfNameHkp').required = false;
            document.getElementById('wfAdresseHkp').required = false;
            document.getElementById('wfVerhaeltnisHkp').required = false;
            if (anlageVollmachtHkpWiderspruchCheckbox) anlageVollmachtHkpWiderspruchCheckbox.required = false;
        }
    }
    if (widerspruchfuehrerIdentischSelect) {
        widerspruchfuehrerIdentischSelect.addEventListener('change', updateWiderspruchfuehrerDetailsVisibility);
        updateWiderspruchfuehrerDetailsVisibility(); 
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "vpName", "vpGeburt", "vpAdresse", "vpNummer",
      "widerspruchfuehrerIdentischHkp", "wfNameHkp", "wfAdresseHkp", "wfVerhaeltnisHkp",
      "kasseName", "kasseAdresse",
      "datumVerordnungHkpAbgelehnt", "beantragteLeistungenHkp", 
      "datumAblehnungsbescheidHkp", "aktenzeichenHkp", "hauptablehnungsgrundHkp",
      "argumentMedizinischeNotwendigkeitHkp", "argumentKeineAlternativeVersorgungHkp", "ergaenzendeArgumenteHkp",
      "forderungWiderspruchHkp", "anlageSonstigesHkpWiderspruch"
    ];
    const anlagenCheckboxName = "anlagenHkpWiderspruch";

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
      });
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtHkp');
      if (wfVollmachtCheckbox) data.wfVollmachtHkp = wfVollmachtCheckbox.checked;
      
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
      const wfVollmachtCheckbox = document.getElementById('wfVollmachtHkp');
      if (wfVollmachtCheckbox && data.wfVollmachtHkp !== undefined) wfVollmachtCheckbox.checked = data.wfVollmachtHkp;

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
          if (document.getElementById("argumentMedizinischeNotwendigkeitHkp").value.trim() === "" &&
              document.getElementById("ergaenzendeArgumenteHkp").value.trim() === "") {
              alert("Bitte geben Sie zumindest eine Begründung für Ihren Widerspruch an (entweder zur medizinischen Notwendigkeit oder als ergänzende Begründung).");
              return;
          }
          generateHkpWiderspruchPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateHkpWiderspruchPDF() {
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

    const widerspruchfuehrerIdentischHkp = document.getElementById("widerspruchfuehrerIdentischHkp").value;
    const wfNameHkp = document.getElementById("wfNameHkp").value;
    const wfAdresseHkp = document.getElementById("wfAdresseHkp").value;
    const wfVerhaeltnisHkp = document.getElementById("wfVerhaeltnisHkp").value;
    const wfVollmachtHkp = document.getElementById("wfVollmachtHkp") ? document.getElementById("wfVollmachtHkp").checked : false;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;
    
    const datumVerordnungHkpAbgelehntInput = document.getElementById("datumVerordnungHkpAbgelehnt").value;
    const datumVerordnungHkpAbgelehnt = datumVerordnungHkpAbgelehntInput ? new Date(datumVerordnungHkpAbgelehntInput).toLocaleDateString("de-DE") : 'N/A';
    const beantragteLeistungenHkp = document.getElementById("beantragteLeistungenHkp").value;
    const datumAblehnungsbescheidHkpInput = document.getElementById("datumAblehnungsbescheidHkp").value;
    const datumAblehnungsbescheidHkp = datumAblehnungsbescheidHkpInput ? new Date(datumAblehnungsbescheidHkpInput).toLocaleDateString("de-DE") : 'UNBEKANNT';
    const aktenzeichenHkp = document.getElementById("aktenzeichenHkp").value;
    const hauptablehnungsgrundHkp = document.getElementById("hauptablehnungsgrundHkp").value;
    
    const argumentMedizinischeNotwendigkeitHkp = document.getElementById("argumentMedizinischeNotwendigkeitHkp").value;
    const argumentKeineAlternativeVersorgungHkp = document.getElementById("argumentKeineAlternativeVersorgungHkp").value;
    const ergaenzendeArgumenteHkp = document.getElementById("ergaenzendeArgumenteHkp").value;
    const forderungWiderspruchHkp = document.getElementById("forderungWiderspruchHkp").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenHkpWiderspruch"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtHkpWiderspruch" && widerspruchfuehrerIdentischHkp === "ja") {
            // Nicht hinzufügen
        } else {
             anlagen.push(checkbox.value);
        }
    });
    const anlageSonstigesHkpWiderspruch = document.getElementById("anlageSonstigesHkpWiderspruch").value;
    if (anlageSonstigesHkpWiderspruch.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesHkpWiderspruch); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    if (widerspruchfuehrerIdentischHkp === 'nein' && wfNameHkp.trim() !== "") {
        absenderName = wfNameHkp;
        absenderAdresse = wfAdresseHkp;
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line));
    if (widerspruchfuehrerIdentischHkp === 'nein' && wfNameHkp.trim() !== ""){
         writeParagraph(`(handelnd für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`, defaultLineHeight, 9, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    }
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger, Datum (Standard)
    writeLine(kasseName);
    kasseAdresse.split("\n").forEach(line => writeLine(line));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    // Betreff
    let betreffText = `Widerspruch gegen Ihren Ablehnungsbescheid vom ${datumAblehnungsbescheidHkp} betreffend häusliche Krankenpflege`;
    if (aktenzeichenHkp.trim() !== "") betreffText += `, Az.: ${aktenzeichenHkp}`;
    betreffText += `\nFür: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer}`;
    betreffText += `\nUrsprüngliche Verordnung vom: ${datumVerordnungHkpAbgelehnt}`;
    betreffText += `\n- ERNEUTE DRINGENDE AUFFORDERUNG ZUR GENEHMIGUNG DER ÄRZTLICH VERORDNETEN LEISTUNGEN -`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich/legen wir fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Bescheid vom ${datumAblehnungsbescheidHkp} ein. Mit diesem Bescheid haben Sie die ärztlich verordnete häusliche Krankenpflege für ${vpName} (ursprünglich verordnet am ${datumVerordnungHkpAbgelehnt} für ${beantragteLeistungenHkp || 'die beantragten Leistungen'}) ganz oder teilweise abgelehnt.`);
    if (widerspruchfuehrerIdentischHkp === 'nein' && wfNameHkp.trim() !== "") {
        writeParagraph(`Ich, ${wfNameHkp}, lege diesen Widerspruch als ${wfVerhaeltnisHkp || 'bevollmächtigte Person'} ein.`);
        if (wfVollmachtHkp) writeParagraph("Eine entsprechende Vollmacht/Bestallungsurkunde liegt bei bzw. wird kurzfristig nachgereicht.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    writeParagraph(`Ihre Entscheidung ist für uns nicht nachvollziehbar und gefährdet die medizinisch notwendige Versorgung und den Gesundheitszustand von Herrn/Frau ${vpName}.`);
    
    // Begründung des Widerspruchs
    writeLine("Ausführliche Begründung meines/unseres Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    if (hauptablehnungsgrundHkp.trim() !== "") {
        writeParagraph(`Sie begründen Ihre Ablehnung im Wesentlichen mit: "${hauptablehnungsgrundHkp}". Dieser Begründung kann ich/können wir nicht folgen und nehmen hierzu wie folgt Stellung:`, defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight*0.5});
    }

    if (argumentMedizinischeNotwendigkeitHkp.trim() !== "") {
        writeLine("Zur zwingenden medizinischen Notwendigkeit der verordneten HKP:", defaultLineHeight, true, 10);
        writeParagraph(argumentMedizinischeNotwendigkeitHkp, defaultLineHeight, 11);
    }

    if (argumentKeineAlternativeVersorgungHkp.trim() !== "") {
        writeLine("Zur fehlenden alternativen Versorgungsmöglichkeit:", defaultLineHeight, true, 10);
        writeParagraph(argumentKeineAlternativeVersorgungHkp, defaultLineHeight, 11);
    }
    
    if (ergaenzendeArgumenteHkp.trim() !== "") {
        writeLine("Weitere ergänzende Ausführungen und Entgegnung zu Ihren Ablehnungsgründen:", defaultLineHeight, true, 10);
        writeParagraph(ergaenzendeArgumenteHkp, defaultLineHeight, 11);
    }
    
    writeParagraph(`Die Notwendigkeit der häuslichen Krankenpflege gemäß § 37 SGB V ist durch die beiliegende/Ihnen bereits vorliegende ärztliche Verordnung vom ${datumVerordnungHkpAbgelehnt} eindeutig belegt. Ohne diese Maßnahmen droht eine erhebliche Verschlechterung des Gesundheitszustandes und/oder die Notwendigkeit einer (erneuten) Krankenhausbehandlung, was höhere Kosten verursachen würde.`, defaultLineHeight, 11);
    
    // Forderung
    writeLine("Meine/Unsere Forderung im Widerspruchsverfahren:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    if (forderungWiderspruchHkp.trim() !== "") {
        writeParagraph(forderungWiderspruchHkp);
    } else {
        writeParagraph(`Ich/Wir fordern Sie daher nachdrücklich auf, Ihren Ablehnungsbescheid vom ${datumAblehnungsbescheidHkp} zu revidieren und die Kosten für die ärztlich verordnete häusliche Krankenpflege im vollen Umfang und ab dem ursprünglich beantragten Zeitpunkt zu übernehmen.`, defaultLineHeight, 11, {fontStyle:"bold"});
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
    writeParagraph(`Bitte bestätigen Sie uns den Eingang dieses Widerspruchs umgehend schriftlich. Wir erwarten Ihre rechtsmittelfähige Entscheidung über unseren Widerspruch bis spätestens zum ${fristsetzungDatumText}.`, defaultLineHeight, 11);
    writeParagraph("Sollten Sie unserem Widerspruch nicht vollumfänglich abhelfen, behalten wir uns ausdrücklich vor, Klage vor dem Sozialgericht zu erheben.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("widerspruch_haeusliche_krankenpflege.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchHkp");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}