// window.SOZLUK listesini #gloss içine çizer ve #gl-q ile filtreler.
(function () {
  var gl = document.getElementById('gloss');
  var q = document.getElementById('gl-q');
  var cnt = document.getElementById('gl-count');
  if (!gl || !window.SOZLUK) return;
  var norm = function (s) { return (s || '').toLocaleLowerCase('tr'); };
  var rows = [], last = null;
  window.SOZLUK.forEach(function (it) {
    if (it.grup !== last) {
      var g = document.createElement('div'); g.className = 'grp'; g.textContent = it.grup;
      gl.appendChild(g); last = it.grup; rows.push({ grp: g });
    }
    var dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.id = 'k-' + norm(it.terim).replace(/[^a-z0-9]+/g, '-');
    dt.textContent = it.terim;
    if (it.alt) { var s = document.createElement('small'); s.textContent = it.alt; dt.appendChild(s); }
    dd.innerHTML = it.tanim;
    gl.appendChild(dt); gl.appendChild(dd);
    rows.push({ dt: dt, dd: dd, text: norm(it.terim + ' ' + it.alt + ' ' + dd.textContent) });
  });
  function run() {
    var v = q ? norm(q.value.trim()) : '', shown = 0, curGrp = null, grpHas = false;
    rows.forEach(function (r) {
      if (r.grp) { if (curGrp) curGrp.hidden = !grpHas; curGrp = r.grp; grpHas = false; return; }
      var hit = !v || r.text.indexOf(v) > -1;
      r.dt.hidden = !hit; r.dd.hidden = !hit;
      if (hit) { shown++; grpHas = true; }
    });
    if (curGrp) curGrp.hidden = !grpHas;
    if (cnt) cnt.textContent = shown + ' terim';
  }
  if (q) q.addEventListener('input', run);
  run();
})();
