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
import { ORNEK_BUGUN, ORNEK_PARAMETRELER, ornekGirdiler, ornekOrtam } from '../testing/aracOrnekleri'
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
import * as K2 from './tanimlar/cerrahiDahiliyeDerm'
import * as K3 from './tanimlar/endoEnfeksiyonGastro'
import { POSTOP_MADDELER as TR_POSTOP, PREOP_MADDELER as TR_PREOP, prepostSkorla } from '@/specialties/cocuk-cerrahisi/engines/prepost'
import { yaraGorevleri, yaraNormalize, yaraSkorla } from '@/specialties/cocuk-cerrahisi/engines/yaraDren'
import { aEvre, ckdDegerlendir, gEvre, kdigoRenk } from '@/specialties/dahiliye/engines/ckd'
import { SCORAD_SIDDET_ALANLARI, easi, easiBandi, pasi, pasiBandi, scoradBandi, scoradHesap } from '@/specialties/dermatoloji/engines/score-calculator'
import { plannedReads } from '@/specialties/dermatoloji/engines/patch-calendar'
import { labSkorla, sonrakiIzlemTarihi } from '@/specialties/endokrinoloji/engines/labIzlem'
import { dxaPlanla } from '@/specialties/endokrinoloji/engines/dxa'
import { rejimGorevleri, rejimNormalize } from '@/specialties/endokrinoloji/engines/rejim'
import { atbHesapla } from '@/specialties/enfeksiyon-hastaliklari/engines/atbSure'
import { viralPlanla } from '@/specialties/enfeksiyon-hastaliklari/engines/viralIzlem'
import { skorHesapla, sonrakiKontrolTarihi } from '@/specialties/gastroenteroloji/engines/ibdIbs'
import { hepatitPlanla } from '@/specialties/gastroenteroloji/engines/hbvHcv'

const BUGUN = ORNEK_BUGUN
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

const SATIRLAR: Satir[] = [
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

const dolu = <T,>(o: Record<string, T | null | undefined>): Record<string, T> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined)) as Record<string, T>
const num = (x: unknown): number => (typeof x === 'number' ? x : 0)
const bolge = (g: AracGirdisi, b: string) => ({ e: num(g[`${b}_e`]), i: num(g[`${b}_i`]), d: num(g[`${b}_d`]), l: num(g[`${b}_l`]), a: num(g[`${b}_a`]) })
const bolgeler = (g: AracGirdisi) => ({ head: bolge(g, 'bas'), upper: bolge(g, 'ust'), trunk: bolge(g, 'govde'), lower: bolge(g, 'alt') })
const girilen = (g: AracGirdisi, ekler: readonly string[]) => K2.DERI_BOLGELERI.some((b) => ekler.some((k) => typeof g[`${b}_${k}`] === 'number'))
const P = ORNEK_PARAMETRELER

SATIRLAR_2: {
  const ek: Satir[] = [
    {
      arac: 'cocuk-prepost-op', karsilik: 'specialties/cocuk-cerrahisi/engines/prepost.ts → prepostSkorla (the kit asks for the list; the other application assumes "before")',
      listeler: [[K2.PREOP_MADDELER, TR_PREOP.map((m) => m.id)], [K2.POSTOP_MADDELER.map((k) => (k === 'postop_acil_yol' ? 'acil_kisi' : k)), TR_POSTOP.map((m) => m.id)]], sayilar: ['tamamlanan'],
      onlar: (g) => {
        if (g.tip === null) return { tamam: false }
        const liste = g.tip === 'preop' ? K2.PREOP_MADDELER : K2.POSTOP_MADDELER
        const r = prepostSkorla({ tip: g.tip, tamamlanan: isaretliler(g, liste).map((k) => (k === 'postop_acil_yol' ? 'acil_kisi' : k)), tarih: g.ameliyat_tarihi })
        return { tamam: r.tamamMi, sayilar: { tamamlanan: r.kart.tamamlanan.length }, tarihler: dolu({ ameliyat_tarihi: r.kart.ameliyatTarihi }) }
      },
    },
    {
      arac: 'yara-dren-izlem', karsilik: 'specialties/cocuk-cerrahisi/engines/yaraDren.ts → yaraSkorla (the kit asks for what is followed; the other application assumes "wound")', listeler: [], sayilar: ['dren_cikis_ml'],
      onlar: (g) => {
        if (g.tip === null) return { tamam: false }
        const r = yaraSkorla({ tip: g.tip, tarih: g.tarih, sonrakiKontrol: g.sonraki_kontrol, drenCikisMl: g.dren_cikis_ml })
        return { tamam: r.tamamMi, sayilar: dolu({ dren_cikis_ml: r.tamamMi && r.kart.tip === 'dren' ? r.kart.drenCikisMl : null }), tarihler: r.tamamMi ? dolu({ tarih: r.kart.tarih, sonraki_kontrol: r.kart.sonrakiKontrol }) : {} }
      },
    },
    {
      arac: 'kdigo-evre', karsilik: 'specialties/dahiliye/engines/ckd.ts → gEvre, aEvre, kdigoRenk, ckdDegerlendir (categories, risk cell, referral flag; the plan and the interval are not the kit\'s)', listeler: [],
      onlar: (g) => {
        const r = ckdDegerlendir({ eGFR: g.egfr, eGFRTarih: BUGUN, oncekiEGFR: typeof g.egfr_bir_yil_once === 'number' ? [{ deger: g.egfr_bir_yil_once, tarih: '2025-10-09' }] : [], uacr: g.uacr, uacrTarih: BUGUN, dm: false, ht: false, rasBlokeri: false, sglt2: false, nsaii: false, k: null, hb: null, bugun: BUGUN } as never)
        if (r.g === null) return { tamam: false }
        assert.equal(r.g, gEvre(g.egfr as number)); if (typeof g.uacr === 'number') assert.equal(r.a, aEvre(g.uacr)); assert.equal(r.renk, kdigoRenk(r.g, r.a))
        const sevk = r.sevk[0] ? (/eGFR <30/.test(r.sevk[0]) ? 'sevk_egfr30' : /UACR >300/.test(r.sevk[0]) ? 'sevk_a3' : /%25/.test(r.sevk[0]) ? 'sevk_hizli_dusus' : /risk h/.test(r.sevk[0]) ? 'sevk_cok_yuksek_risk' : `?${r.sevk[0]}`) : null
        return { tamam: true, bant: r.renk, uyarilar: [r.g, ...(r.a ? [r.a] : []), ...(r.hizliDusus ? ['hizli_dusus'] : []), ...(sevk ? [sevk] : [])].sort() }
      },
    },
    { arac: 'pasi', karsilik: 'specialties/dermatoloji/engines/score-calculator.ts → pasi, pasiBandi', listeler: [], sayilar: ['pasi'],
      onlar: (g) => { const v = pasi(bolgeler(g)); return { tamam: girilen(g, ['e', 'i', 'd', 'a']), sayilar: { pasi: v }, bant: pasiBandi(v).kod } } },
    { arac: 'easi', karsilik: 'specialties/dermatoloji/engines/score-calculator.ts → easi, easiBandi (four signs: the function takes lichenification as its own sign)', listeler: [], sayilar: ['easi'],
      onlar: (g) => { const v = easi(bolgeler(g)); return { tamam: girilen(g, ['e', 'i', 'd', 'l', 'a']), sayilar: { easi: v }, bant: easiBandi(v).kod } } },
    { arac: 'scorad', karsilik: 'specialties/dermatoloji/engines/score-calculator.ts → scoradHesap, scoradBandi', listeler: [[K2.SCORAD_SIDDET, SCORAD_SIDDET_ALANLARI.map((x) => x.id)]], sayilar: ['scorad', 'a', 'b', 'c'],
      onlar: (g) => { const r = scoradHesap({ 'yaygınlık': num(g.yayginlik), siddet: Object.fromEntries(K2.SCORAD_SIDDET.map((k) => [k, num(g[k])])), kasinti: num(g.kasinti), uykusuzluk: num(g.uykusuzluk) }); return { tamam: typeof g.yayginlik === 'number', sayilar: { scorad: r.toplam, a: r.a, b: r.b, c: r.c }, bant: scoradBandi(r.toplam).kod } } },
    { arac: 'yama-okuma', karsilik: 'specialties/dermatoloji/engines/patch-calendar.ts → plannedReads', listeler: [],
      onlar: (g) => (typeof g.uygulama === 'string' ? { tamam: true, tarihler: plannedReads(g.uygulama) } : { tamam: false }) },
    {
      arac: 'lab-izlem', karsilik: 'specialties/endokrinoloji/engines/labIzlem.ts → labSkorla, sonrakiIzlemTarihi (HbA1c and TSH; with that application\'s own thresholds and intervals as parameters)', listeler: [], sayilar: ['sonraki_ay'],
      onlar: (g) => {
        if (g.tur === null) return { tamam: false }
        const r = labSkorla(g.tur as 'hba1c' | 'tsh', g.deger as number | null)
        return { tamam: r.tamamMi, bant: r.bant, sayilar: dolu({ sonraki_ay: r.tamamMi ? r.sonrakiAy : null }), tarihler: dolu({ sonraki: r.tamamMi && typeof g.tarih === 'string' ? sonrakiIzlemTarihi(g.tarih, r.sonrakiAy) : null }) }
      },
    },
    {
      arac: 'dxa-tekrar', karsilik: 'specialties/endokrinoloji/engines/dxa.ts → dxaPlanla (with that application\'s own years as parameters)', listeler: [],
      onlar: (g) => { if (g.risk === null) return { tamam: false }; const r = dxaPlanla(g.son_dxa as string | null, g.risk as 'dusuk', BUGUN); return { tamam: r.tamamMi, tarihler: dolu({ sonraki: r.sonrakiTarih }), uyarilar: r.sonrakiTarih && r.sonrakiTarih < BUGUN ? ['gecikti'] : [] } },
    },
    {
      arac: 'rejim-karti', karsilik: 'specialties/endokrinoloji/engines/rejim.ts → rejimNormalize, rejimGorevleri', listeler: [],
      onlar: (g) => {
        const k = rejimNormalize({ insulinBaslangic: g.insulin_baslangic, insulinKontrol: g.insulin_kontrol, tiroidBaslangic: g.tiroid_baslangic, tiroidKontrol: g.tiroid_kontrol })
        const tarihler = dolu({ insulin_baslangic: k.insulinBaslangic, insulin_kontrol: k.insulinKontrol, tiroid_baslangic: k.tiroidBaslangic, tiroid_kontrol: k.tiroidKontrol })
        // the follow-up days that application derives are the two "next check" days, as they stand
        assert.deepEqual(rejimGorevleri(k).map((x) => x.due).sort(), [k.insulinKontrol, k.tiroidKontrol].filter(Boolean).sort())
        return { tamam: Object.keys(tarihler).length > 0, tarihler }
      },
    },
    { arac: 'antibiyotik-sure', karsilik: 'specialties/enfeksiyon-hastaliklari/engines/atbSure.ts → atbHesapla', listeler: [],
      onlar: (g) => { const r = atbHesapla(g.baslangic as string | null, g.sure_gun as number | null, g.kontrol as string | null); return { tamam: r.tamamMi, tarihler: r.tamamMi ? dolu({ bitis: r.kart.bitis, kontrol: r.kart.kontrol }) : {} } } },
    { arac: 'viral-izlem', karsilik: 'specialties/enfeksiyon-hastaliklari/engines/viralIzlem.ts → viralPlanla (with that application\'s own months as parameters)', listeler: [],
      onlar: (g) => { if (g.tur === null) return { tamam: false }; const r = viralPlanla(g.tur as 'hbv', g.son_tarih as string | null, BUGUN); return { tamam: r.tamamMi, tarihler: dolu({ sonraki: r.sonrakiTarih }), uyarilar: r.sonrakiTarih && r.sonrakiTarih < BUGUN ? ['gecikti'] : [] } } },
    {
      arac: 'ibd-skor', karsilik: 'specialties/gastroenteroloji/engines/ibdIbs.ts → skorHesapla, sonrakiKontrolTarihi (with that application\'s own cut-offs and months as parameters)', listeler: [], sayilar: ['sonraki_ay'],
      onlar: (g) => {
        if (g.tur === null) return { tamam: false }
        const r = skorHesapla(g.tur as 'hbi', g.skor as number | null)
        return { tamam: r.tamamMi, bant: r.bant, sayilar: dolu({ sonraki_ay: r.tamamMi ? r.sonrakiAy : null }), tarihler: dolu({ sonraki: r.tamamMi && typeof g.tarih === 'string' ? sonrakiKontrolTarihi(g.tarih, r.sonrakiAy) : null }) }
      },
    },
    { arac: 'hepatit-izlem', karsilik: 'specialties/gastroenteroloji/engines/hbvHcv.ts → hepatitPlanla (with that application\'s own months as parameters)', listeler: [], sayilar: ['sonraki_ay'],
      onlar: (g) => { if (g.tur === null || g.bant === null) return { tamam: false }; const r = hepatitPlanla(g.tur as 'hbv', g.bant as 'stabil', BUGUN); return { tamam: r.tamamMi, sayilar: dolu({ sonraki_ay: r.sonrakiAy }), tarihler: dolu({ sonraki: r.sonrakiTarih }) } } },
  ]
  SATIRLAR.push(...ek)
  void P
}

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
        const biz = kitOzu(t.hesapla(g, ornekOrtam(t)), { sayilar: s.sayilar })
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
      assert.ok(tamamlanan >= 15 && tamamlanan < girdiler.length, `${tamamlanan} of ${girdiler.length} samples had a result: both the answered and the unanswered case must be exercised`)
    })
  }

  it('where the other application proposes a follow-up day of its own, the kit proposes none: an interval is the country\'s to state', () => {
    // suture removal, no next check given: that application says "ten days later"; the kit returns the day entered and nothing else
    const g = { tip: 'dikis', bolge: null, tarih: '2026-10-01', sonraki_kontrol: null, dren_cikis_ml: null }
    assert.deepEqual(yaraGorevleri(yaraNormalize({ tip: 'dikis', tarih: '2026-10-01' })).map((x) => x.due), ['2026-10-11'])
    assert.deepEqual(kitAraci('yara-dren-izlem')!.hesapla(g, { bugun: BUGUN, p: {} }).tarihler, [{ anahtar: 'tarih', tarih: '2026-10-01' }])
    // a tool that leaves numbers to the country computes with the country's numbers, not with the sample ones
    const lab = kitAraci('lab-izlem')!
    const baska = { ...ORNEK_PARAMETRELER['lab-izlem'], hba1c_dikkat: 6.5, ay_hba1c_dikkat: 4 }
    assert.equal(lab.hesapla({ tur: 'hba1c', deger: 6.8, tarih: null }, { bugun: BUGUN, p: ORNEK_PARAMETRELER['lab-izlem'] }).bant, 'hedef_yakin')
    const s2 = lab.hesapla({ tur: 'hba1c', deger: 6.8, tarih: '2026-01-31' }, { bugun: BUGUN, p: baska })
    assert.deepEqual([s2.bant, s2.sayilar[0].deger, s2.tarihler[0].tarih], ['dikkat', 4, '2026-05-31'])
  })
})
