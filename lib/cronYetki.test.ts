import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { cronYetkiliMi } from './cronYetki'

const U = 'https://notya.ai/api/cron/kvkk-imha'
const istek = (url: string, basliklar: Record<string, string> = {}) => new Request(url, { headers: basliklar })

test('cronYetkiliMi: sahte x-vercel-cron başlığı artık geçmez', () => {
  assert.equal(cronYetkiliMi(istek(U, { 'x-vercel-cron': '1' }), 'gizli'), false)
})

test('cronYetkiliMi: Vercel Bearer CRON_SECRET ve elle ?secret= geçer, yanlışı geçmez', () => {
  assert.equal(cronYetkiliMi(istek(U, { authorization: 'Bearer gizli' }), 'gizli'), true)
  assert.equal(cronYetkiliMi(istek(U + '?secret=gizli'), 'gizli'), true)
  assert.equal(cronYetkiliMi(istek(U, { authorization: 'Bearer yanlis' }), 'gizli'), false)
  assert.equal(cronYetkiliMi(istek(U + '?secret=yanlis'), 'gizli'), false)
})

test('cronYetkiliMi: CRON_SECRET tanımsızsa hiçbir çağrı geçmez', () => {
  assert.equal(cronYetkiliMi(istek(U + '?secret='), ''), false)
  assert.equal(cronYetkiliMi(istek(U, { authorization: 'Bearer ' }), undefined), false)
})
