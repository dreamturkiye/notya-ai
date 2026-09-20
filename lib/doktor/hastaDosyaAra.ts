/**
 * Wide patient search — name is optional.
 *
 * A doctor with hundreds of patients asks "geçen hafta aşı yaptığım kimler" or
 * "bu hafta kulak iltihabı ile gelen". This module reads the doctor's own notes,
 * vaccines, drugs, bookings, belgeler and intake (never another doctor's row)
 * and ranks matching patients.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { hastaAdiCoz } from '@/core/eylemler/hasta'

export interface DosyaAramaAday {
  id: string
  ad: string
  dobMetin: string
  ozet: string
  skor: number
}

export interface SorguAyik {
  terimler: string[]
  asi: boolean
  cogul: boolean
  klinik: boolean
  pencere: { basIso: string; bitIso: string; basGun: string; bitGun: string; etiket: string } | null
}

const GIZLI = new Set([
  'tcKimlik', 'ad', 'soyad', 'telefon', 'eposta', 'adres',
  'acilKisiAdi', 'acilKisiTelefon', 'veliAd', 'veliSoyad', 'veliTelefon',
])

const ESANLAM: Record<string, string[]> = {
  kulak: ['kulak', 'otit', 'otitis', 'h65', 'h66', 'orta kulak'],
  iltihap: ['iltihap', 'enfeksiyon', 'infeksiyon', 'enflam'],
  asi: ['asi', 'asilama', 'immuniz', 'asi kart', 'asi kaydi'],
  ates: ['ates', 'fever', 'pireksi'],
  oksuruk: ['oksuruk', 'oksuruklu', 'krup'],
  alerji: ['alerji', 'allerji', 'anafilaksi'],
  bronşit: ['bronşit', 'bronşit', 'bronchiol', 'wheez'],
  idrar: ['idrar', 'uti', 'sistit', 'pyelonefrit'],
  bogaz: ['bogaz', 'farenjit', 'tonsillit', 'streptokok'],
  ishal: ['ishal', 'gastroenterit', 'kusma', 'rotavirus'],
}

const ASI_KELIME = /(^|[^a-z])(asi|asilama|immuniz|kpa|kgb|hepatit|bcg|kizamik|kizamikcik|kabakulak|sucicegi|sucice|difteri|tetanoz|bogmaca|polio|rotavir)([^a-z]|$)/
const DURAK = new Set([
  'hangi', 'hangileri', 'hangileriyedi', 'hangisiydi', 'hasta', 'hastalar', 'hastasi', 'hastam', 'hastanin', 'hastaniz',
  'bana', 'ile', 'gelen', 'geldi', 'gelenler', 'yaptigim', 'yaptigimiz', 'yaptiklarim',
  'olan', 'olanlar', 'kim', 'kimler', 'bir', 'bu', 'su', 'o', 've', 'veya', 'icin',
  'mi', 'mu', 'miydi', 'yedi', 'gecen', 'hafta', 'haftaki', 'ay', 'ayi', 'bugun', 'dun',
  'son', 'onceki', 'benim', 'ben', 'da', 'de', 'ki', 'ne', 'nedir', 'var', 'yok',
  'soyle', 'bak', 'bul', 'ara', 'arama', 'hocam', 'merhaba', 'selam', 'nasilsiniz',
])

function trtParca(d = new Date(), gunOffset = 0): { iso: string; gun: string } {
  const x = new Date(d.getTime() + gunOffset * 86400000)
  const gun = x.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  return { iso: new Date(`${gun}T00:00:00+03:00`).toISOString(), gun }
}

function haftaBasiGun(d = new Date()): string {
  const gun = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const dt = new Date(`${gun}T12:00:00+03:00`)
  const dow = (dt.getUTCDay() + 6) % 7 // Mon=0 in TRT noon
  dt.setUTCDate(dt.getUTCDate() - dow)
  return dt.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

function gunEkle(gun: string, n: number): string {
  const d = new Date(`${gun}T12:00:00+03:00`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

export function sorguyuAyikla(mesaj: string, now = new Date()): SorguAyik {
  const n = trAramaNormalize(mesaj)
  const cogul = /hastalar|hangileri|kimler|hangileriyedi|hepsi|listele/.test(n)
  const asi = ASI_KELIME.test(n)
  let pencere: SorguAyik['pencere'] = null
  const bugun = trtParca(now).gun
  if (/\bbugun\b/.test(n)) {
    pencere = { basIso: `${bugun}T00:00:00+03:00`, bitIso: `${bugun}T23:59:59+03:00`, basGun: bugun, bitGun: bugun, etiket: 'bugün' }
  } else if (/\bdun\b/.test(n)) {
    const d = gunEkle(bugun, -1)
    pencere = { basIso: `${d}T00:00:00+03:00`, bitIso: `${d}T23:59:59+03:00`, basGun: d, bitGun: d, etiket: 'dün' }
  } else if (/gecen hafta/.test(n)) {
    const bu = haftaBasiGun(now)
    const bas = gunEkle(bu, -7)
    const bit = gunEkle(bu, -1)
    pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bit}T23:59:59+03:00`, basGun: bas, bitGun: bit, etiket: 'geçen hafta' }
  } else if (/bu hafta/.test(n)) {
    const bas = haftaBasiGun(now)
    pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bugun}T23:59:59+03:00`, basGun: bas, bitGun: bugun, etiket: 'bu hafta' }
  } else if (/gecen ay/.test(n)) {
    const [y, a] = bugun.split('-').map(Number)
    const ay = a === 1 ? 12 : a - 1
    const yil = a === 1 ? y - 1 : y
    const bas = `${yil}-${String(ay).padStart(2, '0')}-01`
    const bit = gunEkle(`${bugun.slice(0, 8)}01`, -1)
    pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bit}T23:59:59+03:00`, basGun: bas, bitGun: bit, etiket: 'geçen ay' }
  } else if (/bu ay/.test(n)) {
    const bas = `${bugun.slice(0, 8)}01`
    pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bugun}T23:59:59+03:00`, basGun: bas, bitGun: bugun, etiket: 'bu ay' }
  } else if (asi || /sikayet|tani|iltihap|otit|alerji|ilac|randevu|epikriz|form/.test(n)) {
    const bas = gunEkle(bugun, -90)
    pencere = { basIso: `${bas}T00:00:00+03:00`, bitIso: `${bugun}T23:59:59+03:00`, basGun: bas, bitGun: bugun, etiket: 'son 90 gün' }
  }

  const ham = n
    .replace(/gecen hafta|bu hafta|gecen ay|bu ay|bugun|dun/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((k) => k.length >= 3 && !DURAK.has(k))
    .map((k) => k.replace(/iltehabi?|iltihabi?|iltehap/, 'iltihap'))

  const terimler = new Set<string>()
  for (const k of ham) {
    terimler.add(k)
    for (const [kok, liste] of Object.entries(ESANLAM)) {
      if (k === kok || liste.includes(k) || k.startsWith(kok)) {
        for (const e of liste) terimler.add(e)
        terimler.add(kok)
      }
    }
  }
  const liste = [...terimler]
  const klinikKelime = liste.some((t) =>
    Boolean(ESANLAM[t]) || Object.values(ESANLAM).some((l) => l.includes(t)) || ASI_KELIME.test(t)
  )
  const klinik = asi || cogul || klinikKelime
  return { terimler: liste, asi, cogul, klinik, pencere }
}

export function metinEslesir(metin: string, terimler: string[]): boolean {
  if (!terimler.length) return false
  const t = trAramaNormalize(metin)
  if (!t) return false
  return terimler.some((k) => k.length >= 3 && t.includes(k))
}

interface HamSatir { patientId: string; kaynak: string; neden: string; skor: number }

export function adaylariTopla(satirlar: HamSatir[]): Map<string, { nedenler: string[]; skor: number }> {
  const m = new Map<string, { nedenler: string[]; skor: number }>()
  for (const s of satirlar) {
    if (!s.patientId) continue
    const cur = m.get(s.patientId) || { nedenler: [], skor: 0 }
    if (cur.nedenler.length < 3) cur.nedenler.push(s.neden)
    cur.skor += s.skor
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
    .limit(250)
  if (p) seansQ.gte('created_at', p.basIso).lte('created_at', p.bitIso)

  const notQ = supabase
    .from('notes')
    .select('session_id, created_at, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_tani, basvuru_yakinmasi, icd10_codes, content_ilaclar')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(250)
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
    .limit(40)

  const [seanslar, notlar, asilar, ilaclar, randevular, belgeler, analiz, intake] = await Promise.all([
    seansQ, notQ, asiQ, ilacQ, randevuQ, belgeQ, analizQ, intakeQ,
  ])

  const seansHasta = new Map<string, string>()
  for (const s of seanslar.data || []) {
    if (s.patient_id) seansHasta.set(String(s.id), String(s.patient_id))
  }
  // Notes whose session is this doctor's — never a foreign session's patient_id.
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
    const icd = Array.isArray(n.icd10_codes) ? JSON.stringify(n.icd10_codes) : ''
    const ilac = Array.isArray(n.content_ilaclar) ? JSON.stringify(n.content_ilaclar) : ''
    const metin = [n.basvuru_yakinmasi, n.content_subjektif, n.content_objektif, n.content_degerlendirme, n.content_plan, n.content_tani, icd, ilac].filter(Boolean).join(' ')
    if (!q.terimler.length || !metinEslesir(metin, q.terimler)) continue
    ham.push({
      patientId: pid,
      kaynak: 'not',
      neden: kisa(`${trTarih(n.created_at as string)} not: ${n.basvuru_yakinmasi || n.content_tani || n.content_subjektif || 'muayene'}`),
      skor: 8,
    })
  }

  for (const a of asilar.data || []) {
    if (!a.patient_id || !gunAralikta(a.uygulama_tarihi as string, p)) continue
    const metin = `${a.asi_adi || ''} ${a.notlar || ''}`
    if (q.asi) {
      const asiTerim = q.terimler.filter((t) => !['asi', 'asilama', 'immuniz', 'kart'].includes(t))
      if (asiTerim.length && !metinEslesir(metin, asiTerim)) continue
    } else if (!q.terimler.length || !metinEslesir(metin, q.terimler)) {
      continue
    }
    ham.push({
      patientId: String(a.patient_id),
      kaynak: 'asi',
      neden: kisa(`${trTarih(a.uygulama_tarihi as string)} aşı: ${a.asi_adi || '?'}`),
      skor: 12,
    })
  }

  for (const i of ilaclar.data || []) {
    if (!i.patient_id || !isoAralikta(i.created_at as string, p)) continue
    const ad = String(i.ilac_adi || i.ad || i.name || '')
    if (!q.terimler.length || !metinEslesir(ad, q.terimler)) continue
    ham.push({ patientId: String(i.patient_id), kaynak: 'ilac', neden: kisa(`ilaç: ${ad}`), skor: 7 })
  }

  for (const r of randevular.data || []) {
    if (!r.patient_id) continue
    const metin = `${r.notlar || ''} ${r.tur || ''}`
    const klinik = q.terimler.length ? metinEslesir(metin, q.terimler) : q.asi === false && !q.terimler.length
    if (q.terimler.length && !klinik) continue
    if (!q.terimler.length && !q.asi) {
      // time-only + "hastalar" → list bookings in the window
      if (!q.cogul) continue
    }
    ham.push({
      patientId: String(r.patient_id),
      kaynak: 'randevu',
      neden: kisa(`${trTarih(r.baslangic as string)} randevu${r.notlar ? `: ${r.notlar}` : ''}`),
      skor: 5,
    })
  }

  for (const b of belgeler.data || []) {
    if (!b.patient_id || !isoAralikta(b.created_at as string, p)) continue
    const ozet = typeof b.ai_ozet === 'string' ? b.ai_ozet : b.ai_ozet ? JSON.stringify(b.ai_ozet) : ''
    const metin = `${b.baslik || ''} ${b.belge_turu || ''} ${ozet}`
    if (q.terimler.length && !metinEslesir(metin, q.terimler) && !q.asi) continue
    if (q.asi && !/asi|epikriz|karne/i.test(metin) && q.terimler.length && !metinEslesir(metin, q.terimler)) continue
    if (!q.terimler.length && !q.asi) continue
    ham.push({ patientId: String(b.patient_id), kaynak: 'belge', neden: kisa(`belge: ${b.baslik || b.belge_turu || 'dosya'}`), skor: 6 })
  }

  for (const a of analiz.data || []) {
    if (!a.patient_id) continue
    const s = a.sonuc as { ozet?: string } | null
    const metin = `${a.hekim_ozet || ''} ${s?.ozet || ''}`
    if (!q.terimler.length || !metinEslesir(metin, q.terimler)) continue
    ham.push({ patientId: String(a.patient_id), kaynak: 'belge', neden: kisa(`belge özeti: ${metin}`), skor: 6 })
  }

  for (const f of intake.data || []) {
    if (!f.patient_id || !f.form_data_encrypted) continue
    let hamForm = ''
    try { hamForm = decrypt(String(f.form_data_encrypted)) } catch { continue }
    let o: Record<string, unknown> = {}
    try { o = JSON.parse(hamForm) as Record<string, unknown> } catch { o = { _ham: hamForm } }
    const parca: string[] = []
    for (const [k, v] of Object.entries(o)) {
      if (GIZLI.has(k) || v == null) continue
      parca.push(String(v))
    }
    const metin = parca.join(' ')
    if (!q.terimler.length || !metinEslesir(metin, q.terimler)) continue
    ham.push({ patientId: String(f.patient_id), kaynak: 'intake', neden: 'hasta formunda geçiyor', skor: 5 })
  }

  // Sessions in the window with no extra keyword — "bu hafta gelenler"
  if (q.cogul && !q.terimler.length && !q.asi) {
    for (const s of seanslar.data || []) {
      if (s.patient_id) ham.push({ patientId: String(s.patient_id), kaynak: 'seans', neden: kisa(`${trTarih(s.created_at as string)} muayene`), skor: 4 })
    }
  }

  const grup = adaylariTopla(ham)
  const idler = [...grup.keys()]
  if (!idler.length) return []

  const { data: hastalar } = await supabase
    .from('patients')
    .select('id, name_encrypted, dob_encrypted')
    .eq('doctor_id', doktorId)
    .in('id', idler)
    .eq('is_active', true)

  const cikti: DosyaAramaAday[] = []
  for (const h of hastalar || []) {
    const g = grup.get(String(h.id))
    if (!g) continue
    let dob = ''
    try { dob = decrypt(String(h.dob_encrypted || '')) } catch { dob = '' }
    cikti.push({
      id: String(h.id),
      ad: hastaAdiCoz(h.name_encrypted as string | null),
      dobMetin: trTarih(dob || null),
      ozet: g.nedenler.join(' · '),
      skor: g.skor,
    })
  }
  return cikti.sort((a, b) => b.skor - a.skor || a.ad.localeCompare(b.ad, 'tr')).slice(0, 12)
}

export function klinikAramaMi(mesaj: string): boolean {
  return sorguyuAyikla(mesaj).klinik
}
