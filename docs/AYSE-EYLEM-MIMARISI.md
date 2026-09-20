# NOTYA-EYLEM — Ayşe writes to the dosya (action layer)

Directed by Kaan 2026-09-19 after Dr. Gökhan's live request: in "Ayşe'ye Danış" he asked
Ayşe to record a Hepatit B dose she had found in the doğum epikrizi; she refused ("veri girişi
yapabilen bir araç değilim"). Core capability for ALL 30 branş + klinik vertical.

## 1. Principle (locked relationship model applies)
Ayşe PREPARES, the hekim COMMITS. Nothing is ever written by the model. A tool call only
creates a proposal (taslak); the doctor's tap on the confirm card commits it. Same rule as
Cihaz Köprüsü: confirm card ALWAYS, never silent. Audit reads: hazırlayan = Ayşe,
onaylayan = hekim.

## 2. Components
- `core/eylemler/` (never specialty-specific):
  - `types.ts` — EylemTanimi { anahtar, etiket (TR), aciklama (for the LLM tool), sema (zod),
    zorunluAlanlar, kademe: 'T1'|'T2', branslar?: SpecialtyKey[] | 'hepsi', hastaKosulu?,
    portalaYansir?: boolean, calistir(ctx, veri), geriAl(ctx, kayit), mukerrerKontrol?, makullukKontrol? }
  - `kayit.ts` — registry; core actions + actions contributed by `specialties/<name>/` manifests.
    Typed so a specialty manifest with a malformed action fails tsc.
  - `araclar.ts` — registry → Anthropic tool definitions, filtered by doctor branş(lar) + patient
    context, capped (~15) to keep prompt tokens flat.
  - `oneri.ts` — tool_use → `eylem_onerileri` row. Per-field provenance:
    `doktor_soyledi` | `dosyadan` (belge/not id + excerpt) | `tahmin`.
    A `tahmin` value is NEVER stored as a value: the field is left empty and flagged for the
    doctor to fill (fixes "tahminen Eylül 2026" class of error structurally).
  - `onayla.ts` — commit: re-validate zod server-side, doctor_id ownership of hasta AND of the
    öneri, idempotency (status transition taslak→onaylandi in one guarded UPDATE), mükerrer
    check, makullük rules in code (e.g. tarih ≥ doğum tarihi, ≤ today TRT), execute through the
    SAME service function/insert path the existing UI form uses (no second write path — if the
    UI route has inline logic, extract it to a shared lib function and have both call it),
    write `eylem_kayitlari` (before/after JSON, kaynak, sohbet mesaj id), feed hafıza learning
    (`seansIsle`-style, as the approve route does).
  - `geriAl.ts` — undo within 24h for T1 (soft revert via the action's geriAl); logged.
- Tables (next migration number after the latest in lib/db/migrations):
  `eylem_onerileri` (id, doctor_id, hasta_id, eylem_anahtar, veri jsonb, alan_kaynaklari jsonb,
  eksik_alanlar text[], kademe, durum taslak|onaylandi|vazgecildi|suresi_doldu, grup_id (batch),
  yuzey danis|sohbet|ses|not, created_at, karar_at) and `eylem_kayitlari` (id, oneri_id,
  doctor_id, hasta_id, eylem_anahtar, hedef_tablo, hedef_id, once jsonb, sonra jsonb,
  geri_alindi_at). RLS on, doctor-scoped, consistent with the isolation guardrail.
- Pseudonymisation: `/api/asistan/chat` pseudonymises. Tool payloads must never carry a patient
  identity from the model; hasta_id is resolved SERVER-SIDE from the session/context, never
  from model output. In general chat ("son hastam", a name) resolve via existing patient
  resolution; ambiguous → Ayşe asks, no card.
- UI: `components/core/EylemKarti.tsx` rendered inline in the chat stream (Danış tab,
  YaziliSohbet, in-note Ayşe box). Header: hasta adı + doğum tarihi large (wrong-patient guard).
  Editable fields with Turkish labels, empty-yellow for eksik alanlar, kaynak line
  ("Kaynak: Doğum epikrizi, s.1"), [Kaydet] [Vazgeç]. T2 shows önce → sonra diff. Batch: one
  card with checkbox rows + "Seçilenleri kaydet". After commit: "Kaydedildi · <ilgili sekmede
  gör> · Geri al". `portalaYansir` actions show "Hasta portalında da görünecek". No new screens.
  Apple-simple; works at 390px.
- API: `POST /api/doktor/eylem` (adim: onayla | vazgec | geri_al | toplu_onayla), `GET` pending
  for a hasta. Must use the shared no-store Supabase client. Add to the cross-doctor isolation
  regression suite.

## 3. Risk tiers
- T1 one tap (additive, reversible): asi_kaydi_ekle (kaynak: bu_muayenehane | dis_kurum | beyan;
  lot/uygulayan nullable for dış kayıt — extend aşı table if needed, respect migration 084
  karne kanıtı), ilac_ekle (→ hasta_ilaclar onayli+aktif, portal rule), alerji_ekle,
  kronik_hastalik_ekle, olcum_ekle (boy/kilo/baş çevresi → büyüme eğrileri; baş çevresi
  pediatri-gated; vitals), kontrol_randevusu_olustur (TRT), takip_gorevi_olustur (shared
  calendar), dosya_notu_ekle, konsultasyon_taslagi.
- T2 diff + tap: ilac_sonlandir, ilac_doz_degistir, alerji_kaldir, hasta_bilgisi_duzelt,
  onayli_nota_ek (through the existing revision/re-approve path only).
- T3 NEVER via chat — Ayşe prepares and deep-links to the screen: not onayı, resmi tanı kilidi,
  reçete / e-reçete gönderimi, onam, any silme, anything leaving the system (FHIR/HL7/Medula,
  patient messages). Enforced by absence from the registry + a guard test listing forbidden keys.

## 4. Phases (all directed "build now" 2026-09-19)
- P1: spine + tables + card + API + isolation tests + all T1 actions + prompt fix on every
  surface prompt that tells Ayşe she is read-only. New wording: she can prepare records; the
  doctor confirms with one tap; she never claims something is saved before the commit result.
- P2: T2 actions with diff, batch-from-belge ("epikrizdeki her şeyi işle"), proactive gap
  offers (when a dossier summary finds document facts missing from structured records —
  aşı, ilaç, alerji, ölçüm — Ayşe offers one batch card, once, not nagging), geri al.
- P3: sesli seans (voice creates cards into the same pending tray; commit is still a tap in
  V1), specialty chapter actions registered from specialties/ for the shipped chapters
  (kadın hastalıkları ve doğum: gebelik görevi, jine görevi; dermatoloji: lezyon kaydı, derm
  görevi; dahiliye: HT/DM ölçüm, dahiliye görevi; pediatri: gelişim/aşı) each calling the
  chapter's existing API logic, and the klinik vertical mirror (same spine, klinik personas).
  Specialty gating is explicit — no action leaks into another branş by default.

## 5. Safety
- Kill switch env `AYSE_EYLEM_KAPALI=1` → tools not offered, Ayşe falls back to summarising.
- Document text is untrusted: tools are only offered on a doctor turn; nothing commits
  without the tap; card always shows source.
- Memory (hafıza) never softens a safety check. Drug-interaction warning runs before an
  ilac_ekle card is shown and is printed on the card.
- Öneriler expire after 24h (suresi_doldu).
- No new vendor, no new cost (same Anthropic calls; tool defs filtered).

## 6. BUILD ORDERS (for Claude Code)
1. Read docs/SITE-MAP.md first, then the Danış tab route/prompt, `/api/asistan/chat`,
   `/api/doktor/not-konsult`, existing `asistan_actions` usage (reuse or supersede — decide and
   document), aşılar/ilaçlar/alerji/ölçüm/randevu write routes.
2. Branch `feat/ayse-eylem`. Stage ONLY your own files (a Cursor agent may share the tree).
   Build P1+P2+P3 in one PR. Tests for: registry/tool filtering, tahmin→eksik alan, zod
   re-validation, idempotent commit, mükerrer + makullük, geri al, T3 forbidden-key guard,
   cross-doctor isolation (doctor B cannot read/commit/undo doctor A's öneri or target hasta),
   specialty gating. `npx tsc --noEmit` + `npm test` must be green.
3. Migration: apply with `node scripts/run-sql-migration.mjs <file>.sql` (additive only; no
   change to existing columns' meaning).
4. Turkish for all UI copy/prompts; English for code comments, commits, docs.
5. Update docs/SITE-MAP.md, write docs/README_EYLEM.md (as-built), add ledger rows
   NOTYA-EYLEM-01..0N to docs/OPEN-COMMITMENTS.md — done items marked done, anything NOT
   finished listed dated 2026-09-19 with owner. Beta checklist: add an item for Dr. Gökhan
   ("Ayşe'ye dosyaya kayıt yaptırın: aşı, ilaç, ölçüm; Geri al'ı deneyin").
6. PR → `gh pr merge --admin --squash`. Poll Vercel for Ready ONCE at the end. Then verify on
   prod from data with the QA account only (synthetic patient): propose→commit→row exists→undo.
7. Write a final plain report to ~/notya-ai/.eylem-build-report.md (git-ignored or untracked,
   do not commit): PR number, migration number, what shipped per phase, what did NOT ship,
   test counts, prod verification result. State gaps plainly.
