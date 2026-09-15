# Cihaz Uyumluluk Listesi — Cihaz Köprüsü (NOTYA-BLE)

**Rule (Kaan 2026-09-15):** this list grows only from devices actually paired in a practice ("sahada test edildi"). Nothing is listed as compatible on the strength of a spec sheet. A device that announces a standard Bluetooth SIG medical profile works with zero per-device code; a device that speaks a private protocol is listed here as *uyumsuz* with what the doctor saw, and the manual-entry path remains.

Source of field reports: `cihaz_uyumsuzluk_raporlari` table (every failed pairing logs device name + error) and Dr. Gökhan's beta notes.

## How a device gets onto this list

1. Doctor taps **📶 Cihazdan al** in İnceleme (Yaşamsal Bulgular) or on a note page.
2. Browser chooser shows devices advertising one of the 6 standard services. If the device appears and delivers a reading → **uyumlu**. Add a row with brand, model, profile, who tested, date.
3. If the device does not appear in the chooser, it is not advertising a standard service → **uyumsuz (özel protokol)**. Add a row; the doctor uses the vendor app + manual entry (or the file path for stethoscopes).
4. If the device appears but the reading never arrives (60 s timeout) → check that the measurement was started on the device *after* selecting it; if still nothing, log as **uyumsuz (indication gelmedi)** with the raw error.

## Standard profiles Notya understands (core/bluetooth/profiles.ts)

| Profile | Service | Characteristic | Lands in |
|---|---|---|---|
| Health Thermometer | 0x1809 | 0x2A1C (indicate) | ateş (°C; °F converted) |
| Blood Pressure | 0x1810 | 0x2A35 (indicate) | tansiyon (mmHg; kPa converted) + nabız if present |
| Pulse Oximeter | 0x1822 | 0x2A5E spot-check (indicate) | SpO₂ + nabız |
| Weight Scale | 0x181D | 0x2A9D (indicate) | kilo (kg; lb converted) |
| Heart Rate | 0x180D | 0x2A37 (notify) | nabız |
| Glucose | 0x1808 | 0x2A18 (notify) | glukoz (mg/dL; kg/L and mol/L converted) |
| Device Information | 0x180A | 0x2A29/24/25/26 | provenance (üretici/model/seri no/yazılım) |

Next standard slot when a device appears: **Generic Health Sensor** (GHS, Bluetooth SIG 2023) — one service for any observation type. Not built until the first GHS device is met.

## Platforms

| Platform | Status | Note |
|---|---|---|
| Android — Chrome / Edge / Samsung Internet | ✅ native | Nothing to install. |
| Windows — Chrome / Edge | ✅ native | Needs a BLE adapter (all recent laptops have one). |
| macOS — Chrome / Edge | ✅ native | Chrome needs Bluetooth permission once (Sistem Ayarları › Gizlilik). |
| iPhone / iPad — Safari | ⚠️ extension | Install the free **iOSWebBLE** Safari extension (App Store) once; Notya then works unchanged. Alternative: open Notya in the free **Bluefy** browser. Chrome/Edge on iOS have the same gap (WebKit). |
| Firefox | ❌ | Use Chrome/Edge. |

## Field-tested devices

| Tarih | Marka / Model | Tür | Profil | Sonuç | Kim | Not |
|---|---|---|---|---|---|---|
| 2026-09-16 (planned) | — | — | — | — | Dr. Gökhan — Samsung Android (Chrome / Samsung Internet, native Web Bluetooth) | Live test in the 2026-09-16 session; device brand/model to be recorded here. |

## Devices that never reach Notya over Bluetooth (by design — file path instead)

| Device | Why | Path into Notya |
|---|---|---|
| Eko CORE 500 / Eko CORE / 3M Littmann CORE | Proprietary BLE; recording lives in the Eko app; export = PDF report or audio | Eko app → Paylaş → Notya (Android share target) or **🎧 Cihazdan gelen dosya** |
| AliveCor KardiaMobile 1L / 6L | 1L is ultrasonic audio, 6L proprietary BLE; export = PDF | Same file path |
| Butterfly iQ3, Clarius, Lumify | USB / Wi-Fi, not Bluetooth; export = JPEG/PDF (DICOM out of scope) | Same file path (usg) |
| Older Omron / A&D cuffs | Classic Bluetooth HDP — no browser can reach it | Manual entry |
