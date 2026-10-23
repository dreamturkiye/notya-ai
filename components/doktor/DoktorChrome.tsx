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

import { TELEFON_DOKUNMA_CSS } from '@/lib/doktor/telefonStil';
import React, { useEffect, useState, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDoctorAccessToken, ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { hekimProfilOturumOku, hekimProfilOturumSil, hekimProfilOturumYaz, hekimProfilTazeleBasligi, hekimProfilTazeleBitti } from '@/lib/doktor/hekimProfilIstemci';
import { hekimUnvanli } from '@/lib/doktor/hekimAdi';
import BransDegistir from './BransDegistir';
import GelenBelgeBirak from './gelenBelgeler/GelenBelgeBirak';
import { GELEN_OLAY, GELEN_SAYI_OLAY } from '@/lib/gelenBelgeler/istemci';
import { CHROME_RENK, CHROME_FONT, saatTRT } from '@/lib/doktor/chromeTheme';
import { KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI } from '@/lib/doktor/specialties';
import KullanimIzle from './KullanimIzle';
import KabukGorunumu, { type KabukOge } from './KabukGorunumu';
import { SAAT_DILIMI_CEREZ, tarayiciSaatDilimi } from '@/lib/doktor/selam';
import { izinVarMi, ROL_KISA_ETIKETI_TR, ROL_ONBURO_ETIKETI_TR, type PratikRol, type Yetki } from '@/lib/doktor/personelYetki';

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
  /** Ön büro: yalnız sekreter menüsünde (doktor Araçlar › Konsültasyonlar’dan açar). */
  sadeceSekreter?: boolean;
  /** NOTYA-GELEN-BELGELER: shown to a secretary only when the doctor opened access (server decides). */
  gelenBelge?: boolean;
  /** MOBIL-PERSONEL-01: capability a NEW staff role (asistan / hasta_danismani) needs to see this item. No yetki = hidden for them. */
  yetki?: Yetki;
}

// Kept in lockstep with the pre-Sidebar-B dock's navItems -- same routes, same sadeceDoktor gating.
// "grup" decides which sidebar section an item lands in; 'asistan' is pulled out as its own
// highlighted row rather than grouped with the rest.
const navItems: (NavItem & { grup: 'asistan' | 'calisma' | 'diger' })[] = [
  { label: 'Asistan', route: '/asistan', sadeceDoktor: true, grup: 'asistan' },
  // NOTYA-SEKRETER-01: Ana Sayfa sekreterde Ön büro masası (SekreterMasa); doktor klinik ana sayfa.
  { label: 'Ana Sayfa', route: '/dashboard/doktor', yetki: 'hesap.kendi', grup: 'calisma' },
  { label: 'Randevular', route: '/dashboard/doktor/randevular', yetki: 'randevu.gor', grup: 'calisma' },
  { label: 'Hastalar', route: '/dashboard/doktor/hastalar', yetki: 'hasta.liste', grup: 'calisma' },
  { label: 'Mesajlar', route: '/dashboard/doktor/mesajlar', yetki: 'mesaj', grup: 'calisma' },
  { label: 'Gelen Belgeler', route: '/dashboard/doktor/gelen-belgeler', gelenBelge: true, grup: 'calisma' },
  // KONSULTASYONLAR-02: sekreter ofis saatleri / telefon notlarını defterden görür ve günceller.
  { label: 'Konsültan defteri', route: '/doktor-tools/konsultasyonlar', sadeceSekreter: true, grup: 'calisma' },
  { label: 'Raporlar', route: '/dashboard/doktor/raporlar', sadeceDoktor: true, grup: 'diger' },
  { label: 'e-Nabız', route: '/doktor-tools/enabiz', grup: 'diger' },
  { label: 'Araçlar', route: '/doktor-tools', sadeceDoktor: true, grup: 'diger' },
  { label: 'Ayarlar', route: '/dashboard/doktor/ayarlar', sadeceDoktor: true, grup: 'diger' },
];

/** Which icon (components/doktor/KabukGorunumu.tsx) each route of the sidebar shows. */
const NAV_IKON_ANAHTARI: Record<string, string> = {
  '/asistan': 'asistan',
  '/dashboard/doktor': 'anaSayfa',
  '/dashboard/doktor/randevular': 'randevular',
  '/dashboard/doktor/hastalar': 'hastalar',
  '/dashboard/doktor/mesajlar': 'mesajlar',
  '/dashboard/doktor/gelen-belgeler': 'gelenBelgeler',
  '/dashboard/doktor/raporlar': 'raporlar',
  '/doktor-tools/enabiz': 'belge',
  '/doktor-tools': 'araclar',
  '/dashboard/doktor/ayarlar': 'ayarlar',
};

/** Phone tab bar. Four daily destinations; everything else opens from Menü. Desktop keeps the sidebar. */
const SEKME_YOLLARI = [
  '/dashboard/doktor',
  '/dashboard/doktor/randevular',
  '/dashboard/doktor/hastalar',
  '/dashboard/doktor/mesajlar',
] as const;

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

export default function DoktorChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [rol, setRol] = useState<PratikRol>('doktor');
  const [doktorAdi, setDoktorAdi] = useState('');
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
    // NOTYA-SELAM-SAAT-01: saat ve selam doktorun bulunduğu yerin dilimiyle; dilim çereze yazılır, sunucu selamları okur.
    const tz = tarayiciSaatDilimi();
    try { document.cookie = `${SAAT_DILIMI_CEREZ}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`; } catch { /* yok */ }
    setSaat(saatTRT(new Date(), tz));
    const t = setInterval(() => setSaat(saatTRT(new Date(), tz)), 30000);
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
    const onbellek = hekimProfilOturumOku()
    const tazele = hekimProfilTazeleBasligi()
    ;(async () => {
      const t = await ensureDoctorAccessToken();
      if (!t) return;
      let sekreterOturum = false
      try {
        const r = await fetch('/api/personel/me', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        if (r.ok) {
          const d = await r.json();
          if (d.rol && d.rol !== 'doktor') {
            sekreterOturum = true
            setRol(d.rol);
            // NOTYA-SEKRETER-01: kendi adı — Dr. unvanı yok. Doktor önbelleğini kullanma.
            const personelAdi = String(d.personelAdi || d.personelKisaAdi || '').trim();
            if (personelAdi) setAd(personelAdi);
            setDoktorAdi(String(d.doktorAdi || '').trim());
            setBrans('');
          }
        }
      } catch { /* stays doktor */ }
      if (!sekreterOturum) {
        if (onbellek?.full_name) setAd(String(onbellek.full_name))
        if (onbellek?.specialty) setBrans(String(onbellek.specialty))
      }
      try {
        const r = await fetch('/api/doktor/mesajlar/unread-count', { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) { const d = await r.json(); setMesajUnread(Number(d.unreadCount) || 0); }
      } catch { /* badge stays 0 */ }
      if (!sekreterOturum) try {
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}`, ...tazele } });
        if (r.ok) {
          hekimProfilTazeleBitti()
          const d = await r.json();
          const u = d?.data || d;
          setAd(String(u?.full_name || u?.first_name || '').trim());
          setBrans(String(u?.specialty || ''));
          hekimProfilOturumYaz({ specialty: u?.specialty, profession_type: u?.profession_type, full_name: u?.full_name || u?.first_name })
        }
      } catch { /* header just shows less */ }
      // NOTYA-SEKRETER-01: sekreter kendi avatarını; doktor kendi avatarını çeker.
      try {
        const yol = sekreterOturum ? '/api/personel/avatar' : '/api/doktor/profil/avatar';
        const r = await fetch(yol, { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) { const d = await r.json(); if (d?.avatar?.dataUrl) setAvatarUrl(d.avatar.dataUrl); }
      } catch { /* falls back to initials */ }
    })();
  }, []);

  // Hesabım'dan foto yüklenince üst çubuk anında güncellensin.
  useEffect(() => {
    const yenile = (e: Event) => {
      const detail = (e as CustomEvent<{ dataUrl?: string | null }>).detail;
      if (detail && 'dataUrl' in detail) setAvatarUrl(detail.dataUrl || null);
    };
    window.addEventListener('notya-avatar-guncellendi', yenile as EventListener);
    return () => window.removeEventListener('notya-avatar-guncellendi', yenile as EventListener);
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
      hekimProfilOturumSil()
    }
    window.location.href = '/giris/doktor';
  }

  const gorunurItems = navItems.filter((i) => {
    // The unchanged secretary and the doctor keep exactly the old rules; the two new roles see only what their capability allows.
    if (rol === 'asistan' || rol === 'hasta_danismani') return !!i.yetki && !i.sadeceDoktor && izinVarMi(rol, i.yetki);
    return !(i.sadeceDoktor && rol === 'sekreter')
      && !(i.sadeceSekreter && rol !== 'sekreter')
      && !(i.gelenBelge && !gelenErisim);
  });
  const asistanItem = gorunurItems.find((i) => i.grup === 'asistan');
  const calismaItems = gorunurItems.filter((i) => i.grup === 'calisma');
  const digerItems = gorunurItems.filter((i) => i.grup === 'diger');
  const sekmeItems = SEKME_YOLLARI.map((route) => gorunurItems.find((i) => i.route === route)).filter((i): i is NonNullable<typeof i> => Boolean(i));
  const menuItems = gorunurItems.filter((i) => !(SEKME_YOLLARI as readonly string[]).includes(i.route));
  const geri = mobilGeri(pathname);
  const menuAktif = menuOpen || menuItems.some((i) => sekmeAktif(i.route, pathname));

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  const initials = ad.split(' ').filter(Boolean).slice(-2).map((s) => s[0]).join('').toUpperCase() || 'D';

  const oge = (item: NavItem): KabukOge => ({
    id: item.route,
    label: item.label,
    ikon: NAV_IKON_ANAHTARI[item.route],
    aktif: Boolean(pathname === item.route || (item.route !== '/dashboard/doktor' && pathname?.startsWith(item.route))),
    rozet: item.route === '/dashboard/doktor/mesajlar' && mesajUnread > 0 ? mesajUnread : item.route === '/dashboard/doktor/gelen-belgeler' ? gelenSayi : 0,
  });
  const sekmeOge = (item: NavItem): KabukOge => ({ ...oge(item), aktif: sekmeAktif(item.route, pathname), rozet: item.route === '/dashboard/doktor/mesajlar' ? mesajUnread : 0 });
  const asistanOge = (item: NavItem): KabukOge => ({ ...oge(item), label: 'Asistana sor' });

  if (gizli) {
    // Aile / embed modu: sayfa kendi tam ekran deneyimini yönetir -- hiçbir sarmalayıcı yok,
    // yalnız içerik. Görünürlük geri değiştiğinde (useChromeGizle temizlenince) normale döner.
    return (
      <ChromeGizleContext.Provider value={setGizli}>
        {children}
      </ChromeGizleContext.Provider>
    );
  }

  return (
    <ChromeGizleContext.Provider value={setGizli}>
    <ChromeKompaktContext.Provider value={setKompakt}>
    <KullanimIzle />
    {gelenErisim && <GelenBelgeBirak />}
    <KabukGorunumu
      marka="Notya"
      kicker={rol === 'doktor' ? 'DOKTOR' : ROL_ONBURO_ETIKETI_TR[rol]}
      asistan={asistanItem ? asistanOge(asistanItem) : null}
      calisma={calismaItems.length > 0 ? { baslik: 'Çalışma alanı', ogeler: calismaItems.map(oge) } : null}
      diger={digerItems.length > 0 ? { baslik: 'Diğer', ogeler: digerItems.map(oge) } : null}
      onGit={handleNav}
      hesap={{
        harfler: initials,
        avatarUrl,
        ad: ad ? (rol !== 'doktor' ? ad : hekimUnvanli(ad)) : '\u00A0',
        alt: rol !== 'doktor'
          ? (doktorAdi ? `${hekimUnvanli(doktorAdi)} · ${ROL_KISA_ETIKETI_TR[rol].toLowerCase()}` : ROL_KISA_ETIKETI_TR[rol])
          : (BRANS_ETIKET[brans] || '\u00A0'),
        avatarAd: ad,
        avatarBasligi: ad ? `${ad} — profil fotoğrafı` : (rol !== 'doktor' ? 'Profil fotoğrafı' : 'Hesabım'),
        avatarEtiketi: 'Profil fotoğrafını düzenle',
        saat,
        hava,
        cikis: 'Çıkış Yap',
        onHesap: () => handleNav('/dashboard/doktor/hesap'),
        onCikis: handleCikis,
      }}
      yanAlt={<BransDegistir />}
      sekme={sekmeItems.map(sekmeOge)}
      menu={{ asistan: menuItems.filter((i) => i.grup === 'asistan').map(asistanOge), ogeler: menuItems.filter((i) => i.grup !== 'asistan').map(oge) }}
      menuAktif={menuAktif}
      menuRozet={gelenSayi}
      menuAcik={menuOpen}
      onMenu={setMenuOpen}
      menuAlt={<BransDegistir mobil />}
      geri={geri ? { id: geri.yol, etiket: geri.etiket, aria: `${geri.etiket} sayfasına dön` } : null}
      anaSayfaId="/dashboard/doktor"
      menuMetni="Menü"
      menuKapat="Menüyü kapat"
      anaMenu="Ana menü"
      anaSayfa={pathname === '/dashboard/doktor'}
      genis={pathname === '/dashboard/doktor/randevular' || Boolean(pathname?.startsWith('/dashboard/doktor/randevular/'))}
      kompakt={kompakt}
      cssEk={TELEFON_DOKUNMA_CSS}
      bitkiSrc="/doktor-chrome/plant.jpg"
      altYazi="© 2026 Notya AI. Tüm hakları saklıdır / All rights reserved (5846 FSEK · 17 U.S.C.) · KVKK uyumlu · Saat dilimi: Türkiye (TRT)"
    >
      {children}
    </KabukGorunumu>
    </ChromeKompaktContext.Provider>
    </ChromeGizleContext.Provider>
  );
}
