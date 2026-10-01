/**
 * Regression suite for lib/doktor/hastaCozumleyici.ts, built directly from Dr. Gökhan Mamur's
 * real production complaints (screenshots, 2026-09-25 — 2026-09-30). Calls hastaninSozunuCoz
 * directly against a fake Supabase client — no HTTP route, no model.
 *
 * NOTYA-SUFFIX-TOLERANS-01 (#504): a Turkish possessive suffix glued straight onto a name with
 * no apostrophe ("Yeşilin") must still resolve the patient, and a name ASR splits into two words
 * ("Umutcan Türk oğlunun") must still resolve via the pair-joining + suffix-tolerant match.
 *
 * Yalnız sentetik QA verisi.
 */
import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { SahteVeritabani } from '../security/testing/sahteSupabase'
import { adIndeksParcalari, tokenOzeti } from './hastaAramaIndeksi'
import { hastaninSozunuCoz } from './hastaCozumleyici'

process.env.ENCRYPTION_MASTER_KEY = 'qa-sentetik-cozumleyici-anahtari'

let encrypt: (s: string) => string
let db: SahteVeritabani

function indeksle(doctorId: string, patientId: string, adPlaintext: string) {
  for (const parca of adIndeksParcalari(adPlaintext)) db.ekle('patient_search_tokens', { patient_id: patientId, doctor_id: doctorId, token_hash: tokenOzeti(parca) })
}

before(async () => {
  ;({ encrypt } = await import('../security/encryption'))
})

function sahne() {
  db = new SahteVeritabani()
  const doktorId = randomUUID()
  db.ekle('users', { id: doktorId, full_name: 'QA Hekim', specialty: 'pediatri' })

  const ayseId = db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: 'Ayşe Yeşil' })), dob_encrypted: encrypt('2021-03-01'),
  }).id
  indeksle(doktorId, ayseId, 'Ayşe Yeşil')

  const umutcanId = db.ekle('patients', {
    doctor_id: doktorId, is_active: true,
    name_encrypted: encrypt(JSON.stringify({ ad: 'Umutcan Türkoğlu' })), dob_encrypted: encrypt('2019-04-10'),
  }).id
  indeksle(doktorId, umutcanId, 'Umutcan Türkoğlu')

  return { doktorId, ayseId, umutcanId }
}

describe('NOTYA-AYSE-GERI-01 — sayım cümlesi yalnız açık sayım / liste sorusuna (denetim §4.3)', () => {
  let s: ReturnType<typeof sahne>
  beforeEach(() => { s = sahne() })
  const coz = (mesaj: string, secenek: Parameters<typeof hastaninSozunuCoz>[3] = {}) => hastaninSozunuCoz(db.istemci() as never, s.doktorId, mesaj, secenek)

  it('dosya kelimesi geçen ama hasta sorusu olmayan cümle arama değildir: hasta yok, sayım cümlesi yok', async () => {
    for (const m of [
      'Ali Yılmaz için randevu oluştur', 'Randevu saatini değiştirmek istiyorum', 'Aşı karnesini tablo olarak göster',
      'İlaç etkileşimi var mı kontrol et', 'Epikriz hazırla', 'Otitte ilk seçenek tedavi nedir', 'Ateşli çocukta parasetamol dozu nedir',
      'Tanı koymama yardım eder misin', 'Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz', 'Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?',
      'Bir hasta için ilaç yazmak istiyorum', 'Epikriz yazmama yardım et', 'Alerji testi nasıl istenir?', 'Bronşiolit yönetimini anlat',
    ]) {
      assert.deepEqual(await coz(m), { tur: 'yok' }, m)
    }
  })

  it('açık sayım sorusu sıfır sonuçta sayıyı söyler; örtük "son 90 gün" penceresi yok', async () => {
    const c = await coz('Astım tanılı hastalarım kimler?')
    assert.equal(c.tur, 'yok')
    assert.match(String((c as { sayiMetin?: string }).sayiMetin), /^Kayıtlarda 0 hasta\./)
    for (const m of ['Aşı yapılan hastalarım kimler?', 'İlaç alerjisi olan hastaları listele', 'Randevusu olan hastalar hangileri?']) {
      const r = await coz(m)
      assert.ok(!/son 90 gün/i.test(JSON.stringify(r)), `${m} → ${JSON.stringify(r)}`)
    }
  })

  it('NOTYA-ARAMA-PENCERE-VARSAYILAN-01: 90 günden eski aşı kaydı olan hasta "aşı kaydı olan hastalarım" sorusunda bulunur', async () => {
    db.ekle('asilar', { patient_id: s.umutcanId, doktor_id: s.doktorId, asi_adi: 'KKK', doz_no: 1, uygulama_tarihi: '2024-05-15', kaynak: 'kayit', kaynak_note_id: null })
    const c = await coz('Aşı kaydı olan hastalarım kimler?')
    assert.ok(JSON.stringify(c).includes('Umutcan Türkoğlu'), JSON.stringify(c))
  })

  it('tarif edilen adsız hasta bulunamazsa sayım cümlesi değil, model turu (hasta yok)', async () => {
    assert.deepEqual(await coz('Dün gelen ateşli bebek'), { tur: 'yok' })
  })

  it('açık dosyadayken (kohortsuz) adsız soru arama çalıştırmaz; mesajdaki ad yine kazanır', async () => {
    assert.deepEqual(await coz('Toplam kaç aşısı var', { kohortsuz: true }), { tur: 'yok' })
    const c = await coz('Umutcan Türkoğlu toplam kaç aşı oldu', { kohortsuz: true })
    assert.equal(c.tur, 'tek')
  })
})

describe('NOTYA-AYSE-GERI-01 — persona adıyla aynı ilk adı taşıyan hasta (Ayşe Yeşil)', () => {
  let s: ReturnType<typeof sahne>
  beforeEach(() => { s = sahne() })
  const coz = (mesaj: string, hitapAdi: string | undefined = 'Ayşe') => hastaninSozunuCoz(db.istemci() as never, s.doktorId, mesaj, { hitapAdi })

  it('hal eki ya da "için / adlı hasta" ile anılan ad hastadır', async () => {
    for (const m of ['Ayşe’nin son aşı tarihi ne', "Ayşe'nin kilosu kaç", 'Ayşenin son muayenesi ne zamandı', 'Ayşe’ye en son ne yazmıştım', 'Ayşe için kontrol ne zaman', 'Ayşe adlı hastanın alerjisi var mı', 'Hastam Ayşe en son ne zaman geldi']) {
      const c = await coz(m)
      assert.equal(c.tur, 'tek', `${m} → ${JSON.stringify(c)}`)
      if (c.tur === 'tek') assert.equal(c.patientId, s.ayseId, m)
    }
  })

  it('hitap (yalın ad) hasta seçmez: canlı yanlış-dosya vakası kilitli (NOTYA-HASTA-ODAK-01)', async () => {
    for (const m of ['Merhaba Ayşe', 'Ayşe, aşı karnesini gösterir misin?', 'Biraz koy. Ayşe, benim spesifik arzum aşı karnesini gösterir misin', 'Ayşe Hanım otitte ilk seçenek ne', 'Ayşe bana aşı takvimini anlat', 'Teşekkürler Ayşe']) {
      const c = await coz(m)
      assert.notEqual(c.tur, 'tek', `${m} → ${JSON.stringify(c)}`)
    }
  })

  it('konuşulan meslektaş bilinirse diğer persona adları sıradan hasta adıdır (Mehmet, Deniz …)', async () => {
    const mehmet = db.ekle('patients', { doctor_id: s.doktorId, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'Mehmet Kara' })), dob_encrypted: encrypt('2020-01-01') }).id
    indeksle(s.doktorId, mehmet, 'Mehmet Kara')
    const acik = await coz('Mehmet kaç yaşında')
    assert.equal(acik.tur, 'tek', JSON.stringify(acik))
    // No caller hint: every persona first name stays guarded (the old rule).
    const kapali = await coz('Mehmet kaç yaşında', undefined as never)
    assert.equal((await hastaninSozunuCoz(db.istemci() as never, s.doktorId, 'Mehmet kaç yaşında')).tur, 'yok', JSON.stringify(kapali))
  })

  it('başka doktorun aynı adlı hastası çözülmez (HASTA-IZOLASYON-01)', async () => {
    const diger = randomUUID()
    const yabanci = db.ekle('patients', { doctor_id: diger, is_active: true, name_encrypted: encrypt(JSON.stringify({ ad: 'Selin Öz' })) }).id
    indeksle(diger, yabanci, 'Selin Öz')
    assert.deepEqual(await coz('Selin’in aşıları tam mı'), { tur: 'yok' })
  })
})

describe('hastaCozumleyici — Dr. Gökhan\'ın gerçek şikayetleri bir daha bozulmasın (regresyon)', () => {
  let s: ReturnType<typeof sahne>
  beforeEach(() => { s = sahne() })

  it('"Ayşe Yeşilin son muayenesinin özetini verir misin?" (apostrofsuz ek, canlı ASR biçimi) — #504', async () => {
    const c = await hastaninSozunuCoz(db.istemci() as never, s.doktorId, 'Ayşe Yeşilin son muayenesinin özetini verir misin?')
    assert.equal(c.tur, 'tek', JSON.stringify(c))
    if (c.tur === 'tek') {
      assert.equal(c.patientId, s.ayseId)
      assert.equal(c.ad, 'Ayşe Yeşil')
    }
  })

  it('"Ayşe Yeşil\'in son muayenesinin özetini verir misin?" (apostroflu, Dr. Gökhan\'ın cümlesi) — regresyon olarak kilitli', async () => {
    const c = await hastaninSozunuCoz(db.istemci() as never, s.doktorId, 'Ayşe Yeşil\'in son muayenesinin özetini verir misin?')
    assert.equal(c.tur, 'tek', JSON.stringify(c))
    if (c.tur === 'tek') assert.equal(c.patientId, s.ayseId)
  })

  it('"Umutcan Türkoğlu\'nun doğum tarihini verir misin?" — doğru yazım çözülür', async () => {
    const c = await hastaninSozunuCoz(db.istemci() as never, s.doktorId, 'Umutcan Türkoğlu\'nun doğum tarihini verir misin?')
    assert.equal(c.tur, 'tek', JSON.stringify(c))
    if (c.tur === 'tek') {
      assert.equal(c.patientId, s.umutcanId)
      assert.equal(c.ad, 'Umutcan Türkoğlu')
    }
  })

  it('"Umutcan Türk oğlunun doğum tarihini verir misin?" — ASR soyadı ikiye böldüğünde de çözülür (ekran görüntüsü, Fish ASR)', async () => {
    const c = await hastaninSozunuCoz(db.istemci() as never, s.doktorId, 'Umutcan Türk oğlunun doğum tarihini verir misin?')
    assert.equal(c.tur, 'tek', JSON.stringify(c))
    if (c.tur === 'tek') {
      assert.equal(c.patientId, s.umutcanId)
      assert.equal(c.ad, 'Umutcan Türkoğlu')
    }
  })
})
