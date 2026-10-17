/**
 * NOTYA-ACCOUNTING-GIB-PORTAL-01 (Kaan, 2026-10-16) — stopaj/tevkifat (withholding) for serbest
 * meslek kazancı, computed for the GİB Portalı prepare-and-copy flow
 * (lib/accounting/ebelge/gibPortal.ts).
 *
 * LEGAL BASIS (193 sayılı Gelir Vergisi Kanunu md. 94 — "Tevkifat yoluyla vergi kesintisi"):
 *   - md. 94/1: the duty to withhold lies on the PAYER, and only on the payers the article lists:
 *     kamu idare ve müesseseleri, iktisadi kamu müesseseleri, kurumlar vergisi mükellefleri
 *     (şirketler, dernekler, vakıflar ...), iş ortaklıkları/ortaklıklar, kooperatifler, yatırım
 *     fon yöneticileri, "gerçek gelirlerini beyan etmeye mecbur olan ticaret ve serbest meslek
 *     erbabı" (gerçek usulde defter tutan tacir / serbest meslek erbabı) and bilanço/işletme
 *     hesabı esasında defter tutan çiftçiler. A patient who is an ordinary gerçek kişi and not
 *     one of those is NOT a withholding agent -> no stopaj; only KDV (if any) is charged.
 *   - md. 94/2-b: serbest meslek kazançlarında tevkifat oranı %20 (matrah = KDV hariç brüt tutar).
 *
 * VERIFICATION STATUS (2026-10-17, be precise):
 *   - The payer list of md. 94/1 was re-read in a PRIMARY source: GİB Gelir Vergisi Genel Tebliği
 *     Seri No: 330 (www.gib.gov.tr/sites/default/files/fileadmin/user_upload/Tebligler/Taslaklar/
 *     gelir/330_serno_gelverteb_taslak.pdf), which reproduces the md. 94 preamble verbatim,
 *     including "gerçek gelirlerini beyan etmeye mecbur olan ticaret ve serbest meslek erbabı".
 *   - The %20 figure for md. 94/2-b could NOT be re-fetched from a primary page in this
 *     environment (mevzuat.gov.tr, resmigazete.gov.tr and the GİB rehber PDFs are blocked for the
 *     tool; the Seri 330 excerpt elides item 2). It rests on the long-standing statutory text,
 *     the GİB Serbest Meslek Vergi Rehberi, and three consistent 2026 secondary sources
 *     (hukukihaber.net, faturaport.com). Nothing in Seri 330 / Law 7524 (2024) changes the
 *     serbest meslek rate (they concern items 19/20, e-ticaret %1/%25).
 *   - Residual question for a mali müşavir (docs/OPEN-COMMITMENTS.md): confirm the %20 on the
 *     current mevzuat.gov.tr text of md. 94/2-b, and whether a given institutional payer of a
 *     hekim (e.g. özel sigorta şirketi, anlaşmalı kurum) is treated as a withholding agent.
 *
 * Because this module bills hekim -> hasta (gerçek kişi) almost exclusively, stopaj is
 * `applicable: false` in the overwhelming common case. It applies only when the doctor marks the
 * payer as a withholding agent (`buyerIsKurumsal`); Notya never infers it from a name.
 *
 * KDV is independent of stopaj: stopaj is computed on the KDV-exclusive matrah and never reduces
 * the KDV base. KDV tevkifatı (KDVK md. 9) is a separate regime that applies only to the services
 * listed in the KDV Genel Uygulama Tebliği; it is not modelled here.
 *
 * `GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK` is the single named constant for the rate; `computeStopaj()`'s
 * `rateBpOverride` lets one invoice use a different rate on a mali müşavir's advice.
 */
import type { EbelgeDocType, Money } from './types'
import { roundKurus } from './ledger/money'

/** GVK md. 94/2-b — serbest meslek kazancı tevkifat (stopaj) oranı. 2000 bp = %20.00. See this
 *  file's header for legal basis and verification status; this constant is the single source of
 *  truth, never re-duplicated as a literal elsewhere. */
// Mali müşavir teyidi 2026-10-17 (Kaan aracılığıyla): %20 oranı, tevkifat yükümlüsü kapsamı ve KDV tevkifatı olmadığı doğrulandı (ACCOUNTING-GIB-04c kapalı).
export const GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK = 2000

export interface StopajInput {
  docType: EbelgeDocType
  /** Matrah (KDV hariç tutar) — stopaj is computed on this, never on the KDV-inclusive total. */
  matrahKurus: Money
  kdvKurus: Money
  totalKurus: Money
  /**
   * True only when the PAYER is a withholding agent under GVK md. 94/1: kurumsal/tüzel ödeyici
   * (şirket, dernek, vakıf, kamu kurumu) or a gerçek usulde defter tutan tacir/serbest meslek
   * erbabı. Defaults to false (a gerçek kişi hasta paying directly, the normal case for this
   * module) — the doctor marks this explicitly for the rare institutional-payer invoice rather
   * than Notya inferring it from the buyer's name or any other heuristic.
   */
  buyerIsKurumsal: boolean
  /** Override `GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK` for this one computation (basis points),
   *  e.g. when a mali müşavir specifies a different current rate. Ignored unless a non-negative
   *  integer. */
  rateBpOverride?: number
}

export interface StopajResult {
  applicable: boolean
  rateBp: number
  stopajKurus: Money
  /** matrah + KDV - stopaj — the net amount the doctor should actually expect to receive. Equals
   *  `totalKurus` whenever stopaj does not apply. */
  netKurus: Money
  note: string
}

const NOT_APPLICABLE_NON_ESMM =
  'Stopaj/tevkifat bu belge türünde (e-Fatura/e-Arşiv — şirket satışı) uygulanmaz; GVK md. 94 stopajı serbest meslek kazancına (e-SMM) özgüdür.'

export const STOPAJ_YOK_GERCEK_KISI_NOTU =
  'Stopaj (gelir vergisi tevkifatı) kesilmedi: hasta gerçek kişi olduğu için GVK md. 94 kapsamında tevkifat yapmak zorunda değildir; belge tutarı üzerinden yalnızca KDV (varsa) hesaplanır. Ödemeyi bir kurum/şirket veya defter tutan bir tacir/serbest meslek erbabı yapıyorsa, hazırlamadan önce "Alıcı tevkifat yapmak zorunda (kurumsal)" kutusunu işaretleyin.'

/** Pure, side-effect-free — the invoice engine (lib/accounting/invoices/engine.ts) and the GİB
 *  Portalı field builder (lib/accounting/ebelge/gibPortal.ts) are the only callers. */
export function computeStopaj(input: StopajInput): StopajResult {
  if (input.docType !== 'esmm') {
    return { applicable: false, rateBp: 0, stopajKurus: 0, netKurus: input.totalKurus, note: NOT_APPLICABLE_NON_ESMM }
  }
  if (!input.buyerIsKurumsal) {
    return { applicable: false, rateBp: 0, stopajKurus: 0, netKurus: input.totalKurus, note: STOPAJ_YOK_GERCEK_KISI_NOTU }
  }
  const usedOverride = Number.isInteger(input.rateBpOverride) && (input.rateBpOverride as number) >= 0
  const rateBp = usedOverride ? (input.rateBpOverride as number) : GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK
  const stopajKurus = roundKurus((input.matrahKurus * rateBp) / 10000)
  const netKurus = input.matrahKurus + input.kdvKurus - stopajKurus
  return {
    applicable: true,
    rateBp,
    stopajKurus,
    netKurus,
    note:
      `Stopaj uygulandı: alıcı tevkifat yapmak zorunda olan ödeyici olarak işaretlendi (GVK md. 94/2-b, %${(rateBp / 100).toFixed(0)}, KDV hariç matrah üzerinden). ` +
      (usedOverride ? 'Oran, elle verilen değerle uygulandı; mali müşavirinizle doğrulayın.' : 'Kesinti, ödemeyi yapan tarafından muhtasar beyannameyle bildirilir.'),
  }
}
