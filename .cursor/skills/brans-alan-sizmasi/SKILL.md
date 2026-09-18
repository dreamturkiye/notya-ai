---
name: brans-alan-sizmasi
description: >-
  Standing rule for every field, form section, vocabulary choice, or UI
  element added anywhere in Notya: something specific to ONE specialty must
  never render, appear, or get generated for a doctor in a DIFFERENT
  specialty. Use before merging any change to a shared/baseline-spine
  component (Yaşamsal Bulgular, Anamnez, SOAP, hasta/veli özeti, portal,
  intake, SGK rapor, epikriz, Asistan sohbet) — and when writing the PR
  description for one. Answers "is this genuinely universal, or does it
  belong behind a specialty gate?" This is the mirror image of
  cross-specialty-parity: that skill says a FIX must reach every branch;
  this skill says a specialty-SPECIFIC thing must reach only its own branch.
---

# Branş alan sızması (bir branşa özel bir şey başka branşta görünmemeli)

Boss rule (verbatim intent, from two live bugs he found as a Kadın Doğum
doctor): the Yaşamsal Bulgular form showed a **Baş Çevresi** (head
circumference) field — pediatri-only, meaningless for an obstetrics patient —
and the hasta/veli özeti used the word **"veli"** (guardian) — pediatri-only
vocabulary, wrong for an adult KD patient with no guardian. Neither was
gated. Both leaked from wherever they were written straight into every
specialty's shared form.

> **Correction — VELI-YASAL-ONAM (Kaan, 2026-09-17, Turkish law).** "Veli" is decided by the patient's
> **age, not the branch**: "18 yaşını doldurmamış her çocukta klinik kayıt ve tıbbi onam için veli / yasal temsilci bilgisi alınır." A 10-year-old seen by göz / KBB / ortopedi /
> kardiyoloji gets veli wording too. Narrow exceptions: acute emergency (treat, inform the guardian after) and a minor
> emancipated by marriage or court order (own consent, document required — no data field yet, OPEN). What stays
> pediatri-only is the **clinical** content (Baş Çevresi, Neyzi, sağlam çocuk). The KD bug above is still a leak
> because that patient was an **adult**.
>
> **Follow-up — intake veli section + acil durum kişisi (Kaan, 2026-09-17).** A patient whose age is known and ≥18
> never gets veli wording or a veli field, in **any** branş, pediatri included (`veliDiliMi`: pediatrik bağlam only
> falls back to veli when the age is unknown). The intake form's "Veli / Yasal Temsilci" section lives in the shared
> spine (`VELI_BOLUMU` in `lib/intake/coreAlanlar.ts`) and is gated by `veliKosulu` → `veliOnamGerekliMi` on the
> form's own doğum tarihi: required for minors, never drawn, validated or saved for adults. **"Acil Durumda Aranacak
> Kişi" is OPTIONAL everywhere, permanently.** Do not mark those fields `zorunlu` on any surface. It is a separate
> section from veli: veli is legal representation and consent; the emergency contact is only a phone number to call.

His principle: things specific to one specialty — forms, dosyalar,
vocabulary, sections, fields — must never carry over to another specialty.
Optometri (göz-hastalıkları) will have many eye-specific fields; none of
them should ever appear for a Kardiyoloji or Pediatri doctor, and vice versa.

## Why the two bugs leaked (root causes — so they are not repeated)

| Bug | Root cause | Fix (BRANS-ALAN-SIZMASI, 2026-09-17) |
|-----|------------|------|
| Baş Çevresi on the KD vitals form | `SpecialtyProfile.olcumler` **correctly** declared baş çevresi as pediatri-only — but **no screen read the profile**. `inceleme/page.tsx` and `notlar/[id]/page.tsx` hardcoded `['ates', …, 'basCevresi']` unconditionally. The SOAP JSON template also carried `"basCevresi"` for every branch (a fetal HC dictated in a KD visit could land in the mother's vitals). | The form renders the server-computed `bransKapsami.olcumler` through one shared component, `components/doktor/YasamsalBulgularFormu.tsx`. The JSON key is pediatric-only and `vitalleriKapsamaGoreSuz` strips it from model output. |
| "Hasta/veli özeti" + veli wording in a KD summary | SOAP *generation* was already gated. The leak came from the **labels** (İnceleme, not sayfası, yazdır), the **request** the "↻ Notuma göre yenile" button sends ("hasta/veli özetini yeniden yaz") and the **not-konsult system prompt** ("veliye giden özet"), so the model rewrote KD summaries in guardian wording. The gate itself had holes: `/^(genel\|aile)/` matched `genel-cerrahi`, `some()` let a stale `'pediatri'` value beat a KD branch, and a branch-less doctor counted as pediatric. | Every hitap string lives in `lib/specialties/hitap.ts`; one decision function, `pediatrikBaglamMi()`. |

The lesson both bugs share: **a registry that declares the right thing is no protection if the screen never reads it.**

## The architecture this rule rests on

Same spine as cross-specialty-parity:

| Layer | What it is | Who uses it |
|-------|------------|-------------|
| **Shared spine** | Yaşamsal Bulgular, Anamnez, SOAP üretimi, hasta/veli özeti, İnceleme/onay, portal, intake, SGK rapor, epikriz | **Every** specialty, by construction |
| **Chapter delta** | `specialties/<slug>/` — own `prompts/`, `engines/`, `ui/` | Only the specialties that have a folder |
| **Profile registry** | `lib/specialties/<key>.ts` + `registry.ts` | Chapters with a `SpecialtyProfile`; everything else falls back to `baselineProfile(...)` |

The failure mode this skill guards against is the **opposite direction**
from parity: a specialty-specific thing gets written directly into a
*shared* component instead of behind a gate — so instead of missing one
branch, it leaks into all 29+ of them.

`lib/intake/bransSorulari.ts` is the reference model for doing this
correctly: content is branch-keyed from the start, so a KD-only question
never appears for a dahiliye doctor. Any new specialty-specific content
should look like that, not like an unconditional field in a shared form.

### The single decision point: `lib/specialties/kapsam.ts`

Shared components do not look at the branch key themselves — they ask the gate:

```ts
pediatrikBaglamMi({ seansBransi, doktorBransi, hastaDogumIso })  // CLINICAL: baş çevresi, Neyzi, sağlam çocuk, pediatric prompt lines
veliOnamGerekliMi(hastaDogumIso, nowMs?)  // LEGAL: patient < 18 (calendar age, TRT) — no branch input at all
veliDiliMi({ seansBransi, doktorBransi, hastaDogumIso })        // HİTAP: veliOnamGerekliMi || pediatrikBaglamMi
notOlcumleri(...)       // Yaşamsal Bulgular fields, from profile.olcumler (ateş first)
bransKapsami(...)       // { brans, pediatrik, veliDili, olcumler, hitap } — the server computes it, the client only renders it
vitalleriKapsamaGoreSuz(vitaller, kapsam)   // strips a pediatric-only vital from model output
```

- **Branch resolution:** the session's branch (when it is a real branch) → else the doctor's `users.specialty`
  (legacy values like `'kadin-dogum'` resolve through `bransAnahtari()`) → else branch-less ("genel").
- **`PEDIATRIK_BAGLAM: Record<SpecialtyKey, 'her-zaman' | 'cocuk-hastada' | 'asla'>`** in `profile.ts` — all 30
  branches written out, no default (the `bransSorulari` shape): pediatri + çocuk cerrahisi `her-zaman`;
  aile hekimliği and branch-less `cocuk-hastada` (= a patient **known** to be under 18); the other 27 `asla`
  (no baş çevresi / Neyzi even for a child patient). This drives **clinical** content only — wording for a minor
  comes from `veliOnamGerekliMi` in every branch (VELI-YASAL-ONAM).
- **Client default** (`kapsamIstemci.ts`): no package from the server → baseline + "hasta". A default never carries
  a branch's content. `specialtyProfile(null)` is baseline "genel", **not** pediatri.

## The check (run before adding ANYTHING to a shared/baseline component)

1. **Ask: is this field/section/word genuinely true for every specialty, or
   only for one (or a few)?** "Baş Çevresi" is true only for pediatri (and
   maybe neonatoloji). "Veli" is true only where the patient can legally be
   a minor — pediatri, not KD/dahiliye/göz/kardiyoloji/dermatoloji/etc.
   *(Corrected by Kaan 2026-09-17: "veli" follows the patient's age — every
   patient under 18, in every branch, via `veliDiliMi`; an adult patient never
   gets it. Only clinical content like Baş Çevresi is branch-gated.)*
2. **If it's universal** — leave it in the shared component, no gate needed.
3. **If it's specialty-specific** — gate it explicitly using the
   `SpecialtyProfile`/registry mechanism (or the `specialties/<slug>/` own
   files), never a bare unconditional render. Never assume "it'll just be
   empty/ignored for other branches" — an empty field a KD doctor sees is
   still a leak; it signals the wrong thing was even considered.
4. **Never hardcode a single specialty string check scattered ad hoc** — if
   the gate mechanism doesn't yet support the component you're touching,
   extend the mechanism once, consistently, rather than adding a fifth
   different `if (specialty === 'pediatri')` pattern in a fifth different file.
5. **Read the current specialty list live, never from memory:**
```bash
   ls specialties/                 # chapters with their own delta folder
   sed -n '/^const CHAPTERS/,/^}/p' lib/specialties/registry.ts
```
   This list grows. A hardcoded assumption about "which specialties need X"
   goes stale.
6. **Patient-dependent (age / sex)?** An age gate goes **on top of** the branch gate, never instead of it.
   An unknown age never counts as "child" (the one exception: a pediatri doctor's own patient).

### Which mechanism for which kind of content

| Content | Mechanism |
|---------|-----------|
| Vital / measurement field | `SpecialtyProfile.olcumler` (+ `kosul`) → `notOlcumleri()` → `YasamsalBulgularFormu` |
| Wording (hasta ↔ veli) | `lib/specialties/hitap.ts` → `bransKapsami().hitap` (decided by `veliDiliMi` — patient age, every branch) |
| LLM prompt line | clinical: `pediatrikBaglamMi()` / the `ped(…, …)` selector; wording: the `hitap(…, …)` selector fed by `veliDiliMi`; chapter locks in `specialties/<slug>/prompts` |
| Hasta dosyası tab **and its mount** | `lib/doktor/hastaDosyaSekmeleri.ts` — the tab button and the content mount use the **same** boolean (a `?tab=` deep link must not bypass the gate) |
| Doktor Araçları tile | `specialty-doktor-araclari` (ORTAK vs BRANS + deep-link guard) |
| Sağlığım module | `SpecialtyProfile.portal` + `lib/portal/moduller.ts` (`specialty-hasta-portali`) |
| Intake section | `BRANS_SORULARI: Record<SpecialtyKey, …>` (unknown key → no section) |
| Document header / signature | `bransKapsami().brans` → `klinikAdi` / `resmiUzmanlikAdi`; no branch → **no line** |

### Hunt the defaults (the sneakiest leak)

```bash
# defaults that fall back to pediatri (or any branch):
rg -n "\|\| ?'pediatri'|\?\? ?'pediatri'|useState<[^>]*>\('pediatrik'\)|genel: 'pediatri'" app lib components core
# branch-specific words / fields hardcoded in shared files:
rg -n "veli|Baş Çevresi|sağlam çocuk|AŞI KARNESİ|Neyzi|gebelik haftası|Görme Keskinliği|PASI" \
   app/dashboard app/api components lib/doktor --glob '!**/*.test.ts'
# loose branch regexes (substring match catches another branch: 'genel' ⊂ 'genel-cerrahi'):
rg -n "\|genel\||\|göğüs\||\|aile\|" app components lib
```

For every hit: is there a gate, does it select the right branches, and what happens for an unknown / empty branch?

### Gate all three layers

A wording or field leak is only closed when **the UI label, the LLM prompt, and the model-output sanitizer** are all
gated. Fixing only the label leaves the model writing "veli" into the portal text.

### Test both directions

`lib/specialties/brans-alan-sizmasi.test.ts` (pure layer, a real `react-dom/server` render of the vitals form,
prompt checks, source locks on the shared pages) and `lib/specialties/brans-alan-sizmasi-rotalar.test.ts`
(synthetic QA doctors through the real route handlers). A new gate is tested **both ways**: present for the owning
branch (pediatri not broken) **and** absent for at least three foreign branches (KD, dahiliye/derm, göz). Loop over
`Object.keys(BRANS_ETIKETLERI)` (30/30) instead of hand-listing branches.

```bash
npm run test:brans-sizmasi
```

## PR description requirement

Any PR that touches a shared/baseline component and adds specialty-flavored
content must state explicitly: which specialty(ies) this belongs to, and
what gate mechanism restricts it to them. "Added Baş Çevresi to vitals" is
not enough — "Baş Çevresi gated to pediatri via `SpecialtyProfile.olcumler`
+ `lib/specialties/kapsam.ts`" is.

Required block, Turkish, in the PR body (next to cross-specialty-parity's "Branş kapsamı"):

```markdown
### Branş sızıntısı
- **Eklenen/değişen içerik:** "Baş Çevresi" ölçümü / "veli" hitabı / …
- **Sınıf:** evrensel (baseline) | branşa özgü (<branşlar>) | hastaya bağlı (yaş/cinsiyet) + branş
- **Kapı:** `SpecialtyProfile.olcumler` / `PEDIATRIK_BAGLAM` / `hastaDosyaSekmeleri` / `specialties/<slug>/` …
- **Varsayılan (branş bilinmiyorsa):** baseline, "hasta" dili — pediatri değil
- **Test:** sahibi branşta var ✅, KD / dahiliye / göz'de yok ✅ (`brans-alan-sizmasi*.test.ts`)
```

Reviewers should reject a shared-component PR that omits it.

## Anti-patterns

- Declaring a field in the profile and then hardcoding a list on the screen (the baş çevresi bug itself).
- Hedged text that covers two branches at once (`"hasta/veli"`) — adult wording says "hasta"; "veli" appears only for
  a minor patient (any branch) or in pediatric context.
- Gating veli wording on the **branch** (`pediatrikBaglamMi`) — it is a legal, age-based rule (`veliDiliMi`); a göz
  doctor's 10-year-old patient needs guardian wording. And the reverse: gating baş çevresi / Neyzi on **age** alone.
- `|| 'pediatri'`, `genel: 'pediatri'`, `useState('pediatrik')` — unknown means pediatri.
- Substring regexes (`/genel|göğüs/`) — they catch `genel-cerrahi`, `gogus-cerrahisi`. Resolve to the canonical key
  (`bransAnahtari`) and write exclusions explicitly.
- Hiding a tab button while the content mounts on `activeTab === 'x'` alone (reachable via `?tab=`).
- Stripping the owner branch while fixing the leak — pediatri keeps its form, veli wording and Neyzi unchanged.
- Silently deciding an ambiguous case — write it as OPEN in `docs/OPEN-COMMITMENTS.md`.

## Quick checklist

```
- [ ] Content classified: universal / branch-specific (which branches) / patient-dependent + branch
- [ ] Branch-specific → gated through an existing mechanism (profile, Record table, kapsam.ts, specialties/<slug>/)
- [ ] No unconditional hardcoded field/word in a shared file (rg checked)
- [ ] Unknown branch → baseline + "hasta", never pediatri
- [ ] UI label + LLM prompt + model-output sanitizer all gated
- [ ] Tab button and content mount behind the same gate
- [ ] Tests: present for the owner, absent for ≥3 foreign branches; 30/30 loop
- [ ] PR body carries the "Branş sızıntısı" block
```

## Related

- `.cursor/rules/brans-alan-sizmasi.mdc` (always-on Cursor rule)
- `.cursor/skills/cross-specialty-parity/SKILL.md` (mirror: shared *fixes* must reach every branş)
- `.cursor/skills/specialty-universal-vs-chapter/SKILL.md`
- `.cursor/skills/specialty-doktor-araclari/SKILL.md` (Araçlar visibility)
- `.cursor/skills/specialty-hasta-portali/SKILL.md`
- Open decisions from the first audit: `docs/OPEN-COMMITMENTS.md` → BRANS-ALAN-SIZMASI
