# Gelen Belgeler (NOTYA-GELEN-BELGELER)

One inbox for everything that reaches the doctor from outside: lab results, X-ray / ECG photos, consultation
replies, voice notes. Notya reads each item, suggests the patient with a plain certainty (**Eminim** /
**Kontrol edin**), and the doctor files it with one tap (**Dosyaya ekle**). Auto-filing is a later step and off by
default. Plan and phases: `docs/OPEN-COMMITMENTS.md` § NOTYA-GELEN-BELGELER.

## Entry point for every capture channel

```ts
import { gelenBelgeEkle } from '@/lib/gelenBelgeler/sunucu'

const sonuc = await gelenBelgeEkle({
  doktorId,                       // whose inbox — resolve it from the channel (receiving address / WhatsApp number)
  kaynak: 'eposta',               // 'surukle' | 'yapistir' | 'yukleme' | 'kamera' | 'ses_kaydi' | 'eposta' | 'whatsapp'
  dosya: { ad, mime, bytes },     // one attachment; bytes: Buffer, max 4 MB (vault limit)
  gonderen: { telefon, eposta, ad }, // what the channel knows about the sender — used for patient matching
  // optional: supabase (defaults to the service-role client), ekleyen { userId, personelId }
})
// sonuc.durum: 'eklendi' { id } | 'zaten_var' { id, dosyalandi } | 'gecersiz' { hata } | 'hazir_degil' (migration 099 not applied)
```

- **Phase 2 (email, belge.notya.io):** the inbound-mail webhook resolves the doctor from the receiving address, then
  calls `gelenBelgeEkle` once per attachment with `kaynak: 'eposta'` and `gonderen.eposta`. The email body, when it
  carries a table, goes in as a text file (`mime: 'text/plain'`) — the same path as paste.
- **Phase 3 (WhatsApp, NOTYA-ILETISIM-03):** the webhook downloads the media and calls it with `kaynak: 'whatsapp'`
  and `gonderen.telefon`. Voice notes (.opus/.ogg) are transcribed automatically.
- Duplicates (same sha256 for the same doctor) come back as `zaten_var` — safe to call again on a webhook retry.
- The function never files anything; filing is always a person's tap (`dosyala`).

## What happens to a file

| Format | Stored as | Notya reads |
|---|---|---|
| PDF | as-is | the PDF |
| JPEG / PNG / WebP | as-is | a copy without EXIF/GPS/XMP metadata |
| iPhone HEIC/HEIF | JPEG (converted on the server, `heic-convert`) | the JPEG |
| DICOM (.dcm) | converted to an image **in the browser** (`core/belgeler/dicom.ts`; patient tags never leave the device) | the image |
| Sound: .opus/.ogg (WhatsApp), .m4a, .mp3, .wav, .webm (in-app) | as-is (audio kept) | the Turkish transcript (ElevenLabs Scribe — the same provider as muayene recording upload) |
| Word .docx / old .doc | as-is | the text (.docx only) |
| Excel / CSV | as-is | every sheet as CSV text |
| Pasted text | `.txt` | the text |

Reading is one Claude call through `lib/ai/cagir.ts` (GÜÇLÜ tier, cached fixed instructions). The model sees only the
document; the doctor's patient list is never sent — matching runs on our server (`eslesme.ts`) against **this
doctor's** patients only (name, birth date, full TC → hash, sender phone / email). Up to three suggestions.

## Filing (Dosyaya ekle)

`dosyala()` → the file goes into the patient's encrypted document vault (`medical_documents`, the Belgeler tab and the
lab / analysis pipeline read from there), a `hasta_belgeler` summary row is written, the item is marked filed with
who / when / source, an `audit_logs` entry is written, and the inbox copy is removed from storage. On the page, a lab
result then starts the existing lab reader; an open consultation request can be linked with the existing
`belge_bagla` step.

## Rules

- Storage: private bucket `hasta-belgeler`, `<doktorId>/gelen/…`, served only through 10-minute signed URLs.
- Access: the doctor; the secretary only when the doctor turned on **Ayarlar › Gelen Belgeler** (`yetki.ts`, server).
- Unfiled items are destroyed after 30 days by the daily `kvkk-imha` cron (`gelenleriTemizle`).
- Everything fails soft until `lib/db/migrations/099_gelen_belgeler.sql` is applied.
