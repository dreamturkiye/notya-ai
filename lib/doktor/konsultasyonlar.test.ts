/**
 * KONSULTASYONLAR-01 — defter · jeton · portal dilim · beklenen gün vurgusu · vault türleri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { defterDogrula, defterBransEtiketi } from './konsultasyonDefter'
import {
  konsultanJetonu,
  konsultanJetonuCoz,
  portalJetonHam,
  portalJetonHash,
  portalJetonSonu,
} from './konsultanJeton'
import {
  asistanOnNotYaz,
  konsultanDilimi,
  konsultanNotDogrula,
  portalBelgeDogrula,
  BELGE_TURU_REDDEDILDI,
} from './konsultanPortal'
import {
  BEKLEME_DIKKAT_GUN,
  BEKLEME_KIRMIZI_GUN,
  beklemeGunu,
  beklemeVurgusu,
  istemDogrula,
} from './konsultasyon'
import { assertAllowedUpload, VaultValidationError } from '@/lib/vault/validation'
import { VAULT_ALLOWED_MIME } from '@/lib/vault/types'

describe('konsultasyon defter', () => {
  it('KBB hekimi eklenir', () => {
    const d = defterDogrula({
      adSoyad: 'Dr. Ayşe KBB',
      brans: 'kulak-burun-bogaz',
      eposta: 'ayse@ornek.com',
      telefon: '05321234567',
      kurumIci: false,
    })
    assert.ok(!('hata' in d))
    if ('hata' in d) return
    assert.equal(d.girdi.ad_soyad, 'Dr. Ayşe KBB')
    assert.equal(d.girdi.brans, 'kulak-burun-bogaz')
    assert.equal(d.girdi.eposta, 'ayse@ornek.com')
    assert.ok(defterBransEtiketi('kulak-burun-bogaz').length > 1)
  })

  it('geçersiz e-posta reddedilir', () => {
    const d = defterDogrula({ adSoyad: 'Dr X', brans: 'dahiliye', eposta: 'degil' })
    assert.ok('hata' in d)
  })
})

describe('konsültan jeton (randevu deseni)', () => {
  const GIZLI = 'qa-konsultan-jeton-sirri'
  const SEVK = '11111111-1111-4111-8111-111111111111'

  it('imzalar ve çözer', () => {
    const son = Date.now() + 86_400_000
    const j = konsultanJetonu(SEVK, son, GIZLI)
    assert.ok(j)
    const c = konsultanJetonuCoz(j!, Date.now(), GIZLI)
    assert.deepEqual(c, { sevkId: SEVK, son: Math.floor(son) })
  })

  it('süresi dolmuş jeton reddedilir', () => {
    const son = Date.now() - 1000
    const j = konsultanJetonu(SEVK, son, GIZLI)!
    assert.equal(konsultanJetonuCoz(j, Date.now(), GIZLI), null)
  })

  it('hash deseni kararlı', () => {
    const ham = portalJetonHam()
    assert.equal(portalJetonHash(ham), portalJetonHash(ham))
    assert.notEqual(portalJetonHash(ham), portalJetonHash(portalJetonHam()))
  })

  it('portal jeton sonu istem + 30 gün', () => {
    const son = portalJetonSonu('2026-10-01')
    assert.ok(son > Date.parse('2026-10-01T00:00:00+03:00'))
  })
})

describe('konsültan portal dilim ve dönüş', () => {
  it('fısıltı / transkript / model adı dilimde yok', () => {
    const d = konsultanDilimi({
      satir: {
        hedef_brans: 'kulak-burun-bogaz',
        hedef: 'kulak-burun-bogaz',
        klinik_soru: 'İşitme kaybı var mı?',
        not_metni: null,
        tanilar: 'İşitme şüphesi',
        mevcut_durum: 'Okulda zorlanıyor',
        istem_tarihi: '2026-10-01',
        created_at: '2026-10-01T10:00:00Z',
        beklenen_gun: '2026-10-10',
      },
      hekimAdi: 'Dr. Pediatri',
      hastaAdi: 'Ali Veli',
      onayliCumleler: ['Saf ses odyogramı planlandı.'],
    })
    const metin = JSON.stringify(d)
    assert.doesNotMatch(metin, /fısıltı|fisilti|transkript|claude|gpt|model/i)
    assert.equal(d.soru, 'İşitme kaybı var mı?')
    assert.match(d.ozgecmis || '', /İşitme/)
  })

  it('asistan ön not hekim onayı uyarısı taşır', () => {
    const n = asistanOnNotYaz({
      konsultanNotu: 'İşitme kaybı saptanmadı.',
      belgeAdlari: ['odyogram.pdf', 'klip.mp4'],
      brans: 'Kulak Burun Boğaz',
    })
    assert.match(n, /hekim onayı bekliyor/)
    assert.match(n, /odyogram\.pdf/)
    assert.match(n, /hastaya gitmez|hasta portalına/i)
  })

  it('konsültan notu kısa ise hata', () => {
    assert.ok('hata' in konsultanNotDogrula('ab'))
  })

  it('zip reddedilir Türkçe cümleyle', () => {
    const r = portalBelgeDogrula('x.zip', 'application/zip', 100)
    assert.ok('hata' in r)
    if ('hata' in r) assert.equal(r.hata, BELGE_TURU_REDDEDILDI)
  })

  it('jpeg pdf mp4 çekirdek türdür', () => {
    assert.ok(!('hata' in portalBelgeDogrula('a.jpg', 'image/jpeg', 100)))
    assert.ok(!('hata' in portalBelgeDogrula('a.pdf', 'application/pdf', 100)))
    assert.ok(!('hata' in portalBelgeDogrula('a.mp4', 'video/mp4', 100)))
    assert.ok(!('hata' in portalBelgeDogrula('a.dcm', '', 100)))
    assert.ok(!('hata' in portalBelgeDogrula('a.mov', 'video/quicktime', 100)))
  })
})

describe('beklenen gün → sarı / kırmızı (mevcut eşikler)', () => {
  it('beklenen gün dolunca sarı, iki aralık sonra kırmızı', () => {
    const satir = {
      istem_tarihi: '2026-09-01',
      created_at: '2026-09-01T10:00:00Z',
      beklenen_gun: '2026-10-01',
    }
    // Gün dolmadan
    assert.equal(beklemeVurgusu(beklemeGunu(satir, '2026-09-30')), 'notr')
    // Gün dolunca → DIKKAT eşiği
    assert.equal(beklemeGunu(satir, '2026-10-01'), BEKLEME_DIKKAT_GUN)
    assert.equal(beklemeVurgusu(beklemeGunu(satir, '2026-10-01')), 'uyari')
    // İki aralık (KIRMIZI − DİKKAT) sonra
    const kirmiziGun = '2026-10-' + String(1 + (BEKLEME_KIRMIZI_GUN - BEKLEME_DIKKAT_GUN)).padStart(2, '0')
    // 1 + 16 = 17 Ekim
    assert.equal(beklemeVurgusu(beklemeGunu(satir, '2026-10-17')), 'kirmizi')
    void kirmiziGun
  })

  it('beklenen gün yoksa eski istem-tarihi davranışı', () => {
    const satir = { istem_tarihi: '2026-09-01', created_at: '2026-09-01T10:00:00Z', beklenen_gun: null }
    assert.equal(beklemeGunu(satir, '2026-09-15'), 14)
    assert.equal(beklemeVurgusu(14), 'uyari')
    assert.equal(beklemeVurgusu(30), 'kirmizi')
  })
})

describe('istem genişlemesi', () => {
  it('defter_id ve beklenen_gun kabul', () => {
    const d = istemDogrula({
      hedefBrans: 'kulak-burun-bogaz',
      klinikSoru: 'İşitme kaybı var mı diye soruyorum.',
      defterId: '22222222-2222-4222-8222-222222222222',
      beklenenGun: '2026-10-10',
      istemTarihi: '2026-10-01',
    }, '2026-10-04')
    assert.ok(!('hata' in d))
    if ('hata' in d) return
    assert.equal(d.girdi.defter_id, '22222222-2222-4222-8222-222222222222')
    assert.equal(d.girdi.beklenen_gun, '2026-10-10')
  })

  it('fisilti iliştirilmezse alan null kalır', () => {
    const d = istemDogrula({
      hedefBrans: 'dahiliye',
      klinikSoru: 'Karaciğer enzimleri yükseldi, ne düşünürsünüz?',
    }, '2026-10-04')
    assert.ok(!('hata' in d))
    if ('hata' in d) return
    assert.equal(d.girdi.fisilti_oge_id, null)
  })
})

describe('çekirdek vault allowlist genişlemesi', () => {
  it('zorunlu türler kabul', () => {
    for (const m of [
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif', 'image/tiff',
      'application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/wav',
      'video/mp4', 'video/quicktime', 'video/webm', 'application/dicom',
    ]) {
      assert.ok((VAULT_ALLOWED_MIME as readonly string[]).includes(m), m)
      assert.doesNotThrow(() => assertAllowedUpload(m, 1024, `x.${m.split('/')[1]}`))
    }
  })

  it('red Türkçe tek cümle', () => {
    try {
      assertAllowedUpload('application/zip', 100, 'x.zip')
      assert.fail('zip kabul edilmemeli')
    } catch (e) {
      assert.ok(e instanceof VaultValidationError)
      assert.match((e as Error).message, /kabul edilmiyor/)
    }
  })
})
