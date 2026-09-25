/**
 * Scan the compiled patient dossier for Hasta Formu headings.
 *
 * Form answers used to live only on the intake row. Epikriz / SOAP / belge özeti often
 * already contain the same facts (especially Doğum Tarihi) when the form was never filled.
 * This module is label-driven: CORE + branş form etiketleri, not a second field list.
 *
 * KVKK: identity/contact fields are never returned to the model (ad, TC, telefon…).
 * BRANŞ: pediatri-only headings (baş çevresi, doğum kilosu…) stay behind pediatrikBaglamMi.
 */
import { CORE_BOLUMLER, type IntakeAlan } from '@/lib/intake/coreAlanlar'
import { BRANS_SORULARI } from '@/lib/intake/bransSorulari'
import { pediatrikBaglamMi } from '@/lib/specialties/kapsam'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'

/** Never surface these to Ayşe / the model even if a belge quotes them. */
const GIZLI = new Set([
  'tcKimlik', 'ad', 'soyad', 'telefon', 'eposta', 'adres',
  'acilKisiAdi', 'acilKisiTelefon', 'acilKisiYakinlik',
  'policeNo', 'kurumAdi',
  'veliAd', 'veliSoyad', 'veliTelefon', 'veliDigerAdSoyad', 'veliKimlikTeyidi',
  'kvkkOnay', 'iletisimOnay', 'iletisimIzniWhatsapp', 'iletisimIzniEposta',
])

/** Pediatri form + clinical headings that must not leak to adult branşlar. */
const PEDIATRIK_ALAN = new Set([
  'basCevresiPed', 'dogumKilosuPed', 'dogumBoyuPed', 'gebelikHaftasiPed',
  'gebelikKomplikasyonuPed', 'dogumSekliPed', 'dogumSonrasiPed', 'dogumSonrasiAciklamaPed',
  'anneBoyPed', 'babaBoyPed', 'basvuruNedeniPed',
])

const EK_ETIKET: Record<string, string[]> = {
  dogumTarihi: ['Doğum Tarihi', 'Dogum Tarihi', 'D.Tarihi', 'D.T.', 'Date of Birth', 'Birth Date', 'Doğum tar.'],
  cinsiyet: ['Cinsiyet', 'Gender', 'Sex'],
  dogumYeri: ['Doğum Yeri', 'Dogum Yeri', 'Birth Place'],
  babaAdi: ['Baba Adı', 'Baba Adi', 'Baba'],
  anneAdi: ['Ana Adı', 'Anne Adı', 'Anne Adi', 'Anne'],
  kanGrubu: ['Kan Grubu', 'Blood Type', 'Kan gurubu'],
  medeniDurum: ['Medeni Durum'],
  kronikHastaliklar: ['Kronik Hastalık', 'Kronik hastalıklar', 'Özgeçmiş'],
  alerjiAciklama: ['Alerji', 'Bilinen Alerji'],
  kullanilanIlaclar: ['Kullandığı ilaç', 'Sürekli ilaç', 'İlaç Adı'],
  aileOykusu: ['Aile Öyküsü', 'Aile Sağlık'],
  sigara: ['Sigara'],
  alkol: ['Alkol'],
  dogumKilosuPed: ['Doğum Kilosu', 'Doğum ağırlığı', 'Doğum Agirligi'],
  dogumBoyuPed: ['Doğum Boyu'],
  basCevresiPed: ['Baş Çevresi', 'Bas Cevresi'],
  dogumSekliPed: ['Doğum Şekli', 'Doğum sekli'],
}

export interface DosyaAlanBulgu {
  id: string
  etiket: string
  deger: string
  /** Short quote so the doctor sees provenance ("epikriz satırı"). */
  alinti: string
}

export interface TaraSecenek {
  brans?: string | null
  /** Resolved ISO DOB when known — used only for the pediatric clinical gate. */
  hastaDogumIso?: string | null
  /** Field ids already filled (form or patient row) — skip those. */
  dolu?: Iterable<string>
}

function kacis(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isoTarih(ham: string): string | null {
  const s = ham.trim().replace(/\s+/g, '')
  let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return s.slice(0, 10)
  return null
}

function degerTemizle(ham: string): string {
  return ham.replace(/\s+/g, ' ').replace(/[.;,]+$/, '').trim().slice(0, 160)
}

function alanlar(brans: SpecialtyKey | null): IntakeAlan[] {
  const liste: IntakeAlan[] = CORE_BOLUMLER.flatMap((b) => b.alanlar)
  if (brans && BRANS_SORULARI[brans]) liste.push(...BRANS_SORULARI[brans].alanlar)
  return liste.filter((a) => a.tur !== 'bolum-basligi' && !GIZLI.has(a.id))
}

function etiketler(alan: IntakeAlan): string[] {
  const ekstra = EK_ETIKET[alan.id] || []
  return [...new Set([alan.etiket, ...ekstra].filter((e) => e && e.length >= 2 && e.length <= 60))]
    .sort((a, b) => b.length - a.length)
}

/**
 * Labeled DOB only — unlabeled dates are visit / vaccine dates and must not become birth date.
 */
export function dogumTarihiTara(metin: string): DosyaAlanBulgu | null {
  const t = String(metin || '')
  const desenler = [
    /(?:do[gğ]um\s*tarihi|d\.?\s*tarihi|date\s*of\s*birth|birth\s*date|d\.?\s*t\.?)\s*[:：=]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})/i,
    /(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})\s+tarihinde\s+do[gğ]du/i,
    /(?:tarihinde\s+do[gğ]du|do[gğ]du)\s*[:：]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})/i,
    /(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})\s+(?:tarihinde\s+)?do[gğ]an/i,
  ]
  for (const re of desenler) {
    const m = t.match(re)
    if (!m?.[1]) continue
    const iso = isoTarih(m[1])
    if (!iso) continue
    return {
      id: 'dogumTarihi',
      etiket: 'Doğum Tarihi',
      deger: iso,
      alinti: degerTemizle(m[0]).slice(0, 80),
    }
  }
  return null
}

function satirDeger(metin: string, etiket: string): { deger: string; alinti: string } | null {
  const re = new RegExp(
    `(?:^|[\\n•\\-])\\s*${kacis(etiket)}\\s*[:：=]\\s*(.+?)(?:\\n|$)`,
    'i'
  )
  const m = metin.match(re)
  if (!m?.[1]) return null
  const deger = degerTemizle(m[1])
  if (deger.length < 1) return null
  return { deger, alinti: degerTemizle(`${etiket}: ${deger}`).slice(0, 100) }
}

export function formAlanlariniTara(metin: string, sec: TaraSecenek = {}): DosyaAlanBulgu[] {
  const ham = String(metin || '')
  if (!ham.trim()) return []
  const brans = bransAnahtari(sec.brans)
  const pediatrik = pediatrikBaglamMi({ doktorBransi: sec.brans, hastaDogumIso: sec.hastaDogumIso })
  const dolu = new Set(sec.dolu || [])
  const cikti: DosyaAlanBulgu[] = []
  const gorulen = new Set<string>()

  if (!dolu.has('dogumTarihi')) {
    const d = dogumTarihiTara(ham)
    if (d) {
      cikti.push(d)
      gorulen.add('dogumTarihi')
    }
  }

  for (const alan of alanlar(brans)) {
    if (gorulen.has(alan.id) || dolu.has(alan.id)) continue
    if (PEDIATRIK_ALAN.has(alan.id) && !pediatrik) continue
    for (const et of etiketler(alan)) {
      const bulundu = satirDeger(ham, et)
      if (!bulundu) continue
      if (alan.id === 'dogumTarihi') {
        const iso = isoTarih(bulundu.deger)
        if (!iso) continue
        cikti.push({ id: alan.id, etiket: alan.etiket, deger: iso, alinti: bulundu.alinti })
      } else {
        cikti.push({ id: alan.id, etiket: alan.etiket, deger: bulundu.deger, alinti: bulundu.alinti })
      }
      gorulen.add(alan.id)
      break
    }
  }
  return cikti
}

/**
 * NOTYA-BETA-0925 — kimlik satırları (anne / baba adı, doğum yeri). formAlanlariniTara bunları bulur ama
 * hastaDosyaDerleyici modele VERMEZ (VELI-YASAL-ONAM); yalnız sunucudaki kimlik cevabı okur (lib/doktor/kimlikSorusu).
 */
export const MODELE_GITMEYEN_KIMLIK = new Set(['anneAdi', 'babaAdi', 'dogumYeri'])
const KIMLIK_ETIKETI: Record<string, string> = { anneAdi: 'Anne adı', babaAdi: 'Baba adı', dogumYeri: 'Doğum yeri' }

/** Belge / not metninden kimlik satırları + etiketli doğum tarihi — yalnız sunucu tarafındaki kimlik cevabı için. */
export function kimlikAlanlariniTara(metin: string): DosyaAlanBulgu[] {
  const ham = String(metin || '')
  if (!ham.trim()) return []
  const cikti: DosyaAlanBulgu[] = []
  const d = dogumTarihiTara(ham)
  if (d) cikti.push(d)
  for (const id of MODELE_GITMEYEN_KIMLIK) {
    const liste = [...(EK_ETIKET[id] || [])].sort((a, b) => b.length - a.length)
    for (const et of liste) {
      const bulundu = satirDeger(ham, et)
      if (!bulundu) continue
      cikti.push({ id, etiket: KIMLIK_ETIKETI[id] || id, deger: bulundu.deger, alinti: bulundu.alinti })
      break
    }
  }
  return cikti
}

export function dosyaAlanOzeti(bulgular: DosyaAlanBulgu[]): string {
  if (!bulgular.length) return ''
  const satir = bulgular.map((b) => `- ${b.etiket}: ${b.deger} (dosyadan — “${b.alinti}”)`)
  return `\n## DOSYADAN OKUNAN FORM BİLGİLERİ\n${satir.join('\n')}\n(Hasta formunda yoktu; epikriz / not / belgede geçiyor. Kayıtlı form satırını ezmez.)`
}
