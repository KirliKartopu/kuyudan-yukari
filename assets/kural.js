// Karakter kuralları (D&D 2024): seçim listesi + karakter sayfası hesabı.
// Veri 5e.tools deposundan çalışma anında gelir; sitede kural metni tutulmaz.
// Verinin yapılandırmadığı, sadece metinde yazan etkiler kural-etki.js'te.
//
// Yapı (oyuncunun seçimleri, dosyaya bu kaydedilir):
//   { v, id, ad, oyuncu, avatar, sinif, seviye, background, tur, yontem, temel{str..cha}, dunyalar, secim{anahtar: [değer..]} }
// secimler(Y, S) -> o anki seçim soruları;  hesapla(Y, S) -> karakter sayfası JSON'u
import { cek, normal as n } from "./aciklama.js";
import { ETKI } from "./kural-etki.js";

export const AB = ["str", "dex", "con", "int", "wis", "cha"];
export const AB_AD = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
export const SKILLS = {
  acrobatics: ["Acrobatics", "dex"], "animal handling": ["Animal Handling", "wis"], arcana: ["Arcana", "int"],
  athletics: ["Athletics", "str"], deception: ["Deception", "cha"], history: ["History", "int"],
  insight: ["Insight", "wis"], intimidation: ["Intimidation", "cha"], investigation: ["Investigation", "int"],
  medicine: ["Medicine", "wis"], nature: ["Nature", "int"], perception: ["Perception", "wis"],
  performance: ["Performance", "cha"], persuasion: ["Persuasion", "cha"], religion: ["Religion", "int"],
  "sleight of hand": ["Sleight of Hand", "dex"], stealth: ["Stealth", "dex"], survival: ["Survival", "wis"],
};
const SINIFLAR = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"];
// 2024 dönemi kitapları. Faerûn + genel multiverse doğrudan açık; başka dünyalar DM izniyle.
export const KAYNAK_AD = { XPHB: "", FRHoF: "Heroes of Faerûn", ABH: "Astarion's Book of Hungers", AU: "Arcana Unleashed", RHW: "Ravenloft", EFA: "Eberron", LFL: "Lorwyn" };
const KAYNAK_ACIK = ["XPHB", "FRHoF", "ABH", "AU", "RHW"], KAYNAK_DIGER = ["EFA", "LFL"];
const KAYNAK_HEPSI = KAYNAK_ACIK.concat(KAYNAK_DIGER);
export const STANDART = [15, 14, 13, 12, 10, 8];
export const PUAN_MALIYET = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

// Metinde yazan küçük tablolar (2024 PHB)
const EXPERTISE = { Rogue: { 1: 2, 6: 2 }, Bard: { 2: 2, 9: 2 }, Ranger: { 2: 1, 9: 2 }, Wizard: { 2: 1 } };
const SCHOLAR = ["arcana", "history", "investigation", "medicine", "nature", "religion"];
const MASTERY_SABIT = { Rogue: 2, Paladin: 2, Ranger: 2 }; // Barbarian ve Fighter'da sınıf tablosunda sütun var
const EJDERHA = [["Black", "Acid"], ["Blue", "Lightning"], ["Brass", "Fire"], ["Bronze", "Lightning"], ["Copper", "Acid"],
  ["Gold", "Fire"], ["Green", "Poison"], ["Red", "Fire"], ["Silver", "Cold"], ["White", "Cold"]];
const HASAR = { S: "Slashing", P: "Piercing", B: "Bludgeoning", Y: "Psychic", F: "Fire", C: "Cold", L: "Lightning", A: "Acid", O: "Force", R: "Radiant", N: "Necrotic", T: "Thunder", I: "Poison" };
const OZELLIK = { F: "Finesse", L: "Light", T: "Thrown", V: "Versatile", "2H": "Two-Handed", H: "Heavy", A: "Ammunition", LD: "Loading", R: "Reach", RLD: "Reload", BF: "Burst Fire" };

const ref = (s) => { const [ad, kaynak] = String(s).split("#")[0].split("|"); return { ad, kaynak: (kaynak || "").toUpperCase() }; };
const KUCUK = new Set(["of", "the", "and", "or", "a", "an", "with", "from", "to", "in", "on", "for"]);
const buyuk = (s) => { // "sprig of mistletoe" -> "Sprig of Mistletoe" (veride doğru yazımı varsa o)
  const x = (V.esya && V.esya[n(s)]) || (V.buyu && V.buyu[n(s)]);
  if (x) return x.name;
  return String(s).split(" ").map((w, i) => (i && KUCUK.has(w.toLowerCase()) ? w.toLowerCase() : w.replace(/^[a-z]/, (c) => c.toUpperCase()))).join(" ");
};
// eşya adı: oyuncular ve D&D Beyond kısa yazabilir ("Leather", "Studded Leather", "Arrows")
const esyaBul = (ad) => V.esya[n(ad)] || V.esya[n(ad + " armor")] || V.esya[n(String(ad).replace(/s$/, ""))] || null;
const mod = (p) => Math.floor((p - 10) / 2);
const pb = (L) => 2 + Math.floor((L - 1) / 4);
const etiketsiz = (s) => String(s).replace(/\{@\w+ ([^|}]+)[^}]*\}/g, "$1");
const ort = (zar) => { const m = String(zar).match(/^(\d+)d(\d+)$/); return m ? +m[1] * (+m[2] + 1) / 2 : +zar || 0; };
const kimlik = (k) => k.replace(/[^A-Za-z0-9]+/g, "_");

// ---------- kaynak süzgeci
let DIGER = false;
const izin = (src) => KAYNAK_ACIK.includes(src) || (DIGER && KAYNAK_DIGER.includes(src));
function dunya(Y) { DIGER = !!(Y && Y.dunyalar); }
export function siniflar(Y) { dunya(Y); return DIGER ? SINIFLAR.concat("Artificer").sort() : SINIFLAR; }
export function liste(Y, tur) { dunya(Y); return (V[tur] || []).filter((x) => izin(x.source)); }

// ---------- veri
const V = { yuklu: null, sinif: {} };
// 5e.tools "_copy": başka bir kaydı temel alıp üstüne değişiklik
function kopyaCoz(x, hepsi, derin = 0) {
  if (!x._copy || derin > 4) return x;
  const c = x._copy, taban0 = hepsi.find((y) => y.name === c.name && y.source === c.source);
  if (!taban0) return x;
  const taban = JSON.parse(JSON.stringify(kopyaCoz(taban0, hepsi, derin + 1)));
  const out = Object.assign(taban, x); delete out._copy;
  let ent = (taban.entries || []).slice();
  for (const m of [].concat((c._mod && c._mod.entries) || [])) {
    const items = [].concat(m.items || []);
    if (m.mode === "replaceArr") { const i = ent.findIndex((e) => e && e.name === m.replace); if (i > -1) ent.splice(i, 1, ...items); }
    else if (m.mode === "appendArr") ent = ent.concat(items);
    else if (m.mode === "prependArr") ent = items.concat(ent);
    else if (m.mode === "insertArr") ent.splice(m.index || 0, 0, ...items);
    else if (m.mode === "removeArr") ent = ent.filter((e) => !(e && [].concat(m.names || []).includes(e.name)));
  }
  out.entries = ent;
  return out;
}
export async function veriYukle() {
  if (!V.yuklu) V.yuklu = (async () => {
    const [bg, rc, ft, sx, sf, sa, se, look, ib, it, opt, dil] = await Promise.all([
      cek("backgrounds.json"), cek("races.json"), cek("feats.json"), cek("spells/spells-xphb.json"),
      cek("spells/spells-frhof.json"), cek("spells/spells-au.json"), cek("spells/spells-efa.json"),
      cek("generated/gendata-spell-source-lookup.json"), cek("items-base.json"), cek("items.json"),
      cek("optionalfeatures.json"), cek("languages.json")]);
    const k = (x) => KAYNAK_HEPSI.includes(x.source);
    V.background = bg.background.filter(k);
    V.tur = rc.race.filter(k).map((x) => kopyaCoz(x, rc.race));
    V.feat = ft.feat.filter(k);
    V.buyu = {}; for (const s of sx.spell.concat(sf.spell, sa.spell, se.spell)) if (!V.buyu[n(s.name)] || s.source === "XPHB") V.buyu[n(s.name)] = s;
    V.liste = look;
    V.esya = {}; for (const x of ib.baseitem.concat(it.item)) if (x.source === "XPHB" || !V.esya[n(x.name)]) V.esya[n(x.name)] = x;
    V.grup = {}; for (const g of it.itemGroup || []) if (g.source === "XPHB") V.grup[n(g.name)] = g;
    V.opt = opt.optionalfeature.filter(k);
    V.dil = dil.language.filter((l) => l.source === "XPHB" || l.source === "FRHoF");
  })();
  await V.yuklu;
  return V;
}
const araclar = (t) => Object.values(V.esya).filter((x) => (x.source === "XPHB" || x.source === "FRHoF") && String(x.type || "").split("|")[0] === t).map((x) => x.name).sort();
export async function sinifYukle(ad) {
  if (!V.sinif[ad]) V.sinif[ad] = cek(`class/class-${ad.toLowerCase()}.json`).then((d) => {
    const c = d.class.find((x) => x.source === "XPHB") || d.class.find((x) => KAYNAK_HEPSI.includes(x.source));
    return {
      c, feat: d.classFeature || [], sfeat: d.subclassFeature || [],
      subs: (d.subclass || []).filter((s) => s.className === ad && s.classSource === c.source && KAYNAK_HEPSI.includes(s.source)),
    };
  });
  return V.sinif[ad];
}

// ---------- yardımcılar
export const bulBg = (Y) => V.background && V.background.find((b) => b.name + "|" + b.source === Y.background);
export const bulTur = (Y) => V.tur && V.tur.find((r) => r.name + "|" + r.source === Y.tur);
export const bulFeat = (ad) => {
  const r = ref(ad), l = V.feat.filter((f) => n(f.name) === n(r.ad.split(";")[0]));
  return l.find((f) => f.source === r.kaynak) || l.find((f) => f.source === "XPHB") || l[0];
};
// Background feat'i: tek sabit feat, ya da "X ya da bir Dark Gift" gibi seçenekler
function bgFeatSecenek(bg) {
  const out = [];
  for (const alt of (bg && bg.feats) || []) for (const [k, v] of Object.entries(alt)) {
    if (k === "anyFromCategory") V.feat.filter((f) => v.category.includes(f.category)).forEach((f) => out.push(f.name.toLowerCase() + "|" + f.source.toLowerCase()));
    else if (v === true) out.push(k);
  }
  if (!out.length && bg) { // veri eksikse metinden: "Feat: {@feat Magic Initiate|XPHB} (Wizard)"
    const m = JSON.stringify(bg.entries || []).match(/"Feat:","entry":"\{@feat ([^|}]+)\|?([^}]*)\}(?: \(([^)]+)\))?/);
    if (m) out.push(m[1].toLowerCase() + (m[3] ? "; " + m[3].toLowerCase() : "") + "|" + (m[2] || "xphb").toLowerCase());
  }
  return out;
}
export function bgFeat(bg, Y) {
  const l = bgFeatSecenek(bg);
  if (l.length <= 1) return l[0] || null;
  const s = Y && (Y.secim["bg:featsec"] || [])[0];
  return s && l.includes(s) ? s : null;
}
export const bgFeatListesi = bgFeatSecenek;
function sinifOzellik(S, s) { // "Name|Class|ClassSrc|Level|Src"
  const [ad, , csrc, lv, src] = s.split("|");
  return S.feat.find((f) => f.name === ad && f.level === +lv && f.source === (src || csrc || "XPHB"));
}
function altOzellik(S, s) { // "Name|Class|ClassSrc|SubShort|SubSrc|Level|Src"
  const [ad, , , kisa, ssrc, lv, src] = s.split("|");
  return S.sfeat.find((f) => f.name === ad && f.level === +lv && f.subclassShortName === kisa && f.subclassSource === ssrc && f.source === (src || ssrc));
}
function tara(entries, cb, secenekIci) { // "options" blokları, alt özellik referansları, eşya kartları
  for (const e of entries || []) {
    if (!e || typeof e !== "object") continue;
    if (e.type === "options") { cb("secenek", e); continue; }
    if (!secenekIci && (e.type === "refSubclassFeature" || e.type === "refClassFeature")) cb("ref", e);
    if (e.type === "statblock" && e.tag === "item") cb("esya", e);
    if (e.entries) tara(e.entries, cb, secenekIci);
    if (e.items) tara(e.items, cb, secenekIci);
  }
}
export function altSinifSeviye(S) {
  const r = S.c.classFeatures.find((x) => typeof x === "object" && x.gainSubclassFeature);
  return r ? +r.classFeature.split("|")[3] : 3;
}
export function altSinif(S, Y) {
  const ad = (Y.secim.subclass || [])[0];
  if (!ad || Y.seviye < altSinifSeviye(S)) return null;
  return S.subs.find((s) => s.name === ad);
}
export function ozellikler(S, Y) { // seviyeye kadar kazanılan class ve subclass özellikleri
  const L = Y.seviye, out = [];
  for (const r of S.c.classFeatures) {
    const f = sinifOzellik(S, typeof r === "string" ? r : r.classFeature);
    if (f && f.level <= L) out.push({ f, alt: false });
  }
  const sub = altSinif(S, Y);
  if (sub) for (const s of sub.subclassFeatures || []) {
    const f = altOzellik(S, s);
    if (!f || f.level > L) continue;
    out.push({ f, alt: true, baslik: true });
    const gez = (entries, derin) => tara(entries, (tur, e) => {
      if (tur !== "ref" || derin > 3) return;
      const g = e.subclassFeature ? altOzellik(S, e.subclassFeature) : sinifOzellik(S, e.classFeature);
      if (g && g.level <= L && !out.some((o) => o.f === g)) { out.push({ f: g, alt: true }); gez(g.entries, derin + 1); }
    });
    gez(f.entries, 0);
  }
  return out;
}
function buyuSuzgec(filtre, sinirSeviye) { // "level=0|class=Wizard"
  const p = {}; for (const k of String(filtre).split("|")) { const [a, b] = k.split("="); p[a] = b; }
  const lv = p.level != null ? p.level.split(";").map(Number) : null, cl = p.class ? p.class.split(";") : null;
  return Object.values(V.buyu).filter((s) => izin(s.source) && (!lv || lv.includes(s.level)) && (sinirSeviye == null || s.level <= sinirSeviye) &&
    (!cl || cl.some((c) => sinifListesinde(s, c)))).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}
function sinifListesinde(s, sinif) {
  const e = (V.liste[s.source.toLowerCase()] || {})[n(s.name)];
  return !!(e && e.class && Object.values(e.class).some((m) => m[sinif] || Object.keys(m).some((k) => n(k) === n(sinif))));
}
function ekBuyuler(liste, L, anahtar, isim) { // additionalSpells: seviyeye kadar sabit büyüler + seçimler
  const sabit = [], secim = [];
  const set = isim ? (liste || []).find((x) => x.name && (n(isim).startsWith(n(x.name)) || n(x.name).startsWith(n(isim)))) : (liste || [])[0];
  if (!set) return { sabit, secim, set };
  const isle = (v, lv, tur) => {
    if (typeof v === "string") sabit.push({ ad: ref(v).ad, tur, lv });
    else if (v && v.choose) secim.push({ filtre: v.choose, adet: v.count || 1, tur, lv });
  };
  for (const tur of ["known", "prepared", "innate"]) {
    const o = set[tur]; if (!o) continue;
    for (const [k, v] of Object.entries(o)) {
      const lv = k === "_" ? 1 : parseInt(k.replace(/\D/g, ""), 10) || 1;
      if (lv > L) continue;
      const l2 = Array.isArray(v) ? v : Object.values(v).flatMap((g) => (Array.isArray(g) ? g : Object.values(g).flat()));
      l2.forEach((x) => isle(x, lv, tur));
    }
  }
  secim.forEach((s, i) => { s.k = anahtar + ":" + i; });
  return { sabit, secim, set };
}
function sinifBuyucu(S, Y) {
  const c = S.c, sub = altSinif(S, Y);
  if (c.casterProgression || c.cantripProgression || c.preparedSpellsProgression) return { kaynak: c, ab: c.spellcastingAbility, liste: c.name, tablo: c.classTableGroups };
  if (sub && sub.casterProgression) return { kaynak: sub, ab: sub.spellcastingAbility, liste: "Wizard", tablo: sub.subclassTableGroups };
  return null;
}
function slotlar(b, L) {
  if (!b) return [];
  for (const g of b.tablo || []) if (g.rowsSpellProgression) {
    const r = (g.rowsSpellProgression[L - 1] || []).map(Number);
    return r.slice(0, r.reduce((son, x, i) => (x > 0 ? i + 1 : son), 0));
  }
  for (const g of b.tablo || []) { // Warlock: Pact Magic
    const lab = (g.colLabels || []).map(etiketsiz), si = lab.indexOf("Spell Slots"), li = lab.indexOf("Slot Level");
    if (si > -1 && li > -1) { const r = g.rows[L - 1], sv = parseInt(etiketsiz(r[li]), 10); const a = new Array(sv).fill(0); a[sv - 1] = +r[si]; return a; }
  }
  return [];
}
function hucre(v) { // tablo hücresi: sayı, metin ya da {type: dice|bonusSpeed}
  if (v && typeof v === "object") {
    if (v.type === "dice") return v.toRoll.map((t) => t.number + "d" + t.faces).join("+");
    if (v.type === "bonusSpeed") return v.value;
    return v.value != null ? v.value : "";
  }
  return typeof v === "string" ? etiketsiz(v) : v;
}
function tabloSutun(S, Y, ad) {
  const gr = (S.c.classTableGroups || []).concat((altSinif(S, Y) || {}).subclassTableGroups || []);
  for (const g of gr) {
    const i = (g.colLabels || []).findIndex((x) => etiketsiz(x) === ad);
    if (i > -1 && g.rows) return hucre(g.rows[Y.seviye - 1][i]);
  }
  return null;
}
// ekipman seçenekleri: bazı kitaplarda "a"/"b" küçük harf
const ekipSec = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k.toUpperCase(), v]));
function sinifSkillListesi(S) { const s = (S.c.startingProficiencies.skills || [])[0]; return s && s.choose ? s.choose.from : Object.keys(SKILLS); }

// ---------- bağlam: seçimlerden türeyen ortak bilgiler (feat'ler, etkiler, species sürümü)
function baglam(Y, S) {
  dunya(Y);
  const sec = (k) => Y.secim[k] || [];
  const B = { Y, S, L: Y.seviye, sec, bg: bulBg(Y), tur: bulTur(Y), sub: S ? altSinif(S, Y) : null, featler: [], etkiler: [] };
  // species sürümü (Elf soyu, Tiefling mirası…)
  B.surum = sec("tur:surum")[0];
  B.turV = B.tur; B.turGirdi = B.tur ? B.tur.entries || [] : [];
  if (B.tur && B.surum) {
    const v = (B.tur._versions || []).find((x) => x.name && x.name.endsWith("; " + B.surum));
    if (v) {
      B.turV = Object.assign({}, B.tur, v); B.turGirdi = B.turGirdi.slice();
      for (const m of [].concat((v._mod && v._mod.entries) || [])) if (m.mode === "replaceArr") { const i = B.turGirdi.findIndex((e) => e && e.name === m.replace); if (i > -1) B.turGirdi.splice(i, 1, ...[].concat(m.items)); }
    }
  }
  // feat'ler: background, species (Human), ASI yerine seçilen, fighting style
  const fr = bgFeat(B.bg, Y); if (fr) B.featler.push({ f: bulFeat(fr), k: "bg:feat", spec: fr.split("|")[0].split(";")[1] });
  if (sec("tur:feat")[0]) B.featler.push({ f: bulFeat(sec("tur:feat")[0]), k: "tur:featx" });
  for (const [k, v] of Object.entries(Y.secim)) {
    if (/^sinif:asi:\d+$/.test(k) && v[0]) B.featler.push({ f: bulFeat(v[0]), k: k + "x" });
    const m = k.match(/^sinif:fp:.+:(\d+)$/); if (m) v.forEach((x) => B.featler.push({ f: bulFeat(x), k: "sinif:fpx:" + m[1] }));
  }
  B.featler = B.featler.filter((x) => x.f);
  // etkiler (kural-etki.js)
  const ekle = (anahtar, kaynak) => { const e = ETKI[anahtar]; if (e && !B.etkiler.some((x) => x.anahtar === anahtar)) B.etkiler.push({ anahtar, e, id: "etki:" + kimlik(anahtar), kaynak }); };
  if (S) {
    for (const { f } of ozellikler(S, Y)) ekle(`${S.c.name}|${f.subclassShortName || ""}|${f.name}`, f.name);
    for (const [k, v] of Object.entries(Y.secim)) {
      if (k.startsWith("sinif:sec:")) v.forEach((x) => ekle("sec:" + x, x));
      if (k.startsWith("sinif:opt:")) v.forEach((x) => ekle("opt:" + x, x));
    }
  }
  for (const x of B.featler) ekle("feat:" + x.f.name, x.f.name);
  if (B.tur) for (const e of B.turGirdi) if (e && e.name) ekle("tur:" + B.tur.name + "|" + e.name, e.name);
  // etkilerin kendi seçenekleri (Owl, Bane, Guardian…) de etki olabilir
  for (let i = 0; i < B.etkiler.length; i++) { const x = B.etkiler[i]; if (x.e.secenek) sec(x.id + ":sec").forEach((v) => ekle("sec:" + v, v)); }
  return B;
}
const tumEtki = (B, alan) => B.etkiler.filter((x) => x.e[alan] != null);

// proficiency kümeleri
function profSkill(B, haric) {
  const s = new Set(), Y = B.Y;
  if (B.bg) for (const sp of B.bg.skillProficiencies || []) Object.keys(sp).forEach((k) => sp[k] === true && SKILLS[k] && s.add(k));
  for (const sp of (B.turV && B.turV.skillProficiencies) || []) Object.keys(sp).forEach((k) => sp[k] === true && SKILLS[k] && s.add(k));
  for (const x of B.featler) for (const sp of x.f.skillProficiencies || []) Object.keys(sp).forEach((k) => sp[k] === true && SKILLS[k] && s.add(k));
  for (const x of tumEtki(B, "skill")) x.e.skill.forEach((k) => s.add(k));
  for (const [k, v] of Object.entries(Y.secim)) if (k !== haric && /:(skill|stl)$/.test(k)) v.forEach((x) => SKILLS[x] && s.add(x));
  return s;
}
function profArac(B) {
  const s = new Set(), S = B.S;
  if (S) for (const t of S.c.startingProficiencies.toolProficiencies || []) Object.keys(t).forEach((a) => t[a] === true && s.add(buyuk(a)));
  if (B.bg) for (const t of B.bg.toolProficiencies || []) Object.keys(t).forEach((a) => t[a] === true && s.add(buyuk(a)));
  for (const x of B.featler) for (const t of x.f.toolProficiencies || []) Object.keys(t).forEach((a) => t[a] === true && s.add(buyuk(a)));
  for (const [k, v] of Object.entries(B.Y.secim)) if (/:(tool|stl)$/.test(k) || k === "bg:tool" || k === "sinif:tool") v.forEach((x) => !SKILLS[x] && s.add(String(x).replace(/^arac:/, "")));
  return s;
}

// ---------- seçim soruları
// Her soru: { k, adim, tur: tek|coklu|asi|bgab, baslik, aciklama, adet, secenekler[{d, ad, alt, ack, devre}], ack }
const buyuSecenek = (s) => ({ d: s.name, ad: s.name, alt: s.level ? "Sv " + s.level : "Cantrip", ack: "buyu|" + s.name });
const skillSecenek = (x) => ({ d: x, ad: SKILLS[x][0], alt: SKILLS[x][1].toUpperCase(), ack: "skill|" + SKILLS[x][0] });
const aracSecenek = (a, onEk) => ({ d: (onEk || "") + a, ad: a, ack: "esya|" + a });
function featSorulari(feat, k, ek) {
  const out = [];
  if (!feat) return out;
  const ackF = "feat|" + feat.name;
  (feat.ability || []).forEach((a, i) => {
    if (!a.choose || i > 0) return; // alternatifli ability'lerde ilki (feat'lerde tek seçenek var)
    if (feat.name === "Ability Score Improvement") { out.push({ k: k + ":asi", tur: "asi", baslik: "Ability Score Improvement", aciklama: "Bir ability'ye +2 ya da iki ability'ye +1 (en fazla 20).", adet: 2, secenekler: AB.map((x) => ({ d: x, ad: AB_AD[x] })) }); return; }
    out.push({ k: k + ":ab", tur: "tek", baslik: feat.name + ": +" + (a.choose.amount || 1) + " ability", aciklama: etiketsiz(a.choose.entry || "Hangi ability artsın?"), adet: a.choose.count || 1, secenekler: a.choose.from.map((x) => ({ d: x, ad: AB_AD[x] })), ack: ackF });
  });
  for (const sp of feat.skillProficiencies || []) {
    if (sp.choose) out.push({ k: k + ":skill", tur: "coklu", baslik: feat.name + ": skill", adet: sp.choose.count || 1, secenekler: sp.choose.from.map(skillSecenek), ack: ackF });
    if (sp.any) out.push({ k: k + ":skill", tur: "coklu", baslik: feat.name + ": skill", adet: sp.any, secenekler: Object.keys(SKILLS).map(skillSecenek), ack: ackF });
  }
  for (const ex of feat.expertise || []) if (ex.anyProficientSkill || ex.anySkill) out.push({ k: k + ":exp", tur: "coklu", baslik: feat.name + ": Expertise", aciklama: "Proficient olduğun bir skill: Proficiency Bonus iki kez eklenir.", adet: ex.anyProficientSkill || ex.anySkill, secenekler: [], dinamik: "expertise", ack: ackF });
  for (const st of feat.skillToolLanguageProficiencies || []) for (const c of st.choose || []) {
    const s = [];
    if (c.from.includes("anySkill")) Object.keys(SKILLS).forEach((x) => s.push(skillSecenek(x)));
    if (c.from.includes("anyTool")) ["AT", "T", "GS", "INS"].forEach((t) => araclar(t).forEach((a) => s.push(aracSecenek(a, "arac:"))));
    out.push({ k: k + ":stl", tur: "coklu", baslik: feat.name + ": skill ya da tool", adet: c.count || 1, secenekler: s, ack: ackF });
  }
  for (const tp of feat.toolProficiencies || []) {
    if (tp.choose) out.push({ k: k + ":tool", tur: "coklu", baslik: feat.name + ": tool", adet: tp.choose.count || 1, secenekler: tp.choose.from.map((a) => aracSecenek(buyuk(a), "arac:")), ack: ackF });
    for (const [alan, t, ad] of [["anyMusicalInstrument", "INS", "müzik aleti"], ["anyArtisansTool", "AT", "artisan's tool"], ["anyGamingSet", "GS", "gaming set"]]) if (tp[alan]) out.push({ k: k + ":tool", tur: "coklu", baslik: feat.name + ": " + ad, adet: tp[alan], secenekler: araclar(t).map((a) => aracSecenek(a, "arac:")), ack: ackF });
  }
  for (const lp of feat.languageProficiencies || []) if (lp.any) out.push({ k: k + ":dil", tur: "coklu", baslik: feat.name + ": dil", adet: lp.any, secenekler: V.dil.filter((l) => l.name !== "Common").map((l) => ({ d: l.name, ad: l.name, alt: l.type === "rare" ? "rare" : "" })), ack: ackF });
  for (const sv of feat.savingThrowProficiencies || []) if (sv.choose) out.push({ k: k + ":save", tur: "tek", baslik: feat.name + ": saving throw", adet: 1, secenekler: sv.choose.from.map((x) => ({ d: x, ad: AB_AD[x] })), ack: ackF });
  for (const r of feat.resist || []) if (r && r.choose) out.push({ k: k + ":direnc", tur: "tek", baslik: feat.name + ": direnç", adet: 1, secenekler: r.choose.from.map((x) => ({ d: buyuk(x), ad: buyuk(x) })), ack: ackF });
  const ad = feat.additionalSpells; // Magic Initiate gibi
  if (ad && ad.length) {
    let isim = null;
    if (ad.length > 1) {
      if (ek && ek.spec) isim = (ad.find((x) => n(x.name).startsWith(n(ek.spec))) || {}).name;
      else {
        out.push({ k: k + ":set", tur: "tek", baslik: feat.name + ": hangi liste", adet: 1, secenekler: ad.map((x) => ({ d: x.name, ad: x.name })), ack: ackF });
        isim = (ek && ek.Y && (ek.Y.secim[k + ":set"] || [])[0]) || null;
      }
      if (!isim) return out;
    }
    const e = ekBuyuler(ad, 20, k + ":sp", isim);
    if (e.set && e.set.ability && e.set.ability.choose) out.push({ k: k + ":spab", tur: "tek", baslik: feat.name + ": büyü ability'si", aciklama: "Bu büyüleri hangi ability ile yaparsın? Genelde en yüksek zihinsel ability'n.", adet: 1, secenekler: e.set.ability.choose.map((x) => ({ d: x, ad: AB_AD[x] })), ack: ackF });
    for (const s of e.secim) out.push({ k: s.k, tur: "coklu", adim: "buyu", baslik: feat.name + ": " + (/level=0/.test(s.filtre) ? "cantrip" : "büyü"), adet: s.adet, secenekler: buyuSuzgec(s.filtre).map(buyuSecenek), ack: ackF });
  }
  return out;
}
function etkiSorulari(B, x, adim) {
  const out = [], e = x.e, k = x.id + ":", Y = B.Y, S = B.S, bas = x.kaynak;
  if (e.skillSec) { const f = e.skillSec.from === "sinif" && S ? sinifSkillListesi(S) : Array.isArray(e.skillSec.from) ? e.skillSec.from : Object.keys(SKILLS); out.push({ k: k + "skill", tur: "coklu", baslik: bas + ": skill", adet: e.skillSec.adet, secenekler: f.map(skillSecenek) }); }
  if (e.toolSec) out.push({ k: k + "tool", tur: "coklu", baslik: bas + ": tool", adet: e.toolSec.adet, secenekler: araclar(e.toolSec.tur).map((a) => aracSecenek(a)) });
  if (e.dilSec) out.push({ k: k + "dil", tur: "coklu", baslik: bas + ": dil", adet: e.dilSec, secenekler: V.dil.filter((l) => l.name !== "Common").map((l) => ({ d: l.name, ad: l.name, alt: l.type === "rare" ? "rare" : "" })) });
  if (e.cantripSec) out.push({ k: k + "sp:0", tur: "coklu", adim: "buyu", baslik: bas + ": cantrip", adet: e.cantripSec.adet, secenekler: buyuSuzgec("level=0|class=" + e.cantripSec.liste).map(buyuSecenek) });
  if (e.direncSec) out.push({ k: k + "direnc", tur: "tek", baslik: bas + ": direnç", adet: 1, secenekler: e.direncSec.map((d) => ({ d, ad: d })) });
  if (e.secenek) out.push({ k: k + "sec", tur: "tek", baslik: e.secenek.baslik || bas, adet: 1, secenekler: e.secenek.liste.map(([d, ...alt]) => ({ d, ad: d, alt: alt.join(" · ") })) });
  out.forEach((q) => { q.adim = q.adim || adim; q.ack = q.ack || (S ? "ozellik|" + bas + "|" + S.c.name : null); });
  return out;
}
export function secimler(Y, S) {
  const B = baglam(Y, S), out = [], L = Y.seviye, sec = B.sec;
  const ekle = (adim, q) => { q.adim = q.adim || adim; out.push(q); };
  const topla = (adim, l) => l.forEach((q) => ekle(adim, q));
  // --- Background
  const bg = B.bg;
  if (bg) {
    ekle("bg", { k: "bg:ab", tur: "bgab", baslik: "Ability artışı", aciklama: "2024 kuralı: bu üç ability'den birine +2 ve başka birine +1 ver, ya da üçüne de +1 ver.", secenekler: bg.ability[0].choose.weighted.from, adet: 3 });
    for (const t of bg.toolProficiencies || []) for (const [alan, tt] of [["anyArtisansTool", "AT"], ["anyGamingSet", "GS"], ["anyMusicalInstrument", "INS"]]) if (t[alan]) ekle("bg", { k: "bg:tool", tur: "coklu", baslik: "Background tool", adet: t[alan], secenekler: araclar(tt).map((a) => aracSecenek(a)) });
    const fl = bgFeatSecenek(bg);
    if (fl.length > 1) ekle("bg", { k: "bg:featsec", tur: "tek", baslik: "Background feat'i", aciklama: "Bu background'da feat seçimlik.", adet: 1, secenekler: fl.map((r) => { const f = bulFeat(r); return { d: r, ad: f ? f.name : r, alt: f && f.category === "DG" ? "Dark Gift" : "", ack: "feat|" + (f ? f.name : r) }; }) });
    const fr = bgFeat(bg, Y);
    if (fr) topla("bg", featSorulari(bulFeat(fr), "bg:feat", { spec: (fr.split("|")[0].split(";")[1] || "").trim() || null, Y }));
    const be = ekipSec(bg.startingEquipment[0]);
    ekle("ekip", { k: "bg:ekip", tur: "tek", baslik: bg.name + " ekipmanı", aciklama: "A: hazır paket (eşyalar + biraz altın). B: sadece altın; eşyayı kendin alırsın.", adet: 1, secenekler: Object.keys(be).map((x) => ({ d: x, ad: x === "A" ? "A: eşyalar" : "B: sadece altın", alt: ekipOzet(be[x]) })) });
  }
  // --- Species
  const tur = B.tur;
  if (tur) {
    if (tur._versions && tur._versions.length && tur._versions[0].name) ekle("tur", { k: "tur:surum", tur: "tek", baslik: tur.name + " soyu", aciklama: "Bu species'in alt kolları farklı yetenekler verir.", adet: 1, secenekler: tur._versions.map((v) => ({ d: v.name.split("; ")[1], ad: v.name.split("; ")[1] })) });
    if (tur.name === "Dragonborn") ekle("tur", { k: "tur:ejderha", tur: "tek", baslik: "Draconic Ancestry", aciklama: "Atan ejderha türü: Breath Weapon'ının hasar türünü ve dayanıklı olduğun hasarı belirler.", adet: 1, secenekler: EJDERHA.map(([r, h]) => ({ d: r, ad: r + " Dragon", alt: h })) });
    if ((tur.size || []).length > 1) ekle("tur", { k: "tur:boy", tur: "tek", baslik: "Boy", adet: 1, secenekler: tur.size.map((s) => ({ d: s, ad: s === "S" ? "Small" : "Medium" })) });
    for (const sp of B.turV.skillProficiencies || []) {
      if (sp.choose) ekle("tur", { k: "tur:skill", tur: (sp.choose.count || 1) > 1 ? "coklu" : "tek", baslik: tur.name + ": skill", adet: sp.choose.count || 1, secenekler: sp.choose.from.map(skillSecenek) });
      if (sp.any) ekle("tur", { k: "tur:skill", tur: "coklu", baslik: tur.name + ": skill", adet: sp.any, secenekler: Object.keys(SKILLS).map(skillSecenek) });
    }
    for (const tp of B.turV.toolProficiencies || []) if (tp.any) ekle("tur", { k: "tur:tool", tur: "coklu", baslik: tur.name + ": tool", adet: tp.any, secenekler: ["AT", "T", "GS", "INS"].flatMap((t) => araclar(t)).map((a) => aracSecenek(a)) });
    for (const r of B.turV.resist || []) if (r && r.choose) ekle("tur", { k: "tur:direnc", tur: "tek", baslik: tur.name + ": direnç", adet: 1, secenekler: r.choose.from.map((x) => ({ d: buyuk(x), ad: buyuk(x) })) });
    for (const fp of B.turV.feats || []) if (fp.anyFromCategory) {
      const bgF = bulFeat(bgFeat(bg, Y) || "");
      ekle("tur", { k: "tur:feat", tur: "tek", baslik: tur.name + ": origin feat", aciklama: "Human (Versatile): bir Origin feat daha.", adet: 1, secenekler: V.feat.filter((f) => f.category === "O" && izin(f.source)).map((f) => ({ d: f.name + "|" + f.source, ad: f.name, alt: KAYNAK_AD[f.source] || "", ack: "feat|" + f.name, devre: bgF && bgF.name === f.name && !f.repeatable ? "background'dan zaten var" : null })) });
      const f = sec("tur:feat")[0]; if (f) topla("tur", featSorulari(bulFeat(f), "tur:featx", { Y }));
    }
    if (B.turV.additionalSpells) {
      const cok = B.turV.additionalSpells.length > 1, e = ekBuyuler(B.turV.additionalSpells, L, "tur:sp", cok ? B.surum : null);
      if (e.set && e.set.ability && e.set.ability.choose && (!cok || B.surum)) ekle("tur", { k: "tur:spab", tur: "tek", baslik: tur.name + " büyüleri için ability", aciklama: "Species büyülerini hangi ability ile yaparsın (Int, Wis ya da Cha)?", adet: 1, secenekler: e.set.ability.choose.map((x) => ({ d: x, ad: AB_AD[x] })) });
      for (const s of e.secim) ekle("buyu", { k: s.k, tur: "coklu", baslik: tur.name + ": " + (/level=0/.test(s.filtre) ? "cantrip" : "büyü"), adet: s.adet, secenekler: buyuSuzgec(s.filtre).map(buyuSecenek) });
    }
  }
  ekle("tur", { k: "dil", tur: "coklu", baslik: "Diller", aciklama: "Herkes Common bilir; üstüne iki standart dil seç. Faerûn'un bölge dilleri (Chondathan, Illuskan…) de standart dildir.", adet: 2, secenekler: V.dil.filter((l) => l.type === "standard" && l.name !== "Common").map((l) => ({ d: l.name, ad: l.name, alt: l.source === "FRHoF" ? "Faerûn" : "" })) });
  // --- Class
  if (S) {
    const c = S.c, sp = c.startingProficiencies;
    for (const s of sp.skills || []) {
      if (s.choose) ekle("sinif", { k: "sinif:skill", tur: "coklu", baslik: c.name + " skill'leri", aciklama: "Bu skill'lerde proficiency kazanırsın: zarına Proficiency Bonus eklenir.", adet: s.choose.count, secenekler: s.choose.from.map(skillSecenek) });
      if (s.any) ekle("sinif", { k: "sinif:skill", tur: "coklu", baslik: c.name + " skill'leri", adet: s.any, secenekler: Object.keys(SKILLS).map(skillSecenek) });
    }
    const tp = sp.toolProficiencies || [];
    if (tp.length > 1 && tp.every((t) => t.anyArtisansTool || t.anyMusicalInstrument)) ekle("sinif", { k: "sinif:tool", tur: "tek", baslik: c.name + " tool", aciklama: "Bir artisan's tool ya da bir müzik aleti.", adet: 1, secenekler: araclar("AT").concat(araclar("INS")).map((a) => aracSecenek(a)) });
    else for (const t of tp) if (t.anyMusicalInstrument || t.anyArtisansTool) ekle("sinif", { k: "sinif:tool", tur: "coklu", baslik: c.name + ": tool", adet: t.anyMusicalInstrument || t.anyArtisansTool, secenekler: araclar(t.anyMusicalInstrument ? "INS" : "AT").map((a) => aracSecenek(a)) });
    const ssv = altSinifSeviye(S);
    if (L >= ssv) ekle("sinif", { k: "subclass", tur: "tek", sub: true, baslik: "Subclass", aciklama: `${ssv}. seviyede class'ının bir koluna girersin.`, adet: 1, secenekler: S.subs.filter((s) => izin(s.source)).map((s) => ({ d: s.name, ad: s.name, alt: KAYNAK_AD[s.source] || "" })) });
    for (const [lv, adet] of Object.entries(EXPERTISE[c.name] || {})) if (L >= +lv) ekle("sinif", { k: "sinif:exp:" + lv, tur: "coklu", baslik: `Expertise (Sv ${lv})`, aciklama: "Proficient olduğun skill'lerden seç: Proficiency Bonus iki kez eklenir." + (c.name === "Wizard" ? " (Scholar: Arcana, History, Investigation, Medicine, Nature ya da Religion)" : ""), adet, secenekler: [], dinamik: "expertise", scholar: c.name === "Wizard" });
    const wm = (MASTERY_SABIT[c.name] || +tabloSutun(S, Y, "Weapon Mastery") || 0) + tumEtki(B, "masteryEk").reduce((t, x) => t + x.e.masteryEk, 0);
    if (wm) ekle("sinif", { k: "sinif:mastery", tur: "coklu", baslik: "Weapon Mastery", aciklama: "Bu silah türlerinin özel ustalık etkisini kullanabilirsin (Vex, Nick, Sap…). Long rest'te değiştirebilirsin.", adet: wm, secenekler: silahlar(B).map((x) => ({ d: x.name, ad: x.name, alt: ref(x.mastery[0]).ad, ack: "mastery|" + ref(x.mastery[0]).ad })) });
    for (const fp of c.featProgression || []) for (const [lv, adet] of Object.entries(fp.progression)) if (L >= +lv) {
      ekle("sinif", { k: "sinif:fp:" + fp.name + ":" + lv, tur: adet > 1 ? "coklu" : "tek", baslik: fp.name, adet, secenekler: V.feat.filter((f) => fp.category.includes(f.category) && izin(f.source)).map((f) => ({ d: f.name + "|" + f.source, ad: f.name, alt: KAYNAK_AD[f.source] || "", ack: "feat|" + f.name })) });
      for (const f of sec("sinif:fp:" + fp.name + ":" + lv)) topla("sinif", featSorulari(bulFeat(f), "sinif:fpx:" + lv, { Y }));
    }
    for (const kaynak of [c, B.sub].filter(Boolean)) for (const op of kaynak.optionalfeatureProgression || []) {
      const adet = Array.isArray(op.progression) ? op.progression[L - 1] : Object.entries(op.progression).filter(([lv]) => +lv <= L).reduce((m, [, v]) => Math.max(m, v), 0);
      if (adet) ekle("sinif", { k: "sinif:opt:" + op.name, tur: "coklu", baslik: op.name, adet, secenekler: V.opt.filter((o) => izin(o.source) && o.featureType.some((t) => op.featureType.includes(t)) && optUygun(o, L, Y)).map((o) => ({ d: o.name, ad: o.name, alt: KAYNAK_AD[o.source] || "", ack: "ozellik|" + o.name + "|" + c.name })) });
    }
    for (const { f } of ozellikler(S, Y)) {
      if (f.name === "Ability Score Improvement" || f.name === "Epic Boon") {
        const k = "sinif:asi:" + f.level, kat = f.name === "Epic Boon" ? ["EB"] : ["G"];
        ekle("sinif", { k, tur: "tek", baslik: `${f.name === "Epic Boon" ? "Epic Boon" : "Feat"} (Sv ${f.level})`, aciklama: f.name === "Epic Boon" ? "Bir Epic Boon feat'i." : "Ability Score Improvement ya da istediğin bir General feat.", adet: 1, secenekler: V.feat.filter((x) => kat.includes(x.category) && izin(x.source) && featUygun(x, L)).map((x) => ({ d: x.name + "|" + x.source, ad: x.name, alt: KAYNAK_AD[x.source] || "", ack: "feat|" + x.name })) });
        const fs = sec(k)[0]; if (fs) topla("sinif", featSorulari(bulFeat(fs), k + "x", { Y }));
        continue;
      }
      tara(f.entries, (t2, e) => {
        if (t2 !== "secenek" || e.entries.every((r) => r.type === "refOptionalfeature")) return; // invocation vb. ayrı soruluyor
        const ops = e.entries.map((r) => r.classFeature ? sinifOzellik(S, r.classFeature) : r.subclassFeature ? altOzellik(S, r.subclassFeature) : null).filter(Boolean);
        if (ops.length) ekle("sinif", { k: "sinif:sec:" + f.name + ":" + f.level, tur: (e.count || 1) > 1 ? "coklu" : "tek", baslik: f.name, aciklama: "Bu özelliğin seçeneklerinden " + (e.count || 1) + " tanesini seç.", adet: e.count || 1, secenekler: ops.map((o) => ({ d: o.name, ad: o.name, ack: "ozellik|" + o.name + "|" + c.name, entries: o.entries })) });
      });
    }
    // büyüler
    const b = sinifBuyucu(S, Y);
    if (b) {
      const sl = slotlar(b, L), maxSv = sl.length, kk = b.kaynak;
      const her = herZamanHazir(B).map((x) => n(x));
      const cn = (kk.cantripProgression ? kk.cantripProgression[L - 1] : 0) + tumEtki(B, "cantripEk").reduce((t, x) => t + x.e.cantripEk, 0);
      if (cn) ekle("buyu", { k: "buyu:cantrip", tur: "coklu", baslik: "Cantrip'ler", aciklama: "Cantrip'ler slot harcamadan, istediğin kadar yapılır.", adet: cn, secenekler: buyuSuzgec("level=0|class=" + b.liste).map(buyuSecenek) });
      const hz = kk.preparedSpellsProgression ? kk.preparedSpellsProgression[L - 1] : 0;
      if (c.name === "Wizard") {
        ekle("buyu", { k: "buyu:kitap", tur: "coklu", baslik: "Spellbook", aciklama: "Wizard büyülerini kitabında taşır. Her gün bunlardan bir kısmını hazırlar.", adet: 6 + 2 * (L - 1), secenekler: buyuSuzgec("level=" + aralik(1, maxSv) + "|class=Wizard").map(buyuSecenek) });
        ekle("buyu", { k: "buyu:hazir", tur: "coklu", baslik: "Hazır büyüler", aciklama: "Spellbook'undan bugün hazırladıkların (Long Rest'te değiştirebilirsin).", adet: hz, secenekler: sec("buyu:kitap").map((x) => V.buyu[n(x)]).filter(Boolean).map(buyuSecenek) });
      } else if (hz) ekle("buyu", { k: "buyu:hazir", tur: "coklu", baslik: "Hazır büyüler", aciklama: `En fazla ${maxSv}. seviye büyü. Her zaman hazır olanlar (${her.length ? her.map(buyuk).join(", ") : "yok"}) bu sayıya dahil değil.`, adet: hz, secenekler: buyuSuzgec("level=" + aralik(1, maxSv) + "|class=" + b.liste).filter((s) => !her.includes(n(s.name))).map(buyuSecenek) });
    }
    const ce = ekipSec(c.startingEquipment.defaultData[0]);
    ekle("ekip", { k: "sinif:ekip", tur: "tek", baslik: c.name + " ekipmanı", aciklama: "Hazır paketlerden birini seç. Sadece altın alan seçenek, eşyaları kendin alacağın anlamına gelir.", adet: 1, secenekler: Object.keys(ce).map((x) => ({ d: x, ad: x, alt: ekipOzet(ce[x]) })) });
    const subN = B.sub;
    if (subN && (subN.additionalSpells || []).length > 1 && subN.additionalSpells.every((x) => x.name)) ekle("sinif", { k: "sinif:altset", tur: "tek", baslik: subN.name + ": tür", aciklama: "Her zaman hazır büyülerin bu seçime göre değişir.", adet: 1, secenekler: subN.additionalSpells.map((x) => ({ d: x.name, ad: x.name, alt: Object.values(x.prepared || {}).flat().map((y) => buyuk(ref(y).ad)).slice(0, 3).join(", ") })) });
  }
  // etkilerin soruları (kural-etki.js)
  for (const x of B.etkiler) topla(null, etkiSorulari(B, x, x.anahtar.startsWith("tur:") ? "tur" : "sinif"));
  // zaten sahip olunan sabit proficiency'ler için yedek seçim (Arcane Archer Lore, Artificer tool'ları)
  for (const x of B.etkiler) {
    if (x.e.skill && x.e.skillYedek) { const baska = profSkillEtkisiz(B, x); const cift = x.e.skill.filter((s) => baska.has(s)).length; if (cift) ekle("sinif", { k: x.id + ":yedek:skill", tur: "coklu", baslik: x.kaynak + ": yerine skill", aciklama: "Bu özelliğin verdiği skill'lerden birine zaten sahipsin; yerine başka bir skill seç.", adet: cift, secenekler: sinifSkillListesi(S).map(skillSecenek) }); }
    if (x.e.tool && x.e.toolYedek) { const var_ = profArac(B); const cift = x.e.tool.filter((t) => var_.has(t)).length; if (cift) ekle("sinif", { k: x.id + ":yedek:tool", tur: "coklu", baslik: x.kaynak + ": yerine tool", aciklama: "Bu tool'a zaten sahipsin; yerine başka bir artisan's tool seç.", adet: cift, secenekler: araclar(x.e.toolYedek).map((a) => aracSecenek(a)) }); }
    if (x.e.saveProf && x.e.saveYedek && S && Array.isArray(x.e.saveProf) && x.e.saveProf.every((a) => S.c.proficiency.includes(a))) ekle("sinif", { k: x.id + ":save", tur: "tek", baslik: x.kaynak + ": yerine saving throw", adet: 1, secenekler: x.e.saveYedek.map((a) => ({ d: a, ad: AB_AD[a] })) });
  }
  // ekipmandaki grup eşyaları (Druidic Focus, müzik aleti…)
  for (const [kk, l] of [["sinif:ekip", S && ekipSec(S.c.startingEquipment.defaultData[0])], ["bg:ekip", bg && ekipSec(bg.startingEquipment[0])]]) {
    const s = sec(kk)[0]; if (!l || !s || !l[s]) continue;
    l[s].forEach((it, i) => {
      if (it.displayName && /same as above/i.test(it.displayName)) return; // background tool'unun aynısı: ayrıca sorulmaz
      const g = it.item && V.grup[n(ref(it.item).ad)];
      const tipler = it.equipmentType ? [it.equipmentType] : it.equipmentTypes || null;
      const ops = g ? g.items.map((x) => buyuk(ref(x).ad)) : tipler ? tipler.flatMap((t) => araclar({ instrumentMusical: "INS", toolArtisan: "AT", setGaming: "GS" }[t] || "")) : null;
      if (ops && ops.length) out.push({ k: kk + ":" + i, adim: "ekip", tur: "tek", baslik: (g ? g.name : "Eşya") + " seç", adet: 1, secenekler: ops.map((a) => aracSecenek(a)) });
    });
  }
  // dinamik: expertise seçenekleri proficient skill'lerden
  const prof = profSkill(B, null);
  for (const q of out) if (q.dinamik === "expertise") q.secenekler = [...prof].filter((x) => !q.scholar || SCHOLAR.includes(x)).sort().map(skillSecenek);
  // aynı skill iki kaynaktan alınamaz
  const sabitSkill = profSabit(B);
  const skillSoru = out.filter((q) => !q.dinamik && q.secenekler.some((o) => SKILLS[o.d]));
  for (const q of skillSoru) {
    const baska = new Set(sabitSkill);
    for (const r of skillSoru) if (r !== q) sec(r.k).forEach((x) => baska.add(x));
    for (const o of q.secenekler) if (SKILLS[o.d] && baska.has(o.d)) o.devre = sabitSkill.has(o.d) ? "başka bir kaynaktan zaten var" : "başka bir seçimden zaten var";
  }
  for (const q of out) {
    const v = sec(q.k);
    q.deger = v;
    if (q.tur === "bgab") q.tamam = (v[0] === "21" && v[1] && v[2] && v[1] !== v[2]) || v[0] === "111";
    else if (q.tur === "asi") q.tamam = v.length === 2;
    else q.tamam = v.length === Math.min(q.adet, q.secenekler.length) && v.every((x) => q.secenekler.some((o) => o.d === x && !o.devre));
  }
  return out;
}
const profSabit = (B) => { // seçimle değil kaynağından sabit gelen skill'ler
  const s = new Set();
  if (B.bg) for (const sp of B.bg.skillProficiencies || []) Object.keys(sp).forEach((k) => sp[k] === true && SKILLS[k] && s.add(k));
  for (const x of B.featler) for (const sp of x.f.skillProficiencies || []) Object.keys(sp).forEach((k) => sp[k] === true && SKILLS[k] && s.add(k));
  for (const x of tumEtki(B, "skill")) x.e.skill.forEach((k) => s.add(k));
  return s;
};
function profSkillEtkisiz(B, x) { const s = new Set(); const B2 = Object.assign({}, B, { etkiler: B.etkiler.filter((y) => y !== x) }); profSkill(B2, null).forEach((k) => s.add(k)); return s; }
const aralik = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r.join(";") || "99"; };
function optUygun(o, L, Y) {
  for (const p of o.prerequisite || []) {
    if (p.level && (p.level.level || p.level) > L) return false;
    if (p.pact && !Object.values(Y.secim).flat().includes("Pact of the " + p.pact)) return false;
    if (p.optionalfeature && !p.optionalfeature.some((r) => Object.values(Y.secim).flat().some((v) => n(v) === n(ref(r).ad)))) return false;
  }
  return true;
}
function featUygun(f, L) { return (f.prerequisite || [{}]).some((p) => !p.level || (p.level.level || p.level) <= L); }
export function ekipOzet(l) { return (l || []).map((x) => typeof x === "string" ? buyuk(ref(x).ad) : x.item ? (x.quantity > 1 ? x.quantity + "× " : "") + (x.displayName || buyuk(ref(x.item).ad)) : x.value ? x.value / 100 + " gp" : x.special || "").filter(Boolean).join(", "); }
function herZamanHazir(B) {
  const S = B.S, L = B.L, out = [], alt = (B.Y.secim["sinif:altset"] || [])[0];
  for (const k of [S.c, B.sub].filter(Boolean)) for (const e of k.additionalSpells || []) {
    if (e.name && k.additionalSpells.length > 1 && e.name !== alt) continue;
    for (const tur of ["prepared", "known"]) for (const [lv, v] of Object.entries(e[tur] || {})) if ((parseInt(lv.replace(/\D/g, ""), 10) || 1) <= L && Array.isArray(v)) v.forEach((x) => typeof x === "string" && out.push(ref(x).ad));
  }
  return out;
}

// ---------- silahlar
function ekSilahProf(B) {
  const l = []; tumEtki(B, "silah").forEach((x) => l.push(...x.e.silah));
  for (const x of B.featler) for (const w of x.f.weaponProficiencies || []) Object.keys(w).forEach((k) => w[k] === true && l.push(k));
  return l;
}
function silahYetkin(B, x) {
  const S = B.S, cat = x.weaponCategory, props = (x.property || []).map((p) => String(p).split("|")[0]), menzilli = String(x.type).startsWith("R");
  for (const w of (S.c.startingProficiencies.weapons || []).concat(ekSilahProf(B))) {
    if (w === "simple" && cat === "simple") return true;
    if (w === "martial" && cat === "martial") return true;
    if (w === "martial ranged" && cat === "martial" && menzilli) return true;
    if (w === "martial melee tek" && cat === "martial" && !menzilli && !props.includes("2H") && !props.includes("H")) return true;
    if (/Martial weapons that have the/.test(w) && cat === "martial") {
      const iste = []; if (/Finesse/.test(w)) iste.push("F"); if (/Light/.test(w)) iste.push("L");
      if (iste.some((p) => props.includes(p))) return true;
    }
  }
  return false;
}
function silahlar(B) { return Object.values(V.esya).filter((x) => x.source === "XPHB" && x.weapon && x.mastery && x.rarity === "none" && silahYetkin(B, x)).sort((a, b) => a.name.localeCompare(b.name)); }

// ---------- hesap
// ek.env: oyunda değişmiş envanter [[ad, adet, kuşanılı]] — verilirse AC ve saldırılar onun kuşanma durumuna göre hesaplanır
export function hesapla(Y, S, ek) {
  const B = baglam(Y, S), L = Y.seviye, P = pb(L), sec = B.sec, c = S.c, bg = B.bg, tur = B.tur, sub = B.sub;
  const var_ = (ad) => B.featler.some((x) => x.f.name === ad);
  const notlar = [];
  // ability'ler
  const puan = {}; AB.forEach((a) => (puan[a] = +Y.temel[a] || 10));
  const bgab = sec("bg:ab");
  if (bgab[0] === "21") { if (bgab[1]) puan[bgab[1]] += 2; if (bgab[2]) puan[bgab[2]] += 1; }
  if (bgab[0] === "111" && bg) bg.ability[0].choose.weighted.from.forEach((a) => (puan[a] += 1));
  for (const x of B.featler) {
    if (x.f.name === "Ability Score Improvement") { const v = sec(x.k + ":asi"); if (v.length === 2) { puan[v[0]] += 1; puan[v[1]] += 1; } continue; }
    const a = (x.f.ability || [])[0]; if (!a) continue;
    if (a.choose) sec(x.k + ":ab").forEach((ab) => (puan[ab] += a.choose.amount || 1));
    else AB.forEach((ab) => a[ab] && (puan[ab] += a[ab]));
  }
  const epik = B.featler.some((x) => x.f.category === "EB");
  AB.forEach((a) => (puan[a] = Math.min(epik ? 30 : 20, puan[a])));
  for (const x of tumEtki(B, "ab")) AB.forEach((a) => x.e.ab[a] && (puan[a] = Math.min(x.e.ab.max || 20, puan[a] + x.e.ab[a])));
  const m = {}; AB.forEach((a) => (m[a] = mod(puan[a])));
  // saves
  const saveProf = new Set(c.proficiency);
  B.featler.forEach((x) => sec(x.k + ":save").forEach((a) => saveProf.add(a)));
  for (const x of tumEtki(B, "saveProf")) { if (x.e.saveProf === "hepsi") AB.forEach((a) => saveProf.add(a)); else x.e.saveProf.forEach((a) => saveProf.add(a)); sec(x.id + ":save").forEach((a) => saveProf.add(a)); }
  const saveEk = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  for (const x of tumEtki(B, "saveEk")) { const v = Math.max(x.e.saveEk.min || -99, m[x.e.saveEk.ab]); (x.e.saveEk.hedef === "hepsi" ? AB : [x.e.saveEk.hedef]).forEach((a) => (saveEk[a] += v)); }
  const saves = {}; AB.forEach((a) => (saves[a] = { prof: saveProf.has(a), bonus: m[a] + (saveProf.has(a) ? P : 0) + saveEk[a] }));
  // skills
  const prof = profSkill(B, null), exp = new Set();
  for (const [k, v] of Object.entries(Y.secim)) if (/^sinif:exp:|:exp$/.test(k)) v.forEach((x) => exp.add(x));
  for (const x of B.featler) for (const ex of x.f.expertise || []) Object.keys(ex).forEach((k) => ex[k] === true && SKILLS[k] && exp.add(k));
  for (const x of tumEtki(B, "expSabit")) sec(x.id + ":skill").forEach((s) => exp.add(s));
  for (const x of B.featler) if ((ETKI["feat:" + x.f.name] || {}).profVarsaExp) sec(x.k + ":skill").forEach((s) => { if (profSkill(B, x.k + ":skill").has(s)) exp.add(s); });
  const jack = c.name === "Bard" && L >= 2;
  const chaEk = tumEtki(B, "chaCheck").reduce((t, x) => t + Math.max(x.e.chaCheck.min || -99, m[x.e.chaCheck.ab]), 0);
  const skills = Object.entries(SKILLS).map(([k, [ad, ab]]) => {
    const p = exp.has(k) && prof.has(k) ? 2 : prof.has(k) ? 1 : 0;
    return { ad, yetenek: ab, prof: p, bonus: m[ab] + P * p + (!p && jack ? Math.floor(P / 2) : 0) + (ab === "cha" ? chaEk : 0) };
  });
  // özellik listesi
  const ozel = [], esyaStat = [];
  const secilenler = new Set(Object.entries(Y.secim).filter(([k]) => k.startsWith("sinif:sec:")).flatMap(([, v]) => v));
  const secenekAdlari = new Set();
  for (const { f } of ozellikler(S, Y)) tara(f.entries, (t, e) => t === "secenek" && e.entries.forEach((r) => secenekAdlari.add(ref(r.classFeature || r.subclassFeature || r.optionalfeature || "").ad)));
  for (const { f, baslik } of ozellikler(S, Y)) {
    if (/^(Ability Score Improvement|Epic Boon|Subclass Feature)$/.test(f.name) || / (Subclass|Options)$/.test(f.name)) continue;
    if (secenekAdlari.has(f.name) && !secilenler.has(f.name)) continue;
    tara(f.entries, (t, e) => t === "esya" && esyaStat.push(e));
    if (baslik && sub && f.name === sub.shortName) continue;
    ozel.push({ ad: f.name, kaynak: c.name, seviye: f.level });
  }
  secilenler.forEach((ad) => { if (!ozel.some((o) => o.ad === ad)) ozel.push({ ad, kaynak: c.name, seviye: 1 }); });
  for (const [k, v] of Object.entries(Y.secim)) if (k.startsWith("sinif:opt:")) v.forEach((ad) => ozel.push({ ad, kaynak: c.name, seviye: 1 }));
  for (const x of B.etkiler) if (x.e.secenek) sec(x.id + ":sec").forEach((v) => ozel.push({ ad: x.kaynak + " (" + v + ")", kaynak: c.name, seviye: 1 }));
  const turAd = tur ? tur.name + (B.surum ? " (" + B.surum + ")" : "") : "";
  for (const e of B.turGirdi) if (e && e.name && !/^(Creature Type|Size|Speed)$/.test(e.name)) ozel.push({ ad: e.name + (e.name === "Draconic Ancestry" && sec("tur:ejderha")[0] ? " (" + sec("tur:ejderha")[0] + ")" : ""), kaynak: tur.name, seviye: 1 });
  // HP
  const hd = c.hd.faces;
  let hp = hd + m.con + (L - 1) * (hd / 2 + 1 + m.con);
  for (const x of tumEtki(B, "hp")) hp += (x.e.hp.seviye || 0) * L + (x.e.hp.sabit || 0);
  // zırh ve silah yetkinliği
  const zirh = new Set(c.startingProficiencies.armor || []);
  tumEtki(B, "zirh").forEach((x) => x.e.zirh.forEach((z) => zirh.add(z)));
  for (const x of B.featler) for (const a of x.f.armorProficiencies || []) Object.keys(a).forEach((k) => a[k] === true && zirh.add(k));
  // ekipman
  const envanter = [], para = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  const koy = (ad, adet, tip) => { const v = envanter.find((x) => x.ad === ad); if (v) v.adet += adet; else envanter.push({ ad, adet, tip: tip || "", kusanili: false }); };
  for (const [kk, l] of [["sinif:ekip", ekipSec(c.startingEquipment.defaultData[0])], ["bg:ekip", bg && ekipSec(bg.startingEquipment[0])]]) {
    const s = sec(kk)[0]; if (!l || !s || !l[s]) continue;
    l[s].forEach((it, i) => {
      if (typeof it === "string") it = { item: it };
      if (it.value) { para.gp += Math.floor(it.value / 100); para.sp += Math.floor((it.value % 100) / 10); para.cp += it.value % 10; return; }
      if (it.special) { koy(it.special, 1); return; }
      const secilen = it.displayName && /same as above/i.test(it.displayName) ? (sec("bg:tool")[0] || sec("sinif:tool")[0]) : sec(kk + ":" + i)[0];
      if (it.equipmentType || it.equipmentTypes) { if (secilen) koy(secilen, 1); return; }
      const r = ref(it.item), x = V.esya[n(r.ad)], g = V.grup[n(r.ad)];
      if (g) { koy(secilen || g.name, 1); return; }
      koy(it.displayName || (x ? x.name : buyuk(r.ad)), it.quantity || 1, x ? tipAd(x) : "");
    });
  }
  tumEtki(B, "esya").forEach((x) => x.e.esya.forEach((a) => { if (!envanter.some((e) => e.ad === a)) koy(a, 1, tipAd(V.esya[n(a)] || {})); }));
  const oyun = !!(ek && ek.env);
  if (oyun) { envanter.length = 0; ek.env.forEach(([ad, adet, k]) => envanter.push({ ad, adet, tip: tipAd(esyaBul(ad) || {}), kusanili: !!k })); }
  // AC: başlangıçta zırhlı/zırhsız seçeneklerden en iyisi kuşanılır; oyunda oyuncunun kuşandığı esas alınır
  const dexMax = (x) => { const t = String(x.type).split("|")[0]; if (t === "LA") return m.dex; if (t === "MA") return Math.min(tumEtki(B, "ortaZirhDex3").length && puan.dex >= 16 ? 3 : 2, m.dex); return 0; };
  const zirhlar = envanter.map((e) => [e, esyaBul(e.ad)]).filter(([e, x]) => x && x.armor && String(x.type).split("|")[0] !== "S" && (!oyun || e.kusanili));
  const kalkan = envanter.find((e) => { const x = esyaBul(e.ad); return x && String(x.type).split("|")[0] === "S" && (!oyun || e.kusanili); });
  const kalkanOk = !!(kalkan && zirh.has("shield"));
  const acEkHer = tumEtki(B, "acEk").filter((x) => x.e.acEk.kosul === "her").reduce((t, x) => t + x.e.acEk.deger, 0);
  const acEkZirh = tumEtki(B, "acEk").filter((x) => x.e.acEk.kosul === "zirhli").reduce((t, x) => t + x.e.acEk.deger, 0);
  const aday = oyun && zirhlar.length ? [] : [{ ac: 10 + m.dex, zirh: null, kalkanSerbest: true }];
  // zırh giyiliyken zırhsız formüller (Unarmored Defense vb.) geçersiz
  if (aday.length) for (const x of tumEtki(B, "ac")) { const f = x.e.ac; aday.push({ ac: (f.sabit || 10) + f.taban.reduce((t, a) => t + m[a], 0), zirh: null, kalkanSerbest: f.kosul !== "zirhsiz_kalkansiz" }); }
  for (const [e, x] of zirhlar) {
    const ok = { LA: "light", MA: "medium", HA: "heavy" }[String(x.type).split("|")[0]];
    if (zirh.has(ok)) aday.push({ ac: x.ac + dexMax(x) + acEkZirh, zirh: e, x, kalkanSerbest: true });
    else if (oyun) { aday.push({ ac: x.ac + dexMax(x), zirh: e, x, kalkanSerbest: true }); notlar.push(`${x.name}: training yok (Str/Dex d20 testlerinde Disadvantage, büyü yapılamaz)`); }
  }
  const kalkanVar = !!kalkan && (kalkanOk || oyun);
  aday.forEach((a) => (a.toplam = a.ac + (a.kalkanSerbest && kalkanVar ? 2 : 0)));
  const enIyi = aday.reduce((a, b) => (b.toplam > a.toplam ? b : a));
  if (!oyun) { if (enIyi.zirh) enIyi.zirh.kusanili = true; if (kalkan && kalkanOk && enIyi.kalkanSerbest) kalkan.kusanili = true; }
  const ac = enIyi.toplam + acEkHer;
  const agirZirh = enIyi.x && String(enIyi.x.type).startsWith("HA"), zirhsizKalkansiz = !enIyi.zirh && !(kalkan && kalkan.kusanili);
  if (!oyun) envanter.forEach((e) => { const x = esyaBul(e.ad); if (x && x.weapon) e.kusanili = true; });
  // hız, hareket, duyular
  const turV = B.turV;
  let hiz = (turV && (typeof turV.speed === "object" ? turV.speed.walk : turV.speed)) || 30;
  for (const x of tumEtki(B, "hiz")) { const h = x.e.hiz; if (h.kosul === "her" || (h.kosul === "agirsiz" && !agirZirh) || (h.kosul === "zirhsiz_kalkansiz" && zirhsizKalkansiz)) hiz += h.deger; }
  for (const x of tumEtki(B, "hizTablo")) if (zirhsizKalkansiz) hiz += +tabloSutun(S, Y, x.e.hizTablo.sutun) || 0;
  if (enIyi.x && enIyi.x.strength && puan.str < +enIyi.x.strength) { hiz -= 10; notlar.push(`${enIyi.x.name} için Str ${enIyi.x.strength} gerekir: Speed −10`); }
  const duyular = {};
  if (turV && turV.darkvision) duyular.Darkvision = turV.darkvision;
  if (turV && typeof turV.speed === "object") for (const [k, v] of Object.entries(turV.speed)) if (k !== "walk") duyular[{ climb: "Climb Speed", swim: "Swim Speed", fly: "Fly Speed" }[k] || k] = v === true ? hiz : v;
  for (const x of B.featler) for (const s of x.f.senses || []) for (const [k, v] of Object.entries(s)) { const ad = k[0].toUpperCase() + k.slice(1); duyular[ad] = Math.max(duyular[ad] || 0, +v); }
  for (const x of tumEtki(B, "duyu")) for (const [k, v] of Object.entries(x.e.duyu)) duyular[k] = Math.max(duyular[k] || 0, v);
  for (const x of tumEtki(B, "duyuEk")) for (const [k, v] of Object.entries(x.e.duyuEk)) duyular[k] = (duyular[k] || 0) + v;
  for (const x of tumEtki(B, "hareket")) for (const [k, v] of Object.entries(x.e.hareket)) duyular[k + " Speed"] = Math.max(duyular[k + " Speed"] || 0, v === "hiz" ? hiz : v);
  // dirençler
  const direnc = new Set();
  for (const r of (turV && turV.resist) || []) if (typeof r === "string") direnc.add(buyuk(r));
  sec("tur:direnc").forEach((d) => direnc.add(d));
  if (tur && tur.name === "Dragonborn" && sec("tur:ejderha")[0]) direnc.add(EJDERHA.find((x) => x[0] === sec("tur:ejderha")[0])[1]);
  for (const x of B.featler) { for (const r of x.f.resist || []) if (typeof r === "string") direnc.add(buyuk(r)); sec(x.k + ":direnc").forEach((d) => direnc.add(d)); }
  tumEtki(B, "direnc").forEach((x) => x.e.direnc.forEach((d) => direnc.add(d)));
  tumEtki(B, "direncSec").forEach((x) => sec(x.id + ":direnc").forEach((d) => direnc.add(d)));
  // saldırılar
  const fs = new Set(B.featler.map((x) => x.f.name));
  const mastery = new Set(sec("sinif:mastery"));
  const monk = c.name === "Monk" && tumEtki(B, "monk").length ? tabloSutun(S, Y, "Martial Arts") : null;
  const pakt = tumEtki(B, "silahAb")[0];
  const sgn = (v) => (v ? (v > 0 ? "+" : "") + v : "");
  const saldirilar = [];
  const silahSatir = (x, adOver) => {
    const props = (x.property || []).map((p) => String(p).split("|")[0]);
    const menzilli = String(x.type).startsWith("R"), yet = silahYetkin(B, x) || !!adOver;
    let ab = menzilli ? "dex" : props.includes("F") && m.dex > m.str ? "dex" : "str", zar = x.dmg1;
    const monkSilahi = monk && !menzilli && (x.weaponCategory === "simple" || props.includes("L"));
    if (monkSilahi) { if (m.dex > m[ab]) ab = "dex"; if (ort(monk) > ort(zar)) zar = monk; }
    if (pakt && !menzilli && yet && m.cha > m[ab]) ab = "cha";
    let isabet = m[ab] + (yet ? P : 0), hb = m[ab];
    if (menzilli && fs.has("Archery")) isabet += 2;
    if (!menzilli && !props.includes("2H") && fs.has("Dueling")) hb += 2;
    if (props.includes("T") && fs.has("Thrown Weapon Fighting") && !menzilli) hb += 2;
    const ms = x.mastery && x.mastery[0] ? ref(typeof x.mastery[0] === "string" ? x.mastery[0] : x.mastery[0].uid).ad : null;
    return { ad: adOver || x.name, tip: x.name, kusanili: true, isabet, hasar: zar + sgn(hb), tur: HASAR[x.dmgType] || "",
      menzil: x.range ? x.range + " ft" : props.includes("R") ? "10 ft" : "5 ft", mastery: ms && (mastery.has(x.name) || adOver) ? ms : null,
      ozellikler: props.map((p) => OZELLIK[p]).filter(Boolean) };
  };
  envanter.forEach((e) => { const x = esyaBul(e.ad); if (x && x.weapon && x.dmg1) saldirilar.push(Object.assign(silahSatir(x), { kusanili: e.kusanili })); });
  saldirilar.sort((a, b) => b.kusanili - a.kusanili);
  esyaStat.forEach((e) => { const x = V.esya[n(e.name)]; if (x && x.dmg1) saldirilar.push(silahSatir(x, x.name)); });
  for (const x of tumEtki(B, "saldiri")) for (const s of x.e.saldiri) saldirilar.push({ ad: s.ad, tip: "", kusanili: true, isabet: m[s.ab] + P, hasar: s.zar + sgn(m[s.ab]), tur: s.tur, menzil: s.menzil, mastery: null, ozellikler: s.props });
  // Unarmed Strike: seçeneklerden ortalaması en yüksek olanı
  const ua = [{ zar: null, ab: "str" }];
  if (monk) ua.push({ zar: monk, ab: m.dex > m.str ? "dex" : "str" });
  for (const x of tumEtki(B, "unarmed")) { const u = x.e.unarmed; const z = u.zarTablo ? tabloSutun(S, Y, u.zarTablo) : u.zar; if (u.ad) saldirilar.push({ ad: u.ad, tip: "", kusanili: true, isabet: Math.max(m.str, monk ? m.dex : -9) + P, hasar: z + sgn(m[u.ab]), tur: u.tur, menzil: "5 ft", mastery: null, ozellikler: [] }); else ua.push({ zar: z, ab: u.ab, tur: u.tur }); }
  const deger = (u) => (u.zar ? ort(u.zar) : 1) + m[u.ab];
  const u = ua.reduce((a, b) => (deger(b) > deger(a) ? b : a));
  const uaTur = (tumEtki(B, "unarmedTur")[0] || { e: {} }).e.unarmedTur || u.tur || "Bludgeoning";
  const uaIsabetAb = u.ab === "dex" || (monk && m.dex > m.str) ? "dex" : "str";
  saldirilar.push({ ad: "Unarmed Strike", tip: "", kusanili: true, isabet: m[uaIsabetAb] + P, hasar: u.zar ? u.zar + sgn(m[u.ab]) : String(Math.max(1, 1 + m[u.ab])), tur: uaTur, menzil: "5 ft", mastery: null, ozellikler: [] });
  // büyü
  let buyu = null;
  const bc = sinifBuyucu(S, Y);
  const spell = (ad, etiket) => { const s = V.buyu[n(ad)]; return s ? { ad: s.name, seviye: s.level, konsantrasyon: !!(s.duration || []).some((d) => d.concentration), ritual: !!(s.meta && s.meta.ritual), not: etiket || "" } : null; };
  const l = [];
  if (bc) { sec("buyu:cantrip").forEach((x) => l.push(spell(x))); sec("buyu:hazir").forEach((x) => l.push(spell(x))); herZamanHazir(B).forEach((x) => l.push(spell(x, "her zaman hazır"))); }
  for (const [k, v] of Object.entries(Y.secim)) if (/:sp:\d+$/.test(k)) v.forEach((x) => l.push(spell(x)));
  if (turV && turV.additionalSpells) ekBuyuler(turV.additionalSpells, L, "tur:sp", turV.additionalSpells.length > 1 ? B.surum : null).sabit.forEach((x) => l.push(spell(x.ad, turAd)));
  for (const x of B.featler) if (x.f.additionalSpells && x.f.additionalSpells.length === 1) ekBuyuler(x.f.additionalSpells, 20, "", null).sabit.forEach((y) => l.push(spell(y.ad, x.f.name)));
  for (const x of B.etkiler) if (x.e.secenek) sec(x.id + ":sec").forEach((v) => { const r = x.e.secenek.liste.find((z) => z[0] === v); if (r && r[2] && V.buyu[n(r[2])]) l.push(spell(r[2], x.kaynak)); });
  const temiz = []; l.filter(Boolean).forEach((s) => { if (!temiz.some((t) => t.ad === s.ad)) temiz.push(s); });
  if (bc || temiz.length) {
    const ab = bc ? bc.ab : sec("tur:spab")[0] || sec("bg:feat:spab")[0] || "cha";
    buyu = { sinif: bc ? c.name : tur ? tur.name : "Feat", yetenek: ab, save_dc: 8 + P + m[ab], isabet: P + m[ab], slotlar: slotlar(bc, L), buyuler: temiz.sort((a, b) => a.seviye - b.seviye || a.ad.localeCompare(b.ad)) };
  }
  // diller ve tool'lar
  const diller = new Set(["Common", ...sec("dil")]);
  if (c.name === "Rogue") diller.add("Thieves' Cant");
  if (c.name === "Druid") diller.add("Druidic");
  for (const [k, v] of Object.entries(Y.secim)) if (/:dil$/.test(k)) v.forEach((x) => diller.add(x));
  for (const x of B.featler) for (const lp of x.f.languageProficiencies || []) Object.keys(lp).forEach((q) => lp[q] === true && diller.add(buyuk(q)));
  tumEtki(B, "dil").forEach((x) => x.e.dil.forEach((d) => diller.add(d)));
  const araclar_ = profArac(B);
  tumEtki(B, "tool").forEach((x) => x.e.tool.forEach((t) => araclar_.add(t)));
  // initiative
  let init = m.dex;
  for (const x of tumEtki(B, "init")) init += x.e.init === "pb" ? P : m[x.e.init];
  if (tumEtki(B, "initAv").length) notlar.push("Initiative'de Advantage");
  tumEtki(B, "not").forEach((x) => notlar.push(x.e.not));
  const perc = skills.find((s) => s.ad === "Perception");
  return {
    id: Y.id, ad: Y.ad || "İsimsiz", oyuncu: Y.oyuncu || "", tur: turAd, background: bg ? bg.name : "",
    siniflar: [{ ad: c.name, seviye: L, subclass: sub ? sub.name : null }], seviye: L, prof_bonus: P,
    yetenekler: Object.fromEntries(AB.map((a) => [a, { puan: puan[a], mod: m[a] }])),
    saves, skills, pasif_perception: 10 + perc.bonus, hp_max: hp, ac, initiative: init, hiz, duyular,
    diller: [...diller].sort(), araclar: [...araclar_].sort(), zirh: [...zirh], silah: c.startingProficiencies.weapons.concat(ekSilahProf(B)).map(etiketsiz),
    direncler: [...direnc].sort(), notlar,
    saldirilar, buyu, ozellikler: ozel, featler: B.featler.map((x) => x.f.name),
    envanter, para, avatar: Y.avatar || null, yerel: true,
    guncellendi: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC", yapi: Y,
  };
}
function tipAd(x) { const t = String(x.type || "").split("|")[0]; return { M: "Melee Weapon", R: "Ranged Weapon", LA: "Light Armor", MA: "Medium Armor", HA: "Heavy Armor", S: "Shield", A: "Ammunition", SCF: "Spellcasting Focus", AT: "Artisan's Tools", INS: "Instrument", GS: "Gaming Set", T: "Tool", G: "Adventuring Gear" }[t] || ""; }

export function bosYapi() {
  return { v: 1, id: Math.floor(Date.now() / 1000), ad: "", oyuncu: "", avatar: "", sinif: "", seviye: 1, background: "", tur: "", yontem: "standart", temel: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }, dunyalar: false, secim: {} };
}
