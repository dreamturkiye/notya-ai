/**
 * PEDI-ARACLAR-01 — Araçlar › Pediatri: bağışlayıcı girdi. Pure.
 * Türk kliniğinin yazdığı biçimi sessizce normalleştirir (3,5 · 3.500 gr · 1,12 m · 12.03.2024 · 32+4) — hata yerine
 * en makul okumayı döndürür, okunamazsa null. Hiçbir klinik eşik yok; yalnız biçim.
 */
import { sayiCoz } from '@/lib/clinical/olcumCoz'

export { sayiCoz, kiloCoz, cmCoz, gramCoz } from '@/lib/clinical/olcumCoz'

const iki = (n: number) => String(n).padStart(2, '0')

/** Tarih → ISO (YYYY-MM-DD). "12.03.2024" · "12/3/24" · "12-03-2024" · "2024-03-12" · "12 03 2024" · "12,03,2024" (TR ondalık klavyesi). Geçersiz → null. */
export function tarihCoz(ham: string | null | undefined): string | null {
  const s = String(ham ?? '').trim()
  if (!s) return null
  let y: number, m: number, d: number
  let r = s.match(/^(\d{4})[-./ ,](\d{1,2})[-./ ,](\d{1,2})/)
  if (r) { y = +r[1]; m = +r[2]; d = +r[3] } else {
    r = s.match(/^(\d{1,2})[-./ ,](\d{1,2})[-./ ,](\d{2,4})$/)
    if (!r) {
      const k = s.match(/^(\d{2})(\d{2})(\d{4})$/) // 12032024
      if (!k) return null
      r = ['', k[1], k[2], k[3]] as unknown as RegExpMatchArray
    }
    d = +r[1]; m = +r[2]; y = +r[3]
    if (y < 100) y += y > 50 ? 1900 : 2000
  }
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return `${y}-${iki(m)}-${iki(d)}`
}

/** ISO → "12.03.2024" (ekranda Türk biçimi). */
export function tarihGoster(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d}.${m}.${y}` : iso
}

/** Gebelik haftası: "32" · "32+4" · "32 4/7" · "32,5" → ondalık hafta (32+4 = 32,57). */
export function gebelikHaftasiCoz(ham: string | null | undefined): number | null {
  const s = String(ham ?? '').trim()
  if (!s) return null
  const r = s.match(/^(\d{2})\s*(?:\+|\s)\s*(\d)(?:\s*\/\s*7)?$/)
  const n = r ? +r[1] + +r[2] / 7 : sayiCoz(s)
  if (n == null || n < 20 || n > 45) return null
  return Math.round(n * 100) / 100
}

export const GUN_MS = 86_400_000

export function gunEkle(iso: string, gun: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + gun)
  return d.toISOString().slice(0, 10)
}

/** Takvim ayı ekler (31 Ocak + 1 ay → 28/29 Şubat, ay sonuna sabitlenir). */
export function ayEkle(iso: string, ay: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const hedef = new Date(Date.UTC(y, m - 1 + ay, 1))
  const sonGun = new Date(Date.UTC(hedef.getUTCFullYear(), hedef.getUTCMonth() + 1, 0)).getUTCDate()
  hedef.setUTCDate(Math.min(d, sonGun))
  return hedef.toISOString().slice(0, 10)
}

export function gunFarki(a: string, b: string): number {
  return Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / GUN_MS)
}

/** Tamamlanmış takvim ayı (doğum → tarih). */
export function tamAy(dogumIso: string, tarihIso: string): number {
  const [y1, m1, d1] = dogumIso.slice(0, 10).split('-').map(Number)
  const [y2, m2, d2] = tarihIso.slice(0, 10).split('-').map(Number)
  let ay = (y2 - y1) * 12 + (m2 - m1)
  if (d2 < d1) ay -= 1
  return ay
}

/** Ondalık ay (büyüme eğrisi için — buyumeEgrisi.ayFarki ile aynı ölçek, 30,44 gün/ay). */
export function ondalikAy(dogumIso: string, tarihIso: string): number {
  return gunFarki(dogumIso, tarihIso) / 30.4375
}

/** "1 yaş 3 ay" · "5 ay" · "12 gün" — ekranda yaş. */
export function yasMetni(dogumIso: string, tarihIso: string): string {
  const gun = gunFarki(dogumIso, tarihIso)
  if (gun < 0) return 'doğmadan önce'
  if (gun < 31) return `${gun} günlük`
  const ay = tamAy(dogumIso, tarihIso)
  if (ay < 24) return `${ay} aylık`
  const yil = Math.floor(ay / 12), kalan = ay % 12
  return kalan ? `${yil} yaş ${kalan} ay` : `${yil} yaş`
}

/** Sayıyı Türkçe ondalıkla yazar: 4.8 → "4,8". */
export function tr(n: number, basamak = 1): string {
  const k = 10 ** basamak
  const y = Math.round(n * k) / k
  return y.toLocaleString('tr-TR', { maximumFractionDigits: basamak, minimumFractionDigits: 0 })
}

/**
 * PEDI-ARACLAR-02 — yaş yazımı → parçalar. "14 aylık" · "14 ay" · "2 yaş 3 ay" · "2,5 yaş" · "3 haftalık" · "10 günlük" ·
 * "1y 3a". Birim yoksa null (tek başına "14" yaş mı ay mı belli değil — tahmin etmeyiz).
 */
export function yasParcalariCoz(ham: string | null | undefined): { ay: number; gun: number } | null {
  const s = String(ham ?? '').toLocaleLowerCase('tr-TR').replace(/,/g, '.').trim()
  if (!s) return null
  const re = /(\d+(?:\.\d+)?)\s*(yaşında|yaş|yas|yıl|yil|y|aylık|aylik|ay|a|haftalık|haftalik|hafta|hf|h|günlük|gunluk|gün|gun|g)(?![a-zçğıöşü])/g
  let ay = 0, gun = 0, bulundu = false
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    const n = Number(m[1]), b = m[2]
    bulundu = true
    if (/^(yaş|yas|yıl|yil|y)/.test(b)) ay += n * 12
    else if (/^(ay|a)/.test(b)) ay += n
    else if (/^(hafta|hf|h)/.test(b)) gun += n * 7
    else gun += n
  }
  if (!bulundu) return null
  // Birimli parçaların dışında rakam kalmışsa ("2 yaş 3") belirsizdir.
  if (/\d/.test(s.replace(re, ''))) return null
  const tamAyKismi = Math.floor(ay)
  gun += Math.round((ay - tamAyKismi) * 30.4375)
  if (tamAyKismi > 12 * 19 || gun > 366 * 19) return null
  return { ay: tamAyKismi, gun: Math.round(gun) }
}

/** Yaş yazımı → yaklaşık gün (30,4375 gün/ay). */
export function yasGunCoz(ham: string | null | undefined): number | null {
  const p = yasParcalariCoz(ham)
  return p ? Math.round(p.ay * 30.4375 + p.gun) : null
}

/**
 * Doğum tarihi alanı: tarih ("12.03.2024") ya da yaş ("14 aylık"). Yaş yazıldıysa doğum tarihi bugünden TAKVİM ayıyla
 * geriye hesaplanır ("18 aylık" → bugün − 18 ay; ekranda yine "18 aylık") ve `yaklasik` işaretlenir.
 */
export function dogumVeyaYasCoz(ham: string | null | undefined, bugunIso: string): { iso: string; yaklasik: boolean } | null {
  const t = tarihCoz(ham)
  if (t) return { iso: t, yaklasik: false }
  const p = yasParcalariCoz(ham)
  if (!p) return null
  return { iso: gunEkle(ayEkle(bugunIso, -p.ay), -p.gun), yaklasik: true }
}
