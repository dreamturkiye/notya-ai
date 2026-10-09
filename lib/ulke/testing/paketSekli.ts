/**
 * NOTYA-ULKE-SABLON-01 — THE SHAPE of what a country pack must say, read from a pack that already says it.
 * Tests and scripts only (lib/ulke/testing/): scripts/ulke-sablon/sekil-uret.mts writes it to scripts/ulke-sablon/sekil.json
 * for the scaffold (scripts/ulke-yeni.mjs), and lib/ulke/paket.paket.test.ts compares that file with every complete
 * pack. The notation is explained at the top of sekil-uret.mts. No text of any country survives: a sentence becomes "$m".
 */
import type { UlkeArayuzu } from '../arayuz/tipler'
import type { UlkePaketi } from '../tipler'

/** Records keyed by the country's own languages: path → which list of the new country fills it. */
export const DIL_BASINA: Record<string, Record<string, string>> = {
  uygulama: { diller: 'temel', yazilar: 'yazi', 'muayene.konusmaDili': 'temel', 'not.cevir': 'cevir' },
  randevu: { 'hatirlatma.dilAdi': 'temel' },
  acilis: {},
}
/** Keys that are required only under a condition (the type marks them optional; the pack check enforces the condition). */
export const ISTEGE_BAGLI: Record<string, Record<string, string>> = {
  uygulama: {
    'ayarlar.saatDilimi': 'REQUIRED if the country has more than one time zone (uygulama.saatDilimleri): label of the setting',
    'ayarlar.saatDilimiIzoh': 'REQUIRED if the country has more than one time zone: one line under the setting',
    'yeniHasta.otaIsmi': 'REQUIRED if uygulama.adAlanlari.ikinciAd is true: label of the second name field',
    'yeniHasta.ulusalKimlik': 'REQUIRED if the pack has an identity number (ulusalKimlik is not null): label of that field',
  },
  randevu: {},
  acilis: {},
}
const SABIT_ANAHTARLAR = new Set(['id', 'rol'])

export function sekilCikar(deger: unknown, bolum: string, capalar: Record<string, string> = {}, yol = ''): unknown {
  if (DIL_BASINA[bolum]?.[yol]) return { $dil: DIL_BASINA[bolum][yol] }
  if (ISTEGE_BAGLI[bolum]?.[yol]) return { $istege: ISTEGE_BAGLI[bolum][yol] }
  const son = yol.split('.').pop() ?? ''
  if (typeof deger === 'string') {
    if (bolum === 'acilis' && son === 'capa') { const k = Object.keys(capalar).find((x) => capalar[x] === deger); if (!k) throw new Error(`${yol}: "${deger}" is not an anchor of the pack`); return { $capa: k } }
    // A badge number ("01") or a clock time ("09:14") reads the same in every language; anything else is the country's text.
    if (SABIT_ANAHTARLAR.has(son) || /^\d{1,2}(:\d{2})?$/.test(deger)) return { $sabit: deger }
    const yerler = [...new Set(deger.match(/%\d?/g) ?? [])].sort()
    return yerler.length ? `$m:${yerler.join(',')}` : '$m'
  }
  if (typeof deger === 'number' || typeof deger === 'boolean' || deger === null) return { $sabit: deger }
  if (Array.isArray(deger)) return deger.map((x, i) => sekilCikar(x, bolum, capalar, `${yol}[${i}]`))
  if (deger && typeof deger === 'object') return Object.fromEntries(Object.entries(deger).map(([k, v]) => [k, sekilCikar(v, bolum, capalar, yol ? `${yol}.${k}` : k)]))
  throw new Error(`${yol}: a ${typeof deger} cannot be part of a catalogue`)
}

/** The shape this pack's content has. Optional keys the pack does not use are added from ISTEGE_BAGLI, so the file never depends on which pack wrote it. */
export function paketSekli(p: UlkePaketi, a: UlkeArayuzu | null): Record<string, unknown> {
  if (!a || !p.uygulama || !a.acilis) throw new Error(`"${p.kod}" does not bring the application and a landing page; the shape is read from a pack that brings both`)
  const d = p.varsayilanDil
  const ekle = (agac: Record<string, unknown>, bolum: string) => {
    for (const [yol, kosul] of Object.entries(ISTEGE_BAGLI[bolum])) {
      const parcalar = yol.split('.'); let o = agac
      for (const k of parcalar.slice(0, -1)) o = o[k] as Record<string, unknown>
      o[parcalar[parcalar.length - 1]] = { $istege: kosul }
    }
    return agac
  }
  const sirala = (x: unknown): unknown => (Array.isArray(x) ? x.map(sirala) : x && typeof x === 'object' && !('$sabit' in x) ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, sirala(v)])) : x)
  const cekirdek = Object.fromEntries(p.yuzeyler.map((y) => [y, Object.keys((p.metinler[d] as Record<string, Record<string, string>>)[y])]))
  return {
    _: 'Written by scripts/ulke-sablon/sekil-uret.mts. Key paths only: no text of any country. Do not edit by hand.',
    cekirdek,
    uygulama: sirala(ekle(sekilCikar(a.metinler[d], 'uygulama') as Record<string, unknown>, 'uygulama')),
    randevu: sirala(ekle(sekilCikar(a.randevuMetinleri[d], 'randevu') as Record<string, unknown>, 'randevu')),
    acilis: sirala(sekilCikar(a.acilis.icerik[d], 'acilis', a.acilis.capalar)),
  }
}

/** A tree with array lengths taken out: what must agree between any two complete packs. */
export function iskelet(x: unknown): unknown {
  if (typeof x === 'string') return x.startsWith('$m') ? '$m' : x
  if (Array.isArray(x)) return x.length ? [iskelet(x[0])] : []
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>
    if ('$sabit' in o) return '$sabit'
    if ('$capa' in o) return '$capa'
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, iskelet(o[k])]))
  }
  return x
}

