/** NOTYA-HASTA-ILETISIMI-01 — shared types for the SMS channel. Pure, client-safe. */

export type SmsGonderimIstegi = {
  doktorId: string
  patientId: string
  /** E.164 with "+" (lib/iletisim/baglantilar.ts smsNumarasi). Already consent-checked by the caller. */
  alici: string
  metin: string
  /**
   * NETGSM-01: the provider the caller composed the message for (its opt-out footer is provider-specific).
   * If the doctor's connection changed in the meantime, smsGonder refuses instead of sending a footer that
   * would promise something the new provider does not do.
   */
  beklenenSaglayici?: SmsSaglayici
}

export type SmsGonderimSonucu =
  | { ok: true; saglayiciMesajId?: string }
  | { ok: false; hata: string }

export type SmsSaglayici = 'android_sms_gateway' | 'netgsm'

/** Doctor's own Android gateway connection (iletisim_sms_ayarlari), password already decrypted for use. */
export type AndroidSmsAyar = {
  saglayici: 'android_sms_gateway'
  tabanUrl: string
  kullaniciAdi: string
  sifre: string
  gonderenNumara: string | null
  aktif: boolean
}

/** NETGSM-01: the doctor's OWN NetGSM account (usercode + API password + approved sender name "başlık"). */
export type NetgsmSmsAyar = {
  saglayici: 'netgsm'
  kullaniciKodu: string
  sifre: string
  baslik: string
  aktif: boolean
}

export type SmsAyar = AndroidSmsAyar | NetgsmSmsAyar
