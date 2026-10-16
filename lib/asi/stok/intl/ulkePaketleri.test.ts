/**
 * NOTYA-ASI-STOK-BARKOD-01 Phase 2 — proves the Phase 1 engine needs zero code changes for a 6th
 * country: every pack below type-checks against `AsiStokUlkePaketi`, every pack's `barkod.standart`
 * is 'GS1' (so a sample AI string for any of these six decodes through the SAME `gs1Coz()`/
 * `barkodBilgisi()` Phase 1 already ships), and the branş-default list is identical across all six
 * — proving `ASI_STOK_VARSAYILAN_ACIK_BRANSLAR` in `lib/asi/stok/modul.ts` needs no per-country edit.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gs1Coz, barkodBilgisi } from '../barkod'
import { ASI_STOK_VARSAYILAN_ACIK_BRANSLAR } from '../modul'
import { ASI_STOK_ULKE_PAKETLERI, asiStokUlkePaketiGetir, type AsiStokUlkeKodu } from './ulkePaketleri'

const KODLAR: AsiStokUlkeKodu[] = ['au', 'ca', 'gb', 'nz', 'us', 'uz']

describe('NOTYA-ASI-STOK-BARKOD-01 Phase 2 · ülke paketleri (reusable engine, no code change per country)', () => {
  it('altı ülke paketi de tanımlı, her biri pediatri branşını ve kendi dilini taşıyor', () => {
    assert.equal(KODLAR.length, 6)
    for (const kod of KODLAR) {
      const paket = ASI_STOK_ULKE_PAKETLERI[kod]
      assert.equal(paket.ulkeKodu, kod)
      assert.equal(paket.pediatriBransi, 'pediatri')
      assert.ok(paket.dil.length > 0)
    }
  })

  it('her ülke paketinin dili birbirinden farklı (yanlışlıkla tr veya aynı locale kopyalanmamış)', () => {
    const diller = KODLAR.map((k) => ASI_STOK_ULKE_PAKETLERI[k].dil)
    assert.equal(new Set(diller).size, diller.length)
    assert.ok(!diller.includes('tr'))
  })

  it('varsayılan açık branş listesi 6 ülkede de AYNI 5 branş — hiçbiri branş anahtarını değiştirmemiş', () => {
    const beklenen = [...ASI_STOK_VARSAYILAN_ACIK_BRANSLAR].sort()
    for (const kod of KODLAR) {
      const paket = ASI_STOK_ULKE_PAKETLERI[kod]
      assert.deepEqual([...paket.varsayilanAcikBranslar].sort(), beklenen)
    }
  })

  it('6 ülkenin de barkod standardı GS1 — Faz 1 gs1Coz() hiçbir ülke için özel kod istemeden aynı AI setini çözer', () => {
    for (const kod of KODLAR) {
      assert.equal(ASI_STOK_ULKE_PAKETLERI[kod].barkod.standart, 'GS1')
    }
    // Örnek: herhangi bir ülkenin GS1 DataMatrix çıktısı (01=GTIN, 17=SKT, 10=lot) — motor kodu ülkeye göre dallanmıyor.
    const GS = String.fromCharCode(29)
    const ornekHam = `0108680000123456` + `17270615` + `10LOT-AU-01` + GS
    const cozum = gs1Coz(ornekHam)
    assert.ok(cozum)
    assert.equal(cozum!.gtin, '08680000123456')
    assert.equal(cozum!.sktIso, '2027-06-15')
    assert.equal(cozum!.lotNo, 'LOT-AU-01')
    const bilgi = barkodBilgisi(ornekHam)
    assert.equal(bilgi.anahtar, [cozum!.gtin, cozum!.lotNo].join('|'))
  })

  it('her paket üç araştırma alanını da (barkod/dijital kayıt/lot-takip hukuku) güven düzeyi + en az bir kaynakla taşıyor (UZ lot-takip hariç — dürüst UNCONFIRMED, kasıtlı kaynaksız)', () => {
    const GUVEN_DUZEYLERI = new Set(['VERIFIED', 'BEST-EFFORT', 'MODERATE', 'UNCONFIRMED'])
    for (const kod of KODLAR) {
      const paket = ASI_STOK_ULKE_PAKETLERI[kod]
      assert.ok(GUVEN_DUZEYLERI.has(paket.barkod.guven))
      assert.ok(paket.barkod.kaynaklar.length >= 1, `${kod}: barkod kaynaksız`)
      assert.ok(GUVEN_DUZEYLERI.has(paket.lotTakipHukuku.guven))
      if (kod !== 'uz') assert.ok(paket.lotTakipHukuku.kaynaklar.length >= 1, `${kod}: lot-takip kaynaksız`)
      // dijitalKayitSistemi: varMi false olabilir (CA/US) ama guven kavramı yok — kapsam/not dolu olmalı.
      assert.ok(paket.dijitalKayitSistemi.not.length > 0)
    }
  })

  it('UZ lot-takip hukuku dürüst UNCONFIRMED ve kaynaksız — icat edilmiş yasal iddia yok', () => {
    const uz = ASI_STOK_ULKE_PAKETLERI.uz
    assert.equal(uz.lotTakipHukuku.guven, 'UNCONFIRMED')
    assert.deepEqual(uz.lotTakipHukuku.kaynaklar, [])
  })

  it('CA ve US için dijital kayıt sistemi dürüstçe yok (false) — tek ulusal e-Nabız eşdeğeri icat edilmemiş', () => {
    assert.equal(ASI_STOK_ULKE_PAKETLERI.ca.dijitalKayitSistemi.varMi, false)
    assert.equal(ASI_STOK_ULKE_PAKETLERI.us.dijitalKayitSistemi.varMi, false)
  })

  it('AU dijital kayıt sistemi gerçek, ulusal ve yasal olarak zorunlu (AIR) — altı ülkenin en net e-Nabız eşdeğeri', () => {
    const au = ASI_STOK_ULKE_PAKETLERI.au
    assert.equal(au.dijitalKayitSistemi.varMi, true)
    assert.equal(au.dijitalKayitSistemi.kapsam, 'ulusal')
    assert.equal(au.dijitalKayitSistemi.zorunluMu, true)
    assert.ok(au.dijitalKayitSistemi.adi?.includes('AIR'))
  })

  it('asiStokUlkePaketiGetir: bilinen kod paketini döner, büyük/küçük harf duyarsız, bilinmeyen/boş kod null döner', () => {
    assert.equal(asiStokUlkePaketiGetir('au')?.ulkeKodu, 'au')
    assert.equal(asiStokUlkePaketiGetir('AU')?.ulkeKodu, 'au')
    assert.equal(asiStokUlkePaketiGetir('tr'), null)
    assert.equal(asiStokUlkePaketiGetir(null), null)
    assert.equal(asiStokUlkePaketiGetir(undefined), null)
    assert.equal(asiStokUlkePaketiGetir(''), null)
  })
})
