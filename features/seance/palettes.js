/* Choix de la palette des fiches (séance, cycle) et option « impression en gris » */
const palGris = () => {
  try {
    return localStorage.getItem("impGris") === "1";
  } catch (e) {
    return false;
  }
};
const palSelect = (cible, val) =>
  `<label class="chip" style="cursor:pointer" title="Couleurs de la fiche (écran, impression et Word)">🎨 Palette <select data-pal="${cible}" style="border:0;background:transparent;font:inherit;cursor:pointer">${Object.keys(PALS)
    .map(k => `<option value="${k}"${(val || "classique") === k ? " selected" : ""}>${esc(PALS[k].n)}</option>`)
    .join("")}</select></label>`;
const palGrisChip = () =>
  `<label class="chip" style="cursor:pointer" title="À l'impression ou en PDF, la fiche passe en gris (économise l'encre) ; l'écran ne change pas"><input type="checkbox" data-pgris${palGris() ? " checked" : ""}> Impression en gris</label>`;
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
