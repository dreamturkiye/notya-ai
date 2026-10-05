/**
 * KONSULTASYONLAR — konsültana portal linki e-postası.
 * Gönderim hekimin bağlı Gmail/Outlook kutusundan (lib/iletisim/otomatik/eposta).
 * Klinik dilim linktedir; şifre/hesap yok.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { epostaGecerliMi } from '@/lib/iletisim/otomatik/eposta/mime'
import { KONSULTASYON_KOLONLARI, hedefEtiketi, type KonsultasyonSatiri } from '@/lib/doktor/konsultasyon'

export type EpostaDurum = 'gonderildi' | 'bagli_degil' | 'yok' | 'hata'

export const ILETISIM_EPOSTA_AYAR_YOLU = '/dashboard/doktor/ayarlar/iletisim'

/** Tek satır alıcı; boş → null; geçersiz → hata. */
export function konsultanAliciDogrula(ham: unknown): { ok: true; alici: string | null } | { ok: false; hata: string } {
  const a = String(ham ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
  if (!a) return { ok: true, alici: null }
  if (!epostaGecerliMi(a)) return { ok: false, hata: 'Konsültan e-posta adresi geçersiz — ör. ad@ornek.com.' }
  return { ok: true, alici: a }
}

export function epostaDurumMetni(d: EpostaDurum | string | null | undefined, alici?: string | null): string {
  const a = alici ? ` (${alici})` : ''
  switch (d) {
    case 'gonderildi':
      return `Konsültana e-posta gönderildi${a}.`
    case 'bagli_degil':
      return `E-posta kutunuz bağlı değil — Ayarlar › İletişim’den Gmail/Outlook bağlayın, sonra «E-posta gönder»e basın.`
    case 'yok':
      return 'Konsültan e-postası yok — Defterden seçin veya e-posta yazın; ardından «E-posta gönder».'
    case 'hata':
      return 'E-posta gönderilemedi — bağlantıyı kontrol edip yeniden deneyin.'
    default:
      return ''
  }
}

/** Portal jetonunu (yeniden) üretir; link döner. HMAC varsa tercih edilir. */
export async function portalLinkHazirla(
  sb: SupabaseClient,
  doktorId: string,
  s: KonsultasyonSatiri,
): Promise<{ satir: KonsultasyonSatiri; portalLink: string | null }> {
  try {
    const {
      konsultanJetonu, portalJetonHam, portalJetonHash, portalJetonSonu, konsultanPortalYolu,
    } = await import('@/lib/doktor/konsultanJeton')
    const sonMs = portalJetonSonu(s.istem_tarihi)
    const hmac = konsultanJetonu(String(s.id), sonMs)
    const ham = portalJetonHam()
    const hash = portalJetonHash(ham)
    const { data: jetonlu } = await sb.from('sevkler').update({
      portal_jeton_hash: hash,
      portal_jeton_son: new Date(sonMs).toISOString(),
    }).eq('id', s.id).eq('doctor_id', doktorId).select(KONSULTASYON_KOLONLARI).maybeSingle()
    const satir = (jetonlu as unknown as KonsultasyonSatiri) || s
    return { satir, portalLink: hmac ? konsultanPortalYolu(hmac) : konsultanPortalYolu(ham) }
  } catch (e) {
    console.error('[konsultasyon] portal jeton', e)
    return { satir: s, portalLink: null }
  }
}

export async function konsultanaEpostaGonder(g: {
  sb: SupabaseClient
  doktorId: string
  satir: KonsultasyonSatiri
  alici: string
  hekimAdi: string
}): Promise<{ epostaDurum: EpostaDurum; portalLink: string | null; satir: KonsultasyonSatiri }> {
  const { satir, portalLink } = await portalLinkHazirla(g.sb, g.doktorId, g.satir)
  if (!portalLink) return { epostaDurum: 'hata', portalLink: null, satir }

  try {
    const { epostaGonder } = await import('@/lib/iletisim/otomatik/eposta/gonderim')
    const sonuc = await epostaGonder(g.sb, {
      doktorId: g.doktorId,
      alici: g.alici,
      konu: `Konsültasyon istemi — ${hedefEtiketi(satir)}`,
      metin: [
        `Sayın meslektaşım,`,
        ``,
        `${g.hekimAdi} sizinle bir konsültasyon istemi paylaştı.`,
        `Bağlantı (hesap veya şifre gerekmez):`,
        portalLink,
        ``,
        `Raporunuzu, filminizi veya EKG'nizi bu sayfadan bırakabilirsiniz.`,
      ].join('\n'),
    })
    if (sonuc.ok) {
      const simdi = new Date().toISOString()
      await g.sb.from('sevkler').update({ portal_gonderildi_at: simdi }).eq('id', satir.id).eq('doctor_id', g.doktorId)
      return {
        epostaDurum: 'gonderildi',
        portalLink,
        satir: { ...satir, portal_gonderildi_at: simdi },
      }
    }
    const h = sonuc.hata || ''
    const bagliDegil = h.includes('bağlı değil') || h.includes('bagli') || h.includes('yenilenmesi')
    return { epostaDurum: bagliDegil ? 'bagli_degil' : 'hata', portalLink, satir }
  } catch {
    return { epostaDurum: 'hata', portalLink, satir }
  }
}
