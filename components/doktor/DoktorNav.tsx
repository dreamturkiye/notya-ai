'use client';

import React, { useState, useEffect } from 'react';

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
    const raw = localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || '');
    if (!raw) {
      window.location.href = '/giris/doktor';
      return;
    }
    window.location.href = route;
    setIsOpen(false);
  };

  const checkAuth = () => {
    const raw = localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')) || '');
    if (!raw) {
      window.location.href = '/giris/doktor';
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <nav style={{ backgroundColor: '#0A1628', padding: '12px 16px', borderBottom: '1px solid #1E3A5F' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#0F9B8E', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>N</div>
          <span style={{ color: 'white', fontSize: '20px', fontWeight: 600 }}>Notya AI</span>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {navItems.filter(i => !(i.hideOnMobile && isMobile)).map((item, idx) => (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {navItems.filter(i => !(i.hideOnMobile && isMobile)).slice(0, 3).map((item, idx) => (
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
                }}
              >
                {item.label}
              </button>
            ))}
            <button onClick={() => setIsOpen(!isOpen)} style={{ color: 'white', background: 'none', border: 'none', fontSize: '20px' }}>☰</button>
          </div>
        )}
      </div>

      {isMobile && isOpen && (
        <div style={{ position: 'absolute', top: '60px', left: 0, right: 0, backgroundColor: '#0A1628', padding: '16px', zIndex: 50, borderBottom: '1px solid #1E3A5F' }}>
          {navItems.filter(i => !(i.hideOnMobile && isMobile)).map((item, idx) => (
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
