# Ayşe — identity fields as placeholders, and analysis across visits

Ledger ids: NOTYA-AYSE-ALAN-01, NOTYA-AYSE-ANALIZ-01 (owner Claude). Branch `feat/ayse-alan-ve-analiz`, created from
`origin/fix/ayse-arac-pariteti` (NOTYA-AYSE-ARAC-PARITE, `docs/ayse-arac-pariteti.md`). Written 2026-10-02.
Source: Dr. Gökhan's live feedback; both goals approved by Kaan on 2026-10-02.

Not merged, not deployed. Nothing here is shipped until the SHA is on `origin/main` and the Vercel deployment at that
SHA is READY.

## A. Identity and contact fields that never reach the model (NOTYA-AYSE-ALAN-01)

### The gap

`lib/doktor/kimlikSorusu.ts` answers parent names, guardian, phone, e-mail, address, birth place and birth date
without the model, and the chart deliberately never carries those values to the model (KVKK, VELI-YASAL-ONAM). When the
doctor's phrasing is one the classifier does not list ("annesine nasıl hitap edeyim", "nerede oturuyorlar", "aileye
hangi numaradan ulaşırım"), the turn reached the model, which had no way to the value and said so.

### How a turn runs now

1. The identity router is unchanged and still runs first (fast path, no model).
2. When it does not answer, the model is offered `hasta_alan(alan, hasta_adi?)` next to the other read tools. The
   model decides which field is asked.
3. The tool reads the same record the router reads (`kimlikKaydiOku`: patient card, latest Hasta Bilgi Formu,
   document summaries through `dosyaAlanTara.kimlikAlanlariniTara`) and returns **only**: the patient's name, whether
   the field is recorded, and a placeholder to write — `{{ALAN:anne_adi}}`. The value is not part of the result.
4. The model writes the placeholder into its answer. Just before the answer leaves the server, `alanlariYerineKoy`
   reads the record again with the authenticated doctor's id and puts the value in. A field with no value becomes
   the existing sentence that says where to add it ("E-posta kayıtlı değil — hasta dosyasında Özet › Demografik
   bilgiler › Düzenle’den ekleyebilirsiniz.").
5. A placeholder that was not issued in this turn (copied from history, invented) is removed.

### Two forms of one answer

| | Placeholder form | Doctor's form |
|---|---|---|
| Text | `Annesinin adı {{ALAN:anne_adi}}.` | `Annesinin adı <value>.` |
| Goes to | the stored session history, the next turns' model requests, the learning calls, `asistan_actions`, the unspoken remainder of a cut voice turn | the client only (chat response; `ses-ekran` for a voice turn) |
| Built | by the model | by the server at delivery, never stored |

The session stores the placeholder text plus references — `alanlar: [{ anahtar, alan, hastaId }]` — on the assistant
message. No value is stored. `app/api/asistan/ses-ekran` rebuilds the doctor's form on read with the same function,
scoped to the authenticated doctor: a reference to a patient who is not this doctor's reads nothing and its
placeholder is removed.

Two patients in one turn get different placeholders (`{{ALAN:anne_adi}}`, `{{ALAN:anne_adi#2}}`), so one patient's
field can never be filled with the other's value.

### Speech

On the voice channel a sentence that would carry a value is not read. Once per turn the doctor hears the sentence
the identity router already says — "<hasta> için istediğiniz bilgiyi ekranınıza yazdım Hocam." — and the value is on
the screen. A field with no value is spoken as its "where to add it" sentence (it carries no value).

So the spoken text goes to the speech provider (Fish Audio) exactly as it does on the identity router's path today:
without identity values. That was not changed. If the names should be read aloud one day, that is a decision about
sending them to the speech provider; it is one function (`alanSozcusu`) and it was deliberately left as it is.

### Audit

- `[asistan/okuma-araci] alan` — per tool call: field key, patient id, recorded / missing.
- `[asistan/chat] alan` — per delivered answer: field and patient references, number of placeholders removed.
- `audit_logs` — one row per patient per delivered answer: `resource_type = hasta_kimlik_alani`, `resource_id` the
  patient, `new_values = { alanlar, kanal, kaynak: 'ayse' }` (`logKimlikAlani`).

None of the three carries a value.

### Two leaks found by the leak test and closed here

Both exist on `origin/main` and are independent of the new tool. The test would not pass without the fixes.

1. **Document summaries.** `hastaDosyaDerleyici` put the first 400 characters of each document summary
   (`hasta_belgeler.ai_ozet`) into the chart text as is. A summary that quotes "Baba Adı: …" — the very line the
   identity answer reads — carried the father's name to the model. `belgeOzetindenKimlikCikar` now takes the identity
   lines (anne adı, baba adı, doğum yeri) out of the summary before it enters the chart.
2. **City.** The form field `il` (Şehir) was not in the list of fields kept from the model, although the card's
   `sehir` was, and although the address the identity answer gives is "adres, il". It is now kept back in the chart
   (`hastaDosyaDerleyici`) and in the label scan (`dosyaAlanTara` `GIZLI`). **This changes what the model knows: it
   no longer sees the patient's city.** Kaan: say so if the city should stay visible; then the address placeholder
   would have to give the street only.

### What the leak test does (`lib/asistan/alanSizinti.test.ts`)

Real routes over the in-memory scene. A synthetic patient has identity values in all three sources (card: mother,
phone; form: address, city, birth place, guardian; document: father). Eight turns per conversation, on chat and on
voice, with the patient named in the first sentence and with the chart already open: six turns the identity router
does not recognise (asserted), the router's own sentence in the middle, a clinical question, and a model that copies
an old placeholder without calling the tool. After every turn, every request sent to the model so far — system
prompt with its cached prefix, history, tool definitions, tool results, and the background learning calls — is
searched for every identity value. So are the stored session, `asistan_actions`, the audit rows and (voice) the
spoken text. The delivered answer must contain the value.

Cross-doctor: the other doctor's patient asked by name on both channels, chart open and closed (nothing returned,
the open chart's values are not given instead, no placeholder issued, no audit row); the tool called directly (a
foreign patient's name gives the same result as a name nobody has; a foreign id passed as "open chart" reads
nothing); a forged reference in a session read through `ses-ekran` (nothing read); another doctor reading the
session (404).

Mutation checks run by hand on 2026-10-02 (each makes the test fail, then reverted): summary redaction removed
(father's name in the first model request); `il` not kept back (city in the first model request); the doctor's form
stored instead of the placeholder form (mother's name in the second turn's model request).

### Limits

- **Whether Luna writes the placeholder as instructed is not known.** Every test uses a scripted model. A model that
  ignores the rule cannot leak a value (it never has one); the failure would be an answer without the value.
- Free text written by the doctor (visit notes, `belge_analizleri.hekim_ozet`) is sent to the model as before. If a
  doctor typed the mother's name into a note, it is in the chart. Only the structured sources and the document
  summaries are covered.
- The `patients` row is still serialized into the prompt as stored (encrypted columns as ciphertext). Not changed
  here.
- A placeholder inside a write tool's arguments (a card) is not filled; cards are built from what the doctor said.
