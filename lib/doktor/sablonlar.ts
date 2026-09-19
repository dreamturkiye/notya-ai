/**
 * ARACLAR-CILA-01 Faz 4 — Araçlar › Sık kullandıklarım / hızlı şablonlar: saf yardımcılar.
 *
 * Şablon HEKİME ÖZELDİR ve içeriği tamamen hekimin kendi yazdığı metindir — Notya ilaç, doz ya da
 * hazır şablon ÖNERMEZ (doz kilidi). Buradaki iş yalnız alanları kırpmak ve boş şablonu reddetmek.
 */

export const SABLON_SINIRLARI = { ad: 80, tani: 300, receteTaslagi: 2000, kontrolAraligi: 120, notlar: 2000 } as const

export interface DoktorSablonu {
  id: string
  ad: string
  tani: string | null
  recete_taslagi: string | null
  kontrol_araligi: string | null
  notlar: string | null
  kullanim_sayisi: number
  son_kullanim: string | null
  updated_at?: string
}

export interface SablonYazim {
  ad: string
  tani: string | null
  recete_taslagi: string | null
  kontrol_araligi: string | null
  notlar: string | null
}

const kirp = (v: unknown, tavan: number): string | null => {
  const s = String(v ?? '').trim().slice(0, tavan)
  return s || null
}

/** Gövdeden yazılabilir şablon alanları; ad yoksa null (boş şablon kaydedilmez). */
export function sablonTemizle(govde: unknown): SablonYazim | null {
  const b = (govde && typeof govde === 'object' ? govde : {}) as Record<string, unknown>
  const ad = kirp(b.ad, SABLON_SINIRLARI.ad)
  if (!ad) return null
  return {
    ad,
    tani: kirp(b.tani, SABLON_SINIRLARI.tani),
    recete_taslagi: kirp(b.receteTaslagi ?? b.recete_taslagi, SABLON_SINIRLARI.receteTaslagi),
    kontrol_araligi: kirp(b.kontrolAraligi ?? b.kontrol_araligi, SABLON_SINIRLARI.kontrolAraligi),
    notlar: kirp(b.notlar, SABLON_SINIRLARI.notlar),
  }
}

/** Şablonun muayene formuna eklenebilecek satırları — hekim üzerinde değişiklik yapabilir. */
export function sablonSatirlari(s: Pick<DoktorSablonu, 'ad' | 'tani' | 'recete_taslagi' | 'kontrol_araligi' | 'notlar'>): string[] {
  return [
    s.tani ? `Tanı (hekim): ${s.tani}` : '',
    s.recete_taslagi ? `Reçete taslağı (hekimin kendi şablonu): ${s.recete_taslagi.replace(/\s*\n\s*/g, ' · ')}` : '',
    s.kontrol_araligi ? `Kontrol aralığı: ${s.kontrol_araligi}` : '',
    s.notlar ? `Not: ${s.notlar.replace(/\s*\n\s*/g, ' · ')}` : '',
  ].filter(Boolean)
}

/** Sık kullanılan üstte: kullanım sayısı, sonra son kullanım, sonra ad (tr-TR). */
export function sablonSirala<T extends Pick<DoktorSablonu, 'ad' | 'kullanim_sayisi' | 'son_kullanim'>>(liste: T[]): T[] {
  return [...liste].sort((a, b) =>
    (b.kullanim_sayisi || 0) - (a.kullanim_sayisi || 0)
    || String(b.son_kullanim || '').localeCompare(String(a.son_kullanim || ''))
    || a.ad.localeCompare(b.ad, 'tr-TR'))
}
