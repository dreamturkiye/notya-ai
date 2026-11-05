/**
 * KD-OPERATOR-01 (Kaan, 2026-11-05) — the Türkiye build's WORDS for the surgical-safety tool (WHO checklist, Caprini,
 * ASA). CORE: every surgical branch sees the same tool (lib/doktor/ameliyatNotu.ts → ameliyatNotuBransi decides who).
 * The arithmetic is lib/clinical/cerrahiGuvenlik.ts; this file only names its keys in Turkish and states the sources.
 */

export type Kaynak = { kurum: string; belge: string; yil: string; tur: 'ulusal' | 'uluslararasi' }

export const SSC_ASAMA_ADI: Record<string, string> = {
  giris: 'Giriş — anestezi indüksiyonundan önce',
  mola: 'Mola — cilt kesisinden önce',
  cikis: 'Çıkış — hasta ameliyathaneden çıkmadan önce',
}
export const SSC_MADDE_ADI: Record<string, string> = {
  kimlik_bolge_islem_onam: 'Hasta kimliğini, ameliyat bölgesini, işlemi ve onamını doğruladı',
  bolge_isaretlendi: 'Ameliyat bölgesi işaretlendi',
  anestezi_kontrolu: 'Anestezi cihazı ve ilaç kontrolü tamamlandı',
  pulse_oksimetre: 'Pulse oksimetre hastada ve çalışıyor',
  alerji_soruldu: 'Bilinen alerji soruldu ve kaydedildi',
  zor_hava_yolu_hazirlik: 'Zor hava yolu / aspirasyon riski: ekipman ve yardım hazır',
  kan_kaybi_hazirlik: '500 mL üzeri kan kaybı riski (çocukta 7 mL/kg): damar yolu ve sıvı planlandı',
  ekip_tanitildi: 'Ekip üyeleri ad ve görevleriyle tanıtıldı',
  hasta_islem_kesi_teyit: 'Hasta adı, işlem ve kesi yeri teyit edildi',
  antibiyotik_60dk: 'Antibiyotik profilaksisi son 60 dakika içinde verildi',
  cerrah_kritik_adimlar: 'Cerrah: kritik / rutin dışı adımlar, süre, beklenen kan kaybı',
  anestezi_hasta_endiseleri: 'Anestezi ekibi: hastaya özgü endişeler',
  hemsire_sterilite_ekipman: 'Hemşire ekibi: sterilite doğrulandı, ekipman sorunu / endişe',
  goruntuleme_gosteriliyor: 'Gerekli görüntüleme gösteriliyor',
  islem_adi_kaydedildi: 'Yapılan işlemin adı kaydedildi',
  sayim_dogru: 'Alet, gazlı bez ve iğne sayımı doğru',
  numune_etiketlendi: 'Numune hasta adıyla etiketlendi',
  ekipman_sorunlari: 'Giderilmesi gereken ekipman sorunları belirtildi',
  iyilesme_plani: 'Cerrah, anestezi ve hemşire derlenme ve bakım planını gözden geçirdi',
}
export const CAPRINI_MADDE_ADI: Record<string, string> = {
  kucuk_cerrahi: 'Küçük cerrahi', vki_25_ustu: 'VKİ 25 üzeri', bacak_sislik: 'Bacaklarda şişlik', varis: 'Varis',
  gebelik_lohusalik: 'Gebelik veya lohusalık', aciklanamayan_gebelik_kaybi: 'Açıklanamayan ölü doğum / tekrarlayan düşük öyküsü',
  oks_hrt: 'Oral kontraseptif veya hormon tedavisi', sepsis_1ay: 'Sepsis (son 1 ay)', ciddi_akciger_hastaligi_1ay: 'Pnömoni dahil ciddi akciğer hastalığı (son 1 ay)',
  anormal_solunum_fonksiyonu: 'Anormal solunum fonksiyonu (KOAH)', akut_mi: 'Akut miyokard enfarktüsü', kalp_yetersizligi_1ay: 'Kalp yetersizliği (son 1 ay)',
  iltihabi_bagirsak_hastaligi: 'İltihabi bağırsak hastalığı öyküsü', yatak_istirahati_dahili: 'Yatak istirahatindeki dahili hasta',
  artroskopik_cerrahi: 'Artroskopik cerrahi', buyuk_acik_cerrahi_45dk: 'Büyük açık cerrahi (45 dk üzeri)', laparoskopik_cerrahi_45dk: 'Laparoskopik cerrahi (45 dk üzeri)',
  malignite: 'Malignite (aktif veya geçmiş)', yatak_72_saat: 'Yatağa bağımlı (72 saat üzeri)', alci_immobilizasyon: 'Alçı / immobilizasyon', santral_venoz_kateter: 'Santral venöz kateter',
  vte_oykusu: 'VTE öyküsü', ailede_vte: 'Ailede VTE öyküsü', faktor_v_leiden: 'Faktör V Leiden', protrombin_20210a: 'Protrombin 20210A',
  lupus_antikoagulani: 'Lupus antikoagülanı', antikardiyolipin_antikoru: 'Antikardiyolipin antikoru', yuksek_homosistein: 'Yüksek serum homosistein',
  hit: 'Heparine bağlı trombositopeni', diger_trombofili: 'Diğer kalıtsal / edinsel trombofili',
  inme_1ay: 'İnme (son 1 ay)', elektif_artroplasti: 'Elektif büyük eklem artroplastisi', kalca_pelvis_bacak_kirigi: 'Kalça, pelvis veya bacak kırığı', akut_omurilik_hasari_1ay: 'Akut omurilik hasarı (son 1 ay)',
}
export const CAPRINI_BANT_ADI: Record<string, string> = { cok_dusuk: 'Çok düşük risk (0)', dusuk: 'Düşük risk (1–2)', orta: 'Orta risk (3–4)', yuksek: 'Yüksek risk (5 ve üzeri)' }
export const CAPRINI_PLAN_ADI: Record<string, string> = {
  erken_mobilizasyon: 'Erken mobilizasyon; özel profilaksi önerilmez',
  mekanik_ipc: 'Mekanik profilaksi, tercihen aralıklı pnömatik kompresyon',
  farmakolojik: 'Farmakolojik profilaksi (DMAH veya düşük doz heparin); ajan ve doz hekimin',
  mekanik_ek: 'Farmakolojiğe ek olarak mekanik profilaksi (elastik çorap veya aralıklı pnömatik kompresyon)',
  mekanik_kanama_riski: 'Kanama riski yüksek: kanama riski azalana dek mekanik profilaksi',
  uzatilmis_4_hafta: 'Abdominal / pelvik kanser cerrahisi: 4 haftaya uzatılmış DMAH',
}
export const ASA_SINIF_ADI: Record<string, string> = {
  1: 'ASA I — sağlıklı hasta',
  2: 'ASA II — işlev kısıtlaması olmayan hafif sistemik hastalık',
  3: 'ASA III — belirgin işlev kısıtlaması olan ağır sistemik hastalık',
  4: 'ASA IV — yaşamı sürekli tehdit eden ağır sistemik hastalık',
  5: 'ASA V — ameliyat olmadan yaşaması beklenmeyen hasta',
  6: 'ASA VI — organları bağış amacıyla alınan beyin ölümü gerçekleşmiş hasta',
}

/** The sources shown under the tool. Türkiye: no national text was verified in this change → international, said so. */
export const CERRAHI_KAYNAKLARI: Kaynak[] = [
  { kurum: 'Dünya Sağlık Örgütü (WHO)', belge: 'Cerrahi Güvenlik Kontrol Listesi (Surgical Safety Checklist), 1. baskı', yil: '2009', tur: 'uluslararasi' },
  { kurum: 'Caprini JA', belge: 'Thrombosis risk assessment as a guide to quality patient care. Dis Mon 2005;51:70-78 (risk faktörleri ve puanlar)', yil: '2005', tur: 'uluslararasi' },
  { kurum: 'American College of Chest Physicians', belge: 'Gould MK ve ark. Prevention of VTE in nonorthopedic surgical patients. CHEST 2012;141(2 Suppl):e227S-e277S (risk grupları ve profilaksi)', yil: '2012', tur: 'uluslararasi' },
  { kurum: 'American Society of Anesthesiologists', belge: 'ASA Physical Status Classification System', yil: '2020', tur: 'uluslararasi' },
]
export const ULUSLARARASI_NOTU = 'Türkiye’ye özgü bir ulusal kılavuz metni bu sürümde doğrulanamadı; uluslararası kaynak gösteriliyor.'
