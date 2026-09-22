/**
 * Sağlam çocuk çek listesi — yaşa özel hatırlatmalar.
 * Pencereler ve tarama kalemleri SB İzlem Protokolü 2018 (gelisimPlan); uydurma pencere yok.
 * Yalnız pediatrik bağlamda çağrılır — KD / kardiyoloji bu dosyayı import etmez, muayeneCekListesi kapılar.
 */
import type { CekMadde } from '@/lib/doktor/muayeneCekListesi'
import { vizitPlani } from './gelisimPlan'

const m = (id: string, etiket: string, grup: CekMadde['grup'], anahtarlar: string[]): CekMadde => ({
  id, etiket, grup, anahtarlar,
})

/** İlk 10 gün — NTP, göbek, sarılık, fizyolojik kilo. */
const YENIDOGAN: CekMadde[] = [
  m('sc_gobek', 'Göbek kordonu / göbek bakımı', 'fizik', ['gobek', 'kordon']),
  m('sc_sarilik', 'Sarılık (ikter)', 'fizik', ['sarilik', 'ikter', 'bilirubin']),
  m('sc_kilo_kaybi', 'Doğum kilosuna göre kilo (fizyolojik kayıp)', 'olcum', ['kilo kayb', 'dogum kilo']),
  m('sc_ntp', 'Yenidoğan metabolik tarama (NTP) sonucu', 'anamnez', ['ntp', 'metabolik tarama', 'topuk']),
  m('sc_kalca', 'Kalça muayenesi (gelişimsel kalça)', 'fizik', ['kalca', 'ortolani', 'barlow']),
  m('sc_fontanel', 'Fontanel', 'fizik', ['fontanel']),
]

/** 11–59. gün — göbek düştü mü, sarılık geriledi mi, kalça. */
const ERKEN_BEBEK: CekMadde[] = [
  m('sc_gobek', 'Göbek düştü mü / göbek bakımı', 'fizik', ['gobek', 'kordon']),
  m('sc_sarilik', 'Sarılık geriledi mi', 'fizik', ['sarilik', 'ikter']),
  m('sc_kalca', 'Kalça muayenesi (gelişimsel kalça)', 'fizik', ['kalca']),
  m('sc_fontanel', 'Fontanel', 'fizik', ['fontanel']),
  m('sc_ntp', 'NTP sonucu (kayıtta yoksa sor)', 'anamnez', ['ntp', 'metabolik tarama', 'topuk']),
]

const BEBEK_KALCA: CekMadde[] = [
  m('sc_kalca', 'Kalça muayenesi (gelişimsel kalça)', 'fizik', ['kalca']),
  m('sc_fontanel', 'Fontanel (kapanma)', 'fizik', ['fontanel']),
]

const EK_GIDA: CekMadde[] = [
  m('sc_ek_gida', 'Ek gıda / tamamlayıcı beslenme', 'anamnez', ['ek gida', 'tamamlayici', 'mama', 'püre']),
]

const YURUME: CekMadde[] = [
  m('sc_yurume', 'Motor: oturma / emekleme / yürüme', 'fizik', ['yurume', 'emekleme', 'oturma']),
]

const DIL: CekMadde[] = [
  m('sc_dil', 'Dil / iletişim (kelime, işaret)', 'fizik', ['dil', 'kelime', 'konusma']),
]

const OKUL: CekMadde[] = [
  m('sc_okul', 'Okul / öğrenme / davranış', 'anamnez', ['okul', 'ogrenme', 'davranis']),
  m('sc_gorme_okul', 'Görme / işitme (okul çağı)', 'fizik', ['gorme', 'isitme', 'tahta']),
]

const ERGEN: CekMadde[] = [
  m('sc_ergen', 'Ergenlik / psikososyal (hekim sorar)', 'anamnez', ['ergen', 'okul', 'arkadas', 'uyku']),
]

function yasGun(dogumIso: string, bugunIso: string): number {
  const a = Date.parse(dogumIso.slice(0, 10))
  const b = Date.parse(bugunIso.slice(0, 10))
  if (!Number.isFinite(a) || !Number.isFinite(b)) return -1
  return Math.floor((b - a) / 86_400_000)
}

function yasBandiEk(gun: number): CekMadde[] {
  if (gun < 0) return []
  if (gun <= 10) return YENIDOGAN
  if (gun <= 59) return ERKEN_BEBEK
  if (gun <= 180) return [...BEBEK_KALCA, ...EK_GIDA]
  if (gun <= 394) return [...BEBEK_KALCA, ...EK_GIDA, ...YURUME]
  if (gun <= 760) return [...YURUME, ...DIL]
  if (gun < Math.round(6 * 365.25)) return [...DIL, ...OKUL]
  if (gun < Math.round(11 * 365.25)) return OKUL
  return ERGEN
}

function taramaCek(dogumIso: string, bugunIso: string): CekMadde[] {
  const p = vizitPlani({ dogumIso, bugunIso })
  const liste: CekMadde[] = []
  if (p.simdikiVizit) {
    liste.push(m(
      `sc_izlem_${p.simdikiVizit.id}`,
      `Sağlam çocuk: ${p.simdikiVizit.etiket} izlemi`,
      'anamnez',
      ['izlem', 'saglam cocuk'],
    ))
  } else if (p.sonrakiVizit) {
    liste.push(m(
      `sc_izlem_sonraki_${p.sonrakiVizit.id}`,
      `Sonraki izlem: ${p.sonrakiVizit.etiket}`,
      'anamnez',
      ['izlem', 'kontrol'],
    ))
  }
  for (const k of p.kalemler) {
    if (k.durum === 'tamam' || k.durum === 'yaklasiyor') continue
    liste.push(m(`sc_tarama_${k.kod}`, k.ad, k.kod === 'dvit' || k.kod === 'demir' || k.kod === 'hb' ? 'anamnez' : 'fizik', [k.kod.replace('_', ' ')]))
  }
  return liste
}

/** Pediatrik bağlam + kayıtlı doğum tarihi varken yaşa özel hatırlatmalar. Doğum yoksa boş — generic PEDIATRI listesi kalır. */
export function saglamCocukCekMaddeleri(
  dogumIso: string | null | undefined,
  bugunIso: string = new Date().toISOString(),
): CekMadde[] {
  const iso = String(dogumIso || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return []
  const gun = yasGun(iso, bugunIso)
  if (gun < 0 || gun > Math.round(21 * 365.25)) return []
  const gorulen = new Set<string>()
  const birlesik = [...taramaCek(iso, bugunIso), ...yasBandiEk(gun)]
  return birlesik.filter((x) => {
    if (gorulen.has(x.id)) return false
    gorulen.add(x.id)
    return true
  })
}
