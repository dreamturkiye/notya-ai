/**
 * NOTYA-ONBOARDING-01 (Kaan, 2026-10-09) — onboarding'in saf kuralları: cep telefonu, unvan / cinsiyet / hitap
 * eşlemesi, ad doğrulaması, KVKK kararı, gövde doğrulaması, "kolon yok" hatasının tanınması.
 * Yalnız sentetik veri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { doktorCepTelefonu, DOKTOR_CEP_DESENI, DOKTOR_CEP_MESAJ } from './cepTelefonu'
import {
  AD_MESAJ, PROFIL_MESAJ, UNVAN_ESLEME, adDogrula, cepTelefonuKolonuYokMu, cinsiyetEsle, hitapEsle,
  profilGovdesiDogrula, unvanEsle,
} from './profilDogrula'
import { KVKK_METIN_VERSIYONU, KVKK_ONAY_HATASI, KVKK_ONAY_KODU, kvkkKarari, kvkkKayitliMi, kvkkMetaDamgasi, kvkkSatirDamgasi } from './kvkkOnay'

const KOK = resolve(__dirname, '../..')
const oku = (yol: string) => readFileSync(join(KOK, yol), 'utf8')

describe('doktorCepTelefonu — Türk cep numarası, tek kayıt biçimi +905XXXXXXXXX', () => {
  it('hekimin yazabileceği her yaygın biçim aynı değere iner', () => {
    for (const ham of [
      '05321234567', '0532 123 45 67', '532 123 45 67', '5321234567', '+90 532 123 45 67', '+905321234567',
      '0090 532 123 45 67', '(0532) 123-45-67', '0532-123-45-67', '0532.123.45.67', '+90 (532) 123 45 67',
      '90 532 123 45 67', '  0532 123 45 67  ',
    ]) {
      assert.deepEqual(doktorCepTelefonu(ham), { ok: true, deger: '+905321234567' }, ham)
    }
  })
  it('kaydedilen değer migration 150 kısıtındaki desene uyar', () => {
    for (const ham of ['0505 000 00 01', '0555 999 88 77', '+90 544 111 22 33']) {
      const s = doktorCepTelefonu(ham)
      assert.ok(s.ok && DOKTOR_CEP_DESENI.test(s.deger), ham)
    }
    const sql = oku('lib/db/migrations/150_users_cep_telefonu.sql')
    assert.ok(sql.includes(`'${DOKTOR_CEP_DESENI.source.replace('\\d', '[0-9]')}'`), 'SQL CHECK deseni ile kod deseni aynı olmalı')
  })
  it('boş, sabit hat, yurt dışı, kısa, uzun, harfli: düz Türkçe hata', () => {
    assert.deepEqual(doktorCepTelefonu(''), { ok: false, hata: DOKTOR_CEP_MESAJ.bos })
    assert.deepEqual(doktorCepTelefonu('   '), { ok: false, hata: DOKTOR_CEP_MESAJ.bos })
    assert.deepEqual(doktorCepTelefonu(undefined), { ok: false, hata: DOKTOR_CEP_MESAJ.bos })
    assert.deepEqual(doktorCepTelefonu('0212 123 45 67'), { ok: false, hata: DOKTOR_CEP_MESAJ.sabitHat })
    assert.deepEqual(doktorCepTelefonu('+90 312 123 45 67'), { ok: false, hata: DOKTOR_CEP_MESAJ.sabitHat })
    assert.deepEqual(doktorCepTelefonu('+1 202 555 0143'), { ok: false, hata: DOKTOR_CEP_MESAJ.yurtDisi })
    assert.deepEqual(doktorCepTelefonu('+49 151 23456789'), { ok: false, hata: DOKTOR_CEP_MESAJ.yurtDisi })
    for (const ham of ['0532 123', '053212345678', '0632 123 45 67', 'beş üç iki', '0532 123 45 6x', '532+1234567', '+90 532 123 45', '90 632 123 45 67']) {
      assert.deepEqual(doktorCepTelefonu(ham), { ok: false, hata: DOKTOR_CEP_MESAJ.gecersiz }, ham)
    }
    for (const ham of [5321234567, {}, [], true]) assert.equal(doktorCepTelefonu(ham).ok, false)
    for (const m of Object.values(DOKTOR_CEP_MESAJ)) assert.ok(!/please|invalid|phone number/i.test(m))
  })
})

describe('unvan eşlemesi — ekrandaki seçenek → users.title CHECK yazımı', () => {
  it('dört seçeneğin dördü de kısıtın yazımına çevrilir', () => {
    assert.equal(unvanEsle('Dr.'), 'Dr.')
    assert.equal(unvanEsle('Uzm.Dr.'), 'Uzm. Dr.')
    assert.equal(unvanEsle('Doç.Dr.'), 'Doç. Dr.')
    assert.equal(unvanEsle('Prof.Dr.'), 'Prof. Dr.')
  })
  it('eşleme tablosu ekrandaki seçeneklerle ve canlı kısıtın dört değeriyle birebir örtüşür', () => {
    const sayfa = oku('app/onboarding/page.tsx')
    const m = sayfa.match(/const unvanOptions = \[([^\]]+)\]/)
    assert.ok(m, 'unvanOptions bulunamadı')
    const secenekler = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    assert.deepEqual(Object.keys(UNVAN_ESLEME).sort(), [...secenekler].sort())
    assert.deepEqual(Object.values(UNVAN_ESLEME).sort(), ['Doç. Dr.', 'Dr.', 'Prof. Dr.', 'Uzm. Dr.'])
    for (const s of secenekler) assert.ok(unvanEsle(s), s)
  })
  it('kısıtın kendi yazımı da kabul edilir; tabloda olmayan her şey reddedilir', () => {
    for (const k of ['Dr.', 'Uzm. Dr.', 'Doç. Dr.', 'Prof. Dr.']) assert.equal(unvanEsle(k), k)
    for (const k of ['', 'Op.Dr.', 'Dr', 'Prof', 'dr.', 'Uzm.Dr', null, undefined, 3]) assert.equal(unvanEsle(k), null, String(k))
  })
  it('cinsiyet ve hitap: ekran değeri → kısıt değeri', () => {
    assert.equal(cinsiyetEsle('Erkek'), 'male')
    assert.equal(cinsiyetEsle('Kadın'), 'female')
    assert.equal(cinsiyetEsle('male'), 'male')
    assert.equal(cinsiyetEsle('Diğer'), null)
    assert.equal(hitapEsle('Hocam'), 'hocam')
    assert.equal(hitapEsle('[isim] Hocam'), 'named_hocam')
    assert.equal(hitapEsle('First name only'), 'first_name_only')
    assert.equal(hitapEsle('named_hocam'), 'named_hocam')
    assert.equal(hitapEsle('Sayın'), null)
  })
  it('ekrandaki cinsiyet ve hitap seçeneklerinin hepsi eşlenir', () => {
    const adim = oku('components/onboarding/KisiselBilgilerAdimi.tsx')
    const degerler = [...adim.matchAll(/<option value="([^"]+)">/g)].map((x) => x[1])
    assert.deepEqual(degerler, ['Erkek', 'Kadın', 'Hocam', '[isim] Hocam', 'First name only'])
    for (const d of degerler.slice(0, 2)) assert.ok(cinsiyetEsle(d), d)
    for (const d of degerler.slice(2)) assert.ok(hitapEsle(d), d)
  })
})

describe('adDogrula — boşluk atılır, en az iki harf', () => {
  it('geçerli adlar: Türkçe harf, iki ad, tire, kesme; boşluklar toparlanır', () => {
    assert.deepEqual(adDogrula('  Işıl  ', 'ad'), { ok: true, deger: 'Işıl' })
    assert.deepEqual(adDogrula('Ayşe   Nur', 'ad'), { ok: true, deger: 'Ayşe Nur' })
    assert.deepEqual(adDogrula('Öztürk-Çağlar', 'soyad'), { ok: true, deger: 'Öztürk-Çağlar' })
    assert.deepEqual(adDogrula("O'Neil", 'soyad'), { ok: true, deger: "O'Neil" })
    assert.deepEqual(adDogrula('M. Kemal', 'ad'), { ok: true, deger: 'M. Kemal' })
    assert.deepEqual(adDogrula('Su', 'ad'), { ok: true, deger: 'Su' })
  })
  it('boş, tek harf, rakam / işaret, çok uzun, alana yazılmış unvan: alanın kendi Türkçe iletisi', () => {
    assert.deepEqual(adDogrula('', 'ad'), { ok: false, hata: AD_MESAJ.ad.bos })
    assert.deepEqual(adDogrula('   ', 'soyad'), { ok: false, hata: AD_MESAJ.soyad.bos })
    assert.deepEqual(adDogrula(undefined, 'ad'), { ok: false, hata: AD_MESAJ.ad.bos })
    assert.deepEqual(adDogrula('A', 'ad'), { ok: false, hata: AD_MESAJ.ad.kisa })
    assert.deepEqual(adDogrula('A.', 'soyad'), { ok: false, hata: AD_MESAJ.soyad.kisa })
    for (const ham of ['Ay5e', 'Ayşe@', '12', '-Ayşe', 'Ayşe<script>']) assert.deepEqual(adDogrula(ham, 'ad'), { ok: false, hata: AD_MESAJ.ad.karakter }, ham)
    assert.deepEqual(adDogrula('a'.repeat(61), 'soyad'), { ok: false, hata: AD_MESAJ.soyad.uzun })
    for (const ham of ['Dr. Ayşe', 'Dr Ayşe', 'Prof. Dr. Ayşe', 'Uzm.', 'doç. ayşe']) assert.deepEqual(adDogrula(ham, 'ad'), { ok: false, hata: AD_MESAJ.ad.unvan }, ham)
    assert.equal(adDogrula(42, 'ad').ok, false)
    // "Dr" ile başlayan gerçek adlar unvan sayılmaz.
    assert.deepEqual(adDogrula('Uzman', 'soyad'), { ok: true, deger: 'Uzman' })
    assert.deepEqual(adDogrula('Doruk', 'ad'), { ok: true, deger: 'Doruk' })
  })
})

describe('KVKK kararı — sunucu karar verir; işaretlenmeyen rıza damgalanmaz', () => {
  it('kayıtlı rıza: users.kvkk_consent_at dolu YA DA metadata kvkk_onay === true', () => {
    assert.equal(kvkkKayitliMi('2026-09-01T10:00:00Z', {}), true)
    assert.equal(kvkkKayitliMi(null, { kvkk_onay: true }), true)
    assert.equal(kvkkKayitliMi(null, {}), false)
    assert.equal(kvkkKayitliMi(undefined, null), false)
    assert.equal(kvkkKayitliMi('', { kvkk_onay: 'true' }), false, 'yalnız boolean true sayılır')
    assert.equal(kvkkKayitliMi(null, { kvkk_onay: false, kvkk_onay_tarihi: '2026-09-01' }), false)
  })
  it('gerekli → işaretlendi → damgala', () => {
    assert.deepEqual(kvkkKarari({ kayitli: false, ilkKayit: true, isaretlendi: true }), { gerekli: true, damgala: true, reddet: false })
  })
  it('gerekli → işaretlenmedi → reddet (ilk kayıt)', () => {
    for (const isaretlendi of [false, undefined, null, 'true', 1, 'on']) {
      assert.deepEqual(kvkkKarari({ kayitli: false, ilkKayit: true, isaretlendi }), { gerekli: true, damgala: false, reddet: true }, String(isaretlendi))
    }
  })
  it('zaten kayıtlı → sorulmaz, gövdede true gelse bile YENİDEN damgalanmaz', () => {
    for (const isaretlendi of [true, false, undefined]) {
      assert.deepEqual(kvkkKarari({ kayitli: true, ilkKayit: true, isaretlendi }), { gerekli: false, damgala: false, reddet: false })
      assert.deepEqual(kvkkKarari({ kayitli: true, ilkKayit: false, isaretlendi }), { gerekli: false, damgala: false, reddet: false })
    }
  })
  it('onboarding\'i bitmiş hesap (önceki davranış): rızası yoksa reddedilmez ve damgalanmaz', () => {
    assert.deepEqual(kvkkKarari({ kayitli: false, ilkKayit: false, isaretlendi: undefined }), { gerekli: true, damgala: false, reddet: false })
  })
  it('damga: /kayit ile aynı metadata anahtarları ve aynı sürüm dizesi; satırda aynı an ve aynı sürüm', () => {
    const an = '2026-10-09T08:00:00.000Z'
    assert.deepEqual(kvkkMetaDamgasi(an), { kvkk_onay: true, kvkk_onay_tarihi: an, kvkk_metin_versiyonu: '2026-08-25-v2' })
    assert.deepEqual(kvkkSatirDamgasi(an), { kvkk_consent_at: an, kvkk_consent_version: '2026-08-25-v2' })
    const kayit = oku('app/kayit/page.tsx')
    assert.ok(kayit.includes(`kvkk_metin_versiyonu: '${KVKK_METIN_VERSIYONU}'`), 'sürüm dizesi /kayit ile aynı olmalı')
    assert.ok(kayit.includes('kvkk_onay: true') && kayit.includes('kvkk_onay_tarihi:'))
    assert.ok(kayit.includes(KVKK_ONAY_HATASI.replace("'", "\\'")), 'hata cümlesi /kayit ile aynı olmalı')
  })
})

describe('profilGovdesiDogrula — sunucu tarafı doğrulama', () => {
  const tam = {
    profession_type: 'doktor', specialty: 'Kardiyoloji', title: 'Uzm.Dr.', hospital: '  QA   Kliniği ',
    firstName: ' Işıl ', lastName: 'Öztürk', cepTelefonu: '0532 123 45 67', gender: 'Kadın', addressingPreference: '[isim] Hocam',
  }
  const ilk = { ilkKayit: true, kvkkKayitli: true }

  it('tam ve geçerli gövde: users satırının yazımına çevrilmiş değerler', () => {
    assert.deepEqual(profilGovdesiDogrula(tam, ilk), {
      ok: true,
      deger: {
        kvkkDamgala: false, title: 'Uzm. Dr.', hospital: 'QA Kliniği', firstName: 'Işıl', lastName: 'Öztürk',
        cepTelefonu: '+905321234567', gender: 'female', addressingPreference: 'named_hocam',
      },
    })
  })
  it('ilk kayıtta her alan zorunlu — eksik alan kendi Türkçe iletisiyle reddedilir', () => {
    const eksik = (alan: string) => { const g: Record<string, unknown> = { ...tam }; delete g[alan]; return profilGovdesiDogrula(g, ilk) }
    assert.deepEqual(eksik('profession_type'), { ok: false, hata: PROFIL_MESAJ.meslek, alan: 'profession_type' })
    assert.deepEqual(eksik('specialty'), { ok: false, hata: PROFIL_MESAJ.uzmanlik, alan: 'specialty' })
    assert.deepEqual(eksik('title'), { ok: false, hata: PROFIL_MESAJ.unvan, alan: 'title' })
    assert.deepEqual(eksik('firstName'), { ok: false, hata: AD_MESAJ.ad.bos, alan: 'firstName' })
    assert.deepEqual(eksik('lastName'), { ok: false, hata: AD_MESAJ.soyad.bos, alan: 'lastName' })
    assert.deepEqual(eksik('cepTelefonu'), { ok: false, hata: DOKTOR_CEP_MESAJ.bos, alan: 'cepTelefonu' })
    assert.deepEqual(eksik('gender'), { ok: false, hata: PROFIL_MESAJ.cinsiyet, alan: 'gender' })
    assert.deepEqual(eksik('addressingPreference'), { ok: false, hata: PROFIL_MESAJ.hitap, alan: 'addressingPreference' })
    assert.equal(eksik('hospital').ok, true, 'klinik / hastane adı isteğe bağlı')
  })
  it('geçersiz değerler reddedilir (tarayıcı denetimi atlanmış gibi)', () => {
    const ile = (ek: Record<string, unknown>) => profilGovdesiDogrula({ ...tam, ...ek }, ilk)
    assert.deepEqual(ile({ title: 'Op.Dr.' }), { ok: false, hata: PROFIL_MESAJ.unvanGecersiz, alan: 'title' })
    assert.deepEqual(ile({ gender: 'x' }), { ok: false, hata: PROFIL_MESAJ.cinsiyet, alan: 'gender' })
    assert.deepEqual(ile({ addressingPreference: 'Sayın' }), { ok: false, hata: PROFIL_MESAJ.hitap, alan: 'addressingPreference' })
    assert.deepEqual(ile({ cepTelefonu: '0212 123 45 67' }), { ok: false, hata: DOKTOR_CEP_MESAJ.sabitHat, alan: 'cepTelefonu' })
    assert.deepEqual(ile({ firstName: 'A' }), { ok: false, hata: AD_MESAJ.ad.kisa, alan: 'firstName' })
    assert.deepEqual(ile({ lastName: '12' }), { ok: false, hata: AD_MESAJ.soyad.karakter, alan: 'lastName' })
    assert.deepEqual(ile({ profession_type: 'yonetici' }), { ok: false, hata: PROFIL_MESAJ.meslek, alan: 'profession_type' })
    assert.deepEqual(ile({ specialty: 'x'.repeat(201) }), { ok: false, hata: PROFIL_MESAJ.uzmanlikGecersiz, alan: 'specialty' })
    assert.deepEqual(ile({ specialty: { a: 1 } }), { ok: false, hata: PROFIL_MESAJ.uzmanlikGecersiz, alan: 'specialty' })
    assert.deepEqual(ile({ hospital: 'k'.repeat(161) }), { ok: false, hata: PROFIL_MESAJ.kurum, alan: 'hospital' })
    for (const g of [null, undefined, 'metin', 3, []]) assert.deepEqual(profilGovdesiDogrula(g, ilk), { ok: false, hata: PROFIL_MESAJ.govde, alan: 'govde' })
  })
  it('hekim dışı meslekler: unvan istenmez; diğer alanlar aynı', () => {
    for (const profession_type of ['klinik-uzman', 'saglik-uzmani', 'mali', 'avukat', 'psikolog']) {
      const s = profilGovdesiDogrula({ ...tam, profession_type, title: '', hospital: '' }, ilk)
      assert.ok(s.ok, profession_type)
      assert.equal(s.ok && s.deger.title, undefined)
      assert.equal(s.ok && s.deger.cepTelefonu, '+905321234567')
    }
  })
  it('KVKK: kayıt yokken işaretsiz → kodlu ret; işaretli → damgala; kayıtlıyken true gelse de damgalanmaz', () => {
    const yok = { ilkKayit: true, kvkkKayitli: false }
    assert.deepEqual(profilGovdesiDogrula(tam, yok), { ok: false, hata: KVKK_ONAY_HATASI, alan: 'kvkk_onay', kod: KVKK_ONAY_KODU })
    assert.deepEqual(profilGovdesiDogrula({ ...tam, kvkk_onay: 'true' }, yok), { ok: false, hata: KVKK_ONAY_HATASI, alan: 'kvkk_onay', kod: KVKK_ONAY_KODU })
    const isaretli = profilGovdesiDogrula({ ...tam, kvkk_onay: true }, yok)
    assert.equal(isaretli.ok && isaretli.deger.kvkkDamgala, true)
    const kayitli = profilGovdesiDogrula({ ...tam, kvkk_onay: true }, ilk)
    assert.equal(kayitli.ok && kayitli.deger.kvkkDamgala, false)
    // Başka bir alan da hatalıysa önce o söylenir (rıza son denetimdir).
    assert.equal((profilGovdesiDogrula({ ...tam, cepTelefonu: '' }, yok) as { alan: string }).alan, 'cepTelefonu')
  })
  it('onboarding\'i bitmiş hesap: hiçbir alan zorunlu değil; gönderilen alan yine doğrulanır', () => {
    const sonra = { ilkKayit: false, kvkkKayitli: false }
    assert.deepEqual(profilGovdesiDogrula({}, sonra), { ok: true, deger: { kvkkDamgala: false } })
    assert.deepEqual(profilGovdesiDogrula({ profession_type: 'doktor', specialty: 'pediatri' }, sonra), { ok: true, deger: { kvkkDamgala: false } })
    assert.deepEqual(profilGovdesiDogrula({ unvan: 'SMMM', büro_adi: 'QA Büro', sehir: 'İzmir', full_name: 'QA Müşavir' }, sonra), { ok: true, deger: { kvkkDamgala: false } })
    assert.deepEqual(profilGovdesiDogrula({ addressing_preference: 'hocam', gender: 'male' }, sonra), { ok: true, deger: { kvkkDamgala: false, gender: 'male', addressingPreference: 'hocam' } })
    assert.equal(profilGovdesiDogrula({ gender: 'x' }, sonra).ok, false)
    assert.equal(profilGovdesiDogrula({ cep_telefonu: '123' }, sonra).ok, false)
    assert.equal(profilGovdesiDogrula({ full_name: 'x'.repeat(121) }, sonra).ok, false)
  })
})

describe('cepTelefonuKolonuYokMu — yalnız "bu kolon yok" hatası', () => {
  it('PostgREST şema önbelleği ve Postgres undefined column tanınır', () => {
    assert.equal(cepTelefonuKolonuYokMu({ code: 'PGRST204', message: "Could not find the 'cep_telefonu' column of 'users' in the schema cache" }), true)
    assert.equal(cepTelefonuKolonuYokMu({ code: '42703', message: 'column "cep_telefonu" of relation "users" does not exist' }), true)
  })
  it('başka kolon, başka hata kodu, kısıt ihlali ya da boş hata bu yola girmez', () => {
    assert.equal(cepTelefonuKolonuYokMu({ code: 'PGRST204', message: "Could not find the 'hospital' column of 'users' in the schema cache" }), false)
    assert.equal(cepTelefonuKolonuYokMu({ code: '23514', message: 'new row for relation "users" violates check constraint "users_cep_telefonu_bicim"' }), false)
    assert.equal(cepTelefonuKolonuYokMu({ code: '23505', message: 'duplicate key value violates unique constraint "users_email_key"' }), false)
    assert.equal(cepTelefonuKolonuYokMu(null), false)
    assert.equal(cepTelefonuKolonuYokMu('cep_telefonu'), false)
    assert.equal(cepTelefonuKolonuYokMu(new Error('cep_telefonu')), false)
  })
})
