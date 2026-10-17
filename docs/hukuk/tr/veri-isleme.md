# KVKK Veri İşleme Özeti (Processor / DPA Summary) — Türkiye

- **Jurisdiction / language:** Türkiye — Turkish
- **Published at:** `/veri-isleme`
- **Source file:** `app/(yasal)/veri-isleme/page.tsx`
- **Legal bases leaned on:** KVKK madde 3 (veri sorumlusu / veri işleyen tanımları), madde 9 (yurt dışı aktarım), madde 12 (veri güvenliği)
- **Status:** Drafted by Claude 2026-10-17. This is a transparency summary, not a signed DPA — the gap is stated explicitly in the text itself. Not reviewed by a lawyer.
- **Open for counsel:**
  1. Draft the actual signed/clickwrap DPA this page promises ("İmzalı veri işleme sözleşmesi metni, avukat incelemesi tamamlandığında abonelere sunulacaktır").
  2. Confirm the sub-processor list is complete and matches the live provider set in `lib/ai/cagir.ts`, `lib/transcription/`, `lib/asistan/` (ElevenLabs), `lib/iletisim/sms/` (NetGSM) at the time of sign-off — it was built by reading those files on 2026-10-17 and will drift as providers change.
  3. Entity placeholder (section 1).
  4. Confirm "veri işleyen taahhütlerimiz" (section 3) matches whatever the signed DPA ultimately commits to — this page must not promise more than the DPA delivers.

---

## Full text as published in-app

Hastalarınıza ait veriler bakımından **veri sorumlusu sizsiniz**; Notya, bu verileri sizin
adınıza ve talimatlarınız çerçevesinde işleyen **veri işleyendir** (KVKK m.3). Bu sayfa o
ilişkinin çerçevesini özetler. İmzalı veri işleme sözleşmesi metni, avukat incelemesi tamamlandığında
abonelere sunulacaktır.

### 1. Taraflar ve roller

- **Veri sorumlusu:** hekim / klinik (hesap sahibi).
- **Veri işleyen:** Notya'yı işleten teşebbüs — [ŞİRKET UNVANI VE ADRESİ — şirket kuruluşunda doldurulacak].
- Hekimin kendi hesap verileri (ad, e-posta, abonelik) bakımından veri sorumlusu Notya'dır; bu, KVKK Aydınlatma Metni'nde açıklanır.

### 2. İşlemenin konusu ve niteliği

İşlenen veriler: hasta kimlik ve iletişim bilgileri, sağlık verileri (özel nitelikli), hekimin oluşturduğu
kayıt, not, belge ve ses dökümleri. İşleme amaçları: kayıtların tutulması, taslakların üretilmesi,
randevu/iletişim süreçleri ve mevzuat kaynaklı yükümlülüklerin desteklenmesi. Süre: abonelik süresince;
sonrasında saklama tablosundaki süreler uygulanır.

### 3. Veri işleyen olarak taahhütlerimiz

- Verileri yalnızca hizmetin gerektirdiği kapsamda ve hekimin talimatları çerçevesinde işleriz; başka amaçla kullanmayız, satmayız.
- Hasta verilerini yapay zekâ modellerinin eğitiminde kullandırmayız; sağlayıcılarla bu yönde sözleşme yapılır.
- Sır saklama: verilere erişimi olan herkes gizlilik yükümlülüğü altındadır.
- Güvenlik: kimlik alanlarında AES-256-GCM şifreleme, aktarımda TLS, hekim bazlı erişim yalıtımı, erişim/işlem kayıtları, süresi dolan veride günlük otomatik imha.
- Kimliksizleştirme: yapay zekâ sağlayıcılarına giden içerikten ad soyad, T.C. kimlik numarası, telefon ve e-posta otomatik çıkarılır; T.C. kimlik numarası tespit edilirse istek hiç gönderilmez.
- Veri ihlalinde hekime ve mevzuat gereği Kişisel Verileri Koruma Kurulu'na en geç 72 saat içinde bildirim yapılır.
- İlgili kişi başvurularında (KVKK m.11) hekime makul yardım sağlanır.
- Abonelik sonunda veriler, hekimin seçimine göre iade edilir (dışa aktarım) ve saklama süresi dolanlar silinir.

### 4. Alt işleyiciler

Hizmetin çalışması için aşağıdaki alt işleyiciler kullanılır (yurt dışı aktarım koşulları: KVKK Aydınlatma Metni, bölüm 5):

- **Supabase:** Veri tabanı ve dosya barındırma.
- **Vercel:** Uygulama barındırma.
- **OpenRouter:** Yapay zekâ isteklerinin iletimi (kullanılan modeller: OpenAI ve Anthropic). Kimlik bilgileri istek yurt dışına çıkmadan önce otomatik çıkarılır.
- **Anthropic:** Yapay zekâ metin işleme (koruyucu model, doğrudan). Aynı kimliksizleştirme uygulanır.
- **Deepgram:** Ses kaydının yazıya dökümü.
- **ElevenLabs:** Sesli yanıt üretimi.
- **NetGSM:** SMS gönderimi (randevu hatırlatması gibi).
- **Meta Platforms (WhatsApp Business Platform):** WhatsApp mesajlaşması. Yalnızca hekim kendi numarasını bağlarsa.
- **Google / Microsoft:** Hekimin kendi e-posta hesabından gönderim. Yalnızca hekim kendi hesabını bağlarsa; posta kutusu okunmaz.

Alt işleyici listesinde değişiklik olursa bu sayfa güncellenir ve aboneler uygulama içinden bilgilendirilir;
makul süre içinde itiraz hakkınız saklıdır.

### 5. Hekimin (veri sorumlusunun) yükümlülükleri

- Hastanın aydınlatılması ve gereken hâllerde açık rızanın alınması hekimin yükümlülüğüdür (KVKK m.10, m.6).
- Sisteme girilen verinin hukuka uygun toplandığından hekim sorumludur.
- Personel erişim yetkilerini görevle sınırlı tanımlamak hekimin/kliniğin sorumluluğudur.

### 6. Başvuru

Veri işleme çerçevesiyle ilgili sorular ve ilgili kişi başvuruları: kvkk@notya.ai.

---
*Son güncelleme: 2026-10-17 · Bu metin hukuki incelemeden geçmektedir.*
