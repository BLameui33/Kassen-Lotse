/* kassen-lotse.js - zentrale Logik für Checkliste, PDF-Export, Autor/Datum */
(function(){
  // Konfiguration: persist=true speichert Checkliste in localStorage (pro URL)
  const CONFIG = { persist: false, authorDefault: 'Kassen-Lotse Team', pdfFilename: 'Kassen-Lotse_Checkliste.pdf' };

  // Hilfs: deutsches Datum formatieren, z.B. "3. Dezember 2025"
  function formatDateDE(date){
    return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // 1) Autor / LastUpdated initialisieren (füllt #kl-page-lastupdated & #kl-page-author falls vorhanden)
  try {
    const authorEls = document.querySelectorAll('#kl-page-author, #kl-page-author-inline');
    const dateEls = document.querySelectorAll('#kl-page-lastupdated, #kl-page-lastupdated-inline');

    authorEls.forEach(el => { if (!el.textContent.trim()) el.textContent = CONFIG.authorDefault; });
    dateEls.forEach(el => { if (!el.textContent.trim()) el.textContent = formatDateDE(new Date()); });
  } catch(e){ /* ignore */ }

  // 2) Checkliste Logik
  const checklist = document.getElementById('kl-checklist');
  if (!checklist) return;

  const clearBtn = document.getElementById('kl-clear');
  const downloadBtn = document.getElementById('kl-download');

  // unique storage key pro URL
  function storageKey(){ return 'kl_checklist_' + location.pathname; }

  function saveState(){
    if (!CONFIG.persist) return;
    try {
      const states = Array.from(checklist.querySelectorAll('input[type=checkbox]')).map(cb => cb.checked);
      localStorage.setItem(storageKey(), JSON.stringify(states));
    } catch(e){}
  }

  function loadState(){
    if (!CONFIG.persist) return;
    try {
      const raw = localStorage.getItem(storageKey());
      if (!raw) return;
      const arr = JSON.parse(raw);
      checklist.querySelectorAll('input[type=checkbox]').forEach((cb,i) => cb.checked = !!arr[i]);
    } catch(e){}
  }

  // attach change listeners if persist
  if (CONFIG.persist) {
    checklist.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', saveState));
    loadState();
  }

  // clear button
  if (clearBtn) clearBtn.addEventListener('click', function(){ checklist.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false); saveState(); });

  // PDF generation: versuche jsPDF aus CDN zu laden, sonst Fallback auf window.print
  async function ensureJsPDF(){
    if (window.jspdf && window.jspdf.jsPDF) return true;
    // Versuche CDN (falls CSP erlaubt)
    try {
      await new Promise((resolve, reject)=>{
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
      return !!(window.jspdf && window.jspdf.jsPDF);
    } catch(e){
      return false;
    }
  }

  function getChecklistItems(){
    return Array.from(checklist.querySelectorAll('li')).map(li=>{
      const cb = li.querySelector('input[type=checkbox]');
      const text = li.textContent.trim();
      return { text: text.replace(/\s+/g,' '), checked: !!cb && cb.checked };
    });
  }

  function buildPdfWithJsPDF(items, authorText, updatedText){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'pt', format:'a4' });
    const margin = 40;
    let y = 40;
    doc.setFontSize(14);
    doc.text('Checkliste', margin, y);
    doc.setFontSize(10);
    if (authorText) { y += 18; doc.text('Autor: ' + authorText, margin, y); }
    if (updatedText) { y += 14; doc.text('Letzte Aktualisierung: ' + updatedText, margin, y); }
    y += 18;
    doc.setFontSize(11);

    items.forEach(it=>{
      const symbol = it.checked ? '\u2611' : '\u25A1';
      const line = symbol + ' ' + it.text;
      const split = doc.splitTextToSize(line, 520);
      if (y + 20 > 820) { doc.addPage(); y = 40; }
      doc.text(split, margin, y);
      y += split.length * 14;
    });

    doc.save(CONFIG.pdfFilename);
  }

  async function downloadPdf(){
    const items = getChecklistItems();
    const authorEl = document.querySelector('#kl-page-author, #kl-page-author-inline');
    const updatedEl = document.querySelector('#kl-page-lastupdated, #kl-page-lastupdated-inline');
    const authorText = authorEl ? authorEl.textContent.trim() : CONFIG.authorDefault;
    const updatedText = updatedEl ? updatedEl.textContent.trim() : '';

    const hasJsPDF = await ensureJsPDF();
    if (hasJsPDF && window.jspdf && window.jspdf.jsPDF) {
      buildPdfWithJsPDF(items, authorText, updatedText);
      return;
    }

    // Fallback: neues Fenster mit HTML & print()
    const w = window.open('', '_blank');
    if (!w) { alert('Popup-Blocker verhindert das Speichern als PDF. Bitte Popups erlauben oder jsPDF lokal einbinden.'); return; }
    const html = `
      <html><head><title>Checkliste</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111} h1{font-size:18px} ul{margin-top:8px} li{margin-bottom:8px}</style>
      </head>
      <body>
        <h1>Checkliste</h1>
        <div style="color:#555;margin-bottom:12px;">Autor: ${escapeHtml(authorText)} ${updatedText ? '• Letzte Aktualisierung: ' + escapeHtml(updatedText) : ''}</div>
        <ul>${items.map(it => `<li>${it.checked ? '☑' : '☐'} ${escapeHtml(it.text)}</li>`).join('')}</ul>
        <script>window.onload=function(){ window.print(); }</script>
      </body></html>`;
    w.document.open(); w.document.write(html); w.document.close();
  }

  if (downloadBtn) downloadBtn.addEventListener('click', downloadPdf);

  function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
})();
