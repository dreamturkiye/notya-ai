/**
 * NOTYA-BETA-0925 (Dr. Gökhan, 2026-09-25) — kimlik / iletişim sorusuna sunucuda, modelsiz cevap.
 *
 * Canlı vaka: doktor sesle "Umutcan Türkoğlu'nun anne ve baba adı ne?" dedi; Ayşe "erişimim yok" dedi. Adlar hasta
 * kartında (Demografik bilgiler) ve Hasta Bilgi Formu'nda vardı. Sebep bilinçliydi: hastaDosyaDerleyici kimlik ve
 * iletişim bilgisini modele VERMEZ (KVKK + VELI-YASAL-ONAM). Kural korunur; bunun yerine bu modül:
 *
 *   1. soruyu tanır (kimlikSorusu — anne adı, baba adı, veli / yasal temsilci, telefon, e-posta, adres, doğum yeri
 *      ve tarihi),
 *   2. hastayı YALNIZ bu doktorun hastaları içinden adıyla ya da aktif hastadan çözer,
 *   3. değeri şifre çözülmüş hasta kaydından, en son Hasta Bilgi Formu'ndan ve (anne / baba adı, doğum yeri için)
 *      belge özetlerinden okur (dosyaAlanTara.kimlikAlanlariniTara),
 *   4. iki metin döndürür: `ekran` (değerlerle — yalnız doktorun ekranına) ve `model` (değersiz — sesli ajana,
 *      sohbet geçmişine). Değerler hiçbir model bağlamına girmez.
 *
 * Eksik değer için doktora nereden ekleyeceği söylenir. HASTA-IZOLASYON-01: her okuma doctor_id / doktor_id'li.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { kimlikAlanlariniTara } from '@/lib/doktor/dosyaAlanTara'
import { ARAMA_ALANLARI } from '@/lib/doktor/hastaAramaFiltre'
import { cozumKonus, hastaninSozunuCoz } from '@/lib/doktor/hastaCozumleyici'
import { veliOnamGerekliMi } from '@/lib/specialties/kapsam'

export type KimlikAlani =
  | 'anneAdi' | 'babaAdi' | 'veli'
  | 'telefon' | 'anneTelefon' | 'babaTelefon' | 'veliTelefon'
  | 'eposta' | 'adres' | 'dogumYeri' | 'dogumTarihi'

type Kaynak = 'kart' | 'form' | 'belge'
type Kaynakli = { deger: string; kaynak: Kaynak } | null
type Kisi = { ad: string; yakinlik: string; telefon: string }

export interface KimlikKaydi {
  ad: string
  dogumTarihi: Kaynakli
  telefon: Kaynakli
  eposta: Kaynakli
  adres: Kaynakli
  dogumYeri: Kaynakli
  anneAdi: Kaynakli
  babaAdi: Kaynakli
  veli: Kisi | null
  acilKisi: Kisi | null
}

export interface KimlikCevabi {
  /** Değerlerle — yalnız doktorun ekranına. */
  ekran: string
  /** Değersiz — sesli ajana ve sohbet geçmişine (model bağlamı) yalnız bu gider. */
  model: string
  hasta: { id: string; ad: string } | null
}

// "Anne adı" / "Baba adı" etiketleri hasta aramasının kimlik alanlarıyla aynı (lib/doktor/hastaAramaFiltre.ts).
const ARAMA_ETIKET = Object.fromEntries(ARAMA_ALANLARI.map((a) => [a.anahtar, a.etiket]))

const ETIKET: Record<KimlikAlani, string> = {
  anneAdi: ARAMA_ETIKET.anneadi || 'Anne adı',
  babaAdi: ARAMA_ETIKET.babaadi || 'Baba adı',
  veli: 'Veli / yasal temsilci',
  telefon: 'Telefon',
  anneTelefon: 'Annesinin telefonu',
  babaTelefon: 'Babasının telefonu',
  veliTelefon: 'Veli telefonu',
  eposta: 'E-posta',
  adres: 'Adres',
  dogumYeri: ARAMA_ETIKET.dogumyeri || 'Doğum yeri',
  dogumTarihi: ARAMA_ETIKET.dogum || 'Doğum tarihi',
}

const KAYNAK_ETIKETI: Record<Kaynak, string> = { kart: 'hasta kartı', form: 'Hasta Bilgi Formu', belge: 'belgeden' }

const KART_YERI = 'hasta dosyasında Özet › Demografik bilgiler › Düzenle’den ekleyebilirsiniz'
const FORM_YERI = 'Hasta Bilgi Formu’yla gelir; formu hasta dosyasındaki Hasta Formu sekmesinden gönderebilirsiniz'

function sade(mesaj: string): string {
  return ` ${trAramaNormalize(mesaj).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()} `
}

/**
 * Mesaj bir kimlik / iletişim sorusu mu? Hangi alanlar isteniyor (boş = değil). Klinik cümleyi kaçırmamak için
 * yalnız soru biçimli ifadeler: "annesinin adı", "babasının telefonu", "adresi ne" — "annesi telefonda ateşin 39
 * olduğunu söyledi" (telefonda) ya da kohort sorusu ("telefonu olmayan hastalar") eşleşmez.
 */
export function kimlikSorusu(mesaj: string): KimlikAlani[] {
  const n = sade(mesaj)
  if (n.trim().length < 3) return []
  // Kohort / pratik sorusu, kayıt ya da gönderim niyeti → kimlik cevabı değil.
  // "annesinin adı Ayşe olan hastayı bul" bir hasta aramasıdır (hastaAramaFiltre anneadi filtresi) — burada cevaplanmaz.
  if (/ hastalar| hastalarim| kac hasta| hangi hasta| olan | bul\w* | listele\w* /.test(n)) return []
  if (/ (kaydet|guncelle|degistir|ekle|sil|duzelt|gonder|yolla)\w*/.test(n) || / mail at /.test(n)) return []

  const anne = / anne(?!anne)\w*/.test(n) || / ana(si|sinin|nin)? ad/.test(n)
  const baba = / baba(?!anne)\w*/.test(n)
  const veli = / veli\w*/.test(n) || / yasal temsilci\w*/.test(n)

  const ad = / (adi|adini|adlari|adlarini|adi ne|ismi|ismini|isimleri|isimlerini|adi soyadi|ad soyadi|kim|kimdir) /.test(n)
  const eposta = / (e posta|eposta|e mail|email|mail)\w* /.test(n)
  const telefon = / (telefon|telefonu|telefonunu|telefonlari|telefonlarini|telefon numarasi\w*|numarasi|numarasini|numaralari|numaralarini|tel no|telefon no|cep no|gsm) /.test(n)
  const adresMetni = n.replace(/ (e posta|eposta|e mail|email|mail) adres\w*/g, ' ')
  const adres = / (adres|adresi|adresini|adresleri|ev adresi) /.test(adresMetni)
  const dogumYeri = / dogum yeri\w*| nerede dogmus| nereli /.test(n)
  const dogumTarihi = / dogum tarihi\w*| ne zaman dogmus| dogum gunu\w*/.test(n)

  const alanlar: KimlikAlani[] = []
  const ekle = (a: KimlikAlani) => { if (!alanlar.includes(a)) alanlar.push(a) }
  if (anne && ad) ekle('anneAdi')
  if (baba && ad) ekle('babaAdi')
  if (veli && (ad || / (bilgi\w*|kim|kimdir) /.test(n) || / veli\w* (ne|nedir) /.test(n) || n.trim().split(' ').length <= 3)) ekle('veli')
  if (telefon) {
    if (anne) ekle('anneTelefon')
    if (baba) ekle('babaTelefon')
    if (veli) ekle('veliTelefon')
    if (!anne && !baba && !veli) ekle('telefon')
  }
  if (eposta) ekle('eposta')
  if (adres) ekle('adres')
  if (dogumYeri) ekle('dogumYeri')
  if (dogumTarihi) ekle('dogumTarihi')
  return alanlar
}

function coz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}
function metin(v: unknown): string {
  return Array.isArray(v) ? v.filter(Boolean).join(', ') : String(v ?? '').trim()
}
function kaynakli(deger: string, kaynak: Kaynak): Kaynakli {
  return deger.trim() ? { deger: deger.trim(), kaynak } : null
}
function ilkDolu(...a: Kaynakli[]): Kaynakli {
  return a.find((x) => x && x.deger) || null
}
/** Belge özeti JSON'undaki tüm metin değerleri, satır satır — "Anne Adı: …" satırı etiketle bulunsun. */
function metinleriTopla(v: unknown, out: string[] = [], derinlik = 0): string[] {
  if (derinlik > 5 || v == null) return out
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => metinleriTopla(x, out, derinlik + 1))
  else if (typeof v === 'object') Object.values(v as Record<string, unknown>).forEach((x) => metinleriTopla(x, out, derinlik + 1))
  return out
}

/** Hasta kaydı + son Hasta Bilgi Formu + belge özetleri → kimlik kaydı. Hasta bu doktorun değilse null. */
export async function kimlikKaydiOku(supabase: SupabaseClient, doktorId: string, patientId: string): Promise<KimlikKaydi | null> {
  const { data: p } = await supabase
    .from('patients')
    .select('id, name_encrypted, dob_encrypted, phone_encrypted, email_encrypted, notes_encrypted')
    .eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  if (!p) return null

  const [intakeQ, belgeQ] = await Promise.all([
    supabase.from('hasta_intake_formlari').select('form_data_encrypted, created_at')
      .eq('patient_id', patientId).eq('doktor_id', doktorId).order('created_at', { ascending: false }).limit(1),
    supabase.from('hasta_belgeler').select('ai_ozet')
      .eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(10),
  ])

  let ad = ''
  try { ad = String(JSON.parse(coz(p.name_encrypted)).ad || '').trim() } catch { ad = coz(p.name_encrypted).trim() }
  let notlar: Record<string, unknown> = {}
  try { notlar = JSON.parse(coz(p.notes_encrypted) || '{}') } catch { notlar = {} }
  let y: Record<string, unknown> = {}
  const intake = intakeQ.data?.[0] as { form_data_encrypted?: string | null } | undefined
  if (intake?.form_data_encrypted) {
    try { y = JSON.parse(decrypt(intake.form_data_encrypted)) as Record<string, unknown> } catch { y = {} }
  }
  const belgeMetni = ((belgeQ.data || []) as { ai_ozet?: unknown }[]).flatMap((b) => metinleriTopla(b.ai_ozet)).join('\n')
  const belgeden = new Map(kimlikAlanlariniTara(belgeMetni).map((b) => [b.id, b.deger]))
  const b = (id: string) => kaynakli(belgeden.get(id) || '', 'belge')

  const adresFormu = [metin(y.adres), metin(y.il)].filter(Boolean).join(', ')
  const veliAd = [metin(y.veliAd), metin(y.veliSoyad)].filter(Boolean).join(' ')
  const veliYakinlik = metin(y.veliYakinligi) === 'Diğer' ? (metin(y.veliDigerAdSoyad) || 'Diğer') : metin(y.veliYakinligi)
  const veli: Kisi | null = veliAd || metin(y.veliTelefon) ? { ad: veliAd, yakinlik: veliYakinlik, telefon: metin(y.veliTelefon) } : null
  const acilKisi: Kisi | null = metin(y.acilKisiAdi) || metin(y.acilKisiTelefon)
    ? { ad: metin(y.acilKisiAdi), yakinlik: metin(y.acilKisiYakinlik), telefon: metin(y.acilKisiTelefon) }
    : null

  return {
    ad: ad || 'Hasta',
    dogumTarihi: ilkDolu(kaynakli(coz(p.dob_encrypted).slice(0, 10), 'kart'), kaynakli(metin(y.dogumTarihi), 'form'), b('dogumTarihi')),
    telefon: ilkDolu(kaynakli(coz(p.phone_encrypted), 'kart'), kaynakli(metin(y.telefon), 'form')),
    eposta: ilkDolu(kaynakli(coz(p.email_encrypted), 'kart'), kaynakli(metin(y.eposta), 'form')),
    adres: ilkDolu(kaynakli(adresFormu, 'form'), kaynakli(metin(notlar.sehir), 'kart')),
    dogumYeri: ilkDolu(kaynakli(metin(y.dogumYeri), 'form'), b('dogumYeri')),
    anneAdi: ilkDolu(kaynakli(metin(notlar.anneAdi), 'kart'), kaynakli(metin(y.anneAdi), 'form'), b('anneAdi')),
    babaAdi: ilkDolu(kaynakli(metin(notlar.babaAdi), 'kart'), kaynakli(metin(y.babaAdi), 'form'), b('babaAdi')),
    veli,
    acilKisi,
  }
}

function trTarih(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso
}

function yakinMi(k: Kisi | null, kim: 'anne' | 'baba'): boolean {
  return !!k && trAramaNormalize(k.yakinlik).includes(kim)
}

/** Tek alanın ekran satırı (değerli) ve model satırı (değersiz). */
function satir(alan: KimlikAlani, k: KimlikKaydi, nowMs: number): { ekran: string; model: string } {
  const etiket = ETIKET[alan]
  const goster = (x: Kaynakli, bicim: (s: string) => string = (s) => s) =>
    x ? { ekran: `${etiket}: ${bicim(x.deger)} (${KAYNAK_ETIKETI[x.kaynak]})`, model: `${etiket} ekranda` } : null
  const eksik = (nereden: string) => ({ ekran: `${etiket} kayıtlı değil — ${nereden}.`, model: `${etiket} kayıtlı değil — ${nereden}.` })

  switch (alan) {
    case 'anneAdi': return goster(k.anneAdi) || eksik(KART_YERI)
    case 'babaAdi': return goster(k.babaAdi) || eksik(KART_YERI)
    case 'telefon': return goster(k.telefon) || eksik(KART_YERI)
    case 'eposta': return goster(k.eposta) || eksik(KART_YERI)
    case 'dogumTarihi': return goster(k.dogumTarihi, trTarih) || eksik(KART_YERI)
    case 'adres': return goster(k.adres) || eksik(FORM_YERI)
    case 'dogumYeri': return goster(k.dogumYeri) || eksik(FORM_YERI)
    case 'veli': {
      if (k.veli) {
        const parca = [k.veli.ad, k.veli.yakinlik ? `(${k.veli.yakinlik})` : '', k.veli.telefon ? `— ${k.veli.telefon}` : ''].filter(Boolean).join(' ')
        return { ekran: `${etiket}: ${parca} (Hasta Bilgi Formu)`, model: `${etiket} ekranda` }
      }
      const dogum = k.dogumTarihi?.deger || ''
      if (dogum && !veliOnamGerekliMi(dogum, nowMs)) {
        return { ekran: 'Hasta 18 yaşını doldurmuş; veli / yasal temsilci bilgisi tutulmuyor.', model: 'Hasta reşit; veli / yasal temsilci bilgisi tutulmuyor.' }
      }
      return eksik('Hasta Bilgi Formu’nun Veli / Yasal Temsilci bölümünde doldurulur; formu hasta dosyasındaki Hasta Formu sekmesinden gönderebilirsiniz')
    }
    case 'anneTelefon':
    case 'babaTelefon':
    case 'veliTelefon': {
      const kim = alan === 'anneTelefon' ? 'anne' : alan === 'babaTelefon' ? 'baba' : null
      const kisi = kim
        ? (yakinMi(k.veli, kim) && k.veli?.telefon ? { ...k.veli, kaynak: 'veli' } : yakinMi(k.acilKisi, kim) && k.acilKisi?.telefon ? { ...k.acilKisi, kaynak: 'acil' } : null)
        : (k.veli?.telefon ? { ...k.veli, kaynak: 'veli' } : null)
      if (kisi) {
        const nereden = kisi.kaynak === 'veli' ? 'Hasta Bilgi Formu, veli' : 'Hasta Bilgi Formu, acil durumda aranacak kişi'
        return { ekran: `${etiket}: ${kisi.telefon}${kisi.ad ? ` — ${kisi.ad}` : ''} (${nereden})`, model: `${etiket} ekranda` }
      }
      if (k.telefon) {
        return {
          ekran: `${etiket} ayrıca kayıtlı değil. Dosyadaki iletişim telefonu: ${k.telefon.deger} (${KAYNAK_ETIKETI[k.telefon.kaynak]}; kime ait olduğu yazılı değil).`,
          model: `${etiket} ayrıca kayıtlı değil; dosyadaki iletişim telefonu ekranda.`,
        }
      }
      return eksik(KART_YERI)
    }
  }
}

export function kimlikCevabiMetni(alanlar: KimlikAlani[], k: KimlikKaydi, nowMs = Date.now()): { ekran: string; model: string } {
  const satirlar = alanlar.map((a) => satir(a, k, nowMs))
  return {
    ekran: satirlar.length === 1 ? `${k.ad} — ${satirlar[0].ekran}` : `${k.ad}\n${satirlar.map((s) => `• ${s.ekran}`).join('\n')}`,
    model: `${k.ad} için istenen kimlik bilgisini doğrudan doktorun ekranına yazdım (${satirlar.map((s) => s.model).join('; ')}). `
      + 'KVKK gereği kimlik ve iletişim değerleri bana gönderilmiyor — değeri söyleme, "ekranda" de.',
  }
}

/**
 * Tam akış: hastayı çöz (mesajdaki ad → yoksa aktif hasta), kaydı oku, iki metni kur. Kimlik sorusu değilse null.
 * `aktifPatientId` yalnız sohbet oturumunun ZATEN sahipliği doğrulanmış aktif hastasıdır; yine de kayıt
 * doctor_id ile okunur (kimlikKaydiOku), yabancı kimlik null döner.
 */
export async function kimlikSorusunuCevapla(
  supabase: SupabaseClient,
  doktorId: string,
  mesaj: string,
  aktifPatientId: string | null,
  nowMs = Date.now(),
): Promise<KimlikCevabi | null> {
  const alanlar = kimlikSorusu(mesaj)
  if (!alanlar.length) return null

  const cozum = await hastaninSozunuCoz(supabase, doktorId, mesaj, { yalnizAd: true })
  if (cozum.tur === 'coklu') {
    const soru = cozumKonus(cozum) || 'Birden fazla hasta buldum. Hangisini soruyorsunuz?'
    return { ekran: soru, model: soru, hasta: null }
  }
  const hedef = cozum.tur === 'tek' ? { id: cozum.patientId, ad: cozum.ad } : aktifPatientId ? { id: aktifPatientId, ad: '' } : null
  if (!hedef) {
    const soru = 'Hangi hastanın bilgisini istiyorsunuz? Adını yazar mısınız?'
    return { ekran: soru, model: soru, hasta: null }
  }
  const kayit = await kimlikKaydiOku(supabase, doktorId, hedef.id)
  if (!kayit) {
    const yok = 'Bu hastayı kayıtlarınızda bulamadım.'
    return { ekran: yok, model: yok, hasta: null }
  }
  const m = kimlikCevabiMetni(alanlar, kayit, nowMs)
  return { ...m, hasta: { id: hedef.id, ad: hedef.ad || kayit.ad } }
}
