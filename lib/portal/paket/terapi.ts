/**
 * BRANS-PAKETI — longevity, fizyoterapi, klinik psikoloji, ergoterapi and odyoloji signature modules. Starting
 * templates the treating professional accepts (and may edit once) before any patient sees them. Sources:
 * docs/kaynak/OZEL-BRANS-PAKETI-ARASTIRMA.md. Allied professions (fizyoterapi, psikoloji, ergoterapi, odyoloji, diyetisyen)
 * never diagnose (RG 22.05.2014/29007 Ek-2); klinik psikoloji copy is never a substitute for emergency services.
 */
import type { PaketModulTanimi } from '../bransPaketi'

// ─── Longevity ──────────────────────────────────────────────────────────────────────────────────────────────────────
export const LONGEVITY_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'long-biyo', brans: 'longevity', tur: 'biyobelirtec', baslik: 'Değerlerim',
    aciklama: 'Hekiminizin istediği tahlil sonuçları, tarihe göre. Değerlendirme hekiminizdedir.',
    varsayilan: { maddeler: ['HbA1c', 'Açlık glukozu', 'LDL kolesterol', 'HDL kolesterol', 'Trigliserid', 'Apolipoprotein B', 'Lipoprotein (a)', 'hs-CRP', '25-OH Vitamin D', 'Vitamin B12', 'Ferritin'] },
    kaynaklar: ['REPO-LONGEVITY-ISTEM'],
  },
  {
    kod: 'long-hedef', brans: 'longevity', tur: 'gunluk', baslik: 'Günlük hedeflerim',
    aciklama: 'Uyku, adım ve hareket. Hedefleri hekiminiz belirler.',
    varsayilan: {
      alanlar: [
        { id: 'uyku', etiket: 'Uyku', tur: 'sayi', min: 0, max: 16, birim: 'saat' },
        { id: 'adim', etiket: 'Adım', tur: 'sayi', min: 0, max: 80000, birim: 'adım' },
        { id: 'aktif', etiket: 'Orta-yoğun hareket', tur: 'sayi', min: 0, max: 600, birim: 'dakika' },
        { id: 'direnc', etiket: 'Kuvvet egzersizi yaptım', tur: 'evet' },
      ],
      not: 'Dünya Sağlık Örgütü erişkinler için haftada 150–300 dakika orta yoğunlukta hareket ve haftada en az 2 gün kuvvet egzersizi önerir.',
    },
    kaynaklar: ['WHO-PA-2020'],
    ayarlar: [
      { id: 'uykuHedef', etiket: 'Uyku hedefi (saat)', tur: 'sayi' },
      { id: 'adimHedef', etiket: 'Adım hedefi', tur: 'sayi' },
      { id: 'aktifHedef', etiket: 'Haftalık aktif dakika hedefi', tur: 'sayi' },
    ],
  },
]

// ─── Fizyoterapi ────────────────────────────────────────────────────────────────────────────────────────────────────
export const FIZYOTERAPI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'fizyo-program', brans: 'fizyoterapi', tur: 'program', baslik: 'Ev egzersiz programım',
    aciklama: 'Fizyoterapistinizin yazdığı egzersizler. Yaptığınız günleri işaretleyin.',
    varsayilan: { maddeler: ['Fizyoterapistinizin programı burada görünür.'], not: 'Egzersiz sırasında keskin ya da artan ağrı olursa durun ve fizyoterapistinize yazın.' },
    kaynaklar: ['YONETMELIK-2014'],
    ayarlar: [{ id: 'satirlar', etiket: 'Egzersizler (her satır: ad — set × tekrar — talimat)', tur: 'satirlar' }],
  },
  {
    kod: 'fizyo-gunluk', brans: 'fizyoterapi', tur: 'gunluk', baslik: 'Ağrı ve hareket günlüğüm',
    aciklama: 'Ağrınızı 0–10 arası ve hareketinizi işaretleyin; fizyoterapistiniz ilerlemeyi görür.',
    varsayilan: {
      alanlar: [
        { id: 'agri', etiket: 'Ağrı (0 yok – 10 en şiddetli)', tur: 'olcek' },
        { id: 'hareket', etiket: 'Hareket kolaylığı (0 çok zor – 10 çok kolay)', tur: 'olcek' },
        { id: 'uyusma', etiket: 'Yeni uyuşma ya da güç kaybı', tur: 'evet' },
        { id: 'idrar', etiket: 'İdrar ya da dışkı kontrolünde yeni sorun, kasıkta uyuşma', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'idrar', kosullar: [{ alan: 'idrar', evet: true }], duzey: 'acil', hasta: 'İdrar/dışkı kontrolünde yeni sorun ya da kasıkta uyuşma acil değerlendirme gerektirir: 112 / acil.', hekim: 'Fizyoterapi: yeni sfinkter sorunu / sakral uyuşma (kırmızı bayrak).' },
        { id: 'uyusma', kosullar: [{ alan: 'uyusma', evet: true }], duzey: 'hekime_bildir', hasta: 'Yeni uyuşma ya da güç kaybı bilgisini fizyoterapistinize ilettik; hekiminize de danışın.', hekim: 'Fizyoterapi: yeni nörolojik belirti (uyuşma / güç kaybı) — hekime yönlendirme.' },
        { id: 'agri', kosullar: [{ alan: 'agri', enAz: 8 }], duzey: 'dikkat', hasta: 'Ağrınız yüksek; programa ara verip fizyoterapistinize yazın.', hekim: 'Fizyoterapi: ağrı ≥ 8/10.' },
      ],
    },
    kaynaklar: ['YONETMELIK-2014', 'REPO-FIZYO-BAYRAK'],
  },
]

// ─── Klinik psikoloji ───────────────────────────────────────────────────────────────────────────────────────────────
export const KRIZ_METNI = 'Kendinize ya da bir başkasına zarar verme düşünceniz varsa bu sayfa yardım için yeterli değildir: şimdi 112’yi arayın ya da en yakın acile gidin. Psikoloğunuza yazdığınız mesajlar anında okunmayabilir.'

export const KLINIK_PSIKOLOG_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'psi-duygu', brans: 'klinik-psikolog', tur: 'gunluk', baslik: 'Duygu günlüğüm',
    aciklama: 'Gününüzü kısaca işaretleyin. Psikoloğunuz görüşmede birlikte bakmak için görür.',
    varsayilan: {
      alanlar: [
        { id: 'duygu', etiket: 'Bugün kendimi nasıl hissediyorum (0 çok kötü – 10 çok iyi)', tur: 'olcek' },
        { id: 'kaygi', etiket: 'Kaygı / gerginlik', tur: 'olcek' },
        { id: 'uyku', etiket: 'Uyku', tur: 'sayi', min: 0, max: 16, birim: 'saat' },
        { id: 'not', etiket: 'Bugün beni etkileyen bir şey', tur: 'metin' },
        { id: 'zarar', etiket: 'Kendime zarar verme düşüncelerim var', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'zarar', kosullar: [{ alan: 'zarar', evet: true }], duzey: 'acil', hasta: KRIZ_METNI, hekim: 'Klinik psikoloji: danışan kendine zarar verme düşüncesi bildirdi.' },
      ],
      not: 'Bu günlük bir değerlendirme ya da tanı aracı değildir.',
    },
    kaynaklar: ['YONETMELIK-2014', 'REPO-PSIKOLOG-KRIZ'],
  },
  {
    kod: 'psi-odev', brans: 'klinik-psikolog', tur: 'program', baslik: 'Görüşmeler arası çalışmam',
    aciklama: 'Psikoloğunuzun görüşmeler arasında önerdiği çalışmalar. Yaptığınız günleri işaretleyin.',
    varsayilan: { maddeler: ['Psikoloğunuzun önerdiği çalışmalar burada görünür.'] },
    kaynaklar: ['YONETMELIK-2014'],
    ayarlar: [{ id: 'satirlar', etiket: 'Görüşmeler arası çalışmalar (her satır bir çalışma)', tur: 'satirlar' }],
  },
]

// ─── Ergoterapi ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const ERGOTERAPI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'ergo-hedef', brans: 'ergoterapi', tur: 'program', baslik: 'Günlük yaşam hedeflerim',
    aciklama: 'Ergoterapistinizin belirlediği günlük etkinlik hedefleri. Yaptıklarınızı işaretleyin.',
    yas: 'eriskin',
    varsayilan: { maddeler: ['Ergoterapistinizin hedefleri burada görünür.'] },
    kaynaklar: ['YONETMELIK-2014'],
    ayarlar: [{ id: 'satirlar', etiket: 'Günlük hedefler (her satır bir etkinlik)', tur: 'satirlar' }],
  },
  {
    kod: 'ergo-cocuk-hedef', brans: 'ergoterapi', tur: 'program', baslik: 'Çocuğumun günlük hedefleri',
    aciklama: 'Ergoterapistin çocuğunuz için belirlediği günlük etkinlikler. Çocuğunuzla yaptıklarınızı işaretleyin.',
    yas: 'cocuk',
    varsayilan: { maddeler: ['Ergoterapistin hedefleri burada görünür.'] },
    kaynaklar: ['YONETMELIK-2014'],
    ayarlar: [{ id: 'satirlar', etiket: 'Çocuğun günlük hedefleri (her satır bir etkinlik)', tur: 'satirlar' }],
  },
  {
    kod: 'ergo-duyusal', brans: 'ergoterapi', tur: 'program', baslik: 'Çocuğumun duyusal planı',
    aciklama: 'Ergoterapistin çocuğunuz için hazırladığı gün içi duyusal etkinlikler. Çocuğunuzla yaptıklarınızı işaretleyin.',
    yas: 'cocuk',
    varsayilan: { maddeler: ['Ergoterapistin duyusal planı burada görünür.'], not: 'Çocuğunuz bir etkinlikten rahatsız olursa zorlamayın ve ergoterapiste yazın.' },
    kaynaklar: ['YONETMELIK-2014'],
    ayarlar: [{ id: 'satirlar', etiket: 'Duyusal plan (her satır: saat / an — etkinlik)', tur: 'satirlar' }],
  },
]

// ─── Odyoloji ───────────────────────────────────────────────────────────────────────────────────────────────────────
export const ODYOLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'odyo-kullanim', brans: 'odyoloji', tur: 'gunluk', baslik: 'Cihaz kullanımım',
    aciklama: 'İşitme cihazınızı bugün kaç saat taktınız? Düzenli kullanım alışmayı kolaylaştırır.',
    varsayilan: {
      alanlar: [
        { id: 'saat', etiket: 'Cihazı taktığım süre', tur: 'sayi', min: 0, max: 24, birim: 'saat' },
        { id: 'zorluk', etiket: 'Zorlandığım ortam (ör. kalabalık, telefon)', tur: 'metin' },
        { id: 'ani', etiket: 'Bir kulakta ani işitme kaybı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'ani', kosullar: [{ alan: 'ani', evet: true }], duzey: 'acil', hasta: 'Ani işitme kaybı acildir: bugün bir kulak burun boğaz hekimine ya da acile başvurun (112).', hekim: 'Odyoloji: ani işitme kaybı bildirdi — aynı gün KBB.' },
      ],
    },
    kaynaklar: ['YONETMELIK-2014', 'REPO-ODYO-ANI'],
    ayarlar: [{ id: 'hedefSaat', etiket: 'Günlük kullanım hedefi (saat)', tur: 'sayi' }],
  },
  {
    kod: 'odyo-cinlama', brans: 'odyoloji', tur: 'gunluk', baslik: 'Çınlama günlüğüm',
    aciklama: 'Çınlamanın şiddetini ve sizi ne kadar rahatsız ettiğini işaretleyin.',
    varsayilanKapali: true,
    varsayilan: {
      alanlar: [
        { id: 'siddet', etiket: 'Çınlama şiddeti', tur: 'olcek' },
        { id: 'rahatsizlik', etiket: 'Beni rahatsız etme düzeyi', tur: 'olcek' },
        { id: 'uyku', etiket: 'Çınlama uykumu etkiledi', tur: 'evet' },
        { id: 'bas_donmesi', etiket: 'Yeni baş dönmesi ile birlikte tek kulakta çınlama', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'bas', kosullar: [{ alan: 'bas_donmesi', evet: true }], duzey: 'hekime_bildir', hasta: 'Bilgiyi odyoloğunuza ilettik; bir kulak burun boğaz hekimine danışın.', hekim: 'Odyoloji: tek taraflı çınlama + yeni baş dönmesi — hekime yönlendirme.' },
      ],
    },
    kaynaklar: ['YONETMELIK-2014'],
  },
  {
    kod: 'odyo-bakim', brans: 'odyoloji', tur: 'liste', baslik: 'Cihaz bakımım',
    aciklama: 'Odyoloğunuzun cihazınıza göre bakım listesi.',
    varsayilan: {
      maddeler: [
        'Her gün: cihazı kuru, yumuşak bir bezle silin; kulak kiri süzgecini kontrol edin.',
        'Her gece: pil kapağını açın ya da şarj ünitesine yerleştirin; nemden koruyun (kurutma kutusu varsa kullanın).',
        'Banyo, duş, havuz ve saç spreyi öncesi cihazı çıkarın.',
        'Süzgeç / kubbe değişimini odyoloğunuzun söylediği aralıkla yapın.',
        'Ses azaldıysa önce süzgeci ve pili kontrol edin; düzelmezse odyoloğunuza yazın.',
      ],
    },
    kaynaklar: ['YONETMELIK-2014', 'REPO-ODYO-CIHAZ'],
  },
]
