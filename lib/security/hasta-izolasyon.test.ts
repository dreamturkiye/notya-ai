/**
 * HASTA-İZOLASYON — çapraz-doktor regresyon paketi (HASTA-IZOLASYON-01).
 *
 * Kural: bir doktor başka bir doktorun hastasını ASLA göremez, listeleyemez, arayamaz, değiştiremez —
 * tersi de. Bu dosya o kuralı GERÇEK route handler'ları üzerinde, iki sentetik doktorla (A ve B, her
 * birinin kendi sentetik hastası ve verisi) her iki yönde sınar. Yalnız veritabanı/oturum/depolama
 * sahtedir (lib/security/testing/sahteSupabase.ts); yetki kontrolü, sorgular ve yanıtlar gerçek koddur.
 *
 * Her vaka üç kez koşar:
 *   • pozitif  — A kendi kimlikleriyle: 2xx döner (ve okumada A'nın işareti yanıtta, yazmada yazı oluşur).
 *                Harness'ın rotayı gerçekten çalıştırdığının kanıtı — çöken bir rota "izole" sayılamaz.
 *   • A → B    — A'nın token'ı, B'nin kimlikleri.
 *   • B → A    — tersi.
 * Çapraz koşularda şu değişmezler aranır:
 *   1. Yanıt gövdesinde kurbanın işareti (GIZLI-<harf>) YOK.
 *   2. Kurbanın sahip olduğu her satır bayt bayt aynı; kurbanın herhangi bir kimliğine atıf yapan YENİ
 *      satır yok (yabancı hastaya yazı = ihlal).
 *   3. Yapay zekâ bağlamına kurbanın işareti girmedi.
 *   4. (red: 404 olan vakalarda) yanıt 404.
 *
 * Sentetik veri — gerçek hasta, gerçek hesap, production yok. Yeni bir route hasta/not/seans kimliği
 * alıyorsa buraya bir vaka eklenir: .cursor/skills/hasta-izolasyon/SKILL.md.
 *
 *   npm test   (bu dosya --experimental-test-module-mocks ile koşar)
 */
import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani, type Satir } from './testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-izolasyon-anahtari'
process.env.PORTAL_TOKEN_SECRET = 'qa-sentetik-portal-sirri'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sahte-anon-anahtari'
process.env.ANTHROPIC_API_KEY = 'sahte'

// ─── Sahte altyapı ──────────────────────────────────────────────────────────────────────────────
let db = new SahteVeritabani()
/** Every klinikBaglam the (mocked) SOAP generator received — must never carry a foreign marker. */
const aiBaglamlari: string[] = []

const KOK = resolve(__dirname, '../..')
const yerel = (yol: string) => pathToFileURL(join(KOK, yol)).href

// Clients are created per request AND at module scope (hasta-portali) — delegate to the live db.
function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => c().from(t),
    auth: { getUser: (j?: string) => c().auth.getUser(j), admin: { updateUserById: async () => ({ data: null, error: null }) } },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
  }
}
// ESM and CJS entries are separate module instances (see scripts/qa-onay-sonrasi-donus.mts) — mock both.
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
/** Every request any route sent to the (mocked) Claude API — a foreign patient must never appear in one. */
const modelIstekleri: string[] = []
class SahteAnthropic {
  messages = {
    create: async (istek: unknown) => {
      modelIstekleri.push(JSON.stringify(istek))
      return { content: [{ type: 'text', text: JSON.stringify({ speech: 'Sentetik yanıt', action: null }) }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }
    },
  }
}
{
  // package.json is not in the SDK's "exports" — resolve the entry and read it from that directory.
  const kok = dirname(require.resolve('@anthropic-ai/sdk'))
  const pkg = JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as Record<string, any>
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.require, pkg.exports?.['.']?.import?.default, pkg.exports?.['.']?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter((x) => typeof x === 'string').map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { defaultExport: SahteAnthropic })
  }
}
const SAHTE_AI_JSON = JSON.stringify({ taniVeTedavi: 'Sentetik', taburcuOzeti: 'Sentetik', yorum: 'Sentetik', sevkOnerisi: false, tip: '', icerik: '', tarih: '', testler: [] })
mock.module(yerel('lib/dr-ayse/groq.ts'), { namedExports: { groqChat: async () => SAHTE_AI_JSON } })
mock.module(yerel('lib/doktor/soapUret.ts'), {
  namedExports: {
    soapNotuUret: async (_c: unknown, girdi: { klinikBaglam?: string }) => {
      aiBaglamlari.push(String(girdi?.klinikBaglam || ''))
      return { soap: { subjektif: 'Sentetik S', objektif: 'Sentetik O', degerlendirme: 'Sentetik D', plan: 'Sentetik P' }, tani: 'Sentetik' }
    },
    stilOrnekleriDerle: () => '',
    stilProfiliDamit: async () => '',
    dozKilitliBrans: () => false,
  },
})
mock.module(yerel('lib/doktor/hizLimiti.ts'), { namedExports: { aiKotaKullan: async () => ({ izin: true }), KOTA_MESAJI: 'kota', KOVA_LIMITLERI: {} } })
mock.module(yerel('lib/alarm.ts'), { namedExports: { kritikAlarm: async () => undefined } })
mock.module(yerel('lib/transcription/deepgramClient.ts'), { namedExports: { createDeepgramToken: async () => ({ token: 'sahte', expires_at: new Date(Date.now() + 3600e3).toISOString() }) } })
mock.module(yerel('lib/doktor/twilioNotify.ts'), { namedExports: { sendTwilioMessage: async () => ({ ok: true, sid: 'sahte' }), normalizeTrPhoneE164: (x: string) => x } })
mock.module(yerel('lib/mail/resend.ts'), { namedExports: { sendResendEmail: async () => ({ ok: true }) } })

// No network, ever. The one allowed call is the speech-to-text step of ses-yukle (synthetic transcript).
globalThis.fetch = (async (girdi: unknown) => {
  if (String(girdi).includes('api.elevenlabs.io')) {
    return new Response(JSON.stringify({ text: 'Sentetik QA transkripti: üç gündür öksürük, ateş yok, iştah iyi, uyku düzenli, aşıları tam.' }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  throw new Error(`hasta-izolasyon testi ağ erişimi yapamaz: ${String(girdi)}`)
}) as typeof fetch

// ─── Sentetik sahne ─────────────────────────────────────────────────────────────────────────────
type Harf = 'A' | 'B'
type Hekim = {
  harf: Harf; id: string; token: string
  hasta: string; seans: string; not: string; bekleyenNot: string; ilac: string; panel: string; belge: string
  randevu: string; serbestRandevu: string; hastaDerm: string; lezyon: string; dogum: string; bebekKart: string
  portalToken: string; konu: string; asistanEylem: string
  /** GOZ-EXCEPTIONAL-01: göz OCT görüntüsü + fundus Belge analizi (dual-sign köprüsü) */
  gozGoruntu: string; belgeAnaliz: string
  /** DERM-EXCEPTIONAL-01: dermatoskopi Belge analizi (derm dual-sign köprüsü) */
  dermAnaliz: string
  /** Rows THIS doctor filed under the OTHER doctor's patient — the contamination a pre-fix IDOR left behind. */
  hileliSeans: string; hileliNot: string
}
const isaret = (h: Harf) => `GIZLI-${h}-7Q`

let encrypt: (s: string) => string
let decrypt: (s: string) => string

/** Turkey is UTC+3 all year — a fixed point inside "today" in Turkish time, whatever the host clock. */
function trGun(gunKaydir: number, saat: number): string {
  const simdiTr = new Date(Date.now() + 3 * 3600e3)
  const gunBasiUtc = Date.UTC(simdiTr.getUTCFullYear(), simdiTr.getUTCMonth(), simdiTr.getUTCDate()) - 3 * 3600e3
  return new Date(gunBasiUtc + gunKaydir * 86400e3 + saat * 3600e3).toISOString()
}
const dakikaSonra = (iso: string, dk: number) => new Date(new Date(iso).getTime() + dk * 60e3).toISOString()

function hekimKur(harf: Harf): Hekim {
  const m = isaret(harf)
  const id = randomUUID()
  const token = `qa-sentetik-token-${harf}`
  db.kullanicilar.set(token, { id, email: `qa-hekim-${harf.toLowerCase()}@ornek.test` })
  db.ekle('users', { id, full_name: `QA Hekim ${harf}`, email: `qa-hekim-${harf.toLowerCase()}@ornek.test`, specialty: 'pediatri', subscription_tier: 'pro', monthly_session_count: 0, recete_baslik: {} })
  const hasta = db.ekle('patients', {
    doctor_id: id, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: `QA Hasta ${harf} ${m}` })),
    dob_encrypted: encrypt('2019-03-01'), gender_encrypted: encrypt('female'),
    phone_encrypted: encrypt(harf === 'A' ? '05550000001' : '05550000002'),
    email_encrypted: encrypt(`qa-hasta-${harf.toLowerCase()}@ornek.test`),
    notes_encrypted: encrypt(JSON.stringify({ sehir: `Sehir ${m}` })),
  }).id
  const dun = new Date(Date.now() - 86400e3).toISOString()
  const seans = db.ekle('sessions', { doctor_id: id, patient_id: hasta, specialty: 'pediatri', status: 'completed', created_at: dun }).id
  const not = db.ekle('notes', { session_id: seans, doctor_id: id, note_type: 'soap', approved_at: dun, created_at: dun, content_plan: `Plan ${m}`, content_tani: `Tani ${m}`, content_subjektif: `Sikayet ${m}`, basvuru_yakinmasi: `Yakinma ${m}`, content_ilaclar: [], vitaller: {} }).id
  const seans2 = db.ekle('sessions', { doctor_id: id, patient_id: hasta, specialty: 'pediatri', status: 'completed' }).id
  const bekleyenNot = db.ekle('notes', { session_id: seans2, doctor_id: id, note_type: 'soap', approved_at: null, content_plan: `Bekleyen ${m}`, content_ilaclar: [], vitaller: {} }).id
  const ilac = db.ekle('hasta_ilaclar', { doctor_id: id, patient_id: hasta, ilac_adi: `Ilac ${m}`, etken_madde: 'sentetik', doz: '1', kullanim_sikli: '1x1', baslangic_tarihi: '2026-09-01', aktif: true, onay_durumu: 'onayli' }).id
  db.ekle('hasta_lab_sonuclari', { doctor_id: id, patient_id: hasta, lab_adi: `Lab ${m}`, testler: [{ ad: 'Hb', deger: '12', birim: 'g/dL' }], sonuc_tarihi: '2026-09-10' })
  const belge = randomUUID()
  const panel = db.ekle('lab_paneller', { doctor_id: id, patient_id: hasta, belge_id: belge, lab_adi: `Panel ${m}`, durum: 'cikarildi', panel_type: 'genel', kaynaklar: [] }).id
  db.ekle('lab_satirlar', { panel_id: panel, patient_id: hasta, doctor_id: id, sira: 0, raw_name: `Satir ${m}`, canonical_key: 'Hb', value_num: 12 })
  const randevu = db.ekle('randevular', { doktor_id: id, patient_id: hasta, baslangic: trGun(0, 10), bitis: dakikaSonra(trGun(0, 10), 20), durum: 'planlandi', tur: 'muayene', notlar: `Randevu ${m}` }).id
  const serbestRandevu = db.ekle('randevular', { doktor_id: id, patient_id: null, hasta_adi_serbest: `Serbest ${m}`, baslangic: trGun(1, 11), bitis: dakikaSonra(trGun(1, 11), 20), durum: 'planlandi', tur: 'muayene' }).id
  const hastaDerm = db.ekle('hasta_derm', { patient_id: hasta, doctor_id: id, unit: 'genel', visit_type: 'genel-poliklinik' }).id
  const lezyon = db.ekle('derm_lezyonlar', { hasta_derm_id: hastaDerm, region: `Bolge ${m}`, morphology: 'unspecified', resmi_tani: null }).id
  const dogum = db.ekle('dogum_olaylari', { doctor_id: id, patient_id: hasta, gebelik_id: null }).id
  const bebekKart = db.ekle('bebek_kartlari', { doctor_id: id, anne_patient_id: hasta, bebek_patient_id: null, dogum_id: dogum, komplikasyonlar: [], gorevler: [] }).id
  const portalToken = `qa-portal-${harf}`
  db.ekle('hasta_portal_tokens', { token_hash: portalToken, doctor_id: id, patient_id: hasta, expires_at: new Date(Date.now() + 30 * 86400e3).toISOString(), pin_hash: 'sentetik' })
  const konu = db.ekle('hasta_mesaj_konulari', { doctor_id: id, patient_id: hasta, konu: `Konu ${m}`, son_mesaj_at: new Date().toISOString(), okundu_pratik: true, okundu_hasta: true, pratik_arsiv: false, hasta_klasor: 'gelen' }).id
  db.ekle('hasta_mesajlar', { konu_id: konu, taraf: 'doktor', yazar_user_id: id, metin: `Mesaj ${m}` })
  const asistanEylem = db.ekle('asistan_actions', { doctor_id: id, action_type: 'ADD_NOTE_CONTENT', was_corrected: false }).id
  db.ekle('hasta_goruntulemeler', { doctor_id: id, patient_id: hasta, modalite: 'xray', rapor_metni: `Goruntu ${m}`, goruntuleme_tarihi: '2026-09-01', dosya_url: 'https://sahte.supabase.test/x' })
  db.ekle('kadin_sagligi', { doctor_id: id, patient_id: hasta, notlar: `KS ${m}` })
  // KD kohort (Araçlar): synthetic lohusa episode — delivered 4 days ago, no lohusa izlem → 'lohusa_1hf' row for this doctor only
  db.ekle('gebelikler', { doctor_id: id, patient_id: hasta, durum: 'tamamlandi', sat: new Date(Date.now() - 284 * 86400e3).toISOString().slice(0, 10), dogum_tarihi: new Date(Date.now() - 4 * 86400e3).toISOString().slice(0, 10), created_at: new Date(Date.now() - 200 * 86400e3).toISOString() })
  db.ekle('goz_kontroller', { doctor_id: id, patient_id: hasta, tarih: '2026-01-05', neden: `Goz kontrol ${m}`, dilatasyon: false, durum: 'planli' })
  const gozGoruntu = db.ekle('hasta_goruntulemeler', { doctor_id: id, patient_id: hasta, modalite: 'oct', vucut_bolgesi: 'sag', rapor_metni: `OCT ${m}`, goruntuleme_tarihi: '2026-09-01', dosya_url: 'https://sahte.supabase.test/oct' }).id
  const belgeAnaliz = db.ekle('belge_analizleri', { belge_id: belge, doctor_id: id, patient_id: hasta, brans: 'goz', modality_final: 'fundus', durum: 'taslak', de_id_hash: 'sentetik', engine_set: 'tierA-v1', motor_ciktilari: [], fusion: { capPct: 85 }, sonuc: { modalite: 'Fundus', kalite: 'iyi', ozet: `Ozet ${m}`, bulgular: [], tanilar: [], acil_bayrak: false, oneri: '', sinirlar: [], hekim_tanisi: [], engines_used: [] } }).id
  const dermAnaliz = db.ekle('belge_analizleri', { belge_id: belge, doctor_id: id, patient_id: hasta, brans: 'dermatoloji', modality_final: 'dermatoskopi', durum: 'taslak', de_id_hash: 'sentetik', engine_set: 'tierA-v1', motor_ciktilari: [], fusion: { capPct: 85 }, sonuc: { modalite: 'Dermatoskopi', kalite: 'iyi', ozet: `Derm ozet ${m}`, bulgular: [], tanilar: [], acil_bayrak: false, oneri: '', sinirlar: [], hekim_tanisi: [], engines_used: [] } }).id
  db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: `Asi ${m}`, kategori: 'pediatrik', uygulama_tarihi: '2026-01-01' })
  // Pediatri kohort (Araçlar): bir ulusal takvim kaydı → 7 yaşındaki sentetik hastada gecikmiş doz bayrağı (yalnız bu hekimde)
  db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: 'KKK (Kızamık-Kızamıkçık-Kabakulak)', doz_no: 1, kategori: 'pediatrik', uygulama_tarihi: '2020-03-05', kaynak: 'kayit' })
  db.dosyaKoy('ses-kayitlari', `${id}/qa-kayit.m4a`, new Blob(['sentetik ses']))
  return { harf, id, token, hasta, seans, not, bekleyenNot, ilac, panel, belge, randevu, serbestRandevu, hastaDerm, lezyon, dogum, bebekKart, portalToken, konu, asistanEylem, gozGoruntu, belgeAnaliz, dermAnaliz, hileliSeans: '', hileliNot: '' }
}

/** Contamination X planted under Y's patient before the fixes (anon-key session insert, unchecked POSTs). */
function hileliKur(x: Hekim, y: Hekim) {
  const m = isaret(x.harf)
  x.hileliSeans = db.ekle('sessions', { doctor_id: x.id, patient_id: y.hasta, specialty: 'pediatri', status: 'recording' }).id
  x.hileliNot = db.ekle('notes', { session_id: x.hileliSeans, doctor_id: x.id, note_type: 'soap', approved_at: null, content_plan: `Hileli ${m}`, content_ilaclar: [{ ad: x.harf === 'A' ? 'Zyxorin 250 mg' : 'Qwavelin 100 mg', doz: '1', kullanim: '1x1', sure: '5 gün' }], vitaller: {} }).id
  db.ekle('randevular', { doktor_id: x.id, patient_id: y.hasta, baslangic: trGun(0, 12), bitis: dakikaSonra(trGun(0, 12), 20), durum: 'planlandi', tur: 'muayene', notlar: `Hileli ${m}` })
  db.ekle('hasta_ilaclar', { doctor_id: x.id, patient_id: y.hasta, ilac_adi: `Hileli ilac ${m}`, etken_madde: 'x', doz: '1', kullanim_sikli: '1x1', baslangic_tarihi: '2026-09-01', aktif: true, onay_durumu: 'onayli' })
}

function sahneKur(): { A: Hekim; B: Hekim } {
  db = new SahteVeritabani()
  aiBaglamlari.length = 0
  modelIstekleri.length = 0
  const A = hekimKur('A'), B = hekimKur('B')
  hileliKur(A, B); hileliKur(B, A)
  return { A, B }
}

// ─── Kurban anlık görüntüsü ─────────────────────────────────────────────────────────────────────
const SAHIP_KOLONLARI = ['doctor_id', 'doktor_id', 'user_id']
/** Every row the victim owns, plus owner-less child rows hanging off them (lesions, thread messages). */
function kurbanSatirlari(k: Hekim): Satir[] {
  const out: Satir[] = []
  const sahipIdleri = new Set<string>([k.id])
  for (const [ad, satirlar] of db.tablolar) {
    for (const r of satirlar) {
      if ((ad === 'users' && r.id === k.id) || SAHIP_KOLONLARI.some((c) => r[c] === k.id)) { out.push({ __t: ad, ...r }); sahipIdleri.add(String(r.id)) }
    }
  }
  for (const [ad, satirlar] of db.tablolar) {
    for (const r of satirlar) {
      if (SAHIP_KOLONLARI.some((c) => c in r)) continue
      if (Object.entries(r).some(([c, v]) => c !== 'id' && typeof v === 'string' && sahipIdleri.has(v))) out.push({ __t: ad, ...r })
    }
  }
  return out
}
function anlikGoruntu(k: Hekim) {
  const sahip = kurbanSatirlari(k)
  const kimlikler = new Set(sahip.map((r) => String(r.id)).concat(k.id))
  const atiflar = new Set<string>()
  for (const [ad, satirlar] of db.tablolar) {
    for (const r of satirlar) {
      if (sahip.some((s) => s.__t === ad && s.id === r.id)) continue
      if (Object.entries(r).some(([c, v]) => c !== 'id' && typeof v === 'string' && kimlikler.has(v))) atiflar.add(`${ad}:${r.id}`)
    }
  }
  return { sahip: JSON.stringify(sahip.sort((a, b) => `${a.__t}${a.id}`.localeCompare(`${b.__t}${b.id}`))), atiflar }
}

// ─── İstek yardımcıları ─────────────────────────────────────────────────────────────────────────
let NextRequestSinifi: typeof import('next/server').NextRequest
function iste(yontem: string, yol: string, o: { token?: string; govde?: unknown; form?: FormData; cerez?: string } = {}) {
  const basliklar: Record<string, string> = {}
  if (o.token) basliklar.authorization = `Bearer ${o.token}`
  if (o.govde !== undefined) basliklar['content-type'] = 'application/json'
  if (o.cerez) basliklar.cookie = o.cerez
  return new NextRequestSinifi(`http://localhost${yol}`, {
    method: yontem, headers: basliklar,
    body: o.form ?? (o.govde !== undefined ? JSON.stringify(o.govde) : undefined),
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
/** Works for both `{ params: { id } }` and `{ params: Promise<{ id }> }` handler signatures. */
const prm = <T extends object>(p: T) => ({ params: Object.assign(Promise.resolve(p), p) })

type Yanit = { status: number; metin: string }
async function coz(r: Response | Promise<Response>): Promise<Yanit> {
  const y = await r
  return { status: y.status, metin: await y.text() }
}

// ─── Vakalar ────────────────────────────────────────────────────────────────────────────────────
type Rotalar = Record<string, any>
type Vaka = {
  ad: string
  /** arayan = whose token; hedef = whose ids are used. */
  cagir: (r: Rotalar, arayan: Hekim, hedef: Hekim) => Promise<Yanit>
  /** Cross-doctor call must answer exactly this. */
  red?: number
  /** Positive: the caller's own marker must appear in the response. */
  okur?: boolean
  /** Positive: the write must have landed on the caller's own data. */
  yazdi?: (arayan: Hekim) => boolean
}
const tablo = (ad: string) => db.tablo(ad)
const trAralik = `baslangic=${encodeURIComponent(trGun(-1, 0))}&bitis=${encodeURIComponent(trGun(3, 0))}`

const VAKALAR: Vaka[] = [
  // Hasta kaydı
  { ad: 'GET /api/doktor/hastalar/[id] (hasta detayı)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.hastaDetay.GET(iste('GET', `/api/doktor/hastalar/${h.hasta}`, { token: a.token }), prm({ id: h.hasta }))) },
  { ad: 'PUT /api/doktor/hastalar/[id] (hasta düzenleme)',
    yazdi: (a) => tablo('patients').some((p) => p.id === a.hasta && decrypt(p.name_encrypted).includes('QA Duzenlendi')),
    cagir: (r, a, h) => coz(r.hastaDetay.PUT(iste('PUT', `/api/doktor/hastalar/${h.hasta}`, { token: a.token, govde: { ad_soyad: 'QA Duzenlendi' } }), prm({ id: h.hasta }))) },
  { ad: 'GET /api/doktor/hastalar (hasta listesi)', okur: true,
    cagir: (r, a) => coz(r.hastalar.GET(iste('GET', '/api/doktor/hastalar', { token: a.token }))) },
  { ad: 'GET /api/doktor/hastalar/[id]/sessions (muayene geçmişi)', okur: true,
    cagir: (r, a, h) => coz(r.hastaSeanslari.GET(iste('GET', `/api/doktor/hastalar/${h.hasta}/sessions`, { token: a.token }), prm({ id: h.hasta }))) },
  { ad: 'GET /api/doktor/hastalar/[id]/buyume-egrileri', red: 404,
    cagir: (r, a, h) => coz(r.buyume.GET(iste('GET', `/api/doktor/hastalar/${h.hasta}/buyume-egrileri`, { token: a.token }), prm({ id: h.hasta }))) },
  { ad: 'GET /api/doktor/hastalar/[id]/hedef-boy', red: 404,
    cagir: (r, a, h) => coz(r.hedefBoy.GET(iste('GET', `/api/doktor/hastalar/${h.hasta}/hedef-boy`, { token: a.token }), prm({ id: h.hasta }))) },
  // Notlar
  { ad: 'GET /api/notes/[id] (not detayı)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.notDetay.GET(iste('GET', `/api/notes/${h.not}`, { token: a.token }), prm({ id: h.not }))) },
  { ad: 'GET /api/notes?pending=true (inceleme kuyruğu)', okur: true,
    cagir: (r, a) => coz(r.notlar.GET(iste('GET', '/api/notes?pending=true', { token: a.token }))) },
  { ad: 'POST /api/notes/[id]/approve (not onayı)', red: 404,
    yazdi: (a) => !!tablo('notes').find((n) => n.id === a.bekleyenNot)?.approved_at,
    cagir: (r, a, h) => coz(r.notOnay.POST(iste('POST', `/api/notes/${h.bekleyenNot}/approve`, { token: a.token, govde: {} }), prm({ id: h.bekleyenNot }))) },
  { ad: 'GET /api/doktor/son-notlar', okur: true,
    cagir: (r, a) => coz(r.sonNotlar.GET(iste('GET', '/api/doktor/son-notlar', { token: a.token }))) },
  // Seans / SOAP üretimi
  { ad: 'POST /api/sessions/start (seans başlat)', red: 404,
    yazdi: (a) => tablo('sessions').filter((s) => s.patient_id === a.hasta).length > 2,
    cagir: (r, a, h) => coz(r.seansBaslat.POST(iste('POST', '/api/sessions/start', { token: a.token, govde: { patient_id: h.hasta, specialty: 'pediatri' } }))) },
  { ad: 'POST /api/sessions/[id]/end (SOAP üret)', red: 404,
    yazdi: (a) => aiBaglamlari.some((b) => b.includes(`Plan ${isaret(a.harf)}`)) && tablo('notes').some((n) => n.session_id === a.seans && n.content_plan === 'Sentetik P'),
    cagir: (r, a, h) => coz(r.seansBitir.POST(iste('POST', `/api/sessions/${h.seans}/end`, { token: a.token, govde: { transcript: 'Sentetik transkript', context: { specialty: 'pediatri' } } }), prm({ id: h.seans }))) },
  { ad: 'POST /api/sessions/ses-yukle (ses dosyasından SOAP)', red: 404,
    yazdi: (a) => aiBaglamlari.some((b) => b.includes(`Plan ${isaret(a.harf)}`)),
    cagir: (r, a, h) => coz(r.sesYukle.POST(iste('POST', '/api/sessions/ses-yukle', { token: a.token, govde: { path: `${a.id}/qa-kayit.m4a`, patientId: h.hasta, specialty: 'pediatri' } }))) },
  // İlaçlar
  { ad: 'GET /api/doktor/ilaclar', okur: true,
    cagir: (r, a, h) => coz(r.ilaclar.GET(iste('GET', `/api/doktor/ilaclar?hastaId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/ilaclar', red: 404,
    yazdi: (a) => tablo('hasta_ilaclar').some((i) => i.patient_id === a.hasta && i.ilac_adi === 'QA Yeni Ilac'),
    cagir: (r, a, h) => coz(r.ilaclar.POST(iste('POST', '/api/doktor/ilaclar', { token: a.token, govde: { hastaId: h.hasta, ad: 'QA Yeni Ilac', etkenMadde: 'sentetik', doz: '1', kullanim_sikli: '1x1', baslangic_tarihi: '2026-09-17' } }))) },
  { ad: 'PUT /api/doktor/ilaclar/[id]',
    yazdi: (a) => tablo('hasta_ilaclar').find((i) => i.id === a.ilac)?.notlar === 'QA not',
    cagir: (r, a, h) => coz(r.ilac.PUT(iste('PUT', `/api/doktor/ilaclar/${h.ilac}`, { token: a.token, govde: { notlar: 'QA not' } }), prm({ id: h.ilac }))) },
  { ad: 'DELETE /api/doktor/ilaclar/[id]',
    yazdi: (a) => !tablo('hasta_ilaclar').some((i) => i.id === a.ilac),
    cagir: (r, a, h) => coz(r.ilac.DELETE(iste('DELETE', `/api/doktor/ilaclar/${h.ilac}`, { token: a.token }), prm({ id: h.ilac }))) },
  // Lab
  { ad: 'GET /api/doktor/belgeler/lab?patientId (lab sonuçları)', okur: true,
    cagir: (r, a, h) => coz(r.lab.GET(iste('GET', `/api/doktor/belgeler/lab?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/belgeler/lab?documentId (lab paneli)', okur: true,
    cagir: (r, a, h) => coz(r.lab.GET(iste('GET', `/api/doktor/belgeler/lab?documentId=${h.belge}`, { token: a.token }))) },
  // Randevular
  { ad: 'GET /api/doktor/randevular (takvim)', okur: true,
    cagir: (r, a) => coz(r.randevular.GET(iste('GET', `/api/doktor/randevular?${trAralik}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/gun-programi', okur: true,
    cagir: (r, a) => coz(r.gunProgrami.GET(iste('GET', '/api/doktor/gun-programi', { token: a.token }))) },
  { ad: 'POST /api/doktor/randevular (randevu oluştur)', red: 404,
    yazdi: (a) => tablo('randevular').filter((x) => x.patient_id === a.hasta).length > 1,
    cagir: (r, a, h) => coz(r.randevular.POST(iste('POST', '/api/doktor/randevular', { token: a.token, govde: { patientId: h.hasta, baslangic: trGun(2, 9), bitis: dakikaSonra(trGun(2, 9), 20) } }))) },
  { ad: 'PATCH /api/doktor/randevular/[id] (kendi randevusunu yabancı hastaya bağlama)', red: 404,
    yazdi: (a) => tablo('randevular').find((x) => x.id === a.serbestRandevu)?.patient_id === a.hasta,
    cagir: (r, a, h) => coz(r.randevu.PATCH(iste('PATCH', `/api/doktor/randevular/${a.serbestRandevu}`, { token: a.token, govde: { patientId: h.hasta } }), prm({ id: a.serbestRandevu }))) },
  { ad: 'DELETE /api/doktor/randevular/[id]',
    yazdi: (a) => !tablo('randevular').some((x) => x.id === a.randevu),
    cagir: (r, a, h) => coz(r.randevu.DELETE(iste('DELETE', `/api/doktor/randevular/${h.randevu}`, { token: a.token }), prm({ id: h.randevu }))) },
  // Araçlar
  { ad: 'POST /api/doktor/araclar/epikriz (kendi seansı + yabancı hastaId)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.epikriz.POST(iste('POST', '/api/doktor/araclar/epikriz', { token: a.token, govde: { hastaId: h.hasta, seansId: a.seans } }))) },
  // Branş modülleri
  { ad: 'GET /api/doktor/asilar', okur: true,
    cagir: (r, a, h) => coz(r.asilar.GET(iste('GET', `/api/doktor/asilar?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/asilar', red: 404,
    yazdi: (a) => tablo('asilar').some((x) => x.patient_id === a.hasta && x.asi_adi === 'QA Yeni Asi'),
    cagir: (r, a, h) => coz(r.asilar.POST(iste('POST', '/api/doktor/asilar', { token: a.token, govde: { patientId: h.hasta, asiAdi: 'QA Yeni Asi' } }))) },
  { ad: 'POST /api/doktor/mchat', red: 404,
    yazdi: (a) => tablo('mchat_testleri').some((x) => x.patient_id === a.hasta),
    cagir: async (r, a, h) => {
      const cevaplar: Record<string, boolean> = {}
      for (const s of r.MCHAT_R_SORULARI as { no: number }[]) cevaplar[String(s.no)] = false
      return coz(r.mchat.POST(iste('POST', '/api/doktor/mchat', { token: a.token, govde: { patientId: h.hasta, cevaplar } })))
    } },
  { ad: 'POST /api/doktor/gelisim-taramasi', red: 404,
    yazdi: (a) => tablo('gelisim_taramalari').some((x) => x.patient_id === a.hasta),
    cagir: (r, a, h) => coz(r.gelisim.POST(iste('POST', '/api/doktor/gelisim-taramasi', { token: a.token, govde: { patientId: h.hasta, yanitlar: [{ alan: 'iletisim', madde: 'Sentetik madde', yapiyor: true }] } }))) },
  { ad: 'GET /api/doktor/kadin-sagligi', okur: true,
    cagir: (r, a, h) => coz(r.kadinSagligi.GET(iste('GET', `/api/doktor/kadin-sagligi?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/kadin-sagligi (upsert onConflict patient_id)', red: 404,
    yazdi: (a) => tablo('kadin_sagligi').some((x) => x.patient_id === a.hasta && x.notlar === 'QA Yeni'),
    cagir: (r, a, h) => coz(r.kadinSagligi.POST(iste('POST', '/api/doktor/kadin-sagligi', { token: a.token, govde: { patientId: h.hasta, notlar: 'QA Yeni' } }))) },
  { ad: 'GET /api/doktor/dermatoloji', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.derm.GET(iste('GET', `/api/doktor/dermatoloji?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/dermatoloji', red: 404,
    yazdi: (a) => tablo('hasta_derm').some((x) => x.patient_id === a.hasta && x.tb_screen === true),
    cagir: (r, a, h) => coz(r.derm.POST(iste('POST', '/api/doktor/dermatoloji', { token: a.token, govde: { patientId: h.hasta, action: 'klinik', tb_screen: true } }))) },
  { ad: 'POST /api/doktor/dermatoloji/spine lezyon_tani (kendi hastası + yabancı lezyon)', red: 404,
    yazdi: (a) => !!tablo('derm_lezyonlar').find((x) => x.id === a.lezyon)?.resmi_tani,
    cagir: (r, a, h) => coz(r.dermSpine.POST(iste('POST', '/api/doktor/dermatoloji/spine', { token: a.token, govde: { adim: 'lezyon_tani', patientId: a.hasta, lezyonId: h.lezyon, resmiTani: r.RESMI_TANI_SECENEKLERI[0] } }))) },
  { ad: 'GET /api/doktor/dermatoloji/spine', red: 404,
    cagir: (r, a, h) => coz(r.dermSpine.GET(iste('GET', `/api/doktor/dermatoloji/spine?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/dermatoloji goruntu-okuma belge_taslak (kendi hastası + yabancı Belge analizi)', red: 404,
    yazdi: (a) => tablo('derm_vision_reads').some((x) => x.belge_analiz_id === a.dermAnaliz && x.hasta_derm_id === a.hastaDerm && x.status === 'draft' && x.drafted_by === 'asistan'),
    cagir: (r, a, h) => coz(r.derm.POST(iste('POST', '/api/doktor/dermatoloji', { token: a.token, govde: { action: 'goruntu-okuma', eylem: 'belge_taslak', patientId: a.hasta, analizId: h.dermAnaliz, bolge: 'sırt' } }))) },
  { ad: 'GET /api/doktor/gebelik', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.gebelik.GET(iste('GET', `/api/doktor/gebelik?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/gebelik baslat', red: 404,
    yazdi: (a) => tablo('gebelikler').some((x) => x.patient_id === a.hasta),
    cagir: (r, a, h) => coz(r.gebelik.POST(iste('POST', '/api/doktor/gebelik', { token: a.token, govde: { action: 'baslat', patientId: h.hasta, sat: '2026-06-01' } }))) },
  { ad: 'POST /api/doktor/gebelik/dogum komplikasyon (kendi doğumu + yabancı bebek kartı)',
    yazdi: (a) => (tablo('bebek_kartlari').find((x) => x.id === a.bebekKart)?.komplikasyonlar || []).length === 1,
    cagir: (r, a, h) => coz(r.dogum.POST(iste('POST', '/api/doktor/gebelik/dogum', { token: a.token, govde: { adim: 'komplikasyon', dogumId: a.dogum, kime: 'bebek', bebekId: h.bebekKart, ad: 'QA komplikasyon' } }))) },
  { ad: 'GET /api/doktor/dahiliye', red: 404,
    cagir: (r, a, h) => coz(r.dahiliye.GET(iste('GET', `/api/doktor/dahiliye?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/goz', red: 404,
    cagir: (r, a, h) => coz(r.goz.GET(iste('GET', `/api/doktor/goz?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/goz lazer (GOZ-EXCEPTIONAL _ek adımı)', red: 404,
    yazdi: (a) => tablo('goz_lazerler').some((x) => x.patient_id === a.hasta && x.tip === 'prp') && tablo('goz_kontroller').some((x) => x.patient_id === a.hasta && String(x.neden).startsWith('Lazer sonrası')),
    cagir: (r, a, h) => coz(r.goz.POST(iste('POST', '/api/doktor/goz', { token: a.token, govde: { adim: 'lazer', patientId: h.hasta, goz: 'sag', tip: 'prp', tarih: '2026-09-10', kontrolTarihi: '2026-10-10' } }))) },
  { ad: 'POST /api/doktor/goz hatirlatma (hasta dosyasından Sağlığım mesajı)', red: 404,
    yazdi: (a) => tablo('hasta_mesaj_konulari').some((x) => x.patient_id === a.hasta && x.konu === 'Göz kontrol hatırlatması'),
    cagir: (r, a, h) => coz(r.goz.POST(iste('POST', '/api/doktor/goz', { token: a.token, govde: { adim: 'hatirlatma', patientId: h.hasta } }))) },
  { ad: 'POST /api/doktor/goz goruntu_okuma belge_taslak (kendi hastası + yabancı Belge analizi)', red: 404,
    yazdi: (a) => tablo('goz_goruntu_okumalari').some((x) => x.belge_analiz_id === a.belgeAnaliz && x.patient_id === a.hasta && x.durum === 'draft'),
    cagir: (r, a, h) => coz(r.goz.POST(iste('POST', '/api/doktor/goz', { token: a.token, govde: { adim: 'goruntu_okuma', eylem: 'belge_taslak', patientId: a.hasta, analizId: h.belgeAnaliz, goz: 'sag' } }))) },
  { ad: 'POST /api/doktor/goz goruntu_okuma asistana_raporla (Tier A — yabancı görüntü modele gitmez)', red: 404,
    yazdi: (a) => tablo('goz_goruntu_okumalari').some((x) => x.goruntu_id === a.gozGoruntu && x.durum === 'draft'),
    cagir: (r, a, h) => coz(r.goz.POST(iste('POST', '/api/doktor/goz', { token: a.token, govde: { adim: 'goruntu_okuma', eylem: 'asistana_raporla', patientId: h.hasta, goruntuId: h.gozGoruntu, goz: 'sag', kimlikYok: true, deid: { mime: 'image/png', base64: Buffer.from('sentetik').toString('base64'), hash: 'x' } } }))) },
  { ad: 'GET /api/doktor/goz/kohort (göz kohort listesi)', okur: true,
    cagir: (r, a) => coz(r.gozKohort.GET(iste('GET', '/api/doktor/goz/kohort', { token: a.token }))) },
  { ad: 'POST /api/doktor/goz/kohort (1-tap hatırlatma)',
    yazdi: (a) => tablo('hasta_mesaj_konulari').some((x) => x.patient_id === a.hasta && x.konu === 'Göz kontrol hatırlatması') && tablo('goz_gorevler').some((x) => x.patient_id === a.hasta && x.kod === 'hatirlatma_takip'),
    cagir: (r, a, h) => coz(r.gozKohort.POST(iste('POST', '/api/doktor/goz/kohort', { token: a.token, govde: { patientIds: [h.hasta] } }))) },
  { ad: 'GET /api/doktor/pediatri (Araçlar › Pediatri hasta özeti)', red: 404,
    cagir: (r, a, h) => coz(r.pedi.GET(iste('GET', `/api/doktor/pediatri?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/pediatri/tarama (Araçlar › Gelişim paneli kayıtları)', red: 404,
    cagir: (r, a, h) => coz(r.pediTarama.GET(iste('GET', `/api/doktor/pediatri/tarama?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/pediatri/tarama (tarama işareti + bugünkü muayene formuna ekle)', red: 404,
    yazdi: (a) => tablo('pedi_taramalar').some((x) => x.patient_id === a.hasta && x.doctor_id === a.id && x.tur === 'gorme')
      && String(tablo('notes').find((n) => n.id === a.bekleyenNot)?.content_degerlendirme || '').includes('Görme taraması'),
    cagir: (r, a, h) => coz(r.pediTarama.POST(iste('POST', '/api/doktor/pediatri/tarama', { token: a.token, govde: { patientId: h.hasta, tur: 'gorme', sonuc: 'normal', muayeneFormunaEkle: true } }))) },
  { ad: 'GET /api/doktor/pediatri/kohort (pediatri kohort listesi)', okur: true,
    cagir: (r, a) => coz(r.pediKohort.GET(iste('GET', '/api/doktor/pediatri/kohort', { token: a.token }))) },
  { ad: 'POST /api/doktor/pediatri/kohort (1-tap veli hatırlatması)',
    yazdi: (a) => tablo('hasta_mesaj_konulari').some((x) => x.patient_id === a.hasta && x.doctor_id === a.id && x.konu === 'Çocuğunuzun kontrol hatırlatması'),
    cagir: (r, a, h) => coz(r.pediKohort.POST(iste('POST', '/api/doktor/pediatri/kohort', { token: a.token, govde: { patientIds: [h.hasta] } }))) },
  { ad: 'GET /api/doktor/gebelik/kohort (KD kohort listesi)', okur: true,
    cagir: (r, a) => coz(r.kdKohort.GET(iste('GET', '/api/doktor/gebelik/kohort', { token: a.token }))) },
  { ad: 'POST /api/doktor/gebelik/kohort (KD 1-tap hatırlatma)',
    yazdi: (a) => tablo('hasta_mesaj_konulari').some((x) => x.patient_id === a.hasta && x.konu === 'Kontrol hatırlatması'),
    cagir: (r, a, h) => coz(r.kdKohort.POST(iste('POST', '/api/doktor/gebelik/kohort', { token: a.token, govde: { patientIds: [h.hasta] } }))) },
  { ad: 'GET /api/doktor/jinekoloji', red: 404,
    cagir: (r, a, h) => coz(r.jine.GET(iste('GET', `/api/doktor/jinekoloji?patientId=${h.hasta}`, { token: a.token }))) },
  // Görüntüleme / belgeler / cihaz
  { ad: 'GET /api/doktor/goruntuleme', okur: true,
    cagir: (r, a, h) => coz(r.goruntuleme.GET(iste('GET', `/api/doktor/goruntuleme?hastaId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/goruntuleme/yukle', red: 404,
    yazdi: (a) => tablo('hasta_goruntulemeler').filter((x) => x.patient_id === a.hasta).length > 1,
    cagir: (r, a, h) => {
      const form = new FormData()
      form.set('file', new File([new Uint8Array([1, 2, 3])], 'qa.jpg', { type: 'image/jpeg' }))
      form.set('hastaId', h.hasta); form.set('modalite', 'xray')
      return coz(r.goruntulemeYukle.POST(iste('POST', '/api/doktor/goruntuleme/yukle', { token: a.token, form })))
    } },
  { ad: 'POST /api/doktor/belgeler/ingest', red: 404,
    yazdi: (a) => tablo('hasta_belgeler').some((x) => x.patient_id === a.hasta),
    cagir: (r, a, h) => coz(r.ingest.POST(iste('POST', '/api/doktor/belgeler/ingest', { token: a.token, govde: { base64: Buffer.from('sentetik').toString('base64'), mimeType: 'application/pdf', hastaId: h.hasta, belgeType: 'Lab Sonucu' } }))) },
  { ad: 'POST /api/doktor/cihaz-olcum', red: 404,
    yazdi: (a) => tablo('cihaz_olcumleri').some((x) => x.patient_id === a.hasta),
    cagir: (r, a, h) => coz(r.cihaz.POST(iste('POST', '/api/doktor/cihaz-olcum', { token: a.token, govde: { hastaId: h.hasta, transport: 'manuel', olcumler: [{ tur: 'ates', deger: '37.2', birim: '°C', kaynak: 'manuel' }] } }))) },
  // Mesajlar / hatırlatma / intake
  { ad: 'POST /api/doktor/mesajlar', red: 404,
    yazdi: (a) => tablo('hasta_mesaj_konulari').filter((x) => x.patient_id === a.hasta).length > 1,
    cagir: (r, a, h) => coz(r.mesajlar.POST(iste('POST', '/api/doktor/mesajlar', { token: a.token, govde: { patientId: h.hasta, konu: 'QA', metin: 'QA mesaj' } }))) },
  { ad: 'GET /api/doktor/mesajlar/[konuId]', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.mesajKonu.GET(iste('GET', `/api/doktor/mesajlar/${h.konu}`, { token: a.token }), prm({ konuId: h.konu }))) },
  { ad: 'POST /api/doktor/hatirlatma', red: 404,
    yazdi: (a) => tablo('hasta_hatirlatma').some((x) => x.patient_id === a.hasta),
    cagir: (r, a, h) => coz(r.hatirlatma.POST(iste('POST', '/api/doktor/hatirlatma', { token: a.token, govde: { hastaId: h.hasta, mesaj: 'QA hatırlatma', tarih: '2026-09-20', kanal: 'sms' } }))) },
  { ad: 'POST /api/doktor/intake-formlari', red: 404,
    yazdi: (a) => tablo('hasta_intake_formlari').some((x) => x.patient_id === a.hasta),
    cagir: (r, a, h) => coz(r.intake.POST(iste('POST', '/api/doktor/intake-formlari', { token: a.token, govde: { patientId: h.hasta } }))) },
  // Asistan
  { ad: 'POST /api/asistan/chat (hasta bağlamı modele gider)', red: 404,
    yazdi: (a) => modelIstekleri.some((m) => m.includes(a.hasta)),
    cagir: (r, a, h) => coz(r.asistanChat.POST(iste('POST', '/api/asistan/chat', { token: a.token, govde: { message: 'Hastanın durumu nasıl?', patientId: h.hasta, specialty: 'pediatri' } }))) },
  { ad: 'POST /api/asistan/learn (düzeltme işareti)',
    yazdi: (a) => tablo('asistan_actions').find((x) => x.id === a.asistanEylem)?.was_corrected === true,
    cagir: (r, a, h) => coz(r.asistanLearn.POST(iste('POST', '/api/asistan/learn', { token: a.token, govde: { actionId: h.asistanEylem, correctionType: 'ton', original: 'a', corrected: 'b' } }))) },
]

// ─── Paket ──────────────────────────────────────────────────────────────────────────────────────
describe('HASTA-İZOLASYON: doktor A ve doktor B birbirinin hastasına hiçbir rotadan ulaşamaz', () => {
  let R: Rotalar
  before(async () => {
    ;({ encrypt, decrypt } = await import('../security/encryption'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    const ice = (y: string) => import(`../../${y}`)
    R = {
      hastalar: await ice('app/api/doktor/hastalar/route'),
      hastaDetay: await ice('app/api/doktor/hastalar/[id]/route'),
      hastaSeanslari: await ice('app/api/doktor/hastalar/[id]/sessions/route'),
      buyume: await ice('app/api/doktor/hastalar/[id]/buyume-egrileri/route'),
      hedefBoy: await ice('app/api/doktor/hastalar/[id]/hedef-boy/route'),
      notlar: await ice('app/api/notes/route'),
      notDetay: await ice('app/api/notes/[id]/route'),
      notOnay: await ice('app/api/notes/[id]/approve/route'),
      sonNotlar: await ice('app/api/doktor/son-notlar/route'),
      seansBaslat: await ice('app/api/sessions/start/route'),
      seansBitir: await ice('app/api/sessions/[id]/end/route'),
      sesYukle: await ice('app/api/sessions/ses-yukle/route'),
      ilaclar: await ice('app/api/doktor/ilaclar/route'),
      ilac: await ice('app/api/doktor/ilaclar/[id]/route'),
      lab: await ice('app/api/doktor/belgeler/lab/route'),
      randevular: await ice('app/api/doktor/randevular/route'),
      randevu: await ice('app/api/doktor/randevular/[id]/route'),
      gunProgrami: await ice('app/api/doktor/gun-programi/route'),
      epikriz: await ice('app/api/doktor/araclar/epikriz/route'),
      asilar: await ice('app/api/doktor/asilar/route'),
      mchat: await ice('app/api/doktor/mchat/route'),
      gelisim: await ice('app/api/doktor/gelisim-taramasi/route'),
      kadinSagligi: await ice('app/api/doktor/kadin-sagligi/route'),
      derm: await ice('app/api/doktor/dermatoloji/route'),
      dermSpine: await ice('app/api/doktor/dermatoloji/spine/route'),
      gebelik: await ice('app/api/doktor/gebelik/route'),
      dogum: await ice('app/api/doktor/gebelik/dogum/route'),
      dahiliye: await ice('app/api/doktor/dahiliye/route'),
      goz: await ice('app/api/doktor/goz/route'),
      gozKohort: await ice('app/api/doktor/goz/kohort/route'),
      kdKohort: await ice('app/api/doktor/gebelik/kohort/route'),
      pedi: await ice('app/api/doktor/pediatri/route'),
      pediTarama: await ice('app/api/doktor/pediatri/tarama/route'),
      pediKohort: await ice('app/api/doktor/pediatri/kohort/route'),
      jine: await ice('app/api/doktor/jinekoloji/route'),
      goruntuleme: await ice('app/api/doktor/goruntuleme/route'),
      goruntulemeYukle: await ice('app/api/doktor/goruntuleme/yukle/route'),
      ingest: await ice('app/api/doktor/belgeler/ingest/route'),
      cihaz: await ice('app/api/doktor/cihaz-olcum/route'),
      mesajlar: await ice('app/api/doktor/mesajlar/route'),
      mesajKonu: await ice('app/api/doktor/mesajlar/[konuId]/route'),
      hatirlatma: await ice('app/api/doktor/hatirlatma/route'),
      intake: await ice('app/api/doktor/intake-formlari/route'),
      asistanLearn: await ice('app/api/asistan/learn/route'),
      asistanChat: await ice('app/api/asistan/chat/route'),
      portal: await ice('app/api/portal/hasta/[token]/route'),
      portalMesajlar: await ice('app/api/portal/hasta/[token]/mesajlar/route'),
      MCHAT_R_SORULARI: (await import('../clinical/mchatR')).MCHAT_R_SORULARI,
      RESMI_TANI_SECENEKLERI: (await import('../../specialties/dermatoloji/engines/derm-spine')).RESMI_TANI_SECENEKLERI,
    }
  })

  for (const v of VAKALAR) {
    describe(v.ad, () => {
      it('pozitif kontrol: doktor kendi verisine ulaşır (harness rotayı gerçekten çalıştırıyor)', async () => {
        const { A } = sahneKur()
        const y = await v.cagir(R, A, A)
        assert.ok(y.status >= 200 && y.status < 300, `kendi verisinde ${y.status} döndü: ${y.metin.slice(0, 300)}`)
        if (v.okur) assert.ok(y.metin.includes(isaret('A')), `kendi işareti yanıtta yok: ${y.metin.slice(0, 300)}`)
        if (v.yazdi) assert.ok(v.yazdi(A), 'kendi verisine yazı oluşmadı')
      })
      for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
        it(`${saldiran} → ${kurbanHarf}: okuyamaz, yazamaz`, async () => {
          const s = sahneKur()
          const arayan = s[saldiran], kurban = s[kurbanHarf]
          const once = anlikGoruntu(kurban)
          const aiOnce = aiBaglamlari.length
          const modelOnce = modelIstekleri.length
          const y = await v.cagir(R, arayan, kurban)
          assert.ok(!y.metin.includes(isaret(kurbanHarf)), `SIZINTI: ${kurbanHarf} doktorunun verisi ${saldiran} doktoruna döndü: ${y.metin.slice(0, 400)}`)
          const sonra = anlikGoruntu(kurban)
          assert.equal(sonra.sahip, once.sahip, `SIZINTI: ${saldiran} doktoru ${kurbanHarf} doktorunun satırlarını değiştirdi`)
          const yeni = [...sonra.atiflar].filter((x) => !once.atiflar.has(x))
          assert.deepEqual(yeni, [], `SIZINTI: ${saldiran} doktoru ${kurbanHarf} doktorunun hastasına/kaydına yazı açtı`)
          for (const b of aiBaglamlari.slice(aiOnce)) assert.ok(!b.includes(isaret(kurbanHarf)), `SIZINTI: ${kurbanHarf} verisi yapay zekâ bağlamına girdi`)
          for (const m of modelIstekleri.slice(modelOnce)) assert.ok(!m.includes(isaret(kurbanHarf)) && !m.includes(kurban.hasta), `SIZINTI: ${kurbanHarf} hastası modele gönderildi`)
          if (v.red) assert.equal(y.status, v.red, `yabancı kimlikte ${v.red} beklenirdi, ${y.status} geldi: ${y.metin.slice(0, 200)}`)
        })
      }
    })
  }

  describe('Kirlenmiş veri (düzeltme öncesi açıklardan kalmış olabilecek satırlar) sızmaz', () => {
    for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${saldiran}: yabancı hastaya bağlı kendi seansında SOAP üretemez, yabancı plan yapay zekâya girmez`, async () => {
        const s = sahneKur()
        const x = s[saldiran]
        const y = await coz(R.seansBitir.POST(iste('POST', `/api/sessions/${x.hileliSeans}/end`, { token: x.token, govde: { transcript: 'Sentetik', context: { specialty: 'pediatri' } } }), prm({ id: x.hileliSeans })))
        assert.equal(y.status, 404)
        assert.ok(aiBaglamlari.every((b) => !b.includes(isaret(kurbanHarf))))
        assert.ok(!tablo('notes').some((n) => n.session_id === x.hileliSeans && n.content_plan === 'Sentetik P'))
      })
      it(`${saldiran}: yabancı hastaya bağlı kendi notunu onaylasa da reçete ${kurbanHarf} hastasına aktarılmaz`, async () => {
        const s = sahneKur()
        const x = s[saldiran], kurban = s[kurbanHarf]
        const once = tablo('hasta_ilaclar').filter((i) => i.patient_id === kurban.hasta).length
        const y = await coz(R.notOnay.POST(iste('POST', `/api/notes/${x.hileliNot}/approve`, { token: x.token, govde: {} }), prm({ id: x.hileliNot })))
        assert.equal(y.status, 200)
        assert.equal(tablo('hasta_ilaclar').filter((i) => i.patient_id === kurban.hasta).length, once, 'reçete yabancı hastaya aktarıldı')
      })
      it(`${saldiran}: takvim ve gün programı yabancı hastanın adını/telefonunu çözmez`, async () => {
        const s = sahneKur()
        const x = s[saldiran]
        for (const y of [
          await coz(R.randevular.GET(iste('GET', `/api/doktor/randevular?${trAralik}`, { token: x.token }))),
          await coz(R.gunProgrami.GET(iste('GET', '/api/doktor/gun-programi', { token: x.token }))),
        ]) {
          assert.equal(y.status, 200)
          assert.ok(!y.metin.includes(isaret(kurbanHarf)), `yabancı hasta adı sızdı: ${y.metin.slice(0, 300)}`)
          assert.ok(!y.metin.includes(kurbanHarf === 'A' ? '05550000001' : '05550000002'), 'yabancı hasta telefonu sızdı')
        }
      })
    }
  })

  describe('Sağlığım portalı yalnız bağlı olduğu doktorun verisini gösterir', () => {
    async function portalCerezi(token: string): Promise<string> {
      const { setUnlockCookie, UNLOCK_COOKIE } = await import('../portal/pinAuth')
      const { NextResponse } = await import('next/server')
      const res = NextResponse.json({})
      setUnlockCookie(res, token)
      return `${UNLOCK_COOKIE}=${res.cookies.get(UNLOCK_COOKIE)?.value}`
    }
    for (const [hastaHarf, digerHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${hastaHarf} hastasının portalı: kendi doktorunun ilacı var, ${digerHarf} doktorunun iliştirdiği satır yok`, async () => {
        const s = sahneKur()
        const h = s[hastaHarf]
        const cerez = await portalCerezi(h.portalToken)
        const y = await coz(R.portal.GET(iste('GET', `/api/portal/hasta/${h.portalToken}`, { cerez }), prm({ token: h.portalToken })))
        assert.equal(y.status, 200, y.metin.slice(0, 300))
        assert.ok(y.metin.includes(`Ilac ${isaret(hastaHarf)}`), 'kendi doktorunun ilacı portalda görünmeli')
        assert.ok(!y.metin.includes(isaret(digerHarf)), `başka doktorun verisi portala sızdı: ${y.metin.slice(0, 400)}`)
      })
      it(`${hastaHarf} hastasının portal mesajları yalnız kendi doktoruyla`, async () => {
        const s = sahneKur()
        const h = s[hastaHarf], diger = s[digerHarf]
        db.ekle('hasta_mesaj_konulari', { doctor_id: diger.id, patient_id: h.hasta, konu: `Hileli konu ${isaret(digerHarf)}`, son_mesaj_at: new Date().toISOString(), hasta_klasor: 'gelen' })
        const cerez = await portalCerezi(h.portalToken)
        const y = await coz(R.portalMesajlar.GET(iste('GET', `/api/portal/hasta/${h.portalToken}/mesajlar`, { cerez }), prm({ token: h.portalToken })))
        assert.equal(y.status, 200, y.metin.slice(0, 300))
        assert.ok(y.metin.includes(`Konu ${isaret(hastaHarf)}`))
        assert.ok(!y.metin.includes(isaret(digerHarf)))
      })
    }
  })

  describe('Asistan eylemleri (model çıktısındaki kimlikler de istek girdisidir)', () => {
    for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${saldiran}: yabancı hastaya seans açamaz, yabancı seansa not yazamaz`, async () => {
        const s = sahneKur()
        const x = s[saldiran], k = s[kurbanHarf]
        const { executeAction } = await import('../asistan/actionExecutor')
        const once = anlikGoruntu(k)
        const r1 = await executeAction({ type: 'CREATE_SESSION', doctorId: x.id, data: { patientId: k.hasta } } as never, 'sahte')
        const r2 = await executeAction({ type: 'ADD_NOTE_CONTENT', doctorId: x.id, data: { sessionId: k.seans, field: 'content_plan', content: 'Hileli' } } as never, 'sahte')
        const r3 = await executeAction({ type: 'SET_DIAGNOSIS', doctorId: x.id, data: { sessionId: x.hileliSeans, diagnosis: 'Hileli', icd10: 'Z00' } } as never, 'sahte')
        assert.equal(r1.success, false); assert.equal(r2.success, false); assert.equal(r3.success, false)
        const sonra = anlikGoruntu(k)
        assert.equal(sonra.sahip, once.sahip)
        assert.deepEqual([...sonra.atiflar].filter((a) => !once.atiflar.has(a)), [])
        const kendi = await executeAction({ type: 'ADD_NOTE_CONTENT', doctorId: x.id, data: { sessionId: x.seans, field: 'content_plan', content: 'Kendi' } } as never, 'sahte')
        assert.equal(kendi.success, true, 'kendi seansına not yazabilmeli (pozitif kontrol)')
      })
    }
  })
})
