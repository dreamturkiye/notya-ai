import { test } from 'node:test'
import assert from 'node:assert/strict'
import { taramaDue } from '../engines/tarama'
import { istemDurumu, HT_BASLANGIC_PANELI } from '../engines/htPanel'

test('KETEM: erkek 55 → kolon GGK + prostat bilgi; kolonoskopi 10 yıl içinde → GGK yok', () => {
  const e = taramaDue({ yas: 55, kadin: false, bugun: '2026-09-16' })
  assert.deepEqual(e.map((x) => x.kod), ['kolon', 'prostat']); assert.equal(e[0].durum, 'yaklasiyor')
  const k = taramaDue({ yas: 55, kadin: false, sonKolonoskopi: '2020-01-01', bugun: '2026-09-16' })
  assert.equal(k[0].due, '2030-01-01'); assert.match(k[0].ad, /kolonoskopi/)
})

test('KETEM kadın 45: meme + serviks (HPV/Pap en yeni), histerektomide serviks yok; GGK pozitif → sevk', () => {
  const r = taramaDue({ yas: 45, kadin: true, sonMamografi: '2023-01-01', sonPap: '2022-03-01', sonHpv: '2024-02-01', bugun: '2026-09-16' })
  assert.equal(r.find((x) => x.kod === 'meme')?.durum, 'gecikti'); assert.equal(r.find((x) => x.kod === 'serviks')?.due, '2029-02-01')
  assert.equal(taramaDue({ yas: 45, kadin: true, histerektomi: true, bugun: '2026-09-16' }).some((x) => x.kod === 'serviks'), false)
  assert.equal(taramaDue({ yas: 60, kadin: true, ggkPozitif: true, bugun: '2026-09-16' })[0].durum, 'sevk')
  assert.ok(r.every((x) => x.dipnot.ref === 'KETEM'))
})

test('HT panel: yalnız istem sonrası onaylı satır sayılır; 14 gün sonra takip görevi', () => {
  const istem = { id: 'abcdef123456', tarih: '2026-09-01', kalemler: HT_BASLANGIC_PANELI.slice(0, 3).concat(HT_BASLANGIC_PANELI[10]) }
  const d = istemDurumu(istem, { Hb: ['2026-09-05'], Glu: ['2026-08-01'] }, [], '2026-09-20')
  assert.deepEqual(d.sonuclanan, ['Hemogram (Hb)']); assert.equal(d.gecikti, true); assert.equal(d.takipGorevi?.kod, 'lab_takip_abcdef12')
  const d2 = istemDurumu(istem, { Hb: ['2026-09-05'], Glu: ['2026-09-05'], HbA1c: ['2026-09-05'] }, ['2026-09-02'], '2026-09-20')
  assert.equal(d2.tamam, true); assert.equal(d2.takipGorevi, null)
  assert.equal(istemDurumu(istem, {}, [], '2026-09-10').gecikti, false)
})
