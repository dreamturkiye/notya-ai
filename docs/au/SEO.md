# Australian site SEO (AU-SEO-01, 2026-10-22)

Owner decision (Kaan, 2026-10-22): au.notya.io is indexable now. Everything is behind ONE switch.

## The switch

`NOTYA_AU_INDEXABLE` (environment variable of the AU Vercel project), read in `countries/au/index.ts` as `aramaMotorlarinaGizli`.

| Value | Effect |
|---|---|
| unset, or anything except `false` (default) | ON: public pages indexable, robots.txt allows them and names the sitemap, sitemap.xml lists them |
| `false` | OFF: every response noindex (header and meta), robots.txt `Disallow: /`, sitemap.xml answers 404 |

Signed-in and API paths are noindex in every state (`X-Robots-Tag` from `middleware.ulke.ts`, plus `robots` meta on each page). The patient page `/portal` is never indexable. Nothing outside the public list (`ACIK_ICERIK_YOLLARI` in `lib/ulke/acikIcerik.ts`) is ever in robots Allow or the sitemap.

### Hide the site again
1. Vercel, AU project, Settings, Environment Variables: add `NOTYA_AU_INDEXABLE=false` (Production).
2. Redeploy (env changes need a new deployment).
3. Check: `curl -s https://au.notya.io/robots.txt` shows `Disallow: /` only; `curl -sI https://au.notya.io/au | grep -i x-robots` shows noindex; `curl -s -o /dev/null -w '%{http_code}' https://au.notya.io/sitemap.xml` is 404.
4. Pages already in Google stay until removed: Search Console, Removals, temporary removal of the prefix `https://au.notya.io/`.

### Other countries
Same pattern, default OFF: `NOTYA_US_INDEXABLE`, `NOTYA_GB_INDEXABLE`, `NOTYA_CA_INDEXABLE`, `NOTYA_NZ_INDEXABLE`, `NOTYA_UZ_INDEXABLE`; set to `true` to turn that country ON. Before turning one on, confirm its host in `lib/ulke/seo/siteler.ts` (only au.notya.io is confirmed; the rest follow the pattern) or set `NOTYA_SITE_ORIGIN`.

## What ships
- Titles and descriptions per page in Australian English (`lib/ulke/seo/metinler.ts`): landing, for-clinics, medical catalogue, privacy, terms, cookies, data request, accessibility, medical disclaimer, security, refund, copyright. No price, no ABN, no TGA/Ahpra/Medicare/compliance claim (tested in `lib/ulke/seo/seo.paket.test.ts`).
- Canonical (clean path, no `?dil=`), hreflang `en-AU` (self), Open Graph and Twitter `summary` (no image yet) via `sayfaMeta()`.
- hreflang to sister sites: `NOTYA_HREFLANG_SITES=au,us,gb` lists them. Default is self only, so we never point at a noindex site. Turn it on only when those sites are ON.
- `robots.txt` and `sitemap.xml` are route handlers (`app/robots.txt`, `app/sitemap.xml`), exposed at the host root by rewrites in `next.config.mjs` (the build lives under `/au`). Sitemap has no `lastmod` (not invented).
- JSON-LD on the landing page: Organization (Notya, legal name Notya LLC, Baltimore MD US, kaan@notya.io), WebSite, SoftwareApplication (BusinessApplication, web). No offers, no rating.
- Core Web Vitals: hero image `fetchPriority=high`, below-fold images `loading=lazy`, `decoding=async`; images keep their aspect-ratio boxes (no layout shift).

## After the first deploy
1. Open https://au.notya.io/robots.txt and /sitemap.xml and view-source on `/au` (canonical, hreflang, JSON-LD).
2. Search Console: add the property `https://au.notya.io/`, submit `https://au.notya.io/sitemap.xml`, request indexing of `/au` and `/au/for-clinics`.
3. Run the Rich Results / PageSpeed check on `/au` (mobile).

## Open follow-ups
- Social preview image: needs an owner-approved image (nothing under `public/` is served by the country gate; import it like the landing photos).
- Landing photos are 380 to 640 KB JPEG: re-encode to WebP/AVIF at 1600 px wide for LCP.
- Display font (Fraunces) loading: confirm `font-display: swap` on the live page (not measurable from the repo).
- Confirm sister hosts before turning on hreflang/ON in other countries.

## Keyword shortlist (Australia; from searches 2026-10-22, no volume data available here)
Primary: ai medical scribe australia; ai scribe for gps; ai scribe for doctors; ai clinical notes australia; medical dictation software australia.
Secondary: gp consult notes software; clinical documentation software for doctors australia; specialist practice software australia; clinic calendar and patient forms; telehealth consult notes.
Competitive, do not target yet: practice management software australia (Best Practice, Medical Director, Genie, Cliniko, Halaxy own it); Medicare / MBS / PBS terms (Notya has no Medicare billing, claims or PBS prescribing; the marketing audit forbids implying it).
Competitors seen: Heidi, Lyrebird, Telstra Health scribe, Cliniko, Halaxy.
