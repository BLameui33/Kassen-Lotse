document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('patientenverfuegungForm');
    const saveBtn = document.getElementById('saveBtnPatientenV');
    const loadBtn = document.getElementById('loadBtnPatientenV');
    const closePopupBtn = document.getElementById('closePopupBtnPatientenV');
    const spendenPopup = document.getElementById('spendenPopupPatientenV');
    const storageKey = 'patientenverfuegungFormData';

    // --- Steuerung der dynamischen Felder ---
    const organspendeSelect = document.getElementById('organspende');
    const organspendeDetailsDiv = document.getElementById('organspendeDetails');
    const organspendeSpezifischText = document.getElementById('organspendeSpezifischText');

    function updateOrganspendeDetailsVisibility() {
        const isSpezifisch = organspendeSelect.value === 'ja_bestimmte';
        organspendeDetailsDiv.style.display = isSpezifisch ? 'block' : 'none';
        organspendeDetailsDiv.classList.toggle('sub-details-active', isSpezifisch);
        organspendeSpezifischText.required = isSpezifisch;
    }

    if (organspendeSelect && organspendeDetailsDiv) {
        organspendeSelect.addEventListener('change', updateOrganspendeDetailsVisibility);
        updateOrganspendeDetailsVisibility(); // Initial prüfen
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "pvName", "pvGeburtsdatum", "pvAdresse",
        "werteLeben", "werteSterben",
        "situationenSonstige",
        "massnahmeWiederbelebung", "massnahmeBeatmung",
        "massnahmeErnaehrung", "massnahmeFluessigkeit",
        "massnahmeAntibiotika", "massnahmeDialyse", "massnahmeSchmerzLinderung",
        "wunschBehandlungsort", "wunschBeistand",
        "organspende", "organspendeSpezifischText",
        "aussagekraftVerfuegung", "bezugVorsorgevollmacht"
    ];
    const checkboxIdsToSave = [
        "eigenhaendigUnterschreibenPV"
    ];
    const situationenCheckboxName = "situationen";


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
        
        data.situationen = [];
        document.querySelectorAll(`input[name="${situationenCheckboxName}"]:checked`).forEach(cb => data.situationen.push(cb.value));
        
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

        document.querySelectorAll(`input[name="${situationenCheckboxName}"]`).forEach(cb => {
            cb.checked = data.situationen && data.situationen.includes(cb.value);
        });

        // Sichtbarkeit nach Laden aktualisieren
        if (organspendeSelect) updateOrganspendeDetailsVisibility();
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
            console.error("Fehler beim Laden der Daten aus localStorage für Patientenverfügung:", e);
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
            if (!document.getElementById('eigenhaendigUnterschreibenPV').checked) {
                alert("Bitte bestätigen Sie, dass Sie das Dokument nach dem Ausdrucken eigenhändig unterschreiben werden.");
                return;
            }
            if (document.querySelectorAll('input[name="situationen"]:checked').length === 0 && document.getElementById('situationenSonstige').value.trim() === "") {
                alert("Bitte wählen Sie mindestens eine Situation aus, für die Ihre Patientenverfügung gelten soll, oder beschreiben Sie eine spezifische Situation.");
                return;
            }
            generatePatientenverfuegungPDF();
        });
    }
}); // Ende DOMContentLoaded

function generatePatientenverfuegungPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin; // Oberer und unterer Rand berücksichtigt
    let y = margin;
    const defaultLineHeight = 5.5; // Kleinere Zeilenhöhe für mehr Text
    const spaceAfterParagraph = 3; 
    const headingFontSize = 14;
    const subHeadingFontSize = 11; // Kleinere Sub-Überschriften
    const textFontSize = 9.5;     // Kleinere Textschrift
    const smallTextFontSize = 8;

    // Hilfsfunktionen für PDF
    function writeLine(text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        if (y + currentLineHeight > usableHeight - (margin/2)) { doc.addPage(); y = margin; }
        doc.setFontSize(fontSize);
        doc.setFont("times", fontStyle); // Times New Roman für formelle Dokumente
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
    
    // Formulardaten sammeln
    const pvName = document.getElementById("pvName").value || "";
    const pvGeburtsdatumInput = document.getElementById("pvGeburtsdatum").value;
    const pvGeburtsdatum = pvGeburtsdatumInput ? new Date(pvGeburtsdatumInput).toLocaleDateString("de-DE") : 'N/A';
    const pvAdresse = document.getElementById("pvAdresse").value || "";

    const werteLeben = document.getElementById("werteLeben").value || "";
    const werteSterben = document.getElementById("werteSterben").value || "";

    const situationenGewaehlt = [];
    document.querySelectorAll('input[name="situationen"]:checked').forEach(cb => situationenGewaehlt.push(cb.value));
    const situationenSonstige = document.getElementById("situationenSonstige").value || "";

    const massnahmeWiederbelebung = document.getElementById("massnahmeWiederbelebung").value;
    const massnahmeBeatmung = document.getElementById("massnahmeBeatmung").value;
    const massnahmeErnaehrung = document.getElementById("massnahmeErnaehrung").value;
    const massnahmeFluessigkeit = document.getElementById("massnahmeFluessigkeit").value;
    const massnahmeAntibiotika = document.getElementById("massnahmeAntibiotika").value;
    const massnahmeDialyse = document.getElementById("massnahmeDialyse").value;
    const massnahmeSchmerzLinderung = document.getElementById("massnahmeSchmerzLinderung").value;

    const wunschBehandlungsort = document.getElementById("wunschBehandlungsort").value || "";
    const wunschBeistand = document.getElementById("wunschBeistand").value || "";

    const organspende = document.getElementById("organspende").value;
    const organspendeSpezifischText = document.getElementById("organspendeSpezifischText").value || "";
    
    const aussagekraftVerfuegung = document.getElementById("aussagekraftVerfuegung").value || "Diese Patientenverfügung ist Ausdruck meines derzeitigen Willens und meiner Wertvorstellungen. Ich erwarte, dass sie von allen behandelnden Ärzten und dem medizinischen Personal beachtet wird. Ich bin mir bewusst, dass ich diese Verfügung jederzeit formlos widerrufen oder ändern kann, solange ich entscheidungsfähig bin.";
    const bezugVorsorgevollmacht = document.getElementById("bezugVorsorgevollmacht").value || "";


    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal"); 

    writeParagraph("Patientenverfügung", defaultLineHeight, headingFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight * 1.5});

    writeParagraph("Ich, die unterzeichnende Person:", defaultLineHeight, textFontSize, {extraSpacingAfter:1});
    writeLine(`${pvName}`, defaultLineHeight, "bold", textFontSize);
    writeLine(`geboren am: ${pvGeburtsdatum}`, defaultLineHeight, "normal", textFontSize);
    pvAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    y += defaultLineHeight;

    writeParagraph("treffe diese Patientenverfügung nach sorgfältiger Überlegung und aus freiem Willen für den Fall, dass ich meinen Willen bezüglich medizinischer oder pflegerischer Maßnahmen nicht mehr (wirksam) äußern kann.", defaultLineHeight, textFontSize);
    y += defaultLineHeight;

    writeLine("1. Meine Wertvorstellungen und Einstellungen zum Leben und Sterben", defaultLineHeight, "bold", subHeadingFontSize);
    if (werteLeben.trim() !== "") {
        writeParagraph(`Meine allgemeinen Wertvorstellungen und was für mich Lebensqualität bedeutet:\n${werteLeben}`, defaultLineHeight, textFontSize);
    }
    if (werteSterben.trim() !== "") {
        writeParagraph(`Meine Einstellung zu schwerem Leiden und zum Sterben:\n${werteSterben}`, defaultLineHeight, textFontSize);
    }
    if (werteLeben.trim() === "" && werteSterben.trim() === "") {
        writeParagraph("Ich habe an dieser Stelle keine spezifischen allgemeinen Wertvorstellungen niedergelegt, mein Wille ergibt sich aus den nachfolgenden konkreten Festlegungen.", defaultLineHeight, textFontSize, {fontStyle: "italic"});
    }
    y += defaultLineHeight;

    writeLine("2. Situationen, für die diese Patientenverfügung gelten soll", defaultLineHeight, "bold", subHeadingFontSize);
    writeParagraph("Diese Patientenverfügung soll Geltung erlangen, wenn ich mich nach ärztlicher Beurteilung in einer der folgenden von mir angekreuzten oder beschriebenen Situationen befinde und meinen Willen nicht mehr äußern kann:", defaultLineHeight, textFontSize);
    
    let situationenText = "";
    if (situationenGewaehlt.includes("Endstadium unheilbare Krankheit")) situationenText += "- Wenn ich mich im Endstadium einer unheilbaren, tödlich verlaufenden Krankheit befinde, auch wenn der Todeszeitpunkt noch nicht sicher absehbar ist.\n";
    if (situationenGewaehlt.includes("Schwere Hirnschaedigung")) situationenText += "- Wenn infolge einer schweren Gehirnschädigung (z.B. nach Unfall, Schlaganfall) meine Fähigkeit, Entscheidungen zu treffen, aller Voraussicht nach unwiederbringlich erloschen ist.\n";
    if (situationenGewaehlt.includes("Dauerhaftes Koma")) situationenText += "- Wenn ich mich in einem Zustand dauerhafter Bewusstlosigkeit (Koma) befinde, aus dem ein Erwachen aller Voraussicht nach nicht mehr zu erwarten ist.\n";
    if (situationenGewaehlt.includes("Fortgeschrittene Demenz")) situationenText += "- Wenn ich an einer fortgeschrittenen Demenzerkrankung leide, die es mir nicht mehr erlaubt, meine Situation zu erfassen und Entscheidungen zu treffen.\n";
    if (situationenGewaehlt.includes("Unmittelbarer Sterbeprozess")) situationenText += "- Wenn ich mich im unmittelbaren Sterbeprozess befinde.\n";
    if (situationenSonstige.trim() !== "") situationenText += `- In folgender, von mir beschriebener Situation:\n  ${situationenSonstige}\n`;
    if (situationenText.trim() === "") situationenText = "Es wurden keine spezifischen Situationen im Formular ausgewählt. Die nachfolgenden Festlegungen sollen dann gelten, wenn ich meinen Willen nicht mehr äußern kann und eine der hier nicht explizit genannten, aber sinngemäß vergleichbaren, schweren und aussichtslosen Krankheitssituationen vorliegt.";
    writeParagraph(situationenText.trim(), defaultLineHeight, textFontSize, {extraSpacingAfter: defaultLineHeight});

    writeLine("3. Festlegungen zu ärztlichen und pflegerischen Maßnahmen", defaultLineHeight, "bold", subHeadingFontSize);
    writeParagraph("In den oben von mir bestimmten Situationen wünsche bzw. lehne ich folgende Maßnahmen ab:", defaultLineHeight, textFontSize);

    function getMassnahmeText(auswahl, jaText, neinText, entscheidungText, spezifischText = "") {
        if (auswahl === "wunsch_ja") return jaText || "Ich wünsche diese Maßnahme.";
        if (auswahl === "wunsch_ja_kurz") return spezifischText || jaText || "Ich wünsche diese Maßnahme nur für einen begrenzten Zeitraum.";
        if (auswahl === "wunsch_nein" || auswahl === "wunsch_nein_lebensende") return neinText || "Ich lehne diese Maßnahme ab.";
        if (auswahl === "wunsch_immer") return jaText || "Ich wünsche diese Maßnahme uneingeschränkt.";
        if (auswahl === "wunsch_abwaegung") return spezifischText || jaText || "Ich wünsche diese Maßnahme unter Abwägung.";
        if (auswahl === "entscheidung_bevollmaechtigter") return entscheidungText || "Mein(e) Bevollmächtigte(r) / Betreuer(in) soll nach meinem mutmaßlichen Willen entscheiden.";
        return "Keine Festlegung getroffen.";
    }

    writeLine("Lebenserhaltende Maßnahmen / Wiederbelebung:", defaultLineHeight, "bold", smallTextFontSize + 1);
    writeParagraph(`Wiederbelebungsmaßnahmen: ${getMassnahmeText(massnahmeWiederbelebung, "Ich wünsche Wiederbelebungsmaßnahmen.", "Ich lehne Wiederbelebungsmaßnahmen ab.", "Mein(e) Bevollmächtigte(r)/Betreuer(in) soll entscheiden.")}`, defaultLineHeight, textFontSize);
    writeParagraph(`Künstliche Beatmung: ${getMassnahmeText(massnahmeBeatmung, "Ich wünsche künstliche Beatmung, wenn medizinisch angezeigt.", "Ich lehne künstliche Beatmung ab.", "Mein(e) Bevollmächtigte(r)/Betreuer(in) soll entscheiden.", "Ich wünsche künstliche Beatmung nur für einen begrenzten Zeitraum, um eine Besserungschance abzuwarten.")}`, defaultLineHeight, textFontSize);

    writeLine("Künstliche Ernährung und Flüssigkeitszufuhr:", defaultLineHeight, "bold", smallTextFontSize + 1);
    writeParagraph(`Künstliche Ernährung: ${getMassnahmeText(massnahmeErnaehrung, "Ich wünsche künstliche Ernährung.", "Ich lehne künstliche Ernährung ab, wenn sie nur der Lebensverlängerung ohne Aussicht auf Besserung dient.", "Mein(e) Bevollmächtigte(r)/Betreuer(in) soll entscheiden.")}`, defaultLineHeight, textFontSize);
    writeParagraph(`Künstliche Flüssigkeitszufuhr: ${getMassnahmeText(massnahmeFluessigkeit, "Ich wünsche künstliche Flüssigkeitszufuhr.", "Ich lehne künstliche Flüssigkeitszufuhr ab, wenn sie nur der Lebensverlängerung ohne Aussicht auf Besserung dient (Ausnahme: Linderung von Durstgefühl).", "Mein(e) Bevollmächtigte(r)/Betreuer(in) soll entscheiden.")}`, defaultLineHeight, textFontSize);

    writeLine("Weitere medizinische Maßnahmen:", defaultLineHeight, "bold", smallTextFontSize + 1);
    writeParagraph(`Gabe von Antibiotika: ${getMassnahmeText(massnahmeAntibiotika, "Ich wünsche Antibiotika zur Behandlung von Infektionen.", "Ich lehne Antibiotika ab, wenn ich mich im unmittelbaren Sterbeprozess befinde und sie nur der Lebensverlängerung dienen würden.", "Mein(e) Bevollmächtigte(r)/Betreuer(in) soll entscheiden.")}`, defaultLineHeight, textFontSize);
    writeParagraph(`Dialyse (Blutwäsche): ${getMassnahmeText(massnahmeDialyse, "Ich wünsche Dialyse, wenn medizinisch angezeigt.", "Ich lehne Dialyse ab, wenn keine Aussicht auf Besserung meines Gesamtzustandes besteht.", "Mein(e) Bevollmächtigte(r)/Betreuer(in) soll entscheiden.")}`, defaultLineHeight, textFontSize);
    writeParagraph(`Schmerz- und Symptombehandlung: ${getMassnahmeText(massnahmeSchmerzLinderung, "Ich wünsche jederzeit eine umfassende Schmerz- und Symptomlinderung, auch wenn dies eine Verkürzung meiner Lebenszeit zur Folge haben könnte.", "", "", "Ich wünsche Schmerz- und Symptomlinderung, aber unter Abwägung mit möglichen lebensverkürzenden Nebenwirkungen.")}`, defaultLineHeight, textFontSize);
    y += defaultLineHeight;

    writeLine("4. Ort der Behandlung und Begleitung", defaultLineHeight, "bold", subHeadingFontSize);
    if (wunschBehandlungsort.trim() !== "") {
        writeParagraph(`Meine Wünsche zum Ort der Behandlung und Pflege in meiner letzten Lebensphase:\n${wunschBehandlungsort}`, defaultLineHeight, textFontSize);
    } else {
        writeParagraph("Ich wünsche, wenn möglich, in meiner vertrauten Umgebung (z.B. zu Hause oder in einem Hospiz) zu sterben und nicht um jeden Preis in ein Krankenhaus verlegt zu werden, es sei denn, dies ist zur Linderung von Schmerzen oder anderen unerträglichen Symptomen unumgänglich.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
    if (wunschBeistand.trim() !== "") {
        writeParagraph(`Meine Wünsche zu seelischem oder religiösem Beistand:\n${wunschBeistand}`, defaultLineHeight, textFontSize);
    }
    y += defaultLineHeight;

    writeLine("5. Erklärung zur Organ- und Gewebespende", defaultLineHeight, "bold", subHeadingFontSize);
    let organspendeText = "";
    if (organspende === "nicht_festgelegt") organspendeText = "Ich habe zur Organ- und Gewebespende keine Entscheidung getroffen oder verweise auf einen ggf. vorhandenen separaten Organspendeausweis.";
    else if (organspende === "ja_alle") organspendeText = "Ja, ich stimme der Entnahme aller meiner Organe und Gewebe nach meinem Tod zur Transplantation zu.";
    else if (organspende === "ja_bestimmte") organspendeText = `Ja, ich stimme der Entnahme folgender Organe/Gewebe zu: ${organspendeSpezifischText || '(bitte spezifizieren)'}. Anderen Organ-/Gewebeentnahmen stimme ich nicht zu.`;
    else if (organspende === "nein") organspendeText = "Nein, ich lehne eine Organ- und Gewebeentnahme nach meinem Tod ausdrücklich ab.";
    writeParagraph(organspendeText, defaultLineHeight, textFontSize);
    y += defaultLineHeight;

    writeLine("6. Schlussbemerkungen und Geltung", defaultLineHeight, "bold", subHeadingFontSize);
    writeParagraph(aussagekraftVerfuegung, defaultLineHeight, textFontSize);
    if (bezugVorsorgevollmacht.trim() !== "") {
        writeParagraph(`Bezug zu meiner Vorsorgevollmacht:\n${bezugVorsorgevollmacht}`, defaultLineHeight, textFontSize);
    }
    writeParagraph("Ich bestätige, dass ich diese Patientenverfügung bei klarem Verstand und ohne äußeren Druck erstellt habe. Ich wurde über die Möglichkeiten und Konsequenzen ärztlich und/oder juristisch beraten bzw. habe mich umfassend informiert und verzichte auf eine weitere Beratung / habe eine Beratung durch [Name, Institution] am [Datum] erhalten (zutreffendes bitte im ausgedruckten Dokument handschriftlich ergänzen oder streichen).", defaultLineHeight, smallTextFontSize, {fontStyle:"italic"});
    writeParagraph("Diese Patientenverfügung soll solange gelten, bis ich sie widerrufe. Ich bin mir bewusst, dass es sinnvoll ist, die Verfügung regelmäßig (z.B. alle 1-2 Jahre) zu überprüfen und durch erneute Unterschrift zu bestätigen.", defaultLineHeight, smallTextFontSize, {fontStyle:"italic"});
    y += defaultLineHeight * 2;

    writeLine("_________________________                ____________________________________________________", defaultLineHeight, "normal", textFontSize);
    writeLine("Ort, Datum", defaultLineHeight + 2, "normal", smallTextFontSize); 
    y -= defaultLineHeight; 
    doc.text("Unterschrift der verfügenden Person", margin + 60, y-2, {fontSize: smallTextFontSize}); 
    y += defaultLineHeight * 3; // Mehr Platz lassen

    writeLine("Bestätigung durch erneute Unterschrift (empfohlen, z.B. nach 1-2 Jahren):", defaultLineHeight, "bold", smallTextFontSize);
    y += defaultLineHeight / 2;
    writeLine("_________________________                ____________________________________________________", defaultLineHeight, "normal", textFontSize);
    writeLine("Ort, Datum", defaultLineHeight + 2, "normal", smallTextFontSize); 
    y -= defaultLineHeight; 
    doc.text("Unterschrift der verfügenden Person", margin + 60, y-2, {fontSize: smallTextFontSize}); 


    doc.save("patientenverfuegung.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupPatientenV");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}