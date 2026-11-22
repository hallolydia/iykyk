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
  const lang = () => store.get("lang", "en"); // explanation language: en | ko
  const norm = (s) => String(s || "").trim().toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (id) => document.getElementById(id);

  const cache = new Map(); // post URL -> AI result, so going back is instant
  const state = {
    items: [], hidden: [], focus: 0, tabId: null, comments: [],
    country: store.get("country", null),
    known: new Set(store.get("known", [])),
    saved: store.get("saved", [])
  };

  let toastTimer;
  function toast(t, ms = 1600) { const el = $("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), ms); }
  let lastCount = null;
  function updateTop() {
    const n = state.saved.filter((s) => s.status === "got").length;
    $("nyk-count").textContent = n;
    if (lastCount !== null && n > lastCount) { const b = $("nyk-btn"); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); } // the number visibly jumps
    lastCount = n;
  }
  function show(which) { ["panel-country", "panel-known", "panel-start", "panel-loading", "panel-results", "panel-saved"].forEach((id) => ($(id).hidden = id !== which)); }
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
    if (!t || !/^https:\/\//.test(t.url || "")) return error("Open a web page first: Instagram, YouTube, Reddit, or an article.");
    state.tabId = t.id;
    let got = await toPage({ type: "read" });
    for (let k = 0; k < 3 && got && !got.comments.length; k++) { await new Promise((r) => setTimeout(r, 900)); got = await toPage({ type: "read" }); }
    if (!got) return error("I can't see this page yet. Reload Instagram once, then try again.");
    if (!got.comments.length) {
      if (got.kind === "instagram") { toPage({ type: "point" }); return error("Open the comments, and I'll read them. If they're open, I can't find them on this layout yet."); }
      if (got.kind === "youtube" || got.kind === "reddit") return error("Scroll down until the comments show up, then press Read again. You can also select any words and press Ask IYKYK.");
      return error("I can't find English text to read here. Scroll to some text, or select any words and press Ask IYKYK.");
    }
    state.comments = got.comments;
    state.url = got.url; state.skipped = got.skipped || 0; state.site = got.site || "Instagram";
    const cached = cache.get(got.url + "|" + lang());
    if (cached) { applyRules(cached); render(); await toPage({ type: "highlight", items: state.items, focus: 0 }); return; }
    show("panel-loading");

    // a picture of the current scene, for context (comment text is sent separately)
    // two frames, one second apart, so the AI sees a bit of what happens
    const images = [];
    try { images.push(await chrome.tabs.captureVisibleTab(t.windowId, { format: "jpeg", quality: 50 })); } catch {}
    await new Promise((r) => setTimeout(r, 500));
    try { images.push(await chrome.tabs.captureVisibleTab(t.windowId, { format: "jpeg", quality: 50 })); } catch {}
    const audio = (await toPage({ type: "audio" }))?.audio || "";

    const slow = setTimeout(() => { $("loading-text").textContent = "Still reading… jokes take a second."; }, 8000);
    try {
      const res = await fetch(API, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: { comments: got.comments, caption: "", scene: "", images, audio }, countries: places(), country: state.country, known: [...state.known], explainIn: lang() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't read this one.");
      cache.set(got.url + "|" + lang(), data);
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

  // append = false: a new post. true: new comments from scrolling, added under the existing cards.
  // Split into up to 3 batches read in parallel: less to read per call, and the first batch to finish shows up first.
  let liveJobs = 0, liveTimer;
  function live(text, ms) {
    const el = $("live"); el.hidden = false; $("live-text").textContent = text;
    el.classList.toggle("busy", !ms);
    clearTimeout(liveTimer);
    if (ms) liveTimer = setTimeout(() => { el.hidden = true; }, ms);
  }
  async function readMore(fresh) {
    const size = Math.max(4, Math.ceil(fresh.length / 3));
    const batches = [];
    for (let i = 0; i < fresh.length; i += size) batches.push(fresh.slice(i, i + size));
    liveJobs += batches.length;
    const startCount = state.items.length;
    live(`Reading ${fresh.length} new comment${fresh.length === 1 ? "" : "s"}…`);
    await Promise.all(batches.map(async (batch) => {
      try {
        const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post: { comments: batch, caption: "", scene: "" }, countries: places(), known: [...state.known], explainIn: lang() }) });
        if (!res.ok) return;
        const data = await res.json();
        state.comments = state.comments.concat(batch);
        const before = state.items.length;
        applyRules(data, batch, true);
        const keep = state.focus;
        const box = document.querySelector(".panel-scroll"), y = box ? box.scrollTop : 0;
        quietScroll = true; render(); setFocus(keep, false); quietScroll = false;
        if (box) box.scrollTop = y; // stay exactly where the reader was
        document.querySelectorAll("#cards .card").forEach((c, i) => { if (i >= before) c.classList.add("fresh"); });
        await toPage({ type: "highlight", items: state.items, focus: keep });
      } catch {} finally { liveJobs--; }
    }));
    if (liveJobs > 0) return; // another read is still running: keep the busy pill
    const added = state.items.length - startCount;
    live(added > 0 ? `${added} new card${added === 1 ? "" : "s"} added` : "Nothing new to explain.", 2600);
  }

  // The reader selected words the AI missed: explain just that phrase and add it as a card.
  async function askAbout({ id, comment, quote }) {
    const same = state.items.find((x) => norm(x.quote) === norm(quote));
    if (same) { setFocus(state.items.indexOf(same), true); live("That one is already a card.", 2200); return; }
    live(`Explaining “${quote.length > 28 ? quote.slice(0, 28) + "…" : quote}”…`);
    try {
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: { comments: [{ id, text: comment }], caption: "", scene: "" }, countries: places(), known: [], explainIn: lang(), asked: quote }) });
      const data = await res.json().catch(() => ({}));
      const it = res.ok && (data.items || []).find((x) => x.comment_id === id && comment.includes(x.quote));
      if (!it) return live("Couldn't explain that one. Try selecting the whole phrase.", 3000);
      if (!state.comments.some((c) => c.id === id)) state.comments.push({ id, text: comment });
      state.items.push(Object.assign({}, it, { check: (it.confidence ?? 1) < SHOW_AT, comment_ids: [id], asked: true, lang: lang() }));
      render();
      const last = state.items.length - 1;
      document.querySelectorAll("#cards .card")[last]?.classList.add("fresh");
      await toPage({ type: "highlight", items: state.items, focus: last });
      setFocus(last, true);
      live("Card added ↓", 2200);
    } catch { live("Couldn't explain that one.", 3000); }
  }

  function applyRules(result, comments = state.comments, append = false) {
    const byId = Object.fromEntries(comments.map((c) => [c.id, c.text]));
    const per = {};
    if (!append) { state.items = []; state.hidden = []; state.focus = 0; }
    (result.items || []).forEach((it) => {
      const text = byId[it.comment_id];
      if (!text || !text.includes(it.quote) || (it.confidence ?? 0) < DROP_BELOW) return;
      per[it.comment_id] = (per[it.comment_id] || 0) + 1; if (per[it.comment_id] > 2) return;
      const key = norm(it.quote);
      // the same meme in many comments = one card, highlighted everywhere
      const same = state.items.find((x) => norm(x.quote) === key) || state.hidden.find((x) => norm(x.quote) === key);
      if (same) { if (!same.comment_ids.includes(it.comment_id)) same.comment_ids.push(it.comment_id); return; }
      const item = Object.assign({}, it, { check: it.confidence < SHOW_AT, comment_ids: [it.comment_id], lang: lang() });
      (state.known.has(key) ? state.hidden : state.items).push(item);
    });
    if (!append) {
      const order = state.comments.map((c) => c.id);
      state.items.sort((a, b) => order.indexOf(a.comment_id) - order.indexOf(b.comment_id));
    }
  }

  function render() {
    if ($("panel-saved").hidden) show("panel-results"); else prevScreen = "panel-results";
    const n = state.items.length;
    $("count-big").textContent = n;
    $("count-text").textContent = n === 1 ? "thing you might miss." : "things you might miss.";
    $("hidden-text").textContent = state.hidden.length ? `${state.hidden.length} hidden because you already know ${state.hidden.length === 1 ? "it" : "them"}.` : "";
    $("panel-title").textContent = n === 1 ? "1 thing in this post" : `${n} things in this post`;
    $("cards").innerHTML = n ? state.items.map(card).join("") : `<div class="card"><p class="phrase">Nothing to explain.</p><p class="answer">You're basically from here now.</p></div>`;
    const hc = $("hidden-card");
    hc.hidden = !state.hidden.length;
    hc.innerHTML = `<b>${state.hidden.length} hidden · you already know ${state.hidden.length === 1 ? "it" : "them"}</b><p>${state.hidden.map((h) => esc(h.quote)).join(" · ")}</p>`;
    $("done").hidden = true;
    // transparency: show exactly what was read (text only, no names)
    $("read-sum").textContent = `What I read (${state.comments.length})` + (state.skipped ? ` · skipped ${state.skipped} not in English` : "");
    $("read-items").innerHTML = state.comments.map((c) => `<li>${esc(c.text)}</li>`).join("");
    setFocus(0, false);
    if (n && !store.get("askTipSeen", false)) { store.set("askTipSeen", true); setTimeout(() => toast("Missed one? Select it.", 3200), 1200); }
  }

  function card(it, i) {
    const emo = it.emoji ? `<div class="emo"><div class="sel" aria-hidden="true"><i></i><i></i><i></i><i></i>${esc(it.emoji.char)}</div><div class="et">${esc(it.emoji.meaning)}</div></div>` : "";
    const det = [];
    if (it.origin) det.push(`<div class="det"><p class="lab">Where it comes from</p><p>${esc(it.origin)}</p></div>`);
    if (it.closest && places().length) det.push(`<div class="det"><p class="lab">Closest thing in ${esc(countryName())} <span class="cm">closest match</span></p><p>${esc(it.closest)}</p></div>`);
    const more = `<div class="morerow">${det.length ? '<button class="more" type="button" data-more>More ▾</button>' : "<span></span>"}<button class="link" data-act="confused" type="button">Still confused</button></div>${det.length ? `<div class="details" hidden>${det.join("")}</div>` : ""}`;
    return `<article class="card" data-i="${i}" tabindex="-1">
      <div class="row1"><span class="badge ${it.check ? "check" : ""}">${i + 1}</span><span class="qtag">${QUESTION[it.question] || QUESTION.reference}</span>${it.check ? '<span class="qtag check">⚠ Needs checking</span>' : ""}</div>
      <h3 class="phrase">${esc(it.quote)}</h3>${it.comment_ids && it.comment_ids.length > 1 ? `<p class="also">In ${it.comment_ids.length} comments</p>` : ""}<p class="answer">${esc(it.answer)}</p>${emo}${more}
      <div class="acts"><button class="primary" data-act="got" type="button">Got it <kbd>space</kbd></button><button class="secondary" data-act="knew" type="button">I knew this</button></div>
      <p class="status" hidden></p></article>`;
  }

  const cardEl = (i) => document.querySelector(`.card[data-i="${i}"]`);
  let quietScroll = false; // true while new cards are added in the background: never move the reader's place
  function setFocus(i, scrollPage = true) {
    if (!state.items.length) return;
    state.focus = Math.max(0, Math.min(i, state.items.length - 1));
    document.querySelectorAll(".card").forEach((c) => c.classList.toggle("on", +c.dataset.i === state.focus));
    if (!quietScroll) cardEl(state.focus)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    toPage({ type: "focus", i: state.focus, scroll: scrollPage });
  }

  function save(it, status) {
    state.saved = state.saved.filter((s) => norm(s.phrase) !== norm(it.quote));
    state.saved.unshift({ phrase: it.quote, answer: it.answer, question: it.question, status, source: state.site || "Instagram", url: state.url || "", date: new Date().toISOString() });
    store.set("saved", state.saved); updateTop();
  }

  function unsave(it) { state.saved = state.saved.filter((x) => norm(x.phrase) !== norm(it.quote)); store.set("saved", state.saved); updateTop(); }
  function act(i, kind) {
    const it = state.items[i]; if (!it) return;
    const c = cardEl(i);
    const say = (html) => { const el = c.querySelector(".status"); el.hidden = false; el.innerHTML = html; };
    const undoBtn = ' · <button class="link" data-act="undo" type="button">Undo</button>';
    if (kind === "undo") {
      if (!it.done && !it.confusedOn) return;
      const was = it.done || "confused";
      it.done = null; it.confusedOn = false; c.classList.remove("handled"); c.querySelector(".status").hidden = true;
      unsave(it);
      if (was === "knew") { state.known.delete(norm(it.quote)); store.set("known", [...state.known]); }
      $("done").hidden = true;
      toPage({ type: "highlight", items: state.items, focus: i });
      setFocus(i, true); toast("Undone.");
      return;
    }
    if (it.done) return;
    if (kind === "confused") {
      if (it.confusedOn) return;
      it.confusedOn = true; save(it, "confused");
      say('<span class="ok">✓ Marked confused</span>' + undoBtn); toast("Noted. I'll do better on this one.");
      return;
    }
    it.done = kind; it.confusedOn = false; c.classList.add("handled");
    if (kind === "got") { save(it, "got"); say("✓ Added to Now you know" + undoBtn); toast("Now you know."); }
    if (kind === "knew") { state.known.add(norm(it.quote)); store.set("known", [...state.known]); save(it, "knew"); say("✓ Hidden from now on" + undoBtn); toast("Look at you. I'll skip this next time."); toPage({ type: "highlight", items: state.items, focus: state.focus }); }
    let nx = -1; for (let k = i + 1; k < state.items.length; k++) if (!state.items[k].done) { nx = k; break; }
    if (nx === -1) $("done").hidden = false; else setFocus(nx);
  }

  // ---- "Now you know": everything you pressed Got it on, plus what you said you already knew ----
  let prevScreen = "panel-start";
  function renderSaved() {
    const good = state.saved.filter((x) => x.status === "got"), knew = state.saved.filter((x) => x.status === "knew"), bad = state.saved.filter((x) => x.status === "confused");
    const link = (x) => /^https:\/\//.test(x.url || "") ? `<a class="slink" href="${esc(x.url)}" target="_blank" rel="noopener">View the source ↗</a>` : "";
    const row = (x) => `<li class="srow"><div><p class="sphrase">${esc(x.phrase)}</p><p class="sans">${esc(x.answer || "")}</p>${link(x)}</div><button class="link" data-s="${state.saved.indexOf(x)}" type="button">Remove</button></li>`;
    const chip = (x) => `<span class="hchip">${esc(x.phrase)}<button data-s="${state.saved.indexOf(x)}" type="button" title="Show this again" aria-label="Show ${esc(x.phrase)} again">×</button></span>`;
    $("saved-count").textContent = good.length;
    $("saved-list").innerHTML = good.length ? good.map(row).join("") : `<li class="sempty"><b>Nothing here yet.</b><br>Press <b>Got it</b> on a card and it lands here.</li>`;
    $("knew-wrap").hidden = !knew.length;
    $("knew-sum").textContent = `You already knew (${knew.length})`;
    $("knew-list").innerHTML = knew.map(chip).join("");
    $("confused-wrap").hidden = !bad.length;
    $("confused-list").innerHTML = bad.map(row).join("");
  }
  function openSaved() {
    const cur = ["panel-country", "panel-known", "panel-start", "panel-loading", "panel-results"].find((id) => !$(id).hidden);
    if (cur) prevScreen = cur;
    renderSaved(); show("panel-saved");
  }
  $("nyk-btn").addEventListener("click", () => { $("panel-saved").hidden ? openSaved() : show(prevScreen); });
  $("saved-back").addEventListener("click", () => show(prevScreen));
  $("panel-saved").addEventListener("click", (e) => {
    const b = e.target.closest("[data-s]"); if (!b) return;
    const x = state.saved[+b.dataset.s]; if (!x) return;
    state.saved.splice(+b.dataset.s, 1); store.set("saved", state.saved);
    if (x.status === "knew") { state.known.delete(norm(x.phrase)); store.set("known", [...state.known]); }
    const live = state.items.find((it) => norm(it.quote) === norm(x.phrase));
    if (live) { live.done = null; live.confusedOn = false; }
    updateTop(); renderSaved();
    toPage({ type: "highlight", items: state.items, focus: state.focus });
  });

  // ---- events ----
  // The button and the title say what is about to be read, so they match the page you are on.
  const COPY = {
    instagram: ["Open a post's comments,<br>then read them with me.", "Read these comments"],
    youtube: ["Scroll down to the comments,<br>then read them with me.", "Read these comments"],
    reddit: ["Open a thread,<br>then read it with me.", "Read this thread"],
    page: ["Open an article,<br>then read it with me.", "Read this page"]
  };
  function paintStart(url) {
    const k = /instagram\.com/.test(url || "") ? "instagram" : /youtube\.com/.test(url || "") ? "youtube" : /reddit\.com/.test(url || "") ? "reddit" : "page";
    $("start-title").innerHTML = COPY[k][0];
    $("read-btn").textContent = COPY[k][1];
  }
  if (window.chrome && chrome.tabs) tab().then((t) => paintStart(t && t.url)).catch(() => {});
  $("read-btn").addEventListener("click", read);
  $("close-btn").addEventListener("click", async () => { const t = await tab(); if (t) chrome.tabs.sendMessage(t.id, { type: "close" }).catch(() => {}); });
  // Read again on the same post: keep every answer we already have and read only the comments that are new.
  async function readAgain() {
    const t = await tab();
    if (!t || !state.url || !state.items.length) return read();
    state.tabId = t.id;
    const got = await toPage({ type: "read", fresh: false });
    if (!got || got.url !== state.url) return read(); // a different post: start over
    if (!got.comments.length) return live("No new comments since the last read.", 2800);
    readMore(got.comments);
  }
  $("again-btn").addEventListener("click", readAgain);
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
    $("for-who").innerHTML = places().length ? `someone<br>raised in ${esc(placesText())}` : "anyone<br>raised outside the US";
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

  // EN | 한: which language the explanations are written in (applies from the next read)
  const paintLang = () => document.querySelectorAll("#lang-seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang())));
  async function switchLang(to) {
    // every card keeps its text in each language it has been shown in, so switching back is instant
    const FIELDS = (it) => ({ answer: it.answer || "", origin: it.origin || "", closest: it.closest || "" });
    state.items.forEach((it) => { it.tx = it.tx || {}; it.tx[it.lang || "en"] = it.tx[it.lang || "en"] || FIELDS(it); });
    const need = state.items.map((it, i) => ({ it, i })).filter(({ it }) => !it.tx[to]);
    const apply = () => {
      state.items.forEach((it) => { if (it.tx[to]) { Object.assign(it, it.tx[to]); it.lang = to; } });
      const box = document.querySelector(".panel-scroll"), y = box ? box.scrollTop : 0, keep = state.focus;
      quietScroll = true; render(); setFocus(keep, false); quietScroll = false;
      if (box) box.scrollTop = y;
      toPage({ type: "highlight", items: state.items, focus: keep });
    };
    if (!need.length) return apply();
    live(to === "ko" ? "Translating to Korean…" : "Translating to English…");
    try {
      // ask for whatever is still missing, up to two rounds, so one card that fails does not stay in the old language
      let missing = need;
      for (let round = 0; round < 2 && missing.length; round++) {
        const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translate: { to, items: missing.map(({ it, i }) => ({ id: String(i), ...it.tx[it.lang || "en"] })) } }) });
        const data = await res.json().catch(() => ({}));
        (data.items || []).forEach((t) => { const it = state.items[+t.id]; if (it) it.tx[to] = { answer: t.answer, origin: t.origin, closest: t.closest }; });
        missing = missing.filter(({ it }) => !it.tx[to]);
        if (data.items && data.items.length) apply(); // show what arrived right away
      }
      if (missing.length === need.length) throw new Error("no translation");
      apply();
      live(missing.length ? `${missing.length} card${missing.length === 1 ? "" : "s"} could not be translated. Tap ${to === "ko" ? "한" : "EN"} again to retry.` : "Done", missing.length ? 3500 : 1200);
    } catch { live("Couldn't translate. Try again.", 3000); }
  }
  $("lang-seg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]"); if (!b || b.dataset.lang === lang()) return;
    store.set("lang", b.dataset.lang); paintLang();
    if (!$("panel-results").hidden && state.items.length) switchLang(b.dataset.lang);
  });
  paintLang();
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
    if (msg.type === "ask") { askAbout(msg); return; }
    if (msg.type === "more" && !$("panel-results").hidden && autoOn()) { readMore(msg.comments); return; }
    if (msg.type === "navigated") {
      paintStart(msg.url);
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
