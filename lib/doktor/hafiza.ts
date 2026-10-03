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
 * Ekonomi: model yalnız (a) doktor kendinden bahsettiğinde (regex kapısı) ve
 * (b) 5 seansta bir özet için çağrılır. Rutin hesabı günde bir, LLM'siz.
 *
 * NOTYA-OGRENME-04 (Kaan, 2026-09-22) — TEMPO + İŞ SIRASI: doktor_soyledi yalnız AÇIKÇA
 * söylediğini yakalar ("kısa yazıyorum" gibi) — ama doktorun GERÇEKTE nasıl konuştuğu
 * (cümle uzunluğu, doğrudanlık) ve işi hangi sırayla yaptığı (önce X, sonra Y) genelde
 * AÇIKÇA söylenmez, davranıştan gözlemlenir. 5-seanslık özet çağrısı artık iki ek girdi
 * alır: sohbetOrnekleriDerle (doktorun kendi mesajlarından birebir örnek — tempo için) ve
 * eylemSirasiOzeti (asistan_actions'tan LLM'siz çıkarılan iş sırası — "A→B→C"). Model
 * bunları görerek özet paragrafa tempo + iş sırası gözlemini de katar; ekonomi bozulmaz
 * (mevcut 5-seans çağrısına binen ek metin, yeni bir LLM çağrısı değil).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { aiCagir } from '@/lib/ai/cagir'
import { jsonCikar, jsonOnar } from '@/lib/ai/jsonOnar'
import { arsivsizSeanslar } from '@/lib/doktor/arsiv'

export type HafizaKategori = 'klinik' | 'uslup' | 'rutin' | 'iletisim' | 'kisisel' | 'uygulama'
export type HafizaKaynak = 'doktor_soyledi' | 'duzeltme' | 'gozlem'
export type HafizaDurum = 'aday' | 'uygulanir' | 'kapali'
export type IliskiAsamasi = 'tanisma' | 'alisma' | 'meslektas' | 'ortak'

export interface HafizaKayit {
  kategori: HafizaKategori
  anahtar: string
  deger: string
  kaynak: HafizaKaynak
  kanit_sayisi: number
  kesin: boolean
  aktif: boolean
  durum?: HafizaDurum
  ornekler?: string[]
  ilk_gorulme?: string | null
  son_gorulme?: string | null
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
  ogrenme_selam_gunu?: string | null
  meslektas_selam_at?: string | null
}

export interface HafizaOzeti {
  iliski: DoktorIliski
  asama: IliskiAsamasi
  kesinKayitlar: HafizaKayit[]
  belirsizKayitlar: HafizaKayit[]
  stilProfili: string
}

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
 *  ikinci hafta tahmin eder, 3. yılda sormadan yapar.
 *  `ogrenilenVar`: en az bir KESİN (doktor_soyledi ya da eşik geçmiş) kayıt var mı?
 *  YOK ise MESLEKTAŞ/ORTAK aşamasında bile "SORMADAN uygula" denmez — gün sayısı yüksek
 *  olsa da (yalnız not onaylayan, hiç sohbet etmemiş doktor gibi) hiçbir şey bilmiyorsan
 *  bilmiyormuş gibi davran — sahte tanıdıklık, gerçek tanıdıklıktan kötüdür. */
function asamaKurali(asama: IliskiAsamasi, seans: number, ogrenilenVar: boolean): string {
  switch (asama) {
    case 'tanisma':
      return `${seans + 1}. seansınız — TANIŞMA. Doktoru henüz az tanıyorsun: hitap, ritim ve kişisel tercihlerini yeri geldiğinde kısa ve doğal sor; öğrendiğini bir sonraki cümlede uygula (soru sormadan). Kendini her seansta kısaca tanıt.`
    case 'alisma':
      return `${seans + 1}. seansınız — ALIŞMA.${ogrenilenVar ? ' Artık bazı alışkanlıklarını biliyorsun: hitap ve kişisel tercihleri SORMADAN uygula; yalnız emin olmadığın yerde tek kelimeyle teyit al ("her zamanki gibi mi?").' : ' Henüz kendinden pek bahsetmedi — varsaymaktan kaçın, doğal bir şekilde sormaya devam et.'} Kendini artık tanıtma; doğrudan işe gir.`
    case 'meslektas':
      return ogrenilenVar
        ? `${seans + 1}. seansınız — MESLEKTAŞ. Yıllardır birlikte çalışıyormuş gibi davran: hitap, günlük ritim, kişisel alışkanlık ve iş sırası tercihlerini SORMADAN uygula; yalnız yeni/riskli/klinik durumda sor. "Hatırlıyorum ki…" deme; kısa konuş, ortak dil kullan.`
        : `${seans + 1}. seansınız — gün sayısı MESLEKTAŞ seviyesinde ama doktor henüz kendinden/tercihinden pek bahsetmedi (aşağıda "Bildiklerim" boş ya da az). Sahte tanıdıklık YAPMA — bilmediğin bir tercihi biliyormuş gibi varsayma. Ton yine de meslektaş sıcaklığında ve kısa olsun, ama net bilmediğin şeyi doğal bir şekilde sor.`
    case 'ortak':
      return ogrenilenVar
        ? `${seans + 1}. seansınız — ORTAK. Tam güven: hitap/ritim/kişisel tercihleri uygula, günün ritmini bil, gün sonu/gün başı hatırlatmaları kendiliğinden yap. Doktorun "partners in crime" hissettiği kişisin.`
        : `${seans + 1}. seansınız — gün sayısı yüksek ama doktor kendinden henüz az bahsetti. Tecrübeli/sıcak bir meslektaş gibi konuş, ama bilmediğin kişisel tercihi biliyormuş gibi ASLA yapma.`
  }
}

function bosIliski(doctorId: string): DoktorIliski {
  return {
    doctor_id: doctorId, seans_sayisi: 0, ilk_seans_gunu: null, son_seans_gunu: null,
    toplam_not: 0, toplam_sohbet: 0, toplam_duzeltme: 0, rutin: {}, ozet: null, ozet_seans: 0,
    ogrenme_selam_gunu: null, meslektas_selam_at: null,
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
  // NOTYA-ARSIV-01: arşivlenmiş muayene doktorun ritim gözlemine girmez.
  const { data } = await arsivsizSeanslar(sb, 'started_at, patient_id')
    .eq('doctor_id', doctorId)
    .gte('started_at', baslangic)
    .limit(2000)
  const satirlar = (data || []) as { started_at: string; patient_id: string | null }[]
  if (satirlar.length < 3) return {}

  const gunler = new Map<string, Set<string>>()
  const saatler: number[] = []
  const gunIlk = new Map<string, number>() // NOTYA-SELAM-01: first session hour of each active day
  const haftaGunu = new Map<string, number>()
  for (const s of satirlar) {
    const d = new Date(s.started_at)
    const gun = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
    const saat = Number(d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false }).slice(0, 2))
    const hg = d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'long' })
    if (!gunler.has(gun)) gunler.set(gun, new Set())
    gunler.get(gun)!.add(s.patient_id || s.started_at)
    saatler.push(saat)
    gunIlk.set(gun, Math.min(gunIlk.get(gun) ?? 99, saat))
    haftaGunu.set(hg, (haftaGunu.get(hg) || 0) + 1)
  }
  const gunSayisi = gunler.size
  const ortHasta = Math.round([...gunler.values()].reduce((a, s) => a + s.size, 0) / gunSayisi)
  const sirali = [...saatler].sort((a, b) => a - b)
  const ilkSaatler = [...gunIlk.values()].sort((a, b) => a - b)
  const p10 = ilkSaatler[Math.floor(ilkSaatler.length / 2)] // the median first-session hour, not a low percentile of every session
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

/** Upsert + güven eşiği. Aynı anahtar tekrar görülürse kanıt artar, değer güncellenir.
 *  NOTYA-OGRENME-05: doktor_soyledi (ve kesin eşiği geçen her kayıt) durum=uygulanir yazar —
 *  migration 106 DEFAULT 'aday' yüzünden kahve/hitap gibi kişisel tercihler UI'da "aday"da
 *  takılı kalıyordu; kesin=true olsa bile Ayarlar durum kolonunu gösteriyordu. */
export function durumHesapla(kaynak: HafizaKaynak, kesin: boolean): HafizaDurum {
  if (kaynak === 'doktor_soyledi' || kesin) return 'uygulanir'
  return 'aday'
}

/** Okuma yolu: eski satırları (kesin ama durum=aday) UI + prompt için düzelt.
 *  Kapalıya dokunulmaz. doktor_soyledi asla aday kalmaz. */
export function kayitNormalize(k: HafizaKayit): HafizaKayit {
  if (k.aktif === false || k.durum === 'kapali') {
    return { ...k, durum: 'kapali', aktif: false }
  }
  if (k.kaynak === 'doktor_soyledi') {
    return { ...k, kesin: true, durum: 'uygulanir', aktif: true }
  }
  if (k.kesin) {
    return { ...k, durum: 'uygulanir', aktif: true }
  }
  return { ...k, durum: k.durum || 'aday' }
}

export async function hafizaKaydet(
  sb: SupabaseClient,
  doctorId: string,
  k: { kategori: HafizaKategori; anahtar: string; deger: string; kaynak: HafizaKaynak },
): Promise<void> {
  const anahtar = anahtarSlug(k.anahtar)
  if (!anahtar || !k.deger.trim()) return
  const { data: mevcut } = await sb
    .from('doktor_hafiza')
    .select('kanit_sayisi, kaynak, durum')
    .eq('doctor_id', doctorId).eq('kategori', k.kategori).eq('anahtar', anahtar)
    .maybeSingle()
  const kanit = (mevcut?.kanit_sayisi || 0) + 1
  // Doktorun kendi ağzından söylediği hemen kesin; gözlem/düzeltme eşiğe bakar.
  const kaynak: HafizaKaynak = k.kaynak === 'doktor_soyledi' || mevcut?.kaynak === 'doktor_soyledi' ? 'doktor_soyledi' : k.kaynak
  const kesin = kaynak === 'doktor_soyledi' || kanit >= KESINLIK_ESIGI[k.kategori]
  // Kapalı kuralı yeniden söyleyince açılır (aktif:true); aksi halde hesaplanan durum.
  const durum = mevcut?.durum === 'kapali' && kaynak !== 'doktor_soyledi'
    ? 'kapali' as HafizaDurum
    : durumHesapla(kaynak, kesin)
  const simdi = new Date().toISOString()
  await sb.from('doktor_hafiza').upsert({
    doctor_id: doctorId,
    kategori: k.kategori,
    anahtar,
    deger: k.deger.trim().slice(0, 300),
    kaynak,
    kanit_sayisi: kanit,
    kesin: durum === 'uygulanir',
    aktif: durum !== 'kapali',
    durum,
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
    sb.from('doktor_hafiza').select('kategori, anahtar, deger, kaynak, kanit_sayisi, kesin, aktif, durum, ornekler, ilk_gorulme, son_gorulme')
      .eq('doctor_id', doctorId).eq('aktif', true).order('son_gorulme', { ascending: false }).limit(80)
      .then(async (r) => {
        if (r.error && /durum|ornekler|kanit_not/i.test(r.error.message || '')) {
          return sb.from('doktor_hafiza').select('kategori, anahtar, deger, kaynak, kanit_sayisi, kesin, aktif, ilk_gorulme, son_gorulme')
            .eq('doctor_id', doctorId).eq('aktif', true).order('son_gorulme', { ascending: false }).limit(80)
        }
        return r
      }),
    sb.from('doktor_stil_profilleri').select('profil').eq('doctor_id', doctorId).maybeSingle(),
  ])
  const kayitlar = ((kayitRes.data || []) as HafizaKayit[]).map(kayitNormalize)
  return {
    iliski,
    asama: asamaBul(iliski.seans_sayisi),
    kesinKayitlar: kayitlar.filter((k) => k.durum === 'uygulanir'),
    belirsizKayitlar: kayitlar.filter((k) => k.durum === 'aday'),
    stilProfili: String(stilRes.data?.profil || ''),
  }
}

/** Ayarlar sayfası — kapalılar dahil, her kayıt görünür. */
export async function hafizaYukleTum(sb: SupabaseClient, doctorId: string): Promise<HafizaKayit[]> {
  const { data } = await sb
    .from('doktor_hafiza')
    .select('kategori, anahtar, deger, kaynak, kanit_sayisi, kesin, aktif, durum, ornekler, ilk_gorulme, son_gorulme')
    .eq('doctor_id', doctorId)
    .order('son_gorulme', { ascending: false })
    .limit(200)
  return ((data || []) as HafizaKayit[]).map(kayitNormalize)
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
    asamaKurali(asama, iliski.seans_sayisi, h.kesinKayitlar.length > 0),
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
    .filter((k) => k.kategori === 'iletisim' || k.kategori === 'rutin' || k.kategori === 'kisisel' || k.kategori === 'klinik' || k.kategori === 'uslup')
    .slice(0, 10)
    .map((k) => `• ${k.deger}`)
  return [
    `Bu doktorla ${iliski.seans_sayisi} seans çalıştın (${asama}). ${asamaKurali(asama, iliski.seans_sayisi, h.kesinKayitlar.length > 0)} Hafıza klinik güvenlik uyarılarını asla gevşetmez; nihai karar doktorundur.`,
    iliski.ozet ? `Özet: ${iliski.ozet}` : '',
    onemli.length ? `Bildiklerin (UYGULA, sorma):\n${onemli.join('\n')}` : '',
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
// Öğrenme — doktorun sohbette söylediklerinden (kapılı model çağrısı)
// ------------------------------------------------------------------

/** Ucuz kapı: yalnız doktor kendinden/tercihinden bahsediyorsa model çağrılır. */
const KENDINDEN_BAHSETME = /\b(ben|benim|bana|bende|hep|her zaman|genelde|genellikle|asla|hiç|sevmem|sevmiyorum|severim|sevdiğim|istemem|istemiyorum|tercih|kullanırım|kullanmam|yazarım|yazmam|alışkanlık|mesai|öğle|sabah|akşam|unut|artık|bundan sonra|kısa|uzun|detaylı|hitap|hocam deme|adımla|randevu sürem|dakika|kahve|çay|sütlü|şekerl|içerim|yerim|de bana|bana .* (de|demezsin|deme))\b/i

// NOTYA-OGRENME-GATE-01 (Kaan, 2026-10-02): a doctor teaches style with imperative requests ('Ayse, cevaplarini madde madde ver'),
// not only by talking about himself. This gate only decides whether the (paid) extraction call runs; the extraction itself keeps
// its rule: permanent, general, in the doctor's own words, never patient-specific clinical content.
function sadeTrOgren(m: string): string {
  const k = String(m || '').toLocaleLowerCase('tr').replace(/\u00e7/g, 'c').replace(/\u011f/g, 'g').replace(/\u0131/g, 'i').replace(/\u00f6/g, 'o').replace(/\u015f/g, 's').replace(/\u00fc/g, 'u')
  return ' ' + k.replace(/[^a-z0-9 ]/g, ' ').replace(/ +/g, ' ').trim() + ' '
}
const BICIM_ISTEGI = / (madde madde|tablo halinde|tablo olarak|kisa tut|kisa yaz|kisa anlat|kisa ver|kisaca anlat|ozet gec|ozet ver|detayli anlat|detayli yaz|detayli ver|daha kisa|daha uzun|daha detayli|daha sade|sade anlat|uzun yazma|ayrintili anlat) | (cevaplarini|yanitlarini|notlarini|ozetlerini|aciklamalarini|cevaplarin|yanitlarin) /
/** Kişisel / iletişim tercihleri — "kahveyi çok sütlü severim", "bana Hocam de" (NOTYA-OGRENME-05). */
const KISISEL_TERCIH = / (kahve|cay|sutlu|sekerli|seker|hitap|hocam|adimla|bana .* de) /
export function ogrenmeyeDeger(mesaj: string): boolean {
  if (mesaj.length < 12) return false
  if (KENDINDEN_BAHSETME.test(mesaj)) return true
  const sade = sadeTrOgren(mesaj)
  return BICIM_ISTEGI.test(sade) || KISISEL_TERCIH.test(sade)
}

interface CikarilanKayit { kategori: HafizaKategori; anahtar: string; deger: string; unut?: boolean }

/** Output cap of the extraction call — reasoning tokens included. */
export const OGRENME_TOKEN_TAVANI = 1200

/** The extraction answer as records: fenced, wrapped in prose or cut mid-list, whatever can be recovered; else []. */
export function ogrenilenKayitlar(ham: string): CikarilanKayit[] {
  const temiz = String(ham || '').replace(/```[a-z]*/g, '').replace(/```/g, '').trim()
  const kayit = (liste: unknown): CikarilanKayit[] => (Array.isArray(liste) ? liste.filter((k): k is CikarilanKayit => !!k && typeof k === 'object') : [])
  const tam = jsonCikar(temiz)
  if (tam) return kayit(tam.kayitlar)
  // Cut mid-list: the records before the cut are whole; the last one may be half a sentence — it is not kept.
  return kayit((jsonOnar(temiz) as { kayitlar?: unknown } | null)?.kayitlar).slice(0, -1)
}

/** Son turlardan doktorun KENDİ AĞZINDAN söylediği kalıcı bilgileri çıkarır.
 *  Hastaya özgü klinik içerik alınmaz; yalnız doktorun kendisi/tercihi/ritmi. */
export async function sohbettenOgren(
  sb: SupabaseClient,
  doctorId: string,
  sonMesajlar: { role: string; content: string }[],
): Promise<number> {
  const metin = sonMesajlar.slice(-6).map((m) => `${m.role === 'user' ? 'DOKTOR' : 'ASİSTAN'}: ${String(m.content).slice(0, 600)}`).join('\n')
  // NOTYA-MALIYET-01: doktorun kendi tercihlerini çıkarma — dar HIZLI listesinde (hasta klinik verisi alınmaz)
  // NOTYA-AYSE-GERI-07 (audit §7, PR 12): this answer is PARSED, and the tiering rule is "effort none never where
  // JSON is parsed" (lib/ai/modeller.ts). The task's default is none, so the call site asks for low effort, marks
  // the answer as JSON (a cut or unparseable answer goes through the quality gate instead of being dropped), and
  // leaves room for the reasoning tokens that now count against the cap.
  const yanit = await aiCagir({
    gorev: 'cikarim',
    caba: 'low',
    jsonBekleniyor: true,
    maxTokens: OGRENME_TOKEN_TAVANI,
    doctorId,
    system: `Bir doktor ile AI meslektaşının sohbetinden, doktorun KENDİSİ hakkında AÇIKÇA söylediği ve gelecekte de geçerli KALICI bilgileri çıkar. Kişisel şef benzetmesi: "balık yemem", "akşam 7'de yerim", "az ricotta", "kahveyi çok sütlü ve çok şekerli severim", "bana Hocam de" gibi şeyler — bunlar TEK kanıtla uygulanır (aday değildir).
Kategoriler: klinik (ilaç/tedavi tercihleri), uslup (not/konuşma biçimi tercihleri: kısa/uzun, terminoloji), rutin (mesai, öğle arası, hasta yoğunluğu, randevu süresi), iletisim (hitap: "bana X de", "Hocam deme", cevap uzunluğu, ses tonu), kisisel (doktorun paylaştığı kişisel detay: kahve/çay tercihi, çocuğu var, cuma erken çıkar), uygulama (hangi özelliği nasıl kullanmak istediği).
KURALLAR:
- YALNIZ doktorun kendi ağzından söylediği, genellenebilir bilgi. Hastaya özgü klinik bilgi (o hastanın adı, o vakanın dozu) ALINMAZ.
- Asistanın söylediklerinden veya varsayımdan kayıt üretme.
- "Bunu unut", "artık öyle değil" gibi ifadelerde unut:true ile döndür.
- Hiçbir şey yoksa boş liste döndür. Uydurma.
- deger: doğal Türkçe, üçüncü şahıs, en fazla 20 kelime ("Öğle 12:30-13:30 arası hasta almaz", "Kahveyi çok sütlü ve çok şekerli sever").
- anahtar: 2-4 kelimelik kısa slug ("ogle-arasi", "hitap-sekli", "kahve-tercihi", "antibiyotik-ilk-tercih").
SADECE JSON döndür: {"kayitlar":[{"kategori":"...","anahtar":"...","deger":"...","unut":false}]}`,
    messages: [{ role: 'user', content: metin }],
  })
  const ham = yanit.content[0]?.type === 'text' ? yanit.content[0].text : ''
  const kayitlar = ogrenilenKayitlar(ham)
  if (!kayitlar.length) return 0
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

/** NOTYA-OGRENME-04: doktorun kendi mesajlarından BIREBIR örnek — 5-seanslık özete tempo
 *  sinyali sağlar. LLM'siz; yazılı sohbet/Ayşe'ye Danış oturumlarından (asistan_sessions)
 *  en son birkaç oturumun doktor tarafı turlarını alır. Hastaya özel klinik bilgi filtrelenmez
 *  — bu metin yalnız bir sonraki özet çağrısına girer, doğrudan hiçbir yüzeye
 *  gösterilmez ya da kaydedilmez. */
export async function sohbetOrnekleriDerle(sb: SupabaseClient, doctorId: string, limitMesaj = 15): Promise<string> {
  const { data } = await sb
    .from('asistan_sessions')
    .select('messages')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(4)
  const turler: string[] = []
  for (const s of (data || []) as { messages?: { role: string; content: string }[] }[]) {
    for (const m of (s.messages || [])) {
      const t = String(m?.content || '').trim()
      if (m?.role === 'user' && t) turler.push(t.slice(0, 200))
    }
  }
  return turler.slice(0, limitMesaj).join('\n---\n')
}

/** NOTYA-OGRENME-04: LLM'siz gözlem — asistan_actions'tan seans başına eylem sırası ("A→B→C").
 *  Ardışık aynı tip sıkıştırılır (GENERAL_CHAT tekrarı gürültü); yalnız en az 2 farklı
 *  anlamlı (GENERAL_CHAT dışı) adım içeren seanslar döndürülür — tek adımlı seanslar
 *  "sıra" sayılmaz. */
export async function eylemSirasiOzeti(sb: SupabaseClient, doctorId: string, limitSeans = 6): Promise<string> {
  const { data } = await sb
    .from('asistan_actions')
    .select('asistan_session_id, action_type, created_at')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(150)
  const satirlar = (data || []) as { asistan_session_id: string | null; action_type: string; created_at: string }[]
  const gruplar = new Map<string, string[]>()
  for (const s of satirlar) {
    const k = s.asistan_session_id || 'bilinmeyen'
    if (!gruplar.has(k)) gruplar.set(k, [])
    gruplar.get(k)!.push(s.action_type)
  }
  const satirMetni: string[] = []
  for (const [, tipler] of [...gruplar.entries()].slice(0, limitSeans)) {
    const kronolojik = [...tipler].reverse() // created_at desc geldi
    const sikistirilmis: string[] = []
    for (const t of kronolojik) if (sikistirilmis[sikistirilmis.length - 1] !== t) sikistirilmis.push(t)
    if (sikistirilmis.filter((t) => t !== 'GENERAL_CHAT').length >= 2) satirMetni.push(sikistirilmis.join(' → '))
  }
  return satirMetni.join('\n')
}

/** 5 seansta bir "bu doktor kimdir" özeti. Sesli promptta ve karşılamada kullanılır.
 *  NOTYA-OGRENME-05: 5–12. seans arası 3'te bir güncelle — 10. seansta iş stili + kişisel
 *  bağ özeti taze olsun; sonrası yine 5'te bir. */
export async function ozetGerekirseGuncelle(sb: SupabaseClient, doctorId: string): Promise<void> {
  const h = await hafizaYukle(sb, doctorId)
  const seans = h.iliski.seans_sayisi
  if (seans < 5) return
  const aralik = seans < 12 ? 3 : 5
  if (seans - h.iliski.ozet_seans < aralik) return
  const [ornekMetni, siraMetni] = await Promise.all([
    sohbetOrnekleriDerle(sb, doctorId).catch(() => ''),
    eylemSirasiOzeti(sb, doctorId).catch(() => ''),
  ])
  const malzeme = [
    rutinMetni(h.iliski.rutin),
    h.kesinKayitlar.length ? kayitlariGrupla(h.kesinKayitlar) : '',
    h.stilProfili ? `Not tercihleri:\n${h.stilProfili}` : '',
    ornekMetni ? `Doktorun kendi mesajlarından birebir örnekler (tempo/üslup için — bunları ANALİZ ET, aynen tekrarlama):\n${ornekMetni}` : '',
    siraMetni ? `Geçmiş seanslarda gözlemlenen eylem sırası (chat içindeki iş adımları, kronolojik):\n${siraMetni}` : '',
  ].filter(Boolean).join('\n')
  if (!malzeme) return
  // NOTYA-MALIYET-01: hafıza kayıtlarından doktor profili paragrafı — dar HIZLI listesinde
  const yanit = await aiCagir({
    gorev: 'ozet',
    maxTokens: 350,
    doctorId,
    system: `Aşağıdaki hafıza kayıtlarından bir doktorun çalışma karakterini anlatan 3-6 cümlelik TEK paragraf yaz — bir meslektaşın onu yeni bir asistana tanıtması gibi (ritmi, üslubu, nelere önem verdiği, nasıl hitap edilmek istediği, bilinen kişisel alışkanlıkları).
Elinde "birebir mesaj örnekleri" varsa bunlardan doktorun GERÇEK konuşma temposunu çıkar (kısa/uzun cümle kurar mı, doğrudan mı nazik mi, terminoloji mi günlük dil mi kullanır) — örnekleri TIRNAK İÇİNDE ALINTILAMA, yalnız gözlemi anlat.
Elinde "eylem sırası" varsa ve GERÇEKTEN tekrar eden bir kalıp görüyorsan (ör. genelde önce tanı sorar, sonra reçete ister) bunu bir cümleyle ekle; tek örnekten genelleme yapma, kalıp net değilse hiç bahsetme.
Türkçe, üçüncü şahıs, süsleme yok, kayıtlarda olmayanı yazma, uydurma.`,
    messages: [{ role: 'user', content: malzeme }],
  })
  const ozet = yanit.content[0]?.type === 'text' ? yanit.content[0].text.trim() : ''
  if (!ozet) return
  await sb.from('doktor_iliski').upsert({
    ...h.iliski, doctor_id: doctorId, ozet, ozet_seans: seans, updated_at: new Date().toISOString(),
  })
}
