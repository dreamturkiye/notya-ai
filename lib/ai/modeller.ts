/**
 * NOTYA-MALIYET-01 — model politikası: hangi iş hangi Claude modeline gider, TEK kaynak.
 *
 * KURAL: app/, lib/, core/ altında hiçbir yere model adı STRING olarak yazılmaz. Model her zaman bu modülden
 * alınır — modelSec(gorev) ya da gucluModel()/hizliModel(). lib/ai/model-sizmasi.test.ts bunu bekler: model adı
 * deseni bu dosya dışında görünürse test kırılır. Model adı değişince kod değişmez; Vercel'de
 * NOTYA_MODEL_GUCLU / NOTYA_MODEL_HIZLI ortam değişkeni ayarlanır.
 *
 * ÖNCELİK (Kaan, 2026-09-19 — bağlayıcı): KLİNİK KALİTE > MALİYET. "Röntgenlerde ve diğer incelemelerde de Sonnet'i
 * kullan. Kesinlikle application'ın kalitesinin düşmesini istemiyorum." Tasarruf yalnız klinik OLMAYAN işlerden
 * ve kaliteye dokunmayan tekniklerden (prompt caching, modele giden geçmişin kırpılması) gelir.
 *
 * İki kademe:
 *  - GÜÇLÜ (Sonnet 4.6) — VARSAYILAN. Hekimin/avukatın/müşavirin karar verdiği her çıktı: SOAP/muayene notu,
 *    mesleki notlar, klinik konsültasyon, doz önerisi, ICD-10 eşleme, e-reçete, epikriz, lab yorumu, HER TÜRLÜ
 *    görüntü/belge incelemesi, dilekçe/sözleşme analizi, mali analiz, klinik ya da belirsiz sohbet turu.
 *  - HIZLI (Haiku 4.5) — YALNIZ şu DAR liste (klinik içerik üretmeyen işler): yardım/destek sohbeti, meslektaş
 *    hafızası özetleme ve tercih çıkarımı, saf sınıflandırma/etiketleme (görselsiz), biçimlendirme/metin temizleme,
 *    asistan sohbetinin NET sosyal turları (selam, teşekkür, vedalaşma) ve uygulama kullanımı soruları.
 *    Bu listeye yeni iş eklemek ürün kararıdır; docs/OPEN-COMMITMENTS.md'de gerekçesiyle yazılmadan eklenmez.
 *
 * Kod seviyesinde güvence: mesajda görüntü/PDF bloğu varsa lib/ai/cagir.ts görev ne olursa olsun GÜÇLÜ'ye yükseltir.
 */

/** Varsayılan GÜÇLÜ kademe — Claude Sonnet 4.6. */
export const MODEL_GUCLU = 'claude-sonnet-4-6'
/** Varsayılan HIZLI kademe — Claude Haiku 4.5. */
export const MODEL_HIZLI = 'claude-haiku-4-5-20251001'

/** Ortam değişkeni boş/geçersizse varsayılan kalır — yanlış ayar üretimi düşürmesin. */
function ortamModeli(ad: string, varsayilan: string): string {
  const deger = (typeof process !== 'undefined' ? process.env?.[ad] : undefined)?.trim()
  return deger && /^[a-z0-9][a-z0-9.\-@:]*$/i.test(deger) ? deger : varsayilan
}

/** Etkin GÜÇLÜ model: NOTYA_MODEL_GUCLU ayarlıysa o, değilse MODEL_GUCLU. Çağrı anında okunur. */
export const gucluModel = (): string => ortamModeli('NOTYA_MODEL_GUCLU', MODEL_GUCLU)
/** Etkin HIZLI model: NOTYA_MODEL_HIZLI ayarlıysa o, değilse MODEL_HIZLI. Çağrı anında okunur. */
export const hizliModel = (): string => ortamModeli('NOTYA_MODEL_HIZLI', MODEL_HIZLI)

export type Kademe = 'guclu' | 'hizli'

export type Gorev =
  /** Muayene/SOAP notu üretimi — uzun yapılandırılmış JSON */
  | 'soap'
  /** Mesleki not üretimi (mali müşavir, hukuk, terapi, sağlık meslekleri seans notu) */
  | 'not-uretimi'
  /** Klinik konsültasyon, not üzerinde danışma, doz önerisi, ICD-10 eşleme, e-reçete taslağı, lab yorumu, epikriz,
   *  konsültasyon yanıt raporundan klinik özet (KONSULTASYON-01) */
  | 'klinik-analiz'
  /**
   * GÖRÜNTÜ VE İNCELEME — İSTİSNASIZ GÜÇLÜ (Kaan, 2026-09-19). Kapsam:
   *  - Röntgen, OCT, fundus, ön segment, dermatoskopi, USG, MR, BT, mamografi, EKG ve her türlü görüntü yorumu /
   *    karar desteği (core/belgeler/yazar.ts → Tier A taslak; belge_analizleri boru hattı; göz ve dermatoloji ekleri)
   *  - Lab raporu PDF/görsel çıkarımı (core/lab/cikarim.ts) — sonrasındaki klinik yorum 'klinik-analiz'
   *  - Belge (PDF/görsel) okuyup alan çıkaran her çağrı (lib/ingestion/pipeline.ts analiz + ikinci geçiş)
   *  - HERHANGİ bir vision/multimodal çağrı: görev tipi ne olursa olsun cagir.ts GÜÇLÜ'ye yükseltir.
   * Bu satır HIZLI'ya çekilemez — lib/ai/modeller.test.ts kilitler.
   */
  | 'goruntu-inceleme'
  /** Hukuk analizi: dilekçe, sözleşme, müvekkil portalı */
  | 'uzman-analiz'
  /** Uzman kararı gerektiren sohbet turu: klinik sinyalli asistan turu (asistanModelYonlendir yükseltir),
   *  mali müşavir ve avukat sohbeti (mevzuat/hukuk tavsiyesi — alan yönlendiricisi yok, GÜÇLÜ kalır) */
  | 'sohbet-uzman'
  /** YALNIZ net sosyal asistan turu ya da uygulama kullanımı sorusu (asistanModelYonlendir istisnası) */
  | 'sohbet'
  /** Tek etiketli sınıflandırma — görselsiz (görsel varsa cagir.ts GÜÇLÜ'ye yükseltir) */
  | 'siniflandirma'
  /** Meslektaş hafızası özeti / profil paragrafı (hasta klinik verisi yorumlamaz) */
  | 'ozet'
  /** Biçimlendirme, düz metni şablona dökme */
  | 'bicimlendirme'
  /** Doktorun kendi tercihlerini çıkarma (hafıza kaydı, stil profili damıtma) — hasta klinik verisi yorumlamaz */
  | 'cikarim'
  /** Yardım/destek ve uygulama rehberi kısa yanıtı */
  | 'kisa-yanit'

export interface ModelSecimi {
  gorev: Gorev
  kademe: Kademe
  model: string
  /** Önerilen üst sınır; çağıran yalnız gerekçeli olarak (ör. uzun belge çıkarımı) aşar. */
  maxTokens: number
}

/** Görev → kademe + önerilen max_tokens. Sayılar mevcut çağrı yerlerinin gerçek ihtiyacından geldi.
 * max_tokens bir TAVAN'dır, fatura üretilen token'a göredir — düşürmek tasarruf getirmez, yalnız kesilme (F3) riski
 * getirir. Bu yüzden hiçbir çağrı yerinin mevcut tavanı düşürülmedi. */
export const GOREV_POLITIKASI: Record<Gorev, { kademe: Kademe; maxTokens: number }> = {
  soap: { kademe: 'guclu', maxTokens: 8000 },
  'not-uretimi': { kademe: 'guclu', maxTokens: 4000 },
  'klinik-analiz': { kademe: 'guclu', maxTokens: 2000 },
  'goruntu-inceleme': { kademe: 'guclu', maxTokens: 3000 },
  'uzman-analiz': { kademe: 'guclu', maxTokens: 2000 },
  // F3 (KD-DERM-SAFETY-FINDINGS): 800 uzun klinik cevabı JSON ortasında kesiyordu — klinik tur bu yüzden 1600.
  'sohbet-uzman': { kademe: 'guclu', maxTokens: 1600 },
  sohbet: { kademe: 'hizli', maxTokens: 800 },
  siniflandirma: { kademe: 'hizli', maxTokens: 20 },
  ozet: { kademe: 'hizli', maxTokens: 300 },
  bicimlendirme: { kademe: 'hizli', maxTokens: 1000 },
  cikarim: { kademe: 'hizli', maxTokens: 500 },
  'kisa-yanit': { kademe: 'hizli', maxTokens: 300 },
}

export function modelSec(gorev: Gorev): ModelSecimi {
  const p = GOREV_POLITIKASI[gorev]
  if (!p) throw new Error(`Bilinmeyen AI görevi: ${String(gorev)}`)
  return { gorev, kademe: p.kademe, model: p.kademe === 'guclu' ? gucluModel() : hizliModel(), maxTokens: p.maxTokens }
}

/** Asistan sohbetinde modele giden geçmiş (4 tur). Uzun sohbette maliyet her turda tüm geçmişle büyüyordu (20 mesaj). */
export const SOHBET_GECMIS_MESAJ = 8
/** asistan_sessions.messages'ta saklanan geçmiş — ekrana ve doz-kaynak kontrolüne gider, modele değil. */
export const SOHBET_SAKLANAN_MESAJ = 20

/** Son `n` mesajı alır; API ilk mesajın 'user' olmasını ister — baştaki asistan mesajları atılır. */
export function gecmisiKirp<T extends { role: string }>(mesajlar: T[], n: number = SOHBET_GECMIS_MESAJ): T[] {
  const son = mesajlar.slice(-n)
  const ilkKullanici = son.findIndex((m) => m.role === 'user')
  return ilkKullanici === -1 ? [] : son.slice(ilkKullanici)
}

// ─── Asistan sohbeti yönlendirme kuralı ────────────────────────────────────────────────────────
// Kaan, 2026-09-19: ŞÜPHEDE KALIRSAN GÜÇLÜ. Varsayılan dal GÜÇLÜ'dür; HIZLI yalnız dar bir istisna listesiyle seçilir.

export interface YonlendirmeGirdisi {
  mesaj: string
  /** Seçili hasta ya da mesajdan çözülen hasta dosyası (veya çoklu eşleşme uyarısı) prompta girdi mi */
  hastaBaglami: boolean
  /** intentParser.quickClassify sonucu (null = sınıflanmadı) */
  niyet?: string | null
}

export interface YonlendirmeSonucu { gorev: 'sohbet' | 'sohbet-uzman'; neden: string }

// Klinik sinyal — HIZLI istisnalarını ezer. Soldan kelime sınırı; Türkçe ekler serbest ("dozu", "ilaçları").
// Liste genişletmek yalnız GÜÇLÜ yönüne iter (güvenli taraf); daraltmak kalite kararıdır.
const KLINIK_KOK = /(?<![\p{L}])(hasta|doz|ilaç|ilac|reçete|recete|tanı|tani\b|teşhis|ayırıcı|tedavi|antibiyotik|etkileş|interaksiyon|endikasyon|kontrendik|yan etki|alerji|kılavuz|kilavuz|protokol|prognoz|semptom|belirti|şikayet|yakınma|bulgu|muayene|tahlil|tetkik|laboratuvar|hemogram|biyokimya|kültür|görüntü|röntgen|rontgen|grafi|tomografi|ultrason|ultrasonografi|mamografi|dermatoskop|fundus|ön segment|anjiyo|ekokardiyo|lezyon|kitle|nodül|patoloji|biyopsi|ameliyat|cerrahi|sevk|konsült|epikriz|rapor|skor|risk|gebe|gebelik|hamile|emzir|aşı|ateş|ağrı|öksürük|kusma|ishal|nefes|tansiyon|nabız|satürasyon|kreatinin|glukoz|hba1c|troponin|insülin|steroid|kortizon|parasetamol|ibuprofen|amoksisilin|mg\/kg)/iu
// Kısa kısaltmalar: iki yandan sınır.
const KLINIK_KISALTMA = /(?<![\p{L}])(mg|mcg|ml|iu|ekg|eeg|emg|eko|usg|mr|mri|bt|pet|oct|crp|ldl|tsh|inr|spo2|icd|lab)(?![\p{L}])/iu
/** Eylem gerektiren niyetler (hasta oluştur, reçete, tanı, belge) — modelin JSON eylemi doğru kurması gerekir. */
const EYLEM_NIYETLERI = new Set(['CREATE_PATIENT', 'ADD_COMPLAINT', 'REQUEST_DIAGNOSIS', 'ADD_PRESCRIPTION', 'GENERATE_DOCUMENT'])

// HIZLI istisnası 1 — NET sosyal tur: mesajın TAMAMI selam/teşekkür/hal-hatır/vedalaşma kelimelerinden oluşur.
// "evet / tamam / olur / peki" BİLEREK yok: asistanın klinik önerisine onay olabilir ("ayırıcı tanıya ekleyeyim mi?" →
// "evet") ve modelin eylemi doğru kurması gerekir — belirsiz, dolayısıyla GÜÇLÜ.
const SOSYAL_CEKIRDEK = new Set([
  'merhaba', 'merhabalar', 'selam', 'selamlar', 'günaydın', 'akşamlar', 'geceler', 'günler', 'çalışmalar',
  'nasılsın', 'nasılsınız', 'naber', 'napıyorsun', 'iyiyim', 'teşekkür', 'teşekkürler', 'sağol', 'sağolun',
  'eyvallah', 'gelsin', 'görüşürüz', 'hoşça', 'bye',
])
// Tek başına sosyal sayılmayan dolgu kelimeleri ("iyi" tek başına klinik soruya cevap olabilir → GÜÇLÜ).
const SOSYAL_DOLGU = new Set(['iyi', 'sen', 'siz', 'ben', 'de', 'da', 'çok', 'sana', 'size', 'ederim', 'ediyorum', 'rica', 'kolay', 'kal', 'kalın', 'hocam', 'hanım', 'bey'])
const SOSYAL_AZAMI_KELIME = 8
// HIZLI istisnası 2 — uygulama kullanımı sorusu: açık bir uygulama/ekran/hesap terimi, kısa, klinik sinyalsiz, hastasız.
// Belirsiz kelimeler BİLEREK yok ("dil" = organ, "bildirim" = bildirimi zorunlu hastalık, "hesapla" = doz hesabı).
const UYGULAMA_TERIMI = /(?<![\p{L}])(uygulama|notya|ekran|menü|menu|buton|düğme|sekme|ayarlar|şifre|parola|abonelik|fatura|ödeme|kota|tema|karanlık mod|hesabım|hesabımı|giriş yap|çıkış yap|oturum aç|mikrofon|kulaklık|bluetooth)/iu
const UYGULAMA_AZAMI_KELIME = 25

function kelimeler(kucuk: string): string[] {
  return kucuk.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
}

/** Mesaj yalnız sosyal kelimelerden mi oluşuyor (selam, teşekkür, hal-hatır, vedalaşma)? */
export function netSosyalMi(mesaj: string): boolean {
  const k = kelimeler(String(mesaj || '').trim().toLocaleLowerCase('tr-TR').replace(/sağ ol/gu, 'sağol'))
  return k.length > 0 && k.length <= SOSYAL_AZAMI_KELIME && k.some((w) => SOSYAL_CEKIRDEK.has(w)) && k.every((w) => SOSYAL_CEKIRDEK.has(w) || SOSYAL_DOLGU.has(w))
}

/**
 * Asistan sohbeti hangi kademeye gider — saf fonksiyon (lib/ai/modeller.test.ts).
 * VARSAYILAN GÜÇLÜ. Sıra:
 *  1. hasta bağlamı (seçili hasta / çözülen dosya) → GÜÇLÜ, istisnasız ("teşekkürler" bile)
 *  2. eylem niyeti (hasta oluştur, reçete, tanı, belge) → GÜÇLÜ
 *  3. klinik kök / kısaltma (ilaç, tanı, tetkik, görüntü, lab, doz, risk skoru …) → GÜÇLÜ
 *  4. DAR İSTİSNA → HIZLI: net sosyal tur ya da uygulama kullanımı sorusu
 *  5. geri kalan her şey (belirsiz, sınıflanamayan) → GÜÇLÜ
 */
export function asistanModelYonlendir(g: YonlendirmeGirdisi): YonlendirmeSonucu {
  const kucuk = String(g.mesaj || '').trim().toLocaleLowerCase('tr-TR')

  if (g.hastaBaglami) return { gorev: 'sohbet-uzman', neden: 'hasta bağlamı' }
  if (g.niyet && EYLEM_NIYETLERI.has(g.niyet)) return { gorev: 'sohbet-uzman', neden: `eylem niyeti: ${g.niyet}` }
  if (KLINIK_KOK.test(kucuk) || KLINIK_KISALTMA.test(kucuk)) return { gorev: 'sohbet-uzman', neden: 'klinik sinyal' }

  if (netSosyalMi(kucuk)) return { gorev: 'sohbet', neden: 'istisna: net sosyal tur' }
  if (UYGULAMA_TERIMI.test(kucuk) && kelimeler(kucuk).length <= UYGULAMA_AZAMI_KELIME) {
    return { gorev: 'sohbet', neden: 'istisna: uygulama kullanımı sorusu' }
  }

  return { gorev: 'sohbet-uzman', neden: 'varsayılan (şüphede GÜÇLÜ)' }
}
