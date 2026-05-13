/**
 * Krankengeld-Lücken-Prüfer
 * Berechnet Fristen für die nahtlose AU-Feststellung gem. § 46 SGB V
 * Inklusive Berücksichtigung der Wochenendregelung (Freitag -> Montag)
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente referenzieren
    const form = document.getElementById('kgl-form');
    const btnBerechnen = document.getElementById('kgl_berechnen');
    const btnReset = document.getElementById('kgl_reset');
    const ergebnisContainer = document.getElementById('kgl_ergebnis');

    // Event Listener für Buttons
    btnBerechnen.addEventListener('click', berechneFrist);
    
    btnReset.addEventListener('click', () => {
        // Ergebnis-Container beim Zurücksetzen leeren
        ergebnisContainer.innerHTML = '';
    });

    function berechneFrist() {
        // Werte auslesen
        const auEndeInput = document.getElementById('kgl_au_ende').value;
        const arztTerminInput = document.getElementById('kgl_arzt_termin').value;
        const isArbeitslos = document.getElementById('kgl_arbeitslos').checked;

        // Validierung: Sind beide Daten eingegeben?
        if (!auEndeInput || !arztTerminInput) {
            zeigeFehler('Bitte füllen Sie beide Datumsfelder aus, um die Frist zu prüfen.');
            return;
        }

        // Datumsobjekte erstellen und Uhrzeiten nullen für sauberen Vergleich
        const auEnde = new Date(auEndeInput);
        const arztTermin = new Date(arztTerminInput);
        auEnde.setHours(0, 0, 0, 0);
        arztTermin.setHours(0, 0, 0, 0);

        // Nächsten Werktag nach dem Ende der aktuellen AU berechnen
        const nextWorkingDay = new Date(auEnde);
        const dayOfWeek = auEnde.getDay(); // 0 = Sonntag, 1 = Montag ... 5 = Freitag, 6 = Samstag

        // Wochenend-Logik
        if (dayOfWeek === 5) { 
            // AU endet an einem Freitag -> nächster Werktag ist Montag (+3 Tage)
            nextWorkingDay.setDate(nextWorkingDay.getDate() + 3);
        } else if (dayOfWeek === 6) {
            // AU endet an einem Samstag -> nächster Werktag ist Montag (+2 Tage)
            nextWorkingDay.setDate(nextWorkingDay.getDate() + 2);
        } else {
            // AU endet Sonntag bis Donnerstag -> nächster Werktag ist der nächste Tag (+1 Tag)
            nextWorkingDay.setDate(nextWorkingDay.getDate() + 1);
        }

        // Logik-Auswertung und Ausgabe
        if (arztTermin.getTime() <= auEnde.getTime()) {
            // Termin vor oder am letzten Tag der AU (Idealfall)
            zeigeErgebnis(
                'Sicher ist sicher: Alles im grünen Bereich!',
                'Sie gehen noch vor oder genau am letzten Tag Ihrer aktuellen Krankschreibung zum Arzt. Ihre Folge-AU wird nahtlos festgestellt. Ihr Krankengeldanspruch ist sicher.',
                'success'
            );
        } else if (arztTermin.getTime() === nextWorkingDay.getTime()) {
            // Termin exakt am nächsten Werktag (Frist gewahrt)
            zeigeErgebnis(
                'Frist gewahrt!',
                `Sie gehen am <strong>nächsten Werktag</strong> nach Ende Ihrer Krankschreibung zum Arzt. Das ist laut Gesetz (§ 46 SGB V) rechtzeitig, um Ihren Krankengeldanspruch aufrechtzuerhalten.<br><br><em>Wichtiger Hinweis zu Feiertagen:</em> Fällt dieser Tag auf einen gesetzlichen Feiertag, verschiebt sich die Frist auf den darauffolgenden Werktag. Gehen Sie im Zweifelsfall aber lieber zum ärztlichen Bereitschaftsdienst (116 117), bevor eine Lücke entsteht.`,
                'success'
            );
        } else {
            // Termin ist später als der nächste Werktag -> LÜCKE!
            let warnText = `<strong>Achtung, Krankengeld-Falle!</strong> Es droht eine Lücke in der AU-Feststellung. Sie gehen zu spät zum Arzt. Der rechtzeitige Termin wäre spätestens am <strong>${formatiereDatum(nextWorkingDay)}</strong> gewesen.<br><br>Konsequenz: Das Krankengeld wird für diese Lücke mindestens ruhen (nicht ausgezahlt).`;
            
            if (isArbeitslos) {
                warnText += `<br><br><span style="color: #c62828; font-weight: bold;">🚨 EXTREME GEFAHR FÜR IHREN VERSICHERUNGSSCHUTZ:</span> Da Ihr Arbeitsverhältnis beendet ist oder Sie ALG I beziehen, führt diese Lücke voraussichtlich zum <strong>kompletten und unwiderruflichen Verlust Ihres gesamten Krankengeldanspruchs</strong>. Zudem droht der Verlust Ihrer bisherigen Mitgliedschaft in der Krankenkasse. Sie müssen diesen Termin unbedingt vorverlegen! Notfalls über den kassenärztlichen Bereitschaftsdienst!`;
            } else {
                warnText += `<br><br>Wenn Sie noch in einem ungekündigten Arbeitsverhältnis stehen, entfällt "nur" das Geld für die Lückentage. Bei späterer Kündigung kann diese Lücke aber nachträglich zum Komplett-Aus führen. Bitte versuchen Sie, den Termin vorzuverlegen!`;
            }

            zeigeErgebnis(
                'Vorsicht: Krankengeld-Lücke droht!',
                warnText,
                'danger'
            );
        }
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
        let icon = '✅';

        if (typ === 'danger') {
            bgColor = '#ffebee'; // Rot
            borderColor = '#f44336';
            icon = '⚠️';
        }

        const html = `
            <div class="info-box ergebnis-animation" style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 15px; margin-top: 15px;">
                <h2 style="margin-top: 0; color: #333; font-size: 1.3rem;">${icon} ${titel}</h2>
                <p style="margin-bottom: 0; line-height: 1.5;">${text}</p>
            </div>
        `;
        
        ergebnisContainer.innerHTML = html;
        // Sanftes Scrollen zum Ergebnis
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