/**
 * UYARI-RENKLERI (Kaan, 2026-11-25: "have the real high readings show with a different color than the missed aşı per se")
 * — one semantic palette: clinical readings (acil red / hekime bildir coral / dikkat amber) vs adherence lapses (slate,
 * dashed). Pins: WCAG AA, the CSS mirror of the tokens, the classification (kritik medicine lapse = adherence), "never
 * colour alone" (word + icon), and the rendered patient / doctor screens using the right family. Synthetic data only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import React, { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { UYARI_RENK, enYuksekTon, kontrastOrani, uyariAilesi, uyariTonu } from './uyariRenkleri'
import { CHROME_RENK } from '@/lib/doktor/chromeRenk'
import { SAGLIK_EVI_SOZLERI as S } from './sozler'
import { demoDurumuUygula, gunlukDemoHam, evVerisiDemoGirdisi } from './demo'
import { gunlukOzeti } from './ozet'
import { evVerisiHesapla } from './evVerisi'
import { durumCumlesi } from './evVerisiGorunum'
import { asiKarnesiOlustur } from '@/lib/asi/karneBelgesi'
import { UyariKarti } from '../../components/doktor/portal/saglikEvi/UyariKarti'
import { UyariIsareti } from '../../components/doktor/saglikEvi/UyariIsareti'
import { BugunGorunumu, type BugunKoprusu } from '../../components/doktor/portal/saglikEvi/BugunGorunumu'
import type { GunlukEylemleri } from '../../components/doktor/portal/saglikEvi/eylemler'
import { Rozet } from '@/lib/doktor/aracUi'
import { AsiKarnesiView } from '../../app/portal/_components/AsiKarnesiView'
import { evFisiltiOgeleri } from './hekimSunucu'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'

;(globalThis as { React?: typeof React }).React = React

const SIMDI = '2026-11-25T11:00:00.000Z'
const MS = Date.parse(SIMDI)
const KAGIT = ['#fffdf8', '#fffdf9', '#ffffff', '#f8f3ea', CHROME_RENK.paper]
const KLINIK = ['acil', 'hekime_bildir', 'dikkat'] as const

function ton(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  if (!d) return 0
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

describe('UYARI-RENKLERI — the palette', () => {
  it('WCAG AA: text ≥ 4.5 on every paper and on its own soft background; fills / borders ≥ 3', () => {
    for (const [k, r] of Object.entries(UYARI_RENK)) {
      for (const p of KAGIT) assert.ok(kontrastOrani(r.ana, p) >= 4.5, `${k}.ana on ${p}: ${kontrastOrani(r.ana, p).toFixed(2)}`)
      assert.ok(kontrastOrani(r.ana, r.zemin) >= 4.5, `${k}.ana on its zemin`)
      for (const p of KAGIT) assert.ok(kontrastOrani(r.vurgu, p) >= 3, `${k}.vurgu on ${p}`)
    }
    assert.ok(kontrastOrani('#ffffff', UYARI_RENK.acil.vurgu) >= 4.5, 'white text on the 112 button')
  })
  it('the families really differ: clinical tones are warm (red → amber), adherence is cool slate-indigo (never red)', () => {
    for (const k of KLINIK) { const h = ton(UYARI_RENK[k].ana); assert.ok(h <= 50 || h >= 345, `${k} hue ${h}`) }
    const u = ton(UYARI_RENK.uyum.ana)
    assert.ok(u >= 200 && u <= 260, `uyum hue ${u}`)
    assert.notEqual(UYARI_RENK.acil.ana, UYARI_RENK.hekime_bildir.ana); assert.notEqual(UYARI_RENK.hekime_bildir.ana, UYARI_RENK.dikkat.ana)
  })
  it('Sağlığım CSS mirrors the tokens exactly (one palette, both sides)', () => {
    const css = readFileSync(join(process.cwd(), 'app/portal/saglik-evi.css'), 'utf8')
    const v = (n: string) => css.match(new RegExp(`--${n}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]?.toLowerCase()
    assert.equal(v('sge-k-acil'), UYARI_RENK.acil.ana); assert.equal(v('sge-k-acil-vurgu'), UYARI_RENK.acil.vurgu); assert.equal(v('sge-k-acil-zemin'), UYARI_RENK.acil.zemin)
    assert.equal(v('sge-k-bildir'), UYARI_RENK.hekime_bildir.ana); assert.equal(v('sge-k-bildir-vurgu'), UYARI_RENK.hekime_bildir.vurgu)
    assert.equal(v('sge-k-dikkat'), UYARI_RENK.dikkat.ana); assert.equal(v('sge-k-dikkat-vurgu'), UYARI_RENK.dikkat.vurgu)
    assert.equal(v('sge-uyum'), UYARI_RENK.uyum.ana); assert.equal(v('sge-uyum-vurgu'), UYARI_RENK.uyum.vurgu); assert.equal(v('sge-uyum-zemin'), UYARI_RENK.uyum.zemin)
    // missed dose / week grid / karne low grades → adherence variables, never the warm accent
    assert.match(css, /\.sge-tik--kacti \{[^}]*--sge-uyum/)
    assert.match(css, /\.sge-hucre i\.kacirildi \{[^}]*dashed var\(--sge-uyum-vurgu\)/)
    assert.match(css, /\.sgb-eksik-nokta \{[^}]*dashed var\(--sge-uyum-vurgu\)/)
    assert.match(css, /\.sge-uyari--uyum \{[^}]*dashed/)
  })
})

describe('UYARI-RENKLERI — classification', () => {
  it('a kritik medicine lapse is adherence even at hekime_bildir; readings keep their clinical level', () => {
    assert.equal(uyariAilesi('kritik_ilac'), 'uyum'); assert.equal(uyariTonu('hekime_bildir', 'kritik_ilac'), 'uyum')
    assert.equal(uyariTonu('acil', 'cok_yuksek'), 'acil'); assert.equal(uyariTonu('hekime_bildir', 'egilim_artis'), 'hekime_bildir')
    assert.equal(uyariTonu('dikkat', 'yuksek_dikkat'), 'dikkat'); assert.equal(uyariTonu('bilgi', 'ates_var'), null)
    assert.equal(enYuksekTon(['uyum', 'dikkat', null]), 'dikkat'); assert.equal(enYuksekTon(['uyum']), 'uyum'); assert.equal(enYuksekTon(['hekime_bildir', 'acil']), 'acil')
  })
  it('doctor status sentence: acil → acil, a kritik lapse → uyum, low adherence → uyum (no longer the alert terracotta)', () => {
    const k = evVerisiHesapla(evVerisiDemoGirdisi(SIMDI, 'dahiliye', 'acil'))
    assert.equal(durumCumlesi(k, MS).ton, 'acil')
    const yalnizKritik = { ...k, uyarilar: k.uyarilar.filter((u) => u.kural === 'kritik_ilac') }
    assert.equal(durumCumlesi(yalnizKritik, MS).ton, 'uyum')
    assert.match(durumCumlesi(yalnizKritik, MS).baslik, /Kritik ilaç iki gündür işaretlenmedi/)
    const dusukUyum = { ...k, uyarilar: [], uyum: { ...k.uyum, hafta: { alinan: 5, beklenen: 10, yuzde: 50 } } }
    assert.equal(durumCumlesi(dusukUyum, MS).ton, 'uyum')
  })
})

describe('UYARI-RENKLERI — rendered screens (never colour alone)', () => {
  it('a clinical alert card says its level in words and draws a solid mark; an adherence card is slate with a dashed mark', () => {
    const acil = renderToStaticMarkup(createElement(UyariKarti, { s: S, duzey: 'acil', kural: 'cok_yuksek', metin: 'Kan şekeriniz çok yüksek.' }))
    assert.match(acil, /sge-uyari--acil/); assert.match(acil, />Acil</); assert.match(acil, /data-ton-ikon="acil"/); assert.match(acil, /tel:112/)
    const bildir = renderToStaticMarkup(createElement(UyariKarti, { s: S, duzey: 'hekime_bildir', kural: 'yuksek_bildir', metin: 'x' }))
    assert.match(bildir, />Doktora bildirildi</); assert.match(bildir, new RegExp(UYARI_RENK.hekime_bildir.ana))
    const uyum = renderToStaticMarkup(createElement(UyariKarti, { s: S, duzey: 'hekime_bildir', kural: 'kritik_ilac', metin: 'Ramipril için iki gündür doz işaretlenmedi.' }))
    assert.match(uyum, /sge-uyari--uyum/); assert.match(uyum, />İşaretlenmedi</); assert.match(uyum, /data-ton-ikon="kesikli"/)
    for (const k of KLINIK) assert.ok(!uyum.includes(UYARI_RENK[k].ana) && !uyum.includes(UYARI_RENK[k].vurgu), `clinical ${k} colour on an adherence card`)
  })
  it('Bugün with an acil reading next to a missed dose: two families side by side', () => {
    const d = gunlukOzeti(demoDurumuUygula(gunlukDemoHam(SIMDI, 'dahiliye'), 'acil'))
    const kopru: BugunKoprusu = { randevu: null, randevuHref: '/r', mesajSayisi: 0, mesajHref: '/m', sonZiyaret: null, sonucSayisi: 0, sonucHref: '/s', karneHref: '/k', gunlukHref: '/g', dozHref: '/d', tercihHref: '/t', kvkkHref: '/kvkk' }
    const ok = async () => ({ ok: true as const })
    const e: GunlukEylemleri = { olcumEkle: ok, olcumSil: ok, doz: ok, plan: ok, tercih: ok, soru: ok, soruSil: ok, rozetGoruldu: async () => {}, uyariGoruldu: async () => {}, fotoOku: async () => ({ ok: true, oneriler: [], okunamadi: true }), push: { durum: 'yok', ac: ok, kapat: async () => {} }, indirJson: null, indirCsv: null, veriSil: ok }
    const eski = Date.now; Date.now = () => MS
    let html = ''
    try { html = renderToStaticMarkup(createElement(BugunGorunumu, { s: S, durum: d, eylemler: e, kopru, hastaAdi: 'Demo Hasta' })) } finally { Date.now = eski }
    assert.match(html, /sge-uyari sge-uyari--acil/)
    assert.match(html, /data-adim="soru"/, 'the acil glucose card keeps the symptom check')
    assert.match(html, /Kusma/)
    assert.match(html, /class="sgb-olcum-deger sge-deger--acil">452/, 'the out-of-range tile value is coloured by level')
    assert.match(html, /<small class="sgb-eksik-uyum">08:00 dozu işaretlenmedi/, 'the missed dose uses the adherence family with its word')
    const eksik = html.slice(html.indexOf('class="sgb-eksik"'), html.indexOf('class="sgb-eksik"') + 400)
    for (const k of KLINIK) assert.ok(!eksik.includes(UYARI_RENK[k].ana), 'clinical colour inside the missed-dose row')
  })
  it('doctor Rozet "uyum" (late aşı) is slate and dashed, not the red one', () => {
    const r = renderToStaticMarkup(createElement(Rozet, { ton: 'uyum', children: 'Gecikti' }))
    assert.match(r, /dashed/); assert.match(r, new RegExp(UYARI_RENK.uyum.ana)); assert.doesNotMatch(r, /#7A3D28/i)
    const src = readFileSync(join(process.cwd(), 'components/doktor/AsiHatirlatmaListesi.tsx'), 'utf8')
    assert.match(src, /s\.durum === 'gecikti' \? 'uyum'/)
  })
  it('patient Aşı Karnesi: a passed next-dose date is listed in the adherence family, no clinical words', () => {
    const karne = asiKarnesiOlustur({ asilar: [{ asi_adi: 'Hepatit A', doz_no: 1, uygulama_tarihi: '2026-01-10', sonraki_doz_tarihi: '2026-07-10' } as never], hasta: { adSoyad: 'QA', dogumTarihi: '2024-01-01' }, hekim: { ad: null, klinik: null }, bugunIso: '2026-11-25' })
    assert.deepEqual(karne.gecikenler, [{ ad: 'Hepatit A', tarih: '2026-07-10' }])
    assert.deepEqual(karne.siradakiler, [])
    const html = renderToStaticMarkup(createElement(AsiKarnesiView, { karne, basePath: '/p', pdfUrl: null }))
    assert.match(html, /Tarihi geçti/); assert.match(html, /dashed/); assert.match(html, new RegExp(UYARI_RENK.uyum.vurgu))
    assert.doesNotMatch(html.replace(/<style>[\s\S]*?<\/style>/, ''), /\b(risk\w*|eksik\w*|gecik\w*|tanı\w*|kaçırıl\w*)\b/i)
  })
  it('the shared mark always carries a word', () => {
    for (const t of ['acil', 'hekime_bildir', 'dikkat', 'uyum'] as const) {
      const h = renderToStaticMarkup(createElement(UyariIsareti, { ton: t, etiket: 'Kelime' }))
      assert.match(h, />Kelime</); assert.match(h, /<svg/)
    }
  })
  it('Fısıltı home-data item carries its tone: acil outranks a kritik lapse; a lapse alone is uyum', async () => {
    const db = new SahteVeritabani()
    const D = '00000000-0000-4000-8000-0000000000d1'
    for (const p of ['p1', 'p2']) { db.ekle('patients', { id: p, doctor_id: D, name_encrypted: null }); db.ekle('ev_tercihler', { doctor_id: D, patient_id: p, paylasim_onayi: true }) }
    const u = (p: string, duzey: string, kural: string) => db.ekle('ev_uyarilar', { doctor_id: D, patient_id: p, duzey, kural, hekim_metni: 'x', olusturma_at: new Date().toISOString(), hekim_gordu_at: null })
    u('p1', 'hekime_bildir', 'kritik_ilac'); u('p1', 'acil', 'cok_yuksek'); u('p2', 'hekime_bildir', 'kritik_ilac')
    const ogeler = await evFisiltiOgeleri(db.istemci() as never, D, 'dahiliye')
    assert.equal(ogeler.find((o) => o.patientId === 'p1')?.evTon, 'acil')
    assert.equal(ogeler.find((o) => o.patientId === 'p2')?.evTon, 'uyum')
    assert.match(ogeler[0].hedefYol, /evAyrinti=uyarilar/)
  })
})
