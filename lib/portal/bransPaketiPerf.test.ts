/**
 * BRANS-PAKETI Phase 2 — performans-butcesi-koruma for the two new reads: the Bugün card (GET …/brans-paketi?bugun=1,
 * fetched once after the home paints) and the patient-file tile (GET /api/ozel-brans/paket/hasta?ozet=1).
 * Stand-in database, simulated 20 ms per query (SahteVeritabani convention), N = 15, median. Ceilings: warn > 100 ms,
 * fail > 200 ms. Round trips must not grow with the number of diary entries (one batch of parallel reads).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { resolvePortalToken } from '@/lib/portal/messages'
import { hastaBugunOku, hekimPaketOzeti } from './bransPaketiSunucu'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-sentetik-perf-anahtari'
const RTT = 20

function gecikmeliIstemci(db: SahteVeritabani, sayac: { n: number }) {
  const ic = db.istemci()
  return {
    ...ic,
    from: (t: string) => {
      const q = ic.from(t)
      const sar = (hedef: any): any => new Proxy(hedef, {
        get(h, p) {
          if (p === 'then') return (ok: (v: unknown) => unknown, red: (e: unknown) => unknown) => { sayac.n++; return new Promise((r) => setTimeout(r, RTT)).then(() => h.then(ok, red)) }
          const v = h[p]
          return typeof v === 'function' ? (...a: unknown[]) => { const s = v.apply(h, a); return s && typeof s === 'object' && 'then' in s ? sar(s) : s } : v
        },
      })
      return sar(q)
    },
  } as never
}

function sahne(kayitSayisi: number, brans: string) {
  const db = new SahteVeritabani()
  const doktor = 'perf-doktor'
  db.ekle('users', { id: doktor, specialty: brans })
  const hasta = db.ekle('patients', { doctor_id: doktor }).id
  db.ekle('hasta_portal_tokens', { token_hash: 'perf-token', doctor_id: doktor, patient_id: hasta, expires_at: new Date(Date.now() + 86400e3).toISOString(), pin_hash: 'x' })
  for (const modul of ['dmt-gunluk', 'dmt-foto', 'kd-gebelik-zaman', 'kd-hareket', 'kd-gebelik-belirti']) db.ekle('brans_paket_sablon', { doctor_id: doktor, brans, modul, icerik: {}, kabul_at: new Date().toISOString(), duzenlendi: false, kabul_gecmisi: [] })
  db.ekle('gebelikler', { doctor_id: doktor, patient_id: hasta, sat: new Date(Date.now() - 200 * 86400e3).toISOString().slice(0, 10), durum: 'aktif', created_at: new Date().toISOString() })
  for (let i = 0; i < kayitSayisi; i++) db.ekle('brans_paket_kayit', { doctor_id: doktor, patient_id: hasta, modul: brans === 'dermatoloji' ? 'dmt-gunluk' : 'kd-gebelik-belirti', gun: new Date(Date.now() - (i % 12) * 86400e3).toISOString().slice(0, 10), veri: { kasinti: 3 }, seviye: null, created_at: new Date().toISOString() })
  db.ekle('ev_tercihler', { doctor_id: doktor, patient_id: hasta, paylasim_onayi: true })
  return db
}

async function olc(db: SahteVeritabani, ne: 'bugun' | 'ozet') {
  const sayac = { n: 0 }
  const sb = gecikmeliIstemci(db, sayac)
  const t0 = performance.now()
  if (ne === 'bugun') {
    const tok = await resolvePortalToken(sb, 'perf-token')
    await hastaBugunOku(sb, { doktorId: String(tok!.doctor_id), patientId: String(tok!.patient_id) })
  } else {
    const hasta = db.tablo('patients')[0].id
    await hekimPaketOzeti(sb, { doktorId: 'perf-doktor', patientId: hasta })
  }
  return { ms: performance.now() - t0, sorgu: sayac.n }
}

describe('performans: BRANS-PAKETI Phase 2 reads', () => {
  for (const [ne, brans] of [['bugun', 'dermatoloji'], ['bugun', 'kadin-hastaliklari-dogum'], ['ozet', 'dermatoloji']] as const) {
    it(`${ne} (${brans}): median of 15 runs (RTT ${RTT} ms) under the 200 ms ceiling; round trips flat in N entries`, async () => {
      const db = sahne(60, brans)
      await olc(db, ne)
      const s: number[] = []
      for (let i = 0; i < 15; i++) s.push((await olc(db, ne)).ms)
      s.sort((a, b) => a - b)
      console.log(`[perf] brans-paketi ${ne} ${brans} median ${s[7].toFixed(1)} ms (min ${s[0].toFixed(1)}, max ${s[14].toFixed(1)})`)
      assert.ok(s[7] < 200, `median ${s[7]} ms > 200 ms`)
      const az = await olc(sahne(1, brans), ne), cok = await olc(sahne(120, brans), ne)
      assert.equal(az.sorgu, cok.sorgu, `round trips grew with N: ${az.sorgu} vs ${cok.sorgu}`)
      console.log(`[perf] queries: ${az.sorgu}`)
    })
  }
})
