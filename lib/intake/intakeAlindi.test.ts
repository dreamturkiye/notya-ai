/**
 * NOTYA-INTAKE-ALINDI-01 (Kaan, 2026-11-20) — reopening an intake link that was already submitted shows a friendly
 * confirmation ("Formunuz alındı" + the doctor's name, optional Sağlığım link), never "Form Kullanılamıyor".
 * An invalid / expired link stays a clear, polite message with the practice contact when there is one.
 */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

const rota = readFileSync('app/api/intake/[token]/route.ts', 'utf8')
const sayfa = readFileSync('app/intake/[token]/page.tsx', 'utf8')

test('route: a submitted form answers durum "dolduruldu" with the doctor name and the portal link (409, no schema)', () => {
  const get = rota.slice(rota.indexOf('export async function GET'), rota.indexOf('export async function POST'))
  assert.match(get, /durum: 'dolduruldu', doktorAdi, portalYolu/)
  assert.ok(get.indexOf("durum: 'dolduruldu'") < get.indexOf('coreBolumler'), 'decided before any form data is returned')
  assert.match(get, /durum: 'suresi_doldu', iletisim/)
})

test('route: the Sağlığım link is looked up for THIS form\'s doctor AND patient, PIN-protected and unexpired only', () => {
  const f = rota.slice(rota.indexOf('async function portalYoluAl'), rota.indexOf('async function klinikIletisimAl'))
  assert.match(f, /\.eq\('doctor_id', doktorId\)/)
  assert.match(f, /\.eq\('patient_id', hastaId\)/)
  assert.match(f, /\.not\('pin_hash', 'is', null\)/)
  assert.match(f, /\.gt\('expires_at'/)
})

test('page: confirmation card, no error wording; the portal link only when given and internal', () => {
  assert.ok(!sayfa.includes('Form Kullanılamıyor'))
  assert.match(sayfa, /Formunuz alındı/)
  assert.match(sayfa, /Teşekkürler, bu formu daha önce gönderdiniz\./)
  assert.match(sayfa, /yanıtlarınızı randevunuzdan önce inceleyecek/)
  assert.match(sayfa, /Bu sayfayı kapatabilirsiniz\./)
  assert.match(sayfa, /Sağlığım portalına git/)
  assert.match(sayfa, /startsWith\('\/portal\/hasta\/'\)/)
})
