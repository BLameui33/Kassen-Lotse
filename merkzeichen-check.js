/**
 * Merkzeichen-Check
 * Dynamisches Ein- und Ausblenden von medizinisch-rechtlichen Kriterien
 * basierend auf der Auswahl (G, aG, B, H, RF) und Auswertung der Chancen.
 */

document.addEventListener('DOMContentLoaded', () => {
    const selectMerkzeichen = document.getElementById('mzc_auswahl');
    const containerKriterien = document.getElementById('mzc_kriterien_container');
    const containerFragen = document.getElementById('mzc_fragen');
    const btnBerechnen = document.getElementById('mzc_berechnen');
    const btnReset = document.getElementById('mzc_reset');
    const ergebnisContainer = document.getElementById('mzc_ergebnis');

    // Kriterien-Katalog (vereinfacht, aber rechtlich nah an den VersMedV)
    const kriterienKatalog = {
        'G': [
            { id: 'g_1', text: 'Ich kann eine ortsübliche Strecke (ca. 2 Kilometer in 30 Minuten) nicht mehr ohne große Schmerzen oder Pausen zu Fuß bewältigen.' },
            { id: 'g_2', text: 'Ich leide an massiven Funktionseinschränkungen der Beine oder der Lendenwirbelsäule (z. B. durch schwere Arthrose oder Versteifungen).' },
            { id: 'g_3', text: 'Ich habe eine schwere Herz- oder Lungenerkrankung, die mir schon bei kurzen Wegstrecken stark die Luft raubt.' },
            { id: 'g_4', text: 'Ich leide an ständigen, schweren Anfällen (z. B. Epilepsie) oder an Orientierungsstörungen (z. B. Demenz).' }
        ],
        'aG': [
            { id: 'ag_1', text: 'Ich kann mich außerhalb meines Autos praktisch nur noch mit fremder Hilfe oder unter allergrößter Anstrengung fortbewegen.' },
            { id: 'ag_2', text: 'Ich bin beim Verlassen des Hauses dauerhaft auf einen Rollstuhl angewiesen.' },
            { id: 'ag_3', text: 'Ich habe beide Beine (ab Unterschenkel aufwärts) oder ein Bein (ab Oberschenkel) verloren.' },
            { id: 'ag_4', text: 'Ich leide an einer derart schweren Herz- oder Lungenkrankheit, dass ich bereits in Ruhe oder bei kleinsten Bewegungen unter massiver Atemnot leide.' }
        ],
        'B': [
            { id: 'b_1', text: 'WICHTIGE GRUNDVORAUSSETZUNG: Mir wurde bereits das Merkzeichen G, aG oder H zuerkannt (oder ich erfülle deren Bedingungen eindeutig).' },
            { id: 'b_2', text: 'Ich bin beim Ein- und Aussteigen in Bus und Bahn zwingend auf fremde Hilfe (z.B. Rollstuhl schieben, stützen) angewiesen.' },
            { id: 'b_3', text: 'Ich muss während der Fahrt zwingend beaufsichtigt werden, um Gefahren für mich oder andere abzuwenden (z.B. bei geistigen Behinderungen oder Anfallsleiden).' },
            { id: 'b_4', text: 'Ich bin blind oder hochgradig sehbehindert.' }
        ],
        'H': [
            { id: 'h_1', text: 'Ich brauche jeden Tag, dauerhaft für mindestens 2 Stunden, fremde Hilfe bei ganz alltäglichen Dingen (Körperpflege, Essen, An- und Ausziehen, Toilettengang).' },
            { id: 'h_2', text: 'Ich bin blind oder hochgradig sehbehindert.' },
            { id: 'h_3', text: 'Ich leide an einer schweren geistigen Einschränkung (z.B. fortgeschrittene Demenz), die ständige Überwachung erfordert.' },
            { id: 'h_4', text: 'Ich habe epileptische Anfälle in einer Häufigkeit und Schwere, die eine ständige Bereitschaft einer Pflegeperson notwendig macht.' }
        ],
        'RF': [
            { id: 'rf_1', text: 'Ich bin blind oder hochgradig sehbehindert (GdB von mindestens 60 allein wegen der Sehbehinderung).' },
            { id: 'rf_2', text: 'Ich bin gehörlos oder so schwer hörbehindert, dass ich mich trotz Hörhilfen nicht ausreichend verständigen kann.' },
            { id: 'rf_3', text: 'Ich habe einen Gesamt-GdB von mindestens 80 UND kann wegen meines Leidens praktisch an keinen öffentlichen Veranstaltungen (Kino, Theater, Konzerte) mehr teilnehmen.' }
        ]
    };

    // Event Listener für Dropdown-Änderung
    selectMerkzeichen.addEventListener('change', function() {
        const auswahl = this.value;
        ergebnisContainer.innerHTML = ''; // Altes Ergebnis löschen

        if (auswahl && kriterienKatalog[auswahl]) {
            // Checkboxen generieren
            let fragenHtml = '';
            kriterienKatalog[auswahl].forEach(kriterium => {
                fragenHtml += `
                    <label class="pflegegrad-label" style="display:flex; align-items:flex-start; gap:.6rem; margin-bottom: 10px; font-weight: normal;">
                        <input type="checkbox" class="mzc-checkbox" value="${kriterium.id}" style="margin-top: 4px;" />
                        <span>${kriterium.text}</span>
                    </label>
                `;
            });

            containerFragen.innerHTML = fragenHtml;
            containerKriterien.style.display = 'block';
            btnBerechnen.style.display = 'inline-block';
        } else {
            containerKriterien.style.display = 'none';
            btnBerechnen.style.display = 'none';
        }
    });

    // Auswertung starten
    btnBerechnen.addEventListener('click', () => {
        const auswahl = selectMerkzeichen.value;
        const checkboxes = document.querySelectorAll('.mzc-checkbox');
        let checkedCount = 0;

        checkboxes.forEach(cb => {
            if (cb.checked) checkedCount++;
        });

        // Spezielle Prüfung für B (Grundvoraussetzung Checkbox b_1)
        if (auswahl === 'B') {
            const b1_checked = document.querySelector('input[value="b_1"]').checked;
            if (!b1_checked) {
                zeigeErgebnis(
                    'Keine Chance ohne Basis-Merkzeichen',
                    'Das Merkzeichen <strong>B</strong> (Begleitperson) wird gesetzlich <strong>niemals isoliert</strong> vergeben. Sie müssen zwingend vorab oder gleichzeitig die Kriterien für <strong>G, aG oder H</strong> erfüllen. Bitte prüfen Sie zunächst, ob Ihnen eines dieser Mobilitäts-Merkzeichen zusteht.',
                    'danger'
                );
                return;
            }
        }

        // Allgemeine Auswertung
        if (checkedCount === 0) {
            zeigeErgebnis(
                'Geringe Aussicht auf Erfolg',
                `Sie haben keines der typischen Kriterien für das Merkzeichen <strong>${auswahl}</strong> angekreuzt. Nach den strengen Richtlinien des Versorgungsamtes (Versorgungsmedizinische Grundsätze) ist es sehr wahrscheinlich, dass ein Antrag abgelehnt wird. Bedenken Sie: Allgemeine Schmerzen oder Diagnosen reichen leider nicht aus, es geht rein um die massiven Einschränkungen im Alltag.`,
                'warning'
            );
        } else if (checkedCount === 1) {
            zeigeErgebnis(
                'Grundsätzliche Chance vorhanden',
                `Sie erfüllen mindestens ein wichtiges Kriterium für das Merkzeichen <strong>${auswahl}</strong>. Ein Antrag kann sich lohnen. <br><br><strong>Der wichtigste Tipp:</strong> Das Versorgungsamt glaubt nicht Ihren Worten, sondern nur den ärztlichen Befunden! Sprechen Sie vorab mit Ihrem Haus- oder Facharzt. Dieser muss in seinen Berichten exakt bestätigen, wie stark Sie durch diese Symptome im Alltag eingeschränkt sind.`,
                'info'
            );
        } else {
            zeigeErgebnis(
                'Gute Chancen auf Anerkennung!',
                `Sie erfüllen mehrere zentrale Kernkriterien für das Merkzeichen <strong>${auswahl}</strong>. Aus medizinischer Sicht haben Sie gute bis sehr gute Chancen, dass das Versorgungsamt das Merkzeichen bewilligt.<br><br><strong>Nächster Schritt:</strong> Stellen Sie einen Erstantrag oder Verschlimmerungsantrag. Fügen Sie unbedingt aktuelle, detaillierte Befunde Ihrer Fachärzte bei, die genau diese angekreuzten Einschränkungen schwarz auf weiß belegen!`,
                'success'
            );
        }
    });

    // Reset Formular
    btnReset.addEventListener('click', () => {
        containerKriterien.style.display = 'none';
        btnBerechnen.style.display = 'none';
        ergebnisContainer.innerHTML = '';
        containerFragen.innerHTML = '';
    });

    // Hilfsfunktion zur Darstellung der Ergebnisse
    function zeigeErgebnis(titel, text, typ) {
        let bgColor, borderColor, icon;

        switch(typ) {
            case 'success':
                bgColor = '#e8f5e9'; borderColor = '#4caf50'; icon = '✅'; break;
            case 'warning':
                bgColor = '#fff8e1'; borderColor = '#ffb300'; icon = '⚠️'; break;
            case 'danger':
                bgColor = '#ffebee'; borderColor = '#f44336'; icon = '❌'; break;
            case 'info':
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