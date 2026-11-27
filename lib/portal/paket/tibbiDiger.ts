/**
 * BRANS-PAKETI Phase 2 batch (b) — acil tıp, radyoloji, fizik tedavi, spor hekimliği. Physician-accepted templates;
 * no diagnosis, no dose; 112 on every acil line. Sources: docs/kaynak/TIBBI-BRANS-PAKETI-ARASTIRMA.md.
 */
import type { PaketModulTanimi } from '../bransPaketi'
import { ACIL_112, ANAFILAKSI_ALANI, ANAFILAKSI_BAYRAGI } from './ortak'

// ─── Acil tıp ───────────────────────────────────────────────────────────────────────────────────────────────────────
export const ACIL_TIP_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'acl-zaman', brans: 'acil-tip', tur: 'zaman', baslangicGerekli: true, baslangicEtiketi: 'Taburculuk günü', baslik: 'Acilden sonraki günlerim',
    aciklama: 'Acil servisten çıktıktan sonra neyi ne zaman yapacağınız.',
    varsayilan: {
      adimlar: [
        { gun: 0, baslik: 'Taburculuk', ayrinti: 'Taburculuk belgenizdeki önerileri okuyun; reçetenizi aynı gün alın.' },
        { gun: 1, baslik: 'İlk 24 saat', ayrinti: 'Şikâyetleriniz kötüleşirse beklemeyin; günlüğünüzde tehlike işaretlerini işaretleyin.' },
        { gun: 2, baslik: '48–72 saat', ayrinti: 'Çoğu şikâyet bu sürede belirgin düzelir; düzelmiyorsa aile hekiminize ya da önerilen polikliniğe başvurun.' },
        { gun: 7, baslik: 'Kontrol', ayrinti: 'Size önerilen kontrol muayenesini yaptırdınız mı?' },
      ],
    },
    kaynaklar: ['TATD', 'SB-ACIL-SERVIS'],
  },
  {
    kod: 'acl-belirti', brans: 'acil-tip', tur: 'gunluk', baslangicModulu: 'acl-zaman', baslangicGerekli: true, sonGun: 7, baslik: 'Taburculuk sonrası günlüğüm',
    aciklama: 'İlk bir hafta kendinizi nasıl hissettiğinizi kaydedin.',
    varsayilan: {
      alanlar: [
        { id: 'durum', etiket: 'Kendimi nasıl hissediyorum (0 çok kötü – 10 çok iyi)', tur: 'olcek' },
        { id: 'kotu', etiket: 'Şikâyetlerim kötüleşti', tur: 'evet' },
        { id: 'nefes', etiket: 'Nefes darlığı ya da göğüs ağrısı', tur: 'evet' },
        { id: 'bilinc', etiket: 'Bilinç bulanıklığı ya da bayılma', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'nefes', kosullar: [{ alan: 'nefes', evet: true }], duzey: 'acil', hasta: `Nefes darlığı ya da göğüs ağrısı acildir: ${ACIL_112}`, hekim: 'Taburculuk sonrası: nefes darlığı / göğüs ağrısı.' },
        { id: 'bilinc', kosullar: [{ alan: 'bilinc', evet: true }], duzey: 'acil', hasta: `Bilinç bulanıklığı ya da bayılma acildir: ${ACIL_112}`, hekim: 'Taburculuk sonrası: bilinç değişikliği / senkop.' },
        { id: 'kotu', kosullar: [{ alan: 'kotu', evet: true }], duzey: 'hekime_bildir', hasta: 'Kötüleşmeyi hekiminize ilettik. Beklemeden yeniden değerlendirilmeniz gerekebilir; dayanılmaz bir durumda acile gelin.', hekim: 'Taburculuk sonrası: şikâyetlerde kötüleşme.' },
      ],
    },
    kaynaklar: ['TATD'],
  },
  {
    kod: 'acl-kafa', brans: 'acil-tip', tur: 'liste', varsayilanKapali: true, baslik: 'Kafa travması sonrası',
    aciklama: 'Başınızı çarptıktan sonraki günlerde dikkat edilecekler.',
    varsayilan: {
      maddeler: [
        'İlk 24 saat yanınızda bir yetişkin bulunsun.',
        'Alkol ve uyku ilacı almayın; ağrı kesiciyi hekiminizin önerdiği şekilde kullanın.',
        'Birden fazla kusma, giderek artan baş ağrısı, aşırı uyku hali, konuşma bozukluğu, nöbet ya da kulak / burundan berrak sıvı: 112.',
        'Spora ve ekran başında uzun çalışmaya dönüşü hekiminize sorun.',
      ],
    },
    kaynaklar: ['NICE-KAFA-TRAVMASI-2023', 'TATD'],
  },
]

// ─── Radyoloji ──────────────────────────────────────────────────────────────────────────────────────────────────────
export const RADYOLOJI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'rad-hazirlik', brans: 'radyoloji', tur: 'zaman', baslangicGerekli: true, baslangicEtiketi: 'Tetkik günü', baslik: 'Tetkik hazırlığım',
    aciklama: 'Tetkik gününüze kadar yapılacaklar. Merkezin size verdiği özel talimat her zaman önce gelir.',
    varsayilan: {
      adimlar: [
        { gun: -2, baslik: 'Önceden bildirin', ayrinti: 'Böbrek hastalığı, şeker ilacı kullanımı, kontrast madde alerjisi, gebelik olasılığı, kalp pili ya da vücudunuzda metal varsa merkeze önceden söyleyin.' },
        { gun: -1, baslik: 'Hazırlık', ayrinti: 'Size verilen açlık ve ilaç talimatını kontrol edin.' },
        { gun: 0, baslik: 'Tetkik günü', ayrinti: 'Takı, saç tokası ve kemer gibi metal eşyaları evde bırakın; önceki tetkik sonuçlarınızı yanınızda getirin.' },
        { gun: 1, baslik: 'Kontrastlı tetkik sonrası', ayrinti: 'Hekiminiz aksini söylemediyse bol su için.' },
        { gun: 2, baslik: 'Sonuç', ayrinti: 'Raporunuz hazır olduğunda Sonuçlar bölümünde görünür; değerlendirme hekiminizdedir.' },
      ],
    },
    kaynaklar: ['ESUR-KONTRAST', 'TRD-RADYOLOJI'],
  },
  {
    kod: 'rad-kontrast', brans: 'radyoloji', tur: 'gunluk', baslangicModulu: 'rad-hazirlik', baslangicGerekli: true, enErkenGun: 0, sonGun: 3, baslik: 'Kontrast sonrası günlüğüm',
    aciklama: 'Kontrastlı tetkikten sonraki ilk günler.',
    varsayilan: {
      alanlar: [
        { id: 'dokuntu', etiket: 'Kaşıntılı döküntü', tur: 'evet' },
        { id: 'idrar', etiket: 'İdrarım belirgin azaldı', tur: 'evet' },
        ANAFILAKSI_ALANI,
      ],
      bayraklar: [
        ANAFILAKSI_BAYRAGI,
        { id: 'dokuntu', kosullar: [{ alan: 'dokuntu', evet: true }], duzey: 'hekime_bildir', hasta: 'Geç döküntüyü hekiminize ilettik; bir sonraki tetkikte bu bilgi önemlidir.', hekim: 'Kontrast sonrası: geç tip deri reaksiyonu.' },
        { id: 'idrar', kosullar: [{ alan: 'idrar', evet: true }], duzey: 'hekime_bildir', hasta: 'İdrar azalmasını hekiminize ilettik; bugün ulaşın.', hekim: 'Kontrast sonrası: oligüri (kontrast nefropatisi?).' },
      ],
    },
    kaynaklar: ['ESUR-KONTRAST'],
  },
  {
    kod: 'rad-mr', brans: 'radyoloji', tur: 'liste', isaretlenir: true, baslik: 'MR güvenlik kontrol listem',
    aciklama: 'MR çekiminden önce işaretleyin; güvenliğiniz için önemlidir.',
    varsayilan: {
      maddeler: [
        'Kalp pili, şant, koklear implant ya da vücudumdaki metal bilgisini merkeze verdim',
        'Takı, saat, banka kartı ve telefonu çıkaracağım',
        'Kapalı alan korkum varsa önceden söyledim',
        'Gebelik olasılığımı bildirdim',
      ],
    },
    kaynaklar: ['TRD-RADYOLOJI', 'ACR-MR-GUVENLIK'],
  },
]

// ─── Fizik tedavi ───────────────────────────────────────────────────────────────────────────────────────────────────
export const FIZIK_TEDAVI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'ftr-program', brans: 'fizik-tedavi', tur: 'program', baslik: 'Ev egzersiz programım',
    aciklama: 'Hekiminizin verdiği egzersizler. Ağrısız sınırda yapın ve işaretleyin.',
    varsayilan: {
      maddeler: ['Germe egzersizleri', 'Güçlendirme egzersizleri', 'Duruş ve denge egzersizleri', 'Yürüyüş'],
      not: 'Hekiminiz satırları sizin programınızla değiştirir.',
    },
    ayarlar: [{ id: 'satirlar', etiket: 'Hastaya özel egzersiz satırları (tekrar ve süre yazılabilir)', tur: 'satirlar' }],
    kaynaklar: ['TFTR', 'NICE-NG59'],
  },
  {
    kod: 'ftr-agri', brans: 'fizik-tedavi', tur: 'gunluk', baslik: 'Ağrı ve hareket günlüğüm',
    aciklama: 'Ağrınızı ve hareket kolaylığını kaydedin; programın etkisini birlikte görürsünüz.',
    varsayilan: {
      alanlar: [
        { id: 'agri', etiket: 'Ağrı', tur: 'olcek' },
        { id: 'hareket', etiket: 'Hareket kolaylığı (0 çok zor – 10 çok kolay)', tur: 'olcek' },
        { id: 'egzersiz', etiket: 'Ev programımı yaptım', tur: 'evet' },
        { id: 'uyku', etiket: 'Ağrı yüzünden uykum bölündü', tur: 'evet' },
        { id: 'kacirma', etiket: 'İdrar ya da dışkı kaçırma, kasıklarda uyuşma ya da bacaklarda hızla artan güçsüzlük', tur: 'evet' },
        { id: 'gece', etiket: 'Dinlenince geçmeyen gece ağrısı, ateş ya da istemsiz kilo kaybı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'kacirma', kosullar: [{ alan: 'kacirma', evet: true }], duzey: 'acil', hasta: `Bu belirtiler sinir sıkışmasının acil bulgusu olabilir: ${ACIL_112}`, hekim: 'FTR günlüğü: sfinkter kaybı / eyer anestezisi / ilerleyici güçsüzlük (kauda ekina?).' },
        { id: 'gece', kosullar: [{ alan: 'gece', evet: true }], duzey: 'hekime_bildir', hasta: 'Bu belirtileri hekiminize ilettik; değerlendirilmesi gerekir.', hekim: 'FTR günlüğü: kırmızı bayrak (gece ağrısı / ateş / kilo kaybı).' },
      ],
    },
    kaynaklar: ['TFTR', 'NICE-NG59'],
  },
]

// ─── Spor hekimliği ─────────────────────────────────────────────────────────────────────────────────────────────────
export const SPOR_HEKIMLIGI_PAKETI: readonly PaketModulTanimi[] = [
  {
    kod: 'spr-donus', brans: 'spor-hekimligi', tur: 'zaman', baslangicGerekli: true, baslangicEtiketi: 'Sakatlık günü', baslik: 'Spora dönüş yolum',
    aciklama: 'Sakatlıktan sonra spora dönüş basamakları. Her basamağa ağrısız geçtiğinizde ilerleyin; süreleri hekiminiz sakatlığınıza göre düzenler.',
    varsayilan: {
      adimlar: [
        { gun: 0, baslik: 'Koruma', ayrinti: 'İlk günler ağrıyı artıran hareketlerden kaçının, bölgeyi yüksekte tutun.' },
        { gun: 3, baslik: 'Kontrollü hareket', ayrinti: 'Ağrısız sınırda hareket ve hafif yürüyüş.' },
        { gun: 7, baslik: 'Güçlendirme', ayrinti: 'Hekiminizin ya da fizyoterapistinizin verdiği kuvvet ve denge egzersizleri.' },
        { gun: 14, baslik: 'Spora özgü antrenman', ayrinti: 'Koşu, sıçrama, yön değiştirme — hekiminizin onayıyla.' },
        { gun: 21, baslik: 'Takımla antrenman', ayrinti: 'Temaslı antrenmana kontrollü dönüş.' },
        { gun: 28, baslik: 'Yarışmaya dönüş', ayrinti: 'Hekiminizin onayıyla maça ya da yarışmaya dönüş.' },
      ],
    },
    kaynaklar: ['ARDERN-RTS-2016', 'PEACE-LOVE-2019', 'TSHD'],
  },
  {
    kod: 'spr-sarsinti', brans: 'spor-hekimligi', tur: 'zaman', varsayilanKapali: true, baslangicEtiketi: 'Darbe günü', baslik: 'Beyin sarsıntısından sonra spora dönüş',
    aciklama: 'Her basamak en az bir gün sürer; belirtiler geri gelirse bir önceki basamağa dönün.',
    varsayilan: {
      adimlar: [
        { gun: 0, baslik: 'Göreli dinlenme', ayrinti: 'İlk bir iki gün belirtileri artırmayan hafif günlük aktiviteler; ekran süresini azaltın.' },
        { gun: 2, baslik: 'Hafif aerobik', ayrinti: 'Yürüyüş ya da sabit bisiklet; belirti artarsa durun.' },
        { gun: 3, baslik: 'Spora özgü egzersiz', ayrinti: 'Koşu ve temassız beceri çalışması.' },
        { gun: 4, baslik: 'Temassız antrenman', ayrinti: 'Daha yoğun antrenman, hâlâ temassız.' },
        { gun: 5, baslik: 'Temaslı antrenman', ayrinti: 'Yalnız hekiminizin onayıyla.' },
        { gun: 6, baslik: 'Maça dönüş', ayrinti: 'Hekiminizin onayıyla.' },
      ],
    },
    kaynaklar: ['CISG-AMSTERDAM-2022'],
  },
  {
    kod: 'spr-yuk', brans: 'spor-hekimligi', tur: 'gunluk', baslik: 'Antrenman ve ağrı günlüğüm',
    aciklama: 'Antrenman yükünüzü ve ağrıyı kaydedin; aşırı yüklenmeyi erken fark edersiniz.',
    varsayilan: {
      alanlar: [
        { id: 'sure', etiket: 'Antrenman süresi', tur: 'sayi', min: 0, max: 600, birim: 'dakika' },
        { id: 'zorluk', etiket: 'Antrenman zorluğu (0 çok kolay – 10 en zor)', tur: 'olcek' },
        { id: 'agri', etiket: 'Ağrı', tur: 'olcek' },
        { id: 'ertesi', etiket: 'Ağrı ertesi sabaha kadar sürdü', tur: 'evet' },
        { id: 'sarsinti', etiket: 'Darbeden sonra baş ağrısı, bulantı, sersemlik ya da hafıza sorunu', tur: 'evet' },
        { id: 'agir', etiket: 'Bilinç kaybı, tekrarlayan kusma, nöbet ya da giderek kötüleşen baş ağrısı', tur: 'evet' },
        { id: 'kalp', etiket: 'Egzersiz sırasında göğüs ağrısı, bayılma ya da çarpıntı', tur: 'evet' },
      ],
      bayraklar: [
        { id: 'agir', kosullar: [{ alan: 'agir', evet: true }], duzey: 'acil', hasta: `Bu belirtiler acildir: ${ACIL_112}`, hekim: 'Spor günlüğü: kafa travması sonrası kırmızı bayrak.' },
        { id: 'kalp', kosullar: [{ alan: 'kalp', evet: true }], duzey: 'acil', hasta: `Egzersizde göğüs ağrısı, bayılma ya da çarpıntı acil değerlendirilmelidir; spora ara verin ve ${ACIL_112}`, hekim: 'Spor günlüğü: egzersizle göğüs ağrısı / senkop / çarpıntı.' },
        { id: 'sarsinti', kosullar: [{ alan: 'sarsinti', evet: true }], duzey: 'hekime_bildir', hasta: 'Bugün spora devam etmeyin. Hekiminize ilettik; sarsıntı değerlendirmesi gerekir.', hekim: 'Spor günlüğü: sarsıntı belirtileri.' },
        { id: 'ertesi', kosullar: [{ alan: 'ertesi', evet: true }, { alan: 'agri', enAz: 5 }], duzey: 'dikkat', hasta: 'Ertesi güne süren ağrı yükün fazla geldiğini gösterebilir; bir sonraki antrenmanı hafifletin.', hekim: 'Spor günlüğü: ertesi güne süren ağrı (aşırı yük?).' },
      ],
    },
    kaynaklar: ['TSHD', 'CISG-AMSTERDAM-2022'],
  },
]
