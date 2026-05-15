/**
 * Preview Page Script
 * Phase 4: Word Export — Integrated DOCX Generator for Word download
 */

(function () {
  'use strict';

  const previewContainer = document.getElementById('preview-container');
  const fileNameEl = document.getElementById('file-name');
  const wordCountEl = document.getElementById('word-count');
  const formatBtns = document.querySelectorAll('.fmt-btn');
  const btnDownload = document.getElementById('btn-download');

  let currentMarkdown = '';
  let currentFileName = 'document.md';
  let selectedFormat = 'pdf';
  let isWorking = false;

  async function init() {
    try {
      const data = await chrome.storage.local.get(['mdContent', 'fileName']);
      if (!data.mdContent) {
        previewContainer.innerHTML = '<p class="empty-state">No content found. Go back to the extension popup and upload or paste Markdown.</p>';
        btnDownload.disabled = true;
        return;
      }
      currentMarkdown = data.mdContent;
      currentFileName = data.fileName || 'document.md';
      fileNameEl.textContent = currentFileName;
      updateStats(currentMarkdown);
      renderPreview(currentMarkdown);
    } catch (err) {
      previewContainer.innerHTML = '<p class="empty-state" style="color:#dc3545">Error loading content: ' + escapeHtml(err.message) + '</p>';
    }
  }

  function updateStats(text) {
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    wordCountEl.textContent = words + ' word' + (words === 1 ? '' : 's');
  }

  function renderPreview(markdown) {
    marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: true,
      mangle: false,
      sanitize: false
    });

    const rawHtml = marked.parse(markdown);
    // Sanitize HTML before injection to prevent XSS
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','br','strong','b','em','i',
        'a','ul','ol','li','pre','code','blockquote','hr','table','thead','tbody',
        'tr','th','td','img','div','span','dl','dt','dd','sub','sup','del','ins',
        'mark','abbr','cite','q','s','u','small','figure','figcaption','caption',
        'col','colgroup','details','summary'],
      ALLOWED_ATTR: ['href','src','alt','title','width','height','target','rel',
        'class','id','style','align','border','cellpadding','cellspacing','valign']
    });
    previewContainer.innerHTML = cleanHtml;
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  formatBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      formatBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFormat = btn.dataset.format;
    });
  });

  btnDownload.addEventListener('click', async () => {
    if (!currentMarkdown.trim() || isWorking) return;
    if (selectedFormat === 'pdf') {
      await downloadPDF();
    } else {
      await downloadWord();
    }
  });

  async function downloadPDF() {
    isWorking = true;
    const originalText = btnDownload.textContent;
    btnDownload.textContent = 'Generating PDF…';
    btnDownload.style.opacity = '0.7';

    try {
      const clone = previewContainer.cloneNode(true);
      clone.style.padding = '20px';
      clone.style.background = '#ffffff';
      clone.style.color = '#000000';
      clone.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      clone.style.fontSize = '12pt';
      clone.style.lineHeight = '1.6';

      clone.querySelectorAll('pre').forEach((pre) => {
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordWrap = 'break-word';
        pre.style.background = '#f6f8fa';
        pre.style.padding = '12px';
        pre.style.borderRadius = '6px';
        pre.style.fontSize = '10pt';
      });

      clone.querySelectorAll('img').forEach((img) => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      });

      clone.querySelectorAll('table').forEach((table) => {
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
      });
      clone.querySelectorAll('th, td').forEach((cell) => {
        cell.style.border = '1px solid #d0d7de';
        cell.style.padding = '6px 8px';
      });

      const opt = {
        margin: [12, 12, 12, 12],
        filename: currentFileName.replace(/\.md$/i, '.pdf'),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(clone).save();
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. See console for details.');
    } finally {
      isWorking = false;
      btnDownload.textContent = originalText;
      btnDownload.style.opacity = '1';
    }
  }

  async function downloadWord() {
    isWorking = true;
    const originalText = btnDownload.textContent;
    btnDownload.textContent = 'Generating Word…';
    btnDownload.style.opacity = '0.7';

    try {
      const htmlContent = previewContainer.innerHTML;
      const blob = await DOCXGenerator.generateDocx(
        '<div class="markdown-body">' + htmlContent + '</div>',
        currentFileName
      );

      const url = URL.createObjectURL(blob);
      const wordFileName = currentFileName.replace(/\.md$/i, '.docx');

      await chrome.downloads.download({
        url: url,
        filename: wordFileName,
        saveAs: true
      });

      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error('Word generation failed:', err);
      alert('Failed to generate Word document. Error: ' + err.message);
    } finally {
      isWorking = false;
      btnDownload.textContent = originalText;
      btnDownload.style.opacity = '1';
    }
  }

  init();
})();



