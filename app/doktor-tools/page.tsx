'use client';

/**
 * ARACLAR-GRUPLAMA-01 / GUI (Kaan, 2026-09-19):
 * Temel Araçlar üstte, altında "Branşa özel · <Branş> Araçları". Gruplama sunum sırasıdır;
 * görünürlük kapısı doktorAraclariListesi içindedir (bkz. lib/doktor/doktorAraclari.ts).
 *
 * Cursor 30 branşa araç eklemeye devam ediyor: yeni bir araç katalogda `branslar` alanıyla
 * tanımlandığı an bu sayfa onu DOĞRU bölüme kendiliğinden yerleştirir — burada değişiklik
 * gerekmez. Yeni bölüm adı eklerken "Günlük Araçlar" adını KULLANMA; o ad ileride kullanım
 * sıklığına göre oluşacak bölüm için ayrıldı.
 */

import React, { useEffect, useMemo, useState } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav'
import { useRouter } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth'
import { doktorAraclariGruplu, type AracGrubu } from '@/lib/doktor/doktorAraclari'

export const dynamic = 'force-dynamic';

const RENK = { cekirdek: '#14B8A6', brans: '#A78BFA' } as const

export default function DoktorToolsPage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [gruplar, setGruplar] = useState<AracGrubu[] | null>(null);
  const [brans, setBrans] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<'hepsi' | 'cekirdek' | 'brans'>('hepsi');

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
        if (!iptal) { setGruplar(doktorAraclariGruplu(j?.data?.specialty)); setBrans(j?.data?.specialty || null) }
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
  const bransBasligi = useMemo(() => gruplar?.find((g) => g.anahtar === 'brans')?.baslik ?? null, [gruplar])

  const cip = (aktif: boolean, renk: string): React.CSSProperties => ({
    fontSize: 12.5,
    fontWeight: 600,
    color: aktif ? '#07121F' : renk,
    backgroundColor: aktif ? renk : 'rgba(255,255,255,0.04)',
    border: `1px solid ${aktif ? renk : 'rgba(255,255,255,0.10)'}`,
    borderRadius: 999,
    padding: '6px 14px',
    cursor: 'pointer',
    minHeight: 34,
    transition: 'all .15s ease',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060C18', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff' }}>
      <DoktorNav />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px 48px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#14B8A6', letterSpacing: '1.5px', marginBottom: 8 }}>ARAÇLAR</div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.6px' }}>Doktor Araçları</h1>
        {toplam > 0 && (
          <div style={{ fontSize: 13, color: '#8FA0B5', marginTop: 6 }}>
            {bransBasligi ? `${bransBasligi.replace(/ Araçları$/, '')} · ` : ''}{toplam} araç
          </div>
        )}

        {/* Araç sayısı branş başına büyüdükçe filtre gerekiyor; tek dokunuşla daraltır. */}
        {gruplar && gruplar.length > 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
            <button type="button" onClick={() => setFiltre('hepsi')} style={cip(filtre === 'hepsi', '#9FB3C8')}>Tümü {toplam}</button>
            {gruplar.map((g) => (
              <button key={g.anahtar} type="button" onClick={() => setFiltre(g.anahtar)} style={cip(filtre === g.anahtar, RENK[g.anahtar])}>
                {g.anahtar === 'cekirdek' ? 'Temel' : g.baslik.replace(/ Araçları$/, '')} {g.araclar.length}
              </button>
            ))}
          </div>
        )}

        {gruplar == null ? (
          <div style={{ padding: '28px 0', color: '#8FA0B5', fontSize: 14 }}>Araçlar yükleniyor…</div>
        ) : gorunen.length === 0 ? (
          <div style={{ padding: '28px 0', color: '#8FA0B5', fontSize: 14 }}>Bu bölümde araç yok.</div>
        ) : (
          gorunen.map((grup, gi) => (
            <section key={grup.anahtar} style={{ marginTop: gi === 0 ? 26 : 34 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ width: 3, height: 16, backgroundColor: RENK[grup.anahtar], borderRadius: 2, flexShrink: 0 }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: '-0.2px' }}>{grup.baslik}</h2>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{grup.aciklama}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12 }}>
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
                        backgroundColor: acik ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.035)',
                        border: `1px solid ${acik ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'}`,
                        borderLeft: `3px solid ${tool.circleColor}`,
                        borderRadius: '0 14px 14px 0',
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'all .15s ease',
                        transform: acik ? 'translateY(-2px)' : 'translateY(0)',
                        minHeight: 44,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                        <span style={{ width: 28, height: 28, borderRadius: '9999px', backgroundColor: tool.circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: '#fff' }}>
                          {tool.icon}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', minWidth: 0 }}>{tool.title}</span>
                        <span style={{ marginLeft: 'auto', color: acik ? '#9FB3C8' : '#4B5563', fontSize: 15, flexShrink: 0, transition: 'color .15s ease' }}>→</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#9CA3AF', lineHeight: 1.5 }}>{tool.desc}</div>
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
