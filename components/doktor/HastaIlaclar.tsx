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
import type { GruplanmisIlac, SunumSecenegi } from '@/app/api/doktor/ilac-ara/route';

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
  barkod?: string | null;
  kutu_adedi?: number | null;
}

const SIKLIK = ['1x1', '2x1', '3x1', '4x1', 'Günde 1', 'Haftada 1', 'Gerektiğinde'];

/**
 * NOTYA-ILAC-04: Supabase stores the session under a PROJECT-SCOPED key —
 * `sb-<projectref>-auth-token` — not under the literal string 'auth-token'. The first version of
 * this component read the literal key, found nothing, and sent `Bearer null`; the API answered 401
 * and the tab showed "İlaç listesi alınamadı." on a perfectly healthy database.
 *
 * The rest of the app already resolves the key by searching localStorage, so this now matches it
 * instead of inventing its own convention. The literal key is kept as a fallback because the signup
 * flow writes it directly after registration.
 */
function token(): string | null {
  try {
    const key = Object.keys(localStorage).find((k) => k.includes('auth-token'));
    const raw = key ? localStorage.getItem(key) : localStorage.getItem('auth-token');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Supabase has used both shapes across versions: the session at the root, or nested.
    return parsed?.access_token || parsed?.currentSession?.access_token || null;
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
  const [sonuclar, setSonuclar] = useState<GruplanmisIlac[]>([]);
  const [araniyor, setAraniyor] = useState(false);
  const [secili, setSecili] = useState<GruplanmisIlac | null>(null);
  const [sunum, setSunum] = useState<SunumSecenegi | null>(null);
  const [kutuAdedi, setKutuAdedi] = useState(1);
  const [ad, setAd] = useState('');
  const [etkenMadde, setEtkenMadde] = useState('');
  const [doz, setDoz] = useState('');
  const [siklik, setSiklik] = useState('2x1');
  const [baslangic, setBaslangic] = useState(() => new Date().toISOString().slice(0, 10));
  const [notlar, setNotlar] = useState('');

  // Debounced: a doctor types faster than a round trip, and one request per keystroke would both
  // hammer the endpoint and deliver results out of order.
  useEffect(() => {
    const q = arama.trim();
    if (q.length < 2) { setSonuclar([]); return; }
    let iptal = false;
    const zaman = setTimeout(async () => {
      setAraniyor(true);
      try {
        const t = token();
        if (!t) return;
        const r = await fetch(`/api/doktor/ilac-ara?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${t}` } });
        if (!r.ok || iptal) return;
        const d = await r.json();
        if (!iptal) setSonuclar(d.sonuclar || []);
      } catch {
        if (!iptal) setSonuclar([]);
      } finally {
        if (!iptal) setAraniyor(false);
      }
    }, 220);
    return () => { iptal = true; clearTimeout(zaman); };
  }, [arama]);

  async function listele() {
    setYukleniyor(true);
    setHata('');
    try {
      const t = token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const r = await fetch(`/api/doktor/ilaclar?hastaId=${patientId}`, { headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) {
        // Distinguish an expired session from a real failure: telling a doctor "list could not be
        // retrieved" when the fix is "log in again" sends them looking for a fault that is not there.
        const j = await r.json().catch(() => ({} as { error?: string }));
        setHata(r.status === 401
          ? 'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.'
          : j.error || 'İlaç listesi alınamadı.');
        return;
      }
      const d = await r.json();
      setIlaclar(Array.isArray(d) ? d : d.ilaclar || d.data || []);
    } catch {
      setHata('İlaç listesi alınamadı. Bağlantınızı kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => { listele(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [patientId]);

  /**
   * NOTYA-ILAC-02: fill in the brand the doctor ACTUALLY SEARCHED FOR.
   *
   * The first version filled brand[0], so searching "Largopen" and selecting the result put
   * "Amoksina" in the name field — the first brand in that drug's list, not the one just typed.
   * The doctor sees a different medicine than the one they picked, which reads as the selection
   * being broken, and worse, silently records the wrong brand name on the patient.
   *
   * The searched term wins when it matches a brand; otherwise the generic name is used, since
   * arbitrarily choosing someone else's brand is never what was meant.
   */
  function ilacSec(g: GruplanmisIlac) {
    setSecili(g);
    setEtkenMadde(g.etkenMadde || '');
    setArama('');
    setSonuclar([]);
    // One presentation means there is nothing to choose — pick it rather than making the doctor
    // confirm the obvious.
    if (g.sunumlar.length === 1) sunumSec(g.sunumlar[0], g);
    else { setSunum(null); setAd(g.marka); }
  }

  /**
   * NOTYA-ILAC-05: the presentation carries the BARCODE, and the barcode is what e-reçete records.
   * "LARGOPEN 500 MG" alone is ambiguous across five packs (1 g tablet, three suspensions, 500 mg
   * tablet), so the pack is not a detail — it is the thing being prescribed.
   */
  function sunumSec(su: SunumSecenegi, g?: GruplanmisIlac) {
    setSunum(su);
    setAd(su.ad);
    const kaynak = g || secili;
    if (kaynak?.etkenMadde) setEtkenMadde(kaynak.etkenMadde);
    // SGK writes strength into the product name; lift it into the dose field as a starting point.
    const m = su.ad.match(/(\d+[.,]?\d*\s?(?:MG|G|ML|MCG|IU)(?:\s?\/\s?\d+\s?ML)?)/i);
    if (m && !doz) setDoz(m[1].trim());
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
          barkod: sunum?.barkod || null,
          kutu_adedi: kutuAdedi,
          notlar: notlar.trim() || null,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setHata(j.error || 'İlaç eklenemedi. Lütfen tekrar deneyin.');
        return;
      }
      setAd(''); setEtkenMadde(''); setDoz(''); setNotlar(''); setSecili(null); setSunum(null); setKutuAdedi(1); setSiklik('2x1');
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
          {araniyor && <p className="ni-hint">Aranıyor…</p>}
          {sonuclar.length > 0 && (
            <div className="ni-results">
              {sonuclar.map((g) => (
                <button type="button" key={g.marka} className="ni-result" onClick={() => ilacSec(g)}>
                  <span className="ni-result-name">{g.marka}</span>
                  <span className="ni-result-brand">
                    {g.etkenMadde ? g.etkenMadde + ' · ' : ''}
                    {g.sunumlar.length === 1 ? g.sunumlar[0].ad : `${g.sunumlar.length} farklı sunum`}
                  </span>
                  <span className={g.sgk ? 'ni-sgk ni-sgk-on' : 'ni-sgk ni-sgk-off'}>
                    {g.sgk ? 'SGK ödüyor' : 'SGK ödemiyor'}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!araniyor && arama.trim().length >= 2 && sonuclar.length === 0 && (
            <p className="ni-hint">Listede yok — aşağıya elle yazabilirsiniz.</p>
          )}
        </div>

        {/* NOTYA-ILAC-05: presentation picker. SGK lists each pack as its own product with its own
            barcode, and e-reçete records THAT barcode — so the pack is the thing being prescribed,
            not a detail. Shown only when there is a real choice to make. */}
        {secili && secili.sunumlar.length > 1 && (
          <div className="ni-field">
            <label className="ni-label">Sunum / ambalaj * <span className="ni-hint-inline">({secili.marka} için {secili.sunumlar.length} seçenek)</span></label>
            <select
              className="ni-input"
              value={sunum?.barkod || ''}
              onChange={(e) => {
                const su = secili.sunumlar.find((x) => x.barkod === e.target.value);
                if (su) sunumSec(su);
              }}
            >
              <option value="">— Sunum seçin —</option>
              {secili.sunumlar.map((su) => (
                <option key={su.barkod} value={su.barkod}>{su.ad}</option>
              ))}
            </select>
          </div>
        )}

        {sunum?.barkod && (
          <div className="ni-barkod">Barkod: <strong>{sunum.barkod}</strong> · e-reçetede bu ürün kaydedilir</div>
        )}

        {secili && !secili.sgk && <div className="ni-warn">Bu ürün SGK tarafından ödenmiyor.</div>}

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
            <label className="ni-label">Kutu adedi</label>
            <input
              className="ni-input"
              type="number"
              min={1}
              max={12}
              inputMode="numeric"
              value={kutuAdedi}
              onChange={(e) => setKutuAdedi(Math.max(1, Number(e.target.value) || 1))}
            />
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
                {[i.etken_madde, i.doz, i.kullanim_sikli, i.kutu_adedi ? `${i.kutu_adedi} kutu` : ''].filter(Boolean).join(' · ')}
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
