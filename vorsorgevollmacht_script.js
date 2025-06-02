document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('vorsorgevollmachtForm');
    const saveBtn = document.getElementById('saveBtnVorsorgeVM');
    const loadBtn = document.getElementById('loadBtnVorsorgeVM');
    const closePopupBtn = document.getElementById('closePopupBtnVorsorgeVM');
    const spendenPopup = document.getElementById('spendenPopupVorsorgeVM');
    const storageKey = 'vorsorgevollmachtFormData';

    // --- Steuerung der dynamischen Felder für Bevollmächtigte ---
    const addBevollmaechtigterBtn = document.getElementById('addBevollmaechtigterBtn');
    const removeBevollmaechtigterBtn = document.getElementById('removeBevollmaechtigterBtn');
    const bevollmaechtigter2Wrapper = document.getElementById('bevollmaechtigter2Wrapper');
    const vertretungsregelungWrapper = document.getElementById('vertretungsregelungWrapper');

    // --- Steuerung der dynamischen Felder für Antragsteller (falls Vollmachtgeber nicht selbst) ---
    // Diese Logik war im HTML-Entwurf für generator-vorsorgevollmacht.html nicht explizit vorgesehen,
    // da die Vollmacht immer vom Vollmachtgeber selbst erteilt wird.
    // Falls doch ein abweichender "Einreicher" des Formulars erfasst werden soll (was untypisch ist),
    // müsste das HTML ergänzt und hier die Logik hinzugefügt werden.
    // Für die Vorsorgevollmacht selbst ist der Vollmachtgeber immer die handelnde Person.

    // --- Steuerung der dynamischen Felder für frühere Anträge (beim SBA-Antrag, hier nicht relevant)

    if (addBevollmaechtigterBtn && removeBevollmaechtigterBtn && bevollmaechtigter2Wrapper && vertretungsregelungWrapper) {
        addBevollmaechtigterBtn.addEventListener('click', function() {
            bevollmaechtigter2Wrapper.style.display = 'block';
            bevollmaechtigter2Wrapper.classList.add('sub-details-active');
            document.getElementById('bv2Name').required = true; // Zweite Person wird Pflicht
            vertretungsregelungWrapper.style.display = 'block';
            vertretungsregelungWrapper.classList.add('sub-details-active');
            addBevollmaechtigterBtn.style.display = 'none';
            removeBevollmaechtigterBtn.style.display = 'inline-block';
        });

        removeBevollmaechtigterBtn.addEventListener('click', function() {
            bevollmaechtigter2Wrapper.style.display = 'none';
            bevollmaechtigter2Wrapper.classList.remove('sub-details-active');
            document.getElementById('bv2Name').required = false;
            document.getElementById('bv2Name').value = ''; // Felder leeren
            document.getElementById('bv2Geburtsdatum').value = '';
            document.getElementById('bv2Adresse').value = '';
            document.getElementById('bv2Telefon').value = '';
            document.getElementById('bv2Verhaeltnis').value = '';
            
            vertretungsregelungWrapper.style.display = 'none';
            vertretungsregelungWrapper.classList.remove('sub-details-active');
            document.getElementById('vertretungsregelung').value = 'einzeln'; // Auf Standard zurücksetzen

            addBevollmaechtigterBtn.style.display = 'inline-block';
            removeBevollmaechtigterBtn.style.display = 'none';
        });
        // Initialer Zustand, falls bv2Name leer ist und es nicht geladen wurde
        if(document.getElementById('bv2Name').value === '') {
             bevollmaechtigter2Wrapper.style.display = 'none';
             vertretungsregelungWrapper.style.display = 'none';
             removeBevollmaechtigterBtn.style.display = 'none';
             addBevollmaechtigterBtn.style.display = 'inline-block';
        } else { // Falls Daten geladen wurden und bv2Name existiert
             bevollmaechtigter2Wrapper.style.display = 'block';
             vertretungsregelungWrapper.style.display = 'block';
             addBevollmaechtigterBtn.style.display = 'none';
             removeBevollmaechtigterBtn.style.display = 'inline-block';
        }

    }


    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "vgName", "vgGeburtsdatum", "vgAdresse", "vgTelefon",
        "bv1Name", "bv1Geburtsdatum", "bv1Adresse", "bv1Telefon", "bv1Verhaeltnis",
        "bv2Name", "bv2Geburtsdatum", "bv2Adresse", "bv2Telefon", "bv2Verhaeltnis", "vertretungsregelung",
        "ersatzbevollmaechtigterName", "ersatzbevollmaechtigterAdresse",
        "innereBindung", "geltungsbereichEinschraenkung", "untervollmachtErlaubt",
        "geltungTod", "betreuungsverfuegungEnthalten"
    ];
    const checkboxIdsToSave = [ // einzelne Checkboxen
        "eigenhaendigUnterschreiben" // Diese ist required, daher immer true beim Submit
    ];
    const bereichCheckboxName = "vollmachtBereich";


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
        
        data.vollmachtBereich = [];
        document.querySelectorAll(`input[name="${bereichCheckboxName}"]:checked`).forEach(cb => data.vollmachtBereich.push(cb.value));
        
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

        document.querySelectorAll(`input[name="${bereichCheckboxName}"]`).forEach(cb => {
            cb.checked = data.vollmachtBereich && data.vollmachtBereich.includes(cb.value);
        });

        // Sichtbarkeit nach Laden aktualisieren
        if (document.getElementById('bv2Name') && document.getElementById('bv2Name').value.trim() !== '') {
            bevollmaechtigter2Wrapper.style.display = 'block';
            bevollmaechtigter2Wrapper.classList.add('sub-details-active');
            vertretungsregelungWrapper.style.display = 'block';
            vertretungsregelungWrapper.classList.add('sub-details-active');
            if(addBevollmaechtigterBtn) addBevollmaechtigterBtn.style.display = 'none';
            if(removeBevollmaechtigterBtn) removeBevollmaechtigterBtn.style.display = 'inline-block';
        } else {
            if(bevollmaechtigter2Wrapper) bevollmaechtigter2Wrapper.style.display = 'none';
            if(vertretungsregelungWrapper) vertretungsregelungWrapper.style.display = 'none';
            if(addBevollmaechtigterBtn) addBevollmaechtigterBtn.style.display = 'inline-block';
            if(removeBevollmaechtigterBtn) removeBevollmaechtigterBtn.style.display = 'none';
        }
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
            console.error("Fehler beim Laden der Daten aus localStorage für Vorsorgevollmacht:", e);
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
            if (!document.getElementById('eigenhaendigUnterschreiben').checked) {
                alert("Bitte bestätigen Sie, dass Sie das Dokument nach dem Ausdrucken eigenhändig unterschreiben werden.");
                return;
            }
            if (document.querySelectorAll('input[name="vollmachtBereich"]:checked').length === 0) {
                alert("Bitte wählen Sie mindestens einen Bereich aus, für den die Vollmacht gelten soll.");
                return;
            }
            // Validierung für zweite bevollmächtigte Person, wenn sichtbar
            if (bevollmaechtigter2Wrapper.style.display === 'block' && document.getElementById('bv2Name').value.trim() === "") {
                alert("Bitte geben Sie den Namen für die zweite bevollmächtigte Person an oder entfernen Sie sie.");
                document.getElementById('bv2Name').focus();
                return;
            }
            generateVorsorgevollmachtPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateVorsorgevollmachtPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 6; // Etwas geringere Zeilenhöhe für mehr Text pro Seite
    const spaceAfterParagraph = 3; 
    const headingFontSize = 14;
    const subHeadingFontSize = 12;
    const textFontSize = 10;
    const smallTextFontSize = 9;

    function writeLine(text, currentLineHeight = defaultLineHeight, fontStyle = "normal", fontSize = textFontSize) {
        const textToWrite = text === undefined || text === null ? "" : String(text);
        if (y + currentLineHeight > usableHeight - (margin/2)) { // Mehr Puffer unten lassen
             doc.addPage(); y = margin; 
        }
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
            if (y + paragraphLineHeight > usableHeight - (margin/2) ) { 
                doc.addPage(); y = margin; 
            }
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
    const vgName = document.getElementById("vgName").value || "";
    const vgGeburtsdatumInput = document.getElementById("vgGeburtsdatum").value;
    const vgGeburtsdatum = vgGeburtsdatumInput ? new Date(vgGeburtsdatumInput).toLocaleDateString("de-DE") : 'N/A';
    const vgAdresse = document.getElementById("vgAdresse").value || "";
    const vgTelefon = document.getElementById("vgTelefon").value || "";

    const bv1Name = document.getElementById("bv1Name").value || "";
    const bv1GeburtsdatumInput = document.getElementById("bv1Geburtsdatum").value;
    const bv1Geburtsdatum = bv1GeburtsdatumInput ? new Date(bv1GeburtsdatumInput).toLocaleDateString("de-DE") : 'N/A';
    const bv1Adresse = document.getElementById("bv1Adresse").value || "";
    const bv1Telefon = document.getElementById("bv1Telefon").value || "";
    const bv1Verhaeltnis = document.getElementById("bv1Verhaeltnis").value || "";

    const bv2Name = document.getElementById("bv2Name").value || "";
    let bv2Geburtsdatum = '', bv2Adresse = '', bv2Telefon = '', bv2Verhaeltnis = '';
    if (bv2Name.trim() !== "") {
        const bv2GeburtsdatumInput = document.getElementById("bv2Geburtsdatum").value;
        bv2Geburtsdatum = bv2GeburtsdatumInput ? new Date(bv2GeburtsdatumInput).toLocaleDateString("de-DE") : 'N/A';
        bv2Adresse = document.getElementById("bv2Adresse").value || "";
        bv2Telefon = document.getElementById("bv2Telefon").value || "";
        bv2Verhaeltnis = document.getElementById("bv2Verhaeltnis").value || "";
    }
    const vertretungsregelung = document.getElementById("vertretungsregelung").value;

    const ersatzbevollmaechtigterName = document.getElementById("ersatzbevollmaechtigterName").value || "";
    const ersatzbevollmaechtigterAdresse = document.getElementById("ersatzbevollmaechtigterAdresse").value || "";

    const vollmachtBereiche = [];
    document.querySelectorAll('input[name="vollmachtBereich"]:checked').forEach(cb => vollmachtBereiche.push(cb.value));
    
    const innereBindung = document.getElementById("innereBindung").value || "";
    const geltungsbereichEinschraenkung = document.getElementById("geltungsbereichEinschraenkung").value || "";
    const untervollmachtErlaubt = document.getElementById("untervollmachtErlaubt").value;
    const geltungTod = document.getElementById("geltungTod").value;
    const betreuungsverfuegungEnthalten = document.getElementById("betreuungsverfuegungEnthalten").value;

    // --- PDF-Inhalt erstellen ---
    doc.setFont("times", "normal"); // Klassische Schrift für formelle Dokumente

    writeParagraph("Vorsorgevollmacht", defaultLineHeight, headingFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    writeLine("Ich, der/die Vollmachtgeber:in,", defaultLineHeight, "normal", textFontSize);
    writeLine(`${vgName}`, defaultLineHeight, "bold", textFontSize);
    writeLine(`geboren am: ${vgGeburtsdatum}`, defaultLineHeight, "normal", textFontSize);
    vgAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (vgTelefon.trim() !== "") writeLine(`Telefon: ${vgTelefon}`, defaultLineHeight, "normal", textFontSize);
    y += defaultLineHeight;

    writeParagraph("erteile hiermit Vollmacht an:", defaultLineHeight, textFontSize);
    
    writeLine("1. Bevollmächtigte Person:", defaultLineHeight, "bold", subHeadingFontSize);
    writeLine(`${bv1Name}`, defaultLineHeight, "bold", textFontSize);
    writeLine(`geboren am: ${bv1Geburtsdatum}`, defaultLineHeight, "normal", textFontSize);
    bv1Adresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
    if (bv1Telefon.trim() !== "") writeLine(`Telefon: ${bv1Telefon}`, defaultLineHeight, "normal", textFontSize);
    if (bv1Verhaeltnis.trim() !== "") writeLine(`Verhältnis zum Vollmachtgeber: ${bv1Verhaeltnis}`, defaultLineHeight, "normal", textFontSize);
    y += defaultLineHeight;

    if (bv2Name.trim() !== "") {
        writeLine("2. Bevollmächtigte Person:", defaultLineHeight, "bold", subHeadingFontSize);
        writeLine(`${bv2Name}`, defaultLineHeight, "bold", textFontSize);
        writeLine(`geboren am: ${bv2Geburtsdatum}`, defaultLineHeight, "normal", textFontSize);
        bv2Adresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
        if (bv2Telefon.trim() !== "") writeLine(`Telefon: ${bv2Telefon}`, defaultLineHeight, "normal", textFontSize);
        if (bv2Verhaeltnis.trim() !== "") writeLine(`Verhältnis zum Vollmachtgeber: ${bv2Verhaeltnis}`, defaultLineHeight, "normal", textFontSize);
        y += defaultLineHeight;

        writeLine("Regelung zur Vertretung durch Person 1 und Person 2:", defaultLineHeight, "bold", subHeadingFontSize);
        if (vertretungsregelung === "einzeln") {
            writeParagraph("Jede der oben genannten bevollmächtigten Personen (Person 1 und Person 2) ist berechtigt, mich einzeln und unabhängig voneinander in allen nachfolgend genannten Angelegenheiten zu vertreten.", defaultLineHeight, textFontSize);
        } else if (vertretungsregelung === "gemeinsam") {
            writeParagraph("Die oben genannten bevollmächtigten Personen (Person 1 und Person 2) sind nur berechtigt, mich gemeinsam in allen nachfolgend genannten Angelegenheiten zu vertreten.", defaultLineHeight, textFontSize);
        } else if (vertretungsregelung === "reihenfolge") {
            writeParagraph(`Die bevollmächtigte Person 2 darf nur dann für mich handeln, wenn die bevollmächtigte Person 1 rechtlich oder tatsächlich verhindert ist (z.B. durch Krankheit, Tod, Nichterreichbarkeit, eigene Geschäftsunfähigkeit).`, defaultLineHeight, textFontSize);
        }
        y += defaultLineHeight;
    }

    if (ersatzbevollmaechtigterName.trim() !== "") {
        writeLine("Ersatzbevollmächtigte Person:", defaultLineHeight, "bold", subHeadingFontSize);
        writeParagraph(`Sollte(n) die oben genannte(n) bevollmächtigte(n) Person(en) nicht handeln können oder wollen, so benenne ich als Ersatzbevollmächtigte(n):`, defaultLineHeight, textFontSize);
        writeLine(`${ersatzbevollmaechtigterName}`, defaultLineHeight, "bold", textFontSize);
        if (ersatzbevollmaechtigterAdresse.trim() !== "") {
            ersatzbevollmaechtigterAdresse.split("\n").forEach(line => writeLine(line.trim(), defaultLineHeight, "normal", textFontSize));
        }
        writeParagraph("Der/Die Ersatzbevollmächtigte hat die gleichen Rechte und Pflichten wie der/die ursprüngliche(n) Bevollmächtigte(n).", defaultLineHeight, textFontSize);
        y += defaultLineHeight;
    }
    
    writeParagraph("Der/Die Bevollmächtigte (bzw. die Bevollmächtigten gemäß der getroffenen Vertretungsregelung) soll mich in den nachfolgend angekreuzten Bereichen vertreten können. Die Vollmacht wird erteilt für den Fall, dass ich meine Angelegenheiten ganz oder teilweise nicht mehr selbst besorgen kann.", defaultLineHeight, textFontSize);
    y += defaultLineHeight;

    writeLine("Umfang der Vollmacht:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;
    if (vollmachtBereiche.includes("Gesundheitssorge")) {
        writeParagraph("☑ Gesundheitssorge und Pflegebedürftigkeit:\nDer/Die Bevollmächtigte ist berechtigt, in allen Angelegenheiten der Gesundheitssorge und Pflegebedürftigkeit für mich zu entscheiden. Dies umfasst insbesondere die Einwilligung in ärztliche Untersuchungen, Heilbehandlungen oder ärztliche Eingriffe, auch wenn diese mit Lebensgefahr verbunden sein könnten oder schwere gesundheitliche Schäden zu erwarten sind. Er/Sie darf Krankenunterlagen einsehen und Ärzte von ihrer Schweigepflicht entbinden. Er/Sie darf über freiheitsentziehende Maßnahmen (z.B. Bettgitter) im Rahmen der gesetzlichen Bestimmungen entscheiden. Meine Patientenverfügung, falls vorhanden, ist zu beachten.", defaultLineHeight, textFontSize);
    }
    if (vollmachtBereiche.includes("Aufenthalt")) {
        writeParagraph("☑ Aufenthalts- und Wohnungsangelegenheiten:\nDer/Die Bevollmächtigte ist berechtigt, meinen Aufenthalt zu bestimmen, einen Heim- oder Pflegevertrag abzuschließen oder zu kündigen sowie meine Wohnung aufzulösen.", defaultLineHeight, textFontSize);
    }
    if (vollmachtBereiche.includes("Vermoegen")) {
        writeParagraph("☑ Vermögenssorge:\nDer/Die Bevollmächtigte ist berechtigt, mich in allen vermögensrechtlichen Angelegenheiten zu vertreten. Er/Sie darf mein Vermögen verwalten, Zahlungen für mich entgegennehmen und leisten, Verträge abschließen und kündigen. Er/Sie ist von den Beschränkungen des § 181 BGB (Insichgeschäft) befreit. Für Grundstücksgeschäfte, Handelsgewerbe und die Aufnahme von Darlehen kann eine notarielle Beurkundung dieser Vollmacht erforderlich sein.", defaultLineHeight, textFontSize);
    }
    if (vollmachtBereiche.includes("Behoerden")) {
        writeParagraph("☑ Vertretung gegenüber Behörden, Versicherungen, Gerichten und sonstigen Institutionen:\nDer/Die Bevollmächtigte darf mich gegenüber Behörden, Versicherungen, Renten- und Sozialleistungsträgern sowie vor Gerichten vertreten, Anträge stellen, Rechtsmittel einlegen und Schriftverkehr führen.", defaultLineHeight, textFontSize);
    }
    if (vollmachtBereiche.includes("Post")) {
        writeParagraph("☑ Post und Telekommunikation:\nDer/Die Bevollmächtigte darf meine Post entgegennehmen, öffnen und erledigen sowie Verträge im Bereich der Telekommunikation für mich abschließen oder kündigen.", defaultLineHeight, textFontSize);
    }
    y += defaultLineHeight;

    writeLine("Weisungen, Beschränkungen und Wünsche:", defaultLineHeight, "bold", subHeadingFontSize);
     y += spaceAfterParagraph / 2;
    if (innereBindung.trim() !== "") {
        writeParagraph(`Folgende Anweisungen und Wünsche für das Innenverhältnis sind von dem/den Bevollmächtigten zu beachten:\n${innereBindung}`, defaultLineHeight, textFontSize);
    } else {
        writeParagraph("Es werden keine spezifischen Anweisungen für das Innenverhältnis gegeben, der/die Bevollmächtigte(n) soll(en) nach bestem Wissen und Gewissen in meinem Sinne handeln.", defaultLineHeight, textFontSize, {fontStyle:"italic"});
    }
    if (geltungsbereichEinschraenkung.trim() !== "") {
        writeParagraph(`Folgende Angelegenheiten sind von dieser Vollmacht ausdrücklich ausgenommen bzw. unterliegen folgenden Beschränkungen:\n${geltungsbereichEinschraenkung}`, defaultLineHeight, textFontSize);
    }
    
    let untervollmachtText = "Der/Die Bevollmächtigte darf keine Untervollmachten erteilen.";
    if (untervollmachtErlaubt === "ja") {
        untervollmachtText = "Der/Die Bevollmächtigte darf für einzelne Angelegenheiten Untervollmachten erteilen.";
    } else if (untervollmachtErlaubt === "ja_umfassend") {
        untervollmachtText = "Der/Die Bevollmächtigte darf umfassend Untervollmachten erteilen.";
    }
    writeParagraph(untervollmachtText, defaultLineHeight, textFontSize);
    y += defaultLineHeight;
    
    writeLine("Geltung der Vollmacht und Schlussbestimmungen:", defaultLineHeight, "bold", subHeadingFontSize);
    y += spaceAfterParagraph / 2;
    let geltungTodText = "Diese Vollmacht erlischt mit meinem Tod.";
    if (geltungTod === "ja") {
        geltungTodText = "Diese Vollmacht gilt über meinen Tod hinaus.";
    }
    writeParagraph(geltungTodText, defaultLineHeight, textFontSize);

    if (betreuungsverfuegungEnthalten === "ja") {
        writeParagraph("Sollte trotz dieser Vollmacht eine gesetzliche Betreuung erforderlich werden, so wünsche ich, dass die in dieser Urkunde genannte(n) bevollmächtigte(n) Person(en) (in der genannten Reihenfolge bzw. Vertretungsregelung) vom Betreuungsgericht als Betreuer bestellt werden. Diese Vollmacht dient insoweit auch als Betreuungsverfügung.", defaultLineHeight, textFontSize);
    }
    writeParagraph("Diese Vollmacht ist Ausdruck meines freien Willens und wurde bei voller Geschäftsfähigkeit erteilt. Sie ist jederzeit widerruflich.", defaultLineHeight, textFontSize);
    writeParagraph("Ich bin mir der Reichweite und der Konsequenzen dieser Vollmacht bewusst. Ich wurde darauf hingewiesen, dass für bestimmte Rechtsgeschäfte (insbesondere im Grundstücks- und Gesellschaftsrecht sowie bei Darlehensaufnahmen) eine notarielle Beurkundung dieser Vollmacht erforderlich sein kann.", defaultLineHeight, smallTextFontSize, {fontStyle:"italic"});
    y += defaultLineHeight * 2;

    writeLine("_________________________                ____________________________________________________", defaultLineHeight, "normal", textFontSize);
    writeLine("Ort, Datum", defaultLineHeight + 2, "normal", smallTextFontSize); // Mehr Platz für Unterschrift
    y -= defaultLineHeight; // Korrektur für nächste Zeile, damit Unterschrift und Name auf gleicher "Höhe" sind
    doc.text("Unterschrift des/der Vollmachtgeber:in", margin + 60, y-2, {fontSize: smallTextFontSize}); // Etwas nach rechts verschoben
    y += defaultLineHeight * 2; // Platz für Unterschrift

    // Bestätigung der Bevollmächtigten (optional, aber gute Praxis)
    y += defaultLineHeight * 2;
    writeParagraph("Zur Kenntnis genommen und mit der Übernahme der Bevollmächtigung einverstanden:", defaultLineHeight, textFontSize, {fontStyle:"italic", extraSpacingAfter:defaultLineHeight});
    
    writeLine("_________________________                ____________________________________________________", defaultLineHeight, "normal", textFontSize);
    writeLine("Ort, Datum", defaultLineHeight + 2, "normal", smallTextFontSize);
    y -= defaultLineHeight;
    doc.text(`Unterschrift der bevollmächtigten Person 1 (${bv1Name})`, margin + 60, y-2, {fontSize: smallTextFontSize});
    y += defaultLineHeight * 2;

    if (bv2Name.trim() !== "") {
        y += defaultLineHeight;
        writeLine("_________________________                ____________________________________________________", defaultLineHeight, "normal", textFontSize);
        writeLine("Ort, Datum", defaultLineHeight + 2, "normal", smallTextFontSize);
        y -= defaultLineHeight;
        doc.text(`Unterschrift der bevollmächtigten Person 2 (${bv2Name})`, margin + 60, y-2, {fontSize: smallTextFontSize});
        y += defaultLineHeight * 2;
    }

    doc.save("vorsorgevollmacht.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupVorsorgeVM");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}