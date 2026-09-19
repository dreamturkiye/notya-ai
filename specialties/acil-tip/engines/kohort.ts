/**
 * ACIL-TIP-EXCEPTIONAL-01 — Acil Tıp kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · ESI yüksek · kritik yol · sevk · açık risk.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, doz yok). Bed board HIS yok.
 */
export type AtKohortBayrak = 'gecikmis_kontrol' | 'esi_yuksek' | 'kritik_yol' | 'sevk_izlem' | 'risk_acik'

export const AT_BAYRAK_AD: Record<AtKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş acil sonrası kontrol',
  esi_yuksek: 'ESI 1–2 izlem',
  kritik_yol: 'Kritik yol izlem',
  sevk_izlem: 'Sevk / yatış / taburcu paket',
  risk_acik: 'Açık acil kırmızı bayrak',
}

export interface AtKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
  esiSeviye: number | null
  kritikYolVar: boolean
  sevkVar: boolean
}

export interface AtKohortSatir {
  patientId: string
  ad: string
  bayraklar: AtKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<AtKohortBayrak, number> = {
  risk_acik: 6,
  esi_yuksek: 4,
  kritik_yol: 3,
  sevk_izlem: 2,
  gecikmis_kontrol: 2,
}

export function atKohortSatirlari(hastalar: AtKohortGirdi[], bugun: string): AtKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<AtKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      if (h.esiSeviye != null && h.esiSeviye <= 2) b.add('esi_yuksek')
      if (h.kritikYolVar) b.add('kritik_yol')
      if (h.sevkVar) b.add('sevk_izlem')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|taburcu|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kritik|stemi|inme|travma|sepsis/.test(g.kod))) b.add('kritik_yol')
      if (gecikmis.some((g) => /sevk|yat[iı][sş]|taburcu/.test(g.kod))) b.add('sevk_izlem')
      if (gecikmis.some((g) => /esi|resus/.test(g.kod))) b.add('esi_yuksek')
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

export function atKohortFiltre(satirlar: AtKohortSatir[], bayraklar: AtKohortBayrak[]): AtKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function atRecallMesaji(bayraklar: AtKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Acil servisimiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'acil sonrası kontrol' : null,
    bayraklar.includes('kritik_yol') ? 'takip kontrolü' : null,
    bayraklar.includes('sevk_izlem') ? 'sevk / taburcu takibi' : null,
    bayraklar.includes('esi_yuksek') ? 'yeniden değerlendirme' : null,
  ].filter(Boolean)
  return {
    konu: 'Acil sonrası takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ') || 'kontrol'} için sizinle iletişime geçmek istiyoruz. Randevu için arayın. Acil durumda 112.`,
  }
}
