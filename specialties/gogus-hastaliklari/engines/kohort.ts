/**
 * GOGUS-EXCEPTIONAL-01 — Göğüs kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · gecikmiş spirometri · açık kırmızı bayrak · inhaler teknik.
 * Hastaya giden hatırlatma KLİNİK BİLGİ TAŞIMAZ (tanı, CAT skoru, doz yok).
 */
export type GogusKohortBayrak = 'gecikmis_kontrol' | 'spirometri_gecikmis' | 'risk_acik' | 'inhaler_teknik'

export const GOGUS_BAYRAK_AD: Record<GogusKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  spirometri_gecikmis: 'Gecikmiş spirometri / solunum testi',
  risk_acik: 'Açık kırmızı bayrak',
  inhaler_teknik: 'İnhaler teknik kontrolü',
}

export const SPIRO_GECIKME_GUN = 365

export interface GogusKohortGirdi {
  patientId: string
  ad: string
  sonSpiroTarihi: string | null
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface GogusKohortSatir {
  patientId: string
  ad: string
  bayraklar: GogusKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<GogusKohortBayrak, number> = {
  risk_acik: 6,
  spirometri_gecikmis: 3,
  inhaler_teknik: 2,
  gecikmis_kontrol: 2,
}

function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}

export function gogusKohortSatirlari(hastalar: GogusKohortGirdi[], bugun: string): GogusKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<GogusKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /spiro|sft|solunum_test/.test(g.kod))) b.add('spirometri_gecikmis')
      if (h.sonSpiroTarihi && gunFarki(h.sonSpiroTarihi, bugun) > SPIRO_GECIKME_GUN) b.add('spirometri_gecikmis')
      if (gecikmis.some((g) => /inhaler|teknik/.test(g.kod))) b.add('inhaler_teknik')
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

export function gogusKohortFiltre(satirlar: GogusKohortSatir[], bayraklar: GogusKohortBayrak[]): GogusKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function gogusRecallMesaji(bayraklar: GogusKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('spirometri_gecikmis') ? 'solunum testi' : null,
    bayraklar.includes('inhaler_teknik') ? 'inhaler teknik kontrolü' : null,
  ].filter(Boolean) as string[]
  const liste = nedenler.length ? nedenler.join(' ve ') : 'kontrol randevusu'
  return {
    konu: 'Kontrol zamanınız geldi',
    metin: `Merhaba, düzenli takibiniz kapsamında ${liste} zamanınız geldi. Uygun olduğunuz bir gün için randevu almanızı rica ederiz. Sorunuz varsa bu mesaja yanıt verebilirsiniz.`,
  }
}
