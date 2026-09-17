/**
 * NOTYA-RANDEVU-14 — Dr. Gökhan'ın 2026-09-17'de canlıda bildirdiği hatanın regresyon testi.
 *
 * Bildirim: randevuyu iptal etti (takvimde üstü çizili göründü — doğru), tekrar tıkladı, saatini
 * değiştirdi, Güncelle'ye bastı; randevu HÂLÂ iptal görünüyordu. "Bu randevu nasıl yeniden aktif
 * oluyor?"
 *
 * Testler iki ayrı kök sebebi kilitliyor:
 *   1. Saat düzenlemesi `durum` alanına dokunmaz — bu DOĞRU (sessizce aktifleştirmemeli), ama
 *      geri dönüş yolu olması şart: REAKTIVASYON_DURUMU ile açık bir geçiş.
 *   2. Arayüz kapısı: iptal edilmiş randevuda `aktifEt` aksiyonu GÖRÜNMELİ (eskiden durum 'iptal'
 *      ise aksiyon satırının tamamı gizleniyordu — tek bir düğme bile yoktu).
 *
 * Ayrıca reaktivasyonun çakışma kontrolünü tetiklediğini doğruluyoruz: iptalden sonra o saat
 * başkasına verilmiş olabilir, kontrolsüz geri açmak çift kayıt üretirdi.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  randevuGuncellemePlani,
  randevuAksiyonlari,
  slotKaplarMi,
  REAKTIVASYON_DURUMU,
  RANDEVU_DURUMLARI,
} from './randevuDurum'

/** Sentetik QA randevusu — gerçek hasta/doktor verisi değil. */
const IPTAL_RANDEVU = { baslangic: '2026-09-18T07:00:00.000Z', bitis: '2026-09-18T07:20:00.000Z', durum: 'iptal' }
const AKTIF_RANDEVU = { baslangic: '2026-09-18T07:00:00.000Z', bitis: '2026-09-18T07:20:00.000Z', durum: 'planlandi' }

test('Dr. Gökhan senaryosu: iptal edilmiş randevunun saatini değiştirmek durumu DEĞİŞTİRMEZ', () => {
  const plan = randevuGuncellemePlani(IPTAL_RANDEVU, {
    baslangic: '2026-09-18T08:00:00.000Z',
    bitis: '2026-09-18T08:20:00.000Z',
  })
  assert.equal(plan.hata, null)
  assert.equal(plan.alanlar.baslangic, '2026-09-18T08:00:00.000Z')
  assert.equal(plan.alanlar.bitis, '2026-09-18T08:20:00.000Z')
  // Takvimin üstü çizili göstermesi BAYAT ARAYÜZ DEĞİL, gerçeğin ta kendisiydi:
  assert.ok(!('durum' in plan.alanlar), 'saat düzenlemesi durum sütununa yazmamalı')
  assert.ok(!('iptal_nedeni' in plan.alanlar), 'saat düzenlemesi iptal nedenini silmemeli')
  assert.equal(plan.reaktivasyon, false)
})

test('iptal edilmiş randevunun saatini değiştirmek çakışma kontrolü GEREKTİRMEZ (slot kaplamıyor)', () => {
  const plan = randevuGuncellemePlani(IPTAL_RANDEVU, {
    baslangic: '2026-09-18T08:00:00.000Z',
    bitis: '2026-09-18T08:20:00.000Z',
  })
  assert.equal(plan.cakismaKontrolu, null)
})

test('reaktivasyon: açık durum geçişi randevuyu Planlandı yapar ve iptal nedenini temizler', () => {
  const plan = randevuGuncellemePlani(IPTAL_RANDEVU, { durum: REAKTIVASYON_DURUMU })
  assert.equal(plan.hata, null)
  assert.equal(plan.alanlar.durum, 'planlandi')
  assert.equal(plan.alanlar.iptal_nedeni, null)
  assert.equal(plan.reaktivasyon, true)
  // Reaktive edilen randevu hatırlatmayı yeniden hak eder (cron: hatirlatma_gonderildi=false).
  assert.equal(plan.alanlar.hatirlatma_gonderildi, false)
})

test('reaktivasyon ÇAKIŞMA KONTROLÜ tetikler — iptalden sonra slot başkasına verilmiş olabilir', () => {
  const plan = randevuGuncellemePlani(IPTAL_RANDEVU, { durum: REAKTIVASYON_DURUMU })
  assert.deepEqual(plan.cakismaKontrolu, { baslangic: IPTAL_RANDEVU.baslangic, bitis: IPTAL_RANDEVU.bitis })
})

test('reaktivasyon + yeni saat aynı istekte: çakışma YENİ pencere için sorulur', () => {
  const plan = randevuGuncellemePlani(IPTAL_RANDEVU, {
    durum: REAKTIVASYON_DURUMU,
    baslangic: '2026-09-18T09:00:00.000Z',
    bitis: '2026-09-18T09:30:00.000Z',
  })
  assert.deepEqual(plan.cakismaKontrolu, { baslangic: '2026-09-18T09:00:00.000Z', bitis: '2026-09-18T09:30:00.000Z' })
})

test('iptal etmek nedeni saklar, yeniden aktif etmek nedeni siler', () => {
  const iptal = randevuGuncellemePlani(AKTIF_RANDEVU, { durum: 'iptal', iptalNedeni: '  hasta erteledi  ' })
  assert.equal(iptal.alanlar.durum, 'iptal')
  assert.equal(iptal.alanlar.iptal_nedeni, 'hasta erteledi')
  assert.equal(iptal.reaktivasyon, false)
  // İptal etmek slot boşaltır — çakışma kontrolü gereksiz.
  assert.equal(iptal.cakismaKontrolu, null)

  const geri = randevuGuncellemePlani({ ...AKTIF_RANDEVU, durum: 'iptal' }, { durum: 'onaylandi' })
  assert.equal(geri.alanlar.iptal_nedeni, null)
  assert.equal(geri.reaktivasyon, true)
})

test('aktif randevunun saatini değiştirmek çakışma kontrolü ister ve hatırlatmayı sıfırlar', () => {
  // Yalnız başlangıç gönderildi: bitiş mevcut satırdan tamamlanır (07:20, hâlâ sonrasında).
  const plan = randevuGuncellemePlani(AKTIF_RANDEVU, { baslangic: '2026-09-18T06:30:00.000Z' })
  assert.equal(plan.hata, null)
  assert.equal(plan.alanlar.hatirlatma_gonderildi, false)
  assert.deepEqual(plan.cakismaKontrolu, { baslangic: '2026-09-18T06:30:00.000Z', bitis: AKTIF_RANDEVU.bitis })
})

test('bitiş başlangıçtan önce olamaz; geçersiz durum reddedilir', () => {
  const ters = randevuGuncellemePlani(AKTIF_RANDEVU, { baslangic: '2026-09-18T11:00:00.000Z', bitis: '2026-09-18T10:00:00.000Z' })
  assert.equal(ters.hata, 'Bitiş saati başlangıçtan sonra olmalıdır.')
  assert.deepEqual(ters.alanlar, {})

  const kotu = randevuGuncellemePlani(AKTIF_RANDEVU, { durum: 'ertelendi' })
  assert.equal(kotu.hata, 'Geçersiz durum.')
  assert.deepEqual(kotu.alanlar, {})
})

test('sadece not/tür düzenlemesi durumu ve saati hiç ellemez', () => {
  const plan = randevuGuncellemePlani(IPTAL_RANDEVU, { tur: 'kontrol', notlar: '  öksürük  ' })
  assert.deepEqual(plan.alanlar, { tur: 'kontrol', notlar: 'öksürük' })
  assert.equal(plan.cakismaKontrolu, null)
  assert.equal(plan.reaktivasyon, false)
})

test('çakışma kuralı ile durum listesi aynı cümleyi kurar: iptal dışında her durum slot kaplar', () => {
  for (const d of RANDEVU_DURUMLARI) {
    assert.equal(slotKaplarMi(d), d !== 'iptal', `${d} için slot kaplama kuralı yanlış`)
  }
})

test('arayüz kapısı: iptal edilmiş randevuda "Aktif Hale Getir" GÖRÜNÜR, "İptal Et" görünmez', () => {
  const aks = randevuAksiyonlari('iptal', false)
  assert.equal(aks.aktifEt, true, 'iptal edilmiş randevunun geri dönüş yolu olmalı')
  assert.equal(aks.iptalEt, false)
  // Regresyonun özü: iptal edilmiş randevuda hiçbir aksiyon kalmıyordu.
  assert.equal(aks.yenidenPlanla, true)
  assert.equal(aks.sil, true)
  assert.equal(aks.onayla, false)
  assert.equal(aks.tamamlandi, false)
  assert.equal(aks.gelmedi, false)
})

test('arayüz kapısı: aktif randevuda "İptal Et" var, "Aktif Hale Getir" yok', () => {
  const planlandi = randevuAksiyonlari('planlandi', false)
  assert.equal(planlandi.aktifEt, false)
  assert.equal(planlandi.iptalEt, true)
  assert.equal(planlandi.onayla, true)
  assert.equal(planlandi.tamamlandi, false, 'gelecekteki randevu tamamlandı olarak işaretlenemez')

  const gecmisOnayli = randevuAksiyonlari('onaylandi', true)
  assert.equal(gecmisOnayli.onayla, false, 'zaten onaylı')
  assert.equal(gecmisOnayli.tamamlandi, true)
  assert.equal(gecmisOnayli.gelmedi, true)

  const kapanmis = randevuAksiyonlari('tamamlandi', true)
  assert.equal(kapanmis.tamamlandi, false)
  assert.equal(kapanmis.gelmedi, false)
  assert.equal(kapanmis.iptalEt, true)
})
