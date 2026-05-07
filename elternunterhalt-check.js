document.addEventListener("DOMContentLoaded", () => {
    const btnBerechnen = document.getElementById("hc_berechnen");
    const btnReset = document.getElementById("hc_reset");
    const ergebnisContainer = document.getElementById("hc_ergebnis");

    // Währung formatieren (z. B. 100.000,00 €)
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    };

    const berechneHeimkosten = () => {
        // 1. Werte auslesen
        const bruttoJahr = parseFloat(document.getElementById("hc_brutto_jahr").value) || 0;
        const zusatzEinkommen = parseFloat(document.getElementById("hc_zusatz_einkommen").value) || 0;
        const werbungskosten = parseFloat(document.getElementById("hc_werbungskosten").value) || 0;
        const sonderausgaben = parseFloat(document.getElementById("hc_sonderausgaben").value) || 0;
        const familienstand = document.getElementById("hc_familienstand").value;
        const anzahlKinder = parseInt(document.getElementById("hc_anzahl_kinder").value) || 0;

        // 2. Berechnung des maßgeblichen Jahreseinkommens
        const einkommenGesamt = bruttoJahr + zusatzEinkommen;
        const abzuegeGesamt = werbungskosten + sonderausgaben;
        const massgeblichesEinkommen = Math.max(0, einkommenGesamt - abzuegeGesamt); // Darf nicht negativ werden

        const freigrenze = 100000;
        const differenz = massgeblichesEinkommen - freigrenze;

        // 3. Ergebnis-HTML generieren
        let ergebnisHTML = `<div style="margin-top: 30px; padding: 20px; border-radius: 8px; border: 1px solid #ddd; background-color: #fcfcfc;">`;
        ergebnisHTML += `<h2 style="margin-top: 0;">Ihre Auswertung</h2>`;

        // Zusammenfassungstabelle
        ergebnisHTML += `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: left;">
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0;">Gesamte Einkünfte (Brutto)</td>
                    <td style="padding: 8px 0; text-align: right;">${formatCurrency(einkommenGesamt)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; color: #d32f2f;">Abzugsfähige Posten</td>
                    <td style="padding: 8px 0; text-align: right; color: #d32f2f;">- ${formatCurrency(abzuegeGesamt)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-weight: bold; font-size: 1.1em;">Maßgebliches Jahresbrutto</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 1.1em;">${formatCurrency(massgeblichesEinkommen)}</td>
                </tr>
            </table>
        `;

        // Logik: Unter oder über der 100.000€ Grenze
        if (massgeblichesEinkommen <= freigrenze) {
            // SICHER - Unter der Grenze
            ergebnisHTML += `
                <div style="background-color: #e8f5e9; border-left: 5px solid #4caf50; padding: 15px; margin-bottom: 15px;">
                    <h3 style="color: #2e7d32; margin-top: 0; display: flex; align-items: center; gap: 8px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        Keine Unterhaltspflicht
                    </h3>
                    <p style="margin-bottom: 0;">
                        Herzlichen Glückwunsch! Ihr maßgebliches Einkommen liegt mit <strong>${formatCurrency(massgeblichesEinkommen)}</strong> unter der gesetzlichen Freigrenze von 100.000 €. 
                        Das Sozialamt wird Sie <strong>nicht</strong> für die Heimkosten Ihrer Eltern zur Kasse bitten. Die ungedeckten Kosten (Hilfe zur Pflege) trägt der Träger der Sozialhilfe.
                    </p>
                </div>
            `;
        } else {
            // GEFAHR - Über der Grenze
            ergebnisHTML += `
                <div style="background-color: #ffebee; border-left: 5px solid #f44336; padding: 15px; margin-bottom: 15px;">
                    <h3 style="color: #c62828; margin-top: 0; display: flex; align-items: center; gap: 8px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#c62828"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                        Achtung: Unterhaltspflicht möglich
                    </h3>
                    <p>
                        Ihr maßgebliches Einkommen liegt mit <strong>${formatCurrency(massgeblichesEinkommen)}</strong> über der gesetzlichen Freigrenze von 100.000 €. 
                        Sie überschreiten die Grenze um <strong>${formatCurrency(differenz)}</strong>. 
                        Es besteht ein hohes Risiko, dass das Sozialamt Unterhaltszahlungen für das Pflegeheim der Eltern von Ihnen einfordert.
                    </p>
                </div>
            `;

            // Zusatzhinweis bezüglich Unterhaltsberechnung (Selbstbehalt)
            let familienZusatz = familienstand === "ja" ? "einem Ehepartner" : "niemandem";
            let kinderZusatz = anzahlKinder > 0 ? ` und ${anzahlKinder} unterhaltspflichtigem(n) Kind(ern)` : "";

            ergebnisHTML += `
                <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin-top: 15px; font-size: 0.9em;">
                    <strong>Wie geht es jetzt weiter?</strong><br>
                    Dass Sie über der Grenze liegen, bedeutet nicht automatisch, dass Sie alles zahlen müssen. 
                    Als Basis für den Unterhalt wird nun Ihr <em>bereinigtes Nettoeinkommen</em> ermittelt. 
                    Da Sie gegenüber <strong>${familienZusatz}${kinderZusatz}</strong> vorrangig unterhaltspflichtig sind, 
                    stehen Ihnen entsprechende familiäre Selbstbehalte zu. Auch Ihre eigene Altersvorsorge oder Ratenkredite 
                    können das anrechenbare Einkommen mindern. Lassen Sie sich in diesem Fall dringend anwaltlich beraten, bevor Sie Auskünfte an das Sozialamt erteilen!
                </div>
            `;
        }

        ergebnisHTML += `</div>`;

        // Ergebnis ins DOM einfügen
        ergebnisContainer.innerHTML = ergebnisHTML;

        // Zum Ergebnis scrollen
        ergebnisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Events binden
    if (btnBerechnen) {
        btnBerechnen.addEventListener("click", berechneHeimkosten);
    }

    if (btnReset) {
        btnReset.addEventListener("click", () => {
            ergebnisContainer.innerHTML = "";
            // Formular-Reset passiert automatisch durch type="reset" im HTML
        });
    }
});