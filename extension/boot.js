// Starts the panel. If the extension was installed or reloaded since this panel last ran, it first
// returns to the first-run state. Only demo state is cleared (country, what you know, saved list,
// tips, language, auto-read). Nothing else is touched. The server holds the only API key, so there
// are no credentials here to keep or lose.
(async () => {
  const DEMO_KEYS = ["country", "countries", "countryAsked", "known", "knownAsked", "saved", "askTipSeen", "lang", "autoRead"];
  try {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      const { demoResetAt } = await chrome.storage.local.get("demoResetAt");
      if (demoResetAt && String(demoResetAt) !== localStorage.getItem("iykyk.resetSeen")) {
        DEMO_KEYS.forEach((k) => localStorage.removeItem("iykyk." + k));
        localStorage.setItem("iykyk.resetSeen", String(demoResetAt));
      }
    }
  } catch {}
  const s = document.createElement("script");
  s.src = "sidepanel.js";
  document.body.appendChild(s);
})();
