import React from 'react'
import Link from 'next/link'
import { SIRKET_YER_TUTUCU, YS, YasalKabuk } from '@/components/yasal/YasalKabuk'

export const metadata = {
  title: 'Telif Hakkı ve Fikri Mülkiyet — Notya',
  description: 'Yazılım ve marka üzerindeki haklar, hekimin kendi kayıtları üzerindeki hakları ve ihlal bildirimi yolu.',
}

/**
 * HUKUK-01 — Telif Hakkı ve Fikri Mülkiyet (Türkiye). Dayanak: 5846 sayılı FSEK.
 * İlke: yazılım/marka Notya'yı işleten teşebbüsün; hekimin klinik verisi ve notları hekimin.
 * Tescil numarası, marka başvuru numarası gibi bilgiler UYDURULMAZ; şirket kurulunca eklenir.
 */
export default function TelifHakkiPage() {
  return (
    <YasalKabuk baslik="Telif Hakkı ve Fikri Mülkiyet" altBaslik="5846 sayılı Fikir ve Sanat Eserleri Kanunu çerçevesinde" aktifYol="/telif-hakki">
      <h2 style={YS.h2}>1. Yazılım ve marka</h2>
      <p style={YS.p}>
        Notya yazılımı, arayüzü, görselleri ve &quot;Notya&quot; adı üzerindeki tüm haklar, 5846 sayılı Fikir ve Sanat
        Eserleri Kanunu ve ilgili mevzuat uyarınca Notya&apos;yı işleten teşebbüse aittir: <strong>{SIRKET_YER_TUTUCU}</strong>.
        Aboneliğiniz size yazılımı kullanma hakkı verir; yazılımın kendisini veya bir kopyasını devretmez.
      </p>
      <ul>
        <li style={YS.li}>Yazılım kopyalanamaz, dağıtılamaz, kiralanamaz, alt lisansla üçüncü kişiye verilemez.</li>
        <li style={YS.li}>Kaynak koda erişilmeye ve tersine mühendislik yapılmaya çalışılamaz; FSEK&apos;in emredici hükümleriyle tanınan sınırlı hâller saklıdır.</li>
        <li style={YS.li}>&quot;Notya&quot; adı ve görsel kimliği, yazılı izin olmadan başka ürün veya hizmette kullanılamaz.</li>
      </ul>

      <h2 style={YS.h2}>2. Hekimin verisi hekimindir</h2>
      <p style={YS.p}>
        Hesabınıza girdiğiniz klinik kayıtlar, notlar, belgeler ve hasta verileri üzerindeki haklar size
        (hekime/kliniğe) aittir. Notya bu içerikleri yalnızca hizmeti sunmak için, sözleşme ve{' '}
        <Link href="/veri-isleme" style={YS.baglanti}>veri işleme çerçevesi</Link> kapsamında işler; başka amaçla
        kullanmaz, satmaz, model eğitiminde kullandırmaz.
      </p>

      <h2 style={YS.h2}>3. Yapay zekâ çıktıları</h2>
      <p style={YS.p}>
        Hizmet içinde sizin için üretilen taslaklar (not, özet, rapor taslağı), sizin klinik kaydınızın parçasıdır
        ve mesleki faaliyetinizde serbestçe kullanılabilir. Notya bu çıktılar üzerinde size karşı telif iddiasında
        bulunmaz. Çıktının içeriğinden doğan mesleki sorumluluk, onaylayan hekime aittir
        (bkz. <Link href="/klinik-karar-destegi" style={YS.baglanti}>Yapay Zekâ ve Klinik Karar Desteği</Link>).
      </p>

      <h2 style={YS.h2}>4. Üçüncü taraf bileşenler</h2>
      <p style={YS.p}>
        Yazılım, kendi lisanslarıyla sunulan açık kaynak bileşenler içerir. Bu bileşenlerin lisans koşulları
        kendi sahipleri adına saklıdır.
      </p>

      <h2 style={YS.h2}>5. İhlal bildirimi</h2>
      <p style={YS.p}>
        Notya üzerinde telif hakkınızın ihlal edildiğini düşünüyorsanız{' '}
        <a href="mailto:legal@notya.io" style={YS.baglanti}>legal@notya.io</a> adresine yazın. Bildirimde şunlar
        bulunmalıdır:
      </p>
      <ul>
        <li style={YS.li}>Ad soyad / unvan ve iletişim bilgisi,</li>
        <li style={YS.li}>Hak sahibi olduğunuz eserin tarifi,</li>
        <li style={YS.li}>İhlal edildiğini düşündüğünüz içeriğin yeri (bağlantı veya ekran görüntüsü),</li>
        <li style={YS.li}>Bildirimin doğruluğuna ilişkin beyanınız.</li>
      </ul>
      <p style={YS.p}>
        Bildirimler incelenir; haklı bulunan taleplerde içerik kaldırılır veya erişim durdurulur ve ilgili kullanıcı
        bilgilendirilir. Kötü niyetli bildirimlerden doğan sorumluluk bildirene aittir.
      </p>
    </YasalKabuk>
  )
}
