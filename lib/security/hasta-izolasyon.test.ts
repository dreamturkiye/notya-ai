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
process.env.NOTYA_SES_LLM_SECRET = 'qa-sentetik-ses-llm-sirri-0123456789abcdef'
process.env.NOTYA_SES_JETON_SECRET = 'qa-sentetik-ses-jeton-anahtari-0123456789ab'

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
/**
 * NOTYA-AYSE-ARAC-PARITE: a case may script the model (to make it call Ayşe's read tools). Reset by sahneKur().
 * Returns the content blocks of the answer for a request, or null for the default synthetic answer.
 */
let modelYaniti: ((istek: Record<string, any>) => Record<string, unknown>[] | null) | null = null
class SahteAnthropic {
  messages = {
    create: async (istek: unknown) => {
      modelIstekleri.push(JSON.stringify(istek))
      const ozel = modelYaniti ? modelYaniti(JSON.parse(JSON.stringify(istek))) : null
      if (ozel) return { content: ozel, stop_reason: ozel.some((b) => b.type === 'tool_use') ? 'tool_use' : 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }
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
    soapNotuUret: async (girdi: { klinikBaglam?: string }) => {
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
  /** NOTYA-RANDEVU-V2: a pending Sağlığım appointment request (durum 'talep') of the doctor's own patient */
  talep: string
  /** GOZ-EXCEPTIONAL-01: göz OCT görüntüsü + fundus Belge analizi (dual-sign köprüsü) */
  gozGoruntu: string; belgeAnaliz: string
  /** DERM-EXCEPTIONAL-01: dermatoskopi Belge analizi (derm dual-sign köprüsü) */
  dermAnaliz: string
  /** KONSULTASYON-01: yanıt bekleyen + yanıtlanmış konsültasyon, Kasa'daki konsültasyon raporu */
  konsultasyon: string; konsultasyonYanitli: string; kasaBelge: string
  /** ASI-KARNESI-01 (D): sonraki doz tarihi 10 gün sonra, hatırlatması gönderilmemiş aşı kaydı */
  asiHatirlatma: string
  /** NOTYA-EYLEM: Ayşe'nin hazırladığı bekleyen taslak + onaylanmış (geri alınabilir) eylem kaydı */
  eylemOneri: string; eylemKayit: string
  /** NOTYA-ILAC-SONLANDIR-01: muayene notunun sonlandırdığı ilaç (Geri al hedefi) */
  sonlanmisIlac: string
  /** NOTYA-ILETISIM-01: Hazır mesajlar kuyruğunda bekleyen bir öğe */
  kuyruk: string
  /** NOTYA-GELEN-BELGELER: dosyalanmamış bir gelen belge (dosyası özel kovada, önerilen hasta = kendi hastası) */
  gelenBelge: string
  /** NOTYA-TEK-BEYIN: yazı + sesin ortak asistan oturumu (bir sesli tur, işaretli) */
  asistanOturum: string
  /** NOTYA-TAKIP-01: an open follow-up case of the doctor's own patient */
  takip: string
  /** KONSULTASYONLAR-01: one consultant in the doctor's address book (Defter) */
  defter: string
  /** MUAYENE-EKLERI-07: a file uploaded during THIS doctor's completed visit (`seans`), bytes encrypted in the vault */
  yuklenenBelge: string
  /** FOTO-ARSIV-01: two clinical photos of the doctor's patient (older + newer, same region), with archive metadata + a stored thumbnail */
  fotoBelge: string; fotoOnceki: string; fotoSeans: string
  /** Rows THIS doctor filed under the OTHER doctor's patient — the contamination a pre-fix IDOR left behind. */
  hileliSeans: string; hileliNot: string
}
const isaret = (h: Harf) => `GIZLI-${h}-7Q`

let fotoGorsel: typeof import('../doktor/fotoArsiv/testGorselleri')
let encrypt: (s: string) => string
let encryptBytes: (b: Buffer) => Buffer
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
    // NOTYA-ILETISIM-01: WhatsApp izni verilmiş (e-posta izni bilinmiyor)
    iletisim_izni_whatsapp: true, iletisim_izni_eposta: null,
  }).id
  const dun = new Date(Date.now() - 86400e3).toISOString()
  const seans = db.ekle('sessions', { doctor_id: id, patient_id: hasta, specialty: 'pediatri', status: 'completed', created_at: dun }).id
  const not = db.ekle('notes', { session_id: seans, doctor_id: id, note_type: 'soap', approved_at: dun, created_at: dun, content_plan: `Plan ${m}`, content_tani: `Tani ${m}`, content_subjektif: `Sikayet ${m}`, basvuru_yakinmasi: `Yakinma ${m}`, content_ilaclar: [], vitaller: {} }).id
  const seans2 = db.ekle('sessions', { doctor_id: id, patient_id: hasta, specialty: 'pediatri', status: 'completed' }).id
  const bekleyenNot = db.ekle('notes', { session_id: seans2, doctor_id: id, note_type: 'soap', approved_at: null, content_plan: `Bekleyen ${m}`, content_ilaclar: [], vitaller: {} }).id
  const ilac = db.ekle('hasta_ilaclar', { doctor_id: id, patient_id: hasta, ilac_adi: `Ilac ${m}`, etken_madde: 'sentetik', doz: '1', kullanim_sikli: '1x1', baslangic_tarihi: '2026-09-01', aktif: true, onay_durumu: 'onayli' }).id
  const sonlanmisIlac = db.ekle('hasta_ilaclar', { doctor_id: id, patient_id: hasta, ilac_adi: `Sonlanmis ${m}`, etken_madde: 'sentetik', doz: '1', kullanim_sikli: '1x1', baslangic_tarihi: '2026-09-01', bitis_tarihi: '2026-09-20', aktif: false, onay_durumu: 'onayli', notlar: 'Muayene notunda sonlandırıldı: “Sonlanmis keselim”' }).id
  db.ekle('hasta_lab_sonuclari', { doctor_id: id, patient_id: hasta, lab_adi: `Lab ${m}`, testler: [{ ad: 'Hb', deger: '12', birim: 'g/dL' }], sonuc_tarihi: '2026-09-10' })
  const belge = randomUUID()
  const panel = db.ekle('lab_paneller', { doctor_id: id, patient_id: hasta, belge_id: belge, lab_adi: `Panel ${m}`, durum: 'cikarildi', panel_type: 'genel', kaynaklar: [] }).id
  db.ekle('lab_satirlar', { panel_id: panel, patient_id: hasta, doctor_id: id, sira: 0, raw_name: `Satir ${m}`, canonical_key: 'Hb', value_num: 12 })
  const randevu = db.ekle('randevular', { doktor_id: id, patient_id: hasta, baslangic: trGun(0, 10), bitis: dakikaSonra(trGun(0, 10), 20), durum: 'planlandi', tur: 'muayene', notlar: `Randevu ${m}` }).id
  const serbestRandevu = db.ekle('randevular', { doktor_id: id, patient_id: null, hasta_adi_serbest: `Serbest ${m}`, baslangic: trGun(1, 11), bitis: dakikaSonra(trGun(1, 11), 20), durum: 'planlandi', tur: 'muayene' }).id
  // NOTYA-RANDEVU-V2: 'Hasta Portalı Randevu' ON + one pending request from the doctor's own patient (outside trAralik)
  db.ekle('randevu_portal_ayarlari', { doktor_id: id, acik: true })
  const talep = db.ekle('randevular', { doktor_id: id, patient_id: hasta, baslangic: trGun(5, 10), bitis: dakikaSonra(trGun(5, 10), 20), durum: 'talep', tur: 'muayene', kaynak: 'portal', talep_at: new Date().toISOString(), oneri_at: null, eskalasyon_at: null, hasta_teyit_at: null }).id
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
  const asiHatirlatma = db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: `Hatirlatma asi ${m}`, kategori: 'pediatrik', uygulama_tarihi: '2026-01-01', sonraki_doz_tarihi: trGun(10, 12).slice(0, 10), kaynak: 'kayit', hatirlatma_gonderildi: false }).id
  // KONSULTASYON-01: Kasa'daki konsültan raporu + iki konsültasyon (biri yanıt bekliyor, biri yanıtlandı)
  const kasaBelge = db.ekle('medical_documents', { doctor_id: id, patient_id: hasta, file_name: `kbb-raporu-${m}.pdf`, file_type: 'application/pdf', file_size: 10, category: 'Konsültasyon raporu', deleted_at: null }).id
  const konsultasyon = db.ekle('sevkler', { doctor_id: id, patient_id: hasta, hedef: 'kulak-burun-bogaz', hedef_brans: 'kulak-burun-bogaz', klinik_soru: `İşitme kaybı var mı? ${m}`, aciliyet: 'rutin', istem_tarihi: '2026-09-10', durum: 'yanit_bekleniyor', kaynak: 'konsultasyon', belge_id: null, son_hatirlatma_at: null }).id
  const konsultasyonYanitli = db.ekle('sevkler', { doctor_id: id, patient_id: hasta, hedef: 'goz-hastaliklari', hedef_brans: 'goz-hastaliklari', klinik_soru: `Görme keskinliği? ${m}`, aciliyet: 'rutin', istem_tarihi: '2026-09-01', durum: 'yanitlandi', yanit_tarihi: '2026-09-08', yanit_ozeti: `Göz muayenesi olağan ${m}`, kaynak: 'konsultasyon', belge_id: kasaBelge }).id
  // NOTYA-EYLEM: Ayşe'nin hazırladığı bekleyen taslak (aşı) + onaylanmış, 24 saat içinde geri alınabilir kayıt
  const eylemOneri = db.ekle('eylem_onerileri', {
    doctor_id: id, hasta_id: hasta, eylem_anahtar: 'asi_kaydi_ekle',
    veri: { asi_adi: `Eylem asi ${m}`, uygulama_tarihi: '2026-02-02' },
    alan_kaynaklari: { asi_adi: { kaynak: 'doktor_soyledi' }, uygulama_tarihi: { kaynak: 'doktor_soyledi' } },
    eksik_alanlar: [], uyarilar: [], kademe: 'T1', durum: 'taslak', grup_id: null, yuzey: 'danis', karar_at: null,
  }).id
  const geriAlinabilirAsi = db.ekle('asilar', { doktor_id: id, patient_id: hasta, asi_adi: `Geri alinabilir ${m}`, kategori: 'pediatrik', uygulama_tarihi: '2026-02-03', kaynak: 'kayit' }).id
  const eylemKayit = db.ekle('eylem_kayitlari', {
    oneri_id: eylemOneri, doctor_id: id, hasta_id: hasta, eylem_anahtar: 'asi_kaydi_ekle',
    hedef_tablo: 'asilar', hedef_id: geriAlinabilirAsi, once: null, sonra: { asi_adi: `Geri alinabilir ${m}` },
    kaynak: 'ayse_oneri', geri_alindi_at: null,
  }).id
  db.dosyaKoy('ses-kayitlari', `${id}/qa-kayit.m4a`, new Blob(['sentetik ses']))
  // NOTYA-ILETISIM-01: bekleyen bir "Sağlığım'da yeni mesaj" öğesi + geçmiş bir iletişim kaydı
  const kuyruk = db.ekle('iletisim_kuyrugu', { doctor_id: id, patient_id: hasta, tur: 'saglikim_yeni_mesaj', konu_id: konu, planlanan_gun: trGun(0, 12).slice(0, 10), tekil_anahtar: `saglikim_yeni_mesaj:${konu}`, durum: 'bekliyor', ertelendi_at: null }).id
  db.ekle('iletisim_kayitlari', { doctor_id: id, patient_id: hasta, kanal: 'whatsapp', tur: 'randevu_hatirlatma', durum: 'gonderildi', gonderen_personel_id: null })
  // NOTYA-GELEN-BELGELER: kutuda bekleyen bir tahlil PDF'i — okuma şifreli, önerilen hasta bu hekimin hastası
  const gelenBelge = randomUUID()
  const gelenYol = `${id}/gelen/${gelenBelge}.pdf`
  db.dosyaKoy('hasta-belgeler', gelenYol, Buffer.from(`%PDF-1.4 sentetik ${m}`))
  db.ekle('gelen_belgeler', {
    id: gelenBelge, doctor_id: id, patient_id: null, kaynak: 'surukle', durum: 'yeni', dosya_adi: 'qa-gelen.pdf', mime: 'application/pdf', bicim: 'pdf',
    boyut: 20, sha256: 'a'.repeat(63) + harf, depo_yolu: gelenYol, belge_turu: 'Lab Sonucu', okundu: true,
    okuma_sifreli: encrypt(JSON.stringify({ ozet: `Hemogram ${m}`, belgeTuru: 'Lab Sonucu', metin: null, kimlik: { ad: null, dogum: null, tc: null, tcSon: null }, belgeTarihi: null, konsultasyonYaniti: false, okundu: true })),
    gonderen_sifreli: null, oneriler: [{ patient_id: hasta, guven: 85, kesinlik: 'eminim', nedenler: ['ad soyad'] }],
  })
  // NOTYA-TAKIP-01: an open follow-up case. Type 'konsultasyon' without a sevk link on purpose — the sync that runs on
  // every read closes kontrol / gelmedi cases when a future appointment exists, which would depend on the clock.
  const takip = db.ekle('takip_isleri', { doktor_id: id, patient_id: hasta, tur: 'konsultasyon', durum: 'acik', vade: trGun(-2, 12).slice(0, 10), kosullu: false, kaynak_not_id: null, kaynak_randevu_id: null, kaynak_sevk_id: null, ozet: `Takip ${m}`, alinti: null, kapandi_at: null, kapandi_neden: null }).id
  // KONSULTASYONLAR-01: the doctor's consultant address book
  const defter = db.ekle('konsultasyon_defter', { doctor_id: id, ad_soyad: `Dr. Defter ${m}`, brans: 'kulak-burun-bogaz', telefon: null, ofis_telefon: null, adres: null, eposta: null, whatsapp: null, kurum_ici: false, not_metni: null }).id
  const zaman = new Date(Date.now() - 60e3).toISOString()
  const asistanOturum = db.ekle('asistan_sessions', {
    doctor_id: id, patient_id: null, persona_id: 'aysekaya', active_context: {},
    messages: [{ role: 'user', content: 'Sentetik soru', kanal: 'ses', zaman }, { role: 'assistant', content: `Cevap ${m}`, kanal: 'ses', zaman }],
  }).id
  // MUAYENE-EKLERI-07: a vault document attached to this doctor's visit (visit_id = seans); the plaintext carries the marker.
  const yuklenenBelge = db.ekle('medical_documents', { doctor_id: id, patient_id: hasta, visit_id: seans, file_name: `yuklenen-${m}.pdf`, file_type: 'application/pdf', file_size: 40, category: 'Lab Sonucu', uploaded_by: id, storage_backend: 'db', storage_key: 'db:pending', deleted_at: null }).id
  db.tablo('medical_documents').find((r) => r.id === yuklenenBelge)!.storage_key = `db:${yuklenenBelge}`
  db.bloblar.set(yuklenenBelge, encryptBytes(Buffer.from(`%PDF-1.4 icerik ${m}`)).toString('base64'))
  // FOTO-ARSIV-01: an older and a newer clinical photo of the same region. The scan bytes carry the marker; the EXIF carries GPS text that must never be served.
  const fotoSeans = db.ekle('sessions', { doctor_id: id, patient_id: hasta, specialty: 'pediatri', status: 'completed', created_at: dun }).id as string
  const fotoEkle = (ad: string, gunOnce: number, tarih: string) => {
    const bid = db.ekle('medical_documents', { doctor_id: id, patient_id: hasta, visit_id: fotoSeans, file_name: `${ad}-${m}.jpg`, file_type: 'image/jpeg', file_size: 400, category: 'Klinik fotoğraf', uploaded_by: id, storage_backend: 'db', storage_key: 'db:pending', deleted_at: null, created_at: new Date(Date.now() - gunOnce * 86400e3).toISOString() }).id
    db.tablo('medical_documents').find((r) => r.id === bid)!.storage_key = `db:${bid}`
    db.bloblar.set(bid, encryptBytes(fotoGorsel.sentetikJpeg(`pikseller ${m}`)).toString('base64'))
    db.ekle('hasta_foto_meta', { doctor_id: id, patient_id: hasta, belge_id: bid, bolge: 'kol-sag', bolge_kaynagi: 'hekim', favori: false, yildiz: 0, anahtar: false, cekim_tarihi: tarih, gizli: false, ozel_encrypted: encrypt(JSON.stringify({ v: 1, etiketler: ['kontrol'], not: `Foto notu ${m}`, ayarlar: {}, notasyonlar: [] })) })
    return bid
  }
  const fotoOnceki = fotoEkle('onceki', 47, trGun(-47, 12).slice(0, 10))
  const fotoBelge = fotoEkle('yeni', 0, trGun(0, 12).slice(0, 10))
  db.ekle('hasta_foto_kucuk', { doctor_id: id, patient_id: hasta, belge_id: fotoBelge, mime: 'image/jpeg', genislik: 64, yukseklik: 48, veri_encrypted: encryptBytes(fotoGorsel.sentetikJpeg(`kucuk ${m}`)).toString('base64') })
  return { fotoBelge, fotoOnceki, fotoSeans, yuklenenBelge, takip, defter, harf, id, token, hasta, seans, not, bekleyenNot, ilac, panel, belge, randevu, serbestRandevu, talep, hastaDerm, lezyon, dogum, bebekKart, portalToken, konu, asistanEylem, gozGoruntu, belgeAnaliz, dermAnaliz, konsultasyon, konsultasyonYanitli, kasaBelge, asiHatirlatma, eylemOneri, eylemKayit, sonlanmisIlac, kuyruk, gelenBelge, asistanOturum, hileliSeans: '', hileliNot: '' }
}

/** Contamination X planted under Y's patient before the fixes (anon-key session insert, unchecked POSTs). */
function hileliKur(x: Hekim, y: Hekim) {
  const m = isaret(x.harf)
  x.hileliSeans = db.ekle('sessions', { doctor_id: x.id, patient_id: y.hasta, specialty: 'pediatri', status: 'recording' }).id
  x.hileliNot = db.ekle('notes', { session_id: x.hileliSeans, doctor_id: x.id, note_type: 'soap', approved_at: null, content_plan: `Hileli ${m}`, content_ilaclar: [{ ad: x.harf === 'A' ? 'Zyxorin 250 mg' : 'Qwavelin 100 mg', doz: '1', kullanim: '1x1', sure: '5 gün' }], vitaller: {} }).id
  db.ekle('randevular', { doktor_id: x.id, patient_id: y.hasta, baslangic: trGun(0, 12), bitis: dakikaSonra(trGun(0, 12), 20), durum: 'planlandi', tur: 'muayene', notlar: `Hileli ${m}` })
  db.ekle('hasta_ilaclar', { doctor_id: x.id, patient_id: y.hasta, ilac_adi: `Hileli ilac ${m}`, etken_madde: 'x', doz: '1', kullanim_sikli: '1x1', baslangic_tarihi: '2026-09-01', aktif: true, onay_durumu: 'onayli' })
  // KONSULTASYON-01: X'in Y'nin hastasına açtığı konsültasyon — X'in "yanıt bekleyen" listesinde Y'nin hasta adı çözülmemeli
  db.ekle('sevkler', { doctor_id: x.id, patient_id: y.hasta, hedef: 'kulak-burun-bogaz', hedef_brans: 'kulak-burun-bogaz', klinik_soru: `Hileli ${m}`, durum: 'yanit_bekleniyor', istem_tarihi: '2026-09-05', kaynak: 'konsultasyon' })
  // ASI-KARNESI-01 (D): X'in Y'nin hastasına iliştirdiği aşı — X'in hatırlatma listesinde Y'nin hasta adı çözülmemeli
  db.ekle('asilar', { doktor_id: x.id, patient_id: y.hasta, asi_adi: `Hileli asi ${m}`, kategori: 'pediatrik', uygulama_tarihi: '2026-01-01', sonraki_doz_tarihi: trGun(5, 12).slice(0, 10), kaynak: 'kayit', hatirlatma_gonderildi: false })
  // NOTYA-ILETISIM-01: X'in kuyruğunda Y'nin hastasına düşmüş öğe + kaydı — X'in listesinde Y'nin hasta adı çözülmemeli
  db.ekle('iletisim_kuyrugu', { doctor_id: x.id, patient_id: y.hasta, tur: 'saglikim_yeni_mesaj', planlanan_gun: trGun(0, 12).slice(0, 10), tekil_anahtar: `hileli:${m}`, durum: 'bekliyor' })
  db.ekle('iletisim_kayitlari', { doctor_id: x.id, patient_id: y.hasta, kanal: 'whatsapp', tur: 'randevu_hatirlatma', durum: 'gonderildi' })
  // NOTYA-GELEN-BELGELER: X'in kutusunda Y'nin hastasını öneren bayat öğe — X'in listesinde Y'nin hasta adı çözülmemeli
  db.ekle('gelen_belgeler', { doctor_id: x.id, patient_id: null, kaynak: 'yukleme', durum: 'yeni', dosya_adi: 'hileli.pdf', mime: 'application/pdf', bicim: 'pdf', boyut: 1, sha256: 'b'.repeat(63) + x.harf, depo_yolu: null, belge_turu: 'Diğer', okundu: false, okuma_sifreli: null, oneriler: [{ patient_id: y.hasta, guven: 90, kesinlik: 'eminim', nedenler: [] }] })
}

function sahneKur(): { A: Hekim; B: Hekim } {
  db = new SahteVeritabani()
  aiBaglamlari.length = 0
  modelIstekleri.length = 0
  modelYaniti = null
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
/** NOTYA-TEK-BEYIN: ElevenLabs'in Custom LLM isteği — sunucu sırrı başlıkta, imzalı konuşma jetonu extra body'de. */
function sesLlmIste(r: Record<string, any>, j: { d: string; o: string; s: string; p: string | null; pe: string }, mesaj: string) {
  return new NextRequestSinifi('http://localhost/api/asistan/ses-llm/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.NOTYA_SES_LLM_SECRET}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'notya', stream: true, messages: [{ role: 'system', content: 'x' }, { role: 'user', content: mesaj }], elevenlabs_extra_body: { notya_jeton: r.sesJetonuImzala(j) } }),
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

// ─── FOTO-ARSIV-01 / FOTO-AI-01 yardımcıları ─────────────────────────────────────────────────────
const fotoUrl = (h: { hasta: string }, ek = '') => `/api/doktor/hasta-foto/${h.hasta}${ek}`
const fotoPrm = (h: { hasta: string }, belge: string) => prm({ patientId: h.hasta, belgeId: belge })
/** Scripts the (mocked) model for the next photo-AI call. */
const fotoModeli = (yanit: string) => { modelYaniti = () => [{ type: 'text', text: yanit }] }
const fotoAiGonder = (r: Rotalar, a: Hekim, h: Hekim, govde: Record<string, unknown> = {}, belge = h.fotoBelge) =>
  coz(r.fotoAi.POST(iste('POST', fotoUrl(h, `/${belge}/ai`), { token: a.token, govde: { gorsel: fotoGorsel.dataUrl(fotoGorsel.sentetikPng()), ...govde } }), fotoPrm(h, belge)))
const hamIste = (yontem: string, yol: string, token: string, govde: Buffer, tur: string) =>
  new NextRequestSinifi(`http://localhost${yol}`, { method: yontem, headers: { authorization: `Bearer ${token}`, 'content-type': tur }, body: new Uint8Array(govde) } as ConstructorParameters<typeof NextRequestSinifi>[1])

const VAKALAR: Vaka[] = [
  // Hasta kaydı
  { ad: 'GET /api/doktor/hastalar/[id] (hasta detayı)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.hastaDetay.GET(iste('GET', `/api/doktor/hastalar/${h.hasta}`, { token: a.token }), prm({ id: h.hasta }))) },
  { ad: 'PUT /api/doktor/hastalar/[id] (hasta düzenleme)',
    yazdi: (a) => tablo('patients').some((p) => p.id === a.hasta && decrypt(p.name_encrypted).includes('QA Duzenlendi')),
    cagir: (r, a, h) => coz(r.hastaDetay.PUT(iste('PUT', `/api/doktor/hastalar/${h.hasta}`, { token: a.token, govde: { ad_soyad: 'QA Duzenlendi' } }), prm({ id: h.hasta }))) },
  // MUAYENE-EKLERI-07 — "Yüklenen dosyalar": list + file stream of a visit. Foreign visit/file ids are 404.
  { ad: 'GET /api/doktor/muayene-ekleri/yuklenenler (muayenenin yüklenen dosya listesi)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.yuklenenler.GET(iste('GET', `/api/doktor/muayene-ekleri/yuklenenler?sessionId=${h.seans}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/muayene-ekleri/yuklenenler/[belgeId] (dosya akışı; yabancı seans + yabancı belge)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.yuklenenDosya.GET(iste('GET', `/api/doktor/muayene-ekleri/yuklenenler/${h.yuklenenBelge}?sessionId=${h.seans}`, { token: a.token }), prm({ belgeId: h.yuklenenBelge }))) },
  { ad: 'GET /api/doktor/muayene-ekleri/yuklenenler/[belgeId] (kendi seansı + yabancı belge)', red: 404,
    cagir: (r, a, h) => coz(r.yuklenenDosya.GET(iste('GET', `/api/doktor/muayene-ekleri/yuklenenler/${h.yuklenenBelge}?sessionId=${a.seans}`, { token: a.token }), prm({ belgeId: h.yuklenenBelge }))) },
  // FOTO-ARSIV-01 — clinical photo archive. A foreign patient id or photo id is 404; reads carry only the caller's own marker.
  { ad: 'GET /api/doktor/hasta-foto/[patientId] (fotoğraf arşivi listesi)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.fotoListe.GET(iste('GET', fotoUrl(h), { token: a.token }), prm({ patientId: h.hasta }))) },
  { ad: 'GET /api/doktor/hasta-foto/[patientId]/[belgeId] (fotoğraf ayrıntısı, not + düzenleme)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.fotoDetay.GET(iste('GET', fotoUrl(h, `/${h.fotoBelge}`), { token: a.token }), fotoPrm(h, h.fotoBelge))) },
  { ad: 'PATCH /api/doktor/hasta-foto/[patientId]/[belgeId] (favori, etiket)', red: 404,
    yazdi: (a) => tablo('hasta_foto_meta').some((m) => m.doctor_id === a.id && m.belge_id === a.fotoBelge && m.favori === true),
    cagir: (r, a, h) => coz(r.fotoDetay.PATCH(iste('PATCH', fotoUrl(h, `/${h.fotoBelge}`), { token: a.token, govde: { favori: true } }), fotoPrm(h, h.fotoBelge))) },
  { ad: 'GET /api/doktor/hasta-foto/[patientId]/[belgeId]/dosya (görüntü akışı)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.fotoDosya.GET(iste('GET', fotoUrl(h, `/${h.fotoBelge}/dosya`), { token: a.token }), fotoPrm(h, h.fotoBelge))) },
  { ad: 'GET /api/doktor/hasta-foto/[patientId]/[belgeId]/kucuk (küçük resim)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.fotoKucuk.GET(iste('GET', fotoUrl(h, `/${h.fotoBelge}/kucuk`), { token: a.token }), fotoPrm(h, h.fotoBelge))) },
  { ad: 'PUT /api/doktor/hasta-foto/[patientId]/[belgeId]/kucuk (küçük resim yaz)', red: 404,
    yazdi: (a) => tablo('hasta_foto_kucuk').some((k) => k.doctor_id === a.id && k.belge_id === a.fotoBelge && k.genislik === 80),
    cagir: (r, a, h) => coz(r.fotoKucuk.PUT(hamIste('PUT', fotoUrl(h, `/${h.fotoBelge}/kucuk?w=80&h=60`), a.token, fotoGorsel.sentetikJpeg('yeni kucuk'), 'image/jpeg'), fotoPrm(h, h.fotoBelge))) },
  { ad: 'POST /api/doktor/hasta-foto/[patientId]/toplu (toplu favori)', red: 404,
    yazdi: (a) => tablo('hasta_foto_meta').some((m) => m.doctor_id === a.id && m.belge_id === a.fotoOnceki && m.favori === true),
    cagir: (r, a, h) => coz(r.fotoToplu.POST(iste('POST', fotoUrl(h, '/toplu'), { token: a.token, govde: { islem: 'favori', belgeIds: [h.fotoOnceki], deger: true } }), prm({ patientId: h.hasta }))) },
  { ad: 'POST /api/doktor/hasta-foto/[patientId]/rapor (PDF fotoğraf raporu)', red: 404,
    cagir: (r, a, h) => coz(r.fotoRapor.POST(iste('POST', fotoUrl(h, '/rapor'), { token: a.token, govde: { duzen: 'tek', ogeler: [{ belgeId: h.fotoBelge, gorsel: fotoGorsel.dataUrl(fotoGorsel.sentetikPng(48, 36)) }] } }), prm({ patientId: h.hasta }))) },
  { ad: 'GET /api/doktor/hasta-foto/[patientId]/[belgeId]/ai (kayıtlı değerlendirme)', red: 404,
    cagir: (r, a, h) => coz(r.fotoAi.GET(iste('GET', fotoUrl(h, `/${h.fotoBelge}/ai`), { token: a.token }), fotoPrm(h, h.fotoBelge))) },
  { ad: 'POST /api/doktor/hasta-foto/[patientId]/[belgeId]/ai (yapay zekâ değerlendirme)', red: 404, okur: true,
    cagir: (r, a, h) => { fotoModeli(fotoGorsel.sahteFotoAiYaniti(isaret(a.harf))); return fotoAiGonder(r, a, h) } },
  { ad: 'POST /api/doktor/hasta-foto/[patientId]/[belgeId]/ai/karsilastir (değişim analizi)', red: 404, okur: true,
    cagir: (r, a, h) => {
      fotoModeli(fotoGorsel.sahteKarsilastirmaYaniti(isaret(a.harf)))
      const g = fotoGorsel.dataUrl(fotoGorsel.sentetikPng())
      return coz(r.fotoKarsilastir.POST(iste('POST', fotoUrl(h, `/${h.fotoBelge}/ai/karsilastir`), { token: a.token, govde: { onceki: h.fotoOnceki, gorsel: g, oncekiGorsel: g } }), fotoPrm(h, h.fotoBelge)))
    } },
  { ad: 'POST /api/doktor/hasta-foto/[patientId]/[belgeId]/ai/geri-bildirim (Kabul/Düzelt/Reddet)', red: 404,
    yazdi: (a) => tablo('hasta_foto_geri_bildirim').some((g) => g.doctor_id === a.id && g.belge_id === a.fotoBelge && g.karar === 'kabul') && tablo('hasta_foto_ogrenme').some((g) => g.doctor_id === a.id),
    cagir: async (r, a, h) => {
      fotoModeli(fotoGorsel.sahteFotoAiYaniti(isaret(a.harf)))
      await fotoAiGonder(r, a, h) // own photo: stores the evaluation the feedback refers to; foreign: 404, nothing stored
      return coz(r.fotoGeriBildirim.POST(iste('POST', fotoUrl(h, `/${h.fotoBelge}/ai/geri-bildirim`), { token: a.token, govde: { gozlemAnahtari: 'morfoloji', karar: 'kabul' } }), fotoPrm(h, h.fotoBelge)))
    } },
  { ad: 'POST /api/doktor/hasta-foto/[patientId]/kalite (çekim öncesi kalite kapısı)', red: 404,
    cagir: (r, a, h) => { fotoModeli(fotoGorsel.sahteKaliteYaniti()); return coz(r.fotoKalite.POST(iste('POST', fotoUrl(h, '/kalite'), { token: a.token, govde: { gorsel: fotoGorsel.dataUrl(fotoGorsel.sentetikPng()) } }), prm({ patientId: h.hasta }))) } },
  { ad: 'GET /api/doktor/hastalar (hasta listesi)', okur: true,
    cagir: (r, a) => coz(r.hastalar.GET(iste('GET', '/api/doktor/hastalar', { token: a.token }))) },
  { ad: 'GET /api/doktor/hastalar/[id]/sessions (muayene geçmişi)', okur: true,
    cagir: (r, a, h) => coz(r.hastaSeanslari.GET(iste('GET', `/api/doktor/hastalar/${h.hasta}/sessions`, { token: a.token }), prm({ id: h.hasta }))) },
  { ad: 'GET /api/doktor/hastalar/[id]/buyume-egrileri', red: 404,
    cagir: (r, a, h) => coz(r.buyume.GET(iste('GET', `/api/doktor/hastalar/${h.hasta}/buyume-egrileri`, { token: a.token }), prm({ id: h.hasta }))) },
  { ad: 'GET /api/doktor/hastalar/[id]/hedef-boy', red: 404,
    cagir: (r, a, h) => coz(r.hedefBoy.GET(iste('GET', `/api/doktor/hastalar/${h.hasta}/hedef-boy`, { token: a.token }), prm({ id: h.hasta }))) },
  // MOBIL-PERSONEL-01: asistan / doktor manual measurements
  { ad: 'GET /api/doktor/hastalar/[id]/olcumler', red: 404,
    cagir: (r, a, h) => coz(r.olcumler.GET(iste('GET', `/api/doktor/hastalar/${h.hasta}/olcumler`, { token: a.token }), prm({ id: h.hasta }))) },
  { ad: 'POST /api/doktor/hastalar/[id]/olcumler (ölçüm ekle)', red: 404,
    yazdi: (a) => tablo('cihaz_olcumleri').some((o) => o.patient_id === a.hasta && o.doctor_id === a.id && o.kaynak === 'manuel'),
    cagir: (r, a, h) => coz(r.olcumler.POST(iste('POST', `/api/doktor/hastalar/${h.hasta}/olcumler`, { token: a.token, govde: { tur: 'ates', deger: '37.2' } }), prm({ id: h.hasta }))) },
  // Notlar
  { ad: 'GET /api/notes/[id] (not detayı)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.notDetay.GET(iste('GET', `/api/notes/${h.not}`, { token: a.token }), prm({ id: h.not }))) },
  { ad: 'GET /api/notes?pending=true (inceleme kuyruğu)', okur: true,
    cagir: (r, a) => coz(r.notlar.GET(iste('GET', '/api/notes?pending=true', { token: a.token }))) },
  { ad: 'POST /api/notes/[id]/approve (not onayı)', red: 404,
    yazdi: (a) => !!tablo('notes').find((n) => n.id === a.bekleyenNot)?.approved_at,
    cagir: (r, a, h) => coz(r.notOnay.POST(iste('POST', `/api/notes/${h.bekleyenNot}/approve`, { token: a.token, govde: {} }), prm({ id: h.bekleyenNot }))) },
  // NOTYA-ILAC-SONLANDIR-01: onay satırındaki "Geri al" — yabancı notla ya da yabancı ilaç kimliğiyle hiçbir satır dirilmez
  { ad: 'POST /api/notes/[id]/ilac-sonlandir-geri-al (Geri al)', red: 404,
    yazdi: (a) => tablo('hasta_ilaclar').find((x) => x.id === a.sonlanmisIlac)?.aktif === true,
    cagir: (r, a, h) => coz(r.ilacSonlandirGeriAl.POST(iste('POST', `/api/notes/${h.not}/ilac-sonlandir-geri-al`, { token: a.token, govde: { ilacIds: [h.sonlanmisIlac] } }), prm({ id: h.not }))) },
  { ad: 'POST /api/notes/[id]/ilac-sonlandir-geri-al (kendi notu + yabancı ilaç kimliği)',
    cagir: (r, a, h) => coz(r.ilacSonlandirGeriAl.POST(iste('POST', `/api/notes/${a.not}/ilac-sonlandir-geri-al`, { token: a.token, govde: { ilacIds: [h.sonlanmisIlac] } }), prm({ id: a.not }))) },
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
  // NOTYA-RANDEVU-V2 — Sağlığım randevu talepleri (doktor + sekreter). Yabancı talep görülmez, yanıtlanamaz.
  { ad: 'GET /api/doktor/randevu-portal/talepler', okur: true,
    cagir: (r, a) => coz(r.randevuTalepleri.GET(iste('GET', '/api/doktor/randevu-portal/talepler', { token: a.token }))) },
  { ad: 'GET /api/doktor/randevu-portal/talepler?slotlar (Başka saat öner)', red: 404,
    cagir: (r, a, h) => coz(r.randevuTalepleri.GET(iste('GET', `/api/doktor/randevu-portal/talepler?slotlar=${h.talep}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/randevu-portal/talepler (reddet)', red: 404,
    yazdi: (a) => tablo('randevular').find((x) => x.id === a.talep)?.durum === 'iptal',
    cagir: (r, a, h) => coz(r.randevuTalepleri.POST(iste('POST', '/api/doktor/randevu-portal/talepler', { token: a.token, govde: { id: h.talep, islem: 'reddet' } }))) },
  { ad: 'GET /api/doktor/randevu-portal/ayar',
    cagir: (r, a) => coz(r.randevuPortalAyar.GET(iste('GET', '/api/doktor/randevu-portal/ayar', { token: a.token }))) },
  // NOTYA-EYLEM — Ayşe hazırlar, hekim onaylar. Yabancı bir öneri okunamaz, onaylanamaz, geri alınamaz.
  { ad: 'GET /api/doktor/eylem (bekleyen öneriler)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.eylem.GET(iste('GET', `/api/doktor/eylem?hastaId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/eylem onayla (yabancı öneriyi kaydetme)', red: 404,
    yazdi: (a) => tablo('asilar').some((x) => x.patient_id === a.hasta && x.asi_adi === `Eylem asi ${isaret(a.harf)}`),
    cagir: (r, a, h) => coz(r.eylem.POST(iste('POST', '/api/doktor/eylem', { token: a.token, govde: { adim: 'onayla', oneriId: h.eylemOneri } }))) },
  { ad: 'POST /api/doktor/eylem vazgec (yabancı öneriyi düşürme)', red: 404,
    yazdi: (a) => tablo('eylem_onerileri').find((x) => x.id === a.eylemOneri)?.durum === 'vazgecildi',
    cagir: (r, a, h) => coz(r.eylem.POST(iste('POST', '/api/doktor/eylem', { token: a.token, govde: { adim: 'vazgec', oneriId: h.eylemOneri } }))) },
  { ad: 'POST /api/doktor/eylem geri_al (yabancı kaydı geri alma)', red: 404,
    yazdi: (a) => !!tablo('eylem_kayitlari').find((x) => x.id === a.eylemKayit)?.geri_alindi_at,
    cagir: (r, a, h) => coz(r.eylem.POST(iste('POST', '/api/doktor/eylem', { token: a.token, govde: { adim: 'geri_al', kayitId: h.eylemKayit } }))) },
  // NOTYA-TAKIP-01 — follow-up cases (doktor + sekreter). The list is the practice's own; a foreign case cannot be closed.
  { ad: 'GET /api/doktor/takip (açık takip işleri)', okur: true,
    cagir: (r, a) => coz(r.takip.GET(iste('GET', '/api/doktor/takip', { token: a.token }))) },
  { ad: 'PATCH /api/doktor/takip kapat (yabancı takip işini kapatma)', red: 404,
    yazdi: (a) => tablo('takip_isleri').find((x) => x.id === a.takip)?.durum === 'kapandi',
    cagir: (r, a, h) => coz(r.takip.PATCH(iste('PATCH', '/api/doktor/takip', { token: a.token, govde: { id: h.takip, islem: 'kapat' } }))) },
  // KONSULTASYONLAR-01 — konsültan defteri (doktor + sekreter). Holds no patient data; a foreign entry cannot be read, edited or deleted.
  { ad: 'GET /api/doktor/konsultasyon/defter', okur: true,
    cagir: (r, a) => coz(r.konsultasyonDefter.GET(iste('GET', '/api/doktor/konsultasyon/defter', { token: a.token }))) },
  { ad: 'PATCH /api/doktor/konsultasyon/defter (yabancı kaydı düzenleme)', red: 404,
    yazdi: (a) => tablo('konsultasyon_defter').find((x) => x.id === a.defter)?.ad_soyad === 'Dr. QA Duzenlendi',
    cagir: (r, a, h) => coz(r.konsultasyonDefter.PATCH(iste('PATCH', '/api/doktor/konsultasyon/defter', { token: a.token, govde: { id: h.defter, adSoyad: 'Dr. QA Duzenlendi', brans: 'kulak-burun-bogaz' } }))) },
  { ad: 'DELETE /api/doktor/konsultasyon/defter (yabancı kaydı silme)', red: 404,
    yazdi: (a) => !tablo('konsultasyon_defter').some((x) => x.id === a.defter),
    cagir: (r, a, h) => coz(r.konsultasyonDefter.DELETE(iste('DELETE', `/api/doktor/konsultasyon/defter?id=${h.defter}`, { token: a.token }))) },
  // Araçlar
  { ad: 'POST /api/doktor/araclar/epikriz (kendi seansı + yabancı hastaId)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.epikriz.POST(iste('POST', '/api/doktor/araclar/epikriz', { token: a.token, govde: { hastaId: h.hasta, seansId: a.seans } }))) },
  { ad: 'GET /api/doktor/araclar/enabiz?hastaId (e-Nabız masası)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.enabizMasa.GET(iste('GET', `/api/doktor/araclar/enabiz?hastaId=${h.hasta}`, { token: a.token }))) },
  // MBYS-YARDIMCI-01 — Gün sonu MBYS kuyruğu: a foreign visit's record / status / identity is never read or written.
  { ad: 'GET /api/doktor/araclar/enabiz/mbys?notId (MBYS kaydı)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.enabizMbys.GET(iste('GET', `/api/doktor/araclar/enabiz/mbys?notId=${h.not}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/araclar/enabiz/mbys?hastaId (dosyada MBYS durumu)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.enabizMbys.GET(iste('GET', `/api/doktor/araclar/enabiz/mbys?hastaId=${h.hasta}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/araclar/enabiz/mbys?gun (MBYS kuyruğu)', okur: true,
    cagir: (r, a) => coz(r.enabizMbys.GET(iste('GET', `/api/doktor/araclar/enabiz/mbys?gun=${new Date(Date.now() - 86400e3 + 3 * 3600e3).toISOString().slice(0, 10)}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/araclar/enabiz/mbys durum (Kaydettim)', red: 404,
    yazdi: (a) => tablo('mbys_aktarimlar').some((x) => x.note_id === a.not && x.doctor_id === a.id && x.patient_id === a.hasta && x.durum === 'kaydedildi'),
    cagir: (r, a, h) => coz(r.enabizMbys.POST(iste('POST', '/api/doktor/araclar/enabiz/mbys', { token: a.token, govde: { islem: 'durum', notId: h.not, durum: 'kaydedildi' } }))) },
  { ad: 'POST /api/doktor/araclar/enabiz/mbys kimlik (MBYS kimlik bilgileri)', red: 404,
    yazdi: (a) => tablo('mbys_hasta_kimlik').some((x) => x.patient_id === a.hasta && x.doctor_id === a.id),
    cagir: (r, a, h) => coz(r.enabizMbys.POST(iste('POST', '/api/doktor/araclar/enabiz/mbys', { token: a.token, govde: { islem: 'kimlik', hastaId: h.hasta, kimlik: { kayitTuru: 'yabanci', pasaportNo: 'QA123', ad: 'QA', soyad: 'Hasta' } } }))) },
  // Branş modülleri
  { ad: 'GET /api/doktor/asilar', okur: true,
    cagir: (r, a, h) => coz(r.asilar.GET(iste('GET', `/api/doktor/asilar?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'POST /api/doktor/asilar', red: 404,
    yazdi: (a) => tablo('asilar').some((x) => x.patient_id === a.hasta && x.asi_adi === 'QA Yeni Asi'),
    cagir: (r, a, h) => coz(r.asilar.POST(iste('POST', '/api/doktor/asilar', { token: a.token, govde: { patientId: h.hasta, asiAdi: 'QA Yeni Asi' } }))) },
  // ASI-KARNESI-01: karne onayı — dışarıdan gelen tek kimlik Kasa belgesi; hasta belgeden türetilir. Yabancı belge = 404.
  { ad: 'POST /api/doktor/asilar/karne onayla (Kasa belgesinden toplu onay)', red: 404,
    yazdi: (a) => tablo('asilar').some((x) => x.patient_id === a.hasta && x.doktor_id === a.id && x.belge_id === a.kasaBelge && x.asi_adi === 'QA Karne KKK' && x.kaynak === 'beyan'),
    cagir: (r, a, h) => coz(r.asiKarne.POST(iste('POST', '/api/doktor/asilar/karne', { token: a.token, govde: { adim: 'onayla', belgeId: h.kasaBelge, hekimOnayi: true, satirlar: [{ asiAdi: 'QA Karne KKK', dozNo: 1, uygulamaTarihi: '2020-03-05' }] } }))) },
  // ASI-KARNESI-01 (C7): hekimin karne PDF'i — yabancı hasta 404 (PDF gövdesi ikilidir; kapsam hastaSahibiMi + (doktor, hasta) sorgusu)
  // ASI-KARNESI-01 (D): hekim onaylı hatırlatma — yabancı aşı kaydı 404, kurbanın hastasına mesaj açılmaz
  { ad: 'POST /api/doktor/asilar/hatirlatma (hekim onaylı aşı hatırlatması)', red: 404,
    yazdi: (a) => tablo('hasta_mesaj_konulari').some((x) => x.patient_id === a.hasta && x.doctor_id === a.id && x.konu === 'Aşı hatırlatması') && tablo('asilar').find((x) => x.id === a.asiHatirlatma)?.hatirlatma_gonderildi === true,
    cagir: (r, a, h) => coz(r.asiHatirlatma.POST(iste('POST', '/api/doktor/asilar/hatirlatma', { token: a.token, govde: { asiId: h.asiHatirlatma, hekimOnayi: true } }))) },
  { ad: 'GET /api/doktor/asilar/hatirlatma?patientId (hasta dosyası › Aşılar)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.asiHatirlatma.GET(iste('GET', `/api/doktor/asilar/hatirlatma?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/asilar/karne/pdf (aşı karnesi PDF)', red: 404,
    cagir: (r, a, h) => coz(r.asiKarnePdf.GET(iste('GET', `/api/doktor/asilar/karne/pdf?patientId=${h.hasta}`, { token: a.token }))) },
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
  { ad: 'POST /api/doktor/araclar/nota-ekle (araç sonucunu bugünkü muayene formuna ekle)', red: 404,
    yazdi: (a) => String(tablo('notes').find((n) => n.id === a.bekleyenNot)?.content_degerlendirme || '').includes('VA / logMAR'),
    cagir: (r, a, h) => coz(r.aracNotaEkle.POST(iste('POST', '/api/doktor/araclar/nota-ekle', { token: a.token, govde: { patientId: h.hasta, arac: 'VA / logMAR', satirlar: ['OD (sağ): önceki 0,5 · bugün 0,8'] } }))) },
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
  // Mesajlar / hatırlatma / intake
  { ad: 'POST /api/doktor/mesajlar', red: 404,
    yazdi: (a) => tablo('hasta_mesaj_konulari').filter((x) => x.patient_id === a.hasta).length > 1,
    cagir: (r, a, h) => coz(r.mesajlar.POST(iste('POST', '/api/doktor/mesajlar', { token: a.token, govde: { patientId: h.hasta, konu: 'QA', metin: 'QA mesaj' } }))) },
  { ad: 'GET /api/doktor/mesajlar/[konuId]', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.mesajKonu.GET(iste('GET', `/api/doktor/mesajlar/${h.konu}`, { token: a.token }), prm({ konuId: h.konu }))) },
  // NOTYA-ILETISIM-01 — tek dokunuş iletişim. Yabancı hasta / kuyruk / randevu / aşı kimliği 404; adı, telefonu, e-postası dönmez.
  { ad: 'POST /api/doktor/iletisim/hazirla (patientId)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.iletisimHazirla.POST(iste('POST', '/api/doktor/iletisim/hazirla', { token: a.token, govde: { tur: 'kontrol_hatirlatma', patientId: h.hasta } }))) },
  { ad: 'POST /api/doktor/iletisim/hazirla (kuyrukId)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.iletisimHazirla.POST(iste('POST', '/api/doktor/iletisim/hazirla', { token: a.token, govde: { kuyrukId: h.kuyruk } }))) },
  { ad: 'POST /api/doktor/iletisim/hazirla (randevuId)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.iletisimHazirla.POST(iste('POST', '/api/doktor/iletisim/hazirla', { token: a.token, govde: { tur: 'randevu_hatirlatma', randevuId: h.randevu } }))) },
  { ad: 'POST /api/doktor/iletisim/hazirla (kendi hastası + yabancı aşı kaydı)', red: 404,
    cagir: (r, a, h) => coz(r.iletisimHazirla.POST(iste('POST', '/api/doktor/iletisim/hazirla', { token: a.token, govde: { tur: 'asi_hatirlatma', patientId: a.hasta, asiId: h.asiHatirlatma } }))) },
  { ad: 'GET /api/doktor/iletisim/kayit?patientId', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.iletisimKayit.GET(iste('GET', `/api/doktor/iletisim/kayit?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/iletisim/kayit (son gönderilenler)', okur: true,
    cagir: (r, a) => coz(r.iletisimKayit.GET(iste('GET', '/api/doktor/iletisim/kayit', { token: a.token }))) },
  { ad: 'POST /api/doktor/iletisim/kayit (açıldı)', red: 404,
    yazdi: (a) => tablo('iletisim_kayitlari').some((x) => x.patient_id === a.hasta && x.doctor_id === a.id && x.durum === 'acildi'),
    cagir: (r, a, h) => coz(r.iletisimKayit.POST(iste('POST', '/api/doktor/iletisim/kayit', { token: a.token, govde: { patientId: h.hasta, kanal: 'whatsapp', tur: 'kontrol_hatirlatma' } }))) },
  { ad: 'PATCH /api/doktor/iletisim/kayit (gönderildi → kuyruk öğesi kapanır)', red: 404,
    yazdi: (a) => tablo('iletisim_kuyrugu').find((x) => x.id === a.kuyruk)?.durum === 'gonderildi',
    cagir: (r, a, h) => coz(r.iletisimKayit.PATCH(iste('PATCH', '/api/doktor/iletisim/kayit', { token: a.token, govde: { patientId: h.hasta, tur: 'saglikim_yeni_mesaj', kuyrukId: h.kuyruk } }))) },
  { ad: 'PATCH /api/doktor/iletisim/kayit (kendi hastası + yabancı aşı kaydı işaretlenmez)',
    yazdi: (a) => tablo('asilar').find((x) => x.id === a.asiHatirlatma)?.hatirlatma_gonderildi === true,
    cagir: (r, a, h) => coz(r.iletisimKayit.PATCH(iste('PATCH', '/api/doktor/iletisim/kayit', { token: a.token, govde: { patientId: a.hasta, tur: 'asi_hatirlatma', asiId: h.asiHatirlatma } }))) },
  { ad: 'POST /api/doktor/iletisim/izin', red: 404,
    yazdi: (a) => tablo('patients').find((x) => x.id === a.hasta)?.iletisim_izni_eposta === true && tablo('iletisim_izin_kayitlari').some((x) => x.patient_id === a.hasta && x.doctor_id === a.id),
    cagir: (r, a, h) => coz(r.iletisimIzin.POST(iste('POST', '/api/doktor/iletisim/izin', { token: a.token, govde: { patientId: h.hasta, kanal: 'eposta', izin: true } }))) },
  { ad: 'GET /api/doktor/iletisim/izin', red: 404,
    cagir: (r, a, h) => coz(r.iletisimIzin.GET(iste('GET', `/api/doktor/iletisim/izin?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/iletisim/kuyruk (Hazır mesajlar)', okur: true,
    cagir: (r, a) => coz(r.iletisimKuyruk.GET(iste('GET', '/api/doktor/iletisim/kuyruk', { token: a.token }))) },
  { ad: 'PATCH /api/doktor/iletisim/kuyruk (atla)', red: 404,
    yazdi: (a) => tablo('iletisim_kuyrugu').find((x) => x.id === a.kuyruk)?.durum === 'atlandi',
    cagir: (r, a, h) => coz(r.iletisimKuyruk.PATCH(iste('PATCH', '/api/doktor/iletisim/kuyruk', { token: a.token, govde: { id: h.kuyruk, islem: 'atla' } }))) },
  // NOTYA-GELEN-BELGELER — Gelen Belgeler kutusu. Liste yalnız kendi öğeleri + kendi hastalarının adı; yabancı öğe / hasta 404.
  { ad: 'GET /api/doktor/gelen-belgeler (kutu)', okur: true,
    cagir: (r, a) => coz(r.gelenBelgeler.GET(iste('GET', '/api/doktor/gelen-belgeler', { token: a.token }))) },
  { ad: 'GET /api/doktor/gelen-belgeler?hastaAra (Başka hasta seç)', okur: true,
    cagir: (r, a) => coz(r.gelenBelgeler.GET(iste('GET', `/api/doktor/gelen-belgeler?hastaAra=${encodeURIComponent('QA Hasta')}`, { token: a.token }))) },
  { ad: 'PATCH /api/doktor/gelen-belgeler/[id] (dosyala)', red: 404,
    yazdi: (a) => tablo('medical_documents').some((x) => x.patient_id === a.hasta && x.file_name === 'qa-gelen.pdf') && tablo('gelen_belgeler').find((x) => x.id === a.gelenBelge)?.durum === 'dosyalandi',
    cagir: (r, a, h) => coz(r.gelenBelge.PATCH(iste('PATCH', `/api/doktor/gelen-belgeler/${h.gelenBelge}`, { token: a.token, govde: { islem: 'dosyala', patientId: h.hasta } }), prm({ id: h.gelenBelge }))) },
  { ad: 'PATCH /api/doktor/gelen-belgeler/[id] (kendi öğesi + yabancı hasta dosyalanmaz)', red: 404,
    yazdi: (a) => tablo('medical_documents').some((x) => x.patient_id === a.hasta && x.file_name === 'qa-gelen.pdf'),
    cagir: (r, a, h) => coz(r.gelenBelge.PATCH(iste('PATCH', `/api/doktor/gelen-belgeler/${a.gelenBelge}`, { token: a.token, govde: { islem: 'dosyala', patientId: h.hasta } }), prm({ id: a.gelenBelge }))) },
  { ad: 'PATCH /api/doktor/gelen-belgeler/[id] (sil)', red: 404,
    yazdi: (a) => tablo('gelen_belgeler').find((x) => x.id === a.gelenBelge)?.durum === 'silindi',
    cagir: (r, a, h) => coz(r.gelenBelge.PATCH(iste('PATCH', `/api/doktor/gelen-belgeler/${h.gelenBelge}`, { token: a.token, govde: { islem: 'sil' } }), prm({ id: h.gelenBelge }))) },
  { ad: 'POST /api/doktor/intake-formlari', red: 404,
    yazdi: (a) => tablo('hasta_intake_formlari').some((x) => x.patient_id === a.hasta),
    cagir: (r, a, h) => coz(r.intake.POST(iste('POST', '/api/doktor/intake-formlari', { token: a.token, govde: { patientId: h.hasta } }))) },
  // KONSULTASYON-01 — kapalı döngü konsültasyon (evrensel rota)
  { ad: 'GET /api/doktor/konsultasyon?patientId (hastanın konsültasyonları)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.konsultasyon.GET(iste('GET', `/api/doktor/konsultasyon?patientId=${h.hasta}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/konsultasyon?form (yazdırılabilir istem formu)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.konsultasyon.GET(iste('GET', `/api/doktor/konsultasyon?form=${h.konsultasyon}`, { token: a.token }))) },
  { ad: 'GET /api/doktor/konsultasyon?bekleyen (kohort satırı — yanıt bekleyenler)', okur: true,
    cagir: (r, a) => coz(r.konsultasyon.GET(iste('GET', '/api/doktor/konsultasyon?bekleyen=1', { token: a.token }))) },
  { ad: 'GET /api/doktor/konsultasyon?bekleyen=sayi (ana sayfa özeti — yanıt bekleyen sayısı)',
    cagir: (r, a) => coz(r.konsultasyon.GET(iste('GET', '/api/doktor/konsultasyon?bekleyen=sayi', { token: a.token }))) },
  { ad: 'POST /api/doktor/konsultasyon (istem oluştur)', red: 404,
    yazdi: (a) => tablo('sevkler').some((x) => x.patient_id === a.hasta && x.doctor_id === a.id && x.klinik_soru === 'QA işitme kaybı var mı?' && x.durum === 'yanit_bekleniyor'),
    cagir: (r, a, h) => coz(r.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', { token: a.token, govde: { patientId: h.hasta, hedefBrans: 'kulak-burun-bogaz', klinikSoru: 'QA işitme kaybı var mı?' } }))) },
  { ad: 'PATCH /api/doktor/konsultasyon yanit (yabancı konsültasyon)', red: 404,
    yazdi: (a) => tablo('sevkler').find((x) => x.id === a.konsultasyon)?.durum === 'yanitlandi',
    cagir: (r, a, h) => coz(r.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', { token: a.token, govde: { id: h.konsultasyon, islem: 'yanit', yanitOzeti: 'QA işitme kaybı saptanmadı.' } }))) },
  { ad: 'PATCH /api/doktor/konsultasyon yanit (kendi konsültasyonu + yabancı Kasa raporu)', red: 404,
    yazdi: (a) => tablo('sevkler').find((x) => x.id === a.konsultasyon)?.belge_id === a.kasaBelge,
    cagir: (r, a, h) => coz(r.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', { token: a.token, govde: { id: a.konsultasyon, islem: 'yanit', yanitOzeti: 'QA işitme kaybı saptanmadı.', belgeId: h.kasaBelge } }))) },
  { ad: 'PATCH /api/doktor/konsultasyon kapat (yanıtsız kapat)', red: 404,
    yazdi: (a) => tablo('sevkler').find((x) => x.id === a.konsultasyon)?.durum === 'kapandi_yanitsiz',
    cagir: (r, a, h) => coz(r.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', { token: a.token, govde: { id: h.konsultasyon, islem: 'kapat' } }))) },
  { ad: 'PATCH /api/doktor/konsultasyon nota_ekle (yanıtı bugünkü muayene formuna ekle)', red: 404,
    yazdi: (a) => String(tablo('notes').find((n) => n.id === a.bekleyenNot)?.content_degerlendirme || '').includes('Konsültasyon yanıtı') && tablo('sevkler').find((x) => x.id === a.konsultasyonYanitli)?.note_id === a.bekleyenNot,
    cagir: (r, a, h) => coz(r.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', { token: a.token, govde: { id: h.konsultasyonYanitli, islem: 'nota_ekle' } }))) },
  // AYSE-KONSULTASYON-01 (A): istem düzenleme — A, B'nin istemini düzenleyemez; kurbanın metni ve izi değişmez
  { ad: 'PATCH /api/doktor/konsultasyon duzenle (istem metnini düzenle + düzenleme izi)', red: 404,
    yazdi: (a) => tablo('sevkler').find((x) => x.id === a.konsultasyon)?.klinik_soru === 'QA düzenlenmiş istem metni: işitme kaybı var mı?'
      && tablo('konsultasyon_revizyonlar').some((r) => r.sevk_id === a.konsultasyon && r.doctor_id === a.id && r.patient_id === a.hasta && String(r.onceki).startsWith('İşitme kaybı var mı?')),
    cagir: (r, a, h) => coz(r.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', { token: a.token, govde: { id: h.konsultasyon, islem: 'duzenle', klinikSoru: 'QA düzenlenmiş istem metni: işitme kaybı var mı?' } }))) },
  // AYSE-KONSULTASYON-01 (B/C): Ayşe taslakları — yabancı hastanın dosyası / raporu modele GİTMEZ, hiçbir şey yazılmaz
  { ad: 'POST /api/doktor/konsultasyon istem_taslagi (Ayşe istem taslağı — hasta dosyası modele)', red: 404,
    yazdi: (a) => modelIstekleri.some((m) => m.includes(isaret(a.harf))),
    cagir: (r, a, h) => coz(r.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', { token: a.token, govde: { islem: 'istem_taslagi', patientId: h.hasta, hedefBrans: 'kulak-burun-bogaz' } }))) },
  { ad: 'POST /api/doktor/konsultasyon yanit_taslagi (Ayşe yanıt özeti taslağı — yabancı konsültasyon)', red: 404,
    cagir: (r, a, h) => coz(r.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', { token: a.token, govde: { islem: 'yanit_taslagi', id: h.konsultasyonYanitli } }))) },
  { ad: 'POST /api/doktor/konsultasyon yanit_taslagi (kendi konsültasyonu + yabancı Kasa raporu)', red: 404,
    cagir: (r, a, h) => coz(r.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', { token: a.token, govde: { islem: 'yanit_taslagi', id: a.konsultasyon, belgeId: h.kasaBelge } }))) },
  { ad: 'PATCH /api/doktor/konsultasyon hatirlat (hastaya Sağlığım mesajı)', red: 404,
    yazdi: (a) => tablo('hasta_mesaj_konulari').some((x) => x.patient_id === a.hasta && x.doctor_id === a.id && x.konu === 'Konsültasyon sonucu hatırlatması'),
    cagir: (r, a, h) => coz(r.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', { token: a.token, govde: { id: h.konsultasyon, islem: 'hatirlat' } }))) },
  // Asistan
  { ad: 'POST /api/asistan/chat (hasta bağlamı modele gider)', red: 404,
    yazdi: (a) => modelIstekleri.some((m) => m.includes(a.hasta)),
    cagir: (r, a, h) => coz(r.asistanChat.POST(iste('POST', '/api/asistan/chat', { token: a.token, govde: { message: 'Hastanın durumu nasıl?', patientId: h.hasta, specialty: 'pediatri' } }))) },
  // NOTYA-TEK-BEYIN: sesli Ayşe'nin Custom LLM ucu — kimlikler yalnız imzalı jetondan; jetondaki hasta ve oturum yine doktora kapsanır
  { ad: 'POST /api/asistan/ses-llm (jetondaki hasta modele gider)',
    yazdi: (a) => modelIstekleri.some((m) => m.includes(a.hasta)),
    cagir: (r, a, h) => coz(r.sesLlm.POST(sesLlmIste(r, { d: a.id, o: a.asistanOturum, s: 'pediatri', p: h.hasta, pe: 'aysekaya' }, 'Hastanın durumu nasıl?'))) },
  { ad: 'POST /api/asistan/ses-llm (jetondaki oturumun geçmişi modele gider)',
    yazdi: (a) => modelIstekleri.some((m) => m.includes(isaret(a.harf))),
    cagir: (r, a, h) => coz(r.sesLlm.POST(sesLlmIste(r, { d: a.id, o: h.asistanOturum, s: 'pediatri', p: null, pe: 'aysekaya' }, 'Az önce ne demiştin?'))) },
  { ad: 'GET /api/asistan/ses-ekran (sesli turların ekran biçimi)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.sesEkran.GET(iste('GET', `/api/asistan/ses-ekran?oturum=${h.asistanOturum}`, { token: a.token }))) },
  // NOTYA-SAYFA-HASTA-01/02: sayfa açılınca asistan odağı — yabancı hasta ve yabancı oturum ikisi de 404 (varlık sızmaz; hiçbir şey yazılmaz)
  { ad: 'POST /api/asistan/oturum-hasta (kendi oturumu + yabancı hasta)', red: 404, okur: true,
    yazdi: (a) => tablo('asistan_sessions').find((x) => x.id === a.asistanOturum)?.active_context?.currentPatientId === a.hasta,
    cagir: (r, a, h) => coz(r.oturumHasta.POST(iste('POST', '/api/asistan/oturum-hasta', { token: a.token, govde: { asistanSessionId: a.asistanOturum, patientId: h.hasta } }))) },
  { ad: 'POST /api/asistan/oturum-hasta (yabancı oturum + kendi hastası)', red: 404,
    yazdi: (a) => tablo('asistan_sessions').find((x) => x.id === a.asistanOturum)?.active_context?.currentPatientId === a.hasta,
    cagir: (r, a, h) => coz(r.oturumHasta.POST(iste('POST', '/api/asistan/oturum-hasta', { token: a.token, govde: { asistanSessionId: h.asistanOturum, patientId: a.hasta } }))) },
  { ad: 'POST /api/asistan/learn (düzeltme işareti)',
    yazdi: (a) => tablo('asistan_actions').find((x) => x.id === a.asistanEylem)?.was_corrected === true,
    cagir: (r, a, h) => coz(r.asistanLearn.POST(iste('POST', '/api/asistan/learn', { token: a.token, govde: { actionId: h.asistanEylem, correctionType: 'ton', original: 'a', corrected: 'b' } }))) },
]

// ─── Paket ──────────────────────────────────────────────────────────────────────────────────────
describe('HASTA-İZOLASYON: doktor A ve doktor B birbirinin hastasına hiçbir rotadan ulaşamaz', () => {
  let R: Rotalar
  before(async () => {
    ;({ encrypt, decrypt } = await import('../security/encryption'))
    ;({ encryptBytes } = await import('../vault/crypto'))
    NextRequestSinifi = (await import('next/server')).NextRequest
    fotoGorsel = await import('../doktor/fotoArsiv/testGorselleri')
    const ice = (y: string) => import(`../../${y}`)
    R = {
      hastalar: await ice('app/api/doktor/hastalar/route'),
      hastaDetay: await ice('app/api/doktor/hastalar/[id]/route'),
      hastaSeanslari: await ice('app/api/doktor/hastalar/[id]/sessions/route'),
      buyume: await ice('app/api/doktor/hastalar/[id]/buyume-egrileri/route'),
      hedefBoy: await ice('app/api/doktor/hastalar/[id]/hedef-boy/route'),
      olcumler: await ice('app/api/doktor/hastalar/[id]/olcumler/route'),
      notlar: await ice('app/api/notes/route'),
      notDetay: await ice('app/api/notes/[id]/route'),
      notOnay: await ice('app/api/notes/[id]/approve/route'),
      ilacSonlandirGeriAl: await ice('app/api/notes/[id]/ilac-sonlandir-geri-al/route'),
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
      enabizMasa: await ice('app/api/doktor/araclar/enabiz/route'),
      enabizMbys: await ice('app/api/doktor/araclar/enabiz/mbys/route'),
      asilar: await ice('app/api/doktor/asilar/route'),
      asiKarne: await ice('app/api/doktor/asilar/karne/route'),
      asiKarnePdf: await ice('app/api/doktor/asilar/karne/pdf/route'),
      asiHatirlatma: await ice('app/api/doktor/asilar/hatirlatma/route'),
      portalAsiKarnesiPdf: await ice('app/api/portal/hasta/[token]/asi-karnesi/pdf/route'),
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
      aracNotaEkle: await ice('app/api/doktor/araclar/nota-ekle/route'),
      konsultasyon: await ice('app/api/doktor/konsultasyon/route'),
      eylem: await ice('app/api/doktor/eylem/route'),
      pedi: await ice('app/api/doktor/pediatri/route'),
      pediTarama: await ice('app/api/doktor/pediatri/tarama/route'),
      pediKohort: await ice('app/api/doktor/pediatri/kohort/route'),
      jine: await ice('app/api/doktor/jinekoloji/route'),
      goruntuleme: await ice('app/api/doktor/goruntuleme/route'),
      goruntulemeYukle: await ice('app/api/doktor/goruntuleme/yukle/route'),
      ingest: await ice('app/api/doktor/belgeler/ingest/route'),
      mesajlar: await ice('app/api/doktor/mesajlar/route'),
      mesajKonu: await ice('app/api/doktor/mesajlar/[konuId]/route'),
      iletisimHazirla: await ice('app/api/doktor/iletisim/hazirla/route'),
      iletisimKayit: await ice('app/api/doktor/iletisim/kayit/route'),
      iletisimIzin: await ice('app/api/doktor/iletisim/izin/route'),
      iletisimKuyruk: await ice('app/api/doktor/iletisim/kuyruk/route'),
      gelenBelgeler: await ice('app/api/doktor/gelen-belgeler/route'),
      gelenBelge: await ice('app/api/doktor/gelen-belgeler/[id]/route'),
      kalkan: await ice('app/api/doktor/fisilti/kalkan/route'),
      seansPaketi: await ice('app/api/doktor/seans-paketi/route'),
      seansPaketiBugun: await ice('app/api/doktor/seans-paketi/bugun/route'),
      intake: await ice('app/api/doktor/intake-formlari/route'),
      asistanLearn: await ice('app/api/asistan/learn/route'),
      asistanChat: await ice('app/api/asistan/chat/route'),
      fishTur: await ice('app/api/asistan/fish-tur/route'),
      sesLlm: await ice('app/api/asistan/ses-llm/v1/chat/completions/route'),
      sesEkran: await ice('app/api/asistan/ses-ekran/route'),
      oturumHasta: await ice('app/api/asistan/oturum-hasta/route'),
      sesJetonuImzala: (await import('../asistan/sesJetonu')).sesJetonuImzala,
      portal: await ice('app/api/portal/hasta/[token]/route'),
      portalMesajlar: await ice('app/api/portal/hasta/[token]/mesajlar/route'),
      portalRandevu: await ice('app/api/portal/hasta/[token]/randevu/route'),
      portalBelge: await ice('app/api/portal/hasta/[token]/belge/[id]/route'),
      yuklenenler: await ice('app/api/doktor/muayene-ekleri/yuklenenler/route'),
      yuklenenDosya: await ice('app/api/doktor/muayene-ekleri/yuklenenler/[belgeId]/route'),
      fotoListe: await ice('app/api/doktor/hasta-foto/[patientId]/route'),
      fotoToplu: await ice('app/api/doktor/hasta-foto/[patientId]/toplu/route'),
      fotoRapor: await ice('app/api/doktor/hasta-foto/[patientId]/rapor/route'),
      fotoKalite: await ice('app/api/doktor/hasta-foto/[patientId]/kalite/route'),
      fotoDetay: await ice('app/api/doktor/hasta-foto/[patientId]/[belgeId]/route'),
      fotoDosya: await ice('app/api/doktor/hasta-foto/[patientId]/[belgeId]/dosya/route'),
      fotoKucuk: await ice('app/api/doktor/hasta-foto/[patientId]/[belgeId]/kucuk/route'),
      fotoAi: await ice('app/api/doktor/hasta-foto/[patientId]/[belgeId]/ai/route'),
      fotoKarsilastir: await ice('app/api/doktor/hasta-foto/[patientId]/[belgeId]/ai/karsilastir/route'),
      fotoGeriBildirim: await ice('app/api/doktor/hasta-foto/[patientId]/[belgeId]/ai/geri-bildirim/route'),
      takip: await ice('app/api/doktor/takip/route'),
      konsultasyonDefter: await ice('app/api/doktor/konsultasyon/defter/route'),
      konsultan: await ice('app/api/konsultan/route'),
      randevuTalepleri: await ice('app/api/doktor/randevu-portal/talepler/route'),
      randevuPortalAyar: await ice('app/api/doktor/randevu-portal/ayar/route'),
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
      it(`${saldiran}: Ayşe istem taslağı yabancı hekimin kendi hastasına düşmüş seans/notunu modele taşımaz`, async () => {
        const s = sahneKur()
        const x = s[saldiran]
        const y = await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', { token: x.token, govde: { islem: 'istem_taslagi', patientId: x.hasta, hedefBrans: 'kulak-burun-bogaz' } })))
        assert.equal(y.status, 200)
        assert.ok(modelIstekleri.length > 0, 'model çağrılmadı — vaka boşa koştu')
        for (const m of modelIstekleri) {
          assert.ok(m.includes(isaret(saldiran)), 'kendi hastasının dosyası modele gitmedi')
          assert.ok(!m.includes(isaret(kurbanHarf)), `SIZINTI: ${kurbanHarf} hekiminin kirli notu taslak bağlamına girdi`)
          assert.ok(!m.includes('Zyxorin') && !m.includes('Qwavelin'), 'SIZINTI: yabancı hekimin kirli reçetesi taslak bağlamına girdi')
        }
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

  /**
   * NOTYA-AYSE-ARAC-PARITE — Ayşe's read tools (lib/asistan/okumaAraclari.ts) run in process inside ayseCevapla.
   * They take TEXT and a DATE from the model, never an id, and are executed for the authenticated doctor. Here the
   * model is made to call both with the victim's patient NAME and today's date; the second model request carries the
   * tool results, so anything the tools read is visible to the test. The read routers are switched off for the turn
   * (audit switch), so the tools are the only way to the data. Both written chat and the voice route.
   */
  describe('Ayşe okuma araçları (hasta_bul, randevu_takvim): yabancı hekimin hastası adıyla da bulunamaz', () => {
    const AD = 'Nazlı Karşıyaka'
    const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
    /** A second patient of doctor `k`, with a name that carries no marker and a chart that does. */
    function adliHasta(k: Hekim): string {
      const m = isaret(k.harf)
      const hasta = db.ekle('patients', {
        doctor_id: k.id, is_active: true,
        name_encrypted: encrypt(JSON.stringify({ ad: AD })), dob_encrypted: encrypt('2020-05-05'), gender_encrypted: encrypt('female'),
        phone_encrypted: encrypt(`0555 ${m}`), email_encrypted: null,
        notes_encrypted: encrypt(JSON.stringify({ anneAdi: `Anne ${m}`, alerjiler: [`Alerji ${m}`] })),
      }).id
      db.ekle('hasta_ilaclar', { doctor_id: k.id, patient_id: hasta, ilac_adi: `Adli ilac ${m}`, etken_madde: 'sentetik', doz: '1', kullanim_sikli: '1x1', baslangic_tarihi: '2026-09-01', aktif: true, onay_durumu: 'onayli' })
      return hasta
    }
    /** First request: both read tools; once the request carries tool results: an answer that repeats them. */
    function araclariCagir(): void {
      modelYaniti = (istek) => {
        const sonuclar: string[] = []
        for (const msg of (istek.messages || []) as { content?: unknown }[]) {
          if (Array.isArray(msg.content)) for (const b of msg.content as { type?: string; content?: unknown }[]) if (b?.type === 'tool_result') sonuclar.push(String(b.content ?? ''))
        }
        if (sonuclar.length) return [{ type: 'text', text: JSON.stringify({ speech: `Araç sonucu: ${sonuclar.join(' | ')}` }) }]
        return [
          { type: 'tool_use', id: 'toolu_a', name: 'hasta_bul', input: { isim: `${AD}’nın alerjisi ne` } },
          { type: 'tool_use', id: 'toolu_b', name: 'hasta_bul', input: { isim: `${AD}’nın annesinin adı ne` } },
          { type: 'tool_use', id: 'toolu_c', name: 'randevu_takvim', input: { tarih: bugunTr() } },
        ]
      }
    }
    const SORU = `${AD}’nın alerjisi neydi, annesinin adı ne ve bugün kimler geliyor?`
    // The second turn of each case is a DIFFERENT sentence. Since NOTYA-SES-ARKA-01 / NOTYA-SES-TEK-CEVAP-01
    // (0f97c058, 79c503fd) the voice route answers a question once: the same sentence sent again in the same session
    // closes the turn before the model, so no tool would run and the case would test nothing.
    const SORU_2 = `${AD} dosyasında ilaç kaydı, eksikler ve velisinin telefonu nedir, takvimde kim var?`
    const cagrilar: { ad: string; cagir: (x: Hekim, soru?: string) => Promise<Yanit> }[] = [
      { ad: 'POST /api/asistan/chat', cagir: (x, soru = SORU) => coz(R.asistanChat.POST(iste('POST', '/api/asistan/chat', { token: x.token, govde: { message: soru, specialty: 'pediatri', saatDilimi: 'Europe/Istanbul' } }))) },
      { ad: 'POST /api/asistan/fish-tur', cagir: (x, soru = SORU) => coz(R.fishTur.POST(iste('POST', '/api/asistan/fish-tur', { token: x.token, govde: { mesaj: soru, asistanSessionId: x.asistanOturum, specialty: 'pediatri', personaId: 'aysekaya', saatDilimi: 'Europe/Istanbul' } }))) },
    ]
    async function okumaTuru<T>(is: () => Promise<T>): Promise<T> {
      process.env.NOTYA_HIZLI_YOL_KAPALI = '1'
      try { return await is() } finally { delete process.env.NOTYA_HIZLI_YOL_KAPALI }
    }

    for (const c of cagrilar) {
      it(`${c.ad} — pozitif kontrol: hekim kendi hastasını araçla bulur (araç gerçekten çalışıyor)`, async () => {
        const { A } = sahneKur()
        adliHasta(A)
        araclariCagir()
        const y = await okumaTuru(() => c.cagir(A))
        assert.equal(y.status, 200, y.metin.slice(0, 300))
        // The identity call ends the turn with the value on screen; run the chart and calendar calls on their own too.
        assert.ok(modelIstekleri.length >= 1)
        modelYaniti = (istek) => {
          const var_ = JSON.stringify(istek.messages || []).includes('tool_result')
          // NOTYA-AYSE-ALAN-01: hasta_alan gives a placeholder; the model writes it, the server puts the value in.
          return var_ ? [{ type: 'text', text: JSON.stringify({ speech: 'Annesinin adı {{ALAN:anne_adi}}.' }) }] : [
            { type: 'tool_use', id: 'toolu_a', name: 'hasta_bul', input: { isim: `${AD}’nın alerjisi ne` } },
            { type: 'tool_use', id: 'toolu_c', name: 'randevu_takvim', input: { tarih: bugunTr() } },
            { type: 'tool_use', id: 'toolu_d', name: 'hasta_alan', input: { alan: 'anne_adi', hasta_adi: AD } },
            // NOTYA-AYSE-ANALIZ-01: the three analysis tools, by the patient's name.
            { type: 'tool_use', id: 'toolu_f', name: 'muayene_ara', input: { terim: 'Adli ilac', hasta_adi: AD } },
            { type: 'tool_use', id: 'toolu_g', name: 'muayeneleri_oku', input: { adet: 4, hasta_adi: AD } },
            { type: 'tool_use', id: 'toolu_h', name: 'eksikler', input: { hasta_adi: AD } },
          ]
        }
        modelIstekleri.length = 0
        const y2 = await okumaTuru(() => c.cagir(A, SORU_2))
        const sonIstek = modelIstekleri[modelIstekleri.length - 1]
        assert.ok(sonIstek.includes('tool_result'), 'araç sonucu modele dönmedi — vaka boşa koştu')
        assert.ok(sonIstek.includes(`Alerji ${isaret('A')}`), 'kendi hastasının alerjisi araç sonucunda yok')
        assert.ok(sonIstek.includes(`QA Hasta A ${isaret('A')}`), 'kendi randevusu araç sonucunda yok')
        // The analysis tools found the doctor's own patient: the drug record, the (empty) visit list, the gaps header.
        assert.ok(sonIstek.includes(`Adli ilac ${isaret('A')}`), 'muayene_ara kendi hastasının ilaç kaydını bulmadı')
        assert.ok(sonIstek.includes(`${AD} için onaylı muayene notu yok.`), 'muayeneleri_oku kendi hastasını okumadı')
        assert.ok(sonIstek.includes(`${AD} — eksikler ve açık işler`), 'eksikler kendi hastasını okumadı')
        // hasta_alan: the tool issued a placeholder for the doctor's own patient and no model request carries the value.
        assert.ok(sonIstek.includes('{{ALAN:anne_adi}}'), 'hasta_alan kendi hastası için yer tutucu vermedi')
        for (const m of modelIstekleri) assert.ok(!m.includes(`Anne ${isaret('A')}`), 'kimlik değeri modele gitti')
        // Written chat delivers the value; the spoken turn points at the screen (the value is in ses-ekran, not in speech).
        if (c.ad.includes('/chat')) assert.ok(y2.metin.includes(`Annesinin adı Anne ${isaret('A')}.`), 'kendi hastasının değeri teslim edilmedi')
        else assert.ok(!y2.metin.includes(`Anne ${isaret('A')}`) && y2.metin.includes('ekranınıza yazdım'), 'sesli turda değer söylendi')
      })

      for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
        it(`${c.ad} — ${saldiran} → ${kurbanHarf}: araçlar kurbanın hastasını, kimliğini, takvimini okumaz`, async () => {
          const s = sahneKur()
          const arayan = s[saldiran], kurban = s[kurbanHarf]
          const kurbanHastasi = adliHasta(kurban)
          const once = anlikGoruntu(kurban)
          // Two turns: the identity call (ends the turn), then chart + calendar (results go back to the model).
          araclariCagir()
          const y1 = await okumaTuru(() => c.cagir(arayan))
          modelYaniti = (istek) => {
            const sonuclar: string[] = []
            for (const msg of (istek.messages || []) as { content?: unknown }[]) {
              if (Array.isArray(msg.content)) for (const b of msg.content as { type?: string; content?: unknown }[]) if (b?.type === 'tool_result') sonuclar.push(String(b.content ?? ''))
            }
            // NOTYA-AYSE-ALAN-01: the victim's identity fields asked by name; the model also writes placeholders the
            // tool never issued (a name that is not this doctor's patient gets none) — they must be removed, not filled.
            return sonuclar.length ? [{ type: 'text', text: JSON.stringify({ speech: `Araç sonucu: ${sonuclar.join(' | ')} Annesi {{ALAN:anne_adi}}, telefonu {{ALAN:telefon}}.` }) }] : [
              { type: 'tool_use', id: 'toolu_a', name: 'hasta_bul', input: { isim: `${AD}’nın alerjisi ne` } },
              { type: 'tool_use', id: 'toolu_c', name: 'randevu_takvim', input: { tarih: bugunTr() } },
              { type: 'tool_use', id: 'toolu_d', name: 'hasta_alan', input: { alan: 'anne_adi', hasta_adi: AD } },
              { type: 'tool_use', id: 'toolu_e', name: 'hasta_alan', input: { alan: 'telefon', hasta_adi: AD } },
              // NOTYA-AYSE-ANALIZ-01: the victim's visits, drug records and gaps, asked by the victim's patient name.
              { type: 'tool_use', id: 'toolu_f', name: 'muayene_ara', input: { terim: 'Adli ilac', hasta_adi: AD } },
              { type: 'tool_use', id: 'toolu_g', name: 'muayeneleri_oku', input: { adet: 4, hasta_adi: AD } },
              { type: 'tool_use', id: 'toolu_h', name: 'eksikler', input: { hasta_adi: AD } },
            ]
          }
          const y2 = await okumaTuru(() => c.cagir(arayan, SORU_2))
          assert.ok(modelIstekleri.some((m) => m.includes('tool_result')), 'araç turu koşmadı — vaka boşa koştu')
          for (const y of [y1, y2]) {
            assert.equal(y.status, 200, y.metin.slice(0, 300))
            assert.ok(!y.metin.includes(isaret(kurbanHarf)) && !y.metin.includes(kurbanHastasi) && !y.metin.includes(kurban.hasta), `SIZINTI: ${kurbanHarf} hekiminin verisi yanıtta: ${y.metin.slice(0, 400)}`)
          }
          for (const m of modelIstekleri) assert.ok(!m.includes(isaret(kurbanHarf)) && !m.includes(kurbanHastasi) && !m.includes(kurban.hasta), `SIZINTI: ${kurbanHarf} hekiminin verisi modele / araç sonucuna girdi`)
          // (The prompt rule shows the generic form "{{ALAN:…}}"; an ISSUED placeholder names a field.)
          assert.ok(modelIstekleri.some((m) => m.includes('Bu hastayı kayıtlarınızda bulamadım.')), 'hasta_alan çağrılmadı — vaka boşa koştu')
          // Five name-taking calls (two hasta_alan, three analysis tools): every one answered "not found".
          assert.ok(modelIstekleri.some((m) => m.split('Bu hastayı kayıtlarınızda bulamadım.').length - 1 >= 5), 'analiz araçları yabancı hasta için "bulunamadı" dışında bir şey döndü')
          assert.ok(!modelIstekleri.some((m) => m.includes('eksikler ve açık işler') || m.includes('onaylı muayenenin')), 'analiz aracı yabancı hastanın dosyasını okudu')
          assert.ok(!modelIstekleri.some((m) => m.includes('yaz: {{ALAN:')), 'hasta_alan yabancı hasta için yer tutucu verdi')
          assert.ok(!y2.metin.includes('{{ALAN'), 'verilmeyen yer tutucu yanıtta kaldı')
          // The attacker's assistant session did not take the victim's patient as its focus, and nothing of the victim changed.
          for (const o of tablo('asistan_sessions').filter((r) => r.doctor_id === arayan.id)) {
            assert.ok(!JSON.stringify(o).includes(kurbanHastasi) && !JSON.stringify(o).includes(isaret(kurbanHarf)), 'SIZINTI: kurbanın hastası saldıranın oturumuna yazıldı')
          }
          const sonra = anlikGoruntu(kurban)
          assert.equal(sonra.sahip, once.sahip)
          assert.deepEqual([...sonra.atiflar].filter((x) => !once.atiflar.has(x)), [])
        })
      }
    }
  })

  // KONSULTASYON-02 — Araçlar › Bekleyen Konsültasyonlar + ana sayfa özeti: hekim düzeyinde liste, kimlik girdisi yok;
  // kapsam oturumdaki hekim. A, B'nin bekleyenini ne listede ne sayıda görür; kendi kirli satırı (B'nin hastasına) da düşer.
  describe('Bekleyen konsültasyonlar yalnız oturumdaki hekimin', () => {
    for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${saldiran} hekimi ${kurbanHarf} hekiminin bekleyen konsültasyonlarını GÖREMEZ (liste + sayı)`, async () => {
        const s = sahneKur()
        const x = s[saldiran], k = s[kurbanHarf]
        const liste = await coz(R.konsultasyon.GET(iste('GET', '/api/doktor/konsultasyon?bekleyen=1', { token: x.token })))
        assert.equal(liste.status, 200)
        const j = JSON.parse(liste.metin) as { bekleyenler: Array<{ id: string; patientId: string }> }
        assert.deepEqual(j.bekleyenler.map((b) => b.id), [x.konsultasyon], 'yalnız kendi hastasına açtığı kendi istemi')
        assert.ok(!j.bekleyenler.some((b) => b.id === k.konsultasyon), `${kurbanHarf}'nin konsültasyonu listede`)
        assert.ok(!j.bekleyenler.some((b) => b.patientId === k.hasta), `${kurbanHarf}'nin hastası listede (kirli satır dahil)`)
        assert.ok(!liste.metin.includes(isaret(kurbanHarf)) && !liste.metin.includes(k.hasta))
        const sayi = await coz(R.konsultasyon.GET(iste('GET', '/api/doktor/konsultasyon?bekleyen=sayi', { token: x.token })))
        assert.equal(sayi.status, 200)
        assert.equal(JSON.parse(sayi.metin).sayi, 1, `sayı ${kurbanHarf}'nin satırını ya da kirli satırı saymamalı`)
        assert.ok(!sayi.metin.includes(isaret(kurbanHarf)) && !sayi.metin.includes(k.hasta))
      })
    }
    it('oturum yoksa liste de sayı da 401', async () => {
      sahneKur()
      for (const q of ['bekleyen=1', 'bekleyen=sayi']) {
        const y = await coz(R.konsultasyon.GET(iste('GET', `/api/doktor/konsultasyon?${q}`, {})))
        assert.equal(y.status, 401, q)
      }
    })
  })

  // ASI-KARNESI-01 (D) — hekim düzeyinde hatırlatma listesi: kimlik girdisi yok, kapsam oturumdaki hekim.
  describe('Aşı hatırlatma listesi yalnız oturumdaki hekimin hastaları', () => {
    for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${saldiran} hekimi ${kurbanHarf} hekiminin hastasını listede GÖREMEZ (kendi kirli satırı dahil)`, async () => {
        const s = sahneKur()
        const x = s[saldiran], k = s[kurbanHarf]
        const y = await coz(R.asiHatirlatma.GET(iste('GET', '/api/doktor/asilar/hatirlatma', { token: x.token })))
        assert.equal(y.status, 200, y.metin.slice(0, 200))
        const j = JSON.parse(y.metin) as { satirlar: Array<{ asiId: string; patientId: string }> }
        assert.deepEqual(j.satirlar.map((r) => r.asiId), [x.asiHatirlatma])
        assert.ok(!j.satirlar.some((r) => r.patientId === k.hasta), `${kurbanHarf}'nin hastası listede`)
        assert.ok(!y.metin.includes(isaret(kurbanHarf)) && !y.metin.includes(k.hasta))
      })
    }
  })

  describe('Yanıtsız konsültasyon sil — yabancı id 404', () => {
    for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${saldiran} → ${kurbanHarf}: yanıtsız kapatılmış satır silinemez (404); kurban satırı kalır`, async () => {
        const s = sahneKur()
        const arayan = s[saldiran], kurban = s[kurbanHarf]
        const kapali = db.ekle('sevkler', {
          doctor_id: kurban.id, patient_id: kurban.hasta, hedef: 'kulak-burun-bogaz', hedef_brans: 'kulak-burun-bogaz',
          klinik_soru: `Silinecek mi? ${isaret(kurbanHarf)}`, durum: 'kapandi_yanitsiz', kaynak: 'konsultasyon',
        })
        const y = await coz(R.konsultasyon.PATCH(iste('PATCH', '/api/doktor/konsultasyon', { token: arayan.token, govde: { id: kapali.id, islem: 'sil' } })))
        assert.equal(y.status, 404)
        assert.ok(tablo('sevkler').some((x) => x.id === kapali.id), 'kurban satırı silinmemeli')
      })
    }
  })

  /**
   * KONSULTASYONLAR-01 — the consultant portal has NO account: a link (signed token) names exactly one consultation.
   * What it shows comes from that consultation's doctor and patient and nothing else. The source muayene note
   * (`sevkler.kaynak_not_id`) arrives in the request body when the doctor creates the request, so it is the one id an
   * attacker controls: doctor X must not be able to make the portal show doctor Y's note — neither through the create
   * route (404) nor through a row that already carries a foreign note id (legacy / direct insert).
   */
  describe('Konsültan portalı (hesapsız, jetonlu): yalnız isteyen hekimin o hastaya ait notu', () => {
    const ISTEM = { hedefBrans: 'kulak-burun-bogaz', klinikSoru: 'QA işitme kaybı var mı, değerlendirir misiniz?' }
    const RAPOR = { ad: 'rapor.pdf', mime: 'application/pdf', base64: Buffer.from('%PDF-1.4 sentetik konsultan raporu').toString('base64') }
    let jeton: (sevkId: string) => string
    before(async () => {
      const { konsultanJetonu } = await import('../doktor/konsultanJeton')
      jeton = (sevkId) => konsultanJetonu(sevkId, Date.now() + 86400e3)!
    })
    const portalOku = (t: string) => coz(R.konsultan.GET(iste('GET', `/api/konsultan?t=${encodeURIComponent(t)}`)))
    const portalYaz = (t: string) => coz(R.konsultan.POST(iste('POST', '/api/konsultan', { govde: { t, not: 'QA işitme kaybı saptanmadı.', dosyalar: [RAPOR] } })))

    it('pozitif kontrol: kendi hastası + kendi onaylı notu → portal o notun cümlelerini ve hasta adını gösterir; yanıt kendi dosyasına düşer', async () => {
      const { A } = sahneKur()
      const y = await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', { token: A.token, govde: { patientId: A.hasta, ...ISTEM, kaynakNotId: A.not } })))
      assert.equal(y.status, 201, y.metin.slice(0, 300))
      const id = JSON.parse(y.metin).konsultasyon.id as string
      assert.equal(tablo('sevkler').find((x) => x.id === id)?.kaynak_not_id, A.not)
      const g = await portalOku(jeton(id))
      assert.equal(g.status, 200, g.metin.slice(0, 300))
      assert.ok(g.metin.includes(`Plan ${isaret('A')}`) && g.metin.includes(`Tani ${isaret('A')}`), `onaylı not cümleleri portalda yok: ${g.metin.slice(0, 400)}`)
      assert.ok(g.metin.includes(`QA Hasta A ${isaret('A')}`), 'kendi hastasının adı portalda yok')
      const p = await portalYaz(jeton(id))
      assert.equal(p.status, 200, p.metin.slice(0, 300))
      assert.ok(String(tablo('notes').find((n) => n.id === A.not)?.content_degerlendirme || '').includes('QA işitme kaybı saptanmadı.'), 'konsültan notu isteyen muayeneye düşmedi')
      assert.ok(tablo('medical_documents').some((d) => d.doctor_id === A.id && d.patient_id === A.hasta && d.category === 'konsultasyon'), 'rapor kendi hastasının kasasına düşmedi')
    })

    it('jetonsuz 400; sahte, bozuk ve süresi geçmiş jeton 404 — hiçbir şey okunmaz', async () => {
      const { A } = sahneKur()
      const { konsultanJetonu } = await import('../doktor/konsultanJeton')
      assert.equal((await coz(R.konsultan.GET(iste('GET', '/api/konsultan')))).status, 400)
      const gecerli = jeton(A.konsultasyon)
      for (const t of [`${A.konsultasyon}.${Date.now() + 86400e3}.sahteimza`, `${gecerli}x`, konsultanJetonu(A.konsultasyon, Date.now() - 1000) || 'yok', 'rastgele-jeton']) {
        const g = await portalOku(t)
        assert.equal(g.status, 404, t.slice(0, 40))
        assert.ok(!g.metin.includes(isaret('A')))
        assert.equal((await portalYaz(t)).status, 404)
      }
    })

    for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${saldiran} → ${kurbanHarf}: yabancı muayene notu kaynak gösterilemez (404), kirli satırdan da okunmaz / yazılmaz`, async () => {
        const s = sahneKur()
        const x = s[saldiran], k = s[kurbanHarf]
        const once = anlikGoruntu(k)
        // 1) create route: the victim's note id in the body → 404, no row
        const sevkSayisi = tablo('sevkler').length
        const y = await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', { token: x.token, govde: { patientId: x.hasta, ...ISTEM, kaynakNotId: k.not } })))
        assert.equal(y.status, 404, y.metin.slice(0, 300))
        assert.equal(tablo('sevkler').length, sevkSayisi, 'yabancı notla istem kaydedildi')
        // 2) a row that already points at the victim's note (attacker's own patient): the portal shows none of it
        const kirli = db.ekle('sevkler', { doctor_id: x.id, patient_id: x.hasta, hedef: 'kulak-burun-bogaz', hedef_brans: 'kulak-burun-bogaz', klinik_soru: 'QA kirli satır sorusu', durum: 'yanit_bekleniyor', istem_tarihi: '2026-09-05', kaynak: 'konsultasyon', kaynak_not_id: k.not, belge_id: null, belge_idler: null, konsultan_notu: null }).id
        const g = await portalOku(jeton(kirli))
        assert.equal(g.status, 200, g.metin.slice(0, 300))
        assert.ok(!g.metin.includes(isaret(kurbanHarf)), `SIZINTI: ${kurbanHarf} hekiminin notu konsültan portalında: ${g.metin.slice(0, 400)}`)
        assert.deepEqual(JSON.parse(g.metin).dilim.onayliCumleler, [], 'yabancı nottan cümle çıktı')
        // … and the consultant's reply is not written into the victim's note
        const p = await portalYaz(jeton(kirli))
        assert.equal(p.status, 200, p.metin.slice(0, 300))
        // 3) the attacker's own note of ANOTHER patient of his is not a source for this patient either
        const baskaHasta = db.ekle('patients', { doctor_id: x.id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Baska Hasta' })) }).id
        const baskaSeans = db.ekle('sessions', { doctor_id: x.id, patient_id: baskaHasta, specialty: 'pediatri', status: 'completed' }).id
        const baskaNot = db.ekle('notes', { session_id: baskaSeans, doctor_id: x.id, note_type: 'soap', approved_at: new Date().toISOString(), content_plan: 'BASKA-HASTA-PLANI gizli kalmali', content_ilaclar: [], vitaller: {} }).id
        const y3 = await coz(R.konsultasyon.POST(iste('POST', '/api/doktor/konsultasyon', { token: x.token, govde: { patientId: x.hasta, ...ISTEM, kaynakNotId: baskaNot } })))
        assert.equal(y3.status, 404, 'başka hastanın notu bu hastanın istemine kaynak oldu')
        const kirli3 = db.ekle('sevkler', { doctor_id: x.id, patient_id: x.hasta, hedef: 'kulak-burun-bogaz', hedef_brans: 'kulak-burun-bogaz', klinik_soru: 'QA kirli satır sorusu 3', durum: 'yanit_bekleniyor', istem_tarihi: '2026-09-05', kaynak: 'konsultasyon', kaynak_not_id: baskaNot, belge_id: null, belge_idler: null, konsultan_notu: null }).id
        assert.ok(!(await portalOku(jeton(kirli3))).metin.includes('BASKA-HASTA-PLANI'), 'başka hastanın notu konsültana gösterildi')
        // 4) the attacker's row filed under the VICTIM's patient (hileliKur): no victim name, and no upload into the victim's vault
        const hileli = tablo('sevkler').find((r) => r.doctor_id === x.id && r.patient_id === k.hasta)!
        const hg = await portalOku(jeton(String(hileli.id)))
        assert.ok(!hg.metin.includes(isaret(kurbanHarf)), `SIZINTI: ${kurbanHarf} hekiminin hasta adı konsültan portalında`)
        const hp = await portalYaz(jeton(String(hileli.id)))
        assert.notEqual(hp.status, 200, 'yabancı hastanın kasasına rapor yüklendi')
        assert.ok(!tablo('medical_documents').some((d) => d.patient_id === k.hasta && d.doctor_id === x.id), 'yabancı hastaya belge yazıldı')
        const sonra = anlikGoruntu(k)
        assert.equal(sonra.sahip, once.sahip, 'kurbanın satırı değişti')
        assert.deepEqual([...sonra.atiflar].filter((a) => !once.atiflar.has(a) && !a.startsWith('sevkler:')), [], 'kurbanın kimliğine yeni atıf')
      })
    }
  })

  /**
   * NOTYA-PORTAL-TETKIK-01 + KONSULTASYON-01 — Sağlığım › belge indirme. The document id comes from the URL: it is
   * served only when it is THIS patient's document filed by the token's doctor, behind the PIN. A consultation
   * report (linked to a consultation, or filed as one) is never listed and never served — the patient sees only
   * "yönlendirildiniz · sonuç alındı".
   */
  describe('Sağlığım belge indirme: yalnız token\'ın hastası + doktoru; konsültasyon raporu hiç', () => {
    async function cerezAl(token: string): Promise<string> {
      const { setUnlockCookie, UNLOCK_COOKIE } = await import('../portal/pinAuth')
      const { NextResponse } = await import('next/server')
      const res = NextResponse.json({})
      setUnlockCookie(res, token)
      return `${UNLOCK_COOKIE}=${res.cookies.get(UNLOCK_COOKIE)?.value}`
    }
    for (const [hastaHarf, digerHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${hastaHarf} hastası: kendi tahlili iner; ${digerHarf} hekiminin belgesi ve konsültasyon raporları 404, listede de yok`, async () => {
        const s = sahneKur()
        const h = s[hastaHarf], diger = s[digerHarf]
        const { uploadDocument } = await import('../vault/service')
        const yukle = async (k: Hekim, hasta: string, ad: string, category: string) => (await uploadDocument({ supabase: db.istemci() as never }, {
          doctorId: k.id, patientId: hasta, visitId: null, fileName: ad, fileType: 'application/pdf', bytes: Buffer.from(`%PDF-1.4 icerik ${isaret(k.harf)} ${ad}`), notes: null, category, uploadedBy: k.id,
        })).id
        const kendi = await yukle(h, h.hasta, 'tahlil-kendi.pdf', 'Lab Sonucu')
        const yabanci = await yukle(diger, diger.hasta, 'tahlil-yabanci.pdf', 'Lab Sonucu')
        const raporKategori = await yukle(h, h.hasta, 'konsultan-yukledi.pdf', 'konsultasyon')
        const raporBagli = await yukle(h, h.hasta, 'bagli-rapor.pdf', 'Diğer')
        const raporCoklu = await yukle(h, h.hasta, 'coklu-rapor.pdf', 'Diğer')
        Object.assign(tablo('sevkler').find((x) => x.id === h.konsultasyon)!, { belge_id: raporBagli, belge_idler: [raporBagli, raporCoklu] })
        const cerez = await cerezAl(h.portalToken)
        const al = (id: string, pinli = true) => coz(R.portalBelge.GET(iste('GET', `/api/portal/hasta/${h.portalToken}/belge/${id}`, pinli ? { cerez } : {}), prm({ token: h.portalToken, id })))

        const ok = await al(kendi)
        assert.equal(ok.status, 200, ok.metin.slice(0, 200))
        assert.ok(ok.metin.includes(`icerik ${isaret(hastaHarf)} tahlil-kendi.pdf`), 'kendi belgesinin içeriği gelmedi')
        assert.equal((await al(kendi, false)).status, 401, 'PIN çerezi olmadan belge verilmez')
        for (const [ad, id] of [['başka hekimin belgesi', yabanci], ['konsültan portalından gelen rapor', raporKategori], ['konsültasyona bağlı rapor', raporBagli], ['konsültasyona bağlı ikinci rapor', raporCoklu], ['"Konsültasyon raporu" türündeki belge', h.kasaBelge], ['var olmayan belge', randomUUID()]] as const) {
          const y = await al(id)
          assert.equal(y.status, 404, `${ad}: ${y.status}`)
          assert.ok(!y.metin.includes('icerik') && !y.metin.includes(isaret(digerHarf)), `${ad}: içerik döndü`)
        }

        const liste = await coz(R.portal.GET(iste('GET', `/api/portal/hasta/${h.portalToken}`, { cerez }), prm({ token: h.portalToken })))
        assert.equal(liste.status, 200, liste.metin.slice(0, 300))
        assert.ok(liste.metin.includes(kendi) && liste.metin.includes('tahlil-kendi.pdf'), 'kendi tahlili Sağlığım listesinde yok')
        for (const [ad, id] of [['başka hekimin belgesi', yabanci], ['konsültan raporu (kategori)', raporKategori], ['konsültasyona bağlı rapor', raporBagli], ['konsültasyona bağlı ikinci rapor', raporCoklu], ['Konsültasyon raporu türü', h.kasaBelge]] as const) {
          assert.ok(!liste.metin.includes(id), `Sağlığım listesine sızdı: ${ad}`)
        }
        assert.ok(!liste.metin.includes('konsultan-yukledi') && !liste.metin.includes('bagli-rapor') && !liste.metin.includes('coklu-rapor') && !liste.metin.includes('kbb-raporu'), 'rapor adı Sağlığım listesinde')
        assert.ok(!liste.metin.includes(isaret(digerHarf)))
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
      it(`${hastaHarf} hastasının aşı karnesi PDF'i: 200, yalnız kendi doktorunun kaydı (ASI-KARNESI-01)`, async () => {
        const s = sahneKur()
        const h = s[hastaHarf], diger = s[digerHarf]
        db.ekle('asilar', { doktor_id: diger.id, patient_id: h.hasta, asi_adi: `Hileli asi ${isaret(digerHarf)}`, kategori: 'pediatrik', uygulama_tarihi: '2026-01-02' })
        const { asiKarnesiVerisi } = await import('../asi/karneSunucu')
        const karne = await asiKarnesiVerisi(db.istemci() as never, h.id, h.hasta)
        assert.ok(JSON.stringify(karne).includes(`Asi ${isaret(hastaHarf)}`))
        assert.ok(!JSON.stringify(karne).includes(isaret(digerHarf)), 'başka doktorun iliştirdiği aşı karneye girdi')
        const cerez = await portalCerezi(h.portalToken)
        const y = await coz(R.portalAsiKarnesiPdf.GET(iste('GET', `/api/portal/hasta/${h.portalToken}/asi-karnesi/pdf`, { cerez }), prm({ token: h.portalToken })))
        assert.equal(y.status, 200, y.metin.slice(0, 200))
        const yok = await coz(R.portalAsiKarnesiPdf.GET(iste('GET', `/api/portal/hasta/${h.portalToken}/asi-karnesi/pdf`, {}), prm({ token: h.portalToken })))
        assert.equal(yok.status, 401, 'PIN çerezi olmadan PDF verilmez')
      })
      it(`${hastaHarf} hastasının portal randevuları yalnız kendi doktoruyla; yabancı randevuya dokunamaz (NOTYA-RANDEVU-V2)`, async () => {
        const s = sahneKur()
        const h = s[hastaHarf], diger = s[digerHarf]
        // hileliKur: the other doctor booked this patient once — that row is the other doctor's calendar, not this portal's.
        const yabanci = tablo('randevular').find((x) => x.doktor_id === diger.id && x.patient_id === h.hasta)!
        const cerez = await portalCerezi(h.portalToken)
        const y = await coz(R.portalRandevu.GET(iste('GET', `/api/portal/hasta/${h.portalToken}/randevu`, { cerez }), prm({ token: h.portalToken })))
        assert.equal(y.status, 200, y.metin.slice(0, 300))
        assert.ok(y.metin.includes(h.talep), 'kendi talebi portalda görünmeli')
        assert.ok(!y.metin.includes(String(yabanci.id)), `başka doktorun randevusu portala sızdı: ${y.metin.slice(0, 300)}`)
        assert.ok(!y.metin.includes(isaret(digerHarf)))
        const once = JSON.stringify(yabanci)
        const p = await coz(R.portalRandevu.POST(iste('POST', `/api/portal/hasta/${h.portalToken}/randevu`, { cerez, govde: { islem: 'iptal', randevuId: yabanci.id } }), prm({ token: h.portalToken })))
        assert.equal(p.status, 404, p.metin.slice(0, 200))
        assert.equal(JSON.stringify(tablo('randevular').find((x) => x.id === yabanci.id)), once, 'yabancı randevu değişti')
        const sl = await coz(R.portalRandevu.GET(iste('GET', `/api/portal/hasta/${h.portalToken}/randevu?randevuId=${yabanci.id}`, { cerez }), prm({ token: h.portalToken })))
        assert.equal(sl.status, 404)
        const pin = await coz(R.portalRandevu.GET(iste('GET', `/api/portal/hasta/${h.portalToken}/randevu`, {}), prm({ token: h.portalToken })))
        assert.equal(pin.status, 401, 'PIN çerezi olmadan randevu görünmez')
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

  /**
   * NOTYA-EYLEM-24 — the old silent path is closed, so this case is no longer "A cannot write into
   * B's file": it is "NOBODY writes here, not even into their own file". `lib/asistan/actionExecutor`
   * used to run the write itself and was guarded by ownership checks; it now classifies and
   * redirects, and the write only exists behind the doctor's tap in core/eylemler/onayla.ts.
   * The positive control is therefore inverted on purpose: the own-file call must ALSO write nothing.
   */
  describe('Asistan eylemleri (eski sessiz yazma yolu — artık hiç yazmıyor)', () => {
    for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${saldiran}: yabancı dosyaya da kendi dosyasına da sessizce yazamaz`, async () => {
        const s = sahneKur()
        const x = s[saldiran], k = s[kurbanHarf]
        const { executeAction, KLINIK_ESKI_EYLEM_TIPLERI } = await import('../asistan/actionExecutor')
        const onceKurban = anlikGoruntu(k)
        const onceKendi = anlikGoruntu(x)

        const istekler: Record<string, unknown>[] = [
          { type: 'CREATE_SESSION', doctorId: x.id, data: { patientId: k.hasta } },
          { type: 'ADD_NOTE_CONTENT', doctorId: x.id, data: { sessionId: k.seans, field: 'content_plan', content: 'Hileli' } },
          { type: 'SET_DIAGNOSIS', doctorId: x.id, data: { sessionId: x.hileliSeans, diagnosis: 'Hileli', icd10: 'Z00' } },
          { type: 'ADD_PRESCRIPTION', doctorId: x.id, data: { sessionId: x.seans, drug: 'Hileli', dose: '1g', frequency: '2x1' } },
          { type: 'CREATE_PATIENT', doctorId: x.id, data: { name: 'Hileli Hasta' } },
          // Kendi seansı — eskiden bu YAZIYORDU. Artık o da kart yolundan geçiyor.
          { type: 'ADD_NOTE_CONTENT', doctorId: x.id, data: { sessionId: x.seans, field: 'content_plan', content: 'Kendi' } },
        ]
        for (const istek of istekler) {
          const r = await executeAction(istek as never, 'sahte')
          assert.equal(r.success, false, `${istek.type} hâlâ başarı dönüyor — sessiz yazma yolu açık`)
          assert.equal(r.data?.yazildi, false)
        }

        const sonraKurban = anlikGoruntu(k)
        assert.equal(sonraKurban.sahip, onceKurban.sahip)
        assert.deepEqual([...sonraKurban.atiflar].filter((a) => !onceKurban.atiflar.has(a)), [])
        assert.equal(anlikGoruntu(x).sahip, onceKendi.sahip, 'kendi dosyasına da sessizce yazılmamalı')
        assert.ok(KLINIK_ESKI_EYLEM_TIPLERI.length >= 6)
      })
    }
  })

  describe('WhatsApp Kalkan taslağı yalnız kendi hekimi onaylar', () => {
    for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${saldiran} yabancı taslağı onaylayamaz; kendi onayı ilacı kapatır`, async () => {
        const s = sahneKur()
        const x = s[saldiran], k = s[kurbanHarf]
        const yabanci = db.ekle('wa_taslak', { doctor_id: k.id, patient_id: k.hasta, ilac_id: k.ilac, eylem: 'ilac_durdur', kapsam: 'bu_gece', emin: true, metin: `Taslak ${isaret(kurbanHarf)}`, durum: 'bekliyor', kaynak_wamid: `w-${kurbanHarf}`, zaman: new Date().toISOString() }).id
        const kendi = db.ekle('wa_taslak', { doctor_id: x.id, patient_id: x.hasta, ilac_id: x.ilac, eylem: 'ilac_durdur', kapsam: 'bu_gece', emin: true, metin: 'kendi', durum: 'bekliyor', kaynak_wamid: `w-${saldiran}`, zaman: new Date().toISOString() }).id
        const belirsiz = db.ekle('wa_taslak', { doctor_id: x.id, patient_id: x.hasta, ilac_id: null, eylem: 'ilac_durdur', kapsam: null, emin: false, metin: 'hangi', durum: 'bekliyor', kaynak_wamid: `w-${saldiran}-b`, zaman: new Date().toISOString() }).id

        const yok = await coz(R.kalkan.POST(iste('POST', '/api/doktor/fisilti/kalkan', { token: x.token, govde: { islem: 'onayla', taslakId: yabanci } })))
        assert.equal(yok.status, 404)
        assert.equal(db.tablo('hasta_ilaclar').find((r) => r.id === k.ilac)?.aktif, true)
        assert.ok(!JSON.stringify(yok.metin).includes(isaret(kurbanHarf)))

        const dur = await coz(R.kalkan.POST(iste('POST', '/api/doktor/fisilti/kalkan', { token: x.token, govde: { islem: 'onayla', taslakId: belirsiz } })))
        assert.equal(dur.status, 409)
        assert.equal(db.tablo('hasta_ilaclar').find((r) => r.id === x.ilac)?.aktif, true, 'onaysız ve belirsiz onay kartı değiştirmez')

        const sekreterId = randomUUID()
        const sekreterToken = `qa-sekreter-kalkan-${saldiran}`
        db.kullanicilar.set(sekreterToken, { id: sekreterId })
        db.ekle('personel', { user_id: sekreterId, doktor_id: x.id, aktif: true })
        const sek = await coz(R.kalkan.POST(iste('POST', '/api/doktor/fisilti/kalkan', { token: sekreterToken, govde: { islem: 'onayla', taslakId: kendi } })))
        assert.equal(sek.status, 403)
        assert.equal(db.tablo('hasta_ilaclar').find((r) => r.id === x.ilac)?.aktif, true)

        const ok = await coz(R.kalkan.POST(iste('POST', '/api/doktor/fisilti/kalkan', { token: x.token, govde: { islem: 'onayla', taslakId: kendi } })))
        assert.equal(ok.status, 200, ok.metin.slice(0, 200))
        assert.equal(db.tablo('hasta_ilaclar').find((r) => r.id === x.ilac)?.aktif, false)
        assert.equal(db.tablo('wa_taslak').find((r) => r.id === kendi)?.durum, 'onaylandi')
        assert.ok(db.tablo('audit_logs').some((r) => r.user_id === x.id && r.resource_id === x.ilac))
        assert.equal(db.tablo('hasta_ilaclar').find((r) => r.id === k.ilac)?.aktif, true)
      })
    }
  })

  describe('Seans paketi başka hekimin notuna açılmaz', () => {
    for (const [saldiran, kurbanHarf] of [['A', 'B'], ['B', 'A']] as const) {
      it(`${saldiran} yabancı not 404; gerekçesiz yazılmaz, gerekçeli kendi paketini kesmez`, async () => {
        const s = sahneKur()
        const x = s[saldiran], k = s[kurbanHarf]
        db.ekle('seans_paketleri', {
          doctor_id: x.id, patient_id: x.hasta, note_id: x.not, durum: 'hekim_onayli',
          json_encrypted: encrypt(JSON.stringify({ sikayet: 'öksürük', fizikOzeti: '', icd10: [], ilaclar: [{ ad: 'Amoksisilin', eylem: 'basla', kaynak: 'vizit' }], islemTaslak: [], yasAy: 80, kilo: null, brans: 'pediatri', enabizIzin: false })),
          uyari_gecildi: false, kaynak: 'soap',
        })
        const yabanci = await coz(R.seansPaketi.GET(iste('GET', `/api/doktor/seans-paketi?noteId=${k.not}`, { token: x.token })))
        assert.equal(yabanci.status, 404)
        assert.ok(!yabanci.metin.includes(isaret(kurbanHarf)))
        const kisa = await coz(R.seansPaketi.POST(iste('POST', '/api/doktor/seans-paketi', { token: x.token, govde: { islem: 'yine_de_yaz', noteId: x.not, gerekce: 'kısa' } })))
        assert.equal(kisa.status, 400)
        assert.equal(db.tablo('hasta_ilaclar').find((r) => r.id === x.ilac)?.aktif, true)
        const uzun = await coz(R.seansPaketi.POST(iste('POST', '/api/doktor/seans-paketi', { token: x.token, govde: { islem: 'yine_de_yaz', noteId: x.not, gerekce: 'Hekim klinik gerekçeyi yazdı' } })))
        assert.equal(uzun.status, 200, uzun.metin.slice(0, 180))
        assert.equal(db.tablo('seans_paketleri').find((r) => r.note_id === x.not)?.uyari_gecildi, true)
        assert.ok(db.tablo('audit_logs').some((r) => r.user_id === x.id && r.resource_type === 'seans_paketleri'))
        assert.equal(db.tablo('hasta_ilaclar').find((r) => r.id === x.ilac)?.aktif, true)
        const yabanciYaz = await coz(R.seansPaketi.POST(iste('POST', '/api/doktor/seans-paketi', { token: x.token, govde: { islem: 'yine_de_yaz', noteId: k.not, gerekce: 'Hekim klinik gerekçeyi yazdı' } })))
        assert.equal(yabanciYaz.status, 404)
      })
    }
  })
  describe('MUAYENE-EKLERI-07 Yüklenen dosyalar: personel, tahmin edilen kimlik, yanlış seans, silinmiş belge, kapalı anahtar', () => {
    const liste = (r: Rotalar, token: string, sid: string) => coz(r.yuklenenler.GET(iste('GET', `/api/doktor/muayene-ekleri/yuklenenler?sessionId=${sid}`, { token })))
    const dosya = (r: Rotalar, token: string, sid: string, bid: string, ek = '') => r.yuklenenDosya.GET(iste('GET', `/api/doktor/muayene-ekleri/yuklenenler/${bid}?sessionId=${sid}${ek}`, { token }), prm({ belgeId: bid }))

    for (const harf of ['A', 'B'] as const) {
      it(`${harf}: hekim de, hekimin personeli de açar; başka hekimin personeli açamaz`, async () => {
        const s = sahneKur()
        const x = s[harf], y = s[harf === 'A' ? 'B' : 'A']
        const personelToken = `qa-yuklenen-personel-${harf}`
        db.kullanicilar.set(personelToken, { id: randomUUID() })
        db.ekle('personel', { user_id: db.kullanicilar.get(personelToken)!.id, doktor_id: x.id, aktif: true })
        // the doctor
        const hekim = await dosya(R, x.token, x.seans, x.yuklenenBelge)
        assert.equal(hekim.status, 200)
        assert.equal(hekim.headers.get('content-type'), 'application/pdf')
        assert.match(hekim.headers.get('content-disposition') || '', /^inline;/)
        assert.equal(hekim.headers.get('cache-control'), 'private, no-store')
        assert.ok((await hekim.text()).includes(isaret(harf)), 'bayt içeriği çözülüp akıtılmadı')
        assert.ok(db.tablo('audit_logs').some((r) => r.user_id === x.id && r.resource_type === 'muayene_ek_dosya' && r.resource_id === x.yuklenenBelge), 'dosya erişimi denetim kaydına yazılmadı')
        // the doctor's staff (scope = the doctor of the practice, never a client value)
        const sek = await dosya(R, personelToken, x.seans, x.yuklenenBelge)
        assert.equal(sek.status, 200)
        assert.ok((await sek.text()).includes(isaret(harf)))
        const sekListe = await liste(R, personelToken, x.seans)
        assert.equal(sekListe.status, 200)
        assert.ok(sekListe.metin.includes(isaret(harf)))
        // staff of doctor X reaching doctor Y's visit / file → 404, nothing of Y in the answer
        const yabanci = await dosya(R, personelToken, y.seans, y.yuklenenBelge)
        assert.equal(yabanci.status, 404)
        assert.ok(!(await yabanci.text()).includes(isaret(y.harf)))
        assert.equal((await liste(R, personelToken, y.seans)).status, 404)
        // a doctor B-token must not ride on doctor A's staff row either
        assert.equal((await dosya(R, y.token, x.seans, x.yuklenenBelge)).status, 404)
      })
    }

    it('tahmin edilen / uydurma kimlikler 404; kimliksiz 401; sessionId eksik 400', async () => {
      const { A } = sahneKur()
      assert.equal((await dosya(R, A.token, randomUUID(), A.yuklenenBelge)).status, 404)
      assert.equal((await dosya(R, A.token, A.seans, randomUUID())).status, 404)
      assert.equal((await dosya(R, A.token, A.seans, 'not-a-uuid')).status, 404)
      assert.equal((await dosya(R, A.token, "x' or '1'='1", A.yuklenenBelge)).status, 404)
      assert.equal((await liste(R, A.token, randomUUID())).status, 404)
      assert.equal((await dosya(R, 'gecersiz-token', A.seans, A.yuklenenBelge)).status, 401)
      assert.equal((await coz(R.yuklenenler.GET(iste('GET', '/api/doktor/muayene-ekleri/yuklenenler', { token: A.token })))).status, 400)
    })

    it('aynı hekimin BAŞKA muayenesi ya da başka hastası altında görünen belge bu seansın dosyası sayılmaz', async () => {
      const { A } = sahneKur()
      // seans2 is A's own pending visit; the file belongs to the first visit → not reachable through seans2
      const baskaSeans = db.tablo('sessions').find((r) => r.doctor_id === A.id && r.id !== A.seans)!.id as string
      assert.equal((await dosya(R, A.token, baskaSeans, A.yuklenenBelge)).status, 404)
      const liste2 = await liste(R, A.token, baskaSeans)
      assert.equal(liste2.status, 200)
      assert.ok(!liste2.metin.includes(isaret('A')), 'başka muayenenin dosyası bu seansın listesinde')
      // a document whose patient differs from the visit's patient is dropped even if visit_id matches (dirty row)
      const baskaHasta = db.ekle('patients', { doctor_id: A.id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'Baska' })), dob_encrypted: encrypt('2020-01-01'), gender_encrypted: encrypt('male') }).id
      db.tablo('medical_documents').find((r) => r.id === A.yuklenenBelge)!.patient_id = baskaHasta
      assert.equal((await dosya(R, A.token, A.seans, A.yuklenenBelge)).status, 404)
      assert.ok(!(await liste(R, A.token, A.seans)).metin.includes(isaret('A')))
    })

    it('silinmiş belge listelenmez ve açılmaz; PDF/görsel dışı tür her zaman indirme olarak gider', async () => {
      const { A } = sahneKur()
      const satir = db.tablo('medical_documents').find((r) => r.id === A.yuklenenBelge)!
      satir.file_type = 'application/dicom'
      satir.file_name = 'tomografi.dcm'
      const dcm = await dosya(R, A.token, A.seans, A.yuklenenBelge)
      assert.equal(dcm.status, 200)
      assert.match(dcm.headers.get('content-disposition') || '', /^attachment;/)
      satir.deleted_at = new Date().toISOString()
      assert.equal((await dosya(R, A.token, A.seans, A.yuklenenBelge)).status, 404)
      assert.ok(!(await liste(R, A.token, A.seans)).metin.includes('tomografi.dcm'))
    })

    it('NOTYA_MUAYENE_EKLERI=off: iki rota da 404 (bölüm görünmez); açılınca tekrar çalışır', async () => {
      const { A } = sahneKur()
      const onceki = process.env.NOTYA_MUAYENE_EKLERI
      try {
        process.env.NOTYA_MUAYENE_EKLERI = 'off'
        assert.equal((await liste(R, A.token, A.seans)).status, 404)
        assert.equal((await dosya(R, A.token, A.seans, A.yuklenenBelge)).status, 404)
        delete process.env.NOTYA_MUAYENE_EKLERI
        assert.equal((await liste(R, A.token, A.seans)).status, 200)
      } finally {
        if (onceki === undefined) delete process.env.NOTYA_MUAYENE_EKLERI
        else process.env.NOTYA_MUAYENE_EKLERI = onceki
      }
    })
  })

  describe('FOTO-ARSIV-01 Fotoğraf arşivi: personel rolleri, tahmin edilen kimlikler, EXIF, önbellek, kapalı anahtarlar', () => {
    const personel = (x: Hekim, rol: string) => {
      const token = `qa-foto-${rol}-${x.harf}`
      db.kullanicilar.set(token, { id: randomUUID() })
      db.ekle('personel', { user_id: db.kullanicilar.get(token)!.id, doktor_id: x.id, aktif: true, rol })
      return token
    }
    const liste = (token: string, h: { hasta: string }) => coz(R.fotoListe.GET(iste('GET', fotoUrl(h), { token }), prm({ patientId: h.hasta })))
    const dosya = (token: string, h: { hasta: string; fotoBelge: string }, belge = h.fotoBelge) => R.fotoDosya.GET(iste('GET', fotoUrl(h, `/${belge}/dosya`), { token }), fotoPrm(h, belge))

    for (const harf of ['A', 'B'] as const) {
      it(`${harf}: sekreter ve hasta danışmanı klinik fotoğrafı GÖREMEZ; asistan arşivi okur ama düzenleyemez, dışa aktaramaz, AI çağıramaz`, async () => {
        const s = sahneKur()
        const x = s[harf]
        const sek = personel(x, 'sekreter'), dan = personel(x, 'hasta_danismani'), asi = personel(x, 'asistan')
        for (const token of [sek, dan]) {
          assert.equal((await liste(token, x)).status, 403)
          assert.equal((await dosya(token, x)).status, 403)
          assert.equal((await coz(R.fotoToplu.POST(iste('POST', fotoUrl(x, '/toplu'), { token, govde: { islem: 'favori', belgeIds: [x.fotoBelge], deger: true } }), prm({ patientId: x.hasta })))).status, 403)
          assert.equal((await fotoAiGonder(R, { ...x, token }, x)).status, 403)
        }
        const l = await liste(asi, x)
        assert.equal(l.status, 200)
        assert.ok(l.metin.includes(isaret(harf)))
        assert.equal((await dosya(asi, x)).status, 200)
        assert.equal((await coz(R.fotoKucuk.PUT(hamIste('PUT', fotoUrl(x, `/${x.fotoBelge}/kucuk?w=80&h=60`), asi, fotoGorsel.sentetikJpeg('asistan'), 'image/jpeg'), fotoPrm(x, x.fotoBelge)))).status, 200)
        assert.equal((await coz(R.fotoDetay.PATCH(iste('PATCH', fotoUrl(x, `/${x.fotoBelge}`), { token: asi, govde: { favori: true } }), fotoPrm(x, x.fotoBelge)))).status, 403)
        assert.equal((await coz(R.fotoToplu.POST(iste('POST', fotoUrl(x, '/toplu'), { token: asi, govde: { islem: 'favori', belgeIds: [x.fotoBelge], deger: true } }), prm({ patientId: x.hasta })))).status, 403)
        assert.equal((await coz(R.fotoRapor.POST(iste('POST', fotoUrl(x, '/rapor'), { token: asi, govde: { duzen: 'tek', ogeler: [] } }), prm({ patientId: x.hasta })))).status, 403)
        assert.equal((await fotoAiGonder(R, { ...x, token: asi }, x)).status, 403)
        assert.equal((await coz(R.fotoAi.GET(iste('GET', fotoUrl(x, `/${x.fotoBelge}/ai`), { token: asi }), fotoPrm(x, x.fotoBelge)))).status, 403)
        assert.equal(modelIstekleri.length, 0, 'personel rolleri modeli çağıramaz')
        const y = s[harf === 'A' ? 'B' : 'A']
        assert.equal((await liste(asi, y)).status, 404)
        const yd = await dosya(asi, y)
        assert.equal(yd.status, 404)
        assert.ok(!(await yd.text()).includes(isaret(y.harf)))
      })
    }

    it('tahmin edilen / uydurma / başka hastaya ait kimlikler 404; kimliksiz 401', async () => {
      const { A, B } = sahneKur()
      assert.equal((await dosya(A.token, A, randomUUID())).status, 404)
      assert.equal((await dosya(A.token, { ...A, hasta: randomUUID() })).status, 404)
      assert.equal((await dosya(A.token, A, 'not-a-uuid')).status, 404)
      assert.equal((await dosya(A.token, A, "x' or '1'='1")).status, 404)
      assert.equal((await liste(A.token, { hasta: 'x/../y' })).status, 404)
      assert.equal((await dosya('gecersiz-token', A)).status, 401)
      assert.equal((await dosya(A.token, A, B.fotoBelge)).status, 404)
      assert.equal((await dosya(A.token, { ...A, hasta: B.hasta }, A.fotoBelge)).status, 404)
      const baskaHasta = db.ekle('patients', { doctor_id: A.id, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'Baska' })), dob_encrypted: encrypt('2020-01-01'), gender_encrypted: encrypt('male') }).id as string
      assert.equal((await dosya(A.token, { ...A, hasta: baskaHasta })).status, 404)
      const g = fotoGorsel.dataUrl(fotoGorsel.sentetikPng())
      fotoModeli(fotoGorsel.sahteKarsilastirmaYaniti('x'))
      const modelOnce = modelIstekleri.length
      const k = await coz(R.fotoKarsilastir.POST(iste('POST', fotoUrl(A, `/${A.fotoBelge}/ai/karsilastir`), { token: A.token, govde: { onceki: B.fotoBelge, gorsel: g, oncekiGorsel: g } }), fotoPrm(A, A.fotoBelge)))
      assert.equal(k.status, 404)
      assert.equal(modelIstekleri.length, modelOnce, 'yabancı foto için model çağrılmamalı')
    })

    it('toplu işlem: karışık kimliklerde yabancı/silinmiş olanlar atlanır ve dokunulmaz', async () => {
      const { A, B } = sahneKur()
      db.tablo('medical_documents').find((r) => r.id === A.fotoOnceki)!.deleted_at = new Date().toISOString()
      const y = await coz(R.fotoToplu.POST(iste('POST', fotoUrl(A, '/toplu'), { token: A.token, govde: { islem: 'favori', belgeIds: [A.fotoBelge, B.fotoBelge, A.fotoOnceki], deger: true } }), prm({ patientId: A.hasta })))
      assert.equal(y.status, 200)
      const j = JSON.parse(y.metin)
      assert.deepEqual(j.guncellenen, [A.fotoBelge])
      assert.deepEqual([...j.atlanan].sort(), [B.fotoBelge, A.fotoOnceki].sort())
      assert.ok(!tablo('hasta_foto_meta').find((m) => m.belge_id === B.fotoBelge)!.favori)
      assert.ok(!tablo('hasta_foto_meta').find((m) => m.belge_id === A.fotoOnceki)!.favori)
      assert.equal((await coz(R.fotoToplu.POST(iste('POST', fotoUrl(A, '/toplu'), { token: A.token, govde: { islem: 'favori', belgeIds: Array.from({ length: 101 }, () => randomUUID()), deger: true } }), prm({ patientId: A.hasta })))).status, 400)
      assert.equal((await coz(R.fotoToplu.POST(iste('POST', fotoUrl(A, '/toplu'), { token: A.token, govde: { islem: 'favori', belgeIds: ['x'], deger: true } }), prm({ patientId: A.hasta })))).status, 400)
    })

    it('rapor: tek bir yabancı kimlik tüm raporu reddeder (kısmi dışa aktarım yok); geçerli rapor PDF, no-store, denetim kaydı', async () => {
      const { A, B } = sahneKur()
      const gorsel = fotoGorsel.dataUrl(fotoGorsel.sentetikPng(48, 36))
      const y = await coz(R.fotoRapor.POST(iste('POST', fotoUrl(A, '/rapor'), { token: A.token, govde: { duzen: 'kolaj', ogeler: [{ belgeId: A.fotoBelge, gorsel }, { belgeId: B.fotoBelge, gorsel }] } }), prm({ patientId: A.hasta })))
      assert.equal(y.status, 404)
      const ok = await R.fotoRapor.POST(iste('POST', fotoUrl(A, '/rapor'), { token: A.token, govde: { duzen: 'karsilastirma', ogeler: [{ belgeId: A.fotoOnceki, gorsel }, { belgeId: A.fotoBelge, gorsel }] } }), prm({ patientId: A.hasta }))
      assert.equal(ok.status, 200)
      assert.equal(ok.headers.get('content-type'), 'application/pdf')
      assert.equal(ok.headers.get('cache-control'), 'private, no-store')
      assert.equal(Buffer.from(await ok.arrayBuffer()).subarray(0, 5).toString(), '%PDF-')
      assert.ok(db.tablo('audit_logs').some((r) => r.user_id === A.id && r.resource_type === 'hasta_foto' && r.action === 'export'), 'rapor dışa aktarımı denetim kaydına yazılmadı')
    })

    it('dosya akışı: EXIF/GPS/yorum çıkarılmış, piksel verisi aynı, no-store, açılış denetim kaydında; kasadaki orijinal değişmez', async () => {
      const { A } = sahneKur()
      const orijinalBlob = db.bloblar.get(A.fotoBelge)
      const y = await dosya(A.token, A)
      assert.equal(y.status, 200)
      assert.equal(y.headers.get('content-type'), 'image/jpeg')
      assert.equal(y.headers.get('cache-control'), 'private, no-store')
      assert.equal(y.headers.get('x-foto-meta'), 'temizlendi')
      const metin = Buffer.from(await y.arrayBuffer()).toString('latin1')
      assert.ok(metin.includes(isaret('A')), 'piksel/tarama verisi korunmalı')
      assert.ok(!metin.includes('GPS 41.0082N') && !metin.includes('Samsung') && !metin.includes('Exif'), 'EXIF/GPS/yorum sunulan görüntüden çıkarılmalı')
      assert.equal(db.bloblar.get(A.fotoBelge), orijinalBlob, 'kasadaki orijinal bayt değişmemeli')
      assert.ok(db.tablo('audit_logs').some((r) => r.user_id === A.id && r.resource_type === 'hasta_foto' && r.resource_id === A.fotoBelge), 'açılış denetim kaydına yazılmadı')
    })

    it('düzenleme/notasyon yalnız parametre olarak saklanır; şifreli; orijinal bayt değişmez; geçersiz girdi 400', async () => {
      const { A } = sahneKur()
      const orijinalBlob = db.bloblar.get(A.fotoBelge)
      const gonder = (govde: unknown) => coz(R.fotoDetay.PATCH(iste('PATCH', fotoUrl(A, `/${A.fotoBelge}`), { token: A.token, govde }), fotoPrm(A, A.fotoBelge)))
      const y = await gonder({ ayarlar: { parlaklik: 20, dondur: 90 }, notasyonlar: [{ t: 'ok', a: { x: 0.1, y: 0.1 }, b: { x: 0.5, y: 0.5 }, renk: 'kirmizi' }], etiketler: ['Kontrol', 'kontrol', 'x'.repeat(60)], not: 'Gizli klinik not 123' })
      assert.equal(y.status, 200, y.metin.slice(0, 300))
      const m = JSON.parse(y.metin).meta
      assert.equal(m.ozel.ayarlar.parlaklik, 20)
      assert.equal(m.ozel.ayarlar.dondur, 90)
      assert.ok(m.ozel.etiketler.length <= 2 && m.ozel.etiketler.every((t: string) => t.length <= 24))
      const satir = tablo('hasta_foto_meta').find((r) => r.belge_id === A.fotoBelge)!
      assert.ok(!JSON.stringify(satir).includes('Gizli klinik not 123'), 'not düz metin saklanmamalı')
      assert.equal(db.bloblar.get(A.fotoBelge), orijinalBlob)
      assert.equal((await gonder({ yildiz: 9 })).status, 400)
      assert.equal((await gonder({ bolge: 'baska-bir-yer' })).status, 400)
      assert.equal((await gonder({})).status, 400)
      assert.equal((await gonder({ cekimTarihi: '2026-13-45' })).status, 400)
    })

    it('küçük resim: yalnız JPEG/WebP ve ≤150 KB; şifreli saklanır', async () => {
      const { A } = sahneKur()
      const yaz = (b: Buffer, q = 'w=80&h=60') => coz(R.fotoKucuk.PUT(hamIste('PUT', fotoUrl(A, `/${A.fotoBelge}/kucuk?${q}`), A.token, b, 'image/jpeg'), fotoPrm(A, A.fotoBelge)))
      assert.equal((await yaz(fotoGorsel.sentetikPng())).status, 400, 'PNG küçük resim olarak kabul edilmez')
      assert.equal((await yaz(Buffer.concat([fotoGorsel.sentetikJpeg('x'), Buffer.alloc(160 * 1024)]))).status, 400)
      assert.equal((await yaz(fotoGorsel.sentetikJpeg('x'), 'w=5000&h=60')).status, 400)
      assert.equal((await yaz(fotoGorsel.sentetikJpeg('GIZLI-KUCUK-ABC'))).status, 200)
      assert.ok(!JSON.stringify(tablo('hasta_foto_kucuk')).includes('GIZLI-KUCUK-ABC'), 'küçük resim düz saklanmamalı')
    })

    it('AI: model yalnız küçültülmüş, metasız görseli görür; kimlik/dosya adı gitmez; ikinci çağrı önbellekten; yenile=true yeniden üretir', async () => {
      const { A } = sahneKur()
      fotoModeli(fotoGorsel.sahteFotoAiYaniti('birinci'))
      const metali = fotoGorsel.dataUrl(fotoGorsel.metaliPng('GPS-SIZINTI-TEST'))
      const bir = await fotoAiGonder(R, A, A, { gorsel: metali })
      assert.equal(bir.status, 200, bir.metin.slice(0, 300))
      const j = JSON.parse(bir.metin)
      assert.equal(j.durum, 'tamam')
      assert.equal(j.gorunum.uretim.kaynak, 'model')
      assert.ok(j.gorunum.uretim.surum, 'sürüm kayda girmeli')
      assert.equal(modelIstekleri.length, 1)
      const istek = modelIstekleri[0]
      assert.ok(!istek.includes('GPS-SIZINTI-TEST'), 'EXIF/metin parçası modele gitti')
      assert.ok(!istek.includes(A.hasta) && !istek.includes(`yeni-${isaret('A')}`) && !istek.includes('QA Hasta'), 'kimlik / dosya adı modele gitti')
      const iki = JSON.parse((await fotoAiGonder(R, A, A, { gorsel: metali })).metin)
      assert.equal(iki.gorunum.uretim.kaynak, 'onbellek')
      assert.equal(modelIstekleri.length, 1, 'değişmeyen görüntü yeniden değerlendirilmemeli')
      const kaynak = db.tablo('medical_documents').find((r) => r.id === A.fotoBelge)!
      const kopya = db.ekle('medical_documents', { ...kaynak, id: randomUUID(), file_name: 'kopya.jpg' })
      db.bloblar.set(kopya.id as string, db.bloblar.get(A.fotoBelge)!)
      kopya.storage_key = `db:${kopya.id}`
      const uc = JSON.parse((await fotoAiGonder(R, A, A, { gorsel: metali }, kopya.id as string)).metin)
      assert.equal(uc.durum, 'tamam')
      assert.equal(modelIstekleri.length, 1, 'aynı bayt → aynı hekimin önbelleği')
      const dort = JSON.parse((await fotoAiGonder(R, A, A, { gorsel: metali, yenile: true })).metin)
      assert.equal(dort.gorunum.uretim.kaynak, 'model')
      assert.equal(modelIstekleri.length, 2)
      assert.ok(!JSON.stringify(tablo('hasta_foto_degerlendirme')).includes('eritemli'), 'sonuç düz metin saklanmamalı')
      const kayit = db.tablo('audit_logs').filter((r) => r.user_id === A.id && r.resource_type === 'hasta_foto_ai')
      assert.ok(kayit.length >= 2 && kayit.every((r) => (r.new_values as any)?.surum), 'denetim kaydı sürümü taşımalı')
    })

    it('AI önbelleği hekimler arasında paylaşılmaz: B aynı baytı yüklese de A\'nın cevabını almaz', async () => {
      const { A, B } = sahneKur()
      fotoModeli(fotoGorsel.sahteFotoAiYaniti('A-icin'))
      await fotoAiGonder(R, A, A)
      const once = modelIstekleri.length
      fotoModeli(fotoGorsel.sahteFotoAiYaniti('B-icin'))
      const b = JSON.parse((await fotoAiGonder(R, B, B)).metin)
      assert.equal(b.gorunum.uretim.kaynak, 'model')
      assert.equal(modelIstekleri.length, once + 1)
      assert.ok(!JSON.stringify(b).includes('A-icin'))
    })

    it('AI: bozuk model çıktısı → tek onarım denemesi → 502; hiçbir şey saklanmaz', async () => {
      const { A } = sahneKur()
      modelYaniti = () => [{ type: 'text', text: 'bu bir json değil' }]
      const y = await fotoAiGonder(R, A, A)
      assert.equal(y.status, 502)
      assert.equal(modelIstekleri.length, 2, 'ilk çağrı + tek onarım')
      assert.equal(tablo('hasta_foto_degerlendirme').filter((r) => r.doctor_id === A.id).length, 0)
    })

    it('AI: psikiyatri branşında kapalı (model çağrılmaz); pediatrik kontrol yalnız pediatri/çocuk cerrahisinde isteme girer', async () => {
      const { A } = sahneKur()
      const hekim = db.tablo('users').find((u) => u.id === A.id)!
      fotoModeli(fotoGorsel.sahteFotoAiYaniti('x', 'pediatrik'))
      assert.equal((await fotoAiGonder(R, A, A)).status, 200)
      assert.ok(modelIstekleri[0].includes('sarilik-yasa-duyarli'), 'pediatri: pediatrik denetim istemde')
      hekim.specialty = 'Kardiyoloji'
      fotoModeli(fotoGorsel.sahteFotoAiYaniti('x'))
      assert.equal((await fotoAiGonder(R, A, A, { yenile: true })).status, 200)
      const genel = modelIstekleri[modelIstekleri.length - 1]
      assert.ok(!genel.includes('sarilik-yasa-duyarli') && !genel.includes('hemanjiyom'), 'kardiyoloji: pediatrik alan sızmamalı')
      hekim.specialty = 'Psikiyatri'
      const once = modelIstekleri.length
      const p = JSON.parse((await fotoAiGonder(R, A, A, { yenile: true })).metin)
      assert.equal(p.durum, 'kapali')
      assert.equal(modelIstekleri.length, once)
    })

    it('geri bildirim: yalnız değerlendirmede bulunan madde; sayaçlar karar değişince taşınır; tahmin edilen anahtar 400', async () => {
      const { A } = sahneKur()
      fotoModeli(fotoGorsel.sahteFotoAiYaniti('x'))
      await fotoAiGonder(R, A, A)
      const gb = (govde: unknown) => coz(R.fotoGeriBildirim.POST(iste('POST', fotoUrl(A, `/${A.fotoBelge}/ai/geri-bildirim`), { token: A.token, govde }), fotoPrm(A, A.fotoBelge)))
      assert.equal((await gb({ gozlemAnahtari: 'ayirici:yok-boyle-bir-sey', karar: 'kabul' })).status, 400)
      assert.equal((await gb({ gozlemAnahtari: 'morfoloji', karar: 'belki' })).status, 400)
      assert.equal((await gb({ gozlemAnahtari: 'morfoloji', karar: 'duzelt' })).status, 400, 'düzeltme metni zorunlu')
      assert.equal((await gb({ gozlemAnahtari: 'morfoloji', karar: 'kabul' })).status, 200)
      assert.equal((await gb({ gozlemAnahtari: 'morfoloji', karar: 'duzelt', duzeltme: 'Hekim düzeltmesi GIZLI-DUZELTME' })).status, 200)
      const sayac = tablo('hasta_foto_ogrenme').find((r) => r.doctor_id === A.id && r.ozellik === 'morfoloji')!
      assert.deepEqual([sayac.kabul, sayac.duzelt, sayac.reddet], [0, 1, 0], 'kabul → düzelt değişince sayaç taşınmalı')
      assert.ok(!JSON.stringify(tablo('hasta_foto_geri_bildirim')).includes('GIZLI-DUZELTME'), 'düzeltme metni düz saklanmamalı')
      assert.ok(!JSON.stringify(tablo('hasta_foto_ogrenme')).includes('GIZLI-DUZELTME'), 'öğrenme tablosu serbest metin tutmaz')
    })

    it('kalite kapısı: kaydetmeden önce çalışır, hiçbir şey saklanmaz; kötü kalitede "Çekimi yenileyin" önerisi gelir', async () => {
      const { A } = sahneKur()
      fotoModeli(fotoGorsel.sahteKaliteYaniti(true))
      const y = await coz(R.fotoKalite.POST(iste('POST', fotoUrl(A, '/kalite'), { token: A.token, govde: { gorsel: fotoGorsel.dataUrl(fotoGorsel.sentetikPng()) } }), prm({ patientId: A.hasta })))
      assert.equal(y.status, 200)
      const j = JSON.parse(y.metin)
      assert.equal(j.durum, 'tamam')
      assert.equal(j.sonuc.yenile, true)
      assert.ok(String(j.sonuc.kalite.yenidenCekim).length > 5)
      assert.equal(tablo('hasta_foto_degerlendirme').filter((r) => r.doctor_id === A.id).length, 0)
    })

    it('kapalı anahtarlar: NOTYA_FOTO_ARSIVI=off her rotayı kapatır; NOTYA_FOTO_AI=off yalnız AI rotalarını (arşiv çalışır)', async () => {
      const { A } = sahneKur()
      const eskiArsiv = process.env.NOTYA_FOTO_ARSIVI, eskiAi = process.env.NOTYA_FOTO_AI
      try {
        process.env.NOTYA_FOTO_AI = 'off'
        assert.equal((await liste(A.token, A)).status, 200)
        assert.equal((await fotoAiGonder(R, A, A)).status, 404)
        assert.equal((await coz(R.fotoAi.GET(iste('GET', fotoUrl(A, `/${A.fotoBelge}/ai`), { token: A.token }), fotoPrm(A, A.fotoBelge)))).status, 404)
        delete process.env.NOTYA_FOTO_AI
        process.env.NOTYA_FOTO_ARSIVI = 'off'
        assert.equal((await liste(A.token, A)).status, 404)
        assert.equal((await dosya(A.token, A)).status, 404)
        assert.equal((await fotoAiGonder(R, A, A)).status, 404)
        delete process.env.NOTYA_FOTO_ARSIVI
        assert.equal((await liste(A.token, A)).status, 200)
      } finally {
        if (eskiArsiv === undefined) delete process.env.NOTYA_FOTO_ARSIVI; else process.env.NOTYA_FOTO_ARSIVI = eskiArsiv
        if (eskiAi === undefined) delete process.env.NOTYA_FOTO_AI; else process.env.NOTYA_FOTO_AI = eskiAi
      }
    })

    it('"Yüklenen dosyalar" bölümü gerilemedi: arşivdeki fotoğraf muayenenin yüklenen dosyaları listesinde de durur', async () => {
      const { A } = sahneKur()
      const l = await coz(R.yuklenenler.GET(iste('GET', `/api/doktor/muayene-ekleri/yuklenenler?sessionId=${A.fotoSeans}`, { token: A.token })))
      assert.equal(l.status, 200)
      assert.ok(l.metin.includes(`yeni-${isaret('A')}.jpg`), 'arşivdeki fotoğraf muayenenin Yüklenen dosyalar listesinden düşmüş')
      const d = await R.yuklenenDosya.GET(iste('GET', `/api/doktor/muayene-ekleri/yuklenenler/${A.fotoBelge}?sessionId=${A.fotoSeans}`, { token: A.token }), prm({ belgeId: A.fotoBelge }))
      assert.equal(d.status, 200)
    })
  })
})
