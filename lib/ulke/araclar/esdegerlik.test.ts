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
import * as K6 from './tanimlar/nefroOnko'
import * as K7 from './tanimlar/ortoPediRadyoRoma'
import { egfrSkorla } from '@/specialties/nefroloji/engines/egfr'
import { diyalizGorevleri, diyalizSkorla } from '@/specialties/nefroloji/engines/diyaliz'
import { anemiSkorla, anemiSonrakiTarih } from '@/specialties/nefroloji/engines/anemi'
import { kurGorevleri, kurSkorla } from '@/specialties/onkoloji/engines/kur'
import { TOKSISITE_MADDELER, toksisiteSkorla } from '@/specialties/onkoloji/engines/toksisite'
import { BOLGELER as TR_KIRIK_BOLGELER, NV_DURUMLARI as TR_NV, OP_PROTOKOL_MADDELERI as TR_OP_PROTOKOL, TARAFLAR as TR_TARAFLAR, ozetle as kirikOzetle } from '@/specialties/ortopedi/engines/kirikAlci'
import { FONKSIYON_MADDELER, skorla as vasSkorla } from '@/specialties/ortopedi/engines/vasFonksiyon'
import { hesaplaHedefBoy } from '@/lib/clinical/hedefBoy'
import { dozHesapla } from '@/specialties/pediatri/engines/doz'
import { yaraGorevleri as plastikYaraGorevleri, yaraNormalize as plastikYaraNormalize, yaraSkorla as plastikYaraSkorla } from '@/specialties/plastik-cerrahi/engines/yara'
import { RADYO_DURUMLAR, RADYO_MODALITELER, RADYO_ONCELIKLER, kuyrukSkorla } from '@/specialties/radyoloji/engines/kuyruk'
import { BIRADS_KATEGORILER, RAPOR_SABLON, raporSkorla } from '@/specialties/radyoloji/engines/rapor'
import { das28Skorla } from '@/specialties/romatoloji/engines/das28Basdai'
import { EKLEM_28 as TR_EKLEM_28, eklemSay } from '@/specialties/romatoloji/engines/eklemHaritasi'
import { labSkorla as romaLabSkorla, sonrakiIzlemTarihi as romaSonrakiTarih } from '@/specialties/romatoloji/engines/labIzlem'
import { rtpDegerlendir } from '@/specialties/spor-hekimligi/engines/rtp'
import { BOLGELER as TR_SAKATLIK_BOLGELER, MEKANIZMALAR as TR_MEKANIZMALAR, sakatlikDegerlendir, yuklenmeUyariHesapla } from '@/specialties/spor-hekimligi/engines/sakatlik'
import { bantBul as psaBantBul, skorlaSeri as psaSkorlaSeri } from '@/specialties/uroloji/engines/psa'

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

SATIRLAR_5: {
  const sira = <T extends string>(bizim: readonly T[], onlarin: readonly string[], k: unknown): string | null => (typeof k === 'string' && bizim.includes(k as T) ? onlarin[bizim.indexOf(k as T)] : null)
  const uzunluk = (a: readonly unknown[], b: readonly unknown[]) => [[String(a.length)], [String(b.length)]] as const
  SATIRLAR.push(
    { arac: 'kdigo-serit', karsilik: 'specialties/nefroloji/engines/egfr.ts → egfrSkorla (categories and risk cell; the interval is not the kit\'s)', listeler: [],
      onlar: (g) => { const r = egfrSkorla(g.egfr as number | null, g.uacr as number | null); return r.tamamMi ? { tamam: true, bant: r.renk, uyarilar: [r.g!, ...(r.a ? [r.a] : [])].sort() } : { tamam: false } } },
    { arac: 'diyaliz-seans', karsilik: 'specialties/nefroloji/engines/diyaliz.ts → diyalizSkorla, diyalizGorevleri', listeler: [],
      onlar: (g) => { const r = diyalizSkorla({ modalite: g.modalite ?? '', tarih: g.tarih ?? '', sonrakiSeans: g.sonraki_seans }); if (!r.tamamMi || !r.kayit) return { tamam: false }; assert.deepEqual(diyalizGorevleri(r.kayit).map((x) => x.due), r.kayit.sonrakiSeans ? [r.kayit.sonrakiSeans] : []); return { tamam: true, tarihler: dolu({ tarih: r.kayit.tarih, sonraki_seans: r.kayit.sonrakiSeans }) } } },
    { arac: 'anemi-izlem', karsilik: 'specialties/nefroloji/engines/anemi.ts → anemiSkorla, anemiSonrakiTarih (with that application\'s own range and months as parameters)', listeler: [], sayilar: ['sonraki_ay'],
      onlar: (g) => { const r = anemiSkorla(g.hb as number | null); return { tamam: r.tamamMi, bant: r.bant, sayilar: dolu({ sonraki_ay: r.tamamMi ? r.sonrakiAy : null }), tarihler: dolu({ sonraki: r.tamamMi && typeof g.tarih === 'string' ? anemiSonrakiTarih(g.tarih, r.sonrakiAy) : null }) } } },
    { arac: 'kur-sayaci', karsilik: 'specialties/onkoloji/engines/kur.ts → kurSkorla, kurGorevleri', listeler: [], sayilar: ['kur'],
      onlar: (g) => { const r = kurSkorla({ mevcutKur: g.mevcut_kur, toplamKur: g.toplam_kur, sonKurTarihi: g.son_kur, sonrakiKurTarihi: g.sonraki_kur }); if (!r.tamamMi) return { tamam: false }; assert.deepEqual(kurGorevleri(r.kart).map((x) => x.due), r.kart.sonrakiKurTarihi ? [r.kart.sonrakiKurTarihi] : []); return { tamam: true, sayilar: { kur: r.kart.mevcutKur as number }, tarihler: dolu({ son_kur: r.kart.sonKurTarihi, sonraki_kur: r.kart.sonrakiKurTarihi }) } } },
    { arac: 'toksisite-listesi', karsilik: 'specialties/onkoloji/engines/toksisite.ts → toksisiteSkorla', listeler: [[K6.TOKSISITE_MADDELERI, TOKSISITE_MADDELER.map((m) => m.kod)]], sayilar: ['isaretli'],
      onlar: (g) => { const r = toksisiteSkorla(isaretliler(g, K6.TOKSISITE_MADDELERI)); return { tamam: r.tamamMi, sayilar: (r.tamamMi ? { isaretli: r.gorevOnerileri.length } : {}) as Record<string, number> } } },
    {
      arac: 'kirik-alci-takip', karsilik: 'specialties/ortopedi/engines/kirikAlci.ts → ozetle', listeler: [uzunluk(K7.KIRIK_BOLGELERI, TR_KIRIK_BOLGELER), uzunluk(K7.TARAFLAR, TR_TARAFLAR), uzunluk(K7.NV_DURUMLARI, TR_NV)],
      onlar: (g) => {
        if (g.tip === null) return { tamam: false }
        const r = kirikOzetle({ tip: g.tip as 'kirik', bolge: sira(K7.KIRIK_BOLGELERI, TR_KIRIK_BOLGELER, g.bolge) ?? '', taraf: sira(K7.TARAFLAR, TR_TARAFLAR, g.taraf) ?? '', baslangic: g.baslangic as string | null, alciAlma: g.alci_alma as string | null, yukVerme: g.yuk_verme as string | null, nvDurum: sira(K7.NV_DURUMLARI, TR_NV, g.nv) ?? TR_NV[3], goruntuHazir: g.goruntu_hazir === true, notHekim: null, bugun: BUGUN })
        const uyari = r.uyarilar.map((u) => (/^NV tehdit/.test(u) ? 'nv_tehdit' : /^Al/.test(u) ? 'alci_gecti' : /^Y/.test(u) ? 'yuk_gecti' : `?${u}`))
        const gorev = r.gorevler.filter((x) => x.kod === 'goruntu_kontrol' || x.kod === 'op_kontrol').map((x) => x.kod)
        return { tamam: true, uyarilar: [...uyari, ...gorev].sort(), tarihler: dolu({ baslangic: g.baslangic as string | null, alci_alma: r.gorevler.find((x) => x.kod === 'alci_alma')?.due ?? null, yuk_verme: r.gorevler.find((x) => x.kod === 'yuk_verme')?.due ?? null }) }
      },
    },
    { arac: 'vas-fonksiyon', karsilik: 'specialties/ortopedi/engines/vasFonksiyon.ts → skorla', listeler: [[K7.FONKSIYON_MADDELERI, FONKSIYON_MADDELER.map((m) => m.id)]], sayilar: ['vas', 'fonksiyon'],
      onlar: (g) => { const r = vasSkorla(g.vas as number | null, K7.FONKSIYON_MADDELERI.map((k) => g[k] as number | null)); return { tamam: r.tamamMi, bant: r.bant, sayilar: (r.tamamMi ? { vas: r.vas as number, fonksiyon: r.fonksiyonToplam as number } : {}) as Record<string, number> } } },
    { arac: 'hedef-boy', karsilik: 'lib/clinical/hedefBoy.ts → hesaplaHedefBoy', listeler: [], sayilar: ['hedef', 'alt', 'ust'],
      onlar: (g) => { if (g.cinsiyet === null || g.anne === null || g.baba === null) return { tamam: false }; const r = hesaplaHedefBoy({ anneBoy: g.anne as number, babaBoy: g.baba as number, cinsiyet: g.cinsiyet as string }); return r.ok ? { tamam: true, sayilar: { hedef: r.sonuc.cocukCm, alt: r.sonuc.altCm, ust: r.sonuc.ustCm } } : { tamam: false } } },
    {
      arac: 'doz-hesabi', karsilik: 'specialties/pediatri/engines/doz.ts → dozHesapla', listeler: [], sayilar: ['doz_mg', 'gunluk_mg', 'aralik_saat', 'doz_ml', 'gunluk_ml', 'tavanli_doz_mg', 'tavanli_doz_ml'],
      onlar: (g) => {
        if (g.mod === null) return { tamam: false }
        const kons = typeof g.kons_mg === 'number' && typeof g.kons_ml === 'number' ? { mg: g.kons_mg, ml: g.kons_ml, mgPerMl: g.kons_mg / g.kons_ml, metin: '' } : null
        const r = dozHesapla({ kiloKg: g.kilo as number | null, mgKg: g.mg_kg as number | null, mod: g.mod as 'gun', dozSayisi: (g.doz_sayisi as number | null) ?? 0, konsantrasyon: kons, tavanDozMg: g.tavan_doz_mg as number | null, tavanGunMg: g.tavan_gun_mg as number | null })
        if (!r) return { tamam: false }
        return { tamam: true, sayilar: dolu({ doz_mg: r.dozMg, gunluk_mg: r.gunlukMg, aralik_saat: r.aralikSaat, doz_ml: r.dozMlYuvarlak, gunluk_ml: r.gunlukMl, tavanli_doz_mg: r.tavanli?.dozMg ?? null, tavanli_doz_ml: r.tavanli?.dozMlYuvarlak ?? null }), uyarilar: r.uyarilar.map((u) => u.kod).sort() }
      },
    },
    {
      arac: 'plastik-yara-greft', karsilik: 'specialties/plastik-cerrahi/engines/yara.ts → yaraSkorla', listeler: [],
      onlar: (g) => { const r = plastikYaraSkorla({ tip: g.tip, bolge: g.bolge ? 'x' : null, islemTarihi: g.islem, pansumanTarihi: g.pansuman, dikisAlmaTarihi: g.dikis_alma }); return { tamam: r.tamamMi, tarihler: r.tamamMi ? dolu({ islem: r.kart.islemTarihi, pansuman: r.kart.pansumanTarihi, dikis_alma: r.kart.dikisAlmaTarihi }) : {} } },
    },
    {
      arac: 'tetkik-kuyrugu', karsilik: 'specialties/radyoloji/engines/kuyruk.ts → kuyrukSkorla (the kit asks for priority and state; the other application assumes them)', listeler: [[K7.RADYO_MODALITELER, RADYO_MODALITELER.map((x) => x.kod)], [K7.RADYO_ONCELIKLER, RADYO_ONCELIKLER.map((x) => x.kod)], [K7.RADYO_DURUMLAR, RADYO_DURUMLAR.map((x) => x.kod)]],
      onlar: (g) => {
        if (g.modalite === null || g.oncelik === null || g.durum === null) return { tamam: false }
        const r = kuyrukSkorla({ modalite: g.modalite, oncelik: g.oncelik, durum: g.durum, tarih: g.tarih ?? BUGUN })
        return { tamam: r.tamamMi, uyarilar: r.gorevOnerileri.map((x) => (x.kod.startsWith('kuyruk_') ? 'kuyrukta' : x.kod)).sort() }
      },
    },
    { arac: 'rapor-taslagi', karsilik: 'specialties/radyoloji/engines/rapor.ts → raporSkorla (the kit asks for the category; the other application assumes "general")', listeler: [[K7.RAPOR_KATEGORILERI, BIRADS_KATEGORILER.map((x) => x.kod)], [K7.RAPOR_BOLUMLERI, RAPOR_SABLON.map((x) => x.kod)]], sayilar: [],
      onlar: (g) => { if (g.kategori === null) return { tamam: false }; const r = raporSkorla(g.kategori, isaretliler(g, K7.RAPOR_BOLUMLERI)); return { tamam: r.tamamMi, bant: r.tamamMi ? r.kategori : null, uyarilar: r.gorevOnerileri.map((x) => x.kod).sort() } } },
    { arac: 'das28', karsilik: 'specialties/romatoloji/engines/das28Basdai.ts → das28Skorla', listeler: [], sayilar: ['das28'],
      onlar: (g) => { if (g.varyant === null) return { tamam: false }; const r = das28Skorla({ tjc: g.tjc as number | null, sjc: g.sjc as number | null, pga: g.pga as number | null, crp: g.crp as number | null, esr: g.esr as number | null, varyant: g.varyant as 'crp' }); return { tamam: r.tamamMi, bant: r.bant, sayilar: (r.tamamMi ? { das28: r.toplam as number } : {}) as Record<string, number> } } },
    {
      arac: 'eklem-28', karsilik: 'specialties/romatoloji/engines/eklemHaritasi.ts → eklemSay (the kit counts once the examination is ticked as done)', listeler: [[K7.EKLEM_28, TR_EKLEM_28.map((e) => e.toLowerCase())]], sayilar: ['tjc', 'sjc'],
      onlar: (g) => { const sec = (on: string) => K7.EKLEM_28.flatMap((e, i) => (g[`${on}_${e}`] === true ? [TR_EKLEM_28[i]] : [])); const r = eklemSay(sec('h'), sec('s')); return { tamam: g.degerlendirildi === true, sayilar: { tjc: r.tjc, sjc: r.sjc } } },
    },
    { arac: 'iltihap-lab-izlem', karsilik: 'specialties/romatoloji/engines/labIzlem.ts → labSkorla, sonrakiIzlemTarihi (CRP and ESR; with that application\'s own thresholds and months as parameters)', listeler: [], sayilar: ['sonraki_ay'],
      onlar: (g) => { if (g.tur === null) return { tamam: false }; const r = romaLabSkorla(g.tur as 'crp', g.deger as number | null); return { tamam: r.tamamMi, bant: r.bant, sayilar: dolu({ sonraki_ay: r.tamamMi ? r.sonrakiAy : null }), tarihler: dolu({ sonraki: r.tamamMi && typeof g.tarih === 'string' ? romaSonrakiTarih(g.tarih, r.sonrakiAy) : null }) } } },
    { arac: 'rtp-basamak', karsilik: 'specialties/spor-hekimligi/engines/rtp.ts → rtpDegerlendir (the step; the days that application proposes are not the kit\'s)', listeler: [],
      onlar: (g) => { if (g.basamak === null) return { tamam: false }; const r = rtpDegerlendir(Number(g.basamak)); return 'hata' in r ? { tamam: false } : { tamam: true, bant: `b${r.basamak}` } } },
    {
      arac: 'sakatlik-gunlugu', karsilik: 'specialties/spor-hekimligi/engines/sakatlik.ts → sakatlikDegerlendir, yuklenmeUyariHesapla', listeler: [uzunluk(K7.SAKATLIK_BOLGELERI, TR_SAKATLIK_BOLGELER), uzunluk(K7.SAKATLIK_MEKANIZMALARI, TR_MEKANIZMALAR)], sayilar: [],
      onlar: (g) => {
        const r = sakatlikDegerlendir({ bolge: sira(K7.SAKATLIK_BOLGELERI, TR_SAKATLIK_BOLGELER, g.bolge) ?? '', siddet: g.siddet as 'hafif' | null, durum: (g.durum as 'aktif' | null) ?? undefined, yuklenmeDakika7: g.dk_7gun as number | null, yuklenmeDakikaOnceki: g.dk_onceki as number | null })
        if ('hata' in r) return { tamam: false }
        const y = yuklenmeUyariHesapla(g.dk_7gun as number | null, g.dk_onceki as number | null)
        assert.equal(r.yuklenmeUyari, y.uyari)
        return { tamam: true, uyarilar: y.uyari ? [/y\u00fcksek;/.test(y.not ?? '') ? 'yuklenme_yuksek' : 'yuklenme_dikkat'] : [] }
      },
    },
    {
      arac: 'psa-hizi', karsilik: 'specialties/uroloji/engines/psa.ts → skorlaSeri (the change per year; that application\'s bands are not the kit\'s)', listeler: [], sayilar: ['hiz'],
      onlar: (g) => {
        if ([g.onceki_deger, g.son_deger, g.onceki_tarih, g.son_tarih].some((x) => x === null) || (g.onceki_tarih as string) >= (g.son_tarih as string)) return { tamam: false }
        const r = psaSkorlaSeri([{ tarih: g.onceki_tarih as string, deger: g.onceki_deger as number }, { tarih: g.son_tarih as string, deger: g.son_deger as number }])
        return r.hizNgMlYil === null ? { tamam: false } : { tamam: true, sayilar: { hiz: r.hizNgMlYil + 0 }, uyarilar: /tercih edilen/.test(r.hizNot) ? ['kisa_aralik'] : [] }
      },
    },
  )
  void plastikYaraGorevleri; void plastikYaraNormalize; void TR_OP_PROTOKOL; void psaBantBul
}

/** Tools of the kit that have no function to stand beside, and why. */
const KARSILIKSIZ: Readonly<Record<string, string>> = {
  'hasta-portali': 'a screen of the kit (a patient search that leads to the patient\'s file); it works nothing out',
  'ortopedi-op-protokol': 'the pre-split application has the six items as a plain list of sentences and no function over them; the length of the two lists is compared below',
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

  it('lists that stand beside a list without a function have the same number of items; follow-up days that application derives are not the kit\'s', () => {
    assert.equal(K7.OP_PROTOKOL_MADDELERI.length, TR_OP_PROTOKOL.length)
    // graft, no dressing day given: that application says "three days after the procedure"; the kit returns the day entered and nothing else
    assert.deepEqual(plastikYaraGorevleri(plastikYaraNormalize({ tip: 'greft', bolge: 'x', islemTarihi: '2026-10-01' })).map((x) => x.due), ['2026-10-04'])
    assert.deepEqual(kitAraci('plastik-yara-greft')!.hesapla({ tip: 'greft', bolge: 'x', taraf: null, islem: '2026-10-01', pansuman: null, dikis_alma: null }, { bugun: BUGUN, p: {} }).tarihler, [{ anahtar: 'islem', tarih: '2026-10-01' }])
  })

  it('FOR THE RECORD, not a tool of the kit: the PSA bands of the pre-split application have the same kind of gap (a value between two ranges is called "very high")', () => {
    assert.equal(psaBantBul(2.49), 'dusuk'); assert.equal(psaBantBul(2.5), 'sinir')
    assert.equal(psaBantBul(2.495), 'cok_yuksek', 'specialties/uroloji/engines/psa.ts: 2.495 ng/mL falls between 2.49 and 2.5')
    assert.equal(psaBantBul(3.995), 'cok_yuksek'); assert.equal(psaBantBul(9.995), 'cok_yuksek')
  })
})
