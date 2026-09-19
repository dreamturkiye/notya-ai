import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  acilTara, hekimOnayiGerekliMi, intakeAcilKodlari,
  ACIL_KODLARI, ACIL_KONTROL_LISTESI, HASTA_ACIL_METNI, INTAKE_ACIL_SECENEKLERI,
} from '@/specialties/kulak-burun-bogaz/engines/acil'
import { ACIL_YONLENDIRME_METNI } from '@/specialties/kulak-burun-bogaz/engines/kbb'
import { hastaDiliTemizMi } from '@/specialties/kulak-burun-bogaz/engines/portal-kulaklarim'

const kok = path.join(import.meta.dirname, '../../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')

describe('KBB-EXCEPTIONAL-01 kırmızı bayrak kapısı', () => {
  it('catches every red flag from free-text complaints', () => {
    const ornekler: Array<[string, string]> = [
      ['Sabah kalktığımda duymuyorum, ani işitme kaybı oldu', 'ani_isitme_kaybi'],
      ['Tek kulağımda birden duyma azaldı', 'tek_tarafli_ani_kayip'],
      ['Burun kanamam yarım saattir durmuyor', 'epistaksis_kontrolsuz'],
      ['Boğazım şişti, nefes darlığı var ve yutamıyorum', 'hava_yolu'],
      ['Baş dönmesi ile birlikte çift görme başladı', 'vertigo_noro'],
      ['Yüzüme darbe aldım, burnum kırık olabilir', 'travma'],
    ]
    for (const [metin, kod] of ornekler) {
      const b = acilTara([metin])
      assert.ok(b.some((x) => x.kod === kod), `"${metin}" → ${kod} bulunmadı`)
    }
  })

  it('Turkish uppercase İ / I does not slip past the scanner', () => {
    assert.ok(acilTara(['İŞİTME KAYBI ANİ BAŞLADI'.replace('İŞİTME KAYBI ANİ', 'Ani işitme kaybı')]).length)
    assert.ok(acilTara(['ANİ İŞİTME KAYBI var']).some((x) => x.kod === 'ani_isitme_kaybi'))
    assert.ok(acilTara(['BURUN KANAMASI DURMUYOR']).some((x) => x.kod === 'epistaksis_kontrolsuz'))
    assert.ok(acilTara(['BAŞ DÖNMESİ İLE BİRLİKTE ÇİFT GÖRME']).some((x) => x.kod === 'vertigo_noro'))
  })

  it('stays quiet on ordinary ENT complaints (no false red flag)', () => {
    for (const m of [
      'İki haftadır burnum tıkalı, geceleri horluyorum',
      'Sağ kulağımda hafif çınlama var, uzun süredir böyle',
      'Boğaz ağrım var, yutkunurken acıyor',
      'Kulağımda dolgunluk hissi, uçuştan sonra başladı',
      '',
    ]) assert.equal(acilTara([m]).length, 0, m)
  })

  it('every flag is "hemen" and forces physician sign-off', () => {
    for (const k of ACIL_KODLARI) {
      const b = acilTara([], [k.kod])
      assert.equal(b.length, 1, k.kod)
      assert.equal(b[0].oncelik, 'hemen', k.kod)
      assert.ok(hekimOnayiGerekliMi(b), k.kod)
    }
    assert.equal(hekimOnayiGerekliMi([]), false)
  })

  it('doctor-marked codes merge with free text and never duplicate', () => {
    const b = acilTara(['Burun kanamam durmuyor'], ['epistaksis_kontrolsuz', 'travma'])
    assert.equal(b.length, 2)
    assert.equal(new Set(b.map((x) => x.kod)).size, 2)
  })

  it('intake labels map 1:1 to codes and match lib/intake/bransSorulari.ts', () => {
    assert.equal(INTAKE_ACIL_SECENEKLERI.length, ACIL_KODLARI.length)
    assert.deepEqual(
      INTAKE_ACIL_SECENEKLERI.map((s) => s.kod).sort(),
      ACIL_KODLARI.map((k) => k.kod).sort(),
    )
    const intake = oku('lib/intake/bransSorulari.ts')
    const blok = intake.slice(intake.indexOf("'kulak-burun-bogaz'"), intake.indexOf("'kulak-burun-bogaz'") + 4000)
    for (const s of INTAKE_ACIL_SECENEKLERI) assert.ok(blok.includes(s.etiket), `intake eksik: ${s.etiket}`)
    assert.match(blok, /acilBelirtilerKbb/)
    assert.match(blok, /112/)
  })

  it('intakeAcilKodlari reads checked labels and ignores "Yok" / unknown', () => {
    assert.deepEqual(intakeAcilKodlari(['Durdurulamayan burun kanaması']), ['epistaksis_kontrolsuz'])
    assert.deepEqual(intakeAcilKodlari(['Yok']), [])
    assert.deepEqual(intakeAcilKodlari(['saçma değer']), [])
    assert.deepEqual(intakeAcilKodlari(null), [])
    assert.deepEqual(
      intakeAcilKodlari(['Aniden başlayan işitme kaybı', 'Baş, yüz veya boyun bölgesine darbe / travma']),
      ['ani_isitme_kaybi', 'travma'],
    )
  })

  it('patient-facing emergency text sends to 112 and carries no diagnosis or dose', () => {
    assert.match(HASTA_ACIL_METNI, /112/)
    assert.ok(hastaDiliTemizMi(HASTA_ACIL_METNI))
    assert.doesNotMatch(HASTA_ACIL_METNI, /\bmg\b|\bmL\b/)
    assert.match(ACIL_YONLENDIRME_METNI, /112/)
  })

  it('action texts route to 112 / acil and never prescribe', () => {
    for (const k of ACIL_KODLARI) {
      const b = acilTara([], [k.kod])[0]
      assert.match(b.eylem, /112|acil/i, k.kod)
      assert.doesNotMatch(b.eylem, /\bmg\b|\bmL\b|günde \d|damla \d/i, k.kod)
    }
  })

  it('clinician checklist has no auto-close and no dose', () => {
    assert.ok(ACIL_KONTROL_LISTESI.length >= 6)
    for (const m of ACIL_KONTROL_LISTESI) assert.doesNotMatch(m, /\bmg\b|\bmL\b|otomatik/i, m)
  })

  it('API refuses to store an open red flag without hekimOnay (409)', () => {
    const rota = oku('app/api/doktor/kulak-burun-bogaz/route.ts')
    assert.match(rota, /hekimOnayiGerekliMi\(bayraklar\) && b\.hekimOnay !== true/)
    assert.match(rota, /status: 409/)
    assert.match(rota, /hastaSahibiMi\(sb, user\.id, patientId\)/)
  })
})
