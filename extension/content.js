// Runs on instagram.com.
// Reads only the comment TEXT that is visible (never usernames or photos),
// and draws highlights over Instagram's text without changing its page.
(() => {
  "use strict";
  if (window.__iykyk) return;
  window.__iykyk = true;

  // Instagram's own UI labels (English and Korean) that are not comments
  const UI = /^(reply|replies|see translation|see original|view replies.*|view all \d+ replies|hide replies|like|likes|\d[\d,.]* likes?|follow|following|more|original audio|edited|verified|답글 달기|번역 보기|원본 보기|답글 보기.*|답글 \d+개 모두 보기|좋아요.*|팔로우|팔로잉|더 보기|댓글|게시|오리지널 오디오|수정됨|인증됨)$/i;
  const TIME = /^(\d+\s?(s|m|h|d|w|y|초|분|시간|일|주|년)( 전)?)(\s?·\s?(수정됨|edited))?$/i;

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

  function readComments() {
    const root = container();
    const seen = [];
    found = [];
    root.querySelectorAll('span[dir="auto"], h1[dir="auto"]').forEach((el) => {
      if (el.closest("a, button, h2, [role='button'], time, #iykyk-panel")) return;
      const text = ownText(el);
      if (text.length < 2 || UI.test(text) || TIME.test(text) || /^[\d.,]+[km만천]?$/i.test(text)) return;
      if (!visible(el) || seen.some((s) => s.includes(text))) return;
      seen.push(text);
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
    frameBox.style.cssText = "position:fixed;top:0;right:0;bottom:0;width:400px;z-index:2147483647;overflow:hidden;border-left:1px solid #E4E4E1;box-shadow:-8px 0 24px rgba(0,0,0,.06);background:#F4F4F4";
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
