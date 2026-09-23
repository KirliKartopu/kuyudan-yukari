// Yerel handout görselleri: Owlbear depolamasına yüklenmeden, mesaj kanalıyla parça parça
// oyunculara gönderilir; her tarayıcı kendi IndexedDB'sinde saklar.
//   kucult(file)            -> Blob (en fazla 2000 px, webp)
//   kaydet(id, blob) / oku(id) / sil(id) / hepsi()
//   gonder(OBR, id, blob, kime) -> parçaları yayınlar (kanal: com.kuyudan-yukari/parca)
//   Alici(OBR, onTamam, hedefMi) -> parçaları toplar (hedefMi(kime) false ise saklamaz), tamamlanınca onTamam(id)
const DB = "ky-handout", STORE = "gorseller";
const KANAL = "com.kuyudan-yukari/parca";
const PARCA = 30000; // karakter (base64); Owlbear mesaj sınırının altında kalsın

function db() {
  return new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
}
async function islem(kip, fn) {
  const d = await db();
  return new Promise((ok, no) => {
    const tx = d.transaction(STORE, kip), st = tx.objectStore(STORE);
    const r = fn(st);
    tx.oncomplete = () => ok(r && r.result);
    tx.onerror = () => no(tx.error);
  });
}
export const kaydet = (id, blob) => islem("readwrite", (st) => st.put(blob, id));
export const oku = (id) => islem("readonly", (st) => st.get(id));
export const sil = (id) => islem("readwrite", (st) => st.delete(id));
export const hepsi = () => islem("readonly", (st) => st.getAllKeys());

export async function kucult(file, enFazla = 2000) {
  const bmp = await createImageBitmap(file);
  const oran = Math.min(1, enFazla / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * oran); c.height = Math.round(bmp.height * oran);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/webp", 0.85));
  return blob || new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
}

const blobB64 = (blob) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.readAsDataURL(blob); });
const b64Blob = (b64, tur) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new Blob([u], { type: tur }); };

export async function gonder(OBR, id, blob, kime = "hepsi") {
  const b64 = await blobB64(blob), n = Math.ceil(b64.length / PARCA);
  for (let i = 0; i < n; i++) {
    await OBR.broadcast.sendMessage(KANAL, { id, i, n, kime, tur: blob.type, veri: b64.slice(i * PARCA, (i + 1) * PARCA) }, { destination: "REMOTE" });
    await new Promise((r) => setTimeout(r, 40));
  }
  return n;
}

export function Alici(OBR, onTamam, hedefMi = () => true) {
  const bekleyen = {};
  OBR.broadcast.onMessage(KANAL, async ({ data }) => {
    if (!data || !data.id || !hedefMi(data.kime)) return; // bana değilse saklama
    if (await oku(data.id)) return; // zaten var
    const b = bekleyen[data.id] || (bekleyen[data.id] = { n: data.n, tur: data.tur, parcalar: [] });
    b.parcalar[data.i] = data.veri;
    if (b.parcalar.filter(Boolean).length === b.n) {
      delete bekleyen[data.id];
      await kaydet(data.id, b64Blob(b.parcalar.join(""), b.tur));
      onTamam && onTamam(data.id);
    }
  });
}
