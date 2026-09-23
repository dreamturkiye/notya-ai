'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { getAccessTokenAsync, normalizeHastalar, type HastaOption } from '@/lib/doktor/toolsUi';
import { bransGoruntulemeGruplari, imagingDisplayLabel, imagingModalityMeta } from '@/lib/doktor/imagingModalities';
import { bransAnahtari } from '@/lib/specialties/kapsam';
import GeriLink from '@/components/navigasyon/GeriLink';
import { DOKTOR_ANA, hastaDosyaHref, hastaGoruntulemeHref } from '@/lib/doktor/geriNavigasyon';
import type { HastaDosyaSekmeId } from '@/lib/doktor/hastaDosyaSekmeleri';

interface Goruntuleme {
  id: string;
  hastaId: string;
  modalite: string;
  vucut_bolgesi: string;
  tarih: string;
  dosya_adi: string;
  dosya_url: string;
  rapor: string;
  tur: 'dicom' | 'jpg' | 'png' | 'pdf';
}

/**
 * GORUNTULEME-BRANS-SIRALI — hekimin branşındaki sık modaliteler üstte, geri kalan HER modalite "Diğer görüntülemeler"
 * altında. Sıralama, kısıtlama değil: brans-alan-sizmasi kapısı değildir (göz hekimi pre-op EKG yükleyebilmeli).
 * 'Diğer' çipi öncekiyle aynı şekilde gösterilmez (bkz. OPEN: GORUNTULEME-BRANS-SIRALI).
 */
function modaliteGruplari(brans: string | null): { oncelikli: string[]; digerleri: string[] } {
  const g = bransGoruntulemeGruplari(brans);
  const etiket = (ms: typeof g.oncelikli) => ms.filter((m) => m.code !== 'diger').map((m) => m.label);
  return { oncelikli: etiket(g.oncelikli), digerleri: etiket(g.digerleri) };
}

/** OCT / fundus / ön segment — her göz ayrı dosya; vucut_bolgesi = sag|sol|iki. */
function gozGoruntuModalitesiMi(label: string): boolean {
  const t = String(label || '').toLocaleLowerCase('tr-TR');
  return /fundus|göz dibi|oct|ön segment|on segment/.test(t);
}

const GOZ_BOLGE: Array<{ kod: 'sag' | 'sol' | 'iki'; etiket: string }> = [
  { kod: 'sag', etiket: 'OD (sağ)' },
  { kod: 'sol', etiket: 'OS (sol)' },
  { kod: 'iki', etiket: 'OU (iki göz)' },
];

/** Bugünün tarihi Europe/Istanbul — type="date" değeri YYYY-MM-DD. */
function bugunTR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
}

function normalizeGoruntu(row: Record<string, unknown>): Goruntuleme {
  const url = String(row.dosya_url || '');
  const nameFromUrl = url.split('/').pop()?.split('?')[0] || 'görüntü';
  const ext = (nameFromUrl.split('.').pop() || 'jpg').toLowerCase();
  const tur: Goruntuleme['tur'] =
    ext === 'dcm' || ext === 'dicom' ? 'dicom' : ext === 'pdf' ? 'pdf' : ext === 'png' ? 'png' : 'jpg';
  return {
    id: String(row.id || ''),
    hastaId: String(row.patient_id || row.hastaId || ''),
    modalite: String(row.modalite || 'diger'),
    vucut_bolgesi: String(row.vucut_bolgesi || ''),
    tarih: String(row.goruntuleme_tarihi || row.tarih || '').slice(0, 10),
    dosya_adi: String(row.dosya_adi || nameFromUrl),
    dosya_url: url,
    rapor: String(row.rapor_metni || row.rapor || ''),
    tur,
  };
}

const bosUpload = () => ({
  modalite: 'Röntgen',
  vucut_bolgesi: '',
  tarih: bugunTR(),
  rapor: '',
  file: null as File | null,
});

const Page = () => {
  const [patients, setPatients] = useState<HastaOption[]>([]);
  const [goruntulemeler, setGoruntulemeler] = useState<Goruntuleme[]>([]);
  const [selectedHastaId, setSelectedHastaId] = useState('');
  const [filterHastaId, setFilterHastaId] = useState('');
  const [selectedGoruntuleme, setSelectedGoruntuleme] = useState<Goruntuleme | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState(bosUpload);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadHata, setUploadHata] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [viewerRef, setViewerRef] = useState<HTMLDivElement | null>(null);
  const [fromTab, setFromTab] = useState<HastaDosyaSekmeId | null>(null);
  const [doktorBransi, setDoktorBransi] = useState<string | null>(null);

  const chartHastaId = filterHastaId || selectedHastaId;
  const parentGeri = (() => {
    if (fromTab && chartHastaId) {
      const label = fromTab === 'deri' ? '← Deri' : fromTab === 'goz' ? '← Göz' : fromTab === 'gebelik' ? '← Gebelik' : '← Hasta dosyası';
      return { href: hastaDosyaHref(chartHastaId, fromTab), label };
    }
    if (chartHastaId) return { href: hastaGoruntulemeHref(chartHastaId), label: '← Hasta Görüntüleme' };
    return { href: DOKTOR_ANA, label: '← Doktor' };
  })();

  const fetchPatients = async () => {
    const token = await getAccessTokenAsync();
    const res = await fetch('/api/doktor/hastalar', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPatients(normalizeHastalar(data));
    }
  };

  /** Yalnız modalite çiplerinin SIRASI için; başarısızsa varsayılan sıra (hiçbir modalite gizlenmez). */
  const fetchDoktorBransi = async () => {
    try {
      const token = await getAccessTokenAsync();
      const res = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const me = await res.json();
        setDoktorBransi(bransAnahtari(me?.data?.specialty));
      }
    } catch {
      /* sıralama kritik değil */
    }
  };

  const fetchGoruntulemeler = useCallback(async (hastaId?: string) => {
    const token = await getAccessTokenAsync();
    const url = hastaId
      ? `/api/doktor/goruntuleme?hastaId=${encodeURIComponent(hastaId)}`
      : '/api/doktor/goruntuleme';
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const list = (Array.isArray(data) ? data : []).map((r: Record<string, unknown>) => normalizeGoruntu(r));
      setGoruntulemeler(list);
      return list;
    }
    return [] as Goruntuleme[];
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const hid = q.get('hastaId') || '';
    const modaliteQ = q.get('modalite') || '';
    const upload = q.get('upload') === '1';
    const from = q.get('from');
    if (from === 'deri' || from === 'goz' || from === 'gebelik' || from === 'goruntuleme') setFromTab(from);
    void fetchPatients();
    void fetchDoktorBransi();
    if (hid) {
      setSelectedHastaId(hid);
      setFilterHastaId(hid);
    } else {
      void fetchGoruntulemeler();
    }
    if (modaliteQ) {
      const meta = imagingModalityMeta(modaliteQ);
      setUploadData((prev) => ({ ...prev, modalite: meta.label, tarih: prev.tarih || bugunTR() }));
    }
    if (upload) setShowUpload(true);
  }, [fetchGoruntulemeler]);

  useEffect(() => {
    void fetchGoruntulemeler(filterHastaId || undefined);
  }, [filterHastaId, fetchGoruntulemeler]);

  const handleFileSelect = (file: File) => {
    setUploadHata('');
    setUploadData((prev) => ({ ...prev, file, tarih: prev.tarih || bugunTR() }));
  };

  const handleUpload = async () => {
    setUploadHata('');
    if (!selectedHastaId) {
      setUploadHata('Önce hasta seçin.');
      return;
    }
    if (!uploadData.file) {
      setUploadHata('Dosya seçin (.jpg, .png, .pdf, .dcm).');
      return;
    }
    if (!uploadData.tarih) {
      setUploadHata('Tarih gerekli — varsayılan bugün; geçmiş için takvimden seçin.');
      return;
    }
    if (gozGoruntuModalitesiMi(uploadData.modalite) && !['sag', 'sol', 'iki'].includes(uploadData.vucut_bolgesi)) {
      setUploadHata('Fundus / OCT / ön segment için göz seçin: OD (sağ), OS (sol) veya OU.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(8);

    const formData = new FormData();
    formData.append('hastaId', selectedHastaId);
    formData.append('modalite', uploadData.modalite);
    formData.append('vucut_bolgesi', uploadData.vucut_bolgesi || uploadData.file.name.replace(/\.[^.]+$/, ''));
    formData.append('tarih', uploadData.tarih);
    formData.append('rapor', uploadData.rapor);
    formData.append('file', uploadData.file);

    const token = await getAccessTokenAsync();
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 90_000);

    try {
      // Fake progress while waiting — XHR hung without onerror; fetch + timeout surfaces the stall.
      const tick = window.setInterval(() => {
        setUploadProgress((p) => (p >= 90 ? p : p + 4));
      }, 400);

      const res = await fetch('/api/doktor/goruntuleme/yukle', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: ctrl.signal,
      });
      window.clearInterval(tick);
      setUploadProgress(100);

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadHata(j.error || `Yükleme başarısız (${res.status}).`);
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }

      const list = await fetchGoruntulemeler(filterHastaId || selectedHastaId || undefined);
      const yeniId = j.goruntuleme?.id as string | undefined;
      const yeni = (yeniId && list.find((g) => g.id === yeniId)) || list[0] || null;
      if (yeni) {
        setSelectedGoruntuleme(yeni);
        setFilterHastaId(selectedHastaId);
      }
      setShowUpload(false);
      setUploadData(bosUpload());
      setUploadProgress(0);
      setIsUploading(false);
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      setUploadHata(aborted ? 'Yükleme zaman aşımına uğradı (90 sn). Dosya boyutunu kontrol edip tekrar deneyin.' : e instanceof Error ? e.message : 'Yükleme başarısız.');
      setIsUploading(false);
      setUploadProgress(0);
    } finally {
      window.clearTimeout(timer);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu görüntüyü arşivden silmek istediğinize emin misiniz?')) return;
    const token = await getAccessTokenAsync();
    const res = await fetch(`/api/doktor/goruntuleme/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Görüntü silinemedi.');
      return;
    }
    void fetchGoruntulemeler(filterHastaId || undefined);
    if (selectedGoruntuleme?.id === id) setSelectedGoruntuleme(null);
  };

  const loadIntoViewer = (g: Goruntuleme) => {
    setSelectedGoruntuleme(g);
    setZoom(1);
    setRotation(0);
  };

  const handleZoom = (delta: number) => {
    setZoom(Math.max(0.5, Math.min(4, zoom + delta)));
  };

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const handleFullscreen = () => {
    if (viewerRef) {
      viewerRef.requestFullscreen?.();
    }
  };

  const filteredList = filterHastaId
    ? goruntulemeler.filter((g) => g.hastaId === filterHastaId)
    : goruntulemeler;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const bugun = bugunTR();

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', fontFamily: "'Source Sans 3', system-ui, sans-serif", color: '#3b2e24' }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: 'calc(100vh - 64px)' }}>
        <div style={{
          width: isMobile ? '100%' : '360px',
          background: '#F6F0E4',
          borderRight: '1px solid rgba(58,44,34,0.1)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <GeriLink href={parentGeri.href}>{parentGeri.label}</GeriLink>
              <div style={{ fontSize: '16px', fontWeight: 600, marginTop: 6, color: '#3b2e24' }}>Görüntüleme arşivi</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowUpload((v) => !v);
                setUploadHata('');
                setUploadData((prev) => ({ ...prev, tarih: prev.tarih || bugunTR() }));
                if (!selectedHastaId && filterHastaId) setSelectedHastaId(filterHastaId);
              }}
              style={{ background: '#2f4334', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', height: '36px' }}
            >
              Yükle
            </button>
          </div>

          {showUpload && (
            <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', marginBottom: '16px', flexShrink: 0 }}>
              <select
                value={selectedHastaId}
                onChange={(e) => setSelectedHastaId(e.target.value)}
                style={{ width: '100%', padding: '8px', background: '#FFFFFF', color: '#3b2e24', border: '1px solid rgba(58,44,34,0.1)', borderRadius: '6px', marginBottom: '12px' }}
              >
                <option value="">Hasta seçin</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>

              {(() => {
                const { oncelikli, digerleri } = modaliteGruplari(doktorBransi);
                const cip = (m: string) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() =>
                      setUploadData({
                        ...uploadData,
                        modalite: m,
                        vucut_bolgesi: gozGoruntuModalitesiMi(m) ? '' : uploadData.vucut_bolgesi,
                      })
                    }
                    style={{
                      padding: '4px 12px',
                      background: uploadData.modalite === m ? '#2f4334' : 'rgba(58,44,34,0.08)',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      border: 'none',
                      color: '#fff',
                    }}
                  >
                    {m}
                  </button>
                );
                const satir = { display: 'flex', gap: '6px', overflowX: 'auto' as const, marginBottom: '12px' };
                const baslik = { fontSize: 11, color: '#8b7d70', marginBottom: 6 };
                if (oncelikli.length === 0) return <div style={satir}>{digerleri.map(cip)}</div>;
                return (
                  <>
                    <div style={baslik}>Branşınızda sık kullanılanlar</div>
                    <div style={satir}>{oncelikli.map(cip)}</div>
                    <div style={baslik}>Diğer görüntülemeler</div>
                    <div style={satir}>{digerleri.map(cip)}</div>
                  </>
                );
              })()}

              {gozGoruntuModalitesiMi(uploadData.modalite) ? (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#8b7d70', marginBottom: 6 }}>
                    Göz (zorunlu) · sağ ve sol için iki ayrı fotoğraf yükleyin
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {GOZ_BOLGE.map((g) => (
                      <button
                        type="button"
                        key={g.kod}
                        onClick={() => setUploadData({ ...uploadData, vucut_bolgesi: g.kod })}
                        style={{
                          padding: '6px 14px',
                          background: uploadData.vucut_bolgesi === g.kod ? '#2f4334' : 'rgba(58,44,34,0.08)',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none',
                          color: '#fff',
                        }}
                      >
                        {g.etiket}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <input
                  placeholder="Başlık / vücut bölgesi (örn. Akciğer PA)"
                  value={uploadData.vucut_bolgesi}
                  onChange={(e) => setUploadData({ ...uploadData, vucut_bolgesi: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: '#FFFFFF', color: '#3b2e24', border: '1px solid rgba(58,44,34,0.1)', borderRadius: '6px', marginBottom: '8px' }}
                />
              )}
              <label style={{ display: 'block', fontSize: 11, color: '#8b7d70', marginBottom: 4 }}>
                Görüntüleme tarihi <span style={{ color: '#8b7d70' }}>(varsayılan bugün · geçmiş için takvim)</span>
              </label>
              <input
                type="date"
                value={uploadData.tarih || bugun}
                max={bugun}
                onChange={(e) => setUploadData({ ...uploadData, tarih: e.target.value || bugunTR() })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#FFFFFF',
                  color: '#3b2e24',
                  border: '1px solid rgba(58,44,34,0.1)',
                  borderRadius: '6px',
                  marginBottom: '8px',
                }}
              />

              <div
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
                style={{ height: '120px', border: '2px dashed rgba(58,44,34,0.16)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', cursor: 'pointer', padding: 8, textAlign: 'center', fontSize: 13 }}
              >
                {uploadData.file ? uploadData.file.name : 'Dosya sürükleyin veya tıklayın (.dcm .jpg .png .pdf)'}
                <input id="file-input" type="file" accept=".dcm,.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              </div>

              <textarea
                placeholder="Rapor metni"
                value={uploadData.rapor}
                onChange={(e) => setUploadData({ ...uploadData, rapor: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px', background: '#FFFFFF', color: '#3b2e24', border: '1px solid rgba(58,44,34,0.1)', borderRadius: '6px', marginBottom: '12px' }}
              />

              {(uploadProgress > 0 || isUploading) && (
                <div style={{ height: '4px', background: 'rgba(58,44,34,0.1)', borderRadius: '2px', marginBottom: '12px' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#2f4334', transition: 'width 0.2s' }} />
                </div>
              )}

              {uploadHata && (
                <div style={{ fontSize: 12, color: '#a45b3e', marginBottom: 10, lineHeight: 1.4 }}>{uploadHata}</div>
              )}

              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={isUploading}
                style={{
                  width: '100%',
                  background: '#2f4334',
                  color: '#fff',
                  padding: '10px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isUploading ? 'wait' : 'pointer',
                  opacity: isUploading ? 0.7 : 1,
                  fontWeight: 700,
                }}
              >
                {isUploading ? `Yükleniyor… ${uploadProgress}%` : 'Yükle'}
              </button>
            </div>
          )}

          <div style={{ fontSize: '13px', marginBottom: '8px', color: '#8b7d70' }}>Arşiv</div>
          <select
            value={filterHastaId}
            onChange={(e) => {
              setFilterHastaId(e.target.value);
              if (e.target.value) setSelectedHastaId(e.target.value);
            }}
            style={{ width: '100%', padding: '8px', background: '#FFFFFF', color: '#3b2e24', border: '1px solid rgba(58,44,34,0.1)', borderRadius: '6px', marginBottom: '12px' }}
          >
            <option value="">Tüm hastalar</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 120 }}>
            {!filteredList.length && (
              <div style={{ fontSize: 12, color: '#8b7d70', padding: '8px 0' }}>Bu hasta için henüz görüntü yok.</div>
            )}
            {filteredList.map((g) => (
              <div
                key={g.id}
                onClick={() => loadIntoViewer(g)}
                style={{
                  padding: '12px',
                  background: selectedGoruntuleme?.id === g.id ? '#E4F3F1' : 'transparent',
                  borderLeft: selectedGoruntuleme?.id === g.id ? '3px solid #2f4334' : '3px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '4px',
                }}
              >
                <div style={{ background: imagingModalityMeta(g.modalite).color || '#8b7d70', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '9999px' }}>{imagingDisplayLabel(g.modalite)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.vucut_bolgesi || g.dosya_adi}</div>
                  <div style={{ fontSize: '12px', color: '#8b7d70' }}>{g.tarih || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span>↗</span>
                  <span role="button" onClick={(e) => { e.stopPropagation(); void handleDelete(g.id); }}>🗑</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={setViewerRef} style={{ flex: 1, background: '#020812', display: 'flex', flexDirection: 'column' }}>
          {!selectedGoruntuleme ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#8b7d70' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🩺</div>
              <div>Görüntüleme seçin</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>Desteklenen formatlar: DICOM, JPEG, PNG, PDF</div>
            </div>
          ) : selectedGoruntuleme.tur === 'pdf' ? (
            <>
              <div style={{ height: '44px', background: '#F6F0E4', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', fontSize: '14px' }}>
                <button type="button" onClick={() => setSelectedGoruntuleme(null)} style={{ background: 'transparent', border: 'none', color: '#2f4334', cursor: 'pointer', fontWeight: 600, padding: 0 }}>← Geri</button>
                <div style={{ flex: 1, color: '#3b2e24' }}>{selectedGoruntuleme.dosya_adi}</div>
              </div>
              <iframe src={selectedGoruntuleme.dosya_url} style={{ width: '100%', height: '100%', border: 'none' }} title={selectedGoruntuleme.dosya_adi} />
            </>
          ) : selectedGoruntuleme.tur === 'dicom' ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <button type="button" onClick={() => setSelectedGoruntuleme(null)} style={{ background: 'transparent', border: 'none', color: '#2f4334', cursor: 'pointer', fontWeight: 600, marginBottom: 16 }}>← Geri</button>
              <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', maxWidth: '480px', margin: '0 auto' }}>
                <div>Doğrudan DICOM görüntülemesi için harici DICOM viewer açılacak</div>
                <button
                  type="button"
                  onClick={() => window.open(`https://viewer.cornerstonejs.org?file=${encodeURIComponent(selectedGoruntuleme.dosya_url)}`, '_blank')}
                  style={{ marginTop: '24px', background: '#2f4334', color: '#fff', padding: '14px 32px', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
                >
                  Cornerstone Viewer&apos;da Aç
                </button>
                <div style={{ marginTop: '24px' }}>
                  <a href={selectedGoruntuleme.dosya_url} download style={{ color: '#2f4334' }}>DICOM Dosyasını İndir</a>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ height: '44px', background: '#F6F0E4', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', fontSize: '14px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedGoruntuleme(null)}
                  style={{ background: 'transparent', border: 'none', color: '#2f4334', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  ← Geri
                </button>
                <div style={{ flex: 1, color: '#3b2e24' }}>{selectedGoruntuleme.dosya_adi}</div>
                <button type="button" onClick={() => handleZoom(0.2)} style={{ background: 'transparent', border: 'none', color: '#3b2e24', cursor: 'pointer' }}>+</button>
                <button type="button" onClick={() => handleZoom(-0.2)} style={{ background: 'transparent', border: 'none', color: '#3b2e24', cursor: 'pointer' }}>-</button>
                <button type="button" onClick={handleRotate} style={{ background: 'transparent', border: 'none', color: '#3b2e24', cursor: 'pointer' }}>↻</button>
                <button type="button" onClick={handleFullscreen} style={{ background: 'transparent', border: 'none', color: '#3b2e24', cursor: 'pointer' }}>⛶</button>
                <a href={selectedGoruntuleme.dosya_url} download style={{ color: '#3b2e24', textDecoration: 'none' }}>⬇</a>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#020812' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedGoruntuleme.dosya_url}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s',
                    maxWidth: '92%',
                    maxHeight: '92%',
                    objectFit: 'contain',
                  }}
                  alt="Görüntü"
                />
              </div>
              {selectedGoruntuleme.rapor && (
                <div style={{ padding: '16px', background: '#F6F0E4', margin: '16px', borderRadius: '8px', fontSize: '14px' }}>
                  {selectedGoruntuleme.rapor}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
