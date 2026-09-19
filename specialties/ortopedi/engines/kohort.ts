/**
 * ORTOPEDI-EXCEPTIONAL-01 — Ortopedi kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · alçı/yük gecikmiş · VAS yüksek · açık kırmızı bayrak.
 * Hatırlatma KLİNİK BİLGİ TAŞIMAZ (tanı, VAS sayı, doz yok).
 */
export type OrtoKohortBayrak = 'gecikmis_kontrol' | 'alci_gecikmis' | 'vas_yuksek' | 'risk_acik'

export const ORTO_BAYRAK_AD: Record<OrtoKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  alci_gecikmis: 'Gecikmiş alçı / yük izlemi',
  vas_yuksek: 'Yüksek VAS/fonksiyon bandı',
  risk_acik: 'Açık kırmızı bayrak',
}

export interface OrtoKohortGirdi {
  patientId: string
  ad: string
  sonVasBant: string | null
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface OrtoKohortSatir {
  patientId: string
  ad: string
  bayraklar: OrtoKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<OrtoKohortBayrak, number> = {
  risk_acik: 6,
  vas_yuksek: 3,
  alci_gecikmis: 3,
  gecikmis_kontrol: 2,
}

export function ortoKohortSatirlari(hastalar: OrtoKohortGirdi[], bugun: string): OrtoKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<OrtoKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu|op_kontrol/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /alci|yuk_verme|ortez/.test(g.kod))) b.add('alci_gecikmis')
      if (h.sonVasBant === 'siddetli' || h.sonVasBant === 'orta') b.add('vas_yuksek')
      if (gecikmis.some((g) => /vas/.test(g.kod)) && (h.sonVasBant === 'siddetli' || h.sonVasBant === 'orta')) {
        b.add('vas_yuksek')
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

export function ortoKohortFiltre(satirlar: OrtoKohortSatir[], bayraklar: OrtoKohortBayrak[]): OrtoKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

/** Hastaya giden hatırlatma — tanı, VAS sayı, ilaç adı YOK. */
export function ortoRecallMesaji(bayraklar: OrtoKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('alci_gecikmis') ? 'alçı / ortez kontrolü' : null,
    bayraklar.includes('vas_yuksek') ? 'ağrı ve fonksiyon formu kontrolü' : null,
  ].filter(Boolean) as string[]
  const liste = nedenler.length ? nedenler.join(' ve ') : 'kontrol randevusu'
  return {
    konu: 'Kontrol zamanınız geldi',
    metin: `Merhaba, düzenli takibiniz kapsamında ${liste} zamanınız geldi. Uygun olduğunuz bir gün için randevu almanızı rica ederiz. Sorunuz varsa bu mesaja yanıt verebilirsiniz.`,
  }
}
