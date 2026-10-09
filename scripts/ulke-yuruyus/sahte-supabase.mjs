#!/usr/bin/env node
/**
 * NOTYA-UZ-MUAYENE-01 — local STAND-IN for a country's Supabase project, for the walk-through (./yuruyus.mjs).
 * Never deployed, never a dependency of the application. Synthetic accounts and data only; everything is in memory.
 *
 *   node scripts/ulke-yuruyus/sahte-supabase.mjs [port=54399]
 *
 * Just enough of three services for the country screens:
 *   auth      password login, "who am I", logout, admin create / delete user
 *   rest      a small PostgREST: select / insert / upsert / update / delete with the filters the application uses
 *             (eq, neq, in, gte, gt, lt, is.null, not.is.null), order, limit, single-object answers, the two
 *             invitation-code functions, and (NOTYA-UZ-RANDEVU-01) what migration 135 puts in the database: the
 *             no-double-booking constraint of `ulke_randevulari` and the function `ulke_not_onayla`. An operator it does not know is an ERROR (400) — it never ignores a filter,
 *             because an ignored filter would make a broken ownership check look fine.
 *             NOTYA-ULKE-PORTAL-01: what migrations 136 and 137 put in the database — the usage record's function, the
 *             six functions of the patient portal (each all-or-nothing), and the constraints a statement meets there
 *             (a summary only for an approved note of that patient, one per note; one unanswered request per patient).
 *   storage   upload / download / remove of objects. A browser session may upload only under `<its country>/<its own
 *             account id>/` (what the storage policy of migration 132 enforces in the real project); the service role
 *             may read and remove anything.
 *   SHARED DATABASE (NOTYA-ULKE-SABLON-01): every table here is a country table. A statement that does not name the
 *             country (no `ulke=eq.…` filter, no `ulke` on an inserted row, no `p_ulke`) is answered with an error.
 *
 * Inspection, for the walk-through only:  GET /__gunluk (request log)   GET /__tablo/<name> (rows)   GET /__depo (object paths)
 */
import http from 'node:http'
import { createHash, randomUUID } from 'node:crypto'

const PORT = Number(process.argv[2] || 54399)
const SERVIS = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sahte-servis'

// NOTYA-ULKE-SABLON-01 — WHICH COUNTRY IS WALKED. Unset = Uzbekistan, exactly as before (./yuruyus.mjs). The
// pack-neutral walk-through (./genel.mjs) sets YURUYUS_ULKE=<code> and YURUYUS_DILLER=<form of account 1>,<form of
// account 2>; the two accounts, the invitation code and the storage folders then belong to that country.
const ULKE = process.env.YURUYUS_ULKE || 'uz'
if (!/^[a-z]{2}$/.test(ULKE)) throw new Error(`YURUYUS_ULKE="${ULKE}" is not a country code`)
const [DIL_1, DIL_2] = (process.env.YURUYUS_DILLER || 'uz-Latn,ru').split(',')
const hesaplar = {
  'qa-uz@notya.test': { id: 'aaaaaaaa-0000-4000-8000-000000000001', sifre: 'sinov-parol-1', ulke: ULKE, dil: DIL_1, ad: 'QA Shifokor Bir' },
  'qa-ru@notya.test': { id: 'aaaaaaaa-0000-4000-8000-000000000002', sifre: 'sinov-parol-2', ulke: ULKE, dil: DIL_2 || DIL_1, ad: 'QA Врач Два' },
  'qa-tr@notya.test': { id: 'aaaaaaaa-0000-4000-8000-000000000003', sifre: 'sinov-parol-3', ulke: 'tr', dil: 'tr', ad: 'QA Hekim Uc' },
  'qa-damgasiz@notya.test': { id: 'aaaaaaaa-0000-4000-8000-000000000004', sifre: 'sinov-parol-4', ulke: null, dil: 'tr', ad: 'QA Damgasiz' },
}
const GECERLI_KOD = 'QATEST0000000001'
const kodlar = new Map([[createHash('sha256').update(GECERLI_KOD).digest('hex'), { ulke: ULKE, kalan: 1 }]])
const jetonlar = new Map()
const gunluk = []
/**
 * table → rows. SHARED DATABASE (NOTYA-ULKE-SABLON-01): one database for every country, so `ulke_hesaplari` starts
 * with one row per account that has a country stamp — the Uzbek accounts AND an account of another country, side by
 * side in the same table. The build under test must behave as if the other country's row were not there.
 */
const tablolar = { ulke_hesaplari: [] }
for (const h of Object.values(hesaplar)) if (h.ulke) tablolar.ulke_hesaplari.push({ id: h.id, full_name: h.ad, ulke: h.ulke, ui_language: h.dil })
/** The one table of Türkiye a country build writes to, through the shared model gateway: it has no country column. */
const ULKESIZ = new Set(['ai_token_kullanim'])
const tablo = (ad) => (tablolar[ad] ??= [])
/** Tables whose rows have no id of their own (the key is another table's id). */
const KIMLIKSIZ = new Set(['hekim_calisma_duzeni', 'hekim_dil_tercihleri', 'hekim_rolu', 'hasta_ulke_bilgisi', 'muayene_dil_kaydi', 'not_dil_kaydi', 'ulke_kullanim', 'ulke_kullanim_olcumu'])
/** bucket/path → { tur, veri: Buffer } */
const depo = new Map()

const kullanici = (eposta) => {
  const h = hesaplar[eposta]
  return { id: h.id, aud: 'authenticated', role: 'authenticated', email: eposta, app_metadata: { provider: 'email', providers: ['email'], ...(h.ulke ? { country: h.ulke } : {}) }, user_metadata: { full_name: h.ad, ui_language: h.dil }, created_at: '2026-10-08T00:00:00Z' }
}
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Access-Control-Expose-Headers': '*' }
const yaz = (res, status, govde) => { res.writeHead(status, { 'Content-Type': 'application/json', ...cors }); res.end(govde === undefined ? '' : JSON.stringify(govde)) }
const hata = (res, status, code, message) => yaz(res, status, { code, message, details: null, hint: null })

// ───────────────────────── PostgREST ─────────────────────────
const AYAR = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'])
const deger = (ham) => (ham === 'null' ? null : ham === 'true' ? true : ham === 'false' ? false : ham)
function suzgec(kolon, ham) {
  const es = (s, v) => String(s[kolon] ?? '') === String(v) && (s[kolon] ?? null) !== null
  if (ham.startsWith('eq.')) { const v = deger(ham.slice(3)); return (s) => (typeof v === 'boolean' ? s[kolon] === v : es(s, ham.slice(3))) }
  if (ham.startsWith('neq.')) return (s) => !es(s, ham.slice(4))
  if (ham.startsWith('gte.')) return (s) => String(s[kolon] ?? '') >= ham.slice(4)
  if (ham.startsWith('lt.')) return (s) => String(s[kolon] ?? '') < ham.slice(3)
  if (ham.startsWith('gt.')) return (s) => String(s[kolon] ?? '') > ham.slice(3)
  if (ham === 'is.null') return (s) => (s[kolon] ?? null) === null
  if (ham === 'not.is.null') return (s) => (s[kolon] ?? null) !== null
  if (ham.startsWith('in.(') && ham.endsWith(')')) {
    const liste = ham.slice(4, -1).split(',').map((x) => x.replace(/^"|"$/g, ''))
    return (s) => liste.includes(String(s[kolon] ?? ''))
  }
  return null
}
/**
 * NOTYA-UZ-RANDEVU-01 — the exclusion constraint of migration 135: two appointments of one doctor that still hold
 * their time (planned, arrived, done) may not overlap. Answered as PostgREST answers a violated constraint.
 */
const YER_TUTAN = ['planlandi', 'geldi', 'tamamlandi']
const cakisiyor = (yeni, digerleri) => YER_TUTAN.includes(String(yeni.durum ?? 'planlandi')) && digerleri.some((s) => s.doctor_id === yeni.doctor_id && YER_TUTAN.includes(String(s.durum ?? 'planlandi')) && String(s.baslangic) < String(yeni.bitis) && String(s.bitis) > String(yeni.baslangic))
const cakismaHatasi = (res) => hata(res, 409, '23P01', 'conflicting key value violates exclusion constraint "ulke_randevulari_cakisma_yok"')

/** NOTYA-UZ-RANDEVU-01 — `ulke_not_onayla` of migration 135, statement by statement; all of it or none of it. */
function notOnayla(a) {
  const yedek = JSON.stringify(tablolar)
  try {
    if (!/^[a-z]{2}$/.test(String(a.p_ulke ?? ''))) throw new Error('ulke_not_onayla called without the country (p_ulke)')
    const not = tablo('ulke_notlar').find((n) => n.id === a.p_note_id && n.doctor_id === a.p_doctor_id && n.ulke === a.p_ulke)
    if (!not) return 'NOT_FOUND'
    if (not.approved_at) return 'ONAYLI'
    Object.assign(not, { content_subjektif: a.p_s, content_objektif: a.p_o, content_degerlendirme: a.p_a, content_plan: a.p_p, approved_at: a.p_onay_ani, approved_by: a.p_doctor_id })
    if (a.p_dil_kaydi) {
      const d = tablo('not_dil_kaydi').find((x) => x.note_id === a.p_note_id && x.doctor_id === a.p_doctor_id && x.ulke === a.p_ulke)
      if (!d) throw new Error('not_dil_kaydi row missing')
      for (const k of ['alanlar', 'ikinci_alanlar', 'not_dili', 'ikinci_dil', 'ikinci_s', 'ikinci_o', 'ikinci_a', 'ikinci_p']) if (Object.prototype.hasOwnProperty.call(a.p_dil_kaydi, k)) d[k] = a.p_dil_kaydi[k] ?? null
      d.updated_at = a.p_onay_ani
    }
    for (const r of tablo('ulke_randevulari')) if (r.session_id === not.session_id && r.doctor_id === a.p_doctor_id && r.ulke === a.p_ulke && ['planlandi', 'geldi'].includes(r.durum)) Object.assign(r, { durum: 'tamamlandi', updated_at: a.p_onay_ani })
    return 'TAMAM'
  } catch (e) {
    const eski = JSON.parse(yedek)
    for (const k of Object.keys(tablolar)) delete tablolar[k]
    Object.assign(tablolar, eski)
    throw e
  }
}

// ───────────────────────── NOTYA-ULKE-PORTAL-01: migrations 136 and 137 ─────────────────────────
/** A violated constraint, as the database raises it. */
const kisitHatasi = (code, message) => Object.assign(new Error(message), { code })
/**
 * What migration 137 makes the database refuse for a row as it WOULD be (`digerleri` = every other row of the table):
 * the summary's trigger (the note is this doctor's, about this patient, and approved) and one summary per note; one
 * link per patient that is not withdrawn; one unanswered request per patient; and the patient is this doctor's.
 */
function portalKisiti(ad, yeni, digerleri) {
  if (!['ulke_hasta_ozetleri', 'ulke_portal_erisimleri', 'ulke_portal_oturumlari', 'ulke_portal_kayitlari', 'ulke_randevu_istekleri'].includes(ad)) return null
  if (!tablo('ulke_hastalar').some((h) => h.id === yeni.patient_id && h.doctor_id === yeni.doctor_id && h.ulke === yeni.ulke)) return kisitHatasi('23503', `insert or update on table "${ad}" violates foreign key constraint "${ad}_hasta_fk"`)
  if (ad === 'ulke_hasta_ozetleri') {
    const n = tablo('ulke_notlar').find((x) => x.id === yeni.note_id && x.doctor_id === yeni.doctor_id && x.ulke === yeni.ulke)
    const m = n ? tablo('ulke_muayeneler').find((x) => x.id === n.session_id && x.doctor_id === n.doctor_id && x.ulke === n.ulke) : null
    if (!n || !m || m.patient_id !== yeni.patient_id) return kisitHatasi('23514', 'ulke_hasta_ozetleri: the note is not a note of this patient')
    if (!n.approved_at) return kisitHatasi('23514', 'ulke_hasta_ozetleri: a summary for the patient exists only for an approved note')
    if (digerleri.some((x) => x.ulke === yeni.ulke && x.doctor_id === yeni.doctor_id && x.note_id === yeni.note_id)) return kisitHatasi('23505', 'duplicate key value violates unique constraint "ulke_hasta_ozetleri_not_tekil"')
  }
  if (ad === 'ulke_portal_erisimleri') {
    if (digerleri.some((x) => x.token_hash === yeni.token_hash)) return kisitHatasi('23505', 'duplicate key value violates unique constraint "ulke_portal_erisimleri_token_tekil"')
    if (!yeni.iptal_at && digerleri.some((x) => x.ulke === yeni.ulke && x.doctor_id === yeni.doctor_id && x.patient_id === yeni.patient_id && !x.iptal_at)) return kisitHatasi('23505', 'duplicate key value violates unique constraint "ulke_portal_erisimleri_tek_acik"')
  }
  if (ad === 'ulke_portal_oturumlari' && !tablo('ulke_portal_erisimleri').some((e) => e.id === yeni.erisim_id && e.ulke === yeni.ulke && e.doctor_id === yeni.doctor_id && e.patient_id === yeni.patient_id)) return kisitHatasi('23503', 'insert or update on table "ulke_portal_oturumlari" violates foreign key constraint "ulke_portal_oturumlari_erisim_fk"')
  if (ad === 'ulke_randevu_istekleri' && (yeni.durum ?? 'bekliyor') === 'bekliyor' && digerleri.some((x) => x.ulke === yeni.ulke && x.doctor_id === yeni.doctor_id && x.patient_id === yeni.patient_id && (x.durum ?? 'bekliyor') === 'bekliyor')) return kisitHatasi('23505', 'duplicate key value violates unique constraint "ulke_randevu_istekleri_tek_bekleyen"')
  return null
}
/** A row written inside a function, held to the same constraints as a statement. */
function islevdeEkle(ad, satir) {
  const yeni = { id: randomUUID(), created_at: new Date().toISOString(), ...satir }
  if (ad === 'ulke_randevulari' && cakisiyor(yeni, tablo(ad))) throw kisitHatasi('23P01', 'conflicting key value violates exclusion constraint "ulke_randevulari_cakisma_yok"')
  const c = portalKisiti(ad, yeni, tablo(ad))
  if (c) throw c
  tablo(ad).push(yeni)
  return yeni
}
/** The functions of migrations 136 and 137, statement by statement. Every one filters by `p_ulke`, as the SQL does. */
const ISLEVLER = {
  ulke_kullanim_ekle: (a) => {
    const poz = (x) => Math.max(Number(x ?? 0) || 0, 0)
    let s = tablo('ulke_kullanim_olcumu').find((x) => x.ulke === a.p_ulke && x.doctor_id === a.p_doctor_id && x.gun === a.p_gun && x.gorev === a.p_gorev)
    if (!s) { s = { ulke: a.p_ulke, doctor_id: a.p_doctor_id, gun: a.p_gun, gorev: a.p_gorev, adet: 0, saniye: 0, giris_token: 0, cikis_token: 0 }; tablo('ulke_kullanim_olcumu').push(s) }
    Object.assign(s, { adet: s.adet + poz(a.p_adet), saniye: s.saniye + poz(a.p_saniye), giris_token: s.giris_token + poz(a.p_giris_token), cikis_token: s.cikis_token + poz(a.p_cikis_token) })
    return null
  },
  ulke_portal_erisim_ver: (a) => {
    if (!tablo('ulke_hastalar').some((h) => h.id === a.p_patient_id && h.doctor_id === a.p_doctor_id && h.ulke === a.p_ulke)) return null
    const bu = (x) => x.ulke === a.p_ulke && x.doctor_id === a.p_doctor_id && x.patient_id === a.p_patient_id
    for (const o of tablo('ulke_portal_oturumlari')) if (bu(o) && !o.kapandi_at) o.kapandi_at = a.p_simdi
    for (const e of tablo('ulke_portal_erisimleri')) if (bu(e) && !e.iptal_at) e.iptal_at = a.p_simdi
    const yeni = islevdeEkle('ulke_portal_erisimleri', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: a.p_patient_id, token_hash: a.p_token_hash, pin_hash: a.p_pin_hash, hatali_deneme: 0, son_deneme_at: null, kilitlendi_at: null, son_gecerlilik: a.p_son_gecerlilik, iptal_at: null, son_giris_at: null, created_at: a.p_simdi })
    islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: a.p_patient_id, olay: 'erisim', ozet_id: null, created_at: a.p_simdi })
    return yeni.id
  },
  ulke_portal_erisim_iptal: (a) => {
    const bu = (x) => x.ulke === a.p_ulke && x.doctor_id === a.p_doctor_id && x.patient_id === a.p_patient_id
    const acik = tablo('ulke_portal_erisimleri').filter((e) => bu(e) && !e.iptal_at)
    if (!acik.length) return false
    for (const e of acik) e.iptal_at = a.p_simdi
    for (const o of tablo('ulke_portal_oturumlari')) if (bu(o) && !o.kapandi_at) o.kapandi_at = a.p_simdi
    islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: a.p_patient_id, olay: 'iptal', ozet_id: null, created_at: a.p_simdi })
    return true
  },
  ulke_portal_deneme_al: (a) => {
    const e = tablo('ulke_portal_erisimleri').find((x) => x.token_hash === a.p_token_hash && x.ulke === a.p_ulke)
    if (!e || e.iptal_at || String(e.son_gecerlilik) <= String(a.p_simdi)) return { durum: 'YOK' }
    if (e.kilitlendi_at) return { durum: 'KILITLI' }
    if (Number(e.hatali_deneme) >= Number(a.p_azami)) {
      e.kilitlendi_at = a.p_simdi
      for (const o of tablo('ulke_portal_oturumlari')) if (o.erisim_id === e.id && o.ulke === a.p_ulke && !o.kapandi_at) o.kapandi_at = a.p_simdi
      islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: e.doctor_id, patient_id: e.patient_id, olay: 'kilit', ozet_id: null, created_at: a.p_simdi })
      return { durum: 'KILITLI' }
    }
    if (e.son_deneme_at && new Date(String(a.p_simdi)).getTime() < new Date(String(e.son_deneme_at)).getTime() + Number(a.p_aralik_sn) * 1000) return { durum: 'YAVAS' }
    Object.assign(e, { hatali_deneme: Number(e.hatali_deneme) + 1, son_deneme_at: a.p_simdi })
    return { durum: 'DENE', erisim_id: e.id, doctor_id: e.doctor_id, patient_id: e.patient_id, pin_hash: e.pin_hash }
  },
  ulke_portal_deneme_sonucu: (a) => {
    const e = tablo('ulke_portal_erisimleri').find((x) => x.id === a.p_erisim_id && x.ulke === a.p_ulke)
    if (!e || e.iptal_at || String(e.son_gecerlilik) <= String(a.p_simdi)) return { durum: 'YOK' }
    if (e.kilitlendi_at) return { durum: 'KILITLI' }
    const kilitle = () => {
      e.kilitlendi_at = a.p_simdi
      for (const o of tablo('ulke_portal_oturumlari')) if (o.erisim_id === e.id && o.ulke === a.p_ulke && !o.kapandi_at) o.kapandi_at = a.p_simdi
      islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: e.doctor_id, patient_id: e.patient_id, olay: 'kilit', ozet_id: null, created_at: a.p_simdi })
      return { durum: 'KILITLI' }
    }
    if (a.p_dogru === true) {
      Object.assign(e, { hatali_deneme: 0, son_giris_at: a.p_simdi })
      const bitis = String(a.p_oturum_bitis) < String(e.son_gecerlilik) ? a.p_oturum_bitis : e.son_gecerlilik
      islevdeEkle('ulke_portal_oturumlari', { ulke: a.p_ulke, doctor_id: e.doctor_id, patient_id: e.patient_id, erisim_id: e.id, oturum_hash: a.p_oturum_hash, son_gecerlilik: bitis, kapandi_at: null, created_at: a.p_simdi })
      islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: e.doctor_id, patient_id: e.patient_id, olay: 'giris', ozet_id: null, created_at: a.p_simdi })
      return { durum: 'TAMAM', doctor_id: e.doctor_id, patient_id: e.patient_id }
    }
    if (Number(e.hatali_deneme) >= Number(a.p_azami)) return kilitle()
    return { durum: 'YANLIS', kalan: Number(a.p_azami) - Number(e.hatali_deneme) }
  },
  ulke_ozet_paylas: (a) => {
    const z = tablo('ulke_hasta_ozetleri').find((x) => x.id === a.p_ozet_id && x.doctor_id === a.p_doctor_id && x.ulke === a.p_ulke)
    if (!z) return 'NOT_FOUND'
    if (Boolean(z.paylasildi_at) === (a.p_paylas === true)) return 'AYNI'
    const c = portalKisiti('ulke_hasta_ozetleri', { ...z, paylasildi_at: a.p_paylas ? a.p_simdi : null }, tablo('ulke_hasta_ozetleri').filter((x) => x !== z))
    if (c) throw c
    Object.assign(z, { paylasildi_at: a.p_paylas ? a.p_simdi : null, updated_at: a.p_simdi })
    islevdeEkle('ulke_portal_kayitlari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: z.patient_id, olay: a.p_paylas ? 'paylasim' : 'geri-alma', ozet_id: a.p_ozet_id, created_at: a.p_simdi })
    return 'TAMAM'
  },
  ulke_randevu_istegi_kabul: (a) => {
    const i = tablo('ulke_randevu_istekleri').find((x) => x.id === a.p_istek_id && x.doctor_id === a.p_doctor_id && x.ulke === a.p_ulke)
    if (!i) return { durum: 'NOT_FOUND' }
    if ((i.durum ?? 'bekliyor') !== 'bekliyor') return { durum: 'CEVAPLANDI' }
    const r = islevdeEkle('ulke_randevulari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: i.patient_id, baslangic: a.p_baslangic, bitis: a.p_bitis, neden_encrypted: a.p_neden_encrypted ?? null, durum: 'planlandi', mesai_disi: a.p_mesai_disi === true, session_id: null, created_at: a.p_simdi, updated_at: a.p_simdi })
    Object.assign(i, { durum: 'kabul', randevu_id: r.id, cevap_at: a.p_simdi })
    return { durum: 'TAMAM', randevu_id: r.id }
  },
}
/** One function call as ONE TRANSACTION: the tables are put back if a statement fails or the function raises. */
function islevCalistir(ad, a) {
  if (!/^[a-z]{2}$/.test(String(a.p_ulke ?? ''))) throw kisitHatasi('P0001', `${ad} called without the country (p_ulke)`)
  const yedek = JSON.stringify(tablolar)
  try { return ISLEVLER[ad](a) } catch (e) {
    const eski = JSON.parse(yedek)
    for (const k of Object.keys(tablolar)) delete tablolar[k]
    Object.assign(tablolar, eski)
    throw e
  }
}

function rest(req, res, url, govde) {
  const ad = decodeURIComponent(url.pathname.slice('/rest/v1/'.length))
  if (!/^[a-z_0-9]+$/.test(ad)) return hata(res, 404, 'PGRST205', `no table ${ad}`)
  const suzgecler = []
  for (const [k, v] of url.searchParams) {
    if (AYAR.has(k)) continue
    const f = suzgec(k, v)
    if (!f) return hata(res, 400, 'PGRST100', `stand-in: filter ${k}=${v} is not implemented`)
    suzgecler.push(f)
  }
  const uyan = (s) => suzgecler.every((f) => f(s))
  // THE COUNTRY RULE of the shared database, as the real tables hold it (`ulke text not null`, and the application's
  // one door to the database): a statement that does not name the country is an ERROR here, never a silent success.
  if (!ULKESIZ.has(ad)) {
    const filtre = url.searchParams.get('ulke')
    if (req.method === 'POST') {
      const gelen = Array.isArray(govde) ? govde : [govde]
      if (!gelen.every((y) => /^[a-z]{2}$/.test(String(y?.ulke ?? '')))) return hata(res, 400, '23502', `stand-in: insert into ${ad} without the country (ulke)`)
    } else if (!filtre || !/^eq\.[a-z]{2}$/.test(filtre)) return hata(res, 400, '42P10', `stand-in: ${req.method} on ${ad} without a country filter (ulke=eq.…)`)
    if (req.method === 'PATCH' && govde && 'ulke' in govde) return hata(res, 400, '23514', `stand-in: update on ${ad} rewrites the country of a row`)
  }
  const tercih = String(req.headers.prefer || '')
  const tekNesne = String(req.headers.accept || '').includes('vnd.pgrst.object')
  const satirlar = tablo(ad)
  let sonuc
  if (req.method === 'GET' || req.method === 'HEAD') sonuc = satirlar.filter(uyan)
  else if (req.method === 'POST') {
    const gelen = Array.isArray(govde) ? govde : [govde]
    const catisma = url.searchParams.get('on_conflict')
    sonuc = []
    for (const y of gelen) {
      const anahtarlar = catisma ? catisma.split(',').map((k) => k.trim()) : null
      const var_ = anahtarlar && tercih.includes('resolution=merge-duplicates') ? satirlar.find((s) => anahtarlar.every((k) => String(s[k]) === String(y[k]))) : null
      if (var_) { Object.assign(var_, y); sonuc.push(var_); continue }
      if (!KIMLIKSIZ.has(ad) && y.id && satirlar.some((s) => s.id === y.id)) return hata(res, 409, '23505', 'duplicate key value violates unique constraint')
      const yeni = { ...(KIMLIKSIZ.has(ad) ? {} : { id: randomUUID() }), created_at: new Date().toISOString(), ...y }
      if (ad === 'ulke_randevulari' && cakisiyor(yeni, satirlar)) return cakismaHatasi(res)
      { const c = portalKisiti(ad, yeni, satirlar); if (c) return hata(res, 409, c.code, c.message) }
      if (ad === 'ulke_muayeneler' && !yeni.started_at) yeni.started_at = yeni.created_at
      satirlar.push(yeni); sonuc.push(yeni)
    }
  } else if (req.method === 'PATCH') {
    if (!suzgecler.length) return hata(res, 400, '21000', 'UPDATE requires a WHERE clause')
    sonuc = satirlar.filter(uyan)
    if (ad === 'ulke_randevulari') for (const s of sonuc) if (cakisiyor({ ...s, ...govde }, satirlar.filter((x) => x !== s))) return cakismaHatasi(res)
    for (const s of sonuc) { const c = portalKisiti(ad, { ...s, ...govde }, satirlar.filter((x) => x !== s)); if (c) return hata(res, 409, c.code, c.message) }
    for (const s of sonuc) Object.assign(s, govde)
  } else if (req.method === 'DELETE') {
    if (!suzgecler.length) return hata(res, 400, '21000', 'DELETE requires a WHERE clause')
    sonuc = satirlar.filter(uyan)
    tablolar[ad] = satirlar.filter((s) => !uyan(s))
  } else return hata(res, 405, 'PGRST000', 'method')

  const sira = url.searchParams.get('order')
  if (sira) {
    const [kolon, yon] = sira.split(',')[0].split('.')
    sonuc = [...sonuc].sort((a, b) => (String(a[kolon] ?? '') < String(b[kolon] ?? '') ? -1 : String(a[kolon] ?? '') > String(b[kolon] ?? '') ? 1 : 0) * (yon === 'desc' ? -1 : 1))
  }
  const sinir = url.searchParams.get('limit')
  if (sinir) sonuc = sonuc.slice(0, Number(sinir))
  const yazma = req.method !== 'GET' && req.method !== 'HEAD'
  if (yazma && !tercih.includes('return=representation')) return yaz(res, req.method === 'POST' ? 201 : 204)
  if (tekNesne) return sonuc.length === 1 ? yaz(res, 200, sonuc[0]) : hata(res, 406, 'PGRST116', `JSON object requested, multiple (or no) rows returned (${sonuc.length})`)
  return yaz(res, req.method === 'POST' ? 201 : 200, sonuc)
}

// ───────────────────────── server ─────────────────────────
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const parcalar = []
  for await (const p of req) parcalar.push(p)
  const ham = Buffer.concat(parcalar)
  const jsonMu = String(req.headers['content-type'] || '').includes('application/json')
  let g = {}
  if (jsonMu && ham.length) { try { g = JSON.parse(ham.toString('utf8')) } catch { return hata(res, 400, 'PGRST102', 'bad json') } }
  if (!url.pathname.startsWith('/__')) gunluk.push(`${req.method} ${url.pathname}${url.search}`)
  if (req.method === 'OPTIONS') return yaz(res, 204)
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const servisMi = bearer === SERVIS
  const oturumEposta = jetonlar.get(bearer)

  if (url.pathname === '/__gunluk') return yaz(res, 200, gunluk)
  if (url.pathname === '/__depo') return yaz(res, 200, [...depo.keys()])
  if (url.pathname.startsWith('/__tablo/')) return yaz(res, 200, tablo(url.pathname.slice('/__tablo/'.length)))

  // ── auth ──
  if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
    const h = hesaplar[g.email]
    if (!h || h.sifre !== g.password) return yaz(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' })
    const jeton = `jeton-${h.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    jetonlar.set(jeton, g.email)
    return yaz(res, 200, { access_token: jeton, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: `yenile-${h.id}`, user: kullanici(g.email) })
  }
  if (url.pathname === '/auth/v1/user') return oturumEposta ? yaz(res, 200, kullanici(oturumEposta)) : yaz(res, 401, { code: 401, msg: 'invalid JWT' })
  if (url.pathname === '/auth/v1/logout') return yaz(res, 204)
  if (url.pathname === '/auth/v1/admin/users' && req.method === 'POST') {
    if (hesaplar[g.email]) return yaz(res, 422, { code: 422, error_code: 'email_exists', msg: 'A user with this email address has already been registered' })
    const id = `bbbbbbbb-0000-4000-8000-${String(Object.keys(hesaplar).length).padStart(12, '0')}`
    hesaplar[g.email] = { id, sifre: g.password, ulke: g.app_metadata?.country ?? null, dil: g.user_metadata?.ui_language ?? 'tr', ad: g.user_metadata?.full_name ?? '' }
    return yaz(res, 200, kullanici(g.email))
  }
  if (url.pathname.startsWith('/auth/v1/admin/users/') && req.method === 'DELETE') {
    const id = url.pathname.split('/').pop()
    for (const [e, h] of Object.entries(hesaplar)) if (h.id === id) delete hesaplar[e]
    return yaz(res, 200, {})
  }

  // ── functions ──
  if (url.pathname === '/rest/v1/rpc/davet_kodu_kullan') {
    const k = kodlar.get(g.p_hash)
    if (!k || k.ulke !== g.p_ulke || k.kalan < 1) return yaz(res, 200, false)
    k.kalan--
    return yaz(res, 200, true)
  }
  if (url.pathname === '/rest/v1/rpc/ulke_not_onayla') {
    // Closed to the browser roles, as the migration's grants make it.
    if (!servisMi) return hata(res, 401, '42501', 'permission denied for function ulke_not_onayla')
    try { return yaz(res, 200, notOnayla(g)) } catch (e) { return hata(res, 400, 'P0002', String(e.message)) }
  }
  // NOTYA-ULKE-PORTAL-01 — the functions of migrations 136 and 137: server only, as their grants make them.
  if (url.pathname.startsWith('/rest/v1/rpc/') && Object.prototype.hasOwnProperty.call(ISLEVLER, url.pathname.slice('/rest/v1/rpc/'.length))) {
    const ad = url.pathname.slice('/rest/v1/rpc/'.length)
    if (!servisMi) return hata(res, 401, '42501', `permission denied for function ${ad}`)
    try { return yaz(res, 200, islevCalistir(ad, g)) } catch (e) { return hata(res, e.code === '23P01' || e.code === '23505' ? 409 : 400, e.code || 'P0001', String(e.message)) }
  }
  if (url.pathname === '/rest/v1/rpc/davet_kodu_iade') { const k = kodlar.get(g.p_hash); if (k && k.ulke === g.p_ulke) k.kalan++; return yaz(res, 204) }

  // ── storage ──
  if (url.pathname.startsWith('/storage/v1/object/')) {
    const yol = decodeURIComponent(url.pathname.slice('/storage/v1/object/'.length))
    if (req.method === 'DELETE') {
      if (!servisMi) return yaz(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' })
      for (const p of g.prefixes || []) depo.delete(`${yol}/${p}`)
      return yaz(res, 200, [])
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      // The storage policy of migration 132: a signed-in account writes only under `<its country>/<its own id>/`,
      // and an account without a country stamp writes nothing here.
      const [, ulkeKlasoru, klasor, ...kalan] = yol.split('/')
      const h = oturumEposta ? hesaplar[oturumEposta] : null
      if (!servisMi && (!h || !h.ulke || ulkeKlasoru !== h.ulke || klasor !== h.id || kalan.length !== 1)) return yaz(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' })
      // supabase-js sends a browser Blob as multipart form data: keep the bytes of the one file part.
      let veri = ham
      const tur = String(req.headers['content-type'] || '')
      const sinir = /boundary=([^;]+)/.exec(tur)?.[1]
      let icTur = tur
      if (sinir) {
        const metin = ham.toString('latin1')
        const bas = metin.indexOf('\r\n\r\n', metin.indexOf('filename='))
        const son = metin.lastIndexOf(`\r\n--${sinir}`)
        if (bas > -1 && son > bas) veri = Buffer.from(metin.slice(bas + 4, son), 'latin1')
        icTur = /Content-Type:\s*([^\r\n]+)/i.exec(metin.slice(0, bas))?.[1] ?? 'application/octet-stream'
      }
      depo.set(yol, { tur: icTur, veri })
      return yaz(res, 200, { Key: yol, Id: randomUUID() })
    }
    if (req.method === 'GET') {
      if (!servisMi) return yaz(res, 400, { statusCode: '404', error: 'not_found', message: 'Object not found' })
      const nesne = depo.get(yol)
      if (!nesne) return yaz(res, 400, { statusCode: '404', error: 'not_found', message: 'Object not found' })
      res.writeHead(200, { 'Content-Type': nesne.tur, 'Content-Length': nesne.veri.length, ...cors })
      return res.end(nesne.veri)
    }
  }

  // ── tables ──
  if (url.pathname.startsWith('/rest/v1/')) {
    // The browser never reads tables in these screens: only the server (service role) does.
    if (!servisMi) return hata(res, 401, '42501', 'stand-in: table access without the service role')
    return rest(req, res, url, g)
  }
  yaz(res, 404, { message: `sahte-supabase: ${req.method} ${url.pathname} not implemented` })
}).listen(PORT, '127.0.0.1', () => console.log(`sahte supabase :${PORT}`))
