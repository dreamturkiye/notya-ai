/**
 * NOTYA-AYSE-STANDART-01 — plan → karşılık eşleştirmesi (saf). "Önceki vizitte planlananlar gerçekleşti mi?" sorusunun
 * tek cevabı: bir plan yalnız SONRAKİ bir kayıtla (aşı satırı, lab sonucu, konsültasyon yanıtı, sonraki vizit, tarama
 * kaydı) karşılanmış sayılır. lib/doktor/acikIsler.ts, soru kanıt blokları ve branş parametreleri buradan okur.
 */
import type { DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { trGun } from '@/lib/doktor/dosyaOlaylari'
import { seriAdi } from '@/lib/doktor/notAsilari'
import { kanonikTr } from '@/core/lab/kanonik'

const PLAN_DURUMLARI = new Set(['planlandi', 'onerildi', 'istendi', 'randevu'])
const DURUM_AD: Record<string, string> = { planlandi: 'planlandı', onerildi: 'önerildi', istendi: 'istendi', randevu: 'randevu / kontrol verildi', recete: 'reçete edildi' }
export const durumAdi = (d: string) => DURUM_AD[d] || d

const esTarama = (a: string | null | undefined, b: string | null | undefined) => {
  const k = (x: string | null | undefined) => (x === 'otizm' ? 'mchat' : x || '')
  return !a || a === 'gelisim' || !b || k(a) === k(b)
}

/**
 * Bir plan olayının SONRAKİ kayıttaki karşılığı. Yalnız serbest metinle doğrulanan karşılık `guven: 'metin'` taşır —
 * ör. sonraki notta "Hep B yapıldı" yazıyor ama aşı tablosunda satır yok.
 */
export function planKarsiligi(plan: DosyaOlayi, olaylar: DosyaOlayi[]): DosyaOlayi | null {
  const sonra = olaylar.filter((o) => o !== plan && o.tarih >= plan.tarih)
  switch (plan.tur) {
    case 'asi': {
      const uyar = (o: DosyaOlayi) => (!plan.anahtar || o.anahtar === plan.anahtar) && (plan.doz == null || o.doz == null || o.doz === plan.doz)
      return sonra.find((o) => o.kaynak === 'asi' && uyar(o))
        || sonra.find((o) => o.kaynak === 'not' && o.tur === 'asi' && o.durum === 'uygulandi' && uyar(o)) || null
    }
    case 'lab': {
      const anahtarlar = plan.anahtarlar || []
      return sonra.find((o) => o.kaynak === 'lab' && (!anahtarlar.length || anahtarlar.includes(String(o.anahtar)))) || null
    }
    case 'konsultasyon':
      return sonra.find((o) => o.kaynak === 'konsultasyon' && o.durum === 'sonuclandi')
        || sonra.find((o) => o.kaynak === 'not' && o.tur === 'konsultasyon' && (o.durum === 'sonuclandi' || o.durum === 'uygulandi') && o.vizitId !== plan.vizitId) || null
    case 'kontrol':
      return sonra.find((o) => o.kaynak === 'not' && o.tur === 'vizit' && o.tarih > plan.tarih) || null
    case 'tarama':
      return sonra.find((o) => o.kaynak === 'olcum' && o.tur === 'tarama' && esTarama(plan.anahtar, o.anahtar))
        || sonra.find((o) => o.kaynak === 'not' && o.tur === 'tarama' && (o.durum === 'sonuclandi' || o.durum === 'uygulandi') && esTarama(plan.anahtar, o.anahtar)) || null
    case 'goruntuleme':
      return sonra.find((o) => o.kaynak === 'belge')
        || sonra.find((o) => o.kaynak === 'not' && o.tur === 'goruntuleme' && o.durum === 'sonuclandi' && o.vizitId !== plan.vizitId) || null
    default:
      return null
  }
}

/** Not metnindeki plan olayları (planlandı / önerildi / istendi / randevu). */
export function planOlaylari(olaylar: DosyaOlayi[]): DosyaOlayi[] {
  return olaylar.filter((o) => o.kaynak === 'not' && PLAN_DURUMLARI.has(o.durum) && o.tur !== 'ilac')
}

export function labAdlari(anahtarlar: string[] | undefined): string {
  return anahtarlar?.length ? anahtarlar.map(kanonikTr).join(', ') : 'Tetkik'
}

/** Aşı plan satırı — "Hepatit B 2. doz — planlandı (26.09.2026, not: "…")". */
export function asiPlanSatiri(p: DosyaOlayi): string {
  const ad = p.anahtar ? seriAdi(p.anahtar) : 'Aşı'
  return `${ad}${p.doz ? ` ${p.doz}. doz` : ''} — ${durumAdi(p.durum)} (${trGun(p.tarih)}, not: "${p.metin}")`
}

