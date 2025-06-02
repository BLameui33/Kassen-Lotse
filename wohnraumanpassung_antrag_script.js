document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('wohnraumanpassungAntragForm');
    const saveBtn = document.getElementById('saveBtnWohn');
    const loadBtn = document.getElementById('loadBtnWohn');
    const closePopupBtn = document.getElementById('closePopupBtnWohn');
    const spendenPopup = document.getElementById('spendenPopupWohn');
    const storageKey = 'wohnraumanpassungAntragFormData';

    // --- Steuerung der dynamischen Felder ---
    const antragstellerIdentischSelect = document.getElementById('antragstellerIdentischWohn');
    const antragstellerDetailsDiv = document.getElementById('antragstellerDetailsWohn');
    const anlageVollmachtWohnCheckbox = document.getElementById('asVollmachtWohn');

    const wohnartSelect = document.getElementById('wohnart');
    const vermieterDetailsDiv = document.getElementById('vermieterDetailsWohn');
    const zustimmungVermieterCheckbox = document.getElementById('zustimmungVermieter'); // Für die Anlage-Checkbox
    const anlageZustimmungVermieterCheckbox = document.querySelector('input[name="anlagenWohn"][value="Schriftliche Zustimmung des Vermieters (bei Mietobjekten)"]');


    const weiterePflegebeduerftigeSelect = document.getElementById('weiterePflegebeduerftigeImHaushalt');
    const detailsWeiterePflegebeduerftigeDiv = document.getElementById('detailsWeiterePflegebeduerftige');

    function updateDynamicFieldVisibility(selectElement, detailsDiv, showValue, requiredFieldsIds = [], checkboxToToggleRequired = null) {
        const isVisible = selectElement.value === showValue;
        detailsDiv.style.display = isVisible ? 'block' : 'none';
        detailsDiv.classList.toggle('sub-details-active', isVisible);
        requiredFieldsIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.required = isVisible;
        });
        if (checkboxToToggleRequired) { // Spezifische Checkbox required machen
             const elCheckbox = document.getElementById(checkboxToToggleRequired.id);
             if(elCheckbox) elCheckbox.required = isVisible;
        }
    }
    
    if (antragstellerIdentischSelect && antragstellerDetailsDiv) {
        antragstellerIdentischSelect.addEventListener('change', () => {
            updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameWohn', 'asAdresseWohn', 'asVerhaeltnisWohn'], anlageVollmachtWohnCheckbox);
        });
        updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameWohn', 'asAdresseWohn', 'asVerhaeltnisWohn'], anlageVollmachtWohnCheckbox);
    }

    if (wohnartSelect && vermieterDetailsDiv) {
        wohnartSelect.addEventListener('change', () => {
            const showFor = (wohnartSelect.value === 'Mietwohnung' || wohnartSelect.value === 'Untermiete');
            vermieterDetailsDiv.style.display = showFor ? 'block' : 'none';
            vermieterDetailsDiv.classList.toggle('sub-details-active', showFor);
            document.getElementById('vermieterNameAdresse').required = showFor;
            // Mache die Checkbox für die Zustimmung des Vermieters (in den Anlagen) abhängig
            if(anlageZustimmungVermieterCheckbox) anlageZustimmungVermieterCheckbox.disabled = !showFor;
            if(!showFor && anlageZustimmungVermieterCheckbox) anlageZustimmungVermieterCheckbox.checked = false; // Uncheck if not relevant
            // Die Checkbox "Zustimmung des Vermieters liegt vor..." im Formular selbst
            if(zustimmungVermieterCheckbox) zustimmungVermieterCheckbox.required = showFor;


        });
        // Initial call
        const showForInitial = (wohnartSelect.value === 'Mietwohnung' || wohnartSelect.value === 'Untermiete');
        vermieterDetailsDiv.style.display = showForInitial ? 'block' : 'none';
        vermieterDetailsDiv.classList.toggle('sub-details-active', showForInitial);
        document.getElementById('vermieterNameAdresse').required = showForInitial;
        if(anlageZustimmungVermieterCheckbox) anlageZustimmungVermieterCheckbox.disabled = !showForInitial;
        if(zustimmungVermieterCheckbox) zustimmungVermieterCheckbox.required = showForInitial;


    }

    if (weiterePflegebeduerftigeSelect && detailsWeiterePflegebeduerftigeDiv) {
        weiterePflegebeduerftigeSelect.addEventListener('change', () => updateDynamicFieldVisibility(weiterePflegebeduerftigeSelect, detailsWeiterePflegebeduerftigeDiv, 'ja', ['namenWeiterePflegebeduerftige']));
        updateDynamicFieldVisibility(weiterePflegebeduerftigeSelect, detailsWeiterePflegebeduerftigeDiv, 'ja', ['namenWeiterePflegebeduerftige']);
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpPflegegrad", "vpTelefon",
        "antragstellerIdentischWohn", "asNameWohn", "asAdresseWohn", "asVerhaeltnisWohn",
        "kasseName", "kasseAdresse",
        "wohnart", "vermieterNameAdresse", 
        "weiterePflegebeduerftigeImHaushalt", "namenWeiterePflegebeduerftige",
        "massnahmeBereich", "massnahmeBeschreibung", "massnahmeBegruendung", "massnahmeWeitere",
        "anzahlKostenvoranschlaege", "gesamtkostenLautVoranschlag", "firmaNameAngebot",
        "anlageSonstigesWohn"
    ];
    const anlagenCheckboxName = "anlagenWohn";

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        // Spezifische Checkboxen
        const asVollmachtCheckbox = document.getElementById('asVollmachtWohn');
        if (asVollmachtCheckbox) data.asVollmachtWohn = asVollmachtCheckbox.checked;
        const zustimmungVermieterCb = document.getElementById('zustimmungVermieter');
        if (zustimmungVermieterCb) data.zustimmungVermieter = zustimmungVermieterCb.checked;
        const eigenleistungCb = document.getElementById('eigenleistungGeplant');
        if (eigenleistungCb) data.eigenleistungGeplant = eigenleistungCb.checked;

        data.anlagen = [];
        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]:checked`).forEach(checkbox => {
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
        // Spezifische Checkboxen
        const asVollmachtCheckbox = document.getElementById('asVollmachtWohn');
        if (asVollmachtCheckbox && data.asVollmachtWohn !== undefined) asVollmachtCheckbox.checked = data.asVollmachtWohn;
        const zustimmungVermieterCb = document.getElementById('zustimmungVermieter');
        if (zustimmungVermieterCb && data.zustimmungVermieter !== undefined) zustimmungVermieterCb.checked = data.zustimmungVermieter;
        const eigenleistungCb = document.getElementById('eigenleistungGeplant');
        if (eigenleistungCb && data.eigenleistungGeplant !== undefined) eigenleistungCb.checked = data.eigenleistungGeplant;
        
        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`).forEach(checkbox => {
            checkbox.checked = data.anlagen && data.anlagen.includes(checkbox.value);
        });

        // Sichtbarkeit nach Laden aktualisieren
        if (antragstellerIdentischSelect) updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameWohn', 'asAdresseWohn', 'asVerhaeltnisWohn'], anlageVollmachtWohnCheckbox);
        if (wohnartSelect) {
            const showFor = (wohnartSelect.value === 'Mietwohnung' || wohnartSelect.value === 'Untermiete');
            vermieterDetailsDiv.style.display = showFor ? 'block' : 'none';
            vermieterDetailsDiv.classList.toggle('sub-details-active', showFor);
            document.getElementById('vermieterNameAdresse').required = showFor;
            if(anlageZustimmungVermieterCheckbox) anlageZustimmungVermieterCheckbox.disabled = !showFor;
            if(zustimmungVermieterCheckbox) zustimmungVermieterCheckbox.required = showFor;
        }
        if (weiterePflegebeduerftigeSelect) updateDynamicFieldVisibility(weiterePflegebeduerftigeSelect, detailsWeiterePflegebeduerftigeDiv, 'ja', ['namenWeiterePflegebeduerftige']);
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
            // Validierung für Vermieterzustimmung bei Mietobjekten
            if ((document.getElementById('wohnart').value === 'Mietwohnung' || document.getElementById('wohnart').value === 'Untermiete') && !document.getElementById('zustimmungVermieter').checked) {
                alert("Bei Mietobjekten ist die (zukünftige) Zustimmung des Vermieters eine wichtige Voraussetzung. Bitte bestätigen Sie, dass diese vorliegt oder eingeholt wird.");
                // return; // Ggf. PDF-Generierung stoppen oder nur als Hinweis lassen
            }
            generateWohnraumanpassungAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateWohnraumanpassungAntragPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 7;
    const spaceAfterParagraph = 2;

    // Hilfsfunktionen für PDF
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
    const vpPflegegrad = document.getElementById("vpPflegegrad").value;
    const vpTelefon = document.getElementById("vpTelefon").value;

    const antragstellerIdentischWohn = document.getElementById("antragstellerIdentischWohn").value;
    const asNameWohn = document.getElementById("asNameWohn").value;
    const asAdresseWohn = document.getElementById("asAdresseWohn").value;
    const asVerhaeltnisWohn = document.getElementById("asVerhaeltnisWohn").value;
    const asVollmachtWohn = document.getElementById("asVollmachtWohn") ? document.getElementById("asVollmachtWohn").checked : false;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    const wohnart = document.getElementById("wohnart").value;
    const vermieterNameAdresse = document.getElementById("vermieterNameAdresse").value;
    const zustimmungVermieterChecked = document.getElementById("zustimmungVermieter") ? document.getElementById("zustimmungVermieter").checked : false;
    
    const weiterePflegebeduerftigeImHaushalt = document.getElementById("weiterePflegebeduerftigeImHaushalt").value;
    const namenWeiterePflegebeduerftige = document.getElementById("namenWeiterePflegebeduerftige").value;

    const massnahmeBereich = document.getElementById("massnahmeBereich").value;
    const massnahmeBeschreibung = document.getElementById("massnahmeBeschreibung").value;
    const massnahmeBegruendung = document.getElementById("massnahmeBegruendung").value;
    const massnahmeWeitere = document.getElementById("massnahmeWeitere").value;

    const anzahlKostenvoranschlaege = document.getElementById("anzahlKostenvoranschlaege").value;
    const gesamtkostenLautVoranschlag = document.getElementById("gesamtkostenLautVoranschlag").value;
    const firmaNameAngebot = document.getElementById("firmaNameAngebot").value;
    const eigenleistungGeplantChecked = document.getElementById("eigenleistungGeplant") ? document.getElementById("eigenleistungGeplant").checked : false;


    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenWohn"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtWohn" && antragstellerIdentischWohn === "ja") { /* Keine Vollmachtsanlage wenn selbst */ }
        else if (checkbox.id === "anlageZustimmungVermieter" && !(wohnart === 'Mietwohnung' || wohnart === 'Untermiete')) { /* Keine Vermieterzustimmung wenn Eigentum */ }
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesWohn = document.getElementById("anlageSonstigesWohn").value;
    if (anlageSonstigesWohn.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesWohn); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    let absenderTelefon = vpTelefon;
    if (antragstellerIdentischWohn === 'nein' && asNameWohn.trim() !== "") {
        absenderName = asNameWohn;
        absenderAdresse = asAdresseWohn; // Adresse des Antragstellers verwenden
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line));
    if (absenderTelefon.trim() !== "") writeLine("Tel.: " + absenderTelefon); // Telefon des tatsächlichen Absenders
    if (antragstellerIdentischWohn === 'nein' && asNameWohn.trim() !== ""){
         writeParagraph(`(handelnd als ${asVerhaeltnisWohn || 'Vertreter/in'} für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`, defaultLineHeight, 9, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    }
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger, Datum (Standard)
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
    let betreffText = `Antrag auf einen Zuschuss für wohnumfeldverbessernde Maßnahmen gemäß § 40 Abs. 4 SGB XI`;
    betreffText += `\nFür: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer}`;
    if (vpPflegegrad.trim() !== "" && vpPflegegrad.trim() !== "Bitte wählen...") {
        betreffText += ` (${vpPflegegrad})`;
    }
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`hiermit beantrage ich/beantragen wir für Herrn/Frau ${vpName} einen Zuschuss für wohnumfeldverbessernde Maßnahmen nach § 40 Abs. 4 SGB XI.`);
    writeParagraph(`Die Pflege und Betreuung von Herrn/Frau ${vpName} findet in der oben genannten Wohnung statt. Es besteht der ${vpPflegegrad || '(Pflegegrad bitte im Formular angeben)'}.`);

    // Wohnsituation
    writeLine("1. Angaben zur Wohnsituation:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Die Wohnung ist: ${wohnart}.`);
    if (wohnart === "Mietwohnung" || wohnart === "Untermiete") {
        if (vermieterNameAdresse.trim() !== "") {
            writeParagraph(`Vermieter/Hauptmieter: ${vermieterNameAdresse.replace(/\n/g, ', ')}.`);
        }
        if (zustimmungVermieterChecked) {
            writeParagraph("Die erforderliche Zustimmung des Vermieters zu den geplanten Maßnahmen liegt vor bzw. wird mit den detaillierten Planungen eingeholt und nachgereicht.");
        } else {
            writeParagraph("Die Zustimmung des Vermieters zu den geplanten Maßnahmen wird derzeit eingeholt und schnellstmöglich nachgereicht. Ohne diese Zustimmung wird mit den Maßnahmen selbstverständlich nicht begonnen.", defaultLineHeight, 10, {fontStyle:"italic"});
        }
    }
    if (weiterePflegebeduerftigeImHaushalt === "ja" && namenWeiterePflegebeduerftige.trim() !== "") {
        writeParagraph(`Im Haushalt leben weitere pflegebedürftige Personen, die von den Maßnahmen profitieren: ${namenWeiterePflegebeduerftige}. Wir bitten um Berücksichtigung bei der Höhe des Gesamtzuschusses.`);
    }
    
    // Geplante Maßnahmen
    writeLine("2. Geplante Maßnahme(n) und Begründung:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Bereich der Hauptmaßnahme: ${massnahmeBereich}`);
    writeParagraph(`Beschreibung der Hauptmaßnahme:\n${massnahmeBeschreibung}`);
    writeParagraph(`Notwendigkeit dieser Hauptmaßnahme:\n${massnahmeBegruendung}`);
    if (massnahmeWeitere.trim() !== "") {
        writeParagraph(`Weitere geplante Maßnahmen:\n${massnahmeWeitere}`);
    }
    writeParagraph("Diese Maßnahmen sind dringend erforderlich, um die häusliche Pflege zu ermöglichen/erleichtern bzw. eine möglichst selbstständige Lebensführung zu erhalten/wiederherzustellen.");

    // Kosten
    writeLine("3. Voraussichtliche Kosten und Durchführung:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    if (anzahlKostenvoranschlaege.trim() !== "" && anzahlKostenvoranschlaege !== "0") {
        writeParagraph(`Es liegen ${anzahlKostenvoranschlaege} Kostenvoranschlag/Kostenvoranschläge bei.`);
    } else {
        writeParagraph("Kostenvoranschläge werden derzeit eingeholt und schnellstmöglich nachgereicht. Dieser Antrag dient der grundsätzlichen Klärung der Bezuschussung.");
    }
    if (gesamtkostenLautVoranschlag.trim() !== "") {
        writeParagraph(`Die voraussichtlichen Gesamtkosten laut bevorzugtem/günstigstem Angebot betragen ca. ${parseFloat(gesamtkostenLautVoranschlag).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}.`);
    }
    if (firmaNameAngebot.trim() !== "") {
        writeParagraph(`Der (bevorzugte) Kostenvoranschlag wurde erstellt von: ${firmaNameAngebot}.`);
    }
    if (eigenleistungGeplantChecked) {
        writeParagraph("Es sind auch Eigenleistungen geplant, um die Kosten zu senken. Details hierzu können bei Bedarf erläutert werden.");
    }
    
    // Anlagen
    if (anlagen.length > 0) {
        writeLine("4. Beigefügte Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    // Abschluss
    writeParagraph("Ich/Wir bitten um eine wohlwollende Prüfung dieses Antrags und um eine schriftliche Zusage für den Zuschuss zu den genannten wohnumfeldverbessernden Maßnahmen.", defaultLineHeight, 11);
    writeParagraph("Bitte teilen Sie uns mit, ob weitere Unterlagen oder Informationen für Ihre Entscheidung benötigt werden.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("antrag_wohnraumanpassung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupWohn");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}