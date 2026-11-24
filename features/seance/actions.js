/* Ma séance — ajout à la bibliothèque, boutons et clics */
/* choix de la famille dans un menu (pas de saisie libre : pas d'erreur de frappe possible) */
function choisirFamille(def) {
  const L = Object.keys(FAMS).filter(f => typeof discDeFamille !== "function" || discDeFamille(f) === (DISC || "escalade"));
  return new Promise(res => {
    let fait = false;
    const fin = v => {
      if (fait) return;
      fait = true;
      res(v);
    };
    const p = modal(
      "Famille du jeu",
      `<p style="margin-top:0">Dans quelle famille range-t-on ce jeu ?</p><select id="famChoix" style="width:100%;padding:8px">${L.map(f => `<option ${f === def ? "selected" : ""}>${esc(f)}</option>`).join("")}</select><div class="tools" style="margin-top:12px"><a class="btn" id="famOk" style="background:#2E7D4F;color:#fff;border-radius:8px;padding:9px 16px;font-weight:700;cursor:pointer;display:inline-block">Valider</a></div>`,
      420,
      { fin: () => fin("") }
    );
    $("#famOk").addEventListener("click", () => {
      const v = $("#famChoix").value;
      fin(v);
      modalFermer("mpop", true);
    });
  });
}
/* Ajouter un exercice libre à la bibliothèque : formulaire complet dans une fenêtre, prérempli avec ce qui est déjà saisi */
let STL = null;
function seToLib(id) {
  const f = seFind(id);
  if (!f) return;
  const it = f.s.items[f.i];
  if (!it.titre || !it.desc) {
    alert("Renseignez au moins le nom de l'exercice et la consigne.");
    return;
  }
  const d = SMETA.disc || DISC || "escalade";
  const auteur = (typeof AUTH !== "undefined" && AUTH.user && (AUTH.user.pseudo || AUTH.user.nom)) || "";
  const v = {
    Titre: it.titre,
    Famille: it.fam || "",
    Résumé: it.desc.split(/[.\n]/)[0].slice(0, 140),
    Principe: it.desc,
    Participants: it.part || "",
    Matériel: it.mat || "Aucun",
    Durée: f.s.d && f.s.d[0] ? f.s.d[0] + " min" : "",
    "Plus facile": puces(it.moins),
    "Plus difficile": puces(it.plus),
    Auteur: auteur,
    Objectif: it.cp_obj || "",
    But: it.cp_but || "",
    "Comportements attendus": it.cp_comp || "",
    Organisation: it.cp_orga || "",
    "Critères de réussite": puces(critEff(it)),
  };
  STL = { id, d, v };
  stlAfficher();
}
function stlAfficher() {
  const { v, d } = STL;
  modal(
    "＋ Ajouter « " + esc(v.Titre) + " » à la bibliothèque",
    `<p class="hint" style="margin:0 0 8px">Complète la fiche : elle sera relue avant d'apparaître dans la bibliothèque.</p><div class="pform">${propFormHTML(v, d, k => `data-stl-f="${esc(k)}"`, k => `data-stl-t="${esc(k)}"`, {})}<div class="tools" style="margin-top:12px"><a class="btn" data-stl="send" style="background:#2E7D4F;color:#fff;border-radius:8px;padding:10px 20px;font-weight:700;cursor:pointer">Envoyer à la bibliothèque</a><a class="chip" data-modal="fermer" data-mid="mpop">Annuler</a><span id="stlMsg" style="font-weight:700"></span></div></div>`,
    980,
    { fond: false }
  );
  document.querySelectorAll("[data-stl-f]").forEach(i => {
    i.addEventListener("input", () => {
      STL.v[i.dataset.stlF] = i.value;
    });
    if (i.dataset.stlF === "Famille") i.addEventListener("change", () => (STL.v.Famille = i.value));
  });
  document.querySelectorAll("[data-stl-t]").forEach(i =>
    i.addEventListener("change", () => {
      STL.v[i.dataset.stlT] = [...document.querySelectorAll(`[data-stl-t="${CSS.escape(i.dataset.stlT)}"]`)]
        .filter(x => x.checked)
        .map(x => x.value)
        .join(", ");
    })
  );
}
registerClick(e => {
  const b = e.target.closest("[data-stl]");
  if (!b || !STL) return;
  const v = STL.v,
    msg = t => {
      const m = $("#stlMsg");
      if (m) {
        m.style.color = "#B2263A";
        m.textContent = t;
      }
    };
  PROP_CHAMPS.forEach(c => {
    if (c.t === "select" && !c.vide && !v[c.k]) v[c.k] = c.opts()[0];
  });
  const manque = PROP_CHAMPS.filter(c => c.req && !(STL.d === "prepa" && c.k === "Participants") && !String(v[c.k] || "").trim()).map(c => c.k);
  if (manque.length) {
    msg("À compléter : " + manque.join(", ") + ".");
    return true;
  }
  if (v["Remplace le jeu"]) v["Remplace le jeu"] = v["Remplace le jeu"].split(" · ")[0];
  const jeu = { ...v };
  const ok = () => {
    const f = seFind(STL.id);
    if (f) {
      f.s.items[f.i].sent = true;
      f.s.items[f.i].fam = jeu.Famille;
      seSave();
    }
    modalFermer("mpop", true);
    toast("✓ Exercice envoyé : il apparaîtra dans la bibliothèque après relecture.");
    STL = null;
    render();
  };
  if (CONFIG.GAME_ADD_URL) {
    msg("Envoi en cours…");
    $("#stlMsg").style.color = "#6B7280";
    fetch(CONFIG.GAME_ADD_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ key: CONFIG.GAME_ADD_KEY || "", action: "jeu", jeu }),
    })
      .then(r => r.json())
      .then(j => {
        if (!j.ok) throw new Error(j.error || "refusé");
        ok();
      })
      .catch(er => msg("Échec de l'envoi (" + er.message + ")."));
  } else {
    const txt = Object.entries(jeu).map(([k, x]) => k + " : " + x).join("\n");
    try {
      navigator.clipboard.writeText(txt).catch(() => {});
    } catch (er) {}
    toast("Fiche copiée : collez-la dans le formulaire « Proposer un jeu ».");
    if (CONFIG.FORM_URL) window.open(CONFIG.FORM_URL, "_blank");
    modalFermer("mpop", true);
  }
  return true;
});
/* ---------- actions ---------- */
/* glisser-déposer générique (souris et doigt) : `rows` = éléments dans l'ordre, `from` = rang de celui qu'on déplace,
   `apply(from, to)` modifie les données. Le survol marque l'endroit d'arrivée ; le clic qui suit un glisser est ignoré. */
function seDrag(e, rows, from, apply) {
  e.preventDefault();
  let to = from;
  rows[from].classList.add("gdragging");
  const marque = () =>
    rows.forEach((r, k) => {
      r.classList.toggle("gover-up", k === to && to < from);
      r.classList.toggle("gover-down", k === to && to > from);
    });
  const move = ev => {
    let best = from,
      dist = 1e9;
    rows.forEach((r, k) => {
      const b = r.getBoundingClientRect(),
        d = Math.abs(ev.clientY - (b.top + b.height / 2));
      if (d < dist) {
        dist = d;
        best = k;
      }
    });
    to = best;
    marque();
  };
  const fin = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", fin);
    document.removeEventListener("pointercancel", fin);
    rows.forEach(r => r.classList.remove("gdragging", "gover-up", "gover-down"));
    const bloque = ev => {
      ev.stopPropagation();
      ev.preventDefault();
    };
    document.addEventListener("click", bloque, { capture: true, once: true });
    setTimeout(() => document.removeEventListener("click", bloque, true), 50);
    if (to !== from) {
      apply(from, to);
      seSave();
      render();
    }
  };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", fin);
  document.addEventListener("pointercancel", fin);
}
/* glisser un exercice (seul ou dans un bloc) : le déposer dans un bloc (à la place voulue), ou entre deux lignes pour en faire un exercice seul */
function seDragExo(e, id) {
  e.preventDefault();
  const f = seFind(id);
  if (!f) return;
  const arr = [SE.subs, seEchSubs()].find(a => a.includes(f.s));
  if (!arr) return;
  const src = document.querySelector(f.s.items.length === 1 && !document.querySelector(`#ssub-${f.s.id}.bloc`) ? "#ssub-" + f.s.id : `details.sit[data-sd="i${id}"]`);
  if (src) src.classList.add("gdragging", "xdrag");
  const unites = () => [...document.querySelectorAll('[id^="ssub-"]')].filter(x => arr.some(u => "ssub-" + u.id === x.id));
  let cible = null, sy = 0, raf = 0;
  const clear = () => document.querySelectorAll(".gover-up,.gover-down").forEach(x => x.classList.remove("gover-up", "gover-down"));
  const calc = ev => {
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const tu = el && el.closest('[id^="ssub-"]');
    clear();
    cible = null;
    if (!tu) return;
    const uid = +tu.id.slice(5), unit = arr.find(u => u.id === uid);
    if (!unit) return;
    const bloc = tu.classList.contains("bloc");
    const head = el.closest(".bhead");
    if (bloc && !head) {
      const rows = [...tu.querySelectorAll(":scope > details.sit")].filter(r => +r.dataset.sd.slice(1) !== id);
      if (!rows.length) { cible = { mode: "in", unit, rid: null, after: true }; tu.classList.add("gover-down"); return; }
      let best = rows[0], d = 1e9;
      rows.forEach(r => { const b = r.getBoundingClientRect(), dd = Math.abs(ev.clientY - (b.top + b.height / 2)); if (dd < d) { d = dd; best = r; } });
      const b = best.getBoundingClientRect(), after = ev.clientY > b.top + b.height / 2;
      cible = { mode: "in", unit, rid: +best.dataset.sd.slice(1), after };
      best.classList.add(after ? "gover-down" : "gover-up");
    } else {
      if (unit === f.s) return;
      const b = tu.getBoundingClientRect(), after = ev.clientY > b.top + b.height / 2;
      cible = { mode: "unit", unit, after };
      tu.classList.add(after ? "gover-down" : "gover-up");
    }
  };
  const move = ev => { sy = ev.clientY; calc(ev); };
  const roule = () => {
    const sc = document.getElementById("epop") || document.scrollingElement;
    if (sy && sy < 70) sc.scrollTop -= 12; else if (sy > innerHeight - 70) sc.scrollTop += 12;
    raf = requestAnimationFrame(roule);
  };
  raf = requestAnimationFrame(roule);
  const fin = () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", fin);
    document.removeEventListener("pointercancel", fin);
    clear();
    if (src) src.classList.remove("gdragging", "xdrag");
    const bloque = ev => { ev.stopPropagation(); ev.preventDefault(); };
    document.addEventListener("click", bloque, { capture: true, once: true });
    setTimeout(() => document.removeEventListener("click", bloque, true), 50);
    if (!cible) return;
    const solo = f.s.items.length === 1;
    const it = f.s.items[f.i];
    if (cible.mode === "unit" && solo) {
      arr.splice(arr.indexOf(f.s), 1);
      arr.splice(arr.indexOf(cible.unit) + (cible.after ? 1 : 0), 0, f.s);
    } else {
      f.s.items.splice(f.i, 1);
      if (cible.mode === "in") {
        const t = cible.unit;
        let idx = cible.rid == null ? t.items.length : t.items.findIndex(x => x.id === cible.rid) + (cible.after ? 1 : 0);
        t.items.splice(idx, 0, it);
        if (t.items.length > 1) t.solo = false;

      } else {
        arr.splice(arr.indexOf(cible.unit) + (cible.after ? 1 : 0), 0, { id: SEUID++, solo: true, titre: "", gs: f.s.gs || null, d: f.s.d.slice(), items: [it] });
      }
      if (!f.s.items.length) arr.splice(arr.indexOf(f.s), 1);
    }
    seSave();
    buildNav();
    render();
  };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", fin);
  document.addEventListener("pointercancel", fin);
}
const seMoveIn =  (arr, from, to) => arr.splice(to, 0, arr.splice(from, 1)[0]);
function seanceBind() {
  if (typeof glBind === "function") glBind();
  const upd = () => {
    const s = (SEPOP ? $("#epop") : document).querySelector("#sheet");
    if (s) s.innerHTML = sheetHTML();
    const c = $("#seControle");
    if (c) c.innerHTML = seControleInner();
    seCtlMaj();
    seBoutonSauve();
    if (typeof seDursMaj === "function") seDursMaj();
    if (typeof seStick === "function") seStick();
  };
  bilanBind(upd);
  const tb = $("#sTerrain");
  if (tb) tb.addEventListener("click", () => terrainOuvrir());
  const sub = id => seSubFind(id);
  document.querySelectorAll("[data-sm]").forEach(i =>
    i.addEventListener("input", e => {
      SMETA[i.dataset.sm] = i.dataset.n ? Math.max(0, +e.target.value || 0) : e.target.value;
      saveMeta();
      upd();
    })
  );
  document.querySelectorAll("[data-se]").forEach(i =>
    i.addEventListener("input", e => {
      SE.ech[i.dataset.se] = i.dataset.n ? Math.max(0, +e.target.value || 0) : e.target.value;
      seSave();
      upd();
    })
  );
  document.querySelectorAll("[data-ss]").forEach(i =>
    i.addEventListener("input", e => {
      const s = sub(i.dataset.sub);
      s[i.dataset.ss] = i.dataset.n ? Math.max(0, +e.target.value || 0) : e.target.value;
      seSave();
      upd();
    })
  );
  document.querySelectorAll("[data-si]").forEach(i =>
    i.addEventListener("input", e => {
      const f = seFind(+i.dataset.id);
      if (f) {
        f.s.items[f.i][i.dataset.si] = e.target.value;
        if (i.dataset.si === "crit") f.s.items[f.i].critEd = true;
        seSave();
        upd();
      }
    })
  );
  /* déplacer un exercice vers un autre bloc (ou le sortir du bloc) */
  document.querySelectorAll("[data-imv]").forEach(sel =>
    sel.addEventListener("change", () => {
      const f = seFind(+sel.dataset.id);
      if (!f || !sel.value) return;
      const arr = [SE.subs, seEchSubs()].find(a => a.includes(f.s));
      if (!arr) return;
      const it = f.s.items.splice(f.i, 1)[0];
      if (sel.value === "new") {
        arr.splice(arr.indexOf(f.s) + 1, 0, { id: SEUID++, solo: true, titre: "", gs: f.s.gs || null, d: f.s.d.slice(), items: [it] });
      } else {
        const t = arr.find(x => x.id === +sel.value);
        if (!t) return f.s.items.splice(f.i, 0, it);
        t.items.push(it);
        if (t.items.length > 1) t.solo = false;
        SEOPEN.add("i" + it.id);
      }
      if (!f.s.items.length) arr.splice(arr.indexOf(f.s), 1);
      seSave();
      buildNav();
      render();
    })
  );
  const bascule = (it, cle, v, coche) => {
    const L = Array.isArray(it[cle]) ? it[cle].slice() : [];
    const j = L.indexOf(v);
    if (coche && j >= 0) L.splice(j, 1);
    if (!coche && j < 0) L.push(v);
    it[cle] = L;
  };
  document.querySelectorAll("[data-isch]").forEach(i =>
    i.addEventListener("change", () => {
      const f = seFind(+i.dataset.id);
      if (f) {
        f.s.items[f.i].schOn = i.checked;
        seSave();
        upd();
      }
    })
  );
  document.querySelectorAll("[data-ipn]").forEach(i =>
    i.addEventListener("change", () => {
      const f = seFind(+i.dataset.id);
      if (f) {
        bascule(f.s.items[f.i], "pn", +i.dataset.ipn, i.checked);
        seSave();
        upd();
      }
    })
  );
  document.querySelectorAll("[data-ivn]").forEach(i =>
    i.addEventListener("change", () => {
      const f = seFind(+i.dataset.id);
      if (f) {
        bascule(f.s.items[f.i], "vn", i.dataset.ivn, i.checked);
        seSave();
        upd();
      }
    })
  );
  document.querySelectorAll("[data-sa-set]").forEach(i =>
    i.addEventListener("change", e => {
      const s = sub(i.dataset.sub);
      s[i.dataset.saSet] = e.target.value;
      seSave();
      render();
    })
  );
  const num = (el, e) => (el.dataset.n ? Math.max(0, +e.target.value || 0) : e.target.value);
  document.querySelectorAll("[data-gm]").forEach(i =>
    i.addEventListener("input", e => {
      SMETA.groups[+i.dataset.gi][i.dataset.gm] = num(i, e);
      saveMeta();
      upd();
    })
  );
  document.querySelectorAll("[data-gd]").forEach(i =>
    i.addEventListener("input", e => {
      const t = sub(i.dataset.sub);
      t.d[+i.dataset.gi] = num(i, e);
      seSave();
      upd();
    })
  );
  document.querySelectorAll("[data-gt]").forEach(i =>
    i.addEventListener("input", e => {
      SE.ech.gtxt[+i.dataset.gi] = e.target.value;
      seSave();
      upd();
    })
  );
  document.querySelectorAll("[data-gs]").forEach(i =>
    i.addEventListener("change", () => {
      const s = sub(i.dataset.sub),
        n = SMETA.groups.length;
      const set = new Set(s.gs || SMETA.groups.map((_, k) => k));
      if (i.checked) set.add(+i.dataset.gi);
      else set.delete(+i.dataset.gi);
      s.gs = set.size && set.size < n ? [...set].sort() : null;
      seSave();
      render();
    })
  );
  const ep = $("#seEchPer");
  if (ep)
    ep.addEventListener("change", e => {
      SE.ech.per = e.target.checked;
      if (SE.ech.per && SE.ech.gtxt.every(x => !x)) SE.ech.gtxt = SE.ech.gtxt.map(() => SE.ech.txt);
      seSave();
      render();
    });
  const ga = $("#gAdd");
  if (ga)
    ga.addEventListener("click", () => {
      SMETA.groups.push({ nom: "Groupe " + (SMETA.groups.length + 1), acc: 5, rc: "" });
      saveMeta();
      seDefaults();
      seSave();
      render();
    });
  /* glisser-déposer des exercices seuls / blocs (même liste) et des exercices d'un bloc */
  document.querySelectorAll("[data-udrag],[data-idrag]").forEach(h => {
    h.addEventListener("mousedown", e => e.preventDefault());
    h.addEventListener("dragstart", e => e.preventDefault());
    h.addEventListener("pointerdown", e => {
      if (h.dataset.udrag) {
        const u0 = SE.subs.concat(seEchSubs()).find(x => x.id === +h.dataset.udrag);
        if (u0 && u0.items.length === 1 && !document.querySelector("#ssub-" + u0.id + ".bloc")) return seDragExo(e, u0.items[0].id);
        const el = document.getElementById("ssub-" + h.dataset.udrag),
          rows = [...el.parentElement.children].filter(c => /^ssub-/.test(c.id)),
          ids = rows.map(c => +c.id.slice(5)),
          arr = [SE.subs, seEchSubs()].find(a => a.some(x => x.id === ids[0]));
        if (!arr) return;
        seDrag(e, rows, ids.indexOf(+h.dataset.udrag), (f, t) => seMoveIn(arr, arr.findIndex(x => x.id === ids[f]), arr.findIndex(x => x.id === ids[t])));
      } else {
        return seDragExo(e, +h.dataset.idrag);
        const f = seFind(+h.dataset.idrag),
          bloc = h.closest(".ssub.bloc");
        if (!f || !bloc) return;
        const rows = [...bloc.querySelectorAll(":scope > details.sit")],
          ids = rows.map(c => +c.dataset.sd.slice(1));
        seDrag(e, rows, ids.indexOf(+h.dataset.idrag), (a, t) => seMoveIn(f.s.items, f.s.items.findIndex(x => x.id === ids[a]), f.s.items.findIndex(x => x.id === ids[t])));
      }
    });
  });
  /* glisser-déposer des groupes (souris et doigt) : on attrape la poignée ⠿ et on dépose sur la ligne voulue */
  document.querySelectorAll("[data-gdrag]").forEach(h => {
    h.addEventListener("mousedown", e => e.preventDefault());
    h.addEventListener("dragstart", e => e.preventDefault());
    h.addEventListener("pointerdown", e => {
      e.preventDefault();
      const from = +h.dataset.gdrag,
        rows = [...document.querySelectorAll("[data-grow]")];
      let to = from;
      const row = i => rows.find(r => +r.dataset.grow === i);
      row(from).classList.add("gdragging");
      const marque = () =>
        rows.forEach(r => {
          const k = +r.dataset.grow;
          r.classList.toggle("gover-up", k === to && to < from);
          r.classList.toggle("gover-down", k === to && to > from);
        });
      const move = ev => {
        const y = ev.clientY;
        let best = from,
          dist = 1e9;
        rows.forEach(r => {
          const b = r.getBoundingClientRect(),
            d = Math.abs(y - (b.top + b.height / 2));
          if (d < dist) {
            dist = d;
            best = +r.dataset.grow;
          }
        });
        to = best;
        marque();
      };
      const fin = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", fin);
        document.removeEventListener("pointercancel", fin);
        rows.forEach(r => r.classList.remove("gdragging", "gover-up", "gover-down"));
        if (to !== from) {
          const sens = to > from ? 1 : -1;
          for (let k = from; k !== to; k += sens) seMoveGroup(k, sens);
          saveMeta();
          seSave();
          render();
        }
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", fin);
      document.addEventListener("pointercancel", fin);
    });
  });
  document.querySelectorAll("[data-gmv]").forEach(i =>
    i.addEventListener("click", () => {
      seMoveGroup(+i.dataset.gmv, +i.dataset.dir);
      saveMeta();
      seSave();
      render();
    })
  );
  document.querySelectorAll("[data-grm]").forEach(i =>
    i.addEventListener("click", () => {
      const g = SMETA.groups[+i.dataset.grm];
      if (!confirm("Retirer le groupe « " + (g.nom || "sans nom") + " » de toute la séance ?"))
        return;
      seDropGroup(+i.dataset.grm);
      saveMeta();
      seSave();
      render();
    })
  );
  const ao = $("#seAccOn");
  if (ao)
    ao.addEventListener("change", e => {
      SMETA.groups.forEach(g => (g.acc = e.target.checked ? 5 : 0));
      seSave();
      render();
    });
  const eo = $("#seEchOn");
  if (eo)
    eo.addEventListener("change", e => {
      SE.ech.on = e.target.checked;
      seSave();
      render();
    });
  const pr = $("#sPrint");
  if (pr) pr.addEventListener("click", imprimerSeance);
  const wd = $("#sWord");
  if (wd) wd.addEventListener("click", () => seanceWord());
  const cp = $("#sCopy");
  if (cp)
    cp.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(seanceText());
        $("#sMsg").textContent = "Texte copié !";
      } catch (e) {
        $("#sMsg").textContent = "Copie impossible : sélectionnez le texte à la main.";
      }
    });
  const cl = $("#sClear");
  if (cl)
    cl.addEventListener("click", () => {
      if (
        confirm(
          "Effacer tout le contenu de cette séance (informations, échauffement, blocs et exercices) ?\n\nLe logo de la salle est conservé."
        )
      ) {
        SE = seNew();
        seSave();
        SMETA = { schemaPlace: "non" };
        try {
          localStorage.removeItem(seMetaKey());
        } catch (e) {}
        buildNav();
        render();
      }
    });
  const sc = $("#sSaveCopy");
  if (sc)
    sc.addEventListener("click", async () => {
      delete SE.id;
      sc.textContent = "Enregistrement…";
      await enregistrerSeance(undefined, undefined, true);
      render();
    });
  const lg = $("#sLogo");
  if (lg)
    lg.addEventListener("change", e => {
      const f = e.target.files[0];
      if (f)
        logoDepuisFichier(f, url => {
          SMETA.logo = url;
          saveMeta();
          try {
            localStorage.setItem("logoSalle", url);
          } catch (er) {}
          render();
        });
    });
  const lo = $("#sLogoOff");
  if (lo)
    lo.addEventListener("click", () => {
      if (!confirm("Supprimer le logo de cette séance ?")) return;
      SMETA.logo = "";
      saveMeta();
      render();
    });
  const sv = $("#sSave");
  if (sv)
    sv.addEventListener("click", async () => {
      if (!seSale()) {
        toast("Rien à enregistrer : aucune modification depuis le dernier enregistrement.");
        return;
      }
      sv.textContent = "Enregistrement…";
      await enregistrerSeance();
      render();
    });
  seBoutonSauve();
  seCtlMaj();
  seTabAppliquer();
  seStick();
}
/* hauteurs des barres collantes (en-tête de la fenêtre, barre des onglets) : la frise se colle juste dessous */
function seStick() {
  const r = document.documentElement.style,
    pt = SEPOP ? document.querySelector("#epop .poptools") : null,
    sb = document.querySelector(".sbar");
  const h1 = pt ? pt.offsetHeight + 10 : 0;
  r.setProperty("--stk1", h1 + "px");
  r.setProperty("--stk", h1 + (sb ? sb.offsetHeight : 0) + "px");
}
window.addEventListener("resize", () => typeof seStick === "function" && seStick());
document.addEventListener("click", e => {
  const b = e.target.closest("[data-sa]");
  if (!b || (VIEW !== "seance" && !SEPOP)) return;
  const a = b.dataset.sa,
    id = +b.dataset.id,
    sid = +b.dataset.sub;
  const mvArr = (arr, i, d) => {
    const j = i + d;
    if (j >= 0 && j < arr.length) [arr[i], arr[j]] = [arr[j], arr[i]];
  };
  let re = true;
  if (a === "sgo") {
    if (b.dataset.tab && typeof seTab === "function") seTab(b.dataset.tab);
    const el = document.getElementById("ssub-" + sid);
    /* accordéon : on ouvre l'élément visé, on ferme les autres, puis on y défile */
    if (el) {
      SEOPEN = new Set();
      document.querySelectorAll("details[data-sd]").forEach(d => {
        const on = d === el || el.contains(d);
        d.open = on;
        const k = d.dataset.sd;
        if (on) SEOPEN.add(k);
      });
      const stk = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--stk")) || 0;
      const fr = document.querySelector(".frise");
      const dec = stk + (fr ? fr.offsetHeight : 0) + 8;
      const sc = document.getElementById("epop");
      const y = el.getBoundingClientRect().top - dec;
      if (sc) sc.scrollBy({ top: y, behavior: "smooth" });
      else window.scrollBy({ top: y, behavior: "smooth" });
    }
    re = false;
  } else if (a === "sdeplier" || a === "srepli") {
    SEOPEN = new Set();
    if (a === "sdeplier") seToutesSubs().forEach(x => x.items.forEach(i => (SEOPEN.add("i" + i.id), SEOPEN.add("m" + i.id))));
    document.querySelectorAll("details[data-sd]").forEach(d => (d.open = a === "sdeplier" ? true : false));
    re = false;
  } else if (a === "aidefiche") {
    modal("Modèle de fiche et schémas", aideFicheHTML(), 520);
    re = false;
  } else if (a === "modele") {
    SMETA.modele = b.dataset.m === "creps" ? "creps" : "std";
    saveMeta();
  } else if (a === "schestd") {
    SMETA.schemaStd = !SMETA.schemaStd;
    seToutesSubs().forEach(s => s.items.forEach(i => delete i.schOn));
    saveMeta();
  } else if (a === "txtreset") {
    const f = seFind(id);
    if (f) {
      delete f.s.items[f.i].txt;
      delete f.s.items[f.i].pn;
    }
  } else if (a === "schemode") {
    SMETA.schemaMode = b.dataset.m === "sous" ? "sous" : "page";
    saveMeta();
  } else if (a === "addech")
    SE.ech.subs.push({ id: SEUID++, titre: "", gs: null, d: SMETA.groups.map(() => 10), items: [] });
  else if (a === "addsub")
    SE.subs.push({ id: SEUID++, titre: "", gs: null, d: SMETA.groups.map(() => 10), items: [] });
  else if (a === "addsolofree") {
    const ech = b.dataset.ech === "1";
    const so = {
      id: SEUID++,
      solo: true,
      titre: "",
      gs: null,
      d: SMETA.groups.map(() => 10),
      items: [{ id: SEUID++, t: "free", nom: "", titre: "", desc: "", part: "", mat: "", plus: "", moins: "", crit: "" }],
    };
    seVideInitial(ech);
    (ech ? SE.ech.subs : SE.subs).push(so);
  } else if (a === "tosolo") {
    const t = seSubFind(sid);
    if (t && t.items.length === 1) {
      /* le nom du jeu remplace celui du bloc ; le titre du bloc ne sert que pour un exercice libre sans nom */
      if (t.items[0].t === "free" && !(t.items[0].titre || "").trim()) t.items[0].titre = t.titre || "";
      t.titre = "";
      t.solo = true;
    }
  } else if (a === "tobloc") {
    const t = seSubFind(sid);
    if (t) {
      t.solo = false;
      t.titre = "";
    }
  }
  else if (a === "srm") {
    if (
      seSubFind(sid).items.length &&
      !confirm(seSubFind(sid).solo ? "Supprimer cet exercice ?" : "Supprimer ce bloc et ses exercices ?")
    )
      return;
    if (SE.ech.subs.some(s => s.id === sid)) SE.ech.subs = SE.ech.subs.filter(s => s.id !== sid);
    else SE.subs = SE.subs.filter(s => s.id !== sid);
  } else if (a === "sup" || a === "sdn") {
    const L = SE.ech.subs.some(s => s.id === sid) ? SE.ech.subs : SE.subs;
    mvArr(
      L,
      L.findIndex(s => s.id === sid),
      a === "sup" ? -1 : 1
    );
  } else if (a === "addfree")
    seSubFind(sid)
      .items.push({
        id: SEUID++,
        t: "free",
        nom: "",
        titre: "",
        desc: "",
        part: "",
        mat: "",
        plus: "",
        moins: "",
        crit: "",
      });
  else if (a === "addlib") {
    const inp = document.querySelector(`[data-lib="${sid}"]`),
      val = (inp.value || "").trim().toLowerCase();
    const g =
      DATA.find(x => ((x.Code ? x.Code + " · " : "") + x.Titre).toLowerCase() === val) ||
      DATA.find(x => (x.Code || "").toLowerCase() === val) ||
      DATA.find(x => norm(x.Titre).includes(norm(val)) && val.length > 2);
    if (!g) {
      inp.style.borderColor = "#E0485A";
      return;
    }
    const s = seSubFind(sid);
    s.items.push({ id: SEUID++, t: "lib", k: key(g), crit: critDefaut(key(g)) });
  } else if (a === "edsch") {
    edPopup("item:" + id);
    re = false;
  } else if (a === "edschrm") {
    const f = seFind(id);
    if (f) delete f.s.items[f.i].sch;
  } else if (a === "irm") {
    const f = seFind(id);
    f.s.items.splice(f.i, 1);
  } else if (a === "iup" || a === "idn") {
    const f = seFind(id);
    mvArr(f.s.items, f.i, a === "iup" ? -1 : 1);
  } else if (a === "tolib") {
    seToLib(id);
    re = false;
  }
  if (re) {
    seSave();
    buildNav();
    render();
  }
});

/* listes déroulantes « Modèle » et « Schémas » de l'onglet Informations */
document.addEventListener("change", e => {
  const s = e.target.closest && e.target.closest("[data-ssel]");
  if (!s || (VIEW !== "seance" && !SEPOP)) return;
  if (s.dataset.ssel === "modele") SMETA.modele = s.value === "creps" ? "creps" : "std";
  else {
    SMETA.schemaPlace = ["non", "sous", "page"].includes(s.value) ? s.value : "non";
    seToutesSubs().forEach(x => x.items.forEach(i => delete i.schOn));
  }
  saveMeta();
  seSave();
  buildNav();
  render();
});

/* imprime uniquement la fiche de séance (A4 paysage) */
function imprimerSeance() {
  /* option « impression en gris » : la fiche est redessinée avec la palette Sobre pendant l'impression */
  if (typeof palGris === "function" && palGris()) {
    PAL_FORCE = "sobre";
    render();
    setTimeout(() => imprimerSeance0(true), 80);
  } else imprimerSeance0(false);
}
function imprimerSeance0(retablir) {
  document.body.classList.add("ps");
  const st = document.createElement("style");
  st.textContent = "@page{size:A4 landscape;margin:8mm}";
  document.head.appendChild(st);
  let fini = false;
  const nettoyer = () => {
    if (fini) return;
    fini = true;
    document.body.classList.remove("ps");
    if (retablir) {
      PAL_FORCE = "";
      render();
    }
    st.remove();
    window.removeEventListener("afterprint", nettoyer);
  };
  window.addEventListener("afterprint", nettoyer);
  setTimeout(nettoyer, 60000);
  window.print();
}
/* réduit un logo téléversé (hauteur 120 px max) pour qu'il reste léger */
function logoDepuisFichier(file, cb) {
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 120 / img.naturalHeight, 360 / img.naturalWidth);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL(/png|svg|gif/.test(file.type) ? "image/png" : "image/jpeg", 0.88));
    };
    img.onerror = () => alert("Image illisible.");
    img.src = r.result;
  };
  r.readAsDataURL(file);
}

/* ---------- réorganiser les blocs et exercices (fenêtre : glisser-déposer ou flèches) ---------- */
function reorgListe() {
  const bloc = (L, nom) =>
    L.length < 2
      ? ""
      : `<h4 style="margin:12px 0 6px">${nom}</h4>` +
        L.map(
          (s, k) =>
            `<div class="rgl" draggable="true" data-rgid="${s.id}" style="display:flex;align-items:center;gap:8px;border:1px solid #D5DAE5;border-radius:8px;padding:8px 10px;margin:4px 0;background:#fff;cursor:grab"><span style="color:#9AA3B5;font-size:18px">⠿</span><b style="flex:1">${esc(s.solo && s.items[0] ? (s.items[0].nom || "").trim() || (itemView(s.items[0]) || {}).titre || "Exercice" : s.titre || "Bloc " + (k + 1))}</b><span style="color:#6B7280;font-size:12px">${s.solo ? "exercice seul" : s.items.length + " exercice" + (s.items.length > 1 ? "s" : "")}</span><button class="chip" data-rg="up" data-rgid="${s.id}" ${k ? "" : "disabled"}>↑</button><button class="chip" data-rg="dn" data-rgid="${s.id}" ${k < L.length - 1 ? "" : "disabled"}>↓</button></div>`
        ).join("");
  return bloc(SE.ech.subs, "Échauffement") + bloc(SE.subs, "Corps de séance") || "<p>Il faut au moins deux blocs ou exercices.</p>";
}
function reorgOuvrir() {
  modal("⇅ Réorganiser les blocs et exercices", `<p class="hint" style="margin:0 0 6px">Glisse une ligne ou utilise les flèches.</p><div id="rgBox">${reorgListe()}</div><div class="tools" style="margin-top:12px"><a class="chip" data-modal="fermer" data-mid="mpop">Terminé</a></div>`, 560, { fond: false });
}
function reorgMaj() {
  seSave();
  const b = $("#rgBox");
  if (b) b.innerHTML = reorgListe();
  render();
}
const reorgMv = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
};
function reorgListeDe(id) {
  return SE.ech.subs.some(s => s.id === id) ? SE.ech.subs : SE.subs;
}
registerClick(e => {
  const a = e.target.closest("[data-rgo]");
  if (a) {
    reorgOuvrir();
    return true;
  }
  const b = e.target.closest("[data-rg]");
  if (!b) return;
  const id = +b.dataset.rgid,
    L = reorgListeDe(id);
  reorgMv(L, L.findIndex(s => s.id === id), b.dataset.rg === "up" ? -1 : 1);
  reorgMaj();
  return true;
});
let RG_ID = 0;
document.addEventListener("dragstart", e => {
  const r = e.target.closest && e.target.closest("[data-rgid].rgl");
  if (!r) return;
  RG_ID = +r.dataset.rgid;
  e.dataTransfer.effectAllowed = "move";
  try {
    e.dataTransfer.setData("text/plain", String(RG_ID));
  } catch (er) {}
});
document.addEventListener("dragover", e => {
  if (RG_ID && e.target.closest && e.target.closest(".rgl")) e.preventDefault();
});
document.addEventListener("drop", e => {
  const r = e.target.closest && e.target.closest(".rgl");
  if (!r || !RG_ID) return;
  e.preventDefault();
  const to = +r.dataset.rgid,
    L = reorgListeDe(RG_ID);
  if (to !== RG_ID && L === reorgListeDe(to)) {
    const [x] = L.splice(L.findIndex(s => s.id === RG_ID), 1);
    L.splice(L.findIndex(s => s.id === to) + (e.clientY > r.getBoundingClientRect().top + r.offsetHeight / 2 ? 1 : 0), 0, x);
    reorgMaj();
  }
  RG_ID = 0;
});
document.addEventListener("dragend", () => (RG_ID = 0));

/* Clic sur le code / nom d'un jeu dans le formulaire : fiche détail en lecture seule (sans quitter la séance) */
function jeuApercuHTML(g) {
  const f = (l, v) => (v ? `<div class="fact"><b>${l}</b>${esc(v)}</div>` : "");
  return (
    `<p style="margin:0 0 8px">${boldTitles(g.Principe || "")}</p>` +
    `<div class="facts">${f("PARTICIPANTS", g.Participants)}${f("MATÉRIEL", g["Matériel"])}${f("ESPACE", g.Espace)}${f("DURÉE", g["Durée"])}${f("INTENSITÉ", g["Intensité"])}</div>` +
    fichePleine(g) +
    (g["Variantes"] ? `<div class="tip" style="margin-bottom:10px"><b>VARIANTES</b><br>${esc(g["Variantes"]).replace(/\n/g, "<br>")}</div>` : "") +
    (g.Conseil ? `<div class="tip"><b>CONSEIL</b> ${esc(g.Conseil)}</div>` : "")
  );
}
function jeuApercuOuvrir(g) {
  if (typeof openFiche === "function" && openFiche(key(g))) {
    FICHE_LOCAL = true;
    return;
  }
  modal(`<span style="color:${famOf(g).d}">${esc(g.Code || "★")}</span> · ${esc(g.Titre)}`, jeuApercuHTML(g), 640);
}
registerClick(e => {
  const b = e.target.closest("[data-jv]");
  if (!b) return;
  e.preventDefault();
  const g = DATA.find(x => key(x) === b.dataset.jv);
  if (g) jeuApercuOuvrir(g);
  return true;
});
