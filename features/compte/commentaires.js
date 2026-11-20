/* Commentaires sur les séances et cycles partagés : lisibles par toute personne qui a accès à la séance ;
   supprimables par leur auteur, par le propriétaire de la séance et par l'administrateur. */
const CMT = {}; /* id de séance -> { liste, err, draft, busy, lance } */
const cmtEtat = id => CMT[id] || (CMT[id] = { liste: null, err: "", draft: "", busy: false, lance: false });
async function cmtCharger(id) {
  const c = cmtEtat(id);
  try {
    c.liste = (await comptePost("seance_commentaires", { id })).commentaires || [];
    c.err = "";
  } catch (e) {
    c.liste = c.liste || [];
    c.err = /action inconnue/.test(e.message) ? "Commentaires indisponibles : le serveur n'est pas à jour." : "Chargement impossible : " + e.message;
  }
  if (typeof VIEW !== "undefined") render();
}
function commentairesBloc(r) {
  if (!compteOn() || !r || !AUTH.user || typeof AUTH.user !== "object") return "";
  /* seulement sur ce qui est partagé (ou partagé avec moi) */
  if (!(partageListe(r).length || !compteMien(r))) return "";
  const c = cmtEtat(r.id);
  if (!c.lance) {
    c.lance = true;
    cmtCharger(r.id);
  }
  const L = c.liste || [];
  const quand = t => {
    const d = new Date(t);
    return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };
  const items = L.map(
    x =>
      `<div style="border-top:1px solid #E3E8F2;padding:8px 0"><div style="display:flex;gap:8px;align-items:baseline"><b style="font-size:14px">${esc(x.nom)}</b><span style="color:#8A93A3;font-size:12px;flex:1">${esc(quand(x.date))}</span>${x.suppr ? `<a data-cmt="del" data-id="${esc(r.id)}" data-c="${esc(x.cid)}" title="Supprimer ce commentaire" style="cursor:pointer;color:#B2263A;font-weight:700">✕</a>` : ""}</div><div style="white-space:pre-wrap;font-size:14px;margin-top:2px">${esc(x.texte)}</div></div>`
  ).join("");
  return `<div class="box noprint" style="padding:10px 14px"><b>💬 Commentaires${c.liste ? " (" + L.length + ")" : ""}</b>${c.liste === null ? '<p style="color:#6B7280;margin:6px 0">Chargement…</p>' : ""}${items}
  ${c.err ? `<p style="color:#B2263A;margin:6px 0">${esc(c.err)}</p>` : ""}
  <div style="margin-top:8px"><textarea data-cmtt="${esc(r.id)}" rows="2" maxlength="1000" placeholder="Écris un commentaire (visible par les personnes qui ont accès à cette séance)…" style="width:100%;box-sizing:border-box">${esc(c.draft)}</textarea><div style="margin-top:4px"><a class="btn" data-cmt="add" data-id="${esc(r.id)}" style="background:#26364D;color:#fff;border-radius:8px;padding:6px 14px;font-weight:700;cursor:pointer;display:inline-block;${c.busy ? "opacity:.5" : ""}">${c.busy ? "Envoi…" : "Publier"}</a></div></div></div>`;
}
document.addEventListener("input", e => {
  const t = e.target.closest && e.target.closest("[data-cmtt]");
  if (t) cmtEtat(t.dataset.cmtt).draft = t.value;
});
registerClick(e => {
  const b = e.target.closest("[data-cmt]");
  if (!b) return false;
  const id = b.dataset.id,
    c = cmtEtat(id);
  if (b.dataset.cmt === "add") {
    const ta = document.querySelector(`[data-cmtt="${id}"]`);
    const texte = (ta ? ta.value : c.draft).trim();
    if (c.busy) return true;
    if (!texte) {
      if (typeof rougir === "function") rougir(ta);
      return true;
    }
    c.busy = true;
    c.draft = texte;
    render();
    comptePost("seance_commentaire", { id, texte })
      .then(() => {
        c.draft = "";
        c.busy = false;
        return cmtCharger(id);
      })
      .catch(err => {
        c.busy = false;
        c.err = "Envoi impossible : " + err.message;
        render();
      });
  } else if (b.dataset.cmt === "del") {
    if (!confirm("Supprimer ce commentaire ?")) return true;
    comptePost("seance_commentaire_suppr", { id, cid: b.dataset.c })
      .then(() => cmtCharger(id))
      .catch(err => toast("Échec : " + err.message));
  }
  return true;
});
