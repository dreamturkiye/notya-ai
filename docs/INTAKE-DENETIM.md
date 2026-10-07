# Intake form audit (NOTYA-INTAKE-DENETIM, 2026-10-07)

Scope: every new-patient intake form ("Hasta Bilgi Formu"). That is the 30 doctor branches in
`lib/intake/bransSorulari.ts`, the 10 Klinik branches (new: `lib/intake/klinikSorulari.ts`) and `genel`.
A form is the shared core (`lib/intake/coreAlanlar.ts → coreBolumlerIcin`) plus one branch section
(`lib/intake/formBransi.ts → intakeBransBolumu`).

Rules applied:

- No stored field was deleted or renamed. Existing answers still read with the same id.
- Changes are relabels, per-branch replacements of a core field (child forms) and new optional fields.
- Only standard history questions were added, with no diagnostic claims.
- Every new or changed question is marked **REVIEW** below.
- `lib/intake/formDenetim.test.ts` checks the rules for all 41 forms.

Clinical sign-off:

- **Pediatri:** Dr. Gökhan.
- **Everything else:** marked REVIEW, waiting on Kaan to name a reviewer. See `docs/OPEN-COMMITMENTS.md`.

## Shared core: every form

| Core question | Status |
|---|---|
| Identity: T.C. kimlik, ad, soyad, doğum tarihi, cinsiyet, doğum yeri, anne/baba adı | present |
| Contact: cep telefonu, e-posta, adres, şehir | present |
| Veli / Yasal Temsilci (minors only, by age) | present, unchanged |
| Emergency contact (optional everywhere) | present, unchanged |
| Sağlık güvencesi | present |
| Chronic conditions (`kronikHastaliklar`) | present |
| Past operations (`gecirilmisAmeliyatlar`) | present |
| **Hospital stays (`hastaneYatislari`)** | **added**: optional textarea. **REVIEW** |
| Current medicines (`kullaniyorMu` + `kullanilanIlaclar`) | present |
| Allergies (`alerjiVarMi` + `alerjiAciklama`) | present |
| Family history (`aileOykusu`) | present |
| Habits: smoking, alcohol (adult forms) | present |
| Consent: KVKK, WhatsApp / e-posta izni, gelen belge izni | present, unchanged |
| Reason for the visit | Comes from the branch section's first question (`basvuruNedeni*`). `genel` had none and now gets a one-question "Başvurunuz" section |

**Child forms** (`COCUK_FORMU_BRANSLARI` = pediatri, çocuk cerrahisi) replace these core questions:

| Field | Adult form | Child form |
|---|---|---|
| `medeniDurum` | Medeni Durum: Bekâr / Evli / Boşanmış / Dul | **Anne ve babanın medeni durumu**: Evli / Boşanmış / Ayrı yaşıyor / Evli değil / Anne veya baba vefat etti. Still required. **REVIEW** |
| `sigara` | Sigara Kullanımı | **Evde sigara içen var mı?** Evet / Hayır. The old pediatric answers were Evet / Hayır too |
| `alkol` | Alkol Kullanımı | not asked |
| `kronikHastaliklar` + `gecirilmisAmeliyatlar` | separate | one "Özgeçmiş — Hastalık / Ameliyat" textarea (unchanged pediatric design) |
| `hastaneYatislari` | Daha Önce Hastanede Yattınız mı? | Çocuğunuz daha önce hastanede yattı mı? (yenidoğan yoğun bakım dahil) |

Old `medeniDurum` answers on pediatric forms:

- 'Evli' and 'Boşanmış' match the new options word for word.
- An old 'Bekâr' or 'Dul' answer stays stored and still shows in the doctor view. It is just not one of the new options.

**Pregnancy / nursing** (`GEBELIK_EMZIRME`, id `gebelikEmzirme`):

- Shown only when the form's Cinsiyet is Kadın.
- Includes "Bu soru bana uygun değil".
- Added where it changes what may be done: plastik cerrahi, anestezi, and the Klinik branches saç ekimi, medikal estetik, estetik cerrahi, longevity, fizyoterapi and diyetisyen.
- **REVIEW**

Branches that already asked it: kadın doğum, dermatoloji (and klinik dermatoloji through the same question), radyoloji.

## Open items for every form (REVIEW)

1. **Minors in adult branches.** A 12-year-old seen in göz, KBB or ortopedi still gets the adult core: medeni durum, plus their own smoking and alcohol. Only the two child branches were changed. Fixing this needs age-gated fields, not just branch-gated ones, and the clinical rule is the reviewers' to make. Adolescent smoking, for example, is clinically relevant. Not done.
2. **Branch sections are not validated on the server.** `app/api/intake/[token]` POST validates the core only. This was already the case before this audit. Required questions in branch sections, such as the psychology safety question, are enforced by the browser only.
3. **Klinik answers are not indexed for file search.** `lib/doktor/dosyaAlanTara.ts` reads `BRANS_SORULARI` only, so Klinik answers are not labelled in dosya field search. The doctor's intake view (`HastaIntake`) does label them.
4. **Duplicate questions.** Some branches repeat a core question. The duplicates are harmless and were kept, but a reviewer may want them hidden:
   - kardiyoloji risk factors include Sigara
   - plastik cerrahi `sigaraPlastik`
   - kalp-damar cerrahisi `sigaraKDC`
   - acil tıp `allerjiAcil`
   - anestezi `kullanilanIlaclarAnestezi`

---

## Doctor branches

### Pediatri (sign-off: Dr. Gökhan)

**Core:**
- Present, in the child form.
- `medeniDurum` was relabelled to the parents. **REVIEW**: the options, and whether it should stay required.
- `sigara` now asks about smoking at home.
- `hastaneYatislari` added with child wording.

**Kept:** başvuru nedeni, gebelik komplikasyonu, gebelik haftası, doğum kilosu / boyu / baş çevresi, anne / baba boyu, doğum şekli, doğum sonrası.

**Added (optional), each REVIEW:**
- `beslenmePed`: anne sütü / mama / ek gıda / aile sofrası.
- `asiTakvimiPed`: aşılar takvime göre tam mı.
- `okulKresPed`: kreş / okul.

**Removed:** none.

### Kardiyoloji

**Core:** present. **Kept:** everything (acil kutuları, semptomlar, kalp geçmişi, risk faktörleri, girişimler, aile öyküsü). **Added / removed:** none.

**REVIEW:** risk factors repeat Sigara.

### Nöroloji

Core present. Kept everything. Nothing added or removed.

### Dahiliye

Core present. Kept everything. Nothing added or removed.

### Psikiyatri

Core present. Kept everything, including the safety question and acil kutuları. Nothing added or removed.

### Genel cerrahi

Core present. Kept everything. Nothing added or removed.

**REVIEW:** there is no pregnancy question before surgery. None was added.

### Ortopedi

Core present. Kept everything. Nothing added or removed.

### Dermatoloji

Core present. Kept everything, including the pregnancy question `gebelikDurumuDerm`. Nothing added or removed.

### Kulak burun boğaz

Core present. Kept everything. Nothing added or removed.

### Göz hastalıkları

Core present. Kept everything. Every requested eye question is present:

| Question | Field |
|---|---|
| Glasses | `gozlukKullanimi` |
| Contact lenses | `kontaktLensKullanimi` |
| Previous eye surgery | `oncekiGozOperasyonlari` |
| Diabetes | `kronikRahatsizliklarGoz` |
| Family glaucoma | `aileGozHastaligiOykusu` |

No birth weight. Nothing added or removed.

**REVIEW:** "sudden vision change" is asked through the emergency box (`acilBelirtiler` → Ani görme kaybı), not as a separate history question.

### Kadın hastalıkları ve doğum

Core present. Kept everything, including adet, gebelik, gebelik haftası (conditional) and smear / mamografi. Nothing added or removed.

### Üroloji

Core present. Kept everything. Nothing added or removed.

### Radyoloji

Core present. The reason for the visit is `basvuruNedeniRad`. Kept everything, including contrast, pregnancy and implants. Nothing added or removed.

### Anestezi

Core present. The reason for the visit is `basvuruNedeniAnestezi`. Kept everything.

**Added:** `gebelikEmzirme`. **REVIEW**

**REVIEW:** `kullanilanIlaclarAnestezi` repeats the core medicines question.

### Acil tıp

Core present. Kept everything. Nothing added or removed.

**REVIEW:** `allerjiAcil` repeats the core allergy question.

### Fizik tedavi (FTR)

Core present. Kept everything. Nothing added or removed. Family history comes from the core.

### Enfeksiyon hastalıkları

Core present. Kept everything. The adult vaccination question stays: it is adult vaccination, not the childhood schedule. Nothing added or removed.

### Endokrinoloji, Gastroenteroloji, Nefroloji, Romatoloji, Onkoloji

Each: core present. Kept everything. Nothing added or removed.

### Göğüs hastalıkları

Core present. Kept everything. `sigaraPaketYili` stays as a detail question about smoking. Nothing added or removed.

### Göğüs cerrahisi

Core present. Kept everything. Nothing added or removed.

### Plastik, rekonstrüktif ve estetik cerrahi

Core present. Kept everything.

**Added:** `gebelikEmzirme`. **REVIEW**

**REVIEW:** `sigaraPlastik` repeats the core smoking question.

### Beyin cerrahisi

Core present. Kept everything. Nothing added or removed.

### Kalp ve damar cerrahisi

Core present. Kept everything. Nothing added or removed.

**REVIEW:** `sigaraKDC` repeats the core smoking question.

### Çocuk cerrahisi

**Core:** now the child form. Before this audit, the child was asked medeni durum and their own smoking and alcohol. **REVIEW**

**Kept:** everything, including `cocukAsiTakvimi`. **REVIEW:** vaccination outside pediatri. It was kept because it is a standard pre-operative question in a children's surgery form.

**Added / removed:** none in the branch section.

### Aile hekimliği

Core present. Kept everything, including the adult vaccination question. Nothing added or removed.

### Spor hekimliği

Core present. Kept everything. Nothing added or removed.

### Genel (no branch)

Core present. **Added:** a "Başvurunuz" section with the reason for the visit only. Before this, no form-level reason was asked.

## Klinik branches

**Before:**
- Every Klinik practice's form was stored as `genel`.
- Patients got the core only, with no branch questions.

**Now:**
- The form key is the Klinik slug: `intakeFormBransi` when no branch is requested, and `intakeFormAnahtari` validates a branch the doctor picks.
- Each branch has its own section in `lib/intake/klinikSorulari.ts`.
- The doctor's branch dropdown has a "Klinik" group.

Every question below is new and optional unless noted. The **whole section is REVIEW**. Each one starts with the reason for the visit (`basvuruNedeni`).

### Saç ekimi

**Added:**
- duration and area of loss
- scalp complaints
- previous treatments
- previous transplant (year / place)
- lokal anestezi problems
- keloit
- kan sulandırıcı
- gebelik / emzirme
- family hair loss

**Removed:** none. **No other branch's questions:** checked by test.

### Medikal estetik

**Added:**
- treatments of interest
- previous treatments and their problems
- skin diseases
- frequent uçuk
- autoimmune disease
- keloit
- kan sulandırıcı
- gebelik / emzirme

### Estetik cerrahi

**Added:**
- area of interest
- previous aesthetic procedures
- anaesthesia problems
- wound healing
- bleeding disorder
- previous clot (DVT / PE)
- kan sulandırıcı
- gebelik / emzirme

Separate from the TUS plastik cerrahi form.

### Dermatoloji (Klinik)

**Added:** the shared dermatology questions, reused by id from the dermatoloji section:
- duration, skin type, lesion features
- emergency box
- new medicine in the last 8 weeks
- sun exposure
- known skin diseases, previous treatments
- pregnancy
- family skin cancer
- products used, skin allergies

**Not included:** the specialist fototerapi and yama testi questions.

### Longevity & wellness

**Added:**
- activity, sleep, stress, diet
- supplements
- last check-up, screening tests done
- gebelik / emzirme
- early family disease (under 55–65)

### Fizyoterapi

**Added:**
- area and duration of the complaint
- pain 0–10
- daily limitation
- whether a physician referred them
- tests in hand
- previous surgery on that area
- previous physiotherapy
- aids
- gebelik / emzirme

Separate from the FTR form; the FTR red-flag box was not copied.

### Ergoterapi

**Added:**
- duration
- daily-life areas of difficulty
- physician's diagnosis (free text, "raporunuz varsa getirin")
- previous therapies
- aids
- school / work

Suitable for children and adults. No pregnancy question.

### Diyetisyen

**Added:**
- height and weight (self-reported, optional)
- weight change in 6 months
- meals per day
- water intake
- special diet
- food allergy / intolerance
- activity
- previous dietitian support
- gebelik / emzirme

### Klinik psikoloji

**Added:**
- duration
- areas of difficulty
- previous support
- psychiatric medicine now
- **safety question (required)**: "kendinize zarar verme…", with a 112 line. **REVIEW:** the wording and whether it is required in a psychologist's form. It is separate from the psikiyatri question and red-flag box, which stay psikiyatri-only.

### Odyoloji

**Added:**
- ear, duration
- sudden onset in the last 3 days. Its help line sends sudden loss the same day to KBB / acil; it is a referral line, not a diagnosis.
- tinnitus, dizziness
- noise exposure
- hearing aid
- ear surgery
- family early hearing loss

Separate from the KBB form.
