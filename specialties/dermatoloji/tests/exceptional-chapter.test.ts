import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  HEKIM_KILIT_NOTU,
  akneKarar,
  atopiMerdiveni,
  psaTriyaj,
  psoriasisMerdiveni,
} from '../engines/tedaviMerdivenleri'
import {
  BODY_BOLGELERI,
  bolgeKoduTahmin,
  ekOnamGerekliBolge,
  nodeToggle,
  pasiBolgeDagilimi,
  yuzBolgeleri,
} from '../engines/body-map'
import {
  AVRUPA_BAZ_SERISI,
  GEC_OKUMA_IPUCU_ALERJENLERI,
  ICDRG_DERECELERI,
  gruplanmisAlerjenler,
  kurTakvimi,
  okumaFotoTuru,
  seriAlerjenleri,
  yeniKurIpucu,
  type PatchCourseKaydi,
} from '../engines/patch-calendar'
import { cashSkor, ucNoktaSkor, yediNoktaSkor, fitzpatrickGerekli } from '../imaging/dermoscopy'
import { form014Taslagi, onamYazdirmaTaslagi, spesimenEtiketi, taslakMetni, yazdirmaHrefGuvenliMi } from '../engines/yazdirma'
import { kozmetikKontrol } from '../protocols/aesthetics-legal'
import { behcetTakip, bullozTakip, sacTirnakTakip } from '../engines/takipKartlari'
import { DERIM_HATIRLATMA_METNI, derimHatirlatmaOnerileri, hastaGuvenliMi } from '../engines/derimHatirlatma'

// DERM-EXCEPTIONAL-01 — bölüm derinliği: tedavi merdivenleri, vücut haritası, yama v2, dermoskopi
// çalışma sayfaları, yazdırılabilir onam / Form 014, kozmetik izlenebilirlik, izlem kartları,
// hekim tetiklemeli portal hatırlatmaları. Ortak kural: karar hekimin, doz yazılmaz.

describe('tedavi merdivenleri — hekim kilitler', () => {
  it('psoriasis: skor yoksa basamak önerilmez', () => {
    const k = psoriasisMerdiveni({})
    assert.equal(k.onerilenBasamakId, null)
    assert.ok(k.gerekce.some((g) => /girilmeden basamak önerilmez/.test(g)))
    assert.equal(k.hekimKilitler, true)
    assert.equal(k.kilitNotu, HEKIM_KILIT_NOTU)
  })

  it('psoriasis: onluk kuralı üstü + konvansiyonel yanıtsız → biyolojik basamağı', () => {
    const k = psoriasisMerdiveni({ pasi: 16, bsaPct: 20, dlqi: 18, konvansiyonelYanitsiz: true })
    assert.equal(k.onerilenBasamakId, 'biyolojik')
    assert.deepEqual(k.eksikler, [])
  })

  it('psoriasis: eşik altı hafif tabloda topikal basamak, eksikler ayrıca listelenir', () => {
    const k = psoriasisMerdiveni({ pasi: 3, bsaPct: 4, dlqi: 2 })
    assert.equal(k.onerilenBasamakId, 'topikal')
    const eksik = psoriasisMerdiveni({ pasi: 3 })
    assert.ok(eksik.eksikler.some((e) => /DLQI/.test(e)))
  })

  it('PsA triyajı: iki bulgu veya daktilit sevk önerir, tanı koymaz', () => {
    assert.equal(psaTriyaj({}).sevkOnerilir, false)
    assert.equal(psaTriyaj({ daktilit: true }).sevkOnerilir, true)
    const iki = psaTriyaj({ sabah_tutuklugu: true, tirnak: true })
    assert.equal(iki.sayi, 2)
    assert.equal(iki.sevkOnerilir, true)
    assert.match(iki.hint, /romatoloji/i)
    assert.doesNotMatch(iki.hint, /psoriatik artrit tanısı/i)
  })

  it('atopi: SCORAD şiddetli + topikal yanıtsız → sistemik; pediatrik hasta ped UI açmaz, yalnız metin', () => {
    const k = atopiMerdiveni({ scorad: 62, topikalYanitsiz: true, pediatrik: true })
    assert.equal(k.onerilenBasamakId, 'sistemik')
    assert.ok(k.gerekce.some((g) => /Çocuk hasta/.test(g)))
    assert.doesNotMatch(k.gerekce.join(' '), /persentil|Neyzi|veli/i)
  })

  it('atopi: skor yoksa temel bakım, eksik bildirilir', () => {
    const k = atopiMerdiveni({})
    assert.equal(k.onerilenBasamakId, 'temel')
    assert.ok(k.eksikler.some((e) => /SCORAD veya EASI/.test(e)))
  })

  it('akne: izotretinoin kürü aktifse ay-0 / ay-3 foto serisi ipucu çıkar, doz yazmaz', () => {
    const k = akneKarar({ iga: 4, izotretinoinKuru: true, fotoAy0: false })
    assert.equal(k.siddet, 'siddetli')
    assert.ok(k.fotoCue.some((c) => /Ay-0/.test(c)))
    assert.ok(k.fotoCue.some((c) => /Ay-3/.test(c)))
    assert.doesNotMatch([...k.gerekce, ...k.fotoCue].join(' '), /\d+\s*mg/i)
  })
})

describe('vücut haritası — tıklanabilir bölgeler nodeIds\'te kalır', () => {
  it('ön ve arka yüz bölgeleri tanımlı ve PASI bölgesine eşlenmiş', () => {
    assert.ok(yuzBolgeleri('on').length >= 6)
    assert.ok(yuzBolgeleri('arka').length >= 5)
    for (const b of BODY_BOLGELERI) assert.ok(['head', 'upper', 'trunk', 'lower'].includes(b.pasi))
  })

  it('bölge seçimi nodeIds listesine ekler / çıkarır (model değişmez)', () => {
    const bir = nodeToggle([], 'on-gogus')
    assert.deepEqual(bir, ['on-gogus'])
    assert.deepEqual(nodeToggle(bir, 'on-gogus'), [])
  })

  it('seçili bölgelerden PASI bölge dağılımı çıkar', () => {
    const d = pasiBolgeDagilimi(['on-yuz', 'on-gogus', 'on-sag-bacak', 'bilinmeyen-kod'])
    assert.equal(d.head, 1)
    assert.equal(d.trunk, 1)
    assert.equal(d.lower, 1)
    assert.equal(d.upper, 0)
  })

  it('kasık / genital bölge ek onam ister', () => {
    assert.equal(ekOnamGerekliBolge('on-kasik'), true)
    assert.equal(ekOnamGerekliBolge('on-gogus'), false)
  })

  it('lezyon bölge metninden harita kodu tahmin edilir (boşsa null)', () => {
    assert.equal(bolgeKoduTahmin(null), null)
    assert.equal(bolgeKoduTahmin('Sağ dirsek'), 'arka-sag-dirsek')
  })
})

describe('yama v2 — Avrupa baz serisi, ICDRG, çok kür', () => {
  it('Avrupa baz serisi gerçek bir panel büyüklüğünde ve gruplanmış', () => {
    assert.ok(AVRUPA_BAZ_SERISI.length >= 25, `${AVRUPA_BAZ_SERISI.length} alerjen`)
    const gruplar = gruplanmisAlerjenler('european_baseline')
    assert.ok(gruplar.length >= 5)
    assert.equal(gruplar.reduce((s, g) => s + g.alerjenler.length, 0), AVRUPA_BAZ_SERISI.length)
    // konsantrasyon / vehikül yazılmaz — test maddesi kararı hekimin
    for (const a of AVRUPA_BAZ_SERISI) assert.doesNotMatch(a.ad, /%\s*\d|pet\.|aq\./i)
  })

  it('ek seriler baz seriden ayrı, hekim serisi boş başlar', () => {
    assert.ok(seriAlerjenleri('ek_kozmetik').length > 0)
    assert.deepEqual(seriAlerjenleri('ek_hekim'), [])
  })

  it('ICDRG dereceleri okuma için tanımlı ve foto türü güne göre seçilir', () => {
    assert.ok(ICDRG_DERECELERI.length >= 5)
    assert.equal(okumaFotoTuru(2), 'yama_d2')
    assert.equal(okumaFotoTuru(4), 'yama_d4')
    assert.ok(GEC_OKUMA_IPUCU_ALERJENLERI.length > 0)
  })

  it('çok kürlü takvim kürleri tarihe göre sıralar ve açık kürü işaretler', () => {
    const kurlar: PatchCourseKaydi[] = [
      { series: 'european_baseline', appliedAt: '2025-06-02', readD2: '2025-06-04', readD4: '2025-06-06', photoIds: [], positives: ['nikel'] },
      { series: 'european_baseline', appliedAt: '2026-03-02', readD2: null, readD4: null, photoIds: [], positives: [] },
    ]
    const t = kurTakvimi(kurlar, '2026-03-04')
    assert.equal(t.length, 2)
    assert.equal(t[0].appliedAt, '2026-03-02')
    assert.equal(t[0].aktif, true)
    assert.equal(t[1].aktif, false)
    assert.equal(t[1].pozitifSayisi, 1)
    assert.equal(t[0].d2, '2026-03-04')
  })

  it('okuması bitmemiş kür varken yeni kür ipucu uyarır; tamamlanmışsa sessizdir', () => {
    const acik: PatchCourseKaydi[] = [{ series: 'european_baseline', appliedAt: '2026-03-02', readD2: null, readD4: null, photoIds: [], positives: [] }]
    assert.match(String(yeniKurIpucu(acik, '2026-03-03')), /Açık kür var/)
    const bitmis: PatchCourseKaydi[] = [{ series: 'european_baseline', appliedAt: '2026-03-02', readD2: '2026-03-04', readD4: '2026-03-06', photoIds: [], positives: [] }]
    assert.equal(yeniKurIpucu(bitmis, '2026-03-20'), null)
  })
})

describe('dermoskopi çalışma sayfaları', () => {
  it('3 nokta: 2 ve üzeri ölçüt eşik üstü, öneri tanı değil', () => {
    const az = ucNoktaSkor({ asimetri: true })
    assert.equal(az.esikUstu, false)
    const cok = ucNoktaSkor({ asimetri: true, atipik_ag: true })
    assert.equal(cok.toplam, 2)
    assert.equal(cok.esikUstu, true)
    assert.match(cok.esikMetni, /kararı hekimin/)
    assert.doesNotMatch(cok.esikMetni, /melanomdur|tanı(sı)? melanom/i)
    assert.equal(cok.hekimKarari, true)
  })

  it('7 nokta majör ölçütleri 2, minörleri 1 puan; 3 ve üzeri eşik üstü', () => {
    const s = yediNoktaSkor({ atipik_ag: true, mavi_beyaz_pece: true })
    assert.equal(s.toplam, 4)
    assert.equal(s.esikUstu, true)
    assert.equal(yediNoktaSkor({ regresyon: true }).toplam, 1)
    assert.equal(yediNoktaSkor({ regresyon: true }).esikUstu, false)
  })

  it('CASH bileşenleri toplanır, 8 ve üzeri eşik üstü', () => {
    assert.equal(cashSkor({}).toplam, 0)
    const s = cashSkor({ color: 3, architecture: 2, symmetry: 2, homogeneity: 2 })
    assert.equal(s.toplam, 9)
    assert.equal(s.esikUstu, true)
  })

  it('Fitzpatrick dermoskopi / fototerapi / lazer bağlamında istenir', () => {
    assert.equal(fitzpatrickGerekli('fototerapi'), true)
    assert.equal(fitzpatrickGerekli('lazer'), true)
    assert.equal(fitzpatrickGerekli('genel'), false)
  })
})

describe('işlem odası yazdırma — PHI URL\'ye yazılmaz', () => {
  it('yazdırma href kontrolü hasta kimliği taşıyan sorguyu reddeder', () => {
    assert.equal(yazdirmaHrefGuvenliMi('/print/onam?tur=biyopsi'), true)
    assert.equal(yazdirmaHrefGuvenliMi('/print/onam?hastaAdi=Ayse%20Y'), false)
    assert.equal(yazdirmaHrefGuvenliMi('/print/onam?tc=12345678901'), false)
  })

  it('bilinmeyen onam kodu taslak üretmez; onam taslağı hasta adı boşken satırı boş bırakır', () => {
    assert.equal(onamYazdirmaTaslagi({ onamKodu: 'uydurma-onam', tarih: '2026-03-02' }), null)
    const t = onamYazdirmaTaslagi({ onamKodu: 'derm_biyopsi', tarih: '2026-03-02', islem: 'punch' })
    assert.ok(t)
    const metin = taslakMetni(t!)
    assert.match(metin, /Hasta: …/)
    assert.doesNotMatch(metin, /Form\s*\d{3}\b/)
    assert.match(metin, /Notya onam formunu hekim adına onaylamaz/)
  })

  it('numune etiketi tam ad / T.C. taşımaz, fiksatif ve kap sayısı ister', () => {
    const e = spesimenEtiketi({ hastaBasHarfleri: 'A.Y.', islem: 'punch', bolge: 'sırt', tarih: '2026-03-02', fiksatif: '%10 formalin', kapSayisi: 2, protokolNo: 'P-1' })
    assert.deepEqual(e.eksikler, [])
    assert.match(e.satirlar.join(' '), /formalin/)
    assert.match(e.uyari, /tam adı ve T\.C\./)
    const eksik = spesimenEtiketi({ hastaBasHarfleri: '', bolge: '', tarih: '2026-03-02' })
    assert.ok(eksik.eksikler.length >= 3)
  })

  it('Form 014 taslağı bildirim taslağıdır — Notya elektronik bildirim göndermez', () => {
    const f = form014Taslagi({ kind: 'sifiliz', tarih: '2026-03-02', klinikTani: true, laboratuvarTani: false })
    assert.match(f.taslak.baslik, /Bildirim/i)
    assert.ok(f.eksikler.length > 0, 'kimlik eksikleri listelenmeli')
    assert.match(f.agNotu, /göndermez/)
    assert.match(f.agNotu, /hekim tarafından kurumun resmî sistemi/)
  })
})

describe('kozmetik izlenebilirlik — lot ve komplikasyon', () => {
  it('lot zorunlu işlemde lot yoksa eksik verir', () => {
    const k = kozmetikKontrol({ tur: 'botoks', tarih: '2026-03-02', bolge: 'glabella', urun: 'X', lotNo: null, testSpot: false })
    assert.ok(k.eksikler.some((e) => /lot/i.test(e)))
    const tam = kozmetikKontrol({ tur: 'botoks', tarih: '2026-03-02', bolge: 'glabella', urun: 'X', lotNo: 'A1234', sonKullanma: '2027-01-01', testSpot: false, onamKodu: 'derm-botoks' })
    assert.ok(!tam.eksikler.some((e) => /lot/i.test(e)))
  })

  it('doz / ünite alanı yok — kontrol metinleri doz istemez', () => {
    const k = kozmetikKontrol({ tur: 'dolgu', tarih: '2026-03-02', bolge: 'nazolabial', urun: null, lotNo: null, testSpot: false })
    assert.doesNotMatch([...k.eksikler, ...k.uyarilar].join(' '), /\bünite\b|\d+\s*(mg|mL|ml|U)\b/)
  })
})

describe('izlem kartları', () => {
  it('Behçet kartı göz tutulumunu ivedi sayar ve göz muayenesi tarihini eksik olarak ister', () => {
    const k = behcetTakip({ kart: null, ek: { goz: true }, oralUlserSayisi: 3, sonGozMuayenesi: null, bugun: '2026-03-02' })
    assert.ok(k.bulgular.length > 0)
    assert.ok(k.eksikler.some((e) => /Göz muayenesi tarihi/.test(e)))
    assert.equal(k.aciliyet, 'ivedi')
    assert.ok(k.sonrakiAdim.some((s) => /tanı hekim değerlendirmesiyle konur/.test(s)))
  })

  it('büllöz kartta DIF olmadan tanı kilitlenmez ve yaygın tutulum acil sayılır', () => {
    const k = bullozTakip({ workup: null, bsaPct: 30, mukoza: { oral: true }, labIzlem: false, eslikEdenIzlem: false })
    assert.ok(k.eksikler.some((e) => /DIF/.test(e)))
    assert.equal(k.aciliyet, 'acil')
    assert.ok(k.sonrakiAdim.some((s) => /yatış ihtiyacı hekim/.test(s)))
  })

  it('saç kartı SALT toplamını bölgelerden hesaplar ve trikoskopi alanı ister', () => {
    const k = sacTirnakTakip({ salt: { vertex: 50, sag: 0, sol: 0, oksiput: 0 }, trikoskopi: {}, tirnak: {} })
    assert.equal(k.saltToplam, 20)
    assert.ok(k.saltBant)
  })
})

describe('Derim hatırlatmaları — hekim tetikler, metin hasta-güvenli', () => {
  it('sabit metinlerin hiçbiri tanı, skor veya doz dili taşımaz', () => {
    for (const metin of Object.values(DERIM_HATIRLATMA_METNI)) {
      assert.equal(hastaGuvenliMi(metin), true, metin)
      assert.doesNotMatch(metin, /PASI|EASI|DLQI|J\/cm|mg|sedef|melanom/i)
    }
  })

  it('öneriler yalnız hekimin girdiği tarihlerden üretilir; boş girdi öneri üretmez', () => {
    assert.deepEqual(derimHatirlatmaOnerileri({ bugun: '2026-03-02', lastTbseIso: '2026-01-01' }), [])
    const o = derimHatirlatmaOnerileri({ bugun: '2026-03-02', fototerapiSonrakiIso: '2026-03-05', lastTbseIso: '2026-01-01' })
    assert.equal(o.length, 1)
    assert.equal(o[0].due, '2026-03-05')
    assert.ok(hastaGuvenliMi(o[0].ad))
  })

  it('yasak desen taşıyan metin hasta-güvenli sayılmaz (kilit çalışıyor)', () => {
    assert.equal(hastaGuvenliMi('PASI skorunuz düştü'), false)
    assert.equal(hastaGuvenliMi('Kontrol randevunuz'), true)
  })
})
