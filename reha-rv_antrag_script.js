document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('rehaRvAntragForm');
    const saveBtn = document.getElementById('saveBtnRehaRv');
    const loadBtn = document.getElementById('loadBtnRehaRv');
    const closePopupBtn = document.getElementById('closePopupBtnRehaRv');
    const spendenPopup = document.getElementById('spendenPopupRehaRv');
    const storageKey = 'rehaRvAntragFormData';

    // Hier gäbe es aktuell keine dynamischen Felder zu steuern,
    // außer wir würden z.B. je nach Reha-Art unterschiedliche Detailfragen einblenden.
    // Für die erste Version lassen wir es ohne komplexe dynamische Feldanzeige im Formular.

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "personNameRehaRv", "personGeburtsdatumRehaRv", "personAdresseRehaRv", 
        "personRvNummerRehaRv", "personTelefonRehaRv", "personEmailRehaRv",
        "rvTraegerNameRehaRv", "rvTraegerStrasseRehaRv", "rvTraegerPlzOrtRehaRv",
        "rehaArtRehaRv", "rehaGrundErkrankungRehaRv",
        "auswirkungenGesundheitRehaRv", "auswirkungenBerufRehaRv", "zieleRehaRehaRv",
        "behandelndeAerzteRehaRv", "bisherigeMassnahmenRehaRv", "arbeitsunfaehigkeitRehaRv",
        "letzterBerufRehaRv", "aktuellerArbeitgeberRehaRv", "beruflichePlaeneRehaRv",
        "anlageSonstigesRehaRv"
    ];
    const checkboxIdsToSave = [ 
        "einverstaendnisAerzteRehaRv", "einverstaendnisDatenRehaRv"
    ];
    const anlagenCheckboxName = "anlagenRehaRv";


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
        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]:checked`).forEach(cb => data.anlagen.push(cb.value));
        
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

        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`).forEach(cb => {
            if (cb) { // Sicherstellen, dass Checkbox existiert
                 cb.checked = data.anlagen && data.anlagen.includes(cb.value);
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            if (!getElementChecked('einverstaendnisAerzteRehaRv') || !getElementChecked('einverstaendnisDatenRehaRv')) {
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
            console.error("Fehler beim Laden der Daten aus localStorage für Reha-Antrag (RV):", e);
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
            if (!getElementChecked('einverstaendnisAerzteRehaRv') || !getElementChecked('einverstaendnisDatenRehaRv')) {
                alert("Bitte stimmen Sie den Einverständniserklärungen (Schweigepflichtentbindung und Datennutzung) zu, um das PDF zu erstellen.");
                return;
            }
            generateRehaRvAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateRehaRvAntragPDF() {
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

    // Hilfsfunktionen für PDF
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
    const personNameRehaRv = getValue("personNameRehaRv");
    const personGeburtsdatumRehaRv = getFormattedDate("personGeburtsdatumRehaRv");
    const personAdresseRehaRv = getValue("personAdresseRehaRv");
    const personRvNummerRehaRv = getValue("personRvNummerRehaRv");
    const personTelefonRehaRv = getValue("personTelefonRehaRv");
    const personEmailRehaRv = getValue("personEmailRehaRv");

    const rvTraegerNameRehaRv = getValue("rvTraegerNameRehaRv", "Deutsche Rentenversicherung");
    const rvTraegerStrasseRehaRv = getValue("rvTraegerStrasseRehaRv");
    const rvTraegerPlzOrtRehaRv = getValue("rvTraegerPlzOrtRehaRv");

    const rehaArtRehaRv = getValue("rehaArtRehaRv");
    const rehaGrundErkrankungRehaRv = getValue("rehaGrundErkrankungRehaRv");
    const auswirkungenGesundheitRehaRv = getValue("auswirkungenGesundheitRehaRv");
    const auswirkungenBerufRehaRv = getValue("auswirkungenBerufRehaRv");
    const zieleRehaRehaRv = getValue("zieleRehaRehaRv");

    const behandelndeAerzteRehaRv = getValue("behandelndeAerzteRehaRv");
    const bisherigeMassnahmenRehaRv = getValue("bisherigeMassnahmenRehaRv");
    const arbeitsunfaehigkeitRehaRv = getValue("arbeitsunfaehigkeitRehaRv");

    const letzterBerufRehaRv = getValue("letzterBerufRehaRv");
    const aktuellerArbeitgeberRehaRv = getValue("aktuellerArbeitgeberRehaRv");
    const beruflichePlaeneRehaRv = getValue("beruflichePlaeneRehaRv");

    const anlagen = [];
    document.querySelectorAll('input[name="anlagenRehaRv"]:checked').forEach(cb => {
        anlagen.push(cb.value);
    });
    const anlageSonstigesRehaRv = getValue("anlageSonstigesRehaRv");
    if (anlageSonstigesRehaRv.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesRehaRv); }

    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal");
    doc.setFontSize(textFontSize);

    // ==========================================
    // --- UNIFORMER BRIEFKOPF START ---
    // ==========================================
    
    // 1. RECHTER BLOCK: Haupt-Absenderblock (Oben rechts)
    const rightColumnX = pageWidth - margin - 60; // Startpunkt rechts (ca. 130mm)
    let rightY = margin;
    
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.text("Absender:", rightColumnX, rightY);
    rightY += 5;
    
    doc.setFont(undefined, "normal");
    doc.setFontSize(textFontSize);
    doc.text(personNameRehaRv, rightColumnX, rightY);
    rightY += defaultLineHeight;
    
    personAdresseRehaRv.split("\n").forEach(line => {
        doc.text(line.trim(), rightColumnX, rightY);
        rightY += defaultLineHeight;
    });

    if (personTelefonRehaRv && personTelefonRehaRv.trim() !== "") {
        doc.text("Tel.: " + personTelefonRehaRv.trim(), rightColumnX, rightY);
        rightY += defaultLineHeight;
    }

    if (personEmailRehaRv && personEmailRehaRv.trim() !== "") {
        doc.text("E-Mail: " + personEmailRehaRv.trim(), rightColumnX, rightY);
        rightY += defaultLineHeight;
    }

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (RV-Träger)
    let leftY = margin + 15; 
    
    // Inline-Rücksendezeile generieren
    const cleanAddressInline = personAdresseRehaRv.replace(/\r?\n/g, " · ");
    const ruecksendeZeile = `${personNameRehaRv} · ${cleanAddressInline}`;
    
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120); // Dezentes Grau
    doc.text(ruecksendeZeile, margin, leftY);
    
    // Die feine Trennlinie unter dem Mini-Absender
    doc.setDrawColor(180, 180, 180); 
    doc.setLineWidth(0.2);
    doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); 
    
    // Empfänger (Rentenversicherungsträger) platzieren
    leftY += 6; 
    doc.setFontSize(textFontSize);
    doc.setTextColor(0, 0, 0); // Zurück zu Schwarz
    doc.text(rvTraegerNameRehaRv, margin, leftY);
    leftY += defaultLineHeight;
    
    rvTraegerStrasseRehaRv.split("\n").forEach(line => {
        doc.text(line.trim(), margin, leftY);
        leftY += defaultLineHeight;
    });

    rvTraegerPlzOrtRehaRv.split("\n").forEach(line => {
        doc.text(line.trim(), margin, leftY);
        leftY += defaultLineHeight;
    });

    // 3. DATUM: Rechtsbündig unterhalb der Blöcke
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(textFontSize);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * textFontSize / doc.internal.scaleFactor;
    
    // Kollisionsschutz (berücksichtigt Telefon + E-Mail rechts)
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Text
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

    // Betreff
    let betreffText = `Antrag auf Leistungen zur Rehabilitation (Begleitschreiben zum offiziellen Antrag)`;
    betreffText += `\nAntragsteller: ${personNameRehaRv}, geb. am ${personGeburtsdatumRehaRv}`;
    betreffText += `\nRentenversicherungsnummer: ${personRvNummerRehaRv}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`hiermit reiche ich, ${personNameRehaRv}, meinen Antrag auf Leistungen zur ${rehaArtRehaRv === "beides" ? "medizinischen und beruflichen" : rehaArtRehaRv} Rehabilitation ein. Dieses Schreiben dient als Ergänzung und Begründung zu dem beigefügten offiziellen Antragsformular und den medizinischen Unterlagen.`);
    
    // Gesundheitszustand und Auswirkungen
    writeLine("1. Aktuelle gesundheitliche Situation und Notwendigkeit der Rehabilitation:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    writeParagraph(`Die Rehabilitation wird aufgrund folgender hauptsächlicher Gesundheitsstörung(en) beantragt:\n${rehaGrundErkrankungRehaRv}`);
    if (auswirkungenGesundheitRehaRv.trim() !== "") {
        writeParagraph(`Diese Gesundheitsstörungen äußern sich durch folgende Beeinträchtigungen meiner Gesundheit und Leistungsfähigkeit:\n${auswirkungenGesundheitRehaRv}`);
    }
    if (auswirkungenBerufRehaRv.trim() !== "") {
        writeParagraph(`Die Auswirkungen auf meine Erwerbsfähigkeit stellen sich wie folgt dar:\n${auswirkungenBerufRehaRv}`);
    }
    if (arbeitsunfaehigkeitRehaRv.trim() !== "") {
        writeParagraph(`Ich bin/war aufgrund dieser Beschwerden arbeitsunfähig: ${arbeitsunfaehigkeitRehaRv}`);
    }

    // Ziele der Reha
    if (zieleRehaRehaRv.trim() !== "") {
        writeLine("2. Ziele der beantragten Rehabilitationsmaßnahme:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph/2;
        writeParagraph(`Mit der beantragten Rehabilitationsmaßnahme verfolge ich folgende Ziele:\n${zieleRehaRehaRv}`);
    }

    // Bisherige Maßnahmen und Ärzte
    writeLine("3. Bisherige Behandlungen und behandelnde Ärzte:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph/2;
    if (bisherigeMassnahmenRehaRv.trim() !== "") {
        writeParagraph(`Folgende medizinische oder therapeutische Maßnahmen wurden bisher durchgeführt:\n${bisherigeMassnahmenRehaRv}`);
    }
    if (behandelndeAerzteRehaRv.trim() !== "") {
        writeParagraph(`Die Notwendigkeit der Rehabilitation wird von folgenden Ärzten/Therapeuten unterstützt (siehe auch beigefügte Berichte):\n${behandelndeAerzteRehaRv}`);
    } else {
        writeParagraph("Die medizinische Notwendigkeit der Rehabilitation ist in den beigefügten ärztlichen Unterlagen ausführlich dargelegt.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }

    // Berufliche Situation (falls relevant)
    if (rehaArtRehaRv.includes("beruflich") || rehaArtRehaRv === "beides") {
        if (letzterBerufRehaRv.trim() !== "" || aktuellerArbeitgeberRehaRv.trim() !== "" || beruflichePlaeneRehaRv.trim() !== "") {
            writeLine("4. Angaben zur beruflichen Situation:", defaultLineHeight, "bold", subHeadingFontSize);
            y += spaceAfterParagraph/2;
            if (letzterBerufRehaRv.trim() !== "") writeParagraph(`Zuletzt ausgeübter Beruf: ${letzterBerufRehaRv}`);
            if (aktuellerArbeitgeberRehaRv.trim() !== "") writeParagraph(`Aktueller Arbeitgeber/Status: ${aktuellerArbeitgeberRehaRv}`);
            if (beruflichePlaeneRehaRv.trim() !== "") writeParagraph(`Meine beruflichen Pläne/Vorstellungen nach der Reha sind:\n${beruflichePlaeneRehaRv}`);
        }
    }
    
    // Einverständniserklärungen (im Text erwähnt, da Checkboxen im Formular)
    writeParagraph("Die im Antragsformular erforderlichen Einverständniserklärungen zur Entbindung der Ärzte von der Schweigepflicht und zur Datenverarbeitung durch den Rentenversicherungsträger habe ich erteilt.", defaultLineHeight, smallTextFontSize, {fontStyle:"italic", extraSpacingAfter: defaultLineHeight});


    // Anlagen
    if (anlagen.length > 0) {
        writeLine("Beigefügte Anlagen (zusätzlich zum Hauptantrag):", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    // Abschluss
    writeParagraph("Ich bitte um eine sorgfältige Prüfung meines Antrags und um eine baldige positive Entscheidung über die beantragten Rehabilitationsleistungen. Die Teilnahme an dieser Maßnahme ist für die Erhaltung bzw. Wiederherstellung meiner Gesundheit und Erwerbsfähigkeit von großer Bedeutung.", defaultLineHeight, textFontSize);
    writeParagraph("Für Rückfragen stehe ich Ihnen gerne zur Verfügung.", defaultLineHeight, textFontSize);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    writeParagraph("\n\n_________________________"); 
    writeParagraph(personNameRehaRv); // Unterschrift der Person, für die der Antrag ist

    doc.save("begleitschreiben_reha_antrag_rv.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupRehaRv");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}