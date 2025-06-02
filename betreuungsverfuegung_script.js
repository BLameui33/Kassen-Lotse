document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('betreuungsverfuegungForm');
    const saveBtn = document.getElementById('saveBtnBetreuungsV');
    const loadBtn = document.getElementById('loadBtnBetreuungsV');
    const closePopupBtn = document.getElementById('closePopupBtnBetreuungsV');
    const spendenPopup = document.getElementById('spendenPopupBetreuungsV');
    const storageKey = 'betreuungsverfuegungFormData';

    // --- Steuerung der dynamischen Felder ---
    const addWunschbetreuerBtn = document.getElementById('addWunschbetreuerBtn');
    const removeWunschbetreuerBtn = document.getElementById('removeWunschbetreuerBtn');
    const wunschbetreuer2Wrapper = document.getElementById('wunschbetreuer2Wrapper');

    const infoVorsorgevollmachtSelect = document.getElementById('infoVorsorgevollmacht');
    const detailsVorsorgevollmachtDiv = document.getElementById('detailsVorsorgevollmacht');
    const infoPatientenverfuegungSelect = document.getElementById('infoPatientenverfuegung');
    const detailsPatientenverfuegungDiv = document.getElementById('detailsPatientenverfuegung');

    function updateWunschbetreuer2Visibility(show) {
        if (wunschbetreuer2Wrapper && addWunschbetreuerBtn && removeWunschbetreuerBtn) {
            wunschbetreuer2Wrapper.style.display = show ? 'block' : 'none';
            wunschbetreuer2Wrapper.classList.toggle('sub-details-active', show);
            document.getElementById('wb2Name').required = show;
            // Weitere required Felder für wb2 bei Bedarf hier setzen

            addWunschbetreuerBtn.style.display = show ? 'none' : 'inline-block';
            removeWunschbetreuerBtn.style.display = show ? 'inline-block' : 'none';
        }
    }

    if (addWunschbetreuerBtn) {
        addWunschbetreuerBtn.addEventListener('click', function() {
            updateWunschbetreuer2Visibility(true);
        });
    }
    if (removeWunschbetreuerBtn) {
        removeWunschbetreuerBtn.addEventListener('click', function() {
            updateWunschbetreuer2Visibility(false);
            // Felder von wb2 leeren
            document.getElementById('wb2Name').value = '';
            document.getElementById('wb2Geburtsdatum').value = '';
            document.getElementById('wb2Adresse').value = '';
            document.getElementById('wb2Telefon').value = '';
            document.getElementById('wb2Verhaeltnis').value = '';
        });
    }
    // Initialer Zustand für Wunschbetreuer 2
    updateWunschbetreuer2Visibility(document.getElementById('wb2Name') && document.getElementById('wb2Name').value.trim() !== '');


    function updateDetailsVisibility(selectElement, detailsDiv, showValue, requiredFieldId = null) {
        const isVisible = selectElement.value.startsWith(showValue); // "ja_umfassend", "ja_teilweise" beginnen mit "ja"
        detailsDiv.style.display = isVisible ? 'block' : 'none';
        detailsDiv.classList.toggle('sub-details-active', isVisible);
        if (requiredFieldId) {
            const el = document.getElementById(requiredFieldId);
            if (el) el.required = isVisible;
        }
    }

    if (infoVorsorgevollmachtSelect && detailsVorsorgevollmachtDiv) {
        infoVorsorgevollmachtSelect.addEventListener('change', () => updateDetailsVisibility(infoVorsorgevollmachtSelect, detailsVorsorgevollmachtDiv, 'ja', 'infoVollmachtWo'));
        updateDetailsVisibility(infoVorsorgevollmachtSelect, detailsVorsorgevollmachtDiv, 'ja', 'infoVollmachtWo');
    }
    if (infoPatientenverfuegungSelect && detailsPatientenverfuegungDiv) {
        infoPatientenverfuegungSelect.addEventListener('change', () => updateDetailsVisibility(infoPatientenverfuegungSelect, detailsPatientenverfuegungDiv, 'ja', 'infoPatientenverfuegungWo'));
        updateDetailsVisibility(infoPatientenverfuegungSelect, detailsPatientenverfuegungDiv, 'ja', 'infoPatientenverfuegungWo');
    }


    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "personName", "personGeburtsdatum", "personAdresse", "personTelefon",
        "wb1Name", "wb1Geburtsdatum", "wb1Adresse", "wb1Telefon", "wb1Verhaeltnis",
        "wb2Name", "wb2Geburtsdatum", "wb2Adresse", "wb2Telefon", "wb2Verhaeltnis",
        "abgelehnteBetreuer",
        "wuenscheLebensgestaltung", "wuenscheVermoegenssorge", "wuenscheGesundheitssorge", "wuenscheAufgabenkreise",
        "infoVorsorgevollmacht", "infoVollmachtWo", "infoPatientenverfuegung", "infoPatientenverfuegungWo"
    ];
    const checkboxIdsToSave = [
        "eigenhaendigUnterschreibenBV"
    ];

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
        // Sichtbarkeit nach Laden aktualisieren
        updateWunschbetreuer2Visibility(data.wb2Name && data.wb2Name.trim() !== '');
        if (infoVorsorgevollmachtSelect) updateDetailsVisibility(infoVorsorgevollmachtSelect, detailsVorsorgevollmachtDiv, 'ja', 'infoVollmachtWo');
        if (infoPatientenverfuegungSelect) updateDetailsVisibility(infoPatientenverfuegungSelect, detailsPatientenverfuegungDiv, 'ja', 'infoPatientenverfuegungWo');
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
            console.error("Fehler beim Laden der Daten aus localStorage für Betreuungsverfügung:", e);
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
            if (!document.getElementById('eigenhaendigUnterschreibenBV').checked) {
                alert("Bitte bestätigen Sie, dass Sie das Dokument nach dem Ausdrucken eigenhändig unterschreiben werden.");
                return;
            }
            // Validierung für zweite Wunsch-Betreuerperson, wenn sichtbar
            if (wunschbetreuer2Wrapper.style.display === 'block' && document.getElementById('wb2Name').value.trim() === "") {
                alert("Bitte geben Sie den Namen für die zweite gewünschte Betreuerperson an oder entfernen Sie sie.");
                document.getElementById('wb2Name').focus();
                return;
            }
            generateBetreuungsverfuegungPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateBetreuungsverfuegungPDF() {
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
    const subHeadingFontSize = 12;
    const textFontSize = 10;
    const smallTextFontSize = 9;

    // Hilfsfunktionen für PDF (ggf. auslagern)
    function writeLine(text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        if (y + currentLineHeight > usableHeight - (margin/2)) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont(undefined, fontStyle);
        doc.text(textToWrite, margin, y);
        y += currentLineHeight;
    }

    function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = textFontSize, options = {}) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        const fontStyle = options.fontStyle || "normal";
        const extraSpacing = options.extraSpacingAfter || spaceAfterParagraph;
        doc.setFontSize(paragraphFontSize);
        doc.setFont(undefined, fontStyle);
        
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
    
    // Formulardaten sammeln
    const personName = document.getElementById("personName").value || "";
    const personGeburtsdatumInput = document.getElementById("personGeburtsdatum").value;
    const personGeburtsdatum = personGeburtsdatumInput ? new Date(personGeburtsdatumInput).toLocaleDateString("de-DE") : 'N/A';
    const personAdresse = document.getElementById("personAdresse").value || "";
    const personTelefon = document.getElementById("personTelefon").value || "";

    const wb1Name = document.getElementById("wb1Name").value || "";
    const wb1GeburtsdatumInput = document.getElementById("wb1Geburtsdatum").value;
    const wb1Geburtsdatum = wb1GeburtsdatumInput ? new Date(wb1GeburtsdatumInput).toLocaleDateString("de-DE") : '';
    const wb1Adresse = document.getElementById("wb1Adresse").value || "";
    const wb1Telefon = document.getElementById("wb1Telefon").value || "";
    const wb1Verhaeltnis = document.getElementById("wb1Verhaeltnis").value || "";

    const wb2Name = document.getElementById("wb2Name").value || "";
    let wb2Geburtsdatum = '', wb2Adresse = '', wb2Telefon = '', wb2Verhaeltnis = '';
    if (wb2Name.trim() !== "") {
        const wb2GeburtsdatumInput = document.getElementById("wb2Geburtsdatum").value;
        wb2Geburtsdatum = wb2GeburtsdatumInput ? new Date(wb2GeburtsdatumInput).toLocaleDateString("de-DE") : '';
        wb2Adresse = document.getElementById("wb2Adresse").value || "";
        wb2Telefon = document.getElementById("wb2Telefon").value || "";
        wb2Verhaeltnis = document.getElementById("wb2Verhaeltnis").value || "";
    }

    const abgelehnteBetreuer = document.getElementById("abgelehnteBetreuer").value || "";
    const wuenscheLebensgestaltung = document.getElementById("wuenscheLebensgestaltung").value || "";
    const wuenscheVermoegenssorge = document.getElementById("wuenscheVermoegenssorge").value || "";
    const wuenscheGesundheitssorge = document.getElementById("wuenscheGesundheitssorge").value || "";
    const wuenscheAufgabenkreise = document.getElementById("wuenscheAufgabenkreise").value || "";

    const infoVorsorgevollmacht = document.getElementById("infoVorsorgevollmacht").value;
    const infoVollmachtWo = document.getElementById("infoVollmachtWo").value || "";
    const infoPatientenverfuegung = document.getElementById("infoPatientenverfuegung").value;
    const infoPatientenverfuegungWo = document.getElementById("infoPatientenverfuegungWo").value || "";

    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal"); 

    writeParagraph("Betreuungsverfügung", defaultLineHeight, headingFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    writeParagraph("Ich,", defaultLineHeight, textFontSize);
    writeLine(`${personName}`, defaultLineHeight, "bold", textFontSize);
    writeLine(`geboren am: ${personGeburtsdatum}`, defaultLineHeight, "normal", textFontSize);
    personAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (personTelefon.trim() !== "") writeLine(`Telefon: ${personTelefon}`, defaultLineHeight, "normal", textFontSize);
    y += defaultLineHeight;

    writeParagraph("treffe für den Fall, dass ich meine Angelegenheiten ganz oder teilweise nicht mehr selbst regeln kann und deshalb für mich eine rechtliche Betreuerin oder ein rechtlicher Betreuer bestellt werden muss, die nachfolgenden Anordnungen und Wünsche:", defaultLineHeight, textFontSize);
    y += defaultLineHeight;

    writeLine("1. Auswahl der Betreuerin / des Betreuers", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;
    if (wb1Name.trim() !== "") {
        writeParagraph(`Ich wünsche, dass das Betreuungsgericht im Falle einer notwendig werdenden Betreuung Frau/Herrn`, defaultLineHeight, textFontSize, {extraSpacingAfter:0});
        writeLine(`${wb1Name}`, defaultLineHeight, "bold", textFontSize);
        if (wb1Geburtsdatum.trim() !== "") writeLine(`geboren am: ${wb1Geburtsdatum}`, defaultLineHeight, "normal", textFontSize);
        if (wb1Adresse.trim() !== "") {
            wb1Adresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
        }
        if (wb1Telefon.trim() !== "") writeLine(`Telefon: ${wb1Telefon}`, defaultLineHeight, "normal", textFontSize);
        if (wb1Verhaeltnis.trim() !== "") writeLine(`Verhältnis zu mir: ${wb1Verhaeltnis}`, defaultLineHeight, "normal", textFontSize);
        writeParagraph(`als Betreuerin/Betreuer bestellt.`, defaultLineHeight, textFontSize);
    } else {
        writeParagraph("Ich habe keine spezifische Person als Wunschbetreuer benannt und überlasse die Auswahl dem Betreuungsgericht.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }

    if (wb2Name.trim() !== "") {
        writeParagraph(`Sollte die oben genannte Person (1.) nicht als Betreuerin/Betreuer bestellt werden können oder wollen, wünsche ich hilfsweise die Bestellung von Frau/Herrn`, defaultLineHeight, textFontSize, {extraSpacingAfter:0});
        writeLine(`${wb2Name}`, defaultLineHeight, "bold", textFontSize);
        if (wb2Geburtsdatum.trim() !== "") writeLine(`geboren am: ${wb2Geburtsdatum}`, defaultLineHeight, "normal", textFontSize);
        if (wb2Adresse.trim() !== "") {
            wb2Adresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
        }
        if (wb2Telefon.trim() !== "") writeLine(`Telefon: ${wb2Telefon}`, defaultLineHeight, "normal", textFontSize);
        if (wb2Verhaeltnis.trim() !== "") writeLine(`Verhältnis zu mir: ${wb2Verhaeltnis}`, defaultLineHeight, "normal", textFontSize);
        writeParagraph(`als Betreuerin/Betreuer.`, defaultLineHeight, textFontSize);
    }
    y += defaultLineHeight;

    if (abgelehnteBetreuer.trim() !== "") {
        writeLine("Folgende Person(en) soll(en) auf keinen Fall als Betreuer:in bestellt werden:", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        writeParagraph(abgelehnteBetreuer, defaultLineHeight, textFontSize);
        y += defaultLineHeight;
    }

    writeLine("2. Wünsche zur Durchführung der Betreuung", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;
    if (wuenscheLebensgestaltung.trim() !== "") {
        writeParagraph(`Meine Wünsche zur Lebensgestaltung (z.B. Wohnort, Gewohnheiten):\n${wuenscheLebensgestaltung}`, defaultLineHeight, textFontSize);
    }
    if (wuenscheVermoegenssorge.trim() !== "") {
        writeParagraph(`Meine Wünsche zur Vermögenssorge:\n${wuenscheVermoegenssorge}`, defaultLineHeight, textFontSize);
    }
    if (wuenscheGesundheitssorge.trim() !== "") {
        writeParagraph(`Meine Wünsche zur Gesundheitssorge (ergänzend zu einer ggf. vorhandenen Patientenverfügung):\n${wuenscheGesundheitssorge}`, defaultLineHeight, textFontSize);
    }
    if (wuenscheAufgabenkreise.trim() !== "") {
        writeParagraph(`Meine Wünsche zu den Aufgabenkreisen der Betreuung:\n${wuenscheAufgabenkreise}`, defaultLineHeight, textFontSize);
    }
    if (wuenscheLebensgestaltung.trim() === "" && wuenscheVermoegenssorge.trim() === "" && wuenscheGesundheitssorge.trim() === "" && wuenscheAufgabenkreise.trim() === "") {
        writeParagraph("Ich überlasse die Entscheidungen im Rahmen der Betreuung dem/der bestellten Betreuer:in, der/die mein Wohl zu beachten hat.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
    y += defaultLineHeight;

    writeLine("3. Verhältnis zu anderen Verfügungen", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;
    if (infoVorsorgevollmacht !== "nein") {
        writeParagraph(`Ich habe eine Vorsorgevollmacht erstellt (${infoVorsorgevollmacht === "ja_umfassend" ? "umfassend" : "teilweise"}). Diese ist vorrangig zu beachten. ${infoVollmachtWo.trim() !== "" ? "Sie befindet sich: " + infoVollmachtWo + "." : ""}`, defaultLineHeight, textFontSize);
    } else {
        writeParagraph("Ich habe bisher keine Vorsorgevollmacht erstellt.", defaultLineHeight, textFontSize);
    }
    if (infoPatientenverfuegung === "ja") {
        writeParagraph(`Ich habe eine Patientenverfügung erstellt. Diese ist für medizinische Entscheidungen bindend. ${infoPatientenverfuegungWo.trim() !== "" ? "Sie befindet sich: " + infoPatientenverfuegungWo + "." : ""}`, defaultLineHeight, textFontSize);
    } else {
        writeParagraph("Ich habe bisher keine Patientenverfügung erstellt.", defaultLineHeight, textFontSize);
    }
    y += defaultLineHeight;

    writeParagraph("Diese Betreuungsverfügung ist Ausdruck meines freien Willens und wurde bei voller Geschäftsfähigkeit errichtet. Ich behalte mir das Recht vor, diese Verfügung jederzeit zu ändern oder zu widerrufen.", defaultLineHeight, textFontSize);
    y += defaultLineHeight * 2;

    writeLine("_________________________                ____________________________________________________", defaultLineHeight, "normal", textFontSize);
    writeLine("Ort, Datum", defaultLineHeight + 2, "normal", smallTextFontSize); 
    y -= defaultLineHeight; 
    doc.text("Unterschrift der verfügenden Person", margin + 60, y-2, {fontSize: smallTextFontSize}); 
    y += defaultLineHeight * 2; 


    doc.save("betreuungsverfuegung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupBetreuungsV");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}