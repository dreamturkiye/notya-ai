import { test } from 'node:test'
import assert from 'node:assert/strict'
import { doktorMetniTemizle, icAlanAdiTemizle, notMetinleriniTemizle, uydurmaFormTemizle } from './klinikMetin'

// KD-DERM-SAFETY-FINDINGS F4 — the literal strings from DERM-PROMPTS-LOCK notes and the F4 reproduction on main.
const IC = /coreImageId|dicomId|pathologyId|VisionRead|[a-z][A-Za-z]*Id\b/

test('coreImageId leak: parenthetical id dropped, bare id becomes the clinical word', () => {
  assert.equal(icAlanAdiTemizle('Bu vizitte fotoğraf kaydı (coreImageId) alınmamış.'), 'Bu vizitte fotoğraf kaydı alınmamış.')
  assert.equal(icAlanAdiTemizle('standardize lezyon fotoğrafı (coreImageId) planlamak'), 'standardize lezyon fotoğrafı planlamak')
  assert.equal(icAlanAdiTemizle('coreImageId kaydı yok; dicomId eksik; VisionRead taslağı uzman onayı bekliyor.'), 'fotoğraf kaydı kaydı yok; DICOM görüntüsü eksik; görüntü okuması taslağı taslağı uzman onayı bekliyor.')
  assert.equal(icAlanAdiTemizle('islem_oncesi ve islem_sonrasi fotoğraflar (photoId, lesionId)'), 'işlem öncesi ve işlem sonrası fotoğraflar')
  assert.ok(!IC.test(icAlanAdiTemizle('pathologyId gelmedi, beforePhotoId ve someNewFieldId de yok')))
})

test('clinical text without identifiers is unchanged (no false positives on Turkish / clinical words)', () => {
  for (const s of ['Hb 10,2 g/dL, TSH normal.', 'Did not respond (ID: yok).', 'Kimlik doğrulandı; hastanın TC kimliği ekranda.', 'SUT 700.100 dermoskopi', 'PASI 12, DLQI 8', 'Android cihaz']) {
    assert.equal(doktorMetniTemizle(s), s, s)
  }
})

test('invented izotretinoin consent form name is made generic', () => {
  assert.equal(uydurmaFormTemizle('İzotretinoin için BZBH Form 014 benzeri onam alınmalı.'), 'İzotretinoin için onam formu (hekimin kullandığı form) onam alınmalı.')
  assert.equal(uydurmaFormTemizle('Aylık gebelik testi takibi ve tedavi onam formu (BZBH Form 014) gereklidir.'), 'Aylık gebelik testi takibi ve tedavi onam formu (hekimin kullandığı form) gereklidir.')
  const r = uydurmaFormTemizle("ABD'de iPLEDGE benzeri onam süreci uygulanmaktadır; Türkiye'de BZBH Form 014 (gebelik önleme programı formu) kullanılır.")
  assert.ok(!/Form 014|gebelik önleme programı formu/.test(r), r); assert.ok(r.includes("Türkiye'de onam formu (hekimin kullandığı form) kullanılır."), r)
})

test('a real bildirim sentence keeps BZBH Form 014 (zührevi / bulaşıcı hastalık bildirimi)', () => {
  const s = 'Sifiliz tanısında BZBH Form 014 ile TSİM bildirimi yapılır.'
  assert.equal(doktorMetniTemizle(s), s)
  assert.equal(doktorMetniTemizle('Form 014 bildirimi hekim tarafından yapılacak.'), 'Form 014 bildirimi hekim tarafından yapılacak.')
})

test('whole note: every nested string cleaned, non-strings untouched', () => {
  const r = notMetinleriniTemizle({ soap: { plan: 'Kontrolde dermoskopi (coreImageId).' }, aiDegerlendirme: 'Onam: BZBH Form 014 benzeri izotretinoin onamı.', ai_confidence: 0.9, receteOnerisi: [{ etkenMadde: 'izotretinoin', not: 'VisionRead yok' }], kritik_bulgular: [] })
  assert.equal(r.soap.plan, 'Kontrolde dermoskopi.'); assert.ok(!/Form 014/.test(r.aiDegerlendirme)); assert.equal(r.ai_confidence, 0.9); assert.equal(r.receteOnerisi[0].not, 'görüntü okuması taslağı yok')
})
