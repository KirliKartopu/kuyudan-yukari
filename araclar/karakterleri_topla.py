"""Sitenin karakter listesini derler (GitHub Actions'ta, yayından önce).

    python araclar/karakterleri_topla.py karakterler.json _site/karakterler

karakterler.json:  [{"id": 1790210001, "oyuncu": "", "yerel": true}, ...]
Karakterlerin asıl kaynağı masa (araclar/masa); masadan eşitlenen dosyalar karakterler-yerel/<id>.json'dadır
(araclar/masa/karakter-siteye.js yazar) ve olduğu gibi kopyalanır. Çıktı: _site/karakterler/<id>.json + liste.json.
(D&D Beyond köprüsü 2026-09-26'da kaldırıldı; karakterler kendi üreticimizde yapılıyor.)
"""
import json
import os
import sys


def main():
    liste_yolu, cikti = sys.argv[1], sys.argv[2]
    os.makedirs(cikti, exist_ok=True)
    liste = json.load(open(liste_yolu, encoding="utf-8"))
    kok = os.path.dirname(liste_yolu) or "."
    ozet, hata = [], 0
    for k in liste:
        try:
            c = json.load(open(os.path.join(kok, "karakterler-yerel", f'{k["id"]}.json'), encoding="utf-8"))
            c["id"] = k["id"]
            c["oyuncu"] = k.get("oyuncu") or c.get("oyuncu", "")
            json.dump(c, open(os.path.join(cikti, f'{k["id"]}.json'), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            ozet.append({"id": c["id"], "ad": c["ad"], "oyuncu": c["oyuncu"], "tur": c["tur"], "siniflar": c["siniflar"], "avatar": c.get("avatar", "")})
            print("OK  ", k["id"], c["ad"])
        except Exception as e:  # bir karakter bozuksa diğerleri yine yazılsın
            hata += 1
            print("HATA", k["id"], e)
    json.dump(ozet, open(os.path.join(cikti, "liste.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(ozet)} karakter, {hata} hata")
    if hata:
        sys.exit(1)


if __name__ == "__main__":
    main()
