/**
 * NOTYA-SES-FISH-UCTAN-UCA-01 — Ayşe Kaya'nın Fish yolunun kullanım sayaçları (ses_kullanim, migration 110).
 * YALNIZ SAYI: metin, hasta, ses yazılmaz. Kayıt hatası sesi asla düşürmez.
 *
 * HASTA-IZOLASYON-01: satır yalnız oturum id + doctor_id eşleşirse yazılır — başka doktorun oturumuna sayaç açılmaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type SesKaynak = 'deepgram' | 'fish'
export type SesOlcu = 'ses_saniye' | 'baglanti_saniye' | 'oturum_saniye' | 'utf8_bayt' | 'karakter'
export type SesKullanimSatiri = { kaynak: SesKaynak; olcu: SesOlcu; miktar: number; model?: string | null }

const OLCULER: Record<SesOlcu, SesKaynak[]> = {
  ses_saniye: ['deepgram'], baglanti_saniye: ['deepgram'], oturum_saniye: ['deepgram'],
  utf8_bayt: ['fish'], karakter: ['fish'],
}
/** Tek raporda makul üst sınır (2 saatlik görüşme tavanı + pay); saçma sayı tabloya girmez. */
const UST_SANIYE = 3 * 60 * 60

/** Saf: istemciden gelen sayıları süzer (bilinmeyen ölçü, negatif / sonsuz / tavan üstü sayı atılır). */
export function kullanimSuz(satirlar: unknown): SesKullanimSatiri[] {
  if (!Array.isArray(satirlar)) return []
  const out: SesKullanimSatiri[] = []
  for (const s of satirlar.slice(0, 10)) {
    const r = s as Partial<SesKullanimSatiri>
    const olcu = r?.olcu as SesOlcu
    const kaynak = r?.kaynak as SesKaynak
    const miktar = Number(r?.miktar)
    if (!OLCULER[olcu]?.includes(kaynak)) continue
    if (!Number.isFinite(miktar) || miktar <= 0) continue
    if (olcu.endsWith('saniye') && miktar > UST_SANIYE) continue
    out.push({ kaynak, olcu, miktar: Math.round(miktar * 1000) / 1000, model: r.model ? String(r.model).slice(0, 60) : null })
  }
  return out
}

export type SesKullanimSonucu = 'tamam' | 'oturum_yok' | 'hata'

export async function sesKullanimYaz(supabase: SupabaseClient, doktorId: string, oturumId: string, satirlar: SesKullanimSatiri[]): Promise<SesKullanimSonucu> {
  if (!oturumId) return 'oturum_yok'
  try {
    const { data } = await supabase.from('asistan_sessions').select('id').eq('id', oturumId).eq('doctor_id', doktorId).maybeSingle()
    if (!data) return 'oturum_yok'
    if (!satirlar.length) return 'tamam'
    const { error } = await supabase.from('ses_kullanim').insert(satirlar.map((s) => ({
      doctor_id: doktorId, asistan_session_id: oturumId, kaynak: s.kaynak, olcu: s.olcu, miktar: s.miktar, model: s.model ?? null,
    })))
    if (error) console.error('[ses-kullanim] yazılamadı')
    return error ? 'hata' : 'tamam'
  } catch {
    return 'hata'
  }
}
