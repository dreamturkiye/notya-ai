import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { DERMATOLOJI_PROMPT_DOSYALARI, dermatolojiAracHaritasi, dermatolojiKilidi, dermatolojiMi, dermatolojiPromptlari } from '../prompts'
import { DERMATOLOJI_TOOLS } from '../prompts/tools'
import { DERMATOLOJI_MANIFEST } from '../manifest'
import { VISION_DISCLAIMER } from '../imaging/vision-tools'
import { pediatrikKapsam, soapPersonaAnahtari, soapSistemPromptu } from '../../../lib/doktor/soapUret'

// DERM-PROMPTS-LOCK — same prompts rubric as dahiliye / KD (docs/DAH-WOW-BRIEF-v2.md §2): (a) complete, (b) goldens / no book text, (c) wired at runtime, (d) hekim lock.
const kok = path.join(import.meta.dirname, '..', '..', '..')
const kaynak = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')

describe('(a) dermatoloji prompts exist and are complete', () => {
  it('system.md, 3 soap-*.md, vision-asistan.md, asistan-ogrenme.md load non-empty; tools.ts has entries', () => {
    const p = dermatolojiPromptlari()
    for (const k of Object.keys(DERMATOLOJI_PROMPT_DOSYALARI) as (keyof typeof DERMATOLOJI_PROMPT_DOSYALARI)[]) assert.ok(p[k].length > 100, k)
    for (const s of [p.soapDerm, p.soapFototerapi, p.soapIslem]) assert.ok(s.startsWith('SOAP — '))
    assert.ok(DERMATOLOJI_TOOLS.length >= 7)
  })
  it('tools.ts is exactly manifest.toolsWhitelist', () => {
    assert.deepEqual(DERMATOLOJI_TOOLS.map((t) => t.name), [...DERMATOLOJI_MANIFEST.toolsWhitelist])
  })
})

describe('(b) goldens, no book text', () => {
  it('system.md cites every manifest book role (plus the state / SUT row)', () => {
    const roller = new Set(dermatolojiPromptlari().system.split('\n').filter((l) => /^- [a-z_-]+: /.test(l)).map((l) => l.slice(2, l.indexOf(':'))))
    for (const b of DERMATOLOJI_MANIFEST.books) assert.ok(roller.has(b.role), b.role)
    assert.deepEqual([...roller].filter((r) => !DERMATOLOJI_MANIFEST.books.some((b) => b.role === r)), ['state'])
  })
  it('short files, no long quoted passages', () => {
    for (const m of Object.values(dermatolojiPromptlari())) { assert.ok(m.length < 3000); assert.ok(m.split('\n').every((l) => l.length < 400)); assert.ok(!/«|»|“[^”]{120,}”/.test(m)) }
  })
  it('vision disclaimer in the prompts is the UI constant (Turkish characters — review fix)', () => {
    const p = dermatolojiPromptlari()
    assert.ok(p.system.includes(VISION_DISCLAIMER)); assert.ok(p.vision.includes(VISION_DISCLAIMER)); assert.ok(!/destegi|tani degildir/.test(p.system + p.vision))
  })
})

describe('(c) wired into the runtime call paths', () => {
  it('SOAP system prompt carries the dermatoloji lock (session key or users.specialty), not for other branches', () => {
    const d = soapSistemPromptu({ transcript: '', specialty: 'dermatoloji' })
    assert.ok(d.includes('=== DERMATOLOJİ SİSTEM KİLİDİ')); assert.ok(d.includes('SOAP — genel poliklinik')); assert.ok(d.includes('SOAP — fototerapi')); assert.ok(d.includes('SOAP — işlem')); assert.ok(d.includes('- analyze_image: '))
    assert.ok(soapSistemPromptu({ transcript: '', specialty: 'genel', doktorBransi: 'dermatoloji' }).includes('DERMATOLOJİ SİSTEM KİLİDİ'))
    assert.ok(soapSistemPromptu({ transcript: '', specialty: 'genel', doktorBransi: 'Deri ve Zührevi Hastalıklar' }).includes('DERMATOLOJİ SİSTEM KİLİDİ'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'pediatri', doktorBransi: 'pediatri' }).includes('DERMATOLOJİ'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'kadin-hastaliklari-dogum', doktorBransi: 'kadin-dogum' }).includes('DERMATOLOJİ'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'dahiliye' }).includes('DERMATOLOJİ'))
  })
  it('no other specialty lock bleeds into a dermatoloji prompt', () => {
    const d = soapSistemPromptu({ transcript: '', specialty: 'dermatoloji', doktorBransi: 'dermatoloji' })
    assert.ok(!d.includes('DAHİLİYE')); assert.ok(!d.includes('KADIN HASTALIKLARI VE DOĞUM')); assert.ok(!d.includes('SOAP — gebe')); assert.ok(!d.includes('ACOG'))
  })
  it('dermatolojiMi matches router bransAnahtari (derma) + resmi unvan only', () => {
    assert.ok(dermatolojiMi('dermatoloji')); assert.ok(dermatolojiMi(null, 'Deri ve Zührevi Hastalıklar')); assert.ok(dermatolojiMi('Dermatology'))
    assert.ok(!dermatolojiMi('pediatri')); assert.ok(!dermatolojiMi('kadin-dogum')); assert.ok(!dermatolojiMi('dahiliye')); assert.ok(!dermatolojiMi('plastik-cerrahi', null, undefined))
  })
  it('asistan / ses / ogrenme blocks', () => {
    const a = dermatolojiKilidi('asistan'); assert.ok(a.includes('ÖNCELİKLİDİR') && a.includes(dermatolojiAracHaritasi()) && a.includes('derm.analyze_image') && !a.includes('SOAP — fototerapi'))
    const s = dermatolojiKilidi('ses'); assert.ok(s.length < 2600 && s.includes('Deri ve Zührevi Hastalıklar') && s.includes('never a diagnosis') && !s.includes('Bolognia Dermatology 5th'))
    assert.ok(dermatolojiKilidi('ogrenme').includes('Dual-sign is the product'))
  })
  it('call sites use the loader (chat, hafıza/voice, SOAP, approve distiller, next.config tracing)', () => {
    assert.ok(kaynak('app/api/asistan/chat/route.ts').includes('dermatolojiKilidi("asistan")'))
    assert.ok(kaynak('app/api/doktor/hafiza/route.ts').includes("dermatolojiKilidi('ses')"))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes("dermatolojiKilidi('soap')"))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes("dermatolojiKilidi('ogrenme')"))
    assert.ok(kaynak('app/api/notes/[id]/approve/route.ts').includes('await hekimBransi(supabase, user.id)'))
    assert.ok(kaynak('next.config.mjs').includes('./specialties/dermatoloji/prompts/*.md'))
  })
})

describe('shared SOAP rules: no pediatric growth-percentile bleed (DAH-PROMPTS-FU)', () => {
  it('dermatoloji doctor gets the dermatoloji persona and adult rules, from the session key or users.specialty', () => {
    assert.equal(soapPersonaAnahtari({ specialty: 'genel', doktorBransi: 'Deri ve Zührevi Hastalıklar' }), 'dermatoloji')
    assert.ok(!pediatrikKapsam('dermatoloji', 'dermatoloji'))
    for (const girdi of [{ specialty: 'dermatoloji' }, { specialty: 'genel', doktorBransi: 'dermatoloji' }]) {
      const d = soapSistemPromptu({ transcript: '', ...girdi })
      assert.ok(d.startsWith('Sen Ayşe Kaya — Türkiye\'de yetişmiş, Türkçe tıbbi kayıt geleneğini çok iyi bilen bir Dermatoloji profesörü'))
      assert.ok(!/pediatride|Neyzi|Büyüme persentil|BÜYÜME\/VKİ|Veli beyanı|veliye/.test(d))
    }
  })
})

describe('(d) hekim / uzman lock language', () => {
  it('system.md + vision: vision is never a diagnosis, drafts need uzman onay, asistan cannot finalize, no pixels off-box', () => {
    const p = dermatolojiPromptlari()
    assert.ok(p.system.includes('never a diagnosis')); assert.ok(p.system.includes('WITH the uzman'))
    assert.ok(p.vision.includes('Asistan cannot finalize')); assert.ok(p.vision.includes('Status is always draft'))
    assert.ok(p.ogrenme.includes('Biopsy and treatment decisions stay with the uzman')); assert.ok(p.ogrenme.includes('Cannot mark VisionRead onayli'))
    assert.ok(dermatolojiKilidi('soap').includes('Not gövdesi kuralı (yalnız hekimin dediği) geçerliliğini korur'))
  })
  it('Doz kilidi (KD-DERM-SAFETY-FINDINGS F1): system.md rule reaches SOAP, chat and voice; SOAP output is dose-locked in code', () => {
    const p = dermatolojiPromptlari()
    assert.ok(p.system.includes('## Doz kilidi (kırılmaz)')); assert.ok(p.system.includes('doz hekim tarafından belirlenir')); assert.ok(p.system.includes('izotretinoin (günlük ve kümülatif doz)'))
    for (const y of ['soap', 'asistan', 'ses'] as const) assert.ok(dermatolojiKilidi(y).includes('Doz yazma; hafızadan veya kılavuzdan doz uydurma'), y)
    assert.ok(dermatolojiKilidi('soap').includes('receteOnerisi: yalnız etken madde / sınıf — doz, kullanım sıklığı ve mg YAZMA'))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes('dozKilitliBrans(girdi.specialty, girdi.doktorBransi) ? soapDozKilidi('))
    assert.ok(kaynak('app/api/asistan/chat/route.ts').includes('if (dozKilitliBrans(hekimBransi, specialty))'))
  })
  it('Onam / iç alan (KD-DERM-SAFETY-FINDINGS F4): BZBH Form 014 is labelled as bildirim, no invented form names, no coreImageId in the SOAP lock instruction; output cleaned in code', () => {
    const p = dermatolojiPromptlari()
    assert.ok(p.system.includes('BZBH Form 014 (bildirimi zorunlu bulaşıcı / zührevi hastalık bildirimi — onam formu değildir)'))
    assert.ok(p.system.includes('## Onam ve form adları (kırılmaz)') && p.system.includes('yalnız "izotretinoin onam formu" diye an'))
    for (const y of ['soap', 'asistan', 'ses'] as const) assert.ok(dermatolojiKilidi(y).includes('Form adı, numarası veya resmî görünen belge adı uydurma'), y)
    for (const y of ['soap', 'asistan'] as const) assert.ok(dermatolojiKilidi(y).includes('iç alan veya araç adı yazma'), y)
    assert.ok(!dermatolojiKilidi('soap').includes('kimliği (coreImageId)'))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes('return notMetinleriniTemizle('))
    assert.ok(kaynak('app/api/asistan/chat/route.ts').includes('aiData.speech = doktorMetniTemizle(aiData.speech)'))
  })
})
