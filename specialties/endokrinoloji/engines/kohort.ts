/**
 * ENDOKRINOLOJI-EXCEPTIONAL-01 — Endokrinoloji kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · gecikmiş lab/DXA · açık acil · yüksek HbA1c.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, skor, ilaç adı, doz yok).
 */
export type EndoKohortBayrak = 'gecikmis_kontrol' | 'lab_izlem_gecikmis' | 'dxa_gecikmis' | 'risk_acik' | 'hba1c_yuksek'

export const ENDO_BAYRAK_AD: Record<EndoKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  lab_izlem_gecikmis: 'Gecikmiş HbA1c/TSH izlem',
  dxa_gecikmis: 'Gecikmiş DXA',
  risk_acik: 'Açık endokrin acil bayrağı',
  hba1c_yuksek: 'Yüksek HbA1c bandı',
}

export interface EndoKohortGirdi {
  patientId: string
  ad: string
  sonHba1cBant: string | null
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface EndoKohortSatir {
  patientId: string
  ad: string
  bayraklar: EndoKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<EndoKohortBayrak, number> = {
  risk_acik: 6,
  hba1c_yuksek: 3,
  lab_izlem_gecikmis: 3,
  dxa_gecikmis: 2,
  gecikmis_kontrol: 2,
}

export function endoKohortSatirlari(hastalar: EndoKohortGirdi[], bugun: string): EndoKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<EndoKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /hba1c|tsh|lab|ft4/.test(g.kod))) b.add('lab_izlem_gecikmis')
      if (gecikmis.some((g) => /dxa|kemik/.test(g.kod))) b.add('dxa_gecikmis')
      if (h.sonHba1cBant === 'yuksek') b.add('hba1c_yuksek')
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

export function endoKohortFiltre(satirlar: EndoKohortSatir[], bayraklar: EndoKohortBayrak[]): EndoKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function endoRecallMesaji(bayraklar: EndoKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('lab_izlem_gecikmis') ? 'kan tahlili kontrolü' : null,
    bayraklar.includes('dxa_gecikmis') ? 'kemik yoğunluğu testi' : null,
    bayraklar.includes('hba1c_yuksek') ? 'kan şekeri takip kontrolü' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
