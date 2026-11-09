# TR outreach durum (canlı)

**Sıradaki:** Dr. Öğr. Üyesi **Hazel Çağın Kuzey** · KD · Küçükçekmece · `+905051615779`  
(ledger-clean · wave4)

## İstanbul dalgası (korpus)

| Metrik | Sayı |
|--------|------|
| Profil tarandı | **3 350** |
| Pediatri / KD / Derm | **1 300 / 1 319 / 731** |
| Özel muayenehane | **1 696** |
| Call-ready (özel + telefon) | **1 655** |
| WhatsApp’a hazır GSM (enrich sonrası) | **~37 tekil** (önce ~28; Doktorsitesi GSM pass) |

Call-ready satırlarında gerçek `5xx` GSM artık **~48** (088/588 değil).

## GSM enrich (2026-11-09)

- Script: `scripts/tr-leads-gsm-enrich.mjs` — yalnız **GSM/cep 5xx** (0850 + 588 hub reddi)
- Doktorsitesi profilleri tarandı (DT sayfalarında tekil GSM yok)
- Paylaşılan widget numaraları elendi (`546.598.92.11` vb.)
- Ledger / early-batch asla tekrar önerilmez
- Çıktı: `tr-gsm-enrich-hits.csv` · `tr-whatsapp-next-batch.csv` · `tr-whatsapp-wave4.csv`

## Ankara + İzmir

Harvest listelerde tanımlı; İstanbul ana odak. Ayrı merge-safe dalga sırada (`tr-ankara-izmir` — korpusu ezmeden).

## Son gönderimler

| Kişi | Telefon | Sonuç |
|------|---------|--------|
| Prof. Dr. Süha Sönmez | `+905414418195` | gitti |
| Op. Dr. Hatice Gürsoy | `+905348489034` | zaten_gitti (early 11-05) |
