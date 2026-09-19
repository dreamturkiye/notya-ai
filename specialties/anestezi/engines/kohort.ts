/**
 * ANESTEZI-EXCEPTIONAL-01 — Anestezi kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · ASA · hava yolu · ağrı · alerji/ilaç · açık acil.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, doz yok). Genel cerrahi pre-op tile değildir.
 */
export type AnesteziKohortBayrak =
  | 'gecikmis_kontrol'
  | 'asa_eksik'
  | 'hava_yolu'
  | 'agri_izlem'
  | 'alerji_ilac'
  | 'risk_acik'

export const ANESTEZI_BAYRAK_AD: Record<AnesteziKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  asa_eksik: 'ASA / pre-op görevi',
  hava_yolu: 'Hava yolu notu',
  agri_izlem: 'Post-op ağrı izlem',
  alerji_ilac: 'Alerji / ilaç bayrağı',
  risk_acik: 'Açık anestezi acil bayrağı',
}

export interface AnesteziKohortGirdi {
  patientId: string
  ad: string
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
  alerjiIlacBayrak: boolean
}

export interface AnesteziKohortSatir {
  patientId: string
  ad: string
  bayraklar: AnesteziKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<AnesteziKohortBayrak, number> = {
  risk_acik: 6,
  alerji_ilac: 4,
  hava_yolu: 3,
  asa_eksik: 3,
  agri_izlem: 2,
  gecikmis_kontrol: 2,
}

export function anesteziKohortSatirlari(hastalar: AnesteziKohortGirdi[], bugun: string): AnesteziKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<AnesteziKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      if (h.alerjiIlacBayrak) b.add('alerji_ilac')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu|pre.?op/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /asa|preop|pre_op/.test(g.kod))) b.add('asa_eksik')
      if (gecikmis.some((g) => /hava.?yolu|mallampati|entub/.test(g.kod))) b.add('hava_yolu')
      if (gecikmis.some((g) => /agri|analjezi/.test(g.kod))) b.add('agri_izlem')
      if (gecikmis.some((g) => /alerji|ilac/.test(g.kod))) b.add('alerji_ilac')
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

export function anesteziKohortFiltre(satirlar: AnesteziKohortSatir[], bayraklar: AnesteziKohortBayrak[]): AnesteziKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function anesteziRecallMesaji(bayraklar: AnesteziKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('asa_eksik') ? 'anestezi öncesi değerlendirme' : null,
    bayraklar.includes('hava_yolu') ? 'hava yolu notu kontrolü' : null,
    bayraklar.includes('agri_izlem') ? 'ağrı izlem kontrolü' : null,
    bayraklar.includes('alerji_ilac') ? 'alerji / ilaç listesi güncellemesi' : null,
  ].filter(Boolean)
  return {
    konu: 'Anestezi öncesi / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
