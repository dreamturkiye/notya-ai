# Finish-all report: open items from the 2026-10-07 merges

Branch: `claude/finish-open-merge-items-n9rh70`, reset to `origin/main` at `9891987` before work.
Pushed. Not merged, auto-merge not armed, not deployed. No migration. Voice assistant, onboarding and voice profile untouched.

## Part A: the designed intake email is sent from the doctor's mailbox

**What changed**
- `lib/iletisim/bilgiFormuKutudan.ts` (new): sends `bilgi_formu` from the doctor's connected Gmail / Outlook with the designed template (`bilgiFormuEpostasi`: text + HTML, built today).
  - Everything is resolved through `iletisimHazirla` with the caller's doctor id, the same resolver the compose path uses (patient, appointment, ownership, guardian wording).
  - Consent: `gonderilebilirMi(hasta, 'eposta')`, the rule the automatic sender uses. No consent or no address → 409, nothing sent.
  - Only `bilgi_formu`; any other type is refused.
  - One send per click:
    - the button locks with a ref before React re-renders
    - the server keeps a 2-minute guard per doctor + patient + link; a repeat gets "already sent" back, never a second mail
    - a log check covers other server instances
    - a failed send is not locked, so the doctor can retry
  - Log row in `iletisim_kayitlari`: `durum gonderildi`, `otomatik false`, provider and message id. Before migration 098 it falls back to the base columns.
- `POST /api/doktor/iletisim/eposta-gonder` (new route). Doctor and secretary, same `turIzinliMi` rule as hazırla.
- `/api/doktor/iletisim/hazirla` now also returns `epostaKutusu` (`true` only for `bilgi_formu` outside the queue, when the mailbox is connected and ready).
- `GonderDugmesi`: when `epostaKutusu` is true, "E-posta ile gönder" sends from the mailbox, shows `Gönderiliyor…`, then `E-posta gönderildi: <alıcı>`. No compose window and no "Gönderildi mi?" question.
  - If the send fails, the error is shown with a one-tap fallback: "E-postayı Gmail’de aç" (or the device's choice).
  - Applies to both places: patient file `Formu hazırla` (HastaIntake) and the appointment popup. Both already use this button with `tur="bilgi_formu"`.
- **No connected mailbox:** `epostaKutusu` is false and the flow is byte-for-byte today's (compose link, plain text). WhatsApp and every other type are unchanged.
- **Isolation inventory:** the new route is classified `incelendi`.
  - The cross-doctor harness cannot produce its positive control. That would need a consented patient and a connected mailbox in the scene.
  - The route takes no id that is not resolved by `iletisimHazirla`, which the harness covers through the hazırla cases.
  - `bilgiFormuKutudan.test.ts` asserts that a foreign-id 404 passes through with no send.

**Choices to know**
- Quiet hours (07–21) and the passive-patient rule of the automatic sender are **not** applied. This is a doctor tap, like the compose path, which has neither.
- Queue items (Hazır mesajlar) keep the compose flow. `epostaKutusu` is false when a `kuyrukId` is present, so queue claiming logic is untouched.

**Not verified:** no live send through a real Gmail or Outlook mailbox and no spam check. Provider sending is the same code the automatic sender uses, tested only against mocks.

## Part B: pediatric öneriler leave the note for sick visits

- **One resolver:** `onerilerPaneliGorunurMu` (`lib/doktor/oneriPaneli.ts`) drives both the screen and the server.
- **Dikte page:** sends the visit type it read from the URL as `hastaDurumu` in the end request. It sends no checklist marks when the panel is hidden. Its local fallback list is empty then too.
- **`app/api/sessions/[id]/end`:** when the resolver says no, the checklist data is not loaded and the SOAP prompt gets no checklist block. `ai_degerlendirme` gets no ÇEK LİSTESİ block either; an empty list would otherwise have written "0/0 madde".
- **Later rebuilds:** the note page and approve route only rebuild the block when one is stored, so nothing re-adds it later.
- **Unchanged:** sağlam çocuk visits and every other branş.

**Carried-over gaps (same as the screen, from INTAKE-PORTAL-RAPOR)**
- Visits started without an appointment, and appointments booked with no box ticked, count as hasta çocuk and get no checklist.
- A dikte page opened before this deploy sends no `hastaDurumu`, so a sağlam visit finished from it gets no checklist. A reload fixes it.

## Part C: patient portal leaves background

- `app/portal/sagligim.css`: two inline-SVG clusters (top-left, bottom-right) built from the Notya leaf mark path in `DoktorChrome.tsx`.
  - Pine `#2f4334` at 7% fill and 13–15% outline, on the existing cream background.
  - A fixed `::before` layer behind the content, `pointer-events: none`, hidden in print.
  - Sized `min(340px, 64vw)` and `min(380px, 70vw)`. The CSS block is ~2.7 KB.
  - No image file. `plant.jpg` (stethoscope) is not used anywhere.
- Applied through `app/portal/layout.tsx` (`sg-yapraklar`), so every Sağlığım page gets it, including the PIN gate and the demos. The public `/randevu` booking page shares the base style but not the leaves.
- Checked as a rendered preview at 390 px and 1280 px: leaves at the edges, text readable over them. Not checked inside the real portal with live data.

## Part D: MBYS helper installable by a beta doctor

- **Build step:** `scripts/mbys-yardimci-paketle.mjs` (in `prebuild`, and as `npm run paket:mbys`) writes `.mbys-paket/mbys-yardimci.zip` (git-ignored).
  - The packer is `lib/enabiz/mbys/zipPaket.mjs`. It uses only `node:zlib`, with sorted entries and a fixed timestamp, so the same input gives the same bytes.
  - Unzipping gives one `mbys-yardimci/` folder, verified byte-identical to the source.
- **Download:** `GET /api/doktor/araclar/enabiz/mbys/yardimci`.
  - Doctor role only; a secretary gets 403. `private, no-store`.
  - Falls back to packing on the fly when the built file is missing.
  - Traced in `next.config.mjs`.
- **MBYS queue page:** new card `MbysYardimciKurulum`, shown to doctors only. It opens by itself when the helper is not detected. It has:
  - the `Yardımcıyı indir` button
  - a five-step Chrome guide (`chrome://extensions`, Geliştirici modu, `Paketlenmemiş öğe yükle`, then a reload check)
  - a visible note: "Alan eşlemesi henüz doğrulanıyor"
  - the form-map steps: `Form haritasını kopyala` on Hasta Kayıt (before typing a patient) and on Muayene, pasted into two boxes
  - `Haritayı kopyala`, which joins both into one message on the clipboard, plus `Paylaş` (device share sheet) where the browser has one
  - a second guard against personal data: `lib/enabiz/mbys/haritaMesaji.ts` refuses text that is not a helper capture, and anything with an 11-digit run (T.C.) or an e-mail address
- **Support contact:** the app shows **no Notya support address**. The only address in the UI is `kvkk@notya.ai`, on the KVKK page, for data-subject requests, and it was not reused.
  - The card tells the doctor to send the copied text "Notya ekibine, bizimle yazıştığınız e-posta ya da WhatsApp üzerinden".
  - No contact was invented. Once a support address exists, add it to this card.
- `docs/MBYS-YARDIMCI.md` install step 1 now points to the button.

**Not verified:** the download in a real browser, and the install on a real Chrome. Everything about the real MBYS screens is still unverified, as before.

## Part E: clinician review pack

- `docs/INTAKE-INCELEME-PEDIATRI.md` (Dr. Gökhan): 11 items, about 5–7 minutes.
  - P-01 to P-05: child form in both branches (parents' marital status and whether it stays required, "Evde sigara içen var mı?", no alcohol question, child hospital-stays question)
  - P-06 to P-08: pediatri feeding, vaccination, kreş/okul
  - P-09 and P-10: çocuk cerrahisi
  - P-G-01: one opinion item on under-18 patients in adult branches
- `docs/INTAKE-INCELEME-DIGER.md`: 92 items, grouped by branch with a table of contents.
  - A shared section first: hospital stays, under-18s on adult forms, pregnancy/nursing wording
  - Then genel, kardiyoloji, genel cerrahi, göz, anestezi, acil, plastik, kalp-damar, and all 10 Klinik branches
  - The two non-clinical REVIEW items (server-side section validation, Klinik dosya search) are listed at the end as "Teknik", with no decision boxes.
- Each item has the exact form text quoted from `lib/intake/*` and a choice of ☐ Evet / ☐ Hayır / ☐ Şöyle değiştirilsin.
- **One finding not in the audit, noted in DIGER:** the pregnancy/nursing question shows on `Cinsiyet = Kadın` alone, with no age limit. A young girl in a Klinik branch would see it.

## Checks run

- `npx tsc --noEmit`: clean.
- **New tests**, all pass and are added to `npm test`:
  - `lib/iletisim/bilgiFormuKutudan.test.ts`: 8
  - `lib/portal/yapraklar.test.ts`: 3
  - `lib/enabiz/mbys/yardimciPaket.test.ts`: 6
  - `lib/doktor/oneriPaneli.test.ts`: +2 server cases
- **Suites re-run:** iletisim (incl. otomatik/eposta), hasta-izolasyon + envanter, oneriPaneli, MBYS, branş sızması. 657 of 661 pass.
- **The 4 failures are pre-existing on `origin/main`** (checked by stashing this branch):
  - the envanter test lists 6 unclassified routes nobody on this branch touched: `cron/takip-hatirlatma`, `konsultasyon/defter`, `on-buro-fisilti`, `doktor/takip`, `konsultan`, `portal/.../belge/[id]`
  - one Ayşe okuma isolation case
- `npm run test:liste` still reports only `lib/doktor/hastaKlinikOzet.test.ts`, which predates this branch.
- **Not run:** the full `npm test`, and the app itself. No browser check of the send button, the dikte page, the portal or the MBYS card beyond the leaves preview.

## What still needs a person

- **A practicing doctor with MBYS access:**
  - install the helper from the new button
  - capture both screen maps and send them to the Notya team
  - then a developer fixes `extensions/mbys-yardimci/harita.json` per `docs/MBYS-YARDIMCI.md`
- **Kaan:** decide on a support contact the app can show, so the MBYS card (and later screens) can name it.
- **Clinicians:**
  - Dr. Gökhan answers `INTAKE-INCELEME-PEDIATRI.md`
  - the relevant branch doctors answer `INTAKE-INCELEME-DIGER.md`
  - a developer then applies the answers to `lib/intake/*`
- **Someone with a connected Gmail and Outlook test mailbox:** send one intake invitation each way, check that it lands in the inbox (not spam) and renders on a phone.
- **Kaan:** the 6 unclassified routes in the isolation inventory on `main` need classifying. It is out of this scope but the test is red.
