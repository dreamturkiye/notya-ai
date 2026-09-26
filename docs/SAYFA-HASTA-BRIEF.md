# NOTYA-SAYFA-HASTA-01 — the floating assistant follows the patient whose page the doctor opens (Kaan / Dr. Gökhan, 2026-09-26)

Repo: /Users/kaan/notya-sayfa (worktree, branch feat/sayfa-hasta, base = feat/ses-sessiz which sits on origin/main). Read docs/SITE-MAP.md, components/asistan/AsistanOturumContext.tsx, components/asistan/AsistanYuzenPanel.tsx, lib/asistan/ayseCevapla.ts (contextPatientId = baglam.currentPatientId || patientId; oturumuYaz writes active_context.currentPatientId/patientName), app/api/asistan/chat/route.ts, lib/doktor/hastaCozumleyici.ts (hastaAdiCoz, hastaSahibiMi lives in ayseCevapla or lib), and the NOTYA-HASTA-ODAK-01 rule in docs/OPEN-COMMITMENTS.md.
Turkish is the product language. Do NOT push. No migrations (session JSON only). Verify: npx tsc --noEmit (only the 4 known klinikPortal errors), npm test green. Commit when green. Report to /tmp/sayfa-report.md.

## Bug (live, Dr. Gökhan)
Voice/written session started with Ayşe Yeşil in focus. The doctor navigated to Umutcan Türkoğlu's Büyüme (growth chart) page; the floating panel still showed "aktif hasta: Ayşe Yeşil" and Ayşe answered growth questions from Ayşe Yeşil's file ("karşılaştıracak ikinci bir nokta yok"), then said she cannot see the chart. She was reading the wrong child's file.

## Rule (Kaan)
The assistant follows the doctor: opening a patient's page is an explicit focus signal, equal to naming the patient. Most recent explicit signal wins:
- doctor names patient X (hastaninSozunuCoz tek) → focus X (existing);
- doctor opens patient Y's page (URL /dashboard/doktor/hastalar/<id>[/…]) → focus Y, once, on that navigation;
- an unnamed follow-up stays on the current focus (existing NOTYA-HASTA-ODAK-01 — do NOT re-introduce "page patient on every message", that was the original Ayşe Yeşil bug).
Ayşe must always know the full dossier of the focused patient — growth series included (the event index already carries 'olcum' events with Neyzi p/Z via specialties/pediatri/sorgu.ts; verify Q3 büyüme uses them).

## Build
1. Server: POST /api/asistan/oturum-hasta { asistanSessionId, patientId } — auth (pratik oturum / Bearer like chat route), verify the session belongs to the doctor and hastaSahibiMi(patientId); set asistan_sessions.active_context.currentPatientId = patientId, patientName = decrypted name, odakKaynak = 'sayfa', odakZaman = ISO. Return { ad }. Reuse the shared no-store client rule. HASTA-IZOLASYON-01: a patient of another doctor → 403, nothing written.
2. Client (AsistanOturumContext.tsx): derive the page patient id from usePathname (regex /^/dashboard/doktor/hastalar/([0-9a-f-]{36})/). When it changes to a different id while a shared session exists (ortakOturumId, voice live or sessiz or written panel open) → call oturum-hasta once per id, update the panel's "aktif hasta" label from the returned ad. No voice announcement (do not interrupt); the panel header is the signal. If no session exists yet, remember the page patient and pass it as patientId on the first yaziliGonder / signed-url call (yaziliGonder currently sends no patientId — add it).
3. Voice: nothing else — ayseCevapla reads baglam.currentPatientId each turn, so the next spoken turn is on the new patient; the name-first rule (adliDosyaCevabi) makes the switch audible.
4. Written chat: same via baglam.
5. Tests: route test (owner ok → 200 + name; other doctor's patient → 403; unknown session → 404) in the style of existing route tests; a yuzenPanel/pathname unit test for the id extraction (lib/asistan/yuzenPanel.ts: export sayfaHastaId(pathname)); ayseCevapla/tekBeyin test: after oturum-hasta switch, an unnamed "kaç kilo" question answers from the new patient (fake supabase sahne — see tekBeyin.test.ts).
6. Docs: OPEN-COMMITMENTS row NOTYA-SAYFA-HASTA-01 DONE (kod) with the rule; SITE-MAP entry for the route.
