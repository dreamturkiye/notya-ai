/**
 * AU-BETA-01 — BRING-YOUR-OWN merchant account: the payment-provider interface and the DEMO adapter.
 *
 * THE DESIGN (owner's instruction of 2026-10-22). The doctor or clinic connects THEIR OWN Stripe or Tyro account.
 * This product never holds funds, is not the merchant of record, keeps no balance or ledger of customer money, and
 * takes no platform fee. A charge is created on the connected account; no card data touches this product's servers
 * (a hosted page takes the card).
 *
 * WHAT IS BUILT: the DEMO adapter (this file: no network call, no real charge), the REAL Stripe adapter (./stripe.ts, bring-your-own
 * restricted key, test mode) and the Tyro adapter (./tyro.ts, written against the documented surface, OFF until Tyro onboarding),
 * the connection record (./fatura.ts) and the reconciliation (below). LIVE MODE IS OFF: a live key is refused (`CANLI_MOD`);
 * the database column accepts only 'test' (migration 149) — enabling live needs a reviewed migration, not just a flag.
 */
export type OdemeSaglayiciAdi = 'demo' | 'stripe' | 'tyro'
export const SAGLAYICILAR: readonly OdemeSaglayiciAdi[] = ['demo', 'stripe', 'tyro']

export type OdemeIstegi = { faturaId: string; tutarKurus: number; paraKodu: string }
export type OdemeSonucu = { tamam: boolean; ref: string; durum: 'odendi' | 'basarisiz' }
export type IadeSonucu = { tamam: boolean; ref: string; iadeKurus: number }
export type SaglayiciOdemesi = { ref: string; tutarKurus: number; iadeKurus: number; durum: 'odendi' | 'kismen_iade' | 'iade' | 'yok' }

export interface OdemeSaglayici {
  readonly ad: OdemeSaglayiciAdi
  /** true = this adapter talks to a real provider. The demo adapter never does. */
  readonly gercek: boolean
  ode(i: OdemeIstegi): Promise<OdemeSonucu>
  iade(ref: string, kurus: number): Promise<IadeSonucu>
  /** What the provider says about the references the invoices hold (for reconciliation). */
  sorgula(refler: readonly string[]): Promise<SaglayiciOdemesi[]>
}

/** The demo provider. Deterministic and stateless: a demo payment is always 'paid'; what it says on query is what the caller's own records say. */
export function demoSaglayici(kayitlar: ReadonlyMap<string, { tutarKurus: number; iadeKurus: number }> = new Map()): OdemeSaglayici {
  return {
    ad: 'demo',
    gercek: false,
    async ode(i) {
      if (!Number.isInteger(i.tutarKurus) || i.tutarKurus <= 0) return { tamam: false, ref: '', durum: 'basarisiz' }
      return { tamam: true, ref: `demo_pay_${i.faturaId.replace(/-/g, '').slice(0, 16)}`, durum: 'odendi' }
    },
    async iade(ref, kurus) {
      if (!ref.startsWith('demo_pay_') || !Number.isInteger(kurus) || kurus <= 0) return { tamam: false, ref: '', iadeKurus: 0 }
      return { tamam: true, ref: `demo_ref_${ref.slice(9)}_${kurus}`, iadeKurus: kurus }
    },
    async sorgula(refler) {
      return refler.map((ref) => {
        const k = kayitlar.get(ref)
        if (!k) return { ref, tutarKurus: 0, iadeKurus: 0, durum: 'yok' as const }
        return { ref, tutarKurus: k.tutarKurus, iadeKurus: k.iadeKurus, durum: k.iadeKurus === 0 ? 'odendi' as const : k.iadeKurus >= k.tutarKurus ? 'iade' as const : 'kismen_iade' as const }
      })
    },
  }
}

/** A key is "live" when it carries the provider's live prefix. Live mode is off in this beta. */
export function canliAnahtarMi(ham: string): boolean {
  return /^(sk|rk|pk)_live_/i.test(ham.trim()) || /live/i.test(ham.trim().slice(0, 12))
}

/** The DEMO adapter. A connected Stripe account is used through ./stripe.ts by ./fatura.ts, never through this function. */
export function saglayiciSec(_baglanti: { saglayici: OdemeSaglayiciAdi } | null, kayitlar?: ReadonlyMap<string, { tutarKurus: number; iadeKurus: number }>): OdemeSaglayici {
  return demoSaglayici(kayitlar)
}

export type Uzlasma = 'eslesti' | 'uyusmadi' | 'saglayicida_yok' | 'odenmedi' | 'notya_yok' | 'iade_edildi'
export type UzlasmaSatiri = { faturaId: string; no: number; faturaToplamKurus: number; faturaIadeKurus: number; faturaDurum: string; ref: string | null; saglayici: SaglayiciOdemesi | null; sonuc: Uzlasma }

/** Pure: invoices (with their own paid/refunded records) against what the provider reports. */
export function uzlastir(faturalar: readonly { id: string; no: number; toplamKurus: number; iadeKurus: number; durum: string; ref: string | null }[], sag: readonly SaglayiciOdemesi[]): UzlasmaSatiri[] {
  const harita = new Map(sag.map((s) => [s.ref, s]))
  return faturalar.map((f) => {
    const s = f.ref ? harita.get(f.ref) ?? null : null
    let sonuc: Uzlasma
    if (f.durum !== 'odendi' && !f.ref) sonuc = 'odenmedi'
    else if (!s || s.durum === 'yok') sonuc = 'saglayicida_yok'
    else sonuc = s.tutarKurus === f.toplamKurus && s.iadeKurus === f.iadeKurus ? 'eslesti' : 'uyusmadi'
    return { faturaId: f.id, no: f.no, faturaToplamKurus: f.toplamKurus, faturaIadeKurus: f.iadeKurus, faturaDurum: f.durum, ref: f.ref, saglayici: s, sonuc }
  })
}

const csvHucre = (x: string | number): string => { const t = String(x); const g = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t; return /[",\n]/.test(g) ? `"${g.replace(/"/g, '""')}"` : g }
export function uzlasmaCsv(satirlar: readonly UzlasmaSatiri[], gercek = false): string {
  const ust = ['mode', 'invoice_no', 'invoice_total_cents', 'invoice_refunded_cents', 'invoice_status', 'provider_ref', 'provider_amount_cents', 'provider_refunded_cents', 'result']
  const g = satirlar.map((s) => [gercek ? 'provider' : 'DEMO (not a real reconciliation)', s.no, s.faturaToplamKurus, s.faturaIadeKurus, s.faturaDurum, s.ref ?? '', s.saglayici?.tutarKurus ?? '', s.saglayici?.iadeKurus ?? '', s.sonuc].map(csvHucre).join(','))
  return [ust.join(','), ...g].join('\n') + '\n'
}

import type { SaglayiciKaydi } from './saglayiciTipleri'
export type UzlasmaFatura = { id: string; no: number; toplamKurus: number; iadeKurus: number; durum: string; ref: string | null; paraKodu: string; odendiAt: number | null }

/**
 * REAL reconciliation: the invoices paid in [gte, lte] (epoch ms) against the payments the provider LISTS for that range.
 * Matched by the invoice id the payment carries in its metadata, then by the provider reference. Result per row:
 *   eslesti          paid, amount + currency + refunded total agree, nothing refunded
 *   iade_edildi      same, and (partly or fully) refunded — both sides agree on the refunded total
 *   uyusmadi         found, but amount, currency or refunded total differ
 *   saglayicida_yok  Notya says paid, the provider lists no such successful payment
 *   notya_yok        the provider lists a successful payment Notya has no invoice for (no/unknown invoice id)
 *   odenmedi         a draft with nothing to match (shown for completeness)
 */
export function uzlastirKayitlarla(faturalar: readonly UzlasmaFatura[], kayitlar: readonly SaglayiciKaydi[], gte: number, lte: number): UzlasmaSatiri[] {
  const sag = kayitlar.filter((k) => k.basarili)
  const idile = new Map(sag.filter((k) => k.faturaId).map((k) => [k.faturaId as string, k]))
  const refle = new Map(sag.map((k) => [k.ref, k]))
  const kullanilan = new Set<string>()
  const satirlar: UzlasmaSatiri[] = []
  for (const f of faturalar) {
    const aralikta = f.odendiAt !== null && f.odendiAt >= gte && f.odendiAt <= lte
    if (f.durum === 'odendi' && !aralikta) continue
    if (f.durum !== 'odendi') { if (!f.ref) satirlar.push({ faturaId: f.id, no: f.no, faturaToplamKurus: f.toplamKurus, faturaIadeKurus: f.iadeKurus, faturaDurum: f.durum, ref: null, saglayici: null, sonuc: 'odenmedi' }); continue }
    const k = (f.ref ? refle.get(f.ref) : undefined) ?? idile.get(f.id) ?? null
    if (k) kullanilan.add(k.ref)
    const sagOdeme = k ? { ref: k.ref, tutarKurus: k.tutarKurus, iadeKurus: k.iadeKurus, durum: (k.iadeKurus === 0 ? 'odendi' : k.iadeKurus >= k.tutarKurus ? 'iade' : 'kismen_iade') as SaglayiciOdemesi['durum'] } : null
    let sonuc: Uzlasma
    if (!k) sonuc = 'saglayicida_yok'
    else if (k.tutarKurus !== f.toplamKurus || k.iadeKurus !== f.iadeKurus || k.paraKodu.toUpperCase() !== f.paraKodu.toUpperCase()) sonuc = 'uyusmadi'
    else sonuc = k.iadeKurus > 0 ? 'iade_edildi' : 'eslesti'
    satirlar.push({ faturaId: f.id, no: f.no, faturaToplamKurus: f.toplamKurus, faturaIadeKurus: f.iadeKurus, faturaDurum: f.durum, ref: f.ref ?? k?.ref ?? null, saglayici: sagOdeme, sonuc })
  }
  for (const k of sag) {
    if (kullanilan.has(k.ref)) continue
    if (k.faturaId && faturalar.some((f) => f.id === k.faturaId)) continue
    satirlar.push({ faturaId: '', no: 0, faturaToplamKurus: 0, faturaIadeKurus: 0, faturaDurum: '', ref: k.ref, saglayici: { ref: k.ref, tutarKurus: k.tutarKurus, iadeKurus: k.iadeKurus, durum: k.iadeKurus === 0 ? 'odendi' : k.iadeKurus >= k.tutarKurus ? 'iade' : 'kismen_iade' }, sonuc: 'notya_yok' })
  }
  return satirlar
}
