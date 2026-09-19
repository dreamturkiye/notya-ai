/**
 * KBB-EXCEPTIONAL-01 — İşitme cihazı / KBB rapor taslağı + SUT kontrol listesi. SAF fonksiyon.
 *
 * KURALLAR (psikiyatri / dahiliye sgkRapor deseni):
 *  - T.C. kimlik numarası hiçbir taslağa yazılmaz (alan yoktur).
 *  - Tanı / ICD-10 satırını HEKİM seçer; motor tanı önermez.
 *  - Odyolojik değerler yalnız kayıtlı kbb_odyometri satırlarından gelir; Notya eşik veya PTA uydurmaz.
 *  - SUT ve medikal malzeme koşulları KONTROL LİSTESİDİR; güncel madde metnini hekim doğrular.
 *  - Rapor hekim kilitleyene kadar TASLAKTIR; Medula girişi ve e-imza hekimin (canlı gönderim yok).
 *  - Cihaz markası / modeli / bedeli yazılmaz — ürün seçimi ve fiyat bu ürünün işi değildir.
 */
import type { Dipnot } from './kbb'
import { ODYO_BANT_AD, ptaBandi, type OdyoBant } from './odyometri'

export type KbbRaporSablon = 'isitme_cihazi' | 'odyolojik_tetkik' | 'is_gucu_isitme' | 'ogrenci_isitme' | 'osas_sevk'

export const KBB_RAPOR_SABLONLARI: Array<{ id: KbbRaporSablon; ad: string }> = [
  { id: 'isitme_cihazi', ad: 'İşitme cihazı raporu' },
  { id: 'odyolojik_tetkik', ad: 'Odyolojik tetkik / ileri değerlendirme raporu' },
  { id: 'is_gucu_isitme', ad: 'İşitme ile ilgili durum bildirir rapor (kurum talebi)' },
  { id: 'ogrenci_isitme', ad: 'Öğrenci / eğitim ortamı işitme bilgi notu' },
  { id: 'osas_sevk', ad: 'Uyku tetkiki (OSAS) sevk ve bilgi notu' },
]

/** Şablon başına kontrol listesi — "tamam" kararı hekimin (null = hekim işaretlemedi). */
const KONTROL_LISTESI: Record<KbbRaporSablon, readonly string[]> = {
  isitme_cihazi: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Güncel odyolojik değerlendirme (saf ses + konuşma odyometrisi) kayıtlı ve tarihli',
    'Raporu düzenleyen hekimin uzmanlık alanı ve rapor türü SUT koşuluna uygun (güncel metin teyit edildi)',
    'İki kulak ayrı ayrı değerlendirildi; tek taraflı kayıpta gerekçe yazıldı',
    'Cihaz kullanım eğitimi ve uyum takibi planı yazıldı',
    'Yenileme talebiyse önceki cihazın süresi ve gerekçesi belirtildi',
  ],
  odyolojik_tetkik: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'İstenen tetkikler tek tek yazıldı (timpanometri, ABR, OAE, VNG… — hekim seçimi)',
    'Önceki odyolojik kayıtlar ve tarihleri rapora işlendi',
    'Asimetrik / tek taraflı bulguda ileri değerlendirme gerekçesi yazıldı',
    'Sonuç değerlendirme randevusu planlandı',
  ],
  is_gucu_isitme: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Kurumun istediği rapor türü ve formatı teyit edildi',
    'Odyolojik ölçüm tarihi rapor tarihine uygun (güncellik koşulu)',
    'Gürültülü ortam / mesleki maruziyet öyküsü kaydedildi',
    'Değerlendirme yalnız kayıtlı ölçümlere dayanıyor; yorum hekimin imzasıyla',
  ],
  ogrenci_isitme: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Güncel odyolojik ölçüm kayıtlı',
    'Sınıf içi oturma düzeni / FM sistemi gibi öneriler hekim tarafından yazıldı',
    'Aile / yasal temsilci bilgilendirmesi yapıldı (18 yaş altı hastada)',
    'Kontrol ölçüm tarihi belirlendi',
  ],
  osas_sevk: [
    'Endikasyon ve tanı hekim tarafından belirlendi (ICD-10 seçildi)',
    'Horlama, tanıklı apne ve gündüz uykululuk öyküsü kaydedildi',
    'Üst hava yolu muayene bulguları yazıldı',
    'Sevk edilecek merkez / tetkik türü hekim tarafından belirtildi',
    'Sonuç sonrası kontrol randevusu planlandı',
  ],
}

/** Kayıtlı odyometri satırı — motor yalnız OKUR. */
export interface KbbRaporOdyo { tarih: string; yan: 'sag' | 'sol' | 'iki'; pta: number | null; tip: string | null }

/** Taslak alanları — DOZ, T.C. ve CİHAZ MARKASI ALANI YOKTUR. */
export interface KbbRaporDraft {
  sablon: KbbRaporSablon
  sablonAd: string
  /** hasta adı rapor çıktısında hekim tarafından doldurulur; kimlik numarası hiç taşınmaz */
  hastaAdi: string
  tcSon4: ''
  /** hekim seçer — motor tanı önermez */
  tani: { icd10: string; aciklama: string } | null
  /** yalnız kayıtlı odyometri satırlarından; boşsa eksik listesine düşer */
  odyolojikOzet: Array<{ tarih: string; yan: string; pta: number | null; bant: string; tip: string }>
  sureAy: number
  hekimDegerlendirmesi: string
  izlemPlani: string[]
  duzenlemeTarihi: string
}

export interface KbbRaporSonuc {
  draft: KbbRaporDraft
  kontrolListesi: Array<{ madde: string; tamam: boolean | null }>
  eksikler: string[]
  dipnotlar: Dipnot[]
}

export interface KbbRaporGirdi {
  sablon: KbbRaporSablon
  hastaAdi: string
  odyometriler: KbbRaporOdyo[]
  tani?: { icd10: string; aciklama: string } | null
  sureAy?: number
  hekimDegerlendirmesi?: string
  izlemPlani?: string[]
  /** hekimin işaretlediği kontrol maddeleri (index → true/false) */
  isaretli?: Record<number, boolean>
  bugun: string
}

const YAN_METIN: Record<string, string> = { sag: 'Sağ kulak', sol: 'Sol kulak', iki: 'İki kulak' }

/** Odyolojik kayıt "güncel" sayılma penceresi (gün) — koşulun kendisi hekim teyidindedir. */
export const ODYO_GUNCELLIK_GUN = 365

export function kbbRaporTaslagi(g: KbbRaporGirdi): KbbRaporSonuc {
  const sablonAd = KBB_RAPOR_SABLONLARI.find((s) => s.id === g.sablon)?.ad || 'KBB raporu'
  const sureAy = g.sureAy && g.sureAy > 0 ? Math.min(Math.round(g.sureAy), 24) : 12

  const odyolar = (g.odyometriler || [])
    .filter((o) => o && typeof o.tarih === 'string')
    .sort((a, b) => b.tarih.localeCompare(a.tarih))
    .slice(0, 6)
  const odyolojikOzet = odyolar.map((o) => ({
    tarih: o.tarih,
    yan: YAN_METIN[o.yan] || o.yan,
    pta: o.pta,
    bant: ptaBandi(o.pta).ad,
    tip: o.tip || 'Tip belirlenmedi (hekim)',
  }))

  const kontrolListesi = KONTROL_LISTESI[g.sablon].map((madde, i) => ({
    madde,
    tamam: g.isaretli && i in g.isaretli ? !!g.isaretli[i] : null,
  }))

  const odyoGerekli = g.sablon !== 'osas_sevk'
  const eksikler: string[] = []
  if (!g.tani) eksikler.push('TANI / ICD-10 hekim tarafından seçilmedi — rapor kilitlenemez')
  if (odyoGerekli && !odyolojikOzet.length) eksikler.push('Kayıtlı odyometri yok — odyolojik değerlendirmeyi girin (Notya eşik uydurmaz)')
  if (odyoGerekli && odyolojikOzet.length && odyolojikOzet.every((o) => o.pta == null)) {
    eksikler.push('Kayıtlı odyometri satırlarında PTA değeri yok — sayısal ölçüm girilmeden rapor kilitlenmez')
  }
  const enYeni = odyolojikOzet[0]?.tarih
  if (odyoGerekli && enYeni) {
    const fark = Math.round((Date.parse(`${g.bugun}T12:00:00Z`) - Date.parse(`${enYeni}T12:00:00Z`)) / 86400000)
    if (fark > ODYO_GUNCELLIK_GUN) eksikler.push(`En güncel odyometri ${fark} gün önce — güncellik koşulunu hekim teyit etmeli veya ölçümü yenileyin`)
  }
  if (!String(g.hekimDegerlendirmesi || '').trim()) eksikler.push('Hekim değerlendirmesi boş')
  for (const k of kontrolListesi) if (k.tamam !== true) eksikler.push(`Kontrol maddesi işaretlenmedi: ${k.madde}`)

  return {
    draft: {
      sablon: g.sablon,
      sablonAd,
      hastaAdi: g.hastaAdi || '',
      tcSon4: '',
      tani: g.tani || null,
      odyolojikOzet,
      sureAy,
      hekimDegerlendirmesi: String(g.hekimDegerlendirmesi || '').slice(0, 3000),
      izlemPlani: (g.izlemPlani || []).map((x) => String(x).slice(0, 300)).slice(0, 10),
      duzenlemeTarihi: g.bugun,
    },
    kontrolListesi,
    eksikler,
    dipnotlar: [
      { ref: 'SGK_SUT', not: 'Rapor koşulları SUT’tan kontrol listesi olarak alınmıştır; güncel madde metnini hekim doğrular.' },
      { ref: 'ISITME_CIHAZI_MEVZUAT', not: 'İşitme cihazı temin koşulları, süre ve yenileme kuralları SGK medikal malzeme mevzuatındadır; cihaz markası ve bedeli bu çıktıda yer almaz.' },
      { ref: 'ODYOLOJI_SINIFLAMA', not: 'PTA bandı karar desteğidir; kayıp tipi ve tanı hekimin değerlendirmesidir.' },
    ],
  }
}

/** Rapor kilidi: eksik varsa hekim kilitleyemez (route 409). */
export function kilitlenebilirMi(sonuc: KbbRaporSonuc): boolean {
  return sonuc.eksikler.length === 0
}

/** Şerit / özet için tek satır — bant adı tanı değildir. */
export function raporBantOzeti(bant: OdyoBant | null): string {
  return bant ? ODYO_BANT_AD[bant] : 'Odyolojik bant yok'
}
