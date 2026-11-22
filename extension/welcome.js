// Welcome tab: ask once, at install, where the user grew up.
(() => {
  const COUNTRIES = [
    ["KR", "🇰🇷", "Korea", "ko"], ["JP", "🇯🇵", "Japan", "ja"], ["CN", "🇨🇳", "China", "zh"], ["IN", "🇮🇳", "India", "hi"],
    ["VN", "🇻🇳", "Vietnam", "vi"], ["BR", "🇧🇷", "Brazil", "pt"], ["MX", "🇲🇽", "Mexico", "es"], ["FR", "🇫🇷", "France", "fr"]
  ];
  const set = (k, v) => { try { localStorage.setItem("iykyk." + k, JSON.stringify(v)); } catch {} };
  const chosen = [];

  // suggest one from the browser language, but never pick it for the user
  const lang = (navigator.language || "").slice(0, 2).toLowerCase();
  const suggested = COUNTRIES.find((c) => c[3] === lang);

  const box = document.getElementById("chips");
  box.innerHTML = COUNTRIES.map(([code, flag, name]) =>
    `<button class="chip" type="button" data-code="${code}" aria-pressed="false"><span class="f">${flag}</span>${name}${suggested && suggested[0] === code ? ' <span style="font-size:12px;color:var(--muted)">suggested</span>' : ""}<span class="ck">✓</span></button>`).join("");

  box.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    const code = b.dataset.code, i = chosen.indexOf(code);
    if (i > -1) chosen.splice(i, 1);
    else { if (chosen.length === 2) { const old = chosen.shift(); box.querySelector(`[data-code="${old}"]`).setAttribute("aria-pressed", "false"); } chosen.push(code); }
    b.setAttribute("aria-pressed", String(chosen.includes(code)));
  });

  function finish() {
    if (chosen.length) { set("country", chosen[0]); set("countries", chosen); set("countryAsked", true); }
    else set("tuneDismissed", false);
    chrome.tabs.create({ url: "https://www.instagram.com/" });
  }
  document.getElementById("open-ig").addEventListener("click", finish);
  document.getElementById("skip").addEventListener("click", () => window.close());
})();
