/**
 * NOTYA-ILETISIM-01 — patient-facing consent wording and the intake field ids. Dependency-free on
 * purpose: the intake form schema (lib/intake/coreAlanlar.ts) imports it on the public form.
 */
import type { IletisimKanali } from './tipler'

/** The sentence the intake form and the hasta profili show next to each checkbox. */
export const IZIN_METNI: Record<IletisimKanali, string> = {
  whatsapp: 'Randevu ve bilgilendirme mesajlarının WhatsApp ile gönderilmesine izin veriyorum.',
  eposta: 'Randevu ve bilgilendirme mesajlarının e-posta ile gönderilmesine izin veriyorum.',
}

/** Small print under the checkboxes (KVKK açık rıza scope). */
export const IZIN_ACIKLAMASI =
  'Bu mesajlar yalnızca randevu ve bilgilendirme içindir; tanı, tahlil sonucu veya ilaç bilgisi içermez. İzninizi dilediğiniz zaman geri alabilirsiniz.'

/** Intake field ids (hasta bilgi formu › Onay). */
export const IZIN_ALANI: Record<IletisimKanali, string> = {
  whatsapp: 'iletisimIzniWhatsapp',
  eposta: 'iletisimIzniEposta',
}

/** The one option of each consent line — ticked = consent. */
export const IZIN_EVET = 'İzin veriyorum'

/** Intake answers → consent per channel (unticked = no consent). */
export function intakeIzinleri(yanitlar: Record<string, unknown>): Record<IletisimKanali, boolean> {
  return {
    whatsapp: yanitlar[IZIN_ALANI.whatsapp] === IZIN_EVET,
    eposta: yanitlar[IZIN_ALANI.eposta] === IZIN_EVET,
  }
}

/**
 * NOTYA-GELEN-BELGELER — the patient's consent that what they send (documents, photos, voice messages) may be filed.
 * Intake form (patient's voice) and the hasta profili box (doctor's view) say the same thing.
 */
export const GELEN_BELGE_IZIN_METNI = 'Gönderdiğiniz belgeler, fotoğraflar ve sesli mesajlar dosyanıza eklenebilir.'
export const GELEN_BELGE_IZIN_PROFIL = 'Gönderdiği belgeler, fotoğraflar ve sesli mesajlar dosyasına eklenebilir'
export const GELEN_BELGE_IZIN_ALANI = 'gelenBelgeIzni'

/** Intake answers → gelen belge consent (unticked = no consent). */
export function intakeGelenBelgeIzni(yanitlar: Record<string, unknown>): boolean {
  return yanitlar[GELEN_BELGE_IZIN_ALANI] === IZIN_EVET
}
