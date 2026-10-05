/**
 * KONSULTASYONLAR — konsültana portal linki e-postası.
 * Gönderim hekimin CİHAZINDAKİ posta uygulamasından (mailto / Mac Mail / iPhone Mail /
 * Ayarlar › İletişim’deki tercih: uygulama | Gmail web | Outlook web) — NOTYA-ILETISIM-01 ile aynı desen.
 * Sunucu OAuth kutusu gerekmez. Klinik dilim linktedir; şifre/hesap yok.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { epostaGecerliMi } from '@/lib/iletisim/otomatik/eposta/mime'
import { KONSULTASYON_KOLONLARI, hedefEtiketi, type KonsultasyonSatiri } from '@/lib/doktor/konsultasyon'

/** hazir = taslak hazır (cihazda açılacak); gonderildi = hekim posta uygulamasında gönderdi (işaretlendi). */
export type EpostaDurum = 'hazir' | 'gonderildi' | 'yok' | 'hata'

export const ILETISIM_EPOSTA_AYAR_YOLU = '/dashboard/doktor/ayarlar/iletisim'

export type KonsultanEpostaTaslagi = {
  alici: string
  konu: string
  metin: string
  portalLink: string
}

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
      return `Konsültana e-posta gönderildi olarak işaretlendi${a}.`
    case 'hazir':
      return `Posta uygulamanız açıldı${a} — orada Gönder’e basın (Mac Mail, iPhone Mail vb.).`
    case 'yok':
      return 'Konsültan e-postası yok — Defterden seçin veya e-posta yazın; ardından «E-posta gönder».'
    case 'hata':
      return 'E-posta taslağı hazırlanamadı — yeniden deneyin.'
    case 'bagli_degil':
      // Eski istemci / yanıt — artık OAuth gerekmez.
      return `Posta uygulamanızda açın${a} — Ayarlar › İletişim’den «Bu cihazdaki posta uygulaması» seçili olsun.`
    default:
      return ''
  }
}

export function konsultanEpostaTaslagi(hekimAdi: string, satir: Pick<KonsultasyonSatiri, 'hedef' | 'hedef_brans'>, portalLink: string, alici: string): KonsultanEpostaTaslagi {
  return {
    alici,
    konu: `Konsültasyon istemi — ${hedefEtiketi(satir)}`,
    metin: [
      `Sayın meslektaşım,`,
      ``,
      `${hekimAdi} sizinle bir konsültasyon istemi paylaştı.`,
      `Bağlantı (hesap veya şifre gerekmez):`,
      portalLink,
      ``,
      `Raporunuzu, filminizi veya EKG'nizi bu sayfadan bırakabilirsiniz.`,
    ].join('\n'),
    portalLink,
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

/**
 * Konsültan e-posta taslağı — sunucu göndermez; istemci cihaz postasını açar.
 * `isaretle: true` → hekim Gönder’e bastı / açıldıktan sonra portal_gonderildi_at yazılır.
 */
export async function konsultanaEpostaHazirla(g: {
  sb: SupabaseClient
  doktorId: string
  satir: KonsultasyonSatiri
  alici: string
  hekimAdi: string
  isaretle?: boolean
}): Promise<{ epostaDurum: EpostaDurum; taslak: KonsultanEpostaTaslagi | null; satir: KonsultasyonSatiri }> {
  const { satir, portalLink } = await portalLinkHazirla(g.sb, g.doktorId, g.satir)
  if (!portalLink) return { epostaDurum: 'hata', taslak: null, satir }

  const taslak = konsultanEpostaTaslagi(g.hekimAdi, satir, portalLink, g.alici)
  if (g.isaretle) {
    const simdi = new Date().toISOString()
    await g.sb.from('sevkler').update({ portal_gonderildi_at: simdi }).eq('id', satir.id).eq('doctor_id', g.doktorId)
    return {
      epostaDurum: 'gonderildi',
      taslak,
      satir: { ...satir, portal_gonderildi_at: simdi },
    }
  }
  return { epostaDurum: 'hazir', taslak, satir }
}

/** @deprecated OAuth sunucu gönderimi kaldırıldı — hazirla kullanın. */
export const konsultanaEpostaGonder = konsultanaEpostaHazirla
