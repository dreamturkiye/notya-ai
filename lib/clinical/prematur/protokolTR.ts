/**
 * PREMATURE-MODUL — Türkiye protokol tablosu (ülke 'tr'). Her kural kaynağını ve doğrulama düzeyini taşır.
 * Doğrulama 2026-11-13'te yapıldı (web kaynaklarından; ayrıntı ve sınırlar docs/PREMATURE-MODUL.md).
 *
 * DÜRÜSTLÜK NOTU: Ulusal (TND / SB) metni okunabilen yerde ulusal metin esas alındı (ROP). Okunamayan yerde (kraniyal USG,
 * işitme risk göstergeleri, RSV, kemik) uluslararası referans kullanıldı ve kaynakta 'ikincil-ozet' / 'dogrulanmadi' diye
 * işaretlendi; hekim ulusal kılavuzla teyit eder. Hiçbir kural doz içermez.
 */
import { VARSAYILAN_DUZELTME_KURALI } from './duzeltilmisYas'
import type { PrematurProtokol, PrematurKural, Kaynak } from './protokol'

const KAYNAK_ROP_TR: Kaynak = {
  kisa: 'TOD/TND Türkiye Prematüre Retinopatisi Rehberi 2016',
  tam: 'Türk Oftalmoloji Derneği ROP Komisyonu ve Türk Neonatoloji Derneği ROP Çalışma Grubu. Türkiye Prematüre Retinopatisi Rehberi, 2016 (Koç E, Baş AY, Özdek Ş, Ovalı F, Başmak H ve ark.). Tarama: gestasyon ≤ 32 hafta ya da doğum ağırlığı ≤ 1500 g; ilk muayene: < 27 hafta için postmenstrüel 30–31. hafta, ≥ 27 hafta için postnatal 4. hafta.',
  durum: 'birincil-okundu',
  not: 'Rehber PDF kopyasından okundu (2026-11-13). GA > 32 hf / DA > 1500 g bebekler kardiyopulmoner destek aldıysa ya da klinisyen riskli bulursa taranır (ropSecili).',
}
const KAYNAK_ROP_AAP: Kaynak = {
  kisa: 'AAP/AAO/AAPOS/AACO ROP tarama 2018',
  tam: 'Fierson WM; AAP Section on Ophthalmology ve ark. Screening examination of premature infants for retinopathy of prematurity. Pediatrics 2018;142(6):e20183061. Tarama: DA ≤ 1500 g ya da GA ≤ 30 hafta (+ seçilmiş 1500–2000 g / GA > 30). İlk muayene: 24 hf → PMA 31 / 7. hafta … 27 hf → PMA 31 / 4. hafta; 28 hf → 32; 29 hf → 33; 30 hf → 34.',
  durum: 'birincil-okundu',
  not: 'Karşılaştırma için; Türkiye kuralı TOD/TND rehberidir.',
}
const KAYNAK_KRANIYAL: Kaynak = {
  kisa: 'AAP Fetüs ve Yenidoğan Komitesi — Hand 2020 (preterm beyin görüntüleme)',
  tam: 'Hand IL, Shellhaas RA, Milla SS; AAP Committee on Fetus and Newborn ve ilgili bölümler. Routine neuroimaging of the preterm brain. Pediatrics 2020;146(5). Zamanlama (7–10. gün, 4–6. hafta, 36–40. hafta PMA) kurumsal bir protokol özetinden (Mombaby/CPG 2023) okundu.',
  durum: 'ikincil-ozet',
  not: 'Birincil metin okunamadı. Kriter eşiği özetteki ≤ 30 hafta; AAN/CNS uygulama parametresi (Ment 2002) < 30 hafta der. Türk Neonatoloji Derneği kriteri doğrulanmadı — hekim teyit eder.',
}
const KAYNAK_KRANIYAL_AAN: Kaynak = {
  kisa: 'AAN/CNS uygulama parametresi 2002 (neonatal nörogörüntüleme)',
  tam: 'Ment LR ve ark. Practice parameter: neuroimaging of the neonate. Neurology 2002;58:1726-1738.',
  durum: 'dogrulanmadi',
  not: 'Yalnız künye (özetten); içerik bu çalışmada okunmadı.',
}
const KAYNAK_JCIH: Kaynak = {
  kisa: 'JCIH 2019 Position Statement',
  tam: 'Joint Committee on Infant Hearing. Year 2019 Position Statement: Principles and Guidelines for Early Hearing Detection and Intervention Programs. J Early Hear Detect Interv 2019;4(2):1-44. Risk göstergeleri ve izlem: NICU > 5 gün, değişim transfüzyonu, ototoksik ilaç → 9. aya kadar odyolojik değerlendirme, 2 yaşta izlem; ECMO → 3. aya kadar, yıllık izlem.',
  durum: 'ikincil-ozet',
  not: 'Vermont EHDI özet tablosundan (2022) okundu; birincil metin okunamadı. Türkiye ulusal işitme tarama programı (SB/HSGM) kriteri bu tabloda yoktur — hekim teyit eder.',
}
const KAYNAK_CLD_AAP: Kaynak = {
  kisa: 'AAP 2014 palivizumab politikası (kronik akciğer hastalığı tanımı)',
  tam: 'AAP Committee on Infectious Diseases; Committee on Fetus and Newborn. Updated guidance for palivizumab prophylaxis among infants and young children at increased risk of hospitalization for respiratory syncytial virus infection. Pediatrics 2014;134(2):415-420. KAH: < 32 hafta doğum + ilk 28 gün > %21 oksijen.',
  durum: 'ikincil-ozet',
  not: 'AFP (2014) özetinden okundu.',
}
const KAYNAK_RSV_AAP: Kaynak = {
  kisa: 'AAP 2014 palivizumab politikası',
  tam: 'AAP 2014 (Pediatrics 134:415-420). Uygunluk: < 29 hafta doğum ve sezon başında < 12 aylık; KAH (< 32 hf + ≥ 28 gün > %21 O2) ilk yıl; hemodinamik anlamlı doğumsal kalp hastalığı ≤ 12 ay. ≥ 29 hafta: yalnız KAH / KKH / başka nitelikli durum; yalnız prematürite ikinci yılda önerilmez.',
  durum: 'ikincil-ozet',
  not: 'AFP (2014) özetinden okundu. nirsevimab (sonraki rehberlerde) bu tabloda yok.',
}
const KAYNAK_RSV_TND: Kaynak = {
  kisa: 'Türk Neonatoloji Derneği palivizumab önerileri (2014)',
  tam: 'Türk Neonatoloji Derneği, palivizumab kullanma önerileri (2014). KAH tanımı: gebelik yaşı < 32 0/7 hafta + en az 28 gün > %21 oksijen; RSV sezonu başında < 12 ay.',
  durum: 'ikincil-ozet',
  not: 'Ovalı F. Klinik Tıp Pediatri 2018;10(4) derlemesinden aktarma; TND metni ve SGK ödeme kriterleri okunamadı — hekim teyit eder.',
}
const KAYNAK_DEMIR_SB: Kaynak = {
  kisa: 'SB Bebek-Çocuk İzlem Protokolleri (demir profilaksisi)',
  tam: 'T.C. Sağlık Bakanlığı Bebek, Çocuk, Ergen İzlem Protokolleri 2018 — preterm ya da < 2500 g: 2. aydan başlayarak 5 ay (Notya izlem takvimi ve kohort paneliyle aynı kural).',
  durum: 'ikincil-ozet',
  not: 'Notya\'nın mevcut SB izlem tablosundan devralındı (lib/clinical/yenidogan/calendar.ts, gelisimPlan.ts); bu çalışmada birincil metin yeniden okunmadı. Karşılaştırma: AAP 2010 (Pediatrics 126:1040) ilk aya kadar başlanmasını öngörür.',
}
const KAYNAK_KEMIK: Kaynak = {
  kisa: 'AAP 2013 — enteral beslenen prematürede kalsiyum ve D vitamini',
  tam: 'Abrams SA; AAP Committee on Nutrition. Calcium and vitamin D requirements of enterally fed preterm infants. Pediatrics 2013;131(5):e1676-83 (PMID 23629620).',
  durum: 'dogrulanmadi',
  not: 'Yalnız künye doğrulandı; izlem zamanlaması / eşikleri bu çalışmada okunmadı, bu yüzden tarih üretilmez.',
}

const g = (alan: 'gestasyonHafta', op: '<' | '<=' | '>=', deger: number, etiket: string) => ({ alan, op, deger, etiket })

export const KURALLAR_TR: PrematurKural[] = [
  {
    kod: 'rop', kategori: 'goz', baslik: 'ROP (prematüre retinopatisi) taraması',
    aciklama: 'Gebelik ≤ 32 hafta ya da doğum ağırlığı ≤ 1500 g (ya da hekimin riskli bulduğu bebek) için göz dibi tarama penceresi.',
    kriter: { herhangiBiri: [
      [g('gestasyonHafta', '<=', 32, 'gestasyon ≤ 32 hafta')],
      [{ alan: 'dogumKiloGr', op: '<=', deger: 1500, etiket: 'doğum ağırlığı ≤ 1500 g' }],
      [{ alan: 'ropSecili', op: 'dogru', etiket: 'hekim: kardiyopulmoner destek / riskli bebek' }],
    ] },
    zamanlamalar: [
      { kod: 'ilk-pma', etiket: 'İlk ROP muayenesi — postmenstrüel 30–31. hafta', kosul: [g('gestasyonHafta', '<', 27, 'gestasyon < 27 hafta')], bas: { tur: 'pma-hafta', hafta: 30 }, son: { tur: 'pma-hafta', hafta: 31 } },
      { kod: 'ilk-4hf', etiket: 'İlk ROP muayenesi — postnatal 4. hafta', kosul: [g('gestasyonHafta', '>=', 27, 'gestasyon ≥ 27 hafta')], bilinmiyorsa: 'dahil', bas: { tur: 'dogumdan-hafta', hafta: 4 } },
    ],
    kayitTuru: 'rop', herhangiKayitKapatir: true,
    kaynaklar: [KAYNAK_ROP_TR, KAYNAK_ROP_AAP],
    hekimNotu: 'Sonraki muayene aralığı ve tarama sonlandırma oftalmolog kararıdır. Gestasyon < 25 hafta için erken (postnatal 6. hafta) muayene rehberde izinlidir.',
  },
  {
    kod: 'kraniyal-usg', kategori: 'beyin', baslik: 'Kraniyal ultrasonografi (IVK taraması)',
    aciklama: 'Gestasyon ≤ 30 hafta için rutin kraniyal USG zamanları.',
    kriter: { herhangiBiri: [[g('gestasyonHafta', '<=', 30, 'gestasyon ≤ 30 hafta')]] },
    zamanlamalar: [
      { kod: 'ilk', etiket: 'İlk kraniyal USG — 7–10. gün', bas: { tur: 'dogumdan-gun', gun: 7 }, son: { tur: 'dogumdan-gun', gun: 10 } },
      { kod: 'tekrar', etiket: 'Tekrar USG — 4–6. hafta', bas: { tur: 'dogumdan-hafta', hafta: 4 }, son: { tur: 'dogumdan-hafta', hafta: 6 } },
      { kod: 'term', etiket: 'Term eşdeğeri USG — postmenstrüel 36–40. hafta', bas: { tur: 'pma-hafta', hafta: 36 }, son: { tur: 'pma-hafta', hafta: 40 } },
    ],
    kaynaklar: [KAYNAK_KRANIYAL, KAYNAK_KRANIYAL_AAN],
    hekimNotu: 'Anormal bulguda (ör. evre 2–4 IVK) tekrar sıklığı klinik karardır; çoğu bebekte bu görüntüleme yoğun bakımda yapılmıştır — sonucu kayıt altına alın.',
  },
  {
    kod: 'isitme-9ay', kategori: 'isitme', baslik: 'Risk göstergeli bebekte odyolojik değerlendirme',
    aciklama: 'Yoğun bakım > 5 gün, değişim transfüzyonu ya da ototoksik ilaç (> 5 gün) öyküsü: işitme taramasını geçse bile 9. aya kadar odyolojik değerlendirme.',
    kriter: { herhangiBiri: [
      [{ alan: 'nicuGun', op: '>', deger: 5, etiket: 'yoğun bakım > 5 gün' }],
      [{ alan: 'ototoksik5Gun', op: 'dogru', etiket: 'ototoksik ilaç > 5 gün' }],
      [{ alan: 'degisimTransfuzyonu', op: 'dogru', etiket: 'değişim transfüzyonu' }],
    ] },
    zamanlamalar: [
      { kod: 'degerlendirme', etiket: 'Odyolojik değerlendirme — 9. aya kadar', son: { tur: 'kronolojik-ay', ay: 9 } },
      { kod: 'izlem-24ay', etiket: 'İşitme izlemi — 2 yaşta', bas: { tur: 'kronolojik-ay', ay: 24 } },
    ],
    kaynaklar: [KAYNAK_JCIH],
    hekimNotu: 'Yenidoğan işitme taraması sonucu Gelişim & Tarama panelinde ayrıca izlenir.',
  },
  {
    kod: 'isitme-ecmo', kategori: 'isitme', baslik: 'ECMO sonrası işitme değerlendirmesi',
    aciklama: 'ECMO öyküsü: 3. aya kadar odyolojik değerlendirme, sonra yıllık izlem.',
    kriter: { herhangiBiri: [[{ alan: 'ecmo', op: 'dogru', etiket: 'ECMO öyküsü' }]] },
    zamanlamalar: [{ kod: 'degerlendirme', etiket: 'Odyolojik değerlendirme — 3. aya kadar', son: { tur: 'kronolojik-ay', ay: 3 } }],
    kaynaklar: [KAYNAK_JCIH],
    hekimNotu: 'Sonrasında yıllık izlem (JCIH 2019).',
  },
  {
    kod: 'bpd-kah', kategori: 'akciger', baslik: 'Kronik akciğer hastalığı (BPD) kriteri',
    aciklama: '< 32 hafta doğum + ilk 28 günde > %21 oksijen gereksinimi: BPD / kronik akciğer hastalığı kriteri.',
    kriter: { herhangiBiri: [[g('gestasyonHafta', '<', 32, 'gestasyon < 32 hafta'), { alan: 'oksijen28Gun', op: 'dogru', etiket: 'ilk 28 gün > %21 oksijen' }]] },
    zamanlamalar: [],
    kaynaklar: [KAYNAK_CLD_AAP],
    hekimNotu: 'Kriter karşılanması tanı değildir; pulmoner izlem ve evrelendirme (ör. 36. hafta PMA oksijen gereksinimi) hekim kararıdır.',
  },
  {
    kod: 'rsv', kategori: 'enfeksiyon', baslik: 'RSV pasif immünprofilaksi uygunluğu',
    aciklama: 'Palivizumab (ve ulusal erişim varsa nirsevimab) uygunluğu için ulusal / uluslararası kriterler.',
    kriter: { herhangiBiri: [
      [g('gestasyonHafta', '<', 29, 'gestasyon < 29 hafta'), { alan: 'yasAy', op: '<', deger: 12, etiket: 'yaş < 12 ay' }],
      [g('gestasyonHafta', '<', 32, 'gestasyon < 32 hafta'), { alan: 'oksijen28Gun', op: 'dogru', etiket: 'ilk 28 gün > %21 oksijen (KAH)' }, { alan: 'yasAy', op: '<', deger: 12, etiket: 'yaş < 12 ay' }],
      [{ alan: 'hsKkh', op: 'dogru', etiket: 'hemodinamik anlamlı doğumsal kalp hastalığı' }, { alan: 'yasAy', op: '<=', deger: 12, etiket: 'yaş ≤ 12 ay' }],
    ] },
    zamanlamalar: [],
    kaynaklar: [KAYNAK_RSV_AAP, KAYNAK_RSV_TND],
    hekimNotu: 'Kriter, RSV sezonu BAŞLANGICINDAKİ yaşa göre değerlendirilir; bu satır bugünkü yaşı kullanır. Ulusal ödeme (SGK) kriterleri ve ürün erişimi hekimce teyit edilir. Doz ve uygulama bu araçta yoktur.',
  },
  {
    kod: 'demir', kategori: 'kan', baslik: 'Prematüre anemisi / demir profilaksisi',
    aciklama: 'Preterm ya da < 2500 g bebekte demir profilaksisi başlangıç penceresi (SB programı: 2. ay).',
    kriter: { herhangiBiri: [[g('gestasyonHafta', '<', 37, 'gestasyon < 37 hafta')], [{ alan: 'dogumKiloGr', op: '<', deger: 2500, etiket: 'doğum ağırlığı < 2500 g' }]] },
    zamanlamalar: [{ kod: 'baslangic', etiket: 'Demir profilaksisi penceresi — 2. aydan başlayarak 5 ay', bas: { tur: 'dogumdan-gun', gun: 60 }, son: { tur: 'dogumdan-gun', gun: 212 } }],
    kaynaklar: [KAYNAK_DEMIR_SB],
    hekimNotu: 'Hb / ferritin izlemi ve doz hekim kararıdır. Takvimde ayrıca "Demir profilaksisi" görevi olabilir.',
  },
  {
    kod: 'kemik', kategori: 'kemik', baslik: 'Prematüre kemik metabolizması izlemi',
    aciklama: 'Prematüre bebekte kalsiyum / fosfor / alkalen fosfataz izlemi ve D vitamini-mineral desteği için hekim değerlendirmesi.',
    kriter: { herhangiBiri: [[g('gestasyonHafta', '<', 37, 'gestasyon < 37 hafta')]] },
    zamanlamalar: [],
    kaynaklar: [KAYNAK_KEMIK],
    hekimNotu: 'Bu satır tarih ya da eşik üretmez (kaynak metni okunamadı): izlem kararı ve zamanlaması hekime aittir.',
  },
]

export const PROTOKOL_TR: PrematurProtokol = {
  ulke: 'tr',
  ad: 'Türkiye',
  surum: '2026-11-13',
  duzeltme: VARSAYILAN_DUZELTME_KURALI,
  kapsam: { gestasyonHaftaKucuk: 37, dogumKiloGrEnFazla: 1500, kaynak: 'Preterm tanımı < 37 hafta (DSÖ); ≤ 1500 g ROP tarama ağırlığı (TOD/TND 2016).' },
  urun: { gecikmeToleransGun: 14, yaklasanGun: 30, gecikmeGorunurGun: 180, planUstAy: 36 },
  kurallar: KURALLAR_TR,
}

/** Ülke → protokol. Yeni ülke yalnız buraya bir tablo ekler; motor değişmez. */
export const PREMATUR_PROTOKOLLERI: Readonly<Record<string, PrematurProtokol>> = { tr: PROTOKOL_TR }

export function prematurProtokolu(ulke = 'tr'): PrematurProtokol {
  return PREMATUR_PROTOKOLLERI[ulke] || PROTOKOL_TR
}
