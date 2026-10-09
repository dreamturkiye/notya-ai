/**
 * NOTYA-ULKE-SABLON-01 — what the pack-neutral walk-through (./genel.mjs) needs to know about the country it walks,
 * printed as JSON. Read from the ACTIVE pack, so the walk-through itself names no country and holds no text.
 *
 *   NOTYA_COUNTRY=<code> npx --yes tsx scripts/ulke-yuruyus/paket-bilgisi.mts > <dir>/paket.json
 *
 * Tests-and-scripts only (it reads countries/tumu for the OTHER countries' leak terms).
 */
import { AKTIF_PAKET as p } from '@/countries/active'
import { AKTIF_ARAYUZ as a } from '@/countries/active/arayuz'
import { AKTIF_KLINIK as k } from '@/countries/active/klinik'
import { TUM_ULKELER } from '@/countries/tumu'
import { EKSIK_ISARETI } from '@/lib/ulke/eksik'

if (!a || !k || !p.uygulama) throw new Error(`"${p.kod}" does not bring the signed-in application: nothing to walk through`)
const d = p.varsayilanDil
const digerleri = Object.entries(TUM_ULKELER).filter(([kod]) => kod !== p.kod)
const ilkRol = a.roller[0] ?? null
process.stdout.write(JSON.stringify({
  kod: p.kod, yolOnEki: p.yolOnEki ?? '', dil: d, acikDiller: p.acikDiller, uygulamaDilleri: p.uygulama.diller, dilGruplari: p.uygulama.dilGruplari,
  hastaDilleri: p.uygulama.hastaDilleri, saatDilimleri: p.uygulama.saatDilimleri, saatBicimi: p.uygulama.saatBicimi, tarihDeseni: p.bicim.tarihDeseni,
  kayitAcik: p.uygulama.kayitAcik, gizli: p.aramaMotorlarinaGizli, ikinciAd: p.uygulama.adAlanlari.ikinciAd, kimlik: Boolean(p.ulusalKimlik), telefonOrnek: p.telefon.ornek,
  randevu: Boolean(p.ozellikler.randevu), acilis: Boolean(p.ozellikler.acilisSayfasi && a.acilis),
  roller: a.roller.map((r) => r.anahtar), ilkRol: ilkRol ? { anahtar: ilkRol.anahtar, ad: ilkRol.ad[d], alanlar: a.notSablonlari.rolAlanlari[ilkRol.anahtar] ?? [], asistan: a.asistan(ilkRol.anahtar, d) } : null,
  genelSablon: a.notSablonlari.genelSablon, sablonlar: k.sablonlar, rizaSurumu: k.riza.surum, konusmaModeli: k.konusma.model,
  sttKodu: Object.keys(k.konusma.beklenenDiller)[0], zorlamaKodu: k.konusma.zorlamaDilKodlari[d] ?? null, gunlukLimit: k.gunlukMuayeneLimiti,
  marka: a.marka, m: a.metinler[d], r: a.randevuMetinleri[d] ?? null, giris: p.metinler[d]?.giris ?? null, hesap: p.metinler[d]?.hesap ?? null, kayit: p.metinler[d]?.davetliKayit ?? null,
  acilisIcerigi: a.acilis ? { baslik: a.acilis.icerik[d]?.kahraman.baslik, metaBaslik: a.acilis.icerik[d]?.meta.baslik, capalar: a.acilis.capalar } : null,
  // what must NEVER be on a screen of this country: the "to be supplied" marker, and what marks another country's content
  eksikIsareti: EKSIK_ISARETI,
  yabanci: digerleri.map(([kod, u]) => ({ kod, terimler: u.sizintiTerimleri.filter((t) => !t.terim.includes(EKSIK_ISARETI)), harfler: u.sizintiHarfleri, iz: u.paket.iz })),
}))
