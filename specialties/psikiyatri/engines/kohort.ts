/**
 * PSIK-EXCEPTIONAL-01 — Psikiyatri kohort paneli (hekimin tüm psikiyatri hastaları). SAF fonksiyon.
 * Aynı desen: specialties/dahiliye/engines/kohort.ts. YENİ klinik mantık yok: yalnız psik_olcek,
 * psik_risk ve psik_gorevleri satırlarının okunması.
 *
 * Bayraklar: PHQ-9 yüksek · açık risk bayrağı · gecikmiş kontrol · gecikmiş lityum/valproat düzeyi.
 * Hastaya giden hatırlatma metni KLİNİK BİLGİ TAŞIMAZ (tanı, ölçek adı, skor, ilaç adı yok) — ruh
 * sağlığı verisi en hassas veri sınıfıdır ve hatırlatma "kontrol randevusu" dilindedir.
 */
export type PsikKohortBayrak = 'phq_yuksek' | 'risk_acik' | 'gecikmis_kontrol' | 'li_duzey_gecikmis'

export const PSIK_BAYRAK_AD: Record<PsikKohortBayrak, string> = {
  phq_yuksek: 'PHQ-9 yüksek',
  risk_acik: 'Açık güvenlik bayrağı',
  gecikmis_kontrol: 'Gecikmiş kontrol',
  li_duzey_gecikmis: 'Gecikmiş Li/VPA düzeyi',
}

/** PHQ-9 ≥15 (orta-şiddetli ve üzeri) kohort eşiği — tanı değil, öncelik sıralaması içindir. */
export const PHQ_KOHORT_ESIGI = 15

export interface PsikKohortGirdi {
  patientId: string
  ad: string
  phq9: number | null
  phq9Madde9: boolean
  /** hekim onayı verilmemiş açık risk bayrakları */
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface PsikKohortSatir {
  patientId: string
  ad: string
  bayraklar: PsikKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

/** Ağırlıklar: güvenlik her zaman en üstte. */
const AGIRLIK: Record<PsikKohortBayrak, number> = {
  risk_acik: 6,
  phq_yuksek: 4,
  li_duzey_gecikmis: 3,
  gecikmis_kontrol: 2,
}

export function psikKohortSatirlari(hastalar: PsikKohortGirdi[], bugun: string): PsikKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<PsikKohortBayrak>()
      if ((h.phq9 != null && h.phq9 >= PHQ_KOHORT_ESIGI) || h.phq9Madde9) b.add('phq_yuksek')
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /lityum|valproat/.test(g.kod))) b.add('li_duzey_gecikmis')
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

export function psikKohortFiltre(satirlar: PsikKohortSatir[], bayraklar: PsikKohortBayrak[]): PsikKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

/**
 * Hastaya giden hatırlatma. Ruh sağlığı bağlamı YAZILMAZ: ne tanı, ne ölçek adı, ne skor, ne ilaç.
 * Açık güvenlik bayrağı olan hasta portal mesajı ile "yönetilmez" — hekim telefonla arar; bu yüzden
 * risk_acik satırında hatırlatma metni bilerek "sizi arayacağız" dilindedir.
 */
export function psikRecallMesaji(bayraklar: PsikKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const labMi = bayraklar.includes('li_duzey_gecikmis')
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') || bayraklar.includes('phq_yuksek') ? 'kontrol randevusu' : null,
    labMi ? 'takip kan testi' : null,
  ].filter(Boolean) as string[]
  const liste = nedenler.length ? nedenler.join(' ve ') : 'kontrol randevusu'
  return {
    konu: 'Kontrol zamanınız geldi',
    metin: `Merhaba, düzenli takibiniz kapsamında ${liste} zamanınız geldi. Uygun olduğunuz bir gün için randevu almanızı rica ederiz. Sorunuz varsa bu mesaja yanıt verebilirsiniz.`,
  }
}
