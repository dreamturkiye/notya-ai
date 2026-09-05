# NOTYA™ — Hastane Entegrasyon Kılavuzu (Kurum BT Ekipleri İçin)

Sürüm: P2 · 2026-09-05 · Dream Türkiye — Notya AI · İletişim: kaanari@mac.com

## 1. Ne gönderiyoruz
Doktor tarafından **incelenmiş ve onaylanmış** her muayene notu için tek bir **HL7 FHIR R4
transaction Bundle**. Onaysız taslak hiçbir koşulda kurum dışına çıkmaz.

Bundle içeriği:
| Kaynak | İçerik |
|---|---|
| `Composition` | Türk EMR blok yapısında not: **Anamnez ve Fizik Muayene** · **Tanılar** · **İlaç / Tedavi Planı** |
| `Condition` (n) | ICD-10 kodlu tanılar (`http://hl7.org/fhir/sid/icd-10`; birincil tanı `confirmed`) |
| `Observation` (n) | Vital bulgular, LOINC kodlu (ateş 8310-5, nabız 8867-4, SpO2 2708-6, kilo 29463-7, boy 8302-2, solunum 9279-1), UCUM birimli |
| `MedicationRequest` (n) | İlaç önerileri — **`intent=proposal`**: hukuken öneri, asla order değil; nihai karar hekimindir |
| `DocumentReference` | Notun kendi kendine yeten okunabilir belgesi (text/html, base64) — resmî çıktı ihtiyacı için |
| `Patient` / `Practitioner` / `Encounter` | Kimlik ve başvuru bağlamı |

## 2. Hasta kimliği ve KVKK duruşu
- Hasta verisi Notya'da **alan düzeyinde şifreli** tutulur; T.C. kimlik numarası yalnız geri
  döndürülemez hash olarak saklanır ve **tasarım gereği dışarı verilemez.**
- `Patient.identifier`: kalıcı Notya UUID (`https://notya.ai/fhir/sid/hasta-id`) + isteğe bağlı
  **kurum MRN'i** (onboarding'de kurumun kendi system URI'siyle — `mrn_sistem_uri` parametresi).
- Aktarım yalnız (a) kurum kaydı **aktif** ve (b) hekim kuruma **bağlı** ise gerçekleşir; her
  gönderim denetim kaydına işlenir.

## 3. Teslimat ve güvenlik
### 3a. HL7 FHIR R4 (modern hat)
- Uç nokta: kurumun FHIR base URL'ine `POST` (Content-Type: `application/fhir+json`), gövde
  transaction Bundle.
- Kimlik doğrulama: **OAuth 2.0 client-credentials** (SMART Backend Services deseni) —
  token URL + client id/secret onboarding parametreleridir. TLS zorunlu.
- Idempotency: not UUID'i anahtardır; yeniden gönderim çoğaltma yaratmaz.
- Sıklık: saat başı otomatik; istek üzerine anlık tetikleme mümkündür.

## 4. HL7 v2 hattı (yaygın HBYS kurulumları için) — EN YÜKSEK KAPSAMA
Türkiye'deki HBYS'lerin büyük çoğunluğu (Sisoft, Fonet, Probel, Enlil sınıfı; devlet/şehir/
üniversite hastaneleri ve büyük özel zincirler) kurum içi akışta **HL7 v2** konuşur. Notya her
iki lehçeyi de üretir — kurum kaydında hedef seçilir:
- **MDM^T02** (varsayılan): klinik doküman bildirimi — TXA (doküman üstverisi, AU=hekim
  onaylı) + bölüm başına OBX/TX (Başvuru Yakınması, Anamnez, Fizik Muayene, Tanı, Tedavi).
- **ORU^R01** (alternatif): OBR (11488-4 Consult note, LOINC) + metin OBX'ler + **kodlu vital
  OBX'ler** (NM tipi, LOINC + UCUM — ateş 8310-5, nabız 8867-4, SpO2 2708-6, kilo 29463-7...).
- Karakter seti: MSH-18 = UNICODE UTF-8 (Türkçe tam destek); v2 kaçışları standart (\F\ \S\ \T\ \R\ \.br\).
- **Taşıma:** HL7-over-HTTPS POST (Mirth/Rhapsody sınıfı entegrasyon motorlarınızın HTTP
  dinleyicisine; Content-Type: x-application/hl7-v2+er7). Ham **MLLP** zorunluysa onboarding'de
  ince bir relay ile sağlanır — parametre alışverişinde belirtin.
- ADT/SIU gibi HASTANEDEN NOTYA'ya akışlar (hasta kabul/randevu beslemesi) ileri faz — talep
  halinde planlanır.

## 5. e-Nabız / Sağlık.Net hizası
Bundle **FHIR R4**'tür — e-Nabız'ın kendi standardı. Kurum HBYS'i, aldığı veriyi mevcut
USS/e-Nabız bildirim hattına **dönüşümsüz** aktarabilir; Notya kurumun Bakanlık yükümlülüğüne
ek yük getirmez.

## 6. Onboarding'de sizden istediklerimiz (30 dakikalık parametre alışverişi)
1. Hat seçimi: FHIR R4 mı, HL7 v2 mi (v2 ise MDM mi ORU mu + alıcı uygulama/kurum kodları)
2. Uç nokta (FHIR base URL ya da HL7 HTTP dinleyici; MLLP ise host:port)
3. Kimlik doğrulama (OAuth token URL + client credentials, ya da v2 hattı için ağ/VPN kuralı)
4. MRN identifier tercihiz ve hasta eşleme kuralınız
5. Kabul testi için test-hasta senaryonuz

Tarafımız hazırdır: bundle yapımız halka açık HAPI R4 sunucusunda doğrulanmıştır
(transaction-response, tüm kaynaklar `201 Created`).

---

## EK — Kurum BT'ye ilk temas e-postası taslağı (Kaan gönderir)

> Konu: Notya AI — HBYS'nize FHIR R4 ile onaylı muayene notu aktarımı
>
> Merhaba,
>
> Notya, hekimlerin muayene notlarını yapay zekâ ile Türk anamnez geleneğinde üreten ve hekim
> onayından geçiren bir klinik dokümantasyon sistemidir. Onaylı notları kurumunuzun sistemine
> **HL7 FHIR R4 transaction Bundle** olarak (Composition + ICD-10 Condition + LOINC Observation +
> DocumentReference) OAuth 2.0 client-credentials ile iletiyoruz; çıktımız e-Nabız'ın kullandığı
> R4 standardındadır ve halka açık FHIR sunucusunda doğrulanmıştır.
>
> Entegrasyon tarafımızda hazırdır; sizden yalnız 4 parametre gerekiyor (test FHIR uç noktası,
> OAuth bilgileri, MRN system URI, test senaryosu). 30 dakikalık bir teknik görüşme ile test
> ortamınıza ilk aktarımı yapabiliriz. Teknik kılavuzumuz ektedir.
>
> Saygılarımla, Kaan Arıoğlu — Dream Türkiye / Notya AI
