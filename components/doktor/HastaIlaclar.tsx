'use client';

/**
 * NOTYA-ILAC-01 — patient medication management, on the patient's own page.
 *
 * The İlaçlar tab existed but rendered a single placeholder line ("İlaç listesi ve yeni ilaç
 * ekleme."), so a doctor looking at a patient could not see or add that patient's medication. The
 * API (/api/doktor/ilaclar) and a Turkish drug database (lib/asistan/turkishDrugs) both already
 * existed; only the surface was missing.
 *
 * Search covers generic name, Turkish brand names and pharmacological category, because a Turkish
 * doctor types "Largopen" far more often than "Amoksisilin". Free text is always accepted: the
 * local database is a convenience, never a gate — a drug that is not in it must still be
 * recordable, otherwise the doctor simply stops using the feature.
 *
 * Layout is mobile-first by construction: a single column that becomes two on wider screens. This
 * page is used on a phone between patients, so a desktop grid squeezed onto 390px is not
 * acceptable. Inputs use 16px font — anything smaller makes iOS Safari zoom on focus, which throws
 * the layout sideways and is the classic reason forms feel broken on iPhone.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { searchDrug, type TürkishDrug } from '@/lib/asistan/turkishDrugs';

interface Ilac {
  id: string;
  ilac_adi: string;
  etken_madde: string | null;
  doz: string | null;
  kullanim_sikli: string | null;
  baslangic_tarihi: string | null;
  bitis_tarihi: string | null;
  aktif: boolean;
  notlar: string | null;
}

const SIKLIK = ['1x1', '2x1', '3x1', '4x1', 'Günde 1', 'Haftada 1', 'Gerektiğinde'];

function token(): string | null {
  try {
    const raw = localStorage.getItem('auth-token');
    return raw ? JSON.parse(raw).access_token : null;
  } catch {
    return null;
  }
}

export default function HastaIlaclar({ patientId }: { patientId: string }) {
  const [ilaclar, setIlaclar] = useState<Ilac[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [kaydediyor, setKaydediyor] = useState(false);

  const [arama, setArama] = useState('');
  const [secili, setSecili] = useState<TürkishDrug | null>(null);
  const [ad, setAd] = useState('');
  const [etkenMadde, setEtkenMadde] = useState('');
  const [doz, setDoz] = useState('');
  const [siklik, setSiklik] = useState('2x1');
  const [baslangic, setBaslangic] = useState(() => new Date().toISOString().slice(0, 10));
  const [notlar, setNotlar] = useState('');

  const sonuclar = useMemo(() => (arama.trim().length < 2 ? [] : searchDrug(arama.trim()).slice(0, 6)), [arama]);

  async function listele() {
    setYukleniyor(true);
    setHata('');
    try {
      const t = token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const r = await fetch(`/api/doktor/ilaclar?hastaId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) { setHata('İlaç listesi alınamadı.'); return; }
      const d = await r.json();
      setIlaclar(Array.isArray(d) ? d : d.ilaclar || d.data || []);
    } catch {
      setHata('İlaç listesi alınamadı. Bağlantınızı kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => { listele(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [patientId]);

  function ilacSec(d: TürkishDrug) {
    setSecili(d);
    setAd(d.brand?.[0] || d.name);
    setEtkenMadde(d.name);
    if (!doz) setDoz(d.dose || '');
    setArama('');
  }

  async function ekle(e: React.FormEvent) {
    e.preventDefault();
    // etkenMadde is required by the API; for a free-text entry the doctor's own text stands in.
    const gonderilecekEtken = etkenMadde.trim() || ad.trim();
    if (!ad.trim() || !doz.trim() || !siklik || !baslangic) {
      setHata('İlaç adı, doz, kullanım sıklığı ve başlangıç tarihi zorunludur.');
      return;
    }
    setKaydediyor(true);
    setHata('');
    try {
      const t = token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const r = await fetch('/api/doktor/ilaclar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hastaId: patientId,
          ad: ad.trim(),
          etkenMadde: gonderilecekEtken,
          doz: doz.trim(),
          kullanim_sikli: siklik,
          baslangic_tarihi: baslangic,
          notlar: notlar.trim() || null,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setHata(j.error || 'İlaç eklenemedi. Lütfen tekrar deneyin.');
        return;
      }
      setAd(''); setEtkenMadde(''); setDoz(''); setNotlar(''); setSecili(null); setSiklik('2x1');
      await listele();
    } catch {
      setHata('İlaç eklenemedi. Bağlantınızı kontrol edin.');
    } finally {
      setKaydediyor(false);
    }
  }

  async function sil(id: string) {
    if (!confirm('Bu ilacı listeden kaldırmak istiyor musunuz?')) return;
    try {
      const t = token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const r = await fetch(`/api/doktor/ilaclar/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) { setHata('İlaç silinemedi.'); return; }
      await listele();
    } catch {
      setHata('İlaç silinemedi. Bağlantınızı kontrol edin.');
    }
  }

  return (
    <div className="ni-wrap">
      <form onSubmit={ekle} className="ni-card">
        <h3 className="ni-h3">Yeni İlaç Ekle</h3>

        <div className="ni-field">
          <label className="ni-label">İlaç ara (ad, marka veya kategori)</label>
          <input
            className="ni-input"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Örn. Largopen, amoksisilin, antibiyotik"
            autoComplete="off"
          />
          {sonuclar.length > 0 && (
            <div className="ni-results">
              {sonuclar.map((d) => (
                <button type="button" key={d.name} className="ni-result" onClick={() => ilacSec(d)}>
                  <span className="ni-result-name">{d.name}</span>
                  {d.brand?.length ? <span className="ni-result-brand">{d.brand.slice(0, 3).join(', ')}</span> : null}
                  <span className={d.sgkCovered ? 'ni-sgk ni-sgk-on' : 'ni-sgk ni-sgk-off'}>
                    {d.sgkCovered ? 'SGK ödüyor' : 'SGK ödemiyor'}
                  </span>
                </button>
              ))}
            </div>
          )}
          {arama.trim().length >= 2 && sonuclar.length === 0 && (
            <p className="ni-hint">Listede yok — aşağıya elle yazabilirsiniz.</p>
          )}
        </div>

        {secili?.sgkRestriction && <div className="ni-warn">SGK kısıtlaması: {secili.sgkRestriction}</div>}

        <div className="ni-grid">
          <div className="ni-field">
            <label className="ni-label">İlaç adı *</label>
            <input className="ni-input" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Largopen 500 mg" />
          </div>
          <div className="ni-field">
            <label className="ni-label">Etken madde</label>
            <input className="ni-input" value={etkenMadde} onChange={(e) => setEtkenMadde(e.target.value)} placeholder="Amoksisilin" />
          </div>
          <div className="ni-field">
            <label className="ni-label">Doz *</label>
            <input className="ni-input" value={doz} onChange={(e) => setDoz(e.target.value)} placeholder="500 mg" />
          </div>
          <div className="ni-field">
            <label className="ni-label">Kullanım sıklığı *</label>
            <select className="ni-input" value={siklik} onChange={(e) => setSiklik(e.target.value)}>
              {SIKLIK.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="ni-field">
            <label className="ni-label">Başlangıç *</label>
            <input className="ni-input" type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} />
          </div>
          <div className="ni-field">
            <label className="ni-label">Not</label>
            <input className="ni-input" value={notlar} onChange={(e) => setNotlar(e.target.value)} placeholder="İsteğe bağlı" />
          </div>
        </div>

        {hata && <div className="ni-error">{hata}</div>}

        <button type="submit" className="ni-btn" disabled={kaydediyor}>
          {kaydediyor ? 'Ekleniyor…' : 'İlacı Ekle'}
        </button>
      </form>

      <div className="ni-card">
        <h3 className="ni-h3">Kullandığı İlaçlar {ilaclar.length > 0 && <span className="ni-count">{ilaclar.length}</span>}</h3>
        {yukleniyor && <p className="ni-hint">İlaçlar yükleniyor…</p>}
        {!yukleniyor && ilaclar.length === 0 && <p className="ni-hint">Bu hasta için kayıtlı ilaç yok.</p>}
        {!yukleniyor && ilaclar.map((i) => (
          <div key={i.id} className="ni-item">
            <div className="ni-item-main">
              <div className="ni-item-name">{i.ilac_adi}</div>
              <div className="ni-item-meta">
                {[i.etken_madde, i.doz, i.kullanim_sikli].filter(Boolean).join(' · ')}
              </div>
              {i.baslangic_tarihi && (
                <div className="ni-item-date">
                  Başlangıç: {new Date(i.baslangic_tarihi).toLocaleDateString('tr-TR')}
                  {i.bitis_tarihi ? ` · Bitiş: ${new Date(i.bitis_tarihi).toLocaleDateString('tr-TR')}` : ''}
                </div>
              )}
              {i.notlar && <div className="ni-item-date">{i.notlar}</div>}
            </div>
            <button type="button" className="ni-remove" onClick={() => sil(i.id)} aria-label="İlacı kaldır">Kaldır</button>
          </div>
        ))}
      </div>
    </div>
  );
}
