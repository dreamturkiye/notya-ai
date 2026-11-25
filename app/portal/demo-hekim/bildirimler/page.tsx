'use client'
/**
 * HEKIM-PUSH — internal demo of Ayarlar › Bildirimler with example settings (nothing is fetched, saved or sent). Used for
 * screenshots; the live page is /dashboard/doktor/ayarlar/bildirimler.
 */
import HekimBildirimAyarlari from '@/components/doktor/HekimBildirimAyarlari'
import { CHROME_RENK as R, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeRenk'

export default function DemoBildirimlerPage() {
  return (
    <div style={{ minHeight: '100dvh', background: R.cream, padding: '24px 16px 48px', fontFamily: CHROME_FONT.sans }}>
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div role="note" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: '#FFF7E6', border: '1px solid #E8C98A', color: '#5b4300', fontSize: 13, lineHeight: 1.45 }}>
          <b>Örnek — hekim görünümü.</b> Ayarlar › Bildirimler. Hiçbir şey kaydedilmez ya da gönderilmez.
        </div>
        <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>‹ Ayarlar</div>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, margin: '0 0 6px', color: '#2e251d', letterSpacing: '-0.02em' }}>Bildirimler</h1>
        <p style={{ fontSize: 14, color: R.muted, marginBottom: 22 }}>Hastalarınızın Sağlığım’a girdiği acil ev ölçümleri ve uyarılar — telefonunuza, kendi çalışma saatlerinize göre.</p>
        <HekimBildirimAyarlari ornek />
      </div>
    </div>
  )
}
