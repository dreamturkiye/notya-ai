/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — PROCEDURE-SPECIFIC CONSENT FORMS for the obstetric and gynaecological operations of
 * the operation-note templates (AMELIYAT-NOTU-01: the same keys). Obstetrics and gynaecology only. Pure, country-neutral:
 * the STRUCTURE of each form (which sections, which risks by key, in which group). Every word — the description, the
 * benefits, the alternatives, each risk's name — is the build's own, in its language, under its country's national
 * consent guidance (Türkiye build; each country pack). No frequency is written here: a form shows a frequency only where
 * the build's own national source states one; otherwise the clinician records the figure discussed.
 *
 * Hymenoplasty is NOT a form here (Kaan's decision pending; it is not among the operation-note templates either).
 */

export const ONAM_PROSEDURLERI = ['sezaryen', 'tlh', 'tah', 'vajinal_histerektomi', 'lap_myomektomi', 'abdominal_myomektomi', 'tanisal_laparoskopi', 'lap_over_kistektomi', 'lap_endometriozis', 'histeroskopi', 'dc_kuretaj', 'vakum_aspirasyon', 'kolposkopi_leep', 'ria', 'labioplasti', 'perineoplasti', 'labioplasti_klitoral', 'vajinoplasti'] as const
export type OnamProseduru = (typeof ONAM_PROSEDURLERI)[number]

/** Risks grouped as the national consent series group them: serious (uncommon but grave) and frequent. */
export type OnamYapisi = { ciddi: readonly string[]; sik: readonly string[]; ekIslemler: readonly string[] }

const LAP_CIDDI = ['bagirsak_mesane_damar_yaralanmasi', 'laparotomiye_gecis', 'giris_basarisizligi', 'trokar_yeri_fitigi', 'vte', 'olum_cok_nadir'] as const
const LAP_SIK = ['yara_morarma_enfeksiyon', 'omuz_agrisi', 'karin_sislik_agri'] as const
const HISTEREKTOMI_CIDDI = ['kanama_transfuzyon', 'mesane_ureter_yaralanmasi', 'bagirsak_yaralanmasi', 'vte', 'yeniden_ameliyat', 'pelvik_abse_enfeksiyon', 'olum_cok_nadir'] as const
const HISTEREKTOMI_SIK = ['yara_enfeksiyonu', 'idrar_yolu_enfeksiyonu', 'idrar_sikligi_bosaltim_guclugu', 'agri_yorgunluk'] as const

export const ONAM_YAPILARI: Readonly<Record<OnamProseduru, OnamYapisi>> = {
  sezaryen: { ciddi: ['histerektomi', 'kanama_transfuzyon', 'mesane_ureter_yaralanmasi', 'bagirsak_yaralanmasi', 'vte', 'sonraki_gebelikte_ruptur', 'sonraki_gebelikte_plasenta_anomalisi', 'yeniden_ameliyat', 'olum_cok_nadir'], sik: ['agri', 'yara_enfeksiyonu', 'endometrit', 'yeniden_basvuru', 'bebekte_kesi_cizigi'], ekIslemler: ['kan_transfuzyonu', 'histerektomi', 'tup_ligasyonu_ayri_onam'] },
  tlh: { ciddi: [...HISTEREKTOMI_CIDDI, 'laparotomiye_gecis', 'vajen_kafi_ayrilmasi'], sik: [...HISTEREKTOMI_SIK, 'omuz_agrisi'], ekIslemler: ['laparotomi', 'over_tup_cikarilmasi', 'kan_transfuzyonu'] },
  tah: { ciddi: HISTEREKTOMI_CIDDI, sik: [...HISTEREKTOMI_SIK, 'yara_morarma_enfeksiyon'], ekIslemler: ['over_tup_cikarilmasi', 'kan_transfuzyonu', 'bagirsak_mesane_onarimi'] },
  vajinal_histerektomi: { ciddi: [...HISTEREKTOMI_CIDDI, 'abdominal_yola_gecis'], sik: HISTEREKTOMI_SIK, ekIslemler: ['laparotomi_veya_laparoskopi', 'kan_transfuzyonu'] },
  lap_myomektomi: { ciddi: [...LAP_CIDDI, 'kanama_transfuzyon', 'histerektomi', 'sonraki_gebelikte_ruptur', 'beklenmeyen_malignite'], sik: [...LAP_SIK, 'myom_tekrari', 'yapisiklik'], ekIslemler: ['laparotomi', 'histerektomi', 'kan_transfuzyonu'] },
  abdominal_myomektomi: { ciddi: ['kanama_transfuzyon', 'histerektomi', 'mesane_ureter_yaralanmasi', 'bagirsak_yaralanmasi', 'vte', 'sonraki_gebelikte_ruptur', 'beklenmeyen_malignite'], sik: ['yara_enfeksiyonu', 'agri_yorgunluk', 'myom_tekrari', 'yapisiklik'], ekIslemler: ['histerektomi', 'kan_transfuzyonu'] },
  tanisal_laparoskopi: { ciddi: LAP_CIDDI, sik: LAP_SIK, ekIslemler: ['laparotomi', 'gorulen_hastaligin_tedavisi'] },
  lap_over_kistektomi: { ciddi: [...LAP_CIDDI, 'ooforektomi', 'over_rezervinde_azalma'], sik: [...LAP_SIK, 'kist_tekrari'], ekIslemler: ['laparotomi', 'ooforektomi'] },
  lap_endometriozis: { ciddi: [...LAP_CIDDI, 'ureter_yaralanmasi', 'bagirsak_rezeksiyonu_stoma', 'mesane_disfonksiyonu'], sik: [...LAP_SIK, 'agri_suregenligi', 'hastalik_tekrari'], ekIslemler: ['laparotomi', 'bagirsak_cerrahisi_ayri_onam'] },
  histeroskopi: { ciddi: ['uterus_perforasyonu', 'bagirsak_mesane_damar_yaralanmasi', 'giris_basarisizligi', 'sivi_yuklenmesi', 'olum_cok_nadir'], sik: ['kanama', 'enfeksiyon', 'kramp_agri'], ekIslemler: ['laparoskopi', 'islemin_ertelenmesi'] },
  dc_kuretaj: { ciddi: ['uterus_perforasyonu', 'kanama_transfuzyon', 'servikal_yaralanma', 'intrauterin_yapisiklik'], sik: ['kanama', 'enfeksiyon', 'kalinti_doku_tekrar_islem'], ekIslemler: ['laparoskopi', 'tekrar_islem'] },
  vakum_aspirasyon: { ciddi: ['uterus_perforasyonu', 'kanama_transfuzyon', 'servikal_yaralanma', 'intrauterin_yapisiklik'], sik: ['kanama', 'enfeksiyon', 'kalinti_doku_tekrar_islem'], ekIslemler: ['laparoskopi', 'tekrar_islem'] },
  kolposkopi_leep: { ciddi: ['ciddi_kanama', 'servikal_darlik', 'sonraki_gebelikte_erken_dogum'], sik: ['akinti', 'kanama', 'enfeksiyon', 'tekrar_tedavi'], ekIslemler: ['biyopsi', 'ek_eksizyon'] },
  ria: { ciddi: ['uterus_perforasyonu', 'ektopik_gebelik', 'pelvik_enfeksiyon'], sik: ['kramp_agri', 'duzensiz_kanama', 'ekspulsiyon'], ekIslemler: ['cikarma_icin_histeroskopi'] },
  labioplasti: { ciddi: ['kanama_hematom', 'yara_ayrilmasi', 'his_degisikligi', 'asimetri_revizyon', 'beklentiyle_uyumsuz_sonuc'], sik: ['sislik_agri', 'enfeksiyon', 'disparoni_gecici'], ekIslemler: ['revizyon'] },
  perineoplasti: { ciddi: ['kanama_hematom', 'rektum_yaralanmasi', 'disparoni', 'yara_ayrilmasi'], sik: ['agri', 'enfeksiyon', 'idrar_yolu_enfeksiyonu', 'tekrar'], ekIslemler: ['revizyon'] },
  // GENITAL-ESTETIK-01 (2026-11-06): the clitoral-hood variant of labioplasty (ACOG Committee Opinion 795 lists clitoral hood
  // reduction among female genital cosmetic procedures) and a dedicated vaginoplasty / colpoperineorrhaphy.
  labioplasti_klitoral: { ciddi: ['kanama_hematom', 'yara_ayrilmasi', 'his_degisikligi', 'klitoral_his_degisikligi', 'asimetri_revizyon', 'beklentiyle_uyumsuz_sonuc'], sik: ['sislik_agri', 'enfeksiyon', 'disparoni_gecici'], ekIslemler: ['revizyon'] },
  vajinoplasti: { ciddi: ['kanama_hematom', 'rektum_yaralanmasi', 'introitus_darligi', 'disparoni', 'yara_ayrilmasi', 'beklentiyle_uyumsuz_sonuc'], sik: ['agri', 'enfeksiyon', 'idrar_yolu_enfeksiyonu', 'tekrar'], ekIslemler: ['revizyon'] },
}

/** Every risk key used by any form: a build names each one (its test holds it to that). */
export const ONAM_RISKLERI: readonly string[] = [...new Set(Object.values(ONAM_YAPILARI).flatMap((y) => [...y.ciddi, ...y.sik]))].sort()
export const ONAM_EK_ISLEMLER: readonly string[] = [...new Set(Object.values(ONAM_YAPILARI).flatMap((y) => [...y.ekIslemler]))].sort()
