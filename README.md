# Kuyudan Yukarı

D&D 2024 maceramızın oyuncu sitesi: rehber, keyword sözlüğü ve (yakında) Owlbear Rodeo eklentileri.

- `rehber/` — Seans 0 için oyuncu rehberi
- `sozluk/` — aranabilir keyword sözlüğü (Owlbear panelinde de açılacak)
- `karakter/` — Türkçe karakter sayfası
- `karakterler.json` — sitede görünecek karakterler. `"yerel": true` olanlar üreticide yapılmış, dosyaları `karakterler-yerel/<id>.json`. Owlbear paneli bu listeyi ve odaya kaydedilen karakterleri birlikte gösterir
- `araclar/ddb_cevir.py` — karakter listesini derler (yerel dosyaları kopyalar; D&D Beyond ID'si varsa Beyond verisini çevirir). GitHub Actions'ta çalışır
- `assets/sozluk.js` — sözlüğün tek kaynağı; rehber ve sözlük sayfası buradan okur

Bu depoda yalnızca oyunculara yönelik içerik bulunur. DM notları, haritalar ve resmi görseller burada yer almaz.
