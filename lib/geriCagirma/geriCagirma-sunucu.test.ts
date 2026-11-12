/**
 * GERI-CAGIRMA-01 — the server half against the stand-in database (lib/security/testing/sahteSupabase.ts): the
 * source and its branş gate, exclusions, a constant number of queries, sending (consent, generic text, idempotency,
 * quota path, cross-doctor isolation both ways), attribution of a tagged-link booking, and the stored counters.
 * Two synthetic doctors (A: üroloji, B: kardiyoloji) with synthetic patients. No real patient, no real account.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-geri-cagirma-anahtari'
process.env.PORTAL_TOKEN_SECRET = 'qa-sentetik-portal-sirri'

import { SahteVeritabani, type Satir } from '@/lib/security/testing/sahteSupabase'
import { encrypt } from '@/lib/security/encryption'
import { adaylariTopla, onbellegiTemizle, type KaynakBagimliliklari } from './kaynak'
import { arandiIsaretle, geriCagir, GeriCagirmaHatasi, type GonderBagimliliklari, type KanalSonucu } from './gonder'
import { baglantiAtfi, ozetOku, sayaclariYenile } from './sayac'

const KAYIT = 'geri_cagirma_kayitlari'
const GUN = 86_400_000
const gunOnce = (n: number) => new Date(Date.now() - n * GUN).toISOString()
const gun = (iso: string) => iso.slice(0, 10)

let db: SahteVeritabani
let sorgular: string[]
let tabloYok: Set<string>
let ayrilan: Set<string>
let A: string, B: string
const kimlik = (id: string) => ({ userId: id, personelId: null, rol: 'doktor' as const })

/** The stand-in client + what the real database adds: the unique key of the recall log, and "table does not exist". */
function istemci(): any {
  const ic = db.istemci()
  return {
    ...ic,
    from: (t: string) => {
      sorgular.push(t)
      if (tabloYok.has(t)) {
        const yok: any = new Proxy({}, { get: (_h, p) => (p === 'then' ? (coz: (v: unknown) => unknown) => Promise.resolve({ data: null, error: { code: '42P01', message: `relation "${t}" does not exist` } }).then(coz) : () => yok) })
        return yok
      }
      const q = ic.from(t)
      if (t !== KAYIT) return q
      return new Proxy(q, {
        get(hedef, ozellik) {
          if (ozellik === 'insert') {
            return (y: Satir) => {
              // The real unique key decides at statement time; two requests in flight cannot both pass it.
              const anahtar = `${y.ulke}|${y.doctor_id}|${y.istek_anahtari}|${y.patient_id}`
              const cift = ayrilan.has(anahtar) || db.tablo(KAYIT).some((r) => r.ulke === y.ulke && r.doctor_id === y.doctor_id && r.istek_anahtari === y.istek_anahtari && r.patient_id === y.patient_id)
              ayrilan.add(anahtar)
              if (!cift) return hedef.insert(y)
              const hata = { data: null, error: { code: '23505', message: 'duplicate key' } }
              const z: any = { select: () => z, single: async () => hata, then: (coz: (v: unknown) => unknown) => Promise.resolve(hata).then(coz) }
              return z
            }
          }
          const v = hedef[ozellik]
          return typeof v === 'function' ? v.bind(hedef) : v
        },
      })
    },
  }
}

function hasta(doktorId: string, ad: string, o: { wa?: boolean | null; sms?: boolean | null; eposta?: boolean | null; aktif?: boolean; dob?: string } = {}): string {
  const r = db.ekle('patients', {
    doctor_id: doktorId, name_encrypted: encrypt(JSON.stringify({ ad, soyad: 'QA' })), dob_encrypted: encrypt(o.dob || '1980-01-01'),
    phone_encrypted: encrypt('+905321112233'), email_encrypted: encrypt(`${ad.toLowerCase()}@ornek.test`),
    iletisim_izni_whatsapp: o.wa ?? null, iletisim_izni_sms: o.sms ?? null, iletisim_izni_eposta: o.eposta ?? null, is_active: o.aktif !== false,
  })
  return String(r.id)
}

type KohortSatiri = { doktorId: string; patientId: string; ad: string; bayraklar: string[]; sonVizit?: string | null }
let uroSatirlari: KohortSatiri[]
let kardioSatirlari: KohortSatiri[]
let yukleyiciCagrilari: string[]
let gonderimler: { kanal: string; doktorId: string; patientId: string; metin?: string; konu?: string; hitap?: string; idem?: string }[]
let whatsappYaniti: KanalSonucu
let gondericiler: { whatsapp: boolean; sms: boolean; eposta: boolean }

const okuyucu = (ad: string, satirlar: () => KohortSatiri[], etiket: Record<string, string>) => async () => ({
  veri: async (_sb: unknown, doktorId: string, _bugun: string, sadece?: string[]) => {
    yukleyiciCagrilari.push(`${ad}:${doktorId}`)
    return { satirlar: satirlar().filter((s) => s.doktorId === doktorId && (!sadece || sadece.includes(s.patientId))) }
  },
  etiket,
})

const kaynak = (): Partial<KaynakBagimliliklari> => ({
  yukleyiciler: {
    uroloji: okuyucu('uroloji', () => uroSatirlari, { gecikmis_kontrol: 'Gecikmiş kontrol', psa_gecikmis: 'Gecikmiş PSA izlemi', ipss_yuksek: 'Yüksek IPSS bandı', risk_acik: 'Açık kırmızı bayrak' }),
    kardiyoloji: okuyucu('kardiyoloji', () => kardioSatirlari, { gecikmis_kontrol: 'Gecikmiş kontrol', lab_ekg_gecikmis: 'Gecikmiş lab / EKG', risk_acik: 'Açık kırmızı bayrak', yuksek_risk_izlem: 'Yüksek risk — izlem gecikmesi' }),
  },
  gondericiDurumu: async () => gondericiler,
})

const bag = (ek: Partial<GonderBagimliliklari> = {}): Partial<GonderBagimliliklari> => ({
  kaynak: kaynak(),
  whatsapp: async (g) => { gonderimler.push({ kanal: 'whatsapp', doktorId: g.doktorId, patientId: g.patientId, hitap: g.hitap, idem: g.idem }); return whatsappYaniti },
  sms: async (_sb, g) => { gonderimler.push({ kanal: 'sms', doktorId: g.doktorId, patientId: g.patientId, metin: g.metin }); return { ok: true, mesajId: 'sms-1' } },
  eposta: async (g) => { gonderimler.push({ kanal: 'eposta', doktorId: g.doktorId, patientId: g.patientId, metin: g.metin, konu: g.konu }); return { ok: true, mesajId: 'ep-1' } },
  siteKoku: () => 'https://www.notya.io',
  ...ek,
})

beforeEach(() => {
  db = new SahteVeritabani()
  sorgular = []
  tabloYok = new Set()
  ayrilan = new Set()
  onbellegiTemizle()
  A = randomUUID(); B = randomUUID()
  db.tablo('users').push({ id: A, title: 'Dr.', first_name: 'QA', last_name: 'Uro', specialty: 'uroloji' })
  db.tablo('users').push({ id: B, title: 'Dr.', first_name: 'QA', last_name: 'Kardio', specialty: 'kardiyoloji' })
  uroSatirlari = []; kardioSatirlari = []; yukleyiciCagrilari = []; gonderimler = []
  whatsappYaniti = { ok: true, mesajId: 'wamid-1' }
  gondericiler = { whatsapp: true, sms: true, eposta: true }
})

describe('GERI-CAGIRMA-01 · source', () => {
  it('each branş gets only its own reasons plus the universal follow-up date (leak test, both ways)', async () => {
    const a1 = hasta(A, 'UroBir', { sms: true })
    const a2 = hasta(A, 'UroIki', { sms: true })
    const b1 = hasta(B, 'KardioBir', { sms: true })
    uroSatirlari.push({ doktorId: A, patientId: a1, ad: 'UroBir QA', bayraklar: ['psa_gecikmis', 'risk_acik', 'ipss_yuksek'] })
    kardioSatirlari.push({ doktorId: B, patientId: b1, ad: 'KardioBir QA', bayraklar: ['lab_ekg_gecikmis', 'risk_acik'] })
    db.ekle('takip_isleri', { doktor_id: A, patient_id: a2, tur: 'kontrol', durum: 'acik', vade: gun(gunOnce(12)), kosullu: false })
    db.ekle('takip_isleri', { doktor_id: B, patient_id: b1, tur: 'kontrol', durum: 'acik', vade: gun(gunOnce(3)), kosullu: false })

    const la = (await adaylariTopla(istemci(), A, {}, kaynak())).liste
    const lb = (await adaylariTopla(istemci(), B, {}, kaynak())).liste
    const anahtarlar = (l: typeof la) => l.adaylar.flatMap((x) => x.nedenler.map((n) => n.anahtar)).sort()
    assert.deepEqual(anahtarlar(la), ['kontrol', 'uroloji:psa_gecikmis'])
    assert.deepEqual(anahtarlar(lb), ['kardiyoloji:lab_ekg_gecikmis', 'kontrol'])
    // A's doctor never ran kardiyoloji's tool and B's never ran üroloji's.
    assert.deepEqual(yukleyiciCagrilari.sort(), [`kardiyoloji:${B}`, `uroloji:${A}`].sort())
    // State / safety flags the tool raised are not recall reasons.
    assert.ok(!JSON.stringify(la).includes('risk_acik') && !JSON.stringify(la).includes('ipss'))
    // Nobody sees the other doctor's patients.
    assert.ok(!la.adaylar.some((x) => x.patientId === b1))
    assert.ok(!lb.adaylar.some((x) => x.patientId === a1 || x.patientId === a2))
    const takipli = la.adaylar.find((x) => x.patientId === a2)!
    assert.equal(takipli.gunGecikme, 12)
    assert.equal(takipli.nedenler[0].kaynak, 'takip')
  })

  it('a branş with no tool of its own still gets the universal reason; a conditional or future follow-up is not due', async () => {
    const C = randomUUID()
    db.tablo('users').push({ id: C, full_name: 'QA Bilinmeyen', specialty: 'bir-baska-brans' })
    const c1 = hasta(C, 'Evet', { sms: true }), c2 = hasta(C, 'Kosullu', { sms: true }), c3 = hasta(C, 'Ileride', { sms: true })
    db.ekle('takip_isleri', { doktor_id: C, patient_id: c1, tur: 'kontrol', durum: 'acik', vade: gun(gunOnce(1)), kosullu: false })
    db.ekle('takip_isleri', { doktor_id: C, patient_id: c2, tur: 'kontrol', durum: 'acik', vade: gun(gunOnce(1)), kosullu: true })
    db.ekle('takip_isleri', { doktor_id: C, patient_id: c3, tur: 'kontrol', durum: 'acik', vade: gun(gunOnce(-20)), kosullu: false })
    const { liste, doktorAdi } = await adaylariTopla(istemci(), C, {}, kaynak())
    assert.deepEqual(liste.adaylar.map((x) => x.patientId), [c1])
    assert.equal(doktorAdi, 'Dr. QA Bilinmeyen')
    assert.deepEqual(yukleyiciCagrilari, [])
  })

  it('exclusions: upcoming appointment, inactive record, cool-down — and no consent is listed but never messageable', async () => {
    const randevulu = hasta(A, 'Randevulu', { sms: true })
    const pasif = hasta(A, 'Pasif', { sms: true, aktif: false })
    const bekleyen = hasta(A, 'Bekleyen', { sms: true })
    const izinsiz = hasta(A, 'Izinsiz', {})
    const vazgecen = hasta(A, 'Vazgecen', { sms: false, wa: false, eposta: false })
    const hazir = hasta(A, 'Hazir', { wa: true })
    for (const [id, ad] of [[randevulu, 'Randevulu'], [pasif, 'Pasif'], [bekleyen, 'Bekleyen'], [izinsiz, 'Izinsiz'], [vazgecen, 'Vazgecen'], [hazir, 'Hazir']] as const) {
      uroSatirlari.push({ doktorId: A, patientId: id, ad: `${ad} QA`, bayraklar: ['gecikmis_kontrol'] })
    }
    db.ekle('randevular', { doktor_id: A, patient_id: randevulu, baslangic: gunOnce(-3), bitis: gunOnce(-3), durum: 'planlandi' })
    db.ekle(KAYIT, { ulke: 'tr', doctor_id: A, patient_id: bekleyen, istek_anahtari: 'eski-anahtar-1', nedenler: ['uroloji:gecikmis_kontrol'], kanal: 'sms', durum: 'gonderildi', gonderildi_at: gunOnce(5), created_at: gunOnce(5) })
    const { liste } = await adaylariTopla(istemci(), A, {}, kaynak())
    assert.deepEqual(liste.disarida, { randevusuVar: 1, beklemede: 1, pasif: 1 })
    const ad = (id: string) => liste.adaylar.find((x) => x.patientId === id)
    assert.equal(ad(randevulu), undefined)
    assert.equal(ad(pasif), undefined)
    assert.equal(ad(bekleyen), undefined)
    assert.deepEqual([ad(izinsiz)!.kanal, ad(izinsiz)!.izin], [null, 'izin_yok'])
    assert.deepEqual([ad(vazgecen)!.kanal, ad(vazgecen)!.izin], [null, 'izin_yok'])
    assert.deepEqual([ad(hazir)!.kanal, ad(hazir)!.izin], ['whatsapp', 'hazir'])
    // Consent but no connected sender: listed, not messageable.
    gondericiler = { whatsapp: false, sms: false, eposta: false }
    const l2 = (await adaylariTopla(istemci(), A, { taze: true }, kaynak())).liste
    assert.deepEqual([l2.adaylar.find((x) => x.patientId === hazir)!.kanal, l2.adaylar.find((x) => x.patientId === hazir)!.izin], [null, 'gonderici_yok'])
  })

  it('a recall for ANOTHER reason, or one older than the cool-down, does not hide the patient', async () => {
    const p = hasta(A, 'Tekrar', { sms: true })
    uroSatirlari.push({ doktorId: A, patientId: p, ad: 'Tekrar QA', bayraklar: ['psa_gecikmis'] })
    db.ekle(KAYIT, { ulke: 'tr', doctor_id: A, patient_id: p, istek_anahtari: 'eski-anahtar-2', nedenler: ['kontrol'], kanal: 'sms', durum: 'gonderildi', gonderildi_at: gunOnce(2), created_at: gunOnce(2) })
    db.ekle(KAYIT, { ulke: 'tr', doctor_id: A, patient_id: p, istek_anahtari: 'eski-anahtar-3', nedenler: ['uroloji:psa_gecikmis'], kanal: 'sms', durum: 'gonderildi', gonderildi_at: gunOnce(45), created_at: gunOnce(45) })
    const { liste } = await adaylariTopla(istemci(), A, {}, kaynak())
    assert.equal(liste.adaylar.length, 1)
    assert.ok(liste.adaylar[0].sonCagri)
  })

  it('the number of queries does not grow with the number of patients (no N+1)', async () => {
    const say = async (n: number) => {
      db = new SahteVeritabani(); onbellegiTemizle(); uroSatirlari = []
      db.tablo('users').push({ id: A, title: 'Dr.', first_name: 'QA', last_name: 'Uro', specialty: 'uroloji' })
      for (let i = 0; i < n; i++) {
        const id = hasta(A, `H${i}`, { sms: true })
        uroSatirlari.push({ doktorId: A, patientId: id, ad: `H${i} QA`, bayraklar: ['psa_gecikmis'] })
        db.ekle('takip_isleri', { doktor_id: A, patient_id: id, tur: 'kontrol', durum: 'acik', vade: gun(gunOnce(4)), kosullu: false })
      }
      sorgular = []
      const { liste } = await adaylariTopla(istemci(), A, {}, kaynak())
      assert.equal(liste.adaylar.length, n)
      return sorgular.length
    }
    const uc = await say(3)
    const kirk = await say(40)
    assert.equal(uc, kirk)
    assert.ok(kirk <= 9, `beklenen ≤9 sorgu, ${kirk}`)
    // A second read inside the cache window costs only the first round (settings can change the cool-down).
    sorgular = []
    await adaylariTopla(istemci(), A, {}, kaynak())
    assert.equal(sorgular.length, 3)
  })

  it('before migration 196 the feature reads as off', async () => {
    tabloYok = new Set(['geri_cagirma_ayarlari', 'geri_cagirma_aylik', KAYIT])
    const p = hasta(A, 'Yok', { sms: true })
    uroSatirlari.push({ doktorId: A, patientId: p, ad: 'Yok QA', bayraklar: ['psa_gecikmis'] })
    const { liste } = await adaylariTopla(istemci(), A, {}, kaynak())
    assert.equal(liste.kurulu, false)
    assert.deepEqual(liste.adaylar, [])
    await assert.rejects(() => geriCagir(istemci(), A, kimlik(A), { patientIds: [p], istekAnahtari: 'anahtar-yok-1' }, bag()), (e: unknown) => e instanceof GeriCagirmaHatasi && e.kod === 'kurulu_degil')
    assert.equal(gonderimler.length, 0)
    const o = await ozetOku(istemci(), A)
    assert.deepEqual([o.kurulu, o.goster], [false, false])
  })
})

describe('GERI-CAGIRMA-01 · sending', () => {
  it('sends once per patient through the consented channel; the text is generic and carries the tagged link', async () => {
    const smsli = hasta(A, 'Smsli', { sms: true })
    const epostali = hasta(A, 'Epostali', { eposta: true })
    const cocuk = hasta(A, 'Cocuk', { wa: true, dob: gun(gunOnce(365 * 5)) })
    const izinsiz = hasta(A, 'Izinsiz', {})
    for (const [id, ad] of [[smsli, 'Smsli'], [epostali, 'Epostali'], [cocuk, 'Cocuk'], [izinsiz, 'Izinsiz']] as const) uroSatirlari.push({ doktorId: A, patientId: id, ad: `${ad} QA`, bayraklar: ['psa_gecikmis'] })
    db.ekle('randevu_portal_ayarlari', { doktor_id: A, acik: true })
    db.ekle('hasta_portal_tokens', { doctor_id: A, patient_id: smsli, token_hash: 'jeton-smsli', pin_hash: 'x', expires_at: gunOnce(-30) })

    const s = await geriCagir(istemci(), A, kimlik(A), { patientIds: [smsli, epostali, cocuk, izinsiz], istekAnahtari: 'anahtar-gonder-1' }, bag())
    assert.deepEqual([s.durum, s.gonderilen, s.atlanan, s.basarisiz], ['tamamlandi', 3, 1, 0])
    assert.deepEqual(s.kanal, { whatsapp: 1, sms: 1, eposta: 1 })
    assert.equal(gonderimler.length, 3)
    assert.ok(!gonderimler.some((g) => g.patientId === izinsiz), 'no consent → never messaged')

    const sms = gonderimler.find((g) => g.kanal === 'sms')!
    const satir = db.tablo(KAYIT).find((r) => r.patient_id === smsli)!
    assert.ok(sms.metin!.includes(`https://www.notya.io/portal/hasta/jeton-smsli/randevu?gc=${satir.id}`))
    assert.ok(sms.metin!.includes('Dr. QA Uro'))
    assert.match(sms.metin!, /kontrol zamanınız geldi/)
    const eposta = gonderimler.find((g) => g.kanal === 'eposta')!
    assert.match(eposta.metin!, /Randevu için muayenehanemizi arayabilirsiniz/)
    for (const g of gonderimler) assert.ok(!/PSA|psa|Gecikmiş|izlem/.test(`${g.metin || ''} ${g.konu || ''} ${g.hitap || ''}`), 'the reason never leaves the practice')
    // A minor's WhatsApp greeting addresses the guardian; the WhatsApp send is keyed by the recall row.
    const wa = gonderimler.find((g) => g.kanal === 'whatsapp')!
    assert.equal(wa.hitap, 'Sayın Veli')
    assert.equal(wa.idem, `geri-cagirma:${db.tablo(KAYIT).find((r) => r.patient_id === cocuk)!.id}`)

    const satirlar = db.tablo(KAYIT)
    assert.equal(satirlar.length, 3)
    for (const r of satirlar) {
      assert.deepEqual([r.ulke, r.doctor_id, r.durum, r.gonderen_user_id], ['tr', A, 'gonderildi', A])
      assert.deepEqual(r.nedenler, ['uroloji:psa_gecikmis'])
      assert.ok(r.gonderildi_at)
    }
    assert.equal(db.tablo('iletisim_kayitlari').filter((r) => r.tur === 'kontrol_hatirlatma' && r.doctor_id === A).length, 3)
    // After the send the patients are in cool-down: the list no longer offers them.
    const { liste } = await adaylariTopla(istemci(), A, {}, kaynak())
    assert.deepEqual(liste.adaylar.map((x) => x.patientId), [izinsiz])
  })

  it('idempotent: a double tap and a retry with the same key send once', async () => {
    const p1 = hasta(A, 'Bir', { sms: true }), p2 = hasta(A, 'Iki', { sms: true })
    uroSatirlari.push({ doktorId: A, patientId: p1, ad: 'Bir QA', bayraklar: ['psa_gecikmis'] }, { doktorId: A, patientId: p2, ad: 'Iki QA', bayraklar: ['psa_gecikmis'] })
    const girdi = { patientIds: [p1, p2], istekAnahtari: 'anahtar-cift-dokunus' }
    const [x, y] = await Promise.all([geriCagir(istemci(), A, kimlik(A), girdi, bag()), geriCagir(istemci(), A, kimlik(A), girdi, bag())])
    assert.equal(x.gonderilen + y.gonderilen, 2)
    const z = await geriCagir(istemci(), A, kimlik(A), girdi, bag())
    assert.deepEqual([z.gonderilen, z.zatenIslenen], [0, 2])
    assert.equal(gonderimler.length, 2)
    assert.equal(db.tablo(KAYIT).length, 2)
  })

  it('the per-request cap answers "devam"; the same key continues without repeating anyone', async () => {
    const idler = [hasta(A, 'Bir', { sms: true }), hasta(A, 'Iki', { sms: true }), hasta(A, 'Uc', { sms: true })]
    idler.forEach((id, i) => uroSatirlari.push({ doktorId: A, patientId: id, ad: `H${i} QA`, bayraklar: ['psa_gecikmis'] }))
    const girdi = { patientIds: idler, istekAnahtari: 'anahtar-devam-1' }
    const ilk = await geriCagir(istemci(), A, kimlik(A), girdi, bag({ aliciSiniri: 2 }))
    assert.deepEqual([ilk.durum, ilk.gonderilen, ilk.kalan], ['devam', 2, 1])
    const ikinci = await geriCagir(istemci(), A, kimlik(A), girdi, bag({ aliciSiniri: 2 }))
    assert.deepEqual([ikinci.durum, ikinci.gonderilen, ikinci.zatenIslenen], ['tamamlandi', 1, 2])
    assert.equal(new Set(gonderimler.map((g) => g.patientId)).size, 3)
    assert.equal(gonderimler.length, 3)
  })

  it('quota path: a WhatsApp "limit reached" falls to the next consented channel, else is recorded as failed; an uncertain answer never retries elsewhere', async () => {
    const ikiKanal = hasta(A, 'IkiKanal', { wa: true, sms: true })
    const tekKanal = hasta(A, 'TekKanal', { wa: true })
    uroSatirlari.push({ doktorId: A, patientId: ikiKanal, ad: 'IkiKanal QA', bayraklar: ['psa_gecikmis'] }, { doktorId: A, patientId: tekKanal, ad: 'TekKanal QA', bayraklar: ['psa_gecikmis'] })
    whatsappYaniti = { ok: false, hata: 'WhatsApp günlük gönderim sınırına ulaşıldı.' }
    const s = await geriCagir(istemci(), A, kimlik(A), { patientIds: [ikiKanal, tekKanal], istekAnahtari: 'anahtar-kota-1' }, bag())
    assert.deepEqual([s.gonderilen, s.basarisiz, s.kanal.sms, s.kanal.whatsapp], [1, 1, 1, 0])
    assert.deepEqual(s.hatalar, ['WhatsApp günlük gönderim sınırına ulaşıldı.'])
    const r = (id: string) => db.tablo(KAYIT).find((x) => x.patient_id === id)!
    assert.deepEqual([r(ikiKanal).durum, r(ikiKanal).kanal], ['gonderildi', 'sms'])
    assert.deepEqual([r(tekKanal).durum, r(tekKanal).kanal], ['basarisiz', 'whatsapp'])
    // A failed recall is not a recall: the patient stays on the list and no cool-down starts.
    const { liste } = await adaylariTopla(istemci(), A, {}, kaynak())
    assert.deepEqual(liste.adaylar.map((x) => x.patientId), [tekKanal])

    const belirsiz = hasta(A, 'Belirsiz', { wa: true, sms: true })
    uroSatirlari.push({ doktorId: A, patientId: belirsiz, ad: 'Belirsiz QA', bayraklar: ['psa_gecikmis'] })
    whatsappYaniti = { ok: false, hata: 'Yanıt yok.', belirsiz: true }
    gonderimler = []
    await geriCagir(istemci(), A, kimlik(A), { patientIds: [belirsiz], istekAnahtari: 'anahtar-kota-2' }, bag())
    assert.deepEqual(gonderimler.map((g) => g.kanal), ['whatsapp'])
  })

  it('consent is read again at the moment of sending', async () => {
    const p = hasta(A, 'Vazgecti', { sms: true })
    uroSatirlari.push({ doktorId: A, patientId: p, ad: 'Vazgecti QA', bayraklar: ['psa_gecikmis'] })
    const s = await geriCagir(istemci(), A, kimlik(A), { patientIds: [p], istekAnahtari: 'anahtar-izin-1' }, bag({
      adresler: async () => new Map([[p, { telefon: '+905321112233', eposta: null, izinWhatsapp: null, izinSms: false, izinEposta: null }]]),
    }))
    assert.deepEqual([s.gonderilen, s.atlanan], [0, 1])
    assert.equal(gonderimler.length, 0)
    assert.equal(db.tablo(KAYIT).length, 0)
  })

  it('isolation, both ways: another doctor\'s patient id is skipped — nothing read, written or sent', async () => {
    const a1 = hasta(A, 'GIZLI-A', { sms: true })
    const b1 = hasta(B, 'GIZLI-B', { sms: true })
    uroSatirlari.push({ doktorId: A, patientId: a1, ad: 'GIZLI-A QA', bayraklar: ['psa_gecikmis'] })
    kardioSatirlari.push({ doktorId: B, patientId: b1, ad: 'GIZLI-B QA', bayraklar: ['lab_ekg_gecikmis'] })
    const once = JSON.stringify(db.tablo('patients'))
    for (const [saldirgan, kurban] of [[A, b1], [B, a1]] as const) {
      const s = await geriCagir(istemci(), saldirgan, kimlik(saldirgan), { patientIds: [kurban], istekAnahtari: `anahtar-capraz-${saldirgan.slice(0, 6)}` }, bag())
      assert.deepEqual([s.gonderilen, s.atlanan], [0, 1])
      assert.ok(!JSON.stringify(s).includes('GIZLI'))
      const arandi = await arandiIsaretle(istemci(), saldirgan, kimlik(saldirgan), kurban, bag())
      assert.deepEqual(arandi, { ok: false, durum: 404 })
    }
    assert.equal(gonderimler.length, 0)
    assert.equal(db.tablo(KAYIT).length, 0)
    assert.equal(db.tablo('iletisim_kayitlari').length, 0)
    assert.equal(JSON.stringify(db.tablo('patients')), once)
  })

  it('bad input is refused before anything is read', async () => {
    for (const girdi of [{ patientIds: [], istekAnahtari: 'anahtar-gecerli-1' }, { patientIds: ['not-a-uuid'], istekAnahtari: 'anahtar-gecerli-1' }, { patientIds: [randomUUID()], istekAnahtari: 'x' }]) {
      await assert.rejects(() => geriCagir(istemci(), A, kimlik(A), girdi, bag()), (e: unknown) => e instanceof GeriCagirmaHatasi && e.kod === 'gecersiz')
    }
  })

  it('"Arandı" records a recall without sending anything, once per day', async () => {
    const p = hasta(A, 'Telefon', {})
    uroSatirlari.push({ doktorId: A, patientId: p, ad: 'Telefon QA', bayraklar: ['psa_gecikmis'] })
    assert.deepEqual(await arandiIsaretle(istemci(), A, kimlik(A), p, bag()), { ok: true, yeni: true })
    assert.equal(gonderimler.length, 0)
    const r = db.tablo(KAYIT)[0]
    assert.deepEqual([r.kanal, r.durum, r.patient_id, r.doctor_id], ['elle', 'gonderildi', p, A])
    // In cool-down now: not on the list, so a second mark answers "not found" and writes nothing.
    assert.deepEqual(await arandiIsaretle(istemci(), A, kimlik(A), p, bag()), { ok: false, durum: 404 })
    assert.equal(db.tablo(KAYIT).length, 1)
  })
})

describe('GERI-CAGIRMA-01 · attribution and stored counters', () => {
  const cagri = (doktorId: string, patientId: string, gunOnceN: number, ek: Satir = {}) => db.ekle(KAYIT, { ulke: 'tr', doctor_id: doktorId, patient_id: patientId, istek_anahtari: `anahtar-${randomUUID().slice(0, 8)}`, nedenler: ['kontrol'], kanal: 'sms', durum: 'gonderildi', gonderildi_at: gunOnce(gunOnceN), created_at: gunOnce(gunOnceN), randevu_id: null, randevu_at: null, randevu_yolu: null, geldi_at: null, tahsilat_kurus: null, ...ek })

  it('booked → attended → recorded payment, one patient once; zero-data stays zero and hidden', async () => {
    let o = await ozetOku(istemci(), A)
    assert.deepEqual([o.kurulu, o.goster, o.cagrilabilir, o.buAy.randevuAlan], [true, false, 0, 0])

    const p1 = hasta(A, 'Geldi', { sms: true }), p2 = hasta(A, 'Aldi', { sms: true }), p3 = hasta(A, 'Onceden', { sms: true }), p4 = hasta(A, 'Sessiz', { sms: true })
    for (const p of [p1, p2, p3, p4]) cagri(A, p, 0.5)
    cagri(A, p1, 0.4) // a second message to the same patient: still one patient
    const simdi = Date.now()
    const r1 = db.ekle('randevular', { doktor_id: A, patient_id: p1, created_at: new Date(simdi - 0.3 * GUN).toISOString(), baslangic: new Date(simdi - 0.2 * GUN).toISOString(), durum: 'tamamlandi' })
    db.ekle('randevular', { doktor_id: A, patient_id: p2, created_at: new Date(simdi - 0.3 * GUN).toISOString(), baslangic: new Date(simdi + 5 * GUN).toISOString(), durum: 'planlandi' })
    db.ekle('randevular', { doktor_id: A, patient_id: p3, created_at: gunOnce(3), baslangic: new Date(simdi + 2 * GUN).toISOString(), durum: 'planlandi' }) // made BEFORE the recall
    const fatura = db.ekle('accounting_invoices', { doctor_id: A, patient_id: p1 })
    db.ekle('accounting_payments', { doctor_id: A, invoice_id: fatura.id, amount_kurus: 180_000, status: 'captured', created_at: new Date(simdi - 0.1 * GUN).toISOString() })
    db.ekle('accounting_payments', { doctor_id: A, invoice_id: fatura.id, amount_kurus: 999_000, status: 'pending', created_at: new Date(simdi - 0.1 * GUN).toISOString() })

    assert.equal(await sayaclariYenile(istemci(), A, { cagrilabilir: 7 }), true)
    sorgular = []
    o = await ozetOku(istemci(), A)
    assert.equal(sorgular.length, 2, 'the home card reads two stored row sets and nothing else')
    assert.deepEqual([o.goster, o.cagrilabilir, o.bayat], [true, 7, false])
    // Month boundaries: the synthetic recalls are hours old, so they may straddle a month change at run time.
    const toplam = o.egilim.reduce((t, a) => ({ g: t.g + a.gonderilen, r: t.r + a.randevuAlan, v: t.v + a.gelen, k: t.k + a.tahsilatKurus }), { g: 0, r: 0, v: 0, k: 0 })
    assert.deepEqual([toplam.r, toplam.v, toplam.k], [2, 1, 180_000])
    assert.ok(toplam.g >= 4 && toplam.g <= 8)
    const k1 = db.tablo(KAYIT).filter((r) => r.patient_id === p1)
    assert.equal(k1.filter((r) => r.randevu_id === r1.id).length, 1, 'one appointment is credited to one recall')
    assert.equal(db.tablo(KAYIT).find((r) => r.patient_id === p3)!.randevu_id, null)
    assert.equal(db.tablo(KAYIT).find((r) => r.patient_id === p4)!.randevu_id, null)
    // No accounting recorded for p2 (booked, not yet attended): no amount.
    assert.equal(db.tablo(KAYIT).find((r) => r.patient_id === p2)!.tahsilat_kurus, null)
  })

  it('a tagged-link booking is credited only to THAT doctor\'s recall of THAT patient, inside the window', async () => {
    const a1 = hasta(A, 'Baglanti', { sms: true })
    const b1 = hasta(B, 'Baska', { sms: true })
    const c = cagri(A, a1, 1)
    const eski = cagri(A, a1, 45)
    const randevuId = randomUUID()
    // Wrong doctor, wrong patient, malformed tag, expired recall: nothing changes.
    assert.equal(await baglantiAtfi(istemci(), { doktorId: B, patientId: b1, gc: c.id, randevuId }), false)
    assert.equal(await baglantiAtfi(istemci(), { doktorId: A, patientId: b1, gc: c.id, randevuId }), false)
    assert.equal(await baglantiAtfi(istemci(), { doktorId: B, patientId: a1, gc: c.id, randevuId }), false)
    assert.equal(await baglantiAtfi(istemci(), { doktorId: A, patientId: a1, gc: "x' or 1=1", randevuId }), false)
    assert.equal(await baglantiAtfi(istemci(), { doktorId: A, patientId: a1, gc: eski.id, randevuId }), false)
    assert.equal(db.tablo(KAYIT).filter((r) => r.randevu_id).length, 0)
    // The patient's own doctor, the patient's own recall: stamped once.
    assert.equal(await baglantiAtfi(istemci(), { doktorId: A, patientId: a1, gc: c.id, randevuId }), true)
    assert.equal(await baglantiAtfi(istemci(), { doktorId: A, patientId: a1, gc: c.id, randevuId: randomUUID() }), false)
    const r = db.tablo(KAYIT).find((x) => x.id === c.id)!
    assert.deepEqual([r.randevu_id, r.randevu_yolu], [randevuId, 'baglanti'])
  })

  it('counters of one doctor never include another doctor\'s recalls', async () => {
    const a1 = hasta(A, 'A1', { sms: true }), b1 = hasta(B, 'B1', { sms: true })
    cagri(A, a1, 1); cagri(B, b1, 1)
    db.ekle('randevular', { doktor_id: B, patient_id: b1, created_at: gunOnce(0.5), baslangic: gunOnce(-2), durum: 'planlandi' })
    await sayaclariYenile(istemci(), A); await sayaclariYenile(istemci(), B)
    const oa = await ozetOku(istemci(), A), ob = await ozetOku(istemci(), B)
    assert.equal(oa.egilim.reduce((t, a) => t + a.randevuAlan, 0), 0)
    assert.equal(ob.egilim.reduce((t, a) => t + a.randevuAlan, 0), 1)
  })
})
