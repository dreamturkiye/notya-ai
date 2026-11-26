/**
 * HASTA-PORTALI-GUNLUK — Sağlık Karnesi: a weekly / monthly report card in the Turkish school karne idiom
 * (Pekiyi · İyi · Orta · Geçer). It never punishes: the lowest band is "Yolun başında", not a failing grade, and a
 * subject with nothing to grade says so instead of showing a zero.
 *  - İlaç uyumu: doses taken ÷ (taken + "Atladım") over the medicines the patient logs (dozPlani.uyum). DOZ-KAYDI-ISTEGE-
 *    BAGLI: a patient who does not log gets no İlaç uyumu subject at all — never a low grade for not logging.
 *  - Ölçüm düzeni: days the daily measurement goal was met ÷ days in the period (from the first logged day).
 *  - Hedefte kalma: readings inside the target range ÷ readings with a target — a record of numbers, not a medical
 *    verdict; the card says the doctor makes the assessment.
 */
import type { DozKaydi, DozPlani, EvOlcum, OlcumTipi } from './tipler'
import type { EsikSeti } from './hedefler'
import { hedefteMi } from './hedefler'
import { metrikAnahtari } from './olcumler'
import { kayitAcikMi, uyum } from './dozPlani'
import { gunEkle, gunFarki, trGun } from './zaman'

export type NotAdi = 'Pekiyi' | 'İyi' | 'Orta' | 'Geçer' | 'Yolun başında'
export interface Not { puan: 5 | 4 | 3 | 2 | 1; ad: NotAdi }

export function notVer(yuzde: number): Not {
  if (yuzde >= 90) return { puan: 5, ad: 'Pekiyi' }
  if (yuzde >= 75) return { puan: 4, ad: 'İyi' }
  if (yuzde >= 60) return { puan: 3, ad: 'Orta' }
  if (yuzde >= 40) return { puan: 2, ad: 'Geçer' }
  return { puan: 1, ad: 'Yolun başında' }
}

export interface KarneDersi { anahtar: 'uyum' | 'duzen' | 'hedef'; ad: string; yuzde: number | null; not: Not | null; ayrinti: string }

export interface Karne {
  donem: 'hafta' | 'ay'
  bas: string
  bit: string
  dersler: KarneDersi[]
  /** One cell per day: 0..1 completion (null = before the first log / future). */
  gunler: Array<{ gun: string; oran: number | null }>
  toplamOlcum: number
  aktifGun: number
}

export interface KarneGirdisi {
  olcumler: EvOlcum[]
  planlar: DozPlani[]
  kayitlar: DozKaydi[]
  esikler: Record<string, EsikSeti>
  olcumTipleri: OlcumTipi[]
  gunlukHedef: Partial<Record<OlcumTipi, number>>
  aktifGunler: Set<string>
  ilkGun: string | null
  simdi: Date | number | string
}

export function karneHesapla(g: KarneGirdisi, donem: 'hafta' | 'ay'): Karne {
  const bit = trGun(g.simdi)
  const uzunluk = donem === 'hafta' ? 7 : 30
  const bas = gunEkle(bit, -(uzunluk - 1))
  const aralikta = (iso: string) => { const d = trGun(iso); return d >= bas && d <= bit }
  const ol = g.olcumler.filter((o) => aralikta(o.olcumAt))

  const u = uyum(g.planlar, g.kayitlar, bas, bit, g.simdi)
  const kayitli = g.planlar.some((p) => p.aktif && !p.gerektikce && kayitAcikMi(p))
  const uyumDersi: KarneDersi | null = !kayitli ? null : { anahtar: 'uyum', ad: 'İlaç uyumu', yuzde: u.yuzde, not: u.yuzde == null ? null : notVer(u.yuzde), ayrinti: u.beklenen ? `İşaretlediğiniz ${u.beklenen} dozun ${u.alinan} tanesi alındı` : 'Henüz işaretlenmiş doz yok' }

  const hedefli = g.olcumTipleri.filter((t) => (g.gunlukHedef[t] ?? 0) > 0)
  const gunIndeksi = new Map<string, EvOlcum[]>()
  for (const o of ol) { const d = trGun(o.olcumAt); const l = gunIndeksi.get(d); if (l) l.push(o); else gunIndeksi.set(d, [o]) }
  const say = (gun: string) => {
    if (!hedefli.length) return null
    const s = gunIndeksi.get(gun) || []
    const parca = hedefli.map((t) => Math.min(1, s.filter((o) => o.tip === t).length / (g.gunlukHedef[t] as number)))
    return parca.reduce((a, b) => a + b, 0) / parca.length
  }
  const basGun = g.ilkGun && g.ilkGun > bas ? g.ilkGun : bas
  const gunSayisi = Math.max(0, gunFarki(basGun, bit) + 1)
  let duzenToplam = 0, duzenGun = 0
  for (let i = 0; i < gunSayisi; i++) { const gun = gunEkle(basGun, i); const r = say(gun); if (r != null && (gun !== bit || r > 0)) { duzenToplam += r; duzenGun++ } }
  const duzenYuzde = hedefli.length && duzenGun ? Math.round((duzenToplam / duzenGun) * 100) : null
  const duzenDersi: KarneDersi = { anahtar: 'duzen', ad: 'Ölçüm düzeni', yuzde: duzenYuzde, not: duzenYuzde == null ? null : notVer(duzenYuzde), ayrinti: hedefli.length ? `${ol.length} ölçüm · ${duzenGun} gün` : ol.length ? `${ol.length} ölçüm (günlük ölçüm hedefi yok)` : 'Günlük ölçüm hedefi yok' }

  const deg = ol.map((o) => hedefteMi(g.esikler[metrikAnahtari(o)], o.deger, o.deger2)).filter((x): x is boolean => x != null)
  const hedefYuzde = deg.length >= 3 ? Math.round((deg.filter(Boolean).length / deg.length) * 100) : null
  const hedefDersi: KarneDersi = { anahtar: 'hedef', ad: 'Hedef aralığında kalma', yuzde: hedefYuzde, not: hedefYuzde == null ? null : notVer(hedefYuzde), ayrinti: deg.length >= 3 ? `${deg.length} ölçümün ${deg.filter(Boolean).length} tanesi hedef aralığında` : 'Not için en az 3 hedefli ölçüm gerekir' }

  const gunler: Karne['gunler'] = []
  for (let i = uzunluk - 1; i >= 0; i--) {
    const gun = gunEkle(bit, -i)
    if (!g.ilkGun || gun < g.ilkGun) { gunler.push({ gun, oran: null }); continue }
    const dozU = uyum(g.planlar, g.kayitlar, gun, gun, g.simdi)
    const parcalar = [dozU.yuzde == null ? null : dozU.yuzde / 100, say(gun)].filter((x): x is number => x != null)
    gunler.push({ gun, oran: parcalar.length ? parcalar.reduce((a, b) => a + b, 0) / parcalar.length : g.aktifGunler.has(gun) ? 1 : 0 })
  }
  const aktifGun = [...g.aktifGunler].filter((d) => d >= bas && d <= bit).length
  return { donem, bas, bit, dersler: [...(uyumDersi ? [uyumDersi] : []), duzenDersi, hedefDersi], gunler, toplamOlcum: ol.length, aktifGun }
}
