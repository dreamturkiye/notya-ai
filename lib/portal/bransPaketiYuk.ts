/**
 * BRANS-PAKETI — the patient payload builder (pure, client-safe): resolved modules → what the patient's screen gets.
 * Shared by the server route (lib/portal/bransPaketiSunucu.ts) and the demo portals (lib/portal/bransPaketiDemo.ts).
 * Screening answers and scores never go back to the patient; red-flag rules (professional text) are stripped.
 */
import { PAKET_ACIL_ORTAK, PAKET_SAYFASI, paketModulu, zamanCizelgesi, type CozulmusModul, type HastaAyarKaydi, type PaketCozumu, type PaketIcerik, type SablonKaydi } from './bransPaketi'
import type { KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import { taramaZamaniMi } from '@/specialties/diyetisyen/engines/tarama'
import { alisverisListesi, planCoz } from '@/specialties/diyetisyen/engines/plan'
import { levotiroksinGunPlani } from '@/specialties/diyetisyen/engines/ilacBesin'
import type { LabSerisi } from './labSerisi'

export interface Yuk {
  brans: KlinikYeniSlug | null
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
}

export interface HastaPaketi {
  brans: string | null
  sayfa: string | null
  bugun: string
  moduller: HastaPaketModulu[]
  kayitlar: Array<{ id: string; modul: string; gun: string; veri: Record<string, unknown>; seviye: string | null; at: string }>
  fotolar: Array<{ id: string; modul: string; etiket: string | null; at: string; yorum: string | null; yorumAt: string | null }>
  taramaZamani: boolean
  paylasimOnayi: boolean
  hazirlaniyor: number
  lab: LabSerisi[]
  acil: string
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

export function hastaYukuKur(y: Yuk, bugun: string): HastaPaketi {
  const kodlar = new Set(y.cozum.moduller.map((m) => m.tanim.kod))
  const tarama = y.cozum.moduller.find((m) => m.tanim.tur === 'tarama')
  const sonTarama = tarama ? y.kayitlar.filter((r) => r.modul === tarama.tanim.kod).map((r) => String(r.gun)).sort().pop() ?? null : null
  return {
    brans: y.brans,
    sayfa: y.brans ? PAKET_SAYFASI[y.brans] : null,
    bugun,
    moduller: y.cozum.moduller.map((m) => {
      const { bayraklar: _b, ...icerik } = m.icerik
      return {
        kod: m.tanim.kod, tur: m.tanim.tur, baslik: m.tanim.baslik, aciklama: m.tanim.aciklama,
        icerik: { ...icerik, alanlar: (icerik.alanlar || []).filter((f) => !f.ayarKosulu || !!m.ayar[f.ayarKosulu]) },
        baslangic: m.baslangic, baslangicEtiketi: m.tanim.baslangicEtiketi ?? null,
        zaman: m.tanim.tur === 'zaman' && m.icerik.adimlar ? zamanCizelgesi(m.icerik.adimlar, m.baslangic, bugun) : null,
        ayar: hastaAyari(m),
        fotoRizaMetni: m.tanim.fotoRizaMetni ?? null,
        isaretlenir: !!m.tanim.isaretlenir,
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

