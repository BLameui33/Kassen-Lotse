/**
 * Hilfsmittel-Kompass & PDF-Spickzettel Generator (Native jsPDF Version)
 * Analysiert Alltagsprobleme und übersetzt diese in konkrete Hilfsmittel-Empfehlungen
 * für das Kassenrezept vom Hausarzt.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Buttons und Container
    const btnBerechnen = document.getElementById('hm_berechnen');
    const btnReset = document.getElementById('hm_reset');
    const ergebnisContainer = document.getElementById('hm_ergebnis');

    // Event Listener
    btnBerechnen.addEventListener('click', generiereKompass);
    
    btnReset.addEventListener('click', () => {
        ergebnisContainer.innerHTML = '';
    });

    function generiereKompass() {
        // --- 1. DATEN AUSLESEN ---
        const wohnsituationRadios = document.querySelector('input[name="hm_wohnsituation"]:checked');
        const wohnsituation = wohnsituationRadios ? wohnsituationRadios.value : 'allein'; // Fallback
        const patName = document.getElementById('hm_pat_name').value.trim() || '_______________________';
        const patGeb = document.getElementById('hm_pat_geb').value.trim() || '______________';

        // Checkboxen sammeln
        let selectedCount = 0;
        let empfehlungen = [];

        // --- 2. LOGIK & ÜBERSETZUNG (Problem -> Hilfsmittel) ---

        // Badezimmer
        if (document.getElementById('hm_bad_wanne') && document.getElementById('hm_bad_wanne').checked) {
            empfehlungen.push({
                kategorie: 'Badezimmer / Körperpflege',
                problem: 'Gefährdeter Ein- und Ausstieg bei der Badewanne.',
                hilfsmittel: 'Badewannenlifter (elektrisch) oder Badewannenbrett'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_bad_dusche') && document.getElementById('hm_bad_dusche').checked) {
            empfehlungen.push({
                kategorie: 'Badezimmer / Körperpflege',
                problem: 'Stehunsicherheit und Schwäche bei der Körperpflege.',
                hilfsmittel: 'Duschstuhl (höhenverstellbar, mit Arm-/Rückenlehne) oder Duschhocker'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_bad_wc') && document.getElementById('hm_bad_wc').checked) {
            empfehlungen.push({
                kategorie: 'Badezimmer / Toilettengang',
                problem: 'Krafteinschränkung beim Aufstehen und Hinsetzen auf der Toilette.',
                hilfsmittel: 'Toilettensitzerhöhung (fest montierbar, idealerweise mit Armlehnen) oder Toilettenstuhl'
            });
            selectedCount++;
        }

        // Bett & Schlafen
        if (document.getElementById('hm_bett_aufrichten') && document.getElementById('hm_bett_aufrichten').checked) {
            empfehlungen.push({
                kategorie: 'Bett / Schlafen',
                problem: 'Eigenständiges Aufrichten aus dem Liegen nicht mehr möglich.',
                hilfsmittel: 'Bettaufrichter (Bettgalgen) oder Bettleiter'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_bett_pflege') && document.getElementById('hm_bett_pflege').checked) {
            let problemText = wohnsituation === 'angehoerige' 
                ? 'Erschwerte Grundpflege im Bett; starke körperliche Rückenbelastung der pflegenden Angehörigen.' 
                : 'Erschwerte Grundpflege im Bett durch ambulante Pflegedienste.';
            
            empfehlungen.push({
                kategorie: 'Bett / Schlafen',
                problem: problemText,
                hilfsmittel: 'Behindertengerechtes Pflegebett (motorisch höhenverstellbar)'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_bett_rausfallen') && document.getElementById('hm_bett_rausfallen').checked) {
            empfehlungen.push({
                kategorie: 'Bett / Schlafen',
                problem: 'Hohe Verletzungsgefahr durch nächtliches Herausfallen.',
                hilfsmittel: 'Pflegebett mit beidseitigen Seitengittern oder Niedrigflurbett (Niederflurbett)'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_bett_matratze') && document.getElementById('hm_bett_matratze').checked) {
            empfehlungen.push({
                kategorie: 'Bett / Schlafen',
                problem: 'Hohes Dekubitusrisiko (Gefahr des Wundliegens) durch Bettlägerigkeit.',
                hilfsmittel: 'Anti-Dekubitus-Matratze (Weichlagerungssystem oder Wechseldruckmatratze)'
            });
            selectedCount++;
        }

        // Mobilität & Sicherheit
        if (document.getElementById('hm_mob_innen') && document.getElementById('hm_mob_innen').checked) {
            empfehlungen.push({
                kategorie: 'Mobilität Innenraum',
                problem: 'Massive Gangunsicherheit im Wohnbereich; Abstützen an Möbeln.',
                hilfsmittel: 'Indoor-Rollator (Zimmerrollator, schmal) oder Vierpunktgehstock'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_mob_sturz') && document.getElementById('hm_mob_sturz').checked) {
            empfehlungen.push({
                kategorie: 'Sicherheit',
                problem: 'Akute Sturzgefahr und Unfähigkeit, nach einem Sturz selbstständig Hilfe zu rufen.',
                hilfsmittel: 'Hausnotrufsystem (als Pflegehilfsmittel über die Pflegekasse) ggf. mit automatischem Sturzsensor'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_mob_demenz') && document.getElementById('hm_mob_demenz').checked) {
            if (wohnsituation === 'angehoerige') {
                empfehlungen.push({
                    kategorie: 'Sicherheit / Überwachung',
                    problem: 'Nächtliche Unruhe/Weglauftendenz. Pflegende Angehörige müssen sofort alarmiert werden.',
                    hilfsmittel: 'Sensormatte / Trittmatte vor dem Bett (mit Funk-Empfänger für Angehörige)'
                });
            } else {
                empfehlungen.push({
                    kategorie: 'Sicherheit / Überwachung',
                    problem: 'Nächtliche Unruhe bei alleinlebender Person (hohes Risiko für unbemerkte Stürze/Verirren).',
                    hilfsmittel: 'Hausnotruf mit Demenz-Ortung / Weglaufschutz-Sensorik'
                });
            }
            selectedCount++;
        }

        // --- 3. VALIDIERUNG ---
        if (selectedCount === 0) {
            zeigeFehler('Bitte kreuzen Sie mindestens ein Problem an, damit wir Empfehlungen generieren können.');
            return;
        }

        // --- 4. ERGEBNIS-ANZEIGE IM BROWSER ---
        let screenListenHtml = '<ul style="margin-top: 15px; margin-bottom: 15px; padding-left: 20px;">';
        empfehlungen.forEach(item => {
            screenListenHtml += `<li><strong>${item.kategorie}:</strong> ${item.hilfsmittel}</li>`;
        });
        screenListenHtml += '</ul>';

        let htmlErgebnis = `
            <div class="info-box ergebnis-animation" style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-top: 15px;">
                <h2 style="margin-top: 0; color: #2e7d32; font-size: 1.3rem;">✅ Analyse erfolgreich: Ihr Spickzettel wird erstellt</h2>
                <p>Wir haben <strong>${selectedCount} sinnvolle Hilfsmittel</strong> anhand Ihrer Angaben identifiziert:</p>
                ${screenListenHtml}
                <p style="margin-bottom: 10px; color: #1565c0;"><strong>📄 Ihr detaillierter Spickzettel für den Arzt wird jetzt als PDF heruntergeladen!</strong> Nehmen Sie dieses Dokument einfach mit zu Ihrem nächsten Arztbesuch.</p>
                <p style="margin-bottom: 0; font-size: 0.9em; color: #555;"><em>Hinweis: Die ärztliche Hoheit liegt natürlich immer bei Ihrem behandelnden Arzt. Diese Liste dient als strukturierte Kommunikationshilfe für die Praxis.</em></p>
            </div>
        `;
        
        ergebnisContainer.innerHTML = htmlErgebnis;
        ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // --- 5. NEUE NATIVE PDF GENERIERUNG (jsPDF) ---
        generierePDF(empfehlungen, patName, patGeb);
    }

    function generierePDF(empfehlungen, patName, patGeb) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const margin = 20;
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const usableHeight = pageHeight - margin;
        let y = margin;
        const defaultLineHeight = 6;
        const spaceAfterParagraph = 4;

        // --- Hilfswerkzeuge für das PDF ---
        function writeLine(text, currentLineHeight = defaultLineHeight, isBold = false, fontSize = 11, align = "left", color = [0,0,0]) {
            if (y + currentLineHeight > usableHeight) { doc.addPage(); y = margin; }
            doc.setFontSize(fontSize);
            doc.setFont(undefined, isBold ? "bold" : "normal");
            doc.setTextColor(color[0], color[1], color[2]);
            
            let x = margin;
            if (align === "center") {
                x = (pageWidth - doc.getTextWidth(text)) / 2;
            }
            doc.text(text, x, y);
            y += currentLineHeight;
            doc.setTextColor(0, 0, 0); // Reset auf Schwarz
        }

        function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = 11, options = {}) {
            const fontStyle = options.fontStyle || "normal";
            const color = options.color || [0,0,0];
            doc.setFontSize(paragraphFontSize);
            doc.setFont(undefined, fontStyle);
            doc.setTextColor(color[0], color[1], color[2]);

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
            doc.setTextColor(0, 0, 0); // Reset auf Schwarz
        }

        const heute = new Date();
        const datumStr = formatiereDatum(heute);

        // --- 1. HEADER (Titel zentriert & blau) ---
        writeLine("Pflege & Hilfsmittel - Gesprächsnotiz", 8, true, 18, "center", [33, 150, 243]);
        writeLine("Strukturierte Übersicht für die hausärztliche Verordnung", 12, false, 10, "center", [100, 100, 100]);
        
        // Blaue Trennlinie
        doc.setDrawColor(33, 150, 243);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // --- 2. PATIENTEN-INFO-BOX (Grau hinterlegt) ---
        doc.setFillColor(249, 249, 249);
        doc.setDrawColor(220, 220, 220);
        doc.rect(margin, y, pageWidth - (2 * margin), 22, 'FD'); // Filled & Stroked
        
        y += 7; // Padding nach unten ins Rechteck
        // Einfache Tabellen-Struktur durch feste X-Werte
        doc.setFontSize(11);
        
        doc.setFont(undefined, "bold");
        doc.text("Patient/in:", margin + 5, y);
        doc.setFont(undefined, "normal");
        doc.text(patName, margin + 45, y);
        y += 6;
        
        doc.setFont(undefined, "bold");
        doc.text("Geburtsdatum:", margin + 5, y);
        doc.setFont(undefined, "normal");
        doc.text(patGeb, margin + 45, y);
        y += 6;
        
        doc.setFont(undefined, "bold");
        doc.text("Analyse-Datum:", margin + 5, y);
        doc.setFont(undefined, "normal");
        doc.text(datumStr, margin + 45, y);
        y += 12; // Abstand unter der Box

        // --- 3. EINLEITUNGSTEXT ---
        writeParagraph("Sehr geehrte/r behandelnde/r Arzt/Ärztin,", defaultLineHeight, 11, {fontStyle: "bold", extraSpacingAfter: 4});
        writeParagraph("zur Sicherung der häuslichen Versorgung, Vermeidung von Stürzen und Erleichterung der Pflege bitten wir um die ärztliche Prüfung und ggf. Verordnung (Muster 16) der nachfolgend aufgeführten Hilfsmittel. Die Liste basiert auf einer aktuellen Analyse der häuslichen Defizite:", defaultLineHeight, 11, {extraSpacingAfter: 10});

        // --- 4. EMPFEHLUNGEN (Die dynamische Liste) ---
        empfehlungen.forEach(item => {
            writeParagraph(`Bereich: ${item.kategorie}`, defaultLineHeight, 11, {fontStyle: "bold", extraSpacingAfter: 2});
            writeParagraph(`Beobachtetes Problem: ${item.problem}`, defaultLineHeight, 11, {extraSpacingAfter: 2});
            
            // Die Verordnung heben wir Rot und Fett hervor
            writeParagraph(`Empfohlene Verordnung: ${item.hilfsmittel}`, defaultLineHeight, 11, {fontStyle: "bold", color: [211, 47, 47], extraSpacingAfter: 5}); 
            
            // Dünne Trennlinie zwischen den Items
            y += 2;
            doc.setDrawColor(238, 238, 238);
            doc.line(margin, y, pageWidth - margin, y);
            y += 6;
        });

        // --- 5. FOOTER (Arzt-Hinweis) ---
        y += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;

        const footerText = "Information für die Praxis: Bitte kreuzen Sie auf dem Rezeptfeld die Ziffer \"7\" (Hilfsmittel) an und vermerken Sie ggf. eine kurze Diagnose (z.B. Gangunsicherheit, Dekubitusrisiko) zur leichteren Genehmigung durch die Krankenkasse. Bei Pflegebetten/Hausnotruf ist in der Regel die Pflegekasse Kostenträger, ein ärztliches Attest bzw. Rezept beschleunigt jedoch die Bewilligung erheblich.";
        writeParagraph(footerText, 5, 9, {color: [100, 100, 100]});

        // --- 6. SPEICHERN ---
        doc.save("Arzt_Spickzettel_Hilfsmittel.pdf");
    }

    // Hilfsfunktion: Fehler anzeigen
    function zeigeFehler(msg) {
        ergebnisContainer.innerHTML = `
            <div class="info-box ergebnis-animation" style="background-color: #fff3f3; border-left: 4px solid #e53935; padding: 15px; margin-top: 15px;">
                <strong>Hinweis:</strong> ${msg}
            </div>`;
    }

    // Hilfsfunktion: Datum formatiert ausgeben (DD.MM.YYYY)
    function formatiereDatum(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    }
});