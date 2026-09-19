/**
 * KBB-EXCEPTIONAL-01 — KBB kohort paneli (hekimin tüm KBB hastaları). SAF fonksiyon.
 * Aynı desen: specialties/psikiyatri/engines/kohort.ts. YENİ klinik mantık yok: yalnız hasta_kbb,
 * kbb_odyometri, kbb_risk ve kbb_gorevleri satırlarının okunması.
 *
 * Bayraklar: gecikmiş kontrol · gecikmiş odyometri · açık kırmızı bayrak · bekleyen OSAS sevki.
 * Hastaya giden hatırlatma metni KLİNİK BİLGİ TAŞIMAZ (tanı, dB değeri, kayıp bandı, ilaç adı yok).
 */
export type KbbKohortBayrak = 'gecikmis_kontrol' | 'odyo_gecikmis' | 'risk_acik' | 'osas_sevk'

export const KBB_BAYRAK_AD: Record<KbbKohortBayrak, string> = {
  gecikmis_kontrol: 'Gecikmiş kontrol',
  odyo_gecikmis: 'Gecikmiş odyometri',
  risk_acik: 'Açık kırmızı bayrak',
  osas_sevk: 'Bekleyen OSAS sevki',
}

/** Odyometri "gecikmiş" eşiği (gün) — kohort sıralaması içindir, klinik kural değildir. */
export const ODYO_GECIKME_GUN = 365

export interface KbbKohortGirdi {
  patientId: string
  ad: string
  /** en son odyometri tarihi (ISO) — yoksa null */
  sonOdyoTarihi: string | null
  /** hekim onayı verilmemiş açık kırmızı bayraklar */
  acikRiskBayraklari: string[]
  sonrakiKontrol: string | null
  gorevler: Array<{ kod: string; due: string | null }>
  sonVizit: string | null
  portalVar: boolean
}

export interface KbbKohortSatir {
  patientId: string
  ad: string
  bayraklar: KbbKohortBayrak[]
  gecikmisSayi: number
  sonVizit: string | null
  portalVar: boolean
  oncelik: number
}

/** Ağırlıklar: kırmızı bayrak her zaman en üstte. */
const AGIRLIK: Record<KbbKohortBayrak, number> = {
  risk_acik: 6,
  osas_sevk: 3,
  odyo_gecikmis: 3,
  gecikmis_kontrol: 2,
}

function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000)
}

export function kbbKohortSatirlari(hastalar: KbbKohortGirdi[], bugun: string): KbbKohortSatir[] {
  return hastalar
    .map((h) => {
      const b = new Set<KbbKohortBayrak>()
      if (h.acikRiskBayraklari.length) b.add('risk_acik')
      const gecikmis = h.gorevler.filter((g) => g.due && g.due < bugun)
      if (h.sonrakiKontrol && h.sonrakiKontrol < bugun) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /kontrol|izlem|vizit|randevu/.test(g.kod))) b.add('gecikmis_kontrol')
      if (gecikmis.some((g) => /odyo|isitme|işitme/.test(g.kod))) b.add('odyo_gecikmis')
      if (h.sonOdyoTarihi && gunFarki(h.sonOdyoTarihi, bugun) > ODYO_GECIKME_GUN) b.add('odyo_gecikmis')
      if (gecikmis.some((g) => /osas|uyku|apne/.test(g.kod))) b.add('osas_sevk')
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

export function kbbKohortFiltre(satirlar: KbbKohortSatir[], bayraklar: KbbKohortBayrak[]): KbbKohortSatir[] {
  return bayraklar.length ? satirlar.filter((s) => bayraklar.some((b) => s.bayraklar.includes(b))) : satirlar
}

/**
 * Hastaya giden hatırlatma. Klinik bağlam YAZILMAZ: ne tanı, ne dB değeri, ne bant, ne ilaç adı.
 * Açık kırmızı bayrağı olan hasta portal mesajı ile "yönetilmez" — hekim telefonla arar; bu yüzden
 * risk_acik satırında hatırlatma metni bilerek "sizi arayacağız" dilindedir.
 */
export function kbbRecallMesaji(bayraklar: KbbKohortBayrak[]): { konu: string; metin: string } {
  if (bayraklar.includes('risk_acik')) {
    return {
      konu: 'Muayenehanemiz sizinle iletişime geçecek',
      metin: 'Merhaba, doktorunuz sizinle görüşmek istiyor. En kısa sürede muayenehanemizden arayacağız. Acil bir durumda 112’yi arayın veya en yakın acile başvurun.',
    }
  }
  const nedenler = [
    bayraklar.includes('gecikmis_kontrol') ? 'kontrol randevusu' : null,
    bayraklar.includes('odyo_gecikmis') ? 'işitme testi' : null,
    bayraklar.includes('osas_sevk') ? 'planlanan tetkik' : null,
  ].filter(Boolean) as string[]
  const liste = nedenler.length ? nedenler.join(' ve ') : 'kontrol randevusu'
  return {
    konu: 'Kontrol zamanınız geldi',
    metin: `Merhaba, düzenli takibiniz kapsamında ${liste} zamanınız geldi. Uygun olduğunuz bir gün için randevu almanızı rica ederiz. Sorunuz varsa bu mesaja yanıt verebilirsiniz.`,
  }
}
