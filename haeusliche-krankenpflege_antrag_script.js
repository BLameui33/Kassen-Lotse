document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('hkpAntragForm');
    const saveBtn = document.getElementById('saveBtnHkpAntrag');
    const loadBtn = document.getElementById('loadBtnHkpAntrag');
    const closePopupBtn = document.getElementById('closePopupBtnHkpAntrag');
    const spendenPopup = document.getElementById('spendenPopupHkpAntrag');
    const storageKey = 'hkpAntragFormData';

    // --- Steuerung der dynamischen Felder ---
    const verfasserIdentischSelect = document.getElementById('verfasserIdentischHkp');
    const verfasserDetailsDiv = document.getElementById('verfasserDetailsHkp');
    const pflegedienstBekanntSelect = document.getElementById('pflegedienstBekanntHkp');
    const pflegedienstDetailsDiv = document.getElementById('pflegedienstDetailsHkp');

    function updateDynamicFieldVisibility(selectElement, detailsDiv, showValue = 'nein', requiredFieldsIds = []) {
        if (selectElement.value === showValue) {
            detailsDiv.style.display = 'block';
            requiredFieldsIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.required = true;
            });
        } else {
            detailsDiv.style.display = 'none';
            requiredFieldsIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.required = false;
            });
        }
    }

    if (verfasserIdentischSelect) {
        verfasserIdentischSelect.addEventListener('change', () => updateDynamicFieldVisibility(verfasserIdentischSelect, verfasserDetailsDiv, 'nein', ['verfasserNameHkp', 'verfasserVerhaeltnisHkp']));
        updateDynamicFieldVisibility(verfasserIdentischSelect, verfasserDetailsDiv, 'nein', ['verfasserNameHkp', 'verfasserVerhaeltnisHkp']);
    }
    if (pflegedienstBekanntSelect) {
        pflegedienstBekanntSelect.addEventListener('change', () => updateDynamicFieldVisibility(pflegedienstBekanntSelect, pflegedienstDetailsDiv, 'ja', ['pflegedienstNameHkp']));
        updateDynamicFieldVisibility(pflegedienstBekanntSelect, pflegedienstDetailsDiv, 'ja', ['pflegedienstNameHkp']);
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpTelefon",
        "verfasserIdentischHkp", "verfasserNameHkp", "verfasserVerhaeltnisHkp",
        "kasseName", "kasseAdresse",
        "datumVerordnungHkp", "arztNameHkp", "behandlungsartHkp", "zeitraumVerordnungHkp",
        "pflegedienstBekanntHkp", "pflegedienstNameHkp", "pflegedienstAnschriftHkp", "pflegedienstVersorgtAbHkp",
        "persoenlicheAnmerkungHkp", "anlageSonstigesHkp"
    ];
    const anlagenCheckboxName = "anlagenHkp";

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
        // Sichtbarkeit nach Laden aktualisieren
        if (verfasserIdentischSelect) updateDynamicFieldVisibility(verfasserIdentischSelect, verfasserDetailsDiv, 'nein', ['verfasserNameHkp', 'verfasserVerhaeltnisHkp']);
        if (pflegedienstBekanntSelect) updateDynamicFieldVisibility(pflegedienstBekanntSelect, pflegedienstDetailsDiv, 'ja', ['pflegedienstNameHkp']);
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
            generateHkpBegleitschreibenPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateHkpBegleitschreibenPDF() {
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

    const verfasserIdentischHkp = document.getElementById("verfasserIdentischHkp").value;
    const verfasserNameHkp = document.getElementById("verfasserNameHkp").value;
    const verfasserVerhaeltnisHkp = document.getElementById("verfasserVerhaeltnisHkp").value;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    const datumVerordnungHkpInput = document.getElementById("datumVerordnungHkp").value;
    const datumVerordnungHkp = datumVerordnungHkpInput ? new Date(datumVerordnungHkpInput).toLocaleDateString("de-DE") : 'N/A';
    const arztNameHkp = document.getElementById("arztNameHkp").value;
    const behandlungsartHkp = document.getElementById("behandlungsartHkp").value;
    const zeitraumVerordnungHkp = document.getElementById("zeitraumVerordnungHkp").value;

    const pflegedienstBekanntHkp = document.getElementById("pflegedienstBekanntHkp").value;
    const pflegedienstNameHkp = document.getElementById("pflegedienstNameHkp").value;
    const pflegedienstAnschriftHkp = document.getElementById("pflegedienstAnschriftHkp").value;
    const pflegedienstVersorgtAbHkpInput = document.getElementById("pflegedienstVersorgtAbHkp").value;
    const pflegedienstVersorgtAbHkp = pflegedienstVersorgtAbHkpInput ? new Date(pflegedienstVersorgtAbHkpInput).toLocaleDateString("de-DE") : '';

    const persoenlicheAnmerkungHkp = document.getElementById("persoenlicheAnmerkungHkp").value;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenHkp"]:checked');
    anlagenCheckboxes.forEach(checkbox => { anlagen.push(checkbox.value); });
    const anlageSonstigesHkp = document.getElementById("anlageSonstigesHkp").value;
    if (anlageSonstigesHkp.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesHkp); }

    // --- PDF-Inhalt erstellen ---
   doc.setFontSize(11);

    // Absender (Verfasser oder Versicherter) ermitteln
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    let absenderTelefon = vpTelefon;
    if (verfasserIdentischHkp === 'nein' && verfasserNameHkp.trim() !== "") {
        absenderName = verfasserNameHkp;
    }

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

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger
    let leftY = margin + 15; 
    
    // Inline-Rücksendezeile generieren
    const cleanAddressInline = absenderAdresse.replace(/\r?\n/g, " · ");
    const ruecksendeZeile = `${absenderName} · ${cleanAddressInline}`;
    
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120); // Dezentes Grau
    doc.text(ruecksendeZeile, margin, leftY);
    
    
    doc.setDrawColor(180, 180, 180); 
    doc.setLineWidth(0.2);
    doc.line(margin, leftY + 1.5, margin + 85, leftY + 1.5); 
    
    // Empfänger (Krankenkasse) platzieren
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
    
    // Dynamischer Kollisionsschutz
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Text
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

    // Betreff
    let betreffText = `Antrag auf Leistungen der häuslichen Krankenpflege gemäß § 37 SGB V`;
    betreffText += `\nfür: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer}`;
    betreffText += `\nBeiliegend: Ärztliche Verordnung vom ${datumVerordnungHkp}`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`hiermit reiche ich die ärztliche Verordnung für häusliche Krankenpflege vom ${datumVerordnungHkp}, ausgestellt von Dr. ${arztNameHkp}, für ${vpName} (Versichertennummer: ${vpNummer}) ein und beantrage die Kostenübernahme für die verordneten Maßnahmen.`);
    if (verfasserIdentischHkp === 'nein' && verfasserNameHkp.trim() !== "") {
        writeParagraph(`Dieses Schreiben verfasse ich als ${verfasserVerhaeltnisHkp || 'bevollmächtigte Person'} für ${vpName}.`, defaultLineHeight, 10, {fontStyle:"italic"});
    }
    
    // Details zur Verordnung
    writeLine("Details der Verordnung:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Die verordnete häusliche Krankenpflege umfasst im Wesentlichen: ${behandlungsartHkp}.`);
    writeParagraph(`Der verordnete Zeitraum ist: ${zeitraumVerordnungHkp}.`);

    // Pflegedienst
    if (pflegedienstBekanntHkp === 'ja' && pflegedienstNameHkp.trim() !== "") {
        writeLine("Durchführender Pflegedienst:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        writeParagraph(`Die Versorgung soll durch folgenden Pflegedienst erfolgen:\n${pflegedienstNameHkp}`);
        if (pflegedienstAnschriftHkp.trim() !== "") {
            writeParagraph(pflegedienstAnschriftHkp.replace(/\n/g, ', '));
        }
        if (pflegedienstVersorgtAbHkp.trim() !== "") {
            writeParagraph(`Die Versorgung durch diesen Dienst ist geplant ab: ${pflegedienstVersorgtAbHkp}.`);
        }
    } else if (pflegedienstBekanntHkp === 'nein') {
        writeParagraph("Ich bitte um Mitteilung von Vertragspartnern Ihrer Krankenkasse, die die verordnete häusliche Krankenpflege in meinem Bereich durchführen können, oder um Bestätigung, dass ich einen geeigneten, zugelassenen Dienst selbst wählen können.");
    }

    // Persönliche Anmerkung
    if (persoenlicheAnmerkungHkp.trim() !== "") {
        writeLine("Persönliche Anmerkung:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        writeParagraph(persoenlicheAnmerkungHkp);
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
    writeParagraph("Ich bitte um eine zeitnahe Prüfung und Genehmigung der verordneten häuslichen Krankenpflege und um eine baldige schriftliche Bestätigung.", defaultLineHeight, 11);
    writeParagraph("Für Rückfragen stehe ich Ihnen gerne zur Verfügung.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);


    doc.save("begleitschreiben_haeusliche_krankenpflege.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupHkpAntrag");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}