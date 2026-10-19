/**
 * Saç ekimi donör ve alıcı görüntü dosyası. Oda ölçüsü bu dosyada yoktur.
 * Baytlar belge kasasına gider. Sağlığım yalnız "Fotoğraf kaydı" gününü görür.
 */
import { gunFarki, isoEkleGun, isoMu } from '@/lib/klinik/isoGun'
import { FOTO_72_GUN } from './sac'

export const SAC_FOTO_ARAC = 'sac-foto-dosya'

export const FOTO_ROLLERI = [
  { id: 'donor-once', ad: 'Donör, işlem öncesi', pencere: 'once' },
  { id: 'alici-once', ad: 'Alıcı, işlem öncesi', pencere: 'once' },
  { id: 'donor-72', ad: 'Donör, ilk 72 saat', pencere: 'sonra' },
  { id: 'alici-72', ad: 'Alıcı, ilk 72 saat', pencere: 'sonra' },
] as const

export type FotoRol = (typeof FOTO_ROLLERI)[number]['id']
export type FotoKayit = { rol: FotoRol; islem: string; cekim: string; id?: string }

export function fotoRolMu(s: string): s is FotoRol {
  return FOTO_ROLLERI.some((r) => r.id === s)
}

export function fotoNotu(rol: FotoRol, islem: string, cekim: string): string {
  return `sac-foto|${rol}|${islem}|${cekim}`
}

export function fotoNotCoz(notes: string | null | undefined): FotoKayit | null {
  if (!notes) return null
  const p = notes.split('|')
  if (p.length !== 4 || p[0] !== 'sac-foto' || !fotoRolMu(p[1]) || !isoMu(p[2]) || !isoMu(p[3])) return null
  return { rol: p[1], islem: p[2], cekim: p[3] }
}

export function cekimPenceresi(rol: FotoRol, islem: string, cekim: string): true | string {
  if (!isoMu(islem) || !isoMu(cekim)) return 'İşlem ve çekim gününü girin.'
  const tanim = FOTO_ROLLERI.find((r) => r.id === rol)
  if (!tanim) return 'Fotoğraf rolü yok.'
  if (tanim.pencere === 'once') {
    const f = gunFarki(cekim, islem)
    if (f == null || f < 0) return 'İşlem öncesi fotoğraf, işlem gününden sonra olamaz.'
    return true
  }
  const f = gunFarki(islem, cekim)
  if (f == null || f < 0 || f > FOTO_72_GUN) return 'İlk 72 saat fotoğrafı işlem günü ile üçüncü gün arasında çekilir.'
  return true
}

export function fotoDosyaDurumu(islem: string, dosyalar: FotoKayit[]) {
  if (!isoMu(islem)) return { hata: 'İşlem gününü girin.' as const }
  const benim = dosyalar.filter((d) => d.islem === islem)
  const bitis = isoEkleGun(islem, FOTO_72_GUN)
  const slotlar = FOTO_ROLLERI.map((r) => {
    const dosya = benim.find((d) => d.rol === r.id)
    return { id: r.id, ad: r.ad, pencere: r.pencere, varMi: Boolean(dosya), belgeId: dosya?.id || '' }
  })
  const eksik72 = slotlar.filter((s) => s.pencere === 'sonra' && !s.varMi)
  const hatirlatma = eksik72.length ? { iso: bitis, ad: 'Fotoğraf kaydı' } : null
  const eksikAd = slotlar.filter((s) => !s.varMi).map((s) => s.ad)
  const ozet = eksikAd.length
    ? `md.10/3: ${eksikAd.join(' · ')} dosyada yok. 72 saat sonu ${bitis}. Bakanlık Ek-4 yazımı iddia edilmez.`
    : `md.10/3: donör ve alıcı fotoğrafları dosyada. 72 saat kaydı tamam. Bakanlık Ek-4 yazımı iddia edilmez.`
  return { slotlar, hatirlatma, ozet, bitis }
}
