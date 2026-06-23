export type EDevletSorguTipi = 'vergi_borcu' | 'sgk_prim_borcu' | 'sicil_durumu' | 'kosgeb_belge' | 'nace_kodu' | 'ticaret_sicil'

export interface EDevletSorgu {
  sorguTipi: EDevletSorguTipi
  vergiNo?: string
  tcNo?: string
  müşteriAdi?: string
}

export interface EDevletSonuc {
  sorguTipi: EDevletSorguTipi
  müşteriAdi?: string
  sonuc: string
  detaylar: Record<string, string | number | boolean>
  linkler: { aciklama: string; url: string }[]
  yapilmasiGerekenler: string[]
  uyarilar: string[]
}

const EDEVLET_URLS: Record<EDevletSorguTipi, string> = {
  vergi_borcu: 'https://www.türkiye.gov.tr/gib-intvrg-borc-sorgulama',
  sgk_prim_borcu: 'https://www.türkiye.gov.tr/sgk-prim-borc-sorgulama',
  sicil_durumu: 'https://www.türkiye.gov.tr/gib-mukellef-sorgulama',
  kosgeb_belge: 'https://www.türkiye.gov.tr/kosgeb-kobidurum-belgesi-sorgulama',
  nace_kodu: 'https://www.türkiye.gov.tr/gib-nace-kodu-sorgulama',
  ticaret_sicil: 'https://www.türkiye.gov.tr/gtb-ticaret-sicil-gazetesi'
}

export function buildEDevletRehber(sorgu: EDevletSorgu): EDevletSonuc {
  const { sorguTipi, vergiNo, tcNo, müşteriAdi } = sorgu
  const base: EDevletSonuc = {
    sorguTipi,
    müşteriAdi,
    sonuc: '',
    detaylar: {},
    linkler: [],
    yapilmasiGerekenler: [],
    uyarilar: []
  }

  switch (sorguTipi) {
    case 'vergi_borcu':
      base.sonuc = 'Vergi borcu sorgulamak icin e-Devlet adimlarini takip edin'
      base.linkler = [{ aciklama: 'GIB Borc Sorgulama', url: EDEVLET_URLS.vergi_borcu }]
      base.yapilmasiGerekenler = [
        'e-Devlet hesabinizla giriş yapin',
        'GIB Borc Sorgulama sayfasina gidin',
        `Vergi No girin: ${vergiNo || 'belirtilmedi'}`,
        'Sorgu sonucunu Notya AI ye bildirin'
      ]
      break
    case 'sgk_prim_borcu':
      base.sonuc = 'SGK prim borcu sorgulamasi icin e-Devlet adimlarini takip edin'
      base.linkler = [{ aciklama: 'SGK Prim Borc Sorgulama', url: EDEVLET_URLS.sgk_prim_borcu }]
      base.yapilmasiGerekenler = [
        'e-Devlet hesabinizla giriş yapin',
        'SGK Prim Borc Sorgulama sayfasina gidin',
        `Isyeri sicil no veya TC girin: ${tcNo || vergiNo || 'belirtilmedi'}`,
        'Sonucu Notya AI ye bildirin'
      ]
      base.uyarilar = ['SGK borcu varsa 6 ay taksit imkani var - detayi sorun']
      break
    case 'sicil_durumu':
      base.sonuc = 'Mukellef sicil durumu sorgulamasi'
      base.linkler = [{ aciklama: 'GIB Mukellef Sorgulama', url: EDEVLET_URLS.sicil_durumu }]
      base.yapilmasiGerekenler = ['e-Devlet ile giriş yapin', 'Vergi numaranizi girin', 'Sonucu bildirin']
      break
    case 'kosgeb_belge':
      base.sonuc = 'KOSGEB KOBI Durum Belgesi sorgulamasi'
      base.linkler = [{ aciklama: 'KOSGEB Belge Sorgulama', url: EDEVLET_URLS.kosgeb_belge }]
      base.yapilmasiGerekenler = [
        'e-Devlet hesabinizla giriş yapin',
        'KOSGEB KOBI Durum Belgesi sayfasina gidin',
        'Isletmeyi secin',
        'Barkodlu PDF indirin'
      ]
      base.uyarilar = ['NACE kodu guncel degilse belge alinamamaktadir - once NACE kontrolu yapilmasi onerilir']
      break
    case 'nace_kodu':
      base.sonuc = 'NACE kodu sorgulamasi'
      base.linkler = [{ aciklama: 'GIB NACE Kodu Sorgulama', url: EDEVLET_URLS.nace_kodu }]
      base.yapilmasiGerekenler = [
        'GIB NACE Kodu Sorgulama sayfasina gidin',
        `Vergi No ile sorgulama yapin: ${vergiNo || 'belirtilmedi'}`,
        'Sonucu kontrol edin'
      ]
      base.uyarilar = ['KOSGEB basvurusu oncesi NACE kodunun guncel olmasi kritiktir']
      break
    case 'ticaret_sicil':
      base.sonuc = 'Ticaret sicil gazetesi sorgulamasi'
      base.linkler = [{ aciklama: 'Ticaret Sicil Gazetesi', url: EDEVLET_URLS.ticaret_sicil }]
      base.yapilmasiGerekenler = ['e-Devlet ile giriş yapin', 'şirket bilgilerini girin', 'Sonucu bildirin']
      break
  }
  return base
}

export function buildDeryaVoiceResponse(sorgu: EDevletSorgu, sonuc: EDevletSonuc): string {
  const url = EDEVLET_URLS[sorgu.sorguTipi]
  return `${sorgu.sorguTipi} sorgusu icin şimdi e-Devlet adresine gidin: ${url}. ${sonuc.yapilmasiGerekenler[0] || ''} Sonucu bana bildirin. Linki dashboardinizda goruntuluyorsunuz.`
}