/**
 * NOTYA-MALIYET-01 — model adı sızıntısı ve tek kapı.
 *  1. Model adı (claude-sonnet-…, claude-haiku-…, claude-opus-…) kod içinde YALNIZ lib/ai/modeller.ts'te geçer.
 *     Başka yerde elle yazılan bir model adı politikayı (GÜÇLÜ/HIZLI, ortam değişkeni) sessizce by-pass eder.
 *  2. Claude'a giden her istek lib/ai/cagir.ts'ten geçer (messages.create / api.anthropic.com yalnız orada) — GÖRSEL =
 *     GÜÇLÜ güvencesi ve ai_token_kullanim ölçümü yalnız bu kapıda uygulanır.
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

  it('modeller.ts kendisi desene uyan varsayılanları taşır (desen gerçekten çalışıyor)', () => {
    assert.match(readFileSync(join(KOK, 'lib/ai/modeller.ts'), 'utf8'), /claude-sonnet-[0-9]/)
  })

  it("Claude'a doğrudan istek yalnız lib/ai/cagir.ts'te (messages.create / api.anthropic.com)", () => {
    const bulgular = eslesenler(/\.messages\.create\(|api\.anthropic\.com\/v1\/messages/, ['lib/ai/cagir.ts'])
    assert.deepEqual(bulgular, [], `Tek kapı by-pass ediliyor — aiCagir({ gorev, ... }) kullan:\n${bulgular.join('\n')}`)
  })
})
