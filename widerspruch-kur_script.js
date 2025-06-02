document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('widerspruchKurForm');
    const saveBtn = document.getElementById('saveBtnWiderspruchKur');
    const loadBtn = document.getElementById('loadBtnWiderspruchKur');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchKur');
    const spendenPopup = document.getElementById('spendenPopupWiderspruchKur');
    const storageKey = 'widerspruchKurFormData';

    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "name", "adresse", "nummer", "kasseName", "kasseAdresse",
      "ursprAntragDatumKur", "kurArtAbgelehnt", "kurZielortAbgelehnt",
      "ablehnungsbescheidDatumKur", "aktenzeichenKur", 
      "hauptablehnungsgrund", "argumentMedizinischeNotwendigkeitKur", 
      "argumentKeineAlternativenKur", "argumentPersoenlicheAuswirkungenKur", "ergaenzendeArgumenteKur",
      "fristsetzungDatum" // NEUES FELD HINZUGEFÜGT
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
          const medNotwendigkeit = document.getElementById("argumentMedizinischeNotwendigkeitKur").value.trim();
          const keineAlternativen = document.getElementById("argumentKeineAlternativenKur").value.trim();
          const persAuswirkungen = document.getElementById("argumentPersoenlicheAuswirkungenKur").value.trim();

          if (medNotwendigkeit === "" && keineAlternativen === "" && persAuswirkungen === "") {
              alert("Bitte füllen Sie zumindest eines der spezifischen Begründungsfelder (medizinische Notwendigkeit, keine Alternativen, persönliche Auswirkungen) aus, um Ihren Widerspruch zu untermauern.");
              return;
          }
          generateWiderspruchKurPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWiderspruchKurPDF() {
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
    
    const ursprAntragDatumKurInput = document.getElementById("ursprAntragDatumKur").value;
    const ursprAntragDatumKur = ursprAntragDatumKurInput ? new Date(ursprAntragDatumKurInput).toLocaleDateString("de-DE") : '(nicht im Detail angegeben)';
    const kurArtAbgelehnt = document.getElementById("kurArtAbgelehnt").value;
    const kurZielortAbgelehnt = document.getElementById("kurZielortAbgelehnt").value;
    const ablehnungsbescheidDatumKurInput = document.getElementById("ablehnungsbescheidDatumKur").value;
    const ablehnungsbescheidDatumKur = ablehnungsbescheidDatumKurInput ? new Date(ablehnungsbescheidDatumKurInput).toLocaleDateString("de-DE") : 'UNBEKANNT (BITTE UNBEDINGT NACHTRAGEN!)';
    const aktenzeichenKur = document.getElementById("aktenzeichenKur").value;
    
    const hauptablehnungsgrund = document.getElementById("hauptablehnungsgrund").value;
    const argumentMedizinischeNotwendigkeitKur = document.getElementById("argumentMedizinischeNotwendigkeitKur").value;
    const argumentKeineAlternativenKur = document.getElementById("argumentKeineAlternativenKur").value;
    const argumentPersoenlicheAuswirkungenKur = document.getElementById("argumentPersoenlicheAuswirkungenKur").value;
    const ergaenzendeArgumenteKur = document.getElementById("ergaenzendeArgumenteKur").value;

    // NEUES FELD FÜR FRISTDATUM AUSLESEN
    const fristsetzungDatumInput = document.getElementById("fristsetzungDatum").value;
    let fristsetzungText;
    if (fristsetzungDatumInput) {
        fristsetzungText = new Date(fristsetzungDatumInput).toLocaleDateString("de-DE");
    } else {
        // Standardfrist 4 Wochen, wenn kein Datum eingegeben wurde
        fristsetzungText = new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE");
    }

    // --- PDF-Inhalt erstellen ---
    // ... (Absender, Empfänger, Datum - bleibt wie gehabt) ...
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

    // Betreff (bleibt wie gehabt)
    let betreffText = `Widerspruch gegen Ihren Ablehnungsbescheid vom ${ablehnungsbescheidDatumKur}`;
    if (aktenzeichenKur.trim() !== "") betreffText += `, Az.: ${aktenzeichenKur}`;
    betreffText += `\nBetreff: Antrag auf ${kurArtAbgelehnt || 'eine Kurmaßnahme'} vom ${ursprAntragDatumKur}`;
    if (kurZielortAbgelehnt.trim() !== "") betreffText += ` (Kureinrichtung: ${kurZielortAbgelehnt})`;
    betreffText += `\nVersichertennummer: ${nummer}`;
    betreffText += `\nDRINGENDE BITTE UM ERNEUTE PRÜFUNG UND GENEHMIGUNG`;
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede (bleibt wie gehabt)
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung Widerspruch (bleibt wie gehabt)
    writeParagraph(`hiermit lege ich fristgerecht und mit allem Nachdruck Widerspruch gegen Ihren oben genannten Ablehnungsbescheid vom ${ablehnungsbescheidDatumKur} ein. Mit diesem Bescheid haben Sie meinen Antrag auf ${kurArtAbgelehnt || 'die beantragte Kurmaßnahme'} vom ${ursprAntragDatumKur} leider abgelehnt.`);
    writeParagraph(`Diese Entscheidung ist für mich nicht nachvollziehbar und aus medizinischer sowie persönlicher Sicht nicht tragbar. Ich bitte Sie daher eindringlich um eine Neubewertung meines Antrags unter Berücksichtigung der folgenden Punkte und der beiliegenden/bereits vorliegenden ärztlichen Unterlagen.`);
    
    // Begründung des Widerspruchs - Strukturiert
    writeLine("Ausführliche Begründung meines Widerspruchs:", defaultLineHeight, true);
    y += spaceAfterParagraph / 2; 
    
    if (hauptablehnungsgrund.trim() !== "") {
        // Der Platzhalter-Kommentar ist hier entfernt. Die Formulierung leitet zu den folgenden Argumenten über.
        writeParagraph(`In Ihrem Schreiben führen Sie als Hauptgrund für die Ablehnung an: "${hauptablehnungsgrund}". Hierzu nehme ich wie folgt Stellung:`, defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight*0.5});
    }

    if (argumentMedizinischeNotwendigkeitKur.trim() !== "") {
        writeLine("Zur medizinischen Notwendigkeit:", defaultLineHeight, true, 10);
        writeParagraph(argumentMedizinischeNotwendigkeitKur, defaultLineHeight, 11);
    }

    if (argumentKeineAlternativenKur.trim() !== "") {
        writeLine("Zur Ausschöpfung alternativer/ambulanter Maßnahmen:", defaultLineHeight, true, 10);
        writeParagraph(argumentKeineAlternativenKur, defaultLineHeight, 11);
    }

    if (argumentPersoenlicheAuswirkungenKur.trim() !== "") {
        writeLine("Zu den persönlichen Auswirkungen der Nichtdurchführung der Kur:", defaultLineHeight, true, 10);
        writeParagraph(argumentPersoenlicheAuswirkungenKur, defaultLineHeight, 11);
    }
    
    if (ergaenzendeArgumenteKur.trim() !== "") {
        writeLine("Ergänzende Ausführungen zu den Ablehnungsgründen:", defaultLineHeight, true, 10);
        writeParagraph(ergaenzendeArgumenteKur, defaultLineHeight, 11);
    }
    
    writeParagraph("Alle meine Angaben werden durch die (erneut) beigefügten bzw. Ihnen bereits vorliegenden ärztlichen Atteste und Befundberichte gestützt. Diese belegen unzweifelhaft die medizinische Notwendigkeit und Dringlichkeit der beantragten Kurmaßnahme zur Wiederherstellung meiner Gesundheit bzw. zur Verhinderung einer weiteren Verschlechterung meines Gesundheitszustandes und zur Sicherung meiner Teilhabe am gesellschaftlichen und beruflichen Leben.", defaultLineHeight, 11);
    writeParagraph("Ich erinnere an Ihre Verpflichtung als Krankenkasse, im Rahmen des Wirtschaftlichkeitsgebots auch präventive und rehabilitative Maßnahmen zu ermöglichen, die langfristig höhere Kosten durch fortschreitende Erkrankungen oder Arbeitsunfähigkeit vermeiden können (§§ 23, 40, ggf. §§ 24, 41 SGB V).", defaultLineHeight, 10, {fontStyle: "italic"});

    // Forderung mit Fristsetzung (jetzt mit dem Wert aus dem Formularfeld oder dem dynamischen Default)
    writeParagraph("Ich fordere Sie daher nachdrücklich auf, Ihre ablehnende Entscheidung zu revidieren und die Kosten für die beantragte Kurmaßnahme umgehend zu bewilligen.", defaultLineHeight, 11, {fontStyle: "bold"});
    writeParagraph(`Ich bitte um eine schriftliche Bestätigung des Eingangs dieses Widerspruchs sowie um eine zeitnahe Bearbeitung und positive Bescheidung meines Anliegens innerhalb der gesetzlichen Fristen. Ich erwarte Ihre wohlwollende Entscheidung bis spätestens zum ${fristsetzungText}.`, defaultLineHeight, 11);
    writeParagraph("Sollte ich bis zu diesem Datum keine positive Rückmeldung erhalten oder mein Widerspruch erneut abgelehnt werden, sehe ich mich gezwungen, weitere rechtliche Schritte (ggf. Klage vor dem Sozialgericht) zu prüfen und einzuleiten.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift (mit reduziertem Abstand)
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(name);

    doc.save("widerspruch_kurantrag.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWiderspruchKur");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}