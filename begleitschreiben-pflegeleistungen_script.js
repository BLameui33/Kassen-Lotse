document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('pflegeBegleitschreibenForm');
    const saveBtn = document.getElementById('saveBtnPflegeBS');
    const loadBtn = document.getElementById('loadBtnPflegeBS');
    const closePopupBtn = document.getElementById('closePopupBtnPflegeBS');
    const spendenPopup = document.getElementById('spendenPopupPflegeBS');
    const storageKey = 'pflegeBegleitschreibenFormData';

    // --- Steuerung der dynamischen Antragsteller-Felder (für Begleitschreiben) ---
    const antragstellerIdentischSelectBS = document.getElementById('antragstellerIdentischBS');
    const antragstellerDetailsDivBS = document.getElementById('antragstellerDetailsBS');
    const anlageVollmachtBSCheckbox = document.getElementById('anlageVollmachtBS');


    function updateAntragstellerDetailsVisibilityBS() {
        if (antragstellerIdentischSelectBS.value === 'nein') {
            antragstellerDetailsDivBS.style.display = 'block';
            // Setze required Attribute, falls diese Felder im Begleitschreiben zwingend sind
            document.getElementById('asNameBS').required = true;
            document.getElementById('asVerhaeltnisBS').required = true;
            if (anlageVollmachtBSCheckbox) anlageVollmachtBSCheckbox.required = true; // Vollmacht ist dann wichtig

        } else {
            antragstellerDetailsDivBS.style.display = 'none';
            document.getElementById('asNameBS').required = false;
            document.getElementById('asVerhaeltnisBS').required = false;
            if (anlageVollmachtBSCheckbox) anlageVollmachtBSCheckbox.required = false;

        }
    }
    if (antragstellerIdentischSelectBS) {
        antragstellerIdentischSelectBS.addEventListener('change', updateAntragstellerDetailsVisibilityBS);
        updateAntragstellerDetailsVisibilityBS(); // Initial prüfen
    }


    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "vpName", "vpGeburt", "vpAdresse", "vpNummer",
        "antragstellerIdentischBS", "asNameBS", "asVerhaeltnisBS",
        "kasseName", "kasseAdresse",
        "datumHauptantragPflege", "kurzeAnmerkungBegleitschreiben",
        "anlageSonstigesBegleitschreibenPflege"
    ];
    const anlagenCheckboxName = "anlagenBegleitschreibenPflege";

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
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
        const anlagenCheckboxes = document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`);
        anlagenCheckboxes.forEach(checkbox => {
            if (data.anlagen && data.anlagen.includes(checkbox.value)) {
                checkbox.checked = true;
            } else if (checkbox) {
                checkbox.checked = false;
            }
        });
        if (antragstellerIdentischSelectBS) updateAntragstellerDetailsVisibilityBS();
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
            generatePflegeBegleitschreibenPDF();
        });
    }
}); // Ende DOMContentLoaded

function generatePflegeBegleitschreibenPDF() {
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

    const antragstellerIdentischBS = document.getElementById("antragstellerIdentischBS").value;
    const asNameBS = document.getElementById("asNameBS").value;
    const asVerhaeltnisBS = document.getElementById("asVerhaeltnisBS").value;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    const datumHauptantragPflegeInput = document.getElementById("datumHauptantragPflege").value;
    const datumHauptantragPflege = datumHauptantragPflegeInput ? new Date(datumHauptantragPflegeInput).toLocaleDateString("de-DE") : 'UNBEKANNT (BITTE NACHTRAGEN!)';
    const kurzeAnmerkungBegleitschreiben = document.getElementById("kurzeAnmerkungBegleitschreiben").value;
    
    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenBegleitschreibenPflege"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        anlagen.push(checkbox.value);
    });
    const anlageSonstigesBegleitschreibenPflege = document.getElementById("anlageSonstigesBegleitschreibenPflege").value;
    if (anlageSonstigesBegleitschreibenPflege.trim() !== "") {
        anlagen.push("Sonstige Anlagen: " + anlageSonstigesBegleitschreibenPflege);
    }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    if (antragstellerIdentischBS === 'nein' && asNameBS.trim() !== "") {
        absenderName = asNameBS;
        // Für das Begleitschreiben ist die Adresse des Verfassers ggf. nicht zwingend, 
        // wenn die der versicherten Person schon genannt wird. Hier als Option:
        // absenderAdresse = document.getElementById("asAdresseBS").value; // Falls es ein Adressfeld für den BS-Verfasser gäbe
    }
    writeLine(absenderName);
    absenderAdresse.split("\n").forEach(line => writeLine(line));
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
    let betreffText = `Begleitschreiben zum Antrag auf Leistungen der Pflegeversicherung für ${vpName}, geb. ${vpGeburtFormatiert}`;
    betreffText += `\nVersichertennummer: ${vpNummer}`;
    betreffText += `\nUnser/Mein Antrag vom ${datumHauptantragPflege}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`anbei übersende ich Ihnen den Antrag auf Leistungen der Pflegeversicherung vom ${datumHauptantragPflege} für Herrn/Frau ${vpName}.`);
    if (antragstellerIdentischBS === 'nein' && asNameBS.trim() !== "") {
        writeParagraph(`Ich, ${asNameBS}, stelle diesen Antrag in meiner Eigenschaft als ${asVerhaeltnisBS || 'bevollmächtigte Person'} für Herrn/Frau ${vpName}.`);
    }

    // Persönliche Anmerkung
    if (kurzeAnmerkungBegleitschreiben.trim() !== "") {
        writeLine("Zu unserer/meiner Situation möchte ich ergänzend Folgendes anmerken:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        writeParagraph(kurzeAnmerkungBegleitschreiben);
    } else {
        writeParagraph("Alle relevanten Informationen und medizinischen Gründe entnehmen Sie bitte dem beigefügten Hauptantrag sowie den ärztlichen Unterlagen.", defaultLineHeight, 11, {fontStyle: "italic"});
    }
    
    // Anlagen
    if (anlagen.length > 0) {
        writeLine("Dem Antrag sind folgende Unterlagen beigefügt:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    } else {
        writeParagraph("Dem Hauptantrag sind alle erforderlichen Unterlagen beigefügt.", defaultLineHeight, 11, {fontStyle: "italic"});
    }
    
    // Abschluss
    writeParagraph("Ich/Wir bitten um eine wohlwollende Prüfung und zeitnahe Bearbeitung des Antrags sowie um baldige Vereinbarung eines Termins für die notwendige Begutachtung durch den Medizinischen Dienst.", defaultLineHeight, 11);
    writeParagraph("Für Rückfragen stehen wir Ihnen gerne zur Verfügung.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName); // Name des Verfassers des Begleitschreibens


    doc.save("begleitschreiben_antrag_pflegeleistungen.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupPflegeBS");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}