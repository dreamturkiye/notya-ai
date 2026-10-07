# Intake email, intake audit, pediatric suggestions, portal background: report (2026-10-07)

Branch: `claude/intake-forms-pediatric-audit-60t4qc`. Not merged, no auto-merge, not deployed.

## Part 1: intake invitation email (NOTYA-INTAKE-EPOSTA)

**Paths that send the invitation:**

1. **One-tap compose links.** Two "Gönder" buttons start this path:
   - `components/doktor/HastaIntake.tsx` (patient file → "Formu hazırla")
   - the randevu popup after saving an appointment (`app/dashboard/doktor/randevular/page.tsx`)

   Both POST to `/api/doktor/iletisim/hazirla` → `iletisimHazirla` → `mesajHazirla('bilgi_formu')`. That text then goes into the mailto / Gmail web / Outlook web link (`lib/iletisim/baglantilar.ts → epostaLinki`) and into the WhatsApp link.
2. **Connected mailbox.** `lib/iletisim/otomatikGonderim.ts` → `epostaAdaptoru` → `lib/iletisim/otomatik/eposta`. `bilgi_formu` is an allowed automatic type, but **nothing queues it today**: no `kuyrugaEkle` call uses `bilgi_formu`. In practice the invitation still leaves only through path 1. The designed mail takes effect as soon as a `bilgi_formu` queue item goes out through the connected mailbox. Making the invitation send from the mailbox by itself is a product decision and was not added. Waits on Kaan.

**What changed:**

- **Plain text** (`lib/iletisim/sablonlar.ts → bilgiFormuSatirlari`). It is shared by all compose links and WhatsApp, and is also the text part of the designed mail. Line by line:
  - greeting
  - "Dr. X, <hasta> için hazırlanan Hasta Bilgi Formu’nu randevudan önce doldurmanızı rica ediyor."
  - the link alone on its own line
  - one line on why it helps
  - "Bu bağlantı size özeldir; lütfen başkalarıyla paylaşmayın."
  - "Saygılarımızla," and the doctor's name

  Same subject (`Hasta bilgi formu · Dr. X`) and same variables. No duration is promised: the old "kısa form" line is gone. Minors keep the guardian wording ("çocuğunuz için").
- **HTML part** (`lib/iletisim/bilgiFormuEposta.ts`):
  - Layout: table layout with inline CSS, a cream background (#FAF8F4) and ink text.
  - Header: pine (#0e6b66), with the doctor's name as text.
  - Link: one pine "Formu doldur" button, with the full notya.io link repeated as text under it.
  - Footer: muted, "Bu e-posta Dr. <ad> adına Notya üzerinden gönderildi."
  - Left out: images (no background, no leaves, no logo, no tracking pixel), `<style>`, scripts and web fonts.
  - The only link target is the https notya.io link. Any other link drops the HTML and sends text only.
  - Size is about 3 KB.
- **MIME** (`lib/iletisim/otomatik/eposta/mime.ts`):
  - With an HTML part, the mail is `multipart/alternative`: text first, then HTML. With attachments it is nested inside `multipart/mixed`.
  - Without an HTML part, every other mail is byte-for-byte unchanged (tested).
  - HTML that carries a script is dropped.
- **Providers:**
  - **Gmail** gets the MIME message as before.
  - **Outlook / Graph:** the JSON body can hold only one content type. So when HTML is present, the same MIME message is sent through `sendMail` as base64 MIME with `Content-Type: text/plain`, as documented for Graph. All other Outlook mails keep the JSON path unchanged.

**Not verified:** no live send through a real Gmail or Outlook mailbox, and no spam-score check (mail-tester or similar). The Graph MIME path is tested only against a mocked fetch.

## Part 2: pediatric öneriler panel (NOTYA-PEDI-ONERI-01)

**How the type is determined:**

- The appointment form's "Hasta Durumu" checkboxes write `randevular.hasta_durumu`:
  - **Sağlam** → `'saglikli'` = sağlam çocuk muayenesi
  - **Hasta** → `'sikayetli'` = hasta çocuk muayenesi
- Both "🩺 Muayeneyi Başlat" buttons on the randevu screen now build the dikte URL with `muayeneBaslatYolu`, which adds `&hastaDurumu=<value>`.
- `app/session/new/page.tsx` reads the value and asks `onerilerPaneliGorunurMu` (`lib/doktor/oneriPaneli.ts`):
  - **Pediatri** (via `etkinBrans`): the panel shows only for `'saglikli'`. `'sikayetli'`, missing, empty or unknown values all hide it.
  - **Every other branş:** the panel always shows, as before. This includes çocuk cerrahisi.
- When the panel is hidden, the recording view drops to one column, and the locked checklist on the done screen is hidden too.

**Cases not covered:**

- **Start points without an appointment.** These count as hasta çocuk (panel hidden) even when the patient has a sağlam appointment today:
  - the patient file "Muayene başlat" button
  - HastaKonsult / HastaDermatoloji
  - opening `/session/new` directly

  The page does not look up the appointment from the patient and time.
- **No box ticked at booking.** An appointment booked without ticking a box has `hasta_durumu = null` and counts as hasta çocuk.
- **Server side unchanged.** For pediatric patients, the server still builds the checklist and still adds it to the SOAP prompt and the `ai_degerlendirme` checklist block (`app/api/sessions/[id]/end`), whatever the visit type. Only the panel follows the rule. Applying the rule on the server too is a clinical decision. Waits on Kaan.
- **Brief flash on load.** The page starts with `specialty = "genel"` until the doctor's branch loads. During that moment a pediatrician sees the default behaviour (panel on) before it hides.

## Part 3: intake forms (NOTYA-INTAKE-DENETIM)

The per-form detail is in `docs/INTAKE-DENETIM.md`.

**3a: pediatric marital status.** "Medeni Durum" is now "Anne ve babanın medeni durumu":
- Options: Evli / Boşanmış / Ayrı yaşıyor / Evli değil / Anne veya baba vefat etti.
- Same key (`medeniDurum`); old 'Evli' and 'Boşanmış' answers match word for word.
- Applies to pediatri and çocuk cerrahisi.

**3b: audit.**
- **Child forms** (pediatri, çocuk cerrahisi):
  - smoking became "Evde sigara içen var mı?"; alcohol is not asked
  - çocuk cerrahisi used to ask the child medeni durum, smoking and alcohol
- **Core:** optional hospital stays question added.
- **Pediatri:** optional feeding, vaccination and kreş/okul questions added.
- **`genel`:** now asks the reason for the visit.
- **Pregnancy / nursing:** added (shown for Kadın) to plastik cerrahi, anestezi and six Klinik branches.
- **Klinik branches:** the 10 branches used to fall back to `genel` with no branch questions. Each now keeps its slug and gets its own section (`lib/intake/klinikSorulari.ts`). A single resolver (`lib/intake/formBransi.ts`) drives the form routes, the doctor's dropdown (new "Klinik" group), the doctor's view of answers and the link preview. A branch requested by the client is now validated instead of stored as is.
- **Kept as is:** no stored field was deleted or renamed. Doctor branch sections are unchanged except pediatri, plastik cerrahi and anestezi.

**REVIEW** (open, for clinicians):
- every new question
- minors in adult branches still get the adult core
- branch sections are not validated on the server (this predates the audit)
- Klinik answers are not indexed in dosya field search
- duplicate smoking, allergy and medicine questions in some branches

## Part 4: portal background (NOTYA-PORTAL-YAPRAK-01): STOPPED

- **Search result:**
  - The only leaves artwork in the repo is `public/doktor-chrome/plant.jpg`. It is the combined image: paper leaves with a stethoscope lying across the middle.
  - There is no leaves-only asset, and no SVG, PNG or WebP of the leaves.
  - The `public/sagligim/*` images are photos.
  - The only leaves outside images are inline SVG leaf icons, which are logo marks, not the artwork.
- **Not done:** per the instruction, the combined image was not used and not cropped. Nothing on the portal changed.
- **Needed from Kaan:**
  - a leaves-only image: transparent PNG/WebP or SVG, light (under ~100 KB)
  - same paper-leaf style as `plant.jpg`, without the stethoscope

## Checks run

- **Type check:** `npx tsc --noEmit` is clean.
- **New tests:**
  - `lib/iletisim/bilgiFormuEposta.test.ts`: email builder, deliverability, MIME
  - `lib/doktor/oneriPaneli.test.ts`: suggestions rule
  - `lib/intake/formDenetim.test.ts`: all 41 forms
  - the Graph MIME case in `saglayicilar.test.ts`
  - the updated intake text test in `iletisim.test.ts`

  All pass and are listed in `npm test`.
- **Full `npm test`:**
  - This branch: 5037 pass, 24 fail. `origin/main`: 4968 pass, 26 fail, with the same failures plus one more.
  - The failing tests are assistant, voice and route tests that need env or network. This work adds no new failures.
- **`npm run test:liste`** reports `lib/doktor/hastaKlinikOzet.test.ts` missing from `npm test`. That gap predates this branch.
- **Not checked:**
  - the forms, dikte page and email on a phone, or in a browser at all (no run of the app)
  - a live email send
