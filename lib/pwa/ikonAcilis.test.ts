import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pwaIkonundanAsistanKarari } from './ikonAcilis'

test('PWA cold open of /asistan is an icon launch; menu tap with a dashboard referrer is not', () => {
  assert.equal(pwaIkonundanAsistanKarari({ standalone: true, sessionYeni: true, referrerPath: null }), true)
  assert.equal(pwaIkonundanAsistanKarari({ standalone: true, sessionYeni: true, referrerPath: '/asistan' }), true)
  assert.equal(pwaIkonundanAsistanKarari({ standalone: true, sessionYeni: true, referrerPath: '/dashboard/doktor' }), false)
  assert.equal(pwaIkonundanAsistanKarari({ standalone: true, sessionYeni: false, referrerPath: null }), false)
  assert.equal(pwaIkonundanAsistanKarari({ standalone: false, sessionYeni: true, referrerPath: null }), false)
})
