/**
 * Hilfsmittel-Kompass & PDF-Spickzettel Generator
 * Analysiert Alltagsprobleme und übersetzt diese in konkrete Hilfsmittel-Empfehlungen
 * für das Kassenrezept vom Hausarzt.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Buttons und Container
    const btnBerechnen = document.getElementById('hm_berechnen');
    const btnReset = document.getElementById('hm_reset');
    const ergebnisContainer = document.getElementById('hm_ergebnis');
    const pdfTemplate = document.getElementById('hm_pdf_template');

    // Event Listener
    btnBerechnen.addEventListener('click', generiereKompass);
    
    btnReset.addEventListener('click', () => {
        ergebnisContainer.innerHTML = '';
        pdfTemplate.innerHTML = '';
    });

    function generiereKompass() {
        // --- 1. DATEN AUSLESEN ---
        const wohnsituation = document.querySelector('input[name="hm_wohnsituation"]:checked').value;
        const patName = document.getElementById('hm_pat_name').value.trim() || '_______________________';
        const patGeb = document.getElementById('hm_pat_geb').value.trim() || '______________';

        // Checkboxen sammeln
        const probleme = document.querySelectorAll('.hm-problem');
        let selectedCount = 0;
        
        let empfehlungen = [];

        // --- 2. LOGIK & ÜBERSETZUNG (Problem -> Hilfsmittel) ---

        // Badezimmer
        if (document.getElementById('hm_bad_wanne').checked) {
            empfehlungen.push({
                kategorie: 'Badezimmer / Körperpflege',
                problem: 'Gefährdeter Ein- und Ausstieg bei der Badewanne.',
                hilfsmittel: 'Badewannenlifter (elektrisch) oder Badewannenbrett'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_bad_dusche').checked) {
            empfehlungen.push({
                kategorie: 'Badezimmer / Körperpflege',
                problem: 'Stehunsicherheit und Schwäche bei der Körperpflege.',
                hilfsmittel: 'Duschstuhl (höhenverstellbar, mit Arm-/Rückenlehne) oder Duschhocker'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_bad_wc').checked) {
            empfehlungen.push({
                kategorie: 'Badezimmer / Toilettengang',
                problem: 'Krafteinschränkung beim Aufstehen und Hinsetzen auf der Toilette.',
                hilfsmittel: 'Toilettensitzerhöhung (fest montierbar, idealerweise mit Armlehnen) oder Toilettenstuhl'
            });
            selectedCount++;
        }

        // Bett & Schlafen
        if (document.getElementById('hm_bett_aufrichten').checked) {
            empfehlungen.push({
                kategorie: 'Bett / Schlafen',
                problem: 'Eigenständiges Aufrichten aus dem Liegen nicht mehr möglich.',
                hilfsmittel: 'Bettaufrichter (Bettgalgen) oder Bettleiter'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_bett_pflege').checked) {
            // Angehörige? Dann wichtiges Argument für die Pflegekasse!
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
        if (document.getElementById('hm_bett_rausfallen').checked) {
            empfehlungen.push({
                kategorie: 'Bett / Schlafen',
                problem: 'Hohe Verletzungsgefahr durch nächtliches Herausfallen.',
                hilfsmittel: 'Pflegebett mit beidseitigen Seitengittern oder Niedrigflurbett (Niederflurbett)'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_bett_matratze').checked) {
            empfehlungen.push({
                kategorie: 'Bett / Schlafen',
                problem: 'Hohes Dekubitusrisiko (Gefahr des Wundliegens) durch Bettlägerigkeit.',
                hilfsmittel: 'Anti-Dekubitus-Matratze (Weichlagerungssystem oder Wechseldruckmatratze)'
            });
            selectedCount++;
        }

        // Mobilität & Sicherheit
        if (document.getElementById('hm_mob_innen').checked) {
            empfehlungen.push({
                kategorie: 'Mobilität Innenraum',
                problem: 'Massive Gangunsicherheit im Wohnbereich; Abstützen an Möbeln.',
                hilfsmittel: 'Indoor-Rollator (Zimmerrollator, schmal) oder Vierpunktgehstock'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_mob_sturz').checked) {
            empfehlungen.push({
                kategorie: 'Sicherheit',
                problem: 'Akute Sturzgefahr und Unfähigkeit, nach einem Sturz selbstständig Hilfe zu rufen.',
                hilfsmittel: 'Hausnotrufsystem (als Pflegehilfsmittel über die Pflegekasse) ggf. mit automatischem Sturzsensor'
            });
            selectedCount++;
        }
        if (document.getElementById('hm_mob_demenz').checked) {
            // Wohnsituation entscheidet das Hilfsmittel!
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
        let htmlErgebnis = `
            <div class="info-box ergebnis-animation" style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-top: 15px;">
                <h2 style="margin-top: 0; color: #2e7d32; font-size: 1.3rem;">✅ Analyse erfolgreich: Ihr Spickzettel wird erstellt</h2>
                <p style="margin-bottom: 10px;">Wir haben <strong>${selectedCount} sinnvolle Hilfsmittel</strong> anhand Ihrer Angaben identifiziert. Ihr PDF wird jetzt generiert. Nehmen Sie dieses Dokument einfach mit zu Ihrem nächsten Arztbesuch.</p>
                <p style="margin-bottom: 0; font-size: 0.9em; color: #555;"><em>Hinweis: Die ärztliche Hoheit liegt natürlich immer bei Ihrem behandelnden Arzt. Diese Liste dient als strukturierte Kommunikationshilfe für die Praxis.</em></p>
            </div>
        `;
        
        ergebnisContainer.innerHTML = htmlErgebnis;
        ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // --- 5. PDF GENERIERUNG ---
        generierePDF(empfehlungen, patName, patGeb);
    }

    function generierePDF(empfehlungen, patName, patGeb) {
        const heute = new Date();
        const datumStr = formatiereDatum(heute);

        // HTML für die Liste der Empfehlungen aufbauen
        let empfehlungenHtml = '';
        empfehlungen.forEach(item => {
            empfehlungenHtml += `
                <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <div style="font-weight: bold; color: #333; margin-bottom: 5px;">Bereich: ${item.kategorie}</div>
                    <div style="margin-bottom: 5px;"><strong>Beobachtetes Problem:</strong> ${item.problem}</div>
                    <div style="color: #d32f2f; font-weight: bold;">Empfohlene Verordnung: ${item.hilfsmittel}</div>
                </div>
            `;
        });

        // PDF Template zusammenbauen (Design als "Arzt-Memo")
        const pdfHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #000; background: #fff; padding: 20px;">
                
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2196f3; padding-bottom: 10px;">
                    <h1 style="font-size: 18pt; margin: 0; color: #2196f3;">Pflege & Hilfsmittel – Gesprächsnotiz</h1>
                    <div style="font-size: 10pt; color: #666; margin-top: 5px;">Strukturierte Übersicht für die hausärztliche Verordnung</div>
                </div>

                <div style="margin-bottom: 30px; background-color: #f9f9f9; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 30%; font-weight: bold; padding: 5px 0;">Patient/in:</td>
                            <td style="padding: 5px 0;">${patName}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; padding: 5px 0;">Geburtsdatum:</td>
                            <td style="padding: 5px 0;">${patGeb}</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; padding: 5px 0;">Datum der Analyse:</td>
                            <td style="padding: 5px 0;">${datumStr}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 20px;">
                    <strong>Sehr geehrte/r behandelnde/r Arzt/Ärztin,</strong><br><br>
                    zur Sicherung der häuslichen Versorgung, Vermeidung von Stürzen und Erleichterung der Pflege bitten wir um die ärztliche Prüfung und ggf. Verordnung (Muster 16) der nachfolgend aufgeführten Hilfsmittel. Die Liste basiert auf einer aktuellen Analyse der häuslichen Defizite:
                </div>

                <div style="margin-top: 30px;">
                    ${empfehlungenHtml}
                </div>

                <div style="margin-top: 40px; font-size: 9pt; color: #777; text-align: justify; border-top: 1px solid #ccc; padding-top: 10px;">
                    <strong>Information für die Praxis:</strong> Bitte kreuzen Sie auf dem Rezeptfeld die Ziffer "7" (Hilfsmittel) an und vermerken Sie ggf. eine kurze Diagnose (z.B. Gangunsicherheit, Dekubitusrisiko) zur leichteren Genehmigung durch die Krankenkasse. Bei Pflegebetten/Hausnotruf ist in der Regel die Pflegekasse Kostenträger, ein ärztliches Attest bzw. Rezept beschleunigt jedoch die Bewilligung erheblich.
                </div>
            </div>
        `;

        pdfTemplate.innerHTML = pdfHtml;
        pdfTemplate.style.display = 'block';

        const opt = {
            margin:       15,
            filename:     'Arzt_Spickzettel_Hilfsmittel.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // PDF generieren und dann das Template wieder verstecken
        html2pdf().set(opt).from(pdfTemplate).save().then(() => {
            pdfTemplate.style.display = 'none';
        });
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