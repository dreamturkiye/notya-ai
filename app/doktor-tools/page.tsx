'use client';

/**
 * ARACLAR-GRUPLAMA-01 (Kaan, 2026-09-19): Araçlar sayfası tek düz ızgaraydı; 12 evrensel
 * omurga aracı ile branşa özel araçlar görsel olarak eşitti. Artık iki bölüm:
 * ÇEKİRDEK ARAÇLAR üstte, ince bir ayraçtan sonra BRANŞ ARAÇLARI altta.
 * Gruplama yalnız sunumdur; görünürlük kapısı doktorAraclariListesi içindedir.
 */

import React, { useEffect, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav'
import { useRouter } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { doktorAraclariGruplu, type AracGrubu } from '@/lib/doktor/doktorAraclari'

export const dynamic = 'force-dynamic';

export default function DoktorToolsPage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [gruplar, setGruplar] = useState<AracGrubu[] | null>(null);

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

  const toplam = (gruplar || []).reduce((n, g) => n + g.araclar.length, 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060C18', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff' }}>
      <DoktorNav />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px 48px' }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#14B8A6', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>ARAÇLAR</div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.6px' }}>Doktor Araçları</h1>
          {toplam > 0 && (
            <div style={{ fontSize: 13, color: '#8FA0B5', marginTop: 6 }}>{toplam} araç kullanımınıza hazır</div>
          )}
        </div>

        {gruplar == null ? (
          <div style={{ padding: '24px 0', color: '#8FA0B5', fontSize: 14 }}>Araçlar yükleniyor…</div>
        ) : gruplar.length === 0 ? (
          <div style={{ padding: '24px 0', color: '#8FA0B5', fontSize: 14 }}>Şu an görüntülenecek araç yok.</div>
        ) : (
          gruplar.map((grup, gi) => (
            <section key={grup.anahtar} style={{ marginTop: gi === 0 ? 0 : 40 }}>
              {/* Bölüm başlığı — branş bölümü ince bir ayraçla ayrılır */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 12,
                  paddingTop: gi === 0 ? 0 : 22,
                  borderTop: gi === 0 ? 'none' : '1px solid rgba(255,255,255,0.07)',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}
              >
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.2px', color: '#fff' }}>{grup.baslik}</h2>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{grup.aciklama}</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 700,
                    color: grup.anahtar === 'cekirdek' ? '#14B8A6' : '#A78BFA',
                    backgroundColor: grup.anahtar === 'cekirdek' ? 'rgba(20,184,166,0.12)' : 'rgba(167,139,250,0.12)',
                    border: `1px solid ${grup.anahtar === 'cekirdek' ? 'rgba(20,184,166,0.25)' : 'rgba(167,139,250,0.25)'}`,
                    borderRadius: 999,
                    padding: '3px 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {grup.araclar.length}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                {grup.araclar.map((tool) => {
                  const isHovered = hovered === tool.route;
                  return (
                    <div
                      key={tool.route}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(tool.route)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(tool.route) } }}
                      onMouseEnter={() => setHovered(tool.route)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isHovered ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '18px',
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                        minHeight: 44,
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
            </section>
          ))
        )}
      </div>
    </div>
  );
}
