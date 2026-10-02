/**
 * NOTYA-SES-NORMAL-01 — golden tests of the medical speech layer: every example of the specification, each unit and
 * number form, apostrophe suffixes, idempotency, the detail flag, names / drug names / identity values untouched.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { bilinmeyenKisaltmalar } from './gelistirme/bilinmeyenKisaltma'
import { detayIstegiMi, ekUyarla, sayiMetniOku, sayiOku, seslendirilmemisler, siraOku, sozlukteVarMi, tarihOku, tibbiSeslendir } from './tibbiSeslendirme'
import { BIRIM_SOZLUGU, KISALTMA_SOZLUGU, PAYDA_SOZLUGU } from './tibbiSeslendirmeSozluk'

const s = (metin: string) => tibbiSeslendir(metin)
const d = (metin: string) => tibbiSeslendir(metin, { detay: true })
const esit = (girdi: string, beklenen: string) => assert.equal(s(girdi), beklenen, girdi)

test('şartname — her örnek (Dr. Gökhan, alındığı kadarı)', () => {
  esit('DTaP', 'difteri tetanos aselüler boğmaca aşısı')
  esit('DaBT', 'difteri aselüler boğmaca tetanos')
  esit('DaBT-İPA-Hib', 'beşli karma aşı')
  assert.equal(d('DaBT-İPA-Hib'), 'difteri aselüler boğmaca tetanos inaktif polio ve Hib aşısı')
  esit('KPA', 'konjuge pnömokok aşısı')
  esit('KKK', 'kızamık kızamıkçık kabakulak aşısı')
  esit('OPA', 'oral polio aşısı')
  esit('BCG', 'BCG aşısı')
})

test('talimat — aşılar, kurum, rehber, tarama, tanı, laboratuvar', () => {
  esit('Hib', 'Hib aşısı')
  esit('İPA', 'inaktif polio aşısı')
  esit('MenACWY', 'meningokok A C W Y aşısı')
  esit('MenB', 'meningokok B aşısı')
  esit('HepA ve HepB', 'hepatit A aşısı ve hepatit B aşısı')
  esit('Hep-B 3. doz', 'hepatit B aşısı üçüncü doz')
  esit('Rotavirus aşısı', 'rotavirüs aşısı')
  esit('varicella aşısı', 'varisella aşısı')
  esit('Influenza aşısı', 'influenza aşısı')
  esit('SB şemasına göre', 'Sağlık Bakanlığı şemasına göre')
  esit('GİDR ile değerlendirildi', 'Gelişimi İzleme ve Destekleme Rehberi ile değerlendirildi')
  esit('M-CHAT-R/F uygulanacak', 'em çat uygulanacak')
  esit('AOM tanısı', 'akut otitis media tanısı')
  esit('ÜSYE', 'üst solunum yolu enfeksiyonu')
  esit('Hb düşük, MCV düşük, TDBK yüksek, CRP normal', 'hemoglobin düşük, em si vi düşük, total demir bağlama kapasitesi yüksek, se re pe normal')
  esit('BKİ normal', 'beden kitle indeksi normal')
})

test('sözlük — en uzun eşleşme önce, kelime sınırı, baş ad iki kez söylenmez', () => {
  esit('DaBT-İPA-Hib ve KPA yapıldı', 'beşli karma aşı ve konjuge pnömokok aşısı yapıldı')
  esit('DaBT-İPA rapeli', 'dörtlü karma aşı rapeli')
  esit('KKK aşısı yapıldı', 'kızamık kızamıkçık kabakulak aşısı yapıldı')
  esit('KPA ve KKK aşıları', 'konjuge pnömokok aşısı ve kızamık kızamıkçık kabakulak aşıları')
  esit('DaBT-İPA-Hib aşısı', 'beşli karma aşısı')
  // kelimenin içinde eşleşmez
  esit('OPAL ve SBT', 'OPAL ve SBT')
  esit('Hibiskus çayı', 'Hibiskus çayı')
  esit('KPA13', 'on üç valanlı konjuge pnömokok aşısı')
  // en dash ya da kırılmaz tire ile yazılmış bileşik
  esit('DaBT–İPA–Hib', 'beşli karma aşı')
})

test('Türkçe büyük-küçük harf — I ve İ aynı harf, tümü büyük yazım', () => {
  esit('DaBT-IPA-Hib', 'beşli karma aşı')
  esit('DABT-İPA-HİB', 'beşli karma aşı')
  esit('DABT-IPA-HIB', 'beşli karma aşı')
  esit('IPA', 'inaktif polio aşısı')
  esit('GIDR', 'Gelişimi İzleme ve Destekleme Rehberi')
  esit('BKI', 'beden kitle indeksi')
  esit('USYE', 'üst solunum yolu enfeksiyonu')
  esit('HB 11,2', 'hemoglobin on bir virgül iki')
  // küçük harfli yazım kısaltma değildir
  esit('sb ve kpa', 'sb ve kpa')
  esit('İNFLUENZA', 'influenza')
})

test('kesme işaretinden sonraki ek doğal kalır', () => {
  esit("DaBT'nin", 'difteri aselüler boğmaca tetanosun')
  esit("KPA'nın ikinci dozu", 'konjuge pnömokok aşısının ikinci dozu')
  esit("KPA'yı", 'konjuge pnömokok aşısını')
  esit("KKK'ya", 'kızamık kızamıkçık kabakulak aşısına')
  esit("KKK'dan sonra", 'kızamık kızamıkçık kabakulak aşısından sonra')
  esit("OPA'da", 'oral polio aşısında')
  esit("BCG'yle", 'BCG aşısıyla')
  esit("DaBT-İPA-Hib'in", 'beşli karma aşının')
  assert.equal(d("DaBT-İPA-Hib'in"), 'difteri aselüler boğmaca tetanos inaktif polio ve Hib aşısının')
  esit("SB'nin önerisi", "Sağlık Bakanlığı'nın önerisi")
  esit("GİDR'e göre", "Gelişimi İzleme ve Destekleme Rehberi'ne göre")
  esit("Hb'si 10,8", 'hemoglobini on virgül sekiz')
  esit("Hb’nin", 'hemoglobinin')
  esit("AOM'dur", 'akut otitis mediadır')
  esit("BKİ'si", 'beden kitle indeksi')
  esit("MCV'ler", 'em si viler')
  // tanınmayan ek yazıldığı gibi kalır
  esit("CRP'ymiş", "se re pe'ymiş")
  assert.equal(ekUyarla('kilogram', 'ı'), 'kilogramı')
  assert.equal(ekUyarla('santimetre', 'den'), 'santimetreden')
  assert.equal(ekUyarla('litre', 'lik'), 'litrelik')
})

test('sayı çevirici — 0..9999 ve ötesi', () => {
  const beklenen: [number, string][] = [
    [0, 'sıfır'], [1, 'bir'], [7, 'yedi'], [10, 'on'], [11, 'on bir'], [19, 'on dokuz'], [20, 'yirmi'], [57, 'elli yedi'], [99, 'doksan dokuz'],
    [100, 'yüz'], [101, 'yüz bir'], [110, 'yüz on'], [200, 'iki yüz'], [999, 'dokuz yüz doksan dokuz'], [1000, 'bin'], [1001, 'bin bir'],
    [1100, 'bin yüz'], [2026, 'iki bin yirmi altı'], [9999, 'dokuz bin dokuz yüz doksan dokuz'], [10000, 'on bin'], [12500, 'on iki bin beş yüz'],
    [250000, 'iki yüz elli bin'], [1000000, 'bir milyon'], [2500000, 'iki milyon beş yüz bin'],
  ]
  for (const [n, soz] of beklenen) assert.equal(sayiOku(n), soz, String(n))
  // 0..9999: hiçbiri rakam bırakmaz, hiçbiri boş değil, hepsi birbirinden farklı
  const gorulen = new Set<string>()
  for (let n = 0; n <= 9999; n++) {
    const soz = sayiOku(n)
    assert.ok(soz && !/\d/.test(soz) && soz === soz.trim() && !/\s{2}/.test(soz), `${n}: "${soz}"`)
    gorulen.add(soz)
  }
  assert.equal(gorulen.size, 10000)
  assert.equal(sayiOku(-1), '-1')
  assert.equal(sayiOku(1.5), '1.5')
  assert.equal(siraOku(1), 'birinci')
  assert.equal(siraOku(3), 'üçüncü')
  assert.equal(siraOku(4), 'dördüncü')
  assert.equal(siraOku(26), 'yirmi altıncı')
  assert.equal(siraOku(100), 'yüzüncü')
})

test('ondalık — virgül "virgül" okunur', () => {
  esit('13,3', 'on üç virgül üç')
  esit('13.3', 'on üç virgül üç')
  esit('0,5', 'sıfır virgül beş')
  esit('0,05', 'sıfır virgül sıfır beş')
  esit('12,85', 'on iki virgül seksen beş')
  esit('87,5', 'seksen yedi virgül beş')
  assert.equal(sayiMetniOku('12.500'), 'on iki bin beş yüz')
  assert.equal(sayiMetniOku('1.250,5'), 'bin iki yüz elli virgül beş')
  assert.equal(sayiMetniOku('0.125'), 'sıfır virgül yüz yirmi beş')
  assert.equal(sayiMetniOku('abc'), null)
  esit('Lökosit 12.500.', 'Lökosit on iki bin beş yüz.')
  esit('Kilosu 12.', 'Kilosu on iki.')
})

test('birimler — her biri', () => {
  esit('13,3 kg', 'on üç virgül üç kilogram')
  esit('250 g', 'iki yüz elli gram')
  esit('500 gr', 'beş yüz gram')
  esit('250 mg', 'iki yüz elli miligram')
  esit('5 mcg', 'beş mikrogram')
  esit('5 µg', 'beş mikrogram')
  esit('5 μg', 'beş mikrogram')
  esit('10 mL', 'on mililitre')
  esit('10 ml', 'on mililitre')
  esit('1,5 L', 'bir virgül beş litre')
  esit('1.5lt', 'bir virgül beş litre')
  esit('87,5 cm', 'seksen yedi virgül beş santimetre')
  esit('7 mm', 'yedi milimetre')
  esit('95 mmHg', 'doksan beş milimetre cıva')
  esit('38,7 °C', 'otuz sekiz virgül yedi derece')
  esit('39°C', 'otuz dokuz derece')
  esit('39°', 'otuz dokuz derece')
  esit('%50', 'yüzde elli')
  esit('% 12,5', 'yüzde on iki virgül beş')
  esit('50%', 'yüzde elli')
  esit('120/dk', 'dakikada yüz yirmi')
  esit('Nabız 110 atım/dk.', 'Nabız dakikada yüz on atım.')
  esit('11,8 g/dL', 'on bir virgül sekiz gram desilitre')
  esit('85 mg/dL', 'seksen beş miligram desilitre')
  esit('12 ng/mL', 'on iki nanogram mililitre')
  esit('50 mg/kg/gün', 'günde kilogram başına elli miligram')
  esit('10 mg/kg/doz', 'doz başına kilogram başına on miligram')
  esit('15 mg/kg', 'kilogram başına on beş miligram')
  esit('400 IU', 'dört yüz ünite')
  esit('74 fL', 'yetmiş dört femtolitre')
  esit('250 mg/5 mL', 'beş mililitrede iki yüz elli miligram')
  esit('12.500/mm³', 'milimetreküpte on iki bin beş yüz')
  // bitişik yazım, ek, sayısız birim
  esit('13.3kg', 'on üç virgül üç kilogram')
  esit("5 mg'lık", 'beş miligramlık')
  esit("10 kg'dan", 'on kilogramdan')
  esit("12 kg'ı", 'on iki kilogramı')
  esit('doz mg/kg olarak', 'doz kilogram başına miligram olarak')
  esit('kg cinsinden', 'kilogram cinsinden')
  // birim değil
  esit('3 gün', 'üç gün')
  esit('2 doz', 'iki doz')
  esit('5 yaş', 'beş yaş')
})

test('yüzdelik, Z skoru, aralık, tansiyon, sıra, doz', () => {
  esit('p97', 'yüzdelik doksan yedi')
  esit('P3', 'yüzdelik üç')
  esit('p3–p10 arası', 'yüzdelik üç ile yüzdelik on arası')
  esit("p97'nin üstünde", 'yüzdelik doksan yedinin üstünde')
  esit('97. persentil', 'doksan yedinci persentil')
  esit('Z skoru +1,2', 'Z skoru artı bir virgül iki')
  esit('Z-skoru: -0,5', 'Z skoru eksi sıfır virgül beş')
  esit('z skoru −2', 'Z skoru eksi iki')
  esit('Z skoru 0', 'Z skoru sıfır')
  esit('Z: +1,5', 'Z skoru artı bir virgül beş')
  esit('-2 SD', 'eksi iki standart sapma')
  esit('40–50 mg/kg/gün', 'günde kilogram başına kırk ile elli miligram')
  esit('13,3–14,1 kg', 'on üç virgül üç ile on dört virgül bir kilogram')
  esit('3–5 gün', 'üç ile beş gün')
  esit('5-10 mg', 'beş ile on miligram')
  esit('%10–15', 'yüzde on ile on beş')
  esit('3–10. persentil arası', 'üç ile onuncu persentil arası')
  esit('Tansiyon 132/85 mmHg', 'Tansiyon yüz otuz iki bölü seksen beş milimetre cıva')
  esit('tansiyonu 95/60', 'tansiyonu doksan beş bölü altmış')
  esit('TA: 110/70', 'tansiyon: yüz on bölü yetmiş')
  esit('2. doz yapıldı', 'ikinci doz yapıldı')
  esit("2'nci doz", 'ikinci doz')
  esit("5'te", 'beşte')
  esit('3x1', 'üç kere bir')
  esit('2x250 mg', 'iki kere iki yüz elli miligram')
  esit('Saat 14:30', 'Saat on dört otuz')
  esit('Saat 09:00', 'Saat dokuz')
  esit('14.30', 'on dört otuz')
})

test('tarih — gün Ay yıl, sözle', () => {
  esit('02.10.2026', 'iki Ekim iki bin yirmi altı')
  esit('30.09.2026 tarihinde.', 'otuz Eylül iki bin yirmi altı tarihinde.')
  esit('Son muayene 15.05.2025.', 'Son muayene on beş Mayıs iki bin yirmi beş.')
  esit('15/05/2025', 'on beş Mayıs iki bin yirmi beş')
  esit('2026-10-02', 'iki Ekim iki bin yirmi altı')
  esit("02.10.2026'da", 'iki Ekim iki bin yirmi altıda')
  esit('01.09.2026–15.09.2026', 'bir Eylül iki bin yirmi altı ile on beş Eylül iki bin yirmi altı')
  assert.equal(tarihOku(1, 1, 2024), 'bir Ocak iki bin yirmi dört')
  assert.equal(tarihOku(32, 1, 2024), null)
  assert.equal(tarihOku(1, 13, 2024), null)
  for (let ay = 1; ay <= 12; ay++) assert.ok(!/\d/.test(tarihOku(15, ay, 2026)!))
})

test('ayrıntı bayrağı — varsayılan kısa doğal biçim, bayrakla tam biçim', () => {
  esit('MCV 74 fL', 'em si vi yetmiş dört femtolitre')
  assert.equal(d('MCV 74 fL'), 'ortalama eritrosit hacmi yetmiş dört femtolitre')
  assert.equal(d('CRP'), 'se reaktif protein')
  assert.equal(d('DaBT-İPA'), 'difteri aselüler boğmaca tetanos ve inaktif polio aşısı')
  // tam biçimi olmayan girdi iki kipte aynı
  assert.equal(d('KPA'), s('KPA'))
  assert.equal(d('13,3 kg'), s('13,3 kg'))
  assert.equal(detayIstegiMi('Aşıları ayrıntılı anlat'), true)
  assert.equal(detayIstegiMi('Kısaltmaların açılımını söyle'), true)
  assert.equal(detayIstegiMi('DETAYLI anlatır mısın'), true)
  assert.equal(detayIstegiMi('Aşıları nasıl?'), false)
})

test('ilaç adı, hasta adı, kimlik değeri dokunulmaz', () => {
  esit('Augmentin BID 400 mg', 'Augmentin BID dört yüz miligram')
  esit('Calpol şurup 5 mL', 'Calpol şurup beş mililitre')
  esit('Amoksisilin-klavulanat', 'Amoksisilin-klavulanat')
  esit('Emircan Karaoğlu, Zeynep Hibe Opak', 'Emircan Karaoğlu, Zeynep Hibe Opak')
  esit('Ventolin, Iburamin Cold, Majezik', 'Ventolin, Iburamin Cold, Majezik')
  // kimlik ve iletişim değerleri
  esit('0532 123 45 67', '0532 123 45 67')
  esit('+90 532 123 45 67', '+90 532 123 45 67')
  esit('veli@ornek.com', 'veli@ornek.com')
  esit('12345678901', '12345678901')
  esit('Protokol no: 48213', 'Protokol no: 48213')
  esit('Dosya no 4821', 'Dosya no 4821')
  esit('ICD kodu J06.9', 'ICD kodu J06.9')
  esit('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000')
  esit('482137', '482137')
  esit('A123', 'A123')
  // çağıranın verdiği ad korunur
  assert.equal(tibbiSeslendir('Dr. KKK 5 kg dedi', { koru: ['Dr. KKK'] }), 'Dr. KKK beş kilogram dedi')
})

test('değişmez — iki kez çalıştırmak hiçbir şeyi değiştirmez', () => {
  const ornekler = [
    'Emircan 12,8 kg, boyu 87,5 cm, ateşi 38,7 °C. DaBT-İPA-Hib 2. doz 30.09.2026 tarihinde yapıldı.',
    "KPA'nın 3. dozu ve KKK planlı; Hb 10,8 g/dL, MCV 74 fL, TDBK yüksek, CRP 3 mg/L.",
    'Amoksisilin 50 mg/kg/gün, 250 mg/5 mL süspansiyon, 3x1, 7–10 gün.',
    'Tansiyon 132/85 mmHg, nabız 110/dk, p97, Z skoru +1,2, BKİ %85.',
    "SB'nin şeması; GİDR'e göre; M-CHAT-R/F; ÜSYE; AOM'dur; BCG'yle; Hib; MenACWY; HepB; varicella.",
    'Protokol no: 48213, 0532 123 45 67, 12345678901, veli@ornek.com',
    '',
    '   ',
    'Merhaba Hocam, bugün nasılsınız?',
  ]
  for (const o of ornekler) {
    for (const detay of [false, true]) {
      const bir = tibbiSeslendir(o, { detay })
      assert.equal(tibbiSeslendir(bir, { detay }), bir, o)
    }
  }
  // sözlüğün her yazımı, iki kipte, ekli ve eksiz
  for (const g of KISALTMA_SOZLUGU) {
    for (const y of g.yazim) {
      for (const detay of [false, true]) {
        for (const metin of [y, `${y} yapıldı`, `${y}'nin değeri`, `${y} ve ${y}`]) {
          const bir = tibbiSeslendir(metin, { detay })
          assert.equal(tibbiSeslendir(bir, { detay }), bir, `${metin} (detay ${detay})`)
          // kısa kipte üretilen metin ayrıntı kipinden de aynen geçer (akış ortasında kip değişirse)
          assert.equal(seslendirilmemisler(bir).length, 0, `${metin} → ${bir}`)
        }
      }
    }
  }
})

test('sözlük verisi — okunuşta rakam ya da birim simgesi yok, her girdinin kaynağı var', () => {
  const anahtarlar = new Map<string, string>()
  for (const g of KISALTMA_SOZLUGU) {
    assert.ok(['sartname', 'talimat', 'taslak'].includes(g.kaynak))
    for (const o of [g.kisa, g.detay]) {
      if (!o) continue
      assert.ok(o.soz.trim() && !/[\d%°µμ/]/.test(`${o.soz} ${o.ad || ''}`), `${g.yazim[0]}: "${o.soz}"`)
    }
    for (const y of g.yazim) {
      const a = y.replace(/İ/g, 'I')
      assert.ok(!anahtarlar.has(a), `iki girdide aynı yazım: ${y} (${anahtarlar.get(a)})`)
      anahtarlar.set(a, g.yazim[0])
      assert.ok(sozlukteVarMi(y), y)
      assert.notEqual(s(`${y} 5`), `${y} 5`, `${y} hiç çevrilmedi`)
    }
  }
  for (const b of [...BIRIM_SOZLUGU, ...PAYDA_SOZLUGU]) {
    assert.ok(b.soz.trim() && !/[\d%°µμ/]/.test(b.soz), b.soz)
    assert.ok(['sartname', 'talimat', 'taslak'].includes(b.kaynak))
  }
  for (const b of BIRIM_SOZLUGU) for (const y of b.yazim) assert.equal(s(`5 ${y}`), `beş ${b.soz}`, y)
  // şartnameden gelen girdiler: tam olarak alınan yedi örnek
  assert.deepEqual(KISALTMA_SOZLUGU.filter((g) => g.kaynak === 'sartname').map((g) => g.yazim[0]), ['DTaP', 'DaBT', 'DaBT-İPA-Hib', 'KPA', 'KKK', 'OPA', 'BCG'])
})

test('seslendirilmemişler — katmanın çıktısında kısaltma ya da birim kalmaz', () => {
  assert.deepEqual(seslendirilmemisler(s('KPA 2. doz, 12,8 kg, 38,7 °C, %50, Hb 11 g/dL, BCG, Hib.')), [])
  assert.deepEqual(seslendirilmemisler('KPA yapıldı'), ['KPA'])
  assert.deepEqual(seslendirilmemisler('on iki kg'), ['kg'])
  assert.deepEqual(seslendirilmemisler('otuz sekiz °C'), ['°', '°C'])
  assert.deepEqual(seslendirilmemisler('doz mg olarak'), ['mg'])
  assert.deepEqual(seslendirilmemisler('yüzde elli, BCG aşısı, Hib aşısı, influenza'), [])
  assert.deepEqual(seslendirilmemisler('5 g'), ['5 g'])
})

test('geliştirme aracı — seslendirme metninde kalan bilinmeyen büyük harfli belirteçler', () => {
  const kalan = bilinmeyenKisaltmalar([
    s('PDA kapalı, KPA yapıldı. PDA izlemde.'),
    s('BCG ve Hib tamam; TdaP planlı, VSD yok.'),
    s('Emircan Karaoğlu 12,8 kg [break] HIB'),
  ])
  assert.deepEqual(kalan.map((k) => [k.yazi, k.tur, k.adet]), [['PDA', 'buyuk', 2], ['VSD', 'buyuk', 1]])
  assert.match(kalan[0].ornek, /PDA kapalı/)
  // katman çalışmamış metinde sözlükteki kısaltma bilinmeyen sayılmaz: o, "seslendirilmemişler"in işidir
  assert.deepEqual(bilinmeyenKisaltmalar(['KPA yapıldı']), [])
  assert.deepEqual(bilinmeyenKisaltmalar(['McDonald ve HbF']).map((k) => [k.yazi, k.tur]), [['HbF', 'karma'], ['McDonald', 'karma']])
})

test('geliştirme aracı üretim yolunda değil: uygulama kodu onu içe aktarmaz', () => {
  const kok = process.cwd()
  const ihlal: string[] = []
  const gez = (dizin: string) => {
    for (const d of fs.readdirSync(dizin, { withFileTypes: true })) {
      if (d.name === 'node_modules' || d.name.startsWith('.')) continue
      const yol = path.join(dizin, d.name)
      if (d.isDirectory()) { gez(yol); continue }
      if (!/\.(?:ts|tsx|mts|mjs)$/.test(d.name) || /\.test\.ts$/.test(d.name)) continue
      if (fs.readFileSync(yol, 'utf8').includes('gelistirme/bilinmeyenKisaltma')) ihlal.push(path.relative(kok, yol))
    }
  }
  for (const d of ['app', 'components', 'lib', 'core', 'specialties']) if (fs.existsSync(path.join(kok, d))) gez(path.join(kok, d))
  assert.deepEqual(ihlal, [])
})

test('gerçekçi cümle — hekim hekime konuşur gibi', () => {
  esit(
    'Emircan 24 aylık muayenesinde 12,8 kg, boyu 87,5 cm. DaBT-İPA-Hib rapeli ve KPA 02.10.2026 tarihinde yapıldı; Hb 11,8 g/dL.',
    'Emircan yirmi dört aylık muayenesinde on iki virgül sekiz kilogram, boyu seksen yedi virgül beş santimetre. beşli karma aşı rapeli ve konjuge pnömokok aşısı iki Ekim iki bin yirmi altı tarihinde yapıldı; hemoglobin on bir virgül sekiz gram desilitre.',
  )
  esit(
    'Amoksisilin 50 mg/kg/gün, 2 doza bölünerek 7–10 gün.',
    'Amoksisilin günde kilogram başına elli miligram, iki doza bölünerek yedi ile on gün.',
  )
})
