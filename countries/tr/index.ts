/**
 * NOTYA-ULKE-01 — Türkiye's country pack. Reproduces what the application did on main on 2026-10-08, by pointing at the
 * existing validators instead of restating them.
 *
 * Keep this file light: data and pure functions only (the middleware and the browser bundle load it).
 * Reached only through countries/active/ — never import this folder from core code (scripts/ulke-duvarlari.mjs).
 */
import { paketMetinleri, type UlkePaketi } from '@/lib/ulke/tipler'
import { cepTelefonuDogrula } from '@/lib/iletisim/cepTelefonu'
import { tcKimlikGecerli } from '@/lib/enabiz/mbys/kontrol'
import { TR_ARACLARI } from './araclar'
import { TR_HESAP } from './metinler'

const metin = paketMetinleri({
  acikDiller: ['tr'],
  yuzeyler: ['hesap'],
  metinler: { tr: { hesap: TR_HESAP } },
})

export const TR_PAKETI: UlkePaketi = {
  kod: 'tr',
  iz: 'notya-ulke-paketi:tr:8d41c7e2b9',
  diller: ['tr'],
  acikDiller: metin.acikDiller,
  varsayilanDil: 'tr',
  paraBirimi: { kod: 'TRY', simge: '₺', ondalikHane: 2 },
  saatDilimi: 'Europe/Istanbul',
  bicim: { yerel: 'tr-TR', tarihDeseni: 'DD.MM.YYYY', ondalikAyraci: ',', binlikAyraci: '.', haftaBasi: 1 },
  telefon: {
    ulkeOnEki: '+90',
    ulusalHane: 10,
    ornek: '0532 123 45 67',
    cepGecerliMi: (ham) => cepTelefonuDogrula(ham).ok,
  },
  ulusalKimlik: { ad: 'T.C. Kimlik No', hane: 11, gecerliMi: tcKimlikGecerli },
  ozellikler: {
    bolunmemisUygulama: true,
    doktorAraclari: true,
    asistan: true,
    sesProfili: true,
    goruntuDegerlendirme: true,
  },
  araclar: TR_ARACLARI,
  rotalar: 'hepsi',
  aramaMotorlarinaGizli: false,
  kabuk: {
    baslik: 'Notya AI — Yapay Zekâ Uzman Asistanı',
    aciklama: 'Doktorun cebindeki dünyaca ünlü uzman. Sesli komutla hasta oluştur, tanı al, reçete yaz.',
    zemin: '#0A1628',
  },
  yuzeyler: metin.yuzeyler,
  metinler: metin.metinler,
  dilAdlari: { tr: 'Türkçe' },
}
