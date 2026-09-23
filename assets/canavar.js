// GM'e özel canavar paketi: tarayıcıda (IndexedDB) saklanır, siteye/depoya konmaz.
//   paketYukle(file) / paketOku() -> {adet, canavarlar}
//   ara(q) / bul(ad, kaynak)
//   statBlok(m) -> HTML (saldırı/hasar düğmeleri: data-hit, data-dmg)
//   zarIfade("2d6 + 3") -> {toplam, detay, zar}
//   acDeger(m), iniBonus(m), hpZarla(m)
const DB = "ky-canavar", STORE = "paket";
let bellek = null;

function db() {
  return new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
}
async function islem(kip, fn) {
  const d = await db();
  return new Promise((ok, no) => {
    const tx = d.transaction(STORE, kip), r = fn(tx.objectStore(STORE));
    tx.oncomplete = () => ok(r && r.result); tx.onerror = () => no(tx.error);
  });
}
export async function paketYukle(file) {
  const p = JSON.parse(await file.text());
  if (!p || !Array.isArray(p.canavarlar)) throw new Error("Bu bir canavar paketi değil");
  await islem("readwrite", (st) => st.put(p, "paket"));
  bellek = p; return p;
}
export async function paketOku() {
  if (!bellek) bellek = (await islem("readonly", (st) => st.get("paket"))) || null;
  return bellek;
}
const norm = (s) => String(s || "").toLocaleLowerCase("tr").normalize("NFKD").replace(/[̀-ͯ’']/g, "");
export async function ara(q, limit = 40, tumDunyalar = false) {
  const p = await paketOku(); if (!p) return [];
  const n = norm(q).trim(); if (!n) return [];
  const bas = [], ic = [];
  for (const m of p.canavarlar) {
    if (m.dunya && !tumDunyalar) continue; // başka dünyalar sadece istenirse
    const a = norm(m.name);
    if (a.startsWith(n)) bas.push(m); else if (a.includes(n)) ic.push(m);
    if (bas.length >= limit) break;
  }
  // 2024 kaynakları öne
  const yeni = (m) => (/^X|FRAiF|FRHoF|DrDe/.test(m.source) ? 0 : 1);
  return bas.concat(ic).sort((x, y) => yeni(x) - yeni(y)).slice(0, limit);
}
export async function bul(ad, kaynak) {
  const p = await paketOku(); if (!p) return null;
  return p.canavarlar.find((m) => m.name === ad && m.source === kaynak) || null;
}

// --- sayılar
const mod = (s) => Math.floor(((s || 10) - 10) / 2);
const sgn = (n) => (n >= 0 ? "+" : "") + n;
export const crSayi = (cr) => { const c = typeof cr === "object" && cr ? cr.cr : cr; if (!c) return 0; return String(c).includes("/") ? eval(c) : Number(c); };
export const pb = (m) => { const c = crSayi(m.cr); return c < 5 ? 2 : 2 + Math.floor((c - 1) / 4); };
export function acDeger(m) { const a = (m.ac || [])[0]; return typeof a === "number" ? a : (a && a.ac) || 10; }
export function iniBonus(m) { return mod(m.dex) + (m.initiative && m.initiative.proficiency ? pb(m) * m.initiative.proficiency : 0); }
export function hpZarla(m) { const f = m.hp && m.hp.formula; return f ? zarIfade(f).toplam : (m.hp && m.hp.average) || 1; }

// --- zar ifadesi: "2d6 + 3", "1d8+1d4+2"
export function zarIfade(ifade, kritik = false) {
  const temiz = String(ifade).replace(/\s+/g, ""), zarlar = [], parcalar = [];
  let toplam = 0;
  for (const p of temiz.match(/[+-]?[^+-]+/g) || []) {
    const isaret = p.startsWith("-") ? -1 : 1, g = p.replace(/^[+-]/, "");
    const z = g.match(/^(\d*)d(\d+)$/i);
    if (z) {
      const n = (+(z[1] || 1)) * (kritik ? 2 : 1), f = +z[2], at = [];
      for (let i = 0; i < n; i++) at.push(1 + Math.floor(Math.random() * f));
      toplam += isaret * at.reduce((a, b) => a + b, 0);
      zarlar.push(n + "d" + f + "@" + at.join(","));
      parcalar.push((isaret < 0 ? "-" : "") + n + "d" + f + " (" + at.join(", ") + ")");
    } else if (/^\d+$/.test(g)) { toplam += isaret * +g; parcalar.push(sgn(isaret * +g)); }
  }
  return { toplam, detay: parcalar.join(" "), zar: zarlar.join("+") };
}

// --- etiketler ve metin
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ATK = { m: "Melee Attack Roll:", r: "Ranged Attack Roll:", "m,r": "Melee or Ranged Attack Roll:", mw: "Melee Weapon Attack:", rw: "Ranged Weapon Attack:", "mw,rw": "Melee or Ranged Weapon Attack:", ms: "Melee Spell Attack:", rs: "Ranged Spell Attack:", "ms,rs": "Melee or Ranged Spell Attack:" };
const SAVE = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
function etiket(t, icerik) {
  const ilk = (icerik || "").split("|")[0];
  switch (t) {
    case "atk": case "atkr": return `<i>${ATK[ilk] || ilk}</i>`;
    case "hit": return `<button class="btn npc-z" data-hit="${esc(ilk)}" title="Saldırı zarı">${sgn(+ilk)}</button>`;
    case "damage": case "dice": return `<button class="btn npc-z" data-dmg="${esc(ilk)}" title="Hasar zarı">${esc(ilk)}</button>`;
    case "h": return "<i>Hit:</i> ";
    case "hom": return "<i>Hit or Miss:</i> ";
    case "m": return "<i>Miss:</i> ";
    case "dc": return `DC ${esc(ilk)}`;
    case "recharge": return `(Recharge ${ilk ? esc(ilk) + "–6" : "6"})`;
    case "actSave": return `<i>${SAVE[ilk] || ilk} Saving Throw:</i>`;
    case "actSaveFail": return "<i>Failure:</i>";
    case "actSaveSuccess": return "<i>Success:</i>";
    case "actSaveSuccessOrFail": return "<i>Failure or Success:</i>";
    case "actTrigger": return "<i>Trigger:</i>";
    case "actResponse": return "<i>Response:</i>";
    case "spell": return `<i data-ack="buyu|${esc(ilk)}">${esc(ilk)}</i>`;
    case "condition": return `<span class="kw" data-ack="cond|${esc(ilk)}">${esc(ilk)}</span>`;
    case "status": return `<span class="kw">${esc(ilk)}</span>`;
    default: { const ps = (icerik || "").split("|"); return esc(ps[2] || ps[0]); } // {@item ad|kaynak|görünen}
  }
}
export function metin(s) {
  return String(s).split(/(\{@[^}]*\})/).map((p) => {
    const m = p.match(/^\{@(\w+)\s*([^}]*)\}$/);
    return m ? etiket(m[1], m[2]) : esc(p);
  }).join("");
}
function girdiler(e) {
  if (e == null) return "";
  if (typeof e === "string") return `<p>${metin(e)}</p>`;
  if (Array.isArray(e)) return e.map(girdiler).join("");
  if (e.type === "list") return "<ul>" + (e.items || []).map((i) => `<li>${typeof i === "string" ? metin(i) : (i.name ? `<b>${metin(i.name)}.</b> ` : "") + (i.entry ? metin(i.entry) : girdiler(i.entries).replace(/^<p>|<\/p>$/g, ""))}</li>`).join("") + "</ul>";
  if (e.entries) return (e.name ? `<p><b>${metin(e.name)}.</b></p>` : "") + girdiler(e.entries);
  if (e.entry) return `<p>${metin(e.entry)}</p>`;
  return "";
}
function bolum(baslik, liste) {
  if (!liste || !liste.length) return "";
  return `<h3>${baslik}</h3>` + liste.map((x) => {
    const g = girdiler(x.entries);
    return x.name ? g.replace(/^<p>/, `<p><b><i>${metin(x.name)}.</i></b> `) : g;
  }).join("");
}
function buyuler(sc) {
  return (sc || []).map((s) => {
    let h = `<p><b><i>${metin(s.name)}.</i></b> ${(s.headerEntries || []).map(metin).join(" ")}</p><ul>`;
    if (s.will) h += `<li>At will: ${s.will.map(metin).join(", ")}</li>`;
    for (const [k, v] of Object.entries(s.daily || {})) h += `<li>${k.replace("e", "")}/day each: ${v.map(metin).join(", ")}</li>`;
    for (const [k, v] of Object.entries(s.spells || {})) h += `<li>${k === "0" ? "Cantrips" : "Level " + k + (v.slots ? ` (${v.slots} slots)` : "")}: ${(v.spells || []).map(metin).join(", ")}</li>`;
    return h + "</ul>" + (s.footerEntries || []).map((f) => `<p>${metin(f)}</p>`).join("");
  }).join("");
}
const BOY = { T: "Tiny", S: "Small", M: "Medium", L: "Large", H: "Huge", G: "Gargantuan" };
const nesne = (o) => Object.entries(o || {}).map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)} ${v}`).join(", ");
const listele = (l) => (l || []).map((x) => typeof x === "string" ? x : (x.special || [].concat(x.immune || x.resist || x.vulnerable || []).join(", ") + (x.note ? " " + x.note : ""))).join(", ");
export function statBlok(m) {
  const tur = typeof m.type === "string" ? m.type : (m.type && m.type.type) || "";
  const hiz = Object.entries(m.speed || {}).filter(([k]) => k !== "canHover").map(([k, v]) => (k === "walk" ? "" : k + " ") + (typeof v === "object" ? v.number : v) + " ft.").join(", ");
  const ac = (m.ac || []).map((a) => typeof a === "number" ? a : `${a.ac}${a.from ? " (" + a.from.map(metin).join(", ") + ")" : ""}${a.condition ? " " + metin(a.condition) : ""}`).join(", ");
  let h = `<div class="sb"><h2>${esc(m.name)}</h2><p class="sb-alt">${(m.size || []).map((s) => BOY[s] || s).join(" or ")} ${esc(tur)} · ${esc(m.source)}${m.page ? " s." + m.page : ""}</p>`;
  h += `<p><b>AC</b> ${ac} · <b>Initiative</b> <button class="btn npc-z" data-ini="${iniBonus(m)}">${sgn(iniBonus(m))}</button></p>`;
  h += `<p><b>HP</b> ${m.hp.average ?? "?"}${m.hp.formula ? " (" + esc(m.hp.formula) + ")" : ""} · <b>Speed</b> ${esc(hiz)}</p>`;
  h += `<table class="sb-yet"><tr>${["str", "dex", "con", "int", "wis", "cha"].map((a) => `<th>${a.toUpperCase()}</th>`).join("")}</tr><tr>` +
    ["str", "dex", "con", "int", "wis", "cha"].map((a) => `<td><button class="btn npc-z" data-chk="${mod(m[a])}" data-ad="${a.toUpperCase()}">${m[a] ?? 10} (${sgn(mod(m[a]))})</button></td>`).join("") + "</tr></table>";
  const sat = [];
  if (m.save) sat.push(`<b>Saving Throws</b> ${esc(nesne(m.save))}`);
  if (m.skill) sat.push(`<b>Skills</b> ${esc(nesne(m.skill))}`);
  if (m.vulnerable) sat.push(`<b>Vulnerabilities</b> ${esc(listele(m.vulnerable))}`);
  if (m.resist) sat.push(`<b>Resistances</b> ${esc(listele(m.resist))}`);
  if (m.immune) sat.push(`<b>Immunities</b> ${esc(listele(m.immune))}`);
  if (m.conditionImmune) sat.push(`<b>Condition Immunities</b> ${esc(listele(m.conditionImmune))}`);
  sat.push(`<b>Senses</b> ${esc([].concat(m.senses || []).join(", "))}${m.senses ? ", " : ""}Passive Perception ${m.passive ?? 10}`);
  if (m.languages) sat.push(`<b>Languages</b> ${esc([].concat(m.languages).join(", "))}`);
  sat.push(`<b>CR</b> ${esc(typeof m.cr === "object" ? m.cr.cr : m.cr ?? "—")} (PB ${sgn(pb(m))})`);
  h += sat.map((s) => `<p>${s}</p>`).join("");
  h += bolum("Traits", m.trait);
  if (m.spellcasting && m.spellcasting.length) h += "<h3>Spellcasting</h3>" + buyuler(m.spellcasting);
  h += bolum("Actions", m.action) + bolum("Bonus Actions", m.bonus) + bolum("Reactions", m.reaction);
  if (m.legendary) h += (m.legendaryHeader ? `<h3>Legendary Actions</h3>${m.legendaryHeader.map((x) => `<p>${metin(x)}</p>`).join("")}` : "") + bolum(m.legendaryHeader ? "" : "Legendary Actions", m.legendary).replace("<h3></h3>", "");
  return h + "</div>";
}
