document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pflegehilfsmittelAntragForm');
    const saveBtn = document.getElementById('saveBtnPflegeHM');
    const loadBtn = document.getElementById('loadBtnPflegeHM');
    const closePopupBtn = document.getElementById('closePopupBtnPflegeHM');
    const spendenPopup = document.getElementById('spendenPopupPflegeHM');
    const storageKey = 'pflegehilfsmittelAntragFormData';

    // --- Steuerung der dynamischen Felder ---
    const antragstellerIdentischSelect = document.getElementById('antragstellerIdentischPflegeHM');
    const antragstellerDetailsDiv = document.getElementById('antragstellerDetailsPflegeHM');
    const anlageVollmachtCheckboxAntrag = document.getElementById('asVollmachtPflegeHM');


    const antragArtPauschaleCheckbox = document.getElementById('antragArtPauschale');
    const antragArtTechnischCheckbox = document.getElementById('antragArtTechnisch');
    const detailsPauschaleDiv = document.getElementById('detailsPauschale');
    const detailsTechnischesHilfsmittelDiv = document.getElementById('detailsTechnischesHilfsmittel');

    function updateDynamicFieldVisibility(selectElement, detailsDiv, showValue = 'nein', requiredFieldsIds = []) {
        const isVisible = selectElement.value === showValue;
        detailsDiv.style.display = isVisible ? 'block' : 'none';
        detailsDiv.classList.toggle('sub-details-active', isVisible); // Klasse für required-Logik
        requiredFieldsIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.required = isVisible;
        });
    }
    
    function updateAntragArtDetailsVisibility() {
        const pauschaleChecked = antragArtPauschaleCheckbox.checked;
        const technischChecked = antragArtTechnischCheckbox.checked;

        detailsPauschaleDiv.style.display = pauschaleChecked ? 'block' : 'none';
        detailsPauschaleDiv.classList.toggle('sub-details-active', pauschaleChecked);
        // Keine Pflichtfelder in der Pauschalen-Sektion per se

        detailsTechnischesHilfsmittelDiv.style.display = technischChecked ? 'block' : 'none';
        detailsTechnischesHilfsmittelDiv.classList.toggle('sub-details-active', technischChecked);
        document.getElementById('bezeichnungTechnischesHilfsmittel').required = technischChecked;
        document.getElementById('begruendungTechnischesHilfsmittel').required = technischChecked;
        // Weitere required Felder für technische Hilfsmittel nach Bedarf hier hinzufügen
    }

    if (antragstellerIdentischSelect && antragstellerDetailsDiv) {
        antragstellerIdentischSelect.addEventListener('change', () => updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNamePflegeHM', 'asVerhaeltnisPflegeHM']));
        updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNamePflegeHM', 'asVerhaeltnisPflegeHM']);
        // Dynamisches required für Vollmacht-Checkbox
        antragstellerIdentischSelect.addEventListener('change', () => {
            if(anlageVollmachtCheckboxAntrag) anlageVollmachtCheckboxAntrag.required = antragstellerIdentischSelect.value === 'nein';
        });
         if(anlageVollmachtCheckboxAntrag) anlageVollmachtCheckboxAntrag.required = antragstellerIdentischSelect.value === 'nein';
    }

    if (antragArtPauschaleCheckbox) antragArtPauschaleCheckbox.addEventListener('change', updateAntragArtDetailsVisibility);
    if (antragArtTechnischCheckbox) antragArtTechnischCheckbox.addEventListener('change', updateAntragArtDetailsVisibility);
    // Initial prüfen
    if (antragArtPauschaleCheckbox || antragArtTechnischCheckbox) updateAntragArtDetailsVisibility();


    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpPflegegrad", "vpTelefon",
        "antragstellerIdentischPflegeHM", "asNamePflegeHM", "asVerhaeltnisPflegeHM",
        "kasseName", "kasseAdresse",
        "lieferantPauschale", 
        "bezeichnungTechnischesHilfsmittel", "hilfsmittelnummerTechnisch", 
        "begruendungTechnischesHilfsmittel", "arztEmpfehlungTechnischesHilfsmittel",
        "anlageSonstigesPHM"
    ];
    const anlagenCheckboxName = "anlagenPflegehilfsmittel"; // Für allgemeine Anlagen
    const antragArtCheckboxName = "antragArt"; // Für die Auswahl der Antragsart

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        
        // Spezifische Checkboxen
        const asVollmachtCheckbox = document.getElementById('asVollmachtPflegeHM');
        if (asVollmachtCheckbox) data.asVollmachtPflegeHM = asVollmachtCheckbox.checked;
        
        data.antragArt = [];
        document.querySelectorAll(`input[name="${antragArtCheckboxName}"]:checked`).forEach(cb => data.antragArt.push(cb.value));

        data.anlagen = [];
        const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]:checked`);
        anlagenCheckboxes.forEach(checkbox => {
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
        
        const asVollmachtCheckbox = document.getElementById('asVollmachtPflegeHM');
        if (asVollmachtCheckbox && data.asVollmachtPflegeHM !== undefined) asVollmachtCheckbox.checked = data.asVollmachtPflegeHM;

        document.querySelectorAll(`input[name="${antragArtCheckboxName}"]`).forEach(cb => {
            cb.checked = data.antragArt && data.antragArt.includes(cb.value);
        });

        const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
        anlagenCheckboxes.forEach(checkbox => {
            checkbox.checked = data.anlagen && data.anlagen.includes(checkbox.value);
        });

        // Sichtbarkeit nach Laden aktualisieren
        if (antragstellerIdentischSelect && antragstellerDetailsDiv) updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNamePflegeHM', 'asVerhaeltnisPflegeHM']);
        if (antragArtPauschaleCheckbox || antragArtTechnischCheckbox) updateAntragArtDetailsVisibility();
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            // Validierung vor Speichern, ob mindestens eine Antragsart gewählt wurde
            if (!document.getElementById('antragArtPauschale').checked && !document.getElementById('antragArtTechnisch').checked) {
                alert("Bitte wählen Sie mindestens eine Art des Antrags auf Pflegehilfsmittel aus (Pauschale und/oder Technisches Hilfsmittel).");
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
            if (!document.getElementById('antragArtPauschale').checked && !document.getElementById('antragArtTechnisch').checked) {
                alert("Bitte wählen Sie mindestens eine Art des Antrags auf Pflegehilfsmittel aus (Pauschale und/oder Technisches Hilfsmittel).");
                return;
            }
            // Spezifische Validierung für technische Hilfsmittel, falls ausgewählt
            if (document.getElementById('antragArtTechnisch').checked) {
                if (document.getElementById('bezeichnungTechnischesHilfsmittel').value.trim() === "" ||
                    document.getElementById('begruendungTechnischesHilfsmittel').value.trim() === "") {
                    alert("Wenn Sie ein technisches Pflegehilfsmittel beantragen, füllen Sie bitte dessen Bezeichnung und Begründung aus.");
                    return;
                }
            }
            generatePflegehilfsmittelAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generatePflegehilfsmittelAntragPDF() {
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

    const antragstellerIdentischPflegeHM = document.getElementById("antragstellerIdentischPflegeHM").value;
    const asNamePflegeHM = document.getElementById("asNamePflegeHM").value;
    const asVerhaeltnisPflegeHM = document.getElementById("asVerhaeltnisPflegeHM").value;
    const asVollmachtPflegeHM = document.getElementById("asVollmachtPflegeHM") ? document.getElementById("asVollmachtPflegeHM").checked : false;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    const antragArtPauschale = document.getElementById("antragArtPauschale").checked;
    const antragArtTechnisch = document.getElementById("antragArtTechnisch").checked;
    
    const lieferantPauschale = document.getElementById("lieferantPauschale").value;
    const bezeichnungTechnischesHilfsmittel = document.getElementById("bezeichnungTechnischesHilfsmittel").value;
    const hilfsmittelnummerTechnisch = document.getElementById("hilfsmittelnummerTechnisch").value;
    const begruendungTechnischesHilfsmittel = document.getElementById("begruendungTechnischesHilfsmittel").value;
    const arztEmpfehlungTechnischesHilfsmittel = document.getElementById("arztEmpfehlungTechnischesHilfsmittel").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenPflegehilfsmittel"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtPHM" && antragstellerIdentischPflegeHM === "ja") {
            // Nicht hinzufügen
        } else {
             anlagen.push(checkbox.value);
        }
    });
    const anlageSonstigesPHM = document.getElementById("anlageSonstigesPHM").value;
    if (anlageSonstigesPHM.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesPHM); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    if (antragstellerIdentischPflegeHM === 'nein' && asNamePflegeHM.trim() !== "") {
        absenderName = asNamePflegeHM;
        // Keine separate Adresse für Antragsteller im Formular, daher vpAdresse verwenden
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line));
    if (vpTelefon.trim() !== "" && antragstellerIdentischPflegeHM === 'ja') writeLine("Tel.: " + vpTelefon);
    // Ggf. Telefon des Antragstellers, wenn vorhanden und Feld existiert. Für jetzt vpTelefon.
    if (antragstellerIdentischPflegeHM === 'nein' && asNamePflegeHM.trim() !== ""){
         writeParagraph(`(handelnd für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`, defaultLineHeight, 9, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
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
    let betreffText = `Antrag auf Kostenübernahme von Pflegehilfsmitteln gemäß § 40 SGB XI`;
    betreffText += `\nVersicherte Person: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer}`;
    if (vpPflegegrad.trim() !== "" && vpPflegegrad.trim() !== "Kein Pflegegrad / Noch nicht bekannt") {
        betreffText += `\nPflegegrad: ${vpPflegegrad}`;
    }
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    let antragsTeile = [];
    if (antragArtPauschale) antragsTeile.push("die Kostenpauschale für zum Verbrauch bestimmte Pflegehilfsmittel");
    if (antragArtTechnisch && bezeichnungTechnischesHilfsmittel.trim() !== "") antragsTeile.push(`das technische Pflegehilfsmittel "${bezeichnungTechnischesHilfsmittel}"`);
    else if (antragArtTechnisch) antragsTeile.push("ein technisches Pflegehilfsmittel (Details siehe unten)");

    if (antragsTeile.length > 0) {
        writeParagraph(`hiermit beantrage ich/beantragen wir für Herrn/Frau ${vpName} die Kostenübernahme für ${antragsTeile.join(antragsTeile.length > 1 ? ' sowie ' : '')}.`);
    } else {
         writeParagraph(`hiermit beantrage ich/beantragen wir für Herrn/Frau ${vpName} Leistungen für Pflegehilfsmittel.`); // Fallback
    }
     if (antragstellerIdentischPflegeHM === 'nein' && asNamePflegeHM.trim() !== "") {
        writeParagraph(`Ich, ${asNamePflegeHM}, stelle diesen Antrag als ${asVerhaeltnisPflegeHM || 'bevollmächtigte Person'}.`);
        if (asVollmachtPflegeHM) writeParagraph("Eine entsprechende Vollmacht liegt bei bzw. wird nachgereicht.", defaultLineHeight, 10, {fontStyle: "italic"});
    }
    
    // Details Pauschale
    if (antragArtPauschale) {
        writeLine("Antrag auf Pauschale für zum Verbrauch bestimmte Pflegehilfsmittel:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        writeParagraph("Ich/Wir beantragen die monatliche Kostenpauschale für zum Verbrauch bestimmte Pflegehilfsmittel gemäß § 40 Abs. 2 SGB XI.");
        if (lieferantPauschale.trim() !== "") {
            writeParagraph(`Bezüglich der Versorgung/des Lieferanten habe ich/haben wir folgenden Wunsch/Hinweis: ${lieferantPauschale}`);
        }
        writeParagraph("Die Pflege erfolgt im häuslichen Umfeld und es besteht ein anerkannter Pflegegrad.", defaultLineHeight, 10, {fontStyle:"italic"});
    }

    // Details Technisches Hilfsmittel
    if (antragArtTechnisch) {
        if (antragArtPauschale && y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight; // Zusätzlicher Abstand, wenn beide beantragt
        else if (antragArtPauschale) {doc.addPage(); y = margin;}


        writeLine("Antrag auf ein technisches Pflegehilfsmittel:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        if (bezeichnungTechnischesHilfsmittel.trim() !== "") {
            writeParagraph(`Bezeichnung des Hilfsmittels: ${bezeichnungTechnischesHilfsmittel}`);
            if (hilfsmittelnummerTechnisch.trim() !== "") writeParagraph(`Hilfsmittelpositionsnummer (falls bekannt): ${hilfsmittelnummerTechnisch}`);
            writeParagraph(`Begründung der Notwendigkeit:\n${begruendungTechnischesHilfsmittel}`);
            if (arztEmpfehlungTechnischesHilfsmittel.trim() !== "") {
                writeParagraph(`Ärztliche Empfehlung/Verordnung hierzu:\n${arztEmpfehlungTechnischesHilfsmittel}`);
            } else {
                writeParagraph("Eine ärztliche Stellungnahme oder Empfehlung zur Notwendigkeit dieses spezifischen technischen Hilfsmittels liegt bei oder wird nachgereicht.", defaultLineHeight, 10, {fontStyle: "italic"});
            }
        } else {
            writeParagraph("Es wurde kein spezifisches technisches Hilfsmittel im Formular benannt. Bitte reichen Sie die Details und Begründungen nach.", defaultLineHeight, 11, {fontStyle: "bold"});
        }
    }
    
    // Anlagen
    if (anlagen.length > 0) {
        writeLine("Beigefügte Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    // Abschluss
    writeParagraph("Ich/Wir bitten um eine wohlwollende Prüfung und zeitnahe Genehmigung der beantragten Pflegehilfsmittel.", defaultLineHeight, 11);
    writeParagraph("Für Rückfragen stehe ich/stehen wir Ihnen gerne zur Verfügung.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("antrag_pflegehilfsmittel.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupPflegeHM");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}