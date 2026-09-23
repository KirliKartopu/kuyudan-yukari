// Karakter üreticisi arayüzü. Kurallar kural.js'te; burası sadece soruları gösterir ve cevapları yazar.
import * as K from "./kural.js";
import { girdi, esc } from "./aciklama.js";
import { SINIF_TR, TUR_TR, AB_TR, ADIM_TR } from "./olustur-metin.js";

const ADIMLAR = [["sinif", "Class"], ["bg", "Background"], ["tur", "Species"], ["yetenek", "Ability'ler"], ["sec", "Class seçimleri"], ["buyu", "Büyüler"], ["ekip", "Ekipman"], ["kimlik", "Ad ve kaydet"]];
const TASLAK = "ky-olustur-taslak";
const $ = (s) => document.querySelector(s);
const ana = $("#ana"), adimlarEl = $("#adimlar"), ozetEl = $("#ozet");

let Y = null, S = null, adim = "sinif", sorular = [], C = null, arama = {}, acik = {};
try { Y = JSON.parse(localStorage.getItem(TASLAK)); } catch (e) { Y = null; }
if (!Y || Y.v !== 1) Y = K.bosYapi();

function kaydet() { try { localStorage.setItem(TASLAK, JSON.stringify(Y)); } catch (e) { /* özel pencere */ } }
const sec = (k) => Y.secim[k] || [];
const adimOf = (q) => (q.sub ? "sinif" : q.adim === "sinif" ? "sec" : q.adim);
const temizle = (on) => { for (const k of Object.keys(Y.secim)) if (on.some((p) => k === p || k.startsWith(p + ":"))) delete Y.secim[k]; };

// ---------- ability puanları
function temelHesapla() {
  if (Y.yontem === "standart" || Y.yontem === "zar") {
    const dizi = Y.yontem === "zar" ? Y.zarlar || [] : K.STANDART, at = Y.atama || {};
    K.AB.forEach((a) => (Y.temel[a] = at[a] != null && dizi[at[a]] != null ? dizi[at[a]] : 8));
  }
}
function abilityTamam() {
  if (Y.yontem === "standart" || Y.yontem === "zar") { const at = Y.atama || {}; const v = K.AB.map((a) => at[a]); return v.every((x) => x != null) && new Set(v).size === 6 && (Y.yontem !== "zar" || (Y.zarlar || []).length === 6); }
  if (Y.yontem === "puan") return puanHarcanan() <= 27 && K.AB.every((a) => Y.temel[a] >= 8 && Y.temel[a] <= 15);
  return K.AB.every((a) => Y.temel[a] >= 3 && Y.temel[a] <= 18);
}
const puanHarcanan = () => K.AB.reduce((t, a) => t + (K.PUAN_MALIYET[Y.temel[a]] ?? 99), 0);

// ---------- eksikler
function eksikler() {
  const e = {};
  const ekle = (a, m) => (e[a] = e[a] || []).push(m);
  if (!Y.sinif) ekle("sinif", "Class seç");
  if (!Y.background) ekle("bg", "Background seç");
  if (!Y.tur) ekle("tur", "Species seç");
  if (!abilityTamam()) ekle("yetenek", "Ability puanlarını dağıt");
  for (const q of sorular) if (!q.tamam) ekle(adimOf(q), q.baslik);
  if (!Y.ad) ekle("kimlik", "Karakterin adı");
  return e;
}

// ---------- çizim
function ciz() {
  temelHesapla();
  sorular = S ? K.secimler(Y, S) : Y.background || Y.tur ? K.secimler(Y, null) : [];
  C = S && Y.background && Y.tur ? K.hesapla(Y, S) : null;
  const eks = eksikler();
  adimlarEl.innerHTML = ADIMLAR.filter(([k]) => k !== "buyu" || sorular.some((q) => adimOf(q) === "buyu")).map(([k, ad], i) =>
    `<button type="button" data-git="${k}" class="${k === adim ? "on" : ""} ${eks[k] ? "" : "ok"}"><span class="no">${eks[k] ? i + 1 : "✓"}</span>${ad}${eks[k] ? `<span class="eks">${eks[k].length}</span>` : ""}</button>`).join("");
  ozetCiz(eks);
  const f = { sinif: sinifAdim, bg: bgAdim, tur: turAdim, yetenek: yetenekAdim, sec: soruAdim, buyu: soruAdim, ekip: ekipAdim, kimlik: kimlikAdim }[adim];
  const baslik = (ADIMLAR.find((x) => x[0] === adim) || [])[1];
  ana.innerHTML = `<h2>${baslik}</h2><p class="giris">${ADIM_TR[adim] || ""}</p>` + f() + altDugmeler();
  if (adim === "kimlik" && C) onizle();
  const odak = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.araK;
  for (const [k, v] of Object.entries(arama)) { const i = ana.querySelector(`[data-ara-k="${k}"]`); if (i) { i.value = v; suz(i); } }
  if (odak) { const i = ana.querySelector(`[data-ara-k="${odak}"]`); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
}
function altDugmeler() {
  const l = ADIMLAR.map((x) => x[0]).filter((k) => k !== "buyu" || sorular.some((q) => adimOf(q) === "buyu")), i = l.indexOf(adim);
  return `<div class="alt-dugmeler">${i > 0 ? `<button class="btn" data-git="${l[i - 1]}">← Geri</button>` : "<span></span>"}${i < l.length - 1 ? `<button class="btn birincil" data-git="${l[i + 1]}">İleri →</button>` : ""}</div>`;
}
function ozetCiz(eks) {
  const sa = (n) => (n >= 0 ? "+" : "") + n;
  let h = `<h3>${esc(Y.ad || "İsimsiz kahraman")}</h3><p class="alt">${esc([Y.tur && Y.tur.split("|")[0], Y.sinif && Y.sinif + " " + Y.seviye + (sec("subclass")[0] ? " (" + sec("subclass")[0] + ")" : ""), Y.background && Y.background.split("|")[0]].filter(Boolean).join(" · ") || "Henüz seçim yok")}</p>`;
  if (C) {
    h += `<div class="say"><div><b>${C.hp_max}</b><small>HP</small></div><div><b>${C.ac}</b><small>AC</small></div><div><b>${sa(C.initiative)}</b><small>Init</small></div><div><b>${C.hiz}</b><small>Speed</small></div></div>`;
    h += `<div class="ab6">${K.AB.map((a) => `<div>${a.toUpperCase()}<b>${C.yetenekler[a].puan}</b>${sa(C.yetenekler[a].mod)}</div>`).join("")}</div>`;
  }
  const liste = Object.entries(eks).flatMap(([a, l]) => l.map((m) => [a, m]));
  h += liste.length ? `<p style="margin:8px 0 0"><b>Eksik ${liste.length} seçim</b></p><ul>${liste.slice(0, 12).map(([a, m]) => `<li><a href="#" data-git="${a}">${esc(m)}</a></li>`).join("")}${liste.length > 12 ? "<li>…</li>" : ""}</ul>` : `<p class="tamam">Karakter hazır ✓</p>`;
  ozetEl.innerHTML = h;
}

// seçim yapıldıysa uzun listeyi daralt: sadece seçili kart + "Değiştir"
function kartListesi(adimK, liste, seciliMi, kartHTML) {
  const secili = liste.filter(seciliMi);
  if (secili.length && !acik[adimK]) return `<div class="kartlar">${secili.map(kartHTML).join("")}<button type="button" class="kart" data-act="degistir" style="justify-content:center;align-items:center;text-align:center"><b>Değiştir</b><span class="kucuk">Tüm seçenekleri göster</span></button></div>`;
  return `<div class="kartlar">${liste.map(kartHTML).join("")}</div>`;
}
// --- adım: class
function sinifAdim() {
  let h = `<div class="satir"><label for="sv">Seviye</label><select class="sec" id="sv" data-alan="seviye">${Array.from({ length: 20 }, (_, i) => `<option ${Y.seviye === i + 1 ? "selected" : ""}>${i + 1}</option>`).join("")}</select><span class="not">Prolog 1. seviyede başlar. Seviye atlarken buradan artır; yeni seçimler eksik olarak işaretlenir.</span></div>`;
  h += kartListesi("sinif", K.SINIFLAR, (s) => Y.sinif === s, (s) => { const t = SINIF_TR[s]; return `<button type="button" class="kart ${Y.sinif === s ? "on" : ""}" data-sinif="${s}"><b>${s}</b><span class="etk">d${t.hd} · ${t.ana} · ${t.zorluk}</span><p>${t.ozet}</p><span class="kucuk">${t.rol}</span></button>`; });
  if (S) {
    const oz = K.ozellikler(S, Y).filter(({ f }) => !/ (Subclass|Options)$|^Subclass Feature$/.test(f.name));
    h += `<div class="detay"><b>${S.c.name}: ${Y.seviye}. seviyeye kadar kazandıkların</b>${oz.map(({ f }) => `<details class="acil"><summary>${esc(f.name)} <small>(Sv ${f.level})</small></summary>${girdi(f.entries)}</details>`).join("")}</div>`;
    const q = sorular.find((x) => x.sub);
    if (q) {
      h += `<div class="soru ${q.tamam ? "" : "eksik"}"><h3>Subclass <span class="say">${q.tamam ? "✓" : "seçilmedi"}</span></h3><p class="ack">${esc(q.aciklama)}</p><div class="secenek-kart">` +
        S.subs.map((s) => { const f = S.sfeat.find((x) => x.subclassShortName === s.shortName && x.subclassSource === s.source && x.name === s.shortName); const ilk = f ? f.entries.filter((e) => typeof e === "string").slice(0, 2) : []; return `<button type="button" class="kart ${sec("subclass")[0] === s.name ? "on" : ""}" data-q="subclass" data-d="${esc(s.name)}"><b>${esc(s.name)}</b>${s.source === "FRHoF" ? '<span class="etk">Heroes of Faerûn</span>' : ""}${girdi(ilk)}</button>`; }).join("") + "</div></div>";
      const sub = K.altSinif(S, Y);
      if (sub) { const f = S.sfeat.find((x) => x.subclassShortName === sub.shortName && x.subclassSource === sub.source && x.name === sub.shortName); if (f) h += `<details class="acil detay"><summary>${esc(sub.name)}: tüm metin</summary>${girdi(f.entries)}</details>`; }
    } else if (Y.seviye < 3) h += `<p class="not">Subclass 3. seviyede seçilir.</p>`;
  }
  return h;
}
// --- adım: background
function bgAdim() {
  let h = kartListesi("bg", bgListesi(), (b) => Y.background === b.name + "|" + b.source, (b) => {
    const ab = b.ability[0].choose.weighted.from.map((x) => x.toUpperCase()).join(", ");
    const sk = (b.skillProficiencies || []).flatMap((s) => Object.keys(s).filter((k) => s[k] === true)).map((x) => (K.SKILLS[x] || [x])[0]).join(", ");
    const ft = K.bgFeat(b), fo = ft && K.bulFeat(ft), spec = ft && ft.split("|")[0].split(";")[1];
    const fad = fo ? fo.name + (spec ? " (" + spec.trim().replace(/^./, (c) => c.toUpperCase()) + ")" : "") : "";
    return `<button type="button" class="kart ${Y.background === b.name + "|" + b.source ? "on" : ""}" data-bg="${esc(b.name + "|" + b.source)}"><b>${esc(b.name)}</b>${b.source === "FRHoF" ? '<span class="etk">Heroes of Faerûn</span>' : ""}<p class="kucuk">Ability: ${ab}<br>Skill: ${esc(sk)}<br>Feat: <span data-ack="feat|${esc(fo ? fo.name : "")}">${esc(fad)}</span></p></button>`;
  });
  const bg = K.bulBg(Y);
  if (bg) h += `<details class="acil detay"><summary>${esc(bg.name)}: tüm metin</summary>${girdi(bg.entries)}</details>` + sorular.filter((q) => adimOf(q) === "bg").map(soruHTML).join("");
  return h;
}
function bgListesi() { return (window.__V || {}).background || []; }
// --- adım: species
function turAdim() {
  const l = (window.__V || {}).tur || [];
  let h = kartListesi("tur", l, (r) => Y.tur === r.name + "|" + r.source, (r) => `<button type="button" class="kart ${Y.tur === r.name + "|" + r.source ? "on" : ""}" data-tur="${esc(r.name + "|" + r.source)}"><b>${esc(r.name)}</b><span class="etk">${[(r.size || []).map((s) => (s === "S" ? "Small" : "Medium")).join("/"), "Speed " + (typeof r.speed === "object" ? r.speed.walk : r.speed), r.darkvision ? "Darkvision " + r.darkvision : ""].filter(Boolean).join(" · ")}</span><p>${esc(TUR_TR[r.name] || "")}</p></button>`);
  const tur = K.bulTur(Y);
  if (tur) h += `<details class="acil detay"><summary>${esc(tur.name)}: tüm metin</summary>${girdi(tur.entries)}</details>`;
  h += sorular.filter((q) => adimOf(q) === "tur").map(soruHTML).join("");
  return h;
}
// --- adım: ability
function yetenekAdim() {
  const ana2 = Y.sinif ? SINIF_TR[Y.sinif].ana : "";
  let h = `<div class="satir"><label for="yt">Yöntem</label><select class="sec" id="yt" data-alan="yontem">
    <option value="standart" ${Y.yontem === "standart" ? "selected" : ""}>Standard Array (15, 14, 13, 12, 10, 8)</option>
    <option value="puan" ${Y.yontem === "puan" ? "selected" : ""}>Point Buy (27 puan)</option>
    <option value="zar" ${Y.yontem === "zar" ? "selected" : ""}>Zar at (4d6, en düşüğü at)</option>
    <option value="elle" ${Y.yontem === "elle" ? "selected" : ""}>Elle gir (DM izniyle)</option></select>
    ${Y.yontem === "puan" ? `<span class="not">Harcanan: <b>${puanHarcanan()}</b> / 27</span>` : ""}
    ${Y.yontem === "zar" ? `<button class="btn" data-act="zarat" type="button">${(Y.zarlar || []).length ? "Yeniden at" : "Zarları at"}</button> <span class="not">${(Y.zarlar || []).join(", ")}</span>` : ""}</div>`;
  if (ana2) h += `<p class="not">${esc(Y.sinif)} için en önemli: <b>${ana2}</b>. En yüksek puanı buraya ver.</p>`;
  const dizi = Y.yontem === "zar" ? Y.zarlar || [] : K.STANDART, at = Y.atama || {};
  h += `<div class="abtablo">${K.AB.map((a) => {
    let giris;
    if (Y.yontem === "standart" || Y.yontem === "zar") giris = `<select class="sec" data-atama="${a}"><option value="">—</option>${dizi.map((v, i) => `<option value="${i}" ${at[a] === i ? "selected" : ""} ${Object.entries(at).some(([b, j]) => b !== a && j === i) ? "disabled" : ""}>${v}</option>`).join("")}</select>`;
    else if (Y.yontem === "puan") giris = `<button class="btn" data-puan="${a}" data-yon="-1" type="button" aria-label="${a} azalt">−</button> <b class="num">${Y.temel[a]}</b> <button class="btn" data-puan="${a}" data-yon="1" type="button" aria-label="${a} artır">+</button>`;
    else giris = `<input class="sec" type="number" min="3" max="18" value="${Y.temel[a]}" data-elle="${a}" style="width:70px">`;
    const son = C ? C.yetenekler[a] : null;
    return `<div class="box"><b>${K.AB_AD[a]}</b><div class="satir">${giris}${son ? `<span class="not">→ <span class="top">${son.puan}</span> (${son.mod >= 0 ? "+" : ""}${son.mod})</span>` : ""}</div><p>${AB_TR[a]}</p></div>`;
  }).join("")}</div><p class="not">Sağdaki son puan, background artışların ve feat'lerle birlikte.</p>`;
  return h;
}
// --- adım: sorular (class seçimleri, büyüler)
function soruAdim() {
  const l = sorular.filter((q) => adimOf(q) === adim && !q.sub);
  if (!S) return `<p class="empty">Önce bir class seç.</p>`;
  if (!l.length) return `<p class="empty">${adim === "buyu" ? "Bu karakterin seçmesi gereken büyü yok." : "Bu seviyede seçmen gereken bir şey yok."}</p>`;
  return l.map(soruHTML).join("");
}
// --- adım: ekipman
function ekipAdim() {
  let h = sorular.filter((q) => adimOf(q) === "ekip").map(soruHTML).join("");
  if (C) {
    const p = C.para;
    h += `<div class="detay"><b>Başlangıç envanteri</b><p>${C.envanter.map((e) => `<span data-ack="esya|${esc(e.ad)}|${esc(e.tip)}">${e.adet > 1 ? e.adet + "× " : ""}${esc(e.ad)}</span>${e.kusanili ? " <small>(kuşanılı)</small>" : ""}`).join(" · ") || "—"}</p><p><b>Para:</b> ${["gp", "sp", "cp"].filter((k) => p[k]).map((k) => p[k] + " " + k).join(", ") || "0"}</p></div>`;
  }
  return h;
}
// --- adım: kimlik
function kimlikAdim() {
  let h = `<div class="satir"><label for="ad">Karakter adı</label><input class="sec" id="ad" data-alan="ad" value="${esc(Y.ad)}" placeholder="Aldian Symr" style="min-width:240px"></div>
  <div class="satir"><label for="oy">Oyuncu</label><input class="sec" id="oy" data-alan="oyuncu" value="${esc(Y.oyuncu)}" placeholder="Senin adın"></div>
  <div class="satir"><label for="av">Resim adresi (isteğe bağlı)</label><input class="sec" id="av" data-alan="avatar" value="${esc(Y.avatar)}" placeholder="https://…" style="min-width:280px"></div>`;
  const eks = Object.values(eksikler()).flat();
  h += `<div class="satir"><button class="btn birincil" data-act="indir" type="button" ${C ? "" : "disabled"}>Dosyayı indir</button><button class="btn" data-act="kopyala" type="button" ${C ? "" : "disabled"}>Panoya kopyala</button>
    <span class="not">${eks.length ? "Eksik seçimler var (" + eks.length + "); yine de kaydedebilirsin, sonra tamamlarsın." : "Her şey tamam. Dosyayı DM'e gönder."}</span></div>`;
  h += `<p class="not">Dosya bu karakterin tüm seçimlerini taşır. Seviye atlayınca bu sayfada <b>Dosya aç</b> ile yükle, seviyeyi artır, yeni seçimleri yap ve tekrar indir.</p>`;
  h += `<h2 style="margin-top:24px">Önizleme</h2><div class="sheet" style="padding:0"><div id="onizleme"></div></div>`;
  return h;
}
function onizle() {
  const store = { load: () => Promise.resolve(null), save() {}, onChange() {} };
  const log = ZarKutusu(document.getElementById("log"));
  KarakterSayfasi({ root: document.getElementById("onizleme"), base: "../", store, onRoll: (r) => log(r) }).goster(C);
}

// soru çizimi
function soruHTML(q) {
  const v = q.deger || [];
  const say = q.tur === "bgab" || q.tur === "asi" ? (q.tamam ? "✓" : "seçilmedi") : `${v.length}/${q.adet}`;
  let h = `<div class="soru ${q.tamam ? "" : "eksik"}" data-soru="${esc(q.k)}"><h3>${esc(q.baslik)} <span class="say">${say}</span>${q.ack ? ` <small data-ack="${esc(q.ack)}" class="not" tabindex="0">(nedir?)</small>` : ""}</h3>${q.aciklama ? `<p class="ack">${esc(q.aciklama)}</p>` : ""}`;
  if (q.tur === "bgab") {
    const m = v[0] || "";
    h += `<div class="satir"><label><input type="radio" name="bgab" data-bgab="21" ${m === "21" ? "checked" : ""}> Birine +2, birine +1</label><label><input type="radio" name="bgab" data-bgab="111" ${m === "111" ? "checked" : ""}> Üçüne de +1 (${q.secenekler.map((a) => a.toUpperCase()).join(", ")})</label></div>`;
    if (m === "21") h += `<div class="satir"><label>+2: <select class="sec" data-bgab2="1"><option value="">—</option>${q.secenekler.map((a) => `<option value="${a}" ${v[1] === a ? "selected" : ""}>${K.AB_AD[a]}</option>`).join("")}</select></label><label>+1: <select class="sec" data-bgab2="2"><option value="">—</option>${q.secenekler.map((a) => `<option value="${a}" ${v[2] === a ? "selected" : ""} ${v[1] === a ? "disabled" : ""}>${K.AB_AD[a]}</option>`).join("")}</select></label></div>`;
    return h + "</div>";
  }
  if (q.tur === "asi") {
    h += `<div class="satir">${[0, 1].map((i) => `<label>+1: <select class="sec" data-asi="${esc(q.k)}" data-i="${i}"><option value="">—</option>${q.secenekler.map((o) => `<option value="${o.d}" ${v[i] === o.d ? "selected" : ""}>${o.ad}</option>`).join("")}</select></label>`).join("")}<span class="not">Aynı ability'yi iki kez seçersen +2 olur.</span></div>`;
    return h + "</div>";
  }
  if (q.secenekler.some((o) => o.entries)) {
    h += `<div class="secenek-kart">${q.secenekler.map((o) => `<button type="button" class="kart ${v.includes(o.d) ? "on" : ""}" data-q="${esc(q.k)}" data-d="${esc(o.d)}"><b>${esc(o.ad)}</b>${girdi(o.entries)}</button>`).join("")}</div>`;
    return h + "</div>";
  }
  if (q.secenekler.length > 18) h += `<input class="ara" type="search" placeholder="Ara…" data-ara-k="${esc(q.k)}" aria-label="${esc(q.baslik)} içinde ara">`;
  if (!q.secenekler.length) h += `<p class="not">Seçenek yok${q.dinamik === "expertise" ? " (önce skill'lerini seç)" : ""}.</p>`;
  h += `<div class="cipler">${q.secenekler.map((o) => `<button type="button" class="cip ${v.includes(o.d) ? "on" : ""}" data-q="${esc(q.k)}" data-d="${esc(o.d)}" ${o.ack ? `data-ack="${esc(o.ack)}"` : ""} ${o.devre && !v.includes(o.d) ? `disabled title="${esc(o.devre)}"` : ""} data-ad="${esc(n2(o.ad))}">${esc(o.ad)}${o.alt ? ` <small>${esc(o.alt)}</small>` : ""}</button>`).join("")}</div>`;
  return h + "</div>";
}
const n2 = (s) => String(s).toLocaleLowerCase("tr");
function suz(inp) {
  const t = n2(inp.value.trim()), kutu = inp.closest(".soru");
  kutu.querySelectorAll(".cip").forEach((c) => { c.hidden = !!t && !c.dataset.ad.includes(t) && !c.classList.contains("on"); });
}

// ---------- olaylar
async function sinifSec(ad) {
  if (Y.sinif !== ad) { temizle(["sinif", "buyu", "subclass"]); Y.sinif = ad; }
  S = ad ? await K.sinifYukle(ad) : null;
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-git],[data-sinif],[data-bg],[data-tur],[data-q],[data-act],[data-puan]");
  if (!t) return;
  if (t.dataset.git) { e.preventDefault(); adim = t.dataset.git; ciz(); scrollTo({ top: 0 }); return; }
  if (t.dataset.sinif) { await sinifSec(t.dataset.sinif); acik.sinif = false; }
  else if (t.dataset.bg) { if (Y.background !== t.dataset.bg) { temizle(["bg"]); Y.background = t.dataset.bg; } acik.bg = false; }
  else if (t.dataset.tur) { if (Y.tur !== t.dataset.tur) { temizle(["tur"]); Y.tur = t.dataset.tur; } acik.tur = false; }
  else if (t.dataset.act === "degistir") { acik[adim] = true; ciz(); return; }
  else if (t.dataset.q) {
    const q = sorular.find((x) => x.k === t.dataset.q) || { k: t.dataset.q, adet: 1, tur: "tek" };
    const d = t.dataset.d, v = sec(q.k).slice();
    if (q.adet === 1 && q.tur !== "coklu") Y.secim[q.k] = v[0] === d ? [] : [d];
    else if (v.includes(d)) Y.secim[q.k] = v.filter((x) => x !== d);
    else if (v.length < q.adet) Y.secim[q.k] = v.concat(d);
    else { t.animate([{ transform: "translateX(-3px)" }, { transform: "translateX(3px)" }, { transform: "none" }], 180); return; }
    // bağımlı alt seçimleri temizle (ör. feat değişince feat'in soruları)
    for (const k of Object.keys(Y.secim)) if (k !== q.k && k.startsWith(q.k + "x")) delete Y.secim[k];
  } else if (t.dataset.puan) {
    const a = t.dataset.puan, y = +t.dataset.yon, yeni = Y.temel[a] + y;
    if (yeni < 8 || yeni > 15) return;
    Y.temel[a] = yeni; if (puanHarcanan() > 27) { Y.temel[a] -= y; return; }
  } else if (t.dataset.act === "zarat") {
    Y.zarlar = Array.from({ length: 6 }, () => { const r = [1, 2, 3, 4].map(() => 1 + Math.floor(Math.random() * 6)).sort((a, b) => a - b); return r[1] + r[2] + r[3]; }).sort((a, b) => b - a);
    Y.atama = {};
  } else if (t.dataset.act === "indir") { indir(); return; }
  else if (t.dataset.act === "kopyala") { try { await navigator.clipboard.writeText(JSON.stringify(C, null, 1)); t.textContent = "Kopyalandı ✓"; } catch (x) { t.textContent = "Kopyalanamadı"; } return; }
  else return;
  kaydet(); ciz();
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.alan === "seviye") Y.seviye = +t.value;
  else if (t.dataset.alan === "yontem") { Y.yontem = t.value; Y.atama = {}; if (t.value === "puan") K.AB.forEach((a) => (Y.temel[a] = 8)); }
  else if (t.dataset.alan) { Y[t.dataset.alan] = t.value.trim(); kaydet(); ozetCiz(eksikler()); if (C) { C = K.hesapla(Y, S); onizle(); } return; }
  else if (t.dataset.atama) { Y.atama = Y.atama || {}; if (t.value === "") delete Y.atama[t.dataset.atama]; else Y.atama[t.dataset.atama] = +t.value; }
  else if (t.dataset.elle) Y.temel[t.dataset.elle] = Math.max(3, Math.min(18, +t.value || 10));
  else if (t.dataset.bgab) Y.secim["bg:ab"] = t.dataset.bgab === "111" ? ["111"] : ["21"];
  else if (t.dataset.bgab2) { const v = (Y.secim["bg:ab"] || ["21"]).slice(); v[0] = "21"; v[+t.dataset.bgab2] = t.value; if (v[1] && v[1] === v[2]) v[2] = ""; Y.secim["bg:ab"] = v; }
  else if (t.dataset.asi) { const v = (Y.secim[t.dataset.asi] || []).slice(); v[+t.dataset.i] = t.value; Y.secim[t.dataset.asi] = v.filter((x, i) => x || i < 2).slice(0, 2); if (Y.secim[t.dataset.asi].some((x) => !x)) Y.secim[t.dataset.asi] = Y.secim[t.dataset.asi].filter(Boolean); }
  else return;
  kaydet(); ciz();
});
document.addEventListener("input", (e) => { const t = e.target; if (t.dataset.araK != null) { arama[t.dataset.araK] = t.value; suz(t); } });
$("#yeni").addEventListener("click", () => { if (!confirm("Bu taslak silinsin ve yeni karakter başlasın mı? (İndirmediysen kaybolur.)")) return; Y = K.bosYapi(); S = null; adim = "sinif"; arama = {}; kaydet(); ciz(); });
$("#dosya").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const o = JSON.parse(await f.text()), y = o.yapi || o;
    if (!y || y.v !== 1 || !y.secim) throw new Error("biçim");
    Y = y; S = Y.sinif ? await K.sinifYukle(Y.sinif) : null; adim = "sinif"; kaydet(); ciz();
  } catch (x) { alert("Bu dosya bir Kuyudan Yukarı karakter dosyası değil."); }
  e.target.value = "";
});
function indir() {
  const ad = (Y.ad || "karakter").toLocaleLowerCase("tr").replace(/[^a-z0-9ğüşıöç]+/g, "-").replace(/^-|-$/g, "");
  const blob = new Blob([JSON.stringify(C, null, 1)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${ad}-${Y.id}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------- başlat
(async () => {
  try {
    window.__V = await K.veriYukle();
    if (Y.sinif) S = await K.sinifYukle(Y.sinif);
    ciz();
  } catch (e) {
    console.error(e);
    ana.innerHTML = `<p class="empty">Kural verisi yüklenemedi (${esc(e.message)}). İnternet bağlantını kontrol edip sayfayı yenile.</p>`;
  }
})();
