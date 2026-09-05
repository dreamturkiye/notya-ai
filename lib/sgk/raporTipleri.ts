/**
 * SGK / Medula and private-practice report catalog for Notya draft generator.
 * Sources: SGK e-Rapor (ilaç), Medula İş Göremezlik (e-İstirahat), tıbbi malzeme
 * e-rapor web servisleri, Sağlık Bakanlığı Diploma Tescil No practice.
 *
 * This is a Medula data-entry DRAFT — not a live Medula submission.
 */

export type RaporKanal = 'sgk_medula' | 'ozel_muayenehane'

export type RaporTipiId =
  | 'is_goremezlik'
  | 'ilac_kullanim'
  | 'tibbi_malzeme'
  | 'tek_hekim_durum'
  | 'saglik_kurulu'
  | 'muayenehane_istirahat'

export type SureBirimi = 'gun' | 'ay'

export type RaporTipiMeta = {
  id: RaporTipiId
  label: string
  kanal: RaporKanal
  /** Short hint under the radio */
  aciklama: string
  sureBirimi: SureBirimi
  sureMin: number
  sureMax: number
  sureVarsayilan: number
  /** Fields the printed draft must show */
  bolumler: Array<
    | 'hasta'
    | 'rapor_meta'
    | 'tani'
    | 'gerekce'
    | 'klinik'
    | 'sure'
    | 'etken'
    | 'malzeme'
    | 'tetkik'
    | 'hekim'
    | 'medula_not'
    | 'ozel_uyari'
  >
}

/** Canonical list shown in SGK Rapor Oluştur (order = UI order). */
export const RAPOR_TIPLERI: RaporTipiMeta[] = [
  {
    id: 'is_goremezlik',
    label: 'İş Göremezlik (e-İstirahat) Raporu',
    kanal: 'sgk_medula',
    aciklama: 'Medula İş Göremezlik — geçici iş göremezlik / istirahat. Rapor No Medula atar.',
    sureBirimi: 'gun',
    sureMin: 1,
    sureMax: 40,
    sureVarsayilan: 3,
    bolumler: ['hasta', 'rapor_meta', 'tani', 'gerekce', 'klinik', 'sure', 'hekim', 'medula_not'],
  },
  {
    id: 'ilac_kullanim',
    label: 'İlaç Kullanım Raporu',
    kanal: 'sgk_medula',
    aciklama: 'Medula e-Rapor — SUT’a göre etken madde + ICD-10. Kâğıt nüsha SGK’da geçerli değildir (e-imza zorunlu).',
    sureBirimi: 'ay',
    sureMin: 1,
    sureMax: 24,
    sureVarsayilan: 6,
    bolumler: ['hasta', 'rapor_meta', 'tani', 'klinik', 'sure', 'etken', 'tetkik', 'hekim', 'medula_not'],
  },
  {
    id: 'tibbi_malzeme',
    label: 'Tıbbi Malzeme Kullanım Raporu',
    kanal: 'sgk_medula',
    aciklama: 'Medula e-Rapor — ayaktan tıbbi malzeme. SUT kodu Medula listesinden seçilir.',
    sureBirimi: 'ay',
    sureMin: 1,
    sureMax: 24,
    sureVarsayilan: 12,
    bolumler: ['hasta', 'rapor_meta', 'tani', 'klinik', 'sure', 'malzeme', 'tetkik', 'hekim', 'medula_not'],
  },
  {
    id: 'tek_hekim_durum',
    label: 'Tek Hekim Durum Bildirir Sağlık Raporu',
    kanal: 'sgk_medula',
    aciklama: 'Tek hekim durum bildirir taslak (Medula düzenleme türü: tek hekim). Kuruma göre ek alan gerekebilir.',
    sureBirimi: 'ay',
    sureMin: 1,
    sureMax: 12,
    sureVarsayilan: 3,
    bolumler: ['hasta', 'rapor_meta', 'tani', 'klinik', 'sure', 'hekim', 'medula_not'],
  },
  {
    id: 'saglik_kurulu',
    label: 'Sağlık Kurulu (Heyet) Raporu',
    kanal: 'sgk_medula',
    aciklama: 'Çok hekimli heyet raporu. Solo muayenehanede nadiren; taslak yalnızca klinik metin üretir — heyet onayı Medula’da.',
    sureBirimi: 'ay',
    sureMin: 1,
    sureMax: 24,
    sureVarsayilan: 12,
    bolumler: ['hasta', 'rapor_meta', 'tani', 'klinik', 'sure', 'tetkik', 'hekim', 'medula_not'],
  },
  {
    id: 'muayenehane_istirahat',
    label: 'Muayenehane İstirahat Belgesi (özel hasta / işveren)',
    kanal: 'ozel_muayenehane',
    aciklama:
      'SGK Medula değildir. Özel hastaya / işverene verilen klinik istirahat belgesi. Geçici iş göremezlik ödeneği için SGK e-İstirahat gerekir.',
    sureBirimi: 'gun',
    sureMin: 1,
    sureMax: 30,
    sureVarsayilan: 3,
    bolumler: ['hasta', 'rapor_meta', 'tani', 'gerekce', 'klinik', 'sure', 'hekim', 'ozel_uyari'],
  },
]

export function raporTipiById(id: string): RaporTipiMeta | undefined {
  return RAPOR_TIPLERI.find((t) => t.id === id)
}

export function raporTipiByLabel(label: string): RaporTipiMeta | undefined {
  return RAPOR_TIPLERI.find((t) => t.label === label)
}

/** Resolve legacy UI labels or ids. */
export function resolveRaporTipi(raw: string): RaporTipiMeta {
  const byId = raporTipiById(raw)
  if (byId) return byId
  const byLabel = raporTipiByLabel(raw)
  if (byLabel) return byLabel
  // Legacy strings from older UI
  if (/iş göremezlik|istirahat/i.test(raw) && !/muayenehane/i.test(raw)) {
    return RAPOR_TIPLERI[0]
  }
  if (/ilaç/i.test(raw)) return RAPOR_TIPLERI[1]
  if (/malzeme/i.test(raw)) return RAPOR_TIPLERI[2]
  if (/heyet|kurulu/i.test(raw)) return RAPOR_TIPLERI[4]
  if (/muayenehane|özel/i.test(raw)) return RAPOR_TIPLERI[5]
  return RAPOR_TIPLERI[0]
}

export type RaporTani = { icd10: string; aciklama: string }

export type SgkRaporDraft = {
  raporBasligi: string
  raporTuru?: 'Ilk' | 'Devam' | 'Kontrol' | string
  hastaAdi: string
  tcSon4: string
  tani: RaporTani
  anamnez?: string
  mevcutDurum?: string
  /** İş göremezlik gerekçesi / klinik gerekçe */
  isGoremezlikGerekcesi?: string
  hekim_degerlendirmesi?: string
  hekim_notu?: string
  /** İlaç kullanım — ay */
  onerilen_sure_ay?: number
  /** İstirahat — gün */
  istirahat_suresi_gun?: number
  baslangicTarihi?: string
  bitisTarihi?: string
  etkenMaddeler?: string[]
  malzemeOnerileri?: string[]
  zorunluTetkikler?: string[]
}

export type HekimKimlik = {
  adSoyad: string
  uzmanlik: string
  diplomaTescilNo: string
  saglikKurumu: string
  tesisKodu: string
  medulaBagli: boolean
}

export function addDaysTr(isoOrToday: Date, days: number): string {
  const d = new Date(isoOrToday)
  d.setDate(d.getDate() + Math.max(0, days - 1))
  return d.toLocaleDateString('tr-TR')
}

export function llmJsonSchemaHint(tip: RaporTipiMeta): string {
  const base =
    '{raporBasligi,tani:{icd10,aciklama},hekim_degerlendirmesi,anamnez,mevcutDurum'
  if (tip.id === 'is_goremezlik' || tip.id === 'muayenehane_istirahat') {
    return `${base},isGoremezlikGerekcesi,istirahat_suresi_gun:number,raporTuru:"Ilk"|"Devam"|"Kontrol"}`
  }
  if (tip.id === 'ilac_kullanim') {
    return `${base},onerilen_sure_ay:number,etkenMaddeler:[],zorunluTetkikler:[]}`
  }
  if (tip.id === 'tibbi_malzeme') {
    return `${base},onerilen_sure_ay:number,malzemeOnerileri:[],zorunluTetkikler:[]}`
  }
  return `${base},onerilen_sure_ay:number,zorunluTetkikler:[]}`
}

export function systemPromptFor(tip: RaporTipiMeta): string {
  const common =
    'Türkiye klinik rapor taslağı üreten asistansın. ICD-10 kullan. Hasta adı, T.C., hekim kimliği ve hekim notu SENİN alanın değildir. SADECE geçerli JSON döndür. '

  switch (tip.id) {
    case 'is_goremezlik':
      return (
        common +
        'Bu bir SGK Medula e-İstirahat (İş Göremezlik) taslağıdır. "çalışma kapasitesi" alanı YOKTUR. ' +
        'İş göremezlik gerekçesini, tanı ve önerilen istirahat gününü yaz. raporTuru: Ilk|Devam|Kontrol. ' +
        `JSON şema: ${llmJsonSchemaHint(tip)}`
      )
    case 'ilac_kullanim':
      return (
        common +
        'Bu bir SGK Medula ilaç kullanım e-Raporu taslağıdır. Etken maddeleri INN (Türkçe yazım) ile yaz; SUT süresi en fazla 24 ay. ' +
        `JSON şema: ${llmJsonSchemaHint(tip)}`
      )
    case 'tibbi_malzeme':
      return (
        common +
        'Bu bir SGK Medula tıbbi malzeme e-Raporu taslağıdır. malzemeOnerileri kısa klinik/SUT uyumlu öneriler olsun (SUT kodunu uydurma). ' +
        `JSON şema: ${llmJsonSchemaHint(tip)}`
      )
    case 'tek_hekim_durum':
      return (
        common +
        'Tek hekim durum bildirir sağlık raporu taslağıdır. Mevcut klinik durumu ve gerekçeyi yaz. ' +
        `JSON şema: ${llmJsonSchemaHint(tip)}`
      )
    case 'saglik_kurulu':
      return (
        common +
        'Sağlık kurulu (heyet) raporu için TEK hekim klinik taslağıdır; heyet üyelerini uydurma. ' +
        `JSON şema: ${llmJsonSchemaHint(tip)}`
      )
    case 'muayenehane_istirahat':
      return (
        common +
        'Özel muayenehane istirahat BELGESİ taslağıdır (SGK Medula değil). İşverene sunulabilir klinik belge metni üret. ' +
        `JSON şema: ${llmJsonSchemaHint(tip)}`
      )
    default:
      return common + `JSON şema: ${llmJsonSchemaHint(tip)}`
  }
}
