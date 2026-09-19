/**
 * FIZIK-TEDAVI-EXCEPTIONAL-01 — FTR kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · gecikmiş seans · açık risk · yüksek VAS/ODI.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, skor, ilaç adı, doz yok).
 */
export type FtrKohortBayrak = 'gecikmis_kontrol' | 'seans_gecikmis' | 'risk_acik' | 'olcek_yuksek'

export const FTR_BAYRAK_AD: Record<FtrKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  seans_gecikmis: 'Gecikmiş seans / egzersiz',
  risk_acik: 'Açık kırmızı bayrak',
  olcek_yuksek: 'Yüksek VAS/ODI',
}

export interface FtrKohortGirdi {
  patientId: string
  ad: string
  sonVasBant: string | null
  sonOdiBant: string | null
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface FtrKohortSatir {
  patientId: string
  ad: string
  bayraklar: FtrKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<FtrKohortBayrak, number> = {
  risk_acik: 6,
  olcek_yuksek: 3,
  seans_gecikmis: 3,
  gecikmis_kontrol: 2,
}

export function ftrKohortSatirlari(hastalar: FtrKohortGirdi[], bugun: string): FtrKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<FtrKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /seans|egzersiz|olcek|ölçek|vas|odi/.test(g.kod))) b.add('seans_gecikmis')
      if (h.sonVasBant === 'siddetli' || h.sonOdiBant === 'siddetli' || h.sonOdiBant === 'cok_siddetli' || h.sonOdiBant === 'yataga_bagli') {
        b.add('olcek_yuksek')
      }
      const bayraklar = [...b]
      return {
        patientId: h.patientId,
        ad: h.ad,
        bayraklar,
        gecikmisSayi: gecikmis.length,
        sonVizit: h.sonVizit,
        portalVar: h.portalVar,
        oncelik: bayraklar.reduce((s, x) => s + AGIRLIK[x], 0),
      }
    })
    .filter((s) => s.bayraklar.length)
    .sort((a, b) => b.oncelik - a.oncelik || a.ad.localeCompare(b.ad, 'tr'))
}

export function ftrKohortFiltre(satirlar: FtrKohortSatir[], bayraklar: FtrKohortBayrak[]): FtrKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function ftrRecallMesaji(bayraklar: FtrKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('seans_gecikmis') ? 'tedavi / egzersiz takibi' : null,
    bayraklar.includes('olcek_yuksek') ? 'ağrı / fonksiyon formu' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
