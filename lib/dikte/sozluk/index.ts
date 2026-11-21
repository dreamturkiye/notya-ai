/**
 * DIKTE-TIBBI-01 — lazy lexicon loader. Core (all 40 branşlar) + the doctor's branş file; each branş file is its own
 * dynamic-import chunk, so a page or route pays only for the branş it dictates in (performance budget).
 */
import type { Sozluk } from '../duzelt'
import { sozlukBirlestir } from '../duzelt'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { klinikSlugCoz } from '@/lib/specialties/klinikDikey'

type Yukleyici = () => Promise<{ default: Sozluk }>

/** 30 medical branches + 10 Özel Branşlar — every key the app uses for a doctor's branş. */
export const DIKTE_BRANSLARI: Record<string, Yukleyici> = {
  'pediatri': () => import('./b/pediatri'),
  'kardiyoloji': () => import('./b/kardiyoloji'),
  'noroloji': () => import('./b/noroloji'),
  'dahiliye': () => import('./b/dahiliye'),
  'psikiyatri': () => import('./b/psikiyatri'),
  'genel-cerrahi': () => import('./b/genel-cerrahi'),
  'ortopedi': () => import('./b/ortopedi'),
  'dermatoloji': () => import('./b/dermatoloji'),
  'kulak-burun-bogaz': () => import('./b/kulak-burun-bogaz'),
  'goz-hastaliklari': () => import('./b/goz-hastaliklari'),
  'kadin-hastaliklari-dogum': () => import('./b/kadin-hastaliklari-dogum'),
  'uroloji': () => import('./b/uroloji'),
  'radyoloji': () => import('./b/radyoloji'),
  'anestezi': () => import('./b/anestezi'),
  'acil-tip': () => import('./b/acil-tip'),
  'fizik-tedavi': () => import('./b/fizik-tedavi'),
  'enfeksiyon-hastaliklari': () => import('./b/enfeksiyon-hastaliklari'),
  'endokrinoloji': () => import('./b/endokrinoloji'),
  'gastroenteroloji': () => import('./b/gastroenteroloji'),
  'nefroloji': () => import('./b/nefroloji'),
  'romatoloji': () => import('./b/romatoloji'),
  'onkoloji': () => import('./b/onkoloji'),
  'gogus-hastaliklari': () => import('./b/gogus-hastaliklari'),
  'gogus-cerrahisi': () => import('./b/gogus-cerrahisi'),
  'plastik-cerrahi': () => import('./b/plastik-cerrahi'),
  'beyin-cerrahisi': () => import('./b/beyin-cerrahisi'),
  'kalp-damar-cerrahisi': () => import('./b/kalp-damar-cerrahisi'),
  'cocuk-cerrahisi': () => import('./b/cocuk-cerrahisi'),
  'aile-hekimligi': () => import('./b/aile-hekimligi'),
  'spor-hekimligi': () => import('./b/spor-hekimligi'),
  'sac-ekimi': () => import('./b/sac-ekimi'),
  'estetik-cerrahi': () => import('./b/estetik-cerrahi'),
  'medikal-estetik': () => import('./b/medikal-estetik'),
  'klinik-dermatoloji': () => import('./b/klinik-dermatoloji'),
  'longevity': () => import('./b/longevity'),
  'fizyoterapi': () => import('./b/fizyoterapi'),
  'klinik-psikolog': () => import('./b/klinik-psikolog'),
  'diyetisyen': () => import('./b/diyetisyen'),
  'ergoterapi': () => import('./b/ergoterapi'),
  'odyoloji': () => import('./b/odyoloji'),
}

/** Raw branş value ('KBB', 'kulak-burun-bogaz', 'Kulak Burun Boğaz', 'sac-ekimi') → lexicon key, or null. */
export function dikteBransKey(ham: string | null | undefined): string | null {
  const ozel = klinikSlugCoz(ham)
  if (ozel && DIKTE_BRANSLARI[ozel]) return ozel
  const b = bransAnahtari(ham)
  if (b && DIKTE_BRANSLARI[b]) return b
  const duz = String(ham || '').trim().toLowerCase()
  if (duz === 'kbb') return 'kulak-burun-bogaz'
  return DIKTE_BRANSLARI[duz] ? duz : null
}

const onbellek = new Map<string, Promise<Sozluk>>()

/** Core + branş lexicon (core only when the branş is unknown / "genel"). Cached per branş for the process. */
export function dikteSozluguYukle(brans: string | null | undefined): Promise<Sozluk> {
  const key = dikteBransKey(brans) || ''
  const var_ = onbellek.get(key)
  if (var_) return var_
  const soz = (async () => {
    const ortak = (await import('./ortak')).default
    const yukle = key ? DIKTE_BRANSLARI[key] : null
    if (!yukle) return ortak
    try { return sozlukBirlestir(ortak, (await yukle()).default) } catch { return ortak }
  })()
  onbellek.set(key, soz)
  return soz
}
