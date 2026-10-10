/**
 * NOTYA-ULKE-OZEL-01 — THE TEST COUNTRY "xx": a complete country pack that exists IN NO BUILD. TESTS ONLY.
 *
 * WHY IT EXISTS. Since NOTYA-ULKE-OZEL-01 a country can have roles and tools of its own, state its numbers in its own
 * units, limit a tool to some patients, state licences and link out to an official calculator — each without touching
 * another country. No real country uses any of that yet. This pack uses ALL of it, so that every extension point is
 * proven by a pack that passes the whole pack check, and so that tests can show that what one country adds reaches
 * no other (lib/ulke/ornekUlke.test.ts, lib/ulke/ulkeyeOzel.paket.test.ts).
 *
 * WHAT IT IS NOT. Not a country of the product: its code is not in lib/ulke/tipler.ts, no door of countries/active
 * knows it, no folder under countries/ holds it, and nothing outside tests may import this folder (wall rule D2 keeps
 * lib/ulke/testing/ to tests and scripts). Its keys are listed for "xx" in countries/yasak-araclar.json, so wall rule
 * D7 would stop any real pack, language set or kit file from naming one. Not content: every limit, band, table,
 * conversion, licence and address in this folder is invented (./tanimlar.ts).
 *
 * It takes the English language set exactly as an English-speaking country does (./ayarlar.ts is its `ayarlar.ts`):
 * the way a real country uses each extension point can be read off this folder.
 */
import { enArayuz } from '@/countries/_dil/en/arayuz'
import { enCekirdek } from '@/countries/_dil/en/cekirdek'
import { enKlinik } from '@/countries/_dil/en/klinik'
import { enRolAnahtarlari } from '@/countries/_dil/en/klinik/roller'
import type { UlkeArayuzu } from '../../arayuz/tipler'
import { paketMetinleri, type UlkeKlinigi, type UlkeKodu, type UlkePaketi } from '../../tipler'
import { XX_BIRIMLER, XX_GIRDI, XX_ROLLER, XX_VELI_YASI } from './ayarlar'
import { XX } from './tanimlar'

export { XX_OZEL_ARACLAR } from './araclar'
export { XX_GIRDI, XX_LISANSLAR, XX_OZEL_ROLLER, XX_ROLLER } from './ayarlar'
export { XX, XX_OLCULER, XX_TANIMLAR } from './tanimlar'

const metin = paketMetinleri({
  acikDiller: ['en-GB'],
  yuzeyler: ['hesap', 'giris', 'davetliKayit', 'bekletme', 'sistem'],
  metinler: { 'en-GB': enCekirdek('en-GB') },
})

export const XX_PAKETI: UlkePaketi = {
  // Not one of the product's countries: the type lists those, and this code is deliberately not among them.
  kod: XX as UlkeKodu,
  iz: 'notya-ulke-paketi:xx:test-only-in-no-build',
  diller: ['en-GB'],
  acikDiller: metin.acikDiller,
  varsayilanDil: 'en-GB',
  paraBirimi: { kod: 'XXX', simge: '¤', ondalikHane: 2 },
  saatDilimi: 'Etc/UTC',
  bicim: { yerel: 'en-GB', tarihDeseni: 'DD/MM/YYYY', ondalikAyraci: '.', binlikAyraci: ',', haftaBasi: 1 },
  telefon: { ulkeOnEki: '+00', ulusalHane: 9, ornek: '+00 000 000 000', cepGecerliMi: (ham) => /^\+?\d[\d ]{6,}$/.test(String(ham ?? '').trim()) },
  ulusalKimlik: { ad: 'Patient identifier', hane: 0, gecerliMi: (ham) => String(ham ?? '').trim().length > 0 },
  ozellikler: { acilisSayfasi: true, cekirdekGiris: true, davetliKayit: true, bekletmeSayfasi: true, cekirdekMuayene: true, randevu: true, hastaPortali: true, hastaFormu: true, araclar: true },
  araclar: [],
  rotalar: {
    sayfalar: ['/', '/login', '/signup', '/welcome', '/start', '/today', '/settings', '/patients', '/patients/new', '/patient', '/visit', '/calendar', '/portal', '/tools'],
    apiOnEkleri: ['/api/ulke/'],
  },
  yolOnEki: '/xx',
  aramaMotorlarinaGizli: true,
  kabuk: { baslik: 'Notya', aciklama: 'A clinical assistant for doctors and clinics.', zemin: '#f4eee3' },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { 'en-GB': 'English' },
  uygulama: {
    diller: ['en-GB'],
    hastaDilleri: ['en'],
    // THE COUNTRY'S OWN ROLE LIST: the shared forty with this country's differences (./ayarlar.ts → XX_ROLLER).
    roller: enRolAnahtarlari(XX_ROLLER),
    randevu: { varsayilan: { gunler: [1, 2, 3, 4, 5], baslangic: '09:00', bitis: '17:00', sureDk: 30, molalar: [{ baslangic: '13:00', bitis: '14:00' }] }, sureSecenekleri: [10, 15, 20, 30, 45, 60, 90] },
    portal: { baglantiGecerlilikGun: 30, acilNumara: null },
    dilGruplari: [{ temel: 'en', bicimler: [{ yazi: null, dil: 'en-GB' }] }],
    saatDilimleri: ['Etc/UTC'],
    saatBicimi: 24,
    birimler: XX_BIRIMLER,
    adAlanlari: { ikinciAd: false },
    kimlikNumarasi: { dogrula: false },
    veliYasi: XX_VELI_YASI,
    kayitAcik: false,
  },
}

export const XX_ARAYUZ: UlkeArayuzu = enArayuz(XX_GIRDI)
export const XX_KLINIK: UlkeKlinigi = enKlinik(XX_GIRDI)
