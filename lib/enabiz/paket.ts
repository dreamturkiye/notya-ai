/**
 * NOTYA-ENABIZ-FORMAT — e-Nabız / USS / Medula hazır paketler.
 *
 * Canlı yazım YOK (live_write her zaman false). Amaç: reçete, rapor, epikriz,
 * USG, gebe/e-Doğum gibi ileride e-Nabız’a gidecek her çıktının şimdiden
 * doğru kanal formatında (FHIR R4 Bundle, Medula erecete.s1.xsd XML,
 * Medula e-Rapor alanları, USS form JSON) üretilmesi — kopyala/indir hazır.
 *
 * SGK rapor kanonu: /doktor-tools/sgk-rapor (pediatri + Dr. Gökhan revizyonları;
 * lib/sgk/raporTipleri). enabizSgkRapor yalnız o draft’ı Medula alan zarfına çevirir.
 *
 * Kaynak hizası: docs/ENTEGRASYON-KILAVUZU.md §5, docs/USS-P4-YOLHARITASI.md,
 * lib/medula (erecete.s1.xsd), lib/entegrasyon/fhirMapper.ts.
 */

export const ENABIZ_SCHEMA = 'notya.enabiz.v1' as const

export type EnabizKanal =
  | 'fhir_r4'
  | 'medula_erecete_xml'
  | 'medula_erapor_json'
  | 'uss_form_json'

export type EnabizTur =
  | 'muayene_notu'
  | 'erecete'
  | 'epikriz'
  | 'sgk_rapor'
  | 'usg_rapor'
  | 'gebe_bildirimi'
  | 'gebe_izlem'
  | 'e_dogum'
  | 'lohusa_izlem'
  | 'pregnancy_outcome'

export type EnabizPaket = {
  schema: typeof ENABIZ_SCHEMA
  tur: EnabizTur
  kanal: EnabizKanal
  /** Canlı USS/e-Nabız yazımı — bu sürümde asla true değil */
  live_write: false
  uretildi_at: string
  /** FHIR Bundle | Medula XML string sarmalı | USS form alanları */
  payload: Record<string, unknown>
  /** MBYS / Medula / e-Nabız ekranına yapıştırma metni */
  kopya_metin: string
  eksikler: string[]
  not: string
}

const SIS = {
  tc: 'https://saglik.gov.tr/fhir/sid/tc-kimlik-no',
  icd10: 'http://hl7.org/fhir/sid/icd-10',
  loinc: 'http://loinc.org',
  ucum: 'http://unitsofmeasure.org',
  notya: 'https://notya.ai/fhir/sid',
} as const

function isoNow(): string {
  return new Date().toISOString()
}

function paket(
  tur: EnabizTur,
  kanal: EnabizKanal,
  payload: Record<string, unknown>,
  kopya_metin: string,
  eksikler: string[],
  not?: string,
): EnabizPaket {
  return {
    schema: ENABIZ_SCHEMA,
    tur,
    kanal,
    live_write: false,
    uretildi_at: isoNow(),
    payload,
    kopya_metin,
    eksikler,
    not:
      not ||
      'Canlı e-Nabız/USS bağlantısı yok — paket format-hazır; hekim MBYS/Medula/e-Nabız’a kendisi aktarır veya P4 adaptörü bekler.',
  }
}

function xhtml(metin: string): string {
  return `<div xmlns="http://www.w3.org/1999/xhtml"><p>${metin
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\n/g, '<br/>')}</p></div>`
}

/** Katalog — UI / araçlar sayfası için. */
export const ENABIZ_ARTEFAKTLAR: {
  tur: EnabizTur
  ad: string
  kanal: EnabizKanal
  ornek: string
}[] = [
  { tur: 'muayene_notu', ad: 'Onaylı muayene notu', kanal: 'fhir_r4', ornek: 'Composition + Condition + Observation Bundle' },
  { tur: 'erecete', ad: 'e-Reçete', kanal: 'medula_erecete_xml', ornek: 'erecete.s1.xsd XML + Medula kopya metni' },
  { tur: 'epikriz', ad: 'Epikriz', kanal: 'fhir_r4', ornek: 'Composition (LOINC 18842-5) + DocumentReference' },
  { tur: 'sgk_rapor', ad: 'SGK e-Rapor / e-İstirahat', kanal: 'medula_erapor_json', ornek: 'Araçlar → Hasta Raporları (Gökhan pediatri); Medula alan JSON' },
  { tur: 'usg_rapor', ad: 'USG / görüntüleme raporu', kanal: 'fhir_r4', ornek: 'DiagnosticReport (LOINC 18748-4)' },
  { tur: 'gebe_bildirimi', ad: 'Gebe bildirimi', kanal: 'uss_form_json', ornek: 'USS gebe bildirim alanları' },
  { tur: 'gebe_izlem', ad: 'Gebe izlem', kanal: 'uss_form_json', ornek: 'İzlem 1–4 + vital/risk alanları' },
  { tur: 'e_dogum', ad: 'e-Doğum / DBS', kanal: 'uss_form_json', ornek: 'Canlı + ölü ≥22hf/≥500g alanları' },
  { tur: 'lohusa_izlem', ad: 'Lohusa izlem', kanal: 'uss_form_json', ornek: 'Lohusa gün + TA + emzirme' },
  { tur: 'pregnancy_outcome', ad: 'Gebelik sonucu', kanal: 'uss_form_json', ornek: 'Canlı/ölü/abortus/ektopik' },
]

// ---------- FHIR: USG DiagnosticReport ----------

export function enabizUsgRapor(g: {
  id?: string
  baslik: string
  govde: string
  sutOneri?: string
  bayraklar?: string[]
  sablonKod?: string
  hastaId?: string
  hekimAd?: string
}): EnabizPaket {
  const id = g.id || `usg-${Date.now()}`
  const eksikler: string[] = []
  if (!g.hastaId) eksikler.push('hasta_id (e-Nabız eşlemesi için)')
  const conclusion = [g.govde, g.sutOneri ? `SUT: ${g.sutOneri}` : '', ...(g.bayraklar || []).map((b) => `⚠ ${b}`)]
    .filter(Boolean)
    .join('\n')
  const resource = {
    resourceType: 'DiagnosticReport',
    id,
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'RAD', display: 'Radiology' }] }],
    code: {
      coding: [{ system: SIS.loinc, code: '18748-4', display: 'Diagnostic imaging study' }],
      text: g.baslik,
    },
    subject: g.hastaId
      ? { reference: `Patient/${g.hastaId}`, identifier: { system: `${SIS.notya}/hasta-id`, value: g.hastaId } }
      : undefined,
    effectiveDateTime: isoNow(),
    issued: isoNow(),
    performer: g.hekimAd ? [{ display: g.hekimAd }] : undefined,
    conclusion,
    presentedForm: [{ contentType: 'text/plain; charset=utf-8', title: g.baslik, language: 'tr' }],
    extension: [
      { url: `${SIS.notya}/usg-sablon`, valueString: g.sablonKod || null },
      { url: `${SIS.notya}/sut-oneri`, valueString: g.sutOneri || null },
      { url: `${SIS.notya}/live-write`, valueBoolean: false },
    ],
  }
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: isoNow(),
    entry: [{ fullUrl: `urn:uuid:${id}`, resource }],
  }
  const kopya = [
    '— e-Nabız / MBYS görüntüleme raporu (FHIR DiagnosticReport) —',
    g.baslik,
    conclusion,
    '',
    '(Canlı gönderim yok — JSON/FHIR paketini indirip HBYS/MBYS’e aktarın.)',
  ].join('\n')
  return paket('usg_rapor', 'fhir_r4', { fhir: bundle, sablon: g.sablonKod || null }, kopya, eksikler)
}

// ---------- FHIR: Epikriz Composition ----------

export function enabizEpikriz(g: {
  id?: string
  hastaAd: string
  hastaId?: string
  taniVeTedavi: string
  taburcuOzeti: string
  hekimAd?: string
  kurumAd?: string
}): EnabizPaket {
  const id = g.id || `epikriz-${Date.now()}`
  const eksikler: string[] = []
  if (!g.taniVeTedavi.trim()) eksikler.push('taniVeTedavi')
  if (!g.taburcuOzeti.trim()) eksikler.push('taburcuOzeti')
  const composition = {
    resourceType: 'Composition',
    id,
    status: 'final',
    type: { coding: [{ system: SIS.loinc, code: '18842-5', display: 'Discharge summary' }], text: 'Epikriz' },
    subject: {
      display: g.hastaAd,
      ...(g.hastaId ? { reference: `Patient/${g.hastaId}` } : {}),
    },
    date: isoNow(),
    author: [{ display: g.hekimAd || 'Hekim' }],
    title: `Epikriz — ${g.hastaAd}${g.kurumAd ? ` — ${g.kurumAd}` : ''}`,
    section: [
      {
        title: 'Tanı ve Tedavi',
        text: { status: 'generated', div: xhtml(g.taniVeTedavi || '—') },
      },
      {
        title: 'Taburcu / Özet',
        text: { status: 'generated', div: xhtml(g.taburcuOzeti || '—') },
      },
    ],
  }
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: isoNow(),
    entry: [{ fullUrl: `urn:uuid:${id}`, resource: composition }],
  }
  const kopya = [
    '— e-Nabız epikriz (FHIR Composition LOINC 18842-5) —',
    `Hasta: ${g.hastaAd}`,
    '',
    'Tanı ve Tedavi:',
    g.taniVeTedavi,
    '',
    'Taburcu / Özet:',
    g.taburcuOzeti,
  ].join('\n')
  return paket('epikriz', 'fhir_r4', { fhir: bundle }, kopya, eksikler)
}

// ---------- Medula: e-Reçete zarfı ----------

export function enabizErecete(g: {
  xml: string
  metin: string
  eksikler?: string[]
  erecete?: Record<string, unknown>
}): EnabizPaket {
  return paket(
    'erecete',
    'medula_erecete_xml',
    {
      xml: g.xml,
      erecete: g.erecete || null,
      xsd: 'erecete.s1.xsd',
    },
    g.metin,
    g.eksikler || [],
    'Medula e-reçete formatı (erecete.s1.xsd). Canlı imzalı gönderim P3; hasta e-Nabız’da reçeteyi Medula kaydından görür.',
  )
}

// ---------- Medula: e-Rapor / e-İstirahat alanları ----------

export function enabizSgkRapor(g: {
  raporTipiId: string
  raporTipiLabel: string
  draft: {
    raporBasligi?: string
    raporTuru?: string
    hastaAdi?: string
    tani?: { icd10?: string; aciklama?: string }
    isGoremezlikGerekcesi?: string
    hekim_degerlendirmesi?: string
    hekim_notu?: string
    anamnez?: string
    mevcutDurum?: string
    istirahat_suresi_gun?: number
    onerilen_sure_ay?: number
    baslangicTarihi?: string
    bitisTarihi?: string
    etkenMaddeler?: string[]
    malzemeOnerileri?: string[]
    zorunluTetkikler?: string[]
  }
  hekim?: {
    adSoyad?: string
    uzmanlik?: string
    diplomaTescilNo?: string
    saglikKurumu?: string
    tesisKodu?: string
  }
}): EnabizPaket {
  const d = g.draft
  const eksikler: string[] = []
  if (!d.tani?.icd10) eksikler.push('ICD-10 tanı kodu')
  if (!g.hekim?.tesisKodu) eksikler.push('tesisKodu (Medula)')
  if (!g.hekim?.diplomaTescilNo) eksikler.push('diplomaTescilNo')
  if (g.raporTipiId === 'is_goremezlik' && !d.istirahat_suresi_gun) eksikler.push('istirahat_suresi_gun')
  if (g.raporTipiId === 'ilac_kullanim' && !(d.etkenMaddeler || []).length) eksikler.push('etkenMaddeler')

  const medulaAlanlari = {
    raporTipi: g.raporTipiId,
    raporTipiAdi: g.raporTipiLabel,
    raporTuru: d.raporTuru || null,
    raporBasligi: d.raporBasligi || g.raporTipiLabel,
    hastaAdSoyad: d.hastaAdi || null,
    // TC Notya’da hash-only — Medula’da hekim seçer
    tcKimlikNo: null as null,
    taniKodu: d.tani?.icd10 || null,
    taniAdi: d.tani?.aciklama || null,
    baslangicTarihi: d.baslangicTarihi || null,
    bitisTarihi: d.bitisTarihi || null,
    istirahatGun: d.istirahat_suresi_gun ?? null,
    sureAy: d.onerilen_sure_ay ?? null,
    gerekce: d.isGoremezlikGerekcesi || d.hekim_degerlendirmesi || null,
    anamnez: d.anamnez || null,
    klinik: d.mevcutDurum || null,
    hekimNotu: d.hekim_notu || null,
    etkenMaddeler: d.etkenMaddeler || [],
    malzeme: d.malzemeOnerileri || [],
    tetkikler: d.zorunluTetkikler || [],
    hekim: {
      adSoyad: g.hekim?.adSoyad || null,
      brans: g.hekim?.uzmanlik || null,
      diplomaTescilNo: g.hekim?.diplomaTescilNo || null,
      tesisKodu: g.hekim?.tesisKodu || null,
      kurum: g.hekim?.saglikKurumu || null,
    },
    live_write: false,
  }

  const kopya = [
    `— Medula e-Rapor taslağı: ${g.raporTipiLabel} —`,
    `Başlık: ${medulaAlanlari.raporBasligi}`,
    `Tanı: ${medulaAlanlari.taniKodu || '—'} ${medulaAlanlari.taniAdi || ''}`.trim(),
    `Süre: ${medulaAlanlari.istirahatGun != null ? `${medulaAlanlari.istirahatGun} gün` : medulaAlanlari.sureAy != null ? `${medulaAlanlari.sureAy} ay` : '—'}`,
    `Başlangıç–Bitiş: ${medulaAlanlari.baslangicTarihi || '—'} → ${medulaAlanlari.bitisTarihi || '—'}`,
    medulaAlanlari.gerekce ? `Gerekçe: ${medulaAlanlari.gerekce}` : '',
    (medulaAlanlari.etkenMaddeler as string[]).length
      ? `Etken: ${(medulaAlanlari.etkenMaddeler as string[]).join(', ')}`
      : '',
    `Hekim: ${medulaAlanlari.hekim.adSoyad || '—'} · Tesis: ${medulaAlanlari.hekim.tesisKodu || '—'}`,
    '',
    '(Canlı Medula gönderimi yok — alanlar Medula e-Rapor/e-İstirahat formuna birebir taşınır.)',
  ]
    .filter(Boolean)
    .join('\n')

  return paket('sgk_rapor', 'medula_erapor_json', { medula: medulaAlanlari }, kopya, eksikler)
}

// ---------- USS form: gebe / e-Doğum / lohusa ----------

export function enabizUssForm(
  tur: Extract<EnabizTur, 'gebe_bildirimi' | 'gebe_izlem' | 'e_dogum' | 'lohusa_izlem' | 'pregnancy_outcome'>,
  alanlar: Record<string, unknown>,
  zorunlu: string[],
): EnabizPaket {
  const eksikler = zorunlu.filter((k) => {
    const v = alanlar[k]
    return v == null || v === '' || v === false
  })
  const satirlar = Object.entries(alanlar).map(([k, v]) => `${k}: ${v == null || v === '' ? '—' : String(v)}`)
  const kopya = [
    `— e-Nabız / USS form: ${tur} —`,
    ...satirlar,
    '',
    '(live_write=false — alanlar USS/e-Nabız formuna kopyalanır; canlı HTTP yazım P4.)',
  ].join('\n')
  return paket(
    tur,
    'uss_form_json',
    {
      form_id: tur,
      alanlar,
      live_write: false,
      sistem: tur === 'e_dogum' ? 'e-dogum' : 'e-nabiz',
    },
    kopya,
    eksikler,
  )
}

export function enabizEDogumFromWizard(sihirbaz: {
  alanlar: { kod: string; etiket: string; deger: string; eksik: boolean }[]
  tamam: boolean
  uyari: string[]
}): EnabizPaket {
  const alanlar: Record<string, unknown> = {}
  for (const a of sihirbaz.alanlar) alanlar[a.kod] = a.deger || null
  alanlar.tamam = sihirbaz.tamam
  alanlar.uyarilar = sihirbaz.uyari
  const p = enabizUssForm('e_dogum', alanlar, [])
  p.eksikler = sihirbaz.alanlar.filter((a) => a.eksik).map((a) => a.kod)
  return p
}

export function enabizGebeIzlem(g: {
  izlem_no: 1 | 2 | 3 | 4
  bp: string
  weight: number
  hb?: number
  urine_protein: boolean
  fhr?: number
  risk: string
  danger_signs: string[]
  mother_patient_id?: string
  sat?: string
  edd?: string
}): EnabizPaket {
  return enabizUssForm(
    'gebe_izlem',
    {
      izlem_no: g.izlem_no,
      BP: g.bp,
      weight: g.weight,
      Hb: g.hb ?? null,
      urine_protein: g.urine_protein,
      FHR: g.fhr ?? null,
      risk: g.risk,
      danger_signs: g.danger_signs,
      mother_patient_id: g.mother_patient_id ?? null,
      sat: g.sat ?? null,
      edd: g.edd ?? null,
    },
    ['izlem_no', 'BP', 'weight', 'risk'],
  )
}

/** İndirme yardımcı — tarayıcıda Blob. */
export function enabizJsonIndirAdi(p: EnabizPaket): string {
  const gun = p.uretildi_at.slice(0, 10)
  return `enabiz-${p.tur}-${gun}.json`
}
