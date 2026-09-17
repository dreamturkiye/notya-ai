/**
 * DAH-PROMPTS-LOCK — runtime loader for the dahiliye prompt lock (W0.1 files in this folder).
 * system.md + soap-dahiliye.md + tools.ts go into SOAP generation (lib/doktor/soapUret.ts) and Dr. Ayşe chat
 * (app/api/asistan/chat/route.ts); a compact system.md lock (role + kırılmaz kurallar) goes into the voice prompt via
 * /api/doktor/hafiza sesBlogu; asistan-ogrenme.md goes into the style-profile distiller (stilProfiliDamit).
 * Server-only (fs). The .md files are traced into the serverless bundle via next.config outputFileTracingIncludes.
 * Missing files throw: a dahiliye note must never be generated silently without its lock.
 */
import fs from 'fs'
import path from 'path'
import { DAHILIYE_TOOLS } from './tools'

export const DAHILIYE_PROMPT_DOSYALARI = { system: 'system.md', soap: 'soap-dahiliye.md', ogrenme: 'asistan-ogrenme.md' } as const
type Anahtar = keyof typeof DAHILIYE_PROMPT_DOSYALARI

let onbellek: Record<Anahtar, string> | null = null

export function dahiliyePromptlari(): Record<Anahtar, string> {
  if (onbellek) return onbellek
  const dizin = path.join(process.cwd(), 'specialties', 'dahiliye', 'prompts')
  const oku = (k: Anahtar) => {
    const metin = fs.readFileSync(path.join(dizin, DAHILIYE_PROMPT_DOSYALARI[k]), 'utf8').trim()
    if (!metin) throw new Error(`dahiliye prompt boş: ${DAHILIYE_PROMPT_DOSYALARI[k]}`)
    return metin
  }
  onbellek = { system: oku('system'), soap: oku('soap'), ogrenme: oku('ogrenme') }
  return onbellek
}

/** users.specialty / session specialty → dahiliye? Same match as core/belgeler/router bransAnahtari. */
export function dahiliyeMi(...branslar: (string | null | undefined)[]): boolean {
  return branslar.some((b) => /dahiliye|iç hast|ic hast/.test((b || '').toLocaleLowerCase('tr-TR')))
}

/** tools.ts rendered as a read-only map of card steps. Chat has no tool-use loop by design: every card write is a hekim action in the UI. */
export function dahiliyeAracHaritasi(): string {
  return DAHILIYE_TOOLS.map((t) => `- ${t.name.replace('dahiliye.', '')}: ${t.description}`).join('\n')
}

const ONCELIK = 'Bu kilit, yukarıdaki genel talimatlarla çeliştiğinde ÖNCELİKLİDİR (özellikle: doz yazma, tanı/evre/hedefi hekim kilitler, yalnız onaylı lab).'

/** One `## ` section of system.md (heading line excluded). */
export function dahiliyeBolum(baslik: string): string {
  const parca = dahiliyePromptlari().system.split(/^## /m).find((b) => b.startsWith(baslik))
  if (!parca) throw new Error(`dahiliye system.md bölümü yok: ${baslik}`)
  return parca.slice(parca.indexOf('\n') + 1).trim()
}

export function dahiliyeKilidi(yuzey: 'soap' | 'asistan' | 'ogrenme' | 'ses'): string {
  const p = dahiliyePromptlari()
  if (yuzey === 'ses') return `=== DAHİLİYE KİLİDİ (kısa) ===\n${p.system.split(/^## /m)[0].split('\n').slice(1).join(' ').trim()}\nKırılmaz kurallar:\n${dahiliyeBolum('Kırılmaz kurallar')}`
  if (yuzey === 'ogrenme') return `\n=== DAHİLİYE ÖĞRENME KİLİDİ ===\n${p.ogrenme}\nKlinik tercihlerde bile doz/mg kalıbı profile yazılmaz; yalnız ilaç sınıfı düzeyi.`
  const araclar = `## Dahiliye kart adımları (uygulamada hekim çalıştırır; sen kendiliğinden çalıştırmaz veya sonucunu uydurmazsın — yalnız ilgili kartı/adımı önerirsin)\n${dahiliyeAracHaritasi()}`
  const soap = yuzey === 'soap' ? `\n\n${p.soap}\nSOAP JSON alanlarına eşleme: S → subjektif, O → objektif, A → degerlendirme, P → plan. Not gövdesi kuralı (yalnız hekimin dediği) geçerliliğini korur; kart satırları ve öneriler aiDegerlendirme alanına gider. receteOnerisi: yalnız etken madde / sınıf — doz, kullanım sıklığı ve mg YAZMA.` : ''
  return `\n=== DAHİLİYE SİSTEM KİLİDİ (specialties/dahiliye/prompts) ===\n${ONCELIK}\n\n${p.system}${soap}\n\n${araclar}\n=== KİLİT SONU ===`
}

const DOZ_RE = /\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|μg|g|ml|mL|iu|IU|ünite|u)\b/gi

/** Locked safety §1 for dahiliye: drug class / etken madde only — strip model-written doses from reçete önerisi. */
export function dahiliyeReceteDozsuz<T extends { doz?: string; kullanim?: string; ticariOrnek?: string; not?: string }>(liste: T[]): T[] {
  return liste.map((r) => {
    const { doz: _d, kullanim: _k, ...kalan } = r
    const ticari = r.ticariOrnek ? r.ticariOrnek.replace(DOZ_RE, '').replace(/\s{2,}/g, ' ').trim() : r.ticariOrnek
    return { ...kalan, ...(ticari ? { ticariOrnek: ticari } : {}), not: [r.not, 'Doz hekim yazar'].filter(Boolean).join(' · ') } as T
  })
}
