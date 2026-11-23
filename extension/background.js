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

// Install or reload (Reload in chrome://extensions fires "update" for an unpacked extension):
// 1. First install opens the welcome tab (where did you grow up + pin).
// 2. Every install or reload writes a new demoResetAt stamp. The panel (boot.js) sees a stamp it has not
//    seen before and returns to the first-run state: no country, nothing saved, nothing known.
//    The extension stays inactive until you click its icon. Plain browser restarts do not touch this.
// 3. Panels an older copy left open on Instagram tabs are removed, so copies never stack.
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  if (reason !== "install" && reason !== "update") return;
  await chrome.storage.local.set({ demoResetAt: Date.now() });
  try {
    const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });
    for (const t of tabs) {
      chrome.scripting.executeScript({
        target: { tabId: t.id },
        func: () => {
          ["iykyk-panel", "iykyk-point", "iykyk-point-hl", "iykyk-ask", "iykyk-room", "iykyk-style", "iykyk-pop-style"].forEach((id) => document.getElementById(id)?.remove());
          if ("highlights" in CSS) ["iykyk", "iykyk-check", "iykyk-on"].forEach((k) => CSS.highlights.delete(k));
        }
      }).catch(() => {});
    }
  } catch {}
});
