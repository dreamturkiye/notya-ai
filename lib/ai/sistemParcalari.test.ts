/**
 * NOTYA-MALIYET-01 (prompt caching) — system promptu sabit/değişken diye bölmek modelin gördüğü metni DEĞİŞTİRMEZ.
 * sabit + degisken, eski tek-parça promptla birebir aynıdır; sabit parça hasta/müşteri/müvekkil verisi taşımaz
 * (taşısaydı hem önbellek her turda bozulur hem de bir hastanın verisi "sabit" gibi davranırdı).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PERSONAS, buildSystemPrompt, buildSystemPromptParcalari } from '@/lib/asistan/personaEngine'
import { MALI_PERSONAS, buildMaliSystemPrompt, buildMaliSystemPromptParcalari } from '@/lib/mali/maliPersonaEngine'
import { AVUKAT_PERSONAS, buildAvukatSystemPrompt, buildAvukatSystemPromptParcalari } from '@/lib/avukat/avukatPersonaEngine'
import { notKonsultSistemParcalari, notKonsultSistemPromptu } from '@/lib/doktor/notKonsultPromptu'
import { bransKapsami } from '@/lib/specialties/kapsam'

const HASTA = { id: 'h-1', name: 'SENTETIK_HASTA_ISARETI', allergies: ['penisilin'] }
const HAFIZA = '=== MESLEKTAŞ HAFIZASI ===\nSENTETIK_HAFIZA_ISARETI'

describe('asistan sohbeti — sabit + değişken = eski prompt', () => {
  const persona = Object.values(PERSONAS)[0]
  const doktor = { firstName: 'Ayla', lastName: 'Test' } as never
  for (const [ad, hasta, hafiza] of [['hastasız', null, undefined], ['hastalı + hafızalı', HASTA, HAFIZA]] as const) {
    it(ad, () => {
      const p = buildSystemPromptParcalari(persona, null, hasta, doktor, hafiza)
      assert.equal(p.sabit + p.degisken, buildSystemPrompt(persona, null, hasta, doktor, hafiza))
      assert.ok(!p.sabit.includes('SENTETIK_HASTA_ISARETI') && !p.sabit.includes('SENTETIK_HAFIZA_ISARETI'))
      assert.ok(p.sabit.includes('JSON YANIT FORMATINI KULLAN'))
    })
  }
  it('sabit parça hastadan bağımsız (önbellek turdan tura tutar)', () => {
    const a = buildSystemPromptParcalari(persona, null, HASTA, null, HAFIZA).sabit
    const b = buildSystemPromptParcalari(persona, null, null, null, undefined).sabit
    assert.equal(a, b)
  })
})

describe('mali / avukat sohbeti — sabit + değişken = eski prompt', () => {
  it('mali', () => {
    const persona = Object.values(MALI_PERSONAS)[0]
    const prefs = { sessionsCompleted: 7, noteStyle: 'kisa' } as never
    const musteri = { unvan: 'SENTETIK_MUSTERI' }
    const p = buildMaliSystemPromptParcalari(persona, prefs, musteri, { id: 'x', name: 'Deniz Test' })
    assert.equal(p.sabit + p.degisken, buildMaliSystemPrompt(persona, prefs, musteri, { id: 'x', name: 'Deniz Test' }))
    assert.ok(!p.sabit.includes('SENTETIK_MUSTERI') && p.degisken.includes('SENTETIK_MUSTERI'))
  })
  it('avukat', () => {
    const persona = Object.values(AVUKAT_PERSONAS)[0]
    const muv = { ad: 'SENTETIK_MUVEKKIL' }
    const p = buildAvukatSystemPromptParcalari(persona, null, muv, { id: 'x', name: 'Deniz Test' }, null)
    assert.equal(p.sabit + p.degisken, buildAvukatSystemPrompt(persona, null, muv, { id: 'x', name: 'Deniz Test' }, null))
    assert.ok(!p.sabit.includes('SENTETIK_MUVEKKIL') && p.degisken.includes('SENTETIK_MUVEKKIL'))
  })
})

describe('not-konsult — içerik korunur, tarih ve taslak sabit parçada değil', () => {
  for (const brans of ['pediatri', 'kadin-hastaliklari-dogum', 'dahiliye']) {
    it(brans, () => {
      const g = { kapsam: bransKapsami({ seansBransi: brans }), trtBugun: '2026-09-19', not: { hasta_ozeti: 'SENTETIK_OZET' }, taslak: { plan: 'SENTETIK_PLAN' }, klinikBaglam: 'SENTETIK_DOSYA', hafizaBlogu: HAFIZA }
      const p = notKonsultSistemParcalari(g)
      assert.equal(notKonsultSistemPromptu(g), `${p.sabit}\n${p.degisken}`)
      for (const i of ['2026-09-19', 'SENTETIK_OZET', 'SENTETIK_PLAN', 'SENTETIK_DOSYA', 'SENTETIK_HAFIZA_ISARETI']) {
        assert.ok(!p.sabit.includes(i), `${brans}: sabit parçada ${i}`)
        assert.ok(p.degisken.includes(i), `${brans}: değişken parçada ${i} yok`)
      }
      // kurallar sabit parçada kalır
      assert.ok(p.sabit.includes('DÜZENLEYEBİLECEĞİN ALANLAR') && p.sabit.includes('Nihai klinik karar'))
      assert.ok(p.degisken.includes('SADECE geçerli JSON döndür'))
    })
  }
  it('sabit parça aynı branşta taslak/tarihten bağımsız', () => {
    const kapsam = bransKapsami({ seansBransi: 'dahiliye' })
    const a = notKonsultSistemParcalari({ kapsam, trtBugun: '2026-09-19', not: {}, taslak: { plan: 'A' } }).sabit
    const b = notKonsultSistemParcalari({ kapsam, trtBugun: '2026-09-20', not: {}, taslak: { plan: 'B' } }).sabit
    assert.equal(a, b)
  })
})
