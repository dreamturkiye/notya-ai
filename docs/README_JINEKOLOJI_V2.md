# README_JINEKOLOJI_V2 — Office gynecology V2 (NOTYA-JINE-02, built 2026-09-16)

**Goldens cited (ref_code, shown only behind the clinician "Kaynak" toggle; never on patient print):**
- **BEREK** — Berek & Novak Jinekoloji, 16. baskı (TR): AUB/PALM-COEIN, adölesan menoraji-koagülopati, erken gebelik kaybı yönetim seçenekleri.
- **SPEROFF** — Klinik Jinekolojik Endokrinoloji ve İnfertilite (TR): ağrı-infertilite ekseni, hormonal supresyonun gebelik isteğinde ertelenmesi, kalıtsal trombofili taramasının rutin olmaması.
- **TJOD_OK / TJOD_MENORAJI / TJOD_PCOS23 / TJOD_ENDO14 / TJOD_RM** — TJOD kılavuz/onam; **HSGM_HPV** — SB HPV-DNA algoritması; **WHO_MEC** — kontrasepsiyon tıbbi uygunluk (KOK kapısı); **ACOG** — kesin nonviabilite kriterleri ve PMP'de ET ≤4 mm erteleme seçeneği.

**Kept from V1 (aligned):** yıllık kontrol, smear/HPV due + SB algoritması (30–65 HPV q5y; 16/18 → kolposkopi; diğer HR + NILM → 12 ay), ko-test ofis varsayılanı, vajinit/CYBH/HSV + 36 hf köprüsü, PCOS Rotterdam + dışlama, RİA + 20 g PID penceresi, menopoz/HRT güvenlik, infertilite 1. basamak → sevk, kırmızı bayraklar (ektopik / PID / PMP).

## Added in V2 — and where the build goes beyond the ticket

| Ticket | Built | Improvement |
|---|---|---|
| 1. AUB PALM-COEIN | `aubDegerlendir()` — P-A-L-M / C-O-E-I-N checkboxes (doctor), menoraji from süre/ped/pıhtı, anemi from Hb, plan taslak (TVUS, hemogram+ferritin, TSH, β-hCG), **örnekleme kuralı**: PMP → zorunlu; ≥45 → zorunlu; <45 + obezite/anovulasyon/dirençli kronik AUB → zorunlu | **Hb/ferritin pulled from the patient's own APPROVED labs** when not typed (never invented); adölesan menorajide vWF/koagülasyon paneli (Berek %10–20 koagülopati) |
| 2. PMP pathway | Banner + `pmpKapatilabilir()` gate: closes only with **TVUS ET + endometriyal örnekleme sonucu**; "yalnız sitoloji var" explicitly refused | ET ≤4 mm tek epizod erteleme seçeneği as a note (ACOG) while the task stays open; closing the pathway auto-completes the görev |
| 3. KOK güvenlik | `kokDegerlendir()` — **WHO MEC categories**: 4 (≥35 + ≥15 sigara, VTE, auralı migren, HT ≥160/100 / vasküler, meme Ca, ağır karaciğer/tümör, postpartum <21 g, SLE+aPL, DM vasküler, cerrahi+immobil) = **başlatılamaz**; 3 (≥35 + <15 sigara, HT 140–159, aurasız migren ≥35, meme Ca >5 yıl, postpartum 21–42 g emziren, BMI ≥35, açıklanmamış kanama) = dikkat | Ticket had a flat list; MEC split gives the doctor the real grade. **Override on MEC 4 requires ≥15-character gerekçe and is logged to the day's note**; progestin-only / Cu-RİA alternatives listed automatically |
| 4. Endometriozis | `endometriozisDegerlendir()` — triad (+ infertilite, diskezi) → olasılık; ampirik NSAİİ/progestin **suggestion only when no gebelik isteği**; cerrahi sevk (endometrioma ≥4 cm, dirençli ağrı), IVF sevk (infertilite); CA-125 isteğe bağlı, "tanı koydurmaz"; **evreleme yok** | Sevk maddeleri become görevler |
| 5. Tekrarlayan gebelik kaybı | `rmDegerlendir()` — ≥2 (ESHRE) veya hekim eşiği 3 (RCOG); rutin: APS ×2 (12 hf ara), uterus kavitesi (3D TVUS/SHG/HSG), TSH; seçili: ebeveyn karyotipi (≥3 kayıp veya <36 yaş), abortus materyali; **önerilmez**: kalıtsal trombofili paneli, immünoterapi; IVF/PGT-A merkezde | "Önerilmez" items are shown crossed so the doctor doesn't order them by reflex |
| 6. Erken gebelik kaybı | `egkDegerlendir()` — **kesin nonviabilite only on CRL ≥7 mm FHR yok / MSD ≥25 mm embriyo yok**; şüphe → 7–14 gün tekrar TVUS; viabl; seçenekler (bekleme / medikal / cerrahi → dc_dusuk onamı); Rh− → anti-D görevi; β-hCG plato → ektopik/PUL görevi | β-hCG series merges typed values with **approved lab bHCG rows**; card binds to the active gebelik when <20 hf so obstetri and jine don't diverge |
| 7. Dipnot | Every node returns `dipnotlar: [{ref, not}]`; UI shows them only when the clinician toggles **Kaynak** | — |

## Tables (migration 031)
`jine_aub` · `jine_kok` (kontrol, sonuc, karar, override + gerekçe, preparat) · `jine_endometriozis` · `jine_rm` (tetkik_durumu) · `jine_egk` (gebelik_id binding, bhcg_serisi, secenek, onam_id, anti_d). API: `/api/doktor/jinekoloji` adim `aub | aub_guncelle | kok | endometriozis | rm | egk | egk_guncelle`; GET returns `v2` + `kutuphane.refler`. UI: `specialties/kadin-dogum/ui/JinekolojiV2Sekmeler.tsx` (tabs AUB / PMP · KOK kapısı · Endometriozis · Tekrarlayan kayıp · Erken gebelik kaybı) inside `JinekolojiSpine`. Engine `specialties/kadin-dogum/engines/jinekoloji-v2.ts`, 6 tests.

## Not added (by ticket)
IVF lab, robotic, genital aesthetics, violence module beyond a checkbox + sevk (not built in V2 either — ledger), Williams labour tools.
