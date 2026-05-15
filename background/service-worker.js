/**
 * Background Service Worker
 * Phase 1: Foundation — Message passing, download orchestration (stubs)
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[MD Converter] Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ ok: true });
  }

  if (request.action === 'openCenteredPopup') {
    const width = request.width || 540;
    const height = request.height || 700;
    const availWidth = request.availWidth || 800;
    const availHeight = request.availHeight || 600;
    const left = Math.max(0, Math.round((availWidth - width) / 2));
    const top = Math.max(0, Math.round((availHeight - height) / 2));

    chrome.windows.create(
      {
        url: request.url || chrome.runtime.getURL('popup/popup.html'),
        type: 'popup',
        state: 'normal',
        width,
        height,
        left,
        top
      }, (newWindow) => {
        if (sender.tab && sender.tab.id) {
          chrome.tabs.remove(sender.tab.id);
        }
      }
    );
  }

  return true;
});
