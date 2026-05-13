/**
 * Nachteilsausgleich-Übersetzer
 * Wertet GdB und Merkzeichen aus und listet konkrete finanzielle/alltägliche Vorteile auf.
 * Stand der steuerlichen Werte: ab 2021 (gültig für 2026).
 */

document.addEventListener('DOMContentLoaded', () => {
    // Buttons und Ausgabe-Container
    const btnBerechnen = document.getElementById('na_berechnen');
    const btnReset = document.getElementById('na_reset');
    const ergebnisContainer = document.getElementById('na_ergebnis');

    // Event Listener
    btnBerechnen.addEventListener('click', berechneVorteile);
    
    btnReset.addEventListener('click', () => {
        ergebnisContainer.innerHTML = '';
    });

    function berechneVorteile() {
        // 1. GdB auslesen
        const gdb = parseInt(document.getElementById('na_gdb').value, 10);

        // 2. Merkzeichen auslesen (als Booleans)
        const mzG = document.getElementById('na_mz_g').checked;
        const mzaG = document.getElementById('na_mz_ag').checked;
        const mzB = document.getElementById('na_mz_b').checked;
        const mzH = document.getElementById('na_mz_h').checked;
        const mzBl = document.getElementById('na_mz_bl').checked;
        const mzGl = document.getElementById('na_mz_gl').checked;
        const mzRF = document.getElementById('na_mz_rf').checked;

        // Validierung
        if (gdb === 0 && !mzG && !mzaG && !mzB && !mzH && !mzBl && !mzGl && !mzRF) {
            zeigeFehler('Bitte geben Sie einen GdB ab 20 an oder wählen Sie mindestens ein Merkzeichen aus.');
            return;
        }

        // --- BERECHNUNG DER VORTEILE ---
        let htmlErgebnis = '';

        // Kategorie 1: Steuern (Behinderten-Pauschbetrag)
        htmlErgebnis += generiereSteuerVorteile(gdb, mzH, mzBl);

        // Kategorie 2: Arbeit & Beruf
        htmlErgebnis += generiereBerufVorteile(gdb);

        // Kategorie 3: Mobilität (Auto & ÖPNV)
        htmlErgebnis += generiereMobilitaetsVorteile(mzG, mzaG, mzH, mzBl, mzGl);

        // Kategorie 4: Alltag, Pflege & Freizeit
        htmlErgebnis += generiereAlltagVorteile(mzB, mzRF, gdb);

        // Ausgabe in den Container schreiben und dorthin scrollen
        ergebnisContainer.innerHTML = htmlErgebnis;
        ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- HILFSFUNKTIONEN FÜR DIE KATEGORIEN ---

    function generiereSteuerVorteile(gdb, mzH, mzBl) {
        let pauschbetrag = 0;
        let text = '';

        // Erhöhter Pauschbetrag für H oder Bl überschreibt den GdB-Satz
        if (mzH || mzBl) {
            pauschbetrag = 7400;
            text = `Weil Sie das Merkzeichen <strong>H</strong> oder <strong>Bl</strong> haben, steht Ihnen der höchste Behinderten-Pauschbetrag zu, unabhängig von der Höhe Ihres GdB.`;
        } else {
            // Normale GdB-Tabelle (seit 2021 verdoppelt, gültig 2026)
            switch (gdb) {
                case 20: pauschbetrag = 384; break;
                case 30: pauschbetrag = 620; break;
                case 40: pauschbetrag = 860; break;
                case 50: pauschbetrag = 1140; break;
                case 60: pauschbetrag = 1440; break;
                case 70: pauschbetrag = 1780; break;
                case 80: pauschbetrag = 2120; break;
                case 90: pauschbetrag = 2460; break;
                case 100: pauschbetrag = 2840; break;
                default: pauschbetrag = 0;
            }
            if (pauschbetrag > 0) {
                text = `Basierend auf Ihrem GdB von ${gdb} erhalten Sie diesen jährlichen Freibetrag.`;
            }
        }

        if (pauschbetrag > 0) {
            return `
                <div class="info-box" style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-bottom: 15px;">
                    <h3 style="margin-top: 0; color: #2e7d32; display: flex; align-items: center; gap: 8px;">
                        <span>💶</span> Steuerfreibetrag: ${pauschbetrag.toLocaleString('de-DE')} € pro Jahr
                    </h3>
                    <p style="margin-bottom: 0;">${text} Dieser Betrag mindert Ihr zu versteuerndes Einkommen. Sie können ihn bei der Steuererklärung angeben oder sich direkt auf der Lohnsteuerkarte als Freibetrag eintragen lassen (mehr Netto vom Brutto).</p>
                </div>
            `;
        }
        return '';
    }

    function generiereBerufVorteile(gdb) {
        if (gdb < 30) return ''; // Keine besonderen beruflichen Vorteile unter 30

        let vorteile = [];
        
        if (gdb >= 50) {
            vorteile.push('<strong>Zusatzurlaub:</strong> Sie haben Anspruch auf eine zusätzliche bezahlte Urlaubswoche pro Jahr (bei einer 5-Tage-Woche sind das <strong>5 Tage extra</strong>).');
            vorteile.push('<strong>Kündigungsschutz:</strong> Sie genießen den besonderen Kündigungsschutz. Ihr Arbeitgeber muss vor einer Kündigung das Integrationsamt einschalten.');
            vorteile.push('<strong>Mehrarbeit:</strong> Auf Verlangen können Sie sich von der Ableistung von Überstunden befreien lassen.');
        } else if (gdb === 30 || gdb === 40) {
            vorteile.push('<strong>Gleichstellung:</strong> Sie können bei der Arbeitsagentur eine Gleichstellung beantragen. Wird diese genehmigt, erhalten Sie den gleichen <strong>Kündigungsschutz</strong> wie Schwerbehinderte (jedoch <em>keinen</em> Zusatzurlaub).');
        }

        return `
            <div class="info-box" style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-bottom: 15px;">
                <h3 style="margin-top: 0; color: #1565c0; display: flex; align-items: center; gap: 8px;">
                    <span>💼</span> Vorteile in Arbeit & Beruf
                </h3>
                <ul style="margin-bottom: 0; padding-left: 20px;">
                    ${vorteile.map(v => `<li style="margin-bottom: 5px;">${v}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    function generiereMobilitaetsVorteile(mzG, mzaG, mzH, mzBl, mzGl) {
        let items = [];

        // KFZ-Steuer und ÖPNV
        if (mzaG || mzH || mzBl) {
            items.push('<strong>Kfz-Steuer: 100 % Befreiung.</strong> Sie zahlen gar keine Kfz-Steuer mehr.');
            items.push('<strong>ÖPNV: Kostenlose Freifahrt.</strong> Sie erhalten die Wertmarke für Bus und Bahn komplett kostenlos (statt 91 €/Jahr). Sie dürfen also kostenlos ÖPNV fahren <em>und</em> haben die Kfz-Befreiung.');
        } else if (mzG || mzGl) {
            items.push('<strong>Entscheidung gefragt (Kfz oder ÖPNV):</strong> Sie haben die Wahl! Entweder Sie nutzen die <strong>50 % Ermäßigung bei der Kfz-Steuer</strong> ODER Sie kaufen die <strong>Wertmarke für den ÖPNV</strong> (kostet 91 €/Jahr für die deutschlandweite Freifahrt im Nahverkehr). Beides gleichzeitig geht nicht.');
        }

        // Parken
        if (mzaG || mzBl) {
            items.push('<strong>Parken (Blauer Ausweis):</strong> Sie können den blauen EU-Parkausweis beantragen. Damit dürfen Sie auf Behindertenparkplätzen (Rollstuhl-Symbol) parken und erhalten europaweit Parkerleichterungen.');
        } else if (mzG) {
            items.push('<strong>Parken (Oranger Ausweis):</strong> Unter strengen regionalen Bedingungen können Sie ggf. den orangen Parkausweis beantragen. Dieser berechtigt <em>nicht</em> zum Parken auf Rollstuhl-Parkplätzen, erlaubt aber z.B. das Parken im eingeschränkten Halteverbot.');
        }

        if (items.length === 0) return '';

        return `
            <div class="info-box" style="background-color: #fff8e1; border-left: 4px solid #ffb300; padding: 15px; margin-bottom: 15px;">
                <h3 style="margin-top: 0; color: #f57c00; display: flex; align-items: center; gap: 8px;">
                    <span>🚗</span> Auto, ÖPNV & Parken
                </h3>
                <ul style="margin-bottom: 0; padding-left: 20px;">
                    ${items.map(i => `<li style="margin-bottom: 5px;">${i}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    function generiereAlltagVorteile(mzB, mzRF, gdb) {
        let items = [];

        if (mzB) {
            items.push('<strong>Kostenlose Begleitperson:</strong> Eine Begleitperson fährt im ÖPNV und im Fernverkehr der Deutschen Bahn <strong>kostenlos</strong> mit. Auch bei vielen Veranstaltungen (Kino, Zoo, Theater) zahlt die Begleitperson keinen Eintritt.');
        }
        
        if (mzRF) {
            items.push('<strong>Rundfunkbeitrag (GEZ):</strong> Sie bekommen eine Ermäßigung auf den Rundfunkbeitrag und zahlen nur noch ein Drittel (aktuell ca. 6,12 € pro Monat). Bei Bezug von Sozialleistungen oder mit Merkzeichen Bl ist oft sogar eine komplette Befreiung möglich.');
            items.push('<strong>Sozialtarif Telefon:</strong> Sie können bei einigen Telekommunikationsanbietern (z.B. Telekom) einen Sozialtarif beantragen, der Ihre monatliche Grundgebühr senkt.');
        }

        if (gdb >= 50 && items.length === 0) {
            items.push('<strong>Vergünstigte Eintritte:</strong> Mit dem Schwerbehindertenausweis erhalten Sie in Schwimmbädern, Museen, Kinos und Freizeitparks oft ermäßigten Eintritt. Nachfragen lohnt sich immer!');
        }

        if (items.length === 0) return '';

        return `
            <div class="info-box" style="background-color: #f3e5f5; border-left: 4px solid #ab47bc; padding: 15px; margin-bottom: 15px;">
                <h3 style="margin-top: 0; color: #7b1fa2; display: flex; align-items: center; gap: 8px;">
                    <span>🎟️</span> Alltag, GEZ & Freizeit
                </h3>
                <ul style="margin-bottom: 0; padding-left: 20px;">
                    ${items.map(i => `<li style="margin-bottom: 5px;">${i}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Hilfsfunktion: Fehler anzeigen
    function zeigeFehler(msg) {
        ergebnisContainer.innerHTML = `
            <div class="info-box" style="background-color: #fff3f3; border-left: 4px solid #e53935; padding: 15px;">
                <strong>Hinweis:</strong> ${msg}
            </div>`;
    }
});