/**
 * HASTA-PORTALI-GUNLUK — "Fotoğrafla gir": read the numbers on a photo of a home device screen (blood pressure monitor,
 * glucometer, thermometer, pulse oximeter, scale). Goes through the single model gate (lib/ai/cagir.ts, task
 * 'goruntu-inceleme' — ai-model-politikasi; no model name here). The result is only a PROPOSAL: the patient confirms or
 * corrects it before anything is saved. The photo is not stored. No interpretation is asked for or returned.
 * EV-ACIL-SEKER (Kaan, 2026-11-25): a glucometer that shows "HI" / "LO" instead of a number is read as that FLAG
 * (`glukozIsaret`), never turned into a number; the patient confirms it like any other value.
 */
import { aiCagir, type AiIstemci } from '@/lib/ai/cagir'
import { jsonOnarDetay } from '@/lib/ai/jsonOnar'
import type { OlcumIsareti, OlcumTipi } from './tipler'
import { OLCUM_TANIMLARI } from './olcumler'

export const FOTO_AZAMI_BAYT = 4 * 1024 * 1024
export const FOTO_GUNLUK_SINIR = 20
const MIME = ['image/jpeg', 'image/png', 'image/webp']

export const FOTO_SISTEM = [
  'Görevin: bir ev sağlık cihazının (tansiyon aleti, şeker ölçüm cihazı, ateş ölçer, parmak ucu oksimetre, tartı) ekranındaki RAKAMLARI okumak.',
  'Yalnız ekranda açıkça görünen değerleri yaz. Tahmin etme, yorum yapma, değerlendirme yapma, öneri verme.',
  'Tansiyon aletinde genelde üstte SYS (büyük), ortada DIA (küçük), altta PUL (nabız) yazar.',
  'Şeker cihazında birim mg/dL ya da mmol/L olabilir; ekranda yazanı aynen bildir.',
  'Şeker cihazı sayı yerine "HI" ya da "LO" (veya "Hi" / "Lo") gösteriyorsa glukoz null kalsın, glukozIsaret "HI" ya da "LO" olsun; sayı uydurma.',
  'Okuyamadığın değeri null bırak. Ekran yoksa ya da rakam okunmuyorsa cihaz "bilinmiyor" olsun.',
  'Yalnız şu JSON nesnesini döndür, başka metin yazma:',
  '{"cihaz":"tansiyon|seker|ates|oksimetre|tarti|bilinmiyor","sistolik":null,"diastolik":null,"nabiz":null,"glukoz":null,"glukozBirim":"mg/dL|mmol/L|null","glukozIsaret":"HI|LO|null","ates":null,"spo2":null,"kilo":null,"guven":0.0}',
].join('\n')

/** `isaret` (glucose only): the meter showed HI / LO — then `deger` is null. */
export interface FotoOneri { tip: OlcumTipi; deger: number | null; deger2: number | null; isaret?: OlcumIsareti }
export interface FotoSonucu { oneriler: FotoOneri[]; guven: number; okunamadi: boolean }

const sayi = (x: unknown): number | null => { const n = Number(String(x ?? '').replace(',', '.')); return x === null || x === undefined || x === '' || !Number.isFinite(n) ? null : n }
const aralikta = (t: OlcumTipi, v: number | null) => v != null && v >= OLCUM_TANIMLARI[t].min && v <= OLCUM_TANIMLARI[t].max

/** Model JSON → proposals inside the catalog's plausible ranges (anything else is dropped). */
export function fotoCevabiniCoz(ham: unknown): FotoSonucu {
  const j = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const out: FotoOneri[] = []
  const sys = sayi(j.sistolik), dia = sayi(j.diastolik), nab = sayi(j.nabiz)
  if (aralikta('kb', sys) && dia != null && dia >= 30 && dia < (sys as number)) out.push({ tip: 'kb', deger: Math.round(sys as number), deger2: Math.round(dia) })
  if (aralikta('nabiz', nab)) out.push({ tip: 'nabiz', deger: Math.round(nab as number), deger2: null })
  let glu = sayi(j.glukoz)
  const gi = String(j.glukozIsaret ?? '').trim().toLowerCase()
  if (gi === 'hi' || gi === 'lo') out.push({ tip: 'glukoz', deger: null, deger2: null, isaret: gi })
  else {
    if (glu != null && String(j.glukozBirim || '').toLowerCase().includes('mmol')) glu = Math.round(glu * 18)
    if (aralikta('glukoz', glu)) out.push({ tip: 'glukoz', deger: Math.round(glu as number), deger2: null })
  }
  const ates = sayi(j.ates); if (aralikta('ates', ates)) out.push({ tip: 'ates', deger: Math.round((ates as number) * 10) / 10, deger2: null })
  const spo2 = sayi(j.spo2); if (aralikta('spo2', spo2)) out.push({ tip: 'spo2', deger: Math.round(spo2 as number), deger2: null })
  const kilo = sayi(j.kilo); if (aralikta('kilo', kilo)) out.push({ tip: 'kilo', deger: Math.round((kilo as number) * 10) / 10, deger2: null })
  const guven = Math.max(0, Math.min(1, sayi(j.guven) ?? 0))
  return { oneriler: out, guven, okunamadi: out.length === 0 }
}

export async function fotoOku(o: { base64: string; mime: string; doctorId: string; istemci?: AiIstemci; butceMs?: number }): Promise<FotoSonucu> {
  const y = await aiCagir({
    gorev: 'goruntu-inceleme', istemci: o.istemci, doctorId: o.doctorId, maxTokens: 300, jsonBekleniyor: true, butceMs: o.butceMs,
    system: [{ metin: FOTO_SISTEM, onbellek: true }],
    messages: [{ role: 'user', content: [{ type: 'text', text: 'Bu cihaz ekranındaki değerleri oku.' }, { type: 'image', source: { type: 'base64', media_type: MIME.includes(o.mime) ? o.mime : 'image/jpeg', data: o.base64 } }] }],
  })
  const metin = (y.content || []).map((b) => (b.type === 'text' ? b.text : '')).join('')
  const r = jsonOnarDetay(metin.replace(/```json\n?|\n?```/g, '').trim())
  return r.neden === 'ok' ? fotoCevabiniCoz(r.deger) : { oneriler: [], guven: 0, okunamadi: true }
}

export function fotoGirdisiDogrula(ham: { base64?: unknown; mime?: unknown }): { ok: true; base64: string; mime: string } | { ok: false; hata: string } {
  const b = typeof ham.base64 === 'string' ? ham.base64.replace(/^data:[^,]+,/, '') : ''
  const mime = typeof ham.mime === 'string' ? ham.mime : 'image/jpeg'
  if (!b || !MIME.includes(mime)) return { ok: false, hata: 'Fotoğraf okunamadı. JPEG veya PNG bir fotoğraf deneyin.' }
  if (Math.floor((b.length * 3) / 4) > FOTO_AZAMI_BAYT) return { ok: false, hata: 'Fotoğraf çok büyük.' }
  return { ok: true, base64: b, mime }
}
