/**
 * Verhinderungspflege-Planer (Stundenweise)
 * Berechnet die Kosten, die Reichweite des Budgets und warnt
 * vor der Pflegegeldkürzung ab 8 Stunden Einsatzdauer.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Buttons und Container referenzieren
    const btnBerechnen = document.getElementById('vp_berechnen');
    const btnReset = document.getElementById('vp_reset');
    const ergebnisContainer = document.getElementById('vp_ergebnis');

    // Event Listener
    btnBerechnen.addEventListener('click', berechneVerhinderungspflege);
    
    btnReset.addEventListener('click', () => {
        ergebnisContainer.innerHTML = '';
    });

    function berechneVerhinderungspflege() {
        // Werte aus dem Formular auslesen
        const budget = parseFloat(document.getElementById('vp_budget').value);
        const stundenlohn = parseFloat(document.getElementById('vp_stundenlohn').value);
        const stundenProTag = parseFloat(document.getElementById('vp_stunden_pro_tag').value);
        const einsaetzeProMonat = parseInt(document.getElementById('vp_einsaetze_pro_monat').value, 10);

        // Basis-Validierung
        if (isNaN(budget) || isNaN(stundenlohn) || isNaN(einsaetzeProMonat) || budget < 0 || stundenlohn <= 0 || einsaetzeProMonat <= 0) {
            zeigeFehler('Bitte geben Sie gültige Zahlenwerte in alle Felder ein.');
            return;
        }

        // --- BERECHNUNGEN ---
        const kostenProEinsatz = stundenlohn * stundenProTag;
        const kostenProMonat = kostenProEinsatz * einsaetzeProMonat;
        const monateReichweite = Math.floor(budget / kostenProMonat);
        const kostenProJahr = kostenProMonat * 12;

        let htmlErgebnis = '';

        // --- LOGIK: 8-STUNDEN-REGEL (Der Hack) ---
        if (stundenProTag >= 8) {
            htmlErgebnis += `
                <div class="info-box ergebnis-animation" style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-top: 15px;">
                    <h2 style="margin-top: 0; color: #c62828; font-size: 1.3rem;">⚠️ Achtung: Pflegegeld-Kürzung!</h2>
                    <p style="margin-bottom: 0;">Da die Ersatzpflege <strong>8 Stunden oder länger</strong> an einem Tag stattfindet, greift die rettende stundenweise Regelung nicht mehr. Die Pflegekasse wird Ihnen für jeden dieser Einsatztage das reguläre Pflegegeld <strong>um 50 % kürzen</strong>. Außerdem werden diese Tage von der maximalen Jahresdauer abgezogen.</p>
                </div>
            `;
        } else {
            htmlErgebnis += `
                <div class="info-box ergebnis-animation" style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-top: 15px;">
                    <h2 style="margin-top: 0; color: #2e7d32; font-size: 1.3rem;">✅ 100 % Pflegegeld gesichert!</h2>
                    <p style="margin-bottom: 0;">Perfekt geplant! Da der Einsatz unter 8 Stunden bleibt (${stundenProTag} Std.), wird Ihr reguläres Pflegegeld für diese Tage <strong>nicht gekürzt</strong>. Es wird zu 100 % weitergezahlt und die Tage zählen nicht zur maximalen Jahresbegrenzung.</p>
                </div>
            `;
        }

        // --- FINANZIELLE AUSWERTUNG ---
        let reichweiteText = '';
        if (monateReichweite >= 12) {
            reichweiteText = `Das Budget reicht problemlos für ein ganzes Jahr. Sie schöpfen Ihr Budget nicht vollständig aus.`;
        } else if (monateReichweite === 0) {
            reichweiteText = `Ihr Budget reicht nicht einmal für einen vollen Monat dieser Planung.`;
        } else {
            reichweiteText = `Das Budget reicht nicht für das gesamte Jahr. Die Kasse übernimmt die Kosten für <strong>${monateReichweite} volle Monate</strong>. Wenn Sie diese Pflege das ganze Jahr so beibehalten, entstehen Gesamtkosten von ${kostenProJahr.toFixed(2).replace('.', ',')} € (Sie müssten die Differenz privat zahlen).`;
        }

        htmlErgebnis += `
            <div class="info-box ergebnis-animation" style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-top: 15px;">
                <h3 style="margin-top: 0; color: #1565c0; display: flex; align-items: center; gap: 8px;">
                    <span>📊</span> Budget-Auswertung
                </h3>
                <ul style="margin-bottom: 10px; padding-left: 20px;">
                    <li><strong>Kosten pro Einsatztag:</strong> ${kostenProEinsatz.toFixed(2).replace('.', ',')} €</li>
                    <li><strong>Kosten pro Monat:</strong> ${kostenProMonat.toFixed(2).replace('.', ',')} € <em>(bei ${einsaetzeProMonat} Einsätzen)</em></li>
                </ul>
                <p style="margin-bottom: 0; font-weight: bold;">Reichweite Ihres Budgets (${budget.toFixed(2).replace('.', ',')} €):</p>
                <p style="margin-top: 5px;">
                    Mit Ihrem angegebenen Budget können Sie diese Planung <strong>${monateReichweite} volle Monate</strong> lang durchführen. <br>
                    <em>${reichweiteText}</em>
                </p>
            </div>
        `;

        // Ergebnis einfügen und sanft hinscrollen
        ergebnisContainer.innerHTML = htmlErgebnis;
        ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Hilfsfunktion: Fehler anzeigen
    function zeigeFehler(msg) {
        ergebnisContainer.innerHTML = `
            <div class="info-box ergebnis-animation" style="background-color: #fff3f3; border-left: 4px solid #e53935; padding: 15px; margin-top: 15px;">
                <strong>Fehler:</strong> ${msg}
            </div>`;
    }
});