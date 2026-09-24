/**
 * NOTYA-YENI-GORUNUM-01 — shared layout for every /dashboard/doktor/* route.
 * Renders the new chrome (header + dock) once; every page underneath just returns its own
 * content. Pages that used to render <DoktorNav /> inline have had that call removed — the
 * layout now owns the chrome, which is the whole point of a Next.js layout.
 */
import DoktorChrome from '@/components/doktor/DoktorChrome';
import { CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme';

export default function DoktorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <DoktorChrome>{children}</DoktorChrome>
    </>
  );
}
