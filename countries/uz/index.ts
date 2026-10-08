/**
 * NOTYA-ULKE-01 — Uzbekistan's country pack. Decisions and open questions: docs/COUNTRY-PACK-UZBEKISTAN.md.
 *
 * Everything is OFF unless listed here. Nothing in this folder may come from countries/tr (scripts/ulke-duvarlari.mjs),
 * and nothing here falls back to Türkiye's content — a missing item hides the feature.
 *
 * Keep this file light: data and pure functions only (the middleware and the browser bundle load it).
 * Values marked "to verify" are from secondary sources and wait for the local clinical lead / lawyer.
 */
import { paketMetinleri, type UlkePaketi } from '@/lib/ulke/tipler'
import {
  UZ_LATN_BEKLETME, UZ_LATN_DAVETLI_KAYIT, UZ_LATN_GIRIS, UZ_LATN_HESAP, UZ_LATN_SISTEM,
  UZ_RU_BEKLETME, UZ_RU_DAVETLI_KAYIT, UZ_RU_GIRIS, UZ_RU_HESAP, UZ_RU_SISTEM,
} from './metinler'
import { uzAramaKatla } from './arama'

const metin = paketMetinleri({
  acikDiller: ['uz-Latn', 'ru'],
  yuzeyler: ['hesap', 'giris', 'davetliKayit', 'bekletme', 'sistem'],
  metinler: {
    'uz-Latn': { hesap: UZ_LATN_HESAP, giris: UZ_LATN_GIRIS, davetliKayit: UZ_LATN_DAVETLI_KAYIT, bekletme: UZ_LATN_BEKLETME, sistem: UZ_LATN_SISTEM },
    ru: { hesap: UZ_RU_HESAP, giris: UZ_RU_GIRIS, davetliKayit: UZ_RU_DAVETLI_KAYIT, bekletme: UZ_RU_BEKLETME, sistem: UZ_RU_SISTEM },
  },
})

/** Mobile number: +998 and nine digits, in any common spelling. Operator prefixes are not checked (to verify). */
function uzCepGecerliMi(ham: string | null | undefined): boolean {
  const t = String(ham ?? '').trim()
  if (!t || !/^[0-9+()\-.\s]+$/.test(t)) return false
  let rakam = t.replace(/\D/g, '')
  if (rakam.startsWith('00')) rakam = rakam.slice(2)
  if (rakam.length === 12 && rakam.startsWith('998')) rakam = rakam.slice(3)
  return /^[1-9]\d{8}$/.test(rakam)
}

export const UZ_PAKETI: UlkePaketi = {
  kod: 'uz',
  iz: 'notya-ulke-paketi:uz:3f7a05d6c1',
  diller: ['uz-Latn', 'uz-Cyrl', 'ru'],
  acikDiller: metin.acikDiller,
  varsayilanDil: 'uz-Latn',
  paraBirimi: { kod: 'UZS', simge: 'soʻm', ondalikHane: 0 },
  saatDilimi: 'Asia/Tashkent',
  bicim: { yerel: 'uz-Latn-UZ', tarihDeseni: 'DD.MM.YYYY', ondalikAyraci: ',', binlikAyraci: ' ', haftaBasi: 1 },
  telefon: { ulkeOnEki: '+998', ulusalHane: 9, ornek: '+998 90 123 45 67', cepGecerliMi: uzCepGecerliMi },
  // JSHSHIR (PINFL): 14 digits. Format only — the check-digit rule is to verify (checklist G5).
  ulusalKimlik: { ad: 'JSHSHIR', hane: 14, gecerliMi: (ham) => /^\d{14}$/.test(String(ham ?? '').trim()) },
  // Fail closed: only what has been built FOR Uzbekistan is on. Landing page, login, sign-up by invitation code, and
  // the single holding page an account sees after login (NOTYA-ULKE-01, 2026-10-08). Everything else is off —
  // including the voice profile and image evaluation, until the law is confirmed (checklist A2, A4, I7).
  ozellikler: {
    acilisSayfasi: true,
    cekirdekGiris: true,
    davetliKayit: true,
    bekletmeSayfasi: true,
    // NOTYA-UZ-MUAYENE-01 (2026-10-08): the first product slice — first-login language question, settings, home,
    // patients, visit recording to an approved note. Where it is on, a signed-in account lands on /today instead of
    // the holding page. Sign-up is still by invitation code only, so nobody reaches it uninvited.
    cekirdekMuayene: true,
  },
  // No tool is valid in Uzbekistan yet: docs/COUNTRY-PACK-UZ-TOOLS-AUDIT.md is a proposal awaiting a local clinical lead.
  araclar: [],
  // The ONLY paths that exist in an Uzbekistan deployment. Every other path of the application answers 404 in the
  // middleware. A path is added here in the same pull request that brings its Uzbek and Russian text and its leak test.
  rotalar: {
    sayfalar: ['/', '/login', '/signup', '/welcome', '/start', '/today', '/settings', '/patients', '/patients/new', '/patient'],
    apiOnEkleri: ['/api/ulke/'],
  },
  aramaMotorlarinaGizli: true,
  kabuk: {
    baslik: 'Notya',
    aciklama: 'Shifokorlar va klinikalar uchun klinik yordamchi.',
    zemin: '#f4eee3',
  },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { 'uz-Latn': 'Oʻzbekcha', 'uz-Cyrl': 'Ўзбекча', ru: 'Русский' },
  uygulama: {
    // Inside the signed-in application an account may also choose Uzbek in Cyrillic script: those screens are written
    // in all three forms (countries/uz/uygulama/metinler.ts). The public pages above stay in the two `acikDiller`.
    diller: ['uz-Latn', 'uz-Cyrl', 'ru'],
    // The patient's own language, recorded per patient (script is the doctor's choice, not the patient's).
    hastaDilleri: ['uz', 'ru'],
    aramaKatla: uzAramaKatla,
  },
}
