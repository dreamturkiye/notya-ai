/**
 * GERI-CAGIRMA-01 — attribution refresh and the STORED counters. Server only (Türkiye's tables).
 *
 * The home card never computes anything: `ozetOku` reads two small keyed rows sets (this doctor's last six monthly
 * rows + the settings row). `sayaclariYenile` is the only writer; it runs when the doctor opens the recall screen,
 * after a send, and — at most once per STALE_MS per doctor — in the background after the home page has rendered.
 * The rule it applies is ./atif.ts, word for word.
 *
 * HASTA-IZOLASYON: every read carries the doctor id together with the patient ids; every write names the recall row
 * by id AND doctor AND patient.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import { atifHesapla, aylikHesapla, kartGosterilsinMi, type AtifKaydi, type AtifRandevusu, type AtifTahsilati, type AtifViziti } from './atif'
import { SAAT_DILIMI, ULKE } from './kaynak'
import { ATIF_PENCERESI_GUN, EGILIM_AY_SAYISI, ayAnahtari, bosSayac, sonAylar, type AylikSayac, type GeriCagirmaOzeti } from './tipler'

const GUN_MS = 86_400_000
export const PARA_BIRIMI = 'TRY'
/** The stored "can be recalled now" number is refreshed in the background when it is older than this. */
export const BAYAT_MS = 12 * 3_600_000
const KAYIT_SINIRI = 5000

const ayBasi = (ay: string): string => `${ay}-01`

type KayitSatiri = { id: string; patient_id: string; durum: string; gonderildi_at: string | null; randevu_id: string | null; randevu_at: string | null; randevu_yolu: 'baglanti' | 'diger' | null; geldi_at: string | null; tahsilat_kurus: number | null }

const kayitYap = (r: KayitSatiri): AtifKaydi => ({ id: String(r.id), patientId: String(r.patient_id), durum: r.durum, gonderildiAt: r.gonderildi_at, randevuId: r.randevu_id ? String(r.randevu_id) : null, randevuAt: r.randevu_at, randevuYolu: r.randevu_yolu, geldiAt: r.geldi_at, tahsilatKurus: r.tahsilat_kurus == null ? null : Number(r.tahsilat_kurus) })

/**
 * Recomputes attribution for this doctor's recent recalls and rewrites the stored monthly counters.
 * `cagrilabilir` (when given) is stored as the "can be recalled now" number. Returns false when 196 is not applied.
 */
export async function sayaclariYenile(sb: SupabaseClient, doktorId: string, g: { simdi?: number; cagrilabilir?: number } = {}): Promise<boolean> {
  const simdi = g.simdi ?? Date.now()
  const aylar = sonAylar(ayAnahtari(simdi, SAAT_DILIMI), EGILIM_AY_SAYISI)
  // A booking in the first trend month can belong to a recall sent up to one window earlier.
  const altSinir = new Date(Date.parse(`${ayBasi(aylar[0])}T00:00:00Z`) - (ATIF_PENCERESI_GUN + 2) * GUN_MS).toISOString()

  const { data: ham, error } = await sb.from('geri_cagirma_kayitlari')
    .select('id, patient_id, durum, gonderildi_at, randevu_id, randevu_at, randevu_yolu, geldi_at, tahsilat_kurus')
    .eq('ulke', ULKE).eq('doctor_id', doktorId).eq('durum', 'gonderildi').gte('gonderildi_at', altSinir)
    .order('gonderildi_at', { ascending: false }).limit(KAYIT_SINIRI)
  if (error) return false
  let kayitlar = ((ham || []) as KayitSatiri[]).map(kayitYap)

  if (kayitlar.length) {
    const hastalar = [...new Set(kayitlar.map((k) => k.patientId))]
    const [rQ, vQ, fQ] = await Promise.all([
      sb.from('randevular').select('id, patient_id, created_at, baslangic, durum').eq('doktor_id', doktorId).in('patient_id', hastalar).gte('created_at', altSinir).limit(KAYIT_SINIRI),
      arsivsizSeanslar(sb, 'patient_id, created_at').eq('doctor_id', doktorId).in('patient_id', hastalar).gte('created_at', altSinir).limit(KAYIT_SINIRI),
      sb.from('accounting_invoices').select('id, patient_id').eq('doctor_id', doktorId).in('patient_id', hastalar).limit(KAYIT_SINIRI),
    ])
    const randevular: AtifRandevusu[] = ((rQ.error ? [] : rQ.data || []) as { id: string; patient_id: string | null; created_at: string | null; baslangic: string; durum: string }[])
      .filter((r) => r.patient_id && r.created_at)
      .map((r) => ({ id: String(r.id), patientId: String(r.patient_id), olusturuldu: String(r.created_at), baslangic: String(r.baslangic), iptal: r.durum === 'iptal', tamamlandi: r.durum === 'tamamlandi' }))
    const vizitler: AtifViziti[] = ((vQ.error ? [] : vQ.data || []) as { patient_id: string; created_at: string }[]).map((v) => ({ patientId: String(v.patient_id), an: String(v.created_at) }))
    // Recorded payments only: a payment row the practice's accounting marked `captured`. No accounting → no amount.
    const tahsilatlar: AtifTahsilati[] = []
    const faturalar = ((fQ.error ? [] : fQ.data || []) as { id: string; patient_id: string | null }[]).filter((f) => f.patient_id)
    if (faturalar.length) {
      const faturaHastasi = new Map(faturalar.map((f) => [String(f.id), String(f.patient_id)]))
      const { data: odemeler, error: oHata } = await sb.from('accounting_payments').select('invoice_id, amount_kurus, status, created_at')
        .eq('doctor_id', doktorId).in('invoice_id', [...faturaHastasi.keys()]).eq('status', 'captured').gte('created_at', altSinir).limit(KAYIT_SINIRI)
      if (!oHata) for (const o of (odemeler || []) as { invoice_id: string; amount_kurus: number; created_at: string }[]) {
        const h = faturaHastasi.get(String(o.invoice_id))
        if (h) tahsilatlar.push({ patientId: h, an: String(o.created_at), kurus: Number(o.amount_kurus) || 0 })
      }
    }

    const degisen = atifHesapla(kayitlar, randevular, vizitler, tahsilatlar, SAAT_DILIMI)
    if (degisen.length) {
      const hastaBul = new Map(kayitlar.map((k) => [k.id, k.patientId]))
      const simdiIso = new Date(simdi).toISOString()
      // Only rows whose stored values change are written, in bounded parallel groups (never one round trip per recall).
      for (let i = 0; i < degisen.length; i += 25) {
        await Promise.all(degisen.slice(i, i + 25).map((d) => sb.from('geri_cagirma_kayitlari')
          .update({ randevu_id: d.randevuId, randevu_at: d.randevuAt, randevu_yolu: d.randevuYolu, geldi_at: d.geldiAt, tahsilat_kurus: d.tahsilatKurus, para_birimi: d.tahsilatKurus != null ? PARA_BIRIMI : null, atif_guncellendi_at: simdiIso })
          .eq('id', d.id).eq('ulke', ULKE).eq('doctor_id', doktorId).eq('patient_id', hastaBul.get(d.id) || '')))
      }
      const yeni = new Map(degisen.map((d) => [d.id, d]))
      kayitlar = kayitlar.map((k) => { const d = yeni.get(k.id); return d ? { ...k, randevuId: d.randevuId, randevuAt: d.randevuAt, randevuYolu: d.randevuYolu, geldiAt: d.geldiAt, tahsilatKurus: d.tahsilatKurus } : k })
    }
  }

  const simdiIso = new Date(simdi).toISOString()
  const sayaclar = aylikHesapla(kayitlar, aylar, SAAT_DILIMI)
  const yaz = await sb.from('geri_cagirma_aylik').upsert(
    sayaclar.map((s) => ({ ulke: ULKE, doctor_id: doktorId, ay: ayBasi(s.ay), gonderilen: s.gonderilen, randevu_alan: s.randevuAlan, gelen: s.gelen, tahsilat_kurus: s.tahsilatKurus, para_birimi: PARA_BIRIMI, guncellendi_at: simdiIso })),
    { onConflict: 'ulke,doctor_id,ay' },
  )
  if (yaz.error) return false
  if (typeof g.cagrilabilir === 'number' && g.cagrilabilir >= 0) {
    await sb.from('geri_cagirma_ayarlari').upsert({ ulke: ULKE, doctor_id: doktorId, cagrilabilir: Math.floor(g.cagrilabilir), cagrilabilir_at: simdiIso, updated_at: simdiIso }, { onConflict: 'ulke,doctor_id' })
  }
  return true
}

/** The home card's numbers — stored rows only, two keyed reads in parallel, nothing recomputed. */
export async function ozetOku(sb: SupabaseClient, doktorId: string, simdi: number = Date.now()): Promise<GeriCagirmaOzeti> {
  const buAy = ayAnahtari(simdi, SAAT_DILIMI)
  const aylar = sonAylar(buAy, EGILIM_AY_SAYISI)
  const bos: GeriCagirmaOzeti = { kurulu: false, goster: false, cagrilabilir: 0, bayat: false, buAy: bosSayac(buAy), egilim: aylar.map(bosSayac), paraBirimi: PARA_BIRIMI }
  const [aQ, sQ] = await Promise.all([
    sb.from('geri_cagirma_aylik').select('ay, gonderilen, randevu_alan, gelen, tahsilat_kurus').eq('ulke', ULKE).eq('doctor_id', doktorId).gte('ay', ayBasi(aylar[0])).order('ay', { ascending: true }).limit(EGILIM_AY_SAYISI + 1),
    sb.from('geri_cagirma_ayarlari').select('cagrilabilir, cagrilabilir_at').eq('ulke', ULKE).eq('doctor_id', doktorId).maybeSingle(),
  ])
  if (aQ.error || sQ.error) return (tabloYokMu(aQ.error) || tabloYokMu(sQ.error)) ? bos : { ...bos, kurulu: true }
  const satirlar = new Map(((aQ.data || []) as { ay: string; gonderilen: number; randevu_alan: number; gelen: number; tahsilat_kurus: number }[]).map((r) => [String(r.ay).slice(0, 7), r]))
  const egilim: AylikSayac[] = aylar.map((ay) => {
    const r = satirlar.get(ay)
    return r ? { ay, gonderilen: Number(r.gonderilen) || 0, randevuAlan: Number(r.randevu_alan) || 0, gelen: Number(r.gelen) || 0, tahsilatKurus: Number(r.tahsilat_kurus) || 0 } : bosSayac(ay)
  })
  const ayar = sQ.data as { cagrilabilir?: number | null; cagrilabilir_at?: string | null } | null
  const cagrilabilir = Math.max(0, Number(ayar?.cagrilabilir) || 0)
  const yas = ayar?.cagrilabilir_at ? simdi - Date.parse(ayar.cagrilabilir_at) : Infinity
  return { kurulu: true, goster: kartGosterilsinMi(cagrilabilir, egilim), cagrilabilir, bayat: !(yas < BAYAT_MS), buAy: egilim[egilim.length - 1], egilim, paraBirimi: PARA_BIRIMI }
}

/**
 * A booking made through a recall's own tagged link (`?gc=<recall id>` on the patient's portal booking page).
 * The doctor and the patient come from the PIN-unlocked portal token, never from the request: the recall is stamped
 * only when it is THAT doctor's recall of THAT patient, it left, it is unclaimed and still inside the window.
 * A foreign, unknown or expired id changes nothing and reveals nothing. Never throws.
 */
export async function baglantiAtfi(sb: SupabaseClient, g: { doktorId: string; patientId: string; gc: unknown; randevuId: string; simdi?: number }): Promise<boolean> {
  try {
    if (typeof g.gc !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(g.gc)) return false
    const simdi = g.simdi ?? Date.now()
    const { data, error } = await sb.from('geri_cagirma_kayitlari')
      .update({ randevu_id: g.randevuId, randevu_at: new Date(simdi).toISOString(), randevu_yolu: 'baglanti', atif_guncellendi_at: new Date(simdi).toISOString() })
      .eq('id', g.gc).eq('ulke', ULKE).eq('doctor_id', g.doktorId).eq('patient_id', g.patientId).eq('durum', 'gonderildi').is('randevu_id', null)
      .gte('gonderildi_at', new Date(simdi - ATIF_PENCERESI_GUN * GUN_MS).toISOString())
      .select('id')
    return !error && !!data && data.length > 0
  } catch {
    return false
  }
}

/** Founder console: this build's totals for the current month. Counts only — no doctor, no patient, no amount. */
export async function ulkeToplami(sb: SupabaseClient, simdi: number = Date.now()): Promise<{ ay: string; gonderilen: number; randevuAlan: number; gelen: number } | null> {
  const ay = ayAnahtari(simdi, SAAT_DILIMI)
  const { data, error } = await sb.from('geri_cagirma_aylik').select('gonderilen, randevu_alan, gelen').eq('ulke', ULKE).eq('ay', ayBasi(ay)).limit(10000)
  if (error) return null
  const t = { ay, gonderilen: 0, randevuAlan: 0, gelen: 0 }
  for (const r of (data || []) as { gonderilen: number; randevu_alan: number; gelen: number }[]) { t.gonderilen += Number(r.gonderilen) || 0; t.randevuAlan += Number(r.randevu_alan) || 0; t.gelen += Number(r.gelen) || 0 }
  return t
}
