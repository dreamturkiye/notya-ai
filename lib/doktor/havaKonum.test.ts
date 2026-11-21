/**
 * HAVA-KONUM-01 — the location prompt is asked at most once, only on a tap; the answer and the place are remembered.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  HAVA_DEPO_ANAHTARI, HAVA_TAZELIK_MS, havaCevabiCoz, havaIstenebilirMi, havaKaydiOku, havaKaydiYaz, havaTazeMi, konumYuvarla,
} from './havaKonum'
import KabukGorunumu, { type KabukProps } from '@/components/doktor/KabukGorunumu'

const depo = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v) }, m } }

describe('weather location: remembered, never asked on its own', () => {
  it('reads nothing from an empty, broken or throwing store', () => {
    assert.deepEqual(havaKaydiOku(null), {})
    assert.deepEqual(havaKaydiOku(depo()), {})
    const bozuk = depo(); bozuk.m.set(HAVA_DEPO_ANAHTARI, '{not json'); assert.deepEqual(havaKaydiOku(bozuk), {})
    const atan = { getItem: () => { throw new Error('SecurityError') }, setItem: () => { throw new Error('QuotaExceeded') } }
    assert.deepEqual(havaKaydiOku(atan), {})
    assert.doesNotThrow(() => havaKaydiYaz({ karar: 'red' }, atan))
  })
  it('remembers the decision and a rounded place; rejects nonsense coordinates', () => {
    const d = depo()
    havaKaydiYaz({ karar: 'izin', enlem: konumYuvarla(41.008237), boylam: konumYuvarla(28.978358) }, d)
    assert.deepEqual(havaKaydiOku(d), { karar: 'izin', enlem: 41.01, boylam: 28.98 })
    d.m.set(HAVA_DEPO_ANAHTARI, JSON.stringify({ karar: 'izin', enlem: 400, boylam: 2 }))
    assert.deepEqual(havaKaydiOku(d), { karar: 'izin' })
  })
  it('a declined prompt is never offered again; no geolocation → nothing offered; a reading on screen → nothing offered', () => {
    assert.equal(havaIstenebilirMi({}, null, true), true)
    assert.equal(havaIstenebilirMi({ karar: 'red' }, null, true), false)
    assert.equal(havaIstenebilirMi({}, null, false), false)
    assert.equal(havaIstenebilirMi({}, { sicaklik: 12, kod: 0 }, true), false)
  })
  it('the reading is reused for 30 minutes; only a real temperature is a reading', () => {
    const t = 1_700_000_000_000
    assert.equal(havaTazeMi({ hava: { sicaklik: 1, kod: 0, zaman: t } }, t + HAVA_TAZELIK_MS - 1), true)
    assert.equal(havaTazeMi({ hava: { sicaklik: 1, kod: 0, zaman: t } }, t + HAVA_TAZELIK_MS), false)
    assert.deepEqual(havaCevabiCoz({ current: { temperature_2m: 17.6, weather_code: 3 } }), { sicaklik: 18, kod: 3 })
    assert.equal(havaCevabiCoz({ current: { temperature_2m: null } }), null)
    assert.equal(havaCevabiCoz(null), null)
  })
  it('no screen asks the browser for a location on mount — only the tap handler in lib/doktor/havaKonum.ts', () => {
    const kok = join(__dirname, '..', '..')
    const bulunan: string[] = []
    const gez = (d: string) => {
      for (const ad of readdirSync(d)) {
        if (ad === 'node_modules' || ad.startsWith('.')) continue
        const y = join(d, ad)
        if (statSync(y).isDirectory()) gez(y)
        else if (/\.(tsx?|jsx?)$/.test(ad) && !/\.test\./.test(ad) && readFileSync(y, 'utf8').includes('getCurrentPosition')) bulunan.push(y.slice(kok.length + 1))
      }
    }
    for (const d of ['app', 'components', 'lib', 'specialties']) { try { gez(join(kok, d)) } catch { /* absent */ } }
    assert.deepEqual(bulunan, ['lib/doktor/havaKonum.ts'])
    const src = readFileSync(join(kok, 'lib/doktor/havaKonum.ts'), 'utf8')
    const ilk = src.indexOf('getCurrentPosition'); const iste = src.indexOf('const iste = useCallback')
    assert.ok(iste > 0 && ilk > iste, 'getCurrentPosition is only inside the tap handler')
    assert.equal(src.split('getCurrentPosition').length - 1, 1)
  })
  it('the frame draws the tap-to-show chip only when offered, and the reading when there is one', () => {
    const p = (hesapEk: Partial<KabukProps['hesap']>) => renderToStaticMarkup(React.createElement(KabukGorunumu, {
      marka: 'Notya', kicker: 'DOKTOR', asistan: null, calisma: null, diger: null, onGit: () => {},
      hesap: { harfler: 'A', avatarUrl: null, ad: 'A', alt: '', avatarAd: 'A', avatarBasligi: '', avatarEtiketi: '', saat: '10:00', hava: null, cikis: 'x', onHesap: () => {}, onCikis: () => {}, ...hesapEk },
      sekme: [], menu: { asistan: [], ogeler: [] }, menuAktif: false, menuAcik: false, onMenu: () => {}, geri: null, anaSayfaId: 'a',
      menuMetni: 'm', menuKapat: 'k', anaMenu: 'n', anaSayfa: false, genis: false, kompakt: false, bitkiSrc: '', altYazi: '', children: null,
    }))
    assert.doesNotMatch(p({}), /notya-hava-iste/)
    assert.match(p({ havaIste: { etiket: 'Weather', onIste: () => {} } }), /class="notya-hava-iste"[^>]*>.*Weather/)
    const okuma = p({ hava: { sicaklik: 21, kod: 0 }, havaIste: { etiket: 'Weather', onIste: () => {} } })
    assert.match(okuma, /21°/)
    assert.doesNotMatch(okuma, /notya-hava-iste/)
  })
})
