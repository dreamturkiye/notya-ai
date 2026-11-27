/**
 * BRANS-PAKETI — registry, per-patient resolution and safety rules for the branş signature modules (Phase 1: the 10
 * Özel Branşlar). Pins: every Özel Branş has a package; a module of one branş never resolves for another branş or for
 * any of the 30 medical branşlar (brans-alan-sizmasi); nothing reaches a patient before the professional accepted the
 * template; condition modules follow the diagnosis / medicine on file; age gate (veli wording only under 18); every acil
 * red flag carries 112; no "AI / yapay zekâ" or calorie counting in patient copy; screening scores never reach the
 * patient; diyetisyen weight stays outside the game layer; template edits refuse doses.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'
import { KLINIK_PORTAL_MODUL } from '@/lib/klinik/klinikPortal'
import { OZEL_BRANS_AYARLARI, TIBBI_BRANS_AYARLARI } from '@/lib/saglikEvi/bransAyari'
import {
  BRANS_PAKETLERI, PAKET_SAYFASI, hastaPaketiCoz, kayitDegerlendir, kayitTemizle, modulBransaAitMi, paketModulu,
  sablonDuzenlemesiTemizle, ayarTemizle, zamanCizelgesi, type PaketGirdisi, type SablonKaydi,
} from './bransPaketi'
import { hastaYukuKur } from './bransPaketiYuk'
import { PAKET_DEMO_DIYETISYEN, PAKET_DEMO_ESTETIK_CERRAHI, PAKET_DEMO_SAC_EKIMI } from './bransPaketiDemo'
import { TARAMA_HASTA_METNI, TARAMA_TESEKKUR } from '@/specialties/diyetisyen/engines/tarama'

const KABUL = '2026-11-27T08:00:00Z'
function hepsiKabul(brans: string): Record<string, SablonKaydi> {
  const out: Record<string, SablonKaydi> = {}
  for (const m of Object.values(BRANS_PAKETLERI).flat()) if (m.brans === brans) out[m.kod] = { icerik: null, kabulAt: KABUL }
  return out
}
/** All templates of ALL branşlar accepted — the strictest leak check (a foreign accepted row must still not resolve). */
function tumKabul(): Record<string, SablonKaydi> {
  return Object.fromEntries(Object.values(BRANS_PAKETLERI).flat().map((m) => [m.kod, { icerik: null, kabulAt: KABUL }]))
}
const girdi = (o: Partial<PaketGirdisi>): PaketGirdisi => ({ doktorBransi: 'diyetisyen', sablonlar: tumKabul(), hastaAyar: {}, tanilar: [], icdKodlari: [], ilaclar: [], hastaYasYil: 40, ...o })
const tumModuller = Object.values(BRANS_PAKETLERI).flat()

function hastaMetinleri(): string[] {
  return tumModuller.flatMap((m) => [m.baslik, m.aciklama, m.fotoRizaMetni || '', m.varsayilan.not || '', ...(m.varsayilan.maddeler || []), ...(m.varsayilan.adimlar || []).flatMap((a) => [a.baslik, a.ayrinti]), ...(m.varsayilan.alanlar || []).map((a) => a.etiket), ...(m.varsayilan.bayraklar || []).map((b) => b.hasta), ...(m.varsayilan.acilar || [])])
}

describe('BRANS-PAKETI registry', () => {
  it('every Özel Branş has a package of ≥ 2 modules, each module belongs to its own branş, codes are unique', () => {
    for (const s of KLINIK_YENI_SLUGS) {
      assert.ok(BRANS_PAKETLERI[s].length >= 2, `${s} has no real package`)
      for (const m of BRANS_PAKETLERI[s]) assert.equal(m.brans, s, `${m.kod} filed under ${s}`)
      assert.equal(PAKET_SAYFASI[s], KLINIK_PORTAL_MODUL[s], `${s}: package renders on its existing portal page`)
    }
    const kodlar = tumModuller.map((m) => m.kod)
    assert.equal(new Set(kodlar).size, kodlar.length)
    for (const k of kodlar) assert.equal(paketModulu(k)?.kod, k)
  })

  it('diyetisyen package has the requested pieces: Tabağım, weekly plan, body measures, progress photos, PKOS, tiroid, insülin direnci, GLP-1, screening', () => {
    const turler = BRANS_PAKETLERI.diyetisyen.map((m) => `${m.kod}:${m.tur}`)
    for (const k of ['diyet-tabak:tabak', 'diyet-plan:plan', 'diyet-vucut:gunluk', 'diyet-ilerleme:foto', 'diyet-pkos:gunluk', 'diyet-tiroid:ilac-saati', 'diyet-ir:gunluk', 'diyet-glp1:gunluk', 'diyet-tarama:tarama']) assert.ok(turler.includes(k), k)
  })

  it('signature pieces of the other 9 Özel Branşlar exist (timeline / checklist / diary / photos / programme / biomarkers)', () => {
    const var_ = (s: keyof typeof BRANS_PAKETLERI, tur: string) => BRANS_PAKETLERI[s].some((m) => m.tur === tur)
    assert.ok(var_('sac-ekimi', 'zaman') && var_('sac-ekimi', 'foto') && var_('sac-ekimi', 'hatirlatma'))
    assert.deepEqual(paketModulu('sac-foto')?.varsayilan.aylar, [3, 6, 9, 12])
    assert.ok(var_('estetik-cerrahi', 'liste') && var_('estetik-cerrahi', 'gunluk') && var_('estetik-cerrahi', 'foto'))
    assert.ok(var_('medikal-estetik', 'zaman') && var_('medikal-estetik', 'liste'))
    assert.ok(var_('klinik-dermatoloji', 'foto') && var_('klinik-dermatoloji', 'gunluk') && !!paketModulu('derm-izotretinoin'))
    assert.ok(var_('longevity', 'biyobelirtec') && var_('longevity', 'gunluk'))
    assert.ok(var_('fizyoterapi', 'program') && var_('fizyoterapi', 'gunluk'))
    assert.ok(var_('klinik-psikolog', 'gunluk') && var_('klinik-psikolog', 'program'))
    assert.ok(var_('ergoterapi', 'program') && !!paketModulu('ergo-duyusal'))
    assert.ok(BRANS_PAKETLERI.odyoloji.length >= 3)
  })
})

describe('BRANS-PAKETI brans-alan-sizmasi (leak gate)', () => {
  it('each Özel Branş resolves only its own modules — even with every branş’s template accepted', () => {
    for (const s of KLINIK_YENI_SLUGS) {
      const c = hastaPaketiCoz(girdi({ doktorBransi: s, tanilar: ['PKOS', 'Hipotiroidi', 'insülin direnci'], ilaclar: ['Ozempic', 'Euthyrox'] }))
      assert.equal(c.brans, s)
      assert.ok(c.moduller.length > 0, `${s}: nothing resolved`)
      for (const m of c.moduller) assert.equal(m.tanim.brans, s, `${m.tanim.kod} leaked into ${s}`)
      for (const o of KLINIK_YENI_SLUGS) if (o !== s) for (const m of BRANS_PAKETLERI[o]) assert.equal(modulBransaAitMi(m.kod, s), false, `${m.kod} accepted for ${s}`)
    }
  })

  it('none of the 30 medical branşlar resolves any package module in Phase 1 (plastik cerrahi ≠ estetik cerrahi, dermatoloji ≠ klinik dermatoloji)', () => {
    const tibbi = Object.keys(TIBBI_BRANS_AYARLARI)
    assert.equal(tibbi.length, 30)
    for (const b of tibbi) {
      const c = hastaPaketiCoz(girdi({ doktorBransi: b, tanilar: ['PKOS'], ilaclar: ['Ozempic'] }))
      assert.equal(c.moduller.length, 0, `${b} got a package`)
      for (const m of tumModuller) assert.equal(modulBransaAitMi(m.kod, b), false)
    }
    assert.equal(hastaPaketiCoz(girdi({ doktorBransi: null })).moduller.length, 0)
    assert.equal(hastaPaketiCoz(girdi({ doktorBransi: 'bilinmeyen' })).moduller.length, 0)
  })
})

describe('BRANS-PAKETI per-patient resolution', () => {
  it('nothing reaches the patient before the professional accepted the template (acceptance gate)', () => {
    const c = hastaPaketiCoz(girdi({ doktorBransi: 'sac-ekimi', sablonlar: {} }))
    assert.equal(c.moduller.length, 0)
    assert.ok(c.hazirlaniyor.includes('sac-zaman'))
    const yarim = hastaPaketiCoz(girdi({ doktorBransi: 'sac-ekimi', sablonlar: { 'sac-zaman': { icerik: null, kabulAt: KABUL } } }))
    assert.deepEqual(yarim.moduller.map((m) => m.tanim.kod), ['sac-zaman'])
  })

  it('professional switch: off removes a default module; a default-off module needs an explicit on', () => {
    const kapali = hastaPaketiCoz(girdi({ doktorBransi: 'sac-ekimi', hastaAyar: { 'sac-gunluk': { acik: false, baslangic: null, ayar: {} } } }))
    assert.ok(!kapali.moduller.some((m) => m.tanim.kod === 'sac-gunluk'))
    assert.ok(!hastaPaketiCoz(girdi({ doktorBransi: 'klinik-dermatoloji' })).moduller.some((m) => m.tanim.kod === 'derm-izotretinoin'))
    const acik = hastaPaketiCoz(girdi({ doktorBransi: 'klinik-dermatoloji', hastaAyar: { 'derm-izotretinoin': { acik: true, baslangic: null, ayar: {} } } }))
    assert.equal(acik.moduller.find((m) => m.tanim.kod === 'derm-izotretinoin')?.neden, 'uzman')
  })

  it('diyetisyen condition modules follow the diagnosis / ICD-10 / medicine on file, conservatively', () => {
    const kodlar = (o: Partial<PaketGirdisi>) => hastaPaketiCoz(girdi(o)).moduller.map((m) => m.tanim.kod)
    assert.ok(!kodlar({}).some((k) => ['diyet-pkos', 'diyet-tiroid', 'diyet-ir', 'diyet-glp1'].includes(k)), 'no condition module without a reason')
    assert.ok(kodlar({ tanilar: ['Polikistik over sendromu'] }).includes('diyet-pkos'))
    assert.ok(kodlar({ icdKodlari: ['E28.2'] }).includes('diyet-pkos'))
    assert.ok(kodlar({ ilaclar: ['Euthyrox 50 mcg tablet'] }).includes('diyet-tiroid'))
    assert.ok(kodlar({ tanilar: ['Hashimoto tiroiditi'] }).includes('diyet-tiroid'))
    assert.ok(!kodlar({ ilaclar: ['Thyromazol 5 mg'] }).includes('diyet-tiroid'), 'an antithyroid drug is not levothyroxine')
    assert.ok(kodlar({ icdKodlari: ['R73.0'] }).includes('diyet-ir'))
    assert.ok(kodlar({ ilaclar: ['Mounjaro'] }).includes('diyet-glp1'))
    assert.ok(kodlar({ ilaclar: ['Ozempic'] }).includes('diyet-glp1'))
    assert.ok(!kodlar({ ilaclar: ['Ozempic'], hastaAyar: { 'diyet-glp1': { acik: false, baslangic: null, ayar: {} } } }).includes('diyet-glp1'), 'the dietitian’s off wins')
  })

  it('ergoterapi: the sensory diet and child goals only under 18 (veli wording); adults get their own goals; unknown age = adult', () => {
    const kodlar = (yas: number | null) => hastaPaketiCoz(girdi({ doktorBransi: 'ergoterapi', hastaYasYil: yas })).moduller.map((m) => m.tanim.kod)
    assert.deepEqual(kodlar(7).sort(), ['ergo-cocuk-hedef', 'ergo-duyusal'])
    assert.deepEqual(kodlar(45), ['ergo-hedef'])
    assert.deepEqual(kodlar(null), ['ergo-hedef'])
    for (const m of BRANS_PAKETLERI.ergoterapi) {
      const metin = `${m.baslik} ${m.aciklama}`
      if (m.yas === 'cocuk') assert.match(metin, /[Çç]ocu[gğ]/)
      else assert.doesNotMatch(metin, /veli|[çc]ocu[gğ]/i)
    }
    // no child wording on any adult module of any branş
    for (const m of tumModuller) if (m.yas !== 'cocuk') assert.doesNotMatch(`${m.baslik} ${m.aciklama}`, /\bveli\b|[Çç]ocu[gğ]unuz/, m.kod)
  })
})

describe('BRANS-PAKETI safety copy and red flags', () => {
  it('every acil red flag tells the patient 112; every flag has professional text', () => {
    for (const m of tumModuller) for (const b of m.varsayilan.bayraklar || []) {
      if (b.duzey === 'acil') assert.match(b.hasta, /112/, `${m.kod}/${b.id}`)
      assert.ok(b.hekim.length > 5)
      for (const k of b.kosullar) assert.ok((m.varsayilan.alanlar || []).some((a) => a.id === k.alan), `${m.kod}/${b.id}: unknown field ${k.alan}`)
    }
  })

  it('no "AI / yapay zekâ / YZ", no calorie counting, no gamification words in any patient-facing text', () => {
    for (const t of [...hastaMetinleri(), TARAMA_TESEKKUR, TARAMA_HASTA_METNI]) {
      assert.doesNotMatch(t, /yapay\s*zek[aâ]|\bYZ\b|\bAI\b|artificial/i, t)
      assert.doesNotMatch(t, /\d+\s*kcal|kalori\s*hedef/i, t)
      assert.doesNotMatch(t, /rozet|\bseri\b|puan(ınız)?\b|skor/i, t)
    }
  })

  it('post-op diary: breathlessness → acil, calf swelling → acil, fever + wound → hekime_bildir; highest level first', () => {
    const ic = paketModulu('cer-gunluk')!.varsayilan
    assert.equal(kayitDegerlendir(ic, { nefes: true })[0].duzey, 'acil')
    assert.equal(kayitDegerlendir(ic, { baldir: true })[0].duzey, 'acil')
    assert.equal(kayitDegerlendir(ic, { ates: true, yara: true })[0].duzey, 'hekime_bildir')
    assert.equal(kayitDegerlendir(ic, { ates: true, yara: true, nefes: true })[0].duzey, 'acil')
    assert.equal(kayitDegerlendir(ic, { agri: 3 }).length, 0)
  })

  it('GLP-1 diary: severe / back-radiating abdominal pain → acil (112); vomiting + no fluids → hekime_bildir', () => {
    const ic = paketModulu('diyet-glp1')!.varsayilan
    const a = kayitDegerlendir(ic, { karin_agrisi: true })[0]
    assert.equal(a.duzey, 'acil'); assert.match(a.bayrak.hasta, /112/)
    assert.equal(kayitDegerlendir(ic, { kusma: true, sivi_alamiyorum: true })[0].duzey, 'hekime_bildir')
    assert.equal(kayitDegerlendir(ic, { kusma: true }).length, 0)
  })

  it('klinik psikoloji: self-harm thoughts → acil crisis copy (112, not a substitute for emergency services)', () => {
    const b = kayitDegerlendir(paketModulu('psi-duygu')!.varsayilan, { zarar: true })[0]
    assert.equal(b.duzey, 'acil'); assert.match(b.bayrak.hasta, /112/); assert.match(b.bayrak.hasta, /yeterli değildir/)
  })

  it('diary entries are validated against the module fields (range, type, per-patient conditions)', () => {
    const ic = paketModulu('cer-gunluk')!.varsayilan
    assert.equal(kayitTemizle(ic, { agri: 11 }).ok, false)
    assert.equal(kayitTemizle(ic, { ates: 'evet' }).ok, false)
    assert.deepEqual(kayitTemizle(ic, { agri: '4', bilinmeyen: 1 }), { ok: true, veri: { agri: 4 } })
    assert.equal(kayitTemizle(ic, { dren: 50 }).ok, false, 'dren needs the surgeon’s "dren var" setting')
    assert.deepEqual(kayitTemizle(ic, { dren: 50 }, { drenVar: true }), { ok: true, veri: { dren: 50 } })
    assert.equal(kayitTemizle(ic, {}).ok, false)
  })
})

describe('BRANS-PAKETI screening (SCOFF) never shows a result to the patient', () => {
  it('the patient payload carries no screening answers, score or level; thank-you copy has no number', () => {
    const y = hastaYukuKur({
      brans: 'diyetisyen', cozum: hastaPaketiCoz(girdi({})), sablonlar: tumKabul(), hastaAyar: {},
      kayitlar: [{ id: 'k1', modul: 'diyet-tarama', gun: '2026-11-20', veri: { cevaplar: [true, true, false, false, false], puan: 2, pozitif: true }, seviye: 'hekime_bildir', created_at: '2026-11-20T09:00:00Z' }],
      fotolar: [], paylasimOnayi: true, lab: [], ilaclar: [],
    }, '2026-11-27')
    const json = JSON.stringify(y)
    assert.ok(!json.includes('"puan"') && !json.includes('pozitif') && !json.includes('cevaplar'))
    assert.equal(y.taramaZamani, false, 'screened 7 days ago → not due')
    assert.doesNotMatch(TARAMA_TESEKKUR, /\d/); assert.doesNotMatch(TARAMA_HASTA_METNI, /\d/)
    assert.ok(!json.includes('hekim'), 'professional red-flag text stripped')
  })
})

describe('BRANS-PAKETI game-layer brake (diyetisyen)', () => {
  it('weight and waist are outside the habit layer for diyetisyen, and no other branş is affected', () => {
    assert.deepEqual(OZEL_BRANS_AYARLARI.diyetisyen.oyunDisi, ['kilo', 'bel'])
    for (const [k, a] of Object.entries({ ...TIBBI_BRANS_AYARLARI, ...OZEL_BRANS_AYARLARI })) if (k !== 'diyetisyen') assert.equal(a.oyunDisi, undefined, k)
    assert.ok(!tumModuller.some((m) => /rozet|seri/i.test(m.tur)))
  })
})

describe('BRANS-PAKETI template edits and settings', () => {
  it('an edit may change timeline / list / photo / note — never a dose; diary fields and red flags stay the registry’s', () => {
    const t = paketModulu('sac-zaman')!
    assert.equal(sablonDuzenlemesiTemizle(t, { adimlar: [{ gun: 1, baslik: 'Losyon', ayrinti: '5 mg günde iki kez' }] }).ok, false)
    const r = sablonDuzenlemesiTemizle(t, { adimlar: [{ gun: 0, baslik: 'İlk gece', ayrinti: 'Yüksek yastık' }, { gun: 2, baslik: 'Yıkama', ayrinti: 'Nazik' }] })
    assert.ok(r.ok && r.duzenlendi)
    const ayni = sablonDuzenlemesiTemizle(t, { adimlar: t.varsayilan.adimlar })
    assert.ok(ayni.ok && !ayni.duzenlendi)
    assert.equal(sablonDuzenlemesiTemizle(t, { adimlar: [{ gun: -1, baslik: 'x', ayrinti: '' }] }).ok, false)
    const tarama = paketModulu('diyet-tarama')!
    assert.equal(sablonDuzenlemesiTemizle(tarama, { maddeler: ['tek soru'] }).ok, false, 'screening item count is fixed')
    assert.ok(sablonDuzenlemesiTemizle(tarama, { maddeler: tarama.varsayilan.maddeler }).ok)
  })

  it('per-patient settings: only declared keys; no dose in a portal line; plan text kept as text', () => {
    assert.deepEqual(ayarTemizle(paketModulu('diyet-glp1')!, { proteinHedefG: '90', baska: 1 }), { ok: true, ayar: { proteinHedefG: 90 } })
    assert.equal(ayarTemizle(paketModulu('sac-ilac')!, { satirlar: 'Finasterid 1 mg her gün' }).ok, false)
    assert.ok(ayarTemizle(paketModulu('sac-ilac')!, { satirlar: 'Losyon — hekiminizin tarif ettiği şekilde' }).ok)
    assert.equal(ayarTemizle(paketModulu('diyet-tiroid')!, { ilacSaati: '7' }).ok, false)
  })

  it('timeline states relative to today', () => {
    const z = zamanCizelgesi([{ gun: 0, baslik: 'a', ayrinti: '' }, { gun: 3, baslik: 'b', ayrinti: '' }, { gun: 10, baslik: 'c', ayrinti: '' }, { gun: 20, baslik: 'd', ayrinti: '' }], '2026-11-24', '2026-11-27')
    assert.deepEqual(z.map((x) => x.durum), ['gecti', 'bugun', 'sirada', 'ileride'])
    assert.equal(z[2].tarih, '2026-12-04')
    assert.ok(zamanCizelgesi([{ gun: 1, baslik: 'a', ayrinti: '' }], null, '2026-11-27').every((x) => x.durum === 'ileride' && x.tarih === null))
  })
})

describe('BRANS-PAKETI demo portals', () => {
  it('the three demos resolve through the live resolver and show their signature modules only', () => {
    assert.ok(PAKET_DEMO_DIYETISYEN.moduller.some((m) => m.kod === 'diyet-tabak'))
    assert.ok(PAKET_DEMO_DIYETISYEN.moduller.some((m) => m.kod === 'diyet-tiroid'), 'levothyroxine on file → tiroid module')
    assert.ok(PAKET_DEMO_DIYETISYEN.moduller.some((m) => m.kod === 'diyet-glp1'))
    const plan = PAKET_DEMO_DIYETISYEN.moduller.find((m) => m.kod === 'diyet-plan')!
    assert.ok(Array.isArray(plan.ayar.alisveris) && (plan.ayar.alisveris as unknown[]).length >= 5)
    assert.ok(PAKET_DEMO_SAC_EKIMI.moduller.every((m) => m.kod.startsWith('sac-')))
    assert.ok(PAKET_DEMO_SAC_EKIMI.moduller.find((m) => m.kod === 'sac-zaman')!.zaman!.some((a) => a.durum === 'sirada'))
    assert.ok(PAKET_DEMO_ESTETIK_CERRAHI.moduller.every((m) => m.kod.startsWith('cer-')))
    assert.ok(PAKET_DEMO_ESTETIK_CERRAHI.moduller.find((m) => m.kod === 'cer-gunluk')!.icerik.alanlar!.some((a) => a.id === 'dren'), 'dren field shown when the surgeon set "dren var"')
  })
})
