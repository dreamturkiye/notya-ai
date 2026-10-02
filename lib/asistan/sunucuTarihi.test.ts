/**
 * NOTYA-AYSE-GERI-04 — the day and time the doctor SAID, resolved by the server in the doctor's timezone. Pure.
 * The route-level effect (the model's wrong date is replaced on the card) is in lib/asistan/ayseKomut.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mevcutRandevuGunu, sunucuTarihDegerleri } from './sunucuTarihi'

// 2026-10-01 22:30 UTC = Fri 2 Oct 01:30 in İstanbul, Thu 1 Oct 18:30 in New York.
const simdi = new Date('2026-10-01T22:30:00Z')
const IST = 'Europe/Istanbul'
const NY = 'America/New_York'
const deger = (anahtar: string, mesaj: string, saatDilimi = IST, ek: { randevuTarih?: string | null; randevuSaat?: string | null } = {}) =>
  sunucuTarihDegerleri({ anahtar, mesaj, saatDilimi, simdi, ...ek })

describe('aşı kaydı — "bugün / dün / az önce" doktorun saat diliminde', () => {
  it('aynı an, iki saat dilimi: "bugün" doktorun günüdür', () => {
    assert.deepEqual(deger('asi_kaydi_ekle', 'Hepatit B aşısı bugün yapıldı, kaydet', IST), { uygulama_tarihi: '2026-10-02' })
    assert.deepEqual(deger('asi_kaydi_ekle', 'Hepatit B aşısı bugün yapıldı, kaydet', NY), { uygulama_tarihi: '2026-10-01' })
  })
  it('dün, az önce, demin, bu sabah, gün-ay, gg.aa.yyyy', () => {
    assert.deepEqual(deger('asi_kaydi_ekle', 'KKK dün yapıldı, dosyaya gir', NY), { uygulama_tarihi: '2026-09-30' })
    for (const soz of ['Az önce Hepatit A aşısını yaptık, kaydet', 'Demin KPA yapıldı, dosyaya işle', 'Bu sabah BCG yapıldı, kaydet']) {
      assert.deepEqual(deger('asi_kaydi_ekle', soz, NY), { uygulama_tarihi: '2026-10-01' }, soz)
    }
    assert.deepEqual(deger('asi_kaydi_ekle', 'KKK 3 Eylül’de yapıldı, kaydet'), { uygulama_tarihi: '2026-09-03' })
    assert.deepEqual(deger('asi_kaydi_ekle', 'KKK 03.09.2026 tarihinde yapıldı, kaydet'), { uygulama_tarihi: '2026-09-03' })
  })
  it('emin olunamayan durumda sunucu karışmaz: tarih yok, iki gün, "sonraki doz", gelecek gün', () => {
    for (const soz of [
      'Hepatit B aşısını dosyaya gir',
      'Hepatit B dün yapıldı, sonraki doz 3 Kasım',
      'KKK bugün yapıldı, rapel yarın',
      'KKK aşısı yarın yapılacak, kaydet',
      'Aşı pazartesi yapıldı, kontrol cuma',
    ]) assert.deepEqual(deger('asi_kaydi_ekle', soz), {}, soz)
  })
})

describe('ilaç — başlangıç ve bitiş günü', () => {
  it('tek gün sözü alanına yazılır; bitiş / süre sözü varsa başlangıca dokunulmaz', () => {
    assert.deepEqual(deger('ilac_ekle', 'Amoksisilin 250 mg 2x1 bugün başladı, ilaçlarına ekle', NY), { baslangic_tarihi: '2026-10-01' })
    assert.deepEqual(deger('ilac_ekle', 'Amoksisilin 250 mg 2x1 ilaçlarına ekle'), {})
    assert.deepEqual(deger('ilac_ekle', 'Amoksisilin 250 mg 2x1 cumaya kadar, ilaçlarına ekle'), {})
    assert.deepEqual(deger('ilac_sonlandir', 'Ventolini dün kestik, kaydet', NY), { bitis_tarihi: '2026-09-30' })
    assert.deepEqual(deger('ilac_sonlandir', 'Ventolini kes'), {})
  })
})

describe('randevu — gün ve saat', () => {
  it('oluştur: çağıranın çözdüğü gün ve saat (bekleyen komut dahil)', () => {
    assert.deepEqual(deger('kontrol_randevusu_olustur', '14:30', IST, { randevuTarih: '2026-10-03', randevuSaat: '14:30' }), { tarih: '2026-10-03', saat: '14:30' })
    assert.deepEqual(deger('kontrol_randevusu_olustur', 'Randevu oluştur', IST, {}), {})
  })
  it('taşı: "yarınki randevusunu cumaya al" — ilk gün randevuyu seçer, ikincisi yeni gündür', () => {
    // İstanbul "now" is Friday 2 Oct: yarın = 3 Oct (Sat), cuma = today's Friday → 2 Oct per the resolver's rule.
    assert.deepEqual(mevcutRandevuGunu('Yarınki randevusunu pazartesiye al', IST, simdi), { gun: '2026-10-03', kalan: ' randevu pazartesiye al ' })
    assert.deepEqual(deger('randevu_tasi', 'Yarınki randevusunu pazartesiye saat 15:00’e al', IST, { randevuTarih: '2026-10-03', randevuSaat: '15:00' }), { mevcut_tarih: '2026-10-03', tarih: '2026-10-05', saat: '15:00' })
    assert.deepEqual(deger('randevu_tasi', 'Cuma günkü randevuyu 16:00’ya çek', NY, { randevuTarih: '2026-10-02', randevuSaat: '16:00' }), { mevcut_tarih: '2026-10-02', saat: '16:00' })
    assert.deepEqual(deger('randevu_tasi', '10 Ekim’deki randevusunu 12 Ekim’e al', IST, { randevuTarih: '2026-10-10' }), { mevcut_tarih: '2026-10-10', tarih: '2026-10-12' })
  })
  it('taşı: işaretsiz iki gün tahmin edilmez; tek gün yeni gündür', () => {
    assert.deepEqual(deger('randevu_tasi', 'Pazartesi randevusunu cumaya al', IST, { randevuTarih: '2026-10-05' }), {})
    assert.deepEqual(deger('randevu_tasi', 'Randevusunu perşembeye al', IST, { randevuTarih: '2026-10-08' }), { tarih: '2026-10-08' })
    assert.deepEqual(deger('randevu_tasi', 'Randevu saatini 15:30 olarak değiştir', IST, { randevuSaat: '15:30' }), { saat: '15:30' })
  })
  it('iptal: cümledeki gün iptal edilecek randevunun günüdür', () => {
    assert.deepEqual(deger('randevu_iptal', 'Yarınki randevusunu iptal et', NY), { mevcut_tarih: '2026-10-02' })
    assert.deepEqual(deger('randevu_iptal', 'Randevusunu iptal et', NY), {})
  })
})

describe('diğer araçlar', () => {
  it('tarih alanı olmayan ya da sunucunun okumadığı araçta boş döner', () => {
    for (const a of ['alerji_ekle', 'olcum_ekle', 'dosya_notu_ekle', 'hasta_bilgisi_duzelt', 'bilinmeyen']) assert.deepEqual(deger(a, 'bugün kaydet'), {}, a)
  })
})
