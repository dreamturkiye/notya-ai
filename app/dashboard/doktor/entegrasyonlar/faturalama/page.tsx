/** NOTYA-ACCOUNTING-01 — Entegrasyonlar → Faturalama & Tahsilat page shell. */
import FaturalamaTahsilatPaneli from '@/components/accounting/FaturalamaTahsilatPaneli'
import { CHROME_FONT } from '@/lib/doktor/chromeTheme'

export default function FaturalamaTahsilatPage() {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px' }}>
      {/* YENI-DOKTOR-UX-2026-10: ayar alt sayfalarındaki ortak geri bağlantısı deseni. */}
      <a
        href="/dashboard/doktor/entegrasyonlar"
        style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 8, display: 'inline-block', textDecoration: 'none' }}
      >
        ‹ Entegrasyonlar
      </a>
      <FaturalamaTahsilatPaneli />
    </div>
  )
}
