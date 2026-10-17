/**
 * NOTYA-HASTA-ILETISIMI-01 — the doctor's own SMS connection (iletisim_sms_ayarlari, migration 166;
 * NETGSM-01 adds the NetGSM columns, migration 173). Doctor-only to configure (same as
 * Gmail/Outlook/WhatsApp Business connections in Ayarlar); personel can USE the channel to send
 * (see lib/iletisim/toplu/) but does not manage it.
 *
 * Provider choice per doctor = iletisim_sms_ayarlari.saglayici. DEFAULT stays 'android_sms_gateway', and the
 * Android read/write path touches only the columns migration 166 created — so a doctor who never picks
 * NetGSM is unaffected, even while migration 173 is not applied yet.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptPII, decryptPII } from '@/lib/security/encryption'
import type { SmsAyar, SmsSaglayici } from './tipler'
import { gatewayUrlDogrula } from './gatewayUrl'

const NETGSM_KOLONLARI = 'netgsm_kullanici_adi, netgsm_sifre_encrypted, netgsm_baslik'

export function smsSaglayiciAdi(ham: unknown): SmsSaglayici {
  return ham === 'netgsm' ? 'netgsm' : 'android_sms_gateway'
}

async function netgsmSatiri(supabase: SupabaseClient, doktorId: string): Promise<Record<string, any> | null> {
  try {
    const sonuc = await supabase.from('iletisim_sms_ayarlari').select(NETGSM_KOLONLARI).eq('doctor_id', doktorId).maybeSingle()
    return sonuc.data || null
  } catch { return null } // migration 173 not applied yet — fail soft
}

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
  if (!data) return null

  if (smsSaglayiciAdi(data.saglayici) === 'netgsm') {
    const n = await netgsmSatiri(supabase, doktorId)
    if (!n || !n.netgsm_kullanici_adi || !n.netgsm_sifre_encrypted || !n.netgsm_baslik) return null
    let sifre = ''
    try { sifre = decryptPII(n.netgsm_sifre_encrypted) } catch { return null }
    if (!sifre) return null
    return { saglayici: 'netgsm', kullaniciKodu: String(n.netgsm_kullanici_adi), sifre, baslik: String(n.netgsm_baslik), aktif: data.aktif !== false }
  }

  if (!data.taban_url || !data.kullanici_adi || !data.sifre_encrypted) return null
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
  /** Omitted → 'android_sms_gateway' (the default; existing callers are unchanged). */
  saglayici?: SmsSaglayici
  tabanUrl: string
  kullaniciAdi: string
  /** Only sent by the client when the doctor changed it; null/undefined keeps the stored one. */
  sifre?: string | null
  gonderenNumara?: string | null
  aktif: boolean
  /** NetGSM only. */
  netgsmKullaniciKodu?: string
  netgsmSifre?: string | null
  netgsmBaslik?: string
}

export class SmsAyarHatasi extends Error {}

export async function smsAyarKaydet(supabase: SupabaseClient, doktorId: string, girdi: SmsAyarGirdisi): Promise<void> {
  const saglayici = smsSaglayiciAdi(girdi.saglayici)
  const satir: Record<string, unknown> = { doctor_id: doktorId, saglayici, aktif: girdi.aktif, updated_at: new Date().toISOString() }

  if (saglayici === 'netgsm') {
    const kod = String(girdi.netgsmKullaniciKodu || '').trim()
    const baslik = String(girdi.netgsmBaslik || '').trim()
    if (girdi.aktif) {
      if (!kod) throw new SmsAyarHatasi('NetGSM kullanıcı kodu zorunludur.')
      if (!baslik) throw new SmsAyarHatasi('Mesaj başlığı (gönderici adı) zorunludur.')
      if (!girdi.netgsmSifre) {
        const n = await netgsmSatiri(supabase, doktorId)
        if (!n?.netgsm_sifre_encrypted) throw new SmsAyarHatasi('NetGSM şifresi zorunludur.')
      }
    }
    if (/[\u0000-\u001f\u007f]/.test(kod + baslik) || baslik.length > 40 || kod.length > 80) throw new SmsAyarHatasi('Kullanıcı kodu veya başlık geçersiz karakter içeriyor ya da çok uzun.')
    satir.netgsm_kullanici_adi = kod || null
    satir.netgsm_baslik = baslik || null
    if (girdi.netgsmSifre) satir.netgsm_sifre_encrypted = encryptPII(girdi.netgsmSifre)
  } else {
    let tabanUrl = String(girdi.tabanUrl || '').trim()
    const kullaniciAdi = String(girdi.kullaniciAdi || '').trim()
    if (girdi.aktif) {
      const url = gatewayUrlDogrula(tabanUrl)
      if (!url.ok) throw new SmsAyarHatasi(url.hata)
      tabanUrl = url.url // canonical form (no trailing slash)
      if (!kullaniciAdi) throw new SmsAyarHatasi('Kullanıcı adı zorunludur.')
    }
    satir.taban_url = tabanUrl || null
    satir.kullanici_adi = kullaniciAdi || null
    satir.gonderen_numara = girdi.gonderenNumara || null
    if (girdi.sifre) satir.sifre_encrypted = encryptPII(girdi.sifre)
  }
  const { error } = await supabase.from('iletisim_sms_ayarlari').upsert(satir, { onConflict: 'doctor_id' })
  if (error) throw new SmsAyarHatasi('SMS ayarları kaydedilemedi.')
}

export type SmsAyarGoruntusu = {
  saglayici: SmsSaglayici
  tabanUrl: string
  kullaniciAdi: string
  gonderenNumara: string | null
  aktif: boolean
  sifreVar: boolean
  netgsm: { kullaniciKodu: string; baslik: string; sifreVar: boolean }
}

/** Ayarlar screen: never return a password (or any secret) — only whether one is stored. */
export async function smsAyarGoruntu(supabase: SupabaseClient, doktorId: string): Promise<SmsAyarGoruntusu | null> {
  let data: Record<string, any> | null = null
  try {
    const sonuc = await supabase
      .from('iletisim_sms_ayarlari')
      .select('saglayici, taban_url, kullanici_adi, gonderen_numara, aktif, sifre_encrypted')
      .eq('doctor_id', doktorId)
      .maybeSingle()
    data = sonuc.data
  } catch { data = null }
  if (!data) return null
  const saglayici = smsSaglayiciAdi(data.saglayici)
  const n = await netgsmSatiri(supabase, doktorId) // fail-soft: null while migration 173 is not applied
  return {
    saglayici,
    tabanUrl: data.taban_url || '',
    kullaniciAdi: data.kullanici_adi || '',
    gonderenNumara: data.gonderen_numara ?? null,
    aktif: !!data.aktif,
    sifreVar: !!data.sifre_encrypted,
    netgsm: { kullaniciKodu: n?.netgsm_kullanici_adi || '', baslik: n?.netgsm_baslik || '', sifreVar: !!n?.netgsm_sifre_encrypted },
  }
}
