/**
 * NOTYA-YENI-GORUNUM-01 — shared layout for every /doktor-tools/* route (131 tool pages).
 * Same chrome as /dashboard/doktor/*: one header + dock, real data, applied once here rather
 * than per page. Most of these pages never had a nav at all before this — now they all do,
 * and it's the same one everywhere in the app, not a second design.
 */
import DoktorChrome from '@/components/doktor/DoktorChrome';
import { CHROME_FONT_HREF, doktorViewport } from '@/lib/doktor/chromeTheme';

export const viewport = doktorViewport;

export default function DoktorToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <DoktorChrome>{children}</DoktorChrome>
    </>
  );
}
