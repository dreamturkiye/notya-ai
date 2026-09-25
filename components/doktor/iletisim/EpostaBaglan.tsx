/**
 * NOTYA-ILETISIM-02 — "E-postalar kendiliğinden gitsin": connect the doctor's own Gmail/Outlook
 * once; reminders then leave from the doctor's own address. Three faces:
 *   not connected → Gmail ile bağlan (primary) + Outlook ile bağlan
 *   connected     → ✓ address · Kendime deneme gönder · Bağlantıyı kaldır
 *   needs renewal → one Yeniden bağlan
 * Until the environment is configured the API answers 503 and this shows a calm Yakında line.
 * Plain Turkish only — no provider jargon on screen.
 */
'use client';
import { useCallback, useEffect, useState } from 'react';
import { CHROME_FONT, CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

type Saglayici = 'google' | 'microsoft';
type Baglanti = { saglayici: Saglayici; adres: string; durum: 'bagli' | 'yenilenmeli' };
type Durum =
  | { tur: 'yukleniyor' }
  | { tur: 'kapali' }
  | { tur: 'hazir'; saglayicilar: Saglayici[]; baglanti: Baglanti | null }
  | { tur: 'hata' };

const AD: Record<Saglayici, string> = { google: 'Gmail', microsoft: 'Outlook' };

const DONUS_MESAJI: Record<string, { metin: string; iyi: boolean }> = {
  baglandi: { metin: 'Bağlandı. Hatırlatmalar artık sizin adresinizden gidecek.', iyi: true },
  vazgecildi: { metin: 'Bağlantı yapılmadı. İstediğiniz zaman yeniden deneyebilirsiniz.', iyi: false },
  'izin-eksik': { metin: 'E-posta gönderme izni verilmedi. Bağlanırken bu izni işaretli bırakın.', iyi: false },
  hata: { metin: 'Bağlanamadı. Lütfen bir kez daha deneyin.', iyi: false },
};

const kart: React.CSSProperties = {
  background: '#FFFFFF',
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 16,
  padding: '18px 18px 16px',
  boxShadow: '0 8px 18px rgba(58,44,34,0.045)',
  color: CHROME_RENK.ink,
  fontFamily: CHROME_FONT.sans,
  maxWidth: 640,
};
const birincil: React.CSSProperties = {
  background: CHROME_RENK.pine,
  color: CHROME_RENK.paper,
  border: 'none',
  borderRadius: 12,
  padding: '12px 18px',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: 44,
};
const ikincil: React.CSSProperties = {
  ...birincil,
  background: 'transparent',
  color: CHROME_RENK.pine,
  border: `1px solid ${CHROME_RENK.pine}`,
};
const kucuk: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '6px 0',
  fontSize: 13,
  color: CHROME_RENK.muted,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
};

async function istek(yol: string, init?: RequestInit): Promise<Response | null> {
  const jeton = await ensureDoctorAccessToken();
  if (!jeton) return null;
  return fetch(yol, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${jeton}` }, cache: 'no-store' });
}

export default function EpostaBaglan() {
  const [durum, setDurum] = useState<Durum>({ tur: 'yukleniyor' });
  const [mesaj, setMesaj] = useState<{ metin: string; iyi: boolean } | null>(null);
  const [mesgul, setMesgul] = useState(false);

  const yukle = useCallback(async () => {
    try {
      const r = await istek('/api/iletisim/eposta');
      if (!r) return setDurum({ tur: 'hata' });
      if (r.status === 503) return setDurum({ tur: 'kapali' });
      if (!r.ok) return setDurum({ tur: 'hata' });
      const v = (await r.json()) as { saglayicilar: Saglayici[]; baglanti: Baglanti | null };
      setDurum({ tur: 'hazir', saglayicilar: v.saglayicilar, baglanti: v.baglanti });
    } catch {
      setDurum({ tur: 'hata' });
    }
  }, []);

  useEffect(() => {
    // Back from Google/Microsoft: show one friendly line, then tidy the address bar.
    const url = new URL(window.location.href);
    const sonuc = url.searchParams.get('eposta');
    if (sonuc && DONUS_MESAJI[sonuc]) setMesaj(DONUS_MESAJI[sonuc]);
    if (sonuc) {
      url.searchParams.delete('eposta');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    yukle();
  }, [yukle]);

  async function baglan(s: Saglayici) {
    setMesgul(true);
    setMesaj(null);
    try {
      const r = await istek(`/api/iletisim/eposta/${s}/baslat`, { method: 'POST' });
      const v = r ? ((await r.json().catch(() => ({}))) as { url?: string; error?: string }) : {};
      if (r?.ok && v.url) {
        window.location.href = v.url;
        return;
      }
      setMesaj({ metin: v.error || 'Şu an bağlanamıyor. Lütfen biraz sonra tekrar deneyin.', iyi: false });
    } catch {
      setMesaj({ metin: 'Şu an bağlanamıyor. Lütfen biraz sonra tekrar deneyin.', iyi: false });
    }
    setMesgul(false);
  }

  async function deneme() {
    setMesgul(true);
    setMesaj(null);
    try {
      const r = await istek('/api/iletisim/eposta/deneme', { method: 'POST' });
      const v = r ? ((await r.json().catch(() => ({}))) as { error?: string; yenilenmeli?: boolean }) : {};
      if (r?.ok) setMesaj({ metin: 'Deneme e-postası gönderildi. Gelen kutunuza bakabilirsiniz.', iyi: true });
      else {
        setMesaj({ metin: v.error || 'Deneme e-postası gönderilemedi.', iyi: false });
        if (v.yenilenmeli) await yukle();
      }
    } catch {
      setMesaj({ metin: 'Deneme e-postası gönderilemedi.', iyi: false });
    }
    setMesgul(false);
  }

  async function kaldir() {
    if (!window.confirm('Bağlantı kaldırılsın mı? Hatırlatmalar bu adresten gitmeyi bırakır.')) return;
    setMesgul(true);
    setMesaj(null);
    try {
      const r = await istek('/api/iletisim/eposta', { method: 'DELETE' });
      if (r?.ok) setMesaj({ metin: 'Bağlantı kaldırıldı.', iyi: true });
      else setMesaj({ metin: 'Bağlantı şu an kaldırılamadı. Lütfen tekrar deneyin.', iyi: false });
    } catch {
      setMesaj({ metin: 'Bağlantı şu an kaldırılamadı. Lütfen tekrar deneyin.', iyi: false });
    }
    await yukle();
    setMesgul(false);
  }

  const baslik = (
    <div style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 19, marginBottom: 4 }}>
      E-postalar kendiliğinden gitsin
    </div>
  );
  const not = mesaj && (
    <p role="status" style={{ fontSize: 13, margin: '12px 0 0', color: mesaj.iyi ? CHROME_RENK.pine : CHROME_RENK.warn }}>
      {mesaj.metin}
    </p>
  );

  if (durum.tur === 'yukleniyor') return null;

  if (durum.tur === 'kapali') {
    return (
      <div style={kart}>
        {baslik}
        <p style={{ fontSize: 14, color: CHROME_RENK.muted, margin: 0 }}>
          Yakında: hatırlatmalar kendi e-posta adresinizden, siz uğraşmadan gidecek.
        </p>
      </div>
    );
  }

  if (durum.tur === 'hata') {
    return (
      <div style={kart}>
        {baslik}
        <p style={{ fontSize: 14, color: CHROME_RENK.muted, margin: '0 0 10px' }}>Bilgiler şu an yüklenemedi.</p>
        <button type="button" style={kucuk} onClick={() => { setDurum({ tur: 'yukleniyor' }); yukle(); }}>
          Tekrar dene
        </button>
      </div>
    );
  }

  const { saglayicilar, baglanti } = durum;

  if (baglanti?.durum === 'yenilenmeli') {
    return (
      <div style={kart}>
        {baslik}
        <p style={{ fontSize: 14, color: CHROME_RENK.muted, margin: '0 0 14px' }}>
          {baglanti.adres} için bağlantının yenilenmesi gerekiyor. Yenilenene kadar e-postalar gitmez.
        </p>
        <button type="button" style={birincil} disabled={mesgul} onClick={() => baglan(baglanti.saglayici)}>
          Yeniden bağlan
        </button>
        {not}
      </div>
    );
  }

  if (baglanti) {
    return (
      <div style={kart}>
        {baslik}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, margin: '6px 0 4px', wordBreak: 'break-all' }}>
          <span aria-hidden style={{ color: CHROME_RENK.pine, fontWeight: 700 }}>✓</span>
          <span style={{ fontWeight: 600 }}>{baglanti.adres}</span>
        </div>
        <p style={{ fontSize: 13, color: CHROME_RENK.muted, margin: '0 0 8px' }}>
          Hatırlatmalar bu adresten gider, gönderilenler klasörünüzde görünür; yanıtlar size gelir.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px' }}>
          <button type="button" style={kucuk} disabled={mesgul} onClick={deneme}>
            Kendime deneme gönder
          </button>
          <button type="button" style={kucuk} disabled={mesgul} onClick={kaldir}>
            Bağlantıyı kaldır
          </button>
        </div>
        {not}
      </div>
    );
  }

  return (
    <div style={kart}>
      {baslik}
      <p style={{ fontSize: 14, color: CHROME_RENK.muted, margin: '0 0 14px', lineHeight: 1.45 }}>
        Hatırlatmalar kendi adresinizden gider, yanıtlar kendi gelen kutunuza düşer. Notya yalnızca
        gönderir; e-postalarınızı okuyamaz.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {saglayicilar.map((s, i) => (
          <button key={s} type="button" style={i === 0 ? birincil : ikincil} disabled={mesgul} onClick={() => baglan(s)}>
            {AD[s]} ile bağlan
          </button>
        ))}
      </div>
      {not}
    </div>
  );
}
