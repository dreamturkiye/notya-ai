import React from 'react'
import Link from 'next/link'
import { YS, YasalKabuk } from '@/components/yasal/YasalKabuk'

export const metadata = {
  title: 'Yapay Zekâ ve Klinik Karar Desteği — Notya',
  description: 'Notya ve Ayşe karar destek aracıdır: tanı koymaz, tedaviye karar vermez; klinik sorumluluk hekimdedir.',
}

/**
 * HUKUK-01 — Yapay zekâ / klinik karar destek açıklaması (Türkiye).
 * Üslup kuralı FOTO-ARSIV-02 ile aynıdır: karar desteği, asla tanı değil; doğruluk/validasyon iddiası yok;
 * tıbbi cihaz onayı iddiası yok. Bu sayfa hem hekime hem hastaya hitap eder.
 */
export default function KlinikKararDestegiPage() {
  return (
    <YasalKabuk baslik="Yapay Zekâ ve Klinik Karar Desteği" aktifYol="/klinik-karar-destegi">
      <div style={YS.box}>
        Notya ve içindeki asistan Ayşe, hekim için <strong>karar destek</strong> aracıdır.
        <strong> Tanı koymaz, tedaviye karar vermez, reçete düzenlemez.</strong> Tüm klinik kararlar ve bunların
        sorumluluğu hekime aittir.
      </div>

      <h2 style={YS.h2}>1. Ne yapar, ne yapmaz?</h2>
      <ul>
        <li style={YS.li}><strong>Yapar:</strong> muayene kaydından not taslağı çıkarır, bilgiyi derler, hatırlatır, soruya kaynaklı özet sunar, belgeleri düzenler.</li>
        <li style={YS.li}><strong>Yapmaz:</strong> tanı koymaz, tedavi seçmez, ilaç başlatmaz-kesmez, hastaya ne yapacağını söylemez.</li>
        <li style={YS.li}>Ürettiği her taslak, hekim onaylamadan kayda geçmez; onaylayan hekimdir.</li>
      </ul>

      <h2 style={YS.h2}>2. Sınırlar ve doğruluk</h2>
      <ul>
        <li style={YS.li}>Yapay zekâ çıktıları hata, eksik veya güncel olmayan bilgi içerebilir. Hekim, çıktıyı kendi bilgisi ve kaynaklarıyla doğrulamadan hasta bakımında kullanmamalıdır.</li>
        <li style={YS.li}>Bu sayfada veya üründe, çıktıların doğruluğuna ilişkin bir oran ya da klinik geçerlilik (validasyon) iddiası yer almaz.</li>
        <li style={YS.li}>Notya, tıbbî cihaz mevzuatı kapsamında bir tanı cihazı olarak pazarlanmaz; ürünün mevzuattaki nitelendirmesi hukuki incelemededir ve bu sayfa bir onay/izin beyanı değildir.</li>
      </ul>

      <h2 style={YS.h2}>3. Hekimler için</h2>
      <p style={YS.p}>
        Tanı, tedavi, reçete ve hastaya söylenecek söz dâhil nihai karar sizindir; mesleki sorumluluk, mevzuat ve
        meslek kuralları çerçevesinde size aittir. Karar desteğinin önerdiği içerik, sizin onayınız olmadan hastaya
        ulaşmaz. Çerçeve: <Link href="/kullanim-kosullari" style={YS.baglanti}>Kullanım Koşulları, bölüm 4</Link>.
      </p>

      <h2 style={YS.h2}>4. Hastalar için</h2>
      <ul>
        <li style={YS.li}>Sağlığım portalında gördüğünüz içerikler bilgilendirme amaçlıdır; tanı veya tedavi tavsiyesi değildir.</li>
        <li style={YS.li}>Sağlığınızla ilgili kararları hekiminizle birlikte verin; ilacınızı hekiminize danışmadan değiştirmeyin.</li>
        <li style={YS.li}><strong>Acil durumda 112&apos;yi arayın.</strong> Portal ve mesajlar acil durum aracı değildir.</li>
      </ul>

      <h2 style={YS.h2}>5. Veriler</h2>
      <p style={YS.p}>
        Yapay zekâ işlemesinde kimlik bilgileri istek dışarı çıkmadan önce otomatik olarak çıkarılır; ayrıntı:{' '}
        <Link href="/kvkk" style={YS.baglanti}>KVKK Aydınlatma Metni, bölüm 5</Link> ve{' '}
        <Link href="/veri-isleme" style={YS.baglanti}>KVKK Veri İşleme Özeti</Link>.
      </p>
    </YasalKabuk>
  )
}
