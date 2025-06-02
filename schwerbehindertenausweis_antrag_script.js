document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('schwerbehindertenAntragForm');
    const saveBtn = document.getElementById('saveBtnSBA');
    const loadBtn = document.getElementById('loadBtnSBA');
    const closePopupBtn = document.getElementById('closePopupBtnSBA');
    const spendenPopup = document.getElementById('spendenPopupSBA');
    const storageKey = 'schwerbehindertenAntragFormData';

    const antragstellerIdentischSelect = document.getElementById('antragstellerIdentischSBA');
    const antragstellerDetailsDiv = document.getElementById('antragstellerDetailsSBA');
    const asVollmachtSBACheckbox = document.getElementById('asVollmachtSBA'); 

    const fruehererAntragSBASelect = document.getElementById('fruehererAntragSBA');
    const fruehererAntragDetailsSBADiv = document.getElementById('fruehererAntragDetailsSBA');

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
            updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameSBA', 'asAdresseSBA', 'asVerhaeltnisSBA'], asVollmachtSBACheckbox);
        });
        updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameSBA', 'asAdresseSBA', 'asVerhaeltnisSBA'], asVollmachtSBACheckbox);
    }

    if (fruehererAntragSBASelect && fruehererAntragDetailsSBADiv) {
        fruehererAntragSBASelect.addEventListener('change', () => {
            updateDynamicFieldVisibility(fruehererAntragSBASelect, fruehererAntragDetailsSBADiv, 'ja', ['fruehererAntragAktenzeichen', 'fruehererAntragBehoerde']);
        });
        updateDynamicFieldVisibility(fruehererAntragSBASelect, fruehererAntragDetailsSBADiv, 'ja', ['fruehererAntragAktenzeichen', 'fruehererAntragBehoerde']);
    }

    const formElementIds = [
        "personName", "personGeburtsname", "personGeburt", "personGeburtsort", "personGeschlecht", 
        "personStaatsangehoerigkeit", "personAdresse", "personTelefon", "personEmail", "personKrankenkasse",
        "antragstellerIdentischSBA", "asNameSBA", "asAdresseSBA", "asVerhaeltnisSBA", "asTelefonSBA",
        "gesundheitsstoerung1_bezeichnung", "gesundheitsstoerung1_beginn",
        "gesundheitsstoerung2_bezeichnung", "gesundheitsstoerung2_beginn",
        "gesundheitsstoerung3_bezeichnung", "gesundheitsstoerung3_beginn",
        "auswirkungenGesundheitsstoerungen",
        "arzt1_name", "arzt1_anschrift", "arzt1_behandlungszeitraum",
        "arzt2_name", "arzt2_anschrift", "arzt2_behandlungszeitraum",
        "begruendungMerkzeichen", "fruehererAntragSBA",
        "fruehererAntragAktenzeichen", "fruehererAntragBehoerde", "fruehererGdB",
        "anlageSonstigesSBA"
    ];
    const checkboxIdsToSave = [
        "asVollmachtSBA", "einverstaendnisAerzteSBA", "einverstaendnisDatennutzungSBA"
    ];
    const merkzeichenCheckboxName = "merkzeichen";
    const anlagenSbaCheckboxName = "anlagenSBA";

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        checkboxIdsToSave.forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.checked;
        });
        data.merkzeichen = [];
        document.querySelectorAll(`input[name="${merkzeichenCheckboxName}"]:checked`).forEach(cb => data.merkzeichen.push(cb.value));
        data.anlagen = [];
        document.querySelectorAll(`input[name="${anlagenSbaCheckboxName}"]:checked`).forEach(cb => data.anlagen.push(cb.value));
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
        document.querySelectorAll(`input[name="${merkzeichenCheckboxName}"]`).forEach(cb => {
            cb.checked = data.merkzeichen && data.merkzeichen.includes(cb.value);
        });
        document.querySelectorAll(`input[name="${anlagenSbaCheckboxName}"]`).forEach(cb => {
            cb.checked = data.anlagen && data.anlagen.includes(cb.value);
        });
        if (antragstellerIdentischSelect) updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameSBA', 'asAdresseSBA', 'asVerhaeltnisSBA'], asVollmachtSBACheckbox);
        if (fruehererAntragSBASelect) updateDynamicFieldVisibility(fruehererAntragSBASelect, fruehererAntragDetailsSBADiv, 'ja', ['fruehererAntragAktenzeichen', 'fruehererAntragBehoerde']);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            if (!document.getElementById('einverstaendnisAerzteSBA').checked || !document.getElementById('einverstaendnisDatennutzungSBA').checked) {
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
            if (!document.getElementById('einverstaendnisAerzteSBA').checked || !document.getElementById('einverstaendnisDatennutzungSBA').checked) {
                alert("Bitte stimmen Sie den Einverständniserklärungen (Schweigepflichtentbindung und Datennutzung) zu, um das PDF zu erstellen.");
                return;
            }
            generateSBAPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateSBAPDF() {
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
        // Fallback für undefined/null Text
        const textToWrite = text === undefined || text === null ? "" : String(text);
        if (y + currentLineHeight > usableHeight) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont(undefined, isBold ? "bold" : "normal");
        doc.text(textToWrite, margin, y);
        y += currentLineHeight;
    }

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = 11, options = {}) {
        // Fallback für undefined/null Text
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
    
    // Formulardaten sammeln mit Fallback auf leeren String
    const personName = document.getElementById("personName").value || "";
    const personGeburtsname = document.getElementById("personGeburtsname").value || "";
    const personGeburtInput = document.getElementById("personGeburt").value;
    const personGeburtFormatiert = personGeburtInput ? new Date(personGeburtInput).toLocaleDateString("de-DE") : '';
    const personGeburtsort = document.getElementById("personGeburtsort").value || "";
    const personGeschlecht = document.getElementById("personGeschlecht").value || "";
    const personStaatsangehoerigkeit = document.getElementById("personStaatsangehoerigkeit").value || "";
    const personAdresse = document.getElementById("personAdresse").value || "";
    const personTelefon = document.getElementById("personTelefon").value || "";
    const personEmail = document.getElementById("personEmail").value || "";
    const personKrankenkasse = document.getElementById("personKrankenkasse").value || "";

    const antragstellerIdentischSBA = document.getElementById("antragstellerIdentischSBA").value || "ja";
    const asNameSBA = document.getElementById("asNameSBA").value || "";
    const asAdresseSBA = document.getElementById("asAdresseSBA").value || "";
    const asVerhaeltnisSBA = document.getElementById("asVerhaeltnisSBA").value || "";
    const asTelefonSBA = document.getElementById("asTelefonSBA").value || "";
    const asVollmachtSBA = document.getElementById("asVollmachtSBA") ? document.getElementById("asVollmachtSBA").checked : false;

    const gesundheitsstoerungen = [];
    for (let i = 1; i <= 3; i++) {
        const bezeichnung = document.getElementById(`gesundheitsstoerung${i}_bezeichnung`).value || "";
        const beginn = document.getElementById(`gesundheitsstoerung${i}_beginn`).value || "";
        if (bezeichnung.trim() !== "") {
            gesundheitsstoerungen.push({ bezeichnung, beginn });
        }
    }
    const auswirkungenGesundheitsstoerungen = document.getElementById("auswirkungenGesundheitsstoerungen").value || "";

    const aerzte = [];
    for (let i = 1; i <= 2; i++) {
        const name = document.getElementById(`arzt${i}_name`).value || "";
        const anschrift = document.getElementById(`arzt${i}_anschrift`).value || "";
        const zeitraum = document.getElementById(`arzt${i}_behandlungszeitraum`).value || "";
        if (name.trim() !== "") {
            aerzte.push({ name, anschrift, zeitraum });
        }
    }

    const merkzeichenBeantragt = [];
    document.querySelectorAll('input[name="merkzeichen"]:checked').forEach(cb => merkzeichenBeantragt.push(cb.value));
    const begruendungMerkzeichen = document.getElementById("begruendungMerkzeichen").value || "";

    const fruehererAntragSBA = document.getElementById("fruehererAntragSBA").value || "nein";
    const fruehererAntragAktenzeichen = document.getElementById("fruehererAntragAktenzeichen").value || "";
    const fruehererAntragBehoerde = document.getElementById("fruehererAntragBehoerde").value || "";
    const fruehererGdB = document.getElementById("fruehererGdB").value || "";

    const anlagen = [];
    document.querySelectorAll('input[name="anlagenSBA"]:checked').forEach(cb => {
        if (cb.id === "anlageVollmachtSBA" && antragstellerIdentischSBA === "ja") {}
        else { anlagen.push(cb.value); }
    });
    const anlageSonstigesSBA = document.getElementById("anlageSonstigesSBA").value || "";
    if (anlageSonstigesSBA.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesSBA); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    let absenderName = personName;
    let absenderAdresse = personAdresse;
    let absenderTelefon = personTelefon;
    if (antragstellerIdentischSBA === 'nein' && asNameSBA.trim() !== "") {
        absenderName = asNameSBA;
        absenderAdresse = asAdresseSBA;
        absenderTelefon = asTelefonSBA;
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line.trim()));
    if (absenderTelefon && absenderTelefon.trim() !== "") writeLine("Tel.: " + absenderTelefon);
    if (personEmail.trim() !== "" && antragstellerIdentischSBA === 'ja') writeLine("E-Mail: " + personEmail);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    writeLine("An das", defaultLineHeight, false, 10);
    writeLine("Zuständige Versorgungsamt / Landesamt für Soziales", defaultLineHeight, true, 11);
    writeParagraph("[Bitte hier die genaue Anschrift des zuständigen Amtes eintragen]", defaultLineHeight, 10, {fontStyle: "italic"});
    writeParagraph("[Ort und Postleitzahl des Amtes]", defaultLineHeight, 10, {fontStyle: "italic"});
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    let betreffText = `Antrag auf Feststellung einer Behinderung nach dem SGB IX`;
    betreffText += `\nund auf Ausstellung eines Schwerbehindertenausweises`;
    if (fruehererAntragSBA === 'ja' && fruehererGdB.trim() !== "") {
        betreffText += ` (Neufeststellungsantrag / Verschlimmerungsantrag)`;
    }
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    if (antragstellerIdentischSBA === 'nein' && asNameSBA.trim() !== "") {
        writeParagraph(`hiermit beantrage ich, ${asNameSBA}, als ${asVerhaeltnisSBA || 'bevollmächtigte Person'}, für`);
        writeParagraph(`Herrn/Frau ${personName}, geboren am ${personGeburtFormatiert} in ${personGeburtsort}, wohnhaft ${personAdresse.replace(/\n/g, ', ')}, (Krankenkasse: ${personKrankenkasse}),`);
        writeParagraph(`die Feststellung des Grades der Behinderung (GdB) sowie die Feststellung von Merkzeichen und die Ausstellung eines Schwerbehindertenausweises.`);
        if(asVollmachtSBA) writeParagraph("Eine entsprechende Vollmacht/Bestallungsurkunde liegt diesem Antrag bei.", defaultLineHeight, 10, {fontStyle: "italic"});
    } else {
        writeParagraph(`hiermit beantrage ich, ${personName}, geboren am ${personGeburtFormatiert} in ${personGeburtsort}, wohnhaft ${personAdresse.replace(/\n/g, ', ')}, (Krankenkasse: ${personKrankenkasse}),`);
        writeParagraph(`die Feststellung des Grades der Behinderung (GdB) sowie die Feststellung von Merkzeichen und die Ausstellung eines Schwerbehindertenausweises.`);
    }
     if (personGeburtsname.trim() !== "") {
        writeParagraph(`Geburtsname (falls abweichend): ${personGeburtsname}`, defaultLineHeight, 10);
    }
    writeParagraph(`Staatsangehörigkeit: ${personStaatsangehoerigkeit}`, defaultLineHeight, 10);
    writeParagraph(`Geschlecht: ${personGeschlecht}`, defaultLineHeight, 10);

    if (fruehererAntragSBA === 'ja') {
        writeLine("Angaben zu früheren Anträgen/Feststellungen:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        writeParagraph(`Es wurde bereits früher ein Antrag gestellt bzw. es lag ein Schwerbehindertenausweis vor.`);
        if(fruehererAntragAktenzeichen.trim() !== "") writeParagraph(`Aktenzeichen: ${fruehererAntragAktenzeichen}`);
        if(fruehererAntragBehoerde.trim() !== "") writeParagraph(`Zuständige Behörde damals: ${fruehererAntragBehoerde}`);
        if(fruehererGdB.trim() !== "") writeParagraph(`Festgestellter GdB/Merkzeichen damals: ${fruehererGdB}`);
        writeParagraph("Ich beantrage eine Neufeststellung aufgrund [Grund für Neufeststellung bitte hier oder in den beigefügten Unterlagen detaillierter erläutern, z.B. Verschlimmerung der bekannten Leiden, Hinzutreten neuer Erkrankungen].", defaultLineHeight, 10, {fontStyle:"italic"});
    }
    
    writeLine("Gesundheitsstörungen, die berücksichtigt werden sollen:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    if (gesundheitsstoerungen.length > 0) {
        gesundheitsstoerungen.forEach((g, index) => {
            writeParagraph(`${index + 1}. ${g.bezeichnung} (seit ca. ${g.beginn || 'unbekannt'})`);
        });
    } else {
        writeParagraph("Die genauen Gesundheitsstörungen entnehmen Sie bitte den beigefügten ärztlichen Unterlagen.", defaultLineHeight, 11);
    }
    if (auswirkungenGesundheitsstoerungen.trim() !== "") {
        writeLine("Auswirkungen der Gesundheitsstörungen auf Alltag und Leistungsfähigkeit:", defaultLineHeight, true, 10);
        writeParagraph(auswirkungenGesundheitsstoerungen);
    }

    if (aerzte.length > 0) {
        writeLine("Behandelnde Ärzte, Krankenhäuser, Rehabilitationseinrichtungen:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        aerzte.forEach((arzt, index) => {
            writeParagraph(`${index + 1}. ${arzt.name}\n   Anschrift: ${arzt.anschrift.replace(/\n/g, ', ')}\n   Behandlungszeitraum: ${arzt.zeitraum}`);
        });
    } else {
        writeParagraph("Die behandelnden Ärzte und Einrichtungen entnehmen Sie bitte den beigefügten medizinischen Unterlagen.", defaultLineHeight, 11);
    }

    if (merkzeichenBeantragt.length > 0) {
        writeLine("Folgende Merkzeichen werden beantragt:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        merkzeichenBeantragt.forEach(mz => {
            writeParagraph(`- Merkzeichen ${mz}`);
        });
        if (begruendungMerkzeichen.trim() !== "") {
            writeParagraph(`Begründung hierfür (Kurzform, Details siehe ärztliche Unterlagen):\n${begruendungMerkzeichen}`);
        }
    }

    writeLine("Einverständniserklärungen:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph("Ich entbinde die von mir genannten Ärzte, Krankenhäuser, Rehabilitationseinrichtungen und sonstigen Stellen (z.B. Gutachter, Behörden) von der Schweigepflicht gegenüber dem zuständigen Versorgungsamt und den von diesem beauftragten ärztlichen Gutachtern, soweit dies für die Prüfung meines Antrags erforderlich ist.", defaultLineHeight, 10);
    writeParagraph("Ich bin damit einverstanden, dass das Versorgungsamt die für die Entscheidung über meinen Antrag notwendigen Unterlagen bei den von mir genannten Stellen anfordert und meine personenbezogenen Daten im Rahmen des Feststellungsverfahrens nach SGB IX verarbeitet werden.", defaultLineHeight, 10);
    
    if (anlagen.length > 0) {
        writeLine("Beigefügte Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    } else {
        writeParagraph("Bitte fügen Sie diesem Antrag alle relevanten medizinischen Unterlagen in Kopie bei! Ohne diese kann Ihr Antrag nicht bearbeitet werden.", defaultLineHeight, 11, {fontStyle:"bold"});
    }
    
    writeParagraph("Ich versichere die Richtigkeit meiner Angaben. Ich bitte um eine wohlwollende Prüfung meines Antrags und um baldige Zusendung des Feststellungsbescheides und ggf. des Schwerbehindertenausweises.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("antrag_schwerbehinderung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupSBA");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}