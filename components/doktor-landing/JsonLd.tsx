/** NOTYA-DOKTOR-SEO-01 — one JSON-LD block. "<" is escaped so the data can never close the script tag. */
export function JsonLd({ veri }: { veri: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(veri).replace(/</g, "\\u003c") }} />;
}
