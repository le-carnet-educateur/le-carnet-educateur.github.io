/* Choix de la palette des fiches (séance, cycle) et option « impression en gris » */
const palGris = () => {
  try {
    return localStorage.getItem("impGris") === "1";
  } catch (e) {
    return false;
  }
};
const palSelect = (cible, val) =>
  `<label class="chip" style="cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;padding-top:4px;padding-bottom:4px;margin:0" title="Couleurs de la fiche (écran, impression et Word)">🎨 Palette <select data-pal="${cible}" style="padding:0;margin:0;width:auto;min-height:0;border:0;background:transparent;font:inherit;cursor:pointer">${Object.keys(PALS)
    .map(k => `<option value="${k}"${(val || "classique") === k ? " selected" : ""}>${esc(PALS[k].n)}</option>`)
    .join("")}</select></label>`;
const palGrisChip = () =>
  `<label class="chip" style="cursor:pointer" title="À l'impression ou en PDF, la fiche passe en gris (économise l'encre) ; l'écran ne change pas"><input type="checkbox" data-pgris${palGris() ? " checked" : ""}> Impression en gris</label>`;
/* option du menu « Imprimer / PDF » (s'ouvre sous le bouton) */
const palGrisItem = () =>
  `<label class="mnu-i" title="À l'impression ou en PDF, la fiche passe en gris (économise l'encre) ; l'écran ne change pas"><input type="checkbox" data-pgris${palGris() ? " checked" : ""}> Impression en gris</label>`;
const menuImp = btn =>
  `<div class="mnu mnu-imp">${btn}<a class="mnu-t" data-mnu tabindex="0" role="button" title="Options d'impression">▾</a><div class="mnu-d">${palGrisItem()}</div></div>`;
const menuActions = (label, items) =>
  `<div class="mnu"><a class="btn" data-mnu tabindex="0" role="button" style="background:#EEF1F8;color:#26364D;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer;display:inline-block">${label} ▾</a><div class="mnu-d">${items}</div></div>`;
document.addEventListener("click", e => {
  const t = e.target.closest && e.target.closest("[data-mnu]");
  document.querySelectorAll(".mnu.open").forEach(m => {
    if (!t || !m.contains(t)) m.classList.remove("open");
  });
  if (t) t.closest(".mnu").classList.toggle("open");
});
document.addEventListener("change", e => {
  const g = e.target.closest && e.target.closest("[data-pgris]");
  if (g) {
    try {
      localStorage.setItem("impGris", g.checked ? "1" : "0");
    } catch (x) {}
    document.querySelectorAll("[data-pgris]").forEach(c => (c.checked = g.checked));
    return;
  }
  const s = e.target.closest && e.target.closest("[data-pal]");
  if (!s) return;
  if (s.dataset.pal === "cycle" && typeof CY !== "undefined" && CY) {
    CY.palette = s.value;
    cySave();
  } else if (s.dataset.pal === "seance") {
    SMETA.palette = s.value;
    palApply(s.value);
    saveMeta();
    seSave();
    buildNav();
  }
  render();
});
