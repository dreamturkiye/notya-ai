/**
 * NOTYA-EYLEM-28/29/30 — the drug table is CLINICAL SAFETY DATA, and this file is what keeps it
 * honest between reviews.
 *
 * What each group of tests is actually protecting against:
 *   • schema completeness — an entry that ships without a source, without a class, or with a
 *     pediatric dose whose unit is unstated. An unsourced number is the failure mode the whole
 *     `kaynak` field exists to prevent.
 *   • duplicates — two rows for one molecule, or one brand claimed by two molecules. Either makes
 *     the duplicate-ingredient check (Parol + Minoset) answer at random.
 *   • class resolution — NOTYA-EYLEM-29. An interaction written against a label nothing answers to
 *     fires for nobody and says nothing, so the gap is invisible. Here it is a red test.
 *   • symmetry — a card must warn whichever of the two drugs the doctor happens to be adding.
 *   • false-positive controls — the matcher is deliberately conservative; these pin that down, so a
 *     future loosening that makes "ACE inhibitörü" fire on "proton pompa inhibitörü" fails here.
 *   • Turkish case folding — doctors type İmigran / Imigran / imigran. All three must resolve.
 *   • renkli reçete — the table's own flag must agree with lib/doktor/receteRengi, which is what the
 *     prescription page actually splits pages by. Two lists that can disagree WILL disagree.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  MOLEKUL_SAYISI,
  TABLO_DISI_ETKILESIM,
  TURKISH_DRUGS,
  beklenenReceteRengi,
  bildirilmemisEtkilesimHedefleri,
  drugKeyFor,
  dogrulamaSayilari,
  etkilesimBul,
  ifadeIlaciAnlatiyorMu,
  pediatrikDozHesapla,
  tumSiniflar,
} from '@/lib/asistan/turkishDrugs'

const GIRDILER = Object.entries(TURKISH_DRUGS)

describe('NOTYA-EYLEM-28 · şema bütünlüğü (her giriş)', () => {
  it('tablo hedeflenen büyüklükte', () => {
    assert.ok(MOLEKUL_SAYISI >= 150, `tabloda ${MOLEKUL_SAYISI} molekül var, hedef ≥150`)
  })

  it('her girişte ad, marka, doz, form, sınıf ve kaynak var', () => {
    for (const [anahtar, d] of GIRDILER) {
      assert.ok(d.name?.trim(), `${anahtar}: name boş`)
      assert.ok(Array.isArray(d.brand) && d.brand.length > 0, `${anahtar}: marka listesi boş`)
      assert.ok(d.dose?.trim(), `${anahtar}: doz boş`)
      assert.ok(d.form?.trim(), `${anahtar}: form boş`)
      assert.ok(d.category?.trim(), `${anahtar}: category boş`)
      assert.ok(d.siniflar?.length, `${anahtar}: siniflar boş — sınıf bazlı etkileşim eşleşmez`)
      assert.ok(Array.isArray(d.contraindications), `${anahtar}: contraindications dizi değil`)
    }
  })

  it('her girişin kaynağı ve doğrulama durumu var; hiçbiri hekim_dogruladi değil', () => {
    for (const [anahtar, d] of GIRDILER) {
      assert.ok(d.kaynak?.belge?.trim(), `${anahtar}: kaynak.belge boş — kaynaksız sayı yayınlanamaz`)
      assert.ok(
        ['kub_okundu', 'literatur', 'hekim_dogruladi'].includes(d.kaynak.dogrulama),
        `${anahtar}: geçersiz dogrulama "${d.kaynak.dogrulama}"`
      )
      // `kub_okundu` iddiası, gerçekten açılmış bir belgeyi göstermek zorundadır.
      if (d.kaynak.dogrulama === 'kub_okundu') {
        assert.match(d.kaynak.url || '', /^https:\/\/titck\.gov\.tr\//, `${anahtar}: kub_okundu ama TİTCK URL'si yok`)
      }
      assert.notEqual(
        d.kaynak.dogrulama,
        'hekim_dogruladi',
        `${anahtar}: hiçbir giriş hekim onayı almadan hekim_dogruladi olamaz (docs/beta/Ilac-Tablosu-Hekim-Inceleme.html)`
      )
    }
  })

  it('doğrulama sayıları toplamı molekül sayısına eşit', () => {
    const s = dogrulamaSayilari()
    assert.equal(s.kub_okundu + s.literatur + s.hekim_dogruladi, MOLEKUL_SAYISI)
    assert.equal(s.hekim_dogruladi, 0)
  })

  it('pediatrik doz varsa birimi ve kaynak cümlesi de var', () => {
    for (const [anahtar, d] of GIRDILER) {
      if (!d.pediatrik) continue
      assert.ok(
        ['mg/kg/doz', 'mg/kg/gün', 'mikrogram/kg/gün', 'IU/gün'].includes(d.pediatrik.birim),
        `${anahtar}: pediatrik birim geçersiz — mg/kg/doz ile mg/kg/gün karıştırılamaz (NOTYA-EYLEM-30)`
      )
      assert.ok(d.pediatrik.metin?.trim(), `${anahtar}: pediatrik doz kaynak cümlesi yok`)
      if (typeof d.pediatrik.min === 'number' && typeof d.pediatrik.max === 'number') {
        assert.ok(d.pediatrik.max >= d.pediatrik.min, `${anahtar}: pediatrik max < min`)
      }
    }
  })

  it('etkileşim satırlarının hepsinde şiddet ve Türkçe gerekçe var', () => {
    for (const [anahtar, d] of GIRDILER) {
      for (const e of d.etkilesimler || []) {
        assert.ok(e.ile?.trim(), `${anahtar}: etkileşim hedefi boş`)
        assert.ok(['ciddi', 'orta'].includes(e.siddet), `${anahtar} → ${e.ile}: geçersiz şiddet`)
        assert.ok((e.not || '').trim().length > 20, `${anahtar} → ${e.ile}: gerekçe cümlesi yok/çok kısa`)
      }
    }
  })
})

describe('NOTYA-EYLEM-28 · tekillik', () => {
  it('iki giriş aynı etken maddeyi taşımıyor', () => {
    const gorulen = new Map<string, string>()
    for (const [anahtar, d] of GIRDILER) {
      const ad = d.name.toLocaleLowerCase('tr')
      const onceki = gorulen.get(ad)
      assert.equal(onceki, undefined, `"${d.name}" iki kez: ${onceki} ve ${anahtar}`)
      gorulen.set(ad, anahtar)
    }
  })

  it('bir marka adı iki farklı moleküle ait değilse, ait olduğu tek molekülü gösterir', () => {
    // Bir marka iki molekülde görünebilir — ama YALNIZCA sabit kombinasyon ürünüyse (Co-Diovan =
    // valsartan + hidroklorotiyazid) ve bu, marka listesinde "(kombinasyon)" diye YAZILIYSA. İşaret
    // konmamış paylaşılan marka, iki farklı ilacın aynı isimle karışması demektir.
    const gorulen = new Map<string, { anahtar: string; kombinasyon: boolean }>()
    for (const [anahtar, d] of GIRDILER) {
      for (const m of d.brand) {
        const kombinasyon = /\(kombinasyon\)/i.test(m)
        const ad = m.replace(/\s*\(.*\)\s*/, '').trim().toLocaleLowerCase('tr')
        if (!ad) continue
        const onceki = gorulen.get(ad)
        if (onceki) {
          assert.ok(
            kombinasyon && onceki.kombinasyon,
            `"${m}" markası iki moleküle ait (${onceki.anahtar}, ${anahtar}) ama en az birinde "(kombinasyon)" işareti yok`
          )
          continue
        }
        gorulen.set(ad, { anahtar, kombinasyon })
      }
    }
  })
})

describe('NOTYA-EYLEM-29 · sınıf bazlı etkileşimler gerçekten çözülüyor', () => {
  it('etkileşimde adı geçen her hedef ya bir moleküle çözülür ya da TABLO_DISI olarak BİLDİRİLMİŞTİR', () => {
    const bildirilmemis = bildirilmemisEtkilesimHedefleri()
    assert.deepEqual(
      bildirilmemis,
      [],
      `Bu adlar hiçbir moleküle çözülmüyor ve TABLO_DISI_ETKILESIM'de de yok — sessizce hiç eşleşmezler: ${bildirilmemis.join(', ')}`
    )
  })

  it('TABLO_DISI listesi gereksiz büyümüyor (tabloya giren bir molekül listeden çıkarılmalı)', () => {
    for (const ad of TABLO_DISI_ETKILESIM) {
      const cozuluyor = Object.values(TURKISH_DRUGS).some((d) => ifadeIlaciAnlatiyorMu(ad, d))
      assert.equal(cozuluyor, false, `"${ad}" artık tabloda bir moleküle çözülüyor — TABLO_DISI_ETKILESIM'den çıkarın`)
    }
  })

  it('NOTYA-EYLEM-29 raporundaki örnek sınıflar artık eşleşiyor', () => {
    const ornekler = ['NSAİİ', 'ACE inhibitörü', 'Antihipertansif', 'QT uzatan ilaç', 'Aminoglikozid', 'SSRI', 'Statin']
    const siniflar = tumSiniflar()
    for (const s of ornekler) {
      const eslesen = Object.values(TURKISH_DRUGS).filter((d) => ifadeIlaciAnlatiyorMu(s, d))
      assert.ok(eslesen.length > 0, `"${s}" hiçbir moleküle çözülmüyor (tablodaki sınıf sayısı: ${siniflar.size})`)
    }
  })

  it('gerçek vakalar: sınıfla yazılmış etkileşimler karta düşer', () => {
    // Bunlar NOTYA-EYLEM-25/29'da adı konmuş, önceden SESSİZCE kaçan çiftler.
    const ciftler: [string, string][] = [
      ['ibuprofen', 'ramipril'],
      ['naproksen', 'metilprednizolon'],
      ['sertralin', 'sumatriptan'],
      ['siprofloksasin', 'demirPolimaltoz'],
      ['levotiroksin', 'demirPolimaltoz'],
      ['varfarin', 'metronidazol'],
      ['klopidogrel', 'omeprazol'],
      ['sildenafil', 'izosorbidDinitrat'],
      ['metotreksat', 'trimetoprimSulfametoksazol'],
      ['klaritromisin', 'simvastatin'],
    ]
    for (const [a, b] of ciftler) {
      assert.ok(TURKISH_DRUGS[a], `tabloda yok: ${a}`)
      assert.ok(TURKISH_DRUGS[b], `tabloda yok: ${b}`)
      assert.ok(etkilesimBul(a, b), `${a} + ${b} etkileşimi kaçtı`)
    }
  })
})

describe('NOTYA-EYLEM-28 · etkileşim simetrisi (A↔B)', () => {
  it('hangi ilaç eklenirse eklensin aynı hüküm çıkar', () => {
    const anahtarlar = Object.keys(TURKISH_DRUGS)
    const asimetri: string[] = []
    for (let i = 0; i < anahtarlar.length; i++) {
      for (let j = i + 1; j < anahtarlar.length; j++) {
        const a = anahtarlar[i]
        const b = anahtarlar[j]
        const ab = etkilesimBul(a, b)
        const ba = etkilesimBul(b, a)
        if (Boolean(ab) !== Boolean(ba)) asimetri.push(`${a}↔${b}`)
        else if (ab && ba && ab.siddet !== ba.siddet) asimetri.push(`${a}↔${b} (şiddet: ${ab.siddet}/${ba.siddet})`)
      }
    }
    assert.deepEqual(asimetri.slice(0, 10), [], `asimetrik çiftler (${asimetri.length}): ${asimetri.slice(0, 10).join(', ')}`)
  })

  it('bir ilaç kendisiyle etkileşmez', () => {
    for (const anahtar of Object.keys(TURKISH_DRUGS)) {
      assert.equal(etkilesimBul(anahtar, anahtar), null, `${anahtar} kendisiyle etkileşiyor görünüyor`)
    }
  })
})

describe('NOTYA-EYLEM-25 · yanlış pozitif kontrolleri', () => {
  it('sınıf adları birbirine karışmıyor', () => {
    assert.equal(ifadeIlaciAnlatiyorMu('ACE inhibitörü', TURKISH_DRUGS.omeprazol), false, 'ACE inhibitörü → proton pompa inhibitörü olamaz')
    assert.equal(ifadeIlaciAnlatiyorMu('Proton pompa inhibitörü', TURKISH_DRUGS.ramipril), false)
    assert.equal(ifadeIlaciAnlatiyorMu('Beta blokör', TURKISH_DRUGS.salbutamol), false, 'beta-2 agonist beta blokör değildir')
  })

  it('ilgisiz molekül çiftleri etkileşim üretmez', () => {
    const ilgisiz: [string, string][] = [
      ['parasetamol', 'setirizin'],
      ['amoksisilin', 'salbutamol'],
      ['laktuloz', 'levotiroksin'],
      ['nistatin', 'amlodipin'],
      ['simetikon', 'sertralin'],
    ]
    for (const [a, b] of ilgisiz) {
      assert.equal(etkilesimBul(a, b), null, `${a} + ${b} yanlış pozitif`)
    }
  })
})

describe('NOTYA-EYLEM-28 · marka → molekül çözümü (Türkçe büyük/küçük harf)', () => {
  it('yaygın markalar doğru moleküle düşer', () => {
    const vakalar: [string, string][] = [
      ['Parol 500 mg', 'parasetamol'],
      ['MINOSET', 'parasetamol'],
      ['Largopen 1000 mg', 'amoksisilin'],
      ['Augmentin BID', 'amoksisilinKlavulanat'],
      ['Beloc-Zok 50', 'metoprolol'],
      ['Coumadin 5 mg', 'varfarin'],
      ['Lustral', 'sertralin'],
      ['glifor 1000', 'metformin'],
    ]
    for (const [yazilan, beklenen] of vakalar) {
      assert.equal(drugKeyFor(yazilan), beklenen, `"${yazilan}" → ${drugKeyFor(yazilan)}, beklenen ${beklenen}`)
    }
  })

  it('noktalı/noktasız I aynı moleküle çözülür', () => {
    // Hekimler aynı markayı üç türlü yazar; üçü de aynı ilaçtır.
    for (const yazim of ['İmigran', 'Imigran', 'imigran', 'IMIGRAN']) {
      assert.equal(drugKeyFor(yazim), 'sumatriptan', `"${yazim}" çözülemedi`)
    }
    for (const yazim of ['İbuprofen', 'Ibuprofen', 'ibuprofen']) {
      assert.equal(drugKeyFor(yazim), 'ibuprofen', `"${yazim}" çözülemedi`)
    }
  })

  it('tablo dışı bir ad null döner (uydurma eşleşme yok)', () => {
    assert.equal(drugKeyFor('Zyrtlonaxil'), null)
    assert.equal(drugKeyFor(''), null)
  })
})

describe('NOTYA-EYLEM-30 · pediatrik doz hesabı ve aşım hükmü', () => {
  it('mg/kg/doz ile mg/kg/gün ayrı hesaplanır', () => {
    // Parasetamol: 10–15 mg/kg/DOZ, günde 4 kez. 20 kg çocukta doz başına 200–300 mg.
    const p = pediatrikDozHesapla('parasetamol', 20)
    assert.ok(p)
    assert.equal(p!.dozBasiMinMg, 200)
    assert.equal(p!.dozBasiMaxMg, 300)
    assert.equal(p!.gunlukMaxMg, 1200)

    // İbuprofen: 20–30 mg/kg/GÜN, 3 doza bölünmüş. 20 kg çocukta günde 400–600 mg.
    const i = pediatrikDozHesapla('ibuprofen', 20)
    assert.ok(i)
    assert.equal(i!.gunlukMinMg, 400)
    assert.equal(i!.gunlukMaxMg, 600)
  })

  it('kaynakta tavan varsa aşım hükmü verilir', () => {
    // Parasetamol tavanı 60 mg/kg/gün → 20 kg için 1200 mg.
    const normal = pediatrikDozHesapla('parasetamol', 20, 1000)
    assert.equal(normal!.asim, false)
    const asim = pediatrikDozHesapla('parasetamol', 20, 2000)
    assert.equal(asim!.asim, true)
    assert.match(asim!.asimMetni || '', /AŞIYOR/)
  })

  it('yazılan doz okunamıyorsa hüküm verilmez', () => {
    const h = pediatrikDozHesapla('parasetamol', 20)
    assert.equal(h!.asim, undefined, 'doz bilinmeden aşım hükmü verilemez')
  })

  it('hiçbir giriş hekim onaylı olmadığı için hesap "teyit edin" ister', () => {
    const h = pediatrikDozHesapla('amoksisilin', 15)
    assert.equal(h!.hekimDogruladi, false)
  })

  it('pediatrik verisi olmayan molekülde null döner', () => {
    assert.equal(pediatrikDozHesapla('varfarin', 20), null)
  })
})

describe('NOTYA-EYLEM-28 · renkli reçete tutarlılığı', () => {
  it('tablodaki renk, lib/doktor/receteRengi ile birebir aynı', () => {
    const farklar: string[] = []
    for (const [anahtar, d] of GIRDILER) {
      const beklenen = beklenenReceteRengi(d)
      const yazan = d.renkliRecete ?? 'normal'
      if (yazan !== beklenen) farklar.push(`${anahtar}: tabloda ${yazan}, receteRengi ${beklenen}`)
    }
    assert.deepEqual(farklar, [])
  })

  it('kontrole tabi moleküller doğru renkte', () => {
    assert.equal(TURKISH_DRUGS.tramadol.renkliRecete, 'yesil')
    assert.equal(TURKISH_DRUGS.alprazolam.renkliRecete, 'yesil')
    assert.equal(TURKISH_DRUGS.pregabalin.renkliRecete, 'yesil')
    assert.equal(TURKISH_DRUGS.metilfenidat.renkliRecete, 'kirmizi')
    assert.equal(TURKISH_DRUGS.parasetamol.renkliRecete, 'normal')
  })
})
