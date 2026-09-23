import { writeFileSync } from "node:fs";
const PORT = 9341, OUT = process.argv[2];
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const bek = {}; const hatalar = [];
const cmd = (method, params = {}) => new Promise((ok) => { const i = ++id; bek[i] = ok; ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && bek[d.id]) bek[d.id](d.result || d.error); if (d.method === "Runtime.exceptionThrown") hatalar.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") hatalar.push(d.params.args.map((a) => a.value || a.description).join(" ")); };
await new Promise((r) => (ws.onopen = r));
await cmd("Runtime.enable"); await cmd("Page.enable"); await cmd("Network.enable"); await cmd("Network.setCacheDisabled", { cacheDisabled: true });
await cmd("Emulation.setDeviceMetricsOverride", { width: +(process.env.W||1400), height: +(process.env.H||1000), deviceScaleFactor: 1, mobile: !!process.env.W });
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = async (e) => { const r = await cmd("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true }); return r.result ? r.result.value : r; };
const shot = async (ad) => { const r = await cmd("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); writeFileSync(`${OUT}/${ad}.png`, Buffer.from(r.data, "base64")); };
const URL_ = "http://127.0.0.1:8790/kuyudan-yukari/olustur/?veri=/kaynaklar/5etools/data/";
await cmd("Page.navigate", { url: URL_ }); await bekle(1500);
await ev(`localStorage.clear()`); await cmd("Page.navigate", { url: URL_ });
for (let i = 0; i < 40; i++) { await bekle(500); if (await ev(`!!document.querySelector("[data-sinif]")`)) break; }
const tik = async (sel) => { const ok = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.click(); return true})()`); await bekle(250); if (!ok) hatalar.push("YOK: " + sel); };
const degis = async (sel, v) => { await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); e.value=${JSON.stringify(v)}; e.dispatchEvent(new Event("change",{bubbles:true}))})()`); await bekle(250); };
const adimlar = JSON.parse(process.argv[3]);
for (const [tur, a, b] of adimlar) {
  if (tur === "tik") await tik(a);
  if (tur === "degis") await degis(a, b);
  if (tur === "shot") { await ev("scrollTo(0,0)"); await bekle(200); await shot(a); }
  if (tur === "eval") console.log(a.slice(0, 40), "=>", String(JSON.stringify(await ev(a))).slice(0, 1500));
  if (tur === "bekle") await bekle(+a);
}
console.log("HATALAR:", hatalar.length ? hatalar.join("\n") : "yok");
process.exit(0);
