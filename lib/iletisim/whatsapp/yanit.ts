/**
 * WHATSAPP-API-01 — inbound patient messages → structured events, automatic actions, doctor inbox ("Gelen Yanıtlar").
 *
 * Called by the webhook for every `messages[]` entry (KalkanHam, yon 'gelen'). For each message:
 *   1. the doctor is the owner of the receiving phone_number_id (connection row) — never anything from the payload;
 *   2. the audit log gets an encrypted "alindi" row (KVKK) — its unique key makes webhook retries idempotent;
 *   3. the sender is matched to THAT doctor's patients only (eslestir.ts);
 *   4. the intent is found (niyet.ts: rules first, LLM only to label);
 *   5. automatic actions run ONLY when exactly one patient matched AND a rule (not the LLM) recognised the word:
 *        EVET  → the patient's upcoming appointment is confirmed          (randevuEylem.randevuTeyit)
 *        İPTAL → that appointment is cancelled, the doctor sees a flagged card   (randevuEylem.randevuIptal)
 *        STOP/DUR → WhatsApp consent flips to false for the matching patient(s)   (vazgecUygula, same column as SMS/e-mail)
 *        "ertele / başka gün" → up to 3 free times are proposed; a bare "1/2/3" back picks one for the doctor to approve
 *      Everything else (questions, anything the LLM labelled, ambiguous numbers or appointments) only becomes a card.
 *   6. a card row (whatsapp_yanitlar) is written for matched patients and for anything that is not plain chatter.
 *
 * Crash safety: the card row is written BEFORE the actions and `eylem_sonucu` is set after them. A webhook retry (Meta
 * re-delivers until it gets 200) resumes a row whose `eylem_sonucu` is empty; the actions are idempotent and every reply is
 * protected by its own idempotency key, so nothing is done twice.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPII, encryptPII } from '@/lib/security/encryption'
import { tabloYokMu } from '@/lib/iletisim/sunucu'
import { vazgecUygula } from '@/lib/iletisim/vazgecUygula'
import { siniflandir as kalkanSinif } from '@/lib/iletisim/kalkan/sinif'
import type { KalkanHam } from '@/lib/iletisim/otomatik/whatsapp/webhook'
import { TABLO } from '@/lib/iletisim/otomatik/whatsapp/depo'
import { gunlukYaz, karsiTarafIzi, GUNLUK } from '@/lib/iletisim/otomatik/whatsapp/gunluk'
import type { FetchFn } from '@/lib/iletisim/otomatik/whatsapp/graph'
import { hastalariEslestir, numaraRakam, type EslesmeTuru } from './eslestir'
import { niyetBul, slotSecimi, type Niyet, type NiyetSonucu, type SiniflandirmaFn } from './niyet'
import { hedefRandevu, randevuIptal, randevuTeyit, slotOner, type OnerilenSlot } from './randevuEylem'
import { oturumMetniGonder, SABIT, OTURUM_PENCERESI_MS } from './serbest'

export const YANITLAR = 'whatsapp_yanitlar'

export interface YanitDeps {
  llm?: SiniflandirmaFn
  fetch?: FetchFn
  simdi?: Date
}

export interface YanitOzeti {
  /** Messages this pipeline answered itself: the Kalkan fixed-sentence auto-reply must stay quiet for them. */
  yanitlananlar: Set<string>
  islenen: number
  kart: number
  /** true when something failed that a webhook retry can fix (the route then answers 5xx so Meta re-delivers). */
  tekrarGerekli: boolean
}

type KartSatiri = { id: string; eylem_sonucu: string | null }

export function slotMetni(slotlar: OnerilenSlot[]): string {
  return `Size uygun zamanlar:\n${slotlar.map((s, i) => `${i + 1}) ${s.etiket}`).join('\n')}\nSeçmek için numarasını yazın; hekimimiz onaylayacaktır.`
}

async function acikOneri(sb: SupabaseClient, doktorId: string, patientId: string, simdi: Date): Promise<{ id: string; slotlar: OnerilenSlot[] } | null> {
  const { data } = await sb.from(YANITLAR).select('id, onerilen_slotlar, secilen_slot, created_at')
    .eq('doctor_id', doktorId).eq('patient_id', patientId).eq('otomatik_eylem', 'slot_onerildi')
    .gte('created_at', new Date(simdi.getTime() - OTURUM_PENCERESI_MS).toISOString())
    .order('created_at', { ascending: false }).limit(1)
  const r = data?.[0]
  if (!r || r.secilen_slot || !Array.isArray(r.onerilen_slotlar) || !r.onerilen_slotlar.length) return null
  return { id: String(r.id), slotlar: r.onerilen_slotlar as OnerilenSlot[] }
}

export async function yanitIsle(sb: SupabaseClient, olaylar: KalkanHam[], deps: YanitDeps = {}): Promise<YanitOzeti> {
  const ozet: YanitOzeti = { yanitlananlar: new Set(), islenen: 0, kart: 0, tekrarGerekli: false }
  for (const o of olaylar) {
    if (o.yon !== 'gelen') continue
    try {
      const r = await birMesaj(sb, o, deps)
      if (r.yanitlandi) ozet.yanitlananlar.add(o.wamid)
      if (r.islendi) ozet.islenen++
      if (r.kart) ozet.kart++
    } catch (e) {
      // A table that does not exist yet (migration 169 not applied) is "feature not live", not a fault to retry.
      if (!tabloYokMu(e)) {
        ozet.tekrarGerekli = true
        console.error('[whatsapp-yanit]', e instanceof Error ? e.message : 'bilinmeyen')
      }
    }
  }
  return ozet
}

async function birMesaj(sb: SupabaseClient, o: KalkanHam, deps: YanitDeps): Promise<{ islendi: boolean; kart: boolean; yanitlandi: boolean }> {
  const simdi = deps.simdi ?? new Date()
  // 1) Whose number received this? (connection row by phone_number_id; only a live connection)
  const { data: bag, error: bagHata } = await sb.from(TABLO).select('doctor_id, phone_number_id, token_encrypted, durum')
    .eq('phone_number_id', o.phoneNumberId).eq('durum', 'bagli').maybeSingle()
  if (bagHata) throw bagHata
  if (!bag?.doctor_id) return { islendi: false, kart: false, yanitlandi: false }
  const doktorId = String(bag.doctor_id)

  // 2) Already finished? (webhook retry)
  const { data: kartVar, error: vErr } = await sb.from(YANITLAR).select('id, eylem_sonucu').eq('doctor_id', doktorId).eq('wamid', o.wamid).maybeSingle()
  if (vErr) throw vErr
  const onceki = kartVar as KartSatiri | null
  if (onceki?.eylem_sonucu) return { islendi: false, kart: false, yanitlandi: false }

  // 3) Match the sender inside THIS doctor's roster.
  const es = await hastalariEslestir(sb, doktorId, o.karsiNumara)
  const tek = es.hastalar.length === 1 ? es.hastalar[0] : null
  const numara = numaraRakam(o.karsiNumara)

  // 4) Audit (idempotent through the unique inbound key; a duplicate is fine on resume).
  const denetim = await gunlukYaz(sb, {
    doktorId, patientId: tek?.id ?? null, yon: 'gelen', tur: 'yanit', durum: 'alindi', wamid: o.wamid, karsiTaraf: numara, govde: o.govde || null,
    ayrinti: { tip: o.tip, eslesme: es.eslesme },
  })
  if (!denetim.ok && !denetim.tekrar) throw new Error('gunluk_yazilamadi')

  // 5) Intent. A bare "1/2/3" right after our proposal is a slot choice, not a question for the model.
  let secim: { oneri: { id: string; slotlar: OnerilenSlot[] }; sira: number } | null = null
  if (tek) {
    const sira = slotSecimi(o.govde)
    if (sira) {
      const oneri = await acikOneri(sb, doktorId, tek.id, simdi)
      if (oneri && sira <= oneri.slotlar.length) secim = { oneri, sira }
    }
  }
  const niyet: NiyetSonucu = secim
    ? { niyet: 'yeniden_planla', kaynak: 'kural', guven: 1 }
    : await niyetBul(o.govde, { llm: deps.llm, bilinenAdlar: es.hastalar.map((h) => h.ad) })

  // 6) Card row first (claim), actions second.
  const kirmizi = ['kirmizi', 'tibbi'].includes(kalkanSinif({ metin: o.govde, tip: o.tip }).sinif)
  const kartGerekli = es.hastalar.length > 0 || niyet.niyet !== 'diger'
  let kartId = onceki?.id ?? null
  if (kartGerekli && !kartId) {
    const { data: yeni, error } = await sb.from(YANITLAR).insert({
      doctor_id: doktorId,
      patient_id: tek?.id ?? null,
      wamid: o.wamid,
      karsi_taraf_hash: karsiTarafIzi(numara),
      karsi_taraf_encrypted: encryptPII(numara),
      govde_encrypted: o.govde ? encryptPII(o.govde) : null,
      tip: o.tip,
      niyet: niyet.niyet,
      niyet_kaynagi: niyet.kaynak,
      eslesme: es.eslesme,
      durum: 'yeni',
    }).select('id').maybeSingle()
    if (error) {
      if (String(error.code) !== '23505') throw error
      const { data: e2 } = await sb.from(YANITLAR).select('id').eq('doctor_id', doktorId).eq('wamid', o.wamid).maybeSingle()
      kartId = e2?.id ? String(e2.id) : null
    } else kartId = yeni?.id ? String(yeni.id) : null
  }

  // 7) Automatic actions — exactly one matched patient, and a RULE recognised the word.
  const gonder = async (metin: string, tur: string, anahtar: string): Promise<boolean> => {
    let token = ''
    try { token = decryptPII(String(bag.token_encrypted || '')) } catch { token = '' }
    if (!token) return false
    const r = await oturumMetniGonder(sb, { doktorId, phoneNumberId: o.phoneNumberId, token }, { to: numara, metin, tur, idemAnahtar: `yanit:${o.wamid}:${anahtar}`, hastaId: tek?.id ?? null, kaynakWamid: o.wamid }, deps.fetch, simdi)
    return r.ok
  }
  let otomatikEylem: string | null = kirmizi ? 'acil_uyari' : null
  let eylemSonucu = 'tamam'
  let randevuId: string | null = null
  let slotlar: OnerilenSlot[] | null = null
  let secilen: string | null = null
  let yanitlandi = false

  if (niyet.niyet === 'vazgec' && niyet.kaynak === 'kural' && es.hastalar.length) {
    // STOP / DUR: the number asked to stop. Every patient of this doctor on that number (siblings on a parent's phone) is opted out.
    for (const h of es.hastalar) await vazgecUygula(sb, doktorId, h.id, 'whatsapp')
    await gunlukYaz(sb, { doktorId, patientId: tek?.id ?? null, yon: 'olay', tur: 'vazgec_uygulandi', durum: 'olay', kaynakWamid: o.wamid, ayrinti: { hasta_sayisi: es.hastalar.length } })
    otomatikEylem = 'vazgec_uygulandi'
    yanitlandi = await gonder(SABIT.vazgec, 'otomatik_yanit', 'vazgec')
  } else if (tek && niyet.kaynak === 'kural' && (niyet.niyet === 'onay' || niyet.niyet === 'iptal' || niyet.niyet === 'yeniden_planla')) {
    const hedef = await hedefRandevu(sb, doktorId, tek.id, simdi)
    if (secim) {
      // The patient picked a proposed time: it waits for the doctor's one-tap approval — nothing moves on its own.
      const s = secim.oneri.slotlar[secim.sira - 1]
      if (hedef.ok) randevuId = hedef.randevu.id
      secilen = s.bas
      otomatikEylem = 'slot_secildi'
      await sb.from(YANITLAR).update({ secilen_slot: s.bas }).eq('id', secim.oneri.id).eq('doctor_id', doktorId)
      yanitlandi = await gonder(SABIT.secimAlindi, 'otomatik_yanit', 'secim')
    } else if (!hedef.ok) {
      if (niyet.niyet === 'iptal' && hedef.neden === 'yok' && !hedef.hatirlatmaVardi) {
        // Nothing to cancel and no reminder behind the word: "İPTAL" keeps the meaning it has on the SMS channel — stop messages.
        await vazgecUygula(sb, doktorId, tek.id, 'whatsapp')
        await gunlukYaz(sb, { doktorId, patientId: tek.id, yon: 'olay', tur: 'vazgec_uygulandi', durum: 'olay', kaynakWamid: o.wamid, ayrinti: { kaynak: 'iptal_kelimesi' } })
        otomatikEylem = 'vazgec_uygulandi'
        yanitlandi = await gonder(SABIT.vazgec, 'otomatik_yanit', 'vazgec')
      } else {
        eylemSonucu = hedef.neden === 'birden_cok' ? 'birden_cok_randevu' : 'randevu_yok'
      }
    } else {
      randevuId = hedef.randevu.id
      if (niyet.niyet === 'onay') {
        const s = await randevuTeyit(sb, doktorId, tek.id, hedef.randevu, simdi)
        if (s === 'olmadi') eylemSonucu = 'teyit_olmadi'
        else {
          otomatikEylem = 'randevu_onaylandi'
          await gunlukYaz(sb, { doktorId, patientId: tek.id, yon: 'olay', tur: 'randevu_onaylandi', durum: 'olay', kaynakWamid: o.wamid, ayrinti: { randevu_id: randevuId } })
          yanitlandi = await gonder(SABIT.onay, 'otomatik_yanit', 'onay')
        }
      } else if (niyet.niyet === 'iptal') {
        const s = await randevuIptal(sb, doktorId, tek.id, hedef.randevu, simdi)
        if (s.sonuc === 'olmadi') eylemSonucu = 'iptal_olmadi'
        else {
          otomatikEylem = s.gec ? 'randevu_iptal_gec' : 'randevu_iptal'
          await gunlukYaz(sb, { doktorId, patientId: tek.id, yon: 'olay', tur: 'randevu_iptal', durum: 'olay', kaynakWamid: o.wamid, ayrinti: { randevu_id: randevuId, gec: s.gec } })
          yanitlandi = await gonder(SABIT.iptal, 'otomatik_yanit', 'iptal')
        }
      } else {
        const oneriler = await slotOner(sb, doktorId, hedef.randevu, simdi)
        if (oneriler.length) {
          slotlar = oneriler
          otomatikEylem = 'slot_onerildi'
          yanitlandi = await gonder(slotMetni(oneriler), 'otomatik_yanit', 'oneri')
        } else eylemSonucu = 'slot_yok'
      }
    }
  }

  // 8) Record what happened on the card.
  if (kartId) {
    await sb.from(YANITLAR).update({
      patient_id: tek?.id ?? null,
      randevu_id: randevuId,
      otomatik_eylem: otomatikEylem,
      eylem_sonucu: eylemSonucu,
      ...(slotlar ? { onerilen_slotlar: slotlar } : {}),
      ...(secilen ? { secilen_slot: secilen } : {}),
    }).eq('id', kartId).eq('doctor_id', doktorId)
  }
  return { islendi: true, kart: !!kartId, yanitlandi }
}

export type { Niyet, EslesmeTuru }
export { GUNLUK }
