/**
 * NOTYA-AYSE-ALAN-01 — the placeholder mechanics (pure): what is issued, what is kept, what is removed, what is
 * spoken. The route-level leak test is lib/asistan/alanSizinti.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ALAN_ADLARI, AlanDefteri, HASTA_ALAN_ARACI, HASTA_ALAN_KURALI, alanAnahtari, alanSozcusu, verilmeyenleriSil, yerTutucuVarMi } from './hastaAlan'
import { EKRANA_YAZDIM, kimlikEkrandaSozu, konusmaYap } from './konusma'
import { kimlikAlanDegeri, kimlikCevabiMetni, type KimlikAlani, type KimlikKaydi } from '../doktor/kimlikSorusu'

const A = { id: 'hasta-a', ad: 'Tuna Erdemli' }
const B = { id: 'hasta-b', ad: 'Mert Kılınç' }
const VAR = { durum: 'var' as const, metin: 'QA-DEĞER', degerli: true }
const EKSIK = { durum: 'eksik' as const, metin: 'E-posta kayıtlı değil — hasta dosyasında Özet › Demografik bilgiler › Düzenle’den ekleyebilirsiniz.', degerli: false }

describe('alan adı', () => {
  it('modelin yazdığı biçim ne olursa olsun aynı alana çözülür; tanımsız alan null', () => {
    assert.equal(alanAnahtari('anne_adi'), 'anne_adi')
    assert.equal(alanAnahtari('Anne Adı'), 'anne_adi')
    assert.equal(alanAnahtari('baba-adi'), 'baba_adi')
    assert.equal(alanAnahtari('e-posta'), 'eposta')
    assert.equal(alanAnahtari('doğum yeri'), 'dogum_yeri')
    assert.equal(alanAnahtari('tc_kimlik'), null)
    assert.equal(alanAnahtari(''), null)
  })

  it('aracın alan listesi kimlik yönlendiricisinin alanlarının tamamıdır', () => {
    const hepsi: KimlikAlani[] = ['anneAdi', 'babaAdi', 'veli', 'telefon', 'anneTelefon', 'babaTelefon', 'veliTelefon', 'eposta', 'adres', 'dogumYeri', 'dogumTarihi']
    assert.deepEqual([...Object.values(ALAN_ADLARI)].sort(), [...hepsi].sort())
    assert.deepEqual((HASTA_ALAN_ARACI.input_schema.properties as Record<string, { enum?: string[] }>).alan.enum, Object.keys(ALAN_ADLARI))
    assert.deepEqual(HASTA_ALAN_ARACI.input_schema.required, ['alan'])
  })

  it('istem kuralı aracın adını söyler, hiçbir alan anahtarı ya da değer örneği taşımaz', () => {
    assert.ok(HASTA_ALAN_KURALI.includes('hasta_alan'))
    for (const k of Object.keys(ALAN_ADLARI).filter((x) => x.includes('_'))) assert.ok(!HASTA_ALAN_KURALI.includes(k), k)
  })
})

describe('defter: bir turda verilen yer tutucular', () => {
  it('ilk hasta yalın anahtar alır; aynı turdaki ikinci hasta ayrı anahtar alır — iki hastanın alanı karışmaz', () => {
    const d = new AlanDefteri()
    assert.equal(d.ver('anne_adi', A, VAR), '{{ALAN:anne_adi}}')
    assert.equal(d.ver('telefon', A, VAR), '{{ALAN:telefon}}')
    assert.equal(d.ver('anne_adi', B, VAR), '{{ALAN:anne_adi#2}}')
    assert.equal(d.bul('anne_adi')?.hastaId, 'hasta-a')
    assert.equal(d.bul('anne_adi#2')?.hastaId, 'hasta-b')
    assert.equal(d.bul('baba_adi'), null)
  })

  it('defter değer tutmaz: yalnız alan, hasta ve durum', () => {
    const d = new AlanDefteri()
    d.ver('anne_adi', A, VAR)
    d.ver('eposta', A, EKSIK)
    assert.ok(!JSON.stringify(d).includes('QA-DEĞER'))
    assert.deepEqual(d.kullanilan('Adı {{ALAN:anne_adi}}. {{ALAN:eposta}} {{ALAN:adres}}'), [
      { anahtar: 'anne_adi', alan: 'anneAdi', hastaId: 'hasta-a' },
      { anahtar: 'eposta', alan: 'eposta', hastaId: 'hasta-a' },
    ])
  })
})

describe('saklanan / modele giden biçim', () => {
  it('bu turda verilen yer tutucu kalır; verilmeyen silinir ve cümle toparlanır', () => {
    const d = new AlanDefteri()
    d.ver('anne_adi', A, VAR)
    assert.deepEqual(verilmeyenleriSil('Annesinin adı {{ALAN:anne_adi}}, babasının adı {{ALAN:baba_adi}}.', d), { metin: 'Annesinin adı {{ALAN:anne_adi}}, babasının adı.', silinen: 1 })
    assert.deepEqual(verilmeyenleriSil('Annesinin adı {{ ALAN : Anne_Adi }}.', d), { metin: 'Annesinin adı {{ALAN:anne_adi}}.', silinen: 0 })
  })

  it('defter yoksa her yer tutucu silinir; yer tutucusuz metne dokunulmaz', () => {
    assert.deepEqual(verilmeyenleriSil('Adı {{ALAN:anne_adi}} olarak kayıtlı.', null), { metin: 'Adı olarak kayıtlı.', silinen: 1 })
    const duz = 'Kilo 9,8 kg.  İki boşluk ve ...üç nokta aynen kalır.'
    assert.deepEqual(verilmeyenleriSil(duz, new AlanDefteri()), { metin: duz, silinen: 0 })
    assert.equal(yerTutucuVarMi(duz), false)
    assert.equal(yerTutucuVarMi('x {{ALAN:adres}} y'), true)
  })
})

describe('sözlü biçim: değer taşıyacak cümle okunmaz', () => {
  it('değerli alan: tur başına bir kez "… ekranınıza yazdım Hocam"; diğer cümleler aynen', () => {
    const d = new AlanDefteri()
    d.ver('anne_adi', A, VAR)
    d.ver('telefon', A, VAR)
    const soz = konusmaYap('Annesinin adı {{ALAN:anne_adi}}. Telefonu {{ALAN:telefon}}. Son muayenesi geçen ay yapıldı.', alanSozcusu(d))
    assert.equal(soz, `${kimlikEkrandaSozu('Tuna Erdemli')} Son muayenesi geçen ay yapıldı.`)
    assert.ok(!/\{\{|QA-DEĞER/.test(soz))
  })

  it('kayıtlı olmayan alan: nereden ekleneceğini söyleyen cümle okunur (değer taşımaz)', () => {
    const d = new AlanDefteri()
    d.ver('eposta', A, EKSIK)
    assert.match(konusmaYap('{{ALAN:eposta}}', alanSozcusu(d)), /^E-posta kayıtlı değil — hasta dosyasında/)
  })

  it('kayıtlı değil ama cümlesi iletişim değeri taşıyan alan (dosyadaki telefon) okunmaz', () => {
    const d = new AlanDefteri()
    d.ver('anne_telefon', A, { durum: 'eksik', metin: 'Annesinin telefonu ayrıca kayıtlı değil. Dosyadaki iletişim telefonu: 0555 000 11 22', degerli: true })
    assert.equal(konusmaYap('{{ALAN:anne_telefon}}', alanSozcusu(d)), kimlikEkrandaSozu('Tuna Erdemli'))
  })

  it('verilmeyen yer tutucu sözden de silinir; saklanan cevabı sesli okurken (defter yok) ekrana işaret edilir', () => {
    assert.equal(konusmaYap('Adı {{ALAN:anne_adi}} olarak kayıtlı.', alanSozcusu(new AlanDefteri())), 'Adı olarak kayıtlı.')
    assert.equal(konusmaYap('Annesinin adı {{ALAN:anne_adi}}. Babasının adı {{ALAN:baba_adi}}. Kilo 9,8 kg.', alanSozcusu(null)), `${EKRANA_YAZDIM} Kilo 9,8 kg.`)
  })
})

describe('tek alanın değeri: kimlik yönlendiricisiyle aynı okuma, aynı eksik cümlesi', () => {
  const kayit: KimlikKaydi = {
    ad: 'Tuna Erdemli', dogumTarihi: { deger: '2021-03-14', kaynak: 'kart' }, telefon: { deger: '0555 000 11 22', kaynak: 'kart' }, eposta: null,
    adres: { deger: 'QA-Sokak No 7, QA-İl', kaynak: 'form' }, dogumYeri: null, anneAdi: { deger: 'QA-Anne', kaynak: 'kart' }, babaAdi: { deger: 'QA-Baba', kaynak: 'belge' },
    veli: { ad: 'QA-Veli', yakinlik: 'Anne', telefon: '0555 000 33 44' }, acilKisi: null,
  }
  const simdi = Date.parse('2026-10-02T09:00:00Z')

  it('kayıtlı alan: yalın değer (etiketsiz, kaynaksız); tarih gg.aa.yyyy', () => {
    assert.deepEqual(kimlikAlanDegeri('anneAdi', kayit, simdi), { durum: 'var', metin: 'QA-Anne', degerli: true })
    assert.equal(kimlikAlanDegeri('dogumTarihi', kayit, simdi).metin, '14.03.2021')
    assert.equal(kimlikAlanDegeri('veli', kayit, simdi).metin, 'QA-Veli (Anne) — 0555 000 33 44')
    assert.equal(kimlikAlanDegeri('anneTelefon', kayit, simdi).metin, '0555 000 33 44 — QA-Veli')
  })

  it('kayıtlı olmayan alan: yönlendiricinin ekran cümlesinin aynısı', () => {
    for (const alan of ['eposta', 'dogumYeri'] as const) {
      const d = kimlikAlanDegeri(alan, kayit, simdi)
      assert.equal(d.durum, 'eksik')
      assert.equal(d.degerli, false)
      assert.equal(`Tuna Erdemli — ${d.metin}`, kimlikCevabiMetni([alan], kayit, simdi).ekran)
    }
  })

  it('babanın telefonu ayrıca yok, dosyada iletişim telefonu var: cümle değer taşır', () => {
    const d = kimlikAlanDegeri('babaTelefon', kayit, simdi)
    assert.equal(d.durum, 'eksik')
    assert.equal(d.degerli, true)
    assert.match(d.metin, /ayrıca kayıtlı değil\. Dosyadaki iletişim telefonu: 0555 000 11 22/)
  })
})
