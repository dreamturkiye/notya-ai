/**
 * SPOR-HEKIMLIGI-EXCEPTIONAL-01 — Spor kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · RTP gecikmiş · aktif sakatlık · yüklenme uyarısı · açık risk.
 * Hatırlatma KLİNİK BİLGİ TAŞIMAZ (tanı, doz, doping, skor yok).
 */
export type SporKohortBayrak =
  | 'gecikmis_kontrol'
  | 'rtp_gecikmis'
  | 'sakatlik_aktif'
  | 'yuklenme_uyari'
  | 'risk_acik'

export const SPOR_BAYRAK_AD: Record<SporKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  rtp_gecikmis: 'Gecikmiş RTP kontrolü',
  sakatlik_aktif: 'Aktif sakatlık izlemi',
  yuklenme_uyari: 'Yüklenme uyarısı',
  risk_acik: 'Açık kırmızı bayrak',
}

export interface SporKohortGirdi {
  patientId: string
  ad: string
  sonRtpBasamak: number | null
  sonRtpTarihi: string | null
  aktifSakatlik: boolean
  yuklenmeUyari: boolean
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface SporKohortSatir {
  patientId: string
  ad: string
  bayraklar: SporKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<SporKohortBayrak, number> = {
  risk_acik: 6,
  yuklenme_uyari: 4,
  sakatlik_aktif: 3,
  rtp_gecikmis: 3,
  gecikmis_kontrol: 2,
}

const RTP_TAZELIK_GUN = 14

function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}

export function sporKohortSatirlari(hastalar: SporKohortGirdi[], bugun: string): SporKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<SporKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      if (h.yuklenmeUyari) b.add('yuklenme_uyari')
      if (h.aktifSakatlik) b.add('sakatlik_aktif')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /rtp/.test(g.kod))) b.add('rtp_gecikmis')
      if (h.sonRtpTarihi && h.sonRtpBasamak != null && h.sonRtpBasamak < 5 && gunFarki(h.sonRtpTarihi, bugun) > RTP_TAZELIK_GUN) {
        b.add('rtp_gecikmis')
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

export function sporKohortFiltre(satirlar: SporKohortSatir[], bayraklar: SporKohortBayrak[]): SporKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

/** Hastaya giden hatırlatma — tanı, doz, doping, skor YOK. */
export function sporRecallMesaji(bayraklar: SporKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('rtp_gecikmis') ? 'antrenmana dönüş planı kontrolü' : null,
    bayraklar.includes('sakatlik_aktif') ? 'sakatlık izlem kontrolü' : null,
    bayraklar.includes('yuklenme_uyari') ? 'antrenman yükü değerlendirmesi' : null,
  ].filter(Boolean) as string[]
  const liste = nedenler.length ? nedenler.join(' ve ') : 'kontrol randevusu'
  return {
    konu: 'Kontrol zamanınız geldi',
    metin: `Merhaba, düzenli takibiniz kapsamında ${liste} zamanınız geldi. Uygun olduğunuz bir gün için randevu almanızı rica ederiz. Sorunuz varsa bu mesaja yanıt verebilirsiniz.`,
  }
}
