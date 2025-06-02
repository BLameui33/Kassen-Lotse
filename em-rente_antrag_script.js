document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('emRenteAntragForm');
    const saveBtn = document.getElementById('saveBtnEMR');
    const loadBtn = document.getElementById('loadBtnEMR');
    const closePopupBtn = document.getElementById('closePopupBtnEMR');
    const spendenPopup = document.getElementById('spendenPopupEMR');
    const storageKey = 'emRenteAntragFormData';

    const antragstellerIdentischSelect = document.getElementById('antragstellerIdentischEMR');
    const antragstellerDetailsDiv = document.getElementById('antragstellerDetailsEMR');
    const asVollmachtEMRCheckbox = document.getElementById('asVollmachtEMR'); // Checkbox für Vollmacht im Antragsteller-Div

    const aktuelleBeschaeftigungSelect = document.getElementById('aktuelleBeschaeftigung');
    const aktuelleBeschaeftigungSonstigesDetailsDiv = document.getElementById('aktuelleBeschaeftigungSonstigesDetails');
    const aktuelleBeschaeftigungSonstigesText = document.getElementById('aktuelleBeschaeftigungSonstigesText');

    function updateDynamicFieldVisibility(selectElement, detailsDiv, showValue, requiredFieldsIds = [], checkboxToToggleRequired = null) {
        const isVisible = selectElement.value === showValue;
        detailsDiv.style.display = isVisible ? 'block' : 'none';
        detailsDiv.classList.toggle('sub-details-active', isVisible);
        requiredFieldsIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.required = isVisible;
        });
        if (checkboxToToggleRequired) {
             const elCheckbox = document.getElementById(checkboxToToggleRequired.id);
             if(elCheckbox) elCheckbox.required = isVisible;
        }
    }

    if (antragstellerIdentischSelect && antragstellerDetailsDiv) {
        antragstellerIdentischSelect.addEventListener('change', () => {
            updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameEMR', 'asAdresseEMR', 'asVerhaeltnisEMR'], asVollmachtEMRCheckbox);
        });
        updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameEMR', 'asAdresseEMR', 'asVerhaeltnisEMR'], asVollmachtEMRCheckbox);
    }

    if (aktuelleBeschaeftigungSelect && aktuelleBeschaeftigungSonstigesDetailsDiv) {
        aktuelleBeschaeftigungSelect.addEventListener('change', () => {
            updateDynamicFieldVisibility(aktuelleBeschaeftigungSelect, aktuelleBeschaeftigungSonstigesDetailsDiv, 'sonstiges', ['aktuelleBeschaeftigungSonstigesText']);
        });
        updateDynamicFieldVisibility(aktuelleBeschaeftigungSelect, aktuelleBeschaeftigungSonstigesDetailsDiv, 'sonstiges', ['aktuelleBeschaeftigungSonstigesText']);
    }

    const formElementIds = [
        "personName", "personGeburtsname", "personGeburt", "personGeburtsort", "personGeschlecht", 
        "personStaatsangehoerigkeit", "personAdresse", "personTelefon", "personEmail", "personKrankenkasse", "personRvNummer",
        "rvTraegerName", "rvTraegerStrasse", "rvTraegerPlzOrt", // NEUE FELDER für RV-Träger Adresse
        "antragstellerIdentischEMR", "asNameEMR", "asAdresseEMR", "asVerhaeltnisEMR", "asTelefonEMR",
        "beginnErwerbsminderung", "letzteTaetigkeit", "stundenProTagMoeglich", "auswirkungenAlltagBeruf",
        "gesundheit1_bezeichnung", "gesundheit1_arzt", "gesundheit1_behandlung_seit",
        "gesundheit2_bezeichnung", "gesundheit2_arzt", "gesundheit2_behandlung_seit",
        "gesundheit3_bezeichnung", "gesundheit3_arzt", "gesundheit3_behandlung_seit",
        "krankenhausaufenthalte", "rehamassnahmen",
        "beruflicherWerdegang", "aktuelleBeschaeftigung", "aktuelleBeschaeftigungSonstigesText",
        "anlageSonstigesEMR"
    ];
    const checkboxIdsToSave = [
        "asVollmachtEMR", 
        "einverstaendnisAerzteEMR", "einverstaendnisDatennutzungEMR"
    ];
    const anlagenEmrCheckboxName = "anlagenEMR";

    function getElementValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        return element ? element.value || defaultValue : defaultValue;
    }
    function getElementChecked(id, defaultValue = false) {
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
    }

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            data[id] = getElementValue(id);
        });
        checkboxIdsToSave.forEach(id => {
            data[id] = getElementChecked(id);
        });
        data.anlagen = [];
        document.querySelectorAll(`input[name="${anlagenEmrCheckboxName}"]:checked`).forEach(cb => data.anlagen.push(cb.value));
        return data;
    }

    function populateForm(data) {
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.value = data[id];
            }
        });
        checkboxIdsToSave.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.checked = data[id];
            }
        });
        document.querySelectorAll(`input[name="${anlagenEmrCheckboxName}"]`).forEach(cb => {
            cb.checked = data.anlagen && data.anlagen.includes(cb.value);
        });
        if (antragstellerIdentischSelect) updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameEMR', 'asAdresseEMR', 'asVerhaeltnisEMR'], asVollmachtEMRCheckbox);
        if (aktuelleBeschaeftigungSelect) updateDynamicFieldVisibility(aktuelleBeschaeftigungSelect, aktuelleBeschaeftigungSonstigesDetailsDiv, 'sonstiges', ['aktuelleBeschaeftigungSonstigesText']);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            if (!getElementChecked('einverstaendnisAerzteEMR') || !getElementChecked('einverstaendnisDatennutzungEMR')) {
                alert("Bitte stimmen Sie den Einverständniserklärungen (Schweigepflichtentbindung und Datennutzung) zu, um fortzufahren.");
                return;
            }
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
            console.error("Fehler beim Laden der Daten aus localStorage für EM-Rente Antrag:", e);
            localStorage.removeItem(storageKey);
        }
    }

    if (closePopupBtn && spendenPopup) {
        closePopupBtn.addEventListener('click', function() {
            spendenPopup.style.display = 'none';
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!getElementChecked('einverstaendnisAerzteEMR') || !getElementChecked('einverstaendnisDatennutzungEMR')) {
                alert("Bitte stimmen Sie den Einverständniserklärungen (Schweigepflichtentbindung und Datennutzung) zu, um das PDF zu erstellen.");
                return;
            }
            generateEmRenteAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateEmRenteAntragPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 6; 
    const spaceAfterParagraph = 3; 
    const headingFontSize = 14;
    const subHeadingFontSize = 11;
    const textFontSize = 9.5;
    const smallTextFontSize = 8;

    function writeLine(text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        if (y + currentLineHeight > usableHeight - (margin/2)) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont("times", fontStyle);
        doc.text(textToWrite, margin, y);
        y += currentLineHeight;
    }

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = textFontSize, options = {}) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        const fontStyle = options.fontStyle || "normal";
        const extraSpacing = options.extraSpacingAfter === undefined ? spaceAfterParagraph : options.extraSpacingAfter;
        doc.setFontSize(paragraphFontSize);
        doc.setFont("times", fontStyle);
        
        const lines = doc.splitTextToSize(textToWrite, pageWidth - (2 * margin));
        for (let i = 0; i < lines.length; i++) {
            if (y + paragraphLineHeight > usableHeight - (margin/2) ) { doc.addPage(); y = margin; }
            doc.text(lines[i], margin, y);
            y += paragraphLineHeight;
        }
        if (y + extraSpacing > usableHeight - (margin/2) && lines.length > 0) {
             doc.addPage(); y = margin;
        } else if (lines.length > 0) { 
            y += extraSpacing;
        }
    }
    
    // Helper-Funktionen zum sicheren Auslesen der Werte
    function getValue(id, defaultValue = "") {
        const element = document.getElementById(id);
        return element ? element.value || defaultValue : defaultValue;
    }
    function getChecked(id, defaultValue = false) {
        const element = document.getElementById(id);
        return element ? element.checked : defaultValue;
    }
    function getFormattedDate(id, defaultValue = "") {
        const dateInput = getValue(id);
        return dateInput ? new Date(dateInput).toLocaleDateString("de-DE") : defaultValue;
    }

    // Formulardaten sammeln
    const personName = getValue("personName");
    const personGeburtsname = getValue("personGeburtsname");
    const personGeburtFormatiert = getFormattedDate("personGeburt");
    const personGeburtsort = getValue("personGeburtsort");
    const personGeschlecht = getValue("personGeschlecht");
    const personStaatsangehoerigkeit = getValue("personStaatsangehoerigkeit");
    const personAdresse = getValue("personAdresse");
    const personTelefon = getValue("personTelefon");
    const personEmail = getValue("personEmail");
    const personKrankenkasse = getValue("personKrankenkasse");
    const personRvNummer = getValue("personRvNummer");

    const rvTraegerName = getValue("rvTraegerName", "Deutsche Rentenversicherung"); // Neuer Wert
    const rvTraegerStrasse = getValue("rvTraegerStrasse");                      // Neuer Wert
    const rvTraegerPlzOrt = getValue("rvTraegerPlzOrt");                        // Neuer Wert

    const antragstellerIdentischEMR = getValue("antragstellerIdentischEMR", "ja");
    const asNameEMR = getValue("asNameEMR");
    const asAdresseEMR = getValue("asAdresseEMR");
    const asVerhaeltnisEMR = getValue("asVerhaeltnisEMR");
    const asTelefonEMR = getValue("asTelefonEMR");
    const asVollmachtEMR = getChecked("asVollmachtEMR");

    const beginnErwerbsminderung = getFormattedDate("beginnErwerbsminderung", '(Datum nicht angegeben)');
    const letzteTaetigkeit = getValue("letzteTaetigkeit");
    const stundenProTagMoeglich = getValue("stundenProTagMoeglich");
    const auswirkungenAlltagBeruf = getValue("auswirkungenAlltagBeruf");

    const gesundheitsstoerungen = [];
    for (let i = 1; i <= 3; i++) {
        const bezeichnung = getValue(`gesundheit${i}_bezeichnung`);
        const arzt = getValue(`gesundheit${i}_arzt`);
        const seit = getValue(`gesundheit${i}_behandlung_seit`);
        if (bezeichnung.trim() !== "") {
            gesundheitsstoerungen.push({ bezeichnung, arzt, seit });
        }
    }
    const krankenhausaufenthalte = getValue("krankenhausaufenthalte");
    const rehamassnahmen = getValue("rehamassnahmen");

    const beruflicherWerdegang = getValue("beruflicherWerdegang");
    let aktuelleBeschaeftigung = getValue("aktuelleBeschaeftigung");
    if (aktuelleBeschaeftigung === "sonstiges") {
        aktuelleBeschaeftigung = getValue("aktuelleBeschaeftigungSonstigesText") || "Sonstiges";
    }
    
    const anlagen = [];
    document.querySelectorAll('input[name="anlagenEMR"]:checked').forEach(cb => {
        if (cb.id === "asVollmachtEMR" && antragstellerIdentischEMR === "ja") {} // Korrigierte ID für Anlage Vollmacht
        else { anlagen.push(cb.value); }
    });
    const anlageSonstigesEMR = getValue("anlageSonstigesEMR");
    if (anlageSonstigesEMR.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesEMR); }

    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal");

    let absenderName = personName;
    let absenderAdresse = personAdresse;
    let absenderTelefon = personTelefon;
    if (antragstellerIdentischEMR === 'nein' && asNameEMR.trim() !== "") {
        absenderName = asNameEMR;
        absenderAdresse = asAdresseEMR;
        absenderTelefon = asTelefonEMR;
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line.trim()));
    if (absenderTelefon && absenderTelefon.trim() !== "") writeLine("Tel.: " + absenderTelefon);
    if (personEmail.trim() !== "" && antragstellerIdentischEMR === 'ja') writeLine("E-Mail: " + personEmail);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger - jetzt mit den neuen Feldern
    writeLine("An die", defaultLineHeight, false, textFontSize);
    writeLine(rvTraegerName, defaultLineHeight, "bold", subHeadingFontSize);
    if (rvTraegerStrasse.trim() !== "") {
        rvTraegerStrasse.split("\n").forEach(line => writeLine(line.trim()));
    } else {
        writeLine("[Straße des RV-Trägers eintragen]", defaultLineHeight, false, textFontSize, {fontStyle: "italic"});
    }
    if (rvTraegerPlzOrt.trim() !== "") {
        writeLine(rvTraegerPlzOrt);
    } else {
        writeLine("[PLZ und Ort des RV-Trägers eintragen]", defaultLineHeight, false, textFontSize, {fontStyle: "italic"});
    }
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    let betreffText = `Antrag auf Leistungen bei Erwerbsminderung (Erwerbsminderungsrente)`;
    betreffText += `\nVersicherte Person: ${personName}, geb. am ${personGeburtFormatiert}`;
    betreffText += `\nRentenversicherungsnummer: ${personRvNummer}`;
    
    // Früherer Antrag Info (aus SBA-Formular, hier nicht mehr relevant, Logik entfernt)
    // const fruehererAntragSBA = getValue("fruehererAntragSBA", "nein");
    // if (fruehererAntragSBA === 'ja' && getValue("fruehererGdB").trim() !== "") {
    //     betreffText += ` (Neufeststellungsantrag / Verschlimmerungsantrag bei vorh. SBA)`;
    // }
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});

    if (antragstellerIdentischEMR === 'nein' && asNameEMR.trim() !== "") {
        writeParagraph(`hiermit beantrage ich, ${asNameEMR}, als ${asVerhaeltnisEMR || 'bevollmächtigte Person'}, für Herrn/Frau ${personName} (Rentenversicherungsnummer: ${personRvNummer}) Leistungen bei Erwerbsminderung.`);
        if(asVollmachtEMR) writeParagraph("Eine entsprechende Vollmacht/Bestallungsurkunde liegt diesem Antrag bei.", defaultLineHeight, smallTextFontSize, {fontStyle: "italic"});
    } else {
        writeParagraph(`hiermit beantrage ich, ${personName} (Rentenversicherungsnummer: ${personRvNummer}), Leistungen bei Erwerbsminderung.`);
    }
    writeParagraph("Ich bitte um Prüfung meines Anspruchs auf eine Rente wegen teilweiser oder voller Erwerbsminderung.", defaultLineHeight, textFontSize);
    
    writeLine("1. Persönliche Angaben der versicherten Person:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    writeParagraph(`Name: ${personName}${personGeburtsname ? ', geb. ' + personGeburtsname : ''}`);
    writeParagraph(`Geburtsdatum/-ort: ${personGeburtFormatiert} in ${personGeburtsort}`);
    writeParagraph(`Anschrift: ${personAdresse.replace(/\n/g, ', ')}`);
    writeParagraph(`Staatsangehörigkeit: ${personStaatsangehoerigkeit}`);
    writeParagraph(`Geschlecht: ${personGeschlecht}`);
    writeParagraph(`Krankenkasse: ${personKrankenkasse}`);
    y += defaultLineHeight/2;
    
    writeLine("2. Angaben zur Erwerbsminderung:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    writeParagraph(`Die Erwerbsminderung bzw. die Unfähigkeit, meine letzte Tätigkeit auszuüben, besteht seit ca.: ${beginnErwerbsminderung}.`);
    writeParagraph(`Meine letzte ausgeübte Tätigkeit war: ${letzteTaetigkeit}.`);
    writeParagraph(`Meiner Einschätzung nach kann ich auf dem allgemeinen Arbeitsmarkt noch: ${stundenProTagMoeglich} täglich erwerbstätig sein.`);
    if (auswirkungenAlltagBeruf.trim() !== "") {
        writeParagraph(`Auswirkungen meiner Gesundheitsstörungen auf Alltag und Beruf:\n${auswirkungenAlltagBeruf}`);
    }

    writeLine("3. Gesundheitsstörungen und ärztliche Behandlung:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    if (gesundheitsstoerungen.length > 0) {
        writeParagraph("Folgende Gesundheitsstörungen tragen zur Erwerbsminderung bei:");
        gesundheitsstoerungen.forEach((g, index) => {
            writeParagraph(`${index + 1}. ${g.bezeichnung} (seit ca. ${g.seit || 'N/A'})\n   Behandelnder Arzt/Einrichtung: ${g.arzt || 'N/A'}`);
        });
    } else {
        writeParagraph("Die genauen Gesundheitsstörungen und behandelnden Ärzte entnehmen Sie bitte den beigefügten medizinischen Unterlagen.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
    if (krankenhausaufenthalte.trim() !== "") {
        writeParagraph(`Krankenhausaufenthalte der letzten Jahre:\n${krankenhausaufenthalte}`);
    }
    if (rehamassnahmen.trim() !== "") {
        writeParagraph(`Teilgenommene Rehabilitationsmaßnahmen:\n${rehamassnahmen}`);
    }

    writeLine("4. Angaben zur beruflichen Situation:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    writeParagraph(`Beruflicher Werdegang (kurz):\n${beruflicherWerdegang}`);
    writeParagraph(`Aktuelle Beschäftigungssituation: ${aktuelleBeschaeftigung}`);

    writeLine("5. Einverständniserklärungen:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    writeParagraph("Ich entbinde die von mir genannten Ärzte, Krankenhäuser, Rehabilitationseinrichtungen und sonstigen Stellen (z.B. Gutachter, Behörden) von der Schweigepflicht gegenüber dem zuständigen Rentenversicherungsträger und den von ihm beauftragten ärztlichen Gutachtern, soweit dies für die Prüfung meines Antrags erforderlich ist.", defaultLineHeight, smallTextFontSize);
    writeParagraph("Ich bin damit einverstanden, dass der Rentenversicherungsträger die für die Entscheidung über meinen Antrag notwendigen Unterlagen bei den von mir genannten Stellen anfordert und meine personenbezogenen Daten im Rahmen des Feststellungsverfahrens verarbeitet werden.", defaultLineHeight, smallTextFontSize);
    
    if (anlagen.length > 0) {
        writeLine("6. Beigefügte Anlagen:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    } else {
        writeParagraph("Ich werde alle relevanten medizinischen Unterlagen schnellstmöglich nachreichen bzw. bitte um Mitteilung, welche spezifischen Berichte Sie benötigen.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
    
    writeParagraph("Ich versichere die Richtigkeit meiner Angaben. Ich bitte um eine sorgfältige Prüfung meines Antrags und um baldige Mitteilung über Ihre Entscheidung. Für Rückfragen stehe ich Ihnen gerne zur Verfügung.", defaultLineHeight, textFontSize);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    writeParagraph("Mit freundlichen Grüßen");
    writeParagraph("\n\n_________________________"); 
    writeParagraph(absenderName);

    doc.save("antrag_erwerbsminderungsrente_unterstuetzung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupEMR");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}