# Meslektaş V2 — hız raporu (QA)

Tarih: 2026-09-27. Ölçüm tablosu: `ai_hiz_olcum` + görünüm `v_hiz_gunluk` (p50/p95, `gorev`, gün). `cagir.ts` dokunulmadı.

## Hedef

| Yol | Hedef |
|---|---|
| Sohbet, önbellekli hasta | P50 −40% (Faz 3 öncesi derive’a göre) |
| Not üretimi | yavaşlamaz (öğrenme waitUntil) |
| Önbelleksiz sohbet | regresyon yok |

## Yöntem

1. QA hekimde 10 dosya sorusu (Ayşe standart) — aynı hasta, önce soğuk sonra `hasta_dosya_onbellek` taze.
2. 3 not üretimi (ses veya seans bitir) — `gorev=soap` `sure_ms`.
3. `v_hiz_gunluk` ile günün p50/p95.

Canlı 10+3 tur bu PR’de kod yoluna bağlandı (`hizYazSessiz`, sohbet `onbellekli` bayrağı). Sayısal QA turu Dr. Gökhan 10. seans kontrolüyle birlikte okunur (`OPEN` V2-03).

## Yazma yerleri (`onbellekKirlet`)

`notes/[id]/approve`, `sessions/[id]/end`, `sessions/ses-yukle`, `doktor/asilar` POST. Lab / belge / cihaz / randevu / intake yazıları aynı yardımcıyı almalı (liste PR’de).
