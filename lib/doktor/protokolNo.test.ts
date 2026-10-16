/**
 * NOTYA-PROTOKOL-NO-01 — tests for lib/doktor/protokolNo.ts.
 *
 * The scoping-resolution tests run everywhere (pure logic, fake Supabase). The concurrency
 * test is the single most important proof per the brief's technical notes ("design and test
 * it carefully — a naive SELECT max+1 WILL collide under concurrent requests") and runs
 * against a REAL Postgres instance — not a mock, not a single-threaded happy path — firing
 * hundreds of truly concurrent calls at `protokol_no_ata()` (lib/db/migrations/
 * 159_protokol_numarasi.sql) over a real connection pool, across two different scopes at the
 * same time, and asserting zero duplicates and a dense sequence for each. It needs
 * DATABASE_URL or SUPABASE_DB_URL (same env contract as scripts/run-sql-migration.mjs) and
 * skips with a clear message when neither is set, so `npm test` still passes with no DB
 * configured — but it is NOT optional before shipping this feature: run it with a real
 * Postgres (`pg_ctlcluster 16 main start` + a scratch DB works) before merging, exactly as
 * was done for this change (see the PR/commit notes).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { protokolKapsamiCoz, protokolNoGorunum } from './protokolNo'

type Satir = Record<string, unknown>

/** Minimal fake `users` table reader — only what protokolKapsamiCoz touches. */
function sahteSupabase(kullanicilar: Record<string, Satir>) {
  return {
    from(tablo: string) {
      if (tablo !== 'users') throw new Error(`[sahteSupabase] beklenmeyen tablo: ${tablo}`)
      return {
        select() {
          return {
            eq(_kolon: string, id: string) {
              return {
                async maybeSingle() {
                  return { data: kullanicilar[id] || null, error: null }
                },
              }
            },
          }
        },
      }
    },
  } as unknown as import('@supabase/supabase-js').SupabaseClient
}

describe('protokolKapsamiCoz', () => {
  it('users.clinic_id doluysa clinic kapsamına döner', async () => {
    const sb = sahteSupabase({ d1: { clinic_id: 'klinik-1' } })
    const kapsam = await protokolKapsamiCoz(sb, 'd1')
    assert.deepEqual(kapsam, { scopeType: 'clinic', scopeId: 'klinik-1' })
  })

  it('users.clinic_id boşsa/null ise doctor kapsamına (kendi id) düşer — gerçek beta hesaplarının tamamı bu durumda', async () => {
    const sb = sahteSupabase({ d1: { clinic_id: null } })
    const kapsam = await protokolKapsamiCoz(sb, 'd1')
    assert.deepEqual(kapsam, { scopeType: 'doctor', scopeId: 'd1' })
  })

  it('users satırı bulunamazsa (hata/yok) doctor kapsamına güvenli şekilde düşer, asla atmaz', async () => {
    const sb = sahteSupabase({})
    const kapsam = await protokolKapsamiCoz(sb, 'bilinmeyen-doktor')
    assert.deepEqual(kapsam, { scopeType: 'doctor', scopeId: 'bilinmeyen-doktor' })
  })
})

describe('protokolNoGorunum', () => {
  it('boş/null değerde "—" gösterir — asla sayı icat etmez', () => {
    assert.equal(protokolNoGorunum(null), '—')
    assert.equal(protokolNoGorunum(undefined), '—')
    assert.equal(protokolNoGorunum(''), '—')
  })

  it('gerçek değeri birebir taşır', () => {
    assert.equal(protokolNoGorunum('2026-000123'), '2026-000123')
  })
})

// ---------------------------------------------------------------------------------------------
// Concurrency proof against a REAL Postgres (not mocked). Skips cleanly with no DB configured.
// ---------------------------------------------------------------------------------------------
const DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

type PgSonuc = { rows: { no: string }[] }

describe('protokol_no_ata — eşzamanlılık (gerçek Postgres)', { skip: !DB_URL }, () => {
  it('N eşzamanlı çağrı, aynı kapsam: sıfır çakışma, yoğun ve boşluksuz sıra', async () => {
    const pg = await import('pg')
    const pool = new pg.default.Pool({ connectionString: DB_URL, max: 20 })
    try {
      const scopeId = `test-${Date.now()}-${Math.random().toString(16).slice(2)}`
      // uuid formatına uymak için sabit bir test UUID'si + farklı yıl kullanılır (çakışma riski yok)
      const uuid = '99999999-9999-9999-9999-999999999999'
      const yil = 2900 + Math.floor(Math.random() * 90) // gerçek verilerle hiç kesişmeyen bir yıl aralığı
      const N = 150
      const sonuclar = await Promise.all(
        Array.from({ length: N }, () => pool.query('SELECT protokol_no_ata($1, $2, $3) AS no', ['doctor', uuid, yil]).then((r) => (r as PgSonuc).rows[0].no))
      )
      const tekil = new Set(sonuclar)
      assert.equal(tekil.size, N, `beklenen ${N} tekil numara, ${tekil.size} bulundu (çakışma var!) [${scopeId}]`)
      const sayilar = sonuclar.map((s) => parseInt(s.split('-')[1], 10)).sort((a, b) => a - b)
      assert.deepEqual(sayilar, Array.from({ length: N }, (_, i) => i + 1))
    } finally {
      await pool.end()
    }
  })

  it('iki FARKLI kapsam eşzamanlı çalışırken birbirini etkilemez ve AYNI numarayı bağımsız üretebilir', async () => {
    const pg = await import('pg')
    const pool = new pg.default.Pool({ connectionString: DB_URL, max: 20 })
    try {
      const yil = 2990 + Math.floor(Math.random() * 9)
      const scopeA = '88888888-8888-8888-8888-888888888881'
      const scopeB = '88888888-8888-8888-8888-888888888882'
      const N = 50
      const [sonucA, sonucB] = await Promise.all([
        Promise.all(Array.from({ length: N }, () => pool.query('SELECT protokol_no_ata($1, $2, $3) AS no', ['doctor', scopeA, yil]).then((r) => (r as PgSonuc).rows[0].no))),
        Promise.all(Array.from({ length: N }, () => pool.query('SELECT protokol_no_ata($1, $2, $3) AS no', ['doctor', scopeB, yil]).then((r) => (r as PgSonuc).rows[0].no))),
      ])
      assert.equal(new Set(sonucA).size, N)
      assert.equal(new Set(sonucB).size, N)
      // Spec (verbatim): "different clinics/doctors can reuse the same number independently."
      const ortak = sonucA.filter((x) => sonucB.includes(x))
      assert.ok(ortak.length > 0, 'iki farklı kapsamın aynı numarayı bağımsız üretebilmesi beklenir')
    } finally {
      await pool.end()
    }
  })
})
