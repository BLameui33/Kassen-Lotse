document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('kurzzeitpflegeAntragForm');
    const saveBtn = document.getElementById('saveBtnKurzzeitpflege');
    const loadBtn = document.getElementById('loadBtnKurzzeitpflege');
    const closePopupBtn = document.getElementById('closePopupBtnKurzzeitpflege');
    const spendenPopup = document.getElementById('spendenPopupKurzzeitpflege');
    const storageKey = 'kurzzeitpflegeAntragFormData';

    // --- Steuerung der dynamischen Felder ---
    const antragstellerIdentischSelect = document.getElementById('antragstellerIdentischKZP');
    const antragstellerDetailsDiv = document.getElementById('antragstellerDetailsKZP');
    const anlageVollmachtCheckboxAntrag = document.getElementById('asVollmachtKZP');

    const grundKurzzeitpflegeSelect = document.getElementById('grundKurzzeitpflege');
    const grundKurzzeitpflegeSonstigesDetailsDiv = document.getElementById('grundKurzzeitpflegeSonstigesDetails');
    const grundKurzzeitpflegeSonstigesTextarea = document.getElementById('grundKurzzeitpflegeSonstigesText');

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
             updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameKZP', 'asAdresseKZP', 'asVerhaeltnisKZP'], anlageVollmachtCheckboxAntrag);
        });
        updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameKZP', 'asAdresseKZP', 'asVerhaeltnisKZP'], anlageVollmachtCheckboxAntrag);
    }
    
    if (grundKurzzeitpflegeSelect && grundKurzzeitpflegeSonstigesDetailsDiv) {
        grundKurzzeitpflegeSelect.addEventListener('change', () => {
            const showSonstiges = grundKurzzeitpflegeSelect.value === 'Sonstiger Grund';
            grundKurzzeitpflegeSonstigesDetailsDiv.style.display = showSonstiges ? 'block' : 'none';
            grundKurzzeitpflegeSonstigesDetailsDiv.classList.toggle('sub-details-active', showSonstiges);
            grundKurzzeitpflegeSonstigesTextarea.required = showSonstiges;
        });
        updateDynamicFieldVisibility(grundKurzzeitpflegeSelect, grundKurzzeitpflegeSonstigesDetailsDiv, 'Sonstiger Grund', ['grundKurzzeitpflegeSonstigesText']);
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpPflegegrad", "vpTelefon",
        "antragstellerIdentischKZP", "asNameKZP", "asAdresseKZP", "asVerhaeltnisKZP",
        "kasseName", "kasseAdresse",
        "grundKurzzeitpflege", "grundKurzzeitpflegeSonstigesText", "kurzbeschreibungSituationKZP",
        "einrichtungNameKZP", "einrichtungAdresseKZP", "zeitraumKurzzeitpflegeVon", "zeitraumKurzzeitpflegeBis",
        "anlageSonstigesKZP"
    ];
    const checkboxIdsToSave = [ 
        "asVollmachtKZP", "platzReserviertKZP", "kombiVerhinderungspflegeKZP"
    ];
    const anlagenCheckboxName = "anlagenKurzzeitpflege";

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
        checkboxIdsToSave.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.checked = data[id];
            }
        });
        document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`).forEach(checkbox => {
            checkbox.checked = data.anlagen && data.anlagen.includes(checkbox.value);
        });

        if (antragstellerIdentischSelect) updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameKZP', 'asAdresseKZP', 'asVerhaeltnisKZP'], anlageVollmachtCheckboxAntrag);
        if (grundKurzzeitpflegeSelect) updateDynamicFieldVisibility(grundKurzzeitpflegeSelect, grundKurzzeitpflegeSonstigesDetailsDiv, 'Sonstiger Grund', ['grundKurzzeitpflegeSonstigesText']);
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
            generateKurzzeitpflegeAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateKurzzeitpflegeAntragPDF() {
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
    const vpPflegegrad = document.getElementById("vpPflegegrad").value;
    const vpTelefon = document.getElementById("vpTelefon").value;

    const antragstellerIdentischKZP = document.getElementById("antragstellerIdentischKZP").value;
    const asNameKZP = document.getElementById("asNameKZP").value;
    const asAdresseKZP = document.getElementById("asAdresseKZP").value;
    const asVerhaeltnisKZP = document.getElementById("asVerhaeltnisKZP").value;
    const asVollmachtKZP = document.getElementById("asVollmachtKZP") ? document.getElementById("asVollmachtKZP").checked : false;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    let grundKurzzeitpflege = document.getElementById("grundKurzzeitpflege").value;
    if (grundKurzzeitpflege === "Sonstiger Grund") {
        grundKurzzeitpflege = document.getElementById("grundKurzzeitpflegeSonstigesText").value || "Sonstiger Grund (nicht näher spezifiziert)";
    }
    const kurzbeschreibungSituationKZP = document.getElementById("kurzbeschreibungSituationKZP").value;

    const einrichtungNameKZP = document.getElementById("einrichtungNameKZP").value;
    const einrichtungAdresseKZP = document.getElementById("einrichtungAdresseKZP").value;
    const zeitraumKurzzeitpflegeVonInput = document.getElementById("zeitraumKurzzeitpflegeVon").value;
    const zeitraumKurzzeitpflegeVon = zeitraumKurzzeitpflegeVonInput ? new Date(zeitraumKurzzeitpflegeVonInput).toLocaleDateString("de-DE") : 'N/A';
    const zeitraumKurzzeitpflegeBisInput = document.getElementById("zeitraumKurzzeitpflegeBis").value;
    const zeitraumKurzzeitpflegeBis = zeitraumKurzzeitpflegeBisInput ? new Date(zeitraumKurzzeitpflegeBisInput).toLocaleDateString("de-DE") : 'N/A';
    const platzReserviertKZP = document.getElementById("platzReserviertKZP").checked;
    
    const kombiVerhinderungspflegeKZP = document.getElementById("kombiVerhinderungspflegeKZP").checked;

    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenKurzzeitpflege"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtKZP" && antragstellerIdentischKZP === "ja") {} 
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesKZP = document.getElementById("anlageSonstigesKZP").value;
    if (anlageSonstigesKZP.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesKZP); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender-Logik (Verfasser/Vertreter oder Versicherter) ermitteln
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    let absenderTelefon = vpTelefon;
    let infoText = "";

    if (antragstellerIdentischKZP === 'nein' && asNameKZP.trim() !== "") {
        absenderName = asNameKZP;
        absenderAdresse = asAdresseKZP;
        infoText = `(handelnd als ${asVerhaeltnisKZP || 'Vertreter/in'} für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`;
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

    // Zusatz-Info rechts drunter setzen, falls ein abweichender Antragsteller aktiv ist
    if (infoText !== "") {
        rightY += 2; // Kleiner Abstand nach Telefon/Adresse
        doc.setFont(undefined, "italic");
        doc.setFontSize(9);
        
        // Bricht den Text automatisch um, falls er für die rechte Spalte (60mm) zu lang wird
        let infoLines = doc.splitTextToSize(infoText, 60);
        infoLines.forEach(line => {
            doc.text(line, rightColumnX, rightY);
            rightY += 4; // Kompakter Zeilenabstand für den Info-Text
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
    
    // Die feine Trennlinie unter dem Mini-Absender
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
    
    // Kollisionsschutz: Berücksichtigt, wie weit der Info-Text oder die Adresse nach unten reicht
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Text
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

    // Betreff
    let betreffText = `Antrag auf Leistungen der Kurzzeitpflege gemäß § 42 SGB XI`;
    betreffText += `\nFür: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer} (${vpPflegegrad})`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    if (antragstellerIdentischKZP === 'nein' && asNameKZP.trim() !== "") {
        writeParagraph(`hiermit beantrage ich, ${asNameKZP}, als ${asVerhaeltnisKZP || 'bevollmächtigte Person'}, für ${vpName}, die Kostenübernahme für Kurzzeitpflege.`);
        if(asVollmachtKZP) writeParagraph("Eine entsprechende Vollmacht liegt diesem Antrag bei.", defaultLineHeight, 10, {fontStyle: "italic"});
    } else {
        writeParagraph(`hiermit beantrage ich, ${vpName}, die Kostenübernahme für Kurzzeitpflege.`);
    }
    
    // Grund und Situation
    writeLine("1. Grund für die Beantragung der Kurzzeitpflege:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Die Kurzzeitpflege wird notwendig aufgrund von: ${grundKurzzeitpflege}.`);
    if (kurzbeschreibungSituationKZP.trim() !== "") {
        writeParagraph(`Zur aktuellen Situation: ${kurzbeschreibungSituationKZP}`);
    }

    // Angaben zur Einrichtung und Zeitraum
    writeLine("2. Angaben zur geplanten Kurzzeitpflege:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Die Kurzzeitpflege soll in folgender Einrichtung stattfinden:\n${einrichtungNameKZP || '[Name der Einrichtung]'}\n${einrichtungAdresseKZP.replace(/\n/g, ', ') || '[Adresse der Einrichtung]'}`);
    writeParagraph(`Geplanter Zeitraum: vom ${zeitraumKurzzeitpflegeVon} bis zum ${zeitraumKurzzeitpflegeBis}.`);
    if (platzReserviertKZP) {
        writeParagraph("Ein Platz in der genannten Einrichtung ist für diesen Zeitraum bereits reserviert/zugesagt.", defaultLineHeight, 10, {fontStyle: "italic"});
    }

    // Kombination mit Verhinderungspflege (PUEG Update)
    if (kombiVerhinderungspflegeKZP) {
        writeLine("3. Gemeinsamer Jahresbetrag / Budgeterhöhung:", defaultLineHeight, true);
        y += spaceAfterParagraph/2;
        writeParagraph("Ich beantrage hiermit die Inanspruchnahme des Gemeinsamen Jahresbetrags für Verhinderungs- und Kurzzeitpflege (§ 42a SGB XI) bis zu 3.539 Euro. Sofern dieser für mich (z.B. aufgrund des Stichtags) noch nicht anwendbar ist, beantrage ich hiermit die Übertragung von 100% der ungenutzten Mittel der Verhinderungspflege (§ 39 SGB XI) auf die Kurzzeitpflege, um den Leistungsbetrag maximal zu erhöhen.");
    }
    
    // Pflegegeld
    writeParagraph("Mir ist bekannt, dass während der Inanspruchnahme der Kurzzeitpflege die Hälfte des bisher bezogenen Pflegegeldes für bis zu acht Wochen im Kalenderjahr weitergezahlt wird.", defaultLineHeight, 10, {fontStyle:"italic", extraSpacingAfter: defaultLineHeight});

    // Anlagen
    if (anlagen.length > 0) {
        writeLine(`${kombiVerhinderungspflegeKZP ? '4.' : '3.'} Beigefügte Anlagen:`, defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    // Abschluss
    let abschlussAbschnittNummer = kombiVerhinderungspflegeKZP ? 5 : 4;
    if (anlagen.length === 0) abschlussAbschnittNummer -=1;

    writeLine(`${abschlussAbschnittNummer}. Bitte um Bestätigung und Information`, defaultLineHeight, true);
    y += spaceAfterParagraph / 2;
    writeParagraph("Ich bitte um eine baldige Prüfung dieses Antrags und um eine schriftliche Zusage der Kostenübernahme für die pflegebedingten Aufwendungen, die soziale Betreuung und die Leistungen der medizinischen Behandlungspflege im Rahmen der Kurzzeitpflege.", defaultLineHeight, 11);
    writeParagraph("Bitte teilen Sie mir auch mit, welche weiteren Unterlagen Sie gegebenenfalls benötigen.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("antrag_kurzzeitpflege.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupKurzzeitpflege");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}