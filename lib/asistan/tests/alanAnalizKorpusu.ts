/**
 * NOTYA-AYSE-ALAN-01 / NOTYA-AYSE-ANALIZ-01 — corpus entries for the two goals of 2026-10-02.
 *
 * The Dr. Gökhan complaint corpus (NOTYA-GOKHAN-KORPUS-01) lives on `audit/gokhan-korpus` and does not merge cleanly
 * into this branch (package.json), so these entries are run as a plain test (lib/asistan/alanAnalizKorpus.test.ts).
 * They are written in the corpus's own entry shape — sentence, source, state, surfaces, intended outcome — so they
 * can be moved into lib/asistan/tests/gokhanSikayetKorpusu.ts as they are once both branches are on main. The one
 * extra field is `vekil`: with no model in a test, the tool calls a model following the prompt rule would make for
 * the sentence are scripted. In a live corpus run `vekil` is dropped and `beklenti.arac` is graded against Luna.
 *
 * Patients are synthetic (tests/kimlikHastasi.ts, tests/dortMuayeneHastasi.ts). `{AD}` and `{V1}`…`{V4}` are filled
 * by the runner with the fixture's name and visit dates.
 *
 * PURE: types and entries only.
 */
import type { SahteArac } from './ayseSahne'

export type AaYuzey = 'yazi' | 'ses'
export type AaHasta = 'kimlik' | 'dort'

export interface AaBeklenti {
  /** Regex sources (flags iu); ALL must match the answer the doctor sees. */
  icerir?: string[]
  /** Regex sources; NONE may match. */
  icermez?: string[]
  /** The route that must answer. Everything but `model` is a model-free handler. */
  rota?: string
  /** Tools the model must call on the graded turn, in any order; [] = no tool may be called. */
  arac?: string[]
}

export interface AaGirdisi {
  id: string
  kaynak: { dosya: string; kimlik: string }[]
  kat: 'kimlik' | 'muayene' | 'takip'
  /** The sentence that is graded. */
  soz: string
  hasta: AaHasta
  /** The patient's chart is open in the session; otherwise the sentence names the patient. */
  acik?: boolean
  yuzeyler: AaYuzey[]
  beklenti: AaBeklenti
  /** Voice: patterns on the SPOKEN text (identity values are shown, never spoken). */
  sozlu?: { icerir?: string[]; icermez?: string[] }
  /** The sentence is not a quote of the source but derived from its description; `not` says how. */
  turetilmis?: boolean
  not?: string
  /** Stand-in for the model: the tool calls the prompt rule asks for. `ad: true` adds the patient's name to the call. */
  vekil: { arac: SahteArac; ad?: boolean }[]
}

const BRIEF = 'docs/ayse-alan-ve-analiz.md'
const KIMLIK = 'lib/doktor/kimlikSorusu.ts'

/** No answer of these entries may be a refusal, a deflection or a raw placeholder. */
export const AA_ICERMEZ = ['erişimim yok', 'erişemem', 'ulaşamıyorum', 'göremiyorum', 'bilemedim', '\\{\\{', '\\}\\}']

const DEGER_SOYLENMEZ = { icerir: ['istediğiniz bilgiyi ekranınıza yazdım Hocam'], icermez: ['QA-'] }
const alan = (ad: string, isimle = false) => ({ arac: { name: 'hasta_alan', input: { alan: ad } }, ad: isimle })

export const ALAN_ANALIZ_KORPUSU: AaGirdisi[] = [
  // ── A. identity and contact fields ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'ALAN-01', kat: 'kimlik', hasta: 'kimlik', yuzeyler: ['yazi', 'ses'],
    kaynak: [{ dosya: KIMLIK, kimlik: 'NOTYA-BETA-0925 — canlı vaka' }],
    soz: '{AD}’nin anne ve baba adı ne?',
    not: 'The live sentence of 2026-09-25, said about the synthetic patient. The identity router answers it; that fast path must stay.',
    beklenti: { rota: 'kimlik', arac: [], icerir: ['Anne adı: QA-Anne-Sevgül', 'Baba adı: QA-Baba-Rıfkı'] },
    sozlu: DEGER_SOYLENMEZ, vekil: [],
  },
  {
    id: 'ALAN-02', kat: 'kimlik', hasta: 'kimlik', yuzeyler: ['yazi', 'ses'], turetilmis: true,
    kaynak: [{ dosya: BRIEF, kimlik: 'A — The gap' }],
    soz: '{AD}’nin annesine nasıl hitap edeyim?',
    not: 'Derived: the complaint is "a phrasing the classifier misses". This one asks for the mother’s name without the words the classifier lists.',
    beklenti: { rota: 'model', arac: ['hasta_alan'], icerir: ['QA-Anne-Sevgül'] },
    sozlu: DEGER_SOYLENMEZ, vekil: [alan('anne_adi', true)],
  },
  {
    id: 'ALAN-03', kat: 'kimlik', hasta: 'kimlik', acik: true, yuzeyler: ['yazi', 'ses'], turetilmis: true,
    kaynak: [{ dosya: BRIEF, kimlik: 'A — The gap' }],
    soz: 'Bu aile nerede oturuyor?',
    not: 'Derived: address asked without the word "adres", chart open.',
    beklenti: { rota: 'model', arac: ['hasta_alan'], icerir: ['QA-Sokak No 7 Daire 3, QA-İl-Eskişehir'] },
    sozlu: DEGER_SOYLENMEZ, vekil: [alan('adres')],
  },
  {
    id: 'ALAN-04', kat: 'kimlik', hasta: 'kimlik', acik: true, yuzeyler: ['yazi', 'ses'], turetilmis: true,
    kaynak: [{ dosya: BRIEF, kimlik: 'A — The gap' }],
    soz: 'Aileye hangi numaradan ulaşırım, kiminle konuşacağım?',
    not: 'Derived: phone and guardian in one sentence — two fields, two calls, one answer.',
    beklenti: { rota: 'model', arac: ['hasta_alan', 'hasta_alan'], icerir: ['0555 000 11 22', 'QA-Veli-Nezahat QA-Soyad-Erdemli \\(Anne\\) — 0555 000 33 44'] },
    sozlu: { icerir: ['ekranınıza yazdım'], icermez: ['QA-', '0555'] }, vekil: [alan('telefon'), alan('veli')],
  },
  {
    id: 'ALAN-05', kat: 'kimlik', hasta: 'kimlik', acik: true, yuzeyler: ['yazi', 'ses'], turetilmis: true,
    kaynak: [{ dosya: BRIEF, kimlik: 'A — How a turn runs now' }],
    soz: 'Yazılı olarak aileye nereden ulaşırım?',
    not: 'Derived: a field with no value — the answer is the existing sentence that says where to add it; it carries no value, so it is spoken too.',
    beklenti: { rota: 'model', arac: ['hasta_alan'], icerir: ['E-posta kayıtlı değil — hasta dosyasında Özet › Demografik bilgiler › Düzenle’den ekleyebilirsiniz'] },
    sozlu: { icerir: ['E-posta kayıtlı değil'] }, vekil: [alan('eposta')],
  },
  // ── B. analysis across visits ──────────────────────────────────────────────────────────────────────────────────
  {
    id: 'ANALIZ-01', kat: 'muayene', hasta: 'dort', acik: true, yuzeyler: ['yazi', 'ses'], turetilmis: true,
    kaynak: [{ dosya: BRIEF, kimlik: 'B — bu hastanın hangi muayenesinde X yapıldı' }],
    soz: 'Bu hastanın hangi muayenesinde Augmentin yazıldı?',
    not: 'The live sentence with X = the drug of the synthetic chart.',
    beklenti: { rota: 'model', arac: ['muayene_ara'], icerir: ['{V2} — 2\\. muayene', 'reçete edildi — Augmentin'], icermez: ['- {V1}', '- {V3}', '- {V4}'] },
    vekil: [{ arac: { name: 'muayene_ara', input: { terim: 'Augmentin' } } }],
  },
  {
    id: 'ANALIZ-02', kat: 'muayene', hasta: 'dort', yuzeyler: ['yazi', 'ses'], turetilmis: true,
    kaynak: [{ dosya: BRIEF, kimlik: 'B — bu hastanın hangi muayenesinde X yapıldı' }],
    soz: '{AD} hangi muayenesinde Augmentin aldı?',
    not: 'The same question with no chart open: the patient is named.',
    beklenti: { rota: 'model', arac: ['muayene_ara'], icerir: ['{V2} — 2\\. muayene', 'reçete edildi — Augmentin'] },
    vekil: [{ arac: { name: 'muayene_ara', input: { terim: 'Augmentin' } }, ad: true }],
  },
  {
    id: 'ANALIZ-03', kat: 'muayene', hasta: 'dort', acik: true, yuzeyler: ['yazi', 'ses'], turetilmis: true,
    kaynak: [{ dosya: BRIEF, kimlik: 'B — bu hastanın hangi muayenesinde X yapıldı' }],
    soz: 'Bu çocuğa hangi muayenesinde hemogram istemiştim?',
    not: 'X = a test that was asked for and never resulted: the state must stay "istendi".',
    beklenti: { rota: 'model', arac: ['muayene_ara'], icerir: ['{V1} — 1\\. muayene', 'not metni — istendi: "Hemogram ve ferritin istendi'], icermez: ['hemogram[^\\n]*sonuçlandı'] },
    vekil: [{ arac: { name: 'muayene_ara', input: { terim: 'hemogram' } } }],
  },
  {
    id: 'ANALIZ-04', kat: 'takip', hasta: 'dort', acik: true, yuzeyler: ['yazi', 'ses'],
    kaynak: [{ dosya: BRIEF, kimlik: 'B — 4 muayeneden sonra eksikler var mı, nelerdir' }],
    soz: 'Son 4 muayeneden sonra eksikler var mı, nelerdir?',
    beklenti: {
      rota: 'model', arac: ['eksikler', 'muayeneleri_oku'],
      icerir: ['- Aşı: Hep B 3\\. doz', 'Ölçüm kaydı olmayan muayeneler: kilo — {V3}', 'için planlanmıştı \\({V4} notu: "1 ay sonra kontrol"\\); sonraki vizit kaydı yok', 'Ferritin — istendi, sonuç yok \\(istem: {V1}'],
    },
    vekil: [{ arac: { name: 'eksikler', input: {} } }, { arac: { name: 'muayeneleri_oku', input: { adet: 4 } } }],
  },
  {
    id: 'ANALIZ-05', kat: 'takip', hasta: 'dort', yuzeyler: ['yazi', 'ses'],
    kaynak: [{ dosya: BRIEF, kimlik: 'B — 4 muayeneden sonra eksikler var mı, nelerdir' }],
    soz: '{AD} için son 4 muayeneden sonra eksikler var mı, nelerdir?',
    beklenti: {
      rota: 'model', arac: ['eksikler', 'muayeneleri_oku'],
      icerir: ['- Aşı: Hep B 3\\. doz', 'Ölçüm kaydı olmayan muayeneler: kilo — {V3}', 'sonraki vizit kaydı yok', 'Ferritin — istendi, sonuç yok'],
    },
    vekil: [{ arac: { name: 'eksikler', input: {} }, ad: true }, { arac: { name: 'muayeneleri_oku', input: { adet: 4 } }, ad: true }],
  },
  {
    id: 'ANALIZ-06', kat: 'takip', hasta: 'dort', acik: true, yuzeyler: ['yazi', 'ses'], turetilmis: true,
    kaynak: [{ dosya: BRIEF, kimlik: 'B — 4 muayeneden sonra eksikler var mı, nelerdir' }],
    soz: 'Eksikleri neler?',
    not: 'The shortest form of the same question: the gap list alone.',
    beklenti: { rota: 'model', arac: ['eksikler'], icerir: ['A\\) FISILTI', '- Aşı: Hep B 3\\. doz', 'B\\) NOTLARDA PLANLANIP', 'Ferritin — istendi, sonuç yok'] },
    vekil: [{ arac: { name: 'eksikler', input: {} } }],
  },
  {
    id: 'ANALIZ-07', kat: 'muayene', hasta: 'dort', acik: true, yuzeyler: ['yazi', 'ses'], turetilmis: true,
    kaynak: [{ dosya: BRIEF, kimlik: 'B — muayeneleri_oku' }],
    soz: 'Son iki muayenesini karşılaştırır mısın?',
    not: 'Derived: reasoning across several visits needs the visits side by side.',
    beklenti: { rota: 'model', arac: ['muayeneleri_oku'], icerir: ['son 2 muayene: 2 muayene', '### 3\\. muayene — {V3}', '### 4\\. muayene — {V4}', 'kilo: kayıt yok'], icermez: ['### 2\\. muayene'] },
    vekil: [{ arac: { name: 'muayeneleri_oku', input: { adet: 2 } } }],
  },
]
