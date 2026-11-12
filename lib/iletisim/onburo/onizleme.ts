/**
 * WHATSAPP-ONBURO-01 — the settings card's test box: "a patient writes this — what would Ayşe do?". Nothing is sent and
 * nothing is stored. It runs the SAME rules and the same answer function as the live handler (isle.ts → bilgi.ts) for a
 * first message of a known patient who has no upcoming appointment; the times shown are real free times of the calendar.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { kuralNiyeti } from '@/lib/iletisim/whatsapp/niyet'
import { ayarGetir, musaitSlotlar } from '@/lib/randevu/v2/sunucu'
import { PORTAL_TURLERI } from '@/lib/randevu/v2/ayar'
import type { OnBuroAyari } from './ayar'
import { bilgiYaniti, type BilgiModeli } from './bilgi'
import { ON_BURO_SAAT_DILIMI } from './dil/aktif'
import type { OnBuroDili } from './dil/tipler'
import { slotSec } from './slot'
import { ONERI_PAYI_DK } from './sunucu'

export type OnizlemeTuru = 'yanit' | 'randevu' | 'acil' | 'tibbi' | 'bekleme' | 'mevcut_akis' | 'sessiz'

export interface Onizleme {
  tur: OnizlemeTuru
  /** What the patient would receive; null when Ayşe would not write anything herself. */
  yanit: string | null
  /** Sheet keys the answer came from. */
  alanlar: string[]
  kaynak: 'kural' | 'model' | null
}

export async function onBuroOnizleme(
  sb: SupabaseClient,
  g: { doktorId: string; metin: string; ayar: OnBuroAyari; dil: OnBuroDili; turetilmisSaatler: string; model?: BilgiModeli | null; modelIzni?: () => Promise<boolean>; simdi?: Date },
): Promise<Onizleme> {
  const { dil, ayar } = g
  const simdi = g.simdi ?? new Date()
  const metin = String(g.metin || '').trim().slice(0, 600)
  const bos: Onizleme = { tur: 'sessiz', yanit: null, alanlar: [], kaynak: null }
  if (!metin) return bos
  const kural = kuralNiyeti(metin)
  if (kural?.niyet === 'vazgec') return { ...bos, tur: 'mevcut_akis' }
  if (dil.acilMi(metin)) return ayar.yanitAcik ? { tur: 'acil', yanit: dil.metin.acil, alanlar: [], kaynak: null } : { ...bos, tur: 'mevcut_akis' }
  if (ayar.randevuModu !== 'kapali' && dil.randevuNiyeti(metin) === 'istek') {
    const rAyar = await ayarGetir(sb, g.doktorId)
    const tur = [dil.ziyaretTuru(metin), 'muayene' as const, ...PORTAL_TURLERI].find((t) => t && rAyar.turler[t]?.acik) || null
    const slotlar = tur ? await musaitSlotlar(sb, g.doktorId, rAyar, rAyar.turler[tur].sure, simdi.getTime() + ONERI_PAYI_DK * 60_000) : null
    const { secilen, tercihKarsilandi } = slotlar ? slotSec({ slotlar, tercih: dil.tercih(metin, simdi, ON_BURO_SAAT_DILIMI) }) : { secilen: [], tercihKarsilandi: true }
    if (!secilen.length) return { tur: 'randevu', yanit: dil.metin.slotYok, alanlar: [], kaynak: null }
    const oneri = dil.metin.oneri(secilen.map((s) => dil.zamanEtiketi(s.bas, ON_BURO_SAAT_DILIMI)), ayar.randevuModu !== 'otomatik')
    return { tur: 'randevu', yanit: tercihKarsilandi ? oneri : `${dil.metin.tercihYok}\n${oneri}`, alanlar: [], kaynak: null }
  }
  if (kural && (kural.niyet === 'onay' || kural.niyet === 'iptal' || kural.niyet === 'yeniden_planla')) return { ...bos, tur: 'mevcut_akis' }
  if (dil.secim(metin)) return { ...bos, tur: 'mevcut_akis' }
  if (!ayar.yanitAcik) return bos
  if (!dil.tibbiMi(metin) && !dil.bilgiAlanlari(metin).length && !dil.soruMu(metin)) return bos
  const y = await bilgiYaniti({ soru: metin, bilgi: ayar.bilgi, turetilmisSaatler: g.turetilmisSaatler, dil, model: g.model, modelIzni: g.modelIzni })
  if (y.tur === 'yanit') return { tur: 'yanit', yanit: y.metin, alanlar: y.alanlar, kaynak: y.kaynak }
  return { tur: y.tur === 'cevapsiz' ? 'bekleme' : y.tur, yanit: y.metin, alanlar: [], kaynak: null }
}
