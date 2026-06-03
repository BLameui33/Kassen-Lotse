document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('verhinderungspflegeAntragForm');
    const saveBtn = document.getElementById('saveBtnVerhinderungspflege');
    const loadBtn = document.getElementById('loadBtnVerhinderungspflege');
    const closePopupBtn = document.getElementById('closePopupBtnVerhinderungspflege');
    const spendenPopup = document.getElementById('spendenPopupVerhinderungspflege');
    const storageKey = 'verhinderungspflegeAntragFormData_v2'; // Neuer Key für neue Version

    // --- Steuerung der dynamischen Felder ---
    const antragstellerIdentischSelect = document.getElementById('antragstellerIdentischVP');
    const antragstellerDetailsDiv = document.getElementById('antragstellerDetailsVP');
    const anlageVollmachtCheckboxAntrag = document.getElementById('asVollmachtVP');

    const verhinderungGrundSelect = document.getElementById('verhinderungGrund');
    const verhinderungGrundSonstigesDetailsDiv = document.getElementById('verhinderungGrundSonstigesDetails');
    const verhinderungGrundSonstigesTextarea = document.getElementById('verhinderungGrundSonstigesText');

    const ersatzpflegeDurchSelect = document.getElementById('ersatzpflegeDurch');
    const ersatzpflegeNaheAngehoerigeDetailsDiv = document.getElementById('ersatzpflegeNaheAngehoerigeDetails');
    const ersatzpflegeAnderePrivatpersonDetailsDiv = document.getElementById('ersatzpflegeAnderePrivatpersonDetails');
    const ersatzpflegeDienstDetailsDiv = document.getElementById('ersatzpflegeDienstDetails');

    function updateDynamicFieldVisibility(selectElement, detailsDiv, showValue, requiredFieldsIds = [], checkboxToToggleRequired = null) {
        if(!selectElement) return;
        const isVisible = selectElement.value === showValue;
        if(detailsDiv) {
            detailsDiv.style.display = isVisible ? 'block' : 'none';
            detailsDiv.classList.toggle('sub-details-active', isVisible);
        }
        requiredFieldsIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.required = isVisible;
        });
        if (checkboxToToggleRequired) {
             const elCheckbox = document.getElementById(checkboxToToggleRequired.id);
             if(elCheckbox) elCheckbox.required = isVisible;
        }
    }

    // Listener für Antragsteller
    if (antragstellerIdentischSelect && antragstellerDetailsDiv) {
        antragstellerIdentischSelect.addEventListener('change', () => {
             updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameVP', 'asVerhaeltnisVP'], anlageVollmachtCheckboxAntrag);
        });
        // Initial state check
        updateDynamicFieldVisibility(antragstellerIdentischSelect, antragstellerDetailsDiv, 'nein', ['asNameVP', 'asVerhaeltnisVP'], anlageVollmachtCheckboxAntrag);
    }
    
    // Listener für Grund
    if (verhinderungGrundSelect && verhinderungGrundSonstigesDetailsDiv) {
        verhinderungGrundSelect.addEventListener('change', () => {
            const showSonstiges = verhinderungGrundSelect.value === 'Andere wichtige Gründe';
            verhinderungGrundSonstigesDetailsDiv.style.display = showSonstiges ? 'block' : 'none';
            if(verhinderungGrundSonstigesTextarea) verhinderungGrundSonstigesTextarea.required = showSonstiges;
        });
        // Initial Trigger manually if needed, or rely on default hidden
    }

    // Listener für Art der Ersatzpflege
    function updateErsatzpflegeDetailsVisibility() {
        const selectedArt = ersatzpflegeDurchSelect.value;
        
        // Helper to toggle display and required
        const toggleSection = (div, ids, show) => {
            if(div) div.style.display = show ? 'block' : 'none';
            ids.forEach(id => {
                const el = document.getElementById(id);
                if(el) el.required = show;
            });
        };

        toggleSection(ersatzpflegeNaheAngehoerigeDetailsDiv, ['epNameNahe'], selectedArt === 'Nahe Angehörige (bis 2. Grad oder verschwägert)');
        toggleSection(ersatzpflegeAnderePrivatpersonDetailsDiv, ['epNamePrivat'], selectedArt === 'Andere Privatperson (z.B. Nachbar, Freund)');
        toggleSection(ersatzpflegeDienstDetailsDiv, ['dienstName', 'dienstKosten'], (selectedArt === 'Ambulanter Pflegedienst' || selectedArt === 'Stationäre Einrichtung (z.B. Kurzzeitpflegeeinrichtung)'));
    }

    if (ersatzpflegeDurchSelect) {
        ersatzpflegeDurchSelect.addEventListener('change', updateErsatzpflegeDetailsVisibility);
        updateErsatzpflegeDetailsVisibility();
    }

    // --- Speichern & Laden Logik ---
    // Update List: removed vorpflegezeitErfuellt
    const formElementIds = [
        "vpName", "vpGeburt", "vpAdresse", "vpNummer", "vpPflegegrad",
        "antragstellerIdentischVP", "asNameVP", "asVerhaeltnisVP",
        "kasseName", "kasseAdresse",
        "hauptpflegepersonName", "verhinderungGrund", "verhinderungGrundSonstigesText", 
        "verhinderungZeitraumVon", "verhinderungZeitraumBis",
        "ersatzpflegeDurch", 
        "epNameNahe", "epVerwandtschaftNahe", "epKostenFahrtkosten", "epKostenVerdienstausfall",
        "epNamePrivat", "epAnzahlStundenPrivat", "epStundensatzPrivat", "epGesamtkostenPrivat",
        "dienstName", "dienstKosten",
        "vpZeitraumVon", "vpZeitraumBis",
        "iban", "bic", "kontoinhaber",
        "anlageSonstigesVP"
    ];
    const checkboxIdsToSave = [
        "epNachweisVerdienstausfall", "dienstRechnungAnbei", 
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
            if (element && data[id] !== undefined) element.value = data[id];
        });
        checkboxIdsToSave.forEach(id => {
            const element = document.getElementById(id);
            if (element && data[id] !== undefined) element.checked = data[id];
        });
        if(data.anlagen) {
            document.querySelectorAll(`input[name="${anlagenCheckboxName}"]`).forEach(checkbox => {
                checkbox.checked = data.anlagen.includes(checkbox.value);
            });
        }
        
        // Trigger updates
        if (antragstellerIdentischSelect) antragstellerIdentischSelect.dispatchEvent(new Event('change'));
        if (verhinderungGrundSelect) verhinderungGrundSelect.dispatchEvent(new Event('change'));
        if (ersatzpflegeDurchSelect) ersatzpflegeDurchSelect.dispatchEvent(new Event('change'));
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const data = getFormData();
            localStorage.setItem(storageKey, JSON.stringify(data));
            alert('Daten gespeichert.');
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', function() {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                populateForm(JSON.parse(savedData));
                alert('Daten geladen.');
            } else {
                alert('Keine Daten gefunden.');
            }
        });
    }

    // Auto-Load (optional, user friendly)
    const autoLoad = localStorage.getItem(storageKey);
    if(autoLoad) populateForm(JSON.parse(autoLoad));


    // --- Pop-up ---
    if (closePopupBtn && spendenPopup) {
        closePopupBtn.addEventListener('click', () => spendenPopup.style.display = 'none');
    }

    // --- PDF Submit ---
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Validierung: Namen prüfen je nach Pflegeart
            const ersatzpflegeArt = document.getElementById('ersatzpflegeDurch').value;
            if (ersatzpflegeArt.includes('Nahe Angehörige') && !document.getElementById('epNameNahe').value) {
                alert("Bitte Namen der Ersatzpflegeperson angeben."); return;
            }
            if (ersatzpflegeArt.includes('Privatperson') && !document.getElementById('epNamePrivat').value) {
                alert("Bitte Namen der Ersatzpflegeperson angeben."); return;
            }
            
            generateVerhinderungspflegeAntragPDF();
            
            // Show Spenden Popup
            if(spendenPopup) spendenPopup.style.display = 'flex';
        });
    }
});

// ==========================================
// PDF GENERATOR FUNKTION
// ==========================================
function generateVerhinderungspflegeAntragPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Konfiguration
    const margin = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - (2 * margin);
    const usableHeight = pageHeight - margin;
    let y = margin;
    const defaultLineHeight = 6;
    
    // Hilfsfunktionen
    function checkPageBreak(height = defaultLineHeight) {
        if (y + height > usableHeight) {
            doc.addPage();
            y = margin;
        }
    }

    function writeLine(text, isBold = false, fontSize = 11) {
        checkPageBreak();
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.text(text, margin, y);
        y += defaultLineHeight;
    }

    function writeBlock(text, fontSize = 11, fontStyle = "normal") {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", fontStyle);
        const lines = doc.splitTextToSize(text, usableWidth);
        
        if (y + (lines.length * defaultLineHeight) > usableHeight) {
            doc.addPage();
            y = margin;
        }
        
        doc.text(lines, margin, y);
        y += (lines.length * defaultLineHeight) + 2; // +2mm Abstand nach Block
    }

    function addSectionTitle(title) {
        y += 4;
        checkPageBreak();
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        // grauer Balken optional
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 5, usableWidth, 8, 'F');
        doc.text(title, margin + 2, y);
        y += 8;
    }

    // --- Daten auslesen ---
    const vpName = document.getElementById("vpName").value;
    const vpGeburt = new Date(document.getElementById("vpGeburt").value).toLocaleDateString("de-DE");
    const vpAdresse = document.getElementById("vpAdresse").value;
    const vpNummer = document.getElementById("vpNummer").value;
    
    const antragstellerIdentisch = document.getElementById("antragstellerIdentischVP").value;
    const asName = document.getElementById("asNameVP").value;
    const asVerhaeltnis = document.getElementById("asVerhaeltnisVP").value;

    const kasseName = document.getElementById("kasseName").value;
    const kasseAdresse = document.getElementById("kasseAdresse").value;
    
    // --- PDF Aufbau Start ---
    
    // 1. Absender (rechts oben oder links oben über Empfänger)
    doc.setFontSize(11);

    // Absender-Logik (Verfasser/Vertreter oder Versicherter) & Info-Text ermitteln
    let absenderName = vpName;
    let absenderAdresse = vpAdresse;
    let infoText = "";

    if (antragstellerIdentisch === 'nein') {
        absenderName = asName;
        // Kombiniert das Verhältnis und den Namen des Versicherten lesbar
        infoText = `(${asVerhaeltnis}, handelnd für ${vpName})`;
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

    // Zusatz-Info (Verhältnis) rechts drunter setzen, falls ein abweichender Antragsteller aktiv ist
    if (infoText !== "") {
        rightY += 2; // Kleiner Abstand nach der Adresse
        doc.setFont(undefined, "italic");
        doc.setFontSize(9);
        
        // Bricht den Text automatisch um, falls er für die rechte Spalte (60mm) zu lang wird
        let infoLines = doc.splitTextToSize(infoText, 60);
        infoLines.forEach(line => {
            doc.text(line, rightColumnX, rightY);
            rightY += 4; // Kompakter Zeilenabstand für den Info-Text
        });
    }

    // 2. LINKER BLOCK: Kleine Rücksendezeile + Empfänger (Kasse)
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
    
    // Kollisionsschutz: Berücksichtigt das eventuell längere Info-Feld rechts
    let datumY = Math.max(leftY, rightY) + 5; 
    doc.text(datumHeute, pageWidth - margin - datumsBreite, datumY);

    // Übergabe an die globale Y-Koordinate für den nachfolgenden Text
    y = datumY + 12;

    // ==========================================
    // --- UNIFORMER BRIEFKOPF ENDE ---
    // ==========================================

    // 4. Betreff
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Antrag auf Leistungen der Verhinderungspflege / Abrechnung`, margin, y);
    y += 6;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Versicherte Person: ${vpName}, Geb.: ${vpGeburt}, Vers.-Nr.: ${vpNummer}`, margin, y);
    y += 10;

    // 5. Einleitungstext (WICHTIG: PUEG Update)
    const kombiKurzzeit = document.getElementById("kombiKurzzeitpflege").checked;
    
    let antragstext = "Hiermit beantrage ich die Erstattung von Aufwendungen für die Verhinderungspflege für den unten genannten Zeitraum.";
    if (kombiKurzzeit) {
        antragstext += "\n\nIch beantrage zudem die Auszahlung im Rahmen des Gemeinsamen Jahresbetrags für Verhinderungs- und Kurzzeitpflege (§ 42a SGB XI) bis zu 3.539 Euro. Sofern dieser (z.B. aufgrund des Stichtags) noch nicht für mich anwendbar ist, beantrage ich vorsorglich die Übertragung von bis zu 100% (bzw. 806 Euro nach altem Recht bis 1.612 Euro) der ungenutzten Mittel der Kurzzeitpflege auf die Verhinderungspflege.";
    }
    
    writeBlock(antragstext);
    y += 5;

    // 6. Details Verhinderung
    addSectionTitle("Angaben zur Verhinderung");
    const hpName = document.getElementById("hauptpflegepersonName").value;
    const vVon = new Date(document.getElementById("verhinderungZeitraumVon").value).toLocaleDateString("de-DE");
    const vBis = new Date(document.getElementById("verhinderungZeitraumBis").value).toLocaleDateString("de-DE");
    let grund = document.getElementById("verhinderungGrund").value;
    if(grund === 'Andere wichtige Gründe') grund = document.getElementById("verhinderungGrundSonstigesText").value;

    writeLine(`Verhinderte Pflegeperson: ${hpName}`);
    writeLine(`Grund: ${grund}`);
    writeLine(`Zeitraum der Verhinderung: ${vVon} bis ${vBis}`);
    y+=2;

    // 7. Ersatzpflege
    addSectionTitle("Angaben zur Ersatzpflege");
    const eArt = document.getElementById("ersatzpflegeDurch").value;
    const pVon = new Date(document.getElementById("vpZeitraumVon").value).toLocaleDateString("de-DE");
    const pBis = new Date(document.getElementById("vpZeitraumBis").value).toLocaleDateString("de-DE");
    const stdWeise = document.getElementById("vpStundenweise").checked ? "Ja (unter 8 Std/Tag)" : "Nein (ganztägig)";

    writeLine(`Durchgeführt von: ${eArt}`);
    writeLine(`Tatsächlicher Zeitraum: ${pVon} bis ${pBis}`);
    writeLine(`Stundenweise Verhinderung: ${stdWeise}`);
    y += 3;

    // Details je nach Art
    doc.setFont("helvetica", "italic");
    if (eArt.includes("Nahe Angehörige")) {
        const epName = document.getElementById("epNameNahe").value;
        const verw = document.getElementById("epVerwandtschaftNahe").value;
        const fahrt = document.getElementById("epKostenFahrtkosten").value;
        const verdienst = document.getElementById("epKostenVerdienstausfall").value;
        writeLine(`Name: ${epName} (${verw})`);
        if(fahrt) writeLine(`Geltend gemachte Fahrtkosten: ${fahrt} EUR`);
        if(verdienst) writeLine(`Geltend gemachter Verdienstausfall: ${verdienst} EUR`);
    } else if (eArt.includes("Privatperson")) {
        const epName = document.getElementById("epNamePrivat").value;
        const std = document.getElementById("epAnzahlStundenPrivat").value;
        const satz = document.getElementById("epStundensatzPrivat").value;
        const gesamt = document.getElementById("epGesamtkostenPrivat").value;
        writeLine(`Name: ${epName}`);
        writeLine(`${std} Stunden à ${satz} EUR = ${gesamt} EUR Gesamtkosten`);
    } else {
        const dName = document.getElementById("dienstName").value;
        const dKosten = document.getElementById("dienstKosten").value;
        writeLine(`Dienst/Einrichtung: ${dName}`);
        writeLine(`Kosten: ${dKosten} EUR`);
    }
    doc.setFont("helvetica", "normal");
    y += 5;

    // 8. Bankverbindung
    addSectionTitle("Bankverbindung");
    const iban = document.getElementById("iban").value;
    const bic = document.getElementById("bic").value;
    const konto = document.getElementById("kontoinhaber").value;
    writeLine(`IBAN: ${iban}`);
    if(bic) writeLine(`BIC: ${bic}`);
    if(konto) writeLine(`Kontoinhaber: ${konto}`);

    // 9. Anlagen
    y += 5;
    writeLine("Beigefügte Anlagen:", true);
    const anlagenChecks = document.querySelectorAll('input[name="anlagenVerhinderungspflege"]:checked');
    anlagenChecks.forEach(cb => writeLine("- " + cb.value));
    const sonstAnlage = document.getElementById("anlageSonstigesVP").value;
    if(sonstAnlage) writeLine("- " + sonstAnlage);

    // 10. Unterschrift
    y += 20;
    checkPageBreak(30);
    doc.line(margin, y, margin + 80, y);
    doc.setFontSize(10);
    doc.text("Ort, Datum, Unterschrift", margin, y + 5);
    
    // PDF speichern
    const filenameName = vpName.replace(/\s+/g, '_');
    doc.save(`Antrag_Verhinderungspflege_${filenameName}.pdf`);
}