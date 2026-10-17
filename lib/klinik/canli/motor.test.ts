import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { istanbulYerelUtc, saatDakika } from '@/lib/randevu/v2/zaman'
import type { SlotGirdisi } from '@/lib/randevu/v2/slot'
import { hafizaKarti, klinikSlotlari, kurtarmaSirasi, odaMesgul, KURTARMA_EN_ERKEN_MS, KURTARMA_EN_GEC_MS } from './motor'

const GUN = (acik: boolean) => ({ acik, baslangic: '09:00', bitis: '12:00' })
const HAFTA = { '0': GUN(false), '1': GUN(true), '2': GUN(true), '3': GUN(true), '4': GUN(true), '5': GUN(true), '6': GUN(false) }
const PZT = '2026-10-05'
const simdi = Date.parse('2026-10-05T03:00:00Z')
const iso = (hhmm: string) => new Date(istanbulYerelUtc(PZT, saatDakika(hhmm)!)).toISOString()

function girdi(p: Partial<SlotGirdisi> = {}): SlotGirdisi {
  return {
    calismaSaatleri: HAFTA, adimDk: 30, sureDk: 30, tamponDk: 0, minBildirimDk: 0, maxIleriGun: 1,
    simdi, istisnalar: [], mesgul: [], resmiTatiller: [], gunler: [PZT], ...p,
  }
}

describe('klinik slot — oda, doktor meşgulüne eklenir', () => {
  it('boş oda doktorun ızgarasını değiştirmez', () => {
    const saat = klinikSlotlari(girdi(), []).map((s) => s.saat)
    assert.deepEqual(saat, ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'])
  })

  it('aynı odadaki başka hekimin saati o slota kapanır', () => {
    const oda = odaMesgul('oda-1', [
      { odaId: 'oda-2', bas: Date.parse(iso('09:00')), son: Date.parse(iso('09:30')) },
      { odaId: 'oda-1', bas: Date.parse(iso('10:00')), son: Date.parse(iso('10:30')) },
    ])
    const saat = klinikSlotlari(girdi(), oda).map((s) => s.saat)
    assert.deepEqual(saat, ['09:00', '09:30', '10:30', '11:00', '11:30'])
  })
})

describe('hafıza kartı — yapılandırılmış kayıt, model yok', () => {
  it('son 3 ziyareti yeniye göre keser, açık takibi ve kalan seansı taşır', () => {
    const kart = hafizaKarti({
      ziyaretler: [
        { doktorId: 'a', tarih: '2026-10-01', ozet: 'eski' },
        { doktorId: 'b', tarih: '2026-10-10', ozet: 'yeni' },
        { doktorId: 'a', tarih: '2026-10-04', ozet: 'orta' },
        { doktorId: 'c', tarih: '2026-09-01', ozet: 'daha eski' },
      ],
      takipler: [{ sahip: 'b', metin: 'kontrol' }],
      paket: { ad: 'Fizik tedavi', kalanSeans: 4 },
      gelmeler: [],
    })
    assert.deepEqual(kart.sonZiyaretler.map((z) => z.ozet), ['yeni', 'orta', 'eski'])
    assert.equal(kart.acikTakipler[0]?.sahip, 'b')
    assert.equal(kart.paket?.kalanSeans, 4)
    assert.equal(kart.gelmediRiski, 'yok')
  })

  it('bitmiş paket kartta durmaz; son 6 gelişten 2 gelmedi yüksek risktir', () => {
    const kart = hafizaKarti({
      ziyaretler: [],
      takipler: [],
      paket: { ad: 'Bitti', kalanSeans: 0 },
      gelmeler: [
        { tarih: '2026-10-10', gelmedi: true },
        { tarih: '2026-10-08', gelmedi: false },
        { tarih: '2026-10-06', gelmedi: true },
        { tarih: '2026-01-01', gelmedi: true },
      ],
    })
    assert.equal(kart.paket, null)
    assert.equal(kart.gelmediRiski, 'yuksek')
  })

  it('tek gelmedi orta risktir ve 6. gelişten eskisi sayılmaz', () => {
    const gelmeler = [
      { tarih: '2026-10-10', gelmedi: false },
      { tarih: '2026-10-09', gelmedi: false },
      { tarih: '2026-10-08', gelmedi: false },
      { tarih: '2026-10-07', gelmedi: false },
      { tarih: '2026-10-06', gelmedi: false },
      { tarih: '2026-10-05', gelmedi: true },
      { tarih: '2026-01-01', gelmedi: true },
    ]
    assert.equal(hafizaKarti({ ziyaretler: [], takipler: [], paket: null, gelmeler }).gelmediRiski, 'orta')
  })
})

describe('kurtarma sırası — yalnız 2–4 saat içindeki boşluk', () => {
  const simdiMs = Date.parse('2026-10-05T08:00:00Z')

  it('pencere dışındaki boşlukta aday üretmez', () => {
    assert.deepEqual(kurtarmaSirasi({ simdi: simdiMs, slotBas: simdiMs + KURTARMA_EN_ERKEN_MS - 1, bekleme: [{ id: 'p', sira: 0 }], gelmedi: [] }), [])
    assert.deepEqual(kurtarmaSirasi({ simdi: simdiMs, slotBas: simdiMs + KURTARMA_EN_GEC_MS + 1, bekleme: [{ id: 'p', sira: 0 }], gelmedi: [] }), [])
  })

  it('bekleme listesi sırayı korur ve yakın gelmedinin önüne geçer', () => {
    const sira = kurtarmaSirasi({
      simdi: simdiMs,
      slotBas: simdiMs + 3 * 60 * 60 * 1000,
      bekleme: [{ id: 'ikinci', sira: 1 }, { id: 'birinci', sira: 0 }],
      gelmedi: [{ id: 'kacan', gunOnce: 1 }, { id: 'birinci', gunOnce: 0 }],
    })
    assert.deepEqual(sira.map((a) => [a.id, a.kaynak]), [
      ['birinci', 'bekleme'],
      ['ikinci', 'bekleme'],
      ['kacan', 'gelmedi'],
    ])
    assert.ok(sira[0]!.puan > sira[2]!.puan)
  })
})
