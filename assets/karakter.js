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
        h += '<li><button data-roll="sk-' + i + '" data-ack="skill|' + esc(s.ad) + '"><span class="dot p' + s.prof + '" title="' + (s.prof === 2 ? "Expertise" : s.prof ? "Proficient" : "") + '"></span><span>' + esc(s.ad) + '<span class="ab-tag">' + s.yetenek.toUpperCase() + '</span></span><span class="num">' + sgn(s.bonus) + "</span></button></li>";
      });
      h += "</ul></section>";
      h += '<section class="box span2" data-sekme="atk" data-etiket="Saldırı"><h2>Saldırılar</h2>';
      if (!c.saldirilar.length) h += '<p class="feat">Silah yok.</p>';
      c.saldirilar.forEach(function (a, i) {
        h += '<div class="atk"><span class="n" data-ack="esya|' + esc(a.ad) + "|" + esc(a.tip || "") + '">' + esc(a.ad) + (a.kusanili ? "" : ' <small style="font-weight:400;color:var(--muted)">(çantada)</small>') + "</span>" +
          '<button class="btn" data-roll="atk-' + i + '" title="Attack roll">' + sgn(a.isabet) + " isabet</button>" +
          '<span style="display:flex;gap:4px"><button class="btn" data-roll="dmg-' + i + '">' + esc(a.hasar) + '</button><button class="btn" data-roll="crit-' + i + '" title="Kritik hasar">×2</button></span>' +
          '<span class="meta">' + esc(a.tur) + " · " + esc(a.menzil) + (a.ozellikler.length ? " · " + a.ozellikler.map(esc).join(", ") : "") + (a.mastery ? ' · <span class="kw" data-ack="mastery|' + esc(a.mastery) + '" title="Weapon Mastery: bu silahta ustalığın varsa">' + esc(a.mastery) + "</span>" : "") + "</span></div>";
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
            if (!n) return;
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
          h += '<p class="spl"><b>' + (lv === "0" ? "Cantrip" : "Sv " + lv) + "</b>" + byLv[lv].map(function (s) { return '<span data-ack="buyu|' + esc(s.ad) + '">' + esc(s.ad) + "</span>" + (s.konsantrasyon ? ' <span class="kw" title="Concentration">C</span>' : "") + (s.ritual ? ' <span class="kw" title="Ritual">R</span>' : ""); }).join(", ") + "</p>";
        });
        h += "</section>";
      }
      h += '<section class="box span2" data-sekme="cond" data-etiket="Condition"><h2>Condition\'lar</h2><div class="tags conds">' +
        CONDS.map(function (n) { return '<button class="btn' + (S.conds.indexOf(n) > -1 ? " on" : "") + '" data-cond="' + n + '" data-ack="cond|' + n + '">' + n + "</button>"; }).join("") + "</div></section>";
      h += '<section class="box" data-sekme="feat" data-etiket="Features"><h2>Features &amp; Traits</h2>' + c.ozellikler.map(function (f) { return '<p class="feat" data-ack="ozellik|' + esc(f.ad) + "|" + esc(f.kaynak) + '">' + esc(f.ad) + " <small>" + esc(f.kaynak) + (f.seviye > 1 ? " · Sv " + f.seviye : "") + "</small></p>"; }).join("") +
        (c.featler.length ? '<p class="feat"><b>Feat:</b> ' + c.featler.map(function (f) { return '<span data-ack="feat|' + esc(f) + '">' + esc(f) + "</span>"; }).join(", ") + "</p>" : "") +
        (c.diller.length ? '<p class="feat"><b>Diller:</b> ' + c.diller.map(esc).join(", ") + "</p>" : "") +
        (c.direncler && c.direncler.length ? '<p class="feat"><b>Resistance:</b> ' + c.direncler.map(esc).join(", ") + "</p>" : "") +
        (c.notlar && c.notlar.length ? '<p class="feat"><b>Not:</b> ' + c.notlar.map(esc).join(" · ") + "</p>" : "") +
        (c.araclar && c.araclar.length ? '<p class="feat"><b>Tool:</b> ' + c.araclar.map(function (a) { return '<span data-ack="esya|' + esc(a) + '">' + esc(a) + "</span>"; }).join(", ") + "</p>" : "") +
        (c.zirh ? '<p class="feat"><b>Zırh:</b> ' + (c.zirh.length ? c.zirh.map(esc).join(", ") : "yok") + " · <b>Silah:</b> " + c.silah.map(esc).join(", ") + "</p>" : "") + "</section>";
      h += envanterHTML();
      h += "</div>" + (c.yerel ? '<p class="foot">Kuyudan Yukarı karakter üreticisinde yapıldı · ' + esc(c.guncellendi) + ' · ' + (o.duzenle ? '<button class="btn" data-act="duzenle">Düzenle / seviye atla</button>' : '<a href="' + base + 'olustur/">Üreticide düzenle / seviye atla</a>') + '</p>'
        : '<p class="foot">Beyond\'dan son çekim: ' + esc(c.guncellendi) + ' · <a href="' + esc(c.beyond_url) + '" target="_blank" rel="noopener">D&amp;D Beyond\'da aç</a></p>');
      root.innerHTML = h;
      if (o.sekmeli) sekmele();
    }
    // --- envanter: başlangıç listesi karakterden gelir; ilk değişiklikte kopyası durum'a (S.env, S.para) alınır
    var ESYA = null, esyaYukleniyor = null;
    var PARA = ["pp", "gp", "ep", "sp", "cp"];
    // S.env oda verisinde yer kaplamasın diye kısa: [[ad, adet, kuşanılı 0/1], …]; tür orijinal listeden ya da 5e.tools'tan bulunur
    function tipBul(ad) {
      var o3 = C.envanter.filter(function (i) { return i.ad === ad; })[0];
      if (o3 && o3.tip) return o3.tip;
      var x = ESYA && ESYA[ad.toLowerCase()];
      return x ? x.tip : "";
    }
    function envanter() {
      if (S.env) return S.env.map(function (a) { return { ad: a[0], adet: a[1], kusanili: !!a[2], tip: tipBul(a[0]) }; });
      return C.envanter.map(function (i) { return { ad: i.ad, adet: i.adet || 1, tip: i.tip || "", kusanili: !!i.kusanili }; });
    }
    function para() { // S.para kısa: [pp, gp, ep, sp, cp]
      var o2 = {}, p = C.para || {};
      PARA.forEach(function (k, i) { o2[k] = S.para ? +S.para[i] || 0 : +p[k] || 0; });
      return o2;
    }
    function kusanilir(i) { var x = ESYA && ESYA[i.ad.toLowerCase()]; return /Weapon|Armor|Shield/.test(i.tip || "") || !!(x && x.kusanilir); }
    function esyaYukle() { // 5e.tools eşya listesi (arama, ağırlık); ilk ihtiyaçta bir kez
      if (!esyaYukleniyor) esyaYukleniyor = import(new URL(base + "assets/aciklama.js", location.href).href).then(function (m) {
        return Promise.all([m.cek("items-base.json"), m.cek("items.json")]).then(function (r) {
          var TIP = { M: "Melee Weapon", R: "Ranged Weapon", LA: "Light Armor", MA: "Medium Armor", HA: "Heavy Armor", S: "Shield", A: "Ammunition", SCF: "Spellcasting Focus", AT: "Artisan's Tools", INS: "Instrument", GS: "Gaming Set", T: "Tool", G: "Adventuring Gear", P: "Potion", SC: "Scroll", RG: "Ring", WD: "Wand", RD: "Rod", ST: "Staff" };
          var ONC = { XPHB: 3, XDMG: 3, PHB: 1, DMG: 1 }, idx = {};
          r[0].baseitem.concat(r[1].item).forEach(function (x) {
            var k = x.name.toLowerCase(), eski = idx[k], puan = ONC[x.source] || 0;
            if (eski && eski.puan >= puan) return;
            var t = String(x.type || "").split("|")[0];
            idx[k] = { ad: x.name, puan: puan, tip: TIP[t] || (x.wondrous ? "Wondrous Item" : ""), agirlik: +x.weight || 0, kusanilir: !!(x.weapon || x.armor || t === "S") };
          });
          ESYA = idx; return idx;
        });
      });
      return esyaYukleniyor;
    }
    function envanterHTML() {
      var l = envanter(), p = para(), yuk = 0, bilinmeyen = false;
      if (ESYA) l.forEach(function (i) { var x = ESYA[i.ad.toLowerCase()]; if (x) yuk += x.agirlik * i.adet; else bilinmeyen = true; });
      var h = '<section class="box" data-sekme="env" data-etiket="Envanter"><h2>Envanter</h2>';
      h += '<div class="para">' + PARA.map(function (k) { return '<label>' + k + '<input type="number" min="0" inputmode="numeric" data-para="' + k + '" value="' + p[k] + '"></label>'; }).join("") + "</div>";
      h += '<ul class="env">' + l.map(function (i, n) {
        return '<li><span class="adet"><button class="btn" data-env="-" data-i="' + n + '" aria-label="Azalt">−</button><b class="num">' + i.adet + '</b><button class="btn" data-env="+" data-i="' + n + '" aria-label="Artır">+</button></span>' +
          '<span class="ad" data-ack="esya|' + esc(i.ad) + "|" + esc(i.tip || "") + '">' + esc(i.ad) + (i.tip ? " <small>" + esc(i.tip) + "</small>" : "") + "</span>" +
          (kusanilir(i) ? '<button class="btn' + (i.kusanili ? " on" : "") + '" data-env="k" data-i="' + n + '" title="Kuşan / çıkar">' + (i.kusanili ? "Kuşanılı" : "Kuşan") + "</button>" : "<span></span>") +
          '<button class="btn sil" data-env="x" data-i="' + n + '" aria-label="' + esc(i.ad) + ' sil">✕</button></li>';
      }).join("") + "</ul>";
      h += '<div class="env-ekle"><label for="env-ara" hidden>Eşya ekle</label><input id="env-ara" list="env-liste" placeholder="Eşya ekle: Rope, Potion of Healing…" autocomplete="off">' +
        '<input id="env-adet" type="number" min="1" value="1" aria-label="Adet"><button class="btn" data-env="ekle">Ekle</button><datalist id="env-liste"></datalist></div>';
      var str = C.yetenekler.str.puan;
      h += '<p class="feat"><small>' + (ESYA ? (yuk > str * 15 ? '<b style="color:var(--warn)">' : "<span>") + "Yük: " + Math.round(yuk * 10) / 10 + " / " + str * 15 + " lb" + (yuk > str * 15 ? " · taşıma kapasitesi aşıldı</b>" : "</span>") + (bilinmeyen ? " (listede olmayan eşyalar hariç)" : "") : "Yük hesabı için eşya ekleme kutusuna tıkla") +
        (S.env || S.para ? ' · <a href="#" data-env="sifirla">Başlangıç envanterine dön</a>' : "") + "</small></p></section>";
      return h;
    }
    function envDegis(fn) {
      var l = envanter(); fn(l);
      S.env = l.filter(function (i) { return i.adet > 0; }).map(function (i) { return [i.ad, i.adet, i.kusanili ? 1 : 0]; });
      persist(); render();
    }
    function listeDoldur(idx) {
      var dl = root.querySelector("#env-liste");
      if (dl && !dl.children.length) dl.innerHTML = Object.keys(idx).map(function (k) { return '<option value="' + esc(idx[k].ad) + '">'; }).join("");
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
      if (sek) { aktifSekme = sek.getAttribute("data-sekme-sec"); render(); if (aktifSekme === "env") esyaHazirla(); return; }
      var ev = e.target.closest("[data-env]");
      if (ev && C) {
        e.preventDefault();
        var tur = ev.getAttribute("data-env"), n = +ev.getAttribute("data-i");
        if (tur === "+") envDegis(function (l) { l[n].adet++; });
        else if (tur === "-") envDegis(function (l) { l[n].adet--; });
        else if (tur === "x") envDegis(function (l) { l[n].adet = 0; });
        else if (tur === "k") envDegis(function (l) { l[n].kusanili = !l[n].kusanili; });
        else if (tur === "sifirla") { if (confirm("Envanter ve para, karakterin başlangıç hâline dönsün mü?")) { delete S.env; delete S.para; persist(); render(); } }
        else if (tur === "ekle") {
          var ad = root.querySelector("#env-ara").value.trim(), adet = Math.max(1, parseInt(root.querySelector("#env-adet").value, 10) || 1);
          if (!ad) return;
          var x = ESYA && ESYA[ad.toLowerCase()];
          envDegis(function (l) {
            var var_ = l.filter(function (i) { return i.ad.toLowerCase() === ad.toLowerCase(); })[0];
            if (var_) var_.adet += adet; else l.push({ ad: x ? x.ad : ad, adet: adet, tip: x ? x.tip : "", kusanili: false });
          });
        }
        return;
      }
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
      if (act === "duzenle") { if (o.duzenle) o.duzenle(C.id); return; }
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
      if (t.matches("[data-para]")) { var pp = para(); pp[t.getAttribute("data-para")] = Math.max(0, parseInt(t.value, 10) || 0); S.para = PARA.map(function (k) { return pp[k]; }); persist(); render(); return; }
      if (!t.matches("[data-slot]")) return;
      var lv = t.getAttribute("data-slot"), k = +t.getAttribute("data-k");
      S.slots[lv] = t.checked ? k + 1 : k;
      persist(); render();
    });
    // 5e.tools eşya listesi (öneriler, tür, yük hesabı): Envanter açılınca ya da kutuya dokununca bir kez yüklenir
    function esyaHazirla() {
      if (ESYA) { listeDoldur(ESYA); return; }
      esyaYukle().then(function (idx) {
        var ara = root.querySelector("#env-ara"), deger = ara ? ara.value : "", odak = document.activeElement === ara;
        render();
        var yeni = root.querySelector("#env-ara");
        if (yeni) { yeni.value = deger; listeDoldur(idx); if (odak) yeni.focus(); }
      }).catch(function () { /* çevrimdışı: serbest metinle eklenir */ });
    }
    root.addEventListener("focusin", function (e) { if (e.target.id === "env-ara") esyaHazirla(); });
    root.addEventListener("pointerdown", function (e) { if (e.target.id === "env-ara") esyaHazirla(); });
    if (o.mode) o.mode.addEventListener("click", function (e) {
      var b = e.target.closest("[data-mode]"); if (!b) return;
      mode = b.getAttribute("data-mode");
      [].forEach.call(o.mode.querySelectorAll("[data-mode]"), function (x) { x.classList.toggle("on", x === b); });
    });
    // başka bir oyuncu/sekme durumu değiştirdiyse
    store.onChange(function (id, durum) {
      if (C && String(id) === String(C.id) && durum && JSON.stringify(durum) !== JSON.stringify(S)) {
        var ae = document.activeElement, focused = ae && (ae.id === "hpv" || ae.id === "env-ara" || ae.id === "env-adet" || ae.hasAttribute("data-para"));
        S = durum; if (!focused) render();
      }
    });

    // --- yükleme
    // o.yerel: odaya kayıtlı karakterler { var(id) -> bool, ac(id) -> Promise<karakter> }
    function open(id) {
      var yerel = o.yerel && o.yerel.var(id);
      if (yerel) root.innerHTML = '<p class="empty">Karakter hesaplanıyor… (ilk açılışta kurallar birkaç saniyede iner)</p>';
      return (yerel ? o.yerel.ac(id) : fetch(base + "karakterler/" + id + ".json", { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }))
        .then(function (c) { C = c; return store.load(c.id); })
        .then(function (durum) {
          S = durum || fresh();
          if (S.hp > C.hp_max) S.hp = C.hp_max;
          render();
          if (o.onSelect) o.onSelect(C.id, C);
        })
        .catch(function (e) {
          if (yerel) { console.warn(e); root.innerHTML = '<p class="empty">Karakter hesaplanamadı (kural verisi inmedi olabilir). Paneli kapatıp açmayı dene.</p>'; return; }
          root.innerHTML = '<p class="empty">Bu karakter yüklenemedi. D&amp;D Beyond\'da <b>Public</b> olduğundan emin ol; site saatte bir güncelleniyor.</p>';
        });
    }
    function list() {
      return fetch(base + "karakterler/liste.json", { cache: "no-cache" }).then(function (r) { return r.json(); });
    }
    if (o.pick) o.pick.addEventListener("change", function () { open(o.pick.value); });
    return {
      open: open, list: list,
      // üreticinin önizlemesi: dosyadan değil doğrudan veriden çiz
      goster: function (c) { C = c; S = fresh(); render(); },
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
