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
import { bransEtiketi } from '@/lib/doktor/bransAdlari'
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
  // ARACLAR-CILA-01 Faz 4 — her branşta her vizitin kapanış ritüeli ve hekime özel hızlı şablonlar.
  { circleColor: '#14B8A6', icon: 'MS', title: 'Muayene sonu paketi', desc: 'Vizitin kapanışı tek akışta: reçete · rapor · kontrol randevusu · portal özeti · SGK provizyon — her adım isteğe bağlı', route: '/doktor-tools/muayene-sonu', branslar: null },
  { circleColor: '#F59E0B', icon: 'SK', title: 'Sık kullandıklarım', desc: 'Kendi vizit şablonlarınız: alışılmış tanı · reçete taslağı · kontrol aralığı — tek dokunuşla ön doldurulur, tamamen düzenlenebilir', route: '/doktor-tools/sablonlarim', branslar: null },
  // KONSULTASYON-02 — yanıt bekleyen konsültasyon takibi; kohort paneli olsun olmasın her branşta aynı.
  { circleColor: '#0891B2', icon: 'BK', title: 'Bekleyen Konsültasyonlar', desc: 'Yanıtı gelmeyen konsültasyon istemleriniz tek listede: en uzun bekleyen üstte · yanıt ekle · hastaya hatırlat · yanıtsız kapat', route: '/doktor-tools/bekleyen-konsultasyonlar', branslar: null },
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
  // Psikiyatri (Ruh Sağlığı ve Hastalıkları) — specialty-only (not pediatri / dahiliye / göz / dermatoloji / KD).
  // Chapter engines: specialties/psikiyatri/engines. Ölçek bandı karar desteğidir; tanı ve doz hekimde.
  { circleColor: '#6366F1', icon: 'PG', title: 'PHQ-9 / GAD-7', desc: 'Madde madde doldur · toplam ve şiddet bandı (karar desteği, tanı değil) · 9. madde güvenlik uyarısı · vizitler arası değişim', route: '/doktor-tools/psik-phq-gad', branslar: ['psikiyatri'] },
  { circleColor: '#DC2626', icon: 'GR', title: 'Güvenlik & acil triyaj', desc: 'Özkıyım düşüncesi · kendine zarar · şiddet riski · akut psikoz bayrakları → 112 / acil yönlendirme ve hekim onaylı kriz planı', route: '/doktor-tools/psik-risk', branslar: ['psikiyatri'] },
  { circleColor: '#0891B2', icon: 'Lİ', title: 'Psikotrop izlem takvimi', desc: 'Lityum düzey · valproat KCFT/hemogram · atipik AP metabolik panel · SSRI sodyum — sınıf düzeyi görevler, doz yok', route: '/doktor-tools/psik-ilac-izlem', branslar: ['psikiyatri'] },
  { circleColor: '#16A34A', icon: 'PR', title: 'Psikotrop rapor & reçete', desc: 'İlaç raporu taslağı · SUT kontrol listesi · kırmızı / yeşil reçete uyarısı — T.C. kimlik ve doz yazılmaz', route: '/doktor-tools/psik-sgk', branslar: ['psikiyatri'] },
  { circleColor: '#9333EA', icon: 'PK', title: 'Psikiyatri kohort paneli', desc: 'PHQ-9 yüksek · açık güvenlik bayrağı · geciken kontrol · geciken lityum/valproat düzeyi · 1-tap hatırlatma', route: '/doktor-tools/psik-kohort', branslar: ['psikiyatri'] },
  // Kulak Burun Boğaz — specialty-only (not pediatri / dahiliye / göz / dermatoloji / KD / psikiyatri).
  // Chapter engines: specialties/kulak-burun-bogaz/engines. PTA bandı karar desteğidir; kayıp tipi, tanı ve doz hekimde.
  { circleColor: '#4F46E5', icon: 'OT', title: 'Otoskopi / kulak zarı notu', desc: 'Sağ-sol dış kulak ve TM görünümü işaretle → düzenli muayene notu · karar bekleyen bulgular · tanı yazılmaz', route: '/doktor-tools/kbb-otoskopi', branslar: ['kulak-burun-bogaz'] },
  { circleColor: '#0D9488', icon: 'OD', title: 'Odyometri özeti', desc: '0,5–4 kHz eşiklerden PTA ve şiddet bandı (karar desteği) · önceki ölçümle değişim · asimetri uyarısı · kayıp tipini hekim seçer', route: '/doktor-tools/kbb-odyometri', branslar: ['kulak-burun-bogaz'] },
  { circleColor: '#DC2626', icon: 'VT', title: 'Vertigo / Dix-Hallpike', desc: 'Pozisyonel test ve repozisyon manevrası notu · nistagmus özellikleri · santral şüphesi işaretinde manevra yerine acil', route: '/doktor-tools/kbb-vertigo', branslar: ['kulak-burun-bogaz'] },
  { circleColor: '#16A34A', icon: 'İR', title: 'SGK işitme raporu', desc: 'İşitme cihazı · odyolojik tetkik · iş gücü / öğrenci raporu taslağı ve SUT kontrol listesi — T.C. kimlik, cihaz markası ve bedel yazılmaz', route: '/doktor-tools/kbb-sgk', branslar: ['kulak-burun-bogaz'] },
  { circleColor: '#0891B2', icon: 'KK', title: 'KBB kohort paneli', desc: 'Geciken kontrol · yenilenmesi gereken işitme testi · açık kırmızı bayrak · bekleyen uyku tetkiki sevki · 1-tap hatırlatma', route: '/doktor-tools/kbb-kohort', branslar: ['kulak-burun-bogaz'] },
  // KARDIO-EXCEPTIONAL-01 — specialty-only (not pediatri / dahiliye / göz / KD / dermatoloji / KBB / göğüs).
  // Chapter engines: specialties/kardiyoloji/engines. SCORE2 bandı karar desteğidir; tanı ve doz hekimde.
  // Visibility: kardiyoloji only — NOT dahiliye, NOT kalp-damar-cerrahisi, NOT pediatri.
  { circleColor: '#DC2626', icon: 'S2', title: 'SCORE2 / KV risk', desc: 'ESC 2021 SCORE2 · 10 yıllık risk % ve bant (karar desteği, tanı değil) · Türkiye yüksek risk bölgesi · doz yok', route: '/doktor-tools/kardio-score2', branslar: ['kardiyoloji'] },
  { circleColor: '#EA580C', icon: 'HT', title: 'HT / KKY izlem', desc: 'Hipertansiyon ve kalp yetersizliği izlem özeti · NYHA hekim seçimi · sınıf düzeyi görev · EKG/belge köprüsü · doz yok', route: '/doktor-tools/kardio-ht-kky', branslar: ['kardiyoloji'] },
  { circleColor: '#16A34A', icon: 'KR', title: 'SGK kardiyo rapor', desc: 'HT · KKY · antikoagülan · koroner izlem taslağı ve SUT kontrol listesi — T.C. kimlik ve doz yazılmaz', route: '/doktor-tools/kardio-sgk', branslar: ['kardiyoloji'] },
  { circleColor: '#B91C1C', icon: 'KK', title: 'Kardiyoloji kohort paneli', desc: 'Geciken kontrol · lab/EKG · açık kırmızı bayrak · yüksek risk izlem gecikmesi · 1-tap hatırlatma', route: '/doktor-tools/kardio-kohort', branslar: ['kardiyoloji'] },
  // GOGUS-EXCEPTIONAL-01 — specialty-only (not dahiliye / gogus-cerrahisi / kardiyoloji / …).
  // Chapter engines: specialties/gogus-hastaliklari/engines. CAT/mMRC/GOLD grubu karar desteğidir; tanı ve doz hekimde.
  { circleColor: '#0284C7', icon: 'CM', title: 'CAT / mMRC skorları', desc: 'CAT 8 madde ve mMRC ile GOLD ABE grubu (karar desteği) · alevlenme öyküsü · tanı ve doz yazılmaz', route: '/doktor-tools/gogus-cat-mmrc', branslar: ['gogus-hastaliklari'] },
  { circleColor: '#0EA5E9', icon: 'AP', title: 'Astım-KOAH aksiyon planı', desc: 'Yeşil / sarı / kırmızı yazılı plan taslağı · inhaler sınıfı (doz yok) · hasta eğitimi metni', route: '/doktor-tools/gogus-aksiyon-plani', branslar: ['gogus-hastaliklari'] },
  { circleColor: '#38BDF8', icon: 'İN', title: 'İnhaler teknik & izlem', desc: 'ÖDİ / KTİ / soft mist teknik kontrol listesi · tekrar kontrol takvimi · miktar şeması yazılmaz', route: '/doktor-tools/gogus-inhaler', branslar: ['gogus-hastaliklari'] },
  { circleColor: '#16A34A', icon: 'SR', title: 'SGK solunum raporu', desc: 'USOT · nebulizatör · solunum değerlendirme taslağı ve SUT kontrol listesi — T.C. kimlik ve doz yazılmaz', route: '/doktor-tools/gogus-sgk', branslar: ['gogus-hastaliklari'] },
  { circleColor: '#0369A1', icon: 'GK', title: 'Göğüs kohort paneli', desc: 'Geciken kontrol · spirometri · açık kırmızı bayrak · inhaler teknik · 1-tap hatırlatma', route: '/doktor-tools/gogus-kohort', branslar: ['gogus-hastaliklari'] },
  // NOROLOJI-EXCEPTIONAL-01 — specialty-only (not pediatri / dahiliye / göz / KBB / psikiyatri / göğüs).
  // Chapter engines: specialties/noroloji/engines. MIDAS bandı karar desteğidir; tanı ve doz hekimde.
  { circleColor: '#DC2626', icon: 'İN', title: 'İnme / TIA kırmızı bayrak', desc: 'Yüz kayması · konuşma bozukluğu · güç kaybı · ani görme kaybı · thunderclap baş ağrısı → 112 / acil · hekim onaylı triyaj', route: '/doktor-tools/noro-inme', branslar: ['noroloji'] },
  { circleColor: '#7C3AED', icon: 'MG', title: 'Migren günlüğü / MIDAS', desc: 'Son 3 ay engellilik günleri · toplam ve bant (karar desteği, tanı değil) · eksik madde yorumlanmaz', route: '/doktor-tools/noro-migren', branslar: ['noroloji'] },
  { circleColor: '#0891B2', icon: 'AE', title: 'Nöroloji ilaç izlem (AED)', desc: 'Valproat · karbamazepin · fenitoin · lamotrijin · levetirasetam — sınıf düzeyi lab görevleri, doz yok', route: '/doktor-tools/noro-ilac-izlem', branslar: ['noroloji'] },
  { circleColor: '#9333EA', icon: 'NK', title: 'Nöroloji kohort paneli', desc: 'Geciken kontrol · geciken ilaç izlem · açık inme/TIA bayrağı · yüksek MIDAS · 1-tap hatırlatma', route: '/doktor-tools/noro-kohort', branslar: ['noroloji'] },
  // UROLOJI-EXCEPTIONAL-01 — specialty-only (not pediatri / dahiliye / kardiyoloji / KBB / göz).
  // Chapter engines: specialties/uroloji/engines. IPSS/PSA bantları karar desteğidir; tanı ve doz hekimde.
  { circleColor: '#0D9488', icon: 'IP', title: 'IPSS semptom skoru', desc: '7 madde 0–5 toplamı ve şiddet bandı (karar desteği, tanı değil) · QoL ayrı · BPH yazılmaz', route: '/doktor-tools/uro-ipss', branslar: ['uroloji'] },
  { circleColor: '#059669', icon: 'PS', title: 'PSA izlem', desc: 'PSA değeri ve hız (karar desteği) · kanser tanısı yazılmaz · yaş notu hekim karar desteği', route: '/doktor-tools/uro-psa', branslar: ['uroloji'] },
  { circleColor: '#DC2626', icon: 'UA', title: 'Hematuri / taş acil triyaj', desc: 'Makroskopik hematüri · retansiyon · flank+ateş · torsiyon · priapizm · üretra travması → 112 · hekim onaylı', route: '/doktor-tools/uro-acil', branslar: ['uroloji'] },
  { circleColor: '#10B981', icon: 'UK', title: 'Üroloji kohort paneli', desc: 'Geciken kontrol · PSA izlem · yüksek IPSS · açık kırmızı bayrak · 1-tap hatırlatma', route: '/doktor-tools/uro-kohort', branslar: ['uroloji'] },
  // ORTOPEDI-EXCEPTIONAL-01 — specialty-only (not pediatri / dahiliye / kardiyoloji / FTR / göz).
  // Chapter engines: specialties/ortopedi/engines. VAS/fonksiyon bandı karar desteğidir; tanı ve doz hekimde.
  // Visibility: ortopedi only — NOT fizik-tedavi, NOT spor-hekimligi, NOT pediatri.
  { circleColor: '#D97706', icon: 'KA', title: 'Kırık / alçı-ortez takip', desc: 'Bölge · NV · alçı alma / yük verme tarihleri · görüntü köprüsü · kaynama yazılmaz', route: '/doktor-tools/orto-kirik-alci', branslar: ['ortopedi'] },
  { circleColor: '#F59E0B', icon: 'VS', title: 'VAS / fonksiyon skoru', desc: 'VAS 0–10 + 4 fonksiyon maddesi · şiddet bandı (karar desteği, tanı değil) · artroz yazılmaz', route: '/doktor-tools/orto-vas', branslar: ['ortopedi'] },
  { circleColor: '#B45309', icon: 'OP', title: 'Op-sonrası protokol', desc: 'Dikiş · yük verme · görüntü kilometre taşları · OR scheduling / HIS yok', route: '/doktor-tools/orto-op-protokol', branslar: ['ortopedi'] },
  { circleColor: '#92400E', icon: 'OK', title: 'Ortopedi kohort paneli', desc: 'Geciken kontrol · alçı/yük izlemi · yüksek VAS · açık kırmızı bayrak · 1-tap hatırlatma', route: '/doktor-tools/orto-kohort', branslar: ['ortopedi'] },
  // FIZIK-TEDAVI-EXCEPTIONAL-01 — specialty-only (not ortopedi / noroloji / romatoloji / kardiyoloji / …).
  // Chapter engines: specialties/fizik-tedavi/engines. VAS/ODI bandı karar desteğidir; tanı ve ilaç dozu hekimde.
  // Visibility: fizik-tedavi only — NOT ortopedi, NOT noroloji, NOT romatoloji, NOT pediatri.
  { circleColor: '#16A34A', icon: 'SP', title: 'FTR seans planı', desc: 'Bölge · modalite · seans sayısı / haftalık sıklık · SGK notu hekim doğrular · ilaç/doz yok', route: '/doktor-tools/ftr-seans', branslar: ['fizik-tedavi'] },
  { circleColor: '#22C55E', icon: 'VO', title: 'VAS / ODI ölçek', desc: 'VAS 0–10 ve ODI 10 madde yüzde bandı (karar desteği, tanı değil) · eksik madde yorumlanmaz', route: '/doktor-tools/ftr-vas-odi', branslar: ['fizik-tedavi'] },
  { circleColor: '#15803D', icon: 'EG', title: 'Ev egzersiz reçetesi', desc: 'Genel egzersiz adı · set/tekrar (ilaç dozu değil) · ağrı artınca dur · 112 notu', route: '/doktor-tools/ftr-egzersiz', branslar: ['fizik-tedavi'] },
  { circleColor: '#166534', icon: 'FK', title: 'FTR kohort paneli', desc: 'Geciken kontrol · seans/egzersiz · açık kırmızı bayrak · yüksek VAS/ODI · 1-tap hatırlatma', route: '/doktor-tools/ftr-kohort', branslar: ['fizik-tedavi'] },
  // AILE-HEKIMLIGI-EXCEPTIONAL-01 — specialty-only (not dahiliye / pediatri / kardiyoloji / göz / KD).
  // Chapter engines: specialties/aile-hekimligi/engines. Paket vadeleri karar desteğidir; tanı ve doz hekimde.
  // Visibility: aile-hekimligi only — NOT dahiliye, NOT pediatri, NOT endokrinoloji.
  { circleColor: '#15803D', icon: 'AŞ', title: 'Aşı / tarama paketi', desc: 'Ulusal aşı takvimi · grip/pnömokok/HPV · kolon/meme/serviks tarama vadeleri — doz ve lot yok', route: '/doktor-tools/aile-asi-tarama', branslar: ['aile-hekimligi'] },
  { circleColor: '#16A34A', icon: 'KR', title: 'Kronik paket (DM / HT)', desc: 'Diyabet · hipertansiyon · lipid · solunum izlem vadeleri · sınıf düzeyi görev — doz ve hedef sayı yok', route: '/doktor-tools/aile-kronik', branslar: ['aile-hekimligi'] },
  { circleColor: '#DC2626', icon: 'SV', title: 'Sevk / acil triyaj', desc: 'Göğüs ağrısı · ani nefes darlığı · bilinç · kanama · inme bayrağı · anafilaksi → 112 · hekim onaylı', route: '/doktor-tools/aile-sevk', branslar: ['aile-hekimligi'] },
  { circleColor: '#059669', icon: 'AK', title: 'Aile hekimliği kohort', desc: 'Geciken kontrol · aşı/tarama · kronik izlem · açık sevk/acil bayrağı · 1-tap hatırlatma', route: '/doktor-tools/aile-kohort', branslar: ['aile-hekimligi'] },
  // SPOR-HEKIMLIGI-EXCEPTIONAL-01 — specialty-only (not ortopedi / fizik-tedavi / dahiliye / pediatri).
  // Chapter engines: specialties/spor-hekimligi/engines. RTP/sakatlık bantları karar desteğidir; tanı ve doz hekimde.
  // Visibility: spor-hekimligi only — NOT ortopedi, NOT fizik-tedavi, NOT pediatri.
  { circleColor: '#CA8A04', icon: 'RT', title: 'RTP (return-to-play) basamak', desc: '0–5 basamak karar desteği · kontrol takvimi · spora dönüş ve tanı yazılmaz', route: '/doktor-tools/spor-rtp', branslar: ['spor-hekimligi'] },
  { circleColor: '#A16207', icon: 'SG', title: 'Sakatlık günlüğü', desc: 'Bölge · mekanizma · şiddet bandı (karar desteği) · isteğe bağlı yüklenme uyarısı · tanı/doz yok', route: '/doktor-tools/spor-sakatlik', branslar: ['spor-hekimligi'] },
  { circleColor: '#854D0E', icon: 'SK', title: 'Spor kohort paneli', desc: 'Geciken kontrol · RTP · aktif sakatlık · yüklenme uyarısı · açık kırmızı bayrak · 1-tap hatırlatma', route: '/doktor-tools/spor-kohort', branslar: ['spor-hekimligi'] },
  // ENDOKRINOLOJI-EXCEPTIONAL-01 — specialty-only (not dahiliye / pediatri / kardiyoloji / göz).
  // Chapter engines: specialties/endokrinoloji/engines. HbA1c/TSH/DXA karar desteği; tanı ve doz hekimde.
  // Visibility: endokrinoloji only — NOT dahiliye (DM tools stay dahiliye), NOT pediatri, NOT kardiyoloji.
  { circleColor: '#A855F7', icon: 'Hb', title: 'HbA1c / tiroid izlem döngüsü', desc: 'HbA1c · TSH · FT4 değeri → önerilen izlem aralığı (karar desteği) · tanı ve doz yok · CGM yok', route: '/doktor-tools/endo-lab-izlem', branslar: ['endokrinoloji'] },
  { circleColor: '#9333EA', icon: 'DX', title: 'Osteoporoz / DXA hatırlatma', desc: 'Son DXA tarihi · risk bandı → tekrar aralığı · T-skor / tanı / ilaç dozu yazılmaz', route: '/doktor-tools/endo-dxa', branslar: ['endokrinoloji'] },
  { circleColor: '#7E22CE', icon: 'RJ', title: 'İnsülin / tiroid rejim kartı', desc: 'Yalnız başlangıç ve kontrol tarihleri · doz birimi yazılmaz', route: '/doktor-tools/endo-rejim', branslar: ['endokrinoloji'] },
  { circleColor: '#6B21A8', icon: 'EK', title: 'Endokrinoloji kohort paneli', desc: 'Geciken kontrol · lab/DXA · açık acil bayrak · yüksek HbA1c bandı · 1-tap hatırlatma', route: '/doktor-tools/endo-kohort', branslar: ['endokrinoloji'] },
]

/**
 * ARACLAR-GRUPLAMA-01 (Kaan, 2026-09-19): Araçlar sayfası tek düz ızgaraydı — 12 evrensel
 * omurga aracı ile branşa özel araçlar görsel olarak eşitti, hiyerarşi yoktu. Hekim her gün
 * kullandığı e-Reçete / Epikriz ile branş aracını aynı yığında arıyordu.
 *
 * Kural: ÇEKİRDEK (evrensel, branslar === null) üstte; branşa özel araçlar küçük bir ayrımla
 * altta. Bu YALNIZ sunum sırasıdır — görünürlük kapısı değildir; hangi aracı kimin gördüğü
 * doktorAraclariListesi / doktorAraciBransaUygun tarafından belirlenir ve bu fonksiyon onu
 * değiştirmez (bkz. .cursor/skills/specialty-doktor-araclari/SKILL.md).
 */
export type AracGrubu = { anahtar: 'cekirdek' | 'brans'; baslik: string; aciklama: string; araclar: DoktorArac[] }

export function doktorAraclariGruplu(hamBrans: string | null | undefined): AracGrubu[] {
  const hepsi = doktorAraclariListesi(hamBrans)
  const cekirdek = hepsi.filter((a) => a.branslar === null)
  const bransa = hepsi.filter((a) => a.branslar !== null)
  const gruplar: AracGrubu[] = []
  if (cekirdek.length) {
    gruplar.push({
      anahtar: 'cekirdek',
      baslik: 'Çekirdek Araçlar',
      aciklama: 'Her branşta kullanılan ortak araçlar',
      araclar: cekirdek,
    })
  }
  if (bransa.length) {
    gruplar.push({
      anahtar: 'brans',
      baslik: `${bransEtiketi(hamBrans, { kisa: true })} Araçları`,
      aciklama: 'Yalnız sizin branşınıza özel araçlar',
      araclar: bransa,
    })
  }
  return gruplar
}

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
