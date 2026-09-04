'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { PortalBundle } from '@/lib/portal/types'
import { SoftPanel, formatTrDate } from './ui'

export function HomeHero({ basePath, data }: { basePath: string; data: PortalBundle }) {
  const chips = [
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
    <div className="sg-fade">
      <section className="sg-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sagligim/hero.jpg"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scale(1.02)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(105deg, rgba(244,241,234,0.94) 0%, rgba(244,241,234,0.78) 48%, rgba(47,107,93,0.22) 100%)',
          }}
        />
        <div className="sg-hero-copy">
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--sg-accent)', letterSpacing: '0.04em' }}>
            SAĞLIĞIM
          </p>
          <h1
            className="sg-display"
            style={{
              margin: '10px 0 0',
              fontSize: 'clamp(1.65rem, 7vw, 2.75rem)',
              maxWidth: 440,
              color: 'var(--sg-ink)',
            }}
          >
            Sağlık alanınıza hoş geldiniz.
          </h1>
          <p
            style={{
              margin: '12px 0 0',
              maxWidth: 420,
              color: 'var(--sg-muted)',
              fontSize: 'clamp(15px, 3.6vw, 16px)',
              lineHeight: 1.5,
            }}
          >
            Kayıtlarınız, sonuçlarınız ve mesajlarınız tek yerde.
          </p>
        </div>
      </section>

      <div className="sg-chip-grid">
        {chips.map((c) => (
          <Link key={c.label} href={c.href} className="sg-chip">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sg-muted)', textTransform: 'uppercase' }}>
              {c.label}
            </div>
            <div style={{ marginTop: 6, fontWeight: 700, fontSize: 14, lineHeight: 1.35, wordBreak: 'break-word' }}>
              {c.value}
            </div>
          </Link>
        ))}
      </div>

      <h2 className="sg-display" style={{ margin: '28px 0 12px', fontSize: 'clamp(1.25rem, 4vw, 1.4rem)' }}>
        Kısayollar
      </h2>
      <div className="sg-shortcut-grid">
        {shortcuts.map((s) => (
          <Link key={s.label} href={s.href} className="sg-shortcut">
            <div style={{ fontWeight: 800 }}>{s.label}</div>
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8, lineHeight: 1.35 }}>{s.hint}</div>
          </Link>
        ))}
      </div>

      <h2 className="sg-display" style={{ margin: '28px 0 12px', fontSize: 'clamp(1.25rem, 4vw, 1.4rem)' }}>
        Son aktivite
      </h2>
      <SoftPanel>
        {data.summary.sonAktivite.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--sg-muted)' }}>Henüz paylaşılmış aktivite yok.</p>
        ) : (
          data.summary.sonAktivite.map((a, i) => {
            const rowStyle: CSSProperties = {
              borderTop: i === 0 ? 'none' : '1px solid var(--sg-line)',
            }
            const body = (
              <>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, lineHeight: 1.35 }}>{a.baslik}</div>
                  <div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 2 }}>{formatTrDate(a.tarih, true)}</div>
                </div>
                {a.href ? (
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sg-accent)', flexShrink: 0 }}>Aç</span>
                ) : null}
              </>
            )
            if (a.href) {
              return (
                <Link key={a.id} href={`${basePath}/${a.href}`} className="sg-activity-row" style={rowStyle}>
                  {body}
                </Link>
              )
            }
            return (
              <div key={a.id} className="sg-activity-row" style={rowStyle}>
                {body}
              </div>
            )
          })
        )}
      </SoftPanel>
    </div>
  )
}
