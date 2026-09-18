/**
 * PEDI-ARACLAR-01 — Araçlar › Doz hesaplayıcı (mg/kg). Pure. YALNIZ HESAP MAKİNESİ.
 *
 * Kurucu kısıtı (harfiyen): hekim mg/kg değerini VE süspansiyon konsantrasyonunu kendisi girer; bu modül yalnız
 * aritmetik ve birim çevirisi yapar. İlaç adı listesi, varsayılan mg/kg, ilaç → doz eşlemesi, "önerilen doz" YOK
 * ve olmayacak (lib/doktor/dozKilidi.ts ile aynı ilke: doz hekim tarafından belirlenir). Tavan da yalnız hekim
 * girerse uygulanır; araç kendi tavanını bilmez. Kilitli: specialties/pediatri/tests/doz.test.ts.
 */
import { sayiCoz } from './girdi'

export type DozModu = 'gun' | 'doz'

export interface Konsantrasyon { mg: number; ml: number; mgPerMl: number; metin: string }

/**
 * Konsantrasyon: "250 mg/5 mL" · "250mg/5ml" · "250/5" · "40 mg/mL" · "100 mg / 5 ml" · "125 mg 5 ml".
 * Okunamazsa null (ekranda "biçim: 250 mg/5 mL" ipucu gösterilir).
 */
export function konsantrasyonCoz(ham: string | null | undefined): Konsantrasyon | null {
  const s = String(ham ?? '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim()
  if (!s) return null
  const r = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:mg)?\s*(?:\/|\s|per)\s*(\d+(?:[.,]\d+)?)?\s*(?:ml|cc)?$/)
  if (!r) return null
  const mg = sayiCoz(r[1])
  const ml = r[2] != null ? sayiCoz(r[2]) : /ml|cc/.test(s) ? 1 : null
  if (mg == null || ml == null || mg <= 0 || ml <= 0) return null
  return { mg, ml, mgPerMl: mg / ml, metin: `${fmt(mg)} mg/${fmt(ml)} mL` }
}

export interface DozGirdi {
  kiloKg: number | null
  mgKg: number | null
  mod: DozModu
  /** Günde kaç doz (1–6). */
  dozSayisi: number
  konsantrasyon?: Konsantrasyon | null
  /** Hekimin girdiği tavanlar (mg). Boşsa uygulanmaz. */
  tavanDozMg?: number | null
  tavanGunMg?: number | null
  /** mL yuvarlama adımı (şırınga / ölçek), varsayılan 0,1 mL. */
  mlAdim?: number
}

export interface DozUyari { kod: 'tavan_doz' | 'tavan_gun' | 'kilo_birim' | 'ml_kucuk'; metin: string }

export interface DozSonuc {
  gunlukMg: number
  dozMg: number
  dozMl: number | null
  dozMlYuvarlak: number | null
  gunlukMl: number | null
  aralikSaat: number
  /** Tavan aşıldıysa: tavanla sınırlanmış karşılık (hekim seçer, araç otomatik uygulamaz). */
  tavanli: { dozMg: number; gunlukMg: number; dozMl: number | null; dozMlYuvarlak: number | null } | null
  uyarilar: DozUyari[]
  formul: string[]
}

const yuvarla = (n: number, adim: number) => Math.round(n / adim) * adim

export function fmt(n: number, basamak = 2): string {
  const k = 10 ** basamak
  return (Math.round(n * k) / k).toLocaleString('tr-TR', { maximumFractionDigits: basamak })
}

/** Salt aritmetik. Eksik girdide null (ekranda "kilo ve mg/kg girin"). */
export function dozHesapla(g: DozGirdi): DozSonuc | null {
  const { kiloKg, mgKg } = g
  const n = Math.round(g.dozSayisi)
  if (kiloKg == null || mgKg == null || !(kiloKg > 0) || !(mgKg > 0) || !(n >= 1 && n <= 6)) return null
  const adim = g.mlAdim && g.mlAdim > 0 ? g.mlAdim : 0.1
  const gunlukMg = g.mod === 'gun' ? kiloKg * mgKg : kiloKg * mgKg * n
  const dozMg = gunlukMg / n
  const mgPerMl = g.konsantrasyon?.mgPerMl ?? null
  const ml = (mg: number) => (mgPerMl ? mg / mgPerMl : null)
  const uyarilar: DozUyari[] = []
  const formul: string[] = []
  formul.push(g.mod === 'gun'
    ? `${fmt(kiloKg)} kg × ${fmt(mgKg)} mg/kg/gün = ${fmt(gunlukMg)} mg/gün ÷ ${n} doz = ${fmt(dozMg)} mg/doz`
    : `${fmt(kiloKg)} kg × ${fmt(mgKg)} mg/kg/doz = ${fmt(dozMg)} mg/doz × ${n} doz = ${fmt(gunlukMg)} mg/gün`)
  if (mgPerMl) formul.push(`${fmt(dozMg)} mg ÷ ${fmt(mgPerMl, 3)} mg/mL (${g.konsantrasyon!.metin}) = ${fmt(dozMg / mgPerMl)} mL/doz`)

  let tavanli: DozSonuc['tavanli'] = null
  const tDoz = g.tavanDozMg && g.tavanDozMg > 0 ? g.tavanDozMg : null
  const tGun = g.tavanGunMg && g.tavanGunMg > 0 ? g.tavanGunMg : null
  if ((tDoz && dozMg > tDoz) || (tGun && gunlukMg > tGun)) {
    // Sınırlayıcı olan tavan hangisiyse (doz başı veya günlük/n) — daha küçüğü.
    const sinirDoz = Math.min(tDoz ?? Infinity, tGun ? tGun / n : Infinity, dozMg)
    const m = ml(sinirDoz)
    tavanli = { dozMg: sinirDoz, gunlukMg: sinirDoz * n, dozMl: m, dozMlYuvarlak: m == null ? null : yuvarla(m, adim) }
    if (tDoz && dozMg > tDoz) uyarilar.push({ kod: 'tavan_doz', metin: `Hesaplanan ${fmt(dozMg)} mg/doz, girdiğiniz doz başı tavanı (${fmt(tDoz)} mg) aşıyor.` })
    if (tGun && gunlukMg > tGun) uyarilar.push({ kod: 'tavan_gun', metin: `Hesaplanan ${fmt(gunlukMg)} mg/gün, girdiğiniz günlük tavanı (${fmt(tGun)} mg) aşıyor.` })
  }
  // Biçim uyarısı (klinik eşik değil): 150 kg üzeri birimsiz girişte gram / kg karışması olasılığı.
  if (kiloKg > 150) uyarilar.push({ kod: 'kilo_birim', metin: 'Kilo alışılmadık derecede yüksek — birimi (kg / gr) kontrol edin.' })
  const dozMl = ml(dozMg)
  if (dozMl != null && dozMl < adim) uyarilar.push({ kod: 'ml_kucuk', metin: `Doz başına hacim ${fmt(dozMl)} mL — seçili ölçek adımından (${fmt(adim)} mL) küçük; ölçüm aracını kontrol edin.` })
  return {
    gunlukMg, dozMg, dozMl,
    dozMlYuvarlak: dozMl == null ? null : yuvarla(dozMl, adim),
    gunlukMl: ml(gunlukMg),
    aralikSaat: 24 / n,
    tavanli, uyarilar, formul,
  }
}

/** Panoya kopyalanan tek satır — hekimin girdileri + aritmetik; "taslak, hekim onaylar". Nota otomatik yazılmaz. */
export function dozOzetMetni(g: DozGirdi, s: DozSonuc, etiket?: string): string {
  const parca = [
    etiket?.trim() ? `${etiket.trim()} —` : '',
    `${fmt(g.kiloKg!)} kg · ${fmt(g.mgKg!)} mg/kg/${g.mod === 'gun' ? 'gün' : 'doz'} · günde ${Math.round(g.dozSayisi)} doz (${fmt(s.aralikSaat, 1)} saatte bir)`,
    `→ ${fmt(s.dozMg)} mg/doz (${fmt(s.gunlukMg)} mg/gün)`,
    s.dozMl != null && g.konsantrasyon ? `· ${g.konsantrasyon.metin} → ${fmt(s.dozMlYuvarlak!, 2)} mL/doz` : '',
    s.tavanli ? `· hekim tavanı aşıldı: tavanla ${fmt(s.tavanli.dozMg)} mg/doz${s.tavanli.dozMlYuvarlak != null ? ` = ${fmt(s.tavanli.dozMlYuvarlak, 2)} mL` : ''}` : '',
  ].filter(Boolean)
  return `Doz hesabı (hekim girdisiyle, taslak — hekim onaylar): ${parca.join(' ')}`
}
