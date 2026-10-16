/** NOTYA-HASTA-ILETISIMI-01 — shared types for the SMS channel. Pure, client-safe. */

export type SmsGonderimIstegi = {
  doktorId: string
  patientId: string
  /** E.164 with "+" (lib/iletisim/baglantilar.ts smsNumarasi). Already consent-checked by the caller. */
  alici: string
  metin: string
}

export type SmsGonderimSonucu =
  | { ok: true; saglayiciMesajId?: string }
  | { ok: false; hata: string }

/** Doctor's own gateway connection (iletisim_sms_ayarlari), password already decrypted for use. */
export type SmsAyar = {
  saglayici: 'android_sms_gateway'
  tabanUrl: string
  kullaniciAdi: string
  sifre: string
  gonderenNumara: string | null
  aktif: boolean
}
