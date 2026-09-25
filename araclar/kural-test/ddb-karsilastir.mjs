// D&D Beyond karakterlerini bizim motorda aynı seçimlerle kurup değerleri karşılaştırır.
// Önce: python araclar/kural-test/ddb_hazirla.py <id> <id> ...   Sonra: node araclar/kural-test/ddb-karsilastir.mjs
import { readFileSync, readdirSync } from "node:fs";
import { K } from "./kur.mjs";
const DIZIN = new URL("./ddb-veri/", import.meta.url);
await K.veriYukle();
const AB = ["str", "dex", "con", "int", "wis", "cha"];
const low = (s) => String(s).toLowerCase().replace(/[’']/g, "'").trim();
let toplamFark = 0;

for (const dosya of readdirSync(DIZIN).filter((f) => /^k_\d+\.json$/.test(f))) {
  const d = JSON.parse(readFileSync(new URL(dosya, DIZIN), "utf8")), E = d.beklenen;
  const S = await K.sinifYukle(d.sinif);
  const Y = Object.assign(K.bosYapi(), { sinif: d.sinif, seviye: d.seviye, secim: d.subclass ? { subclass: [d.subclass] } : {}, background: d.bg + "|XPHB", tur: d.tur + "|XPHB", yontem: "elle", ad: d.ad });
  AB.forEach((a, i) => (Y.temel[a] = d.temel[i]));
  // D&D Beyond seçimlerinden havuz: seçenek adı havuzdaysa seçilir
  const deger = d.secim.map((x) => x[1]), etiketli = (re) => new Set(d.secim.filter((x) => re.test(x[0])).map((x) => low(x[1])));
  const havuz = new Set(deger.map(low).concat(d.buyuler.map(low)));
  // etikete göre özel havuzlar: aynı değer başka bir soruya kaymasın
  const ozel = [[/^dil$/, etiketli(/^Select a Standard Language/)], [/Deft_Explorer:dil$/, etiketli(/Standard or Rare Language/)],
    [/^sinif:exp:/, etiketli(/Skill Expertise/)], [/^sinif:skill$/, etiketli(/Skill Proficiency/)]];
  const hazir = new Set(d.hazir.map(low));
  const ab = { strength: "str", dexterity: "dex", constitution: "con", intelligence: "int", wisdom: "wis", charisma: "cha" };
  const artis = deger.filter((x) => / Score$/.test(x)).map((x) => ab[low(x).replace(" score", "")]);
  for (let tur = 0; tur < 6; tur++) {
    for (const q of K.secimler(Y, S)) {
      if (q.tamam) continue;
      if (q.k === "bg:ab") { Y.secim[q.k] = artis.length === 2 ? ["21", artis[0], artis[1]] : ["111"]; continue; }
      if (/ekip$/.test(q.k)) { Y.secim[q.k] = ["B"]; continue; }
      if (q.k === "tur:boy") { Y.secim[q.k] = [havuz.has("small") ? "S" : "M"]; continue; }
      if (/spab$/.test(q.k)) { const a = q.secenekler.find((o) => havuz.has(low(K.AB_AD[o.d]))); if (a) Y.secim[q.k] = [a.d]; continue; }
      const aday = q.secenekler.filter((o) => !o.devre && (havuz.has(low(o.ad)) || havuz.has(low(o.d)) ||
        [...havuz].some((h) => h.startsWith(low(o.ad) + " (") || h.includes("(" + low(o.ad).replace(" ancestry", "") + ")") || low(o.ad).startsWith(h.split(" (")[0] + " "))));
      let secilen = aday;
      const oz = ozel.find(([re]) => re.test(q.k));
      if (oz) secilen = q.secenekler.filter((o) => !o.devre && oz[1].has(low(o.ad)));
      if (/^bg:feat:sp:/.test(q.k)) { // feat büyüleri D&D Beyond'un feat listesinden
        const fb = new Set((d.featBuyu || []).map(low));
        secilen = aday.filter((o) => fb.has(low(o.ad)));
      }
      if (q.k === "buyu:hazir" && !["Ranger", "Paladin", "Sorcerer", "Bard", "Warlock"].includes(d.sinif)) secilen = aday.filter((o) => hazir.has(low(o.ad)));
      if (secilen.length) Y.secim[q.k] = secilen.slice(0, q.adet).map((o) => o.d);
    }
  }
  const eksik = K.secimler(Y, S).filter((q) => !q.tamam && !/ekip/.test(q.k)).map((q) => q.k);
  const C = K.hesapla(Y, S, { env: d.env });
  const farklar = [];
  const kars = (ad, biz, onlar) => { if (JSON.stringify(biz) !== JSON.stringify(onlar)) farklar.push(`${ad}: biz ${JSON.stringify(biz)} · D&D Beyond ${JSON.stringify(onlar)}`); };
  AB.forEach((a) => kars(a.toUpperCase(), C.yetenekler[a].puan, E.yetenekler[a].puan));
  kars("HP", C.hp_max, E.hp_max); kars("AC", C.ac, E.ac); kars("Initiative", C.initiative, E.initiative); kars("Speed", C.hiz, E.hiz);
  kars("PB", C.prof_bonus, E.prof_bonus); kars("Pasif Perception", C.pasif_perception, E.pasif_perception);
  AB.forEach((a) => kars("Save " + a, [C.saves[a].prof, C.saves[a].bonus], [E.saves[a].prof, E.saves[a].bonus]));
  // Thaumaturge (Cleric) ve Magician (Druid): Int (Arcana/Religion ya da Arcana/Nature) check'lerine Wis bonusu (en az +1).
  // D&D Beyond'un skill sayısı bunu içermiyor; kural metni koşulsuz ekler, bu yüzden beklenene biz ekleriz.
  const secimAd = new Set((d.secim || []).map((x) => x[1])), wis = Math.max(1, E.yetenekler.wis.mod);
  const orderEk = { Thaumaturge: ["Arcana", "Religion"], Magician: ["Arcana", "Nature"] };
  for (const s of E.skills) {
    const b = C.skills.find((x) => x.ad === s.ad);
    const ek = Object.entries(orderEk).some(([o, l]) => secimAd.has(o) && l.includes(s.ad)) ? wis : 0;
    kars("Skill " + s.ad, [b.prof, b.bonus], [s.prof, s.bonus + ek]);
  }
  kars("Diller", C.diller.slice().sort(), E.diller.slice().sort());
  kars("Darkvision", C.duyular.Darkvision || null, (E.duyular || {}).darkvision || null);
  for (const a of E.saldirilar) { const b = C.saldirilar.find((x) => low(x.ad) === low(a.ad)); kars("Saldırı " + a.ad, b ? [b.isabet, b.hasar.replace(/\s/g, "")] : null, [a.isabet, a.hasar.replace(/\s/g, "")]); }
  if (E.buyu || C.buyu) {
    kars("Spell DC", C.buyu && C.buyu.save_dc, E.buyu && E.buyu.save_dc); kars("Spell atk", C.buyu && C.buyu.isabet, E.buyu && E.buyu.isabet);
    kars("Slotlar", C.buyu ? C.buyu.slotlar : [], E.buyu ? E.buyu.slotlar : []);
    // Wizard'ın spellbook'unda olup hazırlanmayanlar kağıtta ayrıca görünür; D&D Beyond yalnız hazırlananları verir
    kars("Büyüler", (C.buyu ? C.buyu.buyuler.filter((x) => !/^Spellbook:/.test(x.not || "")).map((x) => x.ad) : []).sort(), (E.buyu ? E.buyu.buyuler.map((x) => x.ad) : []).sort());
  }
  toplamFark += farklar.length;
  console.log(`\n## ${d.ad}: ${d.tur} ${d.sinif} ${d.seviye}, ${d.bg}` + (eksik.length ? `  (eşleşmeyen seçim: ${eksik.join(", ")})` : ""));
  console.log(farklar.length ? farklar.map((f) => "  ✗ " + f).join("\n") : "  ✓ tüm değerler aynı");
}
console.log(`\nToplam fark: ${toplamFark}`);
