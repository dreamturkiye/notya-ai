/**
 * ASI-KARNESI-01 (D) — hekim onaylı aşı hatırlatması: saf kurallar + "otomatik gönderim yok" kilitleri.
 * Sentetik veri.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  asiHatirlatmaMesaji, ASI_HATIRLATMA_KONU, durumEtiketi, hatirlatmaDurumu, hatirlatmaPenceresi, hatirlatmaSirala,
  sonrakiDozKarsilandiMi, type AsiHatirlatmaSatiri,
} from './hatirlatma'

const kok = join(import.meta.dirname, '../..')
const oku = (r: string) => readFileSync(join(kok, r), 'utf8')
const B = '2026-09-19'

describe('liste penceresi ve durum', () => {
  it('30 gün içinde yaklaşıyor, 90 güne kadar geçmiş gecikti; dışı listelenmez', () => {
    assert.deepEqual(hatirlatmaPenceresi(B), { bas: '2026-06-21', son: '2026-10-19' })
    assert.equal(hatirlatmaDurumu('2026-09-19', B), 'yaklasiyor')
    assert.equal(hatirlatmaDurumu('2026-10-19', B), 'yaklasiyor')
    assert.equal(hatirlatmaDurumu('2026-10-20', B), null)
    assert.equal(hatirlatmaDurumu('2026-09-18', B), 'gecikti')
    assert.equal(hatirlatmaDurumu('2026-06-21', B), 'gecikti')
    assert.equal(hatirlatmaDurumu('2026-06-20', B), null)
    assert.equal(hatirlatmaDurumu(null, B), null)
    assert.equal(hatirlatmaDurumu('2026-13-40x', B), null)
  })
  it('durum etiketi', () => {
    assert.equal(durumEtiketi(B, B), 'bugün')
    assert.equal(durumEtiketi('2026-09-24', B), '5 gün sonra')
    assert.equal(durumEtiketi('2026-09-07', B), 'tarihi 12 gün geçti')
  })
  it('sonraki dozu daha sonra kaydedilmiş satır listelenmez (aynı seri, farklı yazım dahil)', () => {
    const satir = { id: 'a', patient_id: 'p', asi_adi: 'KKK', uygulama_tarihi: '2025-03-12' }
    assert.equal(sonrakiDozKarsilandiMi(satir, [satir]), false)
    assert.equal(sonrakiDozKarsilandiMi(satir, [satir, { id: 'b', patient_id: 'p', asi_adi: 'Kızamık-Kızamıkçık-Kabakulak', uygulama_tarihi: '2026-09-01' }]), true)
    assert.equal(sonrakiDozKarsilandiMi(satir, [satir, { id: 'c', patient_id: 'p', asi_adi: 'KKK', uygulama_tarihi: '2024-01-01' }]), false, 'daha eski doz karşılamaz')
    assert.equal(sonrakiDozKarsilandiMi(satir, [satir, { id: 'd', patient_id: 'q', asi_adi: 'KKK', uygulama_tarihi: '2026-09-01' }]), false, 'başka hasta')
    assert.equal(sonrakiDozKarsilandiMi(satir, [satir, { id: 'e', patient_id: 'p', asi_adi: 'Hepatit A', uygulama_tarihi: '2026-09-01' }]), false, 'başka seri')
  })
  it('sıra: gönderilmemişler önce, en eski tarih üstte', () => {
    const s = (asiId: string, t: string, g = false) => ({ asiId, sonrakiDozTarihi: t, gonderildi: g, hastaAdi: 'x' }) as AsiHatirlatmaSatiri
    assert.deepEqual([s('1', '2026-10-01', true), s('2', '2026-10-05'), s('3', '2026-09-01')].sort(hatirlatmaSirala).map((x) => x.asiId), ['3', '2', '1'])
  })
})

describe('hatırlatma metni: sade, klinik iddiasız', () => {
  it('aşı adı / doz / tıbbi öneri yok; tarih + randevu yolu + acil notu', () => {
    for (const cocuk of [true, false]) {
      const m = asiHatirlatmaMesaji({ tarihIso: '2026-10-05', cocuk })
      assert.equal(m.konu, ASI_HATIRLATMA_KONU)
      assert.match(m.metin, /05\.10\.2026/)
      assert.match(m.metin, /Randevu için muayenehanemizi arayabilir/)
      assert.match(m.metin, /112/)
      assert.doesNotMatch(m.metin, /\bdoz\b|\d+\.\s*doz|\bmg\b|\bml\b|öneri|önerilir|yapılmalı|gerek|risk|tehlike|eksik|gecik|KKK|Hepatit|BCG|KPA|karma/i)
    }
  })
  it('veli dili yaş kuralından: çocuk → "Çocuğunuzun", erişkin → "tarihiniz" (veli kelimesi yok)', () => {
    assert.match(asiHatirlatmaMesaji({ tarihIso: B, cocuk: true }).metin, /Çocuğunuzun kayıtlı bir sonraki aşı tarihi/)
    const e = asiHatirlatmaMesaji({ tarihIso: B, cocuk: false }).metin
    assert.match(e, /Kayıtlı bir sonraki aşı tarihiniz/)
    assert.doesNotMatch(e, /çocuğunuz|veli/i)
  })
})

describe('OTOMATİK GÖNDERİM YOK (Kaan, 2026-09-19)', () => {
  it('eski günlük WhatsApp cron\'u kaldırıldı: rota dosyası yok, vercel.json takviminde yok', () => {
    assert.ok(!existsSync(join(kok, 'app/api/cron/asi-hatirlatma')))
    const v = JSON.parse(oku('vercel.json')) as { crons?: Array<{ path: string }> }
    assert.ok(!(v.crons || []).some((c) => /asi/i.test(c.path)), 'aşı cron\'u takvimde')
  })
  it('hiçbir cron rotası asilar tablosuna dokunmaz', () => {
    const cron = join(kok, 'app/api/cron')
    const gez = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? gez(join(d, e.name)) : [join(d, e.name)]))
    for (const f of gez(cron)) assert.doesNotMatch(readFileSync(f, 'utf8'), /from\(['"]asilar['"]\)/, f)
  })
  it('gönderim rotası: hekim onayı zorunlu, yalnız hekim, atomik mükerrer engeli, mevcut Sağlığım mesaj yolu', () => {
    const r = oku('app/api/doktor/asilar/hatirlatma/route.ts')
    assert.match(r, /body\?\.hekimOnayi !== true/)
    assert.match(r, /sadeceDoktor\(oturum\)/)
    assert.match(r, /\.not\('hatirlatma_gonderildi', 'is', true\)/)
    assert.match(r, /from\('hasta_mesaj_konulari'\)/)
    assert.doesNotMatch(r, /sendTwilioMessage|twilio|whatsapp/i, 'yeni kanal yok')
  })
  it('liste yeni araç değil: mevcut kohort panellerine ve Aşılar sekmesine takılı; planlayıcı metni otomatik demiyor', () => {
    for (const f of ['app/doktor-tools/pedi-kohort/page.tsx', 'app/doktor-tools/aile-kohort/page.tsx', 'components/doktor/HastaAsilar.tsx']) assert.match(oku(f), /<AsiHatirlatmaListesi/, f)
    const ui = oku('components/doktor/AsiHatirlatmaListesi.tsx')
    assert.match(ui, /hekimOnayi: true/)
    assert.match(ui, /Onayla ve gönder/)
    assert.match(ui, /s\.onizleme\.metin/, 'hekim gidecek metnin aynısını görür')
    assert.match(oku('specialties/pediatri/ui/araclar/AsiPlanlayici.tsx'), /onayınızla gönderilir/)
  })
})
