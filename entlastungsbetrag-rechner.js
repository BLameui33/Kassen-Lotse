/**
 * Entlastungsbetrag-Rechner (131 €) & PDF-Generator
 * Berechnet das Restbudget unter Berücksichtigung des 30. Juni Verfallsdatums.
 * Generiert ein Erstattungsformular für die Pflegekasse.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Buttons und Container
    const btnBerechnen = document.getElementById('eb_berechnen');
    const btnReset = document.getElementById('eb_reset');
    const ergebnisContainer = document.getElementById('eb_ergebnis');
    const pdfTemplate = document.getElementById('eb_pdf_template');

    // Event Listener
    btnBerechnen.addEventListener('click', berechneUndGeneriere);
    
    btnReset.addEventListener('click', () => {
        ergebnisContainer.innerHTML = '';
        pdfTemplate.innerHTML = '';
    });

    function berechneUndGeneriere() {
        // --- 1. DATEN AUSLESEN UND BERECHNEN ---
        const pgMonatInput = document.getElementById('eb_pg_monat').value;
        let restVorjahr = parseFloat(document.getElementById('eb_rest_vorjahr').value) || 0;
        const ausgegebenJahr = parseFloat(document.getElementById('eb_ausgegeben_jahr').value) || 0;

        if (!pgMonatInput) {
            zeigeFehler('Bitte geben Sie an, seit wann der Pflegegrad besteht (Monat/Jahr).');
            return;
        }

        const heute = new Date();
        const aktuellesJahr = heute.getFullYear(); // z.B. 2026
        const aktuellerMonat = heute.getMonth() + 1; // 1-12 (z.B. Mai = 5)

        const [pgJahrStr, pgMonatStr] = pgMonatInput.split('-');
        const pgJahr = parseInt(pgJahrStr, 10);
        const pgMonat = parseInt(pgMonatStr, 10);

        if (pgJahr > aktuellesJahr || (pgJahr === aktuellesJahr && pgMonat > aktuellerMonat)) {
            zeigeFehler('Das angegebene Datum liegt in der Zukunft. Bitte korrigieren.');
            return;
        }

        // Berechnen, wie viele Monate im AKTUELLEN Jahr Anspruch besteht
        let monateDiesesJahr = 0;
        if (pgJahr < aktuellesJahr) {
            // Pflegegrad bestand schon vor diesem Jahr -> Anspruch für alle bisherigen Monate dieses Jahres
            monateDiesesJahr = aktuellerMonat;
        } else {
            // Pflegegrad startete in diesem Jahr
            monateDiesesJahr = aktuellerMonat - pgMonat + 1;
        }

        // Budget für dieses Jahr berechnen (131 € ab 2025)
        const budgetDiesesJahr = monateDiesesJahr * 131.00;

        // Verfalls-Logik (30. Juni)
        let verfallsWarnung = '';
        if (restVorjahr > 0) {
            if (aktuellerMonat <= 6) {
                // Vor dem 1. Juli -> Geld aus dem Vorjahr ist noch da, aber verfällt bald!
                verfallsWarnung = `
                    <div class="info-box ergebnis-animation" style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-top: 15px;">
                        <h2 style="margin-top: 0; color: #c62828; font-size: 1.3rem;">⚠️ Alarm: Ihr Geld verfällt bald!</h2>
                        <p style="margin-bottom: 0;">Sie haben noch <strong>${restVorjahr.toFixed(2).replace('.', ',')} €</strong> aus dem Vorjahr. Dieses Geld verfällt unwiderruflich am <strong>30. Juni ${aktuellesJahr}</strong>! Reichen Sie schnellstens Rechnungen ein, um dieses Guthaben nicht zu verschenken.</p>
                    </div>
                `;
            } else {
                // Ab dem 1. Juli -> Geld ist verfallen.
                verfallsWarnung = `
                    <div class="info-box ergebnis-animation" style="background-color: #fff3f3; border-left: 4px solid #e53935; padding: 15px; margin-top: 15px;">
                        <h2 style="margin-top: 0; color: #c62828; font-size: 1.3rem;">❌ Vorjahres-Budget verfallen</h2>
                        <p style="margin-bottom: 0;">Ihr angegebenes Restbudget von ${restVorjahr.toFixed(2).replace('.', ',')} € aus dem Vorjahr ist am <strong>30. Juni ${aktuellesJahr} verfallen</strong> und wurde in der Berechnung auf 0 € gesetzt.</p>
                    </div>
                `;
                restVorjahr = 0; // Auf 0 setzen, da verfallen
            }
        }

        // Gesamtes verfügbares Restbudget
        const gesamtVerfuegbar = budgetDiesesJahr + restVorjahr - ausgegebenJahr;

        // --- 2. ERGEBNIS-AUSGABE (HTML) ---
        let htmlErgebnis = '';

        if (gesamtVerfuegbar > 0) {
            htmlErgebnis += `
                <div class="info-box ergebnis-animation" style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-top: 15px;">
                    <h2 style="margin-top: 0; color: #2e7d32; font-size: 1.3rem;">✅ Ihr aktuelles Restbudget: ${gesamtVerfuegbar.toFixed(2).replace('.', ',')} €</h2>
                    <ul style="margin-bottom: 0; padding-left: 20px;">
                        <li>Angespartes Budget in ${aktuellesJahr} (bisher ${monateDiesesJahr} Monate): <strong>${budgetDiesesJahr.toFixed(2).replace('.', ',')} €</strong></li>
                        <li>Gültiges Restbudget aus dem Vorjahr: <strong>${restVorjahr.toFixed(2).replace('.', ',')} €</strong></li>
                        <li>Bereits erstattet in diesem Jahr: <strong>- ${ausgegebenJahr.toFixed(2).replace('.', ',')} €</strong></li>
                    </ul>
                </div>
            `;
        } else {
            htmlErgebnis += `
                <div class="info-box ergebnis-animation" style="background-color: #fff8e1; border-left: 4px solid #ffb300; padding: 15px; margin-top: 15px;">
                    <h2 style="margin-top: 0; color: #f57c00; font-size: 1.3rem;">💡 Budget aufgebraucht</h2>
                    <p style="margin-bottom: 0;">Nach unseren Berechnungen haben Sie Ihr aktuell verfügbares Entlastungsbudget von ${budgetDiesesJahr.toFixed(2).replace('.', ',')} € für dieses Jahr bereits vollständig ausgeschöpft oder überschritten. Im nächsten Monat kommen wieder 131 € hinzu.</p>
                </div>
            `;
        }

        // Warnung bei Bedarf anfügen
        htmlErgebnis += verfallsWarnung;

        // --- 3. PDF GENERIERUNG (Falls Rechnungssumme eingegeben) ---
        const rechnungssumme = document.getElementById('eb_rechnungssumme').value;

        if (rechnungssumme && parseFloat(rechnungssumme) > 0) {
            htmlErgebnis += `
                <div class="info-box ergebnis-animation" style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-top: 15px;">
                    <h2 style="margin-top: 0; color: #1565c0; font-size: 1.3rem;">📄 PDF wird erstellt...</h2>
                    <p style="margin-bottom: 0;">Ihr Erstattungsantrag für die Pflegekasse über <strong>${parseFloat(rechnungssumme).toFixed(2).replace('.', ',')} €</strong> wird generiert und heruntergeladen. Bitte unterschreiben Sie das Dokument und legen Sie die Originalrechnungen bei.</p>
                </div>
            `;
            
            // Ergebnis ins DOM laden
            ergebnisContainer.innerHTML = htmlErgebnis;
            ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

            generierePDF();
        } else {
            htmlErgebnis += `
                <div class="info-box ergebnis-animation" style="background-color: #f5f5f5; border-left: 4px solid #9e9e9e; padding: 15px; margin-top: 15px;">
                    <p style="margin-bottom: 0;"><em>Tipp: Wenn Sie im Formular eine Rechnungssumme eingeben, können Sie hier direkt ein fertiges Erstattungsformular für die Pflegekasse als PDF herunterladen.</em></p>
                </div>
            `;
            // Ergebnis ins DOM laden
            ergebnisContainer.innerHTML = htmlErgebnis;
            ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function generierePDF() {
        const vorname = document.getElementById('eb_vorname').value.trim() || '___________________';
        const nachname = document.getElementById('eb_nachname').value.trim() || '___________________';
        const kasse = document.getElementById('eb_kasse').value.trim() || '___________________';
        const versicherungsnummer = document.getElementById('eb_versicherungsnummer').value.trim() || '___________________';
        const rechnungssumme = parseFloat(document.getElementById('eb_rechnungssumme').value).toFixed(2).replace('.', ',');
        const iban = document.getElementById('eb_iban').value.trim() || '__________________________________';
        
        const heute = new Date();
        const datumStr = formatiereDatum(heute);

        const pdfHtml = `
            <div style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; color: #000; background: #fff; padding: 20px;">
                <!-- Absender -->
                <div style="margin-bottom: 40px;">
                    <strong>Absender / Pflegebedürftige Person:</strong><br>
                    ${vorname !== '___________________' ? vorname : 'Vorname:'} ${nachname !== '___________________' ? nachname : 'Nachname:'}<br>
                    Versicherungsnummer: ${versicherungsnummer}
                </div>

                <!-- Empfänger -->
                <div style="margin-bottom: 40px;">
                    <strong>Empfänger:</strong><br>
                    An die Pflegekasse der<br>
                    ${kasse}
                </div>

                <!-- Ort, Datum -->
                <div style="text-align: right; margin-bottom: 30px;">
                    Datum: ${datumStr}
                </div>

                <!-- Betreff -->
                <div style="font-weight: bold; font-size: 14pt; margin-bottom: 25px;">
                    Betreff: Erstattung von Entlastungsleistungen nach § 45b SGB XI
                </div>

                <!-- Anrede -->
                <div style="margin-bottom: 15px;">
                    Sehr geehrte Damen und Herren,
                </div>

                <!-- Textkörper -->
                <div style="text-align: justify; margin-bottom: 15px;">
                    hiermit beantrage ich die Erstattung meiner angefallenen Kosten für anerkannte Angebote zur Unterstützung im Alltag (Entlastungsbetrag nach § 45b SGB XI).
                </div>
                <div style="text-align: justify; margin-bottom: 15px;">
                    Als Anlage übersende ich Ihnen die entsprechenden Rechnungen des zertifizierten Dienstleisters in Höhe von insgesamt:
                </div>
                
                <div style="font-weight: bold; font-size: 14pt; text-align: center; margin: 25px 0; border: 2px solid #000; padding: 10px;">
                    Rechnungssumme: ${rechnungssumme} EUR
                </div>

                <div style="text-align: justify; margin-bottom: 15px;">
                    Bitte erstatten Sie mir diesen Betrag aus meinem verfügbaren Entlastungsbudget (inklusive eventueller Restbudgets aus dem Vorjahr) auf folgendes Konto:
                </div>

                <div style="margin-bottom: 30px; margin-left: 20px;">
                    Kontoinhaber: ${vorname !== '___________________' ? vorname + ' ' + nachname : '___________________'}<br>
                    IBAN: ${iban}
                </div>

                <div style="text-align: justify; margin-bottom: 40px;">
                    Sollte mein Budget nicht für die vollständige Erstattung ausreichen, bitte ich um Überweisung des noch verfügbaren Restbetrags.
                </div>

                <!-- Grußformel -->
                <div style="margin-bottom: 50px;">
                    Mit freundlichen Grüßen<br><br><br><br>
                    __________________________________<br>
                    (Unterschrift der pflegebedürftigen Person<br>
                    oder des gesetzlichen Vertreters)
                </div>
                
                <div style="font-size: 10pt; color: #555;">
                    <strong>Anlagen:</strong> Originalrechnung(en)
                </div>
            </div>
        `;

       const tempContainer = document.createElement('div');
        tempContainer.innerHTML = pdfHtml;
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '0';
        tempContainer.style.left = '-9999px'; 
        tempContainer.style.width = '800px'; 
        document.body.appendChild(tempContainer);

        const opt = {
            margin:       15,
            filename:     'Antrag_Entlastungsbetrag_Erstattung.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, scrollY: 0 }, 
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(tempContainer).save().then(() => {
            document.body.removeChild(tempContainer);
        });
    }

    // Hilfsfunktion: Fehler anzeigen
    function zeigeFehler(msg) {
        ergebnisContainer.innerHTML = `
            <div class="info-box ergebnis-animation" style="background-color: #fff3f3; border-left: 4px solid #e53935; padding: 15px; margin-top: 15px;">
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