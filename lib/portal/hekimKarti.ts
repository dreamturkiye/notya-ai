/**
 * PORTAL-HEKIM-01 — Sağlığım Özet'te hekim kimliği (ad, foto, adres, muayenehane telefonu).
 *
 * Kaynaklar (token'ın doktoru):
 *  - users.full_name / specialty / clinic_name / recete_baslik.satirlar
 *  - users.iletisim_whatsapp_muayenehane (muayenehane hattı)
 *  - doctor_avatars (şifreli profil fotoğrafı → data URL)
 *
 * recete_baslik.satirlar örneği (mig 017): branş, adres, telefon.
 * Saf ayrıştırıcılar istemci-güvenli; sunucu yükleyici vault decrypt kullanır.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptBytes } from '@/lib/vault/crypto'
import { avatarDataUrl } from '@/lib/doktor/avatar'
import { hekimUnvanli } from '@/lib/doktor/hekimAdi'
import { bransEtiketi } from '@/lib/doktor/bransAdlari'
import { normalizeTrPhoneE164 } from '@/lib/doktor/twilioNotify'
import { whatsappNumarasi } from '@/lib/iletisim/baglantilar'
import type { PortalHekim } from './types'

/** Satır telefon gibi görünüyor mu (0216…, 0532…, +90…). */
export function satirTelefonMu(s: string): boolean {
  const t = String(s || '').trim()
  if (!t) return false
  const rakam = t.replace(/\D/g, '')
  if (rakam.length < 7 || rakam.length > 15) return false
  // Adres satırındaki kapı no / posta kodu yanlış pozitif olmasın: satırda rakam oranı yüksek olmalı.
  const harf = t.replace(/[\d\s+()\-./]/g, '')
  if (harf.length > Math.max(4, Math.floor(t.length * 0.35))) return false
  return /(?:\+?\d[\d\s()\-]{6,}\d)/.test(t)
}

/** Görünen TR telefon: 0532 123 45 67 veya 0216 000 00 00. */
export function telefonGorunum(ham: string | null | undefined): string | null {
  const t = String(ham || '').trim()
  if (!t) return null
  const e164 = normalizeTrPhoneE164(t)
  if (e164 && e164.startsWith('+90') && e164.length === 13) {
    const d = e164.slice(3) // 10 hane
    if (d.startsWith('5')) return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
    return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
  }
  const wa = whatsappNumarasi(t)
  if (wa && wa.startsWith('90') && wa.length === 12) {
    const d = wa.slice(2)
    return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
  }
  return t
}

/** tel: href — E.164 tercih; yoksa ham rakamlar. */
export function telefonHref(ham: string | null | undefined): string | null {
  const t = String(ham || '').trim()
  if (!t) return null
  const e164 = normalizeTrPhoneE164(t)
  if (e164) return `tel:${e164}`
  const wa = whatsappNumarasi(t)
  if (wa) return `tel:+${wa}`
  const rakam = t.replace(/\D/g, '')
  return rakam.length >= 7 ? `tel:${rakam}` : null
}

export function hekimKartindanSatirlar(girdi: {
  fullName?: string | null
  specialty?: string | null
  clinicName?: string | null
  satirlar?: string[] | null
  muayenehaneTelefon?: string | null
  avatarDataUrl?: string | null
}): PortalHekim {
  const adHam = String(girdi.fullName || '').trim()
  const ad = adHam ? hekimUnvanli(adHam) : 'Doktorunuz'
  const satirlar = (girdi.satirlar || []).map((s) => String(s || '').trim()).filter(Boolean)

  let telefonHam = String(girdi.muayenehaneTelefon || '').trim()
  if (!telefonHam) {
    const telSatir = satirlar.find(satirTelefonMu)
    if (telSatir) telefonHam = telSatir
  }

  const bransEtiket = girdi.specialty ? bransEtiketi(girdi.specialty) : ''
  const adresAdaylari = satirlar.filter((s) => {
    if (satirTelefonMu(s)) return false
    // Branş satırı adres değil
    if (bransEtiket && s.toLocaleLowerCase('tr-TR') === bransEtiket.toLocaleLowerCase('tr-TR')) return false
    if (/uzmanı|uzmani|hekimliği|hekimligi|hastalıkları|hastaliklari/i.test(s) && s.length < 80 && !/\d/.test(s)) return false
    return true
  })
  const adres = adresAdaylari[0] || null
  const klinik = String(girdi.clinicName || '').trim() || null
  const brans = bransEtiket || (satirlar.find((s) => !satirTelefonMu(s) && s !== adres) || null)

  return {
    ad,
    brans,
    klinik,
    adres,
    telefon: telefonGorunum(telefonHam),
    telefonHref: telefonHref(telefonHam),
    avatarUrl: girdi.avatarDataUrl || null,
  }
}

/** Token doktorunun portal kartı — yabancı hekim satırı okunmaz (doctor_id = token). */
export async function portalHekimKarti(sb: SupabaseClient, doctorId: string): Promise<PortalHekim> {
  const [userQ, avQ] = await Promise.all([
    sb.from('users')
      .select('full_name, specialty, clinic_name, recete_baslik, iletisim_whatsapp_muayenehane')
      .eq('id', doctorId)
      .maybeSingle(),
    sb.from('doctor_avatars')
      .select('mime_type, image_encrypted')
      .eq('doctor_id', doctorId)
      .maybeSingle(),
  ])

  const rb = (userQ.data?.recete_baslik && typeof userQ.data.recete_baslik === 'object'
    ? userQ.data.recete_baslik
    : {}) as { satirlar?: unknown }
  const satirlar = Array.isArray(rb.satirlar)
    ? rb.satirlar.map((x) => String(x ?? '').trim()).filter(Boolean)
    : []

  let avatar: string | null = null
  if (avQ.data?.image_encrypted && avQ.data?.mime_type) {
    try {
      const bytes = decryptBytes(Buffer.from(String(avQ.data.image_encrypted), 'base64'))
      // Bundle şişmesin: ~350 KB üzeri data URL taşıma (karşılama için yeterli küçültme yoksa atla).
      if (bytes.length <= 350_000) {
        avatar = avatarDataUrl(String(avQ.data.mime_type), bytes.toString('base64'))
      }
    } catch {
      avatar = null
    }
  }

  return hekimKartindanSatirlar({
    fullName: userQ.data?.full_name ? String(userQ.data.full_name) : null,
    specialty: userQ.data?.specialty ? String(userQ.data.specialty) : null,
    clinicName: userQ.data?.clinic_name ? String(userQ.data.clinic_name) : null,
    satirlar,
    muayenehaneTelefon: userQ.data?.iletisim_whatsapp_muayenehane
      ? String(userQ.data.iletisim_whatsapp_muayenehane)
      : null,
    avatarDataUrl: avatar,
  })
}
