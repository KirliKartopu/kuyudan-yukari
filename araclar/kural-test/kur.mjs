import { readFileSync } from "node:fs";
// 5e.tools verisinin yerel kopyası (git sparse clone). KURAL_VERI ile değiştirilebilir.
const D = (process.env.KURAL_VERI || "E:/FRP Campaign/DnD/kaynaklar/5etools/data").replace(/\/?$/, "/");
globalThis.fetch = async (u) => { const p = D + String(u).split("/data/").pop(); try { const t = readFileSync(p, "utf8"); return { ok: true, json: async () => JSON.parse(t) }; } catch { return { ok: false, status: 404 }; } };
const K = await import(new URL("../../assets/kural.js", import.meta.url));
await K.veriYukle();
export async function kur(sinif, Y0, cevap) {
  const S = await K.sinifYukle(sinif);
  const Y = Object.assign(K.bosYapi(), { sinif, dunyalar: true }, Y0);
  // cevap: {anahtar: değer[]} ya da otomatik ilk seçenekler
  for (let tur = 0; tur < 6; tur++) {
    for (const q of K.secimler(Y, S)) {
      if (q.tamam) continue;
      if (cevap[q.k]) { Y.secim[q.k] = cevap[q.k]; continue; }
      if (q.tur === "bgab") Y.secim[q.k] = ["21", q.secenekler[0], q.secenekler[1]];
      else if (q.tur === "asi") Y.secim[q.k] = ["str", "dex"];
      else Y.secim[q.k] = q.secenekler.filter((o) => !o.devre).slice(0, q.adet).map((o) => o.d);
    }
  }
  const qs = K.secimler(Y, S);
  return { Y, S, qs, c: K.hesapla(Y, S) };
}
export { K };
