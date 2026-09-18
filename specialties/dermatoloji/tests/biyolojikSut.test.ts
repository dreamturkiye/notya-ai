import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DOZ_KILIDI_METNI,
  biyolojikSutMetni,
  biyolojikSutTaslak,
  type BiyolojikSutGirdi,
} from '../engines/biyolojikSutRapor'

// DERM-EXCEPTIONAL-01 · madde 4 — biyolojik / sistemik SUT rapor taslağı (göz sgkRapor.ts kalitesi):
// zorunlu maddeler, eksikler, hekim kilidi. Doz uydurulmaz, SUT madde numarası uydurulmaz,
// Medula'ya canlı gönderim yok.

const tam = (o: Partial<BiyolojikSutGirdi> = {}): BiyolojikSutGirdi => ({
  sablon: 'baslangic',
  hasta: { adSoyad: 'Sentetik Test' },
  endikasyon: 'psoriasis',
  etkenMadde: 'anti-IL-17 sınıfı (hekim seçer)',
  anamnez: '6 yıldır plak psoriasis, gövde ve ekstremite tutulumu',
  pasiBaslangic: 16.2,
  pasiSimdi: 16.2,
  dlqiBaslangic: 18,
  dlqiSimdi: 18,
  bsaPct: 22,
  tbTarama: true,
  tbTaramaTarihi: '2026-02-20',
  akcigerGrafisi: 'normal',
  hbvTarama: true,
  hcvTarama: true,
  gebelikDurumu: 'yok',
  canliAsiBilgilendirme: true,
  basamaklar: [
    { basamak: 'topikal', sonuc: 'yanitsiz' },
    { basamak: 'fototerapi', sonuc: 'yanitsiz' },
    { basamak: 'konvansiyonel_sistemik', sonuc: 'intolerans', not: 'karaciğer enzim yüksekliği' },
  ],
  fotoBaslangic: '2026-02-01',
  bugun: '2026-03-02',
  ...o,
})

describe('biyolojik SUT taslağı — zorunlu maddeler ve eksikler', () => {
  it('tüm zorunlu maddeler tamamsa eksik yok ve hekim kilitleyebilir', () => {
    const s = biyolojikSutTaslak(tam())
    assert.deepEqual(s.eksikler, [])
    assert.equal(s.kilitlenebilir, true)
    assert.equal(s.sutKontrol.filter((k) => k.tamam === false).length, 0)
  })

  it('boş girdide skor, basamak, tarama ve foto eksikleri tek tek listelenir ve kilit açılmaz', () => {
    const s = biyolojikSutTaslak({ sablon: 'baslangic', hasta: { adSoyad: '' }, endikasyon: null, basamaklar: [], bugun: '2026-03-02' })
    assert.equal(s.kilitlenebilir, false)
    for (const beklenen of [/Endikasyon/, /anamnez/i, /DLQI/, /Tüberküloz/, /HBV/, /Önceki basamak/, /fotoğraf/]) {
      assert.ok(s.eksikler.some((e) => beklenen.test(e)), `eksik yok: ${beklenen}`)
    }
  })

  it('endikasyon psoriasis seçilip skor girilmezse PASI ve yüzey alanı eksikleri çıkar', () => {
    const s = biyolojikSutTaslak(tam({ pasiBaslangic: null, pasiSimdi: null, bsaPct: null }))
    assert.ok(s.eksikler.some((e) => /PASI/.test(e)))
    assert.ok(s.eksikler.some((e) => /yüzey alanı/.test(e)))
    assert.equal(s.kilitlenebilir, false)
  })

  it('basamak beyanı yalnız "devam" ise basamak koşulu sağlanmaz', () => {
    const s = biyolojikSutTaslak(tam({ basamaklar: [{ basamak: 'topikal', sonuc: 'devam' }] }))
    assert.equal(s.kilitlenebilir, false)
    assert.ok(s.eksikler.some((e) => /Önceki basamak/.test(e)))
  })

  it('tarama eksikse (TB / akciğer grafisi / HBV / HCV) kilit açılmaz', () => {
    const s = biyolojikSutTaslak(tam({ tbTarama: false, hbvTarama: false }))
    assert.equal(s.kilitlenebilir, false)
    assert.ok(s.sutKontrol.some((k) => /TB .*HBV\/HCV/.test(k.madde) && k.tamam === false))
  })

  it('idame şablonu başlangıç-güncel skor çifti ve hekimin yanıt beyanını ister', () => {
    const eksikIdame = biyolojikSutTaslak(tam({ sablon: 'idame', pasiSimdi: 3.2, hekimYanitVarBeyani: false, fotoHafta12: null }))
    assert.equal(eksikIdame.kilitlenebilir, false)
    assert.ok(eksikIdame.eksikler.some((e) => /yanıt beyanı/.test(e)))
    assert.ok(eksikIdame.eksikler.some((e) => /12\. hafta/.test(e)))

    const tamIdame = biyolojikSutTaslak(tam({ sablon: 'idame', pasiSimdi: 3.2, hekimYanitVarBeyani: true, fotoHafta12: '2026-05-01' }))
    assert.deepEqual(tamIdame.eksikler, [])
    assert.match(tamIdame.draft.mevcutDurum || '', /PASI 16\.2 → 3\.2/)
  })

  it('gebelik / laktasyon beyanı ve canlı aşı bilgilendirmesi zorunlu maddedir', () => {
    const s = biyolojikSutTaslak(tam({ gebelikDurumu: 'bilinmiyor', canliAsiBilgilendirme: false }))
    assert.ok(s.eksikler.some((e) => /Gebelik/.test(e)))
    assert.ok(s.eksikler.some((e) => /Canlı virüs aşısı/.test(e)))
  })
})

describe('biyolojik SUT taslağı — kilitler', () => {
  it('doz, uygulama sıklığı ve yükleme şeması taslakta yok', () => {
    const s = biyolojikSutTaslak(tam({ etkenMadde: 'sekukinumab' }))
    const metin = biyolojikSutMetni(s)
    assert.doesNotMatch(metin, /\d+\s*(mg|mL|ml|IU)\b/)
    assert.doesNotMatch(metin, /haftada bir|iki haftada bir|yükleme dozu/i)
    assert.match(metin, /doz hekim yazar|doz ve süre hekim/i)
    assert.equal(s.dozKilidi, DOZ_KILIDI_METNI)
  })

  it('SUT madde numarası uydurulmaz — teyit hekim / idarededir', () => {
    const metin = biyolojikSutMetni(biyolojikSutTaslak(tam()))
    assert.doesNotMatch(metin, /madde\s*\d+\.\d+/i)
    assert.match(metin, /hekim \/ idare teyit eder|teyidiyle/i)
  })

  it('Medula canlı gönderim yok — giriş ve e-imza hekimde', () => {
    const s = biyolojikSutTaslak(tam())
    assert.ok(s.sutKontrol.some((k) => /Medula girişi ve e-imza hekim/.test(k.madde) && k.tamam === null))
  })

  it('kaynaklar rol olarak anılır (PSOKİD 2025 + SUT 2026), kitap metni kopyalanmaz', () => {
    const s = biyolojikSutTaslak(tam())
    const refler = new Set(s.dipnotlar.map((d) => d.ref))
    assert.ok(refler.has('PSOKID_2025'))
    assert.ok(refler.has('SUT_2026'))
    for (const d of s.dipnotlar) assert.ok((d.not || '').length < 200)
  })

  it('eklem tutulumunda romatoloji sevki hekime bırakılır (Notya romatolojik değerlendirme yapmaz)', () => {
    const s = biyolojikSutTaslak(tam({ psaTutulumu: true }))
    assert.match(s.draft.mevcutDurum || '', /romatoloji/i)
    assert.match(s.draft.mevcutDurum || '', /Notya romatoloji değerlendirmesi yapmaz/)
  })
})
