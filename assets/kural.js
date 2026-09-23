// Karakter kuralları (D&D 2024): seçim listesi + karakter sayfası hesabı.
// Veri 5e.tools deposundan çalışma anında gelir; sitede kural metni tutulmaz.
//
// Yapı (oyuncunun seçimleri, dosyaya bu kaydedilir):
//   { v, ad, oyuncu, avatar, sinif, seviye, subclass, background, tur, yontem, temel{str..cha}, secim{anahtar: [değer..]} }
// secimler(Y, V) -> o anki seçim soruları;  hesapla(Y, V) -> karakter sayfası JSON'u
import { cek, normal as n } from "./aciklama.js";

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
export const SINIFLAR = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"];
export const KAYNAKLAR = ["XPHB", "FRHoF"]; // 2024 Player's Handbook + Heroes of Faerûn
export const STANDART = [15, 14, 13, 12, 10, 8];
export const PUAN_MALIYET = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

// Kural metninde yapılandırılmış olmayan küçük tablolar (2024 PHB)
const EXPERTISE = { Rogue: { 1: 2, 6: 2 }, Bard: { 2: 2, 9: 2 }, Ranger: { 2: 1, 9: 2 }, Wizard: { 2: 1 } };
const SCHOLAR = ["arcana", "history", "investigation", "medicine", "nature", "religion"];
const MASTERY_SABIT = { Rogue: 2, Paladin: 2, Ranger: 2 }; // Barbarian ve Fighter'da sınıf tablosunda sütun var
// özellik seçeneklerinin sayısal etkileri (Divine Order, Primal Order)
const SECENEK_ETKI = { Magician: { cantrip: 1 }, Thaumaturge: { cantrip: 1 }, Warden: { zirh: ["medium"], silah: ["martial"] }, Protector: { zirh: ["heavy"], silah: ["martial"] } };
const secilenEtki = (Y, alan) => Object.entries(Y.secim).filter(([k]) => k.startsWith("sinif:sec:")).flatMap(([, v]) => v).map((x) => (SECENEK_ETKI[x] || {})[alan]).filter(Boolean);
const EJDERHA = [ // Dragonborn: Draconic Ancestry
  ["Black", "Acid"], ["Blue", "Lightning"], ["Brass", "Fire"], ["Bronze", "Lightning"], ["Copper", "Acid"],
  ["Gold", "Fire"], ["Green", "Poison"], ["Red", "Fire"], ["Silver", "Cold"], ["White", "Cold"]];
const HASAR = { S: "Slashing", P: "Piercing", B: "Bludgeoning", Y: "Psychic", F: "Fire", C: "Cold", L: "Lightning", A: "Acid", O: "Force", R: "Radiant", N: "Necrotic", T: "Thunder", I: "Poison" };
const OZELLIK = { F: "Finesse", L: "Light", T: "Thrown", V: "Versatile", "2H": "Two-Handed", H: "Heavy", A: "Ammunition", LD: "Loading", R: "Reach", RLD: "Reload", BF: "Burst Fire" };

const ref = (s) => { const [ad, kaynak] = String(s).split("#")[0].split("|"); return { ad, kaynak: (kaynak || "").toUpperCase() }; };
// "sprig of mistletoe" -> "Sprig of Mistletoe"; veride doğru yazımı varsa o kullanılır
const KUCUK = new Set(["of", "the", "and", "or", "a", "an", "with", "from", "to", "in", "on", "for"]);
const buyuk = (s) => {
  const x = (V.esya && V.esya[n(s)]) || (V.buyu && V.buyu[n(s)]);
  if (x) return x.name;
  return String(s).split(" ").map((w, i) => (i && KUCUK.has(w.toLowerCase()) ? w.toLowerCase() : w.replace(/^[a-z]/, (c) => c.toUpperCase()))).join(" ");
};
const mod = (p) => Math.floor((p - 10) / 2);
const topla = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const pb = (L) => 2 + Math.floor((L - 1) / 4);

// ---------- veri
const V = { yuklu: null, sinif: {} };
export async function veriYukle() {
  if (!V.yuklu) V.yuklu = (async () => {
    const [bg, rc, ft, sx, sf, look, ib, it, opt, dil] = await Promise.all([
      cek("backgrounds.json"), cek("races.json"), cek("feats.json"), cek("spells/spells-xphb.json"),
      cek("spells/spells-frhof.json"), cek("generated/gendata-spell-source-lookup.json"), cek("items-base.json"),
      cek("items.json"), cek("optionalfeatures.json"), cek("languages.json")]);
    const izin = (x) => KAYNAKLAR.includes(x.source);
    V.background = bg.background.filter(izin);
    V.tur = rc.race.filter(izin);
    V.feat = ft.feat.filter(izin);
    V.buyu = {}; for (const s of sx.spell.concat(sf.spell)) V.buyu[n(s.name)] = s;
    V.liste = look;
    V.esya = {}; for (const x of ib.baseitem.concat(it.item)) if (x.source === "XPHB" || !V.esya[n(x.name)]) V.esya[n(x.name)] = x;
    V.grup = {}; for (const g of it.itemGroup || []) if (g.source === "XPHB") V.grup[n(g.name)] = g;
    V.opt = opt.optionalfeature.filter(izin);
    V.dil = dil.language.filter((l) => l.source === "XPHB");
    V.araclar = (t) => Object.values(V.esya).filter((x) => x.source === "XPHB" && String(x.type || "").split("|")[0] === t).map((x) => x.name).sort();
  })();
  await V.yuklu;
  return V;
}
export async function sinifYukle(ad) {
  if (!V.sinif[ad]) V.sinif[ad] = cek(`class/class-${ad.toLowerCase()}.json`).then((d) => {
    const c = d.class.find((x) => x.source === "XPHB");
    return {
      c, feat: d.classFeature || [], sfeat: d.subclassFeature || [],
      subs: (d.subclass || []).filter((s) => s.className === ad && s.classSource === "XPHB" && KAYNAKLAR.includes(s.source)),
    };
  });
  return V.sinif[ad];
}

// ---------- yardımcılar
export const bulBg = (Y) => V.background && V.background.find((b) => b.name + "|" + b.source === Y.background);
export const bulTur = (Y) => V.tur && V.tur.find((r) => r.name + "|" + r.source === Y.tur);
// background'un origin feat'i ("magic initiate; cleric|xphb"); veri eksikse metinden okunur
export function bgFeat(bg) {
  const k = bg && bg.feats && Object.keys(bg.feats[0] || {})[0];
  if (k) return k;
  const m = JSON.stringify((bg && bg.entries) || []).match(/"Feat:","entry":"\{@feat ([^|}]+)\|?([^}]*)\}(?: \(([^)]+)\))?/);
  return m ? m[1].toLowerCase() + (m[3] ? "; " + m[3].toLowerCase() : "") + "|" + (m[2] || "xphb").toLowerCase() : null;
}
export const bulFeat = (ad) => {
  const r = ref(ad), l = V.feat.filter((f) => n(f.name) === n(r.ad.split(";")[0]));
  return l.find((f) => f.source === r.kaynak) || l.find((f) => f.source === "XPHB") || l[0];
};
function sinifOzellik(S, s) { // "Name|Class|ClassSrc|Level|Src"
  const [ad, , , lv, src] = s.split("|");
  return S.feat.find((f) => f.name === ad && f.level === +lv && f.source === (src || "XPHB"));
}
function altOzellik(S, s) { // "Name|Class|ClassSrc|SubShort|SubSrc|Level|Src"
  const [ad, , , kisa, ssrc, lv, src] = s.split("|");
  return S.sfeat.find((f) => f.name === ad && f.level === +lv && f.subclassShortName === kisa && f.subclassSource === ssrc && f.source === (src || ssrc));
}
// girdide "options" blokları ve (seçenek dışı) alt özellik referansları
function tara(entries, cb, secenekIci) {
  for (const e of entries || []) {
    if (!e || typeof e !== "object") continue;
    if (e.type === "options") { cb("secenek", e); continue; }
    if (!secenekIci && (e.type === "refSubclassFeature" || e.type === "refClassFeature")) cb("ref", e);
    if (e.type === "statblock" && e.tag === "item") cb("esya", e);
    if (e.entries) tara(e.entries, cb, secenekIci);
    if (e.items) tara(e.items, cb, secenekIci);
  }
}
export function altSinif(S, Y) {
  const ad = (Y.secim.subclass || [])[0];
  if (!ad || Y.seviye < altSinifSeviye(S)) return null;
  return S.subs.find((s) => s.name === ad);
}
export function altSinifSeviye(S) {
  const r = S.c.classFeatures.find((x) => typeof x === "object" && x.gainSubclassFeature);
  return r ? +r.classFeature.split("|")[3] : 3;
}
// Seviyeye kadar kazanılan sınıf ve subclass özellikleri
export function ozellikler(S, Y) {
  const L = Y.seviye, out = [];
  for (const r of S.c.classFeatures) {
    const s = typeof r === "string" ? r : r.classFeature, f = sinifOzellik(S, s);
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
// "level=0|class=Wizard" gibi süzgeç -> büyü listesi
function buyuSuzgec(filtre, sinirSeviye) {
  const p = {}; for (const k of String(filtre).split("|")) { const [a, b] = k.split("="); p[a] = b; }
  const lv = p.level != null ? p.level.split(";").map(Number) : null, cl = p.class ? p.class.split(";") : null;
  return Object.values(V.buyu).filter((s) => (!lv || lv.includes(s.level)) && (sinirSeviye == null || s.level <= sinirSeviye) &&
    (!cl || cl.some((c) => sinifListesinde(s, c)))).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}
function sinifListesinde(s, sinif) {
  const e = (V.liste[s.source.toLowerCase()] || {})[n(s.name)];
  return !!(e && e.class && Object.values(e.class).some((m) => m[sinif] || Object.keys(m).some((k) => n(k) === n(sinif))));
}
// additionalSpells içinden seviyeye kadar gelen sabit büyüler ve seçim tanımları
function ekBuyuler(liste, L, anahtar, isim) {
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
      const liste2 = Array.isArray(v) ? v : Object.values(v).flatMap((g) => (Array.isArray(g) ? g : Object.values(g).flat()));
      liste2.forEach((x) => isle(x, lv, tur));
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
function slotlar(buyucu, L) {
  if (!buyucu) return [];
  for (const g of buyucu.tablo || []) if (g.rowsSpellProgression) {
    const r = (g.rowsSpellProgression[L - 1] || []).map(Number);
    return r.slice(0, r.reduce((son, x, i) => (x > 0 ? i + 1 : son), 0));
  }
  // Warlock: Pact Magic sütunları
  for (const g of buyucu.tablo || []) {
    const lab = (g.colLabels || []).map((x) => String(x).replace(/\{@\w+ ([^|}]+)[^}]*\}/g, "$1"));
    const si = lab.indexOf("Spell Slots"), li = lab.indexOf("Slot Level");
    if (si > -1 && li > -1) {
      const r = g.rows[L - 1], adet = +r[si], sv = parseInt(String(r[li]).replace(/\{@\w+ ([^|}]+)[^}]*\}/g, "$1"), 10);
      const a = new Array(sv).fill(0); a[sv - 1] = adet; return a;
    }
  }
  return [];
}
// tablo hücresi: sayı, metin ya da {type: dice|bonusSpeed}
function hucre(v) {
  if (v && typeof v === "object") {
    if (v.type === "dice") return v.toRoll.map((t) => t.number + "d" + t.faces).join("+");
    if (v.type === "bonusSpeed") return v.value;
    if (v.value != null) return v.value;
    return "";
  }
  return typeof v === "string" ? v.replace(/\{@\w+ ([^|}]+)[^}]*\}/g, "$1") : v;
}
function tabloSutun(S, Y, ad) {
  const L = Y.seviye, gr = (S.c.classTableGroups || []).concat((altSinif(S, Y) || {}).subclassTableGroups || []);
  for (const g of gr) {
    const i = (g.colLabels || []).findIndex((x) => String(x).replace(/\{@\w+ ([^|}]+)[^}]*\}/g, "$1") === ad);
    if (i > -1 && g.rows) return hucre(g.rows[L - 1][i]);
  }
  return null;
}
const cn0 = (Y) => secilenEtki(Y, "cantrip").reduce((a, b) => a + b, 0);
let ekSilah = [];
function silahYetkin(S, x) {
  const cat = x.weaponCategory, props = (x.property || []).map((p) => String(p).split("|")[0]);
  for (const w of (S.c.startingProficiencies.weapons || []).concat(ekSilah)) {
    if (w === "simple" && cat === "simple") return true;
    if (w === "martial" && cat === "martial") return true;
    if (/Martial weapons that have the/.test(w) && cat === "martial") {
      const iste = []; if (/Finesse/.test(w)) iste.push("F"); if (/Light/.test(w)) iste.push("L");
      if (iste.some((p) => props.includes(p))) return true;
    }
  }
  return false;
}
function silahlar(S) { return Object.values(V.esya).filter((x) => x.source === "XPHB" && x.weapon && x.mastery && x.rarity === "none" && silahYetkin(S, x)).sort((a, b) => a.name.localeCompare(b.name)); }

// feat seçim soruları (ability, skill, tool, dil, büyü)
function featSorulari(feat, k, ek) {
  const out = [];
  if (!feat) return out;
  const ackF = "feat|" + feat.name;
  (feat.ability || []).forEach((a, i) => {
    if (!a.choose) return;
    if (feat.name === "Ability Score Improvement") {
      if (i === 0) out.push({ k: k + ":asi", tur: "asi", baslik: "Ability Score Improvement", aciklama: "Bir ability'ye +2 ya da iki ability'ye +1 (en fazla 20).", adet: 2, secenekler: AB.map((x) => ({ d: x, ad: AB_AD[x] })) });
      return;
    }
    if (i > 0) return; // alternatifli ability'ler: ilkini kullan (feat'lerde tek seçenek var)
    out.push({ k: k + ":ab", tur: "tek", baslik: feat.name + ": +" + (a.choose.amount || 1) + " ability", aciklama: a.choose.entry || "Hangi ability artsın?", adet: a.choose.count || 1, secenekler: a.choose.from.map((x) => ({ d: x, ad: AB_AD[x] })), ack: ackF });
  });
  for (const sp of feat.skillProficiencies || []) if (sp.choose || sp.any) out.push({ k: k + ":skill", tur: "coklu", baslik: feat.name + ": skill", adet: (sp.choose && sp.choose.count) || sp.any || 1, secenekler: ((sp.choose && sp.choose.from) || Object.keys(SKILLS)).map((x) => ({ d: x, ad: SKILLS[x][0], ack: "skill|" + SKILLS[x][0] })), ack: ackF });
  for (const st of feat.skillToolLanguageProficiencies || []) for (const c of st.choose || []) {
    const sec = []; if (c.from.includes("anySkill")) Object.keys(SKILLS).forEach((x) => sec.push({ d: x, ad: SKILLS[x][0], ack: "skill|" + SKILLS[x][0] }));
    if (c.from.includes("anyTool")) ["AT", "T", "GS", "INS"].forEach((t) => V.araclar(t).forEach((a) => sec.push({ d: "arac:" + a, ad: a, ack: "esya|" + a })));
    out.push({ k: k + ":stl", tur: "coklu", baslik: feat.name + ": skill ya da tool", adet: c.count || 1, secenekler: sec, ack: ackF });
  }
  for (const tp of feat.toolProficiencies || []) {
    if (tp.choose) out.push({ k: k + ":tool", tur: "coklu", baslik: feat.name + ": tool", adet: tp.choose.count || 1, secenekler: tp.choose.from.map((a) => ({ d: "arac:" + buyuk(a), ad: buyuk(a), ack: "esya|" + buyuk(a) })), ack: ackF });
    if (tp.anyMusicalInstrument) out.push({ k: k + ":tool", tur: "coklu", baslik: feat.name + ": müzik aleti", adet: tp.anyMusicalInstrument, secenekler: V.araclar("INS").map((a) => ({ d: "arac:" + a, ad: a, ack: "esya|" + a })), ack: ackF });
  }
  for (const lp of feat.languageProficiencies || []) if (lp.any) out.push({ k: k + ":dil", tur: "coklu", baslik: feat.name + ": dil", adet: lp.any, secenekler: V.dil.filter((l) => l.name !== "Common").map((l) => ({ d: l.name, ad: l.name, alt: l.type === "rare" ? "rare" : "" })), ack: ackF });
  if (feat.savingThrowProficiencies) for (const sv of feat.savingThrowProficiencies) if (sv.choose) out.push({ k: k + ":save", tur: "tek", baslik: feat.name + ": saving throw", adet: 1, secenekler: sv.choose.from.map((x) => ({ d: x, ad: AB_AD[x] })), ack: ackF });
  // büyüler: Magic Initiate gibi
  const ad = feat.additionalSpells;
  if (ad && ad.length) {
    let isim = null;
    if (ad.length > 1) {
      const sabit = ek && ek.spec; // "magic initiate; cleric"
      if (sabit) isim = ad.find((x) => n(x.name).startsWith(n(sabit)))?.name;
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
const buyuSecenek = (s) => ({ d: s.name, ad: s.name, alt: s.level ? "Sv " + s.level : "Cantrip", ack: "buyu|" + s.name });

// ---------- seçim soruları
// Her soru: { k, adim, tur: tek|coklu|asi|bgab, baslik, aciklama, adet, secenekler[{d, ad, alt, ack}], ack }
export function secimler(Y, S) {
  const out = [], L = Y.seviye, ekle = (adim, q) => { q.adim = q.adim || adim; out.push(q); };
  ekSilah = secilenEtki(Y, "silah").flat();
  const sec = (k) => Y.secim[k] || [];
  // Background
  const bg = bulBg(Y);
  if (bg) {
    ekle("bg", { k: "bg:ab", tur: "bgab", baslik: "Ability artışı", aciklama: "2024 kuralı: bu üç ability'den birine +2 ve başka birine +1 ver, ya da üçüne de +1 ver.", secenekler: bg.ability[0].choose.weighted.from, adet: 3 });
    (bg.toolProficiencies || []).forEach((t) => {
      const any = t.anyArtisansTool ? ["AT", t.anyArtisansTool] : t.anyGamingSet ? ["GS", t.anyGamingSet] : t.anyMusicalInstrument ? ["INS", t.anyMusicalInstrument] : null;
      if (any) ekle("bg", { k: "bg:tool", tur: "coklu", baslik: "Background tool", adet: any[1], secenekler: V.araclar(any[0]).map((a) => ({ d: a, ad: a, ack: "esya|" + a })) });
    });
    const fr = bgFeat(bg);
    if (fr) { const [adp] = fr.split("|"), spec = adp.split(";")[1]; out.push(...featSorulari(bulFeat(fr), "bg:feat", { spec: spec && spec.trim(), Y }).map((q) => ((q.adim = q.adim || "bg"), q))); }
    ekle("ekip", { k: "bg:ekip", tur: "tek", baslik: bg.name + " ekipmanı", aciklama: "A: hazır paket (eşyalar + biraz altın). B: sadece altın; eşyayı kendin alırsın.", adet: 1, secenekler: bg.startingEquipment.map((o) => Object.keys(o)).flat().map((x) => ({ d: x, ad: x === "A" ? "A: eşyalar" : "B: sadece altın" })) });
  }
  // Species
  const tur = bulTur(Y);
  if (tur) {
    if (tur._versions && tur._versions.length && tur._versions[0].name) ekle("tur", { k: "tur:surum", tur: "tek", baslik: tur.name + " soyu", aciklama: "Bu species'in alt kolları farklı yetenekler verir.", adet: 1, secenekler: tur._versions.map((v) => ({ d: v.name.split("; ")[1], ad: v.name.split("; ")[1] })) });
    if (tur.name === "Dragonborn") ekle("tur", { k: "tur:ejderha", tur: "tek", baslik: "Draconic Ancestry", aciklama: "Atan ejderha türü: Breath Weapon'ının hasar türünü ve dayanıklı olduğun hasarı belirler.", adet: 1, secenekler: EJDERHA.map(([r, h]) => ({ d: r, ad: r + " Dragon", alt: h })) });
    if ((tur.size || []).length > 1) ekle("tur", { k: "tur:boy", tur: "tek", baslik: "Boy", adet: 1, secenekler: tur.size.map((s) => ({ d: s, ad: s === "S" ? "Small" : "Medium" })) });
    for (const sp of tur.skillProficiencies || []) {
      if (sp.choose) ekle("tur", { k: "tur:skill", tur: "tek", baslik: tur.name + ": skill", adet: 1, secenekler: sp.choose.from.map((x) => ({ d: x, ad: SKILLS[x][0], ack: "skill|" + SKILLS[x][0] })) });
      if (sp.any) ekle("tur", { k: "tur:skill", tur: "coklu", baslik: tur.name + ": skill", aciklama: "Human (Skillful): istediğin bir skill.", adet: sp.any, secenekler: Object.keys(SKILLS).map((x) => ({ d: x, ad: SKILLS[x][0], ack: "skill|" + SKILLS[x][0] })) });
    }
    for (const fp of tur.feats || []) if (fp.anyFromCategory) {
      ekle("tur", { k: "tur:feat", tur: "tek", baslik: tur.name + ": origin feat", aciklama: "Human (Versatile): bir Origin feat daha.", adet: 1, secenekler: V.feat.filter((f) => f.category === "O").map((f) => ({ d: f.name + "|" + f.source, ad: f.name, alt: f.source === "FRHoF" ? "Faerûn" : "", ack: "feat|" + f.name })) });
      const f = sec("tur:feat")[0]; if (f) out.push(...featSorulari(bulFeat(f), "tur:featx", { Y }).map((q) => ((q.adim = q.adim || "tur"), q)));
    }
    const surum = sec("tur:surum")[0];
    if (tur.additionalSpells) {
      const e = ekBuyuler(tur.additionalSpells, L, "tur:sp", tur.additionalSpells.length > 1 ? surum : null);
      if (e.set && e.set.ability && e.set.ability.choose && (tur.additionalSpells.length === 1 || surum)) ekle("tur", { k: "tur:spab", tur: "tek", baslik: tur.name + " büyüleri için ability", aciklama: "Species büyülerini hangi ability ile yaparsın (Int, Wis ya da Cha)?", adet: 1, secenekler: e.set.ability.choose.map((x) => ({ d: x, ad: AB_AD[x] })) });
      for (const s of e.secim) ekle("buyu", { k: s.k, tur: "coklu", baslik: tur.name + ": " + (/level=0/.test(s.filtre) ? "cantrip" : "büyü"), adet: s.adet, secenekler: buyuSuzgec(s.filtre).map(buyuSecenek) });
    }
  }
  ekle("tur", { k: "dil", tur: "coklu", baslik: "Diller", aciklama: "Herkes Common bilir; üstüne iki standart dil seç.", adet: 2, secenekler: V.dil.filter((l) => l.type === "standard" && l.name !== "Common").map((l) => ({ d: l.name, ad: l.name })) });
  // Sınıf
  if (S) {
    const c = S.c, sp = c.startingProficiencies;
    for (const s of sp.skills || []) {
      if (s.choose) ekle("sinif", { k: "sinif:skill", tur: "coklu", baslik: c.name + " skill'leri", aciklama: "Bu skill'lerde proficiency kazanırsın: zarına Proficiency Bonus eklenir.", adet: s.choose.count, secenekler: s.choose.from.map((x) => ({ d: x, ad: SKILLS[x][0], alt: SKILLS[x][1].toUpperCase(), ack: "skill|" + SKILLS[x][0] })) });
      if (s.any) ekle("sinif", { k: "sinif:skill", tur: "coklu", baslik: c.name + " skill'leri", adet: s.any, secenekler: Object.keys(SKILLS).map((x) => ({ d: x, ad: SKILLS[x][0], alt: SKILLS[x][1].toUpperCase(), ack: "skill|" + SKILLS[x][0] })) });
    }
    const tp = sp.toolProficiencies || [];
    if (tp.length > 1 && tp.every((t) => t.anyArtisansTool || t.anyMusicalInstrument)) ekle("sinif", { k: "sinif:tool", tur: "tek", baslik: c.name + " tool", aciklama: "Bir artisan's tool ya da bir müzik aleti.", adet: 1, secenekler: V.araclar("AT").concat(V.araclar("INS")).map((a) => ({ d: a, ad: a, ack: "esya|" + a })) });
    else for (const t of tp) if (t.anyMusicalInstrument) ekle("sinif", { k: "sinif:tool", tur: "coklu", baslik: c.name + ": müzik aletleri", adet: t.anyMusicalInstrument, secenekler: V.araclar("INS").map((a) => ({ d: a, ad: a, ack: "esya|" + a })) });
    // subclass
    const ssv = altSinifSeviye(S);
    if (L >= ssv) ekle("sinif", { k: "subclass", tur: "tek", sub: true, baslik: "Subclass", aciklama: `${ssv}. seviyede sınıfının bir koluna girersin.`, adet: 1, secenekler: S.subs.map((s) => ({ d: s.name, ad: s.name, alt: s.source === "FRHoF" ? "Faerûn" : "" })) });
    const subN = altSinif(S, Y);
    if (subN && (subN.additionalSpells || []).length > 1) ekle("sinif", { k: "sinif:altset", tur: "tek", baslik: subN.name + ": tür", aciklama: "Her zaman hazır büyülerin bu seçime göre değişir.", adet: 1, secenekler: subN.additionalSpells.map((x) => ({ d: x.name, ad: x.name, alt: Object.values(x.prepared || {}).flat().map((y) => buyuk(ref(y).ad)).slice(0, 3).join(", ") })) });
    // expertise
    for (const [lv, adet] of Object.entries(EXPERTISE[c.name] || {})) if (L >= +lv) ekle("sinif", { k: "sinif:exp:" + lv, tur: "coklu", baslik: `Expertise (Sv ${lv})`, aciklama: "Proficient olduğun skill'lerden seç: Proficiency Bonus iki kez eklenir." + (c.name === "Wizard" ? " (Scholar: Arcana, History, Investigation, Medicine, Nature ya da Religion)" : ""), adet, secenekler: [], dinamik: "expertise", lv: +lv });
    // weapon mastery
    const wm = MASTERY_SABIT[c.name] || +tabloSutun(S, Y, "Weapon Mastery") || 0;
    if (wm) ekle("sinif", { k: "sinif:mastery", tur: "coklu", baslik: "Weapon Mastery", aciklama: "Bu silah türlerinin özel ustalık etkisini kullanabilirsin (Vex, Nick, Sap…). Long rest'te değiştirebilirsin.", adet: wm, secenekler: silahlar(S).map((x) => ({ d: x.name, ad: x.name, alt: ref(x.mastery[0]).ad, ack: "mastery|" + ref(x.mastery[0]).ad })) });
    // fighting style / epic boon (featProgression)
    for (const fp of c.featProgression || []) for (const [lv, adet] of Object.entries(fp.progression)) if (L >= +lv) {
      const kat = fp.category;
      ekle("sinif", { k: "sinif:fp:" + fp.name + ":" + lv, tur: adet > 1 ? "coklu" : "tek", baslik: fp.name, adet, secenekler: V.feat.filter((f) => kat.includes(f.category)).map((f) => ({ d: f.name + "|" + f.source, ad: f.name, ack: "feat|" + f.name })) });
      for (const f of sec("sinif:fp:" + fp.name + ":" + lv)) out.push(...featSorulari(bulFeat(f), "sinif:fpx:" + lv, { Y }).map((q) => ((q.adim = q.adim || "sinif"), q)));
    }
    // invocation, metamagic, maneuver (optionalfeatureProgression; subclass'ta da olabilir)
    const sub = altSinif(S, Y);
    for (const kaynak of [c, sub].filter(Boolean)) for (const op of kaynak.optionalfeatureProgression || []) {
      const adet = Array.isArray(op.progression) ? op.progression[L - 1] : Object.entries(op.progression).filter(([lv]) => +lv <= L).reduce((m, [, v]) => Math.max(m, v), 0);
      if (!adet) continue;
      ekle("sinif", { k: "sinif:opt:" + op.name, tur: "coklu", baslik: op.name, adet, secenekler: V.opt.filter((o) => o.featureType.some((t) => op.featureType.includes(t)) && optUygun(o, L, Y)).map((o) => ({ d: o.name, ad: o.name, ack: "ozellik|" + o.name + "|" + c.name })) });
    }
    // özelliklerdeki seçenekler (Divine Order, Primal Order…) ve ASI'ler
    for (const { f } of ozellikler(S, Y)) {
      if (/^Ability Score Improvement$/.test(f.name)) {
        const k = "sinif:asi:" + f.level;
        ekle("sinif", { k, tur: "tek", baslik: `Feat (Sv ${f.level})`, aciklama: "Ability Score Improvement ya da istediğin bir General feat.", adet: 1, secenekler: V.feat.filter((x) => x.category === "G" && featUygun(x, L)).map((x) => ({ d: x.name + "|" + x.source, ad: x.name, ack: "feat|" + x.name })) });
        const fs = sec(k)[0]; if (fs) out.push(...featSorulari(bulFeat(fs), k + "x", { Y }).map((q) => ((q.adim = q.adim || "sinif"), q)));
        continue;
      }
      tara(f.entries, (tur2, e) => {
        if (tur2 !== "secenek" || e.entries.every((r) => r.type === "refOptionalfeature")) return; // invocation/metamagic/maneuver ayrı soruluyor
        const ops = e.entries.map((r) => r.classFeature ? sinifOzellik(S, r.classFeature) : r.subclassFeature ? altOzellik(S, r.subclassFeature) : r.optionalfeature ? V.opt.find((o) => o.name === ref(r.optionalfeature).ad) : null).filter(Boolean);
        if (ops.length) ekle("sinif", { k: "sinif:sec:" + f.name + ":" + f.level, tur: (e.count || 1) > 1 ? "coklu" : "tek", baslik: f.name, aciklama: "Bu özelliğin seçeneklerinden " + (e.count || 1) + " tanesini seç.", adet: e.count || 1, secenekler: ops.map((o) => ({ d: o.name, ad: o.name, ack: "ozellik|" + o.name + "|" + c.name, entries: o.entries })) });
      });
    }
    // büyüler
    const b = sinifBuyucu(S, Y);
    if (b) {
      const sl = slotlar(b, L), maxSv = sl.length, k = b.kaynak;
      const her = herZamanHazir(S, Y).map((x) => n(x));
      const cn = (k.cantripProgression ? k.cantripProgression[L - 1] : 0) + (cn0(Y));
      if (cn) ekle("buyu", { k: "buyu:cantrip", tur: "coklu", baslik: "Cantrip'ler", aciklama: "Cantrip'ler slot harcamadan, istediğin kadar yapılır.", adet: cn, secenekler: buyuSuzgec("level=0|class=" + b.liste).map(buyuSecenek) });
      const hz = k.preparedSpellsProgression ? k.preparedSpellsProgression[L - 1] : 0;
      if (c.name === "Wizard") {
        const kitap = 6 + 2 * (L - 1);
        ekle("buyu", { k: "buyu:kitap", tur: "coklu", baslik: "Spellbook", aciklama: "Wizard büyülerini kitabında taşır. Her gün bunlardan bir kısmını hazırlar.", adet: kitap, secenekler: buyuSuzgec("level=" + range(1, maxSv) + "|class=Wizard").map(buyuSecenek) });
        ekle("buyu", { k: "buyu:hazir", tur: "coklu", baslik: "Hazır büyüler", aciklama: "Spellbook'undan bugün hazırladıkların (Long Rest'te değiştirebilirsin).", adet: hz, secenekler: sec("buyu:kitap").map((x) => V.buyu[n(x)]).filter(Boolean).map(buyuSecenek) });
      } else if (hz) {
        ekle("buyu", { k: "buyu:hazir", tur: "coklu", baslik: "Hazır büyüler", aciklama: `En fazla ${maxSv}. seviye büyü. Her zaman hazır olanlar (${her.length ? her.map(buyuk).join(", ") : "yok"}) bu sayıya dahil değil.`, adet: hz, secenekler: buyuSuzgec("level=" + range(1, maxSv) + "|class=" + b.liste).filter((s) => !her.includes(n(s.name))).map(buyuSecenek) });
      }
    }
    // sınıf ekipmanı
    ekle("ekip", { k: "sinif:ekip", tur: "tek", baslik: c.name + " ekipmanı", aciklama: "A/B(/C): hazır paketlerden birini seç. Sadece altın alan seçenek, eşyaları kendin alacağın anlamına gelir.", adet: 1, secenekler: c.startingEquipment.defaultData.map((o) => Object.keys(o)).flat().map((x) => ({ d: x, ad: x, alt: ekipOzet(c.startingEquipment.defaultData[0][x]) })) });
  }
  // ekipmandaki genel eşyalar (Druidic Focus, müzik aleti…) için seçim
  for (const [kk, liste] of [["sinif:ekip", S && S.c.startingEquipment.defaultData[0]], ["bg:ekip", bg && bg.startingEquipment[0]]]) {
    const secili = sec(kk)[0]; if (!liste || !secili || !liste[secili]) continue;
    liste[secili].forEach((it, i) => {
      const g = it.item && V.grup[n(ref(it.item).ad)];
      const tipler = it.equipmentType ? [it.equipmentType] : it.equipmentTypes || null;
      const ops = g ? g.items.map((x) => ref(x).ad).map(buyuk) : tipler ? tipler.flatMap((t) => V.araclar({ instrumentMusical: "INS", toolArtisan: "AT", setGaming: "GS" }[t] || "")) : null;
      if (ops && ops.length) out.push({ k: kk + ":" + i, adim: "ekip", tur: "tek", baslik: (g ? g.name : "Eşya") + " seç", adet: 1, secenekler: ops.map((a) => ({ d: a, ad: a, ack: "esya|" + a })) });
    });
  }
  // dinamik seçenekler (expertise: proficient skill'ler)
  const prof = ozetSkill(Y, S);
  for (const q of out) if (q.dinamik === "expertise") q.secenekler = [...prof].filter((x) => S.c.name !== "Wizard" || SCHOLAR.includes(x)).map((x) => ({ d: x, ad: SKILLS[x][0], ack: "skill|" + SKILLS[x][0] }));
  // aynı skill iki kaynaktan alınamaz: başka yerden gelenleri kapat
  const sabitSkill = new Set();
  if (bg) for (const sp of bg.skillProficiencies || []) Object.keys(sp).forEach((k) => sp[k] === true && sabitSkill.add(k));
  const skillSoru = out.filter((q) => !q.dinamik && q.secenekler.some((o) => SKILLS[o.d]));
  for (const q of skillSoru) {
    const baska = new Set(sabitSkill);
    for (const r of skillSoru) if (r !== q) sec(r.k).forEach((x) => baska.add(x));
    for (const o of q.secenekler) if (SKILLS[o.d] && baska.has(o.d)) o.devre = sabitSkill.has(o.d) ? "background'dan zaten var" : "başka bir seçimden zaten var";
  }
  // geçersiz kalan eski seçimleri işaretle
  for (const q of out) {
    const v = sec(q.k);
    q.deger = v;
    if (q.tur === "bgab") q.tamam = (v[0] === "21" && v[1] && v[2] && v[1] !== v[2]) || (v[0] === "111");
    else if (q.tur === "asi") q.tamam = v.length === 2;
    else q.tamam = v.length === q.adet && v.every((x) => q.secenekler.some((o) => o.d === x && !o.devre));
  }
  return out;
}
const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r.join(";") || "99"; };
function optUygun(o, L, Y) {
  for (const p of o.prerequisite || []) {
    if (p.level && (p.level.level || p.level) > L) return false;
    if (p.pact && !Object.values(Y.secim).flat().includes("Pact of the " + p.pact)) return false; // önce o pact seçilmeli
  }
  return true;
}
function featUygun(f, L) { return (f.prerequisite || [{}]).some((p) => !p.level || (p.level.level || p.level) <= L); }
function ekipOzet(l) { return (l || []).map((x) => typeof x === "string" ? buyuk(ref(x).ad) : x.item ? (x.quantity > 1 ? x.quantity + "× " : "") + (x.displayName || buyuk(ref(x.item).ad)) : x.value ? x.value / 100 + " gp" : x.special || "").filter(Boolean).join(", "); }
export { ekipOzet };

// Proficient skill kümesi (expertise seçenekleri ve hesap için)
function ozetSkill(Y, S) {
  const s = new Set(), sec = (k) => Y.secim[k] || [];
  const bg = bulBg(Y); if (bg) for (const sp of bg.skillProficiencies || []) Object.keys(sp).forEach((k) => sp[k] === true && s.add(k));
  sec("tur:skill").forEach((x) => s.add(x));
  sec("sinif:skill").forEach((x) => s.add(x));
  for (const [k, v] of Object.entries(Y.secim)) if (/:(skill|stl)$/.test(k) && k !== "tur:skill" && k !== "sinif:skill") v.forEach((x) => SKILLS[x] && s.add(x));
  return s;
}
function herZamanHazir(S, Y) {
  const L = Y.seviye, out = [], alt = (Y.secim["sinif:altset"] || [])[0];
  for (const k of [S.c, altSinif(S, Y)].filter(Boolean)) for (const e of k.additionalSpells || []) {
    if (e.name && k.additionalSpells.length > 1 && e.name !== alt) continue;
    for (const tur of ["prepared", "known"]) for (const [lv, v] of Object.entries(e[tur] || {})) if ((parseInt(lv.replace(/\D/g, ""), 10) || 1) <= L && Array.isArray(v)) v.forEach((x) => typeof x === "string" && out.push(ref(x).ad));
  }
  return out;
}

// ---------- hesap
export function hesapla(Y, S) {
  const L = Y.seviye, P = pb(L), sec = (k) => Y.secim[k] || [], c = S.c;
  const bg = bulBg(Y), tur = bulTur(Y), sub = altSinif(S, Y);
  // feat'ler
  const featler = [];
  if (bg) { const fr = bgFeat(bg); if (fr) featler.push({ f: bulFeat(fr), k: "bg:feat" }); }
  if (sec("tur:feat")[0]) featler.push({ f: bulFeat(sec("tur:feat")[0]), k: "tur:featx" });
  for (const [k, v] of Object.entries(Y.secim)) {
    if (/^sinif:asi:\d+$/.test(k) && v[0]) featler.push({ f: bulFeat(v[0]), k: k + "x" });
    const m = k.match(/^sinif:fp:.+:(\d+)$/); if (m) v.forEach((x) => featler.push({ f: bulFeat(x), k: "sinif:fpx:" + m[1] }));
  }
  const featAd = (x) => x.f && x.f.name;
  const var_ = (ad) => featler.some((x) => x.f && x.f.name === ad);
  // ability'ler
  const puan = {}; AB.forEach((a) => (puan[a] = +Y.temel[a] || 10));
  const bgab = sec("bg:ab");
  if (bgab[0] === "21") { if (bgab[1]) puan[bgab[1]] += 2; if (bgab[2]) puan[bgab[2]] += 1; }
  if (bgab[0] === "111" && bg) bg.ability[0].choose.weighted.from.forEach((a) => (puan[a] += 1));
  for (const x of featler) {
    if (!x.f) continue;
    if (x.f.name === "Ability Score Improvement") { const v = sec(x.k + ":asi"); if (v.length === 2) { puan[v[0]] += 1; puan[v[1]] += 1; } continue; }
    const a = (x.f.ability || [])[0]; if (!a) continue;
    if (a.choose) sec(x.k + ":ab").forEach((ab) => (puan[ab] += a.choose.amount || 1));
    else AB.forEach((ab) => a[ab] && (puan[ab] += a[ab]));
  }
  AB.forEach((a) => (puan[a] = Math.min(20, puan[a])));
  const m = {}; AB.forEach((a) => (m[a] = mod(puan[a])));
  // saves
  const saveProf = new Set(c.proficiency);
  featler.forEach((x) => sec(x.k + ":save").forEach((a) => saveProf.add(a)));
  const saves = {}; AB.forEach((a) => (saves[a] = { prof: saveProf.has(a), bonus: m[a] + (saveProf.has(a) ? P : 0) }));
  // skills
  const prof = ozetSkill(Y, S), exp = new Set();
  for (const [k, v] of Object.entries(Y.secim)) if (/^sinif:exp:/.test(k)) v.forEach((x) => exp.add(x));
  const jack = c.name === "Bard" && L >= 2;
  const skills = Object.entries(SKILLS).map(([k, [ad, ab]]) => {
    const p = exp.has(k) && prof.has(k) ? 2 : prof.has(k) ? 1 : 0;
    return { ad, yetenek: ab, prof: p, bonus: m[ab] + P * p + (!p && jack ? Math.floor(P / 2) : 0) };
  });
  // özellikler
  const ozel = [];
  const secilenler = new Set(Object.entries(Y.secim).filter(([k]) => k.startsWith("sinif:sec:")).flatMap(([, v]) => v));
  const secenekAdlari = new Set();
  for (const { f } of ozellikler(S, Y)) tara(f.entries, (t, e) => t === "secenek" && e.entries.forEach((r) => secenekAdlari.add(ref(r.classFeature || r.subclassFeature || r.optionalfeature || "").ad)));
  const esyaStat = [];
  for (const { f, alt, baslik } of ozellikler(S, Y)) {
    if (/^(Ability Score Improvement|Epic Boon|Subclass Feature)$/.test(f.name) || / (Subclass|Options)$/.test(f.name)) continue;
    if (secenekAdlari.has(f.name) && !secilenler.has(f.name)) continue;
    if (baslik && sub && f.name === sub.shortName) { tara(f.entries, (t, e) => t === "esya" && esyaStat.push(e)); continue; }
    ozel.push({ ad: f.name, kaynak: c.name, seviye: f.level });
    tara(f.entries, (t, e) => t === "esya" && esyaStat.push(e));
  }
  secilenler.forEach((ad) => { if (!ozel.some((o) => o.ad === ad)) ozel.push({ ad, kaynak: c.name, seviye: 1 }); });
  for (const [k, v] of Object.entries(Y.secim)) if (k.startsWith("sinif:opt:")) v.forEach((ad) => ozel.push({ ad, kaynak: c.name, seviye: 1 }));
  // species özellikleri (sürüm uygulanmış)
  const surum = sec("tur:surum")[0];
  let turGirdi = tur ? tur.entries : [];
  let turV = tur;
  if (tur && surum) {
    const v = (tur._versions || []).find((x) => x.name.endsWith("; " + surum));
    if (v) {
      turV = Object.assign({}, tur, v);
      const md = v._mod && v._mod.entries; turGirdi = tur.entries.slice();
      for (const mm of [].concat(md || [])) if (mm.mode === "replaceArr") { const i = turGirdi.findIndex((e) => e.name === mm.replace); if (i > -1) turGirdi.splice(i, 1, ...[].concat(mm.items)); }
    }
  }
  const turAd = tur ? tur.name + (surum ? " (" + surum + ")" : "") : "";
  for (const e of turGirdi || []) if (e && e.name && !/^(Creature Type|Size|Speed)$/.test(e.name)) ozel.push({ ad: e.name + (e.name === "Draconic Ancestry" && sec("tur:ejderha")[0] ? " (" + sec("tur:ejderha")[0] + ")" : ""), kaynak: tur.name, seviye: 1 });
  // HP
  const hd = c.hd.faces;
  let hp = hd + m.con + (L - 1) * (hd / 2 + 1 + m.con);
  if (var_("Tough")) hp += 2 * L;
  if (tur && tur.name === "Dwarf") hp += L;
  if (sub && /Draconic/.test(sub.name) && L >= 3) hp += L;
  // yetkinlikler
  const zirh = new Set(c.startingProficiencies.armor || []);
  secilenEtki(Y, "zirh").flat().forEach((z) => zirh.add(z));
  ekSilah = secilenEtki(Y, "silah").flat();
  // ekipman
  const envanter = [], para = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
  const ekle = (ad, adet, tip) => { const v = envanter.find((x) => x.ad === ad); if (v) v.adet += adet; else envanter.push({ ad, adet, tip: tip || "", kusanili: false }); };
  for (const [kk, liste] of [["sinif:ekip", c.startingEquipment.defaultData[0]], ["bg:ekip", bg && bg.startingEquipment[0]]]) {
    const s = sec(kk)[0]; if (!liste || !s || !liste[s]) continue;
    liste[s].forEach((it, i) => {
      if (typeof it === "string") it = { item: it };
      if (it.value) { para.gp += Math.floor(it.value / 100); para.sp += Math.floor((it.value % 100) / 10); para.cp += it.value % 10; return; }
      if (it.special) { ekle(it.special, 1); return; }
      const secilen = sec(kk + ":" + i)[0];
      if (it.equipmentType || it.equipmentTypes) { if (secilen) ekle(secilen, 1); return; }
      const r = ref(it.item), x = V.esya[n(r.ad)], g = V.grup[n(r.ad)];
      if (g) { ekle(secilen || g.name, 1); return; }
      ekle(it.displayName || (x ? x.name : buyuk(r.ad)), it.quantity || 1, x ? tipAd(x) : "");
    });
  }
  // kuşanma: en iyi yetkin zırh + kalkan, tüm silahlar
  const zirhlar = envanter.map((e) => [e, V.esya[n(e.ad)]]).filter(([, x]) => x && x.armor);
  let enIyi = null;
  for (const [e, x] of zirhlar) { const t = String(x.type).split("|")[0]; const ok = { LA: "light", MA: "medium", HA: "heavy" }[t]; if (ok && zirh.has(ok) && (!enIyi || x.ac > enIyi[1].ac)) enIyi = [e, x]; }
  if (enIyi) enIyi[0].kusanili = true;
  const kalkan = envanter.find((e) => { const x = V.esya[n(e.ad)]; return x && String(x.type).split("|")[0] === "S"; });
  if (kalkan && zirh.has("shield")) kalkan.kusanili = true;
  envanter.forEach((e) => { const x = V.esya[n(e.ad)]; if (x && x.weapon) e.kusanili = true; });
  // AC
  const fs = new Set(featler.map(featAd));
  let ac = 10 + m.dex;
  if (enIyi) { const x = enIyi[1], t = String(x.type).split("|")[0]; ac = x.ac + (t === "LA" ? m.dex : t === "MA" ? Math.min(2, m.dex) : 0); if (fs.has("Defense")) ac += 1; }
  else {
    if (c.name === "Barbarian") ac = Math.max(ac, 10 + m.dex + m.con);
    if (c.name === "Monk" && !(kalkan && kalkan.kusanili)) ac = Math.max(ac, 10 + m.dex + m.wis);
    if (sub && /Draconic/.test(sub.name) && L >= 3) ac = Math.max(ac, 10 + m.dex + m.cha);
  }
  if (kalkan && kalkan.kusanili && c.name !== "Monk") ac += 2;
  // hız, duyular
  let hiz = (turV && (typeof turV.speed === "object" ? turV.speed.walk : turV.speed)) || 30;
  const hizEk = tabloSutun(S, Y, "Unarmored Movement"); if (hizEk && !enIyi && !(kalkan && kalkan.kusanili)) hiz += +hizEk || 0;
  if (c.name === "Barbarian" && L >= 5 && !(enIyi && String(enIyi[1].type).startsWith("HA"))) hiz += 10;
  const duyular = {}; if (turV && turV.darkvision) duyular.Darkvision = turV.darkvision;
  // saldırılar
  const mastery = new Set(sec("sinif:mastery"));
  const saldirilar = [];
  const silahSatir = (x, adOver, kusanili) => {
    const props = (x.property || []).map((p) => String(p).split("|")[0]);
    const menzilli = String(x.type).startsWith("R"), finesse = props.includes("F");
    const ab = menzilli ? "dex" : finesse && m.dex > m.str ? "dex" : "str";
    const yet = silahYetkin(S, x) || !!adOver;
    let isabet = m[ab] + (yet ? P : 0), hb = m[ab];
    if (menzilli && fs.has("Archery")) isabet += 2;
    if (!menzilli && !props.includes("2H") && fs.has("Dueling")) hb += 2;
    if (props.includes("T") && fs.has("Thrown Weapon Fighting") && !menzilli) hb += 2;
    const ms = x.mastery && x.mastery[0] ? ref(typeof x.mastery[0] === "string" ? x.mastery[0] : x.mastery[0].uid).ad : null;
    return {
      ad: adOver || x.name, tip: x.name, kusanili,
      isabet, hasar: x.dmg1 + (hb ? (hb > 0 ? "+" : "") + hb : ""), tur: HASAR[x.dmgType] || "",
      menzil: x.range ? x.range + " ft" : props.includes("R") ? "10 ft" : "5 ft",
      mastery: ms && (mastery.has(x.name) || adOver) ? ms : null,
      ozellikler: props.map((p) => OZELLIK[p]).filter(Boolean),
    };
  };
  envanter.forEach((e) => { const x = V.esya[n(e.ad)]; if (x && x.weapon && x.dmg1) saldirilar.push(silahSatir(x, null, true)); });
  esyaStat.forEach((e) => { const x = V.esya[n(e.name)]; if (x && x.dmg1) saldirilar.push(silahSatir(x, x.name, true)); });
  const unarmed = c.name === "Monk" ? tabloSutun(S, Y, "Martial Arts") : null;
  const uab = unarmed && m.dex > m.str ? "dex" : "str";
  saldirilar.push({ ad: "Unarmed Strike", tip: "", kusanili: true, isabet: m[uab] + P, hasar: unarmed ? unarmed + (m[uab] ? (m[uab] > 0 ? "+" : "") + m[uab] : "") : String(Math.max(1, 1 + m.str)), tur: "Bludgeoning", menzil: "5 ft", mastery: null, ozellikler: [] });
  // büyü
  let buyu = null;
  const bc = sinifBuyucu(S, Y);
  const spell = (ad, etiket) => { const s = V.buyu[n(ad)]; return s ? { ad: s.name, seviye: s.level, konsantrasyon: !!(s.duration || []).some((d) => d.concentration), ritual: !!(s.meta && s.meta.ritual), not: etiket || "" } : null; };
  const liste = [];
  if (bc) {
    sec("buyu:cantrip").forEach((x) => liste.push(spell(x)));
    sec("buyu:hazir").forEach((x) => liste.push(spell(x)));
    herZamanHazir(S, Y).forEach((x) => liste.push(spell(x, "her zaman hazır")));
  }
  // feat ve species büyüleri
  for (const [k, v] of Object.entries(Y.secim)) if (/:sp:\d+$/.test(k)) v.forEach((x) => liste.push(spell(x)));
  if (tur && tur.additionalSpells) { const e = ekBuyuler(tur.additionalSpells, L, "tur:sp", tur.additionalSpells.length > 1 ? surum : null); e.sabit.forEach((x) => liste.push(spell(x.ad, turAd))); }
  for (const x of featler) if (x.f && x.f.additionalSpells && x.f.additionalSpells.length === 1) ekBuyuler(x.f.additionalSpells, 20, "", null).sabit.forEach((y) => liste.push(spell(y.ad, x.f.name)));
  const temiz = []; liste.filter(Boolean).forEach((s) => { if (!temiz.some((t) => t.ad === s.ad)) temiz.push(s); });
  if (bc || temiz.length) {
    const ab = bc ? bc.ab : sec("tur:spab")[0] || sec("bg:feat:spab")[0] || "cha";
    buyu = { sinif: bc ? c.name : tur ? tur.name : "Feat", yetenek: ab, save_dc: 8 + P + m[ab], isabet: P + m[ab], slotlar: slotlar(bc, L), buyuler: temiz.sort((a, b) => a.seviye - b.seviye || a.ad.localeCompare(b.ad)) };
  }
  // diller ve araçlar
  const diller = new Set(["Common", ...sec("dil")]);
  if (c.name === "Rogue") diller.add("Thieves' Cant");
  if (c.name === "Druid") diller.add("Druidic");
  for (const [k, v] of Object.entries(Y.secim)) if (/:dil$/.test(k)) v.forEach((x) => diller.add(x));
  for (const x of featler) for (const lp of (x.f && x.f.languageProficiencies) || []) Object.keys(lp).forEach((l) => lp[l] === true && diller.add(buyuk(l)));
  const araclar = new Set();
  for (const t of c.startingProficiencies.toolProficiencies || []) Object.keys(t).forEach((a) => t[a] === true && araclar.add(buyuk(a)));
  if (bg) for (const t of bg.toolProficiencies || []) Object.keys(t).forEach((a) => t[a] === true && araclar.add(buyuk(a)));
  for (const [k, v] of Object.entries(Y.secim)) if (/:(tool|stl)$/.test(k) || k === "bg:tool" || k === "sinif:tool") v.forEach((x) => !SKILLS[x] && araclar.add(String(x).replace(/^arac:/, "")));
  for (const x of featler) for (const tp of (x.f && x.f.toolProficiencies) || []) Object.keys(tp).forEach((a) => tp[a] === true && araclar.add(buyuk(a)));

  const perc = skills.find((s) => s.ad === "Perception");
  return {
    id: Y.id, ad: Y.ad || "İsimsiz", oyuncu: Y.oyuncu || "", tur: turAd, background: bg ? bg.name : "",
    siniflar: [{ ad: c.name, seviye: L, subclass: sub ? sub.name : null }], seviye: L, prof_bonus: P,
    yetenekler: Object.fromEntries(AB.map((a) => [a, { puan: puan[a], mod: m[a] }])),
    saves, skills, pasif_perception: 10 + perc.bonus, hp_max: hp, ac,
    initiative: m.dex + (var_("Alert") ? P : 0) + (jack ? Math.floor(P / 2) : 0), hiz, duyular,
    diller: [...diller].sort(), araclar: [...araclar].sort(), zirh: [...zirh], silah: c.startingProficiencies.weapons.concat(ekSilah).map((w) => String(w).replace(/\{@\w+ ([^|}]+)[^}]*\}/g, "$1")),
    saldirilar, buyu, ozellikler: ozel, featler: featler.map(featAd).filter(Boolean),
    envanter, para, avatar: Y.avatar || null, yerel: true,
    guncellendi: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC", yapi: Y,
  };
}
function tipAd(x) { const t = String(x.type || "").split("|")[0]; return { M: "Melee Weapon", R: "Ranged Weapon", LA: "Light Armor", MA: "Medium Armor", HA: "Heavy Armor", S: "Shield", A: "Ammunition", SCF: "Spellcasting Focus", AT: "Artisan's Tools", INS: "Instrument", GS: "Gaming Set", T: "Tool", G: "Adventuring Gear" }[t] || ""; }

export function bosYapi() {
  return { v: 1, id: Math.floor(Date.now() / 1000), ad: "", oyuncu: "", avatar: "", sinif: "", seviye: 1, subclass: "", background: "", tur: "", yontem: "standart", temel: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }, secim: {} };
}
