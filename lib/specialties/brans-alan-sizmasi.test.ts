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
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { SpecialtyKey } from '@/lib/asistan/turkishSpecialtyRefs'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'
import { specialtyProfile } from './registry'
import { PEDIATRIK_BAGLAM } from './profile'
import { bransAnahtari, bransKapsami, etkinBrans, notOlcumleri, pediatrikBaglamMi, vitalleriKapsamaGoreSuz } from './kapsam'
import { hitapMetinleri } from './hitap'
import { istemciKapsami } from './kapsamIstemci'
import { soapKurallari, soapSistemPromptu } from '@/lib/doktor/soapUret'
import { notKonsultSistemPromptu } from '@/lib/doktor/notKonsultPromptu'
import { epikrizKapsamliSistem, epikrizKlinikSatiri, epikrizTekVizitSistem, epikrizUnvanSatiri } from '@/lib/doktor/epikrizMetinleri'
import { dahiliyeSekmesiBransi, pediatriAracSekmesiUygun } from '@/lib/doktor/hastaDosyaSekmeleri'
import YasamsalBulgularFormu from '@/components/doktor/YasamsalBulgularFormu'

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

describe('HATA 2 — "veli" dili yalnız pediatrik bağlamda (hasta/veli özeti)', () => {
  it('hitap metinleri: erişkin setinde veli/anne-baba yok; pediatrik set veli der', () => {
    assert.ok(!VELI.test(JSON.stringify(hitapMetinleri(false))))
    assert.equal(hitapMetinleri(false).ozetEtiketi, 'Hasta özeti')
    assert.equal(hitapMetinleri(true).ozetEtiketi, 'Hasta/veli özeti')
    assert.equal(hitapMetinleri(null).ozetEtiketi, 'Hasta özeti')
  })

  it('KD / dahiliye / derm / göz / kardiyoloji / genel cerrahi: SOAP üretim promptunda veli yok', () => {
    for (const b of YETISKIN_ORNEKLERI) {
      const p = soapSistemPromptu({ transcript: '', specialty: 'genel', doktorBransi: b })
      assert.ok(!VELI.test(p), b)
      const p2 = soapSistemPromptu({ transcript: '', specialty: b, doktorBransi: b, hastaDogumIso: COCUK })
      assert.ok(!VELI.test(p2), `${b} çocuk hasta`)
    }
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
    for (const b of ['genel-cerrahi', 'gogus-cerrahisi', 'Göğüs Cerrahisi', 'kalp-damar-cerrahisi', 'kadin-dogum', 'goz-hastaliklari', 'pediatri', '']) {
      assert.equal(dahiliyeSekmesiBransi(b), false, b)
    }
    for (const b of ['dahiliye', 'İç Hastalıkları', 'aile-hekimligi', 'genel', 'kardiyoloji', 'gogus-hastaliklari', 'endokrinoloji']) {
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
  })

  it('bölüm UI mount\'ları branş kapısının arkasında (derin bağlantı ?tab=deri / ?tab=dahiliye)', () => {
    const s = kaynak('app/dashboard/doktor/hastalar/[id]/page.tsx')
    assert.ok(/activeTab === 'dahiliye' && dahiliyeUygun && <DahiliyeHome/.test(s))
    assert.ok(/activeTab === 'deri' && deriAraci &&/.test(s))
    assert.ok(/activeTab === 'goz' && gozAraci && <GozHome/.test(s))
  })
})
