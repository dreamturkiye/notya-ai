/**
 * ARACLAR-GRUPLAMA-01 — "çekirdek üstte, branş altta" YALNIZ sunum sırasıdır.
 *
 * Bu dosyanın asıl işi bir regresyonu önlemek: gruplama bir GÖRÜNÜRLÜK KAPISINA
 * dönüşmemeli. doktorAraclariGruplu, doktorAraclariListesi'nin döndürdüğü kümeyi
 * ne büyütür ne küçültür; yalnız ikiye ayırıp sıralar.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { doktorAraclariGruplu, doktorAraclariListesi } from './doktorAraclari'
import { BRANS_ETIKETLERI } from '@/lib/intake/bransSorulari'

const ANAHTARLAR = Object.keys(BRANS_ETIKETLERI)

test('gruplama görünürlüğü DEĞİŞTİRMEZ: her branşta gruplardaki araçlar = düz listedeki araçlar', () => {
  for (const b of [...ANAHTARLAR, null, 'kadin-dogum', 'bilinmeyen-brans']) {
    const duz = doktorAraclariListesi(b as string | null)
    const gruplu = doktorAraclariGruplu(b as string | null).flatMap((g) => g.araclar)
    assert.deepEqual(
      [...gruplu.map((a) => a.route)].sort(),
      [...duz.map((a) => a.route)].sort(),
      `${b}: gruplama araç kümesini değiştirmemeli (kapı değil, sıralama)`,
    )
  }
})

test('çekirdek grubu HER ZAMAN ilk sırada ve yalnız evrensel araçları taşır', () => {
  for (const b of [...ANAHTARLAR, null]) {
    const gruplar = doktorAraclariGruplu(b as string | null)
    assert.ok(gruplar.length >= 1, `${b}: en az bir grup olmalı`)
    assert.equal(gruplar[0].anahtar, 'cekirdek', `${b}: çekirdek üstte olmalı`)
    for (const a of gruplar[0].araclar) {
      assert.equal(a.branslar, null, `${b}: çekirdek grubunda branşa özel araç olmamalı (${a.route})`)
    }
  }
})

test('branş grubu yalnız branşa özel araçları taşır ve çekirdekten sonra gelir', () => {
  for (const b of ANAHTARLAR) {
    const gruplar = doktorAraclariGruplu(b)
    const bransGrubu = gruplar.find((g) => g.anahtar === 'brans')
    if (!bransGrubu) continue // araçsız branş: yalnız çekirdek görünür, bu geçerli
    assert.equal(gruplar.indexOf(bransGrubu), 1, `${b}: branş grubu çekirdekten sonra gelmeli`)
    for (const a of bransGrubu.araclar) {
      assert.notEqual(a.branslar, null, `${b}: branş grubunda evrensel araç olmamalı (${a.route})`)
    }
  }
})

test('branşı olmayan hekim: yalnız çekirdek grubu, boş branş bölümü render edilmez', () => {
  const gruplar = doktorAraclariGruplu(null)
  assert.equal(gruplar.length, 1)
  assert.equal(gruplar[0].anahtar, 'cekirdek')
})

test('branş başlığı ham anahtar sızdırmaz (KD-ISIMLENDIRME-01)', () => {
  const kd = doktorAraclariGruplu('kadin-dogum').find((g) => g.anahtar === 'brans')
  if (kd) {
    assert.ok(!kd.baslik.includes('kadin-dogum'), 'ham anahtar başlıkta görünmemeli')
    assert.ok(!kd.baslik.includes('-'), `başlık okunur olmalı: ${kd.baslik}`)
  }
})
