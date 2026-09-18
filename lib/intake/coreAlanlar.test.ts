/**
 * NOTYA-INTAKE-08 (Dr. Gökhan, 2026-09-17) — 'Yoksa "Yok" yazın' ipucu taşıyan alanlar
 * ZORUNLU OLMAMALI. Hastaların çoğunun özel sigortası yok; alan zorunlu kalırsa hasta formu
 * göndermek için kutuya "Yok" yazmak zorunda kalıyordu. Bu test o gerilemeyi kilitler:
 * ipucu metni ile zorunluluk bayrağı bir daha çelişemez.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { CORE_BOLUMLER, coreBolumlerIcin, type IntakeAlan, type IntakeBolum } from './coreAlanlar'
import { BRANS_SORULARI } from './bransSorulari'
import { intakeSunucuHataMetni, intakeIstemciHataMetni } from './dogrula'

const BRANSLAR = Object.keys(BRANS_SORULARI)
const ipucuVar = (a: IntakeAlan) => /yoksa\s*"?yok"?\s*yaz/i.test(a.placeholder || '')
const tumAlanlar = (brans: string) => coreBolumlerIcin(brans).flatMap((b) => b.alanlar)

test('Sağlık Güvencesi: üç sigorta alanı isteğe bağlı (yıldız yok, doğrulama yok)', () => {
  const guvence: IntakeBolum | undefined = CORE_BOLUMLER.find((b) => b.baslik === 'Sağlık Güvencesi')
  assert.ok(guvence, 'Sağlık Güvencesi bölümü bulunamadı')
  for (const id of ['sigortaSirketi', 'policeNo', 'kurumAdi']) {
    const alan: IntakeAlan | undefined = guvence.alanlar.find((a) => a.id === id)
    assert.ok(alan, `${id} alanı kaldırılmış — alan durmalı, yalnız zorunluluğu kalkmalı`)
    assert.equal(alan.zorunlu, undefined, `${id} hâlâ zorunlu`)
    assert.equal(alan.placeholder, 'Yoksa "Yok" yazın', `${id} ipucu metni korunmalı`)
  }
  // Güvence türünün kendisi (SGK/özel/ücretli) zorunlu kalmalı — bu alanda "Yok" ipucu yok.
  assert.equal(guvence.alanlar.find((a) => a.id === 'sigortaTuru')?.zorunlu, true)
})

test('her branşta: "Yoksa Yok yazın" ipucu olan hiçbir alan zorunlu değil', () => {
  for (const brans of BRANSLAR) {
    for (const alan of tumAlanlar(brans)) {
      if (ipucuVar(alan)) assert.equal(alan.zorunlu, undefined, `${brans}/${alan.id} ipucu "Yok" diyor ama zorunlu`)
    }
    for (const alan of BRANS_SORULARI[brans as keyof typeof BRANS_SORULARI]?.alanlar || []) {
      if (ipucuVar(alan)) assert.equal(alan.zorunlu, undefined, `${brans} branş sorusu ${alan.id} ipucu "Yok" diyor ama zorunlu`)
    }
  }
})

/** Sentetik QA hastası — gerçek hasta verisi DEĞİL. Sigorta alanları bilerek boş. */
const QA_YANIT: Record<string, unknown> = {
  tcKimlik: '12345678901', ad: 'Sentetik', soyad: 'Test', dogumTarihi: '1985-04-12', cinsiyet: 'Kadın',
  dogumYeri: 'Ankara', babaAdi: 'Test', anneAdi: 'Test', medeniDurum: 'Evli',
  telefon: '05551112233', eposta: 'qa@example.test', adres: 'Test Mah. 1. Sok. No:1',
  acilKisiAdi: 'Sentetik Yakın', acilKisiTelefon: '05554445566', acilKisiYakinlik: 'eş',
  sigortaTuru: 'SGK',
  kanGrubu: 'A Rh+', kronikHastaliklar: ['Yok'], kullaniyorMu: 'Hayır',
  alerjiVarMi: 'Bilinen alerjisi yok', aileOykusu: 'Bilinen ciddi hastalık yok',
  sigara: 'Kullanmıyorum', alkol: 'Kullanmıyorum',
  kvkkOnay: 'Kabul ediyorum',
}

test('doğru beyan alanı formda yok — yalnız KVKK zorunlu', () => {
  for (const brans of BRANSLAR) {
    const onay = coreBolumlerIcin(brans).find((b) => b.baslik === 'Onay')!
    assert.ok(!onay.alanlar.some((a) => a.id === 'dogruBeyan'), brans)
    assert.ok(onay.alanlar.some((a) => a.id === 'kvkkOnay'), brans)
  }
})

  // Hem hastanın gördüğü istemci kontrolü hem de sunucu kontrolü — ikisi de geçmeli.
  for (const brans of BRANSLAR) {
    const bolumler = coreBolumlerIcin(brans)
    assert.equal(intakeIstemciHataMetni(bolumler, QA_YANIT), null, `${brans}: istemci boş sigorta alanlarını bloke ediyor`)
    assert.equal(intakeSunucuHataMetni(bolumler, QA_YANIT), null, `${brans}: sunucu boş sigorta alanlarını bloke ediyor`)
  }
})

test('gerçekten zorunlu alanlar hâlâ korunuyor + TC deseni uygulanıyor', () => {
  const bolumler = coreBolumlerIcin('dahiliye')
  const eksikAd = { ...QA_YANIT, ad: '' }
  assert.match(String(intakeSunucuHataMetni(bolumler, eksikAd)), /zorunludur/)
  assert.match(String(intakeIstemciHataMetni(bolumler, eksikAd)), /Lütfen "Adı" alanını doldurun/)
  const kotuTc = { ...QA_YANIT, tcKimlik: '123' }
  assert.match(String(intakeSunucuHataMetni(bolumler, kotuTc)), /11 haneli/)
  assert.match(String(intakeIstemciHataMetni(bolumler, kotuTc)), /11 haneli/)
  // Boş + isteğe bağlı alan desen kontrolüne takılmaz.
  assert.equal(intakeSunucuHataMetni(bolumler, { ...QA_YANIT, sigortaSirketi: '' }), null)
})
