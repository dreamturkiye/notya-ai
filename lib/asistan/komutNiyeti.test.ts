/**
 * NOTYA-AYSE-GERI-03 — command intent: which sentence is a request to change a record, and which tool it names.
 * Pure. The route-level effect (skipped routers, forced tool call, card) is in lib/asistan/ayseKomut.test.ts.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { komutNiyetiBul } from './komutNiyeti'

const TZ = 'Europe/Istanbul'
const bul = (m: string) => komutNiyetiBul(m, { saatDilimi: TZ, simdi: new Date('2026-10-01T09:00:00Z') })

describe('komut niyeti — doğal ifade → araç', () => {
  it('her cümle tek bir araca gider ve çağrı zorlanır', () => {
    const beklenen: [string, string][] = [
      ['Penisilin alerjisini ekle', 'alerji_ekle'],
      ['Fıstık alerjisi var, dosyaya işle', 'alerji_ekle'],
      ['Penisilin alerjisi yaz', 'alerji_ekle'],
      ['Yumurta alerjisini kaldır', 'alerji_kaldir'],
      ['Astım tanısını kronik hastalıklara ekle', 'kronik_hastalik_ekle'],
      ['Kronik hastalıklarına tip 1 diyabet ekleyelim', 'kronik_hastalik_ekle'],
      ['Kilosunu 12,4 kilo olarak ekle', 'olcum_ekle'],
      ['Boyu 86 santim, kilosu 12,4; kaydet', 'olcum_ekle'],
      ['Ateşi 38,2, kaydet', 'olcum_ekle'],
      ['Tansiyonu 110/70 olarak işle', 'olcum_ekle'],
      ['Baş çevresi 47 santim, kaydet', 'bas_cevresi_ekle'],
      ['Amoksisilin 250 mg günde iki kez ilaçlarına ekle', 'ilac_ekle'],
      ['Ventolin 2 puf günde 4 kez başla', 'ilac_ekle'],
      ['Ventolini kes', 'ilac_sonlandir'],
      ['Singulair’i sonlandır', 'ilac_sonlandir'],
      ['Demir şurubunu keser misin', 'ilac_sonlandir'],
      ['Ventolinin dozunu 2x2 olarak değiştir', 'ilac_doz_degistir'],
      ['Pulmicort dozunu 200 mikrograma çıkar', 'ilac_doz_degistir'],
      ['Dozunu 2x2 yap', 'ilac_doz_degistir'],
      ['Dosyasına not al: annesi sigarayı bıraktı', 'dosya_notu_ekle'],
      ['Şunu not düş: kontrolde EEG istenecek', 'dosya_notu_ekle'],
      ['Aşıyı dosyaya gir', 'asi_kaydi_ekle'],
      ['Hepatit B aşısı dün yapıldı, kaydet', 'asi_kaydi_ekle'],
      ['Hepatit B dün yapıldı, sonraki doz 3 ay sonra, kaydet', 'asi_kaydi_ekle'],
      ['KKK bugün yapıldı, dosyaya işle', 'asi_kaydi_ekle'],
      ['Doğum tarihini 12.03.2021 olarak düzelt', 'hasta_bilgisi_duzelt'],
      ['Yarın saat 14:00 için kontrol randevusu oluştur', 'kontrol_randevusu_olustur'],
      ['Haftaya salı 10:30 kontrol randevusu ver', 'kontrol_randevusu_olustur'],
      ['Randevusunu perşembeye al', 'randevu_tasi'],
      ['Randevu saatini 15:30 olarak değiştir', 'randevu_tasi'],
      ['Randevusunu iptal et', 'randevu_iptal'],
    ]
    for (const [cumle, arac] of beklenen) {
      const r = bul(cumle)
      assert.equal(r?.arac, arac, `${cumle} → ${JSON.stringify(r)}`)
      assert.equal(r?.zorla, true, cumle)
    }
  })

  it('gün ve saat söylenmeyen randevu isteği komuttur ama çağrı zorlanmaz (boş kart yerine tek soru)', () => {
    for (const cumle of ['Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?', 'Randevu oluştur', 'Randevu saatini değiştirmek istiyorum', 'Randevusunu erteleyelim']) {
      const r = bul(cumle)
      assert.ok(r, cumle)
      assert.equal(r!.zorla, false, cumle)
    }
    assert.equal(bul('Randevusunu iptal et')?.zorla, true, 'iptal için gün gerekmez')
  })

  it('tek araç seçilemeyen kayıt isteği: herhangi bir araç zorlanır', () => {
    for (const cumle of ['Epikrizdekileri dosyaya gir', 'Bunu kaydet', 'Bunları işle', 'Epikriz hazırla', 'Kilosunu ve penisilin alerjisini kaydet']) {
      const r = bul(cumle)
      assert.deepEqual(r && { arac: r.arac, zorla: r.zorla }, { arac: null, zorla: true }, cumle)
    }
  })

  it('soru, bilgi cümlesi ve geçmiş zaman komut değildir', () => {
    for (const cumle of [
      'Kilosu kaç?', 'Alerjisi var mı?', 'Aşıları tam mı?', 'Büyümesi nasıl gidiyor?', 'Annesinin adı ne?',
      'Bugün randevum var mı?', 'Yarın 15:00 boş mu?', 'Yarın kimler geliyor?', 'Yarın hangi saatler boş?', 'Randevuları listele',
      'Alerjisi eklendi mi?', 'İlacı kesti mi?', 'Ventolini ne zaman kestik?', 'Dün randevu aldı mı?',
      'Bu ilaç ağrıyı keser', 'Yazın alerjisi artıyor', 'Tanısı kesin mi?', 'Bu kesin değil', 'Kesin tanı nedir',
      'Otitte ilk seçenek tedavi nedir', 'Ateşli çocukta parasetamol dozu nedir', 'İlaç etkileşimi var mı kontrol et',
      'Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz', 'Aşı karnesini tablo olarak göster', 'Deniz Aksoy dosyasını aç',
      'Sesi kes', 'Tamam kes', 'Kısa kes', 'Toplam kaç aşısı var', 'Merhaba Ayşe, nasılsın?',
      'Augmentin yaz', 'Antibiyotik yazalım mı?',
    ]) assert.equal(bul(cumle), null, cumle)
  })
})
