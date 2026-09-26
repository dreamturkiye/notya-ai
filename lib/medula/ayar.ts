/**
 * NOTYA-ERECETE-01 — e-Reçete kimlik ayarları (Kaan, 2026-09-16: "Ayarlara bir kere girsin, uygulamadan direkt yazsın").
 *
 * SGK Medula e-reçete web servisi her istekte hekimin TC'si (kullanıcı adı) + SGK Kurumsal Hekim Şifresi ister
 * (HTTP Basic / WS-Security), ayrıca tesis kodu ve SGK branş kodu. 2016'dan beri reçete kaydı yalnız güvenli
 * e-imza ile kabul edilir; imza PIN'i işlem bazlıdır ve hiçbir yerde saklanmaz.
 * Burada saklanan: TC ve şifre encryptPII ile (users.erecete_ayar JSONB), çözme yalnız gönderim anında sunucuda.
 * Bağlantı testi: gerçek ortamda salt-okunur ereceteSorgula (kayıt açmaz, imza istemez) — kimlik doğruysa
 * SGK "reçete bulunamadı" der, yanlışsa yetki hatası döner.
 */
import { encryptPII, decryptPII } from '@/lib/security/encryption'
import type { MedulaKimlik, MedulaOrtam } from './soapIstemci'

export type ImzaYontemi = 'token' | 'mobil' | 'yok'
export type TestDurumu = 'baglandi' | 'kimlik_hatali' | 'hata'

export interface EReceteAyar {
  tesisKodu?: number | null
  bransKodu?: number | null
  doktorTcSifreli?: string | null
  sifreSifreli?: string | null
  ortam?: MedulaOrtam
  imzaYontemi?: ImzaYontemi
  sonTest?: { tarih: string; durum: TestDurumu; mesaj: string } | null
  guncelleme?: string
}

export interface EReceteAyarGirdi {
  tesisKodu?: string | number | null
  bransKodu?: string | number | null
  doktorTc?: string | null
  sifre?: string | null
  ortam?: string | null
  imzaYontemi?: string | null
}

export interface EReceteAyarGoruntu {
  tesisKodu: number | null
  bransKodu: number | null
  doktorTcMaske: string
  sifreVar: boolean
  ortam: MedulaOrtam
  imzaYontemi: ImzaYontemi
  sonTest: EReceteAyar['sonTest']
  eksikler: string[]
  hazir: boolean          // kimlik + tesis + branş tamam → bağlantı testi yapılabilir
  gonderebilir: boolean   // hazir + bağlantı doğrulanmış + e-imza yöntemi seçili → canlı gönderim (imza aracı gelince)
}

const TC_RE = /^[1-9]\d{10}$/
const TESIS_RE = /^\d{6,10}$/

export function girdiDogrula(g: EReceteAyarGirdi): string[] {
  const h: string[] = []
  if (g.doktorTc != null && g.doktorTc !== '' && !TC_RE.test(String(g.doktorTc).trim())) h.push('Hekim TC kimlik no 11 haneli olmalı.')
  if (g.tesisKodu != null && g.tesisKodu !== '' && !TESIS_RE.test(String(g.tesisKodu).trim())) h.push('Tesis kodu 6–10 haneli sayı olmalı (muayenehane için SGK\'nın verdiği kod).')
  if (g.bransKodu != null && g.bransKodu !== '' && !/^\d{3,5}$/.test(String(g.bransKodu).trim())) h.push('SGK branş kodu 3–5 haneli sayı olmalı.')
  if (g.ortam != null && g.ortam !== '' && g.ortam !== 'test' && g.ortam !== 'gercek') h.push('Ortam "test" veya "gerçek" olmalı.')
  if (g.imzaYontemi != null && g.imzaYontemi !== '' && !['token', 'mobil', 'yok'].includes(String(g.imzaYontemi))) h.push('e-imza yöntemi token, mobil veya yok olmalı.')
  if (g.sifre != null && g.sifre !== '' && String(g.sifre).length < 4) h.push('Hekim şifresi çok kısa.')
  return h
}

/** Mevcut ayar + yeni girdi → saklanacak ayar. Şifre/TC yalnız verildiyse değişir; kimlik değişince son test sıfırlanır. */
export function ayarBirlestir(mevcut: EReceteAyar | null, g: EReceteAyarGirdi): EReceteAyar {
  const a: EReceteAyar = { ...(mevcut || {}) }
  let kimlikDegisti = false
  if (g.tesisKodu != null && g.tesisKodu !== '') { const v = Number(String(g.tesisKodu).trim()); if (v !== a.tesisKodu) kimlikDegisti = true; a.tesisKodu = v }
  if (g.bransKodu != null && g.bransKodu !== '') a.bransKodu = Number(String(g.bransKodu).trim())
  if (g.doktorTc != null && g.doktorTc !== '') { a.doktorTcSifreli = encryptPII(String(g.doktorTc).trim()); kimlikDegisti = true }
  if (g.sifre != null && g.sifre !== '') { a.sifreSifreli = encryptPII(String(g.sifre)); kimlikDegisti = true }
  if (g.ortam === 'test' || g.ortam === 'gercek') a.ortam = g.ortam
  if (g.imzaYontemi === 'token' || g.imzaYontemi === 'mobil' || g.imzaYontemi === 'yok') a.imzaYontemi = g.imzaYontemi
  if (kimlikDegisti) a.sonTest = null
  a.guncelleme = new Date().toISOString()
  return a
}

export function ayarBransKodu(a: unknown): number | null {
  const v = a && typeof a === 'object' ? (a as EReceteAyar).bransKodu : null
  return typeof v === 'number' && v > 0 ? v : null
}

export function kimlikCoz(a: EReceteAyar | null): MedulaKimlik | null {
  if (!a?.doktorTcSifreli || !a.sifreSifreli || !a.tesisKodu) return null
  try {
    const tc = decryptPII(a.doktorTcSifreli)
    return { kullanici: tc, sifre: decryptPII(a.sifreSifreli), tesisKodu: a.tesisKodu, doktorTc: Number(tc) }
  } catch { return null }
}

export function ayarGoruntu(a: EReceteAyar | null): EReceteAyarGoruntu {
  let maske = ''
  if (a?.doktorTcSifreli) { try { const tc = decryptPII(a.doktorTcSifreli); maske = `${tc.slice(0, 3)}•••••${tc.slice(-3)}` } catch { maske = '•••' } }
  const eksikler: string[] = []
  if (!a?.doktorTcSifreli) eksikler.push('Hekim TC')
  if (!a?.sifreSifreli) eksikler.push('SGK hekim şifresi')
  if (!a?.tesisKodu) eksikler.push('Tesis kodu')
  if (!a?.bransKodu) eksikler.push('SGK branş kodu')
  const hazir = eksikler.length === 0
  const imza = a?.imzaYontemi || 'yok'
  return {
    tesisKodu: a?.tesisKodu ?? null, bransKodu: a?.bransKodu ?? null, doktorTcMaske: maske,
    sifreVar: !!a?.sifreSifreli, ortam: a?.ortam || 'gercek', imzaYontemi: imza, sonTest: a?.sonTest ?? null,
    eksikler, hazir, gonderebilir: hazir && a?.sonTest?.durum === 'baglandi' && imza !== 'yok',
  }
}

/** ereceteSorgula('0') cevabını kimlik testi olarak yorumlar. */
export function testSonucuYorumla(s: { sonucKodu: string; sonucMesaji: string }): { durum: TestDurumu; mesaj: string } {
  const m = s.sonucMesaji || ''
  if (/HTTP 401|HTTP 403|kullan[ıi]c[ıi] ad[ıi]|şifre|sifre|yetki|authenticat|unauthori/i.test(m)) return { durum: 'kimlik_hatali', mesaj: 'SGK kimliği reddetti — TC, hekim şifresi veya tesis kodu hatalı.' }
  if (s.sonucKodu === 'PARSE' || /HTTP 5\d\d|ECONN|fetch failed|timeout/i.test(m)) return { durum: 'hata', mesaj: `SGK'ya ulaşılamadı: ${m.slice(0, 160)}` }
  return { durum: 'baglandi', mesaj: `Bağlantı doğrulandı — SGK cevabı: ${m.slice(0, 160) || s.sonucKodu}` }
}
