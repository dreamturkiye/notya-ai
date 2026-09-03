'use client';

import React, { useState, useEffect } from 'react';
import { getDoctorAccessToken, ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

interface NavItem {
  label: string;
  route: string;
  color: string;
  hideOnMobile?: boolean;
  /** Clinical/staff-only items a sekreter account must never see, even by direct link. */
  sadeceDoktor?: boolean;
}

// NOTYA-SADE-01 (Ö1-Ö5, Kaan onayı "hepsi" 2026-09-02): üst menü 14 → 5 kaleme indi.
// İlke: yakınsak fazlalık kalır (tüm rotalar yaşıyor, derin linkler çalışır), ıraksak
// kavramlar gider. Belgeler/Görüntüleme/İlaçlar → hasta dosyası sekmeleri; Hasta Ekle →
// Hastalar sayfasındaki buton + randevu modalı + asistan; Ana Sayfa → logo tıkı Randevular'a;
// İnceleme → Raporlar üstündeki "Onay Bekleyen Notlar" kısayolu; Entegrasyonlar/Personel/
// SGK/Araçlar → tek Ayarlar sayfası. Detay: docs/SIMPLICITY-AUDIT.md
// NOTYA-RANDEVU-01: Randevular is shared (doktor + sekreter both see it — one calendar).
// Everything marked sadeceDoktor is hidden for a sekreter session; Personel manages who has
// that access at all, so it is doctor-only by the same rule.
const navItems: NavItem[] = [
  { label: "Asistan", route: "/asistan", color: "linear-gradient(90deg, #3B82F6, #7C3AED)", sadeceDoktor: true },
  { label: "Ana Sayfa", route: "/dashboard/doktor", color: "#0F9B8E", hideOnMobile: true, sadeceDoktor: true },
  { label: "Randevular", route: "/dashboard/doktor/randevular", color: "#0F9B8E" },
  { label: "Hastalar", route: "/dashboard/doktor/hastalar", color: "#14B8A6" },
  { label: "Raporlar", route: "/dashboard/doktor/raporlar", color: "#334155", sadeceDoktor: true },
  { label: "Araçlar", route: "/doktor-tools", color: "#166534", sadeceDoktor: true },
  { label: "⚙ Ayarlar", route: "/dashboard/doktor/ayarlar", color: "rgba(255,255,255,0.12)", sadeceDoktor: true },
];

export default function DoktorNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // NOTYA-RANDEVU-01: default to 'doktor' so the nav renders immediately and only narrows once
  // /api/personel/me confirms a sekreter session — never the other way around, which would
  // flash clinical items before hiding them.
  const [rol, setRol] = useState<'doktor' | 'sekreter'>('doktor');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    (async () => {
      const t = await ensureDoctorAccessToken();
      if (!t) return;
      try {
        const r = await fetch('/api/personel/me', { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) { const d = await r.json(); if (d.rol === 'sekreter') setRol('sekreter'); }
      } catch { /* stays 'doktor' on failure — least surprising default */ }
    })();
  }, []);

  const handleNav = (route: string) => {
    const raw = getDoctorAccessToken(); // NOTYA-AUTH-01: presence check through the one session reader
    if (!raw) {
      window.location.href = '/giris/doktor';
      return;
    }
    window.location.href = route;
    setIsOpen(false);
  };

  const checkAuth = () => {
    const raw = getDoctorAccessToken(); // NOTYA-AUTH-01: presence check through the one session reader
    if (!raw) {
      window.location.href = '/giris/doktor';
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const gorunurItems = navItems.filter(i => !(i.sadeceDoktor && rol === 'sekreter'))
  const mobileItems = gorunurItems.filter(i => !(i.hideOnMobile && isMobile))

  return (
    <nav style={{
      backgroundColor: '#0A1628',
      paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
      paddingBottom: '12px',
      paddingLeft: '16px',
      paddingRight: '16px',
      borderBottom: '1px solid #1E3A5F',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minHeight: '40px' }}>
        <div onClick={() => handleNav('/dashboard/doktor')} title="Ana Sayfa" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, minWidth: 0, cursor: 'pointer' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#0F9B8E', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>N</div>
          <span style={{ color: 'white', fontSize: isMobile ? '17px' : '20px', fontWeight: 600, whiteSpace: 'nowrap' }}>Notya AI<span style={{ fontSize: '10px', verticalAlign: 'super', opacity: 0.55 }}>™</span></span>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {mobileItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleNav(item.route)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  background: typeof item.color === 'string' && item.color.startsWith('linear') ? item.color : item.color,
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 1, minWidth: 0, justifyContent: 'flex-end' }}>
            {mobileItems.slice(0, 2).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleNav(item.route)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '9999px',
                  background: typeof item.color === 'string' && item.color.startsWith('linear') ? item.color : item.color,
                  color: 'white',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Menü"
              style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '18px', width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0, cursor: 'pointer' }}
            >
              {isOpen ? '✕' : '☰'}
            </button>
          </div>
        )}
      </div>

      {isMobile && isOpen && (
        <div style={{ marginTop: '12px', backgroundColor: '#0A1628', padding: '4px 0 8px', zIndex: 50 }}>
          {mobileItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNav(item.route)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px',
                color: 'white',
                background: typeof item.color === 'string' && item.color.startsWith('linear') ? item.color : item.color,
                marginBottom: '4px',
                borderRadius: '8px',
                border: 'none',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
