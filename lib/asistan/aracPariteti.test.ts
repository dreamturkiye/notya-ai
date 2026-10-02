/**
 * NOTYA-AYSE-ARAC-PARITE-03 — a prompt may not name a tool the model was not given.
 *
 * Root cause of the 2026-09-25 regression class: the prompt rules lived on (in lib/asistan/personaEngine.ts and in the
 * branch locks) while the tools they name left the single brain. This test reads every snake_case name the prompts
 * carry and requires each one to be either
 *   • OFFERED by the single brain — taken from the tool lists of REAL model requests of /api/asistan/chat, or
 *   • in SUNULMAYAN_ARACLAR, the explicit allow-list, with the written reason it is not a model tool, or
 *   • in ARAC_OLMAYAN, a snake_case word that is not a tool at all (a field, a value, a table name).
 * A new tool name in a prompt with none of the three fails here. So does an allow-list entry nobody names any more.
 */
import { ortam, sahneHazirla, sahneKur, oturumAc, yazi, sonModelIstegi, sunulanAraclar, encrypt } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gercekciHastaEkle, GERCEKCI_HASTA_ADI as D } from './tests/gercekciHasta'
import { PERSONAS, buildSystemPrompt, buildVoiceSystemPrompt, HASTA_BUL_KURALI, RANDEVU_TAKVIM_KURALI } from './personaEngine'
import { OKUMA_ARACI_BLOGU, OKUMA_ARACLARI } from './okumaAraclari'
import { EYLEM_ISTEM_BLOGU } from '../../core/eylemler/istem'
import { kadinDogumKilidi } from '../../specialties/kadin-dogum/prompts'
import { dermatolojiKilidi } from '../../specialties/dermatoloji/prompts'

const SNAKE = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g
const adlar = (metin: string): Set<string> => new Set(metin.match(SNAKE) || [])

/**
 * Tools a prompt names that the single brain does NOT offer under that name — and why that is right.
 * All three are named only by the voice prompt of the ElevenLabs path (buildVoiceSystemPrompt), whose model has them
 * as client tools; the single brain never sends that prompt.
 */
export const SUNULMAYAN_ARACLAR: Record<string, string> = {
  dosyaya_kayit_hazirla: 'Replaced in the single brain by one tool per action under the action’s own key (asi_kaydi_ekle, ilac_ekle, kontrol_randevusu_olustur … — core/eylemler/araclar.ts, slice S3). Same executor (oneriHazirla), draft card only.',
  eylem_onayla: 'A spoken "Evet / Onaylıyorum" is not a model turn: lib/asistan/sesliOnay.ts runs it before the brain on both voice routes. The model must not be able to commit a record (core/eylemler/tests/sessizYol.test.ts).',
  eylem_vazgec: 'Same as eylem_onayla: a spoken "Hayır / vazgeç" is handled by lib/asistan/sesliOnay.ts outside the model turn.',
}

/** snake_case words in the prompt sources that are not tools. */
const ARAC_OLMAYAN: Record<string, string> = {
  doctor_preferences: 'a database table named in a code comment of personaEngine.ts; never sent to the model',
  doktor_soyledi: 'provenance value of a card field (EYLEM_ISTEM_BLOGU rule 3)',
  analyze_image: 'named by the Kadın Hastalıkları ve Doğum / Dermatoloji locks as an internal name the model must NOT write',
  uzman_onayli: 'named by the same locks as an internal field name the model must NOT write',
}

let sunulan = new Set<string>()

before(async () => {
  await sahneHazirla()
  // Every class of turn that carries tools, through the real chat handler.
  const s = sahneKur()
  const hasta = gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
  const topla = () => { for (const a of sunulanAraclar(sonModelIstegi())) sunulan.add(a) }
  await yazi(s, 'En çok hangi şikayetle geldi', { oturum: oturumAc(s, { id: hasta, ad: D }) }); topla() // chart open, question
  await yazi(s, 'Geçen ay en yoğun günüm hangisiydi?', { oturum: oturumAc(s) }); topla()                  // no chart, question
  await yazi(s, 'Ali Yılmaz için randevu oluştur', { oturum: oturumAc(s) }); topla()                     // no chart, command
})

describe('araç paritesi — istemde adı geçen her araç tek beyinde sunulur', () => {
  const kaynak = readFileSync(new URL('./personaEngine.ts', import.meta.url), 'utf8')
  const istemler = Object.values(PERSONAS).flatMap((p) => [buildSystemPrompt(p, null, null), buildVoiceSystemPrompt(p)])
  /** personaEngine.ts (source and every prompt it builds) plus the blocks the single brain appends about tools. */
  const metin = [kaynak, ...istemler, HASTA_BUL_KURALI, RANDEVU_TAKVIM_KURALI, OKUMA_ARACI_BLOGU, EYLEM_ISTEM_BLOGU, kadinDogumKilidi('asistan').split('\n').filter((l) => l.includes('hasta_bul') || l.includes('analyze_image')).join('\n'), dermatolojiKilidi('asistan').split('\n').filter((l) => l.includes('hasta_bul') || l.includes('analyze_image')).join('\n')].join('\n')
  const gecen = adlar(metin)

  it('tek beyin okuma araçlarını gerçekten sunuyor (gerçek model isteği)', () => {
    for (const a of OKUMA_ARACLARI) assert.ok(sunulan.has(a.name), `${a.name} hiçbir turda sunulmadı`)
    assert.ok(sunulan.has('kontrol_randevusu_olustur') && sunulan.has('alerji_ekle'), 'yazma araçları sunuluyor')
  })

  it('personaEngine.ts hasta_bul ve randevu_takvim’i adıyla söylüyor (test boşa koşmuyor)', () => {
    for (const a of ['hasta_bul', 'randevu_takvim', 'dosyaya_kayit_hazirla', 'eylem_onayla', 'eylem_vazgec', 'kontrol_randevusu_olustur']) assert.ok(adlar(kaynak).has(a), a)
  })

  it('istemde adı geçen her snake_case araç: sunuluyor, ya da gerekçeli izin listesinde', () => {
    const sahipsiz = [...gecen].filter((a) => !sunulan.has(a) && !(a in SUNULMAYAN_ARACLAR) && !(a in ARAC_OLMAYAN)).sort()
    assert.deepEqual(sahipsiz, [], `İstem bu aracı söylüyor ama tek beyin sunmuyor: ${sahipsiz.join(', ')}. Aracı lib/asistan/ayseCevapla.ts'te sunun, ya da lib/asistan/aracPariteti.test.ts içindeki SUNULMAYAN_ARACLAR listesine gerekçesiyle yazın.`)
  })

  it('izin listesi: her kaydın yazılı gerekçesi var, hâlâ istemde geçiyor ve sunulanlarla çakışmıyor', () => {
    for (const [ad, neden] of Object.entries(SUNULMAYAN_ARACLAR)) {
      assert.ok(neden.trim().length >= 40, `${ad}: gerekçe yok`)
      assert.ok(gecen.has(ad), `${ad}: artık hiçbir istemde geçmiyor — izin listesinden silin`)
      assert.ok(!sunulan.has(ad), `${ad}: artık sunuluyor — izin listesinden silin`)
    }
    for (const [ad, neden] of Object.entries(ARAC_OLMAYAN)) {
      assert.ok(neden.trim().length >= 20, `${ad}: açıklama yok`)
      assert.ok(gecen.has(ad), `${ad}: artık geçmiyor — listeden silin`)
    }
  })

  it('tek beynin kendi istemi (personaEngine metin istemi + kuyruk blokları) yalnız sunulan araçları söyler', () => {
    // What the single brain itself sends: the written prompt and its tail blocks — no allow-list here.
    const tekBeyin = [...Object.values(PERSONAS).map((p) => buildSystemPrompt(p, null, null)), OKUMA_ARACI_BLOGU, EYLEM_ISTEM_BLOGU].join('\n')
    const eksik = [...adlar(tekBeyin)].filter((a) => !sunulan.has(a) && !(a in ARAC_OLMAYAN)).sort()
    assert.deepEqual(eksik, [], `tek beyin istemi sunulmayan aracı söylüyor: ${eksik.join(', ')}`)
  })

  it('bekçi çalışıyor: uydurma bir araç adı yakalanır', () => {
    const sahte = adlar(`${metin}\nGerekirse lab_sonucu_getir aracını çağır.`)
    const sahipsiz = [...sahte].filter((a) => !sunulan.has(a) && !(a in SUNULMAYAN_ARACLAR) && !(a in ARAC_OLMAYAN))
    assert.deepEqual(sahipsiz, ['lab_sonucu_getir'])
  })
})
