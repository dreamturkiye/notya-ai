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

`lib/doktor/specialties.ts` is the full branch list (**30 entries today**).
Most of them have **no** `specialties/<slug>/` folder and **no** profile —
they run the shared spine as-is.

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

For every branch in `lib/doktor/specialties.ts` **without** a
`specialties/<slug>/` folder, a properly-scoped spine fix applies **by
construction**. No per-specialty verification, no per-specialty test, no
"let me check kardiyoloji too" busywork.

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

## 40-branş propagation — Notya Klinik / Özel Branşlar (Kaan, 2026-10-18, standing rule, no exceptions)

Boss rule (verbatim intent): **any core update, revision, or new feature that is not
specialty-specific must be applied to all 30 medical branches and the 10 Özel Branşlar
at the same time. No exceptions.**

**Core items that must propagate** (verbatim list — treat each as shared spine for this
rule's purposes, in addition to the shared-spine list in the table above):

- Muayene ekranı
- Reçete
- Randevu
- Hasta kaydı
- MBYS packages
- Hasta portalı
- Faturalama / tahsilat
- Shared consent flows
- Any shared data model or workflow

**"All 40, no exceptions"**: the 30 medical branches (`lib/doktor/specialties.ts`) **and**
the 10 Özel Branşlar (saç ekimi, estetik & plastik cerrahi, medikal estetik, dermatoloji
klinik, longevity, fizyoterapi, klinik psikoloji, diyetisyen, ergoterapi, odyoloji — today's
slugs: `sac-ekimi`, `estetik-cerrahi`, `medikal-estetik`, `klinik-dermatoloji`, `longevity`,
`fizyoterapi`, `klinik-psikolog`, `diyetisyen`, `ergoterapi`, `odyoloji`) together form the
**40-branch universe** for this rule. A core/universal change that reaches the 30 but not
the 10 (or vice versa) is **not finished** — it is a gap, write it down in
`docs/OPEN-COMMITMENTS.md`, don't ship it as done.

**One product, never forked**: the doctor application stays **one product, one codebase**.
"Reaches all 40" means the shared mechanism/data model/workflow is wired for all 40 —
never a separate app shell, a forked doctor experience, or a parallel copy of the feature
for Notya Klinik / Özel Branşlar. Specialty-specific screens and tools (the clinical content
unique to one branş) stay local to their own branş/chapter, exactly as the shared-spine
table above already says.

**Naming (2026-10-18, apply wherever referenced)**: the multi-doctor umbrella is **"Notya
Klinik"** (not bare "Klinik"). The 10 specialty modules above are collectively **"Özel
Branşlar"**. The 30 medical branches keep their current individual names, untouched. Menus,
navigation and specialty selectors must keep "Notya Klinik" / "Özel Branşlar" and the 30
medical branches as visually/structurally distinct sections — never one flat, undifferentiated
list.

**Explicit classification habit (non-negotiable)**: when making any change in scope, state
up front — in the commit/PR and out loud in the work — whether it is **core** (must propagate
to all 40) or **specialty-specific** (stays local to its own branş). "I didn't think about it"
is not an acceptable answer to "which is this."

**Architecture note**: today the 10 Özel Branşlar run on a separate registry from the 30
(`lib/specialties/<slug>.ts` outside `registry.ts`'s `CHAPTERS` map, wired through
`components/klinik/*` / `app/klinik-tools` / `app/asistan/klinik` rather than through
`specialtyProfile()`). That is an existing implementation detail, not a license to treat the
10 as a separate product for propagation purposes — this rule's "all 40, no exceptions"
applies regardless of which registry currently wires a given branch.

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
