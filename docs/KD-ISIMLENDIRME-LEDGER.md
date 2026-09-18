# KD-ISIMLENDIRME-01 — ledger

**Talimat (Kaan, 2026-09-18):** `kadin-hastaliklari-dogum` ile `kadin-dogum` aynı branş. Bundan sonra bu
branşın tek adı **"Kadın Hastalıkları ve Doğum"** (jinekoloji de bu branşa bağlı; Türkiye'de ve hastanelerde böyle
geçiyor). "Kadın Doğum" ilk günlerin adıydı.

**Sınır:** bu iş ad düzeltmesidir, veri göçü DEĞİLDİR. `kadin-dogum` üretimde canlı bir `users.specialty` değeri;
kabul eden çözücü kaldırılırsa KD hekiminin hesabı branşsız kalır. Veri tekilleştirme kararı Kaan'da
(`docs/OPEN-COMMITMENTS.md` → OPEN KD-ISIMLENDIRME-02).

Tek ad kaynağı: `lib/doktor/specialties.ts` → `SPECIALTY_MAP['kadin-hastaliklari-dogum'].label`
(`KADIN_HASTALIKLARI_DOGUM_ETIKETI`). Dar alan kısaltması: `KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI` = "Kadın Hast. ve Doğum".
Tek çözücü: `bransAnahtari()` (`lib/specialties/bransAnahtari.ts`, `lib/specialties/kapsam.ts` üzerinden de dışa açık).

---

## Faz 1 — envanter (origin/main `671e79f`, 2026-09-18)

Tarama: `git grep -i -E "kad[ıi]n[ -]?do[ğg]um|kadin-dogum|KadinDogum"` → 323 geçiş / ~140 dosya
(çoğu import yolu, tür adı ve test). Paralel sprintlerden (pediatri, KD araçları) iş başında `origin/main` üzerinde yeni
commit yoktu; merge öncesi tekrar çekilip yeni dosyalar yeniden tarandı (aşağıda "Merge öncesi yeniden tarama").

### (A) Hekim- / hasta-gören metin → "Kadın Hastalıkları ve Doğum" (DÜZELTİLDİ, Faz 2)

| Yer | Eski metin | Kim görür |
|-----|-----------|-----------|
| `app/doktor-tools/kd-kohort/page.tsx` başlık | "Kadın Doğum Kohort Paneli" | hekim |
| `specialties/kadin-dogum/ui/araclar/KdAracKabugu.tsx` üst etiket | "Araçlar · Kadın Doğum" (5 KD aracının hepsinde) → kısa ad (büyük harfli dar etiket) | hekim |
| `specialties/kadin-dogum/ui/araclar/KdKohortPaneli.tsx` | "Kadın doğum kohortu" | hekim |
| `lib/doktor/doktorAraclari.ts` Araçlar kutucuğu | "Kadın doğum kohort paneli" → "Kadın Hast. ve Doğum kohort paneli" (dar kutucuk) | hekim |
| `app/dashboard/doktor/onam/yazdir/page.tsx` basılı onam altbilgisi | "kadın-doğum onam kütüphanesi" | **hasta** (basılı onam) |
| `components/doktor/HastaBebekKarti.tsx` (2) | "kadın-doğumda", "Kadın-doğum doğum + ilk örnek…" | hekim |
| `components/doktor/HastaGebelik.tsx:603` | "Kadın-doğum ilk örnek ve taburcu paketini…" | hekim |
| `components/doktor/YeniBebekIsleri.tsx` | "Kadın-doğum taburcu paketinden" | hekim (pediatri) |
| `specialties/kadin-dogum/ui/TaburcuPaketi.tsx` | "Kadın-doğum: doğum + ilk örnek + lohusa" | hekim |
| `lib/clinical/yenidogan/constants.ts` `YENI_BEBEK_BILDIRIM` | "kadın-doğum taburcu paketi ile…" | hekim (bildirim) |
| `specialties/dermatoloji/ui/UnitePanelleri.tsx` | "Kadın doğum / pediatri ağaçları değiştirilmez" | hekim (derm) |
| `specialties/kadin-dogum/prompts/index.ts` kilit başlıkları | "KADIN DOĞUM SİSTEM / ÖĞRENME KİLİDİ", "KADIN DOĞUM KİLİDİ (kısa)", "## Kadın doğum adımları" | model (prompt içindeki ad) |
| `specialties/kadin-dogum/prompts/soap-{gebe,usg,dogum,jinekoloji}.md` | "TR kadın doğum hekimi…" | model (prompt) |
| `lib/ai/professionTemplates.ts` | "Kadın Doğum Uzmanı" | (şu an içe aktaran yok — yine de düzeltildi) |
| `lib/ai/textbookTemplates.ts` | "Kadın doğum pratiği için…" | (şu an içe aktaran yok — yine de düzeltildi) |

Ham anahtarın doğrudan ekrana basıldığı yerler (aynı sınıf: branş adı yerine `kadin-dogum` /
`kadin-hastaliklari-dogum` / "Kadin dogum" görünüyordu — tek ad kuralının ihlali):

| Yer | Sorun |
|-----|-------|
| `app/api/portal/hasta/[token]/route.ts` `bransEtiketi` | `sessions.specialty = 'kadin-dogum'` olsaydı hastaya **"Kadin dogum"** gösterirdi (yalnız SPECIALTY_MAP anahtarına bakıyordu) |
| `lib/doktor/bransAdlari.ts` `klinikAdi` / `resmiUzmanlikAdi` | `'kadin-dogum'` → "Kadin Dogum" (ilkHarfBuyuk yedeği) |
| `app/dashboard/doktor/page.tsx` son notlar hapı | ham anahtar + `capitalize` → "Kadin-hastaliklari-dogum" |
| `app/dashboard/doktor/inceleme/page.tsx` not satırı | ham anahtar |
| `app/dashboard/doktor/notlar/[id]/page.tsx` başlık | ham anahtar |
| `app/dashboard/doktor/notlar/[id]/yazdir/page.tsx` basılı not | ham anahtar + `capitalize` (basılı belge) |

Zaten doğru olup tek kaynağa bağlanan (metin aynı, artık `KADIN_HASTALIKLARI_DOGUM_ETIKETI`'nden okunuyor):
`lib/intake/bransSorulari.ts` BRANS_ETIKETLERI, `lib/doktor/bransAdlari.ts` RESMI_UZMANLIK_ADI,
`core/belgeler/router.ts` `kadin_dogum.ad`, `lib/specialties/kadin-dogum.ts` etiket/resmiUnvan,
`lib/asistan/specialistsCatalog.ts` unvan, `app/dashboard/doktor/hastalar/[id]/gebelik/yazdir/page.tsx` imza satırı.
`specialties/kadin-dogum/manifest.ts` displayName bölümün kendi kaydı olarak düz metin kaldı; eşitliği testle kilitli.

Dokunulmayan (A)-benzeri: `app/onboarding/page.tsx` ve `components/doktor-landing/content.ts` zaten
"Kadın Hastalıkları ve Doğum" yazıyor; düz dizi/eşleme tabloları, ayrı bir etiket kaynağına bağlamak bu işin dışında.

### (B) Kanonik anahtar / veri değeri → DEĞİŞTİRİLMEDİ

| Yer | Değer | Neden dokunulmadı |
|-----|-------|-------------------|
| `users.specialty` (üretim) | `'kadin-dogum'` | canlı hekim verisi (sayılar aşağıda) |
| `auth.users.raw_user_meta_data.specialty` | `'kadin-dogum'` | aynı hesaplar |
| `lib/asistan/specialistsCatalog.ts` LABEL_ALIASES `'kadin-dogum'` | eşdeğerlik tablosu | kanonik çözücünün verisi; kaldırılırsa hesap branşsız kalır |
| `lib/specialties/registry.ts:28` | `raw === 'kadin-dogum' \|\| …` | Faz 3'te kanonik çözücüye devredildi (davranış aynı) |
| `specialties/kadin-dogum/schema.ts:160`, `specialties/dermatoloji/schema.ts:330` | `z.literal('kadin-dogum')` | Zod yükü (bellek içi; üretimde `specialty_records` tablosu YOK — doğrulandı) |
| `lib/specialties/kadin-dogum-live.ts:170` | `specialty: 'kadin-dogum' as const` | Zod literal'ine uyar |
| `specialties/kadin-dogum/fixtures/*.json` (3) | `"specialty": "kadin-dogum"` | Zod literal'ine uyar |
| `specialties/kadin-dogum/manifest.ts:9` | `id: 'kadin-dogum'` | manifest kimliği |
| `specialties/kadin-dogum/` klasörü + tüm import yolları | yol | göç işi (KD-ISIMLENDIRME-02) |
| `next.config.mjs` outputFileTracingIncludes, `package.json` test globları, `prompts/index.ts` `path.join(…'kadin-dogum'…)` | yol | klasör adına bağlı |
| `bridges/derm-kadin-dogum.ts` `source: 'derm-kadin-dogum'`, derm manifest bridges | köprü kimliği | derm↔KD handoff anahtarı |
| `data-specialty="kadin-dogum"`, `data-chapter="kadin-dogum(-spine)"` | DOM işaretleri | test/QA seçicisi, görünmez |
| `app/session/new/page.tsx` ESKI_ANAHTAR | `'kadin-dogum' → 'kadin-hastaliklari-dogum'` | Faz 3'te kanonik çözücüye devredildi (davranış aynı) |
| `scripts/kd-prompts-smoke.mts` QA hesabı | `specialty: 'kadin-dogum'` | bilinçli: gerçek profillerin taşıdığı değerle test eder |
| Tür/değişken adları (`KadinDogumPayload`, `kadinDogumMi`, `KADIN_DOGUM_PROFILE`, …) | kod kimliği | görünmez; yeniden adlandırma göç işiyle birlikte |

### (C) Yorum / test / doküman → yalnız kafa karıştıranlar netleştirildi

- Kod yorumları ("kadın doğum only", "Kadın doğum-only (BRANS_DOKTOR_ARACLARI)") — bırakıldı; davranış anlatıyorlar.
  `lib/auth/superuserBranslar.ts` başlık yorumu branşın adıyla geçtiği için düzeltildi.
- `lib/db/migrations/*.sql` yorumları — uygulanmış göçlere dokunulmaz.
- `public/kd-jine-presprint-audit.html`, `public/kd-jine-post-sprint-audit.html`, `docs/beta/*v7.html` —
  tarihli anlık görüntüler (2026-09-16/17), tarih yeniden yazılmaz. Bir sonraki KD audit'i yeni adla çıkar.
- `.cursor/rules/brans-alan-sizmasi.mdc`, `.cursor/skills/brans-alan-sizmasi/SKILL.md` — "Kadın Doğum" branş adı olarak
  geçtiği yerler düzeltildi; kanonik anahtar eşdeğerliği skill'e bir satır olarak eklendi.
- Testler: `specialties/{dermatoloji,goz-hastaliklari}/tests/promptsLock.test.ts` "KADIN DOĞUM" yokluğunu arıyordu — başlık
  değişince boş geçerdi; yeni başlığa ("KADIN HASTALIKLARI VE DOĞUM") çevrildi. `scripts/{kd,goz,derm}-prompts-smoke.mts` aynı.

---

## Faz 3 — çözücü birliği

Önce (KD eşdeğerliği 7 ayrı yerde, iki farklı mantıkla):

| Yer | Mantık | `'Kadın Doğum Uzmanı'` | `'Jinekoloji ve Obstetrik'` |
|-----|--------|:---:|:---:|
| `lib/specialties/kapsam.ts` `bransAnahtari` | LABEL_ALIASES (tam eşleşme) | ✗ null | ✗ null |
| `lib/portal/moduller.ts` `portalBransAnahtari` | regex `/kadın\|kadin\|jinek\|obstet/` | ✓ | ✓ |
| `lib/doktor/doktorAraclari.ts` `doktorAracBransi` | → portalBransAnahtari | ✓ | ✓ |
| `specialties/kadin-dogum/prompts/index.ts` `kadinDogumMi` | kendi regex'i | ✓ | ✓ |
| `lib/specialties/registry.ts` `specialtyProfile` | `=== 'kadin-dogum'` | ✗ baseline | ✗ baseline |
| `app/session/new/page.tsx` | ESKI_ANAHTAR tablosu | ✗ seçici | ✗ seçici |
| `components/doktor/HastaIntake.tsx` | kapsam.bransAnahtari | ✗ | ✗ |
| `lib/asistan/personaEngine.ts` `varsayilanPersonaId` | findSpecialistForSpecialty | ✗ Ayşe | ✗ Ayşe |

Sonra: **tek çözücü `bransAnahtari()`** — önce `findSpecialistForSpecialty` (LABEL_ALIASES), eşleşme yoksa eski
serbest metin anahtar kelimeleri (portalBransAnahtari'nin regex'i buraya taşındı, aynı sıra). Diğerleri ona delege:
`portalBransAnahtari` (bilinmeyende ham değeri geri verme davranışı korundu), `doktorAracBransi` (değişmedi, portal
üzerinden), `kadinDogumMi`, `specialtyProfile`, `varsayilanPersonaId`, `session/new`, `HastaIntake`, `bransAdlari`,
portal `bransEtiketi` (artık `lib/doktor/bransAdlari.ts`'te, not/İnceleme/yazdır/panel de kullanıyor).
Yeni çözücü yazılmadı; `kapsam.ts` içindeki fonksiyon kendi modülüne taşındı (registry ↔ kapsam döngüsel import olmasın
diye) ve `kapsam.ts` onu aynı adla yeniden dışa açıyor.

`core/belgeler/router.ts` `bransAnahtari` ayrı bir anahtar uzayına (`kadin_dogum`, `goz`, `ftr` …) çözer; 30 branşlık
yeniden yazım bu işin dışında. KD girdilerinin hepsinin `kadin_dogum`'a gittiği eşdeğerlik testine eklendi.

Kilit testi: `lib/specialties/kd-isim-esdegerligi.test.ts` (varsayılan `npm test` paketinde).

Yan etki (bilinçli, tüm branşlara): kapsam `bransAnahtari` artık portalın zaten tanıdığı eski serbest metinleri de
çözüyor ("Göz Hastalıkları Uzmanı" → göz, "Çocuk Sağlığı ve Hastalıkları" → pediatri). Önce portal/araçlar bu hekimi
göz/pediatri sayıyor, SOAP kapsamı branşsız sayıyordu; artık ikisi aynı. Üretimde serbest metinli `users.specialty`
değeri yok (aşağıda) — pratik etkisi yok, ayrışmayı kapatıyor.

---

## Faz 3.3 — üretim sayıları (SALT-OKUNUR, 2026-09-18)

Yöntem: `.env.local` DATABASE_URL, `pg`, `BEGIN TRANSACTION READ ONLY` … `ROLLBACK`. Yalnız `specialty` değerleri ve
sayılar okundu; hiçbir satır güncellenmedi, hasta verisi okunmadı.

| Tablo.sütun | `'kadin-dogum'` | `'kadin-hastaliklari-dogum'` | Not |
|-------------|:---:|:---:|-----|
| `users.specialty` | **2** (1 gerçek hekim + 1 QA `qa.kd@notya.ai`) | **1** (gerçek hekim) | tüm değerler: pediatri 3, kadin-dogum 2, goz 1, KHD 1, dahiliye 1, dermatoloji 1, (hekim dışı serbest metin 1) |
| `auth.users.raw_user_meta_data->>'specialty'` | 2 | 1 | `users` ile aynı dağılım |
| `sessions.specialty` | **0** | **1** | toplam: pediatri 28, dahiliye 9, göz 4, genel 1, KHD 1 — `session/new` her seansı kanonik anahtarla açıyor |
| `hasta_intake_formlari.brans` | 0 | 1 | |
| `clinic_members.specialty` | 0 | 0 | |
| `belge_analizleri.brans` | 0 | 0 | |
| `specialty_records` | — | — | tablo üretimde yok; Zod `specialty: 'kadin-dogum'` yükü yalnız bellek içi |

Sonuç: eski değer yalnız **hesap profilinde** (`users.specialty` + auth metadata, 2 satır) yaşıyor; seans / intake
verisi zaten kanonik anahtarda.

---

## Merge öncesi yeniden tarama

`git fetch origin` (commit öncesi): `origin/main` hâlâ `671e79f` — paralel pediatri / KD araçları sprintlerinden yeni
commit yok, yeni dosyada "Kadın Doğum" yok. Kalıcı koruma: `kd-isim-esdegerligi.test.ts` son testi app/ components/ lib/
specialties/ core/ bridges/ altındaki her .ts/.tsx ve prompts .md dosyasını tarar — sonradan gelen bir dosyada sabit
"Kadın Doğum" metni paketi kırar.

## Doğrulama

- `npx tsc --noEmit` temiz.
- `npm test` 1174/1174 (yeni `kd-isim-esdegerligi.test.ts` dahil); paket dışı 6 test dosyası 36/36.
- Mutasyon kontrolü: `LABEL_ALIASES['kadin-dogum']` geçici olarak silindi → kilit testi açık gerekçe mesajıyla kırıldı; geri alındı.
- Mobil: değişen UI yalnız metin. Panel hapı ve araç üst etiketi kısa adı kullanıyor ("Kadın Hast. ve Doğum", eski ham
  anahtar "kadin-hastaliklari-dogum"dan kısa); diğer metinler sabit genişliksiz, satır kırar. Bu işte canlı 390px ekran
  görüntüsü alınmadı (değişiklik yalnız metin; sayfalar oturumlu hekim sayfaları).

## OPEN

- **KD-ISIMLENDIRME-02** — veri değerini `kadin-hastaliklari-dogum`'a tekilleştirme göçü: Kaan kararı bekliyor.
  Plan `docs/OPEN-COMMITMENTS.md`'de.
- **KD-ISIMLENDIRME-03** — `public/kd-jine-*-audit.html` ve `docs/beta/*v7.html` başlıkları eski adla ("Kadın Doğum &
  Jinekoloji"). Tarihli anlık görüntü oldukları için düzenlenmedi; public sayfa oldukları için Kaan isterse başlığa
  "(eski ad)" notu veya yeni adla yeniden yayın yapılabilir.
