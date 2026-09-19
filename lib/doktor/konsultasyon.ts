/**
 * KONSULTASYON-01 (Kaan 2026-09-19) — kapalı döngü konsültasyon (yönlendirme). Saf + istemci-güvenli (Supabase yok).
 *
 * Kaan'ın örneği: "İşitme sorunu olabileceğini düşündüm, hastayı KBB'ye yönlendirdim. KBB raporuna göre işitme
 * problemi olmadığını tespit ettim ve devam ettim. Show proof — KBB'den gelen rapor burada, şu tarihli, şu hocadan."
 * Döngü: istem (klinik soru) → yanıt bekleniyor → konsültan raporu Kasa'ya → hekimin KENDİ özet cümlesi → yanıtlandı
 * → hekim isterse "Bugünkü muayene formuna ekle" (otomatik yazma yok).
 *
 * TERMİNOLOJİ: UI'de "Konsültasyon" (eş anlamlı "yönlendirme"). "Sevk" yalnız gerçek SGK sevki içindir
 * (SUT EK-2/F / e-sevk) — bu akış o belge DEĞİLDİR. Veri tablosu tarihsel olarak `sevkler` adını taşır (033).
 * TTB konsültasyon ilkesi: istemde neden "çok açık ve anlaşılır", KISALTMASIZ yazılır; aciliyet ve tarih belirtilir;
 * konsültasyon görüşü resmi olarak hasta dosyasına işlenir. Gerekçe: docs/OPEN-COMMITMENTS.md § KONSULTASYON-01.
 *
 * DURUMLAR (033'te CHECK yok; eski değerler çalışmaya devam eder, eski satırlar UPDATE edilmez):
 *   'acik'              — eski (dahiliye/göz/KD) açık kayıt → "yanıt bekleniyor" ile eşdeğer
 *   'yanit_bekleniyor'  — yeni istem; hasta yönlendirildi, rapor bekleniyor
 *   'yanitlandi'        — hekim yanıt özetini yazdı (rapor Kasa'da bağlı olabilir)
 *   'kapandi_yanitsiz'  — hekim yanıt gelmeden kapattı
 *   'kapandi'           — eski kapanış (göz dr_sevk_kapat) → "yanıtsız kapandı" ile eşdeğer
 */
import { SPECIALTIES, SPECIALTY_MAP } from '@/lib/doktor/specialties'
import { tcMaskele } from '@/lib/doktor/aracNotu'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export const KONSULTASYON_DURUMLARI = ['acik', 'yanit_bekleniyor', 'yanitlandi', 'kapandi_yanitsiz', 'kapandi'] as const
export type KonsultasyonDurumu = (typeof KONSULTASYON_DURUMLARI)[number]
export type DurumGrubu = 'bekliyor' | 'yanitlandi' | 'kapandi'

export const ACILIYETLER = ['rutin', 'oncelikli', 'acil'] as const
export type Aciliyet = (typeof ACILIYETLER)[number]
export const ACILIYET_ETIKETI: Record<Aciliyet, string> = { rutin: 'Rutin', oncelikli: 'Öncelikli', acil: 'Acil' }

/** Uzunluk tavanları — sunucu ve istemci aynı sınırı uygular. */
export const KONSULTASYON_SINIRLARI = { klinikSoru: 1000, hedefHekim: 120, not: 1000, tanilar: 500, mevcutDurum: 1000, yanitOzeti: 1000 } as const
/** Klinik soru en az bu kadar karakter — "KBB?" bir istem değildir (TTB: açık ve anlaşılır). */
export const KLINIK_SORU_EN_AZ = 10

/** Satır şekli — `sevkler` tablosunun konsültasyonun okuduğu kolonları. */
export interface KonsultasyonSatiri {
  id: string
  patient_id: string
  doctor_id?: string
  hedef: string
  hedef_brans: string | null
  hedef_hekim: string | null
  klinik_soru: string | null
  not_metni: string | null
  aciliyet: string | null
  tanilar: string | null
  mevcut_durum: string | null
  istem_tarihi: string | null
  yanit_tarihi: string | null
  yanit_ozeti: string | null
  belge_id: string | null
  note_id: string | null
  kaynak: string | null
  durum: string
  son_hatirlatma_at: string | null
  created_at: string
}

/** GET/PATCH'in döndürdüğü kolonlar (select listesi — tek yerde). */
export const KONSULTASYON_KOLONLARI =
  'id, patient_id, hedef, hedef_brans, hedef_hekim, klinik_soru, not_metni, aciliyet, tanilar, mevcut_durum, istem_tarihi, yanit_tarihi, yanit_ozeti, belge_id, note_id, kaynak, durum, son_hatirlatma_at, created_at'

export function durumGrubu(durum: string | null | undefined): DurumGrubu {
  if (durum === 'yanitlandi') return 'yanitlandi'
  if (durum === 'kapandi_yanitsiz' || durum === 'kapandi') return 'kapandi'
  // 'acik', 'yanit_bekleniyor' ve bilinmeyen her değer: açık say (kapanmamış bir istemi gizlemeyiz)
  return 'bekliyor'
}

export const DURUM_ETIKETI: Record<DurumGrubu, string> = {
  bekliyor: 'Yanıt bekleniyor',
  yanitlandi: 'Yanıtlandı',
  kapandi: 'Yanıtsız kapatıldı',
}

/** "Yanıt bekleyen" filtresi — eski 'acik' dahil. */
export const BEKLEYEN_DURUMLAR = ['acik', 'yanit_bekleniyor'] as const

/**
 * Eski kayıtların serbest `hedef` anahtarları (dahiliye SEVK_HEDEFLERI, göz köprüsü, KD) → görünen ad.
 * Kanonik branşa denk gelenler kanonik etiketi kullanır.
 */
const ESKI_HEDEFLER: Record<string, string> = {
  goz: 'goz-hastaliklari',
  gogus: 'gogus-hastaliklari',
  fiziksel_tip: 'fizik-tedavi',
}
const ESKI_ETIKETLER: Record<string, string> = {
  sigara_birakma: 'Sigara bırakma polikliniği',
  perinatoloji: 'Perinatoloji',
}

/** Kanonik branş anahtarı mı? (lib/doktor/specialties.ts — serbest metin DEĞİL) */
export function hedefBransGecerli(k: unknown): k is SpecialtyKey {
  return typeof k === 'string' && !!SPECIALTY_MAP[k]
}

/** Kaydın hedef branşının görünen adı — yeni kayıtta hedef_brans, eskide `hedef`. */
export function hedefEtiketi(s: { hedef_brans?: string | null; hedef?: string | null }): string {
  const k = s.hedef_brans || ''
  if (k && SPECIALTY_MAP[k]) return SPECIALTY_MAP[k].label
  const eski = String(s.hedef || '').trim()
  if (!eski) return 'Belirtilmemiş'
  const kanon = ESKI_HEDEFLER[eski] || eski
  if (SPECIALTY_MAP[kanon]) return SPECIALTY_MAP[kanon].label
  if (ESKI_ETIKETLER[eski]) return ESKI_ETIKETLER[eski]
  return eski.charAt(0).toLocaleUpperCase('tr-TR') + eski.slice(1).replace(/[-_]/g, ' ')
}

/**
 * Hedef branş seçenekleri: doktorun branşının önerdikleri (profile.konsultasyonHedefleri) üstte, sonra tüm branşlar
 * alfabetik. Hekimin kendi branşı listede kalır (aynı branştan ikinci görüş meşrudur).
 */
export function hedefSecenekleri(onerilen: readonly string[] | null | undefined): { onerilen: Array<[SpecialtyKey, string]>; diger: Array<[SpecialtyKey, string]> } {
  const on = (onerilen || []).filter(hedefBransGecerli)
  const onSet = new Set<string>(on)
  const diger = SPECIALTIES.filter((s) => !onSet.has(s.key))
    .map((s) => [s.key as SpecialtyKey, s.label] as [SpecialtyKey, string])
    .sort((a, b) => a[1].localeCompare(b[1], 'tr'))
  return { onerilen: on.map((k) => [k, SPECIALTY_MAP[k].label] as [SpecialtyKey, string]), diger }
}

/**
 * TTB: istem kısaltmasız yazılır. Olası kısaltmaları BULUR (engellemez — hekim karar verir): tamamı büyük harf
 * 2–6 harflik sözcükler ("OME", "ÜSYE", "KBB"). Branş adları da istem metninde açık yazılır. Noktalı kısa sözcükler
 * ("mük.") denetlenmez — Türkçe cümle sonundaki "yok." / "mu." ile ayırt edilemez, yanlış alarm üretir.
 */
export function olasiKisaltmalar(metin: string | null | undefined): string[] {
  const s = String(metin || '')
  const bulunan = new Set<string>()
  for (const m of s.matchAll(/(?<![\p{L}\d])([A-ZÇĞİÖŞÜ]{2,6})(?![\p{L}\d])/gu)) bulunan.add(m[1])
  return [...bulunan]
}

const temiz = (s: unknown, tavan: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, tavan)
const cokSatir = (s: unknown, tavan: number) => String(s ?? '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim().slice(0, tavan)

/** YYYY-AA-GG mi (geçerli takvim günü)? */
export function isoGunMu(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

/** İstanbul saatiyle bugün (UTC+3, yaz saati yok) — gununNotunaEkle / aracNotuBugun ile aynı gün tanımı. */
export function bugunTrIso(simdi: number = Date.now()): string {
  return new Date(simdi + 3 * 3600e3).toISOString().slice(0, 10)
}

export type IstemGirdisi = { hedef_brans: SpecialtyKey; klinik_soru: string; hedef_hekim: string | null; aciliyet: Aciliyet; not_metni: string | null; tanilar: string | null; mevcut_durum: string | null; istem_tarihi: string }

/** POST gövdesini doğrular. Hata varsa Türkçe mesaj döner; yoksa temizlenmiş satır alanları. */
export function istemDogrula(b: Record<string, unknown> | null | undefined, bugun: string = bugunTrIso()): { hata: string } | { girdi: IstemGirdisi } {
  const hedef = String(b?.hedefBrans ?? b?.hedef_brans ?? '')
  if (!hedefBransGecerli(hedef)) return { hata: 'Hedef branşı listeden seçin.' }
  const soru = cokSatir(b?.klinikSoru ?? b?.klinik_soru, KONSULTASYON_SINIRLARI.klinikSoru)
  if (soru.length < KLINIK_SORU_EN_AZ) return { hata: `Klinik soruyu açık yazın (en az ${KLINIK_SORU_EN_AZ} karakter) — ör. "İşitme kaybı var mı?"` }
  const aciliyetHam = String(b?.aciliyet ?? 'rutin')
  if (!(ACILIYETLER as readonly string[]).includes(aciliyetHam)) return { hata: 'Aciliyet geçersiz (rutin, öncelikli, acil).' }
  const istemHam = b?.istemTarihi ?? b?.istem_tarihi
  if (istemHam != null && istemHam !== '' && !isoGunMu(istemHam)) return { hata: 'İstem tarihi geçersiz.' }
  const istem = isoGunMu(istemHam) ? istemHam : bugun
  if (istem > bugun) return { hata: 'İstem tarihi ileri bir tarih olamaz.' }
  const bosNull = (x: string) => (x ? x : null)
  return {
    girdi: {
      hedef_brans: hedef,
      klinik_soru: soru,
      hedef_hekim: bosNull(temiz(b?.hedefHekim ?? b?.hedef_hekim, KONSULTASYON_SINIRLARI.hedefHekim)),
      aciliyet: aciliyetHam as Aciliyet,
      not_metni: bosNull(cokSatir(b?.not ?? b?.not_metni, KONSULTASYON_SINIRLARI.not)),
      tanilar: bosNull(cokSatir(b?.tanilar, KONSULTASYON_SINIRLARI.tanilar)),
      mevcut_durum: bosNull(cokSatir(b?.mevcutDurum ?? b?.mevcut_durum, KONSULTASYON_SINIRLARI.mevcutDurum)),
      istem_tarihi: istem,
    },
  }
}

/** Yanıt gövdesi: hekimin kendi özet cümlesi zorunlu; tarih bugün ya da geçmiş, istemden önce olamaz. */
export function yanitDogrula(
  b: Record<string, unknown> | null | undefined,
  satir: Pick<KonsultasyonSatiri, 'istem_tarihi' | 'created_at'>,
  bugun: string = bugunTrIso(),
): { hata: string } | { yanit_ozeti: string; yanit_tarihi: string } {
  const ozet = cokSatir(b?.yanitOzeti ?? b?.yanit_ozeti, KONSULTASYON_SINIRLARI.yanitOzeti)
  if (ozet.length < 3) return { hata: 'Yanıt özetini kendi cümlenizle yazın — ör. "İşitme kaybı saptanmadı."' }
  const ham = b?.yanitTarihi ?? b?.yanit_tarihi
  if (ham != null && ham !== '' && !isoGunMu(ham)) return { hata: 'Yanıt tarihi geçersiz.' }
  const tarih = isoGunMu(ham) ? ham : bugun
  if (tarih > bugun) return { hata: 'Yanıt tarihi ileri bir tarih olamaz.' }
  const istem = satir.istem_tarihi || String(satir.created_at || '').slice(0, 10)
  if (isoGunMu(istem) && tarih < istem) return { hata: 'Yanıt tarihi istem tarihinden önce olamaz.' }
  return { yanit_ozeti: ozet, yanit_tarihi: tarih }
}

export type KonsultasyonIslemi = 'yanit' | 'belge_bagla' | 'kapat' | 'nota_ekle' | 'hatirlat'

/**
 * Durum geçiş kuralı (PATCH). Kapanmış (yanıtsız) bir konsültasyona geç gelen rapor YİNE eklenebilir;
 * yanıtlanmış kayıtta yanıt düzeltilebilir. Yanıtlanmış kayıt "yanıtsız" kapatılamaz.
 */
export function gecisIzinli(durum: string, islem: KonsultasyonIslemi): { ok: true } | { ok: false; hata: string } {
  const g = durumGrubu(durum)
  switch (islem) {
    case 'yanit':
    case 'belge_bagla':
      return { ok: true }
    case 'kapat':
      return g === 'bekliyor' ? { ok: true } : { ok: false, hata: g === 'yanitlandi' ? 'Yanıtlanmış konsültasyon yanıtsız kapatılamaz.' : 'Bu konsültasyon zaten kapatılmış.' }
    case 'nota_ekle':
      return g === 'yanitlandi' ? { ok: true } : { ok: false, hata: 'Önce yanıt özetini ekleyin — nota eklenecek yanıt yok.' }
    case 'hatirlat':
      return g === 'bekliyor' ? { ok: true } : { ok: false, hata: 'Yalnız yanıt bekleyen konsültasyon için hatırlatma gönderilir.' }
  }
}

/** İstem tarihinden bugüne kaç gün (yanıt bekleyen satırda "N gündür bekliyor"). */
export function beklemeGunu(s: Pick<KonsultasyonSatiri, 'istem_tarihi' | 'created_at'>, bugun: string = bugunTrIso()): number {
  const istem = s.istem_tarihi && isoGunMu(s.istem_tarihi) ? s.istem_tarihi : String(s.created_at || '').slice(0, 10)
  if (!isoGunMu(istem) || !isoGunMu(bugun)) return 0
  return Math.max(0, Math.round((Date.parse(`${bugun}T00:00:00Z`) - Date.parse(`${istem}T00:00:00Z`)) / 86400e3))
}

/** 18.09.2026 */
export function trGun(iso: string | null | undefined): string {
  const s = String(iso || '').slice(0, 10)
  if (!isoGunMu(s)) return '—'
  const [y, a, g] = s.split('-')
  return `${g}.${a}.${y}`
}

/**
 * "Bugünkü muayene formuna ekle" bloğu (hekim BASAR — otomatik yazılmaz). Düz metin, hekim formda düzenler.
 * Klinik içerik yalnız hekimin kendi yazdıkları (soru + yanıt özeti); T.C. kimlik benzeri dizi maskelenir.
 *
 *   [2026-09-19] Konsültasyon yanıtı — Kulak Burun Boğaz (hekim ekledi)
 *   - Soru (12.09.2026): İşitme kaybı var mı?
 *   - Yanıt (18.09.2026, Dr. X): İşitme kaybı saptanmadı.
 *   - Rapor: Kasa'da — kbb-raporu.pdf
 */
export function konsultasyonNotBlogu(
  s: Pick<KonsultasyonSatiri, 'hedef_brans' | 'hedef' | 'klinik_soru' | 'not_metni' | 'istem_tarihi' | 'created_at' | 'yanit_tarihi' | 'yanit_ozeti' | 'hedef_hekim'>,
  belgeAdi: string | null,
  bugunIso: string,
): string | null {
  const ozet = tcMaskele(temiz(s.yanit_ozeti, KONSULTASYON_SINIRLARI.yanitOzeti))
  if (!ozet) return null
  const gun = isoGunMu(bugunIso) ? `[${bugunIso}] ` : ''
  const soru = tcMaskele(temiz(s.klinik_soru || s.not_metni, 300))
  const istem = trGun(s.istem_tarihi || s.created_at)
  const kim = temiz(s.hedef_hekim, KONSULTASYON_SINIRLARI.hedefHekim)
  const satirlar = [
    `${gun}Konsültasyon yanıtı — ${hedefEtiketi(s)} (hekim ekledi)`,
    soru ? `- Soru (${istem}): ${soru}` : `- İstem: ${istem}`,
    `- Yanıt (${trGun(s.yanit_tarihi)}${kim ? `, ${tcMaskele(kim)}` : ''}): ${ozet}`,
  ]
  if (belgeAdi) satirlar.push(`- Rapor: Kasa'da — ${tcMaskele(temiz(belgeAdi, 120))}`)
  return satirlar.join('\n')
}

/* ───────────────────────── Sağlığım (hasta portalı) ───────────────────────── */

/**
 * Hastaya görünen yönlendirme satırı — KLİNİK İÇERİK YOK: klinik soru (hekimler arası teknik metin), tanılar,
 * mevcut durum, yanıt özeti, rapor ve konsültan hekim adı hastaya GÖSTERİLMEZ. Yalnız branş + tarih + durum.
 * KVKK m.10 aydınlatma: hasta verisinin kimle/ne amaçla paylaşıldığını bilir.
 */
export interface PortalYonlendirme {
  id: string
  /** "Kulak Burun Boğaz" gibi branş adı */
  brans: string
  /** İstem tarihi (YYYY-AA-GG) */
  tarih: string
  durum: 'bekliyor' | 'sonuc_alindi' | 'kapandi'
  /** Sonuç alındıysa yanıt tarihi */
  sonucTarihi: string | null
}

/**
 * Yalnız KONSULTASYON-01 akışıyla açılmış kayıtlar (hedef_brans dolu) hastaya gösterilir. Eski dahiliye/göz/KD
 * satırlarının bir kısmı hesaplayıcıların kendiliğinden açtığı önerilerdir (ör. FIB-4 → gastroenteroloji);
 * hekim onları "yönlendirme" olarak hastaya bildirmedi — geriye dönük portal görünürlüğü açılmaz.
 */
export function portalYonlendirmeleri(satirlar: ReadonlyArray<Partial<KonsultasyonSatiri>>): PortalYonlendirme[] {
  return satirlar
    .filter((s) => !!s.id && hedefBransGecerli(s.hedef_brans))
    .map((s) => {
      const g = durumGrubu(s.durum)
      return {
        id: String(s.id),
        brans: SPECIALTY_MAP[String(s.hedef_brans)].label,
        tarih: (s.istem_tarihi && isoGunMu(s.istem_tarihi) ? s.istem_tarihi : String(s.created_at || '').slice(0, 10)),
        durum: g === 'yanitlandi' ? 'sonuc_alindi' as const : g === 'kapandi' ? 'kapandi' as const : 'bekliyor' as const,
        sonucTarihi: g === 'yanitlandi' && isoGunMu(s.yanit_tarihi) ? String(s.yanit_tarihi) : null,
      }
    })
    .sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
    .slice(0, 20)
}

/** Harf adları (kısaltmalar harf harf okunur: "KBB" = ka-be-be) — hepsi ünlüyle biter. */
const HARF_ADI: Record<string, string> = {
  A: 'a', B: 'be', C: 'ce', Ç: 'çe', D: 'de', E: 'e', F: 'fe', G: 'ge', Ğ: 'ge', H: 'he', I: 'ı', İ: 'i', J: 'je', K: 'ka',
  L: 'le', M: 'me', N: 'ne', O: 'o', Ö: 'ö', P: 'pe', R: 're', S: 'se', Ş: 'şe', T: 'te', U: 'u', Ü: 'ü', V: 've', Y: 'ye', Z: 'ze',
}

/**
 * Branş adına yönelme eki, kesme işaretiyle: "KBB'ye", "Pediatri'ye", "Acil Tıp'a", "Göz Hastalıkları'na",
 * "Çocuk Cerrahisi'ne", "Aile Hekimliği'ne". Kısaltma son harfin adıyla okunur; iyelik ekli tamlamanın
 * (…ları / …si / …ği) ardından kaynaştırma "n" gelir.
 */
export function yonelmeEki(ad: string): string {
  const s = String(ad || '').trim()
  if (!s) return s
  const sozcukler = s.split(/\s+/)
  const son = sozcukler[sozcukler.length - 1]
  const kisaltma = /^[A-ZÇĞİÖŞÜ]{2,6}$/.test(son)
  const okunus = kisaltma ? (HARF_ADI[son[son.length - 1]] || 'e') : son.toLocaleLowerCase('tr-TR')
  const unluler = [...okunus].filter((c) => 'aeıioöuü'.includes(c))
  const sonUnlu = unluler[unluler.length - 1] || 'e'
  const kalin = 'aıou'.includes(sonUnlu)
  const unluyleBiter = 'aeıioöuü'.includes(okunus[okunus.length - 1])
  const iyelikli = !kisaltma && sozcukler.length > 1 && /(ları|leri|sı|si|su|sü|ğı|ği|ğu|ğü)$/.test(okunus)
  const kaynastirma = unluyleBiter ? (iyelikli ? 'n' : 'y') : ''
  return `${s}'${kaynastirma}${kalin ? 'a' : 'e'}`
}

/** Portal satırının tek cümlesi: "Kulak Burun Boğaz'a yönlendirildiniz (12.09.2026) · Sonuç alındı (18.09.2026)". */
export function portalYonlendirmeMetni(y: PortalYonlendirme): string {
  const bas = `${yonelmeEki(y.brans)} yönlendirildiniz (${trGun(y.tarih)})`
  if (y.durum === 'sonuc_alindi') return `${bas} · Sonuç alındı${y.sonucTarihi ? ` (${trGun(y.sonucTarihi)})` : ''}`
  if (y.durum === 'kapandi') return `${bas} · Takip kapatıldı`
  return `${bas} · Sonuç bekleniyor`
}

/** "Hatırlat" düğmesinin hastaya gönderdiği Sağlığım mesajı — klinik soru / tanı içermez. */
export const KONSULTASYON_HATIRLATMA_KONU = 'Konsültasyon sonucu hatırlatması'
export function konsultasyonHatirlatmaMesaji(bransAdi: string): { konu: string; metin: string } {
  return {
    konu: KONSULTASYON_HATIRLATMA_KONU,
    metin: `Merhaba, doktorunuz ${yonelmeEki(bransAdi)} yönlendirildiğiniz görüşmenin sonucunu merak ediyor. Görüşme yapıldıysa konsültan hekimin raporunu bir sonraki kontrolünüzde getirmenizi ya da muayenehanemize iletmenizi rica ederiz. Henüz randevu almadıysanız bu mesaj bir hatırlatmadır.`,
  }
}

/** Hatırlatma sıklık sınırı — aynı konsültasyon için 7 günde bir. */
export const HATIRLATMA_ARALIGI_GUN = 7

/* ───────────────────────── Kohort satırı · yanıt süresi (SKS) ───────────────────────── */

/**
 * SKS: konsültasyon istem → yanıt süresi kalite göstergesidir. Hekimin yanıtlanmış konsültasyonlarından
 * (istem ve yanıt tarihi olan) gün cinsinden medyan ve en uzun süre. Sayı klinik eşik DEĞİLDİR — yalnız ölçüm.
 */
export function yanitSuresiOzeti(satirlar: ReadonlyArray<Pick<KonsultasyonSatiri, 'durum' | 'istem_tarihi' | 'created_at' | 'yanit_tarihi'>>): { adet: number; medyanGun: number | null; enUzunGun: number | null } {
  const gunler = satirlar
    .filter((s) => durumGrubu(s.durum) === 'yanitlandi' && isoGunMu(s.yanit_tarihi))
    .map((s) => beklemeGunu(s, String(s.yanit_tarihi)))
    .sort((a, b) => a - b)
  if (!gunler.length) return { adet: 0, medyanGun: null, enUzunGun: null }
  const o = Math.floor(gunler.length / 2)
  const medyan = gunler.length % 2 ? gunler[o] : Math.round((gunler[o - 1] + gunler[o]) / 2)
  return { adet: gunler.length, medyanGun: medyan, enUzunGun: gunler[gunler.length - 1] }
}
