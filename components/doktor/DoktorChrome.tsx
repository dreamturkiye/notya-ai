'use client';

/**
 * NOTYA-YENI-GORUNUM-04 — Sidebar B (Kaan, 2026-09-24): main nav moved from the bottom dock to a
 * left sidebar, approved in canvas after three options (compact rail / expanded+grouped / editorial)
 * were reviewed. This is the "expanded, grouped" option — full labels, Asistan pulled out as its
 * own highlighted row, Ana Sayfa/Randevular/Hastalar/Mesajlar under "Çalışma alanı", Raporlar/
 * Araçlar/Ayarlar under "Diğer". Desktop only; mobile keeps a hamburger that reveals the same
 * grouped list. On a phone the same items sit in a bottom tab bar (Ana Sayfa, Randevular,
 * Hastalar, Mesajlar) plus a Menü sheet for the rest — the desktop sidebar is unchanged.
 *
 * Functional parity with the pre-Sidebar-B dock (and with DoktorNav before that) is deliberate:
 * same nav items, same doktor/sekreter role filtering, same real unread-mesaj badge, same logout,
 * same BranşDeğiştir mount for the two verified superuser accounts. Nothing that works today is
 * allowed to quietly disappear under a reskin.
 *
 * Everything else — doctor photo, name, specialty, clock, weather — is real. Weather: browser
 * geolocation + Open-Meteo (free, keyless) — no fabricated numbers; if the doctor declines the
 * location prompt or the fetch fails, the weather chip simply doesn't render.
 */

import React, { useEffect, useState, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDoctorAccessToken, ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { hekimUnvanli } from '@/lib/doktor/hekimAdi';
import BransDegistir from './BransDegistir';
import GelenBelgeBirak from './gelenBelgeler/GelenBelgeBirak';
import { GELEN_OLAY, GELEN_SAYI_OLAY } from '@/lib/gelenBelgeler/istemci';
import { CHROME_RENK, CHROME_FONT, saatTRT } from '@/lib/doktor/chromeTheme';
import { KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI } from '@/lib/doktor/specialties';

/**
 * A page rendered under a chrome-owning layout (e.g. hedef-boy's "aile" / family-facing embed
 * mode) can hide the header+sidebar without touching the layout -- call this with true while that
 * mode is active. Children still render either way; only the chrome visibility changes.
 */
const ChromeGizleContext = createContext<(gizli: boolean) => void>(() => {});
export function useChromeGizle(gizli: boolean) {
  const setGizli = useContext(ChromeGizleContext);
  useEffect(() => { setGizli(gizli); return () => setGizli(false); }, [gizli, setGizli]);
}

/**
 * NOTYA-CHROME-KOMPAKT-01 (Kaan, 2026-09-24) — "Asistana sor sayfasini daha iyi yap. Burdada
 * solda full menu ve logo olsun etc." A voice-call page needs the sidebar (Kaan's ask), but its
 * own full-height, app-like layout (persona panel | conversation | bottom control bar, all sized
 * to exactly the viewport) can't coexist with DoktorChrome's own header row, footer, and
 * max-width content wrapper — stacking those on top would push the page past 100vh and force an
 * outer scroll the voice UI was never designed for. useChromeGizle is all-or-nothing (drops the
 * sidebar too), so this is a second, narrower context: keep the sidebar, drop only the header,
 * footer, and the max-width/padding wrapper around {children}, leaving the content free to size
 * itself to the remaining space exactly as useChromeGizle's content already does.
 */
const ChromeKompaktContext = createContext<(kompakt: boolean) => void>(() => {});
export function useChromeKompakt(kompakt: boolean) {
  const setKompakt = useContext(ChromeKompaktContext);
  useEffect(() => { setKompakt(kompakt); return () => setKompakt(false); }, [kompakt, setKompakt]);
}

interface NavItem {
  label: string;
  route: string;
  sadeceDoktor?: boolean;
  /** NOTYA-GELEN-BELGELER: shown to a secretary only when the doctor opened access (server decides). */
  gelenBelge?: boolean;
}

// Kept in lockstep with the pre-Sidebar-B dock's navItems -- same routes, same sadeceDoktor gating.
// "grup" decides which sidebar section an item lands in; 'asistan' is pulled out as its own
// highlighted row rather than grouped with the rest.
const navItems: (NavItem & { grup: 'asistan' | 'calisma' | 'diger' })[] = [
  { label: 'Asistan', route: '/asistan', sadeceDoktor: true, grup: 'asistan' },
  { label: 'Ana Sayfa', route: '/dashboard/doktor', sadeceDoktor: true, grup: 'calisma' },
  { label: 'Randevular', route: '/dashboard/doktor/randevular', grup: 'calisma' },
  { label: 'Hastalar', route: '/dashboard/doktor/hastalar', grup: 'calisma' },
  { label: 'Mesajlar', route: '/dashboard/doktor/mesajlar', grup: 'calisma' },
  { label: 'Gelen Belgeler', route: '/dashboard/doktor/gelen-belgeler', gelenBelge: true, grup: 'calisma' },
  { label: 'Raporlar', route: '/dashboard/doktor/raporlar', sadeceDoktor: true, grup: 'diger' },
  { label: 'Araçlar', route: '/doktor-tools', sadeceDoktor: true, grup: 'diger' },
  { label: 'Ayarlar', route: '/dashboard/doktor/ayarlar', sadeceDoktor: true, grup: 'diger' },
];

const LEAF = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="currentColor" strokeWidth="1.15" />
    <path d="M10 13.2c2-2 4.2-3 6.8-3.4" stroke="currentColor" strokeWidth="1.05" />
    <path d="M6.2 20c1.2-4 2.2-6.6 4.8-9.8" stroke="currentColor" strokeWidth="1.05" />
  </svg>
);

const NAV_ICON: Record<string, React.ReactNode> = {
  '/asistan': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 18c.5-3 2.2-4.6 5-4.6S16.5 15 17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  ),
  '/dashboard/doktor': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 5l8 6.5V20H4v-8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
  ),
  '/dashboard/doktor/randevular': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="12" height="16" rx="1.6" stroke="currentColor" strokeWidth="1.55" /><path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.45" /></svg>
  ),
  '/dashboard/doktor/hastalar': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.45" /><circle cx="15.4" cy="9" r="1.7" stroke="currentColor" strokeWidth="1.45" /><path d="M4.8 18c.6-3 2.4-4.5 4.3-4.5s3.6 1.5 4.2 4.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" /></svg>
  ),
  '/dashboard/doktor/mesajlar': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M4.5 6.5 12 12.5l7.5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
  ),
  '/dashboard/doktor/gelen-belgeler': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 13.5 6.5 6h11L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M4 13.5h4.5l1.2 2h4.6l1.2-2H20" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
  ),
  '/dashboard/doktor/raporlar': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 19V10M10 19V6M15 19v-7M20 19V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
  ),
  '/doktor-tools': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4.5" y="4.5" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="13.3" y="4.5" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="4.5" y="13.3" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /><rect x="13.3" y="13.3" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth="1.5" /></svg>
  ),
  '/dashboard/doktor/ayarlar': (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.45" /><path d="M12 4.6v1.8M12 17.6v1.8M4.6 12h1.8M17.6 12h1.8" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" /></svg>
  ),
};

/** Phone tab bar. Four daily destinations; everything else opens from Menü. Desktop keeps the sidebar. */
const SEKME_YOLLARI = [
  '/dashboard/doktor',
  '/dashboard/doktor/randevular',
  '/dashboard/doktor/hastalar',
  '/dashboard/doktor/mesajlar',
] as const;

const MENU_IKON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="6" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18" cy="12" r="1.6" />
  </svg>
);

/** Phone back target. Ana Sayfa has none. A section (Randevular, Araçlar, …) returns home.
 *  A page inside a section returns that section (Hedef Boy → Araçlar). */
function mobilGeri(pathname: string | null): { yol: string; etiket: string } | null {
  if (!pathname) return null;
  const temiz = pathname.replace(/\/$/, '') || '/';
  if (temiz === '/dashboard/doktor') return null;
  const sahip = [...navItems]
    .filter((i) => i.route !== '/dashboard/doktor')
    .sort((a, b) => b.route.length - a.route.length)
    .find((i) => temiz === i.route || temiz.startsWith(`${i.route}/`));
  if (sahip && temiz !== sahip.route) return { yol: sahip.route, etiket: sahip.label };
  return { yol: '/dashboard/doktor', etiket: 'Ana Sayfa' };
}

function sekmeAktif(route: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (route === '/dashboard/doktor') {
    if (pathname === '/dashboard/doktor') return true;
    if (!pathname.startsWith('/dashboard/doktor/')) return false;
    return !SEKME_YOLLARI.some((r) => r !== '/dashboard/doktor' && (pathname === r || pathname.startsWith(`${r}/`)));
  }
  return pathname === route || pathname.startsWith(`${route}/`);
}

const BRANS_ETIKET: Record<string, string> = {
  pediatri: 'Pediatrist', kardiyoloji: 'Kardiyolog', noroloji: 'Nörolog', psikiyatri: 'Psikiyatrist',
  dahiliye: 'Dahiliyeci', ortopedi: 'Ortopedist', 'kadin-hastaliklari-dogum': KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI,
  'genel-cerrahi': 'Genel Cerrah', dermatoloji: 'Dermatolog', uroloji: 'Ürolog', onkoloji: 'Onkolog',
  'acil-tip': 'Acil Tıp Uzmanı', 'kulak-burun-bogaz': 'KBB Uzmanı', 'goz-hastaliklari': 'Göz Hastalıkları Uzmanı',
  'aile-hekimligi': 'Aile Hekimi',
};

/** WMO weather code (Open-Meteo) -> a simple glyph. https://open-meteo.com/en/docs (WMO Weather interpretation codes). */
function havaIkonu(kod: number): string {
  if (kod === 0) return '☀️';
  if (kod <= 3) return '⛅';
  if (kod === 45 || kod === 48) return '🌫️';
  if (kod >= 51 && kod <= 57) return '🌦️';
  if (kod >= 61 && kod <= 67) return '🌧️';
  if (kod >= 71 && kod <= 77) return '❄️';
  if (kod >= 80 && kod <= 82) return '🌦️';
  if (kod >= 95) return '⛈️';
  return '🌤️';
}

export default function DoktorChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [rol, setRol] = useState<'doktor' | 'sekreter'>('doktor');
  const [mesajUnread, setMesajUnread] = useState(0);
  const [gelenSayi, setGelenSayi] = useState(0);
  const [gelenErisim, setGelenErisim] = useState(false);
  const [ad, setAd] = useState('');
  const [brans, setBrans] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saat, setSaat] = useState('');
  const [hava, setHava] = useState<{ sicaklik: number; kod: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gizli, setGizli] = useState(false);
  const [kompakt, setKompakt] = useState(false);

  useEffect(() => {
    const metas = document.querySelectorAll('meta[name="theme-color"]')
    const onceki = Array.from(metas).map((m) => (m as HTMLMetaElement).content)
    metas.forEach((m) => { (m as HTMLMetaElement).content = CHROME_RENK.cream })
    const html = document.documentElement
    const body = document.body
    const oncekiHtml = html.style.background
    const oncekiBody = body.style.background
    html.style.background = CHROME_RENK.cream
    body.style.background = CHROME_RENK.cream
    return () => {
      metas.forEach((m, i) => { (m as HTMLMetaElement).content = onceki[i] || '#0A1628' })
      html.style.background = oncekiHtml
      body.style.background = oncekiBody
    }
  }, [])

  useEffect(() => {
    setSaat(saatTRT());
    const t = setInterval(() => setSaat(saatTRT()), 30000);
    return () => clearInterval(t);
  }, []);

  // Kaan (2026-09-24): iPhone-style weather chip under the clock. Real geolocation + Open-Meteo
  // (free, no API key). Silent no-render on denial/failure -- never a fabricated number.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    let iptal = false;
    navigator.geolocation.getCurrentPosition(
      (konum) => {
        const { latitude, longitude } = konum.coords;
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (iptal || !d?.current) return;
            setHava({ sicaklik: Math.round(d.current.temperature_2m), kod: Number(d.current.weather_code) });
          })
          .catch(() => {});
      },
      () => {}, // izin reddedildi / konum alınamadı -- sessizce yok say
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    );
    return () => { iptal = true; };
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

  // NOTYA-GELEN-BELGELER: badge + whether this user may use the inbox at all (doctor; secretary with the switch on).
  useEffect(() => {
    const yukle = async () => {
      const t = await ensureDoctorAccessToken();
      if (!t) return;
      try {
        const r = await fetch('/api/doktor/gelen-belgeler?sayi=1', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        if (r.ok) { const d = await r.json(); setGelenErisim(d.erisim === true); setGelenSayi(Number(d.sayi) || 0); }
      } catch { /* no badge */ }
    };
    void yukle();
    window.addEventListener(GELEN_OLAY, yukle);
    window.addEventListener(GELEN_SAYI_OLAY, yukle);
    return () => { window.removeEventListener(GELEN_OLAY, yukle); window.removeEventListener(GELEN_SAYI_OLAY, yukle); };
  }, []);

  useEffect(() => {
    const raw = getDoctorAccessToken();
    if (!raw) window.location.href = '/giris/doktor';
  }, []);

  // NOTYA-ASISTAN-YUZEN-01: istemci tarafı gezinme — window.location tam sayfa yüklemesi yapıp
  // AsistanOturumProvider'ı (sesli seans + sohbet) öldürüyordu.
  function handleNav(route: string) {
    const raw = getDoctorAccessToken();
    if (!raw) { router.push('/giris/doktor'); return; }
    router.push(route);
    setMenuOpen(false);
  }

  function handleCikis() {
    if (typeof window !== 'undefined') {
      const key = Object.keys(localStorage).find((k) => k.includes('auth-token')) || '';
      if (key) localStorage.removeItem(key);
    }
    window.location.href = '/giris/doktor';
  }

  const gorunurItems = navItems.filter((i) => !(i.sadeceDoktor && rol === 'sekreter') && !(i.gelenBelge && !gelenErisim));
  const asistanItem = gorunurItems.find((i) => i.grup === 'asistan');
  const calismaItems = gorunurItems.filter((i) => i.grup === 'calisma');
  const digerItems = gorunurItems.filter((i) => i.grup === 'diger');
  const sekmeItems = SEKME_YOLLARI.map((route) => gorunurItems.find((i) => i.route === route)).filter((i): i is NonNullable<typeof i> => Boolean(i));
  const menuItems = gorunurItems.filter((i) => !(SEKME_YOLLARI as readonly string[]).includes(i.route));
  const geri = mobilGeri(pathname);
  const menuAktif = menuOpen || menuItems.some((i) => sekmeAktif(i.route, pathname));

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  const initials = ad.split(' ').filter(Boolean).slice(-2).map((s) => s[0]).join('').toUpperCase() || 'D';

  const S = (s: Record<string, unknown>) => s as React.CSSProperties;

  function navRow(item: NavItem, highlight = false) {
    const active = pathname === item.route || (item.route !== '/dashboard/doktor' && pathname?.startsWith(item.route));
    const rozet = item.route === '/dashboard/doktor/mesajlar' && mesajUnread > 0 ? mesajUnread : item.route === '/dashboard/doktor/gelen-belgeler' ? gelenSayi : 0;
    if (highlight) {
      return (
        <div
          key={item.route}
          onClick={() => handleNav(item.route)}
          role="link"
          style={S({ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 13, background: CHROME_RENK.pine, color: '#FAF8F4', cursor: 'pointer', marginBottom: 18 })}
        >
          {NAV_ICON[item.route]}
          <span style={S({ fontSize: 14.5, fontWeight: 700 })}>Asistana sor</span>
        </div>
      );
    }
    return (
      <div
        key={item.route}
        onClick={() => handleNav(item.route)}
        role="link"
        style={S({
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 11, cursor: 'pointer',
          fontSize: 14.5, fontWeight: 600, justifyContent: 'space-between',
          background: active ? CHROME_RENK.nav : 'transparent', color: active ? '#f4ead7' : '#4a4030',
        })}
      >
        <span style={S({ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 })}>
          {NAV_ICON[item.route]}
          <span style={S({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{item.label}</span>
        </span>
        {rozet > 0 && (
          <span style={S({
            flexShrink: 0, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: CHROME_RENK.warn,
            color: '#FAF8F4', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontVariantNumeric: 'tabular-nums',
          })}>
            {rozet > 9 ? '9+' : rozet}
          </span>
        )}
      </div>
    );
  }

  const sidebarInner = (
    <>
      <div onClick={() => handleNav('/dashboard/doktor')} style={S({ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '0 6px 22px', cursor: 'pointer' })}>
        <div style={S({ color: '#6a7563', marginTop: 1 })}>{LEAF}</div>
        <div>
          <div style={S({ fontFamily: CHROME_FONT.serif, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: CHROME_RENK.ink })}>Notya</div>
          <span style={S({ display: 'block', marginTop: 3, fontSize: 9, letterSpacing: '0.28em', fontWeight: 700, color: '#7d7164' })}>DOKTOR</span>
        </div>
      </div>

      {asistanItem && navRow(asistanItem, true)}

      {calismaItems.length > 0 && (
        <>
          <div style={S({ fontSize: 11, fontWeight: 700, color: '#9a8c7c', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 14px', marginBottom: 6 })}>Çalışma alanı</div>
          <div style={S({ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 18 })}>
            {calismaItems.map((i) => navRow(i))}
          </div>
        </>
      )}

      {digerItems.length > 0 && (
        <>
          <div style={S({ height: 1, background: CHROME_RENK.border, margin: '0 14px 14px' })} />
          <div style={S({ fontSize: 11, fontWeight: 700, color: '#9a8c7c', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 14px', marginBottom: 6 })}>Diğer</div>
          <div style={S({ display: 'flex', flexDirection: 'column', gap: 2 })}>
            {digerItems.map((i) => navRow(i))}
          </div>
        </>
      )}
    </>
  );

  if (gizli) {
    // Aile / embed modu: sayfa kendi tam ekran deneyimini yönetir -- hiçbir sarmalayıcı yok,
    // yalnız içerik. Görünürlük geri değiştiğinde (useChromeGizle temizlenince) normale döner.
    return <ChromeGizleContext.Provider value={setGizli}>{children}</ChromeGizleContext.Provider>;
  }

  return (
    <ChromeGizleContext.Provider value={setGizli}>
    <ChromeKompaktContext.Provider value={setKompakt}>
    {gelenErisim && <GelenBelgeBirak />}
    <style>{`
      html, body { background: ${CHROME_RENK.cream}; }
      .notya-yan { display: flex; }
      .notya-masa-ust { display: flex; }
      .notya-telefon-ust, .notya-telefon-menu, .notya-telefon-perde, .notya-alt-nav { display: none; }
      /* globals.css pins every fixed nav to top:0. With bottom:0 that stretched the tab bar over the page. */
      body .notya-alt-nav { top: auto !important; height: auto !important; bottom: 0 !important; }
      .notya-icerik {
        width: min(1120px, calc(100% - 64px));
        margin: 0 auto;
        padding: calc(22px + env(safe-area-inset-top, 0px)) 0 48px;
        position: relative;
        z-index: 1;
        box-sizing: border-box;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
      }
      .notya-alt { margin-top: auto; }
      .notya-bitki { opacity: 0.4; }
      .notya-kompakt {
        position: absolute;
        left: 0; right: 0;
        top: env(safe-area-inset-top, 0px);
        bottom: env(safe-area-inset-bottom, 0px);
      }
      @media (max-width: 899px) {
        .notya-yan, .notya-masa-ust { display: none !important; }
        .notya-telefon-ust { display: flex !important; }
        .notya-telefon-perde { display: block !important; }
        .notya-telefon-menu { display: flex !important; }
        .notya-alt-nav { display: flex !important; }
        .notya-icerik { width: calc(100% - 32px); padding-top: 0; padding-bottom: 72px; }
        .notya-telefon-ust {
          position: sticky;
          top: 0;
          z-index: 40;
          margin: 0 -16px 16px;
          padding: calc(10px + env(safe-area-inset-top, 0px)) 16px 12px;
          background: ${CHROME_RENK.cream};
          border-bottom: 1px solid ${CHROME_RENK.border};
        }
        .notya-bitki { opacity: 0.28; }
        .notya-kompakt { bottom: calc(64px + env(safe-area-inset-bottom, 0px)); }
        .notya-telefon-menu [role="link"] { min-height: 44px; box-sizing: border-box; }
        .notya-alt-yuzer { bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important; }
      }
      @media print {
        .notya-alt-nav, .notya-telefon-menu, .notya-telefon-perde { display: none !important; }
      }
    `}</style>
    <div
      className="notya-kabuk"
      style={S({
        minHeight: '100dvh', position: 'relative',
        background: CHROME_RENK.cream, fontFamily: CHROME_FONT.sans, color: CHROME_RENK.ink,
        display: 'flex',
      })}
    >
      <nav
        className="notya-yan"
        style={S({
          width: 248, flexShrink: 0, minHeight: '100vh', background: CHROME_RENK.paper,
          borderRight: `1px solid ${CHROME_RENK.border}`, flexDirection: 'column',
          padding: '0 14px 22px', paddingTop: 'calc(22px + env(safe-area-inset-top, 0px))',
          boxSizing: 'border-box', position: 'sticky', top: 0,
          alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto',
        })}
      >
          {sidebarInner}
          <div style={S({ flex: 1 })} />
          <div style={S({ borderTop: `1px solid ${CHROME_RENK.border}`, paddingTop: 14, marginTop: 10 })}>
            <BransDegistir />
          </div>
        </nav>

      <div className="notya-ana" style={S({ flex: 1, minWidth: 0, position: 'relative' })}>
        {kompakt ? (
          <div className="notya-kompakt">{children}</div>
        ) : (
        <>
        <div style={S({ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 })}>
        <img
          src="/doktor-chrome/plant.jpg"
          alt=""
          className="notya-bitki"
          style={S({
            position: 'absolute', right: '-2%', top: 0, bottom: 0, width: 'min(50vw, 700px)',
            objectFit: 'cover', objectPosition: '58% 12%',
            filter: 'saturate(.65) contrast(.88) brightness(1.1)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 30%)',
            maskImage: 'linear-gradient(90deg, transparent 0%, #000 30%)',
          })}
        />
        </div>

        <div className="notya-icerik">

          <div className="notya-masa-ust" style={S({ alignItems: 'center', justifyContent: 'flex-end', gap: 16, color: '#6e6256', fontSize: 15, marginBottom: 24, flexWrap: 'wrap' })}>
              <div
                title={ad || 'Doktor'}
                style={S({
                  width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: CHROME_RENK.pine, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: CHROME_RENK.gold, fontWeight: 700, fontSize: 15,
                  boxShadow: `0 0 0 3px ${CHROME_RENK.cream}, 0 0 0 4px rgba(47,67,52,0.16)`,
                })}
              >
                {avatarUrl ? <img src={avatarUrl} alt={ad} style={S({ width: '100%', height: '100%', objectFit: 'cover' })} /> : initials}
              </div>
              <div>
                <strong style={S({ display: 'block', color: CHROME_RENK.ink, fontSize: 14.5, fontWeight: 650, whiteSpace: 'nowrap' })}>
                  {ad ? hekimUnvanli(ad) : '\u00A0'}
                </strong>
                <small style={S({ color: '#8a7b6c', fontSize: 12 })}>{BRANS_ETIKET[brans] || '\u00A0'}</small>
              </div>
              <div style={S({ width: 1, height: 40, background: 'rgba(58,44,34,0.16)' })} />
              <div>
                <div style={S({ fontVariantNumeric: 'tabular-nums', fontSize: 22, fontWeight: 600, color: CHROME_RENK.ink, lineHeight: 1 })}>{saat}</div>
                {hava && (
                  <div style={S({ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 22, fontWeight: 600, color: '#8a7b6c', lineHeight: 1 })}>
                    <span style={S({ fontSize: 22 })}>{havaIkonu(hava.kod)}</span>
                    <span>{hava.sicaklik}°</span>
                  </div>
                )}
              </div>
              <div style={S({ width: 1, height: 40, background: 'rgba(58,44,34,0.16)' })} />
              <button
                onClick={handleCikis}
                style={S({ padding: '8px 15px', borderRadius: 999, background: 'transparent', border: `1px solid ${CHROME_RENK.warn}66`, color: CHROME_RENK.warn, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 })}
              >
                Çıkış Yap
              </button>
            </div>
            <header className="notya-telefon-ust" style={S({ alignItems: 'center', justifyContent: 'space-between', gap: 12 })}>
                {geri ? (
                  <button
                    type="button"
                    onClick={() => handleNav(geri.yol)}
                    aria-label={`${geri.etiket} sayfasına dön`}
                    style={S({ display: 'flex', alignItems: 'center', gap: 4, minHeight: 44, padding: '0 4px', border: 'none', background: 'transparent', color: CHROME_RENK.pine, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' })}
                  >
                    <span aria-hidden style={S({ fontSize: 26, lineHeight: 1, marginTop: -2 })}>‹</span>
                    {geri.etiket}
                  </button>
                ) : (
                  <div onClick={() => handleNav('/dashboard/doktor')} style={S({ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minHeight: 44 })}>
                    <div style={S({ color: '#6a7563' })}>{LEAF}</div>
                    <div style={S({ fontFamily: CHROME_FONT.serif, fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: CHROME_RENK.ink })}>Notya</div>
                  </div>
                )}
                {geri && (
                  <div onClick={() => handleNav('/dashboard/doktor')} style={S({ fontFamily: CHROME_FONT.serif, fontSize: 18, fontWeight: 500, color: CHROME_RENK.ink, cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' })}>Notya</div>
                )}
              </header>

          <div>{children}</div>

          <div className="notya-alt" style={S({ padding: '20px 0 4px', textAlign: 'center', fontSize: 12, color: 'rgba(58,44,34,0.35)' })}>
            © 2026 Dream Türkiye — Notya AI. Tüm hakları saklıdır / All rights reserved (5846 FSEK · 17 U.S.C.) · KVKK uyumlu · Saat dilimi: Türkiye (TRT)
          </div>
        </div>
        </>
        )}
      </div>

      {menuOpen && (
        <>
          <button type="button" className="notya-telefon-perde" aria-label="Menüyü kapat" onClick={() => setMenuOpen(false)} style={S({ position: 'fixed', inset: 0, zIndex: 32, border: 'none', background: 'rgba(58,44,34,0.32)', padding: 0 })} />
          <div className="notya-telefon-menu" role="dialog" aria-label="Menü" style={S({
            position: 'fixed', left: 12, right: 12, zIndex: 36, flexDirection: 'column',
            bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
            maxHeight: 'min(70dvh, 520px)', overflowY: 'auto',
            background: CHROME_RENK.paper, border: `1px solid ${CHROME_RENK.border}`, borderRadius: 18,
            padding: '14px 12px', boxShadow: '0 12px 32px rgba(58,44,34,0.16)',
          })}>
            {menuItems.filter((i) => i.grup === 'asistan').map((i) => navRow(i, true))}
            <div style={S({ display: 'flex', flexDirection: 'column', gap: 2 })}>
              {menuItems.filter((i) => i.grup !== 'asistan').map((i) => navRow(i))}
            </div>
            <div style={S({ borderTop: `1px solid ${CHROME_RENK.border}`, marginTop: 12, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' })}>
              <BransDegistir mobil />
              <button
                type="button"
                onClick={handleCikis}
                style={S({ padding: '9px 15px', minHeight: 44, borderRadius: 999, background: 'transparent', border: `1px solid ${CHROME_RENK.warn}66`, color: CHROME_RENK.warn, fontSize: 13, fontWeight: 700, cursor: 'pointer' })}
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </>
      )}

      <div className="notya-alt-nav" role="navigation" aria-label="Ana menü" style={S({
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 38,
        background: CHROME_RENK.paper, borderTop: `1px solid ${CHROME_RENK.border}`,
        padding: '4px env(safe-area-inset-right, 0px) calc(4px + env(safe-area-inset-bottom, 0px)) env(safe-area-inset-left, 0px)',
        justifyContent: 'space-around', alignItems: 'stretch',
      })}>
        {sekmeItems.map((item) => {
          const aktif = sekmeAktif(item.route, pathname);
          const rozet = item.route === '/dashboard/doktor/mesajlar' ? mesajUnread : 0;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNav(item.route)}
              aria-current={aktif ? 'page' : undefined}
              style={S({
                flex: '1 1 0', minWidth: 0, minHeight: 48, border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                color: aktif ? CHROME_RENK.pine : '#8a7b6c', fontFamily: 'inherit', fontSize: 10, fontWeight: aktif ? 700 : 600,
                padding: '4px 2px',
              })}
            >
              <span style={S({ position: 'relative', display: 'flex', width: 24, height: 22, alignItems: 'center', justifyContent: 'center' })}>
                {NAV_ICON[item.route]}
                {rozet > 0 && (
                  <span style={S({
                    position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
                    background: CHROME_RENK.warn, color: '#FAF8F4', fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  })}>
                    {rozet > 9 ? '9+' : rozet}
                  </span>
                )}
              </span>
              <span style={S({ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-current={menuAktif ? 'page' : undefined}
          style={S({
            flex: '1 1 0', minWidth: 0, minHeight: 48, border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            color: menuAktif ? CHROME_RENK.pine : '#8a7b6c', fontFamily: 'inherit', fontSize: 10, fontWeight: menuAktif ? 700 : 600,
            padding: '4px 2px',
          })}
        >
          <span style={S({ position: 'relative', display: 'flex', width: 24, height: 22, alignItems: 'center', justifyContent: 'center' })}>
            {MENU_IKON}
            {gelenSayi > 0 && (
              <span style={S({
                position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
                background: CHROME_RENK.warn, color: '#FAF8F4', fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              })}>
                {gelenSayi > 9 ? '9+' : gelenSayi}
              </span>
            )}
          </span>
          <span>Menü</span>
        </button>
      </div>
    </div>
    </ChromeKompaktContext.Provider>
    </ChromeGizleContext.Provider>
  );
}
