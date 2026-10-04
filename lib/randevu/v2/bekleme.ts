/**
 * NOTYA-RANDEVU-V2 PR3 — waitlist: "daha erken bir saat çıkarsa haber ver".
 *
 *   • The patient puts one of their upcoming appointments on the list (portal). en_gec = that appointment's start.
 *   • Each cron tick (outside quiet hours), for every doctor whose switch is ON, waiting entries are walked IN ORDER
 *     (oldest first). The earliest free slot of the right length that starts before the entry's appointment, and is
 *     not already offered to anyone, is offered to that one patient — by e-mail (consent + the doctor's own mailbox,
 *     the existing path) and in the portal. An entry holds at most one open offer.
 *   • An unanswered offer expires after TEKLIF_SURESI_SAAT; the slot then goes to the next patient in line.
 *   • The first to accept gets it: their appointment is moved to the slot through hastaIslem('ertele') — the same
 *     path as a patient reschedule, so the slot is re-validated, the DB guarantee applies, and under the default
 *     approval mode it becomes a request (talep) the practice approves.
 * Slots are bare times; nobody learns whose appointment was cancelled.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { doktorIletisimAyari, hastaIletisimi, tabloYokMu } from '@/lib/iletisim/sunucu'
import { sessizSaatMi } from '@/lib/iletisim/otomatikGonderim'
import { siteAdresi } from '@/lib/iletisim/otomatik/eposta/ayar'
import { ayarGetir, hastaIslem, musaitSlotlar, olayYaz, type Islem } from './sunucu'
import { hastaIzinleri } from './durum'
import { randevuJetonu } from './jeton'
import { randevuEpostasi } from './eposta'
import { epostaKanali, type RandevuKanali } from './kanal'
import { gunEtiketi, saatEtiketi } from './zaman'
import type { Slot } from './slot'

type Sb = SupabaseClient

export const TEKLIF_SURESI_SAAT = 2
/** An offer is worth sending only if it is meaningfully earlier than what the patient already has. */
export const EN_AZ_ONCE_DK = 60

export type BeklemeDurumu = { kayitli: boolean; teklif: { id: string; gun: string; saat: string } | null }

const hata = (durum: number, h: string): Islem<never> => ({ ok: false, durum, hata: h })

export async function beklemeyeEkle(sb: Sb, g: { doktorId: string; patientId: string; randevuId: string; simdi?: number }): Promise<{ ok: true } | { ok: false; durum: number; hata: string }> {
  const simdi = g.simdi ?? Date.now()
  const ayar = await ayarGetir(sb, g.doktorId)
  if (!ayar.acik) return { ok: false, durum: 403, hata: 'Online randevu şu an kapalı.' }
  const { data: r } = await sb.from('randevular').select('id, baslangic, bitis, durum, hasta_teyit_at, oneri_at')
    .eq('id', g.randevuId).eq('doktor_id', g.doktorId).eq('patient_id', g.patientId).maybeSingle()
  if (!r) return { ok: false, durum: 404, hata: 'Randevu bulunamadı.' }
  if (!hastaIzinleri(r, ayar, simdi).ertele) return { ok: false, durum: 409, hata: 'Bu randevu için bekleme listesine girilemez.' }
  const { error } = await sb.from('randevu_bekleme_listesi').insert({
    doktor_id: g.doktorId,
    patient_id: g.patientId,
    randevu_id: r.id,
    sure_dk: Math.max(5, Math.round((Date.parse(r.bitis) - Date.parse(r.baslangic)) / 60000)),
    en_gec: r.baslangic,
    durum: 'bekliyor',
  })
  // 23505: already on the list for this appointment — same outcome.
  if (error && (error as { code?: string }).code !== '23505') return { ok: false, durum: tabloYokMu(error) ? 503 : 500, hata: 'Bekleme listesine eklenemedi.' }
  await olayYaz(sb, { randevuId: r.id, doktorId: g.doktorId, olay: 'bekleme_listesi', yapan: 'hasta' })
  return { ok: true }
}

export async function beklemedenCik(sb: Sb, g: { doktorId: string; patientId: string; randevuId: string }): Promise<void> {
  const { data } = await sb.from('randevu_bekleme_listesi').update({ durum: 'iptal', updated_at: new Date().toISOString() })
    .eq('randevu_id', g.randevuId).eq('doktor_id', g.doktorId).eq('patient_id', g.patientId).eq('durum', 'bekliyor').select('id')
  for (const b of data || []) {
    await sb.from('randevu_bekleme_teklifleri').update({ durum: 'gecersiz', updated_at: new Date().toISOString() })
      .eq('bekleme_id', b.id).eq('doktor_id', g.doktorId).eq('durum', 'acik').then(() => undefined, () => undefined)
  }
}

/** Per own appointment: on the list? an open offer? (portal list) */
export async function hastaBeklemeleri(sb: Sb, doktorId: string, patientId: string, simdi: number = Date.now()): Promise<Map<string, BeklemeDurumu>> {
  const out = new Map<string, BeklemeDurumu>()
  const { data, error } = await sb.from('randevu_bekleme_listesi').select('id, randevu_id')
    .eq('doktor_id', doktorId).eq('patient_id', patientId).eq('durum', 'bekliyor').limit(20)
  if (error || !data?.length) return out
  const { data: teklifler } = await sb.from('randevu_bekleme_teklifleri').select('id, bekleme_id, baslangic, son_gecerlilik')
    .eq('doktor_id', doktorId).eq('durum', 'acik').in('bekleme_id', data.map((b) => b.id))
  for (const b of data) {
    const t = (teklifler || []).find((x) => x.bekleme_id === b.id && Date.parse(String(x.son_gecerlilik)) > simdi)
    out.set(String(b.randevu_id), { kayitli: true, teklif: t ? { id: String(t.id), gun: gunEtiketi(String(t.baslangic)), saat: saatEtiketi(String(t.baslangic)) } : null })
  }
  return out
}

type Teklif = { id: string; doktor_id: string; bekleme_id: string; baslangic: string; bitis: string; son_gecerlilik: string; durum: string }
type Bekleme = { id: string; doktor_id: string; patient_id: string; randevu_id: string | null; sure_dk: number; en_gec: string; durum: string; created_at?: string }

/**
 * Accept an offer. `patientId`, when given (portal), must own the waitlist entry; from an e-mail link the signed
 * offer id is the proof and the entry's own patient is used.
 */
export async function teklifKabul(sb: Sb, g: { teklifId: string; doktorId?: string; patientId?: string; kanal: 'portal' | 'eposta'; simdi?: number }): Promise<Islem> {
  const simdi = g.simdi ?? Date.now()
  let q = sb.from('randevu_bekleme_teklifleri').select('id, doktor_id, bekleme_id, baslangic, bitis, son_gecerlilik, durum').eq('id', g.teklifId)
  if (g.doktorId) q = q.eq('doktor_id', g.doktorId)
  const { data: t } = await q.maybeSingle()
  const teklif = t as Teklif | null
  if (!teklif) return hata(404, 'Teklif bulunamadı.')
  if (teklif.durum !== 'acik' || Date.parse(teklif.son_gecerlilik) <= simdi) return hata(409, 'Bu teklifin süresi doldu ya da saat başka bir hastaya verildi.')
  let bq = sb.from('randevu_bekleme_listesi').select('id, doktor_id, patient_id, randevu_id, durum').eq('id', teklif.bekleme_id).eq('doktor_id', teklif.doktor_id)
  if (g.patientId) bq = bq.eq('patient_id', g.patientId)
  const { data: b } = await bq.maybeSingle()
  const bekleme = b as Bekleme | null
  if (!bekleme || bekleme.durum !== 'bekliyor' || !bekleme.randevu_id) return hata(404, 'Teklif bulunamadı.')

  const s = await hastaIslem(sb, { doktorId: teklif.doktor_id, patientId: bekleme.patient_id, randevuId: bekleme.randevu_id, islem: 'ertele', baslangic: teklif.baslangic, kanal: g.kanal, simdi })
  const zaman = new Date().toISOString()
  if (!s.ok) {
    if (s.durum === 409) await sb.from('randevu_bekleme_teklifleri').update({ durum: 'gecersiz', updated_at: zaman }).eq('id', teklif.id).eq('doktor_id', teklif.doktor_id)
    return s
  }
  await sb.from('randevu_bekleme_teklifleri').update({ durum: 'kabul', updated_at: zaman }).eq('id', teklif.id).eq('doktor_id', teklif.doktor_id)
  await sb.from('randevu_bekleme_listesi').update({ durum: 'kabul', updated_at: zaman }).eq('id', bekleme.id).eq('doktor_id', teklif.doktor_id)
  await olayYaz(sb, { randevuId: bekleme.randevu_id, doktorId: teklif.doktor_id, olay: 'bekleme_teklif_kabul', yapan: 'hasta', detay: { kanal: g.kanal, yeni: teklif.baslangic } })
  return s
}

export type TeklifOzeti = { suresiDolan: number; teklif: number; eposta: number }

/** Cron: expire offers, then offer free earlier slots to waiting patients in order. Never throws. */
export async function teklifTara(sb: Sb, o: { simdi?: number; bitis: number; kanal?: RandevuKanali }): Promise<TeklifOzeti> {
  const simdi = o.simdi ?? Date.now()
  const ozet: TeklifOzeti = { suresiDolan: 0, teklif: 0, eposta: 0 }
  try {
    const { data: dolan } = await sb.from('randevu_bekleme_teklifleri').update({ durum: 'suresi_doldu', updated_at: new Date(simdi).toISOString() })
      .eq('durum', 'acik').lte('son_gecerlilik', new Date(simdi).toISOString()).select('id')
    ozet.suresiDolan = dolan?.length || 0
    // Offers carry a short deadline: none are made at night, when nobody could answer in time.
    if (sessizSaatMi(new Date(simdi))) return ozet

    const { data: liste, error } = await sb.from('randevu_bekleme_listesi').select('id, doktor_id, patient_id, randevu_id, sure_dk, en_gec, durum, created_at')
      .eq('durum', 'bekliyor').order('created_at', { ascending: true }).limit(500)
    if (error || !liste?.length) return ozet
    const kanal = o.kanal ?? epostaKanali()
    const doktorlar = Array.from(new Set(liste.map((b) => String(b.doktor_id))))
    for (const doktorId of doktorlar) {
      if (Date.now() > o.bitis) break
      const ayar = await ayarGetir(sb, doktorId)
      if (!ayar.acik) continue
      const { data: acik } = await sb.from('randevu_bekleme_teklifleri').select('bekleme_id, baslangic').eq('doktor_id', doktorId).eq('durum', 'acik')
      const teklifte = new Set((acik || []).map((x) => Date.parse(String(x.baslangic))))
      const acikBekleme = new Set((acik || []).map((x) => String(x.bekleme_id)))
      const slotOnbellek = new Map<number, Slot[] | null>()
      const iletisim = await doktorIletisimAyari(sb, doktorId)
      for (const b of (liste as Bekleme[]).filter((x) => String(x.doktor_id) === doktorId)) {
        if (Date.now() > o.bitis) break
        if (acikBekleme.has(b.id) || !b.randevu_id) continue
        // The appointment must still be the patient's, active and movable; otherwise the entry closes.
        const { data: r } = await sb.from('randevular').select('id, baslangic, bitis, durum, hasta_teyit_at, oneri_at')
          .eq('id', b.randevu_id).eq('doktor_id', doktorId).eq('patient_id', b.patient_id).maybeSingle()
        if (!r || !hastaIzinleri(r, ayar, simdi).ertele || Date.parse(r.baslangic) !== Date.parse(b.en_gec)) {
          await sb.from('randevu_bekleme_listesi').update({ durum: 'iptal', updated_at: new Date().toISOString() }).eq('id', b.id).eq('doktor_id', doktorId)
          continue
        }
        if (!slotOnbellek.has(b.sure_dk)) slotOnbellek.set(b.sure_dk, await musaitSlotlar(sb, doktorId, ayar, b.sure_dk, simdi))
        const slotlar = slotOnbellek.get(b.sure_dk)
        if (!slotlar) continue
        const { data: gecmis } = await sb.from('randevu_bekleme_teklifleri').select('baslangic').eq('bekleme_id', b.id).eq('doktor_id', doktorId)
        const dahaOnce = new Set((gecmis || []).map((x) => Date.parse(String(x.baslangic))))
        const sinir = Date.parse(b.en_gec) - EN_AZ_ONCE_DK * 60_000
        const slot = slotlar.find((s) => {
          const t = Date.parse(s.bas)
          return t < sinir && !teklifte.has(t) && !dahaOnce.has(t)
        })
        if (!slot) continue
        const son = simdi + TEKLIF_SURESI_SAAT * 3_600_000
        const { data: yeni, error: e } = await sb.from('randevu_bekleme_teklifleri').insert({
          doktor_id: doktorId, bekleme_id: b.id, baslangic: slot.bas, bitis: slot.son, son_gecerlilik: new Date(son).toISOString(), durum: 'acik',
        }).select('id').single()
        if (e || !yeni) continue
        teklifte.add(Date.parse(slot.bas))
        ozet.teklif++
        await olayYaz(sb, { randevuId: b.randevu_id, doktorId, olay: 'bekleme_teklif', yapan: 'sistem', detay: { baslangic: slot.bas } })
        const hasta = await hastaIletisimi(sb, doktorId, b.patient_id, iletisim.brans)
        if (!hasta) continue
        const jeton = randevuJetonu(String(yeni.id), 'teklif', son)
        const m = randevuEpostasi('bekleme_teklif', {
          hastaAdi: hasta.ad, veliDili: hasta.veliDili, doktorAdi: iletisim.doktorAdi, randevuIso: slot.bas,
          linkler: jeton ? { teklif: `${siteAdresi()}/randevu/${jeton}` } : {},
        })
        const s = await kanal.gonder(sb, { doktorId, randevuId: b.randevu_id, baslangicIso: slot.bas, tur: 'bekleme_teklif', hasta, konu: m.konu, metin: m.metin })
        if (s.durum === 'gonderildi') ozet.eposta++
      }
    }
  } catch {
    /* next tick */
  }
  return ozet
}
