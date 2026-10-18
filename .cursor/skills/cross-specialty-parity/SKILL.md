---
name: cross-specialty-parity
description: >-
  Standing rule for every bug fix or feature change in Notya: a fix made where a
  bug was *noticed* must actually land for **all** branches Notya supports, not
  just that one — AND, when the change is core/universal (not one branş's own
  clinical content), for all six countries, each adapted to its own language
  and legal requirements, not copy-pasted. Use before closing out any change to
  a shared/baseline-spine component (SOAP, İnceleme/onay, reçete/Medula, Belge
  Kasası, randevu/takvim, epikriz, Asistan sohbet, Sağlığım portal shell,
  intake, doz kilidi, kaynak kilidi, markdown render, mobil düzen, görsel
  yakalama) — and when writing the PR description for one. Answers "does any
  specialty, or any country, have its own forked copy of this that would miss
  the fix?"
---

# Cross-specialty parity (tek yerde düzelttim ≠ her branşta düzeldi)

Boss rule (verbatim intent): **uygulamanın herhangi bir yerinde yaptığın düzeltme
veya iyileştirme, Notya'nın desteklediği bütün branşlarda gerçekten geçerli
olmalı** — sadece hatanın fark edildiği branşta değil.

A bug is almost always *reported* from one specialty's screen. The fix is only
finished when you can say which specialties it reaches and why.

## The architecture this rule rests on

Notya is **one shared baseline spine + a few specialty deltas on top.**

| Layer | What it is | Who uses it |
|-------|------------|-------------|
| **Shared spine** | SOAP üretimi, İnceleme/onay, reçete/Medula, Belge Kasası, randevu/takvim, epikriz, Asistan sohbet, Sağlığım portal shell, intake, lab çıkarım, doz kilidi, kaynak kilidi | **Every** specialty, by construction |
| **Chapter delta** | `specialties/<slug>/` — own `prompts/`, `engines/`, `ui/`, `tests/` | Only the specialties that have a folder |
| **Profile registry** | `lib/specialties/<key>.ts` + `registry.ts` | Chapters with a `SpecialtyProfile`; everything else falls back to `baselineProfile(...)` |

`lib/doktor/specialties.ts` is the medical branch list (**30 entries today**).
Most of them have **no** `specialties/<slug>/` folder and **no** profile —
they run the shared spine as-is.

The same spine also covers the **10 Özel Branşlar** in
`lib/specialties/klinikDikey.ts` (`KLINIK_YENI_SLUGS`: saç ekimi, estetik
cerrahi, medikal estetik, klinik dermatoloji, longevity, fizyoterapi, klinik
psikoloji, diyetisyen, ergoterapi, odyoloji). Read that list live too. Do not
hardcode it.

Boss rule (2026-10-18): a core feature that is **not** one branş's own screen
lands for **all 30 medical branches and all 10 Özel Branşlar in the same
change**. No exceptions. Examples: muayene ekranı, reçete, randevu, hasta
kaydı, MBYS paketi, hasta portalı shell, faturalama / tahsilat, aşı onam once
it is general, and any shared workflow or data model. The doctor application
stays **one product** — do not ship a second doctor app for Özel Branşlar or
for Notya Klinik. Specialty screens and tools stay in their own branch
(`brans-alan-sizmasi`). Notya Klinik (2–10 doctors) is a shared layer on that
same product, not a thirty-first branş and not a rename of Özel Branşlar.

> **Never hardcode the chapter list in your head or in a doc.**
> Read it live every time:
> ```bash
> ls specialties/                 # chapters with their own delta folder
> sed -n '/^const CHAPTERS/,/^}/p' lib/specialties/registry.ts   # chapters with a profile
> ```
> This list grows with every chapter sprint. A hardcoded list goes stale and
> silently stops protecting the newest branch.

## The check (run before closing ANY shared-spine change)

### 1. Name the shared file(s) you actually touched

`git show --stat <sha>` — list the paths. If the fix landed in
`lib/…`, `core/…`, `components/…`, `app/api/…` or `app/dashboard/…`,
it is spine code.

### 2. Baseline-only specialties — covered automatically

For every branch in `lib/doktor/specialties.ts` **and** every slug in
`KLINIK_YENI_SLUGS` **without** a `specialties/<slug>/` folder, a
properly-scoped spine fix applies **by construction**. No per-specialty
verification, no per-specialty test, no "let me check kardiyoloji too"
busywork. If Özel Branşlar has its own copy of the screen (portal module,
tool page, prompt), that copy gets the same fix in this change.

"Properly scoped" means: the fix went into the shared component itself and was
**not** duplicated into a chapter fork instead.

**One exception — verify per-branch when the fixed behavior is gated by
specialty.** If the code you touched branches on `users.specialty`,
`SpecialtyKey`, `specialtyProfile(...)`, `brans`, a persona/agent id, or an
eligibility rule, then "shared file" does **not** imply "same behavior
everywhere". Walk the gate and say what the default branch does.

### 3. Chapters with their own folder — check each one individually

For each entry printed by `ls specialties/`, ask: **does this chapter own a
forked copy of the thing I just fixed?** Typical forks to grep for:

```bash
# own system prompt wording (doz/kaynak/citation/persona rules)
rg -n 'doz|mg|kaynak|kılavuz|persona' specialties/*/prompts/system.md

# own copy of a spine UI component
ls specialties/*/ui/

# own copy of spine logic (renderer, parser, validator, guard)
rg -n '<symbol you fixed>' specialties/
```

Three outcomes, all acceptable — pick one and **write it down**:

- **Inherits** — chapter calls the shared code; fix reaches it for free.
- **Has its own equivalent protection** — chapter forked, but its fork already
  says/does the right thing. Say so, and don't churn it.
- **Forked and missing the fix** — apply the equivalent fix there, **matching
  the pattern used in the original fix** (same wording style for a prompt, same
  helper for code), and add/extend the chapter's test.

### 4. Prompts are the sneakiest fork

`specialties/<slug>/prompts/system.md` is the highest-risk duplicate in this
repo: each chapter's system prompt can independently re-introduce a class of
bug the shared guard just fixed (uydurma doz, hafızadan kılavuz numarası,
pediatrik persona sızıntısı, uydurma form adı). A runtime code guard
(`lib/doktor/dozKilidi.ts`, `lib/doktor/kaynakKilidi.ts`) covers every branch,
but the per-chapter prompt is what stops the model producing the text in the
first place — **both layers must carry the rule.** Each chapter has a
`tests/promptsLock.test.ts`; that is where the assertion belongs.

## PR description requirement (non-negotiable)

Any PR that touches shared-spine code **must** state which specialties were
checked and considered. "Fixed X" is not enough.

Required block, Turkish, in the PR body:

```markdown
### Branş kapsamı
- **Ortak omurga dosyası:** `lib/vault/validation.ts`, `components/doktor/DocumentViewer.tsx`
- **Baseline branşlar (kendi klasörü olmayan ~26):** ortak bileşen düzeltildiği için
  otomatik kapsanıyor; branşa göre dallanan davranış yok.
- **Kendi klasörü olanlar:** dahiliye ✅ (kendi kopyası yok, ortak Kasa'yı çağırıyor),
  dermatoloji ✅ (aynı), kadın-doğum ✅ (aynı), göz ✅ (aynı).
- **Bulunan fork:** yok / `<slug>` kendi `prompts/system.md` içinde aynı kuralı
  taşımıyordu → eşdeğer kural eklendi + promptsLock testi.
```

Reviewers should reject a shared-spine PR that omits it.

## Six-country propagation (Türkiye golden reference → ülke paketleri)

Boss rule (verbatim intent, 2026-10): **notya.io (Türkiye, `main`) is the golden
reference.** When a change there is *core/universal* — not one branş's own
clinical content — it is not finished until it has also reached the other six
countries (us, gb, ca, au, nz, uz; `release/<code>` branches, `countries/<code>/`
packs), each with **its own** language, legal text and clinical sourcing. This
rule sits beside — does not replace — the branş-parity check above: classify
by branş first, then by country.

### 1. Classify what actually changed

| Kind | Example from this repo | Propagates to the 6 countries? |
|------|-------------------------|---------------------------------|
| **Universal mechanism** — chapter-agnostic, carries no clinical content | `GorselYakalaPaneli` (camera/file capture, downscale, PDF attach, generic visit-linked upload) | **Yes** — same mechanism, wired per country |
| **Specialty clinical content, universally relevant to that branş** | Dermatoloji body map / lesion cards / PASI-EASI; KBB otoskopi/nazoendoskopi dual-sign; plastik cerrahi standardized views; göz fundus/OCT rule-based taslak | **Yes, to that same branş in each country that has it** — but **independently sourced per country** (own clinical references, own language), never copied verbatim from the Turkish version |
| **Turkish-only legal/regulatory content** | KVKK consent wording, Medula/SUT report text, Form 014, Turkish MoH circulars | **No** — each country has its own regulator and its own equivalent, sourced separately (e.g. Uzbekistan's KDIGO rollout was sourced from its own MOH order, not copied from the English roster) |
| **One branş's content unrelated to the change's purpose** | Derm's PASI/EASI fields appearing on kardiyoloji | **No, never** — this is branş-alan-sızması, not a propagation gap |

If a change doesn't fit cleanly, default to the narrower reading: propagate the
*mechanism*, re-source the *content*, never propagate *country-specific legal
text*.

### 2. For a universal mechanism — propagate the shape, not the content

Ship the same component/contract to every country's pack, but let each
country's own specialty wiring, language strings and legal gates differ. "Same
mechanism" means: same props/behavior/upload contract; it does **not** mean
copy-pasting Turkish UI strings or Turkish-specific consent checkboxes (KVKK)
into a country pack that has its own privacy regime.

### 3. For specialty clinical content — propagate the branş, re-source the facts

When a branş gets a new clinical module in Türkiye (a scoring system, a
standardized capture vocabulary, a dual-sign bridge), the same branş in each of
the six countries that offers it needs its own equivalent — built from that
country's own clinical references, in that country's language — not a
translated copy of the Turkish content. Log each country's sourcing
separately in the PR/commit, the same way KDIGO's six-country extension cited
each country's own source rather than the Turkish roster.

### 4. PR description requirement — "Ülke kapsamı" block

Any PR whose change is core/universal (table 1 above) must state which
countries were updated, which were N/A, and why — alongside the existing
"Branş kapsamı" block:

```markdown
### Ülke kapsamı
- **Mekanizma (evrensel):** aynı `GorselYakalaPaneli` sözleşmesi altı ülkede de kullanılacak.
- **Bu PR'da yapılan:** Türkiye (main) — golden reference, bu PR'da tamamlandı.
- **Sıradaki iş (ayrı PR/iş):** us/gb/ca/au/nz/uz — her ülkenin kendi branş paketine,
  kendi dili ve kendi yasal gereksinimleriyle kablolanacak; klinik içerik (varsa) o
  ülke için ayrıca kaynaklanacak, Türkçe sürümden kopyalanmayacak.
```

A change scoped entirely to Türkiye's own clinical/legal content (Medula, SUT,
KVKK text, a Turkish-only form) states plainly that it is Türkiye-only and why
— that is a valid, expected outcome, not a gap.

## Anti-patterns

- Fixing the bug inside `specialties/<slug>/` when the broken code is in
  `lib/` — this "fixes" one branch and leaves 29 broken.
- Copy-pasting a spine component into a chapter folder to tweak it. Extend the
  shared component with a prop or a profile field instead.
- Claiming "applies to all specialties" without naming the shared file.
- Hardcoding the chapter list (`dahiliye, dermatoloji, kadın-doğum, göz`) into a
  doc or a test — it goes stale the day the next chapter lands.
- Inventing changes in chapters that already inherit correctly, just to have
  something to show. **"No fork found, nothing to do" is a valid, expected
  result** — say it plainly instead of manufacturing diff.
- Adding the rule to the runtime guard but not to the chapter prompts (or the
  reverse). Two layers, both needed.
- Treating "core/universal, must propagate to six countries" as license to
  copy Turkish clinical content, Turkish legal text, or Turkish UI strings
  verbatim into a country pack — propagate the mechanism, re-source the
  content, per country.
- Silently leaving the six-country propagation undone with no PR note —
  "Türkiye only, countries are a separate follow-up" is fine when stated; an
  unstated gap is not.

## Quick checklist

```
- [ ] Shared file(s) touched are named explicitly
- [ ] `ls specialties/` read live (not from memory) for the current chapter list
- [ ] Each chapter classified: inherits / has own equivalent / forked+fixed
- [ ] Specialty-gated behavior walked, or confirmed absent
- [ ] Chapter prompts/system.md checked when the fix is a model-output guard
- [ ] promptsLock / chapter test extended where a fork was patched
- [ ] PR body carries the "Branş kapsamı" block
- [ ] No invented changes in chapters that already inherit
- [ ] Change classified: universal mechanism / branş clinical content /
      Türkiye-only legal content — table in "Six-country propagation" above
- [ ] If universal or branş-clinical: PR body carries the "Ülke kapsamı" block,
      stating which of the six countries are done, deferred, or N/A and why
```

## When this skill applies

- Any `fix(...)` or `feat(...)` touching `lib/`, `core/`, `components/`,
  `app/api/`, `app/dashboard/`, `app/portal/`
- A bug reported from one branch's screen (kasa, randevu, sohbet, reçete, mobil)
- Writing the PR description for the above
- Retroactive sweeps: "did yesterday's fixes actually reach every branş?"

Does **not** apply to changes scoped entirely inside one
`specialties/<slug>/` folder that touch no shared file — those are chapter work
by definition. Related: `.cursor/skills/specialty-audit-report/SKILL.md`
(depth pills, audit format),
`.cursor/skills/specialty-hasta-portali/SKILL.md` (portal: one shell, many
chapters), `.cursor/skills/specialty-doktor-araclari/SKILL.md` (Araçlar:
base vs specialty-only vs new-universal — classify before add), and
`.cursor/skills/brans-alan-sizmasi/SKILL.md` (mirror: specialty-specific
fields/words must **not** leak into other branşlar).
