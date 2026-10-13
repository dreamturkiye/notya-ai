/**
 * NOTYA-ULKE-EN-01 — THE ENGLISH LANGUAGE SET: the core surfaces (login, sign-up by invitation, the holding page,
 * the not-found and error pages). 48 texts, the same in every English-speaking country.
 *
 * MACHINE-WRITTEN. No native editor and no lawyer of any of the five countries has read this text
 * (docs/COUNTRY-PACK-CHECKLIST.md E11). Written fresh from the kit's keys (lib/ulke/tipler.ts → YuzeyAnahtarlari);
 * nothing is translated from another country's catalogue.
 *
 * Written in en-GB spelling; `enCekirdek(form)` gives the catalogue in a country's form (./varyant.ts).
 * No claim is made here about what the product is approved for, complies with or connects to.
 */
import type { YuzeyMetinleri } from '@/lib/ulke/tipler'
import { enCevir, type EnBicim } from './varyant'

const HESAP: YuzeyMetinleri<'hesap'> = {
  girisReddi: 'The email address or password is not correct.',
}

const GIRIS: YuzeyMetinleri<'giris'> = {
  altBaslik: 'Sign in to your account',
  eposta: 'Email address',
  epostaOrnek: 'doctor@example.com',
  sifre: 'Password',
  sifreOrnek: 'Your password',
  gonder: 'Sign in',
  gonderiliyor: 'Signing in…',
  bosAlan: 'Enter your email address and password.',
  hata: 'We could not sign you in. Please try again.',
  baglantiHatasi: 'No connection. Check your internet connection and try again.',
  cokDeneme: 'Too many attempts. Please try again in a few minutes.',
  hazirDegil: 'Signing in is not available yet.',
  davetSorusu: 'Have an invitation code?',
  kayitBaglantisi: 'Create an account',
  anaSayfa: 'Home',
}

const DAVETLI_KAYIT: YuzeyMetinleri<'davetliKayit'> = {
  baslik: 'Create an account with an invitation code',
  aciklama: 'For now, accounts are opened by invitation only.',
  adSoyad: 'Full name',
  eposta: 'Email address',
  sifre: 'Password',
  sifreTekrar: 'Password (again)',
  davetKodu: 'Invitation code',
  dil: 'Language',
  gonder: 'Create account',
  gonderiliyor: 'Creating your account…',
  eksikAlan: 'Fill in every field.',
  epostaGecersiz: 'The email address does not look right. Please check it.',
  sifreKisa: 'The password must be at least 8 characters long.',
  sifreUyusmuyor: 'The two passwords do not match.',
  kodGecersiz: 'The invitation code is not valid or has already been used.',
  olusturulamadi: 'We could not create the account. Check the details and try again.',
  baglantiHatasi: 'No connection. Check your internet connection and try again.',
  basarili: 'Your account has been created. You can sign in now.',
  girisSorusu: 'Already have an account?',
  girisBaglantisi: 'Sign in',
  kodYokSorusu: 'No invitation code?',
  fiyatBaglantisi: 'Request a quote',
}

const BEKLETME: YuzeyMetinleri<'bekletme'> = {
  baslik: 'Your pilot access is being prepared',
  govde: 'Your account has been created. Access is being opened in stages; we will contact you when it is your turn.',
  cikis: 'Sign out',
  yukleniyor: 'Loading…',
}

const SISTEM: YuzeyMetinleri<'sistem'> = {
  bulunamadiBaslik: 'Page not found',
  bulunamadiGovde: 'There is no page at this address, or it has been moved.',
  anaSayfa: 'Home',
  hataBaslik: 'Something went wrong',
  hataGovde: 'There was a problem loading this page.',
  tekrarDene: 'Try again',
}

export const EN_CEKIRDEK_TEMEL = { hesap: HESAP, giris: GIRIS, davetliKayit: DAVETLI_KAYIT, bekletme: BEKLETME, sistem: SISTEM } as const

/** The core surfaces in a country's form of English. */
export function enCekirdek(bicim: EnBicim): { hesap: YuzeyMetinleri<'hesap'>; giris: YuzeyMetinleri<'giris'>; davetliKayit: YuzeyMetinleri<'davetliKayit'>; bekletme: YuzeyMetinleri<'bekletme'>; sistem: YuzeyMetinleri<'sistem'> } {
  return enCevir(EN_CEKIRDEK_TEMEL, bicim)
}
