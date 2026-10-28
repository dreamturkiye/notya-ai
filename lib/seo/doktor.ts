/**
 * NOTYA-DOKTOR-SEO-01 — head tags and structured data for the Turkish /doktor landing page (main).
 * Mirrors the country kit's SEO framework (lib/ulke/seo/) at the same quality bar; kept separate on
 * purpose because main is the pre-split application and is not built from the ülke kit. Facts only:
 * operator Notya LLC (Baltimore, MD, US), contact kaan@notya.io — the same facts the country builds
 * use (lib/ulke/seo/yapisalVeri.ts on the release/* branches). No fabricated numbers anywhere here.
 */
export const SITE_URL = "https://www.notya.io";
export const DOKTOR_URL = `${SITE_URL}/doktor`;

export const DOKTOR_TITLE = "Notya — Hekimler için yapay zekâ klinik asistanı";
export const DOKTOR_DESCRIPTION =
  "Muayeneyi dinler, notunuzu yazar, reçete ve rapor taslağını hazırlar, hastanızı takipte tutar. Hasta portalı dahil, 30 branş. Her karar hekim onayıyla.";

const OPERATOR = { ad: "Notya LLC", sehir: "Baltimore", bolge: "MD", ulke: "US", eposta: "kaan@notya.io" } as const;

/**
 * Home pages of the six country builds, for hreflang cross-linking from the Turkish page. Mirrors
 * lib/ulke/seo/siteler.ts's SITELER table on the release/* branches (kept in sync by hand: the two
 * codebases do not share a build graph, so neither file imports the other).
 */
const COUNTRY_HOMES: Readonly<Record<string, string>> = {
  "en-AU": "https://au.notya.io/",
  "en-US": "https://us.notya.io/",
  "en-GB": "https://uk.notya.io/",
  "en-CA": "https://ca.notya.io/",
  "en-NZ": "https://nz.notya.io/",
  "uz-Latn": "https://notya.io/uzbek",
};

/** hreflang alternates for /doktor: itself, x-default, and the six country homes. */
export function doktorHreflang(): Record<string, string> {
  return { tr: DOKTOR_URL, "x-default": DOKTOR_URL, ...COUNTRY_HOMES };
}

/** Organization + WebSite + SoftwareApplication, matching the country builds' schema shape and facts. */
export function doktorYapisalVeri(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "Notya",
        legalName: OPERATOR.ad,
        url: SITE_URL,
        email: OPERATOR.eposta,
        address: { "@type": "PostalAddress", addressLocality: OPERATOR.sehir, addressRegion: OPERATOR.bolge, addressCountry: OPERATOR.ulke },
        contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: OPERATOR.eposta },
      },
      { "@type": "WebSite", "@id": `${SITE_URL}/#site`, url: SITE_URL, name: "Notya", inLanguage: "tr", publisher: { "@id": `${SITE_URL}/#org` } },
      {
        "@type": "SoftwareApplication",
        "@id": `${DOKTOR_URL}#app`,
        name: "Notya",
        description: DOKTOR_DESCRIPTION,
        url: DOKTOR_URL,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: "tr",
        provider: { "@id": `${SITE_URL}/#org` },
      },
    ],
  };
}
