/**
 * UROLOJI-EXCEPTIONAL-01 — Üroloji kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · PSA gecikmiş · IPSS yüksek · açık kırmızı bayrak.
 * Hatırlatma KLİNİK BİLGİ TAŞIMAZ (tanı, PSA sayı, IPSS skor, ilaç adı yok).
 */
export type UroKohortBayrak = 'gecikmis_kontrol' | 'psa_gecikmis' | 'ipss_yuksek' | 'risk_acik'

export const URO_BAYRAK_AD: Record<UroKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  psa_gecikmis: 'Gecikmiş PSA izlemi',
  ipss_yuksek: 'Yüksek IPSS bandı',
  risk_acik: 'Açık kırmızı bayrak',
}

export const PSA_GECIKME_GUN = 365

export interface UroKohortGirdi {
  patientId: string
  ad: string
  sonPsaTarihi: string | null
  /** son IPSS bandı — siddetli / orta ise ipss_yuksek */
  sonIpssBant: string | null
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface UroKohortSatir {
  patientId: string
  ad: string
  bayraklar: UroKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<UroKohortBayrak, number> = {
  risk_acik: 6,
  ipss_yuksek: 3,
  psa_gecikmis: 3,
  gecikmis_kontrol: 2,
}

function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}

export function uroKohortSatirlari(hastalar: UroKohortGirdi[], bugun: string): UroKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<UroKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /psa/.test(g.kod))) b.add('psa_gecikmis')
      if (h.sonPsaTarihi && gunFarki(h.sonPsaTarihi, bugun) > PSA_GECIKME_GUN) b.add('psa_gecikmis')
      if (h.sonIpssBant === 'siddetli' || h.sonIpssBant === 'orta') b.add('ipss_yuksek')
      if (gecikmis.some((g) => /ipss/.test(g.kod)) && (h.sonIpssBant === 'siddetli' || h.sonIpssBant === 'orta')) {
        b.add('ipss_yuksek')
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

export function uroKohortFiltre(satirlar: UroKohortSatir[], bayraklar: UroKohortBayrak[]): UroKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

/** Hastaya giden hatırlatma — tanı, PSA sayı, IPSS skor, ilaç adı YOK. */
export function uroRecallMesaji(bayraklar: UroKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('psa_gecikmis') ? 'planlanan kan testi' : null,
    bayraklar.includes('ipss_yuksek') ? 'semptom formu kontrolü' : null,
  ].filter(Boolean) as string[]
  const liste = nedenler.length ? nedenler.join(' ve ') : 'kontrol randevusu'
  return {
    konu: 'Kontrol zamanınız geldi',
    metin: `Merhaba, düzenli takibiniz kapsamında ${liste} zamanınız geldi. Uygun olduğunuz bir gün için randevu almanızı rica ederiz. Sorunuz varsa bu mesaja yanıt verebilirsiniz.`,
  }
}
