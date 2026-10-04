'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import IlacSecici from '@/components/doktor/IlacSecici';
import {
  getAccessToken, getAccessTokenAsync,
  normalizeHastalar,
  toolsShell,
  toolsCard,
  toolsInput,
  toolsLabel,
  toolsPrimaryBtn,
  toolsErrorBox,
  type HastaOption,
} from '@/lib/doktor/toolsUi';
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme';

interface Ilac {
  id: string;
  ad: string;
  etkenMadde: string;
  doz: string;
  kullanim: string;
  baslangic: string;
  bitis: string;
  notlar: string;
  aktif: boolean;
}

interface NewIlac {
  ad: string;
  etkenMadde: string;
  doz: string;
  kullanim: string;
  baslangic: string;
  bitis: string;
  notlar: string;
}

// Öneri — hekim serbest metin yazabilir (NOTYA-ILAC-SIKLIK-01).
const KULLANIM_ONERI = [
  { value: '1x1', label: '1x1' },
  { value: '2x1', label: '2x1' },
  { value: '3x1', label: '3x1' },
  { value: '4x1', label: '4x1' },
  { value: 'Lüzumlu halde', label: 'Lüzumlu halde' },
  { value: 'Gunluk', label: 'Günlük' },
  { value: '2xGun', label: 'Günde 2 kez' },
  { value: '3xGun', label: 'Günde 3 kez' },
  { value: 'Haftalik', label: 'Haftalık' },
  { value: 'Aylik', label: 'Aylık' },
];

const KULLANIM_ETIKET: Record<string, string> = KULLANIM_ONERI.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {}
);

const EMPTY_ILAC: NewIlac = {
  ad: '',
  etkenMadde: '',
  doz: '',
  kullanim: '',
  baslangic: '',
  bitis: '',
  notlar: '',
};

/** API satırlarını (snake_case) UI modeline çevirir. Dizi olmayan payload'da [] döner. */
function normalizeIlaclar(payload: unknown): Ilac[] {
  const raw = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { ilaclar?: unknown }).ilaclar)
      ? (payload as { ilaclar: unknown[] }).ilaclar
      : [];

  return raw.map((item, idx) => normalizeIlac(item, idx));
}

function normalizeIlac(item: unknown, idx = 0): Ilac {
  const r = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? idx),
    ad: String(r.ilac_adi ?? r.ad ?? 'İsimsiz ilaç'),
    etkenMadde: String(r.etken_madde ?? r.etkenMadde ?? ''),
    doz: String(r.doz ?? ''),
    kullanim: String(r.kullanim_sikli ?? r.kullanim ?? ''),
    baslangic: String(r.baslangic_tarihi ?? r.baslangic ?? ''),
    bitis: String(r.bitis_tarihi ?? r.bitis ?? ''),
    notlar: String(r.notlar ?? ''),
    aktif: r.aktif !== false,
  };
}

function formatTarih(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('tr-TR');
}

function tarihAraligi(ilac: Ilac): string {
  const bas = formatTarih(ilac.baslangic);
  const bit = formatTarih(ilac.bitis);
  if (bas && bit) return `${bas} - ${bit}`;
  return bas || bit || 'Tarih belirtilmemiş';
}

export default function DoktorIlaclarPage() {
  const [hastalar, setHastalar] = useState<HastaOption[]>([]);
  const [selectedHastaId, setSelectedHastaId] = useState('');
  const [ilaclar, setIlaclar] = useState<Ilac[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [newIlac, setNewIlac] = useState<NewIlac>(EMPTY_ILAC);
  const [duzenId, setDuzenId] = useState<string | null>(null);
  const [duzenIlac, setDuzenIlac] = useState<NewIlac>(EMPTY_ILAC);

  useEffect(() => {
    let cancelled = false;

    const loadHastalar = async () => {
      try {
        const token = await getAccessTokenAsync();
        if (!token) {
          if (!cancelled) setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
          return;
        }

        const res = await fetch('/api/doktor/hastalar', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (!cancelled) setError('Hasta listesi alınamadı.');
          return;
        }

        const data = await res.json();
        const list = normalizeHastalar(data);
        if (cancelled) return;

        setHastalar(list);
        if (list.length > 0) setSelectedHastaId(list[0].id);
      } catch {
        if (!cancelled) setError('Hasta listesi alınamadı. Bağlantınızı kontrol edin.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHastalar();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchIlaclar = useCallback(async (hastaId: string) => {
    if (!hastaId) {
      setIlaclar([]);
      return;
    }

    try {
      const token = await getAccessTokenAsync();
      const res = await fetch(`/api/doktor/ilaclar?hastaId=${encodeURIComponent(hastaId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setIlaclar([]);
        setError('İlaç listesi alınamadı.');
        return;
      }

      const data = await res.json();
      setIlaclar(normalizeIlaclar(data));
      setError('');
    } catch {
      setIlaclar([]);
      setError('İlaç listesi alınamadı. Bağlantınızı kontrol edin.');
    }
  }, []);

  useEffect(() => {
    fetchIlaclar(selectedHastaId);
  }, [selectedHastaId, fetchIlaclar]);

  const handleInputChange = (field: keyof NewIlac, value: string) => {
    setNewIlac((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddIlac = async () => {
    setError('');
    setInfo('');

    if (!selectedHastaId) {
      setError('Lütfen bir hasta seçin.');
      return;
    }
    if (!newIlac.ad.trim() || !newIlac.etkenMadde.trim() || !newIlac.doz.trim() || !newIlac.baslangic) {
      setError('İlaç adı, etken madde, doz ve başlangıç tarihi zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const token = await getAccessTokenAsync();
      const res = await fetch('/api/doktor/ilaclar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hastaId: selectedHastaId,
          ad: newIlac.ad.trim(),
          etkenMadde: newIlac.etkenMadde.trim(),
          doz: newIlac.doz.trim(),
          kullanim_sikli: newIlac.kullanim,
          baslangic_tarihi: newIlac.baslangic,
          bitis_tarihi: newIlac.bitis || null,
          notlar: newIlac.notlar.trim() || null,
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          payload && typeof payload === 'object' && typeof (payload as { error?: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : 'İlaç eklenemedi.';
        setError(message);
        return;
      }

      const row =
        payload && typeof payload === 'object' && (payload as { ilac?: unknown }).ilac
          ? (payload as { ilac: unknown }).ilac
          : payload;

      setIlaclar((prev) => [normalizeIlac(row, prev.length), ...prev]);
      setNewIlac(EMPTY_ILAC);
      setShowAddForm(false);
      setInfo('İlaç eklendi.');
    } catch {
      setError('İlaç eklenemedi. Bağlantınızı kontrol edin.');
    } finally {
      setSaving(false);
    }
  };

  const updateIlacDurum = async (id: string, aktif: boolean) => {
    setError('');
    setInfo('');
    try {
      const token = await getAccessTokenAsync();
      const res = await fetch(`/api/doktor/ilaclar/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ aktif }),
      });

      if (!res.ok) {
        setError('İlaç durumu güncellenemedi.');
        return;
      }

      setIlaclar((prev) => prev.map((i) => (i.id === id ? { ...i, aktif } : i)));
      setInfo(aktif ? 'İlaç yeniden başlatıldı.' : 'İlaç durduruldu.');
    } catch {
      setError('İlaç durumu güncellenemedi. Bağlantınızı kontrol edin.');
    }
  };

  const duzenAc = (ilac: Ilac) => {
    setDuzenId(ilac.id);
    setDuzenIlac({
      ad: ilac.ad,
      etkenMadde: ilac.etkenMadde,
      doz: ilac.doz,
      kullanim: ilac.kullanim,
      baslangic: (ilac.baslangic || '').slice(0, 10),
      bitis: (ilac.bitis || '').slice(0, 10),
      notlar: ilac.notlar,
    });
    setError('');
    setInfo('');
  };

  const duzenKaydet = async () => {
    if (!duzenId) return;
    setError('');
    setInfo('');
    if (!duzenIlac.ad.trim() || !duzenIlac.doz.trim() || !duzenIlac.kullanim.trim()) {
      setError('İlaç adı, doz ve kullanım sıklığı zorunludur.');
      return;
    }
    setSaving(true);
    try {
      const token = await getAccessTokenAsync();
      const res = await fetch(`/api/doktor/ilaclar/${duzenId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ad: duzenIlac.ad.trim(),
          etkenMadde: duzenIlac.etkenMadde.trim() || duzenIlac.ad.trim(),
          doz: duzenIlac.doz.trim(),
          kullanim_sikli: duzenIlac.kullanim.trim(),
          baslangic_tarihi: duzenIlac.baslangic || undefined,
          bitis_tarihi: duzenIlac.bitis || null,
          notlar: duzenIlac.notlar.trim() || null,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(
          payload && typeof payload === 'object' && typeof (payload as { error?: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : 'İlaç güncellenemedi.',
        );
        return;
      }
      setIlaclar((prev) =>
        prev.map((i) =>
          i.id === duzenId
            ? {
                ...i,
                ad: duzenIlac.ad.trim(),
                etkenMadde: duzenIlac.etkenMadde.trim(),
                doz: duzenIlac.doz.trim(),
                kullanim: duzenIlac.kullanim.trim(),
                baslangic: duzenIlac.baslangic,
                bitis: duzenIlac.bitis,
                notlar: duzenIlac.notlar.trim(),
              }
            : i,
        ),
      );
      setDuzenId(null);
      setInfo('İlaç güncellendi.');
    } catch {
      setError('İlaç güncellenemedi. Bağlantınızı kontrol edin.');
    } finally {
      setSaving(false);
    }
  };

  const deleteIlac = async (id: string) => {
    if (!window.confirm('Bu ilacı silmek istediğinize emin misiniz?')) return;

    setError('');
    setInfo('');
    try {
      const token = await getAccessTokenAsync();
      const res = await fetch(`/api/doktor/ilaclar/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError('İlaç silinemedi.');
        return;
      }

      setIlaclar((prev) => prev.filter((i) => i.id !== id));
      setInfo('İlaç silindi.');
    } catch {
      setError('İlaç silinemedi. Bağlantınızı kontrol edin.');
    }
  };

  const aktifIlaclar = ilaclar.filter((i) => i.aktif);
  const pasifIlaclar = ilaclar.filter((i) => !i.aktif);

  const renderIlacKarti = (ilac: Ilac, pasif: boolean) => (
    <div
      key={ilac.id}
      style={{
        ...toolsCard,
        padding: 16,
        marginBottom: 12,
        opacity: pasif ? 0.72 : 1,
      }}
    >
      {duzenId === ilac.id ? (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <label style={toolsLabel}>İlaç adı *</label>
              <input type="text" value={duzenIlac.ad} onChange={(e) => setDuzenIlac((p) => ({ ...p, ad: e.target.value }))} style={toolsInput} />
            </div>
            <div>
              <label style={toolsLabel}>Etken madde</label>
              <input type="text" value={duzenIlac.etkenMadde} onChange={(e) => setDuzenIlac((p) => ({ ...p, etkenMadde: e.target.value }))} style={toolsInput} />
            </div>
            <div>
              <label style={toolsLabel}>Doz *</label>
              <input type="text" value={duzenIlac.doz} onChange={(e) => setDuzenIlac((p) => ({ ...p, doz: e.target.value }))} style={toolsInput} />
            </div>
            <div>
              <label style={toolsLabel}>Kullanım sıklığı *</label>
              <input
                type="text"
                list="ilaclar-siklik-onerileri-duzen"
                value={duzenIlac.kullanim}
                onChange={(e) => setDuzenIlac((p) => ({ ...p, kullanim: e.target.value }))}
                placeholder="Serbest metin"
                style={toolsInput}
                autoComplete="off"
              />
              <datalist id="ilaclar-siklik-onerileri-duzen">
                {KULLANIM_ONERI.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </datalist>
            </div>
            <div>
              <label style={toolsLabel}>Başlangıç</label>
              <input type="date" value={duzenIlac.baslangic} onChange={(e) => setDuzenIlac((p) => ({ ...p, baslangic: e.target.value }))} style={toolsInput} />
            </div>
            <div>
              <label style={toolsLabel}>Bitiş</label>
              <input type="date" value={duzenIlac.bitis} onChange={(e) => setDuzenIlac((p) => ({ ...p, bitis: e.target.value }))} style={toolsInput} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={toolsLabel}>Notlar</label>
            <textarea value={duzenIlac.notlar} onChange={(e) => setDuzenIlac((p) => ({ ...p, notlar: e.target.value }))} rows={2} style={{ ...toolsInput, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={() => void duzenKaydet()} disabled={saving} style={toolsPrimaryBtn(saving)}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              onClick={() => setDuzenId(null)}
              style={{
                padding: '7px 12px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: 'transparent',
                color: CHROME_RENK.muted,
                border: '1px solid rgba(58,44,34,0.2)',
              }}
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: CHROME_RENK.ink }}>{ilac.ad}</div>
              {ilac.etkenMadde && (
                <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginTop: 2 }}>{ilac.etkenMadde}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <button
                onClick={() => duzenAc(ilac)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 9,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: CHROME_RENK.pine,
                  border: `1px solid ${CHROME_RENK.pine}66`,
                }}
              >
                Düzenle
              </button>
              <button
                onClick={() => updateIlacDurum(ilac.id, pasif)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 9,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: pasif ? '#2E6E4E' : '#7A5B1E',
                  border: `1px solid ${pasif ? 'rgba(46,110,78,0.4)' : 'rgba(122,91,30,0.4)'}`,
                }}
              >
                {pasif ? 'Yeniden Başlat' : 'Durdur'}
              </button>
              <button
                onClick={() => deleteIlac(ilac.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 9,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: CHROME_RENK.warn,
                  border: `1px solid ${CHROME_RENK.warn}66`,
                }}
              >
                Sil
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                background: '#E4F3F1',
                color: CHROME_RENK.pine,
                border: `1px solid ${CHROME_RENK.pine}40`,
                padding: '4px 11px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {[ilac.doz, KULLANIM_ETIKET[ilac.kullanim] || ilac.kullanim].filter(Boolean).join(' • ') ||
                'Doz belirtilmemiş'}
            </span>
            <span style={{ fontSize: 12, color: CHROME_RENK.muted }}>{tarihAraligi(ilac)}</span>
          </div>

          {ilac.notlar && (
            <div style={{ marginTop: 10, fontSize: 13, color: CHROME_RENK.ink, lineHeight: 1.5 }}>{ilac.notlar}</div>
          )}
        </>
      )}
    </div>
  );

  const bolumBasligi = (baslik: string, adet: number, renk: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, color: renk }}>{baslik}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: renk,
          background: '#F6F0E4',
          padding: '2px 9px',
          borderRadius: 9999,
        }}
      >
        {adet}
      </span>
    </div>
  );

  return (
    <div style={toolsShell}>
      <div style={{ maxWidth: 900 }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Doktor</div>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: 0, color: '#2e251d', letterSpacing: '-0.02em' }}>İlaç Yönetimi</h1>
        <p style={{ color: CHROME_RENK.muted, fontSize: 14, margin: '6px 0 20px' }}>
          Hasta ilaçlarını görüntüleyin ve yönetin
        </p>

        <div style={{ ...toolsCard, marginBottom: 16 }}>
          <label style={toolsLabel} htmlFor="hasta-secimi">
            Hasta
          </label>
          <select
            id="hasta-secimi"
            value={selectedHastaId}
            onChange={(e) => setSelectedHastaId(e.target.value)}
            disabled={loading || hastalar.length === 0}
            style={toolsInput}
          >
            {loading && <option value="">Yükleniyor...</option>}
            {!loading && hastalar.length === 0 && <option value="">Hasta bulunamadı</option>}
            {!loading && hastalar.length > 0 && <option value="">Hasta seçin</option>}
            {hastalar.map((h) => (
              <option key={h.id} value={h.id} style={{ background: '#FFFFFF', color: '#000' }}>
                {h.label}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              disabled={!selectedHastaId}
              style={toolsPrimaryBtn(!selectedHastaId)}
            >
              {showAddForm ? 'Formu Kapat' : '+ İlaç Ekle'}
            </button>
          </div>

          {error && <div style={toolsErrorBox}>{error}</div>}
          {info && !error && (
            <div
              style={{
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#E4F3F1',
                border: `1px solid ${CHROME_RENK.pine}55`,
                color: '#2E6E4E',
                fontSize: 13,
              }}
            >
              {info}
            </div>
          )}
        </div>

        {showAddForm && selectedHastaId && (
          <div style={{ ...toolsCard, marginBottom: 16 }}>
            <h2 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 20, margin: '0 0 16px', color: '#2e251d' }}>Yeni İlaç Ekle</h2>
            {/* Picker first: brand from the SGK list, then the pharmacy pack. Fills the fields below. */}
            <div style={{ marginBottom: 14 }}>
              <IlacSecici
                inputStyle={toolsInput}
                labelStyle={toolsLabel}
                onSelect={(s) => setNewIlac((prev) => ({ ...prev, ad: s.ad, etkenMadde: s.etkenMadde || prev.etkenMadde, doz: s.doz || prev.doz }))}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
              }}
            >
              <div>
                <label style={toolsLabel}>Kayıt Adı *</label>
                <input
                  type="text"
                  value={newIlac.ad}
                  onChange={(e) => handleInputChange('ad', e.target.value)}
                  placeholder="Seçimden dolar; düzenlenebilir"
                  style={toolsInput}
                />
              </div>

              <div>
                <label style={toolsLabel}>Etken Madde *</label>
                <input
                  type="text"
                  value={newIlac.etkenMadde}
                  onChange={(e) => handleInputChange('etkenMadde', e.target.value)}
                  placeholder="Parasetamol"
                  style={toolsInput}
                />
              </div>

              <div>
                <label style={toolsLabel}>Doz *</label>
                <input
                  type="text"
                  value={newIlac.doz}
                  onChange={(e) => handleInputChange('doz', e.target.value)}
                  placeholder="500mg"
                  style={toolsInput}
                />
              </div>

              <div>
                <label style={toolsLabel}>Kullanım Sıklığı * <span style={{ fontWeight: 400, color: CHROME_RENK.muted }}>(serbest metin)</span></label>
                <input
                  type="text"
                  list="ilaclar-siklik-onerileri"
                  value={newIlac.kullanim}
                  onChange={(e) => handleInputChange('kullanim', e.target.value)}
                  placeholder="Örn. 2x1, sabah-akşam, lüzumlu halde"
                  style={toolsInput}
                  autoComplete="off"
                />
                <datalist id="ilaclar-siklik-onerileri">
                  {KULLANIM_ONERI.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </datalist>
              </div>

              <div>
                <label style={toolsLabel}>Başlangıç Tarihi *</label>
                <input
                  type="date"
                  value={newIlac.baslangic}
                  onChange={(e) => handleInputChange('baslangic', e.target.value)}
                  style={toolsInput}
                />
              </div>

              <div>
                <label style={toolsLabel}>Bitiş Tarihi (opsiyonel)</label>
                <input
                  type="date"
                  value={newIlac.bitis}
                  onChange={(e) => handleInputChange('bitis', e.target.value)}
                  style={toolsInput}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={toolsLabel}>Notlar</label>
              <textarea
                value={newIlac.notlar}
                onChange={(e) => handleInputChange('notlar', e.target.value)}
                placeholder="Ek notlar..."
                rows={3}
                style={{ ...toolsInput, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <button onClick={handleAddIlac} disabled={saving} style={toolsPrimaryBtn(saving)}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ ...toolsCard, textAlign: 'center', color: CHROME_RENK.muted }}>Yükleniyor...</div>
        ) : !selectedHastaId ? (
          <div style={{ ...toolsCard, textAlign: 'center', color: CHROME_RENK.muted }}>
            {hastalar.length === 0
              ? 'Kayıtlı hasta bulunamadı. Önce hasta ekleyin.'
              : 'Lütfen bir hasta seçin.'}
          </div>
        ) : ilaclar.length === 0 ? (
          <div style={{ ...toolsCard, textAlign: 'center', color: CHROME_RENK.muted }}>
            Bu hasta için henüz ilaç eklenmedi.
          </div>
        ) : (
          <div>
            {aktifIlaclar.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {bolumBasligi('AKTİF İLAÇLAR', aktifIlaclar.length, CHROME_RENK.pine)}
                {aktifIlaclar.map((ilac) => renderIlacKarti(ilac, false))}
              </div>
            )}

            {pasifIlaclar.length > 0 && (
              <div>
                {bolumBasligi('PASİF İLAÇLAR', pasifIlaclar.length, CHROME_RENK.muted)}
                {pasifIlaclar.map((ilac) => renderIlacKarti(ilac, true))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
