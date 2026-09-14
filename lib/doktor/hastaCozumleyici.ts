/**
 * NOTYA-KONSULT-02 — Doktorun serbest konuşmasından hasta çözümleme.
 *
 * Apple sadelik ilkesi: doktor ayrı bir ekrana gitmez; asistana "Mehmet Yılmaz kaç kere
 * geldi?" ya da "son hastamın ilaçları neydi?" der. Bu modül mesajdaki hasta göndermesini
 * doktorun kendi kayıtlı hastalarıyla eşleştirir (isimler şifreli — sunucuda çözülür,
 * asla istemciye ham liste gitmez). Tek eşleşme → dosya bağlanır; birden çok eşleşme →
 * asistan hangisi olduğunu sorar; eşleşme yoksa normal sohbet sürer.
 *
 * Türkçe karakter düzleştirme ile "Cigdem" yazımı "Çiğdem" kaydını bulur.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'

export type HastaCozumu =
  | { tur: 'tek'; patientId: string; ad: string }
  | { tur: 'coklu'; adaylar: string[] }
  | { tur: 'yok' }

const TR_MAP: Record<string, string> = { 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u' }

function duzle(s: string): string {
  return s.replace(/[çÇğĞıIİöÖşŞüÜ]/g, (c) => TR_MAP[c] || c).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/ +/g, ' ').trim()
}

function adCoz(nameEncrypted: string | null): string {
  if (!nameEncrypted) return ''
  try {
    const ham = decrypt(nameEncrypted)
    try { return String(JSON.parse(ham).ad || '') } catch { return ham }
  } catch { return '' }
}

/** dd.mm.yyyy / dd/mm/yyyy / dd-mm-yyyy — mesajda geçen bir doğum tarihini yakalar. */
function tarihCoz(mesaj: string): string | null {
  const m = mesaj.match(/\b(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{4})\b/)
  if (!m) return null
  const [, gg, aa, yyyy] = m
  return `${yyyy}-${aa.padStart(2, '0')}-${gg.padStart(2, '0')}`
}

export async function hastaninSozunuCoz(
  supabase: SupabaseClient,
  doctorId: string,
  mesaj: string
): Promise<HastaCozumu> {
  const m = ' ' + duzle(mesaj) + ' '

  // "son hastam" / "az önceki hasta" / "en son gelen hasta"
  if (/ (son|az onceki|en son)( gelen| muayene ettigim)? hasta/.test(m)) {
    const { data } = await supabase
      .from('sessions').select('patient_id').eq('doctor_id', doctorId)
      .not('patient_id', 'is', null).order('created_at', { ascending: false }).limit(1)
    const pid = data?.[0]?.patient_id
    if (pid) {
      const { data: p } = await supabase.from('patients').select('id, name_encrypted').eq('id', pid).single()
      if (p) return { tur: 'tek', patientId: p.id, ad: adCoz(p.name_encrypted) || 'son hasta' }
    }
  }

  const { data: hastalar } = await supabase
    .from('patients').select('id, name_encrypted').eq('doctor_id', doctorId).eq('is_active', true).limit(500)
  if (!hastalar || hastalar.length === 0) return { tur: 'yok' }

  const tam: { id: string; ad: string }[] = []
  const kismi: { id: string; ad: string }[] = []
  for (const h of hastalar) {
    const ad = adCoz(h.name_encrypted)
    if (!ad) continue
    const adDuz = duzle(ad)
    if (!adDuz) continue
    if (m.includes(' ' + adDuz + ' ')) { tam.push({ id: h.id, ad }); continue }
    const parcalar = adDuz.split(' ').filter((p) => p.length >= 3)
    if (parcalar.some((p) => m.includes(' ' + p + ' '))) kismi.push({ id: h.id, ad })
  }

  if (tam.length === 1) return { tur: 'tek', patientId: tam[0].id, ad: tam[0].ad }
  if (tam.length > 1) {
    const daralan = await tarihleDaralt(supabase, tam, mesaj)
    if (daralan) return daralan
    return { tur: 'coklu', adaylar: tam.map((x) => x.ad) }
  }
  if (kismi.length === 1) return { tur: 'tek', patientId: kismi[0].id, ad: kismi[0].ad }
  if (kismi.length > 1 && kismi.length <= 5) {
    const daralan = await tarihleDaralt(supabase, kismi, mesaj)
    if (daralan) return daralan
    return { tur: 'coklu', adaylar: kismi.map((x) => x.ad) }
  }
  return { tur: 'yok' }
}

async function tarihleDaralt(
  supabase: SupabaseClient,
  adaylar: { id: string; ad: string }[],
  mesaj: string,
): Promise<HastaCozumu | null> {
  const tarih = tarihCoz(mesaj)
  if (!tarih) return null
  const { data: hastalar } = await supabase.from('patients').select('id, dob_encrypted').in('id', adaylar.map((a) => a.id))
  const eslesen = (hastalar || []).filter((h) => {
    try { return decrypt(String(h.dob_encrypted || '')).slice(0, 10) === tarih } catch { return false }
  })
  if (eslesen.length === 1) {
    const aday = adaylar.find((a) => a.id === eslesen[0].id)
    if (aday) return { tur: 'tek', patientId: aday.id, ad: aday.ad }
  }
  return null
}
