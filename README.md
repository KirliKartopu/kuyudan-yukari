# Kuyudan Yukarı

D&D 2024 maceramızın oyuncu sitesi: rehber, keyword sözlüğü, karakter oluşturucu ve karakter sayfası.

- `rehber/` — Seans 0 için oyuncu rehberi (masaya nasıl girilir dahil)
- `sozluk/` — aranabilir keyword sözlüğü
- `olustur/` — 2024 kurallarıyla karakter oluşturucu (masada da açılır: `?masa=1`, doğrudan masaya kaydeder)
- `karakter/` — Türkçe karakter sayfası (tıklayınca zar atar)
- `karakterler.json` + `karakterler-yerel/<id>.json` — sitede görünen karakterler. Asıl kaynak masa: `araclar/masa/karakter-siteye.js` masadaki karakterleri hesaplayıp buraya yazar; commit + push ile yayınlanır
- `araclar/karakterleri_topla.py` — yayında karakter listesini derler (GitHub Actions)
- `assets/` — ortak kod: kural motoru (`kural.js`, `kural-etki.js`), karakter sayfası, oluşturucu, sözlük, zar. Masa sunucusu bu kodu `/k/` altında yerelden yayınlar

Bu depoda yalnızca oyunculara yönelik içerik bulunur. DM notları, haritalar ve resmi görseller burada yer almaz.
