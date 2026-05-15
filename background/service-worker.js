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
  return true;
});
