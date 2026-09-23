# Tarayıcı testleri (gerçek Chrome + CDP)

Owlbear'ı buradan süremediğimiz için sahte bir Owlbear SDK'sı kullanılır.

- `obr-mock.js`: sahte SDK. Oda verisi, sahne token'ları ve yayınlar (broadcast)
  `localStorage` üzerinden sayfalar/iframe'ler arasında paylaşılır. Rol, oyuncu kimliği:
  `localStorage` (`mockRol`, `mockOyuncu`, `mockAd`) ya da sayfa adresinin `#rol=GM&id=…&ad=…` kısmı.
  Sahne token'ları: `localStorage.mockItems`. GM arka planını oyuncu paneline iframe olarak
  (`owlbear/background.html#rol=GM`) ekleyerek iki tarafı birlikte sınayabilirsin.
- `obr-surucu.mjs`: CDN'deki SDK isteğini CDP Fetch ile sahte SDK'yla değiştirir, adım listesini uygular.
- `site-surucu.mjs`: Owlbear'sız sayfalar (site üreticisi) için aynı sürücü.

Çalıştırma:

```
cd "E:/FRP Campaign/DnD"; python -m http.server 8790 --bind 127.0.0.1
"C:/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9341 --user-data-dir=<geçici klasör> about:blank
node araclar/tarayici-test/obr-surucu.mjs <ekran-görüntüsü-klasörü> araclar/tarayici-test/obr-mock.js '<adımlar JSON>'
```

Adımlar: `["git", url]`, `["tik", css]`, `["degis", css, değer]`, `["bekle", ms]`, `["eval", js]`, `["shot", ad]`.
Kural verisi için adreslere `?veri=/kaynaklar/5etools/data/` ekle (yerel 5e.tools kopyası).
Adım listesinde kaçış karakteri gerekiyorsa listeyi Python ile üret (bash tırnakları bozuyor).
