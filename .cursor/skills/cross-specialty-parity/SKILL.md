---
name: cross-specialty-parity
description: >-
  Standing rule for every bug fix or feature change in Notya: a fix made where a
  bug was *noticed* must actually land for **all** branches Notya supports, not
  just that one. Use before closing out any change to a shared/baseline-spine
  component (SOAP, İnceleme/onay, reçete/Medula, Belge Kasası, randevu/takvim,
  epikriz, Asistan sohbet, Sağlığım portal shell, intake, doz kilidi, kaynak
  kilidi, markdown render, mobil düzen) — and when writing the PR description
  for one. Answers "does any specialty have its own forked copy of this that
  would miss the fix?"
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
