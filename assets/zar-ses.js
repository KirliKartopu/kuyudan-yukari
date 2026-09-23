// Zar sesi: kullanıcının tıkladığı sayfada (panel ya da karakter sayfası) Web Audio ile çalınır.
// Tarayıcılar, hiç tıklanmamış bir pencerede ses çalmaya izin vermez; 3D zar penceresi bu yüzden
// sesi kendisi çalmaz, her fizik çarpışmasını buraya bildirir (calDosya).
//   const ses = ZarSesi(".../assets/");
//   ses.calDosya("dicehit/dicehit_plastic3.mp3", 0.4);  // bir çarpışma
//   ses.cal("2d20@14,7", "crit");                       // 3D kapalıyken yaklaşık çarpma dizisi
(function () {
  var liste = function (onek, n) { var l = []; for (var i = 1; i <= n; i++) l.push(onek + i + ".mp3"); return l; };
  var DOSYALAR = [].concat(
    liste("dicehit/dicehit_plastic", 15),
    liste("dicehit/dicehit_metal", 12),
    liste("surfaces/surface_wood_table", 7)
  );
  window.ZarSesi = function (taban) {
    var ctx = null, tampon = {}, yukleniyor = null, sonHata = "";
    function hazirla() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        yukleniyor = Promise.all(DOSYALAR.map(function (f) {
          return fetch(taban + "zar/sounds/" + f).then(function (r) { return r.arrayBuffer(); })
            .then(function (b) { return new Promise(function (ok, no) { ctx.decodeAudioData(b, ok, no); }); })
            .then(function (buf) { tampon[f] = buf; })
            .catch(function (e) { sonHata = "yükleme: " + (e && e.message || e); });
        }));
      }
      if (ctx.state === "suspended") ctx.resume().catch(function (e) { sonHata = "resume: " + (e && e.message || e); });
    }
    // İlk tıklamada sesi hazırla (tarayıcı izni tıklamayla gelir)
    document.addEventListener("pointerdown", hazirla, true);
    document.addEventListener("keydown", hazirla, true);
    var hazir = function () { return !!ctx && ctx.state === "running"; };

    function calTek(buf, zaman, guc) {
      var src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = buf; g.gain.value = guc;
      src.connect(g); g.connect(ctx.destination); src.start(zaman);
    }

    // 3D zar penceresinden gelen tek bir çarpışma: dosya adı ve hıza göre ses seviyesi
    function calDosya(dosya, guc) {
      if (!hazir()) return;
      var buf = tampon[dosya];
      if (buf) calTek(buf, 0, Math.max(0.05, Math.min(1, (guc || 0.5) * 1.4)));
    }

    // 3D kapalıyken: fizik yok, yaklaşık bir çarpma dizisi
    var rastgele = function (onek) {
      var l = DOSYALAR.filter(function (f) { return f.indexOf(onek) === 0 && tampon[f]; });
      return l.length ? tampon[l[Math.floor(Math.random() * l.length)]] : null;
    };
    function cal(notasyon, tur) {
      if (!hazir() || !notasyon) return false;
      var adet = String(notasyon).split("+").reduce(function (t, g) { return t + (parseInt(g, 10) || 1); }, 0);
      var malzeme = tur === "crit" ? "dicehit/dicehit_metal" : "dicehit/dicehit_plastic";
      return (yukleniyor || Promise.resolve()).then(function () {
        var t0 = ctx.currentTime + 0.05;
        for (var z = 0; z < Math.min(adet, 6); z++) {
          var t = t0 + z * 0.09 + Math.random() * 0.1, guc = 0.6;
          for (var h = 0; h < 3; h++) {
            var b = rastgele(h === 0 ? "surfaces/surface_wood_table" : malzeme);
            if (b) calTek(b, t, guc);
            t += 0.18 + h * 0.12 + Math.random() * 0.1;
            guc *= 0.45;
          }
        }
        return true;
      });
    }

    function durum() {
      return "ses: " + (ctx ? ctx.state : "henüz tıklanmadı") + " · yüklenen dosya: " + Object.keys(tampon).length + "/" + DOSYALAR.length + (sonHata ? " · hata: " + sonHata : "");
    }
    return {
      cal: cal, calDosya: calDosya, durum: durum, hazir: hazir,
      test: function () { hazirla(); return (yukleniyor || Promise.resolve()).then(function () { return cal("1d20@20", "normal"); }).then(durum); }
    };
  };
})();
