/**
 * BRANS-PAKETI — the patient payload builder (pure, client-safe): resolved modules → what the patient's screen gets.
 * Shared by the server route (lib/portal/bransPaketiSunucu.ts) and the demo portals (lib/portal/bransPaketiDemo.ts).
 * Screening answers and scores never go back to the patient; red-flag rules (professional text) are stripped.
 */
import { PAKET_ACIL_ORTAK, PAKET_ADI, PAKET_SAYFASI, PAKET_YOLU, gunFarki, paketModulu, zamanCizelgesi, type CozulmusModul, type HastaAyarKaydi, type PaketBransi, type PaketCozumu, type PaketIcerik, type SablonKaydi } from './bransPaketi'
import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { taramaZamaniMi } from '@/specialties/diyetisyen/engines/tarama'
import { alisverisListesi, planCoz } from '@/specialties/diyetisyen/engines/plan'
import { levotiroksinGunPlani } from '@/specialties/diyetisyen/engines/ilacBesin'
import type { LabSerisi } from './labSerisi'

export interface Yuk {
  brans: PaketBransi | null
  cozum: PaketCozumu
  sablonlar: Record<string, SablonKaydi>
  hastaAyar: Record<string, HastaAyarKaydi>
  kayitlar: Array<Record<string, any>>
  fotolar: Array<Record<string, any>>
  paylasimOnayi: boolean
  lab: LabSerisi[]
  ilaclar: string[]
}

// ─── patient payload ────────────────────────────────────────────────────────────────────────────────────────────────

export interface HastaPaketModulu {
  kod: string
  tur: CozulmusModul['tanim']['tur']
  baslik: string
  aciklama: string
  icerik: Omit<PaketIcerik, 'bayraklar'>
  baslangic: string | null
  baslangicEtiketi: string | null
  zaman: ReturnType<typeof zamanCizelgesi> | null
  ayar: Record<string, unknown>
  fotoRizaMetni: string | null
  isaretlenir: boolean
  serbestEtiket: boolean
}

export interface HastaPaketi {
  brans: string | null
  sayfa: string | null
  /** the portal page (path under the token) the package renders on — the Bugün card links here */
  yol: string | null
  /** the package's name on the Bugün card */
  ad: string | null
  bugun: string
  moduller: HastaPaketModulu[]
  kayitlar: Array<{ id: string; modul: string; gun: string; veri: Record<string, unknown>; seviye: string | null; at: string }>
  fotolar: Array<{ id: string; modul: string; etiket: string | null; at: string; yorum: string | null; yorumAt: string | null }>
  taramaZamani: boolean
  paylasimOnayi: boolean
  hazirlaniyor: number
  lab: LabSerisi[]
  acil: string
  /** "what matters today" for the page's top strip (same function as the Bugün card) */
  ozet?: PaketBugunOzeti
}

/** What the patient may see of the professional's per-patient settings (never internal notes). */
function hastaAyari(m: CozulmusModul): Record<string, unknown> {
  const a = m.ayar
  const out: Record<string, unknown> = {}
  for (const f of m.tanim.ayarlar || []) {
    if (a[f.id] === undefined) continue
    if (f.tur === 'plan') {
      const p = planCoz(String(a[f.id] || ''))
      out.plan = p.plan
      out.alisveris = alisverisListesi(p.plan)
    } else out[f.id] = a[f.id]
  }
  if (m.tanim.tur === 'ilac-saati' && typeof a.ilacSaati === 'string') out.gunPlani = levotiroksinGunPlani(a.ilacSaati)
  return out
}

const SIRA = { dikkat: 1, hekime_bildir: 2, acil: 3 } as const
/** The highest level a single "yes" on this field can trigger by itself (one-condition flags only). */
function alanIsareti(m: CozulmusModul, alan: string): 'acil' | 'hekime_bildir' | 'dikkat' | undefined {
  let enYuksek: 'acil' | 'hekime_bildir' | 'dikkat' | undefined
  for (const b of m.icerik.bayraklar || []) {
    if (b.kosullar.length !== 1 || b.kosullar[0].alan !== alan || !b.kosullar[0].evet) continue
    if (!enYuksek || SIRA[b.duzey] > SIRA[enYuksek]) enYuksek = b.duzey
  }
  return enYuksek === 'dikkat' ? undefined : enYuksek
}

export function hastaYukuKur(y: Yuk, bugun: string): HastaPaketi {
  const p = hastaYukuHam(y, bugun)
  return { ...p, ozet: bugunOzeti(p) }
}

function hastaYukuHam(y: Yuk, bugun: string): HastaPaketi {
  const kodlar = new Set(y.cozum.moduller.map((m) => m.tanim.kod))
  const tarama = y.cozum.moduller.find((m) => m.tanim.tur === 'tarama')
  const sonTarama = tarama ? y.kayitlar.filter((r) => r.modul === tarama.tanim.kod).map((r) => String(r.gun)).sort().pop() ?? null : null
  return {
    brans: y.brans,
    sayfa: y.brans ? PAKET_SAYFASI[y.brans as KlinikYeniSlug] ?? null : null,
    yol: y.brans ? PAKET_YOLU[y.brans] : null,
    ad: y.brans ? PAKET_ADI[y.brans] : null,
    bugun,
    moduller: y.cozum.moduller.map((m) => {
      const { bayraklar: _b, ...icerik } = m.icerik
      return {
        kod: m.tanim.kod, tur: m.tanim.tur, baslik: m.tanim.baslik, aciklama: m.tanim.aciklama,
        icerik: { ...icerik, alanlar: (icerik.alanlar || []).filter((f) => !f.ayarKosulu || !!m.ayar[f.ayarKosulu]).map((f) => ({ ...f, isaret: alanIsareti(m, f.id) })) },
        baslangic: m.baslangic, baslangicEtiketi: m.tanim.baslangicEtiketi ?? null,
        zaman: m.tanim.tur === 'zaman' && m.icerik.adimlar ? zamanCizelgesi(m.icerik.adimlar, m.baslangic, bugun) : null,
        ayar: hastaAyari(m),
        fotoRizaMetni: m.tanim.fotoRizaMetni ?? null,
        isaretlenir: !!m.tanim.isaretlenir,
        serbestEtiket: !!m.tanim.serbestEtiket,
      }
    }),
    // Screening answers / scores never go back to the patient (only that a screen happened is implied by taramaZamani).
    kayitlar: y.kayitlar.filter((r) => kodlar.has(String(r.modul)) && paketModulu(String(r.modul))?.tur !== 'tarama').slice(0, 200).map((r) => ({
      id: String(r.id), modul: String(r.modul), gun: String(r.gun).slice(0, 10), veri: (r.veri || {}) as Record<string, unknown>, seviye: r.seviye ?? null, at: String(r.created_at),
    })),
    fotolar: y.fotolar.filter((f) => kodlar.has(String(f.modul))).map((f) => ({ id: String(f.id), modul: String(f.modul), etiket: f.etiket ?? null, at: String(f.created_at), yorum: f.uzman_yorum ?? null, yorumAt: f.yorum_at ?? null })),
    taramaZamani: !!tarama && taramaZamaniMi(sonTarama, bugun),
    paylasimOnayi: y.paylasimOnayi,
    hazirlaniyor: y.cozum.hazirlaniyor.length,
    lab: kodlar.has('long-biyo') ? y.lab : [],
    acil: PAKET_ACIL_ORTAK,
  }
}


// ─── "what matters today" (Bugün card + the package page's top strip) ──────────────────────────────────────────────

export interface BugunOgesi {
  kod: string
  tur: HastaPaketModulu['tur']
  baslik: string
  /** one short sentence — what to do today */
  metin: string
  /** done for today (diary entered, programme finished, checklist complete) */
  tamam: boolean
  /** journey progress (timeline: day N of M; checklist / programme: n of m) */
  ilerleme: { n: number; m: number; etiket: string } | null
}

export interface PaketBugunOzeti {
  brans: string | null
  ad: string | null
  yol: string | null
  ogeler: BugunOgesi[]
  /** modules on but waiting for the doctor's acceptance */
  hazirlaniyor: number
  /** a red flag the patient entered today (patient copy is shown on the module itself) */
  bugunBayrak: 'acil' | 'hekime_bildir' | 'dikkat' | null
}

const ONCELIK: Record<string, number> = { zaman: 0, program: 1, gunluk: 2, 'ilac-saati': 2, liste: 3, tarama: 4, foto: 5, tabak: 5, hatirlatma: 6, plan: 7, biyobelirtec: 8 }

/**
 * Pure: the package's "today" — at most `sinir` items, the journey first, then what is still open today.
 * Never invents a step: a timeline without a start date says so; a diary not entered today asks for one entry.
 */
export function bugunOzeti(p: HastaPaketi, sinir = 3): PaketBugunOzeti {
  const bugunKayit = p.kayitlar.filter((k) => k.gun === p.bugun)
  const ogeler: Array<BugunOgesi & { o: number }> = []
  for (const m of p.moduller) {
    const o = ONCELIK[m.tur] ?? 9
    if (m.tur === 'zaman') {
      const adimlar = m.zaman || []
      if (!adimlar.length) continue
      const son = adimlar[adimlar.length - 1]
      const fark = m.baslangic ? gunFarki(m.baslangic, p.bugun) : null
      if (fark == null) { ogeler.push({ kod: m.kod, tur: m.tur, baslik: m.baslik, metin: 'Başlangıç tarihi girildiğinde adımlarınız takvime oturur.', tamam: false, ilerleme: null, o }); continue }
      const bugunAdim = adimlar.find((a) => a.durum === 'bugun')
      const sirada = adimlar.find((a) => a.durum === 'sirada')
      const gecmisSon = [...adimlar].reverse().find((a) => a.durum === 'gecti')
      const metin = bugunAdim ? `Bugün: ${bugunAdim.baslik}` : sirada ? `Sırada: ${sirada.baslik} (${sirada.gun - fark} gün sonra)` : gecmisSon ? `${gecmisSon.baslik} tamamlandı` : adimlar[0].baslik
      const n = Math.max(0, Math.min(fark, son.gun))
      const etiket = m.baslangicEtiketi === 'Son adet tarihi' ? `${Math.floor(Math.max(0, fark) / 7)}. hafta` : `Gün ${Math.max(0, fark)}`
      ogeler.push({ kod: m.kod, tur: m.tur, baslik: m.baslik, metin, tamam: fark >= son.gun, ilerleme: { n, m: Math.max(1, son.gun), etiket }, o })
    } else if (m.tur === 'gunluk' || m.tur === 'ilac-saati') {
      const yapildi = bugunKayit.some((k) => k.modul === m.kod)
      ogeler.push({ kod: m.kod, tur: m.tur, baslik: m.baslik, metin: yapildi ? 'Bugünkü kaydınız alındı.' : 'Bugün bir kayıt girin — bir dakika sürer.', tamam: yapildi, ilerleme: null, o })
    } else if (m.tur === 'program') {
      const satirlar = Array.isArray(m.ayar.satirlar) && (m.ayar.satirlar as unknown[]).length ? (m.ayar.satirlar as unknown[]) : m.icerik.maddeler || []
      if (!satirlar.length) continue
      const yapilan = new Set(bugunKayit.filter((k) => k.modul === m.kod && k.veri.tamam !== false).map((k) => k.veri.madde)).size
      const t = Math.min(yapilan, satirlar.length)
      ogeler.push({ kod: m.kod, tur: m.tur, baslik: m.baslik, metin: t >= satirlar.length ? 'Bugünkü programınız tamam.' : `${satirlar.length - t} adım kaldı.`, tamam: t >= satirlar.length, ilerleme: { n: t, m: satirlar.length, etiket: `${t}/${satirlar.length}` }, o })
    } else if (m.tur === 'liste' && m.isaretlenir) {
      const satirlar = m.icerik.maddeler || []
      if (!satirlar.length) continue
      const durum = new Map<number, boolean>()
      for (const k of [...p.kayitlar].filter((k) => k.modul === m.kod).reverse()) if (typeof k.veri.madde === 'number') durum.set(k.veri.madde as number, k.veri.tamam !== false)
      const t = [...durum.values()].filter(Boolean).length
      ogeler.push({ kod: m.kod, tur: m.tur, baslik: m.baslik, metin: t >= satirlar.length ? 'Listenin tamamı işaretli.' : `${t} / ${satirlar.length} işaretli.`, tamam: t >= satirlar.length, ilerleme: { n: Math.min(t, satirlar.length), m: satirlar.length, etiket: `${Math.min(t, satirlar.length)}/${satirlar.length}` }, o })
    } else if (m.tur === 'tarama' && p.taramaZamani) {
      ogeler.push({ kod: m.kod, tur: m.tur, baslik: m.baslik, metin: 'Kısa bir form sizi bekliyor.', tamam: false, ilerleme: null, o })
    }
  }
  // the journey first, then what is still open, then what is done
  ogeler.sort((a, b) => (a.tur === 'zaman' ? -1 : 0) - (b.tur === 'zaman' ? -1 : 0) || Number(a.tamam) - Number(b.tamam) || a.o - b.o)
  const seviyeler = bugunKayit.map((k) => k.seviye).filter(Boolean) as string[]
  const bugunBayrak = seviyeler.includes('acil') ? 'acil' : seviyeler.includes('hekime_bildir') ? 'hekime_bildir' : seviyeler.includes('dikkat') ? 'dikkat' : null
  return { brans: p.brans, ad: p.ad, yol: p.yol, ogeler: ogeler.slice(0, sinir).map(({ o: _o, ...x }) => x), hazirlaniyor: p.hazirlaniyor, bugunBayrak }
}
