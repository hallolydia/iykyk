// Runs on instagram.com, and on YouTube, Reddit and article pages once you click the icon there.
// Reads only the comment TEXT that is visible (never usernames or photos),
// and draws highlights over Instagram's text without changing its page.
(() => {
  "use strict";
  if (window.__iykyk) return;
  window.__iykyk = true;

  // After the extension is reloaded, an earlier copy of this script may have left its panel, hints and
  // styles on the page. Remove them so a reload never stacks a second copy on top of the first.
  ["iykyk-panel", "iykyk-point", "iykyk-point-hl", "iykyk-ask", "iykyk-room", "iykyk-style", "iykyk-pop-style"].forEach((id) => document.getElementById(id)?.remove());
  if ("highlights" in CSS) ["iykyk", "iykyk-check", "iykyk-on"].forEach((k) => CSS.highlights.delete(k));

  // Instagram's own UI labels (English and Korean) that are not comments
  const UI = /^(reply|replies|see translation|see original|view replies.*|view all \d+ replies|hide replies|like|likes|\d[\d,.]* likes?|follow|following|more|original audio|edited|verified|답글 달기|번역 보기|원본 보기|답글 보기.*|답글 \d+개 모두 보기|좋아요.*|팔로우|팔로잉|더 보기|댓글|게시|오리지널 오디오|수정됨|인증됨)$/i;
  const TIME = /^(\d+\s?(s|m|h|d|w|y|초|분|시간|일|주|년)( 전)?)(\s?·\s?(수정됨|edited))?$/i;

  // which kind of page this is decides where the text is
  const HOST = location.hostname;
  const KIND = /(^|\.)instagram\.com$/.test(HOST) ? "instagram" : /(^|\.)youtube\.com$/.test(HOST) ? "youtube" : /(^|\.)reddit\.com$/.test(HOST) ? "reddit" : "page";
  const SITE = { instagram: "Instagram", youtube: "YouTube", reddit: "Reddit" }[KIND] || HOST.replace(/^www\./, "");
  const SELECTORS = {
    youtube: ["ytd-comment-thread-renderer #content-text", "ytd-comment-view-model #content-text", "#content-text.ytd-comment-view-model"],
    reddit: ['shreddit-comment div[slot="comment"]', '[data-testid="comment"]', "div.md", ".Comment p"],
    page: ["article p", "main p", '[class*="comment"] p', '[id*="comment"] p', "p"]
  };

  let found = []; // [{ id, el, text }]

  // Pick the area with the most text: the open post dialog, or the post page itself
  function container() {
    const main = document.querySelector("main");
    const roots = [...document.querySelectorAll('[role="dialog"]')].filter((d) => d.offsetParent !== null);
    if (main) roots.push(main);
    roots.sort((a, b) => b.querySelectorAll('span[dir="auto"]').length - a.querySelectorAll('span[dir="auto"]').length);
    return roots[0] || document.body;
  }

  function visible(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  }

  // The sentence itself: skip text inside links (usernames), time stamps, and buttons
  function ownText(el) {
    let t = "";
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (n.parentElement.closest('a, time, button, [role="button"]')) continue;
      t += n.nodeValue;
    }
    return t.replace(/\s+/g, " ").replace(/^[\s·•]+|[\s·•]+$/g, "").trim();
  }

  // IYKYK explains English comments only. Text that is mostly another script (Korean, Arabic...) is skipped.
  const skipped = new Set();
  function mostlyEnglish(t) {
    const letters = (t.match(/\p{L}/gu) || []).length;
    if (letters < 2) return true; // emoji-only or very short: leave as is
    return (t.match(/[A-Za-z]/g) || []).length / letters >= 0.4;
  }

  // YouTube, Reddit and article pages: read the visible blocks of text with the page's own selectors.
  function readGeneric(fresh) {
    if (fresh) { found = []; skipped.clear(); }
    const seen = found.map((f) => f.text);
    const added = [];
    const els = [...new Set((SELECTORS[KIND] || SELECTORS.page).flatMap((q) => [...document.querySelectorAll(q)]))]
      .sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1));
    for (const el of els) {
      if (el.closest("#iykyk-panel") || !visible(el)) continue;
      const text = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (text.length < (KIND === "page" ? 40 : 2) || text.length > 600) continue;
      if (seen.some((s) => s.includes(text) || text.includes(s))) continue;
      if (!mostlyEnglish(text)) { skipped.add(text); continue; }
      seen.push(text);
      const item = { id: "c" + (found.length + 1), el, text };
      found.push(item); added.push(item);
    }
    return added.slice(0, 20).map(({ id, text }) => ({ id, text }));
  }

  // fresh = true: start over (new post). false: keep what was read, return only new comments.
  function readComments(fresh = true) {
    if (KIND !== "instagram") return readGeneric(fresh);
    const root = container();
    if (fresh) { found = []; skipped.clear(); }
    const seen = found.map((f) => f.text);
    const added = [];
    root.querySelectorAll('span[dir="auto"], h1[dir="auto"]').forEach((el) => {
      if (el.closest("a, button, h2, [role='button'], time, #iykyk-panel")) return;
      const text = ownText(el);
      if (text.length < 2 || UI.test(text) || TIME.test(text) || /^[\d.,]+[km만천]?$/i.test(text)) return;
      if (!visible(el) || seen.some((s) => s.includes(text))) return;
      if (!mostlyEnglish(text)) { skipped.add(text); return; }
      seen.push(text);
      const item = { id: "c" + (found.length + 1), el, text };
      found.push(item); added.push(item);
    });
    // Nothing found the usual way (Instagram changes its layout often): look at every small piece of plain text in the open post.
    if (!added.length && !found.length) {
      container().querySelectorAll("span, div").forEach((el) => {
        if (el.children.length || el.closest("a, button, h1, h2, [role='button'], time, #iykyk-panel")) return;
        const text = ownText(el);
        if (text.length < 6 || text.length > 600 || UI.test(text) || TIME.test(text) || /^[\d.,]+[km만천]?$/i.test(text)) return;
        if (!visible(el) || seen.some((s) => s.includes(text))) return;
        seen.push(text);
        if (!mostlyEnglish(text)) { skipped.add(text); return; }
        const item = { id: "c" + (found.length + 1), el, text };
        found.push(item); added.push(item);
      });
    }
    return added.slice(0, 20).map(({ id, text }) => ({ id, text }));
  }

  // scrolling the comments: read what's newly on screen (only while the panel is open)
  let scrollTimer;
  document.addEventListener("scroll", () => {
    if (!panelOpen() || !found.length) return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const fresh = readComments(false);
      if (fresh.length) chrome.runtime.sendMessage({ type: "more", comments: fresh }).catch(() => {});
    }, 300);
  }, true);

  // The track playing under the post. Instagram shows it as a link to the audio page.
  function readAudio() {
    if (KIND !== "instagram") return "";
    const root = container();
    const link = root.querySelector('a[href*="/audio/"]') || document.querySelector('a[href*="/reels/audio/"]');
    const text = (link?.innerText || "").replace(/\s*•\s*/g, " · ").replace(/\s+/g, " ").trim();
    if (!text) {
      // no song link: the creator's own sound shows as plain text
      const own = [...root.querySelectorAll("span")].some((s) => /^(original audio|오리지널 오디오)$/i.test((s.innerText || "").trim()));
      return own ? "original audio (the creator's own sound)" : "";
    }
    if (/^(original audio|오리지널 오디오)$/i.test(text)) return "original audio (the creator's own sound)";
    return text.slice(0, 120);
  }

  // ---- highlights (CSS Custom Highlight API: draws over text, no DOM changes) ----
  const style = document.createElement("style");
  style.id = "iykyk-style";
  style.textContent = `
    ::highlight(iykyk){background-color:#D4FF3A;color:#111}
    ::highlight(iykyk-check){background-color:#FFF4D6;color:#111;text-decoration:underline dashed 2px #E0A100}
    ::highlight(iykyk-on){background-color:#D4FF3A;color:#111;text-decoration:underline solid 2px #111;text-underline-offset:3px}`;
  document.documentElement.appendChild(style);

  let marks = []; // [{ i, range, check }]

  function rangeFor(el, quote) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const at = node.nodeValue.indexOf(quote);
      if (at > -1) { const r = new Range(); r.setStart(node, at); r.setEnd(node, at + quote.length); return r; }
    }
    return null;
  }

  function paint(focusIndex) {
    if (!("highlights" in CSS)) return;
    const normal = [], check = [], on = [];
    marks.forEach((m) => (m.i === focusIndex ? on : m.check ? check : normal).push(m.range));
    CSS.highlights.set("iykyk", new Highlight(...normal));
    CSS.highlights.set("iykyk-check", new Highlight(...check));
    CSS.highlights.set("iykyk-on", new Highlight(...on));
  }

  function highlight(items, focusIndex) {
    marks = [];
    items.forEach((it, i) => {
      if (it.done === "knew") return;
      (it.comment_ids || [it.comment_id]).forEach((cid) => {
        const f = found.find((c) => c.id === cid);
        const range = f && rangeFor(f.el, it.quote);
        if (range) marks.push({ i, range, check: !!it.check });
      });
    });
    paint(focusIndex);
    return marks.length;
  }

  function focus(i, scroll) {
    paint(i);
    const m = marks.find((x) => x.i === i);
    if (m && scroll) m.range.startContainer.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function clear() { marks = []; if ("highlights" in CSS) ["iykyk", "iykyk-check", "iykyk-on"].forEach((k) => CSS.highlights.delete(k)); }

  // ---- point at Instagram's comment icon when the comments are closed ----
  let pointEl = null, pointHl = null, pointRaf = 0, pointTimer = 0;
  function unpoint() {
    cancelAnimationFrame(pointRaf); clearTimeout(pointTimer);
    if (pointEl) { pointEl.remove(); pointEl = null; }
    if (pointHl) { pointHl.remove(); pointHl = null; }
  }
  const commentsOpen = () => [...document.querySelectorAll("textarea, [contenteditable='true']")].some((x) => !x.closest("#iykyk-panel") && visible(x));
  // the box that holds Instagram's comment icon and the count under it, measured right now
  function commentIconBox() {
    const svg = [...document.querySelectorAll("svg[aria-label]")].find((x) => /^(comment|댓글)$/i.test(x.getAttribute("aria-label")) && visible(x));
    if (!svg) return null;
    const ir = svg.getBoundingClientRect();
    let box = ir;
    for (let n = svg.parentElement, i = 0; n && i < 5; n = n.parentElement, i++) {
      const r = n.getBoundingClientRect();
      if (r.height >= ir.height + 14 && r.width <= 130) { box = r; break; }
    }
    return { box, ir };
  }
  function pointAtComments() {
    unpoint();
    if (KIND !== "instagram" || commentsOpen() || !commentIconBox()) return false;
    // the highlighter: semi-transparent lime, blended (multiply) so the icon and the number stay readable on top of it.
    // No z-index of its own, so it is not boxed off from the page and the blend reaches the icon.
    pointHl = document.createElement("div");
    pointHl.id = "iykyk-point-hl";
    pointHl.style.cssText = "position:fixed;pointer-events:none;background:#D4FF3A;opacity:.7;mix-blend-mode:multiply";
    document.documentElement.appendChild(pointHl);
    pointEl = document.createElement("div");
    pointEl.id = "iykyk-point";
    pointEl.style.cssText = "position:fixed;z-index:2147483645;pointer-events:none;left:0;top:0;width:0;height:0";
    pointEl.innerHTML = `
      <style>@keyframes iykyk-nudge{0%,100%{transform:translateX(0) rotate(-3deg)}50%{transform:translateX(6px) rotate(-3deg)}}@media (prefers-reduced-motion:reduce){#iykyk-point div{animation:none!important}}</style>
      <div id="iykyk-point-label" style="position:fixed;background:#111;color:#fff;border-radius:999px;padding:4px 10px;font:800 11px 'Inter Tight',system-ui,sans-serif;white-space:nowrap;transform:rotate(-3deg);animation:iykyk-nudge 1.8s ease-in-out infinite">Open comments</div>`;
    document.documentElement.appendChild(pointEl);
    const label = pointEl.querySelector("#iykyk-point-label");
    // follow the icon every frame, so it stays on THIS content's icon while the page scrolls or the reel changes
    const place = () => {
      const m = commentIconBox();
      if (!m || commentsOpen()) return unpoint();
      const { box, ir } = m, padX = 10, padY = 8, w = Math.max(box.width, ir.width) + padX * 2, h = box.height + padY * 2, left = box.left + box.width / 2 - w / 2;
      Object.assign(pointHl.style, { left: left + "px", top: box.top - padY + "px", width: w + "px", height: h + "px", borderRadius: Math.min(w, h) / 2 + "px" });
      Object.assign(label.style, { right: innerWidth - left + 4 + "px", top: box.top + box.height / 2 - 11 + "px" });
      pointRaf = requestAnimationFrame(place);
    };
    place();
    document.addEventListener("click", unpoint, { once: true, capture: true });
    pointTimer = setTimeout(unpoint, 8000);
    return true;
  }

  // ---- "Ask IYKYK": select words the AI missed, a small lime sticker appears next to them ----
  let askBtn = null, askPick = null;
  function hideAsk() { if (askBtn) askBtn.style.display = "none"; askPick = null; }
  function showAsk(rect, pick) {
    if (!askBtn) {
      askBtn = document.createElement("button");
      askBtn.id = "iykyk-ask"; askBtn.type = "button"; askBtn.textContent = "Ask IYKYK";
      askBtn.style.cssText = "position:fixed;z-index:2147483646;background:#D4FF3A;color:#111;border:1.5px solid #111;border-radius:999px;padding:6px 13px;font:800 13px 'Inter Tight',system-ui,sans-serif;cursor:pointer;transform:rotate(-3deg);box-shadow:2px 2px 0 #111;animation:iykyk-pop .18s cubic-bezier(.3,1.6,.5,1)";
      const st = document.createElement("style");
      st.id = "iykyk-pop-style";
      st.textContent = "@keyframes iykyk-pop{from{opacity:0;transform:rotate(-3deg) scale(.6)}to{opacity:1;transform:rotate(-3deg) scale(1)}}";
      document.documentElement.appendChild(st);
      askBtn.addEventListener("mousedown", (e) => e.preventDefault()); // keep the selection
      askBtn.addEventListener("click", () => {
        if (askPick) chrome.runtime.sendMessage({ type: "ask", id: askPick.id, comment: askPick.comment, quote: askPick.quote }).catch(() => {});
        hideAsk(); getSelection().removeAllRanges();
      });
      document.documentElement.appendChild(askBtn);
    }
    askPick = pick;
    const maxLeft = document.documentElement.clientWidth - 120;
    askBtn.style.left = Math.max(8, Math.min(rect.left, maxLeft)) + "px";
    askBtn.style.top = Math.min(rect.bottom + 8, innerHeight - 40) + "px";
    askBtn.style.display = "block";
  }
  document.addEventListener("mouseup", (e) => {
    if (!panelOpen() || (askBtn && e.target === askBtn)) return;
    setTimeout(() => {
      const sel = getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return hideAsk();
      const quote = sel.toString().replace(/\s+/g, " ").trim();
      const range = sel.getRangeAt(0);
      if (quote.length < 2 || quote.length > 140 || (range.commonAncestorContainer.parentElement || range.commonAncestorContainer).closest?.("#iykyk-panel")) return hideAsk();
      let f = found.find((c) => c.el.contains(range.commonAncestorContainer));
      if (!f) { readComments(false); f = found.find((c) => c.el.contains(range.commonAncestorContainer)); }
      if (!f || !f.text.includes(quote)) return hideAsk();
      if (!mostlyEnglish(quote)) return hideAsk(); // English only: no sticker on Korean, Arabic or other text
      showAsk(range.getBoundingClientRect(), { id: f.id, comment: f.text, quote });
    }, 0);
  }, true);
  document.addEventListener("selectionchange", () => { const s = getSelection(); if (!s || s.isCollapsed) hideAsk(); });
  document.addEventListener("scroll", hideAsk, true);

  // ---- the iykyk panel: an extension page in a frame on the right, over the page ----
  let frameBox = null;
  // make room: the page gets narrower than the panel's 400px, and if Instagram's comment box still doesn't fit,
  // the page is scaled down a little so there are 20px between the comment box and the panel.
  const PANEL_W = 400, GAP = 20;
  let shiftedCard = null;
  function unshift() { if (shiftedCard) { shiftedCard.style.translate = ""; shiftedCard = null; } }
  function fitRoom() {
    const st = document.getElementById("iykyk-room");
    if (!st) return;
    unshift();
    if (KIND !== "instagram") { st.textContent = `html{width:calc(100% - ${PANEL_W + GAP}px)!important;overflow-x:hidden!important}`; return; }
    const keep = "overflow-x:hidden!important";
    st.textContent = `html{width:calc(100% - ${PANEL_W}px)!important;${keep}}`; // measure without any scaling
    const limit = innerWidth - PANEL_W - GAP;
    const input = [...document.querySelectorAll("textarea, [contenteditable='true']")].find((x) => !x.closest("#iykyk-panel") && visible(x));
    const f = found.find((c) => c.el.isConnected && visible(c.el));
    const anchor = input || (f && f.el);
    const round = (n) => parseFloat(getComputedStyle(n).borderTopRightRadius) >= 8;

    // Layout A: the video and the comment box live together. Find the smallest box that holds both and, if it fits,
    // slide only that box so its right edge is exactly 20px from the panel. The page below it stays put, so nothing gets cut.
    const video = [...document.querySelectorAll("video")].find((v) => visible(v) && !v.closest("#iykyk-panel"));
    let card = null;
    if (input && video) {
      for (let n = input; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        if (n.contains(video)) { if (n.getBoundingClientRect().width >= 400) card = n; break; }
      }
    }
    if (card) {
      const r = card.getBoundingClientRect();
      if (r.width <= limit - 8) { // fits: move it
        card.style.translate = `${Math.round(limit - r.right)}px 0px`;
        shiftedCard = card;
        return;
      }
      // too wide to fit even beside the panel: fall through and make the page narrower
    }

    // Layout B: the comment box opens separately next to the video. Measure it and make the page narrower only if it would not fit.
    let right = 0;
    if (anchor) {
      for (let n = anchor; n && n !== document.body; n = n.parentElement) {
        const r = n.getBoundingClientRect();
        if (r.width >= 300 && r.width <= 720 && round(n)) { right = r.right; break; }
      }
      if (!right) right = anchor.getBoundingClientRect().right + 70;
    }
    // Never scale the page (it shrank the video and left a black strip). Only make the page narrower:
    // Instagram lays the comment box out again further left, so its right edge ends up 20px from the panel.
    const extra = right > limit ? Math.min(Math.round(right - limit), Math.max(0, innerWidth - PANEL_W - 600)) : 0;
    if (extra > 0) st.textContent = `html{width:calc(100% - ${PANEL_W + extra}px)!important;${keep}}`;
  }
  function makeRoom(on) {
    let st = document.getElementById("iykyk-room");
    if (on && !st) {
      st = document.createElement("style");
      st.id = "iykyk-room";
      document.documentElement.appendChild(st);
      fitRoom();
      setTimeout(fitRoom, 400); setTimeout(fitRoom, 1500); // Instagram lays out late
    } else if (!on && st) { unshift(); st.remove(); }
    setTimeout(() => window.dispatchEvent(new Event("resize")), 50); // tell Instagram to re-layout
  }
  let fitTimer;
  window.addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitRoom, 250); });
  function openPanel() {
    makeRoom(true);
    if (frameBox) { frameBox.style.display = "block"; return; }
    frameBox = document.createElement("div");
    frameBox.id = "iykyk-panel";
    frameBox.style.cssText = "position:fixed;top:0;right:0;bottom:0;width:400px;z-index:2147483647;overflow:hidden;border-left:1px solid #E4E4E1;box-shadow:-8px 0 24px rgba(0,0,0,.06);background:#F4F4F4";
    const f = document.createElement("iframe");
    f.src = chrome.runtime.getURL("sidepanel.html");
    f.title = "iykyk";
    f.style.cssText = "width:100%;height:100%;border:0;display:block";
    frameBox.appendChild(f);
    document.documentElement.appendChild(frameBox);
  }
  function closePanel() { if (frameBox) frameBox.style.display = "none"; makeRoom(false); hideAsk(); unpoint(); clear(); }
  function panelOpen() { return !!frameBox && frameBox.style.display !== "none"; }

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg.type === "audio") { reply({ audio: readAudio() }); }
    else if (msg.type === "toggle") { panelOpen() ? closePanel() : openPanel(); reply({ ok: true }); }
    else if (msg.type === "close") { closePanel(); reply({ ok: true }); }
    else if (msg.type === "read") reply({ comments: readComments(msg.fresh !== false), url: location.href, skipped: skipped.size, kind: KIND, site: SITE });
    else if (msg.type === "highlight") reply({ drawn: highlight(msg.items, msg.focus) });
    else if (msg.type === "focus") { focus(msg.i, msg.scroll); reply({ ok: true }); }
    else if (msg.type === "point") { reply({ pointed: pointAtComments() }); }
    else if (msg.type === "clear") { clear(); reply({ ok: true }); }
    return false;
  });

  // Instagram is a single-page app: tell the panel when the post changes
  let last = location.href;
  setInterval(() => {
    if (location.href !== last) {
      last = location.href; clear(); unpoint();
      setTimeout(() => { if (panelOpen() && KIND === "instagram") pointAtComments(); }, 900); // new content, comments closed: show where to open them
      chrome.runtime.sendMessage({ type: "navigated", url: last }).catch(() => {});
    }
  }, 800);
})();
