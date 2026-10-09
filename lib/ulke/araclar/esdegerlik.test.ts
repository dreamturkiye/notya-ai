/**
 * NOTYA-ULKE-ARACLAR-01 — SAME INPUTS, SAME OUTPUTS. Every tool of the country kit that stands beside a tool of the
 * pre-split application is run against it here: the kit's function and the other application's function get the
 * same inputs, and what they work out must agree — whether there is a result at all, every number, every band,
 * every follow-up, every date. The lists of items must be the same lists, key for key.
 *
 * WHY A TEST AND NOT AN IMPORT. The other application's functions return sentences in its own language beside the
 * numbers. A country build must not carry another country's text, so the kit does not import them (wall rule D7);
 * it holds the arithmetic alone, and this file is what keeps the two from drifting apart.
 *
 * A tool of the kit without a row here has no counterpart, and says so in `KARSILIKSIZ` with the reason.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ornekGirdiler } from '../testing/aracOrnekleri'
import { KIT_ARACLARI, kitAraci } from './katalog'
import type { AracGirdisi, AracSonucu } from './tipler'
import { isaretliler } from './yardimci'
import * as K1 from './tanimlar/acilAnesteziBeyin'
import { ESI_KAYNAKLAR, esiSkorla } from '@/specialties/acil-tip/engines/esi'
import { KRITIK_MADDELER, KRITIK_YOLLAR, kritikYolSkorla } from '@/specialties/acil-tip/engines/kritikYol'
import { ASA_MADDELER, asaSkorla } from '@/specialties/anestezi/engines/asa'
import { HAVA_YOLU_BAYRAKLAR, havaYoluSkorla } from '@/specialties/anestezi/engines/havaYolu'
import { AGRI_BAYRAKLAR, agriSkorla } from '@/specialties/anestezi/engines/agri'
import { POSTOP_MADDELER, postopSkorla } from '@/specialties/beyin-cerrahisi/engines/postop'
import { BILINC_BAYRAKLAR, bilincSkorla } from '@/specialties/beyin-cerrahisi/engines/bilinc'

const BUGUN = '2026-10-09'
/** What both sides are reduced to before they are compared. */
type Oz = { tamam: boolean; sayilar?: Record<string, number>; bant?: string | null; uyarilar?: string[]; tarihler?: Record<string, string> }
const kitOzu = (s: AracSonucu, alanlar: { sayilar?: readonly string[] } = {}): Required<Oz> => ({
  tamam: s.tamam,
  sayilar: Object.fromEntries(s.sayilar.filter((x) => !alanlar.sayilar || alanlar.sayilar.includes(x.anahtar)).map((x) => [x.anahtar, x.deger])),
  bant: s.bant, uyarilar: [...s.uyarilar].sort(), tarihler: Object.fromEntries(s.tarihler.map((d) => [d.tarih ? d.anahtar : d.anahtar, d.tarih])),
})
const kodlar = (liste: readonly { kod: string }[]) => liste.map((x) => x.kod)

type Satir = {
  /** The kit's key. */
  arac: string
  /** The pre-split application's function, by name, for the record. */
  karsilik: string
  /** The two lists of items, which must be equal key for key. */
  listeler: readonly (readonly [readonly string[], readonly string[]])[]
  /** The other application's answer for the same input, reduced to what the kit also answers. */
  onlar: (g: AracGirdisi) => Oz
  /** Which of the kit's numbers the other side also has (a count of ticked boxes is the kit's own way of showing a list). */
  sayilar?: readonly string[]
}

const SATIRLAR: readonly Satir[] = [
  {
    arac: 'esi-triyaj', karsilik: 'specialties/acil-tip/engines/esi.ts → esiSkorla', listeler: [[K1.ESI_KAYNAK_ANAHTARLARI, kodlar(ESI_KAYNAKLAR)]],
    onlar: (g) => { const r = esiSkorla({ seviye: g.seviye, kaynaklar: isaretliler(g, K1.ESI_KAYNAK_ANAHTARLARI) }); return { tamam: r.tamamMi, bant: r.tamamMi ? `esi${r.seviye}` : null, uyarilar: r.gorevOnerileri.map((x) => ({ esi_yeniden_degerlendirme: 'yeniden_degerlendirme', resus_takip: 'resus_takip' } as Record<string, string>)[x.kod]).sort() } },
  },
  {
    arac: 'kritik-yol', karsilik: 'specialties/acil-tip/engines/kritikYol.ts → kritikYolSkorla', listeler: [[K1.KRITIK_YOLLAR, kodlar(KRITIK_YOLLAR)], [K1.KRITIK_MADDELER, kodlar(KRITIK_MADDELER)]], sayilar: ['yol', 'madde'],
    onlar: (g) => { const r = kritikYolSkorla({ yollar: isaretliler(g, K1.KRITIK_YOLLAR), maddeler: isaretliler(g, K1.KRITIK_MADDELER) }); return { tamam: r.tamamMi, sayilar: (r.tamamMi ? { yol: r.yollar.length, madde: r.maddeler.length } : {}) as Record<string, number> } },
  },
  {
    arac: 'asa-preop', karsilik: 'specialties/anestezi/engines/asa.ts → asaSkorla', listeler: [[K1.ASA_MADDELER, kodlar(ASA_MADDELER)]], sayilar: [],
    onlar: (g) => { const r = asaSkorla(isaretliler(g, K1.ASA_MADDELER), g.asa_sinif); return { tamam: r.tamamMi, bant: r.tamamMi ? r.asaSinif : null, uyarilar: r.gorevOnerileri.map((x) => x.kod.replace(/^asa_/, '')).sort() } },
  },
  {
    arac: 'hava-yolu-notu', karsilik: 'specialties/anestezi/engines/havaYolu.ts → havaYoluSkorla', listeler: [[K1.HAVA_YOLU_BAYRAKLARI, kodlar(HAVA_YOLU_BAYRAKLAR)]], sayilar: [],
    onlar: (g) => { const r = havaYoluSkorla({ bayraklar: isaretliler(g, K1.HAVA_YOLU_BAYRAKLARI), tarih: g.tarih }); return { tamam: r.tamamMi, tarihler: (r.tamamMi && r.kart.tarih ? { tarih: r.kart.tarih } : {}) as Record<string, string> } },
  },
  {
    arac: 'postop-agri', karsilik: 'specialties/anestezi/engines/agri.ts → agriSkorla', listeler: [[K1.AGRI_BAYRAKLARI, kodlar(AGRI_BAYRAKLAR)]], sayilar: ['agri_skor'],
    onlar: (g) => { const r = agriSkorla({ bayraklar: isaretliler(g, K1.AGRI_BAYRAKLARI), agriSkor: g.agri_skor, tarih: g.tarih }); return { tamam: r.tamamMi, sayilar: (r.tamamMi && r.kart.agriSkor !== null ? { agri_skor: r.kart.agriSkor } : {}) as Record<string, number>, tarihler: (r.tamamMi && r.kart.tarih ? { tarih: r.kart.tarih } : {}) as Record<string, string> } },
  },
  {
    arac: 'noro-postop', karsilik: 'specialties/beyin-cerrahisi/engines/postop.ts → postopSkorla', listeler: [[K1.NORO_POSTOP_MADDELER, kodlar(POSTOP_MADDELER)]], sayilar: [],
    onlar: (g) => { const r = postopSkorla(isaretliler(g, K1.NORO_POSTOP_MADDELER)); return { tamam: r.tamamMi, uyarilar: r.gorevOnerileri.map((x) => x.kod.replace(/^postop_/, '')).sort() } },
  },
  {
    arac: 'nobet-bilinc', karsilik: 'specialties/beyin-cerrahisi/engines/bilinc.ts → bilincSkorla', listeler: [[K1.BILINC_BAYRAKLARI, kodlar(BILINC_BAYRAKLAR)]], sayilar: [],
    onlar: (g) => { const r = bilincSkorla({ bayraklar: isaretliler(g, K1.BILINC_BAYRAKLARI), tarih: g.tarih }); return { tamam: r.tamamMi, tarihler: (r.tamamMi && r.kart.tarih ? { tarih: r.kart.tarih } : {}) as Record<string, string> } },
  },
]

/** Tools of the kit that have no function to stand beside, and why. */
const KARSILIKSIZ: Readonly<Record<string, string>> = {
  'hasta-portali': 'a screen of the kit (a patient search that leads to the patient\'s file); it works nothing out',
}

describe('tools — the kit\'s arithmetic equals the pre-split application\'s, input for input', () => {
  it('every tool of the kit is compared, or says why it has nothing to be compared with', () => {
    const karsilastirilan = new Set(SATIRLAR.map((s) => s.arac))
    for (const t of KIT_ARACLARI) assert.ok(karsilastirilan.has(t.anahtar) !== (t.anahtar in KARSILIKSIZ), `${t.anahtar}: must be in exactly one of the comparison table and the list of tools without a counterpart`)
    for (const s of SATIRLAR) assert.ok(kitAraci(s.arac), `${s.arac} is compared and is not a tool of the kit`)
    for (const k of Object.keys(KARSILIKSIZ)) assert.ok(kitAraci(k), `${k} is listed as having no counterpart and is not a tool of the kit`)
  })

  for (const s of SATIRLAR) {
    it(`${s.arac} = ${s.karsilik}`, () => {
      for (const [bizim, onlarin] of s.listeler) assert.deepEqual([...bizim], [...onlarin], 'the two lists of items differ')
      const t = kitAraci(s.arac)!
      const girdiler = ornekGirdiler(t, 400)
      let tamamlanan = 0
      for (const g of girdiler) {
        const biz = kitOzu(t.hesapla(g, { bugun: BUGUN }), { sayilar: s.sayilar })
        const onlar = s.onlar(g)
        const metin = JSON.stringify(g)
        assert.equal(biz.tamam, onlar.tamam, `whether there is a result — ${metin}`)
        if (!biz.tamam) continue
        tamamlanan++
        if (onlar.sayilar !== undefined) assert.deepEqual(biz.sayilar, onlar.sayilar, `numbers — ${metin}`)
        if (onlar.bant !== undefined) assert.equal(biz.bant, onlar.bant, `band — ${metin}`)
        if (onlar.uyarilar !== undefined) assert.deepEqual(biz.uyarilar, onlar.uyarilar, `follow-ups — ${metin}`)
        if (onlar.tarihler !== undefined) assert.deepEqual(biz.tarihler, onlar.tarihler, `dates — ${metin}`)
      }
      assert.ok(tamamlanan >= 20 && tamamlanan < girdiler.length, `${tamamlanan} of ${girdiler.length} samples had a result: both the answered and the unanswered case must be exercised`)
    })
  }
})
