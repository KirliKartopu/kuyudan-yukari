// Kural metninde yazan ama 5e.tools verisinde yapılandırılmış olmayan etkiler.
// Her satır bir özelliğin karakter sayfasına etkisidir; anahtar:
//   "Class|Subclass kısa adı|Özellik"  (subclass yoksa "Class||Özellik")
//   "feat:Ad", "opt:Ad" (invocation vb.), "sec:Ad" (özellik seçeneği), "tur:Species|Özellik"
// Alanlar:
//   ac:{taban:[ability..], kosul:"zirhsiz"|"zirhsiz_kalkansiz", sabit?}   taban AC formülü (10 + modlar ya da sabit + modlar)
//   acEk:{deger, kosul:"zirhli"|"her"}   hp:{seviye|sabit}   hiz:{deger, kosul:"agirsiz"|"zirhsiz_kalkansiz"|"her"}
//   hareket:{Climb|Swim|Fly: "hiz"|sayı}   init:"wis"|"pb"   initAv:true (advantage notu)
//   saveProf:[..]|"hepsi"   saveEk:{hedef:"hepsi"|ability, ab, min}   chaCheck:{ab, min}
//   skill:[..] sabit   skillSec:{from:[..]|"sinif"|"hepsi", adet}   skillYedek:"sinif" (zaten varsa yerine seçim)
//   exp:{from:[..]|"prof", adet} (soru)   expSabit:"skillSec" (seçilen skill'lere otomatik expertise)
//   tool:[..]   toolSec:{tur:"AT"|"GS"|"INS", adet}   toolYedek:"AT"   dil:[..]   dilSec:adet
//   silah:["martial"|"martial ranged"|"martial melee light-ok"]   zirh:["light","medium","heavy","shield"]
//   duyu:{Darkvision:60} (en büyüğü)   duyuEk:{Darkvision:60} (varsa üstüne)   direnc:[..]   direncSec:[..]
//   ab:{str:4, ..., max:25}   unarmed:{zar|zarTablo, ab, tur}   silahAb:{ab, kapsam:"melee"}   saldiri:[{ad, zar, tur, menzil, ab, props}]
//   masteryEk:n   cantripSec:{liste, adet}   esya:[..]   not:"sayfaya düşen kısa not"
export const ETKI = {
  // Barbarian
  "Barbarian||Unarmored Defense": { ac: { taban: ["dex", "con"], kosul: "zirhsiz" } },
  "Barbarian||Primal Knowledge": { skillSec: { from: "sinif", adet: 1 } },
  "Barbarian||Fast Movement": { hiz: { deger: 10, kosul: "agirsiz" } },
  "Barbarian||Feral Instinct": { initAv: true },
  "Barbarian||Primal Champion": { ab: { str: 4, con: 4, max: 25 } },
  "Barbarian|Wild Heart|Aspect of the Wilds": { secenek: { baslik: "Aspect of the Wilds", liste: [["Owl", "Darkvision +60"], ["Panther", "Climb Speed"], ["Salmon", "Swim Speed"]] } },
  "sec:Owl": { duyuEk: { Darkvision: 60 } },
  "sec:Panther": { hareket: { Climb: "hiz" } },
  "sec:Salmon": { hareket: { Swim: "hiz" } },
  // Bard
  "Bard|Lore|Bonus Proficiencies": { skillSec: { from: "hepsi", adet: 3 } },
  "Bard|Valor|Martial Training": { silah: ["martial"], zirh: ["medium", "shield"] },
  "Bard|Dance|Unarmored Defense": { ac: { taban: ["dex", "cha"], kosul: "zirhsiz_kalkansiz" } },
  "Bard|Dance|Bardic Damage": { unarmed: { zarTablo: "Bardic Die", ab: "dex", tur: "Bludgeoning" } },
  "Bard|Moon|Primal Lore": { dil: ["Druidic"], cantripSec: { liste: "Druid", adet: 1 }, skillSec: { from: ["animal handling", "insight", "medicine", "nature", "perception", "survival"], adet: 1 } },
  "Bard|Spirits|Channeler": { toolSec: { tur: "GS", adet: 1 } },
  // Cleric
  "sec:Protector": { silah: ["martial"], zirh: ["heavy"] },
  "sec:Thaumaturge": { cantripEk: 1 },
  "Cleric|Arcana|Student of Arcana": { skillSec: { from: ["arcana", "history", "insight", "medicine", "persuasion", "religion"], adet: 1 } },
  "Cleric|Knowledge|Blessings of Knowledge": { toolSec: { tur: "AT", adet: 1 }, skillSec: { from: ["arcana", "history", "nature", "religion"], adet: 2 }, expSabit: "skillSec" },
  "Cleric|Knowledge|Unfettered Mind": { saveProf: ["int"] },
  // Druid
  "sec:Warden": { silah: ["martial"], zirh: ["medium"] },
  "sec:Magician": { cantripEk: 1 },
  // Fighter
  "Fighter|Arcane Archer|Arcane Archer Lore": { skill: ["arcana", "nature"], skillYedek: "sinif" },
  "Fighter|Banneret|Knightly Envoy": { dilSec: 1, skillSec: { from: ["insight", "intimidation", "persuasion", "performance"], adet: 1 } },
  "Fighter|Battle Master|Student of War": { toolSec: { tur: "AT", adet: 1 }, skillSec: { from: "sinif", adet: 1 } },
  "Fighter|Champion|Remarkable Athlete": { initAv: true },
  // Monk
  "Monk||Unarmored Defense": { ac: { taban: ["dex", "wis"], kosul: "zirhsiz_kalkansiz" } },
  "Monk||Unarmored Movement": { hizTablo: { sutun: "Unarmored Movement", kosul: "zirhsiz_kalkansiz" } },
  "Monk||Martial Arts": { monk: true },
  "Monk||Disciplined Survivor": { saveProf: "hepsi" },
  "Monk||Body and Mind": { ab: { dex: 4, wis: 4, max: 25 } },
  "Monk|Mercy|Implements of Mercy": { skill: ["insight", "medicine"], tool: ["Herbalism Kit"] },
  "Monk|Shadow|Darkvision": { duyuEk: { Darkvision: 60 } },
  // Paladin
  "Paladin||Aura of Protection": { saveEk: { hedef: "hepsi", ab: "cha", min: 1 } },
  "Paladin|Noble Genies|Genie's Splendor": { ac: { taban: ["dex", "cha"], kosul: "zirhsiz" }, skillSec: { from: ["acrobatics", "intimidation", "performance", "persuasion"], adet: 1 } },
  "Paladin|Glory|Aura of Alacrity": { hiz: { deger: 10, kosul: "her" } },
  "Paladin|Noble Genies|Noble Scion": { hareket: { Fly: 60 } },
  "Paladin|Vengeance|Avenging Angel": { not: "Avenging Angel: 10 dk Fly 60" },
  // Ranger
  "Ranger||Deft Explorer": { dilSec: 2 },
  "Ranger||Roving": { hiz: { deger: 10, kosul: "agirsiz" }, hareket: { Climb: "hiz", Swim: "hiz" } },
  "Ranger||Feral Senses": { duyu: { Blindsight: 30 } },
  "Ranger|Hollow Warden|Hungering Might": { saveEk: { hedef: "con", ab: "wis", min: 1 } },
  "Ranger|Fey Wanderer|Otherworldly Glamour": { chaCheck: { ab: "wis", min: 1 }, skillSec: { from: ["deception", "performance", "persuasion"], adet: 1 } },
  "Ranger|Gloom Stalker|Dread Ambusher": { init: "wis" },
  "Ranger|Gloom Stalker|Umbral Sight": { duyuEk: { Darkvision: 60 } },
  "Ranger|Gloom Stalker|Iron Mind": { saveProf: ["wis"], saveYedek: ["int", "cha"] },
  "Ranger|Winter Walker|Frigid Explorer": { direnc: ["Cold"] },
  // Rogue
  "Rogue||Thieves' Cant": { dilSec: 1 },   // 2024: "Thieves' Cant and one other language of your choice"
  "Rogue||Slippery Mind": { saveProf: ["wis", "cha"] },
  "Rogue|Assassin|Assassin's Tools": { tool: ["Disguise Kit", "Poisoner's Kit"], esya: ["Disguise Kit", "Poisoner's Kit"] },
  "Rogue|Assassin|Assassinate": { initAv: true },
  "Rogue|Scion of the Three|Dread Allegiance": { secenek: { baslik: "Dread Allegiance: Ölü Üçlü'den biri", liste: [["Bane", "Psychic", "Minor Illusion"], ["Bhaal", "Poison", "Blade Ward"], ["Myrkul", "Necrotic", "Chill Touch"]] } },
  "sec:Bane": { direnc: ["Psychic"] },
  "sec:Bhaal": { direnc: ["Poison"] },
  "sec:Myrkul": { direnc: ["Necrotic"] },
  "Rogue|Phantom|Ghost Walk": { not: "Ghost Walk: Fly 10 (hover)" },
  // Sorcerer
  "Sorcerer|Draconic|Draconic Resilience": { hp: { seviye: 1 }, ac: { taban: ["dex", "cha"], kosul: "zirhsiz" } },
  "Sorcerer|Draconic|Elemental Affinity": { direncSec: ["Acid", "Cold", "Fire", "Lightning", "Poison"] },
  "Sorcerer|Shadow|Power of Shadow": { duyu: { Darkvision: 120, Blindsight: 10 } },
  "Sorcerer|Aberrant|Psychic Defenses": { direnc: ["Psychic"] },
  "Sorcerer|Spellfire|Crown of Spellfire": { not: "Crown of Spellfire: Fly 60 (hover)" },
  // Warlock
  "Warlock|Celestial|Radiant Soul": { direnc: ["Radiant"] },
  "Warlock|Great Old One|Thought Shield": { direnc: ["Psychic"] },
  "Warlock|Undead|Necrotic Husk": { direnc: ["Necrotic"] },
  "opt:Pact of the Blade": { silahAb: { ab: "cha", kapsam: "melee" } },
  "opt:Devil's Sight": { duyu: { "Devil's Sight": 120 } },
  "opt:Armor of Shadows": { ac: { taban: ["dex"], sabit: 13, kosul: "zirhsiz" } },
  "opt:Gift of the Depths": { hareket: { Swim: "hiz" } },
  // Wizard
  "Wizard|Enchanter|Enchanting Conversationalist": { skillSec: { from: ["deception", "intimidation", "persuasion"], adet: 1 } },
  "Wizard|Bladesinger|Training in War and Song": { silah: ["martial melee tek"], skillSec: { from: ["acrobatics", "athletics", "performance", "persuasion"], adet: 1 } },
  "Wizard|Bladesinger|Bladesong": { not: "Bladesong açıkken: AC + Int, Speed +10" },
  "Wizard|Necromancer|Necromancy Spellbook": { direnc: ["Necrotic"] },
  // Artificer (Eberron)
  "Artificer|Alchemist|Tools of the Trade": { tool: ["Alchemist's Supplies", "Herbalism Kit"], toolYedek: "AT" },
  "Artificer|Armorer|Tools of the Trade": { zirh: ["heavy"], tool: ["Smith's Tools"], toolYedek: "AT" },
  "Artificer|Artillerist|Tools of the Trade": { silah: ["martial ranged"], tool: ["Woodcarver's Tools"], toolYedek: "AT" },
  "Artificer|Battle Smith|Battle Ready": { silah: ["martial"] },
  "Artificer|Battle Smith|Tools of the Trade": { tool: ["Smith's Tools"], toolYedek: "AT" },
  "Artificer|Cartographer|Tools of the Trade": { tool: ["Calligrapher's Supplies", "Cartographer's Tools"], toolYedek: "AT" },
  "Artificer|Reanimator|Reanimator's Skill Set": { tool: ["Alchemist's Supplies"], toolYedek: "AT" },
  "Artificer|Armorer|Armor Model": { secenek: { baslik: "Armor Model", liste: [["Dreadnaught", "Force Demolisher 1d10"], ["Guardian", "Thunder Pulse 1d8"], ["Infiltrator", "Lightning Launcher 1d6, Speed +5"]] } },
  "sec:Dreadnaught": { saldiri: [{ ad: "Force Demolisher", zar: "1d10", tur: "Force", menzil: "10 ft", ab: "int", props: ["Reach"] }] },
  "sec:Guardian": { saldiri: [{ ad: "Thunder Pulse", zar: "1d8", tur: "Thunder", menzil: "5 ft", ab: "int", props: [] }] },
  "sec:Infiltrator": { hiz: { deger: 5, kosul: "her" }, saldiri: [{ ad: "Lightning Launcher", zar: "1d6", tur: "Lightning", menzil: "90/300 ft", ab: "int", props: [] }] },
  // Feat'ler (metinde kalan etkiler)
  "feat:Alert": { init: "pb" },
  "feat:Tough": { hp: { seviye: 2 } },
  "feat:Boon of Fortitude": { hp: { sabit: 40 } },
  "feat:Speedy": { hiz: { deger: 10, kosul: "her" } },
  "feat:Boon of Speed": { hiz: { deger: 30, kosul: "her" } },
  "feat:Mark of Passage": { hiz: { deger: 5, kosul: "her" } },
  "feat:Transmuted Anatomy": { hiz: { deger: 5, kosul: "her" } },
  "feat:Athlete": { hareket: { Climb: "hiz" } },
  "feat:Medium Armor Master": { ortaZirhDex3: true },
  "feat:Defense": { acEk: { deger: 1, kosul: "zirhli" } },
  "feat:Archery": { menzilliIsabet: 2 },
  "feat:Dueling": { tekElHasar: 2 },
  "feat:Thrown Weapon Fighting": { atmaHasar: 2 },
  "feat:Tavern Brawler": { unarmed: { zar: "1d4", ab: "str", tur: "Bludgeoning" } },
  "feat:Unarmed Fighting": { unarmed: { zar: "1d6", ab: "str", tur: "Bludgeoning" }, not: "Unarmed Fighting: silah ve kalkan tutmuyorsan 1d8" },
  "feat:Weapon Master": { masteryEk: 1 },
  "feat:Keen Mind": { profVarsaExp: true },
  "feat:Observant": { profVarsaExp: true },
  // Species (metinde kalan etkiler)
  "tur:Warforged|Integrated Protection": { acEk: { deger: 1, kosul: "her" } },
  "tur:Dwarf|Dwarven Toughness": { hp: { seviye: 1 } },
  // Dark Gift (RHW): masada unutulan dezavantaj ve Search bonusu kağıtta not olarak
  "feat:Watchers": { not: "Watchers: Search action'da ability check'e +1d4 · d20'de 1 gelirse Wis save (DC 13 + PB), başarısızsa 1 dakika D20 Test'lerde Disadvantage · Scrying'e karşı save'lerde Disadvantage" },
  "tur:Dhampir|Vampiric Bite": { unarmed: { zar: "1d4", ab: "con", tur: "Piercing", ad: "Vampiric Bite" } },
  "tur:Lupin|Feral Pounce": { unarmedTur: "Slashing" },
  "tur:Khoravar|Skill Versatility": { skillSec: { from: "hepsi", adet: 1 } },
};

// Sınırlı kullanımlı özellikler: karakter kağıdındaki sayaçlar. Buradakiler metinden okunamayanlar ya da okunanı düzeltenler;
// geri kalanını kural.js metinden okur ("Once you use this…", "a number of times equal to your … modifier", "Proficiency Bonus").
//   adet: sayı | "pb" | ability ("wis": mod, en az 1) | "tablo:Sütun" | "seviye" | "seviye*5" | "1+seviye" | { seviye: adet } (eşikler)
//   yenile: "uzun" | "kisa" (Short Rest'te hepsi)   kisaBir: Short Rest'te bir kullanım döner   kisaSv: bu seviyeden sonra yenile "kisa"
//   kisaGeri: Short Rest'te dönen miktar ("seviye/2")   zar: kullanımda atılan ("1d10+seviye", "pb d4"; havuzda tek zar: "d6" ya da eşikler)
//   havuz: true (adet zar ya da puan; kullanırken kaç tane)   tekSefer: bir seferde en fazla   birim: "zar" | "HP" | "puan"
//   iyilestir: "kendi" | "hedef" (masada seçili hedef, yoksa kendine)   ad: kağıttaki ad   yok: true (sayaç yok)
export const KULLANIM = {
  "Barbarian||Rage": { adet: "tablo:Rages", yenile: "uzun", kisaBir: true },
  "Barbarian||Persistent Rage": { yok: true },
  "Barbarian|Zealot|Warrior of the Gods": { adet: { 3: 4, 6: 5, 12: 6, 17: 7 }, yenile: "uzun", havuz: true, birim: "zar", zar: "d12", iyilestir: "kendi" },
  "Bard||Bardic Inspiration": { adet: "cha", yenile: "uzun", kisaSv: 5, zar: "tablo:Bardic Die", ad: "Bardic Inspiration" },
  "Bard||Font of Inspiration": { yok: true },
  "Cleric||Channel Divinity": { adet: "tablo:Channel Divinity", yenile: "uzun", kisaBir: true },
  "Cleric|Light|Warding Flare": { adet: "wis", yenile: "uzun", kisaSv: 6 },
  "Cleric|Light|Improved Warding Flare": { yok: true },
  "Druid||Wild Shape": { adet: "tablo:Wild Shape", yenile: "uzun", kisaBir: true },
  "Druid||Wild Resurgence": { adet: 1, yenile: "uzun", ad: "Wild Resurgence (slot)" },
  "Fighter||Second Wind": { adet: "tablo:Second Wind", yenile: "uzun", kisaBir: true, zar: "1d10+seviye", iyilestir: "kendi" },
  "Fighter||Action Surge": { adet: { 2: 1, 17: 2 }, yenile: "kisa" },
  "Fighter||Indomitable": { adet: { 9: 1, 13: 2, 17: 3 }, yenile: "uzun" },
  "Fighter|Battle Master|Combat Superiority": { adet: { 3: 4, 7: 5, 15: 6 }, yenile: "kisa", havuz: true, birim: "zar", tekSefer: 1, zar: { 3: "d8", 10: "d10", 18: "d12" }, ad: "Superiority Dice" },
  "Fighter|Psi Warrior|Psionic Power": { adet: { 3: 4, 5: 6, 9: 8, 13: 10, 17: 12 }, yenile: "uzun", kisaBir: true, havuz: true, birim: "zar", tekSefer: 1, zar: { 3: "d6", 5: "d8", 11: "d10", 17: "d12" }, ad: "Psionic Energy Dice" },
  "Rogue|Soulknife|Psionic Power": { adet: { 3: 4, 5: 6, 9: 8, 13: 10, 17: 12 }, yenile: "uzun", kisaBir: true, havuz: true, birim: "zar", tekSefer: 1, zar: { 3: "d6", 5: "d8", 11: "d10", 17: "d12" }, ad: "Psionic Energy Dice" },
  "Monk||Monk's Focus": { adet: "tablo:Focus Points", yenile: "kisa", havuz: true, birim: "puan", ad: "Focus Points" },
  "Paladin||Lay on Hands": { adet: "seviye*5", yenile: "uzun", havuz: true, birim: "HP", iyilestir: "hedef" },
  "Paladin||Paladin's Smite": { adet: 1, yenile: "uzun", ad: "Divine Smite (slotsuz)" },
  "Paladin||Channel Divinity": { adet: "tablo:Channel Divinity", yenile: "uzun", kisaBir: true },
  "Paladin||Faithful Steed": { adet: 1, yenile: "uzun", ad: "Find Steed (slotsuz)" },
  "Ranger||Favored Enemy": { adet: "tablo:Favored Enemy", yenile: "uzun", ad: "Hunter's Mark (slotsuz)" },
  "Sorcerer||Font of Magic": { adet: "tablo:Sorcery Points", yenile: "uzun", havuz: true, birim: "puan", ad: "Sorcery Points" },
  "Sorcerer||Sorcerous Restoration": { yok: true, kisaGeriHedef: "Sorcerer||Font of Magic", kisaGeri: "seviye/2" },
  "Warlock|Celestial|Healing Light": { adet: "1+seviye", yenile: "uzun", havuz: true, birim: "zar", tekSefer: "cha", zar: "d6", iyilestir: "hedef" },
  "Warlock||Mystic Arcanum": { adet: { 11: 1, 13: 2, 15: 3, 17: 4 }, yenile: "uzun", ad: "Mystic Arcanum (her büyü 1)" },
  "Wizard||Signature Spells": { adet: 2, yenile: "kisa", ad: "Signature Spells (her büyü 1)" },
  "Wizard|Diviner|Portent": { adet: { 3: 2, 14: 3 }, yenile: "uzun", ad: "Portent zarları" },
  "Wizard||Memorize Spell": { yok: true },
  "tur:Aasimar|Healing Hands": { adet: 1, yenile: "uzun", zar: "pb d4", iyilestir: "hedef" },
  "tur:Gnome|Speak with Animals": { adet: "pb", yenile: "uzun" },   // Forest Gnome: slotsuz büyü PB kadar
  "opt:Gift of the Depths": { adet: 1, yenile: "uzun", ad: "Water Breathing (slotsuz)" },
};
