document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('haushaltshilfeAntragForm');
    const saveBtn = document.getElementById('saveBtnHaushaltshilfe');
    const loadBtn = document.getElementById('loadBtnHaushaltshilfe');
    const closePopupBtn = document.getElementById('closePopupBtnHaushaltshilfe');
    const spendenPopup = document.getElementById('spendenPopupHaushaltshilfe');
    const storageKey = 'haushaltshilfeAntragFormData';

    // --- Steuerung der dynamischen Detail-Felder ---
    const antragGrundSelect = document.getElementById('antragGrund');
    const grundDetailsKlinikKur = document.getElementById('grundDetailsKlinikKur');
    const grundDetailsKrankheitZuhause = document.getElementById('grundDetailsKrankheitZuhause');
    const grundDetailsSonstiges = document.getElementById('grundDetailsSonstiges');

    const kindImHaushaltSelect = document.getElementById('kindImHaushalt');
    const kinderDetails = document.getElementById('kinderDetails');
    const anderePersonImHaushaltSelect = document.getElementById('anderePersonImHaushalt');
    const anderePersonBegruendung = document.getElementById('anderePersonBegruendung');

    const durchfuehrungPersonArtSelect = document.getElementById('durchfuehrungPersonArt');
    const durchfuehrungPrivatpersonDetails = document.getElementById('durchfuehrungPrivatpersonDetails');
    const durchfuehrungDienstDetails = document.getElementById('durchfuehrungDienstDetails');

    function updateGrundDetailsVisibility() {
        grundDetailsKlinikKur.style.display = (antragGrundSelect.value === 'Krankenhausaufenthalt' || antragGrundSelect.value === 'Medizinische Rehabilitationsmaßnahme (Kur)') ? 'block' : 'none';
        grundDetailsKrankheitZuhause.style.display = antragGrundSelect.value === 'Ambulante Behandlung/Schwere Erkrankung zu Hause' ? 'block' : 'none';
        grundDetailsSonstiges.style.display = antragGrundSelect.value === 'Sonstiger Grund (bitte unten erläutern)' ? 'block' : 'none';
    }

    function updateKinderDetailsVisibility() {
        kinderDetails.style.display = kindImHaushaltSelect.value === 'Ja' ? 'block' : 'none';
    }
    
    function updateAnderePersonBegruendungVisibility() {
        anderePersonBegruendung.style.display = anderePersonImHaushaltSelect.value === 'Nein' || anderePersonImHaushaltSelect.value === 'Ja, teilweise' ? 'block' : 'none';
    }

    function updateDurchfuehrungDetailsVisibility() {
        const art = durchfuehrungPersonArtSelect.value;
        durchfuehrungPrivatpersonDetails.style.display = (art === 'Selbstorganisierte Privatperson (nicht verwandt/verschwägert bis 2. Grad)' || art === 'Verwandte/r oder Verschwägerte/r (bis zum 2. Grad)') ? 'block' : 'none';
        durchfuehrungDienstDetails.style.display = art === 'Professioneller Dienst (z.B. Sozialstation, Pflegedienst)' ? 'block' : 'none';
    }
    
    // Event Listeners für dynamische Felder
    if (antragGrundSelect) antragGrundSelect.addEventListener('change', updateGrundDetailsVisibility);
    if (kindImHaushaltSelect) kindImHaushaltSelect.addEventListener('change', updateKinderDetailsVisibility);
    if (anderePersonImHaushaltSelect) anderePersonImHaushaltSelect.addEventListener('change', updateAnderePersonBegruendungVisibility);
    if (durchfuehrungPersonArtSelect) durchfuehrungPersonArtSelect.addEventListener('change', updateDurchfuehrungDetailsVisibility);

    // Initialisierungsaufrufe für Sichtbarkeit
    if (antragGrundSelect) updateGrundDetailsVisibility();
    if (kindImHaushaltSelect) updateKinderDetailsVisibility();
    if (anderePersonImHaushaltSelect) updateAnderePersonBegruendungVisibility();
    if (durchfuehrungPersonArtSelect) updateDurchfuehrungDetailsVisibility();

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "name", "adresse", "geburt", "nummer", "telefon", "kasseName", "kasseAdresse",
        "antragGrund", "klinikKurName", "klinikKurZeitraumVon", "klinikKurZeitraumBis", 
        "krankheitBeschreibung", "sonstigerGrundBeschreibung",
        "kindImHaushalt", "kinderNamenAlter", "anderePersonImHaushalt", "warumNichtAnderePerson",
        "zeitraumVon", "zeitraumBis", "stundenProTag",
        "durchfuehrungPersonArt", "privatpersonName", "privatpersonVerwandtschaft", "privatpersonStundensatz",
        "dienstName", "dienstAnschrift", 
        "arztNameHaushaltshilfe", "datumAerztlicheBescheinigung"
    ];
    // Checkbox-IDs (oder Namen, wenn gruppiert)
    const anlagenCheckboxId = "dienstKostenvoranschlag"; // Beispiel, falls weitere Checkboxen hinzukommen

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        // Ggf. Checkboxen hier sammeln, falls es welche gibt
        const kostenvoranschlagCheckbox = document.getElementById(anlagenCheckboxId);
        if (kostenvoranschlagCheckbox) data[anlagenCheckboxId] = kostenvoranschlagCheckbox.checked;
        return data;
    }

    function populateForm(data) {
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.value = data[id];
            }
        });
        const kostenvoranschlagCheckbox = document.getElementById(anlagenCheckboxId);
        if (kostenvoranschlagCheckbox && data[anlagenCheckboxId] !== undefined) {
            kostenvoranschlagCheckbox.checked = data[anlagenCheckboxId];
        }
        // Sichtbarkeit nach Laden aktualisieren
        if (antragGrundSelect) updateGrundDetailsVisibility();
        if (kindImHaushaltSelect) updateKinderDetailsVisibility();
        if (anderePersonImHaushaltSelect) updateAnderePersonBegruendungVisibility();
        if (durchfuehrungPersonArtSelect) updateDurchfuehrungDetailsVisibility();
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
            generateHaushaltshilfeAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateHaushaltshilfeAntragPDF() {
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
    const name = document.getElementById("name").value;
    const adresse = document.getElementById("adresse").value;
    const geburtInput = document.getElementById("geburt").value;
    const geburtFormatiert = geburtInput ? new Date(geburtInput).toLocaleDateString("de-DE") : 'N/A';
    const nummer = document.getElementById("nummer").value;
    const telefon = document.getElementById("telefon").value;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    const antragGrund = document.getElementById("antragGrund").value;
    const klinikKurName = document.getElementById("klinikKurName").value;
    const klinikKurZeitraumVonInput = document.getElementById("klinikKurZeitraumVon").value;
    const klinikKurZeitraumVon = klinikKurZeitraumVonInput ? new Date(klinikKurZeitraumVonInput).toLocaleDateString("de-DE") : '';
    const klinikKurZeitraumBisInput = document.getElementById("klinikKurZeitraumBis").value;
    const klinikKurZeitraumBis = klinikKurZeitraumBisInput ? new Date(klinikKurZeitraumBisInput).toLocaleDateString("de-DE") : '';
    const krankheitBeschreibung = document.getElementById("krankheitBeschreibung").value;
    const sonstigerGrundBeschreibung = document.getElementById("sonstigerGrundBeschreibung").value;

    const kindImHaushalt = document.getElementById("kindImHaushalt").value;
    const kinderNamenAlter = document.getElementById("kinderNamenAlter").value;
    const anderePersonImHaushalt = document.getElementById("anderePersonImHaushalt").value;
    const warumNichtAnderePerson = document.getElementById("warumNichtAnderePerson").value;

    const zeitraumVonInput = document.getElementById("zeitraumVon").value;
    const zeitraumVon = zeitraumVonInput ? new Date(zeitraumVonInput).toLocaleDateString("de-DE") : 'N/A';
    const zeitraumBisInput = document.getElementById("zeitraumBis").value;
    const zeitraumBis = zeitraumBisInput ? new Date(zeitraumBisInput).toLocaleDateString("de-DE") : 'N/A';
    const stundenProTag = document.getElementById("stundenProTag").value;

    const durchfuehrungPersonArt = document.getElementById("durchfuehrungPersonArt").value;
    const privatpersonName = document.getElementById("privatpersonName").value;
    const privatpersonVerwandtschaft = document.getElementById("privatpersonVerwandtschaft").value;
    const privatpersonStundensatz = document.getElementById("privatpersonStundensatz").value;
    const dienstName = document.getElementById("dienstName").value;
    const dienstAnschrift = document.getElementById("dienstAnschrift").value;
    const dienstKostenvoranschlag = document.getElementById("dienstKostenvoranschlag").checked;

    const arztNameHaushaltshilfe = document.getElementById("arztNameHaushaltshilfe").value;
    const datumAerztlicheBescheinigungInput = document.getElementById("datumAerztlicheBescheinigung").value;
    const datumAerztlicheBescheinigung = datumAerztlicheBescheinigungInput ? new Date(datumAerztlicheBescheinigungInput).toLocaleDateString("de-DE") : 'liegt bei/wird nachgereicht';

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

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
    doc.text(name, rightColumnX, rightY);
    rightY += defaultLineHeight;
    
    adresse.split("\n").forEach(line => {
        doc.text(line.trim(), rightColumnX, rightY);
        rightY += defaultLineHeight;
    });

    if (telefon && telefon.trim() !== "") {
        doc.text("Tel.: " + telefon, rightColumnX, rightY);
        rightY += defaultLineHeight;
    }

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger
    let leftY = margin + 15; 
    
    // Inline-Rücksendezeile generieren
    const cleanAddressInline = adresse.replace(/\r?\n/g, " · ");
    const ruecksendeZeile = `${name} · ${cleanAddressInline}`;
    
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
    
    // Schützt vor Überschneidungen, falls die Adresse mal länger ist
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Text
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

    // Betreff
    let betreffText = `Antrag auf Haushaltshilfe gemäß § 38 SGB V`;
    if (antragGrund === "Schwangerschaftsbeschwerden/Entbindung") {
        betreffText = `Antrag auf Haushaltshilfe gemäß § 24h SGB V`;
    }
    betreffText += `\nVersichertennummer: ${nummer}`;
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`hiermit beantrage ich, ${name}, geboren am ${geburtFormatiert}, Versichertennummer ${nummer}, die Gewährung von Haushaltshilfe.`);
    
    // 1. Grund für den Antrag
    writeLine("1. Grund für den Antrag:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Ich beantrage Haushaltshilfe wegen: ${antragGrund}.`);
    if (antragGrund === 'Krankenhausaufenthalt' || antragGrund === 'Medizinische Rehabilitationsmaßnahme (Kur)') {
        if (klinikKurName.trim() !== "") writeParagraph(`Die Behandlung findet/fand in folgender Einrichtung statt: ${klinikKurName}.`);
        if (klinikKurZeitraumVon.trim() !== "" && klinikKurZeitraumBis.trim() !== "") {
            writeParagraph(`Voraussichtlicher/tatsächlicher Zeitraum: von ${klinikKurZeitraumVon} bis ${klinikKurZeitraumBis}.`);
        } else if (klinikKurZeitraumVon.trim() !== "") {
            writeParagraph(`Voraussichtlicher/tatsächlicher Beginn: ${klinikKurZeitraumVon}.`);
        }
    } else if (antragGrund === 'Ambulante Behandlung/Schwere Erkrankung zu Hause') {
        if (krankheitBeschreibung.trim() !== "") writeParagraph(`Nähere Angaben zur Erkrankung/Situation: ${krankheitBeschreibung}`);
    } else if (antragGrund === 'Sonstiger Grund (bitte unten erläutern)') {
         if (sonstigerGrundBeschreibung.trim() !== "") writeParagraph(`Erläuterung des Grundes: ${sonstigerGrundBeschreibung}`);
    }
     writeParagraph("Eine ärztliche Bescheinigung über die Notwendigkeit der Haushaltshilfe vom " + `${arztNameHaushaltshilfe}` + " (ausgestellt am " + `${datumAerztlicheBescheinigung}` + ") liegt diesem Antrag bei bzw. wird umgehend nachgereicht.");


    // 2. Angaben zur Haushaltssituation
    writeLine("2. Angaben zur Haushaltssituation:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    if (kindImHaushalt === "Ja") {
        writeParagraph(`In meinem Haushalt lebt/leben betreuungsbedürftige Kind(er): ${kinderNamenAlter || '(Namen und Alter bitte eintragen)'}.`);
    } else {
        writeParagraph("In meinem Haushalt leben keine Kinder unter 12 Jahren oder auf Hilfe angewiesene behinderte Kinder, die betreut werden müssen.");
        
    }
    writeParagraph(`Eine andere im Haushalt lebende Person kann die Weiterführung des Haushalts und ggf. die Kinderbetreuung ${anderePersonImHaushalt === "Nein" ? "nicht" : (anderePersonImHaushalt === "Ja, teilweise" ? "nur teilweise" : "vollständig")} übernehmen.`);
    if (anderePersonImHaushalt === "Nein" || anderePersonImHaushalt === "Ja, teilweise") {
        if (warumNichtAnderePerson.trim() !== "") writeParagraph(`Begründung hierfür: ${warumNichtAnderePerson}`);
    }


    // 3. Beantragter Zeitraum und Umfang
    writeLine("3. Beantragter Zeitraum und Umfang der Haushaltshilfe:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Ich beantrage die Haushaltshilfe für den Zeitraum vom ${zeitraumVon} bis zum ${zeitraumBis}.`);
    writeParagraph(`Der täglich benötigte Umfang beträgt ca. ${stundenProTag} Stunden.`);

    // 4. Durchführung der Haushaltshilfe
    writeLine("4. Durchführung der Haushaltshilfe:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Die Haushaltshilfe soll geleistet werden durch: ${durchfuehrungPersonArt}.`);
    if (durchfuehrungPersonArt === 'Selbstorganisierte Privatperson (nicht verwandt/verschwägert bis 2. Grad)' || durchfuehrungPersonArt === 'Verwandte/r oder Verschwägerte/r (bis zum 2. Grad)') {
        if (privatpersonName.trim() !== "") writeParagraph(`Name der Person: ${privatpersonName}`);
        if (privatpersonVerwandtschaft.trim() !== "") writeParagraph(`Verhältnis zur Person: ${privatpersonVerwandtschaft}`);
        if (privatpersonStundensatz.trim() !== "") writeParagraph(`Beantragte Aufwandsentschädigung/Stundensatz: ${privatpersonStundensatz} EUR (Bitte beachten Sie die Erstattungsgrenzen Ihrer Krankenkasse).`);
    } else if (durchfuehrungPersonArt === 'Professioneller Dienst (z.B. Sozialstation, Pflegedienst)') {
        if (dienstName.trim() !== "") writeParagraph(`Name des Dienstes: ${dienstName}`);
        if (dienstAnschrift.trim() !== "") writeParagraph(`Anschrift des Dienstes: ${dienstAnschrift.replace(/\n/g, ', ')}`);
        if (dienstKostenvoranschlag) writeParagraph("Ein Kostenvoranschlag des Dienstes liegt bei bzw. wird nachgereicht.");
    }
    
    // Abschluss
    writeParagraph("Ich bitte Sie um Prüfung meines Antrags und um eine baldige schriftliche Zusage für die beantragte Haushaltshilfe.", defaultLineHeight, 11);
    writeParagraph("Für Rückfragen stehe ich Ihnen gerne zur Verfügung.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel (mit reduziertem Abstand)
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(name);

    doc.save("antrag_haushaltshilfe.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupHaushaltshilfe");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}