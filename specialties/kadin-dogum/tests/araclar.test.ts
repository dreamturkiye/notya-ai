/**
 * Araçlar › Kadın Doğum stüdyoları — saf motor testleri (engines/araclar.ts) + UI kilitleri.
 * Sentetik tarihler; gerçek hasta yok.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  sayiOku, tarihOku, haftaOku, eddHesapla, gebelikTakvimi, takvimHastaMetni, analikIzni, istirahatRaporuTaslagi,
  RAPORSUZ_ISTIRAHAT_UYARISI, EMZIRME_ODENEGI_NOTU, ANALIK, aspirinProfilaksisi, gdmDegerlendir, vbacTartisma, robsonGrubu,
  csNotEksikleri, csNotMetni, CS_ENDIKASYONLARI, type CsNotGirdi,
} from '../engines/araclar'
import { addDays } from '../engines/dates'
import { TEST_WINDOWS } from '../engines/test-windows'

const KOK = path.join(import.meta.dirname, '../../..')

test('forgiving input: comma decimals, Turkish date formats, "12 hafta 2 gün"', () => {
  assert.equal(sayiOku('45,2'), 45.2)
  assert.equal(sayiOku('45,2 mm'), 45.2)
  assert.equal(sayiOku(''), null)
  assert.equal(tarihOku('12.03.2026'), '2026-03-12')
  assert.equal(tarihOku('12/3/26'), '2026-03-12')
  assert.equal(tarihOku('2026-03-12'), '2026-03-12')
  assert.equal(tarihOku('12 Mart 2026'), '2026-03-12')
  assert.equal(tarihOku('1 şubat 2026'), '2026-02-01')
  assert.equal(tarihOku('31.02.2026'), null, 'impossible date rejected')
  assert.equal(tarihOku('abc'), null)
  for (const [ham, t] of [['12+2', 86], ['12 hafta 2 gün', 86], ['12hf 2g', 86], ['12w2d', 86], ['12', 84], ['12 hafta', 84], ['8+3', 59]] as const) {
    assert.equal(haftaOku(ham)?.totalDays, t, ham)
  }
  assert.equal(haftaOku('12+9'), null)
  assert.equal(haftaOku('hafta'), null)
})

test('EDD: SAT (Naegele), USG haftası, CRL (Robinson) and known TDT; honest errors', () => {
  const sat = eddHesapla({ yontem: 'sat', sat: '2026-03-01' })
  assert.ok(sat.ok && sat.edd === '2026-12-06')
  const usg = eddHesapla({ yontem: 'usg_hafta', usgTarih: '2026-04-01', usgHafta: haftaOku('8+3') })
  assert.ok(usg.ok && usg.edd === addDays('2026-04-01', 280 - 59))
  const crl = eddHesapla({ yontem: 'usg_crl', usgTarih: '2026-04-01', crlMm: 45 })
  assert.ok(crl.ok)
  const buyuk = eddHesapla({ yontem: 'usg_crl', usgTarih: '2026-04-01', crlMm: 120 })
  assert.ok(!buyuk.ok && /birinci trimester/.test(buyuk.hata))
  const bos = eddHesapla({ yontem: 'sat' })
  assert.ok(!bos.ok && /Son adet/.test(bos.hata))
})

test('takvim: ikili "kapanmak üzere" at 13+2 dominates; windows come from TEST_WINDOWS; missed ikili offers alternative', () => {
  const edd = '2026-12-06'; const lmp = addDays(edd, -280)
  const t = gebelikTakvimi({ edd, yontemAd: 'SAT', bugun: addDays(lmp, 13 * 7 + 2) })
  assert.equal(t.gaMetin, '13 hafta 2 gün')
  const ikili = t.taramalar.find((x) => x.id === 'ikili_nt')!
  assert.equal(ikili.durum, 'kapaniyor')
  assert.equal(ikili.kalanGun, 4)
  assert.equal(ikili.kapanis, addDays(lmp, 13 * 7 + 6))
  assert.ok(t.kapaniyor.some((x) => x.id === 'ikili_nt'), 'closing ikili is in the dominant banner list')
  const win = TEST_WINDOWS.find((w) => w.id === 'ikili_nt')!
  assert.equal(ikili.pencereHafta, `${win.open}–${win.close} hf`)
  // 14+0: kaçırıldı, alternatif (dogum-spine kacirilinca)
  const t2 = gebelikTakvimi({ edd, yontemAd: 'SAT', bugun: addDays(lmp, 14 * 7) })
  const k = t2.taramalar.find((x) => x.id === 'ikili_nt')!
  assert.equal(k.durum, 'kacirildi')
  assert.match(k.kacirilinca || '', /üçlü\/dörtlü|NIPT/)
  // yapıldı işaretlenince bayrak kalkar
  const t3 = gebelikTakvimi({ edd, yontemAd: 'SAT', bugun: addDays(lmp, 13 * 7 + 2), yapilanlar: ['ikili_nt'] })
  assert.equal(t3.taramalar.find((x) => x.id === 'ikili_nt')!.durum, 'yapildi')
  assert.equal(t3.kapaniyor.length, t3.kapaniyor.filter((x) => x.id !== 'ikili_nt').length)
})

test('takvim: Anti-D row hidden only for known Rh(+); DÖBYR 4 izlem, late booker keeps izlem 1; dual columns never collapsed', () => {
  const edd = '2026-12-06'; const lmp = addDays(edd, -280)
  const bugun = addDays(lmp, 30 * 7)
  assert.ok(!gebelikTakvimi({ edd, yontemAd: 'x', bugun, rhNegatif: false }).taramalar.some((x) => x.id === 'anti_d_28'))
  const rhBilinmiyor = gebelikTakvimi({ edd, yontemAd: 'x', bugun, rhNegatif: null }).taramalar.find((x) => x.id === 'anti_d_28')!
  assert.match(rhBilinmiyor.not || '', /Rh bilinmiyor/)
  const t = gebelikTakvimi({ edd, yontemAd: 'x', bugun, izlemHaftalari: [26] })
  assert.equal(t.izlemler.length, 4)
  assert.equal(t.izlemler[0].durum, 'yapildi', 'first record counts as izlem 1 (late booking)')
  assert.equal(t.izlemler[1].durum, 'kacirildi')
  assert.equal(t.izlemler[2].durum, 'acik')
  assert.ok(t.cift.length >= 4)
  for (const c of t.cift) { assert.ok(c.sb && c.klinik && c.sb !== c.klinik); assert.equal(c.uiHint, 'yasal asgari vs klinik öneri') }
  assert.ok(t.cift.every((c) => !/ACOG/.test(c.sb)), 'ACOG never in the yasal column')
  assert.equal(t.analikRaporuBaslangic.tekil, addDays(edd, -56))
  assert.equal(t.analikRaporuBaslangic.cogul, addDays(edd, -70))
  const metin = takvimHastaMetni(t)
  assert.match(metin, /112/)
})

test('analık: 7578 s.K. — tekil 8+16 hafta (168 gün), çoğul 10+16 (182 gün)', () => {
  assert.deepEqual([ANALIK.dogumOncesiHafta, ANALIK.cogulEkHafta, ANALIK.dogumSonrasiHafta], [8, 2, 16])
  const tek = analikIzni({ edd: '2026-12-06', cogul: false, bugun: '2026-09-18' })
  assert.equal(tek.raporBaslangic, addDays('2026-12-06', -56))
  assert.equal(tek.raporBaslangicHafta, '32+0')
  assert.equal(tek.sonrasiGun, 112)
  assert.equal(tek.toplamGun, 168)
  const cok = analikIzni({ edd: '2026-12-06', cogul: true, bugun: '2026-09-18' })
  assert.equal(cok.raporBaslangicHafta, '30+0')
  assert.equal(cok.toplamGun, 182)
})

test('analık: erken doğum → kullanılamayan günler doğum sonrasına; geç doğum → öncesi uzar, sonrası kısalmaz; çalışma izni eklenir', () => {
  const edd = '2026-12-06'
  const erken = analikIzni({ edd, cogul: false, dogumTarihi: addDays(edd, -20), bugun: '2026-12-01' })
  assert.equal(erken.sapma, 'erken')
  assert.equal(erken.kullanilanOncesiGun, 36)
  assert.equal(erken.sonrasiEklenenGun, 20)
  assert.equal(erken.sonrasiGun, 132)
  assert.equal(erken.toplamGun, 168, 'total preserved on early birth')
  // erken doğum rapor başlamadan: tüm öncesi doğum sonrasına
  const cokErken = analikIzni({ edd, cogul: false, dogumTarihi: addDays(edd, -70), bugun: '2026-10-01' })
  assert.equal(cokErken.kullanilanOncesiGun, 0)
  assert.equal(cokErken.sonrasiGun, 112 + 56)
  const gec = analikIzni({ edd, cogul: false, dogumTarihi: addDays(edd, 9), bugun: '2026-12-20' })
  assert.equal(gec.sapma, 'gec')
  assert.equal(gec.kullanilanOncesiGun, 65)
  assert.equal(gec.sonrasiGun, 112)
  assert.equal(gec.toplamGun, 177)
  const calis = analikIzni({ edd, cogul: false, calismaGun: 99, bugun: '2026-09-18' })
  assert.equal(calis.calismaGun, 42, 'clamped: rest starts at least 2 weeks before EDD')
  assert.equal(calis.raporBaslangic, addDays(edd, -14))
  assert.equal(calis.sonrasiGun, 112 + 42)
  const taslak = istirahatRaporuTaslagi(tek(), { cogul: false, eddYontemi: 'TDT' })
  assert.match(taslak, /TASLAK/)
  assert.match(taslak, /7578/)
  assert.doesNotMatch(taslak, /T\.C\. \d|\b\d{11}\b/, 'no TC kimlik in draft')
  function tek() { return analikIzni({ edd, cogul: false, bugun: '2026-09-18' }) }
})

test('analık: the "no report → no payment" warning and emzirme note carry the verified rules', () => {
  assert.match(RAPORSUZ_ISTIRAHAT_UYARISI, /rapor.*almadan/i)
  assert.match(RAPORSUZ_ISTIRAHAT_UYARISI, /ÖDENMEZ/)
  assert.match(EMZIRME_ODENEGI_NOTU, /120 gün/)
  assert.match(EMZIRME_ODENEGI_NOTU, /90 gün/)
  assert.doesNotMatch(EMZIRME_ODENEGI_NOTU, /\d+[.,]?\d*\s*(TL|₺)/, 'no invented amount')
})

test('aspirin: ≥1 yüksek veya >1 orta → önerilir; pencere 12–28 hf, 16 hf öncesi ideal; kapanıyor uyarısı', () => {
  const edd = '2026-12-06'; const lmp = addDays(edd, -280)
  assert.equal(aspirinProfilaksisi({ secili: ['kronik_ht'], edd, bugun: addDays(lmp, 10 * 7) }).karar, 'onerilir')
  assert.equal(aspirinProfilaksisi({ secili: ['nullipar', 'yas35'], edd, bugun: addDays(lmp, 10 * 7) }).karar, 'onerilir')
  assert.equal(aspirinProfilaksisi({ secili: ['nullipar'], edd, bugun: addDays(lmp, 10 * 7) }).karar, 'tek_orta')
  assert.equal(aspirinProfilaksisi({ secili: ['dusuk_gelir'], edd, bugun: addDays(lmp, 10 * 7) }).karar, 'dusunulebilir')
  assert.equal(aspirinProfilaksisi({ secili: [], edd, bugun: addDays(lmp, 10 * 7) }).karar, 'yok')
  const p = (hafta: number) => aspirinProfilaksisi({ secili: ['onceki_pe'], edd, bugun: addDays(lmp, hafta) }).pencere
  assert.equal(p(11 * 7), 'henuz')
  assert.equal(p(12 * 7), 'ideal')
  assert.equal(p(15 * 7), 'ideal_kapaniyor')
  assert.equal(p(20 * 7), 'gec')
  assert.equal(p(29 * 7), 'kapandi')
  const a = aspirinProfilaksisi({ secili: ['onceki_pe'], edd: null, bugun: '2026-09-18' })
  assert.equal(a.pencere, 'bilinmiyor')
  assert.match(a.cift.sb, /hekim kilitler/)
  assert.doesNotMatch(JSON.stringify(aspirinProfilaksisi({ secili: ['onceki_pe'], edd, bugun: addDays(lmp, 13 * 7) })), /\d+\s*mg/i, 'no dose')
})

test('GDM preset + SSVD tartışma: klasik/T veya rüptür engel, kısa aralık dikkat, eksik alanlar listelenir', () => {
  assert.match(gdmDegerlendir({ secili: [], edd: null, bugun: '2026-09-18' }).metin, /24–28/)
  assert.match(gdmDegerlendir({ secili: ['onceki_gdm'], edd: null, bugun: '2026-09-18' }).metin, /hekim kilitler/)
  const base = { oncekiSezaryen: 1, kesiTipi: 'alt_transvers' as const, sonSezaryenAy: 30, oncekiVajinal: true, oncekiRuptur: false, kaviteMyomektomi: false, previaAkreta: false, prezentasyon: 'bas' as const, tercih: 'ssvd' as const }
  const iyi = vbacTartisma(base)
  assert.equal(iyi.engel.length, 0)
  assert.ok(iyi.lehte.length >= 2)
  assert.ok(vbacTartisma({ ...base, kesiTipi: 'klasik_t' }).engel.length === 1)
  assert.ok(vbacTartisma({ ...base, sonSezaryenAy: 12 }).dikkat.some((x) => /12 ay/.test(x)))
  assert.ok(vbacTartisma({ ...base, kesiTipi: 'bilinmiyor', tercih: '' }).eksik.length === 2)
})

test('Robson (WHO) on grup türetimi', () => {
  const r = (g: Partial<Parameters<typeof robsonGrubu>[0]>) => robsonGrubu({ parite: 'nullipar', oncekiCs: false, fetus: 'tekil', prezentasyon: 'bas', hafta: 39, eylem: 'spontan', ...g })
  assert.equal(r({}).grup, 1)
  assert.deepEqual([r({ eylem: 'induksiyon' }).grup, r({ eylem: 'induksiyon' }).alt], [2, 'a'])
  assert.deepEqual([r({ eylem: 'eylem_oncesi_cs' }).grup, r({ eylem: 'eylem_oncesi_cs' }).alt], [2, 'b'])
  assert.equal(r({ parite: 'multipar' }).grup, 3)
  assert.equal(r({ parite: 'multipar', eylem: 'induksiyon' }).grup, 4)
  assert.equal(r({ parite: 'multipar', oncekiCs: true }).grup, 5)
  assert.equal(r({ prezentasyon: 'makat' }).grup, 6)
  assert.equal(r({ parite: 'multipar', prezentasyon: 'makat' }).grup, 7)
  assert.equal(r({ fetus: 'cogul' }).grup, 8)
  assert.equal(r({ prezentasyon: 'transvers' }).grup, 9)
  assert.equal(r({ hafta: 34 }).grup, 10)
  assert.equal(r({ hafta: null }).grup, null)
})

test('C/S endikasyon notu: hiçbir endikasyon önceden seçilmez; kilit için savunulabilir kayıt gerekir', () => {
  const bos: CsNotGirdi = { endikasyonlar: [], digerAciklama: '', aciliyet: '', kararZamani: '', bulgular: '', hafta: '', alternatiflerKonusuldu: false, onamAlindi: false, anneIstegiBelgelendi: false, robson: { grup: null, tanim: '' } }
  const e = csNotEksikleri(bos)
  assert.ok(e.some((x) => /endikasyonu siz seçin/.test(x)))
  assert.ok(e.length >= 5)
  const tam: CsNotGirdi = { ...bos, endikasyonlar: [CS_ENDIKASYONLARI[0]], aciliyet: 'acil', kararZamani: '2026-09-18T14:20', bulgular: 'KTG kategori III 14:05ten beri', alternatiflerKonusuldu: true, robson: { grup: 1, tanim: 'Nullipar' } }
  assert.deepEqual(csNotEksikleri(tam), [])
  assert.match(csNotMetni(tam), /hekim tarafından seçildi ve kilitlendi/)
  assert.deepEqual(csNotEksikleri({ ...tam, endikasyonlar: ['Diğer (açıklayınız)'] }), ['"Diğer" endikasyonu açıklayın.'])
  const anne = CS_ENDIKASYONLARI.find((x) => x.startsWith('Anne isteği'))!
  assert.ok(csNotEksikleri({ ...tam, endikasyonlar: [anne] }).some((x) => /39\+/.test(x)))
  // UI never initialises a selected indication
  const ui = fs.readFileSync(path.join(KOK, 'specialties/kadin-dogum/ui/araclar/RiskAraci.tsx'), 'utf8')
  assert.match(ui, /useState<string\[\]>\(\[\]\);\n\s*const \[aciliyet/)
  assert.doesNotMatch(ui, /\d+\s*mg/i)
})

test('MEC UI: engine reused, never re-implemented; no product/dose rendered', () => {
  const ui = fs.readFileSync(path.join(KOK, 'specialties/kadin-dogum/ui/araclar/MecAraci.tsx'), 'utf8')
  assert.match(ui, /from '\.\.\/\.\.\/engines\/kontrasepsiyon-mec'/)
  assert.doesNotMatch(ui, /function yontemMec|function acilKontrasepsiyon/)
  assert.doesNotMatch(ui, /\{s\.ad\}/, 'acil option names from the engine carry doses — UI shows catalogue names')
  assert.doesNotMatch(ui, /\d+(,\d+)?\s*mg/i)
})

test('commercial copy: no engineering jargon in doctor-facing KD tool strings', () => {
  const dosyalar = ['engines/araclar.ts', 'ui/araclar/KdAracKabugu.tsx', 'ui/araclar/GebelikTakvimAraci.tsx', 'ui/araclar/DogumRaporAraci.tsx', 'ui/araclar/MecAraci.tsx', 'ui/araclar/RiskAraci.tsx']
  for (const d of dosyalar) {
    const kod = fs.readFileSync(path.join(KOK, 'specialties/kadin-dogum', d), 'utf8').split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*\*)/.test(l)).join('\n')
    assert.doesNotMatch(kod, /\brepo(da|su)?\b|sprint|Gökhan|Gokhan|audit|\.html/i, d)
  }
})
