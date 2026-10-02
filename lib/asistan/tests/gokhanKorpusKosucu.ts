/**
 * NOTYA-CHECKPOINT-KARSILASTIRMA-01 — the corpus RUNNER of today's main (NOTYA-GOKHAN-KORPUS-01), adapted to the
 * 2026-09-27 checkpoint (commit ac947eef).
 *
 * Every entry of gokhanSikayetKorpusu.ts (unchanged, byte for byte) goes through the REAL routes of this commit —
 * /api/asistan/chat, /api/doktor/konsult and, as a separate surface, the ElevenLabs Custom LLM endpoint
 * /api/asistan/ses-llm — against the in-memory scene with the same synthetic corpus panel. Same sessions, same turn
 * order, same assertions, same verdict rules (beklentiDegerlendir). The model is the real primary of this commit
 * with the guard refused at the network boundary, or a stand-in for the dry run.
 *
 * Differences from today's runner, all forced by this commit's APIs (see ayseSahne.ts):
 *   - surfaces: yazi, panel, sesllm. There is no Fish voice route; sesllm is graded with the corpus's voice
 *     expectations but is NOT the same stack as today's voice, so it is reported on its own.
 *   - route: derived (rotaCikar), not logged.
 *   - bound patient: the chat answer carries `aktifHasta` only when the sentence NAMED a patient. For an unnamed
 *     question the patient the turn was answered from is read from the chart the brain put into the model request
 *     (or, for the quick card, the session's open chart) — the same meaning today's `aktifHasta` has.
 *   - `sunucuYazar`: at this commit the server does not write the visit-measurement answer, the model does. The
 *     flag is dropped, so in a dry run those turns are "not judged" like every other model-written answer.
 *   - `geriAlDk`: there is no stored conversation-context record to age; such an entry is NEW.
 *   - NEW: checkpointYetenek.ts. A NEW turn is still run; `hamKarar` keeps what the unchanged rules said.
 *
 * This file must be imported BEFORE anything that loads a route — it installs the scene mocks (via ayseSahne).
 */
import {
  agCagrilari, agOkumalariBitsin, arkaPlanBitsin, encrypt, ortam, oturumAc, oturumBaglami, oturumMesajlari, panel, rotaCikar, sahneKur,
  sayfayaGec, sesLlm, sonAsistanMesaji, yazi, type Sahne,
} from './ayseSahne'
import { GERCEKCI_HASTA_ADI, gercekciHastaEkle } from './gercekciHasta'
import { KORPUS_ADLARI, korpusPaneliKur } from './gokhanKorpusHastalari'
import { korpusBebek } from './korpusFikstur'
import { gunEkle } from '../../../specialties/pediatri/engines/girdi'
import { bugunTRT } from '../../../core/eylemler/types'
import { eylemler } from '../../../core/eylemler/kayit'
import { yeniYetenek, type CheckpointYuzeyi } from './checkpointYetenek'
import {
  beklentiDegerlendir, korpusBaglami, oturumlaraBol, yuzeyBeklentisi,
  type Beklenti, type FiksturTarihleri, type Karar, type KorpusGirdisi, type KorpusHastasi, type TurGozlemi, type Yuzey,
} from './gokhanSikayetKorpusu'

export const TUM_ADLAR: Record<KorpusHastasi, string> = { ...KORPUS_ADLARI, deniz: GERCEKCI_HASTA_ADI }

/** The corpus surface whose entries and expectations a checkpoint surface runs. */
export const KORPUS_YUZEYI: Record<CheckpointYuzeyi, Yuzey> = { yazi: 'yazi', panel: 'panel', sesllm: 'ses' }
export const YUZEY_ADI: Record<CheckpointYuzeyi, string> = { yazi: 'chat', panel: 'panel', sesllm: 'voice-el' }

export type CheckpointKarari = Karar | 'NEW'
/** Verdict as written to the output: the dry run's "not judged" is spelled out. */
export const KARAR_ADI: Record<CheckpointKarari, string> = { PASS: 'PASS', FAIL: 'FAIL', MANUAL: 'MANUAL', NEW: 'NEW', VEKIL: 'NOT_JUDGED' }

export interface KorpusSatiri {
  id: string
  /** chat | panel | voice-el */
  surface: string
  /** PASS | FAIL | MANUAL | NEW | NOT_JUDGED (dry run only: the stand-in wrote the words) */
  verdict: string
  route: string | null
  /** What the doctor saw; on voice-el the spoken text, then the screen text when it differs. */
  answer: string
  /** live = the real primary model answered; stand-in = the dry run. */
  mode: 'live' | 'stand-in'
  kaynak: string
  kaynakDosyalari: string[]
  kat: string
  yuzey: CheckpointYuzeyi
  oturum: string | null
  /** Turns said before the graded one in this session. */
  onceki: string[]
  soz: string
  modeleGitti: boolean
  zorlanan: string | null
  cagrilan: string[]
  kartlar: { eylem: string; eksik: number; uyari: number }[]
  hasta: string | null | undefined
  /** Screen answer. */
  cevap: string
  /** Spoken answer (voice-el only). */
  sozlu: string
  karar: CheckpointKarari
  /** Verdict of the unchanged rules before the NEW classification. */
  hamKarar: Karar
  /** Why the entry is NEW at this commit, or null. */
  yeni: string | null
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

const hataOzeti = (e: unknown): string => {
  const m = e instanceof Error ? e.message : String(e)
  return m.replace(/\s+/g, ' ').slice(0, 200)
}
const cevapMetni = (yuzey: CheckpointYuzeyi, ekran: string, sozlu: string, hata: string) =>
  hata || (yuzey === 'sesllm' ? [sozlu && `🔊 ${sozlu}`, ekran && ekran !== sozlu ? `🖥 ${ekran}` : ''].filter(Boolean).join(' ') : ekran) || ''

/** One session on one surface, in a fresh scene. */
async function oturumuKos(grup: KorpusGirdisi[], yuzey: CheckpointYuzeyi, o: { vekil: boolean; eylemAnahtarlari: ReadonlySet<string> }): Promise<KorpusSatiri[]> {
  const korpusYuzeyi = KORPUS_YUZEYI[yuzey]
  const brans = grup[0].brans || 'pediatri'
  const s: Sahne = sahneKur(brans)
  // The product's own calendar day (Europe/Istanbul) — the fixture dates are relative to it.
  const bugun = bugunTRT()
  const p = korpusPaneliKur(ortam.db, encrypt, s.doktor.id, s.diger.id, bugun)
  const idler: Partial<Record<KorpusHastasi, string>> = { ...p.idler }
  // The action-audit chart joins the panel only for the sessions that use it, so every other count stays the same.
  if (grup.some((g) => g.acik === 'deniz' || g.id.startsWith('E-'))) idler.deniz = gercekciHastaEkle(ortam.db, encrypt, s.doktor.id)
  const adBul = (id: unknown): string | null => { const k = (Object.keys(idler) as KorpusHastasi[]).find((x) => idler[x] === id); return k ? TUM_ADLAR[k] : null }
  const baglam = korpusBaglami(bugun, fiksturTarihleri(bugun))
  const acik = grup[0].acik
  const oturum = acik ? oturumAc(s, { id: idler[acik]!, ad: TUM_ADLAR[acik] }, brans) : s.oturum
  let odak: string | null = acik ? idler[acik]! : null
  const gecmis: { rol: 'doktor' | 'asistan'; icerik: string }[] = []
  const soylenen: string[] = []
  const satirlar: KorpusSatiri[] = []

  /** One turn; returns what it produced. */
  const tur = async (g: KorpusGirdisi, soz: string): Promise<TurGozlemi & { zorlanan: string | null; sunulanArac: number; ms: number; maliyet: number }> => {
    const sayfaId = g.sayfa ? idler[g.sayfa]! : undefined
    if (sayfaId && yuzey !== 'panel' && odak && odak !== sayfaId) { await sayfayaGec(s, oturum, sayfaId); odak = sayfaId }
    const agBas = agCagrilari.length
    const kartBas = ortam.db.tablo('eylem_onerileri').length
    const dususBas = ortam.dususler.length
    const sdkBas = ortam.modelIstekleri.length
    const sahteBas = ortam.sahteHatalari.length
    let ekran = '', sozlu = '', hata = ''
    let adli: string | null = null
    const t0 = Date.now()
    try {
      if (yuzey === 'yazi') {
        const y = await yazi(s, soz, { oturum, brans, ...(sayfaId ? { patientId: sayfaId } : {}) })
        ekran = y.speech; adli = y.aktifHasta ?? null
      } else if (yuzey === 'sesllm') {
        // The stored history is capped, so its length cannot tell whether this turn wrote: the last message can.
        const son = () => { const m = oturumMesajlari(oturum); return m[m.length - 1] }
        const onceki = son()
        const f = await sesLlm(s, soz, { oturum, brans, patientId: sayfaId ?? null })
        sozlu = f.soz
        if (f.hata) hata = f.hata
        const yeniMesaj = son()
        if (yeniMesaj !== onceki) {
          // Same observation as today's runner: the stored message (for an identity answer it carries no value).
          ekran = sonAsistanMesaji(oturum)
          // An identity answer stores its patient with the message (the value itself is never stored or spoken).
          if (yeniMesaj?.kimlik) adli = adBul(yeniMesaj.hastaId)
        }
      } else {
        gecmis.push({ rol: 'doktor', icerik: soz })
        const r = await panel(s, idler[acik!]!, gecmis)
        ekran = r.cevap
        if (r.hata) hata = r.hata
        gecmis.push({ rol: 'asistan', icerik: r.cevap })
      }
    } catch (e) { hata = hataOzeti(e) }
    await agOkumalariBitsin()
    await arkaPlanBitsin()
    const cagrilar = agCagrilari.slice(agBas)
    // The guard is refused in this run: a turn in which the product asked for it is a failure of the primary.
    const dusus = ortam.dususler[dususBas]
    if (dusus) hata = `luna_fail:${dusus.neden}:${dusus.alt}`
    const agHatasi = cagrilar.find((k) => k.hata)?.hata
    if (!hata && agHatasi) hata = agHatasi
    if (!hata && ortam.modelIstekleri.length > sdkBas) hata = 'harness: model isteği sağlayıcı yerine SDK sahtesine gitti'
    if (!hata && ortam.sahteHatalari.length > sahteBas) hata = `harness: ${ortam.sahteHatalari[sahteBas]}`
    const rota = yuzey === 'panel' ? 'panel' : rotaCikar({ mesaj: soz, modelCagrisi: cagrilar.length > 0, ekran, ses: yuzey === 'sesllm' })
    let hasta: string | null | undefined
    if (yuzey !== 'panel') {
      // The chart an unnamed question is answered from: the session's focus, else the page's patient (sent with the request).
      const b = oturumBaglami(oturum)
      const odakAdi = (b.patientName as string | undefined) ?? adBul(b.currentPatientId ?? sayfaId) ?? null
      const dosyaAdi = cagrilar.find((k) => k.dosyaAdi)?.dosyaAdi ?? null
      // The quick card opens with the name of the chart it read ("<ad> — dosyada …").
      const kartAdi = rota === 'hizli-kart' ? (/^(.+?) — dosyada /.exec(ekran)?.[1] ?? odakAdi) : null
      hasta = adli ?? (dosyaAdi === 'aktif hasta' ? odakAdi : dosyaAdi) ?? kartAdi
      odak = (oturumBaglami(oturum).currentPatientId as string | undefined) ?? odak
    }
    return {
      yuzey: korpusYuzeyi, ekran, soz: sozlu, rota, hasta, hata,
      modeleGitti: yuzey === 'panel' || rota === 'model',
      cagrilan: cagrilar.flatMap((k) => k.araclar),
      zorlanan: (cagrilar.find((k) => k.sunulanArac > 0) ?? cagrilar[0])?.zorlanan ?? null,
      sunulanArac: cagrilar.reduce((t, k) => Math.max(t, k.sunulanArac), 0),
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
    if (!g.yuzeyler.includes(korpusYuzeyi)) continue
    const gozlem: TurGozlemi = { ...r, hata: r.hata || kurulumHatasi }
    const hamBeklenti = yuzeyBeklentisi(g, korpusYuzeyi)
    let beklenti: Beklenti | 'MANUAL' = hamBeklenti === 'MANUAL' ? 'MANUAL' : { ...hamBeklenti, sunucuYazar: false }
    // Dry run: today a recognised command forces its tool BY NAME, so the stand-in "calls" it and the call is
    // structural. At this commit the tools are offered and the model chooses (a record verb forces only "any tool").
    // Which tool is called is then the model's own answer: with a stand-in it is not judged, like the words.
    const aracModelin = o.vekil && beklenti !== 'MANUAL' && r.modeleGitti && r.sunulanArac > 0
      && (beklenti.arac !== undefined || beklenti.kart !== undefined) && !(beklenti.arac && r.zorlanan === beklenti.arac)
    if (aracModelin && beklenti !== 'MANUAL') { const { arac: _a, kart: _k, kartUyari: _u, ...kalan } = beklenti; beklenti = kalan }
    const sonuc = beklentiDegerlendir(beklenti, gozlem, baglam, TUM_ADLAR, { vekil: o.vekil })
    const nedenler = sonuc.nedenler
    const hamKarar: Karar = aracModelin && sonuc.karar === 'PASS' ? 'VEKIL' : sonuc.karar
    const yeni = yeniYetenek(g, hamBeklenti, yuzey, o.eylemAnahtarlari)
    const karar: CheckpointKarari = yeni ? 'NEW' : hamKarar
    satirlar.push({
      id: g.id, surface: YUZEY_ADI[yuzey], verdict: KARAR_ADI[karar], route: r.rota, answer: cevapMetni(yuzey, r.ekran, r.soz, gozlem.hata),
      mode: o.vekil ? 'stand-in' : 'live',
      kaynak: g.kaynak.map((k) => `${k.dosya}: ${k.kimlik}`).join('; '), kaynakDosyalari: [...new Set(g.kaynak.map((k) => k.dosya))],
      kat: g.kat, yuzey, oturum: g.oturum ?? null, onceki, soz: g.soz,
      modeleGitti: r.modeleGitti, zorlanan: r.zorlanan, cagrilan: r.cagrilan, kartlar: r.kartlar, hasta: r.hasta,
      cevap: r.ekran, sozlu: r.soz, karar, hamKarar, yeni, nedenler, acikKusur: g.acikKusur ?? null, not: g.not ?? null,
      ms: r.ms, maliyet: r.maliyet, hata: gozlem.hata,
    })
  }
  return satirlar
}

const TUM_YUZEYLER: readonly CheckpointYuzeyi[] = ['yazi', 'sesllm', 'panel']

/** Run the corpus on this commit's surfaces. */
export async function korpusuKos(girdiler: KorpusGirdisi[], o: { yuzeyler?: CheckpointYuzeyi[]; vekil?: boolean; ilerleme?: (s: KorpusSatiri) => void } = {}): Promise<KorpusSatiri[]> {
  const eylemAnahtarlari = new Set(eylemler().map((e) => e.anahtar))
  const satirlar: KorpusSatiri[] = []
  for (const grup of oturumlaraBol(girdiler)) {
    const yuzeyler = TUM_YUZEYLER.filter((y) => (!o.yuzeyler || o.yuzeyler.includes(y)) && grup.some((g) => g.yuzeyler.includes(KORPUS_YUZEYI[y])))
    for (const yuzey of yuzeyler) {
      const s = await oturumuKos(grup, yuzey, { vekil: Boolean(o.vekil), eylemAnahtarlari })
      for (const x of s) { satirlar.push(x); o.ilerleme?.(x) }
    }
  }
  return satirlar
}

export type Sayim = Record<CheckpointKarari, number> & { toplam: number }
const bosSayim = (): Sayim => ({ PASS: 0, FAIL: 0, MANUAL: 0, NEW: 0, VEKIL: 0, toplam: 0 })

export function ozetle(satirlar: KorpusSatiri[]): { toplam: Sayim; yuzey: Record<string, Sayim> } {
  const toplam = bosSayim()
  const yuzey: Record<string, Sayim> = {}
  for (const s of satirlar) {
    toplam[s.karar]++; toplam.toplam++
    const h = (yuzey[s.surface] ??= bosSayim())
    h[s.karar]++; h.toplam++
  }
  return { toplam, yuzey }
}
