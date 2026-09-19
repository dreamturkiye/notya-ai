/**
 * RADYOLOJI-EXCEPTIONAL-01 — Radyoloji kohort paneli. SAF fonksiyon.
 * Bayraklar: gecikmiş kontrol · kuyruk · rapor · kritik · belge.
 * Hatırlatma klinik bilgi TAŞIMAZ (tanı, BI-RADS sayı, AI bulgu yok).
 */
export type RadyoKohortBayrak = 'gecikmis_kontrol' | 'kuyruk_bekliyor' | 'rapor_bekliyor' | 'kritik_acik' | 'belge_bekliyor'

export const RADYO_BAYRAK_AD: Record<RadyoKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  kuyruk_bekliyor: 'Tetkik kuyruğunda',
  rapor_bekliyor: 'Rapor bekliyor',
  kritik_acik: 'Açık kritik bulgu bildirimi',
  belge_bekliyor: 'Belge / görüntü köprüsü',
}

export interface RadyoKohortGirdi {
  patientId: string
  ad: string
  acikKritikBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
  belgeBekliyor: boolean
  kuyrukAktif: boolean
}

export interface RadyoKohortSatir {
  patientId: string
  ad: string
  bayraklar: RadyoKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

const AGIRLIK: Record<RadyoKohortBayrak, number> = {
  kritik_acik: 6,
  kuyruk_bekliyor: 3,
  rapor_bekliyor: 3,
  gecikmis_kontrol: 2,
  belge_bekliyor: 2,
}

export function radyoKohortSatirlari(hastalar: RadyoKohortGirdi[], bugun: string): RadyoKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<RadyoKohortBayrak>()
      if (h.acikKritikBayraklari.length) b.add('kritik_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (h.kuyrukAktif || gecikmis.some((g) => /kuyruk|tetkik/.test(g.kod))) b.add('kuyruk_bekliyor')
      if (gecikmis.some((g) => /rapor/.test(g.kod))) b.add('rapor_bekliyor')
      if (h.belgeBekliyor || gecikmis.some((g) => /belge|goruntu|mamografi|bt|mri/.test(g.kod))) b.add('belge_bekliyor')
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

export function radyoKohortFiltre(satirlar: RadyoKohortSatir[], bayraklar: RadyoKohortBayrak[]): RadyoKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

export function radyoRecallMesaji(bayraklar: RadyoKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('kritik_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('kuyruk_bekliyor') ? 'tetkik randevusu' : null,
    bayraklar.includes('rapor_bekliyor') ? 'rapor / sonuç kontrolü' : null,
    bayraklar.includes('belge_bekliyor') ? 'görüntü / belge kontrolü' : null,
  ].filter(Boolean)
  return {
    konu: 'Tetkik / takip hatırlatması',
    metin: `Merhaba, ${nedenler.join(' ve ')} için sizinle iletişime geçmek istiyoruz. Randevu için muayenehanemizi arayın. Acil durumda 112.`,
  }
}
