/**
 * HASTA-PORTALI-GUNLUK — Sağlık Karnesi badges. Every badge rewards a HABIT (measuring, taking medicines, keeping the
 * streak) — never a medical result. "Hedefte bir hafta" says the readings were recorded inside the target range set for
 * the patient; it does not say the treatment worked (the doctor decides that) and its text says so.
 * Badges only appear when they apply to the patient (no glucose badge for a patient who doesn't measure glucose).
 */
import type { DozKaydi, DozPlani, EvOlcum, OlcumTipi } from './tipler'
import type { EsikSeti } from './hedefler'
import { hedefteMi } from './hedefler'
import { metrikAnahtari } from './olcumler'
import { gunSlotlari, kayitAcikMi, kayitHaritasi, slotDurumu, uyum } from './dozPlani'
import { gunEkle, trDakika, trGun } from './zaman'

export type RozetId =
  | 'ilk-adim' | 'seri-7' | 'seri-30' | 'olcum-25' | 'olcum-100' | 'sabah-duzeni' | 'seker-ustasi'
  | 'tansiyon-takipcisi' | 'uyum-haftasi' | 'hedefte-hafta' | 'tam-gun' | 'seri-kalkani' | 'hizli-goz'

export interface RozetTanimi {
  id: RozetId
  ad: string
  /** How to earn it (shown on the locked badge). */
  kosul: string
  /** Shown when earned. */
  aciklama: string
  /** Visual: medallion colour family + glyph (drawn by the shared Rozet SVG component). */
  renk: 'cam' | 'gunes' | 'mercan' | 'gece' | 'nane' | 'erik' | 'bakir'
  sekil: 'madalya' | 'kalkan' | 'yildiz' | 'altigen' | 'damla'
  simge: 'ayak' | 'alev' | 'ay' | 'kalem' | 'yuz' | 'gunes' | 'damla' | 'kalp' | 'hap' | 'hedef' | 'tam' | 'kalkan' | 'kamera'
}

export const ROZETLER: readonly RozetTanimi[] = [
  { id: 'ilk-adim', ad: 'İlk Adım', kosul: 'İlk kaydınızı yapın.', aciklama: 'Sağlık evinize ilk kaydınızı yaptınız.', renk: 'cam', sekil: 'madalya', simge: 'ayak' },
  { id: 'seri-7', ad: 'Yedi Gün', kosul: '7 gün üst üste kayıt yapın.', aciklama: 'Bir hafta boyunca her gün kayıt yaptınız.', renk: 'mercan', sekil: 'yildiz', simge: 'alev' },
  { id: 'seri-30', ad: 'Otuz Gün', kosul: '30 gün üst üste kayıt yapın.', aciklama: 'Bir ay boyunca her gün kayıt yaptınız.', renk: 'gece', sekil: 'yildiz', simge: 'ay' },
  { id: 'olcum-25', ad: '25 Ölçüm', kosul: 'Toplam 25 ölçüm kaydedin.', aciklama: '25 ölçüm kaydettiniz.', renk: 'nane', sekil: 'altigen', simge: 'kalem' },
  { id: 'olcum-100', ad: 'Yüz Ölçüm', kosul: 'Toplam 100 ölçüm kaydedin.', aciklama: '100 ölçüm kaydettiniz — doktorunuz artık çok daha net bir tablo görüyor.', renk: 'gunes', sekil: 'altigen', simge: 'yuz' },
  { id: 'sabah-duzeni', ad: 'Sabah Düzeni', kosul: '7 gün üst üste sabah ilaçlarınızı saat 10:30’dan önce işaretleyin.', aciklama: 'Bir hafta boyunca sabah ilaçlarınızı zamanında işaretlediniz.', renk: 'gunes', sekil: 'madalya', simge: 'gunes' },
  { id: 'seker-ustasi', ad: 'Şeker Ustası', kosul: '14 gün açlık ve tokluk şekerinizi aynı gün ölçün.', aciklama: '14 gün boyunca açlık ve tokluk şekerinizi birlikte ölçtünüz.', renk: 'erik', sekil: 'damla', simge: 'damla' },
  { id: 'tansiyon-takipcisi', ad: 'Tansiyon Takipçisi', kosul: '7 gün üst üste sabah ve akşam tansiyon ölçün.', aciklama: 'Bir hafta sabah–akşam tansiyon ölçtünüz; ev ölçüm protokolünü tamamladınız.', renk: 'mercan', sekil: 'kalkan', simge: 'kalp' },
  { id: 'uyum-haftasi', ad: 'Uyum Haftası', kosul: 'Bir haftada ilaçlarınızın %90’ını işaretleyin.', aciklama: 'Bir hafta boyunca ilaçlarınızın en az %90’ını aldınız.', renk: 'nane', sekil: 'madalya', simge: 'hap' },
  { id: 'hedefte-hafta', ad: 'Hedefte Bir Hafta', kosul: '7 gün boyunca ölçümlerinizin çoğu hedef aralığınızda kalsın.', aciklama: 'Bir hafta boyunca ölçümlerinizin çoğu, sizin için belirlenen hedef aralığında kaydedildi. Değerlendirmeyi doktorunuz yapar.', renk: 'cam', sekil: 'kalkan', simge: 'hedef' },
  { id: 'tam-gun', ad: 'Tam Gün', kosul: 'Bir günün bütün ilaçlarını ve ölçümlerini tamamlayın.', aciklama: 'Bir günün bütün planını tamamladınız.', renk: 'bakir', sekil: 'yildiz', simge: 'tam' },
  { id: 'seri-kalkani', ad: 'Seri Kalkanı', kosul: '7 günlük seriyle ilk kalkanınızı kazanın.', aciklama: 'Kaçırdığınız bir gün serinizi bozmaz: kalkanınız onu korur.', renk: 'gece', sekil: 'kalkan', simge: 'kalkan' },
  { id: 'hizli-goz', ad: 'Hızlı Göz', kosul: 'Bir ölçümü cihaz ekranının fotoğrafıyla girin.', aciklama: 'Cihazınızın ekranını fotoğraflayıp ilk ölçümünüzü girdiniz.', renk: 'bakir', sekil: 'damla', simge: 'kamera' },
]

export interface RozetGirdisi {
  olcumler: EvOlcum[]
  toplamOlcum: number
  fotoOlcum: number
  planlar: DozPlani[]
  kayitlar: DozKaydi[]
  esikler: Record<string, EsikSeti>
  olcumTipleri: OlcumTipi[]
  /** Daily measurement goal per kind (0 = optional). */
  gunlukHedef: Partial<Record<OlcumTipi, number>>
  seri: { enUzun: number; kalkanKazanildi: boolean }
  /** Days with any log (streak days). */
  aktifGunSayisi: number
  simdi: Date | number | string
}

export interface RozetDurumu { id: RozetId; kazanildi: boolean; deger: number; hedef: number }

/** Longest run of consecutive days (ending anywhere) where `kosul(gun)` holds, scanning the last `pencere` days. */
function enUzunArdisik(bugun: string, pencere: number, kosul: (g: string) => boolean): number {
  let en = 0, run = 0
  for (let i = pencere - 1; i >= 0; i--) {
    const g = gunEkle(bugun, -i)
    if (kosul(g)) { run++; en = Math.max(en, run) } else if (g !== bugun) run = 0
  }
  return en
}

/** Applicable badges for this patient. */
export function uygunRozetler(g: Pick<RozetGirdisi, 'olcumTipleri' | 'planlar'>): RozetTanimi[] {
  const sabahPlani = g.planlar.some((p) => p.aktif && !p.gerektikce && kayitAcikMi(p) && p.saatler.some((s) => s < '11:00'))
  const planVar = g.planlar.some((p) => p.aktif && !p.gerektikce)
  const olcumVar = g.olcumTipleri.length > 0
  return ROZETLER.filter((r) => {
    if (r.id === 'seker-ustasi') return g.olcumTipleri.includes('glukoz')
    if (r.id === 'tansiyon-takipcisi') return g.olcumTipleri.includes('kb')
    if (r.id === 'sabah-duzeni') return sabahPlani
    // DOZ-KAYDI-ISTEGE-BAGLI: dose badges only for a medicine the patient logs.
    if (r.id === 'uyum-haftasi') return planVar && g.planlar.some((p) => p.aktif && !p.gerektikce && kayitAcikMi(p))
    if (r.id === 'olcum-25' || r.id === 'olcum-100' || r.id === 'hedefte-hafta' || r.id === 'hizli-goz') return olcumVar
    return true
  })
}

export function rozetDurumlari(g: RozetGirdisi): RozetDurumu[] {
  const bugun = trGun(g.simdi)
  const harita = kayitHaritasi(g.kayitlar)
  const gunIndeksi = new Map<string, EvOlcum[]>()
  for (const o of g.olcumler) { const d = trGun(o.olcumAt); const l = gunIndeksi.get(d); if (l) l.push(o); else gunIndeksi.set(d, [o]) }
  const gunOlcum = (gun: string) => gunIndeksi.get(gun) || []

  const sekerGun = (gun: string) => { const s = gunOlcum(gun).filter((o) => o.tip === 'glukoz'); return s.some((o) => o.baglam === 'aclik') && s.some((o) => o.baglam === 'tokluk2') }
  const sekerGunSayisi = Array.from({ length: 90 }, (_, i) => gunEkle(bugun, -i)).filter(sekerGun).length
  const kbGun = (gun: string) => { const s = gunOlcum(gun).filter((o) => o.tip === 'kb'); return s.some((o) => trDakika(o.olcumAt) < 12 * 60) && s.some((o) => trDakika(o.olcumAt) >= 17 * 60) }
  const sabahGun = (gun: string) => {
    let var_ = false
    for (const p of g.planlar) for (const s of kayitAcikMi(p) ? gunSlotlari(p, gun) : []) {
      if (trDakika(s) >= 11 * 60) continue
      var_ = true
      const k = harita.get(`${p.id}|${new Date(s).toISOString()}`)
      if (!(k && k.durum === 'alindi' && trDakika(k.kayitAt) <= 10 * 60 + 30 && trGun(k.kayitAt) === gun)) return false
    }
    return var_
  }
  let enIyiUyum = 0
  for (let i = 0; i < 8; i++) {
    const bit = gunEkle(bugun, -1 - i * 7)
    const u = uyum(g.planlar, g.kayitlar, gunEkle(bit, -6), bit, g.simdi)
    if (u.yuzde != null && u.beklenen >= 7) enIyiUyum = Math.max(enIyiUyum, u.yuzde)
  }
  const hedefteGun = (gun: string) => {
    const s = gunOlcum(gun).map((o) => hedefteMi(g.esikler[metrikAnahtari(o)], o.deger, o.deger2)).filter((x) => x != null)
    return s.length > 0 && s.filter(Boolean).length / s.length >= 0.7
  }
  const tamGun = (gun: string) => {
    let slotVar = false
    for (const p of g.planlar) for (const s of kayitAcikMi(p) ? gunSlotlari(p, gun) : []) { slotVar = true; if (slotDurumu(p.id, s, harita, g.simdi) !== 'alindi') return false }
    const os = gunOlcum(gun)
    let olcumHedefi = false
    for (const t of g.olcumTipleri) { const h = g.gunlukHedef[t] ?? 0; if (h > 0) { olcumHedefi = true; if (os.filter((o) => o.tip === t).length < h) return false } }
    return slotVar || olcumHedefi
  }
  const tamGunVar = Array.from({ length: 60 }, (_, i) => gunEkle(bugun, -i)).some(tamGun)

  const d = (id: RozetId, deger: number, hedef: number): RozetDurumu => ({ id, deger: Math.min(deger, hedef), hedef, kazanildi: deger >= hedef })
  const tum: Record<RozetId, RozetDurumu> = {
    'ilk-adim': d('ilk-adim', g.aktifGunSayisi > 0 ? 1 : 0, 1),
    'seri-7': d('seri-7', g.seri.enUzun, 7),
    'seri-30': d('seri-30', g.seri.enUzun, 30),
    'olcum-25': d('olcum-25', g.toplamOlcum, 25),
    'olcum-100': d('olcum-100', g.toplamOlcum, 100),
    'sabah-duzeni': d('sabah-duzeni', enUzunArdisik(bugun, 60, sabahGun), 7),
    'seker-ustasi': d('seker-ustasi', sekerGunSayisi, 14),
    'tansiyon-takipcisi': d('tansiyon-takipcisi', enUzunArdisik(bugun, 60, kbGun), 7),
    'uyum-haftasi': d('uyum-haftasi', enIyiUyum >= 90 ? 1 : 0, 1),
    'hedefte-hafta': d('hedefte-hafta', enUzunArdisik(bugun, 60, hedefteGun), 7),
    'tam-gun': d('tam-gun', tamGunVar ? 1 : 0, 1),
    'seri-kalkani': d('seri-kalkani', g.seri.kalkanKazanildi ? 1 : 0, 1),
    'hizli-goz': d('hizli-goz', g.fotoOlcum, 1),
  }
  return uygunRozetler(g).map((r) => tum[r.id])
}
