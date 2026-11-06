/**
 * KLINIK-DERM-EXCEPTIONAL-01 — ayaktan lazer / akne bakım kliniği.
 * TUS dermatoloji (Derim, lezyon, morfoloji, skor) DEĞİLDİR. Tanı yok.
 * Gün sayıları ürün kararıdır; resmi takvim değildir.
 */
import { kontrolDurumu } from '@/lib/klinik/telafi'
import { vadeDurumu } from '@/lib/klinik/isoGun'
import { seansVadesi } from '@/lib/clinical/genitalEstetik'

export const HEKIM_KILIT = 'Lazer parametresi, fluence ve tanı hekimindir. Notya doz/skor yazmaz.'
export const ACIL_METIN = 'Yaygın kabarcık, görme kaybı, nefes darlığı veya hızla yayılan kızarıklık+ateş: 112.'

export const LAZER_BOLGELER = ['Yüz', 'Boyun', 'Gövde', 'Bacak', 'Diğer'] as const

export function lazerSeansVadesi(
  sonIso: string,
  aralikGun: number,
  bugun: string,
): { due: string; durum: 'gecikti' | 'bugun' | 'yaklasiyor' | 'planli'; ozet: string } | { hata: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sonIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) {
    return { hata: 'Son seans ve bugün YYYY-MM-DD olmalı.' }
  }
  // GENITAL-ESTETIK-01: the 14–90 day rule is the SHARED core's (lib/clinical/genitalEstetik.ts → seansVadesi), also used by
  // the KD energy-session note — deepened, not duplicated.
  const v = seansVadesi(sonIso, aralikGun)
  if ('hata' in v) return { hata: v.hata === 'aralik_gecersiz' ? 'Aralık 14–90 gün (hekim protokolü). Fluence yok.' : 'Son seans ve bugün YYYY-MM-DD olmalı.' }
  const due = v.due
  const durum = vadeDurumu(bugun, due) || 'planli'
  return { due, durum, ozet: `Sonraki seans ${due} · ${durum}. Parametre hekimde. Öneri — hekim kilitler.` }
}

export function akneBakimTakvimi(baslangicIso: string, bugun: string): Array<{ hafta: number; ad: string; durum: 'gecikti' | 'bugun' | 'yaklasiyor' | 'planli' }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(baslangicIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return []
  return [
    { hafta: 2, ad: 'Erken tahammül kontrolü (yorum yok)' },
    { hafta: 6, ad: 'Bakım uyum kontrolü (hekim)' },
    { hafta: 12, ad: 'Plan gözden geçirme (hekim)' },
  ].map((x) => ({
    ...x,
    durum: kontrolDurumu(baslangicIso, x.hafta * 7, bugun) || 'planli',
  }))
}

export function fotoRizaKayit(onamVar: boolean): { ozet: string } | { hata: string } {
  if (!onamVar) return { hata: 'Klinik foto için ayrı KVKK rızası zorunlu — lezyon atlası / TUS Derim yok.' }
  return { ozet: 'Foto KVKK rızası kayıtlı. Morfoloji, skor ve fluence yazılmaz.' }
}

export function gunesRitmi(baslangicIso: string, bugun: string): Array<{ hafta: number; ad: string; durum: 'gecikti' | 'bugun' | 'yaklasiyor' | 'planli' }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(baslangicIso) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return []
  return [
    { hafta: 1, ad: 'Erken güneş / bakım kontrolü' },
    { hafta: 4, ad: 'Bakım ritmi kontrolü' },
    { hafta: 8, ad: 'Plan gözden geçirme' },
  ].map((x) => ({
    ...x,
    durum: kontrolDurumu(baslangicIso, x.hafta * 7, bugun) || 'planli',
  }))
}

export function lazerAcilBand(kabarcik: boolean, gorme: boolean, nefes: boolean): { ozet: string; acil: boolean } {
  const acil = kabarcik || gorme || nefes
  return {
    acil,
    ozet: acil ? 'Kabarcık, görme veya nefes işaretli — 112. Fluence yazılmaz.' : 'Lazer acil bandı boş.',
  }
}

export const INTAKE_ACIL = [
  'Lazer sonrası yaygın kabarcık veya görme kaybı',
  'Nefes darlığı / yaygın kurdeşen',
  'Hızla yayılan kızarıklık + ateş',
  'Yok',
]
