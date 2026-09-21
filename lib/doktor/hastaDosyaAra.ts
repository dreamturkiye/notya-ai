/**
 * Wide patient search — name is optional. Filters AND across every dossier table.
 *
 * "bu hafta gördüğüm 2 yaşındakiler" = yaş ∩ bu haftanın muayenesi.
 * Isolation: every child query carries doktor/doctor_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { hastaAdiCoz } from '@/core/eylemler/hasta'
import {
  alanEslesir,
  sorguyuAyikla,
  tumTerimlerEslesir,
  yasAyHesapla,
  yasFiltreEslesir,
  type SorguAyik,
} from '@/lib/doktor/hastaAramaFiltre'

export type { SorguAyik } from '@/lib/doktor/hastaAramaFiltre'
export {
  ARAMA_ALANLARI,
  listeSorgusuMu,
  metinEslesir,
  sorguyuAyikla,
  yasAyHesapla,
  yasFiltreEslesir,
} from '@/lib/doktor/hastaAramaFiltre'

export interface DosyaAramaAday {
  id: string
  ad: string
  dobMetin: string
  ozet: string
  skor: number
}

const GIZLI = new Set([
  'tcKimlik', 'ad', 'soyad', 'telefon', 'eposta', 'adres',
  'acilKisiAdi', 'acilKisiTelefon', 'veliAd', 'veliSoyad', 'veliTelefon',
])

interface HamSatir { patientId: string; kaynak: string; neden: string; skor: number; metin?: string; zaman?: string }

export function adaylariTopla(satirlar: HamSatir[]): Map<string, { nedenler: string[]; skor: number; metin: string }> {
  const m = new Map<string, { nedenler: string[]; skor: number; metin: string }>()
  for (const s of satirlar) {
    if (!s.patientId) continue
    const cur = m.get(s.patientId) || { nedenler: [], skor: 0, metin: '' }
    if (cur.nedenler.length < 4) cur.nedenler.push(s.neden)
    cur.skor += s.skor
    cur.metin = `${cur.metin} ${s.metin || ''}`.trim()
    m.set(s.patientId, cur)
  }
  return m
}

function kisa(s: string, n = 80): string {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

function trTarih(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isoAralikta(iso: string | null | undefined, p: SorguAyik['pencere']): boolean {
  if (!p || !iso) return true
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso >= p.basGun && iso <= p.bitGun
    return true
  }
  return t >= new Date(p.basIso).getTime() && t <= new Date(p.bitIso).getTime()
}

function gunAralikta(gun: string | null | undefined, p: SorguAyik['pencere']): boolean {
  if (!p || !gun) return true
  const g = String(gun).slice(0, 10)
  return g >= p.basGun && g <= p.bitGun
}

function cinsiyetCoz(enc: string | null | undefined): 'kadin' | 'erkek' | null {
  if (!enc) return null
  try {
    const v = decrypt(enc).toLowerCase()
    if (v === 'female' || v === 'kadin' || v === 'kız' || v === 'kiz') return 'kadin'
    if (v === 'male' || v === 'erkek') return 'erkek'
  } catch { /* */ }
  return null
}

/** Doctor-scoped wide search. Every child query carries doktor/doctor_id. */
export async function hastaDosyaAra(
  supabase: SupabaseClient,
  doktorId: string,
  mesaj: string,
  now = new Date()
): Promise<DosyaAramaAday[]> {
  if (!doktorId) return []
  const q = sorguyuAyikla(mesaj, now)
  const p = q.pencere
  const ham: HamSatir[] = []

  const seansQ = supabase
    .from('sessions')
    .select('id, patient_id, created_at')
    .eq('doctor_id', doktorId)
    .not('patient_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(400)
  if (p) seansQ.gte('created_at', p.basIso).lte('created_at', p.bitIso)

  const notQ = supabase
    .from('notes')
    .select('session_id, created_at, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_tani, basvuru_yakinmasi, icd10_codes, content_ilaclar, vitaller')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(400)
  if (p) notQ.gte('created_at', p.basIso)

  const asiQ = supabase
    .from('asilar')
    .select('patient_id, asi_adi, uygulama_tarihi, notlar')
    .eq('doktor_id', doktorId)
    .order('uygulama_tarihi', { ascending: false })
    .limit(200)
  if (p) asiQ.gte('uygulama_tarihi', p.basGun).lte('uygulama_tarihi', p.bitGun)

  const ilacQ = supabase
    .from('hasta_ilaclar')
    .select('patient_id, ilac_adi, ad, name, created_at')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(200)

  const randevuQ = supabase
    .from('randevular')
    .select('patient_id, notlar, tur, baslangic, durum')
    .eq('doktor_id', doktorId)
    .neq('durum', 'iptal')
    .order('baslangic', { ascending: false })
    .limit(200)
  if (p) randevuQ.gte('baslangic', p.basIso).lte('baslangic', p.bitIso)

  const belgeQ = supabase
    .from('hasta_belgeler')
    .select('patient_id, baslik, belge_turu, ai_ozet, created_at')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(80)

  const kasaQ = supabase
    .from('medical_documents')
    .select('patient_id, file_name, category, notes, created_at, visit_id')
    .eq('doctor_id', doktorId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(80)

  const analizQ = supabase
    .from('belge_analizleri')
    .select('patient_id, hekim_ozet, sonuc, onaylandi_at')
    .eq('doctor_id', doktorId)
    .in('durum', ['onaylandi', 'muayene_onaylandi'])
    .order('onaylandi_at', { ascending: false })
    .limit(40)

  const intakeQ = supabase
    .from('hasta_intake_formlari')
    .select('patient_id, form_data_encrypted, dolduruldu_at')
    .eq('doktor_id', doktorId)
    .not('form_data_encrypted', 'is', null)
    .order('dolduruldu_at', { ascending: false })
    .limit(400)

  const cihazQ = supabase
    .from('cihaz_olcumleri')
    .select('patient_id, tur, deger, profil, created_at')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(80)

  const [seanslar, notlar, asilar, ilaclar, randevular, belgeler, kasa, analiz, intake, cihaz] = await Promise.all([
    seansQ, notQ, asiQ, ilacQ, randevuQ, belgeQ, kasaQ, analizQ, intakeQ, cihazQ,
  ])

  const seansHasta = new Map<string, string>()
  const ziyaretId = new Set<string>()
  for (const s of seanslar.data || []) {
    if (s.patient_id) {
      seansHasta.set(String(s.id), String(s.patient_id))
      ziyaretId.add(String(s.patient_id))
      ham.push({
        patientId: String(s.patient_id),
        kaynak: 'seans',
        neden: kisa(`${trTarih(s.created_at as string)} muayene`),
        skor: 4,
        metin: 'muayene seans',
        zaman: String(s.created_at || ''),
      })
    }
  }
  if ((notlar.data || []).length) {
    const eksik = [...new Set((notlar.data || []).map((n) => String(n.session_id)).filter((id) => !seansHasta.has(id)))]
    if (eksik.length) {
      const { data: ek } = await supabase
        .from('sessions')
        .select('id, patient_id')
        .eq('doctor_id', doktorId)
        .in('id', eksik.slice(0, 250))
      for (const s of ek || []) if (s.patient_id) seansHasta.set(String(s.id), String(s.patient_id))
    }
  }

  for (const n of notlar.data || []) {
    const pid = seansHasta.get(String(n.session_id))
    if (!pid || !isoAralikta(n.created_at as string, p)) continue
    ziyaretId.add(pid)
    const icd = Array.isArray(n.icd10_codes) ? JSON.stringify(n.icd10_codes) : ''
    const ilac = Array.isArray(n.content_ilaclar) ? JSON.stringify(n.content_ilaclar) : ''
    const vital = n.vitaller && typeof n.vitaller === 'object' ? JSON.stringify(n.vitaller) : ''
    const metin = [n.basvuru_yakinmasi, n.content_subjektif, n.content_objektif, n.content_degerlendirme, n.content_plan, n.content_tani, icd, ilac, vital].filter(Boolean).join(' ')
    ham.push({
      patientId: pid,
      kaynak: 'not',
      neden: kisa(`${trTarih(n.created_at as string)} not: ${n.basvuru_yakinmasi || n.content_tani || n.content_subjektif || 'muayene'}`),
      skor: 8,
      metin,
      zaman: String(n.created_at || ''),
    })
  }

  for (const a of asilar.data || []) {
    if (!a.patient_id || !gunAralikta(a.uygulama_tarihi as string, p)) continue
    const metin = `${a.asi_adi || ''} ${a.notlar || ''}`
    ham.push({
      patientId: String(a.patient_id),
      kaynak: 'asi',
      neden: kisa(`${trTarih(a.uygulama_tarihi as string)} aşı: ${a.asi_adi || '?'}`),
      skor: 12,
      metin,
    })
  }

  for (const i of ilaclar.data || []) {
    if (!i.patient_id || !isoAralikta(i.created_at as string, p)) continue
    const ad = String(i.ilac_adi || i.ad || i.name || '')
    ham.push({ patientId: String(i.patient_id), kaynak: 'ilac', neden: kisa(`ilaç: ${ad}`), skor: 7, metin: ad })
  }

  for (const r of randevular.data || []) {
    if (!r.patient_id) continue
    const metin = `${r.notlar || ''} ${r.tur || ''}`
    ziyaretId.add(String(r.patient_id))
    ham.push({
      patientId: String(r.patient_id),
      kaynak: 'randevu',
      neden: kisa(`${trTarih(r.baslangic as string)} randevu${r.notlar ? `: ${r.notlar}` : ''}`),
      skor: 5,
      metin,
    })
  }

  for (const b of belgeler.data || []) {
    if (!b.patient_id || !isoAralikta(b.created_at as string, p)) continue
    const ozet = typeof b.ai_ozet === 'string' ? b.ai_ozet : b.ai_ozet ? JSON.stringify(b.ai_ozet) : ''
    const metin = `${b.baslik || ''} ${b.belge_turu || ''} ${ozet}`
    ham.push({ patientId: String(b.patient_id), kaynak: 'belge', neden: kisa(`belge: ${b.baslik || b.belge_turu || 'dosya'}`), skor: 6, metin })
  }

  for (const b of kasa.data || []) {
    if (!b.patient_id || !isoAralikta(b.created_at as string, p)) continue
    const metin = `${b.file_name || ''} ${b.category || ''} ${b.notes || ''}`
    ham.push({ patientId: String(b.patient_id), kaynak: 'kasa', neden: kisa(`kasa: ${b.file_name || b.category || 'belge'}`), skor: 5, metin })
  }

  for (const a of analiz.data || []) {
    if (!a.patient_id) continue
    const s = a.sonuc as { ozet?: string } | null
    const metin = `${a.hekim_ozet || ''} ${s?.ozet || ''}`
    ham.push({ patientId: String(a.patient_id), kaynak: 'belge', neden: kisa(`belge özeti: ${metin}`), skor: 6, metin })
  }

  for (const cih of cihaz.data || []) {
    if (!cih.patient_id || !isoAralikta(cih.created_at as string, p)) continue
    const metin = `${cih.tur || ''} ${cih.deger || ''} ${cih.profil || ''}`
    ham.push({ patientId: String(cih.patient_id), kaynak: 'cihaz', neden: kisa(`cihaz: ${cih.tur || 'ölçüm'}`), skor: 4, metin })
  }

  const intakeCinsiyet = new Map<string, 'kadin' | 'erkek'>()
  const intakeIl = new Map<string, string>()
  for (const f of intake.data || []) {
    if (!f.patient_id || !f.form_data_encrypted) continue
    let hamForm = ''
    try { hamForm = decrypt(String(f.form_data_encrypted)) } catch { continue }
    let o: Record<string, unknown> = {}
    try { o = JSON.parse(hamForm) as Record<string, unknown> } catch { o = { _ham: hamForm } }
    const parca: string[] = []
    for (const [k, v] of Object.entries(o)) {
      if (GIZLI.has(k) || v == null) continue
      parca.push(`${k} ${String(v)}`)
    }
    const cins = String(o.cinsiyet || '').toLowerCase()
    if (/kadın|kadin|kız|kiz|female/.test(cins)) intakeCinsiyet.set(String(f.patient_id), 'kadin')
    if (/erkek|male/.test(cins)) intakeCinsiyet.set(String(f.patient_id), 'erkek')
    if (o.il) intakeIl.set(String(f.patient_id), String(o.il))
    ham.push({ patientId: String(f.patient_id), kaynak: 'intake', neden: 'hasta formunda geçiyor', skor: 5, metin: parca.join(' ') })
  }

  const grup = adaylariTopla(ham)

  const { data: hastalar } = await supabase
    .from('patients')
    .select('id, name_encrypted, dob_encrypted, gender_encrypted')
    .eq('doctor_id', doktorId)
    .eq('is_active', true)
    .limit(500)

  const cikti: DosyaAramaAday[] = []
  for (const h of hastalar || []) {
    const id = String(h.id)
    const g = grup.get(id) || { nedenler: [], skor: 0, metin: '' }
    let dob = ''
    try { dob = decrypt(String(h.dob_encrypted || '')) } catch { dob = '' }
    const ad = hastaAdiCoz(h.name_encrypted as string | null)
    const ay = dob ? yasAyHesapla(dob, now) : null
    if (!yasFiltreEslesir(ay, q.yas)) continue

    const cins = cinsiyetCoz(h.gender_encrypted as string | null) || intakeCinsiyet.get(id) || null
    if (q.cinsiyet && cins !== q.cinsiyet) continue

    const torba = `${ad} ${dob} ${g.metin} ${intakeIl.get(id) || ''}`
    if (!tumTerimlerEslesir(torba, q.terimler)) continue
    if (q.alanlar.some((a) => !alanEslesir(torba, a))) continue

    if (q.asi && !/asi|asilama|immuniz|hepatit|kpa|bcg|kizamik/.test(torba.toLowerCase()) && !g.nedenler.some((n) => /aşı|asi/i.test(n))) {
      continue
    }

    const ziyaretGerek = q.ziyaret || Boolean(q.pencere && (q.cogul || q.yas))
    if (ziyaretGerek && !ziyaretId.has(id) && !g.nedenler.some((n) => /muayene|randevu|not:|aşı/i.test(n))) {
      continue
    }

    if (!q.yas && !q.terimler.length && !q.alanlar.length && !q.asi && !q.ziyaret && !q.pencere) continue
    if (!q.yas && !q.terimler.length && !q.alanlar.length && !q.asi && !ziyaretGerek) continue

    const yasEtiket = ay != null ? `${Math.floor(ay / 12)} yaş ${ay % 12} ay` : ''
    cikti.push({
      id,
      ad,
      dobMetin: trTarih(dob || null),
      ozet: [q.ozet, yasEtiket, ...g.nedenler].filter(Boolean).join(' · '),
      skor: g.skor + (q.yas ? 10 : 0),
    })
  }

  return cikti.sort((a, b) => b.skor - a.skor || a.ad.localeCompare(b.ad, 'tr')).slice(0, 40)
}

export function klinikAramaMi(mesaj: string): boolean {
  return sorguyuAyikla(mesaj).klinik
}
