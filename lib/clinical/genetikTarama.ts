/**
 * NOTYA-KHD-06 (Kaan 2026-09-14 gece) — Genetik/kromozomal tarama testleri: ikili/üçlü/dörtlü
 * test, NT, NIPT, invaziv test (CVS/amniyosentez), genetik risk faktörleri.
 *
 * KRİTİK SINIR — bu dosya RİSK HESAPLAMAZ:
 * Down sendromu (T21)/Edwards (T18)/Patau (T13) risk oranı ("1/250" gibi), NT'nin maternal yaş
 * ve biyokimya ile birleştirilmiş kombine riski, FMF/Astraia gibi SERTİFİKALI, laboratuvara özgü
 * MoM (multiples of median) kalibrasyonu gerektiren yazılımların işidir — bu uygulamada
 * ÜRETİLMEZ. Denver II/WHO persentili dersiyle aynı ilke, burada daha yüksek risk: yanlış bir
 * risk sayısı invaziv test veya gebelik sonlandırma kararını doğrudan etkiler.
 * Bu modül yalnız: (a) laboratuvarın/sertifikalı yazılımın BİLDİRDİĞİ sonucu kaydeder,
 * (b) NT için yalnız muhafazakâr, MUTLAK bir eşik (≥3.5mm) ile "ileri değerlendirme" bayrağı
 * kaldırır — CRL'ye özgü persentil EĞRİSİ üretmez, (c) ileri anne yaşı gibi basit, tartışmasız
 * eşikleri hesaplar. Nihai risk yorumu ve karar hekimindir.
 *
 * Kaynaklar: FMF (Fetal Medicine Foundation) Türkçe eğitim materyali (courses.fetalmedicine.com,
 * 11-13+6 hafta NT ölçüm penceresi) — algoritma değil, terminoloji/pencere kaynağı;
 * T.C. SB Doğum Öncesi Bakım Yönetim Rehberi (ikili/üçlü test, NTD taraması, anomali USG);
 * TJOD ve Perinatoloji Derneği pratiği (ikili/üçlü/dörtlü/NIPT/invaziv test akışı).
 */

export interface IkiliTestSonucu {
  tarih: string; hafta: number
  ntMm: number | null
  nazalKemik: 'mevcut' | 'yok' | 'degerlendirilmedi' | null
  papA: string | null; freeBhcg: string | null     // MoM değeri, laboratuvardan — burada hesaplanmaz
  kombineRisk: string | null                        // "1/1250" gibi, laboratuvarın/yazılımın bildirdiği
  riskKategorisi: 'dusuk' | 'orta' | 'yuksek' | null // laboratuvarın kendi sınıflaması, biz üretmiyoruz
}

export interface UcluDortluTestSonucu {
  tarih: string; hafta: number
  afp: string | null; hcg: string | null; estriol: string | null; inhibinA: string | null
  kombineRisk: string | null; riskKategorisi: 'dusuk' | 'orta' | 'yuksek' | null
}

export interface NiptSonucu {
  tarih: string
  durum: 'istendi' | 'sonuclandi' | 'basarisiz-tekrar'
  t21: 'dusuk-risk' | 'yuksek-risk' | null
  t18: 'dusuk-risk' | 'yuksek-risk' | null
  t13: 'dusuk-risk' | 'yuksek-risk' | null
  cinsiyetKromozomu: string | null
  fetalFraksiyon: string | null
}

export interface InvazifTest {
  tarih: string; tur: 'cvs' | 'amniyosentez' | 'kordosentez' | 'fetal-eko'
  endikasyon: string; sonuc: string | null; karyotip: string | null
}

/** NT için yalnız MUTLAK, muhafazakâr eşik — CRL'ye özgü persentil değil. Sertifikalı yazılımın
 *  kombine risk hesabının YERİNE GEÇMEZ, yalnız "bu ölçüm gözden kaçmasın" bayrağıdır. */
export function ntDegerlendir(ntMm: number | null, hafta: number): { bayrak: boolean; not: string } | null {
  if (ntMm === null || !isFinite(ntMm)) return null
  if (hafta < 11 || hafta > 14) return { bayrak: false, not: 'NT ölçüm penceresi (11-13+6 hafta) dışında.' }
  if (ntMm >= 3.5) return { bayrak: true, not: `NT ${ntMm} mm — mutlak eşik (≥3.5mm) aşıldı, kombine risk için sertifikalı yazılım (FMF/Astraia) ile değerlendirme ve genetik danışmanlık önerilir.` }
  return { bayrak: false, not: `NT ${ntMm} mm — mutlak eşiğin altında. Kombine risk (yaş+biyokimya) yine de laboratuvarınızın/yazılımınızın hesapladığı sonuca göre değerlendirilmelidir.` }
}

/** İleri anne yaşı — tartışmasız, basit eşik (35+ gebelikte kromozomal anomali riski artışı). */
export function ileriAnneYasi(anneYasi: number | null): boolean {
  return anneYasi !== null && anneYasi >= 35
}

export const GENETIK_RISK_SORGUSU = [
  'Akraba evliliği (derece?)',
  'Ailede/önceki gebelikte kromozomal anomali, Down sendromu, nöral tüp defekti öyküsü',
  'Ailede bilinen tek gen hastalığı (talasemi, orak hücre, kistik fibroz vb.)',
  'Tekrarlayan gebelik kaybı öyküsü',
  'Teratojen maruziyeti (ilaç, radyasyon, enfeksiyon)',
  'Anne yaşı ≥35 (ileri anne yaşı)',
]

export const GENETIK_TARAMA_TAKVIMI = [
  { etiket: 'İkili test (NT + PAPP-A + serbest β-hCG)', haftaBas: 11, haftaSon: 14 },
  { etiket: 'Nöral tüp defekti taraması (maternal serum AFP) / Üçlü-dörtlü test', haftaBas: 15, haftaSon: 20 },
  { etiket: 'Ayrıntılı (anomali) USG', haftaBas: 18, haftaSon: 22 },
  { etiket: 'NIPT (istenirse, ikili test sonrası orta/yüksek riskte veya tercihen)', haftaBas: 10, haftaSon: 40 },
]

/** Kaan'ın referans listesinden (SUT kod listesi) — bilgilendirme amaçlı, ödeme kararı SGK/klinik. */
export const SUT_KODLARI = {
  ikiliTest: 'P.901.120',
  ucluTest: 'P.904.090',
}

/** Standart obstetrik tehlike işaretleri — SB DÖB Rehberi ve ACOG post-birth warning signs ile
 *  uyumlu; hasta/aileye anlatılacak, hekim tarafından işaretlenebilecek liste. */
export const TEHLIKE_ISARETLERI = [
  { id: 'kanama', etiket: 'Vajinal kanama' },
  { id: 'siddetli-bas-agrisi', etiket: 'Şiddetli baş ağrısı' },
  { id: 'gorme-bozuklugu', etiket: 'Görme bozukluğu / bulanık görme' },
  { id: 'epigastrik-agri', etiket: 'Epigastrik / sağ üst kadran ağrısı' },
  { id: 'ani-sislik', etiket: 'Ani el-yüz şişliği' },
  { id: 'ates', etiket: 'Ateş' },
  { id: 'su-gelmesi', etiket: 'Erken su gelmesi (membran rüptürü)' },
  { id: 'hareket-azalmasi', etiket: 'Fetal hareketlerde azalma' },
  { id: 'siddetli-kasilma', etiket: 'Düzenli/şiddetli kasılmalar (preterm eylem şüphesi)' },
  { id: 'nefes-darligi', etiket: 'Nefes darlığı / göğüs ağrısı' },
]

/**
 * "Özel pratik overlay" — Kaan'ın referans listesinden: SB'nin asgari 4 izlem takviminin
 * ÜSTÜNE, Williams/TR klinik pratiğinde uygulanan daha sık kontrol aralığı. Bilgilendirme
 * amaçlıdır, SB asgari takvimin yerine geçmez — ikisi birlikte gösterilir.
 */
export function ozelPratikAralik(hafta: number, riskYuksek: boolean): string {
  if (riskYuksek) return 'Yüksek riskli gebelik: haftalık veya 2 haftada bir + NST/Doppler (hekim kararı)'
  if (hafta < 28) return '~4 haftada bir'
  if (hafta < 36) return '2 haftada bir'
  return 'Haftalık'
}
