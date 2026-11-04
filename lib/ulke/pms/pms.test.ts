/**
 * AU-PMS — Cliniko live path, Magentus gated path, Bp back-burner honesty.
 */
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { pmsAdapterEtkin, pmsDogrula, pmsYaz } from './adapter'
import { clinikoShard, clinikoTaban } from './cliniko'
import { magentusKimlikTamMi } from './magentus'
import { pmsSaglayiciMi, PMS_SAGLAYICILAR } from './tipler'

const BOS_PAKET = {
  surum: 't', ulke: 'au', notId: 'n', onayTarihi: null as string | null, sablon: 'genel',
  not: { s: 'S', o: 'O', a: 'A', p: 'P' }, uyari: 't',
  hasta: { ad: 'Jane Citizen', otaIsmi: '', dogumTarihi: '1990-01-15', telefon: '0412345678' },
}

describe('pms adapter honesty', () => {
  it('lists Cliniko first, then Magentus vendors, Bp last — refuses unknowns', () => {
    assert.deepEqual([...PMS_SAGLAYICILAR], ['cliniko', 'gentu', 'genie', 'best-practice'])
    for (const s of PMS_SAGLAYICILAR) assert.equal(pmsSaglayiciMi(s), true)
    assert.equal(pmsSaglayiciMi('tyro'), false)
    assert.equal(pmsSaglayiciMi('synced'), false)
  })

  it('Cliniko is on by default; Bp/Genie/Gentu need explicit 1', () => {
    assert.equal(pmsAdapterEtkin('cliniko', {}), true)
    assert.equal(pmsAdapterEtkin('cliniko', { NOTYA_PMS_CLINIKO_ETKIN: '0' }), false)
    assert.equal(pmsAdapterEtkin('best-practice', {}), false)
    assert.equal(pmsAdapterEtkin('genie', {}), false)
    assert.equal(pmsAdapterEtkin('gentu', { NOTYA_PMS_GENTU_ETKIN: '1' }), true)
  })

  it('Bp stays PARTNER_YOK even with the flag (back burner, no HTTP yet)', async () => {
    const ortam = { NOTYA_PMS_BEST_PRACTICE_ETKIN: '1' }
    assert.deepEqual(await pmsYaz('best-practice', { anahtar: 'x'.repeat(20) }, BOS_PAKET, ortam), {
      tamam: false, kod: 'PARTNER_YOK',
    })
  })

  it('Magentus without OAuth bundle stays PARTNER_YOK even when flag is on', async () => {
    const ortam = { NOTYA_PMS_GENTU_ETKIN: '1' }
    assert.equal(magentusKimlikTamMi({ anahtar: 'k'.repeat(20) }, {}), false)
    assert.deepEqual(await pmsDogrula('gentu', { anahtar: 'k'.repeat(20) }, ortam), {
      tamam: false, kod: 'PARTNER_YOK',
    })
  })

  it('derives Cliniko shard from key suffix', () => {
    assert.equal(clinikoShard({ anahtar: 'secret-au1' }), 'au1')
    assert.equal(clinikoShard({ anahtar: 'secret-uk1' }), 'uk1')
    assert.equal(clinikoShard({ anahtar: 'nosuffix' }), 'au1')
    assert.equal(clinikoTaban({ anahtar: 'x-au2' }), 'https://api.au2.cliniko.com/v1')
  })

  it('Cliniko dogrula succeeds on mocked /user 200', async () => {
    const onceki = globalThis.fetch
    globalThis.fetch = mock.fn(async (url: string | URL | Request) => {
      const u = String(url)
      assert.match(u, /api\.au1\.cliniko\.com\/v1\/user/)
      return new Response(JSON.stringify({ id: '99', email: 'doc@clinic.test' }), { status: 200 })
    }) as typeof fetch
    try {
      const r = await pmsDogrula('cliniko', { anahtar: 'test-key-au1' }, {})
      assert.deepEqual(r, { tamam: true, ref: 'cliniko-user:99' })
    } finally {
      globalThis.fetch = onceki
    }
  })

  it('Cliniko yaz posts a draft treatment note after unique patient match', async () => {
    const onceki = globalThis.fetch
    const cagrilar: string[] = []
    globalThis.fetch = mock.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url)
      cagrilar.push(`${init?.method || 'GET'} ${u}`)
      if (u.includes('/patients')) {
        return new Response(JSON.stringify({ patients: [{ id: '55', first_name: 'Jane', last_name: 'Citizen' }], total_entries: 1 }), { status: 200 })
      }
      if (u.includes('/treatment_notes') && init?.method === 'POST') {
        const govde = JSON.parse(String(init.body))
        assert.equal(govde.patient_id, '55')
        assert.equal(govde.draft, true)
        assert.ok(govde.content?.sections?.[0]?.questions?.[0]?.answer)
        return new Response(JSON.stringify({ id: 'tn-7' }), { status: 201 })
      }
      return new Response('no', { status: 404 })
    }) as typeof fetch
    try {
      const r = await pmsYaz('cliniko', { anahtar: 'test-key-au1' }, BOS_PAKET, {})
      assert.deepEqual(r, { tamam: true, ref: 'cliniko-note:tn-7' })
      assert.ok(cagrilar.some((c) => c.includes('treatment_notes')))
    } finally {
      globalThis.fetch = onceki
    }
  })

  it('Magentus yaz succeeds when OAuth + DocumentReference are mocked', async () => {
    const onceki = globalThis.fetch
    globalThis.fetch = mock.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url)
      if (u.includes('/oauth2/token') || u.includes('token')) {
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 })
      }
      if (u.includes('/DocumentReference') && init?.method === 'POST') {
        return new Response(JSON.stringify({ resourceType: 'DocumentReference', id: 'dr-1' }), { status: 201 })
      }
      return new Response('no', { status: 404 })
    }) as typeof fetch
    try {
      const ortam = {
        NOTYA_PMS_GENTU_ETKIN: '1',
        NOTYA_PMS_MAGENTUS_CLIENT_ID: 'cid',
        NOTYA_PMS_MAGENTUS_CLIENT_SECRET: 'csec',
        NOTYA_PMS_MAGENTUS_TOKEN_URL: 'https://auth.example/oauth2/token',
        NOTYA_PMS_MAGENTUS_API_URL: 'https://fhir.example',
      }
      const r = await pmsYaz('gentu', { anahtar: 'api-key-xxxxxxxx' }, BOS_PAKET, ortam)
      assert.deepEqual(r, { tamam: true, ref: 'magentus-doc:dr-1' })
    } finally {
      globalThis.fetch = onceki
    }
  })
})
