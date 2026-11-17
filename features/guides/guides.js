/* Guides : sécurité, organiser ses séances (initiation, séance type, compétences), équipes, glossaire, manuel */
const GUIDES = [
  ["secu", "Règles de sécurité", "⚠"],
  ["organiser", "Organiser ses séances", "▲"],
  ["equipes", "Former les équipes", "⚑"],
  ["gloss", "Glossaire", "Aa"],
  ["manuel", "Manuel d'utilisation", "?"],
];
const ORG = { tab: "initiation", on: false };
const ORG_TABS = [
  ["initiation", "Initiation au bloc"],
  ["seancetype", "Séance type"],
  ["comp", "Compétences travaillées"],
];
function gsec(t, lead, aideTxt) {
  if (ORG.on) return lead ? `<p class="lead">${lead}</p>` : "";
  return `<h2 class="pt">${t}${aideTxt ? " " + aide(aideTxt) : ""}</h2><p class="lead">${lead || ""}</p>`;
}
function organiserView(k) {
  if (k && ORG_TABS.some(t => t[0] === k)) ORG.tab = k;
  const t = ORG.tab;
  const head = `<h2 class="pt">Organiser ses séances</h2><p class="lead">Du plus simple au plus fin : démarrer avec des débutants, s'inspirer d'une séance type, puis choisir les jeux selon les compétences visées.</p>`;
  const tabs = `<div class="tools noprint"><div class="seg" role="tablist" style="flex-wrap:wrap;height:auto">${ORG_TABS.map(([c, l]) => `<button role="tab" aria-selected="${c === t}" data-org="${c}" class="${c === t ? "on" : ""}">${l}</button>`).join("")}</div></div>`;
  ORG.on = true;
  try {
    return head + tabs + guideView(t);
  } finally {
    ORG.on = false;
  }
}
registerClick(e => {
  const b = e.target.closest("[data-org]");
  if (!b) return;
  ORG.tab = b.dataset.org;
  render();
  return true;
});
function guideView(k) {
  if (k === "seances" || k === "cycle") k = "seancetype"; /* anciens liens */
  if (k === "materiel") k = "organiser";
  if (k === "organiser" || (!ORG.on && ORG_TABS.some(t => t[0] === k))) return organiserView(k === "organiser" ? "" : k);
  if (k === "secu")
    return (
      gsec(
        "Règles de sécurité",
        "Huit repères à rappeler avant de lancer un jeu. Ils complètent le règlement de la salle, qui reste prioritaire."
      ) +
      '<div class="g2">' +
      AX.SECU.map(
        ([t, x], i) =>
          `<div class="xc"><h4><span class="num">${String(i + 1).padStart(2, "0")}</span>${esc(t)}</h4><p>${esc(x)}</p></div>`
      ).join("") +
      `</div><div class="box" style="margin-top:16px"><b>Avant chaque jeu</b><ul><li>Annoncer la zone de jeu et ses limites.</li><li>Rappeler le signal d'arrêt.</li><li>Vérifier tapis, sols et zones de réception.</li><li>Faire une démonstration courte avant de lancer.</li></ul></div>`
    );
  if (k === "initiation") return iniView();
  if (k === "seancetype") return seanceTypeView();
  if (k === "comp")
    return (
      gsec(
        "Compétences travaillées",
        "Pour chaque compétence, les jeux qui la font travailler (les dominantes, pas une liste exhaustive)."
      ) +
      AX.COMP.filter(c => c[2].length || compteAdmin() || !!sessionStorage.getItem("admPw")).map(
        ([t, d, c]) =>
          `<div class="box"><b style="color:#86690F;font-size:17px">${esc(t)}</b><div style="font-size:14.5px;color:#6B7280;margin-bottom:6px">${esc(d)}</div>${c.length ? lks(c) : '<div style="font-size:14px;color:#8A93A5">Aucun jeu pour le moment — cochez cette compétence dans la fiche d\'un jeu.</div>'}</div>`
      ).join("")
    );
  if (k === "equipes")
    return (
      gsec(
        "Former les équipes",
        "Six façons rapides de répartir un groupe, à choisir selon l'âge et l'ambiance."
      ) +
      '<div class="g2">' +
      AX.EQUIPES.map(
        ([t, x], i) =>
          `<div class="xc"><h4><span class="num">${i + 1}</span>${esc(t)}</h4><p>${esc(x)}</p></div>`
      ).join("") +
      `</div><div class="box" style="margin-top:16px"><b>Pour équilibrer</b><ul>${AX.EQ_RULES.map(r => `<li>${esc(r)}</li>`).join("")}</ul></div><div class="box"><b>Quelle taille d'équipe pour quel jeu</b><table class="tl" style="margin-top:8px">${AX.EQ_SIZES.map(([a, b]) => `<tr><td style="white-space:normal">${esc(a)}</td><td>${b.split(" · ").map(codeLk).join(" ")}</td></tr>`).join("")}</table></div>`
    );
  if (k === "gloss") return glossaireView();
  if (k === "manuel") return manuelView();
  return '<div class="empty">Page introuvable.</div>';
}
registerNav({
  sec: "GUIDES",
  secOrder: 40,
  order: 0,
  html: () =>
    DISC === "prepa"
      ? GUIDES.filter(g => g[0] === "gloss" || g[0] === "manuel")
          .map(([k, l, i]) => navBtn("g/" + k, l, `<span class="ic">${i}</span>`))
          .join("")
      : GUIDES.map(([k, l, i]) => navBtn("g/" + k, l, `<span class="ic">${i}</span>`)).join(""),
});
registerView({ match: v => v.startsWith("g/"), html: v => guideView(v.slice(2)) });
