/**
 * NOTYA-DANIS-OLCUM — the measurement of ONE named visit, from the record (Dr. Gökhan, live, 2026-10-02).
 *
 * "Bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu" was answered with an estimate from an iron dose
 * (1 mg/kg/gün → about 9,35 kg) although the visit had a weight. Pure level: synthetic files
 * (lib/asistan/tests/olcumHastasi.ts) through the same olaylariKur as the live file. The route level is
 * lib/asistan/vizitOlcumSahne.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { olaylariKur, hastaKur, type HamDosya } from '@/lib/doktor/dosyaOlaylari'
import { metindenOlcumCikar } from '@/lib/clinical/olcumMetni'
import { kanitBlogu } from './kanit'
import { soruTuruBul } from './soruTuru'
import { vizitOlcumSorusuBul, vizitOlcumKaniti, vizitOlcumCevabi, vizitOlcumKanitBlogu, olcumCevabiniGuvenceyeAl } from './vizitOlcum'
import { olcumDosyasi, eriskinOlcumDosyasi, OLCUM_COCUK_ADI as AD, OLCUM_ERISKIN_ADI as ERISKIN, KILO_12AY, TARIH_12AY, TAHMIN_KILO, type OlcumVaryanti } from '../tests/olcumHastasi'

const BUGUN = '2026-01-01'
const SORU = 'bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu'

function kanit(ham: HamDosya, soru: string) {
  const s = vizitOlcumSorusuBul(soru)
  assert.ok(s, `ölçüm sorusu tanınmadı: ${soru}`)
  return vizitOlcumKaniti(s, olaylariKur(ham, BUGUN), hastaKur(ham, BUGUN))
}
const cevap = (ham: HamDosya, soru: string) => vizitOlcumCevabi(kanit(ham, soru), ham.hasta.ad).ekran
const cocuk = (v: OlcumVaryanti, soru: string) => cevap(olcumDosyasi(v), soru)

describe('vizitOlcumSorusuBul — hangi ölçüm, hangi muayene', () => {
  const VIZIT: [string, string[], string][] = [
    [SORU, ['kilo'], '12 ay'],
    ['12 aylık muayenede kilosu kaçtı', ['kilo'], '12 ay'],
    ['6 aylık kontrolde boyu kaç cm idi', ['boy'], '6 ay'],
    ['15 aylıkken kaç kiloydu', ['kilo'], '15 ay'],
    ['9 aylık sağlam çocuk izleminde baş çevresi neydi', ['basCevresi'], '9 ay'],
    ['2 yaş kontrolünde boyu ve kilosu', ['kilo', 'boy'], '2 yas'],
    ['12. ay muayenesinde ağırlığı neydi', ['kilo'], '12 ay'],
  ]
  for (const [m, olcumler, yas] of VIZIT) {
    it(`"${m}" → ${olcumler.join('+')} / ${yas}`, () => {
      const s = vizitOlcumSorusuBul(m)
      assert.ok(s)
      assert.deepEqual(s.olcumler, olcumler)
      assert.equal(s.hedef.tip, 'vizit')
      assert.equal(s.hedef.tip === 'vizit' && s.hedef.yas ? `${s.hedef.yas.sayi} ${s.hedef.yas.birim}` : '', yas)
    })
  }

  it('ilk / son muayene ve seri', () => {
    assert.equal(vizitOlcumSorusuBul('ilk muayenede kaç kiloydu')?.hedef.tip, 'ilk')
    assert.equal(vizitOlcumSorusuBul('son muayenede tansiyonu kaçtı')?.hedef.tip, 'son')
    assert.deepEqual(vizitOlcumSorusuBul('son kontrolde tansiyonu kaçtı')?.olcumler, ['tansiyon'])
    assert.equal(vizitOlcumSorusuBul('bütün muayenelerinde kilosu')?.hedef.tip, 'seri')
    assert.equal(vizitOlcumSorusuBul('kilo gelişimi')?.hedef.tip, 'seri')
    assert.equal(vizitOlcumSorusuBul('tansiyon seyri')?.hedef.tip, 'seri')
    assert.deepEqual(vizitOlcumSorusuBul('son muayenede VKİ kaçtı')?.olcumler, ['vki'])
  })

  it('değerlendirme sorusu işaretlenir (kanıt yoluna gider, kesin cevap verilmez)', () => {
    assert.equal(vizitOlcumSorusuBul('12 aylık muayenesinde kilosu normal miydi')?.degerlendirme, true)
    assert.equal(vizitOlcumSorusuBul(SORU)?.degerlendirme, false)
  })

  for (const m of [
    'kilosu kaç',                                   // tek bilgi — hızlı kart
    'büyümesi nasıl gidiyor',                       // değerlendirme, vizit / ölçüm adı yok
    '12 aylık muayenesini özetle',                  // ölçüm sorulmuyor — vizit türü özeti (PR 512)
    '12 aylık muayenede verdiğimiz demir dozu kaç mg/kg', // doz sorusu
    'kilogram başına kaç mg parasetamol verilir',
    'son 6 ayda kaç kez geldi',
    'gelişimi yaşına uygun mu',
    'bugün randevum var mı',
  ]) it(`ölçüm sorusu DEĞİL: "${m}"`, () => assert.equal(vizitOlcumSorusuBul(m), null))

  it('"son 3 aylık kilo değişimi" bir süredir — 3 aylık muayene aranmaz', () => {
    assert.equal(vizitOlcumSorusuBul('son 3 aylık kilo değişimi')?.hedef.tip, 'seri')
  })

  it('"kilo gelişimi" gelişim (GİDR) sorusu sayılmaz', () => {
    assert.equal(soruTuruBul('kilo gelişimi nasıl'), 'buyume')
    assert.equal(soruTuruBul('Gelişimi yaşına uygun mu?'), 'gelisim')
  })
})

describe('12 aylık muayenenin kilosu — kayıt nerede olursa olsun okunur', () => {
  it('(a) muayenenin kendi ölçüm alanı: değer, birim, tarih, kaynak', () => {
    const c = cocuk('a', SORU)
    assert.match(c, new RegExp(`^${AD} — 12 aylık muayene \\(${TARIH_12AY.replace(/\./g, '\\.')}\\): kilo ${KILO_12AY}\\.`))
    assert.match(c, /Kaynak: muayene notunun yaşamsal bulgu alanı/)
    assert.doesNotMatch(c, /10,6|9,1 kg|tahmin/i)
  })

  it('(b) aynı günlü ölçüm tablosu (cihaz ölçümü)', () => {
    const c = cocuk('b', SORU)
    assert.match(c, new RegExp(`\\(${TARIH_12AY.replace(/\./g, '\\.')}\\): kilo ${KILO_12AY}\\.`))
    assert.match(c, /Kaynak: aynı günlü cihaz ölçümü/)
  })

  it('(c) yalnız not metni', () => {
    const c = cocuk('c', SORU)
    assert.match(c, new RegExp(`\\(${TARIH_12AY.replace(/\./g, '\\.')}\\): kilo ${KILO_12AY}\\.`))
    assert.match(c, /Kaynak: muayene notunun metni \(Bulgu: "[^"]*Kilo 9,8 kg/)
  })

  it('(d) hiçbir yerde yok: "kayıtlı ölçüm yok" — değer uydurulmaz, doz tahmini yapılmaz', () => {
    const k = kanit(olcumDosyasi('d'), SORU)
    assert.equal(k.durum, 'olcum-yok')
    const c = vizitOlcumCevabi(k, AD).ekran
    assert.match(c, new RegExp(`12 aylık muayene \\(${TARIH_12AY.replace(/\./g, '\\.')}\\): kayıtlı kilo ölçümü yok`))
    assert.ok(!c.includes(TAHMIN_KILO), 'doz cümlesinden kilo türetilmez')
    assert.ok(!c.includes(KILO_12AY))
    // Komşu muayenelerin kayıtlı kiloları kendi tarihleriyle verilir — bu muayenenin ölçümü olarak değil.
    assert.match(c, /En yakın kayıtlı kilo: 9,1 kg \(15\.02\.2025\) ve 10,6 kg \(25\.09\.2025\)/)
  })

  it('kanıt bloğu hasta adını içermez (KVKK) ve kuralı taşır', () => {
    const a = vizitOlcumKanitBlogu(kanit(olcumDosyasi('a'), SORU))
    assert.ok(!a.includes(AD))
    assert.match(a, /KAYITLI: kilo 9,8 kg — 15\.05\.2025 — kaynak: muayene notunun yaşamsal bulgu alanı/)
    assert.match(a, /mg\/kg[^\n]*TÜRETME/)
    const d = vizitOlcumKanitBlogu(kanit(olcumDosyasi('d'), SORU))
    assert.match(d, /KAYIT YOK: bu muayene için kilo ölçümü bulunamadı/)
    assert.match(d, /"tahmin" diye etiketle/)
  })
})

describe('diğer muayeneler, diğer ölçümler', () => {
  it('"6 aylık kontrolde boyu" → o muayenenin boyu', () => {
    assert.match(cocuk('a', '6 aylık kontrolde boyu kaçtı'), /6 aylık muayene \(15\.11\.2024\): boy 67 cm\./)
  })
  it('"9 aylık" baş çevresi kayıtlı değil → kayıt yok (başka muayenenin değeri verilmez)', () => {
    const c = cocuk('a', '9 aylık muayenede baş çevresi kaçtı')
    assert.match(c, /9 aylık muayene \(15\.02\.2025\): kayıtlı baş çevresi ölçümü yok/)
  })
  it('"ilk muayenede" / "son muayenede"', () => {
    assert.match(cocuk('a', 'ilk muayenede kaç kiloydu'), /ilk muayene \(15\.11\.2024\): kilo 7,9 kg\./)
    assert.match(cocuk('a', 'son muayenede kaç kiloydu'), /son muayene \(25\.09\.2025\): kilo 10,6 kg\./)
    assert.match(cocuk('a', 'son muayenede ateşi kaçtı'), /son muayene \(25\.09\.2025\): ateş 38,4 °C\./)
  })
  it('"15 aylıkken" → o yaşta muayene yok: açık cevap, SESSİZCE başka muayeneye düşmez', () => {
    const k = kanit(olcumDosyasi('a'), '15 aylıkken kaç kiloydu')
    assert.equal(k.durum, 'vizit-yok')
    const c = vizitOlcumCevabi(k, AD).ekran
    assert.match(c, /dosyada 15 aylık muayene kaydı bulamadım/)
    assert.doesNotMatch(c, /\d,\d kg/)
  })
  it('notta yaş yazmıyorsa muayene tarihindeki yaşa göre seçilir ve bu söylenir', () => {
    const ham = olcumDosyasi('a')
    const v = ham.vizitler.find((x) => x.id === 'v-12ay')!
    v.subjektif = 'Rutin sağlam çocuk izlemi. Yürümeye başlamış.'
    v.tani = 'Sağlam çocuk izlemi'
    const c = cevap(ham, SORU)
    assert.match(c, /12 aylık muayene \(15\.05\.2025\): kilo 9,8 kg\./)
    assert.match(c, /muayene tarihindeki yaşa göre seçildi/)
  })
  it('alan ile not metni çelişirse ikisi de söylenir', () => {
    const ham = olcumDosyasi('a')
    ham.vizitler.find((x) => x.id === 'v-12ay')!.objektif = 'Genel durum iyi. Kilo 9,6 kg.'
    const c = cevap(ham, SORU)
    assert.match(c, /kilo 9,8 kg/)
    assert.match(c, /Çelişen kayıt: not metninde kilo 9,6 kg/)
  })
})

describe('seri — tarih ve değer, eskiden yeniye', () => {
  for (const soru of ['bütün muayenelerinde kilosu', 'kilo gelişimi']) {
    it(`"${soru}"`, () => {
      const k = kanit(olcumDosyasi('c'), soru)
      const satirlar = vizitOlcumCevabi(k, AD).ekran.split('\n').filter((x) => /^\| \d{2}\./.test(x)).map((x) => x.split('|').slice(1, 3).map((h) => h.trim()))
      assert.deepEqual(satirlar, [['15.11.2024', '7,9 kg'], ['15.02.2025', '9,1 kg'], ['15.05.2025', '9,8 kg'], ['25.09.2025', '10,6 kg']])
    })
  }
  it('(d) ölçümü olmayan muayene seride "kayıt yok" yazar; değer uydurulmaz', () => {
    const e = cocuk('d', 'bütün muayenelerinde kilosu')
    assert.match(e, /\| 15\.05\.2025 \| kayıt yok \|/)
    assert.ok(!e.includes(TAHMIN_KILO))
  })
})

describe('not metninden ölçüm (yalnız etiketli değer)', () => {
  const bul = (m: string) => metindenOlcumCikar(m).map((o) => `${o.olcum}=${o.metin}`)
  it('etiketli değerler ve birimler', () => {
    assert.deepEqual(bul('Kilo 9,8 kg, boy 75 cm, baş çevresi 46 cm.'), ['kilo=9,8 kg', 'boy=75 cm', 'basCevresi=46 cm'])
    assert.deepEqual(bul('Ağırlık: 9800 g. Boy: 0,75 m'), ['kilo=9,8 kg', 'boy=75 cm'])
    assert.deepEqual(bul('TA 142/88 mmHg, nabız 76/dk. Kilo 82 kg. SpO2 %97, ateş 36,8'), ['kilo=82 kg', 'tansiyon=142/88 mmHg', 'ates=36,8 °C', 'nabiz=76/dk', 'spo2=%97'])
  })
  it('doz, kilo değişimi ve boyun bir ölçüm değildir', () => {
    assert.deepEqual(bul('Parasetamol 15 mg/kg/doz. Demir 1 mg/kg/gün (günde 9,35 mg).'), [])
    assert.deepEqual(bul('Kilo başına 10 mg. Son ayda 1 kg almış. Kilo alımı yeterli.'), [])
    assert.deepEqual(bul('Boyun hareketleri serbest, boyunda 2 cm lenf nodu.'), [])
    assert.deepEqual(bul('Ateş 3 gündür sürüyor.'), [])
  })
})

describe('kanıt bloğu (kanitBlogu) — değerlendirme ve özet sorularında o muayenenin ölçümü', () => {
  const blok = (v: OlcumVaryanti, tur: 'buyume' | 'ozet', mesaj: string) => {
    const ham = olcumDosyasi(v)
    return kanitBlogu(tur, olaylariKur(ham, BUGUN), hastaKur(ham, BUGUN), { mesaj })
  }
  it('"12 aylık muayenesinde kilosu normal miydi" → büyüme kanıtının başında o muayenenin kilosu', () => {
    const b = blok('a', 'buyume', '12 aylık muayenesinde kilosu normal miydi')
    assert.match(b, /KAYITLI: kilo 9,8 kg — 15\.05\.2025/)
    assert.ok(b.indexOf('KAYITLI: kilo 9,8 kg') < b.indexOf('Referans:'))
  })
  it('"12 aylık muayenesini özetle" → eşleşen muayenenin ölçümleri de satırda', () => {
    const b = blok('a', 'ozet', '12 aylık sağlam çocuk muayenesini özetler misin?')
    assert.match(b, /12 aylık sağlam çocuk izlemi/)
    assert.match(b, /Ölçümler: kilo 9,8 kg; boy 75 cm; baş çevresi 46 cm/)
  })
  it('vizit adı geçmeyen büyüme sorusu değişmedi', () => {
    assert.doesNotMatch(blok('a', 'buyume', 'Büyümesi nasıl gidiyor?'), /VİZİT ÖLÇÜMÜ/)
  })
})

describe('olcumCevabiniGuvenceyeAl — modelin cevabı kayıtla tutmalı', () => {
  const CANLI = 'Hocam, 12 aylık muayenede kilo doğrudan yazılmamış. Demir dozu 1 mg/kg/gün ve günde 9,35 mg olduğuna göre yaklaşık 9,35 kg olmalı.'
  it('kayıt varken tahmin eden cevap, kayıttaki cevapla değiştirilir', () => {
    const k = kanit(olcumDosyasi('a'), SORU)
    const c = olcumCevabiniGuvenceyeAl(CANLI, k)
    assert.match(c, /kilo 9,8 kg/)
    assert.match(c, /15\.05\.2025/)
    assert.ok(!c.includes(TAHMIN_KILO))
  })
  it('kaydı doğru söyleyen cevap aynen kalır (9.8 / 9,8)', () => {
    const k = kanit(olcumDosyasi('a'), SORU)
    for (const iyi of ['Hocam, 12 aylık muayenede (15.05.2025) kilosu 9,8 kg olarak kayıtlı.', 'Kilo 9.8 kg (15.05.2025, yaşamsal bulgu alanı).']) {
      assert.equal(olcumCevabiniGuvenceyeAl(iyi, k), iyi)
    }
  })
  it('ölçüme dayanan BAŞKA soru: modelin cevabı silinmez, kayıt cümlesi önüne konur', () => {
    const baska = '12 aylık muayenede kilosuna göre hangi mama önerilmişti'
    assert.equal(vizitOlcumSorusuBul(baska)?.kesin, false)
    assert.equal(vizitOlcumSorusuBul(SORU)?.kesin, true)
    const c = olcumCevabiniGuvenceyeAl('Hocam, devam sütü önerilmişti.', kanit(olcumDosyasi('a'), baska))
    assert.match(c, /^Kayıt — 12 aylık muayene \(15\.05\.2025\): kilo 9,8 kg\./)
    assert.match(c, /devam sütü önerilmişti/)
  })
  it('(d) kayıt yokken etiketsiz tahmin kayıt gibi sunulamaz; "tahmin" etiketli cevap kalır', () => {
    const k = kanit(olcumDosyasi('d'), SORU)
    const c = olcumCevabiniGuvenceyeAl('Hocam o muayenede kilosu 9,35 kg idi.', k)
    assert.match(c, /kayıtlı kilo ölçümü yok/)
    assert.ok(!c.includes(TAHMIN_KILO))
    const etiketli = 'Hocam, 12 aylık muayenede kayıtlı kilo ölçümü yok. Tahmin: demir dozundan yaklaşık 9,35 kg — bu kayıtlı bir ölçüm değildir.'
    assert.equal(olcumCevabiniGuvenceyeAl(etiketli, k), etiketli)
  })
})

describe('erişkin — aynı sorgu, pediatrik varsayım yok (kilo, boy, VKİ, tansiyon)', () => {
  const PEDIATRIK = /baş çevresi|persentil|sağlam çocuk|veli|Neyzi/i
  const eriskin = (soru: string, brans = 'Kardiyoloji') => cevap(eriskinOlcumDosyasi(brans), soru)

  it('ilk / son muayenede kilo, boy, tansiyon', () => {
    assert.match(eriskin('ilk muayenede kaç kiloydu'), new RegExp(`^${ERISKIN} — ilk muayene \\(03\\.11\\.2025\\): kilo 84 kg\\.`))
    assert.match(eriskin('son muayenede boyu ve kilosu'), /son muayene \(15\.06\.2026\): kilo 79,5 kg; boy 162 cm\. Kaynak: muayene notunun yaşamsal bulgu alanı/)
    assert.match(eriskin('son kontrolde tansiyonu kaçtı'), /son muayene \(15\.06\.2026\): tansiyon 128\/82 mmHg\./)
  })
  it('VKİ: aynı muayenenin kayıtlı kilo ve boyundan hesaplanır, hesap olduğu yazılır; boy yoksa kayıt yok', () => {
    const c = eriskin('son muayenede VKİ kaçtı')
    assert.match(c, /VKİ 30,3 kg\/m²\. Kaynak: hesaplanan değer/)
    const ham = eriskinOlcumDosyasi()
    ham.vizitler[2].vitaller = { kilo: '79,5' }
    assert.match(cevap(ham, 'son muayenede VKİ kaçtı'), /kayıtlı VKİ ölçümü yok/)
  })
  it('seri: tansiyon ve kilo tarih sırasıyla, not metnindeki değer kaynağıyla', () => {
    const e = eriskin('bütün muayenelerinde kilosu ve tansiyonu', 'Diyetisyen')
    assert.match(e, /\| 03\.11\.2025 \| 84 kg \| 158\/96 mmHg \| muayene alanı \|/)
    assert.match(e, /\| 10\.02\.2026 \| 82 kg \| 142\/88 mmHg \| not metni \|/)
    assert.match(e, /\| 15\.06\.2026 \| 79,5 kg \| 128\/82 mmHg \| muayene alanı \|/)
    assert.doesNotMatch(e, PEDIATRIK)
  })
  it('cihaz tansiyonu 135/85 bütün olarak okunur (eskiden 135 sayısına iniyordu)', () => {
    const ham = eriskinOlcumDosyasi()
    ham.vizitler[2].vitaller = null
    ham.cihaz = [{ id: 'c-ta', tur: 'tansiyon', deger: '135/85', birim: 'mmHg', alindi: '2026-06-15T09:30:00Z' }]
    assert.match(cevap(ham, 'son muayenede tansiyonu kaçtı'), /tansiyon 135\/85 mmHg\. Kaynak: aynı günlü cihaz ölçümü/)
  })
  it('erişkinde baş çevresi sorulursa: kayıt yok — değer ya da pediatrik yorum üretilmez', () => {
    const c = eriskin('ilk muayenede baş çevresi kaçtı')
    assert.match(c, /kayıtlı baş çevresi ölçümü yok/)
    assert.doesNotMatch(c, /\d+ cm/)
  })
  it('kanıt bloğu (TEMEL parametre): o muayenenin tansiyonu başta, kanıtta pediatrik ölçüm yok', () => {
    const ham = eriskinOlcumDosyasi()
    const blok = kanitBlogu('buyume', olaylariKur(ham, BUGUN), hastaKur(ham, BUGUN), { mesaj: 'ilk muayenede tansiyonu nasıldı' }).split('[CEVAP ŞABLONU')[0]
    assert.match(blok, /KAYITLI: tansiyon 158\/96 mmHg — 03\.11\.2025/)
    assert.match(blok, /parametre seti: Temel/)
    assert.doesNotMatch(blok, PEDIATRIK)
  })
})
