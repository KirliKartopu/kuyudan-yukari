// Odaya kayıtlı karakterler (karakter üreticisinde yapılanlar).
// Oda metadata'sının sınırı 16 KB olduğu için sayfanın kendisi değil, sadece oyuncunun
// seçimleri (yapı) gzip + base64 olarak saklanır; sayfa açılırken kurallardan yeniden hesaplanır.
//   oda metadata'sı [K_YEREL] = { [id]: { v: "<gzip base64 yapı>", ad, tur, siniflar, avatar, sahip, sahipAd, guncellendi } }
export const K_YEREL = "com.kuyudan-yukari/yerel";
export const ODA_SINIRI = 15500; // bayt; Owlbear'ın 16 KB sınırının biraz altı

export async function sikistir(obj) {
  const akis = new Blob([JSON.stringify(obj)]).stream().pipeThrough(new CompressionStream("gzip"));
  const b = new Uint8Array(await new Response(akis).arrayBuffer());
  let s = ""; for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
}
export async function ac(b64) {
  const b = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const akis = new Blob([b]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(akis).text());
}

let K = null;
const onbellek = new Map();
// yapıdan karakter sayfası (aynı yapı ikinci kez hesaplanmaz)
// env: oyunda değişmiş envanter (kuşanma AC'yi ve saldırıları etkiler)
export async function hesapla(b64, env) {
  const anahtar = b64 + (env ? JSON.stringify(env.map((e) => [e[0], e[2]])) : "");
  if (onbellek.has(anahtar)) return onbellek.get(anahtar);
  const is = (async () => {
    K = K || (await import("./kural.js"));
    const Y = await ac(b64);
    await K.veriYukle();
    const S = await K.sinifYukle(Y.sinif);
    return K.hesapla(Y, S, env ? { env } : null);
  })();
  onbellek.set(anahtar, is);
  is.catch(() => onbellek.delete(anahtar));
  return is;
}
// listede gösterilecek özet
export function listeOgesi(id, k) {
  return { id: +id, ad: k.ad, oyuncu: k.sahipAd || "", tur: k.tur, siniflar: k.siniflar || [], avatar: k.avatar || null, yerel: true };
}
