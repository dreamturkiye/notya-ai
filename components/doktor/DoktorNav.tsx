'use client';

import React, { useState, useEffect } from 'react';
import { getDoctorAccessToken } from '@/lib/doktor/clientAuth';

interface NavItem {
  label: string;
  route: string;
  color: string;
  hideOnMobile?: boolean;
}

const navItems: NavItem[] = [
  { label: "Asistan", route: "/asistan", color: "linear-gradient(90deg, #3B82F6, #7C3AED)" },
  { label: "Ana Sayfa", route: "/dashboard", color: "#0F9B8E", hideOnMobile: true },
  { label: "Hastalar", route: "/dashboard/doktor/hastalar", color: "#14B8A6" },
  { label: "Hasta Ekle", route: "/dashboard/doktor/hasta-ekle", color: "#F59E0B" },
  { label: "Belgeler", route: "/dashboard/doktor/belgeler", color: "#EF4444" },
  { label: "Görüntüleme", route: "/dashboard/doktor/goruntuleme", color: "#6366F1" },
  { label: "İlaçlar", route: "/dashboard/doktor/ilaclar", color: "#22C55E" },
  { label: "Raporlar", route: "/dashboard/doktor/raporlar", color: "#8B5CF6" },
  { label: "İnceleme", route: "/dashboard/doktor/inceleme", color: "#F97316" },
  { label: "Entegrasyonlar", route: "/dashboard/doktor/entegrasyonlar", color: "#0EA5E9" },
  { label: "Araçlar", route: "/doktor-tools", color: "#166534" },
  { label: "SGK", route: "/doktor-tools/sgk-medula", color: "#DC2626" },
];

export default function DoktorNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  const mobileItems = navItems.filter(i => !(i.hideOnMobile && isMobile))

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, minWidth: 0 }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#0F9B8E', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>N</div>
          <span style={{ color: 'white', fontSize: isMobile ? '17px' : '20px', fontWeight: 600, whiteSpace: 'nowrap' }}>Notya AI</span>
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
