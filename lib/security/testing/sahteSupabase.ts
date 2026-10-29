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

/**
 * `anahtar` = the key the embed lands under on the row: the alias if one was given (`alias:rel(...)`), else the relation name.
 * `fk` = an explicit FK column hint (`notes!kaynak_note_id(...)`); default is `<singular rel>_id`.
 */
type Gomme = { ad: string; anahtar: string; inner: boolean; fk?: string; alt: Gomme[] }

/** "id, notes(id, x), sessions!inner(patient_id), a:notes!kaynak_note_id(s:sessions!inner(archived_at))" → embeds (columns are not projected: full rows are returned). */
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
    const m = ham.match(/^(?:(\w+):)?(\w+)((?:!\w+)*)\s*\(([\s\S]*)\)$/)
    if (!m) continue
    const ipuclari = m[3].split('!').filter(Boolean)
    const fk = ipuclari.find((x) => x !== 'inner')
    out.push({ ad: m[2], anahtar: m[1] || m[2], inner: ipuclari.includes('inner'), ...(fk ? { fk } : {}), alt: gommeleriCoz(m[4]) })
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
  /** NOTYA-PROTOKOL-NO-01: protokol_no_ata() in-memory stand-in state — key "scope_type:scope_id:yil" -> last number. */
  protokolSayaclari = new Map<string, number>()

  tablo(ad: string): Satir[] {
    if (!this.tablolar.has(ad)) this.tablolar.set(ad, [])
    return this.tablolar.get(ad)!
  }
  ekle(ad: string, satir: Satir): Satir {
    const r = { id: randomUUID(), created_at: new Date().toISOString(), ...satir }
    this.tablo(ad).push(r)
    return r
  }
  /**
   * SES-OMURGA-V2: stands in for the hasta_dosya_surum triggers (migration 183). The version is a hash of every row of
   * the tables the chart package reads for that patient, so ANY change — a route's write or a test mutating a row in
   * place — changes it, exactly like the trigger would bump it.
   */
  dosyaSurumu(patientId: string): number {
    const tablolar = ['patients', 'sessions', 'notes', 'hasta_ilaclar', 'asilar', 'hasta_intake_formlari', 'hasta_goruntulemeler', 'hasta_belgeler', 'belge_analizleri', 'randevular', 'lab_satirlar', 'goruntu_calisma', 'sevkler', 'mchat_testleri', 'gelisim_taramalari', 'pedi_taramalar', 'cihaz_olcumleri', 'hasta_tetkik_istemleri']
    const seanslar = new Set(this.tablo('sessions').filter((r) => r.patient_id === patientId).map((r) => r.id))
    let h = 0
    for (const t of tablolar) {
      for (const r of this.tablolar.get(t) || []) {
        const ilgili = t === 'patients' ? r.id === patientId : t === 'notes' ? seanslar.has(r.session_id) : r.patient_id === patientId
        if (!ilgili) continue
        const m = `${t}:${JSON.stringify(r)}`
        for (let i = 0; i < m.length; i++) h = (Math.imul(h, 31) + m.charCodeAt(i)) | 0
      }
    }
    return Math.abs(h)
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
          createSignedUrl: async (yol: string, sn: number) => ({ data: { signedUrl: `https://sahte.supabase.test/storage/v1/object/sign/${kova}/${yol}?token=sahte&expiresIn=${sn}` }, error: null }),
        }),
      },
      rpc: async (ad: string, args: Record<string, unknown>) => {
        if (ad === 'vault_put_blob') { db.bloblar.set(args.p_document_id as string, args.p_ciphertext_b64 as string); return { data: null, error: null } }
        if (ad === 'vault_get_blob') { const v = db.bloblar.get(args.p_document_id as string); return { data: v ?? null, error: v ? null : { message: 'missing' } } }
        // NOTYA-PROTOKOL-NO-01: mirrors protokol_no_ata() (lib/db/migrations/159_*) — an
        // in-memory counter keyed the same way (scope_type, scope_id, yil). The real atomicity
        // guarantee is Postgres's, proven separately against a live instance
        // (lib/doktor/protokolNo.test.ts); this fake only needs to return the right NEXT
        // number for each key so route-level tests exercise the real call shape.
        if (ad === 'protokol_no_ata') {
          const anahtar = `${args.p_scope_type}:${args.p_scope_id}:${args.p_yil}`
          const simdiki = (db.protokolSayaclari.get(anahtar) || 0) + 1
          db.protokolSayaclari.set(anahtar, simdiki)
          return { data: `${args.p_yil}-${String(simdiki).padStart(6, '0')}`, error: null }
        }
        // NOTYA-ASI-STOK-BARKOD-01: mirrors asi_stok_dekrement() (165_asi_stok_barkod.sql) — a single
        // UPDATE ... WHERE miktar > 0 RETURNING. The real concurrency guarantee is Postgres's row
        // lock on that statement; this fake only needs the same "never goes below 0, 0 rows if
        // already 0 or foreign doktor_id" shape so route-level tests exercise the real call.
        if (ad === 'asi_stok_dekrement') {
          const lot = db.tablo('asi_stok_lotlari').find((r) => r.id === args.p_lot_id && r.doktor_id === args.p_doktor_id && Number(r.miktar) > 0)
          if (!lot) return { data: [], error: null }
          lot.miktar = Number(lot.miktar) - 1
          lot.updated_at = new Date().toISOString()
          return { data: [lot], error: null }
        }
        // WHATSAPP-API-01: mirrors whatsapp_kota_al / whatsapp_kota_iade (169_whatsapp_cloud_api.sql) — hourly buckets
        // per doctor, a rolling 24h window (a bucket counts while its END is inside the last 24h). The real atomicity is
        // Postgres's advisory lock; this fake is single-threaded and only needs the same ok/kullanilan answer.
        if (ad === 'whatsapp_kota_al') {
          const simdi = Date.now()
          const saat = new Date(Math.floor(simdi / 3600000) * 3600000).toISOString()
          const satirlar = db.tablo('whatsapp_kota_saatlik').filter((r) => r.doctor_id === args.p_doctor && Date.parse(String(r.saat)) + 3600000 > simdi - 24 * 3600000)
          const toplam = satirlar.reduce((n, r) => n + Number(r.adet), 0)
          if (toplam >= Number(args.p_limit)) return { data: { ok: false, kullanilan: toplam }, error: null }
          const var_ = satirlar.find((r) => r.saat === saat)
          if (var_) var_.adet = Number(var_.adet) + 1
          else db.tablo('whatsapp_kota_saatlik').push({ doctor_id: args.p_doctor, saat, adet: 1 })
          return { data: { ok: true, kullanilan: toplam + 1 }, error: null }
        }
        if (ad === 'whatsapp_kota_iade') {
          const dolu = db.tablo('whatsapp_kota_saatlik').filter((r) => r.doctor_id === args.p_doctor && Number(r.adet) > 0).sort((a, b) => String(b.saat).localeCompare(String(a.saat)))[0]
          if (dolu) dolu.adet = Number(dolu.adet) - 1
          return { data: null, error: null }
        }
        // SES-LAT-02: mirrors ses_turu_ac() (178_ses_turu_ac.sql) — atomic voice-turn open: duplicate check, claim
        // and row read in one call. The real atomicity is Postgres's FOR UPDATE; this fake is single-threaded and
        // only needs the same kazandi/oncekiKilit/satir shape (row snapshot is PRE-claim, like the SQL).
        if (ad === 'ses_turu_ac') {
          const satir = db.tablo('asistan_sessions').find((r) => r.id === args.p_oturum && r.doctor_id === args.p_doktor)
          if (!satir) return { data: { yok: true, kazandi: false }, error: null }
          const okunan = JSON.parse(JSON.stringify({ id: satir.id, messages: satir.messages || [], active_context: satir.active_context || {}, persona_id: satir.persona_id ?? null, patient_id: satir.patient_id ?? null }))
          const k = (satir.active_context as Record<string, any> | null)?.sesTurKilit || null
          const t = k?.zaman ? Date.parse(String(k.zaman)) : NaN
          const canli = Number.isFinite(t) && Date.now() - t <= 45000
          const bosluksuz = (x: unknown) => String(x || '').replace(/\s+/g, ' ').trim()
          const ayni = canli && (k?.anahtar ? k.anahtar === args.p_anahtar : bosluksuz(k?.mesaj) === bosluksuz(args.p_mesaj))
          let kazandi = false
          if (!(canli && ayni)) {
            satir.active_context = { ...((satir.active_context as Record<string, unknown>) || {}), sesTurKilit: { mesaj: String(args.p_mesaj || '').slice(0, 500), anahtar: String(args.p_anahtar || '').slice(0, 200), zaman: new Date().toISOString(), claimId: args.p_claim } }
            kazandi = true
          }
          return { data: { yok: false, kazandi, oncekiKilit: k, satir: okunan }, error: null }
        }
        // SES-OMURGA-V2: mirrors 183_ses_omurga_v2.sql. The real atomicity is Postgres's FOR UPDATE; this fake is
        // single-threaded and only needs the same karar/seq/satir shape and the same write refusal.
        if (ad === 'ses_turu_ac_v2') {
          const satir = db.tablo('asistan_sessions').find((r) => r.id === args.p_oturum && r.doctor_id === args.p_doktor)
          if (!satir) return { data: { yok: true }, error: null }
          const ac = ((satir.active_context as Record<string, any> | null) || {})
          const k = ac.sesTur && typeof ac.sesTur === 'object' ? ac.sesTur : null
          const ayniCagri = Boolean(k && k.cagri === args.p_cagri)
          const yas = ayniCagri ? Date.now() - Date.parse(String(k.zaman)) : Infinity
          let seq = ayniCagri ? Number(k.seq || 0) + 1 : 1
          let karar = 'yeni'
          if (ayniCagri && Number(k.tur) === Number(args.p_tur) && String(k.anahtar || '') === String(args.p_anahtar || '') && k.durum === 'bitti' && yas <= 120000) { karar = 'kopya'; seq = Number(k.seq || 0) }
          else if (ayniCagri && Number(k.tur) === Number(args.p_tur) && k.durum !== 'bitti' && yas <= 60000) karar = 'ustune'
          const okunan = JSON.parse(JSON.stringify({ id: satir.id, messages: ((satir.messages as unknown[]) || []).slice(-Number(args.p_pencere || 60)), active_context: ac, persona_id: satir.persona_id ?? null, patient_id: satir.patient_id ?? null }))
          if (karar !== 'kopya') {
            const turlar: Record<string, number> = { ...((ayniCagri && k.turlar) || {}), [String(args.p_tur)]: seq }
            for (const t of Object.keys(turlar)) if (Number(t) <= Number(args.p_tur) - 10) delete turlar[t]
            const { sesTurKilit: _a, sesSonSoz: _b, ...geri } = ac
            satir.active_context = { ...geri, sesTur: { cagri: String(args.p_cagri || ''), tur: Number(args.p_tur), seq, anahtar: String(args.p_anahtar || '').slice(0, 200), zaman: new Date().toISOString(), durum: 'acik', turlar } }
          }
          const acik = typeof ac.currentPatientId === 'string' && ac.currentPatientId ? ac.currentPatientId : null
          const sahibi = (id: unknown) => db.tablo('patients').some((p) => p.id === id && p.doctor_id === args.p_doktor)
          const surumler: Record<string, number> = {}
          for (const id of [args.p_hasta, acik]) {
            if (!id || !sahibi(id)) continue
            surumler[String(id)] = db.dosyaSurumu(String(id))
          }
          return {
            data: {
              yok: false, karar, seq, onceki: k, satir: okunan,
              profil: db.tablo('users').find((u) => u.id === args.p_doktor) ?? null,
              tercih: db.tablo('doctor_preferences').find((d) => d.doctor_id === args.p_doktor) ?? null,
              hastaSahibi: !args.p_hasta || sahibi(args.p_hasta),
              acikHasta: acik,
              acikHastaSahibi: Boolean(acik && sahibi(acik)),
              surumler,
            },
            error: null,
          }
        }
        if (ad === 'asistan_gecmis_ekle') {
          const satir = db.tablo('asistan_sessions').find((r) => r.id === args.p_oturum && r.doctor_id === args.p_doktor)
          if (!satir) return { data: { yazildi: false, yok: true }, error: null }
          const ac = { ...((satir.active_context as Record<string, any> | null) || {}) }
          const st = ac.sesTur
          if (args.p_cagri != null && args.p_tur != null && args.p_seq != null && st && st.cagri === args.p_cagri) {
            const ts = st.turlar?.[String(args.p_tur)]
            if (ts != null && Number(ts) !== Number(args.p_seq)) return { data: { yazildi: false, ustune: true }, error: null }
          }
          const sayfa = ac.odakKaynak === 'sayfa' && ac.currentPatientId != null && String(ac.odakZaman || '') > String(args.p_tur_bas || '')
          const yama = { ...((args.p_yama as Record<string, unknown>) || {}) }
          if (sayfa) for (const x of ['currentPatientId', 'patientName', 'odakKaynak', 'odakZaman', 'sesDevam']) delete yama[x]
          delete yama.sesTur
          for (const x of ((args.p_sil as string[]) || [])) delete ac[x]
          const yeniAc: Record<string, any> = { ...ac, ...yama }
          if (args.p_cagri != null && st && st.cagri === args.p_cagri && Number(st.tur) === Number(args.p_tur) && Number(st.seq) === Number(args.p_seq)) {
            yeniAc.sesTur = { ...yeniAc.sesTur, durum: 'bitti', soz: String(args.p_soz || '').slice(0, 2000) }
          }
          const azami = Math.max(20, Math.min(Number(args.p_azami || 300), 2000))
          const mesajlar = [...(args.p_sifirla ? [] : ((satir.messages as unknown[]) || [])), ...((args.p_yeni as unknown[]) || [])].slice(-azami)
          satir.messages = JSON.parse(JSON.stringify(mesajlar))
          satir.active_context = JSON.parse(JSON.stringify(yeniAc))
          if (args.p_persona) satir.persona_id = args.p_persona
          if (sayfa) satir.patient_id = ac.currentPatientId
          else if (args.p_hasta_yaz) satir.patient_id = args.p_hasta_yaz
          else if (args.p_hasta_null) satir.patient_id = null
          return { data: { yazildi: true, sayfa }, error: null }
        }
        if (ad === 'asistan_oturum_pencere') {
          const satir = db.tablo('asistan_sessions').find((r) => r.id === args.p_oturum && r.doctor_id === args.p_doktor)
          if (!satir) return { data: null, error: null }
          return { data: JSON.parse(JSON.stringify({ id: satir.id, messages: ((satir.messages as unknown[]) || []).slice(-Number(args.p_pencere || 40)), active_context: satir.active_context || {} })), error: null }
        }
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
  private yazmaSayimi = false
  private yuk: Satir[] = []
  private guncelleme: Satir = {}
  private cakisma: string[] = ['id']
  private kosullar: Kosul[] = []
  private veyaGruplari: Kosul[][] = []
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
  /** `{ count: 'exact' }` on a write answers the number of rows it touched (PostgREST `Prefer: count=exact`). */
  update(g: Satir, o?: { count?: string }) { this.islem = 'update'; this.guncelleme = g; this.yazmaSayimi = !!o?.count; return this }
  delete(o?: { count?: string }) { this.islem = 'delete'; this.yazmaSayimi = !!o?.count; return this }

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
  /** `.or('a.is.null,emb.not.is.null,b.eq.x')` — top-level columns or embed keys; only is/eq (optionally `not.`). */
  or(ifade: string) {
    const grup = ifade.split(',').map((ham) => {
      const m = ham.trim().match(/^(\w+)\.(not\.)?(is|eq)\.(.*)$/)
      if (!m) throw new Error(`[sahteSupabase] desteklenmeyen .or() koşulu: ${ham}`)
      const [, kolon, degil, op, d] = m
      const deger = op === 'is' ? ({ null: null, true: true, false: false } as Record<string, unknown>)[d] : d
      if (op === 'is' && deger === undefined) throw new Error(`[sahteSupabase] desteklenmeyen .or() is değeri: ${d}`)
      const bos = (v: unknown) => v == null || (Array.isArray(v) && !v.length)
      const temel = (v: unknown) => (op === 'is' ? (deger === null ? bos(v) : v === deger) : esit(v, deger))
      return { kolon, test: (v: unknown) => (degil ? !temel(v) : temel(v)) }
    })
    this.veyaGruplari.push(grup)
    return this
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
    const fk = g.fk || `${tekil(g.ad)}_id`
    const hedefSatirlar = this.db.tablo(g.ad)
    if (fk in r || g.fk) {
      const e = hedefSatirlar.find((x) => esit(x.id, r[fk]))
      return e ? this.gommeleriUygula(g.ad, { ...e }, g.alt) : null
    }
    const geriFk = `${tekil(tabloAd)}_id`
    return hedefSatirlar.filter((x) => esit(x[geriFk], r.id)).map((x) => this.gommeleriUygula(g.ad, { ...x }, g.alt))
  }
  private gommeleriUygula(tabloAd: string, r: Satir, gommeler: Gomme[]): Satir {
    for (const g of gommeler) r[g.anahtar] = this.gom(tabloAd, r, g)
    return r
  }

  /**
   * `a.b.col` filter: narrows embed `a`, then its embed `b`, to rows passing `test` on `col` (PostgREST
   * semantics). An `!inner` level left empty drops its parent — the row itself at the top level, or the
   * parent embed (→ null / filtered array) one level down.
   */
  private yolFiltrele(r: Satir, gommeler: Gomme[], parcalar: string[], test: (v: unknown) => boolean): boolean {
    if (parcalar.length === 1) return test(r[parcalar[0]])
    const rel = parcalar[0]
    const g = gommeler.find((x) => x.anahtar === rel)
    if (!g) throw new Error(`[sahteSupabase] ${this.ad}: '${parcalar.join('.')}' filtresi gömülü '${rel}' olmadan kullanıldı`)
    const deger = r[rel]
    const liste = Array.isArray(deger) ? deger : deger ? [deger] : []
    const kalan = liste.filter((x: Satir) => this.yolFiltrele(x, g.alt, parcalar.slice(1), test))
    if (g.inner && !kalan.length) return false
    r[rel] = Array.isArray(deger) ? kalan : kalan[0] ?? null
    return true
  }

  private eslesir(r: Satir, gommeler: Gomme[]): boolean {
    for (const k of this.kosullar) if (!this.yolFiltrele(r, gommeler, k.kolon.split('.'), k.test)) return false
    for (const g of gommeler) if (g.inner && (r[g.anahtar] == null || (Array.isArray(r[g.anahtar]) && !r[g.anahtar].length))) return false
    // `.or()` is evaluated after the embed filters above, like PostgREST (an embed a filter emptied is null here).
    for (const grup of this.veyaGruplari) if (!grup.some((k) => k.test(r[k.kolon]))) return false
    return true
  }

  private calistir(): { data: unknown; error: unknown; count?: number | null } {
    if (this.ad === 'hasta_dosya_surum' && this.islem === 'select') {
      // SES-OMURGA-V2: virtual — computed from the rows themselves (see SahteVeritabani.dosyaSurumu).
      const tum = [...new Set([...(this.db.tablolar.get('patients') || []).map((r) => r.id)])].map((pid) => ({ patient_id: pid, surum: this.db.dosyaSurumu(String(pid)) }))
      const sanal = tum.filter((r) => this.kosullar.every((k) => k.test((r as Satir)[k.kolon])))
      if (this.tek) return { data: sanal[0] ?? null, error: null }
      return { data: sanal, error: null }
    }
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
      const y = this.sonuc(this.dondur ? eslesen.map((r) => ({ ...r })) : null)
      return this.yazmaSayimi ? { ...y, count: eslesen.length } : y
    }
    if (this.islem === 'delete') {
      for (const r of eslesen) tablo.splice(tablo.indexOf(r), 1)
      const y = this.sonuc(this.dondur ? eslesen : null)
      return this.yazmaSayimi ? { ...y, count: eslesen.length } : y
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
