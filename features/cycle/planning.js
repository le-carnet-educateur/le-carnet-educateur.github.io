/* Planning du cycle : semaine après semaine, sur quoi orienter la séance.
   Données : CY.plan = { debut (lundi, AAAA-MM-JJ), nb, jours [1..7], mode "meme"|"diff", public "tous"|"groupes", groupes [noms],
   sem: [{ pause, micro, cases: { all: [item], g0: [item] } }] }   item = { t, sid: [id séance], subs: [{ t, jour, sid: [id séance] }] }
   Enregistré avec le cycle (même enregistrement). Les détails restent dans les séances liées. */
const CP_J = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const cpD = iso => {
  const [y, m, j] = String(iso).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, j));
};
const cpISO = d => d.toISOString().slice(0, 10);
const cpAdd = (iso, n) => cpISO(new Date(cpD(iso).getTime() + n * 864e5));
const cpLundi = iso => cpAdd(iso, -((cpD(iso).getUTCDay() + 6) % 7));
const cpFmt = iso => cpD(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const cpFmtLong = iso => cpD(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
let CPMICRO = new Set(); /* semaines dont le champ micro-cycle est ouvert */
let CPCAL = null; /* mois affiché dans le calendrier : { y, m } */

function cpNew() {
  const auj = cpISO(new Date());
  return { debut: cpAdd(cpLundi(auj), 7), nb: 8, jours: [3], mode: "meme", public: "tous", groupes: ["G1", "G2"], sem: [] };
}
function cpEnsure(p) {
  p.nb = Math.max(1, Math.min(40, +p.nb || 1));
  while (p.sem.length < p.nb) p.sem.push({ pause: false, micro: "", cases: { all: [] } });
  p.sem.length = p.nb;
  if (!Array.isArray(p.jours) || !p.jours.length) p.jours = [3];
  p.jours.sort((a, b) => a - b);
}
const cpCases = p => (p.public === "groupes" ? ["all"].concat(p.groupes.map((_, i) => "g" + i)) : ["all"]);
const cpLabel = (p, k) => (k === "all" ? (p.public === "groupes" ? "Tous les groupes" : "") : p.groupes[+k.slice(1)] || k);
const cpDateJour = (p, w, j) => cpAdd(p.debut, w * 7 + (j - 1));
const cpTitreSeance = id => {
  const r = sbAll().find(x => x.id === id);
  return r ? r.titre || "Séance" : "(séance supprimée)";
};
const cpSeances = () =>
  sbAll().filter(r => !String(r.id).startsWith("cy") && (((sbParse(r) || {}).meta || {}).disc || "escalade") === DISC);

/* ---------- édition ---------- */
const cpPill = (on, attrs, txt, title = "") => `<a class="cppill${on ? " on" : ""}" ${attrs}${title ? ` title="${esc(title)}"` : ""}>${txt}</a>`;
/* pastilles des séances liées + menu pour en lier une (lvl « w » = semaine, « i » = item) */
function cpChips(list, at, lvl) {
  return (
    (list || [])
      .map(
        id =>
          `<span class="chip cpch"><a data-cyp="open" data-sid="${esc(id)}" title="Ouvrir la séance">📄 ${esc(cpTitreSeance(id))}</a> <a data-cyp="unlink" data-sid="${esc(id)}" data-lvl="${lvl}" ${at} title="Délier" style="color:#B2263A;font-weight:700">✕</a></span>`
      )
      .join("") +
    `<select class="cpsel" data-cpt="link" data-lvl="${lvl}" ${at}><option value="">＋ Lier une séance…</option>${cpSeances()
      .map(r => `<option value="${esc(r.id)}">${esc(r.titre || "Séance")}</option>`)
      .join("")}</select>`
  );
}
function cpItemHTML(p, w, k, it, ii) {
  const at = `data-w="${w}" data-k="${k}" data-i="${ii}"`;
  const diff = p.mode === "diff";
  const subs = (it.subs || [])
    .map((s, si) => {
      const as = at + ` data-s="${si}"`;
      return `<div class="cpsub"><div class="cprow"><input data-cpt="t" ${as} value="${esc(s.t)}" placeholder="Étape ou point à travailler"><a class="cpx" data-cyp="delsub" ${as} title="Retirer">✕</a></div></div>`;
    })
    .join("");
  /* séances distinctes : le jour et la séance sont au niveau de l'item */
  const droite = diff
    ? `<div class="cplk"><div class="cpjp">${p.jours.map(j => cpPill(+it.jour === j, `data-cyp="set" data-f="ijour" data-v="${j}" ${at}`, esc(cpFmt(cpDateJour(p, w, j))))).join("")}</div>${cpChips(it.sid, at, "i")}</div>`
    : "";
  return `<div class="cpit"><div class="${diff ? "cpr2" : ""}"><div class="cprow"><input class="cpitt" data-cpt="t" ${at} value="${esc(it.t)}" placeholder="Sur quoi on travaille (ex. Chuter et descendre)"><a class="cpx" data-cyp="delitem" ${at} title="Retirer cet item">✕</a></div>${droite}</div>
    ${subs}<div><a class="cpmini" data-cyp="addsub" ${at}>＋ étape</a></div></div>`;
}
function cpCaseHTML(p, w, k) {
  const items = p.sem[w].cases[k] || [];
  const lab = cpLabel(p, k);
  return `<div class="cpcase">${lab ? `<div class="cplab">${esc(lab)}</div>` : ""}${items.map((it, ii) => cpItemHTML(p, w, k, it, ii)).join("")}<a class="cpmini" data-cyp="additem" data-w="${w}" data-k="${k}">＋ item</a></div>`;
}
function cpWeekHTML(p, w) {
  const s = p.sem[w];
  const lundi = cpAdd(p.debut, w * 7);
  const dates = p.jours.map(j => cpFmt(cpDateJour(p, w, j))).join("<br>");
  const aj = new Date();
  const now = cpISO(aj) >= lundi && cpISO(aj) <= cpAdd(lundi, 6);
  /* séance unique : « Lier une séance » sous « Pause » (une par groupe si le public est par groupe) */
  s.sid = s.sid || {};
  const liens =
    p.mode === "diff" || s.pause
      ? ""
      : cpCases(p)
          .map(k => `<div class="cpwl">${p.public === "groupes" ? `<div class="cplab">${esc(cpLabel(p, k))}</div>` : ""}${cpChips(s.sid[k], `data-w="${w}" data-k="${k}"`, "w")}</div>`)
          .join("");
  return `<div class="cpw${now ? " now" : ""}${s.pause ? " pause" : ""}">
    <div class="cpwh"><b>S${w + 1}</b>${now ? ' <span class="cpnow">cette semaine</span>' : ""}<div class="cpd">${dates}</div>
    <div style="margin:6px 0">${cpPill(s.pause, `data-cyp="set" data-f="pause" data-w="${w}"`, "Pause")}</div>${liens}</div>
    <div class="cpwb">${s.micro || CPMICRO.has(w) ? `<input class="cpmicro" data-cpt="micro" data-w="${w}" value="${esc(s.micro || "")}" placeholder="Titre du micro-cycle (regroupe plusieurs semaines)">` : `<a class="cpmini" data-cyp="micro" data-w="${w}" style="display:block;margin-bottom:6px;font-weight:400;color:#8a93a3">＋ micro-cycle</a>`}
    ${s.pause ? '<div class="cpvac">Pause (vacances, pas de séance)</div>' : cpCases(p).map(k => cpCaseHTML(p, w, k)).join("")}</div></div>`;
}
function cpCalHTML(p) {
  if (!CPCAL) {
    const d = cpD(p.debut);
    CPCAL = { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  }
  const prem = cpISO(new Date(Date.UTC(CPCAL.y, CPCAL.m, 1)));
  let lundi = cpLundi(prem);
  const nom = new Date(Date.UTC(CPCAL.y, CPCAL.m, 1)).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  const fin = cpAdd(p.debut, p.nb * 7 - 1);
  let rows = "";
  for (let r = 0; r < 6; r++) {
    const dans = lundi >= p.debut && lundi <= fin;
    const sel = lundi === p.debut;
    let cells = "";
    for (let j = 0; j < 7; j++) {
      const d = cpAdd(lundi, j);
      const hors = cpD(d).getUTCMonth() !== CPCAL.m;
      cells += `<span style="${hors ? "color:#B5BCC9" : ""}">${cpD(d).getUTCDate()}</span>`;
    }
    rows += `<div class="cpcr${dans ? " dans" : ""}${sel ? " sel" : ""}" data-cyp="semaine" data-d="${lundi}" title="Commencer le cycle cette semaine">${cells}</div>`;
    lundi = cpAdd(lundi, 7);
    if (cpD(lundi).getUTCMonth() !== CPCAL.m && cpD(lundi).getUTCDate() < 8 && r >= 3) break;
  }
  return `<div class="cpcal"><div class="cpcn"><a class="chip" data-cyp="mois" data-n="-1">‹</a><b style="flex:1;text-align:center;text-transform:capitalize">${esc(nom)}</b><a class="chip" data-cyp="mois" data-n="1">›</a></div>
  <div class="cpcr cph">${CP_J.map(x => `<span>${x.slice(0, 2)}</span>`).join("")}</div>${rows}
  <div class="hint" style="margin-top:6px">Clique sur une semaine : le cycle commence ce lundi-là. Les semaines du cycle sont en bleu.</div></div>`;
}
function cpHTML() {
  const p = CY.plan;
  if (!p)
    return `<div class="box noprint"><b>Planning du cycle</b><p class="hint" style="margin:6px 0 10px">Semaine après semaine, sur quoi orienter la séance : on définit la durée, les jours de cours et les groupes, puis on lie les séances préparées à chaque semaine.</p><a class="btn" data-cyp="creer" style="background:#26364D;color:#fff;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer;display:inline-block">＋ Créer le planning</a></div>`;
  cpEnsure(p);
  const fin = cpAdd(p.debut, p.nb * 7 - 1);
  const modeles = typeof CYCLE1 !== "undefined";
  return `<div class="noprint cplay">
  <div class="box cpbox cpside">
    <b style="font-size:16px;display:block;margin-bottom:8px">Planning du cycle</b>
    <div class="cpl">Début du cycle</div><div class="hint" style="margin:0 0 4px"><b>Semaine du ${esc(cpFmtLong(p.debut))}</b><br>jusqu'au ${esc(cpFmtLong(fin))}</div>${cpCalHTML(p)}
    <div class="cpl" style="margin-top:12px">Durée</div><div class="cpnb"><a class="cpnbb" data-cyp="nbstep" data-d="-1" title="Une semaine de moins">−</a><input type="number" min="1" max="40" data-cpt="nb" value="${p.nb}"><a class="cpnbb" data-cyp="nbstep" data-d="1" title="Une semaine de plus">+</a><span class="cpnbt">semaine${p.nb > 1 ? "s" : ""}</span></div>
    <div class="cpl" style="margin-top:12px">Jours de cours</div><div class="cppills cpj1">${CP_J.map((n, i) => cpPill(p.jours.includes(i + 1), `data-cyp="set" data-f="jours" data-v="${i + 1}"`, n)).join("")}</div>
    <div class="cpl" style="margin-top:12px">Séances <span class="aide" tabindex="0">?<span class="tip"><b>Séance unique</b> : une seule fiche de séance par semaine, déroulée les jours de cours (ex. la même séance le mercredi et le samedi). On la lie à la semaine.<br><br><b>Séances distinctes</b> : une séance différente pour chaque jour de cours. On choisit le jour de chaque item et on lui lie sa séance.</span></span></div><div class="cppills">${cpPill(p.mode !== "diff", 'data-cyp="set" data-f="mode" data-v="meme"', "Séance unique")}${cpPill(p.mode === "diff", 'data-cyp="set" data-f="mode" data-v="diff"', "Séances distinctes")}</div>
    <div class="cpl" style="margin-top:12px">Public</div><div class="cppills">${cpPill(p.public !== "groupes", 'data-cyp="set" data-f="public" data-v="tous"', "Tous")}${cpPill(p.public === "groupes", 'data-cyp="set" data-f="public" data-v="groupes"', "Par groupe")}</div>
    ${p.public === "groupes" ? `<input data-cpt="groupes" value="${esc(p.groupes.join(", "))}" placeholder="Noms des groupes : G1, G2" style="margin-top:6px;width:100%">` : ""}
    ${modeles ? `<div class="cpl" style="margin-top:12px">Partir d'un modèle</div><a class="chip" data-cyp="modele" style="cursor:pointer">Progression du 1er cycle (8 séances)</a>` : ""}
    <div style="margin-top:14px"><a class="chip" data-cyp="suppr" style="cursor:pointer;color:#B2263A">Supprimer le planning</a></div>
  </div>
  <div class="box cpmain"><div class="cpweeks">${p.sem.map((_, w) => cpWeekHTML(p, w)).join("")}</div></div></div>`;
}

/* ---------- feuille imprimable / aperçu ---------- */
function cpSheetHTML(cy) {
  const p = cy.plan;
  if (!p || !p.sem || !p.sem.length) return "";
  const th = t => `<th style="background:#3A8FB0;color:#fff;text-align:left;padding:6px 8px;font-size:11px;letter-spacing:.5px">${t}</th>`;
  const liens = l => (l || []).map(id => `<span style="display:inline-block;background:#E4EEFB;border-radius:9px;padding:1px 8px;margin:1px 3px 1px 0">${esc(cpTitreSeance(id))}</span>`).join("");
  let micro = "";
  const rows = p.sem
    .map((s, w) => {
      const dates = (p.jours || []).map(j => cpFmt(cpDateJour(p, w, j))).join("<br>");
      let m = "";
      if (s.micro && s.micro !== micro) m = `<tr><td colspan="3" style="background:#26364D;color:#fff;font-weight:700;padding:5px 8px">${esc(s.micro)}</td></tr>`;
      micro = s.micro || micro;
      const diff = p.mode === "diff";
      const cases = (p.public === "groupes" ? ["all"].concat((p.groupes || []).map((_, i) => "g" + i)) : ["all"])
        .map(k => {
          const items = (s.cases && s.cases[k]) || [];
          const sw = !diff ? liens((s.sid || {})[k]) : "";
          if (!items.length && !sw) return "";
          const lab = k === "all" ? (p.public === "groupes" ? "Tous les groupes" : "") : (p.groupes || [])[+k.slice(1)] || k;
          return `<div style="margin-bottom:4px">${lab ? `<b style="color:#5B6577">${esc(lab)}</b> ` : ""}${sw}${items
            .map(
              it =>
                `<div><b>${esc(it.t)}</b>${diff && it.jour ? ` <i style="color:#6B7280">(${esc(cpFmt(cpDateJour(p, w, +it.jour)))})</i>` : ""} ${diff ? liens(it.sid) : ""}${(it.subs || [])
                  .map(x => `<div style="margin-left:12px">• ${esc(x.t)}</div>`)
                  .join("")}</div>`
            )
            .join("")}</div>`;
        })
        .join("");
      return `${m}<tr style="background:${w % 2 ? "#F4F7FB" : "#fff"}"><td style="padding:6px 8px;font-weight:700;vertical-align:top;white-space:nowrap">S${w + 1}</td><td style="padding:6px 8px;vertical-align:top;white-space:nowrap;color:#4A5873">${s.pause ? "—" : dates}</td><td style="padding:6px 8px;vertical-align:top">${s.pause ? '<i style="color:#8A93A3">Pause</i>' : cases || '<i style="color:#8A93A3">—</i>'}</td></tr>`;
    })
    .join("");
  return `<div style="margin-top:10px"><b style="color:#3A8FB0;letter-spacing:1px;font-size:11px">PLANNING DU CYCLE</b><table style="width:100%;border-collapse:collapse;margin-top:4px"><thead><tr>${th("SEM.")}${th("DATES")}${th("SUR QUOI ON TRAVAILLE")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* le planning sous forme de données simples (pour l'export Word) */
function cpWordRows(cy) {
  const p = cy.plan;
  if (!p || !p.sem || !p.sem.length) return [];
  const diff = p.mode === "diff";
  const tit = l => (l || []).map(cpTitreSeance);
  return p.sem.map((s, w) => {
    const blocs = [];
    (p.public === "groupes" ? ["all"].concat((p.groupes || []).map((_, i) => "g" + i)) : ["all"]).forEach(k => {
      const items = (s.cases && s.cases[k]) || [];
      const sw = !diff ? tit((s.sid || {})[k]) : [];
      if (!items.length && !sw.length) return;
      const lab = k === "all" ? (p.public === "groupes" ? "Tous les groupes" : "") : (p.groupes || [])[+k.slice(1)] || k;
      blocs.push({
        lab,
        liens: sw,
        items: items.map(it => ({ t: it.t || "", jour: diff && it.jour ? cpFmt(cpDateJour(p, w, +it.jour)) : "", liens: diff ? tit(it.sid) : [], subs: (it.subs || []).map(x => x.t) })),
      });
    });
    return { sem: w + 1, micro: s.micro || "", pause: !!s.pause, dates: (p.jours || []).map(j => cpFmt(cpDateJour(p, w, j))), blocs };
  });
}

/* ---------- actions ---------- */
/* période du cycle (champ « Période » en haut) : se remplit toute seule, sauf si on l'a modifiée à la main */
function cpPeriode(p) {
  if (!p.jours || !p.jours.length) return "";
  const M = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  const deb = cpD(cpDateJour(p, 0, Math.min(...p.jours))),
    fin = cpD(cpDateJour(p, p.nb - 1, Math.max(...p.jours)));
  const m1 = deb.getUTCMonth(),
    m2 = fin.getUTCMonth(),
    a1 = deb.getUTCFullYear(),
    a2 = fin.getUTCFullYear();
  if (a1 === a2 && m1 === m2) return M[m1] + " " + a1;
  if (a1 === a2) return M[m1] + " – " + M[m2] + " " + a1;
  return M[m1] + " " + a1 + " – " + M[m2] + " " + a2;
}
function cpSync() {
  const p = CY.plan;
  if (!p) return;
  const auto = cpPeriode(p);
  if (!CY.periode || CY.periode === p.periodeAuto) CY.periode = auto;
  p.periodeAuto = auto;
}
const cpSauve = () => {
  cpSync();
  cySave();
};
const cpRef = el => {
  const p = CY.plan,
    w = +el.dataset.w,
    k = el.dataset.k,
    i = +el.dataset.i,
    s = el.dataset.s === undefined ? -1 : +el.dataset.s;
  const items = p && p.sem[w] ? (p.sem[w].cases[k] = p.sem[w].cases[k] || []) : [];
  const it = items[i];
  return { p, w, k, i, s, items, it, sub: it && s >= 0 ? (it.subs || [])[s] : null };
};
registerClick(e => {
  const b = e.target.closest("[data-cyp]");
  if (!b) return;
  const a = b.dataset.cyp;
  const R = CY.plan ? cpRef(b) : {};
  if (a === "creer") {
    CY.plan = cpNew();
    cpEnsure(CY.plan);
    CPCAL = null;
  } else if (a === "suppr") {
    if (!confirm("Supprimer tout le planning de ce cycle ?")) return true;
    CY.plan = null;
  } else if (a === "semaine") {
    CY.plan.debut = b.dataset.d;
  } else if (a === "micro") {
    CPMICRO.add(+b.dataset.w);
    render();
    return true;
  } else if (a === "nbstep") {
    const i = document.querySelector('[data-cpt="nb"]');
    if (i) {
      i.value = Math.max(1, Math.min(40, (+i.value || 1) + +b.dataset.d));
      i.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return true;
  } else if (a === "mois") {
    const n = +b.dataset.n;
    CPCAL = { y: CPCAL.y + Math.floor((CPCAL.m + n) / 12), m: (CPCAL.m + n + 12) % 12 };
  } else if (a === "additem") {
    R.items.push({ t: "", sid: [], jour: 0, subs: [] });
  } else if (a === "delitem") {
    if ((R.it.t || R.it.subs.length || R.it.sid.length) && !confirm("Retirer cet item ?")) return true;
    R.items.splice(R.i, 1);
  } else if (a === "addsub") {
    (R.it.subs = R.it.subs || []).push({ t: "" });
  } else if (a === "delsub") {
    R.it.subs.splice(R.s, 1);
  } else if (a === "unlink") {
    const l = b.dataset.lvl === "w" ? (R.p.sem[R.w].sid || {})[R.k] || [] : R.it.sid;
    l.splice(l.indexOf(b.dataset.sid), 1);
  } else if (a === "set") {
    const f = b.dataset.f,
      v = b.dataset.v,
      p = CY.plan;
    if (f === "mode") p.mode = v;
    else if (f === "public") p.public = v;
    else if (f === "pause") p.sem[R.w].pause = !p.sem[R.w].pause;
    else if (f === "jours") {
      const j = +v;
      p.jours = p.jours.includes(j) ? p.jours.filter(x => x !== j) : p.jours.concat(j);
      if (!p.jours.length) p.jours = [j];
    } else if (f === "ijour") R.it.jour = +R.it.jour === +v ? 0 : +v;
    cpEnsure(p);
  } else if (a === "open") {
    go("sb/" + encodeURIComponent(b.dataset.sid));
    return true;
  } else if (a === "modele") {
    if (CY.plan.sem.some(s => Object.values(s.cases).some(l => l.length)) && !confirm("Remplacer le contenu des semaines par le modèle ?")) return true;
    CY.plan.nb = Math.max(CY.plan.nb, CYCLE1.seances.length);
    cpEnsure(CY.plan);
    CYCLE1.seances.forEach((r, i) => {
      CY.plan.sem[i].cases.all = [{ t: r[0].replace(/^\d+\.\s*/, ""), sid: [], jour: 0, subs: [{ t: r[1] }] }];
    });
    CY.plan.sem[0].micro = "Progression du 1er cycle";
  } else return;
  cpSauve();
  render();
  return true;
});
/* champs : texte (sans refaire la page), listes et cases (avec) */
document.addEventListener("input", e => {
  const t = e.target;
  if (!t || !t.dataset || !t.dataset.cpt || !CY || !CY.plan) return;
  const f = t.dataset.cpt;
  if (f === "t") {
    const R = cpRef(t);
    (R.sub || R.it).t = t.value;
  } else if (f === "micro") CY.plan.sem[+t.dataset.w].micro = t.value;
  else if (f === "groupes") CY.plan.groupes = t.value.split(/[,;]+/).map(x => x.trim()).filter(Boolean);
  else return;
  cpSauve();
  cyPreview();
});
document.addEventListener("change", e => {
  const t = e.target;
  if (!t || !t.dataset || !t.dataset.cpt || !CY || !CY.plan) return;
  const p = CY.plan,
    f = t.dataset.cpt;
  if (f === "link") {
    if (!t.value) return;
    const R = cpRef(t);
    const l = t.dataset.lvl === "w" ? ((p.sem[R.w].sid = p.sem[R.w].sid || {})[R.k] = (p.sem[R.w].sid || {})[R.k] || []) : R.it.sid;
    if (!l.includes(t.value)) l.push(t.value);
  }
  else if (f === "nb") {
    const n = Math.max(1, Math.min(40, +t.value || 1));
    if (n < p.nb && p.sem.slice(n).some(s => Object.values(s.cases).some(l => l.length)) && !confirm("Les semaines en trop seront retirées avec leur contenu. Continuer ?")) {
      render();
      return;
    }
    p.nb = n;
    cpEnsure(p);
  } else if (f === "groupes") CY.plan.groupes = CY.plan.groupes.length ? CY.plan.groupes : ["G1", "G2"];
  else return;
  cpEnsure(p);
  cpSauve();
  render();
});
/* styles */
document.head.insertAdjacentHTML(
  "beforeend",
  `<style>
.cpbox .f,.cpbox summary.f{border:1px solid #d5dae5;border-radius:8px;padding:7px 10px;background:#fff;cursor:pointer;display:inline-block}
.cpset{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px 18px;margin:12px 0}
.cpl{font-size:12px;font-weight:700;color:#7a8497;letter-spacing:.5px;margin-bottom:4px;text-transform:uppercase}
.cpjr{display:inline-block;margin-right:8px;font-size:14px}
.cpset select,.cpset input[type=number],.cpset input:not([type]),.cpbox .cprow input,.cpmicro{font:inherit;font-size:14px;padding:6px 9px;border:1px solid #d5dae5;border-radius:8px;background:#fff;max-width:100%}
.cpcal{margin-top:6px;background:#fff;border:1px solid #e3e8f2;border-radius:10px;padding:8px;width:100%}
.cpcn{display:flex;gap:8px;align-items:center;margin-bottom:6px}
.cpcr{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:13px;padding:3px 0;border-radius:6px}
.cpcr.cph{font-size:11px;color:#8a93a3;font-weight:700}
.cpcr:not(.cph){cursor:pointer}.cpcr:not(.cph):hover{background:#eef1f8}
.cpcr.dans{background:#e4eefb}.cpcr.sel{background:#26364d;color:#fff}.cpcr.sel span{color:#fff!important}
.cplay{display:grid;grid-template-columns:300px minmax(0,1fr);gap:16px;align-items:start;margin-bottom:14px}.cpside{position:sticky;top:12px;margin:0}.cpmain{margin:0}.cpr2{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:10px;align-items:start}.cpweeks{margin-top:0}
.cpw{display:grid;grid-template-columns:150px 1fr;gap:12px;padding:12px 8px;border-top:1px solid #e3e8f2;border-radius:6px}
.cpw.now{background:#fff8e1}.cpw.pause{opacity:.7}
.cpwh b{font-size:16px;color:#26364d}.cpd{font-size:12.5px;color:#4a5873;margin-top:2px}
.cpnow{background:#f3b94a;color:#fff;font-size:11px;font-weight:700;border-radius:99px;padding:1px 8px}
.cppz{display:block;font-size:12.5px;color:#6b7280;margin-top:6px}
.cpmicro{width:100%;margin-bottom:8px;font-style:italic}
.cpcase{margin-bottom:10px}.cplab{font-weight:700;font-size:13px;color:#2B5A9E;margin:4px 0}
.cpit{background:#f7f9fd;border-radius:8px;padding:8px 10px;margin-bottom:6px}
.cprow{display:flex;gap:6px;align-items:center;margin:3px 0}.cprow input{flex:1;min-width:0}.cpitt{font-weight:700}
.cpsub{margin:4px 0 4px 16px;border-left:3px solid #d5dae5;padding-left:8px}.cpsub .cprow input{font-size:13.5px}.cpsel{max-width:100%}
.cplab2{font-size:13px;color:#6b7280;margin-right:4px}.cplk{margin:4px 0 2px}.cpch{display:inline-flex;gap:6px;align-items:center;margin:0 6px 4px 0}.cpch a{cursor:pointer}
.cpsel{font:inherit;font-size:13px;padding:3px 6px;border:1px dashed #b5bccb;border-radius:20px;background:#fff;color:#6b7280;max-width:230px}
.cpx{cursor:pointer;color:#B2263A;font-weight:700;padding:0 4px}
.cpmini{cursor:pointer;font-size:13px;color:#2B5A9E;font-weight:700}
.cpvac{color:#8a93a3;font-style:italic}
.cppills{display:flex;flex-wrap:wrap;gap:6px}.cppill{cursor:pointer;user-select:none;border:1px solid #d5dae5;background:#fff;border-radius:20px;padding:5px 12px;font-size:13.5px;color:#4a5873}.cppill:hover{border-color:#26364d}.cppill.on{background:#26364d;border-color:#26364d;color:#fff;font-weight:700}.cpjp{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}.cpjp .cppill{padding:3px 10px;font-size:12.5px}.cpjp .cppill.on{background:#3A8FB0;border-color:#3A8FB0}.cpwl{margin-top:8px}.cpwh .cpch{max-width:100%}.cpwh .cpch a:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:105px;display:inline-block;vertical-align:bottom}.cpbox .aide{vertical-align:middle}@media(max-width:1100px){.cplay{grid-template-columns:1fr}.cpside{position:static;max-height:none}}@media(max-width:700px){.cpw{grid-template-columns:1fr}.cpr2{grid-template-columns:1fr}}
.cpj1{flex-wrap:nowrap;gap:3px}.cpj1 .cppill{flex:1 1 0;min-width:0;text-align:center;padding:4px 0;font-size:12px;border-radius:14px}
.cpnb{display:inline-flex;align-items:center;border:1px solid #d5dae5;border-radius:22px;background:#fff;overflow:hidden}.cpnb input[type=number]{width:46px;border:0;text-align:center;font-weight:700;font-size:16px;color:#26364d;background:transparent;padding:4px 0;-moz-appearance:textfield;appearance:textfield}.cpnb input::-webkit-outer-spin-button,.cpnb input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.cpnb input:focus{outline:none}
.cpnbb{cursor:pointer;user-select:none;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#26364d;background:#eef1f8}.cpnbb:hover{background:#26364d;color:#fff}
.cpnbt{padding:0 12px 0 8px;color:#4a5873;font-size:13.5px}
</style>`
);
