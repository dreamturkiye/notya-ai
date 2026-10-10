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
 *
 * NOTYA-ULKE-ARAC-DUZELTME-01 — WHERE THE KIT NOW DIFFERS ON PURPOSE. The tools-correction job corrected fourteen faults
 * of the kit against the published source of each tool (docs/araclar-denetim/DUZELTMELER.md). The pre-split
 * application was NOT changed, so the two no longer agree everywhere: each row below still compares everything the
 * two have in common, says in its `karsilik` what it leaves out, and the block "DELIBERATE DIFFERENCES" at the end
 * states every difference by a case — the other application's answer and the kit's, side by side.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ORNEK_BUGUN, ORNEK_PARAMETRELER, ornekGirdiler, ornekOrtam } from '../testing/aracOrnekleri'
import { KIT_ARACLARI, kitAraci } from './katalog'
import type { AracGirdisi, AracSonucu } from './tipler'
import { gunEkle, isaretliler } from './yardimci'
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
const kitOzu = (s: AracSonucu, alanlar: { sayilar?: readonly string[]; uyarilar?: readonly string[] } = {}): Required<Oz> => ({
  tamam: s.tamam,
  sayilar: Object.fromEntries(s.sayilar.filter((x) => !alanlar.sayilar || alanlar.sayilar.includes(x.anahtar)).map((x) => [x.anahtar, x.deger])),
  bant: s.bant, uyarilar: s.uyarilar.filter((u) => !alanlar.uyarilar || alanlar.uyarilar.includes(u)).sort(), tarihler: Object.fromEntries(s.tarihler.map((d) => [d.tarih ? d.anahtar : d.anahtar, d.tarih])),
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
  /** Which of the kit's warnings the other side also has, where the kit has more (a caution the other application does not raise). */
  uyarilar?: readonly string[]
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
    arac: 'asa-preop', karsilik: 'specialties/anestezi/engines/asa.ts → asaSkorla (the list and classes I to V; class VI and the mark E are the kit\'s: see DELIBERATE DIFFERENCES)', listeler: [[K1.ASA_MADDELER, kodlar(ASA_MADDELER)]], sayilar: [],
    uyarilar: ['kontrol_randevu', 'acil_lab_goruntu', 'hava_yolu_degerlendirme', 'alerji_ilac_listesi'],
    // class VI does not exist in that application: it is handed no class then, and the band is the kit's own
    onlar: (g) => { const r = asaSkorla(isaretliler(g, K1.ASA_MADDELER), g.asa_sinif === 'VI' ? null : g.asa_sinif); return { tamam: r.tamamMi, bant: r.tamamMi ? (g.asa_sinif === 'VI' ? 'VI' : r.asaSinif) : null, uyarilar: r.gorevOnerileri.map((x) => x.kod.replace(/^asa_/, '')).sort() } },
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
/** A regional index is finished when every region has its area score and, where the area is not 0, every sign (the kit's rule since NOTYA-ULKE-ARAC-DUZELTME-01). */
const bolgelerTamam = (g: AracGirdisi, belirtiler: readonly string[]) => K2.DERI_BOLGELERI.every((b) => typeof g[`${b}_a`] === 'number' && (g[`${b}_a`] === 0 || belirtiler.every((k) => typeof g[`${b}_${k}`] === 'number')))
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
      arac: 'kdigo-evre', karsilik: 'specialties/dahiliye/engines/ckd.ts → gEvre, aEvre, kdigoRenk (the two categories in mg/g, and the risk cell WHERE BOTH RESULTS ARE THERE; the missing-ratio cell and the referral lines are compared in DELIBERATE DIFFERENCES)', listeler: [],
      uyarilar: [...K2.KDIGO_G, ...K2.KDIGO_A],
      onlar: (g) => {
        const r = ckdDegerlendir({ eGFR: g.egfr, eGFRTarih: BUGUN, oncekiEGFR: typeof g.egfr_bir_yil_once === 'number' ? [{ deger: g.egfr_bir_yil_once, tarih: '2025-10-09' }] : [], uacr: g.uacr, uacrTarih: BUGUN, dm: false, ht: false, rasBlokeri: false, sglt2: false, nsaii: false, k: null, hb: null, bugun: BUGUN } as never)
        if (r.g === null) return { tamam: false }
        assert.equal(r.g, gEvre(g.egfr as number)); if (typeof g.uacr === 'number') assert.equal(r.a, aEvre(g.uacr)); assert.equal(r.renk, kdigoRenk(r.g, r.a))
        // without the ratio that application still answers with a cell (it reads the missing ratio as A1); the kit has none
        return { tamam: true, ...(typeof g.uacr === 'number' ? { bant: r.renk } : {}), uyarilar: [r.g, ...(r.a ? [r.a] : [])].sort() }
      },
    },
    { arac: 'pasi', karsilik: 'specialties/dermatoloji/engines/score-calculator.ts → pasi (the score of a FINISHED form; that application also scores an unfinished one, and names bands the kit does not)', listeler: [], sayilar: ['pasi'],
      onlar: (g) => (bolgelerTamam(g, ['e', 'i', 'd']) ? { tamam: true, sayilar: { pasi: pasi(bolgeler(g)) } } : { tamam: false }) },
    { arac: 'easi', karsilik: 'specialties/dermatoloji/engines/score-calculator.ts → easi (the score of a FINISHED form for a patient of 8 or over: that application has those weights only, and other bands)', listeler: [], sayilar: ['easi'],
      onlar: (g) => (g.yas === null || !bolgelerTamam(g, ['e', 'i', 'd', 'l']) ? { tamam: false } : g.yas === 'sekiz_ve_ustu' ? { tamam: true, sayilar: { easi: easi(bolgeler(g)) } } : { tamam: true }) },
    { arac: 'scorad', karsilik: 'specialties/dermatoloji/engines/score-calculator.ts → scoradHesap, scoradBandi (a FINISHED form; the band everywhere but at exactly 0 and exactly 50)', listeler: [[K2.SCORAD_SIDDET, SCORAD_SIDDET_ALANLARI.map((x) => x.id)]], sayilar: ['scorad', 'a', 'b', 'c'],
      onlar: (g) => {
        if (![g.yayginlik, ...K2.SCORAD_SIDDET.map((k) => g[k]), g.kasinti, g.uykusuzluk].every((x) => typeof x === 'number')) return { tamam: false }
        const r = scoradHesap({ 'yaygınlık': num(g.yayginlik), siddet: Object.fromEntries(K2.SCORAD_SIDDET.map((k) => [k, num(g[k])])), kasinti: num(g.kasinti), uykusuzluk: num(g.uykusuzluk) })
        return { tamam: true, sayilar: { scorad: r.toplam, a: r.a, b: r.b, c: r.c }, ...(r.toplam === 0 || r.toplam === 50 ? {} : { bant: scoradBandi(r.toplam).kod }) }
      } },
    { arac: 'yama-okuma', karsilik: 'specialties/dermatoloji/engines/patch-calendar.ts → plannedReads', listeler: [],
      onlar: (g) => (typeof g.uygulama === 'string' ? { tamam: true, tarihler: plannedReads(g.uygulama) } : { tamam: false }) },
    {
      arac: 'lab-izlem', karsilik: 'specialties/endokrinoloji/engines/labIzlem.ts → labSkorla, sonrakiIzlemTarihi (HbA1c and TSH; with that application\'s own thresholds and intervals as parameters)', listeler: [], sayilar: ['sonraki_ay'],
      onlar: (g) => {
        if (g.tur === null) return { tamam: false }
        const r = labSkorla(g.tur as 'hba1c' | 'tsh', g[g.tur as 'hba1c' | 'tsh'] as number | null)
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
    { arac: 'antibiyotik-sure', karsilik: 'specialties/enfeksiyon-hastaliklari/engines/atbSure.ts → atbHesapla (THE KIT\'S LAST DAY IS ONE DAY EARLIER: the first day is day 1; see DELIBERATE DIFFERENCES)', listeler: [],
      onlar: (g) => { const r = atbHesapla(g.baslangic as string | null, g.sure_gun as number | null, g.kontrol as string | null); const bitis = r.tamamMi && r.kart.bitis ? gunEkle(r.kart.bitis, -1) : null; return { tamam: r.tamamMi, tarihler: r.tamamMi ? dolu({ bitis, kontrol: typeof g.kontrol === 'string' ? r.kart.kontrol : bitis }) : {} } } },
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

/** The six central signs of the vertigo note the two applications share, in that application's order; and the three only the kit has (NOTYA-ULKE-ARAC-DUZELTME-01, fault 8). */
const ORTAK_SANTRAL = ['santral_cift_gorme', 'santral_yuz', 'santral_ayakta', 'santral_nistagmus', 'santral_fiksasyon', 'santral_bas_agrisi'] as const
const KITIN_SANTRALI = ['santral_uzuv', 'santral_koordinasyon', 'santral_boyun_agrisi'] as const

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
      arac: 'odyometri-pta', karsilik: 'specialties/kulak-burun-bogaz/engines/odyometri.ts → skorla, degisim, asimetriNotu (the average and the change; the grade from 26 dB upwards and at 15 dB or below, wherever that application\'s ranges have no gap; the asymmetry flag everywhere but at exactly 15 dB: see DELIBERATE DIFFERENCES)', listeler: [], sayilar: ['pta', 'fark'],
      onlar: (g) => {
        const r = ptaSkorla(K5.PTA_FREKANSLARI.map((k) => g[k] as number | null))
        if (!r.tamamMi || r.pta === null) return { tamam: false }
        const d = degisim(g.onceki_pta as number | null, r.pta)
        // the cited table's "slight" step (above 15 up to 25 dB) is "normal" in that application; its whole-number ranges leave gaps
        const farkli = (r.pta > 15 && r.pta <= 25) || [25, 40, 55, 70, 90].some((ust) => r.pta! > ust && r.pta! < ust + 1)
        // that application flags a difference of 15 dB or more, the kit one greater than 15 dB
        const karsi = g.karsi_pta as number | null, tam15 = karsi !== null && Math.abs(Math.round((r.pta - karsi) * 10) / 10) === 15
        return { tamam: true, sayilar: dolu({ pta: r.pta, fark: d.fark }), ...(farkli ? {} : { bant: r.bant }), uyarilar: [...(d.fark !== null && d.fark >= 10 ? ['esik_artisi'] : []), ...(d.fark !== null && d.fark <= -10 ? ['esik_azalisi'] : []), ...(asimetriNotu(r.pta, karsi) && !tam15 ? ['asimetri'] : [])].sort() }
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
      arac: 'vertigo-notu', karsilik: 'specialties/kulak-burun-bogaz/engines/vertigo.ts → vertigoNotu (the six central signs the two share; the kit has three more: see DELIBERATE DIFFERENCES)',
      listeler: [[K5.MANEVRALAR, MANEVRA_LISTESI], [[String(K5.NISTAGMUS.length)], [String(NISTAGMUS_OZELLIKLERI.length)]], [[String(ORTAK_SANTRAL.length)], [String(SANTRAL_ISARETLERI.length)]], [[...K5.SANTRAL].sort(), [...ORTAK_SANTRAL, ...KITIN_SANTRALI].sort()]],
      onlar: (g) => {
        const r = vertigoNotu({ manevralar: K5.MANEVRALAR.flatMap((k) => (typeof g[k] === 'string' ? [{ manevra: k, sonuc: g[k] as 'pozitif' }] : [])), nistagmus: K5.NISTAGMUS.flatMap((k, i) => (g[k] === true ? [NISTAGMUS_OZELLIKLERI[i]] : [])), santralIsaretleri: ORTAK_SANTRAL.flatMap((k, i) => (g[k] === true ? [SANTRAL_ISARETLERI[i]] : [])), kulakBelirtisi: g.kulak_belirtisi === true })
        if (r.eksikler.some((x) => /^Hi/.test(x))) return { tamam: false }
        // a sign only the kit has is ticked: that application cannot know it, and its answer is not the kit's
        if (KITIN_SANTRALI.some((k) => g[k] === true)) return { tamam: true }
        return { tamam: true, bant: r.manevraUygunMu ? 'manevra_uygun' : 'manevra_uygun_degil', uyarilar: [...(!r.manevraUygunMu ? ['santral_suphe'] : []), ...(r.uyarilar.some((u) => /^Repozisyon/.test(u)) ? ['repozisyon_santral'] : []), ...(r.eksikler.some((x) => /^Pozitif manevra/.test(x)) ? ['nistagmus_eksik'] : [])].sort() }
      },
    },
  )
}

SATIRLAR_5: {
  const sira = <T extends string>(bizim: readonly T[], onlarin: readonly string[], k: unknown): string | null => (typeof k === 'string' && bizim.includes(k as T) ? onlarin[bizim.indexOf(k as T)] : null)
  const uzunluk = (a: readonly unknown[], b: readonly unknown[]) => [[String(a.length)], [String(b.length)]] as const
  SATIRLAR.push(
    { arac: 'kdigo-serit', karsilik: 'specialties/nefroloji/engines/egfr.ts → egfrSkorla (the two categories in mg/g, and the risk cell where both results are there; the interval is not the kit\'s)', listeler: [],
      uyarilar: [...K2.KDIGO_G, ...K2.KDIGO_A],
      onlar: (g) => { const r = egfrSkorla(g.egfr as number | null, g.uacr as number | null); return r.tamamMi ? { tamam: true, ...(typeof g.uacr === 'number' ? { bant: r.renk } : {}), uyarilar: [r.g!, ...(r.a ? [r.a] : [])].sort() } : { tamam: false } } },
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
    { arac: 'vas-fonksiyon', karsilik: 'specialties/ortopedi/engines/vasFonksiyon.ts → skorla (the two numbers; the grade that application names is not the kit\'s: see DELIBERATE DIFFERENCES)', listeler: [[K7.FONKSIYON_MADDELERI, FONKSIYON_MADDELER.map((m) => m.id)]], sayilar: ['vas', 'fonksiyon'],
      onlar: (g) => { const r = vasSkorla(g.vas as number | null, K7.FONKSIYON_MADDELERI.map((k) => g[k] as number | null)); return { tamam: r.tamamMi, sayilar: (r.tamamMi ? { vas: r.vas as number, fonksiyon: r.fonksiyonToplam as number } : {}) as Record<string, number> } } },
    { arac: 'hedef-boy', karsilik: 'lib/clinical/hedefBoy.ts → hesaplaHedefBoy (the target height; the range is a number the country states and the kit has none: see DELIBERATE DIFFERENCES)', listeler: [], sayilar: ['hedef', 'alt', 'ust'],
      onlar: (g) => { if (g.cinsiyet === null || g.anne === null || g.baba === null) return { tamam: false }; const r = hesaplaHedefBoy({ anneBoy: g.anne as number, babaBoy: g.baba as number, cinsiyet: g.cinsiyet as string }); return r.ok ? { tamam: true, sayilar: { hedef: r.sonuc.cocukCm } } : { tamam: false } } },
    {
      arac: 'doz-hesabi', karsilik: 'specialties/pediatri/engines/doz.ts → dozHesapla (every amount; the volumes against that application\'s UNROUNDED volumes — it shows them rounded to 0.1 mL, the kit does not round: see DELIBERATE DIFFERENCES)', listeler: [], sayilar: ['doz_mg', 'gunluk_mg', 'aralik_saat', 'doz_ml', 'gunluk_ml', 'tavanli_doz_mg', 'tavanli_doz_ml'],
      uyarilar: ['tavan_doz', 'tavan_gun', 'kilo_birim'],
      onlar: (g) => {
        if (g.mod === null) return { tamam: false }
        const kons = typeof g.kons_mg === 'number' && typeof g.kons_ml === 'number' ? { mg: g.kons_mg, ml: g.kons_ml, mgPerMl: g.kons_mg / g.kons_ml, metin: '' } : null
        const r = dozHesapla({ kiloKg: g.kilo as number | null, mgKg: g.mg_kg as number | null, mod: g.mod as 'gun', dozSayisi: (g.doz_sayisi as number | null) ?? 0, konsantrasyon: kons, tavanDozMg: g.tavan_doz_mg as number | null, tavanGunMg: g.tavan_gun_mg as number | null })
        if (!r) return { tamam: false }
        return { tamam: true, sayilar: dolu({ doz_mg: r.dozMg, gunluk_mg: r.gunlukMg, aralik_saat: r.aralikSaat, doz_ml: r.dozMl, gunluk_ml: r.gunlukMl, tavanli_doz_mg: r.tavanli?.dozMg ?? null, tavanli_doz_ml: r.tavanli?.dozMl ?? null }), uyarilar: r.uyarilar.map((u) => u.kod).filter((k) => k !== 'ml_kucuk').sort() }
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
      onlar: (g) => { if (g.tur === null) return { tamam: false }; const r = romaLabSkorla(g.tur as 'crp', g[g.tur as 'crp' | 'esr'] as number | null); return { tamam: r.tamamMi, bant: r.bant, sayilar: dolu({ sonraki_ay: r.tamamMi ? r.sonrakiAy : null }), tarihler: dolu({ sonraki: r.tamamMi && typeof g.tarih === 'string' ? romaSonrakiTarih(g.tarih, r.sonrakiAy) : null }) } } },
    {
      arac: 'sakatlik-gunlugu', karsilik: 'specialties/spor-hekimligi/engines/sakatlik.ts → sakatlikDegerlendir, yuklenmeUyariHesapla (the two flags everywhere but at a ratio of exactly 1.3: see DELIBERATE DIFFERENCES)', listeler: [uzunluk(K7.SAKATLIK_BOLGELERI, TR_SAKATLIK_BOLGELER), uzunluk(K7.SAKATLIK_MEKANIZMALARI, TR_MEKANIZMALAR)], sayilar: [],
      onlar: (g) => {
        const r = sakatlikDegerlendir({ bolge: sira(K7.SAKATLIK_BOLGELERI, TR_SAKATLIK_BOLGELER, g.bolge) ?? '', siddet: g.siddet as 'hafif' | null, durum: (g.durum as 'aktif' | null) ?? undefined, yuklenmeDakika7: g.dk_7gun as number | null, yuklenmeDakikaOnceki: g.dk_onceki as number | null })
        if ('hata' in r) return { tamam: false }
        const y = yuklenmeUyariHesapla(g.dk_7gun as number | null, g.dk_onceki as number | null)
        assert.equal(r.yuklenmeUyari, y.uyari)
        // exactly 1.3 is inside the cited paper's low-risk range: that application flags it, the kit does not
        const tam13 = typeof g.dk_7gun === 'number' && typeof g.dk_onceki === 'number' && Math.round(g.dk_7gun * 100) * 10 === Math.round(g.dk_onceki * 100) * 13
        return { tamam: true, uyarilar: y.uyari && !tam13 ? [/y\u00fcksek;/.test(y.not ?? '') ? 'yuklenme_yuksek' : 'yuklenme_dikkat'] : [] }
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
  void plastikYaraGorevleri; void plastikYaraNormalize; void TR_OP_PROTOKOL; void psaBantBul; void rtpDegerlendir; void easiBandi; void pasiBandi
}

/** Tools of the kit that have no function to stand beside, and why. */
const KARSILIKSIZ: Readonly<Record<string, string>> = {
  'takip-paneli': 'a screen, not arithmetic: one list of the follow-up days the doctor entered on kept results (migration 139). The pre-split application has a panel per specialty with columns of that specialty; there is no function to compare with.',
  'hasta-portali': 'a screen of the kit (a patient search that leads to the patient\'s file); it works nothing out',
  'sablonlarim': 'a screen of the kit, not arithmetic: the doctor\'s own reusable text blocks (migration 141). The pre-split application keeps its templates in its own table with its own screen; there is no function to compare with.',
  'konsultasyonlar': 'a screen of the kit, not arithmetic: consultation between doctors of the same country database (migration 142). The pre-split application sends its consultation to an outside consultant by e-mail; the kit\'s is between two accounts, by code, with nothing sent. There is no function to compare with.',
  'ortopedi-op-protokol': 'the pre-split application has the six items as a plain list of sentences and no function over them; the length of the two lists is compared below',
  'rtp-basamak': 'NOTYA-ULKE-ARAC-DUZELTME-01, fault 7: the kit holds NO staging of return to sport. The pre-split application has six stages of its own (0 to 5) with days it proposes; the kit\'s tool counts the days since the injury and takes its steps, where a country supplies them, from that country\'s table. There is nothing left to compare; the difference is stated in DELIBERATE DIFFERENCES.',
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
        const biz = kitOzu(t.hesapla(g, ornekOrtam(t)), { sayilar: s.sayilar, uyarilar: s.uyarilar })
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
    assert.equal(lab.hesapla({ tur: 'hba1c', hba1c: 6.8, tsh: null, tarih: null }, { bugun: BUGUN, p: ORNEK_PARAMETRELER['lab-izlem'] }).bant, 'hedef_yakin')
    const s2 = lab.hesapla({ tur: 'hba1c', hba1c: 6.8, tsh: null, tarih: '2026-01-31' }, { bugun: BUGUN, p: baska })
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
    // on every whole number the two agree (the comparison above also runs over hundreds of samples) — except from 16 to
    // 25 dB, the "slight" step of the table the tool cites, which that application calls "normal" (fault 6, below)
    for (let pta = -10; pta <= 130; pta++) {
      if (pta >= 16 && pta <= 25) { assert.equal(ptaSkorla([pta, pta, pta, pta]).bant, 'normal'); assert.equal(t.hesapla(ort(pta), { bugun: BUGUN, p: {} }).bant, 'hafifce', `${pta} dB`); continue }
      assert.equal(t.hesapla(ort(pta), { bugun: BUGUN, p: {} }).bant, ptaSkorla([pta, pta, pta, pta]).bant, `${pta} dB`)
    }
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

  // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // DELIBERATE DIFFERENCES (NOTYA-ULKE-ARAC-DUZELTME-01). Each of these is a fault the kit corrected against the
  // published source of the tool (cited beside the kit's definition, and in docs/araclar-denetim/DUZELTMELER.md). The
  // pre-split application was read, not changed: what it answers is stated here as a fact about it, for its owner.
  // ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
  describe('DELIBERATE DIFFERENCES: where the kit was corrected and the pre-split application was not', () => {
    const O = { bugun: BUGUN, p: {} }
    const kit = (k: string) => kitAraci(k)!

    it('fault 1, dose: 4 kg × 2 mg/kg, 50 mg in 1 mL is 0.16 mL — that application shows 0.2 mL; the kit shows what the arithmetic gives', () => {
      const r = dozHesapla({ kiloKg: 4, mgKg: 2, mod: 'doz', dozSayisi: 1, konsantrasyon: { mg: 50, ml: 1, mgPerMl: 50, metin: '' }, tavanDozMg: null, tavanGunMg: null })!
      assert.equal(r.dozMl, 0.16); assert.equal(r.dozMlYuvarlak, 0.2)
      const s = kit('doz-hesabi').hesapla({ kilo: 4, mg_kg: 2, mod: 'doz', doz_sayisi: 1, kons_mg: 50, kons_ml: 1, tavan_doz_mg: null, tavan_gun_mg: null }, O)
      assert.equal(s.sayilar.find((x) => x.anahtar === 'doz_ml')!.deger, 0.16)
    })

    it('fault 3, antibiotic course: 7 days from 1 October — that application ends on 8 October, the kit on 7 October', () => {
      assert.equal(atbHesapla('2026-10-01', 7).kart.bitis, '2026-10-08')
      assert.deepEqual(kit('antibiyotik-sure').hesapla({ baslangic: '2026-10-01', sure_gun: 7, kontrol: null, sinif: null }, O).tarihler, [{ anahtar: 'bitis', tarih: '2026-10-07' }, { anahtar: 'kontrol', tarih: '2026-10-07' }])
    })

    it('fault 4, ASA: that application takes "E" as a class and has no class VI; the kit has six classes and E as a mark beside one', () => {
      assert.equal(asaSkorla(['anamnez_tamam'], 'E').asaSinif, 'E')
      assert.equal(asaSkorla(['anamnez_tamam'], 'VI').asaSinif, null)
      const t = kit('asa-preop')
      assert.deepEqual(t.alanlar.find((a) => a.anahtar === 'asa_sinif')!.secenekler, ['I', 'II', 'III', 'IV', 'V', 'VI'])
      const s = t.hesapla({ asa_sinif: 'VI', asa_acil: true, anamnez_tamam: true }, O)
      assert.equal(s.bant, 'VI'); assert.deepEqual(s.uyarilar, ['asa_acil'])
    })

    it('fault 5, kidney: an eGFR of 75 and no urine result — that application answers "green"; the kit shows no cell and says what is missing', () => {
      assert.equal(egfrSkorla(75, null).renk, 'yesil')
      for (const k of ['kdigo-evre', 'kdigo-serit']) { const s = kit(k).hesapla({ egfr: 75, uacr: null, egfr_bir_yil_once: null }, O); assert.equal(s.tamam, true); assert.equal(s.bant, null); assert.deepEqual(s.uyarilar, ['G2', 'uacr_yok']) }
    })

    it('fault 5, kidney: eGFR 75, ratio 350 mg/g — that application writes a referral line for A3; the kit says what the guideline\'s list names, and claims nothing a single result cannot show', () => {
      const tr = ckdDegerlendir({ eGFR: 75, eGFRTarih: BUGUN, oncekiEGFR: [], uacr: 350, uacrTarih: BUGUN, dm: false, ht: false, rasBlokeri: false, sglt2: false, nsaii: false, k: null, hb: null, bugun: BUGUN } as never)
      assert.match(tr.sevk[0] ?? '', /UACR >300/)
      assert.deepEqual(kit('kdigo-evre').hesapla({ egfr: 75, uacr: 350, egfr_bir_yil_once: null }, O).uyarilar, ['G2', 'A3', 'sevk_acr_hematuri'])
    })

    it('faults 2 and 9, EASI: that application has the weights of a patient of 8 or over only, and three bands; the kit asks the age and has the six published strata', () => {
      const cocuk = { bas_e: 3, bas_i: 3, bas_d: 3, bas_l: 3, bas_a: 6, ust_a: 0, govde_a: 0, alt_a: 0 }
      assert.equal(easi(bolgeler(cocuk)), 7.2)
      assert.equal(kit('easi').hesapla({ yas: 'yedi_ve_alti', ...cocuk }, O).sayilar[0].deger, 14.4)
      assert.equal(kit('easi').hesapla({ yas: 'sekiz_ve_ustu', ...cocuk }, O).sayilar[0].deger, 7.2)
      assert.equal(kit('easi').hesapla(cocuk, O).tamam, false, 'no age, no score')
      // 0, 7.0 and 21.0: "mild", "moderate", "severe" there; clear, mild, moderate in the published strata
      assert.deepEqual([0, 7, 21].map((v) => easiBandi(v).kod), ['hafif', 'orta', 'siddetli'])
      assert.deepEqual([0, 7, 21].map((v) => K2.easiBandi(v)), ['temiz', 'hafif', 'orta'])
    })

    it('fault 9, PASI: one erythema score alone is "PASI 0, mild" there; in the kit an unfinished form has no score, and a score has no severity word', () => {
      const yarim = { bas_e: 2 }
      assert.equal(pasi(bolgeler(yarim)), 0); assert.equal(pasiBandi(0).kod, 'hafif')
      assert.equal(kit('pasi').hesapla(yarim, O).tamam, false)
      const tam = { bas_e: 2, bas_i: 2, bas_d: 2, bas_a: 3, ust_a: 0, govde_a: 0, alt_a: 0 }
      const s = kit('pasi').hesapla(tam, O)
      assert.equal(s.sayilar[0].deger, pasi(bolgeler(tam))); assert.equal(s.bant, null)
    })

    it('fault 9, SCORAD: exactly 50 is "severe" there and moderate in the kit (severe is above 50); 0 is "mild" there and has no severity word in the kit', () => {
      assert.equal(scoradBandi(50).kod, 'siddetli'); assert.equal(K2.scoradBandi(50), 'orta'); assert.equal(K2.scoradBandi(50.1), 'siddetli')
      assert.equal(scoradBandi(0).kod, 'hafif'); assert.equal(K2.scoradBandi(0), null)
    })

    it('fault 6, hearing: 20 dB at every frequency is "normal" there and "slight" in the table the tool cites; a difference of exactly 15 dB between the ears is flagged there and not in the kit', () => {
      assert.equal(ptaSkorla([20, 20, 20, 20]).bant, 'normal')
      const t = kit('odyometri-pta')
      const g = (pta: number, karsi: number | null) => ({ kulak: null, e05: pta, e1: pta, e2: pta, e4: pta, onceki_pta: null, karsi_pta: karsi })
      assert.equal(t.hesapla(g(20, null), O).bant, 'hafifce')
      assert.ok(asimetriNotu(30, 15)); assert.deepEqual(t.hesapla(g(30, 15), O).uyarilar, [])
      assert.deepEqual(t.hesapla(g(30.1, 15), O).uyarilar, ['asimetri'])
    })

    it('fault 7, return to sport: that application has six stages of its own (0 to 5); the kit has none, and without a country\'s steps shows the days since the injury only', () => {
      assert.ok(!('hata' in rtpDegerlendir(5)))
      const t = kit('rtp-basamak')
      assert.deepEqual(t.alanlar.find((a) => a.anahtar === 'basamak')!.secenekler, [])
      assert.deepEqual(t.cikti.bantlar, [])
      const s = t.hesapla({ yaralanma: '2026-10-01', basamak: null }, O)
      assert.deepEqual([s.tamam, s.bant, s.uyarilar, s.sayilar[0].deger], [true, null, ['basamak_tanimsiz'], 8])
    })

    it('fault 8, vertigo: weakness of an arm, neck pain and poor coordination have a box in the kit and none there', () => {
      assert.equal(SANTRAL_ISARETLERI.length, 6); assert.equal(K5.SANTRAL.length, 9)
      const g = Object.fromEntries(kit('vertigo-notu').alanlar.map((a) => [a.anahtar, a.tur === 'isaret' ? false : null]))
      for (const k of KITIN_SANTRALI) { const s = kit('vertigo-notu').hesapla({ ...g, dix_hallpike: 'negatif', [k]: true }, O); assert.equal(s.bant, 'manevra_uygun_degil', k); assert.deepEqual(s.uyarilar, ['santral_suphe'], k) }
    })

    it('fault 10, injury log: 390 minutes against a usual 300 (ratio 1.3) is a warning there and none in the kit; 391 is above the paper\'s range in both', () => {
      assert.equal(yuklenmeUyariHesapla(390, 300).uyari, true)
      const g = (dk: number) => ({ bolge: 'diz', mekanizma: null, siddet: null, durum: null, dk_7gun: dk, dk_onceki: 300 })
      assert.deepEqual(kit('sakatlik-gunlugu').hesapla(g(390), O).uyarilar, [])
      assert.deepEqual(kit('sakatlik-gunlugu').hesapla(g(391), O).uyarilar, ['yuklenme_dikkat'])
      assert.deepEqual(kit('sakatlik-gunlugu').hesapla(g(450), O).uyarilar, ['yuklenme_yuksek'])
    })

    it('fault 11, expected height: that application shows 8.5 cm either side; the kit shows a range only where the country states one — and then the same arithmetic', () => {
      const tr = hesaplaHedefBoy({ anneBoy: 160, babaBoy: 180, cinsiyet: 'erkek' })
      assert.ok(tr.ok)
      const t = kit('hedef-boy'), g = { cinsiyet: 'erkek', anne: 160, baba: 180 }
      assert.deepEqual(t.hesapla(g, O).sayilar.map((x) => x.anahtar), ['hedef'])
      if (tr.ok) assert.deepEqual(t.hesapla(g, { bugun: BUGUN, p: { aralik_cm: 8.5 } }).sayilar.map((x) => x.deger), [tr.sonuc.cocukCm, tr.sonuc.altCm, tr.sonuc.ustCm])
    })

    it('fault 13, pain and function: pain 5 of 10 with little loss of function is graded "mild" there; the kit names no grade', () => {
      assert.equal(vasSkorla(5, [1, 0, 0, 1]).bant, 'hafif')
      const s = kit('vas-fonksiyon').hesapla({ vas: 5, yurume: 1, merdiven: 0, gunluk: 0, uyku: 1 }, O)
      assert.deepEqual([s.bant, s.sayilar.map((x) => x.deger)], [null, [5, 2]])
      assert.deepEqual(kit('vas-fonksiyon').cikti.bantlar, [])
    })
  })
})
