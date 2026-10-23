/**
 * AU-CANLI-02 — the assistant page's bubbles use Türkiye's ordering engine (lib/asistan/balonSirasi.ts). These are the
 * NOTYA-SES-SIRA-03 scenarios, run through the page's three events: whatever order the provider delivers them in, the
 * doctor's line is in front of the answer it caused, the greeting stays first, nothing is doubled.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sohbetOku, sohbetYaz } from '@/lib/asistan/sohbetGecmisi'
import { ekranCevabi, saklanacak, saklidan, sesAsistani, selamEkle, sesKullanicisi, yaziliEkle, yeniCagri, type BalonSayaci, type SohbetBalon } from './balonlar'

const bos = (): { l: SohbetBalon[]; s: BalonSayaci } => ({ l: [], s: { sira: 0 } })
const yazi = (l: readonly SohbetBalon[]) => l.map((b) => `${b.role === 'user' ? 'U' : 'A'}:${b.text}`)

describe('assistant page bubbles: order (NOTYA-SES-SIRA-03)', () => {
  it('normal order: greeting, question, spoken fragment replaced by the full answer', () => {
    const { s } = bos()
    let l: SohbetBalon[] = []
    l = selamEkle(l, 'Hello Doctor.', s)
    l = sesKullanicisi(l, 'What is the adult dose?', 1, s)
    l = sesAsistani(l, 'The dose is five milligrams.', s)
    l = ekranCevabi(l, 'The dose is five milligrams.\n- detail', s)
    assert.deepEqual(yazi(l), ['A:Hello Doctor.', 'U:What is the adult dose?', 'A:The dose is five milligrams.\n- detail'])
    assert.ok(!l.some((b) => b.gecici))
  })

  it('the screen answer arrives BEFORE the doctor transcript: the question still goes in front of it', () => {
    const { s } = bos()
    let l: SohbetBalon[] = []
    l = selamEkle(l, 'Hello Doctor.', s)
    l = ekranCevabi(l, 'Five milligrams, once a day, with food and a long enough sentence.', s)
    l = sesKullanicisi(l, 'What is the dose?', 2, s)
    assert.deepEqual(yazi(l), ['A:Hello Doctor.', 'U:What is the dose?', 'A:Five milligrams, once a day, with food and a long enough sentence.'])
  })

  it('a second turn whose answer comes first (poll-style, no event id on it) is ordered too', () => {
    const { s } = bos()
    let l: SohbetBalon[] = []
    l = selamEkle(l, 'Hello.', s)
    l = sesKullanicisi(l, 'First question', 1, s)
    l = ekranCevabi(l, 'First answer, a complete sentence for the first question.', s)
    l = ekranCevabi(l, 'Second answer arrives before the second question was transcribed.', s)
    l = sesKullanicisi(l, 'Second question', 2, s)
    assert.deepEqual(yazi(l), ['A:Hello.', 'U:First question', 'A:First answer, a complete sentence for the first question.', 'U:Second question', 'A:Second answer arrives before the second question was transcribed.'])
  })

  it('the same transcript twice makes one bubble; fragments of one turn join one provisional bubble', () => {
    const { s } = bos()
    let l: SohbetBalon[] = []
    l = sesKullanicisi(l, 'Hi', 1, s)
    l = sesKullanicisi(l, 'Hi', 1, s)
    l = sesAsistani(l, 'One.', s)
    l = sesAsistani(l, 'Two.', s)
    assert.deepEqual(yazi(l), ['U:Hi', 'A:One. Two.'])
    assert.equal(l[1].gecici, true)
  })

  it('typed lines go last, and settle a spoken fragment that never got its full answer', () => {
    const { s } = bos()
    let l: SohbetBalon[] = []
    l = sesKullanicisi(l, 'Spoken', 1, s)
    l = sesAsistani(l, 'Spoken reply.', s)
    l = yaziliEkle(l, 'user', 'Typed question', s)
    l = yaziliEkle(l, 'ai', 'Typed answer', s)
    assert.deepEqual(yazi(l), ['U:Spoken', 'A:Spoken reply.', 'U:Typed question', 'A:Typed answer'])
    assert.ok(!l.some((b) => b.gecici))
  })

  it('event ids of an earlier call never order the next one (NOTYA-SES-KULLANICI-BALON-01)', () => {
    const { s } = bos()
    let l: SohbetBalon[] = []
    l = sesKullanicisi(l, 'Old question', 7, s)
    l = ekranCevabi(l, 'Old answer that is long enough to be a real answer.', s)
    l = yeniCagri(l)
    assert.ok(l.every((b) => b.olay == null))
    l = sesKullanicisi(l, 'New question', 1, s)
    assert.equal(yazi(l).at(-1), 'U:New question')
  })
})

describe('assistant page bubbles: history', () => {
  it('keeps the last 50 and restores them in order, without provisional bubbles', () => {
    const { s } = bos()
    let l: SohbetBalon[] = []
    for (let i = 1; i <= 60; i++) l = yaziliEkle(l, i % 2 ? 'user' : 'ai', `line ${i}`, s)
    l = sesAsistani(l, 'half spoken', s)
    assert.ok(l.length <= 50)
    const depo = new Map<string, string>()
    const sahte = { getItem: (k: string) => depo.get(k) ?? null, setItem: (k: string, v: string) => { depo.set(k, v) } } as unknown as Storage
    sohbetYaz('au_acc_kadin', saklanacak(l), [], sahte)
    const geri = saklidan(sohbetOku('au_acc_kadin', sahte).ses)
    assert.equal(geri.liste.length, l.filter((b) => !b.gecici).length)
    assert.equal(geri.liste.at(-1)?.text, 'line 60')
    assert.ok(geri.sira >= 60)
  })
})
