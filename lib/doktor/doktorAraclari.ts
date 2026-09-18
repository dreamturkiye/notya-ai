/**
 * Doktor Araçları catalog — commercial product surface for every paying doctor.
 *
 * Rules (.cursor/skills/specialty-doktor-araclari/SKILL.md):
 * - Shared spine tools → every branş.
 * - Chapter clinical tools → that doctor's specialty only (no cross-leak).
 * - Never put internal sprint audits, gap HTML, or named beta-doctor copy in this grid.
 *   Notya is a commercial app — not one clinic's private toolbox.
 */
import { portalBransAnahtari } from '@/lib/portal/moduller'
import { KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI } from '@/lib/doktor/specialties'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

export type DoktorArac = {
  circleColor: string
  icon: string
  title: string
  desc: string
  route: string
  /** null = universal spine tool; otherwise only those SpecialtyKey values see the tile. */
  branslar: SpecialtyKey[] | null
}

/** Universal tools — every specialty. Doctor-facing copy only. */
export const ORTAK_DOKTOR_ARACLARI: readonly DoktorArac[] = [
  { circleColor: '#0F9B8E', icon: 'Rx', title: 'e-Reçete Asistanı', desc: 'Elektronik reçete oluştur ve SGK entegrasyonunu tamamla', route: '/doktor-tools/erecete', branslar: null },
  { circleColor: '#8B5CF6', icon: 'EP', title: 'Epikriz Üretici', desc: 'Hasta özetlerini otomatik oluştur ve profesyonel epikriz raporları hazırla', route: '/doktor-tools/epikriz', branslar: null },
  { circleColor: '#F59E0B', icon: 'IK', title: 'ICD-10 Kodlayıcı', desc: 'Türkçe tanı girişiyle anlık ICD-10 kodlama', route: '/doktor-tools/icd10', branslar: null },
  { circleColor: '#EF4444', icon: 'II', title: 'İlaç Etkileşimi', desc: 'Reçetedeki ilaç etkileşimlerini kontrol et ve uyarıları görüntüle', route: '/doktor-tools/ilac-interaksiyon', branslar: null },
  { circleColor: '#166534', icon: 'HR', title: 'Hasta Raporları', desc: 'SGK e-İstirahat / e-Rapor ve muayenehane belgesi oluştur', route: '/doktor-tools/sgk-rapor', branslar: null },
  { circleColor: '#EA580C', icon: 'TX', title: 'Tetkik İstek', desc: 'Lab ve görüntüleme istek formu oluştur', route: '/doktor-tools/tetkik', branslar: null },
  { circleColor: '#0284C7', icon: 'HP', title: 'Hasta Portalı', desc: 'Hastalara güvenli portal erişimi ver', route: '/doktor-tools/hasta-portali', branslar: null },
  { circleColor: '#DC2626', icon: 'SG', title: 'SGK Medula', desc: 'E-reçete ve provizyon sorgulama entegrasyonu', route: '/doktor-tools/sgk-medula', branslar: null },
  { circleColor: '#0F9B8E', icon: 'EN', title: 'e-Nabız Format', desc: 'FHIR/Medula/USS paketleri — canlı bağlantı yok, format-hazır çıktı', route: '/doktor-tools/enabiz', branslar: null },
]

/**
 * Chapter clinical tools only (kohort, specialty calculators, …).
 * Internal audit HTML / pre-sprint / post-sprint / wow-gap pages do NOT belong here —
 * keep those in docs/ or repo paths, never on /doktor-tools.
 */
export const BRANS_DOKTOR_ARACLARI: readonly DoktorArac[] = [
  { circleColor: '#E8C547', icon: 'HB', title: 'Hedef Boy', desc: 'Anne-baba boyuna göre çocuğun tahmini erişkin boyu — açıp aileyle kullanın', route: '/doktor-tools/hedef-boy', branslar: ['pediatri'] },
  // Pediatri — specialty-only (not kardiyoloji / dahiliye / göz / KD / dermatoloji / …). Chapter engines: specialties/pediatri/engines.
  { circleColor: '#14B8A6', icon: 'BP', title: 'Büyüme & Persentil', desc: 'Neyzi / WHO persentil ve z-skor, eğri, persentil kayması ve büyüme hızı (cm/yıl)', route: '/doktor-tools/pedi-buyume', branslar: ['pediatri'] },
  { circleColor: '#F97316', icon: 'DH', title: 'Doz Hesaplayıcı (mg/kg)', desc: 'Girdiğiniz mg/kg ve konsantrasyonla doz başına mg ve mL — günlük toplam ve tavan uyarısı', route: '/doktor-tools/pedi-doz', branslar: ['pediatri'] },
  { circleColor: '#22C55E', icon: 'AT', title: 'Aşı Takvimi & Telafi', desc: 'SB ulusal takvimi: yapıldı · zamanı geldi · gecikti, bugün yapılabilecekler ve seriyi baştan başlatmayan telafi planı · özel aşılar ayrı', route: '/doktor-tools/pedi-asi', branslar: ['pediatri'] },
  { circleColor: '#6366F1', icon: 'GT', title: 'Gelişim & Tarama Paneli', desc: 'Bu vizitte hangi tarama: işitme, görme, GİDR, M-CHAT-R/F, D vitamini ve demir — işaretle, muayene formuna ekle', route: '/doktor-tools/pedi-gelisim', branslar: ['pediatri'] },
  { circleColor: '#0891B2', icon: 'PK', title: 'Pediatri Kohort Paneli', desc: 'Aşısı geciken · izlemi kaçan · persentil kayması · D vit / demir · tarama gecikmesi · 1-tap veli hatırlatması', route: '/doktor-tools/pedi-kohort', branslar: ['pediatri'] },
  // Dahiliye (İç Hastalıkları) — specialty-only (not pediatri / kardiyoloji / göz / KD / dermatoloji). Chapter engines: specialties/dahiliye/engines.
  { circleColor: '#0891B2', icon: 'KH', title: 'Dahiliye Kohort Paneli', desc: 'HbA1c >9 · KB/LDL hedef dışı · eGFR <45 · gecikmiş görevler · 1-tap hatırlatma', route: '/doktor-tools/dahiliye-kohort', branslar: ['dahiliye'] },
  { circleColor: '#0D9488', icon: 'S2', title: 'SCORE2 / KVR', desc: 'ESC SCORE2 · Diabetes · OP · kova taslak — hekim kilidi olmadan kesinleşmez', route: '/doktor-tools/dahiliye-score2', branslar: ['dahiliye'] },
  { circleColor: '#2563EB', icon: 'CK', title: 'KDIGO CKD evreleme', desc: 'eGFR × UACR ısı haritası · kronisite · nefro sevk paketi', route: '/doktor-tools/dahiliye-ckd', branslar: ['dahiliye'] },
  { circleColor: '#16A34A', icon: 'SR', title: 'SGK ilaç raporu', desc: 'HT · DM · statin · DOAK · Vit D/B12 taslak · SUT kontrol listesi', route: '/doktor-tools/dahiliye-sgk', branslar: ['dahiliye'] },
  { circleColor: '#9333EA', icon: 'PF', title: 'Polifarmasi STOPP/START', desc: '≥65 yaş tarama · engelleyici öneriler · override gerekçesi', route: '/doktor-tools/dahiliye-polifarmasi', branslar: ['dahiliye'] },
  { circleColor: '#DC2626', icon: 'AK', title: 'CHA₂DS₂-VASc / HAS-BLED', desc: 'AF risk bileşenleri · HAS-BLED kontrol listesi (skor iddiası yok) · DOAK uygunluk', route: '/doktor-tools/dahiliye-antikoag', branslar: ['dahiliye'] },
  // Göz Hastalıkları — specialty-only (not dahiliye / pediatri / kardiyoloji / KD / dermatoloji). Chapter engines only.
  { circleColor: '#0D9488', icon: 'VA', title: 'VA / logMAR', desc: 'Ondalık · Snellen · PS/EH/IH → logMAR ve iki vizit arası ETDRS harf farkı, OD/OS', route: '/doktor-tools/goz-va', branslar: ['goz-hastaliklari'] },
  { circleColor: '#2563EB', icon: 'SV', title: 'SUT anti-VEGF kapı', desc: 'Ajan · göz · basamak · MI/SVO + enjeksiyon geçmişi → SUT 4.2.33 engel ve uyarıları', route: '/doktor-tools/goz-sut-vegf', branslar: ['goz-hastaliklari'] },
  { circleColor: '#16A34A', icon: 'SR', title: 'SGK rapor taslağı', desc: 'Anti-VEGF başlangıç / idame / implant ve GİL bilgi notu — zorunlu maddeler ve eksikler', route: '/doktor-tools/goz-sgk-rapor', branslar: ['goz-hastaliklari'] },
  { circleColor: '#9333EA', icon: 'GL', title: 'GİL EK-3/G kodları', desc: 'Göz içi lens kodlarını ara ve kopyala — bedel gösterilmez', route: '/doktor-tools/goz-gil-kod', branslar: ['goz-hastaliklari'] },
  { circleColor: '#0891B2', icon: 'GK', title: 'Göz kohort paneli', desc: 'Geciken GA/OCT · planlı IVT · DR tarama · kontrol zamanı · 1-tap hatırlatma', route: '/doktor-tools/goz-kohort', branslar: ['goz-hastaliklari'] },
  // Dermatoloji — specialty-only (not pediatri / dahiliye / kardiyoloji / göz / KD). Chapter engines only.
  { circleColor: '#DB2777', icon: 'PE', title: 'PASI / EASI hesap', desc: 'Bölge skoru · toplam ve şiddet bandı · SCORAD alanları', route: '/doktor-tools/derm-pasi', branslar: ['dermatoloji'] },
  { circleColor: '#BE185D', icon: 'GÖ', title: 'GÖP izotretinoin kapı', desc: 'β-hCG · kontrasepsiyon · siklus günü · reçete süresi', route: '/doktor-tools/derm-gop', branslar: ['dermatoloji'] },
  { circleColor: '#7C3AED', icon: 'FT', title: 'Fototerapi defteri', desc: 'Cihaz · J/cm² · kümülatif doz · MED · yanık bayrağı', route: '/doktor-tools/derm-fototerapi', branslar: ['dermatoloji'] },
  { circleColor: '#C026D3', icon: 'YT', title: 'Yama D2 / D4', desc: 'Uygulama → okuma takvimi · Avrupa baz serisi antijenleri', route: '/doktor-tools/derm-yama', branslar: ['dermatoloji'] },
  { circleColor: '#0891B2', icon: 'DK', title: 'Derm kohort paneli', desc: 'TBSE · yama okuma · fototerapi arası · β-hCG · lab · lezyon görevi', route: '/doktor-tools/derm-kohort', branslar: ['dermatoloji'] },
  // Kadın Hastalıkları ve Doğum — specialty-only (not pediatri / dahiliye / kardiyoloji / göz / dermatoloji). Chapter engines only.
  // Canonical key: portalBransAnahtari('kadin-dogum' | 'Kadın Hastalıkları ve Doğum') → 'kadin-hastaliklari-dogum'.
  { circleColor: '#DB2777', icon: 'GT', title: 'Gebelik takvimi', desc: 'SAT · USG · CRL → gebelik haftası, DÖBYR izlemleri ve tarama pencereleri: açık · kapanmak üzere · kaçırıldı', route: '/doktor-tools/kd-gebelik-takvim', branslar: ['kadin-hastaliklari-dogum'] },
  { circleColor: '#7C3AED', icon: 'AR', title: 'Doğum & analık raporu', desc: 'TDT → SGK analık istirahati tarihleri, erken / geç doğumda yeniden hesap ve istirahat raporu taslağı', route: '/doktor-tools/kd-dogum-rapor', branslar: ['kadin-hastaliklari-dogum'] },
  { circleColor: '#059669', icon: 'MC', title: 'Kontrasepsiyon MEC', desc: 'Hasta faktörleri → yöntem başına WHO MEC 1–4 ve gerekçe · acil kontrasepsiyon · doğum sonrası başlama', route: '/doktor-tools/kd-mec', branslar: ['kadin-hastaliklari-dogum'] },
  { circleColor: '#E11D48', icon: 'OR', title: 'Obstetrik risk & sezaryen notu', desc: 'Preeklampsi → aspirin penceresi · GDM riski · SSVD alanları · hekim kilitli sezaryen endikasyon notu', route: '/doktor-tools/kd-risk', branslar: ['kadin-hastaliklari-dogum'] },
  { circleColor: '#EA580C', icon: 'KK', title: `${KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI} kohort paneli`, desc: 'Lohusa 1. / 6. hafta · kapanan tarama pencereleri · geciken izlem · OGTT / anti-D / GBS · smear · 1-tap hatırlatma', route: '/doktor-tools/kd-kohort', branslar: ['kadin-hastaliklari-dogum'] },
]

export const TUM_DOKTOR_ARACLARI: readonly DoktorArac[] = [...ORTAK_DOKTOR_ARACLARI, ...BRANS_DOKTOR_ARACLARI]

export function doktorAracBransi(ham: string | null | undefined): SpecialtyKey | null {
  return portalBransAnahtari(ham)
}

/** True when this doctor may open a chapter-only araç route (deep-link guard). */
export function doktorAraciBransaUygun(
  route: string,
  doktorBransi: string | null | undefined,
): boolean {
  const arac = TUM_DOKTOR_ARACLARI.find((a) => a.route === route)
  if (!arac) return true // unknown shared subpages (hatirlatma, …) use their own gates
  if (!arac.branslar) return true
  const key = doktorAracBransi(doktorBransi)
  return !!key && arac.branslar.includes(key)
}

/** Filtered Araçlar grid for /doktor-tools. */
export function doktorAraclariListesi(doktorBransi: string | null | undefined): DoktorArac[] {
  const key = doktorAracBransi(doktorBransi)
  return TUM_DOKTOR_ARACLARI.filter((a) => {
    if (!a.branslar) return true
    return !!key && a.branslar.includes(key)
  })
}
