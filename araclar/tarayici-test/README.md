# Tarayıcı testleri (gerçek Chrome + CDP)

- `site-surucu.mjs`: site sayfalarını (üretici, karakter sayfası) gerçek Chrome'da adım adım sürer, ekran görüntüsü alır.
  (Owlbear SDK'sının sahtesi ve sürücüsü, Owlbear 2026-09-25'te bırakılınca kaldırıldı. Masanın tarayıcı testleri
  `araclar/masa/test/` altında: test-duman.js, test-zarbekle.js.)

Çalıştırma:

```
cd "E:/FRP Campaign/DnD"; python -m http.server 8790 --bind 127.0.0.1
"C:/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9341 --user-data-dir=<geçici klasör> about:blank
node kuyudan-yukari/araclar/tarayici-test/site-surucu.mjs <ekran-görüntüsü-klasörü> '<adımlar JSON>'
```

Adımlar: `["git", url]`, `["tik", css]`, `["degis", css, değer]`, `["bekle", ms]`, `["eval", js]`, `["shot", ad]`.
Kural verisi için adreslere `?veri=/kaynaklar/5etools/data/` ekle (yerel 5e.tools kopyası).
Adım listesinde kaçış karakteri gerekiyorsa listeyi Python ile üret (bash tırnakları bozuyor).
