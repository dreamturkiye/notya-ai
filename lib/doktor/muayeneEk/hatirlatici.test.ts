/** MUAYENE-EKLERI-01 — transkript → "ek gerekir ama yüklenmemiş" hatırlatıcıları (yalnız öneri). */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ekHatirlaticilar, eksikHatirlaticilar, tumceleriAyir } from './hatirlatici'

const kodlar = (t: string, pediatrik = false) => ekHatirlaticilar(t, { pediatrik }).map((h) => h.kod)

describe('hatırlatıcı — aşı (olumlu)', () => {
  for (const t of [
    'Şimdi aşı yapıyorum.',
    'Şimdi aşı veriyorum, anne yanında.',
    'KPA aşısını yaptım.',
    'Hexaxim yaptım bugün.',
    'Bu muayenede suçiçeği aşısını yaptık.',
    'Aşıyı yaptım, sol uyluğa.',
    'Aşıları yaptık.',
    'Rotarix verdim.',
    'Aşı uyguladım.',
    'Şimdi aşı yapacağım.',
    'Birazdan aşı vereceğiz.',
  ]) {
    it(`tetikler: ${t}`, () => assert.ok(kodlar(t).includes('asi'), t))
  }
})

describe('hatırlatıcı — aşı (olumsuz / başka bağlam: ÇIKMAMALI)', () => {
  for (const t of [
    'Aşı yaptırmamış.',
    'Aşı olmamış, anne istemiyor.',
    'Aşıları yapılmamış.',
    'Aşı yaptırmadı.',
    'Aşı yaptırmak istemiyor.',
    'Aşısı eksik.',
    'Aşıyı yapmadım.',
    'Bir sonraki ziyarette aşı yapacağız.',
    'Haftaya aşı yapacağım.',
    'Aşı yapacağız.',
    'Aşılar yapılmış, karne tam.',
    'Aşı reddetti.',
    'Aşısı gecikmiş.',
    'Hexaxim yapılmamış.',
    'Aşı olmamış ve kontrolde yapacağız.',
  ]) {
    it(`tetiklemez: ${t}`, () => assert.ok(!kodlar(t).includes('asi'), `${t} -> ${kodlar(t)}`))
  }
  it('olumsuz ilk parça, olumlu ikinci parça: hatırlatır', () => {
    assert.ok(kodlar('Daha önce aşı yaptırmamış, bugün aşı yaptım.').includes('asi'))
  })
})

describe('hatırlatıcı — lab / röntgen / EKG / fotoğraf / barkod', () => {
  it('tahlili yükleyeceğim', () => assert.ok(kodlar('Tahlil sonuçlarını sonra sisteme yükleyeceğim.').includes('lab')))
  it('labı da ekleyeceğim', () => assert.ok(kodlar('Şu labı da ekleyeceğim.').includes('lab')))
  it('tahlillerine baktım', () => assert.ok(kodlar('Annenin getirdiği tahlillere baktım, CRP yüksek.').includes('lab')))
  it('tahlil istedim: tetiklemez', () => assert.deepEqual(kodlar('Kan tahlili istedim, yarın gelsin.'), []))
  it('grafiyi de ekleyeceğim', () => assert.ok(kodlar('Akciğer grafisini de ekleyeceğim.').includes('rontgen')))
  it('röntgeni getirmiş', () => assert.ok(kodlar('Röntgeni getirmişler, bakıyorum.').includes('rontgen')))
  it('grafi çektirelim: tetiklemez', () => assert.deepEqual(kodlar('Akciğer grafisi çektirelim.'), []))
  it('EKG çektim', () => assert.ok(kodlar('EKG çektim, ritim düzenli.').includes('ekg')))
  it('fotoğraf çektim', () => assert.ok(kodlar('Lezyonun fotoğrafını çektim.').includes('foto')))
  it('öncesi sonrası fotoğraf', () => assert.ok(kodlar('Öncesi sonrası fotoğrafları ekleyeceğim.').includes('foto')))
  it('barkodu okuttum', () => assert.ok(kodlar('Flakonun barkodunu okuttum.').includes('barkod')))
  it('genel: belgeyi ekleyeceğim', () => assert.ok(kodlar('Epikriz belgesini ekleyeceğim.').includes('genel')))
  it('büyüme fotoğrafı yalnız pediatrik kapsamda', () => {
    assert.ok(kodlar('Büyüme fotoğrafını çektim.', true).includes('foto'))
    // Pediatrik değilse "fotoğraf" kelimesi yine genel foto olarak yakalanır; ama büyüme ifadesine özel kapı yok.
    assert.ok(!kodlar('Büyüme grafiğine baktım.', false).includes('foto'))
  })
  it('boş / ilgisiz transkript hiçbir şey üretmez', () => {
    assert.deepEqual(kodlar(''), [])
    assert.deepEqual(kodlar('Ateş 38.5, boğaz hiperemik, tonsiller büyük. Parasetamol öneriyorum.'), [])
  })
  it('büyük harf ve noktalama farkı', () => assert.ok(kodlar('ŞİMDİ AŞI YAPIYORUM').includes('asi')))
  it('kanıt cümlesi döner ve kısaltılır', () => {
    const [h] = ekHatirlaticilar('Şimdi aşı yapıyorum.')
    assert.ok(h.kanit.includes('aşı yapıyorum'))
    assert.ok(h.kanit.length <= 160)
    assert.equal(h.tur, 'asi')
  })
  it('her kod için tek hatırlatıcı', () => {
    assert.equal(ekHatirlaticilar('Aşı yaptım. Bir de aşı yaptık.').filter((h) => h.kod === 'asi').length, 1)
  })
})

describe('hatırlatıcı — yüklenmiş ek varsa gösterilmez', () => {
  it('aşı yüklendiyse aşı hatırlatıcısı kalkar', () => {
    const a = ekHatirlaticilar('Aşı yaptım. Tahlili de ekleyeceğim.')
    assert.deepEqual(eksikHatirlaticilar(a, ['asi']).map((h) => h.kod), ['lab'])
    assert.deepEqual(eksikHatirlaticilar(a, []).map((h) => h.kod).sort(), ['asi', 'lab'])
  })
  it('barkod hatırlatıcısını aşı eki karşılar', () => {
    const a = ekHatirlaticilar('Barkodu okuttum.')
    assert.deepEqual(eksikHatirlaticilar(a, ['asi']), [])
  })
  it('genel hatırlatıcı herhangi bir ekle kalkar', () => {
    const a = ekHatirlaticilar('Belgeyi ekleyeceğim.')
    assert.equal(eksikHatirlaticilar(a, []).length, 1)
    assert.equal(eksikHatirlaticilar(a, ['diger']).length, 0)
  })
})

describe('tümce ayırma', () => {
  it('küçük harfe çevirir (tr-TR) ve böler', () => {
    assert.deepEqual(tumceleriAyir('IĞDIR. Aşı yaptım; tamam\nbitti'), ['ığdır', 'aşı yaptım', 'tamam', 'bitti'])
  })
})
