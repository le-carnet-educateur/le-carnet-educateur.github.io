const SE_ONGLETS = [["info", "📋 Informations"], ["ech", "🔥 Échauffement"], ["corps", "🧗 Corps de séance"], ["bas", "🏁 Bas de fiche"], ["ctl", "✓ Contrôle et bilan"], ["apercu", "👁 Aperçu"]];
let SETAB = "info";
function seTabAppliquer() {
  document.querySelectorAll("[data-stab]").forEach(e => (e.style.display = e.dataset.stab.split(" ").includes(SETAB) ? "" : "none"));
  document.querySelectorAll("[data-stabgo]").forEach(b => b.classList.toggle("on", b.dataset.stabgo === SETAB));
}
function seTab(k) {
  SETAB = k;
  seTabAppliquer();
}
registerClick(e => {
  const b = e.target.closest("[data-stabgo]");
  if (!b) return;
  seTab(b.dataset.stabgo);
  return true;
});
/* Ma séance — formulaire de construction de la séance */
/* ---------- exercices repliables ----------
   SEOPEN : cartes dépliées (« i12 » = exercice 12, « m12 » = ses détails). Les exercices présents à l'ouverture d'une
   séance sont repliés ; un exercice ajouté pendant la session s'ouvre tout seul. */
let SEOPEN = new Set(),
  SESEEN = null;
document.addEventListener(
  "toggle",
  e => {
    const d = e.target;
    if (!d || !d.dataset || !d.dataset.sd) return;
    d.open ? SEOPEN.add(d.dataset.sd) : SEOPEN.delete(d.dataset.sd);
  },
  true
);
/* frise du déroulé (fine, hors des blocs) : un bloc par étape, largeur proportionnelle à la durée ; le survol donne le texte complet */
function seFriseHTML(M) {
  const mx = (d, idx) => Math.max(0, ...idx.map(i => +d[i] || 0));
  const tag = (d, idx) => idx.map(i => `<i style="background:${M.G[i].c}">${+d[i] || 0}'</i>`).join("");
  const tip = (t, d, idx) => t + " — " + idx.map(i => (M.two ? M.G[i].nom + " : " : "") + (+d[i] || 0) + " min").join(" · ");
  const B = [{ t: "Accueil", d: M.G.map(g => g.acc), idx: M.all, c: "#8A6D12", bg: "#FDF3D3" }];
  if (M.ech.on)
    M.echSubs.forEach((s, k) => B.push({ t: echLabel(s, k) || "Échauffement", d: s.d, idx: s.idx, c: uniteCol(s).fg, bg: uniteCol(s).bg, id: s.id, tab: "ech" }));
  M.subs.forEach((s, k) => B.push({ t: s.num + ". " + unitLabel(s, k), d: s.d, idx: s.idx, c: uniteCol(s).fg, bg: uniteCol(s).bg, id: s.id, tab: "corps" }));
  B.push({ t: "Retour au calme", d: M.G.map(() => RC_MIN), idx: M.all, c: "#7A4FA0", bg: "#EEE6F6" });
  const tot = M.G.map(g => `<b style="color:${g.c}">${M.tot[g.i]} min</b>`).join(" · ");
  return `<div class="frise noprint" data-stab="ech corps"><div class="frise-bar">${B.map(b => {
    const m = mx(b.d, b.idx);
    const go = b.id ? ` data-sa="sgo" data-sub="${b.id}" data-tab="${b.tab}" role="button" tabindex="0"` : "";
    return `<div class="fr-b${b.id ? " go" : ""}" title="${esc(tip(b.t, b.d, b.idx))}" style="flex:${Math.max(m, 4)} 1 108px;background:${b.bg};color:${b.c}"${go}><span class="fr-t">${esc(b.t)}</span><span class="fr-m">${tag(b.d, b.idx)}</span></div>`;
  }).join("")}</div><div class="frise-pied">Durée totale : ${tot}</div></div>`;
}
const seDeplierBtns = () => `<span class="frise-act noprint"><a class="chip" data-sa="sdeplier">Tout déplier</a> <a class="chip" data-sa="srepli">Tout replier</a></span>`;
/* ---------- éditeur ---------- */
function seanceView() {
  seDefaults();
  const M = seModel(),
    S = SMETA,
    two = M.two;
  {
    const ids = seToutesSubs().flatMap(x => x.items.map(i => i.id));
    if (!SESEEN || SESEEN.se !== SE) {
      SESEEN = new Set(ids);
      SESEEN.se = SE;
      SEOPEN = new Set();
    } else
      ids.forEach(id => {
        if (!SESEEN.has(id)) {
          SESEEN.add(id);
          SEOPEN.add("i" + id);
        }
      });
  }
  const gl = i => esc(M.G[i].nom);
  const head = SEPOP
    ? ""
    : `<h2 class="pt">Créer une séance ${aide("<b>Comment faire ?</b><br>1. Remplissez les informations générales (titre, date, thème…).<br>2. Ajoutez des exercices : un jeu du site (bouton « Ajouter à ma séance » sur sa fiche) ou un exercice libre.<br>3. Enregistrez dans la bibliothèque, ou exportez en Word, PDF ou texte.<br>Votre brouillon reste dans ce navigateur.")}</h2><p class="lead">Construisez votre séance comme dans votre modèle : accueil, échauffement, puis un corps de séance fait d'exercices seuls et de blocs (un bloc regroupe plusieurs petits exercices), pour tous les groupes ou seulement certains (deux groupes par défaut, quatre au maximum). Les exercices viennent de la bibliothèque de jeux ou s'écrivent librement. Tout est enregistré dans ce navigateur ; exportez en Word, en PDF ou en texte.</p>`;
  const inp = (k, l, p, span) =>
    `<label class="sml" style="${span ? "grid-column:1/-1" : ""}">${l}<input data-sm="${k}" value="${esc(S[k])}" placeholder="${esc(p)}"></label>`;
  const colf = (cls, c) => `border-left:4px solid ${c};padding-left:8px`;
  const num = (attr, l, val, c) =>
    `<label class="sml" style="${colf(0, c)}">${l}<input type="number" min="0" max="180" ${attr} value="${val}"></label>`;
  const txa = (k, l, p) =>
    `<label class="sml">${l}<textarea rows="2" data-sm="${k}" placeholder="${esc(p)}">${esc(S[k])}</textarea></label>`;
  const cl = (std, creps) => (isCreps() ? creps : std);
  const E = SE.ech;
  const CL = isCreps() ? crepsLignes(M) : [];
  const subHTML = (s, k, ech) => {
    const sv = (ech ? M.echSubs : M.subs)[k];
    const gcell = g => {
      const on = sv.idx.includes(g.i);
      return `<div class="gd${on ? "" : " off"}" style="--gc:${g.c}"><label class="gdn">${two ? `<input type="checkbox" data-gs="1" data-sub="${s.id}" data-gi="${g.i}" ${on ? "checked" : ""}>` : ""}<span>${esc(two ? g.nom : "Durée")}</span></label><span class="gdv"><input type="number" min="0" max="180" data-gd="sub" data-n="1" data-sub="${s.id}" data-gi="${g.i}" value="${s.d[g.i]}" ${on ? "" : "disabled"} title="Durée (min)${two ? " — " + esc(g.nom) : ""}"><small>min</small></span></div>`;
    };
    const dursHTML = `<div class="gdrow">${two ? '<span class="gdl">Pour</span>' : ""}${M.G.map(gcell).join("")}</div>`;
    const chips = `<span class="sitdur">${sv.idx.map(i => `<i class="gtag" style="background:${M.G[i].c}">${two ? esc(M.G[i].nom) + " " : ""}${+s.d[i] || 0}'</i>`).join("")}</span>`;
    const solo = !!s.solo && sv.items.length === 1;
    const sbtn = `<span class="noprint" style="white-space:nowrap"><button class="chip" data-sa="sup" data-sub="${s.id}" title="Monter">↑</button> <button class="chip" data-sa="sdn" data-sub="${s.id}" title="Descendre">↓</button> <button class="chip" data-sa="srm" data-sub="${s.id}" title="Supprimer l'exercice">✕</button></span>`;
    const items = sv.items
      .map((it, j) => {
        const v = itemView(it);
        if (!v) return "";
        const mv = `<span class="noprint" style="white-space:nowrap"><button class="chip" data-sa="iup" data-id="${it.id}">↑</button> <button class="chip" data-sa="idn" data-id="${it.id}">↓</button> <button class="chip" data-sa="irm" data-id="${it.id}">✕</button></span>`;
        const vw = sv.views.find(x => x.it.id === it.id);
        const dosf = (it2, g) =>
          DISC === "prepa" || (g && g["Dosage"])
            ? `<label class="sml" style="margin-top:8px">Séries × répétitions ou durée <input data-si="dos" data-id="${it2.id}" value="${esc(it2.dos || "")}" placeholder="${esc((g && g["Dosage"]) || "Ex. 3 × 12, repos 45 s")}"></label>`
            : "";
        const consf = it2 => {
          const g = DATA.find(x => key(x) === it2.k);
          if (!g) return "";
          const mod = typeof it2.txt === "string",
            P = principeParties(g);
          const parts = "";
          return `<div class="sml" style="margin-top:8px"><b>${cl("Consigne / règle du jeu", "Consignes et règles du jeu")}</b> ${aide("Le texte est propre à cette séance : le jeu de la bibliothèque n'est pas modifié.")}</div>${parts}<textarea rows="4" data-si="txt" data-id="${it2.id}" style="width:100%">${esc(itemDesc(it2, g))}</textarea>${mod ? `<div style="margin-top:2px"><a class="chip" data-sa="txtreset" data-id="${it2.id}" style="cursor:pointer">↺ Revenir au texte du jeu</a></div>` : ""}`;
        };
        const matf = it2 => {
          const g = DATA.find(x => key(x) === it2.k);
          if (!g) return "";
          return `<label class="sml" style="margin-top:8px"><b>Matériel</b> ${aide("Rempli avec le matériel du jeu. Modifiable, pour cette séance seulement.")}<input data-si="mat" data-id="${it2.id}" value="${esc(typeof it2.mat === "string" ? it2.mat : g["Matériel"] || "")}" placeholder="Ex. 6 tapis, 10 plots"></label>`;
        };
        const varf = it2 => {
          const v2 = itemView(it2);
          if (!v2) return "";
          return `<label class="sml" style="margin-top:8px"><b>+ Variantes plus difficiles</b> ${aide("Une variante par ligne. Toujours dans la fiche.")}<textarea rows="3" data-si="vp" data-id="${it2.id}">${esc(v2.plus || "")}</textarea></label><label class="sml" style="margin-top:6px"><b>– Variantes plus faciles</b> ${aide("Une variante par ligne. Toujours dans la fiche.")}<textarea rows="3" data-si="vm" data-id="${it2.id}">${esc(v2.moins || "")}</textarea></label>`;
        };
        const nmf = `<label class="sml">${cl("Nom dans la fiche", "Situation : nom dans la fiche")}<input data-si="nom" data-id="${it.id}" value="${esc(it.nom || "")}" placeholder="${esc(vw ? vw.def : v.titre)}"></label>`;
        const schf = v.img || v.imgJeu ? `<label class="fl noprint" style="margin:8px 0 0;display:block"><input type="checkbox" data-isch="1" data-id="${it.id}" ${v.schOn ? "checked" : ""}> 🖼 Afficher le schéma dans la fiche</label>` : "";
        const open = SEOPEN.has("i" + it.id),
          openM = SEOPEN.has("m" + it.id);
        const ico = (v.img || v.imgJeu) && v.schOn ? '<span class="sitico" title="Schéma affiché dans la fiche">🖼</span>' : "";
        const wrap = (style, sumInner, essential, more) =>
          `<details class="sit${it.t === "lib" ? "" : " free"}${solo ? " solo" : ""}" ${solo ? `id="ssub-${s.id}" ` : ""}style="${style}" data-sd="i${it.id}"${open ? " open" : ""}><summary class="sitsum">${solo ? `<span class="ghandle in noprint" data-udrag="${s.id}" title="Glisser pour déplacer (↑ ↓ à droite aussi)">⠿</span>` : sv.items.length > 1 ? `<span class="ghandle in noprint" data-idrag="${it.id}" title="Glisser pour déplacer cet exercice dans le bloc">⠿</span>` : ""}<span class="sitcar">▸</span>${solo && sv.num ? `<b class="sitnum">${sv.num}</b>` : ""}${sumInner}<span class="sitgap"></span>${solo ? chips : ""}<span class="sitact">${solo ? sbtn : mv}</span></summary><div class="sitbody">${solo ? dursHTML : ""}${essential}<details class="sitmore" data-sd="m${it.id}"${openM ? " open" : ""}><summary>Matériel, variantes, critères…</summary><div class="sitmorebody">${more}${solo ? `<div style="margin-top:8px"><a class="mini mini-bloc" data-sa="tobloc" data-sub="${s.id}" data-tip="Remet l'exercice dans un bloc, pour pouvoir y ajouter d'autres exercices.">→ Bloc</a></div>` : ""}</div></details></div></details>`;
        if (it.t === "lib") {
          const mod = ["txt", "mat", "nom", "vp", "vm", "crit", "dos"].some(k => typeof it[k] === "string" && it[k].trim() !== "");
          return wrap(
            solo ? "" : `border-left:4px solid ${famOf(v.fam).d}`,
            `<a class="sitlink" data-jv="${esc(it.k)}" data-tip="Voir la fiche du jeu"><b class="sitcode" style="color:${famOf(v.fam).d}">${esc(v.code || "★")}</b><span class="sitname">${esc(vw ? vw.name : v.titre)}</span></a>${mod ? '<span class="sitbadge">modifié</span>' : ""}${ico}`,
            nmf + consf(it),
            matf(it) + dosf(it, DATA.find(x => key(x) === it.k)) + (ech ? "" : varf(it) + `<label class="sml" style="margin-top:8px">Critères de réussite (un par ligne)<textarea rows="2" data-si="crit" data-id="${it.id}" placeholder="Ex. Le pied est posé sans bruit">${esc(critEff(it))}</textarea></label>`) + schf + crepsItemHTML(it, CL)
          );
        }
        const f = (k2, l, p, rows) =>
          `<label class="sml" style="${rows ? "grid-column:1/-1" : ""}">${l}${rows ? `<textarea rows="${rows}" data-si="${k2}" data-id="${it.id}" placeholder="${esc(p)}">${esc(it[k2] || "")}</textarea>` : `<input data-si="${k2}" data-id="${it.id}" value="${esc(it[k2] || "")}" placeholder="${esc(p)}">`}</label>`;
        return wrap(
          "",
          `<b class="sitcode" style="color:#B7791F">✎</b><span class="sitname">${esc(it.titre || "Exercice libre")}</span><span class="sitbadge free">libre</span>`,
          `<div class="smg">${f("titre", cl("Nom de l'exercice", "Situation (nom)"), "Ex. Le pied muet")}${nmf}${f("desc", cl("Consigne / déroulé", "Consignes et règles du jeu"), "Qui joue, ce qu'on fait, comment on gagne…", 3)}</div>`,
          `<div class="smg">${f("part", "Participants", "Ex. binômes")}${f("mat", "Matériel", "Aucun")}${DISC === "prepa" ? f("dos", "Séries × répétitions", "Ex. 3 × 12, repos 45 s") : ""}${ech ? "" : f("plus", cl("Plus difficile (+) — un par ligne", "Variantes : plus difficile si réussite (une par ligne)"), "• …", 2) + f("moins", cl("Plus facile (–) — un par ligne", "Variantes : plus facile si échec (une par ligne)"), "• …", 2) + f("crit", "Critères de réussite — un par ligne", "Ex. Le pied est posé sans bruit", 2)}</div>${schf}<div style="margin-top:6px"><a class="chip" data-sa="tolib" data-id="${it.id}" style="cursor:pointer">＋ Ajouter cet exercice à la bibliothèque</a></div>${crepsItemHTML(it, CL)}`
        );
      })
      .join("");
    const bs = "padding:3px 10px;font-size:12px;font-weight:700;cursor:pointer;";
    if (solo) return items;
    return `<div class="ssub bloc" id="ssub-${s.id}"><div class="bhead"><span class="ghandle in noprint" data-udrag="${s.id}" title="Glisser pour déplacer le bloc (↑ ↓ aussi)">⠿</span><span>Bloc${ech ? "" : " " + sv.num}</span>${sv.items.length === 1 ? ` <a class="mini mini-solo" data-sa="tosolo" data-sub="${s.id}" data-tip="Supprime le bloc mais garde l'exercice : il devient un exercice seul, sur sa propre ligne.">→ Exercice seul</a>` : ""}<span class="sitgap"></span>${chips}</div><div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap"><label class="sml" style="flex:1;min-width:220px">Titre du bloc<input data-ss="titre" data-sub="${s.id}" value="${esc(s.titre)}" placeholder="${ech ? "Ex. Jeux de déplacement (ou le nom du jeu)" : "Ex. Poser les pieds"}"></label><span class="noprint" style="white-space:nowrap;padding-bottom:6px"><button class="chip" style="${bs}background:#DCE6F5;border-color:#9DB4D8;color:#26364D" title="Monter" data-sa="sup" data-sub="${s.id}">↑</button> <button class="chip" style="${bs}background:#DCE6F5;border-color:#9DB4D8;color:#26364D" title="Descendre" data-sa="sdn" data-sub="${s.id}">↓</button> <button class="chip" style="${bs}background:#FBE3E6;border-color:#E8A9B2;color:#B2263A" data-sa="srm" data-sub="${s.id}">✕ Supprimer le bloc</button></span></div>${dursHTML}
     ${items || `<p class="hint" style="margin:8px 0">${ech ? "Ajoute un jeu de la bibliothèque et/ou un exercice libre : le déroulé reste vide tant que tu n'en ajoutes pas." : "Aucun exercice dans ce bloc."}</p>`}
     <div class="sadd"><button class="chip" data-sa="rxopen" data-sub="${s.id}" style="background:#26364D;color:#fff;border-color:#26364D">${ech ? "🔍 Chercher un jeu de la bibliothèque" : "🔍 Chercher un exercice de la bibliothèque"}</button><button class="chip" data-sa="addfree" data-sub="${s.id}">＋ Exercice libre</button></div></div>`;
  };
  const dl = "";
  const bar = `<div class="tools noprint sbar" style="margin-bottom:14px">${SEPOP ? "" : '<a class="chip" id="sClear" style="cursor:pointer;color:#B2263A;border-color:#E8B4BC">🗑 Effacer le contenu de la page</a>'}<label class="chip" style="cursor:pointer">🖼 ${S.logo ? "Changer le logo" : "Ajouter le logo de la salle"}<input type="file" id="sLogo" accept="image/*" hidden></label>${S.logo ? `<img src="${esc(S.logo)}" alt="Logo" style="height:30px;border-radius:4px;border:1px solid #D5DAE5"><a class="chip" id="sLogoOff" style="cursor:pointer">Retirer le logo</a>` : ""}${palSelect("seance", S.palette)}${palGrisChip()}<span class="grow" style="flex:1"></span><a class="chip" id="sCopy" style="cursor:pointer" title="Copie un résumé de la séance en texte, à coller dans un message">⧉ Copier le texte</a><span id="sMsg" style="color:#2E7D4F;font-weight:700"></span><a class="chip" id="sSave" style="cursor:pointer;background:#26364D;color:#fff;border-color:#26364D">☁ Enregistrer</a><div class="stabs noprint">${SE_ONGLETS.map(([k, t]) => `<button class="stab-b${(typeof SETAB === "undefined" ? "info" : SETAB) === k ? " on" : ""}" data-stabgo="${k}">${t}</button>`).join("")}</div><div id="sCtl" class="noprint" style="flex-basis:100%;font-size:12.5px;line-height:1.2;white-space:nowrap;overflow-x:auto"></div><div id="sSaved" class="noprint" style="flex-basis:100%;text-align:left;color:#2E7D4F;font-weight:700;font-size:13px;line-height:1.1;display:none"></div></div>${SE.id ? `<p class="hint noprint" style="margin:-6px 0 12px">✎ Vous modifiez une séance de la bibliothèque : « Mettre à jour » remplace la version enregistrée.</p>` : ""}`;
  return (
    head +
    bar +
    seFriseHTML(M) +
    `<div class="box noprint" data-stab="info" style="border-left:6px solid #8A55B5;background:#F3EEFA"><b>Informations de la séance</b>${crepsChoixHTML()}
   <div class="smg">${inp("titre", "Cycle et séance", "Ex. Cycle 1 — Séance 4")}${inp("periode", "Période", "Ex. octobre")}${inp("theme", "Thème", "Ex. Pose de pieds & transfert de poids")}${inp("educ", "Éducateurs", "Prénoms")}${inp("objectif", "Objectif général", "Ce que la séance doit permettre d'apprendre", 1)}${inp("dates", "Dates", "Ex. 7 & 10 octobre")}</div>
   <p class="noprint" style="font-size:12px;color:#6B7280;margin:6px 0 0">RGPD : prénoms seulement, aucune information de santé.</p>
   <div class="grps">${M.G.map(g => `<div class="grp" data-grow="${g.i}">${two ? `<span class="ghandle noprint" data-gdrag="${g.i}" title="Glisser pour changer l'ordre (le groupe garde sa couleur)">⠿</span>` : ""}<label class="sml" style="${colf(0, g.c)}">Groupe ${g.i + 1}<input data-gm="nom" data-gi="${g.i}" value="${esc(S.groups[g.i].nom)}" placeholder="Groupe ${g.i + 1}"></label>${num(`data-gm="acc" data-n="1" data-gi="${g.i}"`, "Accueil (min)", g.acc, g.c)}${two ? `<span class="noprint" style="white-space:nowrap"><a class="chip" data-gmv="${g.i}" data-dir="-1" title="Monter ce groupe (il garde sa couleur)" style="cursor:pointer;${g.i === 0 ? "opacity:.35;pointer-events:none" : ""}">↑</a> <a class="chip" data-gmv="${g.i}" data-dir="1" title="Descendre ce groupe (il garde sa couleur)" style="cursor:pointer;${g.i === M.G.length - 1 ? "opacity:.35;pointer-events:none" : ""}">↓</a> <a class="chip" data-grm="${g.i}" title="Retirer ce groupe" style="cursor:pointer">✕</a></span>` : ""}</div>`).join("")}${M.G.length < GMAX ? `<a class="chip" id="gAdd" style="cursor:pointer;align-self:flex-start">＋ Ajouter un groupe</a>` : ""}</div></div>
  <div class="box noprint" data-stab="ech" style="border-left:6px solid #7FCB8F;background:#F4FAF3"><label class="fl" style="margin:0 0 8px"><input type="checkbox" id="seEchOn" ${E.on ? "checked" : ""}> <b>Échauffement</b></label>${E.on ? ` <span style="color:#6B7280;font-size:13px">— total : ${M.G.map(g => `<b style="color:${g.c}">${M.ce[g.i]} min</b>`).join(" · ")}</span> ${seDeplierBtns()}` : ""}
   ${E.on ? `<div style="margin-top:8px">${seEchSubs().map((s, k) => subHTML(s, k, true)).join("")}</div><div style="margin-top:10px"><span class="noprint" style="font-size:13px;font-weight:700;color:#5B6B82">Ajouter ${aide("<b>Exercice seul</b> : une ligne de l'échauffement, avec sa durée et ses groupes (bleu-vert).<br><b>Bloc</b> : un ensemble de petits exercices avec son titre et sa durée (violet).")}</span> <a class="chip" data-sa="rxopen" data-sub="-1" style="cursor:pointer;background:#1B6A8A;color:#fff;border-color:#1B6A8A">🔍 Jeu de la bibliothèque</a> <a class="chip" data-sa="addsolofree" data-ech="1" style="cursor:pointer;background:#fff;color:#1B6A8A;border-color:#1B6A8A">✎ Exercice libre</a> <a class="chip" data-sa="addech" style="cursor:pointer;background:#5B4BA8;color:#fff;border-color:#5B4BA8">＋ Bloc</a></div>` : ""}${crepsEchHTML()}</div>
  <div class="box noprint" data-stab="corps" style="border-left:6px solid #6EA8DC;background:#EEF1F6"><b>Corps de séance</b> <span style="color:#6B7280;font-size:13px">— total : ${M.G.map(g => `<b style="color:${g.c}">${M.c[g.i]} min</b>`).join(" · ")}</span> ${seDeplierBtns()}
   <div style="margin-top:8px">${SE.subs.map((s, k) => subHTML(s, k, false)).join("")}</div><div style="margin-top:10px"><span class="noprint" style="font-size:13px;font-weight:700;color:#5B6B82">Ajouter ${aide("<b>Exercice seul</b> : une ligne de la fiche, avec sa durée, ses groupes et ses consignes (bandeau bleu-vert).<br><b>Bloc</b> : un ensemble de petits exercices avec son titre et sa durée (bandeau violet). Les exercices de la bibliothèque y sont numérotés 1.1, 1.2…")}</span> <a class="chip" data-sa="rxopen" data-sub="0" style="cursor:pointer;background:#1B6A8A;color:#fff;border-color:#1B6A8A">🔍 Exercice de la bibliothèque</a> <a class="chip" data-sa="addsolofree" style="cursor:pointer;background:#fff;color:#1B6A8A;border-color:#1B6A8A">✎ Exercice libre</a> <a class="chip" data-sa="addsub" style="cursor:pointer;background:#5B4BA8;color:#fff;border-color:#5B4BA8">＋ Bloc</a> <a class="chip" data-rgo="1" style="cursor:pointer">⇅ Réorganiser</a></div>${dl}</div>
  <div class="box noprint" data-stab="bas" style="border-left:6px solid #E0A030;background:#FDF4E3"><b>Bas de fiche</b><div class="smg" style="margin-top:8px">${txa("objCol", "Objectif collectif", "Ce que le groupe doit réussir")}${txa("secu", "Sécurité", "Hauteur, tapis, pas de saut…")}${M.G.map(g => `<label class="sml" style="${colf(0, g.c)}">Retour au calme${two ? " — " + esc(g.nom) : ""} <span style="font-weight:400">(${RC_MIN} min comptées)</span><textarea rows="2" data-gm="rc" data-gi="${g.i}" placeholder="Étirements, bilan…">${esc(g.rc)}</textarea></label>`).join("")}</div></div>
  <div data-stab="ctl">${seControleHTML()}${bilanFormHTML()}</div><div data-stab="apercu"><h3 class="noprint" style="margin:18px 0 8px;color:#26364D">Aperçu de la fiche</h3><div id="sheet" style="border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.12)">${sheetHTML()}</div></div>
`
  );
}
function seanceText() {
  const M = seModel(),
    S = SMETA;
  let t = (S.titre || "Ma séance") + (S.periode ? " (" + S.periode + ")" : "") + "\n";
  if (S.theme) t += "Thème : " + S.theme + "\n";
  if (S.educ) t += "Éducateurs : " + S.educ + "\n";
  if (S.objectif) t += "Objectif : " + S.objectif + "\n";
  if (S.dates) t += "Dates : " + S.dates + "\n";
  const d = (a, idx = M.all) => idx.map(i => a[i] || 0).join("/");
  t += `\nGroupes : ${M.G.map(g => g.nom).join(" / ")}\nAccueil [${d(M.G.map(g => g.acc))} min]\n`;
  if (M.ech.on) {
    t += `\nÉCHAUFFEMENT [${d(M.ce)} min]\n`;
    M.echSubs.forEach((s, k) => {
      t += `\n${echLabel(s, k) || "Échauffement"}${s.idx.length < M.G.length ? " · " + nomsGroupes(M, s.idx) + " seulement" : ""} [${d(s.d, s.idx)} min]\n`;
      s.views.forEach(x => {
        t += `- ${x.name}${x.v.code ? " (" + x.v.code + ")" : ""}${x.v.desc ? " — " + String(x.v.desc).replace(/\s*\n+\s*/g, " ") : ""}\n`;
      });
    });
  }
  t += `\nCORPS DE SÉANCE [${d(M.c)} min]\n`;
  M.subs.forEach((s, k) => {
    t += `\n${s.num}. ${unitLabel(s, k)}${s.idx.length < M.G.length ? " · " + nomsGroupes(M, s.idx) + " seulement" : ""} [${d(s.d, s.idx)} min]\n`;
    s.views.forEach(x => {
      t += `- ${x.name}${x.v.code ? " (" + x.v.code + ")" : ""} — ${x.v.resume}\n`;
    });
  });
  t += `\nDurée totale : ${d(M.tot)} min\n`;
  if (M.mats.length) t += "Matériel : " + M.mats.map(m => capf(m.t)).join(", ") + "\n";
  return t;
}

