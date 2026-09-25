/**
 * NOTYA-BETA-0925 (Dr. Gökhan) — randevu penceresinde "Cep telefonu": Türk cep (05xx…, +90 5xx…) ve yurt dışı (+1…)
 * numaraları kabul, düz Türkçe hata; kayıtlı hastanın telefonu ve WhatsApp izni hasta kaydına yazılır — doktor da
 * sekreter de; başka doktorun hastasına asla. Gerçek rotalar sahte Supabase'e karşı. Yalnız sentetik QA verisi.
 */
import { describe, it, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { cepTelefonuDogrula, telefonAlani, TELEFON_MESAJ } from './cepTelefonu'
import { whatsappNumarasi } from './baglantilar'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-telefon-anahtari'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://sahte.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sahte-servis-anahtari'

let db = new SahteVeritabani()
/** migration 100 henüz uygulanmamış gibi: kaynak 'randevu' geçmiş satırı kısıttan döner. */
let kisit100Yok = false
function sahteCreateClient(_url?: string, _key?: string, opts?: { global?: { headers?: Record<string, string> } }) {
  const c = () => db.istemci(opts)
  return {
    from: (t: string) => {
      const q = c().from(t)
      if (t !== 'iletisim_izin_kayitlari' || !kisit100Yok) return q
      return new Proxy(q, {
        get: (h, k) => (k === 'insert'
          ? (satir: Record<string, unknown>) => (satir.kaynak === 'randevu'
            ? Promise.resolve({ data: null, error: { code: '23514', message: 'violates check constraint' } })
            : h.insert(satir))
          : h[k]),
      })
    },
    auth: { getUser: (j?: string) => c().auth.getUser(j) },
    storage: { from: (k: string) => c().storage.from(k) },
    rpc: (ad: string, a: Record<string, string>) => c().rpc(ad, a),
  }
}
{
  const pkgYolu = require.resolve('@supabase/supabase-js/package.json')
  const pkg = JSON.parse(readFileSync(pkgYolu, 'utf8')) as Record<string, any>
  const kok = dirname(pkgYolu)
  const girdiler = [pkg.exports?.['.']?.require?.default, pkg.exports?.['.']?.import?.default, pkg.main, pkg.module]
  for (const g of new Set(girdiler.filter(Boolean).map((x: string) => pathToFileURL(join(kok, x)).href))) {
    mock.module(g, { namedExports: { createClient: sahteCreateClient } })
  }
}
globalThis.fetch = (async (g: unknown) => { throw new Error(`telefon testi ağ erişimi yapamaz: ${String(g)}`) }) as typeof fetch

describe('cepTelefonuDogrula', () => {
  it('Türk cep numarası her yaygın yazımıyla kabul, tek biçimde saklanır', () => {
    for (const ham of ['05321234567', '0532 123 45 67', '532 123 45 67', '+90 532 123 45 67', '+905321234567', '0090 532 123 4567', '(0532) 123-45-67']) {
      assert.deepEqual(cepTelefonuDogrula(ham), { ok: true, deger: '0532 123 45 67' }, ham)
    }
  })
  it('yurt dışı numarası + ile kabul (ABD, Almanya)', () => {
    assert.deepEqual(cepTelefonuDogrula('+1 202 555 0143'), { ok: true, deger: '+12025550143' })
    assert.deepEqual(cepTelefonuDogrula('+49 151 23456789'), { ok: true, deger: '+4915123456789' })
    assert.deepEqual(cepTelefonuDogrula('0049 151 23456789'), { ok: true, deger: '+4915123456789' })
  })
  it('kaydedilen her numara WhatsApp bağlantısına dönüşür', () => {
    for (const ham of ['0532 123 45 67', '+1 202 555 0143', '+49 151 23456789']) {
      const s = cepTelefonuDogrula(ham)
      assert.ok(s.ok && whatsappNumarasi(s.deger), ham)
    }
  })
  it('boş, sabit hat, kısa, harfli, bozuk + numarası: düz Türkçe hata', () => {
    assert.deepEqual(cepTelefonuDogrula(''), { ok: false, hata: TELEFON_MESAJ.bos })
    assert.deepEqual(cepTelefonuDogrula('0212 123 45 67'), { ok: false, hata: TELEFON_MESAJ.sabitHat })
    assert.deepEqual(cepTelefonuDogrula('+90 212 123 45 67'), { ok: false, hata: TELEFON_MESAJ.sabitHat })
    for (const ham of ['0532 123', 'beş üç iki', '05321234567890', '+0 555', '532+1234567', '+1 555']) {
      assert.deepEqual(cepTelefonuDogrula(ham), { ok: false, hata: TELEFON_MESAJ.gecersiz }, ham)
    }
    for (const m of Object.values(TELEFON_MESAJ)) assert.ok(!/please|invalid|phone number/i.test(m))
  })
  it('telefonAlani: boş alan serbest, dolu alan doğrulanır', () => {
    assert.deepEqual(telefonAlani(undefined), { deger: null })
    assert.deepEqual(telefonAlani('   '), { deger: null })
    assert.deepEqual(telefonAlani('0532 123 45 67'), { deger: '0532 123 45 67' })
    assert.deepEqual(telefonAlani('12'), { hata: TELEFON_MESAJ.gecersiz })
  })
})

let encrypt: (s: string) => string
let decrypt: (s: string) => string
let NextRequestSinifi: typeof import('next/server').NextRequest
let R: Record<string, any>

type Sahne = {
  doktor: { id: string; token: string }; sekreter: { id: string; token: string; personelId: string }
  diger: { id: string; token: string }; telefonsuz: string; telefonlu: string; yabanci: string
}
function sahne(): Sahne {
  db = new SahteVeritabani()
  kisit100Yok = false
  const kullanici = () => { const id = randomUUID(); const token = `qa-${id}`; db.kullanicilar.set(token, { id }); return { id, token } }
  const doktor = kullanici(), s = kullanici(), diger = kullanici()
  db.ekle('users', { id: doktor.id, full_name: 'QA Hekim', specialty: 'pediatri' })
  db.ekle('users', { id: diger.id, full_name: 'QA Hekim 2', specialty: 'pediatri' })
  const personelId = db.ekle('personel', { doktor_id: doktor.id, user_id: s.id, ad_soyad: 'QA Sekreter', rol: 'sekreter', aktif: true }).id
  const hasta = (doktorId: string, tel: string | null) => db.ekle('patients', {
    doctor_id: doktorId, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'QA Hasta' })),
    phone_encrypted: tel ? encrypt(tel) : null, iletisim_izni_whatsapp: null,
  }).id
  return { doktor, sekreter: { ...s, personelId }, diger, telefonsuz: hasta(doktor.id, null), telefonlu: hasta(doktor.id, '0533 000 11 22'), yabanci: hasta(diger.id, '0544 999 88 77') }
}
const yarin = (saat: number) => new Date(Date.now() + 86400e3 + saat * 3600e3).toISOString()
function iste(yontem: string, yol: string, token: string, govde?: unknown) {
  return new NextRequestSinifi(`http://localhost${yol}`, {
    method: yontem, headers: { authorization: `Bearer ${token}`, ...(govde ? { 'content-type': 'application/json' } : {}) }, body: govde ? JSON.stringify(govde) : undefined,
  } as ConstructorParameters<typeof NextRequestSinifi>[1])
}
async function coz(r: Response | Promise<Response>) { const y = await r; const metin = await y.text(); return { status: y.status, json: JSON.parse(metin), metin } }
const hastaSatiri = (id: string) => db.tablo('patients').find((p) => p.id === id)!

before(async () => {
  ;({ encrypt, decrypt } = await import('../security/encryption'))
  NextRequestSinifi = (await import('next/server')).NextRequest
  R = {
    randevular: await import('../../app/api/doktor/randevular/route'),
    randevu: await import('../../app/api/doktor/randevular/[id]/route'),
    izin: await import('../../app/api/doktor/iletisim/izin/route'),
  }
})

describe('randevu penceresi: telefon + WhatsApp izni hasta kaydına (sunucu)', () => {
  let s: Sahne
  beforeEach(() => { s = sahne() })

  it('sekreter: yeni randevu + cep telefonu + izin → telefon şifreli hasta kaydında, izin true, geçmiş "randevu" kaynağıyla', async () => {
    const y = await coz(R.randevular.POST(iste('POST', '/api/doktor/randevular', s.sekreter.token, {
      patientId: s.telefonsuz, baslangic: yarin(1), bitis: yarin(1.5), hastaTelefon: '+90 532 123 45 67', whatsappIzni: true,
    })))
    assert.equal(y.status, 200, y.metin)
    const p = hastaSatiri(s.telefonsuz)
    assert.equal(decrypt(p.phone_encrypted), '0532 123 45 67')
    assert.equal(p.iletisim_izni_whatsapp, true)
    const g = db.tablo('iletisim_izin_kayitlari').at(-1)!
    assert.equal(g.kaynak, 'randevu')
    assert.equal(g.kanal, 'whatsapp')
    assert.equal(g.kaydeden_personel_id, s.sekreter.personelId)
    assert.equal(g.kaydeden_user_id, s.sekreter.id)
  })

  it('geçersiz telefon: 400, düz Türkçe hata, randevu açılmaz', async () => {
    const y = await coz(R.randevular.POST(iste('POST', '/api/doktor/randevular', s.doktor.token, {
      patientId: s.telefonsuz, baslangic: yarin(2), bitis: yarin(2.5), hastaTelefon: '0212 555 44 33',
    })))
    assert.equal(y.status, 400)
    assert.equal(y.json.error, TELEFON_MESAJ.sabitHat)
    assert.equal(db.tablo('randevular').length, 0)
    assert.equal(hastaSatiri(s.telefonsuz).phone_encrypted, null)
  })

  it('kayıtsız randevunun telefonu da doğrulanır ve tek biçimde saklanır', async () => {
    const y = await coz(R.randevular.POST(iste('POST', '/api/doktor/randevular', s.doktor.token, {
      hastaAdiSerbest: 'QA Serbest', hastaTelefonSerbest: '5321234567', baslangic: yarin(3), bitis: yarin(3.5),
    })))
    assert.equal(y.status, 200, y.metin)
    assert.equal(db.tablo('randevular').at(-1)!.hasta_telefon_serbest, '0532 123 45 67')
  })

  it('düzenleme (PATCH): yalnız telefon değişse de hasta kaydı güncellenir; migration 100 yokken geçmiş "gonder_dugmesi" ile yine yazılır', async () => {
    const rv = db.ekle('randevular', { doktor_id: s.doktor.id, patient_id: s.telefonlu, baslangic: yarin(4), bitis: yarin(4.5), durum: 'planlandi', tur: 'muayene' }).id
    kisit100Yok = true
    const y = await coz(R.randevu.PATCH(iste('PATCH', `/api/doktor/randevular/${rv}`, s.sekreter.token, { hastaTelefon: '+1 202 555 0143', whatsappIzni: true }), { params: { id: rv } }))
    assert.equal(y.status, 200, y.metin)
    assert.equal(decrypt(hastaSatiri(s.telefonlu).phone_encrypted), '+12025550143')
    assert.equal(db.tablo('iletisim_izin_kayitlari').at(-1)!.kaynak, 'gonder_dugmesi')
  })

  it('izin GET: sekreter hastanın telefonunu (pencereyi doldurmak için) okur; başka doktorun hastası 404', async () => {
    const y = await coz(R.izin.GET(iste('GET', `/api/doktor/iletisim/izin?patientId=${s.telefonlu}`, s.sekreter.token)))
    assert.equal(y.status, 200, y.metin)
    assert.equal(y.json.telefon, '0533 000 11 22')
    const z = await coz(R.izin.GET(iste('GET', `/api/doktor/iletisim/izin?patientId=${s.yabanci}`, s.sekreter.token)))
    assert.equal(z.status, 404)
    assert.ok(!z.metin.includes('0544'))
  })

  it('başka doktorun hastası: randevu 404, telefonu ve izni değişmez', async () => {
    const y = await coz(R.randevular.POST(iste('POST', '/api/doktor/randevular', s.doktor.token, {
      patientId: s.yabanci, baslangic: yarin(5), bitis: yarin(5.5), hastaTelefon: '0532 123 45 67', whatsappIzni: true,
    })))
    assert.equal(y.status, 404)
    assert.equal(decrypt(hastaSatiri(s.yabanci).phone_encrypted), '0544 999 88 77')
    assert.equal(hastaSatiri(s.yabanci).iletisim_izni_whatsapp, null)
    assert.equal(db.tablo('iletisim_izin_kayitlari').length, 0)
  })

  it('pencere: telefon yoksa zorunlu, izin kutusu, kayıt sonrası bilgi formu sorusu (kaynak kilidi)', () => {
    const sayfa = readFileSync(join(__dirname, '../../app/dashboard/doktor/randevular/page.tsx'), 'utf8')
    assert.ok(sayfa.includes('Hastanın kayıtlı cep telefonu yok. Lütfen cep telefonunu yazın.'))
    assert.ok(sayfa.includes('Hasta, randevu ve form mesajlarını WhatsApp&apos;tan almayı kabul etti'))
    assert.ok(sayfa.includes('Hasta Bilgi Formu’nu WhatsApp’tan gönderelim mi?'))
    assert.ok(/<GonderDugmesi[\s\S]*?tur="bilgi_formu"/.test(sayfa))
  })
})
