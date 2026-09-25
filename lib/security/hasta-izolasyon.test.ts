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
  /** KONSULTASYON-01: yanıt bekleyen + yanıtlanmış konsültasyon, Kasa'daki konsültasyon raporu */
  konsultasyon: string; konsultasyonYanitli: string; kasaBelge: string
  /** ASI-KARNESI-01 (D): sonraki doz tarihi 10 gün sonra, hatırlatması gönderilmemiş aşı kaydı */
  asiHatirlatma: string
  /** NOTYA-EYLEM: Ayşe'nin hazırladığı bekleyen taslak + onaylanmış (geri alınabilir) eylem kaydı */
  eylemOneri: string; eylemKayit: string
  /** NOTYA-ILETISIM-01: Hazır mesajlar kuyruğunda bekleyen bir öğe */
  kuyruk: string
  /** NOTYA-GELEN-BELGELER: dosyalanmamış bir gelen belge (dosyası özel kovada, önerilen hasta = kendi hastası) */
  gelenBelge: string
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
    // NOTYA-ILETISIM-01: WhatsApp izni verilmiş (e-posta izni bilinmiyor)
    iletisim_izni_whatsapp: true, iletisim_izni_eposta: null,
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
  return { harf, id, token, hasta, seans, not, bekleyenNot, ilac, panel, belge, randevu, serbestRandevu, hastaDerm, lezyon, dogum, bebekKart, portalToken, konu, asistanEylem, gozGoruntu, belgeAnaliz, dermAnaliz, konsultasyon, konsultasyonYanitli, kasaBelge, asiHatirlatma, eylemOneri, eylemKayit, kuyruk, gelenBelge, hileliSeans: '', hileliNot: '' }
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
  // Araçlar
  { ad: 'POST /api/doktor/araclar/epikriz (kendi seansı + yabancı hastaId)', red: 404, okur: true,
    cagir: (r, a, h) => coz(r.epikriz.POST(iste('POST', '/api/doktor/araclar/epikriz', { token: a.token, govde: { hastaId: h.hasta, seansId: a.seans } }))) },
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
  { ad: 'POST /api/doktor/cihaz-olcum', red: 404,
    yazdi: (a) => tablo('cihaz_olcumleri').some((x) => x.patient_id === a.hasta),
    cagir: (r, a, h) => coz(r.cihaz.POST(iste('POST', '/api/doktor/cihaz-olcum', { token: a.token, govde: { hastaId: h.hasta, transport: 'manuel', olcumler: [{ tur: 'ates', deger: '37.2', birim: '°C', kaynak: 'manuel' }] } }))) },
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
      cihaz: await ice('app/api/doktor/cihaz-olcum/route'),
      mesajlar: await ice('app/api/doktor/mesajlar/route'),
      mesajKonu: await ice('app/api/doktor/mesajlar/[konuId]/route'),
      iletisimHazirla: await ice('app/api/doktor/iletisim/hazirla/route'),
      iletisimKayit: await ice('app/api/doktor/iletisim/kayit/route'),
      iletisimIzin: await ice('app/api/doktor/iletisim/izin/route'),
      iletisimKuyruk: await ice('app/api/doktor/iletisim/kuyruk/route'),
      gelenBelgeler: await ice('app/api/doktor/gelen-belgeler/route'),
      gelenBelge: await ice('app/api/doktor/gelen-belgeler/[id]/route'),
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
})
