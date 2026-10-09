/**
 * NOTYA-ULKE-ARACLAR-01 — THE TOOLS AREA, for whichever pack is active (run once per country folder). Names no
 * country and no tool: everything is read from the kit's catalogue and the active pack. A pack without the tools
 * area has nothing to check, and the test says so.
 *
 *   A. the kit's catalogue      keys well-formed and unique; every tool answers "nothing" to an empty form; whatever
 *                               it returns for any input is a key it declared
 *   B. the pack's list          complete by the pack check; and the check is not blind (each kind of gap, by name)
 *   C. THE ROLE GATE            a table over EVERY role of the pack and every tool: base tools for all roles and for
 *                               an account without a role; a role tool for its roles and for no other; the address
 *                               answers as the grid does
 *   D. the screens              the grid per role and form; every tool's screen in every form, empty and filled;
 *                               the summary that is copied; the patient page's tile; the way in from the home screen
 *   E. leak                     no other country's term or letter in any tool text or on any screen
 *   F. KEEPING A RESULT         the screens of migration 139: a tool opened for a patient offers to keep its result
 *                               and asks for a follow-up day without proposing one; opened without a patient it
 *                               keeps nothing and says how to; the patient's file lists what was kept; the
 *                               follow-up list. (The server's rules: ./kayit.paket.test.ts.)
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { eksik, eksikAyar } from '../eksik'
import { paketiDenetle } from '../paketDenetimi'
import { ORNEK_PARAMETRELER, ornekGirdiler, ornekOrtam } from '../testing/aracOrnekleri'
import { gorunurMetin, sizintiTara } from '../testing/sizintiTarayici'
import type { UlkeArayuzu } from '../arayuz/tipler'
import type { DilKodu, UlkeKlinigi, UlkePaketi } from '../tipler'
import { KIT_ARACLARI, kitAraci } from './katalog'
import { aracGorunurMu, aracOzeti, bicimli, hesabinAraci, hesabinAraclari } from './paket'
import type { AracAlani, AracGirdisi, AracTanimi, PaketAraci, UlkeAraclari } from './tipler'

const KOK = resolve(__dirname, '../../..')
const h = React.createElement
const kod = (d: string) => readFileSync(join(KOK, d), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')

let paket: UlkePaketi, arayuz: UlkeArayuzu | null, klinik: UlkeKlinigi | null
let icerik: UlkeAraclari | null = null
let FORMLAR: readonly DilKodu[] = []
let ROLLER: readonly string[] = []
let A: typeof import('../arayuz')
let Ekran: typeof import('@/components/ulke/uygulama/Araclar')
let Bugun: typeof import('@/components/ulke/uygulama/Bugun')
let Kabuk: typeof import('@/components/ulke/uygulama/Kabuk')
let Kayit: typeof import('@/components/ulke/uygulama/AracKayitlari')
let Hastalar: typeof import('@/components/ulke/uygulama/Hastalar')

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  klinik = (await import('@/countries/active/klinik')).AKTIF_KLINIK
  if (!paket.ozellikler.araclar || !arayuz?.araclar) return
  icerik = arayuz.araclar
  FORMLAR = paket.uygulama!.diller
  ROLLER = paket.uygulama!.roller ?? []
  A = await import('../arayuz')
  Ekran = await import('@/components/ulke/uygulama/Araclar')
  Bugun = await import('@/components/ulke/uygulama/Bugun')
  Kabuk = await import('@/components/ulke/uygulama/Kabuk')
  Kayit = await import('@/components/ulke/uygulama/AracKayitlari')
  Hastalar = await import('@/components/ulke/uygulama/Hastalar')
})

const temiz = (metin: string, kaynak: string) => assert.deepEqual(sizintiTara(metin, { hedefUlke: paket.kod, kaynak }), [])

/** The first input a tool answers: what a doctor would see after filling the form in. */
const doluGirdi = (t: AracTanimi, p?: Readonly<Record<string, number>>): AracGirdisi | null => ornekGirdiler(t).find((g) => t.hesapla(g, ornekOrtam(t, p)).tamam) ?? null
/** An input as the screen holds it (what was typed). */
const hamGirdi = (g: AracGirdisi) => Object.fromEntries(Object.entries(g).filter(([, v]) => v !== null).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v])) as Record<string, string | boolean>

describe('tools — the kit\'s catalogue', () => {
  it('keys are well-formed and unique; field and result keys too', () => {
    const anahtarlar = KIT_ARACLARI.map((t) => t.anahtar)
    assert.equal(new Set(anahtarlar).size, anahtarlar.length, 'a tool key is used twice')
    for (const t of KIT_ARACLARI) {
      assert.match(t.anahtar, /^[a-z0-9]+(-[a-z0-9]+)*$/, t.anahtar)
      const alanlar = t.alanlar.map((a) => a.anahtar)
      assert.equal(new Set(alanlar).size, alanlar.length, `${t.anahtar}: a field key is used twice`)
      for (const a of t.alanlar) {
        assert.match(a.anahtar, /^[a-z][a-z0-9_]*$/, `${t.anahtar}.${a.anahtar}`)
        if (a.tur === 'secim') assert.ok((a.secenekler ?? []).length >= 2, `${t.anahtar}.${a.anahtar}: a choice needs two options`)
        if (a.tur === 'sayi' || a.tur === 'puan') assert.ok(typeof a.enAz === 'number' && typeof a.enCok === 'number' && a.enAz < a.enCok, `${t.anahtar}.${a.anahtar}: a number needs its range`)
      }
      for (const grup of [t.cikti.sayilar, t.cikti.bantlar, t.cikti.uyarilar, t.cikti.tarihler]) assert.equal(new Set(grup).size, grup.length, `${t.anahtar}: a result key is declared twice`)
      assert.equal(kitAraci(t.anahtar), t)
      if (t.tur === 'ekran') { assert.ok(t.ekran, `${t.anahtar}: a screen tool names its screen`); assert.equal(t.alanlar.length, 0) } else assert.ok(t.alanlar.length > 0, `${t.anahtar}: no field`)
    }
    assert.equal(kitAraci('no-such-tool'), null); assert.equal(kitAraci(null), null)
  })

  it('every tool answers "nothing" to an empty form, and for ANY input returns only keys it declared', () => {
    for (const t of KIT_ARACLARI) {
      if (t.tur === 'ekran') continue
      const girdiler = ornekGirdiler(t)
      assert.equal(t.hesapla(girdiler[0], ornekOrtam(t)).tamam, false, `${t.anahtar}: an empty form has a result`)
      let tamamlanan = 0
      for (const g of girdiler) {
        const s = t.hesapla(g, ornekOrtam(t))
        if (!s.tamam) { assert.deepEqual([s.sayilar.length, s.bant, s.uyarilar.length, s.tarihler.length], [0, null, 0, 0], `${t.anahtar}: an incomplete result carries values`); continue }
        tamamlanan++
        for (const x of s.sayilar) { assert.ok(t.cikti.sayilar.includes(x.anahtar), `${t.anahtar}: undeclared number "${x.anahtar}"`); assert.ok(Number.isFinite(x.deger), `${t.anahtar}.${x.anahtar}: not a number`) }
        if (s.bant !== null) assert.ok(t.cikti.bantlar.includes(s.bant), `${t.anahtar}: undeclared band "${s.bant}"`)
        for (const u of s.uyarilar) assert.ok(t.cikti.uyarilar.includes(u), `${t.anahtar}: undeclared warning "${u}"`)
        for (const d of s.tarihler) { assert.ok(t.cikti.tarihler.includes(d.anahtar), `${t.anahtar}: undeclared date "${d.anahtar}"`); assert.match(d.tarih, /^\d{4}-\d{2}-\d{2}$/) }
      }
      assert.ok(tamamlanan > 0, `${t.anahtar}: no sample input produced a result — the test would prove nothing`)
      // a tool that leaves numbers to the country has sample numbers for exactly those keys, and nothing else has any
      assert.deepEqual(Object.keys(ORNEK_PARAMETRELER[t.anahtar] ?? {}).sort(), [...(t.parametreler ?? [])].sort(), `${t.anahtar}: the sample numbers and the tool's parameters differ`)
      for (const a of t.alanlar) if (a.kosul) { const kaynak = t.alanlar.find((x) => x.anahtar === a.kosul!.alan); assert.ok(kaynak?.tur === 'secim' && a.kosul.degerler.every((d) => kaynak.secenekler!.includes(d)), `${t.anahtar}.${a.anahtar}: its condition names no choice of the tool`) }
    }
  })

  it('the kit holds no text a doctor reads: no letter outside ASCII in a definition, except in a citation', () => {
    for (const d of ['katalog.ts', 'yardimci.ts', 'paket.ts', 'denetim.ts', 'birimler.ts', 'tipler.ts', ...readdirSync(join(KOK, 'lib/ulke/araclar/tanimlar')).map((ad) => `tanimlar/${ad}`)].map((ad) => `lib/ulke/araclar/${ad}`)) assert.doesNotMatch(kod(d), /[^\x00-\x7F]/, `${d} carries a non-ASCII character outside a comment`)
    for (const t of KIT_ARACLARI) for (const a of t.alanlar) assert.doesNotMatch(JSON.stringify(a), /[^\x00-\x7F]/, `${t.anahtar}.${a.anahtar}`)
  })
})

describe('tools — the pack\'s list', () => {
  it('a pack without the tools area brings none, and no route of it', () => {
    if (paket.ozellikler.araclar) return
    assert.equal(arayuz?.araclar, undefined, 'tools content in a pack that has the tools area switched off')
    if (paket.rotalar !== 'hepsi') assert.ok(!paket.rotalar.sayfalar.includes('/tools'))
  })

  it('every listed tool is a tool of the kit, is classified, and has every word in every form', () => {
    if (!icerik) return
    assert.deepEqual(paketiDenetle(paket, arayuz, klinik), [])
    assert.ok(icerik.araclar.length > 0)
    for (const p of icerik.araclar) {
      const t = kitAraci(p.anahtar)
      assert.ok(t, `${p.anahtar} is not in the kit`)
      assert.ok(p.roller === null || (p.roller.length > 0 && p.roller.every((r) => ROLLER.includes(r))), `${p.anahtar}: roles`)
      for (const d of FORMLAR) {
        for (const m of [p.metin.ad, p.metin.aciklama, p.metin.not]) assert.ok(bicimli(m, d).trim(), `${p.anahtar}: a text is missing in ${d}`)
        for (const a of t!.alanlar) if (!a.numarali) assert.ok(bicimli(p.metin.alanlar[a.anahtar], d).trim(), `${p.anahtar}.${a.anahtar} in ${d}`)
      }
    }
    assert.equal(typeof icerik.inceleme.makineYazimi, 'boolean')
  })

  it('the pack check is not blind: each kind of gap in the tools is reported by name', () => {
    if (!icerik || !arayuz) return
    const klon = <T,>(x: T): T => { const gez = (v: unknown): unknown => (Array.isArray(v) ? v.map(gez) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, w]) => [k, gez(w)])) : v); return gez(x) as T }
    const yerler = (p: UlkePaketi, a: UlkeArayuzu | null) => paketiDenetle(p, a, klinik).map((x) => `${x.yer}: ${x.sorun}`)
    const iceriyor = (liste: string[], parca: string) => assert.ok(liste.some((x) => x.includes(parca)), `expected a report naming "${parca}", got:\n${liste.join('\n') || '(nothing)'}`)
    const d = FORMLAR[0]
    type Y = { araclar: UlkeAraclari }
    const ar = (a: UlkeArayuzu) => (a as unknown as Y).araclar as unknown as { metinler: Record<string, { izgara: { rol: string; baslik: string }; arac: { oran: string } }>; araclar: { anahtar: string; roller: unknown; metin: Record<string, unknown> & { ad: Record<string, string>; alanlar: Record<string, Record<string, string>> } }[]; yuvalar: Record<string, unknown>[]; birimler: unknown; labBirimleri: unknown; inceleme: unknown }
    const ilk = icerik.araclar.find((p) => (kitAraci(p.anahtar)?.alanlar.length ?? 0) > 0) ?? icerik.araclar[0]
    const sira = icerik.araclar.indexOf(ilk)
    // the area's own catalogue: missing, an entry to be supplied, a sentence that lost its placeholder
    { const a = klon(arayuz); delete ar(a).metinler[d]; iceriyor(yerler(paket, a), `arayuz.araclar.metinler[${d}]: the tools area is on and this form has no catalogue`) }
    { const a = klon(arayuz); ar(a).metinler[d].izgara.baslik = eksik('Tools'); iceriyor(yerler(paket, a), `arayuz.araclar.metinler[${d}].izgara.baslik: to be supplied`) }
    { const a = klon(arayuz); ar(a).metinler[d].izgara.rol = 'Role tools'; iceriyor(yerler(paket, a), `arayuz.araclar.metinler[${d}].izgara.rol: must hold "%"`) }
    { const a = klon(arayuz); ar(a).metinler[d].arac.oran = '%1 of'; iceriyor(yerler(paket, a), `arayuz.araclar.metinler[${d}].arac.oran: must hold "%2"`) }
    // no content at all; the route not listed; the area without the application
    iceriyor(yerler(paket, { ...arayuz, araclar: undefined }), 'arayuz.araclar: the tools area is on and the pack brings no content')
    if (paket.rotalar !== 'hepsi') { const p = klon(paket); const rt = p.rotalar as unknown as { sayfalar: string[] }; rt.sayfalar = rt.sayfalar.filter((x) => x !== '/tools'); iceriyor(yerler(p, arayuz), 'rotalar.sayfalar: the tools area is on and "/tools" is not listed') }
    { const p = klon(paket); delete (p.ozellikler as Record<string, unknown>).cekirdekMuayene; iceriyor(yerler(p, arayuz), 'ozellikler.araclar: the tools area needs the signed-in application') }
    // A TOOL THE KIT DOES NOT HAVE cannot be switched on — one of another country's state systems least of all
    { const a = klon(arayuz); ar(a).araclar.push({ ...klon(ilk), anahtar: 'no-such-tool' } as never); iceriyor(yerler(paket, a), 'arayuz.araclar.no-such-tool: is not a tool of the kit') }
    for (const yasak of Object.values(JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as Record<string, unknown>).filter(Array.isArray).flat() as string[]) {
      assert.equal(kitAraci(yasak), null, `the kit holds "${yasak}", a tool of one country's state or payer system`)
      const a = klon(arayuz); ar(a).araclar.push({ ...klon(ilk), anahtar: yasak } as never); iceriyor(yerler(paket, a), `arayuz.araclar.${yasak}: is not a tool of the kit`)
    }
    // classification: left open, an empty list, a role the pack does not have, a role twice; a tool twice
    { const a = klon(arayuz); ar(a).araclar[sira].roller = eksikAyar('which roles'); iceriyor(yerler(paket, a), `arayuz.araclar.${ilk.anahtar}.roller: to be supplied: which roles`) }
    { const a = klon(arayuz); ar(a).araclar[sira].roller = []; iceriyor(yerler(paket, a), `arayuz.araclar.${ilk.anahtar}.roller: must be null (a base tool: every role sees it) or name at least one role`) }
    { const a = klon(arayuz); ar(a).araclar[sira].roller = ['no-such-role']; iceriyor(yerler(paket, a), `arayuz.araclar.${ilk.anahtar}.roller: "no-such-role" is not a role of the pack`) }
    if (ROLLER.length) { const a = klon(arayuz); ar(a).araclar[sira].roller = [ROLLER[0], ROLLER[0]]; iceriyor(yerler(paket, a), `arayuz.araclar.${ilk.anahtar}.roller: a role is named twice`) }
    { const a = klon(arayuz); ar(a).araclar.push(klon(ilk) as never); iceriyor(yerler(paket, a), `arayuz.araclar.${ilk.anahtar}: the tool is listed twice`) }
    // words: a title missing in one form, a label to be supplied, a label for a field the tool does not have, no text at all
    { const a = klon(arayuz); delete ar(a).araclar[sira].metin.ad[d]; iceriyor(yerler(paket, a), `arayuz.araclar.${ilk.anahtar}.ad.${d}: no text in this language form`) }
    const alan = kitAraci(ilk.anahtar)!.alanlar.find((x) => !x.numarali)
    if (alan) {
      { const a = klon(arayuz); ar(a).araclar[sira].metin.alanlar[alan.anahtar][d] = eksik('label'); iceriyor(yerler(paket, a), `arayuz.araclar.${ilk.anahtar}.alanlar.${alan.anahtar}.${d}: to be supplied`) }
      { const a = klon(arayuz); delete ar(a).araclar[sira].metin.alanlar[alan.anahtar]; iceriyor(yerler(paket, a), `arayuz.araclar.${ilk.anahtar}.alanlar.${alan.anahtar}.${d}: no text in this language form`) }
    }
    { const a = klon(arayuz); ar(a).araclar[sira].metin.alanlar.no_such_field = { [d]: 'x' }; iceriyor(yerler(paket, a), `arayuz.araclar.${ilk.anahtar}.alanlar.no_such_field: a text for a field this tool does not have`) }
    { const a = klon(arayuz); (ar(a).araclar[sira] as unknown as { metin: unknown }).metin = eksikAyar('the tool\'s words'); iceriyor(yerler(paket, a), `arayuz.araclar.${ilk.anahtar}.metin: to be supplied: the tool's words`) }
    for (const p of icerik.araclar) {
      const t = kitAraci(p.anahtar)!
      const i = icerik.araclar.indexOf(p)
      for (const grup of ['sayilar', 'bantlar', 'uyarilar', 'tarihler'] as const) if (t.cikti[grup].length) {
        const k = t.cikti[grup][0]
        const a = klon(arayuz); delete (ar(a).araclar[i].metin[grup] as Record<string, unknown>)[k]
        iceriyor(yerler(paket, a), `arayuz.araclar.${p.anahtar}.${grup}.${k}.${d}: no text in this language form`)
      }
      const secimli = t.alanlar.find((x) => x.tur === 'secim')
      if (secimli) { const a = klon(arayuz); delete (ar(a).araclar[i].metin.secenekler as Record<string, Record<string, unknown>>)[secimli.anahtar][secimli.secenekler![0]]; iceriyor(yerler(paket, a), `arayuz.araclar.${p.anahtar}.secenekler.${secimli.anahtar}.${secimli.secenekler![0]}.${d}: no text in this language form`) }
    }
    // slots: switched on, without its reason, a slot and a tool at once, a mechanism the kit does not have
    { const a = klon(arayuz); ar(a).yuvalar.push({ anahtar: 'x-slot', acik: true, icerik: null, mekanizmaHazir: false, eksik: 'x', kimden: 'y', roller: null }); iceriyor(yerler(paket, a), 'arayuz.araclar.yuvalar.x-slot: a slot is empty and switched off') }
    { const a = klon(arayuz); ar(a).yuvalar.push({ anahtar: 'x-slot', acik: false, icerik: null, mekanizmaHazir: false, eksik: ' ', kimden: 'y', roller: null }); iceriyor(yerler(paket, a), 'arayuz.araclar.yuvalar.x-slot: a slot says what is missing and who must supply it') }
    { const a = klon(arayuz); ar(a).yuvalar.push({ anahtar: ilk.anahtar, acik: false, icerik: null, mekanizmaHazir: true, eksik: 'x', kimden: 'y', roller: null }); iceriyor(yerler(paket, a), `arayuz.araclar.yuvalar.${ilk.anahtar}: is a slot and a switched-on tool at once`) }
    { const a = klon(arayuz); ar(a).yuvalar.push({ anahtar: 'x-slot', acik: false, icerik: null, mekanizmaHazir: true, eksik: 'x', kimden: 'y', roller: null }); iceriyor(yerler(paket, a), 'arayuz.araclar.yuvalar.x-slot: says the kit holds its mechanism') }
    // who wrote and who read the texts
    { const a = klon(arayuz); ar(a).inceleme = {}; iceriyor(yerler(paket, a), 'arayuz.araclar.inceleme: must say who wrote the tool texts') }
    // … and the real pack was not touched by any of it
    assert.deepEqual(paketiDenetle(paket, arayuz, klinik), [])
  })
})

describe('tools — THE ROLE GATE', () => {
  it('table over every role and every tool: base for all, a role tool for its roles and for no other; the address agrees with the grid', () => {
    if (!icerik) return
    const hesaplar: (string | null)[] = [null, ...ROLLER]
    let hucre = 0
    for (const rol of hesaplar) {
      const { temel, rol: kendi } = hesabinAraclari(icerik, rol)
      const gorunen = new Set([...temel, ...kendi].map((x) => x.tanim.anahtar))
      for (const p of icerik.araclar as readonly PaketAraci[]) {
        hucre++
        const beklenen: boolean = p.roller === null || (rol !== null && p.roller.includes(rol))
        assert.equal(gorunen.has(p.anahtar), beklenen, `${p.anahtar} for ${rol ?? '(no role)'}: the grid`)
        assert.equal(hesabinAraci(icerik, rol, p.anahtar) !== null, beklenen, `${p.anahtar} for ${rol ?? '(no role)'}: the address`)
        assert.equal(aracGorunurMu(p, rol), beklenen)
      }
      assert.ok(temel.every((x) => x.paket.roller === null) && kendi.every((x) => x.paket.roller !== null), 'a tool is in the wrong group')
      assert.deepEqual(temel.map((x) => x.tanim.anahtar), icerik.araclar.filter((p) => p.roller === null).map((p) => p.anahtar), `base tools are the same for ${rol ?? '(no role)'}`)
    }
    assert.equal(hucre, hesaplar.length * icerik.araclar.length)
    // an account without a role, and a value that is no role of this pack, see base tools only
    for (const yabanci of [null, undefined, '', 'no-such-role']) assert.equal(hesabinAraclari(icerik, yabanci as string | null).rol.length, 0)
    // an address that names no tool, or something that is not a key
    for (const x of ['no-such-tool', '', null, 42, '../hasta-portali']) assert.equal(hesabinAraci(icerik, ROLLER[0] ?? null, x), null)
  })

  it('a role tool is seen by at least one role and, where the pack has more than one role, hidden from at least two', () => {
    if (!icerik) return
    for (const p of icerik.araclar) {
      if (p.roller === null) continue
      const goren = ROLLER.filter((r) => aracGorunurMu(p, r))
      assert.ok(goren.length >= 1, `${p.anahtar}: no role sees it`)
      if (ROLLER.length > 2) assert.ok(ROLLER.length - goren.length >= 2, `${p.anahtar}: a role tool that nearly every role sees is a base tool — classify it`)
    }
  })
})

describe('tools — the screens', () => {
  const cerceve = (dil: DilKodu, govde: React.ReactNode) => renderToStaticMarkup(h(Kabuk.Cerceve, { dil, m: A.uygulamaMetni(dil), ad: 'QA', aktif: 'araclar' as const, cikis: () => {}, children: govde }))

  it('the grid: per role and form, exactly the tools of that account, each a link to its own address; the search narrows it', () => {
    if (!icerik) return
    for (const dil of FORMLAR) {
      const a = A.araclarMetni(dil)
      for (const rol of [null, ...ROLLER]) {
        const html = cerceve(dil, h(Ekran.AraclarIzgarasi, { a, dil, icerik, rol, q: '' }))
        const { temel, rol: kendi } = hesabinAraclari(icerik, rol)
        const cizilen = [...html.matchAll(/data-arac="([^"]+)"/g)].map((m) => m[1])
        assert.deepEqual(cizilen, [...temel, ...kendi].map((x) => x.tanim.anahtar), `${dil}/${rol}: the tiles`)
        for (const x of [...temel, ...kendi]) {
          assert.ok(html.includes(`href="${Ekran.aracYolu(x.tanim.anahtar).replace(/&/g, '&amp;')}"`), `${dil}/${rol}: ${x.tanim.anahtar} has no link`)
          assert.ok(gorunurMetin(html).includes(bicimli(x.paket.metin.ad, dil)), `${dil}/${rol}: ${x.tanim.anahtar} has no title`)
        }
        assert.ok(gorunurMetin(html).includes(a.izgara.baslik))
        assert.equal(html.includes('data-grup="rol"'), kendi.length > 0)
        if (kendi.length) assert.ok(gorunurMetin(html).includes(a.izgara.rol.replace('%', A.rolAdi(rol, dil)!)), `${dil}/${rol}: the role group's heading names the role`)
        assert.match(html, /<html|lang="/) // the frame states the form
        temiz(html, `tools grid ${dil}/${rol}`)
      }
      // the navigation carries the way in, marked as the current page
      const nav = cerceve(dil, null)
      assert.match(nav, new RegExp(`<a href="${Kabuk.YOL.araclar}" class="uza-sekme" aria-current="page">`))
      assert.ok(gorunurMetin(nav).includes(a.kabuk.araclar))
      // search: a title finds its tool; nonsense finds nothing and says so
      const biri = icerik.araclar[0]
      const bulunan = cerceve(dil, h(Ekran.AraclarIzgarasi, { a, dil, icerik, rol: biri.roller?.[0] ?? null, q: bicimli(biri.metin.ad, dil) }))
      assert.ok(bulunan.includes(`data-arac="${biri.anahtar}"`))
      const bos = cerceve(dil, h(Ekran.AraclarIzgarasi, { a, dil, icerik, rol: ROLLER[0] ?? null, q: 'zzzz-qqqq-xxxx' }))
      assert.doesNotMatch(bos, /data-arac=/); assert.ok(gorunurMetin(bos).includes(a.izgara.sonucYok))
    }
  })

  it('every tool, in every form: empty it asks for its fields and shows no result; filled it shows every number, band, warning and date in the pack\'s words', () => {
    if (!icerik) return
    for (const p of icerik.araclar) {
      const t = kitAraci(p.anahtar)!
      const x = { tanim: t, paket: p }
      for (const dil of FORMLAR) {
        const a = A.araclarMetni(dil)
        const baslik = renderToStaticMarkup(h(Ekran.AracBasligi, { x, a, dil }))
        assert.ok(gorunurMetin(baslik).includes(bicimli(p.metin.ad, dil)) && gorunurMetin(baslik).includes(a.arac.geri))
        assert.ok(baslik.includes(`href="${Kabuk.YOL.araclar}"`), 'the way back to the grid')
        if (t.ekran === 'hastaPortali') {
          const html = cerceve(dil, h(Ekran.HastaPortaliAraci, { a, m: A.uygulamaMetni(dil) }))
          assert.ok(gorunurMetin(html).includes(a.portal.nasil)); assert.ok(html.includes(`action="${Kabuk.YOL.hastalar}"`), 'the patient search')
          temiz(html, `tool ${p.anahtar} ${dil}`)
          continue
        }
        // the follow-up list has its own section below (F)
        // "my templates" and consultation have their own tests (lib/ulke/sablon/, lib/ulke/konsultasyon/, components/ulke/*Ekranlari.paket.test.ts)
        if (t.tur === 'ekran') { assert.ok(t.ekran === 'takipPaneli' || t.ekran === 'sablonlarim' || t.ekran === 'konsultasyonlar', `${p.anahtar}: a screen tool this test does not know`); continue }
        const ortak = { x, a, dil, notDili: dil, icerik, degistir: () => {}, temizle: () => {}, bugun: '2026-10-09', kopya: 'yok' as const, kopyalaTikla: () => {} }
        const bosHtml = cerceve(dil, h(Ekran.AracGorunumu, { ...ortak, ham: {} }))
        const bosMetin = gorunurMetin(bosHtml)
        assert.ok(bosMetin.includes(a.arac.eksik), `${p.anahtar}/${dil}: an empty tool does not say what to do`)
        assert.doesNotMatch(bosHtml, /data-bant=|data-sayi=|data-uyari=|data-eylem="kopyala"/, `${p.anahtar}/${dil}: an empty tool shows a result`)
        // a field with a condition is not there until its choice is made; every other field is drawn with its label
        for (const al of t.alanlar) assert.equal(bosHtml.includes(`data-alan="${al.anahtar}"`), !al.kosul, `${p.anahtar}/${dil}: field ${al.anahtar}`)
        for (const al of t.alanlar) if (!al.numarali && !al.kosul) assert.ok(bosMetin.includes(bicimli(p.metin.alanlar[al.anahtar], dil)), `${p.anahtar}/${dil}: label of ${al.anahtar}`)
        assert.ok(bosMetin.includes(bicimli(p.metin.not, dil)) && bosMetin.includes(a.arac.saklanmaz) && bosMetin.includes(a.kayit.hastasiz))
        assert.doesNotMatch(bosHtml, /data-bolum="kayit"|data-eylem="arac-kaydet"/, `${p.anahtar}/${dil}: a tool opened without a patient offers to keep its result`)
        if (t.kaynak) assert.ok(bosMetin.includes(t.kaynak), `${p.anahtar}/${dil}: the source is not shown`)
        temiz(bosHtml, `tool ${p.anahtar} ${dil} (empty)`)

        // every result the samples can produce is drawn in the pack's words
        const gorulen = { sayi: new Set<string>(), bant: new Set<string>(), uyari: new Set<string>(), tarih: new Set<string>() }
        for (const g of ornekGirdiler(t)) {
          const s = t.hesapla(g, ornekOrtam(t, p.parametreler))
          if (!s.tamam) continue
          const html = cerceve(dil, h(Ekran.AracGorunumu, { ...ortak, ham: hamGirdi(g) }))
          const metin = gorunurMetin(html)
          assert.match(html, /data-eylem="kopyala"/)
          for (const n of s.sayilar) { gorulen.sayi.add(n.anahtar); assert.ok(html.includes(`data-sayi="${n.anahtar}"`) && metin.includes(bicimli(p.metin.sayilar?.[n.anahtar], dil)), `${p.anahtar}/${dil}: number ${n.anahtar}`) }
          if (s.bant) { gorulen.bant.add(s.bant); assert.ok(metin.includes(bicimli(p.metin.bantlar?.[s.bant], dil)), `${p.anahtar}/${dil}: band ${s.bant}`) }
          for (const u of s.uyarilar) { gorulen.uyari.add(u); assert.ok(metin.includes(bicimli(p.metin.uyarilar?.[u], dil)), `${p.anahtar}/${dil}: warning ${u}`) }
          for (const dt of s.tarihler) { gorulen.tarih.add(dt.anahtar); assert.ok(html.includes(`data-tarih="${dt.anahtar}"`), `${p.anahtar}/${dil}: date ${dt.anahtar}`) }
          temiz(html, `tool ${p.anahtar} ${dil} (filled)`)
        }
        assert.ok(gorulen.sayi.size + gorulen.bant.size + gorulen.uyari.size + gorulen.tarih.size > 0 || t.cikti.sayilar.length + t.cikti.bantlar.length === 0, `${p.anahtar}: no sample showed a result`)
      }
    }
  })

  it('the summary that is copied: the tool\'s name, what was entered, the result, the line that says what the tool is not — and nothing while the tool has no result', () => {
    if (!icerik) return
    for (const p of icerik.araclar) {
      const t = kitAraci(p.anahtar)!
      if (t.tur === 'ekran') continue
      const x = { tanim: t, paket: p }
      const g = doluGirdi(t, p.parametreler)!
      assert.ok(g, `${p.anahtar}: no sample input has a result`)
      for (const dil of FORMLAR) {
        const a = A.araclarMetni(dil)
        const y = Ekran.yazici(icerik, dil), o = Ekran.birimOrtami(icerik)
        const s = t.hesapla(g, ornekOrtam(t, p.parametreler))
        const ozet = aracOzeti(x, g, s, dil, a, y, o)
        const satirlar = ozet.split('\n')
        assert.equal(satirlar[0], bicimli(p.metin.ad, dil)); assert.equal(satirlar[satirlar.length - 1], bicimli(p.metin.not, dil))
        // the ticked boxes, and only they, are listed — in the tool's order (two boxes may share a label; a list is compared, not a set)
        assert.deepEqual(satirlar.filter((x) => x.startsWith('- ')), t.alanlar.filter((al) => al.tur === 'isaret' && g[al.anahtar] === true).map((al) => `- ${bicimli(p.metin.alanlar[al.anahtar], dil)}`), `${p.anahtar}/${dil}: the ticked boxes in the summary`)
        if (s.bant) assert.ok(ozet.includes(bicimli(p.metin.bantlar?.[s.bant], dil)))
        assert.doesNotMatch(ozet, /undefined|null|NaN|\[object/)
        temiz(ozet, `summary ${p.anahtar} ${dil}`)
        assert.equal(aracOzeti(x, ornekGirdiler(t)[0], t.hesapla(ornekGirdiler(t)[0], ornekOrtam(t, p.parametreler)), dil, a, y, o), '')
      }
    }
  })

  it('what is typed is narrowed before the arithmetic sees it: a comma is a decimal sign, text is nothing, a number out of range is nothing', () => {
    if (!icerik) return
    const o = Ekran.birimOrtami(icerik)
    const alanlar: AracAlani[] = [{ anahtar: 'n', tur: 'sayi', enAz: 0, enCok: 10 }, { anahtar: 'p', tur: 'puan', enAz: 0, enCok: 5, tam: true }, { anahtar: 's', tur: 'secim', secenekler: ['a', 'b'] }, { anahtar: 't', tur: 'tarih' }, { anahtar: 'i', tur: 'isaret' }]
    assert.deepEqual(Ekran.girdiyiCoz(alanlar, { n: ' 2,5 ', p: '3', s: 'b', t: '2026-10-09', i: true }, o), { n: 2.5, p: 3, s: 'b', t: '2026-10-09', i: true })
    assert.deepEqual(Ekran.girdiyiCoz(alanlar, { n: 'abc', p: '2.5', s: 'c', t: '09.10.2026', i: 'yes' as unknown as boolean }, o), { n: null, p: null, s: null, t: null, i: false })
    assert.deepEqual(Ekran.girdiyiCoz(alanlar, { n: '11', p: '-1' }, o), { n: null, p: null, s: null, t: null, i: false })
    assert.deepEqual(Ekran.girdiyiCoz(alanlar, {}, o), { n: null, p: null, s: null, t: null, i: false })
  })

  it('the home screen offers the way in where the country has the tools area, and the screens hold no word of their own', () => {
    if (!icerik) return
    for (const dil of FORMLAR) {
      const html = renderToStaticMarkup(h(Bugun.BugunGorunumu, { m: A.uygulamaMetni(dil), ad: 'QA', muayeneler: [], hata: false, rol: null }))
      assert.match(html, new RegExp(`<a class="uza-baglanti" href="${Kabuk.YOL.araclar}" data-eylem="araclari-ac">`))
      assert.ok(gorunurMetin(html).includes(A.araclarMetni(dil).izgara.ac))
    }
    const ekran = kod('components/ulke/uygulama/Araclar.tsx')
    assert.doesNotMatch(ekran, />\s*[A-Za-z][A-Za-z ]{3,}\s*</, 'a word is written into the tools screen')
    assert.doesNotMatch(ekran, /[^\x00-\x7F]/, 'a non-ASCII character in the tools screen')
    assert.doesNotMatch(ekran, /fetch\(|api\(|localStorage|sessionStorage|document\.cookie/, 'the tool screen itself stores or sends something')
    // keeping a result is ONE file's business, and it talks to two routes of the country's own API and to nothing else
    const kayit = kod('components/ulke/uygulama/AracKayitlari.tsx')
    for (const [ad, k] of [['AracKayitlari.tsx', kayit], ['aracOrtak.ts', kod('components/ulke/uygulama/aracOrtak.ts')]] as const) {
      assert.doesNotMatch(k, />\s*[A-Za-z][A-Za-z ]{3,}\s*</, `a word is written into ${ad}`)
      assert.doesNotMatch(k, /[^\x00-\x7F]/, `a non-ASCII character in ${ad}`)
      assert.doesNotMatch(k, /fetch\(|localStorage|sessionStorage|document\.cookie|indexedDB/, `${ad} stores or sends something by itself`)
    }
    assert.deepEqual([...new Set([...kayit.matchAll(/api\(([^,)]+)/g)].map((x) => x[1].trim().replace(/\$\{.*$/, '')))].sort(), ['ARAC_KAYDI_API', '`', '`/api/ulke/hasta?id='].sort())
    assert.match(kod('components/ulke/UlkeUygulamaSayfasi.tsx'), /\(ekran !== 'araclar' \|\| ozellikAcik\('araclar'\)\)/)
    assert.match(kod('components/ulke/uygulama/Kabuk.tsx'), /ozellikAcik\('araclar'\) \? baglanti\('araclar', YOL\.araclar, araclarMetni\(dil\)\.kabuk\.araclar\) : null/)
    assert.match(kod('components/ulke/uygulama/Bugun.tsx'), /ozellikAcik\('araclar'\) \? /)
    assert.match(kod('app/tools/page.ulke.tsx'), /<UlkeUygulamaSayfasi ekran="araclar" \/>/)
  })
})

describe('tools — keeping a result: the screens', () => {
  const HASTA = { id: '30000000-0000-4000-8000-000000000001', ad: 'QA Patient One' }
  /** The first tool of the pack whose result can be kept, with an input that gives one. */
  const ilkSaklanabilir = () => {
    for (const p of icerik!.araclar) {
      const t = kitAraci(p.anahtar)!
      if (t.tur === 'ekran') continue
      const g = doluGirdi(t, p.parametreler)
      if (g) return { x: { tanim: t, paket: p }, g }
    }
    return null
  }

  it('a tool opened FOR A PATIENT: the part that keeps the result names the patient, asks for a follow-up day WITHOUT proposing one, and is off until the tool has a result', () => {
    if (!icerik) return
    const s = ilkSaklanabilir()
    if (!s) { assert.ok(!icerik.araclar.some((p) => kitAraci(p.anahtar)!.tur !== 'ekran'), 'the samples fill in no tool of this pack: nothing was checked'); return }
    for (const dil of FORMLAR) {
      const a = A.araclarMetni(dil)
      const kart = (tamam: boolean, durum: 'yok' | 'bekliyor' | 'tamam' | 'eksik' | 'takip' | 'hata' = 'yok') => h(Kayit.AracKayitKarti, { a, hasta: HASTA, tamam, takip: '', takipDegistir: () => {}, kaydet: () => {}, durum })
      const ortak = { x: s.x, a, dil, notDili: dil, icerik, degistir: () => {}, temizle: () => {}, bugun: '2026-10-09', kopya: 'yok' as const, kopyalaTikla: () => {}, kayit: (tamam: boolean) => kart(tamam) }
      const dolu = renderToStaticMarkup(h(Ekran.AracGorunumu, { ...ortak, ham: hamGirdi(s.g) }))
      const metin = gorunurMetin(dolu)
      assert.match(dolu, new RegExp(`data-bolum="kayit" data-hasta="${HASTA.id}"`))
      for (const beklenen of [a.kayit.baslik, a.kayit.hastaIcin.replace('%', HASTA.ad), a.kayit.aciklama, a.kayit.takipTarihi, a.kayit.takipIpucu, a.kayit.kaydet, a.kayit.dosyayaGit]) assert.ok(metin.includes(beklenen), `${dil}: "${beklenen}"`)
      // THE KIT PROPOSES NO DAY: the field is there and it is empty
      assert.match(dolu, /<input id="uza-arac-takip" type="date" class="uza-girdi" value=""\/>/)
      assert.match(dolu, /<button type="button" class="uza-dugme" data-eylem="arac-kaydet">/, 'with a result the button is on')
      assert.ok(dolu.includes(`href="${Kabuk.YOL.hasta}?id=${HASTA.id}"`), 'the way back to the patient\'s file')
      // "nothing is stored" is not said where something can be: the two sentences never stand together
      assert.ok(!metin.includes(a.arac.saklanmaz) && !metin.includes(a.kayit.hastasiz))
      temiz(dolu, `keep ${dil}`)
      const bos = renderToStaticMarkup(h(Ekran.AracGorunumu, { ...ortak, ham: {} }))
      assert.match(bos, /<button type="button" class="uza-dugme" disabled="" data-eylem="arac-kaydet">/, 'without a result the button is off')
      assert.ok(gorunurMetin(bos).includes(a.kayit.eksik))
      // what the server answered, in the pack's words
      for (const [durum, beklenen] of [['tamam', a.kayit.kaydedildi], ['eksik', a.kayit.eksik], ['takip', a.kayit.takipGecersiz], ['hata', a.kayit.yapilamadi]] as const) {
        const html = renderToStaticMarkup(kart(true, durum))
        assert.ok(gorunurMetin(html).includes(beklenen), `${dil}/${durum}`)
        if (durum === 'tamam') assert.match(html, /disabled="" data-eylem="arac-kaydet"/, 'kept once: the button does not keep it twice')
      }
    }
  })

  it('the tools opened from a patient\'s file: the grid says for whom, every tile and the search carry the patient, and the way back from a tool keeps them', () => {
    if (!icerik) return
    for (const dil of FORMLAR) {
      const a = A.araclarMetni(dil)
      for (const rol of [null, ...ROLLER]) {
        const html = renderToStaticMarkup(h(Ekran.AraclarIzgarasi, { a, dil, icerik, rol, q: '', hasta: HASTA }))
        const { temel, rol: kendi } = hesabinAraclari(icerik, rol)
        for (const x of [...temel, ...kendi]) assert.ok(html.includes(`href="${Ekran.aracYolu(x.tanim.anahtar, HASTA.id).replace(/&/g, '&amp;')}"`), `${dil}/${rol}: ${x.tanim.anahtar} loses the patient`)
        assert.match(html, new RegExp(`data-alan="arac-hastasi" data-hasta="${HASTA.id}"`)); assert.ok(gorunurMetin(html).includes(a.kayit.hastaIcin.replace('%', HASTA.ad)))
        if (temel.length + kendi.length) assert.match(html, new RegExp(`<input type="hidden" name="hasta" value="${HASTA.id}"/>`))
      }
      const s = ilkSaklanabilir()
      if (s) assert.ok(renderToStaticMarkup(h(Ekran.AracBasligi, { x: s.x, a, dil, hastaId: HASTA.id })).includes(`href="${Ekran.araclarYolu(HASTA.id)}"`))
    }
    assert.match(Ekran.aracYolu('x', HASTA.id), /\?arac=x&hasta=30000000-/); assert.doesNotMatch(Ekran.aracYolu('x'), /hasta/)
  })

  it('the patient\'s file: what was kept, newest first as the server sent it, each with the summary in the pack\'s words; the follow-up; a record that cannot be read; a tool that is gone; nothing yet', () => {
    if (!icerik) return
    const s = ilkSaklanabilir()
    if (!s) { assert.ok(!icerik.araclar.some((p) => kitAraci(p.anahtar)!.tur !== 'ekran'), 'the samples fill in no tool of this pack: nothing was checked'); return }
    const sonuc = s.x.tanim.hesapla(s.g, ornekOrtam(s.x.tanim, s.x.paket.parametreler))
    const kayit = (id: string, ek: Record<string, unknown> = {}) => ({ id, arac: s.x.tanim.anahtar, olusturuldu: '2026-10-09T05:00:00.000Z', gun: '2026-10-09', takipTarihi: null, kapandi: null, girdiler: s.g, sonuc, ...ek })
    for (const dil of FORMLAR) {
      const a = A.araclarMetni(dil)
      const y = Ekran.yazici(icerik, dil), o = Ekran.birimOrtami(icerik)
      const html = renderToStaticMarkup(h(Kayit.HastaAracKayitlariGorunumu, { a, dil, icerik, hastaId: HASTA.id, kayitlar: [kayit('k1', { takipTarihi: '2026-11-01' }), kayit('k2', { takipTarihi: '2026-10-01', kapandi: '2026-10-02T05:00:00.000Z' }), kayit('k3', { girdiler: null, sonuc: null }), kayit('k4', { arac: 'no-such-tool' })] }))
      const metin = gorunurMetin(html)
      assert.deepEqual([...html.matchAll(/data-kayit="([^"]+)"/g)].map((m) => m[1]), ['k1', 'k2', 'k3', 'k4'])
      for (const beklenen of [a.kayit.dosyaBaslik, a.kayit.dosyaAciklama, a.kayit.araclariAc, bicimli(s.x.paket.metin.ad, dil), a.kayit.takipGunu.replace('%', y.tarih('2026-11-01')), a.kayit.takipKapandi.replace('%', y.tarih('2026-10-01')), a.kayit.okunamadi, a.kayit.aracYok]) assert.ok(metin.includes(beklenen), `${dil}: "${beklenen}"`)
      // the summary is the same text the doctor copies from the tool
      const ozet = aracOzeti(s.x, s.g, sonuc, dil, a, y, o)
      assert.ok(ozet.length > 0 && html.includes(`<pre class="uza-arac-ozet">${ozet.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')}</pre>`), `${dil}: the kept result does not show its summary`)
      assert.equal((html.match(/data-okunamadi/g) ?? []).length, 2, 'the unreadable record and the record of a tool that is gone show no content')
      assert.ok(html.includes(`href="${Ekran.araclarYolu(HASTA.id)}"`), 'the way to the tools for this patient')
      assert.doesNotMatch(metin, /undefined|null|NaN|\[object/)
      temiz(html, `kept results ${dil}`)
      const bos = renderToStaticMarkup(h(Kayit.HastaAracKayitlariGorunumu, { a, dil, icerik, hastaId: HASTA.id, kayitlar: [] }))
      assert.ok(gorunurMetin(bos).includes(a.kayit.dosyaBos) && bos.includes(`href="${Ekran.araclarYolu(HASTA.id)}"`))
      // not loaded: no list and no "nothing yet" — only the way in
      const yuklenmedi = renderToStaticMarkup(h(Kayit.HastaAracKayitlariGorunumu, { a, dil, icerik, hastaId: HASTA.id, kayitlar: null }))
      assert.ok(!gorunurMetin(yuklenmedi).includes(a.kayit.dosyaBos) && !yuklenmedi.includes('data-kayit='))
      // the file draws the card where the country has the tools area, below the form and the portal
      const dosya = renderToStaticMarkup(h(Hastalar.HastaDosyasiGorunumu, { m: A.uygulamaMetni(dil), hasta: { id: HASTA.id, ad: HASTA.ad, otaIsmi: '', dogumTarihi: '1990-05-05', cinsiyet: '', telefon: '', dil: '', ulusalKimlik: '' }, muayeneler: [], araclar: h(Kayit.HastaAracKayitlariGorunumu, { a, dil, icerik, hastaId: HASTA.id, kayitlar: [] }) }))
      assert.match(dosya, /data-alan="hasta-arac-kayitlari"/)
    }
  })

  it('THE FOLLOW-UP LIST: earliest first as the server sent it, the patient and the tool named, overdue and today marked, one "done" per row; empty, loading and unreadable each say so', () => {
    if (!icerik) return
    const panel = icerik.araclar.find((p) => kitAraci(p.anahtar)?.ekran === 'takipPaneli')
    const s = ilkSaklanabilir()
    if (!panel) return
    assert.ok(s, 'the pack has the follow-up list and no tool whose result can be kept')
    assert.notEqual(panel.roller, null, 'the follow-up list is a role tool: an account without a tool to keep has no list')
    const satirlar = [
      { id: 't1', hastaId: HASTA.id, hastaAdi: HASTA.ad, arac: s.x.tanim.anahtar, takipTarihi: '2026-10-01', gecikti: true },
      { id: 't2', hastaId: HASTA.id, hastaAdi: 'QA Patient Two', arac: s.x.tanim.anahtar, takipTarihi: '2026-10-09', gecikti: false },
      { id: 't3', hastaId: HASTA.id, hastaAdi: 'QA Patient Three', arac: 'no-such-tool', takipTarihi: '2026-12-01', gecikti: false },
    ]
    for (const dil of FORMLAR) {
      const a = A.araclarMetni(dil)
      const ortak = { a, dil, icerik, bugun: '2026-10-09', hata: false, yukleniyor: A.uygulamaMetni(dil).kabuk.yukleniyor, bekleyen: null, bildirim: null, kapat: () => {} }
      const html = renderToStaticMarkup(h(Kayit.TakipPaneliGorunumu, { ...ortak, takipler: satirlar }))
      const metin = gorunurMetin(html)
      assert.deepEqual([...html.matchAll(/data-takip="([^"]+)"/g)].map((m) => m[1]), ['t1', 't2', 't3'])
      for (const beklenen of [a.takip.aciklama, HASTA.ad, 'QA Patient Two', bicimli(s.x.paket.metin.ad, dil), a.kayit.aracYok, a.takip.gecikti, a.takip.bugun, a.takip.kapat]) assert.ok(metin.includes(beklenen), `${dil}: "${beklenen}"`)
      assert.deepEqual([(html.match(/data-takip-durum="gecikti"/g) ?? []).length, (html.match(/data-takip-durum="bugun"/g) ?? []).length, (html.match(/data-eylem="takip-kapat"/g) ?? []).length, (html.match(/data-gecikti="evet"/g) ?? []).length], [1, 1, 3, 1])
      assert.ok(html.includes(`href="${Kabuk.YOL.hasta}?id=${HASTA.id}"`), 'each row opens the patient\'s file')
      temiz(html, `follow-up list ${dil}`)
      assert.ok(gorunurMetin(renderToStaticMarkup(h(Kayit.TakipPaneliGorunumu, { ...ortak, takipler: [] }))).includes(a.takip.bos))
      assert.ok(gorunurMetin(renderToStaticMarkup(h(Kayit.TakipPaneliGorunumu, { ...ortak, takipler: null }))).includes(ortak.yukleniyor))
      assert.ok(gorunurMetin(renderToStaticMarkup(h(Kayit.TakipPaneliGorunumu, { ...ortak, takipler: null, hata: true }))).includes(a.takip.okunamadi))
      assert.ok(gorunurMetin(renderToStaticMarkup(h(Kayit.TakipPaneliGorunumu, { ...ortak, takipler: [], bildirim: 'kapatildi' }))).includes(a.takip.kapatildi))
      assert.ok(gorunurMetin(renderToStaticMarkup(h(Kayit.TakipPaneliGorunumu, { ...ortak, takipler: satirlar, bildirim: 'yapilamadi' }))).includes(a.takip.yapilamadi))
      assert.match(renderToStaticMarkup(h(Kayit.TakipPaneliGorunumu, { ...ortak, takipler: satirlar, bekleyen: 't2' })), /disabled="" data-eylem="takip-kapat"/)
    }
  })
})

describe('tools — leak', () => {
  it('no text of any tool, slot or of the area carries another country\'s term or letter; the forms share one shape', () => {
    if (!icerik) return
    const yaprak = (o: unknown, on = ''): [string, string][] => Object.entries((o ?? {}) as Record<string, unknown>).flatMap(([k, v]) => (typeof v === 'string' ? [[`${on}${k}`, v] as [string, string]] : v && typeof v === 'object' ? yaprak(v, `${on}${k}.`) : []))
    for (const [yol, metin] of yaprak({ araclar: icerik.araclar.map((p) => ({ [p.anahtar]: p.metin })), birimler: icerik.birimler, metinler: icerik.metinler })) temiz(metin, `tools.${yol}`)
    for (const y of icerik.yuvalar) for (const k of Object.values(JSON.parse(readFileSync(join(KOK, 'countries/yasak-araclar.json'), 'utf8')) as Record<string, unknown>).filter(Array.isArray).flat() as string[]) assert.notEqual(y.anahtar, k, `a slot is named after "${k}"`)
    const ilk = icerik.metinler[FORMLAR[0]]!
    for (const d of FORMLAR) assert.deepEqual(yaprak(icerik.metinler[d]).map(([k]) => k).sort(), yaprak(ilk).map(([k]) => k).sort(), `the tools catalogue of ${d} has other keys than ${FORMLAR[0]}`)
  })
})
