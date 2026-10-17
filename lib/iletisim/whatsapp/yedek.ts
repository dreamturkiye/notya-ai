/**
 * WHATSAPP-API-01 — a WhatsApp message that Meta reported as FAILED to deliver falls back to e-posta.
 *
 * The dispatcher already falls back at send time (WhatsApp error → e-posta, otomatikGonderim.ts). This covers the other
 * case: Meta accepted the message and told us LATER (delivery webhook, status "failed") that it never reached the patient
 * (number not on WhatsApp, template paused, …). The same non-clinical message then goes out by e-posta — from the DOCTOR'S
 * OWN mailbox (Gmail/Outlook, job B), because Notya retired its own Resend sender for patient mail (see
 * lib/portal/notifyPatientEmail.ts). Consent (izin_eposta), a usable address and "the appointment is still ahead" are
 * checked exactly as the dispatcher does. Once per message: the audit log's idempotency key is the claim.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { doktorIletisimAyari } from '@/lib/iletisim/sunucu'
import { hataMi, iletisimHazirla } from '@/lib/iletisim/hazirlik'
import { engel, istekKur, sessizSaatMi } from '@/lib/iletisim/otomatikGonderim'
import { hazirOtomatikGonderici, type OtomatikGonderici } from '@/lib/iletisim/otomatik'
import { mesajTuruMu } from '@/lib/iletisim/tipler'
import { denemeVarMi, gunlukYaz } from '@/lib/iletisim/otomatik/whatsapp/gunluk'

export type YedekSonucu = 'gonderildi' | 'atlandi' | 'sessiz_saat' | 'basarisiz'

export async function basarisizTeslimYedegi(
  sb: SupabaseClient,
  g: { doktorId: string; mesajId: string },
  deps: { eposta?: OtomatikGonderici | null; simdi?: Date } = {},
): Promise<YedekSonucu> {
  const simdi = deps.simdi ?? new Date()
  // Which message was it? Only messages Notya sent from its queue have a contact-log row with the provider id.
  const { data: kayit } = await sb.from('iletisim_kayitlari').select('patient_id, tur, randevu_id, kuyruk_id')
    .eq('doctor_id', g.doktorId).eq('kanal', 'whatsapp').eq('saglayici_mesaj_id', g.mesajId).limit(1)
  const k = kayit?.[0]
  if (!k || !mesajTuruMu(k.tur) || !k.patient_id) return 'atlandi'
  if (sessizSaatMi(simdi)) return 'sessiz_saat' // the maintenance cron picks it up in the morning

  // Claim: one fallback per message.
  const iz = { doktorId: g.doktorId, patientId: String(k.patient_id), yon: 'giden' as const, tur: 'yedek_eposta', kaynakWamid: g.mesajId, idemAnahtar: `yedek:${g.mesajId}` }
  if (await denemeVarMi(sb, g.doktorId, `yedek:${g.mesajId}`)) return 'atlandi'
  const claim = await gunlukYaz(sb, { ...iz, durum: 'deneniyor' })
  if (!claim.ok) return 'atlandi'

  const bitir = async (durum: 'gonderildi' | 'basarisiz', sonuc: YedekSonucu): Promise<YedekSonucu> => {
    await gunlukYaz(sb, { ...iz, durum, ayrinti: { tur: String(k.tur) } })
    return sonuc
  }
  try {
    const ayar = await doktorIletisimAyari(sb, g.doktorId)
    const h = await iletisimHazirla(sb, { doktorId: g.doktorId, rol: 'doktor' }, { tur: k.tur, patientId: k.patient_id, randevuId: k.randevu_id }, { doktorAdi: ayar.doktorAdi, doktorBransi: ayar.brans })
    if (hataMi(h) || engel(h, simdi)) return bitir('basarisiz', 'atlandi')
    const istek = istekKur(h, 'eposta', g.doktorId, ayar.doktorAdi)
    const gonderici = deps.eposta !== undefined ? deps.eposta : await hazirOtomatikGonderici(g.doktorId, 'eposta')
    if (!istek || !gonderici) return bitir('basarisiz', 'atlandi')
    const s = await gonderici.gonder(istek)
    if (!s.ok) return bitir('basarisiz', 'basarisiz')
    await sb.from('iletisim_kayitlari').insert({
      doctor_id: g.doktorId, patient_id: h.hasta.id, kanal: 'eposta', tur: h.tur, durum: 'gonderildi', gonderen_user_id: null, gonderen_personel_id: null,
      kuyruk_id: k.kuyruk_id ?? null, randevu_id: h.randevuId, otomatik: true, saglayici: s.saglayici || gonderici.saglayici, saglayici_mesaj_id: s.saglayiciMesajId ?? null,
    })
    return bitir('gonderildi', 'gonderildi')
  } catch {
    return bitir('basarisiz', 'basarisiz')
  }
}

/** Failed deliveries of the last day that have no fallback yet — for the maintenance cron. */
export async function yedeksizBasarisizlar(sb: SupabaseClient, simdi: Date = new Date(), limit = 100): Promise<{ doctor_id: string; mesaj_id: string }[]> {
  const { data, error } = await sb.from('whatsapp_teslim_durumlari').select('doctor_id, mesaj_id')
    .eq('durum', 'failed').gte('created_at', new Date(simdi.getTime() - 24 * 3600_000).toISOString()).order('created_at', { ascending: false }).limit(limit)
  if (error || !data) return []
  return data.map((r) => ({ doctor_id: String(r.doctor_id), mesaj_id: String(r.mesaj_id) }))
}
