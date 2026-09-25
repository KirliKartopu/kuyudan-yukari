// Çalıştır: node araclar/kural-test/altin.mjs   (yerel 5e.tools verisi gerekir, bkz. kur.mjs)
// Elle hesaplanmış referans karakterler (2024 PHB kurallarına göre). Her beklenen değerin gerekçesi yanında.
import { kur, K } from "./kur.mjs";
const T = (dizi) => Object.fromEntries(["str", "dex", "con", "int", "wis", "cha"].map((a, i) => [a, dizi[i]]));
let hata = 0, test = 0;
function bekle(ad, gercek, beklenen) {
  test++;
  const ok = JSON.stringify(gercek) === JSON.stringify(beklenen);
  if (!ok) { hata++; console.log(`  ✗ ${ad}: beklenen ${JSON.stringify(beklenen)}, çıkan ${JSON.stringify(gercek)}`); }
}
const skill = (c, ad) => c.skills.find((s) => s.ad === ad);
const atk = (c, ad) => c.saldirilar.find((a) => a.ad === ad) || {};

// G1 Rogue 3 Soulknife, Elf (Wood), Criminal (+2 Dex +1 Con), taban Dex15 Con13
{ const { c } = await kur("Rogue", { seviye: 3, background: "Criminal|XPHB", tur: "Elf|XPHB", temel: T([8, 15, 13, 12, 14, 10]) },
  { subclass: ["Soulknife"], "tur:surum": ["Wood Elf Lineage"], "bg:ab": ["21", "dex", "con"], "sinif:skill": ["acrobatics", "perception", "insight", "investigation"], "tur:skill": ["survival"], "sinif:exp:1": ["stealth", "sleight of hand"], "sinif:mastery": ["Dagger", "Shortsword"], "sinif:ekip": ["A"], "bg:ekip": ["A"] });
  console.log("G1 Rogue Soulknife");
  bekle("Dex", c.yetenekler.dex.puan, 17); bekle("HP 8+2+2×(5+2)", c.hp_max, 24); bekle("AC Leather 11+3", c.ac, 14);
  bekle("Init Dex3 + Alert PB2", c.initiative, 5); bekle("Speed Wood Elf", c.hiz, 35);
  bekle("Stealth expertise 3+4", skill(c, "Stealth").bonus, 7); bekle("Psychic Blade", [atk(c, "Psychic Blade").isabet, atk(c, "Psychic Blade").hasar], [5, "1d6+3"]);
  bekle("Dagger mastery", atk(c, "Dagger").mastery, "Nick"); bekle("Shortbow mastery yok", atk(c, "Shortbow").mastery, null);
  bekle("Para 8+16 gp", c.para.gp, 24); }

// G2 Monk 3 Mercy, Human (Tough), Sage (+2 Wis +1 Con)
{ const { c } = await kur("Monk", { seviye: 3, background: "Sage|XPHB", tur: "Human|XPHB", temel: T([8, 15, 13, 10, 14, 12]) },
  { subclass: ["Warrior of Mercy"], "bg:ab": ["21", "wis", "con"], "tur:feat": ["Tough|XPHB"], "tur:skill": ["perception"], "sinif:skill": ["acrobatics", "stealth"], "sinif:tool": ["Lute"], "sinif:ekip": ["A"], "bg:ekip": ["A"] });
  console.log("G2 Monk Mercy");
  bekle("Wis/Con", [c.yetenekler.wis.puan, c.yetenekler.con.puan], [16, 14]);
  bekle("HP 8+2+2×(5+2) + Tough 6", c.hp_max, 30); bekle("AC 10+Dex2+Wis3", c.ac, 15); bekle("Speed 30+10", c.hiz, 40);
  bekle("Unarmed Martial Arts 1d6+Dex", [atk(c, "Unarmed Strike").isabet, atk(c, "Unarmed Strike").hasar], [4, "1d6+2"]);
  bekle("Spear monk silahı: Dex", [atk(c, "Spear").isabet, atk(c, "Spear").hasar], [4, "1d6+2"]);
  bekle("Insight (Mercy) 3+2", skill(c, "Insight").bonus, 5); bekle("Medicine (Mercy) 3+2", skill(c, "Medicine").bonus, 5);
  bekle("Herbalism Kit", c.araclar.includes("Herbalism Kit"), true); }

// G3 Barbarian 5, Dwarf, Soldier (+2 Str +1 Con); A ekipmanında zırh yok
{ const { c } = await kur("Barbarian", { seviye: 5, background: "Soldier|XPHB", tur: "Dwarf|XPHB", temel: T([15, 13, 14, 8, 12, 10]) },
  { subclass: ["Path of the Berserker"], "bg:ab": ["21", "str", "con"], "sinif:skill": ["perception", "survival"], "sinif:asi:4": ["Ability Score Improvement|XPHB"], "sinif:asi:4x:asi": ["str", "con"], "sinif:mastery": ["Greataxe", "Handaxe", "Javelin"], "sinif:ekip": ["A"], "bg:ekip": ["A"], "etki:Barbarian_Primal_Knowledge:skill": ["nature"] });
  console.log("G3 Barbarian Dwarf 5");
  bekle("Str 15+2+1", c.yetenekler.str.puan, 18); bekle("Con 14+1+1", c.yetenekler.con.puan, 16);
  bekle("HP 12+3+4×(7+3) + Dwarf 5", c.hp_max, 60); bekle("AC 10+Dex1+Con3", c.ac, 14); bekle("Speed 30 + Fast Movement 10", c.hiz, 40);
  bekle("Greataxe +4+3", [atk(c, "Greataxe").isabet, atk(c, "Greataxe").hasar], [7, "1d12+4"]); bekle("Darkvision 120", c.duyular.Darkvision, 120);
  bekle("Poison resistance", c.direncler.includes("Poison"), true); bekle("Nature (Primal Knowledge)", skill(c, "Nature").prof, 1); }

// G4 Paladin 6, Human, Soldier; Chain Mail + Shield, Defense; Aura of Protection
{ const { c } = await kur("Paladin", { seviye: 6, background: "Soldier|XPHB", tur: "Human|XPHB", temel: T([15, 10, 13, 8, 12, 14]) },
  { subclass: ["Oath of Devotion"], "bg:ab": ["21", "str", "con"], "tur:feat": ["Alert|XPHB"], "tur:skill": ["insight"], "sinif:skill": ["persuasion", "religion"], "sinif:fp:Fighting Style:2": ["Defense|XPHB"], "sinif:asi:4": ["Ability Score Improvement|XPHB"], "sinif:asi:4x:asi": ["cha", "cha"], "sinif:mastery": ["Longsword", "Javelin"], "sinif:ekip": ["A"], "bg:ekip": ["A"] });
  console.log("G4 Paladin 6");
  bekle("Cha 14+2", c.yetenekler.cha.puan, 16);
  bekle("AC Chain 16 + Shield 2 + Defense 1", c.ac, 19);
  bekle("Wis save: Wis1 + PB3 + Aura Cha3", c.saves.wis.bonus, 7); bekle("Str save: Str3 + Aura3 (prof yok)", c.saves.str.bonus, 6);
  bekle("Speed 30 (Str 17 ≥ 13)", c.hiz, 30); }

// G5 Warlock 1, Pact of the Blade: Sickle Cha ile
{ const { c } = await kur("Warlock", { seviye: 1, background: "Acolyte|XPHB", tur: "Tiefling|XPHB", temel: T([8, 14, 13, 10, 12, 15]) },
  { "bg:ab": ["21", "cha", "wis"], "tur:surum": ["Infernal Legacy"], "sinif:skill": ["arcana", "deception"], "sinif:opt:Eldritch Invocations": ["Pact of the Blade"], "sinif:ekip": ["A"], "bg:ekip": ["A"] });
  console.log("G5 Warlock Pact of the Blade");
  bekle("Cha 17", c.yetenekler.cha.puan, 17);
  bekle("Sickle Cha +3+2", [atk(c, "Sickle").isabet, atk(c, "Sickle").hasar], [5, "1d4+3"]);
  bekle("Dagger (finesse, melee) de pakt", atk(c, "Dagger").isabet, 5);
  bekle("AC Leather 11+2", c.ac, 13); bekle("Fire resistance (Infernal)", c.direncler.includes("Fire"), true); }

// G6 Ranger 3 Gloom Stalker, Dwarf: Darkvision 120+60, Initiative + Wis
{ const { c } = await kur("Ranger", { seviye: 3, background: "Guide|XPHB", tur: "Dwarf|XPHB", temel: T([10, 15, 13, 8, 14, 12]) },
  { subclass: ["Gloom Stalker"], "bg:ab": ["21", "dex", "wis"], "sinif:skill": ["perception", "athletics", "insight"], "sinif:exp:2": ["stealth"], "sinif:mastery": ["Longbow", "Scimitar"], "sinif:fp:Fighting Style:2": ["Archery|XPHB"], "etki:Ranger_Deft_Explorer:dil": ["Elvish", "Giant"], "sinif:ekip": ["A"], "bg:ekip": ["A"] });
  console.log("G6 Ranger Gloom Stalker");
  bekle("Darkvision 120+60", c.duyular.Darkvision, 180); bekle("Init Dex3 + Wis2", c.initiative, 5);
  bekle("Longbow Archery: 3+2+2", [atk(c, "Longbow").isabet, atk(c, "Longbow").hasar], [7, "1d8+3"]);
  bekle("AC Studded 12+3", c.ac, 15); bekle("Deft Explorer dilleri", ["Elvish", "Giant"].every((d) => c.diller.includes(d)), true); }

// G7 Sorcerer 3 Draconic: AC 10+Dex+Cha, HP +3
{ const { c } = await kur("Sorcerer", { seviye: 3, background: "Noble|XPHB", tur: "Human|XPHB", temel: T([8, 14, 13, 10, 12, 15]) },
  { subclass: ["Draconic Sorcery"], "bg:ab": ["21", "cha", "str"], "tur:feat": ["Lucky|XPHB"], "tur:skill": ["insight"], "sinif:skill": ["arcana", "religion"], "sinif:ekip": ["A"], "bg:ekip": ["A"] });
  console.log("G7 Sorcerer Draconic");
  bekle("HP 6+1+2×(4+1) + 3", c.hp_max, 20); bekle("AC 10+Dex2+Cha3", c.ac, 15); }

// G8 Bard 3 Dance: zırhtan iyi olduğu için zırhsız AC; Unarmed = Bardic die + Dex
{ const { c } = await kur("Bard", { seviye: 3, background: "Entertainer|XPHB", tur: "Halfling|XPHB", temel: T([8, 14, 13, 10, 12, 15]) },
  { subclass: ["College of Dance"], "bg:ab": ["21", "cha", "dex"], "sinif:skill": ["deception", "insight", "persuasion"], "sinif:exp:2": ["performance", "persuasion"], "sinif:ekip": ["A"], "bg:ekip": ["A"] });
  console.log("G8 Bard Dance");
  bekle("AC 10+Dex2+Cha3 (Leather 13'ten iyi)", c.ac, 15);
  bekle("Unarmed 1d6+Dex (Bardic Die d6)", [atk(c, "Unarmed Strike").isabet, atk(c, "Unarmed Strike").hasar], [4, "1d6+2"]);
  bekle("Jack of All Trades: Athletics −1+1", skill(c, "Athletics").bonus, 0); bekle("Init'e Jack eklenmez", c.initiative, 2); }

// G9 Cleric 3 Knowledge: 2 skill + expertise, artisan tool
{ const { c } = await kur("Cleric", { seviye: 3, background: "Acolyte|XPHB", tur: "Human|XPHB", temel: T([10, 12, 13, 14, 15, 8]) },
  { subclass: ["Knowledge Domain"], "bg:ab": ["21", "wis", "int"], "tur:feat": ["Alert|XPHB"], "tur:skill": ["perception"], "sinif:skill": ["history", "medicine"], "sinif:sec:Divine Order:1": ["Thaumaturge"], "etki:Cleric_Knowledge_Blessings_of_Knowledge:skill": ["arcana", "nature"], "etki:Cleric_Knowledge_Blessings_of_Knowledge:tool": ["Smith's Tools"], "sinif:ekip": ["A"], "bg:ekip": ["A"] });
  console.log("G9 Cleric Knowledge");
  bekle("Arcana expertise Int2 + 2×2 + Thaumaturge Wis3", skill(c, "Arcana").bonus, 9); bekle("Nature expertise", skill(c, "Nature").prof, 2);
  bekle("Smith's Tools", c.araclar.includes("Smith's Tools"), true); bekle("AC Chain Shirt 13+1 + Shield 2", c.ac, 16); }

// G10 Fighter 3 Arcane Archer + Sage (Arcana zaten var) -> yedek skill sorusu çıkmalı
{ const r = await kur("Fighter", { seviye: 3, background: "Sage|XPHB", tur: "Human|XPHB", temel: T([10, 15, 13, 14, 12, 8]) },
  { subclass: ["Arcane Archer"], "bg:ab": ["21", "dex", "int"], "tur:feat": ["Alert|XPHB"], "tur:skill": ["perception"], "sinif:skill": ["athletics", "survival"], "sinif:fp:Fighting Style:1": ["Archery|XPHB"], "sinif:mastery": ["Longbow", "Shortsword", "Scimitar"], "sinif:ekip": ["B"], "bg:ekip": ["A"] });
  console.log("G10 Fighter Arcane Archer");
  const q = r.qs.find((x) => x.k.endsWith(":yedek:skill"));
  bekle("Arcana çakışınca yedek skill sorusu (1)", q && q.adet, 1);
  bekle("Nature proficient", skill(r.c, "Nature").prof, 1); }

// G11 Oyunda kuşanma: Fighter zırhı çıkarır / Barbarian zırh giyer / sonradan silah
{ const r = await kur("Fighter", { seviye: 1, background: "Soldier|XPHB", tur: "Human|XPHB", temel: T([15, 14, 13, 8, 12, 10]) },
  { "bg:ab": ["21", "str", "con"], "tur:feat": ["Alert|XPHB"], "tur:skill": ["perception"], "sinif:skill": ["acrobatics", "survival"], "sinif:fp:Fighting Style:1": ["Defense|XPHB"], "sinif:mastery": ["Greatsword", "Longsword", "Javelin"], "sinif:ekip": ["A"], "bg:ekip": ["A"] });
  console.log("G11 Kuşanma");
  bekle("Başlangıç: Chain Mail 16 + Defense 1", r.c.ac, 17);
  const env = [["Chain Mail", 1, 0], ["Greatsword", 1, 0], ["Longsword", 1, 1]];
  const c2 = K.hesapla(r.Y, r.S, { env });
  bekle("Zırh çıkınca 10 + Dex2 (Defense yok)", c2.ac, 12);
  bekle("Sonradan eklenen Longsword saldırıda, kuşanılı", [atk(c2, "Longsword").isabet, atk(c2, "Longsword").kusanili], [5, true]);
  bekle("Çıkarılan Greatsword çantada", atk(c2, "Greatsword").kusanili, false);
  const b = await kur("Barbarian", { seviye: 1, background: "Soldier|XPHB", tur: "Human|XPHB", temel: T([15, 14, 13, 8, 12, 10]) },
    { "bg:ab": ["21", "str", "con"], "tur:feat": ["Alert|XPHB"], "tur:skill": ["perception"], "sinif:skill": ["nature", "survival"], "sinif:mastery": ["Greataxe", "Handaxe"], "sinif:ekip": ["A"], "bg:ekip": ["A"] });
  bekle("Barbarian zırhsız 10+2+2", b.c.ac, 14);
  bekle("Scale Mail giyince 14 + min(Dex,2) (Unarmored Defense geçersiz)", K.hesapla(b.Y, b.S, { env: [["Scale Mail", 1, 1], ["Greataxe", 1, 1]] }).ac, 16);
  bekle("Kalkan kuşanınca +2", K.hesapla(b.Y, b.S, { env: [["Shield", 1, 1]] }).ac, 16); }

console.log(`\n${test - hata}/${test} doğru`);
process.exit(hata ? 1 : 0);
