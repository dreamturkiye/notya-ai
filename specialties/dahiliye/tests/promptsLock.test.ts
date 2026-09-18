import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { DAHILIYE_PROMPT_DOSYALARI, dahiliyeAracHaritasi, dahiliyeKilidi, dahiliyeMi, dahiliyePromptlari, dahiliyeReceteDozsuz } from '../prompts'
import { DAHILIYE_TOOLS } from '../prompts/tools'
import { REF_ACIKLAMA } from '../engines/dahiliye'
import { soapSistemPromptu } from '../../../lib/doktor/soapUret'

// DAH-PROMPTS-LOCK — prompts rubric (docs/DAH-WOW-BRIEF-v2.md §2): (a) complete, (b) goldens / no book text, (c) wired at runtime, (d) hekim lock.
const kok = path.join(import.meta.dirname, '..', '..', '..')
const kaynak = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')

describe('(a) prompts exist and are complete', () => {
  it('system.md, soap-dahiliye.md, asistan-ogrenme.md load non-empty; tools.ts has entries', () => {
    const p = dahiliyePromptlari()
    for (const k of Object.keys(DAHILIYE_PROMPT_DOSYALARI) as (keyof typeof DAHILIYE_PROMPT_DOSYALARI)[]) assert.ok(p[k].length > 80, k)
    assert.ok(p.soap.includes('**S:**') && p.soap.includes('**O:**') && p.soap.includes('**A:**') && p.soap.includes('**P:**'))
    assert.ok(DAHILIYE_TOOLS.length >= 20)
  })
  it('every tools.ts step exists in the dahiliye API (adım, GET şerit, or kohort route)', () => {
    const api = fs.readdirSync(path.join(kok, 'app/api/doktor/dahiliye')).filter((f) => f.endsWith('.ts')).map((f) => kaynak(`app/api/doktor/dahiliye/${f}`)).join('\n')
    for (const t of DAHILIYE_TOOLS) {
      const ad = t.name.replace('dahiliye.', '')
      if (ad === 'serit') { assert.ok(/serit/.test(api)); continue }
      if (ad === 'kohort') { assert.ok(fs.existsSync(path.join(kok, 'app/api/doktor/dahiliye/kohort/route.ts'))); continue }
      assert.ok(new RegExp(`'${ad}'`).test(api), `adım yok: ${ad}`)
    }
  })
})

describe('(b) goldens, no book text', () => {
  it('Kaynak hiyerarşisi lists exactly the REF_ACIKLAMA ref codes', () => {
    const satir = dahiliyePromptlari().system.split('\n').find((l) => l.startsWith('TIHUD2023'))!
    assert.deepEqual(satir.split('·').map((x) => x.trim()).sort(), Object.keys(REF_ACIKLAMA).sort())
  })
  it('short files, no long quoted passages', () => {
    for (const m of Object.values(dahiliyePromptlari())) { assert.ok(m.length < 3000); assert.ok(m.split('\n').every((l) => l.length < 400)); assert.ok(!/«|»|“[^”]{120,}”/.test(m)) }
  })
  it('pregnancy rule: ACEi/ARB and statin contraindicated (review fix — old wording excluded exactly these)', () => {
    const s = dahiliyePromptlari().system
    assert.ok(s.includes('ACEi/ARB ve statin gebelikte kontrendike')); assert.ok(!s.includes('ACEi/ARB/statin/metformin dışı'))
  })
})

describe('(c) wired into the runtime call paths', () => {
  it('SOAP system prompt carries the lock for dahiliye (specialty or users.specialty), not for other branches', () => {
    const d = soapSistemPromptu({ transcript: '', specialty: 'dahiliye' })
    assert.ok(d.includes('=== DAHİLİYE SİSTEM KİLİDİ')); assert.ok(d.includes('Kırılmaz kurallar')); assert.ok(d.includes('SOAP — dahiliye kronik kontrol')); assert.ok(d.includes('- kvr: '))
    assert.ok(soapSistemPromptu({ transcript: '', specialty: 'genel', doktorBransi: 'İç Hastalıkları' }).includes('DAHİLİYE SİSTEM KİLİDİ'))
    assert.ok(!soapSistemPromptu({ transcript: '', specialty: 'pediatri', doktorBransi: 'pediatri' }).includes('DAHİLİYE'))
  })
  it('dahiliyeMi matches router bransAnahtari (dahiliye / iç hastalıkları only)', () => {
    assert.ok(dahiliyeMi('dahiliye')); assert.ok(dahiliyeMi(null, 'İç Hastalıkları')); assert.ok(dahiliyeMi('ic hastaliklari'))
    assert.ok(!dahiliyeMi('pediatri')); assert.ok(!dahiliyeMi('aile-hekimligi')); assert.ok(!dahiliyeMi('endokrinoloji', null, undefined))
  })
  it('asistan / ses / ogrenme blocks', () => {
    const a = dahiliyeKilidi('asistan'); assert.ok(a.includes('ÖNCELİKLİDİR') && a.includes(dahiliyeAracHaritasi()) && !a.includes('SOAP — dahiliye'))
    const s = dahiliyeKilidi('ses'); assert.ok(s.length < 1600 && s.includes('Doz yazma') && s.includes('yalnız hekim kilitler'))
    assert.ok(dahiliyeKilidi('ogrenme').includes('doz kalıpları öğrenilse bile taslağa yazılmaz'))
  })
  it('call sites use the loader (chat, hafıza/voice, SOAP routes, approve distiller)', () => {
    assert.ok(kaynak('app/api/asistan/chat/route.ts').includes('dahiliyeKilidi("asistan")'))
    assert.ok(kaynak('app/api/doktor/hafiza/route.ts').includes("dahiliyeKilidi('ses')"))
    assert.match(kaynak('app/api/sessions/[id]/end/route.ts'), /soapNotuUret\([^\n]*\bdoktorBransi\b/) // BRANS-ALAN-SIZMASI: hastaDogumIso de geçer
    assert.match(kaynak('app/api/sessions/ses-yukle/route.ts'), /soapNotuUret\([^\n]*\bdoktorBransi\b/) // BRANS-ALAN-SIZMASI: hastaDogumIso de geçer
    assert.ok(kaynak('app/api/notes/[id]/approve/route.ts').includes('await hekimBransi(supabase, user.id)'))
    assert.ok(kaynak('lib/doktor/soapUret.ts').includes("dahiliyeKilidi('ogrenme')"))
    assert.ok(kaynak('next.config.mjs').includes('./specialties/dahiliye/prompts/*.md'))
  })
})

describe('(d) hekim lock language + enforced in code', () => {
  it('system.md: only the hekim locks tanı/evre/hedef/ilaç/KVR; no dose; approved labs only', () => {
    const s = dahiliyePromptlari().system
    assert.ok(s.includes('yalnız hekim kilitler')); assert.ok(s.includes('Doz yazma')); assert.ok(s.includes('hekim dozu yazar')); assert.ok(s.includes('yalnız onaylı lab'))
    assert.ok(dahiliyePromptlari().soap.includes('Doz yok')); assert.ok(dahiliyePromptlari().soap.includes('Hekim kilitleri'))
  })
  // CROSS-SPECIALTY-PARITY (2026-09-17): KD-DERM-SAFETY-FINDINGS F1 gave kadın doğum / dermatoloji a full
  // "## Doz kilidi (kırılmaz)" block; dahiliye only got the code refactor, so its own prompt still lacked the three
  // clauses that stop the model writing a number in the first place. Parity applied here.
  it('Doz kilidi (kırılmaz): dahiliye system.md carries the same three clauses as KD / derm, on every surface', () => {
    const s = dahiliyePromptlari().system
    assert.ok(s.includes('## Doz kilidi (kırılmaz)'))
    assert.ok(s.includes('hafızadan veya kılavuzdan doz uydurma'))
    assert.ok(s.includes('Hekim dozu söylediyse aynen aktar'))
    assert.ok(s.includes('sohbette doz sorulursa sayı verme') || s.includes('Hekim sohbette doz sorarsa sayı verme'))
    assert.ok(s.includes('insülin (yükleme, titrasyon, bazal-bolus şeması)'), 'dahiliye has its own drug scope list')
    // reaches SOAP + chat in full, and the compact voice lock via Kırılmaz kurallar #2
    for (const y of ['soap', 'asistan'] as const) assert.ok(dahiliyeKilidi(y).includes('## Doz kilidi (kırılmaz)'), y)
    assert.ok(dahiliyeKilidi('ses').includes('hafızadan veya kılavuzdan doz uydurma'), 'ses')
  })
  it('SOAP reçete önerisi for dahiliye is stripped of doses in code', () => {
    const r = dahiliyeReceteDozsuz<{ etkenMadde?: string; ticariOrnek?: string; doz?: string; kullanim?: string; sure?: string; not?: string }>([{ etkenMadde: 'metformin', ticariOrnek: 'Glifor 1000 mg', doz: '1000 mg', kullanim: '2x1', sure: '3 ay' }])
    assert.equal(r[0].doz, undefined); assert.equal(r[0].kullanim, undefined); assert.equal(r[0].ticariOrnek, 'Glifor'); assert.equal(r[0].etkenMadde, 'metformin'); assert.ok(r[0].not!.includes('Doz hekim yazar'))
  })
})
