/**
 * NOTYA-ILETISIM-01 — patient contact consent (KVKK açık rıza) gating. Pure, client-safe.
 *
 * Consent is per channel and covers randevu + bilgilendirme messages only — which is all Notya
 * ever prepares (lib/iletisim/sablonlar.ts carries no clinical information).
 *
 *   true  → the patient agreed (intake checkbox, hasta profili, or "İzin alındı olarak işaretle")
 *   false → the patient said no
 *   null  → unknown: every patient registered before NOTYA-ILETISIM-01, until someone marks it
 *
 * Only `true` opens a channel. Unknown is treated like "no" — the send button explains it in plain
 * words and offers the one-tap mark, which records who marked it and when.
 */
import { whatsappNumarasi, epostaAdresi } from './baglantilar'
import type { IletisimKanali } from './tipler'

export type IzinDegeri = boolean | null

export type KanalDurumu =
  /** ready: consent + a usable address */
  | 'hazir'
  /** no usable phone / email on file */
  | 'adres_yok'
  /** address on file, but the patient did not consent (or it is unknown) */
  | 'izin_yok'

export type HastaIletisimBilgisi = {
  telefon?: string | null
  eposta?: string | null
  izinWhatsapp?: IzinDegeri
  izinEposta?: IzinDegeri
}

export function kanalDurumu(h: HastaIletisimBilgisi, kanal: IletisimKanali): KanalDurumu {
  const adres = kanal === 'whatsapp' ? whatsappNumarasi(h.telefon) : epostaAdresi(h.eposta)
  if (!adres) return 'adres_yok'
  const izin = kanal === 'whatsapp' ? h.izinWhatsapp : h.izinEposta
  return izin === true ? 'hazir' : 'izin_yok'
}

export function gonderilebilirMi(h: HastaIletisimBilgisi, kanal: IletisimKanali): boolean {
  return kanalDurumu(h, kanal) === 'hazir'
}

/**
 * Which channel the send button opens first: the one used last for this patient if it is still
 * ready, else WhatsApp, else e-posta. null when neither is ready.
 */
export function onerilenKanal(h: HastaIletisimBilgisi, sonKanal?: IletisimKanali | null): IletisimKanali | null {
  if (sonKanal && gonderilebilirMi(h, sonKanal)) return sonKanal
  if (gonderilebilirMi(h, 'whatsapp')) return 'whatsapp'
  if (gonderilebilirMi(h, 'eposta')) return 'eposta'
  return null
}

/** Plain-Turkish line under a channel that cannot be used yet. */
export function kanalAciklamasi(d: KanalDurumu, kanal: IletisimKanali): string {
  if (d === 'hazir') return ''
  if (d === 'adres_yok') return kanal === 'whatsapp' ? 'Hastanın kayıtlı telefonu yok.' : 'Hastanın kayıtlı e-posta adresi yok.'
  return 'Hasta iletişim izni vermedi.'
}

export { IZIN_METNI, IZIN_ACIKLAMASI } from './izinMetni'
