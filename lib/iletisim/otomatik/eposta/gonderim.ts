/**
 * NOTYA-ILETISIM-02 — send one message from the doctor's own connected mailbox.
 *
 * KVKK: callers pass appointment info and a Sağlığım link only, never clinical details. This layer
 * does not look inside the text; it only refuses to be used as a header-injection or open relay
 * (one valid recipient, single-line subject).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPII, encryptPII } from '@/lib/security/encryption'
import { saglayiciHazirMi } from './ayar'
import { baglantiGetir, baglantiGuncelle } from './depo'
import { epostaGecerliMi } from './mime'
import { erisimAl, gonder as saglayiciyaGonder } from './saglayicilar'

export type GonderGirdisi = {
  doktorId: string
  alici: string
  konu?: string
  metin: string
  sablonKodu?: string
  degiskenler?: string[]
}

export type GonderSonucu = { ok: true; disId?: string } | { ok: false; hata: string }

export const VARSAYILAN_KONU = 'Randevunuz hakkında'
const METIN_SINIRI = 20_000

export const HATA = {
  bagliDegil: 'E-posta hesabı bağlı değil.',
  yenilenmeli: 'E-posta bağlantısının yenilenmesi gerekiyor.',
  kapali: 'E-posta gönderimi henüz açık değil.',
  alici: 'Alıcı e-posta adresi geçersiz.',
  metin: 'Gönderilecek metin boş ya da çok uzun.',
  gecici: 'E-posta şu an gönderilemedi, birazdan yeniden denenebilir.',
} as const

export async function hazirMi(sb: SupabaseClient, doktorId: string): Promise<boolean> {
  try {
    const b = await baglantiGetir(sb, doktorId)
    return !!b && b.durum === 'bagli' && saglayiciHazirMi(b.saglayici)
  } catch {
    return false
  }
}

async function yenilenmeliIsaretle(sb: SupabaseClient, doktorId: string, sonHata: string) {
  await baglantiGuncelle(sb, doktorId, { durum: 'yenilenmeli', son_hata: sonHata }).catch(() => {})
}

export async function epostaGonder(sb: SupabaseClient, g: GonderGirdisi): Promise<GonderSonucu> {
  const alici = (g.alici ?? '').trim()
  if (!epostaGecerliMi(alici)) return { ok: false, hata: HATA.alici }
  const metin = g.metin ?? ''
  if (!metin.trim() || metin.length > METIN_SINIRI) return { ok: false, hata: HATA.metin }
  const konu = (g.konu ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 200) || VARSAYILAN_KONU

  let b
  try {
    b = await baglantiGetir(sb, g.doktorId)
  } catch {
    return { ok: false, hata: HATA.gecici }
  }
  if (!b) return { ok: false, hata: HATA.bagliDegil }
  if (b.durum !== 'bagli') return { ok: false, hata: HATA.yenilenmeli }
  if (!saglayiciHazirMi(b.saglayici)) return { ok: false, hata: HATA.kapali }

  let yenileme: string
  try {
    yenileme = decryptPII(b.refresh_token_encrypted)
  } catch {
    await yenilenmeliIsaretle(sb, g.doktorId, 'decrypt_failed')
    return { ok: false, hata: HATA.yenilenmeli }
  }

  const erisim = await erisimAl(b.saglayici, yenileme)
  if (!erisim.ok) {
    if (erisim.iptal) {
      await yenilenmeliIsaretle(sb, g.doktorId, erisim.hata)
      return { ok: false, hata: HATA.yenilenmeli }
    }
    await baglantiGuncelle(sb, g.doktorId, { son_hata: erisim.hata }).catch(() => {})
    return { ok: false, hata: HATA.gecici }
  }
  if (erisim.yeniYenilemeJetonu) {
    await baglantiGuncelle(sb, g.doktorId, { refresh_token_encrypted: encryptPII(erisim.yeniYenilemeJetonu) }).catch(() => {})
  }

  const sonuc = await saglayiciyaGonder(b.saglayici, erisim.erisimJetonu, { alici, konu, metin })
  if (!sonuc.ok) {
    if (sonuc.yetkisiz) {
      await yenilenmeliIsaretle(sb, g.doktorId, sonuc.hata)
      return { ok: false, hata: HATA.yenilenmeli }
    }
    await baglantiGuncelle(sb, g.doktorId, { son_hata: sonuc.hata }).catch(() => {})
    return { ok: false, hata: HATA.gecici }
  }
  if (b.son_hata) await baglantiGuncelle(sb, g.doktorId, { son_hata: null }).catch(() => {})
  return { ok: true, ...(sonuc.disId ? { disId: sonuc.disId } : {}) }
}
