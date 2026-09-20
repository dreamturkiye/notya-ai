/**
 * Hasta Özet kartları — demografi + sağlık geçmişi alanları.
 * notes_encrypted anahtarları intake (hastaKaydinaAktar) ile aynı.
 */
import { cinsiyetTr } from '@/lib/utils/cinsiyet'

export type HastaOzetKayit = {
  ad_soyad: string
  dogum_tarihi: string | null
  cinsiyet: string | null
  telefon: string | null
  eposta: string | null
  sehir: string | null
  kan_grubu: string | null
  anne_adi: string | null
  baba_adi: string | null
  kronik_hastaliklar: string[]
  alerjiler: string | null
  surekli_ilaclar: string | null
  sigara_alkol: string | null
}

export function kronikListesi(notes: Record<string, unknown>): string[] {
  const raw = notes.kronikHastaliklar
  if (Array.isArray(raw)) return raw.map(String).map((x) => x.trim()).filter(Boolean)
  return String(raw || '')
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

export function notlardanOzetAlanlari(
  notes: Record<string, unknown>,
  opts: {
    ad_soyad: string
    dogum_tarihi: string | null
    cinsiyetHam: string | null
    telefon: string | null
    eposta: string | null
  },
): HastaOzetKayit {
  return {
    ad_soyad: opts.ad_soyad,
    dogum_tarihi: opts.dogum_tarihi,
    cinsiyet: cinsiyetTr(opts.cinsiyetHam) || null,
    telefon: opts.telefon,
    eposta: opts.eposta,
    sehir: notes.sehir != null ? String(notes.sehir) || null : null,
    kan_grubu: notes.kanGrubu != null ? String(notes.kanGrubu) || null : null,
    anne_adi: notes.anneAdi != null ? String(notes.anneAdi) || null : null,
    baba_adi: notes.babaAdi != null ? String(notes.babaAdi) || null : null,
    kronik_hastaliklar: kronikListesi(notes),
    alerjiler: notes.alerjiler != null ? String(notes.alerjiler) || null : null,
    surekli_ilaclar: notes.suregenIlaclar != null ? String(notes.suregenIlaclar) || null : null,
    sigara_alkol: notes.sigaraAlkol != null ? String(notes.sigaraAlkol) || null : null,
  }
}

/** Demografide boş alan var mı — kart tıklanarak doldurulabilir. */
export function demografiEksikMi(p: Pick<HastaOzetKayit, 'telefon' | 'eposta' | 'sehir' | 'kan_grubu' | 'anne_adi' | 'baba_adi' | 'dogum_tarihi' | 'cinsiyet'>): boolean {
  return !(
    p.telefon?.trim() &&
    p.eposta?.trim() &&
    p.sehir?.trim() &&
    p.kan_grubu?.trim() &&
    p.anne_adi?.trim() &&
    p.baba_adi?.trim() &&
    p.dogum_tarihi?.trim() &&
    p.cinsiyet?.trim()
  )
}

export function saglikGecmisiEksikMi(p: Pick<HastaOzetKayit, 'kronik_hastaliklar' | 'alerjiler' | 'surekli_ilaclar' | 'sigara_alkol'>): boolean {
  return !(
    (p.kronik_hastaliklar?.length ?? 0) > 0 ||
    p.alerjiler?.trim() ||
    p.surekli_ilaclar?.trim() ||
    p.sigara_alkol?.trim()
  )
}

/** UI Kadın/Erkek → saklama male/female. */
export function cinsiyetSakla(v: string | null | undefined): string | null {
  const t = cinsiyetTr(v)
  if (t === 'Kadın') return 'female'
  if (t === 'Erkek') return 'male'
  return null
}

/**
 * PUT gövdesinden notes_encrypted güncellemesi.
 * undefined = dokunma; string (boş dahil) = yaz.
 */
export function notesOzetGuncelle(
  mevcut: Record<string, unknown>,
  body: Record<string, unknown>,
): { notes: Record<string, unknown>; notesDegisti: boolean } {
  const notes = { ...mevcut }
  let notesDegisti = false
  const yaz = (key: string, val: unknown) => {
    if (val === undefined) return
    notes[key] = val
    notesDegisti = true
  }
  if (body.sehir !== undefined) yaz('sehir', String(body.sehir || '').trim())
  if (body.kan_grubu !== undefined) yaz('kanGrubu', String(body.kan_grubu || '').trim())
  if (body.anne_adi !== undefined) yaz('anneAdi', String(body.anne_adi || '').trim())
  if (body.baba_adi !== undefined) yaz('babaAdi', String(body.baba_adi || '').trim())
  if (body.alerjiler !== undefined) yaz('alerjiler', String(body.alerjiler || '').trim())
  if (body.surekli_ilaclar !== undefined) yaz('suregenIlaclar', String(body.surekli_ilaclar || '').trim())
  if (body.sigara_alkol !== undefined) yaz('sigaraAlkol', String(body.sigara_alkol || '').trim())
  if (body.kronik_hastaliklar !== undefined) {
    const raw = body.kronik_hastaliklar
    const liste = Array.isArray(raw)
      ? raw.map(String).map((x) => x.trim()).filter(Boolean)
      : String(raw || '')
          .split(/[,;\n]+/)
          .map((x) => x.trim())
          .filter(Boolean)
    yaz('kronikHastaliklar', liste)
  }
  return { notes, notesDegisti }
}
