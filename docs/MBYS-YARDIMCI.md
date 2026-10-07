# MBYS Yardımcısı — stage 1

MBYS-YARDIMCI-01, 2026-10-07. Removes the copy-paste between Notya's e-Nabız tool and the Ministry's MBYS web form
(`https://mbys2.saglik.gov.tr`). Notya does not integrate with the Ministry. A Chrome extension fills form fields in
the doctor's own browser, and only when the doctor clicks. Every Ministry button (Sorgula, Bekleyen hastalara ekle,
Kaydet ve Devam Et, hastayı işleme al, Kaydet, tanı Ekle) is still pressed by the doctor.

## How it works

```
Notya tab                                   Chrome extension                         MBYS tab
─────────                                   ────────────────                         ────────
Gün sonu MBYS kuyruğu
  checks pass → row "Hazır"
  [MBYS'ye aktar] ──(chrome.runtime.sendMessage, in the browser)──► stores ONE record
  + plain text to clipboard (fallback)        in chrome.storage.session
  row → "Aktarıldı"                           (10 min / until screen 2 filled)
                                                                                     [Notya'dan doldur]
                                              content script asks for the record ◄── step 1 Hasta Kayıt:
                                                                                     Kayıt türü + identity,
                                                                                     stops: "Kimlik alanları
                                                                                     dolduruldu. Sorgulayıp
                                                                                     listeye eklemek size ait."
                                                                                     doctor: Sorgula, Ekle,
                                                                                     işleme al
                                                                                     [Notya'dan doldur]
                                                                                     step 2 Muayene: texts,
                                                                                     boy/kilo, türler, first
                                                                                     ICD-10 typed in search;
                                              record cleared ◄────────────────────── stops: "Notya doldurdu.
                                                                                     Kontrol edip kaydetmek
                                                                                     size ait."
  [Kaydettim] → "Kaydedildi"                                                         doctor: picks tanı, Kaydet
  (shown in the patient's file too)
```

### Notya side

- Page: `/doktor-tools/enabiz/mbys` (linked from the e-Nabız tool). Component `components/doktor/MbysKuyrugu.tsx`.
- API: `app/api/doktor/araclar/enabiz/mbys/route.ts`
  - `GET ?gun=YYYY-MM-DD`: the day's approved notes (visit time = note time, Turkey day) with status and missing
    items. No identity numbers are sent in the list.
  - `GET ?notId=`: one visit's record plus the clipboard text. A secretary (ön büro) gets the identity part only,
    because MBYS lets assistants register a waiting patient but only the physician takes the patient in.
  - `GET ?hastaId=`: per-visit MBYS status for the patient file (badge "MBYS: Aktarıldı / Kaydedildi" in Muayene
    Geçmişi).
  - `POST islem=durum | kimlik | ayar`.
  - Every id is matched to the doctor first (`seansSahibi`, `hastaSahibiMi`). It is covered by
    `lib/security/hasta-izolasyon.test.ts` (5 cases, A↔B both directions) and listed in the inventory.
- Checks (`lib/enabiz/mbys/kontrol.ts`), each with a fix link:
  - Kayıt türü chosen. T.C. no with the 11-digit checksum for a citizen, pasaport no for a foreigner, şahıs no for
    a stateless patient. Ad, soyad, cinsiyet, doğum tarihi (valid, not in the future) and uyruk.
  - At least one diagnosis, every code valid ICD-10.
  - Şikayet, hikaye and bulgu not empty. Boy and kilo numeric when present.
  - Muayene türü and vaka türü set. The defaults ("Normal Muayene", "Normal Vaka") are changed under Ayarlar.
  - A patient marked "e-Nabız'a gönderilmesin" gets no record. This matches the existing e-Nabız masa lock.
- Record builder (`lib/enabiz/mbys/kayit.ts`) is read-only over the note:
  - Şikayet = başvuru yakınması. Hikaye = subjektif. Bulgu = objektif. Açıklama = plan. Boy/kilo = `vitaller`.
    Tanılar = `icd10_codes`.
  - Identity comes from three sources, highest priority first: (1) what the doctor saved in the queue's "MBYS kimlik
    bilgileri", (2) the latest intake form (`ad`, `soyad`, `tcKimlik`, …), (3) the patient record (name split on the
    last word, dob, gender, card T.C.).
- Storage (migration `126_mbys_yardimci.sql`, RLS + restrictive patient-ownership policy):
  - `mbys_aktarimlar`: one row per visit, `aktarildi` / `kaydedildi`. Hazır and Eksik are computed, never stored.
  - `mbys_hasta_kimlik`: the extra identity fields, encrypted JSON. They are kept out of `patients.notes_encrypted`
    on purpose, because that blob reaches the assistant's model context.
  - `users.mbys_ayar`: default muayene türü and vaka türü.
- Hand-over (`lib/enabiz/mbys/yardimci.ts`): `chrome.runtime.sendMessage(<extension id>, …)`. If the helper is
  missing, the plain text is still copied to the clipboard and the row still becomes Aktarıldı.
- `live_write=false` in `lib/enabiz/paket.ts` is untouched. No Notya server code calls a Ministry address.

### Extension (`extensions/mbys-yardimci`, Manifest V3, no build step)

| File | Role |
|------|------|
| `manifest.json` | Permissions are `storage` and `alarms` only. There are no `host_permissions`. The content script runs only on `https://mbys2.saglik.gov.tr/*`. `externally_connectable` accepts only `https://notya.io/*` and `https://www.notya.io/*`. A fixed `key` gives the beta a stable id. |
| `harita.json` | **The one config file**: address patterns, the never-touch login path, and the field map for both screens. Each entry has a selector list, Turkish label fallbacks, a value transform (date format, option texts for sex / uyruk / Kayıt türü, decimal separator) and `dogrulandi`. |
| `motor.js` | Fill engine. Matches by selector first and Turkish label second, and comparisons ignore Turkish letters and case. It detects the screen from the fields present and fills nothing if unsure. For each field it sends focus/input/change/blur events through the native value setter. Search fields are typed key by key, never with Enter. Filled fields get a green outline. Fields it skips: anything the doctor already typed into (it asks first), fields whose own handler would post the page back, and locked fields. While filling, it cancels any form submit the page starts. Also does map capture. |
| `icerik.js` | The floating panel (shadow DOM, cream/pine). It shows `Notya'dan doldur` when a record is held and `Form haritasını kopyala` while any map entry is unverified. The panel lists what was filled, what was not filled and why, the fields with an "Üzerine yaz" button, and a "Yaz" button for each remaining diagnosis code. Nothing runs on page load except asking the service worker whether a record exists. |
| `arkaplan.js` | Service worker. Checks the sender's origin, validates the record shape, and keeps the record in `chrome.storage.session` only. It clears the record after the Muayene screen is filled or after 10 minutes (alarm), whichever comes first. It makes no network request; the only `fetch` reads its own `harita.json`. |

Hard rules and what checks them (`lib/enabiz/mbys/motor.test.ts`):
- No click, submit or Enter during a fill: both fixtures record these events and the test asserts zero.
- No navigation calls, no network calls, and no `.click()` / `.submit()` anywhere: a scan of the extension's source.
- Permissions and addresses: the manifest is compared with `harita.json`.
- The extension never acts on the login page: an address test.
- Fields the doctor already typed are kept: an overwrite test.
- An unknown screen gets nothing: a detection test.
- Map capture contains no values: a capture test with a filled form and a grid of synthetic patient names.

## Beta install (load unpacked)

1. Get the `extensions/mbys-yardimci` folder onto the doctor's computer (zip from the repo, unzip).
2. Chrome → `chrome://extensions` → turn on **Geliştirici modu** (Developer mode, top right).
3. **Paketlenmemiş öğe yükle** (Load unpacked) → choose the `mbys-yardimci` folder.
4. The id shown must be `fcpohjcocgcobbognbpdkgmcgfnnhjpe`. It comes from the manifest `key`, and Notya uses this id
   unless `NEXT_PUBLIC_MBYS_YARDIMCI_ID` is set. If the id differs, the key was edited.
5. Open Notya (`https://www.notya.io`) → Araçlar → e-Nabız → Gün sonu MBYS kuyruğu. The top card should say
   "MBYS Yardımcısı kurulu."
6. Log in to MBYS yourself in another tab. The helper does nothing on the login page.

Updating: replace the folder contents, then press the reload icon on the extension card. The id stays the same.

Notes:
- Only `notya.io` origins can hand over a record. Local development (`localhost`) and Vercel preview URLs cannot.
  Test with the clipboard fallback there, or add the origin to `externally_connectable` in a local copy only.
- The private key that matches the manifest `key` is not in the repo and is not needed for load-unpacked. The Chrome
  Web Store assigns its own id. Set `NEXT_PUBLIC_MBYS_YARDIMCI_ID` to it when the listing exists
  (OPEN-COMMITMENTS MBYS-YARDIMCI-01b).

## What is unverified

Everything about the real MBYS page. The field list comes from search excerpts of the 2017 HSYS MBYS guide. The newer
private-practice guide could not be opened, and the live page has never been seen.

- Every selector in `harita.json` is a guess (`#HastaTC`, `#Hikaye`, …). The tests deliberately use fixtures whose
  ids mostly do not match, so label matching is what they exercise.
- The label texts, and whether labels are `<label for>`, table cells or placeholders.
- Option texts: Kayıt türü (Vatandaş / Yabancı / Vatansız), Cinsiyet, Uyruk (is it a select, an autocomplete, or a
  country code?), Muayene türü, Vaka türü (the defaults "Normal Muayene" and "Normal Vaka" are guesses), Özellikli
  hizmet (never filled in stage 1).
- The date format (`GG.AA.YYYY` assumed) and the decimal separator for boy/kilo (`,` assumed).
- Whether changing Kayıt türü re-renders the form. The engine waits 700 ms and searches again. It refuses fields
  that post the page back (`__doPostBack` etc.) and leaves them to the doctor.
- Whether a screen lives in a frame. Same-origin frames are searched. Cross-origin frames cannot be reached.
- How the ICD-10 search behaves: the engine types the code key by key and leaves the dropdown for the doctor.
- Ön büro vs physician split, which matches the guide's rule but has not been seen in practice.

Behaviour to know:
- The row becomes "Aktarıldı" when the record is handed over (to the helper or the clipboard). Notya cannot see the
  MBYS tab, so it cannot confirm that the fill happened. "Kaydettim" is the doctor's confirmation.
- After a fill, the content script keeps the record in that page's memory while the result panel is open, so that
  "Üzerine yaz" and the next diagnosis code still work. The 10-minute cap still applies, and closing the panel drops
  the record. Nothing is written to page storage.

## How to finish the map from a captured form structure

1. A practicing doctor logs in to MBYS with the helper installed. On the **Hasta Kayıt** screen, before typing any
   patient, they press `Form haritasını kopyala` and paste the result into a message to us. They do the same on the
   **Muayene** screen. The capture holds the following and never a typed value: labels, input id/name/type/class,
   placeholders, select option texts, headings, button captions, and which `harita.json` entry matched where.
   Long digit runs are masked. Next to rows of large tables only the control is listed, without neighbour text, in
   case the rows hold patient names. The doctor should still glance at it before sending.
2. For each screen, read `cerceveler[i].eslesme`, keyed by `<ekran>.<anahtar>`:
   - `null` means the field was not found. Look up its control in `alanlar` by `etiket`.
   - `yol: "etiket"` means it was found by label only. Pin it with a selector.
   - `yol: "secici"` means it was found by selector. Still check that it is the right control.
3. Edit `extensions/mbys-yardimci/harita.json` only:
   - Put the real selector first in `secici`. Prefer `#id`, then `[name='…']`, and avoid classes.
   - Add the exact label text to `etiketler`.
   - Copy the real option texts into `secenekler` for selects, and change `tur` if a "select" is really an
     autocomplete text box (`metin`).
   - Fix `bicim` and `ondalik` if needed. Add `sonraBekleMs` to a select that re-renders the form.
   - If a captured field has `sayfaYeniler: true`, the engine will leave it to the doctor. That is intended.
   - Set `dogrulandi: true` on each entry once it has been seen to fill correctly on the real screen. When all entries
     are verified, the capture button disappears.
   - If the screens' recognition fields change, adjust `tanima` / `tanimaEsik`.
   - If the address changes, update `adresler.eslesme` **and** `manifest.json` `content_scripts.matches`. A test
     fails if the two differ.
4. Optionally save the capture as a new fixture next to `lib/enabiz/mbys/fikstur/*.html`, rebuilt as HTML with
   synthetic values, and add a test case.
5. Run `npx tsx --test lib/enabiz/mbys/motor.test.ts lib/enabiz/mbys/kontrol.test.ts`, bump `version` in
   `manifest.json`, and send the doctor the updated folder (reload the extension).

No other file needs to change for a map correction.

## Out of scope

- e-Reçete. The helper never touches it.
- Sending anything to the Ministry from Notya servers, and logging in or navigating MBYS.
- Stage 2 (registration with the Ministry, direct e-Nabız sending): OPEN-COMMITMENTS MBYS-YARDIMCI-01d.
