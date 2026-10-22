/**
 * AU-BETA-01 — INVOICES, payment, refund, reconciliation and the doctor's own payment connection. Server only.
 *
 * NOT A MERCHANT: this product never holds funds and keeps no ledger of customer money (see ./odemeSaglayici.ts).
 * Every payment goes through an adapter; today that is the DEMO adapter, which makes no network call.
 *
 * ISOLATION (.cursor/skills/hasta-izolasyon/SKILL.md): service-role client, so every statement carries the
 * authenticated doctor's id; a patient id from a request is checked with hastaGetir (doctor + patient) before it is
 * used; another doctor's invoice answers like a missing one. The lines and both parties' particulars are one encrypted
 * value. Connection credentials are encrypted with the repo's helper, are never logged and never sent to the client.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt, encrypt } from '@/lib/security/encryption'
import { ulkePaketi } from '../ulke'
import { hastaAdlari, hastaGetir } from '../uygulama/hastalar'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeTablosu } from '../uygulama/tablolar'
import { yerelAn } from '../uygulama/zaman'
import { faturaToplami, kalemleriTemizle, type FaturaKalemi } from './hesap'
import { saglayiciSec, uzlastir, uzlastirKayitlarla, type OdemeSaglayiciAdi, type UzlasmaSatiri } from './odemeSaglayici'
import type { GercekSaglayici } from './saglayiciTipleri'
import { stripeAnahtarModu, stripeGizliAnahtarMi, stripeIstemciYap, stripeSaglayici } from './stripe'
import { tyroEtkin, tyroSaglayici, type TyroKimlik } from './tyro'

export type OdemeModu = 'test' | 'live'

export type Fatura = {
  id: string; no: number; hastaId: string; hastaAdi: string; muayeneId: string | null; kalemler: FaturaKalemi[]
  satici: Record<string, string>; tarih: string
  altToplamKurus: number; vergiKurus: number; toplamKurus: number; iadeKurus: number; paraKodu: string
  durum: 'taslak' | 'odendi' | 'iptal'; saglayici: string | null; odemeRef: string | null; odendiAt: string | null
  /** The mode of the connection the payment was started/confirmed under (null = demo or older than migration 151). */
  odemeModu: OdemeModu | null
}
type Satir = {
  id: string; fatura_no: number; patient_id: string; session_id: string | null; govde_encrypted: string
  alt_toplam_kurus: number | string; vergi_kurus: number | string; toplam_kurus: number | string; iade_kurus: number | string
  para_kodu: string; durum: Fatura['durum']; saglayici: string | null; odeme_ref: string | null; odendi_at: string | null; odeme_modu: OdemeModu | null
}
const KOLON = 'id, fatura_no, patient_id, session_id, govde_encrypted, alt_toplam_kurus, vergi_kurus, toplam_kurus, iade_kurus, para_kodu, durum, saglayici, odeme_ref, odendi_at, odeme_modu'
type Govde = { v: 1; kalemler: FaturaKalemi[]; satici: Record<string, string>; tarih: string }

const aktifTanim = () => ulkePaketi().uzanti?.fatura ?? null

function govdeCoz(h: string): Govde | null {
  try { const g = JSON.parse(decrypt(h)) as Govde; return g && g.v === 1 && Array.isArray(g.kalemler) ? g : null } catch { return null }
}
function donustur(s: Satir, ad: string): Fatura | null {
  const g = govdeCoz(s.govde_encrypted)
  if (!g) return null
  return {
    id: s.id, no: s.fatura_no, hastaId: s.patient_id, hastaAdi: ad, muayeneId: s.session_id, kalemler: g.kalemler, satici: g.satici, tarih: g.tarih,
    altToplamKurus: Number(s.alt_toplam_kurus), vergiKurus: Number(s.vergi_kurus), toplamKurus: Number(s.toplam_kurus), iadeKurus: Number(s.iade_kurus),
    paraKodu: s.para_kodu, durum: s.durum, saglayici: s.saglayici, odemeRef: s.odeme_ref, odendiAt: s.odendi_at, odemeModu: s.odeme_modu ?? null,
  }
}

/** The practice particulars kept on the account (auth user_metadata.muayenehane), re-validated by the pack on every read. */
export function muayenehaneOku(meta: unknown): Record<string, string> {
  const t = ulkePaketi().uzanti?.muayenehane
  const ham = meta && typeof meta === 'object' ? (meta as { muayenehane?: unknown }).muayenehane : null
  if (!t || !ham || typeof ham !== 'object') return {}
  const r = t.dogrula(ham as Record<string, unknown>)
  return Object.keys(r.hatalar).length ? {} : r.temiz
}

export type FaturaRet = 'KAPALI' | 'GECERSIZ' | 'NOT_FOUND' | 'DURUM' | 'BASARISIZ'

export async function faturaOlustur(supabase: SupabaseClient, doktorId: string, doktorMeta: unknown, g: { hastaId: unknown; muayeneId?: unknown; kalemler: unknown }, simdi = Date.now()): Promise<{ tamam: true; fatura: Fatura } | { tamam: false; kod: FaturaRet }> {
  const t = aktifTanim()
  if (!t) return { tamam: false, kod: 'KAPALI' }
  const kalemler = kalemleriTemizle(g.kalemler)
  if (!kalemler || typeof g.hastaId !== 'string') return { tamam: false, kod: 'GECERSIZ' }
  const hasta = await hastaGetir(supabase, doktorId, g.hastaId)
  if (!hasta) return { tamam: false, kod: 'NOT_FOUND' }
  const dilim = await hesapSaatDilimi(supabase, doktorId)
  const toplam = faturaToplami(kalemler, t.oranYuzde)
  const govde: Govde = { v: 1, kalemler, satici: muayenehaneOku(doktorMeta), tarih: yerelAn(simdi, dilim).gun }
  for (let deneme = 0; deneme < 3; deneme++) {
    const son = await ulkeTablosu(supabase, 'ulke_faturalar').select('fatura_no').eq('doctor_id', doktorId).order('fatura_no', { ascending: false }).limit(1)
    if (son.error) return { tamam: false, kod: 'BASARISIZ' }
    const no = (((son.data as { fatura_no: number }[] | null)?.[0]?.fatura_no) ?? 0) + 1
    const { data, error } = await ulkeTablosu(supabase, 'ulke_faturalar').insert({
      doctor_id: doktorId, patient_id: g.hastaId, session_id: typeof g.muayeneId === 'string' ? g.muayeneId : null, fatura_no: no,
      govde_encrypted: encrypt(JSON.stringify(govde)), alt_toplam_kurus: toplam.altToplamKurus, vergi_kurus: toplam.vergiKurus, toplam_kurus: toplam.toplamKurus, para_kodu: t.paraKodu,
    }).select(KOLON).single()
    if (!error && data) { const f = donustur(data as unknown as Satir, hasta.ad); return f ? { tamam: true, fatura: f } : { tamam: false, kod: 'BASARISIZ' } }
    if (error?.code !== '23505') return { tamam: false, kod: 'BASARISIZ' }
  }
  return { tamam: false, kod: 'BASARISIZ' }
}

export async function faturaListe(supabase: SupabaseClient, doktorId: string, hastaId?: string): Promise<Fatura[]> {
  let q = ulkeTablosu(supabase, 'ulke_faturalar').select(KOLON).eq('doctor_id', doktorId)
  if (hastaId) q = q.eq('patient_id', hastaId)
  const { data } = await q.order('fatura_no', { ascending: false }).limit(200)
  const satirlar = (data as Satir[] | null) ?? []
  const adlar = await hastaAdlari(supabase, doktorId, satirlar.map((s) => s.patient_id))
  return satirlar.map((s) => donustur(s, adlar.get(s.patient_id) ?? '')).filter((f): f is Fatura => f !== null)
}

export async function faturaTek(supabase: SupabaseClient, doktorId: string, id: string): Promise<Satir | null> {
  const { data } = await ulkeTablosu(supabase, 'ulke_faturalar').select(KOLON).eq('doctor_id', doktorId).eq('id', id).limit(1)
  return ((data as Satir[] | null) ?? [])[0] ?? null
}

/** The adapter for the doctor's OWN connected account, or null (→ the demo adapter). Only a restricted key (test or live) builds one. Tyro stays off until `tyroEtkin()`. */
export function gercekSaglayiciYap(k: Kimlik | null, saglayici: 'stripe' | 'tyro' | null): GercekSaglayici | null {
  if (!k || !saglayici) return null
  if (saglayici === 'stripe') return k.anahtar && stripeAnahtarModu(k.anahtar) !== null ? stripeSaglayici(stripeIstemciYap(k.anahtar)) : null
  return tyroEtkin() && k.tyro ? tyroSaglayici(k.tyro) : null
}

export type OdemeSonucu = { tamam: true; url?: string; paySecret?: string; bekliyor: boolean } | { tamam: false; kod: FaturaRet }

/**
 * Pay an invoice. Demo adapter: paid at once. A connected Stripe account: a hosted Checkout Session is created on the DOCTOR'S account and
 * its URL returned; the invoice stays a draft until the signed webhook (./webhook.ts) says the money arrived — the browser's word is never taken.
 */
export async function faturaOde(supabase: SupabaseClient, doktorId: string, id: string, donus: { basariUrl: string; iptalUrl: string } = { basariUrl: '', iptalUrl: '' }, simdi = Date.now(), uretici: typeof gercekSaglayiciYap = gercekSaglayiciYap): Promise<OdemeSonucu> {
  const s = await faturaTek(supabase, doktorId, id)
  if (!s) return { tamam: false, kod: 'NOT_FOUND' }
  if (s.durum !== 'taslak') return { tamam: false, kod: 'DURUM' }
  const k = await kimlikOku(supabase, doktorId)
  const gercek = uretici(k?.kimlik ?? null, k?.saglayici ?? null)
  if (gercek) {
    if (!donus.basariUrl || !donus.iptalUrl) return { tamam: false, kod: 'GECERSIZ' }
    try {
      const b = await gercek.baslat({ faturaId: s.id, no: s.fatura_no, tutarKurus: Number(s.toplam_kurus), paraKodu: s.para_kodu, basariUrl: donus.basariUrl, iptalUrl: donus.iptalUrl })
      const { error } = await ulkeTablosu(supabase, 'ulke_faturalar').update({ saglayici: gercek.ad, odeme_ref: b.ref, odeme_modu: k?.mod ?? null }).eq('doctor_id', doktorId).eq('id', id).eq('durum', 'taslak')
      if (error) return { tamam: false, kod: 'BASARISIZ' }
      return { tamam: true, url: b.url, paySecret: b.paySecret, bekliyor: true }
    } catch { return { tamam: false, kod: 'BASARISIZ' } }
  }
  const sag = saglayiciSec(k ? { saglayici: k.saglayici } : null)
  const r = await sag.ode({ faturaId: s.id, tutarKurus: Number(s.toplam_kurus), paraKodu: s.para_kodu })
  if (!r.tamam) return { tamam: false, kod: 'BASARISIZ' }
  const { data, error } = await ulkeTablosu(supabase, 'ulke_faturalar').update({ durum: 'odendi', saglayici: sag.ad, odeme_ref: r.ref, odendi_at: new Date(simdi).toISOString() })
    .eq('doctor_id', doktorId).eq('id', id).eq('durum', 'taslak').select('id')
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  return (data as unknown[] | null)?.length ? { tamam: true, bekliyor: false } : { tamam: false, kod: 'DURUM' }
}

/** The signed webhook (or nothing else) marks a provider-paid invoice. Idempotent: an already paid invoice answers ok. Amount and currency must equal the invoice. */
export async function faturaOdendiIsaretle(supabase: SupabaseClient, doktorId: string, faturaId: string, g: { saglayici: 'stripe' | 'tyro'; ref: string; tutarKurus: number; paraKodu: string; mod?: OdemeModu }, simdi = Date.now()): Promise<'tamam' | 'yok' | 'uyusmadi'> {
  const s = await faturaTek(supabase, doktorId, faturaId)
  if (!s) return 'yok'
  if (s.durum === 'odendi') return 'tamam'
  if (s.durum !== 'taslak') return 'uyusmadi'
  if (Number(s.toplam_kurus) !== g.tutarKurus || s.para_kodu.toUpperCase() !== g.paraKodu.toUpperCase()) return 'uyusmadi'
  const { error } = await ulkeTablosu(supabase, 'ulke_faturalar').update({ durum: 'odendi', saglayici: g.saglayici, odeme_ref: g.ref, odendi_at: new Date(simdi).toISOString(), ...(g.mod ? { odeme_modu: g.mod } : {}) }).eq('doctor_id', doktorId).eq('id', faturaId).eq('durum', 'taslak')
  return error ? 'yok' : 'tamam'
}

/** A refund the provider reports (Stripe `charge.refunded`) raises the invoice's refunded total to the provider's figure; it never lowers it and never passes the invoice total. */
export async function faturaIadeSenkron(supabase: SupabaseClient, doktorId: string, odemeRef: string, iadeKurus: number): Promise<boolean> {
  const { data } = await ulkeTablosu(supabase, 'ulke_faturalar').select(KOLON).eq('doctor_id', doktorId).eq('odeme_ref', odemeRef).limit(1)
  const s = ((data as Satir[] | null) ?? [])[0]
  if (!s) return false
  const yeni = Math.min(Number(s.toplam_kurus), iadeKurus)
  if (yeni <= Number(s.iade_kurus)) return true
  const { error } = await ulkeTablosu(supabase, 'ulke_faturalar').update({ iade_kurus: yeni }).eq('doctor_id', doktorId).eq('id', s.id)
  return !error
}

export async function faturaRefile(supabase: SupabaseClient, doktorId: string, odemeRef: string): Promise<string | null> {
  const { data } = await ulkeTablosu(supabase, 'ulke_faturalar').select('id').eq('doctor_id', doktorId).eq('odeme_ref', odemeRef).limit(1)
  return ((data as { id: string }[] | null) ?? [])[0]?.id ?? null
}

/** A full or partial refund of a paid invoice. The total refunded never exceeds the total paid. */
export async function faturaIade(supabase: SupabaseClient, doktorId: string, id: string, kurus: unknown, uretici: typeof gercekSaglayiciYap = gercekSaglayiciYap): Promise<{ tamam: true; iadeKurus: number } | { tamam: false; kod: FaturaRet }> {
  const s = await faturaTek(supabase, doktorId, id)
  if (!s) return { tamam: false, kod: 'NOT_FOUND' }
  if (s.durum !== 'odendi' || !s.odeme_ref) return { tamam: false, kod: 'DURUM' }
  const kalan = Number(s.toplam_kurus) - Number(s.iade_kurus)
  if (typeof kurus !== 'number' || !Number.isInteger(kurus) || kurus <= 0 || kurus > kalan) return { tamam: false, kod: 'GECERSIZ' }
  let basarili = false
  if (s.saglayici === 'stripe' || s.saglayici === 'tyro') {
    const k = await kimlikOku(supabase, doktorId)
    // A refund is made with the key of the mode the payment was taken under: a payment of the other mode (test vs live) is never refunded through this connection.
    if (k && s.odeme_modu && s.odeme_modu !== k.mod) return { tamam: false, kod: 'DURUM' }
    const gercek = k && k.saglayici === s.saglayici ? uretici(k.kimlik, k.saglayici) : null
    if (!gercek) return { tamam: false, kod: 'BASARISIZ' }
    basarili = (await gercek.iade({ faturaId: s.id, odemeRef: s.odeme_ref, kurus, oncekiIadeKurus: Number(s.iade_kurus) })).tamam
  } else {
    basarili = (await saglayiciSec(null).iade(s.odeme_ref, kurus)).tamam
  }
  if (!basarili) return { tamam: false, kod: 'BASARISIZ' }
  const yeni = Number(s.iade_kurus) + kurus
  const { data, error } = await ulkeTablosu(supabase, 'ulke_faturalar').update({ iade_kurus: yeni }).eq('doctor_id', doktorId).eq('id', id).eq('iade_kurus', Number(s.iade_kurus)).select('id')
  if (error) return { tamam: false, kod: 'BASARISIZ' }
  return (data as unknown[] | null)?.length ? { tamam: true, iadeKurus: yeni } : { tamam: false, kod: 'DURUM' }
}

export type UzlasmaCevabi = { saglayici: OdemeSaglayiciAdi; gercek: boolean; satirlar: UzlasmaSatiri[]; aralik: { gte: number; lte: number } | null; not?: string }

/**
 * Reconciliation. With a connected Stripe account it is REAL: the provider's PaymentIntents of the range are listed with the doctor's own key and matched to the
 * invoices paid in that range (./odemeSaglayici.ts uzlastirKayitlarla). Tyro has no documented list, so each invoice's own Pay Request is read by id. Without a
 * connection it is the DEMO check, which is built from the invoices themselves and says so (`gercek: false`).
 */
export async function uzlasma(supabase: SupabaseClient, doktorId: string, aralik?: { gte: number; lte: number }, uretici: typeof gercekSaglayiciYap = gercekSaglayiciYap, simdi = Date.now()): Promise<UzlasmaCevabi> {
  const liste = await faturaListe(supabase, doktorId)
  const k = await kimlikOku(supabase, doktorId)
  const gercek = uretici(k?.kimlik ?? null, k?.saglayici ?? null)
  if (gercek) {
    const lte = aralik?.lte ?? simdi, gte = aralik?.gte ?? lte - 30 * 86_400_000
    // Only invoices paid under the connection's current mode are judged against its account (a test payment is not "missing" in a live account).
    const faturalar = liste.filter((f) => !f.odemeModu || f.odemeModu === k?.mod).map((f) => ({ id: f.id, no: f.no, toplamKurus: f.toplamKurus, iadeKurus: f.iadeKurus, durum: f.durum, ref: f.odemeRef, paraKodu: f.paraKodu, odendiAt: f.odendiAt ? Date.parse(f.odendiAt) : null }))
    let kayitlar = await gercek.kayitlar(Math.floor(gte / 1000), Math.floor(lte / 1000))
    let not: string | undefined
    if (gercek.ad === 'tyro') {
      const oku = (gercek as unknown as { odemeyiOku(ref: string): Promise<import('./saglayiciTipleri').SaglayiciKaydi | null> }).odemeyiOku
      kayitlar = (await Promise.all(faturalar.filter((f) => f.durum === 'odendi' && f.ref).map((f) => oku(f.ref as string)))).filter((x): x is NonNullable<typeof x> => Boolean(x))
      not = 'tyro: checked invoice by invoice (no list of payments is documented); refunded totals are not read'
    }
    return { saglayici: gercek.ad, gercek: true, satirlar: uzlastirKayitlarla(faturalar, kayitlar, gte, lte), aralik: { gte, lte }, not }
  }
  // The demo adapter answers from the invoices' own records, so in demo mode this check is tautological: the screen says so.
  const kayit = new Map(liste.filter((f) => f.odemeRef).map((f) => [f.odemeRef as string, { tutarKurus: f.toplamKurus, iadeKurus: f.iadeKurus }]))
  const sag = saglayiciSec(null, kayit)
  const yanit = await sag.sorgula(liste.map((f) => f.odemeRef).filter((x): x is string => Boolean(x)))
  return { saglayici: sag.ad, gercek: false, satirlar: uzlastir(liste.map((f) => ({ id: f.id, no: f.no, toplamKurus: f.toplamKurus, iadeKurus: f.iadeKurus, durum: f.durum, ref: f.odemeRef })), yanit), aralik: null }
}

// ───────────────────────── the doctor's own connection ─────────────────────────

export type Kimlik = { anahtar?: string; webhookGizli?: string; tyro?: TyroKimlik }
export type Baglanti = { saglayici: 'stripe' | 'tyro'; mod: OdemeModu; sonDort: string; webhookKurulu: boolean; /** true = payments are routed to the provider; false = demo (e.g. Tyro before onboarding). */ etkin: boolean }

/** SERVER ONLY: the decrypted credentials. Never returned to a browser and never logged. */
export async function kimlikOku(supabase: SupabaseClient, doktorId: string): Promise<{ saglayici: 'stripe' | 'tyro'; mod: OdemeModu; kimlik: Kimlik } | null> {
  const { data } = await ulkeTablosu(supabase, 'ulke_odeme_baglantilari').select('saglayici, mod, kimlik_encrypted').eq('doctor_id', doktorId).limit(1)
  const s = ((data as { saglayici: 'stripe' | 'tyro'; mod: OdemeModu; kimlik_encrypted: string }[] | null) ?? [])[0]
  if (!s) return null
  try { return { saglayici: s.saglayici, mod: s.mod, kimlik: JSON.parse(decrypt(s.kimlik_encrypted)) as Kimlik } } catch { return null }
}

export async function baglantiOku(supabase: SupabaseClient, doktorId: string): Promise<Baglanti | null> {
  const k = await kimlikOku(supabase, doktorId)
  if (!k) return null
  const son = (k.saglayici === 'tyro' ? k.kimlik.tyro?.istemciId : k.kimlik.anahtar)?.slice(-4) ?? ''
  return { saglayici: k.saglayici, mod: k.mod, sonDort: son, webhookKurulu: Boolean(k.kimlik.webhookGizli), etkin: k.saglayici === 'stripe' || tyroEtkin() }
}

export type BaglantiRet = 'TAMAM' | 'GECERSIZ' | 'SIR_ANAHTAR' | 'CANLI_ONAY' | 'WEBHOOK_GEREKLI' | 'ANAHTAR_REDDEDILDI' | 'IZIN_YOK' | 'BASARISIZ'
const kisa = (x: unknown, azami = 300) => (typeof x === 'string' && x.trim().length >= 3 && x.trim().length <= azami && !/\s/.test(x.trim()) ? x.trim() : '')

/** The providers a pack offers (its `saglayicilar`; Stripe alone when the pack names none). */
export const paketSaglayicilari = (): readonly ('stripe' | 'tyro')[] => aktifTanim()?.saglayicilar ?? ['stripe']

/**
 * Connect the doctor's own account. Stripe: a RESTRICTED key — `rk_test_…` or `rk_live_…` — and nothing else: a full-access secret key (`sk_…`, any mode)
 * is refused (`SIR_ANAHTAR`). The key is CHECKED with one cheap authenticated read before it is kept. The mode (test | live) is read from the key prefix and
 * stored with the connection. A LIVE key additionally needs (1) the signing secret `whsec_…` of the doctor's own LIVE webhook endpoint in the same request
 * (`WEBHOOK_GEREKLI`: payments could not be confirmed without it), and (2) the explicit confirmation `canliOnay === true` that the screen collects before the
 * first live connection (`CANLI_ONAY`). A webhook secret stored for the other mode is never carried over.
 * Tyro (Australia only, a pack decision): client id, client secret and location id, checked by asking Tyro for a token — keeps the adapter OFF until `NOTYA_TYRO_ETKIN=1`.
 * Everything is stored as ONE encrypted value; nothing is echoed or logged.
 */
export async function baglantiKaydet(supabase: SupabaseClient, doktorId: string, g: { saglayici: unknown; anahtar?: unknown; webhookGizli?: unknown; istemciId?: unknown; istemciGizli?: unknown; konumId?: unknown; canliOnay?: unknown }, getir: typeof fetch = fetch, stripeUret: (anahtar: string) => GercekSaglayici = (a) => stripeSaglayici(stripeIstemciYap(a))): Promise<BaglantiRet> {
  if (g.saglayici !== 'stripe' && g.saglayici !== 'tyro') return 'GECERSIZ'
  if (!paketSaglayicilari().includes(g.saglayici)) return 'GECERSIZ'
  const onceki = await kimlikOku(supabase, doktorId)
  let kimlik: Kimlik
  let mod: OdemeModu = 'test'
  if (g.saglayici === 'stripe') {
    const anahtar = kisa(g.anahtar)
    if (anahtar && stripeGizliAnahtarMi(anahtar)) return 'SIR_ANAHTAR'
    const kModu = anahtar ? stripeAnahtarModu(anahtar) : null
    if (!anahtar || !kModu) return 'GECERSIZ'
    mod = kModu
    // The stored secret is reused only when it belongs to the same mode (test and live endpoints have different secrets).
    const gizli = g.webhookGizli === undefined || g.webhookGizli === '' ? (onceki?.saglayici === 'stripe' && onceki.mod === mod ? onceki.kimlik.webhookGizli : undefined) : kisa(g.webhookGizli)
    if (gizli === '' || (gizli !== undefined && !/^whsec_[A-Za-z0-9]{8,}$/.test(gizli))) return 'GECERSIZ'
    if (mod === 'live') {
      if (!gizli) return 'WEBHOOK_GEREKLI'
      if (g.canliOnay !== true) return 'CANLI_ONAY'
    }
    const d = await stripeUret(anahtar).dogrula()
    if (!d.tamam) return d.hata === 'anahtar' ? 'ANAHTAR_REDDEDILDI' : d.hata === 'izin' ? 'IZIN_YOK' : 'BASARISIZ'
    kimlik = { anahtar, webhookGizli: gizli }
  } else {
    const istemciId = kisa(g.istemciId), istemciGizli = kisa(g.istemciGizli), konumId = kisa(g.konumId)
    const gizli = g.webhookGizli === undefined || g.webhookGizli === '' ? (onceki?.saglayici === 'tyro' ? onceki.kimlik.webhookGizli : undefined) : kisa(g.webhookGizli)
    if (!istemciId || !istemciGizli || !konumId || gizli === '') return 'GECERSIZ'
    const d = await tyroSaglayici({ istemciId, istemciGizli, konumId }, getir).dogrula()
    if (!d.tamam) return d.hata === 'anahtar' ? 'ANAHTAR_REDDEDILDI' : 'BASARISIZ'
    kimlik = { tyro: { istemciId, istemciGizli, konumId }, webhookGizli: gizli }
  }
  const { error } = await ulkeTablosu(supabase, 'ulke_odeme_baglantilari').upsert({ doctor_id: doktorId, saglayici: g.saglayici, mod, kimlik_encrypted: encrypt(JSON.stringify(kimlik)) }, { onConflict: 'ulke,doctor_id' })
  return error ? 'BASARISIZ' : 'TAMAM'
}
export async function baglantiSil(supabase: SupabaseClient, doktorId: string): Promise<boolean> {
  const { error } = await ulkeTablosu(supabase, 'ulke_odeme_baglantilari').delete().eq('doctor_id', doktorId)
  return !error
}
