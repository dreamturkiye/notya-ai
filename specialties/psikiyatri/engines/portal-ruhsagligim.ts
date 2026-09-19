/**
 * PSIK-EXCEPTIONAL-01 — Sağlığım › "Ruh Sağlığım" hatırlatmaları. SAF fonksiyon.
 *
 * Bu dosya hasta yüzünün TEK kapısıdır. Hekimin görev metni asla olduğu gibi taşınmaz: her satır
 * kod → sabit, hasta-güvenli başlığa çevrilir. Hasta yüzünde YASAK: tanı adı, ölçek adı (PHQ-9 /
 * GAD-7 / CGI), skor, şiddet bandı, ilaç ve etken madde adı, doz, "psikoz / bipolar / depresyon"
 * gibi klinik etiketler. Ruh sağlığı verisi en hassas veri sınıfıdır (specialty-hasta-portali).
 *
 * Aynı desen: specialties/dahiliye/engines/portal-takibim.ts ve dermatoloji portal-derim.
 */
export type HatirlatmaDurum = 'gecikti' | 'yaklasiyor' | 'planli'

export type PsikHatirlatma = { ad: string; due: string | null; durum: HatirlatmaDurum }

export const YAKLASIYOR_GUN = 7

const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Görev kodu → hasta-güvenli başlık.
 * Ölçek görevleri "doldurmanız istenen kısa form" olur — hangi ölçek olduğu söylenmez.
 * İlaç izlem görevleri "ilaç güvenlik kan testi" olur — etken madde ve doz söylenmez.
 */
const GOREV_BASLIK: Array<[RegExp, string]> = [
  [/^psik_izlem_lityum|^psik_izlem_valproat|duzey/, 'İlaç güvenlik kan testi'],
  [/^psik_izlem_klozapin/, 'Düzenli kan sayımı kontrolü'],
  [/^psik_izlem_atipik_ap|metabolik/, 'Kilo ve kan şekeri / kolesterol kontrolü'],
  [/^psik_izlem_ssri|^psik_izlem_lamotrijin|^psik_izlem/, 'İlaç kontrol görüşmesi'],
  [/^olcek|^phq|^gad|^cgi|^form/, 'Kontrolden önce doldurulacak kısa form'],
  [/^terapi|^psikoterapi|^seans/, 'Terapi görüşmesi randevusu'],
  [/^kontrol|^izlem|^vizit|^randevu/, 'Kontrol randevusu'],
]

export function gorevBasligi(kod: string | null | undefined): string {
  const k = String(kod || '').toLocaleLowerCase('tr-TR')
  for (const [re, ad] of GOREV_BASLIK) if (re.test(k)) return ad
  return 'Kontrol randevusu'
}

export function hatirlatmaDurumu(due: string | null, bugun: string): HatirlatmaDurum {
  if (!due || !ISO.test(due) || !ISO.test(bugun)) return 'planli'
  const a = Date.parse(due + 'T12:00:00Z')
  const b = Date.parse(bugun + 'T12:00:00Z')
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 'planli'
  const fark = Math.round((a - b) / 86400000)
  if (fark < 0) return 'gecikti'
  return fark <= YAKLASIYOR_GUN ? 'yaklasiyor' : 'planli'
}

export interface RuhSagligimGirdi {
  bugun: string
  gorevler: Array<{ kod: string; due: string | null }>
  sonrakiKontrolIso: string | null
}

/** Tek hatırlatma listesi: kod → sabit başlık, tekilleştirilmiş, tarihe göre sıralı. */
export function ruhSagligimHatirlatmalari(g: RuhSagligimGirdi): PsikHatirlatma[] {
  const map = new Map<string, PsikHatirlatma>()
  for (const gorev of g.gorevler) {
    const ad = gorevBasligi(gorev.kod)
    const due = gorev.due && ISO.test(gorev.due.slice(0, 10)) ? gorev.due.slice(0, 10) : null
    const key = `${ad}|${due || ''}`
    if (map.has(key)) continue
    map.set(key, { ad, due, durum: hatirlatmaDurumu(due, g.bugun) })
  }
  if (g.sonrakiKontrolIso && ISO.test(g.sonrakiKontrolIso.slice(0, 10))) {
    const due = g.sonrakiKontrolIso.slice(0, 10)
    const ad = 'Kontrol randevusu'
    const key = `${ad}|${due}`
    if (!map.has(key)) map.set(key, { ad, due, durum: hatirlatmaDurumu(due, g.bugun) })
  }
  return [...map.values()].sort((a, b) => {
    if (!a.due) return b.due ? 1 : 0
    if (!b.due) return -1
    return a.due.localeCompare(b.due)
  })
}

export function sonrakiKontrol(liste: PsikHatirlatma[]): { tarih: string; neden: string } | null {
  const aday = liste.find((h) => h.due && (h.durum === 'yaklasiyor' || h.durum === 'planli'))
  if (!aday?.due) return null
  return { tarih: aday.due, neden: aday.ad }
}

/** Ölçek hatırlatmaları — hangi ölçek olduğu yazılmaz. */
export function olcekHatirlatmalari(liste: PsikHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste.filter((h) => h.ad === 'Kontrolden önce doldurulacak kısa form').map((h) => ({ ad: h.ad, due: h.due }))
}

/** İlaç kaynaklı hatırlatmalar — etken madde ve doz yazılmaz. */
export function ilacHatirlatmalari(liste: PsikHatirlatma[]): Array<{ ad: string; due: string | null }> {
  return liste
    .filter((h) => /kan testi|kan sayımı|kan şekeri|İlaç kontrol/i.test(h.ad))
    .map((h) => ({ ad: h.ad, due: h.due }))
}

/** Hasta yüzü sabit alt not — 112 var, tanı dili yok. */
export const RUH_SAGLIGIM_NOTU =
  'Bu bilgiler bilgilendirme amaçlıdır; yorum ve plan doktorunuzdadır. Tarihleri muayenehaneniz belirler. Kendinize zarar verme düşüncesi olursa portal mesajı beklemeyin: 112’yi arayın veya en yakın acile başvurun.'

/**
 * Hasta dilinde yasak kelime kilidi — test bunu her hasta-yüzü metni için çağırır.
 * Ölçek adları, skor jargonu, tanı adları, doz birimleri ve ilaç etken maddeleri yasaktır.
 */
export function hastaDiliTemizMi(metin: string): boolean {
  return !/(tanı|tani|ICD|PHQ|GAD-?7|CGI|skor|puan|şiddetli|depresyon|anksiyete bozuk|bipolar|psikoz|şizofren|lityum|valproat|klozapin|SSRI|mg\b|mg\/kg)/i.test(metin)
}
