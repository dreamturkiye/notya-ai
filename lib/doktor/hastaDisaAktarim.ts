/**
 * HASTA-DISA-AKTAR-01 (Kaan, 2026-11-05) — ONE PATIENT'S RECORD, EXPORTED (CORE, every branch; Settings only, never
 * promoted). Server only. Two forms of the same content:
 *   json   a FHIR R4 `collection` Bundle: the Patient, and for each APPROVED visit note the resources of the existing mapper
 *          (lib/entegrasyon/fhirMapper.ts: Encounter, Condition, Observation, MedicationRequest proposal, Composition),
 *          plus the active medications (MedicationStatement) and the operation notes (Procedure).
 *   pdf    the same content as plain data for the printable page (the browser makes the PDF).
 * Archived visits are never exported (NOTYA-ARSIV-01: arsivsizNotlar / arsivsizIlaclar). The Turkish national ID is never
 * exported (it is stored only as a hash). The CALLER has checked that the patient is the doctor's (hastaSahibiMi) and
 * writes the audit row (hasta_disa_aktarim_kaydet).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPII } from '@/lib/security/encryption'
import { arsivsizIlaclar, arsivsizNotlar } from '@/lib/doktor/arsiv'
import { notuFhirBundleYap, type FhirNotGirdisi } from '@/lib/entegrasyon/fhirMapper'
import { notuCoz } from '@/lib/doktor/ameliyatNotuSunucu'

/** The most a single export reads (performance budget: one patient, bounded). */
export const DISA_AKTARIM_SINIRI = { not: 300, ilac: 200, ameliyat: 100 } as const

export type DisaAktarimVerisi = {
  hasta: { id: string; adSoyad: string; dogumTarihi: string | null; cinsiyet: string | null }
  doktor: { id: string; adSoyad: string; brans: string | null }
  notlar: { id: string; tarih: string; bolumler: [string, string][]; tanilar: string[] }[]
  ilaclar: { ad: string; etken: string | null; baslangic: string | null }[]
  ameliyatlar: { id: string; tarih: string; islem: string; bulgular: string; komplikasyon: string }[]
  olusturuldu: string
}

const coz = (x: string | null | undefined): string | null => { try { return x ? decryptPII(x) : null } catch { return null } }
type NotSatiri = Record<string, unknown> & { id: string; created_at: string; doctor_id: string }

export async function hastaKaydiOku(sb: SupabaseClient, doktorId: string, patientId: string): Promise<{ veri: DisaAktarimVerisi; notSatirlari: NotSatiri[] } | null> {
  const [{ data: h }, { data: dr }, { data: notlar }, { data: ilaclar }, { data: ameliyat }] = await Promise.all([
    sb.from('patients').select('id, name_encrypted, dob_encrypted, gender_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle(),
    sb.from('users').select('id, full_name, title, specialty').eq('id', doktorId).maybeSingle(),
    arsivsizNotlar(sb, 'id, created_at, doctor_id, approved_at, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_anamnez, content_fizik_muayene, content_tani, content_tedavi, icd10_codes, vitaller, basvuru_yakinmasi, recete_onerisi, sessions!inner(patient_id)')
      .eq('doctor_id', doktorId).eq('sessions.patient_id', patientId).not('approved_at', 'is', null)
      .order('created_at', { ascending: false }).limit(DISA_AKTARIM_SINIRI.not),
    arsivsizIlaclar(sb, 'ilac_adi, etken_madde, baslangic_tarihi, aktif').eq('patient_id', patientId).eq('doctor_id', doktorId).eq('aktif', true).limit(DISA_AKTARIM_SINIRI.ilac),
    sb.from('ameliyat_notlari').select('id, ameliyat_tarihi, veri_encrypted').eq('doctor_id', doktorId).eq('patient_id', patientId).order('ameliyat_tarihi', { ascending: false }).limit(DISA_AKTARIM_SINIRI.ameliyat),
  ])
  if (!h) return null
  const notSatirlari = ((notlar || []) as unknown as NotSatiri[])
  const s = (x: unknown) => (typeof x === 'string' ? x : '')
  const veri: DisaAktarimVerisi = {
    hasta: { id: h.id, adSoyad: coz(h.name_encrypted) || '—', dogumTarihi: coz(h.dob_encrypted), cinsiyet: coz(h.gender_encrypted) },
    doktor: { id: doktorId, adSoyad: [dr?.title, dr?.full_name].filter(Boolean).join(' ') || 'Dr.', brans: dr?.specialty || null },
    notlar: notSatirlari.map((n) => ({
      id: n.id, tarih: n.created_at,
      bolumler: ([['Başvuru yakınması', s(n.basvuru_yakinmasi)], ['Anamnez', s(n.content_anamnez) || s(n.content_subjektif)], ['Fizik muayene', s(n.content_fizik_muayene) || s(n.content_objektif)], ['Tanı', s(n.content_tani) || s(n.content_degerlendirme)], ['Tedavi', s(n.content_tedavi) || s(n.content_plan)]] as [string, string][]).filter(([, v]) => v.trim()),
      tanilar: (Array.isArray(n.icd10_codes) ? n.icd10_codes : []).map((c: { code?: string; kod?: string; description?: string; aciklama?: string }) => [c.code || c.kod, c.description || c.aciklama].filter(Boolean).join(' ')).filter(Boolean),
    })),
    ilaclar: ((ilaclar || []) as { ilac_adi?: string; etken_madde?: string | null; baslangic_tarihi?: string | null }[]).map((i) => ({ ad: i.ilac_adi || '—', etken: i.etken_madde || null, baslangic: i.baslangic_tarihi || null })),
    ameliyatlar: ((ameliyat || []) as { id: string; ameliyat_tarihi: string; veri_encrypted: string }[]).map((a) => {
      const v = notuCoz(a.veri_encrypted) as unknown as Record<string, unknown>
      return { id: a.id, tarih: a.ameliyat_tarihi, islem: s(v.islem), bulgular: s(v.bulgular), komplikasyon: s(v.komplikasyon) }
    }),
    olusturuldu: new Date().toISOString(),
  }
  return { veri, notSatirlari }
}

/** The FHIR R4 collection Bundle of the export. */
export function fhirDisaAktarim(v: DisaAktarimVerisi, notSatirlari: NotSatiri[]): Record<string, unknown> {
  const girisler: Record<string, unknown>[] = []
  const gorulen = new Set<string>()
  const ekle = (e: { fullUrl?: string; resource?: Record<string, unknown> }) => {
    const r = e.resource
    if (!r) return
    const anahtar = `${r.resourceType}/${r.id}`
    if (gorulen.has(anahtar)) return
    gorulen.add(anahtar)
    girisler.push({ fullUrl: e.fullUrl, resource: r })
  }
  const hasta = { id: v.hasta.id, adSoyad: v.hasta.adSoyad, tcKimlik: null, dogumTarihi: v.hasta.dogumTarihi, cinsiyet: v.hasta.cinsiyet, mrn: null }
  for (const n of notSatirlari) {
    const g: FhirNotGirdisi = {
      noteId: n.id, createdAt: n.created_at, specialty: v.doktor.brans,
      basvuruYakinmasi: n.basvuru_yakinmasi as string, subjektif: n.content_subjektif as string, objektif: n.content_objektif as string,
      degerlendirme: n.content_degerlendirme as string, plan: n.content_plan as string, anamnez: n.content_anamnez as string,
      fizikMuayene: n.content_fizik_muayene as string, tani: n.content_tani as string, tedavi: n.content_tedavi as string,
      icd10: n.icd10_codes as FhirNotGirdisi['icd10'], vitaller: n.vitaller as Record<string, unknown>, receteOnerisi: n.recete_onerisi as FhirNotGirdisi['receteOnerisi'],
      hasta, doktor: { id: v.doktor.id, adSoyad: v.doktor.adSoyad, brans: v.doktor.brans }, kurumAd: 'Notya',
    }
    const b = notuFhirBundleYap(g) as { entry?: { fullUrl?: string; resource?: Record<string, unknown> }[] }
    for (const e of b.entry || []) ekle(e)
  }
  if (!girisler.some((e) => (e.resource as { resourceType?: string }).resourceType === 'Patient')) {
    ekle({ fullUrl: `urn:uuid:${v.hasta.id}`, resource: { resourceType: 'Patient', id: v.hasta.id, name: [{ text: v.hasta.adSoyad }], ...(v.hasta.dogumTarihi ? { birthDate: v.hasta.dogumTarihi } : {}) } })
  }
  const hastaRef = { reference: `urn:uuid:${v.hasta.id}` }
  v.ilaclar.forEach((i, k) => ekle({ fullUrl: `urn:uuid:${v.hasta.id}-ilac-${k}`, resource: { resourceType: 'MedicationStatement', id: `${v.hasta.id}-ilac-${k}`, status: 'active', subject: hastaRef, medicationCodeableConcept: { text: [i.ad, i.etken].filter(Boolean).join(' — ') }, ...(i.baslangic ? { effectiveDateTime: i.baslangic } : {}) } }))
  v.ameliyatlar.forEach((a) => ekle({ fullUrl: `urn:uuid:${a.id}`, resource: { resourceType: 'Procedure', id: a.id, status: 'completed', subject: hastaRef, performedDateTime: a.tarih, code: { text: a.islem || 'Ameliyat' }, ...(a.komplikasyon ? { complication: [{ text: a.komplikasyon }] } : {}), ...(a.bulgular ? { note: [{ text: a.bulgular }] } : {}) } }))
  return { resourceType: 'Bundle', type: 'collection', timestamp: v.olusturuldu, meta: { tag: [{ system: 'https://notya.io/fhir/tag', code: 'hasta-disa-aktarim' }] }, entry: girisler }
}
