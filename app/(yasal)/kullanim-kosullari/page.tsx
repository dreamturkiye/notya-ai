import React from 'react'
import Link from 'next/link'
import { MAHKEME_YER_TUTUCU, SIRKET_YER_TUTUCU, YS, YasalKabuk } from '@/components/yasal/YasalKabuk'

export const metadata = {
  title: 'Kullanım Koşulları — Notya',
  description: 'Notya hizmetinin kullanım koşulları: hesaplar, roller, beta dönemi, kabul edilebilir kullanım ve sorumluluk.',
}

/**
 * HUKUK-01 — Kullanım Koşulları (Türkiye). Taslak; avukat incelemesi docs/OPEN-COMMITMENTS.md'de açık kayıttır.
 * Şirket henüz kurulmadığı için tüzel kişilik alanları yer tutucudur; hiçbir sicil/sertifika bilgisi uydurulmaz.
 */
export default function KullanimKosullariPage() {
  return (
    <YasalKabuk baslik="Kullanım Koşulları" aktifYol="/kullanim-kosullari">
      <div style={YS.box}>
        Bu koşullar, Notya uygulamasını (&quot;Hizmet&quot;) kullanan sağlık profesyonelleri ve onların
        yetkilendirdiği personel için geçerlidir. Kayıt sırasında bu koşulları kabul etmeniz istenir;
        Hizmeti kullanmanız bu koşulları kabul ettiğiniz anlamına gelir.
      </div>

      <h2 style={YS.h2}>1. Taraflar</h2>
      <p style={YS.p}>
        Hizmet, &quot;Notya&quot; markasıyla sunulur. Hizmeti işleten tüzel kişi: <strong>{SIRKET_YER_TUTUCU}</strong>.
        Şirket kuruluş süreci devam etmektedir; unvan, adres ve sicil bilgileri kuruluş tamamlandığında bu
        sayfada ilan edilir. O tarihe kadar bildirimler için: <a href="mailto:legal@notya.io" style={YS.baglanti}>legal@notya.io</a>.
      </p>

      <h2 style={YS.h2}>2. Hizmetin niteliği ve beta dönemi</h2>
      <p style={YS.p}>
        Notya, hekimler ve klinikler için yapay zekâ destekli bir <strong>klinik kayıt ve karar destek</strong> yazılımıdır.
        Notya tanı koymaz, tedavi kararı vermez ve reçete düzenlemez; taslak hazırlar, hekim onaylar.
        Ayrıntı: <Link href="/klinik-karar-destegi" style={YS.baglanti}>Yapay Zekâ ve Klinik Karar Desteği</Link>.
      </p>
      <p style={YS.p}>
        Hizmet şu anda <strong>beta</strong> aşamasındadır. Beta döneminde: özellikler değişebilir veya kaldırılabilir,
        kesinti ve hata olabilir, ayrı bir hizmet seviyesi (SLA) taahhüdü verilmez. Hizmeti hasta bakımında
        kullanırken bunu bilerek kullanırsınız; kayıtlarınızın hukuken gerekli nüshalarını kendi usulünüzle de
        tutmanız sizin sorumluluğunuzdadır.
      </p>

      <h2 style={YS.h2}>3. Hesaplar ve roller</h2>
      <ul>
        <li style={YS.li}>
          <strong>Hekim hesabı:</strong> hesap, mesleğini icraya yetkili bir hekim adına açılır. Hesap sahibi hekim,
          hesabı altındaki tüm kullanım ve kayıtlardan birinci derecede sorumludur.
        </li>
        <li style={YS.li}>
          <strong>Personel hesapları (sekreter / asistan / hemşire):</strong> hekim veya klinik tarafından açılır ve
          kapatılır. Personel, yalnızca görevinin gerektirdiği bölümlere erişir; erişim yetkilerini tanımlamak ve
          güncel tutmak hekimin/kliniğin sorumluluğundadır.
        </li>
        <li style={YS.li}>Şifreler kişiseldir; hesap ve şifre paylaşılmaz. Yetkisiz erişim şüphesinde şifre derhal değiştirilir ve bize bildirilir.</li>
        <li style={YS.li}>Kayıt bilgileri doğru ve güncel tutulur; uzmanlık ve meslek bilgisinin doğruluğu beyan edene aittir.</li>
      </ul>

      <h2 style={YS.h2}>4. Hekimin mesleki sorumluluğu</h2>
      <p style={YS.p}>
        Tanı, tedavi, reçete, yönlendirme ve hastaya söylenecek söz dâhil tüm klinik kararlar hekime aittir.
        Notya&apos;nın ürettiği her taslak, hekim tarafından doğrulanmadan hasta bakımında kullanılmamalıdır.
        Hastanın aydınlatılması ve gerekli rızaların alınması, ilgili sağlık mevzuatı uyarınca hekimin
        yükümlülüğündedir.
      </p>

      <h2 style={YS.h2}>5. Kabul edilebilir kullanım</h2>
      <ul>
        <li style={YS.li}>Hizmet yalnızca hukuka uygun sağlık hizmeti süreçleri için kullanılır.</li>
        <li style={YS.li}>Başkasına ait kişisel veri, ilgili kişinin bilgisi ve hukuki dayanak olmadan sisteme girilmez.</li>
        <li style={YS.li}>Hizmete zarar verecek, güvenliğini aşacak veya ölçüsüz yük bindirecek kullanım yapılmaz.</li>
        <li style={YS.li}>Yazılım kopyalanmaz, kiralanmaz, üçüncü kişiye sunulmaz; kaynak koda erişmeye çalışılmaz (5846 sayılı FSEK&apos;in emredici hükümleri saklıdır).</li>
        <li style={YS.li}>Başka bir kullanıcının veya hastanın verisine, yetkisi olmadan erişilmeye çalışılmaz.</li>
      </ul>

      <h2 style={YS.h2}>6. Ücretler ve deneme süresi</h2>
      <p style={YS.p}>
        Hizmet, 15 günlük ücretsiz deneme ile başlar; deneme için kredi kartı istenmez. Ücretli plana geçiş,
        seçtiğiniz plan ve ilan edilen fiyat üzerinden yapılır. Fiyat değişiklikleri, mevcut aboneler için
        dönem sonundan önce bildirilir. İptal ve iade esasları:{' '}
        <Link href="/iade-ve-iptal" style={YS.baglanti}>İade ve İptal Politikası</Link>.
      </p>

      <h2 style={YS.h2}>7. Kişisel veriler</h2>
      <p style={YS.p}>
        Kişisel verilerin işlenmesi <Link href="/kvkk" style={YS.baglanti}>KVKK Aydınlatma Metni</Link>,{' '}
        <Link href="/gizlilik" style={YS.baglanti}>Gizlilik Politikası</Link> ve{' '}
        <Link href="/veri-isleme" style={YS.baglanti}>KVKK Veri İşleme Özeti</Link>&apos;nde açıklanır. Hasta verileri
        bakımından hekim/klinik veri sorumlusu, Notya veri işleyendir.
      </p>

      <h2 style={YS.h2}>8. Fikri mülkiyet</h2>
      <p style={YS.p}>
        Yazılım, arayüz ve Notya markası üzerindeki haklar saklıdır; hekimin klinik kayıtları ve notları hekimindir.
        Ayrıntı: <Link href="/telif-hakki" style={YS.baglanti}>Telif Hakkı ve Fikri Mülkiyet</Link>.
      </p>

      <h2 style={YS.h2}>9. Hizmette değişiklik, askıya alma ve fesih</h2>
      <ul>
        <li style={YS.li}>Hizmetin özellikleri geliştirilebilir veya değiştirilebilir; sizi olumsuz etkileyecek önemli değişiklikler makul süre önce duyurulur.</li>
        <li style={YS.li}>Bu koşulların ağır veya tekrarlanan ihlalinde hesap, bildirimle askıya alınabilir veya kapatılabilir.</li>
        <li style={YS.li}>Aboneliğinizi dilediğiniz an iptal edebilirsiniz; hesabınız kapanmadan önce kayıtlarınızı dışa aktarmanız için makul imkân tanınır.</li>
      </ul>

      <h2 style={YS.h2}>10. Sorumluluğun sınırlandırılması</h2>
      <p style={YS.p}>
        Hizmet, beta döneminde &quot;olduğu gibi&quot; sunulur. Hukukun izin verdiği azami ölçüde: Notya, dolaylı
        zararlardan, veri kaybının hekim tarafından yedeklenmemesinden doğan zararlardan ve Hizmetin klinik karar
        yerine konulmasından doğan sonuçlardan sorumlu tutulamaz. Kasıt ve ağır kusur hâlleri ile tüketicinin ve
        ilgili kişinin kanundan doğan hakları ve emredici hükümler her durumda saklıdır. Bu bölümün nihai kapsamı
        avukat incelemesindedir.
      </p>

      <h2 style={YS.h2}>11. Uygulanacak hukuk ve uyuşmazlık</h2>
      <p style={YS.p}>
        Bu koşullar Türk hukukuna tabidir. Yetkili mahkeme ve icra daireleri: <strong>{MAHKEME_YER_TUTUCU}</strong>.
        Tüketici sıfatı taşıyan kullanıcıların tüketici hakem heyetlerine ve tüketici mahkemelerine başvuru hakları saklıdır.
      </p>

      <h2 style={YS.h2}>12. Değişiklikler ve iletişim</h2>
      <p style={YS.p}>
        Bu koşullar güncellenebilir; güncel sürüm her zaman bu sayfadadır ve önemli değişiklikler uygulama içinden
        duyurulur. Sorular için: <a href="mailto:legal@notya.io" style={YS.baglanti}>legal@notya.io</a> ·
        destek için: <a href="mailto:support@notya.io" style={YS.baglanti}>support@notya.io</a>.
      </p>
    </YasalKabuk>
  )
}
