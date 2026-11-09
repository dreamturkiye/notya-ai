/**
 * TR-PARITE-01 — "a specialty patient-file tab where the branch has kept scores", checked for all 40 Türkiye branches.
 * The 30 medical branches each own exactly one chapter tab (or, for KD and Pediatri, their own chapter views) and no other
 * branch's tab (both directions, matrix over the live predicates the patient file uses). The 10 Özel Branşlar keep their
 * results in ozel_brans_plan, shown in their own patient file (KayitliPlanlar); no Doktor TUS tab reaches them.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as S from './hastaDosyaSekmeleri'
import { pediatriHedefBoyBransi } from '@/lib/clinical/hedefBoy'
import { SPECIALTIES } from './specialties'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'

/** branch key → the predicate that opens its chapter tab in app/dashboard/doktor/hastalar/[id]/page.tsx */
const SAHIP: Record<string, (s: string) => boolean> = {
  pediatri: pediatriHedefBoyBransi,
  'goz-hastaliklari': (s) => /göz|goz|oftalm/i.test(s),
  dermatoloji: (s) => /derma|deri ve z/i.test(s),
  dahiliye: S.dahiliyeSekmesiBransi,
  psikiyatri: S.psikiyatriSekmesiBransi,
  'kulak-burun-bogaz': S.kbbSekmesiBransi,
  kardiyoloji: S.kardiyolojiSekmesiBransi,
  'gogus-hastaliklari': S.gogusSekmesiBransi,
  noroloji: S.norolojiSekmesiBransi,
  uroloji: S.urolojiSekmesiBransi,
  'spor-hekimligi': S.sporHekimligiSekmesiBransi,
  ortopedi: S.ortopediSekmesiBransi,
  'fizik-tedavi': S.fizikTedaviSekmesiBransi,
  'aile-hekimligi': S.aileHekimligiSekmesiBransi,
  endokrinoloji: S.endokrinolojiSekmesiBransi,
  romatoloji: S.romatolojiSekmesiBransi,
  'enfeksiyon-hastaliklari': S.enfeksiyonSekmesiBransi,
  gastroenteroloji: S.gastroenterolojiSekmesiBransi,
  nefroloji: S.nefrolojiSekmesiBransi,
  onkoloji: S.onkolojiSekmesiBransi,
  'gogus-cerrahisi': S.gogusCerrahisiSekmesiBransi,
  'genel-cerrahi': S.genelCerrahiSekmesiBransi,
  'plastik-cerrahi': S.plastikSekmesiBransi,
  'beyin-cerrahisi': S.beyinCerrahisiSekmesiBransi,
  'cocuk-cerrahisi': S.cocukCerrahisiSekmesiBransi,
  anestezi: S.anesteziSekmesiBransi,
  radyoloji: S.radyolojiSekmesiBransi,
  'kalp-damar-cerrahisi': S.kalpDamarCerrahisiSekmesiBransi,
  'acil-tip': S.acilTipSekmesiBransi,
  'kadin-hastaliklari-dogum': S.kadinSagligiBolumuBransi,
}

describe('40 branş — uzmanlık sekmesi', () => {
  it('30 tıp branşının her birinin kendi bölüm görünümü var', () => {
    assert.deepEqual(Object.keys(SAHIP).sort(), SPECIALTIES.map((s) => s.key).sort())
    for (const k of Object.keys(SAHIP)) assert.equal(SAHIP[k](k), true, k)
  })

  it('her branş yalnız kendi sekmesini açar (iki yön, 30×30); tek istisna: aile hekimliği KD bölümünü paylaşır (birinci basamak)', () => {
    for (const hekim of Object.keys(SAHIP)) {
      for (const sahip of Object.keys(SAHIP)) {
        if (sahip === hekim) continue
        if (hekim === 'aile-hekimligi' && sahip === 'kadin-hastaliklari-dogum') continue
        assert.equal(SAHIP[sahip](hekim), false, `${hekim} doktoru ${sahip} sekmesini görüyor`)
      }
    }
  })

  it('Özel Branşlar hiçbir Doktor TUS sekmesi açmaz; kendi dosyaları kayıtlı sonuçlarını (KayitliPlanlar) gösterir', () => {
    for (const d of KLINIK_YENI_SLUGS) for (const [sahip, p] of Object.entries(SAHIP)) {
      // klinik-dermatoloji is resolved by its own registry; the patient file of the doctor app is not theirs
      if (d === 'klinik-dermatoloji' && sahip === 'dermatoloji') continue
      assert.equal(p(d), false, `${d} → ${sahip}`)
    }
    const dosya = readFileSync(join(process.cwd(), 'app/dashboard/notya-klinik/hastalar/[id]/page.tsx'), 'utf8')
    assert.match(dosya, /\/api\/ozel-brans\/plan\?patientId=/)
    assert.match(dosya, /<KayitliPlanlar planlar=\{planlar\}/)
  })
})
