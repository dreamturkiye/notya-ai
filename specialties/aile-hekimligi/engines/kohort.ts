/**
 * AILE-HEKIMLIGI-EXCEPTIONAL-01 — Aile hekimliği kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · aşı/tarama vadesi · kronik izlem · açık sevk/acil bayrağı.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, skor, ilaç adı, doz yok).
 */
export type AileKohortBayrak = 'gecikmis_kontrol' | 'asi_tarama_gecikmis' | 'kronik_gecikmis' | 'risk_acik'

export const AILE_BAYRAK_AD: Record<AileKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  asi_tarama_gecikmis: 'Gecikmiş aşı/tarama',
  kronik_gecikmis: 'Gecikmiş kronik izlem',
  risk_acik: 'Açık sevk/acil bayrağı',
}

export interface AileKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface AileKohortSatir {
  patientId: string
  ad: string
  bayraklar: AileKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<AileKohortBayrak, number> = {
  risk_acik: 6,
  kronik_gecikmis: 3,
  asi_tarama_gecikmis: 3,
  gecikmis_kontrol: 2,
}

export function aileKohortSatirlari(hastalar: AileKohortGirdi[], bugun: string): AileKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<AileKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /asi_tarama|asi|tarama|grip|hpv|kolon|meme|serviks/.test(g.kod))) b.add('asi_tarama_gecikmis')
      if (gecikmis.some((g) => /kronik|dm|ht|lipid|solunum|tiroid/.test(g.kod))) b.add('kronik_gecikmis')
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

export function aileKohortFiltre(satirlar: AileKohortSatir[], bayraklar: AileKohortBayrak[]): AileKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function aileRecallMesaji(bayraklar: AileKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('asi_tarama_gecikmis') ? 'aşı veya tarama hatırlatması' : null,
    bayraklar.includes('kronik_gecikmis') ? 'kronik takip kontrolü' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
