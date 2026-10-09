/**
 * NOTYA-ULKE-SABLON-01 — THE PACK CHECK. Everything the country kit needs from a pack, checked in one place, and
 * answered with a LIST: every missing catalogue entry, every setting that is absent, still marked "to be supplied",
 * or at odds with another one. Pure: the pack and its three halves come in as arguments.
 *
 *   - A country's BUILD fails on a non-empty list: its root layout calls `aktifPaketiDenetle()` when it loads
 *     (lib/ulke/paketDenetimiAktif.ts), and the message is the whole list. No pack ever falls back to another
 *     pack's text or to a default of the kit: what is missing is an error, by name.
 *   - The same function runs over EVERY pack in the tests (lib/ulke/paket.paket.test.ts), so a pack that goes
 *     incomplete is caught before anyone builds it.
 *
 * A pack that is the pre-split application (`bolunmemisUygulama`) brings none of this and is not checked here.
 */
import type { UlkeAcilisi } from './arayuz/acilisTipleri'
import { NOT_BOLUMLERI, ROL_TARAFLARI, type UlkeArayuzu } from './arayuz/tipler'
import { eksikAyarMi, eksikMetinMi } from './eksik'
import { ARACLAR_YER_TUTUCULARI, araclarSorunlari } from './araclar/denetim'
import { formIcerigiSorunlari } from './intake/sorular'
import { mesajSorunlari } from './mesaj/denetim'
import { sablonSorunlari } from './sablon/denetim'
import type { DilGrubu, DilKodu, UlkeKlinigi, UlkePaketi } from './tipler'

export type PaketSorunu = { /** Where: a path inside the pack ("uygulama.saatDilimleri", "metinler[en].kabuk.bugun"). */ yer: string; /** What is wrong, in one line. */ sorun: string }

const dolu = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0
const sahip = (o: unknown, k: string): boolean => typeof o === 'object' && o !== null && Object.prototype.hasOwnProperty.call(o, k)
const TESLIM = 'to be supplied'
/** A list, or nothing where the pack has not decided yet (a marker is not a list). */
const liste = <T,>(x: readonly T[] | null | undefined): readonly T[] => (Array.isArray(x) ? x : [])
/** A record, or nothing where the pack has not decided yet. */
const kayit = <T,>(x: Readonly<Record<string, T>> | null | undefined): Readonly<Record<string, T>> => (x && typeof x === 'object' && !eksikAyarMi(x) && !Array.isArray(x) ? x : {})

/** Every setting still marked "to be supplied", anywhere in a half of the pack — so none can hide in a place no rule below looks at. */
function isaretleriTopla(deger: unknown, yer: string, cikti: PaketSorunu[], gorulen = new Set<unknown>()): void {
  if (eksikAyarMi(deger)) { cikti.push({ yer, sorun: `${TESLIM}: ${deger.__eksikAyar}` }); return }
  if (!deger || typeof deger !== 'object' || gorulen.has(deger)) return
  gorulen.add(deger)
  if (Array.isArray(deger)) { deger.forEach((x, i) => isaretleriTopla(x, `${yer}[${i}]`, cikti, gorulen)); return }
  for (const [k, v] of Object.entries(deger)) isaretleriTopla(v, yer ? `${yer}.${k}` : k, cikti, gorulen)
}

/** Every string, at any depth, must be there and must not be a "to be supplied" marker. Functions are left alone. */
function metinleriGez(deger: unknown, yer: string, sorunlar: PaketSorunu[], bosOlabilir: (yer: string) => boolean = () => false): void {
  if (eksikAyarMi(deger)) { sorunlar.push({ yer, sorun: `${TESLIM}: ${deger.__eksikAyar}` }); return }
  if (typeof deger === 'string') {
    const metin: string = deger
    if (eksikMetinMi(metin)) sorunlar.push({ yer, sorun: TESLIM })
    else if (!metin.trim() && !bosOlabilir(yer)) sorunlar.push({ yer, sorun: 'empty text' })
    return
  }
  if (Array.isArray(deger)) { deger.forEach((x, i) => metinleriGez(x, `${yer}[${i}]`, sorunlar, bosOlabilir)); return }
  if (deger && typeof deger === 'object') for (const [k, v] of Object.entries(deger)) metinleriGez(v, yer ? `${yer}.${k}` : k, sorunlar, bosOlabilir)
}

/** Sentences of the portal catalogue that carry a value: path → the placeholders they must hold (lib/ulke/arayuz/metinTipleri.ts → PortalMetni). */
const PORTAL_YER_TUTUCULARI: readonly (readonly [string, readonly string[]])[] = [
  ['erisim.durumAcik', ['%']], ['erisim.sonGiris', ['%']], ['ozet.dil', ['%']], ['ozet.paylasildi', ['%']], ['istek.istekTarihi', ['%']],
  ['giris.pinBicimi', ['%']], ['giris.pinYanlis', ['%']],
  ['sayfa.selam', ['%']], ['sayfa.saatDilimi', ['%']], ['sayfa.muayene', ['%']], ['sayfa.istekAciklama', ['%']], ['sayfa.istekCokGun', ['%']], ['sayfa.istekGunler', ['%']], ['sayfa.istekKabul', ['%1', '%2']], ['sayfa.acilNumara', ['%']],
]

/** Sentences of the intake form's catalogue that carry a value (lib/ulke/arayuz/metinTipleri.ts → FormMetni). */
const FORM_YER_TUTUCULARI: readonly (readonly [string, readonly string[]])[] = [
  ['hekim.durumBekliyor', ['%']], ['hekim.durumTaslak', ['%']], ['hekim.durumGonderildi', ['%']],
  ['davet.metin', ['%1', '%2']], ['davet.metinAdsiz', ['%']], ['davet.baglantisiz', ['%']],
  ['hasta.bolum', ['%1', '%2']], ['hasta.sayiGecersiz', ['%1', '%2']], ['hasta.gonderildi', ['%']],
]

function saatDilimiGecerli(z: unknown): boolean {
  if (!dolu(z)) return false
  try { new Intl.DateTimeFormat('en-GB', { timeZone: z }); return true } catch { return false }
}

export function paketiDenetle(paket: UlkePaketi, arayuz: UlkeArayuzu | null, klinik: UlkeKlinigi | null): PaketSorunu[] {
  const s = kurallar(paket, arayuz, klinik)
  if (paket.ozellikler.bolunmemisUygulama) return s
  // … and every marker the rules did not name themselves, once each.
  const isaretler: PaketSorunu[] = []
  isaretleriTopla({ ...paket, metinler: undefined }, '', isaretler)
  isaretleriTopla(arayuz ? { ...arayuz, metinler: undefined, randevuMetinleri: undefined, portalMetinleri: undefined, formMetinleri: undefined, mesajMetinleri: undefined, sablonMetinleri: undefined, araclar: undefined, acilis: arayuz.acilis ? { ...arayuz.acilis, icerik: undefined } : null } : null, 'arayuz', isaretler)
  isaretleriTopla(klinik, 'klinik', isaretler)
  const bilinen = new Set(s.map((x) => x.yer))
  for (const i of isaretler) if (!bilinen.has(i.yer) && !bilinen.has(i.yer.replace(/^uygulama\./, '')) && !bilinen.has(`uygulama.${i.yer}`)) { s.push(i); bilinen.add(i.yer) }
  // one line per finding, however many rules met it
  const tek = new Set<string>()
  return s.filter((x) => { const k = `${x.yer}\u0000${x.sorun}`; if (tek.has(k)) return false; tek.add(k); return true })
}

function kurallar(paket: UlkePaketi, arayuz: UlkeArayuzu | null, klinik: UlkeKlinigi | null): PaketSorunu[] {
  const s: PaketSorunu[] = []
  const ekle = (yer: string, sorun: string) => s.push({ yer, sorun })
  if (paket.ozellikler.bolunmemisUygulama) return s

  // ── settings every pack states ──
  metinleriGez({ kabuk: paket.kabuk, paraBirimi: paket.paraBirimi, bicim: paket.bicim, telefon: { ulkeOnEki: paket.telefon.ulkeOnEki, ornek: paket.telefon.ornek }, saatDilimi: paket.saatDilimi, dilAdlari: paket.dilAdlari, ulusalKimlik: paket.ulusalKimlik ? { ad: paket.ulusalKimlik.ad } : null, yolOnEki: paket.yolOnEki ?? '' }, '', s, (yer) => yer === 'yolOnEki' || yer === 'bicim.binlikAyraci' /* a space is a thousands separator */)
  for (const [ad, v] of Object.entries({ varsayilanDil: paket.varsayilanDil, aramaMotorlarinaGizli: paket.aramaMotorlarinaGizli, 'paraBirimi.ondalikHane': paket.paraBirimi?.ondalikHane, 'bicim.haftaBasi': paket.bicim?.haftaBasi, 'telefon.ulusalHane': paket.telefon?.ulusalHane, 'telefon.cepGecerliMi': paket.telefon?.cepGecerliMi, 'ulusalKimlik.gecerliMi': paket.ulusalKimlik?.gecerliMi, 'ulusalKimlik.hane': paket.ulusalKimlik?.hane })) if (eksikAyarMi(v)) ekle(ad, `${TESLIM}: ${v.__eksikAyar}`)
  if (!/^[a-z]{2}$/.test(String(paket.kod))) ekle('kod', 'must be two lower-case letters')
  if (!eksikMetinMi(paket.saatDilimi) && !saatDilimiGecerli(paket.saatDilimi)) ekle('saatDilimi', 'not a time zone this platform knows')
  if (!eksikAyarMi(paket.bicim?.haftaBasi) && paket.bicim?.haftaBasi !== 1 && paket.bicim?.haftaBasi !== 7) ekle('bicim.haftaBasi', 'must be 1 (Monday) or 7 (Sunday)')
  {
    const d = String(paket.bicim?.tarihDeseni ?? '')
    const parcalar = d.match(/DD|MM|YYYY/g) ?? []
    const ayrac = d.replace(/DD|MM|YYYY/g, '')
    if (!eksikMetinMi(d) && (parcalar.length !== 3 || new Set(parcalar).size !== 3 || ayrac.length !== 2 || ayrac[0] !== ayrac[1])) ekle('bicim.tarihDeseni', 'must hold DD, MM and YYYY once each with one separator, like DD.MM.YYYY or MM/DD/YYYY')
  }
  if (!paket.acikDiller.length) ekle('acikDiller', 'no public language')
  if (!paket.acikDiller.includes(paket.varsayilanDil)) ekle('varsayilanDil', 'is not one of the public languages (acikDiller)')
  for (const d of paket.acikDiller) {
    if (!paket.diller.includes(d)) ekle(`acikDiller`, `"${d}" is not declared in diller`)
    if (!dolu(paket.dilAdlari[d])) ekle(`dilAdlari.${d}`, 'the language has no name for itself')
    const k = paket.metinler[d]
    if (!k) { ekle(`metinler[${d}]`, 'no catalogue for a public language'); continue }
    for (const y of paket.yuzeyler) {
      if (!k[y]) ekle(`metinler[${d}].${y}`, 'the surface is switched on and has no text')
      else metinleriGez(k[y], `metinler[${d}].${y}`, s)
    }
  }
  if (paket.yolOnEki !== undefined && !/^(\/[a-z0-9][a-z0-9-]*)?$/.test(paket.yolOnEki)) ekle('yolOnEki', 'must be empty or one path segment like "/uzbek"')
  if (paket.rotalar === 'hepsi') ekle('rotalar', 'only the pre-split application may open every route')

  // ── the landing page ──
  if (paket.ozellikler.acilisSayfasi) {
    const a: UlkeAcilisi | null = arayuz?.acilis ?? null
    if (!a) ekle('acilis', 'the landing page is switched on and the pack brings no content for it')
    else {
      if (!a.diller.length) ekle('acilis.diller', 'the page is written in no form')
      for (const d of paket.acikDiller) if (!a.diller.includes(d)) ekle('acilis.diller', `the public language "${d}" has no landing copy`)
      for (const d of a.diller) {
        if (!a.icerik[d]) ekle(`acilis.icerik[${d}]`, 'no copy for a form the page is written in')
        else metinleriGez(a.icerik[d], `acilis.icerik[${d}]`, s)
        if (!dolu(a.dilAdlari[d]?.ad) || !dolu(a.dilAdlari[d]?.kisa)) ekle(`acilis.dilAdlari.${d}`, 'the form has no name (ad, kisa)')
      }
      metinleriGez({ dilAdlari: a.dilAdlari, capalar: a.capalar, fontHref: a.fontHref, markaYazisi: a.markaYazisi }, 'acilis', s)
      const capalar = Object.values(a.capalar ?? {})
      if (new Set(capalar).size !== capalar.length) ekle('acilis.capalar', 'two sections share an anchor')
      for (const c of capalar) if (!eksikMetinMi(c) && !/^[a-z][a-z0-9-]*$/.test(String(c))) ekle('acilis.capalar', `"${c}" is not an anchor (lower-case letters, digits, hyphens)`)
      // the price section: the copy names plans, the price list says what each costs — the same plans on both sides
      const fiyatlar = kayit(a.fiyatlar)
      if (!a.fiyatlar) ekle('acilis.fiyatlar', 'the landing page has no price list (an empty one is {}, with no plan in the copy)')
      for (const [id, f] of Object.entries(fiyatlar)) {
        if (!f || !(f.aylik === null || (Number.isInteger(f.aylik) && f.aylik > 0))) ekle(`acilis.fiyatlar.${id}.aylik`, 'must be null (the price is given on request) or a whole number above zero')
        if (!f || typeof f.oneCikan !== 'boolean') ekle(`acilis.fiyatlar.${id}.oneCikan`, 'must be true or false')
      }
      for (const d of a.diller) {
        const n = a.icerik[d]?.narx
        if (!n) continue
        const gruplar = liste(n.gruplar)
        if (!gruplar.length) ekle(`acilis.icerik[${d}].narx.gruplar`, 'the price section has no group of plans')
        if (new Set(gruplar.map((g) => g.id)).size !== gruplar.length) ekle(`acilis.icerik[${d}].narx.gruplar`, 'two groups of plans share an id')
        for (const g of gruplar) if (!liste(g.rejalar).length) ekle(`acilis.icerik[${d}].narx.gruplar.${g.id}`, 'a group without a plan')
        const idler = gruplar.flatMap((g) => liste(g.rejalar).map((r) => r.id))
        if (new Set(idler).size !== idler.length) ekle(`acilis.icerik[${d}].narx.gruplar`, 'a plan is listed twice')
        if (a.fiyatlar && !eksikAyarMi(a.fiyatlar)) {
          for (const id of idler) if (!sahip(fiyatlar, id)) ekle(`acilis.fiyatlar.${id}`, `the "${d}" copy names this plan and the price list has no entry for it`)
          for (const id of Object.keys(fiyatlar)) if (!idler.includes(id)) ekle(`acilis.fiyatlar.${id}`, `is in the price list and the "${d}" copy names no such plan`)
        }
        if (dolu(n.oylik) && !eksikMetinMi(n.oylik) && !n.oylik.includes('%')) ekle(`acilis.icerik[${d}].narx.oylik`, 'must hold "%" where the amount is written')
      }
    }
  }

  // ── the signed-in application ──
  if (paket.ozellikler.hastaPortali && !paket.ozellikler.cekirdekMuayene) ekle('ozellikler.hastaPortali', 'the patient portal needs the signed-in application (cekirdekMuayene): a patient is given access from a patient file')
  if (paket.ozellikler.hastaFormu && !paket.ozellikler.hastaPortali) ekle('ozellikler.hastaFormu', 'the intake form needs the patient portal (hastaPortali): a patient fills it in on their own page')
  if (paket.ozellikler.araclar && !paket.ozellikler.cekirdekMuayene) ekle('ozellikler.araclar', 'the tools area needs the signed-in application (cekirdekMuayene)')
  if (paket.ozellikler.hastaMesajlari && !paket.ozellikler.hastaPortali) ekle('ozellikler.hastaMesajlari', 'messages between a doctor and a patient need the patient portal (hastaPortali): a patient reads and answers on their own page')
  if (paket.ozellikler.hekimSablonlari && !paket.ozellikler.cekirdekMuayene) ekle('ozellikler.hekimSablonlari', '"my templates" need the signed-in application (cekirdekMuayene)')
  if (!paket.ozellikler.cekirdekMuayene) return s
  const u = paket.uygulama
  if (!u) { ekle('uygulama', 'the application is switched on and the pack has no settings for it'); return s }
  if (!arayuz) { ekle('arayuz', 'the application is switched on and the pack brings no content for the shared screens'); return s }
  if (!klinik) ekle('klinik', 'the application is switched on and the pack has no clinical half (speech, consent, templates, instructions)')
  for (const [ad, v] of Object.entries({ saatBicimi: u.saatBicimi, veliYasi: u.veliYasi, kayitAcik: u.kayitAcik, 'adAlanlari.ikinciAd': u.adAlanlari?.ikinciAd, 'kimlikNumarasi.dogrula': u.kimlikNumarasi?.dogrula, birimler: u.birimler, 'birimler.agirlik': u.birimler?.agirlik, 'birimler.boy': u.birimler?.boy, 'birimler.sicaklik': u.birimler?.sicaklik, saatDilimleri: u.saatDilimleri, dilGruplari: u.dilGruplari, hastaDilleri: u.hastaDilleri, roller: u.roller, randevu: u.randevu })) if (eksikAyarMi(v)) ekle(`uygulama.${ad}`, `${TESLIM}: ${v.__eksikAyar}`)
  const diller: readonly DilKodu[] = Array.isArray(u.diller) ? u.diller : []
  if (!diller.length) ekle('uygulama.diller', 'the application has no language form')
  if (!diller.includes(paket.varsayilanDil)) ekle('uygulama.diller', `the pack's default language "${paket.varsayilanDil}" is not one of the application's forms`)
  // language groups: every form in exactly one group; at most one language with several scripts
  const gruplar: readonly DilGrubu[] = Array.isArray(u.dilGruplari) ? u.dilGruplari : []
  const grupluBicimler = gruplar.flatMap((g) => g.bicimler.map((b) => b.dil))
  for (const d of diller) if (grupluBicimler.filter((x) => x === d).length !== 1) ekle('uygulama.dilGruplari', `the form "${d}" must be in exactly one language group`)
  for (const d of grupluBicimler) if (!diller.includes(d)) ekle('uygulama.dilGruplari', `"${d}" is not one of uygulama.diller`)
  if (gruplar.filter((g) => g.bicimler.length > 1).length > 1) ekle('uygulama.dilGruplari', 'the kit supports one language with more than one script per country')
  for (const g of gruplar) {
    if (!/^[a-z]{2,3}$/.test(g.temel)) ekle('uygulama.dilGruplari', `"${g.temel}" is not a language code`)
    if (g.bicimler.length > 1 && g.bicimler.some((b) => !dolu(b.yazi))) ekle('uygulama.dilGruplari', `every form of "${g.temel}" needs its script code`)
  }
  const temeller = gruplar.map((g) => g.temel)
  const yazilar = gruplar.filter((g) => g.bicimler.length > 1).flatMap((g) => g.bicimler.map((b) => String(b.yazi)))
  const hastaDilleri: readonly string[] = Array.isArray(u.hastaDilleri) ? u.hastaDilleri : []
  if (!hastaDilleri.length && !eksikAyarMi(u.hastaDilleri)) ekle('uygulama.hastaDilleri', 'no patient language')
  for (const h of hastaDilleri) if (!temeller.includes(h)) ekle('uygulama.hastaDilleri', `"${h}" is not a language of uygulama.dilGruplari`)
  // time
  const dilimler: readonly string[] = Array.isArray(u.saatDilimleri) ? u.saatDilimleri : []
  if (!eksikAyarMi(u.saatDilimleri) && !eksikMetinMi(paket.saatDilimi) && !dilimler.includes(paket.saatDilimi)) ekle('uygulama.saatDilimleri', `must hold the pack's default time zone "${paket.saatDilimi}"`)
  for (const z of dilimler) if (!saatDilimiGecerli(z)) ekle('uygulama.saatDilimleri', `"${z}" is not a time zone this platform knows`)
  if (new Set(dilimler).size !== dilimler.length) ekle('uygulama.saatDilimleri', 'a time zone is listed twice')
  if (!eksikAyarMi(u.saatBicimi) && u.saatBicimi !== 24 && u.saatBicimi !== 12) ekle('uygulama.saatBicimi', 'must be 24 or 12')
  if (u.birimler && !eksikAyarMi(u.birimler)) {
    if (!eksikAyarMi(u.birimler.agirlik) && !['kg', 'lb'].includes(u.birimler.agirlik)) ekle('uygulama.birimler.agirlik', 'must be kg or lb')
    if (!eksikAyarMi(u.birimler.boy) && !['cm', 'in'].includes(u.birimler.boy)) ekle('uygulama.birimler.boy', 'must be cm or in')
    if (!eksikAyarMi(u.birimler.sicaklik) && !['C', 'F'].includes(u.birimler.sicaklik)) ekle('uygulama.birimler.sicaklik', 'must be C or F')
  } else if (!u.birimler) ekle('uygulama.birimler', 'units of measure are not stated')
  if (!eksikAyarMi(u.veliYasi) && u.veliYasi !== null && !(Number.isInteger(u.veliYasi) && u.veliYasi >= 1 && u.veliYasi <= 25)) ekle('uygulama.veliYasi', 'must be null or a whole number of years between 1 and 25')
  if (!eksikAyarMi(u.kayitAcik) && typeof u.kayitAcik !== 'boolean') ekle('uygulama.kayitAcik', 'must be false (invitation only) or true')
  if (!u.adAlanlari || (!eksikAyarMi(u.adAlanlari.ikinciAd) && typeof u.adAlanlari.ikinciAd !== 'boolean')) ekle('uygulama.adAlanlari.ikinciAd', 'must be true or false')
  if (!u.kimlikNumarasi || (!eksikAyarMi(u.kimlikNumarasi.dogrula) && typeof u.kimlikNumarasi.dogrula !== 'boolean')) ekle('uygulama.kimlikNumarasi.dogrula', 'must be true or false')
  const kimlikVar = Boolean(paket.ulusalKimlik) && !eksikAyarMi(paket.ulusalKimlik)
  if (u.kimlikNumarasi?.dogrula === true && !paket.ulusalKimlik) ekle('uygulama.kimlikNumarasi.dogrula', 'is true and the pack has no identity number (ulusalKimlik: null)')
  if (paket.ozellikler.randevu && !u.randevu) ekle('uygulama.randevu', 'appointments are switched on and the pack has no appointment norms')
  // the patient portal: how long a link stays valid is the country's decision (law and custom), never the kit's
  if (paket.ozellikler.hastaPortali) {
    const gun = u.portal?.baglantiGecerlilikGun
    if (!u.portal) ekle('uygulama.portal', 'the patient portal is switched on and the pack does not say how long a patient\'s link stays valid')
    else if (eksikAyarMi(u.portal)) ekle('uygulama.portal', `${TESLIM}: ${u.portal.__eksikAyar}`)
    else if (eksikAyarMi(gun)) ekle('uygulama.portal.baglantiGecerlilikGun', `${TESLIM}: ${gun.__eksikAyar}`)
    else if (!(Number.isInteger(gun) && (gun as number) >= 1 && (gun as number) <= 365)) ekle('uygulama.portal.baglantiGecerlilikGun', 'must be a whole number of days between 1 and 365')
    if (paket.rotalar !== 'hepsi' && !paket.rotalar.sayfalar.includes('/portal')) ekle('rotalar.sayfalar', 'the patient portal is on and "/portal" is not listed: every link a doctor gives would open "not found"')
    // The ambulance number is local content with no default: a number as it is dialled, or null / absent (the page then names none).
    const acil = u.portal && !eksikAyarMi(u.portal) ? u.portal.acilNumara : undefined
    if (eksikAyarMi(acil)) ekle('uygulama.portal.acilNumara', `${TESLIM}: ${acil.__eksikAyar}`)
    else if (acil !== undefined && acil !== null && !(typeof acil === 'string' && /^[0-9+][0-9 ()+-]{1,19}$/.test(acil))) ekle('uygulama.portal.acilNumara', 'must be null (the patient\'s page names no number) or the number as it is dialled: digits, with spaces, brackets, "+" or "-" at most')
  }
  // routes
  if (paket.rotalar !== 'hepsi') {
    for (const r of ['/start', '/today', '/settings', '/patients', '/patients/new', '/patient', '/visit', ...(paket.ozellikler.randevu ? ['/calendar'] : [])]) if (!paket.rotalar.sayfalar.includes(r)) ekle('rotalar.sayfalar', `the application is on and "${r}" is not listed`)
    if (!paket.rotalar.apiOnEkleri.includes('/api/ulke/')) ekle('rotalar.apiOnEkleri', '"/api/ulke/" is not listed')
  }

  // ── catalogues of the application: once per form ──
  metinleriGez({ marka: arayuz.marka }, 'arayuz', s)
  const roller = Array.isArray(arayuz.roller) ? arayuz.roller : []
  const sablon = arayuz.notSablonlari
  for (const d of diller) {
    const m = arayuz.metinler[d]
    if (!m) ekle(`arayuz.metinler[${d}]`, 'no application catalogue for a form the application offers')
    else {
      metinleriGez(m, `arayuz.metinler[${d}]`, s)
      for (const t of temeller) if (!dolu(m.diller?.[t])) ekle(`arayuz.metinler[${d}].diller.${t}`, 'the language has no name in this form')
      for (const y of yazilar) if (!dolu(m.yazilar?.[y])) ekle(`arayuz.metinler[${d}].yazilar.${y}`, 'the script has no name in this form')
      for (const t of new Set(Object.values(kayit(klinik?.konusma?.beklenenDiller)))) if (!dolu(m.muayene?.konusmaDili?.[t])) ekle(`arayuz.metinler[${d}].muayene.konusmaDili.${t}`, 'a language the speech settings expect has no name in this form')
      if (temeller.length > 1) for (const t of temeller) if (!dolu(m.not?.cevir?.[t])) ekle(`arayuz.metinler[${d}].not.cevir.${t}`, 'the "rewrite in this language" button has no text in this form')
      if (u.adAlanlari?.ikinciAd === true && !dolu(m.yeniHasta?.otaIsmi)) ekle(`arayuz.metinler[${d}].yeniHasta.otaIsmi`, 'the second name field is on and has no label')
      if (kimlikVar && !dolu(m.yeniHasta?.ulusalKimlik)) ekle(`arayuz.metinler[${d}].yeniHasta.ulusalKimlik`, 'the identity number is recorded and has no label')
      if (dilimler.length > 1 && !dolu(m.ayarlar?.saatDilimi)) ekle(`arayuz.metinler[${d}].ayarlar.saatDilimi`, 'the country has several time zones and the setting has no label')
    }
    if (paket.ozellikler.randevu) {
      const r = arayuz.randevuMetinleri[d]
      if (!r) ekle(`arayuz.randevuMetinleri[${d}]`, 'appointments are on and this form has no appointment catalogue')
      else {
        metinleriGez(r, `arayuz.randevuMetinleri[${d}]`, s)
        for (const t of hastaDilleri) if (!dolu(r.hatirlatma?.dilAdi?.[t])) ekle(`arayuz.randevuMetinleri[${d}].hatirlatma.dilAdi.${t}`, 'a patient language has no name in this form')
        for (const n of [1, 2, 3, 4, 5, 6, 7]) if (!dolu((r.gunKisa as Record<number, string> | undefined)?.[n]) || !dolu((r.gunUzun as Record<number, string> | undefined)?.[n])) ekle(`arayuz.randevuMetinleri[${d}].gunKisa/gunUzun.${n}`, 'a weekday has no name')
      }
    }
    if (paket.ozellikler.hastaPortali) {
      const pm = arayuz.portalMetinleri?.[d]
      if (!pm) ekle(`arayuz.portalMetinleri[${d}]`, 'the patient portal is on and this form has no portal catalogue')
      else {
        metinleriGez(pm, `arayuz.portalMetinleri[${d}]`, s)
        if (dilimler.length > 1 && !dolu(pm.sayfa?.saatDilimi)) ekle(`arayuz.portalMetinleri[${d}].sayfa.saatDilimi`, 'the country has several time zones and the patient\'s page cannot say which one its times are in')
        // THE NUMBER IS THE PACK'S SETTING, NEVER TEXT: a number written into the sentence would be shown even where the
        // setting is null, and would not be the value a local source confirmed.
        for (const k of ['acil', 'acilNumara'] as const) { const t = pm.sayfa?.[k]; if (typeof t === 'string' && !eksikMetinMi(t) && /\d/.test(t)) ekle(`arayuz.portalMetinleri[${d}].sayfa.${k}`, 'carries a digit: the ambulance number belongs in uygulama.portal.acilNumara, and the sentence holds "%" where it is written') }
        // A sentence that lost its placeholder would silently drop a name, a date or the tries that are left.
        for (const [yol, yerler] of PORTAL_YER_TUTUCULARI) {
          const metin = yol.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), pm)
          if (typeof metin !== 'string' || eksikMetinMi(metin) || !metin.trim()) continue
          for (const y of yerler) if (!(y === '%' ? /%(?!\d)/ : new RegExp(`${y}(?!\\d)`)).test(metin)) ekle(`arayuz.portalMetinleri[${d}].${yol}`, `must hold "${y}" where the value is written`)
        }
      }
    }
    // the intake form's own catalogue (its QUESTIONS are the clinical half's, checked below)
    if (paket.ozellikler.hastaFormu) {
      const fm = arayuz.formMetinleri?.[d]
      if (!fm) ekle(`arayuz.formMetinleri[${d}]`, 'the intake form is on and this form has no catalogue for its screens')
      else {
        metinleriGez(fm, `arayuz.formMetinleri[${d}]`, s)
        // UNITS COME FROM THE PACK: every unit the pack measures in has a name a patient reads.
        if (u.birimler && !eksikAyarMi(u.birimler) && !eksikAyarMi(fm.birim)) for (const kod of new Set([u.birimler.boy, u.birimler.agirlik, u.birimler.sicaklik])) if (typeof kod === 'string' && !dolu(kayit(fm.birim)[kod])) ekle(`arayuz.formMetinleri[${d}].birim.${kod}`, 'the pack measures in this unit and the intake form has no name for it')
        for (const [yol, yerler] of FORM_YER_TUTUCULARI) {
          const metin = yol.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), fm)
          if (typeof metin !== 'string' || eksikMetinMi(metin) || !metin.trim()) continue
          for (const y of yerler) if (!(y === '%' ? /%(?!\d)/ : new RegExp(`${y}(?!\\d)`)).test(metin)) ekle(`arayuz.formMetinleri[${d}].${yol}`, `must hold "${y}" where the value is written`)
        }
        // THE INVITATION: the address is the last thing in the text (a messenger must not glue a full stop to the link),
        // and the text for a patient who already has a link names no address at all.
        const dv = fm.davet
        if (dv && dolu(dv.metin) && !eksikMetinMi(dv.metin) && !/%2$/.test(dv.metin.trim())) ekle(`arayuz.formMetinleri[${d}].davet.metin`, 'must end with "%2": the address is the last thing in the invitation')
        if (dv && dolu(dv.metinAdsiz) && !eksikMetinMi(dv.metinAdsiz) && !/%$/.test(dv.metinAdsiz.trim())) ekle(`arayuz.formMetinleri[${d}].davet.metinAdsiz`, 'must end with "%": the address is the last thing in the invitation')
        if (dv && dolu(dv.baglantisizAdsiz) && !eksikMetinMi(dv.baglantisizAdsiz) && /%/.test(dv.baglantisizAdsiz)) ekle(`arayuz.formMetinleri[${d}].davet.baglantisizAdsiz`, 'carries a placeholder: this text names neither a doctor nor an address')
      }
    }
    // the tools area's own catalogue (each TOOL's words are checked below, with the tool)
    if (paket.ozellikler.araclar && arayuz.araclar && !eksikAyarMi(arayuz.araclar)) {
      const am = arayuz.araclar.metinler?.[d]
      if (!am) ekle(`arayuz.araclar.metinler[${d}]`, 'the tools area is on and this form has no catalogue for it')
      else {
        metinleriGez(am, `arayuz.araclar.metinler[${d}]`, s)
        for (const [yol, yerler] of ARACLAR_YER_TUTUCULARI) {
          const metin = yol.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), am)
          if (typeof metin !== 'string' || eksikMetinMi(metin) || !metin.trim()) continue
          for (const y of yerler) if (!(y === '%' ? /%(?!\d)/ : new RegExp(`${y}(?!\\d)`)).test(metin)) ekle(`arayuz.araclar.metinler[${d}].${yol}`, `must hold "${y}" where the value is written`)
        }
      }
    }
    // roles and templates, per form
    for (const r of roller) if (!sahip(r.ad, d) || !dolu(r.ad[d])) ekle(`arayuz.roller.${r.anahtar}.ad.${d}`, 'the role has no name in this form')
    else if (eksikMetinMi(r.ad[d])) ekle(`arayuz.roller.${r.anahtar}.ad.${d}`, TESLIM)
    for (const [k, alan] of Object.entries(kayit(sablon?.alanlar))) if (!sahip(alan.ad, d) || !dolu(alan.ad[d])) ekle(`arayuz.notSablonlari.alanlar.${k}.ad.${d}`, 'the field has no label in this form')
    else if (eksikMetinMi(alan.ad[d])) ekle(`arayuz.notSablonlari.alanlar.${k}.ad.${d}`, TESLIM)
    if (sablon?.veliAlani && !eksikAyarMi(sablon.veliAlani) && (!dolu(sablon.veliAlani.tanim.ad[d]) || eksikMetinMi(sablon.veliAlani.tanim.ad[d]))) ekle(`arayuz.notSablonlari.veliAlani.ad.${d}`, 'the guardian field has no label in this form')
    for (const b of liste(sablon?.bolumBasliklari)) if (!dolu(b.ad[d]) || eksikMetinMi(b.ad[d])) ekle(`arayuz.notSablonlari.bolumBasliklari.${b.taraf}.${b.bolum}.${d}`, 'the section heading has no text in this form')
  }

  // ── messages between a doctor and a patient: the outbound channel's slot, the catalogue, the emergency notice ──
  for (const x of mesajSorunlari(paket, arayuz, diller, metinleriGez)) if (x.yer !== 'ozellikler.hastaMesajlari') ekle(x.yer, x.sorun)

  // ── "my templates": the catalogue, and the feature and its tile together ──
  for (const x of sablonSorunlari(paket, arayuz, diller, metinleriGez)) ekle(x.yer, x.sorun)

  // ── tools: which exist here, for whom, and every word of their screens ──
  for (const x of araclarSorunlari(paket, arayuz, diller)) if (x.yer !== 'ozellikler.araclar') ekle(x.yer, x.sorun)

  // ── roles ──
  const rolAnahtarlari = roller.map((r) => r.anahtar)
  for (const r of liste(u.roller)) if (!rolAnahtarlari.includes(r)) ekle(`arayuz.roller`, `the role "${r}" of uygulama.roller has no name`)
  for (const r of roller) {
    if (!liste(u.roller).includes(r.anahtar)) ekle('uygulama.roller', `"${r.anahtar}" is named in the content and is not a role of the pack`)
    if (!/^[a-z]+(-[a-z]+)*$/.test(r.anahtar)) ekle(`arayuz.roller.${r.anahtar}`, 'a role key is lower-case words joined by hyphens')
    if (!ROL_TARAFLARI.includes(r.taraf)) ekle(`arayuz.roller.${r.anahtar}.taraf`, 'must be doktor, klinik-hekim or klinik-muttefik')
  }
  if (new Set(rolAnahtarlari).size !== rolAnahtarlari.length) ekle('arayuz.roller', 'a role is listed twice')

  // ── note templates ──
  if (!sablon) ekle('arayuz.notSablonlari', 'no note templates')
  else {
    if (!dolu(sablon.genelSablon)) ekle('arayuz.notSablonlari.genelSablon', 'the general template has no key')
    for (const [rol, alanlar] of Object.entries(kayit(sablon.rolAlanlari))) {
      if (!rolAnahtarlari.includes(rol)) ekle(`arayuz.notSablonlari.rolAlanlari.${rol}`, 'a template for a role the pack does not have')
      for (const k of liste(alanlar)) if (!sahip(kayit(sablon.alanlar), k)) ekle(`arayuz.notSablonlari.rolAlanlari.${rol}`, `names the field "${k}", which is not defined`)
    }
    for (const [k, alan] of Object.entries(kayit(sablon.alanlar))) {
      if (!/^[a-z][a-z0-9_]{0,59}$/.test(k)) ekle(`arayuz.notSablonlari.alanlar.${k}`, 'a field key is lower-case letters, digits and underscores')
      if (!NOT_BOLUMLERI.includes(alan.bolum)) ekle(`arayuz.notSablonlari.alanlar.${k}.bolum`, 'must be s, o, a or p')
    }
    if (u.veliYasi !== null && !eksikAyarMi(u.veliYasi) && !sablon.veliAlani) ekle('arayuz.notSablonlari.veliAlani', 'the pack has a guardian age and no guardian field')
    for (const r of liste(sablon.cocukRolleri)) if (!rolAnahtarlari.includes(r)) ekle('arayuz.notSablonlari.cocukRolleri', `"${r}" is not a role of the pack`)
  }

  // ── the clinical half ──
  if (klinik) {
    metinleriGez({ riza: { surum: klinik.riza?.surum }, konusma: { model: klinik.konusma?.model, zorlamaDilKodlari: klinik.konusma?.zorlamaDilKodlari, beklenenDiller: klinik.konusma?.beklenenDiller } }, 'klinik', s)
    for (const [ad, v] of Object.entries({ 'riza.hukukcuInceledi': klinik.riza?.hukukcuInceledi, gunlukMuayeneLimiti: klinik.gunlukMuayeneLimiti, 'konusma.dilOlasiligiEsigi': klinik.konusma?.dilOlasiligiEsigi, 'konusma.ortalamaLogOlasilikEsigi': klinik.konusma?.ortalamaLogOlasilikEsigi, 'konusma.asgariKarakter': klinik.konusma?.asgariKarakter, sablonlar: klinik.sablonlar })) if (eksikAyarMi(v)) ekle(`klinik.${ad}`, `${TESLIM}: ${v.__eksikAyar}`)
    const sablonlar = Array.isArray(klinik.sablonlar) ? klinik.sablonlar : []
    if (!sablonlar.length) ekle('klinik.sablonlar', 'no note template is switched on')
    if (sablon && sablonlar[0] !== sablon.genelSablon) ekle('klinik.sablonlar', 'the first template must be the general one (the template of an account without a role)')
    for (const d of diller) {
      if (!eksikAyarMi(klinik.konusma?.zorlamaDilKodlari) && !dolu(klinik.konusma?.zorlamaDilKodlari?.[d])) ekle(`klinik.konusma.zorlamaDilKodlari.${d}`, 'the speech provider\'s code for this note language is not stated')
      for (const sb of sablonlar) {
        const t = klinik.notTalimati(d, sb)
        if (!dolu(t)) ekle(`klinik.notTalimati(${d}, ${sb})`, 'no instruction to the model: a note in this form with this template cannot be written')
        else if (eksikMetinMi(t)) ekle(`klinik.notTalimati(${d}, ${sb})`, TESLIM)
      }
      const diger = klinik.digerDil(d, [d])
      if (diger) { const t = klinik.yenidenYazimTalimati(diger); if (!dolu(t)) ekle(`klinik.yenidenYazimTalimati(${diger})`, 'a rewrite into this form is offered and has no instruction'); else if (eksikMetinMi(t)) ekle(`klinik.yenidenYazimTalimati(${diger})`, TESLIM) }
    }
    for (const t of new Set(Object.values(kayit(klinik.konusma?.beklenenDiller)))) if (!temeller.includes(t)) ekle('klinik.konusma.beklenenDiller', `"${t}" is not a language of uygulama.dilGruplari`)
    // THE INTAKE FORM'S QUESTIONS: a core set and one set per role, a text in every form, keys that never repeat,
    // who wrote and who reviewed each set. What a machine cannot check — whether a question is the right one to
    // ask — is a clinician's, and is recorded per set.
    if (paket.ozellikler.hastaFormu) {
      const hf = klinik.hastaFormu
      if (!hf) ekle('klinik.hastaFormu', 'the intake form is on and the clinical half brings no questions (hastaFormu)')
      else if (eksikAyarMi(hf)) ekle('klinik.hastaFormu', `${TESLIM}: ${hf.__eksikAyar}`)
      else {
        // A set that is still to be supplied is reported once, by its marker, and not again line by line.
        const cekirdekEksik = eksikAyarMi(hf.cekirdek), rollerEksik = eksikAyarMi(hf.roller)
        const denetlenen = { ...hf, cekirdek: cekirdekEksik ? { bolumler: [], inceleme: { makineYazimi: true, klinisyen: null } } : hf.cekirdek, roller: rollerEksik ? {} : hf.roller }
        for (const x of formIcerigiSorunlari(denetlenen, [...liste(u.roller)], diller, eksikMetinMi)) {
          if ((cekirdekEksik && x.yer.startsWith('hastaFormu.cekirdek')) || (rollerEksik && x.yer.startsWith('hastaFormu.roller'))) continue
          ekle(`klinik.${x.yer}`, x.sorun)
        }
      }
    }
    // The patient portal: a summary for the patient is written in the patient's language form — any form of the application.
    if (paket.ozellikler.hastaPortali) {
      if (typeof klinik.hastaOzetiTalimati !== 'function' || typeof klinik.hastaOzetiGirdisi !== 'function') ekle('klinik.hastaOzetiTalimati', 'the patient portal is on and the clinical half has no instruction for a summary for the patient (hastaOzetiTalimati, hastaOzetiGirdisi)')
      else for (const d of diller) {
        const t = klinik.hastaOzetiTalimati(d)
        if (!dolu(t)) ekle(`klinik.hastaOzetiTalimati(${d})`, 'no instruction to the model: a summary for a patient who reads this form cannot be written')
        else if (eksikMetinMi(t)) ekle(`klinik.hastaOzetiTalimati(${d})`, TESLIM)
      }
    }
  }
  return s
}

/** The list as one message, for an error that stops a build. */
export function sorunlariYaz(kod: string, sorunlar: readonly PaketSorunu[]): string {
  return [`Country pack "${kod}" is not complete: ${sorunlar.length} item(s). Nothing falls back to another country or to a default.`, ...sorunlar.map((x) => `  - ${x.yer}: ${x.sorun}`)].join('\n')
}
