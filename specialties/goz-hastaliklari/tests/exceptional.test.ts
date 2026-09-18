/**
 * GOZ-EXCEPTIONAL-01 — göz-only Araçlar motorları + chapter derinlik motorları. Sentetik veri; tanı / doz / GİL gücü üretilmez.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { gozKohortSatiri, gozKohortSatirlari, gozHatirlatmaMesaji, GOZ_BAYRAK_AD } from '../engines/kohort'
import { vaSatiri, vaKarsilastir, gilKodAra } from '../engines/araclar'
import { biyometriNormalize, biyometriMetni, biyometriTamMi, postopNormalize, postopUyarilari, postopMetni } from '../engines/katarakt'
import { gozSgkTaslak, gozSgkMetni } from '../engines/sgkRapor'
import { sgkKapilari } from '../engines/antiVegf'
import { refraksiyonNormalize, refraksiyonMetni, biyoNormalize, biyoMetni, normalBiyoGoz, keratokonusNormalize, olcumNotaMetni, seritNotaMetni } from '../engines/muayene'
import { GLOKOM_ARALIK_ONERILERI, GLOKOM_ONERI_ETIKETI, glokomMetaNormalize, glokomMetaMetni } from '../engines/glokom'
import { fundusDrGecisi, lazerDogrula, lazerNotaMetni } from '../engines/dr'
import { ivtKontrolDogrula, IVT_KONTROL } from '../engines/antiVegf'
import { pmaHesapla, ropDogrula, ropTaramaEndikasyonu, pediatrikGorunum } from '../engines/rop'
import { acilTara, intakeAcilKodlari, yikamaDakika, ACIL_EYLEM_LISTESI, ACIL_KODLARI } from '../engines/acil'
import { intakeSubjektif, gozSeridi } from '../engines/serit'
import { fundusNormalize, normalFundusGoz } from '../engines/fundus'
import { GOZ_KAYNAKLAR } from '../protocols/sources'
import { GOZ_PROFILE } from '../../../lib/specialties/goz-hastaliklari'
import { BRANS_SORULARI } from '../../../lib/intake/bransSorulari'

const T = '2026-09-18'
const bos = { gorevler: [], planliIvt: [], drSonrakiKontrol: null, planliKontroller: [], sonVizit: null, portalVar: true }

describe('göz kohort (Araçlar › Göz kohort paneli)', () => {
  it('flags geciken GA/OCT, IVT window + overdue, DR tarama, kontrol — each from hekim data only', () => {
    const s = gozKohortSatiri({ ...bos, patientId: 'p1', ad: 'QA Sentetik', gorevler: [{ kod: 'glokom_ga', due: '2026-08-01' }, { kod: 'glokom_oct', due: '2026-12-01' }, { kod: 'dr_tarama', due: T }], planliIvt: [{ tarih: '2026-09-10', goz: 'sag' }, { tarih: '2026-09-25', goz: 'sol' }, { tarih: '2026-11-01', goz: 'sol' }], planliKontroller: [{ tarih: '2026-09-01', neden: 'Glokom kontrolü' }] }, T)
    assert.deepEqual(s.bayraklar, ['ga_oct_gecikti', 'ivt_gecikti', 'ivt_penceresi', 'dr_tarama', 'kontrol_gecikti'])
    assert.equal(s.enErkenTarih, '2026-08-01')
    assert.ok(s.detay.some((d) => d.includes('IVT OD 2026-09-10')))
    assert.ok(!s.detay.some((d) => d.includes('2026-11-01')), 'IVT beyond the 14-day window is not listed')
    assert.ok(!s.detay.some((d) => d.includes('OCT')), 'OCT not yet due is not flagged')
  })
  it('DR kontrol date passed → dr_tarama; nothing due → no row', () => {
    assert.deepEqual(gozKohortSatiri({ ...bos, patientId: 'p', ad: 'a', drSonrakiKontrol: '2026-09-01' }, T).bayraklar, ['dr_tarama'])
    assert.equal(gozKohortSatirlari([{ ...bos, patientId: 'p', ad: 'a', drSonrakiKontrol: '2027-01-01', planliKontroller: [{ tarih: '2026-10-01', neden: 'x' }] }], T).length, 0)
  })
  it('sorted oldest overdue first', () => {
    const r = gozKohortSatirlari([
      { ...bos, patientId: 'b', ad: 'B', planliKontroller: [{ tarih: '2026-09-15', neden: 'k' }] },
      { ...bos, patientId: 'a', ad: 'A', planliKontroller: [{ tarih: '2026-07-15', neden: 'k' }] },
    ], T)
    assert.deepEqual(r.map((x) => x.patientId), ['a', 'b'])
  })
  it('recall message is patient-safe: no diagnosis, values, drugs; carries 112 redirect', () => {
    for (const b of Object.keys(GOZ_BAYRAK_AD) as Array<keyof typeof GOZ_BAYRAK_AD>) {
      const m = gozHatirlatmaMesaji([b])
      assert.equal(m.konu, 'Göz kontrol hatırlatması')
      assert.match(m.metin, /112/)
      assert.doesNotMatch(m.metin, /glokom|retinopati|DR |evre|mmHg|µm|logMAR|bevacizumab|ranibizumab|aflibersept|tanı|makula ödemi/i)
    }
  })
})

describe('VA / logMAR studio helpers', () => {
  it('decimal, Snellen and letters Δ via engines/va', () => {
    assert.deepEqual([vaSatiri('0,5').ondalik, vaSatiri('0,5').logmar], ['0,50', '0,30'])
    assert.equal(vaSatiri('6/12').logmar, '0,30')
    assert.equal(vaSatiri('20/40').ondalik, '0,50')
    assert.equal(vaKarsilastir('0,5', '1,0').harf, 15)
    assert.equal(vaKarsilastir('1,0', '0,5').harf, -15)
  })
  it('PS / EH / IH / IHY are not numeric — no logMAR, no Δ, explicit note', () => {
    for (const x of ['PS 1m', 'EH', 'IH', 'IHY']) { const s = vaSatiri(x); assert.equal(s.logmar, null, x); assert.equal(s.hata, null, x) }
    const k = vaKarsilastir('PS 1m', '0,1')
    assert.equal(k.harf, null); assert.match(k.not!, /hekim yorumlar/)
    assert.match(vaSatiri('abc').hata!, /Okunamadı/)
  })
  it('GİL EK-3/G search: code or Turkish name, no price field anywhere', () => {
    assert.deepEqual(gilKodAra('torik').map((k) => k.kod), ['G10110'])
    assert.deepEqual(gilKodAra('G10090').map((k) => k.kod), ['G10090'])
    assert.equal(gilKodAra('').length, 5)
    assert.doesNotMatch(JSON.stringify(gilKodAra('')), /TL|₺|fiyat:|\d+,\d{2} ?TL/)
  })
})

describe('Katarakt: biyometri stored, IOL power never computed; post-op card', () => {
  it('biyometri normalizes Turkish decimals, rejects out-of-range typos, outputs no power', () => {
    const { biyometri, hatalar } = biyometriNormalize({ alMm: '23,45', k1D: '43,25', k2D: '44,00', kAks: '90', aSabiti: '118,9', cihaz: 'Optik biyometre', tarih: '2026-09-10' })
    assert.equal(hatalar.length, 0)
    assert.equal(biyometri.alMm, 23.45)
    assert.ok(biyometriTamMi(biyometri))
    const m = biyometriMetni(biyometri, 'Sağ göz')
    assert.match(m, /AL 23,45 mm/)
    assert.doesNotMatch(m, /güç(ü)? [+-]?\d|power|\+\d+(,\d+)? ?D\b|SRK|Barrett|Haigis|Hoffer/i)
    assert.ok(biyometriNormalize({ alMm: '234' }).hatalar[0].includes('aralığı'))
    assert.ok(biyometriNormalize({ k1D: 'x' }).hatalar[0].includes('sayı değil'))
  })
  it('post-op endoftalmi flag is the hekim\'s — turns into same-day alert, no thresholds invented', () => {
    const g1 = postopNormalize({ tarih: '2026-09-11', va: '0,3', gib: '18', kornea: 'hafif ödem', endoftalmiBayrak: true })
    const u = postopUyarilari({ gun1: g1 })
    assert.equal(u.acil.length, 1); assert.match(u.acil[0], /aynı gün/)
    assert.equal(postopUyarilari({ gun1: postopNormalize({ gib: '45' }) }).acil.length, 0, 'no IOP threshold invented')
    assert.match(postopMetni('gun1', g1, 'Sağ göz'), /ENDOFTALMİ ŞÜPHESİ \(hekim\)/)
  })
  it('GİL draft mirrors anti-VEGF quality: mandatory items, eksikler, EK-3/G code, Medula = hekim', () => {
    const eksik = gozSgkTaslak({ sablon: 'katarakt_gil', hasta: { adSoyad: '' }, goz: 'sag', gecmis: [], bugun: T })
    for (const e of ['Güncel düzeltilmiş görme keskinliği', 'Biyometri', 'GİL tipi', 'EK-3/G', 'Ön-op kontrol listesi']) assert.ok(eksik.eksikler.some((x) => x.includes(e)), e)
    assert.ok(eksik.sutKontrol.some((x) => x.madde.includes('Medula') && x.tamam === null))
    const { biyometri } = biyometriNormalize({ alMm: 23.4, k1D: 43, k2D: 44, aSabiti: 118.9 })
    const tam = gozSgkTaslak({ sablon: 'katarakt_gil', hasta: { adSoyad: '' }, goz: 'sol', vaSimdi: '0,3', gecmis: [], bugun: T, gil: { tip: 'torik', ek3gKod: 'G10110', biyometri, kontrolEksik: [], planlananTarih: '2026-10-01' } })
    assert.deepEqual(tam.eksikler, [])
    assert.match(tam.draft.mevcutDurum!, /G10110/)
    assert.ok(tam.draft.zorunluTetkikler!.some((x) => x.includes('AL 23,4 mm')))
    const metin = gozSgkMetni(tam)
    assert.doesNotMatch(metin, /\b\d{11}\b|TL|₺/)
    assert.doesNotMatch(metin, /güç(ü)? [+-]?\d/i)
  })
})

describe('SUT anti-VEGF kapı studio = chapter engine', () => {
  it('same gates as the chapter (ranibizumab 2. basamak engel; muayenehane → uyarı, odenebilir null)', () => {
    assert.equal(sgkKapilari({ ajan: 'ranibizumab', goz: 'sag', tarih: T, basamak: '2', gecmis: [] }).odenebilir, false)
    assert.equal(sgkKapilari({ ajan: 'bevacizumab', goz: 'sag', tarih: T, basamak: 'muayenehane', gecmis: [] }).odenebilir, null)
  })
})

// ─────────────────────────── Workstream A — chapter depth ───────────────────────────

describe('VA/GİB: RAPD + refraksiyon (no invented Rx)', () => {
  it('refraction stored as measured; typos rejected; cyl needs axis; no rounding', () => {
    const r = refraksiyonNormalize({ sag: { sph: '-1,37', cyl: '-0,75', aks: '180' }, sol: { sph: '+0,50' } })
    assert.deepEqual(r.hatalar, [])
    assert.equal(r.refraksiyon!.sag.sph, -1.37, 'value kept as written — not rounded to 0.25')
    assert.match(refraksiyonMetni(r.refraksiyon)!, /OD: −1,37 sph −0,75 cyl × 180°; OS: \+0,50 sph/)
    assert.ok(refraksiyonNormalize({ sag: { cyl: '-1' } }).hatalar.some((h) => h.includes('aks')))
    assert.ok(refraksiyonNormalize({ sag: { sph: '-45' } }).hatalar.length === 1)
    assert.equal(refraksiyonNormalize({}).refraksiyon, null)
  })
  it('Nota ekle (O) line carries RAPD + refraksiyon', () => {
    const m = olcumNotaMetni({ tarih: T, va: { sag: { uzak_cc: '0,8' }, sol: { uzak_cc: '0,5' } }, gib_sag: 16, gib_sol: 18, gib_yontem: 'applanasyon', rapd: 'sol', ek: { refraksiyon: refraksiyonNormalize({ sag: { sph: '-1' } }).refraksiyon } })
    assert.match(m, /RAPD sol \(OS\)/); assert.match(m, /Refraksiyon — OD: −1,00 sph/); assert.match(m, /aplanasyon/)
  })
  it('Şeridi Objektif\'e yaz: best VA + GİB + RAPD + last fundus line, no dose/diagnosis', () => {
    const satir = seritNotaMetni({ sonOlcum: { tarih: T, va: { sag: { uzak_sc: '0,5', uzak_cc: '0,8' } }, gib_sag: 21, gib_sol: null, gib_yontem: 'nct', rapd: 'yok', ek: null }, sonFundus: fundusNormalize({ tarih: T, dilate: true, sag: normalFundusGoz(), sol: normalFundusGoz() }) })!
    assert.match(satir, /VA OD 0,8, OS —/); assert.match(satir, /GİB \(NCT\) OD 21 \/ OS — mmHg/); assert.match(satir, /RAPD yok/); assert.match(satir, /Göz dibi \(dilate\)/)
    assert.doesNotMatch(satir, /mg|damla|glokom|retinopati|evre/i)
    assert.equal(seritNotaMetni({ sonOlcum: null, sonFundus: null }), null)
  })
  it('strip VA survives a later fundus-only row (va empty)', () => {
    const s = gozSeridi({ muayeneler: [{ tarih: T, va: {}, gibSag: null, gibSol: null }, { tarih: '2026-09-01', va: { sag: { uzak_cc: '0,6' } }, gibSag: 15, gibSol: 15 }], hedefSag: null, hedefSol: null, evreSag: null, evreSol: null, sonrakiEnjeksiyon: null, gorevDue: [], sikayetMetinleri: [], bugun: T })
    assert.equal(s.va.sag, '0,6'); assert.equal(s.bugunOlcumVar, false)
  })
})

describe('Fundus → DR: hekim confirms, never auto-staged', () => {
  it('rejects without hekimOnay, without any stage, or without date', () => {
    assert.equal(fundusDrGecisi({ hekimOnay: false, evreSag: 'orta_npdr', fundusTarihi: T }).ok, false)
    assert.equal(fundusDrGecisi({ hekimOnay: 'true', evreSag: 'orta_npdr', fundusTarihi: T }).ok, false, 'string "true" is not a confirmation')
    assert.equal(fundusDrGecisi({ hekimOnay: true, fundusTarihi: T }).ok, false)
    assert.equal(fundusDrGecisi({ hekimOnay: true, evreSag: 'uydurma', fundusTarihi: T }).ok, false)
    const ok = fundusDrGecisi({ hekimOnay: true, evreSag: 'hafif_npdr', dmoSol: 'merkez_disi', evreSol: 'yok', fundusTarihi: T })
    assert.ok(ok.ok && ok.evreSag === 'hafif_npdr' && ok.sonFundus === T)
  })
  it('fundus engine still never emits a DR stage', () => {
    const m = fundusNormalize({ tarih: T, sag: { makula: 'sert eksuda, mikroanevrizma' } })
    assert.equal((m as unknown as Record<string, unknown>).evre, undefined)
  })
})

describe('DR laser log', () => {
  it('validates eye/type/date/session, kontrol after laser; note line has no dose', () => {
    assert.equal(lazerDogrula({ goz: 'iki', tip: 'prp', tarih: T }).ok, false)
    assert.equal(lazerDogrula({ goz: 'sag', tip: 'yag', tarih: T }).ok, false)
    assert.equal(lazerDogrula({ goz: 'sag', tip: 'prp', tarih: T, kontrolTarihi: '2026-09-01' }).ok, false)
    const v = lazerDogrula({ goz: 'sol', tip: 'prp', tarih: T, seansNo: '2', kontrolTarihi: '2026-10-18' })
    assert.ok(v.ok)
    if (v.ok) assert.match(lazerNotaMetni({ ...v.lazer, hekimAdi: 'QA Hekim' }), /Sol göz \(OS\) PRP .*seans 2, QA Hekim/)
  })
})

describe('Glokom: EGS 5 presets (öneri — hekim kilitler), gonyo / paki / VF meta', () => {
  it('presets are EGS-sourced (primary), never fill OCT interval, labelled hekim-lock', () => {
    assert.equal(GLOKOM_ONERI_ETIKETI, 'öneri — hekim kilitler')
    assert.equal(GOZ_KAYNAKLAR.EGS_5.dogrulama, 'birincil')
    for (const o of GLOKOM_ARALIK_ONERILERI) { assert.equal(o.octAralikAy, null, o.kod); assert.equal(o.dipnot.ref, 'EGS_5', o.kod) }
    assert.equal(GLOKOM_ARALIK_ONERILERI.find((o) => o.kod === 'egs_yeni_tani')!.gaAralikAy, 4)
    assert.equal(GLOKOM_ARALIK_ONERILERI.find((o) => o.kod === 'egs_progresyon')!.gaAralikAy, null, 'EGS gives only "<6 months" — no number invented')
  })
  it('gonyo Shaffer 0–4, pachymetry µm range, device meta; no interpretation words', () => {
    const { meta, hatalar } = glokomMetaNormalize({ shafferSag: '3', shafferSol: '1', gonyoSol: 'Spaeth B10f', pakiSag: '512', pakiSol: '498', gormeAlaniCihaz: 'Humphrey 24-2 SITA' })
    assert.deepEqual(hatalar, [])
    const m = glokomMetaMetni(meta, '2026-08-01', null)!
    assert.match(m, /OD: Shaffer 3, SKK 512 µm; OS: Shaffer 1, Spaeth B10f, SKK 498 µm; son GA 2026-08-01 \(Humphrey 24-2 SITA\)/)
    assert.doesNotMatch(m, /ince kornea|risk|düzelt|glokom tanı/i)
    assert.equal(glokomMetaNormalize({ shafferSag: '5' }).hatalar.length, 1)
    assert.equal(glokomMetaNormalize({ pakiSag: '120' }).hatalar.length, 1)
  })
})

describe('Anti-VEGF: IVT odası checklist before "yapıldı" (wrong-eye guard)', () => {
  const tam = { onam: true, goz_isaret: true, isaretliGoz: 'sag' as const, ilac_lot: true, lot: 'QA-LOT-1', asepsi: true }
  it('all four items + lot + matching eye required', () => {
    assert.equal(IVT_KONTROL.length, 4)
    assert.equal(ivtKontrolDogrula(tam, 'sag').tamam, true)
    assert.equal(ivtKontrolDogrula(null, 'sag').tamam, false)
    assert.ok(ivtKontrolDogrula({ ...tam, lot: '' }, 'sag').eksikler.some((e) => e.includes('Lot')))
    const yanlis = ivtKontrolDogrula(tam, 'sol')
    assert.equal(yanlis.tamam, false); assert.ok(yanlis.eksikler.some((e) => e.includes('YANLIŞ GÖZ')))
    assert.equal(ivtKontrolDogrula({ gecmisKayit: true }, 'sol').tamam, true)
    assert.doesNotMatch(JSON.stringify(IVT_KONTROL), /%|mg|ml\b/i, 'no antiseptic concentration / dose invented')
  })
})

describe('Ön segment: biyomikroskopi OD/OS + keratokonus', () => {
  it('structured OD/OS form + normal shortcut → note line, no diagnosis', () => {
    const b = biyoNormalize({ sag: normalBiyoGoz(), sol: { ...normalBiyoGoz(), lens: 'nükleer opasite +2' }, floresein: true })!
    const m = biyoMetni(b)!
    assert.match(m, /Biyomikroskopi \(floresein boyalı\) — OD: kapak doğal; konjonktiva sakin; kornea saydam; ön kamara derin, sakin/)
    assert.match(m, /OS: .*lens nükleer opasite \+2/)
    assert.equal(biyoNormalize({ sag: {}, sol: {} }), null)
  })
  it('keratokonus: topo note + Kmax range + CXL dates (hekim)', () => {
    const k = keratokonusNormalize({ topoNot: 'inferior dikleşme', kmaxSag: '52,4', cxlSag: '2026-01-10' })
    assert.deepEqual(k.hatalar, []); assert.equal(k.keratokonus!.kmaxSag, 52.4)
    assert.equal(keratokonusNormalize({ kmaxSag: '12' }).hatalar.length, 1)
  })
})

describe('Pediatrik: ROP card + age gate (never on adult charts by default)', () => {
  it('PMA = GA + weeks since birth; SB ≤32 hf / ≤1500 g criterion', () => {
    assert.equal(pmaHesapla(28, '2026-08-07', '2026-09-18'), 34)
    assert.equal(pmaHesapla(null, '2026-08-07', T), null)
    assert.equal(ropTaramaEndikasyonu(31, 1700).var, true)
    assert.equal(ropTaramaEndikasyonu(35, 2400).var, false)
  })
  it('zone / stage / plus only as entered; next screen date is hekim\'s — no interval invented', () => {
    const r = ropDogrula({ tarih: T, dogumHaftasi: '28', zonSag: 'II', evreSag: '2', plusSag: 'yok' }, '2026-08-07')
    assert.ok(r.ok)
    if (r.ok) { assert.equal(r.kayit.sonrakiTarama, null); assert.ok(r.uyarilar.some((u) => u.includes('hekim belirlesin'))); assert.equal(r.kayit.pmaHafta, 34) }
    assert.equal(ropDogrula({ tarih: T, zonSag: 'IV' }, null).ok, true, 'invalid zone is dropped, not coerced')
    assert.equal(ropDogrula({ tarih: T, sonrakiTarama: '2026-09-01' }, null).ok, false)
  })
  it('gate: adult / unknown age → no Pediatrik tab, no ROP; infant → both; data keeps it visible', () => {
    assert.deepEqual(pediatrikGorunum({ yasAy: 600, pedVeriVar: false, ropVeriVar: false }), { pediatrikSekme: false, ropKart: false })
    assert.deepEqual(pediatrikGorunum({ yasAy: null, pedVeriVar: false, ropVeriVar: false }), { pediatrikSekme: false, ropKart: false })
    assert.deepEqual(pediatrikGorunum({ yasAy: 2, pedVeriVar: false, ropVeriVar: false }), { pediatrikSekme: true, ropKart: true })
    assert.deepEqual(pediatrikGorunum({ yasAy: 72, pedVeriVar: false, ropVeriVar: false }), { pediatrikSekme: true, ropKart: false })
    assert.deepEqual(pediatrikGorunum({ yasAy: 600, pedVeriVar: false, ropVeriVar: true }), { pediatrikSekme: true, ropKart: true })
  })
})

describe('Acil: intake red-flag checkboxes fire the band; irrigation timer; action lists', () => {
  it('intake field exists on the göz form only; each box maps to an acil code', () => {
    const alan = BRANS_SORULARI['goz-hastaliklari']!.alanlar.find((a) => a.id === 'acilBelirtiler')!
    assert.ok(alan && alan.secenekler!.includes('Ani görme kaybı') && alan.secenekler!.includes('Kimyasal madde teması'))
    for (const [k, v] of Object.entries(BRANS_SORULARI)) if (k !== 'goz-hastaliklari') assert.ok(!v?.alanlar.some((a) => a.id === 'acilBelirtiler'), `${k} must not get göz red-flag box`)
    assert.deepEqual(intakeAcilKodlari(['Işık çakması', 'Perde / gölge inmesi', 'Yok']), ['retina_dekolmani_suphesi'])
  })
  it('checkboxes alone (no free text) raise the band via intakeSubjektif → gozSeridi', () => {
    const i = intakeSubjektif({ acilBelirtiler: ['Kimyasal madde teması', 'Ağrılı kızarıklık'] })
    assert.deepEqual(i.acil.map((a) => a.kod).sort(), ['agrili_kirmizi_goz', 'kimyasal_yanik'])
    assert.match(i.subjektif, /KIRMIZI BAYRAK \(hasta işaretledi\): Kimyasal madde teması, Ağrılı kızarıklık/)
    const s = gozSeridi({ muayeneler: [], hedefSag: null, hedefSol: null, evreSag: null, evreSol: null, sonrakiEnjeksiyon: null, gorevDue: [], sikayetMetinleri: [], hekimIsaretleri: i.acilKodlari, bugun: T })
    assert.equal(s.acil[0].kod, 'kimyasal_yanik'); assert.equal(s.acil[0].oncelik, 'hemen')
    assert.equal(intakeSubjektif({ acilBelirtiler: ['Yok'] }).acil.length, 0)
  })
  it('timer minutes; every acil code has an action list; no dose / pH target invented', () => {
    assert.equal(yikamaDakika('2026-09-18T10:00:00Z', '2026-09-18T10:31:30Z'), 31.5)
    assert.equal(yikamaDakika(null, null), null)
    for (const k of ACIL_KODLARI) assert.ok(ACIL_EYLEM_LISTESI[k.kod]?.length >= 3, k.kod)
    assert.doesNotMatch(JSON.stringify(ACIL_EYLEM_LISTESI), /\bmg\b|pH ?[<>=]? ?\d|ml\b/i)
    assert.equal(acilTara(['ağrılı kızarıklık var'])[0].kod, 'agrili_kirmizi_goz')
  })
})

describe('Maturity: beta-hazir, never self-promoted to uzman-dogrulandi', () => {
  it('göz = beta-hazir until the MD sign-off (Boss/CEO) is recorded', () => {
    assert.equal(GOZ_PROFILE.olgunluk, 'beta-hazir')
  })
})

describe('Exit audit (public/goz-exceptional-audit.html)', () => {
  const kok = path.join(import.meta.dirname, '..', '..', '..')
  const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
  it('banner, 16 Strong domains, no Partial/Thin/Missing pill, game changers shipped, no PHI', () => {
    const h = oku('public/goz-exceptional-audit.html')
    assert.match(h, /Post-exceptional sprint GOZ-EXCEPTIONAL-01/)
    const tablo = h.slice(h.indexOf('<h2>Coverage depth</h2>'), h.indexOf('<h2>Wow bar'))
    assert.equal((tablo.match(/pill success">Strong</g) || []).length, 16)
    assert.doesNotMatch(h, /pill (warning|danger)">(Partial|Thin|Missing)</)
    const gc = h.slice(h.indexOf('<h2>Game changers</h2>'), h.indexOf('<h2>Intentionally out'))
    assert.equal((gc.match(/pill success">Shipped</g) || []).length, 10)
    assert.match(h, /maturity|olgunluk: beta-hazir/)
    assert.doesNotMatch(h, /\b[1-9]\d{10}\b/, 'no T.C.-like numbers')
    for (const bar of [...h.slice(h.indexOf('<h2>Wow bar'), h.indexOf('<h2>Mandate')).matchAll(/bar-label">([^<]+)<\/div><div class="bar-track"><div class="bar-fill" style="width:(\d+)%/g)]) {
      if (!/olgunluk/.test(bar[1])) assert.ok(Number(bar[2]) >= 85, `${bar[1]} ${bar[2]} < 85`)
    }
  })
  it('linked from docs/README_GOZ.md; never from Doktor Araçları', () => {
    assert.match(oku('docs/README_GOZ.md'), /goz-exceptional-audit\.html/)
    assert.doesNotMatch(oku('lib/doktor/doktorAraclari.ts') + oku('app/doktor-tools/page.tsx'), /goz-exceptional-audit|\.html/)
  })
})
