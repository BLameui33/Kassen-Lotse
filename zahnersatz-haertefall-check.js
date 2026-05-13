/**
 * Zahnersatz-Härtefall-Check
 * Prüft den Anspruch auf 100 % Kostenübernahme der Regelversorgung
 * anhand von Sozialleistungsbezug oder Haushalts-Bruttoeinkommen.
 * (Werte basieren auf den gesetzlichen Bemessungsgrenzen / Schätzwerten für 2026)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elemente referenzieren
    const radioJa = document.querySelector('input[name="zh_sozialleistung"][value="ja"]');
    const radioNein = document.querySelector('input[name="zh_sozialleistung"][value="nein"]');
    const einkommensBereich = document.getElementById('zh_einkommens_bereich');
    
    const btnBerechnen = document.getElementById('zh_berechnen');
    const btnReset = document.getElementById('zh_reset');
    const ergebnisContainer = document.getElementById('zh_ergebnis');

    // --- UX: Einkommensbereich ein-/ausblenden ---
    function toggleEinkommensBereich() {
        if (radioJa.checked) {
            einkommensBereich.style.display = 'none';
        } else {
            einkommensBereich.style.display = 'block';
        }
    }

    // Event-Listener für die Radio-Buttons
    radioJa.addEventListener('change', toggleEinkommensBereich);
    radioNein.addEventListener('change', toggleEinkommensBereich);
    
    // Initiale Prüfung beim Laden
    toggleEinkommensBereich();

    // Event Listener für Buttons
    btnBerechnen.addEventListener('click', berechneHaertefall);
    
    btnReset.addEventListener('click', () => {
        ergebnisContainer.innerHTML = '';
        setTimeout(toggleEinkommensBereich, 10); // Kurz warten, bis Reset Formularfelder leert
    });

    function berechneHaertefall() {
        // 1. Prüfung: Automatischer Härtefall (Bürgergeld etc.)
        if (radioJa.checked) {
            zeigeErgebnis(
                'Automatischer Härtefall! (100 % Übernahme)',
                'Da Sie Leistungen wie Bürgergeld, Grundsicherung, Sozialhilfe oder BAföG beziehen, gelten Sie gesetzlich als <strong>automatischer Härtefall</strong>. Die Krankenkasse übernimmt <strong>100 % der Kosten für die Regelversorgung</strong> (Standard-Zahnersatz). <br><br><em>Wichtig:</em> Reichen Sie vor Behandlungsbeginn den Heil- und Kostenplan zusammen mit Ihrem aktuellen Bewilligungsbescheid bei der Krankenkasse ein!',
                'success'
            );
            return;
        }

        // 2. Prüfung: Einkommensgrenzen
        const bruttoInput = document.getElementById('zh_brutto').value;
        const partner = parseInt(document.getElementById('zh_angehoerige').value, 10);
        const kinder = parseInt(document.getElementById('zh_kinder').value, 10);

        if (!bruttoInput) {
            zeigeFehler('Bitte geben Sie Ihr monatliches Bruttoeinkommen an.');
            return;
        }

        const einkommen = parseFloat(bruttoInput);
        const anzahlAngehoerige = partner + kinder;

        // Gesetzliche Bemessungsgrenzen (Gültig / Prognostiziert für 2026)
        // Basiswert für Alleinstehende
        let einkommensGrenze = 1582.00; 
        
        // Zuschlag für den 1. Angehörigen (z. B. Partner oder das erste Kind, wenn alleinerziehend)
        if (anzahlAngehoerige > 0) {
            einkommensGrenze += 593.25; 
        }
        
        // Zuschlag für jeden weiteren Angehörigen
        if (anzahlAngehoerige > 1) {
            einkommensGrenze += (anzahlAngehoerige - 1) * 395.50;
        }

        // --- AUSWERTUNG ---
        if (einkommen <= einkommensGrenze) {
            // Unter oder genau auf der Grenze -> 100%
            zeigeErgebnis(
                'Härtefall erfüllt! (100 % Übernahme)',
                `Ihr Bruttoeinkommen von ${einkommen.toFixed(2).replace('.', ',')} € liegt <strong>unterhalb der gesetzlichen Grenze</strong> von ${einkommensGrenze.toFixed(2).replace('.', ',')} € (berechnet für Ihren Haushalt). <br><br>Sie haben Anspruch auf die Härtefallregelung! Die Krankenkasse übernimmt <strong>100 % der Kosten für die Regelversorgung</strong>. Reichen Sie den Heil- und Kostenplan zusammen mit einem Einkommensnachweis bei Ihrer Kasse ein.`,
                'success'
            );
        } else if (einkommen <= einkommensGrenze * 1.3) {
            // Bis zu ca. 30% über der Grenze -> Gleitender Härtefall möglich
            zeigeErgebnis(
                'Gleitende Härtefallregelung möglich!',
                `Ihr Einkommen von ${einkommen.toFixed(2).replace('.', ',')} € liegt zwar leicht über der Grenze für den 100%-Zuschuss (${einkommensGrenze.toFixed(2).replace('.', ',')} €), aber Sie fallen voraussichtlich in die <strong>gleitende Härtefallregelung</strong>.<br><br>Das bedeutet: Sie bekommen zwar nicht alles bezahlt, erhalten aber einen <strong>individuell erhöhten Zuschuss</strong>, der über dem normalen Festzuschuss liegt. Stellen Sie den Antrag bei Ihrer Kasse unbedingt vor Behandlungsbeginn!`,
                'warning'
            );
        } else {
            // Deutlich über der Grenze -> Kein Härtefall
            zeigeErgebnis(
                'Leider kein Härtefall',
                `Ihr Bruttoeinkommen von ${einkommen.toFixed(2).replace('.', ',')} € liegt <strong>über der gesetzlichen Härtefallgrenze</strong> von ${einkommensGrenze.toFixed(2).replace('.', ',')} €. Ein Härtefallantrag wird hier in der Regel abgelehnt.<br><br><em>Tipp:</em> Sie erhalten dennoch den regulären Festzuschuss (60 %). Wenn Sie Ihr <strong>Bonusheft</strong> 10 Jahre lang lückenlos geführt haben, erhöht sich dieser Zuschuss automatisch auf 75 % der Regelversorgung!`,
                'danger'
            );
        }
    }

    // Hilfsfunktion: Fehler anzeigen
    function zeigeFehler(msg) {
        ergebnisContainer.innerHTML = `
            <div class="info-box ergebnis-animation" style="background-color: #fff3f3; border-left: 4px solid #e53935; padding: 15px; margin-top: 15px;">
                <strong>Hinweis:</strong> ${msg}
            </div>`;
    }

    // Hilfsfunktion: Ergebnisbox generieren
    function zeigeErgebnis(titel, text, typ) {
        let bgColor, borderColor, icon;

        switch(typ) {
            case 'success':
                bgColor = '#e8f5e9'; borderColor = '#4caf50'; icon = '✅'; break;
            case 'warning':
                bgColor = '#fff8e1'; borderColor = '#ffb300'; icon = '💡'; break;
            case 'danger':
                bgColor = '#ffebee'; borderColor = '#f44336'; icon = '❌'; break;
            default:
                bgColor = '#e3f2fd'; borderColor = '#2196f3'; icon = 'ℹ️'; break;
        }

        const html = `
            <div class="info-box ergebnis-animation" style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 15px; margin-top: 15px;">
                <h2 style="margin-top: 0; color: #333; font-size: 1.3rem;">${icon} ${titel}</h2>
                <p style="margin-bottom: 0; line-height: 1.5;">${text}</p>
            </div>
        `;
        
        ergebnisContainer.innerHTML = html;
        ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});