/**
 * ONE phone-number validator and normaliser for every country (Kaan, 2026-10-24). Pure, client- and server-safe: the
 * same call answers the field on a form and the API route behind it, so a browser can never get past a rule the
 * server does not have.
 *
 *   telefonCoz(ulke, ham, secenek?)  → { tamam: true, e164, ulusal } | { tamam: false, neden }
 *
 * `e164` is what is stored where a column is free text ("+61491570006"); the encrypted columns stay encrypted and hold
 * it too. `neden` is a code the screen turns into the country's own sentence: 'harf' (letters or signs a number does
 * not have), 'kisa', 'uzun', 'gecersiz' (the right length that is not a number of the country, or a prefix of another
 * country).
 *
 * THE RULES (national digits = the number without the country code and without the trunk 0):
 *   au  mobile 04xx xxx xxx = 10 digits; landline 0[2378] + 8 digits = 10; +61 forms drop the 0 (9 national digits).
 *       13 xx xx / 1300 / 1800 service numbers only where `hizmetNumarasi` is allowed (a contact number that must be
 *       callable does not allow them).
 *   us, ca  NANP: 10 digits, area code and exchange never start with 0 or 1; +1 (or a leading 1) allowed.
 *   gb  10 or 11 digits with the leading 0 (9 or 10 national); +44 (a "(0)" after it is dropped).
 *   nz  +64; 8 to 10 national digits (mobile 02x); trunk 0 dropped.
 *   uz  +998; 9 national digits.
 *   tr  +90; 10 national digits (a leading 0 allowed). Türkiye's own screens do not call this yet: they keep their
 *       looser rule (lib/gelenBelgeler/eslesme.ts telefonNormalle) until Kaan decides (docs/OPEN-COMMITMENTS.md).
 */
export type TelefonUlke = 'tr' | 'us' | 'ca' | 'au' | 'nz' | 'gb' | 'uz'
export type TelefonNedeni = 'bos' | 'harf' | 'kisa' | 'uzun' | 'gecersiz'
export type TelefonSonuc = { tamam: true; e164: string; ulusal: string } | { tamam: false; neden: TelefonNedeni }

const KOD: Readonly<Record<TelefonUlke, string>> = { tr: '90', us: '1', ca: '1', au: '61', nz: '64', gb: '44', uz: '998' }
const ret = (neden: TelefonNedeni): TelefonSonuc => ({ tamam: false, neden })
const tamam = (ulke: TelefonUlke, ulusal: string): TelefonSonuc => ({ tamam: true, e164: `+${KOD[ulke]}${ulusal}`, ulusal })

/** The other country codes a "+" could start with — a number of another country is "gecersiz", not "kisa". */
const BASKA_KODLAR = ['998', '90', '61', '64', '44', '1', '7', '33', '49', '34', '39', '86', '91', '81', '82', '20', '27', '52', '55']

export type TelefonSecenegi = {
  /** true = a 13 / 1300 / 1800 number is accepted (Australia). Default false: a contact number must be callable. */
  hizmetNumarasi?: boolean
  /** true = an empty value is "bos" (a required field); false (default) = empty is not checked here. */
  zorunlu?: boolean
}

export function telefonCoz(ulke: TelefonUlke, ham: string | null | undefined, secenek: TelefonSecenegi = {}): TelefonSonuc {
  let s = (ham ?? '').normalize('NFKC').trim()
  if (!s) return ret('bos')
  // "+44 (0) 20 …": the bracketed trunk zero is not a digit of the number.
  s = s.replace(/\(\s*0\s*\)/, '')
  // Digits, spaces and the usual separators. Anything else is not a phone number.
  if (/[^\d\s().+\-/]/.test(s) || (s.indexOf('+') > 0) || (s.match(/\+/g) ?? []).length > 1) return ret('harf')
  let rakam = s.replace(/\D/g, '')
  if (!rakam) return ret('harf')
  const artili = s.startsWith('+') || rakam.startsWith('00')
  if (artili) {
    if (!s.startsWith('+')) rakam = rakam.slice(2) // 0061… = +61…
    const kod = KOD[ulke]
    if (!rakam.startsWith(kod)) {
      // A different country's code is not this country's number — and a number too short to tell is "kisa".
      if (rakam.length < 7) return ret('kisa')
      return ret(BASKA_KODLAR.some((k) => rakam.startsWith(k)) ? 'gecersiz' : 'gecersiz')
    }
    return ulusalKontrol(ulke, rakam.slice(kod.length), true, secenek)
  }
  return ulusalKontrol(ulke, rakam, false, secenek)
}

function ulusalKontrol(ulke: TelefonUlke, girilen: string, uluslararasi: boolean, secenek: TelefonSecenegi): TelefonSonuc {
  let n = girilen
  const sayi = (eksik: number, fazla: number): TelefonSonuc | null => (n.length < eksik ? ret('kisa') : n.length > fazla ? ret('uzun') : null)

  if (ulke === 'us' || ulke === 'ca') {
    // A leading 1 is the country code; a number cannot start with 0 or 1 otherwise.
    if (n.length === 11 && n.startsWith('1')) n = n.slice(1)
    else if (uluslararasi && n.startsWith('1') && n.length === 11) n = n.slice(1)
    const b = sayi(10, 10); if (b) return b
    if (/^[01]/.test(n) || /^.{3}[01]/.test(n)) return ret('gecersiz')
    return tamam(ulke, n)
  }
  if (ulke === 'au') {
    if (!uluslararasi && /^1(3\d{4}|300\d{6}|800\d{6})$/.test(n)) return secenek.hizmetNumarasi ? { tamam: true, e164: n, ulusal: n } : ret('gecersiz')
    if (n.startsWith('0')) n = n.slice(1)
    else if (!uluslararasi && !/^[23478]/.test(n)) return ret('gecersiz')
    if (/^1/.test(n)) return ret(n.length < 9 ? 'kisa' : 'gecersiz')
    const b = sayi(9, 9); if (b) return b
    return /^[23478]/.test(n) ? tamam(ulke, n) : ret('gecersiz')
  }
  if (ulke === 'gb') {
    if (n.startsWith('0')) n = n.slice(1)
    const b = sayi(9, 10); if (b) return b
    return /^[1-9]/.test(n) ? tamam(ulke, n) : ret('gecersiz')
  }
  if (ulke === 'nz') {
    if (n.startsWith('0')) n = n.slice(1)
    const b = sayi(8, 10); if (b) return b
    return /^[2-9]/.test(n) ? tamam(ulke, n) : ret('gecersiz')
  }
  if (ulke === 'uz') {
    if (!uluslararasi && n.length === 10 && n.startsWith('8')) n = n.slice(1) // the national trunk prefix
    const b = sayi(9, 9); if (b) return b
    return tamam(ulke, n)
  }
  // tr
  if (n.startsWith('0')) n = n.slice(1)
  const b = sayi(10, 10); if (b) return b
  return /^[2-58]/.test(n) ? tamam(ulke, n) : ret('gecersiz')
}

/** The stored value of a phone typed on a form, or null for an empty optional field. Throws nothing: use `telefonCoz` for the reason. */
export function telefonKaydi(ulke: TelefonUlke, ham: string | null | undefined, secenek?: TelefonSecenegi): string | null {
  const r = telefonCoz(ulke, ham, secenek)
  return r.tamam ? r.e164 : null
}

/** true = the pack's country code. Maps the kit's country code to this module's. */
export const telefonUlkesi = (kod: string): TelefonUlke | null => (kod === 'tr' || kod === 'us' || kod === 'ca' || kod === 'au' || kod === 'nz' || kod === 'gb' || kod === 'uz' ? kod : null)
