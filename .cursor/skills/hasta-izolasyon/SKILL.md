---
name: hasta-izolasyon
description: >-
  Standing security rule for every Notya API route: a doctor can NEVER see, list,
  search, edit or otherwise reach another doctor's patients — and vice versa. Use
  before writing or reviewing ANY route (app/api/**) or server helper that accepts a
  patient id, note id, session id, randevu id, lesion/baby-card/thread id or any
  other patient-derived identifier from the URL, query string, body, form data or
  model (LLM) output — and before merging such a change. Answers "does this id
  provably belong to the authenticated doctor before I read or write with it?"
---

# Hasta izolasyonu (bir doktorun hastası asla başka doktora sızmaz)

Kaan (kurucu), kelimesi kelimesine niyet: **hastalar hiçbir koşulda doktorlar arasında
sızmamalı** — bir doktor başka bir doktorun hastasını göremez, listeleyemez, arayamaz,
düzenleyemez; tersi de. Bu varsayım değil, zorlanan bir kural.

## Mimari (bunu anlamadan kontrol yazma)

- Her sunucu rotası Supabase'e **service-role** istemcisiyle bağlanır (`servisSupabase()`,
  `doktorOturum()`, `pratikOturum()` — `lib/doktor/serverAuth.ts`, `lib/doktor/pratikOturum.ts`).
  Service-role **RLS'i atlar** — bilerek. Bu yüzden izolasyonun **birincil** denetimi
  uygulama kodudur: her sorgu doktora kapsanmalı.
- RLS (`lib/db/migrations/052_hasta_izolasyon_rls.sql`) yalnız **ikinci savunma hattıdır**:
  herkese açık anon anahtarıyla PostgREST'e doğrudan gelen istekleri daraltır. Service-role
  rotalarını etkilemez. "RLS var, kontrol gerekmez" **yanlıştır**.
- Kimliği kim taşır: `doktorOturum` → `user.id`; `pratikOturum` → **`doktorId`** (sekreter
  giriş yapmışsa `user.id` sekreterindir — kapsam her zaman `doktorId`).

## Kural (istisnasız)

**URL/query/body/form ya da model çıktısından gelen her hasta-türevi kimlik, onunla ilk
okuma veya yazmadan ÖNCE kimliği doğrulanmış doktora ait olduğu kanıtlanmalı.**

Doğru desenler (yenisini icat etme):

```ts
import { hastaSahibiMi, seansSahibi } from '@/lib/doktor/hastaSahipligi'

// 1) Hasta kimliği → önce sahiplik, sonra her şey. 404 (403 değil): yabancı id = yok.
if (!(await hastaSahibiMi(supabase, doktorId, patientId))) {
  return NextResponse.json({ error: 'Hasta bulunamadı.' }, { status: 404 })
}

// 2) Satır kimliği (not, ilaç, randevu, görev…) → id VE doktor kolonu aynı sorguda.
.from('hasta_ilaclar').update(g).eq('id', params.id).eq('doctor_id', doktorId)

// 3) Doktor kolonu olmayan çocuk satır (derm_lezyonlar, hasta_mesajlar…) → ebeveyni
//    doktora kapsanmış olarak çöz, çocuğu o ebeveyne bağla.
//    (bkz. dermatoloji/spine `lezyonBu`)

// 4) Seans kimliği → seansSahibi(): seans doktorun VE seansın hastası doktorun.
//    Seanslar tarayıcıdan anon anahtarla da eklenir; seans satırı hastanın meşru
//    olduğunu tek başına kanıtlamaz.
```

Sık yapılan hatalar (denetimde hepsi bulundu, hepsi düzeltildi):

| Hata | Örnek | Neden sızar |
|------|-------|-------------|
| INSERT'te `patient_id` gövdeden, sahiplik yok | `ilaclar` POST, `asilar` POST, `mchat`, `sessions/start` | Yabancı hastaya satır; `onay_durumu` varsayılanı `'onayli'` → **B'nin hastasının portalında A'nın ilacı** |
| Okuma sadece `id`/`patient_id` ile | `randevular` `hastaBilgisi`, `epikriz` `baslikKur`, `gebelik` başlığı | Yabancı hastanın **adı + telefonu** çözülüp döner |
| Upsert `onConflict: 'patient_id'`, sahiplik yok | `kadin-sagligi` POST | B'nin satırının üstüne yazar, `doctor_id`'yi A yapar (ele geçirme) |
| Çocuk satır çıplak id ile güncellenir | `derm_lezyonlar` (`lezyon_tani`) | A, B'nin lezyon tanısını değiştirir |
| "Önceki vizit" sorgusu `sessions.patient_id` ile, doktor yok | `sessions/[id]/end`, `ses-yukle` | B'nin planı/tanısı A'nın yapay zekâ bağlamına ve notuna girer |
| Otomatik oluşturma sahiplikten önce | `dermatoloji` GET/POST `hasta_derm`, `gebelik` `baslat` | Yabancı hastaya kayıt açılır, sonra başlık/ad okunur |
| Model çıktısındaki kimliğe güven | `lib/asistan/actionExecutor.ts` | LLM'in döndürdüğü `patientId`/`sessionId` da istek girdisidir |
| Portal okuması yalnız `patient_id` ile | `portal/hasta/[token]` | Başka doktorun iliştirdiği satır hastanın portalında görünür — portal **token'ın doktoruna** da kapsanmalı |

Kural genişlemesi: kimliği az önce kendi satırından türetmiş olsan bile (ör. kendi
randevundaki `patient_id`), o hastanın adını/telefonunu/dosyasını okurken **`doctor_id`
filtresi ekle**. Geçmişte açık kalmış bir yazma açığı kirli satır bırakmış olabilir;
okuma tarafı bunu asla yaymamalı (savunma derinliği).

## Birleştirme öncesi kontrol (her PR)

1. `git diff --name-only origin/main | grep '^app/api\|^lib/'` — dokunulan her rota/yardımcı.
2. Her biri için: hangi kimlikleri **dışarıdan** alıyor? Her biri için yukarıdaki desenlerden
   hangisi, hangi satırda uygulanıyor? Söyleyemiyorsan birleşme.
3. **Yeni rota** → `lib/security/hasta-izolasyon.test.ts` `VAKALAR` listesine bir vaka ekle
   (pozitif kontrol + A→B + B→A otomatik koşar) ve `lib/security/hastaIzolasyonEnvanteri.ts`'e
   `T` olarak yaz. Test edilemiyorsa `I('<kapsam mekanizması>')` — ama bu istisnadır.
4. **Yeni tablo** (hasta/doktor kolonu var) → aynı migration'da `enable row level security` +
   doktor politikası; `patient_id` varsa 052'deki restrictive politika yeniden koşturulmalı.
5. `npm test` yeşil. Hasta izolasyonu paketi `npm test`'in içinde; ayrıca `npm run test:izolasyon`.

## Zorlama mekanizması (neden "hatırlamaya" bırakmıyoruz)

- `lib/security/hasta-izolasyon.test.ts` — **gerçek route handler'ları**, iki sentetik doktor
  (A, B), her birinin sentetik hastası ve verisiyle. Her vaka: pozitif kontrol (kendi verisine
  ulaşır — harness'ın rotayı gerçekten çalıştırdığının kanıtı) + A→B + B→A. Çapraz koşuda
  kurbanın işareti yanıtta yok, kurbanın satırları değişmedi, kurbanın kimliğine yeni atıf yok,
  yapay zekâ bağlamına/model isteğine kurban girmedi. Düzeltmeler öncesi kod üzerinde 60+
  test kırmızıydı; bir sahiplik kontrolünü kaldırmak paketi kırar (doğrulandı).
- `lib/security/hasta-izolasyon-envanter.test.ts` — hasta ağaçlarındaki (`app/api/doktor`,
  `notes`, `sessions`, `portal`, `asistan`, `intake`, `entegrasyon`, `cron`) **her** dosya ve
  hasta kimliği kullanan **her** diğer API dosyası envanterde olmalı; `T` olanlar pakette
  gerçekten yüklenmeli; hasta/doktor kolonlu her tabloda RLS bir migration ile açılmalı.
  Sınıflanmamış yeni rota → `npm test` kırmızı.
- Sahte veritabanı (`lib/security/testing/sahteSupabase.ts`) bilmediği her sorgu yöntemi için
  **hata fırlatır** — tanımadığı bir filtreyi sessizce yutup sahte yeşil üretemez. Yeni bir
  PostgREST yöntemi kullanırsan orada uygula.

## Veri kuralı

Testlerde yalnız sentetik QA verisi (`QA Hasta A GIZLI-A-7Q` gibi). Gerçek hasta, gerçek hesap,
production veritabanı **asla**. Denetim geçmişi ve açık kalemler: `docs/OPEN-COMMITMENTS.md`
§ HASTA-IZOLASYON.
