/**
 * AU-CANLI-01 — Australia's live spoken assistant: the two voices by persona gender, each role's own persona and
 * Australian sources in the prompt, the AU limits, English only, and a build that hides the feature until the agents exist.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { canliDurum } from '@/lib/ulke/asistan/ajan'
import { canliIstem } from '@/lib/ulke/asistan/istem'
import { AU_ARAYUZ } from '../arayuz'
import { AU_ASISTAN_ADLARI } from '../klinik/asistanAdlari'
import { AU_KLINIK } from '../klinik'
import { auAcilisGuncelle } from '../uzanti/acilisEk'
import { AU_SES } from '../ses'
import { AU_CANLI_ASISTAN } from './canli'
import { auAsistanKaynakBlogu } from './kaynaklar'

const D = 'en-AU' as const
const ROLLER = Object.keys(AU_ASISTAN_ADLARI)
const SIR = 'y'.repeat(32)
const ORTAM = { ELEVENLABS_API_KEY: 'k', ELEVENLABS_AGENT_AU_MALE: 'agent_0123456789abcdefghijklmn', ELEVENLABS_AGENT_AU_FEMALE: 'agent_abcdefghijklmn0123456789', NOTYA_SES_JETON_SECRET: SIR, NOTYA_SES_LLM_SECRET: SIR, NOTYA_AU_ASSISTANT_ENABLED: '1' }

describe('au live assistant', () => {
  it('is wired to the clinical half beside the two voices', () => {
    assert.equal(AU_KLINIK.canliAsistan, AU_CANLI_ASISTAN)
    assert.equal(AU_KLINIK.ses, AU_SES)
  })

  it('every role: male persona → Charlie, female persona → Clara, with the AU agent of that gender, and no third voice', () => {
    const kullanilan = new Set<string>()
    for (const rol of ROLLER) {
      const kimlik = AU_ARAYUZ.asistan(rol, D)!
      assert.equal(kimlik.cinsiyet, AU_ASISTAN_ADLARI[rol as keyof typeof AU_ASISTAN_ADLARI].cinsiyet, rol)
      const d = canliDurum({ kod: 'au', ses: AU_KLINIK.ses, canli: AU_KLINIK.canliAsistan, kimlik, ortam: ORTAM })
      assert.equal(d.hazir, true, rol)
      if (!d.hazir) continue
      kullanilan.add(d.sesId)
      assert.equal(d.sesId, kimlik.cinsiyet === 'erkek' ? 'IKne3meq5aSn9XLyUdCD' : 'tyepWYJJwJM9TTFIg5U7', rol)
      assert.equal(d.sesAdi, kimlik.cinsiyet === 'erkek' ? 'Charlie' : 'Clara', rol)
      assert.equal(d.ajan, kimlik.cinsiyet === 'erkek' ? ORTAM.ELEVENLABS_AGENT_AU_MALE : ORTAM.ELEVENLABS_AGENT_AU_FEMALE, rol)
    }
    assert.deepEqual([...kullanilan].sort(), ['IKne3meq5aSn9XLyUdCD', 'tyepWYJJwJM9TTFIg5U7'])
  })

  it('without the agents or the secrets nothing is offered (no broken microphone)', () => {
    const kimlik = AU_ARAYUZ.asistan('cardiology', D)!
    const d = (ortam: Record<string, string | undefined>) => canliDurum({ kod: 'au', ses: AU_KLINIK.ses, canli: AU_KLINIK.canliAsistan, kimlik, ortam })
    assert.equal(d({}).hazir, false)
    assert.equal(d({ ...ORTAM, ELEVENLABS_AGENT_AU_MALE: undefined }).hazir, false)
    assert.equal(d({ ...ORTAM, NOTYA_SES_LLM_SECRET: undefined }).hazir, false)
    assert.equal(d(ORTAM).hazir, true)
    // AU-LAUNCH-01: opt-in. Everything else present but the switch unset / off = not offered.
    assert.equal(d({ ...ORTAM, NOTYA_AU_ASSISTANT_ENABLED: undefined }).hazir, false)
    assert.equal(d({ ...ORTAM, NOTYA_AU_ASSISTANT_ENABLED: '0' }).hazir, false)
    assert.equal(d({ ...ORTAM, NOTYA_AU_ASSISTANT_ENABLED: 'true' }).hazir, true)
  })

  it('each role\'s prompt carries its own persona, its Australian sources and the AU limits — and nobody else\'s', () => {
    for (const rol of ROLLER) {
      const ad = AU_ASISTAN_ADLARI[rol as keyof typeof AU_ASISTAN_ADLARI]
      const istem = canliIstem({ canli: AU_CANLI_ASISTAN, tamAd: ad.tamAd, kisaAd: ad.kisaAd, rolAdi: rol, rol, acilNumara: '000' })
      assert.ok(istem.includes(ad.tamAd), rol)
      assert.ok(istem.includes('Australian English'), rol)
      assert.ok(istem.includes(auAsistanKaynakBlogu(rol)!), rol)
      assert.ok(istem.includes('AUSTRALIAN PRACTICE SOURCES (BINDING)'), rol)
      assert.ok(istem.includes('Triple Zero (000)') && istem.includes('The emergency number is 000.'), rol)
      for (const baska of ROLLER.filter((r) => r !== rol).slice(0, 6)) assert.ok(!istem.includes(AU_ASISTAN_ADLARI[baska as keyof typeof AU_ASISTAN_ADLARI].tamAd), `${rol} names ${baska}`)
    }
  })

  it('states the AU limits: no regulatory or compliance claim, no diagnosis, no connection claim', () => {
    const t = AU_CANLI_ASISTAN.sinirlar.join('\n')
    for (const parca of ['TGA', 'ARTG', 'Ahpra', 'Medicare', 'compliant', 'medical device', 'Do not diagnose', 'My Health Record']) assert.ok(t.includes(parca), parca)
    assert.match(AU_CANLI_ASISTAN.pratikBaglami.join(' '), /Privacy Act 1988/)
    assert.ok(AU_CANLI_ASISTAN.gunlukTurLimiti > 0)
  })

  it('is English only and names no other country\'s authority', () => {
    const kaynak = readFileSync(join(__dirname, 'canli.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    assert.equal(/[çğıöşüİÇĞÖŞÜ]/.test(kaynak), false)
    const t = JSON.stringify(AU_CANLI_ASISTAN.pratikBaglami) + JSON.stringify(AU_CANLI_ASISTAN.sinirlar)
    for (const yabanci of ['NHS', 'NICE', 'FDA', 'HIPAA', 'Health Canada', 'SGK', 'MBYS']) assert.ok(!t.includes(yabanci), yabanci)
  })

  it('the landing mentions the spoken assistant only while the deployment really has it', () => {
    const kok = AU_ARAYUZ.acilis!.icerik['en-AU']!
    const metin = (): string => JSON.stringify(auAcilisGuncelle(kok, 44).ekBolumler)
    const oncekiler = Object.fromEntries(Object.keys(ORTAM).map((k) => [k, process.env[k]]))
    try {
      for (const k of Object.keys(ORTAM)) delete process.env[k]
      assert.ok(!/microphone|aloud|spoken/i.test(metin()))
      Object.assign(process.env, ORTAM)
      assert.match(metin(), /Press the microphone on your home screen/)
      assert.match(metin(), /not a diagnosis or a treatment decision/)
      delete process.env.ELEVENLABS_AGENT_AU_FEMALE
      assert.ok(!/microphone/i.test(metin()))
    } finally {
      for (const [k, v] of Object.entries(oncekiler)) { if (v === undefined) delete process.env[k]; else process.env[k] = v }
    }
  })
})
