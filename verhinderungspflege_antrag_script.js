document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('verhinderungspflegeAntragForm');
    const saveBtn = document.getElementById('saveBtnVerhinderungspflege');
    const loadBtn = document.getElementById('loadBtnVerhinderungspflege');
    const closePopupBtn = document.getElementById('closePopupBtnVerhinderungspflege');
    const spendenPopup = document.getElementById('spendenPopupVerhinderungspflege');
    const storageKey = 'verhinderungspflegeAntragFormData';

    // --- Steuerung der dynamischen Felder ---
    const antragstellerIdentischSelect = document.getElementById('antragstellerIdentischVP');
    const antragstellerDetailsDiv = document.getElementById('antragstellerDetailsVP');
    const anlageVollmachtCheckboxAntrag = document.getElementById('asVollmachtVP'); // Checkbox für Vollmacht

    const verhinderungGrundSelect = document.getElementById('verhinderungGrund');
    const verhinderungGrundSonstigesDetailsDiv = document.getElementById('verhinderungGrundSonstigesDetails');
    const verhinderungGrundSonstigesTextarea = document.getElementById('verhinderungGrundSonstigesText');

    const ersatzpflegeDurchSelect = document.getElementById('ersatzpflegeDurch');
    const ersatzpflegeNaheAngehoerigeDetailsDiv = document.getElementById('ersatzpflegeNaheAngehoerigeDetails');
    const ersatzpflegeAnderePrivatpersonDetailsDiv = document.getElementById('ersatzpflegeAnderePrivatpersonDetails');
    const ersatzpflegeDienstDetailsDiv = document.getElementById('ersatzpflegeDienstDetails');

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
             updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameVP', 'asVerhaeltnisVP'], anlageVollmachtCheckboxAntrag);
        });
        updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameVP', 'asVerhaeltnisVP'], anlageVollmachtCheckboxAntrag);
    }
    
    if (verhinderungGrundSelect && verhinderungGrundSonstigesDetailsDiv) {
        verhinderungGrundSelect.addEventListener('change', () => {
            const showSonstiges = verhinderungGrundSelect.value === 'Andere wichtige Gründe';
            verhinderungGrundSonstigesDetailsDiv.style.display = showSonstiges ? 'block' : 'none';
            verhinderungGrundSonstigesDetailsDiv.classList.toggle('sub-details-active', showSonstiges);
            verhinderungGrundSonstigesTextarea.required = showSonstiges;
        });
        updateDynamicFieldVisibility(verhinderungGrundSelect, verhinderungGrundSonstigesDetailsDiv, 'Andere wichtige Gründe', ['verhinderungGrundSonstigesText']);
    }

    function updateErsatzpflegeDetailsVisibility() {
        const selectedArt = ersatzpflegeDurchSelect.value;
        ersatzpflegeNaheAngehoerigeDetailsDiv.style.display = selectedArt === 'Nahe Angehörige (bis 2. Grad oder verschwägert)' ? 'block' : 'none';
        ersatzpflegeNaheAngehoerigeDetailsDiv.classList.toggle('sub-details-active', selectedArt === 'Nahe Angehörige (bis 2. Grad oder verschwägert)');
        document.getElementById('epNameNahe').required = selectedArt === 'Nahe Angehörige (bis 2. Grad oder verschwägert)';
        
        ersatzpflegeAnderePrivatpersonDetailsDiv.style.display = selectedArt === 'Andere Privatperson (z.B. Nachbar, Freund)' ? 'block' : 'none';
        ersatzpflegeAnderePrivatpersonDetailsDiv.classList.toggle('sub-details-active', selectedArt === 'Andere Privatperson (z.B. Nachbar, Freund)');
        document.getElementById('epNamePrivat').required = selectedArt === 'Andere Privatperson (z.B. Nachbar, Freund)';
        
        ersatzpflegeDienstDetailsDiv.style.display = (selectedArt === 'Ambulanter Pflegedienst' || selectedArt === 'Stationäre Einrichtung (z.B. Kurzzeitpflegeeinrichtung)') ? 'block' : 'none';
        ersatzpflegeDienstDetailsDiv.classList.toggle('sub-details-active', (selectedArt === 'Ambulanter Pflegedienst' || selectedArt === 'Stationäre Einrichtung (z.B. Kurzzeitpflegeeinrichtung)'));
        document.getElementById('dienstName').required = (selectedArt === 'Ambulanter Pflegedienst' || selectedArt === 'Stationäre Einrichtung (z.B. Kurzzeitpflegeeinrichtung)');
        document.getElementById('dienstKosten').required = (selectedArt === 'Ambulanter Pflegedienst' || selectedArt === 'Stationäre Einrichtung (z.B. Kurzzeitpflegeeinrichtung)');

    }
    if (ersatzpflegeDurchSelect) {
        ersatzpflegeDurchSelect.addEventListener('change', updateErsatzpflegeDetailsVisibility);
        updateErsatzpflegeDetailsVisibility();
    }

    // --- Speichern & Laden Logik ---
    const formElementIds = [
        "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpPflegegrad", "vpTelefon",
        "antragstellerIdentischVP", "asNameVP", "asVerhaeltnisVP", "asAdresseVP", // asAdresseVP hinzugefügt
        "kasseName", "kasseAdresse",
        "hauptpflegepersonName", "verhinderungGrund", "verhinderungGrundSonstigesText", 
        "verhinderungZeitraumVon", "verhinderungZeitraumBis",
        "ersatzpflegeDurch", 
        "epNameNahe", "epVerwandtschaftNahe", "epKostenFahrtkosten", "epKostenVerdienstausfall",
        "epNamePrivat", "epAnzahlStundenPrivat", "epStundensatzPrivat", "epGesamtkostenPrivat",
        "dienstName", "dienstKosten", "dienstAdresse", // dienstAdresse hinzugefügt
        "vpZeitraumVon", "vpZeitraumBis",
        "iban", "bic", "kontoinhaber",
        "anlageSonstigesVP"
    ];
    const checkboxIdsToSave = [ // einzelne Checkboxen
        "vorpflegezeitErfuellt", "epNachweisVerdienstausfall", "dienstRechnungAnbei", 
        "vpStundenweise", "kombiKurzzeitpflege", "asVollmachtVP"
    ];
    const anlagenCheckboxName = "anlagenVerhinderungspflege";

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

        // Sichtbarkeit nach Laden aktualisieren
        if (antragstellerIdentischSelect) updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameVP', 'asVerhaeltnisVP'], anlageVollmachtCheckboxAntrag);
        if (verhinderungGrundSelect) updateDynamicFieldVisibility(verhinderungGrundSelect, verhinderungGrundSonstigesDetailsDiv, 'Andere wichtige Gründe', ['verhinderungGrundSonstigesText']);
        if (ersatzpflegeDurchSelect) updateErsatzpflegeDetailsVisibility();
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            if (!document.getElementById('vorpflegezeitErfuellt').checked) {
                alert("Bitte bestätigen Sie, dass die Vorpflegezeit von 6 Monaten erfüllt ist, um fortzufahren.");
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
            if (!document.getElementById('vorpflegezeitErfuellt').checked) {
                alert("Die Bestätigung der Vorpflegezeit ist für den Antrag auf Verhinderungspflege erforderlich.");
                return;
            }
            // Weitere Validierungen, z.B. ob je nach Ersatzpflegeart die notwendigen Felder gefüllt sind
            const ersatzpflegeArt = document.getElementById('ersatzpflegeDurch').value;
            if (ersatzpflegeArt === 'Nahe Angehörige (bis 2. Grad oder verschwägert)' && document.getElementById('epNameNahe').value.trim() === "") {
                alert("Bitte geben Sie den Namen der nahen angehörigen Ersatzpflegeperson an."); return;
            }
            if (ersatzpflegeArt === 'Andere Privatperson (z.B. Nachbar, Freund)' && document.getElementById('epNamePrivat').value.trim() === "") {
                alert("Bitte geben Sie den Namen der privaten Ersatzpflegeperson an."); return;
            }
            if ((ersatzpflegeArt === 'Ambulanter Pflegedienst' || ersatzpflegeArt === 'Stationäre Einrichtung (z.B. Kurzzeitpflegeeinrichtung)') && 
                (document.getElementById('dienstName').value.trim() === "" || document.getElementById('dienstKosten').value.trim() === "")) {
                alert("Bitte geben Sie Name und Kosten des Pflegedienstes/der Einrichtung an."); return;
            }

            generateVerhinderungspflegeAntragPDF();
        });
    }
}); // Ende DOMContentLoaded

function generateVerhinderungspflegeAntragPDF() {
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

    const antragstellerIdentischVP = document.getElementById("antragstellerIdentischVP").value;
    const asNameVP = document.getElementById("asNameVP").value;
    const asVerhaeltnisVP = document.getElementById("asVerhaeltnisVP").value;
    const asVollmachtVP = document.getElementById("asVollmachtVP") ? document.getElementById("asVollmachtVP").checked : false;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;

    const hauptpflegepersonName = document.getElementById("hauptpflegepersonName").value;
    let verhinderungGrund = document.getElementById("verhinderungGrund").value;
    if (verhinderungGrund === "Andere wichtige Gründe") {
        verhinderungGrund = document.getElementById("verhinderungGrundSonstigesText").value || "Andere wichtige Gründe";
    }
    const verhinderungZeitraumVonInput = document.getElementById("verhinderungZeitraumVon").value;
    const verhinderungZeitraumVon = verhinderungZeitraumVonInput ? new Date(verhinderungZeitraumVonInput).toLocaleDateString("de-DE") : 'N/A';
    const verhinderungZeitraumBisInput = document.getElementById("verhinderungZeitraumBis").value;
    const verhinderungZeitraumBis = verhinderungZeitraumBisInput ? new Date(verhinderungZeitraumBisInput).toLocaleDateString("de-DE") : 'N/A';

    const ersatzpflegeDurch = document.getElementById("ersatzpflegeDurch").value;
    // Details je nach Ersatzpflegeart
    const epNameNahe = document.getElementById("epNameNahe").value;
    const epVerwandtschaftNahe = document.getElementById("epVerwandtschaftNahe").value;
    const epKostenFahrtkosten = document.getElementById("epKostenFahrtkosten").value;
    const epKostenVerdienstausfall = document.getElementById("epKostenVerdienstausfall").value;
    const epNachweisVerdienstausfall = document.getElementById("epNachweisVerdienstausfall").checked;

    const epNamePrivat = document.getElementById("epNamePrivat").value;
    const epAnzahlStundenPrivat = document.getElementById("epAnzahlStundenPrivat").value;
    const epStundensatzPrivat = document.getElementById("epStundensatzPrivat").value;
    const epGesamtkostenPrivat = document.getElementById("epGesamtkostenPrivat").value;
    
    const dienstName = document.getElementById("dienstName").value;
    const dienstKosten = document.getElementById("dienstKosten").value;
    const dienstRechnungAnbei = document.getElementById("dienstRechnungAnbei").checked;


    const vpZeitraumVonInput = document.getElementById("vpZeitraumVon").value;
    const vpZeitraumVon = vpZeitraumVonInput ? new Date(vpZeitraumVonInput).toLocaleDateString("de-DE") : 'N/A';
    const vpZeitraumBisInput = document.getElementById("vpZeitraumBis").value;
    const vpZeitraumBis = vpZeitraumBisInput ? new Date(vpZeitraumBisInput).toLocaleDateString("de-DE") : 'N/A';
    const vpStundenweise = document.getElementById("vpStundenweise").checked;

    const kombiKurzzeitpflege = document.getElementById("kombiKurzzeitpflege").checked;

    const iban = document.getElementById("iban").value;
    const bic = document.getElementById("bic").value;
    const kontoinhaber = document.getElementById("kontoinhaber").value || (antragstellerIdentischVP === 'nein' && asNameVP.trim() !== "" ? asNameVP : vpName);


    const anlagen = [];
    const anlagenCheckboxes = document.querySelectorAll('input[name="anlagenVerhinderungspflege"]:checked');
    anlagenCheckboxes.forEach(checkbox => {
        if (checkbox.id === "anlageVollmachtVP" && antragstellerIdentischVP === "ja") {}
        else { anlagen.push(checkbox.value); }
    });
    const anlageSonstigesVP = document.getElementById("anlageSonstigesVP").value;
    if (anlageSonstigesVP.trim() !== "") { anlagen.push("Sonstige Anlagen: " + anlageSonstigesVP); }

    // --- PDF-Inhalt erstellen ---
    doc.setFontSize(11);

    // Absender
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    if (antragstellerIdentischVP === 'nein' && asNameVP.trim() !== "") {
        absenderName = asNameVP;
        // Adresse des Antragstellers (falls im Formular vorhanden, aktuell nicht der Fall, daher vpAdresse)
        // absenderAdresse = document.getElementById("asAdresseVP").value; // Wenn ein Feld asAdresseVP existiert
    }
    writeLine(absenderName);
    vpAdresse.split("\n").forEach(line => writeLine(line)); // Immer Adresse der versicherten Person? Oder Antragsteller? Für VP.
     if (antragstellerIdentischVP === 'nein' && asNameVP.trim() !== ""){
         writeParagraph(`(handelnd als ${asVerhaeltnisVP || 'Vertreter/in'} für ${vpName}, geb. ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer})`, defaultLineHeight, 9, {fontStyle: "italic", extraSpacingAfter: defaultLineHeight*0.5});
    }
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else {doc.addPage(); y = margin;}

    // Empfänger, Datum
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
    let betreffText = `Antrag auf Leistungen der Verhinderungspflege gemäß § 39 SGB XI`;
    betreffText += `\nFür: ${vpName}, geb. am ${vpGeburtFormatiert}, Vers.-Nr.: ${vpNummer} (${vpPflegegrad})`;
    
    const betreffFontSize = 12;
    writeParagraph(betreffText, defaultLineHeight, betreffFontSize, {fontStyle: "bold", extraSpacingAfter: defaultLineHeight});

    // Anrede
    writeParagraph("Sehr geehrte Damen und Herren,", defaultLineHeight, 11, {extraSpacingAfter: defaultLineHeight * 0.5});

    // Einleitung
    writeParagraph(`hiermit beantrage ich/beantragen wir für Herrn/Frau ${vpName} Leistungen der Verhinderungspflege.`);
    writeParagraph(`Die Hauptpflegeperson, Herr/Frau ${hauptpflegepersonName || '[Name Hauptpflegeperson]'}, ist/war im Zeitraum vom ${verhinderungZeitraumVon} bis zum ${verhinderungZeitraumBis} aufgrund von "${verhinderungGrund}" an der Pflege gehindert.`);
    writeParagraph("Die Voraussetzung der mindestens sechsmonatigen Vorpflegezeit durch die Hauptpflegeperson ist erfüllt.");

    // Durchführung der Ersatzpflege
    writeLine("Durchführung der Ersatzpflege:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Die Ersatzpflege wurde/wird im Zeitraum vom ${vpZeitraumVon} bis zum ${vpZeitraumBis} wie folgt durchgeführt:`);
    
    if (ersatzpflegeDurch === "Nahe Angehörige (bis 2. Grad oder verschwägert)") {
        writeParagraph(`Durch den/die nahen Angehörigen (bis zum 2. Grad oder verschwägert): ${epNameNahe || '[Name eintragen]'} (${epVerwandtschaftNahe || '[Verwandtschaft eintragen]'}).`);
        if (epKostenFahrtkosten.trim() !== "" && parseFloat(epKostenFahrtkosten) > 0) {
            writeParagraph(`Hierfür werden Fahrtkosten in Höhe von ${parseFloat(epKostenFahrtkosten).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} geltend gemacht.`);
        }
        if (epKostenVerdienstausfall.trim() !== "" && parseFloat(epKostenVerdienstausfall) > 0) {
            writeParagraph(`Zusätzlich wird ein Verdienstausfall in Höhe von ${parseFloat(epKostenVerdienstausfall).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} geltend gemacht.`);
            if (epNachweisVerdienstausfall) writeParagraph("(Ein entsprechender Nachweis über den Verdienstausfall liegt bei.)", defaultLineHeight, 10, {fontStyle:"italic"});
        }
        writeParagraph("Wir bitten um Erstattung bis zur Höhe des 1,5-fachen Pflegegeldes des Pflegegrades " + vpPflegegrad + " bzw. unter Anrechnung der nachgewiesenen Aufwendungen bis zum gesetzlichen Höchstbetrag.", defaultLineHeight, 10);
    } else if (ersatzpflegeDurch === "Andere Privatperson (z.B. Nachbar, Freund)") {
        writeParagraph(`Durch eine andere Privatperson: ${epNamePrivat || '[Name eintragen]'}.`);
        if (epAnzahlStundenPrivat.trim() !== "" && epStundensatzPrivat.trim() !== "") {
            writeParagraph(`Es wurden ${epAnzahlStundenPrivat} Stunden zu einem Stundensatz von ${parseFloat(epStundensatzPrivat).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} geleistet.`);
        }
        if (epGesamtkostenPrivat.trim() !== "") {
            writeParagraph(`Die Gesamtkosten hierfür betragen: ${parseFloat(epGesamtkostenPrivat).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}.`);
        } else {
            writeParagraph("Die Kosten hierfür werden nach Vorlage der entsprechenden Nachweise abgerechnet.");
        }
    } else if (ersatzpflegeDurch === "Ambulanter Pflegedienst" || ersatzpflegeDurch === "Stationäre Einrichtung (z.B. Kurzzeitpflegeeinrichtung)") {
        writeParagraph(`Durch: ${dienstName || '[Name des Dienstes/der Einrichtung eintragen]'}.`);
        if (dienstKosten.trim() !== "") {
            writeParagraph(`Die hierfür entstandenen Kosten betragen laut beiliegender Rechnung/Kostenvoranschlag: ${parseFloat(dienstKosten).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}.`);
        }
        if (dienstRechnungAnbei) writeParagraph("(Die Rechnung/der Kostenvoranschlag liegt bei.)", defaultLineHeight, 10, {fontStyle:"italic"});
    }

    if (vpStundenweise) {
        writeParagraph("Die Verhinderungspflege wurde lediglich stundenweise (weniger als 8 Stunden pro Tag) in Anspruch genommen. Wir bitten um Weiterzahlung des vollen Pflegegeldes bzw. um entsprechende Verrechnung.", defaultLineHeight, 10, {fontStyle:"italic"});
    }

    // Kombination mit Kurzzeitpflege
    if (kombiKurzzeitpflege) {
        writeParagraph("Zusätzlich beantrage ich/beantragen wir die Umwandlung von bis zu 50% des noch nicht verbrauchten Leistungsbetrags der Kurzzeitpflege zur Finanzierung der oben genannten Verhinderungspflegekosten, um den Gesamtanspruch auf bis zu 2.418 Euro zu erhöhen.", defaultLineHeight, 11, {fontStyle:"bold"});
    }

    // Bankverbindung
    writeLine("Bankverbindung für die Erstattung:", defaultLineHeight, true);
    y += spaceAfterParagraph/2;
    writeParagraph(`Kontoinhaber:in: ${kontoinhaber}`);
    writeParagraph(`IBAN: ${iban}`);
    if (bic.trim() !== "") writeParagraph(`BIC: ${bic}`);
    
    // Anlagen
    if (anlagen.length > 0) {
        writeLine("Beigefügte Anlagen:", defaultLineHeight, true);
        y += spaceAfterParagraph / 2;
        anlagen.forEach(anlage => {
            writeParagraph(`- ${anlage}`);
        });
    }
    
    // Abschluss
    writeParagraph("Ich/Wir bitten um Prüfung und Übernahme der entstandenen Kosten im Rahmen der Verhinderungspflege sowie um eine entsprechende Mitteilung.", defaultLineHeight, 11);
    if (y + defaultLineHeight <= usableHeight) y += defaultLineHeight; else { doc.addPage(); y = margin; }

    // Grußformel und Unterschrift
    writeParagraph("Mit freundlichen Grüßen");
    if (y + defaultLineHeight * 1.5 <= usableHeight) y += defaultLineHeight * 1.5; 
    else { doc.addPage(); y = margin + defaultLineHeight * 1.5; }
    writeParagraph(absenderName);

    doc.save("antrag_verhinderungspflege.pdf");

    const spendenPopupElement = document.getElementById("spendenPopupVerhinderungspflege");
    if (spendenPopupElement) {
        spendenPopupElement.style.display = "flex";
    }
}