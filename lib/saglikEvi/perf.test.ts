/**
 * HASTA-PORTALI-GUNLUK — performans-butcesi-koruma for the new portal hot path GET /api/portal/hasta/[token]/gunluk:
 * stand-in database with a simulated 20 ms round trip per query (the SahteVeritabani harness convention), N = 15, median
 * of token lookup + gunlukYukle on a realistic patient (5 medicines, ~150 readings, 35 days of dose marks).
 * Ceilings: warn > 100 ms, fail > 200 ms. Round trips must not grow with the number of medicines / readings.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { resolvePortalToken } from '@/lib/portal/messages'
import { gunlukYukle } from './sunucu'
import { gunlukDemoHam } from './demo'

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

function sahne(ilacSayisi: number) {
  const db = new SahteVeritabani()
  const doktor = 'perf-doktor', hasta = db.ekle('patients', { doctor_id: 'perf-doktor' }).id
  db.ekle('hasta_portal_tokens', { token_hash: 'perf-token', doctor_id: doktor, patient_id: hasta, expires_at: new Date(Date.now() + 86400e3).toISOString(), pin_hash: 'x' })
  const ham = gunlukDemoHam(new Date().toISOString())
  const planIdleri = new Map<string, string>()
  for (let i = 0; i < ilacSayisi; i++) {
    const p = ham.planlar[i % ham.planlar.length]
    const id = db.ekle('ev_ilac_planlari', { doctor_id: doktor, patient_id: hasta, ad: `${p.ad} ${i}`, doz: p.doz, saatler: p.saatler, gerektikce: p.gerektikce, kaynak: p.kaynak, kritik: p.kritik, aktif: true }).id
    if (i < ham.planlar.length) planIdleri.set(p.id, id)
  }
  for (const o of ham.olcumler) db.ekle('ev_olcumleri', { doctor_id: doktor, patient_id: hasta, tip: o.tip, deger: o.deger, deger2: o.deger2, baglam: o.baglam, olcum_at: o.olcumAt, kaynak: o.kaynak })
  for (const k of ham.kayitlar) if (planIdleri.has(k.planId)) db.ekle('ev_doz_kayitlari', { doctor_id: doktor, patient_id: hasta, plan_id: planIdleri.get(k.planId), planlanan_at: k.planlananAt, durum: k.durum, kayit_at: k.kayitAt, ertele_until: null })
  db.ekle('ev_tercihler', { doctor_id: doktor, patient_id: hasta, paylasim_onayi: true, sessiz_bas: '23:00', sessiz_bit: '07:00', hatirlatma_acik: true })
  return db
}

async function olc(db: SahteVeritabani) {
  const sayac = { n: 0 }
  const sb = gecikmeliIstemci(db, sayac)
  const t0 = performance.now()
  const tok = await resolvePortalToken(sb, 'perf-token')
  await gunlukYukle(sb, { doktorId: String(tok!.doctor_id), patientId: String(tok!.patient_id) })
  return { ms: performance.now() - t0, sorgu: sayac.n }
}

describe('performans: Sağlığım Bugün GET', () => {
  it(`median of 15 runs (RTT ${RTT} ms) is under the 200 ms ceiling; round trips flat in N`, async () => {
    const db = sahne(5)
    await olc(db) // warm-up (module load, first plan sync)
    const sureler: number[] = []
    for (let i = 0; i < 15; i++) sureler.push((await olc(db)).ms)
    sureler.sort((a, b) => a - b)
    const medyan = sureler[7]
    console.log(`[perf] gunluk GET median ${medyan.toFixed(1)} ms (min ${sureler[0].toFixed(1)}, max ${sureler[14].toFixed(1)})`)
    assert.ok(medyan < 200, `median ${medyan} ms > 200 ms ceiling`)
    const az = await olc(sahne(1)), cok = await olc(sahne(5))
    const az2 = await olc(sahne(1)), cok2 = await olc(sahne(5))
    // after the first load the plan sync writes nothing; query count must not depend on the number of medicines
    assert.equal(az2.sorgu, cok2.sorgu, `round trips grew with N: ${az2.sorgu} vs ${cok2.sorgu}`)
    console.log(`[perf] queries per load: N=1 → ${az.sorgu} (first) / ${az2.sorgu}, N=5 → ${cok.sorgu} (first) / ${cok2.sorgu}`)
  })
})
