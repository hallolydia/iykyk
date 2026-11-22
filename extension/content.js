// Runs on instagram.com.
// Reads only the comment TEXT that is visible (never usernames or photos),
// and draws highlights over Instagram's text without changing its page.
(() => {
  "use strict";
  if (window.__iykyk) return;
  window.__iykyk = true;

  // Instagram's own UI words, in English and Korean, that are not comments
  const UI_WORDS = /^(reply|replies|see translation|view replies.*|view all \d+ replies|hide replies|like|likes|follow|following|more|답글 달기|번역 보기|답글 보기.*|답글 \d+개 모두 보기|좋아요.*|팔로우|더 보기|댓글|게시|원본 보기)$/i;
  const TIME = /^\d+\s?(s|m|h|d|w|y|초|분|시간|일|주|년)$/i;

  let found = []; // [{ id, el, text }]

  function container() {
    const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter((d) => d.offsetParent !== null);
    return dialogs[dialogs.length - 1] || document.querySelector("main") || document.body;
  }

  function visible(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  }

  function readComments() {
    const root = container();
    const seen = new Set();
    found = [];
    root.querySelectorAll('span[dir="auto"], h1[dir="auto"]').forEach((el) => {
      if (el.closest("a, button, h2, [role='button'], time, #iykyk-panel")) return; // usernames, buttons, headers, our panel
      if (el.querySelector('span[dir="auto"]')) return;                        // take the innermost text only
      const text = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (text.length < 2 || UI_WORDS.test(text) || TIME.test(text) || /^[\d.,]+[km만천]?$/i.test(text)) return;
      if (!visible(el) || seen.has(text)) return;
      seen.add(text);
      found.push({ id: "c" + (found.length + 1), el, text });
    });
    return found.slice(0, 20).map(({ id, text }) => ({ id, text }));
  }

  // ---- highlights (CSS Custom Highlight API: draws over text, no DOM changes) ----
  const style = document.createElement("style");
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
      const f = found.find((c) => c.id === it.comment_id);
      const range = f && rangeFor(f.el, it.quote);
      if (range) marks.push({ i, range, check: !!it.check });
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

  // ---- the iykyk panel: an extension page in a frame on the right, over the page ----
  let frameBox = null;
  function openPanel() {
    if (frameBox) { frameBox.style.display = "block"; return; }
    frameBox = document.createElement("div");
    frameBox.id = "iykyk-panel";
    frameBox.style.cssText = "position:fixed;top:12px;right:12px;bottom:12px;width:400px;z-index:2147483647;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.18),0 2px 6px rgba(0,0,0,.08);background:#F4F4F4";
    const f = document.createElement("iframe");
    f.src = chrome.runtime.getURL("sidepanel.html");
    f.title = "iykyk";
    f.style.cssText = "width:100%;height:100%;border:0;display:block";
    frameBox.appendChild(f);
    document.documentElement.appendChild(frameBox);
  }
  function closePanel() { if (frameBox) frameBox.style.display = "none"; clear(); }
  function panelOpen() { return !!frameBox && frameBox.style.display !== "none"; }

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg.type === "toggle") { panelOpen() ? closePanel() : openPanel(); reply({ ok: true }); }
    else if (msg.type === "close") { closePanel(); reply({ ok: true }); }
    else if (msg.type === "read") reply({ comments: readComments(), url: location.href });
    else if (msg.type === "highlight") reply({ drawn: highlight(msg.items, msg.focus) });
    else if (msg.type === "focus") { focus(msg.i, msg.scroll); reply({ ok: true }); }
    else if (msg.type === "clear") { clear(); reply({ ok: true }); }
    return false;
  });

  // Instagram is a single-page app: tell the panel when the post changes
  let last = location.href;
  setInterval(() => {
    if (location.href !== last) {
      last = location.href; clear();
      chrome.runtime.sendMessage({ type: "navigated", url: last }).catch(() => {});
    }
  }, 800);
})();
