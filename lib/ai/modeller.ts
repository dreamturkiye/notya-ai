/**
 * NOTYA-MALIYET-01 + NOTYA-MODEL-LUNA-01 — model politikası: hangi iş hangi modele gider, TEK kaynak.
 *
 * KURAL: app/, lib/, core/ altında hiçbir yere model adı STRING olarak yazılmaz. Model her zaman bu modülden
 * alınır — modelSec(gorev) ya da gucluModel()/hizliModel(). lib/ai/model-sizmasi.test.ts bunu bekler: model adı
 * deseni (claude-…, gpt-…, openai/…, anthropic/…) bu dosya ve lib/ai/saglayici.ts dışında görünürse test kırılır.
 * Model adı değişince kod değişmez; Vercel'de NOTYA_MODEL_GUCLU / NOTYA_MODEL_HIZLI ortam değişkeni ayarlanır.
 *
 * NOTYA-MODEL-LUNAPRO-01 kapıları durur (Kaan, 2026-09-27). Birincil slug Kaan 2026-09-29 ile GPT-6 Luna
 * (MODEL_HIZLI / NOTYA_MODEL_HIZLI = openai/gpt-6-luna) — SOAP, klinik analiz, görüntü/PDF, sohbet. Luna-Pro
 * reasoning.mode=pro idi; gecikme için düzenli Luna. Koruyucu Sonnet 5 (MODEL_GUCLU) yalnız dört kapıdan:
 *  G1 transport — birincil cevap veremedi (5xx, zaman aşımı, boş gövde, ağ, 429): birincil → 400 ms → birincil → Sonnet 5.
 *  G2 low_conf  — istek başına EN FAZLA BİR kez: boş, ret, düşük güven; yapılandırılmış işte ayrıştırılamayan (F3 onarımı
 *                 da kurtaramayan) JSON ya da max_tokens kesilmesi; bilinmeyen araç adı / bozuk araç argümanı; SOAP
 *                 gövdesinde ai_confidence < 0.6 (lib/doktor/soapUret.ts). Sesli akışta yalnız ilk sözden ÖNCE.
 *  G3 safety    — mesajda ya da hasta dosyası bağlamında güvenlik sinyali (guvenlikSinyaliVar): çağrıdan ÖNCE Sonnet 5.
 *  G4 devre     — birincil 5 dakikada ≥5 G1/G2 hatası verdiyse 10 dakika bütün çağrılar Sonnet 5; sonra tek yoklama.
 * Görev (uzman), Onayla (onayla) ve görsel (vision) zorunlu yükseltmeleri yok; LUNA-01'in 3 numaralı pazarlık dışı kuralı
 * (GÖRSEL = GÜÇLÜ) ve karar A emekli. İki model de OpenRouter'dan geçer (ödeme tek yerden, data_collection=deny);
 * OPENROUTER_API_KEY yoksa (yerel/test) Anthropic modelleri eski doğrudan SDK yoluyla gider, OpenAI modeli gidemez →
 * Sonnet 5 (transport) (lib/ai/saglayici.ts). Ölçüt: koruyucu payı (v_model_yedek_gunluk, migration 106) — hedef < %15.
 *
 * Kademe artık "birincil mi koruyucu mu" demektir: tabloda her görev 'hizli' (birincil). 'guclu' kademe tip, ölçüm
 * satırı ve geri dönüş anahtarı için durur; bir çağrı Sonnet 5'e yalnız yukarıdaki dört kapıdan ulaşır.
 * asistanModelYonlendir() hâlâ sohbet ↔ sohbet-uzman ayırır — o ayrım prompt ve maxTokens içindir, model için değil.
 *
 * Geri dönüş anahtarı (kod değişmez, tek yeniden dağıtım):
 *  - NOTYA_MODEL_HIZLI=anthropic/claude-sonnet-5 → birincil model Sonnet 5 olur (tüm görevler).
 *  - NOTYA_MODEL_GUCLU=… → koruyucu değişir. Geçersiz değer → varsayılan.
 */

/*
 * NOTYA-KADEME-01 (Kaan, 2026-09-30 — docs/ARCH-MODEL-TIERING.md): three tiers on the Luna family, chosen per task.
 *  luna-none  = HIZLI model + reasoning.effort "none" (TTFT ≈ 1 s): social turns, single-slot chart follow-ups,
 *               background light tasks (cikarim, ozet, siniflandirma, bicimlendirme, kisa-yanit). Never where JSON is
 *               parsed, never with tools. Falls back to luna once (neden = tier_up) on empty / < 3 words / refusal / bad JSON.
 *  luna       = HIZLI model, provider default effort: the remaining sohbet-uzman turns, every tool-call turn,
 *               quick klinik-analiz (doz, lab yorum), not-uretimi.
 *  luna-pro   = DERİN model (NOTYA_MODEL_DERIN, default openai/gpt-6-luna-pro): soap body + öneri, goruntu-inceleme,
 *               uzman-analiz, epikriz / konsült / e-reçete / SGK JSON (call site passes kademe: 'derin'), and any
 *               background call whose text input exceeds 20k tokens. Background only — never the live chat/voice turn.
 *  Kill-switch NOTYA_TIER_KAPALI=1 → everything back to the single luna tier (no reasoning field, no derin model).
 *  Sonnet 5 stays the koruyucu behind G1/G2/G4 exactly as before; the tiers sit in front of those gates.
 */

/** Varsayılan koruyucu (GÜÇLÜ kademe, yalnız G1–G4) — Claude Sonnet 5 (OpenRouter slug'ı; doğrudan yolda saglayici.ts önekini atar). */
export const MODEL_GUCLU = 'anthropic/claude-sonnet-5'
/** Varsayılan birincil (HIZLI kademe, her görev) — GPT-6 Luna (yalnız OpenRouter; görsel + dosya girdisi destekler). */
export const MODEL_HIZLI = 'openai/gpt-6-luna'
/** Varsayılan DERİN model (luna-pro kademesi, yalnız arka plan ağır işler) — GPT-6 Luna-Pro (yalnız OpenRouter). */
export const MODEL_DERIN = 'openai/gpt-6-luna-pro'

/** Ortam değişkeni boş/geçersizse varsayılan kalır — yanlış ayar üretimi düşürmesin. */
function ortamModeli(ad: string, varsayilan: string): string {
  const deger = (typeof process !== 'undefined' ? process.env?.[ad] : undefined)?.trim()
  return deger && /^[a-z0-9][a-z0-9.\-@:/]*$/i.test(deger) ? deger : varsayilan
}

/** Etkin GÜÇLÜ model: NOTYA_MODEL_GUCLU ayarlıysa o, değilse MODEL_GUCLU. Çağrı anında okunur. */
export const gucluModel = (): string => ortamModeli('NOTYA_MODEL_GUCLU', MODEL_GUCLU)
/** Etkin HIZLI model: NOTYA_MODEL_HIZLI ayarlıysa o, değilse MODEL_HIZLI. Çağrı anında okunur. */
export const hizliModel = (): string => ortamModeli('NOTYA_MODEL_HIZLI', MODEL_HIZLI)
/** Etkin DERİN model: NOTYA_MODEL_DERIN ayarlıysa o, değilse MODEL_DERIN. Çağrı anında okunur. */
export const derinModel = (): string => ortamModeli('NOTYA_MODEL_DERIN', MODEL_DERIN)

/** NOTYA-KADEME-01 kill-switch: NOTYA_TIER_KAPALI=1 → tek kademe (bugünkü luna), reasoning alanı gönderilmez. */
export const kademeKapali = (): boolean => (typeof process !== 'undefined' ? process.env?.NOTYA_TIER_KAPALI : undefined)?.trim() === '1'

/** guclu = koruyucu Sonnet 5 (G1–G4) · hizli = luna (birincil) · derin = luna-pro (arka plan ağır işler). */
export type Kademe = 'guclu' | 'hizli' | 'derin'
/** OpenRouter `reasoning.effort` — yalnız openai/* modellerde gönderilir (saglayici.openRouterGovdesi). */
export type Caba = 'none' | 'low' | 'medium'
/** Günlük satırındaki kademe adı ([ai] kademe=…). */
export type KademeAdi = 'luna-none' | 'luna' | 'luna-pro' | 'sonnet'

export type Gorev =
  /** Muayene/SOAP notu üretimi — uzun yapılandırılmış JSON */
  | 'soap'
  /** Mesleki not üretimi (mali müşavir, hukuk, terapi, sağlık meslekleri seans notu) */
  | 'not-uretimi'
  /** Klinik konsültasyon, not üzerinde danışma, doz önerisi, ICD-10 eşleme, e-reçete taslağı, lab yorumu, epikriz,
   *  konsültasyon yanıt raporundan klinik özet (KONSULTASYON-01) */
  | 'klinik-analiz'
  /**
   * GÖRÜNTÜ VE İNCELEME — görüntü/belge okuyan her çağrı. Kapsam:
   *  - Röntgen, OCT, fundus, ön segment, dermatoskopi, USG, MR, BT, mamografi, EKG ve her türlü görüntü yorumu /
   *    karar desteği (core/belgeler/yazar.ts → Tier A taslak; belge_analizleri boru hattı; göz ve dermatoloji ekleri)
   *  - Lab raporu PDF/görsel çıkarımı (core/lab/cikarim.ts) — sonrasındaki klinik yorum 'klinik-analiz'
   *  - Belge (PDF/görsel) okuyup alan çıkaran her çağrı (lib/ingestion/pipeline.ts analiz + ikinci geçiş)
   * NOTYA-MODEL-LUNAPRO-01 (Kaan, 2026-09-27): birincil Luna-Pro (görsel + dosya girdisi destekler); GÖRSEL = GÜÇLÜ
   * kuralı emekli. Sonnet 5 yalnız G1–G4 koruyucusudur.
   */
  | 'goruntu-inceleme'
  /** Hukuk analizi: dilekçe, sözleşme, müvekkil portalı */
  | 'uzman-analiz'
  /** Uzman sohbet turu: klinik sinyalli asistan turu (asistanModelYonlendir seçer — daha uzun tavan, F3), mali müşavir
   *  ve avukat sohbeti (mevzuat/hukuk tavsiyesi) */
  | 'sohbet-uzman'
  /** YALNIZ net sosyal asistan turu ya da uygulama kullanımı sorusu (asistanModelYonlendir istisnası) */
  | 'sohbet'
  /** Tek etiketli sınıflandırma / etiketleme */
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
  /** reasoning.effort (NOTYA-KADEME-01); undefined → sağlayıcı varsayılanı (medium). */
  caba?: Caba
}

/** Görev → kademe + önerilen max_tokens. Sayılar mevcut çağrı yerlerinin gerçek ihtiyacından geldi.
 * NOTYA-MODEL-LUNAPRO-01: `kademe` = birincil mi koruyucu mu. Hepsi 'hizli' (birincil Luna-Pro); Sonnet 5'e yalnız
 * cagir.ts'teki dört kapıdan (G1 transport / G2 low_conf / G3 safety / G4 devre) ulaşılır. Görevler maxTokens için
 * ayrı tutulur (F3).
 * max_tokens bir TAVAN'dır, fatura üretilen token'a göredir — düşürmek tasarruf getirmez, yalnız kesilme (F3) riski
 * getirir. Bu yüzden hiçbir çağrı yerinin mevcut tavanı düşürülmedi. */
export const GOREV_POLITIKASI: Record<Gorev, { kademe: Kademe; maxTokens: number; caba?: Caba }> = {
  // NOTYA-KADEME-01: derin = luna-pro (arka plan), caba 'none' = luna-none. Satırsız görev = luna (varsayılan effort).
  soap: { kademe: 'derin', maxTokens: 8000 },
  'not-uretimi': { kademe: 'hizli', maxTokens: 4000 },
  // Varsayılan luna (doz önerisi, lab yorumu, ilaç sonlandırma…); epikriz / konsült / e-reçete / SGK / SOAP önerisi çağrı
  // yerinde `kademe: 'derin'` verir.
  'klinik-analiz': { kademe: 'hizli', maxTokens: 2000 },
  // ASI-KARNESI-FIX (Kaan/Dr. Gokhan, 2026-09-19): 3000 yetmiyordu. Turk asi karnesinde 20-25
  // satir olur; her satir JSON'da ~150 token (ad, doz, tarih, okunamadi, neden, ham metin) →
  // 3500-4000 token. Tavan asilinca JSON ORTADAN KESILIYOR ve karneYanitiniCoz kesik JSON'u
  // reddediyor (F3 geregi hekime ham JSON gosterilmez) → hekim 'Karne okunamadi' goruyordu.
  // Ayni karnenin hem PDF'i hem fotografi ayni anda basarisiz oluyordu; belirti de buydu.
  // Kaan (2026-09-19) 12000 istedi: cok dozlu/uzun karnelerde 8000 de yetmeyebilir. Bu bir
  // TAVAN'dir, sabit maliyet degil — cikti kisa ise kisa faturalanir; yalniz gercekten uzun
  // karnede devreye girer. Karne okuma seyrek bir islem oldugu icin risk dusuk.
  'goruntu-inceleme': { kademe: 'derin', maxTokens: 12000 },
  'uzman-analiz': { kademe: 'derin', maxTokens: 2000 },
  // F3 (KD-DERM-SAFETY-FINDINGS): 800 uzun klinik cevabı JSON ortasında kesiyordu — klinik tur bu yüzden 1600.
  // sohbet-uzman: luna; tek-slot kısa takip turu ayseCevapla'da sohbetKademesi ile 'none' alır.
  'sohbet-uzman': { kademe: 'hizli', maxTokens: 1600 },
  sohbet: { kademe: 'hizli', maxTokens: 800, caba: 'none' },
  siniflandirma: { kademe: 'hizli', maxTokens: 20, caba: 'none' },
  ozet: { kademe: 'hizli', maxTokens: 300, caba: 'none' },
  bicimlendirme: { kademe: 'hizli', maxTokens: 1000, caba: 'none' },
  cikarim: { kademe: 'hizli', maxTokens: 500, caba: 'none' },
  'kisa-yanit': { kademe: 'hizli', maxTokens: 300, caba: 'none' },
}

export interface KademeSecenegi {
  /** Çağrı yerinin kademe aşımı: 'derin' (epikriz, SOAP önerisi…) ya da 'hizli' (politikayı luna'ya çeker). */
  kademe?: 'hizli' | 'derin'
  /** Çağrı yerinin effort aşımı (ayseCevapla tek-slot takip → 'none'). */
  caba?: Caba
}

/** Kademe → model. NOTYA_TIER_KAPALI=1 iken derin de hizli sayılır. */
export function kademeModeli(kademe: Kademe): string {
  if (kademe === 'guclu') return gucluModel()
  if (kademe === 'derin' && !kademeKapali()) return derinModel()
  return hizliModel()
}

/** Günlük adı: luna-none | luna | luna-pro | sonnet. */
export function kademeAdi(s: Pick<ModelSecimi, 'kademe' | 'caba'>): KademeAdi {
  if (s.kademe === 'guclu') return 'sonnet'
  if (s.kademe === 'derin') return 'luna-pro'
  return s.caba === 'none' ? 'luna-none' : 'luna'
}

export function modelSec(gorev: Gorev, secenek: KademeSecenegi = {}): ModelSecimi {
  const p = GOREV_POLITIKASI[gorev]
  if (!p) throw new Error(`Bilinmeyen AI görevi: ${String(gorev)}`)
  if (kademeKapali()) {
    const kademe: Kademe = p.kademe === 'guclu' ? 'guclu' : 'hizli'
    return { gorev, kademe, model: kademeModeli(kademe), maxTokens: p.maxTokens }
  }
  const kademe: Kademe = p.kademe === 'guclu' ? 'guclu' : (secenek.kademe ?? p.kademe)
  const caba = kademe === 'hizli' ? (secenek.caba ?? p.caba) : undefined
  return { gorev, kademe, model: kademeModeli(kademe), maxTokens: p.maxTokens, ...(caba ? { caba } : {}) }
}

// ─── NOTYA-KADEME-01: sohbet turunun kademesi (ayseCevapla, asistanModelYonlendir'den SONRA) ───────────
/** Ağır sohbet soruları luna-none'a inmez (açık uçlu, çok varlıklı, rapor/özet/görüntü). */
const AGIR_SOHBET = /(muayene raporu|epikriz|soap|özet|ozet|değerlendir|degerlendir|röntgen|rontgen|görüntü|goruntu|etkileşim|etkilesim|ayırıcı|ayirici|neler değiş|neler degis|gözümden kaç|gozumden kac|karşılaştır|karsilastir|hepsi|tümü|tumu|listele)/iu
/** Tek-slot takip niyetleri (konusmaBaglami Niyet): hasta-dosya, reçete, tahlil, aşı, büyüme, genel (yaş sorusu genel'e düşer). */
const TEK_SLOT_NIYET = new Set(['hasta-dosya', 'recete', 'tahlil', 'asi', 'buyume', 'genel'])
export const TEK_SLOT_AZAMI_KELIME = 12

export interface SohbetKademeGirdisi {
  gorev: 'sohbet' | 'sohbet-uzman'
  mesaj: string
  /** Önceki turun / çözülen takibin niyeti (konusma bağlamı); yoksa null → luna. */
  sonNiyet?: string | null
  /** intentParser.quickClassify (eylem niyeti → luna). */
  niyet?: string | null
  aracSayisi: number
  /** Kaba girdi token tahmini (metin/4); > 20k → luna. */
  girdiToken?: number
}
export interface SohbetKademeSonucu { caba?: 'none'; neden: string }

/**
 * Saf kural (lib/ai/modeller.test.ts):
 *  sohbet → none · araç var / eylem niyeti / ağır anahtar / > 20k token → luna ·
 *  sonNiyet tek-slot ve ≤ 12 kelime → none · kalan sohbet-uzman → luna. Kill-switch'te her zaman luna.
 */
export function sohbetKademesi(g: SohbetKademeGirdisi): SohbetKademeSonucu {
  if (kademeKapali()) return { neden: 'kademe kapalı' }
  if (g.gorev === 'sohbet') return { caba: 'none', neden: 'sosyal / uygulama turu' }
  if (g.aracSayisi > 0) return { neden: 'araç turu' }
  if (g.niyet && EYLEM_NIYETLERI.has(g.niyet)) return { neden: `eylem niyeti: ${g.niyet}` }
  if ((g.girdiToken ?? 0) > 20_000) return { neden: 'uzun girdi' }
  const kucuk = String(g.mesaj || '').trim().toLocaleLowerCase('tr-TR')
  if (AGIR_SOHBET.test(kucuk)) return { neden: 'ağır soru' }
  if (g.sonNiyet && TEK_SLOT_NIYET.has(g.sonNiyet) && kelimeler(kucuk).length <= TEK_SLOT_AZAMI_KELIME) {
    return { caba: 'none', neden: `tek-slot takip (${g.sonNiyet})` }
  }
  return { neden: 'uzman tur' }
}

// ─── Yükseltme nedenleri (NOTYA-MODEL-LUNA-01, ai_token_kullanim.neden) ──────────────────────────────
/**
 * Neden koruyucuya (Sonnet 5) gidildi — ölçüm satırına yazılır, içerik değildir. NOTYA-MODEL-LUNAPRO-01: dört kapı.
 *  - transport (G1): birincil cevap veremedi (5xx, zaman aşımı, boş gövde, 429 tekrarı, ağ) ya da OpenRouter yok
 *  - low_conf (G2): boş/ret/düşük güven, bozuk/kesik yapılandırılmış JSON, bozuk araç çağrısı, SOAP ai_confidence < 0.6
 *  - safety (G3): mesajda ya da hasta dosyası bağlamında güvenlik sinyali (gebe, emzirme, pediatrik doz, warfarin/NSAID…)
 *  - devre (G4): birincilin devresi açık (lib/ai/devre.ts)
 *  - tier_up (NOTYA-KADEME-01): luna-none cevabı kullanılamadı (boş / < 3 kelime / ret / bozuk JSON) → aynı istek luna'da
 * Emekli (2026-09-26): onayla, vision, uzman — migration 105/106'nın check listesinde geçmiş satırlar için duruyor.
 */
export type YukseltmeNedeni = 'transport' | 'safety' | 'low_conf' | 'devre' | 'tier_up'

/** Görev tek başına koruyucuya götürmez (LUNA-02 / LUNAPRO-01) — her görev için null. İmza ölçüm/uyumluluk için korunur. */
export function gorevNedeni(gorev: Gorev): YukseltmeNedeni | null {
  modelSec(gorev) // bilinmeyen görev yine hata fırlatır
  return null
}

// Güvenlik sinyali — çağrıdan ÖNCE GÜÇLÜ (neden = safety). Liste LUNA-01'deki gibidir; değiştirmek ürün kararıdır.
const GUVENLIK_SINYALI = /(?<![\p{L}])(gebe|gebelik|hamile|emzir|laktasyon|pediatrik doz|çocuk doz|mg\/kg|warfarin|varfarin|kumadin|coumadin|nsai|ibuprofen|naproksen|diklofenak|isotretinoin|izotretinoin|roaccutane|kontrendik)/iu
export function guvenlikSinyaliVar(metin: string): boolean {
  const m = String(metin || '')
  // Hem ham hem tr-TR küçük harf: "NSAİİ" → "nsaii", "NSAID" ham haliyle yakalanır ("nsaıd" değil).
  return GUVENLIK_SINYALI.test(m) || GUVENLIK_SINYALI.test(m.toLocaleLowerCase('tr-TR'))
}

// Birincilin "bilmiyorum / daha fazla bilgi şart / yardımcı olamam" dediği cevap → GÜÇLÜ tekrar dener (low_conf).
const DUSUK_GUVEN = /(daha fazla bilgi (şart|gerek|lazım)|daha fazla bilgiye ihtiyaç|emin değilim|yeterli bilgi(m)? yok|yardımcı olamam|yanıt veremiyorum|cevap veremiyorum|i can(no|')t help|i'?m (not able|unable) to|i am unable to)/iu
export function dusukGuvenMi(metin: string): boolean {
  return DUSUK_GUVEN.test(String(metin || ''))
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
// Kaan, 2026-09-19: şüphede uzman tur. Varsayılan dal sohbet-uzman'dır; sohbet yalnız dar bir istisna listesiyle seçilir.
// NOTYA-MODEL-LUNAPRO-01: iki dal da birincil Luna-Pro'ya gider — ayrım prompt ve maxTokens (F3: 1600 vs 800) içindir, model için değil.

export interface YonlendirmeGirdisi {
  mesaj: string
  /** Seçili hasta ya da mesajdan çözülen hasta dosyası (veya çoklu eşleşme uyarısı) prompta girdi mi */
  hastaBaglami: boolean
  /** intentParser.quickClassify sonucu (null = sınıflanmadı) */
  niyet?: string | null
}

export interface YonlendirmeSonucu { gorev: 'sohbet' | 'sohbet-uzman'; neden: string }

// Klinik sinyal — HIZLI istisnalarını ezer. Soldan kelime sınırı; Türkçe ekler serbest ("dozu", "ilaçları").
// Liste genişletmek yalnız uzman tura iter (güvenli taraf); daraltmak kalite kararıdır.
const KLINIK_KOK = /(?<![\p{L}])(hasta|doz|ilaç|ilac|reçete|recete|tanı|tani\b|teşhis|ayırıcı|tedavi|antibiyotik|etkileş|interaksiyon|endikasyon|kontrendik|yan etki|alerji|kılavuz|kilavuz|protokol|prognoz|semptom|belirti|şikayet|yakınma|bulgu|muayene|tahlil|tetkik|laboratuvar|hemogram|biyokimya|kültür|görüntü|röntgen|rontgen|grafi|tomografi|ultrason|ultrasonografi|mamografi|dermatoskop|fundus|ön segment|anjiyo|ekokardiyo|lezyon|kitle|nodül|patoloji|biyopsi|ameliyat|cerrahi|sevk|konsült|epikriz|rapor|skor|risk|gebe|gebelik|hamile|emzir|aşı|ateş|ağrı|öksürük|kusma|ishal|nefes|tansiyon|nabız|satürasyon|kreatinin|glukoz|hba1c|troponin|insülin|steroid|kortizon|parasetamol|ibuprofen|amoksisilin|mg\/kg)/iu
// Kısa kısaltmalar: iki yandan sınır.
const KLINIK_KISALTMA = /(?<![\p{L}])(mg|mcg|ml|iu|ekg|eeg|emg|eko|usg|mr|mri|bt|pet|oct|crp|ldl|tsh|inr|spo2|icd|lab)(?![\p{L}])/iu
/** Eylem gerektiren niyetler (hasta oluştur, reçete, tanı, belge) — modelin JSON eylemi doğru kurması gerekir. */
const EYLEM_NIYETLERI = new Set(['CREATE_PATIENT', 'ADD_COMPLAINT', 'REQUEST_DIAGNOSIS', 'ADD_PRESCRIPTION', 'GENERATE_DOCUMENT'])

// HIZLI istisnası 1 — NET sosyal tur: mesajın TAMAMI selam/teşekkür/hal-hatır/vedalaşma kelimelerinden oluşur.
// "evet / tamam / olur / peki" BİLEREK yok: asistanın klinik önerisine onay olabilir ("ayırıcı tanıya ekleyeyim mi?" →
// "evet") ve modelin eylemi doğru kurması gerekir — belirsiz, dolayısıyla uzman tur.
const SOSYAL_CEKIRDEK = new Set([
  'merhaba', 'merhabalar', 'selam', 'selamlar', 'günaydın', 'akşamlar', 'geceler', 'günler', 'çalışmalar',
  'nasılsın', 'nasılsınız', 'naber', 'napıyorsun', 'iyiyim', 'teşekkür', 'teşekkürler', 'sağol', 'sağolun',
  'eyvallah', 'gelsin', 'görüşürüz', 'hoşça', 'bye',
])
// Tek başına sosyal sayılmayan dolgu kelimeleri ("iyi" tek başına klinik soruya cevap olabilir → uzman tur).
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
 * Asistan sohbeti hangi göreve gider (sohbet | sohbet-uzman) — saf fonksiyon (lib/ai/modeller.test.ts).
 * Model iki dalda da birincil Luna-Pro'dur (LUNAPRO-01); görev prompt ve maxTokens'ı belirler.
 * VARSAYILAN sohbet-uzman. Sıra:
 *  1. hasta bağlamı (seçili hasta / çözülen dosya) → sohbet-uzman, istisnasız ("teşekkürler" bile)
 *  2. eylem niyeti (hasta oluştur, reçete, tanı, belge) → sohbet-uzman
 *  3. klinik kök / kısaltma (ilaç, tanı, tetkik, görüntü, lab, doz, risk skoru …) → sohbet-uzman
 *  4. DAR İSTİSNA → sohbet: net sosyal tur ya da uygulama kullanımı sorusu
 *  5. geri kalan her şey (belirsiz, sınıflanamayan) → sohbet-uzman
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

  return { gorev: 'sohbet-uzman', neden: 'varsayılan (şüphede uzman tur)' }
}
