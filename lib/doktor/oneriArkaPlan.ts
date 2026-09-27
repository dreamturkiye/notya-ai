/**
 * NOTYA-NOT-HIZ-03 — Ayşe'nin önerisi (B çağrısı) kritik yolda değil.
 *
 * Canlı ölçüm (2026-09-27, QA, 4 dk AOM transkripti): not 54-55 sn sürdü; B tavana çarpıyor, not onu bekliyordu. Artık
 * sessions/end ve ses-yukle notu gövde (A) hazır olur olmaz kaydedip yanıt döner; B arka planda (waitUntil) sürer ve
 * bittiğinde yalnız o notun öneri sütunlarını doldurur:
 *   - HASTA-IZOLASYON-01: her yazma not id + doktor id ile kapsanır.
 *   - Hekimin eli değmiş hiçbir sütun ezilmez: recete_onerisi / kritik_bulgular / alarm_bulgulari / hasta_ozeti yalnız
 *     hâlâ boşsa (NULL) yazılır; ai_degerlendirme (çek listesi bloğunu zaten taşır) okunduğu hâliyle duruyorsa öneri
 *     metni sonuna eklenir.
 *   - B düşerse sütunlar boş kalır; log yalnız hata sınıfı (model çıktısı / transkript asla).
 * Not gövdesine hiçbir şey yazılmaz — öneri yalnız doktora görünen alanlardadır.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SoapOnerisi } from '@/lib/doktor/soapUret'

/** Yanıt döndükten sonra sözü canlı tutar (Vercel aksi hâlde fonksiyonu dondurur). Yerelde söz zaten sürer. */
export function arkaPlandaSurdur(p: Promise<unknown>): void {
  try {
    const mod = require('@vercel/functions') as { waitUntil?: (x: Promise<unknown>) => void }
    if (mod.waitUntil) mod.waitUntil(p)
    else void p
  } catch { void p }
}

function hataSinifi(e: unknown): string {
  const h = (e && typeof e === 'object' ? e : {}) as { name?: unknown; code?: unknown; status?: unknown }
  return [typeof h.name === 'string' ? h.name : 'Hata', typeof h.code === 'string' ? h.code : null, typeof h.status === 'number' ? h.status : null]
    .filter((x) => x != null).join(' ').replace(/[^A-Za-z0-9_ ]/g, '').slice(0, 80)
}

const doluDizi = (v: unknown): v is unknown[] => Array.isArray(v) && v.length > 0
const doluMetin = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

export interface OneriYazGirdi {
  noteId: string
  doktorId: string
  oneri: SoapOnerisi
  /** ai_degerlendirme'ye eklenmeden önce öneri metnine uygulanır (sessions/end: çek listesi bloğu silinir). */
  aiMetni?: (ai: string) => string
}

/** Öneriyi nota yazar; yazılan sütunların adlarını döndürür. */
export async function oneriyiNotaYaz(sb: SupabaseClient, g: OneriYazGirdi): Promise<string[]> {
  const yazilan: string[] = []
  const sutunlar: [string, unknown][] = [
    ['recete_onerisi', doluDizi(g.oneri.receteOnerisi) ? g.oneri.receteOnerisi : null],
    ['kritik_bulgular', doluDizi(g.oneri.kritik_bulgular) ? g.oneri.kritik_bulgular : null],
    ['alarm_bulgulari', doluDizi(g.oneri.alarmBulgulari) ? g.oneri.alarmBulgulari : null],
    ['hasta_ozeti', doluMetin(g.oneri.hasta_ozeti) ? g.oneri.hasta_ozeti.trim() : null],
  ]
  for (const [sutun, deger] of sutunlar) {
    if (deger == null) continue
    const { data, error } = await sb.from('notes').update({ [sutun]: deger })
      .eq('id', g.noteId).eq('doctor_id', g.doktorId).is(sutun, null).select('id')
    if (error) throw Object.assign(new Error('öneri sütunu yazılamadı'), { name: 'OneriYazmaHatasi', code: (error as { code?: string }).code })
    if (Array.isArray(data) && data.length) yazilan.push(sutun)
  }

  const ai = doluMetin(g.oneri.aiDegerlendirme) ? (g.aiMetni ? g.aiMetni(g.oneri.aiDegerlendirme) : g.oneri.aiDegerlendirme).trim() : ''
  if (ai) {
    const { data: satir, error } = await sb.from('notes').select('ai_degerlendirme').eq('id', g.noteId).eq('doctor_id', g.doktorId).maybeSingle()
    if (error) throw Object.assign(new Error('not okunamadı'), { name: 'OneriYazmaHatasi', code: (error as { code?: string }).code })
    if (satir) {
      const mevcut = (satir as { ai_degerlendirme?: string | null }).ai_degerlendirme ?? null
      const yeni = [String(mevcut || '').trim(), ai].filter(Boolean).join('\n\n')
      let q = sb.from('notes').update({ ai_degerlendirme: yeni }).eq('id', g.noteId).eq('doctor_id', g.doktorId)
      q = mevcut == null ? q.is('ai_degerlendirme', null) : q.eq('ai_degerlendirme', mevcut)
      const { data, error: e2 } = await q.select('id')
      if (e2) throw Object.assign(new Error('ai_degerlendirme yazılamadı'), { name: 'OneriYazmaHatasi', code: (e2 as { code?: string }).code })
      if (Array.isArray(data) && data.length) yazilan.push('ai_degerlendirme')
    }
  }
  return yazilan
}

/**
 * Rotaların tek çağrısı: öneri sözü bittiğinde nota yazar, sözü waitUntil ile canlı tutar. Asla fırlatmaz.
 * Döndürülen söz yalnız testler içindir.
 */
export function oneriyiArkaPlandaYaz(
  sb: SupabaseClient,
  g: Omit<OneriYazGirdi, 'oneri'> & { oneriSozu: Promise<SoapOnerisi | null>; etiket: string },
): Promise<void> {
  const baslangic = Date.now()
  const is = g.oneriSozu.then(async (oneri) => {
    if (!oneri) { console.warn(`[${g.etiket}] öneri yok, not öneri alanları boş kaldı`); return }
    const yazilan = await oneriyiNotaYaz(sb, { noteId: g.noteId, doktorId: g.doktorId, oneri, aiMetni: g.aiMetni })
    console.info(`[${g.etiket}] öneri nota yazıldı (+${Math.round((Date.now() - baslangic) / 1000)} sn): ${yazilan.join(', ') || 'yok'}`)
  }).catch((e) => { console.error(`[${g.etiket}] öneri nota yazılamadı: ${hataSinifi(e)}`) })
  arkaPlandaSurdur(is)
  return is
}
