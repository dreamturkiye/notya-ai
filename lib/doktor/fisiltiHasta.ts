/**
 * NOTYA-AYSE-ANALIZ-01 (2026-10-02) — the Fısıltı of ONE patient, from the engine the Fısıltı card uses.
 *
 * Fısıltı (lib/doktor/fisiltiTopla.ts) collects its clinical candidates by calling the doctor's own branch kohort
 * route over HTTP (`/api/doktor/<rota>/kohort`). Each of those routes is a thin handler over one function,
 * `<brans>KohortVerisi(sb, doktorId, bugun, sadece?)`, and every one of the 30 takes an optional list of patient ids.
 * Ayşe's `eksikler` tool has no request to fetch with, so it calls that SAME function in process, for one patient —
 * the same rules on the same rows, without the HTTP hop — and normalises the row with Fısıltı's own
 * `normalizeKohortSatiri`. Nothing clinical is implemented here.
 *
 * WHICH BRANCHES. This module is imported by the model turn (lib/asistan/ayseCevapla.ts → okumaAraclari.ts), and a
 * model turn may not be able to reach code that writes (NOTYA-EYLEM-24, core/eylemler/tests/sessizYol.test.ts walks
 * the import graph, dynamic imports included). In 25 branches the kohort function shares its file with the reminder
 * sender, which writes patient messages. Only the branches whose engine file is READ-ONLY are registered here:
 * pediatri, dermatoloji, dahiliye, göz, kadın hastalıkları ve doğum (their senders live in a separate file). For the
 * other 25 the tool says that the branch's Fısıltı rules are not connected — it does not guess. Connecting one means
 * moving its sender out of `_kohort.ts` (as pediatri's `_kohortHatirlatma.ts`); lib/doktor/fisiltiHasta.test.ts then
 * requires the branch to be added here.
 *
 * `bugun` is the date the branch's route passes: Turkey time for pediatri and gebelik, the UTC date for the others
 * (as each route does today).
 *
 * HASTA-IZOLASYON-01: every kohort function scopes its reads by the doctor id it is given; the patient id comes from
 * the caller, who has resolved it among this doctor's patients. A foreign id yields no row.
 *
 * Not included: the two non-clinical Fısıltı sources (unanswered portal messages, pending WhatsApp drafts).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { FISILTI_DESTEKLI_BRANSLAR, normalizeKohortSatiri, type FisiltiItem } from '@/lib/doktor/fisiltiOrtak'
import { fisiltiAyir } from '@/lib/doktor/fisiltiGizle'
import { fisiltiGizlemeleri } from '@/lib/doktor/fisiltiTopla'

type KohortFn = (sb: SupabaseClient, doktorId: string, bugun: string, sadece?: string[]) => Promise<{ satirlar: unknown[] }>
interface KohortKaydi {
  /** The function the branch's kohort route calls. */
  yukle: () => Promise<KohortFn>
  /** Name of that function — the registry test checks the route really calls it. */
  ad: string
  /** The route passes the Turkey-time date (the others pass the UTC date). */
  trt?: boolean
}
const k = (ad: string, yukle: () => Promise<unknown>, trt = false): KohortKaydi => ({ ad, yukle: yukle as () => Promise<KohortFn>, trt })

/** Branch key (FISILTI_DESTEKLI_BRANSLAR) → the kohort function of its route. Read-only engine files only. */
export const BRANS_KOHORTLARI: Record<string, KohortKaydi> = {
  'pediatri': k('pediKohortVerisi', () => import('@/app/api/doktor/pediatri/_kohort').then((m) => m.pediKohortVerisi), true),
  'dermatoloji': k('dermKohortVerisi', () => import('@/app/api/doktor/dermatoloji/_kohort').then((m) => m.dermKohortVerisi)),
  'dahiliye': k('kohortVerisi', () => import('@/app/api/doktor/dahiliye/_kohort').then((m) => m.kohortVerisi)),
  'goz-hastaliklari': k('gozKohortVerisi', () => import('@/app/api/doktor/goz/_kohort').then((m) => m.gozKohortVerisi)),
  'kadin-hastaliklari-dogum': k('kdKohortVerisi', () => import('@/app/api/doktor/gebelik/_kohort').then((m) => m.kdKohortVerisi), true),
}

export interface HastaFisiltisi {
  /** The doctor's branch has a Fısıltı engine (the same list the Fısıltı card uses). */
  destekli: boolean
  /** That engine can be read from here (see WHICH BRANCHES above). false: the caller says so and does not guess. */
  bagli: boolean
  brans: string | null
  /** What the engine reports for this patient; null = it reports nothing for this patient. */
  oge: FisiltiItem | null
  /** The doctor hid this item on the card (and its facts have not changed since). */
  gizli: boolean
  /** The doctor muted this patient's whispers for this branch. */
  sessiz: boolean
  /** The engine could not be read — the caller must NOT say "no gaps". */
  hata: boolean
}

const bugunUtc = (d: Date) => d.toISOString().slice(0, 10)
const bugunTrt = (d: Date) => new Date(d.getTime() + 3 * 3600e3).toISOString().slice(0, 10)

/** `patientId` must already be resolved among this doctor's patients. */
export async function hastaFisiltisi(supabase: SupabaseClient, doktorId: string, patientId: string, simdi = new Date()): Promise<HastaFisiltisi> {
  const bos = { oge: null, gizli: false, sessiz: false, hata: false }
  const { data: profil } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  const brans = bransAnahtari(String((profil as { specialty?: string } | null)?.specialty || '')) || null
  const destekli = Boolean(brans) && FISILTI_DESTEKLI_BRANSLAR.has(String(brans))
  const kayit = destekli && brans ? BRANS_KOHORTLARI[brans] : undefined
  if (!brans || !kayit) return { destekli, bagli: false, brans, ...bos }
  try {
    const kohort = await kayit.yukle()
    const { satirlar } = await kohort(supabase, doktorId, kayit.trt ? bugunTrt(simdi) : bugunUtc(simdi), [patientId])
    const satir = ((satirlar || []) as Record<string, unknown>[]).find((s) => String(s.patientId || s.patient_id || '') === patientId)
    const oge = satir ? normalizeKohortSatiri(satir, brans) : null
    if (!oge) return { destekli: true, bagli: true, brans, ...bos }
    const [gizlemeler, sessizQ] = await Promise.all([
      fisiltiGizlemeleri(supabase, doktorId).catch(() => []),
      supabase.from('fisilti_sessizler').select('patient_id').eq('doctor_id', doktorId).eq('brans', brans).eq('patient_id', patientId).is('kaldirildi_at', null),
    ])
    return {
      destekli: true, bagli: true, brans, oge,
      gizli: fisiltiAyir([oge], gizlemeler, simdi).gizli.length > 0,
      sessiz: Boolean((sessizQ.data || []).length),
      hata: false,
    }
  } catch (e) {
    console.error('[fisilti/hasta]', e instanceof Error ? e.message : String(e))
    return { destekli: true, bagli: true, brans, ...bos, hata: true }
  }
}
