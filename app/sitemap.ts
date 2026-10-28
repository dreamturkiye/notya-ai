/**
 * NOTYA-DOKTOR-SEO-01 — sitemap.xml of the Türkiye deployment (main), Next.js App Router's native
 * app/sitemap.ts convention. Lists only real, public marketing and legal pages — never dashboard,
 * API, patient-portal or token routes. "/" is left out: it is a 307 redirect to /doktor
 * (NOTYA-KOK-DOKTOR-01), and a sitemap should not list a redirecting URL.
 */
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/doktor";

const SAYFALAR: { yol: string; oncelik: number; sıklık: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]> }[] = [
  { yol: "/doktor", oncelik: 1, sıklık: "weekly" },
  { yol: "/notya-klinik", oncelik: 0.9, sıklık: "weekly" },
  { yol: "/demo", oncelik: 0.6, sıklık: "monthly" },
  { yol: "/kvkk", oncelik: 0.3, sıklık: "yearly" },
  { yol: "/gizlilik", oncelik: 0.3, sıklık: "yearly" },
  { yol: "/kullanim-kosullari", oncelik: 0.3, sıklık: "yearly" },
  { yol: "/veri-isleme", oncelik: 0.3, sıklık: "yearly" },
  { yol: "/cerez-politikasi", oncelik: 0.3, sıklık: "yearly" },
  { yol: "/klinik-karar-destegi", oncelik: 0.3, sıklık: "yearly" },
  { yol: "/iade-ve-iptal", oncelik: 0.3, sıklık: "yearly" },
  { yol: "/telif-hakki", oncelik: 0.3, sıklık: "yearly" },
  { yol: "/yasal", oncelik: 0.3, sıklık: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return SAYFALAR.map(({ yol, oncelik, sıklık }) => ({
    url: `${SITE_URL}${yol}`,
    lastModified: now,
    changeFrequency: sıklık,
    priority: oncelik,
  }));
}
