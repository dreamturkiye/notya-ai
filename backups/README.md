# Landing backups

## Original `/doktor` page

Saved from `83bd12c` (the last commit before the clinic editorial landing).

File: `backups/doktor-landing-original.tsx`

### Restore it as the live `/doktor` page

```bash
cp backups/doktor-landing-original.tsx app/doktor/page.tsx
rm -f app/doktor/layout.tsx app/doktor/landing.css app/doktor/utilities.css app/doktor/tw-source.css
```

Then commit and deploy. The original page used its own inline styles, so the new `layout.tsx` and compiled CSS must be removed or they will wrap it.

Do not delete this backup when swapping files.
