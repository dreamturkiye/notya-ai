/**
 * GASTROENTEROLOJI-EXCEPTIONAL-01 — Gastroenteroloji kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · skor/hepatit/endoskopi · açık acil · yüksek skor bandı · rejim.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, skor, ilaç adı, doz yok).
 */
export type GastroKohortBayrak =
  | 'gecikmis_kontrol'
  | 'skor_izlem_gecikmis'
  | 'hepatit_izlem_gecikmis'
  | 'endoskopi_gecikmis'
  | 'rejim_gecikmis'
  | 'risk_acik'
  | 'skor_yuksek'

export const GASTRO_BAYRAK_AD: Record<GastroKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  skor_izlem_gecikmis: 'Gecikmiş IBD/IBS takip',
  hepatit_izlem_gecikmis: 'Gecikmiş HBV/HCV izlem',
  endoskopi_gecikmis: 'Gecikmiş endoskopi kontrolü',
  rejim_gecikmis: 'Gecikmiş PPI/biyolojik kontrol',
  risk_acik: 'Açık GI acil bayrağı',
  skor_yuksek: 'Yüksek aktivite bandı',
}

export interface GastroKohortGirdi {
  patientId: string
  ad: string
  sonSkorBant: string | null
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface GastroKohortSatir {
  patientId: string
  ad: string
  bayraklar: GastroKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<GastroKohortBayrak, number> = {
  risk_acik: 6,
  skor_yuksek: 3,
  skor_izlem_gecikmis: 3,
  hepatit_izlem_gecikmis: 3,
  endoskopi_gecikmis: 2,
  rejim_gecikmis: 2,
  gecikmis_kontrol: 2,
}

export function gastroKohortSatirlari(hastalar: GastroKohortGirdi[], bugun: string): GastroKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<GastroKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /skor|mayo|hbi|ibs/.test(g.kod))) b.add('skor_izlem_gecikmis')
      if (gecikmis.some((g) => /hbv|hcv|hepatit/.test(g.kod))) b.add('hepatit_izlem_gecikmis')
      if (gecikmis.some((g) => /endoskopi|kolonoskopi|egd/.test(g.kod))) b.add('endoskopi_gecikmis')
      if (gecikmis.some((g) => /rejim_ppi|rejim_biyolojik|ppi|biyolojik/.test(g.kod))) b.add('rejim_gecikmis')
      if (h.sonSkorBant === 'siddetli' || h.sonSkorBant === 'orta') b.add('skor_yuksek')
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

export function gastroKohortFiltre(satirlar: GastroKohortSatir[], bayraklar: GastroKohortBayrak[]): GastroKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function gastroRecallMesaji(bayraklar: GastroKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('skor_izlem_gecikmis') ? 'takip formu kontrolü' : null,
    bayraklar.includes('hepatit_izlem_gecikmis') ? 'kan tahlili kontrolü' : null,
    bayraklar.includes('endoskopi_gecikmis') ? 'endoskopi kontrolü' : null,
    bayraklar.includes('rejim_gecikmis') ? 'tedavi kontrol randevusu' : null,
    bayraklar.includes('skor_yuksek') ? 'takip kontrolü' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
