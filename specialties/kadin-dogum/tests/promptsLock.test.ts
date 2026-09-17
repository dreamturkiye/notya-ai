import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { KADIN_DOGUM_PROMPT_DOSYALARI, kadinDogumAracHaritasi, kadinDogumKilidi, kadinDogumMi, kadinDogumPromptlari } from '../prompts'
import { KADIN_DOGUM_TOOLS } from '../prompts/tools'
import { KADIN_DOGUM_MANIFEST } from '../manifest'
import { VISION_DISCLAIMER } from '../imaging/vision-tools'
import { pediatrikKapsam, soapKurallari, soapPersonaAnahtari, soapSistemPromptu } from '../../../lib/doktor/soapUret'

// KD-PROMPTS-LOCK — same prompts rubric as dahiliye (docs/DAH-WOW-BRIEF-v2.md §2): (a) complete, (b) goldens / no book text, (c) wired at runtime, (d) hekim lock.
const kok = path.join(import.meta.dirname, '..', '..', '..')
const kaynak = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const BUYUME_RE = /persentil|Neyzi|büyüme|baş çevresi|veli/i

describe('(a) KD prompts exist and are complete', () => {
  it('system.md, 4 soap-*.md, vision-asistan.md, asistan-ogrenme.md load non-empty; tools.ts has entries', () => {
    const p = kadinDogumPromptlari()
    for (const k of Object.keys(KADIN_DOGUM_PROMPT_DOSYALARI) as (keyof typeof KADIN_DOGUM_PROMPT_DOSYALARI)[]) assert.ok(p[k].length > 150, k)
    for (const s of [p.soapGebe, p.soapJinekoloji, p.soapUsg, p.soapDogum]) assert.ok(s.startsWith('SOAP — '))
    assert.ok(KADIN_DOGUM_TOOLS.length >= 10)
  })
  it('tools.ts is exactly manifest.toolsWhitelist', () => {
    assert.deepEqual(KADIN_DOGUM_TOOLS.map((t) => t.name), [...KADIN_DOGUM_MANIFEST.toolsWhitelist])
  })
})

describe('(b) goldens, no book text', () => {
  it('system.md cites exactly the manifest book roles', () => {
    const roller = kadinDogumPromptlari().system.split('\n').filter((l) => /^- [a-z_-]+: /.test(l)).map((l) => l.slice(2, l.indexOf(':')))
    assert.deepEqual([...new Set(roller)].sort(), [...new Set(KADIN_DOGUM_MANIFEST.books.map((b) => b.role))].sort())
  })
  it('short files, no long quoted passages', () => {
    for (const m of Object.values(kadinDogumPromptlari())) { assert.ok(m.length < 3000); assert.ok(m.split('\n').every((l) => l.length < 400)); assert.ok(!/«|»|“[^”]{120,}”/.test(m)) }
  })
  it('vision disclaimer in the prompts is the UI constant (Turkish characters — review fix)', () => {
    const p = kadinDogumPromptlari()
    assert.ok(p.system.includes(VISION_DISCLAIMER)); assert.ok(p.vision.includes(VISION_DISCLAIMER)); assert.ok(!/destegi|tani degildir/.test(p.system + p.vision))
  })
})

describe('(c) wired into the runtime call paths', () => {
  it('SOAP system prompt carries the KD lock (session key or users.specialty), not for other branches', () => {
    const d = soapSistemPromptu({ transcript: '', specialty: 'kadin-hastaliklari-dogum' })
    assert.ok(d.includes('=== KADIN DOĞUM SİSTEM KİLİDİ')); assert.ok(d.includes('SOAP — gebe visit')); assert.ok(d.includes('SOAP — USG visit')); assert.ok(d.includes('- current_ga: '))
    assert.ok(d.includes('"SB (yasal asgari): …"'))
    assert.ok(soapSistemPromptu({ transcript: '', specialty: 'genel', doktorBransi: 'kadin-dogum' }).includes('KADIN DOĞUM SİSTEM KİLİDİ'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'pediatri', doktorBransi: 'pediatri' }).includes('KADIN DOĞUM'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'dahiliye' }).includes('KADIN DOĞUM'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'kadin-hastaliklari-dogum' }).includes('DAHİLİYE'))
  })
  it('kadinDogumMi matches router bransAnahtari (kadın / jinek / obstet only)', () => {
    assert.ok(kadinDogumMi('kadin-dogum')); assert.ok(kadinDogumMi(null, 'Kadın Hastalıkları ve Doğum')); assert.ok(kadinDogumMi('kadin-hastaliklari-dogum')); assert.ok(kadinDogumMi('jinekoloji'))
    assert.ok(!kadinDogumMi('pediatri')); assert.ok(!kadinDogumMi('dahiliye')); assert.ok(!kadinDogumMi('İç Hastalıkları')); assert.ok(!kadinDogumMi('dermatoloji', null, undefined))
  })
  it('asistan / ses / ogrenme blocks', () => {
    const a = kadinDogumKilidi('asistan'); assert.ok(a.includes('ÖNCELİKLİDİR') && a.includes(kadinDogumAracHaritasi()) && a.includes('kd.analyze_usg') && !a.includes('SOAP — gebe'))
    const s = kadinDogumKilidi('ses'); assert.ok(s.length < 2600 && s.includes('Kadın Hastalıkları ve Doğum') && s.includes('uzman onay') && !s.includes('Williams Obstetrik 26 (TR'))
    assert.ok(kadinDogumKilidi('ogrenme').includes('Dual-sign is the product'))
  })
  it('call sites use the loader (chat, hafıza/voice, SOAP, approve distiller, next.config tracing, session branch key)', () => {
    assert.ok(kaynak('app/api/asistan/chat/route.ts').includes('kadinDogumKilidi("asistan")'))
    assert.ok(kaynak('app/api/doktor/hafiza/route.ts').includes("kadinDogumKilidi('ses')"))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes("kadinDogumKilidi('soap')"))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes("kadinDogumKilidi('ogrenme')"))
    assert.ok(kaynak('app/api/notes/[id]/approve/route.ts').includes('await hekimBransi(supabase, user.id)'))
    assert.ok(kaynak('next.config.mjs').includes('./specialties/kadin-dogum/prompts/*.md'))
    assert.ok(kaynak('app/session/new/page.tsx').includes('"kadin-dogum": "kadin-hastaliklari-dogum"'))
  })
})

describe('shared SOAP rules: no pediatric growth-percentile bleed (DAH-PROMPTS-FU)', () => {
  it('KD doctor (profile kadin-dogum, session genel) gets the KD persona and adult rules', () => {
    assert.equal(soapPersonaAnahtari({ specialty: 'genel', doktorBransi: 'kadin-dogum' }), 'kadin-hastaliklari-dogum')
    const d = soapSistemPromptu({ transcript: '', specialty: 'genel', doktorBransi: 'kadin-dogum' })
    assert.ok(d.startsWith('Sen Ayşe Kaya — Türkiye\'de yetişmiş, Türkçe tıbbi kayıt geleneğini çok iyi bilen bir Kadın Hastalıkları ve Doğum profesörü'))
    assert.ok(!/pediatride|Neyzi|Büyüme persentil|BÜYÜME\/VKİ|Veli beyanı|veliye/.test(d))
  })
  it('adult rules have no growth / veli wording; pediatric rules are unchanged', () => {
    assert.ok(!BUYUME_RE.test(soapKurallari(false).replace(/VKİ sınıfı veya persentil hesaplayıp sayı uydurma/, '')))
    assert.ok(soapKurallari(true).includes('Büyüme persentiline bakınız') && soapKurallari(true).includes('Veli beyanı'))
    assert.equal(soapKurallari(), soapKurallari(true))
  })
  it('pediatrikKapsam: pediatri/çocuk and mixed-age (genel, aile) yes; locked adult branches no', () => {
    assert.ok(pediatrikKapsam('pediatri')); assert.ok(pediatrikKapsam('genel', 'pediatri')); assert.ok(pediatrikKapsam('cocuk-cerrahisi')); assert.ok(pediatrikKapsam('genel')); assert.ok(pediatrikKapsam('aile-hekimligi')); assert.ok(pediatrikKapsam(null))
    assert.ok(!pediatrikKapsam('kadin-hastaliklari-dogum', 'kadin-dogum')); assert.ok(!pediatrikKapsam('dahiliye')); assert.ok(!pediatrikKapsam('dermatoloji'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'dahiliye' }).includes('Büyüme persentil'))
    assert.ok(soapSistemPromptu({ transcript: '', specialty: 'pediatri' }).includes('Büyüme persentiline bakınız'))
  })
})

describe('(d) hekim / uzman lock language', () => {
  it('system.md + vision: screens are not diagnoses, drafts need uzman onay, asistan cannot finalize, two SB/ACOG columns', () => {
    const p = kadinDogumPromptlari()
    assert.ok(p.system.includes('are not diagnoses')); assert.ok(p.system.includes('still require uzman onay')); assert.ok(p.system.includes('Never collapse them'))
    assert.ok(p.vision.includes('Asistan cannot finalize')); assert.ok(p.vision.includes('Status is always draft'))
    assert.ok(p.ogrenme.includes('Delivery and invasive-test decisions stay with the uzman'))
    assert.ok(kadinDogumKilidi('soap').includes('Not gövdesi kuralı (yalnız hekimin dediği) geçerliliğini korur'))
  })
  it('Doz kilidi (KD-DERM-SAFETY-FINDINGS F1): system.md rule reaches SOAP, chat and voice; SOAP output is dose-locked in code', () => {
    const p = kadinDogumPromptlari()
    assert.ok(p.system.includes('## Doz kilidi (kırılmaz)')); assert.ok(p.system.includes('doz hekim tarafından belirlenir')); assert.ok(p.system.includes('anti-D immünglobulin'))
    for (const y of ['soap', 'asistan', 'ses'] as const) assert.ok(kadinDogumKilidi(y).includes('Doz yazma; hafızadan veya kılavuzdan doz uydurma'), y)
    assert.ok(kadinDogumKilidi('soap').includes('receteOnerisi: yalnız etken madde / sınıf — doz, kullanım sıklığı ve mg YAZMA'))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes('dozKilitliBrans(girdi.specialty, girdi.doktorBransi) ? soapDozKilidi('))
    assert.ok(kaynak('app/api/asistan/chat/route.ts').includes('if (dozKilitliBrans(hekimBransi, specialty))'))
  })
  it('Kaynak kilidi (KD-KAYNAK-KILIDI): Turkish source first, no guideline number / year from memory; verified list in SOAP + chat; backstop in code', () => {
    const p = kadinDogumPromptlari()
    assert.ok(p.system.startsWith('Kaynak gösterirken Türk kaynağı önce: SB rehberleri'))
    assert.ok(p.system.includes('## Kaynak kilidi (kırılmaz)') && p.system.includes('Türk kaynağı için de numara / yıl uydurma'))
    for (const y of ['soap', 'asistan', 'ses'] as const) assert.ok(kadinDogumKilidi(y).includes('Kılavuz doküman numarası veya yayın yılını hafızadan yazma'), y)
    for (const y of ['soap', 'asistan'] as const) assert.ok(kadinDogumKilidi(y).includes('## Doğrulanmış kaynaklar (Kaynak kilidi') && kadinDogumKilidi(y).includes('gbs: Türk rehberi repoda yok; uluslararası: ACOG CO 797'), y)
    assert.ok(!kadinDogumKilidi('ses').includes('## Doğrulanmış kaynaklar'), 'voice stays short: rule only, so no number at all')
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes('kadinDogumMi(girdi.specialty, girdi.doktorBransi) ? soapKaynakKilidi(dozlu, kdDogrulanmisKaynaklar())'))
    assert.ok(kaynak('app/api/asistan/chat/route.ts').includes('uydurmaKaynakTemizle(String(aiData.speech || ""), liste)'))
    assert.ok(!kadinDogumKilidi('asistan').includes('pratik gold standard'))
  })
})
