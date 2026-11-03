/**
 * AU-GAP-CLOSE-01 — letter studio, MBS assist, PMS export. Doctor side only.
 *
 * MODEL POLICY: no model name here; calls go through lib/ulke/uygulama/notModeli.ts → the shared gateway.
 * PATIENT ISOLATION: every note id is read with the authenticated doctor's id (notGetir).
 * An unapproved note never produces a letter, an MBS suggestion, or an export pack.
 * Nothing is lodged with Medicare, written to Best Practice / Genie / Gentu, or shown to a patient from here.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { islemKaynagi } from '@/lib/ulke/kayit/islemKaynagi'
import { modeldenMektup, modeldenMbsOneri } from '@/lib/ulke/uygulama/notModeli'
import { notGetir } from '@/lib/ulke/uygulama/notlar'
import { BAKIM_PLAN_TURLERI, MEKTUP_AZAMI, MEKTUP_TURLERI, MBS_ONERI_AZAMI, PMS_EXPORT_SURUM, mektupTuruMu, type MektupTuru } from './sabitler'
import type { MbsOneri, MektupTaslak, PmsExportPaket } from './tipler'

export type MektupRetKodu = 'NOT_FOUND' | 'ONAYSIZ' | 'HAZIR_DEGIL' | 'YAZILAMADI' | 'GECERSIZ' | 'BASARISIZ'
type Ret = { tamam: false; kod: MektupRetKodu }
const ret = (kod: MektupRetKodu): Ret => ({ tamam: false, kod })

export const MEKTUP_DURUMU: Record<MektupRetKodu, number> = {
  NOT_FOUND: 404,
  ONAYSIZ: 409,
  HAZIR_DEGIL: 503,
  YAZILAMADI: 502,
  GECERSIZ: 400,
  BASARISIZ: 500,
}

async function onayliNot(supabase: SupabaseClient, doktorId: string, notId: string) {
  const not = await notGetir(supabase, doktorId, notId)
  if (!not) return ret('NOT_FOUND')
  if (!not.onayli) return ret('ONAYSIZ')
  return { tamam: true as const, not }
}

/** Which letter kinds (gp/referral/patient) this pack offers. */
export function mektupTurleri(): readonly MektupTuru[] {
  const k = AKTIF_KLINIK
  if (!k?.mektupTalimati) return []
  return MEKTUP_TURLERI.filter((t) => Boolean(k.mektupTalimati!(t)))
}

/** AU-GAP-CLOSE-03 — care-plan document kinds (gpmp/tca/ccmp/mhcp) this pack offers. */
export function bakimPlanTurleri(): readonly MektupTuru[] {
  const k = AKTIF_KLINIK
  if (!k?.mektupTalimati) return []
  return BAKIM_PLAN_TURLERI.filter((t) => Boolean(k.mektupTalimati!(t)))
}

export async function mektupHazirMi(supabase: SupabaseClient, doktorId: string, notId: string): Promise<{ onayli: boolean; yazilabilir: boolean; turler: readonly MektupTuru[]; bakimTurler: readonly MektupTuru[] } | null> {
  const not = await notGetir(supabase, doktorId, notId)
  if (!not) return null
  const turler = mektupTurleri()
  const bakimTurler = bakimPlanTurleri()
  return {
    onayli: not.onayli,
    yazilabilir: not.onayli && (turler.length > 0 || bakimTurler.length > 0),
    turler,
    bakimTurler,
  }
}

export async function mektupUret(
  supabase: SupabaseClient,
  doktorId: string,
  notId: string,
  turHam: unknown,
  butceMs?: number,
): Promise<{ tamam: true; mektup: MektupTaslak } | Ret> {
  const klinik = AKTIF_KLINIK
  if (!klinik?.mektupTalimati || !klinik.mektupGirdisi) return ret('HAZIR_DEGIL')
  if (!mektupTuruMu(turHam)) return ret('GECERSIZ')
  const n = await onayliNot(supabase, doktorId, notId)
  if (!n.tamam) return n
  const talimat = klinik.mektupTalimati(turHam)
  if (!talimat) return ret('HAZIR_DEGIL')
  const girdi = klinik.mektupGirdisi(turHam, n.not.icerik)
  const metin = await modeldenMektup({ talimat, girdi, doktorId, butceMs, azami: MEKTUP_AZAMI, olcum: { supabase, gorev: 'yeniden-yazim' } })
  if (!metin) return ret('YAZILAMADI')
  return { tamam: true, mektup: { tur: turHam, metin } }
}

/** Pure: keep only item-shaped suggestions that exist in the local MBS→ACHI map when the map is ready. */
export function mbsOnerileriniSuz(ham: readonly { item: string; aciklama: string; gerekce: string }[]): MbsOneri[] {
  const kaynak = islemKaynagi()
  const hazir = kaynak.hazir()
  const cikti: MbsOneri[] = []
  const gorulen = new Set<string>()
  for (const o of ham.slice(0, MBS_ONERI_AZAMI * 2)) {
    const item = String(o.item ?? '').trim().toUpperCase()
    if (!/^\d{1,6}[A-Z]{0,2}$/.test(item) || gorulen.has(item)) continue
    gorulen.add(item)
    let aciklama = String(o.aciklama ?? '').trim().slice(0, 240)
    if (hazir) {
      const bulunan = kaynak.ara(item, 3).find((x) => x.item.toUpperCase() === item)
      if (bulunan?.aciklama) aciklama = bulunan.aciklama.slice(0, 240)
      else if (!aciklama) continue // unknown item with no descriptor: drop rather than invent a fee
    }
    cikti.push({
      item,
      aciklama: aciklama || `MBS item ${item}`,
      gerekce: String(o.gerekce ?? '').trim().slice(0, 400),
      lodgeEdilmez: true,
    })
    if (cikti.length >= MBS_ONERI_AZAMI) break
  }
  return cikti
}

export async function mbsOneriUret(
  supabase: SupabaseClient,
  doktorId: string,
  notId: string,
  butceMs?: number,
): Promise<{ tamam: true; oneriler: MbsOneri[] } | Ret> {
  const klinik = AKTIF_KLINIK
  if (!klinik?.mbsOneriTalimati || !klinik.mbsOneriGirdisi) return ret('HAZIR_DEGIL')
  const n = await onayliNot(supabase, doktorId, notId)
  if (!n.tamam) return n
  const talimat = klinik.mbsOneriTalimati()
  if (!talimat) return ret('HAZIR_DEGIL')
  const girdi = klinik.mbsOneriGirdisi(n.not.icerik)
  const ham = await modeldenMbsOneri({ talimat, girdi, doktorId, butceMs, olcum: { supabase, gorev: 'yeniden-yazim' } })
  if (!ham) return ret('YAZILAMADI')
  return { tamam: true, oneriler: mbsOnerileriniSuz(ham) }
}

export async function pmsExportPaket(
  supabase: SupabaseClient,
  doktorId: string,
  notId: string,
  ekstra?: { mektuplar?: Partial<Record<MektupTuru, string>>; mbsOnerileri?: readonly MbsOneri[] },
): Promise<{ tamam: true; paket: PmsExportPaket } | Ret> {
  const n = await onayliNot(supabase, doktorId, notId)
  if (!n.tamam) return n
  const paket: PmsExportPaket = {
    surum: PMS_EXPORT_SURUM,
    ulke: ulkePaketi().kod,
    notId: n.not.notId,
    onayTarihi: n.not.onayTarihi,
    sablon: n.not.muayene.sablon,
    not: { s: n.not.icerik.s, o: n.not.icerik.o, a: n.not.icerik.a, p: n.not.icerik.p },
    ...(ekstra?.mektuplar && Object.keys(ekstra.mektuplar).length ? { mektuplar: ekstra.mektuplar } : {}),
    ...(ekstra?.mbsOnerileri?.length ? { mbsOnerileri: ekstra.mbsOnerileri } : {}),
    uyari: 'Export pack only. Notya did not connect to Best Practice, Genie, Gentu or any other practice-management system. Paste or import under your own control. MBS items are suggestions and must never be lodged from this file.',
  }
  return { tamam: true, paket }
}
