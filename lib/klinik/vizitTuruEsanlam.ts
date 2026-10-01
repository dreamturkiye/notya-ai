/**
 * NOTYA-DOSYA-SORU-TUR-01 (Kaan, 2026-10-01) — vizit TÜRÜ / yaş-dönümü eşanlamları ("6 aylık sağlam çocuk
 * muayenesi", "aşı vizidi", "akut muayene"). esanlamGruplariBul (sikayetEsanlam.ts) bir ŞİKAYET sözlüğüdür;
 * vizit TÜRÜ ayrı bir eksendir (aynı şikayet farklı vizit türlerinde geçebilir), bu yüzden ayrı küçük bir sözlük.
 *
 * Aynı katlama + sözcük-başı eşleme kuralını kullanır (terimlerdenBiriGeciyor, sikayetEsanlam.ts) — mantık
 * tekrar yazılmadı. Kapsam KASITLI küçük tutuldu, Dr. Gökhan'ın gerçek paneline karşı doğrulandı (production,
 * Umutcan Türkoğlu'nun "rutin sağlam çocuk kontrolü / izlemi" notları): "sağlam çocuk / rutin kontrol" kategorisi
 * + rakamlı yaş-dönümü ifadesi ("6 aylık", "2 haftalık", "3 günlük", "2 yaşında"). Sözel sayı ("altı aylık")
 * bu sürümde ÇÖZÜLMEZ — gerçek canlı örnekte de rakamla geldi (ASR). docs/OPEN-COMMITMENTS.md NOTYA-DOSYA-SORU-TUR-01.
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { terimlerdenBiriGeciyor } from '@/lib/klinik/sikayetEsanlam'

export interface VizitTuruGrubu {
  id: string
  ad: string
  terimler: string[]
}

/** Vizit TÜRÜ kategorileri (şikayet değil — "bu vizit hangi amaçla yapıldı"). */
export const VIZIT_TURU_GRUPLARI: VizitTuruGrubu[] = [
  { id: 'saglam-cocuk', ad: 'Sağlam çocuk muayenesi / rutin kontrol', terimler: ['saglam cocuk', 'saglam yenidogan', 'saglam bebek', 'rutin kontrol', 'rutin saglam', 'cocuk sagligi izlem'] },
  { id: 'asi-vizit', ad: 'Aşı vizidi', terimler: ['asi icin geldi', 'asi yaptirmaya geldi', 'asi vizidi', 'asi vizit', 'asilama icin'] },
  { id: 'akut', ad: 'Akut / hastalık muayenesi', terimler: ['akut basvuru', 'akut vizit', 'sikayetle basvurdu', 'hasta muayenesi'] },
]

/** Mesajın andığı vizit-türü grupları. */
export function vizitTuruGruplariBul(metin: string | null | undefined): VizitTuruGrubu[] {
  if (!trAramaNormalize(metin)) return []
  return VIZIT_TURU_GRUPLARI.filter((g) => terimlerdenBiriGeciyor(metin, g.terimler) != null)
}

export type YasBirimi = 'gun' | 'hafta' | 'ay' | 'yas'
export interface VizitYasIfadesi { sayi: number; birim: YasBirimi }

/**
 * "6 aylık", "2 haftalık", "3 günlük", "2 yaşında" ifadesini çözer. Yalnız RAKAMLI biçim — gerçek canlı
 * örnekte de ("Umutcan Türkoğlu'nun 6 aylık sağlam çocuk muayenesi") rakamla geldi (ASR sayıyı rakama çevirir).
 * Sözel sayı ("altı aylık") bilerek kapsam dışı — docs/OPEN-COMMITMENTS.md.
 */
export function vizitYasIfadesiCoz(metin: string | null | undefined): VizitYasIfadesi | null {
  const n = trAramaNormalize(metin)
  const m = n.match(/(\d{1,3})\s*(gunluk|gun|haftalik|hafta|aylik|ay|yasinda|yas)\b/)
  if (!m) return null
  const sayi = Number(m[1])
  const raw = m[2]
  const birim: YasBirimi = raw.startsWith('gun') ? 'gun' : raw.startsWith('hafta') ? 'hafta' : raw.startsWith('ay') ? 'ay' : 'yas'
  return { sayi, birim }
}

/** İki yaş ifadesi aynı yaş-dönümünü mü anıyor. */
export function vizitYasIfadesiEslesir(a: VizitYasIfadesi | null, b: VizitYasIfadesi | null): boolean {
  return !!a && !!b && a.sayi === b.sayi && a.birim === b.birim
}
