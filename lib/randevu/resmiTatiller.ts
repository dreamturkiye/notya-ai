/**
 * NOTYA-RANDEVU-10 — 2026 T.C. resmi tatilleri. Statik liste, yıllık güncellenmesi gerekir —
 * özellikle dini bayramlar (Ramazan/Kurban) hicri takvime göre her yıl ~11 gün kayar, Diyanet
 * duyurusuna göre kesinleşir. Kaynak: 2026 için birden fazla güncel takvim sitesi çapraz
 * kontrol edildi (enuygun, hürriyet, takvim.com, işbank blog) — hepsi aynı tarihlerde hemfikir.
 *
 * `yarim` = arife günü (öğleden sonra tatil) — randevu uyarısında ayrı işaretleniyor, tam gün
 * tatil gibi otomatik reddedilmiyor çünkü sabah mesaisi genelde açık.
 */

export interface ResmiTatil {
  tarih: string // yyyy-mm-dd
  ad: string
  yarim?: boolean
}

export const RESMI_TATILLER_2026: ResmiTatil[] = [
  { tarih: '2026-01-01', ad: 'Yılbaşı' },
  { tarih: '2026-03-19', ad: 'Ramazan Bayramı Arifesi', yarim: true },
  { tarih: '2026-03-20', ad: 'Ramazan Bayramı (1. gün)' },
  { tarih: '2026-03-21', ad: 'Ramazan Bayramı (2. gün)' },
  { tarih: '2026-03-22', ad: 'Ramazan Bayramı (3. gün)' },
  { tarih: '2026-04-23', ad: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  { tarih: '2026-05-01', ad: 'Emek ve Dayanışma Günü' },
  { tarih: '2026-05-19', ad: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
  { tarih: '2026-05-26', ad: 'Kurban Bayramı Arifesi', yarim: true },
  { tarih: '2026-05-27', ad: 'Kurban Bayramı (1. gün)' },
  { tarih: '2026-05-28', ad: 'Kurban Bayramı (2. gün)' },
  { tarih: '2026-05-29', ad: 'Kurban Bayramı (3. gün)' },
  { tarih: '2026-05-30', ad: 'Kurban Bayramı (4. gün)' },
  { tarih: '2026-07-15', ad: 'Demokrasi ve Millî Birlik Günü' },
  { tarih: '2026-08-30', ad: 'Zafer Bayramı' },
  { tarih: '2026-10-28', ad: 'Cumhuriyet Bayramı Arifesi', yarim: true },
  { tarih: '2026-10-29', ad: 'Cumhuriyet Bayramı' },
]

const TATIL_HARITASI: Record<string, ResmiTatil> = Object.fromEntries(
  RESMI_TATILLER_2026.map((t) => [t.tarih, t])
)

/** d: yerel Date. Anahtar karşılaştırması UTC kaymasından etkilenmesin diye yerel Y-A-G kullanır
 * (randevular sayfasındaki yerelGunAnahtari ile aynı desen — toISOString() burada YANLIŞ olurdu). */
export function gunAnahtari(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${g}`
}

export function resmiTatilMi(d: Date): ResmiTatil | null {
  return TATIL_HARITASI[gunAnahtari(d)] || null
}
