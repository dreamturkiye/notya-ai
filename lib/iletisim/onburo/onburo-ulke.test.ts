/**
 * WHATSAPP-ONBURO-01 — the English front-desk pack in its five country forms: booking intent (phrasings, typos, negation
 * and question guards, no false positive on cancel / reschedule), day and part-of-day wishes (day-first and month-first
 * dates), the medical and emergency guards with each country's own emergency number, the deterministic sheet rules with
 * each country's payer words, the name check — and the shared answer function (lib/iletisim/onburo/bilgi.ts) run with
 * English text and an injected model: grounded answer, missing field, a cited key that does not exist, guards before the
 * model, model failure, and no patient data in the prompt. Pure; synthetic text only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { bilgiNormalize } from '@/lib/iletisim/onburo/ayar'
import { bilgiYaniti, modelYanitiCoz, MODEL_SISTEM, type ModelIstemi } from '@/lib/iletisim/onburo/bilgi'
import { bilgiDuzle } from '@/lib/iletisim/onburo/ayar'
import { slotSec } from '@/lib/iletisim/onburo/slot'
import { ON_BURO_PAKETLERI } from '@/countries/tumu'
import { enRandevuKelimesiMi } from '@/countries/_dil/en/onBuro'

const { au: AU_ON_BURO, ca: CA_ON_BURO, gb: GB_ON_BURO, nz: NZ_ON_BURO, us: US_ON_BURO } = ON_BURO_PAKETLERI
const PAKETLER = { au: AU_ON_BURO, ca: CA_ON_BURO, gb: GB_ON_BURO, nz: NZ_ON_BURO, us: US_ON_BURO }
const dil = GB_ON_BURO
/** Thursday 12 November 2026, 09:00 UTC. */
const SIMDI = new Date('2026-11-12T09:00:00Z')

describe('emergency number and fixed sentences per country', () => {
  const NUMARA = { au: '000', nz: '111', gb: '999', us: '911', ca: '911' } as const
  for (const [kod, p] of Object.entries(PAKETLER)) {
    it(`${kod}: ${NUMARA[kod as keyof typeof NUMARA]} — taken from the pack's own setting, in both fixed sentences`, () => {
      const n = NUMARA[kod as keyof typeof NUMARA]
      assert.equal(p.acilNumara, n)
      assert.ok(p.metin.acil.includes(`call ${n} now`), p.metin.acil)
      assert.ok(p.metin.tibbi.includes(`call ${n}`), p.metin.tibbi)
      for (const baska of ['000', '111', '999', '911', '112', '103'].filter((x) => x !== n)) assert.ok(!p.metin.acil.includes(baska) && !p.metin.tibbi.includes(baska), `${kod} names ${baska}`)
      assert.ok(!/[çğıöşüİ]/.test(JSON.stringify([p.metin.acil, p.metin.tibbi, p.metin.bekleme, p.metin.adSor, p.metin.oneri(['x'], true), p.alanEtiketi])), 'no Turkish text')
    })
  }
  it('the form of English follows the country (spelling handled by the language set)', () => {
    assert.equal(US_ON_BURO.kod, 'en-US')
    assert.equal(AU_ON_BURO.kod, 'en-AU')
    assert.match(US_ON_BURO.zamanEtiketi('2026-11-20T19:30:00Z', 'America/New_York'), /Friday, November 20, 2:30\sPM/)
    assert.match(GB_ON_BURO.zamanEtiketi('2026-11-20T14:30:00Z', 'Europe/London'), /Friday(,)? 20 November, 14:30/)
  })
})

describe('booking intent', () => {
  const istek = [
    'I would like to book an appointment', "I'd like an appointment please", 'Can I make an appointment?', 'can i book an appt for tomorrow', 'Need an appointment',
    'APPOINTMENT', 'appointment please', 'new appointment', 'Could I get an appointment next week', 'Do you have any availability?', 'any appointments on Tuesday?',
    'When can I come in?', 'Can I see the doctor this week', 'I need to see the doctor', 'Hi, looking to book an appointment', 'book me in please', 'next available appointment please',
    'is there an appointment available on friday',
  ]
  for (const m of istek) it(`"${m}" → booking wish`, () => assert.equal(dil.randevuNiyeti(m), 'istek'))
  for (const m of ['can i book an apointment', 'i need an appoinment', 'want to make an appointmnt', 'book an appontment please']) it(`typo "${m}" → booking wish`, () => assert.equal(dil.randevuNiyeti(m), 'istek'))
  it('typo tolerance is narrow', () => {
    assert.ok(enRandevuKelimesiMi('appointment') && enRandevuKelimesiMi('appt') && enRandevuKelimesiMi('apointments'))
    assert.ok(!enRandevuKelimesiMi('apartment') && !enRandevuKelimesiMi('application') && !enRandevuKelimesiMi('appoint'))
  })
  const degil = [
    "I don't want an appointment", 'no need for an appointment', 'I do not need an appointment anymore', 'maybe I will book an appointment later', 'thinking about making an appointment',
    'When is my appointment?', 'what time is my appointment', 'Do I have an appointment tomorrow?', 'is my appointment confirmed', 'I booked an appointment last week', 'I already have an appointment',
    'How much is an appointment?', 'how do I book an appointment', 'where do I go for my appointment',
    'I need to cancel my appointment', 'cancel appointment', 'Can I reschedule my appointment?', 'please move my appointment to Friday', "I can't make my appointment", 'change my appointment please',
  ]
  for (const m of degil) it(`"${m}" → NOT a booking wish`, () => assert.notEqual(dil.randevuNiyeti(m), 'istek'))
  it('unrelated, empty and very long messages → nothing', () => {
    for (const m of ['hello', 'thanks so much', '', '👍', 'is there parking']) assert.equal(dil.randevuNiyeti(m), 'yok', m)
    assert.equal(dil.randevuNiyeti('I would like an appointment because ' + 'it has been a long time and '.repeat(4)), 'yok')
  })
})

describe('day / part of day and picks', () => {
  const TZ = 'Europe/London'
  it('tomorrow, weekdays, written dates', () => {
    assert.equal(dil.tercih('tomorrow please', SIMDI, TZ)?.gun, '2026-11-13')
    assert.equal(dil.tercih('Tuesday works', SIMDI, TZ)?.gun, '2026-11-17')
    assert.equal(dil.tercih('tues', SIMDI, TZ)?.gun, '2026-11-17')
    assert.equal(dil.tercih('20 November', SIMDI, TZ)?.gun, '2026-11-20')
    assert.equal(dil.tercih('the 20th of nov', SIMDI, TZ)?.gun, '2026-11-20')
    assert.equal(dil.tercih('November 20th', SIMDI, TZ)?.gun, '2026-11-20')
    assert.equal(dil.tercih('5 January', SIMDI, TZ)?.gun, '2027-01-05', 'a day already past this year is next year')
  })
  it('numeric dates: day first everywhere, month first in the United States', () => {
    assert.equal(GB_ON_BURO.tercih('3/12', SIMDI, TZ)?.gun, '2026-12-03')
    assert.equal(AU_ON_BURO.tercih('3/12', SIMDI, 'Australia/Sydney')?.gun, '2026-12-03')
    assert.equal(US_ON_BURO.tercih('12/3', SIMDI, 'America/New_York')?.gun, '2026-12-03')
  })
  it('"today" follows the practice time zone, not the server', () => {
    const an = new Date('2026-11-12T22:30:00Z')
    assert.equal(NZ_ON_BURO.tercih('today', an, 'Pacific/Auckland')?.gun, '2026-11-13')
    assert.equal(US_ON_BURO.tercih('today', an, 'America/Los_Angeles')?.gun, '2026-11-12')
  })
  it('morning / afternoon / another day / later', () => {
    assert.equal(dil.tercih('morning is best', SIMDI, TZ)?.dilim, 'sabah')
    assert.equal(dil.tercih('after work', SIMDI, TZ)?.dilim, 'ogleden_sonra')
    assert.equal(dil.tercih("none of those work, another day?", SIMDI, TZ)?.baskaGun, true)
    assert.equal(dil.tercih('anything later?', SIMDI, TZ)?.dahaGec, true)
    assert.equal(dil.tercih('anything sooner', SIMDI, TZ)?.dahaErken, true)
    assert.deepEqual(dil.tercih('tomorrow morning', SIMDI, TZ), { dilim: 'sabah', gun: '2026-11-13' })
    assert.equal(dil.tercih('thank you', SIMDI, TZ), null)
  })
  it('a pick is a bare 1/2/3 (or first / second / third)', () => {
    assert.equal(dil.secim('1'), 1); assert.equal(dil.secim('2.'), 2); assert.equal(dil.secim('Option 3 please'), 3); assert.equal(dil.secim('the second one'), 2)
    assert.equal(dil.secim('4'), null); assert.equal(dil.secim('12'), null); assert.equal(dil.secim('1 person'), null)
  })
  it('the shared chooser offers one time per day', () => {
    const s = (gun: string, saat: string) => ({ gun, saat, bas: `${gun}T${saat}:00Z`, son: `${gun}T${saat}:30Z` })
    assert.deepEqual(slotSec({ slotlar: [s('2026-11-13', '09:00'), s('2026-11-13', '10:00'), s('2026-11-16', '09:00'), s('2026-11-17', '15:00')] }).secilen.map((x) => x.gun), ['2026-11-13', '2026-11-16', '2026-11-17'])
  })
})

describe('medical and emergency guards', () => {
  const acil = ['I have chest pain', 'pain in my chest', "I can't breathe", 'my son is not breathing', 'she is struggling to breathe', 'bleeding heavily', "it won't stop bleeding", 'I want to kill myself', 'feeling suicidal', 'he is having a seizure', 'she passed out and is unresponsive', 'I think it is a stroke', 'took too many tablets', 'his throat is closing', 'EMERGENCY']
  for (const m of acil) it(`emergency: "${m}"`, () => assert.equal(dil.acilMi(m), true))
  const tibbi = ['my daughter has a fever of 39, what should I do', 'should I take the antibiotics with food', 'can I take ibuprofen with this medication', 'is 5 ml the right dose', 'are my blood test results normal', 'I am pregnant, is this safe', 'my baby is not feeding', 'I have a rash', 'my knee hurts', 'need a repeat prescription', 'is this normal?']
  for (const m of tibbi) it(`medical: "${m}"`, () => assert.equal(dil.tibbiMi(m), true))
  const degil = ['is there parking', 'what is your address', 'are you open on Saturday', 'do you take card', 'I would like an appointment', 'thank you', 'which floor are you on']
  for (const m of degil) it(`neither: "${m}"`, () => { assert.equal(dil.tibbiMi(m), false); assert.equal(dil.acilMi(m), false) })
})

describe('sheet rules, questions and names', () => {
  it('obvious questions go to the right field', () => {
    assert.deepEqual(dil.bilgiAlanlari('What is your address?'), ['adres'])
    assert.deepEqual(dil.bilgiAlanlari('Is there parking?'), ['otopark'])
    assert.deepEqual(dil.bilgiAlanlari('How much does a visit cost'), ['ucretler'])
    assert.deepEqual(dil.bilgiAlanlari('are you open on saturdays'), ['calismaSaatleri'])
    assert.deepEqual(dil.bilgiAlanlari('Do you take card?'), ['odeme'])
    assert.deepEqual(dil.bilgiAlanlari('what should I bring'), ['getirilecekler'])
    assert.deepEqual(dil.bilgiAlanlari('do I need to prepare for my follow up'), ['hazirlik.kontrol'])
    assert.deepEqual(dil.bilgiAlanlari('hello'), [])
  })
  it("each country's own payer words reach its own pack only", () => {
    assert.deepEqual(AU_ON_BURO.bilgiAlanlari('do you bulk bill'), ['ucretler'])
    assert.deepEqual(AU_ON_BURO.bilgiAlanlari('can I claim on Medicare'), ['sigorta'])
    assert.deepEqual(GB_ON_BURO.bilgiAlanlari('is this on the NHS'), ['sigorta'])
    assert.deepEqual(US_ON_BURO.bilgiAlanlari('are you in network'), ['sigorta'])
    assert.deepEqual(CA_ON_BURO.bilgiAlanlari('is it covered by OHIP'), ['sigorta'])
    assert.deepEqual(NZ_ON_BURO.bilgiAlanlari('is this an ACC visit'), ['sigorta'])
    assert.deepEqual(GB_ON_BURO.bilgiAlanlari('do you bulk bill'), [])
    assert.deepEqual(AU_ON_BURO.bilgiAlanlari('is this on the nhs'), [])
  })
  it('question or chatter', () => {
    for (const m of ['Do you have wifi?', 'is there a lift', 'can you tell me about access', 'I was wondering about wheelchair access']) assert.equal(dil.soruMu(m), true, m)
    for (const m of ['thanks', 'see you then', 'ok great', 'that is fine']) assert.equal(dil.soruMu(m), false, m)
  })
  it('a full name is two to four words of letters; a greeting or a wish is not a name', () => {
    assert.equal(dil.adSoyad('alex morgan'), 'Alex Morgan')
    assert.equal(dil.adSoyad("My name is Siobhán O'Neill."), "Siobhán O'Neill")
    for (const m of ['Alex', 'thank you', 'good morning', 'book appointment', 'Alex 2', 'yes please', 'see you soon']) assert.equal(dil.adSoyad(m), null, m)
  })
})

describe('answers from the practice sheet (shared function, English text, injected model)', () => {
  const BILGI = bilgiNormalize({
    adres: '12 QA Street, Level 3', harita: 'https://maps.example.test/qa', otopark: 'Paid parking under the building.', odeme: 'Card and cash.',
    sss: [{ soru: 'Can someone come with me?', yanit: 'Yes, one support person can wait in the waiting room.' }],
  })
  const model = (yanit: string | (() => never)) => {
    const istemler: ModelIstemi[] = []
    return { istemler, f: async (i: ModelIstemi) => { istemler.push(i); if (typeof yanit === 'function') return yanit(); return yanit } }
  }
  it('a rule answers straight from the sheet; the model is not asked', async () => {
    const m = model('{"alanlar":[],"yanit":null}')
    const y = await bilgiYaniti({ soru: 'Is there parking?', bilgi: BILGI, dil, model: m.f })
    assert.equal(y.tur, 'yanit'); assert.equal(y.kaynak, 'kural'); assert.equal(y.metin, 'Parking: Paid parking under the building.'); assert.equal(m.istemler.length, 0)
  })
  it('a missing field (no fees entered) → holding reply, nothing invented', async () => {
    const m = model('{"alanlar":["ucretler"],"yanit":"A visit is 90."}')
    const y = await bilgiYaniti({ soru: 'How much is a visit?', bilgi: BILGI, dil, model: m.f })
    assert.equal(y.tur, 'cevapsiz'); assert.equal(y.neden, 'alan_bos'); assert.equal(y.metin, dil.metin.bekleme); assert.equal(m.istemler.length, 0)
  })
  it('a grounded model answer goes out; the prompt holds the question and the sheet only', async () => {
    const m = model('{"alanlar":["sss.0"],"yanit":"Yes, one support person can wait in the waiting room."}')
    const y = await bilgiYaniti({ soru: 'Can my mum come along?', modelSorusu: 'Can my mum come along?', bilgi: BILGI, dil, model: m.f })
    assert.equal(y.tur, 'yanit'); assert.equal(y.kaynak, 'model'); assert.deepEqual(y.alanlar, ['sss.0'])
    assert.equal(m.istemler[0].system, MODEL_SISTEM)
    assert.match(m.istemler[0].kullanici, /^SHEET:\n\{[\s\S]*\}\n\nQUESTION:\nCan my mum come along\?$/)
  })
  it('a cited key that does not exist, an empty field, broken output, "no answer" and a failure → holding reply', async () => {
    for (const [ham, neden] of [['{"alanlar":["wifi"],"yanit":"Yes"}', 'model_gecersiz'], ['{"alanlar":["ucretler"],"yanit":"90"}', 'model_gecersiz'], ['sorry', 'model_gecersiz'], ['{"alanlar":[],"yanit":null}', 'model_cevapsiz']] as const) {
      const y = await bilgiYaniti({ soru: 'Do you have wifi?', bilgi: BILGI, dil, model: model(ham).f })
      assert.equal(y.tur, 'cevapsiz', ham); assert.equal(y.neden, neden, ham)
    }
    const y = await bilgiYaniti({ soru: 'Do you have wifi?', bilgi: BILGI, dil, model: model(() => { throw new Error('timeout') }).f })
    assert.equal(y.neden, 'model_hata')
  })
  it('the guards answer before the model: medical → fixed sentence, emergency → fixed sentence with the number', async () => {
    const m = model('{"alanlar":["adres"],"yanit":"x"}')
    assert.equal((await bilgiYaniti({ soru: 'my son has a fever, what should I do?', bilgi: BILGI, dil, model: m.f })).metin, dil.metin.tibbi)
    assert.equal((await bilgiYaniti({ soru: "I can't breathe", bilgi: BILGI, dil: AU_ON_BURO, model: m.f })).metin, AU_ON_BURO.metin.acil)
    assert.equal(m.istemler.length, 0)
  })
  it('a number, a link or medical wording the doctor did not write is dropped in favour of the doctor\'s own text', () => {
    const alanlar = bilgiDuzle(BILGI)
    assert.equal(modelYanitiCoz('{"alanlar":["otopark"],"yanit":"Parking is 25 an hour."}', alanlar, dil)?.metin, 'Paid parking under the building.')
    assert.equal(modelYanitiCoz('{"alanlar":["adres"],"yanit":"See https://evil.example/x"}', alanlar, dil)?.metin, '12 QA Street, Level 3')
    assert.equal(modelYanitiCoz('{"alanlar":["otopark"],"yanit":"Yes. Take paracetamol for the pain."}', alanlar, dil)?.metin, 'Paid parking under the building.')
  })
})
