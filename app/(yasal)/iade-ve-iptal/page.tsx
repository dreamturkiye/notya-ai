import React from 'react'
import Link from 'next/link'
import { YS, YasalKabuk } from '@/components/yasal/YasalKabuk'

export const metadata = {
  title: 'İade ve İptal Politikası — Notya',
  description: 'Abonelik iptali, cayma hakkı ve iade esasları. Yasal haklarınız her durumda saklıdır.',
}

/**
 * HUKUK-01 — İade ve İptal (Türkiye). Ticari politika basit tutulur: her an iptal, ödenmiş dönem sonuna kadar
 * hizmet, yasal haklar her durumda üstün. Dayanak: 6502 sayılı TKHK ve Mesafeli Sözleşmeler Yönetmeliği
 * (RG 27.11.2014/29188) m.9 cayma hakkı, m.15 istisnaları. Kaynaklar avukat incelemesi için
 * docs/hukuk/REVIEW-CHECKLIST.md'de listelidir.
 */
export default function IadeVeIptalPage() {
  return (
    <YasalKabuk baslik="İade ve İptal Politikası" aktifYol="/iade-ve-iptal">
      <div style={YS.box}>
        Kısaca: aboneliğinizi dilediğiniz an iptal edebilirsiniz; ödediğiniz dönemin sonuna kadar hizmet sürer ve
        yenileme yapılmaz. Kanundan doğan haklarınız bu politikadan her durumda önce gelir.
      </div>

      <h2 style={YS.h2}>1. Ücretsiz deneme</h2>
      <p style={YS.p}>
        Hizmet 15 günlük ücretsiz deneme ile başlar; deneme için ödeme bilgisi istenmez. Deneme sonunda ücretli
        plana geçmezseniz hesabınızdan ücret alınmaz.
      </p>

      <h2 style={YS.h2}>2. İptal</h2>
      <ul>
        <li style={YS.li}>Aboneliği her an iptal edebilirsiniz; iptalle birlikte bir sonraki yenileme yapılmaz.</li>
        <li style={YS.li}>Ödenmiş dönemin sonuna kadar hizmeti kullanmaya devam edersiniz.</li>
        <li style={YS.li}>İptal için uygulama içinden veya <a href="mailto:billing@notya.io" style={YS.baglanti}>billing@notya.io</a> adresine yazarak başvurabilirsiniz.</li>
        <li style={YS.li}>Hesabınız kapanmadan önce kayıtlarınızı dışa aktarmanız için makul imkân tanınır.</li>
      </ul>

      <h2 style={YS.h2}>3. Cayma hakkı (mesafeli sözleşmeler)</h2>
      <p style={YS.p}>
        6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca,
        <strong> tüketici</strong> sıfatıyla yapılan mesafeli sözleşmelerde 14 gün içinde gerekçesiz cayma hakkı
        vardır (Yönetmelik m.9). Yönetmeliğin 15. maddesi, <strong>elektronik ortamda anında ifa edilen
        hizmetlerde</strong> ve <strong>tüketicinin onayı ile ifasına başlanan hizmetlerde</strong> cayma hakkının
        kullanılamayacağı istisnaları düzenler. Abonelik başlatılırken bu bilgilendirme yapılır ve onayınız alınır.
      </p>
      <p style={YS.p}>
        Mesleki faaliyet kapsamında abonelik alan hekim ve klinikler, kanundaki tanım gereği
        &quot;tüketici&quot; sayılmayabilir; bu durumda da yukarıdaki iptal esasları aynen uygulanır.
        Bu bölümün nihai kapsamı avukat incelemesindedir.
      </p>

      <h2 style={YS.h2}>4. İade</h2>
      <ul>
        <li style={YS.li}>Cayma hakkının geçerli olduğu hâllerde ödeme, talebin ulaşmasından itibaren 14 gün içinde, ödeme aracınıza iade edilir.</li>
        <li style={YS.li}>Hizmetin bizden kaynaklanan nedenle hiç sunulamadığı dönemler için, talep üzerine o döneme karşılık gelen tutar iade edilir veya süre eklenir.</li>
        <li style={YS.li}>Yanlış veya mükerrer tahsilat, bildirim üzerine düzeltilir.</li>
      </ul>

      <h2 style={YS.h2}>5. Yasal haklar saklıdır</h2>
      <p style={YS.p}>
        Bu politika, kanundan doğan haklarınızı daraltmaz. Tüketici sıfatı taşıyan kullanıcıların tüketici hakem
        heyetlerine ve tüketici mahkemelerine başvuru hakları saklıdır. Kullanım çerçevesi için:{' '}
        <Link href="/kullanim-kosullari" style={YS.baglanti}>Kullanım Koşulları</Link>.
      </p>
    </YasalKabuk>
  )
}
