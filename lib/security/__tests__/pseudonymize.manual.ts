import { pseudonymize, restore, restoreDeep, assertNoTckn } from '../pseudonymize'

let fail = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log((ok ? '  PASS  ' : '  FAIL  ') + label + (detail ? ' | ' + detail : ''))
  if (!ok) fail++
}

console.log('=== 1. CLINICAL NUMBERS MUST SURVIVE (dosages, vitals, lab values) ===')
const clinical = 'Amoksisilin 500 mg 2x1, 7 gün. TA 140/90 mmHg. Nabız 78. HbA1c 6.8. Kreatinin 1.02. INR 2.3. 10000 IU D vitamini.'
const c1 = pseudonymize(clinical)
check('dosages/vitals untouched', c1.text === clinical, c1.text === clinical ? '' : c1.text)

console.log('\n=== 2. TCKN-LOOKING CLINICAL NUMBERS ===')
const notTckn = 'Barkod 98765432109876. Protokol no 2026081234. Cihaz seri 1234567890.'
const c2 = pseudonymize(notTckn)
check('10-digit and 14-digit numbers not treated as TCKN', c2.text === notTckn, c2.text)

console.log('\n=== 3. ROUND TRIP IS EXACT ===')
const note = 'Ahmet Yılmaz, TC 12345678901, tel 0532 123 45 67. Ahmet bey kan basıncı yüksek.'
const c3 = pseudonymize(note, ['Ahmet Yılmaz'])
check('restore returns the original exactly', restore(c3.text, c3.map) === note)
check('identifiers gone from what is sent', !/Ahmet|12345678901|532/.test(c3.text), c3.text)
check('clinical phrase intact', /kan basıncı yüksek/.test(c3.text))

console.log('\n=== 4. NESTED RESPONSE RESTORE (epikriz/sgk-rapor shape) ===')
const modelOut = {
  hastaBilgileri: '[HASTA_1], 47y',
  taniVeTedavi: 'Bel ağrısı',
  liste: ['[HASTA_2] kontrole gelecek', 'Reçete verildi'],
  ic: { derin: '[HASTA_1] takip' },
}
const restored: any = restoreDeep(modelOut, c3.map)
check('nested strings restored', restored.hastaBilgileri.startsWith('Ahmet') && restored.ic.derin.startsWith('Ahmet'), JSON.stringify(restored.ic))
check('array entries restored', typeof restored.liste[0] === 'string' && !restored.liste[0].includes('[HASTA'))
check('untouched fields unchanged', restored.taniVeTedavi === 'Bel ağrısı')

console.log('\n=== 5. NO NAME SUPPLIED (icd10 / ilac-interaksiyon path) ===')
const q = 'diyabetes mellitus tip 2 kontrolsüz'
const c5 = pseudonymize(q)
check('plain clinical query passes through unchanged', c5.text === q, c5.text)

console.log('\n=== 6. GUARD ONLY FIRES ON REAL TCKN ===')
try { assertNoTckn('İlaçlar: metformin 1000 mg, 2x1', 'test'); check('clean prompt allowed', true) }
catch (e) { check('clean prompt allowed', false, (e as Error).message) }
try { assertNoTckn('Hasta 12345678901', 'test'); check('tckn blocked', false) }
catch { check('tckn blocked', true) }

console.log('\n=== 7. EMPTY / NULL INPUT ===')
check('empty string safe', pseudonymize('').text === '')
check('undefined-ish safe', pseudonymize(undefined as any).text === '')

console.log('\nFAILURES: ' + fail)
