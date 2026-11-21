/**
 * NOTYA-BELGE-01 / GOZ-EXCEPTIONAL-01 — Tier A yazım + füzyon tek yol. Belge › Asistana raporla (/api/doktor/belgeler/analiz)
 * ve Göz › Görüntü › Asistana raporla (/api/doktor/goz) AYNI fonksiyonu çağırır: önce Tier B ile füzyon (yazar üst sınırı görsün),
 * sonra Luna-Pro yazar, sonra yazarın kendi kodlarıyla ikinci füzyon + rapor doğrulama. Görsel her zaman kimliksizleştirilmiş türevdir.
 */
import { fusionYap, raporuDogrula } from './fusion'
import { claudeIleYaz, claudeMotorCiktisi, type ClaudeGorselGirdi } from './yazar'
import type { AnalizGirdi, BelgeRaporu, FusionSonuc, MotorCiktisi } from './types'
import type { Modalite } from './ontoloji'

export interface TierAGirdi {
  persona: string
  girdi: AnalizGirdi
  gorsel: ClaudeGorselGirdi | null
  tierB: MotorCiktisi[]
  modalite: Modalite
  yasAy: number | null
  fitzpatrickBilinmiyor?: boolean
  tekAlanFundus?: boolean
  serbest?: boolean
  sesMetrikleri?: Record<string, number | string> | null
  /** Yalnız ai_token_kullanim ölçümü için hekim kimliği (NOTYA-MALIYET-01). */
  doctorId?: string | null
  /** NOTYA-BELGE-TUR-01: unclassified upload — the final modality is resolved from what the writer detected, before fusion caps. */
  modaliteCoz?: (rapor: BelgeRaporu) => { modalite: Modalite; serbest: boolean }
}

export interface TierASonuc { rapor: BelgeRaporu; fusion: FusionSonuc; motorlar: MotorCiktisi[]; duzeltmeler: string[]; ham: string; modalite: Modalite }

/** Hata fırlatabilir (model / JSON) — çağıran yakalar ve kendi hata kaydını tutar. */
export async function tierAYazVeFuzyonla(g: TierAGirdi): Promise<TierASonuc> {
  const capGirdi = { modalite: g.modalite, yasAy: g.yasAy, fitzpatrickBilinmiyor: g.fitzpatrickBilinmiyor, tekAlanFundus: g.tekAlanFundus }
  const onFusion = fusionYap(g.tierB, { ...capGirdi, kalite: 'iyi' })
  const yazim = await claudeIleYaz(g.persona, g.girdi, g.gorsel, g.tierB.length ? onFusion : null, g.tierB, g.sesMetrikleri || null, g.doctorId ?? null)
  const son = g.modaliteCoz ? g.modaliteCoz(yazim.rapor) : { modalite: g.modalite, serbest: !!g.serbest }
  const motorlar = [...g.tierB, claudeMotorCiktisi(yazim.bulguKodlari, yazim.rapor.kalite, null)]
  const fusion = fusionYap(motorlar, { ...capGirdi, modalite: son.modalite, kalite: yazim.rapor.kalite })
  const { rapor, duzeltmeler } = raporuDogrula(yazim.rapor, fusion)
  if (son.serbest && !rapor.sinirlar.some((s) => s.includes('yalnızca tarif'))) rapor.sinirlar.push('Branş için tanımlı yüksek değerli girdi değil — yalnızca tarif.')
  return { rapor, fusion, motorlar, duzeltmeler, ham: yazim.ham, modalite: son.modalite }
}
