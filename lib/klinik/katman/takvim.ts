/**
 * Paylaşılan klinik takvimi. Randevu satırı doktorun kendi takviminden okunur.
 * Çakışma kuralı mevcut yarım-açık aralık testidir: yeni bir takvim motoru yok.
 */
import type { Aralik } from '@/lib/randevu/v2/slot'

export type KlinikRandevu = {
  id: string
  doktorId: string
  odaId: string | null
  bas: number
  son: number
}

const kesisir = (a: Aralik, b: Aralik) => a.bas < b.son && a.son > b.bas

export function yerlestirmeReddi(
  mevcut: readonly KlinikRandevu[],
  aday: KlinikRandevu,
): 'doktor' | 'oda' | null {
  if (!(aday.son > aday.bas)) return 'doktor'
  for (const m of mevcut) {
    if (m.id === aday.id) continue
    if (m.son <= m.bas) continue
    if (m.doktorId === aday.doktorId && kesisir(m, aday)) return 'doktor'
    if (aday.odaId && m.odaId === aday.odaId && kesisir(m, aday)) return 'oda'
  }
  return null
}

export type AkisSatiri = { id: string; doktorId: string; bas: number; son: number; durum: string }

/** Günün akışı: odada olan, sıradaki ve geciken. Kural; model yok. */
export function akisDurumu(simdi: number, satirlar: readonly AkisSatiri[]): {
  odada: AkisSatiri[]
  siradaki: AkisSatiri | null
  geciken: AkisSatiri[]
} {
  const acik = satirlar.filter((s) => s.durum !== 'iptal' && s.durum !== 'tamamlandi' && s.son > s.bas)
  const odada = acik.filter((s) => s.bas <= simdi && simdi < s.son).sort((a, b) => a.bas - b.bas)
  const gelecek = acik.filter((s) => s.bas > simdi).sort((a, b) => a.bas - b.bas)
  const geciken = acik.filter((s) => s.son <= simdi && s.durum !== 'gelmedi').sort((a, b) => a.bas - b.bas)
  return { odada, siradaki: gelecek[0] || null, geciken }
}

/** Üye hekim başka hekimin hastasının adını görmez. Saat bloğu kalır; ad yerine dolu yazılır. */
export function takvimHastaAdi(yonetici: boolean, kendiId: string, doktorId: string, ad: string): string {
  if (yonetici || doktorId === kendiId) return ad.trim() || 'Hasta'
  return 'Dolu'
}

/** Üye hekim, kartta yalnız kendi ziyaretini görür. Sahip ve yönetici klinik özetini görür. Not metni bu fonksiyona girmez. */
export function gorunurZiyaretler<T extends { doktorId: string }>(
  yonetici: boolean,
  kendiId: string,
  ziyaretler: readonly T[],
): T[] {
  if (yonetici) return [...ziyaretler]
  return ziyaretler.filter((z) => z.doktorId === kendiId)
}

const TUR: Record<string, string> = {
  ilk_muayene: 'İlk muayene',
  muayene: 'Muayene',
  kontrol: 'Kontrol',
  diger: 'Randevu',
}

const DURUM: Record<string, string> = {
  planlandi: 'planlandı',
  onaylandi: 'onaylandı',
  tamamlandi: 'tamamlandı',
  gelmedi: 'gelmedi',
  talep: 'talep',
  iptal: 'iptal',
}

/** Kart satırı. Serbest not ve SOAP buraya yazılmaz. */
export function ziyaretOzeti(tur: string, durum: string): string {
  return `${TUR[tur] || 'Randevu'} · ${DURUM[durum] || 'kayıt'}`
}
