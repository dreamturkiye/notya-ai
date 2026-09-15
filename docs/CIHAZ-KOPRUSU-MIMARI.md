# Notya Cihaz Köprüsü — Universal Bluetooth Device Capability (as built)

**Status:** Architecture v1 designed and BUILT 2026-09-15 (NOTYA-BLE-01/02). Migration **024** (022/023 were already genetik taramalar / KHD gap fill).
**Owner:** Kaan (decisions) / Claude (build). **Scope:** `core/` — specialty-agnostic; all 30 branşlar + klinik inherit it.
**Not in scope by design:** real-time streaming, audio-analysis AI on stethoscope sounds, native app (Capacitor needs a paid Apple account), Classic-Bluetooth HDP, DICOM ingest, speculative vendor adapters.

## 1. The decision

"Universal Bluetooth" is four doors, not one, and only one is Bluetooth a browser can open. Notya has one doctor-facing button (**📶 Cihazdan al**) plus one file button (**🎧 Cihazdan gelen dosya**); behind them the transports normalize into two records — a **NotyaOlcum** (ateş, tansiyon, nabız, SpO₂, kilo, glukoz) or a device **file** in the encrypted vault (steteskop sesi, EKG PDF, USG görüntüsü). The doctor sees a confirm card, taps once, and the value/file lands on the muayene with full device provenance. Decisions (Kaan 2026-09-15): iPhone path = iOSWebBLE Safari extension + Bluefy fallback; confirm card ALWAYS, never silent auto-fill; Notya stays a PWA (Android share target).

## 2. Research findings (verified 2026-09-15)

| Category | TR-market / referenced devices | Leaves the device as | Open standard? | Reaches Notya via |
|---|---|---|---|---|
| Thermometer | Beurer FT 95 (visible on Amazon.com.tr / Trendyol / medikal dealers), iHealth, Withings Thermo | BLE spot measurement | Health Thermometer 0x1809 **if the vendor honors it** — some consumer brands use private characteristics | T1 Web Bluetooth |
| Blood pressure | Omron (newer BLE), Beurer BM, Withings BPM Connect, A&D | BLE | Blood Pressure 0x1810 widely honored; older Omron/A&D = Classic HDP (no browser can reach) | T1 |
| Pulse oximeter | Beurer PO, Wellue/Viatom, Contec | BLE | Pulse Oximeter 0x1822 (cheap ones often private) | T1 |
| Scale | Beurer, Withings, Xiaomi | BLE | Weight Scale 0x181D | T1 |
| Glucometer | Contour, Accu-Chek Guide | BLE | Glucose 0x1808 | T1 |
| Digital stethoscope | **Eko CORE 500** (BT 4.2 LE proprietary, 3-lead ECG, exports PDF report; sounds live in the Eko app / Eko+; EMR integration = enterprise "Eko Connect" SDK via sales), Littmann CORE (same stack) | vendor app → share PDF / audio | No | **T2 file share** |
| ECG | AliveCor KardiaMobile (1L ultrasonic audio, 6L proprietary BLE), exports PDF; API only in Kardia Pro | vendor app → share PDF | No | T2 |
| Handheld ultrasound | Butterfly iQ3 (USB), Clarius (Wi-Fi), Lumify (USB) | **not Bluetooth** — vendor cloud → JPEG/PDF/DICOM | DICOM at export | T2 (JPEG/PDF) |
| New 2024+ RPM devices | Philips/Roche-backed | BLE **Generic Health Sensor** profile (Bluetooth SIG, Nov 2023) | Yes | T1 with one GHS parser (future slot) |

**Platform truth:** Web Bluetooth is native in Chrome/Edge/Samsung Internet on Android, Windows, macOS. iPhone/iPad: no native support in any browser (all WebKit), Apple states no plan → free iOSWebBLE Safari extension polyfills `navigator.bluetooth` (T1 code unchanged) or the free Bluefy browser. Firefox: none. Two API rules shape the UX: `requestDevice()` fires only from a tap, only over HTTPS — so "Ayşe, ateşi cihazdan al" can highlight the button, the doctor still taps once.

**Compliance is per device, not per category.** The SIG profiles are optional; two boxes on one shelf can differ. So: zero per-device code for compliant devices, an honest one-line message for non-compliant ones, and a compatibility list that grows only from field pairings (`docs/CIHAZ-UYUMLULUK.md`, standing rule).

## 3. Architecture (as built)

```
 📶 Cihazdan al / 🎧 Cihazdan gelen dosya  (İnceleme vitaller · note page · /cihaz/paylas)
            │
   T1 Web Bluetooth (std GATT)  ─┐
   T3 iOSWebBLE polyfill (=T1)  ─┼─► NotyaOlcum ─► confirm card ─► vitals editor ─► note approve (learning log, ilaç sync unchanged)
   T2 file share / import       ─┼─► vault document (category 'cihaz-kaydi')
   T4 vendor cloud (dormant)    ─┘
            │
            └─► cihaz_olcumleri  (audit: device make/model/serial, raw hex, timestamp, transport)
```

### Files
- `core/bluetooth/types.ts` — `NotyaOlcum`, `CihazBilgisi`, `BleYetenek`
- `core/bluetooth/parsers.ts` — IEEE 11073-20601 SFLOAT/FLOAT, GATT DateTime, hex
- `core/bluetooth/profiles.ts` — one generic parser per profile: HTS 0x1809, BLS 0x1810, PLX 0x1822, WSS 0x181D, HRS 0x180D, GLS 0x1808 (+ Device Information 0x180A for provenance). Unit conversions: °F→°C, kPa→mmHg, lb→kg, kg/L & mol/L→mg/dL
- `core/bluetooth/profiles.test.ts` — 20 tests (node:test), in `npm test`
- `core/bluetooth/webBluetooth.ts` — `bleYetenek()` (honest platform message), `bluetoothOlcumAl()` (one-shot: chooser → connect → first indication → disconnect, 60 s)
- `components/core/CihazdanAl.tsx` — `<CihazdanAl>` confirm card, `<CihazDosyasi>` file import
- `app/api/doktor/cihaz-olcum/route.ts` — POST audit rows (+ remembered device upsert, + uyumsuz-device report), GET patient history
- `app/api/doktor/cihaz-olcum/dosya/route.ts` — multipart → `uploadDocument` (vault, category `cihaz-kaydi`) + audit row (`belge_id`)
- `app/cihaz/paylas/page.tsx` — share-target landing / manual file page (patient picker, kind, device)
- `public/manifest.json` `share_target` (files: audio/*, application/pdf, image/*) · `public/sw.js` v4 intercepts the share POST into the Cache API (the Bearer session lives in the browser, so the server never sees an unauthenticated upload)
- `lib/vault/types.ts` audio MIME allowed (4 MB cap unchanged — Vercel body limit) · `components/doktor/DocumentViewer.tsx` plays audio
- `lib/db/migrations/024_cihaz_olcumleri.sql` — `cihaz_olcumleri`, `doktor_cihazlar`, `cihaz_uyumsuzluk_raporlari`

### Data rule
`notes.vitaller` stays the clinical value the doctor approved (shape unchanged → SOAP, İnceleme edit, HL7 ORU OBX, FHIR Observation, portal Takip all untouched). `cihaz_olcumleri` is the audit trail behind it: every device-sourced value traces to make/model/serial and raw bytes. "Not onayı = ölçüm onayı" — the device API never writes vitaller itself.

### Muayene links
1. İnceleme → Yaşamsal Bulgular header: both buttons; reading fills `vitalTaslak`, approval unchanged.
2. Note page `/dashboard/doktor/notlar/[id]`: both buttons; "Kaydet ve yeniden onayla" persists.
3. Hasta dosyası → Belgeler: device files appear in the vault list (category `cihaz-kaydi`, notes "Steteskop kaydı · Eko CORE 500"), audio plays inline.
4. `/cihaz/paylas`: Android share target landing + iPhone/desktop manual file page.
5. Ayşe awareness (open, NOTYA-BLE-06): flag device-sourced vitals `(cihazdan: <cihaz>)` and attached recordings in the SOAP/konsült context. Notya never interprets heart sounds — Eko's own cleared AI does that in the Eko app; its PDF findings arrive with the file.

### KVKK
Pairing is per-site, per-gesture, browser-mediated. `ham_hex` carries no identity; patients are Notya UUIDs only, TC never involved. Vendor-app files may carry the name the doctor typed into the vendor app — treated like any belge (encrypted vault, doctor-scoped). T4 vendor clouds = data on a third-party server outside TR → KVKK transfer position per vendor before any adapter (NOTYA-BLE-04).

## 4. Growth slots (each on trigger, never speculative)
GHS parser (first GHS device seen) · Withings public API adapter (first doctor with a Withings device) · Eko Connect (partnership meeting) · ECG waveform storage/viewer (first 6-lead file) · Ayşe prompt flag (NOTYA-BLE-06).

## 5. Field validation
Dr. Gökhan pairs a real device (which one he owns → first row of `CIHAZ-UYUMLULUK.md`, NOTYA-BLE-03). Beta checklist v8 gets item 13 "📶 Cihazdan ateş al". Kaan reinstalls the PWA on an Android phone after deploy (share target registers on install).
