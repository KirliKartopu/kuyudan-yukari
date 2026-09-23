"""D&D Beyond karakter verisini sitenin kullandığı sade JSON'a çevirir.

Kullanım:
    python araclar/ddb_cevir.py karakterler.json _site/karakterler

karakterler.json:  [{"id": 158776848, "oyuncu": "Ali"}, ...]
Her karakter için <çıktı>/<id>.json ve bir <çıktı>/liste.json yazılır.

Not: D&D Beyond'un resmi bir API'si yok; bu servis gayriresmi ve bir gün
değişebilir. Karakterin Beyond'da "Public" olması gerekir.
"""
import json
import math
import os
import sys
import time
import urllib.request

URL = "https://character-service.dndbeyond.com/character/v5/character/{}"

ABILITIES = ["str", "dex", "con", "int", "wis", "cha"]
ABILITY_SLUG = {"str": "strength", "dex": "dexterity", "con": "constitution",
                "int": "intelligence", "wis": "wisdom", "cha": "charisma"}
SKILLS = {  # slug -> (ad, yetenek)
    "acrobatics": ("Acrobatics", "dex"), "animal-handling": ("Animal Handling", "wis"),
    "arcana": ("Arcana", "int"), "athletics": ("Athletics", "str"),
    "deception": ("Deception", "cha"), "history": ("History", "int"),
    "insight": ("Insight", "wis"), "intimidation": ("Intimidation", "cha"),
    "investigation": ("Investigation", "int"), "medicine": ("Medicine", "wis"),
    "nature": ("Nature", "int"), "perception": ("Perception", "wis"),
    "performance": ("Performance", "cha"), "persuasion": ("Persuasion", "cha"),
    "religion": ("Religion", "int"), "sleight-of-hand": ("Sleight of Hand", "dex"),
    "stealth": ("Stealth", "dex"), "survival": ("Survival", "wis"),
}
# D&D Beyond'un özellik gibi görünen bölüm başlıkları
YAPISAL = {"Hit Points", "Proficiencies", "Equipment", "Epic Boon", "Primal Knowledge"}
MASTERIES = {"Cleave", "Graze", "Nick", "Push", "Sap", "Slow", "Topple", "Vex"}
SPELL_ABILITY = {"Wizard": "int", "Artificer": "int", "Cleric": "wis", "Druid": "wis",
                 "Ranger": "wis", "Bard": "cha", "Paladin": "cha", "Sorcerer": "cha",
                 "Warlock": "cha"}
# 2024 büyü slotları (seviye 1-5), tam ve yarım büyücüler
FULL = [[2], [3], [4, 2], [4, 3], [4, 3, 2]]
HALF = [[2], [2], [3], [3], [4, 2]]
FULL_CASTERS = {"Wizard", "Cleric", "Druid", "Bard", "Sorcerer"}
HALF_CASTERS = {"Ranger", "Paladin"}


def fetch(cid):
    req = urllib.request.Request(URL.format(cid), headers={"User-Agent": "kuyudan-yukari/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        body = json.load(r)
    if not body.get("success"):
        raise RuntimeError(body.get("data", {}).get("serverMessage", "bilinmeyen hata"))
    return body["data"]


def mod(score):
    return math.floor((score - 10) / 2)


def all_mods(d):
    return [m for group in d["modifiers"].values() for m in (group or [])]


def convert(d, oyuncu=""):
    mods = all_mods(d)
    level = sum(c["level"] for c in d["classes"])
    pb = 2 + (level - 1) // 4

    def has(typ, sub):
        return any(m["type"] == typ and m["subType"] == sub for m in mods)

    # Yetenek puanları: temel + tür/background/feat bonusları, override varsa o
    scores = {}
    for i, a in enumerate(ABILITIES):
        base = d["stats"][i]["value"] or 10
        bonus = (d["bonusStats"][i]["value"] or 0) + sum(
            (m.get("value") or 0) for m in mods
            if m["type"] == "bonus" and m["subType"] == f"{ABILITY_SLUG[a]}-score")
        sets = [m.get("value") for m in mods if m["type"] == "set" and m["subType"] == f"{ABILITY_SLUG[a]}-score" and m.get("value")]
        score = base + bonus
        if sets:
            score = max(score, max(sets))
        if d["overrideStats"][i]["value"]:
            score = d["overrideStats"][i]["value"]
        scores[a] = score
    am = {a: mod(s) for a, s in scores.items()}

    saves = {}
    for a in ABILITIES:
        prof = has("proficiency", f"{ABILITY_SLUG[a]}-saving-throws")
        extra = sum((m.get("value") or 0) for m in mods if m["type"] == "bonus" and m["subType"] == "saving-throws")
        saves[a] = {"prof": prof, "bonus": am[a] + (pb if prof else 0) + extra}

    skills = []
    jack = has("half-proficiency", "ability-checks")
    for slug, (name, ab) in SKILLS.items():
        level_prof = 2 if has("expertise", slug) else 1 if has("proficiency", slug) else 0
        bonus = am[ab] + pb * level_prof
        if level_prof == 0 and jack:
            bonus += pb // 2
        skills.append({"ad": name, "yetenek": ab, "prof": level_prof, "bonus": bonus})

    # HP
    con_hp = am["con"] * level
    per_level = sum((m.get("value") or 0) for m in mods if m["type"] == "bonus" and m["subType"] == "hit-points-per-level")
    hp_max = d["overrideHitPoints"] or (d["baseHitPoints"] + (d["bonusHitPoints"] or 0) + con_hp + per_level * level)

    # AC
    equipped = [i for i in d["inventory"] if i.get("equipped")]
    armor = next((i["definition"] for i in equipped if i["definition"].get("armorTypeId") in (1, 2, 3)), None)
    shield = any(i["definition"].get("armorTypeId") == 4 for i in equipped)
    if armor:
        t = armor["armorTypeId"]
        dex_part = am["dex"] if t == 1 else min(am["dex"], 2) if t == 2 else 0
        ac = armor["armorClass"] + dex_part
    else:
        ac = 10 + am["dex"]
        cls_names = {c["definition"]["name"] for c in d["classes"]}
        if "Barbarian" in cls_names:
            ac = max(ac, 10 + am["dex"] + am["con"])
        if "Monk" in cls_names and not shield:
            ac = max(ac, 10 + am["dex"] + am["wis"])
    if shield:
        ac += 2
    ac += sum((m.get("value") or 0) for m in mods if m["type"] == "bonus" and m["subType"] == "armor-class")

    # Initiative: Dex + (Alert gibi değersiz bonus = proficiency)
    init = am["dex"] + sum((m.get("value") if m.get("value") is not None else pb)
                           for m in mods if m["type"] == "bonus" and m["subType"] == "initiative")

    speed = d["race"].get("weightSpeeds", {}).get("normal", {}).get("walk") or 30
    senses = {m["subType"]: m.get("value") for m in mods if m["type"] == "sense"}
    languages = sorted({m["subType"].replace("-", " ").title() for m in mods if m["type"] == "language"})

    # Silahlar
    simple, martial = has("proficiency", "simple-weapons"), has("proficiency", "martial-weapons")
    attacks = []
    for it in d["inventory"]:
        w = it["definition"]
        if w.get("filterType") != "Weapon" or not w.get("damage"):
            continue
        props = [p["name"] for p in (w.get("properties") or [])]
        finesse, ranged = "Finesse" in props, w.get("attackType") == 2
        ab = "dex" if ranged else ("dex" if finesse and am["dex"] > am["str"] else "str")
        slug = (w.get("type") or w["name"]).lower().replace(", ", "-").replace(" ", "-")
        prof = (simple and w.get("categoryId") == 1) or (martial and w.get("categoryId") == 2) or has("proficiency", slug)
        magic = sum((m.get("value") or 0) for m in w.get("grantedModifiers", []) if m["type"] == "bonus" and m["subType"] == "magic")
        dmg_bonus = am[ab] + magic
        attacks.append({
            "ad": w["name"], "kusanili": bool(it.get("equipped")),
            "isabet": am[ab] + (pb if prof else 0) + magic,
            "hasar": w["damage"]["diceString"] + (f"{dmg_bonus:+d}" if dmg_bonus else ""),
            "tur": w.get("damageType") or "",
            "menzil": f'{w["range"]}/{w["longRange"]} ft' if ranged or "Thrown" in props else "5 ft",
            "mastery": next((p for p in props if p in MASTERIES), None),
            "ozellikler": [p for p in props if p not in MASTERIES],
        })
    attacks.sort(key=lambda a: (not a["kusanili"], a["ad"]))
    # aynı silahtan birden fazla varsa tekilleştir
    seen, uniq = set(), []
    for a in attacks:
        k = (a["ad"], a["kusanili"])
        if k not in seen:
            seen.add(k)
            uniq.append(a)

    # Büyüler
    spellcasting = None
    caster = next((c for c in d["classes"] if c["definition"]["name"] in SPELL_ABILITY), None)
    if caster:
        cname, clevel = caster["definition"]["name"], caster["level"]
        sab = SPELL_ABILITY[cname]
        table = FULL if cname in FULL_CASTERS else HALF if cname in HALF_CASTERS else None
        slots = table[min(clevel, 5) - 1] if table else []
        spells = []
        for cs in d["classSpells"]:
            for s in cs["spells"]:
                sd = s["definition"]
                if sd["level"] == 0 or s.get("prepared") or s.get("alwaysPrepared") or cname in ("Sorcerer", "Bard", "Warlock", "Ranger"):
                    spells.append({"ad": sd["name"], "seviye": sd["level"],
                                   "konsantrasyon": bool(sd.get("concentration")),
                                   "ritual": bool(sd.get("ritual"))})
        for src in (d.get("spells") or {}).values():
            for s in src or []:
                sd = s["definition"]
                spells.append({"ad": sd["name"], "seviye": sd["level"],
                               "konsantrasyon": bool(sd.get("concentration")), "ritual": bool(sd.get("ritual"))})
        spells = sorted({(s["seviye"], s["ad"]): s for s in spells}.values(), key=lambda s: (s["seviye"], s["ad"]))
        spellcasting = {"sinif": cname, "yetenek": sab, "save_dc": 8 + pb + am[sab],
                        "isabet": pb + am[sab], "slotlar": slots, "buyuler": spells}

    # Özellikler (yalnızca karakterin seviyesine kadar olanlar)
    features = []
    for c in d["classes"]:
        for cf in c["classFeatures"]:
            fd = cf["definition"]
            if fd["requiredLevel"] <= c["level"] and fd["name"] not in YAPISAL and not fd["name"].startswith(("Core ", "Ability Score Improvement"))                     and not fd["name"].endswith(("Subclass", "Archetype")):
                features.append({"ad": fd["name"], "kaynak": c["definition"]["name"], "seviye": fd["requiredLevel"]})
    for t in d["race"].get("racialTraits", []):
        n = t["definition"]["name"]
        if n not in ("Creature Type", "Size", "Speed", "Ability Score Increases", "Ability Score Increase", "Languages", "Age"):
            features.append({"ad": n, "kaynak": d["race"]["fullName"], "seviye": 1})

    bg = (d.get("background") or {}).get("definition") or {}
    avatar = (d.get("decorations") or {}).get("avatarUrl")

    return {
        "id": d["id"], "ad": d["name"].strip(), "oyuncu": oyuncu,
        "tur": d["race"]["fullName"], "background": bg.get("name"),
        "siniflar": [{"ad": c["definition"]["name"], "seviye": c["level"],
                      "subclass": (c.get("subclassDefinition") or {}).get("name")} for c in d["classes"]],
        "seviye": level, "prof_bonus": pb,
        "yetenekler": {a: {"puan": scores[a], "mod": am[a]} for a in ABILITIES},
        "saves": saves, "skills": skills,
        "pasif_perception": 10 + next(s["bonus"] for s in skills if s["ad"] == "Perception"),
        "hp_max": hp_max, "ac": ac, "initiative": init, "hiz": speed, "duyular": senses,
        "diller": languages, "saldirilar": uniq, "buyu": spellcasting,
        "ozellikler": features, "featler": [f["definition"]["name"] for f in d["feats"]],
        "envanter": [{"ad": i["definition"]["name"], "adet": i.get("quantity", 1), "kusanili": bool(i.get("equipped"))}
                     for i in d["inventory"]],
        "para": d.get("currencies", {}), "avatar": avatar,
        "beyond_url": f"https://www.dndbeyond.com/characters/{d['id']}",
        "guncellendi": time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime()),
    }


def main():
    liste_yolu, cikti = sys.argv[1], sys.argv[2]
    os.makedirs(cikti, exist_ok=True)
    liste = json.load(open(liste_yolu, encoding="utf-8"))
    ozet, hata = [], 0
    for k in liste:
        try:
            c = convert(fetch(k["id"]), k.get("oyuncu", ""))
            json.dump(c, open(os.path.join(cikti, f'{k["id"]}.json'), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            ozet.append({"id": c["id"], "ad": c["ad"], "oyuncu": c["oyuncu"], "tur": c["tur"],
                         "siniflar": c["siniflar"], "avatar": c["avatar"], "ornek": k.get("ornek", False)})
            print("OK  ", k["id"], c["ad"])
        except Exception as e:  # bir karakter bozuksa diğerleri yine yazılsın
            hata += 1
            print("HATA", k["id"], e)
    json.dump(ozet, open(os.path.join(cikti, "liste.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(ozet)} karakter, {hata} hata")


if __name__ == "__main__":
    main()
