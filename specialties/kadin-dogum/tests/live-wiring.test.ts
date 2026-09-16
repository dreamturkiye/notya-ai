import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { specialtyProfile } from '../../../lib/specialties/registry'
import { chapterCalendar, payloadFromGebelikApi, usgStudiesFromIzlemler } from '../../../lib/specialties/kadin-dogum-live'
import { gopBlockFromPayload, payloadFromGoruntuleme } from '../../../lib/specialties/dermatoloji-live'
import { kadinDogumPayloadSchema } from '../schema'

const ROOT = join(import.meta.dirname, '..')

describe('live chapter wiring', () => {
  it('registry serves kadin-dogum and dermatoloji chapters, not baseline', () => {
    const kd = specialtyProfile('kadin-hastaliklari-dogum')
    assert.equal(kd.olgunluk, 'arastirma')
    assert.ok(kd.sekmeler.some((s) => s.bilesen === 'HastaGebelik'))
    assert.ok(kd.sekmeler.some((s) => s.bilesen === 'GebeKarti'))
    assert.ok(kd.ekKaynaklar.some((k) => k.includes('ACOG')))

    const alias = specialtyProfile('kadin-dogum')
    assert.equal(alias.key, 'kadin-hastaliklari-dogum')

    const derm = specialtyProfile('dermatoloji')
    assert.notEqual(derm.olgunluk, 'baseline')
    assert.ok(derm.sekmeler.some((s) => s.bilesen === 'HastaDermatoloji'))
    assert.ok(derm.goruntu?.modaliteler.includes('dermatoskopi'))
  })

  it('HastaKdChapter mounts GebeKarti and dual-calendar IzlemTimeline', () => {
    const src = readFileSync(join(ROOT, '..', '..', 'components', 'doktor', 'HastaKdChapter.tsx'), 'utf8')
    assert.match(src, /GebeKarti/)
    assert.match(src, /IzlemTimeline/)
    assert.match(src, /UsgGallery/)
    assert.match(src, /AsistanGorselPanel/)
  })

  it('HastaGebelik keeps active episodes out of Önceki Gebelikler and uses controlled start/izlem forms', () => {
    const src = readFileSync(join(ROOT, '..', '..', 'components', 'doktor', 'HastaGebelik.tsx'), 'utf8')
    assert.match(src, /TaburcuPaketi/)
    assert.match(src, /LohusaPaketi/)
    assert.match(src, /oncekiGebelikleriFiltrele\(veri\.gecmis,\s*veri\.gebelik\)/)
    assert.match(src, /Yok/)
    assert.match(src, /yerelIsoTarih/)
    assert.match(src, /set\(\(prev\) =>/)
    assert.doesNotMatch(src, /: 'Sonlandı'/)
    const api = readFileSync(join(ROOT, '..', '..', 'app', 'api', 'doktor', 'gebelik', 'route.ts'), 'utf8')
    assert.match(api, /oncekiGebelikleriFiltrele\(gecmisHam,\s*gebelik\)/)
    assert.match(api, /ayniGebelikBolumu/)
    assert.doesNotMatch(api, /\.in\('durum', \['aktif', 'gebe'\]\)/)
  })

  it('hasta dosyası gates pediatric tabs by age like KD is gated by sex', () => {
    const src = readFileSync(join(ROOT, '..', '..', 'app', 'dashboard', 'doktor', 'hastalar', '[id]', 'page.tsx'), 'utf8')
    assert.match(src, /pediatriSekmesiUygun/)
    assert.match(src, /hastaDosyaSekmeleri/)
    assert.match(src, /cinsiyet=\{patient\?\.cinsiyet\}/)
  })

  it('Asistan panels are not identical files', () => {
    const kd = readFileSync(join(ROOT, 'ui', 'AsistanGorselPanel.tsx'), 'utf8')
    const derm = readFileSync(join(ROOT, '..', 'dermatoloji', 'ui', 'AsistanGorselPanel.tsx'), 'utf8')
    assert.notEqual(kd, derm)
    assert.match(kd, /Ölçüm ve tarama desteği, tanı değildir\. Uzman onayı gerekir\./)
    assert.match(derm, /Tarama desteği, tanı değildir\. Doktor onayı gerekir\./)
    const timeline = readFileSync(join(ROOT, 'ui', 'IzlemTimeline.tsx'), 'utf8')
    assert.match(timeline, /Yasal \(DÖBYR\)/)
    assert.match(timeline, /Klinik \(ACOG\)/)
    assert.match(timeline, /Yasal asgari \(DÖBYR\)/)
    assert.match(timeline, /Klinik öneri \(ACOG\)/)
    const gebe = readFileSync(join(ROOT, 'ui', 'GebeKarti.tsx'), 'utf8')
    assert.doesNotMatch(gebe, /SAT \(payload\)/)
    assert.doesNotMatch(gebe, /Episode \{payload\.episode_id\}/)
  })

  it('gebelik API adapter keeps SAT on the specialty payload', () => {
    const payload = payloadFromGebelikApi('p-anne', {
      gebelik: {
        id: 'g-1',
        sat: '2026-01-15',
        tdt: '2026-10-22',
        tdt_kaynak: 'sat',
        gravida: 1,
        para: 0,
        abortus: 0,
        yasayan: 0,
        rh_negatif: false,
        durum: 'aktif',
        dogum_tarihi: null,
      },
      yas: { hafta: 12, gun: 0 },
      izlemler: [{
        id: 'iz-20',
        hafta: 20,
        usg: { bpd: 48, hc: 175, ac: 150, fl: 33 },
      }],
    })
    assert.ok(payload)
    assert.equal(payload?.sat, '2026-01-15')
    assert.equal(payload?.specialty, 'kadin-dogum')
    assert.equal(kadinDogumPayloadSchema.safeParse(payload).success, true)
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'child_patient_id'), false)
    assert.equal(payload?.usg_series?.studies[0]?.coreImageId, 'iz-20')
    assert.equal(payload?.usg_series?.studies[0]?.kind, 'ayrintili_18_22')
    assert.equal(payload?.episode_status, 'gebe')
  })

  it('maps specialty status gebe as an active episode, not kapandi', () => {
    const payload = payloadFromGebelikApi('p-anne', {
      gebelik: {
        id: 'g-live',
        sat: '2026-04-28',
        tdt: '2027-02-02',
        tdt_kaynak: 'sat',
        gravida: 1,
        para: 0,
        abortus: 0,
        yasayan: 0,
        rh_negatif: false,
        durum: 'gebe',
        dogum_tarihi: null,
      },
      yas: { hafta: 20, gun: 0 },
    })
    assert.ok(payload)
    assert.equal(payload?.episode_status, 'gebe')
    assert.notEqual(payload?.episode_status, 'kapandi')
  })

  it('live dual calendar at 30w keeps sb_required and acog_recommended uncollapsed', () => {
    const payload = payloadFromGebelikApi('p-anne', {
      gebelik: {
        id: 'g-1',
        sat: '2026-01-15',
        tdt: '2026-10-22',
        tdt_kaynak: 'sat',
        gravida: 1,
        para: 0,
        abortus: 0,
        yasayan: 0,
        rh_negatif: false,
        durum: 'aktif',
        dogum_tarihi: null,
      },
      yas: { hafta: 30, gun: 0 },
    })
    assert.ok(payload)
    const cal = chapterCalendar(payload!, 10)
    const at30 = cal.filter((v) => Math.abs(v.ga_or_pp_day - 30) <= 1)
    assert.ok(at30.some((v) => v.sb_required))
    assert.ok(at30.some((v) => v.acog_recommended && v.sb_required === false))
  })

  it('görüntüleme adapter stores coreImageId only and builds series + GÖP block', () => {
    const payload = payloadFromGoruntuleme('p-deri', [
      { id: 'img-1', modalite: 'diger', vucut_bolgesi: 'elbow-L', goruntuleme_tarihi: '2026-01-10' },
      { id: 'img-2', modalite: 'dermatoskopi', vucut_bolgesi: 'elbow-L', goruntuleme_tarihi: '2026-04-10' },
    ], '2026-04-10')
    assert.equal(payload.specialty, 'dermatoloji')
    assert.equal(payload.photos[0]?.coreImageId, 'img-1')
    assert.equal(payload.lesions.length, 1)
    assert.equal(payload.image_series.length, 1)
    assert.equal(payload.before_after.length, 1)
    assert.equal(payload.before_after[0]?.intervalDays, 90)
    const gop = gopBlockFromPayload(payload, '2026-04-10')
    assert.equal(gop.allowed, false)
    if (!gop.allowed) assert.ok(gop.blocks.some((b) => /hcg|β-hcg/i.test(b)))
    const maleGop = gopBlockFromPayload(payload, '2026-04-10', 'male')
    assert.equal(maleGop.allowed, true)
    assert.ok(maleGop.notApplicable?.some((s) => /kontrasepsiyon/i.test(s)))
    assert.equal(JSON.stringify(maleGop).toLowerCase().includes('two contraception'), false)
  })

  it('usg mapper never invents a second blob store', () => {
    const studies = usgStudiesFromIzlemler([
      { id: 'iz-1', hafta: 32, usg: { efw: 1800, kind: '3d4d' } },
    ], 'sat')
    assert.equal(studies[0]?.coreImageId, 'iz-1')
    assert.equal(studies[0]?.kind, '3d4d_hatira')
    assert.equal(studies[0]?.nonDiagnostic, true)
  })
})
