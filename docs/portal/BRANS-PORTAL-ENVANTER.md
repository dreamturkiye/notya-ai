# Branş portal inventory — what a patient of each branş sees in Sağlığım (verified in code, 2026-11-27)

Method: `portalModulleri()` (lib/portal/moduller.ts) was run for every one of the 40 branşlar (adult patient, no
pregnancy / growth / KD / dahiliye chart data) and the daily-home row was read from `lib/saglikEvi/bransAyari.ts`.
Every branş also gets the CORE spine, which is not repeated per line: Bugün daily home (doses, rings, trends, karne,
Kontrol Öncesi Özet), Randevu (when the doctor's booking is on), Mesajlar, Ziyaretler (+ Yönlendirmeleriniz), Sonuçlar,
İlaçlar, Öykü, Takip, Aşı Karnesi (universal), doctor-first brand, per-patient modules (HASTA-MODULLERI).
"Ölçüm kutuları" = quick-add tiles on Bugün; "kart" = extra Bugün card; vurgu = measurement-led (ölçüm) or dose-led (uyum).
"Paket" = BRANS-PAKETI signature modules added in this change (Özel Branşlar only; 30 medical = Phase 2).

## 30 medical branşlar (lib/doktor/specialties.ts)

| Branş | Branş module page(s) | Ölçüm kutuları · kart · vurgu | Paket |
|---|---|---|---|
| dahiliye | Takibim, Ön anket | KB / glukoz / kilo / nabız · LDL, kilo eğilimi · ölçüm | Phase 2 |
| endokrinoloji | Hormonlarım | KB / glukoz / kilo / nabız · LDL, kilo eğilimi · ölçüm | Phase 2 |
| kardiyoloji | Kalbim | KB / glukoz / kilo / nabız · LDL, kilo eğilimi (+2 kg/3 gün hekime) · ölçüm | Phase 2 |
| aile-hekimligi | Sağlık Paketim | KB / glukoz / kilo / nabız · LDL, kilo eğilimi · ölçüm | Phase 2 |
| nefroloji | Böbreklerim | KB / kilo / glukoz / nabız · LDL, kilo eğilimi (kilo hekime) · ölçüm | Phase 2 |
| kalp-damar-cerrahisi | Damar Cerrahisi takibi | KB / nabız / kilo · kilo eğilimi · ölçüm | Phase 2 |
| pediatri | Aşı Bilgilendirme (+ Büyüme under 18 / unknown DOB) | ateş / kilo · ateş-ilaç kartı · uyum | Phase 2 |
| cocuk-cerrahisi | Çocuğumun Cerrahisi | ateş / kilo · ateş-ilaç kartı · uyum | Phase 2 |
| kadin-hastaliklari-dogum | Jinekoloji hatırlatmaları (Takip), Gebeliğim on an active pregnancy | KB / kilo · kilo eğilimi · ölçüm | Phase 2 |
| gogus-hastaliklari | Akciğerlerim | SpO₂ / nabız / ateş · — · ölçüm | Phase 2 |
| enfeksiyon-hastaliklari | Enfeksiyon Takibim | ateş / nabız · — · uyum | Phase 2 |
| onkoloji | Tedavim | ateş / kilo / nabız · kilo eğilimi · uyum | Phase 2 |
| noroloji | Nörolojim | KB / nabız · — · uyum | Phase 2 |
| beyin-cerrahisi | Beyin Cerrahisi takibi | ateş / KB · — · uyum | Phase 2 |
| genel-cerrahi | Ameliyatım | ateş / kilo · — · uyum | Phase 2 |
| gogus-cerrahisi | Göğüs Cerrahisi takibi | SpO₂ / ateş / nabız · — · ölçüm | Phase 2 |
| plastik-cerrahi | Yaram | ateş · — · uyum | Phase 2 |
| anestezi | Anestezi Öncesi | KB / nabız / SpO₂ · — · uyum | Phase 2 |
| acil-tip | Acil sonrası takip | ateş / KB / nabız · — · uyum | Phase 2 |
| gastroenteroloji | Sindirimim | kilo / ateş · kilo eğilimi · uyum | Phase 2 |
| romatoloji | Romatizmam | KB / kilo · — · uyum | Phase 2 |
| spor-hekimligi | Sporum | nabız / kilo · — · uyum | Phase 2 |
| ortopedi | Eklemlerim | — · — · uyum | Phase 2 |
| fizik-tedavi | FTR'm | — · — · uyum | Phase 2 |
| uroloji | Ürolojim | ateş · — · uyum | Phase 2 |
| psikiyatri | Ruh Sağlığım | — · — · uyum | Phase 2 |
| dermatoloji | Derim | — · — · uyum | Phase 2 |
| kulak-burun-bogaz | Kulaklarım | — · — · uyum | Phase 2 |
| goz-hastaliklari | Gözlerim | — · — · uyum | Phase 2 |
| radyoloji | Tetkiklerim | — · — · uyum | Phase 2 |

Note: the medical chapter pages are reminder/date/notice pages filled from the doctor's chapter records (MD-set
kontrol, işlem, test dates; patient-safe numbers; no diagnosis). None of them has a patient diary, photo diary or a
professional-accepted day-by-day timeline yet — that is the Phase-2 gap (docs/portal/BRANS-PAKETI-FAZ2.md).

## 10 Özel Branşlar (lib/specialties/klinikDikey.ts)

Before this change every Özel Branş page was the same `KlinikHatirlatmaView`: a list of dates the professional's tools
wrote to `ozel_brans_plan.portal_satir` (or a fixed "bakım ritmi" text when empty) + an acil line. That base stays
(Taban önce); the package renders under it.

| Branş | Page (kept) | Ölçüm kutuları · kart · vurgu | Before 2026-11-27 | Paket modules added (BRANS-PAKETI) |
|---|---|---|---|---|
| diyetisyen | Beslenmem | kilo / bel / su · su sayacı, kilo eğilimi · ölçüm | one control date line | Tabağım, Haftalık planım + alışveriş listesi, Vücut ölçülerim, İlerleme fotoğrafları (opt-in), PKOS döngü günlüğü*, Tiroid ilacı ve kahvaltı*, Öğün ritmim*, Protein ve yan etki günlüğü (GLP-1)*, Beslenme alışkanlıkları tarama (SCOFF) — *condition modules |
| sac-ekimi | Saçım | — · — · uyum | yıkama / kontrol date lines | Gün gün iyileşmem (timeline from işlem günü), Çıkış fotoğrafları (5 angles, 3/6/9/12. ay), Hekimimin bakım planı, İyileşme günlüğü (red flags) |
| estetik-cerrahi | Ameliyat bakımım | ateş · — · uyum | pansuman / kontrol date lines | Ameliyat öncesi hazırlık listesi (tickable), İyileşme takvimi, İyileşme günlüğü (ağrı, şişlik, dren, korse; DVT / hematom / emboli → acil), İyileşme fotoğrafları |
| medikal-estetik | Bakımım | — · — · uyum | bakım date lines | İşlem takvimi (rötuş), İşlem sonrası bakım, Günlük (vasküler bayrak / görme → acil) |
| klinik-dermatoloji | Bakımım | — · — · uyum | seans date lines | Cilt fotoğraf günlüğü, Tedavi günlüğü, İzotretinoin izlem hatırlatmaları (doctor switch only) |
| longevity | Planım | KB / glukoz / kilo / nabız / SpO₂ · LDL, kilo eğilimi · ölçüm | seans date line | Değerlerim (physician-ordered biomarkers over time), Günlük hedeflerim (uyku / adım / hareket) |
| fizyoterapi | Egzersizim | — · — · uyum | seans date lines | Ev egzersiz programım (therapist-written, daily tick), Ağrı ve hareket günlüğü (red flags) |
| klinik-psikolog | Görüşmelerim | — · — · uyum | next session date | Duygu günlüğüm (crisis copy → 112), Görüşmeler arası çalışmam |
| ergoterapi | Günlük programım | — · — · uyum | seans date lines | adult: Günlük yaşam hedeflerim; under 18: Çocuğumun günlük hedefleri + Çocuğumun duyusal planı (veli wording) |
| odyoloji | İşitme takibim | — · — · uyum | kontrol date line | Cihaz kullanımım (hours vs target; ani işitme kaybı → acil), Çınlama günlüğü (switch), Cihaz bakımım |
