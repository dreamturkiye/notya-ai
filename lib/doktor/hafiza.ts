/**
 * NOTYA-OGRENME-03 — Meslektaş Hafızası ("kişisel şef" katmanı).
 *
 * Kaan direktifi (2026-09-09): asistan, doktoru 3 yıllık kişisel şef gibi tanımalı.
 * Şef balık yemediğini, akşam yemeğini kaçta istediğini, porsiyonunu bilir; lazanyayı
 * az ricotta / çok kıyma yapar. Doktor da 10. seansta "yıllardır birlikte çalışıyoruz"
 * hissine ulaşmalı. Kalma sebebi en iyi SOAP uygulaması olmak değil, İLİŞKİNİN kişisel
 * olmasıdır (aynı berbere, aynı doktora gitme sebebi).
 *
 * Mimari: TEK hafıza, TÜM yüzeyler okur — yazılı sohbet, sesli Ayşe, not üretimi,
 * Ayşe'ye Danış. Üç kaynak besler:
 *   1. doktor_soyledi  — doktor sohbette açıkça söyledi ("öğlen 12:30-13:30 hasta almam")
 *                        -> anında KESİN. Şefe "balık yemem" dersin; iki kez görmesi gerekmez.
 *   2. duzeltme        — not düzeltmelerinden damıtılan stil profili (OGRENME-02, aynen kalır)
 *   3. gozlem          — veriden hesaplanan rutin (gün/hasta, mesai saatleri, yoğun günler)
 *
 * Güven eşiği (Kaan/Gökhan, 2026-09-09): klinik gözlem/düzeltme 2+ kanıt ister;
 * üslup/rutin/iletişim tek kanıtla yeter; doktorun kendi ağzından söylediği hemen kesindir.
 *
 * Ekonomi: Haiku yalnız (a) doktor kendinden bahsettiğinde (regex kapısı) ve
 * (b) 5 seansta bir özet için çağrılır. Rutin hesabı günde bir, LLM'siz.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'

export type HafizaKategori = 'klinik' | 'uslup' | 'rutin' | 'iletisim' | 'kisisel' | 'uygulama'
export type HafizaKaynak = 'doktor_soyledi' | 'duzeltme' | 'gozlem'
export type IliskiAsamasi = 'tanisma' | 'alisma' | 'meslektas' | 'ortak'

export interface HafizaKayit {
  kategori: HafizaKategori
  anahtar: string
  deger: string
  kaynak: HafizaKaynak
  kanit_sayisi: number
  kesin: boolean
  aktif: boolean
}

export interface DoktorIliski {
  doctor_id: string
  seans_sayisi: number
  ilk_seans_gunu: string | null
  son_seans_gunu: string | null
  toplam_not: number
  toplam_sohbet: number
  toplam_duzeltme: number
  rutin: Record<string, unknown>
  ozet: string | null
  ozet_seans: number
}

export interface HafizaOzeti {
  iliski: DoktorIliski
  asama: IliskiAsamasi
  kesinKayitlar: HafizaKayit[]
  belirsizKayitlar: HafizaKayit[]
  stilProfili: string
}

const HAIKU = 'claude-haiku-4-5-20251001'
const KESINLIK_ESIGI: Record<HafizaKategori, number> = {
  klinik: 2,     // Kaan/Gökhan: tek vakadan ilaç/doz genellemesi riskli
  uslup: 1,
  rutin: 1,
  iletisim: 1,
  kisisel: 1,
  uygulama: 1,
}

function bugunTRT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

// ------------------------------------------------------------------
// İlişki durumu
// ------------------------------------------------------------------

export function asamaBul(seans: number): IliskiAsamasi {
  if (seans >= 30) return 'ortak'
  if (seans >= 10) return 'meslektas'
  if (seans >= 5) return 'alisma'
  return 'tanisma'
}

/** Aşamaya göre davranış kuralı — prompta girer. Şef benzetmesi: ilk gün sorar,
 *  ikinci hafta tahmin eder, 3. yılda sormadan yapar. */
function asamaKurali(asama: IliskiAsamasi, seans: number): string {
  switch (asama) {
    case 'tanisma':
      return `${seans + 1}. seansınız — TANIŞMA. Doktoru henüz az tanıyorsun: tercihlerini yeri geldiğinde kısa ve doğal sor, öğrendiğini bir sonraki cümlede uygula. Kendini her seansta kısaca tanıt.`
    case 'alisma':
      return `${seans + 1}. seansınız — ALIŞMA. Artık bazı alışkanlıklarını biliyorsun: tahmin et ve tek kelimeyle teyit al ("her zamanki gibi mi Hocam?"). Kendini artık tanıtma; doğrudan işe gir.`
    case 'meslektas':
      return `${seans + 1}. seansınız — MESLEKTAŞ. Yıllardır birlikte çalışıyormuş gibi davran: bilinen tercihleri SORMADAN uygula, yalnız yeni/riskli durumda sor. Açıklama yapma, kısa konuş; ortak dil kullan.`
    case 'ortak':
      return `${seans + 1}. seansınız — ORTAK. Tam güven: tercihleri uygula, günün ritmini bil, gün sonu/gün başı hatırlatmaları kendiliğinden yap. Doktorun "partners in crime" hissettiği kişisin.`
  }
}

function bosIliski(doctorId: string): DoktorIliski {
  return {
    doctor_id: doctorId, seans_sayisi: 0, ilk_seans_gunu: null, son_seans_gunu: null,
    toplam_not: 0, toplam_sohbet: 0, toplam_duzeltme: 0, rutin: {}, ozet: null, ozet_seans: 0,
  }
}

export async function iliskiYukle(sb: SupabaseClient, doctorId: string): Promise<DoktorIliski> {
  const { data } = await sb.from('doktor_iliski').select('*').eq('doctor_id', doctorId).maybeSingle()
  return (data as DoktorIliski | null) || bosIliski(doctorId)
}

/** Her etkileşimde çağrılır. Seans = birlikte çalışılan farklı gün (TRT); bir günde 40
 *  mesaj atmak 40 seans etmez. Günde bir kez rutin de yeniden hesaplanır. */
export async function seansIsle(
  sb: SupabaseClient,
  doctorId: string,
  tur: 'not' | 'sohbet' | 'duzeltme',
  adet = 1,
): Promise<DoktorIliski> {
  const mevcut = await iliskiYukle(sb, doctorId)
  const bugun = bugunTRT()
  const yeniGun = mevcut.son_seans_gunu !== bugun
  const guncel: DoktorIliski = {
    ...mevcut,
    seans_sayisi: mevcut.seans_sayisi + (yeniGun ? 1 : 0),
    ilk_seans_gunu: mevcut.ilk_seans_gunu || bugun,
    son_seans_gunu: bugun,
    toplam_not: mevcut.toplam_not + (tur === 'not' ? adet : 0),
    toplam_sohbet: mevcut.toplam_sohbet + (tur === 'sohbet' ? adet : 0),
    toplam_duzeltme: mevcut.toplam_duzeltme + (tur === 'duzeltme' ? adet : 0),
  }
  if (yeniGun) {
    try { guncel.rutin = await rutinHesapla(sb, doctorId) } catch { /* rutin kritik değil */ }
  }
  await sb.from('doktor_iliski').upsert({ ...guncel, updated_at: new Date().toISOString() })
  return guncel
}

/** LLM'siz gözlem: son 30 günün seans verisinden doktorun ritmi. */
export async function rutinHesapla(sb: SupabaseClient, doctorId: string): Promise<Record<string, unknown>> {
  const baslangic = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data } = await sb
    .from('sessions')
    .select('started_at, patient_id')
    .eq('doctor_id', doctorId)
    .gte('started_at', baslangic)
    .limit(2000)
  const satirlar = (data || []) as { started_at: string; patient_id: string | null }[]
  if (satirlar.length < 3) return {}

  const gunler = new Map<string, Set<string>>()
  const saatler: number[] = []
  const haftaGunu = new Map<string, number>()
  for (const s of satirlar) {
    const d = new Date(s.started_at)
    const gun = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
    const saat = Number(d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false }).slice(0, 2))
    const hg = d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'long' })
    if (!gunler.has(gun)) gunler.set(gun, new Set())
    gunler.get(gun)!.add(s.patient_id || s.started_at)
    saatler.push(saat)
    haftaGunu.set(hg, (haftaGunu.get(hg) || 0) + 1)
  }
  const gunSayisi = gunler.size
  const ortHasta = Math.round([...gunler.values()].reduce((a, s) => a + s.size, 0) / gunSayisi)
  const sirali = [...saatler].sort((a, b) => a - b)
  const p10 = sirali[Math.floor(sirali.length * 0.1)]
  const p90 = sirali[Math.min(sirali.length - 1, Math.floor(sirali.length * 0.9))]
  const yogunGunler = [...haftaGunu.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([g]) => g)
  return {
    son30GunAktifGun: gunSayisi,
    gunBasinaOrtHasta: ortHasta,
    tipikBaslangicSaati: `${String(p10).padStart(2, '0')}:00`,
    tipikBitisSaati: `${String(p90 + 1).padStart(2, '0')}:00`,
    yogunGunler,
    hesaplandi: bugunTRT(),
  }
}

// ------------------------------------------------------------------
// Hafıza kayıtları
// ------------------------------------------------------------------

export function anahtarSlug(metin: string): string {
  return metin
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

/** Upsert + güven eşiği. Aynı anahtar tekrar görülürse kanıt artar, değer güncellenir. */
export async function hafizaKaydet(
  sb: SupabaseClient,
  doctorId: string,
  k: { kategori: HafizaKategori; anahtar: string; deger: string; kaynak: HafizaKaynak },
): Promise<void> {
  const anahtar = anahtarSlug(k.anahtar)
  if (!anahtar || !k.deger.trim()) return
  const { data: mevcut } = await sb
    .from('doktor_hafiza')
    .select('kanit_sayisi, kaynak')
    .eq('doctor_id', doctorId).eq('kategori', k.kategori).eq('anahtar', anahtar)
    .maybeSingle()
  const kanit = (mevcut?.kanit_sayisi || 0) + 1
  // Doktorun kendi ağzından söylediği hemen kesin; gözlem/düzeltme eşiğe bakar.
  const kaynak: HafizaKaynak = k.kaynak === 'doktor_soyledi' || mevcut?.kaynak === 'doktor_soyledi' ? 'doktor_soyledi' : k.kaynak
  const kesin = kaynak === 'doktor_soyledi' || kanit >= KESINLIK_ESIGI[k.kategori]
  const simdi = new Date().toISOString()
  await sb.from('doktor_hafiza').upsert({
    doctor_id: doctorId,
    kategori: k.kategori,
    anahtar,
    deger: k.deger.trim().slice(0, 300),
    kaynak,
    kanit_sayisi: kanit,
    kesin,
    aktif: true,
    son_gorulme: simdi,
    updated_at: simdi,
  }, { onConflict: 'doctor_id,kategori,anahtar' })
}

/** "Unut" — silinmez, pasifleşir (doktor "artık öyle değil" dediğinde). */
export async function hafizaUnut(sb: SupabaseClient, doctorId: string, anahtar: string): Promise<void> {
  await sb.from('doktor_hafiza')
    .update({ aktif: false, updated_at: new Date().toISOString() })
    .eq('doctor_id', doctorId).eq('anahtar', anahtarSlug(anahtar))
}

export async function hafizaYukle(sb: SupabaseClient, doctorId: string): Promise<HafizaOzeti> {
  const [iliski, kayitRes, stilRes] = await Promise.all([
    iliskiYukle(sb, doctorId),
    sb.from('doktor_hafiza').select('kategori, anahtar, deger, kaynak, kanit_sayisi, kesin, aktif')
      .eq('doctor_id', doctorId).eq('aktif', true).order('son_gorulme', { ascending: false }).limit(80),
    sb.from('doktor_stil_profilleri').select('profil').eq('doctor_id', doctorId).maybeSingle(),
  ])
  const kayitlar = (kayitRes.data || []) as HafizaKayit[]
  return {
    iliski,
    asama: asamaBul(iliski.seans_sayisi),
    kesinKayitlar: kayitlar.filter((k) => k.kesin),
    belirsizKayitlar: kayitlar.filter((k) => !k.kesin),
    stilProfili: String(stilRes.data?.profil || ''),
  }
}

// ------------------------------------------------------------------
// Prompt blokları — her yüzey aynı hafızayı okur
// ------------------------------------------------------------------

const KATEGORI_ETIKET: Record<HafizaKategori, string> = {
  klinik: 'Klinik tercihler',
  uslup: 'Üslup / not tercihleri',
  rutin: 'Günlük ritim',
  iletisim: 'Benimle iletişim',
  kisisel: 'Kişisel',
  uygulama: 'Uygulamayı kullanışı',
}

function kayitlariGrupla(kayitlar: HafizaKayit[]): string {
  const gruplar = new Map<HafizaKategori, string[]>()
  for (const k of kayitlar) {
    if (!gruplar.has(k.kategori)) gruplar.set(k.kategori, [])
    gruplar.get(k.kategori)!.push(`  • ${k.deger}${k.kaynak === 'doktor_soyledi' ? ' (kendisi söyledi)' : ''}`)
  }
  return [...gruplar.entries()].map(([kat, s]) => `${KATEGORI_ETIKET[kat]}:\n${s.join('\n')}`).join('\n')
}

function rutinMetni(rutin: Record<string, unknown>): string {
  if (!rutin || !rutin.gunBasinaOrtHasta) return ''
  const yg = Array.isArray(rutin.yogunGunler) ? (rutin.yogunGunler as string[]).join(', ') : ''
  return `Veriden gözlem: günde ort. ${rutin.gunBasinaOrtHasta} hasta, tipik mesai ${rutin.tipikBaslangicSaati}–${rutin.tipikBitisSaati}${yg ? `, yoğun günler ${yg}` : ''}.`
}

/** Yazılı sohbet / Ayşe'ye Danış için tam blok. */
export function hafizaBloguSohbet(h: HafizaOzeti): string {
  const { iliski, asama } = h
  const parcalar = [
    `=== MESLEKTAŞ HAFIZASI — bu doktoru tanıyorsun ===`,
    asamaKurali(asama, iliski.seans_sayisi),
    iliski.ozet ? `Doktor hakkında özetim: ${iliski.ozet}` : '',
    rutinMetni(iliski.rutin),
    h.kesinKayitlar.length ? `Bildiklerim (UYGULA, sorma):\n${kayitlariGrupla(h.kesinKayitlar)}` : '',
    h.belirsizKayitlar.length
      ? `Henüz emin olmadıklarım (tek örnek — klinikse UYGULAMA, yeri gelirse tek soruyla teyit et):\n${kayitlariGrupla(h.belirsizKayitlar)}`
      : '',
    h.stilProfili ? `Not yazım tercihleri (düzeltmelerinden damıtıldı):\n${h.stilProfili}` : '',
    `HAFIZA KURALLARI: Bilgileri "hatırlıyorum ki..." diye ilan etme; ilişki gibi doğal kullan (şefin "her zamanki gibi az ricotta" demesi gibi). Doktor kendisi/tercihi/rutini/hitabı hakkında bir şey söylerse bunu sessizce not al ve bir sonraki cümlede uygula. "Bunu unut / artık öyle değil" derse uy. Bilmediğin şeyi biliyormuş gibi yapma. SINIR: Hafıza NASIL çalıştığını şekillendirir, klinik güvenlik kurallarını (doz, etkileşim, alerji, SGK, kritik bulgu) ASLA gevşetmez — doktorun alışkanlığı bile olsa riskli gördüğünü meslektaş gibi açıkça söyle; nihai karar ve sorumluluk doktorundur.`,
  ]
  return parcalar.filter(Boolean).join('\n')
}

/** Sesli Ayşe için kısa blok (ElevenLabs promptu her turda taşınır — şişirme). */
export function hafizaBloguSes(h: HafizaOzeti): string {
  const { iliski, asama } = h
  const onemli = h.kesinKayitlar
    .filter((k) => k.kategori === 'iletisim' || k.kategori === 'rutin' || k.kategori === 'kisisel' || k.kategori === 'klinik')
    .slice(0, 8)
    .map((k) => `• ${k.deger}`)
  return [
    `Bu doktorla ${iliski.seans_sayisi} seans çalıştın (${asama}). ${asamaKurali(asama, iliski.seans_sayisi)} Hafıza klinik güvenlik uyarılarını asla gevşetmez; nihai karar doktorundur.`,
    iliski.ozet ? `Özet: ${iliski.ozet}` : '',
    onemli.length ? `Bildiklerin:\n${onemli.join('\n')}` : '',
  ].filter(Boolean).join('\n')
}

/** Not üretimi için: stil profili + kesin klinik/üslup kayıtları tek metinde
 *  (soapUret.stilProfili "MUTLAKA uy" alanına gider — belirsizler girmez). */
export function hafizaBloguNot(h: HafizaOzeti): string {
  const ek = h.kesinKayitlar
    .filter((k) => k.kategori === 'klinik' || k.kategori === 'uslup')
    .map((k) => `• ${k.deger}`)
  return [h.stilProfili, ek.length ? ek.join('\n') : ''].filter(Boolean).join('\n')
}

/** Aşamaya göre karşılama — tanışmada tanıtır, meslektaşta doğrudan işe girer. */
export function karsilamaSecimi(h: DoktorIliski | null | undefined): { tanit: boolean; onSoz: string } {
  const seans = h?.seans_sayisi || 0
  const asama = asamaBul(seans)
  if (asama === 'tanisma') return { tanit: true, onSoz: seans === 0 ? '' : 'Tekrar hoş geldiniz.' }
  if (asama === 'alisma') return { tanit: false, onSoz: 'Hoş geldiniz.' }
  const rutin = (h?.rutin || {}) as Record<string, unknown>
  const hasta = rutin.gunBasinaOrtHasta ? `Bugün de ${rutin.gunBasinaOrtHasta} civarı hasta bekliyorum sanırım.` : ''
  return { tanit: false, onSoz: hasta }
}

// ------------------------------------------------------------------
// Öğrenme — doktorun sohbette söylediklerinden (Haiku, kapılı)
// ------------------------------------------------------------------

/** Ucuz kapı: yalnız doktor kendinden/tercihinden bahsediyorsa Haiku çağrılır. */
const KENDINDEN_BAHSETME = /\b(ben|benim|bana|bende|hep|her zaman|genelde|genellikle|asla|hiç|sevmem|sevmiyorum|istemem|istemiyorum|tercih|kullanırım|kullanmam|yazarım|yazmam|alışkanlık|mesai|öğle|sabah|akşam|unut|artık|bundan sonra|kısa|uzun|detaylı|hitap|hocam deme|adımla|randevu sürem|dakika)\b/i

export function ogrenmeyeDeger(mesaj: string): boolean {
  return mesaj.length >= 12 && KENDINDEN_BAHSETME.test(mesaj)
}

interface CikarilanKayit { kategori: HafizaKategori; anahtar: string; deger: string; unut?: boolean }

/** Son turlardan doktorun KENDİ AĞZINDAN söylediği kalıcı bilgileri çıkarır.
 *  Hastaya özgü klinik içerik alınmaz; yalnız doktorun kendisi/tercihi/ritmi. */
export async function sohbettenOgren(
  anthropic: Anthropic,
  sb: SupabaseClient,
  doctorId: string,
  sonMesajlar: { role: string; content: string }[],
): Promise<number> {
  const metin = sonMesajlar.slice(-6).map((m) => `${m.role === 'user' ? 'DOKTOR' : 'ASİSTAN'}: ${String(m.content).slice(0, 600)}`).join('\n')
  const yanit = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 500,
    system: `Bir doktor ile AI meslektaşının sohbetinden, doktorun KENDİSİ hakkında AÇIKÇA söylediği ve gelecekte de geçerli KALICI bilgileri çıkar. Kişisel şef benzetmesi: "balık yemem", "akşam 7'de yerim", "az ricotta" gibi şeyler.
Kategoriler: klinik (ilaç/tedavi tercihleri), uslup (not/konuşma biçimi tercihleri: kısa/uzun, terminoloji), rutin (mesai, öğle arası, hasta yoğunluğu, randevu süresi), iletisim (hitap: "bana X de", "Hocam deme", cevap uzunluğu, ses tonu), kisisel (doktorun paylaştığı kişisel ama işle ilgili detay: çocuğu var, cuma erken çıkar), uygulama (hangi özelliği nasıl kullanmak istediği).
KURALLAR:
- YALNIZ doktorun kendi ağzından söylediği, genellenebilir bilgi. Hastaya özgü klinik bilgi (o hastanın adı, o vakanın dozu) ALINMAZ.
- Asistanın söylediklerinden veya varsayımdan kayıt üretme.
- "Bunu unut", "artık öyle değil" gibi ifadelerde unut:true ile döndür.
- Hiçbir şey yoksa boş liste döndür. Uydurma.
- deger: doğal Türkçe, üçüncü şahıs, en fazla 20 kelime ("Öğle 12:30-13:30 arası hasta almaz").
- anahtar: 2-4 kelimelik kısa slug ("ogle-arasi", "hitap-sekli", "antibiyotik-ilk-tercih").
SADECE JSON döndür: {"kayitlar":[{"kategori":"...","anahtar":"...","deger":"...","unut":false}]}`,
    messages: [{ role: 'user', content: metin }],
  })
  const ham = yanit.content[0]?.type === 'text' ? yanit.content[0].text : ''
  let kayitlar: CikarilanKayit[] = []
  try {
    const temiz = ham.replace(/```[a-z]*/g, '').replace(/```/g, '').trim()
    kayitlar = (JSON.parse(temiz)?.kayitlar || []) as CikarilanKayit[]
  } catch { return 0 }
  const gecerli: HafizaKategori[] = ['klinik', 'uslup', 'rutin', 'iletisim', 'kisisel', 'uygulama']
  let n = 0
  for (const k of kayitlar.slice(0, 6)) {
    if (!gecerli.includes(k.kategori) || !k.anahtar || !k.deger) continue
    if (k.unut) { await hafizaUnut(sb, doctorId, k.anahtar); n++; continue }
    await hafizaKaydet(sb, doctorId, { kategori: k.kategori, anahtar: k.anahtar, deger: k.deger, kaynak: 'doktor_soyledi' })
    n++
  }
  return n
}

/** 5 seansta bir "bu doktor kimdir" özeti (Haiku). Sesli promptta ve karşılamada kullanılır. */
export async function ozetGerekirseGuncelle(anthropic: Anthropic, sb: SupabaseClient, doctorId: string): Promise<void> {
  const h = await hafizaYukle(sb, doctorId)
  const seans = h.iliski.seans_sayisi
  if (seans < 5 || seans - h.iliski.ozet_seans < 5) return
  const malzeme = [
    rutinMetni(h.iliski.rutin),
    h.kesinKayitlar.length ? kayitlariGrupla(h.kesinKayitlar) : '',
    h.stilProfili ? `Not tercihleri:\n${h.stilProfili}` : '',
  ].filter(Boolean).join('\n')
  if (!malzeme) return
  const yanit = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 300,
    system: `Aşağıdaki hafıza kayıtlarından bir doktorun çalışma karakterini anlatan 3-5 cümlelik TEK paragraf yaz — bir meslektaşın onu yeni bir asistana tanıtması gibi (ritmi, üslubu, nelere önem verdiği, nasıl hitap edilmek istediği). Türkçe, üçüncü şahıs, süsleme yok, kayıtlarda olmayanı yazma.`,
    messages: [{ role: 'user', content: malzeme }],
  })
  const ozet = yanit.content[0]?.type === 'text' ? yanit.content[0].text.trim() : ''
  if (!ozet) return
  await sb.from('doktor_iliski').upsert({
    ...h.iliski, doctor_id: doctorId, ozet, ozet_seans: seans, updated_at: new Date().toISOString(),
  })
}
