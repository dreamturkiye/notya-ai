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
 *
 * Kaan/Gökhan (2026-09-14): "doğum tarihini hatırlamak zor" — aynı isimli adaylar artık
 * doğum tarihi + son geliş nedeniyle birlikte listelenir (sesBul route bunu okur); doktor
 * doğum tarihiyle, SIRAYLA ("ikincisi"/"birinci hasta") veya son şikayetle seçebilir.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { klinikAramaMi, klinikAramaYurut, listeSorgusuMu } from '@/lib/doktor/hastaDosyaAra'
import { tekHastaSorusuMu } from '@/lib/doktor/hastaAramaFiltre'
import { kohortSorusuMu } from '@/lib/asistan/aktifHasta'
import { PERSONAS } from '@/lib/asistan/personaEngine'

export interface CozumAday { id: string; ad: string; dobMetin: string; ozet: string }

export type HastaCozumu =
  | { tur: 'tek'; patientId: string; ad: string; sayiMetin?: string }
  | { tur: 'coklu'; adaylar: CozumAday[]; sayiMetin?: string }
  | { tur: 'yok'; sayiMetin?: string }

/** Ses + sohbet aynı cümleyi söyler — pratik sıralama / çoklu aday LLM'e gitmez. */
export function cozumKonus(cozum: HastaCozumu): string | null {
  if (cozum.tur === 'coklu') {
    const liste = cozum.adaylar
      .map((a, i) => `${i + 1}. ${a.ad}${a.dobMetin ? ` (d.t. ${a.dobMetin})` : ''} — ${a.ozet}`)
      .join('. ')
    const bas = cozum.sayiMetin || `${cozum.adaylar.length} hasta`
    return `${bas}: ${liste}. Hangisini istiyorsunuz — birinci, ikinci, adıyla veya şikayetiyle söyleyin.`
  }
  if (cozum.tur === 'yok' && cozum.sayiMetin) return cozum.sayiMetin
  return null
}

const TR_MAP: Record<string, string> = { 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u' }
function duzle(s: string): string {
  return s.replace(/[çÇğĞıIİöÖşŞüÜ]/g, (c) => TR_MAP[c] || c).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/ +/g, ' ').trim()
}
/**
 * NOTYA-SES-DOLGU-01 (Dr. Gökhan, 2026-09-25): spoken requests carry pauses and fillers
 * ("Umutcan, eee, Türkoğlu'nun…") and speech recognition may split a name ("Umut Can").
 * Tokens of the (duzle'd) message without fillers / single letters, plus adjacent pairs joined.
 */
const DOLGU = new Set(['e', 'ee', 'eee', 'eeee', 'i', 'ii', 'iii', 'hm', 'hmm', 'hmmm', 'mm', 'mmm', 'sey', 'ya', 'yani', 'hani'])
/**
 * NOTYA-HASTA-ODAK-01 (Dr. Gökhan canlı vaka, 2026-09-26): "Biraz koy. Ayşe, benim spesifik arzum... aşı karnesini
 * gösterir misin?" — doktor asistana seslendi, çözümleyici "Ayşe"yi hasta adı sandı ve Ayşe Yeşil'in (5 yaş) dosyasını
 * açtı; o sırada konuşulan hasta Umutcan Türkoğlu'ydu. Eski HITAP yalnız mesaj başındaki / "merhaba" sonrası hitabı
 * siliyordu. Şimdi: (1) her persona adı (30 uzman), (2) cümle başında / noktalama sonrası / hitap fiilinden sonra ve
 * ardından virgül-nokta gelen ya da "Hocam / Hanım" ile biten ad, mesajın NERESİNDE olursa olsun hitaptır;
 * (3) tek başına bir persona adı kısmi eşleşmede (kismi) hiçbir hastayı seçemez — tam ad ("Ayşe Yeşil") aynen çalışır.
 */
function personaIlkAdlari(): string[] {
  const adlar = new Set<string>()
  for (const p of Object.values(PERSONAS)) {
    const ham = String(p.name || '').replace(/^\s*(prof\.?\s*)?(dr\.?\s*)?/i, '').trim().split(/\s+/)[0] || ''
    if (!ham) continue
    adlar.add(ham.toLocaleLowerCase('tr'))
    const duz = duzle(ham)
    if (duz) adlar.add(duz)
  }
  return Array.from(adlar).filter(Boolean).sort((a, b) => b.length - a.length)
}
const PERSONA_ADLARI = personaIlkAdlari()
/** duzle'd persona first names — partial-name matching must never be triggered by one of these. */
const PERSONA_ADLARI_DUZ = new Set(PERSONA_ADLARI.map(duzle).filter(Boolean))
const kacis = (x: string) => x.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&')
const AD_ALT = PERSONA_ADLARI.map(kacis).join('|')
const HITAP = new RegExp(
  '(^|[.!?;:,]\\s*|\\b(?:merhaba|selam|günaydın|iyi akşamlar|iyi günler|hey|bak|bana|söyle|peki|tamam|evet|hayır|lütfen)\\s+)' +
  '(?:' + AD_ALT + ')(?:\\s+(?:hanım|hanim|hocam|hoca))?\\s*(?:[,.!?;:]|$)',
  'giu'
)
/** "Ayşe Hocam" / "Ayşe Hanım" anywhere is the assistant; no patient is addressed as Hocam. */
const HITAP_HOCAM = new RegExp('\\b(?:' + AD_ALT + ')\\s+(?:hanım|hanim|hocam|hoca)\\b', 'giu')
export function hitapsiz(mesaj: string): string {
  return String(mesaj || '')
    .replace(HITAP, (_t, bas) => String(bas || '') + ' ')
    .replace(HITAP_HOCAM, ' ')
}
export function sesliSozTokenlari(duzMesaj: string): Set<string> {
  const t = duzMesaj.split(' ').filter((x) => x.length >= 2 && !DOLGU.has(x))
  const s = new Set(t)
  for (let i = 0; i + 1 < t.length; i++) s.add(t[i] + t[i + 1])
  return s
}
/** Every part of a multi-word name appears as a word (any order, words in between allowed). */
export function tumAdParcalariVar(adDuz: string, tokenlar: Set<string>): boolean {
  const p = adDuz.split(' ').filter(Boolean)
  return p.length >= 2 && p.every((x) => tokenlar.has(x))
}
function adCoz(nameEncrypted: string | null): string {
  if (!nameEncrypted) return ''
  try {
    const ham = decrypt(nameEncrypted)
    try { return String(JSON.parse(ham).ad || '') } catch { return ham }
  } catch { return '' }
}
function guvenliCoz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}

/** dd.mm.yyyy / dd/mm/yyyy / dd-mm-yyyy — mesajda geçen bir doğum tarihini yakalar. */
function tarihCoz(mesaj: string): string | null {
  const m = mesaj.match(/\b(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{4})\b/)
  if (!m) return null
  const [, gg, aa, yyyy] = m
  return `${yyyy}-${aa.padStart(2, '0')}-${gg.padStart(2, '0')}`
}

// Kaan/Gökhan (2026-09-14) düzeltmesi: "ikincisi" gibi ek almış hâller \b...\b tam kelime
// eşleşmesini geçmiyordu. Ayrıca çıplak "bir"/"iki" gibi son derece yaygın kelimeleri sıra
// göstergesi saymak tehlikeliydi ("bir tane hastam var" gibi cümlelerde yanlış tetiklenirdi).
// Yalnız ORDINAL gövdelerle (önek eşleşmesi, ek toleranslı) veya tek başına rakamla eşleşir.
const ORDINAL_GOVDE: [string, number][] = [
  ['birinci', 0], ['ilk', 0],
  ['ikinci', 1],
  ['ucuncu', 2],
  ['dorduncu', 3],
  ['besinci', 4],
]
function siraCoz(mesaj: string): number | null {
  const kelimeler = duzle(mesaj).split(' ')
  for (const kelime of kelimeler) {
    if (/^[1-5]$/.test(kelime)) return Number(kelime) - 1
    for (const [govde, idx] of ORDINAL_GOVDE) {
      if (kelime.startsWith(govde)) return idx
    }
  }
  return null
}

function trTarih(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Adayın son onaylı notundan kısa, sesli okunacak bir özet — "son şikayetle ayırt et" için. */
async function sonZiyaretOzeti(supabase: SupabaseClient, doctorId: string, patientId: string): Promise<string> {
  // NOTYA-ARSIV-01: arşivlenmiş muayene "son ziyaret" / "son hastam" olarak okunmaz.
  const { data } = await arsivsizNotlar(supabase, 'basvuru_yakinmasi, content_degerlendirme, sessions!inner(patient_id)')
    .eq('sessions.patient_id', patientId).eq('doctor_id', doctorId).not('approved_at', 'is', null)
    .order('created_at', { ascending: false }).limit(1)
  const n = data?.[0] as { basvuru_yakinmasi?: string | null; content_degerlendirme?: string | null } | undefined
  const t = (n?.basvuru_yakinmasi || n?.content_degerlendirme || '').trim()
  if (!t) return 'henüz muayene kaydı yok'
  const ilkCumle = t.split(/(?<=[.!?])\s/)[0] || t
  return ilkCumle.length > 90 ? `${ilkCumle.slice(0, 89)}…` : ilkCumle
}

async function adaylariZenginlestir(supabase: SupabaseClient, doctorId: string, adaylar: { id: string; ad: string }[]): Promise<CozumAday[]> {
  const { data: hastalar } = await supabase.from('patients').select('id, dob_encrypted').eq('doctor_id', doctorId).in('id', adaylar.map((a) => a.id))
  const dobMap = new Map((hastalar || []).map((h) => [h.id, guvenliCoz(h.dob_encrypted)]))
  const zengin = await Promise.all(adaylar.map(async (a) => ({
    id: a.id, ad: a.ad,
    dobMetin: trTarih(dobMap.get(a.id) || null),
    ozet: await sonZiyaretOzeti(supabase, doctorId, a.id),
  })))
  // Sıralı ve KARARLI: her çağrıda aynı sırada döner ki "ikincisi" tutarlı olsun
  return zengin.sort((a, b) => a.id.localeCompare(b.id))
}

export async function hastaninSozunuCoz(
  supabase: SupabaseClient,
  doctorId: string,
  mesaj: string,
  /** NOTYA-BETA-0925: kimlik sorusu ("annesinin adı ne") yalnız adla çözülür — "anne" kelimesi klinik arama filtresine dönmez. */
  secenek: { yalnizAd?: boolean } = {}
): Promise<HastaCozumu> {
  const m = ' ' + duzle(mesaj) + ' '
  // "son hastam" / "az önceki hasta" / "en son gelen hasta"
  if (/ (son|az onceki|en son)( gelen| muayene ettigim)? hasta/.test(m)) {
    const { data } = await arsivsizSeanslar(supabase, 'patient_id').eq('doctor_id', doctorId)
      .not('patient_id', 'is', null).order('created_at', { ascending: false }).limit(1)
    const pid = data?.[0]?.patient_id
    if (pid) {
      const { data: p } = await supabase.from('patients').select('id, name_encrypted').eq('id', pid).eq('doctor_id', doctorId).maybeSingle()
      if (p) return { tur: 'tek', patientId: p.id, ad: adCoz(p.name_encrypted) || 'son hasta' }
    }
  }
  const { data: hastalar } = await supabase
    .from('patients').select('id, name_encrypted').eq('doctor_id', doctorId).eq('is_active', true).limit(500)
  if (!hastalar || hastalar.length === 0) return { tur: 'yok' }
  const adMesaji = hitapsiz(mesaj)
  const mAd = ' ' + duzle(adMesaji) + ' '
  const tokenlar = sesliSozTokenlari(duzle(adMesaji))
  const tam: { id: string; ad: string }[] = []
  const kismi: { id: string; ad: string }[] = []
  for (const h of hastalar) {
    const ad = adCoz(h.name_encrypted)
    if (!ad) continue
    const adDuz = duzle(ad)
    if (!adDuz) continue
    if (mAd.includes(' ' + adDuz + ' ') || tumAdParcalariVar(adDuz, tokenlar)) { tam.push({ id: h.id, ad }); continue }
    // NOTYA-HASTA-ODAK-01: a persona first name alone ("Ayşe") never partially matches a patient.
    const parcalar = adDuz.split(' ').filter((p) => p.length >= 3 && !PERSONA_ADLARI_DUZ.has(p))
    if (parcalar.some((p) => mAd.includes(' ' + p + ' ') || tokenlar.has(p))) kismi.push({ id: h.id, ad })
  }

  const cozAdaylar = async (adaylar: { id: string; ad: string }[]): Promise<HastaCozumu> => {
    if (adaylar.length === 1) return { tur: 'tek', patientId: adaylar[0].id, ad: adaylar[0].ad }
    if (adaylar.length === 0 || adaylar.length > 5) return { tur: 'yok' }
    const zengin = await adaylariZenginlestir(supabase, doctorId, adaylar)
    // 1) Doğum tarihiyle daraltma
    const tarih = tarihCoz(mesaj)
    if (tarih) {
      const { data: dobHam } = await supabase.from('patients').select('id, dob_encrypted').eq('doctor_id', doctorId).in('id', zengin.map((z) => z.id))
      const eslesen = (dobHam || []).filter((h) => guvenliCoz(h.dob_encrypted).slice(0, 10) === tarih)
      if (eslesen.length === 1) {
        const aday = zengin.find((z) => z.id === eslesen[0].id)
        if (aday) return { tur: 'tek', patientId: aday.id, ad: aday.ad }
      }
    }
    // 2) Sırayla daraltma ("ikincisi", "2. hasta")
    const sira = siraCoz(mesaj)
    if (sira !== null && zengin[sira]) return { tur: 'tek', patientId: zengin[sira].id, ad: zengin[sira].ad }
    // 3) Son ziyaret özetindeki bir kelimeyle daraltma (ör. "öksürük olan")
    const mDuz = duzle(mesaj)
    const kelimeEslesen = zengin.filter((z) => {
      const ozetKelime = duzle(z.ozet).split(' ').filter((k) => k.length >= 4)
      return ozetKelime.some((k) => mDuz.includes(k))
    })
    if (kelimeEslesen.length === 1) return { tur: 'tek', patientId: kelimeEslesen[0].id, ad: kelimeEslesen[0].ad }
    return { tur: 'coklu', adaylar: zengin }
  }

  if (secenek.yalnizAd) return cozAdaylar(tam.length > 0 ? tam : kismi)
  // NOTYA-SES-HASTA-01 (Kaan, 2026-09-25): voice sends the doctor's whole sentence ("Ayşe Yeşil adında bir
  // hastamız vardı, en son muayenesinin özeti"); the clinical words used to become search filters that
  // excluded the exactly-named patient and the answer was "kayıt yok". A single patient whose FULL name
  // (at least two words) appears in the sentence is final. Single-word names never qualify, so addressing
  // the assistant ("Merhaba Ayşe") cannot pick a patient.
  if (tam.length === 1 && duzle(tam[0].ad).includes(' ')) return { tur: 'tek', patientId: tam[0].id, ad: tam[0].ad }
  if (tam.length > 0) return dosyaIleDaralt(supabase, doctorId, mesaj, await cozAdaylar(tam))
  if (kismi.length > 0) return dosyaIleDaralt(supabase, doctorId, mesaj, await cozAdaylar(kismi))
  return dosyaIleDaralt(supabase, doctorId, mesaj, { tur: 'yok' })
}

async function dosyaIleDaralt(
  supabase: SupabaseClient,
  doctorId: string,
  mesaj: string,
  ad: HastaCozumu
): Promise<HastaCozumu> {
  const klinik = klinikAramaMi(mesaj)
  if (ad.tur === 'tek' && !klinik) return ad
  // NOTYA-SES-DOLGU-01: a single named patient with a question about him/her ("Umutcan kaç yaşında") is final;
  // only explicit many-patient questions run the clinical search.
  if (ad.tur === 'tek' && !kohortSorusuMu(mesaj)) return ad
  // NOTYA-AYSE-HASTA-01: adı geçen tek hastanın sıralama sorusu o hastanın dosyasından cevaplanır.
  if (tekHastaSorusuMu(ad.tur, mesaj)) return ad
  if (ad.tur === 'coklu' && !klinik) return ad
  if (ad.tur === 'yok' && !klinik) return ad

  const { adaylar: ara, istatistik } = await klinikAramaYurut(supabase, doctorId, mesaj)
  // NOTYA-SES-HASTA-01: a named patient is never dropped just because the extra words found nothing.
  // List/cohort questions ("ateşli hastalarım kimler") keep the old answer, so "Merhaba Ayşe" never picks a patient.
  // NOTYA-SES-DOLGU-01: "kaç yaşında" about a named patient is not a count; only explicit many-patient questions are.
  if (!ara.length) return ad.tur === 'tek' && !kohortSorusuMu(mesaj) ? ad : { tur: 'yok', sayiMetin: istatistik.cumle }

  const liste = listeSorgusuMu(mesaj) || Boolean(istatistik.birim !== 'hasta' && istatistik.cumle)
  if (ad.tur === 'coklu') {
    const idler = new Set(ad.adaylar.map((a) => a.id))
    const kesi = ara.filter((x) => idler.has(x.id))
    const kaynak = kesi.length ? kesi : ara
    if (kaynak.length === 1 && !liste) {
      return { tur: 'tek', patientId: kaynak[0].id, ad: kaynak[0].ad, sayiMetin: istatistik.cumle }
    }
    return {
      tur: 'coklu',
      adaylar: kaynak.map((x) => ({ id: x.id, ad: x.ad, dobMetin: x.dobMetin, ozet: x.ozet })),
      sayiMetin: istatistik.cumle,
    }
  }

  if (ad.tur === 'tek' && ara.some((x) => x.id === ad.patientId) && !liste) {
    return { ...ad, sayiMetin: istatistik.cumle }
  }

  if (ara.length === 1 && !liste) {
    return { tur: 'tek', patientId: ara[0].id, ad: ara[0].ad, sayiMetin: istatistik.cumle }
  }
  return {
    tur: 'coklu',
    adaylar: ara.map((x) => ({ id: x.id, ad: x.ad, dobMetin: x.dobMetin, ozet: x.ozet })),
    sayiMetin: istatistik.cumle,
  }
}
