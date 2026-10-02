/**
 * NOTYA-GOKHAN-KORPUS-01 — the regression corpus built from Dr. Gökhan's live complaints.
 *
 * One entry = one sentence a doctor said (or a row of an earlier audit of his daily questions), where it came
 * from, the state it is said in, the surfaces it is run on and what the fix behind it intended. Nothing here is
 * invented: every entry carries its source (`kaynak`), and lib/asistan/gokhanKorpus.test.ts checks that the
 * source exists and — unless the entry says `turetilmis` and explains why — that the sentence can be found in it.
 *
 * Patients: the sources name charts of the beta doctor's panel. The corpus re-says each sentence about a SYNTHETIC
 * stand-in with the same property (lib/asistan/tests/gokhanKorpusHastalari.ts, HASTA_ESLEME). No production name,
 * id or value is repeated here. Assertions quote the synthetic fixture, never the source's rubric values.
 *
 * Assertions come from the ledger text of what the fix intended: the answer contains a value of the fixture, a
 * named tool is called, a card of a given kind is produced, the turn is bound to a given patient, the route is (or
 * is not) a given one — `arama` is the patient-count template — and no refusal / deflection sentence appears.
 * Where the intended outcome is ambiguous the entry is 'MANUAL': it is still run and its answer recorded.
 *
 * This module is PURE (no scene, no mocks): types, entries, loader, placeholder context and the assertion
 * helpers. The runner is gokhanKorpusKosucu.ts.
 */

export type Yuzey = 'yazi' | 'ses' | 'panel'
/** bebek / ayse / tarik / olcay / eriskin: the corpus panel. deniz: the action-audit chart (added only where used). */
export type KorpusHastasi = 'bebek' | 'ayse' | 'tarik' | 'olcay' | 'eriskin' | 'deniz'
export type KorpusRota = 'kapsam' | 'takvim' | 'gurultu' | 'kimlik' | 'oku' | 'arama' | 'dosya-ac' | 'hizli-kart' | 'kayit' | 'model'
export type Kategori =
  | 'kimlik' | 'hasta-cozum' | 'sayim' | 'liste' | 'takvim' | 'takip' | 'ilac' | 'asi' | 'olcum' | 'muayene' | 'lab'
  | 'dosya' | 'ilk10' | 'kapsam' | 'eylem' | 'ses' | 'izolasyon' | 'sohbet' | 'uygulama'

export interface Kaynak {
  /** Repo-relative path of the source. */
  dosya: string
  /** Ledger id, question number ("#21"), or a phrase that identifies the row in the source. */
  kimlik: string
}

export interface Beklenti {
  /** Regex sources (flags iu); ALL must match the answer. `{AD}` placeholders are filled by korpusBaglami(). */
  icerir?: string[]
  /** Regex sources; NONE may match. */
  icermez?: string[]
  /** The route that must answer (any of). Everything but `model` is a model-free handler. */
  rota?: KorpusRota[]
  /** Routes that must NOT answer — `arama` is the patient-count template. */
  rotaDegil?: KorpusRota[]
  /** Tool the model must call on the graded turn; null = no tool may be called. */
  arac?: string | null
  /** Action card (eylem_anahtar) the server must prepare; null = no card may be prepared. */
  kart?: string | null
  /** Voice only: patterns on the text as it is handed to the speech engine (units and numbers written out). */
  okunus?: { icerir?: string[]; icermez?: string[] }
  /** The card must carry at least one warning. */
  kartUyari?: boolean
  /** A pipe table on screen. */
  tablo?: boolean
  /** Patient the turn must be bound to; null = none. */
  hasta?: KorpusHastasi | null
  /** The fixed out-of-scope refusal is the expected answer. */
  ret?: boolean
  /** Follow-up turn: Ayşe must not ask back which patient / which date. */
  soruSormaz?: boolean
  /**
   * The SERVER guarantees this text whatever the model writes (the Danış panel checks the model's answer against
   * the record). Such a turn is graded in full in a dry run too, although it passed through the stand-in.
   */
  sunucuYazar?: boolean
}

export interface KorpusGirdisi {
  id: string
  kaynak: Kaynak[]
  kat: Kategori
  /** The sentence that is graded. */
  soz: string
  /** Entries with the same key share one session and run in file order. */
  oturum?: string
  /** Earlier turns of the same session that bind the patient or set the topic; not graded. */
  kurulum?: string[]
  /** Chart open in the session when it starts (odakKaynak 'soz'). Read from the first entry of an `oturum`. */
  acik?: KorpusHastasi
  /** The doctor is on this patient's page: the real /api/asistan/oturum-hasta route is called before the turn. */
  sayfa?: KorpusHastasi
  /** Age the stored conversation record by N minutes before the turn (context expiry). */
  geriAlDk?: number
  yuzeyler: Yuzey[]
  brans?: 'pediatri' | 'dahiliye'
  beklenti: Beklenti | 'MANUAL'
  /** Voice-only overrides, merged over `beklenti` (e.g. identity values are shown, never spoken). */
  ses?: Beklenti
  /** File-panel-only overrides, merged over `beklenti` (e.g. the panel's server check writes what chat leaves to the model). */
  panel?: Beklenti
  /** The sentence is not a quote of the source but derived from its description; `not` says how. */
  turetilmis?: boolean
  /** Ledger id of a defect the ledger itself lists as OPEN: a FAIL here is known, not a new regression. */
  acikKusur?: string
  not?: string
}

/* ───────────────────────────── sources ───────────────────────────── */

const LEDGER = 'docs/OPEN-COMMITMENTS.md'
const GUNLUK = 'docs/qa/gokhan-gunluk-sorular.md'
const YETENEK = 'docs/qa/gokhan-yetenek-talepleri.md'
const YUZ = 'scripts/ayse-denetim/sorular-100.json'
const TAKIP = 'scripts/ayse-denetim/sorular-takip.json'
const CANLI = 'scripts/ayse-denetim/sorular-canli-0930.json'
const ILK10 = 'docs/denetim/2026-09-26-qa-sentetik-bebek.md'
const EYLEM = 'docs/denetim/2026-10-02-ayse-eylem.md'
const DENETIM = 'docs/ayse-capability-regression-audit.md'
const ROTA = 'lib/asistan/ayseRota.test.ts'
const T_COZ = 'lib/doktor/hastaCozumleyici.test.ts'
const T_SOZ = 'lib/doktor/sesliSoz.test.ts'
const T_ANALIZ = 'lib/doktor/pratikAnaliz.test.ts'
const T_KAPSAM = 'lib/asistan/kapsamKilidi.test.ts'
const T_STANDART = 'lib/asistan/dosyaSorgu/denetim.test.ts'
const T_OLCUM = 'lib/asistan/vizitOlcumSahne.test.ts'
const T_KOHORT = 'lib/asistan/aktifHastaPratik.test.ts'

/** Every source file the corpus was extracted from, with what was taken. Printed in the report. */
export const KORPUS_KAYNAKLARI: { dosya: string; ne: string }[] = [
  { dosya: LEDGER, ne: 'rows citing a live case (canlı / Kaan live / Dr. Gökhan / quoted sentences)' },
  { dosya: GUNLUK, ne: 'all rows: daily-use set 1–55 and the scope table K1–K12' },
  { dosya: YETENEK, ne: 'the five capabilities he reported lost' },
  { dosya: YUZ, ne: 'the 100-question set (103 rows), report docs/denetim/2026-09-29-ayse-100*.md, 2026-09-30-kademe.md' },
  { dosya: TAKIP, ne: 'the follow-up set (34 sequences, 101 rows), report docs/denetim/2026-09-30-ayse-takip.md' },
  { dosya: CANLI, ne: 'the six sentences of the 09-30 live test' },
  { dosya: ILK10, ne: 'the İlk-10 file questions of the dosyaSorgu audit (lib/asistan/dosyaSorgu/denetim/puanla.ts; also the 09-27 reports)' },
  { dosya: EYLEM, ne: 'the 33 action sentences of the live action audit (lib/asistan/tests/eylemDenetimi.ts)' },
  { dosya: DENETIM, ne: 'probe sentences of §4.2 (scope gate) and §4.3 (count template), cited by NOTYA-KAPSAM-06 / NOTYA-AYSE-GERI-01' },
  { dosya: ROTA, ne: 'routing rows written from his capability list and the live wrong-chart incident' },
  { dosya: T_COZ, ne: 'header comments citing live cases (#504, NOTYA-HASTA-ODAK-01)' },
  { dosya: T_SOZ, ne: 'header comments citing live cases (NOTYA-SES-DOLGU-01/02, NOTYA-HASTA-ODAK-01)' },
  { dosya: T_ANALIZ, ne: 'header comment citing the live antibiotic question (NOTYA-AYSE-HASTA-01)' },
  { dosya: T_KAPSAM, ne: 'header comment citing the live weather sentence (NOTYA-KAPSAM-05)' },
  { dosya: T_STANDART, ne: 'single-fact questions of the Dr. Gökhan standard' },
  { dosya: T_OLCUM, ne: 'header comment citing the live visit-measurement question (NOTYA-DANIS-OLCUM) and its variants' },
  { dosya: T_KOHORT, ne: 'the doctor\'s own practice-ranking question of 2026-09-20 and its variants (NOTYA-AYSE-KOHORT-01)' },
]

/**
 * Live complaints in the sources that are NOT a sentence said to Ayşe and therefore cannot be run through a chat /
 * voice / panel turn. Listed so the gap is visible, not silently dropped.
 */
export const KAPSAM_DISI_SIKAYETLER: { kaynak: string; neden: string }[] = [
  { kaynak: 'NOTYA-SES-TUR-01 / -02, GUNLUK #51', neden: 'microphone turn-taking and the cross-patient audio incident: audio layer, not reproducible with text input' },
  { kaynak: 'NOTYA-SES-SESSIZ-01, NOTYA-ASISTAN-KAPAT-01', neden: 'browser behaviour (voice goes silent when typing; close button)' },
  { kaynak: 'NOTYA-AYSE-ACILIS-01', neden: 'opening greeting with pending notes: needs the day-summary opener, not a doctor sentence' },
  { kaynak: 'NOTYA-SES-DEVAM-01 (browser half), NOTYA-AYSE-GERI-02a / -06a', neden: 'continuation played by the browser after playback stops; needs a microphone' },
  { kaynak: 'NOTYA-SES-SLUR-01, NOTYA-SES-FISH-01, Fish voice rollback', neden: 'speech quality: judged by ear' },
  { kaynak: 'STT mis-transcription (2026-10-01)', neden: 'the recogniser itself; only the split-name TRANSCRIPT is in the corpus' },
  { kaynak: 'GUNLUK K12', neden: 'the opening greeting is not a doctor question' },
  { kaynak: 'KASA-BELGE-01, RANDEVU-IPTAL-REAKTIVASYON, RANDEVU-HASTA-ARAMA-TR, ONAY-SONRASI-DONUS, HASTA-FORMU-SIGORTA-OPSIYONEL, NOTYA-MUAYENEYE-DON-01, NOTYA-AVATAR-01', neden: 'page / form defects, no assistant turn' },
  { kaynak: 'NOTYA-RECETE-04, NOTYA-ILAC-SONLANDIR-01, NOTYA-CEK-DOGRULA, NOTYA-ASI-NOT, NOTYA-FISILTI-GIZLE, NOTYA-ARSIV', neden: 'note approval and chart-page logic, no assistant turn' },
  { kaynak: 'MD-TABLO-FIX (markdownTablo.regresyon.test.ts)', neden: 'rendering of a table in the chat bubble: a client component' },
]

/* ───────────────────────────── names ───────────────────────────── */

const P = 'Emircan Karaoğlu'
const A = 'Ayşe Bozkurt'
const R = 'Tarık Özdemir'
const O = 'Olcay Santoro'
const D = 'Deniz Aksoy'
/** Charts owned by the corpus doctor (gokhanKorpusHastalari.ts PANEL_SAYISI; checked by the unit test). */
export const KORPUS_PANEL_SAYISI = 5

/* ───────────────────────────── shared patterns ───────────────────────────── */

const ASI_KAYDI_YOK = 'kayıt (yok|bulamadım|göremiyorum)|kayıtlı aşı yok|aşı kaydı (yok|bulunmuyor)|kaydına rastlamadım|kayıtlı doz yok|doz kaydı yok|belgelenen (aşı|doz) yok'
const LAB_YOK = 'lab\\w* (sonucu |kaydı |sonuç )?(yok|bulunmuyor|bulamadım|görünmüyor)|onaylı lab yok|kayıt (yok|bulamadım)|tahlil\\w* (sonucu |kaydı )?(yok|bulunmuyor|bulamadım|görünmüyor|gelmemiş)'
const ONCE_YOK = 'ilk|tek|önce\\w* (vizit|kayıt|muayene)\\w* (yok|bulunmuyor)|daha önce\\w* (kayıt|vizit)\\w* (yok|bulunmuyor|görünmüyor)|kayıt (yok|bulunmuyor|bulamadım)|(başka|daha eski)[^.]*(vizit|kayıt|atak)\\w* (yok|bulunmuyor)'
const RANDEVU_YOK = 'randevu\\w* (yok|bulunmuyor|görünmüyor|kayıtlı değil|bulamadım)|hiç randevu|randevusu yok|planlanmış randevu yok'
const BULUNAMADI = 'bulamadım|bulunamadı|kayıtlarınızda yok|kayıtlı değil'
/** The patient-count template's sentence shapes (lib/doktor/hastaAramaFiltre.ts). */
const SAYIM_SABLONU = 'Kayıtlarda \\d+ hasta|\\b0 hasta|Filtre:'
const PANEL_SAYI = `\\b${KORPUS_PANEL_SAYISI}\\b|beş`

/**
 * Sentences Ayşe must never say on any turn that is not an expected refusal. Each comes from a complaint:
 *   deflection to the screen / "no access"   — the 100-question rubric, NOTYA-KONUSMA-BAGLAMI-06
 *   "uydurdum / dayanağı yok"                — NOTYA-HASTA-ODAK-01, NOTYA-AYSE-ACILIS-01
 *   "Bakıyorum Hocam" filler                 — NOTYA-AYSE-ACILIS-01
 *   "veri girişi yapabilen bir araç değilim" — NOTYA-EYLEM
 *   "özetimde yok"                           — NOTYA-AYSE-GERI-06
 *   "undefined" / "NaN" in a sentence        — NOTYA-AYSE-GERI-08 (the audit found a card line saying "undefined")
 */
export const YASAK_CUMLELER: { ad: string; re: string }[] = [
  { ad: 'deflection', re: 'menüden|menüsünden|ekrandan kontrol|takvimden kontrol|erişemiyorum|erişimim yok|ulaşamıyorum|sisteme bağlantım|dosyaya erişimim' },
  { ad: 'false confession', re: 'uydurdum|uydurmuşum|dayanağı yok' },
  { ad: 'filler', re: 'Bakıyorum Hocam' },
  { ad: 'cannot record', re: 'veri girişi yapabilen bir araç değilim' },
  { ad: 'short-chart miss', re: 'özetimde yok' },
  { ad: 'template leak', re: '\\bundefined\\b|\\bNaN\\b|\\[object Object\\]' },
]
/** A follow-up must be answered, not bounced back (the follow-up set's rubric). */
export const GERI_SORU = 'hangi hastayı|hangi hastanın|hangi tarih|neyi kastettiniz|kastettiğiniz|netleştirir misiniz|netleştirmenizi'
/** The opening of the fixed out-of-scope refusal (lib/asistan/kapsamRed.ts KAPSAM_RED; the unit test compares). */
export const KAPSAM_RED_BASI = 'ben yalnızca Notya\'daki hasta, muayene, randevu ve klinik konularda yardımcı olabiliyorum'

/* ───────────────────────────── builders ───────────────────────────── */

type Ek = Partial<Omit<KorpusGirdisi, 'id' | 'kat' | 'soz' | 'kaynak' | 'beklenti'>>
const L = (kimlik: string): Kaynak => ({ dosya: LEDGER, kimlik })
const G = (no: number | string): Kaynak => ({ dosya: GUNLUK, kimlik: `#${no}` })
const Y = (no: number): Kaynak => ({ dosya: YUZ, kimlik: `#${no}` })
const T = (no: number): Kaynak => ({ dosya: TAKIP, kimlik: `#${no}` })
const C = (no: number): Kaynak => ({ dosya: CANLI, kimlik: `#${no}` })
const K = (dosya: string, kimlik: string): Kaynak => ({ dosya, kimlik })
const IKI: Yuzey[] = ['yazi', 'ses']
const UC: Yuzey[] = ['yazi', 'ses', 'panel']

function g(id: string, kat: Kategori, soz: string, kaynak: Kaynak | Kaynak[], beklenti: Beklenti | 'MANUAL', ek: Ek = {}): KorpusGirdisi {
  return { id, kat, soz, kaynak: Array.isArray(kaynak) ? kaynak : [kaynak], beklenti, yuzeyler: IKI, ...ek }
}
const dosyada = (...icerir: string[]): Beklenti => ({ icerir, rotaDegil: ['arama', 'kapsam'] })

/* ══════════════════════════════════════════════════════════════════════════════════════════════════════
 * A. docs/OPEN-COMMITMENTS.md — live cases
 * ══════════════════════════════════════════════════════════════════════════════════════════════════════ */
const LEDGER_GIRDILERI: KorpusGirdisi[] = [
  // ── counts ──
  g('L-SAYIM-ANDA', 'sayim', 'Hocam benim şu anda toplam kaç hastam var?', [L('NOTYA-SAYIM-ANDA-01'), C(1)],
    { rota: ['arama'], icerir: [`Kayıtlarda ${KORPUS_PANEL_SAYISI} hasta`], icermez: ['Kayıtlarda 0 hasta'] }),
  g('L-1TO1-YAS', 'dosya', 'hastamız kaç yaşında', L('NOTYA-SES-1TO1-02'),
    { hasta: 'bebek', icerir: ['2 yaş'], icermez: [SAYIM_SABLONU], rotaDegil: ['arama'] }, { acik: 'bebek' }),
  g('L-1TO1-AC', 'hasta-cozum', `${P}'nun dosyasını aç`, L('NOTYA-SES-1TO1-02'),
    { rota: ['dosya-ac'], hasta: 'bebek', icerir: [`${P} dosyası açık`] }, { turetilmis: true, not: 'The ledger quotes the pattern "X\'in dosyasını aç"; X is the synthetic chart.' }),
  g('L-1TO1-YOK', 'hasta-cozum', 'Kemal Sarıtaş\'ın dosyasını aç', L('NOTYA-SES-1TO1-02'),
    { hasta: null, icerir: ['Bu isimde bir hasta bulamadım'], icermez: ['dosyası açık'] }, { turetilmis: true, not: 'Same pattern with a name nobody carries: "otherwise Bu isimde bir hasta bulamadım Hocam".' }),

  // ── calendar continuity (09-30 live test) ──
  g('C-2', 'takvim', 'Bugün hiçbir randevumuz var mı?', [C(2), L('NOTYA-KONUSMA-BAGLAMI-06')], { rota: ['takvim'], icerir: ['{BUGUN}'] }, { oturum: 'C-T1' }),
  g('C-3', 'takip', 'Peki yanım var mı?', [C(3), L('NOTYA-KONUSMA-BAGLAMI-06')], { rota: ['takvim'], icerir: ['{YARIN}'], soruSormaz: true }, { oturum: 'C-T1', not: 'Fish wrote "yanım" for "yarın".' }),
  g('C-4', 'takvim', 'Bugün randevum var mı?', C(4), { rota: ['takvim'], icerir: ['{BUGUN}'] }, { oturum: 'C-T2' }),
  g('C-5', 'takip', 'Peki xqzt var mı?', [C(5), L('NOTYA-KONUSMA-BAGLAMI-06')], { rota: ['takvim'], icerir: ['{YARIN}'], soruSormaz: true }, { oturum: 'C-T2', not: 'Unreadable word after a calendar turn → the next natural day.' }),
  g('C-6', 'takvim', 'Yarın randevo var mı?', [C(6), L('NOTYA-KONUSMA-BAGLAMI-06')], { rota: ['takvim'], icerir: ['{YARIN}'] }),
  g('L-SES-TUR-BIRLESIK', 'takvim', 'İyiyim teşekkür ederim. Bugün randevumuz var mı?', L('NOTYA-SES-TUR-01'),
    { rota: ['takvim'], icerir: ['{BUGUN}'] }, { not: 'Two sentences in one breath arrive as ONE merged utterance; the question must still be answered.' }),

  // ── one named patient is answered from that chart (NOTYA-AYSE-HASTA-01) ──
  g('L-HASTA-01', 'ilac', `${P}'na hiç antibiyotik vermiş miyim ve verdiysem hangisini vermişim.`, [L('NOTYA-AYSE-HASTA-01'), K(T_ANALIZ, 'tekHastaSorusuMu: canlı vaka')],
    { hasta: 'bebek', rotaDegil: ['arama'], icerir: ['[Aa]moksisilin|Augmentin'], icermez: ['Son 30 gün', 'en çok yaz'] }),

  // ── identity questions answered on the server, without the model (NOTYA-BETA-0925) ──
  g('L-KIMLIK-ANNE', 'kimlik', 'Annesinin adı ne?', [L('NOTYA-BETA-0925'), K(ROTA, 'Annesinin adı ne?')],
    { rota: ['kimlik'], hasta: 'bebek', icerir: ['Elif'] }, { acik: 'bebek', ses: { icerir: ['ekran'], icermez: ['Elif'] }, not: 'Voice: the value stays on screen, the spoken sentence carries none.' }),
  g('L-KIMLIK-BABA', 'kimlik', 'Babasının adı ne?', L('NOTYA-BETA-0925'),
    { rota: ['kimlik'], hasta: 'bebek', icerir: ['Serdar'] }, { acik: 'bebek', ses: { icerir: ['ekran'], icermez: ['Serdar'] }, turetilmis: true, not: 'The row lists "anne/baba adı"; the father form of the quoted mother question.' }),
  g('L-KIMLIK-ANNETEL', 'kimlik', 'Annesinin telefonu ne?', [L('NOTYA-BETA-0925'), K(T_STANDART, 'Annesinin telefonu ne?')],
    { rota: ['kimlik'], hasta: 'bebek', icerir: ['0532 000 11 22'] }, { acik: 'bebek', ses: { icerir: ['ekran'], icermez: ['0532'] } }),
  g('L-KIMLIK-VELI', 'kimlik', 'Velisi kim?', L('NOTYA-BETA-0925'),
    { rota: ['kimlik'], hasta: 'bebek', icerir: ['Elif Karaoğlu'] }, { acik: 'bebek', ses: { icerir: ['ekran'], icermez: ['Elif'] }, turetilmis: true, not: 'The row lists "veli" among the answered fields.' }),
  g('L-KIMLIK-DOGUMYERI', 'kimlik', 'Doğum yeri neresi?', L('NOTYA-BETA-0925'),
    { rota: ['kimlik'], hasta: 'bebek', icerir: ['İzmir'] }, { acik: 'bebek', ses: { icerir: ['ekran'] }, turetilmis: true, not: 'The row lists "doğum yeri/tarihi".' }),
  g('L-KIMLIK-ADRES', 'kimlik', 'Adresi ne?', L('NOTYA-BETA-0925'),
    { rota: ['kimlik'], hasta: 'bebek', icerir: ['QA Mahallesi'] }, { acik: 'bebek', ses: { icerir: ['ekran'], icermez: ['QA Mahallesi'] }, turetilmis: true, not: 'The row lists "adres".' }),
  g('L-KIMLIK-EPOSTA', 'kimlik', 'E-posta adresi ne?', L('NOTYA-BETA-0925'),
    { rota: ['kimlik'], hasta: 'bebek', icerir: ['qa-veli@example\\.test'] }, { acik: 'bebek', ses: { icerir: ['ekran'], icermez: ['example'] }, turetilmis: true, not: 'The row lists "e-posta".' }),
  g('L-KIMLIK-DT', 'kimlik', `${P}'nun doğum tarihini verir misin?`, L('STT mis-transcription investigated'),
    { rota: ['kimlik'], hasta: 'bebek', icerir: ['{P_DOGUM}'] }, { ses: { icerir: ['ekran'] } }),
  g('L-KIMLIK-DT-ASR', 'kimlik', 'Emircan Kara oğlunun doğum tarihini verir misin?', L('STT mis-transcription investigated'),
    { rota: ['kimlik'], hasta: 'bebek', icerir: ['{P_DOGUM}'] }, { ses: { icerir: ['ekran'] }, turetilmis: true, not: 'The transcript Fish produced: the compound surname split in two, no apostrophe.' }),

  // ── voice found no record of an exactly named patient (NOTYA-SES-HASTA-01, #504) ──
  g('L-SES-HASTA-01', 'hasta-cozum', `${A}'un son muayenesinin özetini verir misin?`, [L('NOTYA-SES-HASTA-01'), K(T_COZ, 'son muayenesinin özetini verir misin?')],
    { hasta: 'ayse', rotaDegil: ['arama', 'kapsam'], icerir: ['pnömoni|zatürre|öksürük'], icermez: [SAYIM_SABLONU, BULUNAMADI] }),
  g('L-SES-HASTA-01-ASR', 'hasta-cozum', 'Ayşe Bozkurtun son muayenesinin özetini verir misin?', [L('NOTYA-SES-HASTA-01'), K(T_COZ, 'apostrofsuz ek, canlı ASR biçimi')],
    { hasta: 'ayse', rotaDegil: ['arama', 'kapsam'], icerir: ['pnömoni|zatürre|öksürük'], icermez: [SAYIM_SABLONU, BULUNAMADI] }),
  g('L-SES-HASTA-01-KOHORT', 'liste', 'Merhaba Ayşe, bu hafta ateşli hastalarım kimler', [L('NOTYA-SES-HASTA-01'), K(T_SOZ, 'Merhaba Ayşe, bu hafta ateşli hasta var mı')],
    { rota: ['arama'], hasta: null, icermez: ['Ayşe Bozkurt dosyası açık'] }, { not: 'The cohort case of the same fix: "Ayşe," is an address, the question stays a list.' }),

  // ── open chart answers the unnamed question (NOTYA-AKTIF-HASTA-01, NOTYA-LUNA-ARAMA-01) ──
  g('L-AKTIF-SON', 'dosya', 'En son ne zaman geldi?', [L('NOTYA-AKTIF-HASTA-01'), L('NOTYA-LUNA-ARAMA-01')],
    { hasta: 'bebek', rotaDegil: ['arama'], icerir: ['{P_SON_VIZIT}'], icermez: [SAYIM_SABLONU] }, { acik: 'bebek', yuzeyler: UC }),
  g('L-AKTIF-TANSIYON', 'dosya', 'Tansiyon takibini nasıl planlarsın?', L('NOTYA-AKTIF-HASTA-01'),
    { hasta: 'eriskin', rotaDegil: ['arama'], icermez: [SAYIM_SABLONU] }, { acik: 'eriskin', brans: 'dahiliye', yuzeyler: UC, not: 'Adult chart. The ledger asks only that the open chart answers; whether the answer is a plan is a human read.' }),

  // ── fillers, split names, the assistant's own name (NOTYA-SES-DOLGU-01, NOTYA-HASTA-ODAK-01) ──
  g('L-DOLGU-01', 'hasta-cozum', 'Emircan, eee, Karaoğlu\'nun dosyasına bak... şu anda kaç yaşında Emircan?', L('NOTYA-SES-DOLGU-01'),
    { hasta: 'bebek', icerir: ['Emircan Karaoğlu'], icermez: [SAYIM_SABLONU] }, { not: 'The fix asked for the patient to be found instead of "Kayıtlarda 0 hasta"; whether the age is also said is recorded, not graded.' }),
  g('L-DOLGU-KILO', 'hasta-cozum', `Peki Ayşe, ${P} kaç kilo?`, K(T_SOZ, 'NOTYA-HASTA-ODAK-01: cümle ortasındaki hitap'),
    { hasta: 'bebek', icerir: ['12,8'], icermez: [SAYIM_SABLONU, 'Ayşe Bozkurt'] }),
  g('L-DOLGU-HANE', 'hasta-cozum', 'Eee, merhaba Ayşe Hocam. Bana, eee, Emirhan Karaoğlu\'nun hanesini gösterir misin', K(T_SOZ, 'hanesini gösterir misin'),
    { icermez: ['Ayşe Bozkurt'] }, { not: 'Mis-heard first name and "hanesini" for "dosyasını": the address must not open the chart of the patient called Ayşe. Which chart opens is recorded.' }),
  g('L-ODAK-01', 'asi', 'Biraz koy. Ayşe, benim spesifik, eee, arzum şeydi, aşı karnesini göstermendi.', [L('NOTYA-HASTA-ODAK-01'), K(T_SOZ, 'Biraz koy. Ayşe, benim spesifik')],
    { hasta: 'bebek', icerir: ['Hepatit B'], icermez: ['Ayşe Bozkurt', 'kayıtlı aşı yok'] }, { acik: 'bebek', not: 'The live wrong-chart case: the open chart is the boy, the panel also holds a girl called Ayşe with no vaccine rows.' }),
  g('L-ODAK-HITAP-1', 'hasta-cozum', 'Ayşe, aşı karnesini gösterir misin?', [K(T_COZ, 'Ayşe, aşı karnesini gösterir misin?'), K(ROTA, 'Ayşe, aşı karnesini gösterir misin?'), L('NOTYA-HASTA-ODAK-01')],
    { hasta: null, rotaDegil: ['arama'], icermez: ['Ayşe Bozkurt', 'kayıtlı aşı yok'] }),
  g('L-ODAK-HITAP-2', 'hasta-cozum', 'Ayşe Hanım otitte ilk seçenek ne?', [K(ROTA, 'Ayşe Hanım otitte ilk seçenek ne?'), K(T_COZ, 'Ayşe Hanım otitte ilk seçenek ne')],
    { hasta: null, rota: ['model'], icermez: ['Ayşe Bozkurt'] }),
  g('L-ODAK-HITAP-3', 'sohbet', 'Merhaba Ayşe, nasılsın?', K(ROTA, 'Merhaba Ayşe, nasılsın?'), { hasta: null, rota: ['model'] }),
  g('L-ODAK-HITAP-4', 'sohbet', 'Teşekkürler Ayşe', K(T_COZ, 'Teşekkürler Ayşe'), { hasta: null, rotaDegil: ['arama', 'kapsam', 'dosya-ac'] }),
  g('L-DOLGU-02', 'sohbet', 'Merhaba hocam bugün nasınsınız iyi misiniz?', [L('NOTYA-SES-LATENCY-BULGULARI'), K(T_SOZ, 'NOTYA-SES-DOLGU-02')],
    { hasta: null, rotaDegil: ['arama', 'kapsam', 'dosya-ac'] }, { not: 'Fish wrote "nasınsınız"; the small talk fell to a full scan and an unrelated chart was opened.' }),

  // ── the doctor moved to another patient's page (NOTYA-SAYFA-HASTA-01) ──
  g('L-SAYFA-KILO', 'olcum', 'kaç kilo', L('NOTYA-SAYFA-HASTA-01'),
    { hasta: 'bebek', icerir: ['12,8'], icermez: ['19,4', SAYIM_SABLONU] }, { acik: 'ayse', sayfa: 'bebek', not: 'Session focus is the girl; the doctor opens the boy\'s page. The unnamed question is the boy\'s.' }),
  g('L-SAYFA-BUYUME', 'ilk10', 'Büyümesi nasıl gidiyor?', [L('NOTYA-SAYFA-HASTA-01'), K(ILK10, '## 3.')],
    { hasta: 'bebek', icerir: ['12[.,]8|12[.,]6'], icermez: ['karşılaştıracak ikinci bir nokta yok', '19,4'] }, { acik: 'ayse', sayfa: 'bebek' }),

  // ── voice: summary, read-aloud, units ──
  g('L-ERKEN-01', 'ses', `${P}'nun dosyasını kısaca özetler misin`, L('NOTYA-SES-ERKEN-01'),
    { hasta: 'bebek', icerir: ['Emircan'], rotaDegil: ['arama', 'kapsam'], icermez: ['Bağlantı kurulamadı'] }),
  g('L-OKU-01', 'ses', 'Devamını ekranda görüyorum ama sen bana anlat', L('NOTYA-SES-OKU-01'),
    { rota: ['oku'] }, { acik: 'bebek', kurulum: ['Son üç muayenesini özetle'], yuzeyler: ['ses'], not: 'Reads the last screen answer aloud, uncapped, without the model.' }),
  g('L-DEVAM-01', 'ses', 'devam et', L('NOTYA-SES-DEVAM-01'),
    'MANUAL', { acik: 'bebek', kurulum: ['Bu hastayı bana kısaca özetler misin?'], yuzeyler: ['ses'], not: 'A remainder exists only when the previous spoken turn was cut; with text input it usually is not.' }),
  g('L-OZET-TAM', 'ses', 'Hastanın özetini oku', [L('NOTYA-SES-OZET-TAM-01'), G(53)],
    { hasta: 'bebek', rotaDegil: ['arama', 'kapsam'], icermez: ['[Dd]evamı ekran'] }, { acik: 'bebek', yuzeyler: ['ses'], not: 'A chart-evidence answer is read in full on voice.' }),
  g('L-BIRIM-02', 'ses', 'Son muayenede ateşi kaçtı?', [L('NOTYA-TTS-BIRIM-02'), G(54)],
    { hasta: 'tarik', icerir: ['38,7'], okunus: { icerir: ['derece'], icermez: ['°'] } }, { acik: 'tarik', yuzeyler: ['ses'], turetilmis: true, not: 'The complaint is how "39°C" was read; the question that makes Ayşe say a temperature is the corpus\'s. Graded on the text handed to the speech engine (fishMetni): the degree sign must be written out.' }),

  // ── a chart word inside an unrelated sentence (NOTYA-DOSYA-SORU-PLAN-01) ──
  g('L-PLAN-01', 'kapsam', 'Bir tane Tesla elektrikli araba almayı planlıyorum.', [L('NOTYA-DOSYA-SORU-PLAN-01'), G(52), L('NOTYA-KAPSAM-01')],
    { ret: true, icermez: ['1 ay sonra kontrol', 'Tedavi tamamlandı', 'Emircan'] }, { sayfa: 'bebek', not: 'New chat on the boy\'s page: the answer was his visit plan.' }),

  // ── one named exam (NOTYA-DOSYA-SORU-TUR-01) ──
  g('L-TUR-6AY', 'muayene', `${P}'nun 6 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın?`, [L('NOTYA-DOSYA-SORU-TUR-01'), G(55)],
    { hasta: 'bebek', rotaDegil: ['arama', 'kapsam'], icerir: ['6 aylık|[Ee]k gıda|7,9|67,5'], icermez: ['otitis media|Augmentin'] }, { yuzeyler: UC, acik: 'bebek' }),
  g('L-TUR-12AY', 'muayene', `${P}'nun 12 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın?`, L('NOTYA-DOSYA-SORU-TUR-01'),
    { hasta: 'bebek', rotaDegil: ['arama', 'kapsam'], icerir: ['12 aylık|birkaç adım|9,8'], icermez: ['otitis media|Augmentin'] }, { turetilmis: true, not: 'The quoted sentence with another well-child visit of the fixture.' }),
  g('L-TUR-15AY', 'muayene', `${P}'nun 15 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın?`, L('NOTYA-DOSYA-SORU-TUR-01'),
    { hasta: 'bebek', rotaDegil: ['arama', 'kapsam'], icerir: ['15 aylık|10,6|5-6 kelime'], icermez: ['otitis media|Augmentin'] }, { turetilmis: true, not: 'This visit has its measurements only in the note text.' }),
  g('L-TUR-18AY', 'muayene', `${P}'nun 18 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın?`, L('NOTYA-DOSYA-SORU-TUR-01'),
    { hasta: 'bebek', rotaDegil: ['arama', 'kapsam'], icerir: ['18 aylık|M-CHAT|11,3'], icermez: ['otitis media|Augmentin'] }, { turetilmis: true, not: 'The quoted sentence with another well-child visit of the fixture.' }),
  g('L-TUR-24AY', 'muayene', `${P}'nun 24 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın?`, L('NOTYA-DOSYA-SORU-TUR-01'),
    { hasta: 'bebek', rotaDegil: ['arama', 'kapsam'], icerir: ['24 aylık|Hepatit A|12,6'], icermez: ['otitis media|Augmentin'] }, { turetilmis: true, not: 'The quoted sentence with another well-child visit of the fixture.' }),
  g('L-GECMIS', 'muayene', 'Bu hastanın geçmişini özetler misin?', L('çoklu-muayene sorgusu'),
    { hasta: 'bebek', rotaDegil: ['arama', 'kapsam'], icerir: ['demir eksikliği|anemi', 'otit'] }, { acik: 'bebek', yuzeyler: UC, turetilmis: true, not: 'The ledger\'s success criterion: a "bu hastanın geçmişi" question is answered from ALL notes, not only the last one.' }),

  // ── weather sentence ran a patient count (NOTYA-KAPSAM-05) ──
  g('L-KAPSAM-05', 'kapsam', 'Bugün İstanbul\'da hava yağışlı mı?', [L('NOTYA-KAPSAM-05'), K(T_KAPSAM, 'NOTYA-KAPSAM-05: canlı cümle')],
    { ret: true, rota: ['kapsam'], icermez: [SAYIM_SABLONU] }),
  g('L-KAPSAM-05C', 'sayim', 'Bugün kaç hastam var?', L('NOTYA-KAPSAM-05c'),
    { icerir: ['\\b1\\b|Nermin'], icermez: ['Bugün 0 hasta', 'Şehir'] }, { not: 'Today = a visit or a non-cancelled appointment inside the doctor\'s day; the fixture has one appointment today.' }),
  g('L-KAPSAM-06B', 'kapsam', 'Yarın yağmur yağacak mı', L('NOTYA-KAPSAM-06b'), { ret: true, rota: ['kapsam'] }),

  // ── records on screen, commands and safety (NOTYA-AYSE-GERI-03/-04/-05, NOTYA-EYLEM, NOTYA-AYSE-GUVENLIK) ──
  g('L-EYLEM-HEPB', 'eylem', 'Doğum epikrizindeki Hepatit B dozunu kaydet', L('doğum epikrizinde bulduğu Hepatit B dozunu kaydetmesini istedi'),
    { arac: 'asi_kaydi_ekle', kart: 'asi_kaydi_ekle', icermez: ['yapamam|yapamıyorum'] }, { acik: 'bebek', yuzeyler: UC, turetilmis: true, not: 'The ledger describes the request made in "Ayşe\'ye Danış"; the answer was "veri girişi yapabilen bir araç değilim".' }),
  g('L-GERI-03-BOS', 'takvim', 'Yarın hangi saatler boş?', [L('NOTYA-AYSE-GERI-03'), K(ROTA, 'Yarın hangi saatler boş?'), K(YETENEK, 'free slots')],
    { rota: ['takvim'], icerir: ['{YARIN}'] }),
  g('L-GERI-03-YABANCI', 'eylem', 'Ali Yılmaz için randevu oluştur', [L('NOTYA-AYSE-GERI-03'), K(ROTA, 'Ali Yılmaz için randevu oluştur'), K(DENETIM, 'Ali Yılmaz için randevu oluştur')],
    { rotaDegil: ['arama'], kart: null, icermez: [SAYIM_SABLONU] }, { not: 'The named person is not a patient of this doctor: no card, and never the count template.' }),
  // ── the measurement of ONE named visit, from the record (NOTYA-DANIS-OLCUM, Dr. Gökhan live 2026-10-02) ──
  g('L-DANIS-12AY', 'olcum', 'bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu', [L('NOTYA-DANIS-OLCUM-03'), K(T_OLCUM, 'kaç kiloydu')],
    { hasta: 'bebek', icerir: ['12 aylık', '9,8 kg'], icermez: ['mg/kg', '12,8', SAYIM_SABLONU], rotaDegil: ['arama', 'hizli-kart'], sunucuYazar: true },
    { acik: 'bebek', yuzeyler: UC, oturum: 'L-DANIS', not: 'Asked in Ayşe\'ye Danış; the answer was an estimate from an iron dose. The weight recorded at that visit must reach the doctor on every surface, whatever the model writes; never the latest weight.' }),
  g('L-DANIS-BOYU', 'takip', 'peki boyu?', L('NOTYA-DANIS-OLCUM-07'),
    { icerir: ['\\b76 cm'], icermez: ['87,5'], sunucuYazar: true }, { acik: 'bebek', yuzeyler: UC, oturum: 'L-DANIS', not: 'A follow-up that does not repeat the visit: the height of the SAME (12-month) visit, written by the server on every surface (NOTYA-KORPUS-KALAN-01).' }),
  g('L-DANIS-15AY', 'olcum', '15 aylıkken kaç kiloydu', L('NOTYA-DANIS-OLCUM-03'),
    { hasta: 'bebek', icerir: ['15 aylık', '10,6 kg'], icermez: ['12,8', SAYIM_SABLONU], rotaDegil: ['arama', 'hizli-kart'], sunucuYazar: true },
    { acik: 'bebek', yuzeyler: UC, turetilmis: true, not: 'The row quotes the pattern "15 aylıkken". In the fixture that visit has its weight only in the note text — the third place the fix reads.' }),
  g('L-DANIS-6AY', 'olcum', '6 aylık kontrolde boyu kaçtı', L('NOTYA-DANIS-OLCUM-03'),
    { hasta: 'bebek', icerir: ['6 aylık', '67,5 cm'], icermez: ['87,5', SAYIM_SABLONU], rotaDegil: ['arama', 'hizli-kart'], sunucuYazar: true },
    { acik: 'bebek', yuzeyler: UC, turetilmis: true, not: 'The row quotes the pattern "6 aylık kontrolde"; height instead of weight.' }),
  g('L-DANIS-NORMAL', 'olcum', '12 aylık muayenesinde kilosu normal miydi?', [K(T_OLCUM, 'kilosu normal miydi?'), L('NOTYA-DANIS-OLCUM-04')],
    { hasta: 'bebek', icerir: ['9,8'], rotaDegil: ['arama', 'hizli-kart'] }, { acik: 'bebek', not: 'An evaluation goes to the model, with that visit\'s weight as evidence.' }),
  g('L-DANIS-SERI-1', 'olcum', 'kilo gelişimi', [K(T_OLCUM, 'kilo gelişimi'), L('NOTYA-DANIS-OLCUM-03')],
    { hasta: 'bebek', rota: ['kayit'], tablo: true, icerir: ['3,2 kg', '9,8 kg', '10,6 kg', '12,8 kg'] }, { acik: 'bebek', ses: { tablo: false, icerir: ['12,8 kg'] } }),
  g('L-DANIS-SERI-2', 'olcum', 'bütün muayenelerinde kilosu', [K(T_OLCUM, 'bütün muayenelerinde kilosu'), L('NOTYA-DANIS-OLCUM-03')],
    { tablo: true, icerir: ['8,9', '10,6', '12,8'], sunucuYazar: true }, { acik: 'bebek', yuzeyler: UC, ses: { tablo: false, icerir: ['12,8'] }, not: 'The weights written only in note text (9- and 15-month visits) are in the series too.' }),
  g('L-DANIS-TANSIYON', 'olcum', 'son muayenede tansiyonu kaçtı', [K(T_OLCUM, 'son muayenede tansiyonu kaçtı'), L('NOTYA-DANIS-OLCUM-04')],
    { hasta: 'eriskin', icerir: ['132/84'], rotaDegil: ['arama'], sunucuYazar: true }, { acik: 'eriskin', brans: 'dahiliye', yuzeyler: UC, not: 'Adult chart: every branş, no paediatric wording.' }),
  g('L-DANIS-TANSIYON-SERI', 'olcum', 'tansiyon seyri', [K(T_OLCUM, 'tansiyon seyri'), L('NOTYA-DANIS-OLCUM-04')],
    { hasta: 'eriskin', rota: ['kayit'], icerir: ['150/95', '138/86', '132/84'] }, { acik: 'eriskin', brans: 'dahiliye', ses: { icerir: ['132/84'] } }),
  g('L-DANIS-ILK', 'olcum', 'ilk muayenede kaç kiloydu', [K(T_OLCUM, 'ilk muayenede kaç kiloydu'), L('NOTYA-DANIS-OLCUM-03')],
    { hasta: 'eriskin', icerir: ['\\b78\\b'], icermez: ['75,5'], rotaDegil: ['arama', 'hizli-kart'] }, { acik: 'eriskin', brans: 'dahiliye' }),
  g('L-DANIS-SON', 'olcum', 'son muayenede kaç kiloydu', [K(T_OLCUM, 'son muayenede kaç kiloydu'), L('NOTYA-DANIS-OLCUM-03')],
    { hasta: 'eriskin', icerir: ['75,5'], rotaDegil: ['arama'] }, { acik: 'eriskin', brans: 'dahiliye' }),
  g('L-DANIS-GECEN-YIL', 'olcum', 'geçen yıl kaç kiloydu', L('NOTYA-DANIS-OLCUM-09'),
    'MANUAL', { acik: 'bebek', acikKusur: 'NOTYA-DANIS-OLCUM-09', not: 'OPEN in the ledger: the quick card answers with the LATEST weight. What the right answer is for "last year" is not written down.' }),

  // ── a practice question stays a practice question with a chart open (NOTYA-AYSE-KOHORT-01, live report 2026-09-20) ──
  g('L-KOHORT-01', 'liste', 'Son bir ay içinde hangi antibiyotiği en fazla yazdım?', [L('NOTYA-AYSE-KOHORT-01'), K(T_KOHORT, 'NOTYA-AYSE-KOHORT-01')],
    { rota: ['arama'], icerir: ['Augmentin|[Aa]moksisilin|Klacid'], icermez: ['dosyada son'] }, { acik: 'bebek', not: 'Asked with a chart open: the ranking is the practice\'s, not the open patient\'s quick card.' }),
  g('L-KOHORT-02', 'liste', 'Son bir ayda kaç hastaya antibiyotik yazdım?', K(T_KOHORT, 'NOTYA-AYSE-KOHORT-01'),
    { rota: ['arama'], icermez: ['dosyada son'] }, { acik: 'bebek' }),
  g('L-KOHORT-03', 'liste', 'Bu hafta en fazla hangi tanıyı koydum?', K(T_KOHORT, 'NOTYA-AYSE-KOHORT-01'),
    { rota: ['arama'], icermez: ['dosyada son'] }, { acik: 'bebek' }),
  g('L-KOHORT-04', 'ilac', 'Bu hastaya en fazla hangi antibiyotiği yazdım?', K(T_KOHORT, 'NOTYA-AYSE-KOHORT-01'),
    { hasta: 'bebek', rotaDegil: ['arama'], icerir: ['Augmentin|[Aa]moksisilin'] }, { acik: 'bebek', not: 'The counter-case: the sentence points at this patient, so it stays on the open chart.' }),

  g('L-GERI-02-EVET', 'eylem', 'Evet', L('NOTYA-AYSE-GERI-02'),
    'MANUAL', { acik: 'deniz', kurulum: ['Fıstık alerjisini ekle'], yuzeyler: ['ses'], not: 'A spoken Evet commits the pending card. With a stand-in model the card has no value to commit; read the live answer.' }),
]

/* ══════════════════════════════════════════════════════════════════════════════════════════════════════
 * B. docs/qa/gokhan-gunluk-sorular.md — all rows
 * ══════════════════════════════════════════════════════════════════════════════════════════════════════ */
const GUNLUK_GIRDILERI: KorpusGirdisi[] = [
  g('G-01', 'hasta-cozum', 'Emircan\'ın dosyasını aç', G(1), { rota: ['dosya-ac'], hasta: 'bebek', icerir: [P] }),
  g('G-02', 'hasta-cozum', 'Emircanın dosyası', [G(2), L('NOTYA-ARAMA-INDEKS-SUFFIX-01')], { hasta: 'bebek', icermez: [BULUNAMADI, SAYIM_SABLONU] }),
  g('G-03', 'hasta-cozum', 'Karaoğlu\'nun aşıları ne durumda', G(3), { hasta: 'bebek', icermez: [BULUNAMADI, SAYIM_SABLONU] }),
  g('G-04', 'hasta-cozum', 'Karaoğlunun aşıları', [G(4), L('NOTYA-ARAMA-INDEKS-SUFFIX-01')], { hasta: 'bebek', icermez: [BULUNAMADI, SAYIM_SABLONU] }),
  g('G-05', 'hasta-cozum', 'Bozkurt\'un dosyasını getir', G(5), { rota: ['dosya-ac'], hasta: 'ayse', icerir: [A] }),
  g('G-06', 'hasta-cozum', 'bozkurtun dosyasını getir', [G(6), L('NOTYA-ARAMA-INDEKS-SUFFIX-01')], { rota: ['dosya-ac'], hasta: 'ayse', icerir: [A] }),
  g('G-07', 'hasta-cozum', 'Tarık Özdemir\'i açar mısın', G(7), { hasta: 'tarik', icermez: [BULUNAMADI] }),
  g('G-08', 'hasta-cozum', 'Özdemir\'in son kontrolü ne zamandı', G(8), { hasta: 'tarik', icermez: [SAYIM_SABLONU, BULUNAMADI] }, { not: 'The source graded only that the surname resolves the patient (its chart had no visit, so no date could be checked). Whether the answer gives the date of the last visit is recorded, not graded.' }),
  g('G-09', 'hasta-cozum', 'Olcay\'ın kaydı var mı', G(9), { hasta: 'olcay', icermez: [BULUNAMADI] }),
  g('G-10', 'hasta-cozum', 'Santoro diye bir hastam var mıydı', G(10), { hasta: 'olcay', icermez: [BULUNAMADI] }),
  g('G-11', 'hasta-cozum', 'Emircn Karaoglu dosyasini ac', G(11), { hasta: 'bebek', icermez: [BULUNAMADI] }),
  g('G-12', 'hasta-cozum', 'Emirçan Kara oğlu hastasını bul', G(12), { hasta: 'bebek', icermez: [BULUNAMADI] }),
  g('G-13', 'hasta-cozum', 'Olcay Santor diye hasta var mı', G(13), { hasta: 'olcay', icermez: [BULUNAMADI] }),
  g('G-14', 'hasta-cozum', 'Ayşe hastamı bul', G(14), 'MANUAL', { not: 'The source calls "no patient" the design (NOTYA-HASTA-ODAK-01: the assistant\'s own name alone picks nobody); NOTYA-AYSE-GERI-01, later the same day, lets a patient called Ayşe resolve by first name when the name is not an address. The two rows disagree on this sentence.' }),
  g('G-15', 'hasta-cozum', 'hastamın dosyasını aç', [G(15), G(44)], { hasta: null, icermez: ['dosyası açık'] }, { not: 'No name: none of the charts may be guessed.' }),
  g('G-16', 'hasta-cozum', 'Taırk Özdemir\'in aşı karnesini göster', G(16), { hasta: 'tarik', icermez: [BULUNAMADI] }),
  g('G-17', 'sayim', 'şu anda toplam kaç hastam var', [G(17), L('NOTYA-SAYIM-ANDA-01')], { rota: ['arama'], icerir: [`Kayıtlarda ${KORPUS_PANEL_SAYISI} hasta`] }),
  g('G-18', 'sayim', 'kaç hastam var', G(18), { rota: ['arama'], icerir: [`Kayıtlarda ${KORPUS_PANEL_SAYISI} hasta`] }),
  g('G-19', 'liste', '2 yaşından küçük hastalarım kimler', G(19), { rota: ['arama'], icerir: ['\\b0 hasta|yok|bulunamadı'], icermez: ['Emircan', 'Tarık'] }, { not: 'Nobody in the fixture is under two (25 and 31 months).' }),
  g('G-20', 'liste', '1 yaşından büyük hastalarım kimler', G(20), { rota: ['arama'], icerir: ['\\b4 hasta'], icermez: ['Olcay'] }, { not: 'The chart without a birth date is left out.' }),
  g('G-21', 'liste', 'aşı kaydı olan hastalarım kimler', [G(21), L('NOTYA-ARAMA-PENCERE-VARSAYILAN-01'), L('NOTYA-AYSE-GERI-01')], { rota: ['arama'], icerir: ['Emircan'], icermez: ['\\b0 hasta'] }, { not: 'Every vaccine row of the fixture is older than 90 days; GERI-01 says the implicit window is gone.' }),
  g('G-22', 'liste', 'ilaç kullanan hastam var mı', [G(22), L('NOTYA-ARAMA-PENCERE-VARSAYILAN-01')], { rota: ['arama'], icerir: ['Emircan|Nermin|Ayşe|Tarık'], icermez: ['\\b0 hasta'] }),
  g('G-23', 'liste', 'bu ay kayıt olan hastalarım', [G(23), L('NOTYA-ARAMA-KAYIT-PENCERE-01')], 'MANUAL', { acikKusur: 'NOTYA-ARAMA-KAYIT-PENCERE-01', not: 'OPEN in the ledger; the right answer depends on the day of the month the run is made.' }),
  g('G-24', 'liste', 'doğum tarihi kayıtlı olmayan hastam var mı', [G(24), L('NOTYA-ARAMA-DOGUM-NEGASYON-01')], { rota: ['arama'], icerir: ['Olcay'], icermez: ['Emircan', 'Tarık', 'Nermin'] }),
  g('G-25', 'lab', 'Emircan\'ın hemoglobin değeri kaçtı', G(25), { hasta: 'bebek', icerir: ['11[.,]9|on bir virgül dokuz'], icermez: [SAYIM_SABLONU] }, { oturum: 'G-LAB' }),
  g('G-26', 'lab', 'ferritin sonucu ne', G(26), { hasta: 'bebek', icerir: ['\\b24\\b|yirmi dört'] }, { oturum: 'G-LAB' }),
  g('G-27', 'lab', 'WBC kaç', G(27), { hasta: 'bebek', icerir: ['9[.,]1|dokuz virgül bir'] }, { oturum: 'G-LAB' }),
  g('G-28', 'lab', 'MCV ve MCHC değerlerini oku', G(28), { hasta: 'bebek', icerir: ['\\b75\\b|yetmiş beş'] }, { oturum: 'G-LAB', not: 'The fixture has MCV; it has no MCHC row.' }),
  g('G-29', 'lab', 'Emircan\'ın Hct değeri yüzde kaç', G(29), 'MANUAL', { oturum: 'G-LAB', not: 'QUESTIONABLE in the source (how "%" is spoken); the fixture has no Hct row.' }),
  g('G-30', 'lab', 'Emircan\'ın topuk kanı sonuçları normal mi', G(30), 'MANUAL', { not: 'Model judgement in the source.' }),
  g('G-31', 'asi', 'Emircan\'ın aşıları tam mı', G(31), { hasta: 'bebek', icerir: ['Hepatit A'], icermez: [SAYIM_SABLONU, 'kayıtlı aşı yok'] }, { not: 'The fixture lacks Hepatit A 2. doz.' }),
  g('G-32', 'asi', 'Emircan\'ın eksik aşısı var mı', G(32), { hasta: 'bebek', icerir: ['Hepatit A'], icermez: [SAYIM_SABLONU, 'kayıtlı aşı yok'] }),
  g('G-33', 'asi', 'Tarık\'a hiç aşı yapıldı mı', G(33), { hasta: 'tarik', icerir: ['kayıt'], icermez: ['hiç yapılmadı|yapılmamış', SAYIM_SABLONU] }, { not: 'No vaccine row: "kayıtlı değil", never the claim "hiç yapılmadı".' }),
  g('G-34', 'asi', 'Ayşe\'nin son aşı tarihi ne', [G(34), K(ROTA, 'Ayşe’nin son aşı tarihi ne'), L('NOTYA-AYSE-GERI-01')], { hasta: 'ayse', icerir: ['kayıt'], icermez: [SAYIM_SABLONU] }),
  g('G-35', 'ilac', 'Emircan\'ın kullandığı ilaç var mı', G(35), { hasta: 'bebek', icerir: ['D vitamini'], icermez: [SAYIM_SABLONU] }),
  g('G-36', 'ilac', 'Tarık\'a daha önce antibiyotik yazdım mı', G(36), { hasta: 'tarik', icerir: ['[Aa]moksisilin'], icermez: [SAYIM_SABLONU] }, { not: 'In the source panel there was no drug row; the synthetic chart has one antibiotic.' }),
  g('G-37', 'ilac', 'Ayşe\'nin reçete geçmişini göster', G(37), { hasta: 'ayse', icerir: ['Klacid|klaritromisin'], icermez: [SAYIM_SABLONU] }),
  g('G-38', 'takvim', 'yarın randevum var mı', G(38), { rota: ['takvim'], icerir: ['{YARIN}', 'Ayşe Bozkurt'] }),
  g('G-39', 'takvim', 'bugün kaç hastam geliyor', G(39), { icerir: ['\\b1\\b|Nermin'], icermez: ['\\b0 hasta'] }),
  g('G-40', 'takvim', 'Emircan\'ın bir sonraki kontrolü ne zaman', [G(40), L('NOTYA-SES-KART-01')], { hasta: 'bebek', icerir: ['{P_RANDEVU}|1 ay sonra kontrol'], icermez: [SAYIM_SABLONU] }, { not: 'Either the booked appointment or the follow-up written in the last plan (NOTYA-SES-KART-01: a control question is answered from the plan).' }),
  g('G-41', 'dosya', 'Ayşe\'nin hiç ateşi olmadı mı', G(41), 'MANUAL', { not: 'Not tested in the source; a negated question about a chart that does have a fever on record.' }),
  g('G-42', 'dosya', 'Emircan\'ın allerjisi var mı', G(42), { hasta: 'bebek', icerir: ['alerji'], icermez: [SAYIM_SABLONU, 'Penisilin'] }),
  g('G-43', 'dosya', 'Olcay\'ın kronik hastalığı var mı', G(43), { hasta: 'olcay', icerir: ['kayıt yok|yok|bulunmuyor'], icermez: [SAYIM_SABLONU] }),
  g('G-45', 'hasta-cozum', 'Ayşe\'yi aç', G(45), 'MANUAL', { not: 'The source expects the persona-name guard (no chart); NOTYA-AYSE-GERI-01 later made "Ayşe\'nin …" resolve the patient called Ayşe. Which rule covers the accusative is not written down.' }),
  g('G-46', 'sohbet', 'Bugün nasılsın Ayşe', G(46), { hasta: null, rotaDegil: ['arama', 'kapsam', 'dosya-ac'] }),
  g('G-47', 'sohbet', 'Sen neler yapabilirsin', G(47), { rotaDegil: ['arama', 'kapsam'] }),
  g('G-48', 'sohbet', 'Teşekkürler, iyi çalışmalar', G(48), { rotaDegil: ['arama', 'kapsam'] }),
  g('G-49', 'dosya', 'Ayşe için SOAP notu taslağı hazırla', G(49), 'MANUAL', { not: 'Generative; model judgement in the source.' }),
  g('G-50', 'muayene', 'Tarık\'a son yazdığım notu oku', G(50), { hasta: 'tarik', icerir: ['otit|kulak'], icermez: [SAYIM_SABLONU] }, { not: 'In the source panel there was no note; the synthetic chart has one.' }),
  // G-51 is in KAPSAM_DISI_SIKAYETLER; G-52..G-55 are the ledger entries L-PLAN-01, L-OZET-TAM, L-BIRIM-02, L-TUR-6AY.
  // ── NOTYA-KAPSAM-01 table ──
  g('G-K1', 'kapsam', 'Tesla almak istiyorum', [G('K1'), L('NOTYA-KAPSAM-01')], { ret: true, rota: ['kapsam'] }, { oturum: 'G-K' }),
  g('G-K2', 'kapsam', 'Peki Model Y mi Model 3 mü daha iyi', G('K2'), { ret: true, rota: ['kapsam'] }, { oturum: 'G-K', not: 'Same topic right after a refusal.' }),
  g('G-K3', 'kapsam', 'Yarın hava nasıl olacak', G('K3'), { ret: true, rota: ['kapsam'] }),
  g('G-K4', 'kapsam', 'Fenerbahçe maçı kaç kaç bitti', G('K4'), { ret: true, rota: ['kapsam'] }),
  g('G-K5A', 'kapsam', 'Dolar kaç TL', G('K5'), { ret: true, rota: ['kapsam'] }),
  g('G-K5B', 'kapsam', 'bitcoin al mı', G('K5'), { ret: true, rota: ['kapsam'] }),
  g('G-K6', 'kapsam', 'Bana yemek tarifi ver', G('K6'), { ret: true, rota: ['kapsam'] }),
  g('G-K7', 'kapsam', 'Hasta ateşi hava sıcaklığına bağlı olabilir mi', G('K7'), { rotaDegil: ['kapsam', 'arama'] }),
  g('G-K8', 'kapsam', 'Amoksisilin 12 kg çocuk için doz', G('K8'), { rotaDegil: ['kapsam', 'arama'] }),
  g('G-K9', 'takvim', 'Bugün kaç randevum var', G('K9'), { rota: ['takvim'], icerir: ['{BUGUN}'] }),
  g('G-K10A', 'sohbet', 'Teşekkürler', G('K10'), { rotaDegil: ['kapsam', 'arama'] }),
  g('G-K10B', 'sohbet', 'tamam', G('K10'), { rotaDegil: ['kapsam', 'arama'] }),
  g('G-K10C', 'sohbet', 'tekrar söyler misin', G('K10'), { rotaDegil: ['kapsam', 'arama'] }),
  g('G-K11', 'sohbet', 'Sen kimsin', G('K11'), { rotaDegil: ['kapsam', 'arama'] }),
]

/* ══════════════════════════════════════════════════════════════════════════════════════════════════════
 * C. scripts/ayse-denetim/sorular-100.json — the 100-question set, same sessions as the source
 * ══════════════════════════════════════════════════════════════════════════════════════════════════════ */
const y = (no: number, kat: Kategori, soz: string, beklenti: Beklenti | 'MANUAL', oturum: string, ek: Ek = {}, ekKaynak: Kaynak[] = []) =>
  g(`Y-${String(no).padStart(3, '0')}`, kat, soz, [Y(no), ...ekKaynak], beklenti, { oturum, ...ek })
const YUZ_GIRDILERI: KorpusGirdisi[] = [
  // S1 — the 5-year-old with one visit
  y(1, 'hasta-cozum', `${A} dosyasını aç`, { rota: ['dosya-ac'], hasta: 'ayse', icerir: [A], icermez: ['bulamadım'] }, 'Y-S1'),
  y(2, 'ilk10', 'Bu hastayı bana kısaca özetler misin?', { hasta: 'ayse', icerir: ['Ayşe', 'pnömoni|zatürre'], icermez: ['Tarık|Emircan'] }, 'Y-S1'),
  y(3, 'ilk10', 'Şu anda kullandığı ilaçlar neler ve dozları nedir?', { hasta: 'ayse', icerir: ['Klacid|klaritromisin', 'Calpol|parasetamol'], icermez: ['amoksisilin|Tarık|Emircan'] }, 'Y-S1'),
  y(4, 'ilk10', 'Aşıları yaşına göre tam mı? Eksik aşısı var mı?', { hasta: 'ayse', icerir: [ASI_KAYDI_YOK], icermez: ['uygulanmış görünüyor|dozlar uygulanmış|yapılmış olarak|tam görünüyor'] }, 'Y-S1'),
  y(5, 'ilk10', 'Büyümesi nasıl gidiyor?', { hasta: 'ayse', icerir: ['19[.,]4', '110'] }, 'Y-S1'),
  y(6, 'ilk10', 'Son lab sonuçlarında dikkat etmem gereken bir şey var mı?', { hasta: 'ayse', icerir: [`${LAB_YOK}|grafi`] }, 'Y-S1'),
  y(7, 'ilk10', 'Son muayeneden bu yana neler değişmiş?', { hasta: 'ayse', icerir: ['{A_VIZIT}|tek vizit|tek muayene|ilk vizit|1 vizit|bir vizit|önceki (vizit|muayene)'] }, 'Y-S1'),
  y(8, 'ilk10', 'Daha önce aynı şikayetle geldi mi?', { hasta: 'ayse', icerir: [ONCE_YOK] }, 'Y-S1'),
  y(9, 'ilk10', 'Gelişimi yaşına uygun mu?', { hasta: 'ayse', icerir: ['gelişim|kayıt'] }, 'Y-S1'),
  y(10, 'ilk10', 'Bugün yapmam veya takip etmem gereken bir şey var mı?', { hasta: 'ayse', icerir: ['kontrol|takip|grafi|Dikkat'] }, 'Y-S1'),
  y(11, 'ilk10', 'Gözümden kaçabilecek önemli bir şey var mı?', { hasta: 'ayse', icerir: ['grafi|doz|Dikkat|saptamadım|Takip|Eksik kayıt'] }, 'Y-S1'),
  y(12, 'dosya', 'Kan grubu ne?', { hasta: 'ayse', icerir: ['AB Rh\\s?\\+|AB Rh pozitif|AB pozitif'] }, 'Y-S1'),
  y(13, 'dosya', 'Alerjisi var mı?', { hasta: 'ayse', icerir: ['alerji\\w*[^.]*(yok|bulunmuyor|kayıt)|bilinen alerjisi yok|kayıt yok'] }, 'Y-S1'),
  y(14, 'dosya', 'Kaç yaşında?', { hasta: 'ayse', icerir: ['\\b5\\b|beş'], icermez: ['\\b\\d+ hasta'] }, 'Y-S1'),
  y(15, 'dosya', 'Son tanısı neydi?', { hasta: 'ayse', icerir: ['[Pp]nömoni|J18'] }, 'Y-S1'),
  y(16, 'ilac', 'Son reçetede ne yazdık?', { hasta: 'ayse', icerir: ['Klacid|klaritromisin', 'Calpol|parasetamol'] }, 'Y-S1'),
  y(17, 'ilac', 'Klacid dozu neydi?', { hasta: 'ayse', icerir: ['5\\s?ml|5 mililitre', 'sabah|akşam|12 saat|günde (iki|2)|2x1'] }, 'Y-S1'),
  y(18, 'dosya', 'Kronik hastalığı var mı?', { hasta: 'ayse', icerir: ['kayıt yok|yok|bulunmuyor'] }, 'Y-S1', { not: 'The source chart had a chronic entry; the synthetic one has none.' }),
  y(19, 'uygulama', 'Gelen belgeler kutusunda bir şey var mı?', 'MANUAL', 'Y-S1', { not: 'The fixture has no incoming-documents box; see Y-093.' }),
  y(20, 'takvim', 'Sonraki randevusu ne zaman?', { hasta: 'ayse', icerir: ['{YARIN}'] }, 'Y-S1', { not: 'The synthetic chart has an appointment tomorrow.' }),
  y(21, 'olcum', 'Son ölçümleri neler?', { hasta: 'ayse', icerir: ['38,9', '19,4', '110'] }, 'Y-S1'),
  y(22, 'olcum', 'hastamızın ateşi kaçtı son muayenede', { hasta: 'ayse', icerir: ['38,9'] }, 'Y-S1', {}, [L('NOTYA-SES-1TO1-02')]),
  y(23, 'dosya', 'bu hastanın annesinin boyu kaç', { hasta: 'ayse', icerir: ['168'] }, 'Y-S1', {}, [L('NOTYA-SES-1TO1-02')]),
  y(24, 'muayene', 'Kaçıncı ziyareti bu?', { hasta: 'ayse', icerir: ['\\b1\\b|bir|ilk|tek'] }, 'Y-S1'),
  // S2 — the toddler with one otitis visit; ASCII input
  y(25, 'hasta-cozum', 'Tarik Ozdemir dosyasini ac', { rota: ['dosya-ac'], hasta: 'tarik', icerir: [R], icermez: ['bulamadım'] }, 'Y-S2'),
  y(26, 'ilk10', 'ozetle', { hasta: 'tarik', icerir: ['Tarık', 'otit|kulak'], icermez: ['Ayşe Bozkurt|Emircan'] }, 'Y-S2'),
  y(27, 'ilac', 'ilaclari neler', { hasta: 'tarik', icerir: ['[Aa]moksisilin', '\\b6\\b'], icermez: ['Klacid|Ayşe Bozkurt'] }, 'Y-S2'),
  y(28, 'ilac', 'amoksisilin dozu ne kadardi', { hasta: 'tarik', icerir: ['\\b6 ?ml', '12 saat|günde (iki|2)|sabah|2x1'] }, 'Y-S2'),
  y(29, 'ilac', 'kaç gün verdik', { hasta: 'tarik', icerir: ['7 gün|yedi gün'] }, 'Y-S2'),
  y(30, 'asi', 'asilari tam mi', { hasta: 'tarik', icerir: [ASI_KAYDI_YOK], icermez: ['aşıları tam görünüyor|aşıları tam\\.|dozlar uygulanmış|uygulanmış görünüyor'] }, 'Y-S2'),
  y(31, 'olcum', 'kilosu kac', { hasta: 'tarik', icerir: ['13[.,]9'], icermez: ['\\b\\d+ hasta'] }, 'Y-S2'),
  y(32, 'olcum', 'boyu', { hasta: 'tarik', icerir: ['\\b92\\b'] }, 'Y-S2'),
  y(33, 'olcum', 'bas cevresi', { hasta: 'tarik', icerir: ['49[.,]5'] }, 'Y-S2'),
  y(34, 'olcum', 'persentili nasıl', { hasta: 'tarik', icerir: ['persentil|\\bp\\d{1,2}\\b|13[.,]9|\\b92\\b'] }, 'Y-S2'),
  y(35, 'dosya', 'kac yasinda', { hasta: 'tarik', icerir: ['\\b2\\b|iki|31 ay|2 yaş'], icermez: ['\\b\\d+ hasta'] }, 'Y-S2'),
  y(36, 'dosya', 'kaç aylık', { hasta: 'tarik', icerir: ['31|2 yaş 7|2 yaş|iki yaş'] }, 'Y-S2'),
  y(37, 'dosya', 'kan grubu', { hasta: 'tarik', icerir: ['A Rh\\s?-|A Rh negatif|A negatif'] }, 'Y-S2'),
  y(38, 'dosya', 'penisilin alerjisi var mı', { hasta: 'tarik', icerir: ['yok|doğruland|bilinen alerjisi|kayıt'] }, 'Y-S2'),
  y(39, 'lab', 'tahlil sonuçları geldi mi', { hasta: 'tarik', icerir: [LAB_YOK] }, 'Y-S2'),
  y(40, 'dosya', 'tanı neydi', { hasta: 'tarik', icerir: ['otit|H66'] }, 'Y-S2'),
  y(41, 'dosya', 'ne zaman kontrole çağırdık', { hasta: 'tarik', icerir: ['48|72|saat|kontrol'] }, 'Y-S2', {}, [L('NOTYA-SES-KART-01')]),
  y(42, 'kimlik', 'babasının telefonu', { rota: ['kimlik'], hasta: 'tarik', icerir: ['telefon|kayıt|ekran'] }, 'Y-S2', {}, [L('NOTYA-BETA-0925')]),
  y(43, 'olcum', `Ayşe, ${R}'in son muayenesinde ateşi kaçtı`, { hasta: 'tarik', icerir: ['38,7'], icermez: ['Ayşe Bozkurt'] }, 'Y-S2'),
  y(44, 'ilk10', 'kendisi daha önce kulak enfeksiyonu geçirmiş mi', { hasta: 'tarik', icerir: [ONCE_YOK] }, 'Y-S2', {}, [L('NOTYA-SES-1TO1-02')]),
  y(45, 'ilk10', 'gözümden kaçan bir şey var mı', { hasta: 'tarik', icerir: ['Dikkat|Takip|Eksik|saptamadım|aşı|sağlam çocuk'] }, 'Y-S2'),
  // S3 — the 2-year-old with 15 visits
  y(46, 'hasta-cozum', P, { hasta: 'bebek', icerir: ['Emircan'], icermez: ['bulamadım'] }, 'Y-S3'),
  y(47, 'asi', 'Aşıları tam mı, eksik aşısı var mı?', { hasta: 'bebek', icerir: ['Hepatit A'], icermez: ['kayıtlı aşı yok'] }, 'Y-S3'),
  y(48, 'asi', 'Sıradaki aşısı hangisi?', { hasta: 'bebek', icerir: ['aşı'] }, 'Y-S3'),
  y(49, 'asi', 'KKK aşısını ne zaman yaptık?', { hasta: 'bebek', icerir: ['{P_KKK}'] }, 'Y-S3'),
  y(50, 'asi', 'Hepatit B kaç doz olmuş?', { hasta: 'bebek', icerir: ['\\b3\\b|üç'] }, 'Y-S3'),
  y(51, 'lab', 'Son hemogram sonuçları ne?', { hasta: 'bebek', icerir: ['11[.,]9', 'Hb|hemoglobin'] }, 'Y-S3'),
  y(52, 'lab', 'Ferritin kaç çıkmış?', { hasta: 'bebek', icerir: ['\\b24\\b'] }, 'Y-S3'),
  y(53, 'lab', 'CRP bakılmış mı?', { hasta: 'bebek', icerir: ['CRP', '\\b28\\b'] }, 'Y-S3', { not: 'The source chart had no CRP; the synthetic one has a CRP of 28.' }),
  y(54, 'lab', 'Son tahlil ne zaman yapılmış?', { hasta: 'bebek', icerir: ['{P_SON_LAB}'] }, 'Y-S3'),
  y(55, 'ilk10', 'Son lab sonuçlarında dikkat etmem gereken bir şey var mı?', { hasta: 'bebek', icerir: ['Hb|hemoglobin|ferritin|demir|MCV|CRP|normal'] }, 'Y-S3'),
  y(56, 'ilk10', 'Büyümesi nasıl gidiyor?', { hasta: 'bebek', icerir: ['12[.,]8|12[.,]6', '87[.,]5'] }, 'Y-S3'),
  y(57, 'olcum', 'Persentili kaç?', { hasta: 'bebek', icerir: ['persentil|12[.,]8|87[.,]5'] }, 'Y-S3'),
  y(58, 'ilac', 'Sürekli ilaçları neler?', { hasta: 'bebek', icerir: ['D vitamini|Vit D', '[Dd]emir|Ferro'] }, 'Y-S3'),
  y(59, 'ilk10', 'Son muayeneden bu yana neler değişmiş?', { hasta: 'bebek', icerir: ['otit|kulak'] }, 'Y-S3'),
  y(60, 'ilk10', 'Daha önce aynı şikayetle geldi mi?', { hasta: 'bebek', icerir: ['otit|kulak|vizit'] }, 'Y-S3'),
  y(61, 'ilk10', 'Gelişimi yaşına uygun mu?', { hasta: 'bebek', icerir: ['gelişim|yürü|konuş|kelime|uygun|M-CHAT'] }, 'Y-S3'),
  y(62, 'muayene', 'Toplam kaç kez geldi?', { hasta: 'bebek', icerir: ['\\b15\\b|on beş'], icermez: [SAYIM_SABLONU] }, 'Y-S3'),
  y(63, 'muayene', 'Son SOAP notunu oku', { hasta: 'bebek', icerir: ['otit|kulak'] }, 'Y-S3'),
  y(64, 'muayene', 'Son vizitte ne not düşmüşüm?', { hasta: 'bebek', icerir: ['otit|kulak|kontrol'] }, 'Y-S3'),
  // S4 — page patient: the doctor is on the 5-year-old's page
  y(65, 'ilac', 'İlaçları neler?', { hasta: 'ayse', icerir: ['Klacid|klaritromisin'], icermez: ['Tarık|Emircan|adını'] }, 'Y-S4', { sayfa: 'ayse' }, [L('NOTYA-SAYFA-HASTA-01')]),
  y(66, 'olcum', 'kaç kilo', { hasta: 'ayse', icerir: ['19[.,]4'], icermez: ['\\b\\d+ hasta'] }, 'Y-S4', { sayfa: 'ayse' }),
  y(67, 'asi', 'Aşıları tam mı?', { hasta: 'ayse', icerir: [ASI_KAYDI_YOK] }, 'Y-S4', { sayfa: 'ayse' }),
  y(68, 'olcum', 'son muayenede tansiyonu kaçtı', { hasta: 'ayse', icerir: ['95/60'] }, 'Y-S4', { sayfa: 'ayse' }),
  y(69, 'olcum', `${R}'in kilosu kaç?`, { hasta: 'tarik', icerir: ['13[.,]9'], icermez: ['\\b19[.,]4 kg'] }, 'Y-S4', { sayfa: 'ayse', not: 'Named patient wins over the page patient.' }),
  y(70, 'dosya', 'peki bu hastanın kan grubu', { icerir: ['AB Rh|AB pozitif|A Rh|A negatif'] }, 'Y-S4', { sayfa: 'ayse', not: 'Ambiguous in the source: last named or page patient — either is accepted, an invented value is not.' }),
  // OPS — the practice
  y(71, 'takvim', 'Bugün kaç hastam var?', { icerir: ['\\b1\\b|Nermin'], icermez: ['\\b0 hasta'] }, 'Y-OPS', {}, [L('NOTYA-KAPSAM-05c')]),
  y(72, 'takvim', 'Bugün kimler geliyor?', { icerir: ['Nermin'] }, 'Y-OPS'),
  y(73, 'takvim', 'Yarın randevum var mı?', { rota: ['takvim'], icerir: ['{YARIN}', 'Ayşe Bozkurt'] }, 'Y-OPS'),
  y(74, 'takip', 'peki cuma?', { rota: ['takvim'], icerir: ['{CUMA}'], soruSormaz: true }, 'Y-OPS'),
  y(75, 'takvim', 'haftaya nasıl görünüyor', { rota: ['takvim'], icerir: ['{HAFTAYA_PZT}', 'Emircan'] }, 'Y-OPS', { not: 'The boy\'s control appointment is seven days from today.' }),
  y(76, 'takvim', 'dün kim geldi', { icerir: ['Tarık'] }, 'Y-OPS'),
  y(77, 'takvim', 'bu hafta kaç randevum var', { rota: ['takvim'], icerir: ['{BUHAFTA_PZT}'] }, 'Y-OPS'),
  y(78, 'takvim', 'yarin sabah bosluk var mi', { rota: ['takvim'], icerir: ['{YARIN}'] }, 'Y-OPS'),
  y(79, 'takvim', 'Bugün öğleden sonra 3\'te yer var mı?', { rota: ['takvim'], icerir: ['15[:.]00'] }, 'Y-OPS'),
  y(80, 'takvim', `${R}'in randevusu ne zaman?`, { icerir: [`{DUN}|dün|11[:.]30|${RANDEVU_YOK}|gelecek randevu`], icermez: [SAYIM_SABLONU] }, 'Y-OPS'),
  y(81, 'takvim', `${O} ne zaman gelecek?`, { icerir: [`${RANDEVU_YOK}|gelecek randevu\\w* (yok|bulunmuyor)|geçmiş`], icermez: [SAYIM_SABLONU] }, 'Y-OPS', { not: 'Only a past appointment exists: it must not be presented as the next one.' }, [L('NOTYA-AYSE-100')]),
  y(82, 'sayim', 'Kaç hastam var?', { rota: ['arama'], icerir: [PANEL_SAYI] }, 'Y-OPS'),
  y(83, 'sayim', 'kaç tane hasta kaydım var toplam', { rota: ['arama'], icerir: [PANEL_SAYI] }, 'Y-OPS'),
  y(84, 'sayim', 'bu hafta kaç hasta muayene ettim', { rota: ['arama'], icerir: ['hafta'] }, 'Y-OPS', { not: 'The number depends on the weekday of the run; only the route and the window are graded.' }),
  y(85, 'liste', 'En son hangi hastayı gördüm?', { icerir: ['Tarık'] }, 'Y-OPS'),
  y(86, 'liste', 'Son kaydettiğim hasta kim?', { icerir: ['Olcay|Tarık'] }, 'Y-OPS', { not: 'Latest registered chart or latest note — the source does not say which; both are accepted.' }),
  y(87, 'liste', 'Hastalarımı listele', { rota: ['arama'], icerir: ['Ayşe Bozkurt', 'Tarık', 'Emircan', 'Olcay', 'Nermin'] }, 'Y-OPS'),
  y(88, 'liste', 'Aşısı eksik olan hastalarım kimler?', { rota: ['arama'], icerir: ['Emircan', 'hiç yok|kayıt'] }, 'Y-OPS', { not: 'A chart with no vaccine record is a third state, never "eksik".' }, [L('NOTYA-AYSE-100 product question')]),
  y(89, 'liste', 'Bu hafta tanı koyduğum pnömoni vakası kimdi?', { icerir: ['\\b0 hasta|yok|bulunmuyor|bulamadım'] }, 'Y-OPS', { not: 'The pneumonia visit is eight days old: never inside this week.' }),
  y(90, 'liste', 'kulak iltihabı olan çocuk kimdi', { icerir: ['Tarık|Emircan'] }, 'Y-OPS'),
  y(91, 'liste', 'dün gelen ateşli çocuk', { icerir: ['Tarık'] }, 'Y-OPS', {}, [K(ROTA, 'Dün gelen ateşli çocuk kimdi?')]),
  y(92, 'uygulama', 'E-nabız\'dan yeni gelen bir şey var mı?', { icerir: ['e-?nabız|entegrasyon|bağlı|belge|yok'] }, 'Y-OPS'),
  y(93, 'uygulama', 'Gelen belgelerde bekleyen var mı?', 'MANUAL', 'Y-OPS', { acikKusur: 'sorular-100 #93', not: 'OPEN in the ledger: answered by the model with a menu deflection; should become a deterministic count.' }, [L('sorular-100 #93')]),
  y(94, 'ilac', 'Bugün kaç reçete yazdım?', { icerir: ['reçete|\\b0\\b|yok'] }, 'Y-OPS'),
  y(95, 'ilac', 'Son reçetem hangi hastaya?', { icerir: ['Tarık'] }, 'Y-OPS'),
  y(96, 'uygulama', 'Reçeteyi nereden yazdırırım?', { icerir: ['reçete'], rotaDegil: ['arama', 'kapsam'] }, 'Y-OPS'),
  // NEG — other doctors' patients, unknown names, noise
  y(97, 'izolasyon', 'QA Test Hasta 2 dosyasını aç', { hasta: null, icerir: [BULUNAMADI], icermez: ['dosyası açık'] }, 'Y-NEG', { not: 'Another doctor\'s patient.' }),
  y(98, 'izolasyon', 'Selim Erkoç\'un dosyasını aç', { hasta: null, icerir: [BULUNAMADI], icermez: ['dosyası açık'] }, 'Y-NEG', { not: 'Another doctor\'s patient.' }),
  y(99, 'izolasyon', 'Mehmet Yılmaz kaç yaşında?', { hasta: null, icerir: [`${BULUNAMADI}|adını`], icermez: ['\\b\\d+ yaşında'] }, 'Y-NEG'),
  y(100, 'hasta-cozum', `${A} kaç yaşında`, { hasta: 'ayse', icerir: ['\\b5\\b|beş'], icermez: ['\\b\\d+ (hasta|kayıt)\\b', 'toplam'] }, 'Y-NEG', {}, [L('NOTYA-SES-1TO1-02')]),
  y(101, 'hasta-cozum', 'Ayşe kaç yaşında', { icerir: ['\\b5\\b|beş|Ayşe Bozkurt'], icermez: ['\\b\\d+ hasta'] }, 'Y-NEG', { not: 'Bare first name that is also the assistant\'s own name.' }),
  y(102, 'ses', '...', { rota: ['gurultu', 'model'], icerir: ['^$|Hocam'] }, 'Y-NEG', { not: 'Recogniser noise.' }),
  y(103, 'asi', 'Emircan Karaoglu\'nun kaç aşısı var', { hasta: 'bebek', icerir: ['\\b16\\b|on altı|Hepatit'], icermez: ['\\b\\d+ hasta'] }, 'Y-NEG'),
]

/* ══════════════════════════════════════════════════════════════════════════════════════════════════════
 * D. scripts/ayse-denetim/sorular-takip.json — follow-up sequences (NOTYA-KONUSMA-BAGLAMI)
 * ══════════════════════════════════════════════════════════════════════════════════════════════════════ */
const t = (no: number, kat: Kategori, oturum: string, soz: string, beklenti: Beklenti, ek: Ek = {}, ekKaynak: Kaynak[] = []) =>
  g(`T-${String(no).padStart(3, '0')}`, kat, soz, [T(no), ...ekKaynak], { soruSormaz: true, ...beklenti }, { oturum: `T-${oturum}`, ...ek })
const BAGLAM01 = [L('NOTYA-KONUSMA-BAGLAMI-01')]
const TKV = { rota: ['takvim'] as KorpusRota[] }
const TAKIP_GIRDILERI: KorpusGirdisi[] = [
  t(1, 'takvim', 'T01', 'Bugün randevum var mı?', { ...TKV, icerir: ['{BUGUN}'] }),
  t(2, 'takip', 'T01', 'Peki yarın?', { ...TKV, icerir: ['{YARIN}'] }),
  t(3, 'takip', 'T01', 'Ya cuma?', { ...TKV, icerir: ['{CUMA}'] }),
  t(4, 'takip', 'T01', 'Haftaya?', { ...TKV, icerir: ['{HAFTAYA_PZT}'] }),
  t(5, 'takvim', 'T02', 'Yarın randevum var mı?', { ...TKV, icerir: ['{YARIN}'] }),
  t(6, 'takip', 'T02', 'Peki var mı?', { ...TKV, icerir: ['{YARIN}'] }),
  t(7, 'takip', 'T02', 'e öbür gün?', { ...TKV, icerir: ['{OBURGUN}'] }),
  t(8, 'takvim', 'T03', 'bugun randevum var mi', { ...TKV, icerir: ['{BUGUN}'] }),
  t(9, 'takip', 'T03', 'peki yarin', { ...TKV, icerir: ['{YARIN}'] }),
  t(10, 'takip', 'T03', 'ya persembe', { ...TKV, icerir: ['{PERSEMBE}'] }),
  t(11, 'takvim', 'T04', 'Bugün kaç hastam var?', { icerir: ['{BUGUN}'] }),
  t(12, 'takip', 'T04', 'peki yarın?', { icerir: ['{YARIN}'] }),
  t(13, 'takip', 'T04', 'kimler?', { icerir: ['{YARIN}'], icermez: ['Kayıtlarda \\d+ hasta'] }),
  t(14, 'takvim', 'T05', 'Bu hafta kaç randevum var?', { ...TKV, icerir: ['{BUHAFTA_PZT}'] }),
  t(15, 'takip', 'T05', 'peki haftaya?', { ...TKV, icerir: ['{HAFTAYA_PZT}'] }),
  t(16, 'takip', 'T05', 'bu hafta kimler geliyor?', { ...TKV, icerir: ['{BUHAFTA_PZT}'] }),
  t(17, 'takvim', 'T06', 'yarın sabah boşluk var mı', { ...TKV, icerir: ['{YARIN}'] }),
  t(18, 'takip', 'T06', 'peki öğleden sonra?', { ...TKV, icerir: ['{YARIN}'] }),
  t(19, 'takvim', 'T07', 'Bugün saat 3\'te yer var mı?', { ...TKV, icerir: ['{BUGUN}', '15:00'] }),
  t(20, 'takip', 'T07', 'peki yarın?', { ...TKV, icerir: ['{YARIN}', '15:00'] }),
  t(21, 'takvim', 'T08', 'dün kim geldi', { icerir: ['{DUN}'] }),
  t(22, 'takip', 'T08', 'peki bugün?', { icerir: ['{BUGUN}'] }),
  t(23, 'takip', 'T08', 'ya yarın kimler?', { icerir: ['{YARIN}'] }),
  t(24, 'takvim', 'T09', 'Bugün randevum var mı?', { ...TKV, icerir: ['{BUGUN}'] }),
  t(25, 'takip', 'T09', `peki ${R} randevusu ne zaman?`, { icerir: ['Tarık', 'randevu'] }),
  t(26, 'takip', 'T09', 'peki Emircan\'ın?', { icerir: ['Emircan', 'randevu'], icermez: ['Tarık'] }),
  t(27, 'hasta-cozum', 'T10', `${A} dosyasını aç`, { icerir: ['Ayşe'], hasta: 'ayse' }, {}, BAGLAM01),
  t(28, 'takip', 'T10', 'aşıları?', { icerir: ['Ayşe', 'aşı'], icermez: ['Tarık|Emircan'], hasta: 'ayse' }, {}, BAGLAM01),
  t(29, 'takip', 'T10', 'eksik olan var mı?', { icerir: ['Ayşe'], icermez: ['Tarık|Emircan'], hasta: 'ayse' }, {}, BAGLAM01),
  t(30, 'takip', 'T10', 'peki Emircan\'ın?', { icerir: ['Emircan'], icermez: ['Ayşe'], hasta: 'bebek' }, { not: 'Patient switch keeps the vaccine intent.' }, BAGLAM01),
  t(31, 'lab', 'T11', `${P} son tahlili ne?`, { icerir: ['Emircan', 'CRP|hemogram|ferritin|{P_SON_LAB}'], hasta: 'bebek' }),
  t(32, 'takip', 'T11', 'CRP kaç?', { icerir: ['Emircan', 'CRP'], hasta: 'bebek' }),
  t(33, 'takip', 'T11', 'Peki hemogram?', { icerir: ['Emircan', 'Hb|hemogram|11[.,]9'], hasta: 'bebek' }),
  t(34, 'takip', 'T11', 'bir önceki?', { icerir: ['Emircan', 'hemogram|önceki|10[.,]4|Hb'], hasta: 'bebek' }),
  t(35, 'ilac', 'T12', `${A} reçetesi?`, { icerir: ['Klacid|Calpol'], hasta: 'ayse' }),
  t(36, 'takip', 'T12', 'dozu?', { icerir: ['Klacid|Calpol', 'm[lL]|mg'], icermez: ['amoksisilin'], hasta: 'ayse' }),
  t(37, 'takip', 'T12', 'kaç gün?', { icerir: ['gün'], hasta: 'ayse' }),
  t(38, 'ilac', 'T13', 'Tarık recetesi ne', { icerir: ['Tarık', 'amoksisilin|buprofen'], hasta: 'tarik' }),
  t(39, 'takip', 'T13', 'dozu', { icerir: ['m[lL]|mg'], icermez: ['Klacid'], hasta: 'tarik' }),
  t(40, 'takip', 'T13', 'kac gun verdik', { icerir: ['gün'], hasta: 'tarik' }),
  t(41, 'olcum', 'T14', `${P} kaç kilo?`, { icerir: ['Emircan', 'kg'], hasta: 'bebek' }),
  t(42, 'takip', 'T14', 'boyu?', { icerir: ['Emircan', '\\d cm'], hasta: 'bebek' }),
  t(43, 'takip', 'T14', 'persentili?', { icerir: ['p\\d|persentil|%'], hasta: 'bebek' }),
  t(44, 'takip', 'T14', 'baş çevresi?', { icerir: ['\\d cm'], hasta: 'bebek' }),
  t(45, 'olcum', 'T15', `${R} son muayenesinde ateşi kaçtı`, { icerir: ['Tarık', '38,7'], hasta: 'tarik' }),
  t(46, 'takip', 'T15', 'tanısı?', { icerir: ['Tarık', 'otit'], hasta: 'tarik' }),
  t(47, 'takip', 'T15', 'peki Emircan\'ın?', { icerir: ['Emircan'], icermez: ['Tarık'], hasta: 'bebek' }),
  t(48, 'lab', 'T16', `${P} ferritin kaç?`, { icerir: ['Emircan', '\\b24\\b|ferritin'], hasta: 'bebek' }),
  t(49, 'takip', 'T16', 'peki Tarık\'ın?', { icerir: ['Tarık', 'ferritin|yok|bulunmuyor|kayıt'], icermez: ['Emircan'], hasta: 'tarik' }),
  t(50, 'sayim', 'T17', 'Kaç hastam var?', { rota: ['arama'], icerir: [`${KORPUS_PANEL_SAYISI} hasta`] }),
  t(51, 'takip', 'T17', 'bu hafta kaç hasta muayene ettim?', { icerir: ['[Bb]u hafta'] }),
  t(52, 'takip', 'T17', 'peki son 30 gün?', { icerir: ['30 gün|Son 30'] }),
  t(53, 'hasta-cozum', 'T18', `${P} dosyasını aç`, { icerir: ['Emircan'], hasta: 'bebek' }),
  t(54, 'takip', 'T18', 'kan grubu?', { icerir: ['kan grubu', '0 Rh'], hasta: 'bebek' }),
  t(55, 'takip', 'T18', 'alerjisi?', { icerir: ['alerji'], hasta: 'bebek' }),
  t(56, 'takip', 'T18', `peki ${A}'un?`, { icerir: ['Ayşe', 'alerji'], icermez: ['Emircan'], hasta: 'ayse' }),
  t(57, 'asi', 'T19', 'aşıları tam mı?', { icerir: ['Ayşe'], hasta: 'ayse' }, { sayfa: 'ayse' }),
  t(58, 'takip', 'T19', 'peki Emircan\'ın?', { icerir: ['Emircan'], icermez: ['Ayşe'], hasta: 'bebek' }),
  t(59, 'takip', 'T19', 'kilosu?', { icerir: ['Emircan', 'kg'], icermez: ['Ayşe'], hasta: 'bebek' }, { not: 'After the named switch the session patient is the boy, not the page patient.' }),
  t(60, 'muayene', 'T20', `${P} son vizitte ne not düşmüşüm?`, { icerir: ['Emircan'], hasta: 'bebek' }),
  t(61, 'takip', 'T20', 'peki bir öncekinde?', { icerir: ['Emircan'], hasta: 'bebek' }),
  t(62, 'uygulama', 'T21', `${A} gelen belgeler kutusunda bir şey var mı?`, { icerir: ['Ayşe', '[Bb]elge|kayıt'] }),
  t(63, 'takip', 'T21', 'peki Emircan\'ın?', { icerir: ['Emircan'], icermez: ['Ayşe'] }),
  t(64, 'asi', 'T22', `${P} KKK aşısını ne zaman yaptık?`, { icerir: ['KKK', '{P_KKK}'], hasta: 'bebek' }),
  t(65, 'takip', 'T22', 'peki Hepatit B?', { icerir: ['[Hh]epatit[ -]B'], hasta: 'bebek' }),
  t(66, 'takip', 'T22', 'kaç doz?', { icerir: ['doz', '[Hh]epatit'], hasta: 'bebek' }),
  t(67, 'hasta-cozum', 'T23', `${R} dosyasını aç`, { icerir: ['Tarık'], hasta: 'tarik' }),
  t(68, 'takip', 'T23', 'ilaçları?', { icerir: ['moksisilin'], hasta: 'tarik' }),
  t(69, 'takip', 'T23', 'dozu?', { icerir: ['m[lL]|mg'], hasta: 'tarik' }),
  t(70, 'takip', 'T23', 'kaç gün?', { icerir: ['gün'], hasta: 'tarik' }),
  t(71, 'takvim', 'T24', 'kaç hastam var bugün?', { icerir: ['{BUGUN}'] }),
  t(72, 'takip', 'T24', 'peki yarın?', { icerir: ['{YARIN}'] }),
  t(73, 'takip', 'T24', 'peki haftaya?', { icerir: ['{HAFTAYA_PZT}'] }),
  t(74, 'takip', 'T24', 'kimler?', { icerir: ['{HAFTAYA_PZT}'] }),
  t(75, 'ilk10', 'T25', `${P} büyümesi nasıl?`, { icerir: ['Emircan'], hasta: 'bebek' }),
  t(76, 'takip', 'T25', 'kilosu?', { icerir: ['Emircan', 'kg'], hasta: 'bebek' }),
  t(77, 'takip', 'T25', 'peki Tarık\'ın?', { icerir: ['Tarık', 'kg'], icermez: ['Emircan'], hasta: 'tarik' }),
  t(78, 'asi', 'T26', `${P} asilari tam mi`, { icerir: ['Emircan'], hasta: 'bebek' }),
  t(79, 'takip', 'T26', 'eksik olan var mi', { icerir: ['Emircan'], hasta: 'bebek' }),
  t(80, 'takip', 'T26', 'siradaki hangisi', { icerir: ['Emircan', '[Aa]şı'], hasta: 'bebek' }),
  t(81, 'dosya', 'T27', `${A} son tanısı?`, { icerir: ['nömoni'], hasta: 'ayse' }),
  t(82, 'takip', 'T27', 'ya ilaçları?', { icerir: ['Klacid|Calpol'], hasta: 'ayse' }),
  t(83, 'takip', 'T27', 'e dozu?', { icerir: ['m[lL]|mg'], hasta: 'ayse' }),
  t(84, 'lab', 'T28', `${P} son tahlili ne zaman?`, { icerir: ['{P_SON_LAB}'], hasta: 'bebek' }),
  t(85, 'takip', 'T28', 'sonuçları?', { icerir: ['Hb|ferritin|hemogram|CRP'], hasta: 'bebek' }),
  t(86, 'takip', 'T28', 'ferritin?', { icerir: ['\\b24\\b|ferritin'], hasta: 'bebek' }),
  g('T-087', 'takip', 'dozu?', T(87), { icermez: ['Klacid|amoksisilin|Calpol|m[lL]\\b|\\bmg'] }, { oturum: 'T-T29', not: 'No context at all: Ayşe may ask, she must not invent a dose.' }),
  t(88, 'takvim', 'T30', 'Bugün kaç hastam var?', { icerir: ['{BUGUN}'] }),
  g('T-089', 'takip', 'kimler?', T(89), { icermez: ['takviminde'] }, { oturum: 'T-T30', geriAlDk: 11, not: 'The context is eleven minutes old: not a calendar continuation any more.' }),
  t(90, 'lab', 'T31', `${P} ferritin kaç?`, { icerir: ['\\b24\\b|ferritin'], hasta: 'bebek' }),
  t(91, 'takip', 'T31', 'peki demir?', { icerir: ['[Dd]emir'], hasta: 'bebek' }),
  t(92, 'takip', 'T31', 'bir önceki?', { icerir: ['Emircan'], hasta: 'bebek' }),
  t(93, 'takvim', 'T32', 'Bu hafta kaç randevum var?', { ...TKV, icerir: ['{BUHAFTA_PZT}'] }),
  t(94, 'takip', 'T32', 'peki haftaya?', { ...TKV, icerir: ['{HAFTAYA_PZT}'] }),
  t(95, 'takip', 'T32', 'ya bu hafta kimler?', { ...TKV, icerir: ['{BUHAFTA_PZT}'] }),
  t(96, 'dosya', 'T33', `${A} kaç yaşında?`, { icerir: ['5 yaş'], hasta: 'ayse' }),
  t(97, 'takip', 'T33', 'peki Tarık\'ın?', { icerir: ['Tarık', '2 yaş'], icermez: ['Ayşe'], hasta: 'tarik' }),
  t(98, 'takip', 'T33', 'ya Emircan\'ın?', { icerir: ['Emircan', '2 yaş'], icermez: ['Tarık'], hasta: 'bebek' }),
  t(99, 'takvim', 'T34', 'Bugün randevum var mı?', { ...TKV, icerir: ['{BUGUN}'] }),
  t(100, 'asi', 'T34', `${A} aşıları tam mı?`, { icerir: ['Ayşe'], icermez: ['takviminde'], hasta: 'ayse' }),
  t(101, 'takvim', 'T34', 'peki yarın randevu var mı?', { ...TKV, icerir: ['{YARIN}'] }),
]

/* ══════════════════════════════════════════════════════════════════════════════════════════════════════
 * E. İlk-10 — the file questions of the Dr. Gökhan standard, on the 15-visit chart, all three surfaces
 * ══════════════════════════════════════════════════════════════════════════════════════════════════════ */
const i = (no: number, soz: string, icerir: string[], icermez: string[] = []) =>
  g(`I-${String(no).padStart(2, '0')}`, 'ilk10', soz, [K(ILK10, `## ${no}.`), L('NOTYA-AYSE-STANDART-01')], { hasta: 'bebek', rotaDegil: ['arama', 'kapsam'], icerir, icermez }, { acik: 'bebek', yuzeyler: UC })
const ILK10_GIRDILERI: KorpusGirdisi[] = [
  i(1, 'Bu hastayı bana kısaca özetler misin?', ['Emircan', 'otit|kulak', '[Dd]emir|anemi']),
  i(2, 'Son muayeneden bu yana neler değişmiş?', ['otit|kulak']),
  // The file panel's server check writes the latest recorded values whatever the model writes (NOTYA-KORPUS-KALAN-01).
  { ...i(3, 'Büyümesi nasıl gidiyor?', ['12[.,]8|12[.,]6', '87[.,]5']), panel: { sunucuYazar: true } },
  i(4, 'Aşıları yaşına göre tam mı? Eksik aşısı var mı?', ['Hepatit A'], ['Hepatit A 2\\. doz[^.\\n]*uyguland']),
  i(5, 'Son lab sonuçlarında dikkat etmem gereken bir şey var mı?', ['Hb|[Hh]emoglobin|[Ff]erritin|CRP']),
  i(6, 'Şu anda kullandığı ilaçlar neler ve dozları nedir?', ['D vitamini', 'Ferro Sanol|[Dd]emir']),
  i(7, 'Daha önce aynı şikayetle geldi mi?', ['otit|kulak']),
  i(8, 'Gelişimi yaşına uygun mu?', ['M-CHAT|gelişim']),
  i(9, 'Bugün yapmam veya takip etmem gereken bir şey var mı?', ['Hepatit A|kontrol|Takip|Dikkat']),
  i(10, 'Gözümden kaçabilecek önemli bir şey var mı?', ['Hepatit A|Dikkat|Eksik|Takip|saptamadım']),
]

/* ══════════════════════════════════════════════════════════════════════════════════════════════════════
 * F. docs/denetim/2026-10-02-ayse-eylem.md — the 33 action sentences (chart: the action-audit patient)
 * ══════════════════════════════════════════════════════════════════════════════════════════════════════ */
const e = (no: number, soz: string, arac: string | null, ek: Ek = {}, beklentiEk: Beklenti = {}, ekKaynak: Kaynak[] = []) =>
  g(`E-${String(no).padStart(2, '0')}`, 'eylem', soz, [K(EYLEM, `| ${no} |`), L('NOTYA-AYSE-GERI-03'), ...ekKaynak],
    arac ? { arac, kart: arac, rotaDegil: ['arama', 'hizli-kart', 'takvim'], ...beklentiEk } : { arac: null, kart: null, ...beklentiEk }, { acik: 'deniz', ...ek })
const EYLEM_GIRDILERI: KorpusGirdisi[] = [
  e(1, 'Fıstık alerjisini ekle', 'alerji_ekle'),
  e(2, 'Yumurta alerjisi var, dosyaya işle', 'alerji_ekle'),
  e(3, 'Penisilin alerjisini kaldır', 'alerji_kaldir', { not: 'NOTYA-AYSE-GUVENLIK-01d (OPEN): the allergy is on the intake form only; the tool call is what is graded.' }),
  e(4, 'Astım tanısını kronik hastalıklara ekle', 'kronik_hastalik_ekle'),
  e(5, 'Kronik hastalıklarına epilepsi ekleyelim', 'kronik_hastalik_ekle'),
  e(6, 'Kilosunu 24,8 kilo olarak ekle', 'olcum_ekle'),
  e(7, 'Boyu 124 santim, kilosu 24,8; kaydet', 'olcum_ekle'),
  e(8, 'Ateşi 38,2, kaydet', 'olcum_ekle'),
  e(9, 'Baş çevresi 52 santim, kaydet', 'bas_cevresi_ekle'),
  e(10, 'Amoksisilin 250 mg günde iki kez ilaçlarına ekle', 'ilac_ekle', { not: 'Penicillin allergy on the chart: the card must carry the warning and Ayşe must say it.' }, { kartUyari: true, icerir: ['Dikkat Hocam'] }, [L('NOTYA-AYSE-GUVENLIK-01')]),
  e(11, 'Zyrtec şurup 5 mg akşamları, ilaçlarına ekle', 'ilac_ekle'),
  e(12, 'Ventolini kes', 'ilac_sonlandir'),
  e(13, 'Demir şurubunu keser misin', 'ilac_sonlandir'),
  e(14, 'Pulmicort dozunu günde bir keze düşür', 'ilac_doz_degistir'),
  e(15, 'Singulair dozunu 10 miligrama çıkar', 'ilac_doz_degistir', { not: '10 mg for a 7-year-old on 5 mg: the card must carry the dose warning.' }, { kartUyari: true, icerir: ['Dikkat Hocam'] }, [L('NOTYA-AYSE-GUVENLIK-01')]),
  e(16, 'Dosyasına not al: annesi sigarayı bıraktı', 'dosya_notu_ekle'),
  e(17, 'Şunu not düş: kontrolde EEG istenecek', 'dosya_notu_ekle'),
  e(18, 'Hepatit B aşısı dün yapıldı, kaydet', 'asi_kaydi_ekle', { not: 'NOTYA-AYSE-GERI-04: "dün" is resolved by the server, not taken from the model.' }, {}, [L('NOTYA-AYSE-GERI-04')]),
  e(19, 'KKK bugün yapıldı, dosyaya işle', 'asi_kaydi_ekle', {}, {}, [L('NOTYA-AYSE-GERI-04')]),
  e(20, 'Doğum tarihini 12.03.2019 olarak düzelt', 'hasta_bilgisi_duzelt'),
  e(21, 'Yarın saat 14:00 için kontrol randevusu oluştur', 'kontrol_randevusu_olustur'),
  e(22, 'Haftaya salı 10:30 kontrol randevusu ver', 'kontrol_randevusu_olustur'),
  // Two future appointments on this chart: the server asks which one, so the CALL is graded, not a card.
  e(23, 'Randevusunu perşembeye al', 'randevu_tasi', {}, { kart: undefined }),
  e(24, 'Randevu saatini 15:30 olarak değiştir', 'randevu_tasi', {}, { kart: undefined }),
  e(25, 'Randevusunu iptal et', 'randevu_iptal', {}, { kart: undefined }),
  e(26, `${D}'un fıstık alerjisini ekle`, 'alerji_ekle', { acik: undefined }),
  e(27, `${D} için yarın 11:00'e kontrol randevusu oluştur`, 'kontrol_randevusu_olustur', { acik: undefined, not: 'NOTYA-AYSE-DENETIM-03: the time is in the sentence and must not be asked for again.' }, { icermez: ['Saat kaçta'] }, [L('NOTYA-AYSE-DENETIM-03')]),
  e(28, `${D}'un Ventolinini kes`, 'ilac_sonlandir', { acik: undefined }),
  e(29, 'Fıstık alerjisini ekle', null, { acik: undefined, oturum: 'E-29', not: 'No patient named: Ayşe asks which patient; no card. The action-audit chart is in the panel but not open.' }),
  e(30, '14:30', 'kontrol_randevusu_olustur', { kurulum: ['Randevu oluştur', 'Yarın'] }),
  e(31, '14:30', 'kontrol_randevusu_olustur', { acik: undefined, kurulum: ['Bir randevu yapmak istiyorum bir hasta için', D, 'Yarın'] }),
  e(32, 'Alerjisi var mı', null, { not: 'A question, not a command.' }),
  e(33, 'Ventolini ne zaman kestik', null, { not: 'A question, not a command.' }),
]

/* ══════════════════════════════════════════════════════════════════════════════════════════════════════
 * G. Capabilities he reported lost (docs/qa/gokhan-yetenek-talepleri.md) and the audit probes behind them
 * ══════════════════════════════════════════════════════════════════════════════════════════════════════ */
const r = (id: string, kat: Kategori, soz: string, beklenti: Beklenti, ek: Ek = {}, ekKaynak: Kaynak[] = []) =>
  g(`R-${id}`, kat, soz, [K(ROTA, soz), ...ekKaynak], beklenti, ek)
const TABLO: Beklenti = { rota: ['kayit'], hasta: 'bebek', tablo: true }
const GERI05 = [L('NOTYA-AYSE-GERI-05'), K(YETENEK, 'Vaccine record'), K(DENETIM, '4.4')]
const YETENEK_GIRDILERI: KorpusGirdisi[] = [
  // records on screen, from stored rows, no model
  r('ASI-1', 'asi', 'Aşılarını göster', { ...TABLO, icerir: ['Hepatit B', '16 kayıt'] }, { acik: 'bebek', ses: { tablo: false, icerir: ['16 kayıt'] } }, GERI05),
  r('ASI-2', 'asi', 'Aşı karnesini tablo olarak göster', { ...TABLO, icerir: ['Hepatit B', 'KKK', '16 kayıt'] }, { acik: 'bebek', ses: { tablo: false, icerir: ['16 kayıt'] } }, GERI05),
  r('ASI-3', 'asi', `${P} aşı karnesini tablo olarak göster`, { ...TABLO, icerir: ['Hepatit B', '16 kayıt'] }, { ses: { tablo: false, icerir: ['16 kayıt'] } }, GERI05),
  r('ASI-4', 'asi', 'Toplam kaç aşısı var', { rota: ['kayit'], hasta: 'bebek', icerir: ['\\b16\\b'], icermez: [SAYIM_SABLONU] }, { acik: 'bebek' }, [L('NOTYA-AYSE-GERI-01'), K(DENETIM, 'Toplam kaç aşısı var')]),
  r('OLCUM-1', 'olcum', 'Bütün muayenelerdeki kilo ölçümlerini sırayla göster', { ...TABLO, icerir: ['7,9', '9,8', '11,3', '12,6', '12,8'] }, { acik: 'bebek', ses: { tablo: false, icerir: ['12,8'] } }, GERI05),
  r('OLCUM-2', 'olcum', 'Kilo, boy ve baş çevresi ölçümlerini tablo yap', { ...TABLO, icerir: ['67,5', '43,4', '87,5', '48,9'] }, { acik: 'bebek', ses: { tablo: false, icerir: ['12,8'] } }, GERI05),
  r('OLCUM-3', 'olcum', 'Tüm antropometrik ölçümlerini göster', { ...TABLO, icerir: ['7,9', '67,5', '43,4'] }, { acik: 'bebek', ses: { tablo: false, icerir: ['12,8'] } }, GERI05),
  r('OLCUM-4', 'olcum', 'Baş çevresi ölçümleri neler', { ...TABLO, icerir: ['43,4', '46,4', '47,8', '48,9'] }, { acik: 'bebek', ses: { tablo: false, icerir: ['48,9'] } }, GERI05),
  r('OLCUM-5', 'olcum', 'Son muayenedeki boy ve kilo ölçümlerini göster', { rota: ['kayit'], hasta: 'bebek', icerir: ['12,8'] }, { acik: 'bebek' }, GERI05),
  r('MUAYENE-1', 'muayene', 'Son üç muayenesini özetle', { rota: ['kayit'], hasta: 'bebek', icerir: ['son 3 muayene', '[Oo]tit', '24 aylık'] }, { acik: 'bebek' }, GERI05),
  r('MUAYENE-2', 'muayene', 'Bütün muayenelerini tek tek özetle', { rota: ['kayit'], hasta: 'bebek', icerir: ['15 muayene', '6 aylık', '[Oo]tit'] }, { acik: 'bebek', ses: { icerir: ['15 muayene'] } }, GERI05),
  g('R-OLCUM-METIN', 'olcum', '15 aylık muayenesinde kilosu kaçtı?', [L('NOTYA-DANIS-OLCUM-03'), K(YETENEK, 'from a single exam')], { hasta: 'bebek', icerir: ['10,6 kg'], icermez: ['12,8'], rotaDegil: ['arama', 'hizli-kart'] },
    { acik: 'bebek', turetilmis: true, not: 'Capability 4(a), one exam: that visit has its weight (10,6 kg) only in the note text, not in notes.vitaller. NOTYA-DANIS-OLCUM-03 made a labelled value in the note text count as recorded.' }),
  // guards the routing table lists as "must keep working"
  r('KART-KILO', 'olcum', 'Kilosu kaç?', { rota: ['hizli-kart'], hasta: 'bebek', icerir: ['12,8'] }, { acik: 'bebek' }, [K(T_STANDART, 'Kilosu kaç?')]),
  r('KART-ALERJI', 'dosya', 'Alerjisi var mı?', { rota: ['hizli-kart'], hasta: 'bebek', icerir: ['alerji'], icermez: ['Penisilin'] }, { acik: 'bebek' }, [K(T_STANDART, 'Alerjisi var mı?')]),
  r('TAKVIM-BOS', 'takvim', 'Yarın 15:00 boş mu?', { rota: ['takvim'], icerir: ['{YARIN}', '15:00'] }, { acik: 'bebek' }, [K(YETENEK, 'free slots')]),
  r('TAKVIM-KIM', 'takvim', 'Yarın kimler geliyor?', { rota: ['takvim'], icerir: ['{YARIN}', 'Ayşe Bozkurt'] }, {}, [K(YETENEK, 'list by day/patient')]),
  r('KAPSAM', 'kapsam', 'Bitcoin almalı mıyım?', { ret: true, rota: ['kapsam'] }),
  r('COUNT-ACIK-1', 'dosya', 'En çok hangi şikayetle geldi', { hasta: 'bebek', rotaDegil: ['arama'], icermez: [SAYIM_SABLONU] }, { acik: 'bebek' }, [L('NOTYA-AYSE-GERI-01'), K(DENETIM, 'En çok hangi şikayetle geldi')]),
  // §4.3 — a sentence that merely contains a chart word is not a patient search (no patient open)
  ...['Randevu saatini değiştirmek istiyorum', 'Aşı karnesini tablo olarak göster', 'İlaç etkileşimi var mı kontrol et', 'Epikriz hazırla', 'Otitte ilk seçenek tedavi nedir',
    'Ateşli çocukta parasetamol dozu nedir', 'Tanı koymama yardım eder misin', 'Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz'].map((soz, n) =>
    g(`R-SAYIM-${n + 1}`, 'sayim', soz, [K(DENETIM, soz), K(ROTA, soz), L('NOTYA-AYSE-GERI-01')], { rotaDegil: ['arama'], hasta: null, icermez: [SAYIM_SABLONU] })),
  // §4.2 — the scope gate refused real patients and clinical questions
  ...['Burcu Yılmaz en son ne zaman geldi?', 'Mehmet Erdoğan en son ne zaman geldi?', 'Ali Erdoğan kim?', 'Faiz Demir bugün geldi mi', 'Kriptorşidizm ne zaman opere edilir?',
    'Araba tutması için ne önerirsin?', 'İlk seçim ne olmalı?', 'C-reactive protein yüksekliği nedenleri', 'Otel dönüşü döküntü yapan şey ne olabilir'].map((soz, n) =>
    g(`R-KAPSAM06-${n + 1}`, 'kapsam', soz, [K(DENETIM, soz), L('NOTYA-KAPSAM-06a')], { rotaDegil: ['kapsam'] }, { not: 'A name or a clinical term that collides with an off-topic word: must not get the fixed refusal.' })),
  g('R-KAPSAM06-10', 'dosya', `${P} en son ne zaman geldi?`, [K(DENETIM, 'en son ne zaman geldi?'), L('NOTYA-KAPSAM-06b')], { hasta: 'bebek', rotaDegil: ['kapsam', 'arama'], icerir: ['{P_SON_VIZIT}'] }),
]

/* ───────────────────────────── the corpus ───────────────────────────── */

export const GOKHAN_SIKAYET_KORPUSU: KorpusGirdisi[] = [
  ...LEDGER_GIRDILERI, ...GUNLUK_GIRDILERI, ...YUZ_GIRDILERI, ...TAKIP_GIRDILERI, ...ILK10_GIRDILERI, ...EYLEM_GIRDILERI, ...YETENEK_GIRDILERI,
]

/* ───────────────────────────── loader ───────────────────────────── */

export interface KorpusFiltresi {
  /** Entry ids, or id prefixes ending in "-" ("T-", "Y-0"). */
  idler?: string[]
  kat?: string[]
  /** Substring of a source path or of a source id. */
  kaynak?: string
  yuzeyler?: Yuzey[]
}

/** Structural problems of an entry list; empty = valid. */
export function korpusDenetle(girdiler: KorpusGirdisi[]): string[] {
  const sorun: string[] = []
  const gorulen = new Set<string>()
  for (const g of girdiler) {
    if (!g.id || !/^[A-Z][A-Z0-9-]*$/.test(g.id)) sorun.push(`${g.id || '(id yok)'}: geçersiz id`)
    if (gorulen.has(g.id)) sorun.push(`${g.id}: yinelenen id`)
    gorulen.add(g.id)
    if (!g.kaynak?.length || g.kaynak.some((k) => !k.dosya?.trim() || !k.kimlik?.trim())) sorun.push(`${g.id}: kaynak eksik`)
    if (!String(g.soz || '').trim()) sorun.push(`${g.id}: cümle boş`)
    if (!g.yuzeyler?.length) sorun.push(`${g.id}: yüzey yok`)
    if (g.yuzeyler?.includes('panel') && !g.acik) sorun.push(`${g.id}: panel yüzeyi açık hasta ister`)
    if (g.turetilmis && !g.not) sorun.push(`${g.id}: türetilmiş cümle açıklama (not) ister`)
    if (g.beklenti !== 'MANUAL') {
      const okunus = [g.beklenti.okunus, g.ses?.okunus].flatMap((x) => [...(x?.icerir || []), ...(x?.icermez || [])])
      for (const re of [...(g.beklenti.icerir || []), ...(g.beklenti.icermez || []), ...(g.ses?.icerir || []), ...(g.ses?.icermez || []), ...(g.panel?.icerir || []), ...(g.panel?.icermez || []), ...okunus]) {
        try { new RegExp(re.replace(/\{[A-Z0-9_]+\}/g, 'x'), 'iu') } catch { sorun.push(`${g.id}: bozuk desen ${re}`) }
      }
      if (!Object.keys(g.beklenti).length) sorun.push(`${g.id}: boş beklenti (MANUAL yazın)`)
    }
  }
  // An `oturum` is one session: its entries must be contiguous so the file order is the turn order.
  const kapanan = new Set<string>()
  let onceki: string | undefined
  for (const g of girdiler) {
    if (g.oturum !== onceki) {
      if (onceki) kapanan.add(onceki)
      if (g.oturum && kapanan.has(g.oturum)) sorun.push(`${g.id}: oturum ${g.oturum} bölünmüş`)
    }
    onceki = g.oturum
  }
  return sorun
}

/** The corpus, validated and filtered. A filter that cuts into a session keeps the session's earlier entries. */
export function korpusYukle(f: KorpusFiltresi = {}, girdiler: KorpusGirdisi[] = GOKHAN_SIKAYET_KORPUSU): KorpusGirdisi[] {
  const sorun = korpusDenetle(girdiler)
  if (sorun.length) throw new Error(`Gökhan korpusu geçersiz:\n${sorun.join('\n')}`)
  const uyar = (g: KorpusGirdisi) =>
    (!f.idler?.length || f.idler.some((x) => (x.endsWith('-') ? g.id.startsWith(x) : g.id === x)))
    && (!f.kat?.length || f.kat.includes(g.kat))
    && (!f.kaynak || g.kaynak.some((k) => k.dosya.includes(f.kaynak!) || k.kimlik.includes(f.kaynak!)))
    && (!f.yuzeyler?.length || g.yuzeyler.some((y) => f.yuzeyler!.includes(y)))
  const secilen = new Set(girdiler.filter(uyar).map((g) => g.id))
  // Earlier turns of a selected entry's session bind its patient and topic: they stay.
  const sonSecilen = new Map<string, number>()
  girdiler.forEach((g, n) => { if (g.oturum && secilen.has(g.id)) sonSecilen.set(g.oturum, n) })
  return girdiler
    .filter((g, n) => secilen.has(g.id) || (g.oturum !== undefined && (sonSecilen.get(g.oturum) ?? -1) > n))
    .map((g) => (f.yuzeyler?.length ? { ...g, yuzeyler: g.yuzeyler.filter((y) => f.yuzeyler!.includes(y)) } : g))
    .filter((g) => g.yuzeyler.length > 0)
}

/** Entries grouped into sessions, in file order. An entry without `oturum` is its own session. */
export function oturumlaraBol(girdiler: KorpusGirdisi[]): KorpusGirdisi[][] {
  const out: KorpusGirdisi[][] = []
  for (const g of girdiler) {
    const son = out[out.length - 1]
    if (g.oturum && son && son[0].oturum === g.oturum) son.push(g)
    else out.push([g])
  }
  return out
}

/* ───────────────────────────── placeholders ───────────────────────────── */

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const kaydir = (iso: string, n: number) => {
  const [yy, mm, dd] = iso.split('-').map(Number)
  return new Date(Date.UTC(yy, mm - 1, dd + n)).toISOString().slice(0, 10)
}
/** 0 = Monday … 6 = Sunday. */
const haftaGunu = (iso: string) => {
  const [yy, mm, dd] = iso.split('-').map(Number)
  return (new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay() + 6) % 7
}
/** A date as Ayşe may write it: "2 Ekim 2026" or "02.10.2026". */
export function tarihDeseni(iso: string, yilli = true): string {
  const [yy, mm, dd] = iso.split('-')
  // No digit before the day: "12 Ekim" is not "2 Ekim".
  return `(?<!\\d)(?:${Number(dd)} ${AYLAR[Number(mm) - 1]}${yilli ? ` ${yy}` : ''}|${dd}\\.${mm}\\.${yy})`
}

/** Dates of the fixture the placeholders need (ISO days), supplied by the runner from the charts it wrote. */
export interface FiksturTarihleri { pDogum: string; pKkk: string; pRandevu: string; pSonVizit: string; pSonLab: string; aVizit: string }

/**
 * Placeholder values for one run. Weekday names resolve to the coming day of that name, today included — the
 * reading the source rubrics used (asked on a Wednesday, "perşembe" was the next day).
 */
export function korpusBaglami(bugunIso: string, f: FiksturTarihleri): Record<string, string> {
  const gun = haftaGunu(bugunIso)
  const sonraki = (hedef: number) => kaydir(bugunIso, (hedef - gun + 7) % 7)
  const buPzt = kaydir(bugunIso, -gun)
  return {
    BUGUN: tarihDeseni(bugunIso), YARIN: tarihDeseni(kaydir(bugunIso, 1)), OBURGUN: tarihDeseni(kaydir(bugunIso, 2)), DUN: tarihDeseni(kaydir(bugunIso, -1)),
    CUMA: tarihDeseni(sonraki(4)), PERSEMBE: tarihDeseni(sonraki(3)),
    BUHAFTA_PZT: tarihDeseni(buPzt, false), HAFTAYA_PZT: tarihDeseni(kaydir(buPzt, 7), false),
    P_DOGUM: tarihDeseni(f.pDogum), P_KKK: tarihDeseni(f.pKkk), P_RANDEVU: tarihDeseni(f.pRandevu), P_SON_VIZIT: tarihDeseni(f.pSonVizit), P_SON_LAB: tarihDeseni(f.pSonLab),
    A_VIZIT: tarihDeseni(f.aVizit),
  }
}

export function yerlestir(desen: string, baglam: Record<string, string>): string {
  return desen.replace(/\{([A-Z0-9_]+)\}/g, (hepsi, ad: string) => {
    if (!(ad in baglam)) throw new Error(`Korpus deseni bilinmeyen yer tutucu taşıyor: ${hepsi}`)
    return baglam[ad]
  })
}

/* ───────────────────────────── assertion helpers ───────────────────────────── */

export type Karar = 'PASS' | 'FAIL' | 'MANUAL' | 'VEKIL'

/** What one graded turn produced, as the runner observed it. */
export interface TurGozlemi {
  yuzey: Yuzey
  /** Screen text (written answer; on voice the stored screen message). */
  ekran: string
  /** Spoken text (voice only). */
  soz: string
  /** The spoken text as handed to the speech engine (voice only; lib/asistan/fishSes.ts fishMetni). */
  okunus?: string
  /** Route that answered; null on the panel (always the model) or when the turn failed before routing. */
  rota: string | null
  /** The turn reached the model. */
  modeleGitti: boolean
  /** Tools the model called, from the wire. */
  cagrilan: string[]
  kartlar: { eylem: string; eksik: number; uyari: number }[]
  /** Name of the patient the turn was bound to; null = none; undefined = not observable (panel). */
  hasta: string | null | undefined
  /** Transport / route failure, or ''. */
  hata: string
}

const re = (desen: string, baglam: Record<string, string>) => new RegExp(yerlestir(desen, baglam), 'iu')
const kisalt = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n)}…` : s)

/** The effective expectation of an entry on a surface: voice overrides merged over the base. */
export function yuzeyBeklentisi(g: KorpusGirdisi, yuzey: Yuzey): Beklenti | 'MANUAL' {
  if (g.beklenti === 'MANUAL') return 'MANUAL'
  if (yuzey === 'panel' && g.panel) return { ...g.beklenti, ...g.panel }
  return yuzey === 'ses' && g.ses ? { ...g.beklenti, ...g.ses } : g.beklenti
}

/**
 * Grade one turn. Returns the verdict and every part that failed.
 *
 * `vekil` (dry run): a stand-in answered instead of the model. Routing, the forced tool, the card and the bound
 * patient are still real and are graded; the WORDS of a model-written answer are not the model's, so a turn that
 * reached the stand-in is 'VEKIL' (not judged) unless something structural already failed. A turn answered by a
 * model-free handler is graded in full — the dry run finds regressions of those handlers.
 */
export function beklentiDegerlendir(
  beklenti: Beklenti | 'MANUAL', t: TurGozlemi, baglam: Record<string, string>, adlar: Partial<Record<KorpusHastasi, string>>, o: { vekil?: boolean } = {},
): { karar: Karar; nedenler: string[] } {
  const nedenler: string[] = []
  if (t.hata) nedenler.push(`hata: ${kisalt(t.hata, 120)}`)
  if (beklenti === 'MANUAL') return { karar: nedenler.length ? 'FAIL' : 'MANUAL', nedenler }

  // On voice the table and the values are on screen and the short line is spoken: the two are read together.
  const metin = t.yuzey === 'ses' ? [t.ekran, t.soz].filter(Boolean).join('\n') : t.ekran
  const vekilCevabi = Boolean(o.vekil) && t.modeleGitti && !beklenti.sunucuYazar

  // ── structural parts: judged in every mode ──
  if (beklenti.rota && t.yuzey !== 'panel' && !beklenti.rota.includes(t.rota as KorpusRota)) nedenler.push(`rota ${t.rota ?? '—'} ≠ ${beklenti.rota.join('|')}`)
  if (beklenti.rotaDegil && t.rota && beklenti.rotaDegil.includes(t.rota as KorpusRota)) nedenler.push(`rota ${t.rota} (olmamalı)`)
  if (beklenti.arac !== undefined) {
    if (beklenti.arac === null && t.cagrilan.length) nedenler.push(`araç çağrıldı: ${t.cagrilan.join(',')}`)
    if (beklenti.arac && !t.cagrilan.includes(beklenti.arac)) nedenler.push(`araç ${beklenti.arac} çağrılmadı${t.cagrilan.length ? ` (çağrılan: ${t.cagrilan.join(',')})` : ''}`)
  }
  if (beklenti.kart !== undefined) {
    if (beklenti.kart === null && t.kartlar.length) nedenler.push(`kart hazırlandı: ${t.kartlar.map((k) => k.eylem).join(',')}`)
    if (beklenti.kart && !t.kartlar.some((k) => k.eylem === beklenti.kart)) nedenler.push(`kart ${beklenti.kart} yok`)
  }
  if (beklenti.hasta !== undefined && t.hasta !== undefined) {
    const beklenenAd = beklenti.hasta === null ? null : adlar[beklenti.hasta] ?? beklenti.hasta
    if ((t.hasta ?? null) !== beklenenAd) nedenler.push(`hasta ${t.hasta ?? '—'} ≠ ${beklenenAd ?? '—'}`)
  }
  if (beklenti.ret !== undefined || !vekilCevabi) {
    const retGeldi = new RegExp(KAPSAM_RED_BASI, 'iu').test(metin)
    if (beklenti.ret && !retGeldi) nedenler.push('kapsam reddi bekleniyordu')
    if (!beklenti.ret && retGeldi) nedenler.push('kapsam reddi geldi')
  }

  // ── the words of the answer ──
  if (!vekilCevabi) {
    // A warning the server adds to the card's line is part of the answer whoever wrote the rest.
    if (beklenti.kartUyari && !t.kartlar.some((k) => k.uyari > 0)) nedenler.push('kartta uyarı yok')
    for (const d of beklenti.icerir || []) if (!re(d, baglam).test(metin)) nedenler.push(`içermeli: ${kisalt(d)}`)
    for (const d of beklenti.icermez || []) if (re(d, baglam).test(metin)) nedenler.push(`içermemeli: ${kisalt(d)}`)
    if (beklenti.tablo && !/^\|.+\|\s*$/m.test(t.ekran)) nedenler.push('ekranda tablo yok')
    if (beklenti.okunus && t.yuzey === 'ses') {
      const okunus = t.okunus ?? ''
      for (const d of beklenti.okunus.icerir || []) if (!re(d, baglam).test(okunus)) nedenler.push(`okunuş içermeli: ${kisalt(d)}`)
      for (const d of beklenti.okunus.icermez || []) if (re(d, baglam).test(okunus)) nedenler.push(`okunuş içermemeli: ${kisalt(d)}`)
    }
    if (!beklenti.ret) for (const y of YASAK_CUMLELER) if (new RegExp(y.re, 'iu').test(metin)) nedenler.push(`yasak cümle (${y.ad})`)
    if (beklenti.soruSormaz && new RegExp(GERI_SORU, 'iu').test(metin)) nedenler.push('geri soru sordu')
  }

  if (nedenler.length) return { karar: 'FAIL', nedenler }
  const sozBekleniyor = Boolean(beklenti.icerir?.length || beklenti.icermez?.length || beklenti.tablo || beklenti.kartUyari || beklenti.okunus)
  return { karar: vekilCevabi && sozBekleniyor ? 'VEKIL' : 'PASS', nedenler }
}
