// NOTYA-PROTOKOL-NO-01: `pg` ships its own types in recent versions, but this repo has no
// @types/pg and the installed copy's ESM entry isn't picked up by `moduleResolution: bundler`
// here — minimal local shape for the one thing lib/doktor/protokolNo.test.ts uses it for
// (same pattern as lib/gelenBelgeler/heic-convert.d.ts).
declare module 'pg' {
  export class Pool {
    constructor(config?: { connectionString?: string; max?: number; ssl?: boolean | { rejectUnauthorized: boolean } })
    query(sql: string, args?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>
    end(): Promise<void>
  }
  const pg: { Pool: typeof Pool }
  export default pg
}
