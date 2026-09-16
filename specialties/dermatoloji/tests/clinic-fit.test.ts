import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  aktifIslerFromClinic,
  belgeAnalizHref,
  belgeHekimOnayli,
  fototerapiChip,
  gopChip,
  goruntulemeCaptureHref,
  latestScores,
  nextPhotoCue,
  skorOzeti,
  tbseCue,
  timepointLabel,
  unitChecklist,
  yamaChip,
} from '../engines/clinic-fit'
import { kararKartlariFromClinic } from '../protocols/karar-kartlari'
import { payloadFromDermApi, payloadFromGoruntuleme, gopBlockFromPayload } from '../../../lib/specialties/dermatoloji-live'
import { gopIsotretinoin } from '../engines/gop-isotretinoin'
import { SOLARIUM_FORBIDDEN, PHOTO_DEVICES } from '../engines/phototherapy-log'
import { euromelanomaMonth, KETEM_IS_NOT_SKIN_CANCER, KETEM_HINTS } from '../engines/screening-reminders'
import { genitalOrChildBlocked } from '../imaging/consent-kvkk'
import { VISION_DISCLAIMER, uzmanOnay, analyzeImage } from '../imaging/vision-tools'
import { profileForUnit } from '../protocols/clinic-units'
import { acitretinPregnancyBanYears } from '../engines/gop-isotretinoin'
import { dermatolojiPayloadSchema } from '../schema'

const ROOT = join(import.meta.dirname, '..')

describe('derm clinic-fit', () => {
  it('does not invent Fitzpatrick III when stored state is empty', () => {
    const payload = payloadFromGoruntuleme('p-deri', [
      { id: 'img-1', modalite: 'diger', vucut_bolgesi: 'elbow-L', goruntuleme_tarihi: '2026-01-10' },
      { id: 'img-2', modalite: 'dermatoskopi', vucut_bolgesi: 'elbow-L', goruntuleme_tarihi: '2026-04-10' },
    ], '2026-04-10')
    assert.equal(payload.patient_derm.fitzpatrick, undefined)
    assert.equal(payload.gop, undefined)
    assert.equal(payload.photos[0]?.genital_consent, false)
    assert.equal(payload.photos[1]?.kind, 'dermoskopi_polarize')
    assert.equal(payload.image_series[0]?.timepoints[0]?.label, 'month-0')
    assert.equal(payload.image_series[0]?.timepoints[1]?.label, 'month-3')
  })

  it('stored clinic state wins over görüntüleme overlay for GÖP, scores, unit', () => {
    const payload = payloadFromDermApi('p-deri', {
      kayit: {
        id: 'ep-1',
        unit: 'psoriasis',
        visit_type: 'yandal',
        patient_derm: { fitzpatrick: 'IV', occupation: 'öğretmen', phototype: 'IV', atopic: true, family_atopy: false },
        gop: {
          two_contraception: true,
          hcg_iso: '2026-04-08',
          hcg_negative: true,
          cycle_day: 2,
          rx_days: 30,
          start_iso: '2026-04-10',
        },
        last_tbse_iso: '2026-01-01',
      },
      lezyonlar: [{ id: 'L-db', region: 'elbow-L', morphology: 'plaque', body_map_node: 'extensor-L' }],
      skorlar: [{ recorded_at: '2026-04-10', pasi: 12.9, dlqi: 11 }],
      goruntulemeler: [
        { id: 'img-1', modalite: 'derm', vucut_bolgesi: 'elbow-L', goruntuleme_tarihi: '2026-01-10' },
      ],
      fotoMeta: [{ core_image_id: 'img-1', lesion_id: 'L-db', genital_consent: true, kind: 'klinik_yakin' }],
    }, '2026-04-10')
    assert.equal(payload.unit, 'psoriasis')
    assert.equal(payload.patient_derm.fitzpatrick, 'IV')
    assert.equal(payload.gop?.two_contraception, true)
    assert.equal(payload.score_snapshots?.[0]?.pasi, 12.9)
    assert.equal(payload.lesions[0]?.id, 'L-db')
    assert.equal(payload.photos[0]?.kind, 'klinik_yakin')
    assert.equal(payload.photos[0]?.genital_consent, true)
    const gop = gopBlockFromPayload(payload, '2026-04-10', 'female')
    assert.equal(gop.allowed, true)
  })

  it('unit switcher has 13 clinic units driving checklists', () => {
    assert.equal(unitChecklist('genel').length > 5, true)
    assert.ok(unitChecklist('psoriasis').includes('PASI'))
    assert.ok(unitChecklist('kontakt-yama').includes('D2'))
    assert.equal(profileForUnit('nevus-tumor').id, 'nevus-tumor')
    const src = readFileSync(join(ROOT, 'protocols', 'clinic-units.ts'), 'utf8')
    assert.equal((src.match(/id: '/g) || []).length, 13)
  })

  it('sticky chips, GÖP sex-aware, yama/fototerapi, TBSE Euromelanoma — KETEM is not skin', () => {
    assert.equal(skorOzeti({ recorded_at: '2026-04-10', pasi: 12.9, dlqi: 11 }), 'PASI 12.9 · DLQI 11')
    assert.equal(skorOzeti(null), '—')
    assert.match(gopChip(null, '2026-04-10', 'female'), /eksik/)
    assert.match(gopChip(null, '2026-04-10', 'male'), /erkek|reçete/i)
    assert.equal(yamaChip(null, '2026-04-10'), 'Yama yok')
    assert.match(fototerapiChip([]), /solaryum yok/)
    assert.equal(euromelanomaMonth(), 5)
    assert.equal(KETEM_IS_NOT_SKIN_CANCER, true)
    assert.deepEqual([...KETEM_HINTS], ['breast', 'cervix', 'colon'])
    assert.match(tbseCue(null, '2026-05-10'), /Euromelanoma/)
    assert.equal(nextPhotoCue('2026-04-01', '2026-04-10').includes('vadesi'), true)
    assert.equal(timepointLabel(0, '2026-01-10', '2026-01-10', 0), 'month-0')
    assert.equal(timepointLabel(1, '2026-04-10', '2026-01-10', 90), 'month-3')
  })

  it('aktif işler flags missing PASI, overdue patch, TBSE, genital lock', () => {
    const isler = aktifIslerFromClinic({
      unit: 'psoriasis',
      todayIso: '2026-04-10',
      scores: null,
      patch: null,
      sessions: [],
      lastTbseIso: null,
      gopAllowed: false,
      sex: 'female',
      photos: [],
    })
    assert.ok(isler.some((i) => i.id === 'pasi'))
    const yama = aktifIslerFromClinic({
      unit: 'kontakt-yama',
      todayIso: '2026-04-10',
      scores: null,
      patch: { series: 'european_baseline', appliedAt: '2026-04-01', readD2: null, readD4: null, photoIds: [], positives: [] },
      sessions: [],
      lastTbseIso: null,
      gopAllowed: true,
      sex: 'male',
      photos: [{
        id: 'p1', coreImageId: 'p1', kind: 'klinik_yakin', lesionId: 'L1', capturedAt: '2026-04-10',
        region: 'vulva', genital_consent: false, pediatric_consent: false, education_anonymized: false, patient_share: false,
      }],
    })
    assert.ok(yama.some((i) => i.id === 'yama-d2' || i.id === 'yama-d4'))
    assert.ok(yama.some((i) => i.id === 'genital-onam'))
  })

  it('GÖP male N/A, acitretin 3y, rx ≤30; no English block strings', () => {
    const male = gopIsotretinoin({
      two_contraception: false, hcg_iso: null, hcg_negative: false, cycle_day: null,
      rx_days: 30, start_iso: '2026-04-10', today_iso: '2026-04-10', sex: 'male',
    })
    assert.equal(male.allowed, true)
    assert.equal(acitretinPregnancyBanYears(), 3)
    const over = gopIsotretinoin({
      two_contraception: true, hcg_iso: '2026-04-08', hcg_negative: true, cycle_day: 2,
      rx_days: 45, start_iso: '2026-04-10', today_iso: '2026-04-10', sex: 'female',
    })
    assert.equal(over.allowed, false)
    if (!over.allowed) assert.equal(over.blocks.some((b) => /two contraception/i.test(b)), false)
  })

  it('phototherapy forbids solarium; SUT hint via karar kartı dual columns', () => {
    assert.equal(SOLARIUM_FORBIDDEN, true)
    assert.equal((PHOTO_DEVICES as readonly string[]).includes('solarium'), false)
    const kartlar = kararKartlariFromClinic({ unit: 'fototerapi', photoDevice: 'nb-uvb-311' })
    const ft = kartlar.find((k) => k.id === 'fototerapi-sut')
    assert.ok(ft)
    assert.equal(ft!.conflict, true)
    assert.match(ft!.sagBaslik, /Solaryum/)
    const ketem = kararKartlariFromClinic({ unit: 'nevus-tumor', uglyDuckling: true, month: 5 })
    const tbse = ketem.find((k) => k.id === 'tbse-euromelanoma')
    assert.ok(tbse)
    assert.ok(tbse!.sag.some((s) => /KETEM deri kanseri tarama programı değildir/.test(s)))
    assert.ok(tbse!.sol.some((s) => /Euromelanoma/.test(s)))
  })

  it('PSOKİD vs SUT biologic card does not invent IU doses', () => {
    const kartlar = kararKartlariFromClinic({ unit: 'psoriasis', pasi: 12.9, dlqi: 11, tbScreen: false, hbvScreen: false })
    const k = kartlar.find((x) => x.id === 'psoriyazis-basamak')
    assert.ok(k)
    assert.equal(k!.conflict, true)
    assert.match(JSON.stringify(k), /Doz uydurulmaz/)
    assert.equal(/IU|mg\/kg/i.test(JSON.stringify(k)), false)
  })

  it('vision dual-sign: asistan cannot self-approve; disclaimer literal', () => {
    const draft = analyzeImage({ assetIds: ['img-1'], task: 'morfoloji', actor: 'asistan', observations: '' })
    assert.equal(draft.status, 'draft')
    assert.equal(draft.disclaimer, VISION_DISCLAIMER)
    const blocked = uzmanOnay(draft, 'asistan')
    assert.equal(blocked.ok, false)
    const ok = uzmanOnay(draft, 'uzman')
    assert.equal(ok.ok, true)
    if (ok.ok) assert.equal(ok.read.status, 'onayli')
  })

  it('genital photo without consent is blocked; belge deep-links carry modality', () => {
    assert.equal(genitalOrChildBlocked({
      id: 'p', coreImageId: 'p', kind: 'klinik_yakin', lesionId: 'L1', capturedAt: '2026-04-10',
      region: 'vulva', genital_consent: false, pediatric_consent: false, education_anonymized: false, patient_share: false,
    }), true)
    assert.equal(genitalOrChildBlocked({
      id: 'p', coreImageId: 'p', kind: 'klinik_yakin', lesionId: 'L1', capturedAt: '2026-04-10',
      region: 'vulva', genital_consent: true, pediatric_consent: false, education_anonymized: false, patient_share: false,
    }), false)
    assert.match(goruntulemeCaptureHref('hasta-1', 'dermatoskopi'), /modalite=dermatoskopi/)
    assert.match(goruntulemeCaptureHref('hasta-1', 'dermatoskopi'), /upload=1/)
    assert.match(belgeAnalizHref('hasta-1', 'belge-9', 'dermatoskopi', 'IV'), /modalityFinal=dermatoskopi/)
    assert.match(belgeAnalizHref('hasta-1', 'belge-9', 'dermatoskopi', 'IV'), /fitzpatrick=IV/)
    assert.equal(belgeHekimOnayli('taslak'), false)
    assert.equal(belgeHekimOnayli('onaylandi'), true)
  })

  it('payload schema accepts optional scores and phototherapy sessions', () => {
    const r = dermatolojiPayloadSchema.safeParse({
      ...payloadFromGoruntuleme('p', []),
      score_snapshots: [{ recorded_at: '2026-04-10', pasi: 8, easi: 4, dlqi: 3 }],
      phototherapy_sessions: [{ date: '2026-04-10', device: 'nb-uvb-311', j_cm2: 0.4 }],
    })
    assert.equal(r.success, true)
  })

  it('latest score snapshot is the newest date', () => {
    const s = latestScores([
      { recorded_at: '2026-01-01', pasi: 20 },
      { recorded_at: '2026-04-10', pasi: 8 },
    ])
    assert.equal(s?.pasi, 8)
  })

  it('visit-first shell, sticky strip, belge AI, units and bridges are wired in source', () => {
    const shell = readFileSync(join(ROOT, '..', '..', 'components', 'doktor', 'HastaDermatoloji.tsx'), 'utf8')
    const strip = readFileSync(join(ROOT, 'ui', 'StickyDermStrip.tsx'), 'utf8')
    const aktif = readFileSync(join(ROOT, 'ui', 'AktifIsler.tsx'), 'utf8')
    const api = readFileSync(join(ROOT, '..', '..', 'app', 'api', 'doktor', 'dermatoloji', 'route.ts'), 'utf8')
    const mig = readFileSync(join(ROOT, '..', '..', 'lib', 'db', 'migrations', '027_derm_clinic_fit.sql'), 'utf8')
    assert.match(strip, /Bugünkü muayene/)
    assert.match(strip, /sticky-strip/)
    assert.match(aktif, /Aktif işler/)
    assert.match(shell, /UniteSecici/)
    assert.match(shell, /BeforeAfterCompare/)
    assert.match(shell, /SeriesTimepoints/)
    assert.match(shell, /BelgeAnalizOzet/)
    assert.match(shell, /Belgelerde analiz et/)
    assert.match(shell, /Asistana raporla/)
    assert.match(shell, /OnamPaneli/)
    assert.match(shell, /UnitePanelleri/)
    assert.match(shell, /KararKartlari/)
    assert.match(shell, /action: 'klinik'/)
    assert.match(shell, /action: 'fototerapi-seans'/)
    assert.match(shell, /action: 'yama'/)
    assert.match(shell, /action: 'vision'/)
    assert.match(shell, /actor="uzman"/)
    assert.match(api, /action === 'klinik'/)
    assert.match(api, /fototerapi-seans/)
    assert.match(api, /Solaryum yasaktır/)
    assert.match(api, /belge_analizleri/)
    assert.match(api, /hasta_derm/)
    assert.match(mig, /027_derm_clinic_fit/)
    assert.match(mig, /hasta_derm/)
    assert.match(mig, /derm_foto_meta/)
    assert.match(mig, /specialty_records.payload is still not a store|NOT specialty_records/)
    const units = readFileSync(join(ROOT, 'ui', 'UnitePanelleri.tsx'), 'utf8')
    assert.match(units, /Form 014/)
    assert.match(units, /Pediatri dosyasına foto devri/)
    assert.match(units, /Ayakta Teşhis/)
    assert.match(units, /DIF/)
    assert.match(units, /derm-kadin-dogum|Kadın sağlığı/)
    assert.equal(/solarium/.test(shell), false)
    assert.equal(/PhishSim|LinkedIn/.test(shell), false)
  })
})
