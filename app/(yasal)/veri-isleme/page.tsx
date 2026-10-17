import React from 'react'
import Link from 'next/link'
import { SIRKET_YER_TUTUCU, YS, YasalKabuk } from '@/components/yasal/YasalKabuk'

export const metadata = {
  title: 'KVKK Veri İşleme Özeti — Notya',
  description: 'Hekim (veri sorumlusu) ile Notya (veri işleyen) arasındaki veri işleme çerçevesi ve alt işleyici listesi.',
}

/**
 * HUKUK-01 — KVKK Veri İşleme / DPA özeti (Türkiye). Bu sayfa, imzalı bir veri işleme sözleşmesinin yerini tutmaz;
 * çerçeveyi ve alt işleyicileri şeffaf biçimde ilan eder. Alt işleyici listesi KODA GÖRE yazılmıştır
 * (lib/ai/cagir.ts → OpenRouter birincil, Anthropic koruyucu; lib/transcription → Deepgram; lib/asistan → ElevenLabs;
 * lib/iletisim/sms → NetGSM; Supabase + Vercel barındırma; Meta yalnız hekim WhatsApp bağlarsa). Yeni bir sağlayıcı
 * eklenirse bu liste AYNI değişiklikte güncellenir.
 */
const ALT_ISLEYICILER: ReadonlyArray<{ ad: string; is: string; not?: string }> = [
  { ad: 'Supabase', is: 'Veri tabanı ve dosya barındırma' },
  { ad: 'Vercel', is: 'Uygulama barındırma' },
  { ad: 'OpenRouter', is: 'Yapay zekâ isteklerinin iletimi (kullanılan modeller: OpenAI ve Anthropic)', not: 'Kimlik bilgileri istek yurt dışına çıkmadan önce otomatik çıkarılır.' },
  { ad: 'Anthropic', is: 'Yapay zekâ metin işleme (koruyucu model, doğrudan)', not: 'Aynı kimliksizleştirme uygulanır.' },
  { ad: 'Deepgram', is: 'Ses kaydının yazıya dökümü' },
  { ad: 'ElevenLabs', is: 'Sesli yanıt üretimi' },
  { ad: 'NetGSM', is: 'SMS gönderimi (randevu hatırlatması gibi)' },
  { ad: 'Meta Platforms (WhatsApp Business Platform)', is: 'WhatsApp mesajlaşması', not: 'Yalnızca hekim kendi numarasını bağlarsa.' },
  { ad: 'Google / Microsoft', is: 'Hekimin kendi e-posta hesabından gönderim', not: 'Yalnızca hekim kendi hesabını bağlarsa; posta kutusu okunmaz.' },
]

export default function VeriIslemePage() {
  return (
    <YasalKabuk baslik="KVKK Veri İşleme Özeti" altBaslik="Hekim (veri sorumlusu) — Notya (veri işleyen) ilişkisinin özeti" aktifYol="/veri-isleme">
      <div style={YS.box}>
        Hastalarınıza ait veriler bakımından <strong>veri sorumlusu sizsiniz</strong>; Notya, bu verileri sizin
        adınıza ve talimatlarınız çerçevesinde işleyen <strong>veri işleyendir</strong> (KVKK m.3). Bu sayfa o
        ilişkinin çerçevesini özetler. İmzalı veri işleme sözleşmesi metni, avukat incelemesi tamamlandığında
        abonelere sunulacaktır.
      </div>

      <h2 style={YS.h2}>1. Taraflar ve roller</h2>
      <ul>
        <li style={YS.li}><strong>Veri sorumlusu:</strong> hekim / klinik (hesap sahibi).</li>
        <li style={YS.li}><strong>Veri işleyen:</strong> Notya&apos;yı işleten teşebbüs — {SIRKET_YER_TUTUCU}.</li>
        <li style={YS.li}>Hekimin kendi hesap verileri (ad, e-posta, abonelik) bakımından veri sorumlusu Notya&apos;dır; bu, <Link href="/kvkk" style={YS.baglanti}>KVKK Aydınlatma Metni</Link>&apos;nde açıklanır.</li>
      </ul>

      <h2 style={YS.h2}>2. İşlemenin konusu ve niteliği</h2>
      <p style={YS.p}>
        İşlenen veriler: hasta kimlik ve iletişim bilgileri, sağlık verileri (özel nitelikli), hekimin oluşturduğu
        kayıt, not, belge ve ses dökümleri. İşleme amaçları: kayıtların tutulması, taslakların üretilmesi,
        randevu/iletişim süreçleri ve mevzuat kaynaklı yükümlülüklerin desteklenmesi. Süre: abonelik süresince;
        sonrasında <Link href="/kvkk" style={YS.baglanti}>saklama tablosundaki</Link> süreler uygulanır.
      </p>

      <h2 style={YS.h2}>3. Veri işleyen olarak taahhütlerimiz</h2>
      <ul>
        <li style={YS.li}>Verileri yalnızca hizmetin gerektirdiği kapsamda ve hekimin talimatları çerçevesinde işleriz; başka amaçla kullanmayız, satmayız.</li>
        <li style={YS.li}>Hasta verilerini yapay zekâ modellerinin eğitiminde kullandırmayız; sağlayıcılarla bu yönde sözleşme yapılır.</li>
        <li style={YS.li}>Sır saklama: verilere erişimi olan herkes gizlilik yükümlülüğü altındadır.</li>
        <li style={YS.li}>Güvenlik: kimlik alanlarında AES-256-GCM şifreleme, aktarımda TLS, hekim bazlı erişim yalıtımı, erişim/işlem kayıtları, süresi dolan veride günlük otomatik imha.</li>
        <li style={YS.li}>Kimliksizleştirme: yapay zekâ sağlayıcılarına giden içerikten ad soyad, T.C. kimlik numarası, telefon ve e-posta otomatik çıkarılır; T.C. kimlik numarası tespit edilirse istek hiç gönderilmez.</li>
        <li style={YS.li}>Veri ihlalinde hekime ve mevzuat gereği Kişisel Verileri Koruma Kurulu&apos;na en geç 72 saat içinde bildirim yapılır.</li>
        <li style={YS.li}>İlgili kişi başvurularında (KVKK m.11) hekime makul yardım sağlanır.</li>
        <li style={YS.li}>Abonelik sonunda veriler, hekimin seçimine göre iade edilir (dışa aktarım) ve saklama süresi dolanlar silinir.</li>
      </ul>

      <h2 style={YS.h2}>4. Alt işleyiciler</h2>
      <p style={YS.p}>Hizmetin çalışması için aşağıdaki alt işleyiciler kullanılır (yurt dışı aktarım koşulları: <Link href="/kvkk" style={YS.baglanti}>KVKK Aydınlatma Metni, bölüm 5</Link>):</p>
      <ul>
        {ALT_ISLEYICILER.map((a) => (
          <li key={a.ad} style={YS.li}>
            <strong>{a.ad}:</strong> {a.is}.{a.not ? <> {a.not}</> : null}
          </li>
        ))}
      </ul>
      <p style={YS.p}>
        Alt işleyici listesinde değişiklik olursa bu sayfa güncellenir ve aboneler uygulama içinden bilgilendirilir;
        makul süre içinde itiraz hakkınız saklıdır.
      </p>

      <h2 style={YS.h2}>5. Hekimin (veri sorumlusunun) yükümlülükleri</h2>
      <ul>
        <li style={YS.li}>Hastanın aydınlatılması ve gereken hâllerde açık rızanın alınması hekimin yükümlülüğüdür (KVKK m.10, m.6).</li>
        <li style={YS.li}>Sisteme girilen verinin hukuka uygun toplandığından hekim sorumludur.</li>
        <li style={YS.li}>Personel erişim yetkilerini görevle sınırlı tanımlamak hekimin/kliniğin sorumluluğudur.</li>
      </ul>

      <h2 style={YS.h2}>6. Başvuru</h2>
      <p style={YS.p}>
        Veri işleme çerçevesiyle ilgili sorular ve ilgili kişi başvuruları:{' '}
        <a href="mailto:kvkk@notya.ai" style={YS.baglanti}>kvkk@notya.ai</a>.
      </p>
    </YasalKabuk>
  )
}
