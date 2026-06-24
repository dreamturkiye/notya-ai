// Esnaf classification + auto beyan takvimi engine
// 10380 sayili CB Karari: 1 Ocak 2026 buyuksehir ilce nufus >30k -> gercek usul
// Nisantasi = Sisli ilce = gercek usul

export type FaaliyetTuru =
  | 'bakkal' | 'market' | 'manav' | 'kuruyemis'
  | 'kuafor' | 'berber' | 'guzellik_salonu'
  | 'terzi' | 'tamirci' | 'ayakkabi_tamiri'
  | 'cafe' | 'cay_ocagi' | 'restoran'
  | 'eczane' | 'kirtasiye' | 'cicekci' | 'tuhafiye'
  | 'limited' | 'anonim' | 'sahis_gercek' | 'diger'

export type VergilendirmeUsulu = 'basit_usul' | 'gercek_usul'

export interface BeyanItem {
  beyanTuru: string
  periyot: 'aylik' | '3_aylik' | 'yillik'
  aylar: number[]
  aciklama: string
  kritik: boolean
  kanunDayanagi: string
}

export interface EsnafProfil {
  faaliyetTuru: FaaliyetTuru
  vergilendirmeUsulu: VergilendirmeUsulu
  calisanSayisi: number
  buyuksehirde: boolean
  kdvMukellef: boolean
  beyanlar: BeyanItem[]
  riskler: string[]
  notlar: string
}

export function siniflandir(faaliyetAdi: string): FaaliyetTuru {
  const f = faaliyetAdi.toLowerCase().trim()
  if (f.includes('bakkal') || f.includes('market')) return 'bakkal'
  if (f.includes('manav') || f.includes('meyve') || f.includes('sebze')) return 'manav'
  if (f.includes('kuruyemis')) return 'kuruyemis'
  if (f.includes('kuafor') || f.includes('sac') || f.includes('sakal')) return 'kuafor'
  if (f.includes('berber')) return 'berber'
  if (f.includes('guzellik') || f.includes('estetik') || f.includes('nail')) return 'guzellik_salonu'
  if (f.includes('terzi') || f.includes('dikis')) return 'terzi'
  if (f.includes('tamir')) return 'tamirci'
  if (f.includes('ayakkabi')) return 'ayakkabi_tamiri'
  if (f.includes('cafe') || f.includes('kahve') || f.includes('kafe')) return 'cafe'
  if (f.includes('cay') || f.includes('cay ocagi')) return 'cay_ocagi'
  if (f.includes('restoran') || f.includes('lokanta')) return 'restoran'
  if (f.includes('eczane')) return 'eczane'
  if (f.includes('kirtasiye')) return 'kirtasiye'
  if (f.includes('cicek')) return 'cicekci'
  if (f.includes('limited') || f.includes('ltd')) return 'limited'
  if (f.includes('anonim')) return 'anonim'
  return 'sahis_gercek'
}

export function belirleUsul(faaliyetTuru: FaaliyetTuru, buyuksehirde: boolean, sirketTuru: string): VergilendirmeUsulu {
  if (sirketTuru === 'limited' || sirketTuru === 'anonim') return 'gercek_usul'
  if (faaliyetTuru === 'limited' || faaliyetTuru === 'anonim' || faaliyetTuru === 'eczane') return 'gercek_usul'
  if (buyuksehirde) return 'gercek_usul' // 10380 sayili karar
  return 'basit_usul'
}

export function olusturBeyanTakvimi(usul: VergilendirmeUsulu, calisanSayisi: number, kdvMukellef: boolean): BeyanItem[] {
  const b: BeyanItem[] = []
  if (usul === 'gercek_usul') {
    if (kdvMukellef) b.push({ beyanTuru: 'KDV Beyannamesi', periyot: 'aylik', aylar: [1,2,3,4,5,6,7,8,9,10,11,12], aciklama: 'Her ay 26. gunu', kritik: true, kanunDayanagi: 'KDV K. Md. 41' })
    b.push({ beyanTuru: 'Gecici Vergi 1. Donem', periyot: '3_aylik', aylar: [5], aciklama: 'Ocak-Mart, 17 Mayis', kritik: true, kanunDayanagi: 'GVK Md. 120' })
    b.push({ beyanTuru: 'Gecici Vergi 2. Donem', periyot: '3_aylik', aylar: [8], aciklama: 'Nisan-Haziran, 17 Agustos', kritik: true, kanunDayanagi: 'GVK Md. 120' })
    b.push({ beyanTuru: 'Gecici Vergi 3. Donem', periyot: '3_aylik', aylar: [11], aciklama: 'Temmuz-Eylul, 17 Kasim', kritik: true, kanunDayanagi: 'GVK Md. 120' })
    b.push({ beyanTuru: 'Yillik Gelir Vergisi', periyot: 'yillik', aylar: [3], aciklama: 'Mart ayi sonu', kritik: true, kanunDayanagi: 'GVK Md. 92' })
  } else {
    b.push({ beyanTuru: 'Yillik Gelir Vergisi (Basit Usul)', periyot: 'yillik', aylar: [3], aciklama: 'Mart ayi sonu', kritik: false, kanunDayanagi: 'GVK Md. 92' })
  }
  if (calisanSayisi > 0) {
    b.push({ beyanTuru: 'Muhtasar ve Prim Hizmet Beyannamesi', periyot: 'aylik', aylar: [1,2,3,4,5,6,7,8,9,10,11,12], aciklama: 'Her ay 26. gunu - calisan var', kritik: true, kanunDayanagi: 'GVK Md. 98' })
    b.push({ beyanTuru: 'SGK Aylik Prim Hizmet Belgesi', periyot: 'aylik', aylar: [1,2,3,4,5,6,7,8,9,10,11,12], aciklama: 'Her ay 23. gunu', kritik: true, kanunDayanagi: 'SGK K. Md. 86' })
  }
  return b
}

export function riskUyarilari(faaliyetTuru: FaaliyetTuru, usul: VergilendirmeUsulu, calisanSayisi: number): string[] {
  const r: string[] = []
  if (usul === 'gercek_usul' && faaliyetTuru !== 'limited' && faaliyetTuru !== 'anonim') {
    r.push('10380 sayili CB Karari: Gercek usule gecis zorunlu (1.1.2026). Yilda 20+ beyanname, defter tutma, e-fatura.')
  }
  if (faaliyetTuru === 'bakkal' || faaliyetTuru === 'market') r.push('Gida KDV oranlari: temel gida %1, diger %10, icecek %20')
  if (faaliyetTuru === 'kuafor' || faaliyetTuru === 'berber' || faaliyetTuru === 'guzellik_salonu') r.push('Hizmet %20 KDV. Urun satisi ayrica degerlendirilir.')
  if (calisanSayisi > 0) r.push('Calisan var: Muhtasar + SGK her ay zorunlu. Gec bildirimde ceza.')
  return r
}

export function olusturEsnafProfil(faaliyetAdi: string, sirketTuru: string, calisanSayisi: number, buyuksehirde = true): EsnafProfil {
  const faaliyetTuru = siniflandir(faaliyetAdi)
  const usul = belirleUsul(faaliyetTuru, buyuksehirde, sirketTuru)
  const kdvMukellef = usul === 'gercek_usul'
  const beyanlar = olusturBeyanTakvimi(usul, calisanSayisi, kdvMukellef)
  const riskler = riskUyarilari(faaliyetTuru, usul, calisanSayisi)
  const notlar = usul === 'gercek_usul'
    ? `Gercek usul. Yilda ${calisanSayisi > 0 ? 28 : 20} beyanname. Defter tutma zorunlu.`
    : `Basit usul. Yilda 1 beyanname. ${calisanSayisi > 0 ? 'Calisan oldugu icin muhtasar eklendi.' : 'Calisan yok.'}`
  return { faaliyetTuru, vergilendirmeUsulu: usul, calisanSayisi, buyuksehirde, kdvMukellef, beyanlar, riskler, notlar }
}
