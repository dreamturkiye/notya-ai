/**
 * HASTA-IZOLASYON-01 — in-memory Supabase stand-in for lib/security/hasta-izolasyon.test.ts.
 *
 * Real route handlers run against this; only the database, auth and storage are fake. It implements
 * the PostgREST subset the routes use (eq/neq/gt/gte/lt/lte/in/is/not/like/ilike, order, limit,
 * range, single/maybeSingle, insert/update/upsert/delete, count/head, embedded relations incl.
 * `!inner` and `rel.col` filters). RLS is NOT emulated on purpose: every server route uses the
 * service-role client, so isolation must hold in application code — which is what the suite tests.
 *
 * Any builder method it does not implement THROWS. An unknown filter must never be silently ignored:
 * that could widen or narrow a result and turn a real leak into a false green.
 *
 * Synthetic data only — never load real patient rows into this.
 */
import { randomUUID } from 'node:crypto'

export type Satir = Record<string, any>

const tekil = (ad: string) => (ad.endsWith('s') ? ad.slice(0, -1) : ad)

type Gomme = { ad: string; inner: boolean; alt: Gomme[] }

/** "id, notes(id, x), sessions!inner(patient_id)" → embeds (columns are not projected: full rows are returned). */
function gommeleriCoz(secim: string): Gomme[] {
  const parcalar: string[] = []
  let derinlik = 0, bas = 0
  for (let i = 0; i < secim.length; i++) {
    const c = secim[i]
    if (c === '(') derinlik++
    else if (c === ')') derinlik--
    else if (c === ',' && derinlik === 0) { parcalar.push(secim.slice(bas, i)); bas = i + 1 }
  }
  parcalar.push(secim.slice(bas))
  const out: Gomme[] = []
  for (const ham of parcalar.map((p) => p.trim()).filter(Boolean)) {
    const m = ham.match(/^(?:\w+:)?(\w+)(!inner)?\s*\(([\s\S]*)\)$/)
    if (m) out.push({ ad: m[1], inner: !!m[2], alt: gommeleriCoz(m[3]) })
  }
  return out
}

function esit(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  return String(a) === String(b)
}
function karsilastir(a: unknown, b: unknown): number {
  const na = Number(a), nb = Number(b)
  if (a != null && b != null && a !== '' && b !== '' && Number.isFinite(na) && Number.isFinite(nb)) return na - nb
  return String(a ?? '').localeCompare(String(b ?? ''))
}
function likeRegex(desen: string, i: boolean) {
  const kacis = desen.split('').map((c) => (c === '%' ? '[\\s\\S]*' : c === '_' ? '[\\s\\S]' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('')
  return new RegExp(`^${kacis}$`, i ? 'i' : '')
}

type Kosul = { kolon: string; test: (v: unknown) => boolean }

export class SahteVeritabani {
  tablolar = new Map<string, Satir[]>()
  depolama = new Map<string, Map<string, unknown>>()
  /** Every storage read, as "bucket/path" — lets a test prove a foreign file was never opened. */
  depolamaOkumalari: string[] = []
  kullanicilar = new Map<string, { id: string; email?: string }>()
  bloblar = new Map<string, string>()

  tablo(ad: string): Satir[] {
    if (!this.tablolar.has(ad)) this.tablolar.set(ad, [])
    return this.tablolar.get(ad)!
  }
  ekle(ad: string, satir: Satir): Satir {
    const r = { id: randomUUID(), created_at: new Date().toISOString(), ...satir }
    this.tablo(ad).push(r)
    return r
  }
  dosyaKoy(kova: string, yol: string, veri: unknown) {
    if (!this.depolama.has(kova)) this.depolama.set(kova, new Map())
    this.depolama.get(kova)!.set(yol, veri)
  }

  /** What `createClient(url, key, opts)` returns. A user JWT in opts.global.headers is honoured by auth.getUser(). */
  istemci(opts?: { global?: { headers?: Record<string, string> } }) {
    const db = this
    const baslikToken = String(opts?.global?.headers?.Authorization || opts?.global?.headers?.authorization || '').replace(/^Bearer\s+/i, '')
    return {
      from: (t: string) => new Sorgu(db, t).vekil(),
      auth: {
        getUser: async (jwt?: string) => {
          const u = db.kullanicilar.get(jwt ?? baslikToken)
          return u
            ? { data: { user: { id: u.id, email: u.email, user_metadata: {} } }, error: null }
            : { data: { user: null }, error: { message: 'invalid JWT' } }
        },
        admin: { updateUserById: async () => ({ data: null, error: null }) },
      },
      storage: {
        from: (kova: string) => ({
          upload: async (yol: string, veri: unknown) => { db.dosyaKoy(kova, yol, veri); return { data: { path: yol }, error: null } },
          download: async (yol: string) => {
            db.depolamaOkumalari.push(`${kova}/${yol}`)
            const v = db.depolama.get(kova)?.get(yol)
            return v === undefined ? { data: null, error: { message: 'Object not found' } } : { data: v, error: null }
          },
          remove: async (yollar: string[]) => { for (const y of yollar) db.depolama.get(kova)?.delete(y); return { data: null, error: null } },
          getPublicUrl: (yol: string) => ({ data: { publicUrl: `https://sahte.supabase.test/storage/v1/object/public/${kova}/${yol}` } }),
        }),
      },
      rpc: async (ad: string, args: Record<string, string>) => {
        if (ad === 'vault_put_blob') { db.bloblar.set(args.p_document_id, args.p_ciphertext_b64); return { data: null, error: null } }
        if (ad === 'vault_get_blob') { const v = db.bloblar.get(args.p_document_id); return { data: v ?? null, error: v ? null : { message: 'missing' } } }
        throw new Error(`[sahteSupabase] desteklenmeyen rpc: ${ad}`)
      },
    }
  }
}

class Sorgu {
  private islem: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private dondur = false
  private secim = '*'
  private sayim: { head: boolean } | null = null
  private yuk: Satir[] = []
  private guncelleme: Satir = {}
  private cakisma: string[] = ['id']
  private kosullar: Kosul[] = []
  private siralar: { kolon: string; artan: boolean }[] = []
  private sinir: number | null = null
  private aralik: [number, number] | null = null
  private tek: 'single' | 'maybe' | null = null

  constructor(private db: SahteVeritabani, private ad: string) {}

  /** Proxy: any method this fake does not implement fails loudly instead of being ignored. */
  vekil(): any {
    return new Proxy(this, {
      get: (hedef, ozellik) => {
        if (ozellik === 'then') return hedef.then.bind(hedef)
        const v = (hedef as any)[ozellik]
        if (typeof v === 'function') return (...a: unknown[]) => { const r = v.apply(hedef, a); return r === hedef ? hedef.vekil() : r }
        if (typeof ozellik === 'string' && !(ozellik in hedef)) throw new Error(`[sahteSupabase] desteklenmeyen sorgu yöntemi: .${ozellik}() (${hedef.ad})`)
        return v
      },
    })
  }

  select(secim = '*', o?: { count?: string; head?: boolean }) {
    if (this.islem === 'select') this.secim = secim || '*'
    else { this.dondur = true; this.secim = secim || '*' }
    if (o?.count) this.sayim = { head: !!o.head }
    return this
  }
  insert(y: Satir | Satir[]) { this.islem = 'insert'; this.yuk = Array.isArray(y) ? y : [y]; return this }
  upsert(y: Satir | Satir[], o?: { onConflict?: string }) {
    this.islem = 'upsert'; this.yuk = Array.isArray(y) ? y : [y]
    if (o?.onConflict) this.cakisma = o.onConflict.split(',').map((s) => s.trim())
    return this
  }
  update(g: Satir) { this.islem = 'update'; this.guncelleme = g; return this }
  delete() { this.islem = 'delete'; return this }

  private kosul(kolon: string, test: (v: unknown) => boolean) { this.kosullar.push({ kolon, test }); return this }
  eq(k: string, d: unknown) { return this.kosul(k, (v) => esit(v, d)) }
  neq(k: string, d: unknown) { return this.kosul(k, (v) => !esit(v, d)) }
  gt(k: string, d: unknown) { return this.kosul(k, (v) => v != null && karsilastir(v, d) > 0) }
  gte(k: string, d: unknown) { return this.kosul(k, (v) => v != null && karsilastir(v, d) >= 0) }
  lt(k: string, d: unknown) { return this.kosul(k, (v) => v != null && karsilastir(v, d) < 0) }
  lte(k: string, d: unknown) { return this.kosul(k, (v) => v != null && karsilastir(v, d) <= 0) }
  in(k: string, d: unknown[]) { return this.kosul(k, (v) => (d || []).some((x) => esit(v, x))) }
  is(k: string, d: unknown) { return this.kosul(k, (v) => (d === null ? v == null : v === d)) }
  like(k: string, d: string) { const r = likeRegex(d, false); return this.kosul(k, (v) => v != null && r.test(String(v))) }
  ilike(k: string, d: string) { const r = likeRegex(d, true); return this.kosul(k, (v) => v != null && r.test(String(v))) }
  not(k: string, op: string, d: unknown) {
    if (op === 'is') return this.kosul(k, (v) => (d === null ? v != null : v !== d))
    if (op === 'eq') return this.kosul(k, (v) => !esit(v, d))
    if (op === 'in') {
      const liste = String(d).replace(/^\(|\)$/g, '').split(',').map((s) => s.trim().replace(/^"|"$/g, ''))
      return this.kosul(k, (v) => !liste.some((x) => esit(v, x)))
    }
    throw new Error(`[sahteSupabase] desteklenmeyen .not(${k}, ${op})`)
  }
  order(kolon: string, o?: { ascending?: boolean }) { this.siralar.push({ kolon, artan: o?.ascending !== false }); return this }
  limit(n: number) { this.sinir = n; return this }
  range(a: number, b: number) { this.aralik = [a, b]; return this }
  single() { this.tek = 'single'; return this }
  maybeSingle() { this.tek = 'maybe'; return this }

  then(coz: (v: unknown) => unknown, red?: (e: unknown) => unknown) {
    return Promise.resolve().then(() => this.calistir()).then(coz, red)
  }

  /** Embeds relation `g` onto row `r` of table `tabloAd`; returns the embedded value (object, array or null). */
  private gom(tabloAd: string, r: Satir, g: Gomme): unknown {
    const fk = `${tekil(g.ad)}_id`
    const hedefSatirlar = this.db.tablo(g.ad)
    if (fk in r) {
      const e = hedefSatirlar.find((x) => esit(x.id, r[fk]))
      return e ? this.gommeleriUygula(g.ad, { ...e }, g.alt) : null
    }
    const geriFk = `${tekil(tabloAd)}_id`
    return hedefSatirlar.filter((x) => esit(x[geriFk], r.id)).map((x) => this.gommeleriUygula(g.ad, { ...x }, g.alt))
  }
  private gommeleriUygula(tabloAd: string, r: Satir, gommeler: Gomme[]): Satir {
    for (const g of gommeler) r[g.ad] = this.gom(tabloAd, r, g)
    return r
  }

  private eslesir(r: Satir, gommeler: Gomme[]): boolean {
    for (const k of this.kosullar) {
      const nokta = k.kolon.indexOf('.')
      if (nokta < 0) { if (!k.test(r[k.kolon])) return false; continue }
      const rel = k.kolon.slice(0, nokta), kolon = k.kolon.slice(nokta + 1)
      const g = gommeler.find((x) => x.ad === rel)
      if (!g) throw new Error(`[sahteSupabase] ${this.ad}: '${k.kolon}' filtresi gömülü '${rel}' olmadan kullanıldı`)
      const deger = r[rel]
      const liste = Array.isArray(deger) ? deger : deger ? [deger] : []
      const kalan = liste.filter((x: Satir) => k.test(x[kolon]))
      if (g.inner) { if (!kalan.length) return false; r[rel] = Array.isArray(deger) ? kalan : kalan[0] }
      else r[rel] = Array.isArray(deger) ? kalan : kalan[0] ?? null
    }
    for (const g of gommeler) if (g.inner && (r[g.ad] == null || (Array.isArray(r[g.ad]) && !r[g.ad].length))) return false
    return true
  }

  private calistir(): { data: unknown; error: unknown; count?: number | null } {
    const tablo = this.db.tablo(this.ad)
    const gommeler = gommeleriCoz(this.secim)

    if (this.islem === 'insert' || this.islem === 'upsert') {
      const yazilan: Satir[] = []
      for (const y of this.yuk) {
        if (this.islem === 'upsert') {
          const mevcut = tablo.find((r) => this.cakisma.every((c) => y[c] !== undefined && esit(r[c], y[c])))
          if (mevcut) { Object.assign(mevcut, y); yazilan.push(mevcut); continue }
        }
        const r = { id: randomUUID(), created_at: new Date().toISOString(), ...y }
        tablo.push(r); yazilan.push(r)
      }
      return this.sonuc(this.dondur ? yazilan.map((r) => this.gommeleriUygula(this.ad, { ...r }, gommeler)) : null)
    }

    const eslesen = tablo.filter((r) => this.eslesir(this.gommeleriUygula(this.ad, { ...r }, gommeler), gommeler))
    if (this.islem === 'update') {
      for (const r of eslesen) Object.assign(r, this.guncelleme)
      return this.sonuc(this.dondur ? eslesen.map((r) => ({ ...r })) : null)
    }
    if (this.islem === 'delete') {
      for (const r of eslesen) tablo.splice(tablo.indexOf(r), 1)
      return this.sonuc(this.dondur ? eslesen : null)
    }

    let satirlar = tablo
      .map((r) => this.gommeleriUygula(this.ad, { ...r }, gommeler))
      .filter((r) => this.eslesir(r, gommeler))
    for (const s of [...this.siralar].reverse()) satirlar.sort((a, b) => (s.artan ? 1 : -1) * karsilastir(a[s.kolon], b[s.kolon]))
    const toplam = satirlar.length
    if (this.aralik) satirlar = satirlar.slice(this.aralik[0], this.aralik[1] + 1)
    if (this.sinir != null) satirlar = satirlar.slice(0, this.sinir)
    if (this.sayim) return { data: this.sayim.head ? null : satirlar, error: null, count: toplam }
    return this.sonuc(satirlar)
  }

  private sonuc(satirlar: Satir[] | null) {
    if (!this.tek) return { data: satirlar, error: null }
    const liste = satirlar || []
    if (liste.length > 1) return { data: null, error: { code: 'PGRST116', message: 'multiple rows returned' } }
    if (!liste.length) return this.tek === 'single' ? { data: null, error: { code: 'PGRST116', message: 'no rows returned' } } : { data: null, error: null }
    return { data: liste[0], error: null }
  }
}
