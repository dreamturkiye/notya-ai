/**
 * NOTYA-AYSE-GERI-06 (audit §4.6, PR 7) — which voice turn gets the FULL chart, and how the model asks for it
 * when the short chart turned out not to hold the answer. Pure; the route-level retry is in fishTur.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SES_TAM_DOSYA_ISARETI, sesOzetKurali, sesTamDosyaGerekirMi, sesTamDosyaIstendiMi } from './sesDosya'

describe('sesli turda tam dosya', () => {
  it('liste, seri, geçmiş ve tablo istekleri tam dosyayla gider (denetimdeki dört cümle dahil)', () => {
    for (const m of [
      // audit §4.6 — none of these triggered the full chart
      'Bütün muayenelerdeki kilo ölçümlerini sırayla göster', '6 aylık muayenesini anlat', 'Reçete geçmişini göster', 'Son üç muayenesini özetle',
      // list / series / history / table
      'Tüm tahlillerini say', 'İlaçlarının hepsini söyle', 'Kilolarını tek tek söyle', 'Ölçümlerini tablo yap', 'Tanılarını listele',
      'Aşı geçmişi nasıl', 'Kaç kez antibiyotik kullandı', 'Her muayenede ateşi var mıydı', '2 yaş kontrolünde ne yapılmıştı',
      // what the rule already covered
      'Geçen vizitte ne yazmıştık', 'Mart ayındaki muayenede ne vardı', 'EEG raporunda ne yazıyor', 'Daha önce otit geçirdi mi',
    ]) assert.equal(sesTamDosyaGerekirMi(m), true, m)
  })
  it('kısa özetin tam olduğu sorular özetle kalır', () => {
    for (const m of ['Alerjisi var mı', 'Hangi ilacı kullanıyor', 'Kilosu kaç', 'Kronik hastalığı var mı', 'Augmentin verebilir miyim', 'Merhaba', '']) {
      assert.equal(sesTamDosyaGerekirMi(m), false, m)
    }
  })
  it('kural: model "özetimde yok" demez, işaret yazar', () => {
    const k = sesOzetKurali('QA Hasta')
    assert.ok(k.includes(SES_TAM_DOSYA_ISARETI))
    assert.ok(!/sesli özetimde yok Hocam/.test(k), 'eski cümle kuralda yok')
    assert.match(k, /speech alanına YALNIZCA \[TAM-DOSYA\] yaz/)
  })
  it('işaret (ve eski cümle) tam dosya isteğidir; sıradan cevap değildir', () => {
    for (const y of ['{"speech":"[TAM-DOSYA]"}', '[TAM-DOSYA]', '[ tam dosya ]', 'Bu ayrıntı sesli özetimde yok Hocam; vizit ya da tarih söylerseniz tam dosyadan bakarım.']) assert.equal(sesTamDosyaIstendiMi(y), true, y)
    for (const y of ['QA Hasta — dosyada alerji: Penisilin.', 'Dosyada bu bilgi yok Hocam.', '', null]) assert.equal(sesTamDosyaIstendiMi(y), false, String(y))
  })
})
