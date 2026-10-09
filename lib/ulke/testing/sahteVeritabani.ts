/**
 * NOTYA-UZ-MUAYENE-01 — stand-in for a country's Supabase project in tests: auth, tables, storage. TEST CODE.
 *
 * An in-memory database that understands exactly the query methods the application's server code uses and THROWS
 * on any other — an unknown filter cannot be swallowed and turn a broken ownership check into a green test
 * (same rule as lib/security/testing/sahteSupabase.ts). Every query is recorded, so a test can prove that a read
 * of a patient table carried the doctor's id.
 *
 * SHARED DATABASE (NOTYA-ULKE-SABLON-01). Every table here is a COUNTRY table, and the stand-in holds the rule the
 * real tables hold with `ulke text not null`: a statement that does not carry the country THROWS — a select, update
 * or delete without `ulke = …`, an insert or upsert whose row has no `ulke`, a function called without `p_ulke`.
 * So every one of the country tests also proves that the statement it exercised was bound to the build's country.
 * Rows of ANOTHER country can sit in the same tables (a test seeds them directly with `tablo(…).push`): the
 * application must behave as if they were not there.
 *
 * Synthetic data only.
 */
export type Satir = Record<string, unknown>
export type SahteHesap = { id: string; email: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
/** `ulke`: the country the statement was bound to (its `ulke = …` filter, the `ulke` of the row it wrote, or `p_ulke`). */
export type SorguKaydi = { tablo: string; islem: string; filtreler: string[]; ulke: string }

/**
 * THE ONE TABLE OF TÜRKİYE a country build is known to write to, through shared infrastructure it does not own:
 * the model gateway's usage log (lib/ai/kullanim.ts — task, model, token counts, the account's id; no patient data).
 * It has no `ulke` column. Listed in docs/COUNTRY-PACK-DB-ROLLOUT.md; lib/ulke/ulkeVeritabani.test.ts proves it is the
 * only one. Every other table name reaching this stand-in is held to the country rule.
 */
export const ORTAK_ALTYAPI_TABLOLARI: readonly string[] = ['ai_token_kullanim']

/** The country a statement names, or a thrown error: no statement reaches a country table without one. */
function ulkeyiBul(ad: string, islem: string, filtreler: string[], yuk: Satir | Satir[] | null): string {
  if (ORTAK_ALTYAPI_TABLOLARI.includes(ad)) return ''
  if (islem === 'insert' || islem === 'upsert') {
    const ulkeler = [...new Set((Array.isArray(yuk) ? yuk : [yuk ?? {}]).map((y) => y.ulke))]
    if (ulkeler.length !== 1 || typeof ulkeler[0] !== 'string' || !/^[a-z]{2}$/.test(ulkeler[0])) throw new Error(`stand-in database: ${islem} on ${ad} without the country (ulke) on the row`)
    return ulkeler[0]
  }
  const f = filtreler.find((x) => x.startsWith('ulke=eq.'))
  if (!f || !/^[a-z]{2}$/.test(f.slice(8))) throw new Error(`stand-in database: ${islem} on ${ad} without a country filter (ulke = …)`)
  if (islem === 'update' && yuk && !Array.isArray(yuk) && 'ulke' in yuk) throw new Error(`stand-in database: update on ${ad} rewrites the country of a row`)
  return f.slice(8)
}

let sayac = 0
const yeniId = () => `90000000-0000-4000-8000-${String(++sayac).padStart(12, '0')}`

export function sahteVeritabani() {
  const tablolar: Record<string, Satir[]> = {}
  const hesaplar: Record<string, SahteHesap> = {}
  const depo = new Map<string, Blob>()
  const sorgular: SorguKaydi[] = []
  /** Table name → make the next write (or read) on it fail. */
  const boz: { yaz: Set<string>; oku: Set<string> } = { yaz: new Set(), oku: new Set() }
  const tablo = (ad: string) => (tablolar[ad] ??= [])

  /**
   * NOTYA-UZ-RANDEVU-01 — the EXCLUSION CONSTRAINT of migration 135 (`ulke_randevulari_cakisma_yok`): two appointments
   * of one doctor that still hold their time (planned, arrived, done) may not overlap. Checked inside the statement,
   * as the database does, and answered with PostgreSQL's own code — so a test of "two requests at the same moment"
   * is decided here, not by the application's earlier read.
   */
  /** Tables whose key is not a generated `id` (their key is the account, the patient, the visit or the note). */
  const KIMLIKSIZ = new Set(['hasta_ulke_bilgisi', 'hekim_dil_tercihleri', 'hekim_rolu', 'muayene_dil_kaydi', 'not_dil_kaydi', 'hekim_calisma_duzeni', 'ulke_kullanim'])
  const YER_TUTAN = ['planlandi', 'geldi', 'tamamlandi']
  const cakisma = (ad: string, yeni: Satir, digerleri: Satir[]): { message: string; code: string } | null => {
    if (ad !== 'ulke_randevulari' || !YER_TUTAN.includes(String(yeni.durum ?? 'planlandi'))) return null
    const cakisan = digerleri.some((s) => s.doctor_id === yeni.doctor_id && YER_TUTAN.includes(String(s.durum ?? 'planlandi')) && String(s.baslangic) < String(yeni.bitis) && String(s.bitis) > String(yeni.baslangic))
    return cakisan ? { message: 'conflicting key value violates exclusion constraint "ulke_randevulari_cakisma_yok"', code: '23P01' } : null
  }

  /**
   * NOTYA-UZ-RANDEVU-01 — database FUNCTIONS, by name. Each is this file's statement-by-statement copy of the SQL in
   * its migration, run as ONE TRANSACTION: the tables are copied first and put back if any statement fails or the
   * function raises. `boz.yaz` makes a statement on that table fail in the MIDDLE of a function, which is how a test
   * proves "all or nothing". An unknown function name is an error, never a silent success.
   */
  type IslevCevabi = { data: unknown; error: { message: string; code?: string } | null }
  const islevCagrilari: { ad: string; arg: Satir }[] = []
  const islevler: Record<string, (a: Satir) => unknown> = {
    // lib/db/migrations/135_ulke_randevu.sql — ulke_not_onayla. Every statement carries `p_ulke`, as in the SQL.
    ulke_not_onayla: (a) => {
      const yaz = (ad: string) => { if (boz.yaz.has(ad)) throw Object.assign(new Error(`stand-in: ${ad} update failed inside the function`), { code: 'XX000' }) }
      const not = tablo('ulke_notlar').find((n) => n.id === a.p_note_id && n.doctor_id === a.p_doctor_id && n.ulke === a.p_ulke)
      if (!not) return 'NOT_FOUND'
      if (not.approved_at) return 'ONAYLI'
      yaz('ulke_notlar')
      Object.assign(not, { content_subjektif: a.p_s, content_objektif: a.p_o, content_degerlendirme: a.p_a, content_plan: a.p_p, approved_at: a.p_onay_ani, approved_by: a.p_doctor_id })
      const k = a.p_dil_kaydi as Satir | null | undefined
      if (k) {
        yaz('not_dil_kaydi')
        const d = tablo('not_dil_kaydi').find((x) => x.note_id === a.p_note_id && x.doctor_id === a.p_doctor_id && x.ulke === a.p_ulke)
        if (!d) throw Object.assign(new Error('ulke_not_onayla: not_dil_kaydi row missing'), { code: 'P0002' })
        for (const kolon of ['alanlar', 'ikinci_alanlar', 'not_dili', 'ikinci_dil', 'ikinci_s', 'ikinci_o', 'ikinci_a', 'ikinci_p']) if (Object.prototype.hasOwnProperty.call(k, kolon)) d[kolon] = k[kolon] ?? null
        d.updated_at = a.p_onay_ani
      }
      const bagli = tablo('ulke_randevulari').filter((r) => r.session_id === not.session_id && r.doctor_id === a.p_doctor_id && r.ulke === a.p_ulke && ['planlandi', 'geldi'].includes(String(r.durum)))
      if (bagli.length) yaz('ulke_randevulari')
      for (const r of bagli) Object.assign(r, { durum: 'tamamlandi', updated_at: a.p_onay_ani })
      return 'TAMAM'
    },
  }
  const rpc = async (ad: string, arg: Satir = {}): Promise<IslevCevabi> => {
    const islev = islevler[ad]
    if (!islev) throw new Error(`stand-in database: function ${ad} is not implemented`)
    if (typeof arg.p_ulke !== 'string' || !/^[a-z]{2}$/.test(arg.p_ulke)) throw new Error(`stand-in database: function ${ad} called without the country (p_ulke)`)
    islevCagrilari.push({ ad, arg })
    sorgular.push({ tablo: `rpc:${ad}`, islem: 'rpc', filtreler: [], ulke: arg.p_ulke })
    const yedek = JSON.stringify(tablolar)
    try {
      return { data: islev(JSON.parse(JSON.stringify(arg)) as Satir), error: null }
    } catch (e) {
      // ROLLBACK: every table is exactly as it was before the function began.
      const eski = JSON.parse(yedek) as Record<string, Satir[]>
      for (const k of Object.keys(tablolar)) delete tablolar[k]
      Object.assign(tablolar, eski)
      return { data: null, error: { message: e instanceof Error ? e.message : 'function failed', code: (e as { code?: string }).code ?? 'XX000' } }
    }
  }

  class Sorgu implements PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }> {
    private filtreler: { ad: string; f: (s: Satir) => boolean }[] = []
    private islem: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
    private yuk: Satir | Satir[] | null = null
    private catisma = 'id'
    private tek: 'single' | 'maybe' | null = null
    private sira: { kolon: string; artan: boolean } | null = null
    private sinir: number | null = null
    private donus = false
    constructor(private ad: string) {}

    select(_kolonlar?: string) { if (this.islem !== 'select') this.donus = true; return this }
    insert(yuk: Satir | Satir[]) { this.islem = 'insert'; this.yuk = yuk; return this }
    update(yuk: Satir) { this.islem = 'update'; this.yuk = yuk; return this }
    upsert(yuk: Satir, s?: { onConflict?: string }) { this.islem = 'upsert'; this.yuk = yuk; this.catisma = s?.onConflict ?? 'id'; return this }
    delete() { this.islem = 'delete'; return this }
    eq(k: string, v: unknown) { this.filtreler.push({ ad: `${k}=eq.${String(v)}`, f: (s) => s[k] === v }); return this }
    in(k: string, v: unknown[]) { this.filtreler.push({ ad: `${k}=in.(${v.join(',')})`, f: (s) => v.includes(s[k]) }); return this }
    neq(k: string, v: unknown) { this.filtreler.push({ ad: `${k}=neq.${String(v)}`, f: (s) => s[k] !== v }); return this }
    lt(k: string, v: string) { this.filtreler.push({ ad: `${k}=lt.${v}`, f: (s) => String(s[k] ?? '') < v }); return this }
    gt(k: string, v: string) { this.filtreler.push({ ad: `${k}=gt.${v}`, f: (s) => String(s[k] ?? '') > v }); return this }
    gte(k: string, v: string) { this.filtreler.push({ ad: `${k}=gte.${v}`, f: (s) => String(s[k] ?? '') >= v }); return this }
    is(k: string, v: null) { this.filtreler.push({ ad: `${k}=is.null`, f: (s) => (s[k] ?? null) === v }); return this }
    not(k: string, op: 'is', v: null) {
      if (op !== 'is' || v !== null) throw new Error(`stand-in database: not(${k}, ${op}, ${String(v)}) is not implemented`)
      this.filtreler.push({ ad: `${k}=not.is.null`, f: (s) => (s[k] ?? null) !== null }); return this
    }
    order(kolon: string, s?: { ascending?: boolean }) { this.sira = { kolon, artan: s?.ascending !== false }; return this }
    limit(n: number) { this.sinir = n; return this }
    single() { this.tek = 'single'; return this }
    maybeSingle() { this.tek = 'maybe'; return this }

    private calistir(): { data: unknown; error: { message: string; code?: string } | null } {
      const filtreAdlari = this.filtreler.map((f) => f.ad)
      sorgular.push({ tablo: this.ad, islem: this.islem, filtreler: filtreAdlari, ulke: ulkeyiBul(this.ad, this.islem, filtreAdlari, this.yuk) })
      const satirlar = tablo(this.ad)
      const uyan = (s: Satir) => this.filtreler.every((f) => f.f(s))
      const yazma = this.islem !== 'select'
      if ((yazma ? boz.yaz : boz.oku).has(this.ad)) return { data: null, error: { message: `stand-in: ${this.ad} ${this.islem} failed`, code: 'XX000' } }
      let sonuc: Satir[]
      if (this.islem === 'select') sonuc = satirlar.filter(uyan)
      else if (this.islem === 'insert') {
        sonuc = (Array.isArray(this.yuk) ? this.yuk : [this.yuk!]).map((y) => ({ ...(KIMLIKSIZ.has(this.ad) ? {} : { id: yeniId() }), created_at: new Date().toISOString(), ...(this.ad === 'ulke_muayeneler' ? { started_at: new Date().toISOString() } : {}), ...y }))
        for (const y of sonuc) { const c = cakisma(this.ad, y, satirlar); if (c) return { data: null, error: c } }
        satirlar.push(...sonuc)
      } else if (this.islem === 'upsert') {
        const y = this.yuk as Satir
        const anahtarlar = this.catisma.split(',').map((k) => k.trim())
        const var_ = satirlar.find((s) => anahtarlar.every((k) => s[k] === y[k]))
        if (var_) { Object.assign(var_, y); sonuc = [var_] } else { const yeni = { created_at: new Date().toISOString(), ...y }; satirlar.push(yeni); sonuc = [yeni] }
      } else if (this.islem === 'update') {
        if (!this.filtreler.length) throw new Error(`stand-in database: update on ${this.ad} without a filter`)
        sonuc = satirlar.filter(uyan)
        // A constraint is checked on the row as it WOULD be; a refused statement changes nothing.
        for (const s of sonuc) { const c = cakisma(this.ad, { ...s, ...this.yuk }, satirlar.filter((x) => x !== s)); if (c) return { data: null, error: c } }
        for (const s of sonuc) Object.assign(s, this.yuk)
      } else {
        if (!this.filtreler.length) throw new Error(`stand-in database: delete on ${this.ad} without a filter`)
        sonuc = satirlar.filter(uyan)
        tablolar[this.ad] = satirlar.filter((s) => !uyan(s))
      }
      if (this.sira) {
        const { kolon, artan } = this.sira
        sonuc = [...sonuc].sort((a, b) => (String(a[kolon] ?? '') < String(b[kolon] ?? '') ? -1 : String(a[kolon] ?? '') > String(b[kolon] ?? '') ? 1 : 0) * (artan ? 1 : -1))
      }
      if (this.sinir !== null) sonuc = sonuc.slice(0, this.sinir)
      const kopya = sonuc.map((s) => ({ ...s }))
      if (this.tek === 'single') return kopya.length === 1 ? { data: kopya[0], error: null } : { data: null, error: { message: 'no rows', code: 'PGRST116' } }
      if (this.tek === 'maybe') return kopya.length > 1 ? { data: null, error: { message: 'multiple rows', code: 'PGRST116' } } : { data: kopya[0] ?? null, error: null }
      return { data: yazma && !this.donus ? null : kopya, error: null }
    }
    then<A = { data: unknown; error: { message: string; code?: string } | null }, B = never>(tamam?: ((d: { data: unknown; error: { message: string; code?: string } | null }) => A | PromiseLike<A>) | null, hata?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
      return new Promise<{ data: unknown; error: { message: string; code?: string } | null }>((coz, ret) => { try { coz(this.calistir()) } catch (e) { ret(e) } }).then(tamam, hata)
    }
  }

  const createClient = () => ({
    auth: {
      getUser: async (jwt?: string) => {
        const u = jwt ? hesaplar[jwt] : undefined
        return u ? { data: { user: { user_metadata: {}, app_metadata: {}, ...u } }, error: null } : { data: { user: null }, error: { message: 'invalid JWT' } }
      },
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: (ad: string) => new Sorgu(ad),
    rpc,
    storage: {
      from: (kova: string) => ({
        download: async (yol: string) => {
          const b = depo.get(`${kova}/${yol}`)
          return b ? { data: b, error: null } : { data: null, error: { message: 'not found' } }
        },
        remove: async (yollar: string[]) => { for (const y of yollar) depo.delete(`${kova}/${y}`); return { data: null, error: null } },
      }),
    },
  })

  return { tablolar, tablo, hesaplar, depo, sorgular, boz, islevCagrilari, createClient }
}
