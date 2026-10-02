/**
 * NOTYA-AYSE-GERI-08 (audit §9 "Does Luna call tools unforced?", PR 11) — the action audit.
 *
 * About thirty ACTION sentences a doctor says to Ayşe, each run through the REAL routes on both channels
 * (/api/asistan/chat, and /api/asistan/fish-tur with the transcript given as text) against the in-memory scene
 * (lib/asistan/tests/ayseSahne.ts): synthetic patient, no production data, nothing written anywhere real. The model
 * is the real primary through OpenRouter with the guard disabled (NOTYA_KORUYUCU_KAPALI=1) — a fall is a failure
 * of that sentence, not a rescued answer.
 *
 * Two passes:
 *   uretim      production behaviour — a recognised command forces its tool (S3);
 *   zorlamasiz  NOTYA_ARAC_ZORLAMA_KAPALI=1 — the whole tool list, nothing forced. This is the number the audit
 *               asked for: how often does the primary call a tool on its own?
 *
 * What is recorded per sentence: the route, whether a tool was forced, how many tools were offered, which tools the
 * model called (read from the wire), which cards the server made of them, the answer, latency, cost. No prompt.
 *
 * Run: lib/asistan/tests/eylemDenetimi.kos.ts. This file must be imported BEFORE anything that loads a route — it
 * installs the scene mocks.
 */
import {
  agCagrilari, agOkumalariBitsin, encrypt, fishTur, ortam, oturumAc, sahneKur, yazi, type AgCagrisi, type Sahne,
} from './ayseSahne'
import { GERCEKCI_HASTA_ADI, gercekciHastaEkle } from './gercekciHasta'

export type Kanal = 'yazi' | 'ses'
export type Mod = 'uretim' | 'zorlamasiz'

export interface EylemCumlesi {
  no: number
  kat: string
  /** acik = the patient's chart is open in the session; adla = no chart open, the sentence names the patient; yok = neither. */
  hasta: 'acik' | 'adla' | 'yok'
  /** The turns of the request, in order. Only the last one is graded. */
  sozler: string[]
  /** The tool the last turn must call; null = no tool may be called (a question back, or not a command at all). */
  beklenen: string | null
  not?: string
}

const AD = GERCEKCI_HASTA_ADI
/** The synthetic chart: penicillin allergy; active Tegretol, Pulmicort, Singulair, Ventolin, Ferrum; two future appointments. */
export const EYLEM_CUMLELERI: EylemCumlesi[] = [
  { no: 1, kat: 'alerji', hasta: 'acik', sozler: ['Fıstık alerjisini ekle'], beklenen: 'alerji_ekle' },
  { no: 2, kat: 'alerji', hasta: 'acik', sozler: ['Yumurta alerjisi var, dosyaya işle'], beklenen: 'alerji_ekle' },
  { no: 3, kat: 'alerji', hasta: 'acik', sozler: ['Penisilin alerjisini kaldır'], beklenen: 'alerji_kaldir' },
  { no: 4, kat: 'kronik', hasta: 'acik', sozler: ['Astım tanısını kronik hastalıklara ekle'], beklenen: 'kronik_hastalik_ekle' },
  { no: 5, kat: 'kronik', hasta: 'acik', sozler: ['Kronik hastalıklarına epilepsi ekleyelim'], beklenen: 'kronik_hastalik_ekle' },
  { no: 6, kat: 'ölçüm', hasta: 'acik', sozler: ['Kilosunu 24,8 kilo olarak ekle'], beklenen: 'olcum_ekle' },
  { no: 7, kat: 'ölçüm', hasta: 'acik', sozler: ['Boyu 124 santim, kilosu 24,8; kaydet'], beklenen: 'olcum_ekle' },
  { no: 8, kat: 'ölçüm', hasta: 'acik', sozler: ['Ateşi 38,2, kaydet'], beklenen: 'olcum_ekle' },
  { no: 9, kat: 'ölçüm', hasta: 'acik', sozler: ['Baş çevresi 52 santim, kaydet'], beklenen: 'bas_cevresi_ekle' },
  { no: 10, kat: 'ilaç', hasta: 'acik', sozler: ['Amoksisilin 250 mg günde iki kez ilaçlarına ekle'], beklenen: 'ilac_ekle', not: 'penicillin allergy on the chart — the card must carry the warning' },
  { no: 11, kat: 'ilaç', hasta: 'acik', sozler: ['Zyrtec şurup 5 mg akşamları, ilaçlarına ekle'], beklenen: 'ilac_ekle' },
  { no: 12, kat: 'ilaç', hasta: 'acik', sozler: ['Ventolini kes'], beklenen: 'ilac_sonlandir' },
  { no: 13, kat: 'ilaç', hasta: 'acik', sozler: ['Demir şurubunu keser misin'], beklenen: 'ilac_sonlandir' },
  { no: 14, kat: 'ilaç', hasta: 'acik', sozler: ['Pulmicort dozunu günde bir keze düşür'], beklenen: 'ilac_doz_degistir' },
  { no: 15, kat: 'ilaç', hasta: 'acik', sozler: ['Singulair dozunu 10 miligrama çıkar'], beklenen: 'ilac_doz_degistir' },
  { no: 16, kat: 'not', hasta: 'acik', sozler: ['Dosyasına not al: annesi sigarayı bıraktı'], beklenen: 'dosya_notu_ekle' },
  { no: 17, kat: 'not', hasta: 'acik', sozler: ['Şunu not düş: kontrolde EEG istenecek'], beklenen: 'dosya_notu_ekle' },
  { no: 18, kat: 'aşı', hasta: 'acik', sozler: ['Hepatit B aşısı dün yapıldı, kaydet'], beklenen: 'asi_kaydi_ekle' },
  { no: 19, kat: 'aşı', hasta: 'acik', sozler: ['KKK bugün yapıldı, dosyaya işle'], beklenen: 'asi_kaydi_ekle' },
  { no: 20, kat: 'kimlik', hasta: 'acik', sozler: ['Doğum tarihini 12.03.2019 olarak düzelt'], beklenen: 'hasta_bilgisi_duzelt' },
  { no: 21, kat: 'randevu', hasta: 'acik', sozler: ['Yarın saat 14:00 için kontrol randevusu oluştur'], beklenen: 'kontrol_randevusu_olustur' },
  { no: 22, kat: 'randevu', hasta: 'acik', sozler: ['Haftaya salı 10:30 kontrol randevusu ver'], beklenen: 'kontrol_randevusu_olustur' },
  { no: 23, kat: 'randevu', hasta: 'acik', sozler: ['Randevusunu perşembeye al'], beklenen: 'randevu_tasi', not: 'two future appointments — the server asks which one; the call is what is graded' },
  { no: 24, kat: 'randevu', hasta: 'acik', sozler: ['Randevu saatini 15:30 olarak değiştir'], beklenen: 'randevu_tasi' },
  { no: 25, kat: 'randevu', hasta: 'acik', sozler: ['Randevusunu iptal et'], beklenen: 'randevu_iptal' },
  { no: 26, kat: 'adla', hasta: 'adla', sozler: [`${AD}'un fıstık alerjisini ekle`], beklenen: 'alerji_ekle' },
  { no: 27, kat: 'adla', hasta: 'adla', sozler: [`${AD} için yarın 11:00'e kontrol randevusu oluştur`], beklenen: 'kontrol_randevusu_olustur' },
  { no: 28, kat: 'adla', hasta: 'adla', sozler: [`${AD}'un Ventolinini kes`], beklenen: 'ilac_sonlandir' },
  { no: 29, kat: 'hastasız', hasta: 'yok', sozler: ['Fıstık alerjisini ekle'], beklenen: null, not: 'no patient named — Ayşe must ask which patient, no card' },
  { no: 30, kat: 'çok tur', hasta: 'acik', sozler: ['Randevu oluştur', 'Yarın', '14:30'], beklenen: 'kontrol_randevusu_olustur' },
  { no: 31, kat: 'çok tur', hasta: 'yok', sozler: ['Bir randevu yapmak istiyorum bir hasta için', AD, 'Yarın', '14:30'], beklenen: 'kontrol_randevusu_olustur' },
  { no: 32, kat: 'komut değil', hasta: 'acik', sozler: ['Alerjisi var mı'], beklenen: null, not: 'a question — no tool' },
  { no: 33, kat: 'komut değil', hasta: 'acik', sozler: ['Ventolini ne zaman kestik'], beklenen: null, not: 'a question — no tool' },
]

export interface DenetimSatiri {
  no: number; kat: string; kanal: Kanal; mod: Mod; soz: string; beklenen: string | null
  /** Route of the graded turn; 'model' when it reached the model. */
  rota: string | null
  modeleGitti: boolean
  zorlanan: string | null
  sunulanArac: number
  /** Tools the model called on the graded turn, from the wire. */
  cagrilan: string[]
  /** Cards the server made of them (eylem_anahtar), and how many required fields each still lacks. */
  kartlar: { eylem: string; eksik: number; uyari: number }[]
  cevap: string
  ms: number
  maliyet: number
  /** luna_fail:<neden>:<altKod>, an HTTP status, or '' */
  hata: string
  dogru: boolean
}

/** A sentence is right when the expected tool was called — or, where none is expected, when no tool was. */
export function dogruMu(beklenen: string | null, cagrilan: string[], hata: string): boolean {
  if (hata) return false
  return beklenen ? cagrilan.includes(beklenen) : cagrilan.length === 0
}

export interface DenetimOzeti {
  mod: Mod; kanal: Kanal
  /** Sentences that expect a tool. */
  eylem: number
  /** …of which reached the model with tools offered. */
  modeleGiden: number
  /** …of which the model called ANY tool — the tool-call rate's numerator. */
  aracCagiran: number
  /** …of which the model called the EXPECTED tool. */
  dogruArac: number
  /** …of which the server made a card. */
  kartli: number
  /** Sentences that expect no tool, and how many of them got one anyway. */
  eylemsiz: number
  yanlisCagri: number
  hata: number
  p50Ms: number
  maliyet: number
}

const yuzde = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—')

export function ozetle(satirlar: DenetimSatiri[]): DenetimOzeti[] {
  const cikti: DenetimOzeti[] = []
  for (const mod of ['uretim', 'zorlamasiz'] as const) for (const kanal of ['yazi', 'ses'] as const) {
    const s = satirlar.filter((x) => x.mod === mod && x.kanal === kanal)
    if (!s.length) continue
    const eylem = s.filter((x) => x.beklenen)
    const eylemsiz = s.filter((x) => !x.beklenen)
    const sureler = s.map((x) => x.ms).sort((a, b) => a - b)
    cikti.push({
      mod, kanal,
      eylem: eylem.length,
      modeleGiden: eylem.filter((x) => x.modeleGitti && x.sunulanArac > 0).length,
      aracCagiran: eylem.filter((x) => x.cagrilan.length > 0).length,
      dogruArac: eylem.filter((x) => x.dogru).length,
      kartli: eylem.filter((x) => x.kartlar.length > 0).length,
      eylemsiz: eylemsiz.length,
      yanlisCagri: eylemsiz.filter((x) => x.cagrilan.length > 0).length,
      hata: s.filter((x) => x.hata).length,
      p50Ms: sureler[Math.floor(sureler.length / 2)] ?? 0,
      maliyet: s.reduce((t, x) => t + x.maliyet, 0),
    })
  }
  return cikti
}

const MOD_ADI: Record<Mod, string> = { uretim: 'production (command forces its tool)', zorlamasiz: 'unforced (whole tool list, no tool_choice)' }
const KANAL_ADI: Record<Kanal, string> = { yazi: 'written (/api/asistan/chat)', ses: 'voice (/api/asistan/fish-tur, text input)' }
const hucre = (m: string) => m.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()

/** The markdown report. Synthetic patient only — the answers may be committed. */
export function denetimRaporu(g: { tarih: string; model: string; satirlar: DenetimSatiri[]; kuru?: boolean }): string {
  const o = ozetle(g.satirlar)
  const b: string[] = []
  b.push(`# Ayşe — action audit on the primary model (${g.tarih})`, '')
  b.push(g.kuru
    ? '**DRY RUN — a stand-in answered instead of the model. The numbers below prove the harness, not Luna.**'
    : `Model: \`${g.model}\`, guard disabled (\`NOTYA_KORUYUCU_KAPALI=1\`). Harness: \`lib/asistan/tests/eylemDenetimi.kos.ts\` — real routes, in-memory scene, synthetic patient "${AD}". Nothing was read from or written to production.`, '')
  b.push('## Tool-call rate', '')
  b.push('| pass | channel | action sentences | reached the model with tools | model called a tool | called the expected tool | card made | non-commands that got a tool | failures | p50 | cost |')
  b.push('|---|---|---|---|---|---|---|---|---|---|---|')
  for (const x of o) {
    b.push(`| ${MOD_ADI[x.mod]} | ${KANAL_ADI[x.kanal]} | ${x.eylem} | ${x.modeleGiden} | **${x.aracCagiran} / ${x.eylem} (${yuzde(x.aracCagiran, x.eylem)})** | ${x.dogruArac} / ${x.eylem} (${yuzde(x.dogruArac, x.eylem)}) | ${x.kartli} | ${x.yanlisCagri} / ${x.eylemsiz} | ${x.hata} | ${(x.p50Ms / 1000).toFixed(1)} s | $${x.maliyet.toFixed(4)} |`)
  }
  b.push('', 'The rate is counted over every action sentence, so a sentence a model-free router answered before the model saw it counts as a miss.', '')
  b.push('## Per sentence', '')
  b.push('| # | pass | channel | sentence (graded turn) | expected | route | forced | offered | called | cards | ok | answer |')
  b.push('|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const s of g.satirlar) {
    b.push(`| ${s.no} | ${s.mod} | ${s.kanal} | ${hucre(s.soz)} | ${s.beklenen ?? '(none)'} | ${s.rota ?? '—'} | ${s.zorlanan ?? '—'} | ${s.sunulanArac} | ${s.cagrilan.join(', ') || '—'} | ${s.kartlar.map((k) => `${k.eylem}${k.eksik ? ` (${k.eksik} missing)` : ''}${k.uyari ? ' ⚠' : ''}`).join(', ') || '—'} | ${s.dogru ? 'yes' : '**NO**'} | ${hucre(s.hata || s.cevap).slice(0, 160)} |`)
  }
  b.push('')
  return b.join('\n')
}

/** One sentence on one channel in one pass, in a fresh scene. */
async function cumleyiKos(c: EylemCumlesi, kanal: Kanal, mod: Mod, saatDilimi: string): Promise<DenetimSatiri> {
  const s: Sahne = sahneKur()
  const hastaId = gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
  const oturum = c.hasta === 'acik' ? oturumAc(s, { id: hastaId, ad: AD }) : s.oturum
  if (mod === 'zorlamasiz') process.env.NOTYA_ARAC_ZORLAMA_KAPALI = '1'; else delete process.env.NOTYA_ARAC_ZORLAMA_KAPALI
  let cevap = '', hata = '', ms = 0
  let cagrilar: AgCagrisi[] = []
  let kartOncesi = 0
  for (const [i, soz] of c.sozler.entries()) {
    const son = i === c.sozler.length - 1
    const bas = agCagrilari.length
    kartOncesi = ortam.db.tablo('eylem_onerileri').length
    const t0 = Date.now()
    try {
      if (kanal === 'yazi') cevap = (await yazi(s, soz, { oturum, saatDilimi })).speech
      else {
        const t = await fishTur(s, soz, { oturum, saatDilimi })
        cevap = t.soz
        if (t.status !== 200 || t.hata) hata = t.hata || `HTTP ${t.status}`
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      hata = /luna_fail:[a-z_]+:[a-z_0-9]+/.exec(m)?.[0] || m.slice(0, 160)
    }
    await agOkumalariBitsin()
    if (son) { ms = Date.now() - t0; cagrilar = agCagrilari.slice(bas) }
    if (hata) break
  }
  const kartlar = ortam.db.tablo('eylem_onerileri').slice(kartOncesi).map((k) => ({
    eylem: String(k.eylem_anahtar), eksik: Array.isArray(k.eksik_alanlar) ? k.eksik_alanlar.length : 0, uyari: Array.isArray(k.uyari_detay) ? k.uyari_detay.length : 0,
  }))
  const cagrilan = cagrilar.flatMap((k) => k.araclar)
  const agHatasi = cagrilar.find((k) => k.hata)?.hata
  if (!hata && agHatasi) hata = agHatasi
  const rota = ortam.rotalar[ortam.rotalar.length - 1]?.rota ?? null
  return {
    no: c.no, kat: c.kat, kanal, mod, soz: c.sozler[c.sozler.length - 1], beklenen: c.beklenen,
    rota, modeleGitti: cagrilar.length > 0,
    zorlanan: cagrilar[0]?.zorlanan ?? null, sunulanArac: cagrilar[0]?.sunulanArac ?? 0,
    cagrilan, kartlar, cevap, ms, maliyet: cagrilar.reduce((t, k) => t + k.maliyet, 0), hata,
    dogru: dogruMu(c.beklenen, cagrilan, hata),
  }
}

/** Run the set. The guard stays disabled for the whole run and the audit switches are cleared afterwards. */
export async function eylemDenetiminiKos(g: {
  cumleler?: EylemCumlesi[]; kanallar?: Kanal[]; modlar?: Mod[]; saatDilimi?: string
  ilerleme?: (s: DenetimSatiri) => void
} = {}): Promise<DenetimSatiri[]> {
  const eskiKoruyucu = process.env.NOTYA_KORUYUCU_KAPALI
  process.env.NOTYA_KORUYUCU_KAPALI = '1'
  const satirlar: DenetimSatiri[] = []
  try {
    for (const mod of g.modlar ?? (['uretim', 'zorlamasiz'] as const)) for (const kanal of g.kanallar ?? (['yazi', 'ses'] as const)) {
      for (const c of g.cumleler ?? EYLEM_CUMLELERI) {
        const s = await cumleyiKos(c, kanal, mod, g.saatDilimi ?? 'Europe/Istanbul')
        satirlar.push(s)
        g.ilerleme?.(s)
      }
    }
  } finally {
    delete process.env.NOTYA_ARAC_ZORLAMA_KAPALI
    if (eskiKoruyucu === undefined) delete process.env.NOTYA_KORUYUCU_KAPALI; else process.env.NOTYA_KORUYUCU_KAPALI = eskiKoruyucu
  }
  return satirlar
}

/**
 * Stand-in for OpenRouter (dry run / harness test): speaks the wire format, calls the forced tool with empty
 * arguments when one is forced, answers in plain text otherwise. It is NOT a model — it proves the plumbing.
 */
export function vekilOpenRouter(govde: Record<string, any>): Response {
  const secim = govde.tool_choice
  const ad = secim && typeof secim === 'object' ? String(secim.function?.name || '') : secim === 'required' ? String(govde.tools?.[0]?.function?.name || '') : ''
  const metin = ad ? '' : JSON.stringify({ speech: 'Vekil yanıt Hocam.' })
  const usage = { prompt_tokens: 100, completion_tokens: 10, cost: 0 }
  if (govde.stream !== true) {
    const message = { role: 'assistant', content: metin || null, ...(ad ? { tool_calls: [{ id: 'call_vekil', type: 'function', function: { name: ad, arguments: '{}' } }] } : {}) }
    return new Response(JSON.stringify({ id: 'vekil', model: govde.model, choices: [{ message, finish_reason: ad ? 'tool_calls' : 'stop' }], usage }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const olay = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`
  const parcalar = [
    ad
      // the name split in two, the way a real stream may deliver it
      ? olay({ id: 'vekil', model: govde.model, choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_vekil', function: { name: ad.slice(0, 4), arguments: '' } }] } }] })
        + olay({ choices: [{ delta: { tool_calls: [{ index: 0, function: { name: ad.slice(4), arguments: '{}' } }] } }] })
      : olay({ id: 'vekil', model: govde.model, choices: [{ delta: { content: metin } }] }),
    olay({ choices: [{ delta: {}, finish_reason: ad ? 'tool_calls' : 'stop' }], usage }),
    'data: [DONE]\n\n',
  ]
  const kod = new TextEncoder()
  return new Response(new ReadableStream({ start(k) { for (const p of parcalar) k.enqueue(kod.encode(p)); k.close() } }), { status: 200, headers: { 'content-type': 'text/event-stream' } })
}
