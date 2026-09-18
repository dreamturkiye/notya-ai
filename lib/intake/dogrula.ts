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

export type IntakeHataSebebi = 'zorunlu' | 'desen'
export interface IntakeHata { alan: IntakeAlan; sebep: IntakeHataSebebi }

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

/** İlk kural ihlalini döndürür; form geçerliyse null. */
export function intakeIlkHata(bolumler: IntakeBolum[], yanitlar: Record<string, unknown>, nowMs = Date.now()): IntakeHata | null {
  for (const bolum of intakeGorunurBolumler(bolumler, yanitlar, nowMs)) {
    for (const alan of bolum.alanlar) {
      if (alan.tur === 'bolum-basligi') continue
      if (!intakeAlanGorunur(alan, yanitlar)) continue
      const deger = yanitlar[alan.id]
      if (bosMu(deger)) {
        if (alan.zorunlu) return { alan, sebep: 'zorunlu' }
        continue // boş + isteğe bağlı: desen kontrolü yapılmaz
      }
      if (alan.desen && !new RegExp(alan.desen).test(String(deger))) return { alan, sebep: 'desen' }
    }
  }
  return null
}

/** Sunucu (API) mesajı — mevcut 400 gövdeleriyle birebir aynı metin. */
export function intakeSunucuHataMetni(bolumler: IntakeBolum[], yanitlar: Record<string, unknown>, nowMs = Date.now()): string | null {
  const h = intakeIlkHata(bolumler, yanitlar, nowMs)
  if (!h) return null
  return h.sebep === 'zorunlu'
    ? `"${h.alan.etiket}" alani zorunludur.`
    : h.alan.desenHata || `"${h.alan.etiket}" alani gecersiz.`
}

/** Hastaya gösterilen istemci mesajı (tam Türkçe — form ekranında okunuyor). */
export function intakeIstemciHataMetni(bolumler: IntakeBolum[], yanitlar: Record<string, unknown>, nowMs = Date.now()): string | null {
  const h = intakeIlkHata(bolumler, yanitlar, nowMs)
  if (!h) return null
  return h.sebep === 'zorunlu'
    ? `Lütfen "${h.alan.etiket}" alanını doldurun.`
    : h.alan.desenHata || `"${h.alan.etiket}" alanı geçersiz.`
}
