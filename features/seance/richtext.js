/* Mise en forme du texte : **gras**, *italique*, __souligné__
   Raccourcis Ctrl+B / Ctrl+I / Ctrl+U + mini-barre flottante sur sélection (séances et cycles). */
(function () {
  const OK = el =>
    el &&
    (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && (el.type === "text" || !el.type))) &&
    el.closest("#app, main, body") &&
    !el.closest(".noRt") &&
    el.dataset &&
    Object.keys(el.dataset).some(k => /^(sm|si|cy|cp|rt)/.test(k));
  const MK = { b: "**", i: "*", u: "__" };
  function wrap(el, k) {
    const m = MK[k],
      a = el.selectionStart,
      z = el.selectionEnd;
    if (a == null || a === z) return;
    const v = el.value,
      sel = v.slice(a, z);
    let nv, na, nz;
    if (sel.startsWith(m) && sel.endsWith(m) && sel.length >= 2 * m.length) {
      nv = v.slice(0, a) + sel.slice(m.length, -m.length) + v.slice(z);
      na = a;
      nz = z - 2 * m.length;
    } else {
      nv = v.slice(0, a) + m + sel + m + v.slice(z);
      na = a;
      nz = z + 2 * m.length;
    }
    el.value = nv;
    el.setSelectionRange(na, nz);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  let bar = null, cur = null;
  function hide() {
    if (bar) bar.style.display = "none";
  }
  function show(el) {
    if (!OK(el) || el.selectionStart === el.selectionEnd) return hide();
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "rtbar";
      bar.className = "noprint";
      bar.style.cssText =
        "position:fixed;z-index:9999;display:none;background:#1F2A44;border-radius:6px;padding:3px;gap:2px;box-shadow:0 2px 8px #0004";
      bar.innerHTML = ["b", "i", "u"]
        .map(
          k =>
            `<button type="button" data-rt="${k}" title="${{ b: "Gras (Ctrl+B)", i: "Italique (Ctrl+I)", u: "Souligné (Ctrl+U)" }[k]}" style="border:0;background:none;color:#fff;width:26px;height:24px;cursor:pointer;font:15px Georgia,serif;${k === "b" ? "font-weight:700" : k === "i" ? "font-style:italic" : "text-decoration:underline"}">${k.toUpperCase()}</button>`
        )
        .join("");
      bar.addEventListener("mousedown", e => e.preventDefault());
      bar.addEventListener("click", e => {
        const b = e.target.closest("[data-rt]");
        if (b && cur) wrap(cur, b.dataset.rt);
      });
      document.body.appendChild(bar);
    }
    cur = el;
    const r = el.getBoundingClientRect();
    bar.style.display = "flex";
    bar.style.left = Math.max(4, r.left) + "px";
    bar.style.top = Math.max(4, r.top - 34) + "px";
  }
  document.addEventListener("keydown", e => {
    const k = e.key && e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && !e.altKey && MK[k] && OK(e.target)) {
      e.preventDefault();
      wrap(e.target, k);
    }
  });
  const chk = e => setTimeout(() => (OK(document.activeElement) ? show(document.activeElement) : hide()), 0);
  document.addEventListener("mouseup", chk);
  document.addEventListener("keyup", chk);
  document.addEventListener("scroll", hide, true);
})();
