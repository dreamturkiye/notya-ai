/**
 * NOTYA-MALIYET-01 + NOTYA-MODEL-LUNA-01 — model adı sızıntısı ve tek kapı.
 *  1. Model adı (claude-sonnet-…, claude-haiku-…, claude-opus-…, gpt-<sürüm>…, openai/…, anthropic/…) kod içinde YALNIZ
 *     lib/ai/modeller.ts'te (ve önekleri bilmesi gereken lib/ai/saglayici.ts'te) geçer. Başka yerde elle yazılan bir
 *     model adı politikayı (GÜÇLÜ/HIZLI, ortam değişkeni, iki kapı) sessizce by-pass eder.
 *  2. LLM'e giden her istek lib/ai/cagir.ts'ten geçer (messages.create / api.anthropic.com yalnız orada; openrouter.ai
 *     yalnız saglayici.ts'te) — GÖRSEL = GÜÇLÜ, iki kapı ve ai_token_kullanim ölçümü yalnız bu kapıda uygulanır.
 * Kapsam: app/, lib/, core/, components/, specialties/, types/ altındaki kod dosyaları (test dosyaları hariç).
 * Skill: .cursor/skills/ai-model-politikasi/SKILL.md
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const KOK = resolve(__dirname, '../..')
const KLASORLER = ['app', 'lib', 'core', 'components', 'specialties', 'types']
const KOD = /\.(ts|tsx|js|jsx|mjs|mts|cjs)$/
const TEST = /\.test\.(ts|tsx|mts)$/

function dosyalar(klasor: string): string[] {
  const tam = join(KOK, klasor)
  if (!existsSync(tam)) return []
  const cikti: string[] = []
  const gez = (d: string) => {
    for (const ad of readdirSync(d)) {
      if (ad === 'node_modules' || ad.startsWith('.')) continue
      const yol = join(d, ad)
      if (statSync(yol).isDirectory()) gez(yol)
      else if (KOD.test(ad) && !TEST.test(ad)) cikti.push(relative(KOK, yol))
    }
  }
  gez(tam)
  return cikti
}

const TUM = KLASORLER.flatMap(dosyalar)

function eslesenler(desen: RegExp, izinli: string[]): string[] {
  const bulgular: string[] = []
  for (const yol of TUM) {
    if (izinli.includes(yol)) continue
    readFileSync(join(KOK, yol), 'utf8').split('\n').forEach((satir, i) => {
      if (desen.test(satir)) bulgular.push(`${yol}:${i + 1}: ${satir.trim().slice(0, 120)}`)
    })
  }
  return bulgular
}

describe('model adı sızıntısı (NOTYA-MALIYET-01)', () => {
  it('taranan kod kümesi boş değil (test kendini kandırmasın)', () => {
    assert.ok(TUM.length > 200, `yalnız ${TUM.length} dosya tarandı`)
    assert.ok(TUM.includes('lib/ai/modeller.ts') && TUM.includes('lib/ai/cagir.ts'))
  })

  it('claude-(sonnet|haiku|opus)-<sürüm> yalnız lib/ai/modeller.ts içinde', () => {
    const bulgular = eslesenler(/claude-(sonnet|haiku|opus)-[0-9]/i, ['lib/ai/modeller.ts'])
    assert.deepEqual(bulgular, [], `Model adı politikayı by-pass ediyor — modelSec(gorev) kullan:\n${bulgular.join('\n')}`)
  })

  it("gpt-<sürüm> ve openai/… / anthropic/… slug'ları yalnız lib/ai/modeller.ts ve lib/ai/saglayici.ts içinde", () => {
    // Slug'lar küçük harflidir (düzyazıdaki "GPT-6 Luna" model adı değildir). Groq'un OpenAI-uyumlu URL'i (api.groq.com/openai/v1) bir model adı değildir — ".com/openai/" hariç tutulur.
    const bulgular = eslesenler(/(?<![\w.])gpt-[0-9]|(?<!\.com\/)(?<![\w-])(openai|anthropic)\/(gpt|claude|o[0-9])/, ['lib/ai/modeller.ts', 'lib/ai/saglayici.ts'])
    assert.deepEqual(bulgular, [], `Model adı politikayı by-pass ediyor — modelSec(gorev) kullan:\n${bulgular.join('\n')}`)
  })

  it('modeller.ts kendisi desene uyan varsayılanları taşır (desen gerçekten çalışıyor)', () => {
    const kaynak = readFileSync(join(KOK, 'lib/ai/modeller.ts'), 'utf8')
    assert.match(kaynak, /claude-sonnet-[0-9]/)
    assert.match(kaynak, /MODEL_HIZLI = 'openai\/gpt-6-luna'/)
    assert.match(kaynak, /MODEL_GUCLU = 'anthropic\/claude-sonnet-5'/)
  })

  it('yasak varsayılanlar seçilmedi (gpt-5.6-luna, claude-sonnet-4.5, claude-sonnet-4-6)', () => {
    const kaynak = readFileSync(join(KOK, 'lib/ai/modeller.ts'), 'utf8')
    const varsayilanlar = kaynak.match(/export const MODEL_(GUCLU|HIZLI) = '[^']+'/g) || []
    assert.equal(varsayilanlar.length, 2)
    for (const v of varsayilanlar) assert.doesNotMatch(v, /gpt-5\.6-luna|claude-sonnet-4[.-][56]/)
  })

  it("Claude'a doğrudan istek yalnız lib/ai/cagir.ts'te (messages.create / api.anthropic.com)", () => {
    const bulgular = eslesenler(/\.messages\.create\(|api\.anthropic\.com\/v1\/messages/, ['lib/ai/cagir.ts'])
    assert.deepEqual(bulgular, [], `Tek kapı by-pass ediliyor — aiCagir({ gorev, ... }) kullan:\n${bulgular.join('\n')}`)
  })

  it('OpenRouter ucu yalnız lib/ai/saglayici.ts içinde (openrouter.ai)', () => {
    const bulgular = eslesenler(/openrouter\.ai/i, ['lib/ai/saglayici.ts'])
    assert.deepEqual(bulgular, [], `Tek kapı by-pass ediliyor — aiCagir({ gorev, ... }) kullan:\n${bulgular.join('\n')}`)
  })
})
