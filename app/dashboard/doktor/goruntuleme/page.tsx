'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

interface Patient {
  id: string;
  ad: string;
  soyad: string;
}

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

const MODALITELER = ['X-Ray', 'MRI', 'BT', 'Ultrason', 'EKO', 'PET-BT'];

const MODALITE_COLORS: { [key: string]: string } = {
  'X-Ray': '#3b82f6',
  'MRI': '#a855f7',
  'BT': '#f59e0b',
  'Ultrason': '#22c55e',
  'EKO': '#6b7280',
  'PET-BT': '#6b7280',
};

const Page = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [goruntulemeler, setGoruntulemeler] = useState<Goruntuleme[]>([]);
  const [selectedHastaId, setSelectedHastaId] = useState('');
  const [filterHastaId, setFilterHastaId] = useState('');
  const [selectedGoruntuleme, setSelectedGoruntuleme] = useState<Goruntuleme | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    modalite: 'X-Ray',
    vucut_bolgesi: '',
    tarih: '',
    rapor: '',
    file: null as File | null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [viewerRef, setViewerRef] = useState<HTMLDivElement | null>(null);

  const tok = () => {
    try {
      return JSON.parse(localStorage.getItem('auth-token') || '{}').access_token || '';
    } catch {
      return '';
    }
  };

  const fetchPatients = async () => {
    const token = tok();
    const res = await fetch('/api/doktor/hastalar', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPatients(data);
    }
  };

  const fetchGoruntulemeler = async (hastaId?: string) => {
    const token = tok();
    const url = hastaId
      ? `/api/doktor/goruntuleme?hastaId=${hastaId}`
      : '/api/doktor/goruntuleme';
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setGoruntulemeler(data);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchGoruntulemeler();
  }, []);

  useEffect(() => {
    if (filterHastaId) {
      fetchGoruntulemeler(filterHastaId);
    } else {
      fetchGoruntulemeler();
    }
  }, [filterHastaId]);

  const handleFileSelect = (file: File) => {
    let tur: Goruntuleme['tur'] = 'jpg';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'dcm') tur = 'dicom';
    else if (ext === 'pdf') tur = 'pdf';
    else if (ext === 'png') tur = 'png';
    setUploadData({ ...uploadData, file });
  };

  const handleUpload = async () => {
    if (!uploadData.file || !selectedHastaId) return;
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('hastaId', selectedHastaId);
    formData.append('modalite', uploadData.modalite);
    formData.append('vucut_bolgesi', uploadData.vucut_bolgesi);
    formData.append('tarih', uploadData.tarih);
    formData.append('rapor', uploadData.rapor);
    formData.append('file', uploadData.file);

    const token = tok();

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/doktor/goruntuleme/yukle');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setShowUpload(false);
          setUploadData({ modalite: 'X-Ray', vucut_bolgesi: '', tarih: '', rapor: '', file: null });
          setUploadProgress(0);
          fetchGoruntulemeler(filterHastaId || undefined);
        }
        setIsUploading(false);
      };

      xhr.send(formData);
    } catch {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = tok();
    await fetch(`/api/doktor/goruntuleme/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchGoruntulemeler(filterHastaId || undefined);
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

  return (
    <div style={{ background: '#060C18', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', color: '#fff' }}>
      <DoktorNav />
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: 'calc(100vh - 64px)' }}>
        {/* LEFT SIDEBAR */}
        <div style={{
          width: isMobile ? '100%' : '360px',
          background: 'rgba(255,255,255,0.04)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Goruntuleme arsivi</div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              style={{ background: '#14b8a6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', height: '36px' }}
            >
              Yukle
            </button>
          </div>

          {showUpload && (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
              <select
                value={selectedHastaId}
                onChange={(e) => setSelectedHastaId(e.target.value)}
                style={{ width: '100%', padding: '8px', background: '#111827', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', marginBottom: '12px' }}
              >
                <option value="">Hasta secin</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px' }}>
                {MODALITELER.map(m => (
                  <div
                    key={m}
                    onClick={() => setUploadData({ ...uploadData, modalite: m })}
                    style={{
                      padding: '4px 12px',
                      background: uploadData.modalite === m ? '#14b8a6' : 'rgba(255,255,255,0.08)',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>

              <input
                placeholder="Vucut bolgesi"
                value={uploadData.vucut_bolgesi}
                onChange={(e) => setUploadData({ ...uploadData, vucut_bolgesi: e.target.value })}
                style={{ width: '100%', padding: '8px', background: '#111827', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', marginBottom: '8px' }}
              />
              <input
                type="date"
                value={uploadData.tarih}
                onChange={(e) => setUploadData({ ...uploadData, tarih: e.target.value })}
                style={{ width: '100%', padding: '8px', background: '#111827', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', marginBottom: '8px' }}
              />

              <div
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
                style={{ height: '120px', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', cursor: 'pointer' }}
              >
                {uploadData.file ? uploadData.file.name : 'Dosya surukleyin veya tiklayin (.dcm .jpg .png .pdf)'}
                <input id="file-input" type="file" accept=".dcm,.jpg,.png,.pdf" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              </div>

              <textarea
                placeholder="Rapor metni"
                value={uploadData.rapor}
                onChange={(e) => setUploadData({ ...uploadData, rapor: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px', background: '#111827', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', marginBottom: '12px' }}
              />

              {uploadProgress > 0 && (
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '12px' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#14b8a6', transition: 'width 0.2s' }} />
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={isUploading || !uploadData.file}
                style={{ width: '100%', background: '#14b8a6', color: '#fff', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Yukle
              </button>
            </div>
          )}

          <div style={{ fontSize: '13px', marginBottom: '8px', color: '#9ca3af' }}>Arsiv</div>
          <select
            value={filterHastaId}
            onChange={(e) => setFilterHastaId(e.target.value)}
            style={{ width: '100%', padding: '8px', background: '#111827', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', marginBottom: '12px' }}
          >
            <option value="">Tum hastalar</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>)}
          </select>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredList.map((g) => (
              <div
                key={g.id}
                onClick={() => loadIntoViewer(g)}
                style={{
                  padding: '12px',
                  background: selectedGoruntuleme?.id === g.id ? 'rgba(20,184,166,0.08)' : 'transparent',
                  borderLeft: selectedGoruntuleme?.id === g.id ? '3px solid #14b8a6' : '3px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '4px'
                }}
              >
                <div style={{ background: MODALITE_COLORS[g.modalite] || '#6b7280', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '9999px' }}>{g.modalite}</div>
                <div style={{ flex: 1 }}>
                  <div>{g.vucut_bolgesi}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{g.tarih}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span>↗</span>
                  <span onClick={(e) => { e.stopPropagation(); handleDelete(g.id); }}>🗑</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN VIEWER */}
        <div ref={setViewerRef} style={{ flex: 1, background: '#020812', display: 'flex', flexDirection: 'column' }}>
          {!selectedGoruntuleme ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6b7280' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🩺</div>
              <div>Goruntuleme secin</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>Desteklenen formatlar: DICOM, JPEG, PNG, PDF</div>
            </div>
          ) : selectedGoruntuleme.tur === 'pdf' ? (
            <iframe src={selectedGoruntuleme.dosya_url} style={{ width: '100%', height: '100%', border: 'none' }} />
          ) : selectedGoruntuleme.tur === 'dicom' ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px', maxWidth: '480px', margin: '0 auto' }}>
                <div>Dogrudan DICOM goruntulemesi icin harici DICOM viewer acilacak</div>
                <button
                  onClick={() => window.open(`https://viewer.cornerstonejs.org?file=${encodeURIComponent(selectedGoruntuleme.dosya_url)}`, '_blank')}
                  style={{ marginTop: '24px', background: '#14b8a6', color: '#fff', padding: '14px 32px', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}
                >
                  Cornerstone Viewer'da Ac
                </button>
                <div style={{ marginTop: '24px' }}>
                  <a href={selectedGoruntuleme.dosya_url} download style={{ color: '#14b8a6' }}>DICOM Dosyasini Indir</a>
                </div>
                <div style={{ marginTop: '16px', fontSize: '12px', color: '#6b7280' }}>PACS entegrasyonu Q3 2026 hedeflenmektedir</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ height: '44px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', fontSize: '14px' }}>
                <div style={{ flex: 1 }}>{selectedGoruntuleme.dosya_adi}</div>
                <button onClick={() => handleZoom(0.2)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>+</button>
                <button onClick={() => handleZoom(-0.2)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>-</button>
                <button onClick={handleRotate} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>↻</button>
                <button onClick={handleFullscreen} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>⛶</button>
                <a href={selectedGoruntuleme.dosya_url} download style={{ color: '#fff', textDecoration: 'none' }}>⬇</a>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#020812' }}>
                <img
                  src={selectedGoruntuleme.dosya_url}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s',
                    maxWidth: '92%',
                    maxHeight: '92%',
                    objectFit: 'contain'
                  }}
                  alt="Goruntu"
                />
              </div>
              {selectedGoruntuleme.rapor && (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.04)', margin: '16px', borderRadius: '8px', fontSize: '14px' }}>
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
