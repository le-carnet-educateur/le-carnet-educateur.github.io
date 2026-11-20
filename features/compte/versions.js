/* Historique des versions d'une séance ou d'un cycle (5 dernières, avant chaque enregistrement) : bouton discret « 🕘 Versions »,
   réservé au propriétaire. Restaurer remplace le contenu actuel (qui reste lui-même dans l'historique). */
const versionsChip = id =>
  compteOn() && AUTH.user ? `<a class="chip" data-ver="open" data-id="${esc(id)}" style="cursor:pointer;color:#6B7280" title="Retrouver une version précédente">🕘 Versions</a>` : "";
const verQuand = t => {
  const d = new Date(t);
  return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};
async function versionsOuvrir(id) {
  modal("Versions précédentes", '<p style="color:#6B7280">Chargement…</p>', 520);
  let h;
  try {
    const V = (await comptePost("seance_versions", { id })).versions || [];
    h = V.length
      ? `<p style="color:#6B7280;margin-top:0">Les 5 dernières versions, conservées automatiquement quand tu enregistres. Restaurer remplace le contenu actuel, qui reste lui-même disponible ici.</p>` +
        V.map(
          v =>
            `<div style="display:flex;gap:10px;align-items:center;border-top:1px solid #E3E8F2;padding:8px 0"><div style="flex:1"><b>${esc(verQuand(v.date))}</b><div style="color:#6B7280;font-size:13px">${esc(v.titre || "(sans titre)")}${v.nb ? " · " + esc(v.nb) + " élément" + (+v.nb > 1 ? "s" : "") : ""}</div></div><a class="chip" data-ver="rest" data-id="${esc(id)}" data-v="${esc(v.vid)}" data-q="${esc(verQuand(v.date))}" style="cursor:pointer">↩ Restaurer</a></div>`
        ).join("")
      : '<p style="color:#6B7280">Aucune version précédente pour l\'instant : elles apparaissent à partir du deuxième enregistrement.</p>';
  } catch (e) {
    h = `<p style="color:#B2263A">${esc(/action inconnue/.test(e.message) ? "L'historique n'est pas disponible : le serveur n'est pas à jour." : "Échec : " + e.message)}</p>`;
  }
  modal("Versions précédentes", h, 520);
}
registerClick(e => {
  const b = e.target.closest("[data-ver]");
  if (!b) return false;
  const id = b.dataset.id;
  if (b.dataset.ver === "open") versionsOuvrir(id);
  else if (b.dataset.ver === "rest") {
    if (!confirm("Restaurer la version du " + b.dataset.q + " ?\n\nLe contenu actuel sera remplacé (il reste disponible dans l'historique).")) return true;
    b.textContent = "Restauration…";
    comptePost("seance_restaurer", { id, vid: b.dataset.v })
      .then(async j => {
        SB_DATA[id] = j.data;
        try {
          offPut("seance:" + id + compteSuffixe(), j.data);
        } catch (x) {}
        await loadSeances();
        SB_DATA[id] = j.data;
        modalFermer("mpop", true);
        render();
        toast("✓ Version restaurée.");
      })
      .catch(err => {
        b.textContent = "↩ Restaurer";
        toast("Échec : " + err.message);
      });
  }
  return true;
});
