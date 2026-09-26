// Açıklama balonları: data-ack="tur|ad|ek" taşıyan öğelerin üstüne gelince 5e.tools açıklaması.
// Metinler sitemizde barındırılmaz; gerektiğinde 5e.tools'un kendi deposundan çekilir.
//   tur: skill | cond | ozellik (ek: sınıf ya da tür adı) | feat | esya | buyu | mastery
import { metin } from "./canavar.js";

// ?veri=... ile yerel bir kopya denenebilir (geliştirme)
const VERI = (typeof location !== "undefined" && new URLSearchParams(location.search).get("veri")) || "https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/";
const onbellek = {};
// eşyanın 5etools görseli (fluff-items.json, _copy zinciri). Masada (/k/ altından) dış görsel masanın vekilinden gelir (CSP).
async function esyaGorseli(x) {
  const f = (await cek("fluff-items.json")).itemFluff || [];
  let k = f.find((y) => y.name === x.name && y.source === x.source);
  for (let i = 0; i < 4 && k; i++) {
    const im = (k.images || []).find((y) => y.href && y.href.type === "internal" && y.href.path);
    if (im) { const u = "https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main/" + im.href.path.split("/").map(encodeURIComponent).join("/");
              return VERI.startsWith("/k/") ? "/g?u=" + encodeURIComponent(u) : u; }
    k = k._copy ? f.find((y) => y.name === k._copy.name && y.source === k._copy.source) : null;
  }
  return null;
}
const cek = (yol) => onbellek[yol] || (onbellek[yol] = fetch(VERI + yol).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }));
const n = (s) => String(s || "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ONCELIK = ["XPHB", "XDMG", "XMM", "FRHoF", "FRAiF", "PHB", "DMG", "TCE", "XGE"];
const sirala = (l) => l.sort((a, b) => (ONCELIK.indexOf(a.source) + 99) % 99 - (ONCELIK.indexOf(b.source) + 99) % 99);
const sec = (liste, ad) => sirala((liste || []).filter((x) => n(x.name) === n(ad)))[0];

function girdi(e) {
  if (e == null) return "";
  if (typeof e === "string") return `<p>${metin(e)}</p>`;
  if (Array.isArray(e)) return e.map(girdi).join("");
  if (e.type === "list") return "<ul>" + (e.items || []).map((i) => `<li>${typeof i === "string" ? metin(i) : (i.name ? `<b>${metin(i.name)}.</b> ` : "") + (i.entry ? metin(i.entry) : girdi(i.entries).replace(/<\/?p>/g, " "))}</li>`).join("") + "</ul>";
  if (e.type === "table") return "<table>" + (e.colLabels ? "<tr>" + e.colLabels.map((c) => `<th>${metin(c)}</th>`).join("") + "</tr>" : "") + (e.rows || []).map((r) => "<tr>" + r.map((c) => `<td>${typeof c === "string" ? metin(c) : metin(c.roll ? (c.roll.exact ?? `${c.roll.min}–${c.roll.max}`) : "")}</td>`).join("") + "</tr>").join("") + "</table>";
  if (e.entries) return (e.name ? `<p><b>${metin(e.name)}.</b></p>` : "") + girdi(e.entries);
  if (e.entry) return `<p>${metin(e.entry)}</p>`;
  return "";
}
// bir girdi ağacında adı eşleşen alt bölümü bul (tür özellikleri, büyü içindeki bölümler)
function altBolum(o, ad) {
  if (!o || typeof o !== "object") return null;
  if (!Array.isArray(o) && o.name && n(o.name) === n(ad) && o.entries) return o;
  for (const v of Array.isArray(o) ? o : Object.values(o)) { const r = altBolum(v, ad); if (r) return r; }
  return null;
}

// 5e.tools "_copy": başka bir türü temel alan türler (Lorwyn'in Kithkin'i Halfling'den) — kural.js'teki kopyaCoz'un kısa hali
function kopyaGirdi(x, hepsi, derin = 0) {
  if (!x._copy || derin > 4) return x.entries || [];
  const c = x._copy, t = hepsi.find((y) => y.name === c.name && y.source === c.source);
  let ent = t ? kopyaGirdi(t, hepsi, derin + 1).slice() : [];
  for (const m of [].concat((c._mod && c._mod.entries) || [])) {
    const items = [].concat(m.items || []);
    if (m.mode === "replaceArr") { const i = ent.findIndex((e) => e && e.name === m.replace); if (i > -1) ent.splice(i, 1, ...items); }
    else if (m.mode === "removeArr") ent = ent.filter((e) => !(e && [].concat(m.names || []).includes(e.name)));
    else ent = ent.concat(items);
  }
  return x.entries || ent;
}

async function bul(tur, ad, ek) {
  // "Draconic Ancestry (Black)", "Aspect of the Wilds (Owl)": seçenekli özelliğin kendisi bulunamazsa parantezsiz adıyla
  if (tur === "ozellik" && / \([^)]+\)$/.test(ad)) { const r = await bul0(tur, ad, ek); return r || bul0(tur, ad.replace(/ \([^)]+\)$/, ""), ek); }
  return bul0(tur, ad, ek);
}
async function bul0(tur, ad, ek) {
  if (tur === "skill") { const d = await cek("skills.json"); const x = sec(d.skill, ad); return x && { baslik: x.name, alt: "Skill · " + (x.ability || "").toUpperCase(), govde: girdi(x.entries) }; }
  if (tur === "cond") { const d = await cek("conditionsdiseases.json"); const x = sec(d.condition, ad); return x && { baslik: x.name, alt: "Condition", govde: girdi(x.entries) }; }
  if (tur === "feat") { const d = await cek("feats.json"); const x = sec(d.feat, ad); return x && { baslik: x.name, alt: "Feat · " + x.source, govde: girdi(x.entries) }; }
  if (tur === "mastery") { const d = await cek("items-base.json"); const x = sec(d.itemMastery, ad); return x && { baslik: x.name, alt: "Weapon Mastery", govde: girdi(x.entries) }; }
  if (tur === "buyu") {
    const d = await cek("spells/spells-xphb.json"); let x = sec(d.spell, ad);
    if (!x) { const e = await cek("spells/spells-phb.json"); x = sec(e.spell, ad); }
    if (!x) {
      // başka kitaplardaki büyüler: 5e.tools'un "büyü hangi kitapta" dizini
      const dizin = await cek("generated/gendata-spell-source-lookup.json");
      const kaynaklar = Object.keys(dizin).filter((k) => dizin[k][n(ad)]);
      for (const k of kaynaklar) { try { const f = await cek(`spells/spells-${k}.json`); x = sec(f.spell, ad); if (x) break; } catch (e) { /* dosya yok */ } }
    }
    if (!x) return null;
    const okul = { A: "Abjuration", C: "Conjuration", D: "Divination", E: "Enchantment", V: "Evocation", I: "Illusion", N: "Necromancy", T: "Transmutation" }[x.school] || "";
    const sure = (x.duration || [])[0] || {}, menzil = x.range && x.range.distance ? (x.range.distance.amount ? x.range.distance.amount + " " + x.range.distance.type : x.range.distance.type) : "";
    const zaman = (x.time || [])[0] || {};
    return { baslik: x.name, alt: `${x.level ? "Level " + x.level : "Cantrip"} ${okul} · ${zaman.number || ""} ${zaman.unit || ""} · ${menzil}${sure.concentration ? " · Concentration" : ""}`,
      govde: girdi(x.entries) + (x.entriesHigherLevel ? girdi(x.entriesHigherLevel) : "") };
  }
  if (tur === "esya") {
    const [b, m] = await Promise.all([cek("items-base.json"), cek("items.json")]);
    // D&D Beyond ile 5e.tools yazım farkları
    const adaylar = [ad, ad.replace(/^(.+), (.+)$/, "$2 $1"), ad + " Armor", ad.replace(/ \(\d+\)$/, ""),
      ad.replace(/^(.+?) of (.+?) \((.+)\)$/, "$1 of $3 $2"),   // Potion of Healing (Greater) -> Potion of Greater Healing
      ad.replace(/^(.+) \((.+)\)$/, "$1, $2"),                  // Figurine (Marble Elephant) -> Figurine, Marble Elephant
      ad.replace(/ \(.+\)$/, ""),                               // Feather Token (Feather Fall) -> Feather Token
      ad.replace(/s$/, ""), ad === "Bolts" ? "Crossbow Bolt" : "",
      ek || ""].filter(Boolean);                                  // özel adlı silah -> taban tür (Shortsword)
    let x = null;
    for (const a of adaylar) { x = sec(m.item, a) || sec(b.baseitem, a); if (x) break; }
    if (!x) return null;
    const meta = [x.weight ? x.weight + " lb." : "", x.value ? x.value / 100 + " gp" : "", x.dmg1 ? x.dmg1 + " " + ({ S: "Slashing", P: "Piercing", B: "Bludgeoning" }[x.dmgType] || "") : "", x.ac ? "AC " + x.ac : ""].filter(Boolean).join(" · ");
    const g = await esyaGorseli(x).catch(() => null);
    return { baslik: x.name, alt: (x.rarity && x.rarity !== "none" ? x.rarity + " · " : "") + meta,
             govde: (g ? `<img class="ack-gorsel" alt="" src="${esc(g)}" style="display:block;max-width:100%;max-height:170px;margin:0 auto 6px;border-radius:6px">` : "") + (girdi(x.entries) || "<p><i>Açıklama yok.</i></p>") };
  }
  if (tur === "ozellik") {
    // önce sınıf özelliği, sonra tür özelliği, sonra feat
    ad = ad.replace(/^\d+:\s*/, ""); // D&D Beyond numarası: "8: Ability Score Improvement"
    const sinif = n(ek || "").replace(/[^a-z]/g, "");
    if (sinif) {
      try {
        if (!SINIFLAR.includes(sinif)) throw 0;   // tür adı (Orc, Elf…): sınıf dosyası yok, boşuna 404 istemesin
        const d = await cek(`class/class-${sinif}.json`);
        const x = sec((d.classFeature || []).concat(d.subclassFeature || []), ad);
        if (x) return { baslik: x.name, alt: `${x.className}${x.subclassShortName ? " (" + x.subclassShortName + ")" : ""} · Sv ${x.level}`, govde: girdi(x.entries) };
      } catch (e) { /* sınıf değil, tür olabilir */ }
      // Eldritch Invocation, Metamagic, Maneuver gibi seçenekler ayrı dosyada
      const o = await cek("optionalfeatures.json");
      const y = sec(o.optionalfeature, ad);
      if (y) {
        const TIP = { EI: "Eldritch Invocation", MM: "Metamagic", "MV:B": "Maneuver", AS: "Arcane Shot", PB: "Pact Boon", AI: "Artificer Infusion", RN: "Rune" };
        const on = (y.prerequisite || []).flatMap((p) => [p.level ? "Sv " + (p.level.level || p.level) : "", ...(p.optionalfeature || []).map((q) => q.split("|")[0].split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")), p.spell ? "hasar veren bir cantrip" : ""]).filter(Boolean);
        return { baslik: y.name, alt: [(y.featureType || []).map((t) => TIP[t] || t).join(", "), y.source, on.length ? "Önkoşul: " + on.join(", ") : ""].filter(Boolean).join(" · "), govde: girdi(y.entries) };
      }
    }
    const r = await cek("races.json");
    const turler = sirala(r.race.filter((x) => ek && n(ek).includes(n(x.name))));
    for (const t of turler) { const b = altBolum(kopyaGirdi(t, r.race), ad); if (b) return { baslik: b.name, alt: t.name + " · " + t.source, govde: girdi(b.entries) }; }
    const f = await cek("feats.json"); const x = sec(f.feat, ad);
    if (x) return { baslik: x.name, alt: "Feat", govde: girdi(x.entries) };
    // feat'in bir bölümü (Lucky → Luck Points, Cult of the Dragon Initiate → Inspired by Fear): ek = feat adı
    const fx = ek && sec(f.feat, ek), fb = fx && altBolum(fx.entries, ad);
    if (fb) return { baslik: fb.name, alt: fx.name + " · Feat", govde: girdi(fb.entries) };
    return null;
  }
  return null;
}

// --- balon (tarayıcıda)
if (typeof document !== "undefined") {
const stil = document.createElement("style");
stil.textContent = `.ack-tip{position:fixed;z-index:60;max-width:min(340px,calc(100vw - 16px));max-height:55vh;overflow:auto;background:var(--surface,#fff);color:var(--ink,#111);
  border:1px solid var(--accent,#5A3E9E);border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.28);padding:10px 12px;font-size:13.5px;line-height:1.45}
.ack-tip h4{margin:0;font-size:16px;font-family:var(--display,serif)} .ack-tip .alt{color:var(--muted,#666);font-size:12px;margin:0 0 6px}
.ack-tip p{margin:4px 0} .ack-tip ul{margin:4px 0;padding-left:16px} .ack-tip table{border-collapse:collapse;font-size:12px;min-width:0} .ack-tip td,.ack-tip th{padding:2px 6px;border-bottom:1px solid var(--line,#ddd)}
.ack-tip .btn{pointer-events:none} [data-ack]{cursor:help} [data-ack].btn,[data-ack] button{cursor:pointer}`;
document.head.appendChild(stil);
const tip = document.createElement("div"); tip.className = "ack-tip"; tip.hidden = true; tip.setAttribute("role", "tooltip");
document.body.appendChild(tip);
let hedef = null, zaman = null;
function yerlestir(el) {
  const r = el.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  tip.style.left = Math.max(8, Math.min(r.left, W - tip.offsetWidth - 8)) + "px";
  const alt = r.bottom + 6, ust = r.top - tip.offsetHeight - 6;
  tip.style.top = (alt + tip.offsetHeight < H - 8 || ust < 8 ? Math.min(alt, H - tip.offsetHeight - 8) : ust) + "px";
}
async function goster(el) {
  const [tur, ad, ek] = el.getAttribute("data-ack").split("|");
  hedef = el; tip.innerHTML = `<h4>${esc(ad)}</h4><p class="alt">Yükleniyor…</p>`; tip.hidden = false; yerlestir(el);
  let v = null;
  try { v = await bul(tur, ad, ek); } catch (e) { v = null; }
  if (hedef !== el) return;
  tip.innerHTML = v ? `<h4>${esc(v.baslik)}</h4><p class="alt">${esc(v.alt || "")}</p>${v.govde}` : `<h4>${esc(ad)}</h4><p class="alt">5e.tools'ta açıklama bulunamadı.</p>`;
  yerlestir(el);
}
function gizle() { clearTimeout(zaman); hedef = null; tip.hidden = true; }
document.addEventListener("mouseover", (e) => {
  if (tip.contains(e.target)) { clearTimeout(zaman); return; } // balonun içindeki kelimeler balonu değiştirmesin/kapatmasın
  const el = e.target.closest && e.target.closest("[data-ack]");
  if (!el) { if (hedef) { clearTimeout(zaman); zaman = setTimeout(gizle, 150); } return; }
  if (el === hedef) return;
  clearTimeout(zaman); zaman = setTimeout(() => goster(el), 280);
});
tip.addEventListener("mouseover", () => clearTimeout(zaman));
document.addEventListener("focusin", (e) => { const el = e.target.closest && e.target.closest("[data-ack]"); if (el) goster(el); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") gizle(); });
document.addEventListener("scroll", gizle, true);

}

const SINIFLAR = ["artificer", "barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"];
export { bul as aciklamaBul, cek, girdi, n as normal, esc, sirala, sec };
