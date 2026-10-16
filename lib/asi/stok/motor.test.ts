/**
 * NOTYA-ASI-STOK-BARKOD-01 — lib/asi/stok/motor.ts testleri. Sahte veritabanı (fake PostgREST +
 * fake RPC — lib/security/testing/sahteSupabase.ts), hasta-izolasyon paketiyle aynı altyapı.
 *
 * Atomik düşümün GERÇEK eşzamanlılık garantisi Postgres'in satır kilidine aittir (bkz. migration
 * 165_asi_stok_barkod.sql yorumu, 160_protokol_numarasi.sql'deki protokol_no_ata() ile aynı kanıtlanmış
 * teknik) — bu dosyadaki sahte RPC, Postgres'in UPDATE...WHERE miktar>0...RETURNING davranışının
 * MANTIĞINI (sıfırın altına düşmez, yabancı doktor_id'de 0 satır) doğrular; gerçek eşzamanlı yarış
 * kanıtı canlı bir Postgres'e karşı ayrı koşulmalıdır (protokolNo.test.ts'in izlediği yol).
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SahteVeritabani } from '@/lib/security/testing/sahteSupabase'
import { stokEkle, barkodTara, asiUygula, AsiStokHatasi, lotlariListele } from './motor'

let db: SahteVeritabani
let supabase: any

const DOKTOR_A = 'doktor-A'
const DOKTOR_B = 'doktor-B'

function hastaEkle(doktorId: string, ad = 'QA Hasta') {
  return db.ekle('patients', { doctor_id: doktorId, name_encrypted: ad })
}
function seansEkle(doktorId: string, patientId: string) {
  return db.ekle('sessions', { doctor_id: doktorId, patient_id: patientId })
}

beforeEach(() => {
  db = new SahteVeritabani()
  supabase = db.istemci()
})

describe('NOTYA-ASI-STOK-BARKOD-01: stokEkle', () => {
  it('yeni barkod → yeni lot; aynı barkod tekrar eklenince miktar toplanır', async () => {
    const lot1 = await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-1', miktar: 10 })
    assert.equal(lot1.miktar, 10)
    const lot2 = await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-1', miktar: 5 })
    assert.equal(lot2.id, lot1.id)
    assert.equal(lot2.miktar, 15)
  })

  it('aşı adı veya barkod boşsa ya da miktar pozitif değilse reddeder', async () => {
    await assert.rejects(() => stokEkle(supabase, DOKTOR_A, { asiAdi: '', barkod: 'X', miktar: 1 }), AsiStokHatasi)
    await assert.rejects(() => stokEkle(supabase, DOKTOR_A, { asiAdi: 'X', barkod: '', miktar: 1 }), AsiStokHatasi)
    await assert.rejects(() => stokEkle(supabase, DOKTOR_A, { asiAdi: 'X', barkod: 'Y', miktar: 0 }), AsiStokHatasi)
  })

  it('bir doktorun stoğu başka doktorun listesinde görünmez', async () => {
    await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-A', miktar: 10 })
    const listeB = await lotlariListele(supabase, DOKTOR_B)
    assert.equal(listeB.length, 0)
  })
})

describe('NOTYA-ASI-STOK-BARKOD-01: barkodTara', () => {
  it('bulunursa lot + SKT durumu + stokVarMi döner; bulunamazsa bulundu:false', async () => {
    await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-1', miktar: 3 })
    const bulundu = await barkodTara(supabase, DOKTOR_A, 'BRK-1')
    assert.equal(bulundu.bulundu, true)
    if (bulundu.bulundu) {
      assert.equal(bulundu.stokVarMi, true)
      assert.equal(bulundu.sktDurumu, 'gecerli')
      assert.equal(bulundu.engellenir, false)
    }
    const yok = await barkodTara(supabase, DOKTOR_A, 'YOK-BARKOD')
    assert.equal(yok.bulundu, false)
  })

  it('SKT geçmiş lot engellenir:true', async () => {
    await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-ESKI', miktar: 3, sonKullanmaTarihi: '2020-01-01' })
    const t = await barkodTara(supabase, DOKTOR_A, 'BRK-ESKI')
    assert.equal(t.bulundu, true)
    if (t.bulundu) {
      assert.equal(t.sktDurumu, 'gecti')
      assert.equal(t.engellenir, true)
    }
  })

  it('başka doktorun barkodu bu doktora bulundu:false döner (izolasyon)', async () => {
    await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-A', miktar: 3 })
    const t = await barkodTara(supabase, DOKTOR_B, 'BRK-A')
    assert.equal(t.bulundu, false)
  })
})

describe('NOTYA-ASI-STOK-BARKOD-01: asiUygula — tek aksiyon', () => {
  it('mutlu yol: stok 1 düşer, asilar satırı lot bağlantılı yazılır, hareket kaydı oluşur', async () => {
    const hasta = hastaEkle(DOKTOR_A)
    const seans = seansEkle(DOKTOR_A, hasta.id)
    const lot = await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-1', lotNo: 'L-9', miktar: 5 })

    const sonuc = await asiUygula(supabase, DOKTOR_A, { lotId: lot.id, patientId: hasta.id, sessionId: seans.id, uygulamaBolgesi: 'Sol kol' })
    assert.equal(sonuc.kalanMiktar, 4)
    assert.equal(sonuc.eNabizHazir, true)

    const asilar = db.tablo('asilar')
    assert.equal(asilar.length, 1)
    assert.equal(asilar[0].asi_adi, 'KPA')
    assert.equal(asilar[0].lot_id, lot.id)
    assert.equal(asilar[0].lot_no_anlik, 'L-9')
    assert.equal(asilar[0].session_id, seans.id)
    assert.equal(asilar[0].patient_id, hasta.id)
    assert.equal(asilar[0].uygulama_bolgesi, 'Sol kol')
    // 091'in kaynak_note_id senkronu bu satırı YAKALAMAMALI — scan-added satırlar NULL kalır.
    assert.equal(asilar[0].kaynak_note_id, undefined)

    // stokEkle kendi 'ekleme' hareketini yazmıştı; burada yalnız 'uygulama' hareketini doğruluyoruz.
    const hareketler = db.tablo('asi_stok_hareketleri').filter((h) => h.lot_id === lot.id && h.tur === 'uygulama')
    assert.equal(hareketler.length, 1)
    assert.equal(hareketler[0].miktar_degisim, -1)
    assert.equal(hareketler[0].asilar_id, asilar[0].id)
  })

  it('barkod ile de çalışır (lotId yoksa barkod üzerinden lot bulunur)', async () => {
    const hasta = hastaEkle(DOKTOR_A)
    await stokEkle(supabase, DOKTOR_A, { asiAdi: 'Hepatit B', barkod: 'BRK-HEPB', miktar: 2 })
    const sonuc = await asiUygula(supabase, DOKTOR_A, { barkod: 'BRK-HEPB', patientId: hasta.id })
    assert.equal(sonuc.kalanMiktar, 1)
  })

  it('yabancı hasta (başka doktorun hastası) reddedilir — stok değişmez', async () => {
    const hastaB = hastaEkle(DOKTOR_B)
    const lot = await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-1', miktar: 5 })
    await assert.rejects(() => asiUygula(supabase, DOKTOR_A, { lotId: lot.id, patientId: hastaB.id }), AsiStokHatasi)
    const sonLot = (await lotlariListele(supabase, DOKTOR_A))[0]
    assert.equal(sonLot.miktar, 5)
  })

  it('yabancı seans (başka doktorun seansı) reddedilir', async () => {
    const hastaA = hastaEkle(DOKTOR_A)
    const hastaB = hastaEkle(DOKTOR_B)
    const seansB = seansEkle(DOKTOR_B, hastaB.id)
    const lot = await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-1', miktar: 5 })
    await assert.rejects(() => asiUygula(supabase, DOKTOR_A, { lotId: lot.id, patientId: hastaA.id, sessionId: seansB.id }), AsiStokHatasi)
  })

  it('aynı doktorun başka hastasına ait seans da reddedilir (seans-hasta eşleşmeli)', async () => {
    const hastaA1 = hastaEkle(DOKTOR_A)
    const hastaA2 = hastaEkle(DOKTOR_A)
    const seansA1 = seansEkle(DOKTOR_A, hastaA1.id)
    const lot = await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-1', miktar: 5 })
    await assert.rejects(() => asiUygula(supabase, DOKTOR_A, { lotId: lot.id, patientId: hastaA2.id, sessionId: seansA1.id }), AsiStokHatasi)
  })

  it('SKT geçmiş lot — engellenir, stok hiç düşmez', async () => {
    const hasta = hastaEkle(DOKTOR_A)
    const lot = await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-ESKI', miktar: 5, sonKullanmaTarihi: '2020-01-01' })
    await assert.rejects(() => asiUygula(supabase, DOKTOR_A, { lotId: lot.id, patientId: hasta.id }), AsiStokHatasi)
    const sonLot = (await lotlariListele(supabase, DOKTOR_A))[0]
    assert.equal(sonLot.miktar, 5)
    assert.equal(db.tablo('asilar').length, 0)
  })

  it('stok tükenince ikinci uygulama reddedilir, miktar asla negatife düşmez (atomik düşümün mantığı)', async () => {
    const hasta = hastaEkle(DOKTOR_A)
    const lot = await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-1', miktar: 1 })
    const ilk = await asiUygula(supabase, DOKTOR_A, { lotId: lot.id, patientId: hasta.id })
    assert.equal(ilk.kalanMiktar, 0)
    await assert.rejects(() => asiUygula(supabase, DOKTOR_A, { lotId: lot.id, patientId: hasta.id }), AsiStokHatasi)
    const sonLot = (await lotlariListele(supabase, DOKTOR_A))[0]
    assert.equal(sonLot.miktar, 0) // asla -1 olmaz
  })

  it('faturaya ekle istenmezse fatura.eklendi false, uygulama kaydı yine de geçerli', async () => {
    const hasta = hastaEkle(DOKTOR_A)
    const lot = await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-1', miktar: 5 })
    const sonuc = await asiUygula(supabase, DOKTOR_A, { lotId: lot.id, patientId: hasta.id, faturayaEkle: false })
    assert.equal(sonuc.fatura.eklendi, false)
  })

  it('faturaya ekle istenir ama Faturalama & Tahsilat modülü kapalıysa — uygulama kaydı YİNE DE başarılı, fatura eklenmez', async () => {
    const hasta = hastaEkle(DOKTOR_A)
    const lot = await stokEkle(supabase, DOKTOR_A, { asiAdi: 'KPA', barkod: 'BRK-1', miktar: 5 })
    const sonuc = await asiUygula(supabase, DOKTOR_A, { lotId: lot.id, patientId: hasta.id, faturayaEkle: true })
    assert.equal(sonuc.kalanMiktar, 4) // stok düşümü faturadan bağımsız her koşulda gerçekleşti
    assert.equal(sonuc.fatura.eklendi, false)
    assert.match(String(sonuc.fatura.sebep), /kapalı/)
  })
})
