/**
 * NOTYA-ILETISIM-01 — server helpers (service-role client). Every read is scoped by the doctor;
 * every helper fails SOFT when migration 095 has not been applied yet (empty queue, unknown
 * consent, no log) — the product must never crash because a table is missing.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { veliDiliMi } from '@/lib/specialties/kapsam'
import { arsivsizAsilar } from '@/lib/doktor/arsiv'
import { sonrakiDozKarsilandiMi } from '@/lib/asi/hatirlatma'
import { bugunTrIso } from './sablonlar'
import { gunEkle, tekilAnahtar, yeniAdaylar, type KuyrukAdayi } from './kuyruk'
import type { IzinDegeri } from './izin'
import type { EpostaAcilis, IletisimKanali } from './tipler'

type Sb = SupabaseClient

/** PostgREST / Postgres answers for "this table or column does not exist (yet)". */
export function tabloYokMu(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string }
  if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(String(e.code || ''))) return true
  return /does not exist|schema cache|could not find the/i.test(String(e.message || ''))
}

const coz = (v: unknown): string => {
  if (!v) return ''
  try { return String(decrypt(String(v)) || '').trim() } catch { return '' }
}
const dogumIso = (v: unknown): string | null => {
  const d = coz(v).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null
}
export function hastaAdiCoz(nameEncrypted: unknown): string {
  try {
    const j = JSON.parse(coz(nameEncrypted) || '{}') as { ad?: string; soyad?: string }
    return `${j.ad || ''} ${j.soyad || ''}`.replace(/\s+/g, ' ').trim()
  } catch {
    return ''
  }
}

export type HastaIletisimi = {
  id: string
  ad: string
  telefon: string
  eposta: string
  veliDili: boolean
  izinWhatsapp: IzinDegeri
  izinEposta: IzinDegeri
  /** false when migration 095 is not applied yet — consent cannot be stored. */
  izinKaydedilebilir: boolean
}

/**
 * Contact data of ONE patient of this doctor, or null (foreign / unknown id → null, same as 404).
 * Consent is read in a separate query so a missing column only makes consent "unknown".
 */
export async function hastaIletisimi(sb: Sb, doktorId: string, patientId: string, doktorBransi?: string | null): Promise<HastaIletisimi | null> {
  if (!doktorId || !patientId) return null
  const { data: p, error } = await sb
    .from('patients')
    .select('id, name_encrypted, dob_encrypted, phone_encrypted, email_encrypted, is_active')
    .eq('id', patientId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (error || !p) return null
  let izinWhatsapp: IzinDegeri = null
  let izinEposta: IzinDegeri = null
  let izinKaydedilebilir = true
  const { data: izin, error: izinHata } = await sb
    .from('patients')
    .select('iletisim_izni_whatsapp, iletisim_izni_eposta')
    .eq('id', patientId)
    .eq('doctor_id', doktorId)
    .maybeSingle()
  if (izinHata) izinKaydedilebilir = false
  else if (izin) {
    izinWhatsapp = typeof izin.iletisim_izni_whatsapp === 'boolean' ? izin.iletisim_izni_whatsapp : null
    izinEposta = typeof izin.iletisim_izni_eposta === 'boolean' ? izin.iletisim_izni_eposta : null
  }
  return {
    id: String(p.id),
    ad: hastaAdiCoz(p.name_encrypted),
    telefon: coz(p.phone_encrypted),
    eposta: coz(p.email_encrypted),
    veliDili: veliDiliMi({ doktorBransi: doktorBransi ?? null, hastaDogumIso: dogumIso(p.dob_encrypted) }),
    izinWhatsapp,
    izinEposta,
    izinKaydedilebilir,
  }
}

export type DoktorIletisimAyari = {
  doktorAdi: string
  brans: string | null
  whatsapp: string
  eposta: string
  epostaAcilis: EpostaAcilis
  /** false when the 095 columns do not exist yet — values come from the profile only. */
  kaydedilebilir: boolean
}

/** The doctor's signature name ("Dr. Ayşe Kaya") and own contact accounts, pre-filled from the profile. */
export async function doktorIletisimAyari(sb: Sb, doktorId: string): Promise<DoktorIletisimAyari> {
  const { data: u } = await sb
    .from('users')
    .select('full_name, first_name, last_name, title, specialty, email, whatsapp_number')
    .eq('id', doktorId)
    .maybeSingle()
  const ad = [u?.title, u?.first_name, u?.last_name].filter(Boolean).join(' ').trim()
  const tamAd = String(u?.full_name || '').trim()
  const doktorAdi = ad && (u?.first_name || u?.last_name) ? ad : tamAd ? (/^(dr|doç|prof|uzm)\.?\s/i.test(tamAd) ? tamAd : `Dr. ${tamAd}`) : ''
  const ayar: DoktorIletisimAyari = {
    doktorAdi,
    brans: u?.specialty ? String(u.specialty) : null,
    whatsapp: String(u?.whatsapp_number || '').trim(),
    eposta: String(u?.email || '').trim(),
    epostaAcilis: 'uygulama',
    kaydedilebilir: true,
  }
  const { data: k, error } = await sb.from('users').select('iletisim_whatsapp, iletisim_eposta, iletisim_eposta_acilis').eq('id', doktorId).maybeSingle()
  if (error) return { ...ayar, kaydedilebilir: false }
  if (k?.iletisim_whatsapp) ayar.whatsapp = String(k.iletisim_whatsapp)
  if (k?.iletisim_eposta) ayar.eposta = String(k.iletisim_eposta)
  if (k?.iletisim_eposta_acilis === 'gmail' || k?.iletisim_eposta_acilis === 'outlook' || k?.iletisim_eposta_acilis === 'uygulama') ayar.epostaAcilis = k.iletisim_eposta_acilis
  return ayar
}

/** Last channel used for this patient (from the log), or null. */
export async function sonKanal(sb: Sb, doktorId: string, patientId: string): Promise<IletisimKanali | null> {
  const { data, error } = await sb
    .from('iletisim_kayitlari')
    .select('kanal')
    .eq('doctor_id', doktorId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error || !data?.length) return null
  const k = data[0].kanal
  return k === 'whatsapp' || k === 'eposta' ? k : null
}

/**
 * Inserts queue candidates that do not exist yet. Candidates must already be doctor-scoped
 * (patient ids taken from the doctor's own rows). Returns how many were added; 0 when the
 * table does not exist yet. A concurrent duplicate (unique violation) is ignored.
 */
export async function kuyrugaEkle(sb: Sb, adaylar: KuyrukAdayi[]): Promise<number> {
  if (!adaylar.length) return 0
  let eklenen = 0
  const doktorlar = Array.from(new Set(adaylar.map((a) => a.doctor_id)))
  for (const doktorId of doktorlar) {
    const buDoktor = adaylar.filter((a) => a.doctor_id === doktorId)
    const anahtarlar = buDoktor.map((a) => a.tekil_anahtar)
    const { data: mevcut, error } = await sb.from('iletisim_kuyrugu').select('tekil_anahtar').eq('doctor_id', doktorId).in('tekil_anahtar', anahtarlar)
    if (error) {
      if (tabloYokMu(error)) return eklenen
      continue
    }
    const yeni = yeniAdaylar(buDoktor, (mevcut || []).map((m) => String(m.tekil_anahtar)))
    for (const a of yeni) {
      const { error: e } = await sb.from('iletisim_kuyrugu').insert({ ...a, durum: 'bekliyor' })
      if (!e) eklenen++
      else if (tabloYokMu(e)) return eklenen
      // 23505 unique_violation: another request enqueued it first — fine
    }
  }
  return eklenen
}

/** "Sağlığım'da yeni mesajınız var" — one queue item per thread per day (replaces the Resend email). */
export async function saglikimMesajiKuyrugaEkle(sb: Sb, g: { doctorId: string; patientId: string; konuId?: string | null }): Promise<number> {
  const gun = bugunTrIso()
  return kuyrugaEkle(sb, [{
    doctor_id: g.doctorId,
    patient_id: g.patientId,
    tur: 'saglikim_yeni_mesaj',
    konu_id: g.konuId ?? null,
    planlanan_gun: gun,
    tekil_anahtar: g.konuId ? tekilAnahtar.saglikimMesaji(g.konuId, gun) : tekilAnahtar.saglikimMesajiHasta(g.patientId, gun),
  }])
}

/** Queue window for due vaccines: up to 7 days ahead, up to 30 days overdue. */
export const ASI_KUYRUK_ILERI_GUN = 7
export const ASI_KUYRUK_GERI_GUN = 30

/**
 * Due-vaccine queue items for this doctor, built from their own asilar rows (never a cron — see
 * lib/asi/hatirlatma.test.ts). Rows already reminded, covered by a later dose, archived, or
 * attached to another doctor's patient are skipped.
 */
export async function asiKuyrukAdaylari(sb: Sb, doktorId: string, bugunIso: string = bugunTrIso()): Promise<KuyrukAdayi[]> {
  const bas = gunEkle(bugunIso, -ASI_KUYRUK_GERI_GUN)
  const son = gunEkle(bugunIso, ASI_KUYRUK_ILERI_GUN)
  const { data: adaylar, error } = await arsivsizAsilar(sb, 'id, patient_id, asi_adi, uygulama_tarihi, sonraki_doz_tarihi, hatirlatma_gonderildi')
    .eq('doktor_id', doktorId)
    .not('hatirlatma_gonderildi', 'is', true)
    .gte('sonraki_doz_tarihi', bas)
    .lte('sonraki_doz_tarihi', son)
    .limit(300)
  if (error || !adaylar?.length) return []
  const ids = Array.from(new Set(adaylar.map((a) => String(a.patient_id))))
  const [{ data: hastalar }, { data: tum }] = await Promise.all([
    sb.from('patients').select('id, is_active').eq('doctor_id', doktorId).in('id', ids),
    arsivsizAsilar(sb, 'id, patient_id, asi_adi, uygulama_tarihi').eq('doktor_id', doktorId).in('patient_id', ids).limit(3000),
  ])
  const aktif = new Set((hastalar || []).filter((p) => p.is_active !== false).map((p) => String(p.id)))
  const tumSatirlar = (tum || []).map((a) => ({ id: String(a.id), patient_id: String(a.patient_id), asi_adi: a.asi_adi, uygulama_tarihi: a.uygulama_tarihi }))
  const out: KuyrukAdayi[] = []
  for (const a of adaylar) {
    const pid = String(a.patient_id)
    if (!aktif.has(pid)) continue
    const sonraki = String(a.sonraki_doz_tarihi || '').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sonraki)) continue
    if (sonrakiDozKarsilandiMi({ id: String(a.id), patient_id: pid, asi_adi: a.asi_adi, uygulama_tarihi: a.uygulama_tarihi }, tumSatirlar)) continue
    out.push({ doctor_id: doktorId, patient_id: pid, tur: 'asi_hatirlatma', asi_id: String(a.id), planlanan_gun: bugunIso, tekil_anahtar: tekilAnahtar.asi(String(a.id), sonraki) })
  }
  return out
}
