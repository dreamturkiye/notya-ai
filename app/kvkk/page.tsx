import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'KVKK Aydınlatma Metni — Notya AI',
  description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.',
}

const S = {
  page: { maxWidth: '820px', margin: '0 auto', padding: '64px 20px 96px', fontFamily: 'system-ui', color: '#0A1628', lineHeight: 1.7 },
  h1: { fontSize: '32px', fontWeight: 400, fontFamily: "'Georgia',serif", marginBottom: '8px' },
  meta: { fontSize: '13px', color: 'rgba(10,22,40,0.5)', marginBottom: '40px' },
  h2: { fontSize: '19px', fontWeight: 500, marginTop: '40px', marginBottom: '12px' },
  p: { fontSize: '15px', marginBottom: '14px' },
  li: { fontSize: '15px', marginBottom: '8px' },
  box: { background: '#EEF4FF', border: '1px solid #2563EB', borderRadius: '8px', padding: '16px 18px', fontSize: '14px', marginBottom: '28px' },
}

export default function KvkkPage() {
  return (
    <div style={S.page}>
      <Link href="/doktor" style={{ fontSize: '13px', color: '#2563EB', textDecoration: 'none' }}>← Notya AI</Link>
      <h1 style={S.h1}>Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni</h1>
      <p style={S.meta}>6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) madde 10 uyarınca · Son güncelleme: 25 Ağustos 2026 (v2)</p>

      <div style={S.box}>
        Bu metin, Notya AI hizmetini kullanan sağlık profesyonellerini ve onların hastalarına ait
        verilerin işlenmesini kapsar. Hasta verileri KVKK madde 6 anlamında <strong>özel nitelikli
        kişisel veri</strong>dir ve bu metinde açıklanan koşullarla işlenir.
      </div>

      <h2 style={S.h2}>1. Veri Sorumlusu</h2>
      <p style={S.p}>
        Veri sorumlusu: <strong>Dream Türkiye</strong> (&quot;Notya AI&quot;). İletişim:
        <a href="mailto:kvkk@notya.ai" style={{ color: '#2563EB' }}> kvkk@notya.ai</a>
      </p>
      <p style={S.p}>
        Hekimin kendi hastalarına ait verileri bakımından <strong>hekim/klinik veri sorumlusu</strong>,
        Notya AI ise <strong>veri işleyen</strong> sıfatıyla hareket eder.
      </p>

      <h2 style={S.h2}>2. İşlenen Kişisel Veriler</h2>
      <p style={S.p}><strong>Hesap sahibi (hekim) verileri:</strong></p>
      <ul>
        <li style={S.li}>Kimlik ve iletişim: ad soyad, e-posta adresi, telefon</li>
        <li style={S.li}>Mesleki bilgiler: uzmanlık alanı, kurum, diploma/tescil bilgisi</li>
        <li style={S.li}>İşlem güvenliği: giriş kayıtları, IP adresi, oturum bilgileri</li>
        <li style={S.li}>Finansal: abonelik ve ödeme durumu (kart verisi tarafımızca saklanmaz)</li>
      </ul>
      <p style={S.p}><strong>Hasta verileri (özel nitelikli):</strong></p>
      <ul>
        <li style={S.li}>Kimlik: ad soyad, T.C. kimlik numarası, doğum tarihi</li>
        <li style={S.li}>Sağlık verileri: şikâyet, tanı, tetkik, görüntüleme, reçete ve ilaç bilgileri, epikriz ve rapor içerikleri</li>
        <li style={S.li}>Ses kaydı ve dökümü: muayene sırasında hekim tarafından oluşturulan kayıtlar</li>
      </ul>

      <h2 style={S.h2}>3. İşleme Amaçları</h2>
      <ul>
        <li style={S.li}>Tıbbî teşhis, tedavi ve bakım hizmetlerinin yürütülmesine yardımcı olmak</li>
        <li style={S.li}>Hekimin tuttuğu kayıtların oluşturulması, saklanması ve raporlanması</li>
        <li style={S.li}>SGK/Medula ve e-Nabız gibi mevzuat kaynaklı süreçlerin desteklenmesi</li>
        <li style={S.li}>Hizmetin sunulması, güvenliğinin sağlanması ve kötüye kullanımın önlenmesi</li>
        <li style={S.li}>Yasal yükümlülüklerin yerine getirilmesi</li>
      </ul>

      <h2 style={S.h2}>4. Hukuki Sebep</h2>
      <p style={S.p}>
        Hekime ait veriler, sözleşmenin kurulması ve ifası ile meşru menfaat hukuki sebeplerine
        dayanılarak işlenir (KVKK m.5).
      </p>
      <p style={S.p}>
        Hasta sağlık verileri, KVKK madde 6 kapsamında <strong>tıbbî teşhis, tedavi ve bakım
        hizmetlerinin yürütülmesi</strong> amacıyla, sır saklama yükümlülüğü altındaki hekim
        tarafından ve <strong>ilgili kişinin açık rızası</strong> ile işlenir. Hastadan açık rızanın
        alınması hekimin sorumluluğundadır.
      </p>

      <h2 style={S.h2}>5. Yurt Dışına Aktarım</h2>
      <p style={S.p}>
        Hizmetin sunulabilmesi için bazı işlemler yurt dışında yerleşik hizmet sağlayıcılarının
        altyapısında gerçekleştirilir. Aktarım, KVKK madde 9 uyarınca <strong>standart
        sözleşmeler</strong> ve gerekli teknik tedbirlerle yapılır.
      </p>
      <ul>
        <li style={S.li}><strong>Veri tabanı ve dosya saklama:</strong> Supabase (barındırma altyapısı)</li>
        <li style={S.li}><strong>Yapay zekâ metin işleme:</strong> Anthropic, OpenAI</li>
        <li style={S.li}><strong>Ses işleme:</strong> Deepgram (döküm), ElevenLabs (sesli yanıt)</li>
        <li style={S.li}><strong>Uygulama barındırma:</strong> Vercel</li>
      </ul>
      <p style={S.p}>
        <strong>Kimliksizleştirme (pseudonymisation).</strong> Yapay zekâ sağlayıcılarına gönderilen
        içerikten, istek yurt dışına çıkmadan önce kimlik bilgileri otomatik olarak çıkarılır ve
        yerlerine geçici etiketler konur. Bu kapsamda <strong>ad-soyad, T.C. kimlik numarası,
        telefon numarası ve e-posta adresi</strong> sağlayıcıya hiçbir şekilde iletilmez; yalnızca
        klinik içerik (şikâyet, bulgu, tanı, tedavi) işlenir. Sağlayıcıdan dönen yanıttaki etiketler,
        yalnızca kendi sistemimizde gerçek değerlerle değiştirilir; hekim ekranında bilgiler eksiksiz
        görünür.
      </p>
      <p style={S.p}>
        Ek bir güvenlik önlemi olarak, gönderilecek metinde T.C. kimlik numarası tespit edilirse
        istek hiç gönderilmez ve işlem durdurulur.
      </p>
      <p style={S.p}>
        Bu sağlayıcılarla, verilerin model eğitiminde kullanılmamasını öngören sözleşmeler yapılır ve
        aktarım KVKK madde 9 uyarınca standart sözleşmeler ile gerçekleştirilir.
      </p>

      <h2 style={S.h2}>6. Saklama Süresi</h2>
      <ul>
        <li style={S.li}>Hasta kayıtları: ilgili sağlık mevzuatında öngörülen süre boyunca; hekimin talebi hâlinde daha erken silinir</li>
        <li style={S.li}>Hesap verileri: hesap açık olduğu sürece ve kapanışından itibaren 1 yıl</li>
        <li style={S.li}>Giriş/işlem kayıtları: 2 yıl</li>
        <li style={S.li}>Süre sonunda veriler silinir, yok edilir veya anonim hâle getirilir</li>
      </ul>

      <h2 style={S.h2}>7. Teknik ve İdari Tedbirler</h2>
      <ul>
        <li style={S.li}>T.C. kimlik numarası ve kimlik alanları AES-256-GCM ile şifrelenerek saklanır</li>
        <li style={S.li}>Veriler yalnızca ilgili hekim hesabına kapalı biçimde erişilebilir</li>
        <li style={S.li}>Aktarım sırasında TLS şifrelemesi kullanılır</li>
        <li style={S.li}>Erişim ve işlem kayıtları tutulur</li>
        <li style={S.li}>Yapay zekâ sağlayıcılarına yapılan aktarımlarda kimlik bilgileri, istek yurt dışına çıkmadan önce otomatik olarak kaldırılır (kimliksizleştirme)</li>
        <li style={S.li}>Saklama süresi dolan veriler için günlük çalışan otomatik imha süreci uygulanır</li>
      </ul>

      <h2 style={S.h2}>8. İlgili Kişinin Hakları (KVKK m.11)</h2>
      <p style={S.p}>Kişisel verisi işlenen herkes; verisinin işlenip işlenmediğini öğrenme, buna ilişkin bilgi talep etme, işlenme amacını öğrenme, yurt içinde/dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, bu işlemlerin aktarılan üçüncü kişilere bildirilmesini isteme, otomatik sistemlerle analiz sonucu aleyhine bir sonuç çıkmasına itiraz etme ve zarara uğraması hâlinde tazminat talep etme haklarına sahiptir.</p>
      <p style={S.p}>
        Başvurularınızı <a href="mailto:kvkk@notya.ai" style={{ color: '#2563EB' }}>kvkk@notya.ai</a> adresine
        iletebilirsiniz. Talepler en geç <strong>30 gün</strong> içinde sonuçlandırılır.
      </p>

      <h2 style={S.h2}>9. Veri İhlali Bildirimi</h2>
      <p style={S.p}>
        Bir veri ihlali tespit edilmesi hâlinde durum, en kısa sürede ve her hâlükârda
        <strong> 72 saat</strong> içinde Kişisel Verileri Koruma Kurulu&apos;na, ayrıca etkilenen
        ilgili kişilere bildirilir.
      </p>

      <p style={{ ...S.meta, marginTop: '48px' }}>
        Bu metin bilgilendirme amaçlıdır ve hukuki danışmanlık yerine geçmez.
      </p>
    </div>
  )
}
