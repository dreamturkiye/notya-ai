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

/**
 * Uzunluk tavanları — sunucu ve istemci aynı sınırı uygular. klinikSoru 4000: AYSE-KONSULTASYON-01'de istem metni
 * meslektaşa yazılan mektup biçimidir ("Sayın Meslektaşım, … Saygılarımla,") — 1000 karakter yetmiyordu.
 */
export const KONSULTASYON_SINIRLARI = { klinikSoru: 4000, hedefHekim: 120, not: 1000, tanilar: 500, mevcutDurum: 1000, yanitOzeti: 1000 } as const
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

/**
 * Mektup biçimli istemin ÖZÜ (not bloğu, bekleyen listesi): "Sayın Meslektaşım," ve "Saygılarımla, …" atılır; mektupsa
 * son paragraf (net talep — "… konsültasyonunuzu rica ederim.") döner. Mektup değilse metnin kendisi.
 */
export function istemOzu(metin: string | null | undefined): string {
  const s = String(metin || '').replace(/\r\n?/g, '\n').trim()
  if (!/^Sayın\s+Meslektaşım/i.test(s)) return s
  let govde = s.replace(/^Sayın\s+Meslektaşım[^\n]*\n*/i, '')
  const k = govde.search(/\n\s*Saygılarımla\b/i)
  if (k >= 0) govde = govde.slice(0, k)
  const paragraflar = govde.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return paragraflar[paragraflar.length - 1] || govde.trim()
}

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

export type KonsultasyonIslemi = 'yanit' | 'belge_bagla' | 'kapat' | 'nota_ekle' | 'hatirlat' | 'duzenle' | 'sil'

/** İstem KİLİDİ (AYSE-KONSULTASYON-01): yanıt gelmiş kayıtta istem metni değişmez — yalnız yanıt tarafı işlenir. */
export const ISTEM_KILITLI_YANITLANDI = 'Yanıtlanmış konsültasyonun istemi kilitlidir — yalnız yanıt özeti düzeltilebilir.'
export const ISTEM_KILITLI_KAPANDI = 'Kapatılmış konsültasyonun istemi düzenlenemez.'

/**
 * Durum geçiş kuralı (PATCH). Kapanmış (yanıtsız) bir konsültasyona geç gelen rapor YİNE eklenebilir;
 * yanıtlanmış kayıtta yanıt düzeltilebilir. Yanıtlanmış kayıt "yanıtsız" kapatılamaz.
 * İstem ('duzenle') yalnız yanıt beklerken ('acik' / 'yanit_bekleniyor') düzenlenir; yanıt geldikten sonra KİLİTLİ.
 * Silme yalnız yanıtsız kapatılmış kayıtlar için (hekim hatalı/boş istemi dosyadan kaldırmak ister).
 */
export function gecisIzinli(durum: string, islem: KonsultasyonIslemi): { ok: true } | { ok: false; hata: string } {
  const g = durumGrubu(durum)
  switch (islem) {
    case 'duzenle':
      return g === 'bekliyor' ? { ok: true } : { ok: false, hata: g === 'yanitlandi' ? ISTEM_KILITLI_YANITLANDI : ISTEM_KILITLI_KAPANDI }
    case 'yanit':
    case 'belge_bagla':
      return { ok: true }
    case 'kapat':
      return g === 'bekliyor' ? { ok: true } : { ok: false, hata: g === 'yanitlandi' ? 'Yanıtlanmış konsültasyon yanıtsız kapatılamaz.' : 'Bu konsültasyon zaten kapatılmış.' }
    case 'nota_ekle':
      return g === 'yanitlandi' ? { ok: true } : { ok: false, hata: 'Önce yanıt özetini ekleyin — nota eklenecek yanıt yok.' }
    case 'hatirlat':
      return g === 'bekliyor' ? { ok: true } : { ok: false, hata: 'Yalnız yanıt bekleyen konsültasyon için hatırlatma gönderilir.' }
    case 'sil':
      return g === 'kapandi'
        ? { ok: true }
        : { ok: false, hata: g === 'yanitlandi' ? 'Yanıtlanmış konsültasyon silinemez — kayıt kanıt olarak kalır.' : 'Yalnız yanıtsız kapatılmış konsültasyon silinebilir.' }
  }
}

/* ───────────────────────── İstem düzenleme + düzenleme izi (AYSE-KONSULTASYON-01) ───────────────────────── */

/**
 * Dr. Gökhan Mamur (canlı): "Oluştur'a bastım… doktor değişiklik yapmak istiyorsa yapamıyor." İstem yanıt beklerken
 * düzenlenir; her değişen alanın ÖNCEKİ metni `konsultasyon_revizyonlar`'a yazılır (sessiz üzerine yazma yok).
 * Hedef branş değişmez — başka branştan görüş yeni bir istemdir.
 */
export const ISTEM_DUZENLENEBILIR_ALANLAR = ['klinik_soru', 'aciliyet', 'hedef_hekim', 'tanilar', 'mevcut_durum', 'not_metni'] as const
export type IstemAlani = (typeof ISTEM_DUZENLENEBILIR_ALANLAR)[number]
export type RevizyonAlani = IstemAlani | 'yanit_ozeti'

export const REVIZYON_ALAN_ETIKETI: Record<RevizyonAlani, string> = {
  klinik_soru: 'İstem metni',
  aciliyet: 'Aciliyet',
  hedef_hekim: 'Konsültan hekim',
  tanilar: 'Tanılar',
  mevcut_durum: 'Mevcut durum',
  not_metni: 'Ek not',
  yanit_ozeti: 'Yanıt özeti',
}

/** Tek değişiklik — önceki ve sonraki değer (boş = null). */
export interface Revizyon { alan: RevizyonAlani; onceki: string | null; sonraki: string | null }

/** GET'in döndürdüğü düzenleme izi satırı. */
export interface KonsultasyonRevizyonu extends Revizyon { id: string; created_at: string }

/** Revizyon satırları (GET). */
export const REVIZYON_KOLONLARI = 'id, sevk_id, alan, onceki, sonraki, created_at'

/**
 * PATCH 'duzenle' gövdesi → yalnız DEĞİŞEN alanlar. Gövdede olmayan alan dokunulmaz; boş string alanı temizler
 * (klinik soru hariç — o zorunlu). Hiçbir alan değişmediyse hata (boş revizyon yazılmaz).
 */
export function duzenlemeDogrula(
  b: Record<string, unknown> | null | undefined,
  s: Pick<KonsultasyonSatiri, IstemAlani>,
): { hata: string } | { guncelleme: Partial<Record<IstemAlani, string | null>>; revizyonlar: Revizyon[] } {
  const var_ = (...k: string[]) => k.some((x) => b != null && Object.prototype.hasOwnProperty.call(b, x))
  const al = (...k: string[]) => { for (const x of k) if (b != null && Object.prototype.hasOwnProperty.call(b, x)) return b[x]; return undefined }
  const yeni: Partial<Record<IstemAlani, string | null>> = {}
  const bosNull = (x: string) => (x ? x : null)

  if (var_('klinikSoru', 'klinik_soru')) {
    const soru = cokSatir(al('klinikSoru', 'klinik_soru'), KONSULTASYON_SINIRLARI.klinikSoru)
    if (soru.length < KLINIK_SORU_EN_AZ) return { hata: `Klinik soruyu açık yazın (en az ${KLINIK_SORU_EN_AZ} karakter).` }
    yeni.klinik_soru = soru
  }
  if (var_('aciliyet')) {
    const a = String(al('aciliyet') ?? '')
    if (!(ACILIYETLER as readonly string[]).includes(a)) return { hata: 'Aciliyet geçersiz (rutin, öncelikli, acil).' }
    yeni.aciliyet = a
  }
  if (var_('hedefHekim', 'hedef_hekim')) yeni.hedef_hekim = bosNull(temiz(al('hedefHekim', 'hedef_hekim'), KONSULTASYON_SINIRLARI.hedefHekim))
  if (var_('tanilar')) yeni.tanilar = bosNull(cokSatir(al('tanilar'), KONSULTASYON_SINIRLARI.tanilar))
  if (var_('mevcutDurum', 'mevcut_durum')) yeni.mevcut_durum = bosNull(cokSatir(al('mevcutDurum', 'mevcut_durum'), KONSULTASYON_SINIRLARI.mevcutDurum))
  if (var_('not', 'not_metni')) yeni.not_metni = bosNull(cokSatir(al('not', 'not_metni'), KONSULTASYON_SINIRLARI.not))

  const guncelleme: Partial<Record<IstemAlani, string | null>> = {}
  const revizyonlar: Revizyon[] = []
  for (const alan of ISTEM_DUZENLENEBILIR_ALANLAR) {
    if (!(alan in yeni)) continue
    const onceki = s[alan] == null || s[alan] === '' ? null : String(s[alan])
    const sonraki = yeni[alan] ?? null
    if (onceki === sonraki) continue
    guncelleme[alan] = sonraki
    revizyonlar.push({ alan, onceki, sonraki })
  }
  if (!revizyonlar.length) return { hata: 'Değişiklik yok.' }
  return { guncelleme, revizyonlar }
}

/** Yanıt özeti düzeltmesi: önceki özet varsa ve değiştiyse izi. İlk yanıt (önceki boş) iz değil, kaydın kendisidir. */
export function yanitRevizyonu(onceki: string | null | undefined, sonraki: string): Revizyon | null {
  const o = onceki == null || onceki === '' ? null : String(onceki)
  if (o == null || o === sonraki) return null
  return { alan: 'yanit_ozeti', onceki: o, sonraki }
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
  const soru = tcMaskele(temiz(istemOzu(s.klinik_soru) || s.not_metni, 300))
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

/* ───────────────────────── Bekleyen konsültasyonlar · TEK kaynak ───────────────────────── */

/**
 * KONSULTASYON-02 (Kaan 2026-09-19) — "yanıt bekleyen" listesinin TEK tanımı. Üç yüzey aynı fonksiyonu kullanır,
 * böylece aynı veriyi farklı göstermezler:
 *   • Araçlar › Bekleyen Konsültasyonlar (evrensel, 30 branş) — components/doktor/araclar/BekleyenKonsultasyonlar.tsx
 *   • yedi kohort panelindeki satır — components/doktor/KonsultasyonKohortSatiri.tsx
 *   • doktor ana sayfası özeti (yalnız sayı) — components/doktor/BekleyenKonsultasyonOzeti.tsx
 * Sunucu: GET /api/doktor/konsultasyon?bekleyen=1 (liste) · ?bekleyen=sayi (özet).
 *
 * Bekleme vurgusu SKS'nin konsültasyon yanıt süresini izleme mantığıyla uyumlu bir TAKİP İPUCUDUR:
 * 14 gün ve üzeri dikkat, 30 gün ve üzeri kırmızı. Mevzuattan alınmış bir süre ya da klinik eşik DEĞİLDİR
 * (bkz. docs/OPEN-COMMITMENTS.md § KONSULTASYON-02).
 */
export const BEKLEME_DIKKAT_GUN = 14
export const BEKLEME_KIRMIZI_GUN = 30
export type BeklemeVurgusu = 'notr' | 'uyari' | 'kirmizi'

export function beklemeVurgusu(gun: number): BeklemeVurgusu {
  if (gun >= BEKLEME_KIRMIZI_GUN) return 'kirmizi'
  if (gun >= BEKLEME_DIKKAT_GUN) return 'uyari'
  return 'notr'
}

/** Bekleyen listesinin satırı (API yanıtı; istemci-güvenli). */
export interface BekleyenKonsultasyon {
  id: string
  patientId: string
  hastaAdi: string
  /** Hedef branşın görünen adı */
  hedef: string
  /** Hekimin kendi yazdığı klinik soru (eski kayıtta not metni) — liste için kısaltılmış */
  klinikSoru: string
  istemTarihi: string
  gun: number
  aciliyet: string | null
  eskiKayit: boolean
  sonHatirlatmaAt: string | null
}

const KLINIK_SORU_LISTE_TAVANI = 300
const ACILIYET_SIRASI: Record<string, number> = { acil: 0, oncelikli: 1 }

/**
 * Sunucu satırları → yanıt bekleyen liste. `adlar` YALNIZ oturumdaki hekimin hastalarından çözülmüş ad haritasıdır
 * (HASTA-IZOLASYON: haritada olmayan hastanın satırı — başka hekime ait kirli satır — listeden düşer).
 * Sıra: en uzun bekleyen üstte; aynı günde acil → öncelikli → rutin; sonra id (kararlı).
 */
export function bekleyenListesi(
  satirlar: ReadonlyArray<Pick<KonsultasyonSatiri, 'id' | 'patient_id' | 'hedef' | 'hedef_brans' | 'klinik_soru' | 'not_metni' | 'aciliyet' | 'istem_tarihi' | 'durum' | 'son_hatirlatma_at' | 'created_at'>>,
  adlar: ReadonlyMap<string, string>,
  bugun: string = bugunTrIso(),
): BekleyenKonsultasyon[] {
  return satirlar
    .filter((s) => (BEKLEYEN_DURUMLAR as readonly string[]).includes(s.durum) && adlar.has(s.patient_id))
    .map((s) => {
      const soru = temiz(istemOzu(s.klinik_soru) || s.not_metni, 1000)
      return {
        id: s.id,
        patientId: s.patient_id,
        hastaAdi: adlar.get(s.patient_id) || 'Hasta',
        hedef: hedefEtiketi(s),
        klinikSoru: soru.length > KLINIK_SORU_LISTE_TAVANI ? `${soru.slice(0, KLINIK_SORU_LISTE_TAVANI - 1)}…` : soru,
        istemTarihi: s.istem_tarihi && isoGunMu(s.istem_tarihi) ? s.istem_tarihi : String(s.created_at || '').slice(0, 10),
        gun: beklemeGunu(s, bugun),
        aciliyet: s.aciliyet,
        eskiKayit: !s.hedef_brans,
        sonHatirlatmaAt: s.son_hatirlatma_at || null,
      }
    })
    .sort((a, b) => (b.gun - a.gun)
      || ((ACILIYET_SIRASI[a.aciliyet || ''] ?? 2) - (ACILIYET_SIRASI[b.aciliyet || ''] ?? 2))
      || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/** Ana sayfa özeti ve araç başlığı — aynı listeden sayılır. */
export interface BekleyenOzeti { sayi: number; dikkat: number; kirmizi: number; enUzunGun: number | null }

export function bekleyenOzeti(liste: ReadonlyArray<Pick<BekleyenKonsultasyon, 'gun'>>): BekleyenOzeti {
  let dikkat = 0, kirmizi = 0, enUzun: number | null = null
  for (const b of liste) {
    const v = beklemeVurgusu(b.gun)
    if (v === 'kirmizi') kirmizi++
    else if (v === 'uyari') dikkat++
    if (enUzun == null || b.gun > enUzun) enUzun = b.gun
  }
  return { sayi: liste.length, dikkat, kirmizi, enUzunGun: enUzun }
}

/** Son hatırlatmadan bu yana sıklık sınırı dolmadıysa bir sonraki gönderilebilir gün (YYYY-AA-GG), yoksa null. */
export function hatirlatmaBeklemesi(sonHatirlatmaAt: string | null | undefined, simdi: number = Date.now()): string | null {
  const t = sonHatirlatmaAt ? Date.parse(sonHatirlatmaAt) : NaN
  if (isNaN(t)) return null
  const sonraki = t + HATIRLATMA_ARALIGI_GUN * 86400e3
  return sonraki > simdi ? bugunTrIso(sonraki) : null
}
