/**
 * ESNEK-GELISIM — a SYNTHETIC regression set for the guard's tests (no real page, no patient: two invented KBB pages with
 * invented handwriting reads). `canliModel` stands in for the production model; the tests record its answers with
 * `kaydedenModel` exactly like the weekly run does, then replay them through the reader.
 */
import type { ModelKapisi, SayfaPaketi } from '../okuyucu'
import type { SetSayfasi, OlcumOrtami } from '../regresyonBekcisi'
import { kaliteKarari } from '../onisleme'
import { tohumlarTr, anahatTr } from '../tohum'
import { EL_NOTU_TR } from '../metinTr'
import { SPECIALTIES } from '@/lib/doktor/specialties'

const GORSEL = { mime: 'image/jpeg', base64: 'U0VOVEVUSUstTUFTS0VMSQ==' }

function paket(n: number): SayfaPaketi {
  return {
    sayfa: 1, sablonId: null, kalite: kaliteKarari({ bulaniklik: 500, parlama: 0, parlaklik: 160, kisaKenar: 1100, sayfaOrani: 0.9 }),
    satirlar: Array.from({ length: n }, (_, i) => ({ no: i + 1, kutu: { x0: 0.1, y0: 0.2 + i * 0.06, x1: 0.9, y1: 0.24 + i * 0.06 }, kelimeler: [], tanimlar: [], bolgeId: null })),
    bolgeler: [], parcalar: [{ gorsel: GORSEL, y0: 0, y1: 1 }], gizlilikKutulari: [{ x0: 0, y0: 0, x1: 1, y1: 0.1 }],
  }
}

type Satir = { y0: number; y1: number; kelimeler: { m: string; g: number }[] }
const L = (y0: number, ...k: [string, number][]): Satir => ({ y0, y1: y0 + 30, kelimeler: k.map(([m, g]) => ({ m, g })) })

/** Per page: the three independent reads the "production model" gives (page 2: the reads disagree on a side → Doğrula). */
const OKUMALAR: Record<string, Satir[][]> = {
  'sentetik-1': [
    [L(200, ['KZ', 0.95], ['doğal', 0.95]), L(260, ['Tonsil', 0.95], ['hipertrofik', 0.93]), L(320, ['Odyometri', 0.94], ['istendi', 0.92])],
    [L(202, ['KZ', 0.96], ['doğal', 0.94]), L(262, ['Tonsil', 0.94], ['hipertrofik', 0.95]), L(322, ['Odyometri', 0.95], ['istendi', 0.9])],
    [L(199, ['KZ', 0.94], ['doğal', 0.96]), L(259, ['Tonsil', 0.93], ['hipertrofik', 0.94]), L(319, ['Odyometri', 0.93], ['istendi', 0.93])],
  ],
  'sentetik-2': [
    [L(200, ['Burun', 0.95], ['tıkanıklığı', 0.94]), L(260, ['Septum', 0.95], ['sağa', 0.9]), L(320, ['Nazal', 0.94], ['sprey', 0.93])],
    [L(201, ['Burun', 0.94], ['tıkanıklığı', 0.95]), L(261, ['Septum', 0.94], ['sola', 0.9]), L(321, ['Nazal', 0.95], ['sprey', 0.92])],
    [L(198, ['Burun', 0.96], ['tıkanıklığı', 0.93]), L(258, ['Septum', 0.96], ['sağa', 0.8]), L(318, ['Nazal', 0.93], ['sprey', 0.94])],
  ],
}

export function ornekSet(): SetSayfasi[] {
  return [
    { ad: 'sentetik-1', brans: 'kulak-burun-bogaz', paket: paket(3), maskeliSayfa: GORSEL, gercekler: [
      { id: 'g1', metin: 'kulak zarı doğal', anahtarlar: [['zarı', 'KZ'], ['doğal', 'normal']] },
      { id: 'g2', metin: 'tonsil hipertrofik', anahtarlar: [['tonsil'], ['hipertrofik']] },
      { id: 'g3', metin: 'odyometri istendi', anahtarlar: [['odyometri']] },
    ] },
    { ad: 'sentetik-2', brans: 'kulak-burun-bogaz', paket: paket(3), maskeliSayfa: GORSEL, gercekler: [
      { id: 'g1', metin: 'burun tıkanıklığı', anahtarlar: [['burun'], ['tıkanıklığı']] },
      { id: 'g2', metin: 'septum sağa', anahtarlar: [['septum'], ['sağa', 'sağ']], korumali: true },
      { id: 'g3', metin: 'nazal sprey', anahtarlar: [['nazal'], ['sprey']] },
    ] },
  ]
}

/** The stand-in "production model": answers by page (the page name rides in the tile's base64 in this synthetic set). */
export function canliModel(sayfaAdi: string): ModelKapisi {
  return {
    async gorselJson({ etiket }) {
      const m = /^el-notu-sayfa-(\d)$/.exec(etiket)
      if (m) return { satirlar: OKUMALAR[sayfaAdi]?.[Number(m[1]) - 1] ?? [] }
      return { bulgular: [] }
    },
    async metinJson() { return { satirlar: [] } },
  }
}

export function ornekOrtam(): OlcumOrtami {
  return { dil: EL_NOTU_TR.dil, tohum: (b) => tohumlarTr(b), anahat: (b) => anahatTr(b), bransAdi: (b) => SPECIALTIES.find((x) => x.key === b)?.label || b || 'genel' }
}
