'use client'

import Link from 'next/link'
import type { PortalBundle } from '@/lib/portal/types'
import { SoftPanel, formatTrDate } from './ui'

export function HomeHero({ basePath, data }: { basePath: string; data: PortalBundle }) {
  const stats = [
    { label: 'Aktif ilaç', value: String(data.summary.aktifIlac), href: `${basePath}/ilaclar` },
    { label: 'Bekleyen mesaj', value: String(data.summary.bekleyenMesaj), href: `${basePath}/mesajlar` },
    { label: 'Son lab', value: data.summary.sonLabOzet, href: `${basePath}/sonuclar` },
    {
      label: 'Yaklaşan kontrol',
      value: data.summary.yaklasanKontrol || 'Planlanmadı',
      href: `${basePath}/ziyaretler`,
    },
  ]

  const shortcuts = [
    { label: 'Mesajlar', href: `${basePath}/mesajlar`, hint: 'Doktorunuzla yazışın' },
    { label: 'Ziyaretler', href: `${basePath}/ziyaretler`, hint: 'Ziyaret özetleri' },
    { label: 'Sonuçlar', href: `${basePath}/sonuclar`, hint: 'Lab ve görüntüleme' },
    { label: 'İlaçlarım', href: `${basePath}/ilaclar`, hint: 'Aktif reçeteler' },
    { label: 'Öykü', href: `${basePath}/gecmis`, hint: 'Alerji ve geçmiş' },
    { label: 'Takip', href: `${basePath}/takip`, hint: 'Vital trendler' },
  ]

  return (
    <div className="sg-home">
      <section className="sg-hero" aria-label="Sağlığım karşılama">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sagligim/hero-atelier.jpg" alt="" className="sg-hero-media" />
        <div className="sg-hero-veil" aria-hidden />
        <div className="sg-hero-copy">
          <div className="sg-hero-brand">
            <p className="sg-hero-brand-name">Notya</p>
            <span className="sg-hero-brand-sub">Sağlığım</span>
          </div>
          <span className="sg-hero-rule" aria-hidden />
          <p className="sg-hero-lede">Kayıtlarınız, sonuçlarınız ve mesajlarınız — tek, size özel alan.</p>
          <Link href={`${basePath}/mesajlar`} className="sg-hero-cta">
            Mesajlara git <span className="sg-hero-cta-arrow" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </section>

      <div className="sg-home-body">
        <div className="sg-stat-rail sg-fade sg-fade-delay-1">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="sg-stat">
              <div className="sg-stat-label">{s.label}</div>
              <div className="sg-stat-value">{s.value}</div>
            </Link>
          ))}
        </div>

        <section className="sg-home-section sg-fade sg-fade-delay-2">
          <h2 className="sg-display sg-home-section-title">Bölümler</h2>
          <div className="sg-shortcut-grid">
            {shortcuts.map((s) => (
              <Link key={s.label} href={s.href} className="sg-shortcut">
                <div className="sg-shortcut-label">{s.label}</div>
                <div className="sg-shortcut-hint">{s.hint}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="sg-home-section sg-fade sg-fade-delay-3">
          <h2 className="sg-display sg-home-section-title">Son aktivite</h2>
          <SoftPanel>
            {data.summary.sonAktivite.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--sg-muted)' }}>Henüz paylaşılmış aktivite yok.</p>
            ) : (
              data.summary.sonAktivite.map((a) => {
                const body = (
                  <>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 650, lineHeight: 1.35 }}>{a.baslik}</div>
                      <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 2 }}>
                        {formatTrDate(a.tarih, true)}
                      </div>
                    </div>
                    {a.href ? <span className="sg-activity-open">Aç</span> : null}
                  </>
                )
                if (a.href) {
                  return (
                    <Link key={a.id} href={`${basePath}/${a.href}`} className="sg-activity-row">
                      {body}
                    </Link>
                  )
                }
                return (
                  <div key={a.id} className="sg-activity-row">
                    {body}
                  </div>
                )
              })
            )}
          </SoftPanel>
        </section>
      </div>
    </div>
  )
}
