// selfcare.js

// Die "Datenbank" der Übungen (Statisch im Frontend für sofortige Ladezeit)
const contentData = {
    body: {
        title: "Körperliche Entspannung & Aktivierung",
        items: [
            // --- NACKEN & SCHULTERN ---
            {
                title: "Die Schulter-Befreiung",
                tags: ["Am Schreibtisch", "2 Min"],
                text: "Setzen Sie sich aufrecht hin. Ziehen Sie beide Schultern hoch zu den Ohren, halten Sie die Spannung für 5 Sekunden fest... und lassen Sie sie schlagartig fallen. Wiederholen Sie das 3-mal. Spüren Sie, wie die Last abfällt."
            },
            {
                title: "Der Ja-Nein-Vielleicht Nacken",
                tags: ["Nacken", "Sanft"],
                text: "Bewegen Sie den Kopf langsam wie bei einem 'Ja' (Kinn zur Brust, dann hoch). Dann wie bei einem 'Nein' (Links, Rechts). Zuletzt 'Vielleicht' (Ohr zur Schulter neigen). Machen Sie jede Bewegung 5-mal in Zeitlupe. Atmen Sie dabei fließend."
            },
            {
                title: "Der Türrahmen-Stretch",
                tags: ["Haltung", "Gegen Buckel"],
                text: "Stellen Sie sich in einen offenen Türrahmen. Legen Sie die Unterarme links und rechts an den Rahmen (Ellbogen auf Schulterhöhe). Lehnen Sie sich sanft nach vorne durch, bis Sie eine Dehnung in der Brust spüren. 20 Sekunden halten."
            },

            // --- AUGEN & KOPF ---
            {
                title: "Der Augen-Urlaub",
                tags: ["Gegen Kopfweh", "1 Min"],
                text: "Reiben Sie Ihre Handflächen aneinander, bis sie warm sind. Legen Sie die hohlen Hände sanft über die geschlossenen Augen (ohne Druck auf die Lider). Atmen Sie tief in den Bauch ein und aus. Genießen Sie die Dunkelheit und Wärme."
            },
            {
                title: "Der Kiefer-Löser",
                tags: ["Anti-Stress", "Gesicht"],
                text: "Stress sitzt oft im Kiefer. Öffnen Sie den Mund weit, strecken Sie die Zunge raus (wie ein Löwe). Danach den Mund schließen und mit der Zunge die Zähne entlangfahren (außen im Mundvorhof), 3 Kreise links, 3 rechts."
            },
            {
                title: "Ohr-Massage",
                tags: ["Energie", "Akupressur"],
                text: "Nehmen Sie Ihre Ohrläppchen zwischen Daumen und Zeigefinger. Massieren Sie das gesamte Ohr von unten nach oben kräftig durch. Ziehen Sie die Ohren sanft nach außen. Das macht sofort wach!"
            },

            // --- ATMUNG ---
            {
                title: "4-7-8 Atmung (Einschlafen & Beruhigen)",
                tags: ["Atmung", "3 Min"],
                text: "1. Atmen Sie 4 Sekunden lang ruhig durch die Nase ein.<br>2. Halten Sie den Atem für 7 Sekunden an.<br>3. Atmen Sie 8 Sekunden lang geräuschvoll durch den Mund aus.<br>Wiederholen Sie dies 4-mal."
            },
            {
                title: "Box-Breathing (Fokus)",
                tags: ["Konzentration", "Navy SEAL Technik"],
                text: "Stellen Sie sich ein Quadrat vor.<br>Einatmen (4 Sek)<br>Luft anhalten (4 Sek)<br>Ausatmen (4 Sek)<br>Luft anhalten (4 Sek).<br>Wiederholen Sie das Quadrat für 2 Minuten."
            },

            // --- HÄNDE & RÜCKEN ---
            {
                title: "Die T-Rex Dehnung",
                tags: ["Hände", "Tastatur-Finger"],
                text: "Strecken Sie einen Arm gerade nach vorne aus, Handfläche zeigt nach vorne (Stopp-Geste). Ziehen Sie mit der anderen Hand die Finger sanft zu sich heran. Wechseln Sie dann: Handrücken nach vorne, Finger sanft zum Körper biegen."
            },
            {
                title: "Wirbelsäulen-Twist",
                tags: ["Rücken", "Mobilisierung"],
                text: "Setzen Sie sich aufrecht hin. Drehen Sie den Oberkörper sanft nach rechts, greifen Sie mit der linken Hand an die rechte Stuhllehne. Blick folgt über die Schulter. 3 Atemzüge halten. Seite wechseln."
            }
        ]
    },
    mind: {
        title: "Mentale Ruhe & Klarheit",
        content_b2b_extra: { // Speziell für Profis
            title: "Die 'Hut-Ablage' (Feierabend-Ritual)",
            tags: ["Abgrenzung", "Visualisierung"],
            text: "Stellen Sie sich vor dem Verlassen des Büros (oder Schließen des Laptops) vor, wie Sie Ihre 'Berater-Rolle' wie einen Mantel ausziehen und an einen Haken hängen. Sie lassen die Verantwortung dort hängen. Sie gehen als Privatperson nach Hause."
        },
        items: [
            // --- AKUTHILFE & GROUNDING ---
            {
                title: "Die 5-4-3-2-1 Methode (Bei Panik & Stress)",
                tags: ["Grounding", "Akuthilfe"],
                text: "Kommen Sie im Hier und Jetzt an. Benennen Sie:<br>👀 <strong>5</strong> Dinge, die Sie sehen.<br>✋ <strong>4</strong> Dinge, die Sie fühlen können.<br>👂 <strong>3</strong> Dinge, die Sie hören.<br>👃 <strong>2</strong> Dinge, die Sie riechen.<br>👅 <strong>1</strong> Sache, die Sie schmecken (oder ein gutes Gefühl)."
            },
            {
                title: "Wasser-Achtsamkeit",
                tags: ["Mini-Pause", "Fokus"],
                text: "Holen Sie sich ein Glas Wasser. Trinken Sie es nicht nebenbei. Spüren Sie das kühle Glas in der Hand. Beobachten Sie das Wasser. Trinken Sie den ersten Schluck und spüren Sie genau nach, wie die Flüssigkeit den Hals hinunterläuft."
            },

            // --- GEDANKEN MANAGEMENT ---
            {
                title: "Gedanken-Wolken",
                tags: ["Loslassen", "Meditation"],
                text: "Stellen Sie sich Ihre Sorgen wie Wolken am Himmel vor. Sie sind da, aber sie ziehen vorbei. Sie müssen nicht an jeder Wolke festhalten oder sie analysieren. Lassen Sie sie einfach weiterziehen."
            },
            {
                title: "Der Realitäts-Check",
                tags: ["Rationalität", "Anti-Angst"],
                text: "Fragen Sie sich bei einem Stressgedanken: 'Ist das eine Tatsache oder eine Vermutung?' und 'Wird das in einem Jahr noch wichtig sein?'. Oft katastrophisiert unser Gehirn Dinge, die gar nicht so schlimm sind."
            },
            {
                title: "Brain Dump (Kopf leeren)",
                tags: ["Schreiben", "Klarheit"],
                text: "Nehmen Sie Zettel und Stift (oder ein leeres Dokument). Schreiben Sie 2 Minuten lang ALLES auf, was Ihnen im Kopf herumschwirrt. Ungefiltert. Wenn es auf dem Papier steht, muss Ihr Gehirn es nicht mehr festhalten."
            },

            // --- SELBSTWERT & POSITIVITÄT ---
            {
                title: "Die 'Genug'-Affirmation",
                tags: ["Gegen Schuldgefühle", "Selbstwert"],
                text: "Sprechen Sie laut oder leise zu sich selbst: 'Ich tue, was ich kann, und das ist genug. Ich darf Pausen machen, ohne mich schuldig zu fühlen. Mein Wert hängt nicht nur von meiner Leistung ab.'"
            },
            {
                title: "Drei gute Dinge",
                tags: ["Dankbarkeit", "Stimmungs-Booster"],
                text: "Überlegen Sie kurz: Was waren heute (oder gestern) 3 kleine Dinge, die gut gelaufen sind? Ein leckerer Kaffee? Ein Lächeln? Sonne? Schreiben Sie sie mental auf."
            },
            {
                title: "Power Posing",
                tags: ["Selbstbewusstsein", "Energie"],
                text: "Stellen Sie sich für 1 Minute wie Superman/Wonderwoman hin: Beine hüftbreit, Hände in die Hüften, Brust raus, Kinn hoch. Studien zeigen: Diese Haltung kann das Stresshormon Cortisol senken und Mut machen."
            },
            
            // --- DIGITAL DETOX ---
            {
                title: "20-20-20 Regel",
                tags: ["Digital Detox", "Augen"],
                text: "Alle 20 Minuten auf den Bildschirm starren: Schauen Sie für 20 Sekunden auf ein Objekt, das mindestens 20 Fuß (ca. 6 Meter) entfernt ist. Das entspannt den Ziliarmuskel im Auge."
            }
        ]
    }
};

// Check ob User eingeloggt (für personalisierte B2B Tipps)
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

function showCategory(category) {
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const list = document.getElementById('exercise-list');
    const title = document.getElementById('category-title');

    // Titel setzen
    if (contentData[category]) {
        title.textContent = contentData[category].title;
    } else {
        console.error("Kategorie nicht gefunden:", category);
        return;
    }
    
    list.innerHTML = '';

    // Spezieller B2B-Tipp einfügen, falls vorhanden und User B2B ist
    if (category === 'mind' && currentUser.type === 'b2b' && contentData.mind.content_b2b_extra) {
        renderCard(list, contentData.mind.content_b2b_extra, true);
    }

    // Übungen rendern
    // TIPP: Man könnte hier .sort(() => 0.5 - Math.random()) einfügen, 
    // um die Reihenfolge bei jedem Klick zufällig zu machen!
    contentData[category].items.forEach(item => {
        renderCard(list, item);
    });

    // View wechseln
    step1.classList.add('hidden');
    step2.style.display = 'block';
    
    // Nach oben scrollen für bessere UX
    window.scrollTo(0, 0);
}

function renderCard(container, item, isSpecial = false) {
    const div = document.createElement('div');
    div.className = 'exercise-card';
    
    // Style-Anpassungen direkt hier (oder besser in CSS auslagern)
    // Damit die neuen Übungen gut aussehen, geben wir ihnen etwas Raum
    div.style.marginBottom = '20px';
    div.style.padding = '20px';
    div.style.borderRadius = '12px';
    div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
    div.style.backgroundColor = '#fff';
    div.style.border = '1px solid #eee';

    if (isSpecial) {
        div.style.borderLeft = '5px solid #fbc02d'; // Goldene Farbe für Pro-Tipp
        div.style.background = '#fffde7';
    } else {
        div.style.borderLeft = '5px solid #80cbc4'; // Standard Teal Farbe
    }

    const tagsHtml = item.tags.map(tag => 
        `<span style="background:#e0f2f1; color:#00695c; padding:4px 10px; border-radius:12px; font-size:0.75rem; margin-right:6px; font-weight:600; display:inline-block; margin-bottom:4px;">${tag}</span>`
    ).join('');

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px; flex-wrap:wrap; gap:10px;">
            <h3 style="margin:0; font-size:1.1rem; color:#2c3e50;">${isSpecial ? '⭐ ' : ''}${item.title}</h3>
            <div>${tagsHtml}</div>
        </div>
        <p style="line-height:1.6; color:#555; margin:0; font-size:0.95rem;">${item.text}</p>
    `;
    container.appendChild(div);
}

function resetView() {
    document.getElementById('step-2').style.display = 'none';
    document.getElementById('step-1').classList.remove('hidden');
}