/**
 * WHATSAPP-ONBURO-01 — "Ayşe ön büro": what an inbound WhatsApp message may do beyond confirm / cancel / reschedule.
 *
 * Called by lib/iletisim/whatsapp/yanit.ts for every inbound text AFTER the doctor was derived from the receiving
 * phone_number_id, the sender was matched inside THAT doctor's roster and the encrypted audit row was written. It either
 * handles the message completely (`ele: true` — its own card, its own replies) or returns `ele: false` and the existing
 * pipeline runs exactly as before. With both switches OFF (the default, and before migration 195) it always returns
 * `ele: false` after one settings read.
 *
 * WHAT IT DOES
 *   Part 1 — new appointment by chat (doctor setting: kapali / onay / otomatik):
 *     • one matched patient, no upcoming appointment, a RULE-recognised booking wish → up to 3 free times from the slot
 *       engine; a bare "1/2/3" picks; "başka gün / daha geç / sabah / salı / 15 kasım" re-proposes (capped);
 *       onay → a pending request (the desk approves), otomatik → booked through the portal's create path (talepOlustur);
 *     • two patients on the number → "for whom?" by FIRST NAME only, from this doctor's own matches;
 *     • unknown number → the privacy notice, then the full name, then the same proposal; the pick becomes a REQUEST card.
 *       No patient is ever created here — the desk's approval does that (eylem.ts).
 *   Part 2 — answers from the doctor's own sheet (switch, default off): emergency guard → medical guard → deterministic
 *     rules → the model, which may only select / compose from the sheet (bilgi.ts). Everything else → holding reply + card.
 *
 * SAFETY
 *   • STOP / DUR is checked first and always belongs to the existing opt-out flow.
 *   • Only RULES start an action. The model never books, never matches a patient, never sees patient data.
 *   • HASTA-IZOLASYON-01: every query carries doctor_id; appointment and patient writes carry doctor_id AND patient_id.
 *     Candidate ids stored on a card are re-checked against the sender's current matches before use.
 *   • Crash safety as in yanit.ts: the card row is claimed BEFORE the action (one card per inbound wamid), `eylem_sonucu`
 *     is written after it, every reply has its own idempotency key, a booking adopts the row an interrupted run created.
 *   • Limits: per-number and per-doctor reply caps (also the loop guard) and a daily model budget (sunucu.ts).
 *   • Message bodies and the automatic answer are stored encrypted only.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPII, encryptPII } from '@/lib/security/encryption'
import type { KalkanHam } from '@/lib/iletisim/otomatik/whatsapp/webhook'
import type { FetchFn } from '@/lib/iletisim/otomatik/whatsapp/graph'
import { gunlukYaz, karsiTarafIzi } from '@/lib/iletisim/otomatik/whatsapp/gunluk'
import type { EslesenHasta, EslesmeTuru } from '@/lib/iletisim/whatsapp/eslestir'
import { kuralNiyeti } from '@/lib/iletisim/whatsapp/niyet'
import { hedefRandevu } from '@/lib/iletisim/whatsapp/randevuEylem'
import { OTURUM_PENCERESI_MS, oturumMetniGonder } from '@/lib/iletisim/whatsapp/serbest'
import { randevuSonrasi } from '@/lib/iletisim/whatsapp/sonrasi'
import { doktorIletisimAyari } from '@/lib/iletisim/sunucu'
import { RANDEVU_ALANLARI, ayarGetir, mevcutHastaMi, musaitSlotlar, talepOlustur, type Islem, type V2Randevu } from '@/lib/randevu/v2/sunucu'
import { PORTAL_TURLERI, type PortalRandevuAyari, type PortalTuru } from '@/lib/randevu/v2/ayar'
import { onBuroAcikMi, type OnBuroAyari, type RandevuModu } from './ayar'
import { bilgiYaniti, varsayilanBilgiModeli, type BilgiModeli } from './bilgi'
import { AKTIF_ON_BURO, ON_BURO_SAAT_DILIMI } from './dil/aktif'
import type { OnBuroDili, SlotTercihi } from './dil/tipler'
import { slotSec, type Oneri } from './slot'
import { ONERI_PAYI_DK, ONERI_SINIRI, TUR_ON_BURO, modelHakkiAl, onBuroAyarGetir, turetilmisSaatler, yanitSiniri } from './sunucu'

export const KARTLAR = 'whatsapp_yanitlar'

/** Card kinds the front desk writes into whatsapp_yanitlar.otomatik_eylem. */
export const OB = {
  slotOnerildi: 'ob_slot_onerildi',
  talep: 'ob_talep',
  talepOnaylandi: 'ob_talep_onaylandi',
  talepReddedildi: 'ob_talep_reddedildi',
  otomatikRandevu: 'ob_otomatik_randevu',
  randevuGeriAlindi: 'ob_randevu_geri_alindi',
  kisiSoruldu: 'ob_kisi_soruldu',
  adSoruldu: 'ob_ad_soruldu',
  yeniHastaTalebi: 'ob_yeni_hasta_talebi',
  yeniHastaOnaylandi: 'ob_yeni_hasta_onaylandi',
  birakildi: 'ob_istek_birakildi',
  yanit: 'ob_yanit',
  cevapsiz: 'ob_cevapsiz',
  tibbi: 'ob_tibbi',
  acil: 'ob_acil',
  sinir: 'ob_sinir',
} as const

/** The conversation state and the answer record kept on a card (whatsapp_yanitlar.on_buro, jsonb). */
export interface OnBuroDurumu {
  /** true while this card is the open step of a conversation (at most one per number). */
  acik?: boolean
  asama?: 'slot' | 'kisi' | 'ad'
  tur?: PortalTuru
  /** How many proposals this conversation has had. */
  deneme?: number
  /** Every start time proposed so far, and their local days. */
  gecmis?: string[]
  gunler?: string[]
  /** asama 'kisi': this doctor's own matches for the number, in the order they were shown. */
  adaylar?: string[]
  /** Unknown number: the full name the sender gave — encrypted. */
  ad?: string
  adDeneme?: number
  tercih?: SlotTercihi | null
  /** `kod` of the language the conversation runs in (multi-language packs; see OnBuroDili.dilSec). */
  dil?: string
  /** ob_yanit: the automatic answer (encrypted), the sheet keys behind it and where it came from. */
  yanit?: string
  alanlar?: string[]
  kaynak?: 'kural' | 'model'
  neden?: string
}

export interface OnBuroBaglam {
  doktorId: string
  phoneNumberId: string
  tokenSifreli: string
  olay: KalkanHam
  /** Sender, digits only. */
  numara: string
  hastalar: EslesenHasta[]
  eslesme: EslesmeTuru
  /** The card an interrupted earlier run of this same wamid left behind (no eylem_sonucu yet). */
  onceki: { id: string; otomatik_eylem: string | null } | null
  simdi: Date
  fetch?: FetchFn
  /** Test seam / override of the model call. */
  model?: BilgiModeli
  dil?: OnBuroDili
}

export type OnBuroSonucu = { ele: false } | { ele: true; kart: boolean; yanitlandi: boolean }

type Sb = SupabaseClient
type DurumKarti = { id: string; patient_id: string | null; onerilen_slotlar: Oneri[]; on_buro: OnBuroDurumu }

type Karar =
  | { tur: 'acil' }
  | { tur: 'tibbi' }
  | { tur: 'bilgi' }
  | { tur: 'birakildi'; durum: DurumKarti }
  | { tur: 'kisi_secildi'; durum: DurumKarti; hasta: EslesenHasta }
  | { tur: 'ad_geldi'; durum: DurumKarti; ad: string }
  | { tur: 'ad_tekrar'; durum: DurumKarti }
  | { tur: 'slot_secildi'; durum: DurumKarti; sira: number }
  | { tur: 'yeniden_oner'; durum: DurumKarti; tercih: SlotTercihi }
  | { tur: 'randevu_istegi' }

const ilkAd = (tam: string): string => String(tam || '').trim().split(/\s+/)[0] || ''

/** The one open conversation step of this number with this doctor inside the 24-hour session window. */
async function acikDurum(sb: Sb, doktorId: string, hash: string, simdi: Date, haricId?: string | null): Promise<DurumKarti | null> {
  const { data, error } = await sb.from(KARTLAR).select('id, patient_id, otomatik_eylem, onerilen_slotlar, on_buro, created_at')
    .eq('doctor_id', doktorId).eq('karsi_taraf_hash', hash)
    .gte('created_at', new Date(simdi.getTime() - OTURUM_PENCERESI_MS).toISOString())
    .order('created_at', { ascending: false }).limit(12)
  if (error || !data) return null
  for (const r of data as Array<Record<string, unknown>>) {
    if (haricId && String(r.id) === haricId) continue
    const d = (r.on_buro && typeof r.on_buro === 'object' ? r.on_buro : {}) as OnBuroDurumu
    if (!String(r.otomatik_eylem || '').startsWith('ob_') || d.acik !== true || !d.asama) continue
    return { id: String(r.id), patient_id: r.patient_id ? String(r.patient_id) : null, onerilen_slotlar: Array.isArray(r.onerilen_slotlar) ? (r.onerilen_slotlar as Oneri[]) : [], on_buro: d }
  }
  return null
}

/** Which visit type a chat booking gets: what the patient said, else follow-up visit vs first visit; always an OPEN type. */
function turSec(ayar: PortalRandevuAyari, istenen: PortalTuru | null, mevcut: boolean): PortalTuru | null {
  const sira: PortalTuru[] = [...(istenen ? [istenen] : []), mevcut ? 'muayene' : 'ilk_muayene', ...PORTAL_TURLERI]
  return sira.find((t) => ayar.turler[t]?.acik) ?? null
}

/** Book through the shared create path; adopts the row an interrupted run of the same message already created. */
async function randevuAc(sb: Sb, g: { doktorId: string; patientId: string; tur: PortalTuru; baslangic: string; mod: RandevuModu; simdi: Date }): Promise<Islem> {
  const { data } = await sb.from('randevular').select(RANDEVU_ALANLARI)
    .eq('doktor_id', g.doktorId).eq('patient_id', g.patientId).eq('baslangic', g.baslangic).eq('kaynak', 'whatsapp').in('durum', ['talep', 'onaylandi']).limit(1)
  if (data?.[0]) return { ok: true, randevu: data[0] as unknown as V2Randevu }
  return talepOlustur(sb, { doktorId: g.doktorId, patientId: g.patientId, tur: g.tur, baslangic: g.baslangic, simdi: g.simdi.getTime(), kanal: 'whatsapp', onay: g.mod === 'onay' ? 'zorunlu' : 'yok' })
}

export async function onBuroIsle(sb: Sb, b: OnBuroBaglam): Promise<OnBuroSonucu> {
  const YOK: OnBuroSonucu = { ele: false }
  const o = b.olay
  const metin = String(o.govde || '').trim()
  if (o.tip !== 'text' || !metin) return YOK
  // A card the existing pipeline already claimed for this message (its marker is not ours) stays with that pipeline.
  if (b.onceki?.otomatik_eylem && !b.onceki.otomatik_eylem.startsWith('ob_')) return YOK
  const { ayar } = await onBuroAyarGetir(sb, b.doktorId)
  if (!onBuroAcikMi(ayar)) return YOK

  // `kok` recognises (every language of the pack); `dil` — chosen once the open step is known — is what Ayşe answers in.
  const kok = b.dil ?? AKTIF_ON_BURO
  const { doktorId, simdi } = b
  const kural = kuralNiyeti(metin)
  // STOP / DUR always wins: the opt-out flow of yanit.ts handles it, nothing here answers it.
  if (kural?.niyet === 'vazgec') return YOK

  const hash = karsiTarafIzi(b.numara)
  const tek = b.hastalar.length === 1 ? b.hastalar[0] : null
  const acil = kok.acilMi(metin)
  // Emergency wording never books. With the answers switch off the existing pipeline (flagged card, Kalkan) keeps it.
  if (acil && !ayar.yanitAcik) return YOK

  // ── Decide (rules only) ─────────────────────────────────────────────────────────────────────────────────────────────
  let karar: Karar | null = acil ? { tur: 'acil' } : null
  const durum = acil ? null : await acikDurum(sb, doktorId, hash, simdi, b.onceki?.id)
  const dil = kok.dilSec ? kok.dilSec(metin, durum?.on_buro.dil) : kok
  if (!karar && durum) {
    const d = durum.on_buro
    const sira = dil.secim(metin)
    if (kural?.niyet === 'iptal') karar = { tur: 'birakildi', durum }
    else if (d.asama === 'kisi') {
      // Candidates come from OUR card and must still be this doctor's matches for this number.
      const adaylar = (d.adaylar || []).map((id) => b.hastalar.find((h) => h.id === id)).filter((h): h is EslesenHasta => !!h)
      let hasta: EslesenHasta | null = sira && sira <= adaylar.length ? adaylar[sira - 1] : null
      if (!hasta) {
        const yazilan = metin.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/)
        const uyan = adaylar.filter((h) => yazilan.includes(ilkAd(h.ad).toLocaleLowerCase('tr-TR')))
        if (uyan.length === 1) hasta = uyan[0]
      }
      if (hasta) karar = { tur: 'kisi_secildi', durum, hasta }
    } else if (d.asama === 'ad') {
      if (!kural && dil.randevuNiyeti(metin) === 'yok') {
        const ad = dil.adSoyad(metin)
        if (ad) karar = { tur: 'ad_geldi', durum, ad }
        else if ((d.adDeneme || 0) < 1 && !dil.soruMu(metin) && !dil.tibbiMi(metin)) karar = { tur: 'ad_tekrar', durum }
      }
    } else if (d.asama === 'slot') {
      if (sira) {
        if (sira <= durum.onerilen_slotlar.length) karar = { tur: 'slot_secildi', durum, sira }
      } else if (kural?.niyet !== 'onay') {
        const t = dil.tercih(metin, simdi, ON_BURO_SAAT_DILIMI)
        if (t) karar = { tur: 'yeniden_oner', durum, tercih: t }
      }
    }
  }
  if (!karar && ayar.randevuModu !== 'kapali' && dil.randevuNiyeti(metin) === 'istek') karar = { tur: 'randevu_istegi' }
  if (!karar) {
    // Confirm / cancel / reschedule words and a bare number belong to the existing pipeline.
    if (kural && (kural.niyet === 'onay' || kural.niyet === 'iptal' || kural.niyet === 'yeniden_planla')) return YOK
    if (dil.secim(metin)) return YOK
    if (!ayar.yanitAcik) return YOK
    if (dil.tibbiMi(metin)) karar = { tur: 'tibbi' }
    else if (dil.bilgiAlanlari(metin).length || dil.soruMu(metin)) karar = { tur: 'bilgi' }
    else return YOK
  }
  // A booking wish of a patient who already has an upcoming appointment is a possible SECOND booking: the doctor decides.
  if (karar.tur === 'randevu_istegi' && tek) {
    const hedef = await hedefRandevu(sb, doktorId, tek.id, simdi)
    if (hedef.ok || hedef.neden === 'birden_cok') return YOK
  }

  // ── Claim the card (one per inbound wamid) ──────────────────────────────────────────────────────────────────────────
  const randevuKarari = karar.tur !== 'acil' && karar.tur !== 'tibbi' && karar.tur !== 'bilgi'
  const durumHasta = 'durum' in karar ? karar.durum.patient_id : null
  const hastaId: string | null = karar.tur === 'kisi_secildi' ? karar.hasta.id : durumHasta ?? tek?.id ?? null
  let kartId: string | null = b.onceki?.id ?? null
  if (!kartId) {
    const { data: yeni, error } = await sb.from(KARTLAR).insert({
      doctor_id: doktorId, patient_id: hastaId, wamid: o.wamid, karsi_taraf_hash: hash, karsi_taraf_encrypted: encryptPII(b.numara),
      govde_encrypted: encryptPII(metin), tip: o.tip, niyet: randevuKarari ? 'randevu' : karar.tur === 'acil' ? 'diger' : 'soru',
      niyet_kaynagi: 'kural', eslesme: b.eslesme, durum: 'yeni',
    }).select('id').maybeSingle()
    if (error) {
      if (String(error.code) !== '23505') throw error
      const { data: e2 } = await sb.from(KARTLAR).select('id').eq('doctor_id', doktorId).eq('wamid', o.wamid).maybeSingle()
      kartId = e2?.id ? String(e2.id) : null
    } else kartId = yeni?.id ? String(yeni.id) : null
  }
  if (!kartId) throw new Error('on_buro_kart_yazilamadi')

  let yanitlandi = false
  const kartYaz = async (alanlar: Record<string, unknown>): Promise<void> => {
    const { error } = await sb.from(KARTLAR).update({ patient_id: hastaId, ...alanlar }).eq('id', kartId).eq('doctor_id', doktorId)
    if (error) throw error
  }
  const durumKapat = async (d: DurumKarti | null | undefined): Promise<void> => {
    if (d) await sb.from(KARTLAR).update({ on_buro: { ...d.on_buro, acik: false } }).eq('id', d.id).eq('doctor_id', doktorId)
  }

  // ── Limits (also the loop guard): no automatic reply beyond the caps — the card hands the conversation to the desk. ──
  const sinir = await yanitSiniri(sb, doktorId, hash, simdi)
  if (sinir.numara || sinir.doktor) {
    await kartYaz({ otomatik_eylem: karar.tur === 'acil' ? OB.acil : OB.sinir, eylem_sonucu: 'yanit_siniri', on_buro: { neden: sinir.numara ? 'numara' : 'doktor' } })
    await gunlukYaz(sb, { doktorId, patientId: hastaId, yon: 'olay', tur: 'on_buro_sinir', durum: 'olay', kaynakWamid: o.wamid, ayrinti: { kapsam: sinir.numara ? 'numara' : 'doktor' } })
    // "answered" on purpose: the fixed-sentence auto-reply of the ledger must not keep a loop alive either.
    return { ele: true, kart: true, yanitlandi: true }
  }

  const gonder = async (yazi: string, anahtar: string): Promise<boolean> => {
    let token = ''
    try { token = decryptPII(b.tokenSifreli) } catch { token = '' }
    if (!token) return false
    const r = await oturumMetniGonder(sb, { doktorId, phoneNumberId: b.phoneNumberId, token },
      { to: b.numara, metin: yazi, tur: TUR_ON_BURO, idemAnahtar: `ob:${o.wamid}:${anahtar}`, hastaId, kaynakWamid: o.wamid }, b.fetch, simdi)
    if (r.ok) yanitlandi = true
    return r.ok
  }
  const etiket = (iso: string) => dil.zamanEtiketi(iso, ON_BURO_SAAT_DILIMI)

  /** Propose up to three free times and leave an open 'slot' step. `onayli`: the pick will wait for the practice. */
  const oner = async (g: { tercih: SlotTercihi | null; onceki?: DurumKarti | null; ad?: string; onEk?: string; tur?: PortalTuru | null }): Promise<void> => {
    const eski = g.onceki?.on_buro
    const deneme = (eski?.asama === 'slot' ? eski.deneme || 1 : 0) + 1
    const ortak: OnBuroDurumu = { tur: eski?.tur, ad: g.ad ?? eski?.ad, gecmis: eski?.gecmis || [], gunler: eski?.gunler || [], deneme, dil: dil.kod }
    if (deneme > ONERI_SINIRI) {
      await gonder(dil.metin.oneriSiniri, 'sinir')
      await kartYaz({ otomatik_eylem: OB.slotOnerildi, eylem_sonucu: 'oneri_siniri', on_buro: { ...ortak, acik: false } })
      return
    }
    const rAyar = await ayarGetir(sb, doktorId)
    const tur = ortak.tur ?? turSec(rAyar, g.tur ?? dil.ziyaretTuru(metin), hastaId ? await mevcutHastaMi(sb, doktorId, hastaId) : false)
    const slotlar = tur ? await musaitSlotlar(sb, doktorId, rAyar, rAyar.turler[tur].sure, simdi.getTime() + ONERI_PAYI_DK * 60_000) : null
    const { secilen, tercihKarsilandi } = slotlar ? slotSec({ slotlar, tercih: g.tercih, onceki: ortak.gecmis, oncekiGunler: ortak.gunler }) : { secilen: [], tercihKarsilandi: true }
    if (!tur || !secilen.length) {
      await gonder(`${g.onEk ? `${g.onEk}\n` : ''}${dil.metin.slotYok}`, 'slot_yok')
      await kartYaz({ otomatik_eylem: OB.slotOnerildi, eylem_sonucu: !tur ? 'tur_kapali' : slotlar ? 'slot_yok' : 'takvim_okunamadi', on_buro: { ...ortak, tur: tur ?? undefined, acik: false } })
      return
    }
    const oneriler: Oneri[] = secilen.map((s) => ({ bas: s.bas, son: s.son, etiket: etiket(s.bas) }))
    const onayli = ayar.randevuModu !== 'otomatik' || !hastaId
    const bas = [g.onEk, tercihKarsilandi ? '' : dil.metin.tercihYok].filter(Boolean).join('\n')
    await gonder(`${bas ? `${bas}\n` : ''}${dil.metin.oneri(oneriler.map((x) => x.etiket), onayli)}`, 'oneri')
    await kartYaz({
      otomatik_eylem: OB.slotOnerildi, eylem_sonucu: 'oneri', onerilen_slotlar: oneriler,
      on_buro: { ...ortak, tur, acik: true, asama: 'slot', gecmis: [...(ortak.gecmis || []), ...oneriler.map((x) => x.bas)], gunler: Array.from(new Set([...(ortak.gunler || []), ...secilen.map((s) => s.gun)])), tercih: g.tercih },
    })
  }

  // ── Act ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
  switch (karar.tur) {
    case 'acil': {
      await gonder(dil.metin.acil, 'acil')
      await kartYaz({ otomatik_eylem: OB.acil, eylem_sonucu: 'acil' })
      await gunlukYaz(sb, { doktorId, patientId: hastaId, yon: 'olay', tur: 'on_buro_acil', durum: 'olay', kaynakWamid: o.wamid })
      break
    }
    case 'tibbi': {
      await gonder(dil.metin.tibbi, 'tibbi')
      await kartYaz({ otomatik_eylem: OB.tibbi, eylem_sonucu: 'hekime_iletildi' })
      break
    }
    case 'bilgi': {
      const { pseudonymize } = await import('@/lib/security/pseudonymize')
      const y = await bilgiYaniti({
        soru: metin,
        // The model sees the question with identifiers stripped, and the practice sheet. Nothing about the patient.
        modelSorusu: pseudonymize(metin.slice(0, 400), b.hastalar.map((h) => h.ad)).text,
        bilgi: ayar.bilgi, turetilmisSaatler: await turetilmisSaatler(sb, doktorId, dil), dil,
        model: b.model ?? ((i) => varsayilanBilgiModeli(i, doktorId)),
        modelIzni: () => modelHakkiAl(sb, doktorId, simdi),
      })
      await gonder(y.metin, 'bilgi')
      if (y.tur === 'yanit') await kartYaz({ otomatik_eylem: OB.yanit, eylem_sonucu: 'yanitlandi', on_buro: { yanit: encryptPII(y.metin), alanlar: y.alanlar, kaynak: y.kaynak ?? undefined } })
      else if (y.tur === 'tibbi') await kartYaz({ otomatik_eylem: OB.tibbi, eylem_sonucu: 'hekime_iletildi' })
      else if (y.tur === 'acil') await kartYaz({ otomatik_eylem: OB.acil, eylem_sonucu: 'acil' })
      else await kartYaz({ otomatik_eylem: OB.cevapsiz, eylem_sonucu: 'bekleme_yaniti', on_buro: { neden: y.neden } })
      break
    }
    case 'birakildi': {
      await gonder(dil.metin.istekBirakildi, 'birakildi')
      await kartYaz({ otomatik_eylem: OB.birakildi, eylem_sonucu: 'birakildi' })
      await durumKapat(karar.durum)
      break
    }
    case 'randevu_istegi': {
      const tercih = dil.tercih(metin, simdi, ON_BURO_SAAT_DILIMI)
      if (!b.hastalar.length) {
        // Unknown number: the privacy notice goes out BEFORE anything is asked. No patient row is created here.
        const { doktorAdi } = await doktorIletisimAyari(sb, doktorId)
        await gonder(`${dil.metin.gizlilik(doktorAdi || '')}\n\n${dil.metin.adSor}`, 'ad_sor')
        await kartYaz({ otomatik_eylem: OB.adSoruldu, eylem_sonucu: 'ad_soruldu', on_buro: { acik: true, asama: 'ad', dil: dil.kod, tercih, tur: turSec(await ayarGetir(sb, doktorId), dil.ziyaretTuru(metin), false) ?? undefined } })
      } else if (!tek) {
        // Several patients on one number: first names only, from this doctor's own matches. Nothing else is revealed.
        const adaylar = b.hastalar.slice(0, 5)
        await gonder(dil.metin.kimIcin(adaylar.map((h) => ilkAd(h.ad))), 'kim')
        await kartYaz({ otomatik_eylem: OB.kisiSoruldu, eylem_sonucu: 'kisi_soruldu', on_buro: { acik: true, asama: 'kisi', dil: dil.kod, adaylar: adaylar.map((h) => h.id), tercih } })
      } else await oner({ tercih })
      if (durum) await durumKapat(durum)
      break
    }
    case 'kisi_secildi': {
      const hedef = await hedefRandevu(sb, doktorId, karar.hasta.id, simdi)
      if (hedef.ok || hedef.neden === 'birden_cok') {
        // That person already has an upcoming appointment: a possible second booking is the doctor's call.
        await gonder(dil.metin.oneriSiniri, 'var')
        await kartYaz({ otomatik_eylem: OB.kisiSoruldu, eylem_sonucu: 'yeni_randevu_istegi' })
      } else await oner({ tercih: karar.durum.on_buro.tercih ?? null })
      await durumKapat(karar.durum)
      break
    }
    case 'ad_tekrar': {
      await gonder(dil.metin.adAnlasilmadi, 'ad_tekrar')
      await kartYaz({ otomatik_eylem: OB.adSoruldu, eylem_sonucu: 'ad_anlasilmadi', on_buro: { ...karar.durum.on_buro, acik: true, asama: 'ad', adDeneme: (karar.durum.on_buro.adDeneme || 0) + 1 } })
      await durumKapat(karar.durum)
      break
    }
    case 'ad_geldi': {
      const d = karar.durum.on_buro
      const adSifreli = encryptPII(karar.ad)
      if (ayar.randevuModu === 'kapali') {
        // Booking was switched off meanwhile: the request still reaches the desk with the name, without a time.
        await gonder(dil.metin.yeniHastaTalebi(null), 'talep')
        await kartYaz({ otomatik_eylem: OB.yeniHastaTalebi, eylem_sonucu: 'talep', on_buro: { ad: adSifreli, tur: d.tur, dil: dil.kod } })
      } else await oner({ tercih: d.tercih ?? null, ad: adSifreli, tur: d.tur ?? null })
      await durumKapat(karar.durum)
      break
    }
    case 'yeniden_oner': {
      await oner({ tercih: karar.tercih, onceki: karar.durum })
      await durumKapat(karar.durum)
      break
    }
    case 'slot_secildi': {
      const d = karar.durum.on_buro
      const slot = karar.durum.onerilen_slotlar[karar.sira - 1]
      const tur = d.tur ?? 'muayene'
      if (!hastaId) {
        // Unknown number: name + chosen time become a REQUEST for the desk. Approving it creates the patient (eylem.ts).
        await gonder(dil.metin.yeniHastaTalebi(etiket(slot.bas)), 'talep')
        await kartYaz({ otomatik_eylem: OB.yeniHastaTalebi, eylem_sonucu: 'talep', secilen_slot: slot.bas, on_buro: { ad: d.ad, tur, dil: dil.kod } })
      } else if (ayar.randevuModu === 'kapali') {
        await gonder(dil.metin.oneriSiniri, 'kapali')
        await kartYaz({ otomatik_eylem: OB.slotOnerildi, eylem_sonucu: 'kapali', secilen_slot: slot.bas })
      } else {
        const s = await randevuAc(sb, { doktorId, patientId: hastaId, tur, baslangic: slot.bas, mod: ayar.randevuModu, simdi })
        if (s.ok) {
          const talep = s.randevu.durum === 'talep'
          // Marker first (crash safety), then the calendar push and the patient's confirmation.
          await kartYaz({ otomatik_eylem: talep ? OB.talep : OB.otomatikRandevu, randevu_id: s.randevu.id, secilen_slot: slot.bas })
          await gunlukYaz(sb, { doktorId, patientId: hastaId, yon: 'olay', tur: talep ? 'on_buro_talep' : 'on_buro_randevu', durum: 'olay', kaynakWamid: o.wamid, ayrinti: { randevu_id: s.randevu.id } })
          if (!talep) await randevuSonrasi(sb, doktorId, s.randevu.id)
          await gonder(talep ? dil.metin.talepAlindi(etiket(slot.bas)) : dil.metin.randevuOlustu(etiket(slot.bas)), 'randevu')
          await kartYaz({ eylem_sonucu: talep ? 'talep' : 'randevu_olustu', on_buro: { tur, dil: dil.kod } })
        } else if (s.durum === 409) {
          // Taken between the proposal and the pick: say so and offer the next free times.
          await oner({ tercih: d.tercih ?? null, onceki: karar.durum, onEk: dil.metin.slotDoldu })
        } else {
          await gonder(dil.metin.oneriSiniri, 'olmadi')
          await kartYaz({ otomatik_eylem: OB.slotOnerildi, eylem_sonucu: s.durum === 429 ? 'acik_talep_siniri' : 'randevu_olmadi', secilen_slot: slot.bas })
        }
      }
      await durumKapat(karar.durum)
      break
    }
  }
  return { ele: true, kart: true, yanitlandi }
}

export type { OnBuroAyari }
