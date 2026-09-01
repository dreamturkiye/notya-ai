'use client';

/**
 * NOTYA-RANDEVU-01 — randevu takvimi: doktor ve sekreter aynı ekranı, aynı veriyi görür.
 *
 * Day view by default, not a month grid — a doctor or secretary between patients on a phone
 * wants "who's next and when", not a calendar to navigate. Every Turkish system researched
 * (Hipokrat, NBYS, Bulut Randevu, Dr.Plazma) puts the day list front and center for exactly
 * this reason; a month/week grid is offered as a secondary view there too, not the default.
 *
 * Booking flow mirrors IlacSecici's two-step pattern (search → pick), reused here for hasta
 * search: type a name, pick from the existing roster, or fall through to a free-text walk-in
 * entry when the patient isn't registered yet.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

export const dynamic = 'force-dynamic';

interface Randevu {
  id: string;
  baslangic: string;
  bitis: string;
  tur: string;
  durum: string;
  notlar: string | null;
  iptalNedeni: string | null;
  patientId: string | null;
  hastaAdi: string;
  hastaTelefon: string;
  kayitliHasta: boolean;
}

interface HastaAramaSonucu {
  id: string;
  name: string;
}

const TUR_ETIKET: Record<string, string> = {
  ilk_muayene: 'İlk Muayene',
  muayene: 'Muayene',
  kontrol: 'Kontrol',
  diger: 'Diğer',
};

const DURUM_ETIKET: Record<string, { label: string; color: string; bg: string }> = {
  planlandi: { label: 'Planlandı', color: '#0F9B8E', bg: 'rgba(15,155,142,0.15)' },
  onaylandi: { label: 'Onaylandı', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  tamamlandi: { label: 'Tamamlandı', color: '#64748B', bg: 'rgba(100,116,139,0.15)' },
  iptal: { label: 'İptal', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  gelmedi: { label: 'Gelmedi', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
};

function gunBaslangicBitis(tarih: Date): { baslangic: string; bitis: string } {
  const b = new Date(tarih); b.setHours(0, 0, 0, 0);
  const s = new Date(tarih); s.setHours(23, 59, 59, 999);
  return { baslangic: b.toISOString(), bitis: s.toISOString() };
}

function saatStr(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function tarihBaslikStr(tarih: Date): string {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const secilen = new Date(tarih); secilen.setHours(0, 0, 0, 0);
  const fark = Math.round((secilen.getTime() - bugun.getTime()) / 86400000);
  const temel = tarih.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  if (fark === 0) return `Bugün · ${temel}`;
  if (fark === 1) return `Yarın · ${temel}`;
  if (fark === -1) return `Dün · ${temel}`;
  return temel;
}

function tarihInputStr(tarih: Date): string {
  return tarih.toISOString().slice(0, 10);
}

export default function RandevularPage() {
  const [gun, setGun] = useState(() => new Date());
  const [randevular, setRandevular] = useState<Randevu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [rol, setRol] = useState<'doktor' | 'sekreter' | null>(null);

  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [saat, setSaat] = useState('09:00');
  const [sureDk, setSureDk] = useState(20);
  const [tur, setTur] = useState('muayene');
  const [notlar, setNotlar] = useState('');

  const [hastaArama, setHastaArama] = useState('');
  const [hastaSonuclari, setHastaSonuclari] = useState<HastaAramaSonucu[]>([]);
  const [seciliHasta, setSeciliHasta] = useState<HastaAramaSonucu | null>(null);
  const [serbestAd, setSerbestAd] = useState('');
  const [serbestTelefon, setSerbestTelefon] = useState('');

  const [kaydediliyor, setKaydediyor] = useState(false);
  const [iptalId, setIptalId] = useState<string | null>(null);
  const [iptalNedeni, setIptalNedeni] = useState('');

  const token = ensureDoctorAccessToken;

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const { baslangic, bitis } = gunBaslangicBitis(gun);
      const r = await fetch(`/api/doktor/randevular?baslangic=${encodeURIComponent(baslangic)}&bitis=${encodeURIComponent(bitis)}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!r.ok) { setHata('Randevular alınamadı.'); return; }
      const d = await r.json();
      setRandevular(d.randevular || []);
    } catch {
      setHata('Randevular alınamadı. Bağlantınızı kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  }, [gun]);

  useEffect(() => { yukle(); }, [yukle]);

  useEffect(() => {
    (async () => {
      const t = await token();
      if (!t) return;
      try {
        const r = await fetch('/api/personel/me', { headers: { Authorization: `Bearer ${t}` } });
        if (r.ok) { const d = await r.json(); setRol(d.rol); }
      } catch { /* nav still works without this */ }
    })();
  }, []);

  // Hasta search, debounced — reuses /api/doktor/hastalar (client-side filter, roster is small).
  const [tumHastalar, setTumHastalar] = useState<{ id: string; name: string }[] | null>(null);
  useEffect(() => {
    const q = hastaArama.trim();
    if (q.length < 1) { setHastaSonuclari([]); return; }
    let iptal = false;
    (async () => {
      try {
        let liste = tumHastalar;
        if (!liste) {
          const t = await token();
          if (!t) return;
          const r = await fetch('/api/doktor/hastalar', { headers: { Authorization: `Bearer ${t}` } });
          const d = await r.json();
          liste = (d.patients || []).map((p: any) => ({ id: p.id, name: p.name }));
          if (!iptal) setTumHastalar(liste);
        }
        const qNorm = q.toLocaleLowerCase('tr-TR');
        const sonuc = (liste || []).filter((p) => p.name.toLocaleLowerCase('tr-TR').includes(qNorm)).slice(0, 8);
        if (!iptal) setHastaSonuclari(sonuc);
      } catch { if (!iptal) setHastaSonuclari([]); }
    })();
    return () => { iptal = true; };
  }, [hastaArama, tumHastalar]);

  function formuSifirla() {
    setDuzenlenenId(null);
    setSaat('09:00');
    setSureDk(20);
    setTur('muayene');
    setNotlar('');
    setHastaArama('');
    setHastaSonuclari([]);
    setSeciliHasta(null);
    setSerbestAd('');
    setSerbestTelefon('');
  }

  function duzenlemeyeAc(rv: Randevu) {
    setDuzenlenenId(rv.id);
    setSaat(saatStr(rv.baslangic));
    setSureDk(Math.round((new Date(rv.bitis).getTime() - new Date(rv.baslangic).getTime()) / 60000));
    setTur(rv.tur);
    setNotlar(rv.notlar || '');
    if (rv.kayitliHasta && rv.patientId) {
      setSeciliHasta({ id: rv.patientId, name: rv.hastaAdi });
      setSerbestAd(''); setSerbestTelefon('');
    } else {
      setSeciliHasta(null);
      setSerbestAd(rv.hastaAdi); setSerbestTelefon(rv.hastaTelefon);
    }
    setHastaArama('');
    setFormAcik(true);
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!seciliHasta && !serbestAd.trim()) {
      setHata('Kayıtlı hasta seçin veya hasta adı girin.');
      return;
    }
    setKaydediyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }

      const [saatH, saatM] = saat.split(':').map(Number);
      const baslangicTarihi = new Date(gun);
      baslangicTarihi.setHours(saatH, saatM, 0, 0);
      const bitisTarihi = new Date(baslangicTarihi.getTime() + sureDk * 60000);

      const govde = {
        patientId: seciliHasta?.id || null,
        hastaAdiSerbest: seciliHasta ? null : serbestAd.trim(),
        hastaTelefonSerbest: seciliHasta ? null : serbestTelefon.trim(),
        baslangic: baslangicTarihi.toISOString(),
        bitis: bitisTarihi.toISOString(),
        tur,
        notlar: notlar.trim() || null,
      };

      const url = duzenlenenId ? `/api/doktor/randevular/${duzenlenenId}` : '/api/doktor/randevular';
      const yontem = duzenlenenId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method: yontem,
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(govde),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setHata(j.error || 'Randevu kaydedilemedi.');
        return;
      }
      formuSifirla();
      setFormAcik(false);
      await yukle();
    } catch {
      setHata('Randevu kaydedilemedi. Bağlantınızı kontrol edin.');
    } finally {
      setKaydediyor(false);
    }
  }

  async function durumDegistir(id: string, durum: string, neden?: string) {
    try {
      const t = await token();
      if (!t) return;
      await fetch(`/api/doktor/randevular/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ durum, iptalNedeni: neden }),
      });
      await yukle();
    } catch { /* toast-free: yukle() re-fetch will reflect actual state either way */ }
  }

  async function sil(id: string) {
    if (!confirm('Bu randevuyu tamamen silmek istiyor musunuz? (Gerçek bir iptal için "İptal Et" kullanın.)')) return;
    try {
      const t = await token();
      if (!t) return;
      await fetch(`/api/doktor/randevular/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      await yukle();
    } catch { /* ignore */ }
  }

  const siraliRandevular = useMemo(
    () => [...randevular].sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime()),
    [randevular]
  );

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <h1 style={{ fontSize: 26, margin: 0 }}>Randevular</h1>
          {rol === 'sekreter' && (
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(15,155,142,0.2)', color: '#0F9B8E' }}>
              Sekreter olarak bağlısınız
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setGun((g) => new Date(g.getTime() - 86400000))}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', borderRadius: 8, width: 36, height: 36, cursor: 'pointer' }}
          >‹</button>
          <input
            type="date"
            value={tarihInputStr(gun)}
            onChange={(e) => { if (e.target.value) setGun(new Date(e.target.value + 'T00:00:00')); }}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '8px 10px', fontSize: 14 }}
          />
          <button
            type="button"
            onClick={() => setGun((g) => new Date(g.getTime() + 86400000))}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', borderRadius: 8, width: 36, height: 36, cursor: 'pointer' }}
          >›</button>
          <button
            type="button"
            onClick={() => setGun(new Date())}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94A3B8', borderRadius: 8, padding: '0 12px', height: 36, cursor: 'pointer', fontSize: 13 }}
          >Bugün</button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => { formuSifirla(); setFormAcik(true); }}
            className="ni-btn"
            style={{ width: 'auto', padding: '0 16px', height: 36 }}
          >+ Randevu</button>
        </div>

        <div style={{ color: '#94A3B8', fontSize: 14, marginBottom: 12 }}>{tarihBaslikStr(gun)}</div>

        {hata && <div className="ni-error" style={{ marginBottom: 12 }}>{hata}</div>}

        {yukleniyor && <p style={{ color: '#94A3B8' }}>Yükleniyor…</p>}
        {!yukleniyor && siraliRandevular.length === 0 && (
          <p style={{ color: '#94A3B8' }}>Bu güne ait randevu yok.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {siraliRandevular.map((rv) => {
            const durumBilgi = DURUM_ETIKET[rv.durum] || DURUM_ETIKET.planlandi;
            const gecmis = new Date(rv.bitis) < new Date();
            return (
              <div
                key={rv.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: 14,
                  opacity: rv.durum === 'iptal' ? 0.55 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{saatStr(rv.baslangic)} – {saatStr(rv.bitis)}</div>
                    <div style={{ fontSize: 15, marginTop: 2 }}>{rv.hastaAdi}{!rv.kayitliHasta && <span style={{ fontSize: 11, color: '#F59E0B', marginLeft: 6 }}>kayıtsız</span>}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{TUR_ETIKET[rv.tur] || rv.tur}{rv.hastaTelefon ? ` · ${rv.hastaTelefon}` : ''}</div>
                    {rv.notlar && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{rv.notlar}</div>}
                    {rv.durum === 'iptal' && rv.iptalNedeni && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>İptal: {rv.iptalNedeni}</div>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, color: durumBilgi.color, background: durumBilgi.bg, whiteSpace: 'nowrap' }}>
                    {durumBilgi.label}
                  </span>
                </div>

                {rv.durum !== 'iptal' && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    <button type="button" onClick={() => duzenlemeyeAc(rv)} style={aksiyonBtn}>Yeniden Planla</button>
                    {rv.durum === 'planlandi' && (
                      <button type="button" onClick={() => durumDegistir(rv.id, 'onaylandi')} style={aksiyonBtn}>Onayla</button>
                    )}
                    {gecmis && rv.durum !== 'tamamlandi' && rv.durum !== 'gelmedi' && (
                      <>
                        <button type="button" onClick={() => durumDegistir(rv.id, 'tamamlandi')} style={aksiyonBtn}>Tamamlandı</button>
                        <button type="button" onClick={() => durumDegistir(rv.id, 'gelmedi')} style={{ ...aksiyonBtn, color: '#F59E0B' }}>Gelmedi</button>
                      </>
                    )}
                    <button type="button" onClick={() => setIptalId(rv.id)} style={{ ...aksiyonBtn, color: '#EF4444' }}>İptal Et</button>
                    <button type="button" onClick={() => sil(rv.id)} style={{ ...aksiyonBtn, color: '#64748B' }}>Sil</button>
                  </div>
                )}

                {iptalId === rv.id && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                    <input
                      value={iptalNedeni}
                      onChange={(e) => setIptalNedeni(e.target.value)}
                      placeholder="İptal nedeni (isteğe bağlı)"
                      style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={async () => { await durumDegistir(rv.id, 'iptal', iptalNedeni); setIptalId(null); setIptalNedeni(''); }}
                      style={{ ...aksiyonBtn, background: '#EF4444', color: 'white' }}
                    >Onayla</button>
                    <button type="button" onClick={() => { setIptalId(null); setIptalNedeni(''); }} style={aksiyonBtn}>Vazgeç</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {formAcik && (
          <div
            role="presentation"
            onClick={() => setFormAcik(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}
          >
            <form
              onSubmit={kaydet}
              onClick={(e) => e.stopPropagation()}
              className="ni-card"
              style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', margin: 0 }}
            >
              <h3 className="ni-h3">{duzenlenenId ? 'Randevuyu Düzenle' : 'Yeni Randevu'}</h3>

              <div className="ni-field">
                <label className="ni-label">Hasta ara</label>
                <input
                  className="ni-input"
                  value={hastaArama}
                  onChange={(e) => { setHastaArama(e.target.value); setSeciliHasta(null); }}
                  placeholder="Ad soyad yazın…"
                  autoComplete="off"
                />
                {hastaSonuclari.length > 0 && !seciliHasta && (
                  <div className="ni-results">
                    {hastaSonuclari.map((h) => (
                      <button
                        type="button"
                        key={h.id}
                        className="ni-result"
                        onClick={() => { setSeciliHasta(h); setHastaArama(''); setHastaSonuclari([]); }}
                      >
                        <span className="ni-result-name">{h.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {seciliHasta && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#0F9B8E' }}>
                    Seçildi: {seciliHasta.name}{' '}
                    <button type="button" onClick={() => setSeciliHasta(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', textDecoration: 'underline' }}>değiştir</button>
                  </div>
                )}
                {!seciliHasta && hastaArama.trim().length === 0 && (
                  <p className="ni-hint">Kayıtlı değilse aşağıya isim ve telefon girerek kayıtsız randevu oluşturabilirsiniz.</p>
                )}
              </div>

              {!seciliHasta && (
                <div className="ni-grid">
                  <div className="ni-field">
                    <label className="ni-label">Hasta adı *</label>
                    <input className="ni-input" value={serbestAd} onChange={(e) => setSerbestAd(e.target.value)} placeholder="Ad Soyad" />
                  </div>
                  <div className="ni-field">
                    <label className="ni-label">Telefon</label>
                    <input className="ni-input" value={serbestTelefon} onChange={(e) => setSerbestTelefon(e.target.value)} placeholder="05xx xxx xx xx" />
                  </div>
                </div>
              )}

              <div className="ni-grid">
                <div className="ni-field">
                  <label className="ni-label">Saat *</label>
                  <input className="ni-input" type="time" value={saat} onChange={(e) => setSaat(e.target.value)} />
                </div>
                <div className="ni-field">
                  <label className="ni-label">Süre (dk) *</label>
                  <input className="ni-input" type="number" min={5} step={5} value={sureDk} onChange={(e) => setSureDk(Math.max(5, Number(e.target.value) || 20))} />
                </div>
                <div className="ni-field">
                  <label className="ni-label">Tür</label>
                  <select className="ni-input" value={tur} onChange={(e) => setTur(e.target.value)}>
                    {Object.entries(TUR_ETIKET).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="ni-field">
                  <label className="ni-label">Not</label>
                  <input className="ni-input" value={notlar} onChange={(e) => setNotlar(e.target.value)} placeholder="İsteğe bağlı" />
                </div>
              </div>

              {hata && <div className="ni-error">{hata}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" className="ni-btn" disabled={kaydediliyor} style={{ flex: 1 }}>
                  {kaydediliyor ? 'Kaydediliyor…' : duzenlenenId ? 'Güncelle' : 'Randevuyu Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => { setFormAcik(false); formuSifirla(); }}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', borderRadius: 10, padding: '0 20px' }}
                >Vazgeç</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const aksiyonBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: 'none',
  color: '#CBD5E1',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 12,
  cursor: 'pointer',
};
