// Zar sesi: kullanıcının tıkladığı sayfada (panel ya da karakter sayfası) Web Audio ile çalınır.
// Tarayıcılar, hiç tıklanmamış bir pencerede ses çalmaya izin vermez; 3D zar penceresi bu yüzden sessizdir.
//   const ses = ZarSesi(tabanYol);   // tabanYol: ".../assets/"
//   ses.cal("2d20@14,7", "crit");    // zarlar yuvarlanırken çarpma sesleri
(function () {
  var DOSYA = {
    plastic: [1, 2, 3, 5, 8, 9, 10, 11, 13, 15].map(function (n) { return "zar/sounds/dicehit/dicehit_plastic" + n + ".mp3"; }),
    metal: [1, 2, 3, 4, 6, 8, 10, 12].map(function (n) { return "zar/sounds/dicehit/dicehit_metal" + n + ".mp3"; }),
    felt: [1, 2, 3, 5, 7].map(function (n) { return "zar/sounds/surfaces/surface_felt" + n + ".mp3"; }),
  };
  window.ZarSesi = function (taban) {
    var ctx = null, tampon = { plastic: [], metal: [], felt: [] }, yukleniyor = null;
    function hazirla() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        yukleniyor = Promise.all(Object.keys(DOSYA).map(function (tur) {
          return Promise.all(DOSYA[tur].map(function (f) {
            return fetch(taban + f).then(function (r) { return r.arrayBuffer(); })
              .then(function (b) { return new Promise(function (ok, no) { ctx.decodeAudioData(b, ok, no); }); })
              .then(function (buf) { tampon[tur].push(buf); }).catch(function () {});
          }));
        }));
      }
      if (ctx.state === "suspended") ctx.resume();
    }
    // İlk tıklamada sesi hazırla (tarayıcı izni tıklamayla gelir)
    document.addEventListener("pointerdown", hazirla, true);
    document.addEventListener("keydown", hazirla, true);

    function calTek(buf, zaman, guc) {
      var src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = buf; g.gain.value = guc;
      src.connect(g); g.connect(ctx.destination); src.start(zaman);
    }
    var rastgele = function (l) { return l[Math.floor(Math.random() * l.length)]; };
    function cal(notasyon, tur) {
      if (!ctx || ctx.state !== "running" || !notasyon) return false;
      var adet = String(notasyon).split("+").reduce(function (t, g) { return t + (parseInt(g, 10) || 1); }, 0);
      var malzeme = tur === "crit" ? "metal" : "plastic";
      return (yukleniyor || Promise.resolve()).then(function () {
        var t0 = ctx.currentTime + 0.05;
        if (tampon.felt.length) calTek(rastgele(tampon.felt), t0 + 0.12, 0.5);
        for (var z = 0; z < Math.min(adet, 6); z++) {
          var t = t0 + 0.15 + Math.random() * 0.12, guc = 0.9;
          for (var h = 0; h < 4 + Math.floor(Math.random() * 3); h++) {
            if (tampon[malzeme].length) calTek(rastgele(tampon[malzeme]), t, guc);
            t += 0.12 + Math.random() * 0.22 * (1 + h * 0.4);
            guc *= 0.62;
          }
        }
        return true;
      });
    }
    return { cal: cal, hazir: function () { return !!ctx && ctx.state === "running"; } };
  };
})();
