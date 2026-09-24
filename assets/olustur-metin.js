// Karakter üreticisi: yeni başlayanlar için kısa Türkçe rehber metinleri (kendi yazımımız).
// Kural metninin kendisi 5e.tools'tan, üstüne gelince/açınca gelir.

export const SINIF_TR = {
  Barbarian: { hd: 12, ana: "Str, Con", rol: "Ön saf, dayanıklı vurucu", zorluk: "Kolay",
    ozet: "Öfkesini silaha çeviren savaşçı. Rage açınca daha sert vurur ve darbelere direnir. Zırhsız da sağlamdır. Az kural, çok eğlence." },
  Bard: { hd: 8, ana: "Cha", rol: "Destek, büyü, sosyal", zorluk: "Orta",
    ozet: "Müzik ve sözle büyü yapan çok yönlü kahraman. Takım arkadaşlarına Bardic Inspiration verir, pek çok skill'de iyidir, konuşarak sorun çözer." },
  Cleric: { hd: 8, ana: "Wis", rol: "İyileştirici, destek, orta saf", zorluk: "Orta",
    ozet: "Tanrısından güç alan rahip. İyileştirir, korur, ölümsüzleri kovar. Zırh giyebilir. Grupta iyileştirici yoksa en güvenli seçim." },
  Druid: { hd: 8, ana: "Wis", rol: "Doğa büyüsü, destek, şekil değiştirme", zorluk: "Orta-Zor",
    ozet: "Doğanın büyücüsü. İyileştirir, alanı kontrol eder ve Wild Shape ile hayvana dönüşür. Seçenek çok, ilk seferde biraz bunaltabilir." },
  Fighter: { hd: 10, ana: "Str ya da Dex", rol: "Ön saf, silah ustası", zorluk: "Kolay",
    ozet: "Silahların ustası. Her zırhı ve silahı kullanır, çok saldırır, kendini iyileştirebilir (Second Wind). İlk karakter için en anlaşılır sınıf." },
  Monk: { hd: 8, ana: "Dex, Wis", rol: "Hızlı dövüşçü", zorluk: "Orta",
    ozet: "Silahsız dövüş ve iç disiplin ustası. Çok hızlıdır, bir turda birçok darbe indirir, Focus Point'lerle özel hareketler yapar." },
  Paladin: { hd: 10, ana: "Str, Cha", rol: "Ön saf, koruyucu, iyileştirici", zorluk: "Kolay-Orta",
    ozet: "Yemin etmiş kutsal savaşçı. Ağır zırh giyer, Divine Smite ile büyük hasar verir, dokunarak iyileştirir (Lay on Hands), yanındakileri korur." },
  Ranger: { hd: 10, ana: "Dex, Wis", rol: "Uzak/yakın savaşçı, iz sürücü", zorluk: "Orta",
    ozet: "Vahşi doğanın avcısı. Yayla ya da iki silahla dövüşür, Hunter's Mark ile hedefini işaretler, doğa büyüleri kullanır." },
  Rogue: { hd: 8, ana: "Dex", rol: "Gizlilik, tek hedefe yüksek hasar, skill", zorluk: "Kolay-Orta",
    ozet: "Gölgelerin ustası. Sneak Attack ile tek vuruşta büyük hasar verir, kilit açar, tuzak bulur, gizlenir. En çok skill'e sahip sınıf." },
  Sorcerer: { hd: 6, ana: "Cha", rol: "Uzaktan büyü hasarı", zorluk: "Orta",
    ozet: "Büyü kanında olan büyücü. Az büyü bilir ama Metamagic ile onları büker: iki hedefe, daha uzağa, sessizce… Kırılgandır, arkada durur." },
  Warlock: { hd: 8, ana: "Cha", rol: "Uzaktan büyü, esnek", zorluk: "Orta",
    ozet: "Güçlü bir varlıkla pakt yapmış büyücü. Az ama short rest'te yenilenen slotları var. Eldritch Blast'ı ve Invocation'larıyla kendine göre şekillenir." },
  Artificer: { hd: 8, ana: "Int", rol: "Mucit büyücü, destek", zorluk: "Orta-Zor",
    ozet: "Büyüyü aletler ve icatlarla yapan mucit (Eberron). Büyülü eşyalar üretir, zırhını ya da topunu silaha çevirir. DM izniyle." },
  Wizard: { hd: 6, ana: "Int", rol: "Büyü uzmanı, çözüm üretici", zorluk: "Zor",
    ozet: "Büyüyü kitaptan öğrenen âlim. En geniş büyü listesine sahiptir, her gün hangi büyüleri hazırlayacağını seçer. Kırılgandır ama çok güçlü." },
};

export const TUR_TR = {
  Aasimar: "Göksel bir varlığın soyundan. Işık saçar, dokunarak iyileştirir, 3. seviyede göksel bir forma bürünür.",
  Dragonborn: "Ejderha soyundan gelen insansı. Ejderha türüne göre nefes silahı ve bir hasar türüne direnç kazanır.",
  Dwarf: "Dağların sağlam halkı. Fazladan HP, zehre direnç, uzun darkvision ve taşları sezme yeteneği.",
  Elf: "Uzun ömürlü, zarif halk. Uyumaz, trance'a girer. Drow, High Elf ya da Wood Elf soyundan biri olur, her biri farklı büyüler verir.",
  Gnome: "Küçük ve meraklı. Zihinsel büyülere karşı dirençlidir. Forest Gnome hayvanlarla konuşur, Rock Gnome küçük aletler yapar.",
  Goliath: "Devlerin soyundan, iri ve güçlü. Dev türüne göre özel bir güç kazanır, 5. seviyede büyüyebilir.",
  Halfling: "Küçük ve şanslı. Doğal 1 atınca zarı yeniden atar, büyük yaratıkların arasından kolayca geçer ve gizlenir.",
  Human: "Her yerde bulunan, uyumlu halk. Fazladan bir skill ve fazladan bir Origin feat alır. Yeni başlayanlar için esnek bir seçim.",
  Orc: "Güçlü ve dayanıklı. Uzun darkvision, darbe alınca ayakta kalma (Relentless Endurance) ve ani hız patlaması (Adrenaline Rush).",
  Dhampir: "Yarı vampir (Ravenloft). Duvarlara tırmanır, ısırığıyla güç çalar, Necrotic hasara dirençlidir.",
  Hexblood: "Cadı lanetiyle doğmuş (Ravenloft). Görünüşünü değiştirir, Hex büyüsü bilir, cadı işaretiyle uzaktan izler.",
  Lupin: "Kurt kanı taşıyan halk (Ravenloft). Keskin duyular, pençeli Unarmed Strike ve korkutucu uluma (Howl).",
  Reborn: "Ölümden dönmüş (Ravenloft). Ölümün eşiğinden kurtulabilir, geçmiş hayatından bir skill ve bir hasar türüne direnç.",
  Changeling: "Şekil değiştiren halk (Eberron). Görünüşünü istediği gibi değiştirir, sosyal skill'lerde güçlüdür.",
  Kalashtar: "Bir ruhla bağ kurmuş insan soyu (Eberron). Telepati ve Psychic dirence sahiptir.",
  Khoravar: "Elf ile insanın çocuğu (Eberron). Uyumlu; bir cantrip ve değiştirilebilir bir skill.",
  Shifter: "İçindeki hayvanı çağırabilen halk (Eberron). Kısa süre değişir, türüne göre güç kazanır.",
  Warforged: "Savaş için yapılmış canlı makine (Eberron). +1 AC, zehre direnç, uyumaz.",
  "Elf|LFL": "Lorwyn'in elfleri (Lorwyn). Güzelliğe tutkun, gururlu soy.",
  Boggart: "Lorwyn'in gürültücü, küçük goblin halkı (Lorwyn).",
  Faerie: "Küçük, kanatlı peri halkı (Lorwyn). Uçabilir.",
  Flamekin: "Ateşten bedenli halk (Lorwyn). Ateşe dirençli, Produce Flame bilir.",
  Kithkin: "Halfling benzeri, sıkı topluluklarda yaşayan küçük halk (Lorwyn). Uzun darkvision.",
  "Lorwyn Changeling": "Lorwyn'in şekil değiştirenleri (Lorwyn). Uzun darkvision.",
  Rimekin: "Buzdan bedenli halk (Lorwyn). Soğuğa dirençli, soğuk büyüleri.",
  Tiefling: "Soyunda iblis kanı taşır. Abyssal, Chthonic ya da Infernal mirasına göre bir hasar türüne direnç ve büyüler kazanır.",
};

export const AB_TR = {
  str: "Kas gücü: yakın dövüş silahları, tırmanma, itip kakma (Athletics).",
  dex: "Çeviklik: menzilli ve Finesse silahlar, AC, initiative, gizlilik (Stealth), el becerisi.",
  con: "Dayanıklılık: HP'ni artırır, konsantrasyonu korur. Her karakter için önemli.",
  int: "Zekâ: Wizard büyüleri, bilgi skill'leri (Arcana, History, Investigation).",
  wis: "Sağduyu: Cleric/Druid/Ranger büyüleri, fark etme (Perception), sezgi (Insight).",
  cha: "Karizma: Bard/Sorcerer/Warlock/Paladin büyüleri, ikna, kandırma, sahne.",
};

export const ADIM_TR = {
  sinif: "Class, karakterinin ne iş yaptığını belirler: nasıl dövüştüğünü, büyü yapıp yapmadığını, grupta hangi rolü üstlendiğini. Emin değilsen Fighter, Rogue ya da Cleric en kolay başlangıçtır.",
  bg: "Background, macera öncesi hayatındır. 2024 kurallarında ability artışların, iki skill'in, bir tool'un ve bir Origin feat'in buradan gelir.",
  tur: "Species, karakterinin halkıdır. Ability puanı vermez (2024 kuralı), ama darkvision, direnç, özel yetenekler ve bazen büyüler verir.",
  yetenek: "Altı ability her şeyin temelidir. Class'ının ana ability'sine en yüksek puanı ver, Constitution'ı da ihmal etme.",
  sec: "Class'ının sana sunduğu seçimler: skill'ler, ustalıklar, özel teknikler. Fareyi bir seçeneğin üstüne getirince açıklaması çıkar.",
  buyu: "Cantrip'ler bedavadır, istediğin kadar yapılır. Diğer büyüler spell slot harcar ve long rest'te yenilenir.",
  ekip: "Başlangıç eşyaların. Hazır paketi almak en kolayı. Sadece altın alırsan eşyaları DM ile birlikte satın alırsın.",
  kimlik: "Karakterine bir ad ver. Owlbear'da oynuyoruz: karakteri oyuna almanın yolu aşağıda.",
};

// Alignment (PHB 2024, 4. adım). Adlar keyword olarak İngilizce, açıklama Türkçe.
export const ALIGN = [
  ["Lawful Good", "Toplumun doğru saydığı şeyi yapmaya çalışır. Adaletsizliğe karşı savaşan, masumu tereddütsüz koruyan biri."],
  ["Neutral Good", "Elinden gelenin en iyisini yapar; kurallar içinde çalışır ama onlara bağlı hissetmez. Başkalarına ihtiyaçlarına göre yardım eden iyi kalpli biri."],
  ["Chaotic Good", "Başkalarının beklentisini pek umursamadan vicdanının sesine uyar. Zalim bir baronun vergi memurlarını soyup parayı yoksullara dağıtan bir asi."],
  ["Lawful Neutral", "Yasaya, geleneğe ya da kendi koyduğu kurallara göre davranır. Ne muhtaçların isteğine ne kötülüğün cazibesine kapılan, disiplinli bir yaşam süren biri."],
  ["Neutral", "Ahlak sorularından kaçınır, taraf tutmaz, o an en iyi görüneni yapar. Ahlak tartışmalarından sıkılan biri."],
  ["Chaotic Neutral", "Kaprislerinin peşinden gider, kişisel özgürlüğünü her şeyin üstünde tutar. Aklıyla geçinip diyar diyar dolaşan bir çapkın."],
  ["Lawful Evil", "Bir gelenek, sadakat ya da düzen kuralının sınırları içinde, istediğini sistemli biçimde alır. Halkı sömürüp güç için entrika çeviren bir soylu."],
  ["Neutral Evil", "Arzularının peşinde verdiği zarardan rahatsız olmaz. Canı istediğinde soyan ve öldüren bir suçlu."],
  ["Chaotic Evil", "Nefret ya da kan hırsıyla keyfi şiddete başvurur. İntikam ve kaos peşindeki bir kötü."],
];
// Alignment'a göre kişilik özellikleri (PHB 2024 tablosu)
export const ALIGN_OZ = {
  Lawful: ["İş birlikçi", "Sadık", "Yargılayıcı", "Düzenli"], Chaotic: ["Övüngen", "Aceleci", "Asi", "Kendine dönük"],
  Good: ["Merhametli", "Yardımsever", "Dürüst", "İyi kalpli"], Evil: ["Sahtekâr", "İntikamcı", "Zalim", "Açgözlü"],
  Neutral: ["Bencil", "İlgisiz", "Az konuşan", "Pragmatik"],
};
// Ability puanına göre görünüş ve kişilik sıfatları (PHB 2024, 3. adım): [yüksek, düşük]
export const SIFAT = {
  str: [["Kaslı", "Güçsüz"], ["Adaleli", "Çelimsiz"], ["Koruyucu", "Çekingen"], ["Dolaysız", "Dolaylı"]],
  dex: [["Çevik", "Tedirgin"], ["Hareketli", "Sakar"], ["Kıpır kıpır", "Tereddütlü"], ["Dengeli", "Dengesiz"]],
  con: [["Enerjik", "Cılız"], ["Dinç", "Midesi hassas"], ["Gürbüz", "Uyuşuk"], ["Sağlam", "Kırılgan"]],
  int: [["Kararlı", "Basit"], ["Mantıklı", "Mantıksız"], ["Bilgili", "Habersiz"], ["Meraklı", "Havai"]],
  wis: [["Dingin", "Düşüncesiz"], ["Düşünceli", "Dalgın"], ["Dikkatli", "Bihaber"], ["Temkinli", "Toy"]],
  cha: [["Çekici", "Ukala"], ["Buyurgan", "Espri anlayışsız"], ["Komik", "İçine kapalı"], ["İlham veren", "Patavatsız"]],
};
