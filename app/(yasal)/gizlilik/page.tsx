import React from 'react'
import Link from 'next/link'
import { SIRKET_YER_TUTUCU, YS, YasalKabuk } from '@/components/yasal/YasalKabuk'

export const metadata = {
  title: 'Gizlilik Politikası — Notya',
  description: 'Notya’nın kişisel verileri nasıl işlediğinin sade anlatımı. Resmî aydınlatma metni için KVKK sayfasına bakın.',
}

/**
 * HUKUK-01 — Gizlilik Politikası (Türkiye): /kvkk'daki resmî aydınlatma metninin sade, okunur özeti.
 * Resmî metni İKAME ETMEZ; her bölümden /kvkk'ya gidilir. Yeni bir veri kategorisi burada icat edilmez.
 */
export default function GizlilikPage() {
  return (
    <YasalKabuk baslik="Gizlilik Politikası" aktifYol="/gizlilik">
      <div style={YS.box}>
        Bu sayfa, verilerinizle ne yaptığımızı sade bir dille anlatır. 6698 sayılı KVKK uyarınca hazırlanan
        resmî metin: <Link href="/kvkk" style={YS.baglanti}>KVKK Aydınlatma Metni</Link>.
      </div>

      <h2 style={YS.h2}>1. Kim sorumlu?</h2>
      <p style={YS.p}>
        <strong>Hekim hesabınıza ait veriler</strong> (ad, e-posta, uzmanlık, abonelik) için veri sorumlusu Notya&apos;yı
        işleten teşebbüstür: <strong>{SIRKET_YER_TUTUCU}</strong>. <strong>Hastalarınıza ait veriler</strong> için veri
        sorumlusu sizsiniz (hekim/klinik); Notya bu verileri sizin adınıza, veri işleyen olarak işler.
        Ayrıntı: <Link href="/veri-isleme" style={YS.baglanti}>KVKK Veri İşleme Özeti</Link>.
      </p>

      <h2 style={YS.h2}>2. Neleri tutuyoruz?</h2>
      <ul>
        <li style={YS.li}><strong>Hesap:</strong> ad soyad, e-posta, telefon, uzmanlık, giriş kayıtları, abonelik durumu. Kart verisi bizde durmaz; ödeme sağlayıcıda kalır.</li>
        <li style={YS.li}><strong>Hasta kaydı:</strong> hekimin yazdığı veya söylediği klinik içerik — not, randevu, mesaj, yüklenen belge. Ses kaydı yalnızca hekim kaydı başlattığında alınır.</li>
        <li style={YS.li}><strong>Kullanım ölçümü:</strong> hangi sayfa tipinin ne kadar kullanıldığı — hasta kimliği ve klinik içerik olmadan.</li>
      </ul>

      <h2 style={YS.h2}>3. Ne için kullanıyoruz?</h2>
      <ul>
        <li style={YS.li}>Hizmeti sunmak: kaydı tutmak, taslağı üretmek, randevuyu hatırlatmak.</li>
        <li style={YS.li}>Güvenlik: hesapları korumak, kötüye kullanımı önlemek.</li>
        <li style={YS.li}>Yasal yükümlülükler: sağlık ve vergi mevzuatının gerektirdiği kayıtlar.</li>
        <li style={YS.li}>Reklam için kullanmayız; verinizi satmayız.</li>
      </ul>

      <h2 style={YS.h2}>4. Kimlerle paylaşıyoruz?</h2>
      <p style={YS.p}>
        Yalnızca hizmetin çalışması için gereken alt hizmet sağlayıcılarla, sözleşme altında paylaşırız
        (barındırma, yapay zekâ metin işleme, ses dökümü, sesli yanıt, SMS). Yapay zekâ sağlayıcılarına giden
        içerikten ad soyad, T.C. kimlik numarası, telefon ve e-posta otomatik olarak çıkarılır. Tam liste ve
        ayrıntılar: <Link href="/veri-isleme" style={YS.baglanti}>KVKK Veri İşleme Özeti</Link> ve{' '}
        <Link href="/kvkk" style={YS.baglanti}>KVKK Aydınlatma Metni, bölüm 5</Link>.
      </p>

      <h2 style={YS.h2}>5. Ne kadar saklıyoruz?</h2>
      <p style={YS.p}>
        Hasta kayıtları, sağlık mevzuatının öngördüğü süre boyunca; hesap verileri hesap kapandıktan sonra 1 yıl;
        giriş/işlem kayıtları 2 yıl saklanır. Süresi dolan veriler günlük çalışan otomatik imha ile silinir.
        Ayrıntılı tablo: <Link href="/kvkk" style={YS.baglanti}>KVKK Aydınlatma Metni, bölüm 6</Link>.
      </p>

      <h2 style={YS.h2}>6. Nasıl koruyoruz?</h2>
      <ul>
        <li style={YS.li}>Kimlik alanları (T.C. kimlik numarası dâhil) AES-256-GCM ile şifrelenir; aktarım TLS ile yapılır.</li>
        <li style={YS.li}>Her hekim yalnızca kendi hastasının kaydına erişir; erişim ve işlem kayıtları tutulur.</li>
        <li style={YS.li}>Bir veri ihlalinde durum, 72 saat içinde Kişisel Verileri Koruma Kurulu&apos;na ve etkilenen kişilere bildirilir.</li>
      </ul>

      <h2 style={YS.h2}>7. Çerezler ve yerel depolama</h2>
      <p style={YS.p}>
        Reklam veya izleme çerezi kullanmayız. Oturumunuz tarayıcınızın yerel depolamasında tutulur.
        Ayrıntı: <Link href="/cerez-politikasi" style={YS.baglanti}>Çerez Politikası</Link>.
      </p>

      <h2 style={YS.h2}>8. Haklarınız</h2>
      <p style={YS.p}>
        KVKK madde 11 kapsamındaki haklarınız (öğrenme, düzeltme, silme, itiraz ve diğerleri) ve başvuru yolu{' '}
        <Link href="/kvkk" style={YS.baglanti}>KVKK Aydınlatma Metni, bölüm 8</Link>&apos;de açıklanır. Başvuru:{' '}
        <a href="mailto:kvkk@notya.ai" style={YS.baglanti}>kvkk@notya.ai</a>. Hastaysanız ve verinizle ilgili talebiniz
        varsa, veri sorumlusu olan hekiminize başvurmanız esastır; dilerseniz talebinizi hekiminize iletmemiz için
        bize de yazabilirsiniz.
      </p>
    </YasalKabuk>
  )
}
