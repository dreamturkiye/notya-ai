# lib/iletisim — one-tap patient messages from the doctor's OWN accounts

NOTYA-ILETISIM-01 (Kaan, 2026-09-25). Doctors and their secretaries message patients by WhatsApp and email **from
their own WhatsApp and their own mailbox**, with no middleman. Notya prepares the recipient and the text; the device
in the sender's hand opens its own WhatsApp / mail; a human taps send.

NOTYA-ILETISIM-04: once the doctor has connected his own Gmail/Outlook (job B) or WhatsApp Business number (job C),
non-clinical queue items leave **by themselves** from that account (see "Automatic sending" below). Doctors who
connected nothing keep exactly the one-tap flow.

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
| `otomatik.ts` | Sender registry: WhatsApp + e-posta adapters over jobs B/C, `OTOMATIK_TURLER`, `whatsappSablonu` (type → approved template + variables) |
| `otomatikGonderim.ts` | The dispatcher (`otomatikGonder`), the human claim (`elleSahiplen`), how an item looks to people (`insanGorunumu`), `bugunOtomatikSayisi` |
| `otomatik/eposta/`, `otomatik/whatsapp/` | Job B (Gmail/Outlook, 096) and job C (WhatsApp Business coexistence, 097). Setup guides: `docs/iletisim-kurulum-eposta.md`, `docs/iletisim-kurulum-whatsapp.md` |

UI: `components/doktor/iletisim/` — `GonderDugmesi` (the one send button), `HazirMesajlar` (Ana Sayfa card +
full-screen flow), `IletisimAyarKarti` (Ayarlar › İletişim), `OtomatikSlotlari` (`WhatsAppBaglan` + `EpostaBaglan`),
`RandevuMesaji`, `HastaIletisim`.
API: `app/api/doktor/iletisim/{hazirla,kayit,izin,kuyruk,ayarlar}`, `app/api/iletisim/{eposta,whatsapp}`; crons
`app/api/cron/randevu-hatirlatma` and `app/api/cron/iletisim-otomatik`. DB: `lib/db/migrations/095_iletisim.sql`,
`096_eposta_baglantisi.sql`, `097_whatsapp_baglantisi.sql`, `098_iletisim_otomatik.sql`.

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
  NOTYA-ILETISIM-04 goes further: the automatic WhatsApp path sends approved templates ONLY, never free text.

## Automatic sending (NOTYA-ILETISIM-04)

- **What**: only `OTOMATIK_TURLER`: randevu hatırlatma / değişikliği / iptali, hasta bilgi formu, Sağlığım'da yeni
  mesaj. Aşı, kontrol, tetkik, Sağlığım bağlantısı and free text are always one-tap.
- **When**: the randevu cron runs the dispatcher right after it fills tomorrow's reminders (07:00, 17:00 TRT);
  `/api/cron/iletisim-otomatik` sweeps every 10 minutes, 07:00–21:00 TRT, for everything enqueued in between. Enqueue
  triggers (e.g. `notifyPatientNewPracticeMessage`) never wait on a provider. Nothing leaves at night. Only items of
  today and yesterday; older ones stay with people.
- **Channel**: WhatsApp first (approved template only, `whatsappSablonu`; minors are greeted as "Sayın Veli"), else
  e-posta (the `mesajHazirla` text). A channel is used only with the patient's consent for it and a ready sender.
  WhatsApp answers "no" → e-posta. A sender that throws or hangs → no second channel (the first may have left).
- **At most once**: the dispatcher claims an item (`otomatik_durum` null → `gonderiliyor`) with a conditional update
  before any network call. A person opening the item in the send flow claims it too (`elle`), and an item the machine
  already sent answers 410 in `/hazirla`. A claim older than 10 minutes is shown to people again with a
  "gitmiş olabilir" note. Failures stay `bekliyor` with a short Turkish `otomatik_hata` and are not retried.
- **Log**: `iletisim_kayitlari` with `durum = gonderildi`, `otomatik = true`, `saglayici`, `saglayici_mesaj_id` (Gmail id /
  WhatsApp wamid); the queue item → `gonderildi`; a reminded appointment → `hatirlatma_gonderildi`.
- **Off until** migration 098 is applied (no claim column → nothing is sent) and the doctor has connected an account
  whose env vars exist.

## Klinik Kalkanı (NOTYA-KALKAN-01)

Gelen hasta mesajı ve hekimin uygulamadan yazdığı yankı `wa_konusma` / `wa_satir` defterine düşer. Gövde şifrelidir.
Otomatik cevap yalnız sabit cümledir (ilaç adı yok). Hekimin kendi cümlesi taslak olur; `hasta_ilaclar` Fısıltı’da
**Onayla** olmadan değişmez. Bilinmeyen numara hasta açmaz. Aynı telefon iki kayıtta ise klinik işlem yok.
Starter planda ve migration 103 uygulanmamışsa bu katman susar; one-tap ve şablon yolu aynı kalır.
`notya_kalkan_yonlendirme` UTILITY şablonu bu depoda oluşturulmaz — Meta’ya elle sunulur.
Ayarlar’daki muayenehane numarası tek başına “bağlı” değildir; Meta’da görünen numarayla aynı olmalıdır.

## Seans paketi (NOTYA-PAKET-01)

Onaylı SOAP ve Kalkan Onayla aynı paketi doldurur. Kapı 3 uyarır, kapı 2 kopyalar. İkisi de ilaç kartını kesmez.
Migration `104_seans_paketi.sql` uygulanmadan kapılar susar.
