/**
 * NOTYA-INTAKE-DENETIM (2026-10-07) — every new-patient intake form (30 hekim branşı, 10 Klinik dalı, genel):
 * core questions present, own branch questions present, no other branch's questions, child forms ask no
 * adult-only question of the child. Report: docs/INTAKE-DENETIM.md.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { coreBolumlerIcin, intakeFormBolumleri, type IntakeAlan } from './coreAlanlar'
import { BRANS_ETIKETLERI } from './bransSorulari'
import { KLINIK_SORULARI } from './klinikSorulari'
import { GENEL_BOLUM, intakeBransBolumu, intakeBransEtiketi, intakeFormAnahtari, intakeFormBransi } from './formBransi'
import { intakeAlanGorunur } from './dogrula'
import { KLINIK_YENI_SLUGS } from '@/lib/specialties/klinikDikey'

const HEKIM = Object.keys(BRANS_ETIKETLERI)
const KLINIK = [...KLINIK_YENI_SLUGS] as string[]
const TUM = [...HEKIM, ...KLINIK, 'genel']
const COCUK = ['pediatri', 'cocuk-cerrahisi']

const alanlar = (brans: string): IntakeAlan[] =>
  intakeFormBolumleri(coreBolumlerIcin(brans), intakeBransBolumu(brans)).flatMap((b) => b.alanlar).filter((a) => a.tur !== 'bolum-basligi')
const idler = (brans: string) => new Set(alanlar(brans).map((a) => a.id))
const alan = (brans: string, id: string) => alanlar(brans).find((a) => a.id === id)

describe('her form: çekirdek sorular', () => {
  const CEKIRDEK = ['tcKimlik', 'ad', 'soyad', 'dogumTarihi', 'telefon', 'eposta', 'kronikHastaliklar', 'hastaneYatislari', 'kullanilanIlaclar', 'alerjiVarMi', 'aileOykusu', 'acilKisiAdi', 'acilKisiTelefon', 'kvkkOnay']
  for (const b of TUM) {
    it(b, () => {
      const s = idler(b)
      for (const id of CEKIRDEK) assert.ok(s.has(id), `${b}: ${id} yok`)
      assert.ok([...s].some((id) => /^basvuruNedeni/.test(id)), `${b}: başvuru nedeni yok`)
      // geçirilmiş ameliyat: erişkinde ayrı alan, çocukta özgeçmiş alanında birlikte
      assert.ok(s.has('gecirilmisAmeliyatlar') || /Ameliyat/.test(alan(b, 'kronikHastaliklar')!.etiket), `${b}: ameliyat sorusu yok`)
      assert.equal(alan(b, 'acilKisiAdi')!.zorunlu, undefined, 'acil durum kişisi her yerde isteğe bağlı')
    })
  }

  it('bir formda aynı alan kimliği iki kez yok', () => {
    for (const b of TUM) {
      const liste = intakeFormBolumleri(coreBolumlerIcin(b), intakeBransBolumu(b)).flatMap((x) => x.alanlar).map((a) => a.id)
      assert.equal(new Set(liste).size, liste.length, b)
    }
  })

  it('erişkin formları alışkanlıkları (sigara, alkol) korur', () => {
    for (const b of TUM.filter((x) => !COCUK.includes(x))) {
      assert.equal(alan(b, 'sigara')!.etiket, 'Sigara Kullanımı', b)
      assert.ok(idler(b).has('alkol'), b)
    }
  })
})

describe('çocuk formları (pediatri, çocuk cerrahisi): erişkine özgü soru çocuğa sorulmaz', () => {
  for (const b of COCUK) {
    it(b, () => {
      const m = alan(b, 'medeniDurum')!
      assert.equal(m.etiket, 'Anne ve babanın medeni durumu')
      assert.ok(m.secenekler!.includes('Evli') && m.secenekler!.includes('Boşanmış'), 'eski yanıtlar aynı metinle okunur')
      assert.ok(!m.secenekler!.includes('Bekâr') && !m.secenekler!.includes('Dul'))
      assert.equal(alan(b, 'sigara')!.etiket, 'Evde sigara içen var mı?')
      assert.ok(!idler(b).has('alkol'))
      assert.ok(!alanlar(b).some((a) => /meslek/i.test(a.id) || /^Medeni Durum$/.test(a.etiket)))
    })
  }
})

describe('branş soruları kendi formunda, başka formda yok', () => {
  const YALNIZ_PEDIATRI = ['gebelikHaftasiPed', 'dogumKilosuPed', 'dogumBoyuPed', 'basCevresiPed', 'beslenmePed', 'asiTakvimiPed', 'okulKresPed', 'anneBoyPed']
  it('doğum kilosu, gebelik haftası, beslenme, aşı, kreş: yalnız pediatri', () => {
    for (const b of TUM) {
      const s = idler(b)
      for (const id of YALNIZ_PEDIATRI) assert.equal(s.has(id), b === 'pediatri', `${b}/${id}`)
    }
    assert.ok(!alanlar('goz-hastaliklari').some((a) => /doğum kilo/i.test(a.etiket)))
  })

  it('göz formu: gözlük, lens, göz ameliyatı, diyabet, ailede glokom, ani görme değişikliği', () => {
    const g = (id: string) => alan('goz-hastaliklari', id)!
    assert.ok(g('gozlukKullanimi') && g('kontaktLensKullanimi'))
    assert.ok(g('oncekiGozOperasyonlari'))
    assert.ok(g('kronikRahatsizliklarGoz').secenekler!.includes('Diyabet'))
    assert.ok(g('aileGozHastaligiOykusu').secenekler!.includes('Glokom'))
    assert.ok(g('acilBelirtiler').secenekler!.includes('Ani görme kaybı'))
  })

  it('her Klinik dalının kendi bölümü var; başvuru nedeniyle başlar; genel değil', () => {
    for (const k of KLINIK) {
      const bolum = intakeBransBolumu(k)
      assert.equal(bolum, KLINIK_SORULARI[k as keyof typeof KLINIK_SORULARI], k)
      assert.notEqual(bolum, GENEL_BOLUM, k)
      assert.ok(bolum.alanlar.length >= 6, `${k}: branş sorusu az`)
      assert.equal(bolum.alanlar[0].id, 'basvuruNedeni', k)
      assert.ok(intakeBransEtiketi(k), k)
    }
  })

  it('Klinik dalları birbirinin özel sorusunu taşımaz (soneki kendi dalı)', () => {
    const sonek: Record<string, RegExp> = { 'sac-ekimi': /SE$/, 'medikal-estetik': /ME$/, 'estetik-cerrahi': /EC$/, longevity: /LG$/, fizyoterapi: /Fzt$/, ergoterapi: /Erg$/, diyetisyen: /Dy$/, 'klinik-psikolog': /KP$/, odyoloji: /Ody$/ }
    for (const b of TUM) {
      for (const [dal, re] of Object.entries(sonek)) {
        if (dal === b) continue
        const yabanci = intakeBransBolumu(b).alanlar.filter((a) => re.test(a.id) && !/^baslik/.test(a.id))
        assert.deepEqual(yabanci.map((a) => a.id), [], `${b} formunda ${dal} sorusu`)
      }
    }
  })

  it('gebelik / emzirme yalnız kadın hastada görünür', () => {
    const a = alan('sac-ekimi', 'gebelikEmzirme')!
    assert.equal(intakeAlanGorunur(a, { cinsiyet: 'Kadın' }), true)
    assert.equal(intakeAlanGorunur(a, { cinsiyet: 'Erkek' }), false)
    for (const b of ['ergoterapi', 'klinik-psikolog', 'odyoloji', 'pediatri']) assert.ok(!idler(b).has('gebelikEmzirme'), b)
  })
})

describe('form branşı çözümü', () => {
  it('hekimin branşı → form anahtarı; Klinik dalı kendi slug’ını alır', () => {
    assert.equal(intakeFormBransi('pediatri'), 'pediatri')
    assert.equal(intakeFormBransi('kadin-dogum'), 'kadin-hastaliklari-dogum')
    assert.equal(intakeFormBransi('sac-ekimi'), 'sac-ekimi')
    assert.equal(intakeFormBransi('Saç Ekimi'), 'sac-ekimi')
    assert.equal(intakeFormBransi('klinik-dermatoloji'), 'klinik-dermatoloji')
    assert.equal(intakeFormBransi('dermatoloji'), 'dermatoloji', 'TUS dermatoloji Klinik’e kaymaz')
    assert.equal(intakeFormBransi(''), 'genel')
    assert.equal(intakeFormBransi('bilinmeyen'), 'genel')
  })
  it('istekle gelen anahtar: bilinen değilse genel (rastgele metin saklanmaz)', () => {
    assert.equal(intakeFormAnahtari('odyoloji'), 'odyoloji')
    assert.equal(intakeFormAnahtari('kardiyoloji'), 'kardiyoloji')
    assert.equal(intakeFormAnahtari('<script>'), 'genel')
    assert.equal(intakeBransEtiketi('genel'), null)
  })
})
