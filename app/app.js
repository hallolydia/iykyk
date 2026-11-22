// IYKYK demo page logic. Same behavior the extension panel will use.
(function () {
  "use strict";

  const QUESTION = {
    funny: "Why is this funny?",
    reference: "What's the reference?",
    tone: "Is this rude or friendly?"
  };
  const SHOW_AT = 0.7;   // confidence at or above: normal card
  const DROP_BELOW = 0.4; // confidence below: dropped. In between: "Needs checking"

  // ---------- storage (browser only, never required) ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("iykyk." + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("iykyk." + key, JSON.stringify(value)); } catch (e) { /* private mode: keep going */ }
    }
  };
  const norm = (s) => String(s || "").trim().toLowerCase();

  const state = {
    postIndex: 0,
    items: [],      // visible items for the current post
    hidden: [],     // items hidden because the user already knows them
    focus: 0,
    country: store.get("country", null),
    known: new Set(store.get("known", [])),
    saved: store.get("saved", []) // { phrase, answer, question, status, source, title, date }
  };

  // ---------- elements ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    scene: $("reel-scene"), source: $("post-source"), title: $("post-title"), caption: $("post-caption"),
    comments: $("comments"), prev: $("prev-post"), next: $("next-post"),
    start: $("panel-start"), loading: $("panel-loading"), results: $("panel-results"),
    readBtn: $("read-btn"), tune: $("tune"), tuneYes: $("tune-yes"), tuneNo: $("tune-no"),
    countBig: $("count-big"), countText: $("count-text"), hiddenText: $("hidden-text"),
    panelTitle: $("panel-title"), cards: $("cards"), hiddenCard: $("hidden-card"), done: $("done"),
    toast: $("toast"), nykCount: $("nyk-count"), countryPill: $("country-pill"), scroll: $("panel-scroll")
  };

  const post = () => window.IYKYK_SAMPLES[state.postIndex];

  // ---------- helpers ----------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  let toastTimer;
  function toast(text) {
    el.toast.textContent = text;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), 1600);
  }

  function updateTop() {
    el.nykCount.textContent = state.saved.filter((s) => s.status !== "confused").length;
    el.countryPill.textContent = state.country ? "🇰🇷 Grew up in Korea" : "🌐 Outside the US";
  }

  function save(item, status) {
    const p = post();
    state.saved = state.saved.filter((s) => norm(s.phrase) !== norm(item.quote));
    state.saved.unshift({
      phrase: item.quote, answer: item.answer, question: item.question, status,
      source: p.source, title: p.title, date: new Date().toISOString()
    });
    store.set("saved", state.saved);
    updateTop();
  }

  // ---------- post (left side) ----------
  function renderPost() {
    const p = post();
    el.scene.textContent = p.scene;
    el.source.textContent = p.source;
    el.title.textContent = p.title + " · " + p.comments.length + " comments";
    el.caption.textContent = p.caption;
    el.prev.disabled = state.postIndex === 0;
    el.next.disabled = state.postIndex === window.IYKYK_SAMPLES.length - 1;
    renderComments();
  }

  function renderComments() {
    const p = post();
    el.comments.innerHTML = p.comments.map((c, ci) => {
      let html = escapeHtml(c.text);
      // wrap each flagged quote in this comment (exact match only)
      state.items.forEach((it, i) => {
        if (it.comment_id !== c.id) return;
        const q = escapeHtml(it.quote);
        const at = html.indexOf(q);
        if (at === -1) return;
        const cls = "m" + (it.check ? " check" : "");
        html = html.slice(0, at) + `<span class="${cls}" data-i="${i}" tabindex="0"><span class="n">${i + 1}</span>${q}</span>` + html.slice(at + q.length);
      });
      const isTop = ci === 0 && state.items.some((it) => it.comment_id === c.id);
      return `<li class="comment"><div class="av"></div><div><p class="who">Comment ${ci + 1}</p>
        <p class="text">${html}</p>
        <p class="meta">♡ ${escapeHtml(c.likes)}${isTop ? ' <button class="why" type="button" data-why="' + c.id + '"><i></i>Why is this funny?</button>' : ""}</p></div></li>`;
    }).join("");
  }

  // ---------- analysis ----------
  // For now this returns the saved sample result. The live AI call plugs in here.
  function analyze(p) {
    return new Promise((resolve) => setTimeout(() => resolve(p.result), 1100));
  }

  // Rules from DESIGN.md: quote must exist in the comment, drop low confidence, hide what you know
  function applyRules(p, result) {
    const byId = Object.fromEntries(p.comments.map((c) => [c.id, c.text]));
    const perComment = {};
    const visible = [], hidden = [];
    (result.items || []).forEach((it) => {
      const text = byId[it.comment_id];
      if (!text || !text.includes(it.quote)) return;          // quote check
      if ((it.confidence ?? 0) < DROP_BELOW) return;            // too unsure
      perComment[it.comment_id] = (perComment[it.comment_id] || 0) + 1;
      if (perComment[it.comment_id] > 2) return;                // max 2 per comment
      const item = Object.assign({}, it, { check: it.confidence < SHOW_AT });
      if (state.known.has(norm(it.quote))) hidden.push(item); else visible.push(item);
    });
    // order by where they appear on screen
    const order = p.comments.map((c) => c.id);
    visible.sort((a, b) => order.indexOf(a.comment_id) - order.indexOf(b.comment_id));
    return { visible, hidden };
  }

  async function read() {
    el.start.hidden = true;
    el.loading.hidden = false;
    el.results.hidden = true;
    const p = post();
    const result = await analyze(p);
    const { visible, hidden } = applyRules(p, result);
    state.items = visible;
    state.hidden = hidden;
    state.focus = 0;
    el.loading.hidden = true;
    el.results.hidden = false;
    renderComments();
    renderPanel();
    cardEl(0)?.focus({ preventScroll: true }); // keyboard works right away
  }

  // ---------- panel ----------
  function renderPanel() {
    const n = state.items.length;
    el.tune.hidden = !!state.country || store.get("tuneDismissed", false);
    el.countBig.textContent = n;
    el.countText.textContent = n === 1 ? "thing you might miss." : "things you might miss.";
    el.hiddenText.textContent = state.hidden.length
      ? `${state.hidden.length} hidden because you already know ${state.hidden.length === 1 ? "it" : "them"}.`
      : "";
    el.panelTitle.textContent = n === 1 ? "1 thing in this post" : `${n} things in this post`;

    if (n === 0) {
      el.cards.innerHTML = `<div class="card"><p class="phrase">Nothing to decode.</p><p class="answer">You're basically from here now.</p></div>`;
    } else {
      el.cards.innerHTML = state.items.map(cardHtml).join("");
    }

    if (state.hidden.length) {
      el.hiddenCard.hidden = false;
      el.hiddenCard.innerHTML = `<b>${state.hidden.length} hidden · you already know ${state.hidden.length === 1 ? "it" : "them"}</b><p>${state.hidden.map((h) => escapeHtml(h.quote)).join(" · ")}</p>`;
    } else {
      el.hiddenCard.hidden = true;
    }
    el.done.hidden = true;
    setFocus(0, false);
  }

  function cardHtml(it, i) {
    const q = it.check ? "check" : "";
    const emo = it.emoji ? `<div class="emo"><div class="sel" aria-hidden="true"><i></i><i></i><i></i><i></i>${escapeHtml(it.emoji.char)}</div><div class="et"><b>${escapeHtml(it.emoji.meaning.split(".")[0])}.</b><br>${escapeHtml(it.emoji.meaning.split(".").slice(1).join(".").trim())}</div></div>` : "";
    const det = [];
    if (it.origin) det.push(`<div class="det"><p class="lab">Where it comes from</p><p>${escapeHtml(it.origin)}</p></div>`);
    if (it.closest && state.country) det.push(`<div class="det"><p class="lab">Closest thing in Korea <span class="cm">closest match</span></p><p>${escapeHtml(it.closest)}</p></div>`);
    const more = det.length ? `<button class="more" type="button" data-more="${i}" aria-expanded="false">More ▾</button><div class="details" hidden>${det.join("")}</div>` : "";
    return `<article class="card" data-i="${i}" tabindex="-1">
      <div class="row1"><span class="badge ${q}">${i + 1}</span><span class="qtag">${QUESTION[it.question] || QUESTION.reference}</span>${it.check ? '<span class="qtag check">⚠ Needs checking</span>' : ""}</div>
      <h3 class="phrase">${escapeHtml(it.quote)}</h3>
      <p class="answer">${escapeHtml(it.answer)}</p>
      ${emo}${more}
      <div class="acts">
        <button class="primary" type="button" data-act="got">Got it <kbd>space</kbd></button>
        <button class="secondary" type="button" data-act="knew">I knew this</button>
        <button class="link" type="button" data-act="confused">Still confused</button>
      </div>
      <p class="status" hidden></p>
    </article>`;
  }

  function cardEl(i) { return el.cards.querySelector(`.card[data-i="${i}"]`); }
  function markEl(i) { return el.comments.querySelector(`.m[data-i="${i}"]`); }

  function setFocus(i, scrollPanel = true) {
    if (!state.items.length) return;
    state.focus = Math.max(0, Math.min(i, state.items.length - 1));
    el.cards.querySelectorAll(".card").forEach((c) => c.classList.toggle("on", +c.dataset.i === state.focus));
    el.comments.querySelectorAll(".m").forEach((m) => m.classList.toggle("on", +m.dataset.i === state.focus));
    if (scrollPanel) cardEl(state.focus)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function nextUnhandled(from) {
    for (let k = from + 1; k < state.items.length; k++) if (!state.items[k].done) return k;
    return -1;
  }

  function act(i, kind) {
    const it = state.items[i];
    if (!it || it.done) return;
    const card = cardEl(i), status = card.querySelector(".status");
    if (kind === "got") {
      it.done = true; save(it, "got"); toast("Now you know.");
      card.classList.add("handled");
    } else if (kind === "knew") {
      it.done = true; state.known.add(norm(it.quote)); store.set("known", [...state.known]); save(it, "knew");
      toast("Look at you. I'll skip this next time.");
      card.classList.add("handled");
      const m = markEl(i); if (m) m.classList.add("gone");
    } else if (kind === "confused") {
      save(it, "confused");
      status.hidden = false;
      status.textContent = "Noted. I'll do better on this one. It's saved under Still confused.";
      return;
    }
    const nx = nextUnhandled(i);
    if (nx === -1) { el.done.hidden = false; } else { setFocus(nx); }
  }

  // ---------- events ----------
  el.readBtn.addEventListener("click", read);

  el.prev.addEventListener("click", () => switchPost(-1));
  el.next.addEventListener("click", () => switchPost(1));
  function switchPost(d) {
    state.postIndex = Math.max(0, Math.min(state.postIndex + d, window.IYKYK_SAMPLES.length - 1));
    state.items = []; state.hidden = [];
    el.start.hidden = false; el.loading.hidden = true; el.results.hidden = true;
    el.scroll.scrollTop = 0;
    renderPost();
  }

  el.tuneYes.addEventListener("click", () => {
    state.country = "KR"; store.set("country", "KR"); updateTop();
    el.tune.hidden = true; toast("Tuned for Korea.");
    renderPanel(); renderComments(); setFocus(state.focus, false);
  });
  el.tuneNo.addEventListener("click", () => { store.set("tuneDismissed", true); el.tune.hidden = true; });

  el.cards.addEventListener("click", (e) => {
    const card = e.target.closest(".card"); if (!card) return;
    const i = +card.dataset.i;
    const actBtn = e.target.closest("[data-act]");
    const moreBtn = e.target.closest("[data-more]");
    if (actBtn) { act(i, actBtn.dataset.act); return; }
    if (moreBtn) {
      const d = moreBtn.nextElementSibling; d.hidden = !d.hidden;
      moreBtn.setAttribute("aria-expanded", String(!d.hidden));
      moreBtn.textContent = d.hidden ? "More ▾" : "Less ▴";
      return;
    }
    setFocus(i, false);
    const m = markEl(i);
    if (m) { m.scrollIntoView({ behavior: "smooth", block: "center" }); m.classList.remove("blink"); void m.offsetWidth; m.classList.add("blink"); }
  });

  // hover linking both ways
  el.cards.addEventListener("mouseover", (e) => { const c = e.target.closest(".card"); if (c) markEl(+c.dataset.i)?.classList.add("hover"); });
  el.cards.addEventListener("mouseout", (e) => { const c = e.target.closest(".card"); if (c) markEl(+c.dataset.i)?.classList.remove("hover"); });
  el.comments.addEventListener("mouseover", (e) => { const m = e.target.closest(".m"); if (m) cardEl(+m.dataset.i)?.classList.add("hover"); });
  el.comments.addEventListener("mouseout", (e) => { const m = e.target.closest(".m"); if (m) cardEl(+m.dataset.i)?.classList.remove("hover"); });
  el.comments.addEventListener("click", (e) => {
    const m = e.target.closest(".m");
    if (m && !m.classList.contains("gone")) { setFocus(+m.dataset.i); return; }
    const why = e.target.closest("[data-why]");
    if (why) {
      if (el.results.hidden) { read(); return; }
      const i = state.items.findIndex((it) => it.comment_id === why.dataset.why);
      if (i > -1) setFocus(i);
    }
  });

  // keyboard: ↑ ↓ move, Space = Got it
  document.addEventListener("keydown", (e) => {
    if (el.results.hidden || !state.items.length) return;
    const t = e.target instanceof Element ? e.target : document.body;
    if (t.closest("input, textarea, [contenteditable]")) return;
    // Space on a visible button keeps its normal click
    if (e.key === " " && t.closest("button") && t.offsetParent !== null) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setFocus(state.focus + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocus(state.focus - 1); }
    else if (e.key === " ") { e.preventDefault(); act(state.focus, "got"); }
  });

  // ---------- start ----------
  updateTop();
  renderPost();
})();
