/**
 * NOTYA-HASTA-ILETISIMI-01 — audience selection for a bulk campaign.
 * HASTA-IZOLASYON-01: every read is scoped by doktorId in the same query; nothing here ever reads
 * another doctor's patients, sessions or vaccine rows.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { decrypt } from '@/lib/security/encryption'
import { veliOnamGerekliMi } from '@/lib/specialties/kapsam'
import { asiBekleyenHastaIdleri } from '@/lib/asi/bekleyenler'
import type { AdayHasta, ToplamaFiltre } from './tipler'

function yasHesaplaYil(dogumIso: string | null, bugun = new Date()): number | null {
  if (!dogumIso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dogumIso)
  if (!m) return null
  let yas = bugun.getUTCFullYear() - Number(m[1])
  const buAyGun = (bugun.getUTCMonth() + 1) * 100 + bugun.getUTCDate()
  const dogumAyGun = Number(m[2]) * 100 + Number(m[3])
  if (buAyGun < dogumAyGun) yas -= 1
  return yas >= 0 && yas < 150 ? yas : null
}

/**
 * Most recent session per patient: last visit date + the specialty it was under. Capped — see README.
 * NOTYA-ARSIV-01: goes through arsivsizSeanslar — an archived (faulty) muayene must not count as a
 * patient's "last visit" for the branş / recency filters either.
 */
async function sonZiyaretHaritasi(supabase: SupabaseClient, doktorId: string): Promise<Map<string, { iso: string; brans: string | null }>> {
  const { data } = await arsivsizSeanslar(supabase, 'patient_id, specialty, created_at, ended_at')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(8000)
  const harita = new Map<string, { iso: string; brans: string | null }>()
  for (const r of data || []) {
    if (!r.patient_id || harita.has(r.patient_id)) continue
    harita.set(r.patient_id, { iso: r.ended_at || r.created_at, brans: r.specialty ?? null })
  }
  return harita
}

export async function adaylariGetir(supabase: SupabaseClient, doktorId: string, filtre: ToplamaFiltre): Promise<AdayHasta[]> {
  let sorgu = supabase
    .from('patients')
    .select('id, name_encrypted, dob_encrypted, phone_encrypted, email_encrypted, iletisim_izni_whatsapp, iletisim_izni_eposta, iletisim_izni_sms, etiketler')
    .eq('doctor_id', doktorId)
    .eq('is_active', true)

  if (filtre.manuelHastaIdleri && filtre.manuelHastaIdleri.length > 0) {
    sorgu = sorgu.in('id', filtre.manuelHastaIdleri)
  } else if (filtre.etiketler && filtre.etiketler.length > 0) {
    sorgu = sorgu.overlaps('etiketler', filtre.etiketler)
  }

  const { data, error } = await sorgu.limit(5000)
  if (error || !data) return []

  // Last-visit / specialty and vaccine-waiting are both computed once, only when actually needed.
  const ihtiyacSonZiyaret = !filtre.manuelHastaIdleri?.length && (!!filtre.brans || filtre.sonZiyaretGunIci != null || filtre.sonZiyaretGunOnce != null)
  const ziyaretHaritasi = ihtiyacSonZiyaret ? await sonZiyaretHaritasi(supabase, doktorId) : null
  const bekleyenSet = !filtre.manuelHastaIdleri?.length && filtre.asiBekleyenleri
    ? await asiBekleyenHastaIdleri(supabase, doktorId, filtre.asiBekleyenleri.asiAdi ?? null)
    : null

  const bugun = new Date()
  const sonuc: AdayHasta[] = []
  for (const p of data) {
    let ad = 'Hasta'
    let dob: string | null = null
    let tel: string | null = null
    let eposta: string | null = null
    try { if (p.name_encrypted) ad = (JSON.parse(decrypt(p.name_encrypted)) as { ad?: string }).ad || ad } catch { /* fail soft */ }
    try { if (p.dob_encrypted) dob = decrypt(p.dob_encrypted) } catch { /* fail soft */ }
    try { if (p.phone_encrypted) tel = decrypt(p.phone_encrypted) } catch { /* fail soft */ }
    try { if (p.email_encrypted) eposta = decrypt(p.email_encrypted) } catch { /* fail soft */ }

    // Manual selection bypasses every filter below (the human already chose exactly who).
    if (!filtre.manuelHastaIdleri?.length) {
      const yas = yasHesaplaYil(dob, bugun)
      if (filtre.yasMin != null && (yas == null || yas < filtre.yasMin)) continue
      if (filtre.yasMax != null && (yas == null || yas > filtre.yasMax)) continue

      const ziyaret = ziyaretHaritasi?.get(p.id) ?? null
      if (filtre.brans && ziyaret?.brans !== filtre.brans) continue
      if (filtre.sonZiyaretGunIci != null) {
        if (!ziyaret) continue
        const gunFarki = (bugun.getTime() - Date.parse(ziyaret.iso)) / 86_400_000
        if (gunFarki > filtre.sonZiyaretGunIci) continue
      }
      if (filtre.sonZiyaretGunOnce != null) {
        const gunFarki = ziyaret ? (bugun.getTime() - Date.parse(ziyaret.iso)) / 86_400_000 : Infinity
        if (gunFarki < filtre.sonZiyaretGunOnce) continue
      }
      if (bekleyenSet && !bekleyenSet.has(p.id)) continue
    }

    const ziyaret = ziyaretHaritasi?.get(p.id) ?? null
    sonuc.push({
      id: p.id,
      ad,
      dogumTarihi: dob,
      telefon: tel,
      eposta,
      izinWhatsapp: p.iletisim_izni_whatsapp,
      izinEposta: p.iletisim_izni_eposta,
      izinSms: p.iletisim_izni_sms,
      etiketler: p.etiketler || [],
      sonZiyaretIso: ziyaret?.iso ?? null,
      sonBrans: ziyaret?.brans ?? null,
      veliDili: veliOnamGerekliMi(dob),
    })
  }
  return sonuc
}
