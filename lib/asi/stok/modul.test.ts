import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import {
  ASI_STOK_VARSAYILAN_ACIK_BRANSLAR,
  asiStokBransVarsayilaniAcikMi,
  asiStokEtkinDurum,
  getAsiStokModulAyari,
  setAsiStokModulAyari,
} from './modul'

describe('NOTYA-ASI-STOK-BARKOD-01: branş varsayılanı + hekim override', () => {
  it('5 isimli branş varsayılan açık', () => {
    for (const b of ['pediatri', 'aile-hekimligi', 'enfeksiyon-hastaliklari', 'kadin-hastaliklari-dogum', 'dahiliye']) {
      assert.equal(asiStokBransVarsayilaniAcikMi(b), true, b)
    }
    assert.equal(ASI_STOK_VARSAYILAN_ACIK_BRANSLAR.length, 5)
  })

  it('diğer branşlar (örn. kardiyoloji, göz) varsayılan kapalı', () => {
    assert.equal(asiStokBransVarsayilaniAcikMi('kardiyoloji'), false)
    assert.equal(asiStokBransVarsayilaniAcikMi('goz-hastaliklari'), false)
    assert.equal(asiStokBransVarsayilaniAcikMi(null), false)
  })

  it('override NULL ise branş varsayılanı geçerli; override doluysa branşı ezer', () => {
    assert.equal(asiStokEtkinDurum({ doktorId: 'd', aktifOverride: null, faturaVarsayilan: false }, 'kardiyoloji'), false)
    assert.equal(asiStokEtkinDurum({ doktorId: 'd', aktifOverride: true, faturaVarsayilan: false }, 'kardiyoloji'), true)
    assert.equal(asiStokEtkinDurum({ doktorId: 'd', aktifOverride: false, faturaVarsayilan: false }, 'pediatri'), false)
  })

  it('getAsiStokModulAyari: satır yoksa varsayılan (override null, fatura false)', async () => {
    const db = new SahteVeritabani()
    const supabase = db.istemci() as any
    const ayar = await getAsiStokModulAyari(supabase, 'doktor-1')
    assert.equal(ayar.aktifOverride, null)
    assert.equal(ayar.faturaVarsayilan, false)
  })

  it('setAsiStokModulAyari: yazar, sonra okunan değer aynı; null geri "branş varsayılanına dön" demek', async () => {
    const db = new SahteVeritabani()
    const supabase = db.istemci() as any
    await setAsiStokModulAyari(supabase, 'doktor-1', { aktifOverride: true })
    let ayar = await getAsiStokModulAyari(supabase, 'doktor-1')
    assert.equal(ayar.aktifOverride, true)

    await setAsiStokModulAyari(supabase, 'doktor-1', { aktifOverride: null })
    ayar = await getAsiStokModulAyari(supabase, 'doktor-1')
    assert.equal(ayar.aktifOverride, null)
  })

  it('iki doktorun ayarı birbirinden bağımsız (izolasyon)', async () => {
    const db = new SahteVeritabani()
    const supabase = db.istemci() as any
    await setAsiStokModulAyari(supabase, 'doktor-A', { aktifOverride: true })
    const b = await getAsiStokModulAyari(supabase, 'doktor-B')
    assert.equal(b.aktifOverride, null)
  })
})
