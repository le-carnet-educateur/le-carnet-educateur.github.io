/* Export Word de la fiche de séance (bibliothèque docx chargée à la demande) */
/* ===== Export Word (reprend le modèle de fiche de séance) ===== */
function loadDocx() {
  return new Promise((ok, ko) => {
    if (window.docx) return ok();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/docx@9.7.1/dist/index.iife.js";
    s.onload = () => (window.docx ? ok() : ko());
    s.onerror = ko;
    document.head.appendChild(s);
  });
}
function buildSeanceDoc(logo) {
  if (typeof isCreps === "function" && isCreps()) return buildCrepsDoc(logo);
  const D = window.docx;
  const imgPar = v => {
    const u = v && v.schOn && schemaPlace() !== "page" && (v.img || v.imgJeu);
    const r = u && typeof crepsImgRun === "function" && crepsImgRun(D, u, 420, 150);
    return r ? [new D.Paragraph({ children: [r], spacing: { after: 60 } })] : [];
  };
  const {
    Document,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    AlignmentType,
    WidthType,
    ShadingType,
    BorderStyle,
    VerticalAlign,
    PageOrientation,
    TableLayoutType,
  } = D;
  palApply(SMETA.palette);
  const FONT = "Calibri",
    CW = 15838,
    BLUE = palHex(PAL.c1),
    ORG = palHex(PAL.c2),
    NAVY = palHex(PAL.head),
    HI = palHex(PAL.ink),
    HS = palHex(PAL.sub),
    PB = k => PAL.b[k].map(palHex),
    V = VerticalAlign.CENTER;
  const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    NOB = { top: NONE, bottom: NONE, left: NONE, right: NONE };
  const bd = (c, s = 6) => ({ style: BorderStyle.SINGLE, size: s, color: c }),
    sh = f => ({ type: ShadingType.CLEAR, fill: f, color: "auto" });
  const R = (t, o = {}) =>
    new TextRun({
      text: String(t).replace(/'/g, "’"),
      font: FONT,
      size: o.size || 18,
      bold: o.b,
      italics: o.i,
      color: o.c || "2B2F36",
    });
  const ph = (t, s = 18) => R(t, { i: true, c: "8A93A3", size: s });
  const P = (ch, o = {}) =>
    new Paragraph({
      children: Array.isArray(ch) ? ch : [ch],
      alignment: o.al,
      spacing: { before: 0, after: o.af || 0, line: 252 },
    });
  const cell = (ch, o = {}) =>
    new TableCell({
      children: ch,
      width: { size: o.w, type: WidthType.DXA },
      columnSpan: o.span,
      shading: o.f ? sh(o.f) : undefined,
      verticalAlign: o.va,
      margins: o.m || { top: 60, bottom: 60, left: 120, right: 120 },
      borders: o.b || NOB,
    });
  const tbl = (rows, w) =>
    new Table({
      rows,
      width: { size: w.reduce((a, b) => a + b, 0), type: WidthType.DXA },
      columnWidths: w,
      layout: TableLayoutType.FIXED,
      borders: {
        top: NONE,
        bottom: NONE,
        left: NONE,
        right: NONE,
        insideHorizontal: NONE,
        insideVertical: NONE,
      },
    });
  const row = (c, h) => new TableRow({ children: c, cantSplit: true, tableHeader: h });
  const sp = () =>
    new Paragraph({
      spacing: { before: 0, after: 0, line: 100, lineRule: D.LineRuleType.EXACT },
      children: [new TextRun({ text: "", size: 2 })],
    });
  const M = seModel(),
    S = SMETA;
  const out = [];
  const txt = (t, p) => (t ? R(t, { c: HI }) : R(p, { i: true, c: HS }));
  const gris = t => R(t, { c: HS });
  const colonnes = [];
  if (logo)
    colonnes.push({
      w: 2000,
      body: [
        new Paragraph({
          children: [
            new D.ImageRun({
              type: logo.type,
              data: logo.data,
              transformation: { width: logo.w, height: logo.h },
            }),
          ],
        }),
      ],
    });
  const l1 = [];
  if (S.titre) l1.push(R(S.titre, { b: true, c: HI, size: 26 }));
  if (S.periode) l1.push(R((S.titre ? "  " : "") + "[" + S.periode + "]", { c: HS, size: 22 }));
  const lignesMain = [];
  if (l1.length) lignesMain.push(P(l1));
  if (S.theme) lignesMain.push(P([R("Thème : ", { b: true, c: HI }), gris(S.theme)]));
  if (S.educ) lignesMain.push(P([R("Éducateurs : ", { b: true, c: HI }), gris(S.educ)]));
  const reste = CW - (logo ? 2000 : 0) - 2500 - (S.objectif ? 4000 : 0) - (S.dates ? 1900 : 0);
  if (lignesMain.length) colonnes.push({ w: reste, body: lignesMain, main: true });
  if (S.objectif)
    colonnes.push({
      w: 4000,
      body: [P([R("Objectif général : ", { b: true, c: HI }), gris(S.objectif)])],
    });
  if (S.dates)
    colonnes.push({
      w: 1900,
      body: [P([R("Dates : ", { c: HI }), gris(S.dates)], { al: AlignmentType.CENTER })],
    });
  colonnes.push({
    w: 2500,
    body: M.G.map(g =>
      P([
        R("■ ", { c: g.c.slice(1), b: true }),
        R(g.nom + " – " + M.tot[g.i] + " min", { c: HI, size: 17 }),
      ])
    ),
  });
  /* si la colonne principale est absente, son espace est rendu à la dernière colonne */
  if (!lignesMain.length) colonnes[colonnes.length - 1].w += reste;
  const W = colonnes.map(c => c.w);
  out.push(
    tbl(
      [
        row(
          colonnes.map((c, i) =>
            cell(c.body, {
              w: c.w,
              f: NAVY,
              va: V,
              m: i === 0 ? { top: 110, bottom: 110, left: 200, right: 140 } : undefined,
            })
          )
        ),
      ],
      W
    )
  );
  out.push(sp());
  const tg = (d, idx) => tgs(M, d, idx).map(x => ({ t: x.t, c: x.c.slice(1) }));
  const band = (tags, title, fill, tcol) => {
    const m = { top: 30, bottom: 30, left: 40, right: 40 };
    const ws = [...tags.map(() => 700), CW - 700 * tags.length];
    const cs = tags.map((x, i) =>
      cell([P([R(x.t, { b: true, c: "FFFFFF" })], { al: AlignmentType.CENTER })], {
        w: 700,
        f: x.c,
        va: V,
        m,
      })
    );
    cs.push(
      cell([P([R(title, { b: true, c: tcol, size: 17 })])], {
        w: ws[ws.length - 1],
        f: PAL.st === "filet" ? "FFFFFF" : fill,
        va: V,
        m: { top: 30, bottom: 30, left: 140, right: 100 },
      })
    );
    return [tbl([row(cs)], ws), sp()];
  };
  out.push(
    ...band(
      tg(
        M.G.map(g => g.acc),
        M.all
      ),
      "ACCUEIL",
      PB("acc")[0],
      PB("acc")[1]
    )
  );
  const lines = t =>
    String(t || "")
      .split(/\n/)
      .map(l => l.replace(/^\s*[•\-–]\s*/, "").trim())
      .filter(Boolean);
  if (M.ech.on) {
    out.push(...band(tg(M.ce, M.all), "ÉCHAUFFEMENT", PB("ech")[0], PB("ech")[1]));
    M.echSubs.forEach((s, k) => {
      const runs = [];
      tg(s.d, s.idx).forEach(x =>
        runs.push(
          new TextRun({
            text: "\u00A0" + x.t + "\u00A0",
            font: FONT,
            size: 17,
            bold: true,
            color: x.c,
            shading: { type: ShadingType.CLEAR, fill: "FFFFFF", color: "auto" },
            border: { style: BorderStyle.SINGLE, size: 4, color: x.c, space: 0 },
          }),
          R("  ")
        )
      );
      out.push(
        P(
          [
            ...runs,
            R(echLabel(s, k) || "Échauffement", { b: true, c: uniteCol(s).wf, size: 17 }),
            ...(s.idx.length < M.G.length
              ? [R("  · " + nomsGroupes(M, s.idx) + " seulement", { c: uniteCol(s).wf, size: 16 })]
              : []),
          ],
          { af: 20 }
        )
      );
      if (!s.views.length)
        out.push(P([R("▸ ", { c: BLUE, b: true, size: 18 }), ph("[Ajouter un jeu ou un exercice]")], { af: 30 }));
      s.views.forEach(x => {
        const L = lines(x.v.desc);
        if (!x.same)
          out.push(
            P(
              [
                R("▸ ", { c: BLUE, b: true, size: 18 }),
                R(x.name + (x.v.code ? " (" + x.v.code + ")" : ""), { b: true, size: 18 }),
              ],
              { af: 10 }
            )
          );
        (L.length ? L : [null]).forEach(l =>
          out.push(
            P(
              [
                R(x.same ? "▸ " : "    ", { c: BLUE, b: true, size: 18 }),
                l ? R(l, { size: 18 }) : ph("[Décrire le déroulé : qui fait quoi, combien de temps]"),
              ],
              { af: 30 }
            )
          )
        );
        out.push(...imgPar(x.v));
      });
    });
    out.push(sp());
  }
  out.push(...band(tg(M.c, M.all), "CORPS DE SÉANCE", PB("corps")[0], PB("corps")[1]));
  const T = [7600, 2700, 2700, CW - 13000];
  const hd = (t, c, f, w) =>
    cell([P([R(t, { b: true, c, size: 16 })])], {
      w,
      f,
      m: { top: 50, bottom: 50, left: 140, right: 100 },
      b: { bottom: bd("D5DAE5") },
    });
  if (M.subs.length) {
    const PV = palVar();
    const rows = [
      row(
        [
          hd("EXERCICE / DÉFI / JEU", "FFFFFF", palHex(PAL.th), T[0]),
          hd("PLUS DIFFICILE (+)", palHex(PV.pH[0]), palHex(PV.pH[1]), T[1]),
          hd("PLUS FACILE (–)", palHex(PV.mH[0]), palHex(PV.mH[1]), T[2]),
          hd("CRITÈRES DE RÉUSSITE", palHex(PV.cH[0]), palHex(PV.cH[1]), T[3]),
        ],
        true
      ),
    ];
    let n = 0;
    const bm = (t, c, sg) => {
      const L = lines(t);
      return L.length
        ? L.map(l => P([R(sg + " ", { c, b: true }), R(l, { size: 17 })], { af: 20 }))
        : [P([ph("—")])];
    };
    M.subs.forEach((s, k) => {
      const runs = [];
      tg(s.d, s.idx).forEach(x => {
        runs.push(
          new TextRun({
            text: "\u00A0" + x.t + "\u00A0",
            font: FONT,
            size: 17,
            bold: true,
            color: x.c,
            shading: { type: ShadingType.CLEAR, fill: "FFFFFF", color: "auto" },
            border: { style: BorderStyle.SINGLE, size: 4, color: x.c, space: 0 },
          }),
          R("  ")
        );
      });
      rows.push(
        row([
          cell(
            [
              P([
                ...runs,
                R(s.num + ". " + unitLabel(s, k), { b: true, c: uniteCol(s).wf, size: 17 }),
                ...(s.idx.length < M.G.length
                  ? [
                      R("  · " + nomsGroupes(M, s.idx) + " seulement", {
                        c: uniteCol(s).wf,
                        size: 16,
                      }),
                    ]
                  : []),
              ]),
            ],
            { w: T[0], f: uniteCol(s).w, m: { top: 40, bottom: 40, left: 140, right: 100 } }
          ),
          cell([P([R("")])], { w: T[1], f: palHex(PV.pB) }),
          cell([P([R("")])], { w: T[2], f: palHex(PV.mB) }),
          cell([P([R("")])], { w: T[3], f: palHex(PV.cB) }),
        ])
      );
      s.views.forEach(x => {
        const v = x.v;
        const main = x.same
          ? [
              ...x.steps.map(l =>
                P([R("▸ ", { c: BLUE, b: true }), R(l, { size: 17 })], { af: 20 })
              ),
            ]
          : [
              P(
                [
                  R("▸ ", { c: BLUE, b: true }),
                  ...(v.url
                    ? [
                        new D.ExternalHyperlink({
                          link: v.url,
                          children: [R((x.n ? x.n + " " : "") + x.name, { b: true, c: palHex(PAL.th) })],
                        }),
                      ]
                    : [R((x.n ? x.n + " " : "") + x.name, { b: true })]),
                  ...(v.code ? [R("  (" + v.code + ")", { c: "6B7280", size: 16 })] : []),
                ],
                { af: 30 }
              ),
              ...String(v.desc || "")
                .split("\n")
                .filter(Boolean)
                .map(l => P([R(l, { size: 17 })], { af: 30 })),
            ];
        main.push(...imgPar(v));
        if (v.meta || (x.same && v.code))
          main.push(
            P([
              ...(x.same && v.code
                ? [
                    new D.ExternalHyperlink({
                      link: v.url,
                      children: [R("Fiche " + v.code + " ↗", { c: palHex(PAL.th), size: 16 })],
                    }),
                    R(" · ", { i: true, c: "6B7280", size: 16 }),
                  ]
                : []),
              R(v.meta || "", { i: true, c: "6B7280", size: 16 }),
            ])
          );
        const cr = lines(v.crit);
        rows.push(
          row([
            cell(main, { w: T[0], b: { bottom: bd("D5DAE5") } }),
            cell(bm(v.plus, palHex(PV.pT), "+"), { w: T[1], f: palHex(PV.pB), b: { bottom: bd("D5DAE5") } }),
            cell(bm(v.moins, palHex(PV.mT), "–"), { w: T[2], f: palHex(PV.mB), b: { bottom: bd("D5DAE5") } }),
            cell(
              cr.length
                ? cr.map(l =>
                    P([R("✓ ", { c: palHex(PV.cT), b: true }), R(l, { size: 17 })], { af: 30 })
                  )
                : [
                    P([R("✓ ", { c: palHex(PV.cT), b: true }), ph("[critère observable]")], { af: 60 }),
                    P([R("✓ ", { c: palHex(PV.cT), b: true }), ph("[critère observable]")]),
                  ],
              {
                w: T[3],
                f: palHex(PV.cB),
                m: { top: 60, bottom: 60, left: 120, right: 100 },
                va: VerticalAlign.TOP,
              }
            ),
          ])
        );
      });
    });
    out.push(tbl(rows, T));
    out.push(sp());
  }
  const F = [4600, 3800, 3300, CW - 11700];
  const fc = (t, body, w) =>
    cell([P([R(t, { b: true, c: "2B2F36", size: 16 })], { af: 30 }), ...body], {
      w,
      f: "F2F3F5",
      b: { left: bd("FFFFFF", 8) },
      m: { top: 70, bottom: 80, left: 140, right: 120 },
      va: VerticalAlign.TOP,
    });
  const ml = (t, p) =>
    t
      ? String(t)
          .split("\n")
          .map(l => P([R(l, { size: 17 })]))
      : [P([ph(p)])];
  out.push(
    tbl(
      [
        row([
          fc("OBJECTIF COLLECTIF", ml(S.objCol, "[ce que le groupe doit réussir]"), F[0]),
          fc(
            "MATÉRIEL",
            M.mats.length
              ? [P([R(M.mats.map(m => capf(m.t)).join(" · "), { size: 17 })])]
              : [P([R("Aucun matériel particulier.", { size: 17 })])],
            F[1]
          ),
          fc("SÉCURITÉ", ml(S.secu, "[rappels : hauteur, tapis, pas de saut…]"), F[2]),
          fc(
            "RETOUR AU CALME",
            M.G.map(g =>
              P([
                R(g.nom + " : ", { b: true, c: g.c.slice(1) }),
                g.rc ? R(g.rc) : ph("[étirements, bilan…]"),
              ])
            ),
            F[3]
          ),
        ]),
      ],
      F
    )
  );
  /* schémas sur une page à part (réglage « Page à part ») */
  if (schemaPlace() === "page") {
    const LS = [...M.echSubs, ...M.subs]
      .flatMap(s2 => s2.views)
      .map(x => ({ x, r: x.v && x.v.schOn && (x.v.img || x.v.imgJeu) && crepsImgRun(D, x.v.img || x.v.imgJeu, 480, 240) }))
      .filter(o => o.r);
    LS.forEach((o, i) => {
      if (i === 0)
        out.push(
          new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [R("Schémas", { b: true, size: 24 })] })
        );
      out.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [R(o.x.name, { b: true, size: 18 })] }));
      out.push(new Paragraph({ spacing: { after: 60 }, children: [o.r] }));
    });
  }
  return new Document({
    creator: "Base de données des jeux d'escalade",
    title: S.titre || "Ma séance",
    styles: { default: { document: { run: { font: FONT, size: 18 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
            margin: { top: 500, bottom: 500, left: 500, right: 500 },
          },
        },
        children: out,
      },
    ],
  });
}
/* lit un logo (adresse de données) : octets, type et taille d'affichage (hauteur 50 px) */
function logoInfo(dataUrl) {
  return new Promise(ok => {
    if (!dataUrl) return ok(null);
    const img = new Image();
    img.onload = () => {
      const h = 50,
        w = Math.max(10, Math.round((img.naturalWidth / img.naturalHeight) * h));
      const bin = atob(dataUrl.split(",")[1]),
        data = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
      ok({ data, type: /image\/png/.test(dataUrl) ? "png" : "jpg", w: Math.min(w, 160), h });
    };
    img.onerror = () => ok(null);
    img.src = dataUrl;
  });
}
/* rec : séance de la bibliothèque {meta, se} ; sinon la séance en cours */
async function seanceWord(rec) {
  const m = $("#sMsg");
  const msg = t => {
    if (m) m.textContent = t;
  };
  try {
    msg("Création du fichier…");
    await loadDocx();
    const meta = rec ? rec.meta : SMETA;
    const logo = await logoInfo(meta.logo);
    let manque = 0;
    if (meta.modele === "creps" && typeof crepsPreload === "function") {
      msg("Récupération des schémas…");
      manque = await crepsPreload(rec);
    } else if (meta.modele !== "creps" && typeof crepsImgPng === "function") {
      msg("Récupération des schémas…");
      const get = () => {
        const M = seModel();
        return [...M.echSubs, ...M.subs].flatMap(s => s.views.map(x => x.v && x.v.schOn && (x.v.img || x.v.imgJeu)));
      };
      const urls = [...new Set((rec ? withSeance(rec.meta, rec.se, get) : get()).filter(Boolean))];
      await Promise.all(
        urls.map(async u => {
          if (CREPS_IMGS[u]) return;
          try {
            CREPS_IMGS[u] = await Promise.race([
              crepsImgPng(u),
              new Promise((_, ko) => setTimeout(() => ko(new Error("délai")), 8000)),
            ]);
          } catch (e) {
            manque++;
          }
        })
      );
    }
    const doc = rec
      ? withSeance(rec.meta, rec.se, () => buildSeanceDoc(logo))
      : buildSeanceDoc(logo);
    const blob = await window.docx.Packer.toBlob(doc);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download =
      ((meta.titre || "Ma-seance").replace(/[^\wàâäçéèêëîïôöùûüÀÉÈ\- ]/g, "").trim() ||
        "Ma-seance") + ".docx";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
    msg(
      "Fichier Word téléchargé." +
        (manque ? " " + manque + " schéma(s) non intégré(s) (image inaccessible)." : "") +
        " Déposez-le dans votre Drive : clic droit › Ouvrir avec Google Docs."
    );
  } catch (e) {
    msg(
      "Création impossible (connexion internet nécessaire). Utilisez « Copier le texte » ou « Imprimer / PDF »."
    );
  }
}
