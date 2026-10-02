# Ayşe appointment capability — forensics (2026-10-01)

Owner: Claude (investigation + fix on branch `fix/ayse-randevu-capability`). Requested by Kaan.
Base: `origin/main` @ `7f902b41`.

## Symptom

Voice / chat, Turkish. The doctor says:

> Bir randevu yapmak istiyorum bir hasta için yardımcı olur musun?

Ayşe answers `Son 90 gün 0 hasta. Filtre: son 90 gün · Randevu.` — a patient-count sentence, not an
appointment flow.

## Verdict (short)

| Hypothesis | Verdict | Evidence |
|---|---|---|
| (a) Sonnet → Luna (OpenRouter) dropped tool schemas / tool-call parsing | **No.** | `lib/ai/saglayici.ts:151-152` still translates `tools` → OpenRouter `function` tools, `:90-110` and `:202-213` translate `tool_use` ↔ `tool_calls`; covered by `lib/ai/saglayici.test.ts:222-240`. `lib/asistan/ayseCevapla.ts:560` still builds `araclar` and passes them at `:590`. The model is simply never reached for this sentence. |
| (b) Deterministic patient search intercepts before the LLM | **Yes — root cause of the reported sentence.** | Trace below. |
| (c) Scope gate NOTYA-KAPSAM-01 (#515, `ee8cb9bf`) blocks or reshapes it | **No.** | `kapsamDisiMi()` returns `false` for the sentence ("randevu" and "hasta" are in-scope signals, `lib/asistan/kapsamKilidi.ts:21`). The gate is at `ayseCevapla.ts:312` and lets it through. |
| (d) Something else | **Yes — two architecture changes removed the voice tool path and the spoken confirmation.** | See "What removed the capability". |

Every row above was checked by running the current code, not by reading it only: `kapsamDisiMi`,
`kayitNiyetiMi`, `takvimSorusuCoz`, `klinikAramaMi`, `sorguyuAyikla` were called with the exact sentence
(ad-hoc `tsx` script, not committed). Output:

```
kapsamDisi: false   kayitNiyeti: false   takvim: null
klinikArama: true   ozet: "son 90 gün · Randevu"   sayim: false   cogul: false
```

## Trace of the failing sentence (current `main`)

1. `lib/asistan/ayseCevapla.ts:312` — scope gate: passes (not off-topic).
2. `ayseCevapla.ts:321-323` — calendar reader `takvimSorusuCoz`: returns `null`. The sentence has the noun
   "randevu" but no day and no question form (`lib/randevu/takvimSorusu.ts:110`).
3. `ayseCevapla.ts:443` — `hastaninSozunuCoz()` (patient resolver). No patient name matches, so it reaches
   `dosyaIleDaralt()`.
4. `lib/doktor/hastaCozumleyici.ts:371` — `klinikAramaMi(mesaj)` is **true**. Reason:
   `lib/doktor/hastaAramaFiltre.ts:100` registers `randevu` as a searchable chart field, and
   `hastaAramaFiltre.ts:642` sets `klinik` whenever any field alias appears in the text
   (`alanlar.length > 0`). The word "randevu" alone turns the sentence into an all-patients search.
5. `hastaAramaFiltre.ts:591-594` — because the text contains "randevu" and no time window, an implicit
   "son 90 gün" window is added.
6. `hastaCozumleyici.ts:393` — the search finds no patient, and returns
   `{ tur: 'yok', sayiMetin: istatistik.cumle }`. `istatistikKur()` builds that sentence at
   `hastaAramaFiltre.ts:907-918`: `"Son 90 gün 0 hasta." + " Filtre: son 90 gün · Randevu."`
7. `hastaCozumleyici.ts:55` — `cozumKonus()` returns the count sentence for `tur === 'yok'`.
8. `ayseCevapla.ts:460-462` then `:507-514` — the count sentence is returned as the final answer.
   The model, the tools and the action layer (`:560` onward) never run.

The same interception hits other non-search sentences that merely contain a field word (checked with the
same script): "Randevu konusunda yardım eder misin?", "Bir hasta için ilaç yazmak istiyorum",
"Epikriz yazmama yardım et", "Alerji testi nasıl istenir?", "Otit tedavisinde ilk seçenek antibiyotik
nedir?" all parse as `klinik: true` with an implicit 90-day window.

## What removed the capability (commits)

The count-sentence interception is **older** than the regression: it has been in the written chat path
since 21 September. What changed is that the voice channel used to bypass it.

| # | Commit | Date (author tz) | What it changed | Effect on appointments |
|---|---|---|---|---|
| 1 | `1b1d213e` (#349) | 2026-09-19 | NOTYA-EYLEM: action layer. Adds `kontrol_randevusu_olustur` (create appointment) as a confirm-card action. | Capability **added** (create). |
| 2 | `11e54b0c` | 2026-09-20 | Registers voice client tools on the live ElevenLabs agents (`dosyaya_kayit_hazirla`, `eylem_onayla`, `eylem_vazgec`). | Voice can prepare a record **by patient name** and commit on spoken "Evet". |
| 3 | `e2371dbe` | 2026-09-20 | Adds the `randevu_takvim` voice tool and `adim: 'takvim'` in `/api/asistan/ses-eylem`; shows the appointment card on `/asistan`. | Voice can read a day / check a slot. |
| 4 | `f32af073` | 2026-09-20 | Search engine: `randevu` becomes a searchable field; any field alias makes the message a clinical search. | Seed of the interception. |
| 5 | `9ca2447b` | 2026-09-21 | Written chat returns `cozumKonus()` directly; `{ tur: 'yok', sayiMetin }` on zero hits. | **Written chat** now answers a field-word sentence with the count template. Voice is unaffected (it runs on the ElevenLabs-hosted model with client tools). |
| 6 | `90270e1c` (#432) | 2026-09-25 | NOTYA-TEK-BEYIN: voice and text share `ayseCevapla`. Browser client tools become `{}` for one-brain sessions. `sesliOnay.ts` (spoken Evet) is wired into the ElevenLabs Custom-LLM endpoint `lib/asistan/sesLlm.ts`. | For doctors on the flag, voice inherits the written path: interception (#5) now applies to voice, and tools are offered only when a patient is already resolved (`ayseCevapla.ts:560`). |
| 7 | `76cc54e8` (#435) | 2026-09-25 | Ledger: one-brain voice switched ON for Kaan's test account and **Dr. Gökhan** (`NOTYA_TEK_BEYIN_DOKTORLAR`). The row itself lists "no voice calendar availability check in the new path" as a known gap. | Dr. Gökhan loses the old voice tool path on this date. |
| 8 | `06cbf3a9` (#451) | 2026-09-26 | Moves the voice session into `AsistanOturumContext.tsx`; `clientTools: tekBeyin ? {} : {…}` (now at `:1097`). | No behaviour change; current location of the disabled tools. |
| 9 | `6f93a6c8` (#464), `72706af5` (#468), `2b28022e` | 2026-09-26 … 09-29 | Sonnet → Luna / Luna-Pro / Luna migration. | **Not a cause.** Tool translation kept (see table above). |
| 10 | `48f7b6b4` | 2026-09-29 | "Ayşe full Fish Audio — no ElevenLabs ConvAI websocket". `signed-url` returns `fish: true`; the browser never calls `Conversation.startSession` for Ayşe Kaya; new route `/api/asistan/fish-tur` calls `ayseCevapla` directly. | (i) Every doctor's Ayşe voice is now on the one-brain path — the client tools are unreachable for Ayşe. (ii) **`fish-tur` never calls `sesliKarariUygula`** (`git show 48f7b6b4:app/api/asistan/fish-tur/route.ts` has no reference; `sesLlm.ts:221` still has it). A spoken "Evet" after "Onaylıyor musunuz?" is sent to the model instead of committing the pending card. Voice can no longer complete any write. |
| 11 | `a6642041` | 2026-09-29 | Calendar reads become deterministic (`takvimSorusuCoz`, no model). | Restores list / slot check in the one-brain path — but `takvimSorusu.ts:102-110` also catches "…yarın 14:30 randevu oluştur" (noun + day) and answers with a day read instead of preparing a booking. |
| 12 | `ee8cb9bf` (#515) | 2026-10-01 | NOTYA-KAPSAM-01 scope gate. | **Not a cause.** |

So the last commit where a spoken appointment request could be completed end to end was the parent of
`48f7b6b4` (ElevenLabs ConvAI still open for doctors not on the one-brain flag), and for Dr. Gökhan's
account the parent of the `NOTYA_TEK_BEYIN_DOKTORLAR` switch recorded in `76cc54e8` (2026-09-25).

## Capability inventory

"Last worked" = last commit where the path was reachable from Ayşe for a doctor in production.

| Capability | Existed? | Where | Last worked |
|---|---|---|---|
| Create appointment (voice, patient by name, spoken confirm) | Yes | `dosyaya_kayit_hazirla` client tool → `/api/asistan/ses-eylem` `hazirla` (`hastaninSozunuCoz` by name) → `eylem_onayla` → `eylemOnayla` → `kontrol_randevusu_olustur` | Parent of `48f7b6b4` (2026-09-29); for Dr. Gökhan until the flag in `76cc54e8` (2026-09-25). |
| Create appointment (text, confirm card tap) | Yes, **only when a patient is already resolved** (named in the message or open in the session) and the model chooses the tool | `ayseCevapla.ts:560`, `core/eylemler/temelEylemler.ts` `KONTROL_RANDEVUSU_OLUSTUR` | Still reachable on `main`, but not for the reported sentence (no patient → no tools → interception), and "… yarın 14:30 randevu oluştur" is taken by the calendar reader since `a6642041`. |
| Change the time of a **pending card** before confirming (voice) | Yes | `ses-eylem` `hazirla` called again for the same patient + action updates the card (NOTYA-SES-KART-GUNCELLE-01) | Parent of `48f7b6b4`. |
| Withdraw a **pending card** (voice "Hayır") | Yes | `eylem_vazgec` client tool / `sesliOnay.ts` | Parent of `48f7b6b4` on the Fish path (the ElevenLabs endpoint still has it). |
| Undo a just-created appointment | Yes (UI "Geri al", 24 h) | `KONTROL_RANDEVUSU_OLUSTUR.geriAl` | Still works (card UI). |
| List a day / a week | Yes | `randevu_takvim` → now `takvimSorusuCoz` + `doktorunGununuOku` | Works on `main`. |
| Check a slot ("yarın 15:00 boş mu") | Yes | same | Works on `main`. |
| **Reschedule an existing appointment through Ayşe** | **No code found.** | `git log --all -G` over `lib/asistan`, `core/eylemler`, `app/api/asistan`, `components/asistan`, `scripts/_el-tool-kur.mts` for randevu + iptal/ertele/taşı returns nothing. The only reschedule path is the calendar UI (`PATCH /api/doktor/randevular/[id]`). | Never existed in this repository. |
| **Cancel an existing appointment through Ayşe** | **No code found.** | Same search. Only the calendar UI (`PATCH durum=iptal`, `034e0f87` #294). | Never existed in this repository. |

On the last two rows: what the code supported was changing or withdrawing the *card* before the
confirmation, and undoing a just-created booking. A doctor experiencing those by voice would reasonably
describe them as "change the time" and "cancel". Whether the ElevenLabs-hosted model also improvised
beyond its tools cannot be established from the repository; the agent prompts live in the ElevenLabs
workspace. Reschedule and cancel of an existing appointment are therefore **new** capabilities in this
branch, not restorations.

## Limits of this investigation

- The exact sentence was executed against current code only. Running it against the 21 September tree
  (to demonstrate #5 empirically) was not possible in this sandbox; that row rests on the source at that
  commit (`git show 9ca2447b:lib/doktor/hastaCozumleyici.ts` line 193 and
  `git show 9ca2447b:app/api/asistan/chat/route.ts` lines 165-189).
- Vercel environment variables (`NOTYA_TEK_BEYIN_DOKTORLAR`, `FISH_API_KEY`) were not read; the dates
  for Dr. Gökhan's switch come from the ledger row in `76cc54e8`.
- No production data was read or written.

## Fix summary (this branch)

See `docs/OPEN-COMMITMENTS.md` § NOTYA-RANDEVU-AYSE-01 for status and open items.

1. `lib/asistan/randevuAkisi.ts` — deterministic appointment dialogue (create / move / cancel), placed in
   `ayseCevapla` after the scope gate and before the calendar reader and the patient search. No model
   call. One question at a time (patient → day → time), dates in the doctor's timezone, patient resolved
   by name within the authenticated doctor's patients only.
2. Writes still go through the confirm-card spine (`eylem_onerileri` → `core/eylemler/onayla.ts`): Ayşe
   reads back patient, day and time in one sentence; voice commits on a spoken "Evet", text on the card
   tap. Two new actions, `randevu_tasi` and `randevu_iptal`, share the calendar UI's own update plan and
   overlap check.
3. `/api/asistan/fish-tur` runs the spoken Evet / Hayır step again (dropped in `48f7b6b4`).
4. `hastaCozumleyici.ts` — a zero-hit search returns the count sentence only for an actual patient query;
   a sentence that merely contains a field word goes to the model with an instruction to ask one short
   clarifying question.
