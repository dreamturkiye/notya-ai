'use client';

/**
 * ARACLAR-GRUPLAMA-01 / GUI (Kaan, 2026-09-19) + NOTYA-YENI-GORUNUM-01 (2026-09-22, chrome pass).
 * Same grouping/filter/fetch logic as before (Temel Araçlar üstte, branşa özel altında,
 * doktorAraclariGruplu sürücü; görünürlük kapısı doktorAraclariListesi içindedir, bkz.
 * lib/doktor/doktorAraclari.ts) -- only the visual language changed to match the new chrome.
 * Per-tool circleColor accents come from the tool catalog itself and are kept as-is; they read
 * fine as small badges against the warm background, same role dark-navy or cream.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { doktorAraclariGruplu, type AracGrubu } from '@/lib/doktor/doktorAraclari'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

export const dynamic = 'force-dynamic';

const RENK = { cekirdek: CHROME_RENK.pine, brans: '#8B6FB8' } as const

export default function DoktorToolsPage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [gruplar, setGruplar] = useState<AracGrubu[] | null>(null);
  const [filtre, setFiltre] = useState<'hepsi' | 'cekirdek' | 'brans'>('hepsi');
  const [dar, setDar] = useState(false);

  useEffect(() => {
    const olc = () => setDar(window.innerWidth < 640)
    olc()
    window.addEventListener('resize', olc)
    return () => window.removeEventListener('resize', olc)
  }, [])

  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) {
          if (!iptal) setGruplar(doktorAraclariGruplu(null))
          return
        }
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } })
        const j = r.ok ? await r.json() : null
        if (!iptal) setGruplar(doktorAraclariGruplu(j?.data?.specialty))
      } catch {
        if (!iptal) setGruplar(doktorAraclariGruplu(null))
      }
    })()
    return () => { iptal = true }
  }, [])

  const toplam = useMemo(() => (gruplar || []).reduce((n, g) => n + g.araclar.length, 0), [gruplar])
  const gorunen = useMemo(
    () => (gruplar || []).filter((g) => filtre === 'hepsi' || g.anahtar === filtre),
    [gruplar, filtre],
  )
  const bransAdi = useMemo(
    () => gruplar?.find((g) => g.anahtar === 'brans')?.baslik.replace(/ Araçları$/, '') ?? null,
    [gruplar],
  )

  const cip = (aktif: boolean, renk: string): React.CSSProperties => ({
    fontSize: 12.5,
    fontWeight: 700,
    color: aktif ? '#FAF8F4' : renk,
    backgroundColor: aktif ? renk : '#FFFFFF',
    border: `1px solid ${aktif ? renk : CHROME_RENK.border}`,
    borderRadius: 999,
    padding: '8px 14px',
    cursor: 'pointer',
    minHeight: 40,
    transition: 'all .15s ease',
  })

  return (
    <div>
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 18, color: '#6d6055', marginBottom: 2 }}>Araçlar</div>
      <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: dar ? 30 : 40, margin: 0, letterSpacing: '-0.03em', color: '#2e251d' }}>Doktor Araçları</h1>
      {toplam > 0 && (
        <div style={{ fontSize: 14, color: CHROME_RENK.muted, marginTop: 8 }}>
          {bransAdi ? `${bransAdi} · ` : ''}{toplam} araç
        </div>
      )}

      {gruplar && gruplar.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
          <button type="button" onClick={() => setFiltre('hepsi')} style={cip(filtre === 'hepsi', CHROME_RENK.ink)}>Tümü {toplam}</button>
          {gruplar.map((g) => (
            <button key={g.anahtar} type="button" onClick={() => setFiltre(g.anahtar)} style={cip(filtre === g.anahtar, RENK[g.anahtar])}>
              {g.anahtar === 'cekirdek' ? 'Temel' : g.baslik.replace(/ Araçları$/, '')} {g.araclar.length}
            </button>
          ))}
        </div>
      )}

      {gruplar == null ? (
        <div style={{ padding: '28px 0', color: CHROME_RENK.muted, fontSize: 14 }}>Araçlar yükleniyor…</div>
      ) : gorunen.length === 0 ? (
        <div style={{ padding: '28px 0', color: CHROME_RENK.muted, fontSize: 14 }}>Bu bölümde araç yok.</div>
      ) : (
        gorunen.map((grup, gi) => (
          <section key={grup.anahtar} style={{ marginTop: gi === 0 ? 26 : 34 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ width: 3, height: 16, backgroundColor: RENK[grup.anahtar], borderRadius: 2, flexShrink: 0 }} />
              <h2 style={{ fontSize: dar ? 15 : 16, fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: CHROME_RENK.ink }}>{grup.baslik}</h2>
              <span style={{ fontSize: 12, color: CHROME_RENK.muted }}>{grup.aciklama}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: dar ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: dar ? 10 : 12 }}>
              {grup.araclar.map((tool) => {
                const acik = hovered === tool.route;
                return (
                  <div
                    key={tool.route}
                    role="link"
                    tabIndex={0}
                    aria-label={tool.title}
                    onClick={() => router.push(tool.route)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(tool.route) } }}
                    onMouseEnter={() => setHovered(tool.route)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: 'relative',
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${acik ? 'rgba(58,44,34,0.18)' : CHROME_RENK.border}`,
                      borderRadius: 16,
                      padding: dar ? '14px 15px 14px 20px' : '16px 18px 16px 22px',
                      cursor: 'pointer',
                      transition: 'all .15s ease',
                      transform: acik ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: acik ? '0 12px 26px rgba(58,44,34,0.1)' : '0 8px 18px rgba(58,44,34,0.045)',
                      minHeight: 44,
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: tool.circleColor }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                      <span style={{ width: 28, height: 28, minWidth: 28, borderRadius: '9999px', backgroundColor: tool.circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: '#fff' }}>
                        {tool.icon}
                      </span>
                      <span style={{ fontSize: dar ? 14.5 : 15, fontWeight: 600, color: CHROME_RENK.ink, minWidth: 0 }}>{tool.title}</span>
                      <span style={{ marginLeft: 'auto', color: acik ? CHROME_RENK.pine : '#C9BEA9', fontSize: 15, flexShrink: 0, transition: 'color .15s ease' }}>→</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: CHROME_RENK.muted, lineHeight: 1.5 }}>{tool.desc}</div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
