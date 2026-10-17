/**
 * NOTYA-HASTA-ILETISIMI-01 hardening — behavioural tests for the bulk-send engine (kampanyaGonder):
 * idempotency, consent gating (only exactly `true` sends), fail-closed e-mail without the unsubscribe
 * secret, resumable 'bekliyor' rows (no double send, atomic claim), work cap → 'devam', and the
 * preview-vs-send drift guard. The senders are injected (kampanyaGonder's `bag` seam); the database
 * is the repo's in-memory stand-in plus the one thing it does not model: the
 * unique(kampanya_id, patient_id, kanal) constraint.
 *
 * Synthetic QA data only.
 */
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '../../security/testing/sahteSupabase'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-toplu-anahtari'
process.env.PORTAL_TOKEN_SECRET = 'qa-sentetik-portal-sirri'

type K = typeof import('./kampanya')
let K: K
let encrypt: (s: string) => string

const ALICILAR = 'hasta_iletisim_kampanya_alicilari'
let db: SahteVeritabani
let simdi = Date.parse('2026-10-16T10:00:00Z')

/** In-memory client + the unique(kampanya_id, patient_id, kanal) constraint (23505), like Postgres. */
function istemci(): any {
  const c = db.istemci()
  return {
    from: (t: string) => {
      const q = c.from(t)
      if (t === 'hasta_iletisim_kampanyalari') {
        return new Proxy(q, {
          get: (h, k) => k === 'insert'
            ? (y: Record<string, unknown>) => {
                const var0 = db.tablo(t).find((r) => r.doctor_id === y.doctor_id && r.idempotency_key === y.idempotency_key)
                if (!var0) return h.insert(y)
                const hata = { data: null, error: { code: '23505', message: 'duplicate key' } }
                return { select: () => ({ single: async () => hata }) }
              }
            : h[k as string],
        })
      }
      if (t !== ALICILAR) return q
      return new Proxy(q, {
        get: (h, k) => k === 'insert'
          ? (y: Record<string, unknown>) => {
              const var0 = db.tablo(ALICILAR).find((r) => r.kampanya_id === y.kampanya_id && r.patient_id === y.patient_id && r.kanal === y.kanal)
              return var0 ? Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key' } }) : h.insert(y)
            }
          : h[k as string],
      })
    },
  }
}

const DOKTOR = randomUUID()
function hasta(ad: string, o: Partial<{ izinEposta: unknown; izinSms: unknown; eposta: string | null; telefon: string | null }> = {}): any {
  return {
    id: randomUUID(), ad, dogumTarihi: '1980-01-01',
    telefon: o.telefon === undefined ? '0532 111 22 33' : o.telefon,
    eposta: o.eposta === undefined ? `${ad.toLowerCase().replace(/\s/g, '.')}@ornek.test` : o.eposta,
    izinWhatsapp: null, izinEposta: o.izinEposta === undefined ? true : o.izinEposta, izinSms: o.izinSms === undefined ? true : o.izinSms,
    etiketler: [], sonZiyaretIso: null, sonBrans: null, veliDili: false,
  }
}
function kampanya(kanal: 'sms' | 'eposta' | 'ikisi', doktorId = DOKTOR): string {
  return db.ekle('hasta_iletisim_kampanyalari', {
    doctor_id: doktorId, idempotency_key: randomUUID(), kanal, konu: 'Konu', govde: 'Merhaba', filtre: {}, hedef_sayisi: 0,
    durum: 'taslak', olusturan_user_id: doktorId, olusturan_personel_id: null,
  }).id
}

function sahteler(aday: any[], o: { vazgecAnahtari?: boolean; epostaHata?: string; smsHata?: string } = {}) {
  const eposta: any[] = []
  const sms: any[] = []
  const bag = {
    adaylariGetir: async () => aday,
    epostaGondericisi: {
      kanal: 'eposta' as const,
      hazirMi: async () => true,
      gonder: async (g: any) => { eposta.push(g); return o.epostaHata ? { ok: false as const, hata: o.epostaHata } : { ok: true as const, disId: `m-${eposta.length}` } },
    } as any,
    smsGonder: async (_s: any, i: any) => { sms.push(i); return o.smsHata ? { ok: false as const, hata: o.smsHata } : { ok: true as const, saglayiciMesajId: `s-${sms.length}` } },
    hazirSmsGonderici: async () => ({}) as any,
    vazgecAnahtariVarMi: () => o.vazgecAnahtari !== false,
    vazgecBaglantisi: (d: string, p: string) => (o.vazgecAnahtari === false ? null : `https://www.notya.io/api/iletisim/vazgec/${d}.${p}.eposta.imza`),
    simdi: () => simdi,
  }
  return { bag, eposta, sms }
}
const satirlar = (kid: string) => db.tablo(ALICILAR).filter((r) => r.kampanya_id === kid)

before(async () => {
  K = await import('./kampanya')
  ;({ encrypt } = await import('../../security/encryption'))
})
beforeEach(() => { db = new SahteVeritabani(); simdi = Date.parse('2026-10-16T10:00:00Z') })

describe('kampanyaGonder — idempotency', () => {
  it('aynı kampanya iki kez gönderilince her alıcıya tek mesaj gider', async () => {
    const a = [hasta('Ali Veli'), hasta('Ayşe Kaya')]
    const kid = kampanya('eposta')
    const f = sahteler(a)
    const r1 = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    const r2 = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(r1.durum, 'tamamlandi')
    assert.equal(r1.sonuclar.filter((s) => s.durum === 'gonderildi').length, 2)
    assert.equal(r2.durum, 'tamamlandi')
    assert.equal(f.eposta.length, 2, 'ikinci çağrı yeniden göndermemeli')
  })

  it('tamamlanmamış (gonderiliyor) kampanya yeniden çağrılsa da gonderildi satırlar tekrar gönderilmez', async () => {
    const a = [hasta('Ali Veli'), hasta('Ayşe Kaya')]
    const kid = kampanya('eposta')
    const f = sahteler(a)
    await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    db.tablo('hasta_iletisim_kampanyalari').find((r) => r.id === kid)!.durum = 'gonderiliyor'
    const r2 = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(f.eposta.length, 2)
    assert.equal(r2.sonuclar.length, 0)
    assert.equal(satirlar(kid).length, 2, 'unique(kampanya, hasta, kanal): satır sayısı değişmez')
  })

  it('başka hekimin kampanyası bu hekim kimliğiyle gönderilemez', async () => {
    const kid = kampanya('eposta', randomUUID())
    const f = sahteler([hasta('Ali Veli')])
    await assert.rejects(() => K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag), /bulunamadı/)
    assert.equal(f.eposta.length, 0)
  })
})

describe('kampanyaGonder — rıza: yalnızca tam olarak true gönderir', () => {
  it('null / false / "true" / 1 atlanır, true gönderilir', async () => {
    const tamam = hasta('Izinli Hasta', { izinEposta: true })
    const a = [
      tamam,
      hasta('Null Hasta', { izinEposta: null }),
      hasta('Yok Hasta', { izinEposta: false }),
      hasta('Metin Hasta', { izinEposta: 'true' }),
      hasta('Sayi Hasta', { izinEposta: 1 }),
    ]
    const kid = kampanya('eposta')
    const f = sahteler(a)
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(f.eposta.length, 1)
    assert.equal(f.eposta[0].alici, tamam.eposta)
    assert.equal(r.sonuclar.filter((s) => s.durum === 'atlandi' && s.sebep === 'izin_yok').length, 4)
    assert.equal(satirlar(kid).filter((x) => x.durum === 'atlandi' && x.atlama_sebebi === 'izin_yok').length, 4)
  })

  it('SMS: izinSms null/false atlanır; gönderilen metin STOP satırını içerir', async () => {
    const a = [hasta('Izinli Hasta', { izinSms: true }), hasta('Null', { izinSms: null }), hasta('Yok', { izinSms: false })]
    const f = sahteler(a)
    await K.kampanyaGonder(istemci(), DOKTOR, kampanya('sms'), f.bag)
    assert.equal(f.sms.length, 1)
    assert.match(f.sms[0].metin, /STOP yazıp gönderin/)
    assert.match(f.sms[0].alici, /^\+90/)
  })

  it('adresi olmayan hasta adres_yok olarak atlanır', async () => {
    const f = sahteler([hasta('Adressiz', { eposta: null })])
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kampanya('eposta'), f.bag)
    assert.equal(r.sonuclar[0].sebep, 'adres_yok')
    assert.equal(f.eposta.length, 0)
  })
})

describe('kampanyaGonder — abonelikten çıkma anahtarı yoksa e-posta gitmez (fail closed)', () => {
  it('kanal eposta + anahtar yok → hiçbir şey gönderilmez, satır yazılmaz, açık hata', async () => {
    const kid = kampanya('eposta')
    const f = sahteler([hasta('Ali Veli')], { vazgecAnahtari: false })
    await assert.rejects(() => K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag), (e: any) => e instanceof K.KampanyaHatasi && e.kod === 'vazgec_anahtari_yok' && /PORTAL_TOKEN_SECRET/.test(e.message))
    assert.equal(f.eposta.length, 0)
    assert.equal(satirlar(kid).length, 0)
  })

  it('bağlantı satır bazında üretilemezse (anahtar kontrolü geçse bile) satır atlandi/vazgec_baglantisi_yok olur, e-posta gitmez', async () => {
    const kid = kampanya('eposta')
    const f = sahteler([hasta('Ali Veli')])
    f.bag.vazgecBaglantisi = () => null as any
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(f.eposta.length, 0)
    assert.deepEqual(r.sonuclar.map((s) => [s.durum, s.sebep]), [['atlandi', 'vazgec_baglantisi_yok']])
    assert.equal(satirlar(kid)[0].atlama_sebebi, 'vazgec_baglantisi_yok')
  })

  it('kanal ikisi + anahtar yok → SMS de dahil hiçbir şey gönderilmez (önce tamamen reddedilir)', async () => {
    const f = sahteler([hasta('Ali Veli')], { vazgecAnahtari: false })
    await assert.rejects(() => K.kampanyaGonder(istemci(), DOKTOR, kampanya('ikisi'), f.bag), /PORTAL_TOKEN_SECRET/)
    assert.equal(f.sms.length + f.eposta.length, 0)
  })

  it('yalnız SMS kampanyası anahtardan etkilenmez', async () => {
    const f = sahteler([hasta('Ali Veli')], { vazgecAnahtari: false })
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kampanya('sms'), f.bag)
    assert.equal(f.sms.length, 1)
    assert.equal(r.durum, 'tamamlandi')
  })

  it('e-posta gövdesi imzalı vazgeç bağlantısını taşır', async () => {
    const f = sahteler([hasta('Ali Veli')])
    await K.kampanyaGonder(istemci(), DOKTOR, kampanya('eposta'), f.bag)
    assert.match(f.eposta[0].metin, /https:\/\/www\.notya\.io\/api\/iletisim\/vazgec\//)
  })
})

describe('kampanyaGonder — takılı bekliyor satırları (devam ettirilebilir)', () => {
  function bekleyenSatir(kid: string, h: any, o: { deneme?: number; yasMs?: number; kanal?: string } = {}) {
    const t = new Date(simdi - (o.yasMs ?? 10 * 60_000)).toISOString()
    return db.ekle(ALICILAR, { kampanya_id: kid, doctor_id: DOKTOR, patient_id: h.id, kanal: o.kanal || 'eposta', durum: 'bekliyor', atlama_sebebi: null, talep_at: t, deneme: o.deneme ?? 1, created_at: t })
  }

  it('eski bekliyor satırı bir kez yeniden denenir; gonderildi olanlara dokunulmaz', async () => {
    const takili = hasta('Takili Hasta'), bitmis = hasta('Bitmis Hasta')
    const kid = kampanya('eposta')
    bekleyenSatir(kid, takili)
    db.ekle(ALICILAR, { kampanya_id: kid, doctor_id: DOKTOR, patient_id: bitmis.id, kanal: 'eposta', durum: 'gonderildi', deneme: 1 })
    const f = sahteler([takili, bitmis])
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(f.eposta.length, 1)
    assert.equal(f.eposta[0].alici, takili.eposta)
    assert.equal(r.durum, 'tamamlandi')
    const s = satirlar(kid).find((x) => x.patient_id === takili.id)!
    assert.equal(s.durum, 'gonderildi')
    assert.equal(s.deneme, 2)
    // a further retry sends nothing
    await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(f.eposta.length, 1)
  })

  it('henüz taze bekliyor satırı (başka istek çalışıyor olabilir) dokunulmadan bırakılır → devam', async () => {
    const h = hasta('Taze Hasta')
    const kid = kampanya('eposta')
    bekleyenSatir(kid, h, { yasMs: 5_000 })
    const f = sahteler([h])
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(f.eposta.length, 0)
    assert.equal(r.durum, 'devam')
    assert.equal(r.kalan, 1)
    assert.equal(db.tablo('hasta_iletisim_kampanyalari').find((x) => x.id === kid)!.durum, 'gonderiliyor')
  })

  it('iki eşzamanlı yeniden deneme: satır atomik sahiplenilir, e-posta bir kez gider', async () => {
    const h = hasta('Yaris Hasta')
    const kid = kampanya('eposta')
    bekleyenSatir(kid, h)
    const f = sahteler([h])
    const [r1, r2] = await Promise.all([
      K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag),
      K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag),
    ])
    assert.equal(f.eposta.length, 1, 'çift gönderim yok')
    assert.equal([r1, r2].filter((r) => r.sonuclar.some((s) => s.durum === 'gonderildi')).length, 1)
    assert.equal(satirlar(kid)[0].durum, 'gonderildi')
  })

  it('zaten iki kez denenmiş (deneme=2) satır tekrar gönderilmez, basarisiz/zaman_asimi olarak kapanır', async () => {
    const h = hasta('Ikinci Deneme')
    const kid = kampanya('eposta')
    bekleyenSatir(kid, h, { deneme: 2 })
    const f = sahteler([h])
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(f.eposta.length, 0)
    assert.deepEqual(r.sonuclar.map((s) => [s.durum, s.sebep]), [['basarisiz', 'zaman_asimi']])
    assert.equal(r.durum, 'tamamlandi')
  })

  it('yeniden denemede rıza yeniden değerlendirilir: bu arada vazgeçen hastaya gönderilmez', async () => {
    const h = hasta('Vazgecen Hasta', { izinEposta: false })
    const kid = kampanya('eposta')
    bekleyenSatir(kid, h)
    const f = sahteler([h])
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(f.eposta.length, 0)
    assert.equal(r.sonuclar[0].sebep, 'izin_yok')
    assert.equal(satirlar(kid)[0].durum, 'atlandi')
  })

  it('kitleden çıkmış hastanın eski bekliyor satırı gönderilmeden kapatılır', async () => {
    const gitti = hasta('Kitleden Cikan'), kalan = hasta('Kalan Hasta')
    const kid = kampanya('eposta')
    bekleyenSatir(kid, gitti)
    const f = sahteler([kalan])
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(f.eposta.length, 1)
    assert.equal(r.durum, 'tamamlandi')
    assert.equal(satirlar(kid).find((x) => x.patient_id === gitti.id)!.atlama_sebebi, 'hedef_disi')
  })
})

describe('kampanyaGonder — istek başına iş sınırı', () => {
  it('sınır aşılınca sessizce kesmez: durum devam + kalan; aynı anahtarla tekrar çağrı kalanı tamamlar, kimseye iki kez gitmez', async () => {
    const a = [1, 2, 3, 4, 5].map((i) => hasta(`Hasta ${i}`))
    const kid = kampanya('eposta')
    const f = sahteler(a)
    const r1 = await K.kampanyaGonder(istemci(), DOKTOR, kid, { ...f.bag, istekAliciSiniri: 2 })
    assert.equal(r1.durum, 'devam')
    assert.equal(r1.kalan, 3)
    assert.equal(f.eposta.length, 2)
    const r2 = await K.kampanyaGonder(istemci(), DOKTOR, kid, { ...f.bag, istekAliciSiniri: 2 })
    assert.equal(r2.durum, 'devam')
    assert.equal(f.eposta.length, 4)
    const r3 = await K.kampanyaGonder(istemci(), DOKTOR, kid, { ...f.bag, istekAliciSiniri: 2 })
    assert.equal(r3.durum, 'tamamlandi')
    assert.equal(f.eposta.length, 5)
    assert.equal(new Set(f.eposta.map((e) => e.alici)).size, 5)
  })

  it('süre bütçesi dolunca da devam döner', async () => {
    const a = [hasta('A Hasta'), hasta('B Hasta')]
    const f = sahteler(a)
    f.bag.epostaGondericisi = { ...f.bag.epostaGondericisi, gonder: async (g: any) => { f.eposta.push(g); simdi += 100_000; return { ok: true, disId: 'x' } } }
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kampanya('eposta'), { ...f.bag, sureButcesiMs: 50_000 })
    assert.equal(r.durum, 'devam')
    assert.equal(f.eposta.length, 1)
  })
})

describe('kampanyaGonder — sağlayıcı hatası', () => {
  it('e-posta sağlayıcı hatası basarisiz olarak kaydedilir, tekrar gönderim denenmez', async () => {
    const kid = kampanya('eposta')
    const f = sahteler([hasta('Ali Veli')], { epostaHata: 'SMTP 550' })
    const r = await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(r.sonuclar[0].durum, 'basarisiz')
    assert.equal(satirlar(kid)[0].hata, 'SMTP 550')
    await K.kampanyaGonder(istemci(), DOKTOR, kid, f.bag)
    assert.equal(f.eposta.length, 1)
  })
})

describe('önizleme ↔ gönderim sapması', () => {
  it('küçük oynama serbest, belirgin sapma reddedilir', () => {
    assert.equal(K.onizlemeSapmasiBuyukMu(100, 100), false)
    assert.equal(K.onizlemeSapmasiBuyukMu(100, 102), false)
    assert.equal(K.onizlemeSapmasiBuyukMu(100, 108), false)
    assert.equal(K.onizlemeSapmasiBuyukMu(100, 130), true)
    assert.equal(K.onizlemeSapmasiBuyukMu(5, 9), true)
    assert.equal(K.onizlemeSapmasiBuyukMu(5, 7), false)
    assert.equal(K.onizlemeSapmasiBuyukMu(0, 50), true)
  })

  it('kampanyaOlustur: önizlenen 2, şimdiki 10 → onizleme_degisti; aynı anahtarla mevcut kampanya varsa serbest', async () => {
    for (let i = 0; i < 10; i++) {
      db.ekle('patients', { doctor_id: DOKTOR, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: `Hasta ${i}` })), dob_encrypted: encrypt('1980-01-01'), phone_encrypted: encrypt('0532 111 22 33'), email_encrypted: encrypt('a@ornek.test'), iletisim_izni_eposta: true })
    }
    const kimlik = { userId: DOKTOR, personelId: null, rol: 'doktor' as const }
    const girdi = { filtre: {}, kanal: 'eposta' as const, govde: 'Merhaba', idempotencyKey: 'anahtar-1', onizlemeHedefSayisi: 2 }
    await assert.rejects(() => K.kampanyaOlustur(istemci(), DOKTOR, kimlik, girdi), (e: any) => e.kod === 'onizleme_degisti' && /önizlemeyi yenileyip/.test(e.message) && /2 hasta/.test(e.message) && /10 hasta/.test(e.message))
    assert.equal(db.tablo('hasta_iletisim_kampanyalari').length, 0)
    const ok = await K.kampanyaOlustur(istemci(), DOKTOR, kimlik, { ...girdi, onizlemeHedefSayisi: 10 })
    assert.equal(ok.hedefSayisi, 10)
    // retry of the SAME campaign with a stale preview number is not a drift error
    const tekrar = await K.kampanyaOlustur(istemci(), DOKTOR, kimlik, { ...girdi, onizlemeHedefSayisi: 2 })
    assert.equal(tekrar.kampanyaId, ok.kampanyaId)
  })
})
