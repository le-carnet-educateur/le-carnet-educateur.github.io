/* Glossaire : mots de départ (data/annexes.js, data/glossaire-prepa.js) + mots ajoutés par l'administrateur (onglet « Glossaire » du Sheet).
   Un glossaire par discipline, regroupé automatiquement par ordre alphabétique. */
let GLOSS_AJOUTS = []; /* [{ d: "escalade"|"prepa", t, def }] reçus du serveur */
let GLOSS_EDIT = null; /* terme en cours de modification (nom d'origine) */
let GLOSS_REQ = "";
/* « voir comme » : on se comporte exactement comme l'utilisateur observé, donc pas d'outils admin */
const glAdmin = () => {
  if (typeof AUTH !== "undefined" && AUTH.reel) return false;
  if (typeof compteOn === "function" && compteOn() && typeof AUTH !== "undefined" && AUTH.user) return !!AUTH.user.admin;
  return (typeof compteAdmin === "function" && compteAdmin()) || !!sessionStorage.getItem("admPw");
};
const glDisc = () => (DISC === "prepa" ? "prepa" : "escalade");
const glBase = () => (DISC === "prepa" ? AX.GLOSS_PREPA || [] : AX.GLOSS);
const glCle = t => norm(String(t).trim());
async function glossaireCharger() {
  try {
    if (!CONFIG.GAME_ADD_URL) throw 0;
    const r = await fetch(CONFIG.GAME_ADD_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "glossaire", key: CONFIG.GAME_ADD_KEY || "" }),
    });
    const j = await r.json();
    if (!j.ok) throw 0;
    GLOSS_AJOUTS = j.mots || [];
    offPut("glossaire", GLOSS_AJOUTS);
  } catch (e) {
    GLOSS_AJOUTS = (await offGet("glossaire")) || GLOSS_AJOUTS;
  }
}
registerLoader(glossaireCharger);
/* liste fusionnée : les mots ajoutés remplacent ceux de départ qui portent le même nom ; tri alphabétique (accents ignorés) */
/* un mot de départ « supprimé » est enregistré avec cette définition spéciale : il n'est plus affiché */
const GL_MASQUE = "[masqué]";
function glossListe() {
  const m = new Map();
  glBase().forEach(([t, d]) => m.set(glCle(t), { t, d, ajout: false }));
  GLOSS_AJOUTS.filter(x => x.d === glDisc()).forEach(x => (x.def === GL_MASQUE ? m.delete(glCle(x.t)) : m.set(glCle(x.t), { t: x.t, d: x.def, ajout: true })));
  const col = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true });
  return [...m.values()].sort((a, b) => col.compare(a.t, b.t));
}
const glLettre = t => {
  const c = norm(t).charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
};
function glFormHTML() {
  const e = GLOSS_EDIT && glossListe().find(x => glCle(x.t) === glCle(GLOSS_EDIT));
  return `<div class="box noprint" id="glform"><b>${e ? "Modifier le mot « " + esc(e.t) + " »" : "Ajouter un mot"}</b>
  <div style="display:grid;gap:8px;margin-top:8px">
  <label class="sml">Mot<input id="glT" value="${esc(e ? e.t : "")}" placeholder="Ex. : Pareur"></label>
  <label class="sml">Définition<textarea id="glD" rows="3" placeholder="Une ou deux phrases, simples et concrètes.">${esc(e ? e.d : "")}</textarea></label>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><a class="btn" data-gl="save" style="background:#26364D;color:#fff;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer">${e ? "Enregistrer" : "Ajouter"}</a>${e ? `<a class="chip" data-gl="cancel" style="cursor:pointer">Annuler</a>` : ""}<span style="font-size:12.5px;color:#6B7280">Glossaire ${DISC === "prepa" ? "de la préparation physique" : "de l'escalade"} · le mot est placé automatiquement par ordre alphabétique.</span></div>
  </div></div>`;
}
function glossaireView() {
  const L = glossListe(),
    adm = glAdmin();
  const lettres = [...new Set(L.map(x => glLettre(x.t)))];
  let corps = "";
  lettres.forEach(l => {
    corps += `<h3 class="gl-l" id="gl-${l === "#" ? "x" : l}">${l}</h3><dl class="gl">${L.filter(x => glLettre(x.t) === l)
      .map(
        x =>
          `<dt data-glt="${esc(glCle(x.t))}">${esc(x.t)}${adm ? ` <a class="gl-act noprint" data-gl="edit" data-t="${esc(x.t)}" title="Modifier">✎</a><a class="gl-act noprint" data-gl="del" data-t="${esc(x.t)}" title="Supprimer ce mot">✕</a>` : ""}</dt><dd>${esc(x.d)}</dd>`
      )
      .join("")}</dl>`;
  });
  return (
    `<h2 class="pt">Glossaire${DISC === "prepa" ? " de la préparation physique" : ""}</h2><p class="lead">${DISC === "prepa" ? "Les termes d'anatomie et d'entraînement utilisés dans les exercices." : "Les mots utilisés dans les fiches."} ${L.length} mots, classés par ordre alphabétique.</p>` +
    `<div class="tools noprint"><input id="glq" type="search" placeholder="Chercher un mot…" style="width:100%;max-width:320px;padding:9px 12px;border:1px solid #D5DAE5;border-radius:10px;font:inherit;background:#fff"></div>` +
    `<div class="gl-abc noprint">${lettres.map(l => `<a data-gl="go" data-l="${l === "#" ? "x" : l}">${l}</a>`).join("")}</div>` +
    (adm ? glFormHTML() : "") +
    `<div id="glcorps">${corps}</div>`
  );
}
registerClick(e => {
  const b = e.target.closest("[data-gl]");
  if (!b) return;
  const k = b.dataset.gl;
  if (k === "go") {
    const el = document.getElementById("gl-" + b.dataset.l);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (k === "edit") {
    GLOSS_EDIT = b.dataset.t;
    render();
    const f = document.getElementById("glform");
    if (f) f.scrollIntoView({ block: "center" });
  } else if (k === "cancel") {
    GLOSS_EDIT = null;
    render();
  } else if (k === "save") glossaireEnregistrer();
  else if (k === "del") glossaireSupprimer(b.dataset.t);
  return true;
});
async function glossaireEnregistrer() {
  const t = ($("#glT").value || "").trim(),
    d = ($("#glD").value || "").trim();
  if (!t) rougir($("#glT"));
  else if (!d) rougir($("#glD"));
  if (!t || !d) return toast("Le mot et sa définition sont obligatoires.");
  try {
    await admPost("admin_glossaire", { op: "enregistrer", disc: glDisc(), terme: t, def: d, avant: GLOSS_EDIT || t });
    GLOSS_AJOUTS = GLOSS_AJOUTS.filter(x => !(x.d === glDisc() && (glCle(x.t) === glCle(t) || glCle(x.t) === glCle(GLOSS_EDIT || t))));
    GLOSS_AJOUTS.push({ d: glDisc(), t, def: d });
    offPut("glossaire", GLOSS_AJOUTS);
    GLOSS_EDIT = null;
    toast("✓ « " + t + " » enregistré.");
    render();
  } catch (err) {
    toast("Échec : " + err.message);
  }
}
async function glossaireSupprimer(t) {
  if (!confirm("Supprimer le mot « " + t + " » du glossaire ?")) return;
  try {
    const depart = glBase().some(([bt]) => glCle(bt) === glCle(t));
    if (depart) {
      /* mot de départ : on le masque (écrase aussi une éventuelle version modifiée) */
      await admPost("admin_glossaire", { op: "enregistrer", disc: glDisc(), terme: t, def: GL_MASQUE, avant: t });
      GLOSS_AJOUTS = GLOSS_AJOUTS.filter(x => !(x.d === glDisc() && glCle(x.t) === glCle(t)));
      GLOSS_AJOUTS.push({ d: glDisc(), t, def: GL_MASQUE });
    } else {
      await admPost("admin_glossaire", { op: "supprimer", disc: glDisc(), terme: t });
      GLOSS_AJOUTS = GLOSS_AJOUTS.filter(x => !(x.d === glDisc() && glCle(x.t) === glCle(t)));
    }
    offPut("glossaire", GLOSS_AJOUTS);
    render();
  } catch (err) {
    toast("Échec : " + err.message);
  }
}
document.addEventListener("input", e => {
  if (!e.target || e.target.id !== "glq") return;
  const q = glCle(e.target.value);
  document.querySelectorAll("#glcorps dt").forEach(dt => {
    const dd = dt.nextElementSibling,
      ok = !q || dt.dataset.glt.includes(q) || glCle(dd.textContent).includes(q);
    dt.style.display = dd.style.display = ok ? "" : "none";
  });
  document.querySelectorAll("#glcorps .gl-l").forEach(h => {
    const dl = h.nextElementSibling;
    h.style.display = dl.querySelector("dt:not([style*='none'])") ? "" : "none";
  });
});
