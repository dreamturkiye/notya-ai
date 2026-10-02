/**
 * NOTYA-GOKHAN-KORPUS-01 — the corpus RUNNER.
 *
 * Every entry of lib/asistan/tests/gokhanSikayetKorpusu.ts goes through the REAL routes — /api/asistan/chat,
 * /api/asistan/fish-tur (transcript given as text) and, for the patient-file panel, /api/doktor/konsult — against
 * the in-memory scene with the synthetic corpus panel. Same approach as the action audit (eylemDenetimi.ts): the
 * model is the real primary through OpenRouter with the guard disabled (NOTYA_KORUYUCU_KAPALI=1), or a stand-in
 * for the dry run. Nothing is read from or written to production.
 *
 * One session per `oturum` and per surface, in a fresh scene; the turns of a session run in file order. What is
 * recorded per graded turn: the route that answered, the forced tool, the tools the model called (from the wire),
 * the cards the server made, the patient the turn was bound to, the answer, latency, cost and the verdict.
 *
 * This file must be imported BEFORE anything that loads a route — it installs the scene mocks (via ayseSahne).
 */
import {
  agCagrilari, agOkumalariBitsin, encrypt, fishTur, ortam, oturumAc, oturumBaglami, panel, sahneKur, sonAsistanMesaji, yazi,
  type Sahne,
} from './ayseSahne'
import { GERCEKCI_HASTA_ADI, gercekciHastaEkle } from './gercekciHasta'
import { KORPUS_ADLARI, korpusPaneliKur } from './gokhanKorpusHastalari'
import { korpusBebek } from '../dosyaSorgu/denetim/fikstur'
import { bugunTz } from '../../randevu/tarihCozumle'
import { fishMetni } from '../fishSes'
import { gunEkle } from '../../../specialties/pediatri/engines/girdi'
import {
  KAPSAM_DISI_SIKAYETLER, KORPUS_KAYNAKLARI, beklentiDegerlendir, korpusBaglami, oturumlaraBol, yuzeyBeklentisi,
  type FiksturTarihleri, type Karar, type KorpusGirdisi, type KorpusHastasi, type TurGozlemi, type Yuzey,
} from './gokhanSikayetKorpusu'

export const TUM_ADLAR: Record<KorpusHastasi, string> = { ...KORPUS_ADLARI, deniz: GERCEKCI_HASTA_ADI }

export interface KorpusSatiri {
  id: string
  /** "file: id; file: id". */
  kaynak: string
  kaynakDosyalari: string[]
  kat: string
  yuzey: Yuzey
  oturum: string | null
  /** Turns said before the graded one in this session (earlier entries and the entry's own set-up turns). */
  onceki: string[]
  soz: string
  rota: string | null
  modeleGitti: boolean
  zorlanan: string | null
  cagrilan: string[]
  kartlar: { eylem: string; eksik: number; uyari: number }[]
  hasta: string | null | undefined
  /** Screen answer. */
  cevap: string
  /** Spoken answer (voice only). */
  sozlu: string
  karar: Karar
  nedenler: string[]
  acikKusur: string | null
  not: string | null
  ms: number
  maliyet: number
  hata: string
}

export const fiksturTarihleri = (bugunIso: string): FiksturTarihleri => {
  const b = korpusBebek(bugunIso)
  const gun = (iso: string | null | undefined) => String(iso || '').slice(0, 10)
  return {
    pDogum: gun(b.hasta.dogumIso),
    pKkk: gun(b.asilar?.find((a) => String(a.asi_adi).startsWith('KKK'))?.uygulama_tarihi),
    pRandevu: gun(b.randevular?.[0]?.baslangic),
    pSonVizit: gun(b.vizitler[b.vizitler.length - 1].tarih),
    pSonLab: [...(b.lablar || [])].map((l) => gun(l.numune_tarihi)).sort().pop() || '',
    aVizit: gunEkle(bugunIso, -8),
  }
}

let oturumHastaRotasi: { POST: (r: any) => Promise<Response> } | null = null
/** The doctor opens a patient's page while a shared session exists: the browser calls this route once. */
async function sayfayaGec(s: Sahne, oturum: string, patientId: string): Promise<void> {
  oturumHastaRotasi ??= await import('../../../app/api/asistan/oturum-hasta/route')
  const { NextRequest } = await import('next/server')
  await oturumHastaRotasi.POST(new NextRequest('http://localhost/api/asistan/oturum-hasta', {
    method: 'POST', headers: { authorization: `Bearer ${s.doktor.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ asistanSessionId: oturum, patientId }),
  } as ConstructorParameters<typeof NextRequest>[1]))
}

function konusmayiEskit(oturum: string, dakika: number): void {
  const k = (oturumBaglami(oturum) as { konusma?: { zaman?: string } }).konusma
  if (k?.zaman) k.zaman = new Date(Date.parse(k.zaman) - dakika * 60_000).toISOString()
}

const hataOzeti = (e: unknown): string => {
  const m = e instanceof Error ? e.message : String(e)
  return /luna_fail:[a-z_]+:[a-z_0-9]+/.exec(m)?.[0] || m.replace(/\s+/g, ' ').slice(0, 200)
}

/** One session on one surface, in a fresh scene. */
async function oturumuKos(grup: KorpusGirdisi[], yuzey: Yuzey, o: { saatDilimi: string; vekil: boolean }): Promise<KorpusSatiri[]> {
  const brans = grup[0].brans || 'pediatri'
  const s = sahneKur(brans)
  const bugun = bugunTz(o.saatDilimi)
  const p = korpusPaneliKur(ortam.db, encrypt, s.doktor.id, s.diger.id, bugun)
  const idler: Partial<Record<KorpusHastasi, string>> = { ...p.idler }
  // The action-audit chart joins the panel only for the sessions that use it, so every other count stays the same.
  if (grup.some((g) => g.acik === 'deniz' || g.id.startsWith('E-'))) idler.deniz = gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
  const baglam = korpusBaglami(bugun, fiksturTarihleri(bugun))
  const acik = grup[0].acik
  const oturum = acik ? oturumAc(s, { id: idler[acik]!, ad: TUM_ADLAR[acik] }, brans) : s.oturum
  let odak: string | null = acik ? idler[acik]! : null
  const gecmis: { rol: 'doktor' | 'asistan'; icerik: string }[] = []
  const soylenen: string[] = []
  const satirlar: KorpusSatiri[] = []

  /** One turn; returns what it produced. */
  const tur = async (g: KorpusGirdisi, soz: string): Promise<TurGozlemi & { zorlanan: string | null; ms: number; maliyet: number }> => {
    const sayfaId = g.sayfa ? idler[g.sayfa]! : undefined
    if (sayfaId && yuzey !== 'panel' && odak && odak !== sayfaId) { await sayfayaGec(s, oturum, sayfaId); odak = sayfaId }
    if (g.geriAlDk) konusmayiEskit(oturum, g.geriAlDk)
    const agBas = agCagrilari.length
    const kartBas = ortam.db.tablo('eylem_onerileri').length
    const rotaBas = ortam.rotalar.length
    let ekran = '', sozlu = '', hata = '', rota: string | null = null
    let hasta: string | null | undefined
    const t0 = Date.now()
    try {
      if (yuzey === 'yazi') {
        const y = await yazi(s, soz, { oturum, saatDilimi: o.saatDilimi, brans, ...(sayfaId ? { patientId: sayfaId } : {}) })
        ekran = y.speech; rota = y.rota; hasta = y.aktifHasta ?? null
      } else if (yuzey === 'ses') {
        // The stored history is capped, so its length cannot tell whether this turn wrote: the last message can.
        const sonMesaj = () => { const m = (ortam.db.tablo('asistan_sessions').find((x) => x.id === oturum)?.messages || []) as unknown[]; return m[m.length - 1] }
        const onceki = sonMesaj()
        const f = await fishTur(s, soz, { oturum, saatDilimi: o.saatDilimi, brans, ...(sayfaId ? { patientId: sayfaId } : {}) })
        sozlu = f.soz
        if (f.status !== 200 || f.hata) hata = f.hata || `HTTP ${f.status}`
        rota = ortam.rotalar.length > rotaBas ? ortam.rotalar[ortam.rotalar.length - 1].rota : null
        // The voice gate ends a turn before the brain: recogniser noise is dropped (the same outcome as the brain's
        // own `gurultu` route), an unfinished utterance is held for the next clip.
        const kapi = f.olaylar.find((e) => e.t === 'atlandi' || e.t === 'bekle')
        if (kapi && !rota) {
          if (kapi.t === 'atlandi') rota = 'gurultu'
          else hata = hata || `ses: yarım söz bekletildi (${kapi.neden || 'bekle'}) — tur beyne gitmedi`
        }
        ekran = sonMesaj() !== onceki ? sonAsistanMesaji(oturum) : ''
        // Voice reports no bound patient on the wire: the session's focus after the turn is what the next turn sees.
        hasta = (oturumBaglami(oturum).patientName as string | undefined) ?? null
      } else {
        gecmis.push({ rol: 'doktor', icerik: soz })
        const r = await panel(s, idler[acik!]!, gecmis)
        ekran = r.cevap; rota = 'panel'; hasta = undefined
        if (r.hata) hata = r.hata
        gecmis.push({ rol: 'asistan', icerik: r.cevap })
      }
    } catch (e) { hata = hataOzeti(e) }
    await agOkumalariBitsin()
    const cagrilar = agCagrilari.slice(agBas)
    const agHatasi = cagrilar.find((k) => k.hata)?.hata
    if (!hata && agHatasi) hata = agHatasi
    if (yuzey !== 'panel') odak = (oturumBaglami(oturum).currentPatientId as string | undefined) ?? odak
    return {
      yuzey, ekran, soz: sozlu, rota, hasta, hata, ...(yuzey === 'ses' ? { okunus: fishMetni(sozlu) } : {}),
      modeleGitti: yuzey === 'panel' || rota === 'model',
      cagrilan: cagrilar.flatMap((k) => k.araclar),
      zorlanan: (cagrilar.find((k) => k.sunulanArac > 0) ?? cagrilar[0])?.zorlanan ?? null,
      kartlar: ortam.db.tablo('eylem_onerileri').slice(kartBas).map((k) => ({
        eylem: String(k.eylem_anahtar), eksik: Array.isArray(k.eksik_alanlar) ? k.eksik_alanlar.length : 0, uyari: Array.isArray(k.uyari_detay) ? k.uyari_detay.length : 0,
      })),
      ms: Date.now() - t0, maliyet: cagrilar.reduce((t, k) => t + k.maliyet, 0),
    }
  }

  for (const g of grup) {
    let kurulumHatasi = ''
    for (const k of g.kurulum || []) {
      const r = await tur(g, k)
      soylenen.push(k)
      if (r.hata && !kurulumHatasi) kurulumHatasi = `kurulum turu "${k}": ${r.hata}`
    }
    const onceki = [...soylenen]
    const r = await tur(g, g.soz)
    soylenen.push(g.soz)
    // An entry that is not on this surface still spoke its turn (the session needs it); it is not graded here.
    if (!g.yuzeyler.includes(yuzey)) continue
    const gozlem: TurGozlemi = { ...r, hata: r.hata || kurulumHatasi }
    const { karar, nedenler } = beklentiDegerlendir(yuzeyBeklentisi(g, yuzey), gozlem, baglam, TUM_ADLAR, { vekil: o.vekil })
    satirlar.push({
      id: g.id, kaynak: g.kaynak.map((k) => `${k.dosya}: ${k.kimlik}`).join('; '), kaynakDosyalari: [...new Set(g.kaynak.map((k) => k.dosya))],
      kat: g.kat, yuzey, oturum: g.oturum ?? null, onceki, soz: g.soz,
      rota: r.rota, modeleGitti: r.modeleGitti, zorlanan: r.zorlanan, cagrilan: r.cagrilan, kartlar: r.kartlar, hasta: r.hasta,
      cevap: r.ekran, sozlu: r.soz, karar, nedenler, acikKusur: g.acikKusur ?? null, not: g.not ?? null,
      ms: r.ms, maliyet: r.maliyet, hata: gozlem.hata,
    })
  }
  return satirlar
}

/** Run the corpus. The guard stays disabled for the whole run and the switch is restored afterwards. */
export async function korpusuKos(girdiler: KorpusGirdisi[], o: { yuzeyler?: Yuzey[]; saatDilimi?: string; vekil?: boolean; ilerleme?: (s: KorpusSatiri) => void } = {}): Promise<KorpusSatiri[]> {
  const eskiKoruyucu = process.env.NOTYA_KORUYUCU_KAPALI
  process.env.NOTYA_KORUYUCU_KAPALI = '1'
  const satirlar: KorpusSatiri[] = []
  try {
    for (const grup of oturumlaraBol(girdiler)) {
      const yuzeyler = (['yazi', 'ses', 'panel'] as const).filter((y) => (!o.yuzeyler || o.yuzeyler.includes(y)) && grup.some((g) => g.yuzeyler.includes(y)))
      for (const yuzey of yuzeyler) {
        const s = await oturumuKos(grup, yuzey, { saatDilimi: o.saatDilimi ?? 'Europe/Istanbul', vekil: Boolean(o.vekil) })
        for (const x of s) { satirlar.push(x); o.ilerleme?.(x) }
      }
    }
  } finally {
    if (eskiKoruyucu === undefined) delete process.env.NOTYA_KORUYUCU_KAPALI; else process.env.NOTYA_KORUYUCU_KAPALI = eskiKoruyucu
  }
  return satirlar
}

/* ───────────────────────────── summary and report ───────────────────────────── */

export type Sayim = Record<Karar, number> & { toplam: number }
const bosSayim = (): Sayim => ({ PASS: 0, FAIL: 0, MANUAL: 0, VEKIL: 0, toplam: 0 })

export function ozetle(satirlar: KorpusSatiri[]): { toplam: Sayim; yuzey: Record<string, Sayim>; kaynak: Record<string, Sayim>; kat: Record<string, Sayim>; rota: Record<string, Sayim> } {
  const toplam = bosSayim()
  const yuzey: Record<string, Sayim> = {}, kaynak: Record<string, Sayim> = {}, kat: Record<string, Sayim> = {}, rota: Record<string, Sayim> = {}
  const ekle = (h: Record<string, Sayim>, k: string, s: KorpusSatiri) => { (h[k] ??= bosSayim())[s.karar]++; h[k].toplam++ }
  for (const s of satirlar) {
    toplam[s.karar]++; toplam.toplam++
    ekle(yuzey, s.yuzey, s)
    ekle(kat, s.kat, s)
    ekle(rota, s.rota ?? '(yok)', s)
    // A turn counts once under each source FILE it came from.
    for (const d of s.kaynakDosyalari) ekle(kaynak, d, s)
  }
  return { toplam, yuzey, kaynak, kat, rota }
}

const YUZEY_ADI: Record<Yuzey, string> = { yazi: 'chat', ses: 'voice', panel: 'panel' }
const KARAR_ADI: Record<Karar, string> = { PASS: 'PASS', FAIL: '**FAIL**', MANUAL: 'MANUAL', VEKIL: 'not judged' }
const hucre = (m: string, n = 200) => { const t = String(m || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n)}…` : t }
const aracKart = (s: KorpusSatiri) => [
  s.zorlanan ? `forced ${s.zorlanan}` : '',
  s.cagrilan.length ? `called ${s.cagrilan.join(', ')}` : '',
  s.kartlar.length ? `card ${s.kartlar.map((k) => `${k.eylem}${k.eksik ? ` (${k.eksik} missing)` : ''}${k.uyari ? ' ⚠' : ''}`).join(', ')}` : '',
].filter(Boolean).join('; ') || '—'
const cevapMetni = (s: KorpusSatiri) => s.hata || (s.yuzey === 'ses' ? [s.sozlu && `🔊 ${s.sozlu}`, s.cevap && s.cevap !== s.sozlu ? `🖥 ${s.cevap}` : ''].filter(Boolean).join(' ') : s.cevap) || '(empty)'

/** The markdown report. Synthetic patients only — the answers may be committed. */
export function korpusRaporu(g: { tarih: string; model: string; satirlar: KorpusSatiri[]; girdiSayisi: number; kuru?: boolean; filtre?: string }): string {
  const o = ozetle(g.satirlar)
  const b: string[] = []
  const tablo = (baslik: string, h: Record<string, Sayim>) => {
    b.push(`| ${baslik} | turns | PASS | FAIL | MANUAL |${g.kuru ? ' not judged |' : ''}`, `|---|---|---|---|---|${g.kuru ? '---|' : ''}`)
    for (const [k, s] of Object.entries(h).sort((a, c) => a[0].localeCompare(c[0]))) b.push(`| ${k} | ${s.toplam} | ${s.PASS} | ${s.FAIL ? `**${s.FAIL}**` : 0} | ${s.MANUAL} |${g.kuru ? ` ${s.VEKIL} |` : ''}`)
    b.push('')
  }
  b.push(`# Dr. Gökhan complaint corpus — regression run (${g.tarih})`, '')
  if (g.kuru) {
    b.push('**DRY RUN — a stand-in answered instead of the model. The live run against Luna was NOT done.**', '',
      'What this run does prove: the harness, the corpus loader, the assertions, and every turn that a MODEL-FREE handler answered (identity, calendar, count, record tables, quick card, scope gate, chart open) — those answers are the product\'s own and are graded in full. What it cannot say anything about: any answer the model writes. Those turns are "not judged" unless something structural failed (route, forced tool, card, bound patient).', '')
  } else {
    b.push(`Model: \`${g.model}\`, guard disabled (\`NOTYA_KORUYUCU_KAPALI=1\`). Harness: \`lib/asistan/tests/gokhanKorpus.kos.ts\` — real routes, in-memory scene, synthetic patients. Nothing was read from or written to production.`, '')
  }
  if (g.filtre) b.push(`Filter: ${g.filtre}`, '')
  b.push(`Corpus: ${g.girdiSayisi} entries, ${g.satirlar.length} graded turns (an entry is graded once per surface it lists). Voice = \`/api/asistan/fish-tur\` with the transcript given as text: Fish ASR, TTS and turn-taking are not exercised.`, '')
  b.push('## Summary', '')
  tablo('surface', Object.fromEntries(Object.entries(o.yuzey).map(([k, v]) => [YUZEY_ADI[k as Yuzey], v])))
  b.push(`Total: ${o.toplam.toplam} turns — ${o.toplam.PASS} PASS, ${o.toplam.FAIL} FAIL, ${o.toplam.MANUAL} MANUAL${g.kuru ? `, ${o.toplam.VEKIL} not judged (stand-in)` : ''}.`, '')
  b.push('### By source', '')
  tablo('source', o.kaynak)
  b.push('A turn is counted under every source file it cites, so the rows add up to more than the total.', '')
  b.push('### By category', '')
  tablo('category', o.kat)
  b.push('### By route that answered', '')
  tablo('route', o.rota)

  const fail = g.satirlar.filter((s) => s.karar === 'FAIL')
  const yeni = fail.filter((s) => !s.acikKusur), bilinen = fail.filter((s) => s.acikKusur)
  const failTablosu = (liste: KorpusSatiri[]) => {
    b.push('| id | surface | sentence | source | route | tool / card | why | answer |', '|---|---|---|---|---|---|---|---|')
    for (const s of liste) b.push(`| ${s.id} | ${YUZEY_ADI[s.yuzey]} | ${hucre(s.soz, 120)}${s.onceki.length ? ` *(after: ${hucre(s.onceki.slice(-3).join(' → '), 120)})*` : ''} | ${hucre(s.kaynak, 160)} | ${s.rota ?? '—'} | ${hucre(aracKart(s), 120)} | ${hucre(s.nedenler.join('; '), 220)} | ${hucre(cevapMetni(s), 260)} |`)
    b.push('')
  }
  b.push(`## FAIL — ${yeni.length} turn(s)`, '')
  if (yeni.length) failTablosu(yeni); else b.push('None.', '')
  if (bilinen.length) {
    b.push(`## FAIL on a defect the ledger already lists as OPEN — ${bilinen.length} turn(s)`, '')
    b.push(`Not new regressions: ${[...new Set(bilinen.map((s) => s.acikKusur))].join(', ')}.`, '')
    failTablosu(bilinen)
  }
  const manuel = g.satirlar.filter((s) => s.karar === 'MANUAL')
  b.push(`## MANUAL — ${manuel.length} turn(s), to be read by a person`, '')
  if (manuel.length) {
    b.push('| id | surface | sentence | route | why manual | answer |', '|---|---|---|---|---|---|')
    for (const s of manuel) b.push(`| ${s.id} | ${YUZEY_ADI[s.yuzey]} | ${hucre(s.soz, 120)} | ${s.rota ?? '—'} | ${hucre(s.not || '', 220)} | ${hucre(cevapMetni(s), 300)} |`)
    b.push('')
  }
  b.push('## Every turn', '')
  b.push('| id | source | surface | sentence | route | tool / card | patient | verdict | answer |', '|---|---|---|---|---|---|---|---|---|')
  for (const s of g.satirlar) b.push(`| ${s.id} | ${hucre(s.kaynak, 110)} | ${YUZEY_ADI[s.yuzey]} | ${hucre(s.soz, 110)} | ${s.rota ?? '—'} | ${hucre(aracKart(s), 90)} | ${s.hasta === undefined ? 'n/a' : s.hasta ?? '—'} | ${KARAR_ADI[s.karar]} | ${hucre(cevapMetni(s), 180)} |`)
  b.push('')
  b.push('## Sources', '')
  for (const k of KORPUS_KAYNAKLARI) b.push(`- \`${k.dosya}\` — ${k.ne}`)
  b.push('', '## Live complaints that are not a sentence to Ayşe (not in the corpus)', '')
  for (const k of KAPSAM_DISI_SIKAYETLER) b.push(`- ${k.kaynak} — ${k.neden}`)
  b.push('')
  return b.join('\n')
}
