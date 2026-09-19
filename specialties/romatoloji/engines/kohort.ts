/**
 * ROMATOLOJI-EXCEPTIONAL-01 — Romatoloji kohort paneli. SAF fonksiyon.
 */
export type RomaKohortBayrak = 'gecikmis_kontrol' | 'lab_izlem_gecikmis' | 'skor_yuksek' | 'risk_acik' | 'sut_eksik'

export const ROMA_BAYRAK_AD: Record<RomaKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  lab_izlem_gecikmis: 'Gecikmiş CRP/ESR izlem',
  skor_yuksek: 'Yüksek DAS28/BASDAI bandı',
  risk_acik: 'Açık romatoloji acil bayrağı',
  sut_eksik: 'Biyolojik SUT eksik madde',
}

export interface RomaKohortGirdi {
  patientId: string
  ad: string
  sonSkorBant: string | null
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
  sutEksik?: boolean
}

export interface RomaKohortSatir {
  patientId: string
  ad: string
  bayraklar: RomaKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<RomaKohortBayrak, number> = {
  risk_acik: 6,
  skor_yuksek: 3,
  lab_izlem_gecikmis: 3,
  sut_eksik: 2,
  gecikmis_kontrol: 2,
}

export function romaKohortSatirlari(hastalar: RomaKohortGirdi[], bugun: string): RomaKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<RomaKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /crp|esr|lab/.test(g.kod))) b.add('lab_izlem_gecikmis')
      if (h.sonSkorBant === 'yuksek') b.add('skor_yuksek')
      if (h.sutEksik) b.add('sut_eksik')
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

export function romaKohortFiltre(satirlar: RomaKohortSatir[], bayraklar: RomaKohortBayrak[]): RomaKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function romaRecallMesaji(bayraklar: RomaKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('lab_izlem_gecikmis') ? 'kan tahlili kontrolü' : null,
    bayraklar.includes('skor_yuksek') ? 'eklem takip kontrolü' : null,
    bayraklar.includes('sut_eksik') ? 'belge / rapor işlemi' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
