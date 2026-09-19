/**
 * BEYIN-CERRAHISI-EXCEPTIONAL-01 — Beyin cerrahisi kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · post-op · bilinç · açık acil · görüntü.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, AED doz yok). Nöroloji Migren/İnme bayrağı yok.
 */
export type BcKohortBayrak = 'gecikmis_kontrol' | 'postop_izlem' | 'bilinc_izlem' | 'risk_acik' | 'goruntu_bekliyor'

export const BC_BAYRAK_AD: Record<BcKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  postop_izlem: 'Post-op izlem görevi',
  bilinc_izlem: 'Nöbet / bilinç izlem',
  risk_acik: 'Açık nöroşirürji acil bayrağı',
  goruntu_bekliyor: 'Görüntü / belge zaman çizelgesi',
}

export interface BcKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
  goruntuBekliyor: boolean
}

export interface BcKohortSatir {
  patientId: string
  ad: string
  bayraklar: BcKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<BcKohortBayrak, number> = {
  risk_acik: 6,
  bilinc_izlem: 4,
  postop_izlem: 3,
  gecikmis_kontrol: 2,
  goruntu_bekliyor: 2,
}

export function bcKohortSatirlari(hastalar: BcKohortGirdi[], bugun: string): BcKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<BcKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /postop|yara/.test(g.kod))) b.add('postop_izlem')
      if (gecikmis.some((g) => /bilinc|nobet/.test(g.kod))) b.add('bilinc_izlem')
      if (h.goruntuBekliyor || gecikmis.some((g) => /goruntu|bt|mri|rapor|belge/.test(g.kod))) b.add('goruntu_bekliyor')
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

export function bcKohortFiltre(satirlar: BcKohortSatir[], bayraklar: BcKohortBayrak[]): BcKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function bcRecallMesaji(bayraklar: BcKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('postop_izlem') ? 'ameliyat sonrası kontrol' : null,
    bayraklar.includes('bilinc_izlem') ? 'izlem kontrolü' : null,
    bayraklar.includes('goruntu_bekliyor') ? 'görüntü / belge kontrolü' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
