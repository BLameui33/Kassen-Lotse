document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('hilfsmittelAntragForm');
    const saveBtn = document.getElementById('saveBtnHilfsmittel');
    const loadBtn = document.getElementById('loadBtnHilfsmittel');
    const closePopupBtn = document.getElementById('closePopupBtnHilfsmittel');
    const spendenPopup = document.getElementById('spendenPopup');
    const storageKey = 'hilfsmittelAntragFormData';

    // --- Dynamische Feldanzeige ---
    const erstversorgungSelect = document.getElementById('erstversorgung');
    const folgeversorgungDetails = document.getElementById('folgeversorgung_details');
    const leistungserbringerBekanntSelect = document.getElementById('leistungserbringer_bekannt');
    const leistungserbringerDetails = document.getElementById('leistungserbringer_details');

    function toggleDetailsVisibility(selectElement, detailsDiv, showValue) {
        if (selectElement.value === showValue) {
            detailsDiv.style.display = 'block';
        } else {
            detailsDiv.style.display = 'none';
        }
    }

    if (erstversorgungSelect) {
        erstversorgungSelect.addEventListener('change', function() {
            toggleDetailsVisibility(this, folgeversorgungDetails, "Nein, es ist eine Folgeversorgung/Ersatzbeschaffung");
        });
        // Initial prüfen
        toggleDetailsVisibility(erstversorgungSelect, folgeversorgungDetails, "Nein, es ist eine Folgeversorgung/Ersatzbeschaffung");
    }

    if (leistungserbringerBekanntSelect) {
        leistungserbringerBekanntSelect.addEventListener('change', function() {
            toggleDetailsVisibility(this, leistungserbringerDetails, "Ja");
        });
        // Initial prüfen
        toggleDetailsVisibility(leistungserbringerBekanntSelect, leistungserbringerDetails, "Ja");
    }
    
    // --- Speichern & Laden Logik ---
    const formElementIds = [
      "name", "adresse", "geburt", "nummer", "telefon", "kasse", "kassenAdresse",
      "hilfsmittel_bezeichnung", "hilfsmittel_nummer", "hilfsmittel_menge",
      "arzt_name", "arzt_anschrift", "verordnung_datum",
      "diagnose", "begruendung_notwendigkeit", "erstversorgung", 
      "bisheriges_hilfsmittel", "grund_neubeschaffung",
      "leistungserbringer_bekannt", "leistungserbringer_name", "leistungserbringer_anschrift", "kostenvoranschlag_datum",
      "anlage_sonstiges_text"
    ];
    const anlagenCheckboxIds = ["anlage_verordnung", "anlage_kostenvoranschlag", "anlage_fotos"];

    function getFormData() {
      const data = {};
      formElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) data[id] = element.value;
      });
      data.anlagen = [];
      anlagenCheckboxIds.forEach(id => {
        const element = document.getElementById(id);
        if (element && element.checked) {
            data.anlagen.push(element.value);
        }
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
      anlagenCheckboxIds.forEach(id => {
        const element = document.getElementById(id);
        if (element && data.anlagen && data.anlagen.includes(element.value)) {
            element.checked = true;
        } else if (element) {
            element.checked = false;
        }
      });
      // Details Divs nach dem Laden der Daten aktualisieren
      if (erstversorgungSelect) toggleDetailsVisibility(erstversorgungSelect, folgeversorgungDetails, "Nein, es ist eine Folgeversorgung/Ersatzbeschaffung");
      if (leistungserbringerBekanntSelect) toggleDetailsVisibility(leistungserbringerBekanntSelect, leistungserbringerDetails, "Ja");
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
    
    // Automatisch laden beim Seitenaufruf
    const autoLoadData = localStorage.getItem(storageKey);
    if (autoLoadData) {
      try {
        populateForm(JSON.parse(autoLoadData));
        console.log('Daten für Hilfsmittelantrag automatisch aus localStorage geladen.');
      } catch (e) {
        console.error("Fehler beim Parsen der localStorage Daten für Hilfsmittelantrag: ", e);
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
          generateHilfsmittelAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateHilfsmittelAntragPDF() {
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
    const usableHeight = pageHeight - margin; 
    let y = margin; 
    const defaultLineHeight = 7; 
    const spaceAfterParagraph = 2; 

    // Hilfsfunktionen für PDF (identisch zu deinem anderen script.js, ggf. auslagern)
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

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = 11) {
        doc.setFontSize(paragraphFontSize);
        doc.setFont(undefined, "normal");
        const lines = doc.splitTextToSize(text, pageWidth - (2 * margin)); 
        for (let i = 0; i < lines.length; i++) {
            if (y + paragraphLineHeight > usableHeight) {
                doc.addPage();
                y = margin; 
            }
            doc.text(lines[i], margin, y);
            y += paragraphLineHeight;
        }
        if (y + spaceAfterParagraph > usableHeight && lines.length > 0) {
            doc.addPage();
            y = margin;
        } else if (lines.length > 0) {
            y += spaceAfterParagraph;
        }
    }
    
    // Formulardaten sammeln (innerhalb dieser Funktion, um aktuelle Werte zu bekommen)
    const name = document.getElementById("name").value;
    const adresse = document.getElementById("adresse").value;
    const geburtInput = document.getElementById("geburt").value;
    const geburtFormatiert = geburtInput ? new Date(geburtInput).toLocaleDateString("de-DE") : 'N/A';
    const nummer = document.getElementById("nummer").value;
    const telefon = document.getElementById("telefon").value;

    const kasse = document.getElementById("kasse").value;
    const kassenAdresse = document.getElementById("kassenAdresse").value;

    const hilfsmittel_bezeichnung = document.getElementById("hilfsmittel_bezeichnung").value;
    const hilfsmittel_nummer = document.getElementById("hilfsmittel_nummer").value;
    const hilfsmittel_menge = document.getElementById("hilfsmittel_menge").value;
    const arzt_name = document.getElementById("arzt_name").value;
    const arzt_anschrift = document.getElementById("arzt_anschrift").value;
    const verordnung_datum_input = document.getElementById("verordnung_datum").value;
    const verordnung_datum_formatiert = verordnung_datum_input ? new Date(verordnung_datum_input).toLocaleDateString("de-DE") : 'N/A';
    
    const diagnose = document.getElementById("diagnose").value;
    const begruendung_notwendigkeit = document.getElementById("begruendung_notwendigkeit").value;
    const erstversorgung = document.getElementById("erstversorgung").value;
    const bisheriges_hilfsmittel = document.getElementById("bisheriges_hilfsmittel").value;
    const grund_neubeschaffung = document.getElementById("grund_neubeschaffung").value;

    const leistungserbringer_bekannt = document.getElementById("leistungserbringer_bekannt").value;
    const leistungserbringer_name = document.getElementById("leistungserbringer_name").value;
    const leistungserbringer_anschrift = document.getElementById("leistungserbringer_anschrift").value;
    const kostenvoranschlag_datum_input = document.getElementById("kostenvoranschlag_datum").value;
    const kostenvoranschlag_datum_formatiert = kostenvoranschlag_datum_input ? new Date(kostenvoranschlag_datum_input).toLocaleDateString("de-DE") : 'N/A';

    const anlagen = [];
    if (document.getElementById("anlage_verordnung").checked) anlagen.push("Ärztliche Verordnung/Rezept vom " + verordnung_datum_formatiert);
    if (document.getElementById("anlage_kostenvoranschlag").checked) anlagen.push("Kostenvoranschlag" + (kostenvoranschlag_datum_input ? " vom " + kostenvoranschlag_datum_formatiert : ""));
    if (document.getElementById("anlage_fotos").checked) anlagen.push("Fotos zur Veranschaulichung");
    const anlage_sonstiges_text_eingabe = document.getElementById("anlage_sonstiges_text").value;
    if (anlage_sonstiges_text_eingabe.trim() !== "") anlagen.push("Sonstige Anlagen: " + anlage_sonstiges_text_eingabe);

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    writeLine(name);
    adresse.split("\n").forEach(line => writeLine(line));
    if (telefon.trim() !== "") writeLine("Tel.: " + telefon);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight;

    // Empfänger
    writeLine(kasse);
    kassenAdresse.split("\n").forEach(line => writeLine(line));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    // Datum rechtsbündig
    const datumHeute = new Date().toLocaleDateString("de-DE");
    const datumsFontSize = 11;
    doc.setFontSize(datumsFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * datumsFontSize / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else { doc.addPage(); y = margin; }

    // Betreff
    const betreffText = `Antrag auf Kostenübernahme für ein medizinisches Hilfsmittel gemäß § 33 SGB V – Versichertennummer: ${nummer}`;
    const betreffFontSize = 12;
    const betreffLines = doc.splitTextToSize(betreffText, pageWidth - (2 * margin));
    betreffLines.forEach(line => writeLine(line, defaultLineHeight + 1, true, betreffFontSize));
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11);
    y -= spaceAfterParagraph; // Weniger Abstand direkt nach der Anrede
    if (y + defaultLineHeight * 0.5 <= usableHeight) y += defaultLineHeight * 0.5; else { doc.addPage(); y = margin; }

    // Einleitung
    writeParagraph(`hiermit beantrage ich, ${name}, geboren am ${geburtFormatiert}, wohnhaft in ${adresse.split("\n").pop() /* Nimmt nur den Ort für die Kurzform */}, Versichertennummer ${nummer}, die Kostenübernahme für das nachfolgend beschriebene und ärztlich verordnete medizinische Hilfsmittel.`, defaultLineHeight, 11);
    
    // 1. Angaben zum Hilfsmittel
    writeLine("1. Angaben zum ärztlich verordneten Hilfsmittel:", defaultLineHeight, true);
    y += spaceAfterParagraph;
    writeParagraph(`Bezeichnung des Hilfsmittels: ${hilfsmittel_bezeichnung}`);
    if (hilfsmittel_nummer.trim() !== "") writeParagraph(`Hilfsmittelpositionsnummer (HMV-Nr.): ${hilfsmittel_nummer}`);
    writeParagraph(`Benötigte Menge/Stückzahl: ${hilfsmittel_menge}`);
    writeParagraph(`Verordnende/r Arzt/Ärztin: ${arzt_name}`);
    writeParagraph(`Anschrift der Arztpraxis: ${arzt_anschrift.replace(/\n/g, ', ')}`);
    writeParagraph(`Datum der ärztlichen Verordnung: ${verordnung_datum_formatiert}`);
    writeParagraph("Eine Kopie der ärztlichen Verordnung liegt diesem Antrag bei.", defaultLineHeight, 11);

    // 2. Medizinische Notwendigkeit und Begründung
    writeLine("2. Medizinische Notwendigkeit und Begründung:", defaultLineHeight, true);
    y += spaceAfterParagraph;
    writeParagraph(`Bei mir liegt/liegen folgende Diagnose(n) vor, die den Einsatz des oben genannten Hilfsmittels medizinisch erforderlich macht/machen:\n${diagnose}`);
    writeParagraph(`Die Notwendigkeit für das beantragte Hilfsmittel begründet sich wie folgt:\n${begruendung_notwendigkeit}`);
    
    let erstversorgung_text = "Es handelt sich hierbei um eine Erstversorgung.";
    if (erstversorgung === "Nein, es ist eine Folgeversorgung/Ersatzbeschaffung") {
        erstversorgung_text = "Es handelt sich hierbei um eine Folgeversorgung/Ersatzbeschaffung.";
        if (bisheriges_hilfsmittel.trim() !== "") {
            erstversorgung_text += `\nBisher wurde folgendes Hilfsmittel genutzt: ${bisheriges_hilfsmittel}.`;
        }
        if (grund_neubeschaffung.trim() !== "") {
            erstversorgung_text += ` Eine Neubeschaffung ist notwendig, da: ${grund_neubeschaffung}.`;
        }
    }
    writeParagraph(erstversorgung_text);

    // 3. Angaben zum Leistungserbringer
    writeLine("3. Angaben zum Leistungserbringer (falls zutreffend):", defaultLineHeight, true);
    y += spaceAfterParagraph;
    if (leistungserbringer_bekannt === "Nein") {
        writeParagraph("Ich bitte Sie um Mitteilung, welche Vertragspartner für die Lieferung des genannten Hilfsmittels in meiner Nähe zur Verfügung stehen.");
    } else {
        let leistungserbringerText = "Ich beabsichtige, das Hilfsmittel über folgenden Leistungserbringer zu beziehen:";
        if (leistungserbringer_name.trim() !== "") leistungserbringerText += `\n   Name: ${leistungserbringer_name}`;
        if (leistungserbringer_anschrift.trim() !== "") leistungserbringerText += `\n   Anschrift: ${leistungserbringer_anschrift.replace(/\n/g, '\n      ')}`;
        if (kostenvoranschlag_datum_input.trim() !== "") {
            leistungserbringerText += `\nEin Kostenvoranschlag vom ${kostenvoranschlag_datum_formatiert} liegt diesem Antrag bei.`;
        }
        writeParagraph(leistungserbringerText);
    }

    // 4. Beigefügte Anlagen
    if (anlagen.length > 0) {
        writeLine("4. Beigefügte Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    // Gesetzliche Grundlage und Bitte
    writeParagraph("Ich berufe mich bei meinem Antrag auf meinen Leistungsanspruch auf Hilfsmittel gemäß § 33 SGB V.", defaultLineHeight, 11);
    writeParagraph("Ich bitte Sie höflich um Prüfung meines Antrags und um eine schriftliche Bestätigung der Kostenübernahme für das oben genannte Hilfsmittel. Bitte teilen Sie mir ebenfalls mit, falls Sie weitere Unterlagen von mir oder dem/der verordnenden Arzt/Ärztin benötigen.", defaultLineHeight, 11);
    writeParagraph("Für eine zeitnahe Bearbeitung und positive Rückmeldung bedanke ich mich im Voraus.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }


    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen", defaultLineHeight, 11);
   
    writeParagraph(name, defaultLineHeight, 11);

    // PDF speichern
    doc.save("antrag_hilfsmittel.pdf");

    // Pop-up anzeigen
    const spendenPopup = document.getElementById("spendenPopup");
    if (spendenPopup) {
        spendenPopup.style.display = "flex";
    }
}