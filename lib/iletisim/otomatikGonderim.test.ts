/**
 * NOTYA-ILETISIM-04 — automatic sending end to end, against the in-memory Supabase stand-in
 * (lib/security/testing/sahteSupabase.ts) with fake senders (no network): what goes, on which channel, what stays
 * one-tap, at most once, fallbacks, and the adapters over jobs B and C. Synthetic QA data only.
 */
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SahteVeritabani } from '../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-otomatik-anahtari'
process.env.NEXT_PUBLIC_APP_URL = 'https://www.notya.io'
globalThis.fetch = (async (g: unknown) => { throw new Error(`otomatik gönderim testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

type M = typeof import('./otomatikGonderim')
type O = typeof import('./otomatik')
let G: M
let O: O
let encrypt: (s: string) => string

before(async () => {
  ;({ encrypt } = await import('../security/encryption'))
  G = await import('./otomatikGonderim')
  O = await import('./otomatik')
})

const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)
/** Today 12:00 in Turkey — inside the daytime window. */
const oglen = () => new Date(`${bugunTr()}T12:00:00+03:00`)
function yarinTr(saat: number, dakika = 0): string {
  return new Date(Date.parse(`${bugunTr()}T00:00:00+03:00`) + 86400e3 + (saat * 60 + dakika) * 60e3).toISOString()
}

type Cagri = { kanal: string; istek: import('./otomatik').OtomatikGonderimIstegi }
type Davranis = 'ok' | 'hata' | 'firlat' | 'askida'

function sahteGonderici(kanal: 'whatsapp' | 'eposta', cagrilar: Cagri[], o: { hazir?: (d: string) => boolean; davranis?: Davranis | ((i: import('./otomatik').OtomatikGonderimIstegi) => Davranis) } = {}): import('./otomatik').OtomatikGonderici {
  return {
    kanal,
    saglayici: kanal === 'whatsapp' ? 'whatsapp_business' : 'eposta',
    hazirMi: async (d) => (o.hazir ? o.hazir(d) : true),
    gonder: async (istek) => {
      cagrilar.push({ kanal, istek })
      const d = typeof o.davranis === 'function' ? o.davranis(istek) : o.davranis || 'ok'
      if (d === 'firlat') throw new Error('patladı')
      if (d === 'askida') return new Promise(() => {})
      if (d === 'hata') return { ok: false, hata: kanal === 'whatsapp' ? 'WhatsApp şu an ulaşılamıyor.' : 'E-posta şu an gönderilemedi, birazdan yeniden denenebilir.' }
      return kanal === 'whatsapp' ? { ok: true, saglayiciMesajId: 'wamid.QA1' } : { ok: true, saglayici: 'gmail', saglayiciMesajId: 'gm-1' }
    },
  }
}

let db: SahteVeritabani
const sb = () => db.istemci() as never

type Sahne = { doktor: string; digerDoktor: string; hasta: string; cocuk: string; sadeceEposta: string; izinsiz: string; randevu: string; kuyruk: (p: Record<string, unknown>) => string }

function sahne(): Sahne {
  db = new SahteVeritabani()
  const doktor = db.ekle('users', { full_name: 'QA Hekim', first_name: 'Işıl', last_name: 'Öztürk', title: 'Dr.', specialty: 'kardiyoloji', email: 'qa-hekim@ornek.test' }).id
  const digerDoktor = db.ekle('users', { full_name: 'QA Hekim 2', first_name: 'Can', last_name: 'Er', title: 'Dr.', specialty: 'pediatri', email: 'qa-hekim-2@ornek.test' }).id
  const hastaEkle = (ad: string, dob: string, izinW: boolean | null, izinE: boolean | null, doktorId = doktor) => db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad })), dob_encrypted: encrypt(dob),
    phone_encrypted: encrypt('0532 111 22 33'), email_encrypted: encrypt('qa-hasta@ornek.test'),
    iletisim_izni_whatsapp: izinW, iletisim_izni_eposta: izinE,
  }).id
  const hasta = hastaEkle('QA Ayşe Yılmaz', '1980-05-05', true, true)
  const cocuk = hastaEkle('QA Çocuk Ali', '2018-02-02', true, true)
  const sadeceEposta = hastaEkle('QA Eposta Hasta', '1970-01-01', null, true)
  const izinsiz = hastaEkle('QA İzinsiz', '1975-01-01', null, null)
  const randevu = db.ekle('randevular', { doktor_id: doktor, patient_id: hasta, baslangic: yarinTr(10, 30), durum: 'planlandi', hatirlatma_gonderildi: false }).id
  let n = 0
  const kuyruk = (p: Record<string, unknown>) => db.ekle('iletisim_kuyrugu', {
    doctor_id: doktor, tur: 'randevu_hatirlatma', planlanan_gun: bugunTr(), tekil_anahtar: `qa-${n++}`, durum: 'bekliyor',
    otomatik_durum: null, ertelendi_at: null, ...p,
  }).id
  return { doktor, digerDoktor, hasta, cocuk, sadeceEposta, izinsiz, randevu, kuyruk }
}

const satir = (id: string) => db.tablo('iletisim_kuyrugu').find((r) => r.id === id)!
const kayitlar = () => db.tablo('iletisim_kayitlari')
const calistir = (gondericiler: import('./otomatik').OtomatikGonderici[], ek: Partial<import('./otomatikGonderim').DagitimSecenekleri> = {}) =>
  G.otomatikGonder(sb(), { gondericiler, simdi: oglen, aralikMs: 0, ...ek })

describe('otomatik gönderim: ne, hangi kanaldan', () => {
  let s: Sahne
  beforeEach(() => { s = sahne() })

  it('randevu hatırlatması WhatsApp şablonuyla gider; kuyruk kapanır, kayıt "kendiliğinden", randevu hatırlatıldı', async () => {
    const id = s.kuyruk({ patient_id: s.hasta, randevu_id: s.randevu })
    const c: Cagri[] = []
    const oz = await calistir([sahteGonderici('whatsapp', c), sahteGonderici('eposta', c)])
    assert.equal(oz.gonderilen, 1)
    assert.equal(c.length, 1)
    assert.equal(c[0].kanal, 'whatsapp')
    assert.equal(c[0].istek.alici, '+905321112233')
    assert.equal(c[0].istek.sablon?.kod, 'randevu_hatirlatma')
    const [ad, tarih, saat, doktor] = c[0].istek.sablon!.degiskenler
    assert.equal(ad, 'QA Ayşe Yılmaz')
    assert.match(tarih, /\d+ \S+ \S+/)
    assert.equal(saat, '10:30')
    assert.equal(doktor, 'Dr. Işıl Öztürk')
    assert.equal(satir(id).durum, 'gonderildi')
    assert.equal(satir(id).otomatik_durum, 'gonderildi')
    const k = kayitlar()
    assert.equal(k.length, 1)
    assert.deepEqual(
      { kanal: k[0].kanal, tur: k[0].tur, durum: k[0].durum, otomatik: k[0].otomatik, saglayici: k[0].saglayici, mid: k[0].saglayici_mesaj_id, kuyruk: k[0].kuyruk_id, gonderen: k[0].gonderen_user_id },
      { kanal: 'whatsapp', tur: 'randevu_hatirlatma', durum: 'gonderildi', otomatik: true, saglayici: 'whatsapp_business', mid: 'wamid.QA1', kuyruk: id, gonderen: null },
    )
    assert.equal(db.tablo('randevular').find((r) => r.id === s.randevu)!.hatirlatma_gonderildi, true)
  })

  it('WhatsApp başarısız → e-posta; kayıt e-posta + gmail', async () => {
    const id = s.kuyruk({ patient_id: s.hasta, randevu_id: s.randevu })
    const c: Cagri[] = []
    await calistir([sahteGonderici('whatsapp', c, { davranis: 'hata' }), sahteGonderici('eposta', c)])
    assert.deepEqual(c.map((x) => x.kanal), ['whatsapp', 'eposta'])
    assert.equal(c[1].istek.alici, 'qa-hasta@ornek.test')
    assert.match(c[1].istek.metin, /randevunuz var/)
    assert.match(c[1].istek.konu, /Randevu hatırlatması/)
    assert.equal(satir(id).durum, 'gonderildi')
    assert.deepEqual([kayitlar()[0].kanal, kayitlar()[0].saglayici, kayitlar()[0].saglayici_mesaj_id], ['eposta', 'gmail', 'gm-1'])
  })

  it('hepsi başarısız → insan kuyruğunda kalır, kısa Türkçe neden; kayıt yok; bir daha denenmez', async () => {
    const id = s.kuyruk({ patient_id: s.hasta, randevu_id: s.randevu })
    const c: Cagri[] = []
    const g = [sahteGonderici('whatsapp', c, { davranis: 'hata' }), sahteGonderici('eposta', c, { davranis: 'hata' })]
    const oz = await calistir(g)
    assert.equal(oz.basarisiz, 1)
    assert.equal(satir(id).durum, 'bekliyor')
    assert.equal(satir(id).otomatik_durum, 'gonderilemedi')
    assert.equal(satir(id).otomatik_hata, 'Kendiliğinden gönderilemedi: WhatsApp şu an ulaşılamıyor.')
    assert.equal(kayitlar().length, 0)
    await calistir(g)
    assert.equal(c.length, 2, 'başarısız öğe ikinci turda yeniden denenmez')
    assert.deepEqual(G.insanGorunumu(satir(id)), { not: 'Kendiliğinden gönderilemedi: WhatsApp şu an ulaşılamıyor.' })
  })

  it('izin kanala göre: WhatsApp izni yoksa yalnız e-posta; hiç izin yoksa dokunulmaz (tek dokunuş kalır)', async () => {
    const a = s.kuyruk({ patient_id: s.sadeceEposta, tur: 'saglikim_yeni_mesaj' })
    const b = s.kuyruk({ patient_id: s.izinsiz, tur: 'saglikim_yeni_mesaj' })
    const c: Cagri[] = []
    await calistir([sahteGonderici('whatsapp', c), sahteGonderici('eposta', c)])
    assert.deepEqual(c.map((x) => [x.kanal, x.istek.patientId]), [['eposta', s.sadeceEposta]])
    assert.equal(satir(a).durum, 'gonderildi')
    assert.equal(satir(b).durum, 'bekliyor')
    assert.equal(satir(b).otomatik_durum, null, 'izinsiz hastanın öğesi sahiplenilmez')
  })

  it('pasif (arşivlenmiş) hastaya hiçbir şey gitmez', async () => {
    db.tablo('patients').find((p) => p.id === s.hasta)!.is_active = false
    const id = s.kuyruk({ patient_id: s.hasta, randevu_id: s.randevu })
    const c: Cagri[] = []
    await calistir([sahteGonderici('whatsapp', c), sahteGonderici('eposta', c)])
    assert.equal(c.length, 0)
    assert.equal(satir(id).otomatik_durum, null)
  })

  it('klinik ya da serbest türler asla kendiliğinden gitmez', async () => {
    const ids = ['asi_hatirlatma', 'kontrol_hatirlatma', 'tetkik_getirin', 'saglikim_baglanti', 'serbest'].map((tur) => s.kuyruk({ patient_id: s.hasta, tur }))
    const c: Cagri[] = []
    await calistir([sahteGonderici('whatsapp', c), sahteGonderici('eposta', c)])
    assert.equal(c.length, 0)
    for (const id of ids) assert.deepEqual([satir(id).durum, satir(id).otomatik_durum], ['bekliyor', null])
  })

  it('bağlantısı olmayan doktor: hiçbir şey sahiplenilmez, gönderilmez (bugünkü tek dokunuş)', async () => {
    const id = s.kuyruk({ patient_id: s.hasta, randevu_id: s.randevu })
    const c: Cagri[] = []
    const oz = await calistir([sahteGonderici('whatsapp', c, { hazir: () => false }), sahteGonderici('eposta', c, { hazir: () => false })])
    assert.equal(c.length, 0)
    assert.equal(oz.dokunulmadi, 1)
    assert.equal(satir(id).otomatik_durum, null)
  })

  it('WhatsApp\'ta şablonu olmayan tür (randevu iptali) e-postayla gider, WhatsApp çağrılmaz', async () => {
    const iptal = db.ekle('randevular', { doktor_id: s.doktor, patient_id: s.hasta, baslangic: yarinTr(15), durum: 'iptal', hatirlatma_gonderildi: false }).id
    s.kuyruk({ patient_id: s.hasta, tur: 'randevu_iptali', randevu_id: iptal })
    const c: Cagri[] = []
    await calistir([sahteGonderici('whatsapp', c), sahteGonderici('eposta', c)])
    assert.deepEqual(c.map((x) => x.kanal), ['eposta'])
    assert.match(c[0].istek.metin, /iptal edildi/)
  })

  it('Sağlığım bildirimi: güvenli bağlantı varsa WhatsApp şablonu düğmeyle; yoksa bağlantısız e-posta', async () => {
    const a = s.kuyruk({ patient_id: s.hasta, tur: 'saglikim_yeni_mesaj' })
    db.ekle('hasta_portal_tokens', { doctor_id: s.doktor, patient_id: s.hasta, token_hash: 'qa-token', pin_hash: 'x', expires_at: new Date(Date.now() + 86400e3).toISOString() })
    const c: Cagri[] = []
    await calistir([sahteGonderici('whatsapp', c), sahteGonderici('eposta', c)])
    assert.equal(c[0].kanal, 'whatsapp')
    assert.deepEqual(c[0].istek.sablon, { kod: 'saglikim_yeni_mesaj', degiskenler: ['QA Ayşe Yılmaz', 'Dr. Işıl Öztürk', 'https://www.notya.io/portal/hasta/qa-token/mesajlar'] })
    assert.equal(satir(a).durum, 'gonderildi')

    const b = s.kuyruk({ patient_id: s.sadeceEposta, tur: 'saglikim_yeni_mesaj' })
    const c2: Cagri[] = []
    await calistir([sahteGonderici('whatsapp', c2), sahteGonderici('eposta', c2)])
    assert.equal(c2[0].kanal, 'eposta')
    assert.doesNotMatch(c2[0].istek.metin, /https?:\/\//)
    assert.equal(satir(b).durum, 'gonderildi')
  })

  it('çocuk hasta: WhatsApp veliye hitap eder, e-posta veli diliyle', async () => {
    const r = db.ekle('randevular', { doktor_id: s.doktor, patient_id: s.cocuk, baslangic: yarinTr(9), durum: 'onaylandi', hatirlatma_gonderildi: false }).id
    s.kuyruk({ patient_id: s.cocuk, randevu_id: r })
    const c: Cagri[] = []
    await calistir([sahteGonderici('whatsapp', c, { davranis: 'hata' }), sahteGonderici('eposta', c)])
    assert.equal(c[0].istek.sablon!.degiskenler[0], O.VELI_HITABI)
    assert.match(c[1].istek.metin, /QA Çocuk Ali adına randevunuz/)
  })

  it('iptal edilmiş / geçmiş / elle hatırlatılmış randevunun öğesi gönderilmez', async () => {
    const iptal = db.ekle('randevular', { doktor_id: s.doktor, patient_id: s.hasta, baslangic: yarinTr(11), durum: 'iptal', hatirlatma_gonderildi: false }).id
    const gecmis = db.ekle('randevular', { doktor_id: s.doktor, patient_id: s.hasta, baslangic: new Date(`${bugunTr()}T08:00:00+03:00`).toISOString(), durum: 'planlandi', hatirlatma_gonderildi: false }).id
    const elle = db.ekle('randevular', { doktor_id: s.doktor, patient_id: s.hasta, baslangic: yarinTr(12), durum: 'planlandi', hatirlatma_gonderildi: true }).id
    for (const r of [iptal, gecmis, elle]) s.kuyruk({ patient_id: s.hasta, randevu_id: r })
    const c: Cagri[] = []
    const oz = await calistir([sahteGonderici('whatsapp', c), sahteGonderici('eposta', c)])
    assert.equal(oz.calisti, true)
    assert.equal(c.length, 0)
    assert.equal(oz.dokunulmadi, 3)
  })
})

describe('otomatik gönderim: en fazla bir kez, güvenli', () => {
  let s: Sahne
  beforeEach(() => { s = sahne() })

  it('iki tur (ve aynı anda iki tur) → tek gönderim', async () => {
    s.kuyruk({ patient_id: s.hasta, randevu_id: s.randevu })
    const c: Cagri[] = []
    const g = [sahteGonderici('whatsapp', c), sahteGonderici('eposta', c)]
    await Promise.all([calistir(g), calistir(g)])
    await calistir(g)
    assert.equal(c.length, 1)
    assert.equal(kayitlar().length, 1)
  })

  it('insan açtıysa (elle) ya da "Sonra" dediyse makine göndermez', async () => {
    const a = s.kuyruk({ patient_id: s.hasta, randevu_id: s.randevu })
    const b = s.kuyruk({ patient_id: s.sadeceEposta, tur: 'saglikim_yeni_mesaj', ertelendi_at: new Date().toISOString() })
    assert.equal(await G.elleSahiplen(sb(), s.doktor, a), 'tamam')
    assert.equal(satir(a).otomatik_durum, 'elle')
    const c: Cagri[] = []
    await calistir([sahteGonderici('whatsapp', c), sahteGonderici('eposta', c)])
    assert.equal(c.length, 0)
    assert.equal(satir(b).durum, 'bekliyor')
  })

  it('makine gönderdiyse ya da şu an gönderiyorsa insan açamaz (410); yarım kalan 10 dk sonra insana döner', async () => {
    const a = s.kuyruk({ patient_id: s.hasta, durum: 'gonderildi', otomatik_durum: 'gonderildi' })
    const b = s.kuyruk({ patient_id: s.hasta, otomatik_durum: 'gonderiliyor', otomatik_deneme_at: new Date().toISOString() })
    const e = s.kuyruk({ patient_id: s.hasta, otomatik_durum: 'gonderiliyor', otomatik_deneme_at: new Date(Date.now() - 11 * 60e3).toISOString() })
    assert.equal(await G.elleSahiplen(sb(), s.doktor, a), 'otomatik')
    assert.equal(await G.elleSahiplen(sb(), s.doktor, b), 'otomatik')
    assert.equal(await G.elleSahiplen(sb(), s.doktor, e), 'tamam')
    assert.equal(G.insanGorunumu(satir(b)), 'gizle')
    assert.match((G.insanGorunumu(satir(e)) as { not: string }).not, /gitmiş olabilir/)
    // another doctor's id: not found → nothing claimed
    assert.equal(await G.elleSahiplen(sb(), s.digerDoktor, satir(b).id), 'tamam')
  })

  it('gönderici fırlatır ya da yanıt vermezse diğer kanala geçilmez ("gitmiş olabilir")', async () => {
    const a = s.kuyruk({ patient_id: s.hasta, randevu_id: s.randevu })
    const c: Cagri[] = []
    await calistir([sahteGonderici('whatsapp', c, { davranis: 'firlat' }), sahteGonderici('eposta', c)])
    assert.deepEqual(c.map((x) => x.kanal), ['whatsapp'])
    assert.equal(satir(a).otomatik_durum, 'gonderilemedi')
    assert.match(satir(a).otomatik_hata, /gitmiş olabilir/)
  })

  it('bir doktorun hatası diğerini durdurmaz', async () => {
    s.kuyruk({ patient_id: s.hasta, randevu_id: s.randevu })
    const digerHasta = db.ekle('patients', {
      doctor_id: s.digerDoktor, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Diğer' })), dob_encrypted: encrypt('1990-01-01'),
      phone_encrypted: encrypt('0533 000 00 00'), email_encrypted: encrypt('qa-diger@ornek.test'), iletisim_izni_whatsapp: false, iletisim_izni_eposta: true,
    }).id
    db.ekle('iletisim_kuyrugu', { doctor_id: s.digerDoktor, patient_id: digerHasta, tur: 'saglikim_yeni_mesaj', planlanan_gun: bugunTr(), tekil_anahtar: 'qa-diger', durum: 'bekliyor', otomatik_durum: null, ertelendi_at: null })
    const c: Cagri[] = []
    const oz = await calistir([
      sahteGonderici('whatsapp', c, { hazir: (d) => { if (d === s.doktor) throw new Error('bozuk'); return false } }),
      { ...sahteGonderici('eposta', c), hazirMi: async (d) => { if (d === s.doktor) throw new Error('bozuk'); return true } },
    ])
    assert.equal(oz.gonderilen, 1)
    assert.deepEqual(c.map((x) => x.istek.doktorId), [s.digerDoktor])
    assert.equal(c[0].istek.alici, 'qa-diger@ornek.test')
  })

  it('gece sessiz saat: hiçbir şey gönderilmez', async () => {
    s.kuyruk({ patient_id: s.hasta, randevu_id: s.randevu })
    const c: Cagri[] = []
    const oz = await calistir([sahteGonderici('whatsapp', c)], { simdi: () => new Date(`${bugunTr()}T23:30:00+03:00`) })
    assert.equal(oz.neden, 'sessiz_saat')
    assert.equal(c.length, 0)
    assert.equal(G.sessizSaatMi(new Date(`${bugunTr()}T06:59:00+03:00`)), true)
    assert.equal(G.sessizSaatMi(new Date(`${bugunTr()}T07:00:00+03:00`)), false)
    assert.equal(G.sessizSaatMi(new Date(`${bugunTr()}T21:00:00+03:00`)), true)
  })

  it('migration 098 yokken (kolon yok) hiçbir şey sahiplenilmez ya da gönderilmez', async () => {
    const hata = { data: null, error: { code: '42703', message: 'column iletisim_kuyrugu.otomatik_durum does not exist' } }
    const zincir: any = new Proxy({}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r(hata) : () => zincir) })
    const c: Cagri[] = []
    const oz = await G.otomatikGonder({ from: () => zincir } as never, { gondericiler: [sahteGonderici('whatsapp', c)], simdi: oglen })
    assert.deepEqual([oz.calisti, oz.neden, c.length], [false, 'kolon_yok', 0])
    assert.equal(await G.bugunOtomatikSayisi({ from: () => zincir } as never, 'D'), 0)
  })

  it('bugunOtomatikSayisi: yalnız bugünün kendiliğinden gönderilenleri; sekreter yalnız randevu türleri', async () => {
    db.ekle('iletisim_kayitlari', { doctor_id: s.doktor, patient_id: s.hasta, kanal: 'whatsapp', tur: 'randevu_hatirlatma', durum: 'gonderildi', otomatik: true })
    db.ekle('iletisim_kayitlari', { doctor_id: s.doktor, patient_id: s.hasta, kanal: 'eposta', tur: 'saglikim_yeni_mesaj', durum: 'gonderildi', otomatik: true })
    db.ekle('iletisim_kayitlari', { doctor_id: s.doktor, patient_id: s.hasta, kanal: 'eposta', tur: 'randevu_hatirlatma', durum: 'gonderildi', otomatik: false })
    db.ekle('iletisim_kayitlari', { doctor_id: s.doktor, patient_id: s.hasta, kanal: 'eposta', tur: 'randevu_hatirlatma', durum: 'gonderildi', otomatik: true, created_at: new Date(Date.now() - 2 * 86400e3).toISOString() })
    assert.equal(await G.bugunOtomatikSayisi(sb(), s.doktor), 2)
    assert.equal(await G.bugunOtomatikSayisi(sb(), s.doktor, ['randevu_hatirlatma']), 1)
    assert.equal(await G.bugunOtomatikSayisi(sb(), s.digerDoktor), 0)
  })
})

describe('adaptörler (iş B ve C) ve şablon eşlemesi', () => {
  it('WhatsApp adaptörü: şablonsuz asla göndermez, serbest metin taşımaz', async () => {
    const giden: unknown[] = []
    const a = O.whatsappAdaptoru({ hazirMi: async () => true, gonder: async (g) => { giden.push(g); return { ok: true, disId: 'wamid.1' } } })
    const temel = { doktorId: 'D', patientId: 'P', tur: 'randevu_hatirlatma' as const, alici: '+905321112233', konu: 'K', metin: 'Serbest metin tanı: X' }
    assert.deepEqual(await a.gonder(temel), { ok: false, hata: 'Bu mesaj için onaylı WhatsApp şablonu yok.' })
    assert.equal(giden.length, 0)
    assert.deepEqual(await a.gonder({ ...temel, sablon: { kod: 'randevu_hatirlatma', degiskenler: ['A', 'B', 'C', 'D'] } }), { ok: true, saglayiciMesajId: 'wamid.1' })
    assert.deepEqual(giden[0], { doktorId: 'D', alici: '+905321112233', metin: '', sablonKodu: 'randevu_hatirlatma', degiskenler: ['A', 'B', 'C', 'D'] })
  })

  it('e-posta adaptörü: hazırlanan metni olduğu gibi yollar; google → gmail, microsoft → outlook; fırlatma → ok:false', async () => {
    const giden: unknown[] = []
    const a = O.epostaAdaptoru({ hazirMi: async () => true, gonder: async (g) => { giden.push(g); return { ok: true, disId: 'm1', saglayici: 'google' } } })
    const i = { doktorId: 'D', patientId: 'P', tur: 'bilgi_formu' as const, alici: 'h@o.test', konu: 'Konu', metin: 'Metin' }
    assert.deepEqual(await a.gonder(i), { ok: true, saglayici: 'gmail', saglayiciMesajId: 'm1' })
    assert.deepEqual(giden[0], { doktorId: 'D', alici: 'h@o.test', konu: 'Konu', metin: 'Metin' })
    const m = O.epostaAdaptoru({ hazirMi: async () => true, gonder: async () => ({ ok: true, saglayici: 'microsoft' }) })
    assert.deepEqual(await m.gonder(i), { ok: true, saglayici: 'outlook' })
    const f = O.epostaAdaptoru({ hazirMi: async () => { throw new Error('x') }, gonder: async () => { throw new Error('x') } })
    assert.equal(await f.hazirMi('D'), false)
    assert.equal((await f.gonder(i)).ok, false)
  })

  it('whatsappSablonu: yalnız onaylı iki şablon; eksik bilgi ya da yabancı bağlantı → null', () => {
    const iso = '2026-10-12T11:30:00Z'
    assert.deepEqual(O.whatsappSablonu('randevu_hatirlatma', { hastaAdi: ' Ayşe  Demir ', doktorAdi: 'Dr. X', randevuIso: iso }), { kod: 'randevu_hatirlatma', degiskenler: ['Ayşe Demir', '12 Ekim Pazartesi', '14:30', 'Dr. X'] })
    assert.equal(O.whatsappSablonu('randevu_hatirlatma', { hastaAdi: 'A', doktorAdi: '', randevuIso: iso }), null)
    assert.equal(O.whatsappSablonu('randevu_hatirlatma', { hastaAdi: 'A', doktorAdi: 'Dr. X', randevuIso: null }), null)
    assert.equal(O.whatsappSablonu('saglikim_yeni_mesaj', { hastaAdi: 'A', doktorAdi: 'Dr. X', link: 'https://kotu.example/portal/hasta/x' }), null)
    for (const tur of ['randevu_degisikligi', 'randevu_iptali', 'bilgi_formu', 'asi_hatirlatma', 'serbest'] as const) {
      assert.equal(O.whatsappSablonu(tur, { hastaAdi: 'A', doktorAdi: 'Dr. X', randevuIso: iso, link: 'https://www.notya.io/portal/hasta/t' }), null, tur)
    }
  })

  it('OTOMATIK_TURLER klinik tür içermez ve personel türleriyle Sağlığım bildiriminden ibarettir', () => {
    assert.deepEqual([...O.OTOMATIK_TURLER].sort(), ['bilgi_formu', 'randevu_degisikligi', 'randevu_hatirlatma', 'randevu_iptali', 'saglikim_yeni_mesaj'])
  })

  it('Ana Sayfa kartı tek sakin satır', async () => {
    const { kartBasligi } = await import('../../components/doktor/iletisim/HazirMesajlar')
    assert.equal(kartBasligi(2, 6), 'Bugün 6 mesaj kendiliğinden gönderildi · 2 mesaj sizi bekliyor')
    assert.equal(kartBasligi(0, 6), 'Bugün 6 mesaj kendiliğinden gönderildi')
    assert.equal(kartBasligi(3, 0), 'Bugün 3 mesaj hazır')
  })

  it('kisaNeden: "yeniden denenecek" sözü verilmez, 200 karakteri aşmaz', () => {
    assert.equal(G.kisaNeden(['E-posta şu an gönderilemedi, birazdan yeniden denenebilir.']), 'Kendiliğinden gönderilemedi: E-posta şu an gönderilemedi.')
    assert.equal(G.kisaNeden(['Çok hızlı gönderim; birazdan yeniden denenecek.']), 'Kendiliğinden gönderilemedi: Çok hızlı gönderim.')
    assert.ok(G.kisaNeden(['x'.repeat(500)]).length <= 200)
  })
})
