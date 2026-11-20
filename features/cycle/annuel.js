/* Planning annuel : vue d'ensemble de tous les cycles d'un même macro-cycle (frise par semaine).
   Chaque cycle porte un champ « Macro-cycle » (ex. Saison 2026-2027) et son planning (CY.plan : début, nombre de semaines, pauses). */
const AN = { lance: {}, echec: {} };
const AN_W = 26; /* largeur d'une semaine, en px */
const AN_COUL = ["#2B5A9E", "#2E7D4F", "#B26A00", "#8A55B5", "#B2263A", "#00838F", "#6B7A1F", "#C2185B"];
const anMacros = () => {
  const s = new Set();
  cyAll().forEach(x => {
    const c = cyData(x.rec);
    if (c && c.macro) s.add(c.macro);
  });
  if (typeof CY !== "undefined" && CY && CY.macro) s.add(CY.macro);
  return [...s];
};
function anTemps(rec) {
  const c = cyData(rec);
  if (!c) return null;
  const p = c.plan;
  return { c, macro: (c.macro || "").trim(), debut: p && p.debut ? cpLundi(p.debut) : "", nb: p && +p.nb > 0 ? +p.nb : 0, pauses: p && Array.isArray(p.sem) ? p.sem.map(s => !!(s && s.pause)) : [] };
}
function anFrise(L) {
  const avec = L.filter(x => x.debut && x.nb);
  if (!avec.length) return "";
  const d0 = avec.map(x => x.debut).sort()[0];
  const fin = avec.map(x => cpAdd(x.debut, x.nb * 7)).sort().pop();
  const nbS = Math.round((cpD(fin) - cpD(d0)) / (7 * 864e5));
  /* en-tête des mois */
  const mois = [];
  for (let i = 0; i < nbS; i++) {
    const d = cpD(cpAdd(d0, i * 7));
    const k = d.getUTCFullYear() * 12 + d.getUTCMonth();
    const lib = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit", timeZone: "UTC" });
    if (mois.length && mois[mois.length - 1].k === k) mois[mois.length - 1].n++;
    else mois.push({ k, lib, n: 1 });
  }
  const aujourd = cpLundi(cpISO(new Date()));
  const pos = Math.round((cpD(aujourd) - cpD(d0)) / (7 * 864e5));
  const marque = pos >= 0 && pos < nbS ? `<div style="position:absolute;left:${pos * AN_W}px;top:0;bottom:0;width:${AN_W}px;background:rgba(178,38,58,.10);border-left:2px solid #B2263A;pointer-events:none" title="Cette semaine"></div>` : "";
  const head = `<div style="display:flex">${mois.map(m => `<div style="width:${m.n * AN_W}px;box-sizing:border-box;border-left:1px solid #D5DAE5;font-size:11px;font-weight:700;color:#26364D;padding:2px 4px;white-space:nowrap;overflow:hidden">${esc(m.lib)}</div>`).join("")}</div>`;
  const lignes = avec
    .sort((a, b) => a.debut.localeCompare(b.debut))
    .map((x, i) => {
      const col = AN_COUL[i % AN_COUL.length];
      const o = Math.round((cpD(x.debut) - cpD(d0)) / (7 * 864e5));
      const pauses = x.pauses.map((p, k) => (p && k < x.nb ? `<span style="position:absolute;left:${k * AN_W}px;top:0;bottom:0;width:${AN_W}px;background:repeating-linear-gradient(45deg,rgba(255,255,255,.55) 0 4px,transparent 4px 8px)" title="Pause"></span>` : "")).join("");
      const per = `${cpFmt(x.debut)} → ${cpFmt(cpAdd(x.debut, x.nb * 7 - 3))}`;
      return `<div style="position:relative;height:32px;margin:3px 0"><a data-go="cy/${esc(x.id)}" title="${esc(x.titre)} — ${x.nb} semaine${x.nb > 1 ? "s" : ""} (${esc(per)})" style="position:absolute;left:${o * AN_W}px;width:${x.nb * AN_W - 2}px;top:0;height:30px;background:${col};color:#fff;border-radius:6px;overflow:hidden;cursor:pointer;display:flex;align-items:center;padding:0 8px;font-size:12px;font-weight:700;white-space:nowrap;box-sizing:border-box">${pauses}<span style="position:relative">${esc(x.titre)}</span></a></div>`;
    })
    .join("");
  /* graduation des semaines */
  const grad = Array.from({ length: nbS }, (_, i) => `<div style="width:${AN_W}px;box-sizing:border-box;border-left:1px solid #EEF1F6;font-size:9px;color:#9AA3B5;text-align:center">${cpD(cpAdd(d0, i * 7)).getUTCDate()}</div>`).join("");
  return `<div style="overflow-x:auto;padding-bottom:6px"><div style="position:relative;width:${nbS * AN_W}px">${marque}${head}<div style="display:flex">${grad}</div>${lignes}</div></div>`;
}
function annuelView() {
  const back = `<div class="tools noprint"><a class="chip" data-bgo="cycles" style="cursor:pointer">← Bibliothèque</a><a class="chip" onclick="window.print()" style="cursor:pointer">🖨 Imprimer</a></div>`;
  if (compteOn() && !AUTH.user) return compteInvite("pour voir vos cycles");
  const L0 = cyAll().filter(x => cyPrepa(x.rec) === (DISC === "prepa"));
  let attente = 0;
  L0.forEach(x => {
    const id = x.rec.id;
    if (!x.rec.data && !AN.echec[id]) {
      attente++;
      if (!AN.lance[id]) {
        AN.lance[id] = 1;
        sbCharger(id)
          .then(() => VIEW === "annuel" && render())
          .catch(() => {
            AN.echec[id] = 1;
            VIEW === "annuel" && render();
          });
      }
    }
  });
  const T = L0.map(x => {
    const t = anTemps(x.rec);
    return t && { id: x.rec.id, titre: x.rec.titre || t.c.titre || "Cycle", ...t };
  }).filter(Boolean);
  const groupes = {};
  T.forEach(x => (groupes[x.macro || ""] = groupes[x.macro || ""] || []).push(x));
  const noms = Object.keys(groupes).sort((a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "fr")));
  const blocs = noms
    .map(n => {
      const L = groupes[n];
      const sans = L.filter(x => !(x.debut && x.nb));
      const nbSem = L.reduce((s, x) => s + x.nb, 0);
      return `<div class="box"><div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap"><b style="font-size:17px;flex:1">${n ? "🗓 " + esc(n) : "Cycles sans macro-cycle"}</b><span style="color:#6B7280;font-size:13px">${L.length} cycle${L.length > 1 ? "s" : ""}${nbSem ? " · " + nbSem + " semaines au total" : ""}</span></div>
      ${anFrise(L) || '<p style="color:#6B7280">Aucun de ces cycles n\'a encore de planning (date de début et nombre de semaines).</p>'}
      ${sans.length ? `<p style="color:#6B7280;font-size:13px;margin:6px 0 0">Sans planning : ${sans.map(x => `<a data-go="cy/${esc(x.id)}" style="cursor:pointer;text-decoration:underline">${esc(x.titre)}</a>`).join(", ")}</p>` : ""}</div>`;
    })
    .join("");
  return `${back}<h2 style="margin:6px 0">Planning annuel</h2><p style="color:#6B7280;margin:0 0 8px">Tous tes cycles sur une frise par semaine, regroupés par macro-cycle. Clique sur un cycle pour l'ouvrir. Le macro-cycle se renseigne dans « Créer un cycle » (champ <i>Macro-cycle</i>). Les rayures = semaines de pause, la bande rouge = cette semaine.</p>${attente ? `<p class="noprint" style="color:#6B7280">Chargement de ${attente} cycle${attente > 1 ? "s" : ""}…</p>` : ""}${blocs || '<div class="box">Aucun cycle enregistré pour l\'instant.</div>'}`;
}
registerView({ match: v => v === "annuel", html: () => annuelView() });

/* Rappel dans la fiche d'une séance : dans quel cycle et quelle semaine elle est liée, avec l'objectif de la semaine.
   Les cycles pas encore chargés sont lus une fois (en arrière-plan) puis la page se met à jour. */
function cpRappelSeance(sid) {
  if (typeof compteOn !== "function" || (compteOn() && !AUTH.user)) return "";
  const out = [];
  cyAll().forEach(x => {
    const id = x.rec.id;
    if (!x.rec.data) {
      if (!AN.echec[id] && !AN.lance[id]) {
        AN.lance[id] = 1;
        sbCharger(id)
          .then(() => typeof VIEW !== "undefined" && VIEW.startsWith("sb/") && render())
          .catch(() => (AN.echec[id] = 1));
      }
      return;
    }
    const c = cyData(x.rec);
    if (!c) return;
    const titre = x.rec.titre || c.titre || "Cycle";
    const p = c.plan;
    if (p && p.debut && Array.isArray(p.sem)) {
      p.sem.forEach((s, w) => {
        if (!s) return;
        const lies = [];
        let direct = false;
        Object.keys(s.sid || {}).forEach(k => {
          if ((s.sid[k] || []).includes(sid)) direct = true;
        });
        Object.keys(s.cases || {}).forEach(k =>
          (s.cases[k] || []).forEach(it => {
            if ((it.sid || []).includes(sid)) lies.push(it.t);
            else if (direct) lies.push(it.t);
          })
        );
        if (!direct && !lies.length) return;
        const d0 = cpAdd(cpLundi(p.debut), w * 7);
        out.push({ id, titre, sem: w + 1, dates: cpFmt(d0) + " → " + cpFmt(cpAdd(d0, 6)), micro: s.micro || "", obj: [...new Set(lies.filter(Boolean))], general: c.objectif || "" });
      });
    } else if ((c.lignes || []).some(l => l.sid === sid)) {
      const i = c.lignes.findIndex(l => l.sid === sid);
      out.push({ id, titre, sem: 0, n: i + 1, dates: c.lignes[i].dates || "", micro: "", obj: c.lignes[i].objectif ? [c.lignes[i].objectif] : [], general: c.objectif || "" });
    }
  });
  return out
    .map(
      o =>
        `<div class="box noprint" style="border-left:6px solid #2B5A9E;padding:8px 14px"><div>📅 Cette séance fait partie du cycle <a data-go="cy/${esc(o.id)}" style="cursor:pointer;text-decoration:underline"><b>${esc(o.titre)}</b></a> · ${o.sem ? "semaine " + o.sem + " (" + esc(o.dates) + ")" : "séance n° " + o.n + (o.dates ? " (" + esc(o.dates) + ")" : "")}${o.micro ? ` · <i>${esc(o.micro)}</i>` : ""}</div>${o.obj.length ? `<div style="margin-top:4px"><b>Objectif de la semaine :</b> ${o.obj.map(esc).join(" · ")}</div>` : ""}${o.general ? `<div style="color:#6B7280;font-size:13px;margin-top:2px">Objectif du cycle : ${esc(o.general)}</div>` : ""}</div>`
    )
    .join("");
}
