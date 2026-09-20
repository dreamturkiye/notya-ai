/**
 * NOTYA-EYLEM — registry → Anthropic tool definitions.
 *
 * Filtered by the doctor's branş and by the patient in context, then capped, so the prompt cost of
 * the action layer stays flat no matter how many chapters register actions (docs §2). A tool the
 * model cannot legitimately use in this conversation is not worth its tokens.
 *
 * Kill switch: `AYSE_EYLEM_KAPALI=1` → this returns [] and Ayşe silently goes back to summarising
 * (docs §5). No fallback write path exists to fall back TO — that is the point.
 *
 * Safety: tools are offered on a DOCTOR turn only (the caller decides), so untrusted document text
 * can never itself trigger a tool call; and a tool call still only produces a taslak.
 */
import { eylemler } from './kayit'
import { aracSemasi } from './sema'
import type { EylemTanimi, HastaOzeti } from './types'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

/** Prompt-budget cap. ~15 tools ≈ 1.5k tokens of definitions; beyond that the model also picks worse. */
export const ARAC_TAVANI = 15

export function eylemKapali(): boolean {
  return String(process.env.AYSE_EYLEM_KAPALI || '').trim() === '1'
}

export interface AracSuzgeci {
  brans: SpecialtyKey | null
  /** null = no patient in context: only actions that do not need one are offered (today: none). */
  hasta: HastaOzeti | null
}

/** Is this action available to this doctor, for this patient? Specialty gating is explicit — never default-on. */
export function eylemUygunMu(e: EylemTanimi, s: AracSuzgeci): boolean {
  if (e.branslar !== 'hepsi') {
    if (!s.brans || !e.branslar.includes(s.brans)) return false
  }
  if (!s.hasta) return false
  if (e.hastaKosulu && !e.hastaKosulu(s.hasta, s.brans)) return false
  return true
}

export function uygunEylemler(s: AracSuzgeci): EylemTanimi[] {
  if (eylemKapali()) return []
  // Base actions first, then specialty actions: if the cap bites, the shared spine survives it.
  const liste = eylemler().filter((e) => eylemUygunMu(e, s))
  const temel = liste.filter((e) => e.branslar === 'hepsi')
  const brans = liste.filter((e) => e.branslar !== 'hepsi')
  return [...temel, ...brans].slice(0, ARAC_TAVANI)
}

export interface AnthropicArac {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

/**
 * The tool description carries the discipline the prompt cannot enforce alone: a value the doctor
 * did not say and the file does not contain is `tahmin`, and a `tahmin` is dropped, not stored.
 */
export function aracTanimlari(s: AracSuzgeci): AnthropicArac[] {
  return uygunEylemler(s).map((e) => ({
    name: e.anahtar,
    description: `${e.aciklama}\n\nBu araç KAYIT YAPMAZ: hekime bir onay kartı hazırlar, kaydı hekimin dokunuşu yapar. Her alan için kaynağı da ver (alan_kaynaklari): doktor_soyledi | dosyadan | tahmin. Emin olmadığın bir değeri UYDURMA — tahmin olarak işaretle, sistem o alanı boş bırakıp hekime sorar.`,
    input_schema: {
      type: 'object',
      properties: {
        ...(aracSemasi(e.alanlar).properties as Record<string, unknown>),
        alan_kaynaklari: {
          type: 'object',
          description:
            'Her doldurduğun alan için kaynağı: { "<alan>": { "kaynak": "doktor_soyledi"|"dosyadan"|"tahmin", "alinti": "dosyadan ise kaynak cümle", "belgeId": "biliniyorsa" } }',
          additionalProperties: {
            type: 'object',
            properties: {
              kaynak: { type: 'string', enum: ['doktor_soyledi', 'dosyadan', 'tahmin'] },
              alinti: { type: 'string' },
              belgeId: { type: 'string' },
              notId: { type: 'string' },
            },
            required: ['kaynak'],
          },
        },
      },
      required: [],
    },
  }))
}
