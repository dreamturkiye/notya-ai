# GOZ-EXCEPTIONAL-01 — One-sprint Claude prompt

**Audience:** Claude (or any agent) executing a single closed sprint in `~/notya-ai`.  
**Goal:** Leave **Göz Hastalıkları** exceptional — every coverage domain in the final audit at **Strong**, all game changers shipped, göz-only Araçlar live and exceptional. No leftover Partial/Thin/Missing on the audit matrix.  
**Authority:** Final audit https://notya-ai.vercel.app/goz-final-audit.html (2026-09-18, honest ~72%). This sprint must produce a **post-exceptional** audit HTML that scores every listed domain Strong.

**Paste everything below the line into Claude.**

---

## PROMPT START

You are shipping **GOZ-EXCEPTIONAL-01** in Notya AI (`dreamturkiye/notya-ai`). One sprint. When you finish, a Turkish private-practice ophthalmologist (and a göz hastanesi poliklinik MD) must say the Göz section is **exceptional like Pediatri** — not “good for a stub.”

### Non-negotiable skills (read before any code)

1. `.cursor/skills/specialty-doktor-araclari/SKILL.md` — classify every Araçlar tile **before** add  
2. `.cursor/skills/brans-alan-sizmasi/SKILL.md` — no pediatri/KD fields on göz; veli = age-gated only  
3. `.cursor/skills/specialty-universal-vs-chapter/SKILL.md` — chapter clinical stays in `specialties/goz-hastaliklari/`  
4. `.cursor/skills/specialty-hasta-portali/SKILL.md` — Gözlerim stays patient-safe, unique  
5. `.cursor/skills/hasta-izolasyon/SKILL.md` — every patient/note/belge id API  
6. `.cursor/skills/specialty-audit-report/SKILL.md` — ship updated audit HTML at end  

### Product bar (definition of Strong)

**Strong** = clinic-ready for an 8-hour TR muayenehane / göz hastanesi **poliklinik** day: OD/OS first-class, hekim locks tanı/evre/doz, dual-sign on imaging, SUT gates real, portal unique, tests green, no cross-branş leak.

You must drive **every** domain below from its current depth to **Strong**. No “Partial left for later.” If something is truly impossible in-repo (live Medula e-imza network, TOD members-only PDF bytes not in vault), implement the **exceptional clinic substitute** listed in the Outs table and document it in OPEN-COMMITMENTS + audit “intentionally out” — do **not** leave the domain Partial without a Strong substitute ship.

### Baseline (do not regress)

Already Strong — keep and harden:

- VA/GİB sticky strip, copy-forward+onay, VA parser, Nota ekle (O)  
- DR TEMD↔ICO + dahiliye sevk close  
- Anti-VEGF SUT 4.2.33 gates  
- Acil red-flag band  
- SOAP/prompts lock (GOZ-PROMPTS-LOCK)  
- Portal Gözlerim (Strong registry module)  
- Fundus hekim kaydı (TR sıra disk→damar→makula→perifer) — extend, don’t replace  

Maturity today: `lib/specialties/goz-hastaliklari.ts` → `olgunluk: 'arastirma'`. Pediatri is `uzman-dogrulandi`.

### Sprint workstreams (all mandatory)

#### A — Coverage → Strong (chapter)

| Domain | Ship to Strong |
|--------|----------------|
| **VA / GİB** | RAPD UI on ölçüm block (`yok`/`sag`/`sol`); optional refraction fields in `goz_muayeneler.ek` (sph/cyl/axis OD/OS) — display + Nota ekle; no invented Rx. |
| **Fundus** | After Fundus Kaydet: optional “DR evresini güncelle” flow — **hekim confirms** stages, never auto-stage from AI/text. Dilate + ortam already exist. |
| **DR** | PRP / focal / grid laser log per eye (date, type, hekim); link to kontrol; still no diagnosis from chat. |
| **Glokom** | Gonioscopy (Shaffer/Spaeth free text or enum), pachymetry µm OD/OS, VF metadata (date + device name) on glokom card; due tasks unchanged (hekim intervals). If TOD PDF unavailable: ship **EGS-aligned default interval suggestions as hekim-editable presets** labeled “öneri — hekim kilitler”, never silent invent. |
| **Anti-VEGF** | IVT odası checklist (consent, eye mark, drug/lot, asepsis) on Enjeksiyon before “yapıldı”; store on `yanit` or `goz_enjeksiyonlar` jsonb. |
| **Katarakt** | Post-op day-1 / week-1 mini card (VA, GİB, kornea, endoftalmi bayrak); biometry **values hekim enters** (AL, K1/K2, A-const) stored — **never compute IOL power**. GİL SGK: expand bilgi notu + EK-3/G picker already present; Medula submit stays adapter stub with clear UI “hekim e-imza / Medula’da”. |
| **Imaging dual-sign + Belge AI** | Wire Belge Tier A (`/api/doktor/belgeler/analiz`) output **into** `goz_goruntu_okumalari` as asistan draft when modality is fundus/oct/on_segment and doctor confirms; keep dual-sign (uzman must onayla). From Göz › Görüntü: “Asistana raporla” for linked image uses same path. Single-field fundus → `tekAlanFundus` + cap ≤70%. OD/OS required. Checklist scaffold remains fallback if vision fails. Side-by-side compare already exists — add same-eye OCT thickness **text fields** hekim enters (no fake pixel overlay). |
| **Ön segment / kuru göz** | Structured biyomikroskopi form OD/OS (kapak, konjonktiva, kornea, AK, iris, lens) in `ek` or new table; keep kuru göz OSDI/Schirmer/TBUT + trend. Keratokonus: topo notes + CXL date fields (hekim) — thin protocol OK if data model + UI + nota exist. |
| **Pediatrik oftalmoloji** | ROP screening card (PMA/GA, zone/stage hekim, next screen date); cover test / Hirschberg / Krimsky free-text; keep SB sevk thresholds. Gate pediatrik UI with age/`pediatrikBaglam` — never show ROP on pure adult charts by default. |
| **Acil** | Acil şablon: kimyasal yıkama timer (start/stop + minutes logged), VA clock fields, “112 / acil — portal beklemeyin” already — expand printable/action checklist on band. |
| **SGK rapor** | Anti-VEGF path already Strong-ish — harden UX. GİL: full draft sections mirroring anti-VEGF quality (mandatory items, eksikler, kilitle) without live Medula. |
| **Intake** | Add checkboxes: ani görme kaybı, ışık çakması, perde/gölge, kimyasal temas, ağrılı kızarıklık → feed `acilTara` without free text. |
| **Voice / SOAP** | Optional one-tap “Şeridi Objektif’e yaz” (VA+GİB+last fundus line) using existing `gununNotunaEkle`; keep dose lock. |
| **Portal Gözlerim** | Kontrol due → patient-visible reminder copy already; add **doctor-triggered** hatırlatma (reuse dahiliye kohort pattern / portal mesaj) for geciken GA/OCT/IVT/kontrol — patient-safe, no tanı. If SMS infra missing: portal mesaj + in-app görev Strong substitute; document SMS as infra follow-up in OPEN-COMMITMENTS only if truly blocked. |
| **Doktor Araçları** | See workstream B — domain must become Strong. |

#### B — Göz-only Araçlar (specialty-only, exceptional)

**Bucket:** all `BRANS_DOKTOR_ARACLARI` with `branslar: ['goz-hastaliklari']` only.  
**Must NOT appear for:** pediatri, dahiliye, kardiyoloji, kadın-doğum, dermatoloji (assert in `doktorAraclari.test.ts`).  
**Never** put audit HTML, sprint ids, or person names on tiles.  
**Landing:** cards only — studios open on `/doktor-tools/<slug>`.

Ship these five (no more, no less unless a sixth is required to close a Strong domain):

| # | Title (TR, commercial) | Route | Behavior (must work end-to-end) |
|---|------------------------|-------|----------------------------------|
| 1 | **VA / logMAR** | `/doktor-tools/goz-va` | Paste/type VA (0,8 · 6/12 · 20/40 · PS…) → ondalık + logMAR + ETDRS letter Δ between two visits; OD/OS; uses `engines/va.ts`; no tanı. |
| 2 | **SUT anti-VEGF kapı** | `/doktor-tools/goz-sut-vegf` | Pick ajan/göz/basamak/MI-SVO + history stub or patient picker → `sgkKapilari` result (engeller/uyarılar); same engine as chapter. |
| 3 | **SGK rapor taslağı** | `/doktor-tools/goz-sgk-rapor` | Anti-VEGF başlangıç/idame/implant (+ GİL bilgi) draft via `gozSgkTaslak`; eksikler; no TC/dose; deep-link “Hastada aç” optional. |
| 4 | **GİL EK-3/G kodları** | `/doktor-tools/goz-gil-kod` | Browse/search EK-3/G lens codes from chapter data; **no prices**; copy code. |
| 5 | **Göz kohort paneli** | `/doktor-tools/goz-kohort` | Lists for current doctor: geciken GA/OCT görevleri, planlı IVT penceresi, DR tarama due, kontrol due — 1-tap hatırlatma / open chart (mirror Dahiliye Kohort quality). |

Each page: auth, `doktorAraciBransaUygun` guard + redirect, mobile-usable, error states, empty states, tests for happy path + foreign branş omit.

#### C — Game changers (audit list — all done)

1. GOZ-MD-BETA **pack**: synthetic smoke patients + `scripts/goz-exceptional-smoke.mts` covering every new adım; checklist doc for human MD week; **do not** silently set `olgunluk: 'uzman-dogrulandi'` unless Boss/CEO explicitly confirms in thread — if not confirmed, set `olgunluk: 'beta-hazir'` (or keep arastirma) and make audit say “Strong product / maturity pending MD sign-off” with zero Partial domains. Prefer adding `'beta-hazir'` to the olgunluk union if needed.  
2. Belge → dual-sign vision (A).  
3. Fundus → DR handoff (A).  
4. RAPD + biyomikroskopi (A).  
5. Intake red-flag checkboxes (A).  
6. Göz Araçlar 1–5 (B).  
7. Glokom cihaz meta (A).  
8. Laser + IVT checklist (A).  
9. Recall (portal/mesaj Strong path) (A).  
10. TOD: editable presets if PDF blocked (A).

#### D — Hardening / no leaks

- `npm run test:goz` green; extend engines + promptsLock ADIMLAR + tools.ts in lockstep with API `adim`s.  
- `doktorAraclari.test.ts`: goz sees 5 new tiles; pediatri/dahiliye/kardiyoloji do **not**.  
- `npm run test:brans-sizmasi` if touched.  
- No Deri/pediatri chapter content on göz charts; no göz tiles elsewhere.  
- Migrations additive (`goz_*` / `ek` jsonb); RLS doctor-own; no PHI in public HTML.  
- Update `specialties/goz-hastaliklari/README.md`, `docs/README_GOZ.md`, `docs/OPEN-COMMITMENTS.md` (close GOZ-* items you finish).

#### E — Exit audit (mandatory)

Ship `public/goz-exceptional-audit.html` (+ canvas if skill requires) with:

- Banner: **Post-exceptional sprint GOZ-EXCEPTIONAL-01**  
- Every coverage domain Depth = **Strong** (or Strong + footnote for Medula/TOD PDF intentional outs)  
- Wow bars ≥85 on all poliklinik domains; Araçlar row Strong  
- Game changers table all “Shipped”  
- Link from `docs/README_GOZ.md`  
- **Do not** link audit from Doktor Araçları  

### Explicit outs (do not fake)

| Out | Exceptional substitute |
|-----|------------------------|
| Live Medula e-imza submit | Draft + kilitle + “Medula’da hekim” CTA |
| IOL power calculation | Store biometry only; never output power |
| TOD members-only PDF embed | Hekim-editable presets + cite EGS/TEMD publicly |
| Full hospital HIS/PACS/DICOM writeback | Dual-sign + Belge Tier A + gallery |
| Oküloplastik / uvea / nöro full chapters | Out of this sprint — list in audit “next chapter”, do not mark those as Strong domains on the **existing** 16-domain matrix |
| Real SMS gateway if none exists | Portal mesaj + görev Strong path |

### Ship discipline (Notya CEO)

- Commit with clear messages; push `main` + sync `origin/dev`  
- Bypass local production-lock with `--no-verify` only if required by repo habit  
- Verify Vercel Ready at https://notya-ai.vercel.app  
- Run `npm run test:goz` and araçlar tests before claiming done  

### Definition of Done (checklist — all must pass)

```
- [ ] Final audit matrix domains (VA, Fundus, DR, Glokom, Anti-VEGF, Katarakt, Imaging, Ön segment/kuru, Pediatrik, Acil, SGK, Belge AI, Portal, Araçlar, Voice/SOAP, Intake) = Strong in goz-exceptional-audit.html
- [ ] 5 göz-only Araçlar live, guarded, tested, exceptional UX
- [ ] Zero goz tiles on pediatri/dahiliye/kardiyoloji lists
- [ ] Belge fundus/OCT analysis can land as dual-sign draft
- [ ] Fundus→DR hekim confirm path works
- [ ] RAPD + biyomikroskopi + glokom gonyo/paki/VF meta + laser log + IVT checklist + ROP card shipped
- [ ] Intake red-flag checkboxes fire acil band
- [ ] Recall path (portal/mesaj or SMS) for overdue GA/OCT/IVT/kontrol
- [ ] test:goz green; smoke script covers new adımlar
- [ ] No audit HTML on /doktor-tools
- [ ] main+dev pushed; Vercel Ready; Boss can retest
```

### Start order

1. Read skills + `public/goz-final-audit.html` + `specialties/goz-hastaliklari/README.md`  
2. Classify Araçlar (already done above) — implement catalog + pages early so they’re not bolted on  
3. Chapter gaps A (data model → API → UI → tests)  
4. Belge↔dual-sign bridge  
5. Smoke + exceptional audit HTML  
6. Push and verify Ready  

Work only in göz chapter + göz Araçlar + necessary shared hooks (portal mesaj, gununNotunaEkle, belge analiz). **Do not** add dahiliye/pediatri/KD clinical tools or universal chrome forks.

## PROMPT END
