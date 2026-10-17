# New-Doctor UX Audit — 2026-10 (YENI-DOKTOR-UX-2026-10)

**Mission (Kaan):** the app has grown; a brand-new doktor can get overwhelmed and lost. Act as a
first-time user and make the product intuitive — "Apple vs Android": the right thing in the fewest,
most logical steps. Reference standard: the belgeler flow move (uploads used to live in a separate
Belgeler section evaluated later; now attachments are added right after the muayene ends, before the
rapor, evaluated on the spot, filed to the right place).

**Method:** code-level walkthrough of the real first-session journey on `origin/main` (8ac792f0),
screen by screen: login → onboarding → dashboard → add first patient → book randevu → start muayene
→ record/note → ekler → onay → rapor → fatura, plus every main-nav destination (Asistan, Ana Sayfa,
Randevular, Hastalar, Mesajlar, Gelen Belgeler, Raporlar, e-Nabız, Araçlar, Ayarlar).

**Scope of this change set:** Part B quick wins + Part C ipucu help system were implemented (see
"What shipped" at the end). Part D structural moves are **proposals only** — nothing was moved.

---

## 1. Journey trace (as the code actually behaves)

| # | Step | Clicks from login | What a new doctor meets | Verdict |
|---|------|-------------------|--------------------------|---------|
| 1 | Login `/giris/doktor` | – | Email+password, clear errors, şifremi unuttum. Routes to onboarding when profile incomplete. | Good |
| 2 | Onboarding `/onboarding?p=doktor` | 1 | Profession → unvan/ad → branş → KVKK → (optional ses profili). Branş is locked from here on (never re-asked in muayene — good). | Good |
| 3 | Ana Sayfa `/dashboard/doktor` | 2 | Greeting, KPI zeros, "Hızlı araçlar" (Epikriz/ICD-10 — tool jargon before the first patient exists), empty randevu card. Nothing says "start here". | **Gap → fixed (first-run checklist)** |
| 4 | Add first patient | 3–4 | Two routes: nav → Hastalar → "+ Hasta Ekle", or dashboard "Hasta Ekle" tile. Form itself: only Ad Soyad mandatory — good. Empty Hastalar list said only "Henüz hasta kaydı yok." with no action. | **Gap → fixed (empty state + CTA)** |
| 5 | Book randevu | 3 | Randevular page or dashboard "+ Randevu ekle". Phone required with inline explanation; conflict check server-side. Good. Çalışma saatleri / portal booking settings live in Entegrasyonlar (see finding S-2). | OK |
| 6 | Start muayene | 4–5 | The only paths: hasta dosyası → "🩺 Muayeneyi Başlat", or randevu → "Muayeneyi Başlat". A new doctor on Ana Sayfa has no "muayene" verb anywhere — the mobile grid offers "İnceleme" (which is actually the **approval queue**, not an exam). | **Gap → tip + checklist row; rename proposal D-4** |
| 7 | Record → note | 5+ | `/session/new`: branş locked, speak-to-note, çek listesi. Strong flow. | Good |
| 8 | Ekler | – | `MuayeneEklerAdimi` right after recording, before the rapor — the CEO's reference standard. Never blocks. | Good (the model to copy) |
| 9 | Onay → rapor | – | Onay goes to the finalized note view (`onaySonrasiYol`), queue empties gracefully. | Good |
| 10 | Fatura | 6+ | Per-note faturala page exists and, when the module is off, links to setup. But the Faturalama module itself is at **Ayarlar → Entegrasyonlar → Faturalama & Tahsilat** — three levels deep, invisible in nav, in Araçlar, and (until now) in Ayarlar copy. Fiyat kataloğu is a tab inside it. | **Gap → checklist row + ipucu + proposal D-2** |

### Main-nav walkthrough

| Nav item | New-doctor read | Findings |
|----------|-----------------|----------|
| Asistan | Clear ("Asistana sor", highlighted) | Good |
| Ana Sayfa | Zeros everywhere on day one | Fixed: first-run checklist card |
| Randevular | Clear calendar; sidebar Bugün/Yarın | Good; empty states fine |
| Hastalar | Empty list explained nothing | Fixed: explanatory empty state + CTA |
| Mesajlar | "Henüz mesaj yok." — but a new doctor cannot know messages come from the Sağlığım portal, or that **they** must grant portal access first | Fixed: empty state explains + links Hasta Portalı |
| Gelen Belgeler | Good empty state already ("bırakın — Notya dosyalasın") | OK |
| Raporlar | Analytics. Name collides with Araçlar → "Hasta Raporları" (SGK) — two different "rapor" concepts | Proposal D-5 |
| e-Nabız | Jargon-safe for Turkish doctors; page explains the copy-assist model | OK; ipucu added |
| Araçlar | 13 core + branş tiles, no orientation | Ipucu added |
| Ayarlar | Entry list is clear, but **neither çalışma saatleri, fiyat kataloğu nor faturalama is named anywhere on it** — they hide behind "Entegrasyonlar" | Ipucu now says it; proposal D-2 |

### Jargon a new doctor meets with no explanation (worst first)
1. **"İnceleme"** — it is the pending-approval queue; the word suggests a clinical exam. Dashboard KPI "Bekleyen onay" links to it, mobile grid tile says "İnceleme" bare. (Proposal D-4.)
2. **"Entegrasyonlar"** as the home of Faturalama + fiyat kataloğu + Google Takvim + randevu portal + aşı stok — none of which a doctor would call an "integration". (Proposal D-2.)
3. **"Konsültan defteri" / "Kasa" / "Fısıltı"** — internal product words leaking into UI copy (Fısıltı only in code comments; defteri visible to sekreter nav).
4. **"Muayene sonu paketi" vs "Epikriz" vs "Hasta Raporları"** — three tiles that all produce end-of-visit documents.

### Duplicate ways to do the same thing (confusing on day one, fine later)
- Dashboard has **two** quick-access grids (desktop "Hızlı araçlar" strip + "Hızlı erişim" cards) plus the mobile grid — three surfaces, overlapping targets, slightly different item sets.
- SGK Medula is reachable from Ayarlar list **and** Araçlar grid; e-Nabız from nav **and** Araçlar; Araçlar itself is in nav **and** an Ayarlar row.
- Randevu creation from dashboard button, Randevular page, and hasta dosyası.

### Settings that silently precondition features (state at audit time)
| Feature | Prerequisite | Was there a pointer? |
|---|---|---|
| Hasta İletişimi toplu SMS | Android gateway / NetGSM in Ayarlar › İletişim | **Yes** — inline copy + fallback list (good pattern, keep) |
| e-Reçete gönderimi | SGK şifre in Ayarlar › e-Reçete | **Yes** — `EReceteDurum` links the setting |
| Not → Fatura | Accounting module enabled + katalog | **Yes** on faturala page; **No** anywhere earlier → fixed via checklist row + ipucu |
| Portal randevu talepleri | Çalışma saatleri (Entegrasyonlar → randevu portal kartı) | **No** — request card simply never appears; doctor can't tell why (Proposal D-3) |
| Mesajlar | Patient must have portal access (Araçlar › Hasta Portalı) | **No** → fixed (empty state) |

---

## 2. Ranked findings (new-user impact × implementation risk)

Impact: how hard a brand-new doctor is blocked/confused. Risk: chance of breaking existing flows.

| Rank | Finding | Impact | Risk to fix | Action |
|---|---|---|---|---|
| 1 | No guided start on a fresh account: dashboard of zeros, no "add first patient" path | High | Low | **Shipped**: first-run checklist card (profil/branş, ilk hasta, ilk randevu, ilk muayene, fiyat kataloğu, iletişim) — each row deep-links; dismissible; disappears when done or when the account stops being new |
| 2 | Empty states explain nothing (Hastalar, Mesajlar) | High | Low | **Shipped**: purpose + first action, linked |
| 3 | No in-place teaching anywhere; CEO wants tips in place of human training | High | Low | **Shipped**: ipucu system — reusable "?" popover, first-visit auto-show once per section, Ayarlar global switch (default ON), Turkish copy for all 14 major sections |
| 4 | Faturalama + fiyat kataloğu findability (3 levels deep, unnamed) | High | Low (pointer) / Med (move) | Pointer **shipped** (checklist row, ipucu, Ayarlar ipucu copy); the move itself is Proposal D-2 |
| 5 | Mesajlar ↔ Hasta Portalı causal link invisible | Med-High | Low | **Shipped** (empty state) |
| 6 | "İnceleme" naming (approval queue) | Med | Med (label is load-bearing in tests/copy) | Proposal D-4 — not touched |
| 7 | Settings subpages missing a desktop back link (erecete, ses-profili, ayse-hafizasi, hesap, personel, entegrasyonlar, faturalama) while iletisim/gelen-belgeler had one | Med | Low | **Shipped**: same `‹ Ayarlar` kicker-link pattern everywhere; faturalama got `‹ Entegrasyonlar` |
| 8 | Three overlapping quick-access surfaces on dashboard | Med | Med | Proposal D-6 — not touched |
| 9 | Muayene verb absent from Ana Sayfa | Med | Med (flow change) | Checklist row explains the path; merging is Proposal D-1 territory |
| 10 | Portal randevu talepleri silently absent without çalışma saatleri | Low-Med | Med (needs state surfaced from portal settings) | Proposal D-3 |
| 11 | Rapor naming collision (Raporlar vs Hasta Raporları) | Low | Low-Med | Proposal D-5 |

---

## 3. What shipped in this change set (Parts B + C — zero behavior removal)

**Part B**
- `Hastalar` empty state: what the screen is for + "+ İlk hastanızı ekleyin" → `/dashboard/doktor/hasta-ekle`.
- `Mesajlar` empty state: explains Sağlığım inbox + links Araçlar › Hasta Portalı.
- Dashboard "Bugün için randevu yok" now carries "Randevu ekle ›".
- First-run checklist: `components/doktor/IlkAdimlarKarti.tsx` + `GET /api/doktor/ilk-adimlar`
  (all counts doctor-scoped per hasta-izolasyon; returns booleans only) + pure logic in
  `lib/doktor/ilkAdimlar.ts`. "New account" = fewer than 3 notes, so live beta doctors never see it.
- Back-nav consistency: `‹ Ayarlar` link on every Ayarlar child (erecete, ses-profili,
  ayse-hafizasi, hesap, personel, entegrasyonlar) matching the existing iletisim/gelen-belgeler
  pattern; `‹ Entegrasyonlar` on faturalama.

**Part C — ipucu system**
- `lib/doktor/ipucu/ipuclari.ts` (copy, 14 sections), `lib/doktor/ipucu/ipucuDurumu.ts` (state),
  `components/doktor/IpucuBaloncugu.tsx` (reusable "?" + popover), `components/doktor/IpucuAyari.tsx`
  (Ayarlar switch, default ON).
- Mounted in: Ana Sayfa, Randevular, Hastalar, Hasta dosyası, Fotoğraflar tab, Yeni muayene
  (`/session/new`), Mesajlar, Gelen Belgeler, Raporlar, e-Nabız, Araçlar, Faturalama, Hasta
  Portalı, Ayarlar.
- Behavior: first-visit auto-show at most once per section; never blocking; Escape/outside-click/
  "Anladım"/"Bir daha gösterme" all close it; tap targets ≥ 40px; at ≤480px the popover docks above
  the tab bar so it can never overflow a 390px screen.
- **Persistence tradeoff (deliberate, v1):** seen/dismissed flags and the global switch live in
  `localStorage` — zero migration, zero PII, but per-device: a doctor on a second browser sees each
  tip's auto-show once more, and clearing site data resets it. Harmless because every balloon is
  dismissible and nothing blocks. When a usage-based heuristic arrives, move to one `jsonb` column
  on `users` and honor the local values as the initial import.
- brans-alan-sizmasi: all 14 tips are universal-chrome copy; a test
  (`lib/doktor/ipucu/ipucu.test.ts`) asserts no specialty vocabulary can enter them.

**Tests:** `lib/doktor/ipucu/ipucu.test.ts`, `lib/doktor/ilkAdimlar.test.ts` (registered in the
suite). `tsc --noEmit` clean.

---

## 4. Part D — structural proposals (NOT implemented; for Kaan's decision)

Ranked by expected simplification per unit of risk. Step counts are clicks for a new doctor
starting from Ana Sayfa.

### D-1. "Muayeneyi Başlat" as a first-class dashboard action with patient picker
**Belgeler-style move:** the exam should start where the doctor already is.
- Before: Ana Sayfa → Hastalar → search/scroll → hasta dosyası → Muayeneyi Başlat = **4 steps**
  (and the doctor must know the verb lives inside the dosya).
- After: Ana Sayfa → "Muayeneyi Başlat" (opens the existing HastaTypeahead; today's randevu
  patients pre-listed) → `/session/new?patientId=…` = **2 steps**.
- Risk: **Medium.** No flow changes inside the muayene itself; purely a new entry point. Needs the
  typeahead to be patient-isolation-safe (it already is — reused component).

### D-2. Promote "Faturalama & Tahsilat" out of Entegrasyonlar
- Before: Ayarlar → Entegrasyonlar → Faturalama kartı → Kurulum/Katalog = **4 steps**, every one
  of them unlabeled from the doctor's vocabulary ("integration"?).
- After: own row in Ayarlar ("Faturalama ve fiyat kataloğu") **and** — once the module is enabled —
  an Araçlar tile next to "Muayene sonu paketi" = **2 steps**. Route stays
  `/dashboard/doktor/entegrasyonlar/faturalama` (no redirects needed), only entry points move.
- Risk: **Low-Medium.** Pure entry-point addition; the only care point is not showing the Araçlar
  tile to personel roles without accounting RBAC.

### D-3. Surface "portal randevu talepleri kapalı — çalışma saatleri tanımlayın" on Randevular
- Before: the RandevuTalepleri card simply never renders; the doctor never learns patients could
  book themselves (**∞ steps** — undiscoverable).
- After: when portal booking is unconfigured, Randevular shows one dismissible line linking the
  randevu-portal settings = **1 step** to the setting.
- Risk: **Medium.** Needs the portal-ayar state exposed to the Randevular page (one extra flag on
  an existing fetch); behavior otherwise unchanged.

### D-4. Rename "İnceleme" to "Onay Kuyruğu" (or "Not Onayı") everywhere user-visible
- Before: dashboard tile "İnceleme", KPI "Bekleyen onay" → `/dashboard/doktor/inceleme` — two
  words for one place, the main word wrong.
- After: one consistent user-visible label; the route stays (no redirect risk).
- Risk: **Medium** — the label appears in copy, tests and learning routines (`rutinTuret`); a pure
  string sweep but a wide one. Do it as its own change set with the ülke-paritesi check.

### D-5. Split the "rapor" vocabulary
- "Raporlar" (analytics) vs Araçlar "Hasta Raporları" (SGK e-Rapor) vs "SGK rapor taslağı"
  (branş tiles). Proposal: analytics nav item becomes "İstatistikler"; "Hasta Raporları" keeps
  "rapor" because that is the official SGK word.
- Risk: **Low-Medium** (string sweep + muscle memory of beta doctors; coordinate with Dr. Gökhan).

### D-6. Collapse the dashboard's three quick-access surfaces into one
- Before: "Hızlı araçlar" strip + "Hızlı erişim" card grid (desktop) + separate mobile grid — three
  slightly different item sets to maintain.
- After: one responsive grid fed by one list (per-branş extras stay registry-driven).
- Risk: **Medium.** Pure dashboard refactor, but Kaan approved the current layout in canvas
  (NOTYA-YENI-GORUNUM-04); needs his sign-off on the merged design.

### D-7. First-visit "Hasta Portalı" handshake inside hasta-ekle
- Belgeler-style: portal access is granted where the patient is created, not in a tool three
  sections away. After saving a new patient, offer one optional "Sağlığım erişimi ver" step
  (reuses the existing portal-link generator).
- Before: Hastalar → dosya → (know that Araçlar › Hasta Portalı exists) → generate = **4+ steps**.
  After: part of the add-patient confirmation = **0 extra steps**.
- Risk: **Medium.** Additive step in hasta-ekle success panel; PIN display rules must be kept
  (shown once, never stored).

**Top recommendation if only one is picked: D-1** — it is the exact "fewest, most logical steps"
move for the single most frequent job in the product, and it is additive.

---

## 5. Country parity

The help system and empty states are shared-spine changes. The six `release/<cc>` builds carry
their own language layer and partially different nav — Turkish copy must NOT be ported as-is.
Port status: country ports of Part B + C are being executed in the same job (per Kaan's 2026-10-17
directive), each through that country's language layer, only for sections that exist in that build;
anything that cannot port is logged in that branch's `docs/OPEN-COMMITMENTS.md`.
