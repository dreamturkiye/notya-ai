/**
 * NOTYA-UZ-MUAYENE-01 — stand-in for a country's Supabase project in tests: auth, tables, storage. TEST CODE.
 *
 * An in-memory database that understands exactly the query methods the application's server code uses and THROWS
 * on any other — an unknown filter cannot be swallowed and turn a broken ownership check into a green test
 * (same rule as lib/security/testing/sahteSupabase.ts). Every query is recorded, so a test can prove that a read
 * of a patient table carried the doctor's id.
 *
 * Synthetic data only.
 */
export type Satir = Record<string, unknown>
export type SahteHesap = { id: string; email: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
export type SorguKaydi = { tablo: string; islem: string; filtreler: string[] }

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
    // lib/db/migrations/135_ulke_randevu.sql — ulke_not_onayla
    ulke_not_onayla: (a) => {
      const yaz = (ad: string) => { if (boz.yaz.has(ad)) throw Object.assign(new Error(`stand-in: ${ad} update failed inside the function`), { code: 'XX000' }) }
      const not = tablo('notes').find((n) => n.id === a.p_note_id && n.doctor_id === a.p_doctor_id)
      if (!not) return 'NOT_FOUND'
      if (not.approved_at) return 'ONAYLI'
      yaz('notes')
      Object.assign(not, { content_subjektif: a.p_s, content_objektif: a.p_o, content_degerlendirme: a.p_a, content_plan: a.p_p, approved_at: a.p_onay_ani, approved_by: a.p_doctor_id })
      const k = a.p_dil_kaydi as Satir | null | undefined
      if (k) {
        yaz('not_dil_kaydi')
        const d = tablo('not_dil_kaydi').find((x) => x.note_id === a.p_note_id && x.doctor_id === a.p_doctor_id)
        if (!d) throw Object.assign(new Error('ulke_not_onayla: not_dil_kaydi row missing'), { code: 'P0002' })
        for (const kolon of ['alanlar', 'ikinci_alanlar', 'not_dili', 'ikinci_dil', 'ikinci_s', 'ikinci_o', 'ikinci_a', 'ikinci_p']) if (Object.prototype.hasOwnProperty.call(k, kolon)) d[kolon] = k[kolon] ?? null
        d.updated_at = a.p_onay_ani
      }
      const bagli = tablo('ulke_randevulari').filter((r) => r.session_id === not.session_id && r.doctor_id === a.p_doctor_id && ['planlandi', 'geldi'].includes(String(r.durum)))
      if (bagli.length) yaz('ulke_randevulari')
      for (const r of bagli) Object.assign(r, { durum: 'tamamlandi', updated_at: a.p_onay_ani })
      return 'TAMAM'
    },
  }
  const rpc = async (ad: string, arg: Satir = {}): Promise<IslevCevabi> => {
    const islev = islevler[ad]
    if (!islev) throw new Error(`stand-in database: function ${ad} is not implemented`)
    islevCagrilari.push({ ad, arg })
    sorgular.push({ tablo: `rpc:${ad}`, islem: 'rpc', filtreler: [] })
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
      sorgular.push({ tablo: this.ad, islem: this.islem, filtreler: this.filtreler.map((f) => f.ad) })
      const satirlar = tablo(this.ad)
      const uyan = (s: Satir) => this.filtreler.every((f) => f.f(s))
      const yazma = this.islem !== 'select'
      if ((yazma ? boz.yaz : boz.oku).has(this.ad)) return { data: null, error: { message: `stand-in: ${this.ad} ${this.islem} failed`, code: 'XX000' } }
      let sonuc: Satir[]
      if (this.islem === 'select') sonuc = satirlar.filter(uyan)
      else if (this.islem === 'insert') {
        sonuc = (Array.isArray(this.yuk) ? this.yuk : [this.yuk!]).map((y) => ({ ...(this.ad === 'hasta_ulke_bilgisi' || this.ad === 'hekim_dil_tercihleri' || this.ad === 'hekim_rolu' || this.ad === 'muayene_dil_kaydi' || this.ad === 'not_dil_kaydi' || this.ad === 'hekim_calisma_duzeni' ? {} : { id: yeniId() }), created_at: new Date().toISOString(), ...(this.ad === 'sessions' ? { started_at: new Date().toISOString() } : {}), ...y }))
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
