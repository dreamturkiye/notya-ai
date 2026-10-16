/**
 * NOTYA-HASTA-ILETISIMI-01 — the doctor's own SMS-gateway connection (iletisim_sms_ayarlari,
 * migration 166). Doctor-only to configure (same as Gmail/Outlook/WhatsApp Business connections in
 * Ayarlar); personel can USE the channel to send (see lib/iletisim/toplu/) but does not manage it.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptPII, decryptPII } from '@/lib/security/encryption'
import type { SmsAyar } from './tipler'
import { gatewayUrlDogrula } from './gatewayUrl'

export async function smsAyarGetir(supabase: SupabaseClient, doktorId: string): Promise<SmsAyar | null> {
  let data: Record<string, any> | null = null
  try {
    const sonuc = await supabase
      .from('iletisim_sms_ayarlari')
      .select('saglayici, taban_url, kullanici_adi, sifre_encrypted, gonderen_numara, aktif')
      .eq('doctor_id', doktorId)
      .maybeSingle()
    data = sonuc.data
  } catch { data = null } // migration 166 not applied yet — fail soft, same as lib/iletisim/README.md rule 5.
  if (!data || !data.taban_url || !data.kullanici_adi || !data.sifre_encrypted) return null
  let sifre = ''
  try { sifre = decryptPII(data.sifre_encrypted) } catch { return null }
  if (!sifre) return null
  return {
    saglayici: 'android_sms_gateway',
    tabanUrl: String(data.taban_url).replace(/\/+$/, ''),
    kullaniciAdi: data.kullanici_adi,
    sifre,
    gonderenNumara: data.gonderen_numara ?? null,
    aktif: data.aktif !== false,
  }
}

export type SmsAyarGirdisi = {
  tabanUrl: string
  kullaniciAdi: string
  /** Only sent by the client when the doctor changed it; null/undefined keeps the stored one. */
  sifre?: string | null
  gonderenNumara?: string | null
  aktif: boolean
}

export class SmsAyarHatasi extends Error {}

export async function smsAyarKaydet(supabase: SupabaseClient, doktorId: string, girdi: SmsAyarGirdisi): Promise<void> {
  let tabanUrl = String(girdi.tabanUrl || '').trim()
  const kullaniciAdi = String(girdi.kullaniciAdi || '').trim()
  if (girdi.aktif) {
    const url = gatewayUrlDogrula(tabanUrl)
    if (!url.ok) throw new SmsAyarHatasi(url.hata)
    tabanUrl = url.url // canonical form (no trailing slash)
    if (!kullaniciAdi) throw new SmsAyarHatasi('Kullanıcı adı zorunludur.')
  }
  const satir: Record<string, unknown> = {
    doctor_id: doktorId,
    taban_url: tabanUrl || null,
    kullanici_adi: kullaniciAdi || null,
    gonderen_numara: girdi.gonderenNumara || null,
    aktif: girdi.aktif,
    updated_at: new Date().toISOString(),
  }
  if (girdi.sifre) satir.sifre_encrypted = encryptPII(girdi.sifre)
  const { error } = await supabase.from('iletisim_sms_ayarlari').upsert(satir, { onConflict: 'doctor_id' })
  if (error) throw new SmsAyarHatasi('SMS ayarları kaydedilemedi.')
}

/** Ayarlar screen: never return the password. */
export async function smsAyarGoruntu(supabase: SupabaseClient, doktorId: string): Promise<{ tabanUrl: string; kullaniciAdi: string; gonderenNumara: string | null; aktif: boolean; sifreVar: boolean } | null> {
  let data: Record<string, any> | null = null
  try {
    const sonuc = await supabase
      .from('iletisim_sms_ayarlari')
      .select('taban_url, kullanici_adi, gonderen_numara, aktif, sifre_encrypted')
      .eq('doctor_id', doktorId)
      .maybeSingle()
    data = sonuc.data
  } catch { data = null }
  if (!data) return null
  return {
    tabanUrl: data.taban_url || '',
    kullaniciAdi: data.kullanici_adi || '',
    gonderenNumara: data.gonderen_numara ?? null,
    aktif: !!data.aktif,
    sifreVar: !!data.sifre_encrypted,
  }
}
