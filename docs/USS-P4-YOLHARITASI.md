# NOTYA™ — P4 Yol Haritası: Doğrudan USS / e-Nabız Gönderimi (Muayenehane Katmanı)

2026-09-05 · Araştırma temelli resmi süreç haritası. Hedef: hastane HBYS'i olmayan solo
hekimlerin onaylı notlarının Notya üzerinden DOĞRUDAN Bakanlık (USS/e-Nabız) hattına gitmesi.
Bu, Türk pazarında gerçek hendek: muayenehanelerden de USS gönderimi resmen bekleniyor ve
yalnız kayıtlı yazılım üreticileri gönderebiliyor.

## Resmi sürecin haritası (araştırma bulguları)
1. **Üretici kaydı:** Notya'nın SBYS/MBYS üreticisi olarak kaydı — Sağlık Hizmetleri GM
   "Muayenehane Bilgi Yönetim Sistemi" üretici listesi + SBSGM uyumluluğu. Yazılımın
   SBSGM'nin (sbsgm.saglik.gov.tr) yayımladığı veri tanımları, iş kuralları ve veri gönderim
   servislerine uyumu ZORUNLU.
2. **Teknik uyum:** SBSGM'nin güncel veri gönderim servisi spesifikasyonlarının indirilmesi ve
   adaptörün bu spesifikasyona göre yazılması (mevcut FHIR mapper temel; Bakanlık paket
   formatı ne istiyorsa ona hedeflenir). Test ortamı senaryolarının geçilmesi.
3. **Hekim tarafı kimlik:** Her muayenehane hekimi, İl/İlçe Sağlık Müdürlüğü'nden **USS
   kullanıcı şifresi** alır (USS Kullanma Şifresi Talep Formu + ÇKYS kodu + T.C.; OGN üzerinden
   2FA ile şifre oluşturma) ve bu şifre yazılım üreticisiyle (Notya) paylaşılır → Notya'da
   şifreli saklama alanı + ayarlar ekranı gerekir.
4. **e-Reçete / SGK bacağı (ayrı iş):** Kamu SM e-imza entegrasyonu — reçetenin SGK'ya
   e-imzalı gönderimi. P4'ün ikinci fazı.

## Sahiplik
| Adım | Sahip |
|---|---|
| Firma/üretici başvuru evrakları (MBYS listesi, SBSGM kaydı) | **Kaan** (şirket evrakı + başvuru) |
| SBSGM spesifikasyonlarını indirip adaptörü yazmak + test senaryoları | **Claude** |
| Hekim USS şifresi akışı: ayarlar alanı + şifreli saklama + gönderim kimliği | **Claude** |
| Hekimlerin İlçe SM şifre başvurusu (beta doktorlarına rehber) | Kaan + doktorlar (Claude rehber yazar) |
| Kamu SM e-imza (reçete/SGK) | Faz 2 — birlikte |

## Sıralama önerisi
Beta gelirle doğrulanana kadar P4 başvurusu BEKLER (başvuru süreci paralel yürüyebilir ama
mühendislik eforu şimdilik P1-P3'te durur). İlk 2-3 ödeyen doktor geldiğinde MBYS/SBSGM
başvurusu açılır — "USS'ye otomatik gönderim" o noktada satış argümanı olarak lansmana girer.
