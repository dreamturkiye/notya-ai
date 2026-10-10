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
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

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
  /** NOTYA-RECETE-01: 'beklemede' = nottan aktarıldı, hekim kararı bekliyor. */
  onay_durumu?: 'beklemede' | 'onayli' | null;
  kaynak_note_id?: string | null;
  /** NOTYA-ILK10-DOZ-01: sunucunun hesapladığı doz güvenliği bayrakları (mg/kg/gün aralık dışı, ürün uyuşmazlığı). */
  doz_guvenligi?: string[] | null;
}

// Öneri listesi — hekim serbest metin de yazabilir (NOTYA-ILAC-SIKLIK-01).
const SIKLIK_ONERI = ['1x1', '2x1', '3x1', '4x1', 'Lüzumlu halde', 'sabah-akşam', 'günde 1', 'günde 2', 'akşam'];

/**
 * NOTYA-ILAC-04 / NOTYA-AUTH-01: the first version of this component read the literal 'auth-token'
 * key, Supabase had stored the session under `sb-<projectref>-auth-token`, and the API got
 * `Bearer null` — "İlaç listesi alınamadı." on a healthy database. The fix was a second private
 * localStorage reader, which was still the wrong shape: the app already had one in
 * lib/doktor/clientAuth that knows every storage layout AND refreshes an expired token. This
 * component now uses it like every other doctor surface.
 */
const token = ensureDoctorAccessToken;

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
  const [siklik, setSiklik] = useState('');
  const [baslangic, setBaslangic] = useState(() => new Date().toISOString().slice(0, 10));
  const [notlar, setNotlar] = useState('');
  const [dozOnerisi, setDozOnerisi] = useState<{ doz: string; kullanim: string; aciklama: string } | null>(null);
  const [dozOneriYukleniyor, setDozOneriYukleniyor] = useState(false);
  const [dozOneriNot, setDozOneriNot] = useState('');
  // NOTYA-ILAC-DUZEN-01: mevcut satırı doğrudan revize et.
  const [duzenId, setDuzenId] = useState<string | null>(null);
  const [duzen, setDuzen] = useState({ ad: '', etkenMadde: '', doz: '', siklik: '', baslangic: '', notlar: '' });
  const [duzenKaydediyor, setDuzenKaydediyor] = useState(false);

  // Debounced: a doctor types faster than a round trip, and one request per keystroke would both
  // hammer the endpoint and deliver results out of order.
  useEffect(() => {
    const q = arama.trim();
    if (q.length < 1) { setSonuclar([]); return; }
    let iptal = false;
    const zaman = setTimeout(async () => {
      setAraniyor(true);
      try {
        const t = await token();
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

  async function dozOneriIste(ilacAdi: string, etken: string) {
    setDozOnerisi(null);
    setDozOneriNot('');
    if (!patientId || (!ilacAdi && !etken)) return;
    setDozOneriYukleniyor(true);
    try {
      const t = await token();
      const r = await fetch('/api/doktor/ilaclar/doz-oner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ patientId, ilacAdi, etkenMadde: etken }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.oneri && (d.oneri.doz || d.oneri.kullanim)) {
        setDozOnerisi(d.oneri);
      } else if (d.neden) {
        setDozOneriNot(d.neden);
      }
    } catch {
      // sessiz — öneri isteğe bağlıdır, doktor elle yazabilir
    } finally {
      setDozOneriYukleniyor(false);
    }
  }

  async function listele() {
    setYukleniyor(true);
    setHata('');
    try {
      const t = await token();
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
    // NOTYA-ILAC-07: the pack's own ingredient wins over the brand's. Same brand name can hide
    // different molecules across packs (A-FERİN with and without kodein); the pack is what is
    // prescribed, so the pack's ingredient is what is recorded.
    const kaynak = g || secili;
    const etken = su.etkenMadde || kaynak?.etkenMadde;
    if (etken) setEtkenMadde(etken);
    // SGK writes strength into the product name; lift it into the dose field as a starting point.
    const m = su.ad.match(/(\d+[.,]?\d*\s?(?:MG|G|ML|MCG|IU)(?:\s?\/\s?\d+\s?ML)?)/i);
    if (m && !doz) setDoz(m[1].trim());
    // NOTYA-DOZ-ONER-01: ilaç seçilince AI'dan kilo/yaşa göre doz önerisi iste (yalnız öneri).
    void dozOneriIste(su.ad, etken || '');
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
      const t = await token();
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

  /**
   * NOTYA-RECETE-01: nottan aktarılan reçete için hekim kararı.
   *
   * Aktarılan satır hastaya GÖRÜNMEZ; burada karar verilene kadar portalda
   * çıkmaz. "Kullanmaya devam ediyor" → onaylı + aktif. "Kür bitti" → onaylı +
   * pasif + bitiş tarihi. Kür bitip bitmediği tahmin edilmez, çünkü biten bir
   * antibiyotiği aylar sonra "Aktif" göstermek zararlı olur.
   */
  async function receteKarar(id: string, karar: 'aktif' | 'bitti') {
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const r = await fetch(`/api/doktor/ilaclar/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(
          karar === 'aktif'
            ? { onay_durumu: 'onayli', aktif: true }
            : { onay_durumu: 'onayli', aktif: false, bitis_tarihi: new Date().toISOString().slice(0, 10) }
        ),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as { error?: string }));
        setHata(j.error || 'Reçete kararı kaydedilemedi.');
        return;
      }
      await listele();
    } catch {
      setHata('Reçete kararı kaydedilemedi. Bağlantınızı kontrol edin.');
    }
  }

  async function sil(id: string) {
    if (!confirm('Bu ilacı listeden kaldırmak istiyor musunuz?')) return;
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const r = await fetch(`/api/doktor/ilaclar/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) { setHata('İlaç silinemedi.'); return; }
      if (duzenId === id) setDuzenId(null);
      await listele();
    } catch {
      setHata('İlaç silinemedi. Bağlantınızı kontrol edin.');
    }
  }

  function duzenAc(i: Ilac) {
    setDuzenId(i.id);
    setDuzen({
      ad: i.ilac_adi || '',
      etkenMadde: i.etken_madde || '',
      doz: i.doz || '',
      siklik: i.kullanim_sikli || '',
      baslangic: (i.baslangic_tarihi || '').slice(0, 10),
      notlar: i.notlar || '',
    });
    setHata('');
  }

  async function duzenKaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!duzenId) return;
    if (!duzen.ad.trim() || !duzen.doz.trim() || !duzen.siklik.trim()) {
      setHata('İlaç adı, doz ve kullanım sıklığı zorunludur.');
      return;
    }
    setDuzenKaydediyor(true);
    setHata('');
    try {
      const t = await token();
      if (!t) { setHata('Oturum bulunamadı. Lütfen tekrar giriş yapın.'); return; }
      const r = await fetch(`/api/doktor/ilaclar/${duzenId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad: duzen.ad.trim(),
          etkenMadde: duzen.etkenMadde.trim() || duzen.ad.trim(),
          doz: duzen.doz.trim(),
          kullanim_sikli: duzen.siklik.trim(),
          baslangic_tarihi: duzen.baslangic || undefined,
          notlar: duzen.notlar.trim() || null,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as { error?: string }));
        setHata(j.error || 'İlaç güncellenemedi.');
        return;
      }
      setDuzenId(null);
      await listele();
    } catch {
      setHata('İlaç güncellenemedi. Bağlantınızı kontrol edin.');
    } finally {
      setDuzenKaydediyor(false);
    }
  }

  const bekleyen = useMemo(() => ilaclar.filter((i) => i.onay_durumu === 'beklemede'), [ilaclar]);
  const onayli = useMemo(() => ilaclar.filter((i) => i.onay_durumu !== 'beklemede'), [ilaclar]);

  return (
    <div className="ni-wrap">
      {/* NOTYA-RECETE-01: nottan aktarılan reçetelerin onay kuyruğu. Karar
          verilmeden hastanın portalında görünmezler. */}
      {bekleyen.length > 0 && (
        <div className="ni-card ni-pending-card">
          <h3 className="ni-h3">
            Nottan gelen reçeteler <span className="ni-count">{bekleyen.length}</span>
          </h3>
          <p className="ni-pending-note">
            Bu ilaçlar muayene notundan aktarıldı. <strong>Siz karar verene kadar hastanın
            portalında görünmezler.</strong> Hasta hâlâ kullanıyorsa “Kullanıyor”, kür bittiyse
            “Kürü bitti” seçin.
          </p>
          {bekleyen.map((i) => (
            <div key={i.id} className="ni-item ni-item-pending">
              <div className="ni-item-main">
                <div className="ni-item-name">{i.ilac_adi}</div>
                <div className="ni-item-meta">
                  {[i.etken_madde, i.doz, i.kullanim_sikli].filter(Boolean).join(' · ')}
                </div>
                {i.baslangic_tarihi && (
                  <div className="ni-item-date">
                    Reçete tarihi: {new Date(i.baslangic_tarihi).toLocaleDateString('tr-TR')}
                  </div>
                )}
                {i.notlar && <div className="ni-item-date">{i.notlar}</div>}
              </div>
              <div className="ni-pending-actions">
                <button type="button" className="ni-btn-yes" onClick={() => receteKarar(i.id, 'aktif')}>
                  Kullanıyor
                </button>
                <button type="button" className="ni-btn-no" onClick={() => receteKarar(i.id, 'bitti')}>
                  Kürü bitti
                </button>
                <button type="button" className="ni-remove" onClick={() => sil(i.id)} aria-label="Reçeteyi kaldır">
                  Kaldır
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                    {g.ruhsatAskida ? ' · RUHSAT ASKIDA' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!araniyor && arama.trim().length >= 1 && sonuclar.length === 0 && (
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
                <option key={su.barkod} value={su.barkod}>{su.ad}{su.sgk === false ? ' — SGK ödemiyor' : ''}{su.ruhsatAskida ? ' — RUHSAT ASKIDA' : ''}</option>
              ))}
            </select>
          </div>
        )}

        {sunum?.barkod && (
          <div className="ni-barkod">Barkod: <strong>{sunum.barkod}</strong> · e-reçetede bu ürün kaydedilir</div>
        )}

        {/* NOTYA-SUT-RAPOR-01i: reimbursement is per PACK. A brand can have paid packs and a pack that is passive on
            SGK's list or no longer on it (SUT 4.1.9(1)); the warning follows the chosen pack. */}
        {((secili && !secili.sgk) || sunum?.sgk === false) && <div className="ni-warn">Bu ürün SGK tarafından ödenmiyor.</div>}

        {/* NOTYA-ILAC-09: 62 SGK-reimbursed products have a suspended TİTCK licence (madde-22/23) —
            among them fentanyl. The flag rides the PACK (barcode), so the warning fires on the
            chosen sunum, exactly where the prescription decision is made. */}
        {sunum?.ruhsatAskida && (
          <div className="ni-warn">
            Bu ürünün TİTCK ruhsatı <strong>askıda</strong>. Reçete etmeden önce güncel ruhsat durumunu kontrol edin.
          </div>
        )}

        {dozOneriYukleniyor && (<div style={{ margin: '4px 0 10px', padding: '8px 12px', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 10, fontSize: 13, color: CHROME_RENK.muted }}>Ayşe doz önerisi hazırlıyor…</div>)}
        {!dozOneriYukleniyor && dozOnerisi && (dozOnerisi.doz || dozOnerisi.kullanim) && (<div style={{ margin: '4px 0 10px', padding: '10px 12px', background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 10 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Ayşe’nin doz önerisi <span style={{ fontWeight: 400, color: '#8b7d70' }}>(öneridir — doz kararı hekimindir)</span></div><div style={{ fontSize: 13, color: '#334155', marginBottom: 8 }}><strong>{dozOnerisi.doz || '—'}</strong>{dozOnerisi.kullanim ? ` · ${dozOnerisi.kullanim}` : ''}{dozOnerisi.aciklama ? <span style={{ color: CHROME_RENK.muted }}> — {dozOnerisi.aciklama}</span> : null}</div><button type="button" onClick={() => { if (dozOnerisi.doz) setDoz(dozOnerisi.doz); if (dozOnerisi.kullanim) setSiklik(dozOnerisi.kullanim); setDozOnerisi(null); }} style={{ background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Öneriyi kullan</button></div>)}
        {!dozOneriYukleniyor && dozOneriNot && (<div style={{ margin: '4px 0 10px', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, fontSize: 12.5, color: '#92700A' }}>{dozOneriNot}</div>)}
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
            <label className="ni-label">Kullanım sıklığı * <span style={{ fontWeight: 400, color: '#8b7d70' }}>(serbest metin)</span></label>
            <input
              className="ni-input"
              list="ni-siklik-onerileri"
              value={siklik}
              onChange={(e) => setSiklik(e.target.value)}
              placeholder="Örn. 2x1, sabah-akşam, lüzumlu halde"
              autoComplete="off"
            />
            <datalist id="ni-siklik-onerileri">
              {SIKLIK_ONERI.map((s) => <option key={s} value={s} />)}
            </datalist>
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
        <h3 className="ni-h3">Kullandığı İlaçlar {onayli.length > 0 && <span className="ni-count">{onayli.length}</span>}</h3>
        {yukleniyor && <p className="ni-hint">İlaçlar yükleniyor…</p>}
        {!yukleniyor && onayli.length === 0 && <p className="ni-hint">Bu hasta için kayıtlı ilaç yok.</p>}
        {!yukleniyor && onayli.map((i) => (
          <div key={i.id} className="ni-item">
            {duzenId === i.id ? (
              <form onSubmit={duzenKaydet} style={{ width: '100%' }}>
                <div className="ni-grid">
                  <div className="ni-field">
                    <label className="ni-label">İlaç adı *</label>
                    <input className="ni-input" value={duzen.ad} onChange={(e) => setDuzen((d) => ({ ...d, ad: e.target.value }))} />
                  </div>
                  <div className="ni-field">
                    <label className="ni-label">Etken madde</label>
                    <input className="ni-input" value={duzen.etkenMadde} onChange={(e) => setDuzen((d) => ({ ...d, etkenMadde: e.target.value }))} />
                  </div>
                  <div className="ni-field">
                    <label className="ni-label">Doz *</label>
                    <input className="ni-input" value={duzen.doz} onChange={(e) => setDuzen((d) => ({ ...d, doz: e.target.value }))} />
                  </div>
                  <div className="ni-field">
                    <label className="ni-label">Kullanım sıklığı *</label>
                    <input
                      className="ni-input"
                      list="ni-siklik-onerileri-duzen"
                      value={duzen.siklik}
                      onChange={(e) => setDuzen((d) => ({ ...d, siklik: e.target.value }))}
                      placeholder="Serbest metin"
                      autoComplete="off"
                    />
                    <datalist id="ni-siklik-onerileri-duzen">
                      {SIKLIK_ONERI.map((s) => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                  <div className="ni-field">
                    <label className="ni-label">Başlangıç</label>
                    <input className="ni-input" type="date" value={duzen.baslangic} onChange={(e) => setDuzen((d) => ({ ...d, baslangic: e.target.value }))} />
                  </div>
                  <div className="ni-field">
                    <label className="ni-label">Not</label>
                    <input className="ni-input" value={duzen.notlar} onChange={(e) => setDuzen((d) => ({ ...d, notlar: e.target.value }))} />
                  </div>
                </div>
                <div className="ni-pending-actions" style={{ marginTop: 10 }}>
                  <button type="submit" className="ni-btn-yes" disabled={duzenKaydediyor}>{duzenKaydediyor ? 'Kaydediliyor…' : 'Kaydet'}</button>
                  <button type="button" className="ni-btn-no" onClick={() => setDuzenId(null)}>Vazgeç</button>
                </div>
              </form>
            ) : (
              <>
                <div className="ni-item-main">
                  <div className="ni-item-name">
                    {i.ilac_adi}
                    {!i.aktif && <span className="ni-tag-passive">Sonlandırıldı</span>}
                  </div>
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
                  {i.aktif && (i.doz_guvenligi || []).map((m, n) => (
                    <div key={n} role="alert" style={{ marginTop: 6, padding: '8px 10px', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, fontSize: 12.5, lineHeight: 1.45, color: '#991B1B' }}>
                      <strong>⚠ Doz güvenliği:</strong> {m}
                    </div>
                  ))}
                </div>
                <div className="ni-pending-actions">
                  <button type="button" className="ni-btn-yes" onClick={() => duzenAc(i)}>Düzenle</button>
                  {i.aktif ? (
                    <button type="button" className="ni-btn-no" onClick={() => receteKarar(i.id, 'bitti')}>
                      Sonlandır
                    </button>
                  ) : (
                    <button type="button" className="ni-btn-yes" onClick={() => receteKarar(i.id, 'aktif')}>
                      Yeniden aktif
                    </button>
                  )}
                  <button type="button" className="ni-remove" onClick={() => sil(i.id)} aria-label="İlacı kaldır">Kaldır</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
