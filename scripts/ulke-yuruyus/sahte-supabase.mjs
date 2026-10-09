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
 *             (eq, neq, in, gte, gt, lt, lte, is.null, not.is.null), order, limit, single-object answers, the two
 *             invitation-code functions, and (NOTYA-UZ-RANDEVU-01) what migration 135 puts in the database: the
 *             no-double-booking constraint of `ulke_randevulari` and the function `ulke_not_onayla`. An operator it does not know is an ERROR (400) — it never ignores a filter,
 *             because an ignored filter would make a broken ownership check look fine.
 *             NOTYA-ULKE-PORTAL-01: what migrations 136 and 137 put in the database — the usage record's function, the
 *             six functions of the patient portal (each all-or-nothing), and the constraints a statement meets there
 *             (a summary only for an approved note of that patient, one per note; one unanswered request per patient).
 *             NOTYA-ULKE-INTAKE-01: what migration 138 puts in the database — the checks of `ulke_hasta_formlari` (state
 *             and its moment, answers only with consent, one open form per patient, the appointment is that patient's),
 *             its trigger (a form never moves, its question set is fixed, submitted answers do not change) and the
 *             function `ulke_hasta_formu_iste`.
 *             NOTYA-ULKE-MESAJ-01: what migrations 140–142 put in the database, as far as a walk-through can meet it —
 *             a conversation, a message and a consultation belong to a patient of that doctor; one open conversation
 *             per patient; a closed conversation takes no message; a message's text never changes and it is read
 *             once; a template has no patient and a deleted one does not change; one consultation code per account,
 *             no two accounts with the same; a consultation's question and copy never change, it is answered once
 *             and closed once. (The full rules are proved on a real PostgreSQL: scripts/ulke-goc-kaniti.mjs.)
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
  if (ham.startsWith('lte.')) return (s) => String(s[kolon] ?? '') <= ham.slice(4)
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
  // NOTYA-ULKE-MESAJ-01 — migrations 141 and 142: the two tables that hold NO patient (a template, a consultation code).
  const hesapVar = (id) => tablo('ulke_hesaplari').some((h) => h.id === id && h.ulke === yeni.ulke)
  if (ad === 'ulke_hekim_sablonlari') {
    if ('patient_id' in yeni) return kisitHatasi('42703', 'column "patient_id" of relation "ulke_hekim_sablonlari" does not exist')
    if (!hesapVar(yeni.doctor_id)) return kisitHatasi('23503', 'insert or update on table "ulke_hekim_sablonlari" violates foreign key constraint "ulke_hekim_sablonlari_hesap_fk"')
    if (!['not', 'mesaj', 'hepsi'].includes(String(yeni.kapsam)) || typeof yeni.icerik_encrypted !== 'string' || !yeni.icerik_encrypted) return kisitHatasi('23514', 'new row for relation "ulke_hekim_sablonlari" violates check constraint')
    return null
  }
  if (ad === 'ulke_konsultasyon_kodlari') {
    if (!hesapVar(yeni.doctor_id)) return kisitHatasi('23503', 'insert or update on table "ulke_konsultasyon_kodlari" violates foreign key constraint "ulke_konsultasyon_kodlari_hesap_fk"')
    if (typeof yeni.kod_hash !== 'string' || !/^[0-9a-f]{64}$/.test(yeni.kod_hash) || !yeni.kod_encrypted) return kisitHatasi('23514', 'new row for relation "ulke_konsultasyon_kodlari" violates check constraint')
    if (digerleri.some((x) => x.ulke === yeni.ulke && x.doctor_id === yeni.doctor_id)) return kisitHatasi('23505', 'duplicate key value violates unique constraint "ulke_konsultasyon_kodlari_hesap_tekil"')
    if (digerleri.some((x) => x.ulke === yeni.ulke && x.kod_hash === yeni.kod_hash)) return kisitHatasi('23505', 'duplicate key value violates unique constraint "ulke_konsultasyon_kodlari_kod_tekil"')
    return null
  }
  if (!['ulke_hasta_ozetleri', 'ulke_portal_erisimleri', 'ulke_portal_oturumlari', 'ulke_portal_kayitlari', 'ulke_randevu_istekleri', 'ulke_hasta_formlari', 'ulke_arac_kayitlari', 'ulke_mesaj_yazismalari', 'ulke_hasta_mesajlari', 'ulke_konsultasyonlar'].includes(ad)) return null
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
  // NOTYA-ULKE-MESAJ-01 — migration 140: one open conversation per patient; a message belongs to a conversation of that
  // patient and that doctor, and (the insert half of the trigger) a closed conversation takes none.
  const yeniSatir = !digerleri.includes(yeni) && !tablo(ad).some((x) => x.id === yeni.id)
  if (ad === 'ulke_mesaj_yazismalari' && !yeni.kapandi_at && digerleri.some((x) => x.ulke === yeni.ulke && x.doctor_id === yeni.doctor_id && x.patient_id === yeni.patient_id && !x.kapandi_at)) return kisitHatasi('23505', 'duplicate key value violates unique constraint "ulke_mesaj_yazismalari_tek_acik"')
  if (ad === 'ulke_hasta_mesajlari') {
    if (!['hekim', 'hasta'].includes(String(yeni.gonderen)) || typeof yeni.metin_encrypted !== 'string' || !yeni.metin_encrypted) return kisitHatasi('23514', 'new row for relation "ulke_hasta_mesajlari" violates check constraint')
    const y = tablo('ulke_mesaj_yazismalari').find((x) => x.id === yeni.yazisma_id && x.ulke === yeni.ulke && x.doctor_id === yeni.doctor_id && x.patient_id === yeni.patient_id)
    if (!y) return kisitHatasi('23503', 'insert or update on table "ulke_hasta_mesajlari" violates foreign key constraint "ulke_hasta_mesajlari_yazisma_fk"')
    if (yeniSatir && (y.kapandi_at || yeni.okundu_at)) return kisitHatasi('23514', 'ulke_hasta_mesajlari: a closed conversation takes no message, and a message is written unread')
  }
  // NOTYA-ULKE-MESAJ-01 — migration 142: the consulted doctor is an account of this country and not the asking one;
  // what was shared and its copy go together; an approved note of that patient; the consent stamp and the period.
  if (ad === 'ulke_konsultasyonlar') {
    if (!tablo('ulke_hesaplari').some((h) => h.id === yeni.danisilan_id && h.ulke === yeni.ulke)) return kisitHatasi('23503', 'insert or update on table "ulke_konsultasyonlar" violates foreign key constraint "ulke_konsultasyonlar_danisilan_fk"')
    if (yeni.doctor_id === yeni.danisilan_id || !['yok', 'not', 'ozet'].includes(String(yeni.paylasim_turu)) || !yeni.soru_encrypted) return kisitHatasi('23514', 'new row for relation "ulke_konsultasyonlar" violates check constraint')
    if ((yeni.paylasim_turu === 'yok') !== !yeni.paylasim_encrypted || (yeni.paylasim_turu === 'yok') !== !yeni.note_id) return kisitHatasi('23514', 'new row for relation "ulke_konsultasyonlar" violates check constraint (what was shared and its copy)')
    if (!yeni.riza_surumu || !yeni.riza_at || !yeni.son_gecerlilik) return kisitHatasi('23502', 'new row for relation "ulke_konsultasyonlar" has no consent stamp, no consent moment or no period')
    if (!yeni.cevap_encrypted !== !yeni.cevap_at || !yeni.kapandi_at !== !yeni.erisim_bitis) return kisitHatasi('23514', 'new row for relation "ulke_konsultasyonlar" violates check constraint (an answer and its moment; closing and the end of reading)')
    if (yeniSatir) {
      if (yeni.note_id) {
        const n = tablo('ulke_notlar').find((x) => x.id === yeni.note_id && x.doctor_id === yeni.doctor_id && x.ulke === yeni.ulke)
        const m = n ? tablo('ulke_muayeneler').find((x) => x.id === n.session_id && x.doctor_id === n.doctor_id && x.ulke === n.ulke) : null
        if (!n || !m || m.patient_id !== yeni.patient_id || !n.approved_at) return kisitHatasi('23514', 'ulke_konsultasyonlar: only an approved note of this patient is shared')
      }
      if (yeni.okundu_at || yeni.cevap_at || yeni.kapandi_at) return kisitHatasi('23514', 'ulke_konsultasyonlar: a consultation begins unread, unanswered and open')
    }
  }
  // NOTYA-ULKE-ARACLAR-01 — migration 139: the checks of ulke_arac_kayitlari.
  if (ad === 'ulke_arac_kayitlari') {
    if (typeof yeni.arac !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(yeni.arac) || yeni.arac.length > 60) return kisitHatasi('23514', 'new row for relation "ulke_arac_kayitlari" violates check constraint (arac)')
    if (typeof yeni.kayit_encrypted !== 'string' || !yeni.kayit_encrypted) return kisitHatasi('23514', 'new row for relation "ulke_arac_kayitlari" has no content (kayit_encrypted)')
    if (yeni.kapandi_at && !yeni.takip_tarihi) return kisitHatasi('23514', 'new row for relation "ulke_arac_kayitlari" violates check constraint (a follow-up that does not exist cannot be closed)')
  }
  // NOTYA-ULKE-INTAKE-01 — migration 138: the checks of ulke_hasta_formlari, its appointment key and "one open form".
  if (ad === 'ulke_hasta_formlari') {
    const d = String(yeni.durum ?? 'bekliyor')
    const acik = (x) => ['bekliyor', 'taslak'].includes(String(x.durum ?? 'bekliyor'))
    if (!['bekliyor', 'taslak', 'gonderildi', 'iptal'].includes(d)) return kisitHatasi('23514', 'new row for relation "ulke_hasta_formlari" violates check constraint (durum)')
    if ((d === 'gonderildi') !== Boolean(yeni.gonderildi_at) || (d === 'iptal') !== Boolean(yeni.iptal_at)) return kisitHatasi('23514', 'new row for relation "ulke_hasta_formlari" violates check constraint (state and its moment)')
    if (yeni.cevaplar_encrypted && !(yeni.riza_at && yeni.riza_surumu && yeni.dil)) return kisitHatasi('23514', 'new row for relation "ulke_hasta_formlari" violates check constraint (answers without consent)')
    if ((d === 'gonderildi' && !yeni.cevaplar_encrypted) || (d === 'bekliyor' && yeni.cevaplar_encrypted)) return kisitHatasi('23514', 'new row for relation "ulke_hasta_formlari" violates check constraint (answers and state)')
    if (yeni.randevu_id && !tablo('ulke_randevulari').some((r) => r.id === yeni.randevu_id && r.ulke === yeni.ulke && r.doctor_id === yeni.doctor_id && r.patient_id === yeni.patient_id)) return kisitHatasi('23503', 'insert or update on table "ulke_hasta_formlari" violates foreign key constraint "ulke_hasta_formlari_randevu_fk"')
    if (acik(yeni) && digerleri.some((x) => x.ulke === yeni.ulke && x.doctor_id === yeni.doctor_id && x.patient_id === yeni.patient_id && acik(x))) return kisitHatasi('23505', 'duplicate key value violates unique constraint "ulke_hasta_formlari_tek_acik"')
  }
  return null
}
/**
 * NOTYA-ULKE-INTAKE-01 — the TRIGGER of migration 138 (`ulke_hasta_formu_kilidi`), which sees the row as it was and as
 * it would be: a form never moves; its question set is fixed; a withdrawn form does not change; a submitted form's
 * answers do not change (it can only be reopened).
 */
function formKilidi(ad, eski, yeni) {
  const farkli = (k) => (eski[k] ?? null) !== (yeni[k] ?? null)
  // NOTYA-ULKE-MESAJ-01 — the triggers of migrations 140, 141 and 142, as far as the application can meet them.
  if (ad === 'ulke_mesaj_yazismalari') return farkli('ulke') || farkli('doctor_id') || farkli('patient_id') || (eski.kapandi_at && farkli('kapandi_at')) ? kisitHatasi('23514', 'ulke_mesaj_yazismalari: a conversation never moves, and a closed one stays closed') : null
  if (ad === 'ulke_hasta_mesajlari') return ['ulke', 'doctor_id', 'patient_id', 'yazisma_id', 'gonderen', 'metin_encrypted', 'created_at'].some(farkli) || (eski.okundu_at && farkli('okundu_at')) ? kisitHatasi('23514', 'ulke_hasta_mesajlari: a message does not change; it is read once') : null
  if (ad === 'ulke_hekim_sablonlari') return farkli('ulke') || farkli('doctor_id') || eski.silindi_at ? kisitHatasi('23514', 'ulke_hekim_sablonlari: a template never moves, and a deleted one does not change') : null
  if (ad === 'ulke_konsultasyon_kodlari') return farkli('ulke') || farkli('doctor_id') ? kisitHatasi('23514', 'ulke_konsultasyon_kodlari: a code never moves to another country or account') : null
  if (ad === 'ulke_konsultasyonlar') {
    if (['ulke', 'doctor_id', 'patient_id', 'danisilan_id', 'note_id', 'paylasim_turu', 'soru_encrypted', 'paylasim_encrypted', 'riza_surumu', 'riza_at', 'son_gecerlilik', 'created_at'].some(farkli)) return kisitHatasi('23514', 'ulke_konsultasyonlar: who asked whom about whom, the question, the copy, the consent and the period do not change')
    if ((eski.okundu_at && farkli('okundu_at')) || (eski.cevap_at && (farkli('cevap_at') || farkli('cevap_encrypted'))) || (eski.kapandi_at && (farkli('kapandi_at') || farkli('erisim_bitis')))) return kisitHatasi('23514', 'ulke_konsultasyonlar: read once, answered once, closed once')
    if (eski.kapandi_at && farkli('cevap_at')) return kisitHatasi('23514', 'ulke_konsultasyonlar: a closed consultation takes no answer')
    return null
  }
  if (ad !== 'ulke_hasta_formlari' && ad !== 'ulke_arac_kayitlari') return null
  // NOTYA-ULKE-ARACLAR-01 — the trigger of migration 139 (`ulke_arac_kaydi_kilidi`).
  if (ad === 'ulke_arac_kayitlari') {
    if (farkli('ulke') || farkli('doctor_id') || farkli('patient_id')) return kisitHatasi('23514', 'ulke_arac_kayitlari: a record never moves to another country, doctor or patient')
    if (farkli('arac') || farkli('kayit_encrypted') || farkli('takip_tarihi') || farkli('created_at')) return kisitHatasi('23514', 'ulke_arac_kayitlari: the tool, the content and the follow-up day of a record do not change; a new result is a new record')
    if (eski.kapandi_at && farkli('kapandi_at')) return kisitHatasi('23514', 'ulke_arac_kayitlari: a follow-up that was closed stays closed')
    return null
  }
  if (farkli('ulke') || farkli('doctor_id') || farkli('patient_id')) return kisitHatasi('23514', 'ulke_hasta_formlari: a form never moves to another country, doctor or patient')
  if (farkli('rol') || farkli('soru_surumu') || farkli('veli')) return kisitHatasi('23514', 'ulke_hasta_formlari: the question set of a form is fixed when it is asked for')
  if (eski.durum === 'iptal') return kisitHatasi('23514', 'ulke_hasta_formlari: a withdrawn form does not change')
  if (eski.durum === 'gonderildi') {
    if (!['gonderildi', 'taslak'].includes(String(yeni.durum))) return kisitHatasi('23514', 'ulke_hasta_formlari: a submitted form is not withdrawn')
    if (farkli('cevaplar_encrypted') || farkli('dil') || farkli('riza_surumu') || farkli('riza_at')) return kisitHatasi('23514', 'ulke_hasta_formlari: the answers of a submitted form do not change; the doctor reopens the form')
  }
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
  // lib/db/migrations/138_ulke_hasta_formu.sql — ulke_hasta_formu_iste: the form, and the patient's link where there is none, in one step.
  ulke_hasta_formu_iste: (a) => {
    const bu = (x) => x.ulke === a.p_ulke && x.doctor_id === a.p_doctor_id && x.patient_id === a.p_patient_id
    if (!tablo('ulke_hastalar').some((h) => h.id === a.p_patient_id && h.doctor_id === a.p_doctor_id && h.ulke === a.p_ulke)) return { durum: 'NOT_FOUND' }
    if (a.p_randevu_id != null && !tablo('ulke_randevulari').some((r) => r.id === a.p_randevu_id && r.patient_id === a.p_patient_id && r.doctor_id === a.p_doctor_id && r.ulke === a.p_ulke)) return { durum: 'NOT_FOUND' }
    const calisan = tablo('ulke_portal_erisimleri').some((e) => bu(e) && !e.iptal_at && !e.kilitlendi_at && String(e.son_gecerlilik) > String(a.p_simdi))
    const yeniBaglanti = !calisan || a.p_yeni_baglanti === true
    if (yeniBaglanti && (a.p_token_hash == null || a.p_pin_hash == null || a.p_son_gecerlilik == null)) return { durum: 'GECERSIZ' }
    let form = tablo('ulke_hasta_formlari').find((f) => bu(f) && ['bekliyor', 'taslak'].includes(String(f.durum)))
    let yeni = false
    if (!form) {
      form = islevdeEkle('ulke_hasta_formlari', { ulke: a.p_ulke, doctor_id: a.p_doctor_id, patient_id: a.p_patient_id, randevu_id: a.p_randevu_id ?? null, rol: a.p_rol ?? null, soru_surumu: a.p_soru_surumu, veli: a.p_veli === true, durum: 'bekliyor', cevaplar_encrypted: null, dil: null, riza_surumu: null, riza_at: null, gonderildi_at: null, yeniden_acildi_at: null, iptal_at: null, created_at: a.p_simdi, updated_at: a.p_simdi })
      yeni = true
    } else if (a.p_randevu_id != null && form.randevu_id !== a.p_randevu_id) Object.assign(form, { randevu_id: a.p_randevu_id, updated_at: a.p_simdi })
    if (yeniBaglanti) ISLEVLER.ulke_portal_erisim_ver({ p_ulke: a.p_ulke, p_doctor_id: a.p_doctor_id, p_patient_id: a.p_patient_id, p_token_hash: a.p_token_hash, p_pin_hash: a.p_pin_hash, p_son_gecerlilik: a.p_son_gecerlilik, p_simdi: a.p_simdi })
    return { durum: 'TAMAM', form_id: form.id, yeni_form: yeni, erisim: yeniBaglanti ? 'YENI' : 'VAR' }
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
    for (const s of sonuc) { const c = formKilidi(ad, s, { ...s, ...govde }); if (c) return hata(res, 409, c.code, c.message) }
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
