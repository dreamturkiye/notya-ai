/**
 * KD-TARAMA-01 (Kaan, 2026-11-09) — FOUR OBSTETRIC AND GYNAECOLOGICAL RECORDS in the country kit. Keys, fields and arithmetic
 * only: every word, every source line and every national number is the pack's. The arithmetic is the shared engine
 * lib/clinical/kdTaramalar.ts, byte-identical with the Türkiye build on main, so the same entry gives the same flag in
 * every country. Obstetrics and gynaecology only (the roles are the pack's).
 *
 *   gebelik-tiroid      TSH / free T4 in pregnancy against the right range: the laboratory's pregnancy range first; then
 *                          the COUNTRY'S fallback (secimlikParametreler: none of them is the kit's); the booking-visit
 *                          prompt; follow-up points for the recorded status; the clinician's own levothyroxine note
 *                          (never an amount).
 *   hpv-asi-kaydi             the dose record and the schedule BY THE COUNTRY'S TABLE (`hpv_takvimi`): age at the first dose,
 *                          immune status, the dose counts and intervals its source states; the last cervical screen beside it.
 *   sma-tasiyicilik     status, the laboratory's result and the SMN1 copy number as written, the partner-testing prompt,
 *                          the genetic-counselling referral prompt.
 *   pmdd-gunluk-ozeti   two cycles of an ORIGINAL prospective diary (not the DRSP: its commercial licence could not be
 *                          confirmed), entered as the highest rating per domain before and after menses, scored against the
 *                          structure of the DSM-5-TR PMDD criteria; the criteria as the doctor's checklist; management
 *                          options as ticks, no dose. The patient-side daily entry in the country portal is
 *                          docs/OPEN-COMMITMENTS.md KD-TARAMA-01e.
 *
 * "NOT STATED" IN A TABLE: a cell of -1 means the source states no number there (the kit then gives no date and no rule).
 */
import type { AracAlani, AracSonucu, AracTanimi } from '../tipler'
import { BOS_SONUC, gunMu, isaret, metin, puan, sayi, sayiMi, secim, tarih } from '../yardimci'
import {
  HPV_ASI_TIPLERI, PMDD_ALANLARI, PMDD_KRITERLERI, PMDD_YONETIM_SECENEKLERI, SMA_DURUMLARI, SMA_ES_DURUMLARI, SMA_SONUCLARI, TIROID_DURUMLARI,
  haftaTarihi, hpvPlani, lt4NotuDogrula, pmddDonguSonucu, pmddKontrolListesi, smaDegerlendir, tiroidDegerlendir, tiroidTakipNoktalari,
  type HpvAralik, type HpvKurali, type HpvSatiri, type PmddAlani, type TiroidDurumu, type TiroidKurali,
} from '@/lib/clinical/kdTaramalar'

const n = (x: unknown): number | null => (sayiMi(x) ? x : null)
const p0 = (p: Readonly<Record<string, number>>, k: string): number | null => (sayiMi(p[k]) ? p[k] : null)

// ───────────────────────── thyroid in pregnancy ─────────────────────────

/** Every number of the fallback, the treatment target and the follow-up is the country's (absent = its source states none). */
export const TIROID_PARAMETRELERI = [
  't1_alt_dusus', 't1_ust_dusus', 't1_bas_hafta', 't23_gebelik_disi', 'sabit_ust', 'sabit_bas_hafta', 'sabit_son_hafta',
  'hedef_t1_ust', 'hedef_t23_ust', 'hedef_alt_yari', 'hipo_aralik_hafta', 'hipo_son_hafta', 'hipo_ek_hafta', 'postpartum_hafta',
  'hiper_aralik_hafta', 'trab1_bas', 'trab1_son', 'trab2_bas', 'trab2_son', 'antikor_aralik_hafta', 'antikor_son_hafta', 'tarama_evrensel',
] as const

/** The country's rule from its stated numbers (the engine's shape). */
export function tiroidKuraliParametrelerden(p: Readonly<Record<string, number>>): TiroidKurali {
  const trab: Array<readonly [number, number]> = []
  for (const [b, s] of [['trab1_bas', 'trab1_son'], ['trab2_bas', 'trab2_son']] as const) { const x = p0(p, b), y = p0(p, s); if (x !== null && y !== null) trab.push([x, y]) }
  return {
    kaynak: 'pack', t1AltDusus: p0(p, 't1_alt_dusus'), t1UstDusus: p0(p, 't1_ust_dusus'), t1BaslangicHafta: p0(p, 't1_bas_hafta'),
    t23GebelikDisi: p['t23_gebelik_disi'] === 1, sabitUst: p0(p, 'sabit_ust'), sabitBasHafta: p0(p, 'sabit_bas_hafta'), sabitSonHafta: p0(p, 'sabit_son_hafta'),
    hedefT1Ust: p0(p, 'hedef_t1_ust'), hedefT23Ust: p0(p, 'hedef_t23_ust'), hedefAltYari: p['hedef_alt_yari'] === 1,
    hipoAralikHafta: p0(p, 'hipo_aralik_hafta'), hipoSonHafta: p0(p, 'hipo_son_hafta'), hipoEkHafta: p0(p, 'hipo_ek_hafta'), postpartumHafta: p0(p, 'postpartum_hafta'),
    hiperAralikHafta: p0(p, 'hiper_aralik_hafta'), trabPencereleri: trab, antikorAralikHafta: p0(p, 'antikor_aralik_hafta'), antikorSonHafta: p0(p, 'antikor_son_hafta'),
    tarama: p['tarama_evrensel'] === 1 ? 'evrensel' : 'risk', riskFaktorleri: [],
  }
}

export const TIROID_BANTLARI = ['tsh_aralikta', 'tsh_yuksek', 'tsh_dusuk', 'tsh_aralik_yok'] as const
export const TIROID_UYARILARI = ['tarama_istemi', 'ft4_yuksek', 'ft4_dusuk', 'ft4_aralik_yok', 'hedef_ustu', 'kaynak_laboratuvar', 'kaynak_yedek_duzeltilmis', 'kaynak_yedek_gebelik_disi', 'kaynak_yedek_sabit', 'takip_hipotiroidi', 'takip_hipertiroidi', 'takip_antikor', 'trab_pencere', 'lt4_hekim_notu'] as const
export const TIROID_TARIHLERI = ['tarih', 'sonraki_tsh', 'tsh_ek', 'trab_1', 'trab_2', 'sonraki_tft'] as const

export const GEBELIK_TIROID: AracTanimi = {
  anahtar: 'gebelik-tiroid', tur: 'hesap', yazdirilir: true,
  alanlar: [
    tarih('tarih'), sayi('gebelik_haftasi', 0, 45, { tam: true }),
    sayi('tsh', 0, 200, { istege: true }), sayi('lab_tsh_alt', 0, 20, { istege: true }), sayi('lab_tsh_ust', 0, 20, { istege: true }),
    sayi('gd_tsh_alt', 0, 20, { istege: true }), sayi('gd_tsh_ust', 0, 20, { istege: true }),
    sayi('ft4', 0, 200, { istege: true }), sayi('lab_ft4_alt', 0, 200, { istege: true }), sayi('lab_ft4_ust', 0, 200, { istege: true }),
    secim('tiroid_durumu', TIROID_DURUMLARI),
    metin('lt4_notu', { istege: true, uzun: true, kosul: { alan: 'tiroid_durumu', degerler: ['hipotiroidi'] } }),
  ],
  cikti: { sayilar: ['tsh_alt', 'tsh_ust', 'hedef_ust'], bantlar: [...TIROID_BANTLARI], uyarilar: [...TIROID_UYARILARI], tarihler: [...TIROID_TARIHLERI] },
  secimlikParametreler: [...TIROID_PARAMETRELERI],
  kaynak: null,
  hesapla: (g, ortam): AracSonucu => {
    const hafta = n(g.gebelik_haftasi)
    if (hafta === null || !gunMu(g.tarih)) return BOS_SONUC
    const k = tiroidKuraliParametrelerden(ortam.p)
    const durum = (typeof g.tiroid_durumu === 'string' ? g.tiroid_durumu : 'yok') as TiroidDurumu
    if (g.lt4_notu != null && g.lt4_notu !== '' && !lt4NotuDogrula(g.lt4_notu).ok) return BOS_SONUC
    const d = tiroidDegerlendir({ hafta, tsh: n(g.tsh), labTshAlt: n(g.lab_tsh_alt), labTshUst: n(g.lab_tsh_ust), gebelikDisiTshAlt: n(g.gd_tsh_alt), gebelikDisiTshUst: n(g.gd_tsh_ust), ft4: n(g.ft4), labFt4Alt: n(g.lab_ft4_alt), labFt4Ust: n(g.lab_ft4_ust), lt4Tedavisi: durum === 'hipotiroidi' }, k)
    const uyarilar: string[] = []
    if (n(g.tsh) === null && hafta < 14 && (k.tarama === 'evrensel' || durum !== 'yok')) uyarilar.push('tarama_istemi')
    if (d.ft4.bayrak === 'yuksek') uyarilar.push('ft4_yuksek'); else if (d.ft4.bayrak === 'dusuk') uyarilar.push('ft4_dusuk'); else if (d.ft4.bayrak === 'aralik_yok') uyarilar.push('ft4_aralik_yok')
    if (d.hedef === 'hedef_ustu') uyarilar.push('hedef_ustu')
    if (n(g.tsh) !== null && d.tsh.kaynak !== 'yok') uyarilar.push(`kaynak_${d.tsh.kaynak}`)
    const takip = tiroidTakipNoktalari(durum, hafta, k)
    if (durum === 'hipotiroidi' && takip.length) uyarilar.push('takip_hipotiroidi')
    if (durum === 'hipertiroidi' && takip.length) uyarilar.push('takip_hipertiroidi')
    if (durum === 'antikor_pozitif' && takip.length) uyarilar.push('takip_antikor')
    if (takip.some((t) => t.kod === 'trab')) uyarilar.push('trab_pencere')
    if (durum === 'hipotiroidi') uyarilar.push('lt4_hekim_notu')
    const tarihler: { anahtar: string; tarih: string }[] = [{ anahtar: 'tarih', tarih: g.tarih }]
    const ekle = (anahtar: string, hedef: number | undefined) => { if (hedef === undefined) return; const t = haftaTarihi(g.tarih as string, hafta, hedef); if (t) tarihler.push({ anahtar, tarih: t }) }
    ekle('sonraki_tsh', takip.find((t) => t.kod === 'tsh_kontrol' && t.haftaBas > hafta)?.haftaBas)
    ekle('tsh_ek', takip.find((t) => t.kod === 'tsh_ek' && t.haftaBas >= hafta)?.haftaBas)
    ekle('sonraki_tft', takip.find((t) => t.kod === 'tft_kontrol')?.haftaBas)
    const trab = takip.filter((t) => t.kod === 'trab')
    ekle('trab_1', trab[0]?.haftaBas); ekle('trab_2', trab[1]?.haftaBas)
    const bant = d.tsh.bayrak === 'deger_yok' ? null : d.tsh.bayrak === 'aralik_yok' ? 'tsh_aralik_yok' : `tsh_${d.tsh.bayrak}`
    const sayilar = [
      ...(d.tsh.alt !== null && n(g.tsh) !== null ? [{ anahtar: 'tsh_alt', deger: d.tsh.alt, ondalik: 2 }] : []),
      ...(d.tsh.ust !== null && n(g.tsh) !== null ? [{ anahtar: 'tsh_ust', deger: d.tsh.ust, ondalik: 2 }] : []),
      ...(d.hedefUst !== null ? [{ anahtar: 'hedef_ust', deger: d.hedefUst, ondalik: 2 }] : []),
    ]
    return { tamam: true, sayilar, bant, uyarilar, tarihler }
  },
}

// ───────────────────────── HPV vaccination ─────────────────────────

/** The country's schedule: one row per age band and immune status, exactly as its source states it (-1 = not stated). */
export const HPV_TAKVIM_SUTUNLARI = ['yas_alt', 'yas_ust', 'doz_en_az', 'doz_en_cok', 'd2_en_az_ay', 'd2_en_cok_ay', 'd2_en_az_hafta', 'd3_en_az_ay', 'd3_en_cok_ay', 'kisa_aralik_ay', 'kisa_ek_doz'] as const

export function hpvKuraliTablodan(satirlar: ReadonlyArray<Readonly<Record<string, number | string>>> | undefined): HpvKurali | null {
  if (!satirlar?.length) return null
  const v = (r: Readonly<Record<string, number | string>>, k: string): number | undefined => (typeof r[k] === 'number' && (r[k] as number) >= 0 ? (r[k] as number) : undefined)
  const out: HpvSatiri[] = []
  for (const r of satirlar) {
    const immun = r.immun === 'normal' || r.immun === 'baskilanmis' || r.immun === 'hepsi' ? r.immun : null
    const enAz = v(r, 'doz_en_az'), enCok = v(r, 'doz_en_cok'), alt = v(r, 'yas_alt')
    if (!immun || enAz === undefined || alt === undefined) return null
    const dozlar: number[] = []; for (let d = enAz; d <= (enCok ?? enAz); d++) dozlar.push(d)
    const araliklar = [
      ...(v(r, 'd2_en_az_ay') !== undefined || v(r, 'd2_en_cok_ay') !== undefined || v(r, 'd2_en_az_hafta') !== undefined ? [{ doz: 2, enAzAy: v(r, 'd2_en_az_ay'), enCokAy: v(r, 'd2_en_cok_ay'), enAzHafta: v(r, 'd2_en_az_hafta') }] : []),
      ...(v(r, 'd3_en_az_ay') !== undefined || v(r, 'd3_en_cok_ay') !== undefined ? [{ doz: 3, enAzAy: v(r, 'd3_en_az_ay'), enCokAy: v(r, 'd3_en_cok_ay') }] : []),
    ].map((a) => Object.fromEntries(Object.entries(a).filter(([, x]) => x !== undefined)) as HpvAralik)
    const kisa = v(r, 'kisa_aralik_ay'), ek = v(r, 'kisa_ek_doz')
    out.push({ yasAlt: alt, yasUst: v(r, 'yas_ust') ?? null, immun, dozlar, ...(araliklar.length ? { araliklar } : {}), ...(kisa !== undefined && ek !== undefined ? { kisaAralik: { enAzAy: kisa, ekDoz: ek } } : {}) })
  }
  return { kaynak: 'pack', satirlar: out }
}

export const HPV_ASI_KAYDI: AracTanimi = {
  anahtar: 'hpv-asi-kaydi', tur: 'takvim', yazdirilir: true,
  alanlar: [
    sayi('ilk_doz_yasi', 0, 99, { tam: true }), secim('immun', ['normal', 'baskilanmis']), secim('asi_tipi', HPV_ASI_TIPLERI),
    tarih('doz1_tarihi'), tarih('doz2_tarihi', true), tarih('doz3_tarihi', true),
    tarih('son_serviks_tarihi', true), metin('son_serviks_sonucu', { istege: true }),
  ],
  cikti: { sayilar: ['gereken_doz', 'yapilan_doz'], bantlar: ['tamamlandi', 'devam', 'kural_yok'], uyarilar: ['kisa_aralik_ek_doz', 'aralik_erken', 'sira_hatali', 'aralik_belirtilmemis'], tarihler: ['sonraki_en_erken', 'sonraki_en_gec', 'son_serviks'] },
  tablolar: [{ anahtar: 'hpv_takvimi', istege: true, sutunlar: [{ anahtar: 'immun', tur: 'anahtar' }, ...HPV_TAKVIM_SUTUNLARI.map((k) => ({ anahtar: k, tur: 'sayi' as const }))] }],
  kaynak: null,
  hesapla: (g, ortam): AracSonucu => {
    // no table from the country: the doses are still recorded and counted; the schedule is "no rule" (never the kit's own)
    const kural = hpvKuraliTablodan(ortam.t?.hpv_takvimi) ?? { kaynak: 'yok', satirlar: [] }
    if (!gunMu(g.doz1_tarihi)) return BOS_SONUC
    const dozlar = [g.doz1_tarihi, g.doz2_tarihi, g.doz3_tarihi].map((t, i) => (gunMu(t) ? { no: i + 1, tarih: t } : null)).filter((x): x is { no: number; tarih: string } => x !== null)
    const plan = hpvPlani({ ilkDozYasi: n(g.ilk_doz_yasi), immun: g.immun === 'baskilanmis' ? 'baskilanmis' : 'normal', dozlar }, kural)
    const tarihler: { anahtar: string; tarih: string }[] = []
    if (plan.sonraki?.enErken) tarihler.push({ anahtar: 'sonraki_en_erken', tarih: plan.sonraki.enErken })
    if (plan.sonraki?.enGec) tarihler.push({ anahtar: 'sonraki_en_gec', tarih: plan.sonraki.enGec })
    if (gunMu(g.son_serviks_tarihi)) tarihler.push({ anahtar: 'son_serviks', tarih: g.son_serviks_tarihi })
    const uyarilar: string[] = [...plan.uyarilar]
    if (plan.durum === 'devam' && !plan.sonraki?.enErken) uyarilar.push('aralik_belirtilmemis')
    return {
      tamam: true,
      sayilar: [...(plan.gereken !== null ? [{ anahtar: 'gereken_doz', deger: plan.gereken, ondalik: 0 }] : []), { anahtar: 'yapilan_doz', deger: plan.yapilan, ondalik: 0 }],
      bant: plan.durum === 'kayit_yok' ? null : plan.durum,
      uyarilar, tarihler,
    }
  },
}

// ───────────────────────── SMA carrier screening ─────────────────────────

const YAPILDI = { alan: 'durum', degerler: ['yapildi'] } as const
export const SMA_TASIYICILIK: AracTanimi = {
  anahtar: 'sma-tasiyicilik', tur: 'liste', yazdirilir: true,
  alanlar: [
    secim('durum', SMA_DURUMLARI), tarih('tarih', true),
    { ...secim('sonuc', SMA_SONUCLARI), kosul: YAPILDI }, metin('smn1_kopya', { istege: true, enCok: 8, kosul: YAPILDI }),
    { ...secim('es_durumu', SMA_ES_DURUMLARI, true), kosul: YAPILDI },
    { ...secim('es_sonucu', SMA_SONUCLARI), kosul: { alan: 'es_durumu', degerler: ['yapildi'] } }, metin('es_smn1_kopya', { istege: true, enCok: 8, kosul: { alan: 'es_durumu', degerler: ['yapildi'] } }),
    { ...secim('genetik_danisma', ['yonlendirildi', 'yonlendirilmedi'], true), kosul: YAPILDI },
  ],
  cikti: { sayilar: [], bantlar: ['teklif_edilmedi', 'teklif_edildi', 'reddetti', 'yapildi_tasiyici', 'yapildi_tasiyici_degil', 'yapildi_belirsiz'], uyarilar: ['es_testi_istemi', 'genetik_danisma_istemi', 'cift_tasiyici', 'kopya_yorumlanmaz'], tarihler: ['tarih'] },
  kaynak: null,
  hesapla: (g): AracSonucu => {
    const s = (x: unknown) => (typeof x === 'string' && x !== '' ? x : null)
    // a field is read only while its conditions hold, the partner's result only while BOTH do (as the screen shows them)
    const yapildi = g.durum === 'yapildi', esYapildi = yapildi && g.es_durumu === 'yapildi'
    const r = smaDegerlendir({ durum: s(g.durum) as never, tarih: s(g.tarih), sonuc: yapildi ? s(g.sonuc) as never : null, smn1Kopya: yapildi ? s(g.smn1_kopya) : null, esDurumu: yapildi ? s(g.es_durumu) as never : null, esSonucu: esYapildi ? s(g.es_sonucu) as never : null, esSmn1Kopya: esYapildi ? s(g.es_smn1_kopya) : null, genetikDanisma: yapildi ? s(g.genetik_danisma) as never : null })
    if (!r.ok) return BOS_SONUC
    const uyarilar: string[] = []
    if (r.esTestiIstemi) uyarilar.push('es_testi_istemi')
    if (r.genetikDanismaIstemi) uyarilar.push('genetik_danisma_istemi')
    if (r.ciftTasiyici) uyarilar.push('cift_tasiyici')
    if (r.kayit.smn1Kopya || r.kayit.esSmn1Kopya) uyarilar.push('kopya_yorumlanmaz')
    return { tamam: true, sayilar: [], bant: r.kayit.durum === 'yapildi' ? `yapildi_${r.kayit.sonuc}` : r.kayit.durum, uyarilar, tarihler: r.kayit.tarih ? [{ anahtar: 'tarih', tarih: r.kayit.tarih }] : [] }
  },
}

// ───────────────────────── PMS / PMDD diary summary ─────────────────────────

const ikinci = (a: AracAlani): AracAlani => ({ ...a, istege: true })
/** Cycle c, domain a: the highest rating of the 7 days before menses, and of the 7 days after the bleeding ended. */
export const PMDD_DIARY_ALANLARI: readonly AracAlani[] = [1, 2].flatMap((c) => [
  c === 1 ? tarih(`d${c}_adet`) : tarih(`d${c}_adet`, true),
  ...PMDD_ALANLARI.flatMap((a) => [puan(`d${c}_${a}_once`, 0, 5), puan(`d${c}_${a}_sonra`, 0, 5)].map((x) => (c === 2 ? ikinci(x) : x))),
])
export const PMDD_GUNLUK_OZETI: AracTanimi = {
  anahtar: 'pmdd-gunluk-ozeti', tur: 'olcek', yazdirilir: true,
  alanlar: [
    ...PMDD_DIARY_ALANLARI,
    ...PMDD_KRITERLERI.map((k) => isaret(`kriter_${k.toLowerCase()}`)),
    ...PMDD_YONETIM_SECENEKLERI.map((k) => isaret(`yonetim_${k}`)),
  ],
  cikti: { sayilar: ['dongu1_karsilayan', 'dongu2_karsilayan', 'oruntu_dongu'], bantlar: ['tum_kriterler', 'gecici', 'eksik'], uyarilar: ['iki_dongu_oruntu', 'tek_dongu', 'tani_hekimde'], tarihler: ['d1_adet', 'd2_adet'] },
  kaynak: null,
  hesapla: (g): AracSonucu => {
    if (!gunMu(g.d1_adet)) return BOS_SONUC
    const dongu = (c: number) => {
      const e: Partial<Record<PmddAlani, { once: number | null; sonra: number | null }>> = {}
      for (const a of PMDD_ALANLARI) { const o = n(g[`d${c}_${a}_once`]), s = n(g[`d${c}_${a}_sonra`]); if (o === null || s === null) return null; e[a] = { once: o, sonra: s } }
      return pmddDonguSonucu(e)
    }
    const d1 = dongu(1)
    if (!d1) return BOS_SONUC
    const d2 = gunMu(g.d2_adet) ? dongu(2) : null
    const oruntu = (d1.oruntu ? 1 : 0) + (d2?.oruntu ? 1 : 0)
    const isaretli = PMDD_KRITERLERI.filter((k) => g[`kriter_${k.toLowerCase()}`] === true)
    const uyarilar = [oruntu >= 2 ? 'iki_dongu_oruntu' : 'tek_dongu', 'tani_hekimde']
    const tarihler = [{ anahtar: 'd1_adet', tarih: g.d1_adet }, ...(gunMu(g.d2_adet) ? [{ anahtar: 'd2_adet', tarih: g.d2_adet }] : [])]
    return {
      tamam: true,
      sayilar: [{ anahtar: 'dongu1_karsilayan', deger: d1.karsilayan, ondalik: 0, enCok: PMDD_ALANLARI.length }, ...(d2 ? [{ anahtar: 'dongu2_karsilayan', deger: d2.karsilayan, ondalik: 0, enCok: PMDD_ALANLARI.length }] : []), { anahtar: 'oruntu_dongu', deger: oruntu, ondalik: 0, enCok: 2 }],
      bant: pmddKontrolListesi(isaretli).durum, uyarilar, tarihler,
    }
  },
}

export const KD_TARAMA_ARACLARI: readonly AracTanimi[] = [GEBELIK_TIROID, HPV_ASI_KAYDI, SMA_TASIYICILIK, PMDD_GUNLUK_OZETI]
