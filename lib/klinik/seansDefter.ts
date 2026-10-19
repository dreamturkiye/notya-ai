/**
 * Klinik seans defteri — ozel_brans_plan içinde tek satır.
 * Yeni tablo yok. Not, portal_satir ve acil kolonuna yazılmaz.
 */
import { klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'
import type { KlinikHastaKayit, KlinikSeansKayit } from '@/lib/klinik/klinikKayit'

export const SEANS_ARAC = 'seans-defter'

export function seansAracMi(arac: string | null | undefined): boolean {
  return arac === SEANS_ARAC
}

export function yasKucukMu(dogum: string | null | undefined, simdi = Date.now()): boolean {
  const iso = String(dogum || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const yas = Math.floor((simdi - Date.parse(`${iso}T00:00:00Z`)) / 31557600000)
  return yas >= 0 && yas < 18
}

export function seansKapisi(girdi: {
  metin: string
  rizaIkiNusha: boolean
  kucuk: boolean
  veliOnam: boolean
  muttefik: boolean
  hekimPlani: boolean
  fotoKvkk: boolean
  kriz112: boolean
  iso: string
}): { hata: string } | { seans: KlinikSeansKayit } {
  const metin = girdi.metin.trim().slice(0, 800)
  if (!metin) return { hata: 'Seans notu boş olamaz.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(girdi.iso)) return { hata: 'Seans günü yok.' }
  if (!girdi.rizaIkiNusha) return { hata: 'Hasta Hakları m.26: iki nüsha rıza işaretlenmeden kayıt yok.' }
  if (girdi.kucuk && !girdi.veliOnam) return { hata: '18 yaş altı: veli / yasal temsilci onamı zorunlu.' }
  if (girdi.muttefik && !girdi.hekimPlani) return { hata: '29.03.2025 md.16: hekim tanısı + plan olmadan uygulama yok.' }
  return {
    seans: {
      id: `ks-${girdi.iso}-${crypto.randomUUID().slice(0, 8)}`,
      iso: girdi.iso,
      metin,
      rizaIkiNusha: true,
      veliOnam: girdi.kucuk ? true : null,
      fotoKvkk: girdi.fotoKvkk,
      hekimPlani: girdi.hekimPlani,
      kriz112: girdi.kriz112,
    },
  }
}

export function seansListesiCoz(girdi: unknown): KlinikSeansKayit[] {
  const ham = Array.isArray(girdi)
    ? girdi
    : girdi && typeof girdi === 'object' && girdi !== null && 'seanslar' in girdi
      ? (girdi as { seanslar?: unknown }).seanslar
      : []
  if (!Array.isArray(ham)) return []
  const out: KlinikSeansKayit[] = []
  for (const s of ham) {
    if (!s || typeof s !== 'object') continue
    const r = s as Record<string, unknown>
    const iso = String(r.iso || '')
    const metin = String(r.metin || '').trim().slice(0, 800)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !metin) continue
    out.push({
      id: String(r.id || `ks-${iso}-${out.length}`).slice(0, 80),
      iso,
      metin,
      rizaIkiNusha: r.rizaIkiNusha === true,
      dosyaNushaId: typeof r.dosyaNushaId === 'string' ? r.dosyaNushaId : undefined,
      hastaNushaId: typeof r.hastaNushaId === 'string' ? r.hastaNushaId : undefined,
      veliOnam: r.veliOnam === true ? true : r.veliOnam === false ? false : null,
      fotoKvkk: r.fotoKvkk === true,
      hekimPlani: r.hekimPlani === true,
      kriz112: r.kriz112 === true,
    })
  }
  return out.slice(0, 40)
}

/** Sunucuda satır varsa cihaz listesi yok sayılır. Boş sunucu, cihaz listesini taşır. */
export function seansBasaEkle(sunucu: KlinikSeansKayit[], yeni: KlinikSeansKayit, eski: KlinikSeansKayit[]): KlinikSeansKayit[] {
  const taban = sunucu.length ? sunucu : eski
  return [yeni, ...taban.filter((s) => s.id !== yeni.id)].slice(0, 40)
}

export function seansPortalYuku(): { portal_satir: []; acil: null } {
  return { portal_satir: [], acil: null }
}

type PlanSatiri = {
  patient_id?: string | null
  slug?: string | null
  arac?: string | null
  girdi?: unknown
}

export function defterSunucuIle(
  yerel: Record<string, KlinikHastaKayit>,
  planlar: PlanSatiri[],
  dal: KlinikYeniSlug,
): Record<string, KlinikHastaKayit> {
  const out: Record<string, KlinikHastaKayit> = { ...yerel }
  for (const p of planlar) {
    if (!seansAracMi(p.arac)) continue
    const seanslar = seansListesiCoz(p.girdi)
    const id = String(p.patient_id || '')
    if (!id || !seanslar.length) continue
    const onceki = out[id]
    out[id] = {
      patientId: id,
      dal: klinikSlugCoz(String(p.slug || '')) || onceki?.dal || dal,
      seanslar,
      sonrakiVade: onceki?.sonrakiVade,
      vadeEtiket: onceki?.vadeEtiket,
    }
  }
  return out
}
