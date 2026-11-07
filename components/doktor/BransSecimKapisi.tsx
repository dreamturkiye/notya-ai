'use client';

import React, { useState } from 'react';
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from '@/lib/doktor/chromeTheme';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { hekimProfilTazeleIsaretle } from '@/lib/doktor/hekimProfilIstemci';
import BransSecimi from '@/components/onboarding/BransSecimi';
import { KAYIT_BRANS_MESAJ, kayitBransiMi } from '@/lib/onboarding/kayitBransi';

/**
 * KAYIT-BRANS-01 (Kaan, 2026-11-07) — "Branşınızı seçin": the blocking first step of the doctor application for an
 * account that has no branch (the server says so: GET /api/users/me → brans_gerekli). DoktorChrome renders THIS
 * instead of the app — no menu, no page — until a branch is saved through POST /api/users/brans. Nothing is preselected
 * and nothing is guessed. The only other way out is signing out. Same cream/pine card as /kayit.
 */
export default function BransSecimKapisi({ onCikis }: { onCikis: () => void }) {
  const R = CHROME_RENK;
  const [brans, setBrans] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);
  const secildi = kayitBransiMi(brans);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!secildi) { setHata(KAYIT_BRANS_MESAJ.gerekli); return; }
    setBekliyor(true); setHata(null);
    try {
      const t = await ensureDoctorAccessToken();
      if (!t) { window.location.href = '/giris/doktor'; return; }
      const r = await fetch('/api/users/brans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ specialty: brans }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      // 409 = a branch is already on record (e.g. saved in another tab): the app may open.
      if (r.ok || r.status === 409) { hekimProfilTazeleIsaretle(); window.location.reload(); return; }
      setHata(j.error || 'Branş kaydedilemedi. Lütfen tekrar deneyin.');
    } catch {
      setHata('Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    }
    setBekliyor(false);
  }

  return (
    <div data-brans-kapisi style={{
      minHeight: '100dvh', backgroundColor: R.cream, fontFamily: CHROME_FONT.sans, color: R.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
      padding: 'calc(32px + env(safe-area-inset-top, 0px)) 16px calc(32px + env(safe-area-inset-bottom, 0px))',
    }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{
        width: '100%', maxWidth: 440, backgroundColor: R.paper, borderRadius: 24, boxSizing: 'border-box',
        padding: 'clamp(28px, 6vw, 44px)', border: `1px solid ${R.border}`, boxShadow: '0 18px 50px rgba(58,44,34,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 34, fontWeight: 560, letterSpacing: -0.5, color: R.pine, lineHeight: 1.1 }}>Notya</div>
          <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 22, margin: '10px 0 0' }}>Branşınızı seçin</h1>
          <p style={{ fontSize: 14, color: R.muted, lineHeight: 1.5, margin: '8px 0 0' }}>
            Notya; asistanı, muayene notunu ve araçları branşınıza göre hazırlar. Devam etmek için branşınızı seçin.
          </p>
        </div>
        <form onSubmit={kaydet} noValidate>
          <div style={{ marginBottom: 20 }}>
            <BransSecimi kimlik="kapi-brans" deger={brans} onDegis={(k) => { setBrans(k); setHata(null); }} hata={hata} />
          </div>
          <button type="submit" disabled={bekliyor || !secildi} data-eylem="brans-kaydet" style={{
            width: '100%', backgroundColor: R.pine, color: '#ffffff', fontSize: 15, fontWeight: 600, padding: 14,
            border: 'none', borderRadius: 12, cursor: bekliyor || !secildi ? 'not-allowed' : 'pointer', opacity: bekliyor || !secildi ? 0.55 : 1,
            fontFamily: CHROME_FONT.sans,
          }}>
            {bekliyor ? 'Kaydediliyor…' : 'Devam et'}
          </button>
        </form>
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${R.borderSoft}`, textAlign: 'center', fontSize: 14, color: R.muted }}>
          <button type="button" onClick={onCikis} style={{ background: 'none', border: 'none', color: R.pine, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
