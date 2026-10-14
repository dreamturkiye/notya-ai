/**
 * KBB-GORUNTU-OKUMA-01 — Belge Tier A (Asistana raporla) → KBB dual-sign okuma taslağı. Pure.
 * Kaynak: Belge kasasındaki analiz (belge_analizleri) VEYA KBB › Görüntü'deki hasta_goruntulemeler satırı.
 * Own fields, own vocabulary, own exam structure — reuses only the generic plumbing (Tier A model
 * call, confidence cap shape, dual-sign state machine), never dermatoloji's or göz's prompt/fields.
 * Otoskopi draft text reuses the SAME TM/dış kulak vocabulary engines/otoskopi.ts already sources to
 * TKBBD (not a second, divergent vocabulary). Nazoendoskopi/laringoskopi follow the LITFL-sourced exam
 * sequence (burun boşluğu → nazofarinks → orofarinks/hipofarinks → supraglottis → glottis) — see
 * protocols/sources.ts. TANI YAZILMAZ: model bulguları "olası bulgu" olarak, tanı değil diye etiketlenir.
 */
import type { BelgeRaporu } from '@/core/belgeler/types'
import { KBB_GORUNTU_DISCLAIMER, modaliteTarafliMi, type KbbGoruntuModalite } from './dualSign'

/** Belge ontolojisi modalitesi ('otoskopi' | 'endoskopi') → KBB görüntü modalitesi. Endoskopi, naso/larinks tarafı
 * hekimin seçtiği `taraf`/alan bilgisinden ayrıştırılır (asistana_raporla çağrısında caller belirtir). */
export function belgeModaliteKbb(m: string | null | undefined, endoskopiAlani?: 'nazoendoskopi' | 'laringoskopi'): KbbGoruntuModalite | null {
  if (m === 'otoskopi') return 'otoskopi'
  if (m === 'endoskopi') return endoskopiAlani ?? 'nazoendoskopi'
  return null
}

/** Tek kulak fotoğrafı (ışık yansıması / açı sorunu) güven üst sınırı — TM'nin TAMAMI görünmüyorsa taslak abartılı güven taşımasın. */
export const TEK_GORUNUM_UST = 70

export function guvenUst(capPct: number | null | undefined, tekGorunum: boolean): number {
  const cap = capPct != null && Number.isFinite(Number(capPct)) ? Math.max(0, Math.min(100, Number(capPct))) : TEK_GORUNUM_UST
  return tekGorunum ? Math.min(cap, TEK_GORUNUM_UST) : cap
}

export function kopruTarafDogrula(modalite: KbbGoruntuModalite, taraf: unknown): { ok: true; taraf: 'sag' | 'sol' | 'iki' | null } | { ok: false; hata: string } {
  if (!modaliteTarafliMi(modalite)) return { ok: true, taraf: null }
  if (taraf === 'sag' || taraf === 'sol' || taraf === 'iki') return { ok: true, taraf }
  return { ok: false, hata: 'Otoskopi için kulak seçin: sağ, sol veya iki.' }
}

export function analizKopruyeUygun(durum: string | null | undefined, rapor: BelgeRaporu | null | undefined): { ok: true } | { ok: false; hata: string } {
  if (!rapor || durum === 'hata') return { ok: false, hata: 'Asistan analizi yok veya hata ile bitti — KBB › Görüntü’de bulgu kontrol listesi taslağı kullanın.' }
  if (durum === 'kalite_dusuk' || rapor.kalite === 'dusuk') return { ok: false, hata: 'Görüntü kalitesi düşük — bulgu taslağı aktarılmaz; yeniden çekim önerilir.' }
  return { ok: true }
}

const MOD_AD: Record<KbbGoruntuModalite, string> = { otoskopi: 'Otoskopi', nazoendoskopi: 'Nazoendoskopi', laringoskopi: 'Laringoskopi' }
/** LITFL-sourced exam sequence, used only as the TEMPLATE scaffold text, never as fabricated findings. */
const MUAYENE_SIRASI: Record<KbbGoruntuModalite, string> = {
  otoskopi: 'dış kulak yolu → kulak zarı (ışık üçgeni, renk, kenar)',
  nazoendoskopi: 'burun boşluğu (taban/orta konka/üst-arka) → nazofarinks (östaki ağzı, adenoid)',
  laringoskopi: 'orofarinks/hipofarinks (dil kökü, vallekula, epiglot, piriform) → supraglottis → glottis (vokal kord hareketi)',
}

export interface TaslakGirdi {
  rapor: BelgeRaporu
  modalite: KbbGoruntuModalite
  taraf: 'sag' | 'sol' | 'iki' | null
  guvenUstPct: number
}

export function belgeTaslakMetni(g: TaslakGirdi): string {
  const r = g.rapor
  const tarafEtiketi = g.taraf === 'sag' ? ' (sağ kulak)' : g.taraf === 'sol' ? ' (sol kulak)' : g.taraf === 'iki' ? ' (iki kulak)' : ''
  const satir: string[] = [`Asistan taslak (Belge Tier A, ${MOD_AD[g.modalite]}${tarafEtiketi}) — ${KBB_GORUNTU_DISCLAIMER}`, `Muayene sırası: ${MUAYENE_SIRASI[g.modalite]}.`]
  if (r.ozet) satir.push(`Özet: ${r.ozet}`)
  if (r.bulgular.length) satir.push('Gözlemler:', ...r.bulgular.slice(0, 12).map((b, i) => `${i + 1}. ${b}`))
  if (r.tanilar.length) {
    satir.push(`Olası bulgular (karar desteği; tanı değildir — resmî tanı hekimin; güven ≤%${g.guvenUstPct}):`)
    for (const t of r.tanilar.slice(0, 5)) satir.push(`- ${t.ad} (%${Math.min(t.guven_pct, g.guvenUstPct)})`)
  }
  if (r.acil_bayrak) satir.push('Asistan acil bayrağı kaldırdı — hekim aynı gün değerlendirir.')
  if (r.sinirlar.length) satir.push(`Sınırlar: ${[...new Set(r.sinirlar)].join(' · ')}`)
  satir.push('Uzman onayından önce klinik karar verilmez.')
  return satir.join('\n').slice(0, 3000)
}

export function taslakAyiricilar(rapor: BelgeRaporu, guvenUstPct: number): string[] {
  return rapor.tanilar.slice(0, 5).map((t) => `${t.ad} (%${Math.min(t.guven_pct, guvenUstPct)}) — olası bulgu`)
}

export function taslakSonrakiAdim(rapor: BelgeRaporu, modalite: KbbGoruntuModalite): string {
  if (rapor.acil_bayrak) return 'Aynı gün hekim değerlendirmesi.'
  if (modalite === 'laringoskopi') return 'Uzman onayı; vokal kord hareketliliği ve hava yolu güvenliği hekim tarafından teyit edilir.'
  return 'Uzman onayı; gerekirse yeniden çekim (odak / ışık).'
}
