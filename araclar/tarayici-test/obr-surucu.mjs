import { readFileSync, writeFileSync } from "node:fs";
const PORT = 9341, OUT = process.argv[2], MOCK = readFileSync(process.argv[3], "utf8");
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const bek = {}; const hatalar = [];
const cmd = (method, params = {}) => new Promise((ok) => { const i = ++id; bek[i] = ok; ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = async (m) => { const d = JSON.parse(m.data); if (d.id && bek[d.id]) bek[d.id](d.result || d.error);
  if (d.method === "Fetch.requestPaused") cmd("Fetch.fulfillRequest", { requestId: d.params.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "text/javascript" }, { name: "Access-Control-Allow-Origin", value: "*" }], body: Buffer.from(MOCK).toString("base64") });
  if (d.method === "Runtime.exceptionThrown") hatalar.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method === "Runtime.consoleAPICalled" && (d.params.type === "error" || d.params.type === "warning")) hatalar.push(d.params.args.map((a) => a.value || a.description).join(" ")); };
await new Promise((r) => (ws.onopen = r));
await cmd("Runtime.enable"); await cmd("Page.enable"); await cmd("Network.enable"); await cmd("Network.setCacheDisabled", { cacheDisabled: true });
await cmd("Fetch.enable", { patterns: [{ urlPattern: "*owlbear-rodeo/sdk*" }] });
await cmd("Emulation.setDeviceMetricsOverride", { width: +(process.env.W || 1400), height: 1000, deviceScaleFactor: 1, mobile: false });
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = async (e) => { const r = await cmd("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true }); return r.result ? r.result.value : r; };
const shot = async (ad) => { const r = await cmd("Page.captureScreenshot", { format: "png" }); writeFileSync(`${OUT}/${ad}.png`, Buffer.from(r.data, "base64")); };
const git = async (u) => { await cmd("Page.navigate", { url: u }); await bekle(2500); };
const tik = async (sel) => { const ok = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return false; e.click(); return true})()`); await bekle(300); if (!ok) hatalar.push("YOK: " + sel); };
const degis = async (sel, v) => { await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); e.value=${JSON.stringify(v)}; e.dispatchEvent(new Event("change",{bubbles:true}))})()`); await bekle(300); };
for (const [tur, a, b] of JSON.parse(process.argv[4])) {
  if (tur === "git") await git(a);
  if (tur === "tik") await tik(a);
  if (tur === "degis") await degis(a, b);
  if (tur === "bekle") await bekle(+a);
  if (tur === "shot") { await bekle(200); await shot(a); }
  if (tur === "eval") console.log(a.slice(0, 50), "=>", String(JSON.stringify(await ev(a))).slice(0, 1200));
}
console.log("HATALAR:", hatalar.length ? hatalar.join("\n") : "yok");
process.exit(0);
