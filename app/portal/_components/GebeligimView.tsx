'use client'
/** NOTYA-KHD-05 — Sağlığım portalı: anne için "Gebeliğim" (açık tema, tıbbi yorum yok). */
import React from 'react'
import type { PortalGebelik } from '@/lib/portal/types'

const DURUM: Record<string, { t: string; c: string }> = {
  tamamlandi: { t: 'Yapıldı', c: 'var(--sg-ok, #2E7D5B)' }, zamani: { t: 'Zamanı geldi', c: 'var(--sg-warn, #B7791F)' },
  gecikmis: { t: 'Gecikti', c: 'var(--sg-danger, #B23A48)' }, ileride: { t: 'İleride', c: 'var(--sg-muted, #8A94A6)' },
}

export function GebeligimView({ gebelik }: { gebelik: PortalGebelik }) {
  const oran = Math.min(100, Math.round((gebelik.toplamGun / 280) * 100))
  return (
    <section style={{ background: 'var(--sg-panel, #fff)', border: '1px solid var(--sg-line, #E6EAF0)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sg-accent, #C2603F)', fontWeight: 700 }}>Gebeliğim</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'Georgia, serif', color: 'var(--sg-ink, #1C2430)' }}>{gebelik.metin}</div>
          <div style={{ fontSize: 13, color: 'var(--sg-muted, #6B7385)' }}>{gebelik.trimester}. trimester · Tahmini doğum tarihi <b>{new Date(gebelik.tdt).toLocaleDateString('tr-TR')}</b></div>
        </div>
        {gebelik.sonIzlem && (
          <div style={{ fontSize: 12.5, color: 'var(--sg-muted, #6B7385)', textAlign: 'right' }}>
            Son kontrol {new Date(gebelik.sonIzlem.tarih).toLocaleDateString('tr-TR')} ({gebelik.sonIzlem.hafta}. hafta)
            {gebelik.sonIzlem.fetalKalpAtimi ? <div>Bebeğin kalp atışı: {gebelik.sonIzlem.fetalKalpAtimi}/dk</div> : null}
          </div>
        )}
      </div>
      <div style={{ marginTop: 12, height: 8, background: 'var(--sg-line, #E6EAF0)', borderRadius: 4 }}><div style={{ width: `${oran}%`, height: '100%', background: 'var(--sg-accent, #C2603F)', borderRadius: 4 }} /></div>
      <div style={{ fontSize: 11.5, color: 'var(--sg-muted, #6B7385)', marginTop: 4 }}>%{oran} · 40 haftalık yolculuk</div>

      {gebelik.buHafta.length > 0 && (
        <div style={{ marginTop: 14, display: 'grid', gap: 6 }}>
          {gebelik.buHafta.map((m, i) => <div key={i} style={{ fontSize: 13.5, color: 'var(--sg-ink, #1C2430)', background: 'var(--sg-soft, #F6F1EC)', borderRadius: 10, padding: '8px 12px' }}>{m}</div>)}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: 'var(--sg-ink, #1C2430)' }}>Kontrol takvimi (Sağlık Bakanlığı)</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        {gebelik.takvim.map((t) => (
          <details key={t.no} style={{ border: '1px solid var(--sg-line, #E6EAF0)', borderRadius: 10, padding: '8px 12px' }}>
            <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span><b>{t.etiket}</b> · {t.haftaBas}-{t.haftaSon}. hafta</span>
              <span style={{ color: DURUM[t.durum]?.c, fontWeight: 700, fontSize: 12 }}>{DURUM[t.durum]?.t}</span>
            </summary>
            <ul style={{ margin: '8px 0 2px', paddingLeft: 18, fontSize: 12.5, color: 'var(--sg-muted, #6B7385)', lineHeight: 1.6 }}>{t.maddeler.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </details>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--sg-muted, #6B7385)' }}>Kanama, şiddetli baş ağrısı, görme bozukluğu, ani şişlik veya bebek hareketlerinde azalma olursa beklemeden doktorunuza ya da acil servise başvurun.</div>
    </section>
  )
}
