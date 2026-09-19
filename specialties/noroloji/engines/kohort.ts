/**
 * NOROLOJI-EXCEPTIONAL-01 — Nöroloji kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · gecikmiş ilaç izlem · açık inme/TIA bayrağı · yüksek MIDAS.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, skor, ilaç adı, doz yok).
 */
export type NoroKohortBayrak = 'gecikmis_kontrol' | 'ilac_izlem_gecikmis' | 'risk_acik' | 'migren_yuksek'

export const NORO_BAYRAK_AD: Record<NoroKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  ilac_izlem_gecikmis: 'Gecikmiş ilaç izlem',
  risk_acik: 'Açık inme/TIA bayrağı',
  migren_yuksek: 'Yüksek migren engellilik',
}

export interface NoroKohortGirdi {
  patientId: string
  ad: string
  sonMigrenBant: string | null
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface NoroKohortSatir {
  patientId: string
  ad: string
  bayraklar: NoroKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<NoroKohortBayrak, number> = {
  risk_acik: 6,
  migren_yuksek: 3,
  ilac_izlem_gecikmis: 3,
  gecikmis_kontrol: 2,
}

export function noroKohortSatirlari(hastalar: NoroKohortGirdi[], bugun: string): NoroKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<NoroKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /ilac|aed|noro_izlem/.test(g.kod))) b.add('ilac_izlem_gecikmis')
      if (h.sonMigrenBant === 'siddetli' || h.sonMigrenBant === 'orta') b.add('migren_yuksek')
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

export function noroKohortFiltre(satirlar: NoroKohortSatir[], bayraklar: NoroKohortBayrak[]): NoroKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function noroRecallMesaji(bayraklar: NoroKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('ilac_izlem_gecikmis') ? 'ilaç güvenlik kontrolü' : null,
    bayraklar.includes('migren_yuksek') ? 'baş ağrısı takip formu' : null,
  ].filter(Boolean)
  return {
    konu: 'Kontrol / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
