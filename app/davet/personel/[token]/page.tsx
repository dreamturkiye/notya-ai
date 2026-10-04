'use client';

/** NOTYA-RANDEVU-01 — sekreter davet kabul sayfası. Public — token kendisi kimlik doğrulamadır. */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CHROME_RENK, CHROME_FONT, CHROME_FONT_HREF } from "@/lib/doktor/chromeTheme";

export const dynamic = 'force-dynamic';

export default function DavetKabulPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || '');

  const [durum, setDurum] = useState<'yukleniyor' | 'gecerli' | 'gecersiz' | 'tamamlandi'>('yukleniyor');
  const [bilgi, setBilgi] = useState<{ adSoyad: string; email: string; doktorAdi: string } | null>(null);
  const [hataMesaji, setHataMesaji] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [formHata, setFormHata] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`/api/personel/davet/${encodeURIComponent(token)}`);
        const d = await r.json();
        if (!r.ok) { setHataMesaji(d.error || 'Davet bulunamadı.'); setDurum('gecersiz'); return; }
        setBilgi(d);
        setDurum('gecerli');
      } catch {
        setHataMesaji('Davet doğrulanamadı. Bağlantınızı kontrol edin.');
        setDurum('gecersiz');
      }
    })();
  }, [token]);

  // Safari üst çubuğu kök layout'un koyu theme-color'ını kullanmasın — cream + light.
  useEffect(() => {
    const krem = CHROME_RENK.cream
    const metas = document.querySelectorAll('meta[name="theme-color"]')
    const onceki = Array.from(metas).map((m) => (m as HTMLMetaElement).content)
    let eklenen: HTMLMetaElement | null = null
    if (metas.length === 0) {
      eklenen = document.createElement('meta')
      eklenen.name = 'theme-color'
      eklenen.content = krem
      document.head.appendChild(eklenen)
    } else {
      metas.forEach((m) => { (m as HTMLMetaElement).content = krem })
    }
    let scheme = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement | null
    const oncekiScheme = scheme?.content ?? null
    let schemeEklendi = false
    if (!scheme) {
      scheme = document.createElement('meta')
      scheme.name = 'color-scheme'
      document.head.appendChild(scheme)
      schemeEklendi = true
    }
    scheme.content = 'light'
    const html = document.documentElement
    const body = document.body
    const oncekiHtml = html.style.background
    const oncekiBody = body.style.background
    const oncekiColorScheme = html.style.colorScheme
    html.style.background = krem
    body.style.background = krem
    html.style.colorScheme = 'light'
    return () => {
      if (eklenen) eklenen.remove()
      else metas.forEach((m, i) => { (m as HTMLMetaElement).content = onceki[i] || '#0A1628' })
      if (scheme) {
        if (schemeEklendi) scheme.remove()
        else if (oncekiScheme != null) scheme.content = oncekiScheme
      }
      html.style.background = oncekiHtml
      body.style.background = oncekiBody
      html.style.colorScheme = oncekiColorScheme
    }
  }, []);

  async function kabulEt(e: React.FormEvent) {
    e.preventDefault();
    setFormHata('');
    if (sifre.length < 8) { setFormHata('Şifre en az 8 karakter olmalıdır.'); return; }
    if (sifre !== sifreTekrar) { setFormHata('Şifreler eşleşmiyor.'); return; }
    setGonderiliyor(true);
    try {
      const r = await fetch('/api/personel/kabul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, sifre }),
      });
      const d = await r.json();
      if (!r.ok) { setFormHata(d.error || 'Hesap oluşturulamadı.'); return; }
      setDurum('tamamlandi');
      setTimeout(() => router.push('/giris/doktor'), 2000);
    } catch {
      setFormHata('Hesap oluşturulamadı. Bağlantınızı kontrol edin.');
    } finally {
      setGonderiliyor(false);
    }
  }

  // NOTYA-DAVET-GORUNUM-01 (Kaan, 2026-10-04): secretary invite page uses the same cream/pine look as the login page.
  const R = CHROME_RENK;
  const inp: React.CSSProperties = { width: "100%", background: R.paper, border: "1px solid " + R.border, borderRadius: 12, padding: "12px 14px", color: R.ink, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: CHROME_FONT.sans };
  const etiket: React.CSSProperties = { fontSize: 13, color: R.muted, marginBottom: 6, display: "block", fontWeight: 600, letterSpacing: 0.2 };
  const baslik: React.CSSProperties = { fontFamily: CHROME_FONT.serif, fontSize: 22, fontWeight: 560, color: R.ink, margin: "0 0 12px" };
  const hata: React.CSSProperties = { background: "rgba(164,91,62,0.08)", border: "1px solid rgba(164,91,62,0.25)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: R.warn, marginBottom: 14 };
  const btn: React.CSSProperties = { width: "100%", padding: 14, background: gonderiliyor ? "rgba(47,67,52,0.35)" : R.pine, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 600, cursor: gonderiliyor ? "not-allowed" : "pointer", fontFamily: CHROME_FONT.sans, letterSpacing: 0.2 };

  return (
    <div style={{ minHeight: "100dvh", background: R.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CHROME_FONT.sans, color: R.ink, padding: "calc(20px + env(safe-area-inset-top, 0px)) 16px calc(20px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CHROME_FONT_HREF} />
      <div style={{ background: R.paper, borderRadius: 24, padding: "clamp(28px, 6vw, 44px)", width: "100%", maxWidth: 420, boxSizing: "border-box", border: "1px solid " + R.border, boxShadow: "0 18px 50px rgba(58,44,34,0.08)" }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 30, fontWeight: 560, letterSpacing: -0.5, color: R.pine, lineHeight: 1.1, textAlign: "center", marginBottom: 22 }}>Notya</div>
        {durum === 'yukleniyor' && <p style={{ color: R.muted, margin: 0 }}>Davet kontrol ediliyor…</p>}

        {durum === 'gecersiz' && (
          <>
            <h3 style={baslik}>Davet Kullanılamıyor</h3>
            <div style={hata}>{hataMesaji}</div>
          </>
        )}

        {durum === 'gecerli' && bilgi && (
          <>
            <h3 style={baslik}>Sekreter Daveti</h3>
            <p style={{ fontSize: 14, color: R.ink, lineHeight: 1.55, marginBottom: 16 }}>
              Merhaba <strong>{bilgi.adSoyad}</strong>, <strong>{bilgi.doktorAdi || "Doktorunuz"}</strong> sizi Notya üzerinde sekreter olarak
              çalışmaya davet etti. Randevuları görüp yönetebileceksiniz. Devam etmek için bir şifre belirleyin.
            </p>
            <form onSubmit={kabulEt}>
              <div style={{ marginBottom: 14 }}>
                <label style={etiket}>E-posta</label>
                <input style={inp} value={bilgi.email} disabled />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={etiket}>Şifre *</label>
                <input style={inp} type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} placeholder="En az 8 karakter" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={etiket}>Şifre (tekrar) *</label>
                <input style={inp} type="password" value={sifreTekrar} onChange={(e) => setSifreTekrar(e.target.value)} />
              </div>
              {formHata && <div style={hata}>{formHata}</div>}
              <button type="submit" style={btn} disabled={gonderiliyor}>
                {gonderiliyor ? 'Hesap oluşturuluyor…' : 'Hesabı Oluştur'}
              </button>
            </form>
          </>
        )}

        {durum === 'tamamlandi' && (
          <>
            <h3 style={baslik}>Hesabınız Hazır ✓</h3>
            <p style={{ fontSize: 14, color: R.ink, lineHeight: 1.55 }}>Giriş sayfasına yönlendiriliyorsunuz…</p>
          </>
        )}
      </div>
    </div>
  );
}
