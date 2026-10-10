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
import { hastaIcinBicim } from '@/lib/ulke/arayuz/dilSecimi'
import { ISTEK_GUN_AZAMI, PIN_DENEME_AZAMI, PIN_HANE } from '@/lib/ulke/portal/sabitler'
import { kitAraci } from '@/lib/ulke/araclar/katalog'
import { hesabinAraclari } from '@/lib/ulke/araclar/paket'
import { ornekGirdiler } from '@/lib/ulke/testing/aracOrnekleri'
import { ulkeGunu } from '@/lib/ulke/uygulama/gun'
import { MESAJ_AZAMI } from '@/lib/ulke/mesaj/sabitler'
import { SABLON_ARACI } from '@/lib/ulke/sablon/sabitler'
import { KONSULTASYON_ARACI } from '@/lib/ulke/konsultasyon/sabitler'

if (!a || !k || !p.uygulama) throw new Error(`"${p.kod}" does not bring the signed-in application: nothing to walk through`)
const d = p.varsayilanDil
const digerleri = Object.entries(TUM_ULKELER).filter(([kod]) => kod !== p.kod)
const ilkRol = a.roller[0] ?? null
// NOTYA-ULKE-PORTAL-01 — the patient portal: the form a patient of the first patient language reads their page in
// when their doctor works in the default form, and the catalogues in that form.
const portalAcik = Boolean(p.ozellikler.hastaPortali && a.portalMetinleri)
const hastaBicimi = hastaIcinBicim(p.uygulama.dilGruplari, p.uygulama.hastaDilleri[0], { dil: d, notDili: d })
// NOTYA-ULKE-INTAKE-01 — the intake form: the catalogues in the doctor's and the patient's form, the consent sentence
// for each reader, and the KEYS of the question sets (the core set, the first role's, every other role's) — so the
// walk-through can tell whose question is on a screen without holding a single question itself.
const hf = k.hastaFormu
const formAcik = Boolean(portalAcik && p.ozellikler.hastaFormu && a.formMetinleri && hf)
const bicimde = (m: unknown) => (m as Record<string, string>)[hastaBicimi] ?? ''
// NOTYA-ULKE-ARACLAR-01 — the tools area: the tiles of the first role (the role the walk-through signs up with), and
// ONE tool whose result can be kept, with a form the kit's own samples fill in — for the first role that has one.
// The walk-through holds no tool and no field: it types what is written here.
const ar = p.ozellikler.araclar ? a.araclar ?? null : null
const kutular = (rol: string | null) => { const x = hesabinAraclari(ar, rol); return [...x.temel, ...x.rol].map((t) => t.tanim.anahtar) }
const bugun = ulkeGunu(new Date(), p.saatDilimi)
const aracOrnegi = (() => {
  if (!ar) return null
  // NOTYA-ULKE-DENETIM-01a — a tool with a NUMBER field is preferred, so the walk-through can type a number the other
  // country's way and see it refused; where the pack has none, any tool that answers serves.
  for (const sayili of [true, false]) for (const r of a.roller) for (const x of hesabinAraclari(ar, r.anahtar).rol) {
    const t = x.tanim
    if (sayili && !t.alanlar.some((al) => al.tur === 'sayi' && !al.kosul)) continue
    // no date field (a sample's dates are fixed days), no laboratory unit, no number the country has to state
    if (t.tur === 'ekran' || (t.parametreler ?? []).length || t.alanlar.some((al) => al.tur === 'tarih' || al.lab || al.olcu)) continue
    const g = ornekGirdiler(t).find((ornek) => t.hesapla(ornek, { bugun, p: {} }).tamam)
    if (!g) continue
    const ham = t.alanlar.filter((al) => g[al.anahtar] !== null && g[al.anahtar] !== false && g[al.anahtar] !== undefined).map((al) => ({ anahtar: al.anahtar, tur: al.tur, deger: g[al.anahtar] === true ? true : typeof g[al.anahtar] === 'number' ? String(g[al.anahtar]).replace('.', p.bicim.ondalikAyraci) /* typed the pack's way */ : String(g[al.anahtar]) }))
    if (sayili && !ham.some((h) => h.tur === 'sayi')) continue
    return { rol: r.anahtar, anahtar: t.anahtar, ad: x.paket.metin.ad[d], ham }
  }
  return null
})()
// NOTYA-ULKE-KLINIK-01 — clinic accounts: the catalogue in the default form, the pack's settings, and the two roles the
// walk-through signs up with — a doctor's role, and an allied role that may be given a share (null where the pack
// lists none). The walk-through holds no position name and no sentence: it reads them from here.
const kh = p.ozellikler.klinikHesaplari ? p.uygulama.klinikHesaplari ?? null : null
const klinikBilgisi = kh && a.klinikMetinleri?.[d] ? {
  m: a.klinikMetinleri[d], yetkiTurleri: kh.yetkiTurleri, paylasimRolleri: kh.paylasimRolleri, vekaletAzamiGun: kh.vekaletAzamiGun, davetGecerlilikGun: kh.davetGecerlilikGun, sahipHekimAdinaVerebilir: kh.sahipHekimAdinaVerebilir,
  hekimRolu: a.roller.find((r) => r.taraf !== 'klinik-muttefik')?.anahtar ?? null,
  muttefikRolu: a.roller.find((r) => r.taraf === 'klinik-muttefik' && kh.paylasimRolleri.includes(r.anahtar))?.anahtar ?? null,
  // an allied role that may NOT be given a share, where the pack has one: the grant must be refused for it
  paylasimsizRol: a.roller.find((r) => r.taraf === 'klinik-muttefik' && !kh.paylasimRolleri.includes(r.anahtar))?.anahtar ?? null,
} : null
process.stdout.write(JSON.stringify({
  kod: p.kod, yolOnEki: p.yolOnEki ?? '', dil: d, acikDiller: p.acikDiller, uygulamaDilleri: p.uygulama.diller, dilGruplari: p.uygulama.dilGruplari,
  hastaDilleri: p.uygulama.hastaDilleri, saatDilimleri: p.uygulama.saatDilimleri, saatBicimi: p.uygulama.saatBicimi, tarihDeseni: p.bicim.tarihDeseni, ondalikAyraci: p.bicim.ondalikAyraci, binlikAyraci: p.bicim.binlikAyraci,
  kayitAcik: p.uygulama.kayitAcik, gizli: p.aramaMotorlarinaGizli, ikinciAd: p.uygulama.adAlanlari.ikinciAd, kimlik: Boolean(p.ulusalKimlik), telefonOrnek: p.telefon.ornek,
  randevu: Boolean(p.ozellikler.randevu), acilis: Boolean(p.ozellikler.acilisSayfasi && a.acilis),
  roller: a.roller.map((r) => r.anahtar), ilkRol: ilkRol ? { anahtar: ilkRol.anahtar, ad: ilkRol.ad[d], alanlar: a.notSablonlari.rolAlanlari[ilkRol.anahtar] ?? [], asistan: a.asistan(ilkRol.anahtar, d) } : null,
  genelSablon: a.notSablonlari.genelSablon, sablonlar: k.sablonlar, rizaSurumu: k.riza.surum, konusmaModeli: k.konusma.model,
  sttKodu: Object.keys(k.konusma.beklenenDiller)[0], zorlamaKodu: k.konusma.zorlamaDilKodlari[d] ?? null, gunlukLimit: k.gunlukMuayeneLimiti,
  marka: a.marka, m: a.metinler[d], r: a.randevuMetinleri[d] ?? null, giris: p.metinler[d]?.giris ?? null, hesap: p.metinler[d]?.hesap ?? null, kayit: p.metinler[d]?.davetliKayit ?? null,
  acilisIcerigi: a.acilis ? { baslik: a.acilis.icerik[d]?.kahraman.baslik, metaBaslik: a.acilis.icerik[d]?.meta.baslik, capalar: a.acilis.capalar } : null,
  portal: portalAcik ? {
    hastaBicimi, gecerlilikGun: p.uygulama.portal?.baglantiGecerlilikGun ?? null, acilNumara: p.uygulama.portal?.acilNumara ?? null, pinHane: PIN_HANE, pinDeneme: PIN_DENEME_AZAMI, istekGunAzami: ISTEK_GUN_AZAMI,
    hekim: a.portalMetinleri?.[d], hasta: a.portalMetinleri?.[hastaBicimi], hastaRandevu: a.randevuMetinleri[hastaBicimi] ?? null, ilkRolAdi: ilkRol ? ilkRol.ad[hastaBicimi] : '',
  } : null,
  form: formAcik && hf && a.formMetinleri ? {
    surum: hf.surum, rizaSurumu: hf.riza.surum, veliYasi: p.uygulama.veliYasi ?? null,
    riza: { metin: bicimde(hf.riza.metin), veliMetni: bicimde(hf.riza.veliMetni) },
    cekirdek: hf.cekirdek.bolumler.flatMap((b) => b.sorular.map((q) => q.anahtar)),
    ilkRol: ilkRol ? (hf.roller[ilkRol.anahtar]?.sorular.map((q) => q.anahtar) ?? []) : [],
    digerRoller: Object.entries(hf.roller).filter(([rol]) => rol !== ilkRol?.anahtar).flatMap(([, r]) => r.sorular.map((q) => q.anahtar)),
    hekim: a.formMetinleri[d]?.hekim, hasta: a.formMetinleri[hastaBicimi]?.hasta, davet: a.formMetinleri[hastaBicimi]?.davet, birim: a.formMetinleri[hastaBicimi]?.birim,
  } : null,
  araclar: ar ? {
    m: ar.metinler[d], bugun, ilkRolKutulari: kutular(ilkRol?.anahtar ?? null), ornek: aracOrnegi, ornekRolKutulari: aracOrnegi ? kutular(aracOrnegi.rol) : [],
    // the follow-up list, where the role of the sample tool has it
    panel: aracOrnegi ? (kutular(aracOrnegi.rol).find((k) => kitAraci(k)?.ekran === 'takipPaneli') ?? null) : null,
  } : null,
  // NOTYA-ULKE-MESAJ-01 — messages between a doctor and a patient (the doctor's words in the doctor's form, the
  // patient's in the patient's), "my templates", and consultation between doctors (the asking account's form and the
  // second account's, the two periods and the stamp of the consent sentence). No sentence is held by the walk-through.
  mesaj: portalAcik && p.ozellikler.hastaMesajlari && a.mesajMetinleri ? { hekim: a.mesajMetinleri[d]?.hekim, hasta: a.mesajMetinleri[hastaBicimi]?.hasta, azami: MESAJ_AZAMI, disBildirim: p.uygulama.mesaj?.disBildirim ?? null } : null,
  sablon: ar && p.ozellikler.hekimSablonlari && a.sablonMetinleri ? { m: a.sablonMetinleri[d], kutu: SABLON_ARACI } : null,
  konsultasyon: ar && p.ozellikler.konsultasyon && a.konsultasyonMetinleri && p.uygulama.konsultasyon ? {
    m: a.konsultasyonMetinleri[d], ikinci: a.konsultasyonMetinleri[p.uygulama.diller.at(-1) ?? d], kutu: KONSULTASYON_ARACI,
    acikGun: p.uygulama.konsultasyon.acikGun, kapanisSonrasiGun: p.uygulama.konsultasyon.kapanisSonrasiGun, rizaSurumu: k.konsultasyonRizasi?.surum ?? null,
  } : null,
  klinik: klinikBilgisi,
  // what must NEVER be on a screen of this country: the "to be supplied" marker, and what marks another country's content
  eksikIsareti: EKSIK_ISARETI,
  yabanci: digerleri.map(([kod, u]) => ({ kod, terimler: u.sizintiTerimleri.filter((t) => !t.terim.includes(EKSIK_ISARETI)), harfler: u.sizintiHarfleri, iz: u.paket.iz })),
}))
