# WhatsApp Business — hazır yanıtlar (gift-first, 4 adım)

Kısa mesajlar · tek hedef · fiyat / süre iddiası / baskı yok.
Amaç: doktor Notya’ya merak edip **30 dk ücretsiz demo** veya **ücretsiz deneme** açsın.

## Demo saatleri (sen doldur)

```
Secenek1: Perşembe 20:00
Secenek2: Cuma 13:00
```

`{Secenek1}` / `{Secenek2}` = Türkiye saati demo slotları. Göndermeden önce bu iki satırı güncelle.
`/onay` içinde `{secilen_saat}` = doktorun seçtiği slot.

---

## STEP 1 — kart PDF + merak sorusu

Doktor “evet / gönder / PDF” dediğinde. Durum → `kart_gonderildi`.

### /evet-ped

```
Buyurun Hocam 🙏 Pediatri Pratik Kartı:
https://notya-growth.vercel.app/pratik-kart/pediatri-pratik-karti-2026.pdf
Merak ettiğim bir şey var: aşısı geciken bir çocukta telafi tarihlerini şu an nasıl hesaplıyorsunuz?
```

### /evet-kd

```
Buyurun Hocam 🙏 Gebelik Takip Kartı:
https://notya-growth.vercel.app/pratik-kart/kd-gebelik-takip-karti-2026.pdf
Merak ettiğim bir şey var: gebelerinizin izlem ve tarama haftalarını şu an nasıl takip ediyorsunuz?
```

### /evet-derm

```
Buyurun Hocam 🙏 Sistemik Tedavi İzlem Kartı:
https://notya-growth.vercel.app/pratik-kart/dermatoloji-sistemik-tedavi-izlem-karti-2026.pdf
Merak ettiğim bir şey var: izotretinoin ve metotreksat hastalarınızın tahlil ve kontrol zamanlarını şu an nasıl takip ediyorsunuz?
```

---

## STEP 2 — Notya köprüsü + demo seçimi

Doktor STEP 1 sorusuna cevap verdiğinde **veya** STEP 1’den 2 gün geçip cevap yoksa.
Durum → `demo_teklif`.

### /demo-ped

```
Hocam teşekkürler. Tam da bunun için Notya'yı yaptık: aşısı geciken çocukta telafi tarihlerini muayene sırasında kendisi hesaplıyor, aileye hatırlatmayı da gönderiyor. Dr. Gökhan Mamur ile 30 dakikalık ücretsiz demoda kendi muayene akışınızda birlikte görelim: {Secenek1} mi, {Secenek2} mi uyar?
```

### /demo-kd

```
Hocam teşekkürler. Tam da bunun için Notya'yı yaptık: her gebeniz için gebelik haftasını, sıradaki izlem ve taramayı kendisi takip ediyor, hatırlatmayı da gönderiyor. Dr. Gökhan Mamur ile 30 dakikalık ücretsiz demoda kendi muayene akışınızda birlikte görelim: {Secenek1} mi, {Secenek2} mi uyar?
```

### /demo-derm

```
Hocam teşekkürler. Tam da bunun için Notya'yı yaptık: sistemik tedavideki hastalarınızın tahlil ve kontrol zamanlarını kendisi takip ediyor, hatırlatmayı da gönderiyor. Dr. Gökhan Mamur ile 30 dakikalık ücretsiz demoda kendi muayene akışınızda birlikte görelim: {Secenek1} mi, {Secenek2} mi uyar?
```

---

## STEP 2b — saat / deneme / onay

### /saat (başka saat istedi · durum `demo_teklif` kalır)

```
Tabii Hocam, size uygun saati buradan seçebilirsiniz, Dr. Gökhan Mamur takvimine işlesin: https://www.notya.io/demo
```

### /deneme (demo yok / yalnız denemek istiyor · durum → `deneme`)

```
Anlıyorum Hocam. O zaman ücretsiz denemeyi hemen açabilirsiniz, birkaç dakikada başlarsınız: https://www.notya.io
Takıldığınız bir yer olursa buradan yazın, Dr. Gökhan Mamur 30 dakikalık ücretsiz demoyu da istediğiniz zaman ayarlar.
```

### /onay (slot seçti · durum → `demo`)

```
Harika Hocam, {secilen_saat} için not aldım. Dr. Gökhan Mamur toplantı linkini buradan gönderecek. Görüşmek üzere 🙏
```

---

## STEP 3 — tek takip

STEP 1 veya STEP 2’den **5 gün** cevap yoksa, **bir kez**. Sonra durum → `ilgilenmiyor` (bir daha yazma).

### /takip

```
Hocam kart işinize yaradı mı? Eksik ya da eklenmesini istediğiniz bir şey olursa yazmanız bizim için çok değerli; kartı hekimlerden gelen geri bildirimlerle güncelliyoruz.
```

---

## Red — doktor istemedi

Doktor “hayır / teşekkürler ihtiyacımız yok” dediğinde. Durum → `reddetti` (cevapsız `ilgilenmiyor` değil).
`red_tarihi` = bugün · `yanit` = doktorun cümlesi. Bizden takip **yok**; gelecek batch ve eski-120 re-send listelerinden telefon **ve** isimle çıkar.

**İstisna:** doktor `/tesekkur` sonrası **kendi** yazarsa → durum `teklif_edildi`, `notlar` += `red_sonrasi_yanit`, `siradaki_adim` = `Yanıtla — kendisi yazdı` (elle cevapla; otomatik STEP/takip yok).

```bash
python3 scripts/tr-wa-gift-first.py --mark-red-reply --phone +905… --yanit "doktorun yeni mesajı"
```

### /tesekkur

```
Anladım Hocam, yanıtınız için çok teşekkür ederim 🙏 Kart dışında, muayene notunu siz konuşurken yazan ve hasta takibini üstlenen Notya'yı da geliştiriyoruz; bir gün merak ederseniz www.notya.io adresinde. Bir daha rahatsız etmeyeceğim, iyi çalışmalar dilerim.
```

---

## Durum makinesi

| durum | anlam | tipik sıradaki adım |
|-------|--------|---------------------|
| `hazir` | mesaj_1 henüz gitmedi | mesaj_1 gönder |
| `teklif_edildi` | kart teklifi gitti | bekle (evet) |
| `kart_gonderildi` | STEP 1 (/evet-*) gitti | bekle cevap · 2g → `/demo-*` |
| `demo_teklif` | STEP 2 (/demo-*) gitti | `/saat` `/deneme` `/onay` · 5g → `/takip` |
| `demo` | slot onaylandı | bekle (Gökhan link) |
| `deneme` | ücretsiz deneme linki gitti | bekle |
| `ilgilenmiyor` | 5g sessiz / takip sonrası | **yazma** |
| `reddetti` | açık ret (/tesekkur) | **YOK — takip etme** |
| `teklif_edildi` + `red_sonrasi_yanit` | red sonrası doktor yazdı | **Yanıtla — kendisi yazdı** |

Eski `/evet` ve `/demo` kısayolları kaldırıldı — branşlı `/evet-*` ve `/demo-*` kullan.
