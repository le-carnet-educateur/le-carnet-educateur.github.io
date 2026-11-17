/* Séance type : UNE séance de référence (choisie par l'administrateur), consultable par tous en lecture seule,
   en fiche simplifiée ou complète. Stockée dans l'onglet « Séance type » du Sheet. */
let STYPE = null; /* { titre, d: { meta, se } } */
let STYPE_MODELE = "std";
async function seanceTypeCharger() {
  try {
    if (!CONFIG.GAME_ADD_URL) throw 0;
    const r = await fetch(CONFIG.GAME_ADD_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "fichetype", key: CONFIG.GAME_ADD_KEY || "" }),
    });
    const j = await r.json();
    if (!j.ok) throw 0;
    STYPE = j.data ? { titre: j.titre, data: j.data } : null;
    offPut("fichetype", STYPE);
  } catch (e) {
    STYPE = (await offGet("fichetype")) || STYPE;
  }
}
registerLoader(seanceTypeCharger);
function seanceTypeDonnees() {
  try {
    const d = JSON.parse(STYPE.data);
    return d && d.meta && d.se ? d : null;
  } catch (e) {
    return null;
  }
}
function seanceTypeView() {
  const adm = glAdmin();
  const intro = `<h2 class="pt">Séance type</h2>`;
  const d = STYPE && seanceTypeDonnees();
  if (!d)
    return (
      intro +
      `<div class="box">Aucune séance type n'est encore définie.${adm ? `<br><br><b>Pour en définir une</b> : ouvre ta séance (menu « Séances et cycles »), puis clique sur « ⭐ Définir comme séance type ».` : ""}</div>`
    );
  const meta = { ...d.meta, modele: STYPE_MODELE };
  const bt = (m, l) =>
    `<button role="tab" aria-selected="${STYPE_MODELE === m}" data-stm="${m}" class="${STYPE_MODELE === m ? "on" : ""}">${l}</button>`;
  SBCUR = { meta, se: d.se };
  SBID = null;
  const sheet = withSeance(meta, d.se, () => sheetHTML());
  return `${intro}<p class="lead">Une séance complète, prête à s'inspirer : <b>${esc(STYPE.titre || d.meta.titre || "")}</b>. Lecture seule : tu peux la copier dans tes séances pour l'adapter.</p>
  <div class="tools noprint"><div class="seg" role="tablist">${bt("std", "Fiche simplifiée")}${bt("creps", "Fiche complète")}</div>
  <a class="btn" data-sb="copy" style="background:#2E7D4F;color:#fff;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer">⧉ Copier dans mes séances</a>
  <a class="chip" data-sb="word" style="cursor:pointer">Word</a><a class="chip" data-sb="print" style="cursor:pointer">Imprimer</a>
  ${adm ? `<a class="chip" data-stm="retirer" style="cursor:pointer;color:#B3261E">Retirer la séance type</a>` : ""}</div>
  <div id="sheet" style="border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.12)">${sheet}</div>`;
}
registerClick(e => {
  const b = e.target.closest("[data-stm]");
  if (!b) return;
  if (b.dataset.stm === "retirer") {
    if (confirm("Retirer la séance type ? La page redeviendra vide."))
      admPost("admin_fichetype", { op: "retirer" })
        .then(() => {
          STYPE = null;
          offPut("fichetype", null);
          render();
        })
        .catch(err => toast("Échec : " + err.message));
  } else {
    STYPE_MODELE = b.dataset.stm;
    render();
  }
  return true;
});
/* bouton de l'administrateur, sur la fiche d'une séance enregistrée */
async function seanceTypeDefinir(meta, se) {
  const data = JSON.stringify({ meta, se });
  if (!confirm("Définir « " + (meta.titre || "cette séance") + " » comme séance type du site (visible par tous, en lecture seule) ?")) return;
  try {
    await admPost("admin_fichetype", { op: "definir", titre: meta.titre || "", data });
    STYPE = { titre: meta.titre || "", data };
    offPut("fichetype", STYPE);
    toast("✓ Séance type enregistrée. Elle apparaît dans Guides › Organiser ses séances › Séance type.");
  } catch (err) {
    toast("Échec : " + err.message);
  }
}
