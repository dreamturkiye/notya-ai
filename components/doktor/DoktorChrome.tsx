'use client';

/**
 * NOTYA-YENI-GORUNUM-01 — the new chrome (header + dock), replacing DoktorNav's visuals.
 *
 * Functional parity with DoktorNav is deliberate, not incidental: same nav items, same
 * doktor/sekreter role filtering, same real unread-mesaj badge, same logout, same
 * BranşDeğiştir mount for the two verified superuser accounts. Nothing that works today is
 * allowed to quietly disappear under a reskin — that was the exact gap found in the Grok
 * concept (it dropped Mesajlar and Çıkış Yap entirely).
 *
 * Everything else — doctor photo, name, specialty, clock — is real, fetched from the actual
 * account, not hardcoded. No fake weather: there's no weather feature in the app, so rather
 * than fabricate one, it's simply not there.
 */

import React, { useEffect, useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { getDoctorAccessToken, ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import BransDegistir from './BransDegistir';
import { CHROME_RENK, CHROME_FONT, saatTRT } from '@/lib/doktor/chromeTheme';
import { KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI } from '@/lib/doktor/specialties';

/**
 * A page rendered under a chrome-owning layout (e.g. hedef-boy's "aile" / family-facing embed
 * mode) can hide the header+dock without touching the layout -- call this with true while that
 * mode is active. Children still render either way; only the chrome visibility changes.
 */
const ChromeGizleContext = createContext<(gizli: boolean) => void>(() => {});
export function useChromeGizle(gizli: boolean) {
  const setGizli = useContext(ChromeGizleContext);
  useEffect(() => { setGizli(gizli); return () => setGizli(false); }, [gizli, setGizli]);
}

interface NavItem {
  label: string;
  route: string;
  sadeceDoktor?: boolean;
  hideOnMobile?: boolean;
}

// Kept in lockstep with DoktorNav.tsx's navItems — same routes, same sadeceDoktor gating.
const navItems: NavItem[] = [
  { label: 'Asistan', route: '/asistan', sadeceDoktor: true },
  { label: 'Ana Sayfa', route: '/dashboard/doktor', sadeceDoktor: true, hideOnMobile: true },
  { label: 'Randevular', route: '/dashboard/doktor/randevular' },
  { label: 'Hastalar', route: '/dashboard/doktor/hastalar' },
  { label: 'Mesajlar', route: '/dashboard/doktor/mesajlar' },
  { label: 'Raporlar', route: '/dashboard/doktor/raporlar', sadeceDoktor: true },
  { label: 'Araçlar', route: '/doktor-tools', sadeceDoktor: true },
  { label: 'Ayarlar', route: '/dashboard/doktor/ayarlar', sadeceDoktor: true },
];

const LEAF = (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
    <path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="currentColor" strokeWidth="1.15" />
    <path d="M10 13.2c2-2 4.2-3 6.8-3.4" stroke="currentColor" strokeWidth="1.05" />
    <path d="M6.2 20c1.2-4 2.2-6.6 4.8-9.8" stroke="currentColor" strokeWidth="1.05" />
  </svg>
);

const DOCK_ICON: Record<string, React.ReactNode> = {
  '/asistan': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.45" /><path d="M7 18c.5-3 2.2-4.6 5-4.6S16.5 15 17 18" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" /></svg>
  ),
  '/dashboard/doktor': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 5l8 6.5V20H4v-8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
  ),
  '/dashboard/doktor/randevular': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="12" height="16" rx="1.6" stroke="currentColor" strokeWidth="1.55" /><path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.45" /></svg>
  ),
  '/dashboard/doktor/hastalar': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.45" /><circle cx="15.4" cy="9" r="1.7" stroke="currentColor" strokeWidth="1.45" /><path d="M4.8 18c.6-3 2.4-4.5 4.3-4.5s3.6 1.5 4.2 4.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" /></svg>
  ),
  '/dashboard/doktor/mesajlar': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M4.5 6.5 12 12.5l7.5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
  ),
  '/dashboard/doktor/raporlar': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 19V10M10 19V6M15 19v-7M20 19V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
  ),
  '/doktor-tools': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4.5" y="4.5" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="13.3" y="4.5" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="4.5" y="13.3" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="13.3" y="13.3" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /></svg>
  ),
  '/dashboard/doktor/ayarlar': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.45" /><path d="M12 4.6v1.8M12 17.6v1.8M4.6 12h1.8M17.6 12h1.8" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" /></svg>
  ),
};

const BRANS_ETIKET: Record<string, string> = {
  pediatri: 'Pediatrist', kardiyoloji: 'Kardiyolog', noroloji: 'Nörolog', psikiyatri: 'Psikiyatrist',
  dahiliye: 'Dahiliyeci', ortopedi: 'Ortopedist', 'kadin-hastaliklari-dogum': KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI,
  'genel-cerrahi': 'Genel Cerrah', dermatoloji: 'Dermatolog', uroloji: 'Ürolog', onkoloji: 'Onkolog',
  'acil-tip': 'Acil Tıp Uzmanı', 'kulak-burun-bogaz': 'KBB Uzmanı', 'goz-hastaliklari': 'Göz Hastalıkları Uzmanı',
  'aile-hekimligi': 'Aile Hekimi',
};

export default function DoktorChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [rol, setRol] = useState<'doktor' | 'sekreter'>('doktor');
  const [mesajUnread, setMesajUnread] = useState(0);
  const [ad, setAd] = useState('');
  const [brans, setBrans] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saat, setSaat] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [gizli, setGizli] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setSaat(saatTRT());
    const t = setInterval(() => setSaat(saatTRT()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const t = await ensureDoctorAccessToken();
      if (!t) return;
      try {
        const r = await fetch('/api/personel/me', { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) { const d = await r.json(); if (d.rol === 'sekreter') setRol('sekreter'); }
      } catch { /* stays doktor */ }
      try {
        const r = await fetch('/api/doktor/mesajlar/unread-count', { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) { const d = await r.json(); setMesajUnread(Number(d.unreadCount) || 0); }
      } catch { /* badge stays 0 */ }
      try {
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) {
          const d = await r.json();
          const u = d?.data || d;
          setAd(String(u?.full_name || u?.first_name || '').trim());
          setBrans(String(u?.specialty || ''));
        }
      } catch { /* header just shows less */ }
      try {
        const r = await fetch('/api/doktor/profil/avatar', { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) { const d = await r.json(); if (d?.avatar?.dataUrl) setAvatarUrl(d.avatar.dataUrl); }
      } catch { /* falls back to initials */ }
    })();
  }, []);

  useEffect(() => {
    const raw = getDoctorAccessToken();
    if (!raw) window.location.href = '/giris/doktor';
  }, []);

  function handleNav(route: string) {
    const raw = getDoctorAccessToken();
    if (!raw) { window.location.href = '/giris/doktor'; return; }
    window.location.href = route;
    setMenuOpen(false);
  }

  function handleCikis() {
    if (typeof window !== 'undefined') {
      const key = Object.keys(localStorage).find((k) => k.includes('auth-token')) || '';
      if (key) localStorage.removeItem(key);
    }
    window.location.href = '/giris/doktor';
  }

  const gorunurItems = navItems.filter((i) => !(i.sadeceDoktor && rol === 'sekreter'));
  const mobileItems = gorunurItems.filter((i) => !(i.hideOnMobile && isMobile));
  const initials = ad.split(' ').filter(Boolean).slice(-2).map((s) => s[0]).join('').toUpperCase() || 'D';

  const S = (s: Record<string, unknown>) => s as React.CSSProperties;

  if (gizli) {
    // Aile / embed modu: sayfa kendi tam ekran deneyimini yönetir -- hiçbir sarmalayıcı yok,
    // yalnız içerik. Görünürlük geri değiştiğinde (useChromeGizle temizlenince) normale döner.
    return <ChromeGizleContext.Provider value={setGizli}>{children}</ChromeGizleContext.Provider>;
  }

  return (
    <ChromeGizleContext.Provider value={setGizli}>
    <div
      style={S({
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        background: CHROME_RENK.cream, fontFamily: CHROME_FONT.sans, color: CHROME_RENK.ink,
      })}
    >
      <img
        src="/doktor-chrome/plant.jpg"
        alt=""
        style={S({
          position: 'absolute', right: '-2%', top: 0, bottom: 0, width: 'min(56vw, 760px)',
          objectFit: 'cover', objectPosition: '58% 12%', pointerEvents: 'none', zIndex: 0,
          opacity: isMobile ? 0.28 : 0.5,
          filter: 'saturate(.65) contrast(.88) brightness(1.1)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 30%)',
          maskImage: 'linear-gradient(90deg, transparent 0%, #000 30%)',
        })}
      />

      <div style={S({ width: 'min(1200px, calc(100% - 48px))', margin: '0 auto', padding: '22px 0 48px', position: 'relative', zIndex: 1 })}>

        {/* Header */}
        <header style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' })}>
          <div onClick={() => handleNav('/dashboard/doktor')} style={S({ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' })}>
            <div style={S({ color: '#6a7563', marginTop: 2 })}>{LEAF}</div>
            <div>
              <div style={S({ fontFamily: CHROME_FONT.serif, fontSize: isMobile ? 26 : 32, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 0.95, color: CHROME_RENK.ink })}>Notya</div>
              <span style={S({ display: 'block', marginTop: 5, fontSize: 10.5, letterSpacing: '0.3em', fontWeight: 700, color: '#7d7164' })}>DOKTOR</span>
            </div>
          </div>

          {!isMobile && (
            <div style={S({ display: 'flex', alignItems: 'center', gap: 12, color: '#6e6256', fontSize: 15, flexShrink: 0 })}>
              <div
                title={ad || 'Doktor'}
                style={S({
                  width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: CHROME_RENK.pine, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: CHROME_RENK.gold, fontWeight: 700, fontSize: 16,
                  boxShadow: `0 0 0 3px ${CHROME_RENK.paper}, 0 0 0 4px rgba(47,67,52,0.16)`,
                })}
              >
                {avatarUrl ? <img src={avatarUrl} alt={ad} style={S({ width: '100%', height: '100%', objectFit: 'cover' })} /> : initials}
              </div>
              <div>
                <strong style={S({ display: 'block', color: CHROME_RENK.ink, fontSize: 16, fontWeight: 650, whiteSpace: 'nowrap' })}>
                  {ad ? `Dr. ${ad}` : '\u00A0'}
                </strong>
                <small style={S({ color: '#8a7b6c', fontSize: 13 })}>{BRANS_ETIKET[brans] || '\u00A0'}</small>
              </div>
              <div style={S({ width: 1, height: 38, background: 'rgba(58,44,34,0.16)' })} />
              <div style={S({ fontVariantNumeric: 'tabular-nums', fontSize: 19, fontWeight: 600, color: CHROME_RENK.ink })}>{saat}</div>
            </div>
          )}

          {isMobile && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menü"
              style={S({ background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, width: 42, height: 42, fontSize: 18, cursor: 'pointer', color: CHROME_RENK.ink })}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </header>

        {/* Content slot */}
        <div>{children}</div>

        {/* Dock */}
        {(!isMobile || menuOpen) && (
          <nav style={S({ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 28, position: 'relative', zIndex: 2 })}>
            {mobileItems.map((item) => {
              const active = pathname === item.route || (item.route !== '/dashboard/doktor' && pathname?.startsWith(item.route));
              return (
                <button
                  key={item.route}
                  onClick={() => handleNav(item.route)}
                  style={S({
                    display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 999,
                    background: active ? CHROME_RENK.nav : '#f3ece0',
                    color: active ? '#f4ead7' : '#6a5d50',
                    border: `1px solid ${active ? CHROME_RENK.nav : 'rgba(58,44,34,0.05)'}`,
                    boxShadow: '0 8px 18px rgba(58,44,34,0.045)', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  })}
                >
                  {DOCK_ICON[item.route]}
                  {item.label}
                  {item.route === '/dashboard/doktor/mesajlar' && mesajUnread > 0 ? ` (${mesajUnread})` : ''}
                </button>
              );
            })}
            <BransDegistir />
            <button
              onClick={handleCikis}
              style={S({ padding: '11px 16px', borderRadius: 999, background: 'transparent', border: `1px solid ${CHROME_RENK.warn}66`, color: CHROME_RENK.warn, fontSize: 14, fontWeight: 600, cursor: 'pointer' })}
            >
              Çıkış Yap
            </button>
          </nav>
        )}
      </div>
    </div>
    </ChromeGizleContext.Provider>
  );
}
