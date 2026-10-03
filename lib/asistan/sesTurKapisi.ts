/**
 * NOTYA-SES-ARKA-01 — LLM öncesi ses tur kapısı (maliyet/hız: model çağrılmaz).
 *
 * Dr. Gökhan canlı (2026-10-03): açık mik + arkadan konuşma → aynı klinik yanıt üst üste;
 * Ayşe bile "yeni bilgi yokken tekrar etmem / arka planı istek saymam" dedi.
 *
 * Kapı (sıra):
 *   1. Açık tekrar isteği ("tekrar et", "yine anlat") → MODEL (beyaz liste)
 *   2. Asistanı/Ayşe kapat / veda → VEDA (end_call; model yok)
 *   3. Son ses sorusunun birebir/bulanık tekrarı, yeni bilgi yok → SESSİZ
 *   4. Son asistan cevabının eko/transcript geri yansıması → SESSİZ
 *   5. İstek izi taşımayan kısa arka plan konuşması → SESSİZ
 *   6. Aksi → MODEL
 *
 * Pause ("...", "eee") buraya girmez — NOTYA-SES-ESKI-02 EL'de modele gider.
 */

import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { sesGurultusuMu } from '@/lib/asistan/sesGurultu'
import { asistaniKapatMi } from '@/lib/asistan/uyandirSoz'
import { devamIstegiMi } from '@/lib/asistan/konusma'
import { sesOnayMetniGecerliMi, sesVazgecMetniMi } from '@/core/eylemler/sesKapilari'
import { netSosyalMi } from '@/lib/ai/modeller'

export type SesTurKararTipi = 'model' | 'sessiz' | 'veda' | 'devam_oku'
export type SesTurKarari = { tip: SesTurKararTipi; neden: string }

type TurMesaj = { role?: string; content?: unknown; kanal?: string }

const DOLGU = new Set([
  'peki', 'hocam', 'acaba', 'ya', 'bir', 'de', 'da', 'e', 'ee', 'o', 've', 'ile', 'icin',
  'lütfen', 'lutfen', 'tamam', 'iyi', 'simdi', 'benim', 'bizim', 'ki', 'misin', 'misiniz',
  'soyle', 'soyler', 'bakar', 'bakalim', 'ayse', 'asistan', 'asistanim', 'asistanı',
])

/** Doktor bilinçli tekrar ister — duplicate kapısı uygulanmaz. */
export function tekrarIstegiMi(mesaj: string): boolean {
  const n = ` ${trAramaNormalize(String(mesaj || ''))} `
  if (n.length < 8) return false
  return /\b(tekrar\s+(et|oku|anlat|soyle)|yine\s+(anlat|oku|soyle|et)|bir\s+daha\s+(soyle|anlat|oku|et)|yeniden\s+(anlat|oku|soyle)|tekrarlar\s*misin|bir\s+kere\s+daha)\b/.test(n)
}

function metin(icerik: unknown): string {
  if (typeof icerik === 'string') return icerik
  if (Array.isArray(icerik)) {
    return icerik.map((p) => (p && typeof p === 'object' && typeof (p as { text?: unknown }).text === 'string' ? (p as { text: string }).text : '')).join(' ')
  }
  return ''
}

function sozNorm(s: string): string {
  return String(s || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr-TR')
}

function tokenler(s: string): string[] {
  return trAramaNormalize(s)
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !DOLGU.has(w))
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const A = new Set(a)
  const B = new Set(b)
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  return inter / (A.size + B.size - inter)
}

function kapsar(a: string[], b: string[]): number {
  if (!b.length) return 0
  let hit = 0
  const A = new Set(a)
  for (const x of b) if (A.has(x)) hit++
  return hit / b.length
}

/** Son cevaplanmış SES doktor sorusu + o cevap. */
export function sonSesCift(oturum: TurMesaj[]): { soru: string; cevap: string } | null {
  for (let i = oturum.length - 1; i >= 0; i--) {
    if (oturum[i]?.role !== 'user') continue
    const soru = metin(oturum[i].content).replace(/\s+/g, ' ').trim()
    if (!soru || devamIstegiMi(soru) || sesGurultusuMu(soru)) continue
    const cevap = oturum.slice(i + 1).find((m) => m.role === 'assistant' && metin(m.content).trim())
    if (!cevap || oturum[i].kanal !== 'ses') continue
    return { soru, cevap: metin(cevap.content).replace(/\s+/g, ' ').trim() }
  }
  return null
}

/** Mikrofon, hoparlörden gelen Ayşe cevabını doktor sanır. */
export function sonCevapEkoMu(mesaj: string, sonCevap: string): boolean {
  const u = tokenler(mesaj)
  const a = tokenler(sonCevap)
  if (u.length < 4 || a.length < 6) return false
  const kaps = kapsar(a, u)
  const jac = jaccard(u, a)
  // Kullanıcı tokenlerinin çoğu son cevapta → eko / kendi TTS yansıması
  if (kaps >= 0.72 && u.length >= 4) return true
  if (jac >= 0.45 && u.length >= 6 && kaps >= 0.55) return true
  const un = sozNorm(mesaj)
  const an = sozNorm(sonCevap)
  if (un.length >= 40 && an.includes(un.slice(0, Math.min(80, un.length)))) return true
  return false
}

/** Aynı istek, anlamlı yeni bilgi yok (bulanık). */
export function ayniIstekYeniBilgiYokMu(mesaj: string, sonSoru: string): boolean {
  if (tekrarIstegiMi(mesaj)) return false
  const a = tokenler(mesaj)
  const b = tokenler(sonSoru)
  if (a.length < 2 || b.length < 2) return false
  const na = sozNorm(mesaj)
  const nb = sozNorm(sonSoru)
  if (na === nb) return true
  const jac = jaccard(a, b)
  if (jac >= 0.78) return true
  if (kapsar(b, a) >= 0.9 && a.length <= b.length + 2) return true
  if (kapsar(a, b) >= 0.9 && b.length <= a.length + 2) return true
  // Yeni anlamlı token yoksa (sayı / ≥5 harf klinik-ish) ve yüksek örtüşme
  const yeni = a.filter((t) => !b.includes(t) && (t.length >= 5 || /^\d/.test(t)))
  if (jac >= 0.55 && yeni.length === 0) return true
  return false
}

/**
 * İstek izi taşımayan kısa / parçalı konuşma — odadaki üçüncü şahıs veya TV.
 * Hasta adı + soru / komut / Ayşe hitabı varsa MODEL'e bırakır.
 */
/** Kart onayı / ret / kısa sosyal — asla arka plan sayılmaz. */
export function bilinenKisaTurMu(mesaj: string): boolean {
  return sesOnayMetniGecerliMi(mesaj) || sesVazgecMetniMi(mesaj) || netSosyalMi(mesaj)
}

export function arkaPlanIstekDegilMi(mesaj: string): boolean {
  const ham = String(mesaj || '').trim()
  if (!ham || sesGurultusuMu(ham) || tekrarIstegiMi(ham)) return false
  if (asistaniKapatMi(ham) || bilinenKisaTurMu(ham)) return false
  if (ham.length > 120) return false
  const n = ` ${trAramaNormalize(ham)} `
  const istek =
    /\b(ayse|asistan|asistanim|oku|goster|anlat|soyle|listele|ozet|kac|nedir|nasil|dosya|dosyaya|lab|tahlil|asi|randevu|hasta|ac|kapat|tekrar|devam|son|onceki|bugun|yarin|demir|hb|ferritin|hemoglobin|recete|ilac|muayene|vizit|kilo|boy|ates|evet|hayir|alerji|ekle|gir|kaydet|yaz|sil|guncelle|buyume|buyumesi|persentil)\b/.test(n)
    || /\?/.test(ham)
    || /\b(mi|mı|mu|mü|misin|misiniz|musun|musunuz)\b/i.test(ham)
  if (istek) return false
  const t = tokenler(ham)
  // İki+ büyük harfle başlayan sözcük → olası hasta adı; modele bırak
  const ozelAd = (ham.match(/\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}\b/g) || []).length >= 2
  if (ozelAd) return false
  return t.length <= 6
}

export function sesTurKapisi(opts: {
  mesaj: string
  oturumMesajlari: TurMesaj[]
}): SesTurKarari {
  const mesaj = String(opts.mesaj || '').replace(/\s+/g, ' ').trim()
  if (!mesaj) return { tip: 'sessiz', neden: 'bos' }
  // Pause / filler: EL'de modele bırak (SES-ESKI-02) — kapı dokunmaz
  if (sesGurultusuMu(mesaj)) return { tip: 'model', neden: 'duraklama_el' }

  if (tekrarIstegiMi(mesaj)) return { tip: 'model', neden: 'tekrar_istegi' }
  if (asistaniKapatMi(mesaj)) return { tip: 'veda', neden: 'asistan_kapat' }
  // "devam et" with nothing left is an ordinary model turn (SES-DEVAM-01)
  if (devamIstegiMi(mesaj)) return { tip: 'model', neden: 'devam_istegi' }
  // Evet / Hayır / teşekkür — duplicate/arka-plan kapısından önce modele (kart omurgası)
  if (bilinenKisaTurMu(mesaj)) return { tip: 'model', neden: 'kisa_tur' }

  const cift = sonSesCift(opts.oturumMesajlari || [])
  if (cift) {
    if (sonCevapEkoMu(mesaj, cift.cevap)) return { tip: 'sessiz', neden: 'eko_tts' }
    const ayni = sozNorm(mesaj) === sozNorm(cift.soru)
    if (ayni || ayniIstekYeniBilgiYokMu(mesaj, cift.soru)) {
      return ayni ? { tip: 'devam_oku', neden: 'birebir_tekrar' } : { tip: 'sessiz', neden: 'ayni_istek' }
    }
  }

  if (arkaPlanIstekDegilMi(mesaj)) return { tip: 'sessiz', neden: 'arka_plan' }

  return { tip: 'model', neden: 'istek' }
}
