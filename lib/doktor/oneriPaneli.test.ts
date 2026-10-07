/**
 * NOTYA-PEDI-ONERI-01 — pediatride öneriler paneli randevudaki ziyaret tipine bağlı:
 * sağlam çocuk → görünür; hasta çocuk ya da tip yok → gizli; diğer branşlar değişmez.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { muayeneBaslatYolu, onerilerPaneliGorunurMu } from './oneriPaneli'

test('pediatri: sağlam çocuk muayenesi → panel görünür', () => {
  assert.equal(onerilerPaneliGorunurMu({ seansBransi: 'pediatri', hastaDurumu: 'saglikli' }), true)
})

test('pediatri: hasta çocuk muayenesi → panel gizli', () => {
  assert.equal(onerilerPaneliGorunurMu({ seansBransi: 'pediatri', hastaDurumu: 'sikayetli' }), false)
})

test('pediatri: tip yok (walk-in, eski kayıt, bozuk değer) → hasta çocuk sayılır, panel gizli', () => {
  for (const d of [null, undefined, '', 'SAGLIKLI', 'x']) {
    assert.equal(onerilerPaneliGorunurMu({ seansBransi: 'pediatri', hastaDurumu: d }), false, String(d))
  }
  assert.equal(onerilerPaneliGorunurMu({ seansBransi: 'Çocuk Sağlığı ve Hastalıkları', hastaDurumu: null }), false, 'etiketle gelen branş')
  assert.equal(onerilerPaneliGorunurMu({ seansBransi: 'genel', doktorBransi: 'pediatri' }), false, 'seans branşsız, hekim pediatri')
})

test('diğer branşlar bugünkü gibi: panel her zaman görünür', () => {
  for (const b of ['kardiyoloji', 'goz-hastaliklari', 'cocuk-cerrahisi', 'kadin-hastaliklari-dogum', 'genel', null]) {
    for (const d of ['saglikli', 'sikayetli', null]) {
      assert.equal(onerilerPaneliGorunurMu({ seansBransi: b, hastaDurumu: d }), true, `${b}/${d}`)
    }
  }
})

test('Muayeneyi Başlat yolu ziyaret tipini taşır; tip yoksa parametre yok', () => {
  const r = { patientId: 'p1', baslangic: '2026-10-07T07:30:00.000Z' }
  assert.equal(muayeneBaslatYolu({ ...r, hastaDurumu: 'saglikli' }), '/session/new?patientId=p1&randevuBaslangic=2026-10-07T07%3A30%3A00.000Z&hastaDurumu=saglikli')
  assert.equal(muayeneBaslatYolu({ ...r, hastaDurumu: null }), '/session/new?patientId=p1&randevuBaslangic=2026-10-07T07%3A30%3A00.000Z')
})

test('kaynak kilidi: randevu ekranı yolu yardımcıdan kurar; dikte sayfası paneli kurala bağlar', () => {
  const randevu = readFileSync('app/dashboard/doktor/randevular/page.tsx', 'utf8')
  assert.ok(!randevu.includes('/session/new?patientId=${'), 'randevudan elle kurulan dikte yolu kalmamalı')
  assert.equal(randevu.match(/muayeneBaslatYolu\(/g)?.length, 2)
  const sayfa = readFileSync('app/session/new/page.tsx', 'utf8')
  assert.match(sayfa, /searchParams\?\.get\("hastaDurumu"\)/)
  assert.match(sayfa, /\{oneriPaneli && \(\s*<MuayeneCekListesi/)
  assert.match(sayfa, /\{oneriPaneli && cekDogrulama && \(/)
})
