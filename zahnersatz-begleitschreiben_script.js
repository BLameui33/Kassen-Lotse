document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('zahnersatzBegleitschreibenForm');
    const saveBtn = document.getElementById('saveBtnZahnersatzBS');
    const loadBtn = document.getElementById('loadBtnZahnersatzBS');
    const closePopupBtn = document.getElementById('closePopupBtnZahnersatzBS');
    const spendenPopup = document.getElementById('spendenPopupZahnersatzBS');
    const storageKey = 'zahnersatzBegleitschreibenFormData';

    // --- Steuerung der dynamischen Felder ---
    const verfasserIdentischSelect = document.getElementById('verfasserIdentischZE');
    const verfasserDetailsDiv = document.getElementById('verfasserDetailsZE');
    const haertefallAntragCheckbox = document.getElementById('haertefallAntrag');
    const haertefallDetailsDiv = document.getElementById('haertefallDetailsZE');
    const anlageHaertefallNachweiseCheckbox = document.getElementById('anlageHaertefallNachweise'); // Für die Anlage-Checkbox
    const anlageVollmachtZECheckbox = document.getElementById('anlageVollmachtZE');


    function updateDynamicFieldVisibility(selectElement, detailsDiv, showValue = 'nein', requiredFieldsIds = []) {
        const isVisible = selectElement.value === showValue;
        detailsDiv.style.display = isVisible ? 'block' : 'none';
        requiredFieldsIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.required = isVisible;
        });
    }
    
    function updateHaertefallDetailsVisibility() {
        const isChecked = haertefallAntragCheckbox.checked;
        haertefallDetailsDiv.style.display = isChecked ? 'block' : 'none';
        document.getElementById('begruendungHaertefallHkp').required = isChecked;
        if(anlageHaertefallNachweiseCheckbox) anlageHaertefallNachweiseCheckbox.checked = isChecked; // Optional: Checkbox für Anlagen automatisch an-/abhaken
    }

    if (verfasserIdentischSelect && verfasserDetailsDiv) {
        verfasserIdentischSelect.addEventListener('change', () => updateDynamicFieldVisibility(verfasserIdentischSelect, verfasserDetailsDiv, 'nein', ['verfasserNameZE', 'verfasserVerhaeltnisZE']));
        updateDynamicFieldVisibility(verfasserIdentischSelect, verfasserDetailsDiv, 'nein', ['verfasserNameZE', 'verfasserVerhaeltnisZE']);
    }
    if (haertefallAntragCheckbox && haertefallDetailsDiv) {
        haertefallAntragCheckbox.addEventListener('change', updateHaertefallDetailsVisibility);
        updateHaertefallDetailsVisibility(); 
    }


    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpTelefon",
        "verfasserIdentischZE", "verfasserNameZE", "verfasserVerhaeltnisZE",
        "kasseName", "kasseAdresse",
        "datumHkp", "zahnarztNameHkp", "kurzbeschreibungBehandlungHkp",
        "begruendungHaertefallHkp", "persoenlicheAnmerkungZahnersatz",
        "anlageSonstigesZahnersatz"
    ];
    const anlagenCheckboxName = "anlagenZahnersatz";

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        // Checkboxen separat behandeln
        data.haertefallAntrag = document.getElementById("haertefallAntrag").checked;
        
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
        // Checkboxen separat
        const haertefallCheckbox = document.getElementById("haertefallAntrag");
        if (haertefallCheckbox && data.haertefallAntrag !== undefined) {
            haertefallCheckbox.checked = data.haertefallAntrag;
        }

        const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
        anlagenCheckboxes.forEach(checkbox => {
            if (data.anlagen && data.anlagen.includes(checkbox.value)) {
                checkbox.checked = true;
            } else if (checkbox) {
                checkbox.checked = false;
            }
        });
        // Sichtbarkeit nach Laden aktualisieren
        if (verfasserIdentischSelect && verfasserDetailsDiv) updateDynamicFieldVisibility(verfasserIdentischSelect, verfasserDetailsDiv, 'nein', ['verfasserNameZE', 'verfasserVerhaeltnisZE']);
        if (haertefallAntragCheckbox && haertefallDetailsDiv) updateHaertefallDetailsVisibility();
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
            generateZahnersatzBegleitschreibenPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateZahnersatzBegleitschreibenPDF() {
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
    const vpTelefon = document.getElementById("vpTelefon").value;

    const verfasserIdentischZE = document.getElementById("verfasserIdentischZE").value;
    const verfasserNameZE = document.getElementById("verfasserNameZE").value;
    const verfasserVerhaeltnisZE = document.getElementById("verfasserVerhaeltnisZE").value;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    const datumHkpInput = document.getElementById("datumHkp").value;
    const datumHkp = datumHkpInput ? new Date(datumHkpInput).toLocaleDateString("de-DE") : 'N/A';
    const zahnarztNameHkp = document.getElementById("zahnarztNameHkp").value;
    const kurzbeschreibungBehandlungHkp = document.getElementById("kurzbeschreibungBehandlungHkp").value;
    
    const haertefallAntrag = document.getElementById("haertefallAntrag").checked;
    const begruendungHaertefallHkp = document.getElementById("begruendungHaertefallHkp").value;
    const persoenlicheAnmerkungZahnersatz = document.getElementById("persoenlicheAnmerkungZahnersatz").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenZahnersatz"]:checked');
    anlagenCheckboxes.forEach(checkbox => { anlagen.push(checkbox.value); });
    const anlageSonstigesZahnersatz = document.getElementById("anlageSonstigesZahnersatz").value;
    if (anlageSonstigesZahnersatz.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesZahnersatz); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    let absenderTelefon = vpTelefon;
    if (verfasserIdentischZE === 'nein' && verfasserNameZE.trim() !== "") {
        absenderName = verfasserNameZE;
        // Adresse des Verfassers hier nicht vorgesehen, Hauptadresse bleibt vpAdresse
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line));
    if (absenderTelefon.trim() !== "") writeLine("Tel.: " + absenderTelefon);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger
    writeLine(kasseName);
    kasseAdresse.split("\n").forEach(line => writeLine(line));
    if (y + defaultLineHeight * 2 <= usableHeight) y += defaultLineHeight * 2; else {doc.addPage(); y = margin;}

    // Datum rechtsbündig
    const datumHeute = new Date().toLocaleDateString("de-DE");
    doc.setFontSize(11);
    const datumsBreite = doc.getStringUnitWidth(datumHeute) * 11 / doc.internal.scaleFactor;
    if (y + defaultLineHeight > usableHeight) { doc.addPage(); y = margin; }
    doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
    y += defaultLineHeight * 2; 

    // Betreff
    let betreffText = `Einreichung Heil- und Kostenplan für Zahnersatz`;
    betreffText += `\nVersicherte Person: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer}`;
    betreffText += `\nHeil- und Kostenplan vom ${datumHkp}, ausgestellt von ${zahnarztNameHkp || 'Ihrem Zahnarzt/Ihrer Zahnärztin'}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`anbei übersende ich Ihnen den Heil- und Kostenplan vom ${datumHkp}, ausgestellt von ${zahnarztNameHkp || 'meinem Zahnarzt/meiner Zahnärztin'}, für die bei mir, ${vpName}, geplante Zahnersatzbehandlung.`);
    if (verfasserIdentischZE === 'nein' && verfasserNameZE.trim() !== "") {
        writeParagraph(`Dieses Schreiben verfasse ich als ${verfasserVerhaeltnisZE || 'bevollmächtigte Person'}.`, defaultLineHeight, 10, {fontStyle:"italic"});
    }
    if (kurzbeschreibungBehandlungHkp.trim() !== "") {
         writeParagraph(`Die geplante Behandlung umfasst im Wesentlichen: ${kurzbeschreibungBehandlungHkp}.`);
    }
    
    // Antrag auf Härtefallregelung
    if (haertefallAntrag) {
        writeLine("Antrag auf Anwendung der Härtefallregelung (§ 55 Abs. 2 SGB V):", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        let haertefallText = "Ich beantrage hiermit ausdrücklich die Anwendung der Härtefallregelung zur Gewährung des doppelten Festzuschusses.";
        if (begruendungHaertefallHkp.trim() !== "") {
            haertefallText += ` ${begruendungHaertefallHkp}`;
        } else {
            haertefallText += " Die entsprechenden Nachweise zu meiner Einkommenssituation liegen diesem Schreiben bei bzw. werden umgehend nachgereicht.";
        }
        writeParagraph(haertefallText);
    }

    // Persönliche Anmerkung
    if (persoenlicheAnmerkungZahnersatz.trim() !== "") {
        writeLine("Persönliche Anmerkungen:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        writeParagraph(persoenlicheAnmerkungZahnersatz);
    }
    
    // Anlagen
    if (anlagen.length > 0) {
        writeLine("Beigefügte Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    } else {
        writeParagraph("Dem Heil- und Kostenplan sind alle erforderlichen Unterlagen beigefügt.", defaultLineHeight, 11, {fontStyle: "italic"});
    }
    
    // Abschluss
    writeParagraph("Ich bitte um Prüfung des Heil- und Kostenplans, Genehmigung des entsprechenden Festzuschusses und um eine baldige schriftliche Mitteilung.", defaultLineHeight, 11);
    if (haertefallAntrag) {
        writeParagraph("Insbesondere bitte ich um Prüfung und positive Bescheidung meines Antrags auf Anwendung der Härtefallregelung.", defaultLineHeight, 11);
    }
    writeParagraph("Für Rückfragen stehe ich Ihnen gerne zur Verfügung.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);


    doc.save("begleitschreiben_zahnersatz_hkp.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupZahnersatzBS");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}