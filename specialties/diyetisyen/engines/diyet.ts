/** DIYETISYEN-EXCEPTIONAL-01 — makro karar desteği; tıbbi tanı hekimde. Haftalar ürün kararıdır. */
import { kontrolDurumu } from '@/lib/klinik/telafi'
export const HEKIM_KILIT = 'Makro bandı karar desteğidir. Tıbbi tanı, ilaç ve takviye dozu yazılmaz.'
export const ACIL_METIN = 'Kontrolsüz kusma + bilinç değişikliği veya ağır alerji: 112.'

export function makroBand(kiloKg: number, hedef: 'kilo' | 'koruma' | 'spor'): { ozet: string } | { hata: string } {
  if (!(kiloKg >= 30 && kiloKg <= 250)) return { hata: 'Kilo 30–250 kg aralığında olmalı — Notya uydurmaz.' }
  const kcal = Math.round(kiloKg * (hedef === 'kilo' ? 22 : hedef === 'spor' ? 32 : 27))
  const protein = Math.round(kiloKg * (hedef === 'spor' ? 1.6 : 1.2))
  return { ozet: `Karar desteği: ~${kcal} kcal / ~${protein} g protein bandı (${hedef}). Nihai plan diyetisyen + hekim tanısınadır.` }
}

export function taniReferansi(hekimTani: string): { ozet: string } | { hata: string } {
  if (!hekimTani.trim()) return { hata: 'Tıbbi beslenme için hekim tanısı / sevk notu girin. Diyetisyen tanı koymaz.' }
  return { ozet: `Hekim tanısı (referans): ${hekimTani.trim()}. Plan buna bağlı; ICD kilidi yok.` }
}

export function kontrolTakvimi(baslangicIso: string, bugun: string): Array<{ hafta: number; ad: string; durum: 'gecikti' | 'bugun' | 'yaklasiyor' | 'planli' }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(baslangicIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return []
  return [
    { hafta: 2, ad: 'Erken uyum kontrolü (öğün şablonu yok)' },
    { hafta: 4, ad: 'Kilo / semptom kaydı (yorum hekimde)' },
    { hafta: 8, ad: 'Plan gözden geçirme' },
  ].map((x) => ({
    ...x,
    durum: kontrolDurumu(baslangicIso, x.hafta * 7, bugun) || 'planli',
  }))
}

export function planKapisi(hekimTani: string, kiloKg: number, hedef: 'kilo' | 'koruma' | 'spor'): { ozet: string } | { hata: string } {
  const t = taniReferansi(hekimTani)
  if ('hata' in t) return t
  const m = makroBand(kiloKg, hedef)
  if ('hata' in m) return m
  return { ozet: `${t.ozet} ${m.ozet}` }
}

export function ogunIskeleti(kahvalti: string, ogle: string, aksam: string): { ozet: string } | { hata: string } {
  const u = [kahvalti, ogle, aksam].map((s) => s.trim())
  if (u.some((s) => !s)) return { hata: 'Kahvaltı, öğle ve akşam için birer etiket. Kalori yazılmaz.' }
  if (u.some((s) => /\d+\s*kcal/i.test(s))) return { hata: 'Öğün etiketine kcal yazılmaz.' }
  return { ozet: `Öğün iskeleti: kahvaltı ${u[0]}; öğle ${u[1]}; akşam ${u[2]}. Tanı ve doz yok.` }
}

export const INTAKE_ACIL = [
  'Kontrolsüz kusma veya bilinç değişikliği (diyabet şüphesi)',
  'Ağır alerjik reaksiyon',
  'Yok',
]
