/**
 * NOTYA-ULKE-KLINIK-01 — THE PACK CHECK FOR CLINIC ACCOUNTS IS NOT BLIND. Runs once per country folder
 * (scripts/ulke-test.mjs sets NOTYA_COUNTRY).
 *
 * Each rule of lib/ulke/klinikHesabi/denetim.ts is broken once on a COPY of this pack, and the whole pack check
 * (lib/ulke/paketDenetimi.ts — what a country's build runs) must name the place. The real pack is never touched and
 * still passes at the end. A pack without clinic accounts gets no report from these rules, and switching the feature
 * on in a copy of such a pack is refused until the pack says everything.
 *
 * THE NARROW SIDE: three rules here are about law, not shape. A clinic's owner may enter a permission for a doctor
 * only in a pack a lawyer has read; an allied role that may read a share must be an allied role of the pack; and the
 * sentence a doctor reads before giving the portal permission must name the PIN.
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { eksik, eksikAyar } from '../eksik'
import { paketiDenetle } from '../paketDenetimi'
import { klinikHesabiSorunlari, KLINIK_YER_TUTUCULARI } from './denetim'
import type { UlkeArayuzu } from '../arayuz/tipler'
import type { KlinikMetni } from '../arayuz/metinTipleri'
import { KLINIK_YETKI_TURLERI, type DilKodu, type KlinikHesabiAyarlari, type UlkeKlinigi, type UlkePaketi } from '../tipler'

let paket: UlkePaketi, arayuz: UlkeArayuzu | null, klinik: UlkeKlinigi | null

before(async () => {
  paket = (await import('@/countries/active')).AKTIF_PAKET
  arayuz = (await import('@/countries/active/arayuz')).AKTIF_ARAYUZ
  klinik = (await import('@/countries/active/klinik')).AKTIF_KLINIK
})

// functions are kept by reference; everything else is copied, so the real pack is never touched
const klon = <T,>(x: T): T => {
  const gez = (v: unknown): unknown => (Array.isArray(v) ? v.map(gez) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, w]) => [k, gez(w)])) : v)
  return gez(x) as T
}
const yerler = (p: UlkePaketi, a: UlkeArayuzu | null) => paketiDenetle(p, a, klinik).map((x) => `${x.yer}: ${x.sorun}`)
const iceriyor = (liste: string[], parca: string) => assert.ok(liste.some((x) => x.includes(parca)), `expected a report naming "${parca}", got:\n${liste.join('\n') || '(nothing)'}`)
type Degisken<T> = { -readonly [K in keyof T]: T[K] }
const ayar = (p: UlkePaketi) => p.uygulama!.klinikHesaplari as Degisken<KlinikHesabiAyarlari>
const katalog = (a: UlkeArayuzu, d: DilKodu) => a.klinikMetinleri![d] as unknown as Record<string, Record<string, unknown>>
const yoldan = (o: unknown, yol: string): unknown => yol.split('.').reduce<unknown>((x, k) => (x && typeof x === 'object' ? (x as Record<string, unknown>)[k] : undefined), o)
const yolaYaz = (o: unknown, yol: string, deger: unknown) => { const p = yol.split('.'); const son = p.pop() as string; (p.reduce<unknown>((x, k) => (x as Record<string, unknown>)[k], o) as Record<string, unknown>)[son] = deger }

describe('the pack check for clinic accounts', () => {
  it('a pack without clinic accounts is not asked for anything, and cannot switch them on without saying everything', () => {
    const p = klon(paket)
    ;(p.ozellikler as { klinikHesaplari?: boolean }).klinikHesaplari = false
    assert.deepEqual(klinikHesabiSorunlari(p, arayuz, p.uygulama?.diller ?? []), [])
    if (paket.ozellikler.klinikHesaplari) return
    // the feature switched on in a copy of a pack that brings nothing for it
    ;(p.ozellikler as { klinikHesaplari?: boolean }).klinikHesaplari = true
    const l = klinikHesabiSorunlari(p, arayuz, p.acikDiller).map((x) => `${x.yer}: ${x.sorun}`)
    iceriyor(l, 'uygulama.klinikHesaplari: clinic accounts are on and the pack states no settings for them')
    if (!p.ozellikler.cekirdekMuayene) iceriyor(l, 'ozellikler.klinikHesaplari: clinic accounts need the signed-in application')
    if (arayuz) iceriyor(l, 'clinic accounts are on and this form has no catalogue for them')
  })

  it('this pack passes, and every rule is reported by name when it is broken on a copy', () => {
    if (!paket.ozellikler.klinikHesaplari) return
    assert.ok(arayuz && paket.uygulama && paket.uygulama.klinikHesaplari, 'a pack with clinic accounts brings settings and content')
    const diller = paket.uygulama.diller
    const d = diller[0]
    assert.deepEqual(klinikHesabiSorunlari(paket, arayuz, diller), [])

    // ── the feature and its screens ──
    { const p = klon(paket); (p.ozellikler as { cekirdekMuayene?: boolean }).cekirdekMuayene = false; iceriyor(klinikHesabiSorunlari(p, arayuz, diller).map((x) => `${x.yer}: ${x.sorun}`), 'ozellikler.klinikHesaplari: clinic accounts need the signed-in application') }
    if (paket.rotalar !== 'hepsi') {
      { const p = klon(paket); (p.rotalar as { sayfalar: readonly string[] }).sayfalar = (p.rotalar as { sayfalar: readonly string[] }).sayfalar.filter((x) => x !== '/clinic'); iceriyor(yerler(p, arayuz), 'rotalar.sayfalar: clinic accounts are on and "/clinic" is not listed') }
      if (paket.ozellikler.randevu) { const p = klon(paket); (p.rotalar as { sayfalar: readonly string[] }).sayfalar = (p.rotalar as { sayfalar: readonly string[] }).sayfalar.filter((x) => x !== '/desk'); iceriyor(yerler(p, arayuz), 'rotalar.sayfalar: clinic accounts and appointments are on and "/desk"') }
    }

    // ── the settings: absent, to be decided, wrong ──
    { const p = klon(paket); delete (p.uygulama as { klinikHesaplari?: unknown }).klinikHesaplari; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari: clinic accounts are on and the pack states no settings for them') }
    { const p = klon(paket); (p.uygulama as { klinikHesaplari?: unknown }).klinikHesaplari = eksikAyar('decide'); iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari: to be supplied: decide') }
    for (const k of ['yetkiTurleri', 'paylasimRolleri', 'davetGecerlilikGun', 'vekaletAzamiGun', 'inceleme', 'sahipHekimAdinaVerebilir'] as const) {
      const p = klon(paket); (ayar(p) as Record<string, unknown>)[k] = eksikAyar(`decide ${k}`)
      iceriyor(yerler(p, arayuz), `uygulama.klinikHesaplari.${k}: to be supplied: decide ${k}`)
    }
    { const p = klon(paket); ayar(p).yetkiTurleri = []; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.yetkiTurleri: must list at least one capability') }
    { const p = klon(paket); ayar(p).yetkiTurleri = [...ayar(p).yetkiTurleri, ayar(p).yetkiTurleri[0]]; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.yetkiTurleri: lists a capability twice') }
    { const p = klon(paket); ayar(p).yetkiTurleri = [...ayar(p).yetkiTurleri, 'her-sey' as never]; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.yetkiTurleri: "her-sey" is not a capability of the kit') }
    // a capability needs the feature it works on
    { const p = klon(paket); ayar(p).yetkiTurleri = [...KLINIK_YETKI_TURLERI]; (p.ozellikler as { randevu?: boolean }).randevu = false; iceriyor(klinikHesabiSorunlari(p, arayuz, diller).map((x) => x.sorun), '(on-buro-randevu) needs appointments (randevu)') }
    { const p = klon(paket); ayar(p).yetkiTurleri = [...KLINIK_YETKI_TURLERI]; (p.ozellikler as { hastaPortali?: boolean }).hastaPortali = false; iceriyor(klinikHesabiSorunlari(p, arayuz, diller).map((x) => x.sorun), '(on-buro-portal) needs the patient portal (hastaPortali)') }
    // the two periods: a whole number of days from 1 to 31
    for (const k of ['davetGecerlilikGun', 'vekaletAzamiGun'] as const) for (const kotu of [0, 32, 2.5, -1, '7' as unknown as number]) {
      const p = klon(paket); ayar(p)[k] = kotu
      iceriyor(yerler(p, arayuz), `uygulama.klinikHesaplari.${k}: must be a whole number of days from 1 to 31`)
    }
    // who read the answers
    { const p = klon(paket); delete (ayar(p) as { inceleme?: unknown }).inceleme; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.inceleme: must say who wrote these answers') }
    { const p = klon(paket); ayar(p).inceleme = { makineYazimi: 'yes' as never, hukukcu: '  ' }; const l = yerler(p, arayuz); iceriyor(l, 'uygulama.klinikHesaplari.inceleme.makineYazimi: must be true or false'); iceriyor(l, 'uygulama.klinikHesaplari.inceleme.hukukcu: must be the name of the lawyer') }

    // ── THE NARROW SIDE ──
    // a clinic's owner may enter a permission for a doctor only where a lawyer has read the answers
    { const p = klon(paket); ayar(p).sahipHekimAdinaVerebilir = true; ayar(p).inceleme = { makineYazimi: true, hukukcu: null }
      iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.sahipHekimAdinaVerebilir: a clinic\'s owner may enter a grant for a doctor\'s patients only where a lawyer of the country has read these answers')
      // … and with a lawyer named, the same setting is accepted
      ayar(p).inceleme = { makineYazimi: true, hukukcu: 'A lawyer of the country' }
      assert.ok(!yerler(p, arayuz).some((x) => x.includes('sahipHekimAdinaVerebilir')), 'true with a named lawyer must pass') }
    { const p = klon(paket); ayar(p).sahipHekimAdinaVerebilir = 'no' as never; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.sahipHekimAdinaVerebilir: must be true or false; every new country starts with false') }
    // a share is read by an allied role OF THIS PACK
    { const p = klon(paket); ayar(p).paylasimRolleri = [...ayar(p).paylasimRolleri, 'no-such-role']; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.paylasimRolleri: "no-such-role" is not a role of this pack') }
    { const hekimRolu = (arayuz.roller ?? []).find((r) => r.taraf !== 'klinik-muttefik')
      if (hekimRolu) { const p = klon(paket); ayar(p).paylasimRolleri = [...ayar(p).paylasimRolleri, hekimRolu.anahtar]; iceriyor(yerler(p, arayuz), `uygulama.klinikHesaplari.paylasimRolleri: "${hekimRolu.anahtar}" is not an allied role`) } }
    { const p = klon(paket); if (ayar(p).paylasimRolleri.length) { ayar(p).paylasimRolleri = [...ayar(p).paylasimRolleri, ayar(p).paylasimRolleri[0]]; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.paylasimRolleri: lists a role twice') } }
    { const p = klon(paket); ayar(p).paylasimRolleri = 'all' as never; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.paylasimRolleri: must be a list of role keys') }
    if (ayar(paket).yetkiTurleri.includes('paylasim')) { const p = klon(paket); ayar(p).paylasimRolleri = []; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.paylasimRolleri: the share capability is on and no allied role may receive one') }
    // record retention is a slot and stays one: no number, in days or in words
    for (const deger of [365, { gun: 3650 }, '10 years', 0, false]) { const p = klon(paket); (ayar(p) as { kayitSaklama: unknown }).kayitSaklama = deger; iceriyor(yerler(p, arayuz), 'uygulama.klinikHesaplari.kayitSaklama: is a slot and must be null') }

    // ── the catalogue, in EVERY form of this pack ──
    for (const f of diller) {
      const K = `arayuz.klinikMetinleri[${f}]`
      { const a = klon(arayuz); delete (a.klinikMetinleri as Record<string, unknown>)[f]; iceriyor(yerler(paket, a), `${K}: clinic accounts are on and this form has no catalogue for them`) }
      { const a = klon(arayuz); delete katalog(a, f).kayit; iceriyor(yerler(paket, a), `${K}.kayit: this part of the catalogue is missing`) }
      { const a = klon(arayuz); katalog(a, f).giris.baslik = '  '; iceriyor(yerler(paket, a), `${K}.giris.baslik: empty text`) }
      { const a = klon(arayuz); katalog(a, f).konum['on-buro'] = eksik('front desk'); iceriyor(yerler(paket, a), `${K}.konum.on-buro: to be supplied`) }
      // every sentence that carries a value keeps the place for it
      for (const [yol, yerTutucular] of KLINIK_YER_TUTUCULARI) for (const y of yerTutucular) {
        const a = klon(arayuz); const eski = yoldan(katalog(a, f), yol)
        assert.equal(typeof eski, 'string', `${K}.${yol} must be a text of the catalogue`)
        yolaYaz(katalog(a, f), yol, (eski as string).replace(y === '%' ? /%(?!\d)/g : new RegExp(`${y}(?!\\d)`, 'g'), '…'))
        iceriyor(yerler(paket, a), `${K}.${yol}: must hold "${y}" where the value is written`)
      }
      // THE PLAIN SENTENCE: the doctor is told that the member will see the link and the PIN, in this form's own word
      { const a = klon(arayuz); const pin = (arayuz.klinikMetinleri![f] as KlinikMetni).onBuro.pin
        const sozcuk = /^[\p{L}\p{N}]+/u.exec(pin.trim())?.[0] ?? ''
        assert.ok(sozcuk.length > 0, `${K}.onBuro.pin must start with the word the form uses for the PIN`)
        const cumle = (arayuz.klinikMetinleri![f] as KlinikMetni).yetkiAciklama['on-buro-portal']
        assert.ok(cumle.toLocaleLowerCase().includes(sozcuk.toLocaleLowerCase()), `${K}.yetkiAciklama.on-buro-portal must name "${sozcuk}"`)
        katalog(a, f).yetkiAciklama['on-buro-portal'] = cumle.replace(new RegExp(sozcuk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu'), '…')
        iceriyor(yerler(paket, a), `${K}.yetkiAciklama.on-buro-portal: must say that the member will see the patient's link and PIN`) }
    }
    void d

    // … and the real pack was not touched by any of it
    assert.deepEqual(paketiDenetle(paket, arayuz, klinik), [])
  })
})
