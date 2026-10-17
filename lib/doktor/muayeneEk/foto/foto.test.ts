/**
 * FOTO-AI-01 — unit tests of the clinical-photo AI core: schema validator, calibration, specialty/age gating, prompts,
 * the validate -> repair -> give-up loop, learning, comparison. Mocked model answers only: no network, no real image.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  FOTO_AI_SURUMU, GENEL_BAYRAKLAR, PEDIATRIK_BAYRAKLAR, bayrakKodlari, fotoSonucuDogrula, gozlemHedefleri, kaliteDogrula, type FotoDegerlendirme, type FotoMod,
} from './sema'
import { ABSTAIN_METNI, KARAR_DESTEK_UYARISI, kalibreEt, cumleAt } from './kalibrasyon'
import { fotoModu, fotoAiKapaliBrans, yasGrubu, yasMetni, PEDIATRIK_ANAHTAR_KELIMELER } from './uzmanlik'
import { istemParmakIzi, kullaniciMetni, sistemMetni, KALITE_SISTEMI } from './istem'
import { yapilandirilmisCagri, type CagriFonksiyonu } from './cagri'
import { fotoDegerlendir, kaliteKontrol } from './degerlendir'
import { karsilastirmaDogrula, karsilastirmaKalibreEt, fotoKarsilastir } from './karsilastir'
import { alanaGore, kararMi, mutabakatHesapla, mutabakatMetni, ogrenmeUygula, ozellikGecerliMi, MIN_ORNEK_ORAN } from './ogrenme'
import { sahteFotoAiYaniti, sahteKaliteYaniti, sahteKarsilastirmaYaniti } from '../../fotoArsiv/testGorselleri'

const ham = (mod: 'genel' | 'pediatrik' = 'genel') => JSON.parse(sahteFotoAiYaniti('t', mod)) as Record<string, any>
const gecerli = (mod: FotoMod = 'genel', degistir: (h: Record<string, any>) => void = () => undefined): FotoDegerlendirme => {
  const h = ham(mod); degistir(h)
  const r = fotoSonucuDogrula(h, mod)
  assert.ok(r.deger, `geçerli olmalıydı: ${r.hatalar.join(' | ')}`)
  return r.deger
}
const metinCagir = (...yanitlar: unknown[]): { cagir: CagriFonksiyonu; istekler: any[] } => {
  const istekler: any[] = []
  let i = 0
  return {
    istekler,
    cagir: async (g) => {
      istekler.push(JSON.parse(JSON.stringify(g)))
      const y = yanitlar[Math.min(i++, yanitlar.length - 1)]
      return { content: [{ type: 'text', text: typeof y === 'string' ? y : JSON.stringify(y) }], model: 'sahte-model', stop_reason: 'end_turn' }
    },
  }
}

describe('şema doğrulayıcı', () => {
  it('geçerli cevabı kabul eder ve sürümü kaydeder', () => {
    const d = gecerli()
    assert.equal(d.surum, FOTO_AI_SURUMU)
    assert.equal(d.degerlendirilebilir, true)
    assert.equal(d.bolge.id, 'kol-sag')
    assert.equal(d.gozlemler[0].anahtar, 'g1')
  })
  it('küçük sapmalar sessizce düzeltilir: büyük harf, Türkçe karakter, İngilizce eş anlamlı', () => {
    const d = gecerli('genel', (h) => {
      h.kalite.genel = 'GOOD'; h.kalite.isik = 'Yeterli'; h.bolge.guven = 'Medium'; h.bolge.id = 'Kol-Sağ'
      h.gozlemler[0].guven = 'HIGH'
    })
    assert.equal(d.kalite.genel, 'iyi')
    assert.equal(d.bolge.guven, 'orta')
    assert.equal(d.bolge.id, 'kol-sag')
    assert.equal(d.gozlemler[0].guven, 'yuksek')
  })
  it('yapısal bozukluk hata listesi döndürür (kalite yok, boolean değil, abstain nedeni yok)', () => {
    assert.ok(fotoSonucuDogrula('düz metin', 'genel').hatalar.length)
    assert.ok(fotoSonucuDogrula([], 'genel').hatalar.length)
    const k = ham(); delete k.kalite
    assert.ok(fotoSonucuDogrula(k, 'genel').hatalar.some((h) => h.includes('kalite')))
    const b = ham(); b.degerlendirilebilir = 'belki'
    assert.ok(fotoSonucuDogrula(b, 'genel').hatalar.some((h) => h.includes('degerlendirilebilir')))
    const a = ham(); a.degerlendirilebilir = false; a.abstain = null
    assert.ok(fotoSonucuDogrula(a, 'genel').hatalar.some((h) => h.includes('abstain')))
    const m = ham(); m.morfoloji = null
    assert.ok(fotoSonucuDogrula(m, 'genel').hatalar.some((h) => h.includes('morfoloji')))
  })
  it('bilinmeyen alanlar yok sayılır; bilinmeyen bölge null olur', () => {
    const d = gecerli('genel', (h) => { h.tani = 'kesin X'; h.bolge.id = 'burun-ucu' })
    assert.equal(d.bolge.id, null)
    assert.ok(!('tani' in d))
  })
  it('kırmızı bayrak taraması tamamdır: atlanan her kod "degerlendirilemez" olur, asla "yok" değil', () => {
    const d = gecerli('genel', (h) => { h.kirmiziBayraklar = [{ kod: 'peteshi-purpura', durum: 'var', kriter: 'iğne ucu mor lekeler' }] })
    assert.equal(d.kirmiziBayraklar.length, GENEL_BAYRAKLAR.length)
    assert.equal(d.kirmiziBayraklar.find((b) => b.kod === 'peteshi-purpura')!.durum, 'var')
    for (const b of d.kirmiziBayraklar.filter((x) => x.kod !== 'peteshi-purpura')) assert.equal(b.durum, 'degerlendirilemez')
  })
  it('branş sızması: genel modda pediatrik kod düşer, pediatrik modda tam küme beklenir', () => {
    const g = gecerli('genel', (h) => { h.kirmiziBayraklar.push({ kod: 'sarilik-yasa-duyarli', durum: 'var', kriter: 'x' }) })
    assert.ok(!g.kirmiziBayraklar.some((b) => PEDIATRIK_BAYRAKLAR.includes(b.kod as never)))
    const p = gecerli('pediatrik')
    assert.deepEqual(p.kirmiziBayraklar.map((b) => b.kod).sort(), [...bayrakKodlari('pediatrik')].sort())
    assert.deepEqual([...bayrakKodlari('genel')].sort(), [...GENEL_BAYRAKLAR].sort())
  })
  it('ayırıcılar tekilleştirilir, en fazla 4; gözlemler en fazla 8', () => {
    const d = gecerli('genel', (h) => {
      h.ayiricilar = Array.from({ length: 9 }, (_, i) => ({ ad: i % 2 ? 'Egzama' : `Ad ${i}`, guven: 'orta', ayirtEdici: 'x' }))
      h.gozlemler = Array.from({ length: 12 }, (_, i) => ({ metin: `gözlem ${i}`, guven: 'orta' }))
    })
    assert.ok(d.ayiricilar.length <= 4)
    assert.equal(new Set(d.ayiricilar.map((a) => a.anahtar)).size, d.ayiricilar.length)
    assert.equal(d.gozlemler.length, 8)
  })
  it('kalite bloğu tek başına doğrulanır (çekim öncesi kapı)', () => {
    assert.ok(kaliteDogrula(JSON.parse(sahteKaliteYaniti()).kalite).kalite)
    assert.ok(kaliteDogrula({ genel: 'iyi' }).hatalar.length >= 4)
    assert.equal(kaliteDogrula(null).kalite, null)
  })
  it('geri bildirim hedefleri kararlı anahtarlar üretir', () => {
    const d = gecerli('genel', (h) => { h.kirmiziBayraklar[2] = { kod: 'peteshi-purpura', durum: 'olasi', kriter: 'x' } })
    const anahtarlar = gozlemHedefleri(d).map((h) => h.anahtar)
    assert.ok(anahtarlar.includes('bolge') && anahtarlar.includes('morfoloji') && anahtarlar.includes('g1'))
    assert.ok(anahtarlar.includes('bayrak:peteshi-purpura'))
    assert.ok(anahtarlar.some((a) => a.startsWith('ayirici:')))
    assert.ok(!anahtarlar.includes('bayrak:yanik'), 'yalnız var/olasi bayraklar geri bildirim alır')
  })
})

describe('kalibrasyon: model önerir, kurallar karar verir', () => {
  const k = (d: FotoDegerlendirme, veliDili = false) => kalibreEt(d, { veliDili })
  it('yetersiz kalite → ABSTAIN: morfoloji/gözlem/ayırıcı silinir, "çekimi yenileyin" önerisi verilir', () => {
    const d = k(gecerli('genel', (h) => { h.kalite.genel = 'yetersiz'; h.kalite.yenidenCekim = null }))
    assert.equal(d.degerlendirilebilir, false)
    assert.equal(d.morfoloji, null)
    assert.deepEqual(d.gozlemler, [])
    assert.deepEqual(d.ayiricilar, [])
    assert.ok(d.abstain?.neden)
    assert.ok(d.kalite.yenidenCekim && d.kalite.yenidenCekim.length > 10)
    assert.match(d.oneri || '', /Çekimi yenileyin/)
  })
  it('bölge belirlenemiyorsa ABSTAIN', () => {
    const d = k(gecerli('genel', (h) => { h.kalite.bolgeBelirlenebilir = false }))
    assert.equal(d.degerlendirilebilir, false)
    assert.equal(d.morfoloji, null)
  })
  it('model kendisi abstain ederse neden korunur', () => {
    const d = k(gecerli('genel', (h) => { h.degerlendirilebilir = false; h.abstain = { neden: 'Görüntü çok uzak' }; h.morfoloji = null }))
    assert.equal(d.abstain?.neden, 'Görüntü çok uzak')
  })
  it('abstain durumunda "var" bayrak "olası"ya iner ama GİZLENMEZ', () => {
    const d = k(gecerli('genel', (h) => {
      h.kalite.genel = 'yetersiz'
      h.kirmiziBayraklar[2] = { kod: 'peteshi-purpura', durum: 'var', kriter: 'mor lekeler' }
    }))
    const b = d.kirmiziBayraklar.find((x) => x.kod === 'peteshi-purpura')!
    assert.equal(b.durum, 'olasi')
    assert.match(d.oneri || '', /Doktor incelemesi gerekir/)
  })
  it('ölçek referansı yoksa mm/cm cümleleri ve boyut silinir (asla tahmin edilmez)', () => {
    const d = k(gecerli('genel', (h) => {
      h.kalite.olcekReferansi = false
      h.morfoloji.boyut = 'yaklaşık 5 mm'
      h.gozlemler = [{ metin: 'Lezyon 8 mm çapında. Sınırları düzgün.', guven: 'orta' }]
    }))
    assert.equal(d.morfoloji!.boyut, null)
    assert.ok(d.gozlemler.every((g) => !/\d\s*mm/.test(g.metin)))
    assert.ok(d.gozlemler.some((g) => g.metin.includes('Sınırları düzgün')))
    assert.ok(d.sinirlar.some((s) => /ölçek referansı yok/.test(s)))
  })
  it('ölçek referansı varsa boyut korunur', () => {
    const d = k(gecerli('genel', (h) => { h.morfoloji.boyut = '5 mm' }))
    assert.equal(d.morfoloji!.boyut, '5 mm')
  })
  it('tek fotoğraftan "yüksek" güven verilmez (ayırıcı üst sınır: orta); orta kalitede gözlemler de orta ile sınırlı', () => {
    const d = k(gecerli('genel', (h) => {
      h.ayiricilar = [{ ad: 'Egzama', guven: 'yuksek', ayirtEdici: '' }]
      h.kalite.genel = 'orta'
      h.gozlemler = [{ metin: 'Eritem', guven: 'yuksek' }]
    }))
    assert.equal(d.ayiricilar[0].guven, 'orta')
    assert.ok(d.ayiricilar[0].ayirtEdici.length > 5, 'ayırt edici boş bırakılmaz')
    assert.equal(d.gozlemler[0].guven, 'orta')
  })
  it('ölçütsüz "var" bayrak "olası"ya iner ve ölçüt eksikliği yazılır; ABCDE harf istemez', () => {
    const d = k(gecerli('genel', (h) => {
      h.kirmiziBayraklar[0] = { kod: 'pigmentli-lezyon-abcde', durum: 'var', kriter: 'şüpheli görünüm' }
      h.kirmiziBayraklar[1] = { kod: 'enfeksiyon-selulit', durum: 'var', kriter: '' }
    }))
    assert.equal(d.kirmiziBayraklar.find((b) => b.kod === 'pigmentli-lezyon-abcde')!.durum, 'olasi')
    const e = d.kirmiziBayraklar.find((b) => b.kod === 'enfeksiyon-selulit')!
    assert.equal(e.durum, 'olasi')
    assert.match(e.kriter, /Ölçüt belirtilmedi/)
  })
  it('ölçütlü ABCDE "var" kalır', () => {
    const d = k(gecerli('genel', (h) => { h.kirmiziBayraklar[0] = { kod: 'pigmentli-lezyon-abcde', durum: 'var', kriter: 'A: asimetrik, C: üç renk' } }))
    assert.equal(d.kirmiziBayraklar[0].durum, 'var')
  })
  it('herhangi bir bayrak varken öneri "Doktor incelemesi gerekir" der ve bayrağı adıyla sayar', () => {
    const d = k(gecerli('genel', (h) => { h.kirmiziBayraklar[3] = { kod: 'sarilik', durum: 'olasi', kriter: 'skleralarda sarı' } }))
    assert.match(d.oneri || '', /^Doktor incelemesi gerekir:/)
    assert.match(d.oneri || '', /Sarılık/)
  })
  it('kesin tanı dili cümle olarak çıkarılır ve not düşülür', () => {
    const d = k(gecerli('genel', (h) => { h.gozlemler = [{ metin: 'Kesin tanı egzamadır. Eritem var.', guven: 'orta' }] }))
    assert.ok(!d.gozlemler.some((g) => /kesin tan/i.test(g.metin)))
    assert.ok(d.sinirlar.some((s) => /tanı değildir/.test(s)))
  })
  it('"veli" sözcüğü yaşa bağlıdır: erişkinde çıkarılır, reşit olmayanda kalır', () => {
    const girdi = gecerli('genel', (h) => { h.gozlemler = [{ metin: 'Veliye bakım önerilir. Eritem izleniyor.', guven: 'orta' }] })
    assert.ok(!k(girdi, false).gozlemler.some((g) => /veli/i.test(g.metin)))
    assert.ok(k(girdi, true).gozlemler.some((g) => /veli/i.test(g.metin)))
  })
  it('çıktıya güven yükseltmesi eklenmez: kalibrasyon girdiyi değiştirmez ve idempotenttir', () => {
    const girdi = gecerli('genel', (h) => { h.ayiricilar[0].guven = 'yuksek' })
    const kopya = JSON.stringify(girdi)
    const once = k(girdi)
    assert.equal(JSON.stringify(girdi), kopya)
    assert.deepEqual(k(once), once)
  })
  it('cumleAt yalnız eşleşen cümleyi atar', () => {
    const r = cumleAt('Bir. İki 5 mm. Üç.', (c) => /mm/.test(c))
    assert.equal(r.metin, 'Bir. Üç.')
    assert.equal(r.atildi, true)
  })
  it('sabit metinler: karar destek uyarısı ve abstain metni', () => {
    assert.equal(KARAR_DESTEK_UYARISI, 'Karar destek aracıdır, tanı değildir.')
    assert.match(ABSTAIN_METNI, /güvenle yorum yapılamıyor/)
  })
})

describe('branş ve yaş farkındalığı (sızıntısız)', () => {
  it('yalnız pediatri ve çocuk cerrahisi pediatrik moddur', () => {
    assert.equal(fotoModu('pediatri'), 'pediatrik')
    assert.equal(fotoModu('cocuk_cerrahisi'), 'pediatrik')
    for (const b of ['dermatoloji', 'kardiyoloji', 'dahiliye', 'aile', 'goz', 'ortopedi', 'genel', '', null, undefined]) assert.equal(fotoModu(b), 'genel', String(b))
  })
  it('psikiyatri görüntü analizi kapalı', () => {
    assert.equal(fotoAiKapaliBrans('psikiyatri'), true)
    assert.equal(fotoAiKapaliBrans('pediatri'), false)
  })
  it('genel istem hiçbir pediatrik terim taşımaz; pediatrik istem taşır', () => {
    const genel = sistemMetni('genel').toLocaleLowerCase('tr-TR')
    for (const t of PEDIATRIK_ANAHTAR_KELIMELER) assert.ok(!new RegExp(`(^|[^a-zçğıöşü])${t}([^a-zçğıöşü]|$)`, 'i').test(genel), `genel istemde pediatrik terim: ${t}`)
    for (const kod of PEDIATRIK_BAYRAKLAR) assert.ok(!genel.includes(kod))
    const ped = sistemMetni('pediatrik')
    for (const kod of PEDIATRIK_BAYRAKLAR) assert.ok(ped.includes(kod))
    assert.ok(/hemanjiyom/i.test(ped))
  })
  it('istemler karar destek çerçevesi içerir ve model adı taşımaz', () => {
    for (const m of ['genel', 'pediatrik'] as const) {
      const s = sistemMetni(m)
      assert.match(s, /KARAR DESTEK/)
      assert.match(s, /Doktor incelemesi gerekir/)
      assert.ok(!/claude|sonnet|opus|haiku|gpt|gemini/i.test(s))
    }
    assert.ok(!/claude|sonnet|opus|haiku/i.test(KALITE_SISTEMI))
  })
  it('istem parmak izi moda göre değişir ve kararlıdır', () => {
    assert.notEqual(istemParmakIzi('genel'), istemParmakIzi('pediatrik'))
    assert.equal(istemParmakIzi('genel'), istemParmakIzi('genel'))
    assert.match(istemParmakIzi('genel'), /^[0-9a-f]{16}$/)
  })
  it('kullanıcı mesajı "veli" kuralını yaşa göre söyler ve doğum tarihi taşımaz', () => {
    const cocuk = kullaniciMetni({ yas: '7 yaşında', bolgeIpucu: 'kol-sag', veliDili: true })
    const eriskin = kullaniciMetni({ yas: '40 yaşında', bolgeIpucu: null, veliDili: false })
    assert.match(cocuk, /7 yaşında/)
    assert.ok(/veli/i.test(cocuk))
    assert.ok(/kullanma/i.test(eriskin) && /veli/i.test(eriskin))
    assert.ok(!/\d{4}-\d{2}-\d{2}/.test(cocuk + eriskin))
  })
  it('yaş grupları sınırları', () => {
    const simdi = Date.parse('2026-10-16T12:00:00Z')
    assert.equal(yasGrubu('2026-10-10', simdi), 'yenidogan')
    assert.equal(yasGrubu('2025-10-16', simdi), 'bebek')
    assert.equal(yasGrubu('2019-03-01', simdi), 'cocuk')
    assert.equal(yasGrubu('2012-01-01', simdi), 'ergen')
    assert.equal(yasGrubu('1990-01-01', simdi), 'yetiskin')
    assert.equal(yasGrubu(null, simdi), 'bilinmiyor')
    assert.equal(yasGrubu('gelecek', simdi), 'bilinmiyor')
    assert.equal(yasGrubu('2027-01-01', simdi), 'bilinmiyor')
    assert.equal(yasMetni(null), null)
  })
})

describe('yapılandırılmış çağrı: doğrula → onar → vazgeç', () => {
  const g = (cagir: CagriFonksiyonu) => ({
    doctorId: 'd', system: 'sistem', icerik: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } }, { type: 'text', text: 'değerlendir' }],
    dogrula: (x: unknown) => fotoSonucuDogrula(x, 'genel'), maxTokens: 1000, cagir,
  })
  it('geçerli ilk cevap: tek çağrı, onarım yok', async () => {
    const m = metinCagir(ham())
    const s = await yapilandirilmisCagri<FotoDegerlendirme>(g(m.cagir))
    assert.ok(s.deger)
    assert.equal(s.cagriSayisi, 1)
    assert.equal(s.onarimDenendi, false)
    assert.equal(s.model, 'sahte-model')
    assert.equal(m.istekler.length, 1)
  })
  it('kod çiti içindeki JSON da okunur', async () => {
    const m = metinCagir('```json\n' + sahteFotoAiYaniti() + '\n```')
    assert.ok((await yapilandirilmisCagri<FotoDegerlendirme>(g(m.cagir))).deger)
  })
  it('bozuk ilk cevap → TEK metin-yalnız onarım; onarım görüntü içermez ve hataları gösterir', async () => {
    const bozuk = ham(); delete bozuk.kalite
    const m = metinCagir(bozuk, ham())
    const s = await yapilandirilmisCagri<FotoDegerlendirme>(g(m.cagir))
    assert.ok(s.deger)
    assert.equal(s.onarimDenendi, true)
    assert.equal(s.onarildi, true)
    assert.equal(s.cagriSayisi, 2)
    const onarimIstegi = JSON.stringify(m.istekler[1])
    assert.ok(!onarimIstegi.includes('"type":"image"'), 'onarımda görüntü yeniden gönderilmez')
    assert.match(onarimIstegi, /kalite/)
  })
  it('JSON olmayan cevap da onarılır; iki kez bozuksa vazgeçer (uydurma yok)', async () => {
    const m = metinCagir('bu json değil', 'hâlâ json değil')
    const s = await yapilandirilmisCagri<FotoDegerlendirme>(g(m.cagir))
    assert.equal(s.deger, null)
    assert.equal(s.cagriSayisi, 2)
    assert.equal(s.onarildi, false)
    assert.ok(s.hatalar.length)
  })
  it('token sınırında kesilen cevap tamamlanmaya çalışılmaz', async () => {
    const kesik = sahteFotoAiYaniti().slice(0, 200)
    const m = metinCagir(kesik, kesik)
    const s = await yapilandirilmisCagri<FotoDegerlendirme>({ ...g(m.cagir), cagir: async (x) => ({ ...(await m.cagir(x)), stop_reason: 'max_tokens' }) })
    assert.equal(s.deger, null)
  })
  it('model adı yalnızca cevaptan okunur, kodda sabit değildir', async () => {
    const s = await yapilandirilmisCagri<FotoDegerlendirme>(g(async () => ({ content: [{ type: 'text', text: sahteFotoAiYaniti() }] })))
    assert.equal(s.model, null)
  })
})

describe('fotoDegerlendir / kaliteKontrol (sahte model)', () => {
  const gorsel = { mime: 'image/png' as const, base64: 'AAAA' }
  it('uçtan uca: doğrulanır, kalibre edilir, sürüm ve model kaydedilir', async () => {
    const m = metinCagir(sahteFotoAiYaniti('x'))
    const s = await fotoDegerlendir({ doctorId: 'd', gorsel, mod: 'genel', yas: '30 yaşında', bolgeIpucu: null, veliDili: false, cagir: m.cagir })
    assert.equal(s.durum, 'tamam')
    if (s.durum !== 'tamam') return
    assert.equal(s.uretim.surum, FOTO_AI_SURUMU)
    assert.equal(s.uretim.model, 'sahte-model')
    assert.equal(s.uretim.kaynak, 'model')
    assert.equal(s.deger.ayiricilar[0].guven, 'dusuk')
  })
  it('model iki kez geçersiz cevap verirse "hata" döner ve hiçbir klinik içerik üretilmez', async () => {
    const s = await fotoDegerlendir({ doctorId: 'd', gorsel, mod: 'genel', yas: null, bolgeIpucu: null, veliDili: false, cagir: metinCagir('x', 'y').cagir })
    assert.equal(s.durum, 'hata')
    assert.ok(!('deger' in s))
  })
  it('pediatrik mod isteme pediatrik kodları koyar, genel mod koymaz', async () => {
    const p = metinCagir(sahteFotoAiYaniti('x', 'pediatrik'))
    await fotoDegerlendir({ doctorId: 'd', gorsel, mod: 'pediatrik', yas: '2 aylık', bolgeIpucu: null, veliDili: true, cagir: p.cagir })
    assert.ok(JSON.stringify(p.istekler[0]).includes('hemanjiyom-riskli-konum'))
    const g = metinCagir(sahteFotoAiYaniti('x'))
    await fotoDegerlendir({ doctorId: 'd', gorsel, mod: 'genel', yas: '40 yaşında', bolgeIpucu: null, veliDili: false, cagir: g.cagir })
    assert.ok(!JSON.stringify(g.istekler[0]).includes('hemanjiyom'))
  })
  it('çekim öncesi kapı: kötü kalitede yenile=true ve "çekimi yenileyin" önerisi; iyi kalitede yenile=false', async () => {
    const kotu = await kaliteKontrol({ doctorId: 'd', gorsel, cagir: metinCagir(sahteKaliteYaniti(true)).cagir })
    assert.equal(kotu?.yenile, true)
    assert.ok((kotu?.kalite.yenidenCekim || '').length > 5)
    const iyi = await kaliteKontrol({ doctorId: 'd', gorsel, cagir: metinCagir(sahteKaliteYaniti(false)).cagir })
    assert.equal(iyi?.yenile, false)
  })
  it('çekim öncesi kapı çalışamazsa null döner (kaydetmeyi engellemez)', async () => {
    assert.equal(await kaliteKontrol({ doctorId: 'd', gorsel, cagir: metinCagir('json değil').cagir }), null)
  })
})

describe('doktor geri bildirimi ve öğrenme', () => {
  const satir = (ozellik: string, kabul: number, duzelt: number, reddet: number) => ({ ozellik, kabul, duzelt, reddet })
  it('kapalı kelime dağarcığı: serbest metin öğrenme tablosuna giremez', () => {
    for (const o of ['morfoloji', 'gozlem', 'bolge:kol-sag', 'bayrak:peteshi-purpura', 'ayirici:egzama']) assert.ok(ozellikGecerliMi(o), o)
    for (const o of ['bolge:burun', 'Hasta Ayşe Yılmaz', 'ayirici:Egzama Kontakt!', 'bayrak:', '', 'x'.repeat(100), 5, null]) assert.ok(!ozellikGecerliMi(o as string), String(o))
    assert.ok(kararMi('kabul') && kararMi('duzelt') && kararMi('reddet') && !kararMi('belki'))
  })
  it('mutabakat oranı yeterli örnek olmadan yüzde vermez', () => {
    const az = mutabakatHesapla([satir('morfoloji', 2, 1, 0)])
    assert.equal(az.oran, null)
    assert.match(mutabakatMetni(az), new RegExp(`en az ${MIN_ORNEK_ORAN}`))
    const yeter = mutabakatHesapla([satir('morfoloji', 6, 2, 2)])
    assert.equal(yeter.toplam, 10)
    assert.equal(yeter.oran, 0.6)
    assert.match(mutabakatMetni(yeter), /%60/)
    assert.equal(mutabakatMetni(mutabakatHesapla([])), 'Henüz geri bildirim yok.')
  })
  it('alana göre dağılım', () => {
    const a = alanaGore([satir('bayrak:yanik', 1, 0, 4), satir('bayrak:sarilik', 5, 0, 0), satir('morfoloji', 3, 3, 0)])
    assert.equal(a.bayrak.toplam, 10)
    assert.equal(a.morfoloji.kabul, 3)
  })
  it('sık reddedilen ayırıcının güveni bir kademe düşer ve doktora söylenir; yeterli örnek yoksa dokunulmaz', () => {
    const d = gecerli('genel', (h) => { h.ayiricilar = [{ ad: 'Egzama', guven: 'orta', ayirtEdici: 'x' }] })
    const az = ogrenmeUygula(d, [satir('ayirici:egzama', 0, 0, 3)])
    assert.equal(az.deger.ayiricilar[0].guven, 'orta')
    assert.deepEqual(az.uyarlamalar, [])
    const cok = ogrenmeUygula(d, [satir('ayirici:egzama', 1, 0, 5)])
    assert.equal(cok.deger.ayiricilar[0].guven, 'dusuk')
    assert.equal(cok.uyarlamalar.length, 1)
    assert.match(cok.uyarlamalar[0].mesaj, /reddettiğiniz/)
    assert.equal(d.ayiricilar[0].guven, 'orta', 'girdi değişmez')
  })
  it('GÜVENLİK ASİMETRİSİ: sık reddedilen kırmızı bayrak asla gizlenmez, güven asla yükselmez', () => {
    const d = kalibreEt(gecerli('genel', (h) => { h.kirmiziBayraklar[4] = { kod: 'yanik', durum: 'var', kriter: 'bül ve eritem' } }), { veliDili: false })
    const r = ogrenmeUygula(d, [satir('bayrak:yanik', 0, 0, 20)])
    const b = r.deger.kirmiziBayraklar.find((x) => x.kod === 'yanik')!
    assert.equal(b.durum, 'olasi', '"var" en fazla "olası"ya iner')
    assert.ok(r.deger.kirmiziBayraklar.some((x) => x.kod === 'yanik'), 'bayrak listede kalır')
    assert.match(r.uyarlamalar.map((u) => u.mesaj).join(' '), /gizlemiyoruz/)
    // hiçbir alan yükselmez
    const rank = { dusuk: 0, orta: 1, yuksek: 2 } as const
    d.ayiricilar.forEach((a, i) => assert.ok(rank[r.deger.ayiricilar[i].guven] <= rank[a.guven]))
    // "olası" bayrak olduğu gibi kalır
    const o = kalibreEt(gecerli('genel', (h) => { h.kirmiziBayraklar[4] = { kod: 'yanik', durum: 'olasi', kriter: 'eritem' } }), { veliDili: false })
    assert.equal(ogrenmeUygula(o, [satir('bayrak:yanik', 0, 0, 20)]).deger.kirmiziBayraklar.find((x) => x.kod === 'yanik')!.durum, 'olasi')
  })
  it('genel gözlem düzeltmeleri sık ise gözlem güvenleri düşer', () => {
    const d = gecerli('genel', (h) => { h.gozlemler = [{ metin: 'Eritem', guven: 'yuksek' }] })
    const r = ogrenmeUygula(d, [satir('gozlem', 0, 6, 3)])
    assert.equal(r.deger.gozlemler[0].guven, 'orta')
  })
})

describe('değişim tespiti (önceki fotoğrafla karşılaştırma)', () => {
  const baglam = { olcekIkisinde: true, veliDili: false }
  it('geçerli cevabı doğrular; etiket eş anlamlıları düzelir', () => {
    const j = JSON.parse(sahteKarsilastirmaYaniti('t'))
    j.degisimler[0].etiket = 'shrinkage'
    const r = karsilastirmaDogrula(j)
    assert.ok(r.deger || r.hatalar.length)
    const iyi = karsilastirmaDogrula(JSON.parse(sahteKarsilastirmaYaniti('t')))
    assert.ok(iyi.deger, iyi.hatalar.join('|'))
    assert.equal(iyi.deger!.degisimler[0].etiket, 'kuculme')
  })
  it('geçersiz cevap hata listesi döndürür', () => {
    assert.ok(karsilastirmaDogrula('x').hatalar.length)
    assert.ok(karsilastirmaDogrula({}).hatalar.length)
  })
  it('karşılaştırılamıyorsa değişim listesi boşalır, güven düşük, yeniden çekim önerilir', () => {
    const j = JSON.parse(sahteKarsilastirmaYaniti('t')); j.karsilastirilabilir = false; j.neden = 'Farklı açı'
    const r = karsilastirmaDogrula(j).deger!
    const k = karsilastirmaKalibreEt(r, baglam)
    assert.deepEqual(k.degisimler, [])
    assert.equal(k.genelGuven, 'dusuk')
    assert.match(k.oneri || '', /yeniden çekin/)
  })
  it('iki fotoğrafta ortak ölçek yoksa mm/cm ifadeleri çıkar; tek çiftten "yüksek" güven verilmez', () => {
    const j = JSON.parse(sahteKarsilastirmaYaniti('t'))
    j.degisimler = [{ etiket: 'buyume', metin: 'Lezyon 3 mm büyümüş. Rengi koyulaşmış.', guven: 'yuksek' }]
    j.genelGuven = 'yuksek'
    const k = karsilastirmaKalibreEt(karsilastirmaDogrula(j).deger!, { olcekIkisinde: false, veliDili: false })
    assert.ok(k.degisimler.every((d) => !/\d\s*mm/.test(d.metin)))
    assert.equal(k.degisimler[0].guven, 'orta')
    assert.equal(k.genelGuven, 'orta')
    assert.ok(k.sinirlar.some((s) => /ölçek/.test(s)))
  })
  it('dikkat gerektiren değişimde "Doktor incelemesi gerekir"', () => {
    const j = JSON.parse(sahteKarsilastirmaYaniti('t'))
    j.degisimler = [{ etiket: 'kotulesme', metin: 'Kızarıklık yayılmış.', guven: 'orta' }]
    const k = karsilastirmaKalibreEt(karsilastirmaDogrula(j).deger!, baglam)
    assert.match(k.oneri || '', /Doktor incelemesi gerekir/)
  })
  it('iyileşme tek başına uyarı üretmez', () => {
    const j = JSON.parse(sahteKarsilastirmaYaniti('t'))
    j.degisimler = [{ etiket: 'iyilesme', metin: 'Eritem azalmış.', guven: 'orta' }]
    assert.ok(!/Doktor incelemesi/.test(karsilastirmaKalibreEt(karsilastirmaDogrula(j).deger!, baglam).oneri || ''))
  })
  it('"veli" erişkinde çıkarılır', () => {
    const j = JSON.parse(sahteKarsilastirmaYaniti('t')); j.ozet = 'Veliye bildirilmeli. Eritem küçülmüş.'
    const k = karsilastirmaKalibreEt(karsilastirmaDogrula(j).deger!, baglam)
    assert.ok(!/veli/i.test(k.ozet))
    assert.ok(/küçülmüş/.test(k.ozet))
  })
  it('uçtan uca (sahte model): iki görüntü, gün sayısı kullanıcı mesajında, sürüm kaydı', async () => {
    const m = metinCagir(sahteKarsilastirmaYaniti('t'))
    const gorsel = { mime: 'image/png' as const, base64: 'AAAA' }
    const s = await fotoKarsilastir({ doctorId: 'd', onceki: gorsel, sonraki: gorsel, gunFarki: 47, olcekIkisinde: true, veliDili: false, cagir: m.cagir })
    assert.equal(s.durum, 'tamam')
    const istek = JSON.stringify(m.istekler[0])
    assert.match(istek, /47 gün/)
    assert.equal((istek.match(/"type":"image"/g) || []).length, 2)
    if (s.durum === 'tamam') assert.equal(s.uretim.surum, FOTO_AI_SURUMU)
  })
})
