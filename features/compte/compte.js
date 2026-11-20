/* Comptes : connexion avec Google (séances et cycles seulement ; les jeux restent publics).
   Actif seulement si GOOGLE_CLIENT_ID et GAME_ADD_URL sont renseignés dans config.js. */
const AUTH = { session: "", user: null };
const COMPTE_LS = "compteSession";
/* adresse Gmail uniquement ; manquant → champ surligné en rouge (.req-err) */
const estGmail = e => /^[^\s@]+@(gmail|googlemail)\.com$/i.test(String(e).trim());
const rougir = (el, on) => { if (el) { el.classList.toggle("req-err", on !== false); if (on !== false) el.focus(); } };
const estAdresse = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e).trim());
const mauvaisesAdresses = l => l.filter(x => !estAdresse(x)); /* format invalide : bloquant */
const horsGmail = l => l.filter(x => estAdresse(x) && !estGmail(x)); /* valide mais pas Gmail : simple avertissement */
const avertGmail = l => { const h = horsGmail(l); return h.length ? " ⚠ " + h.join(", ") + " : pas une adresse Gmail, la personne doit avoir un compte Google avec cette adresse." : ""; };
const compteOn = () => !!(CONFIG.GOOGLE_CLIENT_ID && CONFIG.GAME_ADD_URL);
try {
  const s = JSON.parse(localStorage.getItem(COMPTE_LS) || "null");
  if (s && s.session && s.user) {
    AUTH.session = s.session;
    AUTH.user = s.user;
  }
} catch (e) {}
/* « voir comme » (administrateur) : on prend l'identité d'un autre utilisateur, en lecture seule */
AUTH.reel = null;
try {
  const c = sessionStorage.getItem("compteComme");
  if (c && AUTH.user && AUTH.user.admin) {
    AUTH.reel = AUTH.user;
    AUTH.user = { email: c, nom: c, admin: false, comme: true };
  }
} catch (e) {}
const compteAdmin = () => !!(AUTH.reel || AUTH.user || {}).admin;
function compteVoirComme(email) {
  try {
    if (email) sessionStorage.setItem("compteComme", String(email).trim().toLowerCase());
    else sessionStorage.removeItem("compteComme");
  } catch (e) {}
  location.hash = "#/biblio";
  location.reload();
}
/* suffixe des clés du navigateur : une personne ne voit pas les copies locales d'une autre */
const compteSuffixe = () => (compteOn() && AUTH.user ? ":" + AUTH.user.email : "");
/* séance ou cycle à moi ? (sans comptes : toujours) */
const compteMien = r => {
  /* séances modèles de la prépa : seul l'administrateur peut les modifier ou les supprimer */
  if (/^(cy)?mod-/.test(String(r.id))) {
    try {
      return (compteOn() && AUTH.user && !!AUTH.user.admin) || (typeof compteAdmin === "function" && compteAdmin()) || !!sessionStorage.getItem("admPw");
    } catch (e) {
      return false;
    }
  }
  return !compteOn() || !AUTH.user || AUTH.user.admin || !r.owner || r.owner === AUTH.user.email;
};
function compteExpiree() {
  if (typeof offVider === "function") offVider();
  AUTH.session = "";
  AUTH.user = null;
  try {
    localStorage.removeItem(COMPTE_LS);
  } catch (e) {}
}
/* envoi au serveur avec la session ; renvoie la réponse (exception si refusée) */
async function comptePost(action, extra) {
  const r = await fetch(CONFIG.GAME_ADD_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action,
      session: AUTH.session,
      ...(AUTH.reel ? { comme: AUTH.user.email } : {}),
      ...extra,
    }),
  });
  const j = await r.json();
  if (!j.ok) {
    if (j.code === "auth") {
      compteExpiree();
      throw new Error("session expirée : reconnectez-vous");
    }
    throw new Error(j.error || "refusé");
  }
  return j;
}
/* envoi d'une action « séance » : avec compte (session) ou, sans comptes, avec la clé du site */
async function serveurSeance(action, extra) {
  if (compteOn()) return comptePost(action, extra);
  const r = await fetch(CONFIG.GAME_ADD_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ key: CONFIG.GAME_ADD_KEY || "", action, ...extra }),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "refusé");
  return j;
}
/* true si l'utilisateur doit d'abord se connecter (et le renvoie vers la page de connexion) */
function compteRequis() {
  if (!compteOn() || AUTH.user) return false;
  toast("Connectez-vous avec Google pour enregistrer.");
  go("compte");
  return true;
}
function gsiCharger() {
  return new Promise((ok, ko) => {
    if (window.google && google.accounts && google.accounts.id) return ok();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => ko(new Error("Google indisponible"));
    document.head.appendChild(s);
  });
}
async function compteBoutonGoogle() {
  const zone = $("#gsiBtn");
  if (!zone || AUTH.user) return;
  try {
    await gsiCharger();
    google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: async resp => {
        const m = $("#compteMsg");
        if (m) m.textContent = "Connexion…";
        try {
          const r = await fetch(CONFIG.GAME_ADD_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "auth", credential: resp.credential }),
          });
          const j = await r.json();
          if (!j.ok) throw new Error(j.error || "refusé");
          localStorage.setItem(COMPTE_LS, JSON.stringify({ session: j.session, user: j.user }));
          location.reload();
        } catch (e) {
          if (m) m.textContent = "Échec de la connexion : " + e.message;
        }
      },
    });
    google.accounts.id.renderButton(zone, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      locale: "fr",
    });
  } catch (e) {
    zone.textContent = "Impossible de charger la connexion Google (" + e.message + ").";
  }
}
function compteView() {
  const head = gsec(
    "Mon compte",
    "Le compte sert à enregistrer vos séances et vos cycles et à les partager. Les jeux restent accessibles à tous.",
    "Connectez-vous avec votre compte Google : aucun mot de passe à créer. Vos séances sont privées tant que vous ne les partagez pas."
  );
  if (!compteOn())
    return head + `<div class="box">Les comptes ne sont pas activés sur ce site.</div>`;
  if (AUTH.user)
    return (
      head +
      `<div class="box"><b>${esc(AUTH.user.nom)}</b><div style="color:#6B7280">${esc(AUTH.user.email)}${AUTH.user.admin ? " · administrateur" : ""}</div><div style="margin:6px 0"><a class="chip" data-pseudo="1" style="cursor:pointer">✎ ${AUTH.user.pseudo ? "Changer mon pseudo" : "Choisir un pseudo"}</a></div><p style="margin:10px 0">Vos séances et vos cycles sont enregistrés sur votre compte : vous seul les voyez, sauf si vous les partagez (bouton « Partager » sur une séance ou un cycle).</p><a class="btn" data-compte="logout" style="background:#fff;color:#B2263A;border:1px solid #E8B4BC;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer;display:inline-block">Se déconnecter</a></div>`
    );
  return (
    head +
    `<div class="box" style="max-width:520px"><p style="margin-top:0">Connectez-vous avec votre compte Google pour enregistrer et retrouver vos séances et vos cycles, ou pour voir ceux qu'on a partagés avec vous.</p><div id="gsiBtn" style="min-height:44px"></div><p id="compteMsg" style="font-weight:700;color:#B2263A;margin:8px 0 0"></p><p style="color:#6B7280;font-size:13px;margin-bottom:0">Seuls votre nom et votre adresse e-mail Google sont conservés (aucun mot de passe).</p></div>`
  );
}
/* invitation à se connecter, à placer là où un compte est nécessaire */
const compteInvite = (t = "pour voir et enregistrer vos séances et vos cycles") =>
  `<div class="box" style="border-left:6px solid #3A8FB0"><b>Connexion requise</b> ${esc(t)}.<div style="margin-top:10px"><a class="btn" data-go="compte" style="background:#26364D;color:#fff;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer;display:inline-block">Se connecter avec Google</a></div></div>`;
registerNav({
  sec: "MON COMPTE",
  secOrder: 8,
  order: 1,
  html: () =>
    compteOn()
      ? navBtn(
          "compte",
          AUTH.user ? esc(AUTH.user.nom) : "Se connecter",
          '<span class="ic">👤</span>'
        )
      : "",
});
registerView({
  match: v => v === "compte",
  html: () => compteView(),
  bind: () => compteBoutonGoogle(),
});
registerClick(e => {
  const b = e.target.closest("[data-compte]");
  if (!b) return;
  if (b.dataset.compte === "logout") {
    compteExpiree();
    location.hash = "#/compte";
    location.reload();
  }
  return true;
});

/* phrase à ajouter au message de confirmation quand des invitations ont été envoyées */
let INV_LAST = null;
/* e-mail d'invitation prérempli, à envoyer depuis SA propre messagerie */
function invitPanneau(m) {
  INV_LAST = m;
  const bcc = encodeURIComponent(m.adresses.join(","));
  const su = encodeURIComponent(m.sujet),
    corps = encodeURIComponent(m.corps);
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${bcc}&su=${su}&body=${corps}`;
  const mailto = `mailto:?bcc=${bcc}&subject=${su}&body=${corps}`;
  const btn = "border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer;display:inline-block;text-decoration:none";
  modal(
    "Prévenir les personnes invitées",
    `<p style="margin-top:0">L'équipe est enregistrée. Pour que le message parte <b>de votre messagerie</b>, ouvrez-le ci-dessous puis cliquez sur « Envoyer ».</p>
    <div class="tools"><a class="btn" href="${gmail}" target="_blank" rel="noopener" style="background:#26364D;color:#fff;${btn}">✉ Ouvrir dans Gmail</a><a class="btn" href="${mailto}" style="background:#EEF1F8;color:#26364D;${btn}">Autre messagerie</a><a class="btn" data-inv="copy" role="button" tabindex="0" style="background:#EEF1F8;color:#26364D;${btn}">Copier le message</a><span id="invMsg" style="color:#2E7D4F;font-weight:700"></span></div>
    <p style="margin:12px 0 4px"><b>Destinataires (en copie cachée)</b> : ${m.adresses.map(esc).join(", ")}</p>
    <p style="margin:4px 0"><b>Objet</b> : ${esc(m.sujet)}</p>
    <pre style="white-space:pre-wrap;font:inherit;background:#F7F9FD;border:1px solid #E3E8F2;border-radius:8px;padding:10px 12px;margin:6px 0 0">${esc(m.corps).replace(/https?:\/\/[^\s<]*[^\s<.,;:!?)»]/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`)}</pre>`,
    640
  );
}
registerClick(e => {
  const b = e.target.closest('[data-inv="copy"]');
  if (!b || !INV_LAST) return;
  const t = `À : ${INV_LAST.adresses.join(", ")}\nObjet : ${INV_LAST.sujet}\n\n${INV_LAST.corps}`;
  const ok = () => {
    const x = document.getElementById("invMsg");
    if (x) x.textContent = "✓ Copié";
  };
  try {
    navigator.clipboard.writeText(t).then(ok, ok);
  } catch (err) {}
  return true;
});
function compteInfoMails(m) {
  if (m && m.etat === "perso" && m.adresses && m.adresses.length) {
    setTimeout(() => invitPanneau(m), 50);
    return "";
  }
  if (!m || !m.envoyes) return "";
  return (
    " " +
    m.envoyes +
    " invitation" +
    (m.envoyes > 1 ? "s" : "") +
    " envoyée" +
    (m.envoyes > 1 ? "s" : "") +
    " par e-mail."
  );
}
/* ---------- équipes ---------- */
let EQUIPES = [];
async function loadEquipes() {
  EQUIPES = [];
  if (!compteOn() || !AUTH.session) return;
  try {
    EQUIPES = (await comptePost("equipes_liste")).equipes;
  } catch (e) {
    EQUIPES = [];
  }
}
registerLoader(loadEquipes);
const equipeNom = id => (EQUIPES.find(q => q.id === id) || {}).nom || "équipe";
function equipesView() {
  const head = gsec(
    "Mes équipes",
    "Une équipe est un groupe de personnes (adresses Google). Partager une séance avec l'équipe la rend lisible par tous ses membres.",
    "<b>Comment faire ?</b><br>Créez une équipe, ajoutez les adresses Google de ses membres (✕ pour en retirer un). Ensuite, dans une séance ou un cycle, choisissez « Partager » puis cette équipe."
  );
  if (!AUTH.user) return head + compteInvite("pour gérer vos équipes");
  const mes = EQUIPES.filter(q => q.owner === AUTH.user.email);
  const autres = EQUIPES.filter(q => q.owner !== AUTH.user.email);
  const carte = q =>
    `<div class="box"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b style="flex:1">👥 ${esc(q.nom)}</b><span style="color:#6B7280;font-size:13px">${q.membres.length} membre${q.membres.length > 1 ? "s" : ""} + vous</span></div>
    <label class="sml" style="margin-top:8px">Nom de l'équipe<input data-eqf="nom" data-id="${esc(q.id)}" value="${esc(q.nom)}"></label>
    <label class="sml" style="margin-top:8px">Description (facultative)<textarea rows="2" maxlength="500" data-eqf="description" data-id="${esc(q.id)}" placeholder="À quoi sert cette équipe ?">${esc(q.description || "")}</textarea></label>
    <div style="margin-top:10px"><b style="font-size:14px">Membres</b>
      ${q.membres.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">${q.membres.map(m => `<span class="chip" style="cursor:default;display:inline-flex;gap:8px;align-items:center">${esc(m)}<a data-eq="rm" data-id="${esc(q.id)}" data-m="${esc(m)}" title="Retirer de l'équipe" style="cursor:pointer;color:#B2263A;font-weight:700">✕</a></span>`).join("")}</div>` : '<p class="hint" style="margin:6px 0">Aucun membre pour le moment.</p>'}
      <div class="tools" style="margin:6px 0 0"><input data-eqf="ajout" data-id="${esc(q.id)}" placeholder="Ajouter une adresse Google (ou plusieurs, séparées par des espaces)" style="flex:1;min-width:220px;font:inherit;padding:8px 10px;border:1px solid #d5dae5;border-radius:8px"><a class="chip" data-eq="add" data-id="${esc(q.id)}" style="cursor:pointer">＋ Ajouter</a></div></div>
    <div class="tools" style="margin-top:10px"><a class="btn" data-eq="save" data-id="${esc(q.id)}" style="background:#2E7D4F;color:#fff;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;display:inline-block">Enregistrer le nom et la description</a>
      ${q.membres.length ? `<span style="display:inline-flex;gap:6px;align-items:center;font-size:13px">Transférer la responsabilité à <select data-eqf="proprio" data-id="${esc(q.id)}">${q.membres.map(m => `<option>${esc(m)}</option>`).join("")}</select><a class="chip" data-eq="owner" data-id="${esc(q.id)}" style="cursor:pointer" title="Le membre doit s'être déjà connecté au site">OK</a></span>` : ""}
      <a class="btn" data-eq="del" data-id="${esc(q.id)}" style="background:#fff;color:#B2263A;border:1px solid #B2263A;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;display:inline-block;margin-left:auto">Supprimer l'équipe</a></div></div>`;
  const autre = q =>
    `<div class="box" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b style="flex:1">👥 ${esc(q.nom)}${q.description ? `<span style="display:block;font-weight:400;color:#6B7280;font-size:13px">${esc(q.description)}</span>` : ""}</b><span style="color:#6B7280;font-size:13px">responsable : ${esc(q.ownerNom || q.owner)} · ${q.membres.length + 1} personnes</span><a class="chip" data-eq="quit" data-id="${esc(q.id)}" style="cursor:pointer">Quitter</a></div>`;
  return `${head}<div class="box" style="background:#F7F9FD"><b>Créer une équipe</b><label class="sml" style="margin-top:8px">Nom<input id="eqNouveau" placeholder="Ex. Équipe Bloc Party"></label><div class="tools" style="margin-top:8px"><a class="btn" data-eq="new" style="background:#26364D;color:#fff;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;display:inline-block">+ Créer</a><span id="eqMsg" style="font-weight:700;color:#B2263A"></span></div></div>
  ${mes.length ? `<p class="count">Équipes dont vous êtes responsable</p>${mes.map(carte).join("")}` : ""}
  ${autres.length ? `<p class="count">Équipes dont vous êtes membre</p>${autres.map(autre).join("")}` : ""}
  ${!EQUIPES.length ? '<div class="empty">Aucune équipe pour le moment.</div>' : ""}`;
}
registerNav({
  sec: "MON COMPTE",
  secOrder: 8,
  order: 2,
  html: () =>
    compteOn() && AUTH.user
      ? navBtn(
          "equipes",
          `Mes équipes<span class="n">${EQUIPES.length || ""}</span>`,
          '<span class="ic">👥</span>'
        )
      : "",
});
registerView({ match: v => v === "equipes", html: () => equipesView() });
registerClick(e => {
  const b = e.target.closest("[data-eq]");
  if (!b) return;
  const id = b.dataset.id,
    a = b.dataset.eq;
  const rafraichir = async msg => {
    await loadEquipes();
    buildNav();
    render();
    if (msg) toast(msg);
  };
  const echec = err => toast("Échec : " + err.message);
  if (a === "new") {
    const nom = ($("#eqNouveau").value || "").trim();
    if (!nom) {
      rougir($("#eqNouveau"));
      $("#eqMsg").textContent = "Donnez un nom à l'équipe.";
      return true;
    }
    comptePost("equipe_enregistrer", { equipe: { nom, membres: [] } })
      .then(() => rafraichir("✓ Équipe créée : ajoutez ses membres."))
      .catch(echec);
  } else if (a === "save" || a === "add" || a === "rm" || a === "owner") {
    const q = EQUIPES.find(z => z.id === id);
    if (!q) return true;
    const val = f => (document.querySelector(`[data-eqf=${f}][data-id="${id}"]`) || {}).value || "";
    const eq = { id, nom: val("nom") || q.nom, description: val("description"), membres: q.membres.slice() };
    let msg = "✓ Équipe enregistrée.";
    if (a === "add") {
      const nouv = val("ajout").split(/[\s,;]+/).filter(Boolean);
      if (!nouv.length) return true;
      if (mauvaisesAdresses(nouv).length) {
        rougir(document.querySelector(`[data-eqf=ajout][data-id="${id}"]`));
        toast("Adresse invalide : " + mauvaisesAdresses(nouv).join(", "));
        return true;
      }
      eq.membres = eq.membres.concat(nouv);
      msg = "✓ Membre(s) ajouté(s)." + avertGmail(nouv);
    } else if (a === "rm") {
      if (!confirm("Retirer " + b.dataset.m + " de l'équipe ?")) return true;
      eq.membres = eq.membres.filter(m => m !== b.dataset.m);
      msg = "Membre retiré.";
    } else if (a === "owner") {
      const m = val("proprio");
      if (!m) return true;
      if (!confirm("Transférer la responsabilité de l'équipe à " + m + " ? Vous resterez membre, mais vous ne pourrez plus la modifier.")) return true;
      eq.proprietaire = m;
      msg = "✓ Responsabilité transférée à " + m + ".";
    }
    comptePost("equipe_enregistrer", { equipe: eq })
      .then(j => rafraichir(msg + compteInfoMails(j.emails)))
      .catch(echec);
  } else if (a === "del") {
    if (
      !confirm(
        "Supprimer cette équipe ? Les séances partagées avec elle ne seront plus visibles de ses membres."
      )
    )
      return true;
    comptePost("equipe_suppr", { id })
      .then(() => rafraichir("Équipe supprimée."))
      .catch(echec);
  } else if (a === "quit") {
    if (!confirm("Quitter cette équipe ?")) return true;
    comptePost("equipe_quitter", { id })
      .then(() => rafraichir("Vous avez quitté l'équipe."))
      .catch(echec);
  }
  return true;
});
/* ---------- partage d'une séance ou d'un cycle (par personne ou par équipe) ---------- */
let PARTAGE_OUVERT = null;
const partageListe = r =>
  String(r.partage || "")
    .split(/[,;\s]+/)
    .filter(Boolean);
function partageBlocPanneau(r) {
  if (!compteOn() || !r) return "";
  if (!compteMien(r))
    return `<div class="box noprint" style="border-left:6px solid #8A55B5;padding:8px 14px">Partagé avec vous par <b>${esc(r.ownerNom || r.owner)}</b> ${r.owner && r.ownerNom ? `<span style="color:#6B7280">(${esc(r.owner)})</span>` : ""} · lecture seule : « Utiliser comme modèle » crée votre propre copie.</div>`;
  const L = partageListe(r),
    pers = L.filter(x => !x.startsWith("team:")),
    eqs = L.filter(x => x.startsWith("team:")).map(x => x.slice(5));
  const ouvert = PARTAGE_OUVERT === r.id;
  const resume = [...eqs.map(i => "👥 " + equipeNom(i)), ...pers];
  return `<div class="box noprint" style="padding:8px 14px"><a class="chip" data-partage="toggle" data-id="${esc(r.id)}" style="cursor:pointer">👥 Partager${L.length ? " (" + L.length + ")" : ""}</a> <span style="color:#6B7280;font-size:13px">${L.length ? "Partagé avec : " + esc(resume.join(", ")) : "Privé : vous seul la voyez."}</span>${
    ouvert
      ? `<div style="margin-top:8px">${
          EQUIPES.length
            ? `<div class="sml">Équipes<div class="gchk">${EQUIPES.map(q => `<label class="fl"><input type="checkbox" data-pteam="${esc(q.id)}" ${eqs.includes(q.id) ? "checked" : ""}> ${esc(q.nom)}</label>`).join("")}</div></div>`
            : `<p style="color:#6B7280;font-size:13px;margin:0 0 6px">Pas encore d'équipe : créez-en dans « Mes équipes » pour partager avec plusieurs personnes d'un coup.</p>`
        }<label class="sml" style="margin-top:8px">Personnes (adresses Google, une par ligne)<textarea id="partageTxt" rows="4" placeholder="prenom.nom@gmail.com">${esc(pers.join("\n"))}</textarea></label><div class="tools" style="margin-top:8px"><a class="btn" data-partage="save" data-id="${esc(r.id)}" style="background:#2E7D4F;color:#fff;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;display:inline-block">Enregistrer le partage</a><span id="partageMsg" style="font-weight:700"></span></div><p style="color:#6B7280;font-size:13px;margin:6px 0 0">Ils pourront la lire (pas la modifier) après s'être connectés avec leur adresse Google. Aucun message n'est envoyé : utilise « 📨 Envoyer » pour les prévenir. La séance doit d'abord être enregistrée dans la bibliothèque.</p></div>`
      : ""
  }</div>`;
}
function partageBloc(r, simple) {
  if (!compteOn() || !r) return "";
  if (!simple) return partageBlocPanneau(r);
  if (!compteMien(r))
    return `<div class="box noprint" style="border-left:6px solid #8A55B5;padding:8px 14px">Partagé avec vous par <b>${esc(r.ownerNom || r.owner)}</b> ${r.owner && r.ownerNom ? `<span style="color:#6B7280">(${esc(r.owner)})</span>` : ""} · lecture seule : « Utiliser comme modèle » crée votre propre copie.</div>`;
  const L = partageListe(r),
    pers = L.filter(x => !x.startsWith("team:")),
    eqs = L.filter(x => x.startsWith("team:")).map(x => x.slice(5));
  const resume = [...eqs.map(i => "👥 " + equipeNom(i)), ...pers];
  return `<div class="box noprint" style="padding:8px 14px;color:#6B7280;font-size:13px">${L.length ? "👥 Partagée avec : <b>" + esc(resume.join(", ")) + "</b>" : "🔒 Privée : toi seul(e) la vois."} <span>· bouton « 🔗 Partager » pour modifier.</span></div>`;
}
registerClick(e => {
  const b = e.target.closest("[data-partage]");
  if (!b) return;
  const id = b.dataset.id;
  if (b.dataset.partage === "toggle") {
    PARTAGE_OUVERT = PARTAGE_OUVERT === id ? null : id;
    render();
  } else if (b.dataset.partage === "save") {
    const m = $("#partageMsg");
    const liste = [
      ...[...document.querySelectorAll("[data-pteam]:checked")].map(c => "team:" + c.dataset.pteam),
      ...($("#partageTxt").value || "").split(/[\s,;]+/).filter(Boolean),
    ];
    const mal = mauvaisesAdresses(liste.filter(x => !x.startsWith("team:")));
    if (mal.length) {
      rougir($("#partageTxt"));
      m.style.color = "#B2263A";
      m.textContent = "Adresse invalide : " + mal.join(", ");
      return true;
    }
    m.style.color = "#26364D";
    m.textContent = "Enregistrement…";
    comptePost("seance_partage", { id, partage: liste, prevenir: false })
      .then(j => {
        toast("✓ Partage enregistré." + compteInfoMails(j && j.mail) + avertGmail(liste.filter(x => !x.startsWith("team:"))));
        return loadSeances().then(render);
      })
      .catch(err => {
        m.style.color = "#B2263A";
        m.textContent = "Échec : " + err.message;
      });
  }
  return true;
});
registerClick(e => {
  const b = e.target.closest("[data-comme]");
  if (!b) return;
  compteVoirComme(b.dataset.comme === "quitter" ? "" : b.dataset.comme);
  return true;
});

document.addEventListener("keydown", e => {
  const i = e.target && e.target.matches && e.target.matches("[data-eqf=ajout]") ? e.target : null;
  if (i && e.key === "Enter") {
    e.preventDefault();
    const bt = document.querySelector(`[data-eq=add][data-id="${i.dataset.id}"]`);
    if (bt) bt.click();
  }
});
/* le surlignage rouge disparaît dès qu'on tape dans le champ */
const reqClear = e => { const c = e.target && e.target.closest && e.target.closest(".req-err"); if (c) c.classList.remove("req-err"); };
document.addEventListener("input", reqClear);
document.addEventListener("change", reqClear);
