/**
 * Nahtlosigkeits-Check & PDF-Generator
 * Erstellt ein rechtssicheres Anschreiben nach § 145 SGB III
 * und triggert das Spenden-Popup.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Buttons und Container
    const btnBerechnen = document.getElementById('nl_berechnen');
    const btnReset = document.getElementById('nl_reset');
    const ergebnisContainer = document.getElementById('nl_ergebnis');
    const pdfTemplate = document.getElementById('nl_pdf_template');
    
    // Popup Elemente
    const spendenPopup = document.getElementById('spendenPopupWiderspruchHH');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchHH');

    // Event Listener für Buttons
    btnBerechnen.addEventListener('click', generierePDF);
    
    btnReset.addEventListener('click', () => {
        ergebnisContainer.innerHTML = '';
        pdfTemplate.innerHTML = '';
    });

    // Event Listener für Popup schließen
    if (closePopupBtn && spendenPopup) {
        closePopupBtn.addEventListener('click', () => {
            spendenPopup.style.display = 'none';
        });
    }

    function generierePDF() {
        // Pflichtfeld prüfen
        const aussteuerungInput = document.getElementById('nl_aussteuerung').value;
        if (!aussteuerungInput) {
            zeigeFehler('Bitte geben Sie das Datum Ihrer Aussteuerung an.');
            return;
        }

        // Optionale Felder auslesen
        const vorname = document.getElementById('nl_vorname').value.trim() || '___________________';
        const nachname = document.getElementById('nl_nachname').value.trim() || '___________________';
        const strasse = document.getElementById('nl_strasse').value.trim() || '___________________';
        const plz = document.getElementById('nl_plz').value.trim() || '_______';
        const ort = document.getElementById('nl_ort').value.trim() || '___________________';
        const kundennummer = document.getElementById('nl_kundennummer').value.trim() || '___________________';
        
        const rehaAntragGestellt = document.getElementById('nl_reha_antrag').checked;

        // Datum formatieren
        const aussteuerungDatum = formatiereDatum(new Date(aussteuerungInput));
        const heuteDatum = formatiereDatum(new Date());

        // --- RECHTSSICHERER TEXT ---
        let rehaSatz = rehaAntragGestellt 
            ? 'Einen Antrag auf Leistungen zur medizinischen Rehabilitation bzw. auf Erwerbsminderungsrente habe ich bereits beim zuständigen Rentenversicherungsträger gestellt.'
            : 'Sollte ein Antrag auf medizinische Rehabilitation oder Erwerbsminderungsrente erforderlich sein, werde ich diesen selbstverständlich fristgerecht stellen, sobald ich von Ihnen im Rahmen des § 145 Abs. 2 SGB III dazu aufgefordert werde.';

        // PDF HTML zusammenbauen
        const pdfHtml = `
            <div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #000; background: #fff; padding: 20px;">
                <!-- Absender -->
                <div style="margin-bottom: 40px;">
                    ${vorname !== '___________________' ? vorname : 'Vorname:'} ${nachname !== '___________________' ? nachname : 'Nachname:'}<br>
                    ${strasse !== '___________________' ? strasse : 'Straße:'}<br>
                    ${plz !== '_______' ? plz : 'PLZ:'} ${ort !== '___________________' ? ort : 'Ort:'}<br><br>
                    Kundennummer: ${kundennummer}
                </div>

                <!-- Empfänger -->
                <div style="margin-bottom: 40px;">
                    Agentur für Arbeit<br>
                    - Leistungsabteilung -<br>
                    <em>(Bitte lokale Adresse der Agentur eintragen)</em><br>
                    __________________________________<br>
                    __________________________________
                </div>

                <!-- Ort, Datum -->
                <div style="text-align: right; margin-bottom: 30px;">
                    ${ort !== '___________________' ? ort : 'Ort'}, den ${heuteDatum}
                </div>

                <!-- Betreff -->
                <div style="font-weight: bold; font-size: 12pt; margin-bottom: 25px;">
                    Betreff: Antrag auf Arbeitslosengeld gemäß Nahtlosigkeitsregelung (§ 145 SGB III) wegen Aussteuerung aus dem Krankengeld
                </div>

                <!-- Anrede -->
                <div style="margin-bottom: 15px;">
                    Sehr geehrte Damen und Herren,
                </div>

                <!-- Textkörper -->
                <div style="text-align: justify; margin-bottom: 15px;">
                    hiermit melde ich mich arbeitslos und beantrage Arbeitslosengeld I nach der Aussteuerung aus dem Krankengeld gemäß der Nahtlosigkeitsregelung (§ 145 SGB III).
                </div>
                <div style="text-align: justify; margin-bottom: 15px;">
                    Mein Anspruch auf Krankengeld bei meiner zuständigen Krankenkasse endet am <strong>${aussteuerungDatum}</strong> (Aussteuerung). Eine entsprechende Bescheinigung der Krankenkasse liegt bei bzw. wird schnellstmöglich nachgereicht.
                </div>
                
                <!-- DER WICHTIGSTE SATZ FÜR DAS ARBEITSAMT! -->
                <div style="text-align: justify; margin-bottom: 15px; font-weight: bold;">
                    Ich stelle mich der Arbeitsvermittlung im Rahmen meines verbliebenen gesundheitlichen Restleistungsvermögens, welches durch Ihren Ärztlichen Dienst festzustellen ist, uneingeschränkt zur Verfügung.
                </div>

                <div style="text-align: justify; margin-bottom: 15px;">
                    ${rehaSatz}
                </div>

                <div style="text-align: justify; margin-bottom: 30px;">
                    Bitte übersenden Sie mir die erforderlichen Antragsunterlagen sowie den Gesundheitsfragebogen und die Schweigepflichtentbindungen zur Feststellung meiner Leistungsfähigkeit durch den Ärztlichen Dienst der Bundesagentur für Arbeit.
                </div>

                <!-- Grußformel -->
                <div style="margin-bottom: 50px;">
                    Mit freundlichen Grüßen<br><br><br>
                    __________________________________<br>
                    (Unterschrift)
                </div>
            </div>
        `;

        // Ins DOM einfügen
        pdfTemplate.innerHTML = pdfHtml;
        pdfTemplate.style.display = 'block'; // Kurz sichtbar für html2pdf

        // Erfolgsmeldung im Browser anzeigen
        zeigeErgebnis(
            'Ihr PDF wird generiert!',
            'Das rechtssichere Anschreiben wird nun heruntergeladen. <strong>Ganz wichtig:</strong> Behalten Sie in Gesprächen mit der Arbeitsagentur unbedingt den Wortlaut aus dem Brief bei ("Ich stelle mich im Rahmen meines Restleistungsvermögens zur Verfügung").',
            'success'
        );

        // PDF generieren und speichern
        const opt = {
            margin:       10,
            filename:     'Antrag_Nahtlosigkeit_Aussteuerung.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(pdfTemplate).save().then(() => {
            pdfTemplate.style.display = 'none'; // Template wieder verstecken
            
            // SPENDEN POPUP NACH DOWNLOAD AUFRUFEN
            if (spendenPopup) {
                // Ein kleines Delay, damit der Download-Dialog im Browser nicht gestört wird
                setTimeout(() => {
                    spendenPopup.style.display = 'flex'; // 'flex' für Zentrierung (falls in deinem CSS so angelegt), sonst 'block'
                }, 1000);
            }
        });
    }

    // Hilfsfunktion: Fehler anzeigen
    function zeigeFehler(msg) {
        ergebnisContainer.innerHTML = `
            <div class="info-box" style="background-color: #fff3f3; border-left: 4px solid #e53935; padding: 15px;">
                <strong>Fehler:</strong> ${msg}
            </div>`;
    }

    // Hilfsfunktion: Ergebnisbox generieren
    function zeigeErgebnis(titel, text, typ) {
        let bgColor = '#e8f5e9'; // Grün
        let borderColor = '#4caf50';
        let icon = '📄';

        const html = `
            <div class="info-box ergebnis-animation" style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 15px; margin-top: 15px;">
                <h2 style="margin-top: 0; color: #333; font-size: 1.3rem;">${icon} ${titel}</h2>
                <p style="margin-bottom: 0; line-height: 1.5;">${text}</p>
            </div>
        `;
        
        ergebnisContainer.innerHTML = html;
        ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Hilfsfunktion: Datum formatiert ausgeben (DD.MM.YYYY)
    function formatiereDatum(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    }
});