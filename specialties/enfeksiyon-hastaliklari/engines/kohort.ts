/**
 * ENFEKSIYON-EXCEPTIONAL-01 — Enfeksiyon kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · ATB bitiş · viral izlem · izolasyon · açık acil.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, skor, ilaç adı, doz yok).
 */
export type EnfKohortBayrak =
  | 'gecikmis_kontrol'
  | 'atb_bitis_gecikmis'
  | 'viral_izlem_gecikmis'
  | 'izolasyon_gecikmis'
  | 'risk_acik'

export const ENF_BAYRAK_AD: Record<EnfKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  atb_bitis_gecikmis: 'Gecikmiş antibiyotik süre bitişi',
  viral_izlem_gecikmis: 'Gecikmiş viral izlem',
  izolasyon_gecikmis: 'Gecikmiş izolasyon / bildirim',
  risk_acik: 'Açık enfeksiyon acil bayrağı',
}

export interface EnfKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface EnfKohortSatir {
  patientId: string
  ad: string
  bayraklar: EnfKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<EnfKohortBayrak, number> = {
  risk_acik: 6,
  atb_bitis_gecikmis: 3,
  viral_izlem_gecikmis: 3,
  izolasyon_gecikmis: 2,
  gecikmis_kontrol: 2,
}

export function enfKohortSatirlari(hastalar: EnfKohortGirdi[], bugun: string): EnfKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<EnfKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu|asi/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /atb/.test(g.kod))) b.add('atb_bitis_gecikmis')
      if (gecikmis.some((g) => /viral|hiv|hbv|hcv|cd4/.test(g.kod))) b.add('viral_izlem_gecikmis')
      if (gecikmis.some((g) => /izolasyon|bildirim/.test(g.kod))) b.add('izolasyon_gecikmis')
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

export function enfKohortFiltre(satirlar: EnfKohortSatir[], bayraklar: EnfKohortBayrak[]): EnfKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function enfRecallMesaji(bayraklar: EnfKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('atb_bitis_gecikmis') ? 'ilaç süre kontrolü' : null,
    bayraklar.includes('viral_izlem_gecikmis') ? 'kan tahlili kontrolü' : null,
    bayraklar.includes('izolasyon_gecikmis') ? 'izolasyon / takip kontrolü' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
