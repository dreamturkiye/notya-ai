/**
 * NOTYA-AYSE-ARAC-PARITE-05 — the latency runner works, and the round trip survives the production wire format.
 *
 * One pass of the acceptance questions with the stand-in model behind lib/ai/saglayici.ts (tools → functions,
 * tool_use ↔ tool_calls, tool_result → role "tool", streamed and not). Every tool-path turn must call a read tool,
 * carry the product's timing line and reach the right answer; every router turn must answer with no tool.
 */
import { gercekModelAc, sahneHazirla, agCagrilari } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { gecikmeOzeti, gecikmeRaporu, okumaGecikmesiniOlc, vekilOkuma, yuzdelik, type GecikmeSatiri } from './tests/okumaGecikme'
import { OKUMA_SORULARI } from './tests/okumaSorulari'

let satirlar: GecikmeSatiri[] = []

before(async () => {
  await sahneHazirla()
  assert.ok(gercekModelAc(vekilOkuma))
  satirlar = await okumaGecikmesiniOlc({ tekrar: 1 })
})

describe('okuma aracı gecikme ölçümü — vekil model, üretim tel biçimi', () => {
  it('her soru × dosya durumu × kanal × yol bir satır', () => {
    assert.equal(satirlar.length, OKUMA_SORULARI.length * 2 * 2 * 2)
  })

  it('araç yolu: her turda okuma aracı çağrıldı, süre günlüğü var, cevap doğru', () => {
    const arac = satirlar.filter((s) => s.yol === 'arac')
    for (const s of arac) {
      const etiket = `${s.kanal} ${s.durum} ${s.soru}`
      assert.ok(s.aracCagrildi, `araç çağrılmadı: ${etiket}`)
      assert.ok(s.dogru, `yanlış cevap: ${etiket}`)
      assert.ok(s.ekMs != null && s.aracMs != null && s.modelMs != null && s.ekMs >= s.aracMs, `süre günlüğü eksik: ${etiket}`)
    }
  })

  it('hızlı yol: araç çağrılmadı, cevap doğru', () => {
    for (const s of satirlar.filter((x) => x.yol === 'hizli')) {
      assert.ok(!s.aracCagrildi && s.ekMs == null, `${s.kanal} ${s.durum} ${s.soru}`)
      assert.ok(s.dogru, `yanlış cevap: ${s.kanal} ${s.durum} ${s.soru}`)
    }
  })

  it('model isteği üretim yolundan gitti: araçlar function biçiminde, araç sonucu role "tool" ile', () => {
    assert.ok(agCagrilari.length > 0)
    assert.ok(agCagrilari.every((c) => c.durum === 200 && !c.hata))
    assert.ok(agCagrilari.some((c) => c.araclar.includes('hasta_bul')) && agCagrilari.some((c) => c.araclar.includes('randevu_takvim')))
    assert.ok(agCagrilari.some((c) => c.akis) && agCagrilari.some((c) => !c.akis), 'akışlı (ses) ve akışsız (yazı) çağrı')
  })

  it('özet ve rapor: p50 hesaplanır, vekil olduğu açıkça yazılır', () => {
    assert.equal(yuzdelik([5, 1, 3], 50), 3)
    assert.equal(yuzdelik([], 50), null)
    const o = gecikmeOzeti(satirlar)
    assert.equal(o.aracTur, o.aracCagrilan)
    assert.equal(o.aracTur, o.aracDogru)
    assert.ok(o.ekP50 != null && o.ekP90 != null && o.ekP90 >= o.ekP50)
    const rapor = gecikmeRaporu({ tarih: '2026-10-02', model: 'vekil (stand-in)', vekil: true, tekrar: 1, satirlar })
    assert.match(rapor, /Stand-in run/)
    assert.match(rapor, /NOT a model's latency/)
  })
})
