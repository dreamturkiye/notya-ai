/**
 * NOTYA-SUT-RAPOR-01 — the e-Reçete Asistanı hints that name a SUT rule, against the official text.
 * Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali. Base tool: the hints are the same for every specialty.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { medulaTaslagiHazirla } from './receteHazirla'

const taslak = (ilac_adi: string, etken_madde: string, kullanim_sikli = '1x1') =>
  medulaTaslagiHazirla({
    ilaclar: [{ ilac_adi, etken_madde, kullanim_sikli }],
    tanilar: [{ code: 'J45.9', description: 'Astım', is_primary: true }],
    hasta: { ad: 'QA', soyad: 'Test', dogumTarihi: '1980-01-01' },
    doktor: { ad: 'QA', soyad: 'Hekim', bransKodu: 1 },
    protokolNo: 'T-1',
    receteTarihi: new Date('2026-10-10T09:00:00Z'),
  }).uyarilar.join('\n')

test('SUT 4.2.24.A(2): montelukast ipucu reçete edebilen uzmanlıkları ve rapor yolunu söyler; EK-4/F demez', () => {
  const u = taslak('Singulair 10 mg', 'montelukast')
  assert.match(u, /SUT 4\.2\.24\.A/)
  assert.match(u, /iç hastalıkları, çocuk sağlığı ve hastalıkları, göğüs hastalıkları ve alerji uzman hekimlerince/)
  assert.match(u, /uzman hekim raporuyla/)
  assert.doesNotMatch(u, /EK-4\/F/)
  assert.doesNotMatch(u, /uzun süreli kullanımda/)
})

test('SUT 4.2.24.A(11) / 4.2.24.B(13): nebül formu raporsuz en fazla 1 kutu; "ayda birden fazla kutu açıklama" kuralı yazılmaz', () => {
  const u = taslak('Pulmicort nebül', 'budesonid', '2x1')
  assert.match(u, /SUT 4\.2\.24/)
  assert.match(u, /raporsuz en fazla 1 kutu/)
  assert.match(u, /uzman hekim raporu gerekir/)
  assert.doesNotMatch(u, /ayda birden fazla kutu/)
  assert.doesNotMatch(u, /açıklama ister/)
})

/**
 * NOTYA-SUT-RAPOR-01 (2026-10-10, second set) — hints that said "SUT" where the text is silent.
 * Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 */
test('antibiyotik 14 günü aşınca: metinde böyle bir kural yok — ipucu süreyi söyler, "SUT açıklama ister" demez', () => {
  const u = taslak('Largopen 1 g', 'amoksisilin', '2x1 21 gün')
  assert.match(u, /Antibiyotik süresi 14 günü aşıyor\./)
  assert.doesNotMatch(u, /SUT açıklama ister/)
  assert.doesNotMatch(u, /SUT/)
  // SUT 4.1.1(2): tanı zorunluluğu hatırlatması olağan sürede yerinde durur.
  assert.match(taslak('Largopen 1 g', 'amoksisilin', '2x1 7 gün'), /SUT gereği reçetede ICD-10 tanı zorunlu/)
})

test('PPİ 8 haftayı aşınca (SUT EK-4/E 13/6 dışında kural yok): ipucu süreyi söyler, "SUT rapor ister" demez', () => {
  const u = taslak('Pantpas 40 mg', 'pantoprazol', '1x1 90 gün')
  assert.match(u, /PPİ kullanım süresi 8 haftayı aşıyor\./)
  assert.doesNotMatch(u, /rapor ister/)
  assert.doesNotMatch(u, /SUT/)
  assert.equal(taslak('Pantpas 40 mg', 'pantoprazol', '1x1 28 gün'), '')
})

test('SUT EK-4/E 13/31: kolekalsiferol mono preparatı yalnızca ruhsatlı endikasyonlarında ödenir; 0-1 yaş / 25-OH-D açıklaması kuralı yazılmaz', () => {
  const u = taslak('Devit-3 damla', 'kolekalsiferol', '1x3 damla')
  assert.match(u, /SUT EK-4\/E 13\/31/)
  assert.match(u, /mono preparatları yalnızca ruhsatlı endikasyonlarında reçete edildiğinde ödenir/)
  assert.doesNotMatch(u, /0-1 yaş|profilaksi|25-OH/)
  // Kalsiyum kombinasyonu mono preparat değildir: ipucu çıkmaz.
  assert.equal(taslak('Cal-D-Vita', 'kalsiyum karbonat + kolekalsiferol', '1x1'), '')
})

test('SUT 4.2.41: demir ipucu yalnız parenteral formda çıkar ve maddeyi gösterir; oral demirde metin sessiz — ipucu yok', () => {
  assert.equal(taslak('Ferro Sanol Duodenal kapsül', 'demir (II) glisin sülfat', '1x1'), '')
  const u = taslak('Ferinject 500 mg flakon', 'demir karboksimaltoz', 'tek doz')
  assert.match(u, /Parenteral demir \(SUT 4\.2\.41\)/)
  assert.match(u, /bu durumun belirtildiği rapora dayanılarak ödenir/)
  assert.doesNotMatch(u, /hemogram|ferritin/)
})

test('SUT 4.1.4: "3 kutuyu aşan miktar" diye bir kural yok — hiçbir ipucu kutu sayısına SUT kuralı bağlamaz', () => {
  const kaynak = readFileSync(new URL('./receteHazirla.ts', import.meta.url), 'utf8')
  const kurallar = kaynak.slice(kaynak.indexOf('const KURALLAR'), kaynak.indexOf('function yasAyHesapla'))
  const metinler = kurallar.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
  assert.doesNotMatch(metinler, /3 kutuyu aşan/)
  assert.doesNotMatch(metinler, /SUT rapor ister|SUT açıklama ister|SUT’ta açıklama/)
})

test('ipuçları branşa göre değişmez: aynı ilaç, farklı branş kodu, aynı metin', () => {
  const brans = (bransKodu: number) =>
    medulaTaslagiHazirla({
      ilaclar: [{ ilac_adi: 'Singulair 10 mg', etken_madde: 'montelukast', kullanim_sikli: '1x1' }],
      tanilar: [{ code: 'J45.9', is_primary: true }],
      hasta: { ad: 'QA', soyad: 'Test' },
      doktor: { ad: 'QA', soyad: 'Hekim', bransKodu },
      protokolNo: 'T-2',
    }).uyarilar
  assert.deepEqual(brans(1), brans(42))
})
