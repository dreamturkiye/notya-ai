/**
 * NOTYA-CHECKPOINT-KARSILASTIRMA-01 — the checkpoint harness checks ITSELF (no model, no network, seconds).
 *
 *   npm run denetim:korpus:checkpoint:sinama
 *
 * What the corpus numbers rest on, each proven here on a few entries:
 *   1. the route derivation names the step that answered (kimlik / hizli-kart / arama / model) on chat and voice-el;
 *   2. the bound patient of a named question is the chart the brain put into the model request;
 *   3. an identity value is on screen and never in the spoken text of the ElevenLabs endpoint;
 *   4. the guard is refused: when the primary gives nothing the turn FAILS with luna_fail and the request for the
 *      guard model never leaves the process;
 *   5. an entry that expects a later capability is NEW, and its raw verdict is kept.
 * Not part of `npm test` — it is not a *.test.ts file.
 */
import { agCagrilari, encrypt, gercekModelAc, ortam, oturumAc, sahneHazirla, sahneKur, sesEkrani, sesLlm, sonAsistanMesaji, vekilOpenRouter } from './ayseSahne'
import { before, it } from 'node:test'
import assert from 'node:assert/strict'
import { bugunTRT } from '../../../core/eylemler/types'
import { KORPUS_ADLARI, korpusPaneliKur } from './gokhanKorpusHastalari'
import { korpusuKos, type KorpusSatiri } from './gokhanKorpusKosucu'
import { korpusYukle } from './gokhanSikayetKorpusu'

before(async () => { await sahneHazirla() })

const bul = (s: KorpusSatiri[], id: string, surface: string) => {
  const r = s.find((x) => x.id === id && x.surface === surface)
  assert.ok(r, `${id}/${surface} koşmadı`)
  return r
}

it('route, bound patient and identity privacy on chat and voice-el (stand-in)', async () => {
  assert.equal(gercekModelAc(vekilOpenRouter), true)
  const s = await korpusuKos(korpusYukle({ idler: ['L-KIMLIK-ANNE', 'L-1TO1-YAS', 'L-SAYIM-ANDA', 'L-HASTA-01'] }), { vekil: true })
  for (const yuzey of ['chat', 'voice-el']) {
    assert.equal(bul(s, 'L-KIMLIK-ANNE', yuzey).route, 'kimlik')
    assert.equal(bul(s, 'L-1TO1-YAS', yuzey).route, 'hizli-kart')
    assert.equal(bul(s, 'L-SAYIM-ANDA', yuzey).route, 'arama')
    const model = bul(s, 'L-HASTA-01', yuzey)
    assert.equal(model.route, 'model')
    assert.equal(model.hasta, 'Emircan Karaoğlu')
    // The stand-in wrote the words: not judged, never PASS.
    assert.equal(model.verdict, 'NOT_JUDGED')
    assert.equal(bul(s, 'L-KIMLIK-ANNE', yuzey).hasta, 'Emircan Karaoğlu')
    assert.equal(bul(s, 'L-1TO1-YAS', yuzey).hasta, 'Emircan Karaoğlu')
  }
  // Chat shows the value; the voice endpoint neither speaks nor stores it.
  assert.match(bul(s, 'L-KIMLIK-ANNE', 'chat').cevap, /Elif/)
  const sesKimlik = bul(s, 'L-KIMLIK-ANNE', 'voice-el')
  assert.doesNotMatch(sesKimlik.cevap, /Elif/)
  assert.doesNotMatch(sesKimlik.sozlu, /Elif/)
  assert.ok(sesKimlik.sozlu.length > 0)
  assert.ok(s.every((x) => x.mode === 'stand-in'))
})

it('voice-el: the page\'s screen poll rebuilds the identity value the stored message does not carry', async () => {
  assert.equal(gercekModelAc(vekilOpenRouter), true)
  const s = sahneKur()
  const p = korpusPaneliKur(ortam.db, encrypt, s.doktor.id, s.diger.id, bugunTRT())
  const oturum = oturumAc(s, { id: p.idler.bebek, ad: KORPUS_ADLARI.bebek })
  const t = await sesLlm(s, 'Annesinin adı ne?', { oturum })
  assert.equal(t.status, 200)
  assert.doesNotMatch(t.soz, /Elif/)
  assert.doesNotMatch(sonAsistanMesaji(oturum), /Elif/)
  assert.match(await sesEkrani(s, oturum), /Elif/)
})

it('the guard is refused: a primary that answers nothing is a failure of the turn', async () => {
  // A provider that returns an empty completion on every request, in both wire shapes.
  const bos = (govde: Record<string, any>) => govde.stream === true
    ? new Response('data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n', { status: 200, headers: { 'content-type': 'text/event-stream' } })
    : new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: '' }, finish_reason: 'stop' }] }), { status: 200, headers: { 'content-type': 'application/json' } })
  assert.equal(gercekModelAc(bos), true)
  const bas = agCagrilari.length
  const s = await korpusuKos(korpusYukle({ idler: ['L-HASTA-01'] }), { vekil: false })
  for (const yuzey of ['chat', 'voice-el']) {
    const r = bul(s, 'L-HASTA-01', yuzey)
    assert.equal(r.verdict, 'FAIL')
    assert.match(r.hata, /^luna_fail:(low_conf|transport):/)
  }
  const koruyucu = agCagrilari.slice(bas).filter((k) => k.koruyucu)
  assert.ok(koruyucu.length >= 2, 'koruyucu isteği kaydedilmedi')
  assert.ok(koruyucu.every((k) => k.durum === 403), 'koruyucu isteği reddedilmedi')
})

it('an entry that expects a later capability is NEW and keeps its raw verdict', async () => {
  assert.equal(gercekModelAc(vekilOpenRouter), true)
  const s = await korpusuKos(korpusYukle({ idler: ['C-6', 'R-KAPSAM', 'E-25', 'T-089'] }), { vekil: true, yuzeyler: ['yazi'] })
  assert.match(bul(s, 'C-6', 'chat').yeni || '', /takvim/)
  assert.match(bul(s, 'R-KAPSAM', 'chat').yeni || '', /refusal/)
  assert.match(bul(s, 'E-25', 'chat').yeni || '', /randevu_iptal/)
  assert.match(bul(s, 'T-089', 'chat').yeni || '', /conversation-context/)
  for (const id of ['C-6', 'R-KAPSAM', 'E-25', 'T-089']) {
    const r = bul(s, id, 'chat')
    assert.equal(r.verdict, 'NEW')
    assert.ok(['PASS', 'FAIL', 'VEKIL', 'MANUAL'].includes(r.hamKarar))
  }
})
