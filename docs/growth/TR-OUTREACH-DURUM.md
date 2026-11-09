# TR outreach durum (canlı)

**Kaynak doğruluk (zorunlu sıra):**
1. `tr-outreach-ledger.csv` — isim + telefon
2. `TR-WHATSAPP-GONDERIM-PAKETI.md` — `← GİTTİ` / `ZATEN` / `WA YOK`
3. Early batch **2026-11-05** (Cengiz öncesi): İsmail, Elif Dilasa, **Hatice Gürsoy**, Aylin, Dilek (`+905458150451`), Sema, Sinem — **asla tekrar yazma**

`python3 scripts/tr-outreach-next.py` bu üç kaynağı birlikte tarar.

**Sıradaki:** Prof. Dr. **Süha Sönmez** · KD · Bahçelievler · `+905414418195`  
(ledger + early-batch temiz)

## Audit 2026-11-09 — duplicate düzeltme

| Kişi | Telefon | Sonuç |
|------|---------|--------|
| Op. Dr. Hatice Gürsoy | `+905348489034` | **zaten_gitti** (2026-11-05 early — ~2 gün önce; wave3 SIRADAKİ hatası) |
| Uzm. Dr. Dilek Başaran | `+905458150451` | **gitti** (2026-11-05 ORIGINAL) |
| Dilek (530 denemesi) | `+905305910620` | zaten_gitti (dup) |
| Dilek (listing) | `+905162223828` | wa_yok |
| Op. Dr. Elif Dilasa Pala Köse | `+905397938221` | gitti (early 11-05 + 11-09 log) — tekrar yok |
| Prof. Dr. İsmail Özdemir | `+905448358595` | zaten_gitti (early) |
| Uzm. Dr. Aylin Sema Tırpancı | `+905058498433` | zaten_gitti (early) |
| Uzm. Dr. Berrin Arslan | — | wa_yok (early) |

## Early batch 2026-11-05 (Cengiz öncesi) — tam liste

1. İsmail Özdemir — gitti  
2. Elif Dilasa Pala Köse — gitti  
3. Hatice Gürsoy — gitti  
4. Aylin Sema Tırpancı — gitti  
5. Dilek Başaran — gitti (`+905458150451`)  
6. Sema Süzen Çaypınar — gitti  
7. Sinem Tekin — gitti  
— Berrin Arslan — WA yok  

Bu yedi isim ledger + `EARLY_BATCH_*` seed’inde kilitli.

## Stok

Call-ready’de kalan **tekil gerçek 5xx** (588/0850 değil): Süha sonrası **0**.  
Sonraki isim için WhatsApp enrich / yeni harvest şart — aksi halde early-batch’e düşeriz.
