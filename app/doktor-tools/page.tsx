'use client';

import React, { Suspense, useEffect, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav'
import { useRouter } from 'next/navigation';
import { HedefBoyAracPaneli } from '@/components/hedefBoy/HedefBoyAracPaneli'
import { usePediatriHedefBoy } from '@/components/hedefBoy/usePediatriHedefBoy'
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { doktorAraclariListesi, type DoktorArac } from '@/lib/doktor/doktorAraclari'

export const dynamic = 'force-dynamic';

export default function DoktorToolsPage() {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [aile, setAile] = useState(false);
  const [tools, setTools] = useState<DoktorArac[] | null>(null);
  const pediatriAraci = usePediatriHedefBoy();

  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const t = await ensureDoctorAccessToken()
        if (!t) {
          if (!iptal) setTools(doktorAraclariListesi(null))
          return
        }
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } })
        const j = r.ok ? await r.json() : null
        if (!iptal) setTools(doktorAraclariListesi(j?.data?.specialty))
      } catch {
        if (!iptal) setTools(doktorAraclariListesi(null))
      }
    })()
    return () => { iptal = true }
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060C18', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff' }}>
      {!aile && <DoktorNav />}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: aile ? 0 : '28px 20px 48px' }}>
        {!aile && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#14B8A6', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>ARAÇLAR</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.6px' }}>Doktor Araçları</h1>
          </div>
        )}

        {pediatriAraci && (
          <Suspense fallback={<div style={{ padding: 32, color: '#8FA0B5' }}>Hedef boy yükleniyor…</div>}>
            <HedefBoyAracPaneli onAileModu={setAile} />
          </Suspense>
        )}

        {!aile && (
          <>
            {pediatriAraci ? (
              <div style={{ fontSize: 14, fontWeight: 700, margin: '36px 0 14px', color: '#C9D4E3' }}>Diğer araçlar</div>
            ) : null}
            {tools == null ? (
              <div style={{ padding: '24px 0', color: '#8FA0B5', fontSize: 14 }}>Araçlar yükleniyor…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                {tools.map((tool, index) => {
                  const isHovered = hoveredIndex === index;
                  return (
                    <div
                      key={tool.route}
                      onClick={() => router.push(tool.route)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isHovered ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '18px',
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '9999px', backgroundColor: tool.circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{tool.icon}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '17px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{tool.title}</div>
                          <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.45' }}>{tool.desc}</div>
                        </div>
                        <div style={{ color: '#6B7280', fontSize: '18px', marginTop: '2px' }}>→</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
