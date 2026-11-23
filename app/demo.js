// Live demo page. The right side is the real extension panel (extension/sidepanel.html?demo).
// This page plays the part of Instagram: it answers the panel's "read", "highlight" and "focus"
// messages and sends back "navigated" and "ask", the same messages the extension's content script uses.
(() => {
  const SAMPLES = window.IYKYK_SAMPLES;
  const $ = (id) => document.getElementById(id);
  const frame = $("panel-frame");
  let opened = false;
  let idx = 0, items = [], focus = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const post = () => SAMPLES[idx];
  const url = () => post().kind === "reddit" ? "https://www.reddit.com/r/Fauxmoi/comments/" + post().id + "/" : "https://www.instagram.com/p/" + post().id + "/";
  const toPanel = (msg) => opened && frame.contentWindow && frame.contentWindow.postMessage({ iykyk: "page", url: url(), msg }, "*");

  function renderComments() {
    const p = post();
    $("comments").innerHTML = p.comments.map((c, ci) => {
      let html = esc(c.text);
      items.forEach((it, i) => {
        const ids = it.comment_ids || [it.comment_id];
        if (!ids.includes(c.id)) return;
        const q = esc(it.quote), at = html.indexOf(q);
        if (at === -1) return;
        const cls = "m" + (it.check ? " check" : "") + (i === focus ? " on" : "");
        html = html.slice(0, at) + `<span class="${cls}" data-i="${i}"><span class="n">${i + 1}</span>${q}</span>` + html.slice(at + q.length);
      });
      const heart = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9A9A95" stroke-width="2"><path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0 1 12 6.5 5.3 5.3 0 0 1 21.3 12C19 16.4 12 21 12 21z"/></svg>';
      const body = post().kind === "reddit"
        ? `<div class="vote" aria-hidden="true"><span>▲</span><span>▼</span></div><div class="cbody"><p class="text">${html}</p><p class="meta">Reply · Share</p></div>`
        : `<div class="av"></div><div class="cbody"><p class="text">${html}</p><p class="meta">Reply</p></div><span class="heart" aria-hidden="true">${heart}</span>`;
      return `<li class="comment ${post().kind}" data-cid="${esc(c.id)}">${body}</li>`;
    }).join("");
  }

  function renderPost() {
    const p = post();
    $("reel-scene").textContent = p.scene ? "In the post: " + p.scene : "";
    $("post-source").textContent = p.source;
    $("post-title").textContent = p.kind === "reddit" ? p.title : p.title + " · " + p.comments.length + " comments";
    $("post-caption").textContent = p.caption;
    $("pcard").className = "pcard " + p.kind;
    $("prev-post").disabled = idx === 0;
    $("next-post").disabled = idx === SAMPLES.length - 1;
    $("addr-text").textContent = url().replace(/^https:\/\/(www\.)?/, "");
    const m = $("pmedia");
    if (p.embed) { m.hidden = false; if (m.dataset.id !== p.embed) { m.dataset.id = p.embed; m.innerHTML = `<iframe title="Instagram post" src="https://www.instagram.com/p/${p.embed}/embed/" scrolling="no" allowtransparency="true"></iframe>`; } }
    else { m.hidden = true; m.dataset.id = ""; m.innerHTML = ""; }
    renderComments();
  }

  function move(d) {
    idx = Math.max(0, Math.min(idx + d, SAMPLES.length - 1));
    items = []; focus = 0;
    renderPost();
    hideAsk();
    toPanel({ type: "navigated", url: url() });
  }
  $("prev-post").addEventListener("click", () => move(-1));
  $("next-post").addEventListener("click", () => move(1));

  // messages from the panel
  function handle(msg) {
    switch (msg.type) {
      case "read": return { comments: post().comments.map(({ id, text }) => ({ id, text })), url: url(), skipped: 0, kind: post().kind, site: post().kind === "reddit" ? "Reddit" : "Instagram" };
      case "highlight": items = msg.items || []; focus = msg.focus || 0; renderComments(); return { drawn: items.length };
      case "focus": focus = msg.i || 0; renderComments(); { const m = document.querySelector(".m.on"); if (m && msg.scroll) m.scrollIntoView({ block: "center", behavior: "smooth" }); } return { ok: true };
      case "audio": return { audio: "" };
      case "point": return { pointed: false };
      default: return { ok: true };
    }
  }
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || d.iykyk !== "panel" || e.source !== frame.contentWindow) return;
    frame.contentWindow.postMessage({ iykyk: "reply", id: d.id, data: handle(d.msg) }, "*");
  });

  // select words in a comment, then press Ask IYKYK
  const askBtn = $("ask-btn");
  let pick = null;
  function hideAsk() { askBtn.hidden = true; pick = null; }
  document.addEventListener("mouseup", (e) => {
    if (e.target === askBtn) return;
    setTimeout(() => {
      const sel = window.getSelection();
      const quote = sel ? sel.toString().trim() : "";
      const li = sel && sel.rangeCount ? (sel.getRangeAt(0).commonAncestorContainer.parentElement || document.body).closest("li.comment") : null;
      if (!li || quote.length < 2 || quote.length > 140) return hideAsk();
      const c = post().comments.find((x) => x.id === li.dataset.cid);
      if (!c || !c.text.includes(quote)) return hideAsk();
      const r = sel.getRangeAt(0).getBoundingClientRect();
      askBtn.style.left = Math.max(8, Math.min(r.left, innerWidth - 120)) + "px";
      askBtn.style.top = r.bottom + 8 + "px";
      askBtn.hidden = false;
      pick = { id: c.id, comment: c.text, quote };
    }, 0);
  });
  askBtn.addEventListener("mousedown", (e) => e.preventDefault());
  askBtn.addEventListener("click", () => { if (pick) toPanel({ type: "ask", id: pick.id, comment: pick.comment, quote: pick.quote }); window.getSelection().removeAllRanges(); hideAsk(); });

  // the extension icon opens and closes the panel, like the real one. Closed by default.
  const bhint = $("bhint");
  $("ext-btn").addEventListener("click", () => {
    const panel = $("panel");
    if (!opened) { frame.src = "/extension/sidepanel.html?demo"; opened = true; }
    panel.hidden = !panel.hidden;
    $("layout").classList.toggle("open", !panel.hidden);
    bhint.hidden = true;
    if (panel.hidden) { items = []; renderComments(); }
  });

  // when the panel reloads (Start over), clear the marks
  frame.addEventListener("load", () => { items = []; focus = 0; renderComments(); });

  renderPost();
})();
