/**
 * AMELIYAT-NOTU-01 (Kaan, 2026-11-05) — the structured OPERATION NOTE. CORE: one shell for every SURGICAL branch
 * (cross-specialty-parity: the same fields, the same validation, the same print for all of them). Pure and client-safe.
 *
 * What an operation note must hold — Royal College of Surgeons of England, "Good Surgical Practice" (2014), §1.3
 * ("operation notes"): date and time; elective or emergency; operating surgeon and assistant; anaesthetist; procedure;
 * incision; operative diagnosis; findings; problems / complications; any extra procedure and why; tissue removed, added
 * or altered; prostheses with serial numbers; closure; anticipated blood loss; antibiotic and DVT prophylaxis where
 * applicable; detailed post-operative instructions; signature. RCOG uses the same standard for gynaecological surgery.
 * Every one of those is a field below; nothing else is added.
 *
 * CLASSIFICATION (cross-specialty-parity + brans-alan-sizmasi): the SHELL is core and reaches every branch that operates
 * (AMELIYAT_NOTU_BRANSLARI, all 30 medical branches and all 10 Özel Branşlar written out — no default). The TEMPLATES
 * (pre-filled standard steps) are chapter content: a branch provides its own (KD today:
 * specialties/kadin-dogum/engines/ameliyatSablonlari.ts) and no other branch ever sees them (the server picks them by the
 * doctor's own branch, see ameliyatNotuSunucu.ts).
 *
 * NO WORD OF A COUNTRY OTHER THAN TÜRKİYE IS HERE: the labels are the Turkish words of the Türkiye build
 * (AMELIYAT_NOTU_ETIKETLERI); the country builds carry their own through their packs.
 */
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { bransAnahtari } from '@/lib/specialties/bransAnahtari'
import { klinikSlugCoz, type KlinikYeniSlug } from '@/lib/specialties/klinikDikey'

// ───────────────────────── who has the shell ─────────────────────────

/** Every medical branch, written out: true = the doctor operates and the patient file shows "Ameliyat Notları". */
export const AMELIYAT_NOTU_BRANSLARI: Readonly<Record<SpecialtyKey, boolean>> = {
  'genel-cerrahi': true,
  'kadin-hastaliklari-dogum': true,
  ortopedi: true,
  uroloji: true,
  'kulak-burun-bogaz': true,
  'goz-hastaliklari': true,
  'beyin-cerrahisi': true,
  'kalp-damar-cerrahisi': true,
  'gogus-cerrahisi': true,
  'plastik-cerrahi': true,
  'cocuk-cerrahisi': true,
  // Not surgical branches (they do not write operation notes; office procedures have their own records):
  pediatri: false,
  kardiyoloji: false,
  noroloji: false,
  dahiliye: false,
  psikiyatri: false,
  dermatoloji: false,
  radyoloji: false,
  anestezi: false,
  'acil-tip': false,
  'fizik-tedavi': false,
  'enfeksiyon-hastaliklari': false,
  endokrinoloji: false,
  gastroenteroloji: false,
  nefroloji: false,
  romatoloji: false,
  onkoloji: false,
  'gogus-hastaliklari': false,
  'aile-hekimligi': false,
  'spor-hekimligi': false,
}

/** Every Özel Branş, written out: hair transplantation and aesthetic surgery are operations; the rest are not. */
export const AMELIYAT_NOTU_OZEL_BRANSLARI: Readonly<Record<KlinikYeniSlug, boolean>> = {
  'sac-ekimi': true,
  'estetik-cerrahi': true,
  'medikal-estetik': false,
  'klinik-dermatoloji': false,
  longevity: false,
  fizyoterapi: false,
  'klinik-psikolog': false,
  diyetisyen: false,
  ergoterapi: false,
  odyoloji: false,
}

/** The ONE decision: does this doctor (users.specialty, any stored spelling) get the operation-note shell? Unknown = no. */
export function ameliyatNotuBransi(specialtyHam: string | null | undefined): boolean {
  const ozel = klinikSlugCoz(specialtyHam)
  if (ozel) return AMELIYAT_NOTU_OZEL_BRANSLARI[ozel] === true
  const k = bransAnahtari(specialtyHam)
  return k ? AMELIYAT_NOTU_BRANSLARI[k] === true : false
}

// ───────────────────────── the record ─────────────────────────

export const ANESTEZI_TURLERI = ['genel', 'spinal', 'epidural', 'kombine_spinal_epidural', 'rejyonel_blok', 'sedasyon', 'lokal'] as const
export type AnesteziTuru = (typeof ANESTEZI_TURLERI)[number]
export const ACILIYET = ['elektif', 'acil'] as const
export type Aciliyet = (typeof ACILIYET)[number]

export type AmeliyatNotuVeri = {
  /** 'YYYY-MM-DDTHH:mm' (the practice's local time, as the doctor typed it). */
  baslangic: string
  bitis: string
  aciliyet: Aciliyet | ''
  preopTani: string
  postopTani: string
  islem: string
  cerrah: string
  asistanlar: string
  anesteziTuru: AnesteziTuru | ''
  anestezist: string
  endikasyon: string
  bulgular: string
  teknik: string
  /** '' = not answered yet; the sign-off requires an answer. */
  patoloji: 'gonderildi' | 'gonderilmedi' | ''
  patolojiMateryal: string
  /** Estimated blood loss in mL, as the doctor states it; null = not stated. */
  kanKaybiMl: number | null
  siviTransfuzyon: string
  drenler: string
  komplikasyon: string
  implantlar: string
  kapanis: string
  antibiyotikProfilaksi: string
  vteProfilaksi: string
  postopOrderlar: string
}

export const BOS_AMELIYAT_NOTU: AmeliyatNotuVeri = {
  baslangic: '', bitis: '', aciliyet: '', preopTani: '', postopTani: '', islem: '', cerrah: '', asistanlar: '',
  anesteziTuru: '', anestezist: '', endikasyon: '', bulgular: '', teknik: '', patoloji: '', patolojiMateryal: '',
  kanKaybiMl: null, siviTransfuzyon: '', drenler: '', komplikasyon: '', implantlar: '', kapanis: '',
  antibiyotikProfilaksi: '', vteProfilaksi: '', postopOrderlar: '',
}

type MetinAlani = Exclude<keyof AmeliyatNotuVeri, 'kanKaybiMl' | 'aciliyet' | 'anesteziTuru' | 'patoloji' | 'baslangic' | 'bitis'>
/** Short lines (a diagnosis, a name) and long text (findings, technique). */
export const KISA_ALANLAR: readonly MetinAlani[] = ['preopTani', 'postopTani', 'islem', 'cerrah', 'asistanlar', 'anestezist', 'patolojiMateryal', 'siviTransfuzyon', 'drenler', 'antibiyotikProfilaksi', 'vteProfilaksi']
export const UZUN_ALANLAR: readonly MetinAlani[] = ['endikasyon', 'bulgular', 'teknik', 'komplikasyon', 'implantlar', 'kapanis', 'postopOrderlar']
export const KISA_AZAMI = 300
export const UZUN_AZAMI = 6000
/** Blood loss beyond this is refused as a typing error (mL); a real massive haemorrhage is still far below it. */
export const KAN_KAYBI_AZAMI = 20000

/** Fields the sign-off requires (RCS GSP §1.3). An anaesthetist is required unless the anaesthesia is local. */
export const IMZA_ZORUNLU: readonly (keyof AmeliyatNotuVeri)[] = ['baslangic', 'aciliyet', 'preopTani', 'postopTani', 'islem', 'cerrah', 'anesteziTuru', 'bulgular', 'teknik', 'patoloji', 'kanKaybiMl', 'komplikasyon', 'kapanis', 'postopOrderlar']

/** The Turkish words of the Türkiye build (injected into the shared view; a country build injects its own). */
export const AMELIYAT_NOTU_ETIKETLERI: Readonly<Record<keyof AmeliyatNotuVeri, string>> = {
  baslangic: 'Ameliyat başlangıcı (tarih, saat)',
  bitis: 'Bitiş saati',
  aciliyet: 'Elektif / acil',
  preopTani: 'Preoperatif tanı',
  postopTani: 'Postoperatif tanı',
  islem: 'Yapılan işlem',
  cerrah: 'Operatör',
  asistanlar: 'Asistan(lar)',
  anesteziTuru: 'Anestezi türü',
  anestezist: 'Anestezi uzmanı',
  endikasyon: 'Endikasyon',
  bulgular: 'Ameliyat bulguları',
  teknik: 'Teknik / ameliyat adımları',
  patoloji: 'Patolojiye materyal',
  patolojiMateryal: 'Gönderilen materyal',
  kanKaybiMl: 'Tahmini kan kaybı (mL)',
  siviTransfuzyon: 'Sıvı / transfüzyon',
  drenler: 'Dren(ler)',
  komplikasyon: 'Komplikasyon',
  implantlar: 'İmplant / materyal (seri no ile)',
  kapanis: 'Kapanış',
  antibiyotikProfilaksi: 'Antibiyotik profilaksisi',
  vteProfilaksi: 'VTE profilaksisi',
  postopOrderlar: 'Postoperatif order / talimatlar',
}
export const ANESTEZI_ETIKETLERI: Readonly<Record<AnesteziTuru, string>> = {
  genel: 'Genel', spinal: 'Spinal', epidural: 'Epidural', kombine_spinal_epidural: 'Kombine spinal-epidural',
  rejyonel_blok: 'Rejyonel blok', sedasyon: 'Sedasyon', lokal: 'Lokal',
}
export const ACILIYET_ETIKETLERI: Readonly<Record<Aciliyet, string>> = { elektif: 'Elektif', acil: 'Acil' }

// ───────────────────────── templates (shape only; content is the chapter's) ─────────────────────────

/** A branch's template: a key, a name, where its steps come from, and the fields it pre-fills (the doctor edits all of them). */
export type AmeliyatSablonu = {
  kod: string
  ad: string
  grup: string
  /** The published references the standard steps follow. */
  kaynak: string
  veri: Partial<AmeliyatNotuVeri>
}

/** A template applied to a note: only EMPTY fields are filled, what the doctor already wrote is never overwritten. */
export function sablonUygula(veri: AmeliyatNotuVeri, sablon: AmeliyatSablonu | null | undefined): AmeliyatNotuVeri {
  if (!sablon) return veri
  const out: AmeliyatNotuVeri = { ...veri }
  for (const [k, v] of Object.entries(sablon.veri) as [keyof AmeliyatNotuVeri, unknown][]) {
    const mevcut = out[k]
    const bos = mevcut === '' || mevcut === null || mevcut === undefined
    if (bos && v !== undefined) (out as Record<string, unknown>)[k] = v
  }
  return out
}

// ───────────────────────── validation ─────────────────────────

const ISO_ZAMAN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const ISO_SAAT = /^\d{2}:\d{2}$/
const metinTemizle = (v: unknown, azami: number): string | null => {
  if (v == null) return ''
  if (typeof v !== 'string') return null
  const t = v.replace(/\r\n/g, '\n').trim()
  return t.length > azami ? null : t
}

export type DogrulamaSonucu = { ok: true; veri: AmeliyatNotuVeri; tarih: string } | { ok: false; hata: string; alan: keyof AmeliyatNotuVeri }

/**
 * Narrows what a client sent to the record shape. A DRAFT needs only the start date and the procedure; a SIGN-OFF
 * (`imza: true`) needs every field of IMZA_ZORUNLU (and an anaesthetist unless the anaesthesia is local).
 */
export function ameliyatNotuDogrula(ham: unknown, o: { imza: boolean }): DogrulamaSonucu {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const veri: AmeliyatNotuVeri = { ...BOS_AMELIYAT_NOTU }
  const E = AMELIYAT_NOTU_ETIKETLERI
  for (const k of KISA_ALANLAR) {
    const t = metinTemizle(g[k], KISA_AZAMI)
    if (t === null) return { ok: false, hata: `${E[k]} en fazla ${KISA_AZAMI} karakter olabilir.`, alan: k }
    veri[k] = t
  }
  for (const k of UZUN_ALANLAR) {
    const t = metinTemizle(g[k], UZUN_AZAMI)
    if (t === null) return { ok: false, hata: `${E[k]} en fazla ${UZUN_AZAMI} karakter olabilir.`, alan: k }
    veri[k] = t
  }
  const bas = typeof g.baslangic === 'string' ? g.baslangic.trim() : ''
  if (!ISO_ZAMAN.test(bas) || Number.isNaN(Date.parse(`${bas}:00Z`))) return { ok: false, hata: 'Ameliyat tarihi ve saati gerekli.', alan: 'baslangic' }
  veri.baslangic = bas
  const bit = typeof g.bitis === 'string' ? g.bitis.trim() : ''
  if (bit && !ISO_SAAT.test(bit)) return { ok: false, hata: 'Bitiş saati SS:DD biçiminde olmalı.', alan: 'bitis' }
  veri.bitis = bit
  if (g.aciliyet != null && g.aciliyet !== '') {
    if (!(ACILIYET as readonly unknown[]).includes(g.aciliyet)) return { ok: false, hata: 'Geçersiz aciliyet.', alan: 'aciliyet' }
    veri.aciliyet = g.aciliyet as Aciliyet
  }
  if (g.anesteziTuru != null && g.anesteziTuru !== '') {
    if (!(ANESTEZI_TURLERI as readonly unknown[]).includes(g.anesteziTuru)) return { ok: false, hata: 'Geçersiz anestezi türü.', alan: 'anesteziTuru' }
    veri.anesteziTuru = g.anesteziTuru as AnesteziTuru
  }
  if (g.patoloji != null && g.patoloji !== '') {
    if (g.patoloji !== 'gonderildi' && g.patoloji !== 'gonderilmedi') return { ok: false, hata: 'Patoloji: gönderildi / gönderilmedi.', alan: 'patoloji' }
    veri.patoloji = g.patoloji
  }
  if (g.kanKaybiMl != null && g.kanKaybiMl !== '') {
    const n = typeof g.kanKaybiMl === 'number' ? g.kanKaybiMl : Number(String(g.kanKaybiMl).replace(',', '.'))
    if (!Number.isFinite(n) || n < 0 || n > KAN_KAYBI_AZAMI) return { ok: false, hata: `Kan kaybı 0–${KAN_KAYBI_AZAMI} mL arasında bir sayı olmalı.`, alan: 'kanKaybiMl' }
    veri.kanKaybiMl = Math.round(n)
  }
  if (!veri.islem) return { ok: false, hata: 'Yapılan işlem gerekli.', alan: 'islem' }
  if (o.imza) {
    for (const k of IMZA_ZORUNLU) {
      const v = veri[k]
      if (v === '' || v === null) return { ok: false, hata: `İmzalamak için doldurun: ${E[k]}.`, alan: k }
    }
    if (veri.anesteziTuru !== 'lokal' && !veri.anestezist) return { ok: false, hata: `İmzalamak için doldurun: ${E.anestezist}.`, alan: 'anestezist' }
    if (veri.patoloji === 'gonderildi' && !veri.patolojiMateryal) return { ok: false, hata: `İmzalamak için doldurun: ${E.patolojiMateryal}.`, alan: 'patolojiMateryal' }
  }
  return { ok: true, veri, tarih: bas.slice(0, 10) }
}

/** A stored value read back (decrypted JSON) — never trusted blindly: unknown keys dropped, wrong types emptied. */
export function ameliyatNotuOku(ham: unknown): AmeliyatNotuVeri {
  const g = (ham && typeof ham === 'object' ? ham : {}) as Record<string, unknown>
  const out: AmeliyatNotuVeri = { ...BOS_AMELIYAT_NOTU }
  for (const k of Object.keys(BOS_AMELIYAT_NOTU) as (keyof AmeliyatNotuVeri)[]) {
    const v = g[k]
    if (k === 'kanKaybiMl') out.kanKaybiMl = typeof v === 'number' && Number.isFinite(v) ? v : null
    else if (typeof v === 'string') (out as Record<string, unknown>)[k] = v
  }
  return out
}

/**
 * The printed sections in order (the shared view and the print page read this one list). `deger` is the printable
 * text; an empty optional field is left out of the paper, a required one prints "—".
 */
export function ameliyatNotuBolumleri(v: AmeliyatNotuVeri): Array<{ anahtar: keyof AmeliyatNotuVeri; etiket: string; deger: string; uzun: boolean }> {
  const E = AMELIYAT_NOTU_ETIKETLERI
  const sira: (keyof AmeliyatNotuVeri)[] = ['preopTani', 'postopTani', 'islem', 'endikasyon', 'bulgular', 'teknik', 'patoloji', 'kanKaybiMl', 'siviTransfuzyon', 'drenler', 'komplikasyon', 'implantlar', 'kapanis', 'antibiyotikProfilaksi', 'vteProfilaksi', 'postopOrderlar']
  const out: Array<{ anahtar: keyof AmeliyatNotuVeri; etiket: string; deger: string; uzun: boolean }> = []
  for (const k of sira) {
    let deger = ''
    if (k === 'patoloji') deger = v.patoloji === 'gonderildi' ? `Gönderildi${v.patolojiMateryal ? ` — ${v.patolojiMateryal}` : ''}` : v.patoloji === 'gonderilmedi' ? 'Gönderilmedi' : ''
    else if (k === 'kanKaybiMl') deger = v.kanKaybiMl == null ? '' : `${v.kanKaybiMl} mL`
    else deger = String(v[k] ?? '')
    const zorunlu = IMZA_ZORUNLU.includes(k)
    if (!deger && !zorunlu) continue
    out.push({ anahtar: k, etiket: E[k], deger: deger || '—', uzun: (UZUN_ALANLAR as readonly string[]).includes(k) })
  }
  return out
}
