/**
 * FORM-DOSYA-AKTAR-01 (beta feedback, KBB doctor, 2026-11-21): "Hastanın demografik bilgilerinde eksikleri sonradan
 * girmek gerekiyor." The submitted Hasta Bilgi Formu already filled SOME empty card fields (lib/intake/hastaKaydinaAktar.ts)
 * — but only at submission, only for a form linked to the patient at that moment, and never address, birth place,
 * guardian, emergency contact or insurance (the card had no place for them). Forms filled before the transfer existed,
 * or before the patient was linked, never reached the card at all.
 *
 * This module is the one reading of "what the form says, in the card's shape" and the DIFF against the card:
 *   - 'bos'    the card is empty here, the form has a value → offered, pre-ticked;
 *   - 'farkli' the card has a different value → offered UNticked, both values shown; the doctor decides.
 * Nothing is written from here: the doctor reviews the rows on the card ("Formdan dosyaya aktar") and confirms, and the
 * confirmed rows go through the card's normal PUT (app/api/doktor/hastalar/[id]). A doctor-entered value is never
 * overwritten silently. Chronic conditions are MERGED (form items added), never removed.
 */
import { formAlerjiBeyani } from '@/lib/doktor/hastaKayitAlanlari'
import { kanGrubuNormal } from '@/lib/doktor/kanGrubu'
import { cinsiyetTr } from '@/lib/utils/cinsiyet'
import type { HastaOzetKayit } from '@/lib/doktor/hastaOzetKayit'

const metin = (v: unknown): string => (Array.isArray(v) ? v.filter(Boolean).join(', ') : String(v ?? '').trim())

/** Card fields the form can fill — the keys are the card PUT's body keys. */
export const FORM_AKTARIM_ALANLARI = [
  'dogum_tarihi', 'cinsiyet', 'telefon', 'eposta', 'sehir', 'adres', 'dogum_yeri', 'anne_adi', 'baba_adi',
  'veli_adi', 'veli_yakinlik', 'veli_telefon', 'acil_kisi_adi', 'acil_kisi_yakinlik', 'acil_kisi_telefon', 'sigorta',
  'kan_grubu', 'kronik_hastaliklar', 'alerjiler', 'surekli_ilaclar', 'sigara_alkol',
] as const
export type FormAktarimAlani = (typeof FORM_AKTARIM_ALANLARI)[number]

export const FORM_AKTARIM_ETIKETI: Record<FormAktarimAlani, string> = {
  dogum_tarihi: 'Doğum tarihi', cinsiyet: 'Cinsiyet', telefon: 'Telefon', eposta: 'E-posta', sehir: 'Şehir', adres: 'Adres',
  dogum_yeri: 'Doğum yeri', anne_adi: 'Anne adı', baba_adi: 'Baba adı', veli_adi: 'Veli / yasal temsilci',
  veli_yakinlik: 'Velinin yakınlığı', veli_telefon: 'Veli telefonu', acil_kisi_adi: 'Acil durum kişisi',
  acil_kisi_yakinlik: 'Acil kişinin yakınlığı', acil_kisi_telefon: 'Acil kişi telefonu', sigorta: 'Sağlık güvencesi',
  kan_grubu: 'Kan grubu', kronik_hastaliklar: 'Kronik hastalıklar', alerjiler: 'Alerjiler', surekli_ilaclar: 'Sürekli ilaçlar',
  sigara_alkol: 'Sigara / Alkol',
}

/** Fields a role without clinical-file access may write (identity + contact) — mirrors the card PUT's list. */
export const FORM_AKTARIM_ILETISIM: readonly FormAktarimAlani[] = [
  'dogum_tarihi', 'cinsiyet', 'telefon', 'eposta', 'sehir', 'adres', 'dogum_yeri', 'anne_adi', 'baba_adi',
  'veli_adi', 'veli_yakinlik', 'veli_telefon', 'acil_kisi_adi', 'acil_kisi_yakinlik', 'acil_kisi_telefon',
]

export type FormKartDegerleri = Partial<Record<FormAktarimAlani, string | string[]>>

/** The form's answers in the card's shape (empty answers left out). Same readings as the submission transfer. */
export function formdanKartDegerleri(y: Record<string, unknown>): FormKartDegerleri {
  const d: FormKartDegerleri = {}
  const koy = (k: FormAktarimAlani, v: string) => { if (v) d[k] = v }
  const dogum = metin(y.dogumTarihi)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dogum)) d.dogum_tarihi = dogum
  koy('cinsiyet', cinsiyetTr(metin(y.cinsiyet)))
  koy('telefon', metin(y.telefon))
  if (metin(y.eposta).includes('@')) d.eposta = metin(y.eposta)
  koy('sehir', metin(y.il))
  koy('adres', metin(y.adres))
  koy('dogum_yeri', metin(y.dogumYeri))
  koy('anne_adi', metin(y.anneAdi))
  koy('baba_adi', metin(y.babaAdi))
  koy('veli_adi', [metin(y.veliAd), metin(y.veliSoyad)].filter(Boolean).join(' '))
  koy('veli_yakinlik', metin(y.veliYakinligi) === 'Diğer' ? (metin(y.veliDigerAdSoyad) || 'Diğer') : metin(y.veliYakinligi))
  koy('veli_telefon', metin(y.veliTelefon))
  koy('acil_kisi_adi', metin(y.acilKisiAdi))
  koy('acil_kisi_yakinlik', metin(y.acilKisiYakinlik))
  koy('acil_kisi_telefon', metin(y.acilKisiTelefon))
  const tur = metin(y.sigortaTuru)
  const sigorta = [
    tur,
    metin(y.sigortaSirketi) ? `Şirket: ${metin(y.sigortaSirketi)}` : '',
    metin(y.policeNo) ? `Poliçe/üyelik no: ${metin(y.policeNo)}` : '',
    metin(y.kurumAdi) ? `Kurum: ${metin(y.kurumAdi)}` : '',
  ].filter(Boolean).join(' · ')
  koy('sigorta', sigorta)
  const kan = kanGrubuNormal(y.kanGrubu)
  if (kan && kan !== 'Bilinmiyor') d.kan_grubu = kan
  const kh = (Array.isArray(y.kronikHastaliklar) ? (y.kronikHastaliklar as unknown[]).map(String) : String(y.kronikHastaliklar || '').split(/[,;\n]+/))
    .map((x) => x.trim()).filter((x) => x && x.toLowerCase() !== 'yok')
  if (kh.length) d.kronik_hastaliklar = kh
  const alerji = formAlerjiBeyani(y)
  koy('alerjiler', alerji.durum === 'var' ? (alerji.metin || 'Bilinen alerjisi var') : alerji.durum === 'yok' ? 'Bilinen alerjisi yok' : '')
  koy('surekli_ilaclar', metin(y.kullanilanIlaclar) || (metin(y.kullaniyorMu) === 'Hayır' ? 'Yok' : ''))
  const sigara = metin(y.sigara); const alkol = metin(y.alkol)
  const sigaraMetni = sigara === 'Evet' || sigara === 'Hayır' ? `Ailede sigara: ${sigara}` : sigara ? `Sigara: ${sigara}` : ''
  koy('sigara_alkol', [sigaraMetni, alkol ? `Alkol: ${alkol}` : ''].filter(Boolean).join(' · '))
  return d
}

export type FormAktarimSatiri = {
  alan: FormAktarimAlani
  etiket: string
  formda: string | string[]
  dosyada: string | string[] | null
  /** 'bos' = card empty (pre-ticked) · 'farkli' = card differs (unticked; the doctor decides). */
  durum: 'bos' | 'farkli'
}

const katla = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim()
function ayniMi(alan: FormAktarimAlani, a: string, b: string): boolean {
  if (alan === 'telefon' || alan === 'veli_telefon' || alan === 'acil_kisi_telefon') {
    const r = (x: string) => x.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '')
    return r(a) === r(b)
  }
  if (alan === 'kan_grubu') return (kanGrubuNormal(a) ?? katla(a)) === (kanGrubuNormal(b) ?? katla(b))
  if (alan === 'cinsiyet') return cinsiyetTr(a) === cinsiyetTr(b)
  if (alan === 'dogum_tarihi') return a.slice(0, 10) === b.slice(0, 10)
  return katla(a) === katla(b)
}

/** The rows the doctor reviews: every form value that the card lacks or holds differently. Equal values are not shown. */
export function formdanDosyayaFark(y: Record<string, unknown>, kart: Partial<HastaOzetKayit>, opts: { veli?: boolean } = {}): FormAktarimSatiri[] {
  const form = formdanKartDegerleri(y)
  const satirlar: FormAktarimSatiri[] = []
  for (const alan of FORM_AKTARIM_ALANLARI) {
    // "Veli" follows the patient's age (brans-alan-sizmasi): no guardian rows for an adult.
    if (opts.veli === false && alan.startsWith('veli_')) continue
    const f = form[alan]
    if (f === undefined) continue
    if (alan === 'kronik_hastaliklar') {
      const dosya = (kart.kronik_hastaliklar ?? []).map(String).filter(Boolean)
      const yeni = (f as string[]).filter((x) => !dosya.some((d) => katla(d) === katla(x)))
      if (!yeni.length) continue
      // Merge: the card's items stay, the form's new ones are added.
      satirlar.push({ alan, etiket: FORM_AKTARIM_ETIKETI[alan], formda: [...dosya, ...yeni], dosyada: dosya.length ? dosya : null, durum: dosya.length ? 'farkli' : 'bos' })
      continue
    }
    const dosya = String((kart as Record<string, unknown>)[alan] ?? '').trim()
    if (!dosya) satirlar.push({ alan, etiket: FORM_AKTARIM_ETIKETI[alan], formda: f, dosyada: null, durum: 'bos' })
    else if (!ayniMi(alan, dosya, f as string)) satirlar.push({ alan, etiket: FORM_AKTARIM_ETIKETI[alan], formda: f, dosyada: dosya, durum: 'farkli' })
  }
  return satirlar
}

/** The card PUT body for the rows the doctor confirmed (only known fields; values exactly as the diff offered them). */
export function formAktarimGovdesi(satirlar: readonly FormAktarimSatiri[], secilen: readonly string[]): Record<string, string | string[]> {
  const g: Record<string, string | string[]> = {}
  for (const s of satirlar) if (secilen.includes(s.alan) && (FORM_AKTARIM_ALANLARI as readonly string[]).includes(s.alan)) g[s.alan] = s.formda
  return g
}
