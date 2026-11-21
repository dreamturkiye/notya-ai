/**
 * DIKTE-TIBBI-01 — server side of medical dictation repair: load the doctor's personal pairs, repair a transcript,
 * learn pairs from the doctor's corrections. SERVER ONLY (service-role client; every query is scoped by doctor_id —
 * hasta-izolasyon: no patient id is read or written here, and no patient fact is ever stored).
 *
 * Fails soft everywhere: no table / no row / an error → the transcript goes on unrepaired by that part, never blocked.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { anahtar, hedefIndeksiKur, tibbiDuzelt, type Degisiklik, type KisiselCift } from './duzelt'
import { dikteSozluguYukle } from './sozluk'
import { ciftBicimi, duzeltmedenCiftler, KISISEL_AZAMI, type Cift } from './ogren'

export type DikteKaynak = 'elle' | 'not_duzeltme' | 'transkript_duzeltme'
const TABLO = 'doktor_dikte_sozlugu'

export async function kisiselSozlukYukle(sb: SupabaseClient, doktorId: string): Promise<KisiselCift[]> {
  try {
    const { data, error } = await sb.from(TABLO).select('duyulan, dogru').eq('doctor_id', doktorId).order('sayac', { ascending: false }).limit(KISISEL_AZAMI)
    if (error || !data) return []
    return data.map((r) => ({ duyulan: String(r.duyulan), dogru: String(r.dogru) }))
  } catch { return [] }
}

export interface TranskriptDuzeltmesi { metin: string; ham: string; degisiklikler: Degisiklik[] }

/**
 * Repair one transcript (≈ few ms; the SGK drug list is parsed once per process). `kisisel` may be passed when the
 * caller already loaded it (one query per request).
 */
export async function transkriptiDuzelt(sb: SupabaseClient, doktorId: string, brans: string | null | undefined, metin: string, kisisel?: KisiselCift[]): Promise<TranskriptDuzeltmesi> {
  const ham = String(metin || '')
  try {
    const [sozluk, kendi] = await Promise.all([dikteSozluguYukle(brans), kisisel ? Promise.resolve(kisisel) : kisiselSozlukYukle(sb, doktorId)])
    const { ilacIndeksi } = await import('./ilacSozlugu')
    const sonuc = tibbiDuzelt(ham, { sozluk, kisisel: kendi, ilaclar: ilacIndeksi() })
    return { metin: sonuc.metin, ham, degisiklikler: sonuc.degisiklikler }
  } catch (e) {
    console.error('[dikte] duzelt', e instanceof Error ? e.message : typeof e)
    return { metin: ham, ham, degisiklikler: [] }
  }
}

/** Known-term test for learning: the branş lexicon (core + branş) and the SGK drug words. */
export async function bilinenTerimFonksiyonu(brans: string | null | undefined): Promise<(k: string) => boolean> {
  const sozluk = await dikteSozluguYukle(brans)
  const lex = hedefIndeksiKur(sozluk.terimler).bilinen
  let ilac: Set<string> | null = null
  try { ilac = (await import('./ilacSozlugu')).ilacIndeksi()?.bilinen || null } catch { ilac = null }
  return (k: string) => lex.has(k) || Boolean(ilac?.has(k))
}

/** Upsert pairs for one doctor: three round trips whatever the number of pairs (existing rows, row count, one upsert). */
export async function dikteCiftleriniKaydet(sb: SupabaseClient, doktorId: string, ciftler: Cift[], kaynak: DikteKaynak): Promise<number> {
  const temiz = ciftler.map((c) => ciftBicimi(c.duyulan, c.dogru)).filter((c): c is Cift => Boolean(c)).slice(0, 20)
  if (!temiz.length) return 0
  try {
    const { data: mevcut } = await sb.from(TABLO).select('duyulan_anahtar, sayac').eq('doctor_id', doktorId).in('duyulan_anahtar', temiz.map((c) => anahtar(c.duyulan)))
    const sayac = new Map((mevcut || []).map((r) => [String(r.duyulan_anahtar), Number(r.sayac) || 1]))
    const { count: toplam } = await sb.from(TABLO).select('id', { count: 'exact', head: true }).eq('doctor_id', doktorId)
    let yer = KISISEL_AZAMI - (toplam ?? 0)
    const simdi = new Date().toISOString()
    const satirlar = temiz.flatMap((c) => {
      const k = anahtar(c.duyulan)
      const onceki = sayac.get(k)
      if (onceki === undefined) { if (yer <= 0) return []; yer -= 1 }
      return [{ doctor_id: doktorId, duyulan: c.duyulan, dogru: c.dogru, duyulan_anahtar: k, kaynak, sayac: (onceki ?? 0) + 1, updated_at: simdi }]
    })
    if (!satirlar.length) return 0
    const { error } = await sb.from(TABLO).upsert(satirlar, { onConflict: 'doctor_id,duyulan_anahtar' })
    if (error) { console.error('[dikte] kaydet', error.message); return 0 }
    return satirlar.length
  } catch (e) {
    console.error('[dikte] kaydet', e instanceof Error ? e.message : typeof e)
    return 0
  }
}

/** Learn from before/after text pairs (note field edits, or the dictated vs the final transcript). Background only. */
export async function duzeltmedenDikteOgren(sb: SupabaseClient, doktorId: string, brans: string | null | undefined, parcalar: { once: string; sonra: string }[], kaynak: DikteKaynak): Promise<number> {
  if (!parcalar.length) return 0
  const bilinen = await bilinenTerimFonksiyonu(brans)
  const ciftler = parcalar.flatMap((p) => duzeltmedenCiftler(String(p.once || '').slice(0, 20000), String(p.sonra || '').slice(0, 20000), bilinen))
  return ciftler.length ? dikteCiftleriniKaydet(sb, doktorId, ciftler, kaynak) : 0
}
