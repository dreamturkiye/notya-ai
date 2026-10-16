'use client';

/**
 * NOTYA-ASI-ONAM-01 — Dijital Aşı Onam Sistemi, muayene (İnceleme) ekranına gömülü panel.
 * Pediatri'ye ÖZEL: bu bileşeni mount eden ekran `asiOnamBransUygunMu(note.bransKapsami.brans)`
 * ile aynı kapıdan geçmelidir — kapı burada TEKRAR kontrol edilmez (BRANS-ALAN-SIZMASI: tab
 * düğmesi ve içerik mount'u aynı kapıdan geçmeli; mount noktası = kapı burada).
 *
 * Üç akış:
 *  1. Klinikte (varsayılan) — aşı seç → içerik gösterilir → "Okudum, kabul ediyorum" / "Kabul
 *     etmiyorum" → kayıt anında ve değişmez biçimde oluşur.
 *  2. Uzaktan (isteğe bağlı) — e-posta / WhatsApp bildirimiyle veya doğrudan Sağlığım'dan; veli
 *     Sağlığım'da onaylar/reddeder, klinik ekranı burada "beklemede" olarak görür.
 *  3. Kağıt (yedek) — imzalı kağıdın taraması/fotoğrafı yüklenir, kayıt aynı anda oluşur.
 *
 * İçerik asla modelden gelmez — lib/asi/onam/asiOnamIcerigi.ts statik veridir (pure import, sunucu
 * çağrısı gerekmez).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { ASI_ONAM_ICERIGI_ADLARI } from '@/lib/asi/onam/asiOnamIcerigi';
import { asiOnamIcerigiGoster } from '@/lib/asi/onam/asiOnamMotoru';
import { DosyaSecDugmesi } from '@/components/core/DosyaSecDugmesi';

interface AsiOnamKaydi {
  id: string;
  asilar: string[];
  yontem: string;
  durum: 'alindi' | 'reddedildi';
  created_at: string;
  session_id: string | null;
}
interface AsiOnamTalep { id: string; asilar: string[]; bildirim_kanali: string; created_at: string }

const YONTEM_ETIKETI: Record<string, string> = {
  klinik: 'Klinikte',
  'uzaktan-eposta': 'Uzaktan (e-posta)',
  'uzaktan-whatsapp': 'Uzaktan (WhatsApp)',
  'uzaktan-portal': 'Uzaktan (Sağlığım)',
  kagit: 'Kağıt form',
};

const kutu: React.CSSProperties = { background: '#FBF8F2', border: '1px solid rgba(58,44,34,0.14)', borderRadius: 10, padding: 12 };
const girisAlani: React.CSSProperties = { width: '100%', background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.16)', color: '#3b2e24', borderRadius: 8, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box' };
const birincil: React.CSSProperties = { background: CHROME_RENK.pine, color: 'white', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const ikincil: React.CSSProperties = { background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(58,44,34,0.16)', borderRadius: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer' };

export default function AsiOnamPaneli({ patientId, sessionId }: { patientId: string; sessionId: string | null }) {
  const [kayitlar, setKayitlar] = useState<AsiOnamKaydi[]>([]);
  const [bekleyenTalepler, setBekleyenTalepler] = useState<AsiOnamTalep[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [secilenAsilar, setSecilenAsilar] = useState<string[]>([]);
  const [onayEdenAd, setOnayEdenAd] = useState('');
  const [onayEdenYakinlik, setOnayEdenYakinlik] = useState('Anne');
  const [onayEdenTelefon, setOnayEdenTelefon] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [uzaktanAcik, setUzaktanAcik] = useState(false);
  const [uzaktanKanal, setUzaktanKanal] = useState<'eposta' | 'whatsapp'>('whatsapp');
  const [kagitAcik, setKagitAcik] = useState(false);
  const [kagitDosya, setKagitDosya] = useState<File | null>(null);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const t = await ensureDoctorAccessToken();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      const r = await fetch(`/api/doktor/asi-onam?patientId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Yüklenemedi.'); return; }
      setKayitlar(j.kayitlar || []);
      setBekleyenTalepler(j.bekleyenTalepler || []);
    } catch { setHata('Yüklenemedi.'); }
    finally { setYukleniyor(false); }
  }, [patientId]);

  useEffect(() => { void yukle(); }, [yukle]);

  const buMuayeneninOnami = sessionId ? kayitlar.find((k) => k.session_id === sessionId && k.durum === 'alindi') : null;

  function asiSecimiDegis(ad: string) {
    setSecilenAsilar((s) => s.includes(ad) ? s.filter((x) => x !== ad) : [...s, ad]);
  }

  async function klinikteOnayla(durum: 'alindi' | 'reddedildi') {
    if (!secilenAsilar.length) { setHata('En az bir aşı seçin.'); return; }
    if (!onayEdenAd.trim()) { setHata('Onayı veren kişinin (veli/yasal temsilci) adını yazın.'); return; }
    setGonderiliyor(true);
    setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      const r = await fetch('/api/doktor/asi-onam', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId, sessionId, asilar: secilenAsilar, durum,
          onayEden: { ad: onayEdenAd.trim(), yakinlik: onayEdenYakinlik, telefon: onayEdenTelefon.trim() || null },
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Kaydedilemedi.'); return; }
      setSecilenAsilar([]);
      void yukle();
    } catch { setHata('Kaydedilemedi.'); }
    finally { setGonderiliyor(false); }
  }

  async function uzaktanTalepGonder() {
    if (!secilenAsilar.length) { setHata('En az bir aşı seçin.'); return; }
    setGonderiliyor(true);
    setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      const r = await fetch('/api/doktor/asi-onam/talep', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, sessionId, asilar: secilenAsilar, bildirimKanali: uzaktanKanal }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Talep gönderilemedi.'); return; }
      setUzaktanAcik(false);
      setSecilenAsilar([]);
      void yukle();
    } catch { setHata('Talep gönderilemedi.'); }
    finally { setGonderiliyor(false); }
  }

  async function kagitYukle() {
    if (!secilenAsilar.length) { setHata('En az bir aşı seçin.'); return; }
    if (!kagitDosya) { setHata('İmzalı kağıdın taraması/fotoğrafı zorunludur.'); return; }
    if (!onayEdenAd.trim()) { setHata('Onayı veren kişinin adını yazın.'); return; }
    setGonderiliyor(true);
    setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      const fd = new FormData();
      fd.append('file', kagitDosya);
      fd.append('patientId', patientId);
      if (sessionId) fd.append('sessionId', sessionId);
      fd.append('asiAdlari', JSON.stringify(secilenAsilar)); // NOTYA-ASI-NOT-01: see kagit/route.ts
      fd.append('onayEdenAdi', onayEdenAd.trim());
      fd.append('onayEdenYakinlik', onayEdenYakinlik);
      if (onayEdenTelefon.trim()) fd.append('onayEdenTelefon', onayEdenTelefon.trim());
      const r = await fetch('/api/doktor/asi-onam/kagit', { method: 'POST', headers: { Authorization: `Bearer ${t}` }, body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Yüklenemedi.'); return; }
      setKagitAcik(false);
      setKagitDosya(null);
      setSecilenAsilar([]);
      void yukle();
    } catch { setHata('Yüklenemedi.'); }
    finally { setGonderiliyor(false); }
  }

  const yazdirHref = secilenAsilar.length
    ? `/dashboard/doktor/asi-onam/yazdir?patientId=${encodeURIComponent(patientId)}&asiAdlari=${encodeURIComponent(secilenAsilar.join('|'))}`
    : null;

  if (yukleniyor) return <div style={{ fontSize: 12.5, color: CHROME_RENK.muted }}>Aşı onamı yükleniyor…</div>;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {buMuayeneninOnami ? (
        <div style={{ background: '#E4F3F1', border: `1px solid ${CHROME_RENK.pine}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: CHROME_RENK.pine }}>
          ✓ Aşı onamı alındı · {buMuayeneninOnami.asilar.join(', ')} · {new Date(buMuayeneninOnami.created_at).toLocaleString('tr-TR')}
        </div>
      ) : null}

      {bekleyenTalepler.length > 0 && (
        <div style={{ background: '#FBF3DE', border: '1px solid rgba(180,131,47,0.35)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, color: '#8a6420' }}>
          Uzaktan onam beklemede: {bekleyenTalepler.map((t) => t.asilar.join(', ')).join(' · ')}
        </div>
      )}

      {hata && <div role="alert" style={{ fontSize: 12.5, color: CHROME_RENK.warn }}>{hata}</div>}

      <div style={kutu}>
        <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, marginBottom: 6 }}>Bugün planlanan aşılar</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {ASI_ONAM_ICERIGI_ADLARI.map((ad) => {
            const secili = secilenAsilar.includes(ad);
            return (
              <button key={ad} type="button" onClick={() => asiSecimiDegis(ad)}
                style={{ fontSize: 12, padding: '5px 10px', borderRadius: 999, border: secili ? `1px solid ${CHROME_RENK.pine}` : '1px solid rgba(58,44,34,0.16)', background: secili ? '#E4F3F1' : '#FFFFFF', color: secili ? CHROME_RENK.pine : CHROME_RENK.ink, cursor: 'pointer' }}>
                {ad}
              </button>
            );
          })}
        </div>

        {secilenAsilar.length > 0 && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
            {secilenAsilar.map((ad) => {
              const g = asiOnamIcerigiGoster(ad);
              if (!g) return null;
              return (
                <div key={ad} style={{ background: '#FFFFFF', border: '1px solid rgba(58,44,34,0.12)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{g.ad}</div>
                  <div style={{ fontSize: 12.5, color: CHROME_RENK.ink }}>{g.korur}</div>
                  <div style={{ fontSize: 11.5, color: CHROME_RENK.muted }}>Sık yan etkiler: {g.yanEtkiler.join(', ')}</div>
                </div>
              );
            })}
            <div style={{ fontSize: 12, color: CHROME_RENK.muted, fontStyle: 'italic' }}>{asiOnamIcerigiGoster(secilenAsilar[0])?.onamCumlesi}</div>
          </div>
        )}

        <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
          <input value={onayEdenAd} onChange={(e) => setOnayEdenAd(e.target.value)} placeholder="Onayı veren (veli/yasal temsilci) adı soyadı" style={girisAlani} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={onayEdenYakinlik} onChange={(e) => setOnayEdenYakinlik(e.target.value)} style={{ ...girisAlani, flex: '0 0 140px' }}>
              {['Anne', 'Baba', 'Vasi', 'Kendisi', 'Diğer'].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <input value={onayEdenTelefon} onChange={(e) => setOnayEdenTelefon(e.target.value)} placeholder="Telefon (isteğe bağlı)" style={girisAlani} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" disabled={gonderiliyor} onClick={() => void klinikteOnayla('alindi')} style={birincil}>Okudum, kabul ediyorum</button>
          <button type="button" disabled={gonderiliyor} onClick={() => void klinikteOnayla('reddedildi')} style={ikincil}>Kabul etmiyorum</button>
          {yazdirHref && <a href={yazdirHref} target="_blank" rel="noopener noreferrer" style={{ ...ikincil, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Yazdır / PDF</a>}
          <button type="button" onClick={() => setUzaktanAcik((v) => !v)} style={ikincil}>Uzaktan onam isteği gönder</button>
          <button type="button" onClick={() => setKagitAcik((v) => !v)} style={ikincil}>Kağıt onam yükle</button>
        </div>

        {uzaktanAcik && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={uzaktanKanal} onChange={(e) => setUzaktanKanal(e.target.value as 'eposta' | 'whatsapp')} style={{ ...girisAlani, flex: '0 0 160px' }}>
              <option value="whatsapp">WhatsApp (kendi numaranız)</option>
              <option value="eposta">E-posta</option>
            </select>
            <button type="button" disabled={gonderiliyor} onClick={() => void uzaktanTalepGonder()} style={birincil}>Gönder</button>
            <span style={{ fontSize: 11.5, color: CHROME_RENK.muted }}>Veli, Sağlığım’dan aynı içeriği görüp onaylar/reddeder.</span>
          </div>
        )}

        {kagitAcik && (
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <DosyaSecDugmesi dosya={kagitDosya} onSec={setKagitDosya} accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" etiket="İmzalı formu seç (fotoğraf/PDF)" />
            <div>
              <button type="button" disabled={gonderiliyor} onClick={() => void kagitYukle()} style={birincil}>İmzalı kağıdı yükle ve kaydet</button>
            </div>
          </div>
        )}
      </div>

      {kayitlar.length > 0 && (
        <details style={{ fontSize: 12.5, color: CHROME_RENK.muted }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Geçmiş aşı onam kayıtları ({kayitlar.length})</summary>
          <div style={{ marginTop: 6, display: 'grid', gap: 4 }}>
            {kayitlar.map((k) => (
              <div key={k.id}>
                {k.asilar.join(', ')} — {k.durum === 'alindi' ? 'Onaylandı' : 'Kabul edilmedi'} · {YONTEM_ETIKETI[k.yontem] || k.yontem} · {new Date(k.created_at).toLocaleString('tr-TR')}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
