/**
 * NOTYA-ASI-ONAM-02 (2026-11-01) — a remote vaccine submission is an information acknowledgement,
 * never a consent (Resmî Gazete 27.10.2026/33413). Synthetic rows only; no patient data.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  ASI_ONAM_GORUNEN_ETIKET,
  asiOnamGorunenDurumu,
  asiOnamGorunenEtiket,
  asiOnamKimlikEksikMi,
  asiOnamMuayeneOnami,
  asiOnamMuayenedeAlindiMi,
  asiOnamUzaktanMi,
  bekleyenUzaktanBilgilendirme,
  uzaktanBilgilendirmeDurumu,
} from './asiOnamDurum'
import { ASI_ONAM_DURUMLARI, ASI_ONAM_YONTEMLERI } from './asiOnamMotoru'
import { mesajHazirla } from '@/lib/iletisim/sablonlar'

const kok = path.resolve(__dirname, '../../..')
const oku = (p: string) => fs.readFileSync(path.join(kok, p), 'utf8')
const UZAKTAN = ASI_ONAM_YONTEMLERI.filter((y) => y.startsWith('uzaktan-'))
const SEANS = 'seans-1'
const satir = (yontem: string, durum: string, ek: Partial<{ session_id: string | null; created_at: string }> = {}) =>
  ({ yontem, durum, session_id: SEANS, created_at: '2026-11-01T09:00:00Z', asilar: ['KKK'], ...ek })

describe('NOTYA-ASI-ONAM-02 · uzaktan gönderim asla "Onaylandı" değildir', () => {
  it('yeni uzaktan gönderimin durumu hiçbir zaman alindi değil', () => {
    assert.equal(uzaktanBilgilendirmeDurumu(true), 'bilgilendirme-okundu')
    assert.equal(uzaktanBilgilendirmeDurumu(false), 'bilgilendirme-cekince')
  })

  it('her uzaktan yöntem × her durum → bilgilendirme, asla onaylandi', () => {
    for (const y of UZAKTAN) {
      assert.equal(asiOnamUzaktanMi(y), true)
      for (const d of ASI_ONAM_DURUMLARI) {
        const g = asiOnamGorunenDurumu({ yontem: y, durum: d })
        assert.notEqual(g, 'onaylandi', `${y}/${d}`)
        assert.ok(g.startsWith('bilgilendirme-'), `${y}/${d}`)
        assert.equal(asiOnamMuayenedeAlindiMi({ yontem: y, durum: d }), false)
      }
    }
  })

  it('eski (2026-11-01 öncesi) uzaktan "alindi" kayıtları yeni etiketle görünür', () => {
    assert.equal(asiOnamGorunenEtiket({ yontem: 'uzaktan-portal', durum: 'alindi' }), 'Bilgilendirme okundu — onam muayenede alınacak')
    assert.equal(asiOnamGorunenDurumu({ yontem: 'uzaktan-whatsapp', durum: 'reddedildi' }), 'bilgilendirme-cekince')
    for (const e of Object.values(ASI_ONAM_GORUNEN_ETIKET).filter((e) => e.startsWith('Bilgilendirme'))) assert.doesNotMatch(e, /Onaylandı/)
  })

  it('muayenede alınan onam (klinik / imzalı kağıt) Onaylandı olur', () => {
    assert.equal(asiOnamGorunenDurumu({ yontem: 'klinik', durum: 'alindi' }), 'onaylandi')
    assert.equal(asiOnamGorunenDurumu({ yontem: 'kagit', durum: 'alindi' }), 'onaylandi')
    assert.equal(asiOnamGorunenDurumu({ yontem: 'klinik', durum: 'reddedildi' }), 'reddedildi')
    assert.match(asiOnamGorunenEtiket({ yontem: 'klinik', durum: 'alindi' }), /^Onaylandı/)
  })
})

describe('NOTYA-ASI-ONAM-02 · onam kapısı uzaktan bilgilendirmeyle geçmez', () => {
  it('yalnız uzaktan kayıt varken muayene onamı yok', () => {
    const kayitlar = UZAKTAN.flatMap((y) => [satir(y, 'alindi'), satir(y, 'bilgilendirme-okundu')])
    assert.equal(asiOnamMuayeneOnami(kayitlar, SEANS), null)
  })

  it('muayenede onam kaydedilince kapı geçer; başka muayenenin onamı geçmez; seanssız geçmez', () => {
    const kayitlar = [satir('klinik', 'alindi'), satir('uzaktan-portal', 'alindi')]
    assert.equal(asiOnamMuayeneOnami(kayitlar, SEANS)?.yontem, 'klinik')
    assert.equal(asiOnamMuayeneOnami(kayitlar, 'baska-seans'), null)
    assert.equal(asiOnamMuayeneOnami(kayitlar, null), null)
    assert.equal(asiOnamMuayeneOnami([satir('klinik', 'reddedildi')], SEANS), null)
  })

  it('bekleyen uzaktan bilgilendirme: en yeni kayıt uzaktansa görünür, ardından muayene kaydı gelince kapanır', () => {
    const uz = satir('uzaktan-eposta', 'bilgilendirme-okundu', { created_at: '2026-11-01T08:00:00Z' })
    assert.equal(bekleyenUzaktanBilgilendirme([uz]), uz)
    assert.equal(bekleyenUzaktanBilgilendirme([satir('klinik', 'alindi'), uz]), null)
    assert.equal(bekleyenUzaktanBilgilendirme([]), null)
  })

  it('aşı kaydetme / uygulama rotaları onam kaydına bakmaz — uzaktan bilgilendirmeye dayanan bir geçiş yolu yok', () => {
    for (const p of ['app/api/doktor/asilar/route.ts', 'app/api/doktor/asi-stok/uygula/route.ts', 'app/api/notes/[id]/approve/route.ts']) {
      assert.doesNotMatch(oku(p), /asi_onam|asiOnam/, p)
    }
  })

  it('ekranlar ham durum === "alindi" ile Onaylandı göstermez; etiket asiOnamDurum.ts\'ten gelir', () => {
    for (const p of ['components/doktor/AsiOnamPaneli.tsx', 'app/portal/_components/AsiOnamView.tsx']) {
      const s = oku(p)
      assert.doesNotMatch(s, /durum === 'alindi' \?/, p)
      assert.match(s, /ASI_ONAM_GORUNEN_ETIKET/, p)
    }
    assert.match(oku('components/doktor/AsiOnamPaneli.tsx'), /asiOnamMuayeneOnami\(/)
  })

  it('rotalar: portal POST alindi yazamaz; hekim POST kimlik doğrulaması olmadan onam kaydetmez', () => {
    const portal = oku('app/api/portal/hasta/[token]/asi-onam/route.ts')
    assert.match(portal, /durumGecerli = uzaktanBilgilendirmeDurumu\(/)
    assert.doesNotMatch(portal, /: 'alindi'/)
    const klinik = oku('app/api/doktor/asi-onam/route.ts')
    assert.match(klinik, /asiOnamKimlikEksikMi\(durumGecerli, kimlikDogrulandi\)/)
    assert.match(klinik, /yontem: 'klinik'/)
    assert.match(oku('app/api/doktor/asi-onam/kagit/route.ts'), /asiOnamKimlikEksikMi\(durum, kimlikDogrulandi\)/)
  })

  it('ret ("Kabul etmedi") de kabul gibi kimlik işareti ister — yardımcı, rotalar, ekran ve migration 185', () => {
    for (const d of ['alindi', 'reddedildi']) {
      assert.equal(asiOnamKimlikEksikMi(d, undefined), true, d)
      assert.equal(asiOnamKimlikEksikMi(d, false), true, d)
      assert.equal(asiOnamKimlikEksikMi(d, 'true'), true, `${d}: yalnız gerçek true geçer`)
      assert.equal(asiOnamKimlikEksikMi(d, true), false, d)
    }
    // Uzaktan bilgilendirme muayenede kimlik işaretiyle yazılmaz; bu kapı ona uygulanmaz.
    assert.equal(asiOnamKimlikEksikMi('bilgilendirme-okundu', undefined), false)
    const panel = oku('components/doktor/AsiOnamPaneli.tsx')
    assert.match(panel, /disabled=\{gonderiliyor \|\| !kimlikDogrulandi\} onClick=\{\(\) => void klinikteOnayla\('reddedildi'\)\}/)
    assert.doesNotMatch(panel, /durum === 'alindi' && !kimlikDogrulandi/)
    const m = oku('lib/db/migrations/185_asi_onam_ret_kimlik.sql')
    assert.match(m, /durum NOT IN \('alindi', 'reddedildi'\) OR kimlik_dogrulandi IS TRUE\)\s*NOT VALID/)
    assert.doesNotMatch(m, /^\s*(UPDATE|DELETE)\s/im)
  })

  it('migration 184: eski satırlar değişmez (NOT VALID), uzaktan + alindi yeni satırda yasak, görünüm türetilmiş durum ekler', () => {
    const m = oku('lib/db/migrations/184_asi_onam_uzaktan_bilgilendirme.sql')
    assert.match(m, /asi_onam_kayitlari_uzaktan_onam_degil[\s\S]*NOT VALID/)
    assert.match(m, /gecerli_durum/)
    assert.doesNotMatch(m, /^\s*(UPDATE|DELETE)\s/im)
  })
})

describe('NOTYA-ASI-ONAM-02 · e-posta / WhatsApp bildirimi onay istemez', () => {
  it('asi_onam_hazir: "onaylamak" yok, onamın muayenede alınacağını söyler, aşı adı yok', () => {
    const m = mesajHazirla('asi_onam_hazir', { hastaAdi: 'Test Hasta', doktorAdi: 'Dr. Test', link: 'https://www.notya.io/x', bugunIso: '2026-11-01' } as Parameters<typeof mesajHazirla>[1])!
    assert.ok(m)
    assert.doesNotMatch(m.metin + m.konu, /onaylamak|onay formu/i)
    assert.match(m.metin, /onamı muayenede/)
    assert.doesNotMatch(m.metin, /KKK|Hepatit|Pnömokok/)
  })
})
