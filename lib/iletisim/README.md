# lib/iletisim — one-tap patient messages from the doctor's OWN accounts

NOTYA-ILETISIM-01 (Kaan, 2026-09-25). Doctors and their secretaries message patients by WhatsApp and email **from
their own WhatsApp and their own mailbox**, with no middleman. Notya prepares the recipient and the text; the device
in the sender's hand opens its own WhatsApp / mail; a human taps send.

## Map

| File | What |
|------|------|
| `tipler.ts` | `MesajTuru`, `IletisimKanali`, `EpostaAcilis`, labels |
| `sablonlar.ts` | Turkish templates (`mesajHazirla`). **No clinical information, ever.** Guardian wording follows the patient's age (`veliDili` ← `veliDiliMi`). |
| `baglantilar.ts` | `whatsappLinki(telefon, metin)` → `https://wa.me/<digits>?text=…`; `epostaLinki(adres, konu, govde, 'uygulama' \| 'gmail' \| 'outlook')` → `mailto:` / Gmail web / Outlook web compose. Uses `normalizeTrPhoneE164` (lib/doktor/twilioNotify.ts). Every link ≤ `LINK_UST_SINIRI` (1800); link lines survive shortening. |
| `izin.ts`, `izinMetni.ts` | Consent gating (`kanalDurumu`, `onerilenKanal`) and the consent wording / intake field ids |
| `kuyruk.ts` | Hazır mesajlar: de-duplication keys, tomorrow's appointment candidates, staff rules (`PERSONEL_TURLERI`, `turIzinliMi`) |
| `sunucu.ts`, `hazirlik.ts` | Server: doctor-scoped reads, fail-soft helpers, `kuyrugaEkle`, `iletisimHazirla` |
| `istemci.ts` | Browser: API calls, per-device choices, `baglantiyiAc` (iOS-Safari-safe) |
| `otomatik.ts` | **The slot for jobs B and C** (see below). Empty today. |

UI: `components/doktor/iletisim/` — `GonderDugmesi` (the one send button), `HazirMesajlar` (Ana Sayfa card +
full-screen flow), `IletisimAyarKarti` (Ayarlar › İletişim), `OtomatikSlotlari`, `RandevuMesaji`, `HastaIletisim`.
API: `app/api/doktor/iletisim/{hazirla,kayit,izin,kuyruk,ayarlar}`. DB: `lib/db/migrations/095_iletisim.sql`.

## Rules

1. **No clinical content in any message.** A message says there is an appointment / a new Sağlığım message / a form
   to fill; details stay behind the PIN-protected Sağlığım link. No attachments — documents go as a Sağlığım link.
2. **Consent per channel.** Only `patients.iletisim_izni_<kanal> === true` opens a channel. `null` = unknown (every
   patient registered before 095) and is treated as "no" until someone marks it; the mark records who and when
   (`iletisim_izin_kayitlari`). Checked on the server (`POST /kayit` answers 409), not only in the UI.
3. **Staff (sekreter) = appointment messages only**: `PERSONEL_TURLERI` (randevu hatırlatma / değişikliği / iptali,
   tetkik getirin, hasta bilgi formu). Enforced in every route (403 / 404) and by the 095 RLS policies. Sağlığım
   notices, vaccine and recall items stay with the doctor. The log keeps the staff member as sender.
4. **Patient isolation.** Every id from outside is resolved with the doctor's column in the same query
   (`.cursor/skills/hasta-izolasyon/SKILL.md`); new routes are in `lib/security/hasta-izolasyon.test.ts`.
5. **Fail soft** until 095 is applied: empty queue, unknown consent, no log — never a crash.
6. **No cron touches `asilar`** (lib/asi/hatirlatma.test.ts). Due vaccines are enqueued when the doctor opens the
   queue (`asiKuyrukAdaylari`), not by a cron.
7. **Serbest randevu** (booking without a patient record): not enqueued and cannot be messaged from Notya — there is
   no patient record to hold the consent. Register the patient first.

## Contract for jobs B and C — `OtomatikGonderici`

Job B (NOTYA-ILETISIM-02: Gmail / Outlook, send-only) and job C (NOTYA-ILETISIM-03: WhatsApp Business coexistence)
add **unattended** sending from the doctor's own accounts. They plug in here and replace only
`components/doktor/iletisim/OtomatikSlotlari.tsx` in the UI.

```ts
interface OtomatikGonderici {
  kanal: 'whatsapp' | 'eposta'
  saglayici: string                       // 'gmail' | 'outlook' | 'whatsapp_business'
  hazirMi(doktorId: string): Promise<boolean>
  gonder(istek: OtomatikGonderimIstegi): Promise<{ ok: true; saglayiciMesajId?: string } | { ok: false; hata: string }>
}
```

- Register in `otomatikGondericiler()`; callers use `hazirOtomatikGonderici(doktorId, kanal)` (null → the manual
  one-tap path, exactly as today).
- `hazirMi` and `gonder` **never throw**; on any doubt `hazirMi` answers false and `gonder` returns `{ ok: false }`.
- The caller has already done ownership (`hastaSahibiMi`), consent (`gonderilebilirMi`) and staff checks, and passes
  the text from `mesajHazirla` — a sender must not build or change message text.
- Messages always leave from the **doctor's** account (`doktorId` = the practice owner), also when a secretary
  triggered them.
- On `ok: true`, log to `iletisim_kayitlari` with `durum = 'gonderildi'` and close the queue item — the same writes
  `PATCH /api/doktor/iletisim/kayit` does for the manual path.
- Credentials (OAuth refresh tokens, Meta tokens) live server-side only, encrypted, never in the browser, never in
  this module's return values. UI copy never says OAuth, token, API or deep link.
- WhatsApp Business: template messages only where Meta requires them (utility templates for randevu reminders).
