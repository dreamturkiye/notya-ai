/**
 * NOTYA-ILETISIM-03 — WhatsApp (Meta Cloud API, coexistence) sağlayıcı mantığı.
 * Tüm HTTP sahte (`fetch` enjekte), veritabanı bellek içi (sahteSupabase). Gerçek Meta çağrısı YOK.
 * Veri sentetik (QA).
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

process.env.ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'qa-test-anahtari-whatsapp'

import { SahteVeritabani } from '../../../security/testing/sahteSupabase'
import { whatsappAyar } from './ayar'
import { imzaGecerliMi, dogrulamaYaniti, olaylariAyikla } from './webhook'
import { SABLONLAR, sablonGovdesi, sablonlariHazirla, sablonOzeti } from './sablonlar'
import { sablonMesajiKur, sablonGonder } from './gonder'
import { kurulumGirdisiDogrula, kurulumuTamamla, baglantiKaldir, numaraSec } from './kurulum'
import { baglantiKaydet, baglantiOku, webhookOlaylariniIsle, TABLO, TESLIM_TABLOSU } from './depo'
import { whatsappGondericisi } from './index'
import { WhatsAppBaglanKarti, oturumBilgisiCoz } from '../../../../components/doktor/iletisim/WhatsAppBaglan'

const ENV = {
  META_APP_ID: '111', META_APP_SECRET: 'sir-qa', META_ES_CONFIG_ID: '222', WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'dogrula-qa', ENCRYPTION_MASTER_KEY: 'x',
} as unknown as NodeJS.ProcessEnv
const AYAR = whatsappAyar(ENV)!
const DOKTOR_A = '00000000-0000-4000-8000-00000000000a'
const DOKTOR_B = '00000000-0000-4000-8000-00000000000b'

type Cagri = { url: URL; method: string; body: any; auth: string | null }
function sahteFetch(yanit: (c: Cagri) => { status?: number; json: unknown }) {
  const cagrilar: Cagri[] = []
  const f = async (u: string, init?: RequestInit) => {
    const headers = (init?.headers || {}) as Record<string, string>
    const c: Cagri = { url: new URL(u), method: init?.method || 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined, auth: headers.Authorization || null }
    cagrilar.push(c)
    const y = yanit(c)
    return new Response(JSON.stringify(y.json), { status: y.status ?? 200, headers: { 'Content-Type': 'application/json' } })
  }
  return { f, cagrilar }
}

describe('ayar: ortam değişkenleri yokken özellik kapalı', () => {
  it('eksik değişken → null', () => {
    assert.equal(whatsappAyar({} as NodeJS.ProcessEnv), null)
    assert.equal(whatsappAyar({ ...ENV, META_ES_CONFIG_ID: '' } as NodeJS.ProcessEnv), null)
    assert.equal(whatsappAyar({ ...ENV, ENCRYPTION_MASTER_KEY: '' } as NodeJS.ProcessEnv), null)
    assert.deepEqual(AYAR, { appId: '111', appSecret: 'sir-qa', configId: '222', verifyToken: 'dogrula-qa' })
  })
})

describe('webhook: imza, doğrulama, yalnız teslim durumu', () => {
  const govde = JSON.stringify({ object: 'whatsapp_business_account', entry: [] })
  const imza = 'sha256=' + createHmac('sha256', 'sir-qa').update(govde).digest('hex')

  it('X-Hub-Signature-256 doğru/yanlış/eksik', () => {
    assert.equal(imzaGecerliMi(govde, imza, 'sir-qa'), true)
    assert.equal(imzaGecerliMi(govde + ' ', imza, 'sir-qa'), false)
    assert.equal(imzaGecerliMi(govde, imza, 'baska-sir'), false)
    assert.equal(imzaGecerliMi(govde, null, 'sir-qa'), false)
    assert.equal(imzaGecerliMi(govde, 'sha256=abc', 'sir-qa'), false)
    assert.equal(imzaGecerliMi(govde, imza.replace('sha256=', 'sha1='), 'sir-qa'), false)
  })

  it('GET doğrulaması yalnız doğru token ile challenge döner', () => {
    assert.equal(dogrulamaYaniti(new URLSearchParams('hub.mode=subscribe&hub.verify_token=dogrula-qa&hub.challenge=42'), 'dogrula-qa'), '42')
    assert.equal(dogrulamaYaniti(new URLSearchParams('hub.mode=subscribe&hub.verify_token=yanlis-qa&hub.challenge=42'), 'dogrula-qa'), null)
    assert.equal(dogrulamaYaniti(new URLSearchParams('hub.mode=unsubscribe&hub.verify_token=dogrula-qa&hub.challenge=42'), 'dogrula-qa'), null)
  })

  it('statuses ayıklanır; gelen mesaj gövdesi ve echo/history ASLA dönmez', () => {
    const o = olaylariAyikla({
      object: 'whatsapp_business_account',
      entry: [{
        id: 'WABA1',
        changes: [
          { field: 'messages', value: {
            messaging_product: 'whatsapp', metadata: { display_phone_number: '905550000000', phone_number_id: 'PN1' },
            contacts: [{ wa_id: '905551112233', profile: { name: 'QA Hasta GIZLI-7Q' } }],
            messages: [{ from: '905551112233', id: 'wamid.gelen', type: 'text', text: { body: 'GIZLI-GOVDE-7Q ağrım var' } }],
            statuses: [
              { id: 'wamid.1', status: 'delivered', timestamp: '1760000000', recipient_id: '905551112233' },
              { id: 'wamid.2', status: 'failed', timestamp: '1760000001', recipient_id: '905551112233', errors: [{ code: 131026, title: 'x' }] },
              { id: 'wamid.3', status: 'bilinmeyen' },
            ],
          } },
          { field: 'smb_message_echoes', value: { message_echoes: [{ text: { body: 'GIZLI-ECHO-7Q' } }] } },
          { field: 'history', value: { history: [{ threads: [{ messages: [{ text: { body: 'GIZLI-GECMIS-7Q' } }] }] }] } },
          { field: 'message_template_status_update', value: { event: 'APPROVED', message_template_id: 9, message_template_name: 'randevu_hatirlatma', message_template_language: 'tr' } },
          { field: 'account_update', value: { event: 'PARTNER_REMOVED' } },
        ],
      }],
    })
    assert.deepEqual(o.teslim.map((t) => [t.mesajId, t.durum, t.hataKodu]), [['wamid.1', 'delivered', null], ['wamid.2', 'failed', '131026']])
    assert.equal(o.teslim[0].zaman, new Date(1760000000 * 1000).toISOString())
    assert.deepEqual(o.sablon, [{ wabaId: 'WABA1', sablonAdi: 'randevu_hatirlatma', sablonId: '9', durum: 'APPROVED' }])
    assert.deepEqual(o.kaldirilanWabalar, ['WABA1'])
    const metin = JSON.stringify(o)
    for (const gizli of ['GIZLI-GOVDE', 'GIZLI-ECHO', 'GIZLI-GECMIS', 'QA Hasta', '905551112233']) assert.ok(!metin.includes(gizli), `${gizli} sızdı`)
  })

  it('başka nesne türü → boş', () => {
    assert.deepEqual(olaylariAyikla({ object: 'page', entry: [{ changes: [{ field: 'messages', value: { statuses: [{ id: 'x', status: 'sent' }] } }] }] }).teslim, [])
    assert.deepEqual(olaylariAyikla(null).teslim, [])
  })
})

describe('şablonlar: Türkçe UTILITY, klinik ayrıntı yok', () => {
  it('gövde değişkenle başlamaz/bitmez, örnek sayısı değişken sayısına eşit', () => {
    for (const t of Object.values(SABLONLAR)) {
      const g = sablonGovdesi(t)
      assert.equal(g.category, 'UTILITY'); assert.equal(g.language, 'tr'); assert.equal(g.name, t.kod)
      assert.ok(!/^\s*\{\{/.test(t.govde) && !/\}\}\s*$/.test(t.govde), `${t.kod}: değişkenle başlıyor/bitiyor`)
      const n = (t.govde.match(/\{\{\d+\}\}/g) || []).length
      assert.equal(t.ornek.length, n, `${t.kod}: örnek sayısı`)
      assert.ok(!/tanı|ilaç|tahlil|sonuç|reçete/i.test(t.govde), `${t.kod}: klinik kelime`)
    }
    const s = sablonGovdesi(SABLONLAR.saglikim_yeni_mesaj)
    assert.deepEqual((s.components[1] as any).buttons[0].url, 'https://www.notya.io/portal/hasta/{{1}}')
  })

  it('eksikleri oluşturur, var olanı yeniden oluşturmaz', async () => {
    const { f, cagrilar } = sahteFetch((c) => {
      if (c.method === 'GET') return { json: { data: [{ id: '5', name: 'randevu_hatirlatma', status: 'APPROVED', language: 'tr' }, { id: '6', name: 'baska', status: 'APPROVED', language: 'tr' }] } }
      return { json: { id: '7', status: 'PENDING', category: 'UTILITY' } }
    })
    const d = await sablonlariHazirla('WABA1', 'TOKEN-QA', f)
    assert.equal(d.randevu_hatirlatma?.durum, 'APPROVED')
    assert.deepEqual([d.saglikim_yeni_mesaj?.id, d.saglikim_yeni_mesaj?.durum], ['7', 'PENDING'])
    const post = cagrilar.filter((c) => c.method === 'POST')
    assert.equal(post.length, 1)
    assert.equal(post[0].url.pathname, '/v25.0/WABA1/message_templates')
    assert.equal(post[0].body.name, 'saglikim_yeni_mesaj')
    assert.equal(post[0].auth, 'Bearer TOKEN-QA')
    assert.equal(sablonOzeti(d), 'bekliyor')
    assert.equal(sablonOzeti({ randevu_hatirlatma: { id: '1', durum: 'APPROVED', guncellendi: '' }, saglikim_yeni_mesaj: { id: '2', durum: 'APPROVED', guncellendi: '' } }), 'hazir')
    assert.equal(sablonOzeti({ randevu_hatirlatma: { id: '1', durum: 'REJECTED', guncellendi: '' } }), 'sorun')
  })
})

describe('gönderim: Cloud API şablon mesajı', () => {
  it('randevu_hatirlatma gövdesi', () => {
    const m = sablonMesajiKur('randevu_hatirlatma', '0555 111 22 33', ['QA Ayşe', '12 Ekim Pazartesi', '14:30', 'Dr. QA'])
    assert.ok('govde' in m)
    assert.deepEqual(m.govde, {
      messaging_product: 'whatsapp', recipient_type: 'individual', to: '905551112233', type: 'template',
      template: { name: 'randevu_hatirlatma', language: { code: 'tr' }, components: [{ type: 'body', parameters: ['QA Ayşe', '12 Ekim Pazartesi', '14:30', 'Dr. QA'].map((text) => ({ type: 'text', text })) }] },
    })
  })

  it('saglikim_yeni_mesaj: bağlantı düğme sonekine gider, yabancı alan adı reddedilir', () => {
    const m = sablonMesajiKur('saglikim_yeni_mesaj', '+905551112233', ['QA Ayşe', 'Dr. QA', 'https://www.notya.io/portal/hasta/tok123'])
    assert.ok('govde' in m)
    const comps = (m.govde.template as any).components
    assert.deepEqual(comps[0].parameters.map((p: any) => p.text), ['QA Ayşe', 'Dr. QA'])
    assert.deepEqual(comps[1], { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: 'tok123' }] })
    assert.ok('hata' in sablonMesajiKur('saglikim_yeni_mesaj', '+905551112233', ['QA', 'Dr', 'https://kotu.example/x']))
  })

  it('eksik değişken / geçersiz numara / satır sonu temizliği', () => {
    assert.ok('hata' in sablonMesajiKur('randevu_hatirlatma', '05551112233', ['QA', 'tarih']))
    assert.ok('hata' in sablonMesajiKur('randevu_hatirlatma', '05551112233', ['QA', 'tarih', ' ', 'Dr']))
    assert.ok('hata' in sablonMesajiKur('randevu_hatirlatma', '123', ['QA', 'tarih', 'saat', 'Dr']))
    const m = sablonMesajiKur('randevu_hatirlatma', '05551112233', ['QA\nAyşe', 'a', 'b', 'c'])
    assert.ok('govde' in m && (m.govde.template as any).components[0].parameters[0].text === 'QA Ayşe')
  })

  it('başarılı gönderim wamid döner; Meta hatası Türkçeye çevrilir', async () => {
    const ok = sahteFetch(() => ({ json: { messaging_product: 'whatsapp', contacts: [{ wa_id: '905551112233' }], messages: [{ id: 'wamid.QA1' }] } }))
    const r = await sablonGonder({ phoneNumberId: 'PN1', token: 'TOKEN-QA' }, 'randevu_hatirlatma', '05551112233', ['QA', 'a', 'b', 'c'], ok.f)
    assert.deepEqual(r, { ok: true, disId: 'wamid.QA1' })
    assert.equal(ok.cagrilar[0].url.pathname, '/v25.0/PN1/messages')
    assert.equal(ok.cagrilar[0].auth, 'Bearer TOKEN-QA')

    const kotu = sahteFetch(() => ({ status: 400, json: { error: { message: 'x', code: 131026 } } }))
    const h = await sablonGonder({ phoneNumberId: 'PN1', token: 'TOKEN-QA' }, 'randevu_hatirlatma', '05551112233', ['QA', 'a', 'b', 'c'], kotu.f)
    assert.equal(h.ok, false)
    assert.ok(!h.ok && /WhatsApp/.test(h.hata) && !h.hata.includes('TOKEN-QA'))
  })
})

describe('kurulum: Embedded Signup tamamlama', () => {
  let db: SahteVeritabani
  let sb: any
  beforeEach(() => { db = new SahteVeritabani(); sb = db.istemci() })

  const metaSahte = (o: { numaralar?: string[]; abonelikHata?: boolean } = {}) => sahteFetch((c) => {
    const p = c.url.pathname
    if (p.endsWith('/oauth/access_token')) {
      assert.equal(c.url.searchParams.get('client_secret'), 'sir-qa')
      return c.url.searchParams.get('code') === 'KOD-QA' ? { json: { access_token: 'TOKEN-QA', token_type: 'bearer' } } : { status: 400, json: { error: { message: 'bad code', code: 100 } } }
    }
    if (p.endsWith('/WABA1/phone_numbers')) return { json: { data: (o.numaralar || ['PN1']).map((id) => ({ id, display_phone_number: '+90 555 000 00 00', verified_name: 'QA Klinik', is_on_biz_app: true, platform_type: 'CLOUD_API' })) } }
    if (p.endsWith('/smb_app_data')) return { json: { request_id: 'R1' } }
    if (p.endsWith('/WABA1/subscribed_apps')) return o.abonelikHata ? { status: 400, json: { error: { message: 'x', code: 200 } } } : { json: { success: true } }
    if (p.endsWith('/WABA1/message_templates')) return c.method === 'GET' ? { json: { data: [] } } : { json: { id: 'T' + c.body.name, status: 'PENDING' } }
    return { status: 404, json: { error: { message: 'beklenmeyen ' + p, code: 1 } } }
  })

  const girdi = { code: 'KOD-QA', wabaId: 'WABA1', phoneNumberId: 'PN1', businessId: '333' }

  it('girdi doğrulaması', () => {
    assert.deepEqual(kurulumGirdisiDogrula({ code: 'k', wabaId: '12345', phoneNumberId: '67890' }), { code: 'k', wabaId: '12345', phoneNumberId: '67890', businessId: null })
    assert.deepEqual(kurulumGirdisiDogrula({ code: 'k', wabaId: '12345', phoneNumberId: null }), { code: 'k', wabaId: '12345', phoneNumberId: null, businessId: null })
    assert.equal(kurulumGirdisiDogrula({ code: 'k', wabaId: '12/../x', phoneNumberId: '67890' }), null)
    assert.equal(kurulumGirdisiDogrula({ code: 'k', wabaId: '12345', phoneNumberId: '1/messages' }), null)
    assert.equal(kurulumGirdisiDogrula({ wabaId: '12345', phoneNumberId: '67890' }), null)
    assert.equal(kurulumGirdisiDogrula(null), null)
  })

  it('numaraSec: oturumdaki numara WABA\'da olmalı; yoksa tek uygulama numarası; belirsizse hiçbiri', () => {
    const a = { id: 'PN1', is_on_biz_app: true }, b = { id: 'PN2', is_on_biz_app: false }
    assert.equal(numaraSec([a, b], 'PN2'), b)
    assert.equal(numaraSec([a, b], 'PN9'), null)
    assert.equal(numaraSec([a, b], null), a)
    assert.equal(numaraSec([a, { ...b, is_on_biz_app: true }], null), null)
  })

  it('coexistence bitişi yalnız waba_id taşıyınca numara WABA\'dan çözülür', async () => {
    const s = await kurulumuTamamla(sb, DOKTOR_A, { ...girdi, phoneNumberId: null }, AYAR, metaSahte().f)
    assert.deepEqual(s, { ok: true, numara: '+90 555 000 00 00' })
    assert.equal(db.tablo(TABLO)[0].phone_number_id, 'PN1')
  })

  it('kod → anahtar, numara doğrulanır, abone olunur, eşitleme başlar, şablonlar kurulur, anahtar şifreli saklanır; /register çağrılmaz', async () => {
    const { f, cagrilar } = metaSahte()
    const s = await kurulumuTamamla(sb, DOKTOR_A, girdi, AYAR, f)
    assert.deepEqual(s, { ok: true, numara: '+90 555 000 00 00' })
    const satir = db.tablo(TABLO)[0]
    assert.equal(satir.doctor_id, DOKTOR_A)
    assert.ok(satir.token_encrypted && !String(satir.token_encrypted).includes('TOKEN-QA'))
    assert.deepEqual(Object.keys(satir.sablon_durumlari).sort(), ['randevu_hatirlatma', 'saglikim_yeni_mesaj'])
    assert.ok(cagrilar.some((c) => c.method === 'POST' && c.url.pathname.endsWith('/WABA1/subscribed_apps')))
    assert.ok(!cagrilar.some((c) => /\/register$|\/deregister$/.test(c.url.pathname)), 'coexistence numarası yeniden kaydedilmemeli')
    assert.deepEqual(cagrilar.filter((c) => c.url.pathname.endsWith('/PN1/smb_app_data')).map((c) => c.body.sync_type), ['smb_app_state_sync', 'history'])
    // Kod değişimi sunucu-sunucu, app secret yalnız bu çağrıda; diğer çağrılarda yok.
    assert.ok(cagrilar.filter((c) => !c.url.pathname.endsWith('/oauth/access_token')).every((c) => !c.url.search.includes('sir-qa')))
    const b = await baglantiOku(sb, DOKTOR_A)
    assert.equal(b?.token, 'TOKEN-QA')
  })

  it('tarayıcıdan gelen numara anahtarın WABA\'sında değilse kaydetmez', async () => {
    const { f } = metaSahte({ numaralar: ['PN-BASKA'] })
    const s = await kurulumuTamamla(sb, DOKTOR_A, girdi, AYAR, f)
    assert.equal(s.ok, false)
    assert.equal(db.tablo(TABLO).length, 0)
  })

  it('geçersiz kod / abonelik hatası → kayıt yok, Türkçe hata', async () => {
    const s1 = await kurulumuTamamla(sb, DOKTOR_A, { ...girdi, code: 'YANLIS' }, AYAR, metaSahte().f)
    assert.ok(!s1.ok && /yeniden deneyin/.test(s1.hata))
    const s2 = await kurulumuTamamla(sb, DOKTOR_A, girdi, AYAR, metaSahte({ abonelikHata: true }).f)
    assert.equal(s2.ok, false)
    assert.equal(db.tablo(TABLO).length, 0)
  })

  it('aynı numara başka doktora bağlıysa devralmaz', async () => {
    await kurulumuTamamla(sb, DOKTOR_B, girdi, AYAR, metaSahte().f)
    const s = await kurulumuTamamla(sb, DOKTOR_A, girdi, AYAR, metaSahte().f)
    assert.ok(!s.ok && s.durum === 409)
    assert.equal(db.tablo(TABLO).filter((r) => r.doctor_id === DOKTOR_A).length, 0)
  })

  it('bağlantıyı kaldır: abonelik silinir, satır gider; Meta ulaşılamasa da satır gider', async () => {
    await kurulumuTamamla(sb, DOKTOR_A, girdi, AYAR, metaSahte().f)
    await kurulumuTamamla(sb, DOKTOR_B, { ...girdi, phoneNumberId: 'PN2' }, AYAR, metaSahte({ numaralar: ['PN2'] }).f)
    const { f, cagrilar } = sahteFetch(() => ({ json: { success: true } }))
    await baglantiKaldir(sb, DOKTOR_A, f)
    assert.ok(cagrilar.some((c) => c.method === 'DELETE' && c.url.pathname.endsWith('/WABA1/subscribed_apps')))
    assert.deepEqual(db.tablo(TABLO).map((r) => r.doctor_id), [DOKTOR_B])
    await baglantiKaldir(sb, DOKTOR_B, async () => { throw new Error('ağ yok') })
    assert.equal(db.tablo(TABLO).length, 0)
  })
})

describe('gonderici sözleşmesi + webhook yazımı', () => {
  let db: SahteVeritabani
  let sb: any
  beforeEach(async () => {
    db = new SahteVeritabani(); sb = db.istemci()
    await baglantiKaydet(sb, { doktorId: DOKTOR_A, businessId: null, wabaId: 'WABA1', phoneNumberId: 'PN1', gorunenNumara: '+90 555', gorunenAd: 'QA', token: 'TOKEN-QA', sablonlar: { randevu_hatirlatma: { id: '1', durum: 'PENDING', guncellendi: '' } } })
  })

  it('ortam yoksa: hazır değil, gönderim Yakında hatası', async () => {
    const g = whatsappGondericisi({ sb: () => sb, env: {} as NodeJS.ProcessEnv, fetch: async () => { throw new Error('çağrılmamalı') } })
    assert.equal(g.kanal, 'whatsapp')
    assert.equal(await g.hazirMi(DOKTOR_A), false)
    const r = await g.gonder({ doktorId: DOKTOR_A, alici: '05551112233', metin: 'x', sablonKodu: 'randevu_hatirlatma', degiskenler: ['a', 'b', 'c', 'd'] })
    assert.equal(r.ok, false)
  })

  it('şablon onay bekliyorsa önce Meta\'dan tazeler; onaylıysa gönderir; başka doktor gönderemez', async () => {
    const { f, cagrilar } = sahteFetch((c) => {
      if (c.method === 'GET') return { json: { data: [{ id: '1', name: 'randevu_hatirlatma', status: 'APPROVED', language: 'tr' }] } }
      return { json: { messages: [{ id: 'wamid.QA2' }] } }
    })
    const g = whatsappGondericisi({ sb: () => sb, env: ENV, fetch: f })
    assert.equal(await g.hazirMi(DOKTOR_A), false)
    const r = await g.gonder({ doktorId: DOKTOR_A, alici: '05551112233', metin: '', sablonKodu: 'randevu_hatirlatma', degiskenler: ['QA', 'a', 'b', 'c'] })
    assert.deepEqual(r, { ok: true, disId: 'wamid.QA2' })
    assert.equal(await g.hazirMi(DOKTOR_A), true)
    assert.equal(cagrilar.filter((c) => c.method === 'POST').length, 1)
    const b = await g.gonder({ doktorId: DOKTOR_B, alici: '05551112233', metin: '', sablonKodu: 'randevu_hatirlatma', degiskenler: ['QA', 'a', 'b', 'c'] })
    assert.equal(b.ok, false)
    const serbest = await g.gonder({ doktorId: DOKTOR_A, alici: '05551112233', metin: 'serbest metin' })
    assert.equal(serbest.ok, false)
  })

  it('webhook: teslim durumu doktora yazılır, bilinmeyen numara atlanır, şablon onayı işlenir, kopma işaretlenir', async () => {
    await webhookOlaylariniIsle(sb, {
      teslim: [
        { phoneNumberId: 'PN1', mesajId: 'wamid.1', durum: 'delivered', zaman: null, hataKodu: null },
        { phoneNumberId: 'PN-YABANCI', mesajId: 'wamid.2', durum: 'read', zaman: null, hataKodu: null },
      ],
      sablon: [{ wabaId: 'WABA1', sablonAdi: 'randevu_hatirlatma', sablonId: '1', durum: 'APPROVED' }, { wabaId: 'WABA1', sablonAdi: 'baska', sablonId: '2', durum: 'APPROVED' }],
      kaldirilanWabalar: [],
    })
    assert.deepEqual(db.tablo(TESLIM_TABLOSU).map((r) => [r.doctor_id, r.mesaj_id, r.durum]), [[DOKTOR_A, 'wamid.1', 'delivered']])
    assert.equal(db.tablo(TABLO)[0].sablon_durumlari.randevu_hatirlatma.durum, 'APPROVED')
    assert.equal(db.tablo(TABLO)[0].sablon_durumlari.baska, undefined)
    await webhookOlaylariniIsle(sb, { teslim: [], sablon: [], kaldirilanWabalar: ['WABA1'] })
    assert.equal(await baglantiOku(sb, DOKTOR_A), null)
  })
})

describe('WhatsAppBaglan arayüzü', () => {
  const ciz = (g: any, hata?: string) => renderToStaticMarkup(createElement(WhatsAppBaglanKarti, { g, hata }))

  it('bağlı değil: başlık, tek birincil düğme, sessiz satır; teknik jargon yok', () => {
    const h = ciz({ tur: 'bagli-degil', kurulum: { appId: '1', configId: '2', graphSurum: 'v25.0' } })
    assert.match(h, /WhatsApp mesajları kendiliğinden gitsin/)
    assert.match(h, /WhatsApp’ı bağla/)
    assert.match(h, /WhatsApp Business uygulaması gerekir — ücretsizdir, numaranız ve sohbetleriniz aynen kalır\./)
    assert.equal((h.match(/<button/g) || []).length, 1)
    assert.match(h, /min-height:44px/)
  })

  it('bağlı: numara + onay işareti, şablon durumu sade, Bağlantıyı kaldır', () => {
    const h = ciz({ tur: 'bagli', numara: '+90 555 000 00 00', sablon: 'bekliyor' })
    assert.match(h, /✓/); assert.match(h, /\+90 555 000 00 00/); assert.match(h, /Onay bekliyor/); assert.match(h, /Bağlantıyı kaldır/)
    assert.match(ciz({ tur: 'bagli', numara: null, sablon: 'hazir' }), /Hazır/)
  })

  it('yakında / yükleniyor', () => {
    assert.match(ciz({ tur: 'yakinda' }), /yakında/)
    assert.equal(ciz({ tur: 'yukleniyor' }), '')
  })

  it('hiçbir durumda jargon yok', () => {
    for (const g of [{ tur: 'yakinda' }, { tur: 'bagli-degil', kurulum: { appId: '1', configId: '2', graphSurum: 'v' } }, { tur: 'bagli', numara: '1', sablon: 'sorun' }]) {
      const h = ciz(g, 'WhatsApp bağlantısı tamamlanamadı.').replace(/<[^>]+>/g, ' ')
      assert.ok(!/OAuth|API|token|webhook|Meta|WABA/i.test(h), h)
    }
  })

  it('oturum bilgisi yalnız facebook.com kökeninden ve WA_EMBEDDED_SIGNUP türünden kabul edilir', () => {
    const v = JSON.stringify({ type: 'WA_EMBEDDED_SIGNUP', event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING', data: { waba_id: '1', phone_number_id: '2', business_id: '3' } })
    assert.deepEqual(oturumBilgisiCoz('https://www.facebook.com', v), { tur: 'bitti', wabaId: '1', phoneNumberId: '2', businessId: '3' })
    assert.equal(oturumBilgisiCoz('https://evil-facebook.com', v), null)
    assert.equal(oturumBilgisiCoz('https://facebook.com.evil.test', v), null)
    assert.equal(oturumBilgisiCoz('https://www.facebook.com', JSON.stringify({ type: 'BASKA' })), null)
    assert.equal(oturumBilgisiCoz('http://www.facebook.com', v), null)
    assert.deepEqual(oturumBilgisiCoz('https://web.facebook.com', { type: 'WA_EMBEDDED_SIGNUP', event: 'CANCEL', data: { current_step: 'x' } }), { tur: 'iptal' })
    assert.deepEqual(oturumBilgisiCoz('https://www.facebook.com', { type: 'WA_EMBEDDED_SIGNUP', event: 'CANCEL', data: { error_code: 1, error_message: 'x' } }), { tur: 'hata' })
    // Meta'nın coexistence örneği: yalnız waba_id
    assert.deepEqual(
      oturumBilgisiCoz('https://www.facebook.com', JSON.stringify({ data: { waba_id: '77' }, type: 'WA_EMBEDDED_SIGNUP', event: 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING', version: 3 })),
      { tur: 'bitti', wabaId: '77', phoneNumberId: null, businessId: null }
    )
  })
})
