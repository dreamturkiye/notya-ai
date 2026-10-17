/**
 * WHATSAPP-CANCEL-01 — the Turkish cancel-phrase matcher (iptalNiyeti.ts) and its wiring in niyet.ts. Pure, no network.
 * Sentetik metinler. Tables: strong (auto-cancel), weak (inbox only), reschedule, negation/question, casing, nothing.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { iptalSiniflandir, normalizeTr, iptalKelimesiMi, yenidenRandevuMu } from './iptalNiyeti'
import { kuralNiyeti } from './niyet'

const tur = (m: string) => iptalSiniflandir(m).tur

describe('normalizeTr: Türkçe harf katlama (JS \\b ve /i yok)', () => {
  it('İ I ı i → i; ş ğ ü ö ç düzleşir; noktalama, emoji, tekrar harf temizlenir', () => {
    assert.equal(normalizeTr('İPTAL'), 'iptal')
    assert.equal(normalizeTr('IPTAL'), 'iptal')
    assert.equal(normalizeTr('ıptal'), 'iptal')
    assert.equal(normalizeTr('iptal'), 'iptal')
    assert.equal(normalizeTr('GELEMEYECEĞİM'), 'gelemeyecegim')
    assert.equal(normalizeTr('Vazgeçtim!'), 'vazgectim')
    assert.equal(normalizeTr('ŞEHİR DIŞINDAYIM'), 'sehir disindayim')
    assert.equal(normalizeTr('Öğleden sonra ÜÇ'), 'ogleden sonra uc')
    assert.equal(normalizeTr('iptalll 🙏🙏'), 'iptal')
    assert.equal(normalizeTr('  iptal,   edin.. '), 'iptal edin')
    assert.equal(normalizeTr(''), '')
    assert.equal(normalizeTr(null as never), '')
  })
  it('Unicode "i̇" (i + birleşik nokta) da iptal olarak okunur', () => {
    assert.equal(normalizeTr('i̇ptal'), 'iptal')
  })
})

describe('iptalKelimesiMi: iptal ailesi ve yazım hataları, "aptal" değil', () => {
  it('kabul', () => {
    for (const t of ['iptal', 'iptali', 'iptalini', 'iptale', 'iptl', 'ipatl', 'itpal', 'ipal']) assert.equal(iptalKelimesiMi(t), true, t)
  })
  it('ret', () => {
    for (const t of ['aptal', 'ipek', 'ip', 'iptalcilikyapiyoruzzz', 'tal', 'sil', 'kapat']) assert.equal(iptalKelimesiMi(t), false, t)
  })
})

describe('GÜÇLÜ sinyal: kendi randevusunu iptal eder', () => {
  const guclu = [
    'iptal', 'İPTAL', 'IPTAL', 'ıptal', 'iptal!', 'iptal.', 'İptal edin', 'iptal edin lütfen', 'iptal ediyorum', 'İPTAL EDİYORUM',
    'randevumu iptal ediyorum', 'randevumu iptal edin', 'randevuyu iptal edin', 'randevuyu iptal edebilir misiniz', 'randevu iptal',
    'randevumu iptal etmek istiyorum', 'randevuyu iptal etmek istiyorum', 'lütfen randevumu iptal edin', 'iptal etmek istiyorum',
    'iptal olsun', 'iptal rica ediyorum', 'ıptal', 'iptall', 'ıptal edin', 'iptal edınız', 'IPTAL EDIN', 'iptl',
    'gelemeyeceğim', 'GELEMEYECEĞİM', 'gelemeyecegim', 'gelemiyorum', 'GELEMİYORUM', 'gelemiyom', 'gelemiycem', 'maalesef gelemiyorum',
    'gelemeyeceğim kusura bakmayın', 'yarınki randevuya gelemeyeceğim', 'randevuya gelemeyeceğim', 'randevuya gelmeyeceğim',
    'gelmeyeceğim', 'gelmiyorum', 'gelemeyeceğimi bildirmek istiyorum', 'artık gelemiyorum', 'katılamayacağım', 'katılamıyorum',
    'vazgeçtim', 'VAZGEÇTİM', 'vazgectim', 'vaz geçtim', 'randevudan vazgeçtim', 'vazgeçtik', 'vazgeçiyorum', 'randevuyu sil', 'randevumu sil', 'randevuyu kapatın',
    'iptal edin 🙏', '❌ iptal', 'iptal edin teşekkürler', 'tamam iptal', 'evet iptal',
  ]
  for (const m of guclu) it(`"${m}" → guclu`, () => assert.equal(tur(m), 'guclu', JSON.stringify(iptalSiniflandir(m))))

  it('yalın "iptal" işaretlenir (başka hiçbir şey değil)', () => {
    for (const m of ['iptal', 'İPTAL', 'IPTAL', 'iptal!', ' ıptal ']) assert.equal(iptalSiniflandir(m).yalinIptal, true, m)
    for (const m of ['iptal edin', 'vazgeçtim', 'gelemiyorum', 'randevumu iptal et']) assert.equal(iptalSiniflandir(m).yalinIptal, false, m)
  })
})

describe('"sil" ve "kapat" tek başına iptal DEĞİL (randevu sözcüğü şart)', () => {
  for (const m of ['sil', 'SİL', 'kapat', 'kapatın', 'mesajı sil', 'bunu sil', 'telefonu kapat', 'pencereyi kapatın', 'hesabımı sil', 'kaydı sil']) {
    it(`"${m}" → yok`, () => assert.equal(tur(m), 'yok'))
  }
  it('randevu sözcüğüyle: güçlü', () => {
    assert.equal(tur('randevumu sil'), 'guclu')
    assert.equal(tur('randevuyu kapat'), 'guclu')
  })
})

describe('ZAYIF/belirsiz sinyal: doktor gelen kutusuna, otomatik iptal YOK', () => {
  const zayif = [
    'müsait değilim', 'MÜSAİT DEĞİLİM', 'uygun değilim', 'o saatte uygun değilim', 'yarın uygun değilim', 'bugün müsait olamayacağım',
    'işim çıktı', 'işim çıktı maalesef', 'hastalandım', 'hastayım', 'ateşim var', 'şehir dışındayım', 'seyahatteyim', 'yetişemiyorum', 'olmaz', 'yetişemeyeceğim',
    'belki iptal ederim', 'sanırım gelemeyeceğim', 'galiba gelemiyorum', 'gelemeyebilirim', 'eğer işim çıkarsa iptal ederim', 'gerekirse iptal edin',
    'umarım iptal etmem gerekmez', 'iptal edebilirim belki', 'acaba gelemeyebilir miyim',
  ]
  for (const m of zayif) it(`"${m}" → zayif (ya da en azından guclu değil)`, () => {
    const t = tur(m)
    assert.notEqual(t, 'guclu', `${m}: ${JSON.stringify(iptalSiniflandir(m))}`)
  })
  it('çekirdek zayıf ifadeler tam olarak zayif', () => {
    for (const m of ['müsait değilim', 'uygun değilim', 'işim çıktı', 'hastalandım', 'şehir dışındayım', 'belki iptal ederim', 'sanırım gelemeyeceğim', 'gelemeyebilirim', 'olmaz']) {
      assert.equal(tur(m), 'zayif', m)
    }
  })
  it('niyet.ts: zayıf → yeniden_planla + zayif bayrağı (asla iptal)', () => {
    for (const m of ['müsait değilim', 'işim çıktı', 'belki iptal ederim']) {
      const n = kuralNiyeti(m)!
      assert.equal(n.niyet, 'yeniden_planla', m)
      assert.equal(n.zayif, true, m)
    }
  })
})

describe('ERTELEME iptal değildir (iptal sözcüğüyle birlikte bile)', () => {
  const yeniden = [
    'erteleyebilir miyiz', 'ERTELEYEBİLİR MİYİZ', 'ertelemek istiyorum', 'randevuyu erteleyebilir miyiz', 'başka güne alabilir miyiz',
    'başka bir güne alabilir miyiz', 'başka gün olabilir mi', 'başka saate alabilir miyiz', 'başka bir zamana kaydırabilir miyiz',
    'randevuyu kaydırabilir miyiz', 'saati değiştirebilir miyiz', 'randevuyu değiştirmek istiyorum', 'ileri alabilir miyiz', 'öne alabilir miyiz',
    'geç gelebilir miyim', 'biraz erken gelebilir miyim', 'yeniden planlayabilir miyiz', 'tarihi değiştirelim',
    'iptal etmek yerine erteleyebilir miyiz', 'iptal değil ertelemek istiyorum', 'iptal ama başka güne alabilir miyiz',
    'gelemiyorum ama başka güne alabilir miyiz', 'gelemeyeceğim erteleyebilir miyiz',
  ]
  for (const m of yeniden) it(`"${m}" → yeniden/olumsuz, iptal değil`, () => {
    const t = tur(m)
    assert.ok(t === 'yeniden' || t === 'olumsuz' || t === 'soru', `${m} → ${t}`)
    assert.notEqual(t, 'guclu')
    const n = kuralNiyeti(m)
    assert.notEqual(n?.niyet, 'iptal', m)
  })
  it('düz erteleme niyet.ts\'te yeniden_planla (zayıf değil)', () => {
    const n = kuralNiyeti('başka güne alabilir miyiz')!
    assert.equal(n.niyet, 'yeniden_planla')
    assert.equal(n.zayif, undefined)
  })
})

describe('OLUMSUZLAMA: iptal etme / iptal istemiyorum / vazgeçmedim', () => {
  const olumsuz = [
    'iptal etmeyin', 'İPTAL ETMEYİN', 'iptal etmeyiniz', 'iptal istemiyorum', 'iptal etmek istemiyorum', 'randevumu iptal etmeyin',
    'randevuyu iptal etmek istemiyorum', 'iptal etme', 'iptal etmiyorum', 'iptal değil', 'iptal olmasın', 'vazgeçmedim', 'VAZGEÇMEDİM',
    'vazgeçmiyorum', 'vazgeçmeyin', 'gelemeyecek değilim', 'gelemiyor değilim', 'iptal edilmesin', 'randevu iptal olmasın lütfen',
    'iptal yapmayın', 'iptal etmem', 'iptal etmeyelim', 'hayır iptal etmek istemiyorum', 'asla iptal etmeyin',
  ]
  for (const m of olumsuz) it(`"${m}" → olumsuz, iptal edilmez`, () => {
    const t = tur(m)
    assert.ok(t === 'olumsuz' || t === 'soru' || t === 'yok', `${m} → ${t}`)
    assert.notEqual(kuralNiyeti(m)?.niyet, 'iptal', m)
  })
  it('çelişki: iptalden vazgeçtim → otomatik iş yok', () => {
    for (const m of ['iptalden vazgeçtim', 'iptal ettim ama vazgeçtim', 'iptali iptal ediyorum vazgeçtim']) {
      assert.equal(tur(m), 'celiski', m)
      assert.notEqual(kuralNiyeti(m)?.niyet, 'iptal', m)
    }
  })
})

describe('SORU / durum anlatımı iptal değildir', () => {
  for (const m of ['iptal mi oldu', 'randevum iptal edildi mi', 'neden iptal edildi', 'iptal edilmiş mi', 'randevum iptal oldu mu?', 'iptal ne zaman olur', 'gelemiyor muyum', 'iptal ettiniz mi', 'randevum iptal edilmiş', 'iptal edildi']) {
    it(`"${m}" → iptal değil`, () => {
      assert.notEqual(tur(m), 'guclu', JSON.stringify(iptalSiniflandir(m)))
      assert.notEqual(kuralNiyeti(m)?.niyet, 'iptal')
    })
  }
  it('nazik rica soru değildir: "iptal edebilir misiniz" güçlü', () => {
    assert.equal(tur('iptal edebilir misiniz'), 'guclu')
    assert.equal(tur('randevumu iptal eder misiniz'), 'guclu')
    assert.equal(tur('iptal edebilir misiniz lütfen'), 'guclu')
  })
})

describe('Sinyalsiz metin → yok', () => {
  for (const m of ['', '   ', 'merhaba', 'teşekkürler', 'muayene ücreti ne kadar', 'aptal', 'randevuma geliyorum', 'ok', 'saat kaçta', 'ilaç yazdınız mı', '123', '👍']) {
    it(`"${m}" → yok`, () => assert.equal(tur(m), 'yok'))
  }
  it('çok uzun mesajlar (>14 kelime) otomatik iş doğurmaz', () => {
    const uzun = 'sayın doktor bey geçen hafta size gelmiştim ve randevu konusunda bir sorun yaşadım gelemiyorum diye düşünmüştüm ama sonra düzeldi'
    assert.equal(tur(uzun), 'yok')
  })
})

describe('Türkçe büyük/küçük harf: aynı karar her yazılışta', () => {
  const ciftler: [string, string][] = [
    ['İPTAL EDİN', 'iptal edin'], ['IPTAL EDIN', 'iptal edin'], ['ıptal edın', 'iptal edin'], ['GELEMİYORUM', 'gelemiyorum'], ['GELEMIYORUM', 'gelemiyorum'],
    ['VAZGEÇTİM', 'vazgectim'], ['VAZGECTIM', 'vazgectim'], ['MÜSAİT DEĞİLİM', 'musait degilim'], ['MUSAIT DEGILIM', 'musait degilim'],
    ['ERTELEYEBİLİR MİYİZ', 'erteleyebilir miyiz'], ['İPTAL ETMEYİN', 'iptal etmeyin'], ['IPTAL ETMEYIN', 'iptal etmeyin'],
  ]
  for (const [a, b] of ciftler) it(`"${a}" == "${b}"`, () => assert.equal(iptalSiniflandir(a).tur, iptalSiniflandir(b).tur))
})

describe('niyet.ts bağlantısı: STOP/DUR ve "yeni randevu"', () => {
  it('STOP/DUR hâlâ vazgec (iptal sınıflandırıcısından önce)', () => {
    for (const m of ['STOP', 'stop', 'DUR', 'Dur', 'durdur', 'mesaj göndermeyin', 'bana yazmayın', 'abonelikten çık'.replace('abonelikten çık', 'unsubscribe')]) {
      assert.equal(kuralNiyeti(m)?.niyet, 'vazgec', m)
    }
  })
  it('güçlü iptal → niyet iptal, kaynak kural', () => {
    for (const m of ['iptal', 'gelemiyorum', 'vazgeçtim', 'randevumu iptal ediyorum', 'gelemeyeceğim']) {
      const n = kuralNiyeti(m)!
      assert.equal(n.niyet, 'iptal', m)
      assert.equal(n.kaynak, 'kural')
      assert.equal(n.zayif, undefined)
    }
  })
  it('EVET/onay iptal sınıflandırıcısına takılmaz', () => {
    assert.equal(kuralNiyeti('EVET')?.niyet, 'onay')
    assert.equal(kuralNiyeti('evet geliyorum')?.niyet, 'onay')
  })
  it('yeniden randevu isteği tanınır, iptal olarak okunmaz', () => {
    for (const m of ['yeni randevu', 'yeniden randevu almak istiyorum', 'tekrar randevu alabilir miyim', 'randevu almak istiyorum']) {
      assert.equal(yenidenRandevuMu(m), true, m)
    }
    assert.equal(yenidenRandevuMu('iptal'), false)
    assert.equal(yenidenRandevuMu('merhaba'), false)
    assert.equal(kuralNiyeti('yeni randevu')?.yenidenRandevu, true)
  })
})
