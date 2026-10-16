/**
 * NOTYA-ACCOUNTING-GIB-PORTAL-01 (Kaan, 2026-10-16) — stopaj/tevkifat (withholding) for serbest
 * meslek kazancı, computed for the GİB Portalı prepare-and-copy flow
 * (lib/accounting/ebelge/gibPortal.ts).
 *
 * RULE, VERIFIED THIS PASS (not assumed from training data, per instruction): GVK md. 94 makes
 * withholding the **payer's** obligation, and only vergi mükellefi kurumlar/şirketler/dernekler/
 * vakıflar/ticari işletmeler (institutional payers) are withholding agents — an ordinary gerçek
 * kişi (individual) payer never withholds. This exact rule was already independently documented
 * in this codebase before this pass (`lib/accounting/reports/monthly.ts`'s `STOPAJ_NOTU`,
 * `docs/ARCH-NOTYA-ACCOUNTING.md` §4.6.1/§4.6.2) — re-checked here via WebSearch/WebFetch against
 * three independent current (2026) secondary sources that agree with each other:
 *   - https://www.hukukihaber.net/avukatlarda-serbest-meslek-makbuzu-ve-20-stopaj (serbest meslek
 *     stopaj oranı %20, GVK md. 94 kapsamında kurumsal ödeyiciler için)
 *   - https://www.hukukihaber.net/serbest-meslek-makbuzu-ve-20-vergi-stopaji/amp (same rate,
 *     same applicability rule)
 *   - https://faturaport.com/blog/e-fatura/serbest-meslek-makbuzu-nasil-hesaplanir-2026-detayli-rehber
 *     (2026-dated guide; states the %20 rate AND explicitly that an individual/non-mükellef buyer
 *     triggers no stopaj, only KDV)
 * **Confidence: MODERATE** — these are secondary tax-advisory/vendor-blog sources, consistent
 * with each other and with this codebase's own pre-existing determination, but this session
 * could not reach gib.gov.tr's own primary rate table directly (same tool-level provenance limit
 * already recorded for the KDV rate in `lib/accounting/types.ts`'s
 * `KDV_RATE_BP_HEALTH_DEFAULT` doc comment and the ARCH doc §4.6.1). **Flagged for Kaan's own
 * confirmation before being treated as final** — see `docs/OPEN-COMMITMENTS.md`.
 *
 * Because this module bills **hekim -> hasta (gerçek kişi)** almost exclusively, stopaj is
 * `applicable: false` in the overwhelming common case — this computation exists for the rare
 * case a doctor is paid by an institution (a kurum/şirket settling on a patient's behalf), which
 * the doctor must mark explicitly (`buyerIsKurumsal`); Notya never infers it from a name or
 * guesses it silently.
 *
 * NOT hardcoded with no update path, per instruction: `GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK` is a
 * single named constant (same convention as `KDV_RATE_BP_HEALTH_DEFAULT`), and
 * `computeStopaj()`'s `rateBpOverride` lets a specific invoice use a different rate if a mali
 * müşavir advises one, without a code change.
 */
import type { EbelgeDocType, Money } from './types'
import { roundKurus } from './ledger/money'

/** GVK md. 94/2-b — serbest meslek kazancı stopaj oranı. 2000 bp = %20.00. MODERATE CONFIDENCE
 *  (see this file's header) — update here (and re-verify against GİB/Resmî Gazete) if it changes;
 *  this constant is the single source of truth, never re-duplicated as a literal elsewhere. */
export const GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK = 2000

export interface StopajInput {
  docType: EbelgeDocType
  /** Matrah (KDV hariç tutar) — stopaj is computed on this, never on the KDV-inclusive total. */
  matrahKurus: Money
  kdvKurus: Money
  totalKurus: Money
  /**
   * True only when the PAYER is a kurumsal/tüzel ödeyici (şirket, dernek, vakıf, kamu kurumu) —
   * GVK md. 94. Defaults to false (a gerçek kişi hasta paying directly, the normal case for this
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

const NOT_APPLICABLE_GERCEK_KISI =
  "Stopaj/tevkifat uygulanmadı: alıcı gerçek kişi olarak işaretli (GVK md. 94 stopajı yalnızca ödeyici kurumsal/tüzel kişi olduğunda devreye girer). Ödemeyi bir kurum/şirket yapıyorsa, hazırlamadan önce 'Alıcı kurumsal' kutusunu işaretleyin."

/** Pure, side-effect-free — the invoice engine (lib/accounting/invoices/engine.ts) and the GİB
 *  Portalı field builder (lib/accounting/ebelge/gibPortal.ts) are the only callers. */
export function computeStopaj(input: StopajInput): StopajResult {
  if (input.docType !== 'esmm') {
    return { applicable: false, rateBp: 0, stopajKurus: 0, netKurus: input.totalKurus, note: NOT_APPLICABLE_NON_ESMM }
  }
  if (!input.buyerIsKurumsal) {
    return { applicable: false, rateBp: 0, stopajKurus: 0, netKurus: input.totalKurus, note: NOT_APPLICABLE_GERCEK_KISI }
  }
  const rateBp =
    Number.isInteger(input.rateBpOverride) && (input.rateBpOverride as number) >= 0
      ? (input.rateBpOverride as number)
      : GVK_94_STOPAJ_RATE_BP_SERBEST_MESLEK
  const stopajKurus = roundKurus((input.matrahKurus * rateBp) / 10000)
  const netKurus = input.matrahKurus + input.kdvKurus - stopajKurus
  return {
    applicable: true,
    rateBp,
    stopajKurus,
    netKurus,
    note:
      `Stopaj uygulandı: alıcı kurumsal/tüzel ödeyici olarak işaretlendi (GVK md. 94/2-b, %${(rateBp / 100).toFixed(0)} — ` +
      'MODERATE CONFIDENCE, bkz. lib/accounting/stopaj.ts dosya başlığı; oranı mali müşavirinizle doğrulayın).',
  }
}
