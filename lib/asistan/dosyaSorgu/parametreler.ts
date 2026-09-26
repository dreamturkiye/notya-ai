/**
 * NOTYA-AYSE-STANDART-01 — çekirdek sorular × branş PARAMETRELERİ.
 *
 * On sorudan yedisi çekirdektir (1, 2, 5, 6, 7, 9, 10 — her branşta aynı cümle ve aynı sorgu). İkisi çekirdek ama
 * branş parametresiyle çalışır: Soru 3 ölçüm eğilimi (pediatri: persentil / Z; erişkin: kilo / VKİ / TA trendi) ve
 * Soru 4 aşı (takvim parametredir). Soru 8 (gelişim / GİDR / M-CHAT) branşa özgüdür: yalnız `gelisim` tanımlayan
 * branş onu cevaplar (BRANS-ALAN-SIZMASI: kardiyoloji hastasına GİDR sorulmaz).
 *
 * Yeni branş: specialties/<branş>/sorgu.ts içinde bir `BransSorguParametreleri` yazar ve aşağıdaki BRANS_PARAMETRELERI
 * haritasına tek satır ekler. Çekirdek (soruTuru, kanit, acikIsler, kurallar) değişmez. Tanımlı olmayan branş TEMEL
 * parametreleri alır: ölçüm trendi var, aşı takvimi yok — ve bunu dürüstçe söyler.
 */
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import type { AcikIs } from '@/lib/doktor/acikIsler'
import { trGun } from '@/lib/doktor/dosyaOlaylari'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { pediatrikBaglamMi } from '@/lib/specialties/kapsam'
import { PEDIATRI_SORGU } from '@/specialties/pediatri/sorgu'

export type AsiDozDurumu = 'uygulandi' | 'bugun' | 'zamani_geldi' | 'gecikti' | 'yaklasiyor' | 'bekliyor' | 'yas_disi'

export interface AsiDoz {
  seri: string
  no: number
  /** "Hepatit B 2. doz" */
  ad: string
  durum: AsiDozDurumu
  /** ISO — takvimin önerdiği tarih. */
  onerilen: string | null
  /** ISO — aşı tablosundaki uygulama tarihi (yalnız kayıt). */
  uygulamaTarihi: string | null
  telafi?: boolean
}

export interface AsiDurumu {
  /** Takvim sürümü / kaynağı. */
  surum: string
  dozlar: AsiDoz[]
  notlar: string[]
  /** Takvimle eşleşmeyen kayıtlar (özel aşı, tanınmayan ad). */
  eslesmeyen: string[]
  /** Takvim dışı / risk bazlı aşılar — rutinden ayrı gösterilir. */
  riskBazli: string[]
}

export interface Degerlendirme { satirlar: string[]; bayraklar: AcikIs[] }

export interface BransSorguParametreleri {
  anahtar: string
  ad: string
  /** Soru 3 — ölçüm eğilimi. Tek ölçümle karar yok: satırlar tarih aralığını açıkça verir. */
  buyume(olaylar: DosyaOlayi[], hasta: DosyaHastasi): Degerlendirme
  /** Soru 4 — takvime göre aşı durumu. null → bu branş için takvim tanımlı değil (`asiTakvimiYok` söylenir). */
  asi(olaylar: DosyaOlayi[], hasta: DosyaHastasi): AsiDurumu | null
  asiTakvimiYok: string
  /** Soru 8 — branşa özgü bölüm sorusu (pediatri: gelişim). Tanımsızsa soru bu branşta cevaplanmaz. */
  gelisim?: (olaylar: DosyaOlayi[], hasta: DosyaHastasi) => Degerlendirme
  /** Yaşa göre koruyucu kalemler (Soru 9 "rutin"). */
  yasaGoreIsler?: (olaylar: DosyaOlayi[], hasta: DosyaHastasi) => AcikIs[]
}

/** Eksik doz etiketi: önerilen tarihten 30 günden fazla geçmişse "zamanı geçmiş" (telafi planı bugüne düşse de). */
export function eksikDozEtiketi(d: Pick<AsiDoz, 'durum' | 'onerilen'>, bugunIso: string): string {
  if (d.durum === 'gecikti') return 'zamanı geçmiş'
  const gecikme = d.onerilen ? (Date.parse(`${bugunIso}T00:00:00Z`) - Date.parse(`${d.onerilen}T00:00:00Z`)) / 86_400_000 : 0
  return gecikme > 30 ? 'zamanı geçmiş' : 'zamanı gelmiş'
}

const TR_SAYI = (n: number, b = 1) => n.toLocaleString('tr-TR', { maximumFractionDigits: b })

/** Ölçüm serisi: "Kilo: 82 kg (01.01.2026) → 78 kg (01.06.2026), −4 kg" — değer tek başına yorumlanmaz. */
export function olcumTrendSatiri(olaylar: DosyaOlayi[], tur: string, ad: string): string | null {
  const s = olaylar.filter((o) => o.tur === tur && o.deger != null)
  if (!s.length) return null
  if (s.length === 1) return `${ad}: tek ölçüm — ${TR_SAYI(s[0].deger!)} ${s[0].birim || ''} (${trGun(s[0].tarih)}); eğilim için yeterli veri yok.`
  const son = s.slice(-6)
  const fark = son[son.length - 1].deger! - son[0].deger!
  return `${ad}: ${son.map((o) => `${TR_SAYI(o.deger!)} ${o.birim || ''} (${trGun(o.tarih)})`.replace(/\s+\(/, ' (')).join(' → ')}; ${trGun(son[0].tarih)}–${trGun(son[son.length - 1].tarih)} arası ${fark >= 0 ? '+' : '−'}${TR_SAYI(Math.abs(fark))} ${son[0].birim || ''}.`
}

/** TEMEL — takvimi / eğrisi tanımlanmamış branşlar: ölçüm trendi var, aşı hesabı yok (dürüst cümle). */
export const TEMEL_SORGU: BransSorguParametreleri = {
  anahtar: 'temel',
  ad: 'Temel',
  buyume(olaylar) {
    const satirlar: string[] = []
    for (const [tur, ad] of [['kilo', 'Kilo'], ['boy', 'Boy']] as const) {
      const s = olcumTrendSatiri(olaylar, tur, ad)
      if (s) satirlar.push(s)
    }
    const kilo = [...olaylar].reverse().find((o) => o.tur === 'kilo' && o.deger)
    const boy = [...olaylar].reverse().find((o) => o.tur === 'boy' && o.deger)
    if (kilo && boy) satirlar.push(`VKİ (son kilo ${trGun(kilo.tarih)} + son boy ${trGun(boy.tarih)}): ${TR_SAYI(kilo.deger! / (boy.deger! / 100) ** 2)} kg/m².`)
    const ta = olaylar.filter((o) => o.tur === 'tansiyon').slice(-6)
    if (ta.length) satirlar.push(`Tansiyon: ${ta.map((o) => `${o.metin.replace(/^tansiyon /, '')} (${trGun(o.tarih)})`).join(' → ')}.`)
    if (!satirlar.length) satirlar.push('Dosyada tarihli ölçüm (kilo / boy / tansiyon) kaydı bulamadım.')
    return { satirlar, bayraklar: [] }
  },
  asi() { return null },
  asiTakvimiYok: 'Bu branş için erişkin aşı takvimi parametreleri henüz tanımlı değil; aşı tablosundaki uygulanmış kayıtları ve notlardaki planları listeliyorum, eksik / zamanı gelmiş aşı hesabı yapmıyorum.',
}

/** Branş anahtarı → parametre. Yeni branş buraya tek satır ekler (specialties/<branş>/sorgu.ts). */
const BRANS_PARAMETRELERI: Partial<Record<string, BransSorguParametreleri>> = {
  pediatri: PEDIATRI_SORGU,
}

/**
 * Parametre seçimi: branşın kendi parametresi; yoksa hasta çocuksa ve branş pediatrik bağlamı kabul ediyorsa
 * (lib/specialties/kapsam pediatrikBaglamMi — aile hekimi çocuğu izler, göz hekimi izlemez) pediatri; yoksa TEMEL.
 */
export function parametreSec(brans: string | null | undefined, dogumIso: string | null | undefined, bugunIso?: string): BransSorguParametreleri {
  const anahtar = bransAnahtari(brans)
  const kendi = anahtar ? BRANS_PARAMETRELERI[anahtar] : undefined
  if (kendi) return kendi
  const nowMs = bugunIso ? Date.parse(`${bugunIso}T12:00:00Z`) : undefined
  if (pediatrikBaglamMi({ doktorBransi: brans ?? null, hastaDogumIso: dogumIso ?? null, nowMs })) return PEDIATRI_SORGU
  return TEMEL_SORGU
}
