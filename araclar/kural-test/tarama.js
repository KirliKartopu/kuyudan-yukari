// Tarama: her class × subclass × seviye (1-20 arası 14 seviye) için soruları otomatik doldurur ve bakar:
// çökme, tamamlanamayan / seçeneksiz soru, açıklama balonu çıkmayan özellik-büyü-seçenek, geçersiz kullanım sayacı.
// Çalıştır: node araclar/kural-test/tarama.js   (masanın kural-sunucu.js'i yerel 5e.tools verisini bağlar; ~5 dk)
// Temiz çıktı yalnız "karakter: N" satırıdır.
require("E:/FRP Campaign/DnD/araclar/masa/kural-sunucu.js");
const {pathToFileURL}=require("url");
(async()=>{const K=await import(pathToFileURL("E:/FRP Campaign/DnD/kuyudan-yukari/assets/kural.js").href);await K.veriYukle();
 const A=await import(pathToFileURL("E:/FRP Campaign/DnD/kuyudan-yukari/assets/aciklama.js").href);
 const sorun=new Map(), not=(tip,ayr,yer)=>{const k=tip+" | "+ayr;if(!sorun.has(k))sorun.set(k,new Set());sorun.get(k).add(yer)};
 const Y0=K.bosYapi();Y0.dunyalar=true;
 const bgs=K.liste(Y0,"background"), turler=K.liste(Y0,"tur"), siniflar=K.siniflar(Y0);
 const ackSor=new Map();const ack=async(s)=>{if(!ackSor.has(s)){const [t,a,e]=s.split("|");let r=null;try{r=await A.aciklamaBul(t,a,e)}catch(x){}ackSor.set(s,!!r)}return ackSor.get(s)};
 const doldur=(Y,S)=>{let q=[];for(let p=0;p<12;p++){q=K.secimler(Y,S);let degisti=false;
   for(const x of q){if(x.tamam)continue;const acik=x.secenekler.filter(o=>!o.devre).map(o=>typeof o==="string"?o:o.d);
     if(x.tur==="bgab"){const ab=x.secenekler.map(o=>typeof o==="string"?o:o.d);Y.secim[x.k]=ab.length>=2?["21",ab[0],ab[1]]:["111"];}
     else if(x.tur==="asi")Y.secim[x.k]=acik.slice(0,2);
     else Y.secim[x.k]=acik.slice(0,x.tur==="tek"?1:x.adet);
     degisti=true;}
   if(!degisti)break;}return K.secimler(Y,S);};
 let n=0;
 for(const [ci,sinif] of siniflar.entries()){const S=await K.sinifYukle(sinif);
  for(const L of [1,2,3,4,5,6,8,10,11,12,14,17,18,20]){
   let subs=[null];
   if(L>=3){const Y=K.bosYapi();Object.assign(Y,{dunyalar:true,sinif,seviye:L});const q=K.secimler(Y,S).find(x=>x.k==="subclass");subs=q?q.secenekler.map(o=>o.d):[null];if(!q)not("subclass sorusu yok",sinif,L)}
   for(const [si,sub] of subs.entries()){n++;
    const Y=K.bosYapi();Object.assign(Y,{dunyalar:true,sinif,seviye:L,background:bgs[(n*7)%bgs.length].name+"|"+bgs[(n*7)%bgs.length].source,tur:turler[(n*5)%turler.length].name+"|"+turler[(n*5)%turler.length].source,yontem:"standart",atama:{str:0,dex:1,con:2,int:3,wis:4,cha:5}});
    if(sub)Y.secim.subclass=[sub];
    const yer=`${sinif} ${L}${sub?" "+sub:""} [${Y.tur.split("|")[0]}/${Y.background.split("|")[0]}]`;
    let q,C;try{q=doldur(Y,S);C=K.hesapla(Y,S)}catch(e){not("ÇÖKME",e.message.slice(0,90),yer);continue}
    for(const x of q){if(!x.tamam)not("tamamlanamayan soru",x.baslik+" ("+x.k.replace(/\d{6,}/,"#")+") "+x.secenekler.filter(o=>!o.devre).length+"/"+x.adet,yer);
     if(!x.secenekler.length&&x.tur!=="bgab")not("seçeneksiz soru",x.baslik,yer);}
    for(const f of C.ozellikler) if(!(await ack("ozellik|"+f.ad+"|"+f.kaynak))) not("açıklaması yok (özellik)",f.ad+" ["+f.kaynak+"]",yer);
    for(const b of (C.buyu?C.buyu.buyuler:[])) if(!(await ack("buyu|"+b.ad))) not("açıklaması yok (büyü)",b.ad,yer);
    for(const x of q) for(const o of x.secenekler) if(o.ack&&!/^(skill|buyu)\|/.test(o.ack)&&!(await ack(o.ack))) not("açıklaması yok (seçenek)",o.ack,x.baslik);
    if(!(C.hp_max>0))not("HP hatalı",String(C.hp_max),yer);
    for(const k of C.kaynaklar||[]){if(!(Number.isInteger(k.max)&&k.max>0&&k.max<500))not("sayaç sayısı hatalı",k.ad+"="+k.max,yer);
     if(k.zar&&!/^\d*d\d+([+-]\d+)?$/.test(k.zar))not("sayaç zarı hatalı",k.ad+"="+k.zar,yer);
     if(C.kaynaklar.filter(x=>x.id===k.id).length>1)not("sayaç iki kez",k.ad,yer);}
   }}}
 console.log("karakter:",n);
 for(const [k,v] of [...sorun.entries()].sort()) console.log(k,"  ×"+v.size,"  örn:",[...v].slice(0,2).join(" ; "));
})();
