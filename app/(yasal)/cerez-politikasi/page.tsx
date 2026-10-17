import React from 'react'
import Link from 'next/link'
import { YS, YasalKabuk } from '@/components/yasal/YasalKabuk'

export const metadata = {
  title: 'Çerez Politikası — Notya',
  description: 'Notya’nın çerez ve yerel depolama kullanımı: reklam çerezi yok, izleme çerezi yok.',
}

/**
 * HUKUK-01 — Çerez Politikası (Türkiye). DÜRÜSTLÜK: yalnız gerçekten kullanılan mekanizmalar yazılır.
 * Oturum tarayıcının yerel depolamasında tutulur (localStorage auth-token / sb-*-auth-token);
 * reklam veya üçüncü taraf analitik çerezi bu üründe yoktur. Yeni bir izleme aracı eklenirse bu sayfa
 * AYNI değişiklikte güncellenmek zorundadır.
 */
export default function CerezPolitikasiPage() {
  return (
    <YasalKabuk baslik="Çerez Politikası" aktifYol="/cerez-politikasi">
      <div style={YS.box}>
        Kısaca: Notya reklam çerezi ve üçüncü taraf izleme çerezi kullanmaz. Oturumunuzun sürmesi için
        gereken bilgiler tarayıcınızın yerel depolamasında tutulur.
      </div>

      <h2 style={YS.h2}>1. Çerez nedir, yerel depolama nedir?</h2>
      <p style={YS.p}>
        Çerez, bir sitenin tarayıcınıza bıraktığı küçük kayıttır. Yerel depolama (localStorage) ise tarayıcının,
        yalnızca o siteye ait bilgileri cihazınızda tutmasıdır. Notya oturum yönetimini ağırlıklı olarak yerel
        depolama ile yapar.
      </p>

      <h2 style={YS.h2}>2. Zorunlu (teknik) kayıtlar</h2>
      <ul>
        <li style={YS.li}><strong>Oturum bilgisi:</strong> giriş yaptığınızda oturumunuzu süren kimlik belirteci tarayıcınızın yerel depolamasında tutulur. Bu olmadan uygulama çalışmaz.</li>
        <li style={YS.li}><strong>Arayüz tercihleri:</strong> seçtiğiniz görünüm ve benzeri tercihler cihazınızda tutulabilir; sunucuya kimlikle bağlanmaz.</li>
        <li style={YS.li}><strong>Altyapı çerezleri:</strong> uygulamanın barındırıldığı altyapı (Vercel), güvenlik ve yük dengeleme için teknik çerez bırakabilir. Bunlar reklam amacı taşımaz.</li>
      </ul>

      <h2 style={YS.h2}>3. Kullanmadıklarımız</h2>
      <ul>
        <li style={YS.li}>Reklam çerezi kullanmıyoruz.</li>
        <li style={YS.li}>Üçüncü taraf izleme/analitik çerezi kullanmıyoruz. Kullanım ölçümümüz kendi sistemimizde, hasta kimliği ve klinik içerik olmadan yapılır.</li>
        <li style={YS.li}>Verilerinizi reklam ağlarıyla paylaşmıyoruz.</li>
      </ul>

      <h2 style={YS.h2}>4. Üçüncü taraf içerikler</h2>
      <p style={YS.p}>
        Sayfalarımızda yazı tipleri Google Fonts&apos;tan yüklenir; bu yükleme sırasında tarayıcınız Google&apos;a
        olağan bir ağ isteği yapar (IP adresi gibi teknik bilgiler bu istekte görünür). Hekim kendi hesabını
        bağladığında WhatsApp (Meta) bağlantı ekranı kendi çerezlerini kullanabilir; bu yalnızca hekim o bağlantıyı
        başlatırsa olur.
      </p>

      <h2 style={YS.h2}>5. Nasıl silerim?</h2>
      <p style={YS.p}>
        Tarayıcınızın ayarlarından site verilerini (çerezler ve yerel depolama) her zaman silebilirsiniz.
        Oturum bilgisi silinirse yeniden giriş yapmanız gerekir.
      </p>

      <h2 style={YS.h2}>6. Sorular</h2>
      <p style={YS.p}>
        Kişisel verilerle ilgili sorular için <a href="mailto:kvkk@notya.ai" style={YS.baglanti}>kvkk@notya.ai</a>.
        Genel çerçeve: <Link href="/gizlilik" style={YS.baglanti}>Gizlilik Politikası</Link> ve{' '}
        <Link href="/kvkk" style={YS.baglanti}>KVKK Aydınlatma Metni</Link>.
      </p>
    </YasalKabuk>
  )
}
