/**
 * e-Nabız yapıştırma masası — hekim/sekreter e-Nabız’a kendisi girer; Notya alanları hazırlar.
 * Bakanlık HTTP yok. FHIR/Medula/USS doktor yüzünde yok; teknik paket ikinci planda.
 */

export const ENABIZ_PORTAL = 'https://www.enabiz.gov.tr/'

export const MASA_KISA_REHBER =
  'e-Nabız’a siz girersiniz. Notya alanları hazırlar; kopyalayıp forma yapıştırırsınız.'

export type EnabizMasaTur = 'muayene' | 'recete' | 'epikriz' | 'rapor' | 'usg' | 'gebe'

export const MASA_CIKTI_AD: Record<EnabizMasaTur, string> = {
  muayene: 'Muayene',
  recete: 'Reçete',
  epikriz: 'Epikriz',
  rapor: 'Rapor',
  usg: 'Görüntüleme',
  gebe: 'Gebe / doğum',
}

export type EnabizAlan = {
  id: string
  etiket: string
  deger: string
  eksik: boolean
}

export type EnabizMasaCikti = {
  tur: EnabizMasaTur
  ad: string
  alanlar: EnabizAlan[]
  topluMetin: string
  eksikler: string[]
}

export type EnabizMasaGirdi = {
  hastaAd: string
  tcKimlik: string
  muayeneTarihi: string
  sikayet: string
  fizik: string
  tani: string
  icd10: string
  plan: string
  ilaclar: string
  tesisKodu: string
  diplomaNo: string
  usgBaslik: string
  usgGovde: string
  gebeSat: string
  gebeDogum: string
  gebeDurum: string
}

export function masaCiktiListesi(g: { usgVar: boolean; gebeGoster: boolean }): { tur: EnabizMasaTur; ad: string }[] {
  const t: EnabizMasaTur[] = ['muayene', 'recete', 'epikriz', 'rapor']
  if (g.usgVar) t.push('usg')
  if (g.gebeGoster) t.push('gebe')
  return t.map((tur) => ({ tur, ad: MASA_CIKTI_AD[tur] }))
}

export function masaTurCoz(ham: string | null | undefined): EnabizMasaTur {
  const t = String(ham || '').trim()
  if (t === 'recete' || t === 'epikriz' || t === 'rapor' || t === 'usg' || t === 'gebe') return t
  return 'muayene'
}

export function izinKilitliMi(istemiyor: boolean): boolean {
  return istemiyor === true
}

function alan(id: string, etiket: string, deger: string): EnabizAlan {
  const d = String(deger || '').trim()
  return { id, etiket, deger: d, eksik: !d }
}

export function masaAlanlari(tur: EnabizMasaTur, g: EnabizMasaGirdi): EnabizMasaCikti {
  const ortak = [
    alan('tc', 'T.C. Kimlik No', g.tcKimlik),
    alan('ad', 'Ad Soyad', g.hastaAd),
    alan('tarih', 'Muayene tarihi', g.muayeneTarihi),
  ]
  let extra: EnabizAlan[] = []
  if (tur === 'muayene') {
    extra = [
      alan('sikayet', 'Şikayet / başvuru', g.sikayet),
      alan('fizik', 'Muayene', g.fizik),
      alan('tani', 'Tanı', g.tani),
      alan('icd', 'ICD-10', g.icd10),
      alan('plan', 'Plan', g.plan),
    ]
  } else if (tur === 'recete') {
    extra = [
      alan('tani', 'Tanı', g.tani),
      alan('icd', 'ICD-10', g.icd10),
      alan('ilac', 'İlaçlar', g.ilaclar),
    ]
  } else if (tur === 'epikriz') {
    extra = [
      alan('taniTedavi', 'Tanı ve tedavi', [g.tani, g.icd10, g.ilaclar].filter(Boolean).join('\n')),
      alan('ozet', 'Özet', [g.sikayet, g.fizik, g.plan].filter(Boolean).join('\n')),
    ]
  } else if (tur === 'rapor') {
    extra = [
      alan('tani', 'Tanı', g.tani),
      alan('icd', 'ICD-10', g.icd10),
      alan('gerekce', 'Gerekçe / plan', g.plan),
      alan('tesis', 'Tesis kodu', g.tesisKodu),
      alan('diploma', 'Diploma no', g.diplomaNo),
    ]
  } else if (tur === 'usg') {
    extra = [
      alan('baslik', 'Rapor başlığı', g.usgBaslik),
      alan('govde', 'Rapor metni', g.usgGovde),
    ]
  } else {
    extra = [
      alan('sat', 'SAT', g.gebeSat),
      alan('dogum', 'Doğum tarihi', g.gebeDogum),
      alan('durum', 'Gebelik durumu', g.gebeDurum),
    ]
  }
  const alanlar = [...ortak, ...extra]
  const eksikler = alanlar.filter((a) => a.eksik).map((a) => a.etiket)
  const topluMetin = alanlar.map((a) => `${a.etiket}: ${a.deger || '—'}`).join('\n')
  return { tur, ad: MASA_CIKTI_AD[tur], alanlar, topluMetin, eksikler }
}

export function bosMasaGirdi(): EnabizMasaGirdi {
  return {
    hastaAd: '',
    tcKimlik: '',
    muayeneTarihi: '',
    sikayet: '',
    fizik: '',
    tani: '',
    icd10: '',
    plan: '',
    ilaclar: '',
    tesisKodu: '',
    diplomaNo: '',
    usgBaslik: '',
    usgGovde: '',
    gebeSat: '',
    gebeDogum: '',
    gebeDurum: '',
  }
}
