/* Ma séance — vue normalisée d'un exercice et aperçu de la fiche (HTML) */
/* parties du texte d'un jeu (paragraphes) : un jeu qui en compte plusieurs peut n'en garder que certaines */
const principeParties = g =>
  String((g && g["Principe"]) || "")
    .split(/\n\s*\n/)
    .map(x => x.trim())
    .filter(Boolean);
/* intitulé court d'une partie : son titre (« Jacadi du mur : … ») sinon ses premiers mots */
const partieNom = t => {
  const m = t.match(/^([^:\n]{2,50}?) :\s/);
  return m ? m[1] : t.replace(/\s+/g, " ").slice(0, 40) + (t.length > 40 ? "…" : "");
};
/* variantes (plus difficile / plus facile) : une ligne = une variante, numérotées p0, p1… et m0, m1… */
const variantesJeu = g => {
  const L = t => lines(t || "");
  return L(g && g["Plus difficile"])
    .map((t, i) => ({ k: "p" + i, t, sg: "+" }))
    .concat(L(g && g["Plus facile"]).map((t, i) => ({ k: "m" + i, t, sg: "–" })));
};
/* texte du jeu pour cette séance : texte modifié à la main, sinon parties retenues, sinon texte du jeu */
function itemDesc(it, g) {
  if (typeof it.txt === "string") return it.txt;
  const P = principeParties(g);
  if (P.length > 1 && Array.isArray(it.pn) && it.pn.length)
    return P.filter((_, i) => !it.pn.includes(i)).join("\n\n");
  return g["Principe"] || g["Résumé"] || "";
}
/* intitulé d'un bloc dans la fiche : titre — nom du ou des jeux (sauf si identique au titre) */
function subLabel(s, k, def) {
  const t = s.titre || (def !== undefined ? def : "Bloc " + (k + 1));
  const n = (s.views || [])
    .map(x => x.v.titre)
    .filter((x, i, a) => x && norm(x) !== norm(s.titre || "") && a.indexOf(x) === i);
  return n.length ? (t ? t + " — " : "") + n.join(", ") : t;
}
/* intitulé d'une unité du corps de séance : le nom de l'exercice (exercice seul), ou le titre du bloc */
function unitLabel(s, k) {
  if (s.solo) return (s.views && s.views[0] && s.views[0].name) || "Exercice";
  const one = s.views && s.views.length === 1 ? s.views[0].name : "";
  return s.titre || one || "Bloc " + (k + 1);
}
/* intitulé d'une étape de l'échauffement : le nom de l'exercice (exercice seul) ou le titre / les jeux du bloc */
const echLabel = (s, k) => (s.solo ? unitLabel(s, k) : subLabel(s, k, ""));
/* couleurs du bandeau : exercice seul = bleu-vert, bloc = violet */
const uniteCol = s => {
  const [bg, fg] = PAL.u[s.solo ? "solo" : "bloc"];
  return { bg, fg, w: palHex(bg), wf: palHex(fg) };
};
/* schéma de cet exercice dans la fiche : choix propre à l'exercice (it.schOn), sinon réglage général de la séance */
/* où vont les schémas dans la fiche : "non" (aucun) · "sous" (sous chaque exercice) · "page" (page à part).
   Les anciennes séances n'ont pas ce réglage : on le déduit de l'ancien (schemaMode / schemaStd). */
function schemaPlace() {
  const m = SMETA && SMETA.schemaPlace;
  if (m === "non" || m === "sous" || m === "page") return m;
  if (typeof isCreps === "function" && isCreps()) return SMETA && SMETA.schemaMode === "sous" ? "sous" : "page";
  return SMETA && SMETA.schemaStd ? "sous" : "non";
}
const itemSchOn = it => (typeof it.schOn === "boolean" ? it.schOn : schemaPlace() !== "non");
/* durée fixe du retour au calme, comptée pour tous les groupes */
const RC_MIN = 5;
/* vue normalisée d'un jeu (bibliothèque ou libre) */
function itemView(it) {
  if (it.t === "lib") {
    const g = DATA.find(x => key(x) === it.k);
    if (!g) return null;
    const vt = sg =>
      variantesJeu(g)
        .filter(v => v.sg === sg)
        .map(v => "• " + v.t)
        .join("\n");
    return {
      titre: g.Titre,
      code: g.Code || "",
      url: gameUrl(key(g)),
      desc: itemDesc(it, g),
      obj: (it.obj || "").trim(),
      part: g["Participants"] || "",
      meta: [
                g["Espace"],
        (typeof it.mat === "string" ? it.mat : g["Matériel"]) && "Matériel : " + (typeof it.mat === "string" ? it.mat : g["Matériel"]),
        (it.dos || g["Dosage"]) && "Dosage : " + (it.dos || g["Dosage"]),
      ]
        .filter(Boolean)
        .join(" · "),
      plus: typeof it.vp === "string" ? it.vp : vt("+"),
      moins: typeof it.vm === "string" ? it.vm : vt("–"),
      crit: critEff(it),
      img: (it.sch && typeof edSvgUrl === "function" && edSvgUrl(it.sch)) || g["Schéma (lien)"] || "",
      imgJeu: (typeof crepsImg === "function" && crepsImg(g)) || "",
      schOn: itemSchOn(it),
      mat: typeof it.mat === "string" ? it.mat : g["Matériel"],
      noMat: typeof it.mat === "string" ? /^(aucun|—)/i.test(it.mat.trim()) : noMat(g),
      resume: g["Résumé"] || "",
      dos: it.dos || g["Dosage"] || "",
      fam: g,
    };
  }
  return {
    titre: it.titre || "[Nom du jeu]",
    code: "",
    desc: it.desc || "",
    obj: (it.obj || "").trim(),
    part: it.part || "",
    meta: [it.mat && "Matériel : " + it.mat, it.dos && "Dosage : " + it.dos].filter(Boolean).join(" · "),
    dos: it.dos || "",
    plus: it.plus,
    moins: it.moins,
    crit: it.crit,
    mat: it.mat,
    noMat: /^(aucun|—)/i.test((it.mat || "").trim()),
    resume: it.desc || "",
    img: (it.sch && typeof edSvgUrl === "function" && edSvgUrl(it.sch)) || "",
    schOn: itemSchOn(it),
    free: true,
  };
}
function seModel() {
  seDefaults();
  const G = SMETA.groups.map((g, i) => ({
    ...g,
    i,
    nom: g.nom || "Groupe " + (i + 1),
    c: GCOL[g.ci >= 0 && g.ci < GCOL.length ? g.ci : i],
  }));
  const all = G.map(g => g.i);
  const mapSubs = L => {
    const R = L.map(s => ({
      ...s,
      idx: s.gs || all,
      views: s.items.map(i => ({ it: i, v: itemView(i) })).filter(x => x.v),
    }));
    R.forEach(s => {
      const many = s.views.length > 1;
      s.views.forEach(x => {
        const def = !many && s.titre ? s.titre : x.v.titre;
        x.def = def;
        x.name = (x.it.nom || "").trim() || def;
        x.same = !!s.titre && norm(x.name) === norm(s.titre);
        x.steps = stepsOf(x.v, x.it);
      });
    });
    return R;
  };
  const subs = mapSubs(SE.subs);
  /* numérotation : chaque exercice seul et chaque bloc a son numéro (sa place dans la liste) ;
     dans un bloc, les exercices de la bibliothèque sont numérotés « n.1 », « n.2 »… */
  subs.forEach((s, k) => {
    s.num = k + 1;
    let q = 0;
    s.views.forEach(x => {
      if (s.solo) {
        x.same = true;
        x.n = String(s.num);
      } else x.n = x.it.t === "lib" ? s.num + "." + ++q : "";
    });
  });
  const echSubs = mapSubs(seEchSubs());
  echSubs.forEach(s => s.solo && s.views.forEach(x => (x.same = true)));
  const echViews = echSubs.flatMap(s => s.views);
  const mats = {};
  subs
    .concat([{ views: echViews }])
    .forEach(s =>
    s.views.forEach(({ v }) => {
      if (v.noMat || !v.mat) return;
      String(v.mat)
        .split(/[;,]|\bet\b/i)
        .map(x => x.replace(/\(.*?\)/g, "").trim())
        .filter(t => t && !/^(aucun|option)/i.test(norm(t)))
        .forEach(t => {
          const kk = norm(t);
          (mats[kk] = mats[kk] || { t, c: [] }).c.push(v.code || v.titre);
        });
    })
  );
  const ech = SE.ech;
  const somme = L => G.map(g => L.reduce((a, s) => a + (s.idx.includes(g.i) ? +s.d[g.i] || 0 : 0), 0));
  const c = somme(subs);
  const ce = somme(echSubs);
  return {
    G,
    all,
    two: G.length > 1,
    subs,
    ech,
    echViews,
    echSubs,
    ce,
    mats: Object.values(mats),
    c,
    tot: G.map((g, i) => (+g.acc || 0) + (ech.on ? ce[i] || 0 : 0) + c[i] + RC_MIN),
    nGames: subs.reduce((a, s) => a + s.views.length, 0) + echViews.length,
  };
}
/* « A », « A et B », « A, B et C » */
/* groupes concernés : pastilles dans la couleur de chaque groupe (rien si tous les groupes) */
const whoHTML = (M, idx) =>
  idx.length < M.G.length
    ? " " + idx.map(i => `<span style="display:inline-block;background:#fff;color:${M.G[i].c};border:1px solid ${M.G[i].c};padding:0 6px;margin-left:3px;font-weight:700;font-size:11px">${esc(M.G[i].nom)}</span>`).join("")
    : "";
const partHTML = v => (v && v.part ? ` <span style="font-weight:400;color:#6B7280;font-size:11px">· ${esc(v.part)}</span>` : "");
const nomsGroupes = (M, idx) => {
  const n = idx.map(i => M.G[i].nom);
  return n.length > 1 ? n.slice(0, -1).join(", ") + " et " + n[n.length - 1] : n[0] || "";
};
/* étiquettes de durée pour les groupes de idx : [{t:"15'",c:couleur}] */
/* fiche simplifiée : schémas des jeux sous chaque exercice (option « Schémas ») */
const schemaStd = () => !!(SMETA && SMETA.schemaStd);
const tgs = (M, d, idx) => idx.map(i => ({ t: (+d[i] || 0) + "'", c: M.G[i].c }));
function sheetHTML() {
  palApply(SMETA.palette);
  if (typeof isCreps === "function" && isCreps()) return crepsHTML();
  const M = seModel(),
    S = SMETA;
  const ph = t => `<i style="color:#8A93A3">${t}</i>`;
  const v = (x, p) => (x ? esc(x) : ph(p));
  const tagbox = a =>
    `<span style="display:inline-flex;gap:3px">${a.map(x => `<span style="background:${x.c};color:#fff;font-weight:700;padding:2px 9px;min-width:30px;text-align:center">${x.t}</span>`).join("")}</span>`;
  const band = (a, title, bg, col, body) => {
    const f = PAL.st === "filet";
    return `<div style="display:flex;align-items:center;gap:10px;background:${f ? "#fff" : bg};padding:3px 8px 3px 0;margin-top:8px;font-size:12px;font-weight:700;color:${col}${f ? ";border-left:5px solid " + col + ";border-bottom:1px solid " + bg : ""}">${tagbox(a)}<span>${title}</span></div>${body || ""}`;
  };
  const cl = "color:" + PAL.sub;
  const lignes = [];
  const l1 = [
    S.titre ? `<b style="font-size:18px">${esc(S.titre)}</b>` : "",
    S.periode ? `<span style="${cl}">[${esc(S.periode)}]</span>` : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (l1) lignes.push(l1);
  if (S.theme) lignes.push(`<b>Thème :</b> <span style="${cl}">${esc(S.theme)}</span>`);
  if (S.educ) lignes.push(`<b>Éducateurs :</b> <span style="${cl}">${esc(S.educ)}</span>`);
  const cols = [],
    cases = [];
  if (S.logo) {
    cols.push("auto");
    cases.push(
      `<div><img src="${esc(S.logo)}" alt="Logo" style="max-height:54px;max-width:150px;display:block"></div>`
    );
  }
  if (lignes.length) {
    cols.push("2fr");
    cases.push(`<div>${lignes.join("<br>")}</div>`);
  }
  if (S.objectif) {
    cols.push("1.6fr");
    cases.push(
      `<div><b>Objectif général :</b> <span style="${cl}">${rt(S.objectif)}</span></div>`
    );
  }
  if (S.dates) {
    cols.push("1.1fr");
    cases.push(
      `<div style="text-align:center"><b>Dates :</b> <span style="${cl}">${esc(S.dates)}</span></div>`
    );
  }
  cols.push("1.4fr");
  cases.push(
    `<div style="font-size:12px${S.logo ? "" : ";padding-right:52px"}">${M.G.map(g => `<span style="color:${g.c}">■</span> ${esc(g.nom)} – ${M.tot[g.i]} min`).join("<br>")}</div>`
  );
  /* logo du site : à droite du bandeau de tête, sans prendre de place (seulement si la salle n'a pas mis le sien) */
  const logoSite = S.logo ? "" : `<img src="${LOGO_URL}" alt="" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;opacity:.9;pointer-events:none" onerror="this.remove()">`;
  let h = `<div class="sheet" style="font-size:13px;color:#2B2F36;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact">
  <div style="background:${NAVYC};color:${PAL.ink};${PAL.hb ? "border-bottom:4px solid " + PAL.hb + ";" : ""}display:grid;grid-template-columns:${cols.join(" ")};gap:14px;padding:12px 16px;align-items:center;position:relative">${cases.join("")}${logoSite}</div>`;
  if (accOn(M))
    h += band(
      tgs(
        M,
        M.G.map(g => g.acc),
        M.all
      ),
      "ACCUEIL",
      PAL.b.acc[0],
      PAL.b.acc[1]
    );
  /* lien vers la fiche : s'ouvre en fenêtre (on reste sur la page) */
  const lk = (v, inner) =>
    v.code
      ? `<a data-jeu="${esc(v.code)}" style="cursor:pointer;color:inherit;text-decoration:underline dotted">${inner}</a>`
      : v.url
        ? `<a href="${esc(v.url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline dotted">${inner}</a>`
        : inner;
  /* échauffement : un bloc par jeu ou exercice libre, avec ses groupes et sa durée (fond vert) */
  const echItem = x => {
    const v = x.v;
    const img = v.schOn && schemaPlace() !== "page" && (v.img || v.imgJeu) ? `<div style="margin:4px 0 0 12px"><img src="${esc(v.img || v.imgJeu)}" alt="Schéma : ${esc(x.name)}" style="max-width:100%;max-height:200px;object-fit:contain" onerror="this.remove()"></div>` : "";
    const tete = x.same
      ? ""
      : `<b style="color:${C1}">▸</b> ${lk(v, `<b>${esc(x.name)}</b>`)}${v.code ? ` <span style="color:#6B7280;font-size:11px">(${esc(v.code)})</span>` : ""}${partHTML(v)}`;
    const corps = lines(v.desc).length
      ? `<div style="white-space:pre-line;${x.same ? "" : "margin-left:12px"}">${rt(v.desc)}</div>`
      : `<div style="margin-left:12px">${ph("[Décrire le déroulé : qui fait quoi, combien de temps]")}</div>`;
    const objx = v.obj ? `<div style="margin:0 0 2px"><b>Objectif :</b> ${rt(v.obj)}</div>` : "";
    return `<div style="margin:3px 0">${objx}${tete}${corps}${v.meta ? `<div style="margin-left:12px;color:#6B7280;font-size:11px;font-style:italic">${esc(v.meta)}</div>` : ""}${img}</div>`;
  };
  if (M.ech.on) {
    h += band(tgs(M, M.ce, M.all), "ÉCHAUFFEMENT", PAL.b.ech[0], PAL.b.ech[1]);
    M.echSubs.forEach((s, k) => {
      const who = whoHTML(M, s.idx);
      const uc = uniteCol(s);
      h += `<div style="background:${uc.bg};padding:4px 10px;font-size:12px;font-weight:700;color:${uc.fg};margin-top:2px">${tgs(M, s.d, s.idx)
        .map(
          x =>
            `<span style="display:inline-block;background:#fff;color:${x.c};border:1px solid ${x.c};padding:0 6px;margin-right:4px;min-width:26px;text-align:center">${x.t}</span>`
        )
        .join("")} &nbsp;${esc(echLabel(s, k) || "Échauffement")}${who}</div><div style="padding:4px 10px;font-size:12px;background:#fff">${s.views.map(echItem).join("") || `<div>${ph("▸ [Ajouter un jeu ou un exercice]")}</div>`}</div>`;
    });
  }
  h += band(tgs(M, M.c, M.all), "CORPS DE SÉANCE", PAL.b.corps[0], PAL.b.corps[1]);
  const th = (t, c, f) =>
    `<div style="background:${f};color:${c};font-weight:700;font-size:11px;padding:5px 10px;border-bottom:1px solid #D5DAE5">${t}</div>`;
  const schema = (SMETA.disc || DISC) === "prepa";
  const avecSchema = !schema;
  const PV = palVar();
  /* lead : titre de l'item, rangé avec la description dans la même cellule pour que les colonnes (+ / – / critères) démarrent à la hauteur du titre (le texte remonte en haut) */
  const exo = (x, n, lead) => {
    const v = x.v,
      L = lines;
    const nm = esc(x.name);
    const col = (t, c, sg, bg) =>
      `<div style="background:${bg};padding:6px 10px;border-bottom:1px solid #D5DAE5;font-size:12px">${
        L(t)
          .map(
            l => `<div style="margin-bottom:2px"><b style="color:${c}">${sg}</b> ${rt(l)}</div>`
          )
          .join("") || ph("—")
      }</div>`;
    const cr = L(v.crit);
    const objx = v.obj ? `<div style="margin:0 0 3px"><b>Objectif :</b> ${rt(v.obj)}</div>` : "";
    const first = objx + (x.same
      ? `<div style="margin:0 0 3px">${x.steps.map(l => `<div><b style="color:${C1}">▸</b> ${rt(l)}</div>`).join("")}</div>`
      : `<b style="color:${C1}">▸</b> ${lk(v, `<b>${x.n ? x.n + " " : ""}${nm}</b>`)}${v.code ? ` <span style="color:#6B7280;font-size:11px">(${esc(v.code)})</span>` : ""}${partHTML(v)}<div style="margin:2px 0;white-space:pre-line">${rt(v.desc)}</div>`);
    const desc = `<div style="padding:6px 10px;border-bottom:1px solid #D5DAE5;font-size:12px">${first}<div style="color:#6B7280;font-size:11px;font-style:italic">${x.same && v.code ? lk(v, `Fiche ${esc(v.code)} ↗`) + " · " : ""}${esc(v.meta)}</div>${avecSchema && v.schOn && schemaPlace() !== "page" && (v.img || v.imgJeu) ? `<div style="margin-top:6px;text-align:center"><img src="${esc(v.img || v.imgJeu)}" onerror="this.remove()" alt="Schéma : ${esc(x.name)}" style="max-width:100%;max-height:200px;object-fit:contain"></div>` : ""}</div>`;
    const cells = (schema ? "" : col(v.plus, PV.pT, "+", PV.pB)) +
      (schema ? "" : col(v.moins, PV.mT, "–", PV.mB)) +
      (schema
        ? `<div style="background:#fff;padding:6px;border-bottom:1px solid #D5DAE5;text-align:center">${v.img ? `<img src="${esc(v.img)}" alt="Schéma : ${esc(x.name)}" style="max-width:100%;max-height:260px;object-fit:contain;cursor:pointer" ${v.code ? `data-jeu="${esc(v.code)}"` : ""} onerror="this.remove()">` : ph("—")}</div>`
        : `<div style="background:${PV.cB};padding:6px 10px;border-bottom:1px solid #D5DAE5;font-size:12px">${cr.length ? cr.map(l => `<div><b style="color:${PV.cT}">✓</b> ${rt(l)}</div>`).join("") : ph("✓ [critère observable]") + "<br>" + ph("✓ [critère observable]")}</div>`);
    return lead && !schema ? `<div style="border-bottom:1px solid #D5DAE5">${lead}${desc.replace("border-bottom:1px solid #D5DAE5;", "")}</div>` + cells : (lead || "") + desc + cells;
  };
  if (M.subs.length) {
    let n = 0;
    h += `<div style="display:grid;grid-template-columns:${schema ? "1.6fr 1.4fr" : "3.2fr 1.2fr 1.2fr 1.3fr"};margin-top:8px"><div style="background:${PAL.th};color:#fff;font-weight:700;font-size:11px;padding:5px 10px">EXERCICE / DÉFI / JEU</div>${schema ? "" : th("PLUS DIFFICILE (+)", PV.pH[0], PV.pH[1])}${schema ? "" : th("PLUS FACILE (–)", PV.mH[0], PV.mH[1])}${schema ? th("SCHÉMA", "#2B5A9E", "#E3EEF8") : th("CRITÈRES DE RÉUSSITE", PV.cH[0], PV.cH[1])}`;
    M.subs.forEach((s, k) => {
      const who = whoHTML(M, s.idx);
      const uc = uniteCol(s);
      const ttl = `<div style="background:${uc.bg};padding:4px 10px;font-size:12px;font-weight:700;color:${uc.fg}">${tgs(
        M,
        s.d,
        s.idx
      )
        .map(
          x =>
            `<span style="display:inline-block;background:#fff;color:${x.c};border:1px solid ${x.c};padding:0 6px;margin-right:4px;min-width:26px;text-align:center">${x.t}</span>`
        )
        .join(
          ""
        )} &nbsp;${s.num}. ${esc(unitLabel(s, k))}${who}${s.views[0] && s.views[0].same ? partHTML(s.views[0].v) : ""}</div>`;
      if (!s.views.length) h += ttl;
      s.views.forEach((x, i) => {
        h += exo(x, n, i === 0 ? ttl + (schema ? `<div style="background:${PV.cB}"></div>` : "") : "");
      });
    });
    h += `</div>`;
  }
  const fb = (t, b, bg = "#F2F3F5") =>
    `<div style="background:${bg};padding:8px 12px;font-size:12px;border-left:3px solid #fff"><b style="font-size:11px">${t}</b><br>${b}</div>`;
  h += `<div style="display:grid;grid-template-columns:1.6fr 1.3fr 1.1fr 1.4fr;margin-top:12px">${fb("OBJECTIF COLLECTIF", S.objCol ? rt(S.objCol).replace(/\n/g, "<br>") : ph("[ce que le groupe doit réussir]"))}${fb("MATÉRIEL", M.mats.length ? M.mats.map(m => esc(capf(m.t))).join(" · ") : "Aucun matériel particulier.")}${fb("SÉCURITÉ", S.secu ? esc(S.secu).replace(/\n/g, "<br>") : ph("[rappels : hauteur, tapis, pas de saut…]"))}${fb("RETOUR AU CALME · " + RC_MIN + " min", M.G.map(g => `<b style="color:${g.c}">${esc(g.nom)} :</b> ${v(g.rc, "[étirements, bilan…]")}`).join("<br>"))}</div></div>`;
  /* schémas sur une page à part (réglage « Page à part ») */
  if (avecSchema && schemaPlace() === "page") {
    const LS = [...M.echSubs, ...M.subs]
      .flatMap(s2 => s2.views)
      .filter(x => x.v && x.v.schOn && (x.v.img || x.v.imgJeu));
    if (LS.length)
      h += `<div style="page-break-before:always;break-before:page;margin-top:14px"><div style="background:${PAL.th};color:#fff;text-align:center;font-weight:700;padding:6px">Schémas</div><div style="display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #D5DAE5">${LS.map(
        x =>
          `<div class="sch" style="border:1px solid #D5DAE5"><div style="background:#F4F6FA;font-size:11px;padding:3px 8px">${esc(x.name)}</div><div style="min-height:150px;display:flex;align-items:center;justify-content:center"><img src="${esc(x.v.img || x.v.imgJeu)}" alt="Schéma : ${esc(x.name)}" onerror="this.closest('.sch').remove()" style="max-width:100%;max-height:230px;object-fit:contain"></div></div>`
      ).join("")}</div></div>`;
  }
  return h + bilanFicheHTML();
}
