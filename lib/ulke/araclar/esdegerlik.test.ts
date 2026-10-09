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
import * as K4 from './tanimlar/cerrahiGogusGoz'
import { PREOP_MADDELER as TR_GC_PREOP, preopSkorla as gcPreopSkorla } from '@/specialties/genel-cerrahi/engines/preop'
import { yaraSkorla as gcYaraSkorla } from '@/specialties/genel-cerrahi/engines/yaraDren'
import { PREOP_MADDELER as TR_TORAKS_PREOP, preopSkorla as toraksPreopSkorla } from '@/specialties/gogus-cerrahisi/engines/preop'
import { TUP_YARA_DURUMLARI, TUP_YARA_TIPLERI, tupYaraSkorla } from '@/specialties/gogus-cerrahisi/engines/tupYara'
import { INHALER_CIHAZLARI, INHALER_TEKNIK_CIHAZ, INHALER_TEKNIK_ORTAK, inhalerIzlem } from '@/specialties/gogus-hastaliklari/engines/inhaler'
import { harfFarki, vaCoz } from '@/specialties/goz-hastaliklari/engines/va'
import * as K5 from './tanimlar/kalpKbb'
import { PREOP_MADDELER as TR_KDC_PREOP, preopSkorla as kdcPreopSkorla } from '@/specialties/kalp-damar-cerrahisi/engines/preop'
import { GREFT_YARA_DURUMLARI, GREFT_YARA_TIPLERI, greftYaraSkorla } from '@/specialties/kalp-damar-cerrahisi/engines/greftYara'
import { ANTIKOAG_SINIFLARI, antikoagSkorla } from '@/specialties/kalp-damar-cerrahisi/engines/antikoag'
import { izlemDegerlendir } from '@/specialties/kardiyoloji/engines/htKky'
import { asimetriNotu, degisim, skorla as ptaSkorla } from '@/specialties/kulak-burun-bogaz/engines/odyometri'
import { DIS_KULAK_LISTESI, EK_BULGULAR, TM_LISTESI, otoskopiNotu } from '@/specialties/kulak-burun-bogaz/engines/otoskopi'
import { MANEVRA_LISTESI, NISTAGMUS_OZELLIKLERI, SANTRAL_ISARETLERI, vertigoNotu } from '@/specialties/kulak-burun-bogaz/engines/vertigo'

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

SATIRLAR_3: {
  const va = (g: AracGirdisi, on: string): string | null => (g.bicim === 'ondalik' ? (typeof g[`${on}_ondalik`] === 'number' ? String(g[`${on}_ondalik`]) : null) : g.bicim === 'kesir' && typeof g[`${on}_pay`] === 'number' && typeof g[`${on}_payda`] === 'number' ? `${g[`${on}_pay`]}/${g[`${on}_payda`]}` : null)
  SATIRLAR.push(
    {
      arac: 'genel-preop', karsilik: 'specialties/genel-cerrahi/engines/preop.ts → preopSkorla (an untouched form has no result in the kit)', listeler: [[K4.GENEL_PREOP_MADDELER, TR_GC_PREOP.map((m) => m.id)]], sayilar: ['tamamlanan'],
      onlar: (g) => { const secili = isaretliler(g, K4.GENEL_PREOP_MADDELER); const r = gcPreopSkorla({ tamamlanan: secili, tarih: g.ameliyat_tarihi }); return { tamam: r.tamamMi && (secili.length > 0 || r.kart.ameliyatTarihi !== null), sayilar: { tamamlanan: r.kart.tamamlanan.length }, tarihler: dolu({ ameliyat_tarihi: r.kart.ameliyatTarihi }) } },
    },
    {
      arac: 'yara-dren-izlem', karsilik: 'specialties/genel-cerrahi/engines/yaraDren.ts → yaraSkorla (the same follow-up, for general surgery)', listeler: [], sayilar: ['dren_cikis_ml'],
      onlar: (g) => {
        if (g.tip === null) return { tamam: false }
        const r = gcYaraSkorla({ tip: g.tip, tarih: g.tarih, sonrakiKontrol: g.sonraki_kontrol, drenCikisMl: g.dren_cikis_ml })
        return { tamam: r.tamamMi, sayilar: dolu({ dren_cikis_ml: r.tamamMi && r.kart.tip === 'dren' ? r.kart.drenCikisMl : null }), tarihler: r.tamamMi ? dolu({ tarih: r.kart.tarih, sonraki_kontrol: r.kart.sonrakiKontrol }) : {} }
      },
    },
    { arac: 'toraks-preop', karsilik: 'specialties/gogus-cerrahisi/engines/preop.ts → preopSkorla', listeler: [[K4.TORAKS_PREOP_MADDELER, TR_TORAKS_PREOP.map((m) => m.kod)]], sayilar: [],
      onlar: (g) => { const r = toraksPreopSkorla(isaretliler(g, K4.TORAKS_PREOP_MADDELER)); return { tamam: r.tamamMi, uyarilar: r.gorevOnerileri.map((x) => x.kod.replace(/^preop_/, '')).sort() } } },
    {
      arac: 'toraks-tup-yara', karsilik: 'specialties/gogus-cerrahisi/engines/tupYara.ts → tupYaraSkorla (the kit asks for what and its state; the other application assumes them)', listeler: [[K4.TUP_YARA_TIPLERI, TUP_YARA_TIPLERI.map((x) => x.kod)], [K4.TUP_YARA_DURUMLARI, TUP_YARA_DURUMLARI.map((x) => x.kod)]],
      onlar: (g) => {
        if (g.tip === null || g.durum === null) return { tamam: false }
        const r = tupYaraSkorla({ tip: g.tip, durum: g.durum, tarih: g.tarih, sonrakiKontrol: g.sonraki_kontrol })
        assert.deepEqual(r.gorevOnerileri.map((x) => x.due), r.kart.sonrakiKontrol && r.tamamMi ? [r.kart.sonrakiKontrol] : [])
        return { tamam: r.tamamMi, tarihler: r.tamamMi ? dolu({ tarih: r.kart.tarih, sonraki_kontrol: r.kart.sonrakiKontrol }) : {} }
      },
    },
    {
      arac: 'inhaler-teknik', karsilik: 'specialties/gogus-hastaliklari/engines/inhaler.ts → inhalerIzlem (the next check only where the months are stated; that application assumes three)',
      listeler: [[K4.INHALER_CIHAZLARI, INHALER_CIHAZLARI], [[String(K4.INHALER_ORTAK.length)], [String(INHALER_TEKNIK_ORTAK.length)]], ...K4.INHALER_CIHAZLARI.map((c) => [[String(K4.INHALER_CIHAZ_ADIMLARI[c].length)], [String(INHALER_TEKNIK_CIHAZ[c].length)]] as const)], sayilar: ['tamamlanan'],
      onlar: (g) => {
        if (g.cihaz === null) return { tamam: false }
        const c = g.cihaz as (typeof K4.INHALER_CIHAZLARI)[number]
        // that application names a step by its sentence; the kit's keys stand in the same order
        const bizim = [...K4.INHALER_ORTAK, ...K4.INHALER_CIHAZ_ADIMLARI[c]], onlarin = [...INHALER_TEKNIK_ORTAK, ...INHALER_TEKNIK_CIHAZ[c]]
        const r = inhalerIzlem({ cihaz: c, tamamlanan: bizim.flatMap((k, i) => (g[k] === true ? [onlarin[i]] : [])), bugun: BUGUN, ...(typeof g.kontrol_ay === 'number' ? { kontrolAy: g.kontrol_ay } : {}) })
        assert.equal(r.toplam, bizim.length)
        return { tamam: true, sayilar: { tamamlanan: r.tamamSayi }, tarihler: dolu({ sonraki: typeof g.kontrol_ay === 'number' ? r.sonrakiKontrolIso : null }) }
      },
    },
    {
      arac: 'gorme-keskinligi', karsilik: 'specialties/goz-hastaliklari/engines/va.ts → vaCoz, harfFarki (decimal and fraction; the worded categories of that application are not in the kit)', listeler: [], sayilar: ['logmar', 'onceki_logmar', 'harf_farki'],
      onlar: (g) => {
        const simdi = vaCoz(va(g, 'simdi')), onceki = vaCoz(va(g, 'onceki'))
        if (!simdi || simdi.logmar === null) return { tamam: false }
        return { tamam: true, sayilar: dolu({ logmar: simdi.logmar, onceki_logmar: onceki?.logmar ?? null, harf_farki: onceki?.logmar != null ? (harfFarki(va(g, 'onceki'), va(g, 'simdi')) as number) + 0 : null }) }
      },
    },
  )
}

SATIRLAR_4: {
  const trDis = (k: string) => (k === 'buson' ? 'bu\u015fon' : k)
  SATIRLAR.push(
    { arac: 'kalp-damar-preop', karsilik: 'specialties/kalp-damar-cerrahisi/engines/preop.ts → preopSkorla', listeler: [[K5.KDC_PREOP_MADDELER, TR_KDC_PREOP.map((m) => m.kod)]], sayilar: [],
      onlar: (g) => { const r = kdcPreopSkorla(isaretliler(g, K5.KDC_PREOP_MADDELER)); return { tamam: r.tamamMi, uyarilar: r.gorevOnerileri.map((x) => x.kod.replace(/^preop_/, '')).sort() } } },
    { arac: 'greft-yara-izlem', karsilik: 'specialties/kalp-damar-cerrahisi/engines/greftYara.ts → greftYaraSkorla (the kit asks for what and its state; the other application assumes them)', listeler: [[K5.GREFT_TIPLERI, GREFT_YARA_TIPLERI.map((x) => x.kod)], [K5.GREFT_DURUMLARI, GREFT_YARA_DURUMLARI.map((x) => x.kod)]],
      onlar: (g) => { if (g.tip === null || g.durum === null) return { tamam: false }; const r = greftYaraSkorla({ tip: g.tip, durum: g.durum, tarih: g.tarih, sonrakiKontrol: g.sonraki_kontrol }); return { tamam: r.tamamMi, tarihler: r.tamamMi ? dolu({ tarih: r.kart.tarih, sonraki_kontrol: r.kart.sonrakiKontrol }) : {} } } },
    { arac: 'antikoagulan-vadeleri', karsilik: 'specialties/kalp-damar-cerrahisi/engines/antikoag.ts → antikoagSkorla (the kit asks for the class; the other application assumes "other")', listeler: [[K5.ANTIKOAG_SINIFLARI, ANTIKOAG_SINIFLARI.map((x) => x.kod)]],
      onlar: (g) => { if (g.sinif === null) return { tamam: false }; const r = antikoagSkorla({ sinif: g.sinif, sonrakiKontrol: g.sonraki_kontrol, labVadesi: g.lab_vadesi }); return { tamam: r.tamamMi, tarihler: r.tamamMi ? dolu({ sonraki_kontrol: r.kart.sonrakiKontrol, lab_vadesi: r.kart.labVadesi }) : {} } } },
    {
      arac: 'kardiyo-izlem', karsilik: 'specialties/kardiyoloji/engines/htKky.ts → izlemDegerlendir (with that application\'s own limits and intervals as parameters; a form with nothing measured has no result in the kit)', listeler: [],
      onlar: (g) => {
        if (g.tip === null || !(typeof g.sbp === 'number' || typeof g.dbp === 'number' || typeof g.kilo === 'number' || typeof g.nyha === 'string')) return { tamam: false }
        const r = izlemDegerlendir({ tip: g.tip as 'ht', bugun: BUGUN, sbp: g.sbp as number | null, dbp: g.dbp as number | null, kiloKg: g.kilo as number | null, nyha: g.nyha as 'I' | null })
        const ad: Record<string, string> = { kb_kontrol: 'kontrol', lab_elektrolit: 'lab', kky_kontrol: 'kontrol', kilo_izlem: 'kilo', af_kontrol: 'kontrol', inr_lab: 'lab', kontrol_randevu: 'kontrol' }
        return { tamam: r.eksikler.length === 0, uyarilar: r.uyarilar.map((u) => (/^Sistolik/.test(u) ? 'sbp_yuksek' : /^Diyastolik/.test(u) ? 'dbp_yuksek' : /^NYHA/.test(u) ? 'nyha_ileri' : `?${u}`)).sort(), tarihler: Object.fromEntries(r.gorevler.map((x) => [ad[x.kod] ?? `?${x.kod}`, x.due])) }
      },
    },
    {
      arac: 'odyometri-pta', karsilik: 'specialties/kulak-burun-bogaz/engines/odyometri.ts → skorla, degisim, asimetriNotu (bands compared wherever that application\'s ranges have no gap; see the test below)', listeler: [], sayilar: ['pta', 'fark'],
      onlar: (g) => {
        const r = ptaSkorla(K5.PTA_FREKANSLARI.map((k) => g[k] as number | null))
        if (!r.tamamMi || r.pta === null) return { tamam: false }
        const d = degisim(g.onceki_pta as number | null, r.pta)
        const boslukta = [25, 40, 55, 70, 90].some((ust) => r.pta! > ust && r.pta! < ust + 1)
        return { tamam: true, sayilar: dolu({ pta: r.pta, fark: d.fark }), ...(boslukta ? {} : { bant: r.bant }), uyarilar: [...(d.fark !== null && d.fark >= 10 ? ['esik_artisi'] : []), ...(d.fark !== null && d.fark <= -10 ? ['esik_azalisi'] : []), ...(asimetriNotu(r.pta, g.karsi_pta as number | null) ? ['asimetri'] : [])].sort() }
      },
    },
    {
      arac: 'otoskopi-notu', karsilik: 'specialties/kulak-burun-bogaz/engines/otoskopi.ts → otoskopiNotu',
      listeler: [[K5.DIS_KULAK.map(trDis), DIS_KULAK_LISTESI], [K5.KULAK_ZARI, TM_LISTESI], [[String(K5.OTOSKOPI_EK.length)], [String(EK_BULGULAR.length)]]],
      onlar: (g) => {
        const r = otoskopiNotu({ kulaklar: K5.KULAKLAR.map((y) => ({ yan: y, disKulak: K5.DIS_KULAK.filter((k) => g[K5.otoAlani(y, 'dis', k)] === true).map(trDis) as never, tm: K5.KULAK_ZARI.filter((k) => g[K5.otoAlani(y, 'zar', k)] === true) as never })), ekBulgular: K5.OTOSKOPI_EK.flatMap((k, i) => (g[k] === true ? [EK_BULGULAR[i]] : [])) })
        // that application writes each finding that needs a decision as one sentence; the kit returns one key for each
        const dikkat = K5.KULAKLAR.flatMap((y) => [...['perforasyon', 'bombe', 'retrakte', 'degerlendirilemedi'].map((k) => K5.otoAlani(y, 'zar', k)), ...['akinti', 'yabanci_cisim', 'odem_hassasiyet'].map((k) => K5.otoAlani(y, 'dis', k))].filter((a) => g[a] === true))
        if (r.tamamMi) assert.equal(r.dikkat.length, dikkat.length, 'findings that need a decision')
        return { tamam: r.tamamMi, uyarilar: r.tamamMi ? dikkat.sort() : [] }
      },
    },
    {
      arac: 'vertigo-notu', karsilik: 'specialties/kulak-burun-bogaz/engines/vertigo.ts → vertigoNotu',
      listeler: [[K5.MANEVRALAR, MANEVRA_LISTESI], [[String(K5.NISTAGMUS.length)], [String(NISTAGMUS_OZELLIKLERI.length)]], [[String(K5.SANTRAL.length)], [String(SANTRAL_ISARETLERI.length)]]],
      onlar: (g) => {
        const r = vertigoNotu({ manevralar: K5.MANEVRALAR.flatMap((k) => (typeof g[k] === 'string' ? [{ manevra: k, sonuc: g[k] as 'pozitif' }] : [])), nistagmus: K5.NISTAGMUS.flatMap((k, i) => (g[k] === true ? [NISTAGMUS_OZELLIKLERI[i]] : [])), santralIsaretleri: K5.SANTRAL.flatMap((k, i) => (g[k] === true ? [SANTRAL_ISARETLERI[i]] : [])), kulakBelirtisi: g.kulak_belirtisi === true })
        if (r.eksikler.some((x) => /^Hi/.test(x))) return { tamam: false }
        return { tamam: true, bant: r.manevraUygunMu ? 'manevra_uygun' : 'manevra_uygun_degil', uyarilar: [...(!r.manevraUygunMu ? ['santral_suphe'] : []), ...(r.uyarilar.some((u) => /^Repozisyon/.test(u)) ? ['repozisyon_santral'] : []), ...(r.eksikler.some((x) => /^Pozitif manevra/.test(x)) ? ['nistagmus_eksik'] : [])].sort() }
      },
    },
  )
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

  it('ONE DELIBERATE DIFFERENCE: a hearing average between two of the other application\'s whole-number bands is "profound" there; in the kit it is the band it lies in', () => {
    const t = kitAraci('odyometri-pta')!
    const ort = (pta: number) => ({ kulak: null, e05: pta, e1: pta, e2: pta, e4: pta, onceki_pta: null, karsi_pta: null })
    for (const [pta, bizim] of [[25.5, 'hafif'], [40.5, 'orta'], [55.5, 'orta_ileri'], [70.5, 'ileri'], [90.5, 'cok_ileri']] as const) {
      const onlar = ptaSkorla([pta, pta, pta, pta])
      assert.equal(onlar.pta, pta)
      assert.equal(onlar.bant, 'cok_ileri', `the other application calls ${pta} dB profound`)
      assert.equal(t.hesapla(ort(pta), { bugun: BUGUN, p: {} }).bant, bizim, `the kit: ${pta} dB`)
    }
    // on every whole number the two agree (the comparison above also runs over hundreds of samples)
    for (let pta = -10; pta <= 130; pta++) assert.equal(t.hesapla(ort(pta), { bugun: BUGUN, p: {} }).bant, ptaSkorla([pta, pta, pta, pta]).bant, `${pta} dB`)
  })
})
