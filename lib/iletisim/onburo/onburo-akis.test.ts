/**
 * WHATSAPP-ONBURO-01 — "Ayşe ön büro" end to end on the in-memory fake database (no network, no real Meta, no model):
 * booking by chat (OFF does nothing new; Onayımla → pending request; Otomatik → booked through the shared create path;
 * a slot taken between proposal and pick; two patients on one number; an unknown number never creates a patient; a
 * redelivered webhook books once; the re-proposal cap), the desk actions, the Ön büro fısıltısı items and doctor
 * isolation. Synthetic QA data only.
 */
import { after, before, describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-whatsapp-api-anahtari'

import { SahteVeritabani } from '../../security/testing/sahteSupabase'
import { encryptPII, decryptPII } from '../../security/encryption'
import { SABLON_KODLARI } from '../otomatik/whatsapp/sablonlar'
import { baglantiKaydet } from '../otomatik/whatsapp/depo'
import { GUNLUK } from '../otomatik/whatsapp/gunluk'
import { YANITLAR, yanitIsle } from '../whatsapp/yanit'
import { TABLO_AYAR } from './ayar'
import { OB } from './isle'
import { onBuroKartEylemi, talepSonucuBildir } from './eylem'
import { onBuroMasaKartlari, onBuroMasaOgeleri } from './fisilti'
import { NUMARA_SAATLIK, ONERI_SINIRI } from './sunucu'

const A = '00000000-0000-4000-8000-0000000000aa'
const B = '00000000-0000-4000-8000-0000000000bb'
const TEL = '905321112233'

/** Monday 16 November 2026, 10:00 Istanbul — a working day with a full week ahead. */
const SIMDI = new Date('2026-11-16T07:00:00Z')
/** The clock is pinned (Date only): the fake database stamps created_at with it, exactly like the real one would. */
before(() => mock.timers.enable({ apis: ['Date'], now: SIMDI.getTime() }))
after(() => mock.timers.reset())
/** Moves the clock to SIMDI + dk minutes and returns that instant (the `simdi` of the next step). */
const sonra = (dk: number) => { const t = SIMDI.getTime() + dk * 60_000; mock.timers.setTime(t); return new Date(t) }
/** A timestamp for test data — does not move the clock. */
const ileri = (dk: number) => new Date(SIMDI.getTime() + dk * 60_000)

type Cagri = { url: URL; method: string; body: any }
function sahteFetch() {
  const cagrilar: Cagri[] = []
  let n = 0
  const f = async (u: string, init?: RequestInit) => {
    cagrilar.push({ url: new URL(u), method: init?.method || 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined })
    return new Response(JSON.stringify({ messages: [{ id: `wamid.OUT${++n}` }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const gonderimler = () => cagrilar.filter((c) => c.method === 'POST' && c.url.pathname.endsWith('/messages'))
  return { f, gonderimler, metinler: () => gonderimler().map((g) => String(g.body?.text?.body || '')) }
}

function sahneKur(mod: 'kapali' | 'onay' | 'otomatik' | null = 'onay', yanitAcik = false) {
  mock.timers.setTime(SIMDI.getTime())
  const db = new SahteVeritabani()
  const sb = db.istemci() as never
  const hasta = (doktor: string, ad: string, tel = '0532 111 22 33', dogum = '1980-05-05') => db.ekle('patients', {
    doctor_id: doktor, is_active: true,
    name_encrypted: encryptPII(JSON.stringify({ ad })), dob_encrypted: encryptPII(dogum), phone_encrypted: encryptPII(tel), email_encrypted: encryptPII('qa-hasta@ornek.test'),
    iletisim_izni_whatsapp: true, iletisim_izni_eposta: true,
  }).id as string
  if (mod) db.ekle(TABLO_AYAR, { doctor_id: A, randevu_modu: mod, yanit_acik: yanitAcik, bilgi: {} })
  return { db, sb, hasta }
}

async function baglan(sb: never, doktor: string, pn: string) {
  await baglantiKaydet(sb, {
    doktorId: doktor, businessId: null, wabaId: `WABA-${pn}`, phoneNumberId: pn, gorunenNumara: '+90 555 000 00 00', gorunenAd: 'QA Klinik', token: `TOKEN-${pn}`,
    sablonlar: Object.fromEntries(SABLON_KODLARI.map((k) => [k, { id: k, durum: 'APPROVED', guncellendi: '' }])),
  } as never)
}

let sayac = 0
const gelen = (govde: string, wamid = `wamid.IN-${++sayac}`, pn = 'PN-A', tel = TEL) =>
  [{ phoneNumberId: pn, wamid, karsiNumara: tel, zaman: SIMDI.toISOString(), tip: 'text', govde, mediaId: null, yon: 'gelen' as const }]

const kartlar = (db: SahteVeritabani) => db.tablo(YANITLAR)
const sonKart = (db: SahteVeritabani) => kartlar(db)[kartlar(db).length - 1]
const aktifRandevular = (db: SahteVeritabani, doktor = A) => db.tablo('randevular').filter((r) => r.doktor_id === doktor && r.durum !== 'iptal')

describe('kapalı (varsayılan): hiçbir şey değişmez', () => {
  for (const mod of [null, 'kapali'] as const) {
    it(`ayar ${mod === null ? 'satırı yok' : 'kapalı'}: randevu isteği yalnız mevcut akışın kartı olur, öneri gitmez, randevu açılmaz`, async () => {
      const { db, sb, hasta } = sahneKur(mod)
      await baglan(sb, A, 'PN-A')
      hasta(A, 'QA Ayşe Yılmaz')
      const { f, gonderimler } = sahteFetch()
      await yanitIsle(sb, gelen('randevu almak istiyorum'), { fetch: f, simdi: SIMDI, llm: async () => 'diger' })
      assert.equal(gonderimler().length, 0)
      assert.equal(aktifRandevular(db).length, 0)
      const k = sonKart(db)
      assert.equal(k.niyet, 'yeniden_planla', 'mevcut akışın etiketi')
      assert.equal(k.eylem_sonucu, 'yeni_randevu_istegi')
      assert.ok(!String(k.otomatik_eylem || '').startsWith('ob_'))
    })
  }
})

describe('Onayımla: seçim bekleyen talep olur', () => {
  it('öneri → "2" → talep (randevu durumu talep, kaynak whatsapp), hasta onay beklendiğini öğrenir; masa onaylar, hasta bilgilendirilir', async () => {
    const { db, sb, hasta } = sahneKur('onay')
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe Yılmaz')
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('Randevu almak istiyorum'), { fetch: f, simdi: SIMDI })
    const oneri = sonKart(db)
    assert.equal(oneri.otomatik_eylem, OB.slotOnerildi)
    assert.equal(oneri.niyet, 'randevu')
    assert.equal(oneri.patient_id, h)
    assert.equal(oneri.onerilen_slotlar.length, 3)
    assert.equal(new Set(oneri.onerilen_slotlar.map((s: any) => String(s.bas).slice(0, 10))).size, 3, 'gün başına bir öneri')
    assert.match(metinler()[0], /1\) .*\n2\) .*\n3\) /)
    assert.match(metinler()[0], /onayladığında/)
    assert.equal(aktifRandevular(db).length, 0, 'öneri saat tutmaz')

    await yanitIsle(sb, gelen('2'), { fetch: f, simdi: sonra(2) })
    const [r] = aktifRandevular(db)
    assert.equal(r.durum, 'talep')
    assert.equal(r.kaynak, 'whatsapp')
    assert.equal(r.patient_id, h)
    assert.equal(r.baslangic, oneri.onerilen_slotlar[1].bas)
    assert.ok(db.tablo('randevu_olaylari').some((o) => o.randevu_id === r.id && o.olay === 'talep' && o.yapan === 'hasta'))
    assert.equal(db.tablo('randevu_isleri').filter((i) => i.randevu_id === r.id).length, 0, 'talep onaylanana kadar hatırlatma işi yok')
    const talep = sonKart(db)
    assert.equal(talep.otomatik_eylem, OB.talep)
    assert.equal(talep.randevu_id, r.id)
    assert.equal(talep.eylem_sonucu, 'talep')
    assert.match(metinler()[1], /onayı bekleniyor/)
    assert.equal(oneri.on_buro.acik, false, 'öneri adımı kapandı')

    // Desk approves from the card.
    const s = await onBuroKartEylemi(sb, { doktorId: A, yapanId: A, yapan: 'doktor', kartId: talep.id, eylem: 'ob_onayla' }, { fetch: f, simdi: sonra(5) })
    assert.ok(s.ok, JSON.stringify(s))
    assert.equal(db.tablo('randevular').find((x) => x.id === r.id)!.durum, 'onaylandi')
    assert.ok(db.tablo('randevu_isleri').some((i) => i.randevu_id === r.id), 'onay + hatırlatma işleri sıraya girdi (ortak yol)')
    assert.match(metinler()[2], /onaylandı/)
    assert.equal(sonKart(db).otomatik_eylem, OB.talepOnaylandi)
    assert.equal(sonKart(db).durum, 'islendi')
  })

  it('takvimdeki talep listesinden onay da hastaya WhatsApp’tan bildirilir; portal talebinde bildirim gitmez', async () => {
    const { db, sb, hasta } = sahneKur('onay')
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe Yılmaz')
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('randevu alabilir miyim'), { fetch: f, simdi: SIMDI })
    await yanitIsle(sb, gelen('1'), { fetch: f, simdi: sonra(1) })
    const [r] = aktifRandevular(db)
    db.tablo('randevular').find((x) => x.id === r.id)!.durum = 'onaylandi'
    const b = await talepSonucuBildir(sb, { doktorId: A, randevuId: r.id, sonuc: 'onaylandi', yapanId: A }, { fetch: f, simdi: sonra(3) })
    assert.deepEqual(b, { kart: true, bildirildi: true })
    assert.match(metinler()[2], /onaylandı/)
    const portal = db.ekle('randevular', { doktor_id: A, patient_id: h, baslangic: ileri(3000).toISOString(), bitis: ileri(3030).toISOString(), durum: 'onaylandi', kaynak: 'portal' }).id
    assert.deepEqual(await talepSonucuBildir(sb, { doktorId: A, randevuId: portal, sonuc: 'onaylandi', yapanId: A }, { fetch: f, simdi: sonra(4) }), { kart: false, bildirildi: false })
  })
})

describe('Otomatik: ortak oluşturma yolundan hemen randevu', () => {
  it('seçim → onaylı randevu, onay + hatırlatma işleri, olay kaydı, masada geri-al kartı; geri al → iptal + bildirim', async () => {
    const { db, sb, hasta } = sahneKur('otomatik')
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe Yılmaz')
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('yarın için randevu alabilir miyim'), { fetch: f, simdi: SIMDI })
    const oneri = sonKart(db)
    assert.ok(oneri.onerilen_slotlar.every((s: any) => String(s.bas) >= '2026-11-16T21:00' && String(s.bas) < '2026-11-17T21:00'), 'yalnız yarın (İstanbul)')
    assert.ok(!/onayladığında/.test(metinler()[0]))
    await yanitIsle(sb, gelen('1'), { fetch: f, simdi: sonra(1) })
    const [r] = aktifRandevular(db)
    assert.equal(r.durum, 'onaylandi')
    assert.equal(r.kaynak, 'whatsapp')
    assert.ok(db.tablo('randevu_isleri').some((i) => i.randevu_id === r.id && i.tur === 'onay_eposta'))
    assert.ok(db.tablo('randevu_olaylari').some((o) => o.randevu_id === r.id && o.olay === 'otomatik_onay' && (o.detay as any).kanal === 'whatsapp'))
    assert.match(metinler()[1], /Randevunuz oluşturuldu/)
    const kart = sonKart(db)
    assert.equal(kart.otomatik_eylem, OB.otomatikRandevu)

    const masa = onBuroMasaOgeleri(await onBuroMasaKartlari(sb, A, sonra(2)))
    assert.equal(masa.length, 1)
    assert.equal(masa[0].kaynak, 'onburo')
    assert.equal(masa[0].ad, 'QA Y.')
    assert.deepEqual(masa[0].obEylemler, ['ob_geri_al', 'ob_gordum'])
    assert.ok(!JSON.stringify(masa).includes(TEL) && !JSON.stringify(masa).includes('randevu alabilir'), 'masa öğesinde telefon / mesaj metni yok')

    // The secretary undoes it with one tap.
    const s = await onBuroKartEylemi(sb, { doktorId: A, yapanId: 'sekreter-1', yapan: 'sekreter', kartId: kart.id, eylem: 'ob_geri_al' }, { fetch: f, simdi: sonra(3) })
    assert.ok(s.ok, JSON.stringify(s))
    const iptal = db.tablo('randevular').find((x) => x.id === r.id)!
    assert.equal(iptal.durum, 'iptal')
    assert.ok(db.tablo('randevu_olaylari').some((o) => o.randevu_id === r.id && o.olay === 'iptal' && o.yapan === 'sekreter'))
    assert.match(metinler()[2], /iptal edildi/)
    assert.equal((await onBuroMasaKartlari(sb, A, sonra(4))).length, 0)
    assert.equal(h, kart.patient_id)
  })

  it('aynı webhook iki kez gelirse tek randevu, tek mesaj, tek kart', async () => {
    const { db, sb, hasta } = sahneKur('otomatik')
    await baglan(sb, A, 'PN-A')
    hasta(A, 'QA Ayşe Yılmaz')
    const { f, gonderimler } = sahteFetch()
    await yanitIsle(sb, gelen('randevu istiyorum', 'wamid.R-1'), { fetch: f, simdi: SIMDI })
    await yanitIsle(sb, gelen('randevu istiyorum', 'wamid.R-1'), { fetch: f, simdi: SIMDI })
    assert.equal(kartlar(db).length, 1)
    assert.equal(gonderimler().length, 1)
    await yanitIsle(sb, gelen('3', 'wamid.R-2'), { fetch: f, simdi: sonra(1) })
    await yanitIsle(sb, gelen('3', 'wamid.R-2'), { fetch: f, simdi: sonra(1) })
    assert.equal(aktifRandevular(db).length, 1)
    assert.equal(kartlar(db).length, 2)
    assert.equal(gonderimler().length, 2)
  })

  it('yarıda kalan işlem: randevu açılmış, kart bitmemiş → yeniden teslimde ikinci randevu açılmaz', async () => {
    const { db, sb, hasta } = sahneKur('otomatik')
    await baglan(sb, A, 'PN-A')
    hasta(A, 'QA Ayşe Yılmaz')
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('randevu istiyorum'), { fetch: f, simdi: SIMDI })
    await yanitIsle(sb, gelen('1', 'wamid.C-1'), { fetch: f, simdi: sonra(1) })
    // Simulate a crash after the booking: the card lost its result and the step is still open.
    const kart = sonKart(db)
    kart.eylem_sonucu = null
    kartlar(db)[0].on_buro = { ...kartlar(db)[0].on_buro, acik: true }
    await yanitIsle(sb, gelen('1', 'wamid.C-1'), { fetch: f, simdi: sonra(1) })
    assert.equal(aktifRandevular(db).length, 1)
    assert.equal(sonKart(db).eylem_sonucu, 'randevu_olustu')
  })

  it('öneri ile seçim arasında saat dolarsa: “doldu” denir, yeni saatler önerilir, çakışan randevu açılmaz', async () => {
    const { db, sb, hasta } = sahneKur('otomatik')
    await baglan(sb, A, 'PN-A')
    hasta(A, 'QA Ayşe Yılmaz')
    const baska = hasta(A, 'QA Mehmet Demir', '0533 000 00 01')
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('randevu almak istiyorum'), { fetch: f, simdi: SIMDI })
    const ilk = sonKart(db).onerilen_slotlar[0]
    db.ekle('randevular', { doktor_id: A, patient_id: baska, baslangic: ilk.bas, bitis: ilk.son, durum: 'onaylandi' })
    await yanitIsle(sb, gelen('1'), { fetch: f, simdi: sonra(1) })
    assert.equal(aktifRandevular(db).filter((r) => r.kaynak === 'whatsapp').length, 0)
    assert.match(metinler()[1], /az önce doldu/)
    const yeni = sonKart(db)
    assert.equal(yeni.otomatik_eylem, OB.slotOnerildi)
    assert.ok(yeni.onerilen_slotlar.every((s: any) => s.bas !== ilk.bas))
    await yanitIsle(sb, gelen('1'), { fetch: f, simdi: sonra(2) })
    assert.equal(aktifRandevular(db).filter((r) => r.kaynak === 'whatsapp').length, 1)
  })

  it('“başka gün / öğleden sonra / salı” yeniden önerir; yeniden öneri sınırında masa devralır', async () => {
    const { db, sb, hasta } = sahneKur('otomatik')
    await baglan(sb, A, 'PN-A')
    hasta(A, 'QA Ayşe Yılmaz')
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('randevu almak istiyorum'), { fetch: f, simdi: SIMDI })
    const ilkGunler = sonKart(db).on_buro.gunler
    await yanitIsle(sb, gelen('başka gün olur mu'), { fetch: f, simdi: sonra(1) })
    assert.ok(sonKart(db).onerilen_slotlar.every((s: any) => !ilkGunler.includes(String(new Date(Date.parse(s.bas) + 3 * 3600e3).toISOString().slice(0, 10)))), 'önceki günler yok')
    await yanitIsle(sb, gelen('öğleden sonra'), { fetch: f, simdi: sonra(2) })
    assert.ok(sonKart(db).onerilen_slotlar.every((s: any) => new Date(Date.parse(s.bas) + 3 * 3600e3).getUTCHours() >= 12))
    await yanitIsle(sb, gelen('cuma'), { fetch: f, simdi: sonra(3) })
    assert.ok(sonKart(db).onerilen_slotlar.every((s: any) => String(s.bas).startsWith('2026-11-20')))
    assert.equal(sonKart(db).on_buro.deneme, ONERI_SINIRI)
    await yanitIsle(sb, gelen('daha geç'), { fetch: f, simdi: sonra(4) })
    assert.equal(sonKart(db).eylem_sonucu, 'oneri_siniri')
    assert.match(metinler()[metinler().length - 1], /iletişime geçecektir/)
    assert.equal(aktifRandevular(db).length, 0)
    assert.equal(kartlar(db).filter((k) => k.on_buro?.acik).length, 0, 'açık adım kalmadı')
  })

  it('yaklaşan randevusu olan hasta: ikinci randevu otomatik açılmaz, mevcut akışın kartı olur', async () => {
    const { db, sb, hasta } = sahneKur('otomatik')
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe Yılmaz')
    db.ekle('randevular', { doktor_id: A, patient_id: h, baslangic: ileri(2880).toISOString(), bitis: ileri(2910).toISOString(), durum: 'onaylandi' })
    const { f, gonderimler } = sahteFetch()
    await yanitIsle(sb, gelen('randevu almak istiyorum'), { fetch: f, simdi: SIMDI })
    assert.equal(gonderimler().length, 0)
    assert.equal(sonKart(db).eylem_sonucu, 'yeni_randevu_istegi')
    assert.equal(aktifRandevular(db).length, 1)
  })

  it('iptal / erteleme / onay kelimeleri ön büroya takılmaz', async () => {
    const { db, sb, hasta } = sahneKur('otomatik', true)
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe Yılmaz')
    const r = db.ekle('randevular', { doktor_id: A, patient_id: h, baslangic: ileri(2880).toISOString(), bitis: ileri(2910).toISOString(), durum: 'planlandi', hatirlatma_gonderildi: false }).id
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('EVET'), { fetch: f, simdi: SIMDI })
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'onaylandi')
    await yanitIsle(sb, gelen('randevumu iptal ediyorum'), { fetch: f, simdi: sonra(1) })
    assert.equal(db.tablo('randevular').find((x) => x.id === r)!.durum, 'iptal')
    assert.ok(kartlar(db).every((k) => !String(k.otomatik_eylem || '').startsWith('ob_')))
  })
})

describe('bir numarada iki hasta', () => {
  it('yalnız adlarla sorulur; seçilen kişi için öneri gelir; başka hiçbir bilgi açıklanmaz', async () => {
    const { db, sb, hasta } = sahneKur('onay')
    await baglan(sb, A, 'PN-A')
    const c1 = hasta(A, 'QA Zeynep Kaya', '0532 111 22 33', '2019-03-03')
    const c2 = hasta(A, 'QA Emre Kaya', '0532 111 22 33', '2021-04-04')
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('randevu almak istiyorum'), { fetch: f, simdi: SIMDI })
    assert.equal(sonKart(db).otomatik_eylem, OB.kisiSoruldu)
    assert.equal(sonKart(db).patient_id, null)
    assert.match(metinler()[0], /1\) QA\n2\) QA/)
    assert.ok(!/Kaya|2019|2021/.test(metinler()[0]), 'soyad / doğum tarihi yok')
    assert.equal(aktifRandevular(db).length, 0)
    await yanitIsle(sb, gelen('2'), { fetch: f, simdi: sonra(1) })
    const oneri = sonKart(db)
    assert.equal(oneri.otomatik_eylem, OB.slotOnerildi)
    assert.equal(oneri.patient_id, c2)
    await yanitIsle(sb, gelen('1'), { fetch: f, simdi: sonra(2) })
    const [r] = aktifRandevular(db)
    assert.equal(r.patient_id, c2)
    assert.notEqual(r.patient_id, c1)
  })
})

describe('bilinmeyen numara: hasta kaydı asla kendiliğinden açılmaz', () => {
  it('bilgilendirme → ad soyad → öneri → seçim → masaya TALEP kartı; onay hasta kaydını ve randevuyu açar', async () => {
    const { db, sb } = sahneKur('otomatik')
    await baglan(sb, A, 'PN-A')
    db.ekle('users', { id: A, full_name: 'QA Hekim' })
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('Merhaba randevu almak istiyorum'), { fetch: f, simdi: SIMDI })
    assert.equal(sonKart(db).otomatik_eylem, OB.adSoruldu)
    assert.match(metinler()[0], /kaydedilecektir[\s\S]*KVKK[\s\S]*adınızı ve soyadınızı/, 'önce bilgilendirme, sonra soru')
    assert.equal(db.tablo('patients').length, 0)

    await yanitIsle(sb, gelen('teşekkürler'), { fetch: f, simdi: sonra(1) })
    assert.match(metinler()[1], /tek mesajda/, 'ad anlaşılmadı: bir kez yeniden sorulur')
    await yanitIsle(sb, gelen('qa deniz aksoy'), { fetch: f, simdi: sonra(2) })
    const oneri = sonKart(db)
    assert.equal(oneri.otomatik_eylem, OB.slotOnerildi)
    assert.equal(oneri.patient_id, null)
    assert.match(metinler()[2], /onayladığında/, 'otomatik modda bile bilinmeyen numara onay bekler')
    assert.ok(!JSON.stringify(oneri).includes('Deniz'), 'ad düz metin saklanmaz')
    assert.equal(decryptPII(oneri.on_buro.ad), 'Qa Deniz Aksoy')

    await yanitIsle(sb, gelen('1'), { fetch: f, simdi: sonra(3) })
    const talep = sonKart(db)
    assert.equal(talep.otomatik_eylem, OB.yeniHastaTalebi)
    assert.equal(talep.secilen_slot, oneri.onerilen_slotlar[0].bas)
    assert.equal(db.tablo('patients').length, 0, 'seçimden sonra da hasta yok')
    assert.equal(aktifRandevular(db).length, 0, 'seçimden sonra da randevu yok')
    assert.match(metinler()[3], /iletildi/)

    const masa = onBuroMasaOgeleri(await onBuroMasaKartlari(sb, A, sonra(4)))
    assert.equal(masa[0].ad, 'Qa A.')
    assert.deepEqual(masa[0].obEylemler, ['ob_onayla', 'ob_reddet'])

    const s = await onBuroKartEylemi(sb, { doktorId: A, yapanId: 'sekreter-1', yapan: 'sekreter', kartId: talep.id, eylem: 'ob_onayla' }, { fetch: f, simdi: sonra(5) })
    assert.ok(s.ok, JSON.stringify(s))
    const [p] = db.tablo('patients')
    assert.equal(p.doctor_id, A)
    assert.equal(JSON.parse(decryptPII(p.name_encrypted)).ad, 'Qa Deniz Aksoy')
    assert.equal(decryptPII(p.phone_encrypted), `+${TEL}`)
    const [r] = aktifRandevular(db)
    assert.equal(r.patient_id, p.id)
    assert.equal(r.durum, 'onaylandi')
    assert.equal(r.kaynak, 'whatsapp')
    assert.match(metinler()[4], /onaylandı/)
    // A second tap neither creates a second patient nor a second appointment.
    await onBuroKartEylemi(sb, { doktorId: A, yapanId: 'sekreter-1', yapan: 'sekreter', kartId: talep.id, eylem: 'ob_onayla' }, { fetch: f, simdi: sonra(6) })
    assert.equal(db.tablo('patients').length, 1)
    assert.equal(aktifRandevular(db).length, 1)
  })

  it('reddedilirse hasta kaydı açılmaz, hastaya bildirilir', async () => {
    const { db, sb } = sahneKur('onay')
    await baglan(sb, A, 'PN-A')
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('randevu istiyorum'), { fetch: f, simdi: SIMDI })
    await yanitIsle(sb, gelen('QA Deniz Aksoy'), { fetch: f, simdi: sonra(1) })
    await yanitIsle(sb, gelen('2'), { fetch: f, simdi: sonra(2) })
    const s = await onBuroKartEylemi(sb, { doktorId: A, yapanId: A, yapan: 'doktor', kartId: sonKart(db).id, eylem: 'ob_reddet' }, { fetch: f, simdi: sonra(3) })
    assert.ok(s.ok)
    assert.equal(db.tablo('patients').length, 0)
    assert.match(metinler()[metinler().length - 1], /onaylanamadı/)
  })
})

describe('DUR her zaman kazanır, sınırlar ve izolasyon', () => {
  it('açık bir öneri varken DUR: izin kapanır, ön büro yanıt vermez', async () => {
    const { db, sb, hasta } = sahneKur('otomatik', true)
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe Yılmaz')
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('randevu almak istiyorum'), { fetch: f, simdi: SIMDI })
    await yanitIsle(sb, gelen('DUR'), { fetch: f, simdi: sonra(1) })
    assert.equal(db.tablo('patients').find((p) => p.id === h)!.iletisim_izni_whatsapp, false)
    assert.equal(sonKart(db).otomatik_eylem, 'vazgec_uygulandi')
    assert.match(metinler()[1], /göndermeyeceğiz/)
    assert.equal(aktifRandevular(db).length, 0)
  })

  it('açık öneri varken “iptal”: mesaj izni KAPANMAZ, istek bırakılır', async () => {
    const { db, sb, hasta } = sahneKur('otomatik')
    await baglan(sb, A, 'PN-A')
    const h = hasta(A, 'QA Ayşe Yılmaz')
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('randevu almak istiyorum'), { fetch: f, simdi: SIMDI })
    await yanitIsle(sb, gelen('iptal'), { fetch: f, simdi: sonra(1) })
    assert.equal(db.tablo('patients').find((p) => p.id === h)!.iletisim_izni_whatsapp, true)
    assert.equal(sonKart(db).otomatik_eylem, OB.birakildi)
    assert.equal(kartlar(db).filter((k) => k.on_buro?.acik).length, 0)
  })

  it('numara başına saatlik sınır ve döngü koruması: sınırdan sonra otomatik yanıt gitmez, kart masaya kalır', async () => {
    const { db, sb, hasta } = sahneKur('otomatik')
    await baglan(sb, A, 'PN-A')
    hasta(A, 'QA Ayşe Yılmaz')
    const { f, gonderimler } = sahteFetch()
    for (let i = 0; i < NUMARA_SAATLIK + 3; i++) await yanitIsle(sb, gelen('randevu almak istiyorum'), { fetch: f, simdi: sonra(i) })
    assert.equal(gonderimler().length, NUMARA_SAATLIK)
    assert.equal(sonKart(db).otomatik_eylem, OB.sinir)
    assert.equal(sonKart(db).eylem_sonucu, 'yanit_siniri')
    assert.ok(db.tablo(GUNLUK).some((g) => g.tur === 'on_buro_sinir'))
  })

  it('B doktorunun ayarı, hastası ve takvimi A’nın hattına gelen mesajdan etkilenmez; kart eylemi yabancı doktora 404', async () => {
    const { db, sb, hasta } = sahneKur('otomatik')
    await baglan(sb, A, 'PN-A')
    await baglan(sb, B, 'PN-B')
    hasta(A, 'QA Ayşe Yılmaz')
    const hb = hasta(B, 'QA Gizli B-7Q')
    const { f, metinler } = sahteFetch()
    await yanitIsle(sb, gelen('randevu almak istiyorum'), { fetch: f, simdi: SIMDI })
    await yanitIsle(sb, gelen('1'), { fetch: f, simdi: sonra(1) })
    assert.equal(aktifRandevular(db, B).length, 0)
    assert.ok(kartlar(db).every((k) => k.doctor_id === A && k.patient_id !== hb))
    assert.ok(!metinler().join(' ').includes('Gizli'))
    // B has no settings row: the same words on B's line do nothing new.
    await yanitIsle(sb, gelen('randevu almak istiyorum', undefined, 'PN-B'), { fetch: f, simdi: sonra(2), llm: async () => 'diger' })
    assert.equal(aktifRandevular(db, B).length, 0)
    const yabanci = await onBuroKartEylemi(sb, { doktorId: B, yapanId: B, yapan: 'doktor', kartId: sonKart(db).id === kartlar(db)[1].id ? kartlar(db)[1].id : kartlar(db)[1].id, eylem: 'ob_geri_al' }, { fetch: f, simdi: sonra(3) })
    assert.deepEqual(yabanci, { ok: false, durum: 404, hata: 'Kayıt bulunamadı.' })
    assert.equal(aktifRandevular(db, A).length, 1)
    assert.equal((await onBuroMasaKartlari(sb, B, sonra(3))).length, 0)
  })

  it('mesaj gövdesi ve numara yalnız şifreli saklanır', async () => {
    const { db, sb, hasta } = sahneKur('onay')
    await baglan(sb, A, 'PN-A')
    hasta(A, 'QA Ayşe Yılmaz')
    const { f } = sahteFetch()
    await yanitIsle(sb, gelen('randevu almak istiyorum lütfen'), { fetch: f, simdi: SIMDI })
    const ham = JSON.stringify([db.tablo(YANITLAR), db.tablo(GUNLUK)])
    assert.ok(!ham.includes('randevu almak istiyorum') && !ham.includes(TEL) && !ham.includes('Size uygun zamanlar'))
  })
})
