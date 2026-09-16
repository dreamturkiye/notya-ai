# README_KADIN_DOGUM — Obstetrics spine (NOTYA-KD-02, audit fix, built 2026-09-16)

**Why:** the KD chapter had the record (SAT/TDT, gravida, risk), izlem/lohusa rows, prenatal windows and the knowledge packs (PPH, PPROM, tocolysis, eclampsia, Robson/VBAC, legal forms) — but not the *operational* spine a Turkish obstetrics clinic runs on. This build adds it. Visible only for `kadin_dogum` (bebek tasks are owned by pediatri after birth; C/S preop/anestezi readable by anestezi later — V1 KD only).

**Locked rules enforced in code:** AI never locks tanı or writes C/S indication as official (the doctor selects from the SB list; the assistant only records the timestamp); tarama pozitif ≠ tanı (task list says so; Belgeler reports keep the cap rules); **taburcu cannot close without NTP-1 + HepB-1 + VitK + işitme OR a documented exception** (`taburcuKurali`, tested); live birth creates a bebek kartı **and** a bebek patient record linked to the mother; all forms land in the day's muayene note (`gununNotunaEkle`) and the Belgeler flow; no drug auto-orders anywhere (preterm card = checklist + "hekim kararı").

## What was improved over the spec
| Spec | Built |
|---|---|
| "auto tasks from EDD" | `gorevleriUret()` — 22 task templates with **exact week windows** (11+0–13+6 etc.), conditional tasks (Rh-, GBS toggle, HIV/VDRL clinic protocol, Pap), **hard reminders** (ikili, GDM, doğum planı) with a written alternative when missed (üçlü/NIPT; late 75 g OGTT). Status recomputed on read (bekliyor / pencerede / kaçırıldı / tamam / atlandı). Onam records auto-complete their task. |
| "partograf time rows" | WHO modified partograph rows + **alert/action logic** (`partografUyari`): <1 cm/h in active phase → uyarı; ≥4 h without progress → aksiyon line (decision remains the doctor's). |
| "PPH: acil_bayrak, tahmin ml" | `pphKarti()` classifies minör (500–999) / majör (≥1000) → acil flag + automatic anne komplikasyon row. |
| "preterm threat card" | `pretermOnerileri()` — steroid window 24+0–33+6 (late preterm individual), MgSO4 ≤32 hf when birth <24 h, PPROM antibiotics + koryoamniyonit watch, tocolysis only <34 hf, YDYBÜ plan <34 hf. Every line says "hekim kararı". |
| "taburcu checklist" | Gate with 4 mandatory + 6 recommended items; exception needs a type (red / erken taburcu / sevk) and ≥10-character explanation. |
| "bebek kartı" | `bebekGorevleri()`: NTP-1, HepB-1, VitK, işitme, pulse-ox, kırmızı refleks, GKD→US, D vit; **+YDYBÜ and ROP** when <34 hf or <2000 g / ≤1500 g; **erkek bebek** → hipospadias/inmemiş testis exam (üroloji task if found), sünnet onam separate; **no separate lab panel for male newborns**. |
| onam library | 13 TJOD-style templates (takip, NT, ayrıntılı US, amniyosentez, CVS, kordosentez, vajinal + müdahaleli, sezaryen **with the tüp ligasyonu box**, SSVD, D&C, ektopik, kolposkopi, sünnet). Template snapshot stored at signing; printable page `/dashboard/doktor/onam/yazdir?kod=` (name typed at print, never in the URL); e-imza later. |

## Files
`specialties/kadin-dogum/engines/dogum-spine.ts` (+ `tests/dogum-spine.test.ts`, 9 tests) · `app/api/doktor/gebelik/dogum/route.ts` (adim: gorevleri_olustur, gorev, onam, dogum_baslat, partograf, fetal_distres, cs_karar, preop/intraop/postop/ssvd/preterm, pph, komplikasyon, dogum_kaydet, lohusa_ziyaret, taburcu, bebek_tarama; GET ?gebelikId=) · `specialties/kadin-dogum/ui/DogumSpine.tsx` (tabs Takip | Onam | Travay | Doğum | Lohusa & Taburcu | Bebek) mounted in `components/doktor/HastaKdChapter.tsx` for pregnant patients · migration `029_kd_dogum_spine.sql` (gebelik_gorevleri, onamlar, dogum_olaylari, travay_partograf, komplikasyonlar, bebek_kartlari, taburcu_checklist).

## Jinekoloji spine (NOTYA-JINE-01, 2026-09-16) — part H, built beyond "minimal"

The spec asked for smear/HPV due date + stubs. Built as an office-gynecology home that renders for every female patient, pregnant or not (mounted in `HastaGebelik` next to Kadın Sağlığı):
- **Due engine** (`dueHesapla`): Pap 21–29 q3y (ofis), HPV-DNA/ko-test 30–65 q5y (SB KETEM + ofis), mamografi 40–69 q2y (yıllık on HRT), GGK 50–70, DXA 65+, RİA son kullanım by type, HRT yıllık güvenlik, HPV aşısı 9–26 (öneri, never mandatory). Histerektomi → no cervix screening.
- **Serviks action tree** (HSGM/ASCCP): Pap × HPV × age → taslak aksiyon with confidence + kolposkopi görevi; **the doctor writes/locks the resmi plan**; kolposkopi/biyopsi result recorded on the same row.
- **CYBH**: office findings (pH, whiff, clue cell, hif, trichomonas) → ön tanı; **partner treatment rule** for bacterial STIs; **first genital ulcer → HIV/RPR/HSV checklist**; HSV card with pregnancy hooks (36 hf supresyon görevi, C/S değerlendir — hekim onaylar).
- **PCOS** Rotterdam counter with **TJOD 2023 rule** (no diagnosis within a year of menarche), exclusion labs (TSH/PRL/17-OHP) required, PCOM alone ≠ PCOS, amenore ≥90 gün → endometrium protection task. Doctor types the tanı.
- **Kontrasepsiyon**: RİA insertion **blocked without STI screening**; ip kontrol (35 g), PID window (20 g), son kullanım by type (Cu 5/10, LNG 5/8) → görevler.
- **Menopoz/HRT**: pre-check (VTE, meme Ca, tanısız kanama, karaciğer = hard blocks; ET >4 mm, sigara, ≥60 yaş, >10 yıl = warnings; MG/TVUS = eksik). **HRT start is refused on a hard block**; annual safety task.
- **Lezyon** (myom/kist/polip) with FIGO tip, size, sonraki US görevi. **İnfertilite** step 1 only — Notya stops at IVF referral.
- **Kırmızı bayraklar** on every yıllık kontrol: β-hCG+ with pain/bleeding → ektopik dışla; ateş + servikal hassasiyet → PID; postmenopozal kanama → endometrium.
Tables (migration 030): `jine_vizitler`, `serviks_taramalari`, `cybh_episodlari`, `pcos_kartlari`, `lezyon_myom_kist`, `kontrasepsiyon`, `menopoz_hrt`, `jine_gorevleri`; `kadin_sagligi` gains son_pap/son_hpv/son_dxa/histerektomi/hrt. API `/api/doktor/jinekoloji` (adim-based). UI `specialties/kadin-dogum/ui/JinekolojiSpine.tsx`. 7 tests.

## Not in V1 (by spec)
IVF (placeholder in Jinekoloji), national registry integration, e-imza, anestezi cross-view of C/S preop (data is there; visibility rule later), genel cerrahi reuse of the PPH shell.
