/**
 * NOTYA-ILETISIM-02 — the one table (096_eposta_baglantisi.sql). Service-role client, so every
 * query is scoped by doctor_id here; the doctor id always comes from the signed-in session or the
 * signed state, never from a request body.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Saglayici } from './ayar'

export const TABLO = 'doktor_eposta_baglantilari'

export type BaglantiDurumu = 'bagli' | 'yenilenmeli'

export type Baglanti = {
  doctor_id: string
  saglayici: Saglayici
  adres: string
  refresh_token_encrypted: string
  durum: BaglantiDurumu
  son_hata: string | null
}

/** Browser-safe view: no credential, not even encrypted. */
export type BaglantiOzeti = { saglayici: Saglayici; adres: string; durum: BaglantiDurumu }

export async function baglantiGetir(sb: SupabaseClient, doktorId: string): Promise<Baglanti | null> {
  const { data, error } = await sb
    .from(TABLO)
    .select('doctor_id, saglayici, adres, refresh_token_encrypted, durum, son_hata')
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (error) throw new Error(`eposta bağlantısı okunamadı: ${error.message}`)
  return (data as Baglanti | null) ?? null
}

export async function baglantiKaydet(
  sb: SupabaseClient,
  b: { doktorId: string; saglayici: Saglayici; adres: string; refreshTokenEncrypted: string }
): Promise<void> {
  const { error } = await sb.from(TABLO).upsert(
    {
      doctor_id: b.doktorId,
      saglayici: b.saglayici,
      adres: b.adres,
      refresh_token_encrypted: b.refreshTokenEncrypted,
      durum: 'bagli',
      son_hata: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'doctor_id' }
  )
  if (error) throw new Error(`eposta bağlantısı kaydedilemedi: ${error.message}`)
}

export async function baglantiGuncelle(
  sb: SupabaseClient,
  doktorId: string,
  g: { durum?: BaglantiDurumu; son_hata?: string | null; refresh_token_encrypted?: string }
): Promise<void> {
  const { error } = await sb.from(TABLO).update({ ...g, updated_at: new Date().toISOString() }).eq('doctor_id', doktorId)
  if (error) throw new Error(`eposta bağlantısı güncellenemedi: ${error.message}`)
}

export async function baglantiSil(sb: SupabaseClient, doktorId: string): Promise<void> {
  const { error } = await sb.from(TABLO).delete().eq('doctor_id', doktorId)
  if (error) throw new Error(`eposta bağlantısı silinemedi: ${error.message}`)
}
