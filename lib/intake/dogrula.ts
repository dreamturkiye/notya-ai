/**
 * NOTYA-INTAKE-08 — hasta bilgi formu yanıt doğrulaması (TEK kaynak, istemci + sunucu).
 *
 * Zorunluluk ve desen kuralları yalnızca alan şemasından (coreAlanlar.ts / bransSorulari.ts)
 * okunur. Ayrı bir "şu alanlar zorunlu" listesi bilerek YOK: şemadaki `zorunlu` bayrağı
 * değişince hem kırmızı yıldız hem de iki taraftaki doğrulama tek hamlede değişsin diye.
 * Dr. Gökhan'ın bildirdiği hata tam olarak bu ayrışmadan çıkmıştı — ipucu metni "yoksa boş
 * bırakabilirsin" diyordu ama bayrak alanı zorunlu tutuyordu.
 */
import type { IntakeAlan, IntakeBolum } from './coreAlanlar'
import { veliOnamGerekliMi } from '@/lib/specialties/kapsam'

export type IntakeHataSebebi = 'zorunlu' | 'desen' | 'bicim'
export interface IntakeHata { alan: IntakeAlan; sebep: IntakeHataSebebi; mesaj?: string }

/**
 * NOTYA-BETA-0925 (Dr. Gökhan): form tarayıcının İngilizce doğrulamasını gösteriyordu ("Please include an @ in the
 * email address"). Sayfa artık noValidate; alan türünden gelen biçim kuralları (e-posta, telefon, tarih) burada, Türkçe.
 */
export const INTAKE_MESAJ = {
  zorunluMetin: 'Lütfen bu alanı doldurun.',
  zorunluSecim: 'Lütfen bir seçim yapın.',
  eposta: 'Lütfen geçerli bir e-posta adresi yazın (örnek: ad@ornek.com).',
  telefon: 'Lütfen geçerli bir telefon numarası yazın (örnek: 0532 123 45 67; yurt dışı için +1 202 555 0143).',
  tarih: 'Lütfen geçerli bir tarih seçin (gün.ay.yıl).',
  tarihGelecek: 'Tarih bugünden sonra olamaz.',
  tarihEski: 'Lütfen 1900 yılından sonraki bir tarih seçin.',
} as const

/** Türden gelen biçim hatası (boş değer için çağrılmaz). null = geçerli. */
export function intakeBicimHatasi(alan: IntakeAlan, deger: unknown, nowMs = Date.now()): string | null {
  const t = String(deger ?? '').trim()
  if (alan.tur === 'email') {
    return /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:".]{2,}$/.test(t) ? null : INTAKE_MESAJ.eposta
  }
  if (alan.tur === 'tel') {
    const rakam = t.replace(/\D/g, '')
    return /^[0-9+()\-.\s]+$/.test(t) && rakam.length >= 10 && rakam.length <= 15 ? null : INTAKE_MESAJ.telefon
  }
  if (alan.tur === 'date') {
    const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) return INTAKE_MESAJ.tarih
    const d = new Date(`${t}T12:00:00Z`)
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== t) return INTAKE_MESAJ.tarih
    if (Number(m[1]) < 1900) return INTAKE_MESAJ.tarihEski
    const bugun = new Date(nowMs + 3 * 3_600_000).toISOString().slice(0, 10) // TRT
    if (t > bugun) return INTAKE_MESAJ.tarihGelecek
  }
  return null
}

function bosMu(deger: unknown): boolean {
  if (deger === undefined || deger === null) return true
  if (Array.isArray(deger)) return deger.length === 0
  return String(deger).trim() === ''
}

/** Conditional fields (gosterEger) are validated only when visible. Works for radio string or checkbox-grup array. */
export function intakeAlanGorunur(alan: IntakeAlan, yanitlar: Record<string, unknown>): boolean {
  if (alan.tur === 'bolum-basligi') return true
  const k = alan.gosterEger
  if (!k) return true
  const v = yanitlar[k.alanId]
  if (Array.isArray(v)) return v.map(String).includes(k.deger)
  return String(v ?? '') === k.deger
}

/**
 * Bölüm görünür mü? VELI-YASAL-ONAM: veliKosulu olan bölüm (Veli / Yasal Temsilci) yalnız formdaki doğum tarihine göre
 * reşit olmayan hastada — karar kapsam.ts → veliOnamGerekliMi (tek yaş kuralı, burada yeniden yazılmaz). Doğum tarihi
 * boş / geçersizken false: bölüm, tarih girilince belirir (gebelik haftası gibi sıra bağımlı alanlarla aynı desen).
 */
export function intakeBolumGorunur(bolum: IntakeBolum, yanitlar: Record<string, unknown>, nowMs = Date.now()): boolean {
  const k = bolum.veliKosulu
  if (!k) return true
  const dogum = yanitlar[k.dogumAlanId]
  return typeof dogum === 'string' && veliOnamGerekliMi(dogum, nowMs)
}

/** Formda şu an görünen bölümler (web formu numarayı buna göre verir, doğrulama bunlara bakar). */
export function intakeGorunurBolumler(bolumler: IntakeBolum[], yanitlar: Record<string, unknown>, nowMs = Date.now()): IntakeBolum[] {
  return bolumler.filter((b) => intakeBolumGorunur(b, yanitlar, nowMs))
}

/**
 * Görünmeyen alanların yanıtlarını atar (bu bölümlerde tanımlı olmayan anahtarlara dokunmaz). Doğum tarihi erişkine
 * düzeltilirse daha önce yazılmış veli bilgisi kaydedilmez — erişkin hastanın formunda veli izi kalmaz.
 */
export function intakeGorunmeyenYanitlariAyikla(bolumler: IntakeBolum[], yanitlar: Record<string, unknown>, nowMs = Date.now()): Record<string, unknown> {
  const sonuc = { ...yanitlar }
  for (const bolum of bolumler) {
    const bolumGorunur = intakeBolumGorunur(bolum, yanitlar, nowMs)
    for (const alan of bolum.alanlar) {
      if (alan.tur === 'bolum-basligi') continue
      if (!bolumGorunur || !intakeAlanGorunur(alan, yanitlar)) delete sonuc[alan.id]
    }
  }
  return sonuc
}

export function intakeGosterEgerUyuyor(deger: unknown, beklenen: string): boolean {
  if (Array.isArray(deger)) return deger.map(String).includes(beklenen)
  return String(deger ?? '') === beklenen
}

/** Görünen her alanın kural ihlali, formdaki sırayla. */
export function intakeTumHatalar(bolumler: IntakeBolum[], yanitlar: Record<string, unknown>, nowMs = Date.now()): IntakeHata[] {
  const hatalar: IntakeHata[] = []
  for (const bolum of intakeGorunurBolumler(bolumler, yanitlar, nowMs)) {
    for (const alan of bolum.alanlar) {
      if (alan.tur === 'bolum-basligi') continue
      if (!intakeAlanGorunur(alan, yanitlar)) continue
      const deger = yanitlar[alan.id]
      if (bosMu(deger)) {
        if (alan.zorunlu) hatalar.push({ alan, sebep: 'zorunlu' })
        continue // boş + isteğe bağlı: desen kontrolü yapılmaz
      }
      if (alan.desen && !new RegExp(alan.desen).test(String(deger))) { hatalar.push({ alan, sebep: 'desen' }); continue }
      const bicim = intakeBicimHatasi(alan, deger, nowMs)
      if (bicim) hatalar.push({ alan, sebep: 'bicim', mesaj: bicim })
    }
  }
  return hatalar
}

/** İlk kural ihlalini döndürür; form geçerliyse null. */
export function intakeIlkHata(bolumler: IntakeBolum[], yanitlar: Record<string, unknown>, nowMs = Date.now()): IntakeHata | null {
  return intakeTumHatalar(bolumler, yanitlar, nowMs)[0] ?? null
}

/** Alanın altında gösterilen Türkçe satır. */
export function intakeAlanHataMetni(h: IntakeHata): string {
  if (h.sebep === 'zorunlu') return h.alan.tur === 'radio' || h.alan.tur === 'checkbox-grup' || h.alan.tur === 'select' ? INTAKE_MESAJ.zorunluSecim : INTAKE_MESAJ.zorunluMetin
  if (h.sebep === 'desen') return h.alan.desenHata || `"${h.alan.etiket}" alanı geçersiz.`
  return h.mesaj || `"${h.alan.etiket}" alanı geçersiz.`
}

/** Hasta formu için alan kimliği → Türkçe satır (yalnız hatalı alanlar). */
export function intakeAlanHatalari(bolumler: IntakeBolum[], yanitlar: Record<string, unknown>, nowMs = Date.now()): Record<string, string> {
  return Object.fromEntries(intakeTumHatalar(bolumler, yanitlar, nowMs).map((h) => [h.alan.id, intakeAlanHataMetni(h)]))
}

/** Sunucu (API) mesajı — mevcut 400 gövdeleriyle birebir aynı metin. */
export function intakeSunucuHataMetni(bolumler: IntakeBolum[], yanitlar: Record<string, unknown>, nowMs = Date.now()): string | null {
  const h = intakeIlkHata(bolumler, yanitlar, nowMs)
  if (!h) return null
  if (h.sebep === 'zorunlu') return `"${h.alan.etiket}" alanı zorunludur.`
  if (h.sebep === 'bicim') return h.mesaj || `"${h.alan.etiket}" alanı geçersiz.`
  return h.alan.desenHata || `"${h.alan.etiket}" alanı geçersiz.`
}

/** Hastaya gösterilen istemci mesajı (tam Türkçe — form ekranında okunuyor). */
export function intakeIstemciHataMetni(bolumler: IntakeBolum[], yanitlar: Record<string, unknown>, nowMs = Date.now()): string | null {
  const h = intakeIlkHata(bolumler, yanitlar, nowMs)
  if (!h) return null
  return h.sebep === 'zorunlu' ? `Lütfen "${h.alan.etiket}" alanını doldurun.` : intakeAlanHataMetni(h)
}
