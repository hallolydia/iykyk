// iykyk side panel: talks to content.js on Instagram and to the iykyk API.
(() => {
  "use strict";
  const API = "https://iykyk-eta.vercel.app/api/analyze";
  const QUESTION = { funny: "Why is this funny?", reference: "What's the reference?", tone: "Is this rude or friendly?" };
  const SHOW_AT = 0.7, DROP_BELOW = 0.4;

  const store = {
    get(k, f) { try { const v = localStorage.getItem("iykyk." + k); return v ? JSON.parse(v) : f; } catch { return f; } },
    set(k, v) { try { localStorage.setItem("iykyk." + k, JSON.stringify(v)); } catch {} }
  };
  const norm = (s) => String(s || "").trim().toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (id) => document.getElementById(id);

  const state = {
    items: [], hidden: [], focus: 0, tabId: null, comments: [],
    country: store.get("country", null),
    known: new Set(store.get("known", [])),
    saved: store.get("saved", [])
  };

  let toastTimer;
  function toast(t) { const el = $("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 1600); }
  function updateTop() { $("nyk-count").textContent = state.saved.filter((s) => s.status !== "confused").length; }
  function show(which) { ["panel-country", "panel-known", "panel-start", "panel-loading", "panel-results"].forEach((id) => ($(id).hidden = id !== which)); }
  function error(msg) { show("panel-start"); $("err").hidden = false; $("err").textContent = msg; }

  async function tab() {
    const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
    return t;
  }
  async function toPage(msg) {
    try { return await chrome.tabs.sendMessage(state.tabId, msg); } catch { return null; }
  }

  async function read() {
    $("err").hidden = true;
    const t = await tab();
    if (!t || !/^https:\/\/www\.instagram\.com\//.test(t.url || "")) return error("Open a post on instagram.com first.");
    state.tabId = t.id;
    let got = await toPage({ type: "read" });
    for (let k = 0; k < 3 && got && !got.comments.length; k++) { await new Promise((r) => setTimeout(r, 900)); got = await toPage({ type: "read" }); }
    if (!got) return error("I can't see this page yet. Reload Instagram once, then try again.");
    if (!got.comments.length) return error("Open the comments, and I'll read them. If they're open, I can't find them on this layout yet.");
    state.comments = got.comments;
    show("panel-loading");

    // a picture of the current scene, for context (comment text is sent separately)
    let image = null;
    try { image = await chrome.tabs.captureVisibleTab(t.windowId, { format: "jpeg", quality: 55 }); } catch {}

    const slow = setTimeout(() => { $("loading-text").textContent = "Still reading… jokes take a second."; }, 8000);
    try {
      const res = await fetch(API, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: { comments: got.comments, caption: "", scene: "", image }, countries: places(), country: state.country, known: [...state.known], explainIn: "en" })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't read this one.");
      applyRules(data);
      render();
      await toPage({ type: "highlight", items: state.items, focus: 0 });
    } catch (e) {
      error(e.message || "Couldn't read this one. Try again.");
    } finally {
      clearTimeout(slow);
      $("loading-text").textContent = "Reading like someone who didn't grow up here…";
    }
  }

  function applyRules(result) {
    const byId = Object.fromEntries(state.comments.map((c) => [c.id, c.text]));
    const per = {}; const vis = [], hid = [];
    (result.items || []).forEach((it) => {
      const text = byId[it.comment_id];
      if (!text || !text.includes(it.quote) || (it.confidence ?? 0) < DROP_BELOW) return;
      per[it.comment_id] = (per[it.comment_id] || 0) + 1; if (per[it.comment_id] > 2) return;
      const item = Object.assign({}, it, { check: it.confidence < SHOW_AT });
      (state.known.has(norm(it.quote)) ? hid : vis).push(item);
    });
    const order = state.comments.map((c) => c.id);
    vis.sort((a, b) => order.indexOf(a.comment_id) - order.indexOf(b.comment_id));
    state.items = vis; state.hidden = hid; state.focus = 0;
  }

  function render() {
    show("panel-results");
    const n = state.items.length;
    $("count-big").textContent = n;
    $("count-text").textContent = n === 1 ? "thing you might miss." : "things you might miss.";
    $("hidden-text").textContent = state.hidden.length ? `${state.hidden.length} hidden because you already know ${state.hidden.length === 1 ? "it" : "them"}.` : "";
    $("panel-title").textContent = n === 1 ? "1 thing in this post" : `${n} things in this post`;
    $("cards").innerHTML = n ? state.items.map(card).join("") : `<div class="card"><p class="phrase">Nothing to decode.</p><p class="answer">You're basically from here now.</p></div>`;
    const hc = $("hidden-card");
    hc.hidden = !state.hidden.length;
    hc.innerHTML = `<b>${state.hidden.length} hidden · you already know ${state.hidden.length === 1 ? "it" : "them"}</b><p>${state.hidden.map((h) => esc(h.quote)).join(" · ")}</p>`;
    $("done").hidden = true;
    // transparency: show exactly what was read (text only, no names)
    $("read-sum").textContent = `What I read (${state.comments.length})`;
    $("read-items").innerHTML = state.comments.map((c) => `<li>${esc(c.text)}</li>`).join("");
    setFocus(0, false);
  }

  function card(it, i) {
    const emo = it.emoji ? `<div class="emo"><div class="sel" aria-hidden="true"><i></i><i></i><i></i><i></i>${esc(it.emoji.char)}</div><div class="et">${esc(it.emoji.meaning)}</div></div>` : "";
    const det = [];
    if (it.origin) det.push(`<div class="det"><p class="lab">Where it comes from</p><p>${esc(it.origin)}</p></div>`);
    if (it.closest && places().length) det.push(`<div class="det"><p class="lab">Closest thing in ${esc(countryName())} <span class="cm">closest match</span></p><p>${esc(it.closest)}</p></div>`);
    const more = `<div class="morerow">${det.length ? '<button class="more" type="button" data-more>More ▾</button>' : "<span></span>"}<button class="link" data-act="confused" type="button">Still confused</button></div>${det.length ? `<div class="details" hidden>${det.join("")}</div>` : ""}`;
    return `<article class="card" data-i="${i}" tabindex="-1">
      <div class="row1"><span class="badge ${it.check ? "check" : ""}">${i + 1}</span><span class="qtag">${QUESTION[it.question] || QUESTION.reference}</span>${it.check ? '<span class="qtag check">⚠ Needs checking</span>' : ""}</div>
      <h3 class="phrase">${esc(it.quote)}</h3><p class="answer">${esc(it.answer)}</p>${emo}${more}
      <div class="acts"><button class="primary" data-act="got" type="button">Got it <kbd>space</kbd></button><button class="secondary" data-act="knew" type="button">I knew this</button></div>
      <p class="status" hidden></p></article>`;
  }

  const cardEl = (i) => document.querySelector(`.card[data-i="${i}"]`);
  function setFocus(i, scrollPage = true) {
    if (!state.items.length) return;
    state.focus = Math.max(0, Math.min(i, state.items.length - 1));
    document.querySelectorAll(".card").forEach((c) => c.classList.toggle("on", +c.dataset.i === state.focus));
    cardEl(state.focus)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    toPage({ type: "focus", i: state.focus, scroll: scrollPage });
  }

  function save(it, status) {
    state.saved = state.saved.filter((s) => norm(s.phrase) !== norm(it.quote));
    state.saved.unshift({ phrase: it.quote, answer: it.answer, question: it.question, status, source: "Instagram", date: new Date().toISOString() });
    store.set("saved", state.saved); updateTop();
  }

  function act(i, kind) {
    const it = state.items[i]; if (!it || it.done) return;
    const c = cardEl(i);
    if (kind === "confused") { save(it, "confused"); const s = c.querySelector(".status"); s.hidden = false; s.textContent = "Noted. I'll do better on this one."; return; }
    it.done = kind; c.classList.add("handled");
    if (kind === "got") { save(it, "got"); toast("Now you know."); }
    if (kind === "knew") { state.known.add(norm(it.quote)); store.set("known", [...state.known]); save(it, "knew"); toast("Look at you. I'll skip this next time."); toPage({ type: "highlight", items: state.items, focus: state.focus }); }
    let nx = -1; for (let k = i + 1; k < state.items.length; k++) if (!state.items[k].done) { nx = k; break; }
    if (nx === -1) $("done").hidden = false; else setFocus(nx);
  }

  // ---- events ----
  $("read-btn").addEventListener("click", read);
  $("close-btn").addEventListener("click", async () => { const t = await tab(); if (t) chrome.tabs.sendMessage(t.id, { type: "close" }).catch(() => {}); });
  $("again-btn").addEventListener("click", read);
  // ---- Where you grew up: up to 3 places, presets + type any country ----
  const PRESETS = [["🇰🇷", "Korea"], ["🇯🇵", "Japan"], ["🇨🇳", "China"], ["🇮🇳", "India"], ["🇻🇳", "Vietnam"], ["🇧🇷", "Brazil"], ["🇲🇽", "Mexico"], ["🇫🇷", "France"]];
  const MAX_PLACES = 3;
  // every country name, for the "Other" box (built from the browser, no list to maintain)
  const ALL_COUNTRIES = (() => {
    try {
      const dn = new Intl.DisplayNames(["en"], { type: "region" }); const out = new Set();
      for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b), name = dn.of(code);
        if (name && name !== code && !/unknown|outlying|pseudo/i.test(name)) out.add(name.replace("South Korea", "Korea"));
      }
      return [...out].sort();
    } catch { return PRESETS.map((p) => p[1]); }
  })();
  $("all-countries").innerHTML = ALL_COUNTRIES.map((n) => `<option value="${esc(n)}"></option>`).join("");

  // older saves stored one country code
  if (!store.get("countries", null) && state.country) state.countries = [{ KR: "Korea", JP: "Japan", CN: "China", IN: "India", VN: "Vietnam", BR: "Brazil", MX: "Mexico", FR: "France" }[state.country] || state.country];
  else state.countries = store.get("countries", []);
  const places = () => state.countries;
  const placesText = () => places().length === 0 ? "" : places().length === 1 ? places()[0] : places().slice(0, -1).join(", ") + " and " + places().slice(-1);
  const countryName = () => places()[0] || "";
  function savePlaces() { store.set("countries", state.countries); state.country = places()[0] || null; store.set("country", state.country); }

  function togglePlace(name) {
    const i = state.countries.indexOf(name);
    if (i > -1) state.countries.splice(i, 1);
    else { state.countries.push(name); if (state.countries.length > MAX_PLACES) state.countries.shift(); }
    savePlaces();
  }

  // one picker used in two places: the first-run screen and "Change"
  function pickerHtml() {
    const custom = places().filter((n) => !PRESETS.some((p) => p[1] === n));
    return PRESETS.map(([flag, name]) => `<button class="tchip" type="button" data-name="${esc(name)}" aria-pressed="${places().includes(name)}">${flag} ${esc(name)}</button>`).join("")
      + custom.map((name) => `<button class="tchip" type="button" data-name="${esc(name)}" aria-pressed="true">${esc(name)} ✕</button>`).join("")
      + `<button class="tchip skip" type="button" data-any aria-pressed="${places().length === 0}">Skip · explain for anyone</button>`;
  }
  function paintPickers() {
    $("for-who").textContent = places().length ? `someone raised in ${placesText()}` : "anyone raised outside the US";
    $("tchips").innerHTML = pickerHtml();
    $("first-chips").innerHTML = pickerHtml();
  }
  function onPick(e) {
    const b = e.target.closest(".tchip"); if (!b) return;
    if (b.hasAttribute("data-any")) { state.countries = []; savePlaces(); }
    else togglePlace(b.dataset.name);
    paintPickers();
    if (state.items.length) render();
  }
  $("tchips").addEventListener("click", onPick);
  $("first-chips").addEventListener("click", onPick);

  // "Other": type any country, pick from autocomplete, Enter or Add
  document.querySelectorAll(".other-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const typed = input.value.trim(); if (!typed) return;
      const match = ALL_COUNTRIES.find((n) => n.toLowerCase() === typed.toLowerCase()) || typed;
      if (!places().includes(match)) togglePlace(match);
      input.value = ""; paintPickers();
      if (state.items.length) render();
    });
  });

  $("tune-open").addEventListener("click", () => { const p = $("tune-pick"); p.hidden = !p.hidden; $("tune-open").textContent = p.hidden ? "Change" : "Done"; });
  $("country-next").addEventListener("click", () => {
    store.set("countryAsked", true); savePlaces(); show("panel-known");
  });
  paintPickers();
  show(!(store.get("countryAsked", false) || places().length) ? "panel-country" : store.get("knownAsked", false) ? "panel-start" : "panel-known");

  $("cards").addEventListener("click", (e) => {
    const c = e.target.closest(".card"); if (!c) return;
    const i = +c.dataset.i;
    const a = e.target.closest("[data-act]"); if (a) return act(i, a.dataset.act);
    const m = e.target.closest("[data-more]");
    if (m) { const d = m.parentElement.nextElementSibling; d.hidden = !d.hidden; m.textContent = d.hidden ? "More ▾" : "Less ▴"; return; }
    setFocus(i, true);
  });
  $("cards").addEventListener("mouseover", (e) => { const c = e.target.closest(".card"); if (c) toPage({ type: "focus", i: +c.dataset.i, scroll: false }); });
  $("cards").addEventListener("mouseleave", () => toPage({ type: "focus", i: state.focus, scroll: false }));

  document.addEventListener("keydown", (e) => {
    if ($("panel-results").hidden || !state.items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setFocus(state.focus + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocus(state.focus - 1); }
    else if (e.key === " " && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); act(state.focus, "got"); }
  });

  const IS_EXT = !!(window.chrome && chrome.runtime && chrome.runtime.id);
  if (IS_EXT) chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "navigated") {
      state.items = [];
      const ready = store.get("countryAsked", false) || places().length;
      show(ready ? "panel-start" : "panel-country");
      if (ready && store.get("knownAsked", false) && autoOn() && /\/(p|reels?)\//.test(msg.url || "")) {
        clearTimeout(autoTimer); autoTimer = setTimeout(read, 1200); // let the new comments load
      }
    }
  });

  updateTop();

  // ---- auto-read: on by default while the panel is open ----
  let autoTimer;
  function autoOn() { return store.get("autoRead", true); }
  $("auto-read").checked = autoOn();
  $("auto-read").addEventListener("change", (e) => { store.set("autoRead", e.target.checked); toast(e.target.checked ? "I'll read each post for you." : "Okay, I'll wait for you."); });
  (async () => {
    if (!IS_EXT || !autoOn() || $("panel-start").hidden) return;
    const t = await tab();
    if (t && /instagram\.com\/(p|reels?)\//.test(t.url || "")) read();
  })();

  // Design preview outside Chrome (open sidepanel.html?preview in a normal browser)
  if (!IS_EXT && location.search.includes("preview")) {
    const sc = document.createElement("script");
    sc.src = "../app/samples.js";
    sc.onload = () => {
      const p = window.IYKYK_SAMPLES[0];
      state.comments = p.comments.map(({ id, text }) => ({ id, text }));
      applyRules(p.result); render();
    };
    document.body.appendChild(sc);
  }
})();
