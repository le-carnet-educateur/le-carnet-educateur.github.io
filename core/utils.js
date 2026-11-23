/* Fonctions utilitaires */
const $ = s => document.querySelector(s);
const esc = s =>
  String(s == null ? "" : s).replace(
    /[&<>"]/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );
/* Texte riche : **gras**, *italique*, __souligné__, {rouge|texte} (rouge, bleu, vert, orange) */
const RT_COUL = { rouge: "#C0392B", bleu: "#1F5FBF", vert: "#2E7D4F", orange: "#D9730D" };
function rtParse(s) {
  const out = [];
  let b = false, i = false, u = false, buf = "";
  const cs = [];
  const flush = () => { if (buf) out.push({ t: buf, b, i, u, c: cs.length ? cs[cs.length - 1] : "" }); buf = ""; };
  s = String(s == null ? "" : s);
  for (let k = 0; k < s.length; k++) {
    let m;
    if (s.startsWith("**", k)) { flush(); b = !b; k++; }
    else if (s.startsWith("__", k)) { flush(); u = !u; k++; }
    else if (s[k] === "*") { flush(); i = !i; }
    else if (s[k] === "{" && (m = /^\{(rouge|bleu|vert|orange)\|/.exec(s.slice(k)))) { flush(); cs.push(RT_COUL[m[1]]); k += m[0].length - 1; }
    else if (s[k] === "}" && cs.length) { flush(); cs.pop(); }
    else buf += s[k];
  }
  flush();
  return out;
}
const rt = s => {
  s = String(s == null ? "" : s);
  if (!/\*|__|\{/.test(s)) return esc(s);
  return rtParse(s)
    .map(g => {
      let h = esc(g.t);
      if (g.b) h = `<b>${h}</b>`;
      if (g.i) h = `<i>${h}</i>`;
      if (g.u) h = `<u>${h}</u>`;
      if (g.c) h = `<span style="color:${g.c}">${h}</span>`;
      return h;
    })
    .join("");
};
const norm = s =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
function parseCSV(t) {
  const rows = [];
  let r = [],
    f = "",
    q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c == '"') {
        if (t[i + 1] == '"') {
          f += '"';
          i++;
        } else q = false;
      } else f += c;
    } else if (c == '"') q = true;
    else if (c == ",") {
      r.push(f);
      f = "";
    } else if (c == "\n" || c == "\r") {
      if (c == "\r" && t[i + 1] == "\n") i++;
      r.push(f);
      rows.push(r);
      r = [];
      f = "";
    } else f += c;
  }
  if (f !== "" || r.length) {
    r.push(f);
    rows.push(r);
  }
  const h = rows.shift().map(x => x.trim());
  return rows
    .filter(x => x.some(y => y.trim()))
    .map(x => Object.fromEntries(h.map((k, i) => [k, (x[i] || "").trim()])));
}
/* « • » devant chaque ligne (inutile de les saisir à la main) */
const puces = t =>
  String(t || "")
    .split(/\n/)
    .map(l => l.replace(/^\s*[•\-–▸]\s*/, "").trim())
    .filter(Boolean)
    .map(l => "• " + l)
    .join("\n");
const puceHTML = t => esc(puces(t)).replace(/\n/g, "<br>");
function driveImg(u) {
  const m = String(u || "").match(/(?:\/d\/|[?&]id=)([\w-]{15,})/);
  return m && /drive\.google/.test(u)
    ? "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w1600"
    : u;
}

/* Photo / dessin importé : redimensionné (côté max 1100 px) et recompressé en JPEG dans le navigateur, avant tout envoi.
   Renvoie { data (base64 sans en-tête), w, h, ko (taille en Ko) }. */
function imgCompresser(file, max = 1100, q = 0.82) {
  return new Promise((ok, ko) => {
    if (!file || !/^image\//.test(file.type)) return ko(new Error("Ce fichier n'est pas une image."));
    const u = URL.createObjectURL(file),
      im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height)),
        w = Math.round(im.width * k),
        h = Math.round(im.height * k),
        c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const x = c.getContext("2d");
      x.fillStyle = "#fff";
      x.fillRect(0, 0, w, h);
      x.drawImage(im, 0, 0, w, h);
      URL.revokeObjectURL(u);
      const d = c.toDataURL("image/jpeg", q).split(",")[1];
      ok({ data: d, w, h, ko: Math.round((d.length * 3) / 4 / 1024) });
    };
    im.onerror = () => {
      URL.revokeObjectURL(u);
      ko(new Error("Image illisible (format non pris en charge par ce navigateur)."));
    };
    im.src = u;
  });
}

/* Logo du site : un seul fichier (assets/logo.webp), utilisé dans l'en-tête (index.html) et comme image par défaut des jeux sans schéma */
const LOGO_URL = "assets/logo.webp";
const logoRepli = "this.onerror=null;this.src='" + LOGO_URL + "';this.className='dflt'";
