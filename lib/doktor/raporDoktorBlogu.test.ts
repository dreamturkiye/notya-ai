import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { raporDoktorBlogu, raporDoktorAlani } from './raporDoktorBlogu'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Minimal fake Supabase client — just enough chain surface for raporDoktorBlogu's two
 * reads (`users`, `doctor_integrations`). Not the full synthetic DB harness
 * (lib/security/testing/sahteSupabase.ts): this helper takes no patient id and runs no
 * ownership check, so a plain fake is enough to test its own composition logic.
 */
function fakeSb(usersRow: Record<string, unknown> | null, medulaMeta: Record<string, unknown> | null) {
  const builder = (row: unknown) => ({
    select: () => builder(row),
    eq: () => builder(row),
    maybeSingle: async () => ({ data: row, error: null }),
  })
  return {
    from(table: string) {
      if (table === 'users') return builder(usersRow)
      if (table === 'doctor_integrations') return builder(medulaMeta ? { meta: medulaMeta } : null)
      throw new Error(`unexpected table ${table}`)
    },
  } as unknown as SupabaseClient
}

describe('raporDoktorBlogu', () => {
  it('dolu profil: unvan eklenir (NOTYA-UNVAN-01), resmî uzmanlık adı (NOTYA-EPIKRIZ-04), diploma recete_baslik’tan', async () => {
    const sb = fakeSb(
      {
        full_name: 'Ayşe Kaya',
        specialty: 'pediatri',
        clinic_name: 'Kaya Çocuk Kliniği',
        recete_baslik: { satirlar: ['Bağdat Cad. No:1, İstanbul', '0532 123 45 67'], diplomaNo: '12345' },
        email: 'ayse@example.com',
      },
      null
    )
    const blok = await raporDoktorBlogu(sb, 'doktor-1')
    assert.equal(blok.unvanliAdSoyad, 'Dr. Ayşe Kaya')
    assert.equal(blok.uzmanlik, 'Çocuk Sağlığı ve Hastalıkları')
    assert.equal(blok.klinikAdi, 'Kaya Çocuk Kliniği')
    assert.equal(blok.diplomaTescilNo, '12345')
    assert.equal(blok.eposta, 'ayse@example.com')
    assert.match(blok.adres || '', /Bağdat/)
    assert.match(blok.telefon || '', /532/)
  })

  it('unvan zaten adın içindeyse ikilenmez', async () => {
    const sb = fakeSb({ full_name: 'Prof. Dr. Gökhan Mamur', specialty: 'pediatri', clinic_name: null, recete_baslik: null, email: null }, null)
    const blok = await raporDoktorBlogu(sb, 'doktor-1')
    assert.equal(blok.unvanliAdSoyad, 'Prof. Dr. Gökhan Mamur')
  })

  it('recete_baslik diplomaNo yoksa Medula meta’ya düşer', async () => {
    const sb = fakeSb(
      { full_name: 'Kaan Arıoğlu', specialty: 'dahiliye', clinic_name: null, recete_baslik: {}, email: null },
      { diplomaTescilNo: '99999' }
    )
    const blok = await raporDoktorBlogu(sb, 'doktor-1')
    assert.equal(blok.diplomaTescilNo, '99999')
  })

  it('hiçbir kaynakta diploma yoksa null döner — sahte veri üretilmez', async () => {
    const sb = fakeSb({ full_name: 'Kaan Arıoğlu', specialty: null, clinic_name: null, recete_baslik: null, email: null }, null)
    const blok = await raporDoktorBlogu(sb, 'doktor-1')
    assert.equal(blok.diplomaTescilNo, null)
    assert.equal(blok.uzmanlik, '')
  })

  it('kayıt bulunamazsa (null row) varsayılan "Dr." unvanına düşer, hiçbir alan uydurulmaz', async () => {
    const sb = fakeSb(null, null)
    const blok = await raporDoktorBlogu(sb, 'doktor-1')
    assert.equal(blok.unvanliAdSoyad, 'Dr.')
    assert.equal(blok.klinikAdi, null)
    assert.equal(blok.adres, null)
  })
})

describe('raporDoktorAlani', () => {
  it('boş/null alanda "profilde tamamlayın" notu', () => {
    assert.match(raporDoktorAlani(null), /profilde tamamlayın/)
    assert.match(raporDoktorAlani(''), /profilde tamamlayın/)
    assert.match(raporDoktorAlani('   '), /profilde tamamlayın/)
  })

  it('değer varsa aynen döner', () => {
    assert.equal(raporDoktorAlani('12345'), '12345')
  })
})
