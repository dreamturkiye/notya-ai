/**
 * SGK / Medula and private-practice report catalog for Notya draft generator.
 * Sources: SGK e-Rapor (ilaç), Medula İş Göremezlik (e-İstirahat), tıbbi malzeme
 * e-rapor web servisleri, Sağlık Bakanlığı Diploma Tescil No practice.
 *
 * Canonical UI: /doktor-tools/sgk-rapor (branş-agnostik; pediatride Dr. Gökhan
 * ile revize — "çalışma kapasitesi" yok, e-İstirahat/e-Rapor bölümleri, yazdırılabilir
 * letterhead). This is a Medula data-entry DRAFT — not a live Medula submission.
 * e-Nabız format zarfı: lib/enabiz/paket.enabizSgkRapor (aynı draft alanları).
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

/** Canonical list shown in Hasta Raporu Oluştur (order = UI order). */
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
    // NOTYA-SUT-RAPOR-01 — "Kâğıt nüsha SGK’da geçerli değildir" is not in the text: SUT 4.1.3(2) has MEDULA users
    // issue reports electronically, and 4.1.3(8) still describes a report that was not issued electronically.
    // Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
    aciklama: 'Medula e-Rapor — SUT’a göre etken madde + ICD-10. MEDULA’yı kullanan sağlık hizmeti sunucuları raporu elektronik ortamda düzenler (SUT 4.1.3(2)).',
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

/**
 * NOTYA-SUT-RAPOR-01 — the arrangement in the text that is LONGER than the general ceiling.
 * Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 *  - SUT 4.1.3(5): "Sağlık raporları, SUT’ta yer alan özel düzenlemeler hariç olmak üzere en fazla iki yıl süre ile
 *    geçerlidir." → `sureMax: 24` on the medicine report above.
 *  - SUT 4.2.16(2)(a)-(b): the special formulas used in inborn metabolic disease, protein metabolism disorders and
 *    diseases causing malabsorption are prescribed on a "3 yıl süreli uzman hekim raporu".
 *  - SUT 4.2.16(6): "Çölyak hastalığında; … 3 yıl süreli rapor düzenlenir."
 * Hasta Raporları stopped at 24 months for these too. The doctor now says the report is one of these; only then is
 * 36 months accepted. The other paragraphs of 4.2.16 keep shorter terms (cystic fibrosis formulas: one year,
 * 4.2.16(4)) and are not covered by this option.
 */
export const UC_YILLIK_RAPOR = {
  id: 'sut-4-2-16',
  ay: 36,
  madde: 'SUT 4.2.16(2), 4.2.16(6)',
  etiket: 'SUT 4.2.16 raporu: çölyak hastalığı; doğuştan metabolik hastalık, protein metabolizması bozukluğu veya malabsorbsiyonda özel mama — 3 yıl süreli düzenlenir',
} as const

/** Shortest and longest length the draft accepts for this report type; `ozelSure` is UC_YILLIK_RAPOR.id or nothing. */
export function raporSureSiniri(tip: RaporTipiMeta, ozelSure?: string | null): { min: number; max: number; madde: string | null } {
  if (tip.id === 'ilac_kullanim') {
    return ozelSure === UC_YILLIK_RAPOR.id
      ? { min: tip.sureMin, max: UC_YILLIK_RAPOR.ay, madde: UC_YILLIK_RAPOR.madde }
      : { min: tip.sureMin, max: tip.sureMax, madde: 'SUT 4.1.3(5)' }
  }
  return { min: tip.sureMin, max: tip.sureMax, madde: tip.id === 'tibbi_malzeme' ? 'SUT 3.1.2.2(2)' : null }
}

/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — the 6 SGK/Medula + özel muayenehane draft's content,
 * flattened into ONE ordered text block for the unified PDF template's single "klinik"
 * section (lib/doktor/raporPdfSablonu.tsx). Same section order and headings the on-screen
 * draft already uses (app/doktor-tools/sgk-rapor/page.tsx `show()`); hasta/hekim blocks
 * are NOT repeated here — the unified template renders those itself from its own model.
 */
export function sgkRaporMetniBirlesik(tip: RaporTipiMeta, rapor: SgkRaporDraft, sure: number): string {
  const var_ = (key: RaporTipiMeta['bolumler'][number]) => tip.bolumler.includes(key)
  const parcalar: string[] = []
  const ekle = (baslik: string, metin: string | null | undefined) => {
    const t = String(metin || '').trim()
    if (t) parcalar.push(`${baslik}\n${t}`)
  }

  if (var_('rapor_meta') && (tip.id === 'is_goremezlik' || tip.id === 'muayenehane_istirahat')) {
    const satirlar = [
      tip.id === 'is_goremezlik' ? `Rapor türü: ${rapor.raporTuru || 'İlk'} (İlk / Devam / Kontrol)` : null,
      `Başlangıç tarihi: ${rapor.baslangicTarihi || '—'}`,
      `Bitiş tarihi: ${rapor.bitisTarihi || '—'}`,
      `İstirahat süresi: ${rapor.istirahat_suresi_gun ?? sure} gün`,
    ].filter(Boolean)
    ekle('RAPOR BİLGİLERİ', satirlar.join('\n'))
  }
  if (var_('tani')) {
    ekle('TANI (ICD-10)', `${rapor.tani?.icd10 ? `${rapor.tani.icd10} — ` : ''}${rapor.tani?.aciklama || '—'}`)
  }
  if (var_('gerekce')) {
    ekle('İŞ GÖREMEZLİK GEREKÇESİ', rapor.isGoremezlikGerekcesi || rapor.mevcutDurum)
  }
  if (var_('klinik')) {
    if (rapor.anamnez) ekle('ANAMNEZ', rapor.anamnez)
    const baslik = tip.id === 'is_goremezlik' || tip.id === 'muayenehane_istirahat'
      ? 'MUAYENE BULGULARI / KLİNİK DEĞERLENDİRME'
      : 'MEVCUT DURUM / KLİNİK DEĞERLENDİRME'
    ekle(baslik, rapor.hekim_degerlendirmesi || rapor.mevcutDurum)
  }
  if (var_('sure') && tip.sureBirimi === 'ay') {
    ekle('RAPOR SÜRESİ', `${rapor.onerilen_sure_ay ?? sure} ay — başlangıç ${rapor.baslangicTarihi || '—'} (bitiş Medula / SUT kurallarına göre)`)
  }
  if (var_('etken') && Array.isArray(rapor.etkenMaddeler) && rapor.etkenMaddeler.length > 0) {
    ekle('ETKEN MADDELER (Medula listesiyle eşleştirin)', rapor.etkenMaddeler.map((e) => `• ${e}`).join('\n'))
  }
  if (var_('malzeme') && Array.isArray(rapor.malzemeOnerileri) && rapor.malzemeOnerileri.length > 0) {
    ekle('TIBBİ MALZEME ÖNERİLERİ (SUT kodunu Medula’dan seçin)', rapor.malzemeOnerileri.map((e) => `• ${e}`).join('\n'))
  }
  if (var_('tetkik') && Array.isArray(rapor.zorunluTetkikler) && rapor.zorunluTetkikler.length > 0) {
    ekle('ZORUNLU / DESTEKLEYİCİ TETKİKLER', rapor.zorunluTetkikler.map((t) => `• ${t}`).join('\n'))
  }
  ekle('HEKİM AÇIKLAMASI', rapor.hekim_notu || '—')
  return parcalar.join('\n\n')
}

/** Medula notu / özel uyarı — unified template'in tek "uyari" alanına gider. */
export function sgkRaporUyariMetni(tip: RaporTipiMeta, hekimMedulaBagli: boolean): string | undefined {
  if (tip.bolumler.includes('medula_not')) {
    return (
      'Yasal / Medula notu: Bu çıktı Medula’ya girilecek verinin taslağıdır. MEDULA’yı kullanan sağlık hizmeti ' +
      'sunucuları ilaç kullanım raporunu elektronik ortamda düzenler (SUT 4.1.3(2)); geçerli rapor Medula’da e-Rapor ' +
      'kaydı + hekim güvenli elektronik imzası ile oluşur. Rapor teşhis kodu ve (varsa) etken madde / SUT kodları SGK ' +
      'Medula listelerinden seçilmelidir.' +
      (hekimMedulaBagli ? '' : ' Medula hesabınız Notya’ya bağlı değil — Entegrasyonlar sayfasından bağlayın.')
    )
  }
  if (tip.bolumler.includes('ozel_uyari')) {
    return (
      'Önemli: Bu belge SGK e-İstirahat değildir. Özel muayenehane raporları tek başına SGK geçici iş görmezlik ' +
      'ödeneğine esas kabul edilmez; ödenek için hastanın sözleşmeli / yetkili sağlık hizmet sunucusundan Medula ' +
      'e-İstirahat alması gerekir. İşverenin özel muayenehane belgesini kabul edip etmeyeceği işyeri uygulamasına bağlıdır.'
    )
  }
  return undefined
}

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

export function systemPromptFor(tip: RaporTipiMeta, ozelSure?: string | null): string {
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
        `Bu bir SGK Medula ilaç kullanım e-Raporu taslağıdır. Etken maddeleri INN (Türkçe yazım) ile yaz; SUT süresi en fazla ${raporSureSiniri(tip, ozelSure).max} ay. ` +
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
