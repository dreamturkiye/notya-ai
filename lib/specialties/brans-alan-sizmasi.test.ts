/**
 * BRANS-ALAN-SIZMASI — branşa özgü içerik başka branşa sızmaz (Kaan 2026-09-17, KD hekimi hesabında canlı bulundu).
 *
 *  Hata 1: KD hekiminin Yaşamsal Bulgular formunda "Baş Çevresi" (pediatri ölçümü).
 *  Hata 2: KD notunun portala giden özeti "Hasta/veli özeti" + "veli" dili (pediatri hitabı).
 *
 * Bu dosya kuralı saf katmanda kilitler: tek karar noktası (lib/specialties/kapsam.ts), ortak form bileşeninin
 * gerçek çıktısı (react-dom/server), SOAP / not-konsult / epikriz promptları, hasta dosyası sekme kapıları ve
 * ortak sayfaların kaynak kodunda sabit liste kalmadığı. Rota düzeyi yürüyüş (sentetik QA hekimleri, gerçek route
 * handler'ları): brans-alan-sizmasi-rotalar.test.ts. Kural: .cursor/skills/brans-alan-sizmasi/SKILL.md
 *
 * VELI-YASAL-ONAM (Kaan 2026-09-17 düzeltmesi): "veli" dili branşa değil hastanın YAŞINA bağlıdır — 18 yaşını
 * doldurmamış her hasta her branşta veli dilini alır (veliOnamGerekliMi / veliDiliMi). Baş çevresi, Neyzi, sağlam
 * çocuk gibi KLİNİK içerik ise branş güdümlü kalır (pediatrikBaglamMi, değişmedi).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { BRANS_ETIKETLERI, BRANS_SORULARI } from '@/lib/intake/bransSorulari'
import { CORE_BOLUMLER, VELI_BOLUMU, coreBolumlerIcin, intakeFormBolumleri, type IntakeBolum } from '@/lib/intake/coreAlanlar'
import { intakeGorunmeyenYanitlariAyikla, intakeGorunurBolumler, intakeIstemciHataMetni, intakeSunucuHataMetni } from '@/lib/intake/dogrula'
import IntakeBolumleri from '@/components/intake/IntakeBolumleri'
import { specialtyProfile } from './registry'
import { PEDIATRIK_BAGLAM } from './profile'
import { bransAnahtari, bransKapsami, etkinBrans, notOlcumleri, pediatrikBaglamMi, veliDiliMi, veliOnamGerekliMi, vitalleriKapsamaGoreSuz } from './kapsam'
import { hitapMetinleri } from './hitap'
import { istemciKapsami } from './kapsamIstemci'
import { soapKurallari, soapSistemPromptu } from '@/lib/doktor/soapUret'
import { notKonsultSistemPromptu } from '@/lib/doktor/notKonsultPromptu'
import { epikrizKapsamliSistem, epikrizKlinikSatiri, epikrizTekVizitSistem, epikrizUnvanSatiri } from '@/lib/doktor/epikrizMetinleri'
import { dahiliyeSekmesiBransi, pediatriAracSekmesiUygun } from '@/lib/doktor/hastaDosyaSekmeleri'
import YasamsalBulgularFormu from '@/components/doktor/YasamsalBulgularFormu'
import { muayeneCekListesi } from '@/lib/doktor/muayeneCekListesi'

const KOK = resolve(__dirname, '../..')
const kaynak = (yol: string) => readFileSync(join(KOK, yol), 'utf8')

const TUM: SpecialtyKey[] = Object.keys(BRANS_ETIKETLERI) as SpecialtyKey[]
const HER_ZAMAN = new Set<SpecialtyKey>(['pediatri', 'cocuk-cerrahisi'])
const KARMA = new Set<SpecialtyKey>(['aile-hekimligi'])
/** Kaan'ın canlı hatayı bulduğu branş + diğer bölümler + omurgada kalan örnek branşlar. */
const YETISKIN_ORNEKLERI = ['kadin-hastaliklari-dogum', 'kadin-dogum', 'dahiliye', 'dermatoloji', 'goz-hastaliklari', 'kardiyoloji', 'genel-cerrahi', 'gogus-cerrahisi', 'uroloji']

const NOW = Date.parse('2026-09-17T09:00:00Z')
const COCUK = '2022-03-01'
const YETISKIN = '1988-06-15'
const VELI = /veli|anne-baba|ebeveyn/i

function formHtml(brans: string | null, dogum: string | null = null): string {
  const k = bransKapsami({ seansBransi: brans, hastaDogumIso: dogum, nowMs: NOW })
  return renderToStaticMarkup(React.createElement(YasamsalBulgularFormu, { olcumler: k.olcumler, degerler: { basCevresi: '48' }, onDegis: () => {} }))
}

describe('BRANS-ALAN-SIZMASI · tek karar noktası (kapsam.ts)', () => {
  it('PEDIATRIK_BAGLAM her branş için açıkça karar verir (30/30, varsayılan yok)', () => {
    assert.deepEqual(Object.keys(PEDIATRIK_BAGLAM).sort(), [...TUM].sort())
    for (const k of TUM) {
      const beklenen = HER_ZAMAN.has(k) ? 'her-zaman' : KARMA.has(k) ? 'cocuk-hastada' : 'asla'
      assert.equal(specialtyProfile(k).pediatrikBaglam, beklenen, k)
    }
  })

  it('branşı bilinmeyen hekim pediatri profilini MİRAS ALMAZ (eskiden registry `|| "pediatri"` idi)', () => {
    for (const bos of [null, undefined, '', 'genel']) {
      const p = specialtyProfile(bos)
      assert.notEqual(p.key, 'pediatri', String(bos))
      assert.ok(!p.olcumler.some((o) => o.anahtar === 'basCevresi' && !o.kosul), String(bos))
    }
  })

  it('branş çözümü: kanonik anahtar, eski KD değeri, "genel" → null; seans branşı hekimden önce gelir', () => {
    assert.equal(bransAnahtari('kadin-dogum'), 'kadin-hastaliklari-dogum')
    assert.equal(bransAnahtari('Kadın Hastalıkları ve Doğum'), 'kadin-hastaliklari-dogum')
    assert.equal(bransAnahtari('genel-cerrahi'), 'genel-cerrahi')
    assert.equal(bransAnahtari('genel'), null)
    assert.equal(bransAnahtari(null), null)
    assert.equal(etkinBrans({ seansBransi: 'genel', doktorBransi: 'kadin-dogum' }), 'kadin-hastaliklari-dogum')
    assert.equal(etkinBrans({ seansBransi: 'kadin-hastaliklari-dogum', doktorBransi: 'pediatri' }), 'kadin-hastaliklari-dogum')
  })

  it('pediatrik bağlam: pediatri/çocuk cerrahisi her zaman; aile/branşsız yalnız YAŞI BİLİNEN çocukta; diğerleri asla', () => {
    for (const k of TUM) {
      for (const dogum of [COCUK, YETISKIN, null]) {
        const sonuc = pediatrikBaglamMi({ seansBransi: k, hastaDogumIso: dogum, nowMs: NOW })
        const beklenen = HER_ZAMAN.has(k) || (KARMA.has(k) && dogum === COCUK)
        assert.equal(sonuc, beklenen, `${k} / ${dogum}`)
      }
    }
    assert.equal(pediatrikBaglamMi({ seansBransi: 'genel', doktorBransi: null, hastaDogumIso: COCUK, nowMs: NOW }), true)
    assert.equal(pediatrikBaglamMi({ seansBransi: 'genel', doktorBransi: null, hastaDogumIso: null, nowMs: NOW }), false)
    assert.equal(pediatrikBaglamMi({ seansBransi: 'genel', doktorBransi: 'pediatri' }), true)
  })
})

describe('HATA 1 — Baş Çevresi yalnız pediatrik bağlamda (Yaşamsal Bulgular formu)', () => {
  it('KD / dahiliye / derm / göz / kardiyoloji / cerrahi formunda Baş Çevresi YOK — hasta çocuk olsa bile', () => {
    for (const b of YETISKIN_ORNEKLERI) {
      for (const dogum of [null, YETISKIN, COCUK]) {
        const olcumler = notOlcumleri({ seansBransi: b, hastaDogumIso: dogum, nowMs: NOW })
        assert.ok(!olcumler.some((o) => o.anahtar === 'basCevresi'), `${b} / ${dogum}`)
        const html = formHtml(b, dogum)
        assert.ok(!/Baş Çevresi/i.test(html) && !html.includes('data-olcum="basCevresi"'), `${b} render / ${dogum}`)
      }
    }
  })

  it('30 branşın hiçbirinde (pediatri + çocuk cerrahisi hariç) yaşı bilinmeyen hastada Baş Çevresi çizilmez', () => {
    for (const k of TUM) {
      const var_ = formHtml(k).includes('data-olcum="basCevresi"')
      assert.equal(var_, HER_ZAMAN.has(k), k)
    }
  })

  it('pediatri formu bozulmadı: tüm alanlar, ateş ilk, Baş Çevresi son, mevcut değer görünür', () => {
    const olcumler = notOlcumleri({ seansBransi: 'pediatri' }).map((o) => o.anahtar)
    assert.deepEqual(olcumler, ['ates', 'tansiyon', 'nabiz', 'solunum', 'spo2', 'kilo', 'boy', 'basCevresi'])
    const html = formHtml('pediatri')
    assert.ok(html.includes('Baş Çevresi') && html.includes('value="48"'))
    // doktor profili pediatri, seans "genel" (profil yüklenmeden başlatılan muayene) → yine pediatri formu
    assert.ok(bransKapsami({ seansBransi: 'genel', doktorBransi: 'pediatri' }).olcumler.some((o) => o.anahtar === 'basCevresi'))
  })

  it('aile hekimliği: bebek izleminde (çocuk hasta) Baş Çevresi var, erişkinde yok', () => {
    assert.ok(formHtml('aile-hekimligi', COCUK).includes('Baş Çevresi'))
    assert.ok(!formHtml('aile-hekimligi', YETISKIN).includes('Baş Çevresi'))
  })

  it('baseline alanlar her branşta aynı (ortak omurga bozulmadı)', () => {
    for (const k of TUM) {
      const anahtarlar = notOlcumleri({ seansBransi: k }).map((o) => o.anahtar).filter((a) => a !== 'basCevresi')
      assert.deepEqual(anahtarlar, ['ates', 'tansiyon', 'nabiz', 'solunum', 'spo2', 'kilo', 'boy'], k)
    }
  })

  it('model çıktısı süzgeci: KD notunda (fetal HC dikte edilmiş) baş çevresi atılır, diğer vitaller kalır; pediatride kalır', () => {
    const v = { kilo: '68', tansiyon: '110/70', basCevresi: '28' }
    assert.deepEqual(vitalleriKapsamaGoreSuz(v, bransKapsami({ seansBransi: 'kadin-hastaliklari-dogum' })), { kilo: '68', tansiyon: '110/70' })
    assert.deepEqual(vitalleriKapsamaGoreSuz(v, bransKapsami({ seansBransi: 'pediatri' })), v)
    assert.equal(vitalleriKapsamaGoreSuz(null, bransKapsami({ seansBransi: 'dahiliye' })), null)
  })

  it('SOAP JSON şablonu: erişkin kuralında "basCevresi" anahtarı yok, pediatrikte var', () => {
    assert.ok(!soapKurallari(false).includes('basCevresi'))
    assert.ok(soapKurallari(true).includes('"basCevresi": null'))
  })

  it('istemci varsayılanı (sunucu paketi yoksa) baseline + "hasta" dili — asla pediatri', () => {
    const k = istemciKapsami(undefined)
    assert.equal(k.pediatrik, false)
    assert.ok(!k.olcumler.some((o) => o.anahtar === 'basCevresi'))
    assert.ok(!VELI.test(JSON.stringify(k.hitap)))
  })
})

describe('HATA 2 — erişkin hastada "veli" dili yok (hasta/veli özeti)', () => {
  it('hitap metinleri: erişkin setinde veli/anne-baba yok; pediatrik set veli der', () => {
    assert.ok(!VELI.test(JSON.stringify(hitapMetinleri(false))))
    assert.equal(hitapMetinleri(false).ozetEtiketi, 'Hasta özeti')
    assert.equal(hitapMetinleri(true).ozetEtiketi, 'Hasta/veli özeti')
    assert.equal(hitapMetinleri(null).ozetEtiketi, 'Hasta özeti')
  })

  it('KD / dahiliye / derm / göz / kardiyoloji / genel cerrahi: erişkin (ve yaşı bilinmeyen) hastanın SOAP promptunda veli yok', () => {
    for (const b of YETISKIN_ORNEKLERI) {
      const p = soapSistemPromptu({ transcript: '', specialty: 'genel', doktorBransi: b })
      assert.ok(!VELI.test(p), b)
      const p2 = soapSistemPromptu({ transcript: '', specialty: b, doktorBransi: b, hastaDogumIso: YETISKIN })
      assert.ok(!VELI.test(p2), `${b} erişkin hasta`)
    }
    // (Aynı branşlarda ÇOCUK hasta artık veli dilini alır — bkz. VELI-YASAL-ONAM bloğu. Eski test bunun tersini
    // kilitliyordu; Kaan'ın hukuki düzeltmesiyle bilinçli olarak değişti.)
  })

  it('pediatri SOAP promptu veli dilini korur (pediatri bozulmadı)', () => {
    const p = soapSistemPromptu({ transcript: '', specialty: 'pediatri', doktorBransi: 'pediatri' })
    assert.ok(p.includes('Veli beyanı') && p.includes('veliye/hastaya') && p.includes('baş çevresi'))
  })

  it('"↻ Notuma göre yenile" (not-konsult) promptu: erişkin branşta veli / Neyzi yok, pediatride var', () => {
    const not = { hasta_ozeti: 'Sentetik özet' }
    for (const b of YETISKIN_ORNEKLERI) {
      const kapsam = bransKapsami({ seansBransi: b })
      const p = notKonsultSistemPromptu({ kapsam, trtBugun: '2026-09-17', not, taslak: { hastaOzeti: 'x' } })
      assert.ok(!VELI.test(p), b)
      assert.ok(!/Neyzi/.test(p), b)
      assert.ok(p.includes('Hasta özeti (taslak): x') && p.includes('hastaya giden özet'), b)
      assert.ok(!/anahtarlar: [^\n]*basCevresi/.test(p), b)
      assert.ok(!VELI.test(kapsam.hitap.ozetYenileIstegi), b)
    }
    const ped = notKonsultSistemPromptu({ kapsam: bransKapsami({ seansBransi: 'pediatri' }), trtBugun: '2026-09-17', not })
    assert.ok(ped.includes('veliye giden özet') && ped.includes('Veli özeti (taslak)') && ped.includes('Neyzi'))
    assert.ok(/anahtarlar: [^\n]*basCevresi/.test(ped))
  })

  it('İnceleme / not / yazdır etiketleri branş kapsamından: KD "Hasta özeti", pediatri "Hasta/veli özeti"', () => {
    assert.equal(bransKapsami({ seansBransi: 'kadin-hastaliklari-dogum' }).hitap.ozetEtiketi, 'Hasta özeti')
    assert.equal(bransKapsami({ seansBransi: 'kadin-hastaliklari-dogum' }).hitap.ozetYazdirEtiketi, 'Hasta Özeti')
    assert.equal(bransKapsami({ seansBransi: 'pediatri' }).hitap.ozetYazdirEtiketi, 'Hasta / Veli Özeti')
  })
})

describe('Diğer sızıntılar (Phase 2 envanterinden düzeltilenler)', () => {
  it('epikriz: branş yoksa "Kliniği: Pediatri" YAZILMAZ; KD başlık/imza KD; erişkin promptta sağlam çocuk / aşı karnesi / anne beyanı yok', () => {
    assert.equal(epikrizKlinikSatiri(null), null)
    assert.equal(epikrizUnvanSatiri(null), '')
    assert.equal(epikrizKlinikSatiri('kadin-hastaliklari-dogum'), 'Kliniği: Kadın Hastalıkları ve Doğum')
    assert.equal(epikrizUnvanSatiri('kadin-hastaliklari-dogum'), 'Kadın Hastalıkları ve Doğum Uzmanı')
    assert.equal(epikrizUnvanSatiri('pediatri'), 'Çocuk Sağlığı ve Hastalıkları Uzmanı')
    for (const p of [epikrizKapsamliSistem(false), epikrizTekVizitSistem(false)]) {
      assert.ok(!/sağlam çocuk|AŞI KARNESİ|Anne beyanı|çocuğun|doğum bilgileri/i.test(p))
    }
    assert.ok(epikrizKapsamliSistem(true).includes('sağlam çocuk') && epikrizKapsamliSistem(true).includes('AŞI KARNESİ'))
  })

  it('hasta dosyası: Dahiliye sekmesi cerrahi branşlara açılmaz (eski regex genel-cerrahi / göğüs cerrahisi yakalıyordu)', () => {
    // KARDIO/GOGUS/AILE/ENDO/NEFRO-EXCEPTIONAL: kendi branş sekmeleri var — Dahiliye WOW'a düşmez (brans-alan-sizmasi).
    for (const b of ['genel-cerrahi', 'gogus-cerrahisi', 'Göğüs Cerrahisi', 'kalp-damar-cerrahisi', 'kadin-dogum', 'goz-hastaliklari', 'pediatri', 'kardiyoloji', 'gogus-hastaliklari', 'aile-hekimligi', 'endokrinoloji', 'nefroloji', 'gastroenteroloji', 'enfeksiyon-hastaliklari', '']) {
      assert.equal(dahiliyeSekmesiBransi(b), false, b)
    }
    for (const b of ['dahiliye', 'İç Hastalıkları', 'genel']) {
      assert.equal(dahiliyeSekmesiBransi(b), true, b)
    }
  })

  it('hasta dosyası: doğum tarihi bilinmeyen erişkine pediatri araç sekmeleri (M-CHAT, gelişim) açılmaz; pediatride açılır', () => {
    assert.equal(pediatriAracSekmesiUygun({ dogumIso: null, doktorBransi: 'kardiyoloji', pediatriDoktoru: false }, NOW), false)
    assert.equal(pediatriAracSekmesiUygun({ dogumIso: null, doktorBransi: 'pediatri', pediatriDoktoru: true }, NOW), true)
    assert.equal(pediatriAracSekmesiUygun({ dogumIso: COCUK, doktorBransi: 'kadin-dogum', pediatriDoktoru: false }, NOW), false)
  })
})

describe('Kaynak kilidi: ortak sayfalar branşa özgü listeyi / kelimeyi sabit yazmaz', () => {
  const ORTAK = [
    'app/dashboard/doktor/inceleme/page.tsx',
    'app/dashboard/doktor/notlar/[id]/page.tsx',
    'app/dashboard/doktor/notlar/[id]/yazdir/page.tsx',
    'app/api/doktor/not-konsult/route.ts',
    'app/api/doktor/araclar/epikriz/route.ts',
    'lib/doktor/notKonsultPromptu.ts',
    'components/doktor/YasamsalBulgularFormu.tsx',
    'components/doktor/HastaAsilar.tsx',
  ]
  const yorumsuz = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

  it('Baş Çevresi alanı ortak sayfalarda sabit yazılmaz (yalnız profil → kapsam.ts)', () => {
    for (const f of ORTAK) assert.ok(!/['"]Baş Çevresi['"]/.test(yorumsuz(kaynak(f))), f)
  })

  it('"veli" kelimesi ortak sayfalarda sabit yazılmaz (yalnız lib/specialties/hitap.ts veya pediatrik dal)', () => {
    for (const f of ORTAK) {
      const s = yorumsuz(kaynak(f))
        // pediatrik dal: ped('…veli…', '…') / PEDIATRIK_PERSENTIL_KURALI / veliYakinligi (pediatri intake alan adı)
        .replace(/ped\(\s*'[^']*'/g, "ped(''").replace(/veliYakinligi/g, '').replace(/veliOzeti/g, '')
        // karar değişkeni adı (kapsam.ts → veliDiliMi) — metin değil
        .replace(/veliDili(Mi)?/g, '')
      assert.ok(!/veli/i.test(s), f)
    }
  })

  it('hasta dosyası LLM bağlamı: "veli beyanı" başlığı yalnız form veli tarafından doldurulduysa (pediatri formu)', () => {
    const s = yorumsuz(kaynak('lib/doktor/hastaDosyaDerleyici.ts'))
    assert.ok(!/hasta\/veli/i.test(s))
    assert.ok(/yanitlar\.veliYakinligi \? 'veli beyanı' : 'hasta beyanı'/.test(s))
  })

  it("epikriz rotasında sabit 'pediatri' branşı yok", () => {
    assert.ok(!/['"]pediatri['"]/.test(yorumsuz(kaynak('app/api/doktor/araclar/epikriz/route.ts'))))
  })

  it('Aşılar: çocukluk dönemi Ulusal Aşı Takvimi ve varsayılan "pediatrik" kategori yalnız çocuk hastada / pediatrik bağlamda', () => {
    const s = kaynak('components/doktor/HastaAsilar.tsx')
    assert.ok(/\{\(cocukHasta \|\| pediatrikBaglam\) && \(\s*<button[\s\S]{0,80}setTakvimAcik/.test(s))
    assert.ok(s.includes("useState<'pediatrik' | 'yetiskin'>(cocukHasta ? 'pediatrik' : 'yetiskin')"))
    assert.ok(!/useState<[^>]*>\('pediatrik'\)/.test(s))
    // VELI-YASAL-ONAM: beyan hitabı yaş kuralından (veliDili), takvim klinik kuraldan (pediatrikBaglam) — ayrı eksen
    assert.ok(s.includes('const hitap = hitapMetinleri(veliDili);'))
    const sayfa = kaynak('app/dashboard/doktor/hastalar/[id]/page.tsx')
    assert.ok(/<HastaAsilar[\s\S]{0,300}veliDili=\{veliDiliMi\(\{ doktorBransi, hastaDogumIso: patient\?\.dogum_tarihi \}\)\}/.test(sayfa))
  })

  it('bölüm UI mount\'ları branş kapısının arkasında (derin bağlantı ?tab=deri / ?tab=dahiliye)', () => {
    const s = kaynak('app/dashboard/doktor/hastalar/[id]/page.tsx')
    assert.ok(/activeTab === 'dahiliye' && dahiliyeUygun && <DahiliyeHome/.test(s))
    assert.ok(/activeTab === 'deri' && deriAraci &&/.test(s))
    assert.ok(/activeTab === 'goz' && gozAraci && <GozHome/.test(s))
  })
})

describe('VELI-YASAL-ONAM — reşit olmayan hastada veli dili HER branşta; klinik pediatri içeriği branşta kalır', () => {
  /** Kaan (2026-09-17): "18 yaşını doldurmamış her çocukta klinik kayıt ve tıbbi onam için veli / yasal temsilci bilgisi alınır." */
  const ERGEN = '2010-01-10' // NOW'a göre 16 yaş
  const ON_YEDI = '2008-09-18' // NOW'dan bir gün sonra 18 → hâlâ 17
  const ON_SEKIZ = '2008-09-17' // NOW günü 18 → erişkin
  const PEDIATRI_DISI = ['goz-hastaliklari', 'kulak-burun-bogaz', 'ortopedi', 'kardiyoloji', 'dermatoloji', 'kadin-hastaliklari-dogum', 'dahiliye']

  it('veliOnamGerekliMi: yalnız yaş — <18 true, 18 ve üstü false, bilinmeyen/gelecek tarih false; branş parametresi yok', () => {
    for (const d of [COCUK, ERGEN, ON_YEDI]) assert.equal(veliOnamGerekliMi(d, NOW), true, d)
    for (const d of [ON_SEKIZ, YETISKIN, null, undefined, '', '2030-01-01']) assert.equal(veliOnamGerekliMi(d, NOW), false, String(d))
    assert.equal(veliOnamGerekliMi.length, 1, 'imza: (dogumIso, nowMs?) — branş girdisi yok')
  })

  it('30/30 branş: veli dili = reşit olmayan hasta VEYA (yaşı bilinmeyen + pediatrik bağlam); erişkin HİÇBİR branşta; klinik kapsam değişmedi', () => {
    for (const k of TUM) {
      for (const dogum of [COCUK, ERGEN, YETISKIN, null]) {
        const g = { seansBransi: k, hastaDogumIso: dogum, nowMs: NOW }
        const resit = dogum === COCUK || dogum === ERGEN
        const ped = HER_ZAMAN.has(k) || (KARMA.has(k) && resit)
        // Bilinçli değişiklik (intake veli bölümü işi, Kaan): pediatri / çocuk cerrahisi hekimindeki ERİŞKİN hasta artık
        // "hasta" dilinde — eskiden pediatrik bağlam onu da veli diline çekiyordu. Bilinmeyen yaşta pediatri veli dilinde kalır.
        const veli = resit || (ped && dogum === null)
        assert.equal(pediatrikBaglamMi(g), ped, `${k} / ${dogum}: klinik`)
        assert.equal(veliDiliMi(g), veli, `${k} / ${dogum}: veli dili`)
        const kapsam = bransKapsami(g)
        assert.equal(kapsam.veliDili, veli, `${k} / ${dogum}: paket`)
        assert.equal(kapsam.hitap.ozetEtiketi, veli ? 'Hasta/veli özeti' : 'Hasta özeti', `${k} / ${dogum}`)
        assert.equal(kapsam.olcumler.some((o) => o.anahtar === 'basCevresi'), ped, `${k} / ${dogum}: baş çevresi`)
      }
    }
  })

  it('göz / KBB / ortopedi / kardiyoloji + çocuk hasta: SOAP promptu veli dilinde, ama baş çevresi / Neyzi / prenatal / mg-kg YOK', () => {
    for (const b of PEDIATRI_DISI) {
      // soapSistemPromptu gerçek saati kullanır → ergen doğum tarihi bugüne göre (test yıllar geçtikçe erişkine dönmesin)
      for (const dogum of [COCUK, new Date(Date.now() - 16.3 * 365.25 * 864e5).toISOString().slice(0, 10)]) {
        const p = soapSistemPromptu({ transcript: '', specialty: b, doktorBransi: b, hastaDogumIso: dogum })
        assert.ok(p.includes('Hasta/veli aynı şikayeti') && p.includes('Veli beyanı olduğu belirtilerek') && p.includes('hasta_ozeti: veliye/hastaya'), `${b} / ${dogum}: veli`)
        assert.ok(!p.includes('"basCevresi"') && !/baş çevresi cm|Neyzi standartları|pediatride prenatal|pediatride mg\/kg/.test(p), `${b} / ${dogum}: klinik pediatri`)
      }
      const eriskin = soapSistemPromptu({ transcript: '', specialty: b, doktorBransi: b, hastaDogumIso: YETISKIN })
      assert.ok(!VELI.test(eriskin), `${b} erişkin`)
    }
  })

  it('soapKurallari: veli ekseni klinik eksenden bağımsız; tek argümanla pediatri promptu bayt bayt aynı', () => {
    assert.equal(soapKurallari(true), soapKurallari(true, true))
    assert.equal(soapKurallari(false), soapKurallari(false, false))
    const veliEriskinKlinik = soapKurallari(false, true)
    assert.ok(VELI.test(veliEriskinKlinik) && !veliEriskinKlinik.includes('basCevresi') && !veliEriskinKlinik.includes('Neyzi'))
    assert.ok(!VELI.test(soapKurallari(false, false)))
  })

  it('not-konsult ("↻ Notuma göre yenile"): çocuk hastada göz/KBB/ortopedi/kardiyoloji veli dilinde, Neyzi / baş çevresi anahtarı yok', () => {
    const not = { hasta_ozeti: 'Sentetik özet' }
    for (const b of PEDIATRI_DISI) {
      const kapsam = bransKapsami({ seansBransi: b, hastaDogumIso: COCUK, nowMs: NOW })
      const p = notKonsultSistemPromptu({ kapsam, trtBugun: '2026-09-17', not, taslak: { hastaOzeti: 'x' } })
      assert.ok(p.includes('veliye giden özet') && p.includes('Veli özeti (taslak): x'), b)
      assert.ok(!/Neyzi/.test(p) && !/anahtarlar: [^\n]*basCevresi/.test(p), b)
      assert.equal(kapsam.hitap.ozetYenileIstegi, 'Notun güncel haline göre hasta/veli özetini yeniden yaz.', b)
      const eriskin = notKonsultSistemPromptu({ kapsam: bransKapsami({ seansBransi: b, hastaDogumIso: YETISKIN, nowMs: NOW }), trtBugun: '2026-09-17', not })
      assert.ok(!VELI.test(eriskin), `${b} erişkin`)
    }
  })

  it('epikriz tek vizit: veli beyanı hitabı ayrı eksen — sağlam çocuk / doğum bilgileri yalnız pediatride; pediatri promptu değişmedi', () => {
    const veliEriskinKlinik = epikrizTekVizitSistem(false, true)
    assert.ok(veliEriskinKlinik.includes('Anne beyanına göre') && !/doğum bilgileri|sağlam çocuk/.test(veliEriskinKlinik))
    assert.equal(epikrizTekVizitSistem(true), epikrizTekVizitSistem(true, true))
    assert.equal(epikrizTekVizitSistem(false), epikrizTekVizitSistem(false, false))
    assert.ok(!/Anne beyanı/.test(epikrizTekVizitSistem(false)))
  })

  it('yazdır / İnceleme etiketleri: çocuk hasta her branşta "Hasta / Veli Özeti", erişkin "Hasta Özeti"; pediatri/çocuk cerrahisi aynen', () => {
    for (const b of PEDIATRI_DISI) {
      assert.equal(bransKapsami({ seansBransi: b, hastaDogumIso: ERGEN, nowMs: NOW }).hitap.ozetYazdirEtiketi, 'Hasta / Veli Özeti', b)
      assert.equal(bransKapsami({ seansBransi: b, hastaDogumIso: YETISKIN, nowMs: NOW }).hitap.ozetYazdirEtiketi, 'Hasta Özeti', b)
      assert.equal(hitapMetinleri(veliDiliMi({ seansBransi: b, hastaDogumIso: COCUK, nowMs: NOW })).beyanEtiketi, 'Hasta/veli beyanı', `${b}: Aşılar beyan`)
      assert.equal(hitapMetinleri(veliDiliMi({ seansBransi: b, hastaDogumIso: YETISKIN, nowMs: NOW })).beyanEtiketi, 'Hasta beyanı', `${b}: Aşılar beyan erişkin`)
    }
    for (const b of ['pediatri', 'cocuk-cerrahisi']) {
      for (const dogum of [COCUK, null]) {
        const k = bransKapsami({ seansBransi: b, hastaDogumIso: dogum, nowMs: NOW })
        assert.ok(k.pediatrik && k.veliDili && k.olcumler.some((o) => o.anahtar === 'basCevresi'), `${b} / ${dogum}`)
        assert.equal(k.hitap.ozetYazdirEtiketi, 'Hasta / Veli Özeti', `${b} / ${dogum}`)
      }
    }
  })
})

describe('INTAKE VELI + ACİL KİŞİ — hasta bilgi formu: veli bölümü yaş güdümlü (her branş), acil durum kişisi herkese isteğe bağlı', () => {
  /** Sentetik QA yanıtları — gerçek hasta verisi DEĞİL. Acil durum kişisi BİLEREK boş. */
  const temel = (dogumTarihi: string): Record<string, unknown> => ({
    tcKimlik: '12345678901', ad: 'Sentetik', soyad: 'Test', dogumTarihi, cinsiyet: 'Kadın', dogumYeri: 'Ankara',
    babaAdi: 'Test', anneAdi: 'Test', medeniDurum: 'Bekâr', telefon: '05551112233', eposta: 'qa@ornek.test',
    adres: 'Test Mah. 1. Sok. No:1', sigortaTuru: 'SGK', kanGrubu: 'A Rh+', kronikHastaliklar: ['Yok'], kullaniyorMu: 'Hayır',
    alerjiVarMi: 'Bilinen alerjisi yok', aileOykusu: 'Yok', sigara: 'Kullanmıyorum', alkol: 'Kullanmıyorum', kvkkOnay: 'Kabul ediyorum',
  })
  const VELI_YANIT = { veliAd: 'Sentetik', veliSoyad: 'Veli', veliYakinligi: 'Anne', veliTelefon: '05553334455' }
  const ERGEN = '2010-01-10' // NOW'a göre 16 yaş
  const ON_YEDI = '2008-09-18' // NOW'dan bir gün sonra 18 → hâlâ 17
  const ON_SEKIZ = '2008-09-17' // NOW günü 18 → erişkin
  const bolumlerIcin = (b: string) => intakeFormBolumleri(coreBolumlerIcin(b), (BRANS_SORULARI as Record<string, IntakeBolum>)[b] ?? null)
  const cizim = (b: string, y: Record<string, unknown>) =>
    renderToStaticMarkup(React.createElement(IntakeBolumleri, { bolumler: bolumlerIcin(b), yanitlar: y, onDegis: () => {}, nowMs: NOW }))
  const gorunenBasliklar = (b: string, y: Record<string, unknown>) => intakeGorunurBolumler(bolumlerIcin(b), y, NOW).map((x) => x.baslik)

  it('veli bölümü ortak omurgada, TEK tanım, yaş kapısı veliOnamGerekliMi — branş listesinde veli alanı yok (30/30)', () => {
    for (const k of TUM) {
      const core = coreBolumlerIcin(k)
      assert.equal(core.filter((b) => b.veliKosulu).length, 1, k)
      assert.equal(core.find((b) => b.veliKosulu), VELI_BOLUMU, `${k}: aynı nesne — branşa göre değişmez`)
      assert.ok(!(BRANS_SORULARI[k]?.alanlar || []).some((a) => /^veli/i.test(a.id) || VELI.test(a.etiket)), `${k}: branş bölümünde veli alanı`)
    }
    const s = kaynak('lib/intake/dogrula.ts')
    assert.ok(s.includes("import { veliOnamGerekliMi } from '@/lib/specialties/kapsam'") && /veliOnamGerekliMi\(dogum, nowMs\)/.test(s), 'yaş kuralı yeniden yazılmadı')
  })

  it('veli alanları: ad, soyad, yakınlık (Anne/Baba/Vasi/Diğer), "Diğer" metni, telefon zorunlu; kimlik teyidi isteğe bağlı', () => {
    const a = Object.fromEntries(VELI_BOLUMU.alanlar.map((x) => [x.id, x]))
    for (const id of ['veliAd', 'veliSoyad', 'veliYakinligi', 'veliTelefon']) assert.equal(a[id]?.zorunlu, true, id)
    assert.deepEqual(a.veliYakinligi.secenekler, ['Anne', 'Baba', 'Vasi', 'Diğer'])
    assert.equal(a.veliTelefon.tur, 'tel')
    assert.ok(a.veliDigerAdSoyad && !a.veliDigerAdSoyad.zorunlu && /Diğer/.test(a.veliDigerAdSoyad.yardim || ''))
    assert.equal(a.veliKimlikTeyidi.zorunlu, undefined)
    assert.deepEqual(a.veliKimlikTeyidi.secenekler, ['Kimlik teyidi yapıldı'])
  })

  it('acil durum kişisi: ayrı bölüm, her branşta, HİÇBİR alanı zorunlu değil, veli alanlarıyla ortak id/etiket yok', () => {
    for (const k of TUM) {
      const acil = coreBolumlerIcin(k).filter((b) => b.baslik.startsWith('Acil Durumda Aranacak Kişi'))
      assert.equal(acil.length, 1, k)
      assert.equal(acil[0].veliKosulu, undefined, `${k}: yaş kapısı yok`)
      assert.deepEqual(acil[0].alanlar.map((x) => x.id).sort(), ['acilKisiAdi', 'acilKisiTelefon', 'acilKisiYakinlik'])
      for (const alan of coreBolumlerIcin(k).flatMap((b) => b.alanlar).filter((x) => x.id.startsWith('acilKisi'))) {
        assert.ok(!alan.zorunlu, `${k}/${alan.id}: zorunlu olmamalı (kalıcı kural)`)
      }
    }
    const veliEtiketleri = new Set(VELI_BOLUMU.alanlar.map((x) => x.etiket))
    for (const alan of CORE_BOLUMLER.find((b) => b.baslik.startsWith('Acil'))!.alanlar) assert.ok(!veliEtiketleri.has(alan.etiket) && !VELI.test(alan.etiket), alan.id)
  })

  it('görünürlük: <18 → Veli bölümü + Acil bölümü; ≥18 (pediatri dahil) → yalnız Acil; doğum tarihi yokken veli yok', () => {
    for (const b of ['pediatri', 'goz-hastaliklari', 'kardiyoloji', 'kulak-burun-bogaz', 'ortopedi', 'cocuk-cerrahisi', 'dahiliye']) {
      for (const dogum of [COCUK, ERGEN, ON_YEDI]) {
        const bas = gorunenBasliklar(b, { dogumTarihi: dogum })
        assert.ok(bas.includes('Veli / Yasal Temsilci') && bas.includes('Acil Durumda Aranacak Kişi (isteğe bağlı)'), `${b} / ${dogum}`)
      }
      for (const dogum of [ON_SEKIZ, YETISKIN, '2006-01-01']) {
        const bas = gorunenBasliklar(b, { dogumTarihi: dogum })
        assert.ok(!bas.includes('Veli / Yasal Temsilci') && bas.includes('Acil Durumda Aranacak Kişi (isteğe bağlı)'), `${b} / ${dogum}`)
      }
      assert.ok(!gorunenBasliklar(b, {}).includes('Veli / Yasal Temsilci'), `${b}: doğum tarihi girilmeden`)
    }
  })

  it('gerçek render (IntakeBolumleri): erişkin formunda "veli" kelimesi yok — pediatri hekimindeki 20 yaşındaki hasta dahil; çocukta veli alanları yıldızlı, acil alanları yıldızsız', () => {
    for (const b of ['pediatri', 'goz-hastaliklari', 'kardiyoloji']) {
      const eriskin = cizim(b, { dogumTarihi: '2006-03-10' })
      assert.ok(!VELI.test(eriskin), `${b}: erişkin formunda veli`)
      assert.ok(eriskin.includes('Acil Durumda Aranacak Kişi (isteğe bağlı)') && eriskin.includes('Acil Durum Kişisi Telefonu'), b)
      const cocuk = cizim(b, { dogumTarihi: COCUK })
      assert.ok(cocuk.includes('Veli / Yasal Temsilci') && cocuk.includes('Vasi') && cocuk.includes('Kimlik teyidi yapıldı'), b)
      assert.match(cocuk, /Veli \/ Yasal Temsilcinin Telefonu<span[^>]*> \*<\/span>/, `${b}: veli telefonu zorunlu işaretli`)
      for (const e of ['Acil Durumda Aranacak Kişi (Ad Soyad)', 'Acil Durum Kişisinin Yakınlık Derecesi', 'Acil Durum Kişisi Telefonu']) {
        assert.ok(cocuk.includes(`${e}</label>`), `${b}: ${e} yıldızsız`)
      }
      // Numara boşluk bırakmaz: erişkinde Acil bölümü 3., çocukta 4. (Kimlik, [Veli], İletişim, Acil …)
      assert.match(eriskin, />3<\/span><h3[^>]*>Acil Durumda/)
      assert.match(cocuk, />2<\/span><h3[^>]*>Veli \/ Yasal Temsilci/)
      assert.match(cocuk, />4<\/span><h3[^>]*>Acil Durumda/)
    }
  })

  it('doğrulama (istemci + sunucu aynı kod): acil kişisi tamamen boş form geçer; çocukta veli zorunlu; erişkinde veli istenmez', () => {
    for (const b of ['pediatri', 'goz-hastaliklari', 'kardiyoloji']) {
      const core = coreBolumlerIcin(b)
      assert.equal(intakeSunucuHataMetni(core, temel(YETISKIN), NOW), null, `${b}: erişkin, acil boş`)
      assert.equal(intakeIstemciHataMetni(core, temel(YETISKIN), NOW), null, `${b}: erişkin, acil boş (istemci)`)
      assert.match(String(intakeSunucuHataMetni(core, temel(COCUK), NOW)), /Veli \/ Yasal Temsilcinin Adı/, `${b}: çocukta veli eksik`)
      assert.match(String(intakeIstemciHataMetni(core, { ...temel(COCUK), ...VELI_YANIT, veliTelefon: '' }, NOW)), /Veli \/ Yasal Temsilcinin Telefonu/)
      assert.equal(intakeSunucuHataMetni(core, { ...temel(COCUK), ...VELI_YANIT }, NOW), null, `${b}: çocuk, veli dolu, acil + kimlik teyidi boş`)
    }
  })

  it('kayıt süzgeci: erişkin formunda gönderilen veli alanları atılır; çocukta kalır; acil kişisi ve bilinmeyen anahtarlar korunur', () => {
    const core = coreBolumlerIcin('kardiyoloji')
    const eriskin = intakeGorunmeyenYanitlariAyikla(core, { ...temel(YETISKIN), ...VELI_YANIT, acilKisiAdi: 'Sentetik Yakın', semptomlarKardiyo: ['Çarpıntı'] }, NOW)
    assert.ok(!Object.keys(eriskin).some((x) => x.startsWith('veli')), 'erişkinde veli izi')
    assert.equal(eriskin.acilKisiAdi, 'Sentetik Yakın')
    assert.deepEqual(eriskin.semptomlarKardiyo, ['Çarpıntı'])
    const cocuk = intakeGorunmeyenYanitlariAyikla(core, { ...temel(COCUK), ...VELI_YANIT }, NOW)
    assert.equal(cocuk.veliYakinligi, 'Anne')
  })

  it('kaynak kilidi: form sayfası bölümleri IntakeBolumleri ile çizer, gizlenen yanıtı atar; intake POST süzülmüş yanıtı şifreler', () => {
    const sayfa = kaynak('app/intake/[token]/page.tsx')
    assert.ok(sayfa.includes('<IntakeBolumleri bolumler={tumBolumler}') && sayfa.includes('intakeGorunmeyenYanitlariAyikla(bolumler'))
    assert.ok(!/bolum\.alanlar\.map/.test(sayfa), 'sayfa bölümleri kendisi çizmemeli (kapı atlanır)')
    const rota = kaynak('app/api/intake/[token]/route.ts')
    assert.ok(/encrypt\(JSON\.stringify\(kayitYanitlari\)\)/.test(rota))
    const derleyici = kaynak('lib/doktor/hastaDosyaDerleyici.ts')
    for (const id of ['veliAd', 'veliSoyad', 'veliTelefon', 'acilKisiTelefon']) assert.ok(derleyici.includes(`'${id}'`), `${id} modele gitmez`)
  })

  it('muayene çek listesi: baş çevresi / aşı yalnız pediatrik bağlamda; kutu evrensel', () => {
    const kdCocuk = muayeneCekListesi({ seansBransi: 'kadin-hastaliklari-dogum', hastaDogumIso: COCUK })
    const ped = muayeneCekListesi({ seansBransi: 'pediatri', hastaDogumIso: COCUK })
    assert.ok(ped.some((m) => m.id === 'basCevresi'))
    assert.ok(!kdCocuk.some((m) => m.id === 'basCevresi' || m.id === 'asi' || m.id === 'prenatal'))
    const seans = kaynak('app/session/new/page.tsx')
    assert.ok(seans.includes('MuayeneCekListesi') && seans.includes('muayeneCekListesi'))
    assert.ok(!/Baş Çevresi/.test(seans))
  })
})

