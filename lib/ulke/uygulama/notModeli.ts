/**
 * NOTYA-UZ-MUAYENE-01 — the ONE place a country's visit code talks to the language model.
 *
 * MODEL POLICY (.cursor/skills/ai-model-politikasi/SKILL.md), followed as written:
 *   - no model name here or anywhere on this side: the call names a TASK ('soap' for the note, 'not-uretimi' for the
 *     rewrite) and the shared gateway (lib/ai/cagir.ts → aiCagir) picks the model, the fallback gates, the time
 *     budget and the usage row. Whatever the policy says tomorrow applies here without an edit;
 *   - both tasks are "structured" by the gateway's own defaults, so an answer that is not JSON falls to the guard
 *     model once, as for every other caller;
 *   - the instruction (the pack's, fixed per language and template) is the cached system block; nothing about a
 *     doctor or a patient is in it. The transcript is the user message;
 *   - `doctorId` is given for the usage row. A patient id is never given;
 *   - NOTYA-ULKE-ASISTAN-01: the assistant's answer is the expert-conversation task, STREAMED through the gateway's
 *     own streaming door (aiAkis), which falls to the guard model only before the first word. Its answer is prose,
 *     so the call says that no JSON is expected.
 *
 * BOUNDARY. The gateway reports failures in Turkish (its own engineers' language). Nothing it throws leaves this
 * file: the caller gets null, the route answers with a code, the screen shows the pack's wording. The log line
 * carries the kind of error and, for a provider error, its HTTP status — never the message.
 *
 * No instruction text lives here: it comes from the active pack (countries/active/klinik).
 */
import { aiAkis, aiCagir, AiCagriHatasi, yanitMetni } from '@/lib/ai/cagir'
import { jsonOnarDetay } from '@/lib/ai/jsonOnar'
import { modelSec } from '@/lib/ai/modeller'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NOT_ALANLARI_ANAHTARI, type NotIcerigi } from '../tipler'
import { kullanimEkle, yanitTokenlari, type KullanimGorevi } from './kullanimOlcumu'

export type NotGorevi = 'soap' | 'not-uretimi'

/** Longest section the application keeps. */
export const BOLUM_AZAMI = 20_000

const bolum = (ham: unknown): string => {
  const t = Array.isArray(ham) ? ham.map((x) => String(x ?? '')).join('\n') : typeof ham === 'string' ? ham : ham == null ? '' : String(ham)
  return t.trim().slice(0, BOLUM_AZAMI)
}

/** Longest field text the application keeps, and the most fields it reads from one answer. */
export const ALAN_AZAMI = 4_000
const ALAN_SAYISI_AZAMI = 400
const ALAN_ANAHTARI = /^[a-z][a-z0-9_]{0,59}$/

/**
 * NOTYA-UZ-BRANSLAR-01 — the fields of an answer or of a request: plain keys, text values, empty ones dropped.
 * SHAPE only. Which keys a note may keep is decided afterwards, against the pack's list for the note's template
 * (lib/ulke/uygulama/notlar.ts → alanlariSuz). undefined = none.
 */
export function alanlariOku(ham: unknown): Record<string, string> | undefined {
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) return undefined
  const cikti: Record<string, string> = {}
  for (const [k, v] of Object.entries(ham as Record<string, unknown>).slice(0, ALAN_SAYISI_AZAMI)) {
    if (!ALAN_ANAHTARI.test(k) || (v !== null && typeof v === 'object' && !Array.isArray(v))) continue
    const t = bolum(v).slice(0, ALAN_AZAMI)
    if (t) cikti[k] = t
  }
  return Object.keys(cikti).length ? cikti : undefined
}

/** The model's answer as a note, or null when it is not one (no object, or all four sections empty). Pure. */
export function notIceriginiOku(metin: string): NotIcerigi | null {
  const r = jsonOnarDetay(metin)
  if (r.deger === null || typeof r.deger !== 'object' || Array.isArray(r.deger)) return null
  const o = r.deger as Record<string, unknown>
  const icerik: NotIcerigi = { s: bolum(o.s), o: bolum(o.o), a: bolum(o.a), p: bolum(o.p) }
  if (!(icerik.s || icerik.o || icerik.a || icerik.p)) return null
  const alanlar = alanlariOku(o[NOT_ALANLARI_ANAHTARI])
  return alanlar ? { ...icerik, alanlar } : icerik
}

/** The label stored with a note for "which model wrote this": the policy's model for the note task, never a literal. */
export const notModelEtiketi = (): string => modelSec('soap').model

/**
 * NOTYA-ULKE-PORTAL-01 — `olcum`: where the call is counted (lib/ulke/uygulama/kullanimOlcumu.ts). Every call that
 * the gateway ANSWERED is counted once, with the tokens of the answer it returned — whether or not that answer then
 * turns out to be usable. (When the gateway fell back to its guard model, the tokens are the guard's answer's.)
 */
type Olcum = { supabase: SupabaseClient; gorev: KullanimGorevi }
type ModelGirdisi = { gorev: NotGorevi; talimat: string; girdi: string; doktorId: string; butceMs?: number; olcum?: Olcum }

/** The gateway's answer as text, or null. Nothing it throws leaves this file. */
async function modeldenMetin(g: ModelGirdisi, etiket: string): Promise<string | null> {
  try {
    const yanit = await aiCagir({
      gorev: g.gorev,
      system: [{ metin: g.talimat, onbellek: true }],
      messages: [{ role: 'user', content: g.girdi }],
      doctorId: g.doktorId,
      ...(g.butceMs ? { butceMs: g.butceMs } : {}),
    })
    if (g.olcum) await kullanimEkle(g.olcum.supabase, g.doktorId, g.olcum.gorev, yanitTokenlari(yanit))
    return yanitMetni(yanit)
  } catch (e) {
    console.error(`[ulke/${etiket}] ${g.gorev}: ${e instanceof AiCagriHatasi ? `gateway ${e.durum}` : e instanceof Error ? e.name : typeof e}`)
    return null
  }
}

export async function modeldenNot(g: ModelGirdisi): Promise<NotIcerigi | null> {
  const metin = await modeldenMetin(g, 'not')
  return metin === null ? null : notIceriginiOku(metin)
}

/** The key under which the model returns a summary for the patient. One word, shared by packs and core. */
export const HASTA_OZETI_ANAHTARI = 'summary'

/** The model's answer as a summary for the patient, or null when it is not one. Pure. */
export function hastaOzetiniOku(metin: string, azami: number): string | null {
  const r = jsonOnarDetay(metin)
  if (r.deger === null || typeof r.deger !== 'object' || Array.isArray(r.deger)) return null
  const ham = (r.deger as Record<string, unknown>)[HASTA_OZETI_ANAHTARI]
  const t = (Array.isArray(ham) ? ham.map((x) => String(x ?? '')).join('\n') : typeof ham === 'string' ? ham : '').trim()
  return t ? t.slice(0, azami) : null
}

/**
 * NOTYA-ULKE-PORTAL-01 — a plain-language summary of an approved note, for the patient. Same gateway, same rules as
 * the note: the call names a TASK (the rewriting task: a short structured answer made from an existing note) and
 * the policy picks the model; the pack's instruction is the cached system block and holds nothing about a doctor or
 * a patient; the approved note is the user message. Nothing is shown to a patient from here: the doctor reads the
 * draft, may change it, and shares it or not.
 */
export async function modeldenHastaOzeti(g: Omit<ModelGirdisi, 'gorev'> & { azami: number }): Promise<string | null> {
  const metin = await modeldenMetin({ ...g, gorev: 'not-uretimi' }, 'ozet')
  return metin === null ? null : hastaOzetiniOku(metin, g.azami)
}

// ───────────────────────── NOTYA-ULKE-ASISTAN-01 — the assistant's answer, streamed ─────────────────────────

export type AkisGirdisi = {
  /** The first block: the pack's instruction for a role and a form. The same for every doctor of that role: cached. */
  talimat: string
  /** The second block: "no patient's data was given", or the pack's sentence and one patient's data. Never cached. */
  ikinciBlok: string
  /** The patient's data once more, ONLY for the gateway's own safety scan. It is not sent to the model a second time. */
  guvenlikBaglami?: string
  /** The conversation so far, oldest first, ending with the question that is being asked. */
  mesajlar: readonly { yazan: 'hekim' | 'asistan'; metin: string }[]
  doktorId: string
  butceMs?: number
  olcum?: Olcum
}
/** `kesildi`: the answer stops short (the provider broke off after the first word, or the answer reached its ceiling). */
export type AkisSonucu = { metin: string; kesildi: boolean }

/**
 * The assistant's answer as it is being written: `parca` receives every piece the moment the gateway has it, and the
 * whole answer comes back at the end. null = nothing was said at all (the provider failed before the first word, the
 * guard failed too, or the answer was empty). An answer that broke off AFTER it began is returned as far as it got,
 * marked `kesildi`: a word that was shown is never taken back and never said twice. Nothing the gateway throws
 * leaves this file.
 */
export async function modeldenAkis(g: AkisGirdisi, parca: (metin: string) => void): Promise<AkisSonucu | null> {
  let soylenen = ''
  try {
    const yanit = await aiAkis(
      {
        gorev: 'sohbet-uzman',
        system: [{ metin: g.talimat, onbellek: true }, { metin: g.ikinciBlok }],
        messages: g.mesajlar.map((m) => ({ role: m.yazan === 'hekim' ? ('user' as const) : ('assistant' as const), content: m.metin })),
        doctorId: g.doktorId,
        jsonBekleniyor: false,
        ...(g.guvenlikBaglami ? { guvenlikBaglami: g.guvenlikBaglami } : {}),
        ...(g.butceMs ? { butceMs: g.butceMs } : {}),
      },
      (p) => { if (p) { soylenen += p; parca(p) } },
    )
    if (g.olcum) await kullanimEkle(g.olcum.supabase, g.doktorId, g.olcum.gorev, yanitTokenlari(yanit))
    if (!soylenen.trim()) return null
    return { metin: soylenen, kesildi: (yanit as { stop_reason?: unknown }).stop_reason === 'max_tokens' }
  } catch (e) {
    console.error(`[ulke/asistan] sohbet-uzman: ${e instanceof AiCagriHatasi ? `gateway ${e.durum}` : e instanceof Error ? e.name : typeof e}`)
    return soylenen.trim() ? { metin: soylenen, kesildi: true } : null
  }
}
