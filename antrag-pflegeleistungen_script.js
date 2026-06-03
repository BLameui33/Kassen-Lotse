document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pflegeleistungenAntragForm');
    const saveBtn = document.getElementById('saveBtnPflegeantrag');
    const loadBtn = document.getElementById('loadBtnPflegeantrag');
    const closePopupBtn = document.getElementById('closePopupBtnPflegeantrag');
    const spendenPopup = document.getElementById('spendenPopupPflegeantrag');
    const storageKey = 'pflegeleistungenAntragFormData';

    // --- Steuerung der dynamischen Antragsteller-Felder ---
    const antragstellerIdentischSelect = document.getElementById('antragstellerIdentisch');
    const antragstellerDetailsDiv = document.getElementById('antragstellerDetails');
    const anlageVollmachtPflegeCheckbox = document.getElementById('anlageVollmachtPflege'); // Für die Checkbox "Vollmacht"

    function updateAntragstellerDetailsVisibility() {
        if (antragstellerIdentischSelect.value === 'nein') {
            antragstellerDetailsDiv.style.display = 'block';
            // Setze required Attribute für die Antragsteller-Detailfelder
            document.getElementById('asName').required = true;
            document.getElementById('asAdresse').required = true;
            document.getElementById('asVerhaeltnis').required = true;
            document.getElementById('asTelefon').required = false; // Telefon bleibt optional
             if (anlageVollmachtPflegeCheckbox) anlageVollmachtPflegeCheckbox.required = true;


        } else {
            antragstellerDetailsDiv.style.display = 'none';
            // Entferne required Attribute
            document.getElementById('asName').required = false;
            document.getElementById('asAdresse').required = false;
            document.getElementById('asVerhaeltnis').required = false;
            document.getElementById('asTelefon').required = false;
            if (anlageVollmachtPflegeCheckbox) anlageVollmachtPflegeCheckbox.required = false;

        }
    }
    if (antragstellerIdentischSelect) {
        antragstellerIdentischSelect.addEventListener('change', updateAntragstellerDetailsVisibility);
        updateAntragstellerDetailsVisibility(); // Initial prüfen
    }


    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpTelefon",
        "antragstellerIdentisch", "asName", "asAdresse", "asVerhaeltnis", "asTelefon",
        "kasseName", "kasseAdresse",
        "grundFuerAntrag", "lebenssituation", "taeglicheHilfeBeschreibung", 
        "beginnPflegebeduerftigkeit", "bisherigeVersorgung",
        "hauptbehandelnderArztName", "hauptbehandelnderArztAnschrift", "weitereAerzteKliniken",
        "anlageSonstigesPflege"
    ];
    const checkboxNameGruppen = { // Namen der Checkbox-Gruppen
        hilfeBei: "hilfeBei",
        wunschleistungen: "wunschleistungen",
        anlagenPflege: "anlagenPflege" 
    };

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        // Checkboxen für Antragsteller Vollmacht
        const asVollmachtCheckbox = document.getElementById('asVollmacht');
        if (asVollmachtCheckbox) data.asVollmacht = asVollmachtCheckbox.checked;
        
        const einverstaendnisMDCheckbox = document.getElementById('einverstaendnisMD');
        if (einverstaendnisMDCheckbox) data.einverstaendnisMD = einverstaendnisMDCheckbox.checked;


        // Checkbox-Gruppen sammeln
        for (const groupName in checkboxNameGruppen) {
            data[groupName] = [];
            const checkboxes = document.querySelectorAll(`input[name="${checkboxNameGruppen[groupName]}"]:checked`);
            checkboxes.forEach(checkbox => {
                data[groupName].push(checkbox.value);
            });
        }
        return data;
    }

    function populateForm(data) {
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.value = data[id];
            }
        });

        const asVollmachtCheckbox = document.getElementById('asVollmacht');
        if (asVollmachtCheckbox && data.asVollmacht !== undefined) asVollmachtCheckbox.checked = data.asVollmacht;

        const einverstaendnisMDCheckbox = document.getElementById('einverstaendnisMD');
        if (einverstaendnisMDCheckbox && data.einverstaendnisMD !== undefined) einverstaendnisMDCheckbox.checked = data.einverstaendnisMD;
        

        for (const groupName in checkboxNameGruppen) {
            const checkboxes = document.querySelectorAll(`input[name="${checkboxNameGruppen[groupName]}"]`);
            checkboxes.forEach(checkbox => {
                if (data[groupName] && data[groupName].includes(checkbox.value)) {
                    checkbox.checked = true;
                } else {
                    checkbox.checked = false;
                }
            });
        }
        if (antragstellerIdentischSelect) updateAntragstellerDetailsVisibility(); // Sichtbarkeit nach Laden aktualisieren
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
            if (!document.getElementById('einverstaendnisMD').checked) {
                alert("Bitte erklären Sie Ihr Einverständnis zur Begutachtung durch den Medizinischen Dienst.");
                return;
            }
            generatePflegeleistungenAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generatePflegeleistungenAntragPDF() {
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
    const vpTelefon = document.getElementById("vpTelefon").value;

    const antragstellerIdentisch = document.getElementById("antragstellerIdentisch").value;
    const asName = document.getElementById("asName").value;
    const asAdresse = document.getElementById("asAdresse").value;
    const asVerhaeltnis = document.getElementById("asVerhaeltnis").value;
    const asTelefon = document.getElementById("asTelefon").value;
    const asVollmacht = document.getElementById("asVollmacht") ? document.getElementById("asVollmacht").checked : false;


    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    const grundFuerAntrag = document.getElementById("grundFuerAntrag").value;
    const lebenssituation = document.getElementById("lebenssituation").value;
    
    const hilfeBeiWerte = [];
    document.querySelectorAll('input[name="hilfeBei"]:checked').forEach(cb => hilfeBeiWerte.push(cb.value));
    const hilfeBeiText = hilfeBeiWerte.length > 0 ? hilfeBeiWerte.join(', ') : 'Keine spezifische Auswahl getroffen.';
    const taeglicheHilfeBeschreibung = document.getElementById("taeglicheHilfeBeschreibung").value;


    const beginnPflegebeduerftigkeitInput = document.getElementById("beginnPflegebeduerftigkeit").value;
    const beginnPflegebeduerftigkeit = beginnPflegebeduerftigkeitInput ? new Date(beginnPflegebeduerftigkeitInput).toLocaleDateString("de-DE") : 'N/A';
    const bisherigeVersorgung = document.getElementById("bisherigeVersorgung").value;

    const wunschleistungenWerte = [];
    document.querySelectorAll('input[name="wunschleistungen"]:checked').forEach(cb => wunschleistungenWerte.push(cb.value));
    const wunschleistungenText = wunschleistungenWerte.length > 0 ? wunschleistungenWerte.join(', ') : '';

    const hauptbehandelnderArztName = document.getElementById("hauptbehandelnderArztName").value;
    const hauptbehandelnderArztAnschrift = document.getElementById("hauptbehandelnderArztAnschrift").value;
    const weitereAerzteKliniken = document.getElementById("weitereAerzteKliniken").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenPflege"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        // Sonderfall für Vollmacht, da diese nur relevant ist, wenn Antragsteller abweicht
        if (checkbox.id === "anlageVollmachtPflege" && antragstellerIdentisch === "ja") {
            // Nicht hinzufügen, wenn Antragsteller identisch ist
        } else {
            anlagen.push(checkbox.value);
        }
    });
    const anlageSonstigesPflege = document.getElementById("anlageSonstigesPflege").value;
    if (anlageSonstigesPflege.trim() !== "") {
        anlagen.push("Sonstige Anlagen: " + anlageSonstigesPflege);
    }


    // --- PDF-Inhalt erstellen ---
    // Absender-Logik vorbereiten
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    let absenderTelefon = vpTelefon;
    let infoText = "";

    if (antragstellerIdentisch === 'nein' && asName.trim() !== "") {
        absenderName = asName;
        absenderAdresse = asAdresse;
        absenderTelefon = asTelefon;
        infoText = `(handelnd für ${vpName})`;
    }

    
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

    if (absenderTelefon && absenderTelefon.trim() !== "") {
        doc.text("Tel.: " + absenderTelefon, rightColumnX, rightY);
        rightY += defaultLineHeight;
    }

    // Falls infoText vorhanden ist (handelnd für...), kompakt rechts drunter setzen
    if (infoText !== "") {
        rightY += 2; // Kleiner Abstand
        doc.setFont(undefined, "italic");
        doc.setFontSize(9);
        let infoLines = doc.splitTextToSize(infoText, 60);
        infoLines.forEach(line => {
            doc.text(line, rightColumnX, rightY);
            rightY += 4; 
        });
    }

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger
    let leftY = margin + 15; 
    
    // Inline-Rücksendezeile generieren
    const cleanAddressInline = absenderAdresse.replace(/\r?\n/g, " · ");
    const ruecksendeZeile = `${absenderName} · ${cleanAddressInline}`;
    
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120); // Dezentes Grau
    doc.text(ruecksendeZeile, margin, leftY);
    
    // Die feine Trennlinie
    doc.setDrawColor(180, 180, 180); 
    doc.setLineWidth(0.2);
    doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); 
    
    // Empfänger platzieren
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
    
    // Dynamische Berechnung der Höhe gegen Überschneidungen
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Setzt die globale Y-Koordinate für den nachfolgenden Text (z.B. den Betreff)
    y = datumY + 12;

   

    // Betreff
    let betreffText = `Antrag auf Leistungen der Pflegeversicherung gemäß SGB XI für ${vpName}`;
    betreffText += `\nVersicherte Person: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    if (antragstellerIdentisch === 'nein' && asName.trim() !== "") {
        writeParagraph(`hiermit beantrage ich, ${asName}, als ${asVerhaeltnis || 'bevollmächtigte Person'}, für Herrn/Frau ${vpName}, geboren am ${vpGeburtFormatiert} (Versichertennummer: ${vpNummer}), Leistungen der Pflegeversicherung.`);
        if(asVollmacht) writeParagraph("Eine entsprechende Vollmacht/Bestallungsurkunde liegt diesem Antrag bei bzw. wurde Ihnen bereits übermittelt oder wird nachgereicht.", defaultLineHeight, 10, {fontStyle: "italic"});
    } else {
        writeParagraph(`hiermit beantrage ich, ${vpName}, geboren am ${vpGeburtFormatiert}, Versichertennummer ${vpNummer}, Leistungen der Pflegeversicherung.`);
    }
    
    // Grund für Antrag
    writeLine("1. Grund für den Antrag und aktuelle Situation:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Der Antrag wird gestellt aufgrund von: ${grundFuerAntrag}.`);
    writeParagraph(`Die versicherte Person lebt aktuell: ${lebenssituation}.`);
    writeParagraph(`Der Hilfebedarf besteht vorwiegend in folgenden Bereichen: ${hilfeBeiText}.`);
    if (taeglicheHilfeBeschreibung.trim() !== "") {
        writeParagraph(`Konkret äußert sich der tägliche Hilfebedarf wie folgt: ${taeglicheHilfeBeschreibung}`);
    }
    writeParagraph(`Die Pflegebedürftigkeit bzw. der erhöhte Hilfebedarf besteht seit ca. ${beginnPflegebeduerftigkeit}.`);
    if (bisherigeVersorgung.trim() !== "") {
        writeParagraph(`Die Versorgung wurde bisher wie folgt sichergestellt: ${bisherigeVersorgung}`);
    }

    // Gewünschte Leistungen
    if (wunschleistungenText.trim() !== "") {
        writeLine("2. Vorerst gewünschte Leistungen/Unterstützung:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        writeParagraph(`Ich strebe zunächst folgende Unterstützungsleistungen an: ${wunschleistungenText}. Ich bitte um eine entsprechende Beratung nach Feststellung des Pflegegrades.`);
    }

    // Behandelnde Ärzte
    writeLine("3. Behandelnde Ärzte:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Hauptbehandelnde/r Arzt/Ärztin: ${hauptbehandelnderArztName}, ${hauptbehandelnderArztAnschrift.replace(/\n/g, ', ')}.`);
    if (weitereAerzteKliniken.trim() !== "") {
        writeParagraph(`Weitere beteiligte Ärzte/Kliniken:\n${weitereAerzteKliniken}`);
    }
    
    // Einverständniserklärung
    writeLine("4. Einverständniserklärung zur Begutachtung:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph("Ich bin damit einverstanden, dass zur Feststellung der Pflegebedürftigkeit eine Begutachtung durch den Medizinischen Dienst (MD) bzw. Medicproof durchgeführt wird und hierfür ggf. medizinische Unterlagen bei den behandelnden Ärzten angefordert werden dürfen.");

    // Anlagen
    if (anlagen.length > 0) {
        writeLine("5. Beigefügte Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    // Abschluss
    writeParagraph("Ich bitte um eine zeitnahe Bearbeitung dieses Antrags, die Vereinbarung eines Termins für die Begutachtung sowie um Zusendung weiterer Informationen zum Verfahren.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel
    writeParagraph("Mit freundlichen Grüßen");
    // Platz für Unterschrift (Antragsteller oder Versicherter)
    let unterschriftName = vpName;
    if (antragstellerIdentisch === 'nein' && asName.trim() !== "") {
        unterschriftName = asName;
    }
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(unterschriftName);


    doc.save("antrag_pflegeleistungen.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupPflegeantrag");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}