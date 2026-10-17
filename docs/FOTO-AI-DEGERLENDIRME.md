# Fotoğraf yapay zekâ değerlendirmesi — ölçüm prosedürü (FOTO-AI-01)

> **English lead.** `npm run foto-ai:harness` scores the clinical-photo AI ("Ayşe — fotoğraf incelemesi") against a clinician's reference reading: region agreement, red-flag recall / precision / specificity, abstain correctness and schema validity. The repository contains **only a synthetic, scripted fixture** (no real image, no patient data); it proves that the *instrument* works. **Clinical validation on real photographs has NOT been done.** Nothing in the product, the screenshots or this document may be described as validated until Dr. Gökhan's run below has been completed and its numbers have been accepted by a clinician. The tool is decision support, never a diagnosis.

Bu belge Dr. Gökhan'ın (veya başka bir hekimin) gerçek klinik fotoğraflarla yapacağı ölçümün adımlarını anlatır. Bu ölçüm **henüz yapılmamıştır**.

## 1. Ne ölçülür, ne ölçülmez

| Ölçülür | Ölçülmez |
|---|---|
| Ayşe'nin bölge tahmini hekimin bölgesiyle uyuşuyor mu | Tanı doğruluğu (ürün tanı koymaz; ayırıcı değerlendirme puanlanmaz) |
| Kırmızı bayrak **duyarlılığı** (gerçekten var olan bayrağı yakaladı mı), **kesinliği**, **özgüllüğü**; kaçırılan bayraklar tek tek | Gözlem metinlerinin dil kalitesi (hekim okuyarak değerlendirir) |
| **Abstain** doğruluğu: değerlendirilemeyecek fotoğrafta "değerlendiremem" dedi mi; **kaçırılan abstain** (dedi­ği hâlde cevap uydurdu) | Hekimin gerçek iş akışındaki zaman kazancı |
| Şema geçerliliği ve kaç olguda onarım adımı gerekti | Farklı cilt tonları, cihazlar, ışık koşulları için ayrı güvenilirlik (kümenizde yoksa sonucu yoktur) |
| Çekim kalitesi derecesinin (iyi/orta/yetersiz) hekimle uyumu | Gerçek kullanımda hekimin Kabul / Düzelt / Reddet oranı (bu ürün içinde ayrıca toplanır; "Önerilerin %N'ini kabul ettiniz") |

Rapor her çıktıda **"BU RAPOR KLİNİK DOĞRULAMA DEĞİLDİR"** uyarısını basar. Küçük kümelerde oranlar kararsızdır: örneğin 10 pozitif olguda 9 yakalamak "%90" yazar ama güven aralığı çok geniştir. Küme büyüklüğü ve içeriği sonuçtan ayrılamaz.

## 2. Olgu kümesini hazırlama (KVKK dahil)

1. **Görüntüler depoya girmez.** Bir klasör açın (ör. `~/foto-set`), içine JPEG veya PNG koyun (en çok 2,5 MB; HEIC/WebP desteklenmez, önce JPEG'e çevirin). Klasör bu deponun dışında kalır.
2. **Kişisel veri yok.** Dosya adı `olgu-001.jpg` gibi anonim olsun; hasta adı, protokol no, tarih dosya adında bulunmasın. Mümkünse yüz ve ayırt edici dövme/kimlik içeren fotoğrafları kullanmayın veya kırpın. Gerçek hasta fotoğrafının değerlendirme için kullanılması hastanın aydınlatılmış rızasına ve hekimin KVKK sorumluluğuna bağlıdır; bunu hekim kendi kurumunda doğrular (hukuki tavsiye değildir).
3. **Gerçek model çağrısı yapılır.** Canlı koşuda görüntüler, uygulamadaki aynı yol ve aynı politika ile (`lib/ai/cagir.ts`, `ai-model-politikasi`) modele gider: küçültülmüş, EXIF'i temizlenmiş, eğitimde kullanılmayacak şekilde. Üçüncü bir tarafa gönderim yoktur. Yine de gerçek hasta görüntüsü içerdiği için kümeyi küçük ve gerekçeli tutun.
4. **Referans okumayı model çıktısını görmeden yazın** (körleme). Aksi halde ölçüm, modelin söylediğini onaylamaya döner.
5. Kümede şunlar **bilerek** bulunsun: (a) her kırmızı bayrak kodundan en az birkaç gerçek pozitif, (b) bayrağın OLMADIĞI normal fotoğraflar (özgüllük için), (c) değerlendirilemeyecek kötü fotoğraflar (bulanık, karanlık, kadraj dışı) — doğru davranış *abstain*. Önerilen alt sınır: kırmızı bayrak başına en az 10 pozitif ve toplam 100+ olgu; bundan küçük kümeler "pilot" sayılır.
6. Pediatrik olgular `"mod": "pediatrik"` ve `"veliDili": true` ile işaretlenir; yetişkin olgular `"mod": "genel"`, `"veliDili": false`. Pediatrik kırmızı bayrak kodları (`sarilik-yasa-duyarli`, `hemanjiyom-riskli-konum`) yalnızca pediatrik modda geçerli bir beklentidir.

## 3. Fixture biçimi

Bir JSON dosyası; **görüntü içermez**, yalnızca olgular ve referans okuma:

```json
{
  "surum": 1,
  "ad": "pediatri-dermatoloji-ilk-set",
  "olgular": [
    {
      "id": "olgu-001",
      "mod": "pediatrik",
      "yas": "7 yaşında",
      "veliDili": true,
      "gorsel": "olgu-001.jpg",
      "not": "Serbest not (modele gitmez)",
      "beklenen": {
        "bolge": "bacak-sag",
        "degerlendirilebilir": true,
        "kirmiziBayrak": ["peteshi-purpura"],
        "kalite": "iyi"
      }
    }
  ]
}
```

* `bolge`: `lib/doktor/fotoArsiv/bolgeler.ts` içindeki kimliklerden biri; fotoğraftan bölge **belirlenemiyorsa** `null`.
* `degerlendirilebilir`: `false` ise doğru davranış abstain'dir.
* `kirmiziBayrak`: gerçekten **var** olan kodlar; `[]` = hiçbiri yok. Alan hiç yazılmazsa o olgu bayrak puanına girmez.
* `kalite`: `iyi` / `orta` / `yetersiz`.
* Örnek: `lib/doktor/muayeneEk/foto/harness/ornek.fixture.json` (7 sentetik, senaryolu olgu; model yanıtı `yanit` alanındadır, yalnızca `--sahte` modda kullanılır). Fixture doğrulayıcı hataları Türkçe ve satır satır yazar.

## 4. Çalıştırma

```bash
# 1) Aletin çalıştığını görmek için: paketli sentetik küme, ağ yok, görüntü yok
npm run foto-ai:harness

# 2) Kendi fixture'ınızın doğrulanması (görüntüsüz, senaryolu yanıtlarla)
npm run foto-ai:harness -- --fixture ~/benim.fixture.json --sahte

# 3) GERÇEK koşu: gerçek model + gerçek görüntüler (uygulamanın AI ortam değişkenleri gerekir)
npx tsx --env-file=.env.local scripts/foto-ai-harness.mts --fixture ~/benim.fixture.json --gorsel-dizini ~/foto-set

# Makine okunur çıktı (arşivlemek için)
npx tsx --env-file=.env.local scripts/foto-ai-harness.mts --fixture ~/benim.fixture.json --gorsel-dizini ~/foto-set --json > sonuc-2026-xx-xx.json
```

Çıkış kodları: `0` koştu (verilen kapılar geçti) · `1` bir kapı başarısız · `2` girdi hatalı. İsteğe bağlı kapılar: `--min-duyarlilik 0.95`, `--min-sema 0.95`, `--kacirilan-abstain 0`. **Eşikleri hekim koyar**; bu depo klinik bir eşik iddia etmez.

## 5. Raporu okuma

* **Kırmızı bayrak duyarlılığı** en önemli satırdır; **KAÇIRILAN KIRMIZI BAYRAKLAR** listesi olgu olgu yazılır — her kaçırılan bayrak tek tek incelenmelidir (görüntü mü yetersizdi, istem mi eksikti, kalibrasyon kuralı mı bayrağı söndürdü).
* **Yanlış alarmlar** kesinliği düşürür; klinik olarak ucuz ama alarm yorgunluğu yaratır.
* **Abstain**: "KAÇIRILAN abstain" yüksekse model değerlendirilemeyecek fotoğrafta cevap uyduruyor demektir; bu, bayrak kaçırmak kadar ciddidir.
* **Şema geçerliliği**: geçersiz çıktı ürün içinde 502 olarak görünür ve kullanıcıya hata gösterir; onarım gereken olgu sayısı ham modelin ne kadar sık biçim bozduğunu gösterir.
* Kod bazında TP/FP/FN/TN tablosu, hangi bayrakta zayıf kalındığını gösterir.

## 6. Sonucu kaydetme

`--json` çıktısını, kullanılan **istem sürümü** (`foto-ai-v1`), tarih ve fixture adıyla birlikte saklayın (görüntüleri değil). İstem veya model değişince **aynı kümeyle yeniden koşun**; sürüm numarası değişmeden sonuçlar karşılaştırılamaz. Ürün içinde her değerlendirmeye model adı ve istem sürümü ayrıca kaydedilir (denetim kaydı).

## 7. Bilinen sınırlar (dürüstçe)

* Görüntü kalitesi eşikleri (`lib/doktor/fotoArsiv/goruntuKalitesi.ts`: netlik, karanlık, patlama) yalnızca sentetik karelerle seçilmiştir; **gerçek fotoğraflarda ayarlanmamıştır** (FOTO-AI-02).
* Serbest metin ayırıcı değerlendirmeleri için pediatrik terim süzgeci yoktur; yalnızca istem ve kırmızı bayrak kodları pediatrik modla kapılanır.
* Kalibrasyon kuralları (ölçek referansı yoksa boyut kaldırılır, güven tavanı, "Doktor incelemesi gerekir" ipucu) deterministiktir ve birim testlidir; klinik olarak uygun olup olmadığı hekim incelemesi bekler.
* Cilt tonu, cihaz ve ışık çeşitliliği için ayrı doğrulama yapılmamıştır.
