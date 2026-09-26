/**
 * NOTYA-KALKAN-01 — sabit otomatik cümleler ve sınıf.
 * Otomatik giden metin burada biter; ilaç adı, doz, tanı üretilmez.
 * Doktorun kendi yazdığı metin bu dosyadan geçmez (defterde aynen durur).
 */

export type KalkanSinif = 'randevu' | 'sonuc_lojistik' | 'tibbi' | 'kirmizi' | 'spam_reklam' | 'belirsiz'

export const METIN = {
  tibbi: 'Mesajla tanı veya tedavi veremiyoruz. Fotoğraf veya ölçüm için Sağlığım’a yükleyin, ya da randevu alın. Acilse 112’yi arayın.',
  kirmizi: 'Bu kanal acil durum için değildir. Şimdi 112’yi arayın veya en yakın acile gidin.',
  mesai: 'Mesajınız alındı. Mesai içinde dönüş yapılır. Acilse 112.',
  belirsiz: 'Randevu, sonuç ya da başka bir konu için kısaca yazın. Acilse 112’yi arayın.',
  sonuc: 'Sonuç ve raporlar Sağlığım’a yüklenir. Acilse 112’yi arayın.',
} as const

/** 24 saat penceresi dışında Meta’ya elle sunulacak UTILITY şablon. Bu kod şablonu oluşturmaz. */
export const SABLON_KALKAN_KOD = 'notya_kalkan_yonlendirme'

const SAGLIKIM = 'https://www.notya.io/portal'

export function yanitMetni(sinif: KalkanSinif, opt: { mesaiDisi: boolean; link: boolean }): string | null {
  if (sinif === 'spam_reklam') return null
  if (sinif === 'kirmizi') return METIN.kirmizi
  if (sinif === 'tibbi') return opt.link ? `${METIN.tibbi}\nSağlığım: ${SAGLIKIM}` : METIN.tibbi
  if (opt.mesaiDisi) return METIN.mesai
  if (sinif === 'randevu') return null
  if (sinif === 'sonuc_lojistik') return opt.link ? `${METIN.sonuc}\nSağlığım: ${SAGLIKIM}` : METIN.sonuc
  if (sinif === 'belirsiz') return METIN.belirsiz
  return null
}

/** Otomatik giden yalnız bu sabitlerin kendisi ya da sonuna Sağlığım satırı eklenmiş hali. */
export function otomatikMetinMi(metin: string): boolean {
  const t = metin.trim()
  const sabit = Object.values(METIN).some((m) => t === m || t === `${m}\nSağlığım: ${SAGLIKIM}`)
  return sabit
}

const KIRMIZI = /nefesi kesild|nefes darl|nefesim|göğüs|gogus agr|göğsüm|şuur|bilinc|bilinç|nöbet|nobet|doğum kanama|dogum kanama|bebek emmiyor|morardı|morardi/
const TIBBI = /ilaç|ilac|amoksisilin|içsin|icsin|doz|dökünt|dokunt|ateş|ates|şurup|surup|antibiyotik/
const RANDEVU = /randevu|iptal|ertele|yapabilir miyiz|saat\b|\d{1,2}[:.]\d{2}/
const SONUC = /tahlil|rapor|kapı kod|kapi kod|sonuç hazır|sonuc hazir/
const SPAM = /reklam|kampanya|indirim|kazandınız|kazandiniz|takipçi|takipci/

function katla(s: string): string {
  return s.toLocaleLowerCase('tr-TR')
}

/** 21:00–07:00 Türkiye saati. */
export function mesaiDisiMi(an: Date): boolean {
  const saat = Number(an.toLocaleString('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false }))
  return saat >= 21 || saat < 7
}

export function kimeDuser(sinif: KalkanSinif): 'hekim' | 'sekreter' | 'dus' {
  if (sinif === 'kirmizi' || sinif === 'tibbi') return 'hekim'
  if (sinif === 'spam_reklam') return 'dus'
  return 'sekreter'
}

export function siniflandir(g: { metin?: string | null; tip?: string | null }): { sinif: KalkanSinif; kaynak: 'anahtar' } {
  const tip = String(g.tip || 'text')
  const metin = String(g.metin || '').trim()
  if (!metin && /image|audio|video|document|sticker/.test(tip)) return { sinif: 'belirsiz', kaynak: 'anahtar' }
  const k = katla(metin)
  if (KIRMIZI.test(k)) return { sinif: 'kirmizi', kaynak: 'anahtar' }
  if (TIBBI.test(k)) return { sinif: 'tibbi', kaynak: 'anahtar' }
  if (RANDEVU.test(k)) return { sinif: 'randevu', kaynak: 'anahtar' }
  if (SONUC.test(k)) return { sinif: 'sonuc_lojistik', kaynak: 'anahtar' }
  if (SPAM.test(k)) return { sinif: 'spam_reklam', kaynak: 'anahtar' }
  return { sinif: 'belirsiz', kaynak: 'anahtar' }
}
