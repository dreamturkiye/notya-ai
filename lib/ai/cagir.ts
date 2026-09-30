/**
 * NOTYA-MALIYET-01 + NOTYA-MODEL-LUNA-01 + NOTYA-MODEL-LUNAPRO-01 — tüm LLM çağrılarının tek kapısı.
 *
 * Model ve önerilen max_tokens görevden gelir (lib/ai/modeller.ts → modelSec); çağrı yeri model adı yazmaz.
 * Taşıma yolu lib/ai/saglayici.ts'te seçilir:
 *  - OPENROUTER_API_KEY varsa → OpenRouter (birincil = GPT-6 Luna, koruyucu = Sonnet 5); istek/yanıt Anthropic
 *    biçimine çevrilir.
 *  - yoksa → koruyucu (Sonnet 5) eski doğrudan SDK yoluyla; OpenAI modeli bu yolda gidemez → koruyucu (neden = transport).
 *    Çağrı yerleri Anthropic SDK istemcisi kurmaz — yalnız bu kapı (test sahtesi `istemci` ile).
 * HTTP hatasında AiCagriHatasi fırlatılır (durum + gövde); çağıran eskisi gibi kendi hata mesajını seçer.
 *
 * Birincil model HER görevde GPT-6 Luna (Kaan, 2026-09-29) — görsel/PDF dahil. Sonnet 5 koruyucudur, dört kapıdan:
 *  G3 GÜVENLİK (çağrıdan önce): mesajda ya da `guvenlikBaglami`nda (hasta dosyası) güvenlik sinyali → koruyucu (safety).
 *  G4 DEVRE (çağrıdan önce): birincilin devresi açık → koruyucu (devre) — lib/ai/devre.ts.
 *  G1 TAŞIMA: 5xx / zaman aşımı / boş gövde / 429 / ağ → 400 ms → birincil bir kez → koruyucu (transport).
 *  G2 KALİTE (çağrıdan sonra, istek başına en fazla bir kez): boş / ret / düşük güven; yapılandırılmış işte (`jsonBekleniyor`)
 *     F3 onarımının da kurtaramadığı JSON ya da max_tokens kesilmesi; bilinmeyen araç adı / bozuk araç argümanı → koruyucu
 *     (low_conf). SOAP gövdesinin ai_confidence < 0.6 kuralı soapUret.ts'te, `koruyucuyaZorla` ile.
 *  Her düşüş ai_token_kullanim'a nedeniyle yazılır ve konsola TEK satır düşer (istek kimliği, görev, neden, alt kod —
 *  içerik yok). Prompt caching: `onbellek: true` system blokları cache_control alır (OpenRouter'da da).
 */
import type Anthropic from '@anthropic-ai/sdk'
import {
  dusukGuvenMi, gucluModel, guvenlikSinyaliVar, modelSec,
  type Gorev, type Kademe, type ModelSecimi, type YukseltmeNedeni,
} from './modeller'
import { kullanimKaydet, kullanimSatiri } from './kullanim'
import { AiCagriHatasi, dogrudanModelAdi, gecersizArgumanIsaretle, gecersizArgumanMi, openRouterAkis, openRouterCagir, yolSec } from './saglayici'
import { devreBasari, devreBirincilIzinli, devreHata, devreNotr } from './devre'
import { jsonOnarDetay } from './jsonOnar'

export { AiCagriHatasi }

/** SDK'nın bu sürümünde (0.27) tiplenmemiş ama API'nin kabul ettiği içerik blokları (ör. PDF `document`) için geniş tip. */
export type AiMesaj = { role: 'user' | 'assistant'; content: string | unknown[] }

/** System promptun bir parçası. `onbellek: true` → cache_control (ephemeral). Sabit kısım önce, değişken kısım sonra. */
export type SistemBlogu = { metin: string; onbellek?: boolean }

export interface AiIstemci {
  messages: { create: (govde: never) => Promise<unknown> }
}

export interface AiCagriGirdisi {
  gorev: Gorev
  /** Düz metin (eski davranış, önbelleksiz) ya da sabit→değişken sıralı blok dizisi (önbellekli). */
  system?: string | SistemBlogu[]
  messages: AiMesaj[]
  /** modelSec önerisinin gerekçeli aşımı (ör. 16k satırlık e-Nabız çıkarımı). */
  maxTokens?: number
  temperature?: number
  /** Yalnız test sahtesi. Üretimde OpenRouter kullanılır; verilmezse doğrudan yolda SDK bu kapıda kurulur. */
  istemci?: AiIstemci
  /** Ölçüm satırı için hekim/kullanıcı kimliği (UUID değilse null yazılır). Hasta kimliği ASLA verilmez. */
  doctorId?: string | null
  /**
   * NOTYA-EYLEM: Anthropic tool tanımları (core/eylemler/araclar.ts). Boş/verilmezse istek eskisiyle
   * birebir aynı kalır — araç kullanmayan çağrı yerleri hiç etkilenmez. Bir aracın çağrılması KAYIT
   * DEĞİLDİR: yanıttaki tool_use blokları yalnız hekime onay kartı hazırlar (docs/AYSE-EYLEM-MIMARISI.md §1).
   */
  araclar?: unknown[]
  /**
   * When the doctor says kaydet/yazıver, force a tool call (`any`) so the model cannot narrate
   * "veri girişi yapamam". Still a proposal only — commit is the tap.
   */
  toolChoice?: 'auto' | 'any' | { type: 'tool'; name: string }
  /**
   * NOTYA-MODEL-LUNA-02: system'e konan hasta dosyası metni (ör. asistanın AKTİF HASTA DOSYASI). Yalnız güvenlik
   * sinyali taraması için okunur, modele ayrıca GİTMEZ. Kullanıcı mesajları her zaman taranır; sabit system metni
   * (kurallar, branş kilidi) taranmaz — orada geçen "gebe" her turu Sonnet'e iterdi.
   */
  guvenlikBaglami?: string
  /**
   * NOTYA-MODEL-LUNAPRO-01 G2 (d): çağıran yanıtı JSON olarak ayrıştıracak. Birincilin yanıtı F3 onarımıyla da
   * ayrıştırılamıyorsa ya da max_tokens'ta kesildiyse koruyucu bir kez dener. Verilmezse görev varsayılanı
   * (YAPILANDIRILMIS_GOREVLER); `false` → düzyazı işi, JSON kontrolü yok.
   */
  jsonBekleniyor?: boolean
  /** jsonBekleniyor ile aynı anlam (okunabilirlik için iki ad). */
  yapilandirilmis?: boolean
  /**
   * G2 (f): çağıran birincilin yanıtını kendi ölçütüyle (ör. SOAP ai_confidence < 0.6) reddetti — bu çağrı doğrudan
   * koruyucuya gider, birincilin devresine hata yazılır. Alt kod konsol satırına düşer (içerik değil).
   */
  koruyucuyaZorla?: { neden: 'low_conf'; altKod: string }
  /** Konsol satırındaki istek kimliği (verilmezse üretilir). Hasta/hekim kimliği DEĞİLDİR. */
  istekId?: string
}

/**
 * Varsayılan olarak yapılandırılmış (JSON) çıktı bekleyen görevler: SOAP gövdesi, mesleki not (noteGenerator / seans
 * notu — hepsi JSON), görüntü/belge okuma (karne, lab çıkarımı, belge yazarı, gelen belge, mali belge alanları).
 * Diğer görevlerde JSON bekleyen çağrı yeri `jsonBekleniyor: true` verir (lab yorumu, doz, e-reçete, SGK raporu…);
 * düzyazı üreten görüntü işi `jsonBekleniyor: false` verir (konsültasyon yanıt özeti).
 */
export const YAPILANDIRILMIS_GOREVLER: ReadonlySet<Gorev> = new Set<Gorev>(['soap', 'not-uretimi', 'goruntu-inceleme'])

export function yapilandirilmisMi(g: Pick<AiCagriGirdisi, 'gorev' | 'jsonBekleniyor' | 'yapilandirilmis'>): boolean {
  if (g.jsonBekleniyor !== undefined) return g.jsonBekleniyor
  if (g.yapilandirilmis !== undefined) return g.yapilandirilmis
  return YAPILANDIRILMIS_GOREVLER.has(g.gorev)
}

/** Yanıttaki tüm metin bloklarını birleştirir. */
export function yanitMetni(yanit: { content?: unknown }, ayirici = ''): string {
  const bloklar = Array.isArray(yanit?.content) ? (yanit.content as { type?: string; text?: string }[]) : []
  return bloklar.filter((c) => c?.type === 'text').map((c) => String(c.text ?? '')).join(ayirici)
}

const GORSEL_BLOK = new Set(['image', 'document'])

function blokGorselMi(b: unknown): boolean {
  if (!b || typeof b !== 'object') return false
  const o = b as { type?: unknown; content?: unknown }
  if (typeof o.type === 'string' && GORSEL_BLOK.has(o.type)) return true
  // tool_result gibi iç içe içerik
  return Array.isArray(o.content) && o.content.some(blokGorselMi)
}

/** Mesajlarda görüntü (image) ya da PDF/belge (document) bloğu var mı — multimodal çağrı mı? */
export function gorselIcerirMi(mesajlar: AiMesaj[]): boolean {
  return (mesajlar || []).some((m) => Array.isArray(m?.content) && m.content.some(blokGorselMi))
}

/** Kullanıcı mesajlarının düz metni (güvenlik sinyali taraması için; system ve asistan metni taranmaz). */
function kullaniciMetni(mesajlar: AiMesaj[]): string {
  return (mesajlar || []).filter((m) => m?.role === 'user').map((m) => typeof m.content === 'string'
    ? m.content
    : (m.content as { type?: string; text?: string }[]).filter((b) => b?.type === 'text').map((b) => String(b.text ?? '')).join(' ')).join('\n')
}

/**
 * Çağrıdan önceki seçim — görevin birincil modeli (LUNAPRO-01 kapılar; her görevde Luna). Görsel/PDF yükseltmez.
 * NOTYA-MODEL-LUNAPRO-02 (Kaan, 2026-09-27: "All must be on Pro; Sonnet only if it must"): çağrı ÖNCESİ güvenlik
 * kapısı (G3) KALDIRILDI — pediatride mg/kg / ibuprofen / çocuk doz sinyalleri her klinik çağrıyı Sonnet'e yolluyordu.
 * Koruyucu (Sonnet 5) artık yalnız birincil GERÇEKTEN başarısız olunca devreye girer: G1 taşıma, G2 kalite, G4 devre.
 * Güvenlik sinyali yalnız ölçüm/günlük amaçlı işaretlenir (guvenlikSinyali: true), yönlendirmeyi değiştirmez.
 * `neden` ölçüm satırına gider (birincil modelde kalırsa null).
 */
export function etkinSecim(g: Pick<AiCagriGirdisi, 'gorev' | 'messages' | 'guvenlikBaglami'>): ModelSecimi & { yukseltildi: boolean; neden: YukseltmeNedeni | null; guvenlikSinyali: boolean } {
  const secim = modelSec(g.gorev)
  const guvenlikSinyali = guvenlikSinyaliVar(`${kullaniciMetni(g.messages)}\n${g.guvenlikBaglami || ''}`)
  return { ...secim, yukseltildi: false, neden: null, guvenlikSinyali }
}

/** API en fazla 4 cache_control kırılma noktası kabul eder. */
const AZAMI_ONBELLEK_NOKTASI = 4

/** System alanını API biçimine çevirir. Boş/yalnız boşluk bloklar atılır (API boş text bloğunu reddeder). */
export function sistemGovdesi(system: AiCagriGirdisi['system']): string | Record<string, unknown>[] | undefined {
  if (system === undefined) return undefined
  if (typeof system === 'string') return system || undefined
  let nokta = 0
  const bloklar = system
    .filter((b) => b && typeof b.metin === 'string' && b.metin.trim())
    .map((b) => {
      const blok: Record<string, unknown> = { type: 'text', text: b.metin }
      if (b.onbellek && nokta < AZAMI_ONBELLEK_NOKTASI) {
        blok.cache_control = { type: 'ephemeral' }
        nokta++
      }
      return blok
    })
  return bloklar.length ? bloklar : undefined
}

export function istekGovdesi(g: AiCagriGirdisi): Record<string, unknown> {
  const secim = etkinSecim(g)
  const govde: Record<string, unknown> = {
    model: secim.model,
    max_tokens: g.maxTokens ?? secim.maxTokens,
    messages: g.messages,
  }
  const system = sistemGovdesi(g.system)
  if (system) govde.system = system
  if (g.temperature !== undefined) govde.temperature = g.temperature
  if (g.araclar?.length) {
    govde.tools = g.araclar
    if (g.toolChoice === 'any') govde.tool_choice = { type: 'any' }
    else if (g.toolChoice === 'auto') govde.tool_choice = { type: 'auto' }
    else if (g.toolChoice && typeof g.toolChoice === 'object') govde.tool_choice = g.toolChoice
  }
  return govde
}

type Olcum = { kademe: Kademe; neden: YukseltmeNedeni | null }

async function olc(g: AiCagriGirdisi, govde: Record<string, unknown>, yanit: Anthropic.Message, o: Olcum): Promise<void> {
  const y = yanit as unknown as { model?: string; usage?: Record<string, number | null>; stop_reason?: string | null }
  await kullanimKaydet(kullanimSatiri({
    doctorId: g.doctorId ?? null,
    gorev: g.gorev,
    model: y?.model || String(govde.model),
    usage: y?.usage,
    stopReason: y?.stop_reason ?? null,
    kademe: o.kademe,
    neden: o.neden,
  }))
}

/** Birincilin taşıma hatası: 5xx, 429, zaman aşımı (504), ağ (503), boş gövde (502). 4xx istek hatası değildir. */
export function tasimaHatasiMi(e: unknown): boolean {
  return e instanceof AiCagriHatasi && (e.durum >= 500 || e.durum === 429)
}

/** Birincil cevabı kullanılamaz mı: metin + araç çağrısı yok, ret, ya da "daha fazla bilgi şart / emin değilim". */
export function dusukGuvenliYanit(y: Anthropic.Message | null | undefined): boolean {
  return dusukGuvenKodu(y) !== null
}

/** G2 (a)–(c) alt kodu: bos | ret | dusuk_guven; kullanılabilir cevapta null. Araç çağrısı boş cevap sayılmaz. */
function dusukGuvenKodu(y: Anthropic.Message | null | undefined): string | null {
  if (!y) return 'bos'
  const bloklar = Array.isArray(y.content) ? (y.content as { type?: string }[]) : []
  if ((y.stop_reason as string | null) === 'refusal') return 'ret'
  if (bloklar.some((b) => b?.type === 'tool_use')) return null
  const metin = yanitMetni(y).trim()
  if (!metin) return 'bos'
  return dusukGuvenMi(metin) ? 'dusuk_guven' : null
}

/** G2 (e): bilinmeyen araç adı ya da JSON olarak çözülemeyen araç argümanı. */
function aracKodu(g: Pick<AiCagriGirdisi, 'araclar'>, y: Anthropic.Message): string | null {
  const bloklar = (Array.isArray(y?.content) ? y.content : []) as { type?: string; name?: string }[]
  const cagrilar = bloklar.filter((b) => b?.type === 'tool_use')
  if (!cagrilar.length) return null
  const adlar = new Set((g.araclar || []).map((a) => String((a as { name?: unknown })?.name ?? '')))
  if (cagrilar.some((b) => !b.name || !adlar.has(String(b.name)))) return 'arac_adi'
  if (cagrilar.some(gecersizArgumanMi)) return 'arac_json'
  return null
}

/** G2 (d): yapılandırılmış işte max_tokens kesilmesi ya da F3 onarımının da kurtaramadığı JSON. */
function yapiKodu(y: Anthropic.Message): string | null {
  if ((y.stop_reason as string | null) === 'max_tokens') return 'kesildi'
  const metin = yanitMetni(y).trim()
  if (!metin) return null // boş cevap (a)'da sayılır; araç-yalnız yanıt JSON beklemez
  const r = jsonOnarDetay(metin)
  return r.neden === 'ok' && r.deger !== null && typeof r.deger === 'object' ? null : 'json'
}

/**
 * G2 kalite kapısı — birincilin cevabı koruyucuya gitmeli mi? Alt kod (konsol satırı için) ya da null.
 * Sıra: (b) ret, (e) araç, (a)(c) boş / düşük güven, (d) yapılandırılmış JSON.
 */
export function kaliteKodu(g: Pick<AiCagriGirdisi, 'gorev' | 'araclar' | 'jsonBekleniyor' | 'yapilandirilmis'>, y: Anthropic.Message | null | undefined): string | null {
  if (!y) return 'bos'
  if ((y.stop_reason as string | null) === 'refusal') return 'ret'
  const arac = aracKodu(g, y)
  if (arac) return arac
  const dusuk = dusukGuvenKodu(y)
  if (dusuk) return dusuk
  return yapilandirilmisMi(g) ? yapiKodu(y) : null
}

/** Taşıma kapısında denemeler arası bekleme (testler kısaltır). */
export const TASIMA_BEKLEME = { ms: 400 }
/**
 * Birincil çağrının zaman aşımı — aşılırsa taşıma hatası sayılır. Koruyucu çağrıda zaman aşımı yok (eskisi gibi).
 * SOAP (8000) ve karne/görüntü (12000) de birincilde; 25 sn uzun çıktıyı yarıda keserdi. Tavan max_tokens'la büyür
 * (~8 ms/token), 25–60 sn arası: kısa işler 25 sn, uzun işler 60 sn.
 */
export function lunaZamanAsimiMs(maxTokens: unknown): number {
  const n = typeof maxTokens === 'number' && Number.isFinite(maxTokens) ? maxTokens : 0
  return Math.min(60_000, Math.max(25_000, n * 8))
}
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Hedef = { govde: Record<string, unknown>; kademe: Kademe; neden: YukseltmeNedeni | null }

/** Seçilen modeli bu ortamda gidebileceği bir modele çevirir: OpenAI modeli + OpenRouter yok → koruyucu (transport). */
function hedefBelirle(g: AiCagriGirdisi): Hedef {
  const secim = etkinSecim(g)
  const govde = istekGovdesi(g)
  if (yolSec(String(govde.model))) return { govde, kademe: secim.kademe, neden: secim.neden }
  const guclu = gucluModel()
  if (!yolSec(guclu)) throw new AiCagriHatasi(500, 'OPENROUTER_API_KEY tanımlı değil ve GÜÇLÜ model Anthropic değil')
  return { govde: { ...govde, model: guclu }, kademe: 'guclu', neden: 'transport' }
}

/** Koruyucu modelle aynı istek (birincil kapısından düşüş). */
function gucluyeYukselt(h: Hedef, neden: YukseltmeNedeni): Hedef {
  return { govde: { ...h.govde, model: gucluModel() }, kademe: 'guclu', neden }
}

/** Birincil kapısı (G1, G2, G4) yalnız HIZLI kademe OpenRouter'dan giderken çalışır; doğrudan Anthropic yolu tek çağrıdır. */
function lunaKapisiMi(h: Hedef): boolean {
  return h.kademe === 'hizli' && yolSec(String(h.govde.model)) === 'openrouter'
}

function istekKimligi(g: AiCagriGirdisi): string {
  if (g.istekId) return String(g.istekId).slice(0, 40)
  try { return globalThis.crypto.randomUUID().slice(0, 8) } catch { return Math.random().toString(36).slice(2, 10) }
}

/** Her düşüşte tek konsol satırı — istek kimliği, görev, neden, alt kod. İçerik, hasta, prompt YOK. */
function dususGunlukle(istekId: string, gorev: Gorev, neden: YukseltmeNedeni, altKod: string): void {
  console.warn(`[ai/yedek] istek=${istekId} gorev=${gorev} neden=${neden} alt=${altKod}`)
}

function tasimaAltKodu(e: unknown): string {
  return e instanceof AiCagriHatasi ? `http_${e.durum}` : 'ag'
}

/** Koruyucu yanıtının hangi kademeden ve hangi nedenle geldiği (ör. SOAP G2 (f) ikinci kez yedeğe gitmesin). */
const YANIT_KADEMESI = new WeakMap<object, Olcum>()
export function yanitKademesi(y: unknown): Olcum | null {
  return y && typeof y === 'object' ? YANIT_KADEMESI.get(y as object) ?? null : null
}
function isaretle<T>(y: T, o: Olcum): T {
  if (y && typeof y === 'object') YANIT_KADEMESI.set(y as object, { kademe: o.kademe, neden: o.neden })
  return y
}

/** Doğrudan koruyucu yolu (OpenRouter yok). Üretim çağrı yerleri istemci kurmaz. */
async function dogrudanIstemci(g: AiCagriGirdisi): Promise<AiIstemci> {
  if (g.istemci) return g.istemci
  const { default: AnthropicSdk } = await import('@anthropic-ai/sdk')
  return new AnthropicSdk({ apiKey: process.env.ANTHROPIC_API_KEY || '' }) as unknown as AiIstemci
}

/**
 * NOTYA-AYSE-100 D1: the direct Anthropic path (koruyucu Sonnet 5) returns a leading `thinking` block even when no
 * thinking is requested. Every consumer reads `content[0].type === 'text'` (ayseCevapla, soapUret, hafiza), so the
 * fallback answer came back EMPTY. Thinking blocks carry nothing the product uses — drop them so `content[0]` is the text.
 */
export function dusunmeBloklariniAt<T extends { content?: unknown }>(yanit: T): T {
  if (!yanit || !Array.isArray(yanit.content)) return yanit
  const icerik = (yanit.content as { type?: string }[]).filter((b) => b?.type !== 'thinking' && b?.type !== 'redacted_thinking')
  if (icerik.length === (yanit.content as unknown[]).length) return yanit
  yanit.content = icerik
  return yanit
}

async function tekCagri(g: AiCagriGirdisi, govde: Record<string, unknown>, zamanAsimiMs?: number): Promise<Anthropic.Message> {
  const model = String(govde.model)
  if (yolSec(model) === 'openrouter') return openRouterCagir(govde, zamanAsimiMs)
  const dogrudan = { ...govde, model: dogrudanModelAdi(model) }
  const istemci = await dogrudanIstemci(g)
  return dusunmeBloklariniAt((await istemci.messages.create(dogrudan as never)) as Anthropic.Message)
}

async function olcSessiz(g: AiCagriGirdisi, h: Hedef, yanit: Anthropic.Message): Promise<void> {
  try { await olc(g, h.govde, yanit, h) } catch { /* ölçüm çağrıyı asla düşürmez */ }
}

/**
 * NOTYA-AYSE-100-LUNA: audit kill-switch. With NOTYA_KORUYUCU_KAPALI=1 the koruyucu (Sonnet 5) is never called — every
 * fall that would have reached it throws AiCagriHatasi(599, "luna_fail:<neden>:<altKod>") so the primary's failure is
 * visible instead of being papered over. Never set in production; the audit harness sets it.
 */
export function koruyucuKapali(): boolean {
  return process.env.NOTYA_KORUYUCU_KAPALI === '1'
}
function koruyucuKapaliHatasi(neden: YukseltmeNedeni, altKod: string): AiCagriHatasi {
  return new AiCagriHatasi(599, `luna_fail:${neden}:${altKod}`)
}

/** Koruyucuya tek çağrı (düşüş). Koruyucunun cevabı kapılardan geçmez — istek başına en fazla bir düşüş. */
async function koruyucuCagri(g: AiCagriGirdisi, h: Hedef, neden: YukseltmeNedeni, altKod: string, istekId: string): Promise<Anthropic.Message> {
  dususGunlukle(istekId, g.gorev, neden, altKod)
  if (koruyucuKapali()) throw koruyucuKapaliHatasi(neden, altKod)
  const t = gucluyeYukselt(h, neden)
  const y = await tekCagri(g, t.govde)
  await olcSessiz(g, t, y)
  return isaretle(y, t)
}

export async function aiCagir(g: AiCagriGirdisi): Promise<Anthropic.Message> {
  const h = hedefBelirle(g)
  if (h.neden === 'safety') dususGunlukle(istekKimligi(g), g.gorev, 'safety', 'sinyal')
  if (!lunaKapisiMi(h)) {
    const yanit = await tekCagri(g, h.govde)
    await olcSessiz(g, h, yanit)
    return isaretle(yanit, h)
  }
  const birincil = String(h.govde.model)
  const istekId = istekKimligi(g)
  // G2 (f): çağıran birincilin cevabını reddetti → doğrudan koruyucu, birincilin devresine hata.
  if (g.koruyucuyaZorla) {
    devreHata(birincil)
    return koruyucuCagri(g, h, g.koruyucuyaZorla.neden, g.koruyucuyaZorla.altKod, istekId)
  }
  // G4: devre açık → birincil hiç çağrılmaz.
  if (!devreBirincilIzinli(birincil)) return koruyucuCagri(g, h, 'devre', 'acik', istekId)

  // G1 TAŞIMA: birincil → 400 ms → birincil bir kez → koruyucu
  let yanit: Anthropic.Message | null = null
  let sonHata: unknown = null
  for (let deneme = 0; deneme < 2 && !yanit; deneme++) {
    if (deneme) await bekle(TASIMA_BEKLEME.ms)
    try {
      yanit = await tekCagri(g, h.govde, lunaZamanAsimiMs(h.govde.max_tokens))
    } catch (e) {
      if (!tasimaHatasiMi(e)) { devreNotr(birincil); throw e }
      sonHata = e
    }
  }
  if (!yanit) {
    devreHata(birincil)
    return koruyucuCagri(g, h, 'transport', tasimaAltKodu(sonHata), istekId)
  }
  await olcSessiz(g, h, yanit)
  // G2 KALİTE (çağrı sonrası, bir kez): boş / ret / düşük güven / bozuk-kesik JSON / bozuk araç çağrısı → koruyucu
  const kod = kaliteKodu(g, yanit)
  if (kod) {
    devreHata(birincil)
    return koruyucuCagri(g, h, 'low_conf', kod, istekId)
  }
  devreBasari(birincil)
  return isaretle(yanit, h)
}

type AkisOlayi = {
  type?: string
  index?: number
  message?: { model?: string; usage?: Record<string, number | null> }
  content_block?: { type?: string; id?: string; name?: string; text?: string }
  delta?: { type?: string; text?: string; partial_json?: string; stop_reason?: string | null }
  usage?: Record<string, number | null>
}

/** Doğrudan koruyucu yolunda akış — eski aiAkis gövdesi, birebir. */
async function anthropicAkis(g: AiCagriGirdisi, h: Hedef, metinParcasi: (parca: string) => void): Promise<Anthropic.Message> {
  const govde: Record<string, unknown> = { ...h.govde, model: dogrudanModelAdi(String(h.govde.model)), stream: true }
  const istemci = await dogrudanIstemci(g)
  const ham = (await istemci.messages.create(govde as never)) as unknown
  // Akış yerine tam mesaj dönen istemci (test sahtesi, vekil) → metni tek parça ver, aynen işle.
  if (!ham || typeof (ham as AsyncIterable<unknown>)[Symbol.asyncIterator] !== 'function') {
    const tam = dusunmeBloklariniAt(ham as Anthropic.Message)
    const t = yanitMetni(tam)
    if (t) metinParcasi(t)
    try { await olc(g, govde, tam, h) } catch { /* ölçüm çağrıyı asla düşürmez */ }
    return tam
  }
  const akis = ham as AsyncIterable<AkisOlayi>
  const bloklar: Record<string, unknown>[] = []
  const jsonlar: string[] = []
  let model = String(govde.model)
  let usage: Record<string, number | null> = {}
  let stopReason: string | null = null
  for await (const o of akis) {
    if (o.type === 'message_start') {
      model = o.message?.model || model
      usage = { ...(o.message?.usage || {}) }
    } else if (o.type === 'content_block_start' && o.index !== undefined) {
      bloklar[o.index] = { ...(o.content_block || {}) }
      if (o.content_block?.type === 'tool_use') jsonlar[o.index] = ''
    } else if (o.type === 'content_block_delta' && o.index !== undefined) {
      const b = bloklar[o.index] || (bloklar[o.index] = { type: 'text', text: '' })
      if (o.delta?.type === 'text_delta' && o.delta.text) {
        b.text = String(b.text || '') + o.delta.text
        metinParcasi(o.delta.text)
      } else if (o.delta?.type === 'input_json_delta') {
        jsonlar[o.index] = (jsonlar[o.index] || '') + String(o.delta.partial_json || '')
      }
    } else if (o.type === 'message_delta') {
      stopReason = o.delta?.stop_reason ?? stopReason
      usage = { ...usage, ...(o.usage || {}) }
    }
  }
  jsonlar.forEach((j, i) => {
    if (!bloklar[i]) return
    try { bloklar[i].input = j ? JSON.parse(j) : {} } catch { bloklar[i].input = {}; gecersizArgumanIsaretle(bloklar[i]) }
  })
  const yanit = dusunmeBloklariniAt({ model, content: bloklar.filter(Boolean), stop_reason: stopReason, usage } as unknown as Anthropic.Message)
  try { await olc(g, govde, yanit, h) } catch { /* ölçüm çağrıyı asla düşürmez */ }
  return yanit
}

/**
 * OpenRouter yolunda akış. Birincilde kapılar yalnız henüz söz söylenmemişken devreye girer:
 *  - G4 devre açık → koruyucu akışı; G1 ilk sözden önce taşıma hatası → birincil bir kez → koruyucu akışı;
 *  - G2 hiç metin söylenmediyse (boş / ret / bozuk araç çağrısı) → koruyucu akışı.
 * İlk sözden SONRA kopan akış yeniden söylenmez: kesik cevap olarak döner (saglayici.ts `koptu`), F3 / DEVAMI_EKRANDA
 * yolu işler; birincilin devresine hata yazılır.
 */
async function openRouterAkisKapili(g: AiCagriGirdisi, h: Hedef, metinParcasi: (parca: string) => void): Promise<Anthropic.Message> {
  if (!lunaKapisiMi(h)) {
    const { yanit } = await openRouterAkis(h.govde, metinParcasi)
    await olcSessiz(g, h, yanit)
    return isaretle(yanit, h)
  }
  const birincil = String(h.govde.model)
  const istekId = istekKimligi(g)
  const guclu = async (neden: YukseltmeNedeni, altKod: string) => {
    dususGunlukle(istekId, g.gorev, neden, altKod)
    if (koruyucuKapali()) throw koruyucuKapaliHatasi(neden, altKod)
    const t = gucluyeYukselt(h, neden)
    const { yanit } = await openRouterAkis(t.govde, metinParcasi)
    await olcSessiz(g, t, yanit)
    return isaretle(yanit, t)
  }
  if (!devreBirincilIzinli(birincil)) return guclu('devre', 'acik')
  let sonuc: { yanit: Anthropic.Message; metinVerildi: boolean; koptu?: boolean } | null = null
  let sonHata: unknown = null
  for (let deneme = 0; deneme < 2 && !sonuc; deneme++) {
    if (deneme) await bekle(TASIMA_BEKLEME.ms)
    try {
      sonuc = await openRouterAkis(h.govde, metinParcasi, lunaZamanAsimiMs(h.govde.max_tokens))
    } catch (e) {
      if (!tasimaHatasiMi(e)) { devreNotr(birincil); throw e }
      sonHata = e
    }
  }
  if (!sonuc) {
    devreHata(birincil)
    return guclu('transport', tasimaAltKodu(sonHata))
  }
  await olcSessiz(g, h, sonuc.yanit)
  if (sonuc.koptu) {
    // Söylenmiş söz geri alınmaz: kesik tur olarak döner, koruyucu çağrılmaz.
    devreHata(birincil)
    console.warn(`[ai/akis] istek=${istekId} gorev=${g.gorev} birincil akış ilk sözden sonra koptu — kesik tur, yeniden söylenmez`)
    return isaretle(sonuc.yanit, h)
  }
  // Hiç metin söylenmediyse (boş / ret / bozuk araç) koruyucuya; söylenmiş düşük güvenli metin sesli yolda geri alınamaz.
  if (!sonuc.metinVerildi) {
    const kod = kaliteKodu({ ...g, jsonBekleniyor: false }, sonuc.yanit)
    if (kod) {
      devreHata(birincil)
      return guclu('low_conf', kod)
    }
  }
  devreBasari(birincil)
  return isaretle(sonuc.yanit, h)
}

/**
 * NOTYA-TEK-BEYIN — aiCagir'in akışlı eşi (sesli Ayşe ilk sözü model yazarken söyler). İstek gövdesi, kademe,
 * güvenlik yükseltmesi ve ölçüm aiCagir'le aynı; `metinParcasi` her metin parçasında çağrılır. Dönen mesaj akıştan
 * birleştirilir (text + tool_use blokları, stop_reason, usage) — çağıran onu aiCagir yanıtıyla aynı işler.
 * OpenRouter yolunda SSE chat.completions akışı aynı geri çağrıya bağlanır.
 */
export async function aiAkis(g: AiCagriGirdisi, metinParcasi: (parca: string) => void): Promise<Anthropic.Message> {
  const h = hedefBelirle(g)
  if (h.neden === 'safety') dususGunlukle(istekKimligi(g), g.gorev, 'safety', 'sinyal')
  if (yolSec(String(h.govde.model)) === 'openrouter') return openRouterAkisKapili(g, h, metinParcasi)
  return anthropicAkis(g, h, metinParcasi)
}
