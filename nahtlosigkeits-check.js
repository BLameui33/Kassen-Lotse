/**
 * Nahtlosigkeits-Check & PDF-Generator
 * Erstellt ein rechtssicheres Anschreiben nach § 145 SGB III
 * Zeigt ein Ergebnis auf dem Bildschirm und triggert das Spenden-Popup.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Buttons und Container
    const btnBerechnen = document.getElementById('nl_berechnen');
    const btnReset = document.getElementById('nl_reset');
    const ergebnisContainer = document.getElementById('nl_ergebnis');
    
    // Popup Elemente
    const spendenPopup = document.getElementById('spendenPopupWiderspruchHH');
    const closePopupBtn = document.getElementById('closePopupBtnWiderspruchHH');

    // Event Listener für Buttons
    btnBerechnen.addEventListener('click', generierePDF);
    
    btnReset.addEventListener('click', () => {
        ergebnisContainer.innerHTML = '';
    });

    // Event Listener für Popup schließen
    if (closePopupBtn && spendenPopup) {
        closePopupBtn.addEventListener('click', () => {
            spendenPopup.style.display = 'none';
        });
    }

    function generierePDF() {
        // 1. Pflichtfeld prüfen
        const aussteuerungInput = document.getElementById('nl_aussteuerung').value;
        if (!aussteuerungInput) {
            zeigeFehler('Bitte geben Sie das Datum Ihrer Aussteuerung an.');
            return;
        }

        // 2. Felder auslesen
        const vorname = document.getElementById('nl_vorname').value.trim() || '___________________';
        const nachname = document.getElementById('nl_nachname').value.trim() || '___________________';
        const strasse = document.getElementById('nl_strasse').value.trim() || '___________________';
        const plz = document.getElementById('nl_plz').value.trim() || '_______';
        const ort = document.getElementById('nl_ort').value.trim() || '___________________';
        const kundennummer = document.getElementById('nl_kundennummer').value.trim() || '___________________';
        const rehaAntragGestellt = document.getElementById('nl_reha_antrag').checked;

        // 3. Datum formatieren
        const aussteuerungDatum = formatiereDatum(new Date(aussteuerungInput));
        const heuteDatum = formatiereDatum(new Date());

        let rehaSatz = rehaAntragGestellt 
            ? 'Einen Antrag auf Leistungen zur medizinischen Rehabilitation bzw. auf Erwerbsminderungsrente habe ich bereits beim zuständigen Rentenversicherungsträger gestellt.'
            : 'Sollte ein Antrag auf medizinische Rehabilitation oder Erwerbsminderungsrente erforderlich sein, werde ich diesen selbstverständlich fristgerecht stellen, sobald ich von Ihnen im Rahmen des § 145 Abs. 2 SGB III dazu aufgefordert werde.';

        // --- 4. ERGEBNIS AUF DEM BILDSCHIRM ANZEIGEN ---
        let htmlErgebnis = `
            <div class="info-box ergebnis-animation" style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-top: 15px;">
                <h2 style="margin-top: 0; color: #2e7d32; font-size: 1.3rem;">✅ Anspruch geprüft & Anschreiben erstellt</h2>
                <ul style="margin-bottom: 15px; padding-left: 20px;">
                    <li><strong>Aussteuerungsdatum:</strong> ${aussteuerungDatum} (Ab diesem Tag muss das Arbeitsamt zahlen).</li>
                    <li><strong>Reha-/Rentenantrag:</strong> ${rehaAntragGestellt ? 'Bereits gestellt (sehr gut!).' : 'Muss voraussichtlich nach Aufforderung durch das Amt noch gestellt werden.'}</li>
                </ul>
                <p><strong>Vorschau Ihres wichtigsten Satzes im Antrag:</strong><br>
                <em style="color: #1565c0;">"Ich stelle mich der Arbeitsvermittlung im Rahmen meines verbliebenen gesundheitlichen Restleistungsvermögens... uneingeschränkt zur Verfügung."</em></p>
                <p style="margin-bottom: 0; color: #d32f2f;"><strong>📄 Ihr rechtssicheres PDF wird jetzt heruntergeladen!</strong></p>
            </div>
        `;
        
        ergebnisContainer.innerHTML = htmlErgebnis;
        ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });


        // --- 5. PDF HTML ZUSAMMENBAUEN (Perfekter DIN-Briefkopf) ---
        const pdfHtml = `
            <div style="width: 800px; padding: 50px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #000; background: #fff; box-sizing: border-box;">
                
                <!-- Absenderzeile klein über dem Empfänger (Sichtfenster) -->
                <div style="font-size: 8pt; color: #555; text-decoration: underline; margin-bottom: 10px; margin-top: 20px;">
                    ${vorname !== '___________________' ? vorname : 'Vorname'} ${nachname !== '___________________' ? nachname : 'Nachname'} · ${strasse !== '___________________' ? strasse : 'Straße'} · ${plz !== '_______' ? plz : 'PLZ'} ${ort !== '___________________' ? ort : 'Ort'}
                </div>

                <!-- Empfänger -->
                <div style="margin-bottom: 50px; font-size: 11pt;">
                    Agentur für Arbeit<br>
                    - Leistungsabteilung -<br>
                    <em>(Bitte lokale Adresse der Agentur eintragen)</em><br>
                    __________________________________<br>
                    __________________________________
                </div>

                <!-- Eigene Daten (rechtsbündig) & Datum -->
                <div style="text-align: right; margin-bottom: 30px;">
                    Kundennummer: ${kundennummer}<br>
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
                    Mit freundlichen Grüßen<br><br><br><br>
                    __________________________________<br>
                    (Unterschrift)
                </div>
            </div>
        `;

        // --- 6. SICHERER PDF-DOWNLOAD (Über temporäres DOM-Element) ---
        const opt = {
            margin:       10,
            filename:     'Antrag_Nahtlosigkeit_Aussteuerung.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true }, // useCORS hilft, falls du später mal Logos/Bilder einbaust
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // 1. Temporäres Element erstellen, damit html2canvas die Maße berechnen kann
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = pdfHtml;
        
        // 2. Element aus dem sichtbaren Bereich schieben, aber zwingend im DOM behalten!
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        document.body.appendChild(tempContainer);

        // 3. PDF aus dem echten DOM-Element generieren
        html2pdf().set(opt).from(tempContainer).save().then(() => {
            
            // 4. Aufräumen: Temporäres Element wieder spurlos entfernen
            document.body.removeChild(tempContainer);
            
            // SPENDEN POPUP NACH DOWNLOAD AUFRUFEN
            if (spendenPopup) {
                setTimeout(() => {
                    spendenPopup.style.display = 'flex';
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

    // Hilfsfunktion: Datum formatiert ausgeben (DD.MM.YYYY)
    function formatiereDatum(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    }
});