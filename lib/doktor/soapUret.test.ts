/**
 * NOTYA-NOT-HIZ-01 — note generation 1:45 → ~35 s: derived Turkish prose columns, two parallel calls (body + advisory)
 * on one cached system prefix, advisory failure never blocks the note. NOTYA-NOT-HIZ-03: advisory delivered separately
 * (oneriAyri), body length rule. Fake SDK client — no network, no model.
 * Synthetic QA data only.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

delete process.env.OPENROUTER_API_KEY
delete process.env.NEXT_PUBLIC_SUPABASE_URL

import { ONERI_TOKEN_TAVANI, SoapCiktiHatasi, oneriyiBirlestir, soapKurallari, soapNotuUret, soapSistemBloklari, turkceBolumleriTuret, type SoapOnerisi } from './soapUret'

type Istek = { system?: { type: string; text: string; cache_control?: unknown }[]; messages: { content: string }[]; max_tokens: number }
type Cagri = { tur: 'A' | 'B'; istek: Istek; basladi: number; coz: (v: unknown) => void; reddet: (e: unknown) => void; bitti: boolean }

let cagrilar: Cagri[] = []
let saat = 0
const sahteIstemci = {
  messages: {
    create: (istek: Istek) => new Promise((coz, reddet) => {
      const metin = istek.messages[0].content
      const c: Cagri = { tur: metin.includes('(A) NOT GÖVDESİ JSON') ? 'A' : 'B', istek, basladi: saat++, coz, reddet, bitti: false }
      c.coz = (v) => { c.bitti = true; coz(v) }
      c.reddet = (e) => { c.bitti = true; reddet(e) }
      cagrilar.push(c)
    }),
  },
}
const cevap = (o: unknown) => ({ content: [{ type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o) }], usage: {} })
const bekle = (ms = 0) => new Promise((r) => setTimeout(r, ms))
async function ikiCagriyiBekle() { for (let i = 0; i < 50 && cagrilar.length < 2; i++) await bekle(1) }
const cagri = (tur: 'A' | 'B') => { const c = cagrilar.find((x) => x.tur === tur); assert.ok(c, `${tur} çağrısı yok`); return c }

const SUBJEKTIF = 'Şikayet: 3 gündür öksürük.\nŞikayetin Hikayesi: Geceleri artıyor, ateş yok.\nÖzgeçmiş: Özellik yok.'
const GOVDE = {
  basvuruYakinmasi: 'Öksürük',
  soap: { subjektif: SUBJEKTIF, objektif: 'Genel durum: iyi, koopere.\nSolunum: eşit katılımlı, ral yok.', degerlendirme: '1. Akut bronşit', plan: '1. Bol sıvı\n2. 1 hafta sonra kontrol' },
  vitaller: { ates: 36.8 },
  ilaclar: [],
  asilar: [],
  icd10_codes: [{ code: 'J20.9', description: 'Acute bronchitis', description_tr: 'Akut bronşit', is_primary: true }],
  takip_suresi: '1 hafta',
  ai_confidence: 0.88,
  aiDegerlendirme: 'GÖVDE ÇAĞRISI BUNU YAZMAMALIYDI',
}
const ONERI = {
  aiDegerlendirme: 'Öneri (doktor onayına tabi): astım ayırıcı tanıda düşünülebilir.',
  receteOnerisi: [],
  kritik_bulgular: ['Solunum sıkıntısı gelişirse değerlendirilmeli'],
  alarmBulgulari: ['Şu durumlarda doktorunuz ile temas kurun: nefes darlığı. Acil bir durumda acil servise başvurun.'],
  hasta_ozeti: 'Akut bronşit saptandı; bol sıvı önerildi, 1 hafta sonra kontrol.',
  soap: { subjektif: 'ÖNERİ ÇAĞRISI GÖVDE YAZMAMALI' },
}
const GIRDI = { transcript: 'Sentetik: 3 gündür öksürük, geceleri artıyor, ateş yok. Bol sıvı, bir hafta sonra kontrol.', specialty: 'dahiliye', klinikBaglam: 'Yaş: 40. Alerji: SENTETIK-ALERJI-7Q' }

beforeEach(() => { cagrilar = []; saat = 0 })

describe('turkceBolumleriTuret', () => {
  it('anamnez = subjektif (etiketler korunur), fizik_muayene = objektif, tani = degerlendirme, tedavi = plan', () => {
    const t = turkceBolumleriTuret(GOVDE.soap)
    assert.equal(t.anamnez, SUBJEKTIF)
    assert.match(String(t.anamnez), /^Şikayet: .*\nŞikayetin Hikayesi: .*\nÖzgeçmiş: /)
    assert.equal(t.fizik_muayene, GOVDE.soap.objektif)
    assert.equal(t.tani, '1. Akut bronşit')
    assert.equal(t.tedavi, GOVDE.soap.plan)
  })
  it('boş / yalnız boşluk / eksik bölüm → null', () => {
    assert.deepEqual(turkceBolumleriTuret({ subjektif: '', objektif: '   ', degerlendirme: undefined }), { anamnez: null, fizik_muayene: null, tani: null, tedavi: null })
    assert.deepEqual(turkceBolumleriTuret(undefined), { anamnez: null, fizik_muayene: null, tani: null, tedavi: null })
    assert.deepEqual(turkceBolumleriTuret(null), { anamnez: null, fizik_muayene: null, tani: null, tedavi: null })
  })
})

describe('JSON sözleşmesi', () => {
  it('model anamnez / fizik_muayene / tani / tedavi alanlarını artık yazmaz; iki ayrı JSON (A gövde, B öneri)', () => {
    for (const k of [soapKurallari(true), soapKurallari(false), soapKurallari(false, true)]) {
      for (const alan of ['"anamnez"', '"fizik_muayene"', '"tani"', '"tedavi"']) assert.ok(!k.includes(alan), alan)
      assert.ok(k.includes('(A) NOT GÖVDESİ') && k.includes('(B) AI ÖNERİSİ'))
      assert.ok(k.includes('EN ÖNEMLİ KURAL — NOT GÖVDESİ vs AI ÖNERİSİ'))
    }
  })
  it('sabit blok önbellekli ve hasta bağlamı içermez; hasta bağlamı, hekim adı, çek listesi önbelleksiz blokta', () => {
    const [sabit, degisken] = soapSistemBloklari({ ...GIRDI, doktorAdi: 'Dr. Sentetik', cekListeBlogu: 'ÇEK-LİSTE-SENTETİK', stilProfili: 'PROFIL-SENTETIK' })
    assert.equal(sabit.onbellek, true)
    assert.ok(!degisken.onbellek)
    assert.ok(sabit.metin.includes('DAHİLİYE SİSTEM KİLİDİ'))
    for (const x of ['SENTETIK-ALERJI-7Q', 'Dr. Sentetik', 'ÇEK-LİSTE-SENTETİK', 'PROFIL-SENTETIK']) {
      assert.ok(!sabit.metin.includes(x), x)
      assert.ok(degisken.metin.includes(x), x)
    }
    // aynı branş + yaş eksenleri → aynı önbellek öneki (başka hasta, başka hekim)
    assert.equal(soapSistemBloklari({ transcript: 'x', specialty: 'dahiliye', klinikBaglam: 'başka' })[0].metin, sabit.metin)
  })
})

describe('soapNotuUret — paralel iki çağrı', () => {
  it('iki çağrı da ikisinden biri bitmeden başlar; aynı system öneki, ilk blok cache_control taşır', async () => {
    const sonuc = soapNotuUret(GIRDI, { istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    assert.equal(cagrilar.length, 2)
    assert.deepEqual(cagrilar.map((c) => c.tur).sort(), ['A', 'B'])
    assert.ok(cagrilar.every((c) => !c.bitti), 'ikinci çağrı birincinin bitmesini beklememeli')
    const [a, b] = [cagri('A'), cagri('B')]
    assert.deepEqual(a.istek.system, b.istek.system)
    assert.deepEqual(a.istek.system?.[0].cache_control, { type: 'ephemeral' })
    assert.equal(a.istek.system?.[1].cache_control, undefined)
    assert.ok(a.istek.messages[0].content.includes(GIRDI.transcript) && b.istek.messages[0].content.includes(GIRDI.transcript))
    b.coz(cevap(ONERI)); a.coz(cevap(GOVDE))
    await sonuc
  })

  it('A + B birleşir: gövde A\'dan, öneri alanları yalnız B\'den; Türkçe bölümler türetilir', async () => {
    const sonuc = soapNotuUret(GIRDI, { istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('A').coz(cevap(GOVDE)); cagri('B').coz(cevap(ONERI))
    const n = await sonuc
    assert.equal(n.soap?.subjektif, SUBJEKTIF)
    assert.equal(n.basvuruYakinmasi, 'Öksürük')
    assert.equal(n.ai_confidence, 0.88)
    assert.equal(n.aiDegerlendirme, ONERI.aiDegerlendirme)
    assert.equal(n.hasta_ozeti, ONERI.hasta_ozeti)
    assert.deepEqual(n.alarmBulgulari, ONERI.alarmBulgulari)
    assert.deepEqual(n.kritik_bulgular, ONERI.kritik_bulgular)
    assert.equal(n.anamnez, SUBJEKTIF)
    assert.equal(n.fizik_muayene, GOVDE.soap.objektif)
    assert.equal(n.tani, '1. Akut bronşit')
    assert.equal(n.tedavi, n.soap?.plan)
  })

  it('B hata verirse not A ile kaydedilir, öneri alanları boş', async () => {
    const sonuc = soapNotuUret(GIRDI, { istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('B').reddet(Object.assign(new Error('529 overloaded'), { status: 529 }))
    cagri('A').coz(cevap(GOVDE))
    const n = await sonuc
    assert.equal(n.soap?.degerlendirme, '1. Akut bronşit')
    assert.equal(n.tani, '1. Akut bronşit')
    for (const k of ['aiDegerlendirme', 'receteOnerisi', 'kritik_bulgular', 'alarmBulgulari', 'hasta_ozeti'] as const) assert.equal(n[k], undefined, k)
  })

  it('B ayrıştırılamazsa (F3) ham metin gösterilmez, öneri alanları boş', async () => {
    const sonuc = soapNotuUret(GIRDI, { istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('B').coz(cevap('bu JSON değil'))
    cagri('A').coz(cevap(GOVDE))
    const n = await sonuc
    assert.equal(n.aiDegerlendirme, undefined)
    assert.ok(!JSON.stringify(n).includes('bu JSON değil'))
  })

  it('kesik A JSON\'u eskisi gibi kurtarılır; B kesikse de kurtarılan kısım kullanılır', async () => {
    const sonuc = soapNotuUret(GIRDI, { istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('A').coz(cevap(JSON.stringify({ soap: GOVDE.soap, ilaclar: [{ ad: 'X' }, { ad: 'Y' }] }).slice(0, -12)))
    cagri('B').coz(cevap(JSON.stringify(ONERI).slice(0, -30)))
    const n = await sonuc
    assert.equal(n.soap?.subjektif, SUBJEKTIF)
    assert.equal(n.anamnez, SUBJEKTIF)
    assert.equal(n.aiDegerlendirme, ONERI.aiDegerlendirme)
  })

  // NOTYA-AYSE-GERI-07 (PR 12): the advisory cap counts reasoning tokens — 2000 was spent before the JSON began.
  it('gövde çağrısına uzunluk kuralı gider (NOT-HIZ-03); maxTokens A 8000, B 6000', async () => {
    const sonuc = soapNotuUret(GIRDI, { istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    const [a, b] = [cagri('A'), cagri('B')]
    const govdeMesaji = a.istek.messages[0].content
    assert.match(govdeMesaji, /UZUNLUK KURALI \(kesin\)/)
    for (const parca of ['TEKRAR YOK', 'YALNIZ muayene edilen sistemleri', 'her madde TEK satır', '1.200-1.800 token', 'asla dolgu yapma', 'hiçbir alanı atlama']) assert.ok(govdeMesaji.includes(parca), parca)
    assert.ok(!b.istek.messages[0].content.includes('UZUNLUK KURALI (kesin)'))
    assert.equal(a.istek.max_tokens, 8000)
    assert.equal(b.istek.max_tokens, ONERI_TOKEN_TAVANI)
    assert.equal(ONERI_TOKEN_TAVANI, 6000)
    a.coz(cevap(GOVDE)); b.coz(cevap(ONERI))
    await sonuc
  })

  it('A hata verirse hata eskisi gibi fırlatılır (soapUretYeniden / rota yolu)', async () => {
    const sonuc = soapNotuUret(GIRDI, { istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('B').coz(cevap(ONERI))
    cagri('A').reddet(Object.assign(new Error('529 overloaded'), { status: 529 }))
    await assert.rejects(sonuc, /529/)
  })

  it('A ayrıştırılamazsa SoapCiktiHatasi (geçici, yeniden denenir)', async () => {
    const sonuc = soapNotuUret(GIRDI, { istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('B').coz(cevap(ONERI))
    cagri('A').coz(cevap('JSON yok'))
    await assert.rejects(sonuc, SoapCiktiHatasi)
  })
})

describe('soapNotuUret — öneri kritik yolda değil (NOTYA-NOT-HIZ-03)', () => {
  const ayri = () => {
    const kutu: { soz?: Promise<SoapOnerisi | null> } = {}
    return { kutu, secenek: { oneriAyri: (s: Promise<SoapOnerisi | null>) => { kutu.soz = s } } }
  }

  it('oneriAyri verilince not A ile döner, B beklenmez; öneri alanları notta yok', async () => {
    const { kutu, secenek } = ayri()
    const sonuc = soapNotuUret(GIRDI, { ...secenek, istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    assert.ok(kutu.soz, 'öneri sözü hemen verilmeli')
    cagri('A').coz(cevap(GOVDE))
    const n = await sonuc
    assert.equal(cagri('B').bitti, false, 'B hâlâ sürüyor')
    assert.equal(n.soap?.plan, GOVDE.soap.plan)
    assert.equal(n.tani, '1. Akut bronşit')
    for (const k of ['aiDegerlendirme', 'receteOnerisi', 'kritik_bulgular', 'alarmBulgulari', 'hasta_ozeti'] as const) assert.equal(n[k], undefined, k)
    cagri('B').coz(cevap(ONERI))
    const o = await kutu.soz!
    assert.equal(o?.aiDegerlendirme, ONERI.aiDegerlendirme)
    assert.equal(o?.hasta_ozeti, ONERI.hasta_ozeti)
    assert.deepEqual(o?.alarmBulgulari, ONERI.alarmBulgulari)
    assert.deepEqual(o?.kritik_bulgular, ONERI.kritik_bulgular)
    assert.ok(!('soap' in (o as object)), 'öneri çağrısının gövde alanı sızmaz')
  })

  it('B hata verirse öneri sözü null ile biter, fırlatmaz; not etkilenmez', async () => {
    const { kutu, secenek } = ayri()
    const sonuc = soapNotuUret(GIRDI, { ...secenek, istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('B').reddet(Object.assign(new Error('529 overloaded'), { status: 529 }))
    cagri('A').coz(cevap(GOVDE))
    const n = await sonuc
    assert.equal(n.soap?.degerlendirme, '1. Akut bronşit')
    assert.equal(await kutu.soz!, null)
  })

  it('B ayrıştırılamazsa (F3) öneri null; ham metin hiçbir yere gitmez', async () => {
    const { kutu, secenek } = ayri()
    const sonuc = soapNotuUret(GIRDI, { ...secenek, istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('B').coz(cevap('bu JSON değil'))
    cagri('A').coz(cevap(GOVDE))
    const n = await sonuc
    assert.equal(await kutu.soz!, null)
    assert.ok(!JSON.stringify(n).includes('bu JSON değil'))
  })

  it('B, A\'dan önce biterse de not A zamanında döner ve öneri teslim edilir', async () => {
    const { kutu, secenek } = ayri()
    const sonuc = soapNotuUret(GIRDI, { ...secenek, istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('B').coz(cevap(ONERI))
    assert.equal((await kutu.soz!)?.hasta_ozeti, ONERI.hasta_ozeti)
    cagri('A').coz(cevap(GOVDE))
    assert.equal((await sonuc).soap?.subjektif, SUBJEKTIF)
  })

  it('A hata verirse oneriAyri yolunda da hata fırlatılır (soapUretYeniden)', async () => {
    const { secenek } = ayri()
    const sonuc = soapNotuUret(GIRDI, { ...secenek, istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('B').coz(cevap(ONERI))
    cagri('A').reddet(Object.assign(new Error('529 overloaded'), { status: 529 }))
    await assert.rejects(sonuc, /529/)
  })

  it('doz kilidi öneriye ayrı uygulanır: dahiliyede reçete önerisi dozsuz, uydurma doz öneri metninden çıkar', async () => {
    const { kutu, secenek } = ayri()
    const sonuc = soapNotuUret({ ...GIRDI, specialty: 'dahiliye' }, { ...secenek, istemci: sahteIstemci as never })
    await ikiCagriyiBekle()
    cagri('A').coz(cevap(GOVDE))
    await sonuc
    cagri('B').coz(cevap({ ...ONERI, receteOnerisi: [{ etkenMadde: 'Parasetamol', ticariOrnek: 'Parol 500 mg', doz: '500 mg', kullanim: 'Günde 3 kez', sure: '5 gün' }], hasta_ozeti: 'Parasetamol 750 mg günde 3 kez önerildi.' }))
    const o = await kutu.soz!
    const r = o?.receteOnerisi?.[0]
    assert.ok(r && !r.doz && !r.kullanim, JSON.stringify(r))
    assert.ok(!String(o?.hasta_ozeti).includes('750 mg'), String(o?.hasta_ozeti))
    assert.match(String(o?.aiDegerlendirme), /Doz kontrolü/)
  })

  it('oneriyiBirlestir: öneri metni önce, gövdenin kilit satırı sonra; öneri yoksa not aynen', () => {
    const not = { soap: GOVDE.soap, aiDegerlendirme: '⚠ Doz kontrolü (hekim onayı): gövde' }
    assert.equal(oneriyiBirlestir(not, null), not)
    const b = oneriyiBirlestir(not, { aiDegerlendirme: 'Öneri: X', hasta_ozeti: 'Özet' })
    assert.equal(b.aiDegerlendirme, 'Öneri: X\n\n⚠ Doz kontrolü (hekim onayı): gövde')
    assert.equal(b.hasta_ozeti, 'Özet')
    assert.equal(b.soap, GOVDE.soap)
  })
})
