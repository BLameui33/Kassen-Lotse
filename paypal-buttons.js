document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. PAYPAL DONATE BUTTONS ---
    const forms = document.querySelectorAll('form[action="https://www.paypal.com/donate"]');
    
    forms.forEach(form => {
        // Verhindern, dass Buttons doppelt eingefügt werden
        if (form.dataset.buttonsAdded) return; 
        
        const originalSubmit = form.querySelector('input[type="submit"]');
        if (!originalSubmit) return;

        // Container für die neuen Buttons erstellen
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = "display: flex; gap: 10px; justify-content: center; margin-bottom: 15px; margin-top: 15px;";

        // Die Beträge, die wir anbieten wollen
        const amounts = [3, 5, 10];

        amounts.forEach(amount => {
            const btn = document.createElement('button');
            btn.type = "submit";
            btn.name = "amount";
            btn.value = amount;
            btn.textContent = amount + " €";
            // Einheitliches Styling für die neuen Buttons
            btn.style.cssText = "background-color: #ffc439; border: none; padding: 0.7rem 1.2rem; font-weight: bold; border-radius: 5px; cursor: pointer; color: #333; flex: 1;";
            btnContainer.appendChild(btn);
        });

        // Den Text des originalen Buttons anpassen
        originalSubmit.value = "Individueller Betrag";

        // Die neuen Buttons vor dem originalen Submit-Button einfügen
        originalSubmit.parentNode.insertBefore(btnContainer, originalSubmit);
        
        // Formular markieren, damit es nicht nochmal bearbeitet wird
        form.dataset.buttonsAdded = "true";
    });


    // --- 2. AUTOMATISCHE FORMULIERUNGSHILFE FÜR TEXTAREAS ---
    document.querySelectorAll("textarea[placeholder]").forEach(textarea => {
        // Doppelte Verarbeitung verhindern
        if (textarea.dataset.autofillAdded) return;

        const placeholderText = textarea.getAttribute("placeholder").trim();
        
        // Ignoriert sehr kurze Platzhalter (z.B. reines "Hier schreiben...")
        if (!placeholderText || placeholderText.length < 15) return;

        // Container direkt unter dem Textfeld
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "display: flex; align-items: center; gap: 8px; margin-top: 4px; margin-bottom: 12px; flex-wrap: wrap;";

        // Kleiner, edler Button
        const btnCopy = document.createElement("button");
        btnCopy.type = "button";
        btnCopy.textContent = "Textbeispiel übernehmen";
        btnCopy.style.cssText = "font-size: 11px; padding: 3px 8px; background-color: #f8f9fa; border: 1px solid #cccccc; border-radius: 3px; color: #2c3e50; cursor: pointer; font-family: inherit; transition: background-color 0.2s, border-color 0.2s;";

        // Hover-Effekt per JS für schlichte Eleganz
        btnCopy.addEventListener("mouseover", () => {
            btnCopy.style.backgroundColor = "#e9ecef";
            btnCopy.style.borderColor = "#b0b0b0";
        });
        btnCopy.addEventListener("mouseout", () => {
            btnCopy.style.backgroundColor = "#f8f9fa";
            btnCopy.style.borderColor = "#cccccc";
        });

        // Kurzer, unaufdringlicher Erklärtext daneben
        const hintText = document.createElement("span");
        hintText.textContent = "Fügt den Formulierungsvorschlag direkt als bearbeitbaren Text ein.";
        hintText.style.cssText = "font-size: 11px; color: #6c757d;";

        // Klick-Aktion: Text in die Textarea übertragen
        btnCopy.addEventListener("click", () => {
            textarea.value = placeholderText;
            textarea.focus();
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
        });

        wrapper.appendChild(btnCopy);
        wrapper.appendChild(hintText);

        // Fügt die Zeile direkt unter der jeweiligen Textarea ein
        textarea.parentNode.insertBefore(wrapper, textarea.nextSibling);
        textarea.dataset.autofillAdded = "true";
    });

});