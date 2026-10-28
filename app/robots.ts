/**
 * NOTYA-DOKTOR-SEO-01 — robots.txt of the Türkiye deployment (main), Next.js App Router's native
 * app/robots.ts convention. Allows the marketing and legal pages; disallows the signed-in application,
 * patient/invite tokens (privacy: NOTYA-ARSIV / hasta-izolasyon), and internal tool/API surfaces.
 * References the sitemap above.
 */
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/doktor";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/doktor",
        "/notya-klinik",
        "/demo",
        "/kvkk",
        "/gizlilik",
        "/kullanim-kosullari",
        "/veri-isleme",
        "/cerez-politikasi",
        "/klinik-karar-destegi",
        "/iade-ve-iptal",
        "/telif-hakki",
        "/yasal",
      ],
      disallow: [
        "/api/",
        "/dashboard",
        "/session",
        "/portal",
        "/intake",
        "/davet",
        "/sandbox",
        "/onboarding",
        "/sifre-sifirla",
        "/doktor-tools",
        "/mali-tools",
        "/mali",
        "/asistan",
        "/randevu",
        "/install",
        "/konsultan",
        "/ozel-branslar",
        "/kayit",
        "/giris",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
