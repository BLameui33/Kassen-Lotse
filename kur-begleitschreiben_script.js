document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('kurBegleitschreibenForm');
    const saveBtn = document.getElementById('saveBtnKurBegleitschreiben');
    const loadBtn = document.getElementById('loadBtnKurBegleitschreiben');
    const closePopupBtn = document.getElementById('closePopupBtnKurBegleitschreiben');
    const spendenPopup = document.getElementById('spendenPopupKurBegleitschreiben');
    const storageKey = 'kurBegleitschreibenFormData';

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "name", "adresse", "geburt", "nummer", "telefon", 
      "kasseName", "kasseAdresse",
      "kurArt", "kurZielortKlinik", "kurBeantragterZeitraum", 
      "datumAerztlichesAttestKur", "hauptdiagnoseKur",
      "persoenlicheBegruendungKur", "anlageSonstigesKur"
    ];
    const anlagenCheckboxName = "anlagenKur";

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
        } else if (checkbox) { // Sicherstellen, dass checkbox existiert
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
          generateKurBegleitschreibenPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateKurBegleitschreibenPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 2;

    // Hilfsfunktionen für PDF (sollten idealerweise in einer zentralen Helper-Datei sein)
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
    const telefon = document.getElementById("telefon").value;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    const kurArt = document.getElementById("kurArt").value;
    const kurZielortKlinik = document.getElementById("kurZielortKlinik").value;
    const kurBeantragterZeitraum = document.getElementById("kurBeantragterZeitraum").value;
    const datumAerztlichesAttestKurInput = document.getElementById("datumAerztlichesAttestKur").value;
    const datumAerztlichesAttestKur = datumAerztlichesAttestKurInput ? new Date(datumAerztlichesAttestKurInput).toLocaleDateString("de-DE") : 'liegt bei';
    const hauptdiagnoseKur = document.getElementById("hauptdiagnoseKur").value;
    const persoenlicheBegruendungKur = document.getElementById("persoenlicheBegruendungKur").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenKur"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        anlagen.push(checkbox.value);
    });
    const anlageSonstigesKur = document.getElementById("anlageSonstigesKur").value;
    if (anlageSonstigesKur.trim() !== "") {
        anlagen.push("Sonstige Anlagen: " + anlageSonstigesKur);
    }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender, Empfänger, Datum (wie gehabt)
    writeLine(name);
    adresse.split("\n").forEach(line => writeLine(line));
    if (telefon.trim() !== "") writeLine("Tel.: " + telefon);
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
    let betreffText = `Begleitschreiben zum Antrag auf ${kurArt || 'eine Kurmaßnahme'}`;
    betreffText += `\nVersichertennummer: ${nummer}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`anbei erhalten Sie meinen/unseren vollständig ausgefüllten Antrag auf ${kurArt || 'eine Kurmaßnahme'} sowie die dazugehörigen ärztlichen Unterlagen. Dieses Schreiben dient zur Ergänzung und persönlichen Erläuterung meines/unseres Anliegens.`);
    
    // Kurdetails
    writeParagraph(`Die beantragte Maßnahme (${kurArt}) soll voraussichtlich im Zeitraum ${kurBeantragterZeitraum || '(Zeitraum bitte im Antrag eintragen)'} stattfinden.`);
    if (kurZielortKlinik.trim() !== "") {
        writeParagraph(`Als Kureinrichtung ist ${kurZielortKlinik} vorgesehen/gewünscht.`);
    }
    writeParagraph(`Die medizinische Notwendigkeit ergibt sich aus der Hauptdiagnose "${hauptdiagnoseKur || '(Hauptdiagnose bitte eintragen)'}" und wird im beigefügten ärztlichen Attest vom ${datumAerztlichesAttestKur} ausführlich dargelegt.`);

    // Persönliche Begründung
    if (persoenlicheBegruendungKur.trim() !== "") {
        writeLine("Zu meiner persönlichen Situation und Motivation möchte ich ergänzen:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        writeParagraph(persoenlicheBegruendungKur);
    }
    
    // Anlagen
    if (anlagen.length > 0) {
        writeLine("Folgende Unterlagen sind diesem Schreiben und dem Hauptantrag beigefügt:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    } else {
        writeParagraph("Dem Hauptantrag sind alle erforderlichen Unterlagen, insbesondere das ärztliche Attest, beigefügt.");
    }
    
    // Abschluss
    writeParagraph("Ich bitte Sie um eine wohlwollende Prüfung meiner Unterlagen und um eine baldige positive Entscheidung bezüglich der Kostenübernahme für die beantragte Kurmaßnahme.", defaultLineHeight, 11);
    writeParagraph("Für Rückfragen stehe ich Ihnen gerne zur Verfügung.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift (mit reduziertem Abstand)
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(name);

    doc.save("begleitschreiben_kurantrag.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupKurBegleitschreiben");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}