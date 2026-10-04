import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cihazSandboxAcikMi } from './cihazSandbox'
import { SUPERUSER_BRANS_IDS } from '@/lib/auth/superuserBranslar'
import fs from 'node:fs'
import path from 'node:path'

const KAAN = 'c4989e29-a219-45b6-bf17-18e260e3c7f9'
const GOKHAN = '94c4db57-8b89-4880-80be-143f88f4bcc1'
const GOKHAN2 = '9030fe09-0a5f-484b-9cc9-3e1e1b0b5178'

describe('NOTYA-BLE-SANDBOX-01', () => {
  it('yalnız Kaan + Dr. Gökhan hesapları açık', () => {
    assert.equal(cihazSandboxAcikMi(KAAN), true)
    assert.equal(cihazSandboxAcikMi(GOKHAN), true)
    assert.equal(cihazSandboxAcikMi(GOKHAN2), true)
    assert.equal(cihazSandboxAcikMi('00000000-0000-4000-8000-000000000001'), false)
    assert.equal(cihazSandboxAcikMi(null), false)
    assert.equal(cihazSandboxAcikMi(''), false)
  })

  it('SUPERUSER listesiyle aynı kimlikler (ayrı liste tutulmaz)', () => {
    assert.deepEqual([...SUPERUSER_BRANS_IDS].sort(), [KAAN, GOKHAN, GOKHAN2].sort())
    for (const id of SUPERUSER_BRANS_IDS) assert.ok(cihazSandboxAcikMi(id), id)
  })

  it('Ayarlar hub + API + sayfa sandbox kapılı', () => {
    const kok = path.join(import.meta.dirname, '../..')
    const hub = fs.readFileSync(path.join(kok, 'app/dashboard/doktor/ayarlar/page.tsx'), 'utf8')
    assert.match(hub, /cihazSandbox|\/ayarlar\/cihazlar/)
    const rota = fs.readFileSync(path.join(kok, 'app/api/doktor/cihazlar/route.ts'), 'utf8')
    assert.match(rota, /cihazSandboxAcikMi/)
    assert.match(rota, /403/)
    const sayfa = fs.readFileSync(path.join(kok, 'app/dashboard/doktor/ayarlar/cihazlar/page.tsx'), 'utf8')
    assert.match(sayfa, /NOTYA-BLE-SANDBOX-01/)
    assert.match(sayfa, /beacio|Bluefy|iOSWebBLE/i)
  })
})
