/**
 * HASTA-ALANI-MARKA (Kaan, 2026-11-25) — the patient portal is the DOCTOR's service, not Notya's.
 *
 * Kaan: "Hasta portalını doktorun bir ek servisi olarak lanse etmemiz iyi olur … Hasta portalında ağırlığı doktora
 * vermeliyiz; onun şirketinin logosunu veya onun resmini, ismini daha belirgin yapmamız lazım. So it should be brought to
 * you by the doctor, not brought to you by the Notya company."
 *
 * One resolved brand object (PortalMarka) drives every patient-facing surface: the portal header, the PIN / loading /
 * error screens, the browser tab, the PWA manifest + icon, the link preview, the push-notification title. Resolution:
 *
 *   mark   → the doctor's own portal logo (or the Notya Klinik clinic's logo) → the doctor's profile photo (when he did
 *            not switch it off) → a monogram of the name. Never a Notya mark.
 *   name   → Notya Klinik: the clinic's name, the treating doctor in the second line. Otherwise the doctor's display-name
 *            override ("Dr. Kaan Arıoğlu Çocuk Kliniği") or "Dr. Ad Soyad" with the stored title.
 *   "Sağlığım" stays as the quieter section name; Notya only in the small footer line (NOTYA_ALTYAPI).
 *
 * Pure and client-safe (no server import): the server resolver (markaSunucu.ts), the settings preview, the demo and the
 * tests all go through markaCoz(). Core for all 30 branches + 10 Özel Branşlar: nothing here depends on the branş.
 */

/** The settings page resizes a logo / photo to fit this many pixels before upload (server cap: markaGorsel.ts). */
export const MARKA_HEDEF_PIKSEL = 512

/** The section name the patient learns ("Sağlığım"), shown quieter than the doctor's name. */
export const BOLUM_ADI = 'Sağlığım'
/** The only place Notya appears on a patient surface: a small footer mark. */
export const NOTYA_ALTYAPI = 'Notya altyapısıyla'

/**
 * Accents a doctor may pick. Fixed list so every choice keeps text contrast: each `koyu` carries white text at ≥ 7:1 and
 * reads at ≥ 4.5:1 as text on the portal's cream (#f4eee3); `acik` is the soft tint behind a monogram ring.
 */
export const VURGU_SECENEKLERI = {
  petrol: { ad: 'Petrol', koyu: '#0E5E58', acik: '#DCEDEA' },
  cam: { ad: 'Çam', koyu: '#2F4334', acik: '#E1E8DF' },
  lacivert: { ad: 'Lacivert', koyu: '#22385C', acik: '#DFE5EF' },
  bordo: { ad: 'Bordo', koyu: '#6C2A36', acik: '#F0E0E2' },
  murdum: { ad: 'Mürdüm', koyu: '#4A3A62', acik: '#E7E2EE' },
  toprak: { ad: 'Toprak', koyu: '#6E4524', acik: '#F0E5D9' },
} as const
export type VurguAnahtari = keyof typeof VURGU_SECENEKLERI
export const VARSAYILAN_VURGU: VurguAnahtari = 'petrol'

export function vurguGecerliMi(x: unknown): x is VurguAnahtari {
  return typeof x === 'string' && Object.prototype.hasOwnProperty.call(VURGU_SECENEKLERI, x)
}

export type MarkaGorseli = { tur: 'logo' | 'foto'; url: string }

export type PortalMarka = {
  /** The dominant line: clinic name (Notya Klinik), the doctor's display name, or "Dr. Ad Soyad". */
  ad: string
  /** Quieter line: branş · clinic — for Notya Klinik "Dr. Ad Soyad · branş" (the treating doctor). null when empty. */
  altSatir: string | null
  /** The mark: logo or photo (URL), else null → monogram. */
  gorsel: MarkaGorseli | null
  /** Two letters, Turkish casing ("İK"). */
  monogram: string
  vurgu: VurguAnahtari
  /** A Notya Klinik clinic's brand (clinic name first). */
  klinik: boolean
  /** Short form for the PWA short_name, the tab title and push titles: "Dr. Arıoğlu", or the clinic / display name. */
  kisaAd: string
}

/** What the server (or the demo / the settings preview) knows about a doctor; markaCoz() turns it into a PortalMarka. */
export type MarkaGirdisi = {
  /** users.full_name with the stored title applied ("Uzm. Dr. Kaan Arıoğlu"); empty → "Doktorunuz". */
  hekimAdi: string | null
  /** Branş label in Turkish ("Çocuk Sağlığı ve Hastalıkları"). */
  brans?: string | null
  /** users.clinic_name — the doctor's own practice name. */
  klinikAdi?: string | null
  /** hasta_alani_gorunumu */
  gorunenAd?: string | null
  vurgu?: string | null
  logoUrl?: string | null
  fotoUrl?: string | null
  fotoGoster?: boolean | null
  /** Notya Klinik membership: clinic name + its uploaded logo (Notya storage only). */
  notyaKlinik?: { ad: string; logoUrl?: string | null } | null
}

const temiz = (s: string | null | undefined) => String(s || '').replace(/\s+/g, ' ').trim()

const UNVAN = /^(prof\.?\s*dr\.?|doç\.?\s*dr\.?|doc\.?\s*dr\.?|uzm\.?\s*dr\.?|op\.?\s*dr\.?|dr\.?|doç\.?|prof\.?|uzm\.?|op\.?|dyt\.?|fzt\.?|psk\.?|odyl\.?)\s+/i
/** Words that are not part of a person's / clinic's initials. */
const BAGLAC = new Set(['ve', 'ile', '&', '-', '·', 've/veya'])

/** "Uzm. Dr. Kaan Arıoğlu" → "KA"; "Moda Dahiliye Muayenehanesi" → "MD"; "Şule" → "ŞU". Turkish casing (i → İ). */
export function markaMonogrami(ad: string): string {
  let t = temiz(ad)
  while (UNVAN.test(t)) t = t.replace(UNVAN, '')
  const parca = t.split(' ').filter((p) => p && !BAGLAC.has(p.toLocaleLowerCase('tr-TR')) && /\p{L}/u.test(p))
  if (!parca.length) return 'DR'
  const harf = (p: string) => (p.match(/\p{L}/u)?.[0] || '')
  const m = parca.length === 1 ? Array.from(parca[0].replace(/[^\p{L}]/gu, '')).slice(0, 2).join('') : harf(parca[0]) + harf(parca[1])
  return m.toLocaleUpperCase('tr-TR') || 'DR'
}

/** "Uzm. Dr. Kaan Arıoğlu" → "Dr. Arıoğlu" (the courteous short form a patient uses). */
export function hekimKisaAdi(hekimAdi: string): string {
  let t = temiz(hekimAdi)
  if (!t) return 'Doktorunuz'
  while (UNVAN.test(t)) t = t.replace(UNVAN, '')
  const parca = t.split(' ').filter(Boolean)
  if (!parca.length) return 'Doktorunuz'
  return `Dr. ${parca[parca.length - 1]}`
}

/** Only https URLs (or a same-origin /path for the demo) ever reach an <img> on the patient's device. */
export function guvenliGorselUrl(url: string | null | undefined): string | null {
  const u = temiz(url)
  if (!u) return null
  if (/^\/(?!\/)[\w\-./]+\.(png|jpe?g|webp)$/i.test(u)) return u
  if (/^\/api\/portal\/hasta\/[^/?#]+\/marka\/gorsel(\?v=[\w-]+)?$/.test(u)) return u
  // The settings preview shows the doctor's own photo from the signed-in avatar route (never sent to a patient).
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(u)) return u
  try {
    const p = new URL(u)
    return p.protocol === 'https:' ? p.toString() : null
  } catch {
    return null
  }
}

/** logo → photo → monogram; clinic first for Notya Klinik. Never throws, never returns a Notya mark. */
export function markaCoz(g: MarkaGirdisi): PortalMarka {
  const hekimAdi = temiz(g.hekimAdi) || 'Doktorunuz'
  const brans = temiz(g.brans) || null
  const kendiKlinigi = temiz(g.klinikAdi) || null
  const gorunenAd = temiz(g.gorunenAd).slice(0, 80) || null
  const vurgu = vurguGecerliMi(g.vurgu) ? g.vurgu : VARSAYILAN_VURGU
  const klinik = g.notyaKlinik && temiz(g.notyaKlinik.ad) ? { ad: temiz(g.notyaKlinik.ad), logo: guvenliGorselUrl(g.notyaKlinik.logoUrl) } : null
  const logo = klinik?.logo || guvenliGorselUrl(g.logoUrl)
  const foto = g.fotoGoster === false ? null : guvenliGorselUrl(g.fotoUrl)
  const gorsel: MarkaGorseli | null = logo ? { tur: 'logo', url: logo } : foto ? { tur: 'foto', url: foto } : null

  if (klinik) {
    return {
      ad: klinik.ad,
      altSatir: [gorunenAd || hekimAdi, brans].filter(Boolean).join(' · ') || null,
      gorsel,
      monogram: markaMonogrami(klinik.ad),
      vurgu,
      klinik: true,
      kisaAd: klinik.ad,
    }
  }
  const ad = gorunenAd || hekimAdi
  const alt = [brans, gorunenAd && kendiKlinigi && gorunenAd.toLocaleLowerCase('tr-TR').includes(kendiKlinigi.toLocaleLowerCase('tr-TR')) ? null : kendiKlinigi]
  return {
    ad,
    altSatir: alt.filter(Boolean).join(' · ') || null,
    gorsel,
    monogram: markaMonogrami(gorunenAd && !/^dr\.?\s/i.test(gorunenAd) ? gorunenAd : hekimAdi),
    vurgu,
    klinik: false,
    kisaAd: gorunenAd || (hekimAdi === 'Doktorunuz' ? 'Doktorunuz' : hekimKisaAdi(hekimAdi)),
  }
}

/** The brand when no doctor is known (expired / wrong link): neutral, still no Notya mark in the header. */
export const BILINMEYEN_MARKA: PortalMarka = {
  ad: 'Doktorunuzun hasta alanı',
  altSatir: null,
  gorsel: null,
  monogram: 'S',
  vurgu: VARSAYILAN_VURGU,
  klinik: false,
  kisaAd: BOLUM_ADI,
}

/** Browser tab / PWA name: "Dr. Arıoğlu · Sağlığım". */
export function markaSekmeBasligi(m: PortalMarka | null | undefined): string {
  if (!m || m === BILINMEYEN_MARKA) return BOLUM_ADI
  return `${m.kisaAd} · ${BOLUM_ADI}`
}

/** PWA short_name: at most ~16 characters so the home-screen label is not cut mid-word. */
export function markaKisaEtiket(m: PortalMarka | null | undefined): string {
  const k = temiz(m?.kisaAd)
  if (!k || m === BILINMEYEN_MARKA) return BOLUM_ADI
  if (k.length <= 16) return k
  const kelimeler = k.split(' ')
  let out = ''
  for (const w of kelimeler) { if ((out ? out.length + 1 : 0) + w.length > 16) break; out = out ? `${out} ${w}` : w }
  return out || k.slice(0, 16)
}

/** Push notification title: the doctor / clinic short name. No patient data, no clinical word. */
export function markaBildirimBasligi(kisaAd: string | null | undefined): string {
  return temiz(kisaAd) || BOLUM_ADI
}

/**
 * Patient push (lock screen): the doctor's / clinic's short name becomes the title; what the reminder is about moves to
 * the first words of the body ("İlaç saati · 08:00 — Bir ilacınız …"). Still generic words only: no medicine, no value.
 */
export function markaliPushIcerigi<T extends { baslik: string; govde: string }>(icerik: T, kisaAd: string | null | undefined): T {
  const ad = temiz(kisaAd)
  if (!ad) return icerik
  const konu = temiz(icerik.baslik)
  return { ...icerik, baslik: markaBildirimBasligi(ad), govde: konu && konu !== BOLUM_ADI ? `${konu} — ${icerik.govde}` : icerik.govde }
}
