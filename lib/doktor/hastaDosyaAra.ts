/**
 * Wide patient search — name is optional. Filters AND across every dossier table.
 *
 * "bu hafta gördüğüm 2 yaşındakiler" = yaş ∩ bu haftanın muayenesi.
 * Isolation: every child query carries doktor/doctor_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { arsivsizAsilar, arsivsizIlaclar, arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { hastaAdiCoz } from '@/core/eylemler/hasta'
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import {
  alanEslesir,
  haricEslesir,
  ilacAdiKir,
  istatistikKur,
  siraKir,
  sikayetAnahtar,
  sayisalEslesir,
  sorguyuAyikla,
  tumTerimlerEslesir,
  veyaEslesir,
  yasAyHesapla,
  yasFiltreEslesir,
  type AramaIstatistik,
  type SorguAyik,
} from '@/lib/doktor/hastaAramaFiltre'
import { aramaBolumuAc, bolumBayraklari, cevapTuru, BOLUM_AD, type AramaCevapTur } from '@/lib/doktor/aramaBolum'

export type { AramaIstatistik, SorguAyik } from '@/lib/doktor/hastaAramaFiltre'
export {
  ARAMA_ALANLARI,
  istatistikKur,
  klinikAramaMi,
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

function notIlacAdlari(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const adlar: string[] = []
  for (const x of raw) {
    if (!x) continue
    if (typeof x === 'string') {
      const t = x.trim()
      if (t) adlar.push(t)
      continue
    }
    const o = x as Record<string, unknown>
    const ad = String(o.ad || o.ilac_adi || o.name || o.ticariOrnek || o.etkenMadde || o.etken_madde || '').trim()
    if (ad) adlar.push(ad)
  }
  return adlar
}

function ilacSatirlariTekil(ham: HamSatir[]): { ad: string; patientId: string }[] {
  const seen = new Set<string>()
  const out: { ad: string; patientId: string }[] = []
  for (const h of ham) {
    if (h.kaynak !== 'ilac') continue
    const ad = (h.metin || '').trim()
    if (!ad) continue
    const key = `${h.patientId}|${trAramaNormalize(ad)}|${(h.zaman || '').slice(0, 10)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ad, patientId: h.patientId })
  }
  return out
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

function seansSureSn(s: { duration_seconds?: number | null; started_at?: string | null; ended_at?: string | null }): number | null {
  const d = Number(s.duration_seconds)
  if (Number.isFinite(d) && d > 0) return d
  if (s.started_at && s.ended_at) {
    const sn = (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000
    return sn > 30 && sn < 8 * 3600 ? sn : null
  }
  return null
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

export interface KlinikAramaSonuc {
  adaylar: DosyaAramaAday[]
  istatistik: AramaIstatistik
  q: SorguAyik
  tur: AramaCevapTur
}

/** Doctor-scoped wide search. Every child query carries doktor/doctor_id. */
export async function hastaDosyaAra(
  supabase: SupabaseClient,
  doktorId: string,
  mesaj: string,
  now = new Date()
): Promise<DosyaAramaAday[]> {
  return (await klinikAramaYurut(supabase, doktorId, mesaj, now)).adaylar
}

export async function klinikAramaYurut(
  supabase: SupabaseClient,
  doktorId: string,
  mesaj: string,
  now = new Date()
): Promise<KlinikAramaSonuc> {
  const q = sorguyuAyikla(mesaj, now)
  const bos = istatistikKur(q, { hastaSayisi: 0, seansSayisi: 0, asiAdedi: 0, ilacAdedi: 0, ortalamaSeansDk: null })
  if (!doktorId) return { adaylar: [], istatistik: bos, q, tur: cevapTuru(q, null) }

  if (bolumBayraklari(q)) {
    const { data: hekim } = await supabase.from('users').select('specialty').eq('id', doktorId).maybeSingle()
    const bolum = aramaBolumuAc(q, (hekim as { specialty?: string } | null)?.specialty)
    if (bolum === 'kapali') {
      const ad = q.bolumIstegi ? BOLUM_AD[q.bolumIstegi] : 'bu kohort'
      const istatistik = { ...bos, cumle: `Bu soru ${ad} sorusudur. Bu branşta o tablolar açılmaz.${q.ozet ? ` Filtre: ${q.ozet}.` : ''}` }
      return { adaylar: [], istatistik, q, tur: 'kapali' }
    }
    if (bolum === 'pediatri') return pediBolumYurut(supabase, doktorId, q, now)
    if (bolum === 'goz') return gozBolumYurut(supabase, doktorId, q, now)
    if (bolum === 'kd') return kdBolumYurut(supabase, doktorId, q, now)
    if (bolum === 'dahiliye') return dahiliyeBolumYurut(supabase, doktorId, q, now)
    if (bolum === 'derm') return dermBolumYurut(supabase, doktorId, q, now)
  }

  if ((q.kirilim || (q.olcum === 'ilac' && q.sayim)) && !q.yas && !q.minSeans && !q.seriGecikme && !q.bayrakVe.length) {
    return pratikKirilimYurut(supabase, doktorId, q, now)
  }

  const p = q.pencere
  const ham: HamSatir[] = []
  const gunSpan = p ? Math.max(1, Math.round((Date.parse(p.bitIso) - Date.parse(p.basIso)) / 86400000)) : 30
  const seansLimit = q.minSeans || gunSpan >= 60 ? 800 : 400

  // NOTYA-ARSIV-01: arşivlenmiş muayene ve notu aramada bulunmaz.
  const seansQ = arsivsizSeanslar(supabase, 'id, patient_id, created_at, started_at, ended_at, duration_seconds')
    .eq('doctor_id', doktorId)
    .not('patient_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(seansLimit)
  if (p) seansQ.gte('created_at', p.basIso).lte('created_at', p.bitIso)

  const notQ = arsivsizNotlar(supabase, 'session_id, created_at, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_tani, basvuru_yakinmasi, icd10_codes, content_ilaclar, vitaller')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(400)
  if (p) notQ.gte('created_at', p.basIso)

  // NOTYA-ASI-NOT-01: an archived muayene's vaccine is not in search either.
  const asiQ = arsivsizAsilar(supabase, 'patient_id, asi_adi, uygulama_tarihi, notlar, kaynak')
    .eq('doktor_id', doktorId)
    .order('uygulama_tarihi', { ascending: false })
    .limit(200)
  if (p) asiQ.gte('uygulama_tarihi', p.basGun).lte('uygulama_tarihi', p.bitGun)

  // NOTYA-ARSIV-02: arşivlenmiş muayenenin yazdığı ilaç aramada da yok.
  const ilacQ = arsivsizIlaclar(supabase, 'patient_id, ilac_adi, etken_madde, created_at, baslangic_tarihi')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(q.kirilim === 'ilac_adi' ? 800 : 200)
  if (p) ilacQ.gte('created_at', p.basIso).lte('created_at', p.bitIso)

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

  const goruntuQ = supabase
    .from('hasta_goruntulemeler')
    .select('patient_id, modalite, vucut_bolgesi, rapor_metni, goruntuleme_tarihi, created_at')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(80)

  const calismaQ = supabase
    .from('goruntu_calisma')
    .select('patient_id, tip, modalite, bolge, hekim_yorum, tarih, created_at')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(80)

  const [seanslar, notlar, asilar, ilaclar, randevular, belgeler, kasa, analiz, intake, cihaz, goruntuler, calismalar] = await Promise.all([
    seansQ, notQ, asiQ, ilacQ, randevuQ, belgeQ, kasaQ, analizQ, intakeQ, cihazQ, goruntuQ, calismaQ,
  ])

  const seansHasta = new Map<string, string>()
  const ziyaretId = new Set<string>()
  const seansSureleri: number[] = []
  const seansSurePid: { id: string; sure: number }[] = []
  const seansAdet = new Map<string, number>()
  for (const s of seanslar.data || []) {
    const zaman = String(s.started_at || s.created_at || '')
    if (!isoAralikta(zaman, p)) continue
    if (s.patient_id) {
      seansHasta.set(String(s.id), String(s.patient_id))
      ziyaretId.add(String(s.patient_id))
      const sure = seansSureSn(s)
      if (sure != null) {
        seansSureleri.push(sure)
        seansSurePid.push({ id: String(s.patient_id), sure })
      }
      seansAdet.set(String(s.patient_id), (seansAdet.get(String(s.patient_id)) || 0) + 1)
      ham.push({
        patientId: String(s.patient_id),
        kaynak: 'seans',
        neden: kisa(`${trTarih(zaman)} muayene`),
        skor: 4,
        metin: 'muayene seans',
        zaman,
      })
    }
  }
  if ((notlar.data || []).length) {
    const eksik = [...new Set((notlar.data || []).map((n) => String(n.session_id)).filter((id) => !seansHasta.has(id)))]
    if (eksik.length) {
      const { data: ek } = await arsivsizSeanslar(supabase, 'id, patient_id')
        .eq('doctor_id', doktorId)
        .in('id', eksik.slice(0, 250))
      for (const s of (ek || []) as { id: string; patient_id: string | null }[]) if (s.patient_id) seansHasta.set(String(s.id), String(s.patient_id))
    }
  }

  for (const n of notlar.data || []) {
    const pid = seansHasta.get(String(n.session_id))
    if (!pid || !isoAralikta(n.created_at as string, p)) continue
    ziyaretId.add(pid)
    const icd = Array.isArray(n.icd10_codes) ? JSON.stringify(n.icd10_codes) : ''
    const ilacListe = notIlacAdlari(n.content_ilaclar)
    const ilac = ilacListe.length ? ilacListe.join(' ') : ''
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
    const gun = String(n.created_at || '').slice(0, 10)
    for (const ad of ilacListe) {
      ham.push({ patientId: pid, kaynak: 'ilac', neden: kisa(`ilaç: ${ad}`), skor: 7, metin: ad, zaman: gun })
    }
  }

  for (const a of asilar.data || []) {
    if (!a.patient_id || !gunAralikta(a.uygulama_tarihi as string, p)) continue
    const metin = `${a.asi_adi || ''} ${a.notlar || ''} ${a.kaynak || ''}`
    ham.push({
      patientId: String(a.patient_id),
      kaynak: 'asi',
      neden: kisa(`${trTarih(a.uygulama_tarihi as string)} aşı: ${a.asi_adi || '?'}${a.kaynak === 'beyan' ? ' (beyan)' : ''}`),
      skor: 12,
      metin,
    })
  }

  for (const i of ilaclar.data || []) {
    const zaman = String(i.created_at || i.baslangic_tarihi || '')
    if (!i.patient_id || !isoAralikta(zaman, p)) continue
    const ad = String(i.ilac_adi || i.etken_madde || '')
    ham.push({ patientId: String(i.patient_id), kaynak: 'ilac', neden: kisa(`ilaç: ${ad}`), skor: 7, metin: ad, zaman })
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
    const metin = String(a.hekim_ozet || '').trim()
    if (!metin) continue
    ham.push({ patientId: String(a.patient_id), kaynak: 'belge', neden: kisa(`belge özeti: ${metin}`), skor: 6, metin })
  }

  for (const cih of cihaz.data || []) {
    if (!cih.patient_id || !isoAralikta(cih.created_at as string, p)) continue
    const metin = `${cih.tur || ''} ${cih.deger || ''} ${cih.profil || ''}`
    ham.push({ patientId: String(cih.patient_id), kaynak: 'cihaz', neden: kisa(`cihaz: ${cih.tur || 'ölçüm'}`), skor: 4, metin })
  }

  for (const g of goruntuler.data || []) {
    if (!g.patient_id || !isoAralikta((g.goruntuleme_tarihi || g.created_at) as string, p)) continue
    const metin = `${g.modalite || ''} ${g.vucut_bolgesi || ''} ${g.rapor_metni || ''}`
    ham.push({
      patientId: String(g.patient_id),
      kaynak: 'goruntu',
      neden: kisa(`görüntü: ${g.modalite || g.vucut_bolgesi || 'tetkik'}`),
      skor: 5,
      metin,
    })
  }

  for (const g of calismalar.data || []) {
    if (!g.patient_id || !isoAralikta((g.tarih || g.created_at) as string, p)) continue
    const metin = `${g.tip || ''} ${g.modalite || ''} ${g.bolge || ''} ${g.hekim_yorum || ''}`
    ham.push({
      patientId: String(g.patient_id),
      kaynak: 'goruntu',
      neden: kisa(`görüntü: ${g.tip || g.modalite || 'film'}`),
      skor: 6,
      metin,
    })
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
    .select('id, name_encrypted, dob_encrypted, gender_encrypted, notes_encrypted')
    .eq('doctor_id', doktorId)
    .eq('is_active', true)
    .limit(500)

  const cikti: DosyaAramaAday[] = []
  const hastaYas = new Map<string, { ad: string; ay: number | null }>()
  for (const h of hastalar || []) {
    const id = String(h.id)
    const g = grup.get(id) || { nedenler: [], skor: 0, metin: '' }
    let dob = ''
    try { dob = decrypt(String(h.dob_encrypted || '')) } catch { dob = '' }
    const ad = hastaAdiCoz(h.name_encrypted as string | null)
    const ay = dob ? yasAyHesapla(dob, now) : null
    hastaYas.set(id, { ad, ay })
    if (!yasFiltreEslesir(ay, q.yas)) continue

    const cins = cinsiyetCoz(h.gender_encrypted as string | null) || intakeCinsiyet.get(id) || null
    if (q.cinsiyet && cins !== q.cinsiyet) continue

    let notBlob = ''
    try {
      const hamNot = decrypt(String(h.notes_encrypted || ''))
      if (hamNot) {
        try {
          const o = JSON.parse(hamNot) as Record<string, unknown>
          const parca: string[] = []
          for (const [k, v] of Object.entries(o)) {
            if (GIZLI.has(k) || v == null) continue
            parca.push(`${k} ${Array.isArray(v) ? v.join(' ') : String(v)}`)
          }
          notBlob = parca.join(' ')
        } catch {
          notBlob = hamNot
        }
      }
    } catch { /* */ }

    const omurTorba = `${ad} ${dob} ${g.metin} ${intakeIl.get(id) || ''} ${notBlob}`
    const torba = q.pencere ? `${ad} ${g.metin}` : omurTorba
    const analiz = q.olcum === 'sure' || q.kirilim === 'asi_adi' || q.kirilim === 'ilac_adi' || q.ucDeger || q.yasKirilim
    if (!analiz) {
      if (q.terimler.length && !tumTerimlerEslesir(torba, q.terimler)) continue
      if (q.veya.length && !veyaEslesir(torba, q.veya)) continue
    }
    if (q.alanlar.some((a) => !alanEslesir(torba, a))) continue
    if (!sayisalEslesir(torba, q.sayisal)) continue
    if (!haricEslesir(torba, q.haric)) continue
    if (q.kanGrubu && !kanGrubuEslesir(torba, q.kanGrubu)) continue

    if (q.asi && !g.nedenler.some((n) => /aşı|asi/i.test(n))) {
      continue
    }

    const bolumSoru = q.seriGecikme || Boolean(q.mchat) || q.persentilEsik != null || q.bayrakVe.length > 0
    const seansGerek = !bolumSoru && (q.olcum === 'sure' || q.olcum === 'hasta' || q.ziyaret || Boolean(q.pencere && q.yas && q.olcum !== 'asi' && q.olcum !== 'ilac'))
    if (q.ziyaretYok) {
      if (ziyaretId.has(id)) continue
    } else if (seansGerek && !ziyaretId.has(id) && !g.nedenler.some((n) => /muayene|randevu|not:/i.test(n))) {
      continue
    }
    if (q.minSeans && (seansAdet.get(id) || 0) < q.minSeans) continue

    const anlamiVar = Boolean(
      q.yas || q.terimler.length || q.alanlar.length || q.asi || q.ziyaret || q.pencere
      || q.veya.length || q.haric.length || q.sayisal.length || q.kanGrubu || q.cinsiyet || q.olcum
      || q.minSeans || q.seriGecikme || q.mchat || q.persentilEsik || q.bayrakVe.length || q.kirilim || q.ilacSinif
      || q.bolumIstegi || q.ziyaretYok
    )
    if (!anlamiVar) continue

    const yasEtiket = ay != null ? `${Math.floor(ay / 12)} yaş ${ay % 12} ay` : ''
    cikti.push({
      id,
      ad,
      dobMetin: trTarih(dob || null),
      ozet: [q.ozet, yasEtiket, ...g.nedenler].filter(Boolean).join(' · '),
      skor: g.skor + (q.yas ? 10 : 0),
    })
  }

  const adaylar = q.kirilim === 'ilac_adi'
    ? []
    : cikti.sort((a, b) => b.skor - a.skor || a.ad.localeCompare(b.ad, 'tr')).slice(0, 40)
  const ek: string[] = []

  if (q.kirilim === 'ilac_adi') {
    const kir = ilacAdiKir(ilacSatirlariTekil(ham), q.ilacSinif, q.pencere?.etiket || 'kayıtlarda')
    ek.push(kir.cumle)
  }

  if (q.kirilim === 'asi_adi') {
    const grup = new Map<string, { n: number; beyan: number; kayit: number; cocuk: Set<string> }>()
    for (const h of ham.filter((x) => x.kaynak === 'asi')) {
      const ad = (h.neden.match(/aşı:\s*(.+?)(?:\s*\(beyan\))?$/i) || [,'aşı'])[1].trim()
      const cur = grup.get(ad) || { n: 0, beyan: 0, kayit: 0, cocuk: new Set<string>() }
      cur.n += 1
      if (/beyan/.test(h.neden + h.metin)) cur.beyan += 1
      else cur.kayit += 1
      cur.cocuk.add(h.patientId)
      grup.set(ad, cur)
    }
    ek.push([...grup.entries()].map(([ad, v]) => `${ad}: ${v.n} doz / ${v.cocuk.size} çocuk (beyan ${v.beyan}, kayıt ${v.kayit})`).join('; ') || 'Bu pencerede aşı yok.')
  }

  if (q.yasKirilim || q.ucDeger) {
    const withYas = seansSurePid.map((s) => {
      const h = hastaYas.get(s.id)
      return { ...s, ad: h?.ad || 'Hasta', ay: h?.ay ?? null }
    })
    const dk = (sn: number) => Math.round((sn / 60) * 10) / 10
    if (q.ucDeger && withYas.length) {
      const sirali = [...withYas].sort((a, b) => b.sure - a.sure)
      ek.push(`En uzun: ${sirali.slice(0, 3).map((x) => `${x.ad} ${dk(x.sure)} dk`).join(', ')}.`)
      ek.push(`En kısa: ${sirali.slice(-3).reverse().map((x) => `${x.ad} ${dk(x.sure)} dk`).join(', ')}.`)
    }
    if (q.yasKirilim) {
      const kucuk = withYas.filter((x) => x.ay != null && x.ay >= 12 && x.ay < 60)
      const buyuk = withYas.filter((x) => x.ay != null && x.ay >= 60)
      const ort = (arr: typeof withYas) => arr.length ? dk(arr.reduce((n, x) => n + x.sure, 0) / arr.length) : null
      ek.push(`1–5 yaş ortalama ${ort(kucuk) ?? '—'} dk (${kucuk.length} seans); 5+ ortalama ${ort(buyuk) ?? '—'} dk (${buyuk.length} seans).`)
    }
  }

  const eslesen = new Set(adaylar.map((a) => a.id))
  const asiAdedi = ham.filter((h) => h.kaynak === 'asi' && (q.kirilim || eslesen.has(h.patientId))).length
  const seansSayisi = ham.filter((h) => h.kaynak === 'seans' && (q.olcum === 'sure' || eslesen.has(h.patientId))).length
  const ilacAdedi = ham.filter((h) => h.kaynak === 'ilac' && (q.kirilim === 'ilac_adi' || eslesen.has(h.patientId))).length
  const sureOrtalama = seansSureleri.length
    ? Math.round((seansSureleri.reduce((a, b) => a + b, 0) / seansSureleri.length / 60) * 10) / 10
    : null
  const istatistik = istatistikKur(q, {
    hastaSayisi: adaylar.length,
    seansSayisi,
    asiAdedi,
    ilacAdedi,
    ortalamaSeansDk: sureOrtalama,
  })
  if (q.kirilim === 'ilac_adi' && ek.length) istatistik.cumle = ek.join(' ')
  else if (ek.length) istatistik.cumle = `${istatistik.cumle} ${ek.join(' ')}`
  return { adaylar, q, istatistik, tur: cevapTuru(q, null) }
}

function taniAdlari(n: { content_tani?: unknown; icd10_codes?: unknown }): string[] {
  const tani = String(n.content_tani || '').split(/[;\n]/).map((x) => x.trim()).filter(Boolean)
  if (tani.length) return [tani[0]]
  if (!Array.isArray(n.icd10_codes)) return []
  for (const c of n.icd10_codes) {
    if (!c) continue
    if (typeof c === 'string' && c.trim()) return [c.trim()]
    const o = c as { description_tr?: string; description?: string; code?: string }
    const ad = String(o.description_tr || o.description || o.code || '').trim()
    if (ad) return [ad]
  }
  return []
}

async function notHastaHaritasi(
  supabase: SupabaseClient,
  doktorId: string,
  notlar: { session_id?: string | null }[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const ids = [...new Set(notlar.map((n) => String(n.session_id || '')).filter(Boolean))]
  if (!ids.length) return map
  const { data } = await arsivsizSeanslar(supabase, 'id, patient_id')
    .eq('doctor_id', doktorId)
    .in('id', ids.slice(0, 400))
  for (const s of (data || []) as { id: string; patient_id: string | null }[]) if (s.patient_id) map.set(String(s.id), String(s.patient_id))
  return map
}

async function pratikKirilimYurut(
  supabase: SupabaseClient,
  doktorId: string,
  q: SorguAyik,
  now: Date,
): Promise<KlinikAramaSonuc> {
  const p = q.pencere
  const donem = p?.etiket || 'kayıtlarda'
  const ham: HamSatir[] = []

  if (q.kirilim === 'asi_adi') {
    const asiQ = arsivsizAsilar(supabase, 'patient_id, asi_adi, uygulama_tarihi, notlar, kaynak')
      .eq('doktor_id', doktorId)
      .order('uygulama_tarihi', { ascending: false })
      .limit(800)
    if (p) asiQ.gte('uygulama_tarihi', p.basGun).lte('uygulama_tarihi', p.bitGun)
    const { data } = await asiQ
    for (const a of data || []) {
      if (!a.patient_id || !gunAralikta(a.uygulama_tarihi as string, p)) continue
      ham.push({
        patientId: String(a.patient_id),
        kaynak: 'asi',
        neden: String(a.asi_adi || 'aşı'),
        skor: 12,
        metin: String(a.asi_adi || ''),
        zaman: String(a.uygulama_tarihi || ''),
      })
    }
    const kir = siraKir(ham.map((h) => ({ ad: h.metin || h.neden, patientId: h.patientId })), {
      donem, birim: 'aşı', yok: 'aşı kaydı yok', fiil: 'uyguladığın', adet: 'doz',
    })
    const istatistik = { ...istatistikKur(q, { hastaSayisi: new Set(ham.map((h) => h.patientId)).size, seansSayisi: 0, asiAdedi: ham.length, ilacAdedi: 0, ortalamaSeansDk: null }), cumle: kir.cumle }
    return { adaylar: [], q, istatistik, tur: 'pivot' }
  }

  const notQ = arsivsizNotlar(supabase, 'session_id, created_at, content_tani, basvuru_yakinmasi, icd10_codes, content_ilaclar')
    .eq('doctor_id', doktorId)
    .order('created_at', { ascending: false })
    .limit(800)
  if (p) notQ.gte('created_at', p.basIso)
  const { data: notlar } = await notQ
  const seansHasta = await notHastaHaritasi(supabase, doktorId, notlar || [])

  if (q.kirilim === 'ilac_adi' || q.olcum === 'ilac') {
    const ilacQ = arsivsizIlaclar(supabase, 'patient_id, ilac_adi, etken_madde, created_at, baslangic_tarihi')
      .eq('doctor_id', doktorId)
      .order('created_at', { ascending: false })
      .limit(800)
    if (p) ilacQ.gte('created_at', p.basIso).lte('created_at', p.bitIso)
    const { data: ilaclar } = await ilacQ
    for (const n of notlar || []) {
      const pid = seansHasta.get(String(n.session_id))
      if (!pid || !isoAralikta(n.created_at as string, p)) continue
      const gun = String(n.created_at || '').slice(0, 10)
      for (const ad of notIlacAdlari(n.content_ilaclar)) {
        ham.push({ patientId: pid, kaynak: 'ilac', neden: ad, skor: 7, metin: ad, zaman: gun })
      }
    }
    for (const i of ilaclar || []) {
      const zaman = String(i.created_at || i.baslangic_tarihi || '')
      if (!i.patient_id || !isoAralikta(zaman, p)) continue
      const ad = String(i.ilac_adi || i.etken_madde || '')
      if (ad) ham.push({ patientId: String(i.patient_id), kaynak: 'ilac', neden: ad, skor: 7, metin: ad, zaman })
    }
    const tekil = ilacSatirlariTekil(ham)
    const kir = q.kirilim === 'ilac_adi'
      ? ilacAdiKir(tekil, q.ilacSinif, donem)
      : null
    const istatistik = istatistikKur(q, { hastaSayisi: new Set(tekil.map((h) => h.patientId)).size, seansSayisi: 0, asiAdedi: 0, ilacAdedi: tekil.length, ortalamaSeansDk: null })
    if (kir) istatistik.cumle = kir.cumle
    return { adaylar: [], q, istatistik, tur: q.kirilim ? 'pivot' : 'sayim' }
  }

  for (const n of notlar || []) {
    const pid = seansHasta.get(String(n.session_id))
    if (!pid || !isoAralikta(n.created_at as string, p)) continue
    const adlar = q.kirilim === 'tani' ? taniAdlari(n) : [String(n.basvuru_yakinmasi || '').trim()].filter(Boolean)
    for (const ad of adlar) {
      ham.push({ patientId: pid, kaynak: 'not', neden: ad, skor: 8, metin: ad, zaman: String(n.created_at || '') })
    }
  }
  const kir = siraKir(ham.map((h) => ({ ad: h.metin || h.neden, patientId: h.patientId })), {
    donem,
    birim: q.kirilim === 'tani' ? 'tanı' : 'şikayet',
    yok: q.kirilim === 'tani' ? 'tanı kaydı yok' : 'şikayet kaydı yok',
    fiil: q.kirilim === 'tani' ? 'koyduğun' : 'görülen',
    anahtar: q.kirilim === 'sikayet' ? sikayetAnahtar : (ad) => trAramaNormalize(ad).slice(0, 48),
  })
  const istatistik = { ...istatistikKur(q, { hastaSayisi: new Set(ham.map((h) => h.patientId)).size, seansSayisi: ham.length, asiAdedi: 0, ilacAdedi: 0, ortalamaSeansDk: null }), cumle: kir.cumle }
  return { adaylar: [], q, istatistik, tur: 'pivot' }
}

async function pediBolumYurut(
  supabase: SupabaseClient,
  doktorId: string,
  q: SorguAyik,
  now: Date,
): Promise<KlinikAramaSonuc> {
  const { pediKohortGirdileri } = await import('@/app/api/doktor/pediatri/_kohort')
  const { pediAramaUygula } = await import('@/specialties/pediatri/engines/aramaBolumu')
  const { PEDI_HATIRLATMA_KONU } = await import('@/specialties/pediatri/engines/kohort')
  const bugun = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const { girdiler } = await pediKohortGirdileri(supabase, doktorId, bugun)
  const yakin = new Set<string>()
  if (q.hatirlatmaSay) {
    const { data: yakinSatir } = await supabase
      .from('hasta_mesaj_konulari')
      .select('patient_id')
      .eq('doctor_id', doktorId)
      .eq('konu', PEDI_HATIRLATMA_KONU)
      .gte('son_mesaj_at', new Date(now.getTime() - 7 * 86400000).toISOString())
    for (const r of yakinSatir || []) yakin.add(String(r.patient_id))
  }
  const pedi = pediAramaUygula(girdiler, q, bugun, yakin)
  const adaylar = pedi.slice(0, 40).map((s) => ({
    id: s.patientId,
    ad: s.ad,
    dobMetin: '',
    ozet: s.ozet,
    skor: 20,
  }))
  const istatistik = istatistikKur(q, {
    hastaSayisi: adaylar.length,
    seansSayisi: 0,
    asiAdedi: 0,
    ilacAdedi: 0,
    ortalamaSeansDk: null,
  })
  if (q.hatirlatmaSay) {
    const gider = pedi.filter((s) => s.hatirlatilabilir).length
    istatistik.cumle += ` ${gider} aileye bu hafta hatırlatma gidebilir (7 gün kuralı).`
  }
  return { adaylar, q, istatistik, tur: 'kohort' }
}

function kohortPaketi(
  q: SorguAyik,
  satirlar: Array<{ patientId: string; ad: string; ozet: string; hatirlatilabilir: boolean }>,
): KlinikAramaSonuc {
  const adaylar = satirlar.slice(0, 40).map((s) => ({ id: s.patientId, ad: s.ad, dobMetin: '', ozet: s.ozet, skor: 20 }))
  const istatistik = istatistikKur(q, { hastaSayisi: adaylar.length, seansSayisi: 0, asiAdedi: 0, ilacAdedi: 0, ortalamaSeansDk: null })
  if (q.hatirlatmaSay) {
    const gider = satirlar.filter((s) => s.hatirlatilabilir).length
    istatistik.cumle += ` ${gider} aileye bu hafta hatırlatma gidebilir (7 gün kuralı).`
  }
  return { adaylar, q, istatistik, tur: 'kohort' }
}

async function yakinHatirlatma(supabase: SupabaseClient, doktorId: string, konu: string, now: Date): Promise<Set<string>> {
  const yakin = new Set<string>()
  const { data } = await supabase
    .from('hasta_mesaj_konulari')
    .select('patient_id')
    .eq('doctor_id', doktorId)
    .eq('konu', konu)
    .gte('son_mesaj_at', new Date(now.getTime() - 7 * 86400000).toISOString())
  for (const r of data || []) yakin.add(String(r.patient_id))
  return yakin
}

async function gozBolumYurut(supabase: SupabaseClient, doktorId: string, q: SorguAyik, now: Date): Promise<KlinikAramaSonuc> {
  const { gozKohortVerisi } = await import('@/app/api/doktor/goz/_kohort')
  const { gozAramaUygula } = await import('@/specialties/goz-hastaliklari/engines/aramaBolumu')
  const { GOZ_HATIRLATMA_KONU } = await import('@/specialties/goz-hastaliklari/engines/kohort')
  const bugun = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const { satirlar } = await gozKohortVerisi(supabase, doktorId, bugun)
  const yakin = q.hatirlatmaSay ? await yakinHatirlatma(supabase, doktorId, GOZ_HATIRLATMA_KONU, now) : new Set<string>()
  return kohortPaketi(q, gozAramaUygula(satirlar, q, yakin))
}

async function kdBolumYurut(supabase: SupabaseClient, doktorId: string, q: SorguAyik, now: Date): Promise<KlinikAramaSonuc> {
  const { kdKohortVerisi } = await import('@/app/api/doktor/gebelik/_kohort')
  const { kdAramaUygula } = await import('@/specialties/kadin-dogum/engines/aramaBolumu')
  const { KD_HATIRLATMA_KONU } = await import('@/specialties/kadin-dogum/engines/kd-kohort')
  const bugun = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const { satirlar } = await kdKohortVerisi(supabase, doktorId, bugun)
  const yakin = q.hatirlatmaSay ? await yakinHatirlatma(supabase, doktorId, KD_HATIRLATMA_KONU, now) : new Set<string>()
  return kohortPaketi(q, kdAramaUygula(satirlar, q, yakin))
}

async function dahiliyeBolumYurut(supabase: SupabaseClient, doktorId: string, q: SorguAyik, now: Date): Promise<KlinikAramaSonuc> {
  const { kohortVerisi } = await import('@/app/api/doktor/dahiliye/_kohort')
  const { dahiliyeAramaUygula } = await import('@/specialties/dahiliye/engines/aramaBolumu')
  const bugun = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const { satirlar } = await kohortVerisi(supabase, doktorId, bugun)
  const yakin = q.hatirlatmaSay ? await yakinHatirlatma(supabase, doktorId, 'Kontrol zamanınız geldi', now) : new Set<string>()
  return kohortPaketi(q, dahiliyeAramaUygula(satirlar, q, yakin))
}

async function dermBolumYurut(supabase: SupabaseClient, doktorId: string, q: SorguAyik, now: Date): Promise<KlinikAramaSonuc> {
  const { dermKohortVerisi } = await import('@/app/api/doktor/dermatoloji/_kohort')
  const { dermAramaUygula } = await import('@/specialties/dermatoloji/engines/aramaBolumu')
  const { DERM_HATIRLATMA_KONU } = await import('@/specialties/dermatoloji/engines/kohort')
  const bugun = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  const { satirlar } = await dermKohortVerisi(supabase, doktorId, bugun)
  const yakin = q.hatirlatmaSay ? await yakinHatirlatma(supabase, doktorId, DERM_HATIRLATMA_KONU, now) : new Set<string>()
  return kohortPaketi(q, dermAramaUygula(satirlar, q, yakin))
}

function kanGrubuEslesir(torba: string, kan: string): boolean {
  const t = trAramaNormalize(torba).replace(/\s+/g, '')
  const k = trAramaNormalize(kan).replace(/\s+/g, '').replace(/^orh/, '0rh')
  return t.includes(k) || t.includes(k.replace(/^0rh/, 'orh'))
}
