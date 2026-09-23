# Kuyudan Yukarı

D&D 2024 maceramızın oyuncu sitesi: rehber, keyword sözlüğü ve (yakında) Owlbear Rodeo eklentileri.

- `rehber/` — Seans 0 için oyuncu rehberi
- `sozluk/` — aranabilir keyword sözlüğü (Owlbear panelinde de açılacak)
- `karakter/` — Türkçe karakter sayfası; veriler D&D Beyond'dan saatte bir çekilir
- `karakterler.json` — sitede görünecek karakterlerin D&D Beyond ID'leri (karakter Beyond'da **Public** olmalı)
- `araclar/ddb_cevir.py` — Beyond verisini sade JSON'a çeviren betik (GitHub Actions'ta çalışır)
- `assets/sozluk.js` — sözlüğün tek kaynağı; rehber ve sözlük sayfası buradan okur

Bu depoda yalnızca oyunculara yönelik içerik bulunur. DM notları, haritalar ve resmi görseller burada yer almaz.
