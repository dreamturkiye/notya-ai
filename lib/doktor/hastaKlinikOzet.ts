/**
 * NOTYA-OZET-CIFT-01 — Hasta Özet sekmesinde iki klinik özet:
 *  - Genel Özet: doğuşundan / ilk kayıttan itibaren dosyadaki veriler
 *  - Son muayene özeti: yalnız en son onaylı vizit
 * Her onayda notes_encrypted içine yazılır; LLM zorunlu değil (deterministik Türkçe).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/lib/security/encryption'
import { arsivsizIlaclar, arsivsizNotlar } from '@/lib/doktor/arsiv'
import { yasHesapla } from '@/lib/doktor/yas'
import { cinsiyetTr } from '@/lib/utils/cinsiyet'
import { kronikListesi } from '@/lib/doktor/hastaOzetKayit'
import { sifreliFormlariCoz, formlariBirlestir } from '@/lib/intake/formBirlestir'

export type KlinikOzetNot = {
  created_at?: string | null
  approved_at?: string | null
  basvuru_yakinmasi?: string | null
  content_tani?: string | null
  content_degerlendirme?: string | null
  content_plan?: string | null
  content_tedavi?: string | null
  content_subjektif?: string | null
  hasta_ozeti?: string | null
}

const TZ = 'Europe/Istanbul'

/** NOTYA-OZET-GELIS-01: bağlam (hasta formu + randevu notu) — geliş sebebi ve gebelik her iki özette görünür. */
export type KlinikOzetBaglam = { gelisSebebi?: string; gebelik?: string }

const GEBE_RE = /(\d{1,2})\s*(?:haftal[ıi]k|hafta)[^.\n]{0,20}?(?:gebe|hamile)|(?:gebe|hamile)[^.\n]{0,40}?(\d{1,2})\s*(?:\.\s*)?(?:hafta|haftal[ıi]k)|\b(?:gebe|hamile)\w*/i

function metinOlarak(v: unknown): string {
  return Array.isArray(v) ? v.map((x) => String(x ?? '').trim()).filter(Boolean).join(', ') : String(v ?? '').trim()
}

/** Form yanıtları + randevu notlarından geliş sebebi ve gebelik durumu. Yalnız veride olan alanlar konuşur (branş sızması yok). */
export function klinikOzetBaglami(yanitlar: Record<string, unknown> | null | undefined, randevuNotlari: (string | null | undefined)[] = []): KlinikOzetBaglam {
  const y = yanitlar || {}
  const gelis = Object.keys(y).filter((k) => /^basvuruNedeni/i.test(k)).map((k) => metinOlarak(y[k])).find(Boolean) || ''
  const gebelikAlanlari = ['gebelikSuphesi', 'adetDuzeni', 'gebelikEmzirme', 'gebelikDurumuDerm'].map((k) => metinOlarak(y[k])).join(' | ')
  const formGebe = /Hamileyim|Gebeyim/i.test(gebelikAlanlari)
  const emziriyor = /Emziriyorum/i.test(gebelikAlanlari)
  const hafta = metinOlarak(y.gebelikHaftasi).match(/\d{1,2}/)?.[0]
  const parcalar: string[] = []
  if (formGebe) parcalar.push(hafta ? `gebe, yaklaşık ${hafta}. hafta (hasta formu)` : 'gebe (hasta formu)')
  else if (emziriyor) parcalar.push('emziriyor (hasta formu)')
  const sonAdet = metinOlarak(y.sonAdetTarihi)
  if (formGebe && sonAdet) parcalar.push(`son adet tarihi ${sonAdet}`)
  if (!formGebe) {
    for (const n of randevuNotlari) {
      const m = String(n || '').match(GEBE_RE)
      if (m) { parcalar.push(`randevu notu: “${kisalt(String(n), 100)}”`); break }
    }
  }
  return { gelisSebebi: kisalt(gelis, 220) || undefined, gebelik: parcalar.join('; ') || undefined }
}

function trTarih(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ,
    })
  } catch {
    return ''
  }
}

function kisalt(s: string, azami: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= azami) return t
  return `${t.slice(0, azami - 1).trim()}…`
}

function satirTemiz(s: string | null | undefined, azami = 280): string {
  return kisalt(String(s || '').replace(/\n+/g, ' '), azami)
}

/** Son onaylı muayeneden kısa özet — geliş sebebi ve gebelik durumu her zaman yer alır. */
export function sonMuayeneOzetiYaz(not: KlinikOzetNot | null | undefined, baglam?: KlinikOzetBaglam): string {
  if (!not) return ''
  const tarih = trTarih(not.approved_at || not.created_at)
  const veli = String(not.hasta_ozeti || '').trim()
  const yakinma = satirTemiz(not.basvuru_yakinmasi || not.content_subjektif, 160) || baglam?.gelisSebebi || ''
  const gebelik = baglam?.gebelik && !/gebe|hamile/i.test(veli) ? baglam.gebelik : ''
  const gebeParca = gebelik ? `Gebelik: ${gebelik}.` : ''
  if (veli) {
    const ekGelis = yakinma && !veli.toLowerCase().includes(yakinma.slice(0, 24).toLowerCase()) ? `Geliş sebebi: ${yakinma}.` : ''
    return [tarih ? `${tarih} muayenesi:` : 'Son muayene:', veli, ekGelis, gebeParca].filter(Boolean).join(' ')
  }
  const parcalar: string[] = []
  if (tarih) parcalar.push(`${tarih} muayenesi.`)
  if (yakinma) parcalar.push(`Geliş sebebi: ${yakinma}`)
  if (gebeParca) parcalar.push(gebeParca)
  const tani = satirTemiz(not.content_tani || not.content_degerlendirme, 200)
  if (tani) parcalar.push(`Değerlendirme / tanı: ${tani}`)
  const plan = satirTemiz(not.content_plan || not.content_tedavi, 200)
  if (plan) parcalar.push(`Plan: ${plan}`)
  return parcalar.join(' ').trim()
}

export type GenelOzetGirdi = {
  adSoyad?: string | null
  dogumIso?: string | null
  cinsiyetHam?: string | null
  notes: Record<string, unknown>
  aktifIlaclar: string[]
  onayliNotlar: KlinikOzetNot[] // yeniden eskiye (en yeni önce)
  baglam?: KlinikOzetBaglam
}

/** Doğuşundan / dosyadan derlenen genel klinik özet (kimliksiz klinik dil). */
export function genelOzetYaz(g: GenelOzetGirdi): string {
  const cumleler: string[] = []
  const yas = g.dogumIso ? yasHesapla(g.dogumIso) : ''
  const cins = cinsiyetTr(g.cinsiyetHam) || ''
  const kim = [yas ? `${yas}` : '', cins].filter(Boolean).join(', ')
  if (kim) cumleler.push(`Hasta ${kim}.`)
  else cumleler.push('Hasta dosyası özeti.')
  if (g.baglam?.gebelik) cumleler.push(`Gebelik durumu: ${g.baglam.gebelik}.`)

  const alerji = String(g.notes.alerjiler || '').trim()
  const kronik = kronikListesi(g.notes)
  const surekliNotes = String(g.notes.suregenIlaclar || '').trim()
  const ilaclar = g.aktifIlaclar.length
    ? g.aktifIlaclar.slice(0, 8)
    : surekliNotes
      ? surekliNotes.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean).slice(0, 8)
      : []

  if (alerji) cumleler.push(`Alerji: ${kisalt(alerji, 160)}.`)
  else cumleler.push('Bilinen alerji kaydı yok veya belirtilmemiş.')
  if (kronik.length) cumleler.push(`Kronik / özgeçmiş: ${kisalt(kronik.join('; '), 220)}.`)
  if (ilaclar.length) cumleler.push(`Sürekli / aktif ilaçlar: ${kisalt(ilaclar.join('; '), 240)}.`)

  const notlar = g.onayliNotlar.filter((n) => n.approved_at || n.content_tani || n.basvuru_yakinmasi)
  if (!notlar.length) {
    if (g.baglam?.gelisSebebi) cumleler.push(`Geliş sebebi: ${g.baglam.gelisSebebi}.`)
    cumleler.push('Henüz onaylı muayene kaydı yok.')
    return cumleler.join(' ')
  }

  const ilk = notlar[notlar.length - 1]
  const son = notlar[0]
  const ilkT = trTarih(ilk.approved_at || ilk.created_at)
  const sonT = trTarih(son.approved_at || son.created_at)
  cumleler.push(
    notlar.length === 1
      ? `Dosyada 1 onaylı muayene var${sonT ? ` (${sonT})` : ''}.`
      : `Dosyada ${notlar.length} onaylı muayene var${ilkT && sonT ? ` (${ilkT} – ${sonT})` : ''}.`,
  )

  const tanilar: string[] = []
  for (const n of notlar.slice(0, 8)) {
    const t = satirTemiz(n.content_tani, 90)
    if (t && !tanilar.some((x) => x.toLowerCase() === t.toLowerCase())) tanilar.push(t)
    if (tanilar.length >= 5) break
  }
  if (tanilar.length) cumleler.push(`Öne çıkan tanılar / değerlendirmeler: ${tanilar.join('; ')}.`)

  // Son muayene planı kısaltılmaz — hekim Özet'te lot no / doz satırını eksiksiz okuyabilmeli.
  const sonYakinma = satirTemiz(son.basvuru_yakinmasi || son.content_subjektif, 400)
  const sonTani = satirTemiz(son.content_tani, 400)
  const sonPlan = String(son.content_plan || son.content_tedavi || '').replace(/\s+/g, ' ').trim()
  const sonParca = [
    sonT ? `Son muayene (${sonT})` : 'Son muayene',
    sonYakinma ? `geliş sebebi: ${sonYakinma}` : '',
    sonTani ? `tanı: ${sonTani}` : '',
    sonPlan ? `plan: ${sonPlan}` : '',
  ].filter(Boolean)
  if (sonParca.length > 1) cumleler.push(`${sonParca[0]} — ${sonParca.slice(1).join('; ')}.`)

  return cumleler.join(' ').replace(/\s+/g, ' ').trim()
}

export function klinikOzetleriNotesYaz(
  notes: Record<string, unknown>,
  genelOzet: string,
  sonMuayeneOzeti: string,
): Record<string, unknown> {
  return {
    ...notes,
    genelOzet: genelOzet.trim(),
    sonMuayeneOzeti: sonMuayeneOzeti.trim(),
    klinikOzetGuncelleme: new Date().toISOString(),
  }
}

export function klinikOzetleriNotesOku(notes: Record<string, unknown>): {
  genelOzet: string
  sonMuayeneOzeti: string
  klinikOzetGuncelleme: string | null
} {
  return {
    genelOzet: String(notes.genelOzet || '').trim(),
    sonMuayeneOzeti: String(notes.sonMuayeneOzeti || '').trim(),
    klinikOzetGuncelleme: notes.klinikOzetGuncelleme != null ? String(notes.klinikOzetGuncelleme) : null,
  }
}

function notesCoz(ham: string | null | undefined): Record<string, unknown> {
  if (!ham) return {}
  try {
    const j = JSON.parse(decrypt(ham))
    return j && typeof j === 'object' ? j as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

/**
 * Onay sonrası (veya Özet sekmesi yenilemesi): her iki özeti yeniden yazar.
 * Hata fırlatmaz — çağıran onayı bloklamasın.
 */
export async function hastaKlinikOzetleriGuncelle(
  supabase: SupabaseClient,
  doctorId: string,
  patientId: string,
  sonNot?: KlinikOzetNot | null,
): Promise<{ genelOzet: string; sonMuayeneOzeti: string } | null> {
  try {
    const { data: hasta } = await supabase
      .from('patients')
      .select('id, notes_encrypted, dob_encrypted, gender_encrypted, name_encrypted')
      .eq('id', patientId)
      .eq('doctor_id', doctorId)
      .maybeSingle()
    if (!hasta) return null

    let dogum: string | null = null
    let cinsiyet: string | null = null
    try { if (hasta.dob_encrypted) dogum = decrypt(String(hasta.dob_encrypted)) } catch { /* */ }
    try { if (hasta.gender_encrypted) cinsiyet = decrypt(String(hasta.gender_encrypted)) } catch { /* */ }

    const { data: notHam } = await arsivsizNotlar(
      supabase,
      'created_at, approved_at, basvuru_yakinmasi, content_tani, content_degerlendirme, content_plan, content_tedavi, content_subjektif, hasta_ozeti, sessions!inner(patient_id)',
    )
      .eq('doctor_id', doctorId)
      .eq('sessions.patient_id', patientId)
      .not('approved_at', 'is', null)
      .order('approved_at', { ascending: false })
      .limit(24)

    let notlar = (Array.isArray(notHam) ? notHam : []) as KlinikOzetNot[]
    if (!notlar.length && sonNot) notlar = [sonNot]
    // En güncel onay bu istekteki not olabilir (henüz sorguda gecikmeli); öne al.
    if (sonNot) {
      const imza = `${sonNot.approved_at || ''}|${sonNot.basvuru_yakinmasi || ''}|${sonNot.content_tani || ''}`
      const ayni = notlar.findIndex((n) => `${n.approved_at || ''}|${n.basvuru_yakinmasi || ''}|${n.content_tani || ''}` === imza)
      if (ayni >= 0) notlar = [sonNot, ...notlar.filter((_, i) => i !== ayni)]
      else notlar = [sonNot, ...notlar]
    }

    const { data: ilacHam } = await arsivsizIlaclar(supabase, 'ilac_adi, doz, kullanim_sikli')
      .eq('doctor_id', doctorId)
      .eq('patient_id', patientId)
      .eq('aktif', true)
      .limit(20)
    const aktifIlaclar = (Array.isArray(ilacHam) ? ilacHam : []).map((i) => {
      const o = i as { ilac_adi?: string; doz?: string; kullanim_sikli?: string }
      return [o.ilac_adi, o.doz, o.kullanim_sikli].filter(Boolean).join(' ')
    }).filter(Boolean)

    const notes = notesCoz(hasta.notes_encrypted as string | null)
    let baglam: KlinikOzetBaglam = {}
    try {
      const [{ data: formHam }, { data: rdvHam }] = await Promise.all([
        supabase.from('hasta_intake_formlari').select('form_data_encrypted, created_at').eq('patient_id', patientId).eq('doktor_id', doctorId).not('form_data_encrypted', 'is', null).order('created_at', { ascending: false }).limit(5),
        supabase.from('randevular').select('notlar, baslangic').eq('patient_id', patientId).eq('doktor_id', doctorId).neq('durum', 'iptal').order('baslangic', { ascending: false }).limit(5),
      ])
      const birlesik = formlariBirlestir(sifreliFormlariCoz(formHam as never).formlar)
      baglam = klinikOzetBaglami(birlesik?.yanitlar, (Array.isArray(rdvHam) ? rdvHam : []).map((r) => (r as { notlar?: string | null }).notlar))
    } catch (e) { console.error('[klinik-ozet] baglam', e) }
    const genelOzet = genelOzetYaz({
      baglam,
      dogumIso: dogum,
      cinsiyetHam: cinsiyet,
      notes,
      aktifIlaclar,
      onayliNotlar: notlar,
    })
    const sonMuayeneOzeti = sonMuayeneOzetiYaz(notlar[0] || sonNot || null, baglam)
    const yeniNotes = klinikOzetleriNotesYaz(notes, genelOzet, sonMuayeneOzeti)

    const { error } = await supabase
      .from('patients')
      .update({ notes_encrypted: encrypt(JSON.stringify(yeniNotes)) })
      .eq('id', patientId)
      .eq('doctor_id', doctorId)
    if (error) {
      console.error('[klinik-ozet] yaz', error.message)
      return null
    }
    return { genelOzet, sonMuayeneOzeti }
  } catch (e) {
    console.error('[klinik-ozet]', e)
    return null
  }
}
