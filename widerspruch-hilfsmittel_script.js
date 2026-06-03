document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchHilfsmittelForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchHilfsmittel');
    const loadBtn = document.getElementById('loadBtnWiderspruchHilfsmittel');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchHilfsmittel');
    const spendenPopup = document.getElementById('spendenPopupWiderspruch'); 
    const storageKey = 'widerspruchHilfsmittelFormData'; 

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "name", "adresse", "nummer", "kasseName", "kasseAdresse",
      "abgelehnterAntragDatum", "abgelehntesHilfsmittel", 
      "ablehnungsbescheidDatum", "aktenzeichen", "widerspruchBegruendung"
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
          generateWiderspruchHilfsmittelPDF();
        });
    }
}); 

function generateWiderspruchHilfsmittelPDF() {
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

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = 11) {
        doc.setFontSize(paragraphFontSize);
        doc.setFont(undefined, "normal");
        const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
        for (let i = 0; i < lines.length; i++) {
            if (y + paragraphLineHeight > usableHeight) { doc.addPage(); y = margin; }
            doc.text(lines[i], margin, y);
            y += paragraphLineHeight;
        }
        if (y + spaceAfterParagraph > usableHeight && lines.length > 0) { doc.addPage(); y = margin; }
        else if (lines.length > 0) { y += spaceAfterParagraph; }
    }
    
    // Formulardaten sammeln
    const name = document.getElementById("name").value;
    const adresse = document.getElementById("adresse").value;
    const nummer = document.getElementById("nummer").value;
    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;
    const abgelehnterAntragDatumInput = document.getElementById("abgelehnterAntragDatum").value;
    const abgelehnterAntragDatum = abgelehnterAntragDatumInput ? new Date(abgelehnterAntragDatumInput).toLocaleDateString("de-DE") : '(Datum nicht angegeben)';
    const abgelehntesHilfsmittel = document.getElementById("abgelehntesHilfsmittel").value;
    const ablehnungsbescheidDatumInput = document.getElementById("ablehnungsbescheidDatum").value;
    const ablehnungsbescheidDatum = ablehnungsbescheidDatumInput ? new Date(ablehnungsbescheidDatumInput).toLocaleDateString("de-DE") : 'unbekannt';
    const aktenzeichen = document.getElementById("aktenzeichen").value;
    const widerspruchBegruendung = document.getElementById("widerspruchBegruendung").value;

    // ==========================================
    // --- BRIEFKOPF START (Überall wiederverwendbar) ---
    // ==========================================
    
    // 1. RECHTER BLOCK: Haupt-Absenderblock in der Ecke
    const rightColumnX = pageWidth - margin - 60; // Startpunkt rechts (ca. 130mm)
    let rightY = margin;
    
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Absender:", rightColumnX, rightY);
    rightY += 5;
    
    doc.setFont(undefined, "normal");
    doc.text(name, rightColumnX, rightY);
    rightY += defaultLineHeight;
    
    adresse.split("\n").forEach(line => {
        doc.text(line.trim(), rightColumnX, rightY);
        rightY += defaultLineHeight;
    });

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger
    let leftY = margin + 15; // Typische Fenster-Höhe ab 35mm
    
    // Inline-Rücksendezeile erzeugen (Ersetzt Zeilenumbrüche durch Punkte)
    const cleanAddressInline = adresse.replace(/\r?\n/g, " · ");
    const ruecksendeZeile = `${name} · ${cleanAddressInline}`;
    
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(120, 120, 120); // Schickes Grau für die Zeile
    doc.text(ruecksendeZeile, margin, leftY);
    
    //  dezente Unterstreichung
    doc.setDrawColor(180, 180, 180); // Helles Grau für die Linie
    doc.setLineWidth(0.2);
    doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); // 85mm Breite deckt das Brieffenster ab
    
    // Empfänger-Adresse platzieren
    leftY += 6; 
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
    doc.text(kasseName, margin, leftY);
    leftY += defaultLineHeight;
    
    kasseAdresse.split("\n").forEach(line => {
        doc.text(line.trim(), margin, leftY);
        leftY += defaultLineHeight;
    });

    // 3. DATUM: Rechtsbündig unterhalb der Adressblöcke
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Dynamic Safe-Start für den Haupttext (Setzt 'y' sauber auf die nächste freie Zeile)
    y = datumY + 12;

    // ==========================================
    // --- BRIEFKOPF ENDE ---
    // ==========================================

    // Betreff
    let betreffText = `Widerspruch gegen Ihren Ablehnungsbescheid vom ${ablehnungsbescheidDatum}`;
    if (aktenzeichen.trim() !== "") betreffText += `, Az.: ${aktenzeichen}`;
    betreffText += `\nBetreff: Antrag auf Kostenübernahme für ${abgelehntesHilfsmittel || 'ein medizinisches Hilfsmittel'}`;
    if (abgelehnterAntragDatumInput.trim() !== "") betreffText += ` (ursprünglicher Antrag vom ${abgelehnterAntragDatum})`;
    betreffText += `\nVersichertennummer: ${nummer}`;
    
    const betreffFontSize = 12;
    const betreffLines = doc.splitTextToSize(betreffText, pageWidth - (2 * margin));
    betreffLines.forEach(line => writeLine(line, defaultLineHeight, true, betreffFontSize));
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11);
    y -= spaceAfterParagraph; 
    if (y + defaultLineHeight * 0.5 <= usableHeight) y += defaultLineHeight * 0.5; else { doc.addPage(); y = margin; }

    // Einleitung Widerspruch
    writeParagraph(`hiermit lege ich fristgerecht Widerspruch gegen Ihren oben genannten Ablehnungsbescheid vom ${ablehnungsbescheidDatum} ein, mit dem Sie meinen Antrag auf Kostenübernahme für ${abgelehntesHilfsmittel || 'das beantragte medizinische Hilfsmittel'} abgelehnt haben.`);
    
    // Begründung des Widerspruchs
    writeLine("Begründung:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    if (widerspruchBegruendung.trim() !== "") {
        writeParagraph(widerspruchBegruendung);
    } else {
        writeParagraph("[Hier bitte Ihre ausführliche Begründung einfügen, warum die Ablehnung nicht korrekt ist und das Hilfsmittel weiterhin benötigt wird. Beziehen Sie sich auf die Ablehnungsgründe der Krankenkasse und legen Sie ggf. neue Nachweise bei.]");
    }
    writeParagraph("Ich verweise zudem auf die medizinische Notwendigkeit des Hilfsmittels, wie sie aus der ärztlichen Verordnung hervorgeht. Mein Anspruch auf Versorgung mit dem notwendigen Hilfsmittel ergibt sich aus § 33 SGB V.");

    // Forderung
    writeParagraph("Ich bitte Sie daher dringend, Ihre Entscheidung nochmals zu überprüfen und meinem Antrag auf Kostenübernahme für das beantragte Hilfsmittel stattzugeben.");
    writeParagraph("Sollten Sie weitere Unterlagen benötigen oder eine erneute Begutachtung durch den MDK für erforderlich halten, stehe ich hierfür selbstverständlich zur Verfügung.");
    writeParagraph("Ich bitte um eine schriftliche Bestätigung des Eingangs dieses Widerspruchs und um eine zeitnahe, positive Neubewertung meines Antrags.");
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    y += 10; // Kleiner Platzhalter für die echte Unterschrift
    writeParagraph(name);

    doc.save("widerspruch_hilfsmittel.pdf");

    const spendenPopup = document.getElementById("spendenPopupWiderspruch");
    if (spendenPopup) {
        spendenPopup.style.display = "flex";
    }
}