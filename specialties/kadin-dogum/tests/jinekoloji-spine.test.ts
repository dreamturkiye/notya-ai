import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dueHesapla, serviksAksiyonu, partnerTedaviGerekli, ilkUlserKontrolListesi, akintiOnTani, hsvGebelikGorevleri, pcosDegerlendir, riaTakvimi, hrtOnDegerlendirme, kirmiziBayraklar } from '../engines/jinekoloji-spine'

describe('jinekoloji due engine', () => {
  it('age-based calendars: 21–29 Pap q3y; 30–65 HPV q5y; MG 40–69 q2y (HRT yearly); RİA expiry; overdue flagged', () => {
    const d = dueHesapla({ dob: '1990-01-01', bugun: '2026-09-16', sonHpv: '2020-01-01', sonMamografi: null, riaTakildi: '2020-03-01', riaTipi: 'cu5' })
    const hpv = d.find((x) => x.kod === 'hpv')!; assert.equal(hpv.due, '2025-01-01'); assert.equal(hpv.durum, 'gecikti')
    assert.ok(!d.some((x) => x.kod === 'pap')); assert.ok(!d.some((x) => x.kod === 'mamografi'))
    assert.equal(d.find((x) => x.kod === 'ria')!.due, '2025-03-01')
    const y = dueHesapla({ dob: '1975-06-01', bugun: '2026-09-16', sonMamografi: '2026-01-10', hrt: true, hrtBaslangic: '2026-02-01' })
    assert.equal(y.find((x) => x.kod === 'mamografi')!.due, '2027-01-10'); assert.ok(y.some((x) => x.kod === 'hrt_yillik'))
    assert.equal(dueHesapla({ dob: '1980-01-01', bugun: '2026-09-16', histerektomi: true }).some((x) => x.kod === 'hpv'), false)
  })
})

describe('serviks action tree (HSGM style)', () => {
  it('HPV 16/18 → kolposkopi regardless; other HR + NILM → 12 ay; ASC-US HPV- → 3 yıl; HSIL → now; yetersiz → 3 ay; HPV- → +5y', () => {
    assert.equal(serviksAksiyonu('NILM', '16', 35).kolposkopi, true)
    assert.equal(serviksAksiyonu('NILM', 'other_hr', 35).sonrakiAy, 12)
    assert.equal(serviksAksiyonu('ASC-US', 'neg', 35).sonrakiAy, 36)
    assert.equal(serviksAksiyonu('HSIL', null, 35).sonrakiAy, 0)
    assert.equal(serviksAksiyonu('yetersiz', null, 35).sonrakiAy, 3)
    assert.equal(serviksAksiyonu('NILM', 'neg', 40).sonrakiAy, 60)
    assert.equal(serviksAksiyonu('ASC-US', null, 23).sonrakiAy, 12)
    assert.ok(serviksAksiyonu('NILM', null, 35).guven <= 95)
  })
})

describe('STI / HSV / PCOS / IUD / HRT / red flags', () => {
  it('partner task only for bacterial STI; first ulcer forces HIV+RPR; wet mount heuristics', () => {
    assert.equal(partnerTedaviGerekli(['chlamydia']), true); assert.equal(partnerTedaviGerekli(['candida', 'bv']), false)
    assert.equal(ilkUlserKontrolListesi(true).length, 3); assert.equal(ilkUlserKontrolListesi(false).length, 0)
    assert.equal(akintiOnTani({ clueCell: true, ph: 5 }).etken, 'bv'); assert.equal(akintiOnTani({ hif: true, ph: 4 }).etken, 'candida'); assert.equal(akintiOnTani({}).etken, null)
  })
  it('HSV pregnancy hooks and suppression suggestion', () => {
    assert.equal(hsvGebelikGorevleri({ tip: 'hsv2', ilkAtak: false, atakYil: 2, supresyon: false }, true).length, 2)
    assert.equal(hsvGebelikGorevleri({ tip: 'hsv2', ilkAtak: false, atakYil: 7, supresyon: false }, false).length, 1)
  })
  it('PCOS: 2/3 needs exclusion labs; PCOM alone is not PCOS; first post-menarche year blocks; never a locked diagnosis', () => {
    const a = pcosDegerlendir({ oligoAnovulasyon: true, hiperandrojenizm: true, pcomUs: false, menarsYil: 5, dislama: { tsh: true, prl: true, ohp17: true } })
    assert.equal(a.rotterdamKarsilar, true); assert.equal(a.tanikilidi, false)
    assert.equal(pcosDegerlendir({ oligoAnovulasyon: true, hiperandrojenizm: true, pcomUs: false, menarsYil: 5, dislama: {} }).rotterdamKarsilar, false)
    assert.equal(pcosDegerlendir({ oligoAnovulasyon: true, hiperandrojenizm: true, pcomUs: true, menarsYil: 0.5, dislama: { tsh: true, prl: true, ohp17: true } }).rotterdamKarsilar, false)
    assert.ok(pcosDegerlendir({ oligoAnovulasyon: false, hiperandrojenizm: false, pcomUs: true, menarsYil: 5, dislama: {} }).not.some((n) => n.includes('PCOM')))
  })
  it('IUD schedule and HRT pre-check', () => {
    const r = riaTakvimi('2026-09-01', 'lng8'); assert.equal(r.ipKontrol, '2026-10-06'); assert.equal(r.pidUyariBitis, '2026-09-21'); assert.equal(r.sonKullanim, '2034-09-01')
    const h = hrtOnDegerlendirme({ mamografi12Ay: false, tvusEt: 6, vteOykusu: true, memeCa: false, tanisizKanama: false, karacigerHastaligi: false, sigara: false, yas: 55, menopozYil: 3 })
    assert.equal(h.engeller.length, 1); assert.equal(h.eksikler.length, 1); assert.ok(h.uyarilar.some((u) => u.includes('ET 6')))
  })
  it('red flags', () => {
    assert.equal(kirmiziBayraklar({ bhcgPozitif: true, agri: true }).length, 1); assert.equal(kirmiziBayraklar({ ates: true, servikalHassasiyet: true })[0].kod, 'pid'); assert.equal(kirmiziBayraklar({ postmenopozKanama: true })[0].kod, 'pmp'); assert.equal(kirmiziBayraklar({ bhcgPozitif: true }).length, 0)
  })
})
