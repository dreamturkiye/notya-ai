# Old Ayşe vs today — Dr. Gökhan complaint corpus at the 2026-09-27 checkpoint

Checkpoint: commit `ac947eef` (2026-09-27 11:00 EDT — the last main commit before the Meslektaş V2 cache, the Fish hybrid and the later routers; Luna-Pro brain, ElevenLabs voice). Today: `origin/main`, results in `.denetim-out/bugun-korpus.jsonl` / `docs/denetim/bugun-korpus-rapor.md`.

**This is a measurement of the old build, not a proposal to go back to it.** The product stays on Luna + Fish Audio. The purpose is to see which complaints the later work fixed, which it introduced, and what to fix next on today's build.

> **THE LIVE PASS WAS NOT RUN.** This environment has no provider credentials, so the checkpoint was run in STAND-IN mode: a stand-in answered instead of the model. What the stand-in run establishes is every turn the old build answered WITHOUT the model (identity, patient search / count template, quick card) and every structural fact (which step answered, which chart the turn was bound to). A turn whose words the model wrote is `NOT_JUDGED` here. Today's results are live. Run the live pass with the command at the end and re-run this script; every table below is recomputed.

Checkpoint run: 2026-10-02, stand-in, 850 graded turns from 417 corpus entries. Same corpus file (byte-identical to main's `gokhanSikayetKorpusu.ts`), same synthetic patients, same assertion code (`beklentiDegerlendir`).

## 1. Counts on the surfaces both builds have

| surface | turns | checkpoint PASS | FAIL | MANUAL | NEW | not judged | today PASS | FAIL | MANUAL |
|---|---|---|---|---|---|---|---|---|---|
| chat | 412 | 104 | 56 | 10 | 77 | 165 | 388 | 14 | 10 |
| panel | 21 | 0 | 0 | 0 | 0 | 21 | 18 | 3 | 0 |
| **both** | 433 | 104 | 56 | 10 | 77 | 186 | 406 | 17 | 10 |

NEW = the entry expects a capability that did not exist at the checkpoint (a route, a fixed sentence, an action or the conversation-context record introduced later); it was still run and its answer is in section 6. Rule: `lib/asistan/tests/checkpointYetenek.ts`.

### The same entries only (NEW left out on both sides)

| surface | turns | checkpoint PASS | FAIL | MANUAL | not judged | today PASS | FAIL | MANUAL |
|---|---|---|---|---|---|---|---|---|
| chat | 335 | 104 | 56 | 10 | 165 | 311 | 14 | 10 |
| panel | 21 | 0 | 0 | 0 | 21 | 18 | 3 | 0 |
| **both** | 356 | 104 | 56 | 10 | 186 | 329 | 17 | 10 |

The 77 NEW turns today: 77 PASS, 0 FAIL, 0 MANUAL.

### Verdict at the checkpoint × verdict today (chat + panel)

| checkpoint ↓ / today → | PASS | FAIL | MANUAL |
|---|---|---|---|
| PASS | 101 | 3 | 0 |
| FAIL | 51 | 5 | 0 |
| MANUAL | 0 | 0 | 10 |
| NEW | 77 | 0 | 0 |
| not judged (stand-in) | 177 | 9 | 0 |

### Voice — NOT compared

The Fish voice route (`/api/asistan/fish-tur`) does not exist at the checkpoint. The voice of that build was ElevenLabs with a Custom LLM endpoint (`/api/asistan/ses-llm`), which CAN be driven in process with the transcript as text; it was run as a separate surface, `voice-el`, graded with the corpus's voice expectations. It is a different stack from today's voice (other recogniser, other speech engine, other turn-taking, a 5-sentence spoken cap), so the two rows below are side by side for reference only and no regression is derived from them.

| surface | turns | PASS | FAIL | MANUAL | NEW | not judged |
|---|---|---|---|---|---|---|
| checkpoint voice-el (ElevenLabs Custom LLM, text in) | 417 | 106 | 57 | 12 | 78 | 164 |
| today voice (Fish route, text in) | 417 | 386 | 19 | 12 | — | — |

### Which step answered (chat)

| route | checkpoint turns | today turns |
|---|---|---|
| arama | 62 | 29 |
| dosya-ac | 0 | 11 |
| gurultu | 0 | 1 |
| hizli-kart | 91 | 61 |
| kapsam | 0 | 11 |
| kayit | 0 | 37 |
| kimlik | 11 | 11 |
| model | 248 | 193 |
| takvim | 0 | 58 |

At the checkpoint the route is derived from what the turn did (the build logs none): `model` = a model request left the brain; `kimlik`, `arama`, `hizli-kart` = the three model-free answers that existed. `kapsam`, `takvim`, `gurultu`, `dosya-ac`, `kayit` were added later.

## 2. PASSED at the checkpoint, FAIL today — regressions since 2026-09-27 (3 turn(s))

Stand-in run: this list can only contain turns the old build answered without the model, or whose expectation is purely structural. It is a lower bound; section 4 lists today's failures the stand-in could not judge.

| id | surface | sentence | checkpoint: route → answer | today: route → answer | why it fails today | first commit that explains it |
|---|---|---|---|---|---|---|
| Y-021 | chat | Son ölçümleri neler? *(after: Gelen belgeler kutusunda bir şey var mı? → Sonraki randevusu ne zaman?)* | hizli-kart → Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg · Boy: 110 cm. | kayit → **Ayşe Bozkurt — kilo, boy ve baş çevresi ölçümleri** (1 muayene) \| Tarih \| Kilo (kg) \| Boy (cm) \| Baş çevresi (cm) \| \| --- \| --- \| --- \| --- \| \| 24.09.2026 \| 19,4 \| 1… | içermeli: 38,9 | `5573be8a` — S5 "records on screen" (NOTYA-AYSE-GERI-05, 2026-10-01) introduced the model-free record tables. "Son ölçümleri neler?" is now taken by the anthropometry table (weight / height / head circumference), which runs before the quick card; the last visit's fever and blood pressure, which the quick card used to say, are no longer in the answer. `git log -S'sade("kayit"'` returns this commit only. *(path: `lib/asistan/ayseCevapla.ts — sade("kayit")`)* |
| Y-080 | chat | Tarık Özdemir'in randevusu ne zaman? *(after: yarin sabah bosluk var mi → Bugün öğleden sonra 3'te yer var mı?)* | hizli-kart → Tarık Özdemir — dosyada randevu: randevu yok. | takvim → 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). | içermeli: {DUN}\|dün\|11[:.]30\|randevu\w* (yok\|bulunmuyor\|görünmüyor\|kay… | `7661d7fc` — Conversation continuity (2026-09-30) rewrites a sentence said after a calendar turn with the previous turn's calendar intent; the calendar reader then answers with a day list and the named patient is ignored (the quick card answered from his chart at the checkpoint). ed94ef46 (same day, "next-day fallback") is the commit that makes the list tomorrow's. Found with `git log -S'takipCoz('`; not bisec… *(path: `lib/asistan/konusmaBaglami.ts takipCoz → lib/asistan/ayseCevapla.ts calendar branch`)* |
| T-025 | chat | peki Tarık Özdemir randevusu ne zaman? *(after: Bugün randevum var mı?)* | hizli-kart → Tarık Özdemir — dosyada randevu: randevu yok. | takvim → 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). | içermeli: Tarık | `7661d7fc` — Same cause as Y-080: a named-patient appointment question right after "Bugün randevum var mı?" inherits the calendar intent and gets tomorrow's list (ed94ef46 adds the next-day fallback). Not bisected. *(path: `lib/asistan/konusmaBaglami.ts takipCoz → lib/asistan/ayseCevapla.ts calendar branch`)* |

## 3. FAILED at the checkpoint, PASS today (51 turn(s))

| id | surface | sentence | checkpoint: route → answer | why it failed then | today: route → answer |
|---|---|---|---|---|---|
| L-SAYIM-ANDA | chat | Hocam benim şu anda toplam kaç hastam var? | arama → Kayıtlarda 0 hasta. | içermeli: Kayıtlarda 5 hasta; içermemeli: Kayıtlarda 0 hasta | arama → Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| L-SES-HASTA-01-ASR | chat | Ayşe Bozkurtun son muayenesinin özetini verir misin? | arama → Kayıtlarda 0 hasta. | rota arama (olmamalı); hasta — ≠ Ayşe Bozkurt; içermeli: pnömoni\|zatürre\|öksürük; içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Ayşe Bozkurt’un son muayenesinde toplum kökenli pnömoni değerlendirilmiş; akciğer grafisi istenmiş ve 3 gün sonra kontrol planlanmış. **Dayanak:** - **24.09.2026:** Öksür… |
| L-ODAK-HITAP-1 | chat | Ayşe, aşı karnesini gösterir misin? | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. | rota arama (olmamalı) | model → Ayşe adında bir hastayı kayıtlarınızda bulamadım Hocam; adını ve soyadını tam söyler misiniz? |
| L-GERI-03-YABANCI | chat | Ali Yılmaz için randevu oluştur | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · Randevu. | rota arama (olmamalı); içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Hangi gün ve saat için Hocam? |
| L-DANIS-12AY | chat | bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu | hizli-kart → Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | rota hizli-kart (olmamalı); içermeli: 12 aylık; içermeli: 9,8 kg; içermemeli: 12,8 | kayit → Emircan Karaoğlu — 12 aylık muayene (30.08.2025): kilo 9,8 kg. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-15AY | chat | 15 aylıkken kaç kiloydu | hizli-kart → Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | rota hizli-kart (olmamalı); içermeli: 15 aylık; içermeli: 10,6 kg; içermemeli: 12,8 | kayit → Emircan Karaoğlu — 15 aylık muayene (30.11.2025): kilo 10,6 kg. Kaynak: muayene notunun metni (Bulgu: "Kilo 10,6 kg"). |
| L-DANIS-6AY | chat | 6 aylık kontrolde boyu kaçtı | hizli-kart → Emircan Karaoğlu — dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. | rota hizli-kart (olmamalı); içermeli: 6 aylık; içermeli: 67,5 cm | kayit → Emircan Karaoğlu — 6 aylık muayene (28.02.2025): boy 67,5 cm. Kaynak: muayene notunun yaşamsal bulgu alanı. |
| L-DANIS-NORMAL | chat | 12 aylık muayenesinde kilosu normal miydi? | hizli-kart → Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | rota hizli-kart (olmamalı); içermeli: 9,8 | model → Emircan Karaoğlu’nun 12 aylık muayenesindeki kilosu yaşına göre normal aralıktaydı. **Dayanak:** 30.08.2025’te kilosu **9,8 kg** olarak kaydedilmiş (Neyzi: **38. persenti… |
| L-DANIS-SERI-2 | chat | bütün muayenelerinde kilosu | hizli-kart → Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | içermeli: 8,9; içermeli: 10,6; ekranda tablo yok | kayit → **Emircan Karaoğlu — kilo ölçümleri** (15 muayene) \| Tarih \| Kilo (kg) \| \| --- \| --- \| \| 04.09.2024 \| 3,2 \| \| 30.09.2024 \| 4,3 \| \| 30.10.2024 \| 5,4 \| \| 30… |
| L-DANIS-ILK | chat | ilk muayenede kaç kiloydu | hizli-kart → Nermin Aydoğan — dosyada son ölçüm: Tansiyon: 132/84 mmHg · Nabız: 76/dk · Kilo: 75,5 kg. | rota hizli-kart (olmamalı); içermeli: \b78\b; içermemeli: 75,5 | kayit → **Nermin Aydoğan — kilo ölçümleri** (ilk muayene; toplam 4 muayene kayıtlı) \| Tarih \| Kilo (kg) \| \| --- \| --- \| \| 28.08.2025 \| 78 \| Yalnız dosyada kayıtlı değerl… |
| L-KOHORT-01 | chat | Son bir ay içinde hangi antibiyotiği en fazla yazdım? | model → Vekil yanıt Hocam. | rota model ≠ arama | arama → Son 1 ay en çok yazdığın antibiyotik Amoksisilin 250 mg/5 ml süspansiyon (1 reçete). Sıra: Amoksisilin 250 mg/5 ml süspansiyon 1, Augmentin ES 600 mg/5 ml süspansiyon 1, … |
| L-KOHORT-03 | chat | Bu hafta en fazla hangi tanıyı koydum? | model → Vekil yanıt Hocam. | rota model ≠ arama | arama → Bu hafta en çok koyduğun tanı Akut otitis media (1). Sıra: Akut otitis media 1, Otitis media, iyileşmiş 1 (toplam 2). |
| G-02 | chat | Emircanın dosyası | model → Vekil yanıt Hocam. | hasta — ≠ Emircan Karaoğlu | model → Emircan Karaoğlu’nun dosyası açık Hocam. 2 yaşında erkek çocuk; son viziti 30 Eylül 2026’da otit kontrolü, otit iyileşmiş. Son ölçülen kilosu 12,8 kg. Sonraki randevusu 9… |
| G-04 | chat | Karaoğlunun aşıları | model → Vekil yanıt Hocam. | hasta — ≠ Emircan Karaoğlu | kayit → **Emircan Karaoğlu — Aşı Karnesi** (16 kayıt) \| Aşı \| Tarih \| Doz \| Yaş \| \| --- \| --- \| --- \| --- \| \| Hepatit B \| 30.08.2024 \| 1. doz \| doğumda \| \| Hepati… |
| G-17 | chat | şu anda toplam kaç hastam var | arama → Kayıtlarda 0 hasta. | içermeli: Kayıtlarda 5 hasta | arama → Kayıtlarda 5 hasta: Emircan Karaoğlu, Nermin Aydoğan, Ayşe Bozkurt, Tarık Özdemir, Olcay Santoro. |
| G-20 | chat | 1 yaşından büyük hastalarım kimler | arama → Kayıtlarda 0 hasta. Filtre: 1 yaşından büyük. | içermeli: \b4 hasta | arama → Kayıtlarda 4 hasta. Filtre: 1 yaşından büyük: 1. Emircan Karaoğlu (d.t. 30.08.2024) — 1 yaşından büyük · 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene · 30.08.2026… |
| G-34 | chat | Ayşe'nin son aşı tarihi ne | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. | hasta — ≠ Ayşe Bozkurt; içermeli: kayıt; içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | hizli-kart → Ayşe Bozkurt — dosyada aşı: kayıtlı aşı yok. |
| G-37 | chat | Ayşe'nin reçete geçmişini göster | arama → Kayıtlarda 0 reçete (0 hasta). Filtre: İlaç. | hasta — ≠ Ayşe Bozkurt; içermeli: Klacid\|klaritromisin; içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Ayşe Bozkurt’un dosyasında 24 Eylül 2026 tarihli reçete kaydı var: Klacid 250 mg/5 ml süspansiyon, 5 ml sabah-akşam 10 gün; Calpol süspansiyon, 7,5 ml ateşte 6 saatte bir… |
| G-39 | chat | bugün kaç hastam geliyor | arama → Bugün 0 hasta. Filtre: bugün. | içermeli: \b1\b\|Nermin; içermemeli: \b0 hasta | takvim → 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| Y-062 | chat | Toplam kaç kez geldi? *(after: Daha önce aynı şikayetle geldi mi? → Gelişimi yaşına uygun mu?)* | arama → Kayıtlarda 2 hasta. Filtre: Gelme nedeni.: 1. Emircan Karaoğlu (d.t. 30.08.2024) — Gelme nedeni · 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene · 30.08.2026 muayen… | hasta — ≠ Emircan Karaoğlu; içermeli: \b15\b\|on beş; içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Emircan Karaoğlu’nun toplam vizit sayısı: 15 — 4 Eylül 2024 – 30 Eylül 2026. |
| Y-072 | chat | Bugün kimler geliyor? *(after: Bugün kaç hastam var?)* | arama → Bugün 0 hasta. Filtre: bugün. | içermeli: Nermin | takvim → 2 Ekim 2026 Cuma takviminde 1 randevu: 16:00–16:20 Nermin Aydoğan (kontrol). |
| Y-076 | chat | dün kim geldi *(after: peki cuma? → haftaya nasıl görünüyor)* | arama → Dün 0 hasta. Filtre: dün · Gelme nedeni. | içermeli: Tarık | takvim → 1 Ekim 2026 Perşembe takviminde 1 randevu: 11:30–11:50 Tarık Özdemir (muayene). |
| Y-085 | chat | En son hangi hastayı gördüm? *(after: kaç tane hasta kaydım var toplam → bu hafta kaç hasta muayene ettim)* | arama → Kayıtlarda 0 hasta. | içermeli: Tarık | arama → Son gördüğünüz hasta: Tarık Özdemir. |
| Y-087 | chat | Hastalarımı listele *(after: En son hangi hastayı gördüm? → Son kaydettiğim hasta kim?)* | arama → Kayıtlarda 0 hasta. | içermeli: Ayşe Bozkurt; içermeli: Tarık; içermeli: Emircan; içermeli: Olcay; içermeli: Nermin | arama → Kayıtlarda 5 hasta: 1. Emircan Karaoğlu (d.t. 30.08.2024) — 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene · 30.08.2026 muayene · 30.04.2026 muayene. 2. Nermin Aydo… |
| Y-088 | chat | Aşısı eksik olan hastalarım kimler? *(after: Son kaydettiğim hasta kim? → Hastalarımı listele)* | arama → Kayıtlarda 0 hasta. | içermeli: Emircan | arama → Kayıtlarda 1 hasta. Ayrıca 2 hastada aşı kaydı hiç yok (eksik sayılmadı): Ayşe Bozkurt, Tarık Özdemir: 1. Emircan Karaoğlu — Aşı: Hep A 2. doz (30.08.2026) · D vitamini p… |
| Y-095 | chat | Son reçetem hangi hastaya? *(after: Gelen belgelerde bekleyen var mı? → Bugün kaç reçete yazdım?)* | arama → Kayıtlarda 0 reçete (0 hasta). | içermeli: Tarık | hizli-kart → Tarık Özdemir — dosyada son reçete: Amoksisilin 250 mg/5 ml süspansiyon (1 Ekim 2026). |
| Y-099 | chat | Mehmet Yılmaz kaç yaşında? *(after: QA Test Hasta 2 dosyasını aç → Selim Erkoç'un dosyasını aç)* | arama → Kayıtlarda 0 hasta. | içermeli: bulamadım\|bulunamadı\|kayıtlarınızda yok\|kayıtlı değil\|adını | model → Mehmet Yılmaz adında bir hasta kayıtlarınızda bulamadım Hocam; adını ve soyadını tam söyler misiniz? |
| T-013 | chat | kimler? *(after: Bugün kaç hastam var? → peki yarın?)* | arama → Kayıtlarda 0 hasta. | içermeli: {YARIN}; içermemeli: Kayıtlarda \d+ hasta | takvim → 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-021 | chat | dün kim geldi | arama → Dün 0 hasta. Filtre: dün · Gelme nedeni. | içermeli: {DUN} | takvim → 1 Ekim 2026 Perşembe takviminde 1 randevu: 11:30–11:50 Tarık Özdemir (muayene). |
| T-023 | chat | ya yarın kimler? *(after: dün kim geldi → peki bugün?)* | arama → Kayıtlarda 0 hasta. | içermeli: {YARIN} | takvim → 3 Ekim 2026 Cumartesi takviminde 1 randevu: 10:00–10:20 Ayşe Bozkurt (kontrol). |
| T-074 | chat | kimler? *(after: peki yarın? → peki haftaya?)* | arama → Kayıtlarda 0 hasta. | içermeli: {HAFTAYA_PZT} | takvim → Haftaya (5 Ekim – 11 Ekim) haftası takviminde 1 randevu. 9 Ekim Cuma: 10:30–10:50 Emircan Karaoğlu (kontrol). |
| E-01 | chat | Fıstık alerjisini ekle | hizli-kart → Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). | rota hizli-kart (olmamalı); araç alerji_ekle çağrılmadı; kart alerji_ekle yok | model → Deniz Aksoy için Alerji ekle hazırladım. Alerji: Fıstık. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-02 | chat | Yumurta alerjisi var, dosyaya işle | hizli-kart → Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). | rota hizli-kart (olmamalı); araç alerji_ekle çağrılmadı; kart alerji_ekle yok | model → Deniz Aksoy için Alerji ekle hazırladım. Alerji: Yumurta. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-03 | chat | Penisilin alerjisini kaldır | hizli-kart → Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). | rota hizli-kart (olmamalı); araç alerji_kaldir çağrılmadı; kart alerji_kaldir yok | model → Deniz Aksoy için Alerjiyi kaldır hazırladım. Alerji: Penisilin. "Penisilin" dosyada alerji olarak kayıtlı değil (kayıtlı: yok). Kart ekranda. Henüz dosyaya yazılmadı. Ona… |
| E-04 | chat | Astım tanısını kronik hastalıklara ekle | hizli-kart → Deniz Aksoy — dosyada kronik hastalık: kayıt yok. | rota hizli-kart (olmamalı); araç kronik_hastalik_ekle çağrılmadı; kart kronik_hastalik_ekle yok | model → Deniz Aksoy için Kronik hastalık ekle hazırladım. Kronik hastalık: Astım. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-05 | chat | Kronik hastalıklarına epilepsi ekleyelim | hizli-kart → Deniz Aksoy — dosyada kronik hastalık: kayıt yok. | rota hizli-kart (olmamalı); araç kronik_hastalik_ekle çağrılmadı; kart kronik_hastalik_ekle yok | model → Deniz Aksoy için Kronik hastalık ekle hazırladım. Kronik hastalık: Epilepsi. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-06 | chat | Kilosunu 24,8 kilo olarak ekle | hizli-kart → Deniz Aksoy — dosyada son ölçüm: kilo 24.6 kg (12 Eylül 2026). | rota hizli-kart (olmamalı); araç olcum_ekle çağrılmadı; kart olcum_ekle yok | model → Deniz Aksoy için Ölçüm ekle hazırladım. Kilo: 24.8. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-17 | chat | Şunu not düş: kontrolde EEG istenecek | hizli-kart → Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek. 10 gün sonra kontr… | rota hizli-kart (olmamalı); araç dosya_notu_ekle çağrılmadı; kart dosya_notu_ekle yok | model → Deniz Aksoy için Dosya notu hazırladım. Not: Kontrolde EEG istenecek.. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-21 | chat | Yarın saat 14:00 için kontrol randevusu oluştur | hizli-kart → Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek. 10 gün sonra kontr… | rota hizli-kart (olmamalı); araç kontrol_randevusu_olustur çağrılmadı; kart kontrol_randevusu_olustur yok | model → Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: yarın, 3 Ekim 2026 Cumartesi. Saat: 14:00. Tür: kontrol. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-22 | chat | Haftaya salı 10:30 kontrol randevusu ver | hizli-kart → Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek. 10 gün sonra kontr… | rota hizli-kart (olmamalı); araç kontrol_randevusu_olustur çağrılmadı; kart kontrol_randevusu_olustur yok | model → Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: 6 Ekim 2026 Salı. Saat: 10:30. Tür: kontrol. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-26 | chat | Deniz Aksoy'un fıstık alerjisini ekle | hizli-kart → Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). | rota hizli-kart (olmamalı); araç alerji_ekle çağrılmadı; kart alerji_ekle yok | model → Deniz Aksoy için Alerji ekle hazırladım. Alerji: Fıstık. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| E-27 | chat | Deniz Aksoy için yarın 11:00'e kontrol randevusu oluştur | hizli-kart → Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek. 10 gün sonra kontr… | rota hizli-kart (olmamalı); araç kontrol_randevusu_olustur çağrılmadı; kart kontrol_randevusu_olustur yok | model → Deniz Aksoy için Kontrol randevusu hazırladım. Tarih: yarın, 3 Ekim 2026 Cumartesi. Saat: 11:00. Tür: kontrol. Kart ekranda. Henüz dosyaya yazılmadı. Onaylıyor musunuz? |
| R-OLCUM-METIN | chat | 15 aylık muayenesinde kilosu kaçtı? | hizli-kart → Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | rota hizli-kart (olmamalı); içermeli: 10,6 kg; içermemeli: 12,8 | kayit → Emircan Karaoğlu — 15 aylık muayene (30.11.2025): kilo 10,6 kg. Kaynak: muayene notunun metni (Bulgu: "Kilo 10,6 kg"). |
| R-COUNT-ACIK-1 | chat | En çok hangi şikayetle geldi | arama → Son 30 gün en çok görülen şikayet Sol kulak ağrısı ve ateş, 2 gündür (3). Sıra: Sol kulak ağrısı ve ateş, 2 gündür 3, Kontrol 1, Öksürük ve ateş, 4 gündür 1 (toplam 5). | rota arama (olmamalı); hasta — ≠ Emircan Karaoğlu | model → Emircan Karaoğlu — son 15 muayene: 8 muayene (dosyada toplam 15 onaylı muayene; bugün 02.10.2026). KESİLDİ: 15 muayeneden 8 tanesi gösterildi (bir çağrıda en çok 8 muayen… |
| R-SAYIM-1 | chat | Randevu saatini değiştirmek istiyorum | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · Randevu. | rota arama (olmamalı); içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Hangi hasta için Hocam, yeni saat kaç olsun? |
| R-SAYIM-2 | chat | Aşı karnesini tablo olarak göster | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. | rota arama (olmamalı); içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Aşı karnesini tablo olarak gösterebilmem için hastanın adını ve soyadını söyler misiniz Hocam? |
| R-SAYIM-3 | chat | İlaç etkileşimi var mı kontrol et | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. | rota arama (olmamalı); içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Elbette Hocam. Etkileşimi kontrol etmem için birlikte kullanılan ilaçların adlarını ve dozlarını yazar mısınız? |
| R-SAYIM-5 | chat | Otitte ilk seçenek tedavi nedir | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · Plan. | rota arama (olmamalı); içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Akut otitis media için ilk seçenek, **antibiyotik gerekiyorsa amoksisilindir**; genellikle [doz hekim tarafından belirlenir], iki doza bölünerek verilir. Ağrı kontrolü (p… |
| R-SAYIM-6 | chat | Ateşli çocukta parasetamol dozu nedir | arama → Kayıtlarda 0 hasta. | rota arama (olmamalı); içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Parasetamol **[doz hekim tarafından belirlenir]**, ağızdan **4–6 saatte bir** verilebilir; toplamda **[doz hekim tarafından belirlenir]** aşılmamalı. Şurup miktarı ürünün… |
| R-SAYIM-7 | chat | Tanı koymama yardım eder misin | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · Tanı. | rota arama (olmamalı); içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Elbette Hocam. Hastanın yaşını, başvuru yakınmasını ve süresini; eşlik eden bulguları, muayene bulgularını ve varsa tetkikleri paylaşın. Birlikte olası tanıları değerlend… |
| R-SAYIM-8 | chat | Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. | rota arama (olmamalı); içermemeli: Kayıtlarda \d+ hasta\|\b0 hasta\|Filtre: | model → Hangi hastanın annesine yazalım Hocam? Adını ve soyadını, ayrıca iletmemi istediğiniz ilacın kullanım şeklini paylaşır mısınız? |

## 4. Today's other failures on chat and panel

### FAIL at the checkpoint and FAIL today — never worked (5 turn(s))

| id | surface | sentence | checkpoint: route → answer | today: route → answer | why it fails today |
|---|---|---|---|---|---|
| G-21 | chat | aşı kaydı olan hastalarım kimler | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. | arama → Kayıtlarda 0 hasta. Filtre: Aşı. | içermeli: Emircan; içermemeli: \b0 hasta |
| G-22 | chat | ilaç kullanan hastam var mı | arama → Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. | arama → Kayıtlarda 0 hasta. Filtre: İlaç. | içermeli: Emircan\|Nermin\|Ayşe\|Tarık; içermemeli: \b0 hasta |
| G-24 | chat | doğum tarihi kayıtlı olmayan hastam var mı | kimlik → Hangi hastanın bilgisini istiyorsunuz? Adını yazar mısınız? | kimlik → Hangi hastanın bilgisini istiyorsunuz? Adını yazar mısınız? | rota kimlik ≠ arama; içermeli: Olcay |
| Y-083 | chat | kaç tane hasta kaydım var toplam *(after: Olcay Santoro ne zaman gelecek? → Kaç hastam var?)* | arama → Kayıtlarda 0 hasta. | model → Toplam 5 hasta kaydınız var Hocam. | rota model ≠ arama |
| Y-091 | chat | dün gelen ateşli çocuk *(after: Bu hafta tanı koyduğum pnömoni vakası kimdi? → kulak iltihabı olan çocuk kimdi)* | hizli-kart → Olcay Santoro — dosyada son ölçüm: kayıt yok. | hizli-kart → Olcay Santoro — dosyada son ölçüm: kayıt yok. | içermeli: Tarık |

### FAIL today, NOT JUDGED at the checkpoint — the live pass decides whether these are regressions (9 turn(s))

| id | surface | sentence | checkpoint route | today: route → answer | why it fails today |
|---|---|---|---|---|---|
| L-DANIS-BOYU | chat | peki boyu? *(after: bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu)* | model | kayit → Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam (son muayene). | içermeli: \b76 cm |
| L-DANIS-SERI-2 | panel | bütün muayenelerinde kilosu | panel | panel → Hocam, kayıtlı kilo ölçümleri: - 04.09.2024: 3,2 kg [muayene alanı] - 30.09.2024: 4,3 kg [muayene alanı] - 30.10.2024: 5,4 kg [muayene alanı] - 30.12.2024: 6,9 kg [muayen… | ekranda tablo yok |
| Y-023 | chat | bu hastanın annesinin boyu kaç *(after: Son ölçümleri neler? → hastamızın ateşi kaçtı son muayenede)* | model | kayit → Ayşe Bozkurt — son boy 110 cm (24.09.2026). | içermeli: 168 |
| T-042 | chat | boyu? *(after: Emircan Karaoğlu kaç kilo?)* | model | kayit → Emircan Karaoğlu için kayıtlı boy ölçümü yok Hocam (son muayene). | içermeli: \d cm |
| T-044 | chat | baş çevresi? *(after: boyu? → persentili?)* | model | kayit → Emircan Karaoğlu için kayıtlı baş çevresi ölçümü yok Hocam (son muayene). | içermeli: \d cm |
| I-01 | panel | Bu hastayı bana kısaca özetler misin? | panel | panel → Hocam, hasta 30 Ağustos 2024 doğumlu erkek çocuk; dosyada 15 vizit kaydı var (4 Eylül 2024–30 Eylül 2026). Sağlam çocuk izlemlerinde gelişimi yaşına uygun kaydedilmiş. Be… | içermeli: Emircan |
| I-03 | panel | Büyümesi nasıl gidiyor? | panel | panel → Hocam, kayıtlı ölçümler genel olarak artış gösteriyor: 30 Mayıs 2025’te 8,9 kg ve 72 cm; 30 Ağustos 2025’te 9,8 kg, 76 cm ve baş çevresi 46,4 cm; 28 Şubat 2026’da 11,3 kg… | içermeli: 87[.,]5 |
| I-04 | chat | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | model | model → Emircan Karaoğlu’nun aşıları yaşına göre tam görünmüyor; Hepatit A 2. dozu zamanı geçmiş ve aşı tablosunda uygulama kaydı yok. **Dayanak:** - Emircan Karaoğlu, 30.08.2024… | içermemeli: Hepatit A 2\. doz[^.\n]*uyguland |
| E-33 | chat | Ventolini ne zaman kestik | model | model → Deniz Aksoy için Ventolin’in kesildiğine dair bir kayıt yok; ilaç kaydında hâlâ aktif görünüyor Hocam. | araç çağrıldı: muayene_ara |

### FAIL today on a capability that is NEW since the checkpoint (0 turn(s))

None.

## 5. What is worth fixing first (today's build)

Ranked by: (1) a regression — it worked at the checkpoint and fails today; (2) number of failing turns today on chat and panel; (3) failing voice turns as a tie-breaker. A cluster is one cause, so one fix.

| # | what | entries | failing today (chat+panel / voice) | those turns at the checkpoint | code path | note |
|---|---|---|---|---|---|---|
| 1 | **REGRESSION** — A named patient's appointment question after a calendar turn gets a day list | Y-080, T-025 | 2 / 2 | 2 PASS | `lib/asistan/konusmaBaglami.ts (takipCoz) + calendar branch of lib/asistan/ayseCevapla.ts` | When the sentence names a patient, the calendar follow-up must not take it: answer from that chart's appointments (what the quick card did at the checkpoint). Fails on voice too. |
| 2 | **REGRESSION** — "Son ölçümleri" lost the fever and blood pressure of the last visit | Y-021 | 1 / 1 | 1 PASS | `record-table branch of lib/asistan/ayseCevapla.ts (sade("kayit"))` | The anthropometry table answers a question about the LAST measurements. Either keep the vitals of the last visit next to the table or leave "son ölçümleri" to the quick card. Fails on voice too. |
| 3 | Measurement follow-ups read only the last visit ("kayıtlı boy ölçümü yok") | L-DANIS-BOYU, T-042, T-044 | 3 / 3 | 3 not judged | `record-table branch of lib/asistan/ayseCevapla.ts (single-measurement answer)` | The chart has height and head circumference in earlier visits; the single-value answer looks at the last visit only and says none is recorded. At the checkpoint these went to the model: the live pass says whether it answered them. |
| 4 | Patient-file panel: summary without the name, growth without the last height, series without a table | L-DANIS-SERI-2, I-01, I-03 | 3 / 0 | 3 not judged | `app/api/doktor/konsult/route.ts` | Model-written at both commits; the checkpoint panel prompt forbids the patient's name outright, so I-01 could not pass there either. Needs the live pass for I-03 and the series. |
| 5 | Cohort filters "aşı kaydı olan / ilaç kullanan hastalarım" return 0 | G-21, G-22 | 2 / 2 | 2 FAIL | `lib/doktor/hastaDosyaAra.ts (klinikAramaYurut)` | Failed at the checkpoint too (then with a silent 90-day window, now without it): never worked. Ledger: NOTYA-ARAMA-PENCERE-VARSAYILAN-01. |
| 6 | "Annesinin boyu" answered with the child's height | Y-023 | 1 / 1 | 1 not judged | `record-table branch of lib/asistan/ayseCevapla.ts (measurement matcher)` | The word "boy" is enough for the measurement route; a parent's height is an intake-form field. Fails on voice too. |
| 7 | "Doğum tarihi kayıtlı olmayan hastam var mı" is taken as an identity question | G-24 | 1 / 1 | 1 FAIL | `lib/doktor/kimlikSorusu.ts (kimlikSorusu classifier)` | Same answer at the checkpoint ("Hangi hastanın bilgisini istiyorsunuz?"): never worked. |
| 8 | "dün gelen ateşli çocuk" answered from the open chart's quick card | Y-091 | 1 / 1 | 1 FAIL | `lib/asistan/ayseCevapla.ts (quick card before the cohort search)` | Identical wrong answer at the checkpoint: never worked. |
| 9 | A question ("Ventolini ne zaman kestik") makes the model call a read tool | E-33 | 1 / 1 | 1 not judged | `lib/asistan/ayseCevapla.ts (read tools offered on every turn)` | The read tools did not exist at the checkpoint. The answer itself is right; the corpus expects no tool call on a question. Fails on voice too. |
| 10 | "kaç tane hasta kaydım var toplam" reaches the model instead of the count template | Y-083 | 1 / 1 | 1 FAIL | `lib/doktor/hastaCozumleyici.ts (count matcher)` | Today the model answers 5, which is right; only the route differs from the expectation. At the checkpoint the template answered "Kayıtlarda 0 hasta". Lowest priority. |
| 11 | İlk-10 vaccine answer: assertion false positive, not a product defect | I-04 | 1 / 0 | 1 not judged | `lib/asistan/tests/gokhanSikayetKorpusu.ts (I-04 pattern)` | Today's answer is right: "Hepatit A 2. dozu planlanmış; uygulandığına dair kayıt bulamadım". The pattern `Hepatit A 2\. doz[^.\n]*uyguland` matches that negated sentence. Fix the pattern, not the product. |

Voice-only failures today outside the clusters (6; no checkpoint counterpart): L-ODAK-HITAP-1, G-28, Y-006, Y-063, Y-096, R-KAPSAM06-7.

## 6. NEW since the checkpoint (77 chat + panel turn(s))

| capability that did not exist | turns | today PASS / FAIL / MANUAL | what the old build did with these sentences (route: turns) | entries |
|---|---|---|---|---|
| route takvim did not exist: the model-free calendar handler (day / week summary, free slots) | 40 | 40 / 0 / 0 | model: 32, arama: 7, hizli-kart: 1 | C-2, C-3, C-4, C-5, C-6, L-SES-TUR-BIRLESIK, L-GERI-03-BOS, G-38, G-K9, Y-073, Y-074, Y-075, Y-077, Y-078, Y-079, T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008, T-009, T-010, T-014, T-015, T-016, T-017, T-018, T-019, T-020, T-024, T-093, T-094, T-095, T-099, T-101, R-TAKVIM-BOS, R-TAKVIM-KIM |
| route kayit did not exist: the model-free record tables (vaccines, measurements, exams) from stored rows | 13 | 13 / 0 / 0 | model: 5, hizli-kart: 7, arama: 1 | L-DANIS-SERI-1, L-DANIS-TANSIYON-SERI, R-ASI-1, R-ASI-2, R-ASI-3, R-ASI-4, R-OLCUM-1, R-OLCUM-2, R-OLCUM-3, R-OLCUM-4, R-OLCUM-5, R-MUAYENE-1, R-MUAYENE-2 |
| the fixed out-of-scope refusal did not exist | 11 | 11 / 0 / 0 | hizli-kart: 1, arama: 3, model: 7 | L-PLAN-01, L-KAPSAM-05, L-KAPSAM-06B, G-K1, G-K2, G-K3, G-K4, G-K5A, G-K5B, G-K6, R-KAPSAM |
| route dosya-ac did not exist: the model-free "open the chart" handler and its fixed sentences | 6 | 6 / 0 / 0 | model: 6 | L-1TO1-AC, G-01, G-05, G-06, Y-001, Y-025 |
| expects the server-written safety line on a medication card (NOTYA-AYSE-GUVENLIK-01) | 2 | 2 / 0 / 0 | model: 2 | E-10, E-15 |
| the action randevu_tasi did not exist in the registry | 2 | 2 / 0 / 0 | hizli-kart: 2 | E-23, E-24 |
| expects the fixed "no such patient" sentence of the chart-open handler | 1 | 1 / 0 / 0 | model: 1 | L-1TO1-YOK |
| the stored conversation-context record (and its expiry) did not exist | 1 | 1 / 0 / 0 | arama: 1 | T-089 |
| the action randevu_iptal did not exist in the registry | 1 | 1 / 0 / 0 | hizli-kart: 1 | E-25 |

## 7. Every chat and panel turn

| id | surface | sentence | checkpoint | route | answer at the checkpoint | today | route |
|---|---|---|---|---|---|---|---|
| L-SAYIM-ANDA | chat | Hocam benim şu anda toplam kaç hastam var? | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | arama |
| L-1TO1-YAS | chat | hastamız kaç yaşında | PASS | hizli-kart | Emircan Karaoğlu — dosyada yaş: 2 yaşında. | PASS | hizli-kart |
| L-1TO1-AC | chat | Emircan Karaoğlu'nun dosyasını aç | NEW | model | Vekil yanıt Hocam. | PASS | dosya-ac |
| L-1TO1-YOK | chat | Kemal Sarıtaş'ın dosyasını aç | NEW | model | Vekil yanıt Hocam. | PASS | arama |
| C-2 | chat | Bugün hiçbir randevumuz var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| C-3 | chat | Peki yanım var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| C-4 | chat | Bugün randevum var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| C-5 | chat | Peki xqzt var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| C-6 | chat | Yarın randevo var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| L-SES-TUR-BIRLESIK | chat | İyiyim teşekkür ederim. Bugün randevumuz var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| L-HASTA-01 | chat | Emircan Karaoğlu'na hiç antibiyotik vermiş miyim ve verdiysem hangisini vermişim. | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-KIMLIK-ANNE | chat | Annesinin adı ne? | PASS | kimlik | Emircan Karaoğlu — Anne adı: Elif (Hasta Bilgi Formu) | PASS | kimlik |
| L-KIMLIK-BABA | chat | Babasının adı ne? | PASS | kimlik | Emircan Karaoğlu — Baba adı: Serdar (Hasta Bilgi Formu) | PASS | kimlik |
| L-KIMLIK-ANNETEL | chat | Annesinin telefonu ne? | PASS | kimlik | Emircan Karaoğlu — Annesinin telefonu: 0532 000 11 22 — Elif Karaoğlu (Hasta Bilgi Formu, veli) | PASS | kimlik |
| L-KIMLIK-VELI | chat | Velisi kim? | PASS | kimlik | Emircan Karaoğlu — Veli / yasal temsilci: Elif Karaoğlu (anne) — 0532 000 11 22 (Hasta Bilgi Formu) | PASS | kimlik |
| L-KIMLIK-DOGUMYERI | chat | Doğum yeri neresi? | PASS | kimlik | Emircan Karaoğlu — Doğum yeri: İzmir (Hasta Bilgi Formu) | PASS | kimlik |
| L-KIMLIK-ADRES | chat | Adresi ne? | PASS | kimlik | Emircan Karaoğlu — Adres: QA Mahallesi 1. Sokak No: 1, İzmir (Hasta Bilgi Formu) | PASS | kimlik |
| L-KIMLIK-EPOSTA | chat | E-posta adresi ne? | PASS | kimlik | Emircan Karaoğlu — E-posta: qa-veli@example.test (Hasta Bilgi Formu) | PASS | kimlik |
| L-KIMLIK-DT | chat | Emircan Karaoğlu'nun doğum tarihini verir misin? | PASS | kimlik | Emircan Karaoğlu — Doğum tarihi: 30.08.2024 (hasta kartı) | PASS | kimlik |
| L-KIMLIK-DT-ASR | chat | Emircan Kara oğlunun doğum tarihini verir misin? | PASS | kimlik | Emircan Karaoğlu — Doğum tarihi: 30.08.2024 (hasta kartı) | PASS | kimlik |
| L-SES-HASTA-01 | chat | Ayşe Bozkurt'un son muayenesinin özetini verir misin? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-SES-HASTA-01-ASR | chat | Ayşe Bozkurtun son muayenesinin özetini verir misin? | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | model |
| L-SES-HASTA-01-KOHORT | chat | Merhaba Ayşe, bu hafta ateşli hastalarım kimler | PASS | arama | Bu hafta 0 hasta. Filtre: bu hafta. | PASS | arama |
| L-AKTIF-SON | chat | En son ne zaman geldi? | PASS | hizli-kart | Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. Dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. | PASS | hizli-kart |
| L-AKTIF-SON | panel | En son ne zaman geldi? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| L-AKTIF-TANSIYON | chat | Tansiyon takibini nasıl planlarsın? | PASS | hizli-kart | Nermin Aydoğan — dosyada plan ve takip: Mevcut tedavi devam. 3 ay sonra HbA1c ve lipid paneli ile kontrol.. Dosyada son ölçüm: Tansiyon: 132/84 mmHg ·… | PASS | hizli-kart |
| L-AKTIF-TANSIYON | panel | Tansiyon takibini nasıl planlarsın? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| L-DOLGU-01 | chat | Emircan, eee, Karaoğlu'nun dosyasına bak... şu anda kaç yaşında Emircan? | PASS | hizli-kart | Emircan Karaoğlu — dosyada yaş: 2 yaşında. | PASS | dosya-ac |
| L-DOLGU-KILO | chat | Peki Ayşe, Emircan Karaoğlu kaç kilo? | PASS | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | hizli-kart |
| L-DOLGU-HANE | chat | Eee, merhaba Ayşe Hocam. Bana, eee, Emirhan Karaoğlu'nun hanesini gösterir misin | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-ODAK-01 | chat | Biraz koy. Ayşe, benim spesifik, eee, arzum şeydi, aşı karnesini göstermendi. | not judged | model | Vekil yanıt Hocam. | PASS | kayit |
| L-ODAK-HITAP-1 | chat | Ayşe, aşı karnesini gösterir misin? | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. | PASS | model |
| L-ODAK-HITAP-2 | chat | Ayşe Hanım otitte ilk seçenek ne? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-ODAK-HITAP-3 | chat | Merhaba Ayşe, nasılsın? | PASS | model | Vekil yanıt Hocam. | PASS | model |
| L-ODAK-HITAP-4 | chat | Teşekkürler Ayşe | PASS | model | Vekil yanıt Hocam. | PASS | model |
| L-DOLGU-02 | chat | Merhaba hocam bugün nasınsınız iyi misiniz? | PASS | model | Vekil yanıt Hocam. | PASS | model |
| L-SAYFA-KILO | chat | kaç kilo | PASS | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | hizli-kart |
| L-SAYFA-BUYUME | chat | Büyümesi nasıl gidiyor? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-ERKEN-01 | chat | Emircan Karaoğlu'nun dosyasını kısaca özetler misin | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-PLAN-01 | chat | Bir tane Tesla elektrikli araba almayı planlıyorum. | NEW | hizli-kart | Emircan Karaoğlu — dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. | PASS | kapsam |
| L-TUR-6AY | chat | Emircan Karaoğlu'nun 6 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-TUR-6AY | panel | Emircan Karaoğlu'nun 6 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| L-TUR-12AY | chat | Emircan Karaoğlu'nun 12 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-TUR-15AY | chat | Emircan Karaoğlu'nun 15 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-TUR-18AY | chat | Emircan Karaoğlu'nun 18 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-TUR-24AY | chat | Emircan Karaoğlu'nun 24 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-GECMIS | chat | Bu hastanın geçmişini özetler misin? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| L-GECMIS | panel | Bu hastanın geçmişini özetler misin? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| L-KAPSAM-05 | chat | Bugün İstanbul'da hava yağışlı mı? | NEW | arama | Bugün 0 hasta. Filtre: bugün · Şehir. | PASS | kapsam |
| L-KAPSAM-05C | chat | Bugün kaç hastam var? | PASS | arama | Bugün 1 hasta. Filtre: bugün.: 1. Nermin Aydoğan (d.t. 23.08.1980) — bugün · 46 yaş 1 ay · 02.10.2026 randevu · hasta formunda geçiyor. Hangisini isti… | PASS | takvim |
| L-KAPSAM-06B | chat | Yarın yağmur yağacak mı | NEW | model | Vekil yanıt Hocam. | PASS | kapsam |
| L-EYLEM-HEPB | chat | Doğum epikrizindeki Hepatit B dozunu kaydet | not judged | model |  | PASS | model |
| L-EYLEM-HEPB | panel | Doğum epikrizindeki Hepatit B dozunu kaydet | not judged | panel |  | PASS | panel |
| L-GERI-03-BOS | chat | Yarın hangi saatler boş? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| L-GERI-03-YABANCI | chat | Ali Yılmaz için randevu oluştur | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · Randevu. | PASS | model |
| L-DANIS-12AY | chat | bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu | **FAIL** | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | kayit |
| L-DANIS-BOYU | chat | peki boyu? | not judged | model | Vekil yanıt Hocam. | **FAIL** | kayit |
| L-DANIS-12AY | panel | bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| L-DANIS-BOYU | panel | peki boyu? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| L-DANIS-15AY | chat | 15 aylıkken kaç kiloydu | **FAIL** | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | kayit |
| L-DANIS-15AY | panel | 15 aylıkken kaç kiloydu | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| L-DANIS-6AY | chat | 6 aylık kontrolde boyu kaçtı | **FAIL** | hizli-kart | Emircan Karaoğlu — dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. | PASS | kayit |
| L-DANIS-6AY | panel | 6 aylık kontrolde boyu kaçtı | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| L-DANIS-NORMAL | chat | 12 aylık muayenesinde kilosu normal miydi? | **FAIL** | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | model |
| L-DANIS-SERI-1 | chat | kilo gelişimi | NEW | model | Vekil yanıt Hocam. | PASS | kayit |
| L-DANIS-SERI-2 | chat | bütün muayenelerinde kilosu | **FAIL** | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | kayit |
| L-DANIS-SERI-2 | panel | bütün muayenelerinde kilosu | not judged | panel | {"speech":"Vekil yanıt Hocam."} | **FAIL** | panel |
| L-DANIS-TANSIYON | chat | son muayenede tansiyonu kaçtı | PASS | hizli-kart | Nermin Aydoğan — dosyada son vizit: 18 Eylül 2026 — Kontrol. Dosyada son ölçüm: Tansiyon: 132/84 mmHg · Nabız: 76/dk · Kilo: 75,5 kg. | PASS | kayit |
| L-DANIS-TANSIYON | panel | son muayenede tansiyonu kaçtı | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| L-DANIS-TANSIYON-SERI | chat | tansiyon seyri | NEW | hizli-kart | Nermin Aydoğan — dosyada son ölçüm: Tansiyon: 132/84 mmHg · Nabız: 76/dk · Kilo: 75,5 kg. | PASS | kayit |
| L-DANIS-ILK | chat | ilk muayenede kaç kiloydu | **FAIL** | hizli-kart | Nermin Aydoğan — dosyada son ölçüm: Tansiyon: 132/84 mmHg · Nabız: 76/dk · Kilo: 75,5 kg. | PASS | kayit |
| L-DANIS-SON | chat | son muayenede kaç kiloydu | PASS | hizli-kart | Nermin Aydoğan — dosyada son vizit: 18 Eylül 2026 — Kontrol. Dosyada son ölçüm: Tansiyon: 132/84 mmHg · Nabız: 76/dk · Kilo: 75,5 kg. | PASS | kayit |
| L-DANIS-GECEN-YIL | chat | geçen yıl kaç kiloydu | MANUAL | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | MANUAL | hizli-kart |
| L-KOHORT-01 | chat | Son bir ay içinde hangi antibiyotiği en fazla yazdım? | **FAIL** | model | Vekil yanıt Hocam. | PASS | arama |
| L-KOHORT-02 | chat | Son bir ayda kaç hastaya antibiyotik yazdım? | PASS | arama | Son 1 ay en çok yazdığın antibiyotik Amoksisilin 250 mg/5 ml süspansiyon (1 reçete). Sıra: Amoksisilin 250 mg/5 ml süspansiyon 1, Augmentin ES 600 mg/… | PASS | arama |
| L-KOHORT-03 | chat | Bu hafta en fazla hangi tanıyı koydum? | **FAIL** | model | Vekil yanıt Hocam. | PASS | arama |
| L-KOHORT-04 | chat | Bu hastaya en fazla hangi antibiyotiği yazdım? | PASS | hizli-kart | Emircan Karaoğlu — dosyada son reçete: Augmentin ES 600 mg/5 ml süspansiyon, Pedifen şurup (20 Eylül 2026). | PASS | hizli-kart |
| G-01 | chat | Emircan'ın dosyasını aç | NEW | model | Vekil yanıt Hocam. | PASS | dosya-ac |
| G-02 | chat | Emircanın dosyası | **FAIL** | model | Vekil yanıt Hocam. | PASS | model |
| G-03 | chat | Karaoğlu'nun aşıları ne durumda | PASS | hizli-kart | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömoko… | PASS | hizli-kart |
| G-04 | chat | Karaoğlunun aşıları | **FAIL** | model | Vekil yanıt Hocam. | PASS | kayit |
| G-05 | chat | Bozkurt'un dosyasını getir | NEW | model | Vekil yanıt Hocam. | PASS | dosya-ac |
| G-06 | chat | bozkurtun dosyasını getir | NEW | model | Vekil yanıt Hocam. | PASS | dosya-ac |
| G-07 | chat | Tarık Özdemir'i açar mısın | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-08 | chat | Özdemir'in son kontrolü ne zamandı | PASS | hizli-kart | Tarık Özdemir — dosyada plan ve takip: Amoksisilin 6 ml 12 saatte bir, 7 gün. İbuprofen ağrıda. 48-72 saat içinde düzelmezse kontrol.. | PASS | hizli-kart |
| G-09 | chat | Olcay'ın kaydı var mı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-10 | chat | Santoro diye bir hastam var mıydı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-11 | chat | Emircn Karaoglu dosyasini ac | not judged | model | Vekil yanıt Hocam. | PASS | dosya-ac |
| G-12 | chat | Emirçan Kara oğlu hastasını bul | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-13 | chat | Olcay Santor diye hasta var mı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-14 | chat | Ayşe hastamı bul | MANUAL | model | Vekil yanıt Hocam. | MANUAL | model |
| G-15 | chat | hastamın dosyasını aç | not judged | model | Vekil yanıt Hocam. | PASS | arama |
| G-16 | chat | Taırk Özdemir'in aşı karnesini göster | not judged | model | Vekil yanıt Hocam. | PASS | kayit |
| G-17 | chat | şu anda toplam kaç hastam var | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | arama |
| G-18 | chat | kaç hastam var | PASS | arama | Kayıtlarda 5 hasta.: 1. Emircan Karaoğlu (d.t. 30.08.2024) — 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene · 30.08.2026 muayene · 30.04.2026 mu… | PASS | arama |
| G-19 | chat | 2 yaşından küçük hastalarım kimler | PASS | arama | Kayıtlarda 0 hasta. Filtre: 2 yaşından küçük. | PASS | arama |
| G-20 | chat | 1 yaşından büyük hastalarım kimler | **FAIL** | arama | Kayıtlarda 0 hasta. Filtre: 1 yaşından büyük. | PASS | arama |
| G-21 | chat | aşı kaydı olan hastalarım kimler | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. | **FAIL** | arama |
| G-22 | chat | ilaç kullanan hastam var mı | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. | **FAIL** | arama |
| G-23 | chat | bu ay kayıt olan hastalarım | MANUAL | arama | Bu ay 0 hasta. Filtre: bu ay. | MANUAL | arama |
| G-24 | chat | doğum tarihi kayıtlı olmayan hastam var mı | **FAIL** | kimlik | Hangi hastanın bilgisini istiyorsunuz? Adını yazar mısınız? | **FAIL** | kimlik |
| G-25 | chat | Emircan'ın hemoglobin değeri kaçtı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-26 | chat | ferritin sonucu ne | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-27 | chat | WBC kaç | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-28 | chat | MCV ve MCHC değerlerini oku | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-29 | chat | Emircan'ın Hct değeri yüzde kaç | MANUAL | model | Vekil yanıt Hocam. | MANUAL | model |
| G-30 | chat | Emircan'ın topuk kanı sonuçları normal mi | MANUAL | model | Vekil yanıt Hocam. | MANUAL | model |
| G-31 | chat | Emircan'ın aşıları tam mı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-32 | chat | Emircan'ın eksik aşısı var mı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-33 | chat | Tarık'a hiç aşı yapıldı mı | PASS | hizli-kart | Tarık Özdemir — dosyada aşı: kayıtlı aşı yok. | PASS | hizli-kart |
| G-34 | chat | Ayşe'nin son aşı tarihi ne | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. | PASS | hizli-kart |
| G-35 | chat | Emircan'ın kullandığı ilaç var mı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-36 | chat | Tarık'a daha önce antibiyotik yazdım mı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-37 | chat | Ayşe'nin reçete geçmişini göster | **FAIL** | arama | Kayıtlarda 0 reçete (0 hasta). Filtre: İlaç. | PASS | model |
| G-38 | chat | yarın randevum var mı | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| G-39 | chat | bugün kaç hastam geliyor | **FAIL** | arama | Bugün 0 hasta. Filtre: bugün. | PASS | takvim |
| G-40 | chat | Emircan'ın bir sonraki kontrolü ne zaman | PASS | hizli-kart | Emircan Karaoğlu — dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. | PASS | hizli-kart |
| G-41 | chat | Ayşe'nin hiç ateşi olmadı mı | MANUAL | model | Vekil yanıt Hocam. | MANUAL | hizli-kart |
| G-42 | chat | Emircan'ın allerjisi var mı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-43 | chat | Olcay'ın kronik hastalığı var mı | PASS | hizli-kart | Olcay Santoro — dosyada kronik hastalık: kayıt yok. | PASS | hizli-kart |
| G-45 | chat | Ayşe'yi aç | MANUAL | model | Vekil yanıt Hocam. | MANUAL | model |
| G-46 | chat | Bugün nasılsın Ayşe | PASS | model | Vekil yanıt Hocam. | PASS | model |
| G-47 | chat | Sen neler yapabilirsin | PASS | model | Vekil yanıt Hocam. | PASS | model |
| G-48 | chat | Teşekkürler, iyi çalışmalar | PASS | model | Vekil yanıt Hocam. | PASS | model |
| G-49 | chat | Ayşe için SOAP notu taslağı hazırla | MANUAL | model | Vekil yanıt Hocam. | MANUAL | model |
| G-50 | chat | Tarık'a son yazdığım notu oku | not judged | model | Vekil yanıt Hocam. | PASS | model |
| G-K1 | chat | Tesla almak istiyorum | NEW | model | Vekil yanıt Hocam. | PASS | kapsam |
| G-K2 | chat | Peki Model Y mi Model 3 mü daha iyi | NEW | model | Vekil yanıt Hocam. | PASS | kapsam |
| G-K3 | chat | Yarın hava nasıl olacak | NEW | model | Vekil yanıt Hocam. | PASS | kapsam |
| G-K4 | chat | Fenerbahçe maçı kaç kaç bitti | NEW | arama | Kayıtlarda 0 hasta. | PASS | kapsam |
| G-K5A | chat | Dolar kaç TL | NEW | arama | Kayıtlarda 0 hasta. | PASS | kapsam |
| G-K5B | chat | bitcoin al mı | NEW | model | Vekil yanıt Hocam. | PASS | kapsam |
| G-K6 | chat | Bana yemek tarifi ver | NEW | model | Vekil yanıt Hocam. | PASS | kapsam |
| G-K7 | chat | Hasta ateşi hava sıcaklığına bağlı olabilir mi | PASS | model | Vekil yanıt Hocam. | PASS | model |
| G-K8 | chat | Amoksisilin 12 kg çocuk için doz | PASS | model | Vekil yanıt Hocam. | PASS | model |
| G-K9 | chat | Bugün kaç randevum var | NEW | arama | Bugün 0 hasta. Filtre: bugün. | PASS | takvim |
| G-K10A | chat | Teşekkürler | PASS | model | Vekil yanıt Hocam. | PASS | model |
| G-K10B | chat | tamam | PASS | model | Vekil yanıt Hocam. | PASS | model |
| G-K10C | chat | tekrar söyler misin | PASS | model | Vekil yanıt Hocam. | PASS | model |
| G-K11 | chat | Sen kimsin | PASS | model | Vekil yanıt Hocam. | PASS | model |
| Y-001 | chat | Ayşe Bozkurt dosyasını aç | NEW | model | Vekil yanıt Hocam. | PASS | dosya-ac |
| Y-002 | chat | Bu hastayı bana kısaca özetler misin? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-003 | chat | Şu anda kullandığı ilaçlar neler ve dozları nedir? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-004 | chat | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-005 | chat | Büyümesi nasıl gidiyor? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-006 | chat | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-007 | chat | Son muayeneden bu yana neler değişmiş? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-008 | chat | Daha önce aynı şikayetle geldi mi? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-009 | chat | Gelişimi yaşına uygun mu? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-010 | chat | Bugün yapmam veya takip etmem gereken bir şey var mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-011 | chat | Gözümden kaçabilecek önemli bir şey var mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-012 | chat | Kan grubu ne? | PASS | hizli-kart | Ayşe Bozkurt — dosyada kan grubu: AB Rh+. | PASS | hizli-kart |
| Y-013 | chat | Alerjisi var mı? | PASS | hizli-kart | Ayşe Bozkurt — dosyada alerji: kayıt yok. | PASS | hizli-kart |
| Y-014 | chat | Kaç yaşında? | PASS | hizli-kart | Ayşe Bozkurt — dosyada yaş: 5 yaşında. | PASS | hizli-kart |
| Y-015 | chat | Son tanısı neydi? | PASS | hizli-kart | Ayşe Bozkurt — dosyada son tanı: Pnömoni. | PASS | hizli-kart |
| Y-016 | chat | Son reçetede ne yazdık? | PASS | hizli-kart | Ayşe Bozkurt — dosyada son reçete: Klacid 250 mg/5 ml süspansiyon, Calpol süspansiyon (24 Eylül 2026). | PASS | hizli-kart |
| Y-017 | chat | Klacid dozu neydi? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-018 | chat | Kronik hastalığı var mı? | PASS | hizli-kart | Ayşe Bozkurt — dosyada kronik hastalık: kayıt yok. | PASS | hizli-kart |
| Y-019 | chat | Gelen belgeler kutusunda bir şey var mı? | MANUAL | model | Vekil yanıt Hocam. | MANUAL | model |
| Y-020 | chat | Sonraki randevusu ne zaman? | PASS | hizli-kart | Ayşe Bozkurt — dosyada randevu: 3 Ekim 2026 — kontrol. | PASS | hizli-kart |
| Y-021 | chat | Son ölçümleri neler? | PASS | hizli-kart | Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg · Boy: 110 cm. | **FAIL** | kayit |
| Y-022 | chat | hastamızın ateşi kaçtı son muayenede | PASS | hizli-kart | Ayşe Bozkurt — dosyada son vizit: 24 Eylül 2026 — Öksürük ve ateş, 4 gündür. Dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg ·… | PASS | kayit |
| Y-023 | chat | bu hastanın annesinin boyu kaç | not judged | model | Vekil yanıt Hocam. | **FAIL** | kayit |
| Y-024 | chat | Kaçıncı ziyareti bu? | PASS | hizli-kart | Ayşe Bozkurt — dosyada vizit sayısı: 1 — 24 Eylül 2026 – 24 Eylül 2026. | PASS | hizli-kart |
| Y-025 | chat | Tarik Ozdemir dosyasini ac | NEW | model | Vekil yanıt Hocam. | PASS | dosya-ac |
| Y-026 | chat | ozetle | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-027 | chat | ilaclari neler | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-028 | chat | amoksisilin dozu ne kadardi | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-029 | chat | kaç gün verdik | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-030 | chat | asilari tam mi | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-031 | chat | kilosu kac | PASS | hizli-kart | Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 cm · Baş Çevresi: 49,5 cm. | PASS | hizli-kart |
| Y-032 | chat | boyu | not judged | model | Vekil yanıt Hocam. | PASS | kayit |
| Y-033 | chat | bas cevresi | not judged | model | Vekil yanıt Hocam. | PASS | kayit |
| Y-034 | chat | persentili nasıl | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-035 | chat | kac yasinda | PASS | hizli-kart | Tarık Özdemir — dosyada yaş: 2 yaşında. | PASS | hizli-kart |
| Y-036 | chat | kaç aylık | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-037 | chat | kan grubu | PASS | hizli-kart | Tarık Özdemir — dosyada kan grubu: A Rh-. | PASS | hizli-kart |
| Y-038 | chat | penisilin alerjisi var mı | PASS | hizli-kart | Tarık Özdemir — dosyada alerji: kayıt yok. | PASS | hizli-kart |
| Y-039 | chat | tahlil sonuçları geldi mi | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-040 | chat | tanı neydi | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| Y-041 | chat | ne zaman kontrole çağırdık | PASS | hizli-kart | Tarık Özdemir — dosyada plan ve takip: Amoksisilin 6 ml 12 saatte bir, 7 gün. İbuprofen ağrıda. 48-72 saat içinde düzelmezse kontrol.. | PASS | hizli-kart |
| Y-042 | chat | babasının telefonu | PASS | kimlik | Tarık Özdemir — Babasının telefonu ayrıca kayıtlı değil. Dosyadaki iletişim telefonu: 0535 000 44 55 (hasta kartı; kime ait olduğu yazılı değil). | PASS | kimlik |
| Y-043 | chat | Ayşe, Tarık Özdemir'in son muayenesinde ateşi kaçtı | PASS | hizli-kart | Tarık Özdemir — dosyada son vizit: 1 Ekim 2026 — Sol kulak ağrısı ve ateş, 2 gündür. Dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 cm · B… | PASS | kayit |
| Y-044 | chat | kendisi daha önce kulak enfeksiyonu geçirmiş mi | not judged | model |  | PASS | model |
| Y-045 | chat | gözümden kaçan bir şey var mı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-046 | chat | Emircan Karaoğlu | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-047 | chat | Aşıları tam mı, eksik aşısı var mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-048 | chat | Sıradaki aşısı hangisi? | PASS | hizli-kart | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömoko… | PASS | hizli-kart |
| Y-049 | chat | KKK aşısını ne zaman yaptık? | PASS | hizli-kart | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömoko… | PASS | model |
| Y-050 | chat | Hepatit B kaç doz olmuş? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-051 | chat | Son hemogram sonuçları ne? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-052 | chat | Ferritin kaç çıkmış? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-053 | chat | CRP bakılmış mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-054 | chat | Son tahlil ne zaman yapılmış? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-055 | chat | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-056 | chat | Büyümesi nasıl gidiyor? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-057 | chat | Persentili kaç? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-058 | chat | Sürekli ilaçları neler? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-059 | chat | Son muayeneden bu yana neler değişmiş? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-060 | chat | Daha önce aynı şikayetle geldi mi? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-061 | chat | Gelişimi yaşına uygun mu? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-062 | chat | Toplam kaç kez geldi? | **FAIL** | arama | Kayıtlarda 2 hasta. Filtre: Gelme nedeni.: 1. Emircan Karaoğlu (d.t. 30.08.2024) — Gelme nedeni · 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene… | PASS | model |
| Y-063 | chat | Son SOAP notunu oku | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-064 | chat | Son vizitte ne not düşmüşüm? | PASS | hizli-kart | Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. | PASS | hizli-kart |
| Y-065 | chat | İlaçları neler? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-066 | chat | kaç kilo | PASS | hizli-kart | Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg · Boy: 110 cm. | PASS | hizli-kart |
| Y-067 | chat | Aşıları tam mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-068 | chat | son muayenede tansiyonu kaçtı | PASS | hizli-kart | Ayşe Bozkurt — dosyada son vizit: 24 Eylül 2026 — Öksürük ve ateş, 4 gündür. Dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg ·… | PASS | kayit |
| Y-069 | chat | Tarık Özdemir'in kilosu kaç? | PASS | hizli-kart | Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 cm · Baş Çevresi: 49,5 cm. | PASS | hizli-kart |
| Y-070 | chat | peki bu hastanın kan grubu | PASS | hizli-kart | Ayşe Bozkurt — dosyada kan grubu: AB Rh+. | PASS | hizli-kart |
| Y-071 | chat | Bugün kaç hastam var? | PASS | arama | Bugün 1 hasta. Filtre: bugün.: 1. Nermin Aydoğan (d.t. 23.08.1980) — bugün · 46 yaş 1 ay · 02.10.2026 randevu · hasta formunda geçiyor. Hangisini isti… | PASS | takvim |
| Y-072 | chat | Bugün kimler geliyor? | **FAIL** | arama | Bugün 0 hasta. Filtre: bugün. | PASS | takvim |
| Y-073 | chat | Yarın randevum var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| Y-074 | chat | peki cuma? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| Y-075 | chat | haftaya nasıl görünüyor | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| Y-076 | chat | dün kim geldi | **FAIL** | arama | Dün 0 hasta. Filtre: dün · Gelme nedeni. | PASS | takvim |
| Y-077 | chat | bu hafta kaç randevum var | NEW | arama | Bu hafta 0 hasta. Filtre: bu hafta. | PASS | takvim |
| Y-078 | chat | yarin sabah bosluk var mi | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| Y-079 | chat | Bugün öğleden sonra 3'te yer var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| Y-080 | chat | Tarık Özdemir'in randevusu ne zaman? | PASS | hizli-kart | Tarık Özdemir — dosyada randevu: randevu yok. | **FAIL** | takvim |
| Y-081 | chat | Olcay Santoro ne zaman gelecek? | PASS | hizli-kart | Olcay Santoro — dosyada plan ve takip: . Dosyada randevu: randevu yok. | PASS | hizli-kart |
| Y-082 | chat | Kaç hastam var? | PASS | arama | Kayıtlarda 5 hasta.: 1. Emircan Karaoğlu (d.t. 30.08.2024) — 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene · 30.08.2026 muayene · 30.04.2026 mu… | PASS | arama |
| Y-083 | chat | kaç tane hasta kaydım var toplam | **FAIL** | arama | Kayıtlarda 0 hasta. | **FAIL** | model |
| Y-084 | chat | bu hafta kaç hasta muayene ettim | PASS | arama | Bu hafta 0 hasta. Filtre: bu hafta. | PASS | arama |
| Y-085 | chat | En son hangi hastayı gördüm? | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | arama |
| Y-086 | chat | Son kaydettiğim hasta kim? | not judged | model |  | PASS | arama |
| Y-087 | chat | Hastalarımı listele | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | arama |
| Y-088 | chat | Aşısı eksik olan hastalarım kimler? | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | arama |
| Y-089 | chat | Bu hafta tanı koyduğum pnömoni vakası kimdi? | not judged | model | Vekil yanıt Hocam. | PASS | arama |
| Y-090 | chat | kulak iltihabı olan çocuk kimdi | not judged | model | Vekil yanıt Hocam. | PASS | arama |
| Y-091 | chat | dün gelen ateşli çocuk | **FAIL** | hizli-kart | Olcay Santoro — dosyada son ölçüm: kayıt yok. | **FAIL** | hizli-kart |
| Y-092 | chat | E-nabız'dan yeni gelen bir şey var mı? | PASS | hizli-kart | Olcay Santoro — dosyada son ölçüm: kayıt yok. | PASS | model |
| Y-093 | chat | Gelen belgelerde bekleyen var mı? | MANUAL | model | Vekil yanıt Hocam. | MANUAL | model |
| Y-094 | chat | Bugün kaç reçete yazdım? | not judged | model | Vekil yanıt Hocam. | PASS | arama |
| Y-095 | chat | Son reçetem hangi hastaya? | **FAIL** | arama | Kayıtlarda 0 reçete (0 hasta). | PASS | hizli-kart |
| Y-096 | chat | Reçeteyi nereden yazdırırım? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| Y-097 | chat | QA Test Hasta 2 dosyasını aç | not judged | model | Vekil yanıt Hocam. | PASS | arama |
| Y-098 | chat | Selim Erkoç'un dosyasını aç | not judged | model | Vekil yanıt Hocam. | PASS | arama |
| Y-099 | chat | Mehmet Yılmaz kaç yaşında? | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | model |
| Y-100 | chat | Ayşe Bozkurt kaç yaşında | PASS | hizli-kart | Ayşe Bozkurt — dosyada yaş: 5 yaşında. | PASS | hizli-kart |
| Y-101 | chat | Ayşe kaç yaşında | PASS | hizli-kart | Ayşe Bozkurt — dosyada yaş: 5 yaşında. | PASS | hizli-kart |
| Y-102 | chat | ... | not judged | model | Vekil yanıt Hocam. | PASS | gurultu |
| Y-103 | chat | Emircan Karaoglu'nun kaç aşısı var | PASS | hizli-kart | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömoko… | PASS | kayit |
| T-001 | chat | Bugün randevum var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-002 | chat | Peki yarın? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-003 | chat | Ya cuma? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-004 | chat | Haftaya? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-005 | chat | Yarın randevum var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-006 | chat | Peki var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-007 | chat | e öbür gün? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-008 | chat | bugun randevum var mi | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-009 | chat | peki yarin | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-010 | chat | ya persembe | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-011 | chat | Bugün kaç hastam var? | PASS | arama | Bugün 1 hasta. Filtre: bugün.: 1. Nermin Aydoğan (d.t. 23.08.1980) — bugün · 46 yaş 1 ay · 02.10.2026 randevu · hasta formunda geçiyor. Hangisini isti… | PASS | takvim |
| T-012 | chat | peki yarın? | not judged | model | Vekil yanıt Hocam. | PASS | takvim |
| T-013 | chat | kimler? | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | takvim |
| T-014 | chat | Bu hafta kaç randevum var? | NEW | arama | Bu hafta 0 hasta. Filtre: bu hafta. | PASS | takvim |
| T-015 | chat | peki haftaya? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-016 | chat | bu hafta kimler geliyor? | NEW | arama | Bu hafta 0 hasta. Filtre: bu hafta. | PASS | takvim |
| T-017 | chat | yarın sabah boşluk var mı | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-018 | chat | peki öğleden sonra? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-019 | chat | Bugün saat 3'te yer var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-020 | chat | peki yarın? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-021 | chat | dün kim geldi | **FAIL** | arama | Dün 0 hasta. Filtre: dün · Gelme nedeni. | PASS | takvim |
| T-022 | chat | peki bugün? | not judged | model | Vekil yanıt Hocam. | PASS | takvim |
| T-023 | chat | ya yarın kimler? | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | takvim |
| T-024 | chat | Bugün randevum var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-025 | chat | peki Tarık Özdemir randevusu ne zaman? | PASS | hizli-kart | Tarık Özdemir — dosyada randevu: randevu yok. | **FAIL** | takvim |
| T-026 | chat | peki Emircan'ın? | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-027 | chat | Ayşe Bozkurt dosyasını aç | not judged | model | Vekil yanıt Hocam. | PASS | dosya-ac |
| T-028 | chat | aşıları? | PASS | hizli-kart | Ayşe Bozkurt — dosyada aşı: kayıtlı aşı yok. | PASS | kayit |
| T-029 | chat | eksik olan var mı? | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-030 | chat | peki Emircan'ın? | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-031 | chat | Emircan Karaoğlu son tahlili ne? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-032 | chat | CRP kaç? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-033 | chat | Peki hemogram? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-034 | chat | bir önceki? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-035 | chat | Ayşe Bozkurt reçetesi? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-036 | chat | dozu? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-037 | chat | kaç gün? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-038 | chat | Tarık recetesi ne | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-039 | chat | dozu | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-040 | chat | kac gun verdik | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-041 | chat | Emircan Karaoğlu kaç kilo? | PASS | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | hizli-kart |
| T-042 | chat | boyu? | not judged | model | Vekil yanıt Hocam. | **FAIL** | kayit |
| T-043 | chat | persentili? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-044 | chat | baş çevresi? | not judged | model | Vekil yanıt Hocam. | **FAIL** | kayit |
| T-045 | chat | Tarık Özdemir son muayenesinde ateşi kaçtı | PASS | hizli-kart | Tarık Özdemir — dosyada son vizit: 1 Ekim 2026 — Sol kulak ağrısı ve ateş, 2 gündür. Dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 cm · B… | PASS | kayit |
| T-046 | chat | tanısı? | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-047 | chat | peki Emircan'ın? | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-048 | chat | Emircan Karaoğlu ferritin kaç? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-049 | chat | peki Tarık'ın? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-050 | chat | Kaç hastam var? | PASS | arama | Kayıtlarda 5 hasta.: 1. Emircan Karaoğlu (d.t. 30.08.2024) — 2 yaş 1 ay · 30.09.2026 muayene · 20.09.2026 muayene · 30.08.2026 muayene · 30.04.2026 mu… | PASS | arama |
| T-051 | chat | bu hafta kaç hasta muayene ettim? | PASS | arama | Bu hafta 0 hasta. Filtre: bu hafta. | PASS | arama |
| T-052 | chat | peki son 30 gün? | not judged | model | Vekil yanıt Hocam. | PASS | arama |
| T-053 | chat | Emircan Karaoğlu dosyasını aç | not judged | model | Vekil yanıt Hocam. | PASS | dosya-ac |
| T-054 | chat | kan grubu? | PASS | hizli-kart | Emircan Karaoğlu — dosyada kan grubu: 0 Rh+. | PASS | hizli-kart |
| T-055 | chat | alerjisi? | PASS | hizli-kart | Emircan Karaoğlu — dosyada alerji: kayıt yok. | PASS | hizli-kart |
| T-056 | chat | peki Ayşe Bozkurt'un? | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-057 | chat | aşıları tam mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-058 | chat | peki Emircan'ın? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-059 | chat | kilosu? | PASS | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | hizli-kart |
| T-060 | chat | Emircan Karaoğlu son vizitte ne not düşmüşüm? | PASS | hizli-kart | Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. | PASS | hizli-kart |
| T-061 | chat | peki bir öncekinde? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-062 | chat | Ayşe Bozkurt gelen belgeler kutusunda bir şey var mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-063 | chat | peki Emircan'ın? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-064 | chat | Emircan Karaoğlu KKK aşısını ne zaman yaptık? | PASS | hizli-kart | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömoko… | PASS | model |
| T-065 | chat | peki Hepatit B? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-066 | chat | kaç doz? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-067 | chat | Tarık Özdemir dosyasını aç | not judged | model | Vekil yanıt Hocam. | PASS | dosya-ac |
| T-068 | chat | ilaçları? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-069 | chat | dozu? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-070 | chat | kaç gün? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-071 | chat | kaç hastam var bugün? | PASS | arama | Bugün 1 hasta. Filtre: bugün.: 1. Nermin Aydoğan (d.t. 23.08.1980) — bugün · 46 yaş 1 ay · 02.10.2026 randevu · hasta formunda geçiyor. Hangisini isti… | PASS | takvim |
| T-072 | chat | peki yarın? | not judged | model | Vekil yanıt Hocam. | PASS | takvim |
| T-073 | chat | peki haftaya? | not judged | model | Vekil yanıt Hocam. | PASS | takvim |
| T-074 | chat | kimler? | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | takvim |
| T-075 | chat | Emircan Karaoğlu büyümesi nasıl? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-076 | chat | kilosu? | PASS | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | hizli-kart |
| T-077 | chat | peki Tarık'ın? | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-078 | chat | Emircan Karaoğlu asilari tam mi | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-079 | chat | eksik olan var mi | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-080 | chat | siradaki hangisi | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-081 | chat | Ayşe Bozkurt son tanısı? | PASS | hizli-kart | Ayşe Bozkurt — dosyada son tanı: Pnömoni. | PASS | hizli-kart |
| T-082 | chat | ya ilaçları? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-083 | chat | e dozu? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-084 | chat | Emircan Karaoğlu son tahlili ne zaman? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-085 | chat | sonuçları? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-086 | chat | ferritin? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-087 | chat | dozu? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-088 | chat | Bugün kaç hastam var? | PASS | arama | Bugün 1 hasta. Filtre: bugün.: 1. Nermin Aydoğan (d.t. 23.08.1980) — bugün · 46 yaş 1 ay · 02.10.2026 randevu · hasta formunda geçiyor. Hangisini isti… | PASS | takvim |
| T-089 | chat | kimler? | NEW | arama | Kayıtlarda 0 hasta. | PASS | arama |
| T-090 | chat | Emircan Karaoğlu ferritin kaç? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-091 | chat | peki demir? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-092 | chat | bir önceki? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-093 | chat | Bu hafta kaç randevum var? | NEW | arama | Bu hafta 0 hasta. Filtre: bu hafta. | PASS | takvim |
| T-094 | chat | peki haftaya? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-095 | chat | ya bu hafta kimler? | NEW | arama | Bu hafta 5 hasta. Filtre: bu hafta.: 1. Tarık Özdemir (d.t. 25.02.2024) — bu hafta · 2 yaş 7 ay · 01.10.2026 muayene · 01.10.2026 not: Sol kulak ağrıs… | PASS | takvim |
| T-096 | chat | Ayşe Bozkurt kaç yaşında? | PASS | hizli-kart | Ayşe Bozkurt — dosyada yaş: 5 yaşında. | PASS | hizli-kart |
| T-097 | chat | peki Tarık'ın? | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-098 | chat | ya Emircan'ın? | not judged | model | Vekil yanıt Hocam. | PASS | hizli-kart |
| T-099 | chat | Bugün randevum var mı? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| T-100 | chat | Ayşe Bozkurt aşıları tam mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| T-101 | chat | peki yarın randevu var mı? | NEW | hizli-kart | Ayşe Bozkurt — dosyada randevu: 3 Ekim 2026 — kontrol. | PASS | takvim |
| I-01 | chat | Bu hastayı bana kısaca özetler misin? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| I-01 | panel | Bu hastayı bana kısaca özetler misin? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | **FAIL** | panel |
| I-02 | chat | Son muayeneden bu yana neler değişmiş? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| I-02 | panel | Son muayeneden bu yana neler değişmiş? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| I-03 | chat | Büyümesi nasıl gidiyor? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| I-03 | panel | Büyümesi nasıl gidiyor? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | **FAIL** | panel |
| I-04 | chat | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | not judged | model | Vekil yanıt Hocam. | **FAIL** | model |
| I-04 | panel | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| I-05 | chat | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| I-05 | panel | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| I-06 | chat | Şu anda kullandığı ilaçlar neler ve dozları nedir? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| I-06 | panel | Şu anda kullandığı ilaçlar neler ve dozları nedir? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| I-07 | chat | Daha önce aynı şikayetle geldi mi? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| I-07 | panel | Daha önce aynı şikayetle geldi mi? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| I-08 | chat | Gelişimi yaşına uygun mu? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| I-08 | panel | Gelişimi yaşına uygun mu? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| I-09 | chat | Bugün yapmam veya takip etmem gereken bir şey var mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| I-09 | panel | Bugün yapmam veya takip etmem gereken bir şey var mı? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| I-10 | chat | Gözümden kaçabilecek önemli bir şey var mı? | not judged | model | Vekil yanıt Hocam. | PASS | model |
| I-10 | panel | Gözümden kaçabilecek önemli bir şey var mı? | not judged | panel | {"speech":"Vekil yanıt Hocam."} | PASS | panel |
| E-01 | chat | Fıstık alerjisini ekle | **FAIL** | hizli-kart | Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). | PASS | model |
| E-02 | chat | Yumurta alerjisi var, dosyaya işle | **FAIL** | hizli-kart | Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). | PASS | model |
| E-03 | chat | Penisilin alerjisini kaldır | **FAIL** | hizli-kart | Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). | PASS | model |
| E-04 | chat | Astım tanısını kronik hastalıklara ekle | **FAIL** | hizli-kart | Deniz Aksoy — dosyada kronik hastalık: kayıt yok. | PASS | model |
| E-05 | chat | Kronik hastalıklarına epilepsi ekleyelim | **FAIL** | hizli-kart | Deniz Aksoy — dosyada kronik hastalık: kayıt yok. | PASS | model |
| E-06 | chat | Kilosunu 24,8 kilo olarak ekle | **FAIL** | hizli-kart | Deniz Aksoy — dosyada son ölçüm: kilo 24.6 kg (12 Eylül 2026). | PASS | model |
| E-07 | chat | Boyu 124 santim, kilosu 24,8; kaydet | not judged | model |  | PASS | model |
| E-08 | chat | Ateşi 38,2, kaydet | not judged | model |  | PASS | model |
| E-09 | chat | Baş çevresi 52 santim, kaydet | not judged | model |  | PASS | model |
| E-10 | chat | Amoksisilin 250 mg günde iki kez ilaçlarına ekle | NEW | model | Vekil yanıt Hocam. | PASS | model |
| E-11 | chat | Zyrtec şurup 5 mg akşamları, ilaçlarına ekle | not judged | model | Vekil yanıt Hocam. | PASS | model |
| E-12 | chat | Ventolini kes | not judged | model | Vekil yanıt Hocam. | PASS | model |
| E-13 | chat | Demir şurubunu keser misin | not judged | model | Vekil yanıt Hocam. | PASS | model |
| E-14 | chat | Pulmicort dozunu günde bir keze düşür | not judged | model | Vekil yanıt Hocam. | PASS | model |
| E-15 | chat | Singulair dozunu 10 miligrama çıkar | NEW | model | Vekil yanıt Hocam. | PASS | model |
| E-16 | chat | Dosyasına not al: annesi sigarayı bıraktı | not judged | model | Vekil yanıt Hocam. | PASS | model |
| E-17 | chat | Şunu not düş: kontrolde EEG istenecek | **FAIL** | hizli-kart | Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek… | PASS | model |
| E-18 | chat | Hepatit B aşısı dün yapıldı, kaydet | not judged | model |  | PASS | model |
| E-19 | chat | KKK bugün yapıldı, dosyaya işle | not judged | model | Vekil yanıt Hocam. | PASS | model |
| E-20 | chat | Doğum tarihini 12.03.2019 olarak düzelt | not judged | model | Vekil yanıt Hocam. | PASS | model |
| E-21 | chat | Yarın saat 14:00 için kontrol randevusu oluştur | **FAIL** | hizli-kart | Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek… | PASS | model |
| E-22 | chat | Haftaya salı 10:30 kontrol randevusu ver | **FAIL** | hizli-kart | Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek… | PASS | model |
| E-23 | chat | Randevusunu perşembeye al | NEW | hizli-kart | Deniz Aksoy — dosyada randevu: 12 Ekim 2026 — kontrol. | PASS | model |
| E-24 | chat | Randevu saatini 15:30 olarak değiştir | NEW | hizli-kart | Deniz Aksoy — dosyada randevu: 12 Ekim 2026 — kontrol. | PASS | model |
| E-25 | chat | Randevusunu iptal et | NEW | hizli-kart | Deniz Aksoy — dosyada randevu: 12 Ekim 2026 — kontrol. | PASS | model |
| E-26 | chat | Deniz Aksoy'un fıstık alerjisini ekle | **FAIL** | hizli-kart | Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). | PASS | model |
| E-27 | chat | Deniz Aksoy için yarın 11:00'e kontrol randevusu oluştur | **FAIL** | hizli-kart | Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek… | PASS | model |
| E-28 | chat | Deniz Aksoy'un Ventolinini kes | not judged | model | Vekil yanıt Hocam. | PASS | model |
| E-29 | chat | Fıstık alerjisini ekle | PASS | model | Vekil yanıt Hocam. | PASS | model |
| E-30 | chat | 14:30 | not judged | model | Vekil yanıt Hocam. | PASS | model |
| E-31 | chat | 14:30 | not judged | model | Vekil yanıt Hocam. | PASS | model |
| E-32 | chat | Alerjisi var mı | PASS | hizli-kart | Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). | PASS | hizli-kart |
| E-33 | chat | Ventolini ne zaman kestik | not judged | model | Vekil yanıt Hocam. | **FAIL** | model |
| R-ASI-1 | chat | Aşılarını göster | NEW | hizli-kart | Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömoko… | PASS | kayit |
| R-ASI-2 | chat | Aşı karnesini tablo olarak göster | NEW | model | Vekil yanıt Hocam. | PASS | kayit |
| R-ASI-3 | chat | Emircan Karaoğlu aşı karnesini tablo olarak göster | NEW | model | Vekil yanıt Hocam. | PASS | kayit |
| R-ASI-4 | chat | Toplam kaç aşısı var | NEW | arama | Kayıtlarda 0 hasta. | PASS | kayit |
| R-OLCUM-1 | chat | Bütün muayenelerdeki kilo ölçümlerini sırayla göster | NEW | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | kayit |
| R-OLCUM-2 | chat | Kilo, boy ve baş çevresi ölçümlerini tablo yap | NEW | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | kayit |
| R-OLCUM-3 | chat | Tüm antropometrik ölçümlerini göster | NEW | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | kayit |
| R-OLCUM-4 | chat | Baş çevresi ölçümleri neler | NEW | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | kayit |
| R-OLCUM-5 | chat | Son muayenedeki boy ve kilo ölçümlerini göster | NEW | hizli-kart | Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. Dosyada son ölçüm: Kilo: 12,8 kg. | PASS | kayit |
| R-MUAYENE-1 | chat | Son üç muayenesini özetle | NEW | model | Vekil yanıt Hocam. | PASS | kayit |
| R-MUAYENE-2 | chat | Bütün muayenelerini tek tek özetle | NEW | model | Vekil yanıt Hocam. | PASS | kayit |
| R-OLCUM-METIN | chat | 15 aylık muayenesinde kilosu kaçtı? | **FAIL** | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | kayit |
| R-KART-KILO | chat | Kilosu kaç? | PASS | hizli-kart | Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. | PASS | hizli-kart |
| R-KART-ALERJI | chat | Alerjisi var mı? | PASS | hizli-kart | Emircan Karaoğlu — dosyada alerji: kayıt yok. | PASS | hizli-kart |
| R-TAKVIM-BOS | chat | Yarın 15:00 boş mu? | NEW | model | Vekil yanıt Hocam. | PASS | takvim |
| R-TAKVIM-KIM | chat | Yarın kimler geliyor? | NEW | arama | Kayıtlarda 0 hasta. | PASS | takvim |
| R-KAPSAM | chat | Bitcoin almalı mıyım? | NEW | model | Vekil yanıt Hocam. | PASS | kapsam |
| R-COUNT-ACIK-1 | chat | En çok hangi şikayetle geldi | **FAIL** | arama | Son 30 gün en çok görülen şikayet Sol kulak ağrısı ve ateş, 2 gündür (3). Sıra: Sol kulak ağrısı ve ateş, 2 gündür 3, Kontrol 1, Öksürük ve ateş, 4 gü… | PASS | model |
| R-SAYIM-1 | chat | Randevu saatini değiştirmek istiyorum | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · Randevu. | PASS | model |
| R-SAYIM-2 | chat | Aşı karnesini tablo olarak göster | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. | PASS | model |
| R-SAYIM-3 | chat | İlaç etkileşimi var mı kontrol et | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. | PASS | model |
| R-SAYIM-4 | chat | Epikriz hazırla | not judged | model | Vekil yanıt Hocam. | PASS | model |
| R-SAYIM-5 | chat | Otitte ilk seçenek tedavi nedir | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · Plan. | PASS | model |
| R-SAYIM-6 | chat | Ateşli çocukta parasetamol dozu nedir | **FAIL** | arama | Kayıtlarda 0 hasta. | PASS | model |
| R-SAYIM-7 | chat | Tanı koymama yardım eder misin | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · Tanı. | PASS | model |
| R-SAYIM-8 | chat | Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz | **FAIL** | arama | Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. | PASS | model |
| R-KAPSAM06-1 | chat | Burcu Yılmaz en son ne zaman geldi? | PASS | arama | Kayıtlarda 0 hasta. Filtre: Gelme nedeni. | PASS | model |
| R-KAPSAM06-2 | chat | Mehmet Erdoğan en son ne zaman geldi? | PASS | arama | Kayıtlarda 0 hasta. Filtre: Gelme nedeni. | PASS | model |
| R-KAPSAM06-3 | chat | Ali Erdoğan kim? | PASS | model | Vekil yanıt Hocam. | PASS | model |
| R-KAPSAM06-4 | chat | Faiz Demir bugün geldi mi | PASS | arama | Bugün 0 hasta. Filtre: bugün · Gelme nedeni · Anemi. | PASS | model |
| R-KAPSAM06-5 | chat | Kriptorşidizm ne zaman opere edilir? | PASS | model | Vekil yanıt Hocam. | PASS | model |
| R-KAPSAM06-6 | chat | Araba tutması için ne önerirsin? | PASS | model | Vekil yanıt Hocam. | PASS | model |
| R-KAPSAM06-7 | chat | İlk seçim ne olmalı? | PASS | model | Vekil yanıt Hocam. | PASS | model |
| R-KAPSAM06-8 | chat | C-reactive protein yüksekliği nedenleri | PASS | model | Vekil yanıt Hocam. | PASS | model |
| R-KAPSAM06-9 | chat | Otel dönüşü döküntü yapan şey ne olabilir | PASS | arama | Kayıtlarda 0 hasta. Filtre: Döküntü. | PASS | model |
| R-KAPSAM06-10 | chat | Emircan Karaoğlu en son ne zaman geldi? | PASS | hizli-kart | Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. Dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. | PASS | hizli-kart |

## 8. Every voice-el turn at the checkpoint (reference)

| id | sentence | verdict | route | answer |
|---|---|---|---|---|
| L-SAYIM-ANDA | Hocam benim şu anda toplam kaç hastam var? | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| L-1TO1-YAS | hastamız kaç yaşında | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada yaş: 2 yaşında. |
| L-1TO1-AC | Emircan Karaoğlu'nun dosyasını aç | NEW | model | 🔊 Vekil yanıt Hocam. |
| L-1TO1-YOK | Kemal Sarıtaş'ın dosyasını aç | NEW | model | 🔊 Vekil yanıt Hocam. |
| C-2 | Bugün hiçbir randevumuz var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| C-3 | Peki yanım var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| C-4 | Bugün randevum var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| C-5 | Peki xqzt var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| C-6 | Yarın randevo var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| L-SES-TUR-BIRLESIK | İyiyim teşekkür ederim. Bugün randevumuz var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| L-HASTA-01 | Emircan Karaoğlu'na hiç antibiyotik vermiş miyim ve verdiysem hangisini vermişim. | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-KIMLIK-ANNE | Annesinin adı ne? | PASS | kimlik | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Anne adı ekranda). Seste… |
| L-KIMLIK-BABA | Babasının adı ne? | PASS | kimlik | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Baba adı ekranda). Seste… |
| L-KIMLIK-ANNETEL | Annesinin telefonu ne? | PASS | kimlik | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Annesinin telefonu ekran… |
| L-KIMLIK-VELI | Velisi kim? | PASS | kimlik | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Veli / yasal temsilci ek… |
| L-KIMLIK-DOGUMYERI | Doğum yeri neresi? | PASS | kimlik | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Doğum yeri ekranda). Ses… |
| L-KIMLIK-ADRES | Adresi ne? | PASS | kimlik | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Adres ekranda). Seste ok… |
| L-KIMLIK-EPOSTA | E-posta adresi ne? | PASS | kimlik | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (E-posta ekranda). Seste … |
| L-KIMLIK-DT | Emircan Karaoğlu'nun doğum tarihini verir misin? | PASS | kimlik | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Doğum tarihi ekranda). S… |
| L-KIMLIK-DT-ASR | Emircan Kara oğlunun doğum tarihini verir misin? | PASS | kimlik | 🔊 Emircan Karaoğlu için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Emircan Karaoğlu için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Doğum tarihi ekranda). S… |
| L-SES-HASTA-01 | Ayşe Bozkurt'un son muayenesinin özetini verir misin? | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-SES-HASTA-01-ASR | Ayşe Bozkurtun son muayenesinin özetini verir misin? | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| L-SES-HASTA-01-KOHORT | Merhaba Ayşe, bu hafta ateşli hastalarım kimler | PASS | arama | 🔊 Bu hafta 0 hasta. Filtre: bu hafta. |
| L-AKTIF-SON | En son ne zaman geldi? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. Dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |
| L-AKTIF-TANSIYON | Tansiyon takibini nasıl planlarsın? | PASS | hizli-kart | 🔊 Nermin Aydoğan — dosyada plan ve takip: Mevcut tedavi devam. 3 ay sonra HbA1c ve lipid paneli ile kontrol.. Dosyada son ölçüm: Tansiyon: 132/84 mmHg, Nabız: 76/dk, Kilo: 75,5 kg. 🖥 Nermin Aydoğan … |
| L-DOLGU-01 | Emircan, eee, Karaoğlu'nun dosyasına bak... şu anda kaç yaşında Emircan? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada yaş: 2 yaşında. |
| L-DOLGU-KILO | Peki Ayşe, Emircan Karaoğlu kaç kilo? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-DOLGU-HANE | Eee, merhaba Ayşe Hocam. Bana, eee, Emirhan Karaoğlu'nun hanesini gösterir misin | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-ODAK-01 | Biraz koy. Ayşe, benim spesifik, eee, arzum şeydi, aşı karnesini göstermendi. | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-ODAK-HITAP-1 | Ayşe, aşı karnesini gösterir misin? | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, Aşı. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. |
| L-ODAK-HITAP-2 | Ayşe Hanım otitte ilk seçenek ne? | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-ODAK-HITAP-3 | Merhaba Ayşe, nasılsın? | PASS | model | 🔊 Vekil yanıt Hocam. |
| L-ODAK-HITAP-4 | Teşekkürler Ayşe | PASS | model | 🔊 Vekil yanıt Hocam. |
| L-DOLGU-02 | Merhaba hocam bugün nasınsınız iyi misiniz? | PASS | model | 🔊 Vekil yanıt Hocam. |
| L-SAYFA-KILO | kaç kilo | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-SAYFA-BUYUME | Büyümesi nasıl gidiyor? | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-ERKEN-01 | Emircan Karaoğlu'nun dosyasını kısaca özetler misin | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-OKU-01 | Devamını ekranda görüyorum ama sen bana anlat | PASS | oku | 🔊 Vekil yanıt Hocam. 🖥 Ekrandaki cevabı sesli okudum Hocam. |
| L-DEVAM-01 | devam et | MANUAL | model | 🔊 Vekil yanıt Hocam. |
| L-OZET-TAM | Hastanın özetini oku | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-BIRIM-02 | Son muayenede ateşi kaçtı? | NEW | hizli-kart | 🔊 Tarık Özdemir — dosyada son vizit: 1 Ekim 2026 — Sol kulak ağrısı ve ateş, 2 gündür. Dosyada son ölçüm: Ateş: 38,7 °C, Kilo: 13,9 kg, Boy: 92 cm, Baş Çevresi: 49,5 cm. 🖥 Tarık Özdemir — dosyada so… |
| L-PLAN-01 | Bir tane Tesla elektrikli araba almayı planlıyorum. | NEW | hizli-kart | 🔊 Emircan Karaoğlu — dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |
| L-TUR-6AY | Emircan Karaoğlu'nun 6 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-TUR-12AY | Emircan Karaoğlu'nun 12 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-TUR-15AY | Emircan Karaoğlu'nun 15 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-TUR-18AY | Emircan Karaoğlu'nun 18 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-TUR-24AY | Emircan Karaoğlu'nun 24 aylık sağlam çocuk muayenesini özetleyerek anlatır mısın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-GECMIS | Bu hastanın geçmişini özetler misin? | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-KAPSAM-05 | Bugün İstanbul'da hava yağışlı mı? | NEW | arama | 🔊 Bugün 0 hasta. Filtre: bugün, Şehir. 🖥 Bugün 0 hasta. Filtre: bugün · Şehir. |
| L-KAPSAM-05C | Bugün kaç hastam var? | PASS | arama | 🔊 Bugün 1 hasta. Filtre: bugün.: 1) Nermin Aydoğan — bugün, 46 yaş 1 ay, 02.10.2026 randevu, hasta formunda geçiyor. Hangisini istiyorsunuz — birinci, ikinci, adıyla veya şikayetiyle söyleyin. 🖥 Bug… |
| L-KAPSAM-06B | Yarın yağmur yağacak mı | NEW | model | 🔊 Vekil yanıt Hocam. |
| L-EYLEM-HEPB | Doğum epikrizindeki Hepatit B dozunu kaydet | not judged | model | 🔊 Emircan Karaoğlu için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| L-GERI-03-BOS | Yarın hangi saatler boş? | NEW | model | 🔊 Vekil yanıt Hocam. |
| L-GERI-03-YABANCI | Ali Yılmaz için randevu oluştur | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, Randevu. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · Randevu. |
| L-DANIS-12AY | bu hasta 12 aylık muayenesine geldiğinde kaç kiloydu | **FAIL** | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-DANIS-BOYU | peki boyu? | not judged | model | 🔊 Vekil yanıt Hocam. |
| L-DANIS-15AY | 15 aylıkken kaç kiloydu | **FAIL** | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-DANIS-6AY | 6 aylık kontrolde boyu kaçtı | **FAIL** | hizli-kart | 🔊 Emircan Karaoğlu — dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |
| L-DANIS-NORMAL | 12 aylık muayenesinde kilosu normal miydi? | **FAIL** | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-DANIS-SERI-1 | kilo gelişimi | NEW | model | 🔊 Vekil yanıt Hocam. |
| L-DANIS-SERI-2 | bütün muayenelerinde kilosu | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-DANIS-TANSIYON | son muayenede tansiyonu kaçtı | PASS | hizli-kart | 🔊 Nermin Aydoğan — dosyada son vizit: 18 Eylül 2026 — Kontrol. Dosyada son ölçüm: Tansiyon: 132/84 mmHg, Nabız: 76/dk, Kilo: 75,5 kg. 🖥 Nermin Aydoğan — dosyada son vizit: 18 Eylül 2026 — Kontrol. D… |
| L-DANIS-TANSIYON-SERI | tansiyon seyri | NEW | hizli-kart | 🔊 Nermin Aydoğan — dosyada son ölçüm: Tansiyon: 132/84 mmHg, Nabız: 76/dk, Kilo: 75,5 kg. 🖥 Nermin Aydoğan — dosyada son ölçüm: Tansiyon: 132/84 mmHg · Nabız: 76/dk · Kilo: 75,5 kg. |
| L-DANIS-ILK | ilk muayenede kaç kiloydu | **FAIL** | hizli-kart | 🔊 Nermin Aydoğan — dosyada son ölçüm: Tansiyon: 132/84 mmHg, Nabız: 76/dk, Kilo: 75,5 kg. 🖥 Nermin Aydoğan — dosyada son ölçüm: Tansiyon: 132/84 mmHg · Nabız: 76/dk · Kilo: 75,5 kg. |
| L-DANIS-SON | son muayenede kaç kiloydu | PASS | hizli-kart | 🔊 Nermin Aydoğan — dosyada son vizit: 18 Eylül 2026 — Kontrol. Dosyada son ölçüm: Tansiyon: 132/84 mmHg, Nabız: 76/dk, Kilo: 75,5 kg. 🖥 Nermin Aydoğan — dosyada son vizit: 18 Eylül 2026 — Kontrol. D… |
| L-DANIS-GECEN-YIL | geçen yıl kaç kiloydu | MANUAL | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| L-KOHORT-01 | Son bir ay içinde hangi antibiyotiği en fazla yazdım? | **FAIL** | model | 🔊 Vekil yanıt Hocam. |
| L-KOHORT-02 | Son bir ayda kaç hastaya antibiyotik yazdım? | PASS | arama | 🔊 Son 1 ay en çok yazdığın antibiyotik Amoksisilin 250 mg/5 ml süspansiyon (1 reçete). Sıra: Amoksisilin 250 mg/5 ml süspansiyon 1, Augmentin ES 600 mg/5 ml süspansiyon 1, Klacid 250 mg/5 ml süspansi… |
| L-KOHORT-03 | Bu hafta en fazla hangi tanıyı koydum? | **FAIL** | model | 🔊 Vekil yanıt Hocam. |
| L-KOHORT-04 | Bu hastaya en fazla hangi antibiyotiği yazdım? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son reçete: Augmentin ES 600 mg/5 ml süspansiyon, Pedifen şurup (20 Eylül 2026). |
| L-GERI-02-EVET | Evet | MANUAL | model | 🔊 Tamam Hocam... Vekil yanıt Hocam. 🖥 Vekil yanıt Hocam. |
| G-01 | Emircan'ın dosyasını aç | NEW | model | 🔊 Vekil yanıt Hocam. |
| G-02 | Emircanın dosyası | **FAIL** | model | 🔊 Vekil yanıt Hocam. |
| G-03 | Karaoğlu'nun aşıları ne durumda | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızamık-Kızamıkçık-Kab… |
| G-04 | Karaoğlunun aşıları | **FAIL** | model | 🔊 Vekil yanıt Hocam. |
| G-05 | Bozkurt'un dosyasını getir | NEW | model | 🔊 Vekil yanıt Hocam. |
| G-06 | bozkurtun dosyasını getir | NEW | model | 🔊 Vekil yanıt Hocam. |
| G-07 | Tarık Özdemir'i açar mısın | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-08 | Özdemir'in son kontrolü ne zamandı | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada plan ve takip: Amoksisilin 6 ml 12 saatte bir, 7 gün. İbuprofen ağrıda. 48-72 saat içinde düzelmezse kontrol.. |
| G-09 | Olcay'ın kaydı var mı | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-10 | Santoro diye bir hastam var mıydı | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-11 | Emircn Karaoglu dosyasini ac | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-12 | Emirçan Kara oğlu hastasını bul | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-13 | Olcay Santor diye hasta var mı | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-14 | Ayşe hastamı bul | MANUAL | model | 🔊 Vekil yanıt Hocam. |
| G-15 | hastamın dosyasını aç | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-16 | Taırk Özdemir'in aşı karnesini göster | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-17 | şu anda toplam kaç hastam var | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| G-18 | kaç hastam var | PASS | arama | 🔊 Kayıtlarda 5 hasta.: 1) Emircan Karaoğlu — 2 yaş 1 ay, 30.09.2026 muayene, 20.09.2026 muayene, 30.08.2026 muayene, 30.04.2026 muayene. 2) Nermin Aydoğan — 46 yaş 1 ay, 18.09.2026 muayene, 03.08.202… |
| G-19 | 2 yaşından küçük hastalarım kimler | PASS | arama | 🔊 Kayıtlarda 0 hasta. Filtre: 2 yaşından küçük. |
| G-20 | 1 yaşından büyük hastalarım kimler | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. Filtre: 1 yaşından büyük. |
| G-21 | aşı kaydı olan hastalarım kimler | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, Aşı. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. |
| G-22 | ilaç kullanan hastam var mı | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, İlaç. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. |
| G-23 | bu ay kayıt olan hastalarım | MANUAL | arama | 🔊 Bu ay 0 hasta. Filtre: bu ay. |
| G-24 | doğum tarihi kayıtlı olmayan hastam var mı | **FAIL** | kimlik | 🔊 Hangi hastanın bilgisini istiyorsunuz? Adını yazar mısınız? |
| G-25 | Emircan'ın hemoglobin değeri kaçtı | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-26 | ferritin sonucu ne | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-27 | WBC kaç | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-28 | MCV ve MCHC değerlerini oku | **FAIL** | oku | 🔊 Vekil yanıt Hocam. 🖥 Ekrandaki cevabı sesli okudum Hocam. |
| G-29 | Emircan'ın Hct değeri yüzde kaç | MANUAL | model | 🔊 Vekil yanıt Hocam. |
| G-30 | Emircan'ın topuk kanı sonuçları normal mi | MANUAL | model | 🔊 Vekil yanıt Hocam. |
| G-31 | Emircan'ın aşıları tam mı | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-32 | Emircan'ın eksik aşısı var mı | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-33 | Tarık'a hiç aşı yapıldı mı | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada aşı: kayıtlı aşı yok. |
| G-34 | Ayşe'nin son aşı tarihi ne | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, Aşı. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. |
| G-35 | Emircan'ın kullandığı ilaç var mı | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-36 | Tarık'a daha önce antibiyotik yazdım mı | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-37 | Ayşe'nin reçete geçmişini göster | **FAIL** | arama | 🔊 Kayıtlarda 0 reçete (0 hasta). Filtre: İlaç. |
| G-38 | yarın randevum var mı | NEW | model | 🔊 Vekil yanıt Hocam. |
| G-39 | bugün kaç hastam geliyor | **FAIL** | arama | 🔊 Bugün 0 hasta. Filtre: bugün. |
| G-40 | Emircan'ın bir sonraki kontrolü ne zaman | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |
| G-41 | Ayşe'nin hiç ateşi olmadı mı | MANUAL | model | 🔊 Vekil yanıt Hocam. |
| G-42 | Emircan'ın allerjisi var mı | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-43 | Olcay'ın kronik hastalığı var mı | PASS | hizli-kart | 🔊 Olcay Santoro — dosyada kronik hastalık: kayıt yok. |
| G-45 | Ayşe'yi aç | MANUAL | model | 🔊 Vekil yanıt Hocam. |
| G-46 | Bugün nasılsın Ayşe | PASS | model | 🔊 Vekil yanıt Hocam. |
| G-47 | Sen neler yapabilirsin | PASS | model | 🔊 Vekil yanıt Hocam. |
| G-48 | Teşekkürler, iyi çalışmalar | PASS | model | 🔊 Vekil yanıt Hocam. |
| G-49 | Ayşe için SOAP notu taslağı hazırla | MANUAL | model | 🔊 Vekil yanıt Hocam. |
| G-50 | Tarık'a son yazdığım notu oku | not judged | model | 🔊 Vekil yanıt Hocam. |
| G-K1 | Tesla almak istiyorum | NEW | model | 🔊 Vekil yanıt Hocam. |
| G-K2 | Peki Model Y mi Model 3 mü daha iyi | NEW | model | 🔊 Vekil yanıt Hocam. |
| G-K3 | Yarın hava nasıl olacak | NEW | model | 🔊 Vekil yanıt Hocam. |
| G-K4 | Fenerbahçe maçı kaç kaç bitti | NEW | arama | 🔊 Kayıtlarda 0 hasta. |
| G-K5A | Dolar kaç TL | NEW | arama | 🔊 Kayıtlarda 0 hasta. |
| G-K5B | bitcoin al mı | NEW | model | 🔊 Vekil yanıt Hocam. |
| G-K6 | Bana yemek tarifi ver | NEW | model | 🔊 Vekil yanıt Hocam. |
| G-K7 | Hasta ateşi hava sıcaklığına bağlı olabilir mi | PASS | model | 🔊 Vekil yanıt Hocam. |
| G-K8 | Amoksisilin 12 kg çocuk için doz | PASS | model | 🔊 Vekil yanıt Hocam. |
| G-K9 | Bugün kaç randevum var | NEW | arama | 🔊 Bugün 0 hasta. Filtre: bugün. |
| G-K10A | Teşekkürler | PASS | model | 🔊 Vekil yanıt Hocam. |
| G-K10B | tamam | PASS | model | 🔊 Tamam Hocam... Vekil yanıt Hocam. 🖥 Vekil yanıt Hocam. |
| G-K10C | tekrar söyler misin | PASS | model | 🔊 Vekil yanıt Hocam. |
| G-K11 | Sen kimsin | PASS | model | 🔊 Vekil yanıt Hocam. |
| Y-001 | Ayşe Bozkurt dosyasını aç | NEW | model | 🔊 Vekil yanıt Hocam. |
| Y-002 | Bu hastayı bana kısaca özetler misin? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-003 | Şu anda kullandığı ilaçlar neler ve dozları nedir? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-004 | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-005 | Büyümesi nasıl gidiyor? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-006 | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-007 | Son muayeneden bu yana neler değişmiş? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-008 | Daha önce aynı şikayetle geldi mi? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-009 | Gelişimi yaşına uygun mu? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-010 | Bugün yapmam veya takip etmem gereken bir şey var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-011 | Gözümden kaçabilecek önemli bir şey var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-012 | Kan grubu ne? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada kan grubu: AB Rh+. |
| Y-013 | Alerjisi var mı? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada alerji: kayıt yok. |
| Y-014 | Kaç yaşında? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| Y-015 | Son tanısı neydi? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada son tanı: Pnömoni. |
| Y-016 | Son reçetede ne yazdık? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada son reçete: Klacid 250 mg/5 ml süspansiyon, Calpol süspansiyon (24 Eylül 2026). |
| Y-017 | Klacid dozu neydi? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-018 | Kronik hastalığı var mı? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada kronik hastalık: kayıt yok. |
| Y-019 | Gelen belgeler kutusunda bir şey var mı? | MANUAL | model | 🔊 Vekil yanıt Hocam. |
| Y-020 | Sonraki randevusu ne zaman? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada randevu: 3 Ekim 2026 — kontrol. |
| Y-021 | Son ölçümleri neler? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C, Tansiyon: 95/60 mmHg, Kilo: 19,4 kg, Boy: 110 cm. 🖥 Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg · Boy: 1… |
| Y-022 | hastamızın ateşi kaçtı son muayenede | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada son vizit: 24 Eylül 2026 — Öksürük ve ateş, 4 gündür. Dosyada son ölçüm: Ateş: 38,9 °C, Tansiyon: 95/60 mmHg, Kilo: 19,4 kg, Boy: 110 cm. 🖥 Ayşe Bozkurt — dosyada son vizit:… |
| Y-023 | bu hastanın annesinin boyu kaç | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-024 | Kaçıncı ziyareti bu? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada vizit sayısı: 1 — 24 Eylül 2026 – 24 Eylül 2026. |
| Y-025 | Tarik Ozdemir dosyasini ac | NEW | model | 🔊 Vekil yanıt Hocam. |
| Y-026 | ozetle | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-027 | ilaclari neler | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-028 | amoksisilin dozu ne kadardi | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-029 | kaç gün verdik | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-030 | asilari tam mi | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-031 | kilosu kac | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C, Kilo: 13,9 kg, Boy: 92 cm, Baş Çevresi: 49,5 cm. 🖥 Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 cm · Baş Çevresi: 49… |
| Y-032 | boyu | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-033 | bas cevresi | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-034 | persentili nasıl | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-035 | kac yasinda | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada yaş: 2 yaşında. |
| Y-036 | kaç aylık | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-037 | kan grubu | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada kan grubu: A Rh-. |
| Y-038 | penisilin alerjisi var mı | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada alerji: kayıt yok. |
| Y-039 | tahlil sonuçları geldi mi | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-040 | tanı neydi | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-041 | ne zaman kontrole çağırdık | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada plan ve takip: Amoksisilin 6 ml 12 saatte bir, 7 gün. İbuprofen ağrıda. 48-72 saat içinde düzelmezse kontrol.. |
| Y-042 | babasının telefonu | PASS | kimlik | 🔊 Tarık Özdemir için istediğiniz bilgiyi ekranınıza yazdım Hocam. 🖥 Tarık Özdemir için istenen kimlik ve iletişim bilgisine ERİŞİMİM VAR; değeri az önce ekrana yazdım (Babasının telefonu ayrıca kayı… |
| Y-043 | Ayşe, Tarık Özdemir'in son muayenesinde ateşi kaçtı | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada son vizit: 1 Ekim 2026 — Sol kulak ağrısı ve ateş, 2 gündür. Dosyada son ölçüm: Ateş: 38,7 °C, Kilo: 13,9 kg, Boy: 92 cm, Baş Çevresi: 49,5 cm. 🖥 Tarık Özdemir — dosyada so… |
| Y-044 | kendisi daha önce kulak enfeksiyonu geçirmiş mi | not judged | model | 🔊 Tarık Özdemir için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| Y-045 | gözümden kaçan bir şey var mı | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-046 | Emircan Karaoğlu | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-047 | Aşıları tam mı, eksik aşısı var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-048 | Sıradaki aşısı hangisi? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızamık-Kızamıkçık-Kab… |
| Y-049 | KKK aşısını ne zaman yaptık? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızamık-Kızamıkçık-Kab… |
| Y-050 | Hepatit B kaç doz olmuş? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-051 | Son hemogram sonuçları ne? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-052 | Ferritin kaç çıkmış? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-053 | CRP bakılmış mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-054 | Son tahlil ne zaman yapılmış? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-055 | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-056 | Büyümesi nasıl gidiyor? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-057 | Persentili kaç? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-058 | Sürekli ilaçları neler? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-059 | Son muayeneden bu yana neler değişmiş? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-060 | Daha önce aynı şikayetle geldi mi? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-061 | Gelişimi yaşına uygun mu? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-062 | Toplam kaç kez geldi? | **FAIL** | arama | 🔊 Kayıtlarda 2 hasta. Filtre: Gelme nedeni.: 1) Emircan Karaoğlu — Gelme nedeni, 2 yaş 1 ay, 30.09.2026 muayene, 20.09.2026 muayene, 30.08.2026 muayene, 30.04.2026 muayene. 2) Nermin Aydoğan — Gelme … |
| Y-063 | Son SOAP notunu oku | **FAIL** | oku | 🔊 Kayıtlarda 2 hasta. Filtre: Gelme nedeni.: 1) Emircan Karaoğlu — Gelme nedeni, 2 yaş 1 ay, 30.09.2026 muayene, 20.09.2026 muayene, 30.08.2026 muayene, 30.04.2026 muayene. 2) Nermin Aydoğan — Gelme … |
| Y-064 | Son vizitte ne not düşmüşüm? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. |
| Y-065 | İlaçları neler? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-066 | kaç kilo | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C, Tansiyon: 95/60 mmHg, Kilo: 19,4 kg, Boy: 110 cm. 🖥 Ayşe Bozkurt — dosyada son ölçüm: Ateş: 38,9 °C · Tansiyon: 95/60 mmHg · Kilo: 19,4 kg · Boy: 1… |
| Y-067 | Aşıları tam mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-068 | son muayenede tansiyonu kaçtı | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada son vizit: 24 Eylül 2026 — Öksürük ve ateş, 4 gündür. Dosyada son ölçüm: Ateş: 38,9 °C, Tansiyon: 95/60 mmHg, Kilo: 19,4 kg, Boy: 110 cm. 🖥 Ayşe Bozkurt — dosyada son vizit:… |
| Y-069 | Tarık Özdemir'in kilosu kaç? | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C, Kilo: 13,9 kg, Boy: 92 cm, Baş Çevresi: 49,5 cm. 🖥 Tarık Özdemir — dosyada son ölçüm: Ateş: 38,7 °C · Kilo: 13,9 kg · Boy: 92 cm · Baş Çevresi: 49… |
| Y-070 | peki bu hastanın kan grubu | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada kan grubu: AB Rh+. |
| Y-071 | Bugün kaç hastam var? | PASS | arama | 🔊 Bugün 1 hasta. Filtre: bugün.: 1) Nermin Aydoğan — bugün, 46 yaş 1 ay, 02.10.2026 randevu, hasta formunda geçiyor. Hangisini istiyorsunuz — birinci, ikinci, adıyla veya şikayetiyle söyleyin. 🖥 Bug… |
| Y-072 | Bugün kimler geliyor? | **FAIL** | arama | 🔊 Bugün 0 hasta. Filtre: bugün. |
| Y-073 | Yarın randevum var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| Y-074 | peki cuma? | NEW | model | 🔊 Vekil yanıt Hocam. |
| Y-075 | haftaya nasıl görünüyor | NEW | model | 🔊 Vekil yanıt Hocam. |
| Y-076 | dün kim geldi | **FAIL** | arama | 🔊 Dün 0 hasta. Filtre: dün, Gelme nedeni. 🖥 Dün 0 hasta. Filtre: dün · Gelme nedeni. |
| Y-077 | bu hafta kaç randevum var | NEW | arama | 🔊 Bu hafta 0 hasta. Filtre: bu hafta. |
| Y-078 | yarin sabah bosluk var mi | NEW | model | 🔊 Vekil yanıt Hocam. |
| Y-079 | Bugün öğleden sonra 3'te yer var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| Y-080 | Tarık Özdemir'in randevusu ne zaman? | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada randevu: randevu yok. |
| Y-081 | Olcay Santoro ne zaman gelecek? | PASS | hizli-kart | 🔊 Olcay Santoro — dosyada plan ve takip: . Dosyada randevu: randevu yok. |
| Y-082 | Kaç hastam var? | PASS | arama | 🔊 Kayıtlarda 5 hasta.: 1) Emircan Karaoğlu — 2 yaş 1 ay, 30.09.2026 muayene, 20.09.2026 muayene, 30.08.2026 muayene, 30.04.2026 muayene. 2) Nermin Aydoğan — 46 yaş 1 ay, 18.09.2026 muayene, 03.08.202… |
| Y-083 | kaç tane hasta kaydım var toplam | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| Y-084 | bu hafta kaç hasta muayene ettim | PASS | arama | 🔊 Bu hafta 0 hasta. Filtre: bu hafta. |
| Y-085 | En son hangi hastayı gördüm? | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| Y-086 | Son kaydettiğim hasta kim? | not judged | model | 🔊 Olcay Santoro için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| Y-087 | Hastalarımı listele | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| Y-088 | Aşısı eksik olan hastalarım kimler? | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| Y-089 | Bu hafta tanı koyduğum pnömoni vakası kimdi? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-090 | kulak iltihabı olan çocuk kimdi | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-091 | dün gelen ateşli çocuk | **FAIL** | hizli-kart | 🔊 Olcay Santoro — dosyada son ölçüm: kayıt yok. |
| Y-092 | E-nabız'dan yeni gelen bir şey var mı? | PASS | hizli-kart | 🔊 Olcay Santoro — dosyada son ölçüm: kayıt yok. |
| Y-093 | Gelen belgelerde bekleyen var mı? | MANUAL | model | 🔊 Vekil yanıt Hocam. |
| Y-094 | Bugün kaç reçete yazdım? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-095 | Son reçetem hangi hastaya? | **FAIL** | arama | 🔊 Kayıtlarda 0 reçete (0 hasta). |
| Y-096 | Reçeteyi nereden yazdırırım? | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-097 | QA Test Hasta 2 dosyasını aç | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-098 | Selim Erkoç'un dosyasını aç | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-099 | Mehmet Yılmaz kaç yaşında? | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| Y-100 | Ayşe Bozkurt kaç yaşında | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| Y-101 | Ayşe kaç yaşında | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| Y-102 | ... | not judged | model | 🔊 Vekil yanıt Hocam. |
| Y-103 | Emircan Karaoglu'nun kaç aşısı var | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızamık-Kızamıkçık-Kab… |
| T-001 | Bugün randevum var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-002 | Peki yarın? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-003 | Ya cuma? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-004 | Haftaya? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-005 | Yarın randevum var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-006 | Peki var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-007 | e öbür gün? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-008 | bugun randevum var mi | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-009 | peki yarin | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-010 | ya persembe | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-011 | Bugün kaç hastam var? | PASS | arama | 🔊 Bugün 1 hasta. Filtre: bugün.: 1) Nermin Aydoğan — bugün, 46 yaş 1 ay, 02.10.2026 randevu, hasta formunda geçiyor. Hangisini istiyorsunuz — birinci, ikinci, adıyla veya şikayetiyle söyleyin. 🖥 Bug… |
| T-012 | peki yarın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-013 | kimler? | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| T-014 | Bu hafta kaç randevum var? | NEW | arama | 🔊 Bu hafta 0 hasta. Filtre: bu hafta. |
| T-015 | peki haftaya? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-016 | bu hafta kimler geliyor? | NEW | arama | 🔊 Bu hafta 0 hasta. Filtre: bu hafta. |
| T-017 | yarın sabah boşluk var mı | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-018 | peki öğleden sonra? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-019 | Bugün saat 3'te yer var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-020 | peki yarın? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-021 | dün kim geldi | **FAIL** | arama | 🔊 Dün 0 hasta. Filtre: dün, Gelme nedeni. 🖥 Dün 0 hasta. Filtre: dün · Gelme nedeni. |
| T-022 | peki bugün? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-023 | ya yarın kimler? | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| T-024 | Bugün randevum var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-025 | peki Tarık Özdemir randevusu ne zaman? | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada randevu: randevu yok. |
| T-026 | peki Emircan'ın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-027 | Ayşe Bozkurt dosyasını aç | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-028 | aşıları? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada aşı: kayıtlı aşı yok. |
| T-029 | eksik olan var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-030 | peki Emircan'ın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-031 | Emircan Karaoğlu son tahlili ne? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-032 | CRP kaç? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-033 | Peki hemogram? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-034 | bir önceki? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-035 | Ayşe Bozkurt reçetesi? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-036 | dozu? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-037 | kaç gün? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-038 | Tarık recetesi ne | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-039 | dozu | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-040 | kac gun verdik | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-041 | Emircan Karaoğlu kaç kilo? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| T-042 | boyu? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-043 | persentili? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-044 | baş çevresi? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-045 | Tarık Özdemir son muayenesinde ateşi kaçtı | PASS | hizli-kart | 🔊 Tarık Özdemir — dosyada son vizit: 1 Ekim 2026 — Sol kulak ağrısı ve ateş, 2 gündür. Dosyada son ölçüm: Ateş: 38,7 °C, Kilo: 13,9 kg, Boy: 92 cm, Baş Çevresi: 49,5 cm. 🖥 Tarık Özdemir — dosyada so… |
| T-046 | tanısı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-047 | peki Emircan'ın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-048 | Emircan Karaoğlu ferritin kaç? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-049 | peki Tarık'ın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-050 | Kaç hastam var? | PASS | arama | 🔊 Kayıtlarda 5 hasta.: 1) Emircan Karaoğlu — 2 yaş 1 ay, 30.09.2026 muayene, 20.09.2026 muayene, 30.08.2026 muayene, 30.04.2026 muayene. 2) Nermin Aydoğan — 46 yaş 1 ay, 18.09.2026 muayene, 03.08.202… |
| T-051 | bu hafta kaç hasta muayene ettim? | PASS | arama | 🔊 Bu hafta 0 hasta. Filtre: bu hafta. |
| T-052 | peki son 30 gün? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-053 | Emircan Karaoğlu dosyasını aç | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-054 | kan grubu? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada kan grubu: 0 Rh+. |
| T-055 | alerjisi? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada alerji: kayıt yok. |
| T-056 | peki Ayşe Bozkurt'un? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-057 | aşıları tam mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-058 | peki Emircan'ın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-059 | kilosu? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| T-060 | Emircan Karaoğlu son vizitte ne not düşmüşüm? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. |
| T-061 | peki bir öncekinde? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-062 | Ayşe Bozkurt gelen belgeler kutusunda bir şey var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-063 | peki Emircan'ın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-064 | Emircan Karaoğlu KKK aşısını ne zaman yaptık? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızamık-Kızamıkçık-Kab… |
| T-065 | peki Hepatit B? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-066 | kaç doz? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-067 | Tarık Özdemir dosyasını aç | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-068 | ilaçları? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-069 | dozu? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-070 | kaç gün? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-071 | kaç hastam var bugün? | PASS | arama | 🔊 Bugün 1 hasta. Filtre: bugün.: 1) Nermin Aydoğan — bugün, 46 yaş 1 ay, 02.10.2026 randevu, hasta formunda geçiyor. Hangisini istiyorsunuz — birinci, ikinci, adıyla veya şikayetiyle söyleyin. 🖥 Bug… |
| T-072 | peki yarın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-073 | peki haftaya? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-074 | kimler? | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| T-075 | Emircan Karaoğlu büyümesi nasıl? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-076 | kilosu? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| T-077 | peki Tarık'ın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-078 | Emircan Karaoğlu asilari tam mi | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-079 | eksik olan var mi | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-080 | siradaki hangisi | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-081 | Ayşe Bozkurt son tanısı? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada son tanı: Pnömoni. |
| T-082 | ya ilaçları? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-083 | e dozu? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-084 | Emircan Karaoğlu son tahlili ne zaman? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-085 | sonuçları? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-086 | ferritin? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-087 | dozu? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-088 | Bugün kaç hastam var? | PASS | arama | 🔊 Bugün 1 hasta. Filtre: bugün.: 1) Nermin Aydoğan — bugün, 46 yaş 1 ay, 02.10.2026 randevu, hasta formunda geçiyor. Hangisini istiyorsunuz — birinci, ikinci, adıyla veya şikayetiyle söyleyin. 🖥 Bug… |
| T-089 | kimler? | NEW | arama | 🔊 Kayıtlarda 0 hasta. |
| T-090 | Emircan Karaoğlu ferritin kaç? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-091 | peki demir? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-092 | bir önceki? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-093 | Bu hafta kaç randevum var? | NEW | arama | 🔊 Bu hafta 0 hasta. Filtre: bu hafta. |
| T-094 | peki haftaya? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-095 | ya bu hafta kimler? | NEW | arama | 🔊 Bu hafta 5 hasta. Filtre: bu hafta.: 1) Tarık Özdemir — bu hafta, 2 yaş 7 ay, 01.10.2026 muayene, 01.10.2026 not: Sol kulak ağrısı ve ateş, 2 gündür, ilaç: Amoksisilin 250 mg/5 ml süspansiyon, ilaç… |
| T-096 | Ayşe Bozkurt kaç yaşında? | PASS | hizli-kart | 🔊 Ayşe Bozkurt — dosyada yaş: 5 yaşında. |
| T-097 | peki Tarık'ın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-098 | ya Emircan'ın? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-099 | Bugün randevum var mı? | NEW | model | 🔊 Vekil yanıt Hocam. |
| T-100 | Ayşe Bozkurt aşıları tam mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| T-101 | peki yarın randevu var mı? | NEW | hizli-kart | 🔊 Ayşe Bozkurt — dosyada randevu: 3 Ekim 2026 — kontrol. |
| I-01 | Bu hastayı bana kısaca özetler misin? | not judged | model | 🔊 Vekil yanıt Hocam. |
| I-02 | Son muayeneden bu yana neler değişmiş? | not judged | model | 🔊 Vekil yanıt Hocam. |
| I-03 | Büyümesi nasıl gidiyor? | not judged | model | 🔊 Vekil yanıt Hocam. |
| I-04 | Aşıları yaşına göre tam mı? Eksik aşısı var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| I-05 | Son lab sonuçlarında dikkat etmem gereken bir şey var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| I-06 | Şu anda kullandığı ilaçlar neler ve dozları nedir? | not judged | model | 🔊 Vekil yanıt Hocam. |
| I-07 | Daha önce aynı şikayetle geldi mi? | not judged | model | 🔊 Vekil yanıt Hocam. |
| I-08 | Gelişimi yaşına uygun mu? | not judged | model | 🔊 Vekil yanıt Hocam. |
| I-09 | Bugün yapmam veya takip etmem gereken bir şey var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| I-10 | Gözümden kaçabilecek önemli bir şey var mı? | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-01 | Fıstık alerjisini ekle | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). |
| E-02 | Yumurta alerjisi var, dosyaya işle | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). |
| E-03 | Penisilin alerjisini kaldır | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). |
| E-04 | Astım tanısını kronik hastalıklara ekle | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada kronik hastalık: kayıt yok. |
| E-05 | Kronik hastalıklarına epilepsi ekleyelim | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada kronik hastalık: kayıt yok. |
| E-06 | Kilosunu 24,8 kilo olarak ekle | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada son ölçüm: kilo 24.6 kg (12 Eylül 2026). |
| E-07 | Boyu 124 santim, kilosu 24,8; kaydet | not judged | model | 🔊 Deniz Aksoy için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| E-08 | Ateşi 38,2, kaydet | not judged | model | 🔊 Deniz Aksoy için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| E-09 | Baş çevresi 52 santim, kaydet | not judged | model | 🔊 Deniz Aksoy için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| E-10 | Amoksisilin 250 mg günde iki kez ilaçlarına ekle | NEW | model | 🔊 Vekil yanıt Hocam. |
| E-11 | Zyrtec şurup 5 mg akşamları, ilaçlarına ekle | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-12 | Ventolini kes | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-13 | Demir şurubunu keser misin | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-14 | Pulmicort dozunu günde bir keze düşür | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-15 | Singulair dozunu 10 miligrama çıkar | NEW | model | 🔊 Vekil yanıt Hocam. |
| E-16 | Dosyasına not al: annesi sigarayı bıraktı | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-17 | Şunu not düş: kontrolde EEG istenecek | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek. 10 gün sonra kontrol, 3 ay sonra astım ve epi… |
| E-18 | Hepatit B aşısı dün yapıldı, kaydet | not judged | model | 🔊 Deniz Aksoy için Aşı kaydı hazırladım. Ama Aşı, Uygulama tarihi boş — ekrandaki karttan doldurup onaylayın. |
| E-19 | KKK bugün yapıldı, dosyaya işle | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-20 | Doğum tarihini 12.03.2019 olarak düzelt | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-21 | Yarın saat 14:00 için kontrol randevusu oluştur | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek. 10 gün sonra kontrol, 3 ay sonra astım ve epi… |
| E-22 | Haftaya salı 10:30 kontrol randevusu ver | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek. 10 gün sonra kontrol, 3 ay sonra astım ve epi… |
| E-23 | Randevusunu perşembeye al | NEW | hizli-kart | 🔊 Deniz Aksoy — dosyada randevu: 12 Ekim 2026 — kontrol. |
| E-24 | Randevu saatini 15:30 olarak değiştir | NEW | hizli-kart | 🔊 Deniz Aksoy — dosyada randevu: 12 Ekim 2026 — kontrol. |
| E-25 | Randevusunu iptal et | NEW | hizli-kart | 🔊 Deniz Aksoy — dosyada randevu: 12 Ekim 2026 — kontrol. |
| E-26 | Deniz Aksoy'un fıstık alerjisini ekle | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). |
| E-27 | Deniz Aksoy için yarın 11:00'e kontrol randevusu oluştur | **FAIL** | hizli-kart | 🔊 Deniz Aksoy — dosyada plan ve takip: Klaritromisin 15 mg/kg/gün 2 dozda 10 gün. Burun lavajı. Karbamazepin düzeyi takibi için nöroloji ile görüşülecek. 10 gün sonra kontrol, 3 ay sonra astım ve epi… |
| E-28 | Deniz Aksoy'un Ventolinini kes | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-29 | Fıstık alerjisini ekle | PASS | model | 🔊 Vekil yanıt Hocam. |
| E-30 | 14:30 | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-31 | 14:30 | not judged | model | 🔊 Vekil yanıt Hocam. |
| E-32 | Alerjisi var mı | PASS | hizli-kart | 🔊 Deniz Aksoy — dosyada alerji: Penisilin (ürtiker, 3 yaşında amoksisilin sonrası). |
| E-33 | Ventolini ne zaman kestik | not judged | model | 🔊 Vekil yanıt Hocam. |
| R-ASI-1 | Aşılarını göster | NEW | hizli-kart | 🔊 Emircan Karaoğlu — dosyada aşı: 5'li Karma (DaBT-İPA-Hib) 28 Şubat 2026; OPA (Oral Polio) 28 Şubat 2026; Hepatit A 28 Şubat 2026; KPA (Konjuge Pnömokok) 30 Ağustos 2025; KKK (Kızamık-Kızamıkçık-Kab… |
| R-ASI-2 | Aşı karnesini tablo olarak göster | NEW | model | 🔊 Vekil yanıt Hocam. |
| R-ASI-3 | Emircan Karaoğlu aşı karnesini tablo olarak göster | NEW | model | 🔊 Vekil yanıt Hocam. |
| R-ASI-4 | Toplam kaç aşısı var | NEW | arama | 🔊 Kayıtlarda 0 hasta. |
| R-OLCUM-1 | Bütün muayenelerdeki kilo ölçümlerini sırayla göster | NEW | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| R-OLCUM-2 | Kilo, boy ve baş çevresi ölçümlerini tablo yap | NEW | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| R-OLCUM-3 | Tüm antropometrik ölçümlerini göster | NEW | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| R-OLCUM-4 | Baş çevresi ölçümleri neler | NEW | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| R-OLCUM-5 | Son muayenedeki boy ve kilo ölçümlerini göster | NEW | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. Dosyada son ölçüm: Kilo: 12,8 kg. |
| R-MUAYENE-1 | Son üç muayenesini özetle | NEW | model | 🔊 Vekil yanıt Hocam. |
| R-MUAYENE-2 | Bütün muayenelerini tek tek özetle | NEW | model | 🔊 Vekil yanıt Hocam. |
| R-OLCUM-METIN | 15 aylık muayenesinde kilosu kaçtı? | **FAIL** | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| R-KART-KILO | Kilosu kaç? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son ölçüm: Kilo: 12,8 kg. |
| R-KART-ALERJI | Alerjisi var mı? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada alerji: kayıt yok. |
| R-TAKVIM-BOS | Yarın 15:00 boş mu? | NEW | model | 🔊 Vekil yanıt Hocam. |
| R-TAKVIM-KIM | Yarın kimler geliyor? | NEW | arama | 🔊 Kayıtlarda 0 hasta. |
| R-KAPSAM | Bitcoin almalı mıyım? | NEW | model | 🔊 Vekil yanıt Hocam. |
| R-COUNT-ACIK-1 | En çok hangi şikayetle geldi | **FAIL** | arama | 🔊 Son 30 gün en çok görülen şikayet Sol kulak ağrısı ve ateş, 2 gündür (3). Sıra: Sol kulak ağrısı ve ateş, 2 gündür 3, Kontrol 1, Öksürük ve ateş, 4 gündür 1 (toplam 5). |
| R-SAYIM-1 | Randevu saatini değiştirmek istiyorum | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, Randevu. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · Randevu. |
| R-SAYIM-2 | Aşı karnesini tablo olarak göster | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, Aşı. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · Aşı. |
| R-SAYIM-3 | İlaç etkileşimi var mı kontrol et | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, İlaç. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. |
| R-SAYIM-4 | Epikriz hazırla | not judged | model | 🔊 Vekil yanıt Hocam. |
| R-SAYIM-5 | Otitte ilk seçenek tedavi nedir | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, Plan. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · Plan. |
| R-SAYIM-6 | Ateşli çocukta parasetamol dozu nedir | **FAIL** | arama | 🔊 Kayıtlarda 0 hasta. |
| R-SAYIM-7 | Tanı koymama yardım eder misin | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, Tanı. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · Tanı. |
| R-SAYIM-8 | Annesine ilaç kullanımını anlatan WhatsApp mesajı yaz | **FAIL** | arama | 🔊 Son 90 gün 0 hasta. Filtre: son 90 gün, İlaç. 🖥 Son 90 gün 0 hasta. Filtre: son 90 gün · İlaç. |
| R-KAPSAM06-1 | Burcu Yılmaz en son ne zaman geldi? | PASS | arama | 🔊 Kayıtlarda 0 hasta. Filtre: Gelme nedeni. |
| R-KAPSAM06-2 | Mehmet Erdoğan en son ne zaman geldi? | PASS | arama | 🔊 Kayıtlarda 0 hasta. Filtre: Gelme nedeni. |
| R-KAPSAM06-3 | Ali Erdoğan kim? | PASS | model | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-4 | Faiz Demir bugün geldi mi | PASS | arama | 🔊 Bugün 0 hasta. Filtre: bugün, Gelme nedeni, Anemi. 🖥 Bugün 0 hasta. Filtre: bugün · Gelme nedeni · Anemi. |
| R-KAPSAM06-5 | Kriptorşidizm ne zaman opere edilir? | PASS | model | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-6 | Araba tutması için ne önerirsin? | PASS | model | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-7 | İlk seçim ne olmalı? | PASS | model | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-8 | C-reactive protein yüksekliği nedenleri | PASS | model | 🔊 Vekil yanıt Hocam. |
| R-KAPSAM06-9 | Otel dönüşü döküntü yapan şey ne olabilir | PASS | arama | 🔊 Kayıtlarda 0 hasta. Filtre: Döküntü. |
| R-KAPSAM06-10 | Emircan Karaoğlu en son ne zaman geldi? | PASS | hizli-kart | 🔊 Emircan Karaoğlu — dosyada son vizit: 30 Eylül 2026 — Otit kontrolü. Dosyada plan ve takip: Tedavi tamamlandı. 1 ay sonra kontrol.. |

## How this was run, and the command for the live pass

- Branch `audit/checkpoint-karsilastirma`, created at `ac947eef`. Product code is untouched: only harness files under `lib/asistan/tests/`, this script, the npm scripts and docs were added.
- Corpus: `lib/asistan/tests/gokhanSikayetKorpusu.ts` taken from `origin/main` unchanged (`git diff origin/main -- lib/asistan/tests/gokhanSikayetKorpusu.ts` is empty). Fixture patients: the same charts (`korpusFikstur.ts`, `gokhanKorpusHastalari.ts`, `gercekciHasta.ts`), minus the name-index rows, a table this commit does not have.
- Harness adaptations (each is explained at the top of `ayseSahne.ts` and `gokhanKorpusKosucu.ts`): the route is derived because this commit logs none; the bound patient of an unnamed question is read from the chart the brain put into the model request; the guard is refused at the network boundary because this commit has no switch for it; the scrypt key derivation is memoised in the harness (this commit derives it on every decrypt), so latency was not measured.
- In-memory database: no query the fake could not run (a swallowed chart-read error would have biased the answers; none occurred).

**Live pass** (Kaan or Claude, from this worktree; 850 graded turns, 518 of them reach the model — set-up turns come on top; the run is sequential):

```sh
# the old Ayşe exactly as it shipped: this commit's own primary model
OPENROUTER_API_KEY=sk-or-… npm run denetim:korpus:checkpoint
npm run denetim:checkpoint:karsilastir
```

Progress is appended to `.denetim-out/korpus-checkpoint.ilerleme.log` while it runs. The run overwrites `.denetim-out/korpus-checkpoint.jsonl`; every row says `mode: live`. One surface or a few entries: `KORPUS_YUZEY=yazi`, `KORPUS_SADECE=Y-0,T-` (writes `korpus-checkpoint-kismi.*`, never the full file).

The checkpoint's primary model was Luna-Pro (`lib/ai/modeller.ts` at this commit); today's run used `openai/gpt-6-luna`. With the default command a difference between the two builds is code and model together. To separate them, run the old code with today's model as a second pass:

```sh
NOTYA_MODEL_HIZLI=openai/gpt-6-luna OPENROUTER_API_KEY=sk-or-… npm run denetim:korpus:checkpoint
```

Neither pass changes production, calls Fish or ElevenLabs, or uses the guard model.
