"""D&D Beyond karakterlerini karşılaştırma için hazırlar (araclar/kural-test/ddb-karsilastir.mjs).

Kullanım:  python araclar/kural-test/ddb_hazirla.py 171472538 171472649 ...
Karakterler D&D Beyond'da Public olmalı. Çıktı: araclar/kural-test/ddb-veri/k_<id>.json (repoya girmez).
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import ddb_cevir as D  # noqa: E402

cikti = os.path.join(os.path.dirname(__file__), "ddb-veri")
os.makedirs(cikti, exist_ok=True)
for id_ in sys.argv[1:]:
    c = D.fetch(id_)
    opts = {o["id"]: o["label"] for cd in c["choices"].get("choiceDefinitions", []) for o in cd["options"]}
    secim = [opts.get(ch["optionValue"], str(ch["optionValue"])) for k in ("race", "class", "background", "feat")
             for ch in (c["choices"].get(k) or []) if ch.get("optionValue") is not None]
    sinif = c["classes"][0]
    json.dump({
        "id": c["id"], "ad": c["name"], "sinif": sinif["definition"]["name"], "seviye": sinif["level"],
        "subclass": (sinif.get("subclassDefinition") or {}).get("name"),
        "tur": c["race"]["baseRaceName"], "bg": c["background"]["definition"]["name"],
        "temel": [s["value"] for s in c["stats"]], "secim": secim,
        "buyuler": [s["definition"]["name"] for cs in c["classSpells"] for s in cs["spells"]] + [s["definition"]["name"] for v in (c.get("spells") or {}).values() for s in (v or [])],
        "featBuyu": [s["definition"]["name"] for s in ((c.get("spells") or {}).get("feat") or [])],
        "hazir": [s["definition"]["name"] for cs in c["classSpells"] for s in cs["spells"] if s.get("prepared") or s["definition"]["level"] == 0],
        "env": [[i["definition"]["name"], i["quantity"], 1 if i["equipped"] else 0] for i in c["inventory"]],
        "beklenen": D.convert(c),
    }, open(os.path.join(cikti, f"k_{id_}.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print("OK", id_, c["name"])
