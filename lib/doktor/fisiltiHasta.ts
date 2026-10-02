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
 * `bugun` is the date the branch's route passes: Turkey time for pediatri and gebelik, the UTC date for the other 28
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

/** Branch key (FISILTI_DESTEKLI_BRANSLAR) → the kohort function of its route. */
export const BRANS_KOHORTLARI: Record<string, KohortKaydi> = {
  'pediatri': k('pediKohortVerisi', () => import('@/app/api/doktor/pediatri/_kohort').then((m) => m.pediKohortVerisi), true),
  'dermatoloji': k('dermKohortVerisi', () => import('@/app/api/doktor/dermatoloji/_kohort').then((m) => m.dermKohortVerisi)),
  'dahiliye': k('kohortVerisi', () => import('@/app/api/doktor/dahiliye/_kohort').then((m) => m.kohortVerisi)),
  'kardiyoloji': k('kardioKohortVerisi', () => import('@/app/api/doktor/kardiyoloji/_kohort').then((m) => m.kardioKohortVerisi)),
  'noroloji': k('noroKohortVerisi', () => import('@/app/api/doktor/noroloji/_kohort').then((m) => m.noroKohortVerisi)),
  'uroloji': k('uroKohortVerisi', () => import('@/app/api/doktor/uroloji/_kohort').then((m) => m.uroKohortVerisi)),
  'anestezi': k('anesteziKohortVerisi', () => import('@/app/api/doktor/anestezi/_kohort').then((m) => m.anesteziKohortVerisi)),
  'gastroenteroloji': k('gastroKohortVerisi', () => import('@/app/api/doktor/gastroenteroloji/_kohort').then((m) => m.gastroKohortVerisi)),
  'fizik-tedavi': k('ftrKohortVerisi', () => import('@/app/api/doktor/fizik-tedavi/_kohort').then((m) => m.ftrKohortVerisi)),
  'acil-tip': k('atKohortVerisi', () => import('@/app/api/doktor/acil-tip/_kohort').then((m) => m.atKohortVerisi)),
  'plastik-cerrahi': k('plastikKohortVerisi', () => import('@/app/api/doktor/plastik-cerrahi/_kohort').then((m) => m.plastikKohortVerisi)),
  'gogus-cerrahisi': k('gcKohortVerisi', () => import('@/app/api/doktor/gogus-cerrahisi/_kohort').then((m) => m.gcKohortVerisi)),
  'kalp-damar-cerrahisi': k('kdcKohortVerisi', () => import('@/app/api/doktor/kalp-damar-cerrahisi/_kohort').then((m) => m.kdcKohortVerisi)),
  'genel-cerrahi': k('gcKohortVerisi', () => import('@/app/api/doktor/genel-cerrahi/_kohort').then((m) => m.gcKohortVerisi)),
  'cocuk-cerrahisi': k('ccKohortVerisi', () => import('@/app/api/doktor/cocuk-cerrahisi/_kohort').then((m) => m.ccKohortVerisi)),
  'nefroloji': k('nefKohortVerisi', () => import('@/app/api/doktor/nefroloji/_kohort').then((m) => m.nefKohortVerisi)),
  'psikiyatri': k('psikKohortVerisi', () => import('@/app/api/doktor/psikiyatri/_kohort').then((m) => m.psikKohortVerisi)),
  'kulak-burun-bogaz': k('kbbKohortVerisi', () => import('@/app/api/doktor/kulak-burun-bogaz/_kohort').then((m) => m.kbbKohortVerisi)),
  'spor-hekimligi': k('sporKohortVerisi', () => import('@/app/api/doktor/spor-hekimligi/_kohort').then((m) => m.sporKohortVerisi)),
  'ortopedi': k('ortoKohortVerisi', () => import('@/app/api/doktor/ortopedi/_kohort').then((m) => m.ortoKohortVerisi)),
  'gogus-hastaliklari': k('gogusKohortVerisi', () => import('@/app/api/doktor/gogus-hastaliklari/_kohort').then((m) => m.gogusKohortVerisi)),
  'romatoloji': k('romaKohortVerisi', () => import('@/app/api/doktor/romatoloji/_kohort').then((m) => m.romaKohortVerisi)),
  'enfeksiyon-hastaliklari': k('enfKohortVerisi', () => import('@/app/api/doktor/enfeksiyon-hastaliklari/_kohort').then((m) => m.enfKohortVerisi)),
  'aile-hekimligi': k('aileKohortVerisi', () => import('@/app/api/doktor/aile-hekimligi/_kohort').then((m) => m.aileKohortVerisi)),
  'onkoloji': k('onkoKohortVerisi', () => import('@/app/api/doktor/onkoloji/_kohort').then((m) => m.onkoKohortVerisi)),
  'goz-hastaliklari': k('gozKohortVerisi', () => import('@/app/api/doktor/goz/_kohort').then((m) => m.gozKohortVerisi)),
  'endokrinoloji': k('endoKohortVerisi', () => import('@/app/api/doktor/endokrinoloji/_kohort').then((m) => m.endoKohortVerisi)),
  'beyin-cerrahisi': k('bcKohortVerisi', () => import('@/app/api/doktor/beyin-cerrahisi/_kohort').then((m) => m.bcKohortVerisi)),
  'kadin-hastaliklari-dogum': k('kdKohortVerisi', () => import('@/app/api/doktor/gebelik/_kohort').then((m) => m.kdKohortVerisi), true),
  'radyoloji': k('radyoKohortVerisi', () => import('@/app/api/doktor/radyoloji/_kohort').then((m) => m.radyoKohortVerisi)),
}

export interface HastaFisiltisi {
  /** The doctor's branch has a Fısıltı engine (the same list the Fısıltı card uses). */
  destekli: boolean
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
  const { data: profil } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
  const brans = bransAnahtari(String((profil as { specialty?: string } | null)?.specialty || '')) || null
  const kayit = brans && FISILTI_DESTEKLI_BRANSLAR.has(brans) ? BRANS_KOHORTLARI[brans] : undefined
  if (!brans || !kayit) return { destekli: false, brans, oge: null, gizli: false, sessiz: false, hata: false }
  try {
    const kohort = await kayit.yukle()
    const { satirlar } = await kohort(supabase, doktorId, kayit.trt ? bugunTrt(simdi) : bugunUtc(simdi), [patientId])
    const satir = ((satirlar || []) as Record<string, unknown>[]).find((s) => String(s.patientId || s.patient_id || '') === patientId)
    const oge = satir ? normalizeKohortSatiri(satir, brans) : null
    if (!oge) return { destekli: true, brans, oge: null, gizli: false, sessiz: false, hata: false }
    const [gizlemeler, sessizQ] = await Promise.all([
      fisiltiGizlemeleri(supabase, doktorId).catch(() => []),
      supabase.from('fisilti_sessizler').select('patient_id').eq('doctor_id', doktorId).eq('brans', brans).eq('patient_id', patientId).is('kaldirildi_at', null),
    ])
    return {
      destekli: true, brans, oge,
      gizli: fisiltiAyir([oge], gizlemeler, simdi).gizli.length > 0,
      sessiz: Boolean((sessizQ.data || []).length),
      hata: false,
    }
  } catch (e) {
    console.error('[fisilti/hasta]', e instanceof Error ? e.message : String(e))
    return { destekli: true, brans, oge: null, gizli: false, sessiz: false, hata: true }
  }
}
