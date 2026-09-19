/**
 * KARDIO-EXCEPTIONAL-01 — Kardiyoloji kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · gecikmiş lab/EKG · açık kırmızı bayrak · yüksek SCORE2 izlemsiz.
 * Hatırlatma metni klinik bilgi taşımaz.
 */
export type KardioKohortBayrak = 'gecikmis_kontrol' | 'lab_ekg_gecikmis' | 'risk_acik' | 'yuksek_risk_izlem'

export const KARDIO_BAYRAK_AD: Record<KardioKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  lab_ekg_gecikmis: 'Gecikmiş lab / EKG',
  risk_acik: 'Açık kırmızı bayrak',
  yuksek_risk_izlem: 'Yüksek risk — izlem gecikmesi',
}

export interface KardioKohortGirdi {
  patientId: string
  ad: string
  sonScore2Pct: number | null
  sonScore2Kova: string | null
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface KardioKohortSatir {
  patientId: string
  ad: string
  bayraklar: KardioKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<KardioKohortBayrak, number> = {
  risk_acik: 6,
  yuksek_risk_izlem: 4,
  lab_ekg_gecikmis: 3,
  gecikmis_kontrol: 2,
}

export function kardioKohortSatirlari(hastalar: KardioKohortGirdi[], bugun: string): KardioKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<KardioKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu|kb_/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /lab|ekg|belge|inr|elektrolit/.test(g.kod))) b.add('lab_ekg_gecikmis')
      if (
        (h.sonScore2Kova === 'cok_yuksek' || h.sonScore2Kova === 'yuksek' || (h.sonScore2Pct != null && h.sonScore2Pct >= 10))
        && ((h.sonrakiKontrol && h.sonrakiKontrol < bugun) || gecikmis.length)
      ) {
        b.add('yuksek_risk_izlem')
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

export function kardioKohortFiltre(satirlar: KardioKohortSatir[], bayraklar: KardioKohortBayrak[]): KardioKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function kardioRecallMesaji(bayraklar: KardioKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('lab_ekg_gecikmis') ? 'planlanan tetkik' : null,
    bayraklar.includes('yuksek_risk_izlem') ? 'kalp sağlığı kontrolü' : null,
  ].filter(Boolean) as string[]
  const liste = nedenler.length ? nedenler.join(' ve ') : 'kontrol randevusu'
  return {
    konu: 'Kontrol zamanınız geldi',
    metin: `Merhaba, düzenli takibiniz kapsamında ${liste} zamanınız geldi. Uygun olduğunuz bir gün için randevu almanızı rica ederiz. Sorunuz varsa bu mesaja yanıt verebilirsiniz.`,
  }
}
