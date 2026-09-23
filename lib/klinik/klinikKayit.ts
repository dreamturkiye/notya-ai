/**
 * Klinik seans / rıza / vade kaydı — cihaz-yerel elektronik dosya.
 * Ayakta Teşhis md.24 / 29.03.2025 md.18 yükümlülüğünü belgeler; SBİYS iddia etmez.
 */
import { muttefikMeslekMi, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

export type KlinikSeansKayit = {
  id: string
  iso: string
  metin: string
  rizaIkiNusha: boolean
  veliOnam: boolean | null
  fotoKvkk: boolean
  hekimPlani: boolean
  kriz112: boolean
}

export type KlinikHastaKayit = {
  patientId: string
  dal: KlinikYeniSlug
  seanslar: KlinikSeansKayit[]
  sonrakiVade?: string
  vadeEtiket?: string
}

export type KlinikKohortSatir = {
  patientId: string
  ad: string
  durum: 'gecikti' | 'bugun' | 'yaklasiyor' | 'riza-eksik' | '112'
  ozet: string
  vade?: string
}

export function klinikKayitAnahtar(userId: string): string {
  return `notya-klinik-kayit:${userId}`
}

export function klinikKayitCoz(ham: string | null | undefined): Record<string, KlinikHastaKayit> {
  try {
    const j = JSON.parse(String(ham || '{}'))
    return j && typeof j === 'object' ? j as Record<string, KlinikHastaKayit> : {}
  } catch {
    return {}
  }
}

export function rizaEksikMi(kayit: KlinikHastaKayit | undefined, dal: string): boolean {
  if (!kayit?.seanslar.length) return true
  const son = kayit.seanslar[0]
  if (!son.rizaIkiNusha) return true
  if (muttefikMeslekMi(dal) && !son.hekimPlani) return true
  return false
}

export function seansEkle(
  defter: Record<string, KlinikHastaKayit>,
  girdi: { patientId: string; dal: KlinikYeniSlug; seans: Omit<KlinikSeansKayit, 'id'> },
): Record<string, KlinikHastaKayit> {
  const onceki = defter[girdi.patientId]
  const seans: KlinikSeansKayit = { ...girdi.seans, id: `ks-${girdi.seans.iso}-${girdi.seans.metin.length}` }
  return {
    ...defter,
    [girdi.patientId]: {
      patientId: girdi.patientId,
      dal: girdi.dal,
      seanslar: [seans, ...(onceki?.seanslar || [])].slice(0, 40),
      sonrakiVade: onceki?.sonrakiVade,
      vadeEtiket: onceki?.vadeEtiket,
    },
  }
}

export function vadeYaz(
  defter: Record<string, KlinikHastaKayit>,
  girdi: { patientId: string; dal: KlinikYeniSlug; vade: string; etiket: string },
): Record<string, KlinikHastaKayit> {
  const onceki = defter[girdi.patientId]
  return {
    ...defter,
    [girdi.patientId]: {
      patientId: girdi.patientId,
      dal: girdi.dal,
      seanslar: onceki?.seanslar || [],
      sonrakiVade: girdi.vade,
      vadeEtiket: girdi.etiket,
    },
  }
}

export function klinikKohortDerle(girdi: {
  dal: string
  bugun: string
  hastalar: Array<{ id: string; name: string; last_visit?: string }>
  randevular: Array<{ patientId?: string | null; hastaAdi: string; baslangic: string }>
  defter: Record<string, KlinikHastaKayit>
}): KlinikKohortSatir[] {
  const bugun = girdi.bugun
  const satirlar: KlinikKohortSatir[] = []
  const gorulen = new Set<string>()

  for (const h of girdi.hastalar) {
    gorulen.add(h.id)
    const kayit = girdi.defter[h.id]
    if (kayit?.seanslar[0]?.kriz112) {
      satirlar.push({ patientId: h.id, ad: h.name, durum: '112', ozet: '112 bayrağı — portal beklenmez' })
      continue
    }
    if (rizaEksikMi(kayit, girdi.dal)) {
      satirlar.push({ patientId: h.id, ad: h.name, durum: 'riza-eksik', ozet: 'Son seans rıza / hekim planı eksik' })
      continue
    }
    const vade = kayit?.sonrakiVade
    if (vade && /^\d{4}-\d{2}-\d{2}$/.test(vade)) {
      const fark = Math.round((Date.parse(vade + 'T12:00:00Z') - Date.parse(bugun + 'T12:00:00Z')) / 86400000)
      if (fark < 0) satirlar.push({ patientId: h.id, ad: h.name, durum: 'gecikti', ozet: `${kayit?.vadeEtiket || 'İzlem'} ${vade}`, vade })
      else if (fark === 0) satirlar.push({ patientId: h.id, ad: h.name, durum: 'bugun', ozet: `${kayit?.vadeEtiket || 'İzlem'} bugün`, vade })
      else if (fark <= 7) satirlar.push({ patientId: h.id, ad: h.name, durum: 'yaklasiyor', ozet: `${kayit?.vadeEtiket || 'İzlem'} ${vade}`, vade })
      continue
    }
    const son = (h.last_visit || '').slice(0, 10)
    if (son && /^\d{4}-\d{2}-\d{2}$/.test(son)) {
      const gecen = Math.round((Date.parse(bugun + 'T12:00:00Z') - Date.parse(son + 'T12:00:00Z')) / 86400000)
      if (gecen >= 21) satirlar.push({ patientId: h.id, ad: h.name, durum: 'gecikti', ozet: `Son kayıt ${son} · 21 gün+` })
    }
  }

  for (const rv of girdi.randevular) {
    const iso = String(rv.baslangic || '').slice(0, 10)
    if (iso !== bugun) continue
    const id = rv.patientId || `rv-${rv.hastaAdi}`
    if (gorulen.has(id) && satirlar.some((s) => s.patientId === id && (s.durum === '112' || s.durum === 'bugun'))) continue
    if (!satirlar.some((s) => s.patientId === id && s.durum === 'bugun')) {
      satirlar.push({ patientId: id, ad: rv.hastaAdi, durum: 'bugun', ozet: 'Bugünkü randevu · seans aç' })
    }
  }

  const sira = { '112': 0, 'riza-eksik': 1, gecikti: 2, bugun: 3, yaklasiyor: 4 }
  return satirlar.sort((a, b) => sira[a.durum] - sira[b.durum] || a.ad.localeCompare(b.ad, 'tr'))
}
