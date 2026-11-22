// Clicking the toolbar icon opens or closes the iykyk panel on the page you are looking at.
// Instagram has the reader installed already. On any other https page (YouTube, Reddit, news) it is added
// the moment you click, and only on that tab (activeTab). Nothing runs on sites you never click it on.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || !/^https:\/\//.test(tab.url)) {
    chrome.tabs.create({ url: "https://www.instagram.com/" }); // browser pages can't be read: send them somewhere useful
    return;
  }
  const toggle = () => chrome.tabs.sendMessage(tab.id, { type: "toggle" });
  try { await toggle(); }
  catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      await toggle();
    } catch { /* a page the browser does not let extensions touch */ }
  }
});

// First install: open the welcome tab (where did you grow up + pin)
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
});
