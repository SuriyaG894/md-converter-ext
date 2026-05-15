/**
 * Popup script for MD to Word/PDF Converter
 * Phase 1: Foundation — Input capture, storage, preview navigation
 */

(function () {
  'use strict';

  // ─── DOM References ───
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const fileNameEl = document.getElementById('file-name');
  const pasteArea = document.getElementById('paste-area');
  const wordCountEl = document.getElementById('word-count');
  const charCountEl = document.getElementById('char-count');
  const btnPreview = document.getElementById('btn-preview');
  const btnClear = document.getElementById('btn-clear');
  const statusEl = document.getElementById('status');

  // ─── State ───
  const POPUP_WIDTH = 540;
  const POPUP_HEIGHT = 700;
  let currentMarkdown = '';
  let currentFileName = 'document.md';

  // ─── Tab Switching ───
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');
      statusEl.textContent = '';
      statusEl.className = 'status';
    });
  });

  // ─── File Input ───
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  // ─── Drag & Drop ───
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((evt) => {
    dropZone.addEventListener(evt, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach((evt) => {
    dropZone.addEventListener(evt, () => dropZone.classList.add('drag-over'), false);
  });

  ['dragleave', 'drop'].forEach((evt) => {
    dropZone.addEventListener(evt, () => dropZone.classList.remove('drag-over'), false);
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length) {
      const file = files[0];
      if (isValidFile(file)) {
        handleFile(file);
      } else {
        showStatus('Invalid file type. Use .md, .markdown, or .txt', 'error');
      }
    }
  });

  function isValidFile(file) {
    const validExts = ['.md', '.markdown', '.txt'];
    const name = file.name.toLowerCase();
    return validExts.some((ext) => name.endsWith(ext));
  }

  function handleFile(file) {
    if (!isValidFile(file)) {
      showStatus('Invalid file type. Use .md, .markdown, or .txt', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      currentMarkdown = e.target.result;
      currentFileName = file.name;
      fileNameEl.textContent = file.name;
      updateStats(currentMarkdown);
      showStatus('File loaded successfully', 'success');
    };
    reader.onerror = () => {
      showStatus('Failed to read file', 'error');
    };
    reader.readAsText(file);
  }

  // ─── Paste Area ───
  pasteArea.addEventListener('input', () => {
    currentMarkdown = pasteArea.value;
    currentFileName = 'pasted-document.md';
    updateStats(currentMarkdown);
  });

  // ─── Stats ───
  function updateStats(text) {
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    wordCountEl.textContent = words + ' word' + (words === 1 ? '' : 's');
    charCountEl.textContent = chars + ' char' + (chars === 1 ? '' : 's');
    btnPreview.disabled = text.trim().length === 0;
  }

  function centerWindow(width = POPUP_WIDTH, height = POPUP_HEIGHT) {
    try {
      if (!window.screen || typeof window.screen.availWidth === 'undefined') return;
      const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
      const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
      window.resizeTo(width, height);
      window.moveTo(left, top);
    } catch (err) {
      console.warn('Popup centering blocked', err);
    }
  }

  // ─── Clear ───
  btnClear.addEventListener('click', () => {
    currentMarkdown = '';
    currentFileName = 'document.md';
    fileInput.value = '';
    fileNameEl.textContent = '';
    pasteArea.value = '';
    updateStats('');
    statusEl.textContent = '';
    statusEl.className = 'status';
  });

  // ─── Preview ───
  btnPreview.addEventListener('click', async () => {
    if (!currentMarkdown.trim()) {
      showStatus('Nothing to preview', 'error');
      return;
    }
    try {
      await chrome.storage.local.set({
        mdContent: currentMarkdown,
        fileName: currentFileName,
        timestamp: Date.now()
      });
      const previewUrl = chrome.runtime.getURL('preview/preview.html');
      await chrome.tabs.create({ url: previewUrl });
      window.close();
    } catch (err) {
      showStatus('Failed to open preview: ' + err.message, 'error');
    }
  });

  // ─── Status Helper ───
  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status ' + (type === 'success' ? 'success' : '');
    if (type === 'success') {
      setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'status';
      }, 3000);
    }
  }

  // ─── Init ───
  updateStats('');
  centerWindow();

  let centerTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(centerTimeout);
    centerTimeout = setTimeout(() => {
      if (window.outerWidth <= POPUP_WIDTH || window.outerHeight <= POPUP_HEIGHT) {
        centerWindow();
      }
    }, 250);
  });
})();
