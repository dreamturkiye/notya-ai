# Meslektaş V2 — 10. seansta görülen meslektaş

Ayşe’nin hafıza makinesi (aşama, düzeltme logu, stil profili) vardı; doktor **görmüyordu**. V2 kuralı: öğrenilen her madde bir sonraki seansta bir şey değiştirir; öğrenme istek yoluna gecikme eklemez (`waitUntil`).

Model politikasına dokunulmaz (`lib/ai/modeller.ts` / `cagir.ts` / `saglayici.ts` / `devre.ts`).

## Faz 1 — Düzeltmeden kural + görünürlük (bu PR)

| Parça | Nerede |
|---|---|
| Fark (LLM yok) | `lib/doktor/ogrenme/duzeltmeAnaliz.ts` |
| Kural eşiği | `lib/doktor/ogrenme/kuralTuret.ts` — 2 not (ilaç 3); doz **değeri** asla kural olmaz |
| Onay kancası | `onaySonrasiOgren` → `waitUntil` (`approve`, belge onay, yeniden onay) |
| Nota uygulama | `soapUret` değişken blok `DOKTORUN KURALLARI` ≤12; JSON `uygulananKurallar` |
| Chip | İnceleme + not sayfası: «Sizin tarzınızla yazıldı · N kural» → Kapat |
| Sayfa | `/dashboard/doktor/ayarlar/ayse-hafizasi` |
| Selam | GÜN-01: alışma+ «Dünkü düzeltmelerinizden öğrendim»; 10. seans bir kez |

### Tablolar (migration 106)

- `doktor_hafiza.durum` `aday|uygulanir|kapali`, `ornekler`, `kanit_not_idler`
- `notes.uygulanan_kurallar` text[]
- `doktor_ogrenme_islemleri` (idempotent)
- `doktor_iliski.ogrenme_selam_gunu`, `meslektas_selam_at`
- `ai_hiz_olcum` (sure_ms; `cagir.ts`’e dokunulmadı)

### Eşikler

| Kural | UYGULANIR |
|---|---|
| terim / silme / ekleme / uzunluk / sıra / doz biçimi | 2 bağımsız not |
| ilaç A→B | 3 not |
| doz **değeri** (400 mg → 250 mg) | asla |

Kapat = `durum=kapali` + `doktor_soyledi` negatif kayıt. Unut = `hafizaUnut`.

## Faz 2 — Rutin + öne geçme

Telemetri (PII yok) `lib/telemetri/kullanim.ts` → `POST /api/doktor/kullanim` (sendBeacon, ≤1/10 sn). Tablo `doktor_kullanim_olaylari`. Gece 03:30 TRT ` /api/cron/meslektas-rutin` + 30 gün silme → `rutinTuret` → `doktor_rutin`. `SonrakiAdim` yalnız p≥0.6 ve n≥8. Bugün: `kartSirasi=hastalar` ise Hastalar kartı Randevular’ın üstünde. Önerir, yazmaz / gezdirmez. Dismissal = `reddet` (negatif kanıt).

## Faz 3 — Önbellek + prefetch

`hasta_dosya_onbellek` (doctor_id+patient_id). Taze satır → derive yok. `onbellekKirlet` yazma yerlerinde. Cron 06:00 TRT + giriş/`onbellek-isin` + hasta sayfası. SOAP önek ısınması girişte waitUntil. `v_hiz_gunluk`. Hedef: önbellekli sohbet P50 −40%; not yavaşlamaz.

## Session-10 simülasyonu

`npx tsx scripts/meslektas/seans10.mts` — 10 sentetik gün: ≥3 UYGULANIR, `uygulananKurallar` dolu, meslektaş selamı, SonrakiAdim, ilk hasta paketi taze.

## Öğrenme V3 (2026-11-13, Kaan'ın GO'su)

1. **İvme** — `ivme.ts` + `metrik.ts`: onaylı not başına gerçek düzeltme sayısı (`doktor_ogrenme_metrik`, migration 197). <3 not boş durum; yön ≥6 notta (ilk 3 vs son 3, ±%15). Haftalık satır: son 7 gün, geçen hafta ≥2 not varsa karşılaştırma.
2. **Önizleme** — `onizleme.ts`: kuralın `kanit_not_idler` notlarının `not_duzenlemeleri` satırlarından deterministik fark; LLM yok. Doz değeri asla kural → önizleme yok.
3. **Klinik ortak üslup** — `klinikUslup.ts`: varsayılan KAPALI, açık rıza; yalnız uzunluk/sıra ve izin listesindeki terim kuralları; branşa göre bölünür; yazar kimliği istemciye dönmez; ayrılınca satırlar silinir. Alan doktor kendi kuralını önce, klinik kuralını sonra alır (`uygulanirKurallariYukle`, `klinik:` slug); kapatılabilir.
