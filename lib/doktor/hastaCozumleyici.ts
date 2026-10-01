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
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { arsivsizIlaclar, arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { klinikAramaMi, klinikAramaYurut, listeSorgusuMu } from '@/lib/doktor/hastaDosyaAra'
import { tekHastaSorusuMu } from '@/lib/doktor/hastaAramaFiltre'
import { kohortSorusuMu } from '@/lib/asistan/aktifHasta'
import { mesajAdaylariniBul } from '@/lib/doktor/hastaAramaIndeksi'

/**
 * NOTYA-SAYIM-ANDA-01 (Kaan, 2026-09-30): a small panel is named — "Kayıtlarda 1 hasta: Kaan Arıoğlu." (≤ 5 names,
 * only when the list IS the whole count); a large panel keeps the number only (the voice rule).
 */
export function sayimCumlesi(cumle: string, hastaSayisi: number, adlar: string[]): string {
  const temiz = adlar.map((a) => String(a || '').trim()).filter(Boolean)
  if (!hastaSayisi || hastaSayisi > 5 || temiz.length !== hastaSayisi) return cumle
  const m = cumle.match(/^(.*?\b\d+ hasta)\.(.*)$/)
  if (!m) return cumle
  return `${m[1]}: ${temiz.join(', ')}.${m[2]}`
}
import { PERSONAS } from '@/lib/asistan/personaEngine'

export interface CozumAday { id: string; ad: string; dobMetin: string; ozet: string }

export type HastaCozumu =
  /** `cevap`: NOTYA-AYSE-100 S2 — a who-question ("son kaydettiğim hasta kim") answered in the resolver; spoken as is. */
  | { tur: 'tek'; patientId: string; ad: string; sayiMetin?: string; cevap?: string }
  | { tur: 'coklu'; adaylar: CozumAday[]; sayiMetin?: string }
  /** `cokAday`: NOTYA-SES-YARIM-01 — the name in the message matches more than 5 patients; nobody is picked, Ayşe asks for the surname. */
  | { tur: 'yok'; sayiMetin?: string; cokAday?: number }

/** Ses + sohbet aynı cümleyi söyler — pratik sıralama / çoklu aday LLM'e gitmez. */
export function cozumKonus(cozum: HastaCozumu): string | null {
  if (cozum.tur === 'coklu') {
    const liste = cozum.adaylar
      .map((a, i) => `${i + 1}. ${a.ad}${a.dobMetin ? ` (d.t. ${a.dobMetin})` : ''} — ${a.ozet}`)
      .join('. ')
    const bas = (cozum.sayiMetin || `${cozum.adaylar.length} hasta`).replace(/\.$/, '')
    return `${bas}: ${liste}. Hangisini istiyorsunuz — birinci, ikinci, adıyla veya şikayetiyle söyleyin.`
  }
  if (cozum.tur === 'yok' && cozum.cokAday) return `Bu adla eşleşen ${cozum.cokAday} hasta var Hocam; soyadını da söyler misiniz?`
  if (cozum.tur === 'yok' && cozum.sayiMetin) return cozum.sayiMetin
  if (cozum.tur === 'tek' && cozum.cevap) return cozum.cevap
  return null
}

export function duzle(s: string): string {
  return trAramaNormalize(s).replace(/[^a-z0-9 ]/g, ' ').replace(/ +/g, ' ').trim()
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

/**
 * Chitchat has no patient name. Decrypting every chart on those turns is the
 * pause before the model can start ("bir kahve içelim mi"). An unknown word
 * still scans — a first name must never be skipped.
 */
const AD_OLMAYAN = new Set([
  'ben', 'sen', 'siz', 'biz', 'bir', 'bu', 'su', 'cok', 'iyi', 'iyiyim', 'iyisin', 'iyisiniz', 'iyiyiz',
  'tesekkur', 'tesekkurler', 'sagol', 'sagolun', 'ederim', 'merhaba', 'merhabalar', 'selam', 'selamlar', 'nasilsin', 'nasilsiniz', 'naber',
  'gunaydin', 'aksamlar', 'geceler', 'hocam', 'hoca', 'hanim', 'bey', 'lutfen', 'rica', 'evet', 'hayir',
  'tamam', 'peki', 'olur', 'tabii', 'tabi', 'kahve', 'cay', 'icelim', 'icersin', 'icersiniz', 'iceyim',
  'bugun', 'yarin', 'simdi', 'sizinle', 'seninle', 'benimle', 'bizimle', 'molada', 'molasinda', 'sohbet',
  'edebilirim', 'edebiliriz', 'ederiz', 'gercekten', 'naziksiniz', 'naziksin', 'nazik', 'biraz', 'guzel',
  'hos', 'pardon', 'gorusuruz', 'size', 'bana', 'sana', 'kolay', 'gelsin', 'eyvallah', 'gunler',
  'affedersin', 'affedersiniz', 'buyurun', 'buyrun', 'hadi', 'beraber', 'birlikte', 'isterim', 'isterseniz',
  'ister', 'misiniz', 'musunuz', 'memnun', 'oldum', 'afiyet', 'degil', 'degilim',
])
/**
 * NOTYA-SES-DOLGU-02 (Kaan, canlı vaka 2026-09-28): "nasılsınız" → Fish ASR "nasınsınız" (bir harf düşmüş) —
 * tam eşleşme listesi bunu tanımadı, sohbet 500 hastalık tam taramaya düştü ve alakasız bir dosya açıldı. Ses
 * tanıma küçük yazım farkları üretir; bu yüzden AD_OLMAYAN'a tam eşleşmeyen ama ona 1 düzenleme uzaklıkta olan
 * (tek harf eksik/fazla/değişik) 5+ karakterlik kelimeler de güvenli sayılır. Eşleşmeyen kelime (kısa, ya da
 * 1'den uzak) hâlâ taramayı tetikler — bir isim asla atlanmaz, yalnız bilinen dolgu kelimelerin yazım varyantları
 * atlanır.
 */
function duzenlemeUzakligi1Mi(a: string, b: string): boolean {
  if (a === b) return true
  const la = a.length, lb = b.length
  if (Math.abs(la - lb) > 1) return false
  if (la === lb) {
    let fark = 0
    for (let i = 0; i < la; i++) if (a[i] !== b[i]) { if (++fark > 1) return false }
    return fark === 1
  }
  const [kisa, uzun] = la < lb ? [a, b] : [b, a]
  let i = 0, j = 0, fark = 0
  while (i < kisa.length && j < uzun.length) {
    if (kisa[i] === uzun[j]) { i++; j++; continue }
    if (++fark > 1) return false
    j++
  }
  return true
}
function guvenliKelimeMi(k: string): boolean {
  if (AD_OLMAYAN.has(k)) return true
  if (k.length < 5) return false
  for (const g of AD_OLMAYAN) {
    if (Math.abs(g.length - k.length) <= 1 && duzenlemeUzakligi1Mi(k, g)) return true
  }
  return false
}
/** The doctor asked for names, not just a number. */
export function listeIstenmisMi(mesaj: string): boolean {
  return /\b(listele|liste|hangileri|hangisi|kimler|kimlerdi|isimleri|adlari|hepsini|say bakalim)\b/.test(duzle(mesaj))
}
export function adTaramasiGereksizMi(mesaj: string): boolean {
  const kelime = duzle(hitapsiz(mesaj)).split(' ').filter((x) => x.length >= 3 && !DOLGU.has(x))
  return kelime.length > 0 && kelime.every(guvenliKelimeMi)
}
/**
 * NOTYA-SES-YARIM-01: what is left of a message word after a name part is a Turkish case / possessive ending
 * ("umutcanin" → "in", "yesile" → "e") — the word IS that name. "atesli" (→ "li") is a clinical word, not Ateş.
 */
const AD_EKI = /^(n?[iu]n|y?[iu]|y?[ae]|[dt][ae]n?|y?l[ae])$/
const SON_ZIYARET_YOK = 'henüz muayene kaydı yok'
/** patients.name_encrypted holds either a plain name or a JSON {ad} payload — always unwrap. */
export function hastaAdiCoz(nameEncrypted: string | null): string {
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
  if (!t) return SON_ZIYARET_YOK
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
  secenek: { yalnizAd?: boolean; tz?: string } = {}
): Promise<HastaCozumu> {
  const m = ' ' + duzle(mesaj) + ' '
  // A bare who-question ("… hasta kim", "hangi hastayı gördüm") is answered here; a question about that patient
  // ("son hastamın aşıları") opens the chart as before.
  const kimSorusu = /\bkim(di|dir)?\b|hangi hasta/.test(m) && !/(asi|ilac|kilo|boy|yas|tani|recete|alerji|not|lab|tahlil)\w*/.test(m.replace(/ (son|en son) (recete\w*|ilac(?:i)? yazdigim)/, ' '))
  const sonHastaAdi = async (pid: string | null | undefined, varsayilan: string, etiket: string): Promise<HastaCozumu | null> => {
    if (!pid) return null
    const { data: p } = await supabase.from('patients').select('id, name_encrypted').eq('id', pid).eq('doctor_id', doctorId).maybeSingle()
    if (!p) return null
    const ad = hastaAdiCoz(p.name_encrypted) || varsayilan
    return { tur: 'tek', patientId: p.id, ad, ...(kimSorusu ? { cevap: `${etiket}: ${ad}.` } : {}) }
  }
  // NOTYA-AYSE-100 S2: "son kaydettiğim hasta" is the newest chart, "son reçetem hangi hastaya" the newest prescription.
  if (/ (son|en son)( olarak)? (kaydettigim|kayit ettigim|ekledigim|actigim|olusturdugum) hasta/.test(m)) {
    const { data } = await supabase.from('patients').select('id').eq('doctor_id', doctorId).eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1)
    const c = await sonHastaAdi(data?.[0]?.id, 'son kayıt', 'Son kaydettiğiniz hasta')
    if (c) return c
  }
  if (/ (son|en son) (recete\w*|ilac(?:i)? yazdigim|yazdigim ilac)/.test(m) && /hasta|kim/.test(m)) {
    const { data } = await arsivsizIlaclar(supabase, 'patient_id, ilac_adi, created_at').eq('doctor_id', doctorId)
      .not('patient_id', 'is', null).order('created_at', { ascending: false }).limit(1)
    const ilk = data?.[0] as { patient_id?: string; ilac_adi?: string; created_at?: string } | undefined
    const c = await sonHastaAdi(ilk?.patient_id, 'son reçete', 'Son reçeteniz')
    if (c) return c.tur === 'tek' && c.cevap && ilk?.ilac_adi ? { ...c, cevap: `Son reçeteniz: ${c.ad} — ${ilk.ilac_adi} (${trTarih(ilk.created_at || null)}).` } : c
  }
  // "son hastam" / "az önceki hasta" / "en son gelen hasta" / "en son hangi hastayı gördüm"
  if (/ (son|az onceki|en son)( gelen| muayene ettigim| gordugum| baktigim| hangi)? hasta/.test(m)) {
    const { data } = await arsivsizSeanslar(supabase, 'patient_id').eq('doctor_id', doctorId)
      .not('patient_id', 'is', null).order('created_at', { ascending: false }).limit(1)
    const c = await sonHastaAdi(data?.[0]?.patient_id, 'son hasta', 'Son gördüğünüz hasta')
    if (c) return c
  }
  if (adTaramasiGereksizMi(mesaj)) return { tur: 'yok' }
  const adMesaji = hitapsiz(mesaj)
  const mAd = ' ' + duzle(adMesaji) + ' '
  const tokenlar = sesliSozTokenlari(duzle(adMesaji))
  // Eskiden: doktorun TUM aktif hastalari (<=500) cozulup tek tek karsilastirilirdi. Artik mesajin konusma
  // token'lari, hic kimseyi cozmeden, indekslenmis ad-parca ozetleriyle eslestirilir; yalnizca indeksin
  // 'olasi aday' dedigi hastalar cozulur. Indeks kullanilamazsa (hata) eski tam-tarama davranisina guvenli
  // donus yapilir - davranis asla daralmaz, sadece hizlanir.
  const adaylarIdSeti = await mesajAdaylariniBul(supabase, doctorId, tokenlar)
  let hastalar: { id: string; name_encrypted: string | null }[] = []
  if (adaylarIdSeti === null || adaylarIdSeti.size > 0) {
    let sorgu = supabase.from('patients').select('id, name_encrypted').eq('doctor_id', doctorId).eq('is_active', true)
    if (adaylarIdSeti) sorgu = sorgu.in('id', Array.from(adaylarIdSeti))
    const { data } = await sorgu.limit(500)
    hastalar = data || []
  }
  const tam: { id: string; ad: string }[] = []
  const kismi: { id: string; ad: string }[] = []
  /** Candidates whose name is said as a word of its own ("Umutcan", "Umutcan'ın", "Umutcanın") — not a clinical word that merely starts like a name ("ateşli"). */
  const kesin = new Set<string>()
  const tokenDizisi = Array.from(tokenlar)
  const adOlarakGecer = (p: string) => tokenlar.has(p) || tokenDizisi.some((t) => t.startsWith(p) && AD_EKI.test(t.slice(p.length)))
  for (const h of hastalar) {
    const ad = hastaAdiCoz(h.name_encrypted)
    if (!ad) continue
    const adDuz = duzle(ad)
    if (!adDuz) continue
    // NOTYA-SUFFIX-TOLERANS-01 (Kaan/Gökhan, 2026-10-01): sesliSozTokenlari strips an apostrophe-separated
    // suffix ("Türkoğlu'nun" -> "türkoğlu") but not one glued straight onto the word with no apostrophe
    // ("yeşilin"), which real doctor speech/typing does constantly. A name-part is still a match if some
    // message token simply STARTS WITH it -- Turkish suffixes only ever append, never prepend, so this is
    // purely additive: it can only turn a past false 'no match' into a match, never break an existing one.
    const parcaUzatilmisVarMi = (p: string) => tokenlar.has(p) || Array.from(tokenlar).some((t) => t.startsWith(p))
    const parcalarUzun = adDuz.split(' ').filter((p) => p.length >= 3)
    const tumParcalarVarGevsek = parcalarUzun.length > 0 && parcalarUzun.every(parcaUzatilmisVarMi)
    if (mAd.includes(' ' + adDuz + ' ') || tumAdParcalariVar(adDuz, tokenlar) || tumParcalarVarGevsek) { tam.push({ id: h.id, ad }); kesin.add(h.id); continue }
    // NOTYA-HASTA-ODAK-01: a persona first name alone ("Ayşe") never partially matches a patient.
    const parcalar = adDuz.split(' ').filter((p) => p.length >= 3 && !PERSONA_ADLARI_DUZ.has(p))
    if (parcalar.some((p) => mAd.includes(' ' + p + ' ') || parcaUzatilmisVarMi(p))) {
      kismi.push({ id: h.id, ad })
      if (parcalar.some(adOlarakGecer)) kesin.add(h.id)
    }
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
      // The "no visit yet" placeholder is not the patient's complaint: "muayene" in the question must not pick the one without a visit.
      if (z.ozet === SON_ZIYARET_YOK) return false
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
  const adaylar = tam.length > 0 ? tam : kismi
  if (adaylar.length === 0) return dosyaIleDaralt(supabase, doctorId, mesaj, { tur: 'yok' }, secenek.tz)
  // NOTYA-SES-YARIM-01 (Kaan, 2026-10-01): a name said as a word of its own that matches several patients is a
  // question to the doctor — never a silent pick by the clinical words of the same sentence ("Umutcan'ın aşı karnesi"
  // with two Umutcans became "Son 90 gün 0 hasta. Filtre: Aşı"), and never the open patient.
  const adKesin = adaylar.every((a) => kesin.has(a.id))
  const sonuc = await dosyaIleDaralt(supabase, doctorId, mesaj, await cozAdaylar(adaylar), secenek.tz, adKesin)
  if (sonuc.tur === 'yok' && adKesin && adaylar.length > 5 && !kohortSorusuMu(mesaj)) return { ...sonuc, cokAday: adaylar.length }
  return sonuc
}

async function dosyaIleDaralt(
  supabase: SupabaseClient,
  doctorId: string,
  mesaj: string,
  ad: HastaCozumu,
  tz?: string,
  /** The name was said as a word of its own (hastaninSozunuCoz `kesin`). */
  adKesin = false
): Promise<HastaCozumu> {
  const klinik = klinikAramaMi(mesaj, undefined, tz)
  if (ad.tur === 'tek' && !klinik) return ad
  // NOTYA-SES-DOLGU-01: a single named patient with a question about him/her ("Umutcan kaç yaşında") is final;
  // only explicit many-patient questions run the clinical search.
  if (ad.tur === 'tek' && !kohortSorusuMu(mesaj)) return ad
  // NOTYA-AYSE-HASTA-01: adı geçen tek hastanın sıralama sorusu o hastanın dosyasından cevaplanır.
  if (tekHastaSorusuMu(ad.tur, mesaj)) return ad
  if (ad.tur === 'coklu' && !klinik) return ad
  // NOTYA-SES-YARIM-01: several patients carry the name the doctor said — ask which one (mirror of the 'tek' rule above).
  if (ad.tur === 'coklu' && adKesin && !kohortSorusuMu(mesaj)) return ad
  if (ad.tur === 'yok' && !klinik) return ad
  // NOTYA-AKTIF-HASTA-01 (Kaan, 2026-09-29): unnamed clinical searches ("dün gelen ateşli bebek",
  // "kulak iltihabı olan çocuk") run klinikAramaYurut again — the DOSYA-ISTE-01 name guard is withdrawn.

  // "Ayşe, kaç hastam var?" — the address is not a search term. Same strip as the name pass.
  const { adaylar: ara, istatistik, tur: aramaTuru, q: aramaSorgusu } = await klinikAramaYurut(supabase, doctorId, hitapsiz(mesaj), undefined, tz)
  // NOTYA-SES-KAC-HASTA: a pure count ("kaç hasta", "bugün kaç hasta", "kaç hastam var") is answered with the
  // number only. Reading 40 names aloud for "kaç hasta" was the voice failure; a list is given only when asked.
  if (aramaTuru === 'sayim' && ad.tur !== 'tek' && !aramaSorgusu.kirilim && !listeIstenmisMi(mesaj)) {
    return { tur: 'yok', sayiMetin: sayimCumlesi(istatistik.cumle, istatistik.hastaSayisi, ara.map((x) => x.ad)) }
  }
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
