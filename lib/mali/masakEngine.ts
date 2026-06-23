export interface MasakIslem {
  müşteriId: string
  müşteriAdi: string
  islemTipi: 'nakit_tahsilat' | 'nakit_odeme' | 'eft' | 'havale' | 'diğer'
  tutar: number
  tarih: string
  aciklama?: string
}

export interface MasakAnaliz {
  bildirimGerekiyor: boolean
  riskSeviyesi: 'yok' | 'dusuk' | 'orta' | 'yuksek' | 'kritik'
  nedenler: string[]
  yapilmasiGerekenler: string[]
  yasal_dayanak: string[]
  telegramMesaji?: string
}

const NAKIT_SINIRI = 30000
const MASAK_BILDIRIM_SINIRI = 30000
const EFT_ACIKLAMA_MIN_KARAKTER = 20

export function analizMasakRisk(islem: MasakIslem): MasakAnaliz {
  const analiz: MasakAnaliz = {
    bildirimGerekiyor: false,
    riskSeviyesi: 'yok',
    nedenler: [],
    yapilmasiGerekenler: [],
    yasal_dayanak: [],
  }

  const isNakit = islem.islemTipi === 'nakit_tahsilat' || islem.islemTipi === 'nakit_odeme'
  const date = new Date(islem.tarih)
  const gun = date.getDate()

  if (islem.tutar >= NAKIT_SINIRI && isNakit) {
    analiz.bildirimGerekiyor = true
    analiz.riskSeviyesi = 'kritik'
    analiz.nedenler.push('VUK Muk.Md.257: 30.000 TL ve uzeri nakit islemler banka uzerinden yapilmalidir')
    analiz.yapilmasiGerekenler.push('Banka transferine yonlendirin', 'Nakit kabul etmeyin', 'MASAK bildirimi hazırlayin')
  }

  if (islem.tutar >= 75000) {
    if (analiz.riskSeviyesi === 'yok' || analiz.riskSeviyesi === 'dusuk' || analiz.riskSeviyesi === 'orta') {
      analiz.riskSeviyesi = 'yuksek'
    }
    analiz.nedenler.push('Yuksek tutarli islem - MASAK Şüpheli islem kontrolu')
  }

  if (islem.islemTipi === 'eft' && (islem.aciklama?.length || 0) < EFT_ACIKLAMA_MIN_KARAKTER) {
    analiz.nedenler.push('EFT aciklamasi 20 karakterden az - MASAK ihlali')
    if (analiz.riskSeviyesi === 'yok') analiz.riskSeviyesi = 'orta'
  }

  if (islem.tutar >= MASAK_BILDIRIM_SINIRI && (gun === 30 || gun === 31)) {
    analiz.yasal_dayanak.push('MASAK 30-31 gun bildirimi')
  }

  if (analiz.bildirimGerekiyor) {
    analiz.telegramMesaji = `🚨 MASAK KRİTİK UYARI\nMüşteri: ${islem.müşteriAdi}\nTutar: ${islem.tutar} TL\nTip: ${islem.islemTipi}\nTarih: ${islem.tarih}\nNeden: ${analiz.nedenler[0]}`
  }

  return analiz
}

export function kontrolEtAylikIslemler(islemler: MasakIslem[]): MasakAnaliz[] {
  return islemler
    .map(islem => analizMasakRisk(islem))
    .filter(analiz => analiz.bildirimGerekiyor || analiz.riskSeviyesi !== 'yok')
}

export function getMasakBildirimTarihleri(year: number, month: number): { gun: number; aciklama: string }[] {
  const lastDay = new Date(year, month, 0).getDate()
  const result: { gun: number; aciklama: string }[] = []
  if (lastDay >= 30) {
    result.push({ gun: 30, aciklama: 'MASAK Şüpheli islem bildirimi son gunu (eger ay 30 gun ise)' })
  }
  if (lastDay === 31) {
    result.push({ gun: 31, aciklama: 'MASAK Şüpheli islem bildirimi son gunu (eger ay 31 gun ise)' })
  }
  return result
}