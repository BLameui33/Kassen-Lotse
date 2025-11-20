// pflegegrad-rechner.js

// Konfiguration der Module
// maxRaw = maximale Rohpunkte (Anzahl Fragen * 3)
// maxWeighted = maximale gewichtete Punkte gemäß gängigem NBA-Schema
const moduleConfig = {
  1: { name: "Modul 1 – Mobilität", maxRaw: 4 * 3, maxWeighted: 10 },
  2: { name: "Modul 2 – Kognition/Kommunikation", maxRaw: 3 * 3, maxWeighted: 15 },
  3: { name: "Modul 3 – Verhalten/psychische Problemlagen", maxRaw: 3 * 3, maxWeighted: 15 },
  4: { name: "Modul 4 – Selbstversorgung", maxRaw: 4 * 3, maxWeighted: 40 },
  5: { name: "Modul 5 – krankheits-/therapiebedingte Anforderungen", maxRaw: 3 * 3, maxWeighted: 20 },
  6: { name: "Modul 6 – Alltagsgestaltung & soziale Kontakte", maxRaw: 3 * 3, maxWeighted: 15 }
};

// Lineare Skalierung Rohpunkte -> gewichtete Punkte
function scaleToWeighted(rawValue, maxRaw, maxWeighted) {
  if (rawValue <= 0 || maxRaw <= 0) return 0;
  const ratio = rawValue / maxRaw;
  return ratio * maxWeighted;
}

// Pflegegrad anhand Gesamtpunkten bestimmen
function bestimmePflegegrad(totalPoints) {
  if (totalPoints < 12.5) {
    return { grad: 0, text: "Kein Pflegegrad" };
  } else if (totalPoints < 27) {
    return { grad: 1, text: "Pflegegrad 1" };
  } else if (totalPoints < 47.5) {
    return { grad: 2, text: "Pflegegrad 2" };
  } else if (totalPoints < 70) {
    return { grad: 3, text: "Pflegegrad 3" };
  } else if (totalPoints < 90) {
    return { grad: 4, text: "Pflegegrad 4" };
  } else {
    return { grad: 5, text: "Pflegegrad 5" };
  }
}

// Hauptlogik
function berechnePflegegrad(formElement) {
  const rawSums = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  const selects = formElement.querySelectorAll(".pflegegrad-frage");
  selects.forEach((select) => {
    const moduleId = parseInt(select.dataset.module, 10);
    if (!rawSums.hasOwnProperty(moduleId)) return;

    const value = Number(select.value);
    if (!Number.isNaN(value)) rawSums[moduleId] += value;
  });

  const weighted = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  Object.keys(rawSums).forEach((key) => {
    const moduleId = parseInt(key, 10);
    const cfg = moduleConfig[moduleId];
    weighted[moduleId] = scaleToWeighted(rawSums[moduleId], cfg.maxRaw, cfg.maxWeighted);
  });

  // Von Modul 2 & 3 zählt nur das jeweils höhere Gewicht (max. 15 %)
  const weighted23 = Math.max(weighted[2], weighted[3]);

  // Gesamtpunkte 0–100
  const totalPoints = weighted[1] + weighted23 + weighted[4] + weighted[5] + weighted[6];

  const pflegegrad = bestimmePflegegrad(totalPoints);

  return {
    rawSums,
    weighted,
    totalPoints,
    effective23: weighted23,
    pflegegrad
  };
}

// Ausgabe ins DOM
function zeigeErgebnis(container, daten) {
  const { rawSums, weighted, totalPoints, effective23, pflegegrad } = daten;
  const totalRounded = totalPoints.toFixed(1);

  const modulRows = [
    { id: 1, extraInfo: "" },
    { id: 2, extraInfo: " (nur höheres von Modul 2/3 zählt)" },
    { id: 3, extraInfo: " (nur höheres von Modul 2/3 zählt)" },
    { id: 4, extraInfo: "" },
    { id: 5, extraInfo: "" },
    { id: 6, extraInfo: "" }
  ];

  const tableRowsHtml = modulRows.map((row) => {
    const id = row.id;
    const cfg = moduleConfig[id];
    const raw = rawSums[id];
    const rawMax = cfg.maxRaw;
    const weightedPoints = weighted[id].toFixed(1);
    const weightedMax = cfg.maxWeighted.toFixed(1);
    return `
      <tr>
        <td>${cfg.name}${row.extraInfo}</td>
        <td>${raw} / ${rawMax}</td>
        <td>${weightedPoints} / ${weightedMax}</td>
      </tr>
    `;
  }).join("");

  const info23 = `
    <p>
      <strong>Hinweis zu Modul 2 &amp; 3:</strong>
      In die Gesamtbewertung fließt nur das <em>höher gewichtete</em> der beiden Module ein.
      Effektiv berücksichtigte Punkte aus Modul 2/3: <strong>${effective23.toFixed(1)}</strong>.
    </p>
  `;

  container.innerHTML = `
    <h2>Ergebnis</h2>
    <p>
      Gesamtpunkte (gewichtete Punktzahl): <strong>${totalRounded} von 100</strong><br>
      Voraussichtlich erreichter Pflegegrad: <strong>${pflegegrad.text}</strong>
    </p>

    <div class="pflegegrad-result-card">
      <table class="pflegegrad-tabelle">
        <thead>
          <tr><th>Modul</th><th>Rohpunkte</th><th>Gewichtete Punkte</th></tr>
        </thead>
        <tbody>${tableRowsHtml}</tbody>
      </table>
      ${info23}
    </div>

    <p class="hinweis">
      Unverbindliche Orientierung. Maßgeblich sind SGB XI und die Begutachtung durch den Medizinischen Dienst / die Pflegekasse.
    </p>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("pflegegrad-form");
  if (!form) return;

  // ----- HIER HINZUFÜGEN -----
  form.classList.add('wizard-enabled');
  
  const ergebnisContainer = document.getElementById("ergebnis");

  const fieldsets = Array.from(form.querySelectorAll(".pflegegrad-fieldset"));
  const prevBtn = document.getElementById("prev-step");
  const nextBtn = document.getElementById("next-step");
  const berechnenBtn = document.getElementById("berechnen-btn");
  const resetBtn = document.getElementById("reset-form");
  const progressEl = document.getElementById("wizard-progress");

  if (!form || fieldsets.length === 0) return;

  let currentStep = 0;
  const totalSteps = fieldsets.length;

  function updateProgress() {
    if (progressEl) progressEl.textContent = `Schritt ${currentStep + 1} von ${totalSteps}`;
  }

  function showStep(index) {
    fieldsets.forEach((fs, i) => fs.classList.toggle("active-step", i === index));
    prevBtn.disabled = index === 0;
    if (index === totalSteps - 1) {
      nextBtn.style.display = "none";
      berechnenBtn.style.display = "inline-block";
    } else {
      nextBtn.style.display = "inline-block";
      berechnenBtn.style.display = "none";
    }
    updateProgress();
    ergebnisContainer.innerHTML = "";
  }

  // Initial
  showStep(currentStep);

  // Navigation
  prevBtn.addEventListener("click", () => {
    if (currentStep > 0) { currentStep--; showStep(currentStep); }
  });

  nextBtn.addEventListener("click", () => {
    if (currentStep < totalSteps - 1) { currentStep++; showStep(currentStep); }
  });

  // Berechnung am Ende
  berechnenBtn.addEventListener("click", () => {
    const daten = berechnePflegegrad(form);
    zeigeErgebnis(ergebnisContainer, daten);
    ergebnisContainer.scrollIntoView({ behavior: "smooth" });
  });

  // Reset
  resetBtn.addEventListener("click", () => {
    currentStep = 0;
    setTimeout(() => {
      showStep(currentStep);
      ergebnisContainer.innerHTML = "";
    }, 0);
  });
});
