import DoktorChrome from '@/components/doktor/DoktorChrome';
import { CHROME_FONT_HREF, doktorViewport } from '@/lib/doktor/chromeTheme';

export const viewport = doktorViewport;

export default function CihazLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <DoktorChrome>{children}</DoktorChrome>
    </>
  );
}
