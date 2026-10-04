/**
 * NOTYA-TETKIK-NOT-01 — muayene notundaki istenen tetkikler (reçete/aşı ile aynı desen).
 *
 * `content_tetkikler` hekimin düzenlediği yapılandırılmış listedir; yazdırma ve onayda
 * `hasta_tetkik_istemleri`'ne giden TEK kaynak. Boşsa plan/tedavi metninden katalog eşleşmesiyle
 * çıkarılır (LLM yok — lib/doktor/tetkikKatalogu + bilinen takma adlar).
 */
import { trAramaNormalize } from '@/lib/utils/turkceArama'
import { NUMUNE_ADI, TUM_TETKIKLER, type Numune, type Tetkik } from '@/lib/doktor/tetkikKatalogu'
import { planIfadeleriniCikar } from '@/lib/doktor/planIfadesi'

export const NOT_TETKIK_AZAMI = 40

export type NotTetkik = {
  ad: string
  numune?: Numune | null
  aclik?: boolean
  not?: string | null
}

/** Klinik konuşma / plan metni → katalog adı. */
const TAKMA: [string, string][] = [
  ['tam kan sayimi', 'Tam kan sayımı (Hemogram)'],
  ['tam kan', 'Tam kan sayımı (Hemogram)'],
  ['hemogram', 'Tam kan sayımı (Hemogram)'],
  ['kan sayimi', 'Tam kan sayımı (Hemogram)'],
  ['demir baglama kapasitesi', 'Total demir bağlama kapasitesi (TDBK)'],
  ['demir baglama', 'Total demir bağlama kapasitesi (TDBK)'],
  ['total demir baglama', 'Total demir bağlama kapasitesi (TDBK)'],
  ['tdbk', 'Total demir bağlama kapasitesi (TDBK)'],
  ['tibc', 'Total demir bağlama kapasitesi (TDBK)'],
  ['serum demir', 'Demir'],
  ['25-oh vitamin d', '25-OH Vitamin D'],
  ['25 oh vitamin d', '25-OH Vitamin D'],
  ['25 hidroksi vitamin d', '25-OH Vitamin D'],
  ['vitamin d', '25-OH Vitamin D'],
  ['d vitamini', '25-OH Vitamin D'],
  ['tam idrar tahlili', 'Tam idrar tetkiki (TİT)'],
  ['tam idrar tetkiki', 'Tam idrar tetkiki (TİT)'],
  ['tam idrar', 'Tam idrar tetkiki (TİT)'],
  ['idrar tahlili', 'Tam idrar tetkiki (TİT)'],
  ['idrar analizi', 'Tam idrar tetkiki (TİT)'],
  ['tit', 'Tam idrar tetkiki (TİT)'],
  ['idrar kulturu', 'İdrar kültürü + antibiyogram'],
  ['idrar kulturu + antibiyogram', 'İdrar kültürü + antibiyogram'],
  ['demir paneli', 'Demir'], // panel → Demir + TDBK + Ferritin ayrı eşleşir
]

const KATALOG_AD = new Map(TUM_TETKIKLER.map((t) => [t.ad, t]))
const KATALOG_NORM = new Map(TUM_TETKIKLER.map((t) => [trAramaNormalize(t.ad), t]))

/** Uzun takma adlar önce — "tam kan" "tam kan sayimi"yi yemesin diye uzunluk sırası. */
const TAKMA_SIRALI = [...TAKMA].sort((a, b) => b[0].length - a[0].length)

function katalogdan(ad: string): Tetkik | null {
  return KATALOG_AD.get(ad) || KATALOG_NORM.get(trAramaNormalize(ad)) || null
}

function satira(ad: string, ekstra?: Partial<NotTetkik>): NotTetkik | null {
  const k = katalogdan(ad)
  if (k) {
    return {
      ad: k.ad,
      numune: k.n,
      aclik: !!k.aclik,
      not: ekstra?.not ?? k.not ?? null,
    }
  }
  const temiz = ad.trim()
  if (!temiz) return null
  return { ad: temiz.slice(0, 160), numune: ekstra?.numune ?? null, aclik: !!ekstra?.aclik, not: ekstra?.not ?? null }
}

/** Ham listeyi normalize et (ad zorunlu, azami, tekrarsız). */
export function notTetkikleriniTemizle(ham: unknown): NotTetkik[] {
  if (!Array.isArray(ham)) return []
  const out: NotTetkik[] = []
  const gorulen = new Set<string>()
  for (const it of ham) {
    const o = (it && typeof it === 'object' ? it : {}) as Record<string, unknown>
    const adHam = String(o.ad || o.tetkik_adi || '').trim()
    if (!adHam) continue
    const s = satira(adHam, {
      numune: (typeof o.numune === 'string' ? o.numune : null) as Numune | null,
      aclik: !!o.aclik,
      not: typeof o.not === 'string' ? o.not : typeof o.notlar === 'string' ? o.notlar : null,
    })
    if (!s) continue
    const anahtar = trAramaNormalize(s.ad)
    if (gorulen.has(anahtar)) continue
    gorulen.add(anahtar)
    out.push(s)
    if (out.length >= NOT_TETKIK_AZAMI) break
  }
  return out
}

/** Metinde geçen katalog / takma ad eşleşmeleri (sıra korunur). */
function metindenEslesmeler(metin: string): string[] {
  const n = trAramaNormalize(metin)
  if (!n) return []
  const adlar: string[] = []
  const ekle = (ad: string) => {
    if (!adlar.includes(ad)) adlar.push(ad)
  }

  // Demir paneli → üç kalem
  if (/\bdemir paneli\b/.test(n)) {
    ekle('Demir')
    ekle('Total demir bağlama kapasitesi (TDBK)')
    ekle('Ferritin')
  }

  for (const [takma, katalog] of TAKMA_SIRALI) {
    if (takma === 'demir paneli') continue
    const re = new RegExp(`(^|[^a-z0-9])${takma.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`)
    if (re.test(n)) ekle(katalog)
  }

  // Katalog adları (parantez içi kısaltma dahil) — uzun adlar önce
  const katalogNormlar = [...KATALOG_NORM.entries()].sort((a, b) => b[0].length - a[0].length)
  for (const [norm, t] of katalogNormlar) {
    if (norm.length < 4) continue
    // Çok kısa / genel ("crp" 3 harf — KISA için ayrı)
    const re = new RegExp(`(^|[^a-z0-9])${norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`)
    if (re.test(n)) ekle(t.ad)
  }

  // Kısa klinik kısaltmalar
  for (const [kisa, ad] of [
    ['crp', 'CRP'],
    ['tsh', 'TSH'],
    ['hb', 'Tam kan sayımı (Hemogram)'],
    ['ferritin', 'Ferritin'],
  ] as const) {
    const re = new RegExp(`(^|[^a-z0-9])${kisa}($|[^a-z0-9])`)
    if (re.test(n)) ekle(ad)
  }

  return adlar
}

/**
 * Plan / tedavi metninden istenen tetkikler.
 * Önce plan ifadeleri (istendi/önerildi/planlandı); yoksa fiil ipucu + eşleşme ile tüm metin.
 */
export function metindenTetkikleriCikar(...metinler: (string | null | undefined)[]): NotTetkik[] {
  const birlesik = metinler.map((m) => String(m || '').trim()).filter(Boolean).join('\n')
  if (!birlesik) return []

  const ifadeler = planIfadeleriniCikar(birlesik).filter(
    (p) => p.konu === 'lab' && (p.durum === 'istendi' || p.durum === 'onerildi' || p.durum === 'planlandi'),
  )

  const adlar: string[] = []
  const ekle = (ad: string) => { if (!adlar.includes(ad)) adlar.push(ad) }

  if (ifadeler.length) {
    for (const p of ifadeler) {
      for (const ad of metindenEslesmeler(p.cumle)) ekle(ad)
    }
  } else {
    // Fiil yoksa bile "… bakılacak / istendi" gibi genel lab cümlesi yoksa çıkarma —
    // yanlış pozitif (özgeçmişte "ferritin normaldi") istemiyoruz.
    const n = trAramaNormalize(birlesik)
    const labFiil = /\b(istendi|istenmistir|bakilacak|bakilsin|bakilmasi|tetkik edilecek|gonderildi|isteyelim)\b/.test(n)
      || /\b(tetkik|tahlil|lab)\b/.test(n) && /\b(istendi|bakil|oner|plan)\b/.test(n)
    if (!labFiil) return []
    for (const ad of metindenEslesmeler(birlesik)) ekle(ad)
  }

  return notTetkikleriniTemizle(adlar.map((ad) => ({ ad })))
}

/** Mevcut liste boşsa metinden tamamla; doluysa dokunma (hekim otoritesi). */
export function tetkikleriMetindenTamamla(
  mevcut: NotTetkik[],
  metinler: (string | null | undefined)[],
): NotTetkik[] {
  if (mevcut.length) return mevcut
  return metindenTetkikleriCikar(...metinler)
}

/** Form satırı / textarea → NotTetkik[] (her satır bir ad; " — " sonrası not). */
export function tetkikMetniniCoz(metin: string): NotTetkik[] {
  return notTetkikleriniTemizle(
    metin.split('\n').map((satir) => {
      const t = satir.trim().replace(/^\d+[.)]\s*/, '')
      if (!t) return null
      const p = t.split(' — ').map((x) => x.trim())
      return { ad: p[0] || '', not: p[1] || null }
    }).filter(Boolean),
  )
}

export function tetkikMetnine(liste: NotTetkik[]): string {
  return liste.map((t) => {
    const ekstra: string[] = []
    if (t.numune && NUMUNE_ADI[t.numune]) ekstra.push(NUMUNE_ADI[t.numune])
    if (t.aclik) ekstra.push('açlık')
    if (t.not) ekstra.push(t.not)
    return ekstra.length ? `${t.ad} — ${ekstra.join(', ')}` : t.ad
  }).join('\n')
}

/** Yazdırma / API için numune etiketi. */
export function tetkikNumuneEtiketi(t: NotTetkik): string {
  const n = t.numune && NUMUNE_ADI[t.numune] ? NUMUNE_ADI[t.numune] : ''
  const parcalar = [n, t.aclik ? 'açlık gerekir' : '', t.not || ''].filter(Boolean)
  return parcalar.join(', ')
}
