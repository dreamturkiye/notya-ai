import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  PASI_BOLGELERI,
  akneIga,
  akneIgaAdi,
  bosBolgeGirdisi,
  dlqiBant,
  dokumOzeti,
  easi,
  easiDokumu,
  pasi,
  pasiBant,
  pasiDokumu,
  saltBolgelerden,
  scoradHesap,
  skorTrend,
  uas7Gunlerden,
} from '../engines/score-calculator'

// DERM-EXCEPTIONAL-01 · madde 1 — PASI / EASI bölge çalışma sayfası: serbest tek sayı yerine
// 4 bölge × (E, I/endürasyon, D + alan). Motor hekimin girdiğinden hesaplar; sayı uydurmaz.

const fixture = () => {
  const raw = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'psoriasis-orta.json'), 'utf8'))
  return raw.pasi_regions as ReturnType<typeof bosBolgeGirdisi>
}

describe('PASI bölge dökümü', () => {
  it('döküm toplamı pasi() ile aynıdır ve 4 bölgeyi ağırlıklarıyla listeler', () => {
    const r = fixture()
    const d = pasiDokumu(r)
    assert.equal(d.toplam, pasi(r))
    assert.equal(d.bolgeler.length, 4)
    assert.deepEqual(d.bolgeler.map((b) => b.agirlik), PASI_BOLGELERI.map((b) => b.agirlik))
    assert.equal(d.bolgeler.reduce((s, b) => s + b.agirlik, 0), 1)
  })

  it('bölge katkıları toplamı toplam skoru verir (yuvarlama toleransı içinde)', () => {
    const d = pasiDokumu(fixture())
    const katkiToplam = d.bolgeler.reduce((s, b) => s + b.katki, 0)
    assert.ok(Math.abs(katkiToplam - d.toplam) < 0.2, `${katkiToplam} ≠ ${d.toplam}`)
  })

  it('hiç girilmemiş bölge "eksik" olarak işaretlenir — 0 girmek eksik değildir', () => {
    const bos = pasiDokumu(bosBolgeGirdisi())
    assert.equal(bos.toplam, 0)
    assert.equal(bos.eksikBolgeler.length, 4)
    const r = bosBolgeGirdisi()
    r.head = { e: 2, i: 2, d: 1, a: 3 }
    const d = pasiDokumu(r)
    assert.equal(d.eksikBolgeler.length, 3)
    assert.ok(!d.eksikBolgeler.includes(PASI_BOLGELERI[0].ad))
  })

  it('bant PSOKİD onluk kuralını yansıtır ve skor 0 iken tutulum yok der', () => {
    assert.equal(pasiBant(0), 'tutulum yok')
    assert.match(pasiBant(12), /orta–şiddetli/)
    assert.match(pasiBant(24), /şiddetli/)
  })

  it('döküm özeti bölge başına E/I/D ve alanı okunur biçimde verir', () => {
    const ozet = dokumOzeti(pasiDokumu(fixture()))
    assert.match(ozet, /E\/I\/D/)
    assert.equal(ozet.split('|').length, 4)
  })
})

describe('EASI bölge dökümü', () => {
  it('EASI şiddet alanları 0–3 ile sınırlıdır (PASI 0–4); döküm easi() ile aynıdır', () => {
    const r = bosBolgeGirdisi()
    r.trunk = { e: 3, i: 3, d: 3, a: 4 }
    assert.equal(easiDokumu(r).toplam, easi(r))
    const tasan = bosBolgeGirdisi()
    tasan.trunk = { e: 4, i: 4, d: 4, a: 4 }
    assert.equal(easiDokumu(tasan).toplam, easiDokumu(r).toplam, 'EASI 3 üstüne kırpılmalı')
  })

  it('EASI bandı 0–72 ölçeğinde ayrı kesim noktaları kullanır', () => {
    assert.match(easiDokumu(bosBolgeGirdisi()).bant, /temiz/)
  })
})

describe('SCORAD / DLQI / UAS7 / SALT / IGA yapılandırılmış giriş', () => {
  it('SCORAD A/5 + 7B/2 + C formülünü uygular ve eksik alanları söyler', () => {
    const s = scoradHesap({
      yaygınlık: 30,
      siddet: { eritem: 2, odem: 2, sizinti: 1, ekskoriasyon: 2, likenifikasyon: 1, kuruluk: 2 },
      kasinti: 6,
      uykusuzluk: 4,
    })
    assert.equal(s.a, 30)
    assert.equal(s.b, 10)
    assert.equal(s.c, 10)
    assert.equal(s.toplam, Math.round((30 / 5 + (7 * 10) / 2 + 10) * 10) / 10)
    assert.deepEqual(s.eksikler, [])
    assert.match(s.bant, /şiddetli/)

    const bos = scoradHesap({ yaygınlık: 0, siddet: {}, kasinti: 0, uykusuzluk: 0 })
    assert.equal(bos.eksikler.length, 2)
  })

  it('DLQI bandı 0–30 ölçeğinde etki düzeyi söyler', () => {
    assert.match(dlqiBant(0), /etkisi yok/)
    assert.match(dlqiBant(12), /belirgin etki/)
  })

  it('UAS7 yedi günün kabartı + kaşıntı toplamıdır, eksik gün sayılır', () => {
    const gunler = Array.from({ length: 7 }, () => ({ kabarti: 2, kasinti: 2 }))
    const u = uas7Gunlerden(gunler)
    assert.equal(u.toplam, 28)
    assert.equal(u.gunSayisi, 7)
    assert.equal(u.eksikGun, 0)
    assert.equal(uas7Gunlerden(gunler.slice(0, 4)).eksikGun, 3)
  })

  it('SALT dört bölgenin ağırlıklı yüzdesidir, tam kayıpta 100 verir', () => {
    const tam = saltBolgelerden({ vertex: 100, sag: 100, sol: 100, oksiput: 100 })
    assert.equal(tam.toplam, 100)
    assert.equal(tam.bolgeler.length, 4)
    assert.equal(saltBolgelerden({ vertex: 0, sag: 0, sol: 0, oksiput: 0 }).toplam, 0)
  })

  it('akne IGA 0–4 aralığına kırpılır ve adı vardır', () => {
    assert.equal(akneIga(7), 4)
    assert.equal(akneIga(-2), 0)
    assert.ok(akneIgaAdi(3).length > 2)
  })

  it('skor trendi yalnız iki ölçüm varken üretilir (yorum değil, fark)', () => {
    assert.equal(skorTrend('PASI', null, 8), null)
    const t = skorTrend('PASI', 16, 8)
    assert.ok(t)
    assert.equal(t?.fark, -8)
  })
})
