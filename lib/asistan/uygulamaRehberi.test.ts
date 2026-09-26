/** NOTYA-ASISTAN-REHBER-01 (Kaan, 2026-09-26) — her asistan uygulamayı tanır ve ekran cevabı okunur biçimdedir. */
import { test } from 'node:test'
import assert from 'node:assert'
import { PERSONAS, buildSystemPromptParcalari, buildVoiceSystemPrompt } from './personaEngine'
import { UYGULAMA_REHBERI } from './uygulamaRehberi'
import { inlineMaddeAyir } from './markdownTablo'

test('rehber her uzmanın sabit istemine girer (önbelleklenen parça)', () => {
  for (const persona of Object.values(PERSONAS)) {
    const p = buildSystemPromptParcalari(persona, null, null)
    assert.ok(p.sabit.includes('=== UYGULAMA REHBERİ'), persona.id)
    assert.ok(p.sabit.includes('Maddeleri ASLA tek satırda • işaretiyle zincirleme'), persona.id)
    assert.ok(!p.degisken.includes('UYGULAMA REHBERİ'), persona.id)
  }
})

test('rehber ekrandaki gerçek menü adlarını ve onay akışını anlatır', () => {
  for (const ad of ['Ana Sayfa', 'Randevular', 'Hastalar', 'Mesajlar', 'Gelen Belgeler', 'Raporlar', 'Araçlar', 'Ayarlar', 'Asistana sor']) {
    assert.ok(UYGULAMA_REHBERI.includes(ad), ad)
  }
  assert.ok(UYGULAMA_REHBERI.includes('doktor notu ONAYLAR'))
  assert.ok(UYGULAMA_REHBERI.includes('Geri al'))
  assert.ok(UYGULAMA_REHBERI.includes('YENİ KULLANICIYA'))
})

test('sesli istem kısa işareti alır, tam rehberi almaz (istem şişmesin)', () => {
  for (const persona of Object.values(PERSONAS)) {
    const v = buildVoiceSystemPrompt(persona)
    assert.ok(v.includes('Uygulama soruları'), persona.id)
    assert.ok(!v.includes('=== UYGULAMA REHBERİ'), persona.id)
  }
})

test('tek satıra • ile zincirlenmiş maddeler gerçek satırlara açılır (ekran görüntüsündeki durum)', () => {
  const satir = 'Size şu konularda yardımcı olabiliyorum: • **Hasta dosyası** — özet • **Muayene notu hazırlama** — taslak • **Aşı takibi** — takvim'
  assert.deepStrictEqual(inlineMaddeAyir(satir), [
    'Size şu konularda yardımcı olabiliyorum:',
    '- **Hasta dosyası** — özet',
    '- **Muayene notu hazırlama** — taslak',
    '- **Aşı takibi** — takvim',
  ])
})

test('satır başı • maddesi “- ” olur; • içermeyen satır aynen döner', () => {
  assert.deepStrictEqual(inlineMaddeAyir('• Tehlikeli kombinasyon uyarısı'), ['- Tehlikeli kombinasyon uyarısı'])
  assert.deepStrictEqual(inlineMaddeAyir('Düz bir cümle.'), ['Düz bir cümle.'])
  assert.deepStrictEqual(inlineMaddeAyir(''), [''])
})
