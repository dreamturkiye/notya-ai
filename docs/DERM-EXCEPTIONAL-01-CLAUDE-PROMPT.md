# DERM-EXCEPTIONAL-01 — One-sprint Claude prompt

**Audience:** Claude (or any agent) executing a single closed sprint in `~/notya-ai`.  
**Goal:** Leave **Dermatoloji (Deri ve Zührevi)** exceptional — every coverage domain in the final audit at **Strong**, all game changers shipped, derm-only Araçlar live and exceptional. No leftover Partial/Thin/Missing on the audit matrix.  
**Authority:** Final audit https://notya-ai.vercel.app/derm-final-audit.html (2026-09-18, honest ~50%). This sprint must produce **`public/derm-exceptional-audit.html`** that scores every listed domain Strong.

**Paste everything below the line into Claude.**

---

## PROMPT START

You are shipping **DERM-EXCEPTIONAL-01** in Notya AI (`dreamturkiye/notya-ai`). One sprint. When you finish, a Turkish private-practice dermatologist (and an EAH poliklinik MD) must say the Deri & Lezyon section is **exceptional like Pediatri** — not “broad clinic-fit with stubs.”

### Non-negotiable skills (read before any code)

1. `.cursor/skills/specialty-doktor-araclari/SKILL.md` — classify every Araçlar tile **before** add  
2. `.cursor/skills/brans-alan-sizmasi/SKILL.md` — no PASI/Fitzpatrick on non-derm; no Baş Çevresi; veli = age-gated only  
3. `.cursor/skills/specialty-universal-vs-chapter/SKILL.md` — chapter clinical stays in `specialties/dermatoloji/`  
4. `.cursor/skills/specialty-hasta-portali/SKILL.md` — Derim patient-safe, unique (≠ Gözlerim ≠ büyüme)  
5. `.cursor/skills/hasta-izolasyon/SKILL.md` — every patient/note/belge/image id API  
6. `.cursor/skills/specialty-audit-report/SKILL.md` — ship updated audit HTML at end  

### Product bar (definition of Strong)

**Strong** = clinic-ready for an 8-hour TR dermatoloji poliklinik / muayenehane day: imaging axis + dual-sign, GÖP real, scores with region worksheets, fototerapi unit ops, SUT biologic draft, Derim Strong, 5 derm Araçlar, tests green, no cross-branş leak.

Drive **every** domain in `public/derm-final-audit.html` coverage table to **Strong**. If something is impossible in-repo (live Medula, FotoFinder hardware sync, Form 014 network), implement the **exceptional clinic substitute** in the Outs table and footnote it — do **not** leave Partial without a Strong substitute.

### Baseline (do not regress)

Already Strong — keep and harden:

- DermSpine lezyon→ABCDE→biyopsi→patoloji  
- GÖP izotretinoin (`gop-isotretinoin.ts` + GopBlok + KD β-hCG bridge)  
- İşlem odası (punch/shave/kriyo/koter + onam)  
- DERM-PROMPTS-LOCK (dose + form-name locks)  

Maturity today: `lib/specialties/dermatoloji.ts` → `olgunluk: 'arastirma'`; portal Derim `derinlik: 'Partial'`. Pediatri = `uzman-dogrulandi`. Göz final ~72%.

### Sprint workstreams (all mandatory)

#### A — Coverage → Strong (chapter)

| Domain | Ship to Strong |
|--------|----------------|
| **Skorlar** | Region worksheets for PASI + EASI (and SCORAD) using `engines/score-calculator.ts`; persist `derm_skor_anlari`; SkorPaneli shows calculated totals + breakdown; DLQI/UAS7/SALT remain structured entry. No free-number-only for PASI/EASI. |
| **Fototerapi** | Unit v2: MED entry, dose-step log per session, burn protocol checklist, per-device cumulative J + annual TBSE reminder task; keep solaryum forbidden. Nurse-friendly defter UX in `FototerapiDefteri.tsx`. |
| **Yama** | European baseline allergen grid (selectable series) + D2/D4 readings with photo kinds; multi-course calendar; room schedule optional if simple. |
| **Biyolojik / SUT** | Report draft quality like göz anti-VEGF: mandatory items, eksikler, kilitle; use PSOKİD 2025 + SUT cites (role/year, no book dump); lab kapısı already exists — wire into draft. **No invented doses.** |
| **Akne** | IGA / severity worksheet; month-0 and month-3 photo series linked to isotretinoin course (already supported in imaging series — UX it). |
| **Psoriasis** | PSOKİD treatment-ladder decision card (hekim locks step); PASI/DLQI trend; joint/PsA triage checkbox + sevk hint — no fake rheumatology chapter. |
| **Atopi** | TDD 2018 step card + SCORAD worksheet; ped bridge stays, no pediatri UI leak. |
| **Dermoskopi / dual-sign** | Wire Belge Tier A (`/api/doktor/belgeler/analiz`, modalities derm/dermatoskopi) **into** `derm_vision_reads` as asistan draft; uzman onay required. Expose 3-point / 7-point / CASH worksheets from `imaging/dermoscopy.ts` in UI. Fitzpatrick capture when relevant (cap rules already in fusion). |
| **Vücut haritası** | Interactive region diagram (click → lezyon_id); replace string-only node list as primary UX; keep nodeIds in model. |
| **İşlem odası** | Printable onam + specimen label stubs (no PHI in URL); pathology follow-up task already — polish. |
| **Estetik / legal** | Lot number + complication intake fields on kozmetik procedures; keep tab gated; Ayakta Teşhis hekim-only copy. |
| **Acil** | Sticky band: SJS/TEN, eritrodermi, anjioödem airway, nekrotizan fasit şüphesi, yaygın bül — from intake checkboxes + complaint scan (göz acil pattern). |
| **Behçet / büllöz / BZBH** | Structured follow cards beyond checkboxes; Form 014 **printable draft** (no network submit if blocked). |
| **Saç-tırnak** | SALT worksheet + trichoscopy note fields linked to photos. |
| **Belge AI** | Same dual-sign bridge as imaging; BelgeAnalizOzet → “Görüntü okumasına aktar”. |
| **Intake** | Checkboxes: yaygın döküntü+ateş, nefes darlığı/anjioödem, kimyasal yanık deri, gebelik (GÖP), fototerapi/yama öyküsü, yeni ilaç → feed acil + GÖP hints. |
| **SOAP / prompts** | Expand soap-derm.md to match engines (scores, GÖP, foto dual-sign, fototerapi) without book quotes; keep locks; promptsLock tests green. |
| **Portal Derim** | Upgrade registry `derinlik: 'Strong'`; doctor-triggered hatırlatmalar: β-hCG due, fototerapi seans, yama D2/D4, yara kontrol, TBSE — patient-safe copy only (no skor/doz/tanı). Demo fixture if missing. |
| **Doktor Araçları** | Workstream B → domain Strong. |

#### B — Derm-only Araçlar (specialty-only, exceptional)

**Bucket:** `BRANS_DOKTOR_ARACLARI` with `branslar: ['dermatoloji']` only.  
**Must NOT appear for:** pediatri, dahiliye, kardiyoloji, göz-hastaliklari, kadın-doğum (assert in `doktorAraclari.test.ts`).  
**Never** audit HTML, sprint ids, or person names on tiles. Cards on landing only.

Ship these five:

| # | Title (TR, commercial) | Route | Behavior |
|---|------------------------|-------|----------|
| 1 | **PASI / EASI hesap** | `/doktor-tools/derm-pasi` | Region UI → `score-calculator`; show total + band; copy result; optional “hastaya kaydet” if patient context. |
| 2 | **GÖP izotretinoin kapı** | `/doktor-tools/derm-gop` | Sex, β-hCG, kontrasepsiyon, lab stubs → `gopIsotretinoin` engeller/uyarılar; same engine as chapter. |
| 3 | **Fototerapi defteri** | `/doktor-tools/derm-fototerapi` | Device, J/cm², cumulative, burn flag; uses `phototherapy-log`. |
| 4 | **Yama D2/D4** | `/doktor-tools/derm-yama` | Start course → D2/D4 dates; allergen grid lite; `patch-calendar`. |
| 5 | **Derm kohort** | `/doktor-tools/derm-kohort` | Geciken: TBSE, yama okuma, fototerapi seans, β-hCG, biyolojik lab, melanom görev — 1-tap hatırlatma / open chart (Dahiliye/Göz kohort quality). |

Each page: auth, `doktorAraciBransaUygun` + redirect, mobile-usable, empty/error states, tests.

#### C — Game changers (all done)

1. Bölge PASI/EASI (+SCORAD)  
2. Fototerapi ünitesi v2  
3. Five derm Araçlar  
4. Belge → dual-sign vision  
5. Biyolojik SUT rapor taslağı  
6. Interactive body map  
7. Acil sticky + intake  
8. Yama Avrupa baz + calendar  
9. Derim → Strong  
10. DERM-MD-BETA pack: synthetic patients + `scripts/derm-exceptional-smoke.mts` covering new adıms; checklist for human MD week. **Do not** set `olgunluk: 'uzman-dogrulandi'` unless Boss confirms — else `beta-hazir` (add to union if needed) and audit says Strong product / maturity pending MD.

#### D — Hardening / no leaks

- `npm run test:derm` green; extend engines + promptsLock + tools in lockstep with API.  
- `doktorAraclari.test.ts`: dermatoloji sees 5 new tiles; pediatri/göz/dahiliye do **not**.  
- `npm run test:brans-sizmasi` if shared chrome touched.  
- No PASI on göz/KD charts; Deri tab specialty-gated (already policy — verify).  
- Migrations additive; RLS doctor-own; no PHI in public HTML.  
- Update `specialties/dermatoloji/README.md`, `docs/README_DERMATOLOJI.md`, `docs/OPEN-COMMITMENTS.md`.

#### E — Exit audit (mandatory)

Ship `public/derm-exceptional-audit.html` (+ canvas optional):

- Banner: **Post-exceptional sprint DERM-EXCEPTIONAL-01**  
- Every coverage domain Depth = **Strong** (footnotes for Medula/Form014/FotoFinder outs)  
- Wow bars ≥85 on poliklinik domains; Araçlar Strong; Derim Strong  
- Game changers all Shipped  
- Link from `docs/README_DERMATOLOJI.md`  
- **Do not** link from Doktor Araçları  

### Explicit outs (do not fake)

| Out | Exceptional substitute |
|-----|------------------------|
| Live Medula e-imza | Draft + kilitle + “Medula’da hekim” |
| FotoFinder / MoleMax sync | Manual series + region map + dual-sign |
| Form 014 network | Printable draft + checklist |
| Invented biologic / isotretinoin doses | Gates + hekim fields only |
| Full inpatient ward HIS | Poliklinik + ünite ops Strong |

### Ship discipline (Notya CEO)

- Commit clearly; push `main` + sync `origin/dev`  
- `--no-verify` only if local production-lock blocks  
- Vercel Ready at https://notya-ai.vercel.app  
- `npm run test:derm` + araçlar tests before Done  

### Definition of Done

```
- [ ] derm-exceptional-audit.html: all final-audit domains Strong
- [ ] 5 derm-only Araçlar live, guarded, tested, exceptional UX
- [ ] Zero derm tiles on pediatri/göz/dahiliye lists
- [ ] Belge derm analysis → derm_vision_reads dual-sign draft
- [ ] PASI/EASI region UI + fototerapi v2 + biyolojik SUT draft + body map + acil band + yama grid shipped
- [ ] Derim registry Strong + doctor-triggered hatırlatmalar
- [ ] Intake red-flag / GÖP checkboxes
- [ ] test:derm green; exceptional smoke covers new paths
- [ ] No audit HTML on /doktor-tools
- [ ] main+dev pushed; Vercel Ready
```

### Start order

1. Read skills + `public/derm-final-audit.html` + `specialties/dermatoloji/README.md`  
2. Catalog + implement 5 Araçlar early  
3. Scores UI + fototerapi v2 + SUT biologic + vision bridge + body map + acil + yama + Derim  
4. Smoke + exceptional audit HTML  
5. Push and verify Ready  

Work only in dermatoloji chapter + derm Araçlar + necessary shared hooks (portal mesaj, belge analiz, gununNotunaEkle). **Do not** add göz/pediatri/KD clinical tools or fork base epikriz/ICD.

## PROMPT END
