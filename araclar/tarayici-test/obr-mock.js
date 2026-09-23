// Test için sahte Owlbear SDK: oda verisi, sahne token'ları ve yayınlar localStorage üzerinden sayfalar/iframe'ler arasında paylaşılır
const oku = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch (e) { return v; } };
const yaz = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const odaD = [], itemD = [], yayinD = {};
window.addEventListener("storage", (e) => {
  if (e.key === "mockOBR") odaD.forEach((f) => f(oku("mockOBR", {})));
  if (e.key === "mockItems") itemD.forEach((f) => f(oku("mockItems", [])));
  if (e.key === "mockYayin" && e.newValue) { const y = JSON.parse(e.newValue); (yayinD[y.ch] || []).forEach((f) => f({ data: y.data, connectionId: "baska" })); }
});
const hash = new URLSearchParams(location.hash.slice(1));
const rol = hash.get("rol") || localStorage.getItem("mockRol") || "PLAYER";
const noop = () => () => {};
window.__bildirim = [];
const items = () => oku("mockItems", []);
const OBR = {
  isAvailable: true, onReady: (f) => setTimeout(f, 0),
  theme: { getTheme: async () => ({ mode: "DARK" }), onChange: noop },
  player: { getId: async () => hash.get("id") || localStorage.getItem("mockOyuncu") || "oyuncu-1", getName: async () => hash.get("ad") || localStorage.getItem("mockAd") || "Ayşe", getRole: async () => rol,
    getConnectionId: async () => "baglanti-" + rol, getMetadata: async () => ({}), setMetadata: async () => {}, onChange: noop, getSelection: async () => [] },
  room: { getMetadata: async () => oku("mockOBR", {}), setMetadata: async (x) => { const m = { ...oku("mockOBR", {}), ...x }; for (const k in x) if (x[k] === undefined) delete m[k]; yaz("mockOBR", m); odaD.forEach((f) => f(m)); },
    onMetadataChange: (f) => { odaD.push(f); return () => {}; }, getPermissions: async () => ["CHARACTER_OWNER_ONLY"], onPermissionsChange: noop },
  notification: { show: async (m) => { window.__bildirim.push(m); } },
  modal: { open: async (o) => { window.__modal = o; }, close: async (id) => { window.__kapandi = id; } },
  broadcast: {
    onMessage: (ch, f) => { (yayinD[ch] = yayinD[ch] || []).push(f); return () => {}; },
    sendMessage: async (ch, data, o) => {
      const hedef = (o && o.destination) || "REMOTE";
      if (hedef !== "LOCAL") yaz("mockYayin", { ch, data, t: Math.random() });
      if (hedef !== "REMOTE") (yayinD[ch] || []).forEach((f) => f({ data, connectionId: "ben" }));
    },
  },
  party: { onChange: noop, getPlayers: async () => [] },
  scene: {
    isReady: async () => true, onReadyChange: noop,
    items: {
      getItems: async (f) => { const l = items(); return !f ? l : Array.isArray(f) ? l.filter((i) => f.includes(i.id)) : l.filter(f); },
      updateItems: async (ids, fn) => { const l = items(); const sec = l.filter((i) => (Array.isArray(ids) ? ids : []).includes(i.id)); fn(sec); yaz("mockItems", l); itemD.forEach((g) => g(l)); },
      addItems: async (y) => { const l = items().concat(y); yaz("mockItems", l); }, deleteItems: async () => {},
      onChange: (f) => { itemD.push(f); return () => {}; }, getItemBounds: async () => ({ center: { x: 0, y: 0 }, min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }),
    },
  },
  contextMenu: { create: async () => {} }, popover: { open: async () => {}, close: async () => {} },
  viewport: { getWidth: async () => 1400, getHeight: async () => 900 }, assets: { downloadImages: async () => [] }, tool: {}, interaction: {},
};
// buildLabel: zincirleme kurucu; sonuçta sade bir nesne
export function buildLabel() {
  const it = { id: "etiket-" + Math.random().toString(36).slice(2), layer: "TEXT", metadata: {}, text: { plainText: "" }, style: {} };
  const p = new Proxy({}, { get: (_, k) => k === "build" ? () => it : (v) => { if (k === "plainText") it.text.plainText = v; else if (k === "metadata") it.metadata = v; else if (k === "attachedTo") it.attachedTo = v; else if (k === "backgroundColor") it.style.backgroundColor = v; return p; } });
  return p;
}
export default OBR;
