/**
 * NOTYA-ILK10-* — Dr. Gökhan's "İlk 10" standard, end to end on a synthetic chart.
 *
 * Real handlers over the in-memory scene: the patient-file panel (/api/doktor/konsult — the surface of the
 * real-patient run of 2026-10-02), Ayşe chat (/api/asistan/chat), Ayşe voice (/api/asistan/fish-tur) and the drug
 * list (/api/doktor/ilaclar). The model is a stand-in, so what is asserted is what the SERVER guarantees: the
 * deterministic evidence each question needs reaches the model on every surface, no identity value does, and
 * another doctor reaches nothing.
 *
 * Chart: lib/asistan/tests/gokhanKorpusHastalari.ts ilk10HastasiEkle() — no real person, no production row.
 */
import { ortam, sahneHazirla, sahneKur, oturumAc, yazi, fishTur, panel, encrypt, type Sahne } from './tests/ayseSahne'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { ILK10_HASTA_ADI, ILK10_KIMLIK, ilk10HastasiEkle } from './tests/gokhanKorpusHastalari'
import { bugunTRTIso, gunEkleIso, trGun } from '../doktor/dosyaOlaylari'

type Yuzey = 'panel' | 'yazi' | 'ses'
const YUZEYLER: Yuzey[] = ['panel', 'yazi', 'ses']

const SORULAR = {
  ozet: 'Bu hastayı bana kısaca özetler misin?',
  buyume: 'Büyümesi nasıl gidiyor?',
  asi: 'Aşıları yaşına göre tam mı? Eksik aşısı var mı?',
  ilac: 'Şu anda kullandığı ilaçlar neler ve dozları nedir?',
  gelisim: 'Gelişimi yaşına uygun mu?',
  takip: 'Bugün yapmam veya takip etmem gereken bir şey var mı?',
  kacan: 'Gözümden kaçabilecek önemli bir şey var mı?',
} as const
type Soru = keyof typeof SORULAR

/** What the evidence of each question must carry for this chart (patterns on the JSON-encoded request). */
const KANIT: Record<Soru, RegExp[]> = {
  ozet: [/AŞI: kesin yaş 2 yaş \d+ gün/, /BÜYÜME:/, /GELİŞİM:/, /AŞI \(kayıt tutarsız/, /AŞI \(planlanmış, uygulama kaydı yok\): Hepatit A 2\. doz/],
  buyume: [/ÇELİŞEN ÖLÇÜM/, /büyüme hızı ≈ [\d,]+ kg\/yıl/, /Kilo 13,6 kg \(p\d+, z /],
  asi: [/SONUÇ \(kayda göre\): Kesin söylenemez/, /KAYIT TUTARSIZ/, /Hepatit A 2\. doz — planlandı/, /TELAFİ \(catch-up\) GEREKSİNİMİ/, /RİSK BAZLI \/ TAKVİM DIŞI/],
  ilac: [/DOZ GÜVENLİĞİ/, /141,2 mg\/kg\/gün/, /94,1 mg\/kg\/gün/, /Notya ilaç tablosunda yok — referans yok/, /Ürün \/ konsantrasyon uyuşmazlığı/],
  gelisim: [/NOTLARDAKİ GELİŞİM GÖZLEMLERİ/, /GELİŞİMSEL RİSK ETMENLERİ/, /Prematürite — gebelik haftası 35/, /KORUYUCU ETMENLER/, /TARAMA DURUMU/, /ÖNERİLEN SONRAKİ ADIM/],
  takip: [/1\) BUGÜN:/, /2\) YAKIN ZAMANDA:/, /3\) RUTİN:/, /pencere 4 gün önce doldu/, /Aşı kaydı tutarsız/, /Doz güvenliği — Augmentin/],
  kacan: [/DOZ GÜVENLİĞİ \(doğrulanacak\)/, /ÇELİŞEN KAYIT:/, /AŞI \(eksik \/ planlanmış-uygulanmamış\)/],
}

let ilacRotasi: { GET: (r: any) => Promise<Response> }
let Istek: typeof import('next/server').NextRequest

before(async () => {
  await sahneHazirla()
  Istek = (await import('next/server')).NextRequest
  ilacRotasi = await import('../../app/api/doktor/ilaclar/route')
})

const BUGUN = bugunTRTIso()

function sahne(o: { gecmiseDonuk?: boolean } = {}): { s: Sahne; hasta: string } {
  const s = sahneKur()
  return { s, hasta: ilk10HastasiEkle(ortam.db, encrypt, s.doktor.id, BUGUN, o) }
}

/** One question on one surface; returns everything the model was sent during that turn, JSON-encoded. */
async function sor(yuzey: Yuzey, s: Sahne, hasta: string, soru: string): Promise<string> {
  const bas = ortam.modelIstekleri.length
  ortam.yanit = { metin: yuzey === 'panel' ? 'Sentetik yanıt.' : JSON.stringify({ speech: 'Sentetik yanıt.' }) }
  if (yuzey === 'panel') {
    const y = await panel(s, hasta, [{ rol: 'doktor', icerik: soru }])
    assert.equal(y.status, 200, y.hata || '')
  } else {
    const oturum = oturumAc(s, { id: hasta, ad: ILK10_HASTA_ADI })
    if (yuzey === 'yazi') await yazi(s, soru, { oturum })
    else await fishTur(s, soru, { oturum })
  }
  const istekler = ortam.modelIstekleri.slice(bas)
  assert.ok(istekler.length > 0, `${yuzey}: model çağrılmadı — "${soru}"`)
  return JSON.stringify(istekler.map((i) => i.govde))
}

describe('İlk 10 — her soruda kanıt modele gider: panel, yazı, ses', () => {
  for (const yuzey of YUZEYLER) {
    for (const soru of Object.keys(SORULAR) as Soru[]) {
      it(`${yuzey} — ${soru}: "${SORULAR[soru]}"`, async () => {
        const { s, hasta } = sahne()
        const giden = await sor(yuzey, s, hasta, SORULAR[soru])
        for (const re of KANIT[soru]) assert.ok(re.test(giden), `${yuzey}/${soru}: kanıtta yok → ${re}`)
        // Kimlik değerleri hiçbir yüzeyde modele gitmez.
        for (const deger of Object.values(ILK10_KIMLIK)) assert.ok(!giden.includes(deger), `${yuzey}/${soru}: kimlik değeri modele gitti (${deger})`)
        assert.ok(!giden.includes('Zerrin') && !giden.includes('Tuncay'), `${yuzey}/${soru}: veli adı modele gitti`)
        // Panel hasta adını da vermez ("hasta" der); kanıt bloğu hiçbir yüzeyde ad taşımaz.
        if (yuzey === 'panel') assert.ok(!giden.includes(ILK10_HASTA_ADI) && !giden.includes('Savaşkan'), 'panel: hasta adı modele gitti')
      })
    }
  }

  it('panel: dosya sorusu olmayan mesajda İlk-10 kanıtı eklenmez (yalnız dosya metni)', async () => {
    const { s, hasta } = sahne()
    const giden = await sor('panel', s, hasta, 'Teşekkürler.')
    assert.ok(!giden.includes('DOSYA SORGUSU — Soru'), 'kanıt bloğu soru yokken eklendi')
  })
})

describe('İlk 10 — başka doktor hiçbir şeye ulaşmaz', () => {
  it('panel: yabancı hasta 404, model çağrılmaz', async () => {
    const { s, hasta } = sahne()
    const bas = ortam.modelIstekleri.length
    const y = await panel(s, hasta, [{ rol: 'doktor', icerik: SORULAR.asi }], { token: s.diger.token })
    assert.equal(y.status, 404)
    assert.equal(ortam.modelIstekleri.length, bas)
  })

  it('yazı ve ses: adıyla sorulsa da başka doktorun hastasının kanıtı modele gitmez', async () => {
    const { s } = sahne()
    const soru = `${ILK10_HASTA_ADI} aşıları yaşına göre tam mı?`
    // Pozitif kontrol: aynı cümle, hastanın kendi doktoru — kanıt gider (test gerçekten bir şeyi ölçüyor).
    const kendiBas = ortam.modelIstekleri.length
    await yazi(s, soru)
    assert.ok(JSON.stringify(ortam.modelIstekleri.slice(kendiBas).map((i) => i.govde)).includes('KAYIT TUTARSIZ'), 'pozitif kontrol: kendi doktorunda kanıt gitmedi')
    for (const yuzey of ['yazi', 'ses'] as const) {
      const bas = ortam.modelIstekleri.length
      const o = { token: s.diger.token, oturum: undefined as string | undefined }
      if (yuzey === 'yazi') await yazi(s, soru, o)
      else await fishTur(s, soru, o)
      const giden = JSON.stringify(ortam.modelIstekleri.slice(bas).map((i) => i.govde))
      for (const yasak of ['KAYIT TUTARSIZ', 'Hepatit A 2. doz', 'DOZ GÜVENLİĞİ', '141,2']) assert.ok(!giden.includes(yasak), `${yuzey}: yabancı hastanın kanıtı modele gitti (${yasak})`)
    }
  })
})

describe('İlaç kartı — doz güvenliği bayrağı (/api/doktor/ilaclar)', () => {
  const ilaclar = async (token: string, hasta: string) => {
    const y = await ilacRotasi.GET(new Istek(`http://localhost/api/doktor/ilaclar?hastaId=${hasta}`, { headers: { authorization: `Bearer ${token}` } } as ConstructorParameters<typeof Istek>[1]))
    return { status: y.status, satirlar: await y.json() as { ilac_adi: string; doz_guvenligi?: string[] }[] }
  }

  it('aralık dışı dozun satırı bayrağı taşır; referansı olmayan ve kiloya göre dozlanmayan satır taşımaz', async () => {
    const { s, hasta } = sahne()
    const y = await ilaclar(s.doktor.token, hasta)
    assert.equal(y.status, 200)
    assert.equal(y.satirlar.length, 3)
    const augmentin = y.satirlar.find((r) => r.ilac_adi.startsWith('Augmentin'))!
    assert.equal(augmentin.doz_guvenligi?.length, 2, JSON.stringify(augmentin.doz_guvenligi))
    assert.match(augmentin.doz_guvenligi![0], /8 mL × 400 mg\/5 mL = 640 mg\/doz × günde 2 = 1\.280 mg\/gün; başlangıç tarihindeki kilo 13,6 kg \([\d.]+\) → 94,1 mg\/kg\/gün/)
    assert.match(augmentin.doz_guvenligi![1], /Ürün \/ konsantrasyon uyuşmazlığı/)
    for (const r of y.satirlar.filter((x) => !x.ilac_adi.startsWith('Augmentin'))) assert.equal(r.doz_guvenligi, undefined, r.ilac_adi)
    assert.ok(!JSON.stringify(y.satirlar).includes(ILK10_HASTA_ADI))
  })

  it('başka doktor: satır da bayrak da dönmez', async () => {
    const { s, hasta } = sahne()
    const y = await ilaclar(s.diger.token, hasta)
    assert.deepEqual(y.satirlar, [])
  })
})

describe('Geçmişe dönük girilmiş vizitler (seans satırı giriş günü, not vizit günü)', () => {
  /** NOTYA-VIZIT-TARIHI-01 is fixed on another branch (fix/vizit-tarihi): the visit day is the note's day. */
  const VIZIT_GUNU_DUZELTILDI = existsSync('lib/doktor/vizitTarihi.ts')
  const otit = trGun(gunEkleIso(BUGUN, -7))

  it('aşı kanıtı seans satırının gününe bağlı değildir: aynı sonuç', async () => {
    // sahneKur veritabanını sıfırlar: iki dosya sırayla kurulur ve sorulur.
    for (const gecmiseDonuk of [false, true]) {
      const { s, hasta } = sahne({ gecmiseDonuk })
      const giden = await sor('panel', s, hasta, SORULAR.asi)
      for (const re of KANIT.asi) assert.ok(re.test(giden), `kanıtta yok → ${re}`)
    }
  })

  it('doz güvenliği: ilaç listesi satırının hesabı ve referans durumu aynı kalır; kimlik gitmez', async () => {
    const { s, hasta } = sahne({ gecmiseDonuk: true })
    const giden = await sor('panel', s, hasta, SORULAR.ilac)
    // İlaç listesi satırı kendi başlangıç tarihini taşır; reçetenin tarihi vizit gününe bağlıdır (aşağıdaki test).
    for (const re of [/DOZ GÜVENLİĞİ/, /8 mL × 400 mg\/5 mL = 640 mg\/doz × günde 2 = 1\.280 mg\/gün/, /Notya ilaç tablosunda yok — referans yok/]) assert.ok(re.test(giden), `kanıtta yok → ${re}`)
    for (const deger of Object.values(ILK10_KIMLIK)) assert.ok(!giden.includes(deger))
  })

  it('aynı güne düşen vizitlerin ölçümleri eğilim gibi sunulmaz: çelişen ölçüm olarak gösterilir', { skip: VIZIT_GUNU_DUZELTILDI ? 'vizit günü düzeltildi: vizitler kendi günlerinde, bu çakışma oluşmaz' : false }, async () => {
    // Düzeltme bu dalda yokken üç vizit de giriş gününe düşer: üç ayrı kilo aynı tarihte görünür. Kural: bunlardan
    // bir "kilo artışı" uydurulmaz; çelişki açıkça yazılır ve o tarihin kilosu eğilime alınmaz.
    const { s, hasta } = sahne({ gecmiseDonuk: true })
    const giden = await sor('panel', s, hasta, SORULAR.buyume)
    assert.ok(/ÇELİŞEN ÖLÇÜM/.test(giden), 'çakışan kilolar çelişki olarak gösterilmedi')
    assert.ok(!/Kilo artışı/.test(giden), 'aynı güne düşen kilolardan artış hesaplandı')
  })

  it('vizit günü nottan okunur: pencere, doz kilosu ve büyüme tarihleri vizitin kendi gününe göre', { skip: VIZIT_GUNU_DUZELTILDI ? false : 'NOTYA-VIZIT-TARIHI-01 (fix/vizit-tarihi) bu dalda yok; birleşince kendiliğinden koşar' }, async () => {
    const { s, hasta } = sahne({ gecmiseDonuk: true })
    const takip = await sor('panel', s, hasta, SORULAR.takip)
    assert.ok(/pencere 4 gün önce doldu/.test(takip), 'takip penceresi vizit gününden hesaplanmadı')
    const ilac = await sor('panel', s, hasta, SORULAR.ilac)
    assert.ok(ilac.includes(`reçete tarihindeki kilo 13,6 kg (${otit})`) && /141,2 mg\/kg\/gün/.test(ilac), 'doz, vizitin kendi kilosuyla hesaplanmadı')
    assert.ok(/Ürün \/ konsantrasyon uyuşmazlığı/.test(ilac), 'reçete ↔ ilaç listesi uyuşmazlığı vizit gününde eşleşmedi')
    const buyume = await sor('panel', s, hasta, SORULAR.buyume)
    assert.ok(/büyüme hızı ≈ [\d,]+ kg\/yıl/.test(buyume) && buyume.includes(`- ${otit} (`), 'büyüme tarihleri vizit günü değil')
  })
})
