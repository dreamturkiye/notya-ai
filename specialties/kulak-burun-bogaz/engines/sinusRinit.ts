/**
 * KBB-EXCEPTIONAL-01 — Burun / sinüs ve alerjik rinit kısa protokol kontrol listesi. SAF fonksiyon.
 *
 * Motor TANI KOYMAZ ve İLAÇ/DOZ YAZMAZ. Yaptığı iş: ayaktan poliklinikte burun tıkanıklığı ve yüz
 * ağrısı şikâyetiyle gelen hastada hekimin atlamak istemediği soruları ve "bu vizitte karara bağla"
 * başlıklarını listelemek. Tedavi basamağı yalnız SINIF düzeyinde anılır; seçim ve doz hekimindedir.
 */
import type { Dipnot } from './kbb'

export type BurunSikayeti = 'tikaniklik' | 'akinti' | 'gecehorlama' | 'koku_kaybi' | 'yuz_agrisi' | 'hapsirma_kasinti' | 'burun_kanamasi'

export const BURUN_SIKAYET_AD: Record<BurunSikayeti, string> = {
  tikaniklik: 'Burun tıkanıklığı',
  akinti: 'Burun akıntısı / geniz akıntısı',
  gecehorlama: 'Horlama / ağız açık uyuma',
  koku_kaybi: 'Koku alma azalması veya kaybı',
  yuz_agrisi: 'Yüz ağrısı / basınç hissi',
  hapsirma_kasinti: 'Hapşırma, burun-göz kaşıntısı',
  burun_kanamasi: 'Burun kanaması',
}
export const BURUN_SIKAYET_LISTESI = Object.keys(BURUN_SIKAYET_AD) as BurunSikayeti[]

/** Anterior rinoskopi / endoskopi bulgu kutucukları — hekim işaretler. */
export const BURUN_MUAYENE_BULGULARI: readonly string[] = [
  'Alt konkalar hipertrofik',
  'Septum deviasyonu izleniyor',
  'Mukoza soluk / ödemli',
  'Mukopürülan akıntı izleniyor',
  'Polipoid değişiklik izleniyor',
  'Kanama odağı (Little alanı) izleniyor',
  'Muayene rahat değerlendirilemedi',
]

/** Hekimin bu vizitte karara bağlaması beklenen başlıklar (tanı değil, karar başlığı). */
const KARAR_BASLIKLARI: Array<{ kosul: (s: Set<BurunSikayeti>, sure: SikayetSuresi) => boolean; baslik: string }> = [
  { kosul: (s) => s.has('koku_kaybi'), baslik: 'Koku kaybı süresi ve tek/iki taraflı olduğu kaydedilsin; ileri değerlendirme kararı verilsin' },
  { kosul: (s) => s.has('burun_kanamasi'), baslik: 'Kanama sıklığı, antikoagülan kullanımı ve kanama odağı kaydedilsin' },
  { kosul: (s) => s.has('gecehorlama'), baslik: 'Tanıklı apne ve gündüz uykululuk sorgulansın; uyku tetkiki sevk kararı verilsin' },
  { kosul: (s, sure) => s.has('yuz_agrisi') && sure !== 'akut', baslik: 'Yüz ağrısı 12 haftadan uzunsa görüntüleme / endoskopi kararı verilsin' },
  { kosul: (s, sure) => s.has('tikaniklik') && sure === 'kronik', baslik: 'Kronik tıkanıklıkta yapısal (septum/konka) ve mukozal nedenler ayrı ayrı değerlendirilsin' },
  { kosul: (s) => s.has('hapsirma_kasinti'), baslik: 'Tetikleyici / mevsimsellik ve alerji testi gereği hekim tarafından değerlendirilsin' },
]

export type SikayetSuresi = 'akut' | 'subakut' | 'kronik'
export const SURE_AD: Record<SikayetSuresi, string> = {
  akut: '4 haftadan kısa',
  subakut: '4–12 hafta',
  kronik: '12 haftadan uzun',
}

/**
 * Tedavi basamakları SINIF düzeyindedir ve hangi ilacın seçileceğini SÖYLEMEZ — hekimin hangi
 * basamakları konuştuğunu kayda geçirmek içindir. Hiçbir maddede doz, süre veya marka yoktur.
 */
export const TEDAVI_BASAMAKLARI: readonly string[] = [
  'Tetikleyicilerden kaçınma ve ortam önerileri konuşuldu',
  'Burun yıkama / salin uygulaması anlatıldı',
  'Topikal burun spreyi sınıfı hekim tarafından değerlendirildi (seçim ve doz hekimin)',
  'Sistemik tedavi gereği hekim tarafından değerlendirildi (seçim ve doz hekimin)',
  'Alerji değerlendirmesi / test gereği konuşuldu',
  'Görüntüleme veya endoskopi gereği değerlendirildi',
  'Cerrahi değerlendirme gereği konuşuldu (karar ve zamanlama hekimin)',
]

export interface SinusRinitGirdi {
  sikayetler: BurunSikayeti[]
  sure: SikayetSuresi
  muayeneBulgulari: string[]
  basamaklar: string[]
  hekimNotu?: string
}

export interface SinusRinitSonuc {
  satirlar: string[]
  metin: string
  kararBasliklari: string[]
  eksikler: string[]
  dipnot: Dipnot
}

const KILIT_SATIRI =
  'Kontrol listesi karar desteğidir; tanı, ilaç seçimi ve doz kararı hekimindedir. Notya ilaç veya doz yazmaz.'

export function sinusRinitNotu(g: SinusRinitGirdi): SinusRinitSonuc {
  const sikayetler = (g.sikayetler || []).filter((x) => BURUN_SIKAYET_LISTESI.includes(x))
  const kume = new Set(sikayetler)
  const sure: SikayetSuresi = g.sure === 'akut' || g.sure === 'subakut' || g.sure === 'kronik' ? g.sure : 'akut'

  const satirlar: string[] = []
  const eksikler: string[] = []

  if (!sikayetler.length) eksikler.push('Şikâyet işaretlenmedi')
  else satirlar.push(`Şikâyetler (${SURE_AD[sure]}): ${sikayetler.map((x) => BURUN_SIKAYET_AD[x]).join('; ')}.`)

  const bulgular = (g.muayeneBulgulari || []).filter((x) => BURUN_MUAYENE_BULGULARI.includes(x))
  if (bulgular.length) satirlar.push(`Burun muayenesi: ${bulgular.join('; ')}.`)
  else eksikler.push('Burun muayenesi bulgusu işaretlenmedi')

  const basamaklar = (g.basamaklar || []).filter((x) => TEDAVI_BASAMAKLARI.includes(x))
  if (basamaklar.length) satirlar.push(`Konuşulan basamaklar: ${basamaklar.join('; ')}.`)

  const hekimNotu = String(g.hekimNotu || '').trim()
  if (hekimNotu) satirlar.push(`Hekim notu: ${hekimNotu.slice(0, 1000)}`)

  const kararBasliklari = KARAR_BASLIKLARI.filter((k) => k.kosul(kume, sure)).map((k) => k.baslik)

  return {
    satirlar,
    metin: [...satirlar, KILIT_SATIRI].join('\n'),
    kararBasliklari,
    eksikler,
    dipnot: {
      ref: 'TKBBD',
      not: 'Burun / sinüs değerlendirmesinde süre (akut · subakut · kronik) ve eşlik eden bulgular sorgulanır; tanı ve tedavi seçimi hekimindedir.',
    },
  }
}
