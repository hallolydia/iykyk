// Clicking the toolbar icon opens or closes the iykyk panel on the page.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || !tab.url.startsWith("https://www.instagram.com/")) {
    chrome.tabs.create({ url: "https://www.instagram.com/" });
    return;
  }
  try { await chrome.tabs.sendMessage(tab.id, { type: "toggle" }); }
  catch { /* content script not ready yet (tab opened before install): reload once */ chrome.tabs.reload(tab.id); }
});

// First install: open the welcome tab (where did you grow up + pin)
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
});
