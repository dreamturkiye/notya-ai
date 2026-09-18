# README_DERMATOLOJI — Dermatoloji eksik paket (NOTYA-DERM-02, 2026-09-16)

Chapter code and engine table: `specialties/dermatoloji/README.md`.

- **Exit audit (2026-09-18, post-exceptional):** `public/derm-exceptional-audit.html` — 21/21 domains Strong, 5 derm-only Araçlar, Derim Strong, `olgunluk: beta-hazir`. Never linked from Doktor Araçları.
- **Final audit (2026-09-18, honest ~50%, the pre-sprint baseline):** https://notya-ai.vercel.app/derm-final-audit.html — clinic-fit breadth, Partial skor/foto/SUT/Derim, 0 derm Araçlar
- **Exceptional sprint prompt (Claude paste-ready):** `docs/DERM-EXCEPTIONAL-01-CLAUDE-PROMPT.md`
- Portal: Derim (`lib/portal/moduller.ts`) — **Strong**, reminders from `specialties/dermatoloji/engines/portal-derim.ts`; skill: `.cursor/skills/specialty-hasta-portali/SKILL.md`
- Tests: `npm run test:derm`, `npm run test:brans-sizmasi`, `npm run test:izolasyon`. Runtime smoke: `npx tsx scripts/derm-exceptional-smoke.mts` (+ `scripts/derm-prompts-smoke.mts`). MD field week: `docs/DERM-MD-BETA.md`.

## DERM-EXCEPTIONAL-01 — workstreams C (partial) / D / E (2026-09-18)

| Ticket | Built | Notes |
|---|---|---|
| Belge → dual-sign vision | `specialties/dermatoloji/imaging/belgeKopru.ts` + `POST /api/doktor/dermatoloji` `action: 'goruntu-okuma'` (`belge_taslak` / `asistana_raporla`) → `derm_vision_reads` **asistan draft**, uzman onay required | Modalities `derm` / `dermatoskopi` / `yara`. Body region required (a read is per lesion; "tüm vücut" refused). Unknown Fitzpatrick → confidence ≤ %70. Model diagnoses written as "olası bulgu — tanı değildir"; resmî tanı stays a hekim lock on the lesion card, histopatoloji decides. Errored / low-quality analysis → morphology checklist scaffold instead. One Tier A path (`core/belgeler/tierA.ts`, shared with göz). UI: `ui/BelgeAnalizOzet.tsx` "Görüntü okumasına aktar". Migration `054_derm_exceptional.sql`. The shared Belge page bridge box stays göz-only (`bransKurali.goruntuOkumaKoprusu`) — OD/OS never renders on a derm screen. |
| Portal Derim → Strong | `lib/specialties/dermatoloji.ts` `portal[0].derinlik = 'Strong'`, `olgunluk: 'beta-hazir'`; `engines/portal-derim.ts` | Doctor-triggered, patient-safe: aylık kan testi (β-hCG) vadesi, fototerapi seansı, yama D2/D4, yara/dikiş/biyopsi kontrolü, TBSE, kontrol fotoğrafı — with geciken / yaklaşan. Titles come from the task **code**, not the doctor's task text. `hastaDiliTemizMi` blocks skor / doz / ilaç adı / tanı. |
| MD beta pack | `docs/DERM-MD-BETA.md` + `scripts/derm-exceptional-smoke.mts` | Mirrors `docs/GOZ-MD-BETA.md` / `scripts/goz-exceptional-smoke.mts`. The live smoke run waits on migration `054` being applied (DERM-054-MIGRATION in `docs/OPEN-COMMITMENTS.md`). |
| hasta-izolasyon | New A↔B case in `lib/security/hasta-izolasyon.test.ts`: `goruntu-okuma belge_taslak` refuses a foreign Belge analysis (404) | `lib/security/hastaIzolasyonEnvanteri.ts` note; no new route file was added. |

Open decisions are in `docs/OPEN-COMMITMENTS.md` → **Dermatoloji (Deri ve Zührevi) — chapter**: MD sign-off, Medula, Form 014, FotoFinder, real imaging QA, SMS.

**Prior audit (NOTYA-DERM-02):** the chapter already had (Cursor clinic-fit): lezyon + vücut haritası + foto serisi (aynı lezyon_id), dermoskopi galerisi, PASI/EASI/DLQI/UAS7/SALT/PDAI skor anları (spark vs önceki), fototerapi defteri (cihaz, J/cm², kümülatif doz, yanık), yama kursları (48/96 s okuma takvimi), izotretinoin GOP motoru, biyolojik TB/HBV alanları, onam paneli, karar kartları, vision reads. Built only the gaps; nothing duplicated. **Visibility: dermatoloji only** — partograf/C-S/NST/ikili tarama never appear here.

| Ticket | Built (gap) | Improvement |
|---|---|---|
| A. Lezyon + dermoskopi | `derm_lezyonlar` gains size_mm, ABCDE, dermoskop notu/uyarı, çirkin ördek, engine draft, **resmi tanı (hekim)**, acil, patoloji bağı | `lezyonDegerlendir()`: ≥3 ABCDE or dermoscopy alert or ugly-duckling → **melanom şüphesi = acil bayrak + sevk görevi**, shave biopsy explicitly discouraged; asistan tanı koymaz. Görüntü raporu = Belgeler › Asistana raporla (Derm Foundation / Claude, engines unchanged — no new weights) |
| B. Biyopsi paketi | `derm_islemler` (punch/shave/eksizyon) with onam snapshot into `onamlar`, işlem notu alanları (anestezi, punch mm/sınır mm, sütür, hemostaz, numune etiketi), sütür + patoloji görevleri | Patoloji sonucu **aynı lezyon_id'ye** ve işlem satırına bağlanır, günün notuna düşer; Path belge → Belgeler › Asistana raporla (hekim kilitler) |
| C. Skorlar | already there | — |
| D. Fototerapi | already there | — |
| E. Yama | already there | — |
| F. Küçük cerrahi | kriyo / koter / tırnak avülsiyonu / siğil / küretaj in the same table with **template wound-care instructions** and a kontrol görevi per kind | Templates are derm's; the checklist shell is shareable with genel cerrahi later |
| G. İlaç güvenlik | **İzotretinoin gate**: kadın hasta → son 30 gün negatif β-hCG **onaylı labdan** + korunma onamı, else refused; aylık β-hCG görevi; **cross-specialty task written to jine_gorevleri** so kadın-doğum sees it for the same patient. **Biyolojik gate**: IGRA/PPD (≤12 ay), HBsAg, Anti-HBc, Anti-HCV, HIV, hemogram/ALT from approved labs + approved CXR report; positives → latent TB / HBV profilaksi warnings; start refused when incomplete | New canonical lab keys: IGRA, HBsAg, AntiHBs, AntiHBc, AntiHCV, HIV, PPD (metin sonuçlar) |
| H. Pediatrik | atopik / hemanjiom / pişik templates; if the patient is a bebek (bebek_kartlari.bebek_patient_id) the task is also written to the bebek kartı (pediatri/Ayşe görür) | — |
| I. Kozmetik | tab **off by default** ("+ Kozmetik" reveals it); botoks / dolgu / lazer onam stubs only; no AI | — |

Files: `specialties/dermatoloji/engines/derm-spine.ts` (+ 4 tests), API `/api/doktor/dermatoloji/spine` (adim: lezyon_degerlendir | lezyon_tani | onam | islem | islem_patoloji | biyolojik_kapisi | biyolojik_basla | izotretinoin_basla | pediatrik | gorev), UI `specialties/dermatoloji/ui/DermSpine.tsx` mounted in `components/doktor/HastaDermatoloji.tsx`, migration `032_derm_spine.sql` (derm_lezyonlar columns, derm_islemler, derm_ilac_guvenlik, derm_gorevleri).
