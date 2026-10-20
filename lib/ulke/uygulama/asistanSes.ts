/**
 * The sentence the assistant speaks for the signed-in account's role.
 *
 * The caller does not choose the words. The sentence is the voice's name, the pack's colleague line, and the
 * role's own name. A role with no assistant, and a pack that does not name two voices, speaks nothing.
 * No patient text is read or accepted.
 */
import { asistanKimligi, asistanSesAdlari, rolAdi, uygulamaMetni } from '@/lib/ulke/arayuz'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { cevap, KOD } from './cevap'
import { sesSentezle, type SesBaglanti, type SesCinsiyeti } from './sesSentez'

const CINSIYETLER = ['erkek', 'kadin'] as const

export function asistanCinsiyetiMi(ham: unknown): ham is SesCinsiyeti {
  return ham === 'erkek' || ham === 'kadin'
}

/** The fixed sentence for this role and voice, or null when this pack has nothing to say. */
export function asistanKonusmaMetni(rol: string | null, cinsiyet: SesCinsiyeti): string | null {
  const dil = ulkePaketi().varsayilanDil
  const ses = asistanSesAdlari()
  const ad = ses?.[cinsiyet]?.trim() ?? ''
  const kim = rol ? asistanKimligi(rol, dil) : null
  const rolunAdi = rolAdi(rol, dil)?.trim() ?? ''
  const satir = uygulamaMetni(dil).asistan.satir.trim()
  if (!kim || !ad || !rolunAdi || !satir) return null
  const metin = `${ad}. ${satir}. ${rolunAdi}.`
  if (metin.length > 240) return null
  return metin
}

/** Speak that sentence. Machine codes only. The audio, when there is some, is base64 mpeg. */
export async function asistanSesCevabi(rol: string | null, cinsiyet: unknown, baglanti: SesBaglanti = {}): Promise<Response> {
  if (!asistanCinsiyetiMi(cinsiyet)) return KOD.gecersiz('cinsiyet')
  const metin = asistanKonusmaMetni(rol, cinsiyet)
  if (!metin) return KOD.yok()
  const sonuc = await sesSentezle(metin, cinsiyet, baglanti)
  if (sonuc.durum === 'hazir-degil') return cevap({ code: 'HAZIR_DEGIL' }, 503)
  if (sonuc.durum === 'yok' || sonuc.durum === 'red') return KOD.yok()
  if (sonuc.durum !== 'tamam' || sonuc.ses.byteLength === 0 || sonuc.ses.byteLength > 400_000) return KOD.basarisiz()
  return cevap({ ok: true, mime: 'audio/mpeg', ses: Buffer.from(sonuc.ses).toString('base64'), cinsiyet })
}

export const ASISTAN_SES_CINSIYETLERI = CINSIYETLER
