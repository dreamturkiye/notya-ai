/**
 * NOTYA-ULKE-PORTAL-01 — WHAT THE PATIENT SEES. One read, for one signed-in portal session.
 *
 *   their name · their doctor's name and specialty as the pack names it · upcoming appointments, in the country's
 *   own format and in the doctor's time zone · the summaries the doctor has chosen to share · their own request for
 *   an appointment and its outcome
 *
 * IN THE PATIENT'S OWN LANGUAGE: the language recorded for the patient; where that language has several scripts, the
 * one the doctor uses (lib/ulke/arayuz/dilSecimi.ts → hastaIcinBicim). The server decides it from the record; the
 * page shows the catalogue of that form.
 *
 * ISOLATION — EVERY READ IS BOUND TO COUNTRY, DOCTOR AND PATIENT. The doctor's id and the patient's id come from the
 * session's own row (lib/ulke/portal/giris.ts) and from nowhere else: this function takes NO id from a request.
 * Each table is read by doctor AND patient in the same statement, through the country's one door. A row that points
 * at another patient is not shown, it does not borrow anything.
 *
 * WHAT IS NEVER HERE: the clinical note (no statement in this file reads a note's text), the transcript, an
 * unshared summary, the doctor's own note on an appointment, another patient, a phone number, an identity number.
 */
import { decrypt } from '@/lib/security/encryption'
import { hastaIcinBicim } from '../arayuz/dilSecimi'
import { rolAdi } from '../arayuz'
import type { DilKodu } from '../tipler'
import { ozellikAcik, ulkePaketi, uygulamaDiliMi } from '../ulke'
import { hastaGetir } from '../uygulama/hastalar'
import { hekimDilleri } from '../uygulama/muayeneKaydi'
import { hastaninRandevulari } from '../uygulama/randevular'
import { hekimRolunuOku } from '../uygulama/rol'
import { hesapSaatDilimi } from '../uygulama/saatDilimi'
import { ulkeTablosu } from '../uygulama/tablolar'
import { yerelAn } from '../uygulama/zaman'
import type { PortalOturumu } from './giris'
import { hastaninSonIstegi, istekAcik, istekGunleri } from './istek'
import type { PortalIcerigi } from './tipler'

export type { PortalIcerigi } from './tipler'

const coz = (ham: unknown): string => {
  if (typeof ham !== 'string' || !ham) return ''
  try { return decrypt(ham) } catch { return '' }
}

/** null = the session's patient or doctor is not there any more: the caller answers as for no session at all. */
export async function portalIcerigi(o: PortalOturumu, simdi = Date.now()): Promise<PortalIcerigi | null> {
  const { supabase, doktorId, hastaId } = o
  // The patient, by doctor AND id AND country. Everything below is read for this pair and for nobody else.
  const hasta = await hastaGetir(supabase, doktorId, hastaId)
  if (!hasta) return null
  const { data: hesap } = await ulkeTablosu(supabase, 'ulke_hesaplari').select('full_name').eq('id', doktorId).maybeSingle()
  if (!hesap) return null
  const h = await hekimDilleri(supabase, doktorId)
  const paket = ulkePaketi()
  const dil = hastaIcinBicim(paket.uygulama?.dilGruplari ?? [], hasta.dil, { dil: h.arayuzDili, notDili: h.notDili })
  const dilim = await hesapSaatDilimi(supabase, doktorId)

  let randevular: PortalIcerigi['randevular'] = null
  if (ozellikAcik('randevu')) {
    const hepsi = (await hastaninRandevulari(supabase, doktorId, hastaId, simdi)) ?? []
    // Upcoming: still planned (or the patient has arrived) and not over. The reason is the doctor's note: not shown.
    randevular = hepsi.filter((r) => (r.durum === 'planlandi' || r.durum === 'geldi') && r.hastaId === hastaId && new Date(r.bitis).getTime() > simdi).map((r) => ({ gun: r.gun, saat: r.saat, sureDk: r.sureDk }))
  }

  // SHARED summaries only (`paylasildi_at` is set), by doctor AND patient. Read on every request: a summary the
  // doctor took back a moment ago is not in this answer.
  const { data: oz } = await ulkeTablosu(supabase, 'ulke_hasta_ozetleri')
    .select('id, note_id, dil, ozet_encrypted, paylasildi_at')
    .eq('doctor_id', doktorId)
    .eq('patient_id', hastaId)
    .not('paylasildi_at', 'is', null)
  const ozetSatirlari = (oz as { id: string; note_id: string; dil: string; ozet_encrypted: string | null; paylasildi_at: string | null }[] | null) ?? []
  let ozetler: PortalIcerigi['ozetler'] = []
  if (ozetSatirlari.length) {
    // The day of each summary's visit: the note (approved, this doctor's) → its visit (this doctor's AND this
    // patient's). Only ids and dates are selected — never a note's text. A summary whose note is not approved or
    // whose visit is not this patient's is left out.
    const { data: notlar } = await ulkeTablosu(supabase, 'ulke_notlar').select('id, session_id, approved_at').eq('doctor_id', doktorId).in('id', ozetSatirlari.map((x) => x.note_id))
    const notHaritasi = new Map(((notlar as { id: string; session_id: string; approved_at: string | null }[] | null) ?? []).filter((n) => n.approved_at).map((n) => [n.id, n.session_id]))
    const { data: muayeneler } = await ulkeTablosu(supabase, 'ulke_muayeneler').select('id, started_at').eq('doctor_id', doktorId).eq('patient_id', hastaId).in('id', [...notHaritasi.values()])
    const gunHaritasi = new Map(((muayeneler as { id: string; started_at: string | null }[] | null) ?? []).map((m) => [m.id, m.started_at ? yerelAn(m.started_at, dilim).gun : '']))
    ozetler = ozetSatirlari
      .filter((x) => x.paylasildi_at && notHaritasi.has(x.note_id) && gunHaritasi.has(notHaritasi.get(x.note_id) as string))
      .map((x) => ({ id: x.id, gun: gunHaritasi.get(notHaritasi.get(x.note_id) as string) ?? '', metin: coz(x.ozet_encrypted) }))
      .filter((x) => x.metin.trim())
      .sort((a, b) => (a.gun < b.gun ? 1 : a.gun > b.gun ? -1 : 0))
  }

  let istek: PortalIcerigi['istek'] = null
  if (istekAcik()) {
    const son = await hastaninSonIstegi(supabase, doktorId, hastaId)
    istek = {
      gunler: istekGunleri(simdi, dilim),
      son: son ? { durum: son.istek.durum, gunler: son.istek.gunler, olusturuldu: son.istek.olusturuldu, randevu: son.randevu ? { gun: son.randevu.gun, saat: son.randevu.saat } : null } : null,
    }
  }

  const rol = await hekimRolunuOku(supabase, doktorId)
  return {
    dil: uygulamaDiliMi(dil) ? dil : paket.varsayilanDil,
    hasta: { ad: [hasta.ad, hasta.otaIsmi].filter(Boolean).join(' ') },
    hekim: { ad: String((hesap as { full_name?: unknown }).full_name ?? ''), rol: (rol ? rolAdi(rol, dil) : null) ?? '' },
    randevular,
    saatDilimi: (paket.uygulama?.saatDilimleri.length ?? 1) > 1 ? dilim : null,
    ozetler,
    istek,
    bitis: o.bitis,
  }
}
