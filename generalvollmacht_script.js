document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('generalvollmachtForm');
    const saveBtn = document.getElementById('saveBtnGeneralV');
    const loadBtn = document.getElementById('loadBtnGeneralV');
    const closePopupBtn = document.getElementById('closePopupBtnGeneralvollmacht');
    const spendenPopup = document.getElementById('spendenPopupGeneralvollmacht');
    const storageKey = 'generalvollmachtFormData';

    // --- Steuerung der dynamischen Felder ---
    const addBevollmaechtigterBtn = document.getElementById('addBevollmaechtigterBtn');
    const removeBevollmaechtigterBtn = document.getElementById('removeBevollmaechtigterBtn');
    const bevollmaechtigter2Wrapper = document.getElementById('bevollmaechtigter2Wrapper');

    function updateBevollmaechtigter2Visibility(show) {
        if (bevollmaechtigter2Wrapper && addBevollmaechtigterBtn && removeBevollmaechtigterBtn) {
            bevollmaechtigter2Wrapper.style.display = show ? 'block' : 'none';
            bevollmaechtigter2Wrapper.classList.toggle('sub-details-active', show);
            document.getElementById('bv2Name').required = show;

            addBevollmaechtigterBtn.style.display = show ? 'none' : 'inline-block';
            removeBevollmaechtigterBtn.style.display = show ? 'inline-block' : 'none';
        }
    }

    if (addBevollmaechtigterBtn) {
        addBevollmaechtigterBtn.addEventListener('click', function() {
            updateBevollmaechtigter2Visibility(true);
        });
    }
    if (removeBevollmaechtigterBtn) {
        removeBevollmaechtigterBtn.addEventListener('click', function() {
            updateBevollmaechtigter2Visibility(false);
            // Felder von bv2 leeren
            document.getElementById('bv2Name').value = '';
            document.getElementById('bv2Geburtsdatum').value = '';
            document.getElementById('bv2Adresse').value = '';
            document.getElementById('bv2Telefon').value = '';
            document.getElementById('bv2Verhaeltnis').value = '';
            document.getElementById('bvVerhaeltnisZueinander').selectedIndex = 0;
        });
    }
    
    // Initialer Zustand für Bevollmächtigte Person 2
    if (document.getElementById('bv2Name')) {
        updateBevollmaechtigter2Visibility(document.getElementById('bv2Name').value.trim() !== '');
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "personName", "personGeburtsdatum", "personGeburtsort", "personAdresse", "personTelefon",
        "bv1Name", "bv1Geburtsdatum", "bv1Adresse", "bv1Telefon", "bv1Verhaeltnis",
        "bv2Name", "bv2Geburtsdatum", "bv2Adresse", "bv2Telefon", "bv2Verhaeltnis", "bvVerhaeltnisZueinander",
        "insichgeschaeft", "geltungTod", "untervollmacht", "customRegRules"
    ];
    
    // Abgleich wegen ID-Konsistenz
    const textareaCustom = document.getElementById('customRegeln');

    const checkboxIdsToSave = [
        "scopeFinanzen", "scopeGesundheit", "scopeAufenthalt", "scopePost", "scopeBehoerden", "eigenhaendigUnterschreibenGV"
    ];

    function getFormData() {
        const data = {};
        formElementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) data[id] = element.value;
        });
        if (textareaCustom) data["customRegeln"] = textareaCustom.value;
        
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
        if (textareaCustom && data["customRegeln"] !== undefined) {
            textareaCustom.value = data["customRegeln"];
        }
        
        checkboxIdsToSave.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) {
                element.checked = data[id];
            }
        });
        
        // Sichtbarkeit nach Laden aktualisieren
        updateBevollmaechtigter2Visibility(data.bv2Name && data.bv2Name.trim() !== '');
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
            console.error("Fehler beim Laden der Daten aus localStorage für Generalvollmacht:", e);
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
            if (!document.getElementById('eigenhaendigUnterschreibenGV').checked) {
                alert("Bitte bestätigen Sie, dass Sie das Dokument nach dem Ausdrucken eigenhändig unterschreiben werden.");
                return;
            }
            // Validierung für zweite Person, wenn sichtbar
            if (bevollmaechtigter2Wrapper.style.display === 'block' && document.getElementById('bv2Name').value.trim() === "") {
                alert("Bitte geben Sie den Namen für die zweite bevollmächtigte Person an oder entfernen Sie sie.");
                document.getElementById('bv2Name').focus();
                return;
            }
            generateGeneralvollmachtPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateGeneralvollmachtPDF() {
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
    const textFontSize = 10;
    const smallTextFontSize = 9;

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
    const personGeburtsort = document.getElementById("personGeburtsort").value || "";
    const personAdresse = document.getElementById("personAdresse").value || "";
    const personTelefon = document.getElementById("personTelefon").value || "";

    const bv1Name = document.getElementById("bv1Name").value || "";
    const bv1GeburtsdatumInput = document.getElementById("bv1Geburtsdatum").value;
    const bv1Geburtsdatum = bv1GeburtsdatumInput ? new Date(bv1GeburtsdatumInput).toLocaleDateString("de-DE") : '';
    const bv1Adresse = document.getElementById("bv1Adresse").value || "";
    const bv1Telefon = document.getElementById("bv1Telefon").value || "";
    const bv1Verhaeltnis = document.getElementById("bv1Verhaeltnis").value || "";

    const bv2Name = document.getElementById("bv2Name").value || "";
    let bv2Geburtsdatum = '', bv2Adresse = '', bv2Telefon = '', bv2Verhaeltnis = '', bvVerhaeltnisZueinander = '';
    const isBv2Active = (bevollmaechtigter2Wrapper.style.display === 'block' && bv2Name.trim() !== "");
    
    if (isBv2Active) {
        const bv2GeburtsdatumInput = document.getElementById("bv2Geburtsdatum").value;
        bv2Geburtsdatum = bv2GeburtsdatumInput ? new Date(bv2GeburtsdatumInput).toLocaleDateString("de-DE") : '';
        bv2Adresse = document.getElementById("bv2Adresse").value || "";
        bv2Telefon = document.getElementById("bv2Telefon").value || "";
        bv2Verhaeltnis = document.getElementById("bv2Verhaeltnis").value || "";
        bvVerhaeltnisZueinander = document.getElementById("bvVerhaeltnisZueinander").value;
    }

    const scopeFinanzen = document.getElementById("scopeFinanzen").checked;
    const scopeGesundheit = document.getElementById("scopeGesundheit").checked;
    const scopeAufenthalt = document.getElementById("scopeAufenthalt").checked;
    const scopePost = document.getElementById("scopePost").checked;
    const scopeBehoerden = document.getElementById("scopeBehoerden").checked;

    const insichgeschaeft = document.getElementById("insichgeschaeft").value;
    const geltungTod = document.getElementById("geltungTod").value;
    const untervollmacht = document.getElementById("untervollmacht").value;
    const customRegeln = document.getElementById("customRegeln").value || "";

    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal"); 

    writeParagraph("Umfassende Generalvollmacht", defaultLineHeight, headingFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    writeParagraph("Ich, die/der Vollmachtgeber:in,", defaultLineHeight, textFontSize, {fontStyle: "italic"});
    writeLine(`${personName}`, defaultLineHeight, "bold", textFontSize);
    writeLine(`geboren am: ${personGeburtsdatum} in ${personGeburtsort}`, defaultLineHeight, "normal", textFontSize);
    personAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (personTelefon.trim() !== "") writeLine(`Telefon: ${personTelefon}`, defaultLineHeight, "normal", textFontSize);
    y += defaultLineHeight / 2;

    writeParagraph("erteile hiermit eine umfassende Generalvollmacht an die nachstehend aufgeführte(n) Vertrauensperson(en). Diese Vollmacht ermächtigt die bevollmächtigte Person, mich in allen Angelegenheiten zu vertreten, in denen eine Stellvertretung rechtlich zulässig ist. Sie soll eine gerichtliche Betreuung vermeiden.", defaultLineHeight, textFontSize);
    y += defaultLineHeight / 2;

    writeLine("1. Bevollmächtigte Person(en)", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;
    
    // Person 1 schreiben
    writeLine(`Bevollmächtigte Person 1:`, defaultLineHeight, "bold", textFontSize);
    writeLine(`${bv1Name}`, defaultLineHeight, "bold", textFontSize);
    if (bv1Geburtsdatum.trim() !== "") writeLine(`geboren am: ${bv1Geburtsdatum}`, defaultLineHeight, "normal", textFontSize);
    if (bv1Adresse.trim() !== "") bv1Adresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (bv1Telefon.trim() !== "") writeLine(`Telefon: ${bv1Telefon}`, defaultLineHeight, "normal", textFontSize);
    if (bv1Verhaeltnis.trim() !== "") writeLine(`Verhältnis: ${bv1Verhaeltnis}`, defaultLineHeight, "normal", textFontSize);
    y += defaultLineHeight / 2;

    // Person 2 falls aktiv
    if (isBv2Active) {
        writeLine(`Bevollmächtigte Person 2:`, defaultLineHeight, "bold", textFontSize);
        writeLine(`${bv2Name}`, defaultLineHeight, "bold", textFontSize);
        if (bv2Geburtsdatum.trim() !== "") writeLine(`geboren am: ${bv2Geburtsdatum}`, defaultLineHeight, "normal", textFontSize);
        if (bv2Adresse.trim() !== "") bv2Adresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
        if (bv2Telefon.trim() !== "") writeLine(`Telefon: ${bv2Telefon}`, defaultLineHeight, "normal", textFontSize);
        if (bv2Verhaeltnis.trim() !== "") writeLine(`Verhältnis: ${bv2Verhaeltnis}`, defaultLineHeight, "normal", textFontSize);
        y += defaultLineHeight / 2;

        writeLine("Verhältnis der Bevollmächtigten zueinander:", defaultLineHeight, "italic", textFontSize);
        if (bvVerhaeltnisZueinander === "ersatz") {
            writeParagraph("Die bevollmächtigte Person 2 agiert rein als Ersatzbevollmächtigte. Sie wird erst dann vertretungsberechtigt, wenn die bevollmächtigte Person 1 dauerhaft oder vorübergehend ausfällt oder die Vollmacht zurückgibt.", defaultLineHeight, textFontSize);
        } else if (bvVerhaeltnisZueinander === "einzeln") {
            writeParagraph("Beide Personen sind uneingeschränkt einzelvertretungsberechtigt. Jede Person kann ohne Mitwirkung der anderen Person vollgültig für mich handeln.", defaultLineHeight, textFontSize);
        } else {
            writeParagraph("Beide Personen sind nur gemeinschaftlich vertretungsberechtigt. Rechtsgeschäfte und Willenserklärungen sind nur wirksam, wenn sie von beiden Bevollmächtigten zusammen abgegeben werden.", defaultLineHeight, textFontSize);
        }
        y += defaultLineHeight / 2;
    }

    writeLine("2. Umfang der Vertretungsmacht", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;

    if (scopeFinanzen) {
        writeParagraph("• Vermögens- und Finanzsorge: Der/die Bevollmächtigte darf über mein gesamtes Vermögen verfügen, Konten und Depots führen, Zahlungen leisten, Verträge abschließen und kündigen sowie Schenkungen im gesetzlich zulässigen Rahmen vornehmen.", defaultLineHeight, textFontSize);
    }
    if (scopeGesundheit) {
        writeParagraph("• Gesundheitssorge: Der/die Bevollmächtigte ist berechtigt, in alle medizinischen Maßnahmen, Behandlungen und Operationen einzuwilligen oder diese zu versagen. Er/sie hat das Recht auf Einsicht in meine Krankenakten und wird hiermit ausdrücklich gegenüber Ärzten und Krankenhauspersonal von der Schweigepflicht entbunden. Dies schließt Entscheidungen über lebenserhaltende Maßnahmen ein.", defaultLineHeight, textFontSize);
    }
    if (scopeAufenthalt) {
        writeParagraph("• Aufenthalt und Wohnung: Der/die Bevollmächtigte darf meinen Aufenthalt bestimmen, Verträge über Wohnungsunterbringung oder Pflegeheime abschließen sowie meine Wohnung kündigen und auflösen.", defaultLineHeight, textFontSize);
    }
    if (scopePost) {
        writeParagraph("• Post- und Fernmeldeverkehr: Der/die Bevollmächtigte darf die für mich bestimmte Post entgegennehmen, öffnen und anhalten. Dies gilt auch für Einschreiben und behördliche Sendungen sowie für die Verwaltung von digitalen Benutzerkonten.", defaultLineHeight, textFontSize);
    }
    if (scopeBehoerden) {
        writeParagraph("• Vertretung vor Behörden & Gerichten: Der/die Bevollmächtigte darf mich vor allen Behörden, Sozialversicherungsträgern, Finanzämtern und Gerichten vollumfänglich vertreten sowie Prozesse führen.", defaultLineHeight, textFontSize);
    }
    y += defaultLineHeight / 2;

    writeLine("3. Besondere juristische Bestimmungen", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;

    if (insichgeschaeft === "ja") {
        writeParagraph("• Befreiung von § 181 BGB: Der/die Bevollmächtigte ist ausdrücklich von den Beschränkungen des § 181 BGB befreit. Er/sie ist somit befugt, Rechtsgeschäfte im Namen des Vollmachtgebers mit sich selbst im eigenen Namen oder als Vertreter eines Dritten vorzunehmen.", defaultLineHeight, textFontSize);
    } else {
        writeParagraph("• Geltung von § 181 BGB: Der/die Bevollmächtigte ist nicht von den Beschränkungen des § 181 BGB befreit. Insichgeschäfte sind unzulässig.", defaultLineHeight, textFontSize);
    }

    if (geltungTod === "transmortal") {
        writeParagraph("• Geltung über den Tod hinaus: Diese Vollmacht erlischt nicht mit meinem Tod, sondern bleibt darüber hinaus vollumfänglich als transmortale Vollmacht wirksam. Sie ermächtigt den Vertreter, auch vor Ausstellung eines Erbscheins für meinen Nachlass zu handeln.", defaultLineHeight, textFontSize);
    } else {
        writeParagraph("• Geltung zwischen Lebenden: Diese Vollmacht ist rein personengebunden und erlischt ausdrücklich mit meinem Tod.", defaultLineHeight, textFontSize);
    }

    if (untervollmacht === "ja") {
        writeParagraph("• Unterbevollmächtigung: Der/die Bevollmächtigte ist berechtigt, für einzelne Angelegenheiten oder organisatorische Abläufe Untervollmachten zu erteilen.", defaultLineHeight, textFontSize);
    } else {
        writeParagraph("• Keine Unterbevollmächtigung: Die Erteilung von Untervollmachten ist ausgeschlossen. Die Vollmacht ist strikt persönlich auszuüben.", defaultLineHeight, textFontSize);
    }
    y += defaultLineHeight / 2;

    if (customRegeln.trim() !== "") {
        writeLine("4. Individuelle Einschränkungen / Ergänzungen", defaultLineHeight, "bold", subHeadingFontSize);
        y += spaceAfterParagraph / 2;
        writeParagraph(customRegeln, defaultLineHeight, textFontSize);
        y += defaultLineHeight / 2;
    }

    writeParagraph("Diese Generalvollmacht wird in freiem Willen und bei voller Geschäftsfähigkeit erteilt. Mir ist bewusst, dass sie ein hohes Maß an Vertrauen erfordert. Ich behalte mir das Recht vor, diese Vollmacht jederzeit zu widerrufen. Der Widerruf ist dem Bevollmächtigten gegenüber zu erklären und führt zur Pflicht zur Rückgabe dieser Urkunde.", defaultLineHeight, textFontSize);
    y += defaultLineHeight * 1.5;

    // Unterschriften-Blöcke sauber platzieren
    writeLine("_________________________                ____________________________________________________", defaultLineHeight, "normal", textFontSize);
    writeLine("Ort, Datum", defaultLineHeight + 2, "normal", smallTextFontSize); 
    y -= defaultLineHeight; 
    doc.text("Eigenhändige Unterschrift des Vollmachtgebers", margin + 60, y-2, {fontSize: smallTextFontSize}); 
    y += defaultLineHeight * 2; 

    doc.save("generalvollmacht.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupGeneralvollmacht");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}