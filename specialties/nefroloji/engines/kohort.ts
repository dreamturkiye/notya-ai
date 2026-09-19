/**
 * NEFROLOJI-EXCEPTIONAL-01 — Nefroloji kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · gecikmiş eGFR/anemi · diyaliz · açık acil · KDIGO kırmızı.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, skor, ilaç adı, doz yok).
 */
export type NefKohortBayrak =
  | 'gecikmis_kontrol'
  | 'egfr_izlem_gecikmis'
  | 'anemi_izlem_gecikmis'
  | 'diyaliz_gecikmis'
  | 'risk_acik'
  | 'kdigo_kirmizi'

export const NEF_BAYRAK_AD: Record<NefKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  egfr_izlem_gecikmis: 'Gecikmiş eGFR/UACR izlem',
  anemi_izlem_gecikmis: 'Gecikmiş anemi izlem',
  diyaliz_gecikmis: 'Gecikmiş diyaliz seans',
  risk_acik: 'Açık nefro acil bayrağı',
  kdigo_kirmizi: 'KDIGO çok yüksek risk',
}

export interface NefKohortGirdi {
  patientId: string
  ad: string
  sonKdigoRenk: string | null
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface NefKohortSatir {
  patientId: string
  ad: string
  bayraklar: NefKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<NefKohortBayrak, number> = {
  risk_acik: 6,
  kdigo_kirmizi: 4,
  diyaliz_gecikmis: 3,
  egfr_izlem_gecikmis: 3,
  anemi_izlem_gecikmis: 2,
  gecikmis_kontrol: 2,
}

export function nefKohortSatirlari(hastalar: NefKohortGirdi[], bugun: string): NefKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<NefKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /egfr|uacr|kdigo|lab/.test(g.kod))) b.add('egfr_izlem_gecikmis')
      if (gecikmis.some((g) => /anemi|hb|hemoglobin/.test(g.kod))) b.add('anemi_izlem_gecikmis')
      if (gecikmis.some((g) => /diyaliz|seans/.test(g.kod))) b.add('diyaliz_gecikmis')
      if (h.sonKdigoRenk === 'kirmizi') b.add('kdigo_kirmizi')
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

export function nefKohortFiltre(satirlar: NefKohortSatir[], bayraklar: NefKohortBayrak[]): NefKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function nefRecallMesaji(bayraklar: NefKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('egfr_izlem_gecikmis') ? 'kan tahlili kontrolü' : null,
    bayraklar.includes('anemi_izlem_gecikmis') ? 'kan sayımı kontrolü' : null,
    bayraklar.includes('diyaliz_gecikmis') ? 'diyaliz seans / takip' : null,
    bayraklar.includes('kdigo_kirmizi') ? 'böbrek takip kontrolü' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
