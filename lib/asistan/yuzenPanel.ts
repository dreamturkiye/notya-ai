/**
 * NOTYA-ASISTAN-YUZEN-01 (Kaan, 2026-09-26) — "asistan sayfa geçişlerinde açık kalır".
 * Doktor asistanla (sesli seans ya da yazılı sohbet) çalışırken başka sayfaya geçerse oturum
 * AsistanOturumContext'te yaşar; /asistan dışındaki sayfalarda sağ altta yüzen panel görünür.
 * Bu dosya yalnız saf kararları taşır — React yok, test edilebilir.
 */

export type SesDurumu = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'

/** Sesli seans canlı mı (bağlanıyor / dinliyor / konuşuyor). */
export function sesAktifMi(durum: SesDurumu): boolean {
  return durum === 'connecting' || durum === 'listening' || durum === 'speaking'
}

/** /asistan (ve altı) — oturumun kendi sayfası; orada yüzen panel gösterilmez. */
export function asistanSayfasiMi(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const yol = pathname.replace(/\/+$/, '') || '/'
  return yol === '/asistan' || yol.startsWith('/asistan/')
}

export interface YuzenPanelGirdisi {
  sesDurumu: SesDurumu
  /** Sesli seansta ekranda en az bir mesaj var mı (hata sonrası panelin kaybolmaması için). */
  sesMesajiVar: boolean
  yaziliAcik: boolean
  /** Yazılı sohbette doktor en az bir soru sordu mu — yalnız açılış selamı oturum sayılmaz. */
  yaziliDoktorMesajiVar: boolean
  pathname: string | null | undefined
}

/** Oturum sürüyor mu — doktor "Kapat" diyene kadar true kalır. */
export function asistanOturumuSuruyor(g: Omit<YuzenPanelGirdisi, 'pathname'>): boolean {
  if (sesAktifMi(g.sesDurumu)) return true
  // Ses başka sayfadayken koptuysa panel hata ile görünür kalır; doktor görür ve kendisi kapatır.
  if (g.sesDurumu === 'error' && g.sesMesajiVar) return true
  return g.yaziliAcik && g.yaziliDoktorMesajiVar
}

/** Yüzen panel görünür mü: oturum sürüyor VE doktor /asistan dışında. */
export function yuzenPanelGorunur(g: YuzenPanelGirdisi): boolean {
  if (!g.pathname || asistanSayfasiMi(g.pathname)) return false
  return asistanOturumuSuruyor(g)
}

/** Balon ve panel başlığındaki mikrofon durumu. */
export function mikrofonEtiketi(sesDurumu: SesDurumu, yaziliDinliyor: boolean): string {
  if (sesDurumu === 'connecting') return 'Bağlanıyor…'
  if (sesDurumu === 'listening') return 'Dinliyor'
  if (sesDurumu === 'speaking') return 'Konuşuyor'
  if (sesDurumu === 'error') return 'Bağlantı koptu'
  return yaziliDinliyor ? 'Dinliyor' : 'Yazılı sohbet'
}
