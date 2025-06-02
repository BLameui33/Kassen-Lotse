document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchHaushaltshilfeForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchHH');
    const loadBtn = document.getElementById('loadBtnWiderspruchHH');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchHH');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchHH');
    const storageKey = 'widerspruchHaushaltshilfeFormData';

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "name", "adresse", "nummer", "kasseName", "kasseAdresse",
      "ursprAntragDatumHH", "ursprAntragZeitraumHH", 
      "ablehnungsbescheidDatumHH", "aktenzeichenHH", 
      "begruendungMedizinischeNotwendigkeitHH", "begruendungKinderbetreuungHH",
      "begruendungKeineAnderePersonHH", "ergaenzendeBegruendungHH"
    ];

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
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
          // Optionale Validierung, ob zumindest eines der spezifischen Begründungsfelder ODER die ergänzende Begründung ausgefüllt ist
          const medNotwendigkeit = document.getElementById("begruendungMedizinischeNotwendigkeitHH").value.trim();
          const ergaenzendeBegr = document.getElementById("ergaenzendeBegruendungHH").value.trim();
          if (medNotwendigkeit === "" && ergaenzendeBegr === "") {
              alert("Bitte geben Sie zumindest eine Begründung für Ihren Widerspruch an (entweder zur medizinischen Notwendigkeit oder als ergänzende Begründung).");
              return;
          }
          generateWiderspruchHaushaltshilfePDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWiderspruchHaushaltshilfePDF() {
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
    const nummer = document.getElementById("nummer").value;
    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;
    
    const ursprAntragDatumHHInput = document.getElementById("ursprAntragDatumHH").value;
    const ursprAntragDatumHH = ursprAntragDatumHHInput ? new Date(ursprAntragDatumHHInput).toLocaleDateString("de-DE") : '(nicht im Detail angegeben)';
    const ursprAntragZeitraumHH = document.getElementById("ursprAntragZeitraumHH").value;
    const ablehnungsbescheidDatumHHInput = document.getElementById("ablehnungsbescheidDatumHH").value;
    const ablehnungsbescheidDatumHH = ablehnungsbescheidDatumHHInput ? new Date(ablehnungsbescheidDatumHHInput).toLocaleDateString("de-DE") : 'UNBEKANNT (BITTE UNBEDINGT NACHTRAGEN!)';
    const aktenzeichenHH = document.getElementById("aktenzeichenHH").value;
    
    const begruendungMedizinischeNotwendigkeitHH = document.getElementById("begruendungMedizinischeNotwendigkeitHH").value;
    const begruendungKinderbetreuungHH = document.getElementById("begruendungKinderbetreuungHH").value;
    const begruendungKeineAnderePersonHH = document.getElementById("begruendungKeineAnderePersonHH").value;
    const ergaenzendeBegruendungHH = document.getElementById("ergaenzendeBegruendungHH").value;

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender, Empfänger, Datum
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

    // Betreff
    let betreffText = `Widerspruch gegen Ihren Ablehnungsbescheid vom ${ablehnungsbescheidDatumHH}`;
    if (aktenzeichenHH.trim() !== "") betreffText += `, Az.: ${aktenzeichenHH}`;
    betreffText += `\nBetreff: Antrag auf Haushaltshilfe vom ${ursprAntragDatumHH} für den Zeitraum ${ursprAntragZeitraumHH || 'N/A'}`;
    betreffText += `\nVersichertennummer: ${nummer}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich fristgerecht Widerspruch gegen Ihren oben genannten Ablehnungsbescheid vom ${ablehnungsbescheidDatumHH} ein, mit dem Sie meinen Antrag auf Gewährung von Haushaltshilfe für den Zeitraum ${ursprAntragZeitraumHH || '(Zeitraum bitte eintragen)'} (Antrag vom ${ursprAntragDatumHH}) abgelehnt haben.`);
    
    // Begründung des Widerspruchs
    writeLine("Begründung:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    if (begruendungMedizinischeNotwendigkeitHH.trim() !== "") {
        writeParagraph(`Die medizinische Notwendigkeit für die beantragte Haushaltshilfe besteht weiterhin bzw. bestand im beantragten Zeitraum vollumfänglich. Hierzu führe ich aus:\n${begruendungMedizinischeNotwendigkeitHH}`);
    }
    if (begruendungKinderbetreuungHH.trim() !== "") {
        writeParagraph(`Zur Situation der Kinderbetreuung ist anzumerken:\n${begruendungKinderbetreuungHH}`);
    }
    if (begruendungKeineAnderePersonHH.trim() !== "") {
        writeParagraph(`Bezüglich der Möglichkeit der Haushaltsführung durch eine andere im Haushalt lebende Person ist Folgendes zu sagen:\n${begruendungKeineAnderePersonHH}`);
    }
    
    if (ergaenzendeBegruendungHH.trim() !== "") {
        writeParagraph(`Ergänzend zu den oben genannten Punkten und zu den in Ihrem Bescheid genannten Ablehnungsgründen möchte ich Folgendes ausführen:\n${ergaenzendeBegruendungHH}`);
    }
    
    writeParagraph("Ich beziehe mich auf die gesetzlichen Grundlagen (§ 38 SGB V bzw. § 24h SGB V) sowie auf die beigelegte(n) bzw. bereits bei Ihnen vorliegende(n) ärztliche(n) Bescheinigung(en), welche die Notwendigkeit der Haushaltshilfe untermauern.", defaultLineHeight, 11);

    // Forderung
    writeParagraph("Ich bitte Sie daher eindringlich, Ihre Entscheidung zu überprüfen und meinem Antrag auf Haushaltshilfe für den genannten Zeitraum stattzugeben.");
    writeParagraph("Bitte bestätigen Sie mir den Eingang dieses Widerspruchs und teilen Sie mir Ihre erneute Entscheidung fristgerecht mit.");
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(name);

    doc.save("widerspruch_haushaltshilfe.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchHH");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}