/**
 * NOTYA-ULKE-ASISTAN-01 — /api/ulke/asistan: a DOCTOR asks the assistant, reads their own conversations and deletes one.
 *
 *   GET                         200 { durum: { asistanVar, limit, kalan, soruAzami, hastaModu }, konusmalar: [{ id, baslik, hastaId, hastaAdi, rol, guncellendi }] }
 *                               the caller's history, newest first
 *   GET    ?hasta=<hastaId>     the same, only the conversations about that patient
 *   GET    ?id=<konusmaId>      200 { konusma: { id, baslik, hastaId, hastaAdi, rol, guncellendi, surdurulebilir, mesajlar: [{ id, yazan, metin, kesik, olusturuldu }] } }
 *   POST   { soru, konusmaId?, hastaId? }
 *                               200, a STREAM of lines (application/x-ndjson), one JSON value per line:
 *                                 { t: 'parca', m }                                   a piece of the answer, as it is written
 *                                 { t: 'son', konusmaId, yeniKonusma, kesildi, kaydedildi }   the last line of an answer
 *                                 { t: 'hata', code: 'BASARISIZ' }                    the stream broke after it began
 *                               `konusmaId` continues a conversation; `hastaId` begins one ABOUT that patient.
 *                               Everything that refuses a question is answered BEFORE the stream begins, as a code:
 *   DELETE ?id=<konusmaId>      200 { ok: true }     the conversation and its messages are removed
 *
 *   404 { code: 'NOT_FOUND' }    no such conversation or patient FOR THIS DOCTOR (another doctor's: exactly the same),
 *                                a malformed id, the patient mode is off, or the country has no assistant
 *   422 { code: 'BOS' | 'UZUN' } no question, or one longer than the pack allows
 *   409 { code: 'ASISTAN_YOK' }  the account has no role yet, or its role has no assistant in the account's form
 *   409 { code: 'ROL_DEGISTI' }  the conversation began with another role's assistant: it is read, not continued
 *   409 { code: 'KONUSMA_DOLU' } the conversation is full; a new one is begun
 *   429 { code: 'LIMIT' }        the day's ceiling is reached
 *   502 { code: 'CEVAP_YOK' }    the model gave no answer at all (nothing is kept)
 *   401 { code: 'OTURUM_YOK' }   500 { code: 'BASARISIZ' }
 *
 * A DOCTOR'S SESSION ONLY (the bearer token of the sign-in service). PATIENT ISOLATION: every id from the request is
 * matched against the authenticated doctor before anything is read, written or sent to the model with it
 * (lib/ulke/asistan/konusma.ts). NOTHING IS SENT TO A PATIENT from here. Codes only — never a sentence, never an
 * error's own text.
 */
import { NextRequest } from 'next/server'
import { rotaButcesiMs } from '@/lib/ai/cagir'
import { ulkeOturum } from '@/lib/ulke/sunucuOturum'
import { sinirda } from '@/lib/ulke/uygulama/sinir'
import { cevap, govdeOku, KOD, uuidMi } from '@/lib/ulke/uygulama/cevap'
import { aktifAsistan, asistanDurumu, konusmaGetir, konusmaListesi, konusmaSil, soruSor, type SoruRetKodu, type SoruSonucu } from '@/lib/ulke/asistan/konusma'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const DURUM: Record<SoruRetKodu, number> = { NOT_FOUND: 404, BOS: 422, UZUN: 422, ASISTAN_YOK: 409, ROL_DEGISTI: 409, KONUSMA_DOLU: 409, LIMIT: 429, CEVAP_YOK: 502, BASARISIZ: 500 }
/** An id a request may leave out: absent → null; anything that is not an id → 'x', which no row has. */
const secmeliId = (ham: unknown): string | null => (ham === undefined || ham === null || ham === '' ? null : uuidMi(ham) ? ham : 'x')

export const GET = sinirda('asistan GET', async (req: NextRequest) => {
  const icerik = aktifAsistan()
  if (!icerik) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const p = req.nextUrl.searchParams
  if (p.has('id')) {
    const id = p.get('id')
    if (!uuidMi(id)) return KOD.yok()
    const konusma = await konusmaGetir(oturum.supabase, oturum.user.id, id)
    return konusma ? cevap({ konusma }) : KOD.yok()
  }
  const hasta = p.has('hasta') ? p.get('hasta') : null
  if (p.has('hasta') && !uuidMi(hasta)) return KOD.yok()
  const konusmalar = await konusmaListesi(oturum.supabase, oturum.user.id, hasta)
  if (!konusmalar) return KOD.yok()
  return cevap({ durum: await asistanDurumu(oturum.supabase, oturum.user.id, icerik), konusmalar })
})

export const POST = sinirda('asistan POST', async (req: NextRequest) => {
  const icerik = aktifAsistan()
  if (!icerik) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const g = await govdeOku(req)
  const konusmaId = secmeliId(g.konusmaId)
  const hastaId = secmeliId(g.hastaId)
  if (konusmaId === 'x' || hastaId === 'x') return KOD.yok()

  const kodla = new TextEncoder()
  let akis!: ReadableStreamDefaultController<Uint8Array>
  const govde = new ReadableStream<Uint8Array>({ start(d) { akis = d } })
  const satir = (deger: Record<string, unknown>) => { try { akis.enqueue(kodla.encode(`${JSON.stringify(deger)}\n`)) } catch { /* the reader has gone: the answer is still kept */ } }
  // The first thing that happens decides the answer: a piece of text → the stream; a refusal → a code and a status.
  let ilkOlay!: (o: 'parca' | SoruSonucu) => void
  const ilk = new Promise<'parca' | SoruSonucu>((coz) => { ilkOlay = coz })
  void soruSor(oturum.supabase, oturum.user.id, { konusmaId, hastaId, soru: g.soru }, (m) => { satir({ t: 'parca', m }); ilkOlay('parca') }, icerik, { butceMs: rotaButcesiMs(maxDuration) })
    .then((r) => {
      if (r.tamam) satir({ t: 'son', konusmaId: r.konusmaId, yeniKonusma: r.yeniKonusma, kesildi: r.kesildi, kaydedildi: r.kaydedildi })
      else satir({ t: 'hata', code: r.kod })
      ilkOlay(r)
    })
    .catch((e: unknown) => {
      console.error(`[ulke/sinir] asistan POST (stream): ${e instanceof Error ? e.name : typeof e}`)
      satir({ t: 'hata', code: 'BASARISIZ' })
      ilkOlay({ tamam: false, kod: 'BASARISIZ' })
    })
    .finally(() => { try { akis.close() } catch { /* already closed */ } })

  const o = await ilk
  if (o !== 'parca' && !o.tamam) return cevap({ code: o.kod }, DURUM[o.kod])
  return new Response(govde, { status: 200, headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } })
})

export const DELETE = sinirda('asistan DELETE', async (req: NextRequest) => {
  if (!aktifAsistan()) return KOD.yok()
  const oturum = await ulkeOturum(req)
  if (!oturum) return KOD.oturumYok()
  const id = req.nextUrl.searchParams.get('id')
  if (!uuidMi(id)) return KOD.yok()
  const r = await konusmaSil(oturum.supabase, oturum.user.id, id)
  if (r === null) return KOD.basarisiz()
  return r ? cevap({ ok: true }) : KOD.yok()
})
