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

test('branşa özel blok: her uzman kendi branşının araçlarını bilir, başkasınınkini anlatmaz (sızma kuralı)', () => {
  const dahiliye = Object.values(PERSONAS).find((p) => p.primarySpecialty === 'dahiliye')!
  const pediatri = Object.values(PERSONAS).find((p) => p.primarySpecialty === 'pediatri')!
  const ds = buildSystemPromptParcalari(dahiliye, null, null).sabit
  const ps = buildSystemPromptParcalari(pediatri, null, null).sabit
  assert.ok(ds.includes('Dahiliye Kohort Paneli') && ds.includes('SCORE2'))
  assert.ok(ps.includes('Hedef Boy') && ps.includes('Pediatri Kohort Paneli'))
  assert.ok(!ps.includes('Dahiliye Kohort Paneli'))
  assert.ok(!ds.includes('Hedef Boy'))
  for (const persona of Object.values(PERSONAS)) {
    const sabit = buildSystemPromptParcalari(persona, null, null).sabit
    assert.ok(sabit.includes('=== BRANŞA ÖZEL ('), persona.id)
    assert.ok(sabit.includes('üstteki uzman şeridinden o branşın uzmanına geçilebileceğini söyle'), persona.id)
    assert.ok(sabit.includes('Temel Araçlar'), persona.id)
  }
})

test('sesli istem: yalnız kendi branş aracı ADLARI (kısa), başka branşınki yok', () => {
  const pediatri = Object.values(PERSONAS).find((p) => p.primarySpecialty === 'pediatri')!
  const v = buildVoiceSystemPrompt(pediatri)
  assert.ok(v.includes('Hedef Boy'))
  assert.ok(!v.includes('Dahiliye Kohort Paneli'))
  assert.ok(!v.includes('mg/kg ve konsantrasyonla')) // açıklamalar sesli isteme girmez, yalnız adlar
})
