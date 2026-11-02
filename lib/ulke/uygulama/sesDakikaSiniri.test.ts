/**
 * STRIPE-NOTYA-AU-05 - the live-voice minute cap: period by plan state, the call-start gate (one parallel read,
 * fail open), and the call-end record (bounded by the token's issue time, counted once).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sesDonemi, sesKarari } from '@/lib/billing/sesDakika'
import { cagriSaniyesi, cagriSuresiYaz, sesDakikaKapisi } from './sesDakikaSiniri'
import { canliJetonuImzala } from '@/lib/ulke/asistan/jeton'

process.env.NOTYA_SES_JETON_SECRET = 'x'.repeat(40)
const SINIR = { denemeDakika: 60, aylikDakika: 150 }
const T = Date.parse('2026-11-20T10:00:00Z')

/** A stand-in client: every chain resolves to the table's rows; writes are recorded. */
function sahteDb(tablolar: Record<string, unknown[] | Record<string, unknown> | Error>) {
  const okunan: string[] = []
  const islevler: Array<{ ad: string; p: Record<string, unknown> }> = []
  const db = {
    from(ad: string) {
      okunan.push(ad)
      const v = tablolar[ad]
      const sonuc = v instanceof Error ? { data: null, error: v } : { data: v ?? [], error: null }
      const zincir: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'gte', 'order', 'limit', 'upsert', 'maybeSingle']) zincir[m] = () => zincir
      zincir.then = (ok: (x: unknown) => unknown) => Promise.resolve(sonuc).then(ok)
      return zincir
    },
    rpc(ad: string, p: Record<string, unknown>) { islevler.push({ ad, p }); return Promise.resolve({ data: null, error: null }) },
  }
  return { db: db as unknown as SupabaseClient, okunan, islevler }
}

describe('period by plan state', () => {
  it('trialing: trial allowance from the trial start; paid: monthly allowance from the period start; none: lifetime', () => {
    assert.deepEqual(sesDonemi({ status: 'trialing', trial_ends_at: '2026-11-25T00:00:00Z', current_period_start: '2026-11-10T00:00:00Z' }, SINIR, T),
      { tur: 'deneme', baslangicGunu: '2026-11-10', limitDakika: 60 })
    assert.deepEqual(sesDonemi({ status: 'trialing', trial_ends_at: '2026-11-25T00:00:00Z', current_period_start: null }, SINIR, T).baslangicGunu, '2026-11-10')
    assert.deepEqual(sesDonemi({ status: 'active', trial_ends_at: null, current_period_start: '2026-11-03T00:00:00Z' }, SINIR, T),
      { tur: 'ucretli', baslangicGunu: '2026-11-03', limitDakika: 150 })
    assert.equal(sesDonemi({ status: 'past_due', trial_ends_at: null, current_period_start: '2026-11-03T00:00:00Z' }, SINIR, T).limitDakika, 150)
    assert.deepEqual(sesDonemi(null, SINIR, T), { tur: 'abonesiz', baslangicGunu: '2000-01-01', limitDakika: 60 })
    assert.equal(sesDonemi({ status: 'canceled', trial_ends_at: null, current_period_start: '2026-11-03T00:00:00Z' }, SINIR, T).tur, 'abonesiz')
  })

  it('refuses at the cap, allows below it', () => {
    const d = { tur: 'deneme' as const, baslangicGunu: '2026-11-10', limitDakika: 60 }
    assert.equal(sesKarari(d, 3599).izin, true)
    assert.equal(sesKarari(d, 3600).izin, false)
    assert.equal(sesKarari(d, 3600).kullanilanDakika, 60)
  })
})

describe('call-start gate', () => {
  it('trial at 60 minutes in the trial window: refused; usage before the trial start does not count', async () => {
    const { db, okunan } = sahteDb({
      subscriptions: [{ status: 'trialing', trial_ends_at: '2026-11-25T00:00:00Z', current_period_start: '2026-11-10T00:00:00Z' }],
      ulke_kullanim_olcumu: [{ gun: '2026-11-01', saniye: 9000 }, { gun: '2026-11-12', saniye: 1800 }, { gun: '2026-11-19', saniye: '1800' }],
    })
    const k = await sesDakikaKapisi(db, 'u1', 'au', T)
    assert.deepEqual(k, { izin: false, tur: 'deneme', limitDakika: 60, kullanilanDakika: 60 })
    assert.deepEqual(okunan.sort(), ['subscriptions', 'ulke_hesaplari', 'ulke_kullanim_olcumu'])
  })

  it('paid at 149 minutes this period: allowed (checked at start only, a running call is never cut)', async () => {
    const { db } = sahteDb({
      subscriptions: [{ status: 'canceled', trial_ends_at: null, current_period_start: null }, { status: 'active', trial_ends_at: null, current_period_start: '2026-11-03T00:00:00Z' }],
      ulke_kullanim_olcumu: [{ gun: '2026-11-05', saniye: 149 * 60 }],
    })
    assert.equal((await sesDakikaKapisi(db, 'u1', 'au', T))?.izin, true)
  })

  it('founder exemption (migration 186): no cap at all - trial or paid - read in the same round trip', async () => {
    for (const subscriptions of [[], [{ status: 'active', trial_ends_at: null, current_period_start: '2026-11-03T00:00:00Z' }]]) {
      const { db, okunan } = sahteDb({ subscriptions, ulke_kullanim_olcumu: [{ gun: '2026-11-05', saniye: 999 * 60 }], ulke_hesaplari: { ozel_muafiyet: true } })
      assert.equal(await sesDakikaKapisi(db, 'u1', 'au', T), null)
      assert.deepEqual(okunan.sort(), ['subscriptions', 'ulke_hesaplari', 'ulke_kullanim_olcumu'])
    }
    // Flag off: the same usage is refused as before.
    const { db } = sahteDb({ subscriptions: [], ulke_kullanim_olcumu: [{ gun: '2026-11-05', saniye: 999 * 60 }], ulke_hesaplari: { ozel_muafiyet: false } })
    assert.equal((await sesDakikaKapisi(db, 'u1', 'au', T))?.izin, false)
  })

  it('a country without a cap reads nothing; a failed read fails open', async () => {
    const yok = sahteDb({})
    assert.equal(await sesDakikaKapisi(yok.db, 'u1', 'gb', T), null)
    assert.deepEqual(yok.okunan, [])
    const bozuk = sahteDb({ subscriptions: new Error('down'), ulke_kullanim_olcumu: [] })
    assert.equal(await sesDakikaKapisi(bozuk.db, 'u1', 'au', T), null)
  })
})

describe('call-end record', () => {
  it('seconds = the browser count, never more than the token age or 120 minutes', () => {
    assert.equal(cagriSaniyesi({ verildi: 0, simdi: 300_000, bildirilen: 120 }), 120)
    assert.equal(cagriSaniyesi({ verildi: 0, simdi: 300_000, bildirilen: 99_999 }), 300)
    assert.equal(cagriSaniyesi({ verildi: 0, simdi: 300_000, bildirilen: 'x' }), 300)
    assert.equal(cagriSaniyesi({ verildi: 0, simdi: 10 * 3600_000, bildirilen: undefined }), 7200)
  })

  it('records the call once under the task canli-ses; a forged token or another country records nothing', async () => {
    const { db, islevler } = sahteDb({ ulke_hesaplari: [] })
    const basla = Date.now() - 90_000
    const jeton = canliJetonuImzala({ hesapId: 'u1', kod: 'au', rol: 'gp', cagri: 'c-1' }, basla)!
    assert.equal(await cagriSuresiYaz(db, 'au', jeton, 80), true)
    assert.equal(await cagriSuresiYaz(db, 'au', jeton, 80), false)
    assert.equal(await cagriSuresiYaz(db, 'au', jeton.slice(0, -2) + 'xx', 80), false)
    assert.equal(await cagriSuresiYaz(db, 'gb', jeton, 80), false)
    assert.equal(islevler.length, 1)
    assert.equal(islevler[0].p.p_gorev, 'canli-ses')
    assert.equal(islevler[0].p.p_saniye, 80)
    assert.equal(islevler[0].p.p_doctor_id, 'u1')
  })
})
