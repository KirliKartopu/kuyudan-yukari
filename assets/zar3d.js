// 3D zar: sonucu önceden belirlenmiş zarları fizikle yuvarlar, böylece herkes aynı sonucu görür.
// zarAt(kap, "2d20@14,7+1d6@4", "crit", sesBildir)  ->  Promise (zarlar durunca çözülür)
// sesBildir(dosya, seviye): her fizik çarpışmasında çağrılır; sesi tıklanmış sayfa çalar (zar-ses.js)
import DiceBox from "https://cdn.jsdelivr.net/npm/@3d-dice/dice-box-threejs@0.0.12/+esm";

// Dokusuz renk setleri (harici dosya gerektirmez); sitenin paletinden
const RENKLER = {
  normal: { name: "ky-normal", foreground: "#1B211E", background: "#F3EAD6", outline: "#F3EAD6", texture: "none", material: "plastic" },
  crit: { name: "ky-crit", foreground: "#FFFFFF", background: "#5A3E9E", outline: "#5A3E9E", texture: "none", material: "metal" },
  fail: { name: "ky-fail", foreground: "#FFFFFF", background: "#8A2E2E", outline: "#8A2E2E", texture: "none", material: "plastic" },
};

export async function zarAt(kap, notasyon, tur, sesBildir) {
  if (!kap.id) kap.id = "zar-" + Math.random().toString(36).slice(2);
  const box = new DiceBox("#" + kap.id, {
    assetPath: new URL("./zar/", import.meta.url).href,
    sounds: !!sesBildir,
    volume: 100,
    theme_surface: "taverntable", // tahta masa sesi
    shadows: true,
    theme_customColorset: RENKLER[tur] || RENKLER.normal,
    baseScale: 95,
    strength: 1.3,
    gravity_multiplier: 400,
    light_intensity: 0.9,
  });
  if (sesBildir) {
    // Kütüphanenin ses nesneleri yerine: dosya yüklemez, çarpışmayı bildirir
    const sahte = {};
    box.loadAudio = (url) => {
      const dosya = String(url).split("/sounds/")[1];
      return Promise.resolve(sahte[dosya] || (sahte[dosya] = { volume: 0, play() { sesBildir(dosya, this.volume); return Promise.resolve(); } }));
    };
  }
  await box.initialize();
  return box.roll(notasyon);
}
