// Karakter sayfası: site ve Owlbear paneli aynı kodu kullanır.
// KarakterSayfasi({ root, pick, mode, base, store, onRoll, onSelect })
//   store:   { load(id) -> Promise<durum|null>, save(id, durum), onChange(cb(id, durum)) }
//   onRoll:  function(sonuç) — zar sonucunu gösterir ya da yayınlar
//   onSelect: function(id) — seçilen karakter değişince (isteğe bağlı)
(function () {
  var AB = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
  var CONDS = ["Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious"];
  var sgn = function (n) { return (n >= 0 ? "+" : "") + n; };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var d = function (n) { return 1 + Math.floor(Math.random() * n); };

  window.KarakterSayfasi = function (o) {
    var root = o.root, base = o.base || "../", store = o.store;
    var mode = "norm", C = null, S = null, aktifSekme = "atk";

    function fresh() { return { hp: C.hp_max, temp: 0, slots: {}, conds: [], insp: false, ds: { s: 0, f: 0 } }; }
    function persist() { if (C) store.save(C.id, S); }

    // --- zar
    function emit(r) { r.karakter = C ? C.ad : ""; o.onRoll(r); }
    function d20(title, bonus, isAttack) {
      var a = d(20), b = d(20), use = a, note = "d20 (" + a + ")";
      if (mode === "adv") { use = Math.max(a, b); note = "Advantage: d20 (" + a + ", " + b + ")"; }
      if (mode === "dis") { use = Math.min(a, b); note = "Disadvantage: d20 (" + a + ", " + b + ")"; }
      var cls = isAttack && use === 20 ? "crit" : isAttack && use === 1 ? "fail" : "";
      var extra = isAttack && use === 20 ? " · KRİTİK! Hasar zarlarını iki kez at" : isAttack && use === 1 ? " · Iska" : "";
      var zar = mode === "norm" ? "1d20@" + a : "2d20@" + a + "," + b;
      emit({ baslik: title, toplam: use + bonus, detay: note + " " + sgn(bonus) + extra, sinif: cls, zar: zar });
    }
    function dmg(title, expr, crit) {
      var m = String(expr).match(/^(\d+)d(\d+)([+-]\d+)?$/);
      if (!m) { emit({ baslik: title, toplam: expr, detay: "" }); return; }
      var n = +m[1] * (crit ? 2 : 1), f = +m[2], k = +(m[3] || 0), rolls = [], t = 0;
      for (var i = 0; i < n; i++) { var r = d(f); rolls.push(r); t += r; }
      emit({ baslik: title + (crit ? " (kritik)" : ""), toplam: t + k, detay: n + "d" + f + " (" + rolls.join(", ") + ")" + (k ? " " + sgn(k) : ""), zar: n + "d" + f + "@" + rolls.join(",") });
    }

    // --- çizim
    function render() {
      var c = C, cls = c.siniflar.map(function (x) { return x.ad + " " + x.seviye + (x.subclass ? " · " + x.subclass : ""); }).join(" / ");
      var h = "";
      h += '<div class="who">' + (c.avatar ? '<img alt="" src="' + esc(c.avatar) + '">' : "<span></span>") +
        "<div><h1>" + esc(c.ad) + "</h1><p>" + esc(c.tur) + " · " + esc(cls) + (c.background ? " · " + esc(c.background) : "") + (c.oyuncu ? " · <i>" + esc(c.oyuncu) + "</i>" : "") + "</p></div></div>";
      h += '<div class="grid">';
      var pct = Math.max(0, Math.min(100, Math.round(100 * S.hp / c.hp_max)));
      h += '<section class="box"><h2>Hit Points</h2><div class="hp">' +
        '<div class="hp-num">' + S.hp + " <small>/ " + c.hp_max + (S.temp ? " · temp " + S.temp : "") + "</small></div>" +
        '<button class="btn ' + (S.insp ? "on" : "") + '" data-act="insp" title="Heroic Inspiration: bir zarı yeniden at">Inspiration</button>' +
        '<div class="hpbar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="hp-ctl"><label for="hpv" hidden>Miktar</label><input id="hpv" type="number" min="0" inputmode="numeric" placeholder="5">' +
        '<button class="btn" data-hp="dmg">Hasar</button><button class="btn" data-hp="heal">İyileş</button><button class="btn" data-hp="temp">Temp HP</button>' +
        '<button class="btn" data-hp="long" title="Long Rest: HP ve büyü slotları dolar">Long Rest</button></div></div>';
      if (S.hp <= 0) h += '<div style="margin-top:8px"><b>Death Saves</b> · başarı ' + S.ds.s + "/3 · başarısızlık " + S.ds.f + '/3 <button class="btn" data-act="ds">Death Save at</button></div>';
      h += "</section>";
      h += '<section class="box"><h2>Savaş</h2><div class="vitals">' +
        '<div class="vital"><b>' + c.ac + "</b><small>AC</small></div>" +
        '<button class="vital" data-roll="init"><b>' + sgn(c.initiative) + "</b><small>Initiative</small></button>" +
        '<div class="vital"><b>' + c.hiz + "</b><small>Speed ft</small></div>" +
        '<div class="vital"><b>' + sgn(c.prof_bonus) + "</b><small>Prof.</small></div>" +
        '<div class="vital"><b>' + c.pasif_perception + "</b><small>Pasif Perc.</small></div>" +
        "</div>" + (c.duyular && Object.keys(c.duyular).length ? '<p class="feat" style="margin-top:8px"><small>' + Object.keys(c.duyular).map(function (k) { return esc(k) + " " + c.duyular[k] + " ft"; }).join(" · ") + "</small></p>" : "") + "</section>";
      h += '<section class="box" data-sekme="yet" data-etiket="Yetenekler"><h2>Yetenekler ve Saving Throw</h2><div class="abil">';
      Object.keys(AB).forEach(function (a) {
        var y = c.yetenekler[a], s = c.saves[a];
        h += '<div class="ab"><div class="nm">' + a.toUpperCase() + "</div>" +
          '<button data-roll="chk-' + a + '" title="' + AB[a] + ' check"><div class="md">' + sgn(y.mod) + '</div><div class="sc">' + y.puan + "</div></button>" +
          '<button class="sv' + (s.prof ? " prof" : "") + '" data-roll="sv-' + a + '" title="' + AB[a] + ' saving throw">Save ' + sgn(s.bonus) + "</button></div>";
      });
      h += "</div></section>";
      h += '<section class="box" data-sekme="skill" data-etiket="Skills"><h2>Skills</h2><ul class="rows">';
      c.skills.forEach(function (s, i) {
        h += '<li><button data-roll="sk-' + i + '"><span class="dot p' + s.prof + '" title="' + (s.prof === 2 ? "Expertise" : s.prof ? "Proficient" : "") + '"></span><span>' + esc(s.ad) + '<span class="ab-tag">' + s.yetenek.toUpperCase() + '</span></span><span class="num">' + sgn(s.bonus) + "</span></button></li>";
      });
      h += "</ul></section>";
      h += '<section class="box span2" data-sekme="atk" data-etiket="Saldırı"><h2>Saldırılar</h2>';
      if (!c.saldirilar.length) h += '<p class="feat">Silah yok.</p>';
      c.saldirilar.forEach(function (a, i) {
        h += '<div class="atk"><span class="n">' + esc(a.ad) + (a.kusanili ? "" : ' <small style="font-weight:400;color:var(--muted)">(çantada)</small>') + "</span>" +
          '<button class="btn" data-roll="atk-' + i + '" title="Attack roll">' + sgn(a.isabet) + " isabet</button>" +
          '<span style="display:flex;gap:4px"><button class="btn" data-roll="dmg-' + i + '">' + esc(a.hasar) + '</button><button class="btn" data-roll="crit-' + i + '" title="Kritik hasar">×2</button></span>' +
          '<span class="meta">' + esc(a.tur) + " · " + esc(a.menzil) + (a.ozellikler.length ? " · " + a.ozellikler.map(esc).join(", ") : "") + (a.mastery ? ' · <span class="kw" title="Weapon Mastery: bu silahta ustalığın varsa">' + esc(a.mastery) + "</span>" : "") + "</span></div>";
      });
      h += "</section>";
      if (c.buyu) {
        var b = c.buyu;
        h += '<section class="box span2" data-sekme="buyu" data-etiket="Büyü"><h2>Büyü · ' + esc(b.sinif) + "</h2>" +
          '<div class="vitals" style="margin-bottom:10px"><div class="vital"><b>' + b.save_dc + "</b><small>Save DC</small></div>" +
          '<button class="vital" data-roll="spatk"><b>' + sgn(b.isabet) + "</b><small>Spell atk</small></button></div>";
        if (b.slotlar.length) {
          h += '<div class="slots">';
          b.slotlar.forEach(function (n, li) {
            var lv = li + 1, used = S.slots[lv] || 0;
            h += '<span><b class="num" style="font-size:13px">Sv ' + lv + "</b> ";
            for (var k = 0; k < n; k++) h += '<label><input type="checkbox" data-slot="' + lv + '" data-k="' + k + '" ' + (k < used ? "checked" : "") + ' aria-label="Seviye ' + lv + " slot " + (k + 1) + '"></label>';
            h += "</span>";
          });
          h += "</div>";
        }
        var byLv = {};
        b.buyuler.forEach(function (s) { (byLv[s.seviye] = byLv[s.seviye] || []).push(s); });
        Object.keys(byLv).sort().forEach(function (lv) {
          h += '<p class="spl"><b>' + (lv === "0" ? "Cantrip" : "Sv " + lv) + "</b>" + byLv[lv].map(function (s) { return esc(s.ad) + (s.konsantrasyon ? ' <span class="kw" title="Concentration">C</span>' : "") + (s.ritual ? ' <span class="kw" title="Ritual">R</span>' : ""); }).join(", ") + "</p>";
        });
        h += "</section>";
      }
      h += '<section class="box span2" data-sekme="cond" data-etiket="Condition"><h2>Condition\'lar</h2><div class="tags conds">' +
        CONDS.map(function (n) { return '<button class="btn' + (S.conds.indexOf(n) > -1 ? " on" : "") + '" data-cond="' + n + '">' + n + "</button>"; }).join("") + "</div></section>";
      h += '<section class="box" data-sekme="feat" data-etiket="Features"><h2>Features</h2>' + c.ozellikler.map(function (f) { return '<p class="feat">' + esc(f.ad) + " <small>" + esc(f.kaynak) + (f.seviye > 1 ? " · Sv " + f.seviye : "") + "</small></p>"; }).join("") +
        (c.featler.length ? '<p class="feat"><b>Feat:</b> ' + c.featler.map(esc).join(", ") + "</p>" : "") +
        (c.diller.length ? '<p class="feat"><b>Diller:</b> ' + c.diller.map(esc).join(", ") + "</p>" : "") + "</section>";
      var p = c.para || {};
      h += '<section class="box" data-sekme="env" data-etiket="Envanter"><h2>Envanter</h2><p class="feat num">' + ["pp", "gp", "ep", "sp", "cp"].filter(function (k) { return p[k]; }).map(function (k) { return p[k] + " " + k; }).join(" · ") + "</p>" +
        c.envanter.map(function (i) { return '<p class="feat">' + (i.adet > 1 ? i.adet + "× " : "") + esc(i.ad) + (i.kusanili ? " <small>(kuşanılı)</small>" : "") + "</p>"; }).join("") + "</section>";
      h += '</div><p class="foot">Beyond\'dan son çekim: ' + esc(c.guncellendi) + ' · <a href="' + esc(c.beyond_url) + '" target="_blank" rel="noopener">D&amp;D Beyond\'da aç</a></p>';
      root.innerHTML = h;
      if (o.sekmeli) sekmele();
    }
    // Dar panel: HP ve Savaş üstte kalır, diğer bölümler sağdaki dikey sekmelerle açılır
    function sekmele() {
      var grid = root.querySelector(".grid");
      var bolumler = [].slice.call(grid.querySelectorAll("section[data-sekme]"));
      if (!bolumler.length) return;
      if (!bolumler.some(function (b) { return b.dataset.sekme === aktifSekme; })) aktifSekme = bolumler[0].dataset.sekme;
      var kap = document.createElement("div"); kap.className = "sekmeli";
      var icerik = document.createElement("div"); icerik.className = "sek-icerik";
      var ray = document.createElement("nav"); ray.className = "ray"; ray.setAttribute("aria-label", "Karakter bölümleri");
      bolumler.forEach(function (b) {
        var d = document.createElement("button");
        d.type = "button"; d.className = "btn" + (b.dataset.sekme === aktifSekme ? " on" : "");
        d.setAttribute("data-sekme-sec", b.dataset.sekme); d.textContent = b.dataset.etiket;
        ray.appendChild(d);
        b.hidden = b.dataset.sekme !== aktifSekme;
        icerik.appendChild(b);
      });
      kap.appendChild(icerik); kap.appendChild(ray);
      grid.parentNode.insertBefore(kap, grid.nextSibling);
    }

    // --- etkileşim
    root.addEventListener("click", function (e) {
      var sek = e.target.closest("[data-sekme-sec]");
      if (sek) { aktifSekme = sek.getAttribute("data-sekme-sec"); render(); return; }
      var t = e.target.closest("[data-roll],[data-hp],[data-cond],[data-act]");
      if (!t || !C) return;
      var r = t.getAttribute("data-roll");
      if (r) {
        if (r === "init") d20("Initiative", C.initiative);
        else if (r === "spatk") d20("Spell attack", C.buyu.isabet, true);
        else if (r.indexOf("chk-") === 0) { var a = r.slice(4); d20(AB[a] + " check", C.yetenekler[a].mod); }
        else if (r.indexOf("sv-") === 0) { var a2 = r.slice(3); d20(AB[a2] + " save", C.saves[a2].bonus); }
        else if (r.indexOf("sk-") === 0) { var s = C.skills[+r.slice(3)]; d20(s.ad, s.bonus); }
        else if (r.indexOf("atk-") === 0) { var at = C.saldirilar[+r.slice(4)]; d20(at.ad + " attack", at.isabet, true); }
        else if (r.indexOf("dmg-") === 0) { var ad = C.saldirilar[+r.slice(4)]; dmg(ad.ad + " hasar", ad.hasar, false); }
        else if (r.indexOf("crit-") === 0) { var ac = C.saldirilar[+r.slice(5)]; dmg(ac.ad + " hasar", ac.hasar, true); }
        return;
      }
      var hp = t.getAttribute("data-hp");
      if (hp) {
        var v = Math.max(0, parseInt(root.querySelector("#hpv").value, 10) || 0);
        if (hp === "dmg") { var rest = v; if (S.temp) { var used = Math.min(S.temp, rest); S.temp -= used; rest -= used; } S.hp = Math.max(0, S.hp - rest); }
        if (hp === "heal") { S.hp = Math.min(C.hp_max, S.hp + v); if (S.hp > 0) S.ds = { s: 0, f: 0 }; }
        if (hp === "temp") S.temp = Math.max(S.temp, v);
        if (hp === "long") { S.hp = C.hp_max; S.temp = 0; S.slots = {}; S.ds = { s: 0, f: 0 }; }
        persist(); render(); return;
      }
      var cd = t.getAttribute("data-cond");
      if (cd) { var i = S.conds.indexOf(cd); if (i > -1) S.conds.splice(i, 1); else S.conds.push(cd); persist(); render(); return; }
      var act = t.getAttribute("data-act");
      if (act === "insp") { S.insp = !S.insp; persist(); render(); return; }
      if (act === "ds") {
        var n = d(20), dz = "1d20@" + n;
        if (n === 20) { S.hp = 1; S.ds = { s: 0, f: 0 }; emit({ baslik: "Death Save", toplam: 20, detay: "Doğal 20: 1 HP ile ayağa kalktın!", sinif: "crit", zar: dz }); }
        else if (n === 1) { S.ds.f = Math.min(3, S.ds.f + 2); emit({ baslik: "Death Save", toplam: 1, detay: "Doğal 1: iki başarısızlık", sinif: "fail", zar: dz }); }
        else if (n >= 10) { S.ds.s++; emit({ baslik: "Death Save", toplam: n, detay: "Başarı" + (S.ds.s >= 3 ? " · stabil oldun" : ""), zar: dz }); }
        else { S.ds.f++; emit({ baslik: "Death Save", toplam: n, detay: "Başarısızlık" + (S.ds.f >= 3 ? " · karakter öldü" : ""), sinif: "fail", zar: dz }); }
        persist(); render();
      }
    });
    root.addEventListener("change", function (e) {
      var t = e.target;
      if (!t.matches("[data-slot]")) return;
      var lv = t.getAttribute("data-slot"), k = +t.getAttribute("data-k");
      S.slots[lv] = t.checked ? k + 1 : k;
      persist(); render();
    });
    if (o.mode) o.mode.addEventListener("click", function (e) {
      var b = e.target.closest("[data-mode]"); if (!b) return;
      mode = b.getAttribute("data-mode");
      [].forEach.call(o.mode.querySelectorAll("[data-mode]"), function (x) { x.classList.toggle("on", x === b); });
    });
    // başka bir oyuncu/sekme durumu değiştirdiyse
    store.onChange(function (id, durum) {
      if (C && String(id) === String(C.id) && durum && JSON.stringify(durum) !== JSON.stringify(S)) {
        var focused = document.activeElement && document.activeElement.id === "hpv";
        S = durum; if (!focused) render();
      }
    });

    // --- yükleme
    function open(id) {
      return fetch(base + "karakterler/" + id + ".json", { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (c) { C = c; return store.load(c.id); })
        .then(function (durum) {
          S = durum || fresh();
          if (S.hp > C.hp_max) S.hp = C.hp_max;
          render();
          if (o.onSelect) o.onSelect(C.id, C);
        })
        .catch(function () { root.innerHTML = '<p class="empty">Bu karakter yüklenemedi. D&amp;D Beyond\'da <b>Public</b> olduğundan emin ol; site saatte bir güncelleniyor.</p>'; });
    }
    function list() {
      return fetch(base + "karakterler/liste.json", { cache: "no-cache" }).then(function (r) { return r.json(); });
    }
    if (o.pick) o.pick.addEventListener("change", function () { open(o.pick.value); });
    return {
      open: open, list: list,
      fill: function (items, want) {
        if (!items.length) { root.innerHTML = '<p class="empty">Henüz karakter yok.</p>'; return null; }
        o.pick.innerHTML = items.map(function (k) { return '<option value="' + k.id + '">' + esc(k.ad) + (k.ornek ? " (örnek)" : "") + (k.oyuncu && !k.ornek ? " · " + esc(k.oyuncu) : "") + "</option>"; }).join("");
        if (!items.some(function (k) { return String(k.id) === String(want); })) want = String(items[0].id);
        o.pick.value = want;
        return want;
      },
      current: function () { return C; }
    };
  };

  // Zar sonucu kutusu (site ve panel ortak)
  window.ZarKutusu = function (el) {
    var hist = [], zaman = null;
    el.addEventListener("click", function () { el.hidden = true; });
    return function (r, kimden) {
      el.querySelector(".ttl").textContent = (kimden ? kimden + " · " : "") + r.baslik;
      var res = el.querySelector(".res"); res.textContent = r.toplam; res.className = "res" + (r.sinif ? " " + r.sinif : "");
      el.querySelector(".brk").textContent = r.detay;
      hist.unshift((kimden ? kimden + ": " : "") + r.baslik + " " + r.toplam); hist = hist.slice(0, 8);
      el.querySelector(".hist").textContent = hist.slice(1).join(" · ");
      el.hidden = false;
      clearTimeout(zaman); zaman = setTimeout(function () { el.hidden = true; }, 6000);
    };
  };
})();
