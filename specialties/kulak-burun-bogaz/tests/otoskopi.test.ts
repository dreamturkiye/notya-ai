import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  otoskopiNotu, otoskopiOzeti, DIS_KULAK_AD, TM_AD, EK_BULGULAR,
} from '@/specialties/kulak-burun-bogaz/engines/otoskopi'
import {
  vertigoNotu, manevraSonrasiKontrolGun, SANTRAL_ISARETLERI, NISTAGMUS_OZELLIKLERI,
} from '@/specialties/kulak-burun-bogaz/engines/vertigo'

describe('KBB-EXCEPTIONAL-01 otoskopi notu', () => {
  it('builds one sentence per ear from the marked findings', () => {
    const s = otoskopiNotu({
      kulaklar: [
        { yan: 'sag', disKulak: ['normal'], tm: ['sag_gorunum'] },
        { yan: 'sol', disKulak: ['buşon'], tm: ['degerlendirilemedi'] },
      ],
      ekBulgular: [],
    })
    assert.equal(s.satirlar.length, 2)
    assert.match(s.satirlar[0], /^Sağ kulak: /)
    assert.match(s.satirlar[1], /^Sol kulak: /)
    assert.ok(s.satirlar[1].includes(DIS_KULAK_AD['buşon']))
    assert.ok(s.satirlar[1].includes(TM_AD.degerlendirilemedi))
    assert.equal(s.tamamMi, true)
  })

  it('never writes a diagnosis word into the note', () => {
    const s = otoskopiNotu({
      kulaklar: [
        { yan: 'sag', disKulak: ['akinti'], tm: ['perforasyon'] },
        { yan: 'sol', disKulak: ['normal'], tm: ['hiperemik', 'bombe'] },
      ],
      ekBulgular: [...EK_BULGULAR],
      hekimNotu: 'Kontrol için çağrıldı',
    })
    assert.doesNotMatch(s.metin, /otitis|otit tan|kolesteatom|tan[ıi]s[ıi] konuldu|mastoidit/i)
    assert.doesNotMatch(s.metin, /\bmg\b|\bmL\b|damla \d/i)
    assert.match(s.metin, /tanı ve tedavi kararı hekimindedir/)
  })

  it('flags the findings that need a decision this visit', () => {
    const s = otoskopiNotu({
      kulaklar: [
        { yan: 'sag', disKulak: ['normal'], tm: ['perforasyon'] },
        { yan: 'sol', disKulak: ['yabanci_cisim'], tm: ['sag_gorunum'] },
      ],
      ekBulgular: [],
    })
    assert.ok(s.dikkat.some((d) => /Sağ kulak/.test(d) && /karar/.test(d)))
    assert.ok(s.dikkat.some((d) => /Sol kulak/.test(d)))
    assert.match(otoskopiOzeti(s), /karar bekliyor/)
  })

  it('an unexamined ear is an eksik, not a silent "normal"', () => {
    const s = otoskopiNotu({ kulaklar: [{ yan: 'sag', disKulak: ['normal'], tm: ['sag_gorunum'] }], ekBulgular: [] })
    assert.equal(s.tamamMi, false)
    assert.ok(s.eksikler.some((e) => /Sol kulak/.test(e)))
    const bos = otoskopiNotu({ kulaklar: [], ekBulgular: [] })
    assert.equal(bos.satirlar.length, 0)
    assert.match(otoskopiOzeti(bos), /kaydı yok/)
  })

  it('unknown codes are dropped instead of being echoed into the note', () => {
    const s = otoskopiNotu({
      kulaklar: [
        { yan: 'sag', disKulak: ['uydurma' as never], tm: ['sag_gorunum'] },
        { yan: 'sol', disKulak: ['normal'], tm: ['sag_gorunum'] },
      ],
      ekBulgular: ['serbest metin bulgu'],
    })
    assert.doesNotMatch(s.metin, /uydurma|serbest metin bulgu/)
  })
})

describe('KBB-EXCEPTIONAL-01 vestibüler muayene notu', () => {
  it('a central red flag blocks the repositioning maneuver and routes to acil', () => {
    const s = vertigoNotu({
      manevralar: [{ manevra: 'dix_hallpike', sonuc: 'pozitif' }],
      nistagmus: [NISTAGMUS_OZELLIKLERI[0]],
      santralIsaretleri: [SANTRAL_ISARETLERI[0]],
      kulakBelirtisi: false,
    })
    assert.equal(s.manevraUygunMu, false)
    assert.ok(s.uyarilar.some((u) => /112|acil/i.test(u)))
    assert.equal(manevraSonrasiKontrolGun(s), 1)
  })

  it('without central signs the maneuver note is clean and follow-up is one week', () => {
    const s = vertigoNotu({
      manevralar: [{ manevra: 'dix_hallpike', yan: 'sag', sonuc: 'pozitif' }, { manevra: 'epley', yan: 'sag', sonuc: 'pozitif' }],
      nistagmus: [NISTAGMUS_OZELLIKLERI[0]],
      santralIsaretleri: [],
      kulakBelirtisi: true,
    })
    assert.equal(s.manevraUygunMu, true)
    assert.equal(s.uyarilar.length, 0)
    assert.equal(manevraSonrasiKontrolGun(s), 7)
    assert.match(s.metin, /tanı, tedavi ve ileri tetkik kararı hekimindedir/)
    assert.doesNotMatch(s.metin, /BPPV|Meniere|vestib[üu]ler n[öo]rit|tan[ıi]s[ıi]/i)
  })

  it('a positive maneuver without nystagmus detail is an eksik', () => {
    const s = vertigoNotu({
      manevralar: [{ manevra: 'supine_roll', sonuc: 'pozitif' }],
      nistagmus: [],
      santralIsaretleri: [],
      kulakBelirtisi: false,
    })
    assert.ok(s.eksikler.some((e) => /nistagmus/i.test(e)))
  })

  it('no maneuver marked at all is an eksik, not an empty normal exam', () => {
    const s = vertigoNotu({ manevralar: [], nistagmus: [], santralIsaretleri: [], kulakBelirtisi: false })
    assert.ok(s.eksikler.some((e) => /işaretlenmedi/.test(e)))
  })
})
