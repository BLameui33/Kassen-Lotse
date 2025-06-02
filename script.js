document.getElementById("antragForm").addEventListener("submit", function(e) {
  e.preventDefault();

  // Validierung: Mindestens 5 Kontaktversuche müssen ausgefüllt sein (wie zuvor)
  let ausgefuelltePflichtKontakte = 0;
  for (let i = 0; i < 5; i++) {
    if (document.getElementById(`kontakt_name_${i}`).value.trim() !== "") {
      ausgefuelltePflichtKontakte++;
    }
  }

  if (ausgefuelltePflichtKontakte < 5) {
    alert("Bitte füllen Sie mindestens die ersten 5 Kontaktversuche vollständig aus.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Seiten-Konstanten und Initialisierung
  const margin = 20; // mm
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableHeight = pageHeight - margin; // Nutzbare Höhe bevor der untere Rand erreicht wird
  let y = margin; // Start-Y-Position am oberen Rand

  const defaultLineHeight = 7; // Standard Zeilenhöhe in mm
  const spaceAfterParagraph = 2; // Standard Abstand nach einem Absatz

  // Hilfsfunktion für Seitenumbruch-Check und Textausgabe (für einzelne Zeilen)
  function writeLine(text, currentLineHeight = defaultLineHeight, isBold = false, fontSize = 11) {
    if (y + currentLineHeight > usableHeight) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(fontSize);
    doc.setFont(undefined, isBold ? "bold" : "normal");
    doc.text(text, margin, y);
    y += currentLineHeight;
  }

  // Überarbeitete writeParagraph Funktion
  function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = 11) {
    doc.setFontSize(paragraphFontSize);
    doc.setFont(undefined, "normal");
    const lines = doc.splitTextToSize(text, pageWidth - (2 * margin)); // Text auf Seitenbreite umbrechen

    for (let i = 0; i < lines.length; i++) {
      if (y + paragraphLineHeight > usableHeight) {
        doc.addPage();
        y = margin; // y für neue Seite zurücksetzen
      }
      doc.text(lines[i], margin, y);
      y += paragraphLineHeight;
    }
    // Platz nach dem Absatz hinzufügen (und ggf. umbrechen)
    if (y + spaceAfterParagraph > usableHeight && lines.length > 0) { // Nur umbrechen, wenn gerade Text geschrieben wurde
        doc.addPage();
        y = margin;
    } else if (lines.length > 0) { // Nur Abstand hinzufügen, wenn Text geschrieben wurde
        y += spaceAfterParagraph;
    }
  }


  // Formulardaten sammeln (wie zuvor, mit korrekter Datumsformatierung)
  const name = document.getElementById("name").value;
  const adresse = document.getElementById("adresse").value;
  const geburtInput = document.getElementById("geburt").value;
  const geburt = geburtInput ? new Date(geburtInput).toLocaleDateString("de-DE") : 'N/A';
  const nummer = document.getElementById("nummer").value;

  const kasse = document.getElementById("kasse").value;
  const kassenAdresse = document.getElementById("kassenAdresse").value;

  const beschwerdenDiagnose = document.getElementById("beschwerden_diagnose").value;

  const kontakte = [];
  for (let i = 0; i < 10; i++) {
    const kontaktNameElement = document.getElementById(`kontakt_name_${i}`);
    if (kontaktNameElement && kontaktNameElement.value.trim() !== "") {
      const kontaktDatumInput = document.getElementById(`kontakt_datum_${i}`).value;
      kontakte.push({
        name: kontaktNameElement.value,
        datum: kontaktDatumInput ? new Date(kontaktDatumInput).toLocaleDateString("de-DE") : 'N/A',
        art: document.getElementById(`kontakt_art_${i}`).value,
        ergebnis: document.getElementById(`kontakt_ergebnis_${i}`).value
      });
    }
  }

  const therapeut = document.getElementById("therapeut").value;
  const therapeutAdresse = document.getElementById("therapeutAdresse").value;
  const approbiert = document.getElementById("approbiert").value;
  const kassenzulassung = document.getElementById("kassenzulassung").value;
  const verfuegbar = document.getElementById("verfuegbar").value;

  // --- PDF-Inhalt erstellen ---

  // Briefkopf Absender
  writeLine(name, defaultLineHeight, false, 11);
  adresse.split("\n").forEach(line => {
    writeLine(line, defaultLineHeight, false, 11);
  });
  if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; // Extra Abstand, wenn Platz

  // Empfänger (Krankenkasse)
  writeLine(kasse, defaultLineHeight, false, 11);
  kassenAdresse.split("\n").forEach(line => {
    writeLine(line, defaultLineHeight, false, 11);
  });
  if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; // Größerer Abstand, wenn Platz

  // Datum rechtsbündig
  const datumHeute = new Date().toLocaleDateString("de-DE");
  const datumsFontSize = 11;
  doc.setFontSize(datumsFontSize);
  const datumsBreite = doc.getStringUnitWidth(datumHeute) * datumsFontSize / doc.internal.scaleFactor;
  if (y + defaultLineHeight > usableHeight) { // Check vor Datumszeile
      doc.addPage();
      y = margin;
  }
  doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
  if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else { doc.addPage(); y = margin; }


  // Betreff
  // Für Überschriften eine spezielle Behandlung oder eine erweiterte writeLine/writeParagraph Funktion
  const betreffText = "Antrag auf Kostenerstattung für ambulante Psychotherapie gemäß § 13 Abs. 3 SGB V";
  const betreffFontSize = 12;
  const betreffLines = doc.splitTextToSize(betreffText, pageWidth - (2 * margin));
  betreffLines.forEach(line => {
      writeLine(line, defaultLineHeight + 1, true, betreffFontSize); // Etwas mehr Höhe für fette Schrift
  });
  if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }


  // Einleitung
  writeParagraph(`Sehr geehrte Damen und Herren,`, defaultLineHeight, 11);
  y -= spaceAfterParagraph; // Weniger Abstand direkt nach der Anrede
  if (y + defaultLineHeight * 0.5 <= usableHeight) y += defaultLineHeight * 0.5; else { doc.addPage(); y = margin; }

  writeParagraph(`hiermit beantrage ich, ${name}, geboren am ${geburt}, Versichertennummer ${nummer}, die Kostenübernahme für eine ambulante psychotherapeutische Behandlung im Rahmen des Kostenerstattungsverfahrens gemäß § 13 Abs. 3 SGB V.`, defaultLineHeight, 11);
  writeParagraph(`Ich leide unter ${beschwerdenDiagnose} und benötige dringend psychotherapeutische Unterstützung. Eine entsprechende Notwendigkeitsbescheinigung liegt diesem Antrag bei / wird nachgereicht.`, defaultLineHeight, 11);
  
  // Begründung
  const begruendungUeberschrift = "Begründung der Notwendigkeit und Dringlichkeit der Behandlung:";
  const begruendungFontSize = 11;
  const begruendungLines = doc.splitTextToSize(begruendungUeberschrift, pageWidth - (2*margin));
  begruendungLines.forEach(line => {
      writeLine(line, defaultLineHeight, true, begruendungFontSize);
  });
   if (y + spaceAfterParagraph <= usableHeight) y += spaceAfterParagraph; else { doc.addPage(); y = margin; }


  writeParagraph(`Trotz intensiver und dokumentierter Bemühungen war es mir nicht möglich, innerhalb einer zumutbaren Frist einen Behandlungsplatz bei einem oder einer niedergelassenen, kassenzugelassenen Psychotherapeut:in zu finden. Die Wartezeiten bei den kontaktierten Therapeut:innen sind unzumutbar lang und/oder es besteht ein Aufnahmestopp.`, defaultLineHeight, 11);
  writeParagraph(`Meine erfolglosen Kontaktversuche sind im Folgenden detailliert aufgeführt:`, defaultLineHeight, 11);
  if (y + defaultLineHeight * 0.5 <= usableHeight) y += defaultLineHeight * 0.5; else { doc.addPage(); y = margin; }


  // Kontaktversuche dokumentieren
  if (kontakte.length > 0) {
    kontakte.forEach((k, index) => {
      // Kleinere Schrift und Zeilenhöhe für die Auflistung der Kontakte
      const kontaktText = `${index + 1}. ${k.name || 'N/A'}:\n   Kontaktiert am ${k.datum || 'N/A'} per ${k.art || 'N/A'}\n   Ergebnis: ${k.ergebnis || 'N/A'}`;
      writeParagraph(kontaktText, defaultLineHeight -1, 10); // z.B. Zeilenhöhe 6, Schrift 10
      if (y + spaceAfterParagraph <= usableHeight) y += spaceAfterParagraph; else { doc.addPage(); y = margin; } // Etwas mehr Abstand zwischen den Kontakten
    });
  } else {
    writeParagraph("Es wurden nicht genügend Kontaktversuche dokumentiert (mindestens 5 sind erforderlich).", defaultLineHeight, 11);
  }
  if (y + defaultLineHeight * 0.5 <= usableHeight) y += defaultLineHeight * 0.5; else { doc.addPage(); y = margin; }


  // Gewünschte:r Therapeut:in
  const therapeutUeberschrift = "Behandlung bei einem/einer Privattherapeut:in:";
  const therapeutUeberschriftLines = doc.splitTextToSize(therapeutUeberschrift, pageWidth - (2*margin));
  therapeutUeberschriftLines.forEach(line => {
    writeLine(line, defaultLineHeight, true, 11);
  });
  if (y + spaceAfterParagraph <= usableHeight) y += spaceAfterParagraph; else { doc.addPage(); y = margin; }

  writeParagraph(`Da eine zeitnahe Behandlung im Kassensystem nicht realisierbar ist, aber zur Vermeidung einer Verschlechterung meines Gesundheitszustandes bzw. zur Chronifizierung dringend erforderlich ist, beabsichtige ich, die Behandlung bei`, defaultLineHeight, 11);
  writeParagraph(`   ${therapeut || '[Name des/der Privattherapeut:in noch eintragen]'}\n   ${therapeutAdresse.replace(/\n/g, '\n   ') || '[Adresse des/der Privattherapeut:in noch eintragen]'}`);
  writeParagraph(`durchführen zu lassen.`, defaultLineHeight, 11);
  writeParagraph(`Herr/Frau ${therapeut.split(' ').pop() || '[Nachname Therapeut:in]'} ist approbierte:r Psychotherapeut:in. Eine Kassenzulassung besteht ${kassenzulassung === 'Nein' ? 'nicht' : ' (Hinweis: Für Kostenerstattung ist dies i.d.R. die Voraussetzung)'}. Die Behandlung kann dort zeitnah (${verfuegbar === 'Ja' ? 'sofort bzw. kurzfristig' : 'nach Absprache'}) begonnen werden. Eine Bescheinigung des/der Therapeut:in über die Approbation, die Notwendigkeit der Behandlung und die Behandlungsbereitschaft liegt bei / wird nachgereicht.`, defaultLineHeight, 11);
  if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }


  // Abschluss und Bitte um Rückmeldung
  const abschlussUeberschrift = "Bitte um Kostenübernahme und weitere Schritte:";
  const abschlussUeberschriftLines = doc.splitTextToSize(abschlussUeberschrift, pageWidth - (2*margin));
  abschlussUeberschriftLines.forEach(line => {
    writeLine(line, defaultLineHeight, true, 11);
  });
  if (y + spaceAfterParagraph <= usableHeight) y += spaceAfterParagraph; else { doc.addPage(); y = margin; }

  writeParagraph(`Ich bitte Sie höflich um eine schriftliche Bestätigung der Kostenübernahme für die probatorischen Sitzungen sowie für die anschließende Therapie.`, defaultLineHeight, 11);
  writeParagraph(`Bitte teilen Sie mir mit, welche weiteren Unterlagen Sie gegebenenfalls von mir oder von dem/der gewählten Therapeut:in benötigen.`, defaultLineHeight, 11);
  writeParagraph(`Für eine zeitnahe positive Rückmeldung wäre ich Ihnen sehr dankbar.`, defaultLineHeight, 11);

  // Grußformel und Unterschrift
  writeParagraph("Mit freundlichen Grüßen", defaultLineHeight, 11);
  if (y + defaultLineHeight * 0,5 <= usableHeight) y += defaultLineHeight * 0,5; else { // Platz für Unterschrift
      doc.addPage(); 
      y = margin + defaultLineHeight * 0,5; // Sicherstellen, dass Platz auf neuer Seite ist
  } 
  writeParagraph(name, defaultLineHeight, 11);


  // PDF speichern
  doc.save("antrag_kostenerstattung_psychotherapie.pdf");

  // Pop-up anzeigen
  const popup = document.getElementById("spendenPopup");
  if (popup) {
    popup.style.display = "flex";
  }
});

// Pop-up schließen Funktion
if (typeof closePopup !== 'function') {
  window.closePopup = function() {
    const popup = document.getElementById("spendenPopup");
    if (popup) {
      popup.style.display = "none";
    }
  }
}