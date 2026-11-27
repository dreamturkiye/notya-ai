# BRANS-PAKETI Phase 2 — signature portal modules for the 30 medical branşlar (2026-11-27)

**Status:** started 2026-11-27 (Kaan: "Faz ikiyi başlat ve hasta portalını exceptional bir şekilde 30+10 branşa uygula").
Batch (a) shipped: pediatri, kadın hastalıkları-doğum, dermatoloji + Bugün card + design pass + doctor tile + demos
(`/portal/demo-paket/<branş>`). What each branş got: docs/portal/BRANS-PORTAL-ENVANTER.md. Sources:
docs/kaynak/TIBBI-BRANS-PAKETI-ARASTIRMA.md. The table below was the proposal; the shipped modules can differ (e.g. KD
PMS/PMDD stays KD-TARAMA-01, measurements already on Bugün are not repeated in a diary).

Owner: Claude. Starts after Phase 1 (10 Özel Branşlar, diyetisyen full package) is live on main.
Same framework, no fork: add modules to the registry (`lib/portal/bransPaketi.ts` + `lib/portal/paket/<grup>.ts`) with
the medical branş as owner, render through the shared `BransPaketiView` UNDER the existing chapter page (Taban önce:
Kalbim, Gözlerim, Derim … stay), professional-accepted templates (`brans_paket_sablon`), per-patient switches
(`brans_paket_hasta`), diary / photos (`brans_paket_kayit`, `brans_paket_foto`), red flags → ev_uyarilar + doctor push.
Resolver change needed: `paketBransi` must also accept the 30 medical keys (today Özel Branş only — a deliberate Phase-1 gate,
pinned by `bransPaketi.test.ts` "none of the 30 medical branşlar resolves any package module in Phase 1"; flip that test
branch by branch). Each module researched and sourced Turkish-first (SB / SGK / TİTCK → Turkish society → ESC/ADA/KDIGO/GINA/GOLD → textbook).

Starting point per branş = the inventory (docs/portal/BRANS-PORTAL-ENVANTER.md): today each medical chapter page shows
doctor-set dates / notices only; none has a patient diary, photo diary or day-by-day timeline.

| Branş | Proposed signature modules (patient opens daily / at each step) |
|---|---|
| dahiliye | HT/DM home log already on Bugün → add hipoglisemi belirti günlüğü, öğün–ölçüm eşleme, ön anket sonuçlarının geri bildirimi |
| endokrinoloji | levotiroksin saati (reuse `ilac-saati`), insülin pen/CGM eğitim kontrol listesi, hipo/hiper belirti günlüğü (no dose), tiroid ilacı kahvaltı planı |
| kardiyoloji | KY günlüğü (kilo +2 kg/3 gün, ödem, nefes darlığı → hekime / acil), kardiyak rehabilitasyon ev programı (ESC 2026 rehab), antikoagülan kanama işaretleri günlüğü |
| aile-hekimligi | yaş/cinsiyet tarama takvimi (SB periyodik muayene), aşı + tarama hatırlatma zaman çizelgesi, sigara bırakma günlüğü |
| nefroloji | sıvı/kilo günlüğü, diyaliz günü zaman çizelgesi, potasyum/fosfor besin listesi (KDIGO + TND), fistül bakım listesi |
| kalp-damar-cerrahisi | post-op yara/ödem günlüğü + fotoğraf, kompresyon çorabı saatleri, yürüme mesafesi günlüğü (PAH) |
| pediatri | ateş-ilaç kartı var → gelişim basamakları kontrol listesi (veli), beslenme/uyku günlüğü (0–2 yaş), aşı sonrası belirti günlüğü |
| cocuk-cerrahisi | post-op zaman çizelgesi (veli dili), yara fotoğrafı, ağrı (FLACC değil — veli gözlem), kırmızı bayraklar |
| kadin-hastaliklari-dogum | gebelik haftası zaman çizelgesi (Gebeliğim'e ek), bebek hareketi sayımı (≥28. hafta; SB protokol), PMS/PMDD günlüğü (KD-TARAMA-01 ile birleştir), post-op (sezaryen) yara günlüğü |
| gogus-hastaliklari | astım/KOAH eylem planı (GINA 2026 / GOLD 2027) + semptom günlüğü, inhaler teknik kontrol listesi, pik akım günlüğü |
| enfeksiyon-hastaliklari | antibiyotik/antiviral uyum + yan etki günlüğü, ateş eğrisi (var) + tetkik zaman çizelgesi |
| onkoloji | kemoterapi döngü zaman çizelgesi, yan etki günlüğü (ateş ≥38 nötropeni → acil), ağız bakım listesi |
| noroloji | migren / nöbet günlüğü, inme sonrası ev programı, ilaç saati (AED, no dose) |
| beyin-cerrahisi | post-op zaman çizelgesi, yara fotoğrafı, nörolojik kırmızı bayraklar (acil) |
| genel-cerrahi | ERAS ev zaman çizelgesi, yara fotoğrafı, dren/ateş günlüğü (estetik-cerrahi modülünden genelleştir) |
| gogus-cerrahisi | solunum egzersizi programı (triflo), yara/dren günlüğü, nefes darlığı → acil |
| plastik-cerrahi | Yaram'a ek: yara fotoğraf günlüğü, flep/greft bakım listesi, kırmızı bayraklar |
| anestezi | ameliyat öncesi hazırlık listesi (aç kalma — hekimin saati), ameliyat sonrası 24 saat günlüğü |
| acil-tip | taburculuk sonrası kırmızı bayrak günlüğü (48–72 saat), kontrol zaman çizelgesi |
| gastroenteroloji | semptom/besin günlüğü (IBS, IBH), kolonoskopi hazırlık zaman çizelgesi |
| romatoloji | eklem ağrı/sabah tutukluğu günlüğü, biyolojik ilaç enjeksiyon takvimi (no dose), tetkik izlem hatırlatmaları |
| spor-hekimligi | spora dönüş zaman çizelgesi (RTP), yük/ağrı günlüğü |
| ortopedi | post-op ev egzersiz programı, ROM/ağrı günlüğü, alçı/ortez bakım listesi |
| fizik-tedavi | FTR'm'e ek: ev programı (fizyoterapi modülünü paylaş), ağrı günlüğü |
| uroloji | işeme günlüğü (frekans/volüm), sonda bakım listesi, taş ağrısı + ateş → acil |
| psikiyatri | duygu/uyku günlüğü (psikoloji modülünü paylaş; kriz → 112), ilaç yan etki günlüğü (no dose) |
| dermatoloji | Derim'e ek: lezyon fotoğraf günlüğü (klinik-dermatoloji modülünü paylaş), izotretinoin izlem |
| kulak-burun-bogaz | Kulaklarım'a ek: post-op (tonsillektomi) zaman çizelgesi + kanama → acil, burun yıkama listesi |
| goz-hastaliklari | Gözlerim'e ek: damla takvimi (post-op katarakt zaman çizelgesi), Amsler grid günlüğü, ani görme kaybı → acil |
| radyoloji | tetkik hazırlık kontrol listeleri (kontrast, açlık), sonuç hazır bildirimleri (var) |

Per-branş work in Phase 2 = research note in docs/kaynak, module data, resolver gate flip, leak test + demo where useful,
queue entry per feature (au/uz notes). Tracked as OPEN-COMMITMENTS § BRANS-PAKETI-FAZ2.
