document.addEventListener("DOMContentLoaded", function () {
    // DOM Elemente referenzieren
    const form = document.getElementById("pflegetagebuchForm");
    const nameInput = document.getElementById("pflegeName");
    const moduleCheckboxes = document.querySelectorAll('input[name="module"]');
    const saveBtn = document.getElementById("saveBtnTagebuch");
    const loadBtn = document.getElementById("loadBtnTagebuch");
    
    // Popup Elemente
    const popup = document.getElementById("spendenPopup");
    const closePopupBtn = document.getElementById("closePopupBtn");

    // --- 1. SPEICHERN & LADEN (Lokaler Speicher / Datenschutzkonform) ---
    const STORAGE_KEY = "pflegetagebuch_data";

    saveBtn.addEventListener("click", () => {
        const selectedModules = Array.from(moduleCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const data = {
            name: nameInput.value.trim(),
            modules: selectedModules
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        // Kurzes visuelles Feedback
        const originalText = saveBtn.innerText;
        saveBtn.innerText = "✓ Gespeichert";
        setTimeout(() => { saveBtn.innerText = originalText; }, 2000);
    });

    loadBtn.addEventListener("click", () => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const data = JSON.stringify(savedData) ? JSON.parse(savedData) : null;
                if (data) {
                    nameInput.value = data.name || "";
                    
                    // Checkboxen zurücksetzen und neu setzen
                    moduleCheckboxes.forEach(cb => {
                        cb.checked = data.modules && data.modules.includes(cb.value);
                    });
                }
            } catch (e) {
                console.error("Fehler beim Laden der Daten", e);
            }
        } else {
            alert("Es wurden keine gespeicherten Daten gefunden.");
        }
    });

    // --- 2. PDF GENERIERUNG ---
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        // jsPDF initialisieren
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert("Die PDF-Bibliothek konnte nicht geladen werden. Bitte laden Sie die Seite neu.");
            return;
        }

        // Formulardaten auslesen
        const pflegeName = nameInput.value.trim();
        const selectedModules = Array.from(moduleCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Neues A4 Dokument im Hochformat
        const doc = new jsPDF('p', 'mm', 'a4');

        // Modul-Definitionen für den MDK-Standard
        const mdkModules = [
            { id: 'mobilitaet', title: 'Modul 1: Mobilität', desc: '(z.B. Aufstehen, Umsetzen, Gehen, Treppensteigen)' },
            { id: 'kognition', title: 'Modul 2: Kognition & Kommunikation', desc: '(z.B. Orientierung, Erkennen von Risiken, Mitteilen)' },
            { id: 'verhalten', title: 'Modul 3: Verhaltensweisen & psychische Problemlagen', desc: '(z.B. Unruhe, Abwehr, Wahnvorstellungen)' },
            { id: 'selbstversorgung', title: 'Modul 4: Selbstversorgung', desc: '(z.B. Waschen, Ankleiden, Essen, Trinken, Toilettengang)' },
            { id: 'krankheit', title: 'Modul 5: Krankheitsbedingte Anforderungen', desc: '(z.B. Medikamente, Injektionen, Arztbesuche)' },
            { id: 'alltag', title: 'Modul 6: Gestaltung des Alltagslebens', desc: '(z.B. Tagesablauf anpassen, Beschäftigung)' }
        ];

        // --- TITELSEITE ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text("Pflegetagebuch", 14, 30);
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Zur Vorbereitung auf die MDK-Begutachtung / Pflegegrad-Einstufung", 14, 40);

        doc.setLineWidth(0.5);
        doc.line(14, 45, 196, 45);

        doc.setFontSize(12);
        doc.text("Pflegebedürftige Person:", 14, 60);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(pflegeName, 65, 60);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("Zeitraum der Erfassung:", 14, 75);
        doc.text("vom _________________ bis _________________", 65, 75);

        doc.setFont("helvetica", "bold");
        doc.text("Hinweise zum Ausfüllen:", 14, 95);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        const hinweise = [
            "1. Führen Sie dieses Tagebuch idealerweise für 14 aufeinanderfolgende Tage.",
            "2. Tragen Sie die konkrete Hilfeleistung detailliert ein (nicht nur 'geholfen').",
            "3. Seien Sie ehrlich. Dokumentieren Sie auch 'schlechte Tage' und nächtliche Hilfen.",
            "4. Nutzen Sie die Legende für die 'Art der Hilfe' um Platz zu sparen:"
        ];
        
        let yPos = 105;
        hinweise.forEach(hinweis => {
            doc.text(hinweis, 14, yPos);
            yPos += 7;
        });

        // Legende Box
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(200, 200, 200);
        doc.rect(14, yPos + 2, 182, 35, 'FD');
        
        doc.setFont("helvetica", "bold");
        doc.text("Legende: Art der Hilfe", 18, yPos + 10);
        doc.setFont("helvetica", "normal");
        doc.text("B = Beaufsichtigung (Sicherheit geben, dabeibleiben)", 18, yPos + 18);
        doc.text("A = Anleitung (Auffordern, Reihenfolge vorgeben)", 18, yPos + 24);
        doc.text("U = Unterstützung (Teilweises Handanlegen, z.B. Waschlappen reichen)", 18, yPos + 30);
        doc.text("VÜ = Vollständige Übernahme (Die Pflegeperson führt die Tätigkeit komplett aus)", 18, yPos + 36);

        // --- 14 TAGE GENERIEREN ---
        for (let day = 1; day <= 14; day++) {
            doc.addPage();

            // Kopfzeile auf jeder Seite
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text(`Pflegetagebuch: ${pflegeName}`, 14, 20);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.text(`Tag ${day}   |   Datum: _____________________`, 130, 20);
            
            doc.setLineWidth(0.2);
            doc.setDrawColor(150, 150, 150);
            doc.line(14, 24, 196, 24);

            // Tabellendaten zusammenbauen
            const tableBody = [];

            mdkModules.forEach(mod => {
                const isFocus = selectedModules.includes(mod.id);
                // Fokus-Module erhalten 5 leere Zeilen, die anderen nur 2
                const rowCount = isFocus ? 5 : 2; 

                // Modul-Überschrifts-Zeile
                tableBody.push([
                    { 
                        content: `${mod.title} \n${mod.desc}`, 
                        colSpan: 5, 
                        styles: { 
                            fillColor: [230, 230, 230], 
                            fontStyle: 'bold', 
                            textColor: [40, 40, 40],
                            cellPadding: 3
                        } 
                    }
                ]);

                // Leere Zeilen zum Ausfüllen einfügen
                for (let i = 0; i < rowCount; i++) {
                    tableBody.push(['', '', '', '', '']);
                }
            });

            // Tabelle zeichnen
            doc.autoTable({
                startY: 28,
                head: [['Uhrzeit', 'Konkrete Tätigkeit / Situation', 'Art der Hilfe (B,A,U,VÜ)', 'Dauer (Min)', 'Notizen / Auffälligkeiten']],
                body: tableBody,
                theme: 'grid',
                styles: { 
                    font: 'helvetica',
                    fontSize: 9, 
                    lineColor: [180, 180, 180],
                    lineWidth: 0.2
                },
                headStyles: { 
                    fillColor: [70, 70, 70], 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 20, halign: 'center' },  // Uhrzeit
                    1: { cellWidth: 65 },                    // Tätigkeit
                    2: { cellWidth: 35, halign: 'center' },  // Art der Hilfe
                    3: { cellWidth: 25, halign: 'center' },  // Dauer
                    4: { cellWidth: 'auto' }                 // Notizen
                },
                willDrawCell: function(data) {
                    // Sorgt dafür, dass die leeren Zeilen hoch genug zum Schreiben sind
                    if (data.row.section === 'body' && data.row.raw.length === 5 && data.row.raw[0] === '') {
                        data.row.height = 12; // 12mm Höhe für handschriftliche Einträge
                    }
                },
                margin: { top: 28, bottom: 20 }
            });

            // Fußzeile pro Seite (Seitenzahl)
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Seite ${pageCount} - Nur für den persönlichen Gebrauch (MDK Vorbereitung)`, 14, 287);
            doc.text(`Tag ${day} von 14`, 182, 287);
            doc.setTextColor(0, 0, 0); // Reset color
        }

        // --- PDF SPEICHERN ---
        const safeName = pflegeName.replace(/[^a-zA-Z0-9]/g, '_') || 'Person';
        doc.save(`Pflegetagebuch_14_Tage_${safeName}.pdf`);

        // --- POPUP ANZEIGEN ---
        popup.style.display = "flex";
    });

    // --- POPUP SCHLIESSEN ---
    closePopupBtn.addEventListener("click", () => {
        popup.style.display = "none";
    });

    // Schließen durch Klick außerhalb des Popups
    window.addEventListener("click", (e) => {
        if (e.target === popup) {
            popup.style.display = "none";
        }
    });
});