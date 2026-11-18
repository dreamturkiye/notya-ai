# WhatsApp Business — hazır yanıtlar (gift-first)

Hızlı yanıt kısayolları. Kart PDF’lerini `/evet` sonrası branşa göre ekleyin.

## /evet

```
Buyurun Hocam. Bu kartta elle baktığınız hesapları Notya her hastanız için muayene sırasında kendisi takip ediyor, hatırlatmalar dahil. Merak ederseniz 15 dakikada gösterebiliriz.
```

### Eklenecek PDF (branşa göre)

| Branş | Kart | PDF |
|------|------|-----|
| pediatri | Pediatri Pratik Kartı | https://notya-growth.vercel.app/pratik-kart/pediatri-pratik-karti-2026.pdf |
| kadın doğum | Gebelik Takip Kartı | https://notya-growth.vercel.app/pratik-kart/kd-gebelik-takip-karti-2026.pdf |
| dermatoloji | Sistemik Tedavi İzlem Kartı | https://notya-growth.vercel.app/pratik-kart/dermatoloji-sistemik-tedavi-izlem-karti-2026.pdf |

## /takip

```
Hocam kart işinize yaradı mı? Eksik ya da eklenmesini istediğiniz bir şey olursa yazın, düzeltiyoruz.
```

Kullanım: `durum = kart_gonderildi`, `gonderim_tarihi` ≥ 3 gün önce, `yanit` boş → `notlar` içine `takip_gunu` yazılır; `/takip` **bir kez**.

## /demo

```
Harika Hocam. Size uygun saati buradan seçebilirsiniz: https://www.notya.io/demo — Dr. Gökhan Mamur bizzat gösterecek.
```

## Durum makinesi

| durum | anlam |
|-------|--------|
| `hazir` | Batch’te, henüz teklif edilmedi |
| `teklif_edildi` | mesaj_1 gönderildi |
| `kart_gonderildi` | PDF gitti |
| `demo` | demo linki / randevu |
| `ilgilenmiyor` | 5 gün yanıtsız teklif veya ret |

Kural: `teklif_edildi` + 5 gün + `yanit` boş → `ilgilenmiyor` (bir daha yazma).
