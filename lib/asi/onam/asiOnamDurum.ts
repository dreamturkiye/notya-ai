/**
 * NOTYA-ASI-ONAM-02 (2026-11-01) — what a vaccine-consent record MEANS, in one place.
 *
 * Why this file exists: the Sağlık Bakanlığı "Bilgilendirilmiş Rızanın Elektronik Ortamda Alınması
 * Hakkında Yönetmelik" (Resmî Gazete 27.10.2026, sayı 33413) says an informed consent taken
 * electronically counts only when it goes through e-Nabız or the health facility's own SBYS-linked
 * channel, after identity verification and with an SMS OTP sent to a verified mobile number
 * (Madde 6, 7, 8/7-8); for a minor the same applies to the legal representative (Madde 11/2), and if
 * the representative cannot be verified electronically, consent cannot be taken electronically
 * (Madde 11/3). Notya's remote Sağlığım / e-posta / WhatsApp flow has none of that: the parent types
 * a name, relationship and phone. So a remote submission is a PRE-VISIT INFORMATION
 * ACKNOWLEDGEMENT, never a consent. Consent is "Onaylandı" only when it is taken in the clinic,
 * by the doctor, with the representative present and identified (yöntem 'klinik' or the signed
 * paper form 'kagit').
 *
 * Records are immutable (migration 161 trigger). Rows written before this change with a remote
 * yöntem and durum 'alindi' are NOT rewritten — they are DISPLAYED through this mapping as an
 * acknowledgement. Every screen, message and gate reads the meaning from here, never from the raw
 * `durum` column.
 *
 * Pediatri-only feature (asiOnamBransKapisi.ts) — this file has no branş logic of its own.
 * Turkey-only regulatory mechanic: not propagated to the country builds.
 */
import type { AsiOnamDurumu, AsiOnamYontemi } from './asiOnamMotoru'

export type AsiOnamGorunenDurum = 'onaylandi' | 'reddedildi' | 'bilgilendirme-okundu' | 'bilgilendirme-cekince'

export const ASI_ONAM_GORUNEN_ETIKET: Record<AsiOnamGorunenDurum, string> = {
  onaylandi: 'Onaylandı (muayenede)',
  reddedildi: 'Kabul edilmedi (muayenede)',
  'bilgilendirme-okundu': 'Bilgilendirme okundu — onam muayenede alınacak',
  'bilgilendirme-cekince': 'Bilgilendirmede çekince bildirildi — onam muayenede görüşülecek',
}

/** Remote yöntem = anything the parent did outside the clinic, without verified identity / OTP. */
export function asiOnamUzaktanMi(yontem: string | null | undefined): boolean {
  return typeof yontem === 'string' && yontem.startsWith('uzaktan-')
}

/** The durum a NEW remote submission is stored with. Never 'alindi'. */
export function uzaktanBilgilendirmeDurumu(kabul: boolean): AsiOnamDurumu {
  return kabul ? 'bilgilendirme-okundu' : 'bilgilendirme-cekince'
}

/**
 * Raw row → what the screen may claim. A remote row is never 'onaylandi', whatever its stored
 * durum says (covers the legacy 'alindi' rows). An in-clinic/paper row carrying a bilgilendirme
 * durum (the DB forbids it for new rows) is shown as the acknowledgement, not upgraded.
 */
export function asiOnamGorunenDurumu(k: { yontem: string; durum: string }): AsiOnamGorunenDurum {
  const olumlu = k.durum === 'alindi' || k.durum === 'bilgilendirme-okundu'
  if (asiOnamUzaktanMi(k.yontem) || k.durum === 'bilgilendirme-okundu' || k.durum === 'bilgilendirme-cekince') {
    return olumlu ? 'bilgilendirme-okundu' : 'bilgilendirme-cekince'
  }
  return k.durum === 'alindi' ? 'onaylandi' : 'reddedildi'
}

export function asiOnamGorunenEtiket(k: { yontem: string; durum: string }): string {
  return ASI_ONAM_GORUNEN_ETIKET[asiOnamGorunenDurumu(k)]
}

/** True only for a consent taken in the clinic (doctor-recorded, or signed paper uploaded by the doctor). */
export function asiOnamMuayenedeAlindiMi(k: { yontem: string; durum: string }): boolean {
  return asiOnamGorunenDurumu(k) === 'onaylandi'
}

/**
 * The gate every "consent is on file" decision must use: the in-clinic consent of THIS muayene,
 * or null. A remote acknowledgement alone never passes.
 */
export function asiOnamMuayeneOnami<T extends { yontem: string; durum: string; session_id: string | null }>(kayitlar: readonly T[], sessionId: string | null): T | null {
  if (!sessionId) return null
  return kayitlar.find((k) => k.session_id === sessionId && asiOnamMuayenedeAlindiMi(k)) || null
}

/**
 * Latest remote acknowledgement that has not been followed by an in-clinic record — what the
 * doctor's screen surfaces as "veli okudu, onamı şimdi alın". Rows are expected newest first.
 */
export function bekleyenUzaktanBilgilendirme<T extends { yontem: string; durum: string; created_at: string }>(kayitlar: readonly T[]): T | null {
  for (const k of kayitlar) {
    if (!asiOnamUzaktanMi(k.yontem)) return null // a newer in-clinic/paper record closes it
    return k
  }
  return null
}

/**
 * In-clinic / paper records whose durum needs the doctor's identity tick ("veli muayenede hazır,
 * kimliği doğrulandı"). A REFUSAL is a decision of the veli / yasal temsilci just like an acceptance,
 * so it is recorded only for a person who is present and identified (RG 27.10.2026/33413 Madde 6,
 * 11/2) — otherwise anyone could record "Kabul etmedi" for a child. Mirrors migration 185's check.
 */
export const ASI_ONAM_KIMLIK_GEREKEN_DURUMLAR: readonly AsiOnamDurumu[] = ['alindi', 'reddedildi']

/** True when this in-clinic/paper record may not be written: its durum needs the tick and it is missing. */
export function asiOnamKimlikEksikMi(durum: string, kimlikDogrulandi: unknown): boolean {
  return (ASI_ONAM_KIMLIK_GEREKEN_DURUMLAR as readonly string[]).includes(durum) && kimlikDogrulandi !== true
}

export const ASI_ONAM_YONTEM_KISA: Record<AsiOnamYontemi, string> = {
  klinik: 'Klinikte',
  'uzaktan-eposta': 'Uzaktan ön bilgilendirme (e-posta)',
  'uzaktan-whatsapp': 'Uzaktan ön bilgilendirme (WhatsApp)',
  'uzaktan-portal': 'Uzaktan ön bilgilendirme (Sağlığım)',
  kagit: 'Kağıt form (imzalı)',
}
